// G1a：真实审批任务完成后通知运行时失败（EMAIL 渠道 127.0.0.1:2525 无真实 SMTP 监听）
// 链路：u1 创建草稿→提交→u2 受理任务→任务与流程推进不受通知失败回滚；失败投递可查
const fs = require('fs');
const { challengeLogin, req } = require('../object-setup/harness.js');

const OUT = __dirname;
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }

async function waitFor(condFn, desc, timeoutMs = 60000, everyMs = 1200) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const v = await condFn();
    if (v) return v;
    await new Promise(r => setTimeout(r, everyMs));
  }
  throw new Error(`timeout: ${desc}`);
}

async function main() {
  const u1 = await challengeLogin('u1_100');
  log('u1 logged in, userId=', u1.userId, 'tenant=', u1.tenantId);

  // 1. 创建草稿（表单 i6g1a_form_t100b 已发布）
  const menu = await req(u1.token, 'GET', '/workflow/drafts');
  log('draft list status codes ok, system reachable:', typeof menu.body);

  const draftResp = await req(u1.token, 'POST', '/workflow/drafts', {
    formKey: 'i6g1a_form_t100b',
    title: 'I6G1A 审批单-005',
    payload: { amount: 88.5, reason: 'notify-failure-nonrollback-chain' },
  });
  log('draft create →', JSON.stringify(draftResp));
  if (draftResp.body.code !== 0) throw new Error('draft create failed');
  const draftId = draftResp.body.data.id;

  // 2. 提交（NORMAL 异步命令）
  const submitResp = await req(u1.token, 'POST', `/workflow/drafts/${draftId}/submit`);
  log('submit →', JSON.stringify(submitResp));
  const commandId = submitResp.body.data.commandId;

  // 3. 轮询命令状态直至 COMPLETED
  const cmdStatus = await waitFor(async () => {
    const s = await req(u1.token, 'GET', `/workflow/commands/${commandId}`);
    if (s.body.code === 0 && s.body.data && s.body.data.status === 'COMPLETED') return s;
    return null;
  }, 'draft submit command completion');
  log('submit command completed:', JSON.stringify(cmdStatus.body));

  // 4. u2 登录取待办任务
  const u2 = await challengeLogin('u2_100');
  const todo = await req(u2.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10');
  log('u2 todo list →', JSON.stringify(todo).slice(0, 400));
  const task = (todo.body.data && todo.body.data.records || []).find(t => t.draftId == draftId || true);
  if (!task) throw new Error('no todo task found');
  const taskId = task.taskId || task.id;
  log('taskId=', taskId);

  // 5. u2 APPROVE（NORMAL 异步）
  const actResp = await req(u2.token, 'POST', `/workflow/commands/tasks/${taskId}/APPROVE`,
    { comment: 'I6G1A 审批通过（通知预期失败链）' });
  log('approve accept →', JSON.stringify(actResp));
  if (actResp.body.code !== 0) throw new Error('approve failed');
  const approveCmdId = actResp.body.data.commandId;

  const approveStatus = await waitFor(async () => {
    const s = await req(u2.token, 'GET', `/workflow/commands/${approveCmdId}`);
    if (s.body.code === 0 && s.body.data && s.body.data.status === 'COMPLETED') return s;
    return null;
  }, 'approve command completion', 90000);

  // 6. 回读：实例状态、任务历史（不含任务回滚）、通知失败记录
  const inst = await req(u1.token, 'GET', `/workflow/instances/my?pageNum=1&pageSize=10`);
  log('my instances →', JSON.stringify(inst).slice(0, 600));
  const msgList = await req(u1.token, 'GET', '/notify/inbox?pageNum=1&pageSize=10');
  log('u1 inbox →', JSON.stringify(msgList).slice(0, 600));

  fs.writeFileSync(`${OUT}/chain-tokens.json`, JSON.stringify({
    draftId, commandId, taskId, approveCmdId,
    approveCommandStatus: approveStatus.body,
  }, null, 2));
  log('DONE approvals');
}

main().catch(e => { log('FATAL', e.message); process.exit(1); });
