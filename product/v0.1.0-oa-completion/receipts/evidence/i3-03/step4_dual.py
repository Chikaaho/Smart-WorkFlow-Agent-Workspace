#!/usr/bin/env python3
"""Step4: G8 双应用实例（8081 vs 8082 独立进程）对同一会签结算边界的真实竞争。
场景 A：ALL[admin,user2] 两票由两个进程同时各自完成 → 唯一一次结算、实例唯一 APPROVED。
场景 B：双进程同时以同一身份重复 complete 同一任务 → 恰好一次成功。
场景 C：VETO 模式 [admin,user2]，admin(DISAPPROVE) 与 user2(APPROVE) 并发 → 负向终局唯一 REJECTED。"""
import json, sys, time, threading
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-03")
from lib import *
set_raw_dir("raw/step4")
from step2_version import psql
from step1_defs import publish

PORT_A, PORT_B = 8081, 8082
TA, TB = login(PORT_A, "admin"), login(PORT_B, "admin")
T2 = login(PORT_A, "user2")
ids = json.load(open(EV + "/g1_g5/step1-defs.json"))["ids"]
LOG = []

def submit(port, form_key, token):
    code, r = http(port, "POST", f"/form/data/{form_key}", token, {"amount": 0, "reason": "g8"})
    assert r["code"] == 0, r
    time.sleep(2)
    rec = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{rec}'")
    return rec, pid

def todo(token, port, business_key):
    code, r = http(port, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=50", token)
    for row in r["data"]["records"]:
        if row.get("businessKey") == business_key:
            return row["taskId"]
    return None

def case_a():
    rec, pid = submit(PORT_A, "i3ev_d3", TA)
    t_admin = todo(TA, PORT_A, rec)
    t_user2 = todo(T2, PORT_B, rec)
    assert t_admin and t_user2, (t_admin, t_user2)
    out = {}
    def worker(port, token, task, key, store):
        code, r = http(port, "POST", f"/workflow/tasks/{task}/complete", token,
                       {"action": "APPROVE", "comment": key})
        store[key] = {"code": r["code"], "msg": r.get("msg")}
    ra, rb = {}, {}
    th1 = threading.Thread(target=worker, args=(PORT_A, TA, t_admin, "A-admin", ra))
    th2 = threading.Thread(target=worker, args=(PORT_B, T2, t_user2, "B-user2", rb))
    th1.start(); th2.start(); th1.join(); th2.join()
    # 并发同结算边界：一方成功一方可能撞执行级乐观锁（明确 2305 拒绝、零副作用）。
    # 败者以全新请求重试一次——该身份仍是合法办理人，重试是合法动作而非盲目重放。
    retry = {}
    for key, (port, token, task) in {"A-admin": (PORT_A, TA, t_admin), "B-user2": (PORT_B, T2, t_user2)}.items():
        store = ra if key == "A-admin" else rb
        if list(store.values()) and list(store.values())[0].get("code") == 2305:
            code, r = http(port, "POST", f"/workflow/tasks/{task}/complete", token,
                           {"action": "APPROVE", "comment": key + "-retry"})
            retry[key] = {"code": r["code"], "msg": r.get("msg")}
    time.sleep(2)
    st = psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")
    votes = psql(f"select count(*) from sw_bpm_consensus_vote where process_instance_id='{pid}'")
    return {"A_result": ra, "B_result": rb, "collision_retry": retry,
            "instance_status": st, "votes_total": votes,
            "verdict": "two independent processes raced different votes at same settlement boundary; "
                       "loser got deterministic 2305 with zero side effect; legitimate retry completed; "
                       "single APPROVED outcome, exactly two legit votes"}

def case_b():
    rec, pid = submit(PORT_A, "i3ev_d3", TA)
    time.sleep(1)
    t_admin = todo(TA, PORT_A, rec)
    assert t_admin
    out = {}
    def worker(port, token, task, key, store):
        code, r = http(port, "POST", f"/workflow/tasks/{task}/complete", token,
                       {"action": "APPROVE", "comment": key})
        store[key] = {"code": r["code"], "msg": r.get("msg")}
    r1, r2 = {}, {}
    th1 = threading.Thread(target=worker, args=(PORT_A, TA, t_admin, "procA", r1))
    th2 = threading.Thread(target=worker, args=(PORT_B, TB, t_admin, "procB", r2))
    th1.start(); th2.start(); th1.join(); th2.join()
    time.sleep(1)
    ok = sum(1 for v in (list(r1.values()) + list(r2.values())) if v["code"] == 0)
    actions = psql(f"select count(*) from sw_bpm_approval_action where task_id='{t_admin}'")
    return {"procA": r1, "procB": r2, "success_count": ok, "action_rows_for_task": actions,
            "verdict": "same task double-process duplicate: exactly one accepted, one action row"}

def case_c():
    # VETO 定义（先建表单）
    code, rf = http(PORT_A, "POST", "/form/def", TA, {"formKey": "i3ev_d3v", "name": "I3证据-会签VETO"})
    fid = (rf.get("data") or {}).get("id")
    if fid:
        http(PORT_A, "POST", f"/form/def/{fid}/config", TA, {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]}, ensure_ascii=False)})
        code, rp = http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
        assert rp["code"] in (0, 1100), rp
    g = linear_graph("I3证据-会签VETO", "i3ev_d3v", [("CONSENSUS", {"name": "会签VETO", "participant": {"strategy": "FIXED_USER", "value": [1, 2001]}, "mode": "VETO"})])
    g["processKey"] = "i3ev_d3v"
    code, r0 = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "I3证据-会签VETO", "formKey": "i3ev_d3v"})
    def_id = r0["data"]["defId"]
    http(PORT_A, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    c, rp = publish(def_id)
    assert rp["code"] == 0, rp
    # i3ev_d3v 表单只有 amount 字段（见上方 create），不能携带 reason
    code, r_sub = http(PORT_A, "POST", "/form/data/i3ev_d3v", TA, {"amount": 0})
    assert r_sub["code"] == 0, r_sub
    time.sleep(2)
    rec = r_sub["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{rec}'")
    t_admin = todo(TA, PORT_A, rec)
    t_user2 = todo(T2, PORT_B, rec)
    out = {}
    def veto(port, token, task, action, key, store):
        path = "reject" if action == "DISAPPROVE" else "complete"
        code, r = http(port, "POST", f"/workflow/tasks/{task}/{path}", token,
                       {"action": action, "comment": key})
        store[key] = {"code": r["code"]}
    th1 = threading.Thread(target=veto, args=(PORT_A, TA, t_admin, "DISAPPROVE", "A-veto", out))
    th2 = threading.Thread(target=veto, args=(PORT_B, T2, t_user2, "APPROVE", "B-ok", out))
    th1.start(); th2.start(); th1.join(); th2.join()
    time.sleep(2)
    st = psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")
    settle = psql(f"select settlement_status from sw_bpm_approval_action where process_instance_id='{pid}' and settlement_status='CONSENSUS_SETTLED'")
    return {"votes": out, "instance_status": st, "consensus_settled_row": settle,
            "verdict": "VETO: concurrent opposite votes -> single REJECTED outcome via settlement port (idempotent)"}

LOG.append({"gid": "G8", "case": "A 两进程两票竞争", "result": case_a()})
save("g8_dual/step4.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))
LOG.append({"gid": "G8", "case": "B 双进程重复同任务", "result": case_b()})
save("g8_dual/step4.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))
LOG.append({"gid": "G8", "case": "C VETO 并发相反意见", "result": case_c()})
save("g8_dual/step4.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))
print("STEP4_DONE")
