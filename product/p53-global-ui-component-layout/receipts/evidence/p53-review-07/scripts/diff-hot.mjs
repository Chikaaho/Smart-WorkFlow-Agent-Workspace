/** 诊断：输出 __diff 掩码中 canvas 区域的热点格（配合 region-diff.mjs 使用）。 */
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
const masks = JSON.parse(await readFile(path.join(evidenceRoot, dir, seq + '-masks.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await page.evaluate(
  async ({ refB64, runB64, rects }) => {
    await window.__p53.load('ref', refB64)
    await window.__p53.load('run', runB64)
    window.__p53.compare('ref', 'run', rects, 0.1)
  },
  {
    refB64: (await readFile(path.join(refRoot, refName))).toString('base64'),
    runB64: (await readFile(path.join(evidenceRoot, dir, seq + '-runtime.png'))).toString('base64'),
    rects: masks.rects,
  },
)
const hot = await page.evaluate(() => {
  const diff = window.__p53.slots.__diff.data
  const w = window.__p53.slots.__diff.w
  const cells = new Map()
  for (let idx = 0; idx < diff.length; idx++) {
    if (!diff[idx]) continue
    const y = Math.floor(idx / w)
    const x = idx % w
    if (y < 717 || x < 257) continue
    const k = Math.floor(x / 80) + ',' + Math.floor(y / 80)
    cells.set(k, (cells.get(k) ?? 0) + 1)
  }
  return [...cells.entries()].sort((p, q) => q[1] - p[1]).slice(0, 16)
})
for (const [k, n] of hot) {
  const [cx, cy] = k.split(',').map(Number)
  console.log(`cell(${cx * 80},${cy * 80}) diffPx=${n}`)
}
await browser.close()
