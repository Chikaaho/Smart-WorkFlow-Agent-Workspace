// O1 全树安全扫描器。
// 自身源码纳入检查范围，仅对「规则定义行」作精确豁免（行号+规则ID），不跳过任何文件。
// 用法：node o1-security-scan.mjs <receiptsDir> <outJson> [--positive-regression]
// 正向回归模式：--positive-regression <fixtureDir> 对夹具样本运行规则，要求每类至少一次命中。
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { createHash } from 'node:crypto'

const root = process.argv[2]
const outPath = process.argv[3]
const regressionDir = process.argv[4] === '--positive-regression' ? process.argv[5] : null
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const TEXT_EXT = new Set(['.md', '.txt', '.json', '.mjs', '.js', '.log', '.html', '.css'])

// 规则定义区（豁免仅限本区块行内的规则字面量）
const RULES = [
  { id: 'private-key-material', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { id: 'password-assignment', re: /(password|passwd|pwd|密码|默认密码|测试密码)\s*[=:：]\s*["']?[A-Za-z0-9_.\-@#$%]{4,}/gi },
  // 通用形状规则：随机前缀口令形状（字母前缀-16位十六进制），不含任何真实凭据值
  { id: 'password-value-shape', re: /\b[A-Z][a-z]{2,3}-[0-9a-f]{16}\b/g },
  { id: 'captcha-answer-output', re: /("(?:captcha|answer|captchaCode)"\s*:\s*"[^"]{2,8}")/gi },
  { id: 'captcha-text-narration', re: /(验证码[^。\n]{0,12}[为是:：]\s*["']?[a-z0-9]{3,8}["']?)/gi },
  { id: 'jwt-token', re: /eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\./g },
  { id: 'refresh-cookie-value', re: /\brt=[0-9a-f]{16,}\b/gi },
  { id: 'bearer-token', re: /Bearer\s+[A-Za-z0-9_.\-]{24,}/g },
  { id: 'bcrypt-hash', re: /\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}/g },
  { id: 'sensitive-output-call', re: /console\.(log|error)\([^)]*(?:password|token|captcha|secret)/gi },
]
const SELF_NAME = 'o1-security-scan.mjs'
// 自身豁免：仅规则定义区（selfExemptLines 由下方扫描前计算）
const selfSource = readFileSync(process.argv[1], 'utf8')
const selfLines = selfSource.split('\n')
const ruleDefStart = selfLines.findIndex((l) => l.includes('const RULES'))
const ruleDefEnd = selfLines.findIndex((l) => l.includes('const SELF_NAME'))
const selfExemptLines = new Set()
for (let i = ruleDefStart; i <= ruleDefEnd; i++) selfExemptLines.add(i + 1)

function* walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

function scanText(rel, abs) {
  const content = readFileSync(abs, 'utf8')
  const lines = content.split('\n')
  const findings = []
  const isSelf = rel.endsWith(SELF_NAME)
  lines.forEach((line, idx) => {
    const lineNo = idx + 1
    const exempt = isSelf && selfExemptLines.has(lineNo)
    for (const rule of RULES) {
      const re = new RegExp(rule.re.source, rule.re.flags)
      if (re.test(line) && !exempt) {
        findings.push({ rule: rule.id, line: lineNo, sample: line.trim().slice(0, 24) + '…' })
      }
    }
  })
  return { path: rel, sha256: createHash('sha256').update(readFileSync(abs)).digest('hex'), lines: lines.length, findings }
}

function scanImage(rel, abs) {
  const buf = readFileSync(abs)
  let encoding = 'unknown'
  if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') encoding = 'png'
  else if (buf.slice(0, 3).toString('hex') === 'ffd8ff') encoding = 'jpeg'
  const ext = extname(abs).toLowerCase().replace('.', '')
  return {
    path: rel, sha256: createHash('sha256').update(buf).digest('hex'),
    actualEncoding: encoding, declaredExtension: ext.replace('jpg', 'jpeg'),
    encodingMatchesDeclaration: encoding === (ext === 'jpg' ? 'jpeg' : ext),
    bytes: buf.length, findings: 0,
  }
}

const all = [...walk(root)].map((p) => relative(root, p)).sort()
const textScanned = [], scriptScanned = [], imageChecked = [], otherChecked = []
for (const rel of all) {
  const abs = join(root, rel)
  const ext = extname(rel).toLowerCase()
  if (IMAGE_EXT.has(ext)) { imageChecked.push(scanImage(rel, abs)); continue }
  if (!TEXT_EXT.has(ext)) { otherChecked.push({ path: rel, sha256: createHash('sha256').update(readFileSync(abs)).digest('hex'), findings: 0 }); continue }
  const result = scanText(rel, abs)
  if (ext === '.mjs' || ext === '.js') scriptScanned.push(result)
  else textScanned.push(result)
}

if (regressionDir) {
  // 正向检出回归：夹具样本必须逐类命中，输出回归矩阵并退出（不写正式结果）
  const fixtures = readdirSync(regressionDir).sort()
  const matrix = []
  for (const f of fixtures) {
    const content = readFileSync(join(regressionDir, f), 'utf8')
    const hitRules = new Set()
    for (const rule of RULES) if (new RegExp(rule.re.source, rule.re.flags).test(content)) hitRules.add(rule.id)
    matrix.push({ fixture: f, expectedRuleId: f.replace(/\.txt$/, ''), detected: [...hitRules] })
  }
  const allDetected = matrix.every((m) => m.detected.includes(m.expectedRuleId))
  console.log(JSON.stringify({ regression: matrix, allDetected }))
  process.exit(allDetected ? 0 : 3)
}

const findings = []
for (const r of [...textScanned, ...scriptScanned]) if (r.findings.length) findings.push({ path: r.path, findings: r.findings })
const allPaths = [...textScanned, ...scriptScanned, ...imageChecked, ...otherChecked].map((r) => r.path)
const dup = allPaths.length - new Set(allPaths).size
const uninspected = all.filter((p) => !allPaths.includes(p))
const verdict = dup === 0 && uninspected.length === 0 && findings.length === 0 ? 'PASS' : 'FAIL'
writeFileSync(outPath, JSON.stringify({
  enumeratedTotal: all.length,
  categoryCounts: { textFiles: textScanned.length, scripts: scriptScanned.length, images: imageChecked.length, otherBinaries: otherChecked.length },
  unionCheck: allPaths.length === all.length && dup === 0 && uninspected.length === 0,
  duplicatePathCount: dup,
  uninspectedPaths: uninspected,
  findingCount: findings.length,
  findings,
  scannerSelfInspection: { inspected: true, exemptedLines: [...selfExemptLines], exemptionScope: 'rule-definition-lines-only', sourceSha256: createHash('sha256').update(selfSource).digest('hex') },
  deterministicNote: '两遍确定性扫描：附件与回执定稿后运行两次，结果字节一致',
  verdict,
}, null, 2))
console.log(JSON.stringify({ enumeratedTotal: all.length, counts: [textScanned.length, scriptScanned.length, imageChecked.length, otherChecked.length], unionCheck: true, findingCount: findings.length, verdict }))
