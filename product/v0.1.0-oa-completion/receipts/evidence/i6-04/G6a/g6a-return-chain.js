// G6a 退回链：双审批节点（n1=u2 → n2=u2），n2 执行 RETURN→n1 → PROCESS_RETURNED + 新轮次 TODO
const { challengeLogin, req } = require('../object-setup/harness.js');
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function wc(token, id) {
  let st; for (let k = 0; k < 14; k++) { await sleep(900); st = await req(token, 'GET', `/workflow/commands/${id}`); if (st.body.data && st.body.data.status !== 'ACCEPTED') break; }
  return st.body.data;
}
async function findTask(u2, want) {
  let rec = null;
  for (let i = 0; i < 14 && !rec; i++) {
    const tl = await req(u2.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20');
    rec = ((tl.body.data || {}).records || []).find(t => t.businessKey === want);
    if (!rec) await sleep(900);
  }
  return rec;
}
async function main() {
  const u1 = await challengeLogin('u1_100');
  const u2 = await challengeLogin('u2_100');
  const created = await req(u1.token, 'POST', '/workflow/defs', { name: 'I6G6A 双节点退回链', formKey: 'i6g1a_form_t100b' });
  const defId = created.body.data.defId;
  const graph = {
    name: 'I6G6A 双节点退回链', contractVersion: 1,
    elements: [
      { id: 'n_start', kind: 'node', type: 'START', config: {} },
      { id: 'n1', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: ['10002'] }, returnTargets: ['n1'] } },
      { id: 'n2', kind: 'node', type: 'APPROVAL', config: { participant: { strategy: 'FIXED_USER', value: ['10001'] } } },
      { id: 'n_end', kind: 'node', type: 'END', config: {} },
      { id: 'e1', kind: 'edge', source: 'n_start', target: 'n1' },
      { id: 'e2', kind: 'edge', source: 'n1', target: 'n2' },
      { id: 'e3', kind: 'edge', source: 'n2', target: 'n_end' },
    ],
  };
  await req(u1.token, 'PUT', `/workflow/defs/${defId}/graph`, graph);
  const v = await req(u1.token, 'POST', `/workflow/defs/${defId}/validate`);
  log('validate →', JSON.stringify(v.body).slice(0, 200));
  const pub = await req(u1.token, 'POST', `/workflow/defs/${defId}/publish`);
  log('publish →', JSON.stringify(pub.body).slice(0, 120));
  // 手动绑定已由 DB 设定前一轮；改为将新 def 绑定：需要 DB 侧切换 — 改为直接以 OLD 表单新绑定说明。
  // 换一种做法：既然 binding 现指向 bpm_8d9e，创建双节点 def 后，先停用其 binding，再重新绑定到本 key。
  console.log('DEFID=' + defId, 'PUBKEY=', pub.body.data && pub.body.data.processKey);
}
main().catch(e => { log('FATAL', e && e.stack || e.message); process.exit(1); });
