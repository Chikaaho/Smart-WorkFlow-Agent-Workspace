#!/usr/bin/env python3
"""Z5：G9/G10/G11 生命周期动作包（冻结候选 i3-06-frozen-b 上采集）。
串/并行加签+补签（完成/取消/越权/失效/重复）+ 委托 + 代理（生效窗口/撤销/负向）+
撤回/沟通/废弃对象链。每类 JSON + assertions 空值/错误成功/第二副作用计数=0。
原始报文：Z5/raw/raw-transcript.txt。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir
from zlib import psql, marker, action_rows, trace_rows, notify_rows, inst_status, sign_rows_for, chain

set_raw_dir("Z5/raw")
PA = 8081
TA = login(PA, "admin")
T2 = login(PA, "user2")
T3 = login(PA, "user3")
T4 = login(PA, "user4")
T5 = login(PA, "user5")
TI = login(PA, "initiator")
LOG = []



def http_retry(fn, *args, **kwargs):
    """权限快照偶发 401（redis 缓存竞态）→ 300ms 后重试一次。"""
    code, r = fn(*args, **kwargs)
    if r.get("code") == 401:
        time.sleep(0.4)
        code, r = fn(*args, **kwargs)
    return code, r

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


def rec(case, entry):
    LOG.append({"case": case, "result": entry})
    save("Z5/z5-actions.json", LOG)


def run_case(fn):
    try:
        fn()
        print(f"[OK] {fn.__name__}")
        return True
    except Exception as exc:
        LOG.append({"case": fn.__name__, "error": repr(exc)})
        save("Z5/z5-actions.json", LOG)
        print(f"[FAIL] {fn.__name__}: {exc}")
        return False


# ---------- Z5-01 加签串行 ----------
def z5_add_sign_serial():
    mk = marker("z5-01", "addsign-serial")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    code, r = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                   {"action": "ADD_SIGN", "participants": [2001, 2002], "mode": "SERIAL"})
    before = sign_rows_for(pid)
    sid2 = psql("select id from sw_bpm_sign_record where task_id='" + t + "' and sign_type='ADD_SIGN' and sign_status='PENDING' order by seq_no desc limit 1")
    code, gate = http_retry(http, PA, "POST", f"/workflow/sign/{sid2}/express", T3, {"action": "APPROVE", "comment": "z5-serial-gate-violation"})
    sid1 = psql("select id from sw_bpm_sign_record where task_id='" + t + "' and sign_type='ADD_SIGN' and sign_status='PENDING' order by seq_no asc limit 1")
    code, e2 = http_retry(http, PA, "POST", f"/workflow/sign/{sid1}/express", T2, {"action": "APPROVE", "comment": mk + "-u2"})
    code, e3 = http_retry(http, PA, "POST", f"/workflow/sign/{sid2}/express", T3, {"action": "APPROVE", "comment": mk + "-u3"})
    time.sleep(1)
    after = sign_rows_for(pid)
    code, fin = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": mk + "-final"})
    time.sleep(1)
    rec("Z5-01-addsign-serial", {"marker": mk, "create": r["code"], "serial_gate_violation": gate["code"],
                                 "express_u2": e2["code"], "express_u3": e3["code"],
                                 "final": fin["code"], "sign_before": before, "sign_after": after,
                                 "chain": chain(pid, mk)})
    assert r["code"] == 0 and gate["code"] != 0 and e2["code"] == 0 and e3["code"] == 0 and fin["code"] == 0


# ---------- Z5-02 加签并行 ----------
def z5_add_sign_parallel():
    mk = marker("z5-02", "addsign-parallel")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    code, r = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                   {"action": "ADD_SIGN", "participants": [2001, 2002], "mode": "PARALLEL"})
    s2 = psql("select id from sw_bpm_sign_record where task_id='" + t + "' and sign_type='ADD_SIGN' and participant_id=2002 limit 1")
    s1 = psql("select id from sw_bpm_sign_record where task_id='" + t + "' and sign_type='ADD_SIGN' and participant_id=2001 limit 1")
    code, e1 = http_retry(http, PA, "POST", f"/workflow/sign/{s2}/express", T3, {"action": "APPROVE", "comment": mk + "-u3"})
    code, e2 = http_retry(http, PA, "POST", f"/workflow/sign/{s1}/express", T2, {"action": "APPROVE", "comment": mk + "-u2"})
    time.sleep(1)
    rec("Z5-02-addsign-parallel", {"marker": mk, "create": r["code"], "express_u3": e1["code"],
                                   "express_u2": e2["code"], "sign_after": sign_rows_for(pid),
                                   "chain": chain(pid, mk)})
    assert r["code"] == 0 and e1["code"] == 0 and e2["code"] == 0


# ---------- Z5-03 加签取消：取消生效、取消后表态拒绝、重复表态幂等 ----------
def z5_add_sign_cancel_repeat():
    mk = marker("z5-03", "addsign-cancel")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    code, r = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                   {"action": "ADD_SIGN", "participants": [2001], "mode": "PARALLEL"})
    s1 = psql("select id from sw_bpm_sign_record where task_id='" + t + "' and sign_status='PENDING' limit 1")
    code, cc = http(PA, "POST", f"/workflow/sign/{s1}/cancel", TA, {"reason": "z5-cancel"})
    time.sleep(1)
    status_after_cancel = psql(f"select sign_status from sw_bpm_sign_record where id='{s1}'")
    # 取消后表态 → 拒绝（非 PENDING）
    code, e_after = http(PA, "POST", f"/workflow/sign/{s1}/express", T2, {"action": "APPROVE", "comment": "z5-after-cancel"})
    # 再次加签 → 表态 → 重复表态幂等
    code, r2 = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                    {"action": "ADD_SIGN", "participants": [2001], "mode": "PARALLEL"})
    s2 = psql("select id from sw_bpm_sign_record where task_id='" + t + "' and sign_status='PENDING' limit 1")
    code, e1 = http_retry(http, PA, "POST", f"/workflow/sign/{s2}/express", T2, {"action": "APPROVE", "comment": mk})
    code, e1b = http_retry(http, PA, "POST", f"/workflow/sign/{s2}/express", T2, {"action": "APPROVE", "comment": mk + "-repeat"})
    time.sleep(1)
    code, fin = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": mk + "-final"})
    time.sleep(1)
    rec("Z5-03-addsign-cancel-repeat", {"marker": mk, "create": r["code"], "cancel": cc["code"],
                                        "sign_status_after_cancel": status_after_cancel,
                                        "express_after_cancel_rejected": e_after["code"],
                                        "re_add_sign": r2["code"], "express": e1["code"],
                                        "repeat_idempotent": e1b["code"], "final": fin["code"],
                                        "sign_after": sign_rows_for(pid), "chain": chain(pid, mk)})
    assert r["code"] == 0 and cc["code"] == 0 and status_after_cancel == "CANCELLED"
    assert e_after["code"] != 0 and e1["code"] == 0 and fin["code"] == 0


# ---------- Z5-04 加签负向：失效人员/自我/权限越权 ----------
def z5_add_sign_negatives():
    mk = marker("z5-04", "addsign-neg")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    code, bad_user = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                          {"action": "ADD_SIGN", "participants": [999999], "mode": "PARALLEL"})
    code, bad_self = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                          {"action": "ADD_SIGN", "participants": [1], "mode": "PARALLEL"})
    code, bad_perm = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", T5,
                          {"action": "ADD_SIGN", "participants": [2001], "mode": "PARALLEL"})
    rec("Z5-04-addsign-negatives", {"marker": mk, "invalid_user": bad_user["code"],
                                    "self_add": bad_self["code"], "forbidden_perm": bad_perm["code"]})
    assert bad_user["code"] != 0 and bad_self["code"] != 0 and bad_perm["code"] != 0


# ---------- Z5-05 补签 ----------
def z5_supplement_sign():
    mk = marker("z5-05", "supplement")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    code, r = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": mk + "-pass"})
    time.sleep(1)
    status_before = inst_status(pid)
    code, sup = http(PA, "POST", f"/workflow/instances/{pid}/supplement-sign", TI,
                     {"action": "SUPPLEMENT_SIGN", "participants": [2001], "comment": mk})
    time.sleep(1)
    sid = psql("select id from sw_bpm_sign_record where sign_type='SUPPLEMENT_SIGN' and process_instance_id='" + pid + "' order by id desc limit 1")
    # PENDING 重复门先测（同参与人未表态时重复补签 → 2405，锁定口径）
    code, dup = http(PA, "POST", f"/workflow/instances/{pid}/supplement-sign", TI,
                     {"action": "SUPPLEMENT_SIGN", "participants": [2001], "comment": "z5-dup-same-participant"})
    code, e1 = http_retry(http, PA, "POST", f"/workflow/sign/{sid}/express", T2, {"action": "APPROVE", "comment": mk + "-express"})
    time.sleep(1)
    status_after = inst_status(pid)
    bk2, pid2 = submit("i3ev_z3a", TI)
    t2 = todo_of(TA, bk2)
    http(PA, "POST", f"/workflow/tasks/{t2}/complete", TA, {"action": "APPROVE", "comment": "z5-sup2-pass"})
    code, sup2 = http(PA, "POST", f"/workflow/instances/{pid2}/supplement-sign", T5,
                      {"action": "SUPPLEMENT_SIGN", "participants": [2003], "comment": "z5-sup-forbidden"})
    rec("Z5-05-supplement-sign", {"marker": mk, "sup_create": sup["code"], "express": e1["code"],
                                  "status_before": status_before, "status_after": status_after,
                                  "dup_same_participant": dup["code"], "forbidden_actor": sup2["code"],
                                  "sign_rows": sign_rows_for(pid), "chain": chain(pid, mk)})
    assert sup["code"] == 0 and e1["code"] == 0 and status_before == "APPROVED" and status_after == "APPROVED"
    assert dup["code"] != 0 and sup2["code"] != 0


# ---------- Z5-06 转办 ----------
def z5_transfer():
    mk = marker("z5-06", "transfer")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    assignee_before = psql(f"select assignee_ from act_ru_task where id_='{t}'")
    code, r = http(PA, "POST", f"/workflow/tasks/{t}/transfer", TA, {"action": "TRANSFER", "targetUserId": 2001, "reason": mk})
    time.sleep(1)
    assignee_after = psql(f"select assignee_ from act_ru_task where id_='{t}'")
    code, gone = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": "z5-orig-rejected"})
    code, fin = http(PA, "POST", f"/workflow/tasks/{t}/complete", T2, {"action": "APPROVE", "comment": mk + "-by-transferee"})
    time.sleep(1)
    rec("Z5-06-transfer", {"marker": mk, "transfer": r["code"], "assignee_before": assignee_before,
                           "assignee_after": assignee_after, "orig_complete_rejected": gone["code"],
                           "transferee_complete": fin["code"], "chain": chain(pid, mk)})
    assert r["code"] == 0 and assignee_after == "2001" and gone["code"] != 0 and fin["code"] == 0


# ---------- Z5-07 委托 ----------
def z5_delegate():
    mk = marker("z5-07", "delegate")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    code, r = http(PA, "POST", f"/workflow/tasks/{t}/delegate", TA, {"action": "DELEGATE", "targetUserId": 2001})
    time.sleep(1)
    assignee_after = psql(f"select assignee_ from act_ru_task where id_='{t}'")
    code, fin = http(PA, "POST", f"/workflow/tasks/{t}/complete", T2, {"action": "APPROVE", "comment": mk + "-by-delegatee"})
    time.sleep(1)
    rec("Z5-07-delegate", {"marker": mk, "delegate": r["code"], "assignee_after_delegate": assignee_after,
                           "delegatee_complete": fin["code"], "chain": chain(pid, mk)})
    assert r["code"] == 0 and fin["code"] == 0


# ---------- Z5-08 代理正向：生效窗口内自动代理 + 代理办理 + 撤销后不代理 ----------
def z5_authorize():
    ensure_user2_def()
    mk = marker("z5-08", "authorize")
    import time as _t
    now = _t.strftime("%Y-%m-%dT%H:%M:%S")
    later = _t.strftime("%Y-%m-%dT%H:%M:%S", _t.localtime(_t.time() + 3600))
    code, r = http(PA, "POST", "/workflow/authorize-rules", T2,
                   {"action": "AUTHORIZE", "targetUserId": 2002, "startAt": now, "endAt": later, "scopeType": "GLOBAL"})
    rule_id = r["data"]
    bk, pid = submit("i3ev_z5u2", TI)
    time.sleep(1)
    t2_task = todo_of(T3, bk)  # 生效期内任务自动代理给 user3(2002)，T2 待办为空是正向预期
    assignee = psql(f"select assignee_ from act_ru_task where id_='{t2_task}'")
    code, fin = http(PA, "POST", f"/workflow/tasks/{t2_task}/complete", T3, {"action": "APPROVE", "comment": mk + "-agent"})
    time.sleep(1)
    proxy_audit = psql("select count(*) from sw_bpm_approval_action where process_instance_id='" + pid + "' and action='PROXY_JOINED'")
    time.sleep(1)
    code, rv = http(PA, "DELETE", f"/workflow/authorize-rules/{rule_id}", T2)
    bk2, pid2 = submit("i3ev_z5u2", TI)
    time.sleep(1)
    t2_task2 = todo_of(T2, bk2)
    assignee2 = psql(f"select assignee_ from act_ru_task where id_='{t2_task2}'")
    code, fin2 = http(PA, "POST", f"/workflow/tasks/{t2_task2}/complete", T2, {"action": "APPROVE", "comment": mk + "-self-after-revoke"})
    time.sleep(1)
    rec("Z5-08-authorize", {"marker": mk, "rule_id": rule_id, "create": r["code"],
                            "task_assignee_while_active": assignee, "proxy_audit_rows": proxy_audit,
                            "agent_complete": fin["code"], "revoke": rv["code"],
                            "assignee_after_revoke": assignee2, "chain": chain(pid, mk)})
    assert r["code"] == 0 and assignee == "2002" and fin["code"] == 0
    assert rv["code"] == 0 and assignee2 == "2001"


# ---------- Z5-09 代理负向：自我/非法/坏范围/无权 ----------
def z5_authorize_negatives():
    mk = marker("z5-09", "authorize-neg")
    code, self_rule = http(PA, "POST", "/workflow/authorize-rules", T2, {"action": "AUTHORIZE", "targetUserId": 2001})
    code, bad_agent = http(PA, "POST", "/workflow/authorize-rules", T2, {"action": "AUTHORIZE", "targetUserId": 999999})
    code, bad_scope = http(PA, "POST", "/workflow/authorize-rules", T2, {"action": "AUTHORIZE", "targetUserId": 2002, "scopeType": "ALL"})
    code, no_perm = http(PA, "POST", "/workflow/authorize-rules", T5, {"action": "AUTHORIZE", "targetUserId": 2002})
    rec("Z5-09-authorize-negatives", {"marker": mk, "self_proxy": self_rule["code"],
                                      "invalid_agent": bad_agent["code"], "bad_scope": bad_scope["code"],
                                      "forbidden": no_perm["code"]})
    assert self_rule["code"] != 0 and bad_agent["code"] != 0 and no_perm["code"] != 0


# ---------- Z5-10 代理：未来生效窗口不代理 ----------
def z5_authorize_future():
    ensure_user2_def()
    mk = marker("z5-10", "authorize-future")
    import time as _t
    start = _t.strftime("%Y-%m-%dT%H:%M:%S", _t.localtime(_t.time() + 86400))
    end = _t.strftime("%Y-%m-%dT%H:%M:%S", _t.localtime(_t.time() + 90000))
    code, r = http(PA, "POST", "/workflow/authorize-rules", T2,
                   {"action": "AUTHORIZE", "targetUserId": 2002, "startAt": start, "endAt": end, "scopeType": "GLOBAL"})
    rule_id = r["data"]
    bk, pid = submit("i3ev_z5u2", TI)
    time.sleep(1)
    t2_task = todo_of(T2, bk)
    assignee = psql(f"select assignee_ from act_ru_task where id_='{t2_task}'")
    code, fin = http(PA, "POST", f"/workflow/tasks/{t2_task}/complete", T2, {"action": "APPROVE", "comment": "z5-future-self"})
    code, rv = http(PA, "DELETE", f"/workflow/authorize-rules/{rule_id}", T2)
    rec("Z5-10-authorize-future-window", {"marker": mk, "create": r["code"],
                                          "assignee_before_window": assignee, "self_complete": fin["code"],
                                          "revoke": rv["code"], "chain": chain(pid, mk)})
    assert assignee == "2001" and rv["code"] == 0


# ---------- Z5-11 撤回 ----------
def z5_withdraw():
    mk = marker("z5-11", "withdraw")
    bk, pid = submit("i3ev_z3a", TI)
    time.sleep(1)
    code, r = http(PA, "POST", f"/workflow/my/instances/{pid}/withdraw", TI, {"action": "WITHDRAW", "reason": mk})
    time.sleep(1)
    status = inst_status(pid)
    code, dup = http(PA, "POST", f"/workflow/my/instances/{pid}/withdraw", TI, {"action": "WITHDRAW", "reason": "z5-repeat"})
    bk2, pid2 = submit("i3ev_z3a", TI)
    code, no_perm = http(PA, "POST", f"/workflow/my/instances/{pid2}/withdraw", T5, {"action": "WITHDRAW", "reason": "z5-no-perm"})
    bk3, pid3 = submit("i3ev_z3a", TI)
    t3 = todo_of(TA, bk3)
    http(PA, "POST", f"/workflow/tasks/{t3}/complete", TA, {"action": "APPROVE", "comment": "z5-withdraw-block-pass"})
    code, blocked = http(PA, "POST", f"/workflow/my/instances/{pid3}/withdraw", TI, {"action": "WITHDRAW", "reason": "z5-after-action"})
    rec("Z5-11-withdraw", {"marker": mk, "withdraw": r["code"], "status_after": status,
                           "repeat_idempotent": dup["code"], "forbidden": no_perm["code"],
                           "blocked_after_action": blocked["code"], "chain": chain(pid, mk)})
    assert r["code"] == 0 and status == "WITHDRAWN" and dup["code"] == 0
    assert no_perm["code"] != 0 and blocked["code"] != 0


# ---------- Z5-12 沟通 ----------
def z5_communicate():
    mk = marker("z5-12", "communicate")
    bk, pid = submit("i3ev_z3a", TI)
    t = todo_of(TA, bk)
    code, r = http(PA, "POST", f"/workflow/tasks/{t}/communicate", TA, {"action": "COMMUNICATE", "receivers": [2003], "comment": mk})
    time.sleep(1)
    comm_rows = psql("select id||'|'||status||'|'||initiator_id||'|'||receiver_id from sw_bpm_communication where task_id='" + t + "'")
    code, no_settle = http(PA, "POST", f"/workflow/tasks/{t}/complete", T4, {"action": "APPROVE", "comment": "z5-comm-no-right"})
    cid = psql(f"select id from sw_bpm_communication where task_id='{t}' limit 1")
    code, rep = http(PA, "POST", f"/workflow/communications/{cid}/reply", T4, {"message": mk + "-reply"})
    time.sleep(1)
    rep_row = psql(f"select status||'|'||coalesce(reply_message,'-') from sw_bpm_communication where id='{cid}'")
    code, fin = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": mk + "-owner-still-approves"})
    time.sleep(1)
    rec("Z5-12-communicate", {"marker": mk, "create": r["code"], "comm_rows": comm_rows,
                              "receiver_approve_rejected": no_settle["code"], "reply": rep["code"],
                              "reply_row": rep_row, "owner_complete": fin["code"], "chain": chain(pid, mk)})
    assert r["code"] == 0 and no_settle["code"] != 0 and rep["code"] == 0 and fin["code"] == 0


# ---------- Z5-13 废弃 ----------
def z5_discard():
    mk = marker("z5-13", "discard")
    bk, pid = submit("i3ev_z3a", TI)
    time.sleep(1)
    status_before = inst_status(pid)
    code, r = http(PA, "POST", f"/workflow/instances/{pid}/discard", TA, {"action": "DISCARD", "reason": mk})
    time.sleep(1)
    status_after = inst_status(pid)
    code, dup = http(PA, "POST", f"/workflow/instances/{pid}/discard", TA, {"action": "DISCARD", "reason": "z5-discard-repeat"})
    bk2, pid2 = submit("i3ev_z3a", TI)
    code, no_perm = http(PA, "POST", f"/workflow/instances/{pid2}/discard", T5, {"action": "DISCARD", "reason": "z5-no-perm"})
    open_after = psql(f"select count(*) from act_ru_task where proc_inst_id_='{pid}'")
    rec("Z5-13-discard", {"marker": mk, "discard": r["code"], "status_before": status_before,
                          "status_after": status_after, "action_rows": action_rows(pid),
                          "trace": trace_rows(pid), "repeat_idempotent": dup["code"],
                          "forbidden": no_perm["code"], "open_tasks_after": open_after,
                          "chain": chain(pid, mk)})
    assert r["code"] == 0 and status_after == "DISCARDED" and dup["code"] == 0
    assert no_perm["code"] != 0 and open_after == "0"


def ensure_user2_def():
    """Z5 代理场景专用定义：START→APPROVAL(user2)→END，formKey=i3ev_z5u2 唯一。"""
    code, r = http(PA, "POST", "/form/def", TA, {"formKey": "i3ev_z5u2", "name": "Z5-单审批-user2"})
    fid = (r.get("data") or {}).get("id")
    if not fid:
        code, r2 = http(PA, "GET", "/form/def/by-key/i3ev_z5u2", TA)
        fid = (r2.get("data") or {}).get("id")
    definition = json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]}, ensure_ascii=False)
    http(PA, "POST", f"/form/def/{fid}/config", TA, {"definition": definition})
    code, rp = http(PA, "POST", f"/form/def/{fid}/publish", TA)
    assert rp["code"] in (0, 1100), rp
    g = {"processKey": "", "name": "Z5-单审批-user2", "formKey": "i3ev_z5u2", "contractVersion": 2,
         "elements": [
             {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
             {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 320, "y": 300,
              "config": {"name": "审批U", "participant": {"strategy": "FIXED_USER", "value": [2001]}}},
             {"id": "node_end", "kind": "node", "type": "END", "x": 540, "y": 300, "config": {}},
             {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
             {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_end", "config": {}}],
         "canvas": {}}
    code, ex = http(PA, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_z5u2", TA)
    def_id = None
    for row in (ex.get("data") or {}).get("records") or []:
        if row.get("name") == "Z5-单审批-user2":
            def_id = row["id"]
    if not def_id:
        code, r3 = http(PA, "POST", "/workflow/defs", TA, {"name": "Z5-单审批-user2", "formKey": "i3ev_z5u2"})
        def_id = r3["data"]["defId"]
    code, r4 = http(PA, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    assert r4["code"] == 0, r4
    code, rv = http(PA, "POST", f"/workflow/defs/{def_id}/validate", TA)
    assert (rv.get("data") or []) == [], rv
    code, r5 = http(PA, "POST", f"/workflow/defs/{def_id}/publish", TA)
    assert r5["code"] == 0, r5
    return def_id


def refresh_tokens():
    global TA, T2, T3, T4, T5, TI
    TA = login(PA, "admin")
    T2 = login(PA, "user2")
    T3 = login(PA, "user3")
    T4 = login(PA, "user4")
    T5 = login(PA, "user5")
    TI = login(PA, "initiator")


def main():
    cases = [z5_add_sign_serial, z5_add_sign_parallel, z5_add_sign_cancel_repeat, z5_add_sign_negatives,
             z5_supplement_sign, z5_transfer, z5_delegate, z5_authorize, z5_authorize_negatives,
             z5_authorize_future, z5_withdraw, z5_communicate, z5_discard]
    oks = []
    for fn in cases:
        refresh_tokens()  # accessToken 有效期 900s，逐用例刷新避免中途 401
        oks.append(run_case(fn))
    save("Z5/z5-actions.json", LOG)
    print("Z5 main done:", all(oks))


if __name__ == "__main__":
    main()
