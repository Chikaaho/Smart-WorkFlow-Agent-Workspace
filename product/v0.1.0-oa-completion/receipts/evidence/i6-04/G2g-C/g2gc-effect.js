// G2g-C 规则生效矩阵：渠道组合/失败策略/事件/启停/删除 对后续真实投递的生效性
// 对象租户 T=100；approver=10002（EMAIL 订阅开）；initiator=10001
const { challengeLogin, req } = require('../object-setup/harness.js');
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function submitAndApprove(u1, u2, title) {
  const d = await req(u1.token, 'POST', '/workflow/drafts', {
    formKey: 'i6g1a_form_t100b', title, payload: { amount: 1, reason: title },
  });
  const draftId = d.body.data.id;
  const s = await req(u1.token, 'POST', `/workflow/drafts/${draftId}/submit`);
  const cmdId = s.body.data.commandId;
  let st; do { await sleep(900); st = await req(u1.token, 'GET', `/workflow/commands/${cmdId}`); }
  while (st.body.data.status === 'ACCEPTED');
  let rec = null, want = null, todo = null;
  try { want = (JSON.parse(st.body.data.result) || {}).recordId; } catch {}
  for (let i = 0; i < 12 && !rec; i++) {
    todo = await req(u2.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20');
    rec = (todo.body.data && todo.body.data.records || []).find(t => t.businessKey === want);
    if (!rec) await sleep(900);
  }
  if (!rec) throw new Error('no matching todo: result=' + st.body.data.result);
  const t0 = rec;
  const a = await req(u2.token, 'POST', `/workflow/commands/tasks/${t0.taskId}/APPROVE`, { comment: 'g2gc' });
  let at; do { await sleep(900); at = await req(u2.token, 'GET', `/workflow/commands/${a.body.data.commandId}`); }
  while (at.body.data && at.body.data.status === 'ACCEPTED');
  await sleep(1500);
  return { draftId, todos: todo.body.data.records.map(t => ({ taskId: t.taskId, biz: t.businessKey })), task: t0 };
}

async function main() {
  const u1 = await challengeLogin('u1_100');
  const u2 = await challengeLogin('u2_100');

  // A. IN_APP,EMAIL 组合规则（TODO_CREATED，接收人=ASSIGNEE）
  const ruleBad = await req(u1.token, 'POST', '/notify/rules', {
    ruleCode: 'I6G2G_CE', name: 'G2gC EMAIL-only', eventType: 'TODO_CREATED',
    channelPriority: 'EMAIL', recipientRule: 'ASSIGNEE', requiredFlag: 0, failurePolicy: 'RETRY',
  });
  log('A invalid EMAIL-only combo (expect 400) ->', JSON.stringify(ruleBad.body));
  const ruleGood = await req(u1.token, 'POST', '/notify/rules', {
    ruleCode: 'I6G2G_CE', name: 'G2gC 组合规则', eventType: 'TODO_CREATED',
    channelPriority: 'IN_APP,EMAIL', recipientRule: 'ASSIGNEE', requiredFlag: 0, failurePolicy: 'RETRY',
  });
  log('A rule create ->', JSON.stringify(ruleGood.body));
  const ruleAId = ruleGood.body.data;

  const chA = await submitAndApprove(u1, u2, 'I6G2G-C 链A（EMAIL-only 生效）');
  log('A chain result ->', JSON.stringify(chA));

  // B. 停用规则 → 后续投递不再按 EMAIL 组合（回退 IN_APP）
  const toggle = await req(u1.token, 'POST', `/notify/rules/${ruleAId}/enabled/false`);
  log('B disable rule ->', JSON.stringify(toggle.body));
  const chB = await submitAndApprove(u1, u2, 'I6G2G-C 链B（规则停用后）');
  log('B chain result ->', JSON.stringify(chB));

  console.log('DONE chains A/B');
}
main().catch(e => { log('FATAL', e && e.stack || e.message); process.exit(1); });
