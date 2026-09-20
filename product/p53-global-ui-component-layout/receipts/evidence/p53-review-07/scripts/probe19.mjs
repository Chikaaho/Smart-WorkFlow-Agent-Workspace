import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1512 } })
await page.addInitScript(() => { localStorage.setItem('sw.locale', 'zh-CN'); sessionStorage.setItem('sw.design-fixture-id', 'node03') })
await page.goto('http://localhost:5173/workflow/task/mock-task-001', { waitUntil: 'domcontentloaded' })
await page.locator('.detail-header').waitFor({ timeout: 20000 })
await page.waitForTimeout(800)
const tab = page.locator('.detail-card--tabs .el-tabs__item', { hasText: '流程图' })
await tab.click()
await page.locator('.pg-view .pg-node').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
await page.waitForTimeout(1200)
const out = await page.evaluate(() => {
  const g = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return Math.round(r.top) + '/' + Math.round(r.height) + '@' + Math.round(r.left) + '+' + Math.round(r.width)
  }
  return {
    tabs: g('.detail-card--tabs .el-tabs__header'),
    graphCanvas: g('.p53-graph-canvas'),
    rail: g('.p53-graph-rail'),
    railFirst: g('.p53-graph-rail > *'),
    zoom: g('.canvas-zoom'),
    firstNode: g('.pg-node'),
  }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
