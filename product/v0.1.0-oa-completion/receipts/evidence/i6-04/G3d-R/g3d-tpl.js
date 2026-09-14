// G3d-R 补充：模板同名隔离（正确的 name 字段）
const { challengeLogin, req } = require('../object-setup/harness.js');
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }

async function main() {
  const u1t1 = await challengeLogin('u1_100');
  const u1t2 = await challengeLogin('u1_200');
  const t1tpl = await req(u1t1.token, 'POST', '/notify/templates', {
    templateCode: 'I6G3D_TPL', name: '同名隔离模板', titleTemplate: 'T100 标题 {{k}}',
    contentTemplate: 'T100 内容 {{k}}', eventType: 'TODO_CREATED', channel: 'IN_APP', variablesAllowed: 'k:TEXT',
  });
  log('T100 tpl create ->', JSON.stringify(t1tpl.body).slice(0, 300));
  const t2tpl = await req(u1t2.token, 'POST', '/notify/templates', {
    templateCode: 'I6G3D_TPL', name: '同名隔离模板', titleTemplate: 'T200 标题 {{k}}',
    contentTemplate: 'T200 内容 {{k}}', eventType: 'TODO_CREATED', channel: 'IN_APP', variablesAllowed: 'k:TEXT',
  });
  log('T200 same-code tpl create ->', JSON.stringify(t2tpl.body).slice(0, 300));
  const id2 = t2tpl.body.data && (t2tpl.body.data.id || t2tpl.body.data);
  const crossDetail = await req(u1t1.token, 'GET', `/notify/templates/${id2}`);
  log('cross-tenant tpl detail ->', crossDetail.status, JSON.stringify(crossDetail.body).slice(0, 250));
  const ownDetail = await req(u1t2.token, 'GET', `/notify/templates/${id2}`);
  log('own tpl detail ->', ownDetail.status, JSON.stringify(ownDetail.body).slice(0, 250));
  console.log('DONE');
}
main().catch(e => { log('FATAL', e.message); process.exit(1); });
