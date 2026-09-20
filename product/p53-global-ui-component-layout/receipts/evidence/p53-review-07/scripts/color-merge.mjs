/**
 * P53 EV-06c Step C：为无字面量落点的设计值自动匹配最近生产色（ΔRGB 每通道 ≤3 视为同一令牌实现），
 * 产出：auto-merged 记录 + needsWork 清单（生产中不存在近邻，需要补 CSS 落地）。
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const colorRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07', 'color')
const map = JSON.parse(await readFile(path.join(colorRoot, 'color-token-map.json'), 'utf8'))

const toRgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16))
const diff = (a, b) => Math.max(...toRgb(a).map((v, i) => Math.abs(v - toRgb(b)[i])))

const mappedRecords = map.records.filter((r) => r.hitCount > 0)
// 候选生产色 = tokens.css/生产 CSS 中实际存在的值（即 mapped 记录的 value 本身）
const palette = mappedRecords.map((r) => r.value)

const merged = []
const needsWork = []
for (const r of map.records) {
  if (r.hitCount > 0) {
    merged.push({ value: r.value, designNodes: r.designNodes, realization: { kind: 'literal', hits: r.productionHits.slice(0, 4) } })
    continue
  }
  let best = null
  for (const candidate of palette) {
    const d = diff(r.value, candidate)
    if (!best || d < best.diff) best = { value: candidate, diff: d }
  }
  if (best && best.diff <= 3) {
    const target = mappedRecords.find((m) => m.value === best.value)
    merged.push({
      value: r.value,
      designNodes: r.designNodes,
      realization: { kind: 'nearest-equivalent', nearest: best.value, expectedMaxChannelDiff: best.diff, hits: target.productionHits.slice(0, 2) },
    })
  } else {
    needsWork.push({ value: r.value, designNodes: r.designNodes, nearest: best?.value ?? null, nearestDiff: best?.diff ?? null })
  }
}

await writeFile(
  path.join(colorRoot, 'color-realization.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), distinct: map.records.length, realized: merged.length, needsWork: needsWork.length, merged, needsWorkList: needsWork }, null, 2) + '\n',
)
console.log('REALIZED', merged.length, 'NEEDS_WORK', needsWork.length)
for (const n of needsWork) console.log('  ', n.value, 'nodes:', n.designNodes.slice(0, 6).join(','), 'nearest', n.nearest, n.nearestDiff)
