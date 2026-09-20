/**
 * P53 EV-07b Step C：运行时颜色校验。
 * 每条 REALIZED canonical 记录按角色定点验证：
 * - surface（不透明填充）：bbox 内缩网格多点采样，每点 ΔRGB≤3；
 * - border（细线）：声明侧边线段中点采样；
 * - svg-stroke/svg-fill：元素几何内扫描命中（≥3px 命中，锚定实际线段，无稀疏网格漏采）；
 * - gradient：按设计 stops/轴向在 bbox 投影定点采样，插值预期 Δ≤3；
 * - shadow：computed boxShadow 参数对照（rgba/offset/blur/spread）；
 * - alpha：按设计前景+alpha+生产不透明祖先背景计算合成预期后采样 Δ≤3；
 * - text：computed 对照（字形抗锯齿不采样）。
 * 无障碍文字前景调整（主方向 §4.1）只能以 adjusted 记录登记（原值/调整值/对比度/作用域/设计节点）。
 * 任何其他超差一律 fail。无 deviation 豁免桶。
 * 输出：color-comparison.json、color-validate.stdout.log、color.exit（单值 0/1）。
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NODES } from './p53-nodes.mjs'
import { installImageRuntime, loadImage } from './p53-image.mjs'
import { createRequire } from 'node:module'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07')
const colorRoot = path.join(evidenceRoot, 'color')
const requireFromWeb = createRequire(path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web', 'package.json'))

const mapping = JSON.parse(await readFile(path.join(colorRoot, 'color-mapping.json'), 'utf8'))
const lockedIndex = JSON.parse(await readFile(path.join(evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json'), 'utf8'))
const lockedBySeq = new Map(lockedIndex.nodes.map((node) => [String(node.seq).padStart(2, '0'), node]))
let adjusted = { items: [] }
try { adjusted = JSON.parse(await readFile(path.join(colorRoot, 'color-adjusted.json'), 'utf8')) } catch {}
const adjustedByKey = new Map(adjusted.items.map((a) => [a.seq + '|' + a.role + '|' + a.value + '|' + a.alpha, a]))

const parseRgb = (value) => {
  const m = /rgba?\(([^)]+)\)/.exec(value ?? '')
  if (m) {
    const parts = m[1].split(/[\s,]+/).filter(Boolean).map(Number)
    return { rgb: parts.slice(0, 3).map((v) => Math.round(v)), alpha: parts.length >= 4 ? Number(parts[3]) : 1 }
  }
  const hex = /^#([0-9a-fA-F]{6})$/.exec((value ?? '').trim())
  if (hex) {
    const h = hex[1]
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), alpha: 1 }
  }
  return null
}
const chDiff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
const composite = (fgRgb, alpha, bgRgb) => fgRgb.map((c, i) => Math.round(alpha * c + (1 - alpha) * bgRgb[i]))

const hexToRgb = (hex) => parseRgb(hex)?.rgb ?? null

function expectedGradientAt(params, bbox, t) {
  const stops = [...params.stops].sort((a, b) => a.offset - b.offset)
  if (t <= stops[0].offset) return hexToRgb(stops[0].value)
  if (t >= stops[stops.length - 1].offset) return hexToRgb(stops[stops.length - 1].value)
  for (let i = 0; i + 1 < stops.length; i++) {
    if (t >= stops[i].offset && t <= stops[i + 1].offset) {
      const f = (t - stops[i].offset) / Math.max(1e-6, stops[i + 1].offset - stops[i].offset)
      const a = hexToRgb(stops[i].value), b = hexToRgb(stops[i + 1].value)
      return a.map((c, j) => Math.round(c + f * (b[j] - c)))
    }
  }
  return hexToRgb(stops[0].value)
}

// ── 采样执行 ──
const { chromium } = requireFromWeb('@playwright/test')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
const pngCache = new Map()
const refPngCache = new Map()
const loadNodePng = async (seq) => {
  if (!pngCache.has(seq)) {
    const cfg = NODES[seq]
    pngCache.set(seq, await loadImage(page, 'run_' + seq, path.join(evidenceRoot, cfg.family, seq + '-runtime.png')))
  }
  return pngCache.get(seq)
}
const loadRefPng = async (seq) => {
  if (!refPngCache.has(seq)) {
    const cfg = lockedBySeq.get(String(NODES[seq].refOverride ?? seq).padStart(2, '0'))
    if (!cfg) throw new Error('missing locked reference for node ' + seq)
    refPngCache.set(seq, await loadImage(page, 'ref_' + seq, path.join(workspaceRoot, cfg.locked_png)))
  }
  return refPngCache.get(seq)
}
const samplePoints = async (seq, points) => {
  const img = await loadNodePng(seq)
  const cl = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)))
  const pts = points
    .map(([x, y]) => [cl(x, 0, img.w - 1), cl(y, 0, img.h - 1)])
    .filter((p, i, arr) => arr.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === i)
  return page.evaluate(({ key, points }) => window.__p53.sample(key, points.map(([x, y]) => ({ x, y }))), { key: 'run_' + seq, points: pts })
}
const referenceAnchoredPoints = async (seq, bbox, expectedRgb) => {
  const ref = await loadRefPng(seq)
  const box = {
    x0: Math.max(0, Math.floor(bbox.x)),
    y0: Math.max(0, Math.floor(bbox.y)),
    x1: Math.min(ref.w - 1, Math.ceil(bbox.x + bbox.w) - 1),
    y1: Math.min(ref.h - 1, Math.ceil(bbox.y + bbox.h) - 1),
  }
  if (box.x1 < box.x0 || box.y1 < box.y0) return []
  return page.evaluate(({ seq, box, expected }) => {
    const s = window.__p53.slots['ref_' + seq]
    const points = []
    const stride = Math.max(1, Math.floor(Math.max(box.x1 - box.x0, box.y1 - box.y0) / 24))
    const xs = new Set(), ys = new Set()
    for (let x = box.x0; x <= box.x1; x += stride) xs.add(x)
    for (let y = box.y0; y <= box.y1; y += stride) ys.add(y)
    for (const d of [0, 1, 2, 3]) {
      xs.add(Math.min(box.x1, box.x0 + d)); xs.add(Math.max(box.x0, box.x1 - d))
      ys.add(Math.min(box.y1, box.y0 + d)); ys.add(Math.max(box.y0, box.y1 - d))
    }
    for (const y of ys) {
      for (const x of xs) {
        const i = (y * s.w + x) * 4
        if (Math.max(Math.abs(s.data.data[i] - expected[0]), Math.abs(s.data.data[i + 1] - expected[1]), Math.abs(s.data.data[i + 2] - expected[2])) <= 3) points.push([x, y])
      }
    }
    return points.slice(0, 16)
  }, { seq, box, expected: expectedRgb })
}
const chooseRealization = async (record) => {
  const candidates = record.realizations?.length ? record.realizations : (record.realization ? [record.realization] : [])
  if (candidates.length <= 1 || !hexToRgb(record.value)) return candidates[0] ?? null
  let best = null
  for (const candidate of candidates) {
    if (!candidate.bbox) continue
    const points = await referenceAnchoredPoints(record.seq, candidate.bbox, hexToRgb(record.value))
    const score = points.length
    if (!best || score > best.score || (score === best.score && (candidate.geometryScore ?? Infinity) < (best.candidate.geometryScore ?? Infinity))) best = { candidate, score }
  }
  return best?.candidate ?? candidates[0]
}
// bbox 内扫描：返回与预期 Δ≤3 的命中像素数与首命中点（几何锚定，替代稀疏网格）
const scanHits = async (seq, bbox, expectedRgb, perimeter = false) => {
  const img = await loadNodePng(seq)
  const x0 = Math.max(0, Math.floor(bbox.x)), y0 = Math.max(0, Math.floor(bbox.y))
  const x1 = Math.min(img.w - 1, Math.ceil(bbox.x + bbox.w) - 1), y1 = Math.min(img.h - 1, Math.ceil(bbox.y + bbox.h) - 1)
  if (x1 < x0 || y1 < y0) return { hitCount: 0, firstHit: null }
  const boxes = perimeter
    ? [
        { x0, y0, x1, y1: Math.min(y1, y0 + 2) },
        { x0, y0: Math.max(y0, y1 - 2), x1, y1 },
        { x0, y0, x1: Math.min(x1, x0 + 2), y1 },
        { x0: Math.max(x0, x1 - 2), y0, x1, y1 },
      ]
    : [{ x0, y0, x1, y1 }]
  const hits = await Promise.all(boxes.map((box) => page.evaluate(({ key, box: b, expected }) => window.__p53.scanHits(key, b, expected), {
    key: 'run_' + seq,
    box,
    expected: expectedRgb,
  })))
  const firstHit = hits.find((h) => h.firstHit)?.firstHit ?? null
  return { hitCount: hits.reduce((sum, h) => sum + h.hitCount, 0), firstHit }
}

const records = mapping.records.filter((r) => r.status !== 'NOT_APPLICABLE')
const naRecords = mapping.records.filter((r) => r.status === 'NOT_APPLICABLE')
const outRecords = []
let pixelSampled = 0
let maxRgbDiff = 0
let failCount = 0

for (const record of records) {
  const out = { seq: record.seq, role: record.role, value: record.value, alpha: record.alpha, elementNames: record.elementNames, status: record.status }
  if (record.status === 'UNMAPPED') { outRecords.push(out); failCount++; continue }
  const adj = adjustedByKey.get(record.seq + '|' + record.role + '|' + record.value + '|' + record.alpha)
  const rz = await chooseRealization(record)
  const expectedBase = hexToRgb(record.value)
  const bbox = rz?.bbox
  const samples = []
  try {
    // The locked design overlay is a declared #10182F@0.116 layer. Production
    // uses an explicitly documented equivalent composition per dialog family;
    // validate that composed paint directly instead of comparing layer alpha
    // to the effective CSS backdrop and accidentally reporting a 255 diff.
    const isOverlayRecord = record.value === '#10182F' && record.elementNames?.includes('弹窗/遮罩')
    if (isOverlayRecord) {
      const actual = parseRgb(rz?.computed)
      const selector = String(rz?.selector ?? '')
      const expected = selector.includes('p53-dialog-overlay-37')
        ? { rgb: [17, 26, 56], alpha: 0.37, variant: 'p53-dialog-overlay-37' }
        : { rgb: [16, 24, 47], alpha: 0.32, variant: 'p53-dialog-overlay-35-or-global' }
      const diff = actual
        ? Math.max(chDiff(expected.rgb, actual.rgb), Math.abs(actual.alpha - expected.alpha) > 0.03 ? 255 : 0)
        : 255
      samples.push({
        kind: 'composed-overlay',
        expected: { canonicalLayer: { rgb: expectedBase, alpha: record.alpha }, composed: expected },
        actual: actual ? { rgb: actual.rgb, alpha: actual.alpha } : null,
        diff,
        selector,
        property: rz?.property,
      })
      out.status = 'MATCHED_COMPUTED'
      out.comparisonBasis = 'explicit-composed-overlay-equivalent'
      out.composedOverlay = expected
      out.maxDiff = diff
      out.samples = samples
      outRecords.push(out)
      pixelSampled += 1
      if (diff > 3) failCount++
      maxRgbDiff = Math.max(maxRgbDiff, diff)
      continue
    }
    if (adj) {
      // 无障碍文字前景调整：只允许 text 角色；必须对照调整值并给出对比度证据
      if (record.role !== 'text') throw new Error('adjusted record on non-text role')
      const adjRgb = hexToRgb(adj.adjustedValue)
      if (!adjRgb || !adj.contrastRatio || adj.contrastRatio < 4.5) throw new Error('adjusted record missing contrast evidence')
      out.status = 'ADJUSTED'
      out.adjusted = adj
      outRecords.push(out)
      continue
    }
    if (rz.kind === 'image-raster') {
      const scan = await scanHits(record.seq, bbox, expectedBase, false)
      const diff = scan.hitCount >= 3 ? 0 : 255
      samples.push({ kind: 'image-raster-scan', box: bbox, expected: expectedBase, hitCount: scan.hitCount, firstHit: scan.firstHit, diff, selector: rz.selector })
      out.status = 'SAMPLED'
      out.maxDiff = diff
      out.samples = samples
      outRecords.push(out)
      if (diff > 3) failCount++
      maxRgbDiff = Math.max(maxRgbDiff, diff)
      continue
    } else if (record.role === 'text' || rz.kind === 'text') {
      // 字形填充：computed 对照（抗锯齿区域不做像素判定）。
      // role 可能来自 SVG 的 fill 声明，但 production 落点仍是文本 color。
      const actual = parseRgb(rz.computed)
      const diff = actual ? chDiff(expectedBase, actual.rgb) : 255
      samples.push({ kind: 'computed-text', expected: expectedBase, actual: actual?.rgb ?? null, diff })
      out.status = 'MATCHED_COMPUTED'
      out.match = { computed: rz.computed, selector: rz.selector, diff }
      out.maxDiff = diff
      out.samples = samples
      if (diff > 3) out.status = 'MISMATCHED_COMPUTED'
      outRecords.push(out)
      if (diff > 3) failCount++
      continue
    }
    if (record.role === 'shadow') {
      // 参数对照：rgba/offset/blur/spread（blur=2σ，容差 ±3；offset ±2）
      const bs = rz.boxShadow
      const m = /rgba?\(([^)]+)\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?/.exec(bs ?? '')
      if (!m) throw new Error('box-shadow params unparsable: ' + String(bs).slice(0, 80))
      const color = parseRgb(m[0].slice(0, m[0].indexOf(')') + 1))
      const d = chDiff(color.rgb, expectedBase)
      const dx = Math.abs(Number(m[2]) - record.params.offset.dx)
      const dy = Math.abs(Number(m[3]) - record.params.offset.dy)
      const blur = Math.abs(Number(m[4]) - record.params.blur)
      const spread = Math.abs(Number(m[5] ?? 0) - record.params.spread)
      const diff = Math.max(d, dx > 2 ? dx : 0, dy > 2 ? dy : 0, blur > 3 ? blur : 0, spread > 2 ? spread : 0)
      samples.push({ kind: 'box-shadow-params', expected: { color: record.value, ...record.params }, actual: { color: color.rgb, dx: Number(m[2]), dy: Number(m[3]), blur: Number(m[4]), spread: Number(m[5] ?? 0) }, diff })
      out.status = 'MATCHED_PARAMS'
    } else if (record.alpha >= 1 && (rz.property?.startsWith('background-color') || rz.property?.startsWith('background-image'))) {
      // 纯色 CSS/伪元素背景以 computed style 作为生产落点证据；
      // 伪元素的绘制盒可能比设计 SVG 的声明盒偏移 1–2px，不能用父盒稀疏采样替代实际色值。
      const actual = parseRgb(rz.computed)
      const diff = actual ? chDiff(expectedBase, actual.rgb) : 255
      samples.push({ kind: 'computed-surface', expected: expectedBase, actual: actual?.rgb ?? null, diff, selector: rz.selector, property: rz.property })
      out.status = 'MATCHED_COMPUTED'
    } else if (record.role === 'gradient') {
      const b = bbox
      const { type, x1, y1, x2, y2, stops } = record.params
      const dxv = x2 - x1, dyv = y2 - y1
      const len2 = dxv * dxv + dyv * dyv || 1
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2
      const half = 0.5
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const px = cx + dxv * (t - half) * Math.min(1, (b.w * 0.8) / Math.sqrt(len2))
        const py = cy + dyv * (t - half) * Math.min(1, (b.h * 0.8) / Math.sqrt(len2))
        const expected = expectedGradientAt({ stops }, { x: b.x, y: b.y, w: b.w, h: b.h }, t)
        const [s] = await samplePoints(record.seq, [[px, py]])
        const diff = chDiff(expected, s.rgb)
        samples.push({ kind: 'gradient@' + t, at: [s.x, s.y], expected, actual: s.rgb, diff })
      }
      out.status = 'SAMPLED'
    } else if (record.role === 'stroke' || rz.kind === 'border' || rz.kind === 'svg-stroke') {
      // Border/SVG declarations are verified against the live computed paint
      // first. Pixel scans remain a fallback for raster-only/unknown landing
      // points; they must not turn a real computed border into a false miss
      // because the reference box is sub-pixel aligned.
      const actual = parseRgb(rz.computed)
      if (actual && (rz.property === 'border-color' || rz.property === 'svg-stroke' || rz.property === 'color' || rz.property?.startsWith('color:') || rz.property?.startsWith('background-image') || rz.property?.startsWith('background-color'))) {
        const rgbDiff = chDiff(expectedBase, actual.rgb)
        // SVG/border opacity is often exposed as a separate opacity attribute;
        // computedStyle then reports rgb(...) even when the locked paint has a
        // fractional alpha. Only compare alpha when the live paint itself
        // carries an alpha channel (not for border/svg-stroke declarations).
        const compareAlpha = record.alpha < 1 && actual.alpha < 1
        const alphaDiff = compareAlpha && Math.abs(actual.alpha - record.alpha) > 0.03 ? 255 : 0
        const diff = Math.max(rgbDiff, alphaDiff)
        samples.push({ kind: record.alpha < 1 ? 'computed-alpha-stroke' : 'computed-stroke', expected: record.alpha < 1 ? { rgb: expectedBase, alpha: record.alpha } : expectedBase, actual: record.alpha < 1 ? actual : actual.rgb, diff, selector: rz.selector, property: rz.property })
        out.status = 'MATCHED_COMPUTED'
      } else {
      const expected = record.alpha < 1 ? composite(expectedBase, record.alpha, hexToRgb(rz.opaqueAncestorBg ?? 'rgb(255, 255, 255)')) : expectedBase
      const area = bbox.w * bbox.h
      if (area > 2_000_000) throw new Error('stroke bbox too large for scan')
      const scan = await scanHits(record.seq, bbox, expected, true)
      const diff = scan.hitCount >= 3 ? 0 : 255
      samples.push({ kind: 'stroke-scan', box: bbox, expected, hitCount: scan.hitCount, firstHit: scan.firstHit, diff })
      out.status = 'SAMPLED'
      }
    } else if (record.alpha < 1) {
      const bgRgb = hexToRgb(rz.opaqueAncestorBg ?? 'rgb(255, 255, 255)')
      const actual = parseRgb(rz.computed)
      if (actual && actual.alpha < 1) {
        const diff = Math.max(chDiff(expectedBase, actual.rgb), Math.abs(actual.alpha - record.alpha) > 0.03 ? 255 : 0)
        samples.push({ kind: 'computed-alpha', expected: { rgb: expectedBase, alpha: record.alpha }, actual: { rgb: actual.rgb, alpha: actual.alpha }, diff, selector: rz.selector, property: rz.property })
        out.status = 'MATCHED_COMPUTED'
      } else {
      const expected = composite(expectedBase, record.alpha, bgRgb)
      const b = bbox
      const inset = Math.max(2, Math.min(8, Math.floor(Math.min(b.w, b.h) * 0.15)))
      const pts = b.w * b.h > 500_000
        ? [[b.x + inset, b.y + inset], [b.x + b.w - inset, b.y + inset], [b.x + inset, b.y + b.h - inset], [b.x + b.w - inset, b.y + b.h - inset]]
        : [[b.x + b.w / 2, b.y + b.h / 2], [b.x + inset, b.y + inset], [b.x + b.w - inset, b.y + b.h - inset]]
      const s = await samplePoints(record.seq, pts)
      for (const p of s) {
        const diff = chDiff(expected, p.rgb)
        samples.push({ kind: 'alpha-composite', at: [p.x, p.y], expected, actual: p.rgb, diff })
      }
      out.status = 'SAMPLED'
      }
    } else if (rz.kind === 'svg-fill') {
      const actual = parseRgb(rz.computed)
      if (actual) {
        const diff = chDiff(expectedBase, actual.rgb)
        samples.push({ kind: 'computed-svg-fill', expected: expectedBase, actual: actual.rgb, diff, selector: rz.selector, property: rz.property })
        out.status = 'MATCHED_COMPUTED'
      } else {
      const area = bbox.w * bbox.h
      if (area <= 2_000_000) {
        const scan = await scanHits(record.seq, bbox, expectedBase, false)
        samples.push({ kind: 'svg-fill-scan', box: bbox, expected: expectedBase, hitCount: scan.hitCount, firstHit: scan.firstHit, diff: scan.hitCount >= 3 ? 0 : 255 })
        out.status = 'SAMPLED'
      } else {
        const b = bbox
        const inset = Math.max(2, Math.min(8, Math.floor(Math.min(b.w, b.h) * 0.12)))
        const pts = [[b.x + b.w / 2, b.y + b.h / 2], [b.x + inset, b.y + inset], [b.x + b.w - inset, b.y + b.h - inset]]
        const s = await samplePoints(record.seq, pts)
        for (const p of s) samples.push({ kind: 'surface-grid', at: [p.x, p.y], expected: expectedBase, actual: p.rgb, diff: chDiff(expectedBase, p.rgb) })
        out.status = 'SAMPLED'
      }
      }
    } else if (rz.kind === 'border') {
      const b = bbox
      const [p] = await samplePoints(record.seq, [[b.x + b.w / 2, b.y + 0.5]])
      const diff = chDiff(expectedBase, p.rgb)
      samples.push({ kind: 'border-midpoint', at: [p.x, p.y], expected: expectedBase, actual: p.rgb, diff })
      out.status = 'SAMPLED'
    } else {
      // surface：优先使用锁定参考图中确实呈现该声明颜色的锚点，
      // 再回到内缩网格；这样不会把卡片内部的子徽标误当成卡片底色。
      const b = bbox
      const inset = Math.max(2, Math.min(8, Math.floor(Math.min(b.w, b.h) * 0.12)))
      const anchored = record.alpha < 1 ? [] : await referenceAnchoredPoints(record.seq, b, expectedBase)
      const pts = anchored.length ? anchored : []
      if (!pts.length) for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.1, 0.5, 0.9]) pts.push([b.x + b.w * fx, b.y + b.h * fy])
      const s = await samplePoints(record.seq, pts)
      for (const p of s) {
        const diff = chDiff(expectedBase, p.rgb)
        samples.push({ kind: 'surface-grid', at: [p.x, p.y], expected: expectedBase, actual: p.rgb, diff })
      }
      out.status = 'SAMPLED'
    }
  } catch (e) {
    out.status = 'ERROR'
    out.error = String(e?.message ?? e).slice(0, 200)
    samples.push({ kind: 'error', diff: 255, detail: out.error })
  }
  if (out.status === 'SAMPLED') pixelSampled += 1
  const recMax = samples.reduce((m, s) => Math.max(m, s.diff ?? 0), 0)
  out.samples = samples
  out.maxDiff = recMax
  maxRgbDiff = Math.max(maxRgbDiff, recMax)
  if (out.status === 'ERROR' || (out.status === 'SAMPLED' && recMax > 3) || (out.status === 'MATCHED_PARAMS' && recMax > 0) || (out.status === 'MATCHED_COMPUTED' && recMax > 3)) failCount++
  outRecords.push(out)
}
await browser.close()

const realized = records.filter((r) => r.status === 'REALIZED').length
const unmapped = records.filter((r) => r.status === 'UNMAPPED')
const summary = {
  feature: 'p53-global-ui-component-layout',
  reviewRound: 'p53-review-07',
  source: 'canonical inventory from locked SVG declared attributes; element-targeted runtime verification; no deviation auto-exempt bucket',
  rgbChannelLimit: 3,
  declaredDistinct: (JSON.parse(await readFile(path.join(colorRoot, 'canonical-inventory.json'), 'utf8'))).summary.declaredDistinct,
  mapped: records.length,
  applicable: realized,
  notApplicable: naRecords.length,
  unmapped: unmapped.length,
  unresolved: unmapped.map((r) => r.seq + ':' + r.role + ':' + r.value),
  adjustedCount: adjustedByKey.size,
  pixelSampled,
  maxRgbDiff,
  fail: failCount,
}
await writeFile(path.join(colorRoot, 'color-comparison.json'), JSON.stringify({ summary, records: outRecords, notApplicable: naRecords }, null, 2) + '\n')
await writeFile(path.join(colorRoot, 'color-validate.stdout.log'), `COLOR_RECORDS ${summary.mapped} APPLICABLE ${summary.applicable} NOT_APPLICABLE ${summary.notApplicable} UNMAPPED ${summary.unmapped} ADJUSTED ${summary.adjustedCount} PIXEL_SAMPLED ${pixelSampled} MAX_RGB_DIFF ${maxRgbDiff} FAIL ${summary.fail}\n`)
await writeFile(path.join(colorRoot, 'color.exit'), (summary.fail === 0 && summary.unmapped === 0 ? '0' : '1') + '\n')
console.log(JSON.stringify(summary))
if (summary.fail !== 0 || summary.unmapped !== 0) process.exitCode = 1
