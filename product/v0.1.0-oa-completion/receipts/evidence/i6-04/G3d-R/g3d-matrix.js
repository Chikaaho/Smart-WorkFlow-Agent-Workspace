// G3d-R 管理资源双租户隔离矩阵 + G3d-A 消息动作跨租户拒绝
const { challengeLogin, req } = require('../object-setup/harness.js');
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }

async function main() {
  const u1t1 = await challengeLogin('u1_100');   // T100 管理员
  const u1t2 = await challengeLogin('u1_200');   // T200 管理员（同名角色）
  const u3t2 = await challengeLogin('u2_200');   // T200 普通用户

  // ===== G3d-R：同名资源矩阵 =====
  // 1. 两租户分别创建同名规则
  const r1 = await req(u1t1.token, 'POST', '/notify/rules', {
    ruleCode: 'I6G3D_R', name: '同名隔离规则', eventType: 'TODO_CREATED',
    channelPriority: 'IN_APP,EMAIL', recipientRule: 'ASSIGNEE', requiredFlag: 0, failurePolicy: 'RETRY',
  });
  log('R1 T100 rule create ->', JSON.stringify(r1.body));
  const r2 = await req(u1t2.token, 'POST', '/notify/rules', {
    ruleCode: 'I6G3D_R', name: '同名隔离规则', eventType: 'TODO_CREATED',
    channelPriority: 'IN_APP', recipientRule: 'ASSIGNEE', requiredFlag: 0, failurePolicy: 'RETRY',
  });
  log('R2 T200 rule create ->', JSON.stringify(r2.body));
  const ruleT2Id = r2.body.data, ruleT1Id = r1.body.data;

  // 2. 伪造 tenantId 不生效：创建时显式传 tenantId=200（token 是 T100）
  const forged = await req(u1t1.token, 'POST', '/notify/rules', {
    ruleCode: 'I6G3D_FORGE', name: '伪造租户', tenantId: 200, eventType: 'TODO_CREATED',
    channelPriority: 'IN_APP', recipientRule: 'ASSIGNEE', requiredFlag: 0, failurePolicy: 'RETRY',
  });
  log('R3 forged tenantId create ->', JSON.stringify(forged.body));

  // 3. 跨租户管理读写：T100 管理员操作 T200 同名规则
  const crossGet = await req(u1t1.token, 'GET', `/notify/rules/${ruleT2Id}`);
  log('R3a cross-tenant rule get ->', crossGet.status, JSON.stringify(crossGet.body));
  const crossPut = await req(u1t1.token, 'PUT', `/notify/rules/${ruleT2Id}`, {
    name: 'T100 越权改名', eventType: 'TODO_CREATED', channelPriority: 'IN_APP',
    recipientRule: 'ASSIGNEE', requiredFlag: 0, failurePolicy: 'RETRY',
  });
  log('R3b cross-tenant rule put ->', crossPut.status, JSON.stringify(crossPut.body));
  const crossDel = await req(u1t1.token, 'DELETE', `/notify/rules/${ruleT2Id}`);
  log('R3c cross-tenant rule delete ->', crossDel.status, JSON.stringify(crossDel.body));
  const crossToggle = await req(u1t1.token, 'POST', `/notify/rules/${ruleT2Id}/enabled/false`);
  log('R3d cross-tenant rule toggle ->', crossToggle.status, JSON.stringify(crossToggle.body));

  // 4. 模板同名隔离（	T200 建同名模板 code）
  const t1tpl = await req(u1t1.token, 'POST', '/notify/templates', {
    templateCode: 'I6G3D_TPL', titleTemplate: 'T100 标题', contentTemplate: 'T100 内容 {{k}}',
    eventType: 'TODO_CREATED', channel: 'IN_APP', variablesAllowed: 'k:TEXT',
  });
  log('R4a T100 tpl create ->', JSON.stringify(t1tpl.body).slice(0, 200));
  const t2tpl = await req(u1t2.token, 'POST', '/notify/templates', {
    templateCode: 'I6G3D_TPL', titleTemplate: 'T200 标题', contentTemplate: 'T200 内容 {{k}}',
    eventType: 'TODO_CREATED', channel: 'IN_APP', variablesAllowed: 'k:TEXT',
  });
  log('R4b same-code T100/T200 template create ->', JSON.stringify(t2tpl.body).slice(0, 220));
  // 5. 预览读取对方模板内容
  const t2Detail = await req(u1t1.token, 'GET', `/notify/templates/${t2tpl.body.data && t2tpl.body.data.id}`);
  log('R5 cross-tenant template detail ->', JSON.stringify(t2Detail.body).slice(0, 220));

  // ===== G3d-A：消息动作矩阵 =====
  // 6. u3t2(T200 普通) 读 T100 记录列表 / 详情 / 详情(必要) / 重发
  const recList = await req(u3t2.token, 'GET', '/notify/records?pageNum=1&pageSize=5');
  log('A1 T200-u2 record list ->', recList.status, JSON.stringify(recList.body).slice(0, 300));
  const m100 = 2099430376506863617; // G1a EMAIL FAILED 消息（T100）
  const recA = await req(u3t2.token, 'GET', `/notify/records/${m100}`);
  log('A2 cross-tenant record detail ->', recA.status, JSON.stringify(recA.body));
  const recADetail = await req(u3t2.token, 'GET', `/notify/records/${m100}/detail`);
  log('A3 cross-tenant full detail ->', recADetail.status, JSON.stringify(recADetail.body));
  const recResend = await req(u3t2.token, 'POST', `/notify/records/${m100}/resend`);
  log('A4 cross-tenant resend ->', recResend.status, JSON.stringify(recResend.body));
  // inbox 深链：u2_200 打开 T100 消息的受控跳转
  const inboxLink = await req(u3t2.token, 'POST', `/notify/inbox/${m100}/link`);
  log('A5 cross-tenant inbox link ->', inboxLink.status, JSON.stringify(inboxLink.body));
  const readOther = await req(u3t2.token, 'POST', `/notify/messages/${m100}/read`);
  29;
  log('A6 cross-tenant message read ->', readOther.status, JSON.stringify(readOther.body));
  // 7. T200 管理员同样拒绝 T100 对象（管理权限 ≠ 跨租户）
  const recAJ1 = await req(u1t2.token, 'GET', `/notify/records/${m100}`);
  log('A7 T200-admin cross-tenant record detail ->', recAJ1.status, JSON.stringify(recAJ1.body));
  const recAJ2 = await req(u1t2.token, 'GET', `/notify/records/${m100}/detail`);
  log('A8 T200-admin cross-tenant full detail ->', recAJ2.status, JSON.stringify(recAJ2.body));

  console.log('DONE');
}
main().catch(e => { log('FATAL', e.message); process.exit(1); });
