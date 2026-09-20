import crypto from 'node:crypto'
const BASE = 'http://127.0.0.1:8080/api'
const ch = await (await fetch(BASE + '/auth/challenge')).json()
const { captchaId, publicKey } = ch.data
const keyObj = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' })
const enc = crypto.publicEncrypt({ key: keyObj, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from('admin123', 'utf8'))
const login = await (await fetch(BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: enc.toString('base64'), captcha: '1234', captchaId, timestamp: String(Date.now()) }) })).json()
const token = login.data.accessToken
const raw = await (await fetch(BASE + '/form/def/by-key/p53ev08_mobile_form/definition', { headers: { Authorization: 'Bearer ' + token } })).text()
const json = JSON.parse(raw)
console.log(JSON.stringify({ code: json.code, dataType: typeof json.data, dataSample: String(JSON.stringify(json.data)).slice(0, 300) }, null, 2))
