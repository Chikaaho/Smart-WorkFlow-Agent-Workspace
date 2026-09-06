#!/usr/bin/env python3
# G6b 窗口实验（阶段2：进程B恢复消费后的终态读回 + 身份无残留正向复核）。
# 运行：BASE=http://localhost:18083/api python3 g6b-phase2.py
import json
import os
import time
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:18083/api")
HERE = os.path.dirname(os.path.abspath(__file__))
FX = json.load(open(os.path.join(HERE, "g6b-fixtures.out")))
W = json.load(open(os.path.join(HERE, "g6b-window.json")))
ADMIN = "1"
BIZ = W["biz"]
DSP = W["dsp"]
CMD_P0 = W["cmdP0"]
CMD_NORMAL = W["cmdNormal"]


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


def wait_terminal(cmd, user, seconds=120):
    last = None
    deadline = time.time() + seconds
    while time.time() < deadline:
        s, p = req("GET", f"/workflow/commands/{cmd}", user=user)
        last = p["data"]
        if last["status"] in ("COMPLETED", "FAILED"):
            return last
        time.sleep(1)
    return last


# ---- 1. P0 命令：消费时权限回查失败 → 确定拒绝 ----
final_p0 = wait_terminal(CMD_P0, DSP)
log("R1.p0-consume-rejected", commandId=CMD_P0, status=final_p0["status"],
    result=final_p0.get("result"), reason=(final_p0.get("failureReason") or "")[:80])

# ---- 2. NORMAL 命令：消费时可见范围已撤 → 字段级“表单不存在” → 有界重试后 FAILED ----
final_n = wait_terminal(CMD_NORMAL, BIZ)
log("R2.normal-consume-rejected", commandId=CMD_NORMAL, status=final_n["status"],
    retryCount=final_n.get("retryCount"), reason=(final_n.get("failureReason") or "")[:80])

# ---- 3. 草稿终态：FAILED 可修正，内容保留（消费前拒绝补偿已触发） ----
# 从“我的草稿”列表定位两条受理草稿（命令回查 DTO 不含 commandKey）
def failed_draft(user):
    s, p = req("GET", "/workflow/drafts?pageNum=1&pageSize=50", user=user)
    for r in p["data"]["records"]:
        if r["status"] == "FAILED" and r.get("lastError"):
            return str(r["id"]), r
    return None, None

d_dsp, row_dsp = failed_draft(DSP)
d_biz, row_biz = failed_draft(BIZ)
log("R3.dsp-draft-failed-preserved", draftId=d_dsp, status=row_dsp["status"],
    lastError=(row_dsp.get("lastError") or "")[:70], payload=row_dsp["payload"])
log("R4.biz-draft-failed-preserved", draftId=d_biz, status=row_biz["status"],
    lastError=(row_biz.get("lastError") or "")[:70], payload=row_biz["payload"])

# ---- 4. 无业务副作用：无实例、无我的待办/已办 ----
s, p = req("GET", "/workflow/my/instances?pageNum=1&pageSize=10", user=DSP)
log("R5.dsp-instances", count=p["data"]["total"] if "total" in p["data"] else len(p["data"]["records"]))
s, p = req("GET", "/workflow/my/instances?pageNum=1&pageSize=10", user=BIZ)
log("R6.biz-instances", count=p["data"]["total"] if "total" in p["data"] else len(p["data"]["records"]))
s, p = req("GET", "/workflow/my/processed?pageNum=1&pageSize=10", user=DSP)
log("R7.dsp-processed", count=len(p["data"]["records"]))

# ---- 5. 身份无残留：拒绝后 dsp 以自己身份正常走通新提交 ----
s, p = req("POST", "/workflow/drafts", {"formKey": "p4_oa_consensus_form_20260905b"}, user=DSP)
d_new = str(p["data"]["id"])
req("PUT", f"/workflow/drafts/{d_new}", {"payload": {"applicant": "身份残留复核", "reason": "G6b 拒绝后正向"}}, user=DSP)
s, p = req("POST", f"/workflow/drafts/{d_new}/submit", user=DSP)
cmd_new = str(p["data"]["commandId"])
final_new = wait_terminal(cmd_new, DSP)
log("R8.post-reject-submit-ok", commandId=cmd_new, status=final_new["status"], result=final_new.get("result"))
s, p = req("GET", "/workflow/my/instances?pageNum=1&pageSize=10", user=DSP)
recs = p["data"]["records"]
log("R9.new-instance", count=len(recs), statuses=[r["status"] for r in recs])
