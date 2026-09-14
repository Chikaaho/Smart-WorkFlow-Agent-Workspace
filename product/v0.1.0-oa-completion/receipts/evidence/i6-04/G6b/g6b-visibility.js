// G6b 同对象多身份可见链：发起人/审批人/抄送人/无权用户 + 不串办/不越权
const { challengeLogin, req } = require('../object-setup/harness.js');
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);

async function main() {
  const u1 = await challengeLogin('u1_100');  // 发起人/管理员
  const u2 = await challengeLogin('u2_100');  // 审批人
  const u3 = await challengeLogin('u3_100');  // 抄送人（21bca43c）/无权（其他实例）
  const ccInst = '21bca43c-b027-11f1-a00c-00ffa7734675';   // 抄送链实例（u3 为抄送人）
  const retInst = '16cc3c94-b028-11f1-a7d5-00ffa7734675';  // 退回链实例（u3 无任何角色）

  const i1 = await req(u1.token, 'GET', `/workflow/instances/${ccInst}`);
  log('1a 发起人读实例详情 →', i1.status, JSON.stringify(i1.body).slice(0, 120));
  const i2 = await req(u2.token, 'GET', `/workflow/instances/${ccInst}`);
  log('1b 审批人（参与人）读实例详情 →', i2.status, JSON.stringify(i2.body).slice(0, 120));
  const i3 = await req(u3.token, 'GET', `/workflow/instances/${ccInst}`);
  log('1c 抄送人读实例详情 →', i3.status, JSON.stringify(i3.body).slice(0, 120));
  const i4 = await req(u3.token, 'GET', `/workflow/instances/${retInst}`);
  log('1d 无权用户读非参与实例详情 →', i4.status, JSON.stringify(i4.body).slice(0, 120));
  const i5 = await req(u1.token, 'GET', `/workflow/instances/${retInst}`);
  log('1e 管理员读退回链实例（本人发起） →', i5.status, JSON.stringify(i5.body).slice(0, 120));

  // 抄送详情（仅接收人本人）
  const copies = await req(u3.token, 'GET', '/workflow/my/copies?pageNum=1&pageSize=5');
  log('2a u3 抄送我的列表 →', copies.status, JSON.stringify(copies.body).slice(0, 260));
  const u2copies = await req(u2.token, 'GET', '/workflow/my/copies?pageNum=1&pageSize=5');
  log('2b u2 抄送我的列表（应为空或不含 u3 的行） →', u2copies.status, JSON.stringify(u2copies.body).slice(0, 200));

  // 不串办：u3 对 u2 的待办任务发起审批 → 拒绝
  const todo2 = await req(u2.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=5');
  const victim = ((todo2.body.data || {}).records || [])[0];
  if (victim) {
    const evil = await req(u3.token, 'POST', `/workflow/commands/tasks/${victim.taskId}/APPROVE`, { comment: 'g6b-evil' });
    log('3a u3 冒办 u2 待办 →', evil.status, JSON.stringify(evil.body).slice(0, 140));
    const evilTransfer = await req(u3.token, 'POST', `/workflow/tasks/${victim.taskId}/transfer`, { comment: 'g6b-evil-transfer', targetUserId: 10003 });
    log('3b u3 转办他人待办 →', evilTransfer.status, JSON.stringify(evilTransfer.body).slice(0, 140));
  }
  console.log('DONE');
}
main().catch(e => { log('FATAL', e.message); process.exit(1); });
