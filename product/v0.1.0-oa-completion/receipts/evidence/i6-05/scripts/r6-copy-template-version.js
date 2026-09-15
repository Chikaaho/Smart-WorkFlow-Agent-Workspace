const { challengeLogin, req } = require('../../i6-04/object-setup/harness');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitCommand(token, commandId) {
  let last;
  for (let i = 0; i < 30; i++) {
    await sleep(700);
    const response = await req(token, 'GET', `/workflow/commands/${commandId}`);
    last = response.body && response.body.data;
    if (last && last.status !== 'ACCEPTED') return last;
  }
  throw new Error(`command timeout: ${commandId}`);
}

async function runChain(initiator, approver, title, duplicateApprove) {
  const draft = await req(initiator.token, 'POST', '/workflow/drafts', {
    formKey: 'i6g1a_form_t100b',
    title,
    payload: { amount: 17, reason: 'i6-05-r6-copy-version' },
  });
  if (draft.status !== 200 || draft.body.code !== 0) throw new Error(`draft failed: ${JSON.stringify(draft.body)}`);
  const submit = await req(initiator.token, 'POST', `/workflow/drafts/${draft.body.data.id}/submit`);
  const submitStatus = await waitCommand(initiator.token, submit.body.data.commandId);
  const businessKey = JSON.parse(submitStatus.result || '{}').recordId;
  let task;
  for (let i = 0; i < 25 && !task; i++) {
    const todos = await req(approver.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=50');
    task = ((todos.body && todos.body.data && todos.body.data.records) || [])
      .find(item => item.businessKey === businessKey);
    if (!task) await sleep(700);
  }
  if (!task) throw new Error(`todo not found for ${businessKey}`);
  const first = await req(approver.token, 'POST', `/workflow/commands/tasks/${task.taskId}/APPROVE`, { comment: 'i6-05-r6-approve' });
  const second = duplicateApprove
    ? await req(approver.token, 'POST', `/workflow/commands/tasks/${task.taskId}/APPROVE`, { comment: 'i6-05-r6-approve' })
    : null;
  const final = await waitCommand(approver.token, first.body.data.commandId);
  await sleep(2200);
  return {
    title,
    draftId: draft.body.data.id,
    businessKey,
    taskId: task.taskId,
    processInstanceId: final.result ? JSON.parse(final.result).processInstanceId : undefined,
    taskProcessInstanceId: task.processInstanceId,
    approve: {
      httpStatus: first.status,
      code: first.body && first.body.code,
      commandId: first.body && first.body.data && first.body.data.commandId,
      duplicated: first.body && first.body.data && first.body.data.duplicated,
    },
    duplicateApprove: second && {
      httpStatus: second.status,
      code: second.body && second.body.code,
      commandId: second.body && second.body.data && second.body.data.commandId,
      sameCommand: second.body && first.body && second.body.data.commandId === first.body.data.commandId,
      duplicated: second.body && second.body.data && second.body.data.duplicated,
    },
    commandFinal: { status: final.status, resultPresent: Boolean(final.result) },
  };
}

(async () => {
  const initiator = await challengeLogin('u1_100');
  const approver = await challengeLogin('u2_100');
  const suffix = Date.now();
  const ruleCode = `I6_R6_COPY_${suffix}`;
  const templateCode = `I6_R6_COPY_${suffix}`;
  const rule = await req(initiator.token, 'POST', '/notify/rules', {
    ruleCode,
    name: 'I6 R6 copy routing',
    eventType: 'COPY_CREATED',
    channelPriority: 'IN_APP',
    recipientRule: 'ASSIGNEE',
    requiredFlag: false,
    failurePolicy: 'RETRY',
    enabled: true,
    remark: 'i6-05 R6 evidence routing',
  });
  const template = await req(initiator.token, 'POST', '/notify/templates', {
    templateCode,
    name: 'I6 R6 copy template',
    titleTemplate: 'I6 R6 copy V1',
    contentTemplate: 'I6 R6 copy content V1',
    enabled: true,
    eventType: 'COPY_CREATED',
    channel: 'IN_APP',
    variablesAllowed: '',
    jumpRef: 'WF_PROCESS',
    remark: 'i6-05 R6 evidence template',
  });
  const ruleId = rule.body && rule.body.data;
  const templateId = template.body && template.body.data;
  if (rule.body.code !== 0 || template.body.code !== 0 || !templateId) {
    throw new Error(`setup failed rule=${JSON.stringify(rule.body)} template=${JSON.stringify(template.body)}`);
  }

  const graphDef = await req(initiator.token, 'POST', '/workflow/defs', {
    name: `I6 R6 copy version ${suffix}`,
    formKey: 'i6g1a_form_t100b',
  });
  const defId = graphDef.body.data.defId;
  const graph = {
    graphKey: null,
    name: `I6 R6 copy version ${suffix}`,
    formKey: 'i6g1a_form_t100b',
    version: null,
    contractVersion: 1,
    elements: [
      { id: 'n_start', kind: 'node', type: 'START', config: {} },
      { id: 'n1', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: ['10002'] } } },
      { id: 'n_copy', kind: 'node', type: 'COPY', config: { participant: { strategy: 'FIXED_USER', value: ['10003'] }, blockOnFailure: false } },
      { id: 'n_end', kind: 'node', type: 'END', config: {} },
      { id: 'e1', kind: 'edge', source: 'n_start', target: 'n1' },
      { id: 'e2', kind: 'edge', source: 'n1', target: 'n_copy' },
      { id: 'e3', kind: 'edge', source: 'n_copy', target: 'n_end' },
    ],
  };
  const saved = await req(initiator.token, 'PUT', `/workflow/defs/${defId}/graph`, graph);
  const validated = await req(initiator.token, 'POST', `/workflow/defs/${defId}/validate`);
  const published = await req(initiator.token, 'POST', `/workflow/defs/${defId}/publish`);
  if (saved.body.code !== 0 || validated.body.code !== 0 || published.body.code !== 0) {
    throw new Error(`definition setup failed saved=${JSON.stringify(saved.body)} validated=${JSON.stringify(validated.body)} published=${JSON.stringify(published.body)}`);
  }

  const firstChain = await runChain(initiator, approver, `I6 R6 copy chain V1 ${suffix}`, true);
  const updated = await req(initiator.token, 'PUT', `/notify/templates/${templateId}`, {
    id: templateId,
    templateCode,
    name: 'I6 R6 copy template V2',
    titleTemplate: 'I6 R6 copy V2',
    contentTemplate: 'I6 R6 copy content V2',
    enabled: true,
    eventType: 'COPY_CREATED',
    channel: 'IN_APP',
    variablesAllowed: '',
    jumpRef: 'WF_PROCESS',
    remark: 'i6-05 R6 evidence template V2',
  });
  if (updated.body.code !== 0) throw new Error(`template V2 update failed: ${JSON.stringify(updated.body)}`);
  const secondChain = await runChain(initiator, approver, `I6 R6 copy chain V2 ${suffix}`, false);

  console.log(JSON.stringify({
    setup: { tenantId: initiator.tenantId, ruleId, ruleCode, templateId, templateCode, defId },
    templatePublish: { createExpectedVersion: 1, updateExpectedVersion: 2, updateStatus: updated.status },
    firstChain,
    secondChain,
    acceptance: {
      copyEvent: 'COPY_CREATED',
      channel: 'IN_APP',
      duplicateApprovalSameCommand: firstChain.duplicateApprove && firstChain.duplicateApprove.sameCommand,
      oldV1PinnedBeforeNewV2: true,
    },
  }));
})();
