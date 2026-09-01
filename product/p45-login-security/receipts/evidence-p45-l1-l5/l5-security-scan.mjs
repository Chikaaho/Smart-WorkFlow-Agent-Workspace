#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.argv[2] || process.cwd()
const receipts = join(root, 'product', 'p45-login-security', 'receipts')
const self = join(receipts, 'evidence-p45-l1-l5', 'l5-security-scan.mjs')
const files = []
const textExtensions = new Set(['.md', '.json', '.txt', '.mjs', '.sh', '.yml', '.yaml'])

function walk(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (path !== self && textExtensions.has(path.slice(path.lastIndexOf('.')))) files.push(path)
  }
}

walk(receipts)

const findings = []
const placeholder = /^(?:<[^>]+>|\[REDACTED\]|REDACTED|OMITTED|NOT_SERIALIZED|undefined|null)$/i
function inspect(path) {
  let text
  try { text = readFileSync(path, 'utf8') } catch { return }
  const file = relative(root, path)
  if (/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(text)) findings.push({ file, type: 'private-key-marker' })
  if (/Bearer\s+[A-Za-z0-9._~-]{20,}/.test(text) && !/Bearer\s+<[^>]+>/.test(text)) findings.push({ file, type: 'bearer-material' })
  for (const match of text.matchAll(/["'](?:accessToken|refreshToken|token|cookie)["']\s*[:=]\s*["']([^"']+)["']/gi)) {
    if (!placeholder.test(match[1]) && !/^(?:0|1|true|false)$/.test(match[1]) && !/^process\.env\./.test(match[1]) && !/^requiredEnv\(/.test(match[1])) {
      findings.push({ file, type: 'token-or-cookie-value' }); break
    }
  }
  for (const match of text.matchAll(/(?:password|captcha)\s*["']?\s*[:=]\s*["']([^"']+)["']/gi)) {
    if (!placeholder.test(match[1]) && !/^process\.env\./.test(match[1]) && !/^requiredEnv\(/.test(match[1])) {
      findings.push({ file, type: 'credential-or-answer-value' }); break
    }
  }
}

for (const path of files) inspect(path)
const uniqueFindings = [...new Map(findings.map(item => [`${item.file}:${item.type}`, item])).values()]
const result = {
  filesScanned: files.length,
  evidenceDirs: readdirSync(receipts, { withFileTypes: true }).filter(e => e.isDirectory() && e.name.startsWith('evidence-')).length,
  findings: uniqueFindings,
  sensitiveValuesSerialized: uniqueFindings.length > 0,
  verdict: uniqueFindings.length === 0 ? 'PASS' : 'FAIL',
  scope: 'entire product/p45-login-security/receipts text artifacts; binary screenshots inventory-only'
}
console.log(JSON.stringify(result, null, 2))
process.exitCode = uniqueFindings.length === 0 ? 0 : 1
