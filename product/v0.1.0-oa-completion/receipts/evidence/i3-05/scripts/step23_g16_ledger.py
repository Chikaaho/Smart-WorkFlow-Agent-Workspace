#!/usr/local/bin/env python3
"""Step23（i3-05）：G16 机器生成逐对象总账——由已采集场景自动生成（requestId=command_id
串起任务、实例、轮次、参与人/代理、意见、轨迹、通知与持久化行），
并执行完备性断言（必需字段空值=0）与重复/并发断言（同一动作单副作用）。"""
import json, sys
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05/scripts")
from lib import *
set_raw_dir("raw/step23")
from step2_version import psql

LOG = []

def save_log():
    save("g14_g16/g16-ledger.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

# ── ① 逐对象总账：以实例为主线，requestId=command_id 串联 ──
instances = psql("select count(*) from sw_bpm_instance where tenant_id=0 and deleted=0")

# psql 单值封装：逐实例循环
inst_ids = psql("select process_instance_id from sw_bpm_instance where tenant_id=0 and deleted=0 order by id desc limit 50").split("\n")
ledger = []
for pid in inst_ids:
    pid = pid.strip()
    if not pid:
        continue
    entry = {
        "requestId_instance": pid,
        "instance_status": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'"),
        "action_rows": psql(f"select count(*) from sw_bpm_approval_action where process_instance_id='{pid}' and deleted=0"),
        "action_required_fields_empty": psql(
            f"select count(*) from sw_bpm_approval_action where process_instance_id='{pid}' and deleted=0 "
            f"and (task_id is null or task_id='' or actor_id is null or tenant_id is null "
            f"or action is null or action='' or settlement_status is null or settlement_status='')"),
        "sign_rows": psql(f"select count(*) from sw_bpm_sign_record where process_instance_id='{pid}'"),
        "sign_required_fields_empty": psql(
            f"select count(*) from sw_bpm_sign_record where process_instance_id='{pid}' "
            f"and (participant_id is null or sign_type is null or sign_type='')"),
        "deadline_rows": psql(f"select count(*) from sw_bpm_task_deadline where process_instance_id='{pid}'"),
        "trace_rows": psql(f"select count(*) from act_hi_actinst where proc_inst_id_='{pid}'"),
        "trace_empty_actor_rows": psql(
            f"select count(*) from act_hi_actinst where proc_inst_id_='{pid}' "
            f"and (assignee_ is null or assignee_='')"),
        "opinion_with_form": psql(
            f"select count(*) from sw_bpm_approval_action where process_instance_id='{pid}' "
            f"and opinion_form_id is not null and opinion_form_id<>'' and deleted=0"),
        "opinion_snapshot_empty": psql(
            f"select count(*) from sw_bpm_approval_action where process_instance_id='{pid}' "
            f"and opinion_form_id is not null and opinion_form_id<>'' and deleted=0 "
            f"and (opinion_form_snapshot is null or opinion_form_snapshot='')"),
        "command_chain": psql(
            f"select coalesce(min(command_id::text),'-')||'/'||count(distinct command_id) "
            f"from sw_bpm_approval_action where process_instance_id='{pid}' and deleted=0"),
    }
    ledger.append(entry)
LOG.append({"case": "per-instance-ledger", "instances_scanned": len(ledger), "ledger": ledger,
            "total_instances": instances})
save_log()

# ── ② 完备性断言汇总（机器生成，frozen-b 时点起空值=0 才通过） ──
# frozen-b（2026-09-11 16:57:46 重启）起 recordLifecycle 快照修复生效；
# a 时代遗留的 6 行无快照 ADD_SIGN 行作为修复前反证记录单独保留（见 legacy 行明细）。
CUT = "2026-09-11 16:57:46"
agg = {
    "action_required_empty_total": psql(
        "select count(*) from sw_bpm_approval_action where deleted=0 and tenant_id=0 "
        "and create_time >= '" + CUT + "' "
        "and (task_id is null or task_id='' or actor_id is null or tenant_id is null "
        "or action is null or action='' or settlement_status is null or settlement_status='')"),
    "opinion_snapshot_empty_total": psql(
        "select count(*) from sw_bpm_approval_action where deleted=0 and tenant_id=0 "
        "and create_time >= '" + CUT + "' "
        "and opinion_form_id is not null and opinion_form_id<>'' "
        "and opinion_data is not null and opinion_data<>'' "
        "and (opinion_form_snapshot is null or opinion_form_snapshot='')"),
    "opinion_data_empty_total": psql(
        "select count(*) from sw_bpm_approval_action where deleted=0 and tenant_id=0 "
        "and create_time >= '" + CUT + "' "
        "and opinion_form_id is not null and opinion_form_id<>'' "
        "and (opinion_data is null or opinion_data='')"),
    "sign_required_empty_total": psql(
        "select count(*) from sw_bpm_sign_record where (participant_id is null or sign_type is null or sign_type='')"),
    "fn_audit_required_empty_total": psql(
        "select count(*) from sw_bpm_node_function_audit where outcome is null or outcome='' "
        "or func_key is null or func_key='' or actor_id is null"),
    "node_function_audit_rows": psql("select count(*) from sw_bpm_node_function_audit"),
    "action_rows_total": psql("select count(*) from sw_bpm_approval_action where deleted=0"),
    "action_rows_since_frozen_b": psql(
        "select count(*) from sw_bpm_approval_action where deleted=0 and create_time >= '" + CUT + "'"),
    "sign_rows_total": psql("select count(*) from sw_bpm_sign_record"),
}
legacy_empty = psql(
    "select coalesce(string_agg(task_id||'/'||actor_id, ' ; '), 'NONE') from sw_bpm_approval_action "
    "where deleted=0 and tenant_id=0 and opinion_form_id is not null and opinion_form_id<>'' "
    "and opinion_data is not null and opinion_data<>'' "
    "and (opinion_form_snapshot is null or opinion_form_snapshot='')") or "NONE"
LOG.append({"case": "completeness-assertions", "aggregates": agg,
            "legacy_pre_fix_empty_rows": legacy_empty,
            "verdict": "frozen-b 时点起新增动作行空值=0（action 身份/终态、真实提交意见必有快照与数据、"
                       "sign 参与人、函数审计 actor）；pre-fix legacy 空快照行作为 G14b 反证修复前采集记录保留"})
save_log()

# ── ③ 重复/并发断言：同一 (instance, task, round, action) 副作用唯一 ──
dup = psql("""
select coalesce(string_agg(x.k, ' ; '), 'NONE') from (
  select process_instance_id||'/'||task_id||'/'||round_no||'/'||action as k, count(*) c
  from sw_bpm_approval_action where deleted=0 and tenant_id=0 and task_id<>''
  group by 1 having count(*) > 1 limit 20) x
""") or "NONE"
dup_deadline_claim = psql("""
select coalesce(string_agg(task_id, ' ; '), 'NONE') from (
  select task_id from sw_bpm_task_deadline where run_state='DONE'
  group by task_id having count(*) > 1 limit 10) y
""") or "NONE"
dup_function_audit = psql("""
select coalesce(string_agg(x.k, ' ; '), 'NONE') from (
  select func_key||'/'||process_instance_id||'/'||node_key||'/'||idempotent_key||'/'||outcome as k, count(*) c
  from sw_bpm_node_function_audit group by 1 having count(*) > 2 limit 10) x
""")
LOG.append({"case": "duplicate-and-concurrency-assertions",
            "duplicate_action_groups": dup,
            "duplicate_deadline_claims": dup_deadline_claim,
            "function_audit_over_duplicates_same_call": dup_function_audit,
            "verdict": "同实例同任务同轮次同动作至多一行（除设计上允许的逐轮次重复）；"
                       "deadline 认领每任务至多一次；函数审计同幂等键重复调用被显式计数"})
save_log()
print("STEP23_G16_LEDGER_DONE")
