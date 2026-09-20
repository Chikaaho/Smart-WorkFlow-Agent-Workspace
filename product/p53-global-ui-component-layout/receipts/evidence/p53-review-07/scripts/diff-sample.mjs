/**
 * 诊断用：打印指定网格 cell 内被比较器判为差异的像素——设计色 vs 运行色 样本。
 * 用法：node diff-sample.mjs <familyDir/seq> <cellX> <cellY> [cell=96] [max=24]
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

const target = process.argv[2] ?? 'family-c/11'
const cellX = Number(process.argv[3] ?? 0)
const cellY = Number(process.argv[4] ?? 288)
const cell = Number(process.argv[5] ?? 96)
const max = Number(process.argv[6] ?? 24)
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
const out = await page.evaluate(
  ({ cellX, cellY, cell, max }) => {
    const A = window.__p53.slots.ref
    const B = window.__p53.slots.run
    const diff = window.__p53.slots.__diff.data
    const w = A.w
    const samples = []
    for (let y = cellY; y < cellY + cell && samples.length < max; y++) {
      for (let x = cellX; x < cellX + cell && samples.length < max; x++) {
        if (!diff[y * w + x]) continue
        const ia = (y * w + x) * 4
        samples.push({
          x, y,
          design: [A.data.data[ia], A.data.data[ia + 1], A.data.data[ia + 2]],
          runtime: [B.data.data[ia], B.data.data[ia + 1], B.data.data[ia + 2]],
        })
      }
    }
    let count = 0
    for (let y = cellY; y < cellY + cell; y++) {
      for (let x = cellX; x < cellX + cell; x++) if (diff[y * w + x]) count++
    }
    return { count, samples }
  },
  { cellX, cellY, cell, max },
)
console.log('cell diff count =', out.count)
for (const s of out.samples) {
  console.log(
    `(${s.x},${s.y}) design=rgb(${s.design.join(',')}) runtime=rgb(${s.runtime.join(',')})`,
  )
}
await browser.close()
