#!/usr/bin/env python3
"""Step4-modes: G8 会签模式矩阵——ALL负向 / ANY正反 / RATIO正反 / VETO正向（顺序投票形态；
双进程竞争形态由 step4_dual.py 三场景承担）。每例 HTTP 原始报文经 lib 自动落盘。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05")
from lib import *
set_raw_dir("raw/step4modes")
from step2_version import psql
from step1_defs import publish

PORT_A = 8081
TA = login(PORT_A, "admin")
T2 = login(PORT_A, "user2")
LOG = []

def mk_form(key):
    code, r = http(PORT_A, "POST", "/form/def", TA, {"formKey": key, "name": "I3证据-" + key})
    fid = (r.get("data") or {}).get("id")
    if fid:
        http(PORT_A, "POST", f"/form/def/{fid}/config", TA,
             {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]})})
        http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
    return fid

def mk_def(def_key, name, form_key, mode, ratio=None):
    cfg = {"name": "会签" + mode, "participant": {"strategy": "FIXED_USER", "value": [1, 2001]}, "mode": mode}
    if ratio is not None:
        cfg["ratio"] = ratio
    g = linear_graph(name, form_key, [("CONSENSUS", cfg)])
    g["processKey"] = f"i3ev_{def_key}"
    code, r0 = http(PORT_A, "POST", "/workflow/defs", TA, {"name": name, "formKey": form_key})
    def_id = r0["data"]["defId"]
    http(PORT_A, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    c, rv = publish(def_id)
    assert rv["code"] == 0, f"publish {def_key}: {rv}"
    return def_id

def submit(form_key, token, data=None):
    code, r = http(PORT_A, "POST", f"/form/data/{form_key}", token, data or {"amount": 0})
    assert r["code"] == 0, r
    time.sleep(2)
    rec = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{rec}'")
    return rec, pid

def todos(token, business_key):
    code, r = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=50", token)
    return [row for row in r["data"]["records"] if row.get("businessKey") == business_key]

def vote(task_id, token, path, action):
    code, r = http(PORT_A, "POST", f"/workflow/tasks/{task_id}/{path}", token, {"action": action, "comment": "modes"})
    return {"code": r["code"], "msg": r.get("msg")}

def run_case(name, form_key, def_id, votes_spec):
    """votes_spec: [(token, action)] 顺序投票；返回状态/票数/行为字典。"""
    rec, pid = submit(form_key, TA)
    out = {"votes": []}
    for i, (token, action) in enumerate(votes_spec):
        rows = todos(token, rec)
        task = rows[0]["taskId"] if rows else None
        path = "reject" if action in ("DISAPPROVE",) else "complete"
        out["votes"].append({"actor": "admin" if token == TA else "user2",
                             "action": action, **vote(task, token, path, action)})
        time.sleep(1)
    time.sleep(1)
    out["instance_status"] = psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")
    out["votes_total"] = psql(f"select count(*) from sw_bpm_consensus_vote where process_instance_id='{pid}'")
    out["settled"] = psql(f"select settlement_status from sw_bpm_approval_action where process_instance_id='{pid}' and settlement_status='CONSENSUS_SETTLED' limit 1")
    return out

results = []

# ALL 负向：admin DISAPPROVE → REJECTED（未待 user2 表态即负向终局，ALL 语义）
mk_form("i3ev_m_all2")
mk_def("m_all2", "I3证据-会签ALL负向", "i3ev_m_all2", "ALL")
results.append({"case": "ALL 负向（一票不通过）", "result": run_case("all2-neg", "i3ev_m_all2", None, [(TA, "DISAPPROVE")])})

# ANY 正向：user2 一票 APPROVE → APPROVED
mk_form("i3ev_m_any")
mk_def("m_any", "I3证据-会签ANY", "i3ev_m_any", "ANY")
results.append({"case": "ANY 正向（一票通过）", "result": run_case("any-pos", "i3ev_m_any", None, [(T2, "APPROVE")])})

# ANY 负向：两人都不通过 → REJECTED
mk_form("i3ev_m_any2")
mk_def("m_any2", "I3证据-会签ANY负向", "i3ev_m_any2", "ANY")
results.append({"case": "ANY 负向（全不通过）", "result": run_case("any-neg", "i3ev_m_any2", None, [(TA, "DISAPPROVE"), (T2, "DISAPPROVE")])})

# RATIO 正向：50% → 1 票即过
mk_form("i3ev_m_ratio")
mk_def("m_ratio", "I3证据-会签RATIO50", "i3ev_m_ratio", "RATIO", ratio=50)
results.append({"case": "RATIO 50% 正向（1/2 票）", "result": run_case("ratio-pos", "i3ev_m_ratio", None, [(T2, "APPROVE")])})

# RATIO 负向：50% 需 1 票通过，两票皆不通过 → REJECTED
mk_form("i3ev_m_ratio2")
mk_def("m_ratio2", "I3证据-会签RATIO50负向", "i3ev_m_ratio2", "RATIO", ratio=50)
results.append({"case": "RATIO 50% 负向（0/2 通过票）", "result": run_case("ratio-neg", "i3ev_m_ratio2", None, [(TA, "DISAPPROVE"), (T2, "DISAPPROVE")])})

# VETO 正向：全部通过 → APPROVED
mk_form("i3ev_m_veto2")
mk_def("m_veto2", "I3证据-会签VETO正向", "i3ev_m_veto2", "VETO")
results.append({"case": "VETO 正向（全部通过）", "result": run_case("veto-pos", "i3ev_m_veto2", None, [(TA, "APPROVE"), (T2, "APPROVE")])})

save("g8_dual/step4-modes.json", results)
for r in results:
    print("[OK]" if r["result"]["instance_status"] in ("APPROVED", "REJECTED") else "[CHECK]", r["case"],
          r["result"]["instance_status"], "votes=" + str(r["result"]["votes_total"]))
print("STEP4_MODES_DONE")
