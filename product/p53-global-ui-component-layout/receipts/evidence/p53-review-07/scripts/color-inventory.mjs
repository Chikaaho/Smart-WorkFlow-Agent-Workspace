/**
 * P53 EV-07b Step A：canonical 设计样式清单。
 * 只从锁定 SVG 的声明属性生成：fill/stroke/stop-color/flood-color/opacity/渐变/滤镜效果，
 * 按节点 + 视觉角色 + 完整 RGBA/效果参数去重；不做 PNG 反向推断。
 * 元素命名通过几何关联 design-geometry 命名元素（rect/image 圆/路径近似包围盒）。
 * 输出：color/canonical-inventory.json。
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const svgRoot = path.join(workspaceRoot, 'docs', 'ui', 'svg')
const geometryRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07', 'design-geometry')
const outRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07', 'color')
await mkdir(outRoot, { recursive: true })

const NAMED_COLORS = { white: '#FFFFFF', black: '#000000', red: '#FF0000', green: '#008000', blue: '#0000FF', gray: '#808080', grey: '#808080', yellow: '#FFFF00' }

function toHex(token) {
  if (!token) return null
  const t = token.trim()
  const named = NAMED_COLORS[t.toLowerCase()]
  if (named) return { value: named, alpha: 1 }
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(t)
  if (hex) {
    let v = hex[1]
    if (v.length === 3) v = v.split('').map((c) => c + c).join('')
    if (v.length === 8) return { value: '#' + v.slice(0, 6).toUpperCase(), alpha: parseInt(v.slice(6, 8), 16) / 255 }
    return { value: '#' + v.toUpperCase(), alpha: 1 }
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(t)
  if (rgb) {
    const parts = rgb[1].split(/[\s,]+/).filter(Boolean)
    const ch = parts.slice(0, 3).map((n) => Math.round(Number(n) * (Number(n) <= 1 ? 255 : 1)))
    const a = parts.length >= 4 ? Number(parts[3]) : 1
    return { value: '#' + ch.map((c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0')).join('').toUpperCase(), alpha: a }
  }
  return null
}

function pathBBox(d) {
  const tokens = [...d.matchAll(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g)].map((m) => m[0])
  const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }
  let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const point = (px, py) => { minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py) }
  const number = () => Number(tokens[i++])
  const absPoint = (px, py, rel) => ({ x: rel ? x + px : px, y: rel ? y + py : py })
  const cubicAt = (p0, p1, p2, p3, t) => ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * (t ** 2) * p2 + (t ** 3) * p3
  const quadAt = (p0, p1, p2, t) => ((1 - t) ** 2) * p0 + 2 * (1 - t) * t * p1 + (t ** 2) * p2
  const roots = (a, b, c) => {
    const out = []
    if (Math.abs(a) < 1e-9) { if (Math.abs(b) >= 1e-9) out.push(-c / b); return out }
    const disc = b * b - 4 * a * c
    if (disc >= 0) { const s = Math.sqrt(disc); out.push((-b + s) / (2 * a), (-b - s) / (2 * a)) }
    return out
  }
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++]
    if (!cmd) break
    const upper = cmd.toUpperCase(), rel = cmd !== upper, n = arity[upper]
    if (upper === 'Z') { point(sx, sy); x = sx; y = sy; cmd = null; continue }
    if (!n || i + n > tokens.length || /^[a-zA-Z]$/.test(tokens[i])) { cmd = null; continue }
    const values = Array.from({ length: n }, number)
    if (upper === 'M' || upper === 'L' || upper === 'T') {
      const p = absPoint(values[0], values[1], rel); point(p.x, p.y); x = p.x; y = p.y
      if (upper === 'M') { sx = x; sy = y; cmd = rel ? 'l' : 'L' }
    } else if (upper === 'H') { x = rel ? x + values[0] : values[0]; point(x, y) }
    else if (upper === 'V') { y = rel ? y + values[0] : values[0]; point(x, y) }
    else if (upper === 'C') {
      const p0 = { x, y }, p1 = absPoint(values[0], values[1], rel), p2 = absPoint(values[2], values[3], rel), p3 = absPoint(values[4], values[5], rel)
      point(p0.x, p0.y); point(p3.x, p3.y)
      for (const axis of ['x', 'y']) {
        const a = -p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]
        const b = 2 * (p0[axis] - 2 * p1[axis] + p2[axis])
        const c = -p0[axis] + p1[axis]
        for (const t of roots(3 * a, 2 * b, c).filter((v) => v > 0 && v < 1)) {
          const q = cubicAt(p0[axis], p1[axis], p2[axis], p3[axis], t); if (axis === 'x') point(q, y); else point(x, q)
        }
      }
      x = p3.x; y = p3.y
    } else if (upper === 'S' || upper === 'Q') {
      const p0 = { x, y }, p1 = absPoint(values[0], values[1], rel), p2 = absPoint(values[2], values[3], rel)
      point(p0.x, p0.y); point(p2.x, p2.y)
      if (upper === 'Q') {
        for (const axis of ['x', 'y']) { const t = (p0[axis] - p1[axis]) / (p0[axis] - 2 * p1[axis] + p2[axis]); if (t > 0 && t < 1) { const q = quadAt(p0[axis], p1[axis], p2[axis], t); if (axis === 'x') point(q, y); else point(x, q) } }
      } else { point(p1.x, p1.y); point(p2.x, p2.y) }
      x = p2.x; y = p2.y
    } else if (upper === 'A') {
      // Arc extrema are rare in the locked text/icon paths; endpoints plus
      // radii provide a conservative local box without pairing unrelated
      // command numbers.
      const p = absPoint(values[5], values[6], rel); point(x, y); point(p.x, p.y); point(x - Math.abs(values[0]), y - Math.abs(values[1])); point(x + Math.abs(values[0]), y + Math.abs(values[1])); point(p.x - Math.abs(values[0]), p.y - Math.abs(values[1])); point(p.x + Math.abs(values[0]), p.y + Math.abs(values[1])); x = p.x; y = p.y
    }
  }
  if (!Number.isFinite(minX)) return null
  return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) }
}

function attr(el, name) {
  const m = el.match(new RegExp(`\\b${name}="([^"]*)"`))
  return m ? m[1] : null
}

// 解析 SVG：维护 <g translate> 偏移栈与 defs/mask/clip 上下文
function parseSvg(svg) {
  const records = []
  const gradients = new Map()
  const filters = new Map()
  const translateStack = []
  let offsetX = 0, offsetY = 0
  let depth = { defs: 0, mask: 0, clip: 0, filter: 0, gradient: 0 }
  const tokenStream = svg.match(/<[^>]+>|<\/[a-zA-Z]+>|[^<>]+/g) ?? []
  let currentGradient = null
  for (const token of tokenStream) {
    if (token.startsWith('<')) {
      const close = token.startsWith('</')
      const tag = (close ? token.slice(2, -1) : token.slice(1)).split(/[\s>]/)[0]
      if (close) {
        if (tag === 'g') {
          const popped = translateStack.pop()
          if (popped) { offsetX -= popped[0]; offsetY -= popped[1] }
        }
        if (depth[tag] !== undefined && depth[tag] > 0) depth[tag]--
        if (tag === 'linearGradient' || tag === 'radialGradient') currentGradient = null
        continue
      }
      const selfClosing = token.endsWith('/>')
      if (tag === 'g') {
        const tr = attr(token, 'transform')
        const m = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(tr ?? '')
        if (m) { offsetX += Number(m[1]); offsetY += Number(m[2]); translateStack.push([Number(m[1]), Number(m[2])]) }
        else translateStack.push(null)
        continue
      }
      if (['defs', 'mask', 'clipPath', 'filter', 'linearGradient', 'radialGradient', 'pattern'].includes(tag)) {
        depth[tag] = (depth[tag] ?? 0) + 1
        if (tag === 'linearGradient' || tag === 'radialGradient') {
          const id = attr(token, 'id')
          const stops = []
          currentGradient = { id, tag, stops, raw: token, x1: attr(token, 'x1'), y1: attr(token, 'y1'), x2: attr(token, 'x2'), y2: attr(token, 'y2'), cx: attr(token, 'cx'), cy: attr(token, 'cy'), r: attr(token, 'r') }
          gradients.set(id, currentGradient)
          if (selfClosing) { depth[tag]--; currentGradient = null }
        }
        if (tag === 'filter') {
          const id = attr(token, 'id')
          filters.set(id, { id, feFlood: null, colorMatrices: [], feOffset: null, feGaussianBlur: null })
          if (selfClosing) depth[tag]--
        }
        continue
      }
      if (tag === 'stop' && currentGradient) {
        const color = toHex(attr(token, 'stop-color'))
        const offset = attr(token, 'offset') ?? '0'
        const stopOpacity = attr(token, 'stop-opacity')
        if (color) currentGradient.stops.push({ offset: offset.endsWith('%') ? Number(offset.slice(0, -1)) / 100 : Number(offset), value: color.value ?? color, alpha: (stopOpacity != null ? Number(stopOpacity) : 1) * (color.alpha ?? 1) })
        continue
      }
      if (tag === 'feFlood' || tag === 'feColorMatrix' || tag === 'feOffset' || tag === 'feGaussianBlur') {
        const flt = [...filters.values()].at(-1)
        if (flt) {
          if (tag === 'feColorMatrix') (flt.colorMatrices ??= []).push(token)
          else flt[tag] = token
        }
        continue
      }
      // 可见绘制元素
      const hidden = depth.defs > 0 || depth.mask > 0 || depth.clip > 0 || depth.filter > 0 || depth.gradient > 0 || depth.pattern > 0 || attr(token, 'display') === 'none'
      if (!hidden) {
        const ownTr = attr(token, 'transform')
        const m = ownTr ? /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(ownTr) : null
        const dx = (m ? Number(m[1]) : 0) + offsetX
        const dy = (m ? Number(m[2]) : 0) + offsetY
        const geomBase = { tag }
        let geom = null
        if (tag === 'rect') {
          const x = Number(attr(token, 'x') ?? 0) + dx, y = Number(attr(token, 'y') ?? 0) + dy
          geom = { x, y, w: Number(attr(token, 'width') ?? 0), h: Number(attr(token, 'height') ?? 0) }
        } else if (tag === 'circle') {
          const cx = Number(attr(token, 'cx') ?? 0) + dx, cy = Number(attr(token, 'cy') ?? 0) + dy, r = Number(attr(token, 'r') ?? 0)
          geom = { x: cx - r, y: cy - r, w: r * 2, h: r * 2 }
        } else if (tag === 'ellipse') {
          const cx = Number(attr(token, 'cx') ?? 0) + dx, cy = Number(attr(token, 'cy') ?? 0) + dy
          geom = { x: cx - Number(attr(token, 'rx') ?? 0), y: cy - Number(attr(token, 'ry') ?? 0), w: Number(attr(token, 'rx') ?? 0) * 2, h: Number(attr(token, 'ry') ?? 0) * 2 }
        } else if (tag === 'line') {
          const x1 = Number(attr(token, 'x1') ?? 0) + dx, y1 = Number(attr(token, 'y1') ?? 0) + dy
          const x2 = Number(attr(token, 'x2') ?? 0) + dx, y2 = Number(attr(token, 'y2') ?? 0) + dy
          geom = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) }
        } else if (tag === 'image' || tag === 'polygon' || tag === 'polyline') {
          if (tag === 'image') {
            const x = Number(attr(token, 'x') ?? 0) + dx, y = Number(attr(token, 'y') ?? 0) + dy
            geom = { x, y, w: Number(attr(token, 'width') ?? 0), h: Number(attr(token, 'height') ?? 0) }
          } else {
            const pts = [...(attr(token, 'points') ?? '').matchAll(/-?\d+(?:\.\d+)?/g)].map((n) => Number(n[0]))
            if (pts.length >= 4) {
              const xs = pts.filter((_, i) => i % 2 === 0), ys = pts.filter((_, i) => i % 2 === 1)
              geom = { x: Math.min(...xs) + dx, y: Math.min(...ys) + dy, w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
            }
          }
        } else if (tag === 'path') {
          const raw = pathBBox(attr(token, 'd') ?? '')
          if (raw) geom = { x: raw.x + dx, y: raw.y + dy, w: raw.w, h: raw.h }
        }
        const paint = (name) => {
          const raw = attr(token, name)
          if (!raw || raw === 'none') return null
          if (raw.startsWith('url(')) {
            const id = /url\(#([^)]+)\)/.exec(raw)?.[1]
            const g = gradients.get(id)
            if (g) return { kind: 'gradient', gradientId: id }
            return null
          }
          const c = toHex(raw)
          return c ? { kind: 'solid', ...c } : null
        }
        const fill = paint('fill')
        const stroke = paint('stroke')
        const fillOpacity = attr(token, 'fill-opacity') != null ? Number(attr(token, 'fill-opacity')) : null
        const strokeOpacity = attr(token, 'stroke-opacity') != null ? Number(attr(token, 'stroke-opacity')) : null
        const elemOpacity = attr(token, 'opacity') != null ? Number(attr(token, 'opacity')) : 1
        const strokeWidth = attr(token, 'stroke-width') != null ? Number(attr(token, 'stroke-width')) : null
        const filterRef = (attr(token, 'filter') ?? '').match(/url\(#([^)]+)\)/)?.[1]
        const record = { tag, geom: geom ? { x: Math.round(geom.x * 100) / 100, y: Math.round(geom.y * 100) / 100, w: Math.round(geom.w * 100) / 100, h: Math.round(geom.h * 100) / 100 } : null, fill, stroke, fillOpacity, strokeOpacity, elemOpacity, strokeWidth, filterRef }
        if (record.fill || record.stroke || record.filterRef) records.push(record)
      }
    }
  }
  return { records, gradients, filters }
}

// design-geometry 命名元素缓存（seq → elements）
const geometryCache = new Map()
async function loadGeometry(seq) {
  if (geometryCache.has(seq)) return geometryCache.get(seq)
  let design = null
  try { design = JSON.parse(await readFile(path.join(geometryRoot, seq + '-design.json'), 'utf8')) } catch {}
  geometryCache.set(seq, design)
  return design
}

function correlateName(seq, geom, design) {
  if (!geom || !design) return null
  let best = null
  for (const el of design.elements) {
    if (el.hidden) continue
    const dx = Math.abs(el.x - geom.x), dy = Math.abs(el.y - geom.y)
    const dw = Math.abs(el.w - geom.w), dh = Math.abs(el.h - geom.h)
    const score = dx + dy + dw * 0.5 + dh * 0.5
    const tol = geom.tag === 'path' ? 30 : 2
    if (dx <= tol && dy <= tol && dw <= tol && dh <= tol * 2) {
      if (!best || score < best.score) best = { name: el.name, score }
    }
  }
  return best?.name ?? null
}

const files = (await readdir(svgRoot)).filter((f) => f.endsWith('.svg')).sort()
const nodes = []
let globalKey = new Map()
for (const file of files) {
  const seq = file.slice(0, 2)
  if (seq === '31') continue // 方向 §5：节点31仅未来参考
  const svg = await readFile(path.join(svgRoot, file), 'utf8')
  const { records, gradients, filters } = parseSvg(svg)
  const design = await loadGeometry(seq)
  const canonical = new Map()
  const add = (role, paint, params, geom, extra = {}) => {
    const value = paint.value ?? paint.kind
    const alpha = Math.round((paint.alpha ?? 1) * 1000) / 1000
    const elementName = correlateName(seq, geom, design)
    // 去重口径（提示07 §5.1）：节点 + 视觉角色 + 完整 RGBA/效果参数；元素名/几何作为证据保留
    const sig = JSON.stringify([role, value, alpha, params])
    const hit = canonical.get(sig)
    if (hit) {
      hit.count += 1
      if (geom && hit.geoms.length < 32 && !hit.geoms.some((g) => JSON.stringify(g) === JSON.stringify(geom))) hit.geoms.push(geom)
      if (elementName && hit.elementNames.length < 6 && !hit.elementNames.includes(elementName)) hit.elementNames.push(elementName)
      if (extra.elementTag && hit.elementTags.length < 8 && !hit.elementTags.includes(extra.elementTag)) hit.elementTags.push(extra.elementTag)
    } else {
      canonical.set(sig, { seq, role, value, alpha, params, geom, geoms: geom ? [geom] : [], elementNames: elementName ? [elementName] : [], elementTags: extra.elementTag ? [extra.elementTag] : [], count: 1, ...extra })
    }
  }
  for (const r of records) {
    if (r.filterRef) {
      const flt = filters.get(r.filterRef)
      if (flt) {
        // Figma dropShadow 导出：颜色来自带非零 RGB 常量列（values[4]/[9]/[14]）的 feColorMatrix，
        // alpha 列为 values[18]；hardAlpha 矩阵（RGB 常量全 0）跳过；无颜色矩阵时回退 feFlood（flood-opacity>0）。
        let color = null, alpha = 1, blur = 0, dx = 0, dy = 0
        const matrices = [...(flt.colorMatrices ?? [])]
        for (const cm of matrices) {
          const values = (attr(cm, 'values') ?? '').split(/[\s,]+/).filter(Boolean).map(Number)
          if (values.length < 20) continue
          const rr = values[4], gg = values[9], bb = values[14], aa = values[18]
          if (![rr, gg, bb, aa].every((v) => Number.isFinite(v))) continue
          if (rr === 0 && gg === 0 && bb === 0) continue // hardAlpha/背景修正矩阵
          color = '#' + [rr, gg, bb].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
          alpha = aa
        }
        if (!color && flt.feFlood) {
          const fo = Number(attr(flt.feFlood, 'flood-opacity') ?? 1)
          if (fo > 0) {
            const c = toHex(attr(flt.feFlood, 'flood-color') ?? '#000000')
            if (c) { color = c.value ?? c; alpha = fo }
          }
        }
        if (flt.feOffset) { dx = Number(attr(flt.feOffset, 'dx') ?? 0); dy = Number(attr(flt.feOffset, 'dy') ?? 0) }
        if (flt.feGaussianBlur) blur = Number(attr(flt.feGaussianBlur, 'stdDeviation') ?? 0) * 2
        if (color) add('shadow', { value: color, alpha }, { offset: { dx, dy }, blur, spread: 0 }, r.geom, { elementTag: r.tag })
      }
    }
    if (r.fill?.kind === 'gradient') {
      const g = gradients.get(r.fill.gradientId)
      if (g && g.stops.length) {
        const stops = g.stops.map((s) => ({ offset: s.offset, value: s.value, alpha: Math.round(s.alpha * 1000) / 1000 }))
        let params
        if (g.tag === 'linearGradient') {
          const x1 = Number(g.x1 ?? 0), y1 = Number(g.y1 ?? 0), x2 = Number(g.x2 ?? 0), y2 = Number(g.y2 ?? 0)
          params = { type: 'linear', x1, y1, x2, y2, stops }
        } else {
          params = { type: 'radial', cx: Number(g.cx ?? 0), cy: Number(g.cy ?? 0), r: Number(g.r ?? 0), stops }
        }
        add('gradient', { value: stops.map((s) => s.value).join('>'), alpha: 1 }, params, r.geom, { elementTag: r.tag })
      }
    } else if (r.fill) {
      const alpha = Math.round((r.fill.alpha ?? 1) * (r.fillOpacity ?? 1) * r.elemOpacity * 1000) / 1000
      add('fill', { value: r.fill.value, alpha }, null, r.geom, { elementTag: r.tag })
    }
    if (r.stroke?.kind === 'solid') {
      const alpha = Math.round((r.stroke.alpha ?? 1) * (r.strokeOpacity ?? 1) * r.elemOpacity * 1000) / 1000
      add('stroke', { value: r.stroke.value, alpha }, { strokeWidth: r.strokeWidth }, r.geom, { elementTag: r.tag })
    }
  }
  for (const rec of canonical.values()) {
    globalKey.set(rec.seq + '|' + rec.role + '|' + rec.value + '|' + rec.alpha + '|' + JSON.stringify(rec.params ?? null), rec)
  }
  // 叠加半透明层合成：设计遮罩为多层同色低透明度叠加（如三层 #10182F@0.116 ≈ 有效 0.309）。
  // 对覆盖大半页面且 count≥2 的低透明度 fill，按 α_eff = 1-(1-α)^count 合成为单条有效记录。
  for (const rec of canonical.values()) {
    if (rec.role === 'fill' && rec.alpha > 0 && rec.alpha < 0.4 && rec.count >= 2 && rec.geom
      && rec.geom.w >= 1000 && rec.geom.h >= 700) {
      rec.alpha = Math.round((1 - Math.pow(1 - rec.alpha, rec.count)) * 1000) / 1000
      rec.compositedLayers = rec.count
      rec.count = 1
    }
  }
  nodes.push({ seq, file, canonicalCount: canonical.size, records: [...canonical.values()].sort((a, b) => (a.role + a.value).localeCompare(b.role + b.value)) })
}
let distinctTotal = 0
const seen = new Set()
for (const key of globalKey.keys()) {
  const value = key.split('|').slice(2, 4).join('|')
  if (!seen.has(value)) { seen.add(value); distinctTotal++ }
}
const summary = {
  generatedAt: new Date().toISOString(),
  source: 'locked SVG declared attributes only (fill/stroke/stop-color/flood/opacity/gradient/filter); PNG not used for token generation',
  nodeCount: nodes.length,
  declaredDistinct: distinctTotal,
  perNodeCanonical: nodes.reduce((s, n) => s + n.canonicalCount, 0),
}
await writeFile(path.join(outRoot, 'canonical-inventory.json'), JSON.stringify({ summary, nodes }, null, 2) + '\n')
console.log('INVENTORY_NODES', nodes.length, 'DECLARED_DISTINCT', distinctTotal, 'CANONICAL_RECORDS', summary.perNodeCanonical)
