#!/usr/bin/env python3
# G2a 行为证据（API 层）：必填缺失零残留、受理冻结、同意图幂等、绑定失效保留内容可修正重提。
# 运行：python3 g2a-evidence.py >> g2a-evidence.out 2>&1
import json
import os
import time
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:8080/api")
FX = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures03-run.out")))
ADMIN = "1"
BIZ = FX["bizUser"]
DSP = FX["dspUser"]
FORM_A = FX["formA"]
FORM_KEY = "p4_oa_biz_form_20260905b"


def req(method, path, body=None, user=ADMIN, timeout=20):
    headers = {"Authorization": f"Bearer test_{user}", "Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(body_txt)
        except Exception:
            return e.code, {"raw": body_txt[:200]}


def log(tag, **kv):
    print(f"[{tag}] " + json.dumps(kv, ensure_ascii=False))


def make_draft(user, payload):
    s, p = req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=user)
    draft = str(p["data"]["id"])
    s, p = req("PUT", f"/workflow/drafts/{draft}", {"payload": payload}, user=user)
    return draft


# ---- (a) 必填缺失提交：前端校验之外，服务端拒绝且零残留 ----
d1 = make_draft(BIZ, {"applicant": "", "amount": 0, "reason": ""})
s, p = req("POST", f"/workflow/drafts/{d1}/submit", user=BIZ)
log("A1.submit-missing-required", http=s, code=p["code"], msg=p["msg"])
s, p = req("GET", f"/workflow/drafts/{d1}", user=BIZ)
d1_after = p["data"]
log("A2.draft-after-reject", status=d1_after["status"], commandId=d1_after["commandId"],
    submitSeq=d1_after["submitSeq"], payload=d1_after["payload"])

# ---- (b) 受理冻结：提交受理后立即改/删被拒，命令与草稿可回查 ----
d2 = make_draft(BIZ, {"applicant": "业务用户甲", "amount": 100, "reason": "G2a 冻结场景"})
s, p = req("POST", f"/workflow/drafts/{d2}/submit", user=BIZ)
cmd2 = str(p["data"]["commandId"])
log("B1.submit-accepted", draftId=d2, commandId=cmd2, duplicated=p["data"]["duplicated"])
s, p = req("DELETE", f"/workflow/drafts/{d2}", user=BIZ)
log("B2.delete-while-submitting", http=s, code=p["code"], msg=p["msg"])
s, p = req("PUT", f"/workflow/drafts/{d2}", {"payload": {"applicant": "改内容", "reason": "x"}}, user=BIZ)
log("B3.update-while-submitting", http=s, code=p["code"], msg=p["msg"])
s, p = req("POST", f"/workflow/drafts/{d2}/submit", user=BIZ)
log("B4.resubmit-while-submitting-duplicated", duplicated=p["data"]["duplicated"],
    sameCommandId=str(p["data"]["commandId"]) == cmd2)
# 等待命令完成
for _ in range(20):
    s, p = req("GET", f"/workflow/commands/{cmd2}", user=BIZ)
    if p["data"]["status"] in ("COMPLETED", "FAILED"):
        break
    time.sleep(0.5)
log("B5.command-final", status=p["data"]["status"], result=p["data"].get("result"))
s, p = req("GET", f"/workflow/drafts/{d2}", user=BIZ)
log("B6.draft-after-consume", status=p["data"]["status"], recordId=p["data"].get("resultRecordId"))

# ---- (c) 绑定失效：提交受理后管理员重绑流程，消费时确定失败、内容保留、修正后可重提 ----
d3 = make_draft(BIZ, {"applicant": "业务用户乙", "amount": 200, "reason": "G2a 绑定失效场景"})
s, p = req("POST", f"/workflow/drafts/{d3}/submit", user=BIZ)
cmd3 = str(p["data"]["commandId"])
# 立即建第二个流程并发布（发布即重绑 formA → 新流程）
DEF_C = str(req("POST", "/workflow/defs", {"name": "P4补证03重绑流", "formKey": FORM_KEY})[1]["data"]["defId"])
g = req("GET", f"/workflow/defs/{DEF_C}")[1]["data"]
req("PUT", f"/workflow/defs/{DEF_C}/graph", {
    "processKey": g["processKey"], "name": "P4补证03重绑流", "formKey": FORM_KEY,
    "elements": [
        {"id": "n_start", "kind": "node", "type": "START"},
        {"id": "n_b1", "kind": "node", "type": "APPROVAL",
         "config": {"name": "重绑终审", "participant": {"strategy": "FIXED_USER", "value": [1]}}},
        {"id": "n_end", "kind": "node", "type": "END"},
        {"id": "e1", "kind": "edge", "source": "n_start", "target": "n_b1"},
        {"id": "e2", "kind": "edge", "source": "n_b1", "target": "n_end"}]})
s, p = req("POST", f"/workflow/defs/{DEF_C}/publish")
log("C1.admin-rebind-publish", http=s, code=p["code"], newDefId=DEF_C)
# 等待原命令进入终态（快照绑定已失效 → 有界重试 → FAILED）
final = None
for _ in range(90):
    s, p = req("GET", f"/workflow/commands/{cmd3}", user=BIZ)
    final = p["data"]
    if final["status"] in ("COMPLETED", "FAILED"):
        break
    time.sleep(1)
log("C2.stale-command-final", status=final["status"], retryCount=final.get("retryCount"),
    failureReason=(final.get("failureReason") or "")[:80])
s, p = req("GET", f"/workflow/drafts/{d3}", user=BIZ)
log("C3.draft-preserved", status=p["data"]["status"], lastError=(p["data"].get("lastError") or "")[:60],
    payload=p["data"]["payload"])
# 修正路径：重置为可编辑后再次提交（新 submitSeq → 新命令，新绑定解析）
s, p = req("POST", f"/workflow/drafts/{d3}/submit", user=BIZ)
log("C4.resubmit-after-failure", http=s, code=p["code"], newCommandId=p["data"].get("commandId"),
    msg=p.get("msg"))
cmd4 = str(p["data"]["commandId"]) if p["data"].get("commandId") else None
if cmd4:
    for _ in range(30):
        s, p = req("GET", f"/workflow/commands/{cmd4}", user=BIZ)
        if p["data"]["status"] in ("COMPLETED", "FAILED"):
            break
        time.sleep(0.5)
    log("C5.resubmit-command-final", status=p["data"]["status"], result=p["data"].get("result"))

print("DRAFTS=" + json.dumps({"d1": d1, "d2": d2, "d3": d3}))
