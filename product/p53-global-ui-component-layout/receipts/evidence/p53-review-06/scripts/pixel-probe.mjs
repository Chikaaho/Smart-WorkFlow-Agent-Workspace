/**
 * P53 像素探针：对参考 PNG 与运行时 PNG 同坐标采样 RGB。
 * 用法：node pixel-probe.mjs <familyDir/seq | 参考seq> <x,y ...>   （坐标可多个）
 * 示例：node pixel-probe.mjs family-a/21 12,82 100,100
 */
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-06',
)
const refRoot = path.join(workspaceRoot, 'docs', 'ui', 'png')
const lockedIndex = JSON.parse(
  await readFile(
    path.join(
      evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json',
    ),
    'utf8',
  ),
)
const lockedBySeq = new Map(lockedIndex.nodes.map((n) => [String(n.seq).padStart(2, '0'), n]))

const target = process.argv[2] ?? 'family-a/21'
const coords = process.argv.slice(3).map((c) => c.split(',').map(Number))

let runPath, refPath
if (target.includes('/')) {
  const [dir, seq] = target.split('/')
  runPath = path.join(evidenceRoot, dir, seq + '-runtime.png')
  refPath = path.join(refRoot, path.basename(lockedBySeq.get(seq.padStart(2, '0')).locked_png))
} else {
  refPath = path.join(refRoot, path.basename(lockedBySeq.get(target.padStart(2, '0')).locked_png))
  runPath = null
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setContent('<!doctype html><title>probe</title>')
await page.evaluate(() => {
  window.__load = async (b64) => {
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
      img.src = 'data:image/png;base64,' + b64
    })
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    window.__ctx = ctx
    return [c.width, c.height]
  }
  window.__at = (x, y) => {
    const d = window.__ctx.getImageData(x, y, 1, 1).data
    return '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')
  }
})
const loadPng = async (p) => {
  const [w, h] = await page.evaluate(async (b64) => window.__load(b64), (await readFile(p)).toString('base64'))
  return { w, h }
}
const sample = async (x, y) => page.evaluate(([x, y]) => window.__at(x, y), [x, y])

for (const [label, p] of [
  ['ref ', refPath],
  ['run ', runPath],
]) {
  if (!p) continue
  const { w, h } = await loadPng(p)
  const rows = []
  for (const [x, y] of coords) rows.push(`(${x},${y})=${await sample(x, y)}`)
  console.log(label, `${w}x${h}`, rows.join(' '))
}
await browser.close()
