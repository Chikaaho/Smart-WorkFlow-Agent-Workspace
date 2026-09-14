// G6a 时限提醒：deadline 节点（dueMinutes=1）→ 调度器真实扫描触发 TASK_DEADLINE_ALERT
const { challengeLogin, req } = require('../object-setup/harness.js');
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function wc(token, id) {
  let st; for (let k = 0; k < 14; k++) { await sleep(900); st = await req(token, 'GET', `/workflow/commands/${id}`); if (st.body.data && st.body.data.status !== 'ACCEPTED') break; }
  return st.body.data;
}
async function main() {
  const u1 = await challengeLogin('u1_100');
  const created = await req(u1.token, 'POST', '/workflow/defs', { name: 'I6G6A 时限提醒链', formKey: 'i6g1a_form_t100b' });
  const defId = created.body.data.defId;
  const graph = {
    name: 'I6G6A 时限提醒链', contractVersion: 1,
    elements: [
      { id: 'n_start', kind: 'node', type: 'START', config: {} },
      { id: 'n1', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: ['10002'] }, deadline: { dueMinutes: 1 } } },
      { id: 'n_end', kind: 'node', type: 'END', config: {} },
      { id: 'e1', kind: 'edge', source: 'n_start', target: 'n1' },
      { id: 'e2', kind: 'edge', source: 'n1', target: 'n_end' },
    ],
  };
  await req(u1.token, 'PUT', `/workflow/defs/${defId}/graph`, graph);
  const v = await req(u1.token, 'POST', `/workflow/defs/${defId}/validate`);
  log('validate →', JSON.stringify(v.body));
  const pub = await req(u1.token, 'POST', `/workflow/defs/${defId}/publish`);
  log('publish →', JSON.stringify(pub.body).slice(0, 100), 'key=', pub.body.data && pub.body.data.processKey);
}
main().catch(e => { log('FATAL', e.message); process.exit(1); });
