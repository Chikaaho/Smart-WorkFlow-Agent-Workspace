// R3: G7 RETURN 补证 — 主表单 before/after、允许修改范围、实际修改结果、二轮路径、历史回看对象链
import { login, api, q, sleep, save, setRawDir, sha256, uuid8, SNAPSHOT } from './lib.mjs';

const EV = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i3-07/R3';
setRawDir(EV + '/raw');
const PA = 8081;
const TA = await login(PA, 'admin');
const T2 = await login(PA, 'user2');
const T3 = await login(PA, 'user3');
const LOG = {};

// ---- 1) 表单定义（允许修改范围 = 定义内字段 amount/reason；提交后发起人仅可改自有记录）----
const mk = 'r3-return-' + uuid8();
let [st, r] = await api(PA, TA, 'POST', '/form/def', { formKey: 'i3ev_r3', name: 'R3-退回主表单' });
let fid = r?.data?.id;
if (!fid) { [, r] = await api(PA, TA, 'GET', '/form/def/by-key/i3ev_r3', undefined); fid = r?.data?.id; }
const definition = JSON.stringify({ fields: [
  { name: 'amount', label: '金额', type: 'NUMBER' },
  { name: 'reason', label: '事由', type: 'TEXT' } ] });
await api(PA, TA, 'POST', `/form/def/${fid}/config`, { definition });
[, r] = await api(PA, TA, 'POST', `/form/def/${fid}/publish`);
LOG.form_publish = { code: r.code };

// ---- 2) 流程定义：START→node_1(user2)→node_2(user3)→END ----
const g = { processKey: '', name: 'R3-两节点退回', formKey: 'i3ev_r3', contractVersion: 2,
  elements: [
    { id: 'node_start', kind: 'node', type: 'START', x: 100, y: 300, config: {} },
    { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批一', participant: { strategy: 'FIXED_USER', value: [2001] } } },
    { id: 'node_2', kind: 'node', type: 'APPROVAL', x: 540, y: 300, config: { name: '审批二', participant: { strategy: 'FIXED_USER', value: [2002] } } },
    { id: 'node_end', kind: 'node', type: 'END', x: 760, y: 300, config: {} },
    { id: 'e1', kind: 'edge', source: 'node_start', target: 'node_1', config: {} },
    { id: 'e2', kind: 'edge', source: 'node_1', target: 'node_2', config: {} },
    { id: 'e3', kind: 'edge', source: 'node_2', target: 'node_end', config: {} } ],
  canvas: {} };
[, r] = await api(PA, TA, 'GET', '/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_r3');
let defId = ((r?.data?.records) || []).find(x => x.name === 'R3-两节点退回')?.id;
if (!defId) {
  [, r] = await api(PA, TA, 'POST', '/workflow/defs', { name: 'R3-两节点退回', formKey: 'i3ev_r3' });
  defId = r.data.defId;
}
[, r] = await api(PA, TA, 'PUT', `/workflow/defs/${defId}/graph`, g);
LOG.graph_put = { code: r.code };
[, r] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/validate`);
LOG.graph_validate = { code: r.code, errors: r.data || [] };
[, r] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/publish`);
LOG.def_publish = { code: r.code, version: r?.data?.version };

// ---- 3) 发起提交（发起人=admin）----
[, r] = await api(PA, TA, 'POST', '/form/data/i3ev_r3', { amount: 100, reason: mk + '-initial' });
LOG.submit = { code: r.code };
const bk = r.data;
await sleep(2500);
const pid = q(`select process_instance_id from sw_bpm_instance where business_key='${bk}'`)[0];
LOG.instance = { business_key: bk, process_instance_id: pid };

// 主表单 before（GET）
let recId = bk;
[, r] = await api(PA, TA, 'GET', `/form/data/i3ev_r3/${recId}`);
const mainFormBefore = { record_id: recId, data: r?.data, sha256: sha256(JSON.stringify(r?.data)) };

// ---- 4) 一轮：node_1 通过 → node_2 退回 node_1 ----
const todoOf = async (tok) => {
  [, r] = await api(PA, tok, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=100');
  return ((r?.data?.records) || []).find(x => x.businessKey === bk)?.taskId;
};
const t1 = await todoOf(T2);
[, r] = await api(PA, T2, 'POST', `/workflow/tasks/${t1}/complete`, { action: 'APPROVE', comment: mk + '-round1-node1' });
LOG.round1_node1_approve = { code: r.code };
await sleep(1200);
const t2 = await todoOf(T3);
const task2Before = (await api(PA, T3, 'GET', `/workflow/tasks/${t2}`))[1]?.data;
[, r] = await api(PA, T3, 'POST', `/workflow/tasks/${t2}/return`, { action: 'RETURN', returnTargetNodeId: 'node_1', comment: mk });
LOG.return = { code: r.code, msg: r.msg, task_id: t2, round1_task_open_after: q(`select count(*) from act_ru_task where id_='${t2}'`)[0] };
await sleep(1500);

// ---- 5) 允许修改范围：发起人更新自有主表单记录（定义字段内）----
[, r] = await api(PA, TA, 'PUT', `/form/data/i3ev_r3/${recId}`, { data: { amount: 200, reason: mk + '-revised' }, version: Number(mainFormBefore.data?.version ?? 0) });
LOG.scope_owner_update = { code: r.code, msg: r.msg };
await sleep(800);
[, r] = await api(PA, TA, 'GET', `/form/data/i3ev_r3/${recId}`);
const mainFormAfter = { record_id: recId, data: r?.data, sha256: sha256(JSON.stringify(r?.data)) };
// 非属主修改拒绝（user2 无权改 admin 记录）
[, r] = await api(PA, T2, 'PUT', `/form/data/i3ev_r3/${recId}`, { amount: 999, reason: 'should-reject' });
LOG.scope_non_owner_rejected = { code: r.code, msg: r.msg };

// ---- 6) 二轮路径：node_1 再通过 → node_2 办结 ----
const t1b = await todoOf(T2);
const task1Round2 = (await api(PA, T2, 'GET', `/workflow/tasks/${t1b}`))[1]?.data;
LOG.round2_task_id = t1b;
[, r] = await api(PA, T2, 'POST', `/workflow/tasks/${t1b}/complete`, { action: 'APPROVE', comment: mk + '-round2-node1' });
LOG.round2_node1_approve = { code: r.code };
await sleep(1200);
const t2b = await todoOf(T3);
[, r] = await api(PA, T3, 'POST', `/workflow/tasks/${t2b}/complete`, { action: 'APPROVE', comment: mk + '-round2-final' });
LOG.round2_final = { code: r.code };
await sleep(1500);

// ---- 7) 对象链 ----
const chain = {
  request_marker: mk,
  action_rows: q(`select id||'|'||node_key||'|'||task_id||'|'||actor_id||'|'||action||'|'||settlement_status||'|'||coalesce(round_no::text,'-')||'|'||coalesce(opinion_data,'-') from sw_bpm_approval_action where process_instance_id='${pid}' and deleted=0 order by id`),
  trace_rows: q(`select act_type_||'|'||act_name_||'|'||coalesce(assignee_,'-')||'|'||coalesce(delete_reason_,'-') from act_hi_actinst where proc_inst_id_='${pid}' order by start_time_, id_`),
  notify_rows: q(`select distinct biz_type||'|'||biz_id||'|'||coalesce(recipient_id::text,'-')||'|'||title from sw_notify_message where biz_id in (select task_id from sw_bpm_approval_action where process_instance_id='${pid}' and deleted=0) or biz_id='${pid}' or biz_id in (select id::text from sw_bpm_instance where process_instance_id='${pid}') order by 1`),
  instance_status: q(`select status from sw_bpm_instance where process_instance_id='${pid}'`)[0],
  return_round_rows: q(`select action||'|'||coalesce(round_no::text,'-')||'|'||node_key from sw_bpm_approval_action where process_instance_id='${pid}' and action='RETURN'`)
};
// 历史回看对象链：实例详情（轮次/轨迹）+ 已办列表 + 二轮任务详情
const instDetail = (await api(PA, TA, 'GET', `/workflow/instances/${pid}`))[1]?.data;
const processed = (await api(PA, T3, 'GET', '/workflow/tasks/processed?pageNum=1&pageSize=50'))[1]?.data;
const processedRows = (processed?.records || []).filter(x => x.businessKey === bk);
const round2TaskDetail = (await api(PA, T2, 'GET', `/workflow/tasks/${t1b}`))[1]?.data;

// 断言
const returnRows = chain.action_rows.filter(x => x.split('|')[4] === 'RETURN');
const roundNos = chain.action_rows.filter(x => x.split('|')[4] === 'APPROVE').map(x => Number(x.split('|')[6] || 0));
const traceNode1 = chain.trace_rows.filter(x => x.startsWith('userTask|') && x.split('|')[2] === '2001').length;
const assertions = {
  return_code_0: LOG.return.code === 0,
  round1_task_closed: LOG.return.round1_task_open_after === '0',
  return_action_row_present: returnRows.length === 1,
  round_no_on_return: returnRows[0]?.split('|')[6],
  trace_node1_two_rounds: traceNode1 === 2,
  main_form_before_present: !!mainFormBefore.data && JSON.stringify(mainFormBefore.data).length > 2,
  main_form_after_present: !!mainFormAfter.data && JSON.stringify(mainFormAfter.data).length > 2,
  main_form_changed: mainFormBefore.sha256 !== mainFormAfter.sha256,
  field_diff: { amount: { before: mainFormBefore.data?.amount, after: mainFormAfter.data?.amount }, reason: { before: mainFormBefore.data?.reason, after: mainFormAfter.data?.reason } },
  non_owner_update_rejected: LOG.scope_non_owner_rejected.code !== 0,
  history_chain: {
    instance_detail_status: instDetail?.status, instance_detail_round: instDetail?.currentRound ?? null,
    processed_rows_for_instance: processedRows.length, round2_task_detail_status: round2TaskDetail?.status
  }
};
const pass = assertions.return_code_0 && assertions.round1_task_closed && assertions.return_action_row_present &&
  assertions.trace_node1_two_rounds && assertions.main_form_before_present && assertions.main_form_after_present &&
  assertions.main_form_changed && assertions.non_owner_update_rejected;

save(EV + '/r3-actions.json', { _snapshot: SNAPSHOT, flow: LOG, main_form_before: mainFormBefore, main_form_after: mainFormAfter, chain, task2_before_return: task2Before, task1_round2_detail: task1Round2, assertions, pass });
console.log('R3 pass=' + pass, JSON.stringify(assertions).slice(0, 700));
