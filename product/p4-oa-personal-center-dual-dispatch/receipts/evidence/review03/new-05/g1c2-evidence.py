#!/usr/bin/env python3
# G1c 补充断言：普通用户 config 编辑 403；草稿绑定篡改被忽略；流程重绑后既有实例绑定不变。
# 运行：python3 g1c2-evidence.py >> g1c2-evidence.out 2>&1
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


def req(method, path, body=None, user=ADMIN, timeout=30):
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


# ---- 1. 普通用户 config 编辑（真实已发布表单的配置保存入口）→ 403 ----
s, p = req("POST", f"/form/def/{FORM_A}/config", {"definition": json.dumps({
    "schemaVersion": 1, "title": "越权改配置", "fields": [
        {"name": "applicant", "type": "TEXT", "label": "申请人", "required": False}]},
    ensure_ascii=False)}, user=BIZ)
log("D1.biz-config-save-rejected", http=s, code=p["code"], msg=p["msg"])
s, p = req("GET", f"/form/def/{FORM_A}/definition", user=ADMIN)
ok_def = bool(p.get("data")) and "applicant" in json.dumps(p["data"])
stillRequired = bool(p.get("data")) and '"required":true' in json.dumps(p["data"]).replace(" ", "")
log("D2.definition-unchanged-after-reject", adminReadCode=p["code"], stillHasApplicant=bool(ok_def),
    applicantStillRequired=stillRequired)

# ---- 2. 绑定篡改：更新草稿携带 processDefKey（客户端不可重绑），读回不变 ----
s, p = req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=BIZ)
d = str(p["data"]["id"])
before = req("GET", f"/workflow/drafts/{d}", user=BIZ)[1]["data"]["processDefKey"]
s, p = req("PUT", f"/workflow/drafts/{d}",
           {"payload": {"applicant": "篡改者", "reason": "x"}, "processDefKey": "bpm_hacked"},
           user=BIZ)
after = req("GET", f"/workflow/drafts/{d}", user=BIZ)[1]["data"]
log("D3.binding-tamper-ignored", before=before, after=after["processDefKey"],
    unchanged=(before == after["processDefKey"] == "bpm_dbe8cb55b141430c" or before == after["processDefKey"]),
    serverBinding=after["processDefKey"])

# ---- 3. 提交后管理员重绑流程 → 既有实例绑定不变（读回对照） ----
req("PUT", f"/workflow/drafts/{d}", {"payload": {"applicant": "绑定不变场景", "amount": 9,
                                                 "reason": "G1c 实例绑定不变"}}, user=BIZ)
s, p = req("POST", f"/workflow/drafts/{d}/submit", user=BIZ)
cmd = str(p["data"]["commandId"])
for _ in range(20):
    s, p = req("GET", f"/workflow/commands/{cmd}", user=BIZ)
    if p["data"]["status"] == "COMPLETED":
        break
    time.sleep(0.5)
record_id = json.loads(p["data"]["result"])["recordId"]
inst = None
for _ in range(20):
    s, p = req("GET", "/workflow/my/instances?pageNum=1&pageSize=10", user=BIZ)
    cand = [i for i in p["data"]["records"] if i.get("businessKey") == record_id]
    if cand:
        inst = cand[0]
        break
    time.sleep(0.5)
assert inst is not None, "instance not visible"
binding_before = inst["processDefKey"]
log("D4.instance-created", instanceId=inst["id"], processDefKey=binding_before, status=inst["status"])

# 发布另一个流程（重绑 formA → 新流程）
defs_before = req("GET", "/workflow/defs?pageNum=1&pageSize=50")[1]["data"]["records"]
DEF_D = str(req("POST", "/workflow/defs", {"name": "P4补证04重绑流", "formKey": FORM_KEY})[1]["data"]["defId"])
g = req("GET", f"/workflow/defs/{DEF_D}")[1]["data"]
req("PUT", f"/workflow/defs/{DEF_D}/graph", {
    "processKey": g["processKey"], "name": "P4补证04重绑流", "formKey": FORM_KEY,
    "elements": [
        {"id": "n_start", "kind": "node", "type": "START"},
        {"id": "n_d1", "kind": "node", "type": "APPROVAL",
         "config": {"name": "重绑04终审", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
        {"id": "n_end", "kind": "node", "type": "END"},
        {"id": "e1", "kind": "edge", "source": "n_start", "target": "n_d1"},
        {"id": "e2", "kind": "edge", "source": "n_d1", "target": "n_end"}]})
s, p = req("POST", f"/workflow/defs/{DEF_D}/publish")
log("D5.admin-rebind-publish", code=p["code"], newProcessKey=g["processKey"])

inst_after = None
for _ in range(20):
    s, p = req("GET", "/workflow/my/instances?pageNum=1&pageSize=10", user=BIZ)
    cand = [i for i in p["data"]["records"] if i.get("businessKey") == record_id]
    if cand:
        inst_after = cand[0]
        break
    time.sleep(0.5)
assert inst_after is not None
log("D6.instance-binding-unchanged", before=binding_before, after=inst_after["processDefKey"],
    unchanged=binding_before == inst_after["processDefKey"], status=inst_after["status"])

# 新草稿解析到新绑定（后续发起走新流程）
s, p = req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=BIZ)
d2 = str(p["data"]["id"])
new_binding = req("GET", f"/workflow/drafts/{d2}", user=BIZ)[1]["data"]["processDefKey"]
log("D7.new-draft-resolves-new-binding", newBinding=new_binding,
    switched=new_binding != binding_before)
print("DRAFT_D=" + d)
