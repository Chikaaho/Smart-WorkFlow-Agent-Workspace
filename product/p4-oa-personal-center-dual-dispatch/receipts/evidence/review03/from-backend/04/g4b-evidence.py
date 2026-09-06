#!/usr/bin/env python3
# G4b 行为证据（在线真实路径）：ANY 会签实例上 NORMAL/P0 跨通道动作冲突遵守顺序、
# 结算后被取消任务不可再次办理、不冒充本人已办、P0 同步有界等待返回单次结果。
# 运行：python3 g4b-evidence.py >> g4b-evidence.out 2>&1
import json
import os
import time
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:8080/api")
FX = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures03-run.out")))
ADMIN = "1"
BIZ = FX["bizUser"]
DSP = FX["dspUser"]
FORM_KEY = "p4_oa_consensus_form_20260905b"


def req(method, path, body=None, user=ADMIN, timeout=20):
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


# ---- 1. 真实发起：biz 从已发布会签表单提交（NORMAL） ----
s, p = req("POST", "/workflow/drafts", {"formKey": FORM_KEY}, user=BIZ)
draft = str(p["data"]["id"])
req("PUT", f"/workflow/drafts/{draft}", {"payload": {"applicant": "会签发起人", "reason": "G4b 同实例跨通道"}}, user=BIZ)
s, p = req("POST", f"/workflow/drafts/{draft}/submit", user=BIZ)
cmd1 = str(p["data"]["commandId"])
log("S1.submit-normal", draftId=draft, commandId=cmd1)
for _ in range(20):
    s, p = req("GET", f"/workflow/commands/{cmd1}", user=BIZ)
    if p["data"]["status"] == "COMPLETED":
        break
    time.sleep(0.5)
log("S2.command-completed", status=p["data"]["status"], result=p["data"]["result"])
record_id = json.loads(p["data"]["result"])["recordId"]

# 找实例与两个参与人任务
inst = None
for _ in range(20):
    s, p = req("GET", "/workflow/my/instances?pageNum=1&pageSize=10", user=BIZ)
    cands = [i for i in p["data"]["records"] if i.get("businessKey") == record_id]
    if cands:
        inst = cands[0]
        break
    time.sleep(0.5)
assert inst is not None, "instance not visible after draft submit"
instance_id = str(inst["id"])
log("S3.instance-running", instanceId=instance_id, status=inst["status"], processDefKey=inst.get("processDefKey"))
s, p = req("GET", "/workflow/tasks/todo?pageNum=1&pageSize=20", user=BIZ)
biz_tasks = [str(t["taskId"]) for t in p["data"]["records"]]
s, p = req("GET", "/workflow/tasks/todo?pageNum=1&pageSize=20", user=DSP)
dsp_tasks = [str(t["taskId"]) for t in p["data"]["records"]]
log("S4.tasks", bizTasks=biz_tasks, dspTasks=dsp_tasks)

# ---- 2. dsp 走 P0 同步优先通道批准自己的任务（先结算方） ----
t_dsp = dsp_tasks[0]
s, p = req("POST", f"/workflow/commands/tasks/{t_dsp}/approve?channel=P0",
           {"comment": "P0 优先结算"}, user=DSP, timeout=30)
log("S5.dsp-p0-approve", http=s, code=p["code"], commandId=p["data"].get("commandId") if p.get("data") else None,
    status=p["data"].get("status") if p.get("data") else None)
p0_cmd = str(p["data"]["commandId"])
# P0 同步等待内通常已完成；兜底回查
for _ in range(10):
    s, p = req("GET", f"/workflow/commands/{p0_cmd}", user=DSP)
    if p["data"]["status"] in ("COMPLETED", "FAILED"):
        break
    time.sleep(0.5)
log("S6.p0-command-final", status=p["data"]["status"], result=p["data"].get("result"))

# ---- 3. biz 再走 NORMAL 批准已被结算取消的任务（后到方） → 确定冲突 ----
t_biz = biz_tasks[0]
s, p = req("GET", "/workflow/tasks/todo?pageNum=1&pageSize=20", user=BIZ)
still_there = [str(t["taskId"]) for t in p["data"]["records"]]
log("S7.biz-todo-after-settlement", stillThere=still_there, cancelledTaskGone=t_biz not in still_there)
s, p = req("POST", f"/workflow/commands/tasks/{t_biz}/approve?channel=NORMAL",
           {"comment": "迟到动作"}, user=BIZ)
log("S8.biz-normal-approve-after-settle", http=s, code=p["code"], msg=p.get("msg"))
late_cmd = str(p["data"]["commandId"]) if p.get("data") and p["data"].get("commandId") else None
if late_cmd:
    for _ in range(30):
        s, p = req("GET", f"/workflow/commands/{late_cmd}", user=BIZ)
        if p["data"]["status"] in ("COMPLETED", "FAILED"):
            break
        time.sleep(0.5)
    log("S9.late-command-final", status=p["data"]["status"], retry=p["data"].get("retryCount"),
        reason=(p["data"].get("failureReason") or "")[:60])

# ---- 4. 副作用唯一性读回 ----
s, p = req("GET", f"/workflow/my/instances/{instance_id}", user=BIZ)
log("S10.instance-final", status=p["data"]["status"], progress=p["data"].get("progress"))
s, p = req("GET", "/workflow/my/processed?pageNum=1&pageSize=20", user=DSP)
dsp_processed = len(p["data"]["records"])
s, p = req("GET", "/workflow/my/processed?pageNum=1&pageSize=20", user=BIZ)
biz_processed = len(p["data"]["records"])
log("S11.processed-counts", dspProcessed=dsp_processed, bizProcessed=biz_processed)
s, p = req("GET", f"/workflow/tasks/todo?pageNum=1&pageSize=20", user=DSP)
log("S12.dsp-todo-cleared", remaining=len(p["data"]["records"]))
