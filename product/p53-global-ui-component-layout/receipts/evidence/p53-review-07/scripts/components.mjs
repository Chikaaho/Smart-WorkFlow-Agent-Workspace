/**
 * 诊断工具（非证据）：比较器同口径（阈值0.1+遮罩）diff 连通分量分析。
 * 用法：node components.mjs <familyDir/seq> [minPx=120]
 * 输出 top 连通分量：像素数、bbox、中心——即"正在计分的具体元素"清单。
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
const FAMILIES = nodesMod.FAMILIES

const [target, minPxArg] = process.argv.slice(2)
const [dir, seqRaw] = target.split('/')
const seq = seqRaw.padStart(2, '0')
const refSeq = NODES[seq]?.refOverride ?? seq
const refPath = path.join(refRoot, path.basename(lockedBySeq.get(refSeq.padStart(2, '0')).locked_png))
const runPath = path.join(evidenceRoot, dir, seq + '-runtime.png')
const minPx = Number(minPxArg ?? 120)

// 遮罩：与 compare-family 同源（dom.json 文字行框 + 品牌资产）
const inv = JSON.parse(await readFile(path.join(evidenceRoot, dir, seq + '-dom.json'), 'utf8'))
const familyKey = Object.keys(FAMILIES).find((k) => FAMILIES[k].id === dir)
const glyphPadPx = familyKey === 'd' || ['01', '11', '12', '14', '20', '21'].includes(seq) ? 1 : (seq === '13' || seq === '07' ? 2 : (['15', '16', '17', '18'].includes(seq) ? 0 : 3))
const rects = []
const dialogBox = inv.fixtureIdForData === 'node16' ? { x: 210, y: 208, w: 1020, h: 607 }
  : ['node15', 'node17', 'node18'].includes(inv.fixtureIdForData) ? { x: 330, y: 182, w: 780, h: 660 }
  : inv.fixtureIdForData === 'node11' ? { x: 200, y: 154, w: 1040, h: 720 }
  : inv.fixtureIdForData === 'node12' ? { x: 210, y: 146, w: 1020, h: 733 }
  : inv.fixtureIdForData === 'node13' ? { x: 192, y: 110, w: 1056, h: 804 }
  : null
for (const t of inv.texts) {
  const boxes = t.lineRects && t.lineRects.length ? t.lineRects : [t.bbox]
  for (const b of boxes) {
    const inDialog = dialogBox && b.x >= dialogBox.x && b.y >= dialogBox.y && b.x + b.w <= dialogBox.x + dialogBox.w && b.y + b.h <= dialogBox.y + dialogBox.h
    if (inDialog && t.overlay === false) continue
    const pad = t.placeholder ? 0 : glyphPadPx === 2 && b.w > 120 ? 1 : glyphPadPx
    const x0 = Math.max(0, Math.floor(b.x) - pad)
    const y0 = Math.max(0, Math.floor(b.y) - pad)
    const x1 = Math.min(1440, Math.ceil(b.x + b.w) + pad)
    const y1 = Math.min(inv.viewport.height, Math.ceil(b.y + b.h) + pad)
    if (x1 <= x0 || y1 <= y0) continue
    rects.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 })
  }
}
for (const b of inv.brandRasters ?? []) {
  rects.push({ x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.w), h: Math.ceil(b.h) })
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await loadImage(page, 'ref', refPath)
await loadImage(page, 'run', runPath)
const components = await page.evaluate(({ rects, minPx, seq }) => {
  const a = window.__p53.slots.ref
  const b = window.__p53.slots.run
  const W = a.w, H = a.h
  const yiq = (s, x, y) => {
    const i = (y * s.w + x) * 4
    return (s.data.data[i] * 299 + s.data.data[i + 1] * 587 + s.data.data[i + 2] * 114) / 1000 / 255
  }
  // 遮罩
  const mask = new Uint8Array(W * H)
  for (const r of rects) {
    for (let y = Math.max(0, r.y); y < Math.min(H, r.y + r.h); y++)
      mask.fill(1, y * W + Math.max(0, r.x), y * W + Math.min(W, r.x + r.w))
  }
  const diff = new Uint8Array(W * H)
  const siblings = (s, x, y) => {
    const i = (y * s.w + x) * 4
    const v = (s.data.data[i] * 299 + s.data.data[i + 1] * 587 + s.data.data[i + 2] * 114) / 1000 / 255
    let same = 0
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const j = (ny * s.w + nx) * 4
      if (Math.abs((s.data.data[j]*299+s.data.data[j+1]*587+s.data.data[j+2]*114)/1000/255 - v) <= 0.022) same++
    }
    return same > 4
  }
  let total = 0
  for (let y = 0; y < H; y++) {
    if (mask[y * W]) continue
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      if (mask[i]) continue
      if (Math.abs(yiq(a, x, y) - yiq(b, x, y)) <= 0.1) continue
      if (siblings(a, x, y) && siblings(b, x, y)) continue
      diff[i] = 1
      total++
    }
  }
  // 连通分量（8 邻接，迭代栈）
  const seen = new Uint8Array(W * H)
  const comps = []
  const stack = new Int32Array(W * H)
  for (let i0 = 0; i0 < W * H; i0++) {
    if (!diff[i0] || seen[i0]) continue
    let sp = 0
    stack[sp++] = i0
    seen[i0] = 1
    let count = 0
    let minX = W, maxX = 0, minY = H, maxY = 0
    while (sp > 0) {
      const i = stack[--sp]
      const x = i % W, y = (i / W) | 0
      count++
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
          const ni = ny * W + nx
          if (diff[ni] && !seen[ni]) { seen[ni] = 1; stack[sp++] = ni }
        }
      }
    }
    if (count >= minPx) comps.push({ count, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 })
  }
  comps.sort((p, q) => q.count - p.count)
  return { total, comps: comps.slice(0, 30) }
}, { rects, minPx, seq })
console.log(`node ${seq} diffTotal(masked)=${components.total}  components>=${minPx}px: ${components.comps.length}`)
for (const c of components.comps)
  console.log(`  ${String(c.count).padStart(6)}px  bbox=(${c.x},${c.y}) ${c.w}x${c.h}  center=(${c.x + (c.w >> 1)},${c.y + (c.h >> 1)})`)
await browser.close()
