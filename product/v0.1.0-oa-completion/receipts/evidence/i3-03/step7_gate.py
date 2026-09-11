#!/usr/bin/env python3
"""Step7(final): G14 矩阵 validate 通道刷新 + G16 对象账本导出 + 通知记录回读 + manifest/哈希回读。
门禁原始流由 shell 层执行（server-test-r4.txt / web-*-r4.txt），本脚本不重跑门禁。"""
import json, sys, time, subprocess, os
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-03")
from lib import *
from step2_version import psql

PORT_A = 8081
TA = login(PORT_A, "admin")

# ---- G14 矩阵（validate 通道，与 publish 同源校验器；含 2417 组件适用拒绝） ----
def _mk_form(key):
    code, r = http(PORT_A, "POST", "/form/def", TA, {"formKey": key, "name": "vmx-" + key})
    fid = (r.get("data") or {}).get("id")
    if fid:
        http(PORT_A, "POST", f"/form/def/{fid}/config", TA,
             {"definition": json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]})})
        http(PORT_A, "POST", f"/form/def/{fid}/publish", TA)
matrix = []
for ftype in ["TEXT", "TEXTAREA", "NUMBER", "RADIO", "CHECKBOX", "SELECT", "DATETIME", "NOTE", "RICH_TEXT"]:
    key = f"vmx{ftype[0]}{len(ftype)}"
    _mk_form("vmxform_" + key)
    code, r = http(PORT_A, "POST", "/workflow/defs/validate", TA, {
        "processKey": f"vmx_{ftype}", "name": "vmx", "formKey": f"vmxform_{key}",
        "contractVersion": 2,
        "elements": [
            {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
            {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 300, "y": 300,
             "config": {"name": "m", "participant": {"strategy": "FIXED_USER", "value": [1]},
                        "opinionForm": {"formId": "m-" + ftype, "version": "v1",
                                        "fields": [{"key": "f1", "label": ftype, "type": ftype}]}}},
            {"id": "node_end", "kind": "node", "type": "END", "x": 600, "y": 300, "config": {}},
            {"id": "e1", "kind": "edge", "source": "node_start", "target": "node_1"},
            {"id": "e2", "kind": "edge", "source": "node_1", "target": "node_end"}]})
    errs = r.get("data") or []
    matrix.append({"fieldType": ftype, "validateErrors": sorted({e.get("errorCode") for e in errs}),
                   "accepted": len(errs) == 0})
save("g14_opinion/matrix-validate.json", matrix)

# ---- G16 对象账本导出 ----
tables = {
    "sw_bpm_instance": "select * from sw_bpm_instance order by create_time desc limit 40",
    "sw_bpm_approval_action": "select * from sw_bpm_approval_action order by create_time desc limit 60",
    "sw_bpm_participant_snapshot": "select * from sw_bpm_participant_snapshot order by create_time desc limit 80",
    "sw_bpm_communication": "select * from sw_bpm_communication order by create_time desc limit 20",
    "sw_bpm_sign_record": "select * from sw_bpm_sign_record order by create_time desc limit 20",
    "sw_bpm_task_deadline": "select * from sw_bpm_task_deadline order by create_time desc limit 20",
    "sw_bpm_authorize_rule": "select * from sw_bpm_authorize_rule order by create_time desc limit 20",
    "sw_bpm_consensus_vote": "select * from sw_bpm_consensus_vote order by create_time desc limit 40",
    "sw_bpm_process_def_version": "select id, def_id, graph_version, status, name, form_key, form_version, function_versions, deployment_id, process_definition_id, published_by, published_at from sw_bpm_process_def_version order by create_time desc limit 30",
    "act_hi_actinst_i3": "select proc_inst_id_, activity_type_, activity_name_, start_time_, end_time_, delete_reason_ from act_hi_actinst where proc_inst_id_ in (select process_instance_id from sw_bpm_instance order by create_time desc limit 15) order by proc_inst_id_, start_time_",
}
ledger = {}
for name, sql in tables.items():
    ledger[name] = psql(sql)
save("g16_ledger/ledger.json", ledger)

# 通知发送记录（站内信持久化表）
n = psql("select to_char(create_time,'YYYY-MM-DD HH24:MI') || ' -> ' || coalesce(recipient_id::text,'-') || ' : ' || coalesce(title,'-') from sw_notify_record order by create_time desc limit 25")
save("g16_ledger/notify-records.txt", n or "(no rows)")
ntables = psql("select table_name from information_schema.tables where table_schema='public' and table_name like '%notify%' or table_name like 'sw_message%' or table_name like 'sw_message%' limit 10")
save("g16_ledger/notify-tables.txt", ntables or "(none)")

# ---- manifest + 哈希回读（排除自身与校验输出） ----
os.chdir(EV)
subprocess.run(["find", ".", "-type", "f",
                "!", "-name", "MANIFEST-SHA256.txt",
                "!", "-name", "manifest-verify.out",
                "!", "-path", "./__pycache__/*",
                "-exec", "shasum", "-a", "256", "{}", ";"],
               stdout=open("MANIFEST-SHA256.txt", "w"), stderr=subprocess.DEVNULL)
v = subprocess.run(["shasum", "-a", "256", "-c", "MANIFEST-SHA256.txt"], capture_output=True, text=True)
ok_lines = sum(1 for line in v.stdout.splitlines() if line.endswith(": OK") or line.endswith(" OK"))
save("manifest-verify.out", v.stdout + ("\nSTDERR:\n" + v.stderr if v.returncode else "\nALL_OK"))
print("STEP7_DONE manifest_lines=", len(open("MANIFEST-SHA256.txt").read().splitlines()), "verify_ok=", v.returncode == 0)
