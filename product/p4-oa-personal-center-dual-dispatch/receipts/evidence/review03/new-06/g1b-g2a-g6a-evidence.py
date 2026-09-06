#!/usr/bin/env python3
# G1b/G2a/G6a 最终快照在线断言：
# G1b 已有草稿范围撤销→保存/提交拒绝、内容保留；
# G2a 受理前已知绑定失效拒绝→用户确认重绑→提交成功；
# G6a 一般管理角色（无312）无 P0 权限且回读。
# 运行：python3 g1b-g2a-g6a-evidence.py >> g1b-g2a-g6a-evidence.out 2>&1
import json
import os
import time
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:8080/api")
HERE = os.path.dirname(os.path.abspath(__file__))
FX = json.load(open(os.path.join(HERE, "fixtures03-run.out")))
ADMIN = "1"
BIZ = FX["bizUser"]
DSP = FX["dspUser"]
FORM_A = FX["formA"]
FORM_KEY = "p4_oa_biz_form_20260905b"


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
            return e.code, {"raw": txt[:200]}


def log(tag, **kv):
    print(f"[{tag}] " + json.dumps(kv, ensure_ascii=False))


# ---- G1b：已有草稿 + 范围撤销 → 保存/提交拒绝、内容保留 ----
s, p = req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=BIZ)
d = str(p["data"]["id"])
req("PUT", f"/workflow/drafts/{d}", {"payload": {"applicant": "撤权保留用户", "amount": 5,
                                                 "reason": "G1b 撤权前内容"}}, user=BIZ)
req("PUT", f"/form/def/{FORM_A}/visibility", {"userIds": [DSP]})
log("B1.scope-revoked", formId=FORM_A, excluded=BIZ)
s, p = req("PUT", f"/workflow/drafts/{d}", {"payload": {"applicant": "撤权后保存", "reason": "x"}}, user=BIZ)
log("B2.save-after-revoke-rejected", code=p["code"], msg=p["msg"])
s, p = req("POST", f"/workflow/drafts/{d}/submit", user=BIZ)
log("B3.submit-after-revoke-rejected", code=p["code"], msg=p["msg"])
s, p = req("GET", f"/workflow/drafts/{d}", user=BIZ)
log("B4.draft-content-preserved", status=p["data"]["status"], payload=p["data"]["payload"])
req("PUT", f"/form/def/{FORM_A}/visibility", {"userIds": []})
s, p = req("PUT", f"/workflow/drafts/{d}", {"payload": {"applicant": "撤权保留用户", "amount": 5,
                                                        "reason": "G1b 恢复后可编辑"}}, user=BIZ)
log("B5.save-after-restore-ok", code=p["code"])

# ---- G2a：受理前已知绑定失效拒绝 → 用户确认重绑 → 提交成功 ----
d2 = str(req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=BIZ)[1]["data"]["id"])
req("PUT", f"/workflow/drafts/{d2}", {"payload": {"applicant": "失效拒绝用户", "amount": 6,
                                                  "reason": "G2a 受理前失效"}}, user=BIZ)
before = req("GET", f"/workflow/drafts/{d2}", user=BIZ)[1]["data"]["processDefKey"]
req("PUT", f"/workflow/drafts/{d2}", {"payload": {"applicant": "失效拒绝用户", "amount": 6,
                                                  "reason": "G2a 受理前失效"}})  # admin 无操作，仅占位
# 管理员发布新流程（重绑 formA → 新绑定）
DEF = str(req("POST", "/workflow/defs", {"name": "P4补证05重绑流", "formKey": FORM_KEY})[1]["data"]["defId"])
g = req("GET", f"/workflow/defs/{DEF}")[1]["data"]
req("PUT", f"/workflow/defs/{DEF}/graph", {
    "processKey": g["processKey"], "name": "P4补证05重绑流", "formKey": FORM_KEY,
    "elements": [
        {"id": "n_start", "kind": "node", "type": "START"},
        {"id": "n_e1", "kind": "node", "type": "APPROVAL",
         "config": {"name": "05终审", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
        {"id": "n_end", "kind": "node", "type": "END"},
        {"id": "e1", "kind": "edge", "source": "n_start", "target": "n_e1"},
        {"id": "e2", "kind": "edge", "source": "n_e1", "target": "n_end"}]})
req("POST", f"/workflow/defs/{DEF}/publish")
s, p = req("POST", f"/workflow/drafts/{d2}/submit", user=BIZ)
log("C1.accept-time-stale-binding-rejected", code=p["code"], msg=p["msg"])
cmdleak = req("GET", f"/workflow/drafts/{d2}", user=BIZ)[1]["data"]
log("C2.no-command-created", status=cmdleak["status"], commandId=cmdleak["commandId"],
    bindingUnchanged=cmdleak["processDefKey"] == before)
# 用户确认更新（refreshFormVersion=确认重绑）→ 提交成功
s, p = req("PUT", f"/workflow/drafts/{d2}", {"refreshFormVersion": True}, user=BIZ)
log("C3.user-confirm-rebind", code=p["code"], newBinding=p["data"]["processDefKey"])
s, p = req("POST", f"/workflow/drafts/{d2}/submit", user=BIZ)
cmd2 = str(p["data"]["commandId"])
log("C4.submit-after-confirm-accepted", code=p["code"], commandId=cmd2)
for _ in range(20):
    s, p = req("GET", f"/workflow/commands/{cmd2}", user=BIZ)
    if p["data"]["status"] in ("COMPLETED", "FAILED"):
        break
    time.sleep(0.5)
log("C5.command-final", status=p["data"]["status"], result=p["data"].get("result"))

# ---- G6a：一般管理角色（无 312）实际授权回读 + P0 拒绝 ----
roles = req("POST", "/system/role/page?pageNum=1&pageSize=50")[1]["data"]["records"]
GEN_ROLE = next((str(r["id"]) for r in roles if r.get("code") == "p4_genmgr_role_03"), None)
if not GEN_ROLE:
    GEN_ROLE = str(req("POST", "/system/role", {
        "name": "P4一般管理角色03", "code": "p4_genmgr_role_03", "sort": 93, "status": 1,
        "dataScope": 3, "description": "一般管理（流程定义查看，无P0）"})[1]["data"])
req("PUT", f"/system/role/{GEN_ROLE}/menus", [5, 20, 23])
users = req("POST", "/system/user/page?pageNum=1&pageSize=50")[1]["data"]["records"]
GENMGR = next((str(u["id"]) for u in users if u.get("username") == "p4genmgr03"), None)
if not GENMGR:
    GENMGR = str(req("POST", "/system/user", {
        "username": "p4genmgr03", "realName": "P4一般管理员03", "deptId": 1, "status": 0,
        "plainPassword": "P4gen#2026"})[1]["data"])
req("PUT", f"/system/user/{GENMGR}/roles", [int(GEN_ROLE)])
s, p = req("GET", "/auth/me", user=GENMGR)
log("G1.genmgr-perms", permissions=p["data"]["permissions"],
    noP0="workflow:p0:dispatch" not in p["data"]["permissions"])
d3 = str(req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=GENMGR)[1]["data"]["id"])
req("PUT", f"/workflow/drafts/{d3}", {"payload": {"applicant": "一般管理员", "amount": 7,
                                                  "reason": "G6a 一般管理员P0拒绝"}}, user=GENMGR)
s, p = req("POST", f"/workflow/drafts/{d3}/submit?channel=P0", user=GENMGR)
log("G2.genmgr-p0-rejected", code=p["code"], msg=p["msg"])
