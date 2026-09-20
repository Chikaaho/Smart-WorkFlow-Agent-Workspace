/**
 * P53 EV-06c Step B：把 134 个去重设计值映射到生产 CSS（token 或字面量声明）。
 * 扫描 Web src 的 <style> 与 tokens.css，为每个值登记生产落点；无落点 → unmapped（待补实现）。
 * 输出：color-token-map.json。
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const colorRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07', 'color')
const design = JSON.parse(await readFile(path.join(colorRoot, 'design-colors.json'), 'utf8'))

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'design-fixture') continue
      await walk(p, files)
    } else if (/\.(vue|css|scss|ts)$/.test(entry.name)) files.push(p)
  }
  return files
}

const sources = await walk(path.join(webRoot, 'src'))
const cssIndex = [] // { file, css, lower }
for (const file of sources) {
  const text = await readFile(file, 'utf8')
  const rel = path.relative(webRoot, file).replaceAll('\\', '/')
  // 逐条样式声明定位：值出现在哪些文件/行
  const lines = text.split('\n')
  cssIndex.push({ file: rel, lines })
}

const HEX = /^[0-9A-F]{6}$/
const records = []
for (const v of design.summary.values) {
  const hex = v.value.replace('#', '')
  if (!HEX.test(hex)) continue
  const needle = '#' + hex.toLowerCase()
  const hits = []
  for (const src of cssIndex) {
    src.lines.forEach((line, i) => {
      if (line.toLowerCase().includes(needle)) {
        hits.push({ file: src.file, line: i + 1, text: line.trim().slice(0, 160) })
      }
    })
  }
  records.push({ value: v.value, designNodes: v.nodes, designCount: v.count, productionHits: hits.slice(0, 12), hitCount: hits.length })
}

const mapped = records.filter((r) => r.hitCount > 0)
const unmapped = records.filter((r) => r.hitCount === 0)
await writeFile(
  path.join(colorRoot, 'color-token-map.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), distinct: records.length, mapped: mapped.length, unmapped: unmapped.length, records }, null, 2) + '\n',
)
console.log('DISTINCT', records.length, 'MAPPED', mapped.length, 'UNMAPPED', unmapped.length)
console.log('UNMAPPED VALUES:', unmapped.map((r) => r.value).join(' '))
