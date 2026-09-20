/**
 * P53 网格差异定位：对锁定参考 PNG 与运行时 PNG 做逐格差异统计，输出热点坐标。
 * 用法：node hotspot.mjs <familyDir/seq> [cellPx] [topN]
 * 示例：node hotspot.mjs family-c/09 80 12
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const { installImageRuntime } = await import(
  pathToFileURL(path.join(scriptsDir, 'p53-image.mjs')).href
)
const evidenceRoot = path.join(scriptsDir, '..')
const refRoot = path.join(workspaceRoot, 'docs', 'ui', 'png')
const lockedIndex = JSON.parse(
  await readFile(
    path.join(evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json'),
    'utf8',
  ),
)
const lockedBySeq = new Map(lockedIndex.nodes.map((n) => [String(n.seq).padStart(2, '0'), n]))

const target = process.argv[2] ?? 'family-c/09'
const cell = Number(process.argv[3] ?? 80)
const topN = Number(process.argv[4] ?? 12)
const [dir, seqRaw] = target.split('/')
const seq = seqRaw.padStart(2, '0')
const refName = path.basename(lockedBySeq.get(seq).locked_png)
const refB64 = (await readFile(path.join(refRoot, refName))).toString('base64')
const runB64 = (
  await readFile(path.join(evidenceRoot, dir, seq + '-runtime.png'))
).toString('base64')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await page.evaluate((d) => window.__p53.load('a', d), refB64)
await page.evaluate((d) => window.__p53.load('b', d), runB64)
const out = await page.evaluate(
  ({ cell }) => {
    const A = window.__p53.slots.a
    const B = window.__p53.slots.b
    const yiq = (d, i) => (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 / 255
    const cells = new Map()
    let total = 0
    for (let y = 0; y < A.h; y += 2) {
      for (let x = 0; x < A.w; x += 2) {
        const i = (y * A.w + x) * 4
        if (Math.abs(yiq(A.data.data, i) - yiq(B.data.data, i)) > 0.022) {
          total++
          const k = Math.floor(x / cell) + ',' + Math.floor(y / cell)
          cells.set(k, (cells.get(k) ?? 0) + 1)
        }
      }
    }
    return {
      total,
      hot: [...cells.entries()]
        .sort((p, q) => q[1] - p[1])
        .slice(0, 18)
        .map(([k, n]) => {
          const [cx, cy] = k.split(',').map(Number)
          return { x: cx * cell, y: cy * cell, w: cell, n }
        }),
    }
  },
  { cell },
)
console.log(target, 'sampledDiffPoints=' + out.total)
for (const h of out.hot) console.log(`  cell(${h.x},${h.y}) diffSamples=${h.n}`)
await browser.close()
