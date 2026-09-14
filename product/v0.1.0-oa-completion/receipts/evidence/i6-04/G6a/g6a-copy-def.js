// G6a 抄送链：定义（审批→抄送→END）发布 → 真实提交 → u2 审批 → 抄送至 10003/10001
const { challengeLogin, req } = require('../object-setup/harness.js');
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const u1 = await challengeLogin('u1_100');
  const u2 = await challengeLogin('u2_100');

  const created = await req(u1.token, 'POST', '/workflow/defs', { name: 'I6G6A 抄送链', formKey: 'i6g1a_form_t100b' });
  log('create def →', JSON.stringify(created.body).slice(0, 300));
  if (created.body.code !== 0) throw new Error('create def failed');
  const defId = created.body.data.defId;
  const graph = {
    graphKey: null, name: 'I6G6A 抄送链', version: null, contractVersion: 1,
    elements: [
      { id: 'n_start', kind: 'node', type: 'START', config: {} },
      { id: 'n1', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: ['10002'] } } },
      { id: 'n_copy', kind: 'node', type: 'COPY', config: { participant: { strategy: 'FIXED_USER', value: ['10003', '10001'] }, title: 'I6G6A 抄送', content: '您的申请已抄送（G6a 抄送链）', blockOnFailure: false } },
      { id: 'n_end', kind: 'node', type: 'END', config: {} },
      { id: 'e1', kind: 'edge', source: 'n_start', target: 'n1' },
      { id: 'e2', kind: 'edge', type: null, source: 'n1', target: 'n_copy' },
      { id: 'e3', kind: 'edge', type: null, source: 'n_copy', target: 'n_end' },
    ],
  };
  const saved = await req(u1.token, 'PUT', `/workflow/defs/${defId}/graph`, graph);
  log('save graph →', JSON.stringify(saved.body).slice(0, 200));
  const validated = await req(u1.token, 'POST', `/workflow/defs/${defId}/validate`);
  log('validate →', JSON.stringify(validated.body).slice(0, 400));
  const published = await req(u1.token, 'POST', `/workflow/defs/${defId}/publish`);
  log('publish →', JSON.stringify(published.body).slice(0, 300));

  // 提交并审批（新 def 绑定同一表单）
  const d = await req(u1.token, 'POST', '/workflow/drafts', { formKey: 'i6g1a_form_t100b', title: 'I6G6A-COPY 链', payload: { amount: 7, reason: 'g6a-copy-chain' } });
  const s = await req(u1.token, 'POST', `/workflow/drafts/${d.body.data.id}/submit`);
  log('submit →', JSON.stringify(s.body).slice(0, 200));
  let st; do { await sleep(900); st = await req(u1.token, 'GET', `/workflow/commands/${s.body.data.commandId}`); } while (st.body.data.status === 'ACCEPTED');
  const want = (JSON.parse(st.body.data.result) || {}).recordId;
  let rec = null;
  for (let i = 0; i < 14 && !rec; i++) {
    const tl = await req(u2.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20');
    rec = ((tl.body.data || {}).records || []).find(t => t.businessKey === want);
    if (!rec) await sleep(900);
  }
  if (!rec) throw new Error('no task');
  const a = await req(u2.token, 'POST', `/workflow/commands/tasks/${rec.taskId}/APPROVE`, { comment: 'g6a-copy-approve' });
  log('approve →', JSON.stringify(a.body).slice(0, 160));
  const acmd = a.body.data.commandId;
  let at; do { await sleep(900); at = await req(u2.token, 'GET', `/workflow/commands/${acmd}`); } while (at.body.data.status === 'ACCEPTED');
  await sleep(2500);
  console.log('COPY-CHAIN DONE');
}
main().catch(e => { log('FATAL', e && e.stack || e.message); process.exit(1); });
