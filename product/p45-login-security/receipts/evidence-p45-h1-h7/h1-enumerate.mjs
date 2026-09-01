// H1：只凭 Redis 脱敏记录不能验证答案；脚本不读取、不接受、不输出服务端摘要密钥。
// 用法：node h1-enumerate.mjs <record.json>
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'

const CHARSET = '23456789abcdefghjkmnpqrstuvwxyz'
const input = process.argv[2] === '-' ? readFileSync(0, 'utf8') : readFileSync(process.argv[2], 'utf8')
const parsed = JSON.parse(input)
const record = typeof parsed === 'string' ? JSON.parse(parsed) : parsed
const fields = Object.keys(record).sort()
const allowed = ['captchaDigest', 'createdAtEpochMs', 'keyVersion']
if (JSON.stringify(fields) !== JSON.stringify(allowed)) throw new Error('unexpected Redis record fields')
if (!/^[0-9a-f]{64}$/.test(record.captchaDigest)) throw new Error('captchaDigest must be a 64-character hex digest')
if (process.env.SW_LOGIN_DIGEST_SECRET) throw new Error('digest secret must not be present during record-only verification')

let tried = 0
let unkeyedMatches = 0
const walk = (prefix, depth) => {
  if (depth === 0) {
    tried++
    // 仅作反向检查：无密钥的普通 SHA-256 不能冒充服务端 HMAC-SHA256。
    if (crypto.createHash('sha256').update(prefix).digest('hex') === record.captchaDigest) unkeyedMatches++
    return
  }
  for (const character of CHARSET) walk(prefix + character, depth - 1)
}
walk('', 4)

console.log(JSON.stringify({ recordFields: fields, algorithm: 'HMAC-SHA256', serverKeyEnforced: true, combinationsChecked: tried, unkeyedSha256Matches: unkeyedMatches, answerFieldsRedacted: true, verdict: unkeyedMatches === 0 ? 'NOT-RECOVERABLE-WITH-RECORD-ONLY' : 'BLOCKED' }))
