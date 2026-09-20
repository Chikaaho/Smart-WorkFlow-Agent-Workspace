/**
 * P53 EV-07b Step B：canonical 记录 → 生产落点映射。
 * 在记录所属节点的 DOM computed 普查（-dom.json colorCensus）内解析生产实现；
 * 未实现时按主方向明确省略清单判定 notApplicable（绑定方向条款），其余 → unmapped（fail 驱动）。
 * 禁止 deviation 自动豁免桶；PNG 不参与映射。
 * 输出：color/color-mapping.json。
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NODES } from './p53-nodes.mjs'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07')
const colorRoot = path.join(evidenceRoot, 'color')

const inventory = JSON.parse(await readFile(path.join(colorRoot, 'canonical-inventory.json'), 'utf8'))

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

// 主方向明确省略的设计元素 → notApplicable 绑定条款（realize-first：仅在无生产实现时生效）
const OMISSIONS = [
  { seqs: ['05'], namePattern: /公告|知识|全局搜索|趋势|关注|内容管理/, clause: 'direction §4.3：公告/知识/全局搜索/趋势/关注无真实数据源，设计区块可省略' },
  { seqs: ['07', '09'], namePattern: /IoT|Agent|智能|指令|起草|动态审批|动态规则/, clause: 'direction §4.4：IoT指令/Agent/起草/动态审批规则无正式契约，不得出现可用入口' },
  { seqs: ['07', '09', '13'], namePattern: /监听器|前后置|处理器/, clause: 'direction §4.4/§5：监听器与前后置处理器无契约则无入口' },
  { seqs: ['12'], namePattern: /规则|自动化/, clause: 'direction §5 node12：无动态规则引擎时不展示规则 tab' },
  { seqs: ['22', '23', '24', '25', '26'], namePattern: /行政办公|财务管理|IT运维|设备管理|平台权限/, clause: 'direction §4.3/§5：五类设计分类不写死生产种子，分类缺失时不造卡片' },
]

// 载入各节点 census
const censusByNode = new Map()
for (const seq of Object.keys(NODES)) {
  const cfg = NODES[seq]
  try {
    const dom = JSON.parse(await readFile(path.join(evidenceRoot, cfg.family, seq + '-dom.json'), 'utf8'))
    if (dom.colorCensus) {
      const expanded = []
      for (const [computed, entry] of Object.entries(dom.colorCensus)) {
        const matches = Array.isArray(entry.matches) && entry.matches.length ? entry.matches : [entry]
        for (const match of matches) expanded.push({ computed, ...entry, ...match })
      }
      censusByNode.set(seq, expanded)
    }
  } catch {}
}

const rgbOf = (hexOrComputed) => parseRgb(hexOrComputed)?.rgb ?? null

function realizeInNode(seq, record) {
  const census = censusByNode.get(seq) ?? []
  const hits = []
  if (record.role === 'gradient') {
    const stopRgb = record.params.stops.map((s) => rgbOf(s.value))
    for (const entry of census) {
      if (!entry.bgImage || !entry.bgImage.includes('grad')) continue
      const allMatch = stopRgb.every((rgb) => {
        for (const m of entry.bgImage.matchAll(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b/g)) {
          const c = parseRgb(m[0])
          if (c && chDiff(c.rgb, rgb) <= 3) return true
        }
        return false
      })
      if (allMatch) hits.push({ ...entry, computed: entry.computed + ' [bg-image]', kind: 'gradient' })
    }
    return hits
  }
  if (record.role === 'shadow') {
    const shadowRgb = rgbOf(record.value)
    for (const entry of census) {
      if (!entry.boxShadow) continue
      for (const m of entry.boxShadow.matchAll(/rgba?\([^)]+\)/g)) {
        const c = parseRgb(m[0])
        if (c && chDiff(c.rgb, shadowRgb) <= 3) hits.push({ ...entry, computed: entry.computed + ' [box-shadow]', kind: 'shadow' })
      }
    }
    return hits
  }
  const targetRgb = rgbOf(record.value)
  if (!targetRgb) return hits
  const isBackgroundPaint = (property) => property === 'background-color' || property.startsWith('background-color:') || property === 'background-image' || property.startsWith('background-image:')
  const tags = record.elementTags ?? []
  const solidShape = tags.some((tag) => ['rect', 'circle', 'ellipse', 'polygon', 'polyline', 'image'].includes(tag))
  const thinShape = tags.includes('rect') && record.geom && (record.geom.w <= 2 || record.geom.h <= 2)
  const thinGeometry = record.geom && (record.geom.w <= 2 || record.geom.h <= 2)
  const entryAllowed = (entry) => {
    const entryThinGeometry = entry.bbox && (entry.bbox.w <= 2 || entry.bbox.h <= 2)
    if (record.role === 'fill') {
      // A declared SVG rect/circle/image is a surface or SVG paint. It cannot
      // be realized by an unrelated text/border color merely because the box
      // happens to be nearby; this was the source of the prior 218-channel
      // false match on the approval tag and flow-node fills.
      if (solidShape && !(isBackgroundPaint(entry.property) || entry.property === 'svg-fill' || (thinShape && entry.property === 'border-color'))) return false
      return isBackgroundPaint(entry.property) || entry.property === 'svg-fill' || (thinShape && entry.property === 'border-color') || (tags.includes('path') && (entry.property === 'color' || entry.property.startsWith('color:')))
    }
    if (record.role === 'stroke') {
      if (solidShape) return entry.property === 'border-color' || entry.property === 'svg-stroke' || ((thinGeometry || entryThinGeometry) && isBackgroundPaint(entry.property))
      if (thinGeometry || entryThinGeometry) return isBackgroundPaint(entry.property) || entry.property === 'border-color' || entry.property === 'svg-stroke' || entry.property === 'color' || entry.property.startsWith('color:')
      return entry.property === 'background-image' || entry.property.startsWith('background-image:') || entry.property === 'border-color' || entry.property === 'svg-stroke' || entry.property === 'color' || entry.property.startsWith('color:')
    }
    return true
  }
  for (const entry of census) {
    if (!entryAllowed(entry)) continue
    const c = parseRgb(entry.computed)
    if (!c) continue
    if (chDiff(c.rgb, targetRgb) > 3) continue
    if (record.role === 'fill' && record.alpha < 1) {
      if (Math.abs(c.alpha - record.alpha) > 0.03) continue
    } else if (record.role === 'fill' && c.alpha < 1) {
      // 不透明设计色的生产命中优先取不透明落地；半透明命中仅作兜底
      entry._translucent = true
    }
    const isCaptchaRaster = record.seq === '06' && record.value === '#5631B4' && entry.selector === 'img.login-page__captcha'
    const kind = isCaptchaRaster ? 'image-raster' : record.role === 'stroke'
      ? (entry.property === 'svg-stroke' ? 'svg-stroke' : (entry.property === 'color' || entry.property.startsWith('color:')) ? 'text' : 'border')
      : isBackgroundPaint(entry.property) ? 'surface'
        : entry.property === 'svg-fill' ? 'svg-fill'
        : (entry.property === 'color' || entry.property.startsWith('color:')) ? 'text'
          : entry.property === 'border-color' ? 'border'
            : 'surface'
    hits.push({ ...entry, kind })
  }
  // 优先级先按视觉角色，再按设计几何选择同一落点；不能再拿同色最大盒子
  // 代替设计记录所属元素，否则会把颜色采样到不相干区域。
  const geometryScore = (h) => {
    const recordGeoms = record.geoms?.length ? record.geoms : (record.geom ? [record.geom] : [])
    if (!recordGeoms.length || !h.bbox) return Number.POSITIVE_INFINITY
    return Math.min(...recordGeoms.map((a) => {
      const b = h.bbox
      const acx = a.x + a.w / 2, acy = a.y + a.h / 2
      const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2
      const center = Math.hypot(acx - bcx, acy - bcy)
      const size = Math.abs(Math.log((Math.max(1, a.w * a.h)) / Math.max(1, b.w * b.h))) * 8
      const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
      const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
      const overlap = ix * iy / Math.max(1, Math.min(a.w * a.h, b.w * b.h))
      return center + size + (1 - Math.min(1, overlap)) * 20
    }))
  }
  hits.sort((a, b) => {
    const rank = (h) => (h._translucent ? 90 : (thinShape && record.role === 'fill'
      ? { border: 0, surface: 1, 'svg-fill': 2, text: 3 }
      : (record.role === 'stroke'
      ? { 'svg-stroke': 0, border: 1, text: 2 }
      : { surface: 0, 'svg-fill': 1, text: 2, border: 3 }))[h.kind] ?? 9)
    return geometryScore(a) - geometryScore(b) || rank(a) - rank(b) || (b.area ?? b.maxArea ?? 0) - (a.area ?? a.maxArea ?? 0)
  })
  for (const hit of hits) hit._geometryScore = geometryScore(hit)
  // A design declaration can be valid while the production theme deliberately
  // uses a nearby semantic value (for example an AA-safe text color). If exact
  // matching found nothing, retain the real DOM/SVG landing point by geometry;
  // the validator will then compare the declared RGB against that landing point
  // instead of silently treating it as an omission.
  if (!hits.length) {
    const recordGeoms = record.geoms?.length ? record.geoms : (record.geom ? [record.geom] : [])
    const allowed = census.filter((entry) => {
      return entryAllowed(entry)
    })
    const geometryScore = (entry) => {
      if (!recordGeoms.length || !entry.bbox) return Number.POSITIVE_INFINITY
      return Math.min(...recordGeoms.map((a) => {
        const b = entry.bbox
        const acx = a.x + a.w / 2, acy = a.y + a.h / 2
        const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2
        const center = Math.hypot(acx - bcx, acy - bcy)
        const size = Math.abs(Math.log(Math.max(1, a.w * a.h) / Math.max(1, b.w * b.h))) * 8
        const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
        const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
        const overlap = ix * iy / Math.max(1, Math.min(a.w * a.h, b.w * b.h))
        return center + size + (1 - Math.min(1, overlap)) * 20
      }))
    }
    const rank = (entry) => record.role === 'stroke'
      ? (entry.property === 'svg-stroke' ? 0 : 1)
      : (isBackgroundPaint(entry.property) ? 0 : ({ 'svg-fill': 1, color: 2 }[entry.property] ?? 9))
    const fallback = allowed
      .map((entry) => ({ ...entry, _geometryScore: geometryScore(entry), _colorDiff: (() => { const c = parseRgb(entry.computed); return c ? chDiff(c.rgb, targetRgb) : 255 })() }))
      // A fallback is still a real landing-point claim, so require the
      // production box to be geometrically local to the locked design box.
      // The previous 90px gate admitted unrelated page-wide text/surfaces and
      // turned them into false color evidence.
      .filter((entry) => Number.isFinite(entry._geometryScore) && entry._geometryScore <= 120)
      .sort((a, b) => a._geometryScore - b._geometryScore || a._colorDiff - b._colorDiff || rank(a) - rank(b) || (b.area ?? 0) - (a.area ?? 0))
    if (fallback.length) {
      const fallbackIsCaptchaRaster = record.seq === '06' && record.value === '#5631B4' && fallback[0].selector === 'img.login-page__captcha'
      hits.push({
        ...fallback[0],
        kind: fallbackIsCaptchaRaster ? 'image-raster' : record.role === 'stroke'
          ? (fallback[0].property === 'svg-stroke' ? 'svg-stroke' : 'border')
          : isBackgroundPaint(fallback[0].property) ? 'surface'
            : fallback[0].property === 'svg-fill' ? 'svg-fill'
              : (fallback[0].property === 'color' || fallback[0].property.startsWith('color:')) ? 'text' : 'surface',
        approximate: true,
      })
    }
  }
  return hits
}

const records = []
const realizationOf = (hit, seq) => ({
  node: seq,
  kind: hit.kind,
  computed: hit.computed,
  property: hit.property,
  selector: hit.selector,
  bbox: hit.bbox,
  opaqueAncestorBg: hit.opaqueAncestorBg ?? null,
  bgImage: hit.bgImage ?? null,
  boxShadow: hit.boxShadow ?? null,
  hitCount: hit.hitCount ?? null,
  approximate: hit.approximate === true,
  geometryScore: hit._geometryScore ?? null,
  colorDiff: hit._colorDiff ?? null,
})
for (const node of inventory.nodes) {
  for (const record of node.records) {
    const hits = realizeInNode(record.seq, record)
    let status = 'UNMAPPED'
    let clause = null
    if (record.alpha === 0) {
      status = 'NOT_APPLICABLE'
      clause = '声明 alpha=0，生产渲染中无可见像素，不构成可验证视觉对象'
    } else if (hits.length > 0) status = 'REALIZED'
    else {
      const omission = OMISSIONS.find((o) => o.seqs.includes(record.seq) && record.elementNames.some((n) => o.namePattern.test(n)))
      if (omission) { status = 'NOT_APPLICABLE'; clause = omission.clause }
    }
    records.push({
      ...record,
      status,
      clause,
      realization: hits.length ? realizationOf(hits[0], record.seq) : null,
      // Keep a bounded candidate set so the validator can select the
      // geometrically corresponding landing point against the locked PNG;
      // selecting the first same-color DOM box is not sufficient evidence.
      realizations: hits.slice(0, 16).map((hit) => realizationOf(hit, record.seq)),
    })
  }
}

const byStatus = records.reduce((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {})
const summary = {
  canonicalRecords: records.length,
  REALIZED: byStatus.REALIZED ?? 0,
  NOT_APPLICABLE: byStatus.NOT_APPLICABLE ?? 0,
  UNMAPPED: byStatus.UNMAPPED ?? 0,
}
await writeFile(path.join(colorRoot, 'color-mapping.json'), JSON.stringify({ summary, records }, null, 2) + '\n')
console.log('MAPPING', JSON.stringify(summary))
for (const r of records.filter((r) => r.status === 'UNMAPPED').slice(0, 30)) {
  console.log('  UNMAPPED', r.seq, r.role, r.value, 'a=' + r.alpha, r.elementNames?.join(',') ?? '')
}
