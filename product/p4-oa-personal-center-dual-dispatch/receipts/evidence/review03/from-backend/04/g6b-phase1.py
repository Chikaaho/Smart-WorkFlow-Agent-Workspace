#!/usr/bin/env python3
# G6b 窗口实验（阶段1：受理+撤权，消费被 sw.bpm.command.*-poll-interval-millis=3600000 暂停）。
# 运行：BASE=http://localhost:18082/api python3 g6b-phase1.py
import json
import os
import time
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:18082/api")
HERE = os.path.dirname(os.path.abspath(__file__))
FX = json.load(open(os.path.join(HERE, "g6b-fixtures.out")))
ADMIN = "1"
BIZ = FX["bizUser"]
DSP = FX["dspUser"]
DSP_ROLE = FX["dspRole"]
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


out = {"biz": BIZ, "dsp": DSP}

# ---- 1. dsp 提交 P0 命令（消费暂停 → 受理后保持 PENDING） ----
s, p = req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=DSP)
d_dsp = str(p["data"]["id"])
req("PUT", f"/workflow/drafts/{d_dsp}", {"payload": {"applicant": "P0待撤权用户", "amount": 1, "reason": "G6b P0撤权"}}, user=DSP)
s, p = req("POST", f"/workflow/drafts/{d_dsp}/submit?channel=P0", user=DSP, timeout=60)
log("W1.dsp-p0-submit-accepted", http=s, code=p["code"], commandId=(p.get("data") or {}).get("commandId"),
    status=(p.get("data") or {}).get("status"), msg=p.get("msg"))
out["cmdP0"] = str(p["data"]["commandId"])

# ---- 2. biz 提交 NORMAL 命令 ----
s, p = req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=BIZ)
d_biz = str(p["data"]["id"])
req("PUT", f"/workflow/drafts/{d_biz}", {"payload": {"applicant": "业务待撤权用户", "amount": 2, "reason": "G6b 可见范围撤权"}}, user=BIZ)
s, p = req("POST", f"/workflow/drafts/{d_biz}/submit", user=BIZ)
log("W2.biz-normal-submit-accepted", http=s, code=p["code"], commandId=(p.get("data") or {}).get("commandId"))
out["cmdNormal"] = str(p["data"]["commandId"])

# ---- 3. 确认两命令均未被消费（消费暂停窗口） ----
time.sleep(3)
s, p = req("GET", f"/workflow/commands/{out['cmdP0']}", user=DSP)
log("W3.p0-still-pending", status=p["data"]["status"])
s, p = req("GET", f"/workflow/commands/{out['cmdNormal']}", user=BIZ)
log("W4.normal-still-pending", status=p["data"]["status"])

# ---- 4. 真实 API 撤权：dsp 移除角色（P0 权限随角色消失） ----
s, p = req("PUT", f"/system/user/{DSP}/roles", [])
log("W5.revoke-dsp-role", http=s, code=p["code"])
s, p = req("GET", "/auth/me", user=DSP)
perms = p["data"]["permissions"]
log("W6.dsp-perms-after-revoke", permissions=perms, p0Gone="workflow:p0:dispatch" not in perms)

# ---- 5. 真实 API 撤业务权限：formA 可见范围收缩为不含 biz ----
form_id = FX["formA"]
s, p = req("PUT", f"/form/def/{form_id}/visibility", {"userIds": [DSP]})
log("W7.restrict-visibility-exclude-biz", http=s, code=p["code"])
s, p = req("GET", f"/form/def/by-key/{FORM_KEY}", user=BIZ)
log("W8.biz-bykey-after-restrict", code=p["code"], msg=p["msg"])
s, p = req("GET", "/auth/me", user=BIZ)
out["bizPermsBefore"] = p["data"]["permissions"]

json.dump(out, open(os.path.join(HERE, "g6b-window.json"), "w"))
print("WINDOW=" + json.dumps(out))
