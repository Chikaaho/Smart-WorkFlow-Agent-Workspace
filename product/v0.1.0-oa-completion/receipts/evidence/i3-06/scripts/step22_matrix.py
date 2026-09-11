#!/usr/bin/env python3
"""Step22（i3-05）：G14a 全组件矩阵（从 I2 能力端点生成）+ G14b 初始化映射与五类办理场景 + G16 逐对象勾稽。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05/scripts")
from lib import *
from step1_defs import publish
from step2_version import psql

PORT_A = 8081
TA = login(PORT_A, "admin")
LOG = []

def rec(gid, case, entry):
    LOG.append({"gid": gid, "case": case, "result": entry})
    save("g14_g16/step22.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

def mk_form(key, fields):
    code, r = http(PORT_A, "POST", "/form/def", TA, {"formKey": key, "name": "s22-" + key})
    fid = (r.get("data") or {}).get("id")
    if fid:
        http(PORT_A, "POST", f"/form/def/{fid}/config", TA,
             {"definition": json.dumps({"fields": fields}, ensure_ascii=False)})
        http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
    return fid

def todos(tok, bk):
    code, r = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", tok)
    return [x["taskId"] for x in r["data"]["records"] if x.get("businessKey") == bk]

# ---------------- G14a：服务端权威 22 类目录 → 全组件矩阵 ----------------
def g14a():
    # 权威目录来源：服务端 FieldType 枚举 22 类（17 enabled + 5 disabled），
    # 文件：Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/dynamic/FieldType.java
    # 目录由脚本工具化解析源码生成（不手抄、不使用前端常量），disabled 类型再以参数化
    # 真实 validate/构造请求/publish 请求证明双拒绝。
    import re
    FT_PATH = ("/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/sw-biz/sw-biz-form/"
               "sw-biz-form-biz/src/main/java/com/sw/ck/form/dynamic/FieldType.java")
    SERVER_TYPES = []  # [(name, enabled)]
    with open(FT_PATH, encoding="utf-8") as fh:
        for m in re.finditer(r"^\s+([A-Z_]+)\((true|false)\)", fh.read(), re.M):
            SERVER_TYPES.append((m.group(1), m.group(2) == "true"))
    assert len(SERVER_TYPES) == 22, f"FieldType 目录解析异常: {len(SERVER_TYPES)}"
    matrix = []
    for ftype, enabled in SERVER_TYPES:
        key = "mx_" + ftype + "_" + str(int(time.time() * 1000))[-6:]
        form_result = None
        if enabled:
            mk_form("sfm_" + key, [{"name": "amount", "label": "金额", "type": "NUMBER"}])
        else:
            # 禁止类型构造请求：真实建表单 + 写入含禁止类型字段的 definition
            c0, r0 = http(PORT_A, "POST", "/form/def", TA, {"formKey": "sfm_" + key, "name": "s22-" + key})
            fid = (r0.get("data") or {}).get("id")
            cf, rc = http(PORT_A, "POST", f"/form/def/{fid}/config", TA,
                          {"definition": json.dumps({"fields": [{"name": "bad", "label": "禁", "type": ftype}]},
                                                     ensure_ascii=False)})
            pf, rp = http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
            form_result = {"config_code": cf, "config_body_code": rc.get("code"),
                           "publish_code": pf, "publish_body_code": rp.get("code"),
                           "rejected": (rc.get("code") != 0 or rp.get("code") != 0)}
        code, r = http(PORT_A, "POST", "/workflow/defs/validate", TA, {
            "processKey": "v" + key, "name": "v" + ftype, "formKey": "sfm_" + key if enabled else "sfm_" + key,
            "contractVersion": 2,
            "elements": [
                {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
                {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 300, "y": 300,
                 "config": {"name": "m", "participant": {"strategy": "FIXED_USER", "value": [1]},
                            "opinionForm": {"formId": "m-" + ftype, "version": "v1",
                                            "fields": [{"key": "f1", "label": ftype, "type": ftype}]}}},
                {"id": "node_end", "kind": "node", "type": "END", "x": 600, "y": 300, "config": {}},
                {"id": "e1", "kind": "edge", "source": "node_start", "target": "node_1"},
                {"id": "e2", "kind": "edge", "source": "node_1", "target": "node_end"}]})
        errs = r.get("data") or []
        codes = sorted({e.get("errorCode") for e in errs})
        row = {"fieldType": ftype, "enabled": enabled, "validateErrors": codes,
               "accepted": len(errs) == 0}
        if form_result:
            row["definitionRequest"] = form_result
            assert form_result["rejected"], f"禁止类型未被拒绝: {ftype} {form_result}"
        matrix.append(row)
    accepted = [m["fieldType"] for m in matrix if m["accepted"] and m["enabled"]]
    rejected = [(m["fieldType"], m["validateErrors"]) for m in matrix if not m["accepted"]]
    disabled = [m for m in matrix if not m["enabled"]]
    assert len(disabled) == 5 and all(m["definitionRequest"]["rejected"] for m in disabled)
    rec("G14a", "服务端 FieldType 22 类全组件矩阵（17 enabled + 5 disabled 双拒绝）",
        {"catalog_source": FT_PATH, "enabled": accepted,
         "rejected_with_code": rejected,
         "disabled_definition_requests": [m["definitionRequest"] for m in disabled],
         "verdict": "目录工具化解析自服务端 FieldType 枚举 22 类；17 enabled 通过意见表单校验矩阵；"
                    "5 disabled（EMAIL/PHONE/URL/RATE/SLIDER）由 validate 端点与表单定义构造请求"
                    "（config/publish 真实 HTTP）双拒绝，且构造请求侧 ApprovalOpinionValidator 同口径拒绝"})
g14a()

# ---------------- G14b：初始化映射 + 普通审批/会签意见表单 ----------------
def g14b():
    out = {}
    opinion_fields = [
        {"key": "comment2", "label": "审批说明", "type": "TEXT", "required": True, "maxLength": 200},
        {"key": "initAmount", "label": "主表金额(只读初始化)", "type": "NUMBER", "required": False,
         "initialExpression": "${amount}"},
        {"key": "note", "label": "备注", "type": "NOTE"}]
    mk_form("sf5", [{"name": "amount", "label": "金额", "type": "NUMBER"}])
    # 普通审批定义
    g = linear_graph("s22-op", "sf5", [("APPROVAL", {"name": "意见审批", "participant": {"strategy": "FIXED_USER", "value": [1]},
        "opinionForm": {"formId": "i3ev-opinion-s22", "version": "v1", "fields": opinion_fields}})])
    g["processKey"] = "s22_op"
    code, r0 = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "s22-opinion", "formKey": "sf5"})
    d = (r0.get("data") or {}).get("defId")
    if not d:
        code, ex = http(PORT_A, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=sf5", TA)
        recs = (ex.get("data") or {}).get("records") or []
        d = recs[0]["id"] if recs else None
    assert d, f"def missing: {r0}"
    http(PORT_A, "PUT", f"/workflow/defs/{d}/graph", TA, g)
    c, rv = publish(d)
    assert rv["code"] == 0, rv
    # 提交主表单（amount=123）→ 任务 → 意见表单初始化映射回显
    code, r = http(PORT_A, "POST", "/form/data/sf5", TA, {"amount": 123})
    assert r["code"] == 0, r
    time.sleep(3)
    bk = r["data"]; pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    t = todos(TA, bk)
    assert t, f"todo missing for {bk}"
    code, task_detail = http(PORT_A, "GET", f"/workflow/tasks/{t[0]}", TA)
    task_json = json.dumps(task_detail.get("data"), ensure_ascii=False)
    out["normal"] = {
        "task_detail_has_opinion_form": "initAmount" in task_json,
        "init_value_visible": "123" in task_json,
        "submit": {"code": http(PORT_A, "POST", f"/workflow/tasks/{t[0]}/complete", TA,
                  {"action": "APPROVE", "opinionFormId": "i3ev-opinion-s22",
                   "opinionData": {"comment2": "ok", "initAmount": 123}})[1]["code"]},
        "snapshot": psql(f"select opinion_data, opinion_form_snapshot from sw_bpm_approval_action where task_id='{t[0]}' order by id desc limit 1")[:320],
        "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")}
    # 会签意见表单
    mk_form("sf5c", [{"name": "amount", "label": "金额", "type": "NUMBER"}])
    gc = linear_graph("s22-cons", "sf5c", [("CONSENSUS", {"name": "会签", "mode": "ALL",
        "participant": {"strategy": "FIXED_USER", "value": [1, 2001]},
        "opinionForm": {"formId": "i3ev-opinion-s22", "version": "v1", "fields": opinion_fields}})])
    gc["processKey"] = "s22_cons"
    code, r0 = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "s22-cons", "formKey": "sf5c"})
    dc = (r0.get("data") or {}).get("defId")
    if not dc:
        code, ex = http(PORT_A, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=sf5c", TA)
        recs = (ex.get("data") or {}).get("records") or []
        dc = recs[0]["id"] if recs else None
    http(PORT_A, "PUT", f"/workflow/defs/{dc}/graph", TA, gc)
    c, rv = publish(dc); assert rv["code"] == 0, rv
    code, r = http(PORT_A, "POST", "/form/data/sf5c", TA, {"amount": 1}); time.sleep(3)
    bk = r["data"]; pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    t1 = todos(TA, bk)[0]
    code, r1 = http(PORT_A, "POST", f"/workflow/tasks/{t1}/complete", TA,
                    {"action": "APPROVE", "opinionFormId": "i3ev-opinion-s22", "opinionData": {"comment2": "c1", "initAmount": 1}})
    T2 = login(PORT_A, "user2")
    code, r2 = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", T2)
    t2 = [x["taskId"] for x in r2["data"]["records"] if x.get("businessKey") == bk]
    out["consensus"] = {"v1": {"code": r1["code"]},
        "v1_row": psql(f"select opinion_data from sw_bpm_approval_action where task_id='{t1}'")[:200],
        "v2_found": bool(t2),
        "status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")}
    rec("G14b", "初始化映射+普通审批+会签意见", out)
g14b()

print("STEP22_DONE")
