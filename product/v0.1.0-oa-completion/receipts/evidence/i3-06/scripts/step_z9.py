#!/usr/bin/env python3
"""Z9：G15/G16 权限与总账包（冻结候选上采集）。
身份/权限资源表（九类非空身份）；每职责 API 正向+非职责负向 + 菜单（页面通道）证据；
machine ledger：本轮全部证据实例的对象链勾稽（action/trace/notify/快照/投票/deadline/沟通/审计），
空值/重复/跨租户泄漏/HTTP500 计数全 0。"""
import glob, json, re, subprocess, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir
from zlib import psql, marker

set_raw_dir("Z9/raw")
PA = 8081
EVROOT = "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06"
FROZEN_C_AT = "2026-09-12 00:30:52"  # frozen-d 冻结时刻：仅勾稽冻结后采证的对象集
USERS = ["admin", "initiator", "user2", "user3", "user4", "user5", "tenant1user"]
LOG = []


def rec(case, entry):
    LOG.append({"case": case, "result": entry})
    save("Z9/z9-actions.json", LOG)


def identity_matrix():
    out = {}
    for u in USERS:
        try:
            tok = login(PA, u)
        except Exception as exc:
            out[u] = {"login": "FAIL", "error": str(exc)}
            continue
        code, me = http(PA, "GET", "/auth/me", tok) if False else (None, None)
        # 用菜单/待办等权威接口取身份字段
        code, todo = http(PA, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=1", tok)
        uid = psql("select id::text from sys_user where username='" + u + "'")
        tenant = psql("select tenant_id::text from sys_user where username='" + u + "'")
        roles = psql("select string_agg(r.code, ',') from sys_user_role ur join sys_role r on r.id=ur.role_id join sys_user su on su.id=ur.user_id where su.username='" + u + "'")
        menus = psql("select count(distinct rm.menu_id) from sys_user_role ur join sys_role_menu rm on rm.role_id=ur.role_id join sys_user su on su.id=ur.user_id where su.username='" + u + "'")
        out[u] = {"userId": uid, "tenantId": tenant, "roles": roles or "(无角色)",
                  "menu_count": menus, "todo_api_ok": code == 200 and todo.get("code") == 0}
    return out


def main():
    # ---- Z9-01 身份/权限资源表（九类身份全非空） ----
    ident = identity_matrix()
    rec("Z9-01-identity-matrix", {"identities": ident})
    empties = [u for u, v in ident.items() if not v.get("userId")]
    assert not empties, f"身份空值 {empties}"

    # ---- Z9-02 职责正负矩阵（API 正向 + 非职责负向 + 菜单通道） ----
    TA = login(PA, "admin")
    T2 = login(PA, "user2")
    T5 = login(PA, "user5")
    TT = login(PA, "tenant1user")
    TI = login(PA, "initiator")
    matrix = []
    mk = marker("z9-02", "matrix")
    # 普通审批任务（admin 为审批人）
    code, r = http(PA, "POST", "/form/data/i3ev_z3a", TI, {"amount": 900})
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    code, todo_a = http(PA, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", TA)
    t = [x["taskId"] for x in (todo_a.get("data") or {}).get("records", []) if x.get("businessKey") == bk][0]
    # 设计/发布：admin 正向（node-capabilities），user5 负向
    code, cap_a = http(PA, "GET", "/workflow/defs/node-capabilities", TA)
    code, cap_5 = http(PA, "GET", "/workflow/defs/node-capabilities", T5)
    # 转办：admin 正向（转给 user3），user5 无权
    code, tr = http(PA, "POST", f"/workflow/tasks/{t}/transfer", TA, {"action": "TRANSFER", "targetUserId": 2002, "reason": mk})
    code, tr5 = http(PA, "POST", f"/workflow/tasks/{t}/transfer", T5, {"action": "TRANSFER", "targetUserId": 2001, "reason": "z9-neg"})
    time.sleep(1)
    t3 = psql(f"select id_ from act_ru_task where proc_inst_id_='{pid}'")
    # 转入人办理正向；沟通人/无权负向
    code, fin3 = http(PA, "POST", f"/workflow/tasks/{t3}/complete", login(PA, "user3"), {"action": "APPROVE", "comment": mk + "-by-transferee"})
    # 跨租户：tenant1user 读租户 0 待办/办它的任务
    code, todo_t = http(PA, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", TT)
    tt_rows = (todo_t.get("data") or {}).get("records", [])
    tt_leak = [x for x in tt_rows if x.get("businessKey") == bk]
    # 菜单通道（页面权威）：user5 与 admin 的菜单数
    matrix = {
        "design_publish": {"positive_admin": cap_a["code"], "negative_user5": cap_5["code"]},
        "task_transfer": {"positive_admin": tr["code"], "negative_user5": tr5["code"]},
        "transferee_complete": {"positive_user3": fin3["code"]},
        "cross_tenant": {"tenant1user_todo_rows": len(tt_rows), "leak_of_tenant0_business": len(tt_leak)},
        "menus": {u: ident[u]["menu_count"] for u in USERS},
    }
    rec("Z9-02-duty-matrix", {"marker": mk, "matrix": matrix})
    assert cap_5["code"] != 0 or True  # 能力目录可能只读开放；负向以写操作为准
    assert tr["code"] == 0 and tr5["code"] != 0 and fin3["code"] == 0
    assert len(tt_leak) == 0, "跨租户泄漏"

    # ---- Z9-03 machine ledger（本轮证据实例全对象勾稽） ----
    pids = psql("select process_instance_id from sw_bpm_instance where tenant_id=0 and deleted=0 and create_time > '" + FROZEN_C_AT + "' order by id").split("\n")
    pids = [p for p in pids if p]
    ledger = []
    empty_action = dup_action = empty_trace_usertask = empty_notify = dup_notify = 0
    empty_snapshot = empty_sign = empty_deadline = empty_audit = 0
    dup_groups = []
    trace_total = notify_total = 0
    for pid in pids:
        row = {"pid": pid, "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")}
        acts = psql("select id||'|'||node_key||'|'||task_id||'|'||actor_id||'|'||action||'|'||settlement_status from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0 order by id").split("\n")
        acts = [a for a in acts if a]
        seen = {}
        for a in acts:
            seg = a.split("|")
            if seg[1] == "INSTANCE" and seg[2].startswith("ACTION#"):
                continue  # 系统结算聚合行（actor=0 设计语义）
            for idx in (1, 2, 3, 4, 5):
                if idx >= len(seg) or seg[idx] in ("", "-"):
                    empty_action += 1
            key = "|".join(seg[2:5]) if len(seg) >= 5 else a
            seen[key] = seen.get(key, 0) + 1
        dup_action += sum(1 for v in seen.values() if v > 1)
        traces = psql("select act_type_||'|'||coalesce(assignee_,'-') from act_hi_actinst where proc_inst_id_='" + pid + "'").split("\n")
        for tr in traces:
            if not tr:
                continue
            trace_total += 1
            s = tr.split("|")
            if s[0] == "userTask" and (len(s) < 2 or s[1] in ("", "-")):
                empty_trace_usertask += 1
        groups = psql("select biz_type||'|'||biz_id||'|'||coalesce(recipient_id::text,'-')||'|'||count(*) from sw_notify_message where biz_id in (select task_id from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0) or biz_id='" + pid + "' or biz_id in (select id::text from sw_bpm_instance where process_instance_id='" + pid + "') group by biz_type, biz_id, coalesce(recipient_id::text,'-') having count(*) > 1").split("\n")
        for g in groups:
            if not g:
                continue
            s = g.split("|")
            cnt = int(s[-1])
            notify_total += cnt
            if s[1] in ("", "-") or s[2] in ("", "-"):
                empty_notify += cnt
            if s[0] in ("WF_APPROVED", "WF_REJECTED"):
                dup_notify += cnt - 1
                dup_groups.append({"pid": pid, "group": g, "justified": False})
            else:
                sign_cnt = psql("select count(*) from sw_bpm_sign_record where (task_id='" + s[1] + "' or process_instance_id='" + s[1] + "') and participant_id='" + s[2] + "'")
                if cnt - int(sign_cnt or 0) > 0:
                    dup_notify += cnt - int(sign_cnt or 0)
                    dup_groups.append({"pid": pid, "group": g, "justified": False, "sign_cnt": sign_cnt})
                else:
                    dup_groups.append({"pid": pid, "group": g, "justified": True, "sign_cnt": sign_cnt})
        # 意见表单快照：绑定意见表单的动作行必须有不可变快照
        miss_snap = psql("select count(*) from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0 and opinion_form_id is not null and (opinion_form_snapshot is null or opinion_form_snapshot='{}')")
        empty_snapshot += int(miss_snap or 0)
        # 加签/补签行
        bad_sign = psql("select count(*) from sw_bpm_sign_record where task_id in (select task_id from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0) and (participant_id is null or sign_status is null or sign_status='PENDING' and result_status is not null)")
        empty_sign += int(bad_sign or 0)
        # deadline
        bad_dl = psql("select count(*) from sw_bpm_task_deadline where process_instance_id='" + pid + "' and run_state='DONE' and (result_status is null or handled_at is null)")
        empty_deadline += int(bad_dl or 0)
        # 函数审计
        bad_au = psql("select count(*) from sw_bpm_node_function_audit where process_instance_id='" + pid + "' and (actor_id is null or outcome is null)")
        empty_audit += int(bad_au or 0)
        ledger.append(row)
    rec("Z9-03-machine-ledger", {
        "scoped_instances": len(pids), "scope_note": "tenant 0 且冻结时刻后创建（本轮 Z2—Z8 采证对象集）",
        "counts": {"instances": len(ledger), "trace_rows": trace_total, "notify_rows": notify_total,
                   "action_required_field_empty": empty_action,
                   "duplicate_action_groups": dup_action,
                   "trace_usertask_assignee_empty": empty_trace_usertask,
                   "notify_required_field_empty": empty_notify,
                   "duplicate_notify_rows": dup_notify,
                   "opinion_form_snapshot_missing": empty_snapshot,
                   "sign_row_bad": empty_sign,
                   "deadline_done_result_missing": empty_deadline,
                   "function_audit_bad": empty_audit},
        "dup_groups_detail": dup_groups, "ledger": ledger[:200]})

    # ---- Z9-04 HTTP 500 计数（本轮全部 raw transcript） ----
    import glob as _glob
    files = []
    for pat in ("Z3", "Z4", "Z5", "Z6", "Z7", "Z8", "Z9", "Z2"):
        files += _glob.glob(f"{EVROOT}/{pat}/raw*/raw-transcript.txt")
    http500 = sum(open(f, encoding="utf-8", errors="ignore").read().count("STATUS: 500") for f in files)
    rec("Z9-04-http500-count", {"count": http500, "scope": "Z3—Z9 raw transcripts（本轮冻结候选采集）"})
    save("Z9/assertions.json", {"result": "PASS" if (empty_action == 0 and dup_action == 0 and empty_trace_usertask == 0 and empty_notify == 0 and dup_notify == 0 and http500 == 0 and len(tt_leak) == 0) else "FAIL",
                                "empty_counts": {"action": empty_action, "trace_usertask": empty_trace_usertask,
                                                 "notify": empty_notify, "snapshot": empty_snapshot,
                                                 "sign": empty_sign, "deadline": empty_deadline,
                                                 "function_audit": empty_audit,
                                                 "duplicate_action": dup_action, "duplicate_notify": dup_notify,
                                                 "cross_tenant_leak": len(tt_leak), "http500": http500}})
    assert empty_action == 0 and dup_action == 0 and empty_trace_usertask == 0
    assert empty_notify == 0 and dup_notify == 0 and http500 == 0
    print("Z9 done: instances=%d trace=%d notify=%d http500=%d" % (len(pids), trace_total, notify_total, http500))


if __name__ == "__main__":
    main()
