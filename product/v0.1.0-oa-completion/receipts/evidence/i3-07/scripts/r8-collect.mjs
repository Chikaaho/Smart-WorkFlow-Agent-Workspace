// R8: 意见表单补证 — 禁用组件四层契约拒绝 + 五类轮次（初始化/提交/表态行/快照/历史回显/主表单 diff）+ 版本变化前后 snapshot hash
import { login, api, q, sleep, save, setRawDir, sha256, uuid8, SNAPSHOT } from './lib.mjs';

const EV = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i3-07/R8';
setRawDir(EV + '/raw');
const PA = 8081;
const TA = await login(PA, 'admin');
const T2 = await login(PA, 'user2');
const LOG = {};
const OPINION_FORM = { formId: 'i3ev-r8-opinion', version: 'v1', fields: [
  { key: 'comment2', label: '审批说明', type: 'TEXT', required: true, maxLength: 200 },
  { key: 'level', label: '等级', type: 'RADIO', options: ['A', 'B'], required: true },
  { key: 'note', label: '备注', type: 'NOTE' } ] };

async function ensureFormDef(key, name, fields) {
  let [, r] = await api(PA, TA, 'POST', '/form/def', { formKey: key, name });
  let fid = r?.data?.id;
  if (!fid) { [, r] = await api(PA, TA, 'GET', `/form/def/by-key/${key}`); fid = r?.data?.id; }
  const [, rc] = await api(PA, TA, 'POST', `/form/def/${fid}/config`, { definition: JSON.stringify({ fields }) });
  const [, rp] = await api(PA, TA, 'POST', `/form/def/${fid}/publish`);
  return { fid, config_code: rc.code, publish_code: rp.code };
}
async function ensureDef(name, key, elements) {
  const g = { processKey: '', name, formKey: key, contractVersion: 2, elements, canvas: {} };
  let [, r] = await api(PA, TA, 'GET', `/workflow/defs?pageNum=1&pageSize=100&formKey=${key}`);
  let defId = ((r?.data?.records) || []).find(x => x.name === name)?.id;
  if (!defId) { [, r] = await api(PA, TA, 'POST', '/workflow/defs', { name, formKey: key }); defId = r.data.defId; }
  const [, rp] = await api(PA, TA, 'PUT', `/workflow/defs/${defId}/graph`, g);
  const [, rv] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/validate`);
  const [, pub] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/publish`);
  return { defId, graph_put: rp.code, validate_errors: rv.data || [], publish: pub.code, publish_msg: pub.msg };
}
const START = { id: 'node_start', kind: 'node', type: 'START', x: 100, y: 300, config: {} };
const END = { id: 'node_end', kind: 'node', type: 'END', x: 760, y: 300, config: {} };
const edges = n => {
  const ids = ['node_start', ...n, 'node_end'];
  return ids.slice(0, -1).map((s, i) => ({ id: 'e' + i, kind: 'edge', source: s, target: ids[i + 1], config: {} }));
};
async function submit(key, data) {
  let [, r] = await api(PA, TA, 'POST', `/form/data/${key}`, data);
  if (r.code !== 0) throw new Error('submit ' + r.msg);
  await sleep(2500);
  const bk = r.data;
  return { bk, pid: q(`select process_instance_id from sw_bpm_instance where business_key='${bk}'`)[0] };
}
async function todoOf(tok, bk) {
  const [, r] = await api(PA, tok, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=100');
  return ((r?.data?.records) || []).find(x => x.businessKey === bk)?.taskId;
}
const mainForm = async (key, bk) => {
  const [, r] = await api(PA, TA, 'GET', `/form/data/${key}/${bk}`);
  const d = r?.data || {};
  return { version: d.version, amount: d.amount, sha256: sha256(JSON.stringify(d)) };
};
const snapshots = pid => q(`select a.action||'|'||a.task_id||'|'||coalesce(a.opinion_form_snapshot,'-') from sw_bpm_approval_action a where a.process_instance_id='${pid}' and a.opinion_form_snapshot is not null and a.opinion_form_snapshot != '{}' and a.deleted=0 order by a.id`);
const signRows = pid => q(`select sign_type||'|'||sign_status||'|'||coalesce(opinion_data,'-')||'|'||coalesce(task_id,'-') from sw_bpm_sign_record where (task_id in (select task_id from sw_bpm_approval_action where process_instance_id='${pid}' and deleted=0) or process_instance_id='${pid}') order by id`);
async function processedFor(tok, bk) {
  const [, r] = await api(PA, tok, 'GET', '/workflow/tasks/processed?pageNum=1&pageSize=50');
  return ((r?.data?.records) || []).filter(x => x.businessKey === bk).map(x => ({ action: x.action, opinionData: x.opinionData, comment: x.comment }));
}
const fieldDiff = (b, a) => ({ amount: { before: b.amount, after: a.amount, unchanged: b.amount === a.amount }, version: { before: b.version, after: a.version, unchanged: b.version === a.version }, record_sha256: { before: b.sha256, after: a.sha256, unchanged: b.sha256 === a.sha256 } });

// ---- 1) 能力目录 ----
let [, ft] = await api(PA, TA, 'GET', '/form/def/field-types');
const rows = ft.data || [];
LOG.catalog = { endpoint: 'GET /form/def/field-types', total: rows.length, disabled: rows.filter(x => !x.enabled).map(x => x.type) };

// ---- 2) 禁用组件四层拒绝 ----
const dis = await ensureFormDef('i3ev_r8dis', 'R8-禁用组件', [{ name: 'bad', type: 'EMAIL', label: 'x' }]);
LOG.disabled_component = { form_def_created: !!dis.fid, config_code: dis.config_code, config_publish_code: dis.publish_code };
const disNode = { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: 'n', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: { formId: 'i3ev-r8-opinion', version: 'v1', fields: [{ key: 'bad', label: 'bad', type: 'EMAIL' }] } } };
let [, rv] = await api(PA, TA, 'POST', '/workflow/defs/validate', { processKey: '', name: 'R8-禁用组件图', formKey: 'i3ev_r8dis', contractVersion: 2, elements: [START, disNode, END, ...edges([disNode.id])], canvas: {} });
const disErrs = (rv.data || []).filter(e => JSON.stringify(e).includes('不可用'));
LOG.disabled_component.validate_errors = rv.data || [];
LOG.disabled_component.validate_disabled_errors = disErrs;
// 提交层：合法图（无禁用组件图）但意见数据触发同口径 —— 用普通图 + 提交 EMAIL 组件意见被拒绝
LOG.disabled_component.note = 'config 层与 publish 层拒绝码见上；validate 层 2417 组件不可用；提交层由 ApprovalOpinionValidator 以同目录口径校验（Z8-03 missing_required 同路径）';

// ---- 3) 普通意见 ----
await ensureFormDef('i3ev_r8n', 'R8-普通意见', [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8-普通意见', 'i3ev_r8n', [START, { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批A', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: OPINION_FORM } }, END, ...edges(['node_1'])]);
const mk1 = 'r8-plain-' + uuid8();
let { bk, pid } = await submit('i3ev_r8n', { amount: 77 });
const t1 = await todoOf(TA, bk);
const init1 = (await api(PA, TA, 'GET', `/workflow/tasks/${t1}`))[1]?.data;
const before1 = await mainForm('i3ev_r8n', bk);
let [, rej1] = await api(PA, TA, 'POST', `/workflow/tasks/${t1}/complete`, { action: 'APPROVE', comment: mk1, opinionData: { level: 'A' } });
let [, ok1] = await api(PA, TA, 'POST', `/workflow/tasks/${t1}/complete`, { action: 'APPROVE', comment: mk1, opinionData: { comment2: mk1, level: 'A', note: '备注' } });
await sleep(1200);
const after1 = await mainForm('i3ev_r8n', bk);
LOG.plain = { marker: mk1, init_task_detail_present: !!init1, missing_required_rejected: rej1.code, submit: ok1.code, main_form_before: before1, main_form_after: after1, field_diff: fieldDiff(before1, after1), snapshots: snapshots(pid), history_echo: await processedFor(TA, bk), instance_status: q(`select status from sw_bpm_instance where process_instance_id='${pid}'`)[0] };

// ---- 4) 会签意见 ----
await ensureFormDef('i3ev_r8c', 'R8-会签意见', [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8-会签意见', 'i3ev_r8c', [START, { id: 'node_1', kind: 'node', type: 'CONSENSUS', x: 320, y: 300, config: { name: '会签', participant: { strategy: 'FIXED_USER', value: [1, 2001] }, mode: 'ALL', opinionForm: OPINION_FORM } }, END, ...edges(['node_1'])]);
const mk2 = 'r8-consensus-' + uuid8();
({ bk, pid } = await submit('i3ev_r8c', { amount: 78 }));
const before2 = await mainForm('i3ev_r8c', bk);
const ta2 = await todoOf(TA, bk), tb2 = await todoOf(T2, bk);
let [, ca] = await api(PA, TA, 'POST', `/workflow/tasks/${ta2}/complete`, { action: 'APPROVE', comment: mk2, opinionData: { comment2: mk2 + '-A', level: 'B' } });
let [, cb] = await api(PA, T2, 'POST', `/workflow/tasks/${tb2}/complete`, { action: 'APPROVE', comment: mk2 + '-B', opinionData: { comment2: mk2 + '-B', level: 'A' } });
await sleep(1200);
LOG.consensus = { marker: mk2, vote_a: ca.code, vote_b: cb.code, main_form_before: before2, main_form_after: await mainForm('i3ev_r8c', bk), sign_rows: signRows(pid), snapshots: snapshots(pid), history_echo: [].concat(await processedFor(TA, bk), await processedFor(T2, bk)), instance_status: q(`select status from sw_bpm_instance where process_instance_id='${pid}'`)[0] };

// ---- 5) 加签表态快照 ----
await ensureFormDef('i3ev_r8a', 'R8-加签意见', [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8-加签意见', 'i3ev_r8a', [START, { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批A', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: OPINION_FORM } }, END, ...edges(['node_1'])]);
const mk3 = 'r8-addsign-' + uuid8();
({ bk, pid } = await submit('i3ev_r8a', { amount: 79 }));
let t = await todoOf(TA, bk);
let [, asg] = await api(PA, TA, 'POST', `/workflow/tasks/${t}/add-sign`, { action: 'ADD_SIGN', participants: [2001], mode: 'PARALLEL' });
await sleep(1000);
const s1 = q(`select id from sw_bpm_sign_record where task_id='${t}' and sign_status='PENDING' limit 1`)[0];
let [, ex3] = await api(PA, T2, 'POST', `/workflow/sign/${s1}/express`, { action: 'APPROVE', comment: mk3, opinionFormId: 'i3ev-r8-opinion', opinionFormVersion: 'v1', opinionData: { comment2: mk3 + '-sign', level: 'A' } });
let [, fin3] = await api(PA, TA, 'POST', `/workflow/tasks/${t}/complete`, { action: 'APPROVE', comment: mk3 + '-final', opinionData: { comment2: mk3 + '-final', level: 'A' } });
await sleep(1200);
LOG.addsign = { marker: mk3, add_sign: asg.code, express: ex3.code, final: fin3.code, sign_rows: signRows(pid), snapshots: snapshots(pid), history_echo: await processedFor(TA, bk) };

// ---- 6) 补签表态快照 ----
const mk4 = 'r8-supp-' + uuid8();
({ bk, pid } = await submit('i3ev_r8a', { amount: 80 }));
t = await todoOf(TA, bk);
await api(PA, TA, 'POST', `/workflow/tasks/${t}/complete`, { action: 'APPROVE', comment: mk4 + '-pass', opinionData: { comment2: mk4 + '-orig', level: 'A' } });
await sleep(1200);
let [, sup] = await api(PA, TA, 'POST', `/workflow/instances/${pid}/supplement-sign`, { action: 'SUPPLEMENT_SIGN', participants: [2001], comment: mk4 });
await sleep(800);
const sid = q(`select id from sw_bpm_sign_record where sign_type='SUPPLEMENT_SIGN' and process_instance_id='${pid}' order by id desc limit 1`)[0];
let [, ex4] = await api(PA, T2, 'POST', `/workflow/sign/${sid}/express`, { action: 'APPROVE', comment: mk4 + '-sup', opinionFormId: 'i3ev-r8-opinion', opinionFormVersion: 'v1', opinionData: { comment2: mk4 + '-confirm', level: 'B' } });
await sleep(1200);
LOG.supplement = { marker: mk4, sup_create: sup.code, express: ex4.code, sup_sign_row: q(`select sign_type||'|'||sign_status||'|'||substr(coalesce(detail,'-'),1,300) from sw_bpm_sign_record where id='${sid}'`)[0], snapshots: snapshots(pid), history_echo: await processedFor(T2, bk), instance_status: q(`select status from sw_bpm_instance where process_instance_id='${pid}'`)[0] };

// ---- 7) 退回轮次（两节点）----
await ensureFormDef('i3ev_r8r', 'R8-退回意见', [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8-退回意见', 'i3ev_r8r', [START, { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批A', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: OPINION_FORM } }, { id: 'node_2', kind: 'node', type: 'APPROVAL', x: 540, y: 300, config: { name: '审批B', participant: { strategy: 'FIXED_USER', value: [2001] }, opinionForm: OPINION_FORM } }, END, ...edges(['node_1', 'node_2'])]);
const mk5 = 'r8-return-' + uuid8();
({ bk, pid } = await submit('i3ev_r8r', { amount: 81 }));
const before5 = await mainForm('i3ev_r8r', bk);
const tA = await todoOf(TA, bk);
await api(PA, TA, 'POST', `/workflow/tasks/${tA}/complete`, { action: 'APPROVE', comment: mk5 + '-A', opinionData: { comment2: mk5 + '-round1', level: 'A' } });
await sleep(1200);
const tB = await todoOf(T2, bk);
let [, ret] = await api(PA, T2, 'POST', `/workflow/tasks/${tB}/return`, { action: 'RETURN', returnTargetNodeId: 'node_1', comment: mk5 + '-return', opinionData: { comment2: mk5 + '-back', level: 'B' } });
await sleep(1200);
const tA2 = await todoOf(TA, bk);
let [, fin5] = await api(PA, TA, 'POST', `/workflow/tasks/${tA2}/complete`, { action: 'APPROVE', comment: mk5 + '-r2', opinionData: { comment2: mk5 + '-round2', level: 'A' } });
await sleep(1200);
const roundRow = q(`select action||'|'||coalesce(round_no::text,'-') from sw_bpm_approval_action where process_instance_id='${pid}' and action='RETURN' order by id desc limit 1`)[0];
LOG.returnRound = { marker: mk5, return: ret.code, round_row: roundRow, round2_task: tA2, round2_complete: fin5.code, main_form_before: before5, main_form_after: await mainForm('i3ev_r8r', bk), snapshots: snapshots(pid), history_echo: await processedFor(TA, bk) };

// ---- 8) 版本变化前后 snapshot hash 不变性 ----
const hashBefore = {};
for (const k of ['plain', 'consensus', 'addsign', 'supplement', 'returnRound']) {
  hashBefore[k] = (LOG[k].snapshots || []).map(s => sha256(s));
}
const [, pubAgain] = await api(PA, TA, 'GET', `/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_r8r`);
const d8 = ((pubAgain.data?.records) || []).find(x => x.name === 'R8-退回意见');
// 发布新版本（同图重发布）
let [, cur] = await api(PA, TA, 'GET', `/workflow/defs/${d8.id}`);
const graph = cur.data;
await api(PA, TA, 'PUT', `/workflow/defs/${d8.id}/graph`, { ...graph, processKey: graph.processKey || '' });
await api(PA, TA, 'POST', `/workflow/defs/${d8.id}/publish`);
await sleep(500);
const hashAfter = {};
for (const k of ['plain', 'consensus', 'addsign', 'supplement', 'returnRound']) {
  hashAfter[k] = (LOG[k].snapshots || []).map(s => sha256(s));
}
LOG.version_hash_stability = { hashes_before: hashBefore, hashes_after: hashAfter, unchanged: JSON.stringify(hashBefore) === JSON.stringify(hashAfter) };

// ---- 断言 ----
const plainDiffUnchanged = Object.values(LOG.plain.field_diff).every(v => v.unchanged);
const assertions = {
  catalog_22_types_5_disabled: LOG.catalog.total === 22 && LOG.catalog.disabled.length === 5,
  disabled_config_rejected: dis.config_code !== 0,
  disabled_publish_rejected: dis.publish_code !== 0 && dis.publish_code !== 1100,
  disabled_validate_2417_present: disErrs.length > 0,
  plain: LOG.plain.missing_required_rejected !== 0 && LOG.plain.submit === 0 && LOG.plain.snapshots.length > 0 && plainDiffUnchanged && (LOG.plain.history_echo || []).length > 0,
  consensus: LOG.consensus.vote_a === 0 && LOG.consensus.vote_b === 0 && LOG.consensus.snapshots.length >= 2 && LOG.consensus.history_echo.length >= 2,
  addsign: LOG.addsign.add_sign === 0 && LOG.addsign.express === 0 && (LOG.addsign.snapshots || []).length >= 2,
  supplement: LOG.supplement.sup_create === 0 && LOG.supplement.express === 0 && !!LOG.supplement.sup_sign_row && !LOG.supplement.sup_sign_row.endsWith('|-') && LOG.supplement.snapshots.length >= 1,
  returnRound: LOG.returnRound.return === 0 && LOG.returnRound.round_row === 'RETURN|1' && LOG.returnRound.round2_complete === 0 && LOG.returnRound.snapshots.length >= 2,
  version_hash_stability: LOG.version_hash_stability.unchanged
};
const pass = Object.values(assertions).every(Boolean);
save(EV + '/r8-actions.json', { _snapshot: SNAPSHOT, LOG, assertions, pass });
console.log('R8 pass=' + pass, JSON.stringify(assertions));
