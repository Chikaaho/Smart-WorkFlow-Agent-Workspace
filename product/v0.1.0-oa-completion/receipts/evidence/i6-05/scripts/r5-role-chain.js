const { challengeLogin, req } = require('../../i6-04/object-setup/harness');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const approverUsername = process.argv[2];
const proxyUsername = process.argv[3];
const approver2Id = process.argv[4];
const proxyId = process.argv[5];
if (!approverUsername || !proxyUsername || !approver2Id || !proxyId) {
  throw new Error('usage: node r5-role-chain.js <second-approver-username> <proxy-username> <second-approver-id> <proxy-id>');
}

async function waitCommand(token, commandId) {
  let last;
  for (let i = 0; i < 40; i += 1) {
    await sleep(500);
    const response = await req(token, 'GET', `/workflow/commands/${commandId}`);
    last = response.body && response.body.data;
    if (last && ['COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(last.status)) return last;
  }
  throw new Error(`command did not reach terminal state: ${commandId}`);
}

function records(response) {
  return (response.body && response.body.data && response.body.data.records) || [];
}

async function waitTask(token, businessKey, predicate = () => true) {
  for (let i = 0; i < 40; i += 1) {
    const response = await req(token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=50');
    const task = records(response).find(item => item.businessKey === businessKey && predicate(item));
    if (task) return task;
    await sleep(500);
  }
  throw new Error(`todo timeout: ${businessKey}`);
}

function resultOf(response) {
  const body = response.body || {};
  return { httpStatus: response.status, code: body.code, data: body.data };
}

function compactMessages(response, linkIds) {
  return records(response)
    .filter(item => linkIds.has(String(item.linkId)))
    .map(item => ({
      id: item.id,
      eventType: item.eventType,
      recipientId: item.recipientId,
      channel: item.channel,
      read: item.read,
      linkType: item.linkType,
      linkId: item.linkId,
    }));
}

(async () => {
  const initiator = await challengeLogin('u1_100');
  const approver1 = await challengeLogin('u2_100');
  const approver2 = await challengeLogin(approverUsername);
  const proxy = await challengeLogin(proxyUsername);
  const copy = await challengeLogin('u3_100');
  const suffix = Date.now();
  const tenantBAdmin = await challengeLogin('u1_200');
  const unrelatedUsername = `i6_r5_u0_${suffix}`;
  const unrelatedCreated = await req(tenantBAdmin.token, 'POST', '/system/user', {
    username: unrelatedUsername,
    realName: 'I6 R5 unrelated user',
    status: 0,
    sex: 0,
    roleIds: [],
    plainPassword: 'admin123',
  });
  if (unrelatedCreated.status !== 200 || unrelatedCreated.body.code !== 0) {
    throw new Error(`unrelated user create failed: ${JSON.stringify(unrelatedCreated.body)}`);
  }
  const unrelated = await challengeLogin(unrelatedUsername);

  const created = await req(initiator.token, 'POST', '/workflow/defs', {
    name: `I6 R5 role chain ${suffix}`,
    formKey: 'i6g1a_form_t100b',
  });
  if (created.status !== 200 || created.body.code !== 0) throw new Error(`definition create failed: ${JSON.stringify(created.body)}`);
  const defId = created.body.data.defId;
  const graph = {
    graphKey: null,
    name: `I6 R5 role chain ${suffix}`,
    formKey: 'i6g1a_form_t100b',
    version: null,
    contractVersion: 1,
    elements: [
      { id: 'n_start', kind: 'node', type: 'START', config: {} },
      { id: 'n_approve_1', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: ['10002'] } } },
      { id: 'n_approve_2', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: [String(approver2Id)] } } },
      { id: 'n_copy', kind: 'node', type: 'COPY', config: { participant: { strategy: 'FIXED_USER', value: ['10003'] }, blockOnFailure: false } },
      { id: 'n_end', kind: 'node', type: 'END', config: {} },
      { id: 'e1', kind: 'edge', source: 'n_start', target: 'n_approve_1' },
      { id: 'e2', kind: 'edge', source: 'n_approve_1', target: 'n_approve_2' },
      { id: 'e3', kind: 'edge', source: 'n_approve_2', target: 'n_copy' },
      { id: 'e4', kind: 'edge', source: 'n_copy', target: 'n_end' },
    ],
  };
  const saved = await req(initiator.token, 'PUT', `/workflow/defs/${defId}/graph`, graph);
  const validated = await req(initiator.token, 'POST', `/workflow/defs/${defId}/validate`);
  const published = await req(initiator.token, 'POST', `/workflow/defs/${defId}/publish`);
  if (saved.body.code !== 0 || validated.body.code !== 0 || published.body.code !== 0) {
    throw new Error(`definition publish failed: ${JSON.stringify({ saved: saved.body, validated: validated.body, published: published.body })}`);
  }
  const processDefKey = published.body.data.processKey;

  const draft = await req(initiator.token, 'POST', '/workflow/drafts', {
    formKey: 'i6g1a_form_t100b',
    title: `I6 R5 role chain run ${suffix}`,
    payload: { amount: 27, reason: 'i6-05-r5-role-chain' },
  });
  const submit = await req(initiator.token, 'POST', `/workflow/drafts/${draft.body.data.id}/submit`);
  const submitFinal = await waitCommand(initiator.token, submit.body.data.commandId);
  const businessKey = JSON.parse(submitFinal.result || '{}').recordId;
  const task1 = await waitTask(approver1.token, businessKey);
  const approve1 = await req(approver1.token, 'POST', `/workflow/commands/tasks/${task1.taskId}/APPROVE`, { comment: 'i6-05-r5-approver-1' });
  const approve1Final = await waitCommand(approver1.token, approve1.body.data.commandId);
  const task2 = await waitTask(approver2.token, businessKey);
  const task2AsPrincipalBefore = await req(approver2.token, 'GET', `/workflow/tasks/${task2.taskId}`);
  const u0Before = await req(unrelated.token, 'GET', '/notify/inbox?pageNum=1&pageSize=50');
  const u0Instance = await req(unrelated.token, 'GET', `/workflow/instances/${task2.processInstanceId}`);
  const u0Task = await req(unrelated.token, 'GET', `/workflow/tasks/${task2.taskId}`);
  const u0Command = await req(unrelated.token, 'POST', `/workflow/commands/tasks/${task2.taskId}/APPROVE`, { comment: 'i6-05-r5-unrelated-attempt' });
  const u0CommandFinal = u0Command.body && u0Command.body.data && u0Command.body.data.commandId
    ? await waitCommand(unrelated.token, u0Command.body.data.commandId)
    : null;
  const delegated = await req(approver2.token, 'POST', `/workflow/tasks/${task2.taskId}/delegate`, { comment: 'i6-05-r5-delegate', targetUserId: String(proxyId) });
  if (delegated.status !== 200 || delegated.body.code !== 0) throw new Error(`delegate failed: ${JSON.stringify(delegated.body)}`);
  await sleep(700);
  const task2AfterDelegate = await waitTask(proxy.token, businessKey);
  const task2AsPrincipalAfter = await req(approver2.token, 'GET', `/workflow/tasks/${task2.taskId}`);
  const task2AsProxy = await req(proxy.token, 'GET', `/workflow/tasks/${task2AfterDelegate.taskId}`);
  const approve2 = await req(proxy.token, 'POST', `/workflow/commands/tasks/${task2AfterDelegate.taskId}/APPROVE`, { comment: 'i6-05-r5-proxy-approve' });
  const approve2Final = await waitCommand(proxy.token, approve2.body.data.commandId);
  await sleep(2200);

  const instance = await req(initiator.token, 'GET', `/workflow/instances/${task2AfterDelegate.processInstanceId}`);
  const copies = await req(copy.token, 'GET', '/workflow/my/copies?pageNum=1&pageSize=50');
  const inbox1 = await req(initiator.token, 'GET', '/notify/inbox?pageNum=1&pageSize=50');
  const inbox2 = await req(approver1.token, 'GET', '/notify/inbox?pageNum=1&pageSize=50');
  const inboxApprover2 = await req(approver2.token, 'GET', '/notify/inbox?pageNum=1&pageSize=50');
  const inboxProxy = await req(proxy.token, 'GET', '/notify/inbox?pageNum=1&pageSize=50');
  const inboxCopy = await req(copy.token, 'GET', '/notify/inbox?pageNum=1&pageSize=50');
  const copyMessage = records(inboxCopy).find(item => String(item.linkId) === String(task2AfterDelegate.processInstanceId));
  const u0Link = await req(unrelated.token, 'POST', `/notify/inbox/${copyMessage ? copyMessage.id : 0}/link`);
  const u0After = await req(unrelated.token, 'GET', '/notify/inbox?pageNum=1&pageSize=50');
  const relatedLinks = new Set([String(task1.taskId), String(task2.taskId), String(task2AfterDelegate.taskId), String(task2AfterDelegate.processInstanceId)]);

  console.log(JSON.stringify({
    setup: {
      tenantId: initiator.tenantId,
      defId,
      processDefKey,
      authorizeRuleId: null,
      users: { initiator: '10001', approver1: '10002', approver2: String(approver2Id), proxy: String(proxyId), copy: '10003', unrelated: String(unrelatedCreated.body.data) },
    },
    process: {
      processInstanceId: task2AfterDelegate.processInstanceId,
      businessKey,
      task1: { taskId: task1.taskId, assignee: task1.assignee, action: resultOf(approve1), final: { status: approve1Final.status } },
      task2: { taskId: task2AfterDelegate.taskId, principalReadBeforeDelegate: { status: task2AsPrincipalBefore.status, code: task2AsPrincipalBefore.body && task2AsPrincipalBefore.body.code }, delegate: resultOf(delegated), principalReadAfterDelegate: { status: task2AsPrincipalAfter.status, code: task2AsPrincipalAfter.body && task2AsPrincipalAfter.body.code }, proxyRead: { status: task2AsProxy.status, code: task2AsProxy.body && task2AsProxy.body.code }, assigneeBeforeDelegate: task2.assignee, assigneeAfterDelegate: task2AfterDelegate.assignee, action: resultOf(approve2), final: { status: approve2Final.status } },
      instance: { status: instance.status, code: instance.body && instance.body.code, state: instance.body && instance.body.data && instance.body.data.status, traceCount: instance.body && instance.body.data && Array.isArray(instance.body.data.flowTrace) ? instance.body.data.flowTrace.length : null },
    },
    rolePages: {
      initiatorInstance: { status: instance.status, code: instance.body && instance.body.code },
      proxyTodoAfterApproval: { status: (await req(proxy.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=50')).status, count: records(await req(proxy.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=50')).length },
      copyRows: { status: copies.status, matching: records(copies).filter(x => x.processInstanceId === task2AfterDelegate.processInstanceId).map(x => ({ id: x.id, processInstanceId: x.processInstanceId, nodeKey: x.nodeKey })) },
    },
    notifications: {
      initiator: compactMessages(inbox1, relatedLinks),
      approver1: compactMessages(inbox2, relatedLinks),
      approver2: compactMessages(inboxApprover2, relatedLinks),
      proxy: compactMessages(inboxProxy, relatedLinks),
      copy: compactMessages(inboxCopy, relatedLinks),
    },
    unrelated: {
      inboxBefore: { status: u0Before.status, code: u0Before.body && u0Before.body.code, total: u0Before.body && u0Before.body.data && u0Before.body.data.total },
      instance: { status: u0Instance.status, code: u0Instance.body && u0Instance.body.code },
      deepLinkWithoutOwnership: { status: u0Link.status, code: u0Link.body && u0Link.body.code },
      taskDetail: { status: u0Task.status, code: u0Task.body && u0Task.body.code },
      approveAttempt: { httpStatus: u0Command.status, code: u0Command.body && u0Command.body.code, finalStatus: u0CommandFinal && u0CommandFinal.status },
      inboxAfter: { status: u0After.status, code: u0After.body && u0After.body.code, total: u0After.body && u0After.body.data && u0After.body.data.total },
      noSideEffect: JSON.stringify(u0Before.body && u0Before.body.data && u0Before.body.data.total) === JSON.stringify(u0After.body && u0After.body.data && u0After.body.data.total),
    },
  }));
})().catch(error => {
  console.error(error && error.stack ? error.stack : error.message);
  process.exit(1);
});
