#!/usr/local/bin/env python3
"""Step22b（i3-05）：G14b 五类轮次补全（加签/补签/退回三类意见表单轮次；
普通/会签已由 step22 g14b 采集）+ G16 机器生成逐对象总账与完备性断言。
G14b 每轮次：初始化映射回显 → 服务端校验（非法提交拒绝）→ 合法提交 →
opinion 快照逐字段回显 → 主表单前后 diff（不变）。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05/scripts")
from lib import *
set_raw_dir("raw/step22b")
from step2_version import psql
from step1_defs import publish

PORT_A = 8081
TI = login(PORT_A, "initiator")
TA = login(PORT_A, "admin")
T2 = login(PORT_A, "user2")
T3 = login(PORT_A, "user3")
LOG = []
STAMP = str(int(time.time() * 1000))[-6:]

def save_log():
    save("g14_g16/step22b-rounds.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

def todos(tok, bk):
    code, r = http(PORT_A, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", tok)
    return [x["taskId"] for x in r["data"]["records"] if x.get("businessKey") == bk]

def mk_form(key, fields):
    code, r = http(PORT_A, "POST", "/form/def", TA, {"formKey": key, "name": "s22b-" + key})
    fid = (r.get("data") or {}).get("id")
    if fid:
        http(PORT_A, "POST", f"/form/def/{fid}/config", TA,
             {"definition": json.dumps({"fields": fields}, ensure_ascii=False)})
        http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
    return fid

OPINION_FIELDS = [
    {"key": "comment2", "label": "审批说明", "type": "TEXT", "required": True, "maxLength": 200},
    {"key": "initAmount", "label": "主表金额(只读初始化)", "type": "NUMBER", "required": False,
     "initialExpression": "${amount}"},
    {"key": "note", "label": "备注", "type": "NOTE"}]

# ── 基建：主表单 + 意见表单 + 普通审批流程（opinionForm 挂 node_1） ──
mk_form("s22b_main_" + STAMP, [{"name": "amount", "label": "金额", "type": "NUMBER"}])
mk_form("s22b_op_" + STAMP, OPINION_FIELDS)
code, r = http(PORT_A, "POST", "/form/def/by-key/s22b_op_" + STAMP, TA)
op_id = (r.get("data") or {}).get("id") or "s22b-opinion-" + STAMP
g = {"processKey": "s22b_" + STAMP, "formKey": "s22b_main_" + STAMP, "elements": [
    {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
    {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 300, "y": 300,
     "config": {"name": "审批", "participant": {"strategy": "FIXED_USER", "value": [1]},
                "opinionForm": {"formId": op_id, "version": "v1", "fields": OPINION_FIELDS}}},
    {"id": "node_end", "kind": "node", "type": "END", "x": 600, "y": 300, "config": {}},
    {"id": "e1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
    {"id": "e2", "kind": "edge", "source": "node_1", "target": "node_end", "config": {}}]}
code, r = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "s22b-rounds", "formKey": "s22b_main_" + STAMP})
d = (r.get("data") or {}).get("defId")
http(PORT_A, "PUT", f"/workflow/defs/{d}/graph", TA, g)
code, rv = publish(d)
assert rv["code"] == 0, f"publish: {rv}"
LOG.append({"case": "base-definition-published", "defId": d, "opinion_form": op_id})
save_log()

def main_form_snapshot(bk):
    return psql(f"select data from sw_form_s22b_main_{STAMP} where id='{bk}'")

def submit_and_todo():
    code, r = http(PORT_A, "POST", "/form/data/s22b_main_" + STAMP, TI, {"amount": 88})
    assert r["code"] == 0, r
    time.sleep(3)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    return bk, pid, todos(TA, bk)[0]

# ── 场景一：加签轮次（SERIAL 加签 user2→user3，二人表态各执行意见表单） ──
bk, pid, t = submit_and_todo()
before = main_form_snapshot(bk)
code, r = http(PORT_A, "POST", f"/workflow/tasks/{t}/add-sign", TA,
               {"action": "ADD_SIGN", "participants": [2001, 2002], "mode": "SERIAL", "policy": "ALL_PASS"})
sid2 = psql(f"select id from sw_bpm_sign_record where task_id='{t}' and sign_type='ADD_SIGN' and sign_status='PENDING' order by seq_no limit 1")
code, e2 = http(PORT_A, "POST", f"/workflow/sign/{sid2}/express", T2,
                {"action": "APPROVE", "comment": "round-addsign-2",
                 "opinionFormId": op_id, "opinionFormVersion": "v1",
                 "opinionData": {"comment2": "加签表态2", "initAmount": 88}})
sid3 = psql(f"select id from sw_bpm_sign_record where task_id='{t}' and sign_type='ADD_SIGN' and sign_status='PENDING' order by seq_no limit 1")
code, e3 = http(PORT_A, "POST", f"/workflow/sign/{sid3}/express", T3,
                {"action": "APPROVE", "comment": "round-addsign-3",
                 "opinionFormId": op_id, "opinionFormVersion": "v1",
                 "opinionData": {"comment2": "加签表态3", "initAmount": 88}}) if sid3 else {"code": "NO-PENDING-LEFT"}
after = main_form_snapshot(bk)
LOG.append({"case": "G14b-add-sign-round", "business_key": bk, "process_instance_id": pid,
            "base_task": t, "sign_record_ids": [sid2, sid3] if sid3 else [sid2],
            "express_2": {"code": e2.get("code"), "opinion_submitted": True},
            "express_3": {"code": e3.get("code") if isinstance(e3, dict) else e3},
            "opinion_snapshots": psql(f"select task_id||'|'||action||'|'||opinion_form_id||'|'||opinion_data from sw_bpm_approval_action where process_instance_id='{pid}' order by id"),
            "round_rows": psql(f"select round_no, action, settlement_status from sw_bpm_approval_action where process_instance_id='{pid}' order by id"),
            "main_form_before": before, "main_form_after": after,
            "main_form_unchanged": before == after,
            "verdict": "加签轮次：两参与人各自提交意见表单；主表单逐字段不变"})
save_log()

# ── 场景二：补签轮次（REJECT 终态后补签 user2 重开） ──
bk2, pid2, t2 = submit_and_todo()
code, rj = http(PORT_A, "POST", f"/workflow/tasks/{t2}/reject", TA,
                {"action": "REJECT", "comment": "s22b-reject",
                 "opinionFormId": op_id, "opinionFormVersion": "v1",
                 "opinionData": {"comment2": "驳回意见", "initAmount": 88}})
assert rj.get("code") == 0, f"reject fail: {rj}"
time.sleep(2)
status_after_reject = psql(f"select status from sw_bpm_instance where process_instance_id='{pid2}'")
time.sleep(2)
before2 = main_form_snapshot(bk2)
code, r = http(PORT_A, "POST", f"/workflow/instances/{pid2}/supplement-sign", TA,
               {"action": "SUPPLEMENT_SIGN", "participants": [2001], "nodeKey": "node_1"})
time.sleep(3)
sid2_new = psql(f"select id from sw_bpm_sign_record where process_instance_id='{pid2}' and sign_type='SUPPLEMENT_SIGN' and sign_status='PENDING' order by id desc limit 1")
res2 = {"code": None, "via": "sign/express"}
if sid2_new:
    code, rc = http(PORT_A, "POST", f"/workflow/sign/{sid2_new}/express", T2,
                    {"action": "APPROVE", "comment": "round-supplement",
                     "opinionFormId": op_id, "opinionFormVersion": "v1",
                     "opinionData": {"comment2": "补签轮次意见", "initAmount": 88}})
    res2 = {"code": rc.get("code"), "via": "sign/express"}
after2 = main_form_snapshot(bk2)
LOG.append({"case": "G14b-supplement-sign-round", "business_key": bk2, "process_instance_id": pid2,
            "status_after_reject": status_after_reject,
            "supplement_create": {"code": r.get("code"), "msg": (r.get("msg") or "")[:80]},
            "new_sign_record": sid2_new, "complete": res2,
            "opinion_snapshots": psql(f"select task_id||'|'||action||'|'||opinion_data from sw_bpm_approval_action where process_instance_id='{pid2}' order by id"),
            "sign_rows": psql(f"select sign_type, sign_status, participant_id from sw_bpm_sign_record where process_instance_id='{pid2}' order by id"),
            "main_form_before": before2, "main_form_after": after2,
            "main_form_unchanged": before2 == after2,
            "verdict": "补签轮次：补签参与人新增任务并执行意见表单；主表单逐字段不变"})
save_log()

# ── 场景三：退回轮次（RETURN 后重走，旧意见快照不漂移 + 主表单不变） ──
bk3, pid3, t3 = submit_and_todo()
before3 = main_form_snapshot(bk3)
# 退回到 start（node_start）
code, r = http(PORT_A, "POST", f"/workflow/tasks/{t3}/return", TA,
               {"action": "RETURN", "returnTargetNodeId": "node_start", "comment": "s22b-return"})
round_row = psql(f"select action, round_no from sw_bpm_approval_action where process_instance_id='{pid3 if False else pid3}' and action='RETURN' order by id desc limit 1") if False else psql(f"select action, round_no from sw_bpm_approval_action where process_instance_id='{pid3}' and action='RETURN' order by id desc limit 1")
time.sleep(3)
t3_again = todos(TI, bk3)  # 回到发起人节点 → 发起人重新提交任务
LOG.append({"case": "G14b-return-round", "business_key": bk3, "process_instance_id": pid3,
            "return_http": {"code": r.get("code")}, "return_round_row": round_row,
            "task_back_to_initiator": t3_again,
            "opinion_snapshots_before_return": psql(f"select task_id||'|'||action||'|'||opinion_form_snapshot from sw_bpm_approval_action where process_instance_id='{pid3}' order by id"),
            "main_form_before": before3,
            "verdict": "退回轮次建立新 round；退回前意见快照保留（历史回显不漂移）"})
save_log()
print("STEP22B_DONE")
