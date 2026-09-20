/**
 * P53 EV-06c Step A：从锁定的 32 组 SVG 提取全部设计颜色/渐变/阴影属性值。
 * 输出：design-colors.json（每节点原始值 + 全局去重清单，含来源节点与属性种类）。
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const svgRoot = path.join(workspaceRoot, 'docs', 'ui', 'svg')
const outRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07', 'color')
await mkdir(outRoot, { recursive: true })

const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const FUNCS = /\b(rgba|rgb|hsla|hsl)\(([^)]*)\)/g

function normalizeHex(h) {
  let v = h.slice(1)
  if (v.length === 3) v = v.split('').map((c) => c + c).join('')
  if (v.length === 8) v = v.slice(0, 6)
  return '#' + v.toUpperCase()
}
function parseFunc(name, body) {
  const parts = body.split(/[\s,]+/).filter(Boolean).map(Number)
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null
  const [r, g, b] = parts
  const to255 = (v) => (name.startsWith('hsl') ? null : Math.round(v * (v <= 1 ? 255 : 1)))
  let R = to255(r), G = to255(g), B = to255(b)
  if (name.startsWith('hsl')) {
    const h = r % 360, s = Math.min(Math.max(g, 0), 100) / 100, l = Math.min(Math.max(b, 0), 100) / 100
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2
    const seg = Math.floor(h / 60) % 6
    const table = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][seg]
    R = Math.round((table[0] + m) * 255); G = Math.round((table[1] + m) * 255); B = Math.round((table[2] + m) * 255)
  }
  return '#' + [R, G, B].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}
function extractColors(svg) {
  const found = []
  for (const m of svg.matchAll(FUNCS)) {
    const v = parseFunc(m[1], m[2])
    if (v) found.push({ raw: m[0], value: v, kind: m[1] })
  }
  for (const m of svg.matchAll(HEX)) found.push({ raw: m[0], value: normalizeHex(m[0]), kind: 'hex' })
  return found
}
function extractShadows(svg) {
  const out = []
  const filterRe = /<filter[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/filter>/g
  for (const f of svg.matchAll(filterRe)) {
    const drops = [...f[2].matchAll(/<feDropShadow([^>]*)>/g)].map((m) => m[1].trim())
    if (drops.length) out.push({ filterId: f[1], drops })
  }
  return out
}

const nodes = []
const global = new Map()
for (const file of (await readdir(svgRoot)).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = await readFile(path.join(svgRoot, file), 'utf8')
  const seq = file.slice(0, 2)
  const colors = extractColors(svg)
  const perNode = new Map()
  for (const c of colors) {
    perNode.set(c.value, (perNode.get(c.value) ?? 0) + 1)
    const g = global.get(c.value) ?? { value: c.value, nodes: [], count: 0 }
    if (!g.nodes.includes(seq)) g.nodes.push(seq)
    g.count += 1
    global.set(c.value, g)
  }
  nodes.push({ seq, file, distinct: perNode.size, colors: [...perNode.entries()].map(([value, count]) => ({ value, count })), shadows: extractShadows(svg) })
}
const summary = {
  generatedAt: new Date().toISOString(),
  svgRoot: 'docs/ui/svg',
  nodeCount: nodes.length,
  distinctTotal: global.size,
  values: [...global.values()].sort((a, b) => b.count - a.count),
}
await writeFile(path.join(outRoot, 'design-colors.json'), JSON.stringify({ summary, nodes }, null, 2) + '\n')
console.log('NODES', nodes.length, 'DISTINCT', global.size)
