import crypto from 'node:crypto'
const BASE = 'http://127.0.0.1:8080/api'
const ch = await (await fetch(BASE + '/auth/challenge')).json()
const { captchaId, publicKey } = ch.data
const keyObj = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' })
const enc = crypto.publicEncrypt({ key: keyObj, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from('admin123', 'utf8'))
const login = await (await fetch(BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: enc.toString('base64'), captcha: '1234', captchaId, timestamp: String(Date.now()) }) })).json()
const token = login.data.accessToken
const req = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: r.status, body: await r.json().catch(() => null) }
}
const formKey = 'p53ev08_mobile_form'
const existing = await req('GET', '/form/def/by-key/' + formKey + '/definition')
if (existing.status === 200 && existing.body.code === 0 && existing.body.data) { console.log(JSON.stringify({ reused: formKey })) }
else {
  const created = await req('POST', '/form/def', { formKey, name: 'P53EV08 移动表单验收' })
  if (created.status !== 200 && created.body.code !== 0) throw new Error('create failed: ' + JSON.stringify(created))
  const defId = created.body.data.id
  const definition = {
    title: 'P53EV08 移动表单验收',
    description: '提示08 R1a 真实可达移动表单对象（替代已销毁 p61r10_batch_form）',
    fields: [
      { name: 'apply_item', type: 'TEXT', label: '申请事项', required: true, colSpan: 24, placeholder: '请输入申请事项' },
      { name: 'apply_amount', type: 'NUMBER', label: '申请金额', colSpan: 24 },
      { name: 'apply_date', type: 'DATE', label: '申请日期', colSpan: 24 },
      { name: 'apply_note', type: 'TEXT', label: '备注', colSpan: 24, placeholder: '选填' },
    ],
  }
  const saved = await req('POST', '/form/def/' + defId + '/config', { definition: JSON.stringify(definition) })
  if (saved.body.code !== 0) throw new Error('config failed: ' + JSON.stringify(saved))
  const published = await req('POST', '/form/def/' + defId + '/publish')
  if (published.body.code !== 0) throw new Error('publish failed: ' + JSON.stringify(published))
  console.log(JSON.stringify({ created: formKey, defId, published: published.body }, null, 2))
}
const verify = await req('GET', '/form/def/by-key/' + formKey + '/definition')
console.log(JSON.stringify({ verifyStatus: verify.status, code: verify.body.code, hasSchema: Boolean(verify.body.data) }, null, 2))
