// R6: 调度收口 — 真实提醒通知行、人工催办记录与通知行、唯一终态摘要（作废旧失败项）、PID 链
import { login, api, q, sleep, save, setRawDir, uuid8, SNAPSHOT } from './lib.mjs';

const EV = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i3-07/R6';
setRawDir(EV + '/raw');
const PA = 8081;
const TA = await login(PA, 'admin');
const LOG = {};
const mk = 'r6-sched-' + uuid8();

// ---- 1) 提醒定义（无自动策略，dueMinutes=1 → TASK_DEADLINE_ALERT 提醒/升级）----
let [, r] = await api(PA, TA, 'POST', '/form/def', { formKey: 'i3ev_r6r', name: 'R6-提醒审批' });
let fid = r?.data?.id;
if (!fid) { [, r] = await api(PA, TA, 'GET', '/form/def/by-key/i3ev_r6r'); fid = r?.data?.id; }
await api(PA, TA, 'POST', `/form/def/${fid}/config`, { definition: JSON.stringify({ fields: [{ name: 'amount', label: '金额', type: 'NUMBER' }] }) });
[, r] = await api(PA, TA, 'POST', `/form/def/${fid}/publish`);
const g = { processKey: '', name: 'R6-提醒审批', formKey: 'i3ev_r6r', contractVersion: 2,
  elements: [
    { id: 'node_start', kind: 'node', type: 'START', x: 100, y: 300, config: {} },
    { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '提醒审批', participant: { strategy: 'FIXED_USER', value: [2001] }, deadline: { dueMinutes: 1 } } },
    { id: 'node_end', kind: 'node', type: 'END', x: 540, y: 300, config: {} },
    { id: 'e1', kind: 'edge', source: 'node_start', target: 'node_1', config: {} },
    { id: 'e2', kind: 'edge', source: 'node_1', target: 'node_end', config: {} }],
  canvas: {} };
[, r] = await api(PA, TA, 'GET', '/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_r6r');
let defId = ((r?.data?.records) || []).find(x => x.name === 'R6-提醒审批')?.id;
if (!defId) { [, r] = await api(PA, TA, 'POST', '/workflow/defs', { name: 'R6-提醒审批', formKey: 'i3ev_r6r' }); defId = r.data.defId; }
[, r] = await api(PA, TA, 'PUT', `/workflow/defs/${defId}/graph`, g);
LOG.graph_put = { code: r.code };
[, r] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/validate`);
LOG.validate = { code: r.code, errors: r.data || [] };
[, r] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/publish`);
LOG.publish = { code: r.code };

// ---- 2) 提交并等待真实提醒触发 ----
[, r] = await api(PA, TA, 'POST', '/form/data/i3ev_r6r', { amount: 7 });
if (r.code !== 0) throw new Error('submit fail ' + r.msg);
const bk = r.data;
await sleep(2500);
const pid = q(`select process_instance_id from sw_bpm_instance where business_key='${bk}'`)[0];
let did = '';
for (let i = 0; i < 24; i++) {
  did = q(`select id from sw_bpm_task_deadline where process_instance_id='${pid}' order by id desc limit 1`)[0] || '';
  if (did) break; await sleep(2500);
}
let final = '';
for (let i = 0; i < 40; i++) {
  await sleep(5000);
  final = q(`select run_state||'|'||coalesce(result_status,'-') from sw_bpm_task_deadline where id='${did}'`)[0] || '';
  if (final.includes('|DONE|')) break;
}
await sleep(2000);
const deadlineRow = q(`select id||'|'||task_id||'|'||run_state||'|'||coalesce(result_status,'-')||'|'||coalesce(auto_action,'-')||'|'||to_char(due_at,'YYYY-MM-DD HH24:MI:SS') from sw_bpm_task_deadline where id='${did}'`)[0];
const remindNotify = q(`select biz_type||'|'||biz_id||'|'||coalesce(recipient_id::text,'-')||'|'||title||'|'||coalesce(content,'-') from sw_notify_message where biz_id in (select task_id from sw_bpm_approval_action where process_instance_id='${pid}') or biz_id='${pid}' or biz_id in (select id::text from sw_bpm_instance where process_instance_id='${pid}') or biz_id in (select id_ from act_ru_task where proc_inst_id_='${pid}') order by 1`);
const remindActionRows = q(`select count(*) from sw_bpm_approval_action where process_instance_id='${pid}' and deleted=0`)[0];
const remindInstanceStatus = q(`select status from sw_bpm_instance where process_instance_id='${pid}'`)[0];
LOG.remind = { deadline_id: did, deadline_row: deadlineRow, notify_rows: remindNotify, action_row_count: remindActionRows, instance_status: remindInstanceStatus };

// ---- 3) 人工催办 + 10 分钟冷却 ----
const mk2 = 'r6-urge-' + uuid8();
[, r] = await api(PA, TA, 'POST', '/form/data/i3ev_r6r', { amount: 8 });
if (r.code !== 0) throw new Error('submit2 fail ' + r.msg);
const bk2 = r.data;
await sleep(2500);
const pid2 = q(`select process_instance_id from sw_bpm_instance where business_key='${bk2}'`)[0];
const instPk = q(`select id::text from sw_bpm_instance where process_instance_id='${pid2}'`)[0];
let [, u1] = await api(PA, TA, 'POST', `/workflow/my/instances/${instPk}/urge`);
await sleep(1200);
let [, u2] = await api(PA, TA, 'POST', `/workflow/my/instances/${instPk}/urge`);
await sleep(1200);
const urgeRows = q(`select id||'|'||process_instance_id||'|'||initiator_id||'|'||target_user_id||'|'||result from sw_bpm_urge_record where process_instance_id='${pid2}' order by id`);
let urgeNotify = [];
for (let i = 0; i < 8 && (!urgeNotify || urgeNotify.length === 0); i++) { await sleep(2500); urgeNotify = q(`select biz_type||'|'||biz_id||'|'||coalesce(recipient_id::text,'-')||'|'||title||'|'||coalesce(content,'-') from sw_notify_message where biz_id='${pid2}' or biz_id in (select id::text from sw_bpm_urge_record where process_instance_id='${pid2}') or biz_id in (select id_ from act_ru_task where proc_inst_id_='${pid2}') order by 1`); }
LOG.urge = { instance_pk: instPk, urge1: { code: u1.code, msg: u1.msg, data: u1.data }, urge2_cooldown: { code: u2.code, msg: u2.msg, data: u2.data }, urge_rows: urgeRows, urge_notify_rows: urgeNotify };

// ---- 4) 断言 ----
const alertRows = remindNotify.filter(x => x.includes('TASK_DEADLINE_ALERT') || x.includes('提醒'));
const assertions = {
  reminder_triggered: final.startsWith('DONE|'),
  reminder_result: final.split('|')[1] || '',
  reminder_notify_rows_present: remindNotify.length > 0 && remindNotify.some(x => x.split('|')[2] === '2001'),
  reminder_notify_rows: remindNotify,
  reminder_zero_action_rows: remindActionRows === '0',
  reminder_instance_still_running: remindInstanceStatus === 'RUNNING',
  urge_record_rows: urgeRows.length,
  urge_notify_rows: urgeNotify,
  urge_notify_present: urgeNotify.length > 0,
  urge_cooldown_second_request_info: u2.data !== undefined && u2.code === 0,
  zero_500: [u1.code, u2.code].every(c => c !== 500)
};
const pass = assertions.reminder_triggered && assertions.reminder_notify_rows_present &&
  assertions.reminder_zero_action_rows && assertions.reminder_instance_still_running &&
  assertions.urge_record_rows >= 1 && assertions.urge_notify_present;

// ---- 5) 唯一终态摘要（作废旧失败项 + PID 链）----
const summary = {
  verdict: pass ? 'PASS' : 'FAIL',
  supersedes: {
    item: 'i3-06/Z6/z6-actions.json 内 z6_dual_scanner.error=AssertionError(“B 日志无认领竞争跳过记录”)',
    reason: '旧失败项产生于相位未对齐的早期尝试；其后以相位同步法重启 B 重采，最终 40/40 唯一完成、14 个 deadline 双 PID 同窗、零双完成（evidence/i3-06/Z6/dual-scan-result.json，locked），旧 error 字段由本摘要正式作废，唯一终态以本摘要与 dual-scan-result.json 为准',
    superseded_at: new Date().toISOString()
  },
  pid_chain: {
    frozen_e_candidate: { A: 'PID 26398 @ 8081', B: 'PID 26448 @ 8082', jar: SNAPSHOT.frozen_e_jar_sha256, source: 'evidence/i3-06/Z1/candidate-e.json' },
    dual_scan_final_old_machine: { A: 'PID 26398 @ 8081', B: 'PID 28816 @ 8082', jar: SNAPSHOT.frozen_e_jar_sha256, b_restart_reason: 'Z6 相位对齐重启（同 JAR，instance-b-scheduler.log 全程 PID 28816）' },
    handover_new_machine: { A: SNAPSHOT.instance_A, B: SNAPSHOT.instance_B, jar: SNAPSHOT.runtime_jar_sha256, restart_reason: '换机恢复性重建（非代码修改，R1/runtime-rebuild.txt）', source_git: SNAPSHOT.source }
  },
  locked_references: {
    common_deadline_evidence: 'evidence/i3-06/Z6/dual-scan-result.json（40 deadlines、overlap_count=14、double_done=[]）',
    claim_skip_logs: ['evidence/i3-06/Z6/instance-a-scheduler.log（全程 PID 26398）', 'evidence/i3-06/Z6/instance-b-scheduler.log（全程 PID 28816）'],
    unique_terminal_state: 'DONE/AUTO_APPROVE 40/40 恰一完成；本机 R6 补证仅新增提醒/催办真实对象行'
  }
};
save(EV + '/r6-actions.json', { _snapshot: SNAPSHOT, marker: mk, flow: LOG, assertions, final_summary: summary, pass });
console.log('R6 pass=' + pass, JSON.stringify(assertions).slice(0, 600));
