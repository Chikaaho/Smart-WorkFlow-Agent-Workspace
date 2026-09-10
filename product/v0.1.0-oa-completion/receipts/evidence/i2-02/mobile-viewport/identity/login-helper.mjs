// 登录辅助：challenge → RSA-OAEP(SHA-256) 加密密码 → login → 输出 accessToken
// 用法: node login-helper.mjs <username> <password>
import crypto from 'node:crypto'

const [, , username, password] = process.argv
const B = 'http://localhost:8080/api'

const challenge = await (await fetch(`${B}/auth/challenge`)).json()
if (challenge.code !== 0) throw new Error('challenge failed: ' + JSON.stringify(challenge))
const { captcha, captchaId, publicKey, keyVersion } = challenge.data

const spki = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`
const encrypted = crypto.publicEncrypt({
  key: spki,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256',
}, Buffer.from(password, 'utf8')).toString('base64')

const res = await (await fetch(`${B}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username,
    password: encrypted,
    captcha,
    captchaId,
    keyVersion,
    timestamp: Date.now(),
  }),
})).json()

if (res.code !== 0 || !res.data?.accessToken) {
  console.error(JSON.stringify(res))
  process.exit(1)
}
console.log(res.data.accessToken)
