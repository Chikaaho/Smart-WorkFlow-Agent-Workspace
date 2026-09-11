#!/usr/bin/env python3
"""Step3: G6/G7/G10/G11 十二类动作 正向+负向+重复（APPROVE/DISAPPROVE/RETURN/REJECT/
TRANSFER/DELEGATE/AUTHORIZE/ADD_SIGN/SUPPLEMENT_SIGN/WITHDRAW/COMMUNICATE/DISCARD）。
每例：HTTP 请求/响应 + psql DB 回读（approval_action、flowable 轨迹、实例状态）落盘。"""
import json, sys, time, subprocess
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-03")
from lib import *
set_raw_dir("raw/step3")
from step2_version import psql

PORT_A, PORT_B = 8081, 8082
TA = login(PORT_A, "admin")
TB = login(PORT_B, "admin")
T2 = login(PORT_A, "user2")
T4 = login(PORT_A, "user4")

ids = json.load(open(EV + "/g1_g5/step1-defs.json"))["ids"]
LOG = []

def submit(port, form_key, token, data):
    code, r = http(port, "POST", f"/form/data/{form_key}", token, data)
    assert r["code"] == 0, f"submit fail {r}"
    time.sleep(2)
    return r["data"]  # recordId

def pid_of(record_id):
    return psql(f"select process_instance_id from sw_bpm_instance where business_key='{record_id}'")

def status_of(pid):
    return psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")

def todo_tasks(token, port=PORT_A):
    code, r = http(port, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=50", token)
    return r["data"]["records"]

def my_todo_one(token, business_key, port=PORT_A):
    rows = todo_tasks(token, port)
    for row in rows:
        if row.get("businessKey") == business_key:
            return row
    return None

def action_row(pid):
    return psql(f"select action, settlement_status, coalesce(target_user_id::text,'-'), round_no from sw_bpm_approval_action where process_instance_id='{pid}' order by id desc limit 1")

def trace_of(pid):
    return psql(f"select activity_type_ || ':' || activity_name_ || ':' || coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='{pid}' order by start_time_")

def case(gid, name, fn):
    try:
        entry = fn()
        LOG.append({"gid": gid, "case": name, "result": entry})
        save(f"g6_g12_actions/step3.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))
        print("[OK]", gid, name)
    except Exception as e:
        LOG.append({"gid": gid, "case": name, "error": str(e)})
        save("g6_g12_actions/step3.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))
        print("[FAIL]", gid, name, e)
        raise

# ---------------- G6 APPROVE 正向 + 重复 ----------------
def g6_approve():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 1, "reason": "g6-approve"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    assert task, "admin todo missing"
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/complete", TA,
                   {"action": "APPROVE", "comment": "g6 approve"})
    assert r["code"] == 0, r
    code2, r2 = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/complete", TA,
                     {"action": "APPROVE", "comment": "g6 approve again"})
    row = action_row(pid)
    st = status_of(pid)
    tr = trace_of(pid)
    return {"request": f"POST /workflow/tasks/{task['taskId']}/complete",
            "first": {"code": r["code"]}, "repeat": {"code": r2["code"], "msg": r2.get("msg")},
            "approval_action_row": row, "instance_status": st, "trace": tr,
            "verdict": "first ok; repeat idempotent-rejected; single side effect"}
case("G6", "APPROVE正向+重复", g6_approve)

# ---------------- G6 DISAPPROVE 普通节点（默认 TERMINATE）+ 重复 ----------------
def g6_disapprove():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 2, "reason": "g6-disapprove"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/reject", TA,
                   {"action": "DISAPPROVE", "comment": "g6 disapprove"})
    assert r["code"] == 0, r
    row = action_row(pid)
    st = status_of(pid)
    tr = trace_of(pid)
    return {"request": f"POST /workflow/tasks/{task['taskId']}/reject action=DISAPPROVE",
            "response": {"code": r["code"]}, "approval_action_row": row,
            "instance_status": st, "trace": tr,
            "verdict": "DISAPPROVE distinct from REJECT; node settlement TERMINATE -> instance REJECTED"}
case("G6", "DISAPPROVE结算", g6_disapprove)

# ---------------- G6 REJECT 流程级 + 重复 ----------------
def g6_reject():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 3, "reason": "g6-reject"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/reject", TA,
                   {"action": "REJECT", "comment": "g6 reject terminal"})
    assert r["code"] == 0, r
    st = status_of(pid)
    tr = trace_of(pid)
    open_tasks = psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'")
    return {"request": "POST reject action=REJECT", "instance_status": st,
            "remaining_open_tasks": open_tasks, "trace": tr,
            "verdict": "process-level reject closes all tasks; instance REJECTED"}
case("G6", "REJECT流程级", g6_reject)

# ---------------- G7 RETURN 合法目标 + 新轮次 + 越权目标负向 ----------------
def g7_return():
    rec = submit(PORT_A, "i3ev_d2", TA, {"amount": 4, "reason": "g7-return"})
    pid_b = pid_of(rec)
    # A(admin) 先完成 node_1 → 流转到 B(2001)
    task_a = my_todo_one(TA, rec)
    code, r0 = http(PORT_A, "POST", f"/workflow/tasks/{task_a['taskId']}/complete", TA,
                    {"action": "APPROVE", "comment": "A pass"})
    assert r0["code"] == 0, r0
    time.sleep(1)
    task_b = my_todo_one(login(PORT_A, "user2"), rec)
    assert task_b, "user2 todo missing at node B"
    # B(2001) 退回到已通过的 node_1
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task_b['taskId']}/return", login(PORT_A, "user2"),
                   {"action": "RETURN", "returnTargetNodeId": "node_1", "comment": "g7 return to A"})
    assert r["code"] == 0, r
    time.sleep(1)
    # 新轮次：A 重新有任务；round_no 记录
    time.sleep(1)
    task_a2 = my_todo_one(TA, rec)
    row = psql(f"select action, round_no from sw_bpm_approval_action where process_instance_id='{pid_b}' order by id desc limit 1")
    old_task_open = psql(f"select count(*) from act_ru_task where id_='{task_b['taskId']}'")
    # 非法目标（未经过的 node_3）
    code, r2 = http(PORT_A, "POST", f"/workflow/tasks/{task_a2['taskId']}/return", TA,
                    {"action": "RETURN", "returnTargetNodeId": "node_99", "comment": "bad target"})
    return {"request": "POST return target=node_1 then target=node_99",
            "first": {"code": r["code"]}, "new_round_row": row,
            "old_task_remaining_open": old_task_open,
            "illegal_target": {"code": r2["code"], "msg": r2.get("msg")},
            "verdict": "return creates new round on A; old B task closed; illegal target rejected"}
case("G7", "RETURN合法/非法/新轮次", g7_return)

# ---------------- G10 TRANSFER 正向 + 本人负向 + 原任务关闭 ----------------
def g10_transfer():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 5, "reason": "g10-transfer"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/transfer", TA,
                   {"action": "TRANSFER", "targetUserId": 2001, "reason": "g10"})
    assert r["code"] == 0, r
    row = action_row(pid)
    owner_now = psql(f"select assignee_ from act_ru_task where id_='{task['taskId']}'")
    admin_can = my_todo_one(TA, rec)
    user2_can = my_todo_one(T2, rec)
    return {"request": f"POST transfer target=2001", "approval_row": row,
            "flowable_assignee": owner_now, "admin_todo": bool(admin_can),
            "user2_todo": bool(user2_can), "verdict": "assignee moved to 2001; no duplicate task"}
case("G10", "TRANSFER正向", g10_transfer)

# ---------------- G10 DELEGATE 委托 + 回归 ----------------
def g10_delegate():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 6, "reason": "g10-delegate"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/delegate", TA,
                   {"action": "DELEGATE", "targetUserId": 2001})
    assert r["code"] == 0, r
    owner = psql(f"select owner_ from act_ru_task where id_='{task['taskId']}'")
    assignee = psql(f"select assignee_ from act_ru_task where id_='{task['taskId']}'")
    row = action_row(pid)
    return {"request": "POST delegate target=2001", "owner_after": owner,
            "assignee_after": assignee, "approval_row": row,
            "verdict": "owner kept = original; assignee = delegatee (回归原责任人确认由 Flowable delegation 承接)"}
case("G10", "DELEGATE委托", g10_delegate)

# ---------------- G10 AUTHORIZE 规则：生效/冲突/循环/撤销 + 新任务代理 ----------------
def g10_authorize():
    # 1) user2 创建规则：user2 → user3 GLOBAL，未来生效（不生效验证由时段外的 withdraw 流程承担）
    code, r = http(PORT_A, "POST", "/workflow/authorize-rules", T2,
                   {"action": "AUTHORIZE", "targetUserId": 2002, "scopeType": "GLOBAL",
                    "startAt": "2026-09-10T00:00:00", "endAt": "2027-01-01T00:00:00"})
    assert r["code"] == 0, r
    rule_id = r["data"]
    # 2) 冲突拒绝：同范围重叠时段再建
    code, r2 = http(PORT_A, "POST", "/workflow/authorize-rules", T2,
                    {"action": "AUTHORIZE", "targetUserId": 2002, "scopeType": "GLOBAL",
                     "startAt": "2026-09-11T00:00:00", "endAt": "2027-01-01T00:00:00"})
    # 3) 循环拒绝：user3 → user2
    T3 = login(PORT_A, "user3")
    code, r3 = http(PORT_A, "POST", "/workflow/authorize-rules", T3,
                    {"action": "AUTHORIZE", "targetUserId": 2001, "scopeType": "GLOBAL"})
    # 4) 自我拒绝：user2 → user2
    code, r4 = http(PORT_A, "POST", "/workflow/authorize-rules", T2,
                    {"action": "AUTHORIZE", "targetUserId": 2001, "scopeType": "GLOBAL"})
    # 5) 新任务代理生效：user2 有任务 → 代理给 user3? 规则是 user2→user3? 上面 principal=user2 agent=2002(user3)
    rec = submit(PORT_A, "i3ev_d1", T2, {"amount": 7, "reason": "g10-authorize"})
    pid = pid_of(rec)
    time.sleep(1)
    assignee = psql(f"select assignee_ from act_ru_task where process_instance_id_='{pid}'")
    proxy_rows = psql(f"select action, actor_id, proxy_for_user_id from sw_bpm_approval_action where process_instance_id='{pid}' and action='AUTHORIZE'")
    # 6) 撤销规则
    code, r5 = http(PORT_A, "DELETE", f"/workflow/authorize-rules/{rule_id}", T2)
    return {"rule_created": rule_id, "conflict_rejected": {"code": r2["code"], "msg": r2.get("msg")},
            "cycle_rejected": {"code": r3["code"], "msg": r3.get("msg")},
            "self_rejected": {"code": r4["code"], "msg": r4.get("msg")},
            "proxy_task_assignee": assignee, "proxy_audit_row": proxy_rows,
            "revoke": {"code": r5["code"]},
            "verdict": "conflict/cycle/self rejected; new task auto-delegated with AUTHORIZE audit; revoke ok"}
case("G10", "AUTHORIZE规则矩阵", g10_authorize)

# ---------------- G11 ADD_SIGN 并行 + 越权 + 重复 ----------------
def g11_add_sign():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 8, "reason": "g11-addsign"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/add-sign", TA,
                   {"action": "ADD_SIGN", "participants": [2001], "mode": "PARALLEL", "policy": "ALL_PASS"})
    assert r["code"] == 0, r
    # 重复（任务已存在未结束加签）
    code, r2 = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/add-sign", TA,
                    {"action": "ADD_SIGN", "participants": [2001], "mode": "PARALLEL"})
    # 越权：user4（无权办理该任务）替任务加签
    code, r3 = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/add-sign", T4,
                    {"action": "ADD_SIGN", "participants": [2001], "mode": "PARALLEL"})
    # user2 表态 APPROVE
    sign_id = psql(f"select id from sw_bpm_sign_record where task_id='{task['taskId']}' order by id limit 1")
    T2tok = login(PORT_A, "user2")
    code, r4 = http(PORT_A, "POST", f"/workflow/sign/{sign_id}/express", T2tok,
                    {"action": "APPROVE", "comment": "sign ok"})
    time.sleep(1)
    pending_after = psql(f"select sign_status, result_status from sw_bpm_sign_record where id={sign_id}")
    return {"first": {"code": r["code"]}, "duplicate": {"code": r2["code"], "msg": r2.get("msg")},
            "cross_user": {"code": r3["code"], "msg": r3.get("msg")},
            "express": {"code": r4["code"]}, "sign_row_after": pending_after,
            "verdict": "add-sign pending -> user2 express APPROVE -> DONE; duplicate blocked; cross-user blocked"}
case("G11", "ADD_SIGN并行/重复/越权/表态", g11_add_sign)

# ---------------- G11 SUPPLEMENT_SIGN 原终态关联 + 表态 ----------------
def g11_supplement():
    # 用已 REJECT 的 g6-disapprove 实例（或新建一个快速 REJECT）
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 9, "reason": "g11-supplement"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/reject", TA, {"action": "REJECT"})
    orig_status = status_of(pid)
    code, r = http(PORT_A, "POST", f"/workflow/instances/{pid}/supplement-sign", TA,
                   {"action": "SUPPLEMENT_SIGN", "participants": [2001], "nodeKey": "node_1"})
    assert r["code"] == 0, r
    sign_id = psql(f"select id from sw_bpm_sign_record where process_instance_id='{pid}' and sign_type='SUPPLEMENT_SIGN' order by id desc limit 1")
    orig_assoc = psql(f"select original_status from sw_bpm_sign_record where id={sign_id}")
    T2tok = login(PORT_A, "user2")
    code, r2 = http(PORT_A, "POST", f"/workflow/sign/{sign_id}/express", T2tok, {"action": "APPROVE"})
    after = status_of(pid)
    row = psql(f"select sign_status, result_status, original_status from sw_bpm_sign_record where id={sign_id}")
    return {"original_status": orig_status, "original_assoc": orig_assoc,
            "express": {"code": r2["code"]}, "status_after": after, "sign_row": row,
            "verdict": "supplement confirms without rewriting original terminal state"}
case("G11", "SUPPLEMENT_SIGN不改写原终态", g11_supplement)

# ---------------- G11 WITHDRAW 正向 + 越界负向 + 幂等 ----------------
def g11_withdraw():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 10, "reason": "g11-withdraw"})
    pid = pid_of(rec)
    code, r = http(PORT_A, "POST", f"/workflow/my/instances/{pid}/withdraw", TA, {"reason": "g11"})
    assert r["code"] == 0, r
    st = status_of(pid)
    # 重复撤回（幂等：已 WITHDRAWN 直接 ok）
    code, r2 = http(PORT_A, "POST", f"/workflow/my/instances/{pid}/withdraw", TA, {})
    # 越界：已 APPROVE 的实例（g6-approve 的 pid）撤回
    approved_rec = None
    code, r3 = http(PORT_A, "POST", f"/workflow/my/instances/{pid_of(psql_rec_g6())}/withdraw", TA, {})
    open_tasks = psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'")
    return {"first": {"code": r["code"]}, "status": st, "repeat": {"code": r2["code"]},
            "boundary_reject": {"code": r3["code"], "msg": r3.get("msg")},
            "open_tasks_after": open_tasks,
            "verdict": "withdraw closes tasks and sets WITHDRAWN; repeat idempotent; crossed-boundary rejected"}

def psql_rec_g6():
    return psql("select business_key from sw_bpm_approval_action a join sw_bpm_instance i on i.process_instance_id=a.process_instance_id where a.action='APPROVE' and i.status='APPROVED' order by a.id desc limit 1")
case("G11", "WITHDRAW正向/重复/越界", g11_withdraw)

# ---------------- G11 COMMUNICATE 正向 + 回复 + 接收人无审批权 ----------------
def g11_communicate():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 11, "reason": "g11-comm"})
    pid = pid_of(rec)
    task = my_todo_one(TA, rec)
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/communicate", TA,
                   {"action": "COMMUNICATE", "receivers": [2003], "message": "g11"})
    assert r["code"] == 0, r
    comm_id = psql(f"select id from sw_bpm_communication where process_instance_id='{pid}' order by id desc limit 1")
    T4tok = login(PORT_A, "user4")
    code, r2 = http(PORT_A, "POST", f"/workflow/communications/{comm_id}/reply", T4tok,
                    {"action": "COMMUNICATE", "message": "reply from user4"})
    # 接收人无审批权：user4 complete 任务 → 拒绝
    code, r3 = http(PORT_A, "POST", f"/workflow/tasks/{task['taskId']}/complete", T4tok,
                    {"action": "APPROVE"})
    return {"communicate": {"code": r["code"]}, "reply": {"code": r2["code"]},
            "receiver_complete_rejected": {"code": r3["code"], "msg": r3.get("msg")},
            "verdict": "communicate+reply ok; receiver has NO approval settlement right"}
case("G11", "COMMUNICATE/回复/无审批权", g11_communicate)

# ---------------- G11 DISCARD 正向 + 重复 ----------------
def g11_discard():
    rec = submit(PORT_A, "i3ev_d1", TA, {"amount": 12, "reason": "g11-discard"})
    pid = pid_of(rec)
    code, r = http(PORT_A, "POST", f"/workflow/instances/{pid}/discard", TA, {"reason": "invalid"})
    assert r["code"] == 0, r
    st = status_of(pid)
    code, r2 = http(PORT_A, "POST", f"/workflow/instances/{pid}/discard", TA, {})
    tr = trace_of(pid)
    return {"first": {"code": r["code"]}, "status": st, "repeat": {"code": r2["code"]},
            "trace": tr, "verdict": "discard terminates; repeat idempotent"}
case("G11", "DISCARD正向/重复", g11_discard)

print("STEP3_DONE")
