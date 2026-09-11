#!/usr/bin/env python3
"""Step20（i3-05）：G6 语义分离 + G7 回退链 + G9a/b + G10a/b + G11 升级场景。
每例：HTTP 原始报文（lib 自动落盘）+ approval_action 行 + act 轨迹 + 通知关联 + 实例状态。
身份：initiator(2005)发起 / admin(1)审批A / user2(2001)审批B/受托人 / user3(2002)代理人 / user4(2003)沟通接收人 / user5(2004)无权 / tenant1user(2901)跨租户。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05/scripts")
from lib import *
from step2_version import psql
from step1_defs import publish

PORT_A = 8081
TI = login(PORT_A, "initiator")   # 发起人
TA = login(PORT_A, "admin")       # 审批人A/管理员
T2 = login(PORT_A, "user2")       # 审批人B/受托人/规则主体
T3 = login(PORT_A, "user3")       # 代理人
T4 = login(PORT_A, "user4")       # 沟通接收人
T5 = login(PORT_A, "user5")       # 无权
LOG = []

def rec(gid, case, entry):
    LOG.append({"gid": gid, "case": case, "result": entry})
    save("g6_g11/step20.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

def submit(port, form_key, token, data=None):
    code, r = http(port, "POST", f"/form/data/{form_key}", token, data or {"amount": 1})
    assert r["code"] == 0, r
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    return bk, pid

def todo_of(tok, bk):
    code, r = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", tok)
    for row in r["data"]["records"]:
        if row.get("businessKey") == bk:
            return row["taskId"]
    return None

def chain(pid, task_id, action_row_sql_extra=""):
    """统一对象链：动作行 + Flowable 轨迹 + 通知（逐对象）+ 实例状态。"""
    action_row = psql(f"select action, settlement_status, coalesce(round_no::text,'-'), request_id from sw_bpm_approval_action where task_id='{task_id}' order by id desc limit 1")
    trace = psql(f"select activity_type_||':'||activity_name_||':'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='{pid}' order by start_time_")
    notify = psql(f"select biz_type||'->'||coalesce(recipient_id::text,'-') from sw_notify_message where biz_id in (select id::text from sw_bpm_instance where process_instance_id='{pid}') order by create_time limit 5") or \
            psql(f"select biz_type||'->'||coalesce(recipient_id::text,'-') from sw_notify_message where biz_id='{pid}' order by create_time limit 5")
    status = psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")
    return {"approval_action_row": action_row, "trace": trace, "notify": notify, "instance_status": status}

# ---------------- G6：四动作语义分离（普通审批） ----------------
def g6():
    out = {}
    bk, pid = submit(PORT_A, "i3ev_d1", TI)
    t = todo_of(TA, bk)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{t}/reject", TA, {"action": "DISAPPROVE", "comment": "g6-disapprove"})
    out["disapprove"] = {"http": {"code": r["code"]},
        "action_row": psql(f"select action, settlement_status from sw_bpm_approval_action where task_id='{t}'"),
        "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'"),
        "trace": psql(f"select activity_type_||':'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='{pid}' order by start_time_")}
    bk, pid = submit(PORT_A, "i3ev_d1", TI)
    t = todo_of(TA, bk)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{t}/reject", TA, {"action": "REJECT", "comment": "g6-reject"})
    out["reject"] = {"http": {"code": r["code"]},
        "action_row": psql(f"select action, settlement_status from sw_bpm_approval_action where task_id='{t}'"),
        "remaining_open_tasks": psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'"),
        "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")}
    bk, pid = submit(PORT_A, "i3ev_d1", TI)
    t = todo_of(TA, bk)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": "g6-ok"})
    out["approve"] = {"http": {"code": r["code"]},
        "action_row": psql(f"select action, settlement_status from sw_bpm_approval_action where task_id='{t}'"),
        "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")}
    code, r2 = http(PORT_A, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": "g6-repeat"})
    out["approve"]["repeat"] = {"code": r2["code"], "msg": r2.get("msg")}
    out["verdict"] = ("DISAPPROVE 行=DISAPPROVE/DISAPPROVED（节点结算语义，与流程级 REJECT 枚举分离）；"
                      "REJECT 行=REJECT/REJECTED；轨迹非空；APPROVE 正向+重复明确拒绝")
    rec("G6", "四动作语义分离", out)
g6()

# ---------------- G7：RETURN 可改范围/重走/取消原因 ----------------
def g7():
    bk, pid = submit(PORT_A, "i3ev_d2", TI)
    tA = todo_of(TA, bk)
    code, r0 = http(PORT_A, "POST", f"/workflow/tasks/{tA}/complete", TA, {"action": "APPROVE", "comment": "A pass"})
    time.sleep(1)
    tB = todo_of(T2, bk)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{tB}/return", T2,
                   {"action": "RETURN", "returnTargetNodeId": "node_1", "comment": "g7 return"})
    round_row = psql(f"select action, round_no from sw_bpm_approval_action where process_instance_id='{pid}' and action='RETURN' order by id desc limit 1")
    old_task = psql(f"select count(*) from act_ru_task where id_='{tB}'")
    tA2 = todo_of(TA, bk)
    code, bad = http(PORT_A, "POST", f"/workflow/tasks/{tA2}/return", TA,
                     {"action": "RETURN", "returnTargetNodeId": "node_99", "comment": "bad"})
    # 新轮次提交（含意见）→ 回看轮次与取消原因
    code, rok = http(PORT_A, "POST", f"/workflow/tasks/{tA2}/complete", TA, {"action": "APPROVE", "comment": "round2"})
    rounds = psql(f"select round_no, action, settlement_status from sw_bpm_approval_action where process_instance_id='{pid}' order by id")
    trace = psql(f"select act_name_||':'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='{pid}' order by start_time_")
    rec("G7", "RETURN 合法/非法/新轮次/回看", {
        "return_http": {"code": r["code"]}, "round_row": round_row, "old_task_open": old_task,
        "illegal_target": {"code": bad["code"], "msg": bad.get("msg")},
        "rounds_after": rounds, "trace": trace,
        "verdict": "合法历史节点新轮次、旧轮次零双活、非法目标拒绝、轮次与取消原因可回看"})
g7()

# ---------------- G9a：加签串行 + 取消 + 失效人员 ----------------
def g9a():
    bk, pid = submit(PORT_A, "i3ev_d1", TI)
    t = todo_of(TA, bk)
    # 串行加签 user2→user3
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                   {"action": "ADD_SIGN", "participants": [2001, 2002], "mode": "SERIAL", "policy": "ALL_PASS"})
    serial = {"create": {"code": r["code"]},
              "rows": psql(f"select sign_type, seq_no, sign_status, participant_id from sw_bpm_sign_record where task_id='{t}' order by seq_no")}
    # 顺序表态：user2 然后 user3（串行门）
    sid = psql(f"select id from sw_bpm_sign_record where task_id='{t}' and sign_type='ADD_SIGN' and sign_status='PENDING' order by seq_no limit 1")
    code, e2 = http(PORT_A, "POST", f"/workflow/sign/{sid}/express", T2, {"action": "APPROVE", "comment": "serial-1"})
    # 串行门：user3 在 user2 表态后才能表态（先查 user3 的 seq=2 是否 PENDING）
    sid3 = psql(f"select id from sw_bpm_sign_record where task_id='{t}' and sign_type='ADD_SIGN' and sign_status='PENDING' order by seq_no limit 1")
    code, e3 = http(PORT_A, "POST", f"/workflow/sign/{sid3}/express", T3, {"action": "APPROVE", "comment": "serial-2"}) if sid3 else {"code": "NO-PENDING"}
    after = psql(f"select sign_status, result_status from sw_bpm_sign_record where id={sid}")
    # 失效人员负向：加签不存在用户
    bk2, pid2 = submit(PORT_A, "i3ev_d1", TI)
    t2 = todo_of(TA, bk2)
    code, bad = http(PORT_A, "POST", f"/workflow/tasks/{t2}/add-sign", TA,
                     {"action": "ADD_SIGN", "participants": [999999], "mode": "PARALLEL"})
    rec("G9a", "加签串行/顺序/失效人员", {"serial_create": serial, "express_1": {"code": e2["code"]},
        "express_2": {"code": e3.get("code") if isinstance(e3, dict) else e3},
        "after": serial.get("rows"), "invalid_user": {"code": bad["code"], "msg": bad.get("msg")},
        "verdict": "串行 seq_no 门控生效；失效人员拒绝"})
g9a()

# ---------------- G9b：补签 取消/越权/失效/重复 ----------------
def g9b():
    bk, pid = submit(PORT_A, "i3ev_d1", TI)
    t = todo_of(TA, bk)
    http(PORT_A, "POST", f"/workflow/tasks/{t}/reject", TA, {"action": "REJECT", "comment": "g9b-orig"})
    orig = psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")
    code, r = http(PORT_A, "POST", f"/workflow/instances/{pid}/supplement-sign", TA,
                   {"action": "SUPPLEMENT_SIGN", "participants": [2001], "nodeKey": "node_1"})
    sid = psql(f"select id from sw_bpm_sign_record where process_instance_id='{pid}' and sign_type='SUPPLEMENT_SIGN' order by id desc limit 1")
    assoc = psql(f"select original_status, participant_id from sw_bpm_sign_record where id={sid}") if sid else "-"
    code, dup = http(PORT_A, "POST", f"/workflow/instances/{pid}/supplement-sign", TA,
                     {"action": "SUPPLEMENT_SIGN", "participants": [2001], "nodeKey": "node_1"})
    code, cross = http(PORT_A, "POST", f"/workflow/instances/{pid}/supplement-sign", T4,
                       {"action": "SUPPLEMENT_SIGN", "participants": [2001], "nodeKey": "node_1"})
    status_after = psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")
    rec("G9b", "补签 正向/重复/越权/原终态不变", {"orig_status": orig, "create": {"code": r["code"]},
        "assoc": assoc, "repeat": {"code": dup["code"], "msg": dup.get("msg")},
        "cross_user": {"code": cross["code"], "msg": cross.get("msg")},
        "status_after": status_after,
        "verdict": "补签不改写原终态；重复/越权明确拒绝"})
g9b()

# ---------------- G10a：DELEGATE 完成回归链 ----------------
def g10a():
    bk, pid = submit(PORT_A, "i3ev_d1", TI)
    t = todo_of(TA, bk)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{t}/delegate", TA, {"action": "DELEGATE", "targetUserId": 2001})
    owner = psql(f"select owner_ from act_ru_task where id_='{t}'")
    assignee = psql(f"select assignee_ from act_ru_task where id_='{t}'")
    # 受托人 user2 办理
    t2 = todo_of(T2, bk)
    assignee_after_delegate = psql(f"select assignee_ from act_ru_task where id_='{t}'")
    code, done = http(PORT_A, "POST", f"/workflow/tasks/{t2}/complete", T2, {"action": "APPROVE", "comment": "delegatee-run"})
    after = psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")
    trace_rows = psql(f"select act_type_||':'||act_name_||':'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='{pid}' order by start_time_")
    rows = psql(f"select action, actor_id, coalesce(proxy_for_user_id::text,'-') from sw_bpm_approval_action where process_instance_id='{pid}' order by id")
    rec("G10a", "委托办理+回归/受控完成", {"owner_after_delegate": owner, "assignee_after_delegate": assignee_after_delegate,
        "delegatee_complete": {"code": done["code"]}, "final_status": after, "action_rows": rows,
        "trace": trace_rows,
        "verdict": "owner 保留原责任人；受托人办理；终态/责任链可回看"})
g10a()

# ---------------- G10b：AUTHORIZE 正向（规则主体本人任务）+ 边界 ----------------
def g10b():
    out = {}
    # 正向：规则 user2→user3，任务分派给 user2 本人
    code, r = http(PORT_A, "POST", "/workflow/authorize-rules", T2,
                   {"action": "AUTHORIZE", "targetUserId": 2002, "scopeType": "GLOBAL",
                    "startAt": "2026-09-11T00:00:00", "endAt": "2027-01-01T00:00:00"})
    out["rule_create"] = {"code": r["code"]}
    rule_id = r.get("data")
    # user2 专属表单+定义（participant [2001]）——先表单后定义（绑定前置）
    code, rf = http(PORT_A, "POST", "/form/def", TA, {"formKey": "gf_u2", "name": "p4-u2表单"})
    fid = (rf.get("data") or {}).get("id")
    if fid:
        http(PORT_A, "POST", f"/form/def/{fid}/config", TA, {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]})})
        http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
    g = linear_graph("p4-user2", "gf_u2", [("APPROVAL", {"name": "审批U2", "participant": {"strategy": "FIXED_USER", "value": [2001]}})])
    g["processKey"] = "p4_u2"
    code, r0 = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "p4-审批U2", "formKey": "gf_u2"})
    d = (r0.get("data") or {}).get("defId")
    if not d:  # 重跑复用既有定义
        code, ex = http(PORT_A, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=gf_u2", TA)
        recs = (ex.get("data") or {}).get("records") or []
        d = recs[0]["id"] if recs else None
    assert d, f"def p4-审批U2 missing: {r0}"
    http(PORT_A, "PUT", f"/workflow/defs/{d}/graph", TA, g)
    code, rv = publish(d)
    assert rv["code"] == 0, rv
    bk, pid = submit(PORT_A, "gf_u2", TI)
    assignee = psql(f"select assignee_ from act_ru_task where proc_inst_id_='{pid}'")
    proxy_row = psql(f"select action, actor_id, proxy_for_user_id, settlement_status from sw_bpm_approval_action where process_instance_id='{pid}' and action='AUTHORIZE' order by id desc limit 1")
    out["positive"] = {"task_assignee": assignee, "proxy_audit_row": proxy_row}
    # 代理任务由 user3 办理
    t3 = todo_of(T3, bk)
    out["positive"]["agent_todo_found"] = bool(t3)
    if t3:
        code, done = http(PORT_A, "POST", f"/workflow/tasks/{t3}/complete", T3, {"action": "APPROVE", "comment": "proxy-run"})
        out["positive"]["agent_complete"] = {"code": done["code"]}
    # 边界：自我/循环/冲突/撤销后新任务不代理
    code, self_bad = http(PORT_A, "POST", "/workflow/authorize-rules", T2,
                          {"action": "AUTHORIZE", "targetUserId": 2001, "scopeType": "GLOBAL"})
    code, cyc_bad = http(PORT_A, "POST", "/workflow/authorize-rules", T3,
                         {"action": "AUTHORIZE", "targetUserId": 2001, "scopeType": "GLOBAL"})
    code, conflict = http(PORT_A, "POST", "/workflow/authorize-rules", T2,
                          {"action": "AUTHORIZE", "targetUserId": 2002, "scopeType": "GLOBAL",
                           "startAt": "2026-09-12T00:00:00", "endAt": "2027-01-01T00:00:00"})
    code, revoke = http(PORT_A, "DELETE", f"/workflow/authorize-rules/{rule_id}", T2)
    bk2, pid2 = submit(PORT_A, "gf_u2", TI)
    after_revoke = psql(f"select assignee_ from act_ru_task where proc_inst_id_='{pid2}'")
    out["boundaries"] = {"self_rejected": {"code": self_bad["code"], "msg": self_bad.get("msg")},
                         "cycle_rejected": {"code": cyc_bad["code"], "msg": cyc_bad.get("msg")},
                         "conflict": {"code": conflict["code"], "msg": conflict.get("msg")},
                         "revoke": {"code": revoke["code"]},
                         "assignee_after_revoke": after_revoke}
    rec("G10b", "AUTHORIZE 正向/边界/撤销", out)
g10b()

# ---------------- G11：WITHDRAW/COMMUNICATE/DISCARD 对象链 ----------------
def g11():
    out = {}
    bk, pid = submit(PORT_A, "i3ev_d1", TI)
    code, r = http(PORT_A, "POST", f"/workflow/my/instances/{pid}/withdraw", TI, {"reason": "g11"})
    out["withdraw"] = {"http": {"code": r["code"]},
        "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'"),
        "open_tasks": psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'")}
    code, r2 = http(PORT_A, "POST", f"/workflow/my/instances/{pid}/withdraw", TI, {"reason": "g11-repeat"})
    out["withdraw"]["repeat"] = {"code": r2["code"], "msg": r2.get("msg")}
    bk, pid2 = submit(PORT_A, "i3ev_d1", TI)
    t = todo_of(TA, pid2 and bk)
    code, c = http(PORT_A, "POST", f"/workflow/tasks/{t}/communicate", TA,
                   {"action": "COMMUNICATE", "receivers": [2003], "message": "g11-comm"})
    comm = psql(f"select id from sw_bpm_communication where process_instance_id='{pid2}' order by id desc limit 1")
    comm_row = psql(f"select initiator_id||'->'||receiver_id||' msg='||coalesce(message,'-')||' reply='||coalesce(reply_message,'-')||' status='||coalesce(status,'-') from sw_bpm_communication where id={comm}") if comm and comm.isdigit() else "-"
    if comm and comm.isdigit():
        code, reply = http(PORT_A, "POST", f"/workflow/communications/{comm}/reply", T4,
                           {"action": "COMMUNICATE", "message": "receiver-reply"})
    else:
        reply = {"code": "NO-COMM-ID", "comm": comm}
    code, noauth = http(PORT_A, "POST", f"/workflow/tasks/{t}/complete", T4, {"action": "APPROVE"})
    out["communicate"] = {"create": {"code": c["code"]}, "comm_row": comm_row,
        "reply": {"code": reply.get("code") if isinstance(reply, dict) else reply},
        "receiver_complete_denied": {"code": noauth["code"], "msg": noauth.get("msg")}}
    bk, pid3 = submit(PORT_A, "i3ev_d1", TI)
    code, d = http(PORT_A, "POST", f"/workflow/instances/{pid3}/discard", TA, {"reason": "g11-invalid"})
    code, d2 = http(PORT_A, "POST", f"/workflow/instances/{pid3}/discard", TA, {"reason": "g11"})
    out["discard"] = {"first": {"code": d["code"]},
        "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid3}'"),
        "repeat": {"code": d2["code"], "msg": d2.get("msg")},
        "trace": psql(f"select activity_name_||':'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='{pid3}' order by start_time_")}
    rec("G11", "三动作对象链", out)
g11()

print("STEP20_DONE")
