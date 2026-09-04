// H6：机械聚合 Surefire XML，避免把 Maven 汇总行与逐类结果重复相加。
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2]
if (!root) throw new Error('usage: node h6-surefire.mjs <server-repository>')
const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (entry.name.endsWith('.xml') && path.includes('/target/surefire-reports/')) files.push(path)
  }
}
walk(root)
const attrs = (text, name) => Number(text.match(new RegExp(`\\b${name}="(\\d+)"`))?.[1] ?? 0)
const totals = files.reduce((sum, file) => {
  const text = readFileSync(file, 'utf8')
  return { tests: sum.tests + attrs(text, 'tests'), failures: sum.failures + attrs(text, 'failures'), errors: sum.errors + attrs(text, 'errors'), skipped: sum.skipped + attrs(text, 'skipped') }
}, { tests: 0, failures: 0, errors: 0, skipped: 0 })
console.log(JSON.stringify({ xmlFiles: files.length, ...totals, source: 'one testcase XML file counted once' }))
