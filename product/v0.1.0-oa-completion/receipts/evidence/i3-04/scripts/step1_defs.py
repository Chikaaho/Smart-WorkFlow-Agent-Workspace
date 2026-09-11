#!/usr/bin/env python3
"""Step1: 表单族 + 定义族 + 发布/版本链（G1-G5）+ 实例族创建。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-04")
from lib import *
set_raw_dir("raw/step1")

PORT_A, PORT_B = 8081, 8082
TA = login(PORT_A, "admin")
save("env/token-admin-a.txt", TA)
ids = {}

def create_form(key, name, fields):
    code, r = http(PORT_A, "POST", "/form/def", TA, {"formKey": key, "name": name, "logicalTableName": "", "description": "I3-03 evidence"})
    fid = (r.get("data") or {}).get("id")
    if not fid:
        codeb, rb = http(PORT_A, "GET", f"/form/def/by-key/{key}", TA)
        fid = rb["data"]["id"]
    definition = json.dumps({"fields": fields}, ensure_ascii=False)
    code2, r2 = http(PORT_A, "POST", f"/form/def/{fid}/config", TA, {"definition": definition})
    code3, r3 = http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
    assert code3 == 200 and r3["code"] in (0, 1100), f"form publish fail {key}: {r3}"
    return fid

def create_def(key, name, form_key, graph):
    graph = dict(graph)
    graph["processKey"] = f"i3ev_{key}"
    code, existing = http(PORT_A, "GET", f"/workflow/defs?pageNum=1&pageSize=100&formKey={form_key}", TA)
    rows = (existing.get("data") or {}).get("records") or []
    def_id = None
    for row in rows:
        if row.get("name") == name:
            def_id = row["id"]
            break
    if not def_id:
        code, r = http(PORT_A, "POST", "/workflow/defs", TA, {"name": name, "formKey": form_key})
        assert r["code"] == 0, f"def create fail: {r}"
        def_id = r["data"]["defId"]
    code2, r2 = http(PORT_A, "PUT", f"/workflow/defs/{def_id}/graph", TA, graph)
    assert r2["code"] == 0, f"graph save fail: {r2}"
    return def_id

def validate(def_id):
    code, r = http(PORT_A, "POST", f"/workflow/defs/{def_id}/validate", TA)
    return r["data"]

def publish(def_id):
    code, r = http(PORT_A, "POST", f"/workflow/defs/{def_id}/publish", TA)
    return code, r

PART_A = {"strategy": "FIXED_USER", "value": [1]}
PART_B = {"strategy": "FIXED_USER", "value": [2001]}
CONSEN_AB = {"strategy": "FIXED_USER", "value": [1, 2001]}

def main():
    log = []
    # ---- 表单族（每个定义独立 formKey） ----
    fields = [{"name": "amount", "label": "金额", "type": "NUMBER"},
              {"name": "reason", "label": "事由", "type": "TEXT"}]
    for key, name in [("i3ev_d1", "I3证据-D1"), ("i3ev_d2", "I3证据-D2"), ("i3ev_d3", "I3证据-D3"),
                      ("i3ev_d4", "I3证据-D4"), ("i3ev_d5", "I3证据-D5"), ("i3ev_d6", "I3证据-D6"),
                      ("i3ev_d7", "I3证据-D7")]:
        ids[f"form_{key}"] = create_form(key, name, fields)
    log.append({"step": "forms", "ids": {k: v for k, v in ids.items() if k.startswith("form")}})

    # ---- D1 单审批（admin）----
    g = linear_graph("I3证据-单审批", "i3ev_d1", [("APPROVAL", {"name": "审批A", "participant": PART_A})])
    ids["d1"] = create_def("d1", "I3证据-单审批", "i3ev_d1", g)
    errs = validate(ids["d1"]); assert errs == [], f"D1 validate {errs}"
    c, r = publish(ids["d1"]); assert r["code"] == 0, f"D1 publish {r}"
    log.append({"step": "D1 publish", "defId": ids["d1"], "resp": r})

    # ---- D2 两审批（RETURN 用）----
    g = linear_graph("I3证据-两审批", "i3ev_d2", [("APPROVAL", {"name": "审批A", "participant": PART_A}),
                                                  ("APPROVAL", {"name": "审批B", "participant": PART_B})])
    ids["d2"] = create_def("d2", "I3证据-两审批", "i3ev_d2", g)
    assert validate(ids["d2"]) == []
    c, r = publish(ids["d2"]); assert r["code"] == 0
    log.append({"step": "D2 publish", "defId": ids["d2"]})

    # ---- D3 会签 ALL [admin,user2]（G8 双实例）----
    g = linear_graph("I3证据-会签", "i3ev_d3", [("CONSENSUS", {"name": "会签", "participant": CONSEN_AB, "mode": "ALL"})])
    ids["d3"] = create_def("d3", "I3证据-会签", "i3ev_d3", g)
    assert validate(ids["d3"]) == []
    c, r = publish(ids["d3"]); assert r["code"] == 0
    log.append({"step": "D3 publish", "defId": ids["d3"]})

    # ---- D4 意见表单（G14）----
    opinion_fields = [
        {"key": "comment2", "label": "审批说明", "type": "TEXT", "required": True, "maxLength": 200},
        {"key": "level", "label": "等级", "type": "RADIO", "options": ["A", "B"], "required": True},
        {"key": "note", "label": "备注", "type": "NOTE"},
    ]
    g = linear_graph("I3证据-意见表单", "i3ev_d4", [("APPROVAL", {"name": "意见审批", "participant": PART_A, "opinionForm": {"formId": "i3ev-opinion", "version": "v1", "fields": opinion_fields}})])
    ids["d4"] = create_def("d4", "I3证据-意见表单", "i3ev_d4", g)
    assert validate(ids["d4"]) == []
    c, r = publish(ids["d4"]); assert r["code"] == 0
    log.append({"step": "D4 publish", "defId": ids["d4"]})

    # ---- D5 节点函数（G13）----
    fn_cfg = {"name": "函数审批", "participant": PART_A,
              "functions": [{"key": "func_tenant_admins", "version": 1}]}
    g = linear_graph("I3证据-函数", "i3ev_d5", [("APPROVAL", fn_cfg)])
    ids["d5"] = create_def("d5", "I3证据-函数", "i3ev_d5", g)
    errs = validate(ids["d5"]); assert errs == [], f"D5 validate {errs}"
    c, r = publish(ids["d5"]); assert r["code"] == 0
    log.append({"step": "D5 publish", "defId": ids["d5"]})

    # ---- D6 时限（G12）----
    dl = {"name": "时限审批", "participant": PART_A,
          "deadline": {"dueMinutes": 1, "autoAction": "APPROVE"}}
    g = linear_graph("I3证据-时限", "i3ev_d6", [("APPROVAL", dl)])
    ids["d6"] = create_def("d6", "I3证据-时限", "i3ev_d6", g)
    assert validate(ids["d6"]) == []
    c, r = publish(ids["d6"]); assert r["code"] == 0
    log.append({"step": "D6 publish", "defId": ids["d6"]})

    # ---- D7 仅草稿（安全删除对象）----
    g = linear_graph("I3证据-草稿", "i3ev_d7", [("APPROVAL", {"name": "审批", "participant": PART_A})])
    ids["d7"] = create_def("d7", "I3证据-草稿", "i3ev_d7", g)
    log.append({"step": "D7 draft only", "defId": ids["d7"]})

    save("g1_g5/step1-defs.json", {"log": log, "ids": ids})
    print(json.dumps(ids))

if __name__ == '__main__':
    main()
