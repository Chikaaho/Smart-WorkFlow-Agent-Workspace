const { challengeLogin, req } = require('../../i6-04/object-setup/harness');

const ruleCode = `I6_RV1_05_${Date.now()}`;
const rule = {
  ruleCode,
  name: 'I6 R1 rule view evidence',
  eventType: 'TODO_CREATED',
  channelPriority: 'IN_APP',
  recipientRule: 'INITIATOR',
  requiredFlag: true,
  failurePolicy: 'CONTINUE',
  enabled: true,
  remark: 'i6-05 R1 evidence object',
};

function compact(label, result) {
  return {
    label,
    status: result.status,
    code: result.body && typeof result.body === 'object' ? result.body.code : undefined,
    data: result.body && typeof result.body === 'object' ? result.body.data : undefined,
  };
}

(async () => {
  const a = await challengeLogin('u1_100');
  const b = await challengeLogin('u3_100');
  console.log(JSON.stringify({
    phase: 'AUTH',
    A: { userId: a.userId, tenantId: a.tenantId },
    B: { userId: b.userId, tenantId: b.tenantId },
    fixedCaptcha: 'enabled-at-runtime',
  }));

  const aList = await req(a.token, 'GET', '/notify/rules');
  const bList = await req(b.token, 'GET', '/notify/rules');
  console.log(JSON.stringify({
    phase: 'AUTHZ',
    A_list: { status: aList.status, code: aList.body && aList.body.code },
    B_list: { status: bList.status, code: bList.body && bList.body.code },
  }));

  const created = await req(a.token, 'POST', '/notify/rules', rule);
  const id = created.body && created.body.data && (created.body.data.id || created.body.data);
  console.log(JSON.stringify({ ...compact('CREATE', created), ruleCode, id }));
  if (!id) throw new Error(`create did not return id: ${JSON.stringify(created.body)}`);

  const updated = await req(a.token, 'PUT', `/notify/rules/${id}`, {
    ...rule,
    id,
    name: 'I6 R1 rule view evidence edited',
    remark: 'i6-05 R1 evidence object edited',
  });
  const updateRead = await req(a.token, 'GET', `/notify/rules/${id}`);
  console.log(JSON.stringify({ ...compact('UPDATE', updated), read: compact('UPDATE_READ', updateRead) }));

  const disabled = await req(a.token, 'POST', `/notify/rules/${id}/enabled/false`);
  const disabledRead = await req(a.token, 'GET', `/notify/rules/${id}`);
  const enabled = await req(a.token, 'POST', `/notify/rules/${id}/enabled/true`);
  const enabledRead = await req(a.token, 'GET', `/notify/rules/${id}`);
  console.log(JSON.stringify({
    phase: 'TOGGLE',
    disabled: compact('TOGGLE_OFF', disabled),
    disabledRead: compact('TOGGLE_OFF_READ', disabledRead),
    enabled: compact('TOGGLE_ON', enabled),
    enabledRead: compact('TOGGLE_ON_READ', enabledRead),
  }));

  const negatives = {};
  for (const [label, method, path, body] of [
    ['B_GET', 'GET', `/notify/rules/${id}`],
    ['B_UPDATE', 'PUT', `/notify/rules/${id}`, { ...rule, id, name: 'forbidden' }],
    ['B_TOGGLE', 'POST', `/notify/rules/${id}/enabled/false`],
    ['B_DELETE', 'DELETE', `/notify/rules/${id}`],
  ]) negatives[label] = compact(label, await req(b.token, method, path, body));
  console.log(JSON.stringify({ phase: 'NEGATIVE', negatives }));

  const deleted = await req(a.token, 'DELETE', `/notify/rules/${id}`);
  const readAfterDelete = await req(a.token, 'GET', `/notify/rules/${id}`);
  const listAfterDelete = await req(a.token, 'GET', '/notify/rules');
  const listData = listAfterDelete.body && listAfterDelete.body.data;
  const listText = JSON.stringify(listData || '');
  console.log(JSON.stringify({
    phase: 'DELETE',
    deleted: compact('DELETE', deleted),
    readAfterDelete: compact('DELETE_READ', readAfterDelete),
    listAfterDelete: {
      status: listAfterDelete.status,
      code: listAfterDelete.body && listAfterDelete.body.code,
      deletedIdAbsent: !listText.includes(String(id)),
    },
    object: { ruleCode, id },
  }));
})();
