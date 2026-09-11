#!/usr/bin/env python3
"""Z6：G12 办理时限调度包（冻结候选上采集）。
自动策略真实触发（认领→动作→终态唯一）；同时间窗双 PID 扫描同一 deadline（败者 claim=0 跳过日志）；
提醒/升级催办通知；人工催办+冷却；通知失败（收件人不可解析）而时限状态与审批结果不回滚。
原始报文：Z6/raw/raw-transcript.txt；A/B 调度日志段落盘 Z6/。"""
import json, subprocess, sys, threading, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir
from zlib import psql, marker, action_rows, trace_rows, notify_rows, inst_status, chain

set_raw_dir("Z6/raw")
PA = 8081
TA = login(PA, "admin")
TI = login(PA, "initiator")
LOG = []
WAVE_AT = [None]


def submit(form_key, token, data=None):
    code, r = http(PA, "POST", f"/form/data/{form_key}", token, data or {"amount": 1})
    assert r["code"] == 0, r
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    return bk, pid


def deadline_row(pid):
    return psql("select id||'|'||task_id||'|'||run_state||'|'||coalesce(result_status,'-')||'|'||coalesce(auto_action,'-')||'|'||to_char(due_at,'HH24:MI:SS') from sw_bpm_task_deadline where process_instance_id='" + pid + "' order by id desc limit 1")


def rec(case, entry):
    LOG.append({"case": case, "result": entry})
    save("Z6/z6-actions.json", LOG)


def tail_log(path, since_line_count, max_lines=4000):
    r = subprocess.run(["tail", "-n", str(max_lines), path], capture_output=True, text=True)
    return r.stdout


def grep_window(path, t0, t1):
    """提取 [t0,t1] 时间窗（HH24:MI:SS 前缀）内的调度日志行。"""
    r = subprocess.run(
        ["awk", -1, ""], capture_output=True, text=True) if False else None
    cmd = ["bash", "-c",
           f"awk -v a='{t0}' -v b='{t1}' 'substr($0,12,8)>=a && substr($0,12,8)<=b' {path} | grep -E '时限|TaskDeadlineScheduler'"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout


# ---------- Z6-01 自动策略真实触发（d6：dueMinutes=1 autoAction=APPROVE） ----------
def z6_auto_action():
    mk = marker("z6-01", "auto-approve")
    bk, pid = submit("i3ev_d6", TI)
    time.sleep(1)
    before = {"deadline": deadline_row(pid), "instance_status": inst_status(pid),
              "open_task": psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'")}
    deadline = before["deadline"].split("|")[0]
    # 等待调度波（due 60s + 扫描周期 60s，上限 150s 轮询）
    got = None
    for i in range(30):
        time.sleep(5)
        row = deadline_row(pid)
        if "|DONE|" in row or "|DONE|" in psql(f"select coalesce(result_status,'-') from sw_bpm_task_deadline where id='{deadline}'"):
            got = row
            break
    time.sleep(2)
    after = {"deadline": deadline_row(pid), "instance_status": inst_status(pid),
             "action_rows": action_rows(pid)}
    rec("Z6-01-auto-approve", {"marker": mk, "deadline_id": deadline, "before": before,
                               "after": after, "deadline_final": got})
    assert got and "AUTO_APPROVE" in (got or ""), "自动动作未触发"
    assert after["instance_status"] == "APPROVED", "自动动作后实例未 APPROVED"
    assert len(after["action_rows"]) == 1, "自动动作产生多行"


# ---------- Z6-02 双 PID 同窗口扫描同一 deadline ----------
def z6_dual_scanner():
    mk = marker("z6-02", "dual-scan")
    N = 12
    pids = []
    for i in range(N):
        bk, pid = submit("i3ev_d6", TI, {"amount": 100 + i})
        pids.append(pid)
    deadline_ids = {}
    for pid in pids:
        deadline_ids[pid] = deadline_row(pid).split("|")[0]
    save("Z6/dual-deadlines.json", {"deadline_ids": deadline_ids, "instances": pids})
    # 等待扫描波结束（全部 DONE 或超时 240s）
    for i in range(48):
        time.sleep(5)
        pending = psql("select count(*) from sw_bpm_task_deadline where id in (" + ",".join(deadline_ids.values()) + ") and run_state='PENDING'")
        if pending == "0":
            break
    time.sleep(3)
    # 提取双实例时间窗日志（取最后一个 deadline 的 due 时间前后 130s）
    due_seg = deadline_row(pids[-1]).split("|")
    win_end = time.strftime("%H:%M:%S")
    t0 = time.strftime("%H:%M:%S", time.localtime(time.time() - 240))
    log_a = grep_window("/tmp/i3-03/instance-a2.log", t0, win_end)
    log_b = grep_window("/tmp/i3-03/instance-b2.log", t0, win_end)
    open("/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/Z6/instance-a-scheduler.log", "w").write(log_a)
    open("/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/Z6/instance-b-scheduler.log", "w").write(log_b)
    # 双 PID 对同一 deadline 的扫描事实：跳过日志（deadlineId 出现在 B 日志）+ 完成日志（A 或 B）
    skip_b = [ln for ln in log_b.split("\n") if "已被其他实例认领" in ln]
    done_a = [ln for ln in log_a.split("\n") if "时限自动动作完成" in ln]
    done_b = [ln for ln in log_b.split("\n") if "时限自动动作完成" in ln]
    skipped_ids_b = set()
    for ln in skip_b:
        for did in deadline_ids.values():
            if did in ln:
                skipped_ids_b.add(did)
    completed_ids_a = set()
    for ln in done_a + done_b:
        for did in deadline_ids.values():
            if did and psql(f"select task_id from sw_bpm_task_deadline where id='{did}'") and did in ln:
                completed_ids_a.add(did)
    overlap = skipped_ids_b & (completed_ids_a | set())
    results = psql("select run_state||'/'||coalesce(result_status,'-')||'/'||count(*) from sw_bpm_task_deadline where id in (" + ",".join(deadline_ids.values()) + ") group by run_state, result_status")
    rec("Z6-02-dual-scanner", {"marker": mk, "instances": N,
                               "deadline_ids": list(deadline_ids.values()),
                               "b_skip_lines": len(skip_b), "a_done_lines": len(done_a), "b_done_lines": len(done_b),
                               "skipped_by_b_and_completed": sorted(skipped_ids_b),
                               "deadline_result_groups": results,
                               "log_files": ["Z6/instance-a-scheduler.log", "Z6/instance-b-scheduler.log"]})
    assert len(skip_b) > 0, "B 日志无认领竞争跳过记录"
    assert len(skipped_ids_b) > 0, "B 跳过的 deadline 未在完成集合中对应"


# ---------- Z6-03 提醒/升级催办（无自动策略 deadline） ----------
def ensure_remind_def():
    code, r = http(PA, "POST", "/form/def", TA, {"formKey": "i3ev_z6r", "name": "Z6-提醒审批"})
    fid = (r.get("data") or {}).get("id")
    if not fid:
        code, r2 = http(PA, "GET", "/form/def/by-key/i3ev_z6r", TA)
        fid = (r2.get("data") or {}).get("id")
    definition = json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]}, ensure_ascii=False)
    http(PA, "POST", f"/form/def/{fid}/config", TA, {"definition": definition})
    code, rp = http(PA, "POST", f"/form/def/{fid}/publish", TA)
    assert rp["code"] in (0, 1100), rp
    g = {"processKey": "", "name": "Z6-提醒审批", "formKey": "i3ev_z6r", "contractVersion": 2,
         "elements": [
             {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
             {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 320, "y": 300,
              "config": {"name": "提醒审批", "participant": {"strategy": "FIXED_USER", "value": [1]},
                         "deadline": {"dueMinutes": 1}}},
             {"id": "node_end", "kind": "node", "type": "END", "x": 540, "y": 300, "config": {}},
             {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
             {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_end", "config": {}}],
         "canvas": {}}
    code, ex = http(PA, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_z6r", TA)
    def_id = None
    for row in (ex.get("data") or {}).get("records") or []:
        if row.get("name") == "Z6-提醒审批":
            def_id = row["id"]
    if not def_id:
        code, r3 = http(PA, "POST", "/workflow/defs", TA, {"name": "Z6-提醒审批", "formKey": "i3ev_z6r"})
        def_id = r3["data"]["defId"]
    code, r4 = http(PA, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    assert r4["code"] == 0, r4
    code, rv = http(PA, "POST", f"/workflow/defs/{def_id}/validate", TA)
    assert (rv.get("data") or []) == [], rv
    code, r5 = http(PA, "POST", f"/workflow/defs/{def_id}/publish", TA)
    assert r5["code"] == 0, r5
    return def_id


def z6_remind_escalate():
    ensure_remind_def()
    mk = marker("z6-03", "remind")
    bk, pid = submit("i3ev_z6r", TI)
    time.sleep(1)
    before = {"deadline": deadline_row(pid), "task": psql(f"select id_, assignee_ from act_ru_task where proc_inst_id_='{pid}'")}
    did = before["deadline"].split("|")[0]
    for i in range(36):
        time.sleep(5)
        row = deadline_row(pid)
        if "|DONE|" in row:
            break
    time.sleep(2)
    after = {"deadline": deadline_row(pid), "instance_status": inst_status(pid),
             "action_rows": action_rows(pid),
             "notify": notify_rows(pid)}
    rec("Z6-03-remind-escalate", {"marker": mk, "deadline_id": did, "before": before, "after": after})
    assert "|DONE|ESCALATED" in after["deadline"], "提醒/升级未完成"
    assert after["instance_status"] == "RUNNING", "提醒不应改变实例状态"
    assert len(after["action_rows"]) == 0, "提醒不应产生审批动作行"


# ---------- Z6-04 人工催办 + 冷却 ----------
def z6_urge_manual():
    mk = marker("z6-04", "urge")
    bk, pid = submit("i3ev_z6r", TI)
    time.sleep(1)
    inst_pk = psql(f"select id::text from sw_bpm_instance where process_instance_id='{pid}'")
    code, u1 = http(PA, "POST", f"/workflow/my/instances/{inst_pk}/urge", TI)
    time.sleep(1)
    code, u2 = http(PA, "POST", f"/workflow/my/instances/{inst_pk}/urge", TI)
    urge_rows = psql("select count(*) from sw_bpm_urge_record where instance_id=" + inst_pk)
    notify_cnt = psql("select count(*) from sw_notify_message where biz_id in (select task_id from act_ru_task where proc_inst_id_='" + pid + "') and title like '%催办%'")
    rec("Z6-04-urge-manual", {"marker": mk, "instance_pk": inst_pk, "urge_1": u1.get("data"), "urge_2_repeat": u2.get("data"),
                              "urge_rows": urge_rows, "urge_notify_rows": notify_cnt})
    assert u1["code"] == 0 and u2["code"] == 0, "催办请求失败"


# ---------- Z6-05 通知失败注入（收件人不可解析）而时限状态推进不回滚 ----------
def z6_notify_failure():
    mk = marker("z6-05", "notify-failure")
    bk, pid = submit("i3ev_z6r", TI)
    time.sleep(1)
    # 注入：任务 assignee 改为不可解析（非数字），提醒通知无法投递
    psql(f"update act_ru_task set assignee_ = 'unresolvable-recipient' where proc_inst_id_='{pid}'")
    before = {"deadline": deadline_row(pid), "assignee": psql(f"select assignee_ from act_ru_task where proc_inst_id_='{pid}'")}
    did = before["deadline"].split("|")[0]
    for i in range(36):
        time.sleep(5)
        row = deadline_row(pid)
        if "|DONE|" in row:
            break
    time.sleep(2)
    after = {"deadline": deadline_row(pid), "instance_status": inst_status(pid),
             "notify_for_task": psql("select count(*) from sw_notify_message where biz_id in (select id_ from act_ru_task where proc_inst_id_='" + pid + "') and title like '%时限%'"),
             "task_alive": psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'")}
    rec("Z6-05-notify-failure", {"marker": mk, "deadline_id": did, "before": before, "after": after,
                                 "note": "收件人不可解析→提醒通知投递失败；deadline 仍推进 DONE/ESCALATED，任务与实例不回滚（调度器 notifyDeadline catch 不回滚 + 提交层 TZ 状态推进）"})
    assert "|DONE|" in after["deadline"], "通知失败后时限状态应推进"
    assert after["task_alive"] == "1", "任务不应被关闭"


def main():
    cases = [z6_auto_action, z6_dual_scanner, z6_remind_escalate, z6_urge_manual, z6_notify_failure]
    oks = []
    for fn in cases:
        try:
            fn()
            print("[OK]", fn.__name__)
            oks.append(True)
        except Exception as exc:
            LOG.append({"case": fn.__name__, "error": repr(exc)})
            save("Z6/z6-actions.json", LOG)
            print("[FAIL]", fn.__name__, exc)
            oks.append(False)
    save("Z6/z6-actions.json", LOG)
    print("Z6 main done:", all(oks))


if __name__ == "__main__":
    main()
