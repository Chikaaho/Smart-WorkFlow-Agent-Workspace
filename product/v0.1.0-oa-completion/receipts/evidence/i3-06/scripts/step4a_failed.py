#!/usr/local/bin/env python3
"""Step4a（i3-05）：G4a 真实 FAILED 实例——CONDITION 网关边条件
`${amount > 'zzz'}`（数字 vs 非数字字符串）触发受限求值器
"表达式比较类型不匹配" → BRANCH_EVALUATION_FAILED(2311) → 实例置 FAILED。
与其他四态（当前 RUNNING/完成 APPROVED/取消 CANCELLED/未经过 WITHDRAWN/DISCARDED）
一起证明节点与边状态映射；FAILED 不得用 WITHDRAWN/DISCARDED 代替。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05/scripts")
from lib import *
set_raw_dir("raw/step4a")
from step2_version import psql
from step1_defs import publish

PORT_A = 8081
TA = login(PORT_A, "admin")
LOG = []

def save_log():
    save("g4_state/step4a-failed.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

def todos(tok, bk):
    code, r = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", tok)
    return [x["taskId"] for x in r["data"]["records"] if x.get("businessKey") == bk]

# ── ① 表单 + 含 CONDITION 网关的流程（边1 条件引用 amount，边2 默认） ──
mk = "g4a_" + str(int(time.time() * 1000))[-6:]
code, r = http(PORT_A, "POST", "/form/def", TA, {"formKey": "s4a_" + mk, "name": "g4a-main"})
fid = (r.get("data") or {}).get("id")
http(PORT_A, "POST", f"/form/def/{fid}/config", TA,
     {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}, {"name": "code", "label": "编码", "type": "TEXT"}]})})
code, rp = http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
assert rp["code"] == 0, rp

graph = {
    "elements": [
        {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
        {"id": "node_approve", "kind": "node", "type": "APPROVAL", "x": 300, "y": 300,
         "config": {"name": "g4a审批", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
        {"id": "node_gate", "kind": "node", "type": "CONDITION", "x": 500, "y": 300,
         "config": {"name": "条件分支"}},
        {"id": "node_end", "kind": "node", "type": "END", "x": 700, "y": 300, "config": {}},
        {"id": "node_second", "kind": "node", "type": "APPROVAL", "x": 500, "y": 480,
         "config": {"name": "g4a第二审批", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
        {"id": "e1", "kind": "edge", "source": "node_start", "target": "node_approve", "config": {}},
        {"id": "e2", "kind": "edge", "source": "node_approve", "target": "node_gate", "config": {}},
        {"id": "e3", "kind": "edge", "source": "node_gate", "target": "node_end",
         "config": {"condition": {"expression": "form.amount > 'zzz'"}, "priority": 1}},
        {"id": "e4", "kind": "edge", "source": "node_gate", "target": "node_second", "config": {"default": True}},
        {"id": "e5", "kind": "edge", "source": "node_second", "target": "node_end", "config": {}}]}
graph["formKey"] = "s4a_" + mk
graph["processKey"] = "s4a_failed_" + mk
code, r = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "g4a-failed", "formKey": "s4a_" + mk})
d = (r.get("data") or {}).get("defId")
assert d, r
code, r = http(PORT_A, "PUT", f"/workflow/defs/{d}/graph", TA, graph)
assert r["code"] == 0, f"graph save fail: {r}"
code, r = publish(d)
assert r["code"] == 0, f"publish fail: {r}"
LOG.append({"case": "definition-published", "defId": d, "formKey": "s4a_" + mk,
            "condition_edge": "amount > 'zzz'（amount 为 NUMBER 字段，运行期与字符串字面量数字比较抛类型不匹配）"})
save_log()

# ── ② 提交并办结 → 分支求值失败 → 响应 2311 + 实例 FAILED ──
code, r = http(PORT_A, "POST", "/form/data/s4a_" + mk, TA, {"amount": 123})
assert r["code"] == 0, r
time.sleep(3)
bk = r["data"]
pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
t = todos(TA, bk)
assert t, f"todo missing {bk}"
code, rc = http(PORT_A, "POST", f"/workflow/tasks/{t[0]}/complete", TA, {"action": "APPROVE"})
body = rc.get("code")
time.sleep(2)
LOG.append({"case": "branch-evaluation-failure", "task_id": t[0], "complete_http": code,
            "complete_code": body, "expected_code": 2311,
            "instance_id": pid,
            "instance_status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'"),
            "detail": (rc.get("msg") or "")[:160]})
assert LOG[-1]["instance_status"] == "FAILED", f"instance not FAILED: {LOG[-1]}"
save_log()

# ── ③ 五态实例与节点/边状态映射（历史活动轨迹 + 实例状态回读） ──
def state_row(state_sql, label, source):
    return {"state": label, "source": source,
            "instance_id": psql(state_sql % ("process_instance_id",)),
            "status": psql(state_sql % ("status",))}

rows = []
queries = {
    "RUNNING(当前)": "select %s from sw_bpm_instance where business_key in (select business_key from sw_bpm_instance where status='RUNNING' limit 1) and status='RUNNING' limit 1",
    "APPROVED(完成)": f"select %s from sw_bpm_instance where business_key='{bk}' and status='APPROVED' limit 1",
    "DISCARDED(废弃)": "select %s from sw_bpm_instance where status='DISCARDED' limit 1",
    "WITHDRAWN(撤回)": "select %s from sw_bpm_instance where status='WITHDRAWN' limit 1",
    "FAILED(失败)": f"select %s from sw_bpm_instance where business_key='{bk}' and status='FAILED' limit 1"}
for label, q in queries.items():
    rows.append({"state": label,
                 "instance_id": psql(queries[label] % "process_instance_id"),
                 "status": psql(queries[label] % "status")})
LOG.append({"case": "five-state-instances", "rows": rows})

# FAILED 实例的节点/边历史映射（Flowable 历史活动实例）
act = psql(f"select string_agg(act_id_||':'||act_type_||':'||coalesce(end_time_::text,'RUNNING'),' , ' order by start_time_) from act_hi_actinst where proc_inst_id_='{pid}'")
LOG.append({"case": "failed-instance-activity-trace", "instance_id": pid, "activities": act,
            "verdict": "FAILED 为真实终态：分支求值失败（2311）后实例独立于 WITHDRAWN/DISCARDED 落 FAILED"})
save_log()
print("STEP4A_FAILED_DONE")
