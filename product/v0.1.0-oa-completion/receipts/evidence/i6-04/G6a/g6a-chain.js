// G6a 流程事件通知矩阵（part2）：LIFECYCLE 动作（transfer/delegate/communicate）+ 撤回（发起人）
const { challengeLogin, req } = require('../object-setup/harness.js');
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForCmd(token, id) {
  let st; do { await sleep(900); st = await req(token, 'GET', `/workflow/commands/${id}`); } while (st.body.data.status === 'ACCEPTED');
  return st.body.data;
}

async function newTaskFor(u1, u2, title) {
  const d = await req(u1.token, 'POST', '/workflow/drafts', { formKey: 'i6g1a_form_t100b', title, payload: { amount: 9, reason: title } });
  const s = await req(u1.token, 'POST', `/workflow/drafts/${d.body.data.id}/submit`);
  const st = await waitForCmd(u1.token, s.body.data.commandId);
  const want = (JSON.parse(st.result) || {}).recordId;
  let rec = null;
  for (let i = 0; i < 14 && !rec; i++) {
    const tl = await req(u2.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20');
    rec = (tl.body.data.records || []).find(t => t.businessKey === want);
    if (!rec) await sleep(900);
  }
  if (!rec) throw new Error('no task for ' + title);
  return rec;
}

async function main() {
  const u1 = await challengeLogin('u1_100');
  const u2 = await challengeLogin('u2_100');
  let rec = await newTaskFor(u1, u2, 'I6G6A-TRANSFER2');
  const r1 = await req(u2.token, 'POST', `/workflow/tasks/${rec.taskId}/transfer`, { comment: 'g6a-transfer', targetUserId: 10003 });
  log('TRANSFER →', JSON.stringify(r1.body).slice(0, 160));
  rec = await newTaskFor(u1, u2, 'I6G6A-DELEGATE2');
  const r2 = await req(u2.token, 'POST', `/workflow/tasks/${rec.taskId}/delegate`, { comment: 'g6a-delegate', targetUserId: 10003 });
  log('DELEGATE →', JSON.stringify(r2.body).slice(0, 160));
  rec = await newTaskFor(u1, u2, 'I6G6A-COMM2');
  const r3 = await req(u2.token, 'POST', `/workflow/tasks/${rec.taskId}/communicate`, { comment: 'g6a-comm', participants: [10003] });
  log('COMMUNICATE →', JSON.stringify(r3.body).slice(0, 160));
  rec = await newTaskFor(u1, u2, 'I6G6A-WITHDRAW');
  const r4 = await req(u1.token, 'POST', `/workflow/my/instances/${rec.processInstanceId}/withdraw`, { comment: 'g6a-withdraw' });
  log('WITHDRAW →', JSON.stringify(r4.body).slice(0, 160));
  await sleep(1500);
  console.log('PART2 DONE');
}
main().catch(e => { log('FATAL', e.message); process.exit(1); });
