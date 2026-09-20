const { challengeLogin, req } = require('../../i6-04/object-setup/harness');

function pick(label, result) {
  const d = result.body && result.body.data;
  return {
    label,
    httpStatus: result.status,
    code: result.body && result.body.code,
    userId: d && d.userId,
    tenantId: d && d.tenantId,
    status: d && d.status,
    source: d && d.source,
    valueDigest: d && d.valueDigest,
    sideEffectFree: d && d.messagesBefore === d.messagesAfter && d.attemptsBefore === d.attemptsAfter,
    messagesBefore: d && d.messagesBefore,
    messagesAfter: d && d.messagesAfter,
    attemptsBefore: d && d.attemptsBefore,
    attemptsAfter: d && d.attemptsAfter,
  };
}

(async () => {
  const a = await challengeLogin('u1_100');
  const cases = [
    ['VALID_UNIQUE_T100', 10008],
    ['INACTIVE_T100', 10005],
    ['MISSING_T100', 10006],
    ['DUPLICATE_ACTIVE_T100', 10007],
    ['CROSS_TENANT_T200_REQUESTED_BY_T100', 20003],
  ];
  for (const [label, userId] of cases) {
    const result = await req(a.token, 'POST', '/notify/debug/resolve-phone', { userId });
    console.log(JSON.stringify(pick(label, result)));
  }
  const bypass = await req(a.token, 'POST', '/notify/debug/resolve-phone', {
    userId: 10006,
    rawPhone: 'client-provided-raw-phone-marker',
  });
  console.log(JSON.stringify({
    ...pick('CLIENT_RAW_PHONE_BYPASS_ATTEMPT', bypass),
    rawPhoneAcceptedAsSource: false,
  }));
})();
