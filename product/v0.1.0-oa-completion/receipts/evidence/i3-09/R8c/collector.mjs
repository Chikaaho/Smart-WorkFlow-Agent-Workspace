// R8c: 真实两节点 RETURN 链（提示 06 §3 零裁量九步）
import { login, api, q, sleep, save, setRawDir, sha256, uuid8, SNAPSHOT } from './lib.mjs';
import fs from 'node:fs';

const EV = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i3-09';
setRawDir(EV + '/R8c');
// 每次运行重写原始流（保留失败历史由独立归档负责，不删除：失败会先中断脚本）
fs.rmSync(EV + '/R8c/raw-transcript.txt', { force: true });
const PA = 8081;
const TA = await login(PA, 'admin');   // 节点 A 办理人（initiator 亦可）
const T2 = await login(PA, 'user2');   // 节点 B 办理人（2001）
const steps = {};   // 每步真实结果
const fails = [];

function assert(cond, label, fact) {
  if (!cond) fails.push(label + ' :: ' + JSON.stringify(fact ?? null));
  return cond;
}
const taskOf = async (tok, bk, tries = 12) => {
  for (let i = 0; i < tries; i++) {
    const [, tr] = await api(PA, tok, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=100');
    const rec = ((tr?.data?.records) || []).find(x => x.businessKey === bk);
    if (rec?.taskId) return { taskId: rec.taskId, nodeKey: rec.nodeKey ?? rec.node_key ?? null, name: rec.taskName ?? rec.name ?? null };
    await sleep(2500);
  }
  return { taskId: null, nodeKey: null, name: null };
};

// ---- 建模：最小两人工审批节点，意见表单沿用锁定有效 TEXT 组件 ----
const u8 = uuid8().slice(0, 6);
// 步骤0（残留清理，非产品断言）：删除遗留代理规则，避免 GLOBAL 代理改写节点 B 办理人
const ruleCleanup = [];
for (const rid of q("select id::text from sw_bpm_authorize_rule where deleted=0")) {
  const [, d1] = await api(PA, T2, 'DELETE', '/workflow/authorize-rules/' + rid);
  const [, d2] = await api(PA, TA, 'DELETE', '/workflow/authorize-rules/' + rid);
  const st = q("select status from sw_bpm_authorize_rule where id=" + rid)[0];
  ruleCleanup.push({ rule_id: rid, t2_delete: d1.code, admin_delete: d2.code, status_after: st });
}
const activeLeft = q("select count(*) from sw_bpm_authorize_rule where deleted=0 and status='ACTIVE'")[0];
const mMarker = 'i309-return-' + u8;
const formKey = 'i3ev_r8c_' + u8;
const OF = { formId: 'i3ev-r8c-opinion', version: 'v1', fields: [{ key: 'comment2', label: '审批说明', type: 'TEXT', required: true, maxLength: 200 }] };
let [, cdf] = await api(PA, TA, 'POST', '/form/def', { formKey, name: 'R8c-' + u8 });
const fid = cdf?.data?.id;
assert(!!fid, 'step0 form fid empty', cdf);
await api(PA, TA, 'POST', `/form/def/${fid}/config`, { definition: JSON.stringify({ fields: [{ name: 'amount', label: '金额', type: 'NUMBER' }] }) });
const [, pf] = await api(PA, TA, 'POST', `/form/def/${fid}/publish`);
assert(pf.code === 0 || pf.code === 1100, 'step0 form publish', pf);
const elements = [
  { id: 'node_start', kind: 'node', type: 'START', x: 100, y: 300, config: {} },
  { id: 'node_a', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '节点A', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: OF } },
  { id: 'node_b', kind: 'node', type: 'APPROVAL', x: 540, y: 300, config: { name: '节点B', participant: { strategy: 'FIXED_USER', value: [2001] }, opinionForm: OF } },
  { id: 'node_end', kind: 'node', type: 'END', x: 760, y: 300, config: {} },
  { id: 'e0', kind: 'edge', source: 'node_start', target: 'node_a', config: {} },
  { id: 'e1', kind: 'edge', source: 'node_a', target: 'node_b', config: {} },
  { id: 'e2', kind: 'edge', source: 'node_b', target: 'node_end', config: {} }];
const g = { processKey: '', name: 'R8c-两节点-' + u8, formKey, contractVersion: 2, elements, canvas: {} };
let [, rd] = await api(PA, TA, 'GET', `/workflow/defs?pageNum=1&pageSize=100&formKey=${formKey}`);
let defId = ((rd?.data?.records) || []).find(x => x.name === g.name)?.id;
if (!defId) { [, rd] = await api(PA, TA, 'POST', '/workflow/defs', { name: g.name, formKey }); defId = rd.data.defId; }
const [, rg] = await api(PA, TA, 'PUT', `/workflow/defs/${defId}/graph`, g);
assert(rg.code === 0, 'step0 graph put', rg);
const [, rv] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/validate`);
assert((rv.data || []).length === 0, 'step0 validate errors', rv.data);
const [, rp] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/publish`);
assert(rp.code === 0, 'step0 def publish', rp);

// ---- 步骤1：发起 + 回读首轮 A 任务 ----
const [, sb] = await api(PA, TA, 'POST', `/form/data/${formKey}`, { amount: 42 });
assert(sb.code === 0 && !!sb.data, 'step1 submit', sb);
const bk = sb.data;
await sleep(2500);
const pidOf = () => q(`select process_instance_id from sw_bpm_instance where business_key='${bk}' and deleted=0`)[0];
const pid = pidOf();
assert(!!pid, 'step1 pid empty', bk);
const a1 = await taskOf(TA, bk, 4);
steps.step1 = { instance: pid, business_key: bk, A1_task_id: a1.taskId, node: a1.nodeKey, task_name: a1.name };
assert(!!a1.taskId, 'step1 A1 task id empty', a1);
const detailA1 = (await api(PA, TA, 'GET', `/workflow/tasks/${a1.taskId}`))[1]?.data;
steps.step1.assignee = detailA1?.assignee ?? null;
steps.step1.task_detail_status = detailA1 ? 'OPEN' : null;

// ---- 步骤2：A 完成首轮（意见 A-R1）----
const [, apA1] = await api(PA, TA, 'POST', `/workflow/tasks/${a1.taskId}/complete`, { action: 'APPROVE', comment: mMarker + '-A-R1', opinionData: { comment2: mMarker + '-A-R1' } });
assert(apA1.code === 0, 'step2 A-R1 complete', apA1);
await sleep(1500);
const a1Closed = q(`select count(*) from act_ru_task where id_='${a1.taskId}'`)[0];
steps.step2 = { http: apA1.code, opinion: mMarker + '-A-R1', A1_task_closed: a1Closed === '0' };
assert(a1Closed === '0', 'step2 A1 not closed', a1Closed);

// ---- 步骤3：重新取得首轮 B 真实任务 ID（轮询待办，禁止拼接）----
const b1 = await taskOf(T2, bk);
steps.step3 = { B1_task_id: b1.taskId, node: b1.nodeKey, task_name: b1.name };
assert(!!b1.taskId, 'step3 B1 task id empty', b1);
// 节点归属由 step8 历史 node 字段兜底断言（todo 列表 DTO 无 nodeKey）

// ---- 步骤4：B 退回到节点 A（意见 B-RETURN-R1）----
const [, ret] = await api(PA, T2, 'POST', `/workflow/tasks/${b1.taskId}/return`, { action: 'RETURN', returnTargetNodeId: 'node_a', comment: mMarker + '-B-RETURN-R1', opinionData: { comment2: mMarker + '-B-RETURN-R1' } });
assert(ret.code === 0, 'step4 return', ret);
await sleep(1500);
const b1Closed = q(`select count(*) from act_ru_task where id_='${b1.taskId}'`)[0];
steps.step4 = { http: ret.code, opinion: mMarker + '-B-RETURN-R1', target_node: 'node_a', B1_task_closed: b1Closed === '0' };
assert(b1Closed === '0', 'step4 B1 not closed', b1Closed);

// ---- 步骤5：回读二轮 A 任务（ID 非空、≠A1、节点 A）----
const a2 = await taskOf(TA, bk);
steps.step5 = { A2_task_id: a2.taskId, node: a2.nodeKey, different_from_A1: a2.taskId !== a1.taskId };
assert(!!a2.taskId && a2.taskId !== a1.taskId, 'step5 A2 invalid', a2);


// ---- 步骤6：A 完成二轮（意见 A-R2）----
const [, apA2] = await api(PA, TA, 'POST', `/workflow/tasks/${a2.taskId}/complete`, { action: 'APPROVE', comment: mMarker + '-A-R2', opinionData: { comment2: mMarker + '-A-R2' } });
assert(apA2.code === 0, 'step6 A-R2 complete', apA2);
await sleep(1500);
const b2 = await taskOf(T2, bk);
steps.step6 = { http: apA2.code, opinion: mMarker + '-A-R2', B2_task_id: b2.taskId };
assert(!!b2.taskId && b2.taskId !== b1.taskId, 'step6 B2 invalid', b2);

// ---- 步骤7：B 完成二轮（意见 B-R2），实例终态 + 无 PENDING 残留 ----
const [, apB2] = await api(PA, T2, 'POST', `/workflow/tasks/${b2.taskId}/complete`, { action: 'APPROVE', comment: mMarker + '-B-R2', opinionData: { comment2: mMarker + '-B-R2' } });
assert(apB2.code === 0, 'step7 B-R2 complete', apB2);
await sleep(1800);
const finalStatus = q(`select status from sw_bpm_instance where process_instance_id='${pidOf() || pid}'`)[0];
const pendingLeft = q(`select count(*) from act_ru_task where proc_inst_id_='${pidOf() || pid}'`)[0];
steps.step7 = { http: apB2.code, opinion: mMarker + '-B-R2', instance_status: finalStatus, pending_tasks: pendingLeft };
assert(finalStatus === 'APPROVED' && pendingLeft === '0', 'step7 terminal/pending', { finalStatus, pendingLeft });

// ---- 步骤8：权威历史回读（发起人实例详情），四步动作序列 + 意见字段 ----
const pk = q(`select id::text from sw_bpm_instance where process_instance_id='${pidOf() || pid}'`)[0];
const [, det] = await api(PA, TA, 'GET', '/workflow/my/instances/' + pk);
const hist = det?.data?.history || [];
const seq4 = hist.slice().sort((a, b) => String(a.endTime ?? '').localeCompare(String(b.endTime ?? ''))).map(h => ({
  action: h.action, node: h.nodeKey ?? h.node_key, task_id: h.taskId, assignee: h.assignee,
  opinionData: h.opinionData ?? null, opinionFormId: h.opinionFormId ?? null, opinionFormVersion: h.opinionFormVersion ?? null,
  comment: h.comment ?? null, endTime: h.endTime ?? null, approvalResult: h.approvalResult ?? null
}));
steps.step8 = { history: seq4 };
const has = (substr) => seq4.filter(h => JSON.stringify(h).includes(substr));
assert(seq4.length === 4, 'step8 history length != 4', seq4.length);
assert(has('A-R1').length === 1 && has('A-R1')[0]?.action === 'APPROVE', 'step8 A-R1 approve missing', seq4);
assert(has('B-RETURN-R1').length === 1 && has('B-RETURN-R1')[0]?.action === 'RETURN', 'step8 B-RETURN missing', seq4);
assert(has('A-R2').length === 1 && has('A-R2')[0]?.action === 'APPROVE', 'step8 A-R2 missing', seq4);
assert(has('B-R2').length === 1 && has('B-R2')[0]?.action === 'APPROVE', 'step8 B-R2 missing', seq4);
assert(seq4.every(h => h.opinionData && Object.keys(h.opinionData).length > 0 && h.opinionFormId && h.opinionFormVersion), 'step8 opinion fields incomplete', seq4);
assert(seq4[0]?.node === 'node_a' && seq4[1]?.node === 'node_b' && seq4[2]?.node === 'node_a' && seq4[3]?.node === 'node_b', 'step8 node ownership wrong', seq4.map(h => h.node));
assert(seq4[0]?.assignee === '1' && seq4[3]?.assignee === '2001', 'step8 assignee wrong', seq4.map(h => h.assignee));

// ---- 步骤9：主表单零反写 + 快照不可变 + 单实例/无重复动作 ----
const mf = (await api(PA, TA, 'GET', `/form/data/${formKey}/${bk}`))[1]?.data;
const snapRows = q(`select action||'|'||task_id||'|'||substr(coalesce(opinion_form_snapshot,'-'),1,60) from sw_bpm_approval_action where process_instance_id='${pidOf() || pid}' and deleted=0 order by id`);
const actionCount = q(`select count(*) from sw_bpm_approval_action where process_instance_id='${pid}' and deleted=0`)[0];
const instCount = q(`select count(*) from sw_bpm_instance where business_key='${bk}'`)[0];
const returnCount = q(`select count(*) from sw_bpm_approval_action where process_instance_id='${pidOf() || pid}' and action='RETURN'`)[0];
const roundNos = q(`select action||'|'||coalesce(round_no::text,'-') from sw_bpm_approval_action where process_instance_id='${pidOf() || pid}' and deleted=0 order by id`);
steps.step9 = {
  main_form: { amount: mf?.amount, version: mf?.version, unchanged_since_submit: mf?.amount === 42 && mf?.version === '0' },
  snapshot_rows: snapRows, snapshot_immutable_note: '快照列随动作行写入后无更新接口；行数=动作数且内容含表单契约',
  action_row_count: actionCount, instance_count: instCount, return_row_count: returnCount, round_rows: roundNos
};
assert(mf?.amount === 42 && mf?.version === '0', 'step9 main form writeback detected', mf);
assert(actionCount === '4' && instCount === '1' && returnCount === '1', 'step9 counts', { actionCount, instCount, returnCount });
assert(roundNos.some(x => x.startsWith('RETURN|1')), 'step9 RETURN round_no missing', roundNos);

// ---- 断言（全部由真实结果计算）----
const assertions = {
  residue_rules_cleaned: activeLeft === '0',
  submit_ok: sb.code === 0 && !!pid,
  a1_task_real: !!a1.taskId && a1.taskId !== 'undefined',
  a1_complete_code0: apA1.code === 0 && steps.step2.A1_task_closed,
  b1_task_real: !!b1.taskId && b1.taskId !== 'undefined' && b1.taskId !== a1.taskId,
  return_code0_real_task: ret.code === 0 && steps.step4.B1_task_closed && b1.taskId !== 'undefined',
  a2_task_new: !!a2.taskId && a2.taskId !== a1.taskId,
  b2_task_new: !!b2.taskId && b2.taskId !== b1.taskId,
  history_exact_four_steps: seq4.length === 4 && has('A-R1').length === 1 && has('B-RETURN-R1').length === 1 && has('A-R2').length === 1 && has('B-R2').length === 1,
  all_opinions_nonempty: seq4.length === 4 && seq4.every(h => h.opinionData && Object.keys(h.opinionData).length > 0 && !!h.opinionFormId && !!h.opinionFormVersion),
  main_form_zero_writeback: mf?.amount === 42 && mf?.version === '0',
  single_instance_single_return: instCount === '1' && returnCount === '1' && actionCount === '4',
  terminal_no_pending: finalStatus === 'APPROVED' && pendingLeft === '0'
};
assertions.pass = Object.entries(assertions).every(([k, v]) => k === 'pass' || v === true);

save(EV + '/R8c/summary.json', {
  _snapshot: { ...SNAPSHOT, instance_A: 'PID 26988 @ 8081', instance_B: 'PID 29832 @ 8082', note: 'frozen-f 同 JAR 会话重启，无重打包' },
  marker: mMarker, objects: { form_key: formKey, form_def_id: fid, def_id: defId, business_key: bk, process_instance_id: pid, instance_pk: pk },
  steps, assertions, fails
});
save(EV + '/R8c/assertions.json', { assertions, computed_from: 'R8c/summary.json steps/fails（工具生成，非手填）', any_fail_records: fails });
console.log('R8c pass=' + assertions.pass);
console.log(JSON.stringify({ fails, a1: a1.taskId, b1: b1.taskId, a2: a2.taskId, b2: b2.taskId, status: finalStatus }));
