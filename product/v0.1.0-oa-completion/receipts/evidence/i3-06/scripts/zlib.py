#!/usr/bin/env python3
"""Z5—Z9 采集公共助手（进程内无 import 副作用；不触碰 raw 目录——调用方自行 set_raw_dir）。"""
import hashlib, json, subprocess, time, uuid

EV = "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06"
_pg_port = None


def pg_port():
    global _pg_port
    if _pg_port is None:
        _pg_port = open("/tmp/i3-03/pg-port.txt").read().strip()
    return _pg_port


def psql(sql):
    r = subprocess.run(
        ["psql", "-h", "localhost", "-p", pg_port(), "-U", "postgres", "-d", "smart_workflow", "-t", "-A", "-c", sql],
        capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


def marker(seq, label):
    return f"{seq}-{label}-{uuid.uuid4().hex[:8]}"


def action_rows(pid):
    raw = psql("select id||'|'||node_key||'|'||task_id||'|'||actor_id||'|'||action||'|'||settlement_status||'|'||coalesce(round_no::text,'-')||'|'||coalesce(target_user_id::text,'-')||'|'||coalesce(proxy_for_user_id::text,'-')||'|'||coalesce(opinion_data,'-') from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0 order by id")
    return [r for r in raw.split("\n") if r] if raw else []


def trace_rows(pid):
    raw = psql("select act_type_||'|'||act_name_||'|'||coalesce(assignee_,'-')||'|'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='" + pid + "' order by start_time_, id_")
    return [r for r in raw.split("\n") if r] if raw else []


def notify_rows(pid):
    raw = psql("select distinct biz_type||'|'||biz_id||'|'||coalesce(recipient_id::text,'-')||'|'||title from sw_notify_message where biz_id='" + pid + "' or biz_id in (select id::text from sw_bpm_instance where process_instance_id='" + pid + "') or biz_id in (select task_id from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0) order by 1")
    return [r for r in raw.split("\n") if r] if raw else []


def inst_status(pid):
    return psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'")


def sign_rows_for(pid):
    raw = psql("select id||'|'||sign_type||'|'||mode_type||'|'||coalesce(seq_no::text,'-')||'|'||sign_status||'|'||coalesce(result_status,'-')||'|'||participant_id||'|'||coalesce(opinion_data,'-')||'|'||task_id from sw_bpm_sign_record where task_id in (select task_id from sw_bpm_approval_action where process_instance_id='" + pid + "' and deleted=0) order by id")
    return [r for r in raw.split("\n") if r] if raw else []


def chain(pid, mk, extra=None):
    c = {"request_marker": mk, "action_rows": action_rows(pid), "trace_rows": trace_rows(pid),
         "notify_rows": notify_rows(pid), "instance_status": inst_status(pid)}
    if extra:
        c.update(extra)
    return c


def sha256(text):
    return hashlib.sha256(text.encode()).hexdigest()
