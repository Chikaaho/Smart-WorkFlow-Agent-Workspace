/**
 * 诊断工具（非证据）：node19 运行态图几何探针。按 capture-nodes 同款初始化打开
 * 任务详情-流程图页签，输出 .pg-view 盒、svg viewBox、节点盒/变换、边路径。
 * 用法：node probe19-graph.mjs [baseUrl]
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const baseUrl = process.argv[2] ?? process.env.P53_BASE_URL ?? 'http://localhost:5173'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1512 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
})
const page = await context.newPage()
await page.addInitScript(() => {
  window.localStorage.setItem('sw.locale', 'zh-CN')
  sessionStorage.setItem('sw.design-fixture-id', 'node03')
  sessionStorage.setItem('sw.p53-review-node', '19')
  const s = document.createElement('style')
  s.textContent =
    '*, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }'
  document.documentElement.appendChild(s)
})
await page.goto(new URL('/workflow/task/mock-task-001', baseUrl).href, { waitUntil: 'domcontentloaded' })
await page.locator('.detail-header').waitFor({ state: 'visible', timeout: 20000 })
const tab = page.locator('.detail-card--tabs .el-tabs__item', { hasText: '流程图' })
await tab.click()
await page.locator('.pg-view .pg-node').first().waitFor({ state: 'visible', timeout: 15000 })
await page.waitForTimeout(1200)

const dump = await page.evaluate(() => {
  const round = (n) => Math.round(n * 100) / 100
  const view = document.querySelector('.p53-graph-canvas .pg-view')
  const svg = document.querySelector('.p53-graph-canvas .pg-svg')
  const vr = view.getBoundingClientRect()
  const nodes = [...document.querySelectorAll('.p53-graph-canvas .pg-node')].map((n) => {
    const r = n.getBoundingClientRect()
    const label = n.querySelector('.pg-node-label, .pg-node-gateway-label')
    return {
      cls: n.getAttribute('class'),
      label: label ? label.textContent.trim() : '',
      box: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) },
      transform: n.getAttribute('transform'),
    }
  })
  const edges = [...document.querySelectorAll('.p53-graph-canvas .pg-edge')].map((e) => e.getAttribute('d'))
  return {
    viewBox: svg ? svg.getAttribute('viewBox') : null,
    viewRect: { x: round(vr.x), y: round(vr.y), w: round(vr.width), h: round(vr.height) },
    nodes,
    edges,
  }
})
console.log(JSON.stringify(dump, null, 1))
await browser.close()
