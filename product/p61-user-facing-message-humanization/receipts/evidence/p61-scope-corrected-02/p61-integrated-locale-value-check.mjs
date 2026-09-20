// C2-V：当前集成工作树 4 目标键 zh/en 值 与 P61 锁定提交 d110ed8 逐字比较。
// 期望值由工具直接读取 d110ed8（git show），当前值由工具直接读取集成工作树文件。
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../../..')
const WEB = join(ROOT, 'Smart-WorkFlow-aPaaS-Web')
const WT = 'E:/code/p61-wt-web'
const COMMIT = 'd110ed8'
const KEYS = ['errDynamicTableExists', 'errFieldTypeUnknown', 'errOperatorTypeMismatch', 'errOperatorUnsupported']

function extractValues(source, key) {
  const re = new RegExp('\\b' + key + '\\b\\s*:\\s*\'((?:[^\'\\\\]|\\.)*)\'', 'gs')
  return [...source.matchAll(re)].map(m => m[1])
}

const results = []
let missingCount = 0, duplicateCount = 0
for (const [lang, file] of [['zh-CN', 'src/locales/zh-CN.ts'], ['en-US', 'src/locales/en-US.ts']]) {
  const actualSrc = readFileSync(join(WEB, file), 'utf8')
  const expectedSrc = execSync('git show ' + COMMIT + ':' + file, { cwd: WT }).toString()
  for (const key of KEYS) {
    const expected = extractValues(expectedSrc, key)
    const actual = extractValues(actualSrc, key)
    const missing = expected.length === 0 || actual.length === 0
    const duplicate = expected.length > 1 || actual.length > 1
    if (missing) missingCount++
    if (duplicate) duplicateCount++
    results.push({
      key, lang,
      expected: expected.length === 1 ? expected[0] : null,
      actual: actual.length === 1 ? actual[0] : null,
      match: expected.length === 1 && actual.length === 1 && expected[0] === actual[0],
      expectedOccurrences: expected.length,
      actualOccurrences: actual.length,
      missing, duplicate,
    })
  }
}

const allMatch = results.every(r => r.match && !r.missing && !r.duplicate)
const out = {
  check: 'C2-V integrated locale 8-value verbatim comparison',
  date: new Date().toISOString(),
  integratedWorktree: { path: WEB, identity: 'Smart-WorkFlow-aPaaS-Web main tree (P53 latest mergeable, uncommitted set included)', head: execSync('git rev-parse HEAD', { cwd: WEB }).toString().trim() },
  expectedCommit: COMMIT,
  comparisons: results,
  missingCount, duplicateCount, allMatch,
}
writeFileSync(new URL('./p61-integrated-locale-value-check.json', import.meta.url), JSON.stringify(out, null, 2))
console.log(JSON.stringify({ allMatch, missingCount, duplicateCount, matches: results.map(r => r.match) }))
