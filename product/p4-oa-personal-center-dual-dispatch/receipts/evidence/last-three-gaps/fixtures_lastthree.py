#!/usr/bin/env python3
"""最终轮在线夹具：角色/用户/表单/流程绑定。BASE 可指向不同端口（18084 文件库相位复用）。"""
import json, os, sys, urllib.request

BASE = os.environ.get("BASE", "http://127.0.0.1:8080/api")
ADMIN = "1"
OUT = os.environ.get("FIX_OUT", "/tmp/p4-final-round/fixtures-final.json")

def req(method, path, body=None, user=ADMIN, timeout=60):
    headers = {"Authorization": f"Bearer test_{user}", "Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        txt = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, {"raw": txt[:300]}

def log(tag, **kv):
    print(f"[{tag}] " + json.dumps(kv, ensure_ascii=False), flush=True)

fx = {}
# 1. 角色（menus 仅创建时绑定一次，规避 updateMenus 非幂等平台缺陷）
s, r = req("POST", "/system/role", {"name": "最终轮业务角色", "code": "final_biz", "status": 1})
fx["roleBiz"] = r["data"]; log("role.biz", code=r["code"], id=fx["roleBiz"])
s, r = req("PUT", f"/system/role/{fx['roleBiz']}/menus", [5, 20, 23]); log("role.biz.menus", code=r["code"])
s, r = req("POST", "/system/role", {"name": "最终轮P0角色", "code": "final_p0", "status": 1})
fx["roleP0"] = r["data"]; log("role.p0", code=r["code"], id=fx["roleP0"])
s, r = req("PUT", f"/system/role/{fx['roleP0']}/menus", [5, 20, 23, 312]); log("role.p0.menus", code=r["code"])

# 2. 用户（嵌套 roleIds 反序列化为平台缺陷，走创建后 PUT roles 根数组）
def create_user(username, display, role_id):
    payload = {"username": username, "realName": display, "deptId": 1, "status": 0,
               "plainPassword": "Final@12345", "nickname": display}
    s, r = req("POST", "/system/user", payload)
    uid = r.get("data")
    if uid is None:
        log("user.create.fail", username=username, resp=r); sys.exit(2)
    s2, r2 = req("PUT", f"/system/user/{uid}/roles", [role_id])
    log("user.created", username=username, id=uid, roles=r2.get("code"))
    return str(uid)

fx["bizG"] = create_user("finalbizg", "最终轮普通业务", fx["roleBiz"])
fx["bizP0"] = create_user("finalp0", "最终轮P0业务", fx["roleP0"])
fx["dsp"] = create_user("finaldsp", "最终轮审批人", fx["roleBiz"])

# 3. 表单：草稿 → config（fields 定义）→ 发布
FORM_KEY = "p4_oa_biz_form_final"
definition = {"fields": [
    {"name": "applicant", "label": "申请人姓名", "type": "TEXT", "required": True},
    {"name": "reason", "label": "事由", "type": "TEXT", "required": True},
    {"name": "days", "label": "天数", "type": "NUMBER", "required": False}]}
s, r = req("POST", "/form/def", {"formKey": FORM_KEY, "name": "最终轮发起表单",
                                 "logicalTableName": "biz_final_round", "description": "P4 最终轮发起表单"})
body = r.get("data") or {}
fid = body.get("id") if isinstance(body, dict) else body
fx["formId"] = str(fid); log("form.created", code=r["code"], id=fx["formId"])
s, r = req("POST", f"/form/def/{fx['formId']}/config", {"definition": json.dumps(definition, ensure_ascii=False)})
log("form.config", code=r["code"])
s, r = req("POST", f"/form/def/{fx['formId']}/publish"); log("form.published", code=r["code"])

# 4. 流程定义（单节点固定审批人 admin）→ 发布（自动强关联绑定）
s, r = req("POST", "/workflow/defs", {"name": "最终轮审批流", "formKey": FORM_KEY})
DEF = str(r["data"]["defId"]); fx["defId"] = DEF
g = req("GET", f"/workflow/defs/{DEF}")[1]["data"]
s, r = req("PUT", f"/workflow/defs/{DEF}/graph", {
    "processKey": g["processKey"], "name": "最终轮审批流", "formKey": FORM_KEY,
    "elements": [
        {"id": "n_start", "kind": "node", "type": "START"},
        {"id": "n_e1", "kind": "node", "type": "APPROVAL",
         "config": {"name": "最终终审", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
        {"id": "n_end", "kind": "node", "type": "END"},
        {"id": "e1", "kind": "edge", "source": "n_start", "target": "n_e1"},
        {"id": "e2", "kind": "edge", "source": "n_e1", "target": "n_end"}]})
log("def.graph", code=r["code"])
s, r = req("POST", f"/workflow/defs/{DEF}/publish"); log("def.published", code=r["code"])
fx["processKey"] = g["processKey"]

json.dump(fx, open(OUT, "w"), ensure_ascii=False, indent=1)
print("FIXTURES_SAVED", OUT)
