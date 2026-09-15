const { challengeLogin, req } = require('../../../i6-04/object-setup/harness');

// Setup-only helper. The formal instance submission and every task action are
// performed later through the visible in-app browser; this file only prepares
// deterministic definition/user fixtures and emits sanitized identifiers.
const suffix = Date.now();
const name = `I6 R5 visible role flow ${suffix}`;
const secondApproverId = '2099538680159641602';
const proxyId = '2099538680528740353';

function ok(response, label) {
  if (response.status !== 200 || response.body?.code !== 0) {
    throw new Error(`${label} failed: ${JSON.stringify(response.body)}`);
  }
}

(async () => {
  const admin = await challengeLogin('u1_100');
  const tenantBAdmin = await challengeLogin('u1_200');
  const unrelatedUsername = `i6_r5_u0_visible_${suffix}`;
  const unrelated = await req(tenantBAdmin.token, 'POST', '/system/user', {
    username: unrelatedUsername,
    realName: 'I6 R5 visible unrelated user',
    status: 0,
    sex: 0,
    roleIds: [],
    plainPassword: 'admin123',
  });
  ok(unrelated, 'unrelated user create');

  const created = await req(admin.token, 'POST', '/workflow/defs', {
    name,
    formKey: 'i6g1a_form_t100b',
  });
  ok(created, 'definition create');
  const defId = String(created.body.data.defId);
  const graph = {
    graphKey: null,
    name,
    formKey: 'i6g1a_form_t100b',
    version: null,
    contractVersion: 1,
    elements: [
      { id: 'n_start', kind: 'node', type: 'START', config: {} },
      { id: 'n_approve_1', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: ['10002'] } } },
      { id: 'n_approve_2', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: [secondApproverId] } } },
      { id: 'n_copy', kind: 'node', type: 'COPY', config: { participant: { strategy: 'FIXED_USER', value: ['10003'] }, blockOnFailure: false } },
      { id: 'n_end', kind: 'node', type: 'END', config: {} },
      { id: 'e1', kind: 'edge', source: 'n_start', target: 'n_approve_1' },
      { id: 'e2', kind: 'edge', source: 'n_approve_1', target: 'n_approve_2' },
      { id: 'e3', kind: 'edge', source: 'n_approve_2', target: 'n_copy' },
      { id: 'e4', kind: 'edge', source: 'n_copy', target: 'n_end' },
    ],
  };
  const saved = await req(admin.token, 'PUT', `/workflow/defs/${defId}/graph`, graph);
  ok(saved, 'graph save');
  const validated = await req(admin.token, 'POST', `/workflow/defs/${defId}/validate`);
  ok(validated, 'graph validate');
  const published = await req(admin.token, 'POST', `/workflow/defs/${defId}/publish`);
  ok(published, 'definition publish');

  console.log(JSON.stringify({
    setup: {
      name,
      tenantId: admin.tenantId,
      defId,
      processKey: published.body.data.processKey,
      formKey: 'i6g1a_form_t100b',
      users: {
        initiator: '10001',
        approver1: '10002',
        approver2: secondApproverId,
        proxy: proxyId,
        copy: '10003',
        unrelatedUsername,
        unrelatedUserId: String(unrelated.body.data),
      },
      visibleActionsRequired: ['submit', 'approve-1', 'delegate-2', 'proxy-approve-2', 'copy-read', 'admin-trace', 'unrelated-deny'],
    },
    result: { create: created.status, save: saved.status, validate: validated.status, publish: published.status },
  }, null, 2));
})().catch((error) => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
