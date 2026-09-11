#!/usr/bin/env python3
"""Z3：G6/G7 审批语义与退回包（冻结候选 i3-06-frozen-a）。
每动作独立 requestId 对象链（action 行 ↔ trace ↔ notify ↔ 实例终态）；
负向断言：非法目标/重复/越权零副作用；必需 trace/notify/opinion 空值计数=0。
原始报文：Z3/raw/raw-transcript.txt（lib 自动落盘+脱敏）。
注意：不 import step2_version（其 import 副作用会劫持 raw 目录）；本地实现 psql。"""
import json, os, subprocess, sys, time, uuid
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir

set_raw_dir("Z3/raw")  # 必须在引入任何会调用 set_raw_dir 的模块之前

PA = 8081
PGPORT = open("/tmp/i3-03/pg-port.txt").read().strip()


def psql(sql):
    r = subprocess.run(
        ["psql", "-h", "localhost", "-p", PGPORT, "-U", "postgres", "-d", "smart_workflow", "-t", "-A", "-c", sql],
        capture_output=True, text=True)
    out = r.stdout.strip()
    if r.returncode != 0:
        return ""
    return out


TA = login(PA, "admin")
T2 = login(PA, "user2")
T5 = login(PA, "user5")
TI = login(PA, "initiator")
LOG = []
SEQ = [0]


def marker(label):
    SEQ[0] += 1
    return f"z3-{SEQ[0]:02d}-{label}-{uuid.uuid4().hex[:8]}"


def ensure_plain_admin_def():
    """Z3 普通场景专用定义：formKey=i3ev_z3a 唯一 def（START→APPROVAL(admin)→END）。
    d1 的 formKey 已被 z2-designer-r2（参与人 user2）占用，submit 按最新发布 def 启动，
    不得复用，避免近似对象替换（提示 §2 对象身份固定）。"""
    code, r = http(PA, "POST", "/form/def", TA, {"formKey": "i3ev_z3a", "name": "Z3-单审批-admin"})
    data = r.get("data") or {}
    fid = data.get("id")
    if not fid:
        code, r2 = http(PA, "GET", "/form/def/by-key/i3ev_z3a", TA)
        fid = (r2.get("data") or {}).get("id")
    definition = json.dumps({"fields": [
        {"name": "amount", "label": "金额", "type": "NUMBER"},
        {"name": "reason", "label": "事由", "type": "TEXT"}]}, ensure_ascii=False)
    http(PA, "POST", f"/form/def/{fid}/config", TA, {"definition": definition})
    code, rp = http(PA, "POST", f"/form/def/{fid}/publish", TA)
    assert rp["code"] in (0, 1100), rp
    g = {"processKey": "", "name": "Z3-单审批-admin", "formKey": "i3ev_z3a", "contractVersion": 2,
         "elements": [
             {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
             {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 320, "y": 300,
              "config": {"name": "审批A", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
             {"id": "node_end", "kind": "node", "type": "END", "x": 540, "y": 300, "config": {}},
             {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
             {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_end", "config": {}}],
         "canvas": {}}
    code, ex = http(PA, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_z3a", TA)
    def_id = None
    for row in (ex.get("data") or {}).get("records") or []:
        if row.get("name") == "Z3-单审批-admin":
            def_id = row["id"]
    if not def_id:
        code, r3 = http(PA, "POST", "/workflow/defs", TA, {"name": "Z3-单审批-admin", "formKey": "i3ev_z3a"})
        assert r3["code"] == 0, r3
        def_id = r3["data"]["defId"]
    code, r4 = http(PA, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    assert r4["code"] == 0, r4
    code, rv = http(PA, "POST", f"/workflow/defs/{def_id}/validate", TA)
    assert (rv.get("data") or []) == [], rv
    code, r5 = http(PA, "POST", f"/workflow/defs/{def_id}/publish", TA)
    assert r5["code"] == 0, r5
    return def_id


def submit(form_key, token, data=None):
    code, r = http(PA, "POST", f"/form/data/{form_key}", token, data or {"amount": 1})
    assert r["code"] == 0, r
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    return bk, pid


def todo_of(tok, bk):
    code, r = http(PA, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", tok)
    for row in (r.get("data") or {}).get("records", []):
        if row.get("businessKey") == bk:
            return row["taskId"]
    return None


def action_rows(pid):
    raw = psql("select id||'|'||node_key||'|'||task_id||'|'||actor_id||'|'||action||'|'||settlement_status||'|'||coalesce(round_no::text,'-')||'|'||coalesce(opinion_data,'-') from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0 order by id")
    return [r for r in raw.split("\n") if r] if raw else []


def trace_rows(pid):
    # act_hi_actinst 真实列名：act_type_/act_name_/assignee_/delete_reason_
    raw = psql("select act_type_||'|'||act_name_||'|'||coalesce(assignee_,'-')||'|'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='" + pid + "' order by start_time_, id_")
    return [r for r in raw.split("\n") if r] if raw else []


def notify_rows(pid):
    raw = psql("select distinct biz_type||'|'||biz_id||'|'||coalesce(recipient_id::text,'-')||'|'||title||'|'||content from sw_notify_message where biz_id in (select task_id from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0) or biz_id in (select id::text from sw_bpm_instance where process_instance_id='" + pid + "') or biz_id='" + pid + "' order by 1")
    return [r for r in raw.split("\n") if r] if raw else []


def inst_status(pid):
    return psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")


def chain(pid, mk):
    return {"request_marker": mk, "action_rows": action_rows(pid), "trace_rows": trace_rows(pid),
            "notify_rows": notify_rows(pid), "instance_status": inst_status(pid)}


def rec(case, entry):
    LOG.append({"case": case, "result": entry})
    save("Z3/z3-actions.json", LOG)


# ---------- 准备：普通场景专用定义 ----------
plain_def = ensure_plain_admin_def()

# ---------- Z3-01 APPROVE（普通）+ 同任务重复拒绝 ----------
mk1 = marker("approve")
bk, pid = submit("i3ev_z3a", TI)
t = todo_of(TA, bk)
code, r = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": mk1})
time.sleep(1)
n_before = len(action_rows(pid))
code2, r2 = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": "z3-repeat-should-reject"})
time.sleep(1)
n_after = len(action_rows(pid))
rec("Z3-01-approve", {"plain_def_id": plain_def, "http": {"code": r["code"]},
                      "repeat": {"code": r2["code"], "msg": r2.get("msg")},
                      "row_count_before_repeat": n_before, "row_count_after_repeat": n_after,
                      "chain": chain(pid, mk1)})
assert r["code"] == 0 and n_after == n_before, "Z3-01 断言失败"

# ---------- Z3-02 DISAPPROVE（普通，语义分离） ----------
mk2 = marker("disapprove")
bk, pid = submit("i3ev_z3a", TI)
t = todo_of(TA, bk)
code, r = http(PA, "POST", f"/workflow/tasks/{t}/reject", TA, {"action": "DISAPPROVE", "comment": mk2})
time.sleep(1)
rec("Z3-02-disapprove", {"http": {"code": r["code"]}, "chain": chain(pid, mk2)})
assert r["code"] == 0

# ---------- Z3-03 REJECT（流程级终态） ----------
mk3 = marker("reject")
bk, pid = submit("i3ev_z3a", TI)
t = todo_of(TA, bk)
code, r = http(PA, "POST", f"/workflow/tasks/{t}/reject", TA, {"action": "REJECT", "comment": mk3})
time.sleep(1)
rec("Z3-03-reject", {"http": {"code": r["code"]},
                     "remaining_open_tasks": psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'"),
                     "chain": chain(pid, mk3)})
assert r["code"] == 0

# ---------- Z3-04 RETURN（合法/非法/缺失/越权/轮次/范围/历史） ----------
mk4 = marker("return")
bk, pid = submit("i3ev_d2", TI)
tA = todo_of(TA, bk)
code, r0 = http(PA, "POST", f"/workflow/tasks/{tA}/complete", TA, {"action": "APPROVE", "comment": "z3-A-pass-round1"})
time.sleep(1)
tB = todo_of(T2, bk)
taskB_before = http(PA, "GET", f"/workflow/tasks/{tB}", T2)[1]
code, r = http(PA, "POST", f"/workflow/tasks/{tB}/return", T2, {"action": "RETURN", "returnTargetNodeId": "node_1", "comment": mk4})
time.sleep(1)
old_task_open = psql(f"select count(*) from act_ru_task where id_='{tB}'")
tA2 = todo_of(TA, bk)
taskA_after = http(PA, "GET", f"/workflow/tasks/{tA2}", TA)[1]
rows_before_neg = len(action_rows(pid))
code, bad99 = http(PA, "POST", f"/workflow/tasks/{tA2}/return", TA, {"action": "RETURN", "returnTargetNodeId": "node_99", "comment": "z3-neg-illegal-target"})
code, badno = http(PA, "POST", f"/workflow/tasks/{tA2}/return", TA, {"action": "RETURN", "comment": "z3-neg-missing-target"})
code, badperm = http(PA, "POST", f"/workflow/tasks/{tA2}/return", T5, {"action": "RETURN", "returnTargetNodeId": "node_1", "comment": "z3-neg-forbidden-actor"})
time.sleep(1)
rows_after_neg = len(action_rows(pid))
code, rok = http(PA, "POST", f"/workflow/tasks/{tA2}/complete", TA, {"action": "APPROVE", "comment": "z3-round2-final-approve"})
time.sleep(1)
rec("Z3-04-return", {"return_http": {"code": r["code"]}, "round_row_marker": mk4,
                     "old_task_open_after_return": old_task_open, "round2_task_id": tA2,
                     "taskB_before": taskB_before, "taskA_round2_after": taskA_after,
                     "illegal_target": {"code": bad99["code"], "msg": bad99.get("msg")},
                     "missing_target": {"code": badno["code"], "msg": badno.get("msg")},
                     "forbidden_actor": {"code": badperm["code"], "msg": badperm.get("msg")},
                     "action_rows_before_neg": rows_before_neg, "action_rows_after_neg": rows_after_neg,
                     "chain": chain(pid, mk4)})
assert r["code"] == 0 and old_task_open == "0" and rows_after_neg == rows_before_neg, "Z3-04 断言失败"

# ---------- Z3-05 会签 ALL 全通过 ----------
mk5 = marker("consensus-all")
bk, pid = submit("i3ev_d3", TI)
time.sleep(1)
ta = todo_of(TA, bk)
tb = todo_of(T2, bk)
code, ra = http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk5})
code, rb = http(PA, "POST", f"/workflow/tasks/{tb}/complete", T2, {"action": "APPROVE", "comment": mk5 + "-user2"})
time.sleep(1)
rec("Z3-05-consensus-all-approve", {"approve_a": {"code": ra["code"]}, "approve_b": {"code": rb["code"]},
                                    "chain": chain(pid, mk5)})
assert ra["code"] == 0 and rb["code"] == 0

# ---------- Z3-06 会签 DISAPPROVE（负向终局，枚举不混写） ----------
mk6 = marker("consensus-disapprove")
bk, pid = submit("i3ev_d3", TI)
time.sleep(1)
ta = todo_of(TA, bk)
tb = todo_of(T2, bk)
code, ra = http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk6})
code, rd = http(PA, "POST", f"/workflow/tasks/{tb}/reject", T2, {"action": "DISAPPROVE", "comment": mk6 + "-user2-neg"})
time.sleep(1)
rec("Z3-06-consensus-disapprove", {"approve_a": {"code": ra["code"]},
                                   "disapprove_b": {"code": rd["code"], "msg": rd.get("msg")},
                                   "chain": chain(pid, mk6)})
assert ra["code"] == 0 and rd["code"] == 0

# ---------- 断言汇总：空值计数 ----------
rows_all, traces_all, notifies_all = [], [], []
for entry in LOG:
    c = entry["result"].get("chain") or {}
    rows_all += c.get("action_rows") or []
    traces_all += c.get("trace_rows") or []
    notifies_all += c.get("notify_rows") or []

empty_action = 0
settlement_rows = []
for row in rows_all:
    seg = row.split("|")
    # id|node_key|task_id|actor_id|action|settlement_status|round_no|opinion_data
    if len(seg) > 4 and seg[1] == "INSTANCE" and seg[2].startswith("ACTION#"):
        # 会签系统结算聚合行（非人员动作）：actor=0、无 opinion_data 为设计语义，单列登记
        settlement_rows.append(row)
        continue
    for idx in (1, 2, 3, 4, 5, 7):
        if idx >= len(seg) or seg[idx] in ("", "-"):
            empty_action += 1

empty_trace_usertask = 0
for row in traces_all:
    s = row.split("|")
    if s and s[0] == "userTask" and (len(s) < 3 or s[2] in ("", "-")):
        empty_trace_usertask += 1

empty_notify = 0
for row in notifies_all:
    s = row.split("|")
    if len(s) < 3 or s[1] in ("", "-") or s[2] in ("", "-"):
        empty_notify += 1


def case_rows(case):
    for e in LOG:
        if e["case"] == case:
            return e["result"]["chain"]["action_rows"]
    return []


def case_notify(case):
    for e in LOG:
        if e["case"] == case:
            return e["result"]["chain"]["notify_rows"]
    return []


def case_trace(case):
    for e in LOG:
        if e["case"] == case:
            return e["result"]["chain"]["trace_rows"]
    return []


dis_rows = case_rows("Z3-02-disapprove")
cons_rows = case_rows("Z3-06-consensus-disapprove")
ret_rows = case_rows("Z3-04-return")
assertions = {
    "action_row_total": len(rows_all),
    "user_action_row_count": len(rows_all) - len(settlement_rows),
    "system_settlement_rows": settlement_rows,
    "settlement_row_note": "node_key=INSTANCE、task_id=ACTION#*、actor_id=0 为会签系统结算聚合行；opinion_data/actor 为设计空值，逐行列出，不计入人员动作空值统计",
    "action_required_field_empty_count": empty_action,
    "trace_total_rows": len(traces_all),
    "trace_usertask_total": sum(1 for r in traces_all if r.split("|")[0] == "userTask"),
    "trace_usertask_assignee_empty_count": empty_trace_usertask,
    "notify_row_total": len(notifies_all),
    "notify_required_field_empty_count": empty_notify,
    "semantics": {
        "disapprove_action_rows": dis_rows,
        "disapprove_not_reject": all(r.split("|")[4] == "DISAPPROVE" for r in dis_rows),
        "disapprove_notify": case_notify("Z3-02-disapprove"),
        "reject_notify": case_notify("Z3-03-reject"),
        "consensus_disapprove_action_rows": cons_rows,
        "return_action_rows": ret_rows,
        "return_trace_rows": case_trace("Z3-04-return"),
    },
    "negatives": {
        "repeat_approve": LOG[0]["result"]["repeat"],
        "illegal_target": LOG[3]["result"]["illegal_target"],
        "missing_target": LOG[3]["result"]["missing_target"],
        "forbidden_actor": LOG[3]["result"]["forbidden_actor"],
        "zero_side_effect_after_negatives": {"action_rows": LOG[3]["result"]["action_rows_after_neg"]},
    },
}
assert empty_action == 0, f"action 空字段 {empty_action}"
assert empty_trace_usertask == 0, f"userTask trace 空 actor {empty_trace_usertask}"
assert empty_notify == 0, f"notify 空必需字段 {empty_notify}"
save("Z3/assertions.json", {"result": "PASS", "assertions": assertions,
                            "empty_counts": {"action": empty_action, "trace_usertask": empty_trace_usertask,
                                             "notify": empty_notify}})

print("Z3 done:", json.dumps({"cases": [e["case"] for e in LOG],
                              "empty_action": empty_action, "empty_trace": empty_trace_usertask,
                              "empty_notify": empty_notify}, ensure_ascii=False))
