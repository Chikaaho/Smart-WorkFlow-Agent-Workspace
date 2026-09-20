/**
 * P53 review-06 几何对齐报告：设计 XML 文本位置 vs 运行时 DOM 文本行框。
 * 用法：node geometry-report.mjs <seq> <familyDir>   （先运行 design-geometry.mjs <seq> 与 capture-nodes.mjs <seq>）
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const evidenceRoot = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-06',
)

/** 设计名 → 文本内容：取最后一个含 CJK 的语义段。 */
function designLabel(name) {
  if (!name) return ''
  const parts = name.split('/')
  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = parts[i].trim()
    if (/[\u4e00-\u9fff]/.test(seg)) return seg
  }
  return parts.at(-1)?.trim() ?? ''
}

function norm(s) {
  return String(s ?? '').replace(/\s+/g, '').replace(/🔔/g, '')
}

const seq = String(process.argv[2] ?? '02').padStart(2, '0')
const familyDir = process.argv[3] ?? 'family-x'
const design = JSON.parse(
  await readFile(path.join(evidenceRoot, 'design-geometry', seq + '-design.json'), 'utf8'),
)
const run = JSON.parse(
  await readFile(path.join(evidenceRoot, familyDir, seq + '-dom.json'), 'utf8'),
)

const designTexts = design.elements
  .filter((e) => e.tag === 'text' && !e.hidden)
  .map((e) => ({ label: designLabel(e.name), x: e.x, y: e.y, w: e.w, h: e.h }))
  .filter((t) => t.label)

const runTexts = []
for (const t of run.texts) {
  const boxes = t.lineRects?.length ? t.lineRects : [t.bbox]
  for (const b of boxes) runTexts.push({ label: t.text, x: b.x, y: b.y, w: b.w, h: b.h })
}

const used = new Set()
const pairs = []
for (const d of designTexts) {
  const key = norm(d.label)
  if (!key) continue
  let best = null
  let bestDist = Infinity
  runTexts.forEach((r, i) => {
    if (used.has(i)) return
    const rk = norm(r.label)
    if (!rk) return
    if (rk !== key && !rk.includes(key) && !key.includes(rk)) return
    const dist = Math.hypot(r.x - d.x, r.y - d.y)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  })
  if (best !== null && bestDist <= 60) {
    used.add(best)
    const r = runTexts[best]
    pairs.push({
      label: d.label,
      dx: Math.round((r.x - d.x) * 10) / 10,
      dy: Math.round((r.y - d.y) * 10) / 10,
      dw: Math.round((r.w - d.w) * 10) / 10,
      dh: Math.round((r.h - d.h) * 10) / 10,
      design: { x: d.x, y: d.y, w: d.w, h: d.h },
    })
  }
}
const shifted = pairs
  .filter((p) => Math.abs(p.dx) > 1 || Math.abs(p.dy) > 1)
  .sort((a, b) => Math.hypot(b.dx, b.dy) - Math.hypot(a.dx, a.dy))
const matchedLabels = new Set(pairs.map((p) => p.label + '@' + p.design.x + ',' + p.design.y))
const designOnly = designTexts.filter((d) => !matchedLabels.has(d.label + '@' + d.x + ',' + d.y))
console.log('== shifted (dx,dy dw,dh) label design@ ==')
for (const p of shifted.slice(0, 40)) {
  console.log(
    ` (${p.dx},${p.dy}) (${p.dw},${p.dh})`,
    p.label.slice(0, 24),
    'design@',
    p.design.x,
    p.design.y,
  )
}
console.log(
  'shifted:',
  shifted.length,
  '/ matched:',
  pairs.length,
  '/ design texts:',
  designTexts.length,
)
console.log('== design-only (前20) ==')
for (const d of designOnly.slice(0, 20)) console.log(' ', d.label.slice(0, 30), '@', d.x, d.y)
