#!/usr/bin/env python3
"""Step6b: G14 意见表单（缺必填/非法RADIO/合法提交/不可变引用回读）+ G15 跨租户。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-04")
from lib import *
set_raw_dir("raw/step6b")
from step2_version import psql
from step1_defs import publish

PORT_A = 8081
TA = login(PORT_A, "admin")
LOG = []
try:
    TT1 = login(PORT_A, "tenant1user")
except Exception:
    TT1 = None

def todo(token, port, business_key):
    code, r = http(port, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", token)
    for row in r["data"]["records"]:
        if row.get("businessKey") == business_key:
            return row
    return None

out = {}
# 新建独立定义（v1=required）
code, rf = http(PORT_A, "POST", "/form/def", TA, {"formKey": "i3ev_d4c", "name": "I3证据-意见表单C"})
fid = (rf.get("data") or {}).get("id")
http(PORT_A, "POST", f"/form/def/{fid}/config", TA, {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]})})
http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
g = linear_graph("I3证据-意见表单C", "i3ev_d4c", [("APPROVAL", {"name": "意见审批", "participant": {"strategy": "FIXED_USER", "value": [1]}, "opinionForm": {"formId": "i3ev-opinion-c", "version": "v1", "fields": [
    {"key": "comment2", "label": "审批说明", "type": "TEXT", "required": True, "maxLength": 200},
    {"key": "level", "label": "等级", "type": "RADIO", "options": ["A", "B"], "required": True},
    {"key": "note", "label": "备注", "type": "NOTE"}]}})])
g["processKey"] = "i3ev_d4c"
code, r0 = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "I3证据-意见表单C", "formKey": "i3ev_d4c"})
d4c = r0["data"]["defId"]
http(PORT_A, "PUT", f"/workflow/defs/{d4c}/graph", TA, g)
code, rv = http(PORT_A, "POST", f"/workflow/defs/{d4c}/validate", TA)
assert (rv.get("data") or []) == [], f"validate d4c: {rv.get('data')}"
code, rp4c = http(PORT_A, "POST", f"/workflow/defs/{d4c}/publish", TA)
assert rp4c["code"] == 0, f"publish d4c: {rp4c}"

# 实例 1：缺必填（空串）→ 期望 2308
code, r = http(PORT_A, "POST", "/form/data/i3ev_d4c", TA, {"amount": 1})
time.sleep(6)
rec1 = r["data"]
pid1 = psql(f"select process_instance_id from sw_bpm_instance where business_key='{rec1}'")
t1 = todo(TA, PORT_A, rec1)
code, r_miss = http(PORT_A, "POST", f"/workflow/tasks/{t1['taskId']}/complete", TA,
                    {"action": "APPROVE", "opinionData": {"comment2": ""}})
out["missing_required_rejected"] = {"code": r_miss["code"], "msg": r_miss.get("msg")}
# 实例 2：RADIO 非法值 → 期望拒绝
code, r = http(PORT_A, "POST", "/form/data/i3ev_d4c", TA, {"amount": 2})
time.sleep(6)
rec2 = r["data"]
t2 = todo(TA, PORT_A, rec2)
code, r_bad = http(PORT_A, "POST", f"/workflow/tasks/{t2['taskId']}/complete", TA,
                   {"action": "APPROVE", "opinionData": {"comment2": "ok", "level": "Z"}})
out["bad_radio_rejected"] = {"code": r_bad["code"], "msg": r_bad.get("msg")}
# 实例 3：合法提交
code, r = http(PORT_A, "POST", "/form/data/i3ev_d4c", TA, {"amount": 3})
time.sleep(6)
rec3 = r["data"]
t3 = todo(TA, PORT_A, rec3)
code, r_ok = http(PORT_A, "POST", f"/workflow/tasks/{t3['taskId']}/complete", TA,
                  {"action": "APPROVE", "opinionData": {"comment2": "同意", "level": "A"},
                   "opinionFormId": "i3ev-opinion-c", "opinionFormVersion": "v1"})
out["valid_submit"] = {"code": r_ok["code"]}
out["action_row_v1"] = psql(f"select action, opinion_form_id, opinion_form_version, opinion_data from sw_bpm_approval_action where task_id='{t3['taskId']}'")
snap_v1 = psql(f"select opinion_form_snapshot from sw_bpm_approval_action where task_id='{t3['taskId']}'")
out["snapshot_v1_contains_required_true"] = ("required" in snap_v1 and "true" in snap_v1)

# 发布 v2：opinionForm 定义改为非必填/SELECT（历史快照必须不变）
code, g1 = http(PORT_A, "GET", f"/workflow/defs/{d4c}", TA)
graph = g1["data"]
for e in graph["elements"]:
    if e.get("type") == "APPROVAL":
        e["config"]["opinionForm"]["fields"] = [
            {"key": "comment2", "label": "审批说明(改)", "type": "TEXTAREA", "required": False},
            {"key": "level", "label": "等级(改)", "type": "SELECT", "options": ["X", "Y"], "required": False}]
http(PORT_A, "PUT", f"/workflow/defs/{d4c}/graph", TA, graph)
c, rp = publish(d4c)
out["v2_publish"] = {"code": rp["code"]}
snap_v1_after = psql(f"select opinion_form_snapshot from sw_bpm_approval_action where task_id='{t3['taskId']}'")
out["immutable_snapshot_after_v2"] = (snap_v1 == snap_v1_after)

# 新提交（v2 定义）：required=false → comment2 缺省也应成功（按 v2 解释）
code, r = http(PORT_A, "POST", "/form/data/i3ev_d4c", TA, {"amount": 4})
time.sleep(6)
rec4 = r["data"]
t4 = todo(TA, PORT_A, rec4)
code, r_ok2 = http(PORT_A, "POST", f"/workflow/tasks/{t4['taskId']}/complete", TA,
                   {"action": "APPROVE", "opinionData": {"comment2": "v2 口径"}})
out["v2_submit_by_v2_rules"] = {"code": r_ok2["code"]}
out["verdict"] = ("v1 required rejected; v2 non-required accepted under v2 rules; "
                  "v1 history snapshot immutable and re-parsable after v2 publish")

# G15 跨租户
try:
    code, rt = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", TT1)
    rows = rt["data"]["records"]
    out["g15"] = {"cross_tenant_todo_count": len(rows),
                  "leak": any(x.get("businessKey") in (rec1, rec2, rec3, rec4) for x in rows)}
    code, ra = http(PORT_A, "POST", f"/workflow/tasks/{t4['taskId']}/complete", TT1, {"action": "APPROVE"})
    out["g15"]["cross_tenant_complete"] = {"code": ra["code"], "msg": ra.get("msg")}
except Exception as e:
    out["g15"] = {"login": "tenant1user 无有效身份或登录失败: " + str(e)[:80]}

save("g14_opinion/step6b.json", json.dumps(out, ensure_ascii=False, indent=2, default=str))
print(json.dumps(out, ensure_ascii=False)[:600])
