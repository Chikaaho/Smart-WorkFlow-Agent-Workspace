/**
 * P53 review-06 设计几何提取：从锁定 Figma metadata XML 提取指定节点的元素与文本绝对几何。
 * 坐标系规律（已对节点02顶栏/侧栏/筛选区验证）：名称含“/”的组件子级为相对坐标，
 * 普通命名元素的子级为页面绝对坐标。
 * 用法：node design-geometry.mjs <seq> [--texts-only]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
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
const xmlPath = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-04',
  'reference',
  'figma-metadata-page-0-1.xml',
)
const indexPath = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-04',
  'reference',
  'local-design-index.json',
)

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function parseTree(xml) {
  const nodeRe = /<(\w+)\s+([^>]*?)\/>|<(\w+)\s+([^>]*?)>|<\/(\w+)>/g
  const root = { tag: 'root', name: 'root', children: [], x: 0, y: 0, w: 1440, h: 1024, rel: false }
  const stack = [root]
  for (const m of xml.matchAll(nodeRe)) {
    if (m[1]) {
      // self-closing
      const el = makeEl(m[1], m[2])
      stack.at(-1).children.push(el)
    } else if (m[3]) {
      const el = makeEl(m[3], m[4])
      stack.at(-1).children.push(el)
      if (el.tag !== 'svg' && el.tag !== 'g' && el.tag !== 'defs') stack.push(el)
    } else {
      const tag = m[5]
      if (tag === 'svg' || tag === 'g' || tag === 'defs') continue
      stack.pop()
    }
  }
  return root
}

function makeEl(tag, attrSrc) {
  const attrs = {}
  for (const a of decodeEntities(attrSrc).matchAll(/(\w[\w-]*)="([^"]*)"/g)) attrs[a[1]] = a[2]
  return {
    tag,
    id: attrs.id ?? null,
    name: attrs.name ?? '',
    x: attrs.x !== undefined ? Number(attrs.x) : null,
    y: attrs.y !== undefined ? Number(attrs.y) : null,
    w: attrs.width !== undefined ? Number(attrs.width) : null,
    h: attrs.height !== undefined ? Number(attrs.height) : null,
    hidden: attrs.hidden === 'true',
    children: [],
  }
}

/** 计算绝对坐标：父名含“/”→子坐标相对父；否则子坐标即页面绝对。 */
function walk(el, originX, originY, into) {
  for (const child of el.children) {
    if (child.x === null || child.y === null) {
      walk(child, originX, originY, into)
      continue
    }
    const parentRel = Boolean(el.name && el.name.includes('/'))
    const absX = parentRel ? originX + child.x : child.x
    const absY = parentRel ? originY + child.y : child.y
    into.push({
      tag: child.tag,
      id: child.id,
      name: child.name,
      x: Math.round(absX * 100) / 100,
      y: Math.round(absY * 100) / 100,
      w: child.w,
      h: child.h,
      hidden: child.hidden,
    })
    walk(child, absX, absY, into)
  }
}

const seq = String(Number(process.argv[2] ?? 2)).padStart(2, '0')
const textsOnly = process.argv.includes('--texts-only')
const index = JSON.parse(await readFile(indexPath, 'utf8'))
const node = index.nodes.find((n) => String(n.seq).padStart(2, '0') === seq)
if (!node) throw new Error('node not in locked index: ' + seq)
const marker = 'id="' + node.figma_node_id + '"'
const xml = await readFile(xmlPath, 'utf8')
const at = xml.indexOf(marker)
if (at < 0) throw new Error('figma node not found in xml: ' + node.figma_node_id)
const begin = xml.lastIndexOf('<', at)
// 截取该 frame 的完整子树：按开闭标签配对
let depth = 0
let end = begin
const tagRe = /<(\w+)\s+([^>]*?)\/>|<(\w+)\s+([^>]*?)>|<\/(\w+)>/g
tagRe.lastIndex = begin
for (const m of xml.matchAll(tagRe)) {
  if (m.index < begin) continue
  if (m[1]) continue
  if (m[3]) {
    if (['svg', 'g', 'defs'].includes(m[3])) continue
    depth++
  } else {
    if (['svg', 'g', 'defs'].includes(m[5])) continue
    depth--
    if (depth === 0) {
      end = m.index + m[0].length
      break
    }
  }
}
const subtree = xml.slice(begin, end)
const tree = parseTree(subtree)
const flat = []
walk(tree, 0, 0, flat)
const out = {
  seq,
  name: node.name,
  figma_node_id: node.figma_node_id,
  elements: textsOnly ? flat.filter((e) => e.tag === 'text' && !e.hidden) : flat,
}
const outDir = path.join(evidenceRoot, 'design-geometry')
await mkdir(outDir, { recursive: true })
const outPath = path.join(outDir, seq + '-design.json')
await writeFile(outPath, JSON.stringify(out, null, 1) + '\n')
console.log('WROTE ' + outPath + ' elements=' + out.elements.length)
