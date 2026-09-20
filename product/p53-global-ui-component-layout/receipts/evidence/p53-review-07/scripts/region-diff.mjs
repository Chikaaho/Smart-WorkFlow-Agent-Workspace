/**
 * P53 分区域差异定量（诊断用，非证据）：以锁定阈值 0.1 重跑比较，输出自定义区域计分。
 * 用法：node region-diff.mjs <familyDir/seq>
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
const [dir, seqRaw] = target.split('/')
const seq = seqRaw.padStart(2, '0')
const refName = path.basename(lockedBySeq.get(seq).locked_png)

// 复用比较时的遮罩（与 19-masks.json 一致）
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
const regions = [
  { name: 'topbar(0-64)', x: 224, y: 0, w: 1216, h: 64 },
  { name: 'header(64-167)', x: 224, y: 64, w: 1216, h: 103 },
  { name: 'cards(167-668)', x: 224, y: 167, w: 1216, h: 501 },
  { name: 'tabs(668-717)', x: 224, y: 668, w: 1216, h: 49 },
  { name: 'canvas(717-1501)', x: 224, y: 717, w: 1216, h: 784 },
  { name: 'canvas-left', x: 257, y: 717, w: 700, h: 784 },
  { name: 'canvas-right(960-1408)', x: 960, y: 717, w: 448, h: 784 },
  { name: 'rail-cards(1040-1408,177-653)', x: 1040, y: 177, w: 368, h: 476 },
]
const stats = await page.evaluate((rg) => window.__p53.regionStats(rg), regions)
const total = await page.evaluate(() => window.__result)
console.log('overall diffCount=' + total.diffCount + ' / ' + total.total)
for (const [name, s] of Object.entries(stats)) {
  console.log(
    name.padEnd(36) + ' diff=' + String(s.diff).padStart(7) + '  share=' + ((s.diff / total.diffCount) * 100).toFixed(1) + '%',
  )
}
await browser.close()
