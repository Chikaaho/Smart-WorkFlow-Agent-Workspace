// G2g-P 权限订阅链矩阵：管理权限 / 本人订阅 / 强制站内信 / 可选渠道真实生效
const { challengeLogin, req } = require('../object-setup/harness.js');
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const u1 = await challengeLogin('u1_100');
  const u3 = await challengeLogin('u3_100');

  // 0. 建必须送达规则：TODO_CREATED，requiredFlag=1，IN_APP first
  const createReq = await req(u1.token, 'POST', '/notify/rules', {
    ruleCode: 'I6G2G_REQ', name: 'I6 强制待办站内信', eventType: 'TODO_CREATED',
    channelPriority: 'IN_APP,EMAIL', recipientRule: 'ASSIGNEE', requiredFlag: 1,
    failurePolicy: 'RETRY',
  });
  log('0 u1 create required rule ->', JSON.stringify(createReq.body));
  const forcedRuleId = createReq.body.data;

  // 1. 管理权限正反
  const list1 = await req(u1.token, 'GET', '/notify/rules?pageNum=1&pageSize=20');
  log('1a u1 rule list ->', list1.status, JSON.stringify(list1.body).slice(0, 200));
  const listU2by3 = await req(u3.token, 'GET', '/notify/rules?pageNum=1&pageSize=20');
  log('1b u3 rule list ->', listU2by3.status, JSON.stringify(listU2by3.body));
  const createByU3 = await req(u3.token, 'POST', '/notify/rules', {
    ruleCode: 'EVIL_RULE', name: '无权用户尝试', eventType: 'TODO_CREATED',
    channelPriority: 'IN_APP', recipientRule: 'ASSIGNEE', requiredFlag: 0, failurePolicy: 'RETRY',
  });
  log('1c u3 create rule ->', createByU3.status, JSON.stringify(createByU3.body));

  // 2. 本人订阅：u3 全量偏好读取 + 可选渠道 EMAIL 关闭（真实生效到投递）
  const prefs0 = await req(u3.token, 'GET', '/notify/subscriptions');
  log('2a u3 prefs before ->', JSON.stringify(prefs0.body));
  const saveDisable = await req(u3.token, 'POST', '/notify/subscriptions', { items: [
    { eventType: 'TODO_CREATED', channel: 'EMAIL', enabled: false },
  ] });
  log('2b u3 disable EMAIL ->', saveDisable.status, JSON.stringify(saveDisable.body));
  const prefs1 = await req(u3.token, 'GET', '/notify/subscriptions');
  log('2c u3 prefs after ->', JSON.stringify(prefs1.body));

  // 3. 强制站内信不可关闭
  const forcedDisable = await req(u3.token, 'POST', '/notify/subscriptions', { items: [
    { eventType: 'TODO_CREATED', channel: 'IN_APP', enabled: false },
  ] });
  log('3a u3 forced disable IN_APP ->', forcedDisable.status, JSON.stringify(forcedDisable.body));
  const prefsAfter = await req(u3.token, 'GET', '/notify/subscriptions');
  log('3b prefs unchanged(IN_APP optout rejected) ->', JSON.stringify(prefsAfter.body));

  // 4. 他人订阅不可改：u1 无法以任何参数改 u3（save 只作用本人/u3 数据不受影响）
  const u1Save = await req(u1.token, 'POST', '/notify/subscriptions', { items: [
    { eventType: 'TODO_CREATED', channel: 'EMAIL', enabled: false },
  ] });
  log('4a u1 self-save ->', u1Save.status, JSON.stringify(u1Save.body));
  const prefsU3Again = await req(u3.token, 'GET', '/notify/subscriptions');
  log('4b u3 prefs after u1 save ->', JSON.stringify(prefsU3Again.body));

  console.log('DONE. forcedRuleId=' + forcedRuleId);
}
main().catch(e => { log('FATAL', e.message); process.exit(1); });
