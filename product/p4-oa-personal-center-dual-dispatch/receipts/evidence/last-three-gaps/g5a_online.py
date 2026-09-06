#!/usr/bin/env python3
"""G5a B1 在线采集：P0 同步发起返回与实际启动的先后关系（真实 REST）。"""
import json, os, sys, time, urllib.request

BASE = os.environ.get("BASE", "http://127.0.0.1:8080/api")
FX = json.load(open("/tmp/p4-lastthree/fixtures-p2.json"))
BIZP0 = FX["bizP0"]
ADMIN = "1"

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

def save_draft():
    s, r = req("POST", "/workflow/drafts", {"formKey": FX["formKey"]}, user=BIZP0)
    draft = str(r["data"]["id"])
    s, r = req("PUT", f"/workflow/drafts/{draft}",
               {"payload": {"applicant": "G5a-B1发起人", "reason": "同步发起结果链验证", "days": 1}}, user=BIZP0)
    log("draft.saved", draft=draft, code=r["code"])
    return draft

scenario = sys.argv[1] if len(sys.argv) > 1 else "normal"

if scenario == "normal":
    draft = save_draft()
    t0 = time.time()
    s, r = req("POST", f"/workflow/drafts/{draft}/submit?channel=P0", {}, user=BIZP0)
    elapsed = int((time.time() - t0) * 1000)
    data = r.get("data") or {}
    log("P2.submit", http=s, code=r.get("code"), commandId=data.get("commandId"),
        channel=data.get("channel"), status=data.get("status"),
        duplicated=data.get("duplicated"), clientElapsedMs=elapsed,
        clientReturnEpochMs=int(t0) + 0)
    cmd = str(data["commandId"])
    s, r = req("GET", f"/workflow/commands/{cmd}", user=BIZP0)
    c = r.get("data") or {}
    log("P3.parent-command", status=c.get("status"), result=c.get("result"),
        finishedAt=c.get("finishedAt"))
    result = json.loads(c["result"]) if c.get("result") else {}
    rid = result.get("recordId")
    s, r = req("POST", "/workflow/commands/page", {"pageNum": 1, "pageSize": 20}, user=BIZP0)
    rows = (r.get("data") or {}).get("list") or []
    child = [x for x in rows if x.get("commandType") == "FLOW_START" and rid
             and rid in str(x.get("commandKey"))]
    if child:
        ch = child[0]
        log("P4.child-command", commandId=ch.get("id"), channel=ch.get("channel"),
            status=ch.get("status"), commandKey=ch.get("commandKey"),
            createTime=ch.get("createTime"), finishedAt=ch.get("finishedAt"))
    else:
        log("P4.child-command", found=False, recordId=rid)
    s, r = req("GET", "/workflow/my/instances", user=BIZP0)
    insts = ((r.get("data") or {}).get("records")) or []
    mine = [i for i in insts if i.get("businessKey") == rid]
    log("P5.instance", found=bool(mine), businessKey=rid,
        initiatorId=mine[0].get("initiatorId") if mine else None,
        status=mine[0].get("status") if mine else None)

elif scenario == "timeout":
    draft = save_draft()
    t0 = time.time()
    s, r = req("POST", f"/workflow/drafts/{draft}/submit?channel=P0", {}, user=BIZP0)
    elapsed = int((time.time() - t0) * 1000)
    data = r.get("data") or {}
    log("P2.submit-bounded", http=s, code=r.get("code"), commandId=data.get("commandId"),
        channel=data.get("channel"), status=data.get("status"),
        duplicated=data.get("duplicated"), clientElapsedMs=elapsed)
    cmd = str(data["commandId"])
    open("/tmp/p4-lastthree/timeout-parent-cmd.txt", "w").write(cmd)
    # 回查父命令 → recordId → 子命令最终态（同一标识链）
    time.sleep(2.0)
    s, r = req("GET", f"/workflow/commands/{cmd}", user=BIZP0)
    c = r.get("data") or {}
    result = json.loads(c["result"]) if c.get("result") else {}
    rid = result.get("recordId")
    log("P3.parent-recalled", status=c.get("status"), recordId=rid)
    s, r = req("POST", "/workflow/commands/page", {"pageNum": 1, "pageSize": 20}, user=BIZP0)
    rows = (r.get("data") or {}).get("list") or []
    child = [x for x in rows if x.get("commandType") == "FLOW_START" and rid
             and rid in str(x.get("commandKey"))]
    if child:
        log("P4.child-final", commandId=child[0].get("id"), channel=child[0].get("channel"),
            status=child[0].get("status"), finishedAt=child[0].get("finishedAt"))
        open("/tmp/p4-lastthree/timeout-child-cmd.txt", "w").write(str(child[0].get("id")))
    else:
        log("P4.child-final", found=False, recordId=rid)
    s, r = req("GET", "/workflow/my/instances", user=BIZP0)
    insts = ((r.get("data") or {}).get("records")) or []
    mine = [i for i in insts if i.get("businessKey") == rid]
    log("P5.instance", found=bool(mine), count=len(mine),
        initiatorId=mine[0].get("initiatorId") if mine else None,
        status=mine[0].get("status") if mine else None)
    # 同意图不新建第二流程：再次 P0 提交同一草稿 = 幂等受理
    s, r = req("POST", f"/workflow/drafts/{draft}/submit?channel=P0", {}, user=BIZP0)
    d2 = r.get("data") or {}
    log("P6.resubmit-idempotent", http=s, code=r.get("code"), duplicated=d2.get("duplicated"),
        commandId=d2.get("commandId"), status=d2.get("status"))
    s, r = req("GET", "/workflow/my/instances", user=BIZP0)
    insts = ((r.get("data") or {}).get("records")) or []
    mine2 = [i for i in insts if i.get("businessKey") == rid]
    log("P7.instance-count-still", count=len(mine2))
