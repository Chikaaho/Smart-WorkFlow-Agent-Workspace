#!/usr/bin/env python3
# P4 补证03 夹具脚本（幂等）：经真实 REST API 创建/复用测试身份/表单/流程/绑定。
# 前置：后端已启动（dev profile，SW_DEBUG_AUTH_ENABLED=true）。
# 用法：BASE=http://localhost:8080/api python3 fixtures03.py
import json
import os
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:8080/api")
ADMIN = {"Authorization": "Bearer test_1", "Content-Type": "application/json"}


def req(method: str, path: str, body=None, token: str | None = None):
    headers = dict(ADMIN)
    if token:
        headers["Authorization"] = f"Bearer test_{token}"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        payload = e.read().decode(errors="replace")
        try:
            return json.loads(payload)
        except Exception:
            raise SystemExit(f"HTTP {e.code} {path}: {payload[:300]}")


def expect0(resp, what):
    if resp.get("code") != 0:
        raise SystemExit(f"FAIL[{what}] resp={resp}")
    return resp


def oid(resp):
    data = resp["data"]
    if isinstance(data, dict):
        for k in ("id", "defId", "formId"):
            if k in data:
                return str(data[k])
        raise SystemExit(f"no id in {list(data)}")
    return data


def first(records, key, value):
    for r in records or []:
        if r.get(key) == value:
            return str(r["id"])
    return None


# ---------- 1. 角色 ----------
roles = expect0(req("POST", "/system/role/page?pageNum=1&pageSize=50"), "page role")["data"]["records"]
BIZ_ROLE = first(roles, "code", "p4_biz_role_03")
biz_role_created = False
if not BIZ_ROLE:
    BIZ_ROLE = oid(expect0(req("POST", "/system/role", {
        "name": "P4业务角色03", "code": "p4_biz_role_03", "sort": 90, "status": 1,
        "dataScope": 3, "description": "P4 补证03 业务身份"}), "create biz role"))
    biz_role_created = True
DSP_ROLE = first(roles, "code", "p4_dsp_role_03")
dsp_role_created = False
if not DSP_ROLE:
    DSP_ROLE = oid(expect0(req("POST", "/system/role", {
        "name": "P4调度角色03", "code": "p4_dsp_role_03", "sort": 91, "status": 1,
        "dataScope": 3, "description": "P4 补证03 调度身份(P0)"}), "create dsp role"))
    dsp_role_created = True
# updateMenus 不可重复执行（软删残留撞 UK_SYS_ROLE_MENU_TENANT，平台既有行为）：
# 仅在角色为本轮新建时绑定菜单；复用既有角色时视为已绑定。
if biz_role_created:
    expect0(req("PUT", f"/system/role/{BIZ_ROLE}/menus", [5, 20, 24, 25, 26]), "biz role menus")
if dsp_role_created:
    expect0(req("PUT", f"/system/role/{DSP_ROLE}/menus", [5, 20, 24, 25, 26, 312]), "dsp role menus")

# ---------- 2. 用户 ----------
DEPT = 1
users = expect0(req("POST", "/system/user/page?pageNum=1&pageSize=50"), "page user")["data"]["records"]
BIZ_USER = first(users, "username", "p4biz03")
if not BIZ_USER:
    BIZ_USER = oid(expect0(req("POST", "/system/user", {
        "username": "p4biz03", "realName": "P4业务用户03", "deptId": DEPT, "status": 0,
        "plainPassword": "P4biz#2026"}), "create biz user"))
DSP_USER = first(users, "username", "p4dsp03")
if not DSP_USER:
    DSP_USER = oid(expect0(req("POST", "/system/user", {
        "username": "p4dsp03", "realName": "P4调度用户03", "deptId": DEPT, "status": 0,
        "plainPassword": "P4dsp#2026"}), "create dsp user"))
expect0(req("PUT", f"/system/user/{BIZ_USER}/roles", [int(BIZ_ROLE)]), "bind biz role")
expect0(req("PUT", f"/system/user/{DSP_USER}/roles", [int(DSP_ROLE)]), "bind dsp role")

# ---------- 3. 表单A（双节点审批） ----------
forms = expect0(req("GET", "/form/def/page?pageNum=1&pageSize=50"), "page forms")["data"]["records"]
FORM_A = first(forms, "formKey", "p4_oa_biz_form_20260905b")
FORM_A_PUBLISHED = any(
    r.get("formKey") == "p4_oa_biz_form_20260905b" and r.get("status") == "PUBLISHED"
    for r in forms or [])
if not FORM_A_PUBLISHED:
    if not FORM_A:
        FORM_A = oid(expect0(req("POST", "/form/def", {
            "formKey": "p4_oa_biz_form_20260905b", "name": "P4补证03业务表单",
            "description": "普通用户从已发布表单发起夹具"}), "create formA"))
    expect0(req("POST", f"/form/def/{FORM_A}/config", {"definition": json.dumps({
        "schemaVersion": 1, "title": "P4补证03业务表单", "fields": [
            {"name": "applicant", "type": "TEXT", "label": "申请人", "required": True, "length": 50},
            {"name": "amount", "type": "NUMBER", "label": "金额", "required": False},
            {"name": "reason", "type": "TEXT", "label": "事由", "required": True, "length": 200}]},
        ensure_ascii=False)}), "formA config")
    expect0(req("POST", f"/form/def/{FORM_A}/publish"), "formA publish")

# ---------- 4. 流程A（发布即唯一绑定） ----------
defs = expect0(req("GET", "/workflow/defs?pageNum=1&pageSize=50"), "page defs")["data"]["records"]
DEF_A = first([d for d in defs if d.get("status") == "PUBLISHED"], "formKey", "p4_oa_biz_form_20260905b")
if not DEF_A:
    DEF_A = oid(expect0(req("POST", "/workflow/defs", {
        "name": "P4补证03审批流", "formKey": "p4_oa_biz_form_20260905b"}), "create defA"))
    PKEY_A = expect0(req("GET", f"/workflow/defs/{DEF_A}"), "get defA")["data"]["processKey"]
    expect0(req("PUT", f"/workflow/defs/{DEF_A}/graph", {
        "processKey": PKEY_A, "name": "P4补证03审批流", "formKey": "p4_oa_biz_form_20260905b",
        "elements": [
            {"id": "n_start", "kind": "node", "type": "START"},
            {"id": "n_a1", "kind": "node", "type": "APPROVAL",
             "config": {"name": "初审", "participant": {"strategy": "FIXED_USER", "value": [int(DSP_USER)]}}},
            {"id": "n_a2", "kind": "node", "type": "APPROVAL",
             "config": {"name": "终审", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
            {"id": "n_end", "kind": "node", "type": "END"},
            {"id": "e1", "kind": "edge", "source": "n_start", "target": "n_a1"},
            {"id": "e2", "kind": "edge", "source": "n_a1", "target": "n_a2"},
            {"id": "e3", "kind": "edge", "source": "n_a2", "target": "n_end"}]}), "defA graph")
    expect0(req("POST", f"/workflow/defs/{DEF_A}/publish"), "defA publish")
PKEY_A = expect0(req("GET", f"/workflow/defs/{DEF_A}"), "get defA key")["data"]["processKey"]

# ---------- 5. 表单B + ANY 会签流程 ----------
FORM_B = first(forms, "formKey", "p4_oa_consensus_form_20260905b")
FORM_B_PUBLISHED = any(
    r.get("formKey") == "p4_oa_consensus_form_20260905b" and r.get("status") == "PUBLISHED"
    for r in forms or [])
if not FORM_B_PUBLISHED:
    if not FORM_B:
        FORM_B = oid(expect0(req("POST", "/form/def", {
            "formKey": "p4_oa_consensus_form_20260905b", "name": "P4补证03会签表单",
            "description": "同实例跨通道竞争夹具"}), "create formB"))
    expect0(req("POST", f"/form/def/{FORM_B}/config", {"definition": json.dumps({
        "schemaVersion": 1, "title": "P4补证03会签表单", "fields": [
            {"name": "applicant", "type": "TEXT", "label": "申请人", "required": True, "length": 50},
            {"name": "reason", "type": "TEXT", "label": "事由", "required": True, "length": 200}]},
        ensure_ascii=False)}), "formB config")
    expect0(req("POST", f"/form/def/{FORM_B}/publish"), "formB publish")
DEF_B = first([d for d in defs if d.get("status") == "PUBLISHED"], "formKey", "p4_oa_consensus_form_20260905b")
if not DEF_B:
    DEF_B = oid(expect0(req("POST", "/workflow/defs", {
        "name": "P4补证03会签流", "formKey": "p4_oa_consensus_form_20260905b"}), "create defB"))
    PKEY_B = expect0(req("GET", f"/workflow/defs/{DEF_B}"), "get defB")["data"]["processKey"]
    expect0(req("PUT", f"/workflow/defs/{DEF_B}/graph", {
        "processKey": PKEY_B, "name": "P4补证03会签流", "formKey": "p4_oa_consensus_form_20260905b",
        "elements": [
            {"id": "n_start", "kind": "node", "type": "START"},
            {"id": "n_c1", "kind": "node", "type": "CONSENSUS",
             "config": {"name": "任一会签", "mode": "ANY",
                        "participant": {"strategy": "FIXED_USER", "value": [int(BIZ_USER), int(DSP_USER)]}}},
            {"id": "n_end", "kind": "node", "type": "END"},
            {"id": "e1", "kind": "edge", "source": "n_start", "target": "n_c1"},
            {"id": "e2", "kind": "edge", "source": "n_c1", "target": "n_end"}]}), "defB graph")
    expect0(req("POST", f"/workflow/defs/{DEF_B}/publish"), "defB publish")
PKEY_B = expect0(req("GET", f"/workflow/defs/{DEF_B}"), "get defB key")["data"]["processKey"]

# ---------- 6. 身份权限差异回读 ----------
BIZ_PERMS = expect0(req("GET", "/auth/me", token=BIZ_USER), "biz me")["data"]["permissions"]
DSP_PERMS = expect0(req("GET", "/auth/me", token=DSP_USER), "dsp me")["data"]["permissions"]

print(json.dumps({
    "bizRole": BIZ_ROLE, "dspRole": DSP_ROLE, "bizUser": BIZ_USER, "dspUser": DSP_USER,
    "formA": FORM_A, "defA": DEF_A, "processKeyA": PKEY_A,
    "formB": FORM_B, "defB": DEF_B, "processKeyB": PKEY_B,
    "bizPerms": BIZ_PERMS, "dspPerms": DSP_PERMS,
}, ensure_ascii=False, indent=2))
