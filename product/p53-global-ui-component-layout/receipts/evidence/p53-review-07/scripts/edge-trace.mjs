/**
 * P53 诊断（非证据）：从参考 PNG 与运行时 PNG 提取设计器画布内的连线折线段。
 * 连线色 ~#bac1ce（V/H 直线段），排除节点框/右侧面板/工具条后按行程≥18 提取。
 * 用法：node edge-trace.mjs [refPng runPng]   默认：09 参考 vs family-c/09 运行
 */
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const review04 = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-04')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07')
const { installImageRuntime } = await import('./p53-image.mjs')

const refPng = process.argv[2] ?? path.join(review04, 'reference', 'figma-captures', '09.png')
const runPng = process.argv[3] ?? path.join(evidenceRoot, 'family-c', '09-runtime.png')

// 页面内执行的提取算法（节点框/面板/工具条排除，行程≥18 的 V/H 段合并）
const PAGE_FN = () => {
  const NODES = [
    [340, 210, 160, 50], [340, 301, 160, 50], [340, 392, 160, 50], [340, 483, 160, 50],
    [615, 410, 160, 50], [752, 499, 160, 50], [752, 607, 160, 50], [752, 715, 160, 50],
    [752, 823, 160, 50], [135, 639, 160, 50], [135, 747, 160, 50], [340, 904, 160, 50],
    [396, 642, 48, 48],
  ].map(([x, y, w, h]) => [x - 4, y - 4, w + 8, h + 8])
  const EXCLUDE = [...NODES, [1100, 0, 340, 1024], [0, 0, 1440, 188], [846, 900, 240, 60]]
  const EDGE = [186, 193, 206]
  const TOL = 26
  const MIN_RUN = 18
  window.__extract = function extract(slot) {
    const { w, h, data } = slot
    const isEdge = new Uint8Array(w * h)
    for (let y = 188; y < Math.min(h, 974); y++) {
      for (let x = 0; x < Math.min(w, 1100); x++) {
        const i = (y * w + x) * 4
        const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2]
        if (Math.abs(r - EDGE[0]) <= TOL && Math.abs(g - EDGE[1]) <= TOL && Math.abs(b - EDGE[2]) <= TOL) isEdge[y * w + x] = 1
      }
    }
    for (const [ex, ey, ew, eh] of EXCLUDE) {
      for (let y = Math.max(0, ey); y < Math.min(h, ey + eh); y++) for (let x = Math.max(0, ex); x < Math.min(w, ex + ew); x++) isEdge[y * w + x] = 0
    }
    const vRuns = []
    for (let x = 0; x < Math.min(w, 1100); x++) {
      let y = 188
      while (y < Math.min(h, 974)) {
        if (isEdge[y * w + x]) {
          let y1 = y
          while (y1 + 1 < Math.min(h, 974) && isEdge[(y1 + 1) * w + x]) y1++
          if (y1 - y + 1 >= MIN_RUN) vRuns.push({ x, y0: y, y1 })
          y = y1 + 1
        } else y++
      }
    }
    const vSegs = []
    for (const r of vRuns.sort((a, b) => a.x - b.x || a.y0 - b.y0)) {
      const m = vSegs.find((s) => Math.abs(s.x - r.x) <= 3 && r.y0 <= s.y1 + 6 && s.y0 <= r.y1 + 6)
      if (m) { m.x = (m.x + r.x) / 2; m.y0 = Math.min(m.y0, r.y0); m.y1 = Math.max(m.y1, r.y1) } else vSegs.push({ ...r })
    }
    const hRuns = []
    for (let y = 188; y < Math.min(h, 974); y++) {
      let x = 0
      while (x < Math.min(w, 1100)) {
        if (isEdge[y * w + x]) {
          let x1 = x
          while (x1 + 1 < Math.min(w, 1100) && isEdge[y * w + x1 + 1]) x1++
          if (x1 - x + 1 >= MIN_RUN) hRuns.push({ y, x0: x, x1 })
          x = x1 + 1
        } else x++
      }
    }
    const hSegs = []
    for (const r of hRuns.sort((a, b) => a.y - b.y || a.x0 - b.x0)) {
      const m = hSegs.find((s) => Math.abs(s.y - r.y) <= 3 && r.x0 <= s.x1 + 6 && s.x0 <= r.x1 + 6)
      if (m) { m.y = (m.y + r.y) / 2; m.x0 = Math.min(m.x0, r.x0); m.x1 = Math.max(m.x1, r.x1) } else hSegs.push({ ...r })
    }
    return {
      v: vSegs.map((s) => ({ x: Math.round(s.x * 10) / 10, y0: s.y0, y1: s.y1 })).sort((a, b) => a.x - b.x || a.y0 - b.y0),
      h: hSegs.map((s) => ({ y: Math.round(s.y * 10) / 10, x0: s.x0, x1: s.x1 })).sort((a, b) => a.y - b.y || a.x0 - b.x0),
    }
  }
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
await installImageRuntime(page)
await page.evaluate(PAGE_FN)
const b64 = async (p) => (await readFile(p)).toString('base64')
const ref = await page.evaluate(async (b) => window.__p53.load('ref', b), await b64(refPng))
const run = await page.evaluate(async (b) => window.__p53.load('run', b), await b64(runPng))
const out = {
  ref: { size: ref, ...(await page.evaluate(() => window.__extract(window.__p53.slots.ref))) },
  run: { size: run, ...(await page.evaluate(() => window.__extract(window.__p53.slots.run))) },
}
await browser.close()

for (const k of ['ref', 'run']) {
  console.log(`=== ${k} ${out[k].size.w}x${out[k].size.h} ===`)
  console.log('V segments (x: y0..y1):')
  for (const s of out[k].v) console.log(`  x=${s.x}  ${s.y0}..${s.y1}  (len ${s.y1 - s.y0 + 1})`)
  console.log('H segments (y: x0..x1):')
  for (const s of out[k].h) console.log(`  y=${s.y}  ${s.x0}..${s.x1}  (len ${s.x1 - s.x0 + 1})`)
}
