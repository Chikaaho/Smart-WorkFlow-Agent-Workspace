import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const { installImageRuntime } = await import(pathToFileURL(path.join(scriptsDir, 'p53-image.mjs')).href)
const evidenceRoot = path.join(scriptsDir, '..')
const refRoot = path.join(workspaceRoot, 'docs', 'ui', 'png')
const lockedIndex = JSON.parse(await readFile(path.join(evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json'), 'utf8'))
const lockedBySeq = new Map(lockedIndex.nodes.map((n) => [String(n.seq).padStart(2, '0'), n]))

const seq = process.argv[2] ?? '07'
const dir = process.argv[3] ?? 'family-c'
// 探测列：x 停靠点（避开遮罩），每列在 y∈[from,to] 找墨迹带（暗于背景的行段）
const refName = path.basename(lockedBySeq.get(seq.padStart(2, '0')).locked_png)
const refB64 = (await readFile(path.join(refRoot, refName))).toString('base64')
const runB64 = (await readFile(path.join(evidenceRoot, dir, seq.padStart(2, '0') + '-runtime.png'))).toString('base64')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await page.evaluate((d) => window.__p53.load('ref', d), refB64)
await page.evaluate((d) => window.__p53.load('run', d), runB64)
const columns = JSON.parse(process.argv[4] ?? '[]')
const out = await page.evaluate(({ columns }) => {
  const A = window.__p53.slots.ref
  const B = window.__p53.slots.run
  const yiq = (d, x, y) => {
    const i = (y * d.w + x) * 4
    return (d.data.data[i] * 299 + d.data.data[i + 1] * 587 + d.data.data[i + 2] * 114) / 1000 / 255
  }
  // 对一条竖直扫描带（x..x+w）求每行平均亮度，输出与背景差>0.06 的连续行段中心
  const bands = (d, x0, w, yFrom, yTo) => {
    const rows = []
    for (let y = yFrom; y < yTo; y++) {
      let s = 0
      for (let x = x0; x < x0 + w; x++) s += yiq(d, x, y)
      rows.push(s / w)
    }
    const base = rows.reduce((a, b) => a + b, 0) / rows.length
    const bandsOut = []
    let start = -1
    for (let i = 0; i < rows.length; i++) {
      const dark = base - rows[i] > 0.05
      if (dark && start < 0) start = i
      if (!dark && start >= 0) {
        bandsOut.push({ y: yFrom + Math.round((start + i) / 2), h: i - start })
        start = -1
      }
    }
    return bandsOut
  }
  const result = {}
  for (const c of columns) {
    result[c.name] = {
      design: bands(A, c.x, c.w ?? 40, c.from, c.to),
      runtime: bands(B, c.x, c.w ?? 40, c.from, c.to),
    }
  }
  return result
}, { columns })
console.log(JSON.stringify(out, null, 1))
await browser.close()
