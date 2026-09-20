import crypto from 'node:crypto'
const BASE = 'http://127.0.0.1:8080/api'
const ch = await (await fetch(BASE + '/auth/challenge')).json()
const { captchaId, publicKey } = ch.data
const keyObj = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' })
const enc = crypto.publicEncrypt({ key: keyObj, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from('admin123', 'utf8'))
const resp = await fetch(BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: enc.toString('base64'), captcha: '1234', captchaId, timestamp: String(Date.now()) }) })
const json = await resp.json()
const token = json.data.accessToken
const page = await (await fetch(BASE + '/form/def/page?pageNum=1&pageSize=20', { headers: { Authorization: 'Bearer ' + token } })).json()
const records = (page.data && page.data.records) || page.data || []
const rows = (Array.isArray(records) ? records : []).map((r) => ({ id: r.id, formKey: r.formKey, title: r.title, status: r.status }))
console.log(JSON.stringify({ code: page.code, total: page.data && page.data.total, rows }, null, 2))
