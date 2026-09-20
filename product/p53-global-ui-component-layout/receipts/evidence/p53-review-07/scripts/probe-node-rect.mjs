/**
 * 诊断工具（非证据）：输出节点10/19 渲染的 .pg-node-rect 设备坐标（getBoundingClientRect
 * 含描边盒），用于与设计 PNG 矩形对齐 fit margins。
 * 用法：node probe-node-rect.mjs
 */
import { createRequire } from 'node:module'
import path from 'node:path'

const webRoot = path.resolve('E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')

const round = (n) => Math.round(n * 100) / 100

async function probe(browser, { fixture, route, viewport }) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('sw.locale', 'zh-CN')
    sessionStorage.setItem('sw.design-fixture-id', fixture)
  })
  await page.goto(new URL(route, 'http://localhost:5173').href, { waitUntil: 'domcontentloaded' })
  if (route.includes('graph') && !route.includes('task/mock-task-001/graph')) {
    await page.locator('.detail-header').waitFor({ state: 'visible', timeout: 20000 })
    await page.locator('.detail-card--tabs .el-tabs__item', { hasText: '流程图' }).click()
  }
  await page.locator('.pg-view .pg-node').first().waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(6000)
  const out = await page.evaluate(() => {
    const r = (n) => Math.round(n * 100) / 100
    const svg = document.querySelector('.pg-view .pg-svg')
    const view = document.querySelector('.pg-view')
    const nodes = [...document.querySelectorAll('.pg-node')]
    const start = nodes.find((n) => (n.textContent || '').includes('开始节点'))
    if (!svg || !view || !start) return { error: 'missing', svg: !!svg, view: !!view, nodes: nodes.length }
    const vr = view.getBoundingClientRect()
    const rect = start.querySelector('.pg-node-rect')
    if (!rect) return { error: 'no rect on start', cls: start.getAttribute('class'), label: start.textContent.slice(0, 30) }
    const rr = rect.getBoundingClientRect()
    return {
      viewBox: svg.getAttribute('viewBox'),
      viewRect: { x: r(vr.x), y: r(vr.y) },
      startRect: { x: r(rr.x), y: r(rr.y), w: r(rr.width), h: r(rr.height) },
    }
  })
  await ctx.close()
  return out
}

const browser = await chromium.launch({ headless: true })
const ten = await probe(browser, {
  fixture: 'node10',
  route: '/workflow/task/mock-task-001/graph',
  viewport: { width: 1440, height: 1024 },
})
const nineteen = await probe(browser, {
  fixture: 'node03',
  route: '/workflow/task/mock-task-001',
  viewport: { width: 1440, height: 1512 },
})
await browser.close()
console.log('node10  viewBox=' + ten.viewBox, 'viewRect=' + JSON.stringify(ten.viewRect), 'startRect=' + JSON.stringify(ten.startRect), '(design 596.6,244.6)')
console.log('node19  viewBox=' + nineteen.viewBox, 'viewRect=' + JSON.stringify(nineteen.viewRect), 'startRect=' + JSON.stringify(nineteen.startRect), '(design 597.6,741.6)')
