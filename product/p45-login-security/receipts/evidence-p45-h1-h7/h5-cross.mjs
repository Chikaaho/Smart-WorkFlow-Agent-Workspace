// H5：交叉挑战/凭据使用；凭据全部由环境注入，脚本不回显 token、Cookie 或验证码。
// 结果身份需由外部只读数据库查询按 user_id/tenant_id 计数对账。
import crypto from 'node:crypto'

for (const name of ['P45_BASE_URL', 'P45_USERNAME_A', 'P45_PASSWORD_A', 'P45_USERNAME_B', 'P45_PASSWORD_B', 'P45_CAPTCHA_A', 'P45_CAPTCHA_B', 'P45_CAPTCHA_C', 'P45_CAPTCHA_D']) {
  if (!process.env[name]) throw new Error(`missing ${name}`)
}
const base = process.env.P45_BASE_URL.replace(/\/$/, '')
const b64 = (value) => Uint8Array.from(Buffer.from(value, 'base64'))
const unb64 = (value) => Buffer.from(value).toString('base64')
async function challenge() { return (await (await fetch(base + '/auth/challenge')).json()).data }
async function login(username, password, challengeData, captcha) {
  const publicKey = await crypto.webcrypto.subtle.importKey('spki', b64(challengeData.publicKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
  const ciphertext = unb64(new Uint8Array(await crypto.webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, new TextEncoder().encode(password))))
  const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, pwdCipherField: ciphertext, captcha, captchaId: challengeData.captchaId, timestamp: String(Date.now()) }) })
  const payload = await response.json()
  return { status: response.status, code: payload.code, hasAccessToken: payload.data?.accessToken ? 1 : 0, hasSetCookie: response.headers.has('set-cookie') ? 1 : 0 }
}
const [challengeA, challengeB, crossChallengeA, crossChallengeB] = await Promise.all([challenge(), challenge(), challenge(), challenge()])
const normalA = await login(process.env.P45_USERNAME_A, process.env.P45_PASSWORD_A, challengeA, process.env.P45_CAPTCHA_A)
const normalB = await login(process.env.P45_USERNAME_B, process.env.P45_PASSWORD_B, challengeB, process.env.P45_CAPTCHA_B)
const crossA = await login(process.env.P45_USERNAME_A, process.env.P45_PASSWORD_A, crossChallengeA, process.env.P45_CAPTCHA_C)
const crossB = await login(process.env.P45_USERNAME_B, process.env.P45_PASSWORD_B, crossChallengeB, process.env.P45_CAPTCHA_D)
console.log(JSON.stringify({ normalA, normalB, crossA, crossB, answerFieldsRedacted: true, authFieldsRedacted: true, cookieOutput: false }))
