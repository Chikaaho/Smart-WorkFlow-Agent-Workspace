#!/usr/bin/env python3
"""Step9: G14 干净环境全链——绑定补种、快照、不可变、矩阵、G15 跨租户。"""
import json, sys, time, subprocess
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05")
from lib import *
set_raw_dir("raw/step9")
from step2_version import psql

PORT_A = 8081
PORT_B = 8082
TA = login(PORT_A, "admin")
import hashlib; open(EV + "/env/credential-sha256.txt", "a").write("admin@8081 accessToken_sha256=" + hashlib.sha256(TA.encode()).hexdigest() + " (原始 token 不落盘)")
out = {}

def form(key, name, fields):
    code, r = http(PORT_A, "POST", "/form/def", TA, {"formKey": key, "name": name})
    fid = (r.get("data") or {}).get("id")
    http(PORT_A, "POST", f"/form/def/{fid}/config", TA,
         {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]})})
    c, rp = http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
    return fid

def def_(key, name, form_key, graph):
    graph = dict(graph); graph["processKey"] = f"i3ev_{key}"
    code, r = http(PORT_A, "POST", "/workflow/defs", TA, {"name": name, "formKey": form_key})
    def_id = r["data"]["defId"]
    http(PORT_A, "PUT", f"/workflow/defs/{def_id}/graph", TA, graph)
    code, rv = http(PORT_A, "POST", f"/workflow/defs/{def_id}/validate", TA)
    errs = rv["data"]
    assert errs == [], f"validate {key}: {errs}"
    c, rp = http(PORT_A, "POST", f"/workflow/defs/{def_id}/publish", TA)
    assert rp["code"] == 0, f"publish {key}: {rp}"
    return def_id, rp["data"]

# G0/G15 基础身份
PGPORT = open("/tmp/i3-03/pg-port.txt").read().strip()
def psql_(sql):
    o = subprocess.run(["psql", "-h", "localhost", "-p", PGPORT, "-U", "postgres", "-d", "smart_workflow", "-tAc", sql],
                       env={**os.environ, "PGPASSWORD": "[REDACTED_PASSWORD]"}, capture_output=True, text=True)
    import lib
    lib._raw_write(f"===== PSQL {time.strftime('%Y-%m-%dT%H:%M:%S')} =====\n{sql}\n"
                   f"----- RESULT (exit={o.returncode}) -----\n{o.stdout.strip()}"
                   + (f"\nSTDERR: {o.stderr.strip()}" if o.stderr.strip() else "") + "\n\n")
    return o.stdout.strip()

psql_("""INSERT INTO sys_user (id, create_time, update_time, deleted, tenant_id, version, username, password, real_name, dept_id, status, is_admin)
VALUES (2001, now(), now(), 0, 0, 0, 'user2', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '审批人二号', 1, 0, 0),
 (2003, now(), now(), 0, 0, 0, 'user4', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '沟通接收人', 1, 0, 0),
 (2901, now(), now(), 0, 1, 0, 'tenant1user', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '跨租户用户', 1, 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO sys_user_role (id, create_time, update_time, deleted, tenant_id, version, user_id, role_id)
VALUES (2101, now(), now(), 0, 0, 0, 2001, 1),(2103, now(), now(), 0, 0, 0, 2003, 1),(2901, now(), now(), 0, 1, 0, 2901, 1)
ON CONFLICT (id) DO NOTHING;""")
T2 = login(PORT_A, "user2")
T4 = login(PORT_A, "user4")
try:
    TT1 = login(PORT_A, "tenant1user")
except Exception:
    TT1 = None

# G14 主体
form("i3ev_o4", "I3证据-意见表单O4", [])
opinion_fields = [
    {"key": "comment2", "label": "审批说明", "type": "TEXT", "required": True, "maxLength": 200},
    {"key": "level", "label": "等级", "type": "RADIO", "options": ["A", "B"], "required": True},
    {"key": "note", "label": "备注", "type": "NOTE"}]
g = linear_graph("I3证据-意见O4", "i3ev_o4", [("APPROVAL", {"name": "意见审批", "participant": {"strategy": "FIXED_USER", "value": [1]}, "opinionForm": {"formId": "i3ev-opinion-o4", "version": "v1", "fields": opinion_fields}})])
d4, rpub = def_("i3ev_o4", "I3证据-意见O4", "i3ev_o4", g)
out["defId"] = d4
out["frozen_v1"] = {"version": rpub["defVersion"], "processDefinitionId": rpub["processDefinitionId"]}

def submit(port, token, key, retries=2):
    code, r = http(port, "POST", f"/form/data/{key}", token, {"amount": 1})
    assert r["code"] == 0, r
    time.sleep(6)
    rec = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{rec}'")
    binding = psql(f"select active from sw_bpm_form_binding where form_key='{key}' order by id desc limit 1")
    t = None
    code, r = http(port, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", token)
    for row in r["data"]["records"]:
        if row.get("businessKey") == rec:
            t = row
    return rec, pid, binding, t

# 实例1 缺必填
rec1, pid1, bind1, t1 = submit(PORT_B, TA, "i3ev_o4")
out["binding_after_publish"] = bind1
code, r_miss = http(PORT_A, "POST", f"/workflow/tasks/{t1['taskId']}/complete", TA,
                    {"action": "APPROVE", "opinionData": {"comment2": ""}})
out["missing_required_rejected"] = {"code": r_miss["code"], "msg": r_miss.get("msg")}

# 实例2 非法 RADIO
rec2, pid2, bind2, t2 = submit(PORT_B, TA, "i3ev_o4")
code, r_bad = http(PORT_A, "POST", f"/workflow/tasks/{t2['taskId']}/complete", TA,
                   {"action": "APPROVE", "opinionData": {"comment2": "ok", "level": "Z"}})
out["bad_radio_rejected"] = {"code": r_bad["code"], "msg": r_bad.get("msg")}

# 实例3 合法提交 + 快照
rec3, pid3, bind3, t3 = submit(PORT_B, TA, "i3ev_o4")
code, r_ok = http(PORT_A, "POST", f"/workflow/tasks/{t3['taskId']}/complete", TA,
                  {"action": "APPROVE", "opinionData": {"comment2": "同意", "level": "A"},
                   "opinionFormId": "i3ev-opinion-o4", "opinionFormVersion": "v1"})
out["valid_submit"] = {"code": r_ok["code"]}
out["action_row_v1"] = psql(f"select action, opinion_form_id, opinion_form_version, opinion_data from sw_bpm_approval_action where task_id='{t3['taskId']}'")
snap_v1 = psql(f"select opinion_form_snapshot from sw_bpm_approval_action where task_id='{t3['taskId']}'")
out["snapshot_v1"] = json.loads(snap_v1) if snap_v1 else None

# v2 修改意见定义 → 历史 v1 快照不可变
code, g1 = http(PORT_A, "GET", f"/workflow/defs/{d4}", TA)
graph = g1["data"]
for e in graph["elements"]:
    if e.get("type") == "APPROVAL":
        e["config"]["opinionForm"]["fields"] = [
            {"key": "comment2", "label": "审批说明(改)", "type": "TEXTAREA", "required": False},
            {"key": "level", "label": "等级(改)", "type": "SELECT", "options": ["X", "Y"], "required": False}]
http(PORT_A, "PUT", f"/workflow/defs/{d4}/graph", TA, graph)
c, rp2 = http(PORT_A, "POST", f"/workflow/defs/{d4}/publish", TA)
out["v2_publish"] = {"code": rp2["code"], "version": rp2["data"]["defVersion"]}
snap_v1_after = psql(f"select opinion_form_snapshot from sw_bpm_approval_action where task_id='{t3['taskId']}'")
out["immutable_snapshot_after_v2"] = (snap_v1 == snap_v1_after)

# v2 新提交按 v2 解释（comment2 可省）
rec4, pid4, bind4, t4 = submit(PORT_B, TA, "i3ev_o4")
code, r_v2 = http(PORT_A, "POST", f"/workflow/tasks/{t4['taskId']}/complete", TA,
                  {"action": "APPROVE", "opinionData": {}})
out["v2_submit_by_v2_rules"] = {"code": r_v2["code"]}

# 矩阵（仅发布校验：8 类支持 / RICH_TEXT 拒绝）
matrix = []
for ftype in ["TEXT", "TEXTAREA", "NUMBER", "RADIO", "CHECKBOX", "SELECT", "DATETIME", "NOTE", "RICH_TEXT"]:
    suffix = str(int(time.time() * 1000))[-6:]
    g2 = linear_graph("I3矩阵" + ftype, f"i3ev_mx_{ftype}_{suffix}", [("APPROVAL", {"name": "m", "participant": {"strategy": "FIXED_USER", "value": [1]}, "opinionForm": {"formId": "m-" + ftype, "version": "v1", "fields": [{"key": "f1", "label": ftype, "type": ftype}]}})])
    suffix = str(int(time.time() * 1000))[-6:]
    mform = f"i3ev_mx_{ftype}_{suffix}"
    code, rf = http(PORT_A, "POST", "/form/def", TA, {"formKey": mform, "name": "mx-" + ftype})
    mfid = (rf.get("data") or {}).get("id")
    if mfid:
        http(PORT_A, "POST", f"/form/def/{mfid}/config", TA, {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]})})
        http(PORT_A, "POST", f"/form/def/{mfid}/publish", TA)
    code, r0 = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "I3矩阵" + ftype + suffix, "formKey": mform})
    mid = (r0.get("data") or {}).get("defId")
    if not mid:
        code, ex = http(PORT_A, "GET", f"/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_mx_{ftype}_{suffix}", TA)
        recs = (ex.get("data") or {}).get("records") or []
        mid = recs[0]["id"] if recs else None
    http(PORT_A, "PUT", f"/workflow/defs/{mid}/graph", TA, g2)
    code, rv = http(PORT_A, "POST", f"/workflow/defs/{mid}/publish", TA)
    matrix.append({"fieldType": ftype, "publishAccepted": rv["code"] == 0,
                   "rejectCode": None if rv["code"] == 0 else rv["code"]})
out["component_matrix"] = matrix

# G15 跨租户
rec5, pid5, _, t5 = submit(PORT_B, TA, "i3ev_o4")
if TT1:
    code, rt = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", TT1)
    rows = rt["data"]["records"]
    out["g15"] = {"cross_tenant_todo_count": len(rows),
                  "leak": any(x.get("businessKey") == rec5 for x in rows)}
    code, ra = http(PORT_A, "POST", f"/workflow/tasks/{t5['taskId']}/complete", TT1, {"action": "APPROVE"})
    out["g15"]["cross_tenant_complete"] = {"code": ra["code"], "msg": ra.get("msg")}

save("g14_opinion/step9.json", json.dumps(out, ensure_ascii=False, indent=2, default=str))
print(json.dumps(out, ensure_ascii=False)[:900])
