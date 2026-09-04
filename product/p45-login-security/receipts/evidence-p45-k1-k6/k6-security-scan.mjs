#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.argv[2] || process.cwd()
const receipts = join(root, 'product', 'p45-login-security', 'receipts')
const files = []

function walk(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else files.push(path)
  }
}

for (const entry of readdirSync(receipts, { withFileTypes: true })) {
  const path = join(receipts, entry.name)
  if (entry.isDirectory() && entry.name.startsWith('evidence-')) walk(path)
  if (entry.isFile() && /^p45-.*\.md$/.test(entry.name)) files.push(path)
}

const findings = []
const placeholder = /^(?:<[^>]+>|\[REDACTED\]|REDACTED|OMITTED|NOT_SERIALIZED|undefined|null)$/i
function inspect(path) {
  let text
  try { text = readFileSync(path, 'utf8') } catch { return }
  const rel = relative(root, path)
  if (/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(text)) findings.push({ file: rel, type: 'private-key-marker' })
  if (/Bearer\s+[A-Za-z0-9._~-]{20,}/.test(text) && !/Bearer\s+<[^>]+>/.test(text)) {
    findings.push({ file: rel, type: 'bearer-material' })
  }
  for (const match of text.matchAll(/["'](?:accessToken|refreshToken|token|cookie)["']\s*:\s*["']([^"']+)["']/gi)) {
    if (!placeholder.test(match[1]) && !/^<[^>]+>$/.test(match[1]) && !/^process\.env\./.test(match[1])) {
      findings.push({ file: rel, type: 'token-or-cookie-value' })
      break
    }
  }
  for (const match of text.matchAll(/(?:password|captcha)\s*["']?\s*[:=]\s*["']([^"']+)["']/gi)) {
    if (!placeholder.test(match[1]) && !/^process\.env\./.test(match[1]) && !/^requiredEnv\(/.test(match[1])) {
      findings.push({ file: rel, type: 'credential-or-answer-value' })
      break
    }
  }
}

for (const path of files) inspect(path)
const uniqueFindings = [...new Map(findings.map(item => [`${item.file}:${item.type}`, item])).values()]
console.log(JSON.stringify({
  filesScanned: files.length,
  evidenceDirs: readdirSync(receipts, { withFileTypes: true }).filter(e => e.isDirectory() && e.name.startsWith('evidence-')).length,
  findings: uniqueFindings,
  verdict: uniqueFindings.length === 0 ? 'PASS' : 'FAIL',
  scope: 'all product/p45-login-security/receipts/evidence-* plus current p45 receipt'
}))
process.exitCode = uniqueFindings.length === 0 ? 0 : 1
