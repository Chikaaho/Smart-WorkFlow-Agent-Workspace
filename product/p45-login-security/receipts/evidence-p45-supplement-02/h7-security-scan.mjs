// H7：仅扫描证据目录中的通用敏感值形态；不把任何真实凭据写入扫描表达式。
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2]
if (!root) throw new Error('usage: node h7-security-scan.mjs <evidence-directory>')
const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else files.push(path)
  }
}
walk(root)
const rules = [
  ['private-key-marker', /BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY/i],
  ['bearer-material', /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/i],
  ['token-json-value', /"(?:accessToken|refreshToken)"\s*:\s*"(?!<REDACTED>)[^"]+/i],
  ['hardcoded-secret-assignment', /(?:PASSWORD|PASS|TOKEN|CAPTCHA|SECRET)\s*[:=]\s*['"][^$<{\n]+['"]/i],
]
const findings = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const [name, rule] of rules) if (rule.test(text)) findings.push({ rule: name, file: file.slice(root.length + 1) })
}
console.log(JSON.stringify({ filesScanned: files.length, findings, verdict: findings.length === 0 ? 'PASS' : 'BLOCKED' }))
if (findings.length) process.exitCode = 2
