/**
 * 诊断工具（非证据）：对指定 cell 输出 diff 的行/列直方与最佳位移估计。
 * 用法：node line-shift.mjs <familyDir/seq> <cx> <cy> [cell=80]
 * 输出：diff 总数、前 5 个 diff 行带（y:count）、前 5 个 diff 列带（x:count）、
 * 以及 ±6px 平移自相关的最优位移（判断该格是整体位移还是形状差异）。
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

const [target, cxArg, cyArg, cellArg] = process.argv.slice(2)
const [dir, seqRaw] = target.split('/')
const seq = seqRaw.padStart(2, '0')
const refSeq = NODES[seq]?.refOverride ?? seq
const refPath = path.join(refRoot, path.basename(lockedBySeq.get(refSeq.padStart(2, '0')).locked_png))
const runPath = path.join(evidenceRoot, dir, seq + '-runtime.png')
const cx = Number(cxArg), cy = Number(cyArg), cell = Number(cellArg ?? 80)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await loadImage(page, 'ref', refPath)
await loadImage(page, 'run', runPath)
const out = await page.evaluate(({ cx, cy, cell }) => {
  const a = window.__p53.slots.ref
  const b = window.__p53.slots.run
  const yiq = (d, x, y) => {
    const i = (y * d.w + x) * 4
    return (d.data.data[i] * 299 + d.data.data[i + 1] * 587 + d.data.data[i + 2] * 114) / 1000 / 255
  }
  const x0 = cx, y0 = cy, x1 = Math.min(cx + cell, a.w), y1 = Math.min(cy + cell, a.h)
  const diffAt = (x, y) => {
    const i = (y * a.w + x) * 4
    return Math.abs(yiq(a, x, y) - yiq(b, x, y)) > 0.1
  }
  const rows = {}, cols = {}
  let total = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (diffAt(x, y)) { total++; rows[y] = (rows[y] || 0) + 1; cols[x] = (cols[x] || 0) + 1 }    }
  }
  const top = (m) => Object.entries(m).sort((p, q) => q[1] - p[1]).slice(0, 6)
    .map(([k, v]) => k + ':' + v).join(' ')
  // 平移自相关：把 ref 窗口在 ±6px 内平移，找与 run 窗口差异最小的位移
  let best = { dx: 0, dy: 0, d: Infinity }
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      let d = 0
      for (let y = y0; y < y1; y++) {
        const sy = y + dy
        if (sy < 0 || sy >= a.h) continue
        for (let x = x0; x < x1; x++) {
          const sx = x + dx
          if (sx < 0 || sx >= a.w) continue
          if (Math.abs(yiq(a, sx, sy) - yiq(b, x, y)) > 0.1) d++
        }
      }
      if (d < best.d) best = { dx, dy, d }
    }
  }
  return { total, rows: top(rows), cols: top(cols), shift: best }
}, { cx, cy, cell })
console.log(`cell(${cx},${cy}) diff=${out.total} | bestShift dx=${out.shift.dx} dy=${out.shift.dy} residual=${out.shift.d}`)
console.log('  rows:', out.rows)
console.log('  cols:', out.cols)
await browser.close()
