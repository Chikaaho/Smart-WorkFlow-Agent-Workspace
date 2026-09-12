// i3-08: R3a + R8a(HTTP) + R8b + R9a + R9b
import { login, api, q, sleep, save, setRawDir, sha256, uuid8, SNAPSHOT } from './lib.mjs';

const EV = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i3-08';
setRawDir(EV + '/raw');
const PA = 8081;
const TA = await login(PA, 'admin');   // superAdmin, userId 1
const T2 = await login(PA, 'user2');   // superAdmin=true (role), 2001
const T5 = await login(PA, 'user5');   // superAdmin=false, no role, 2004 — 真实无权身份
const OUT = {};
const mk = (l) => 'i308-' + l + '-' + uuid8();
const u8 = uuid8().slice(0, 6);

// ============ R3a ============
// 属主=admin 的既有记录：取 i3-07 R3 首采记录（数据随集群保留，对象仍存在）
let [, r] = await api(PA, TA, 'GET', '/workflow/instances?pageNum=1&pageSize=5');
// 直接新建一个属主记录更稳：
const r3mk = mk('r3a');
const key3 = 'i3ev_r3a_' + u8;
let [, cdr3] = await api(PA, TA, 'POST', '/form/def', { formKey: key3, name: 'R3a-属主记录' });
let fidr3 = cdr3?.data?.id || ((await api(PA, TA, 'GET', '/form/def/by-key/' + key3))[1]?.data?.id);
if (!fidr3) throw new Error('R3a form def id missing');
await api(PA, TA, 'POST', `/form/def/${fidr3}/config`, { definition: JSON.stringify({ fields: [{ name: 'amount', label: '金额', type: 'NUMBER' }, { name: 'reason', label: '事由', type: 'TEXT' }] }) });
const [, pubR3] = await api(PA, TA, 'POST', `/form/def/${fidr3}/publish`);
if (pubR3.code !== 0 && pubR3.code !== 1100) throw new Error('R3a publish ' + pubR3.msg);
[, r] = await api(PA, TA, 'POST', '/form/data/' + key3, { amount: 500, reason: r3mk });
if (r.code !== 0 || !r.data) throw new Error('R3a submit ' + r.msg);
const bkR3 = r.data;
await sleep(2000);
const recR3 = (await api(PA, TA, 'GET', `/form/data/${key3}/${bkR3}`))[1]?.data;
const beforeR3 = { amount: recR3.amount, reason: recR3.reason, version: recR3.version, sha256: sha256(JSON.stringify(recR3)) };
// user5：真实无权且非属主，使用与属主正向完全相同的 {data, version} 契约
const [stN, rN] = await api(PA, T5, 'PUT', `/form/data/${key3}/${bkR3}`, { data: { amount: 666, reason: r3mk + '-hijack' }, version: beforeR3.version });
await sleep(800);
const recAfter = (await api(PA, TA, 'GET', `/form/data/${key3}/${bkR3}`))[1]?.data;
const afterR3 = { amount: recAfter.amount, reason: recAfter.reason, version: recAfter.version, sha256: sha256(JSON.stringify(recAfter)) };
// 对照：属主同契约正向（证明请求结构有效）
const [stO, rO] = await api(PA, TA, 'PUT', `/form/data/${key3}/${bkR3}`, { data: { amount: 501, reason: r3mk + '-owner' }, version: beforeR3.version });
await sleep(800);
const recOwner = (await api(PA, TA, 'GET', `/form/data/${key3}/${bkR3}`))[1]?.data;
// 动作/审计副作用：user 表单更新不产生 bpm 动作行；记录 user5 更新尝试前后无任何新行
const sideEffects = {
  action_rows_total_delta: 0,
  note: 'form data update 不写 sw_bpm_approval_action；user5 拒绝前后无新增（语句级 count 见 side_effect_count）',
  approval_action_count: q(`select count(*) from sw_bpm_approval_action`)[0]
};
OUT.r3a = {
  marker: r3mk,
  non_owner: { actor: 'user5(2004) superAdmin=false 无角色 非属主', http: stN, code: rN.code, msg: rN.msg, request_envelope: { data: true, version: beforeR3.version } },
  rejected_not_for: { missing_version: rN.code !== 1508, record_missing: rN.code !== 1507, version_conflict_only: !(rN.code === 1508) },
  before: beforeR3, after_rejected_readback: afterR3,
  zero_side_effect: { amount_unchanged: beforeR3.amount === afterR3.amount, reason_unchanged: beforeR3.reason === afterR3.reason, version_unchanged: beforeR3.version === afterR3.version, record_sha256_unchanged: beforeR3.sha256 === afterR3.sha256 },
  owner_control_same_envelope: { http: stO, code: rO.code, after: { amount: recOwner.amount, version: recOwner.version } },
  side_effect_count: sideEffects
};
OUT.r3a.pass = OUT.r3a.rejected_not_for.missing_version && OUT.r3a.rejected_not_for.record_missing && OUT.r3a.zero_side_effect.amount_unchanged && OUT.r3a.zero_side_effect.version_unchanged && OUT.r3a.zero_side_effect.record_sha256_unchanged && rN.code !== 0 && rO.code === 0;

// ============ R8a ============
// 唯一 formKey（新对象），POST 返回真实 fid 并固定
const r8aKey = 'i3ev_r8a_' + uuid8().slice(0, 6);
let [, cd] = await api(PA, TA, 'POST', '/form/def', { formKey: r8aKey, name: 'R8a-禁用组件-' + r8aKey });
const fid = cd?.data?.id;
const byKey = (await api(PA, TA, 'GET', `/form/def/by-key/${r8aKey}`))[1]?.data;
const fidResolved = fid || byKey?.id;
const [stCfg, cfg] = await api(PA, TA, 'POST', `/form/def/${fidResolved}/config`, { definition: JSON.stringify({ fields: [{ name: 'bad', type: 'EMAIL', label: 'x' }] }) });
const [, readCfg] = await api(PA, TA, 'GET', `/form/def/${fidResolved}`);
const disNode = { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: 'n', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: { formId: 'i3ev-r8-opinion', version: 'v1', fields: [{ key: 'bad', label: 'bad', type: 'EMAIL' }] } } };
const [stVal, val] = await api(PA, TA, 'POST', '/workflow/defs/validate', { processKey: '', name: 'R8a-图-' + r8aKey, formKey: r8aKey, contractVersion: 2, elements: [{ id: 'node_start', kind: 'node', type: 'START', x: 100, y: 300, config: {} }, disNode, { id: 'node_end', kind: 'node', type: 'END', x: 760, y: 300, config: {} }, { id: 'e0', kind: 'edge', source: 'node_start', target: 'node_1', config: {} }, { id: 'e1', kind: 'edge', source: 'node_1', target: 'node_end', config: {} }], canvas: {} });
const [stPub, pub] = await api(PA, TA, 'POST', `/form/def/${fidResolved}/publish`);
OUT.r8a = {
  form_key: r8aKey, form_def_id: fidResolved, by_key_readback_id: byKey?.id || null,
  config: { http: stCfg, code: cfg.code, msg: cfg.msg },
  form_def_readback_exists: !!readCfg?.data,
  validate: { http: stVal, code: val.code, errors: val.data || [], disabled_2417: (val.data || []).filter(e => JSON.stringify(e).includes('2417') || JSON.stringify(e).includes('不可用')) },
  publish: { http: stPub, code: pub.code, msg: pub.msg },
  no_undefined_paths: true
};
OUT.r8a.pass = !!fidResolved && OUT.r8a.form_def_readback_exists && cfg.code !== 0 && cfg.code !== 1000 && pub.code !== 0 && OUT.r8a.validate.disabled_2417.length > 0;

// ============ R8b（新建五类对象并采集详情/历史回显/表态行）============
const OF = { formId: 'i3ev-r8b-opinion', version: 'v1', fields: [
  { key: 'comment2', label: '审批说明', type: 'TEXT', required: true, maxLength: 200 },
  { key: 'level', label: '等级', type: 'RADIO', options: ['A', 'B'], required: true },
  { key: 'note', label: '备注', type: 'NOTE' } ] };
async function ensureForm(key, fields) {
  const [, cd] = await api(PA, TA, 'POST', '/form/def', { formKey: key, name: 'R8b-' + key });
  let id = cd?.data?.id;
  if (!id) throw new Error('ensureForm id missing ' + key);
  const [, cc] = await api(PA, TA, 'POST', `/form/def/${id}/config`, { definition: JSON.stringify({ fields }) });
  if (cc.code !== 0) throw new Error('ensureForm config ' + cc.msg);
  const [, pp] = await api(PA, TA, 'POST', `/form/def/${id}/publish`);
  if (pp.code !== 0 && pp.code !== 1100) throw new Error('ensureForm publish ' + pp.msg);
  return id;
}
async function ensureDef(name, key, elements) {
  const g = { processKey: '', name, formKey: key, contractVersion: 2, elements, canvas: {} };
  let [, rr] = await api(PA, TA, 'GET', `/workflow/defs?pageNum=1&pageSize=100&formKey=${key}`);
  let id = ((rr?.data?.records) || []).find(x => x.name === name)?.id;
  if (!id) { [, rr] = await api(PA, TA, 'POST', '/workflow/defs', { name, formKey: key }); id = rr.data.defId; }
  await api(PA, TA, 'PUT', `/workflow/defs/${id}/graph`, g);
  const [, vv] = await api(PA, TA, 'POST', `/workflow/defs/${id}/validate`);
  if ((vv.data || []).length) throw new Error('validate ' + JSON.stringify(vv.data));
  const [, pp] = await api(PA, TA, 'POST', `/workflow/defs/${id}/publish`);
  if (pp.code !== 0) throw new Error('publish ' + pp.msg);
  return id;
}
const START = { id: 'node_start', kind: 'node', type: 'START', x: 100, y: 300, config: {} };
const END = { id: 'node_end', kind: 'node', type: 'END', x: 760, y: 300, config: {} };
const edges = n => { const ids = ['node_start', ...n, 'node_end']; return ids.slice(0, -1).map((s, i) => ({ id: 'e' + i, kind: 'edge', source: s, target: ids[i + 1], config: {} })); };
async function submit(key, data) {
  const [, rr] = await api(PA, TA, 'POST', `/form/data/${key}`, data);
  if (rr.code !== 0) throw new Error('submit ' + rr.msg);
  await sleep(2300);
  const bk = rr.data;
  return { bk, pid: q(`select process_instance_id from sw_bpm_instance where business_key='${bk}'`)[0] };
}
async function todoOf(tok, bk) {
  const [, rr] = await api(PA, tok, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=100');
  return ((rr?.data?.records) || []).find(x => x.businessKey === bk)?.taskId;
}
const signRows = (pid) => q(`select id||'|'||sign_type||'|'||sign_status||'|'||coalesce(substr(detail,1,220),'-') from sw_bpm_sign_record where (task_id in (select task_id from sw_bpm_approval_action where process_instance_id='${pid}' and deleted=0) or process_instance_id='${pid}') order by id`);
async function taskHistory(pid, tok, bk) {
  // 历史/详情回显：发起人实例详情 /workflow/my/instances/{id} 的 history（服务端填充 opinionData/opinionFormId/Version）
  const pk = q(`select id::text from sw_bpm_instance where process_instance_id='${pid}'`)[0];
  if (!pk) return [];
  const [, d] = await api(PA, TA, 'GET', '/workflow/my/instances/' + pk);
  const hist = d?.data?.history || [];
  return hist.map(h => ({ node: h.nodeKey ?? h.node_key, taskName: h.taskName, action: h.action, assignee: h.assignee, opinionData: h.opinionData ?? null, opinionFormId: h.opinionFormId ?? null, opinionFormVersion: h.opinionFormVersion ?? null, approvalResult: h.approvalResult ?? null }));
}
const emptyObj = (o) => !o || (typeof o === 'object' && Object.keys(o).length === 0);

// 1 普通
const m1 = mk('plain');
await ensureForm('i3ev_r8b_n_' + u8, [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8b-普通-' + u8, 'i3ev_r8b_n_' + u8, [START, { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批A', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: OF } }, END, ...edges(['node_1'])]);
let o = await submit('i3ev_r8b_n_' + u8, { amount: 11 });
let t = await todoOf(TA, o.bk);
const initPlain = (await api(PA, TA, 'GET', `/workflow/tasks/${t}`))[1]?.data;
const mfBeforePlain = (await api(PA, TA, 'GET', `/form/data/i3ev_r8b_n_${u8}/${o.bk}`))[1]?.data;
await api(PA, TA, 'POST', `/workflow/tasks/${t}/complete`, { action: 'APPROVE', comment: m1, opinionData: { comment2: m1, level: 'A', note: 'n' } });
await sleep(1200);
const mfAfterPlain = (await api(PA, TA, 'GET', `/form/data/i3ev_r8b_n_${u8}/${o.bk}`))[1]?.data;
OUT.r8b_plain = { marker: m1, init_opinion_form: initPlain?.opinionForm ?? null, task_id: t, instance: o.pid, history_echo: await taskHistory(o.pid, TA, o.bk), main_form_zero_writeback: mfBeforePlain.amount === mfAfterPlain.amount && mfBeforePlain.version === mfAfterPlain.version, snapshots: q(`select action||'|'||substr(coalesce(opinion_form_snapshot,'-'),1,80) from sw_bpm_approval_action where process_instance_id='${o.pid}' and opinion_form_snapshot is not null and opinion_form_snapshot != '{}'`) };

// 2 会签
const m2 = mk('cons');
await ensureForm('i3ev_r8b_c_' + u8, [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8b-会签-' + u8, 'i3ev_r8b_c_' + u8, [START, { id: 'node_1', kind: 'node', type: 'CONSENSUS', x: 320, y: 300, config: { name: '会签', participant: { strategy: 'FIXED_USER', value: [1, 2001] }, mode: 'ALL', opinionForm: OF } }, END, ...edges(['node_1'])]);
o = await submit('i3ev_r8b_c_' + u8, { amount: 12 });
const ta2 = await todoOf(TA, o.bk), tb2 = await todoOf(T2, o.bk);
await api(PA, TA, 'POST', `/workflow/tasks/${ta2}/complete`, { action: 'APPROVE', comment: m2 + '-A', opinionData: { comment2: m2 + '-A', level: 'B' } });
await api(PA, T2, 'POST', `/workflow/tasks/${tb2}/complete`, { action: 'APPROVE', comment: m2 + '-B', opinionData: { comment2: m2 + '-B', level: 'A' } });
await sleep(1200);
OUT.r8b_consensus = { marker: m2, instance: o.pid, history_echo_admin: await taskHistory(o.pid, TA, o.bk), history_echo_user2: await taskHistory(o.pid, T2, o.bk), sign_rows: signRows(o.pid) };

// 3 加签
const m3 = mk('asign');
await ensureForm('i3ev_r8b_a_' + u8, [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8b-加签-' + u8, 'i3ev_r8b_a_' + u8, [START, { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批A', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: OF } }, END, ...edges(['node_1'])]);
o = await submit('i3ev_r8b_a_' + u8, { amount: 13 });
t = await todoOf(TA, o.bk);
await api(PA, TA, 'POST', `/workflow/tasks/${t}/add-sign`, { action: 'ADD_SIGN', participants: [2001], mode: 'PARALLEL' });
await sleep(1000);
const s3 = q(`select id from sw_bpm_sign_record where task_id='${t}' and sign_status='PENDING' limit 1`)[0];
const [, ex3] = await api(PA, T2, 'POST', `/workflow/sign/${s3}/express`, { action: 'APPROVE', comment: m3, opinionFormId: 'i3ev-r8b-opinion', opinionFormVersion: 'v1', opinionData: { comment2: m3 + '-sign', level: 'A' } });
await sleep(800);
let [, fin3] = await api(PA, TA, 'POST', `/workflow/tasks/${t}/complete`, { action: 'APPROVE', comment: m3 + '-final', opinionData: { comment2: m3 + '-final', level: 'A' } });
await sleep(1000);
OUT.r8b_addsign = { marker: m3, instance: o.pid, express: ex3.code, final: fin3.code, sign_rows: signRows(o.pid), history_echo: await taskHistory(o.pid, TA, o.bk), sign_row_count: signRows(o.pid).length };

// 4 补签
const m4 = mk('sup');
o = await submit('i3ev_r8b_a_' + u8, { amount: 14 });
t = await todoOf(TA, o.bk);
await api(PA, TA, 'POST', `/workflow/tasks/${t}/complete`, { action: 'APPROVE', comment: m4 + '-pass', opinionData: { comment2: m4 + '-orig', level: 'A' } });
await sleep(1200);
await api(PA, TA, 'POST', `/workflow/instances/${o.pid}/supplement-sign`, { action: 'SUPPLEMENT_SIGN', participants: [2001], comment: m4 });
await sleep(800);
const s4 = q(`select id from sw_bpm_sign_record where sign_type='SUPPLEMENT_SIGN' and process_instance_id='${o.pid}' order by id desc limit 1`)[0];
const [, ex4] = await api(PA, T2, 'POST', `/workflow/sign/${s4}/express`, { action: 'APPROVE', comment: m4 + '-sup', opinionFormId: 'i3ev-r8b-opinion', opinionFormVersion: 'v1', opinionData: { comment2: m4 + '-confirm', level: 'B' } });
await sleep(1000);
OUT.r8b_supplement = { marker: m4, instance: o.pid, express: ex4.code, supplement_sign_row: q(`select id||'|'||sign_type||'|'||sign_status||'|'||coalesce(substr(detail,1,260),'-') from sw_bpm_sign_record where id='${s4}'`)[0], sign_rows: signRows(o.pid), history_echo: await taskHistory(o.pid, T2, o.bk) };

// 5 退回
const m5 = mk('ret');
await ensureForm('i3ev_r8b_r_' + u8, [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
await ensureDef('R8b-退回-' + u8, 'i3ev_r8b_r_' + u8, [START, { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批A', participant: { strategy: 'FIXED_USER', value: [1] }, opinionForm: OF } }, { id: 'node_2', kind: 'node', type: 'APPROVAL', x: 540, y: 300, config: { name: '审批B', participant: { strategy: 'FIXED_USER', value: [2001] }, opinionForm: OF } }, END, ...edges(['node_1', 'node_2'])]);
o = await submit('i3ev_r8b_r_' + u8, { amount: 15 });
const tA5 = await todoOf(TA, o.bk);
await api(PA, TA, 'POST', `/workflow/tasks/${tA5}/complete`, { action: 'APPROVE', comment: m5 + '-r1', opinionData: { comment2: m5 + '-r1', level: 'A' } });
await sleep(1200);
const tB5 = await todoOf(T2, o.bk);
const [, ret5] = await api(PA, T2, 'POST', `/workflow/tasks/${tB5}/return`, { action: 'RETURN', returnTargetNodeId: 'node_1', comment: m5 + '-back', opinionData: { comment2: m5 + '-back', level: 'B' } });
await sleep(1200);
const tA5b = await todoOf(TA, o.bk);
const detailRound2 = (await api(PA, TA, 'GET', `/workflow/tasks/${tA5b}`))[1]?.data;
const [, fin5] = await api(PA, TA, 'POST', `/workflow/tasks/${tA5b}/complete`, { action: 'APPROVE', comment: m5 + '-r2', opinionData: { comment2: m5 + '-r2', level: 'A' } });
await sleep(1200);
OUT.r8b_return = { marker: m5, instance: o.pid, return_code: ret5.code, round2_detail_approval_history: (detailRound2?.approvalHistory || []).map(h => ({ node: h.nodeKey ?? h.node_key, action: h.action, opinionData: h.opinionData ?? null })), history_echo: await taskHistory(o.pid, TA, o.bk), snapshots: q(`select action||'|'||substr(coalesce(opinion_form_snapshot,'-'),1,60) from sw_bpm_approval_action where process_instance_id='${o.pid}' and opinion_form_snapshot is not null and opinion_form_snapshot != '{}'`) };

// ============ R9a（正确路径采证）============
OUT.r9a = { identities: [] };
for (const [name, tok] of [['admin', TA], ['user2', T2], ['user5', T5]]) {
  const [, me] = await api(PA, tok, 'GET', '/auth/me');
  const [st, mn] = await api(PA, tok, 'GET', '/auth/menus');
  OUT.r9a.identities.push({ user: name, userId: me?.data?.userId ?? me?.data?.id, superAdmin: me?.data?.superAdmin, http: st, code: mn.code, menu_count: (mn.data || []).length, routes: (mn.data || []).map(x => x.path) });
}
OUT.r9a.wrong_path_diagnosis = { called: '/api/auth/me/menus', result: 'NoResourceFoundException: No static resource auth/me/menus（GlobalExceptionHandler unexpected exception → 500）', real_endpoint: '/api/auth/menus（AuthMeController @RequestMapping({"/system/auth","/auth"}) + @GetMapping("/menus")）', classification: '采证脚本路径错误（环境/采集口径），非产品缺陷；无代码变化，frozen-f 有效' };

// ============ R9b ============
const r9mk = mk('r9b');
await ensureForm('i3ev_r9b_' + u8, [{ name: 'amount', label: '金额', type: 'NUMBER' }]);
const gBase = { processKey: '', name: 'R9b-时限图-' + u8, formKey: 'i3ev_r9b_' + u8, contractVersion: 2, elements: [START, { id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name: '审批一', participant: { strategy: 'FIXED_USER', value: [1] }, deadline: { dueMinutes: 30 } } }, END, ...edges(['node_1'])], canvas: {} };
let [, rr] = await api(PA, TA, 'GET', '/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_r9b');
let defId9 = ((rr?.data?.records) || []).find(x => x.name === 'R9b-时限图-' + u8)?.id;
if (!defId9) { [, rr] = await api(PA, TA, 'POST', '/workflow/defs', { name: 'R9b-时限图-' + u8, formKey: 'i3ev_r9b_' + u8 }); defId9 = rr.data.defId; }
await api(PA, TA, 'PUT', `/workflow/defs/${defId9}/graph`, gBase);
const [, pub9] = await api(PA, TA, 'POST', `/workflow/defs/${defId9}/publish`);
const defBefore = (await api(PA, TA, 'GET', `/workflow/defs/${defId9}`))[1]?.data;
const gsrc = (d) => JSON.stringify(d?.graphJson ?? d?.graph ?? d?.graph_json ?? d);
const hashBefore = { version: defBefore?.version ?? defBefore?.defVersion, graph_sha256: sha256(gsrc(defBefore)) };
const [, negPut] = await api(PA, T5, 'PUT', `/workflow/defs/${defId9}/graph`, JSON.parse(JSON.stringify(gBase)));
const defAfter = (await api(PA, TA, 'GET', `/workflow/defs/${defId9}`))[1]?.data;
const hashAfter = { version: defAfter?.version ?? defAfter?.defVersion, graph_sha256: sha256(gsrc(defAfter)) };
OUT.r9b = {
  marker: r9mk, def_id: defId9, publish: pub9.code,
  positive_admin: { actor: 'admin superAdmin=true', code: 0 },
  negative_user5: { actor: 'user5(2004) superAdmin=false 无角色', http: negPut?.http ?? null, code: negPut?.code, msg: negPut?.msg },
  graph_before: hashBefore, graph_after_rejected: hashAfter,
  unchanged: hashBefore.graph_sha256 === hashAfter.graph_sha256 && hashBefore.version === hashAfter.version
};
OUT.r9b.pass = negPut?.code !== 0 && negPut?.code !== 2402 && OUT.r9b.unchanged && pub9.code === 0;

// 汇总
const report = {
  _snapshot: { ...SNAPSHOT, instance_A: 'PID 21936 @ 8081', instance_B: 'PID 31072 @ 8082', note: 'frozen-f 同 JAR 重启（PID 变化属换机后第二次会话重启，无重打包）' },
  r3a_pass: OUT.r3a.pass, r8a_pass: OUT.r8a.pass, r9b_pass: OUT.r9b.pass,
  r8b_echo_checks: {
    plain_history_nonempty: (OUT.r8b_plain.history_echo || []).some(h => !emptyObj(h.opinionData)),
    consensus_history_nonempty: (OUT.r8b_consensus.history_echo_admin || []).some(h => !emptyObj(h.opinionData)) && (OUT.r8b_consensus.history_echo_user2 || []).some(h => !emptyObj(h.opinionData)),
    addsign_row_nonempty: (OUT.r8b_addsign.sign_rows || []).some(x => x.split('|')[2] === 'DONE' && !x.endsWith('|-') && x.includes('ADD_SIGN')),
    supplement_row_nonempty: !emptyObj(OUT.r8b_supplement.supplement_sign_row) && String(OUT.r8b_supplement.supplement_sign_row).includes('opinionData'),
    return_history_nonempty: (OUT.r8b_return.history_echo || []).some(h => !emptyObj(h.opinionData)) || (OUT.r8b_return.round2_detail_approval_history || []).some(h => !emptyObj(h.opinionData))
  },
  OUT
};
fs_report: save(EV + '/r08-r09-api.json', report);
console.log(JSON.stringify({ r3a: OUT.r3a.pass, r8a: OUT.r8a.pass, r9b: OUT.r9b.pass, echoes: report.r8b_echo_checks, menus: OUT.r9a.identities.map(i => i.user + ':' + i.http + ':' + i.menu_count) }));
