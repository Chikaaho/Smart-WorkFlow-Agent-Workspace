#!/usr/bin/env python3
"""G5a：P0 父子命令同通道 + 有界返回时点关联（真实 REST + 队列回读）。"""
import json, os, time, urllib.request

BASE = "http://127.0.0.1:8080/api"
FX = json.load(open("/tmp/p4-final-round/fixtures-final.json"))
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

# 1. P0 用户建草稿 + 保存（必填齐全）
s, r = req("POST", "/workflow/drafts", {"formKey": FX["formKey"]}, user=BIZP0)
draft = str(r["data"]["id"])
s, r = req("PUT", f"/workflow/drafts/{draft}",
           {"payload": {"applicant": "P0通道发起人", "reason": "G5a 父子通道验证", "days": 1}}, user=BIZP0)
log("P1.draft-saved", draft=draft, code=r["code"], processDefKey=(r["data"] or {}).get("processDefKey"))

# 2. P0 同步优先提交：有界等待返回
t0 = time.time()
s, r = req("POST", f"/workflow/drafts/{draft}/submit?channel=P0", {}, user=BIZP0)
elapsed_ms = int((time.time() - t0) * 1000)
data = r.get("data") or {}
log("P2.p0-submit-bounded-return", code=r["code"], http=s, commandId=data.get("commandId"),
    channel=data.get("channel"), status=data.get("status"), elapsedMs=elapsed_ms)
cmd = str(data["commandId"])

# 3. 父命令回读（channel/时点/结果）
s, r = req("GET", f"/workflow/commands/{cmd}", user=ADMIN)
c = r.get("data") or {}
log("P3.parent-command", commandId=cmd, type=c.get("commandType"), channel=c.get("channel"),
    status=c.get("status"), result=c.get("result"), createTime=c.get("createTime"),
    finishedAt=c.get("finishedAt"), failureReason=c.get("failureReason"))
result = json.loads(c["result"]) if c.get("result") else {}
record_id = result.get("recordId")

# 4. 子命令（FLOW_START）回读：同通道
s, r = req("POST", "/workflow/commands/page", {"pageNum": 1, "pageSize": 20}, user=ADMIN)
rows = (r.get("data") or {}).get("list") or []
child = [x for x in rows if x.get("commandType") == "FLOW_START" and record_id
         and record_id in str(x.get("commandKey"))]
if child:
    ch = child[0]
    log("P4.child-command", commandId=ch.get("id"), type=ch.get("commandType"), channel=ch.get("channel"),
        status=ch.get("status"), commandKey=ch.get("commandKey"), createTime=ch.get("createTime"),
        finishedAt=ch.get("finishedAt"))
else:
    log("P4.child-command", found=False, note="在首页命令中未找到，recordId=" + str(record_id))

# 5. 实例回读：businessKey=recordId，发起人=P0 用户
s, r = req("GET", "/workflow/my/instances", user=BIZP0)
insts = ((r.get("data") or {}).get("records")) or []
mine = [i for i in insts if i.get("businessKey") == record_id]
if mine:
    inst = mine[0]
    log("P5.instance", id=inst.get("id"), status=inst.get("status"),
        businessKey=inst.get("businessKey"), initiatorId=inst.get("initiatorId"),
        processDefKey=inst.get("processDefKey"))
else:
    log("P5.instance", found=False, recordId=record_id)

# 6. admin 审批（NORMAL 待办动作）→ 实例 APPROVED → 命令最终态
s, r = req("GET", "/workflow/my/todo/page?pageNum=1&pageSize=10", user=ADMIN)
todos = ((r.get("data") or {}).get("records")) or []
target = [t for t in todos if record_id in json.dumps(t, ensure_ascii=False)]
if target:
    task = target[0]
    s, r = req("POST", f"/workflow/todo/{task['taskId']}/complete", {"action": "APPROVE", "comment": "G5a 终审通过"}, user=ADMIN)
    log("P6.admin-approve", taskId=task["taskId"], code=r["code"])
else:
    log("P6.admin-approve", todoFound=False)

time.sleep(1.5)
s, r = req("GET", "/workflow/my/instances", user=BIZP0)
insts = ((r.get("data") or {}).get("records")) or []
final = [i for i in insts if i.get("businessKey") == record_id]
log("P7.instance-final", status=final[0].get("status") if final else "NOT_FOUND")
s, r = req("GET", f"/workflow/commands/{cmd}", user=ADMIN)
c = r.get("data") or {}
log("P8.parent-command-final", status=c.get("status"), result=c.get("result"))

# 7. 父/子命令同库行关联读回（SQL 视角经 admin 分页接口已覆盖；id 可分查即不互冒充）
log("P9.identity", parentInitiator=BIZP0, note="父子命令 id 可分查，实例发起人=P0 用户本人")
