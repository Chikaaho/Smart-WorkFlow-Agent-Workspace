/**
 * P53 网格计分（诊断用，非证据）：以比较器同管线（阈值0.1+遮罩）按网格统计差异占比。
 * 用法：node grid-score.mjs <familyDir/seq> [cellPx]
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

const target = process.argv[2] ?? 'family-b/19'
const cell = Number(process.argv[3] ?? 80)
const [dir, seqRaw] = target.split('/')
const seq = seqRaw.padStart(2, '0')
const refName = path.basename(lockedBySeq.get(seq).locked_png)

const masks = JSON.parse(await readFile(path.join(evidenceRoot, dir, seq + '-masks.json'), 'utf8'))
const rects = masks.rects

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await page.evaluate(
  async ({ refB64, runB64, rects }) => {
    await window.__p53.load('ref', refB64)
    await window.__p53.load('run', runB64)
    window.__result = window.__p53.compare('ref', 'run', rects, 0.1)
  },
  {
    refB64: (await readFile(path.join(refRoot, refName))).toString('base64'),
    runB64: (await readFile(path.join(evidenceRoot, dir, seq + '-runtime.png'))).toString('base64'),
    rects,
  },
)
const out = await page.evaluate(
  ({ cell }) => {
    const diff = window.__p53.slots.__diff.data
    const w = window.__p53.slots.__diff.w
    const h = window.__p53.slots.__diff.h
    const cells = []
    for (let cy = 0; cy < h; cy += cell) {
      for (let cx = 0; cx < w; cx += cell) {
        let n = 0
        for (let y = cy; y < Math.min(cy + cell, h); y++) {
          for (let x = cx; x < Math.min(cx + cell, w); x++) if (diff[y * w + x]) n++
        }
        if (n > 0) cells.push({ x: cx, y: cy, n })
      }
    }
    cells.sort((a, b) => b.n - a.n)
    return { total: cells.reduce((s, c) => s + c.n, 0), top: cells.slice(0, 16) }
  },
  { cell },
)
console.log(target, 'diffTotal=' + out.total)
for (const c of out.top) console.log(`  cell(${c.x},${c.y}) diff=${c.n}`)
await browser.close()
