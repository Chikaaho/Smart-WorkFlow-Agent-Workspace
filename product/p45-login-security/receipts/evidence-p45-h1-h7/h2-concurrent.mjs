// H2：同一挑战 8 路并发提交；凭据全部由环境注入，脚本只输出状态/计数。
// 用法：P45_BASE_URL=... P45_USERNAME=... P45_PASSWORD=... P45_CAPTCHA=... node h2-concurrent.mjs
import crypto from 'node:crypto'

const required = ['P45_BASE_URL', 'P45_USERNAME', 'P45_PASSWORD', 'P45_CAPTCHA']
for (const name of required) if (!process.env[name]) throw new Error(`missing ${name}`)
const base = process.env.P45_BASE_URL.replace(/\/$/, '')
const b64 = (value) => Uint8Array.from(Buffer.from(value, 'base64'))
const unb64 = (value) => Buffer.from(value).toString('base64')
const challengeResponse = await fetch(base + '/auth/challenge')
const challenge = (await challengeResponse.json()).data
const publicKey = await crypto.webcrypto.subtle.importKey('spki', b64(challenge.publicKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
const ciphertext = unb64(new Uint8Array(await crypto.webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, new TextEncoder().encode(process.env.P45_PASSWORD))))
const body = JSON.stringify({ username: process.env.P45_USERNAME, pwdCipherField: ciphertext, captcha: process.env.P45_CAPTCHA, captchaId: challenge.captchaId, timestamp: String(Date.now()) })
const results = await Promise.all(Array.from({ length: 8 }, () => fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).then(async (response) => {
  const payload = await response.json()
  return { status: response.status, code: payload.code, setCookie: response.headers.has('set-cookie') ? 1 : 0, accessToken: payload.data?.accessToken ? 1 : 0 }
})))
const successes = results.filter((result) => result.code === 0)
console.log('per_request=' + JSON.stringify(results))
console.log('success=' + successes.length + ' with_set_cookie=' + successes.reduce((sum, result) => sum + result.setCookie, 0) + ' with_access_token=' + successes.reduce((sum, result) => sum + result.accessToken, 0) + ' rejected_2101=' + results.filter((result) => result.code === 2101).length + ' rejected_without_auth_material=' + results.filter((result) => result.code !== 0 && result.setCookie === 0 && result.accessToken === 0).length)
