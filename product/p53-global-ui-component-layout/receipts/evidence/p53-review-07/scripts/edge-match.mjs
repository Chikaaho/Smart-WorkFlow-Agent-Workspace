/**
 * P53 诊断（非证据）：对 09 设计 XML 的 edge-0..17 包围盒，枚举节点端口对，
 * 用直线段像素支持率判定设计连线的真实端点。
 * 用法：node edge-match.mjs
 */
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const { installImageRuntime } = await import('./p53-image.mjs')
const refPng = path.join(workspaceRoot, 'docs', 'ui', 'png', '09 流程设计器.png')

// 设计节点盒（页面坐标）与端口
const NODES = {
  start: { box: [340, 210, 160, 50], label: '开始' },
  draft: { box: [340, 301, 160, 50], label: '起草' },
  dept: { box: [340, 392, 160, 50], label: '部门负责人审批' },
  tech: { box: [340, 483, 160, 50], label: '办公室资产管理员意见' },
  plan: { box: [615, 410, 160, 50], label: '资产采购' },
  branch: { box: [752, 499, 160, 50], label: '分公司领导审核' },
  divide: { box: [752, 607, 160, 50], label: '分管领导审批' },
  finance: { box: [752, 715, 160, 50], label: '财务部审核' },
  sign: { box: [752, 823, 160, 50], label: '会签部门意见' },
  risk: { box: [135, 639, 160, 50], label: '资产核价' },
  compliance: { box: [135, 747, 160, 50], label: '合约部负责人意见' },
  end: { box: [340, 904, 160, 50], label: '结束' },
  gateway: { box: [396, 642, 48, 48], label: '网关', diamond: true },
}
function portsOf(n) {
  const [x, y, w, h] = n.box
  const cx = x + w / 2, cy = y + h / 2
  if (n.diamond) {
    const r = w / 2
    return { top: [cx, cy - r], bottom: [cx, cy + r], left: [cx - r, cy], right: [cx + r, cy] }
  }
  return { top: [cx, y], bottom: [cx, y + h], left: [x, cy], right: [x + w, cy] }
}
const PORTS = Object.fromEntries(Object.entries(NODES).map(([k, n]) => [k, portsOf(n)]))

// 设计 XML edge 包围盒（design-geometry/09-design.json，name=edge-N）
const BBOXES = [
  ['edge-0', 416.6, 260, 6.8, 41], ['edge-1', 416.6, 351, 6.8, 41], ['edge-2', 416.6, 442, 6.8, 41],
  ['edge-3', 416.6, 533, 6.8, 111], ['edge-4', 416.6, 688, 6.8, 216],
  ['edge-5', 500, 435, 115, 73], ['edge-6', 500, 508, 252, 18.886], ['edge-7', 500, 508, 252, 124],
  ['edge-8', 500, 508, 252, 232], ['edge-9', 500, 508, 252, 340],
  ['edge-10', 442, 460, 253, 206], ['edge-11', 442, 548.64, 310, 117.356],
  ['edge-12', 442, 653.83, 310, 12.166], ['edge-13', 442, 666, 310, 99.805],
  ['edge-14', 442, 666, 310, 207], ['edge-15', 295, 660.76, 103, 6.799],
  ['edge-16', 211.6, 689, 6.8, 58], ['edge-17', 84, 504.6, 256, 267.4],
]

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
await installImageRuntime(page)
const b64 = (await readFile(refPng)).toString('base64')
await page.evaluate(async (b) => window.__p53.load('ref', b), b64)

const result = await page.evaluate(({ BBOXES, PORTS }) => {
  const slot = window.__p53.slots.ref
  const { w, h, data } = slot
  const EDGE = [186, 193, 206]
  const near = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false
    const i = (Math.round(y) * w + Math.round(x)) * 4
    return Math.abs(data.data[i] - EDGE[0]) <= 30 && Math.abs(data.data[i + 1] - EDGE[1]) <= 30 && Math.abs(data.data[i + 2] - EDGE[2]) <= 30
  }
  const support = (p1, p2) => {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1]
    const len = Math.hypot(dx, dy)
    const steps = Math.max(8, Math.floor(len / 2))
    let hit = 0, total = 0, missStreak = 0, maxStreak = 0
    for (let s = 1; s < steps; s++) {
      const x = p1[0] + (dx * s) / steps, y = p1[1] + (dy * s) / steps
      // 端点附近 10px 不计（节点描边/箭头干扰）
      const d1 = Math.hypot(x - p1[0], y - p1[1]), d2 = Math.hypot(x - p2[0], y - p2[1])
      if (d1 < 12 || d2 < 12) continue
      total++
      if (near(x, y)) { hit++; missStreak = 0 } else { missStreak++; maxStreak = Math.max(maxStreak, missStreak) }
    }
    return { ratio: total ? hit / total : 0, total, maxStreak }
  }
  const out = []
  for (const [name, bx, by, bw, bh] of BBOXES) {
    const cands = []
    for (const [ka, pa] of Object.entries(PORTS)) {
      for (const [sa, p1] of Object.entries(pa)) {
        if (p1[0] < bx - 8 || p1[0] > bx + bw + 8 || p1[1] < by - 8 || p1[1] > by + bh + 8) continue
        for (const [kb, pb] of Object.entries(PORTS)) {
          if (kb <= ka) continue
          for (const [sb, p2] of Object.entries(pb)) {
            if (p2[0] < bx - 8 || p2[0] > bx + bw + 8 || p2[1] < by - 8 || p2[1] > by + bh + 8) continue
            const s = support(p1, p2)
            if (s.ratio >= 0.75) cands.push({ pair: `${ka}.${sa}->${kb}.${sb}`, ratio: Math.round(s.ratio * 1000) / 1000, p1, p2 })
          }
        }
      }
    }
    cands.sort((a, b) => b.ratio - a.ratio)
    out.push({ name, bbox: [bx, by, bw, bh], top: cands.slice(0, 3) })
  }
  return out
}, { BBOXES, PORTS })
await browser.close()
for (const e of result) {
  console.log(e.name, 'bbox=', e.bbox.join(','))
  for (const c of e.top) console.log('   ', c.pair, 'ratio=', c.ratio)
  if (!e.top.length) console.log('    (no port pair ≥0.75)')
}
