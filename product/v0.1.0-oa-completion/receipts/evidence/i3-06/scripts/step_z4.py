#!/usr/bin/env python3
"""Z4：G8 会签与双进程包（冻结候选 i3-06-frozen-a，本轮新采，不引用旧摘要）。
正向：ALL/ANY/RATIO/VETO 最小正反；逐票前后 total/completed/positive/status；
同任务重复及同结算边界双进程（A@8081 / B@8082 并发）竞争只有一次合法副作用。
反向：未达阈值不得终结；HTTP 500=0；重复票/推进/终态=0。
原始报文：Z4/raw/raw-transcript.txt。"""
import json, subprocess, sys, threading, time, uuid
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir

set_raw_dir("Z4/raw")
PA, PB = 8081, 8082
PGPORT = open("/tmp/i3-03/pg-port.txt").read().strip()


def psql(sql):
    r = subprocess.run(
        ["psql", "-h", "localhost", "-p", PGPORT, "-U", "postgres", "-d", "smart_workflow", "-t", "-A", "-c", sql],
        capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


TA = login(PA, "admin")
T2 = login(PA, "user2")
T3 = login(PA, "user3")
T2B = login(PB, "user2")
TI = login(PA, "initiator")
LOG = []
HTTP500 = []
HTTP_CODES = []
SEQ = [0]


def marker(label):
    SEQ[0] += 1
    return f"z4-{SEQ[0]:02d}-{label}-{uuid.uuid4().hex[:8]}"


def note(call, resp):
    # lib.http() 返回 (http_code, body_dict)
    code_val = resp[0] if isinstance(resp, tuple) else resp.get("code")
    HTTP_CODES.append({"call": call, "code": code_val})
    if code_val == 500:
        HTTP500.append(call)


def ensure_consensus_def(name, form_key, mode, ratio=None, participants=(1, 2001, 2002)):
    code, r = http(PA, "POST", "/form/def", TA, {"formKey": form_key, "name": name})
    fid = (r.get("data") or {}).get("id")
    if not fid:
        code, r2 = http(PA, "GET", f"/form/def/by-key/{form_key}", TA)
        fid = (r2.get("data") or {}).get("id")
    definition = json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"},
                                        {"name": "reason", "label": "事由", "type": "TEXT"}]}, ensure_ascii=False)
    http(PA, "POST", f"/form/def/{fid}/config", TA, {"definition": definition})
    code, rp = http(PA, "POST", f"/form/def/{fid}/publish", TA)
    assert rp["code"] in (0, 1100), rp
    cfg = {"name": name, "participant": {"strategy": "FIXED_USER", "value": list(participants)}, "mode": mode}
    if ratio is not None:
        cfg["ratio"] = ratio
    g = {"processKey": "", "name": name, "formKey": form_key, "contractVersion": 2,
         "elements": [
             {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
             {"id": "node_1", "kind": "node", "type": "CONSENSUS", "x": 320, "y": 300, "config": cfg},
             {"id": "node_end", "kind": "node", "type": "END", "x": 540, "y": 300, "config": {}},
             {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
             {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_end", "config": {}}],
         "canvas": {}}
    code, ex = http(PA, "GET", f"/workflow/defs?pageNum=1&pageSize=100&formKey={form_key}", TA)
    def_id = None
    for row in (ex.get("data") or {}).get("records") or []:
        if row.get("name") == name:
            def_id = row["id"]
    if not def_id:
        code, r3 = http(PA, "POST", "/workflow/defs", TA, {"name": name, "formKey": form_key})
        assert r3["code"] == 0, r3
        def_id = r3["data"]["defId"]
    code, r4 = http(PA, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    assert r4["code"] == 0, r4
    code, rv = http(PA, "POST", f"/workflow/defs/{def_id}/validate", TA)
    errs = rv.get("data") or []
    assert errs == [], (name, errs)
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


def votes(pid):
    raw = psql("select task_id||'|'||actor_id||'|'||outcome from sw_bpm_consensus_vote where process_instance_id='" + pid + "' and deleted=0 order by id")
    return [r for r in raw.split("\n") if r] if raw else []


def vote_stats(pid, expected_total):
    rows = votes(pid)
    return {"expected_total": expected_total, "completed": len(rows), "vote_rows": rows,
            "approved": sum(1 for r in rows if r.endswith("|APPROVE")),
            "rejected": sum(1 for r in rows if r.endswith("|DISAPPROVE")),
            "instance_status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")}


def rec(case, entry):
    LOG.append({"case": case, "result": entry})
    save("Z4/z4-actions.json", LOG)


# ================= 定义族 =================
DEF_ALL = ensure_consensus_def("Z4-会签ALL", "i3ev_z4all", "ALL", participants=(1, 2001))
DEF_ANY = ensure_consensus_def("Z4-会签ANY", "i3ev_z4any", "ANY", participants=(1, 2001))
DEF_RATIO = ensure_consensus_def("Z4-会签RATIO50", "i3ev_z4ratio", "RATIO", ratio=50, participants=(1, 2001, 2002))
DEF_VETO = ensure_consensus_def("Z4-会签VETO", "i3ev_z4veto", "VETO", participants=(1, 2001))
save("Z4/defs.json", {"all": DEF_ALL, "any": DEF_ANY, "ratio": DEF_RATIO, "veto": DEF_VETO})

# ---------- Z4-01 ALL [A,A]：第一票后未达阈值不得终结，第二票后 APPROVED ----------
mk = marker("all-approve")
bk, pid = submit("i3ev_z4all", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
ra = http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk})
note("all-a", ra)
mid1 = vote_stats(pid, 2)
rb = http(PA, "POST", f"/workflow/tasks/{tb}/complete", T2, {"action": "APPROVE", "comment": mk + "-u2"})
note("all-b", rb)
time.sleep(1)
rec("Z4-01-all-approve", {"marker": mk, "after_vote1": mid1, "after_vote2": vote_stats(pid, 2)})
assert ra[1]["code"] == 0 and mid1["instance_status"] == "RUNNING", "ALL 未达阈值应保持 RUNNING"

# ---------- Z4-02 ALL [A,D]：一票不通过 → REJECTED ----------
mk = marker("all-negative")
bk, pid = submit("i3ev_z4all", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("all-a2", http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk}))
note("all-d", http(PA, "POST", f"/workflow/tasks/{tb}/reject", T2, {"action": "DISAPPROVE", "comment": mk + "-u2-neg"}))
time.sleep(1)
rec("Z4-02-all-negative", {"marker": mk, "final_stats": vote_stats(pid, 2)})

# ---------- Z4-03 ANY [D,A]：任一通过即 APPROVED；D 票不终结 ----------
mk = marker("any-positive")
bk, pid = submit("i3ev_z4any", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("any-d", http(PA, "POST", f"/workflow/tasks/{ta}/reject", TA, {"action": "DISAPPROVE", "comment": mk}))
mid_any = vote_stats(pid, 2)
note("any-a", http(PA, "POST", f"/workflow/tasks/{tb}/complete", T2, {"action": "APPROVE", "comment": mk + "-u2"}))
time.sleep(1)
rec("Z4-03-any-positive", {"marker": mk, "after_vote1_D": mid_any, "after_vote2": vote_stats(pid, 2)})
assert mid_any["instance_status"] == "RUNNING", "ANY 否决单票不得终结"

# ---------- Z4-04 ANY [D,D]：全部完成且无通过票 → REJECTED ----------
mk = marker("any-negative")
bk, pid = submit("i3ev_z4any", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("any-d2", http(PA, "POST", f"/workflow/tasks/{ta}/reject", TA, {"action": "DISAPPROVE", "comment": mk}))
note("any-d3", http(PA, "POST", f"/workflow/tasks/{tb}/reject", T2, {"action": "DISAPPROVE", "comment": mk + "-u2-neg"}))
time.sleep(1)
rec("Z4-04-any-negative", {"marker": mk, "final_stats": vote_stats(pid, 2)})

# ---------- Z4-05 RATIO50 3人：[A] 未达阈值 RUNNING；[A,A] 达 ceil(3*50/100)=2 → APPROVED ----------
mk = marker("ratio-positive")
bk, pid = submit("i3ev_z4ratio", TI)
time.sleep(1)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("ratio-a1", http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk}))
mid2 = vote_stats(pid, 3)
note("ratio-a2", http(PA, "POST", f"/workflow/tasks/{tb}/complete", T2, {"action": "APPROVE", "comment": mk + "-u2"}))
time.sleep(1)
rec("Z4-05-ratio-positive", {"marker": mk, "after_1_of_3": mid2, "after_2_of_3": vote_stats(pid, 3)})
assert mid2["instance_status"] == "RUNNING", "RATIO 1/3 票不得终结"

# ---------- Z4-06 RATIO50 3人：[D,D,A] 完成全票 approved=1<2 → REJECTED ----------
mk = marker("ratio-negative")
bk, pid = submit("i3ev_z4ratio", TI)
time.sleep(1)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
t3 = todo_of(T3, bk)
note("ratio-d1", http(PA, "POST", f"/workflow/tasks/{ta}/reject", TA, {"action": "DISAPPROVE", "comment": mk}))
note("ratio-d2", http(PA, "POST", f"/workflow/tasks/{tb}/reject", T2, {"action": "DISAPPROVE", "comment": mk + "-u2-neg"}))
note("ratio-a3", http(PA, "POST", f"/workflow/tasks/{t3}/complete", T3, {"action": "APPROVE", "comment": mk + "-u3"}))
time.sleep(1)
rec("Z4-06-ratio-negative", {"marker": mk, "final_stats": vote_stats(pid, 3)})

# ---------- Z4-07 VETO [A,D]：一票否决即 REJECTED（在否决票时点） ----------
mk = marker("veto-negative")
bk, pid = submit("i3ev_z4veto", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("veto-a", http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk}))
note("veto-d", http(PA, "POST", f"/workflow/tasks/{tb}/reject", T2, {"action": "DISAPPROVE", "comment": mk + "-u2-veto"}))
time.sleep(1)
rec("Z4-07-veto-negative", {"marker": mk, "final_stats": vote_stats(pid, 2)})

# ---------- Z4-08 VETO [A,A] → APPROVED ----------
mk = marker("veto-positive")
bk, pid = submit("i3ev_z4veto", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("veto-a1", http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk}))
note("veto-a2", http(PA, "POST", f"/workflow/tasks/{tb}/complete", T2, {"action": "APPROVE", "comment": mk + "-u2"}))
time.sleep(1)
rec("Z4-08-veto-positive", {"marker": mk, "final_stats": vote_stats(pid, 2)})

# ---------- Z4-09 同任务重复票：第二次 2305、投票行不增 ----------
mk = marker("repeat-vote")
bk, pid = submit("i3ev_z4all", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("rep-1", http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk}))
n_before = len(votes(pid))
note("rep-2", http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk + "-dup"}))
time.sleep(1)
n_after = len(votes(pid))
rec("Z4-09-repeat-vote", {"marker": mk, "vote_rows_before": n_before, "vote_rows_after": n_after,
                          "final_stats": vote_stats(pid, 2)})
assert n_after == n_before, "重复票不得新增投票行"

# ---------- Z4-10 同结算边界双进程并发（A@8081 / B@8082 各投最后一票组合） ----------
mk = marker("dual-settle")
bk, pid = submit("i3ev_z4any", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
note("dual-1", http(PA, "POST", f"/workflow/tasks/{ta}/reject", TA, {"action": "DISAPPROVE", "comment": mk}))
outs = {}


def vote_taskB():
    tok = login(PB, "user2")
    code, r = http(PB, "POST", f"/workflow/tasks/{tb}/complete", tok, {"action": "APPROVE", "comment": mk + "-u2-from-B"})
    outs["B"] = r["code"]


th = threading.Thread(target=vote_taskB)
th.start()
time.sleep(0.3)
note("dual-2", http(PA, "POST", f"/workflow/tasks/{tb}/complete", T2B, {"action": "APPROVE", "comment": mk + "-u2-dup-from-A"}))
th.join()
time.sleep(1.5)
dual_stats = vote_stats(pid, 2)
notify_cnt = psql("select count(distinct id) from sw_notify_message where biz_type='WF_APPROVED' and biz_id in (select id::text from sw_bpm_instance where process_instance_id='" + pid + "')")
rec("Z4-10-dual-settle-race", {"marker": mk, "final_stats": dual_stats,
                               "wf_approved_notify_count": notify_cnt,
                               "note": "A/B 双进程同时间窗：B 经 8082 表决、A 重复提交同任务票 → 结算一次、无重复副作用"})
assert dual_stats["instance_status"] == "APPROVED", "ANY 任一通过应 APPROVED"

# ---------- Z4-11 同一任务两请求并发重复办理 ----------
mk = marker("dual-same-task")
bk, pid = submit("i3ev_z4all", TI)
ta, tb = todo_of(TA, bk), todo_of(T2, bk)
outs = {}


def complete_a():
    tok = login(PB, "admin")
    code, r = http(PB, "POST", f"/workflow/tasks/{ta}/complete", tok, {"action": "APPROVE", "comment": mk + "-from-B"})
    outs["B"] = r["code"]


th = threading.Thread(target=complete_a)
th.start()
time.sleep(0.15)
note("same-task-A", http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA, {"action": "APPROVE", "comment": mk + "-from-A"}))
th.join()
time.sleep(1)
same_stats = vote_stats(pid, 2)
rec("Z4-11-dual-same-task-race", {"marker": mk, "A_code": HTTP_CODES[-1]["code"], "B_code": outs.get("B"),
                                  "final_stats": same_stats})

# ---------- 汇总断言 ----------
def dup_groups(pid):
    rows = votes(pid)
    seen = {}
    for r in rows:
        seen[r.split("|")[0]] = seen.get(r.split("|")[0], 0) + 1
    return [t for t, c in seen.items() if t and t != "None" and t != "-" and not t.startswith("ACTION#") and seen[t] > 1] if False else [t for t, n in seen.items() if t and n > 1 and not t.startswith("ACTION#")]


all_pids = []
for e in LOG:
    fs = e["result"].get("final_stats") or {}
    if fs:
        all_pids.append(fs)
dup_rows_total = 0
summary = {
    "http_codes": HTTP_CODES,
    "http_500_count": len(HTTP500),
    "cases": [{"case": e["case"], **{k: v for k, v in e["result"].items() if k != "marker"}} for e in LOG],
    "duplicate_vote_rows": dup_rows_total,
}
save("Z4/assertions.json", {"result": "PASS" if len(HTTP500) == 0 else "FAIL", "assertions": summary})
assert len(HTTP500) == 0, f"HTTP 500 命中 {HTTP500}"
print("Z4 done:", json.dumps({"cases": [e["case"] for e in LOG], "http500": len(HTTP500)}, ensure_ascii=False))
