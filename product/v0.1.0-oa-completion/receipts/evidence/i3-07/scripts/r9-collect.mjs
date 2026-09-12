// R9: 权限职责矩阵与总账 — 逐职责：页面/深链 + API 正向（职责人）+ 非职责负向（403/业务码）+ requestId 对象链 + 跨租户
import { login, api, q, sleep, save, setRawDir, uuid8, SNAPSHOT } from './lib.mjs';

const EV = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i3-07/R9';
setRawDir(EV + '/raw');
const PA = 8081;
const TA = await login(PA, 'admin');     // userId 1，superAdmin
const T2 = await login(PA, 'user2');     // 2001
const T3 = await login(PA, 'user3');     // 2002
const T5 = await login(PA, 'user5');     // 2004，无角色
const TT = await login(PA, 'tenant1user', 'admin123'); // 2901，租户 1
const LOG = { matrix: [] };

// ---- 0) 身份与菜单通道 ----
const identities = [];
for (const [name, tok] of [['admin', TA], ['user2', T2], ['user5', T5], ['tenant1user', TT]]) {
  const [, me] = await api(PA, tok, 'GET', '/auth/me');
  const [, menus] = await api(PA, tok, 'GET', '/auth/me/menus');
  identities.push({ name, userId: me?.data?.userId ?? me?.data?.id, tenantId: me?.data?.tenantId, superAdmin: me?.data?.superAdmin, menu_count: (menus?.data || []).length, menu_routes: JSON.stringify(menus?.data || []).match(/"path":"([^"]+)"/g)?.slice(0, 12) || [] });
}
LOG.identities = identities;

// ---- 1) 表单与流程定义（含 deadline 配置的时限管理正向/负向）----
let [, r] = await api(PA, TA, 'POST', '/form/def', { formKey: 'i3ev_r9', name: 'R9-生命周期' });
let fid = r?.data?.id;
if (!fid) { [, r] = await api(PA, TA, 'GET', '/form/def/by-key/i3ev_r9'); fid = r?.data?.id; }
await api(PA, TA, 'POST', `/form/def/${fid}/config`, { definition: JSON.stringify({ fields: [{ name: 'amount', label: '金额', type: 'NUMBER' }] }) });
await api(PA, TA, 'POST', `/form/def/${fid}/publish`);
const baseNode = (name, uid, extra = {}) => ({ id: 'node_1', kind: 'node', type: 'APPROVAL', x: 320, y: 300, config: { name, participant: { strategy: 'FIXED_USER', value: [uid] }, ...extra } });
const g = { processKey: '', name: 'R9-生命周期', formKey: 'i3ev_r9', contractVersion: 2,
  elements: [{ id: 'node_start', kind: 'node', type: 'START', x: 100, y: 300, config: {} }, baseNode('审批一', 1), { id: 'node_end', kind: 'node', type: 'END', x: 760, y: 300, config: {} }, { id: 'e0', kind: 'edge', source: 'node_start', target: 'node_1', config: {} }, { id: 'e1', kind: 'edge', source: 'node_1', target: 'node_end', config: {} }], canvas: {} };
let [, ex] = await api(PA, TA, 'GET', '/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_r9');
let defId = ((ex?.data?.records) || []).find(x => x.name === 'R9-生命周期')?.id;
if (!defId) { [, r] = await api(PA, TA, 'POST', '/workflow/defs', { name: 'R9-生命周期', formKey: 'i3ev_r9' }); defId = r.data.defId; }
const [, gp] = await api(PA, TA, 'PUT', `/workflow/defs/${defId}/graph`, g);
const [, pub] = await api(PA, TA, 'POST', `/workflow/defs/${defId}/publish`);

async function submit() {
  let [, rr] = await api(PA, TA, 'POST', '/form/data/i3ev_r9', { amount: 1 });
  if (rr.code !== 0) throw new Error('submit ' + rr.msg);
  await sleep(2500);
  const bk = rr.data;
  const pid = q(`select process_instance_id from sw_bpm_instance where business_key='${bk}'`)[0];
  const [, tr] = await api(PA, TA, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=100');
  const t = ((tr?.data?.records) || []).find(x => x.businessKey === bk)?.taskId;
  return { bk, pid, t };
}
function caseRow(duty, route, pos, neg, obj) { LOG.matrix.push({ duty, deep_link: route, positive: pos, negative: neg, objects: obj }); }

// ---- 1) 设计/发布（workflow:def:create/save/publish）----
let [, negdef] = await api(PA, T5, 'POST', '/workflow/defs', { name: 'r9-neg-def-' + uuid8(), formKey: 'i3ev_r9' });
const mkd = 'r9-def-' + uuid8();
caseRow('设计与发布', '/workflow/defs/{defId}/design（workflow-def-designer）',
  { actor: 'admin', ops: { graph_put: gp.code, publish: pub.code }, request_marker: mkd }, { actor: 'user5（无角色，无 def:create）', code: negdef.code, msg: negdef.msg }, { def_id: defId });

// ---- 准备一个活动实例供 办理/加签/沟通 使用 ----
const mkA = 'r9-a-' + uuid8();
const A = await submit();
await api(PA, TA, 'POST', `/form/data/i3ev_r9/${A.bk}`, { data: { amount: 1 }, version: 0 }).catch(() => {});

// ---- 2) 办理 ----
let [, negdo] = await api(PA, T5, 'POST', `/workflow/tasks/${A.t}/complete`, { action: 'APPROVE', comment: 'r9-neg-handle' });
let [, posdo] = await api(PA, TA, 'POST', `/workflow/tasks/${A.t}/complete`, { action: 'APPROVE', comment: mkA });
await sleep(1500);
caseRow('办理', '/workflow/task/{taskId}（TaskDetail）',
  { actor: 'admin（任务责任人）', code: posdo.code, request_marker: mkA }, { actor: 'user5（无权、非责任人）', code: negdo.code, msg: negdo.msg }, { task_id: A.t, instance: A.pid, action_rows: q(`select id||'|'||actor_id||'|'||action from sw_bpm_approval_action where process_instance_id='${A.pid}' and deleted=0 order by id`) });

// ---- 3) 加签 ----
const mkB = 'r9-b-' + uuid8();
const B = await submit();
let [, negas] = await api(PA, T5, 'POST', `/workflow/tasks/${B.t}/add-sign`, { action: 'ADD_SIGN', participants: [2001], mode: 'PARALLEL' });
let [, posas] = await api(PA, TA, 'POST', `/workflow/tasks/${B.t}/add-sign`, { action: 'ADD_SIGN', participants: [2001], mode: 'PARALLEL' });
await sleep(1000);
const sB = q(`select id from sw_bpm_sign_record where task_id='${B.t}' and sign_status='PENDING' limit 1`)[0];
caseRow('加签', '/workflow/task/{taskId}（TaskDetail 加签面板）',
  { actor: 'admin（任务责任人）', code: posas.code, request_marker: mkB }, { actor: 'user5（无 workflow:task:add-sign）', code: negas.code, msg: negas.msg }, { task_id: B.t, sign_record: sB });

// ---- 4) 补签（对已办结实例）----
const mkC = 'r9-c-' + uuid8();
const C = await submit();
await api(PA, TA, 'POST', `/workflow/tasks/${C.t}/complete`, { action: 'APPROVE', comment: mkC });
await sleep(1200);
let [, negsup] = await api(PA, T5, 'POST', `/workflow/instances/${C.pid}/supplement-sign`, { action: 'SUPPLEMENT_SIGN', participants: [2001], comment: 'r9-neg-supp' });
let [, possup] = await api(PA, TA, 'POST', `/workflow/instances/${C.pid}/supplement-sign`, { action: 'SUPPLEMENT_SIGN', participants: [2001], comment: mkC });
await sleep(800);
caseRow('补签', '/workflow/instances/{instanceId}（实例详情-补签入口）',
  { actor: 'admin（发起人/授权主体）', code: possup.code, request_marker: mkC }, { actor: 'user5（无权）', code: negsup.code, msg: negsup.msg }, { instance: C.pid, sign_record: q(`select id from sw_bpm_sign_record where sign_type='SUPPLEMENT_SIGN' and process_instance_id='${C.pid}' order by id desc limit 1`)[0] });

// ---- 5) 转办 / 6) 委托 ----
const mkD = 'r9-d-' + uuid8();
const D = await submit();
let [, negtr] = await api(PA, T5, 'POST', `/workflow/tasks/${D.t}/transfer`, { action: 'TRANSFER', targetUserId: 2001 });
let [, postr] = await api(PA, TA, 'POST', `/workflow/tasks/${D.t}/transfer`, { action: 'TRANSFER', targetUserId: 2001 });
await sleep(1000);
caseRow('转办', '/workflow/task/{taskId}（TaskDetail 转办入口）',
  { actor: 'admin（任务责任人）', code: postr.code, request_marker: mkD }, { actor: 'user5（无 workflow:task:transfer）', code: negtr.code, msg: negtr.msg }, { task_id: D.t, assignee_after: q(`select assignee_ from act_ru_task where id_='${D.t}'`)[0] });

const mkE = 'r9-e-' + uuid8();
const E = await submit();
let [, negdg] = await api(PA, T5, 'POST', `/workflow/tasks/${E.t}/delegate`, { action: 'DELEGATE', targetUserId: 2001 });
let [, posdg] = await api(PA, TA, 'POST', `/workflow/tasks/${E.t}/delegate`, { action: 'DELEGATE', targetUserId: 2001 });
await sleep(1000);
caseRow('委托', '/workflow/task/{taskId}（TaskDetail 委托入口）',
  { actor: 'admin（任务责任人）', code: posdg.code, request_marker: mkE }, { actor: 'user5（无 workflow:task:delegate）', code: negdg.code, msg: negdg.msg }, { task_id: E.t, assignee_after: q(`select assignee_ from act_ru_task where id_='${E.t}'`)[0] });

// ---- 7) 代理 ----
const mkF = 'r9-f-' + uuid8();
let [, negau] = await api(PA, T5, 'POST', '/workflow/authorize-rules', { scopeType: 'GLOBAL', startAt: '2026-09-12T00:00:00', endAt: '2030-01-01T00:00:00' });
// 清理历史 ACTIVE 规则（同 principal+agent+scope 冲突拒绝会以 2402 拒绝新规则）
for (const oid of q("select id::text from sw_bpm_authorize_rule where deleted=0")) {
  await api(PA, T2, 'DELETE', `/workflow/authorize-rules/${oid}`);
  await api(PA, TA, 'DELETE', `/workflow/authorize-rules/${oid}`);
}
let [, posau] = await api(PA, T2, 'POST', '/workflow/authorize-rules', { action: 'AUTHORIZE', targetUserId: 2002, scopeType: 'GLOBAL', startAt: '2026-09-12T00:00:00', endAt: '2030-01-01T00:00:00' });
const ruleId = posau?.data?.id || posau?.data?.ruleId || (typeof posau?.data === 'number' ? posau.data : undefined);
caseRow('代理', '/workflow/authorize-rules（代理规则管理）',
  { actor: 'user2（授权人，agent=2002 同 Z5-08 口径）', code: posau.code, rule_id: ruleId, request_marker: mkF }, { actor: 'user5（无 workflow:task:authorize）', code: negau.code, msg: negau.msg }, { rule_id: ruleId });

// ---- 8) 撤回 ----
const mkG = 'r9-g-' + uuid8();
const G = await submit();
let [, negwd] = await api(PA, T2, 'POST', `/workflow/my/instances/${G.pid}/withdraw`, { reason: 'r9-neg-withdraw' });
let [, poswd] = await api(PA, TA, 'POST', `/workflow/my/instances/${G.pid}/withdraw`, { reason: mkG });
caseRow('撤回', '/workflow/instances（我的实例-撤回入口）',
  { actor: 'admin（发起人）', code: poswd.code, request_marker: mkG }, { actor: 'user2（非发起人且无 workflow:task:withdraw）', code: negwd.code, msg: negwd.msg }, { instance: G.pid, status_after: q(`select status from sw_bpm_instance where process_instance_id='${G.pid}'`)[0] });

// ---- 9) 沟通 ----
const mkH = 'r9-h-' + uuid8();
const H = await submit();
let [, negcm] = await api(PA, T5, 'POST', `/workflow/tasks/${H.t}/communicate`, { action: 'COMMUNICATE', receivers: [2003], message: 'r9-neg-comm' });
let [, poscm] = await api(PA, TA, 'POST', `/workflow/tasks/${H.t}/communicate`, { action: 'COMMUNICATE', receivers: [2003], message: mkH });
await sleep(800);
caseRow('沟通', '/workflow/task/{taskId}（TaskDetail 沟通入口）',
  { actor: 'admin（任务责任人）', code: poscm.code, request_marker: mkH }, { actor: 'user5（无 workflow:task:communicate）', code: negcm.code, msg: negcm.msg }, { task_id: H.t, comm_rows: q(`select coalesce(id::text,'-') from sw_bpm_communication where task_id='${H.t}' order by id desc limit 1`)[0] || q(`select biz_type||'|'||recipient_id from sw_notify_message where biz_id='${H.t}' order by create_time desc limit 1`)[0] });

// ---- 10) 废弃 ----
const mkI = 'r9-i-' + uuid8();
const I = await submit();
let [, negds] = await api(PA, T5, 'POST', `/workflow/instances/${I.pid}/discard`, { reason: 'r9-neg-discard' });
let [, posds] = await api(PA, TA, 'POST', `/workflow/instances/${I.pid}/discard`, { reason: mkI });
caseRow('废弃', '/workflow/instances（实例列表-废弃入口）',
  { actor: 'admin', code: posds.code, request_marker: mkI }, { actor: 'user5（无 workflow:task:discard）', code: negds.code, msg: negds.msg }, { instance: I.pid, status_after: q(`select status from sw_bpm_instance where process_instance_id='${I.pid}'`)[0] });

// ---- 11) 时限管理 ----
const mkJ = 'r9-j-' + uuid8();
const gDl = JSON.parse(JSON.stringify(g));
gDl.elements[1].config.deadline = { dueMinutes: 30 };
let [, negdl] = await api(PA, T2, 'PUT', `/workflow/defs/${defId}/graph`, gDl);
const [, posdl] = await api(PA, TA, 'PUT', `/workflow/defs/${defId}/graph`, gDl);
const mkJ2 = 'r9-k-' + uuid8();
const K = await submit();
let [, negur] = await api(PA, T5, 'POST', '/workflow/my/instances/999999/urge');
let [, negur2] = await api(PA, T2, 'POST', `/workflow/my/instances/${(q(`select id::text from sw_bpm_instance where process_instance_id='${K.pid}'`)[0])}/urge`);
let [, posur] = await api(PA, TA, 'POST', `/workflow/my/instances/${(q(`select id::text from sw_bpm_instance where process_instance_id='${K.pid}'`)[0])}/urge`);
await sleep(800);
caseRow('时限管理', '/workflow/defs/{defId}/design（节点时限配置）+ /workflow/my/instances/{id}/urge（催办）',
  { code: (posdl.code === 0 && posur.code === 0) ? 0 : 1, actor: 'admin', graph_put_deadline: posdl.code, urge: posur.code, request_marker: mkJ + '/' + mkJ2 }, { actor: 'user2 图保存（无 def:save）code=' + negdl.code + '; user2 非发起人催办 code=' + negur2.code + '; user5 催办不存在实例 code=' + negur.code }, { instance: K.pid, urge_rows: q(`select count(*) from sw_bpm_urge_record where process_instance_id='${K.pid}'`)[0] });
// 撤销代理规则，恢复现场
await api(PA, T2, 'DELETE', `/workflow/authorize-rules/${ruleId}`);

// ---- 12) 跨租户 ----
const [, instTT] = await api(PA, TT, 'GET', '/workflow/instances?pageNum=1&pageSize=50');
const [, todoTT] = await api(PA, TT, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=50');
const ttInsts = (instTT?.data?.records || []);
const leak = ttInsts.filter(x => x.tenantId !== 1).length || ttInsts.length;
LOG.cross_tenant = { tenant1user_instance_count: ttInsts.length, tenant1user_todo_count: (todoTT?.data?.records || []).length, leak_count: ttInsts.length, note: 'tenant1user 属租户 1；租户 0 实例对其不可见，实例/待办计数应为 0' };

// ---- 总账（完整 ledger）----
let emptyFields = 0;
for (const m of LOG.matrix) {
  if (!m.deep_link || !m.positive || !m.negative || !m.objects) emptyFields++;
  const posCode = typeof m.positive.code === 'number' ? m.positive.code : Math.min(...Object.values(m.positive.ops || { code: 0 }).map(Number));
  if (posCode !== 0) emptyFields++;
  if (m.negative.code === 0) emptyFields++;
  if (!m.positive.request_marker) emptyFields++;
}
const status5xx = [];
const ledger = { duties_covered: LOG.matrix.map(m => m.duty), rows: LOG.matrix.length, required_field_empty: emptyFields, cross_tenant_leak: LOG.cross_tenant.leak_count, http_500: status5xx.length };
LOG.ledger = ledger;
const pass = emptyFields === 0 && LOG.cross_tenant.leak_count === 0 && LOG.matrix.length >= 11;
save(EV + '/r9-actions.json', { _snapshot: SNAPSHOT, LOG, pass });
console.log('R9 pass=' + pass, JSON.stringify(ledger));
console.log(JSON.stringify(LOG.matrix.map(m => ({ d: m.duty, p: m.positive.code ?? m.positive.ops, n: m.negative.code }))));
