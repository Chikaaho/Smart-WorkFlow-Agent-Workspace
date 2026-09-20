/**
 * 诊断工具（非证据）：在指定窗口内找设计/运行各自的最暗像素（墨迹色）与墨迹行数（线宽）。
 * 用法：node colors-probe.mjs <seq> <familyDir> '<[{"name":"edge","x":677,"y":1290,"w":6,"h":30}...]>'
 * 输出每窗口 ref/run 的最暗 RGB 与暗像素计数（yiq<0.75 计为墨迹）。
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
const { installImageRuntime, loadImage } = await import(
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
const nodesMod = await import(pathToFileURL(path.join(scriptsDir, 'p53-nodes.mjs')).href)
const NODES = nodesMod.NODES

const [seqRaw, dir, windowsJson] = process.argv.slice(2)
if (!seqRaw || !dir || !windowsJson) throw new Error('usage: node colors-probe.mjs <seq> <familyDir> <windowsJson>')
const seq = seqRaw.padStart(2, '0')
const refSeq = NODES[seq]?.refOverride ?? seq
const refPath = path.join(refRoot, path.basename(lockedBySeq.get(String(Number(refSeq))).locked_png))
const runPath = path.join(evidenceRoot, dir, seq + '-runtime.png')
const windows = JSON.parse(windowsJson)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await loadImage(page, 'ref', refPath)
await loadImage(page, 'run', runPath)
const result = await page.evaluate((wins) => {
  const probe = (name, w) => {
    const s = window.__p53.slots[name]
    let darkest = null
    let dl = 2
    let inkCount = 0
    for (let y = w.y; y < w.y + w.h; y++) {
      for (let x = w.x; x < w.x + w.w; x++) {
        const i = (y * s.w + x) * 4
        const r = s.data.data[i], g = s.data.data[i + 1], b = s.data.data[i + 2]
        const yiq = (r * 299 + g * 587 + b * 114) / 1000 / 255
        if (yiq < dl) { dl = yiq; darkest = [r, g, b] }
        if (yiq < 0.8) inkCount++
      }
    }
    return { darkest, dl: Math.round(dl * 1000) / 1000, inkCount }
  }
  return wins.map((w) => ({ name: w.name, ref: probe('ref', w), run: probe('run', w) }))
}, windows)
for (const r of result) {
  console.log(
    r.name.padEnd(14),
    'ref rgb=' + r.ref.darkest + ' yiq=' + r.ref.dl + ' ink=' + r.ref.inkCount,
    '| run rgb=' + r.run.darkest + ' yiq=' + r.run.dl + ' ink=' + r.run.inkCount,
  )
}
await browser.close()
