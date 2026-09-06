#!/usr/bin/env python3
"""G5a B1（提示08）在线采集：超时后凭原标识经对外契约回查实际业务结论。"""
import json, os, sys, time, urllib.request

BASE = os.environ.get("BASE", "http://127.0.0.1:8080/api")
FX = json.load(open("/tmp/p4-resultquery/fixtures.json"))
BIZP0 = FX["bizP0"]

def req(method, path, body=None, user=BIZP0, timeout=60):
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

# 受理：小预算同步通道（服务器 --sw.bpm.command.p0-wait-timeout-millis=50）
s, r = req("POST", "/workflow/drafts", {"formKey": FX["formKey"]})
draft = str(r["data"]["id"])
s, r = req("PUT", f"/workflow/drafts/{draft}",
           {"payload": {"applicant": "G5a-B1回查", "reason": "超时后实际业务结论回查", "days": 1}})
log("Q1.draft-saved", draft=draft, code=r["code"])

s, r = req("POST", f"/workflow/drafts/{draft}/submit?channel=P0", {})
data = r.get("data") or {}
cmd = str(data["commandId"])
log("Q2.submit-bounded", http=s, code=r.get("code"), commandId=cmd,
    channel=data.get("channel"), status=data.get("status"), duplicated=data.get("duplicated"))

# 立即用原标识回查（此刻父命令通常仍受理中）：不得显示业务成功
s, r = req("GET", f"/workflow/commands/{cmd}")
c = r.get("data") or {}
fs = c.get("flowStart")
log("Q3.recall-immediately", http=s, parentStatus=c.get("status"),
    parentResult=c.get("result"), flowStart=fs)

# 父命令已完成后、子命令仍在处理的窗口回查：flowStart 呈现处理中，不显示业务成功
time.sleep(0.12)
s, r = req("GET", f"/workflow/commands/{cmd}")
c = r.get("data") or {}
fs = c.get("flowStart")
log("Q3b.recall-parent-done-child-processing", http=s, parentStatus=c.get("status"),
    flowStart=fs,
    businessSuccessClaimed=bool(fs and fs.get("status") == "COMPLETED"))

# 稍候再查：实际启动完成 → flowStart COMPLETED/STARTED + 实例存在
time.sleep(2.0)
s, r = req("GET", f"/workflow/commands/{cmd}")
c = r.get("data") or {}
fs = c.get("flowStart")
log("Q4.recall-final", http=s, parentStatus=c.get("status"), flowStart=fs)
child_id = str(fs.get("commandId")) if fs else None
if child_id:
    s, r = req("GET", f"/workflow/commands/{child_id}")
    cc = r.get("data") or {}
    log("Q5.child-direct-recall", http=s, commandId=child_id, status=cc.get("status"),
        result=cc.get("result"), finishedAt=cc.get("finishedAt"))
s, r = req("GET", "/workflow/my/instances")
insts = ((r.get("data") or {}).get("records")) or []
rid = (json.loads(c["result"]) if c.get("result") else {}).get("recordId")
mine = [i for i in insts if i.get("businessKey") == rid]
log("Q6.instance", recordId=rid, count=len(mine), status=mine[0].get("status") if mine else None,
    initiatorId=mine[0].get("initiatorId") if mine else None)
