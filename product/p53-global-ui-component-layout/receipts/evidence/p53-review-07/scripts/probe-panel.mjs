import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
await page.addInitScript(() => { localStorage.setItem('sw.locale', 'zh-CN'); sessionStorage.setItem('sw.design-fixture-id', 'node07') })
await page.goto('http://localhost:5173/form/designer/seed-def-001', { waitUntil: 'domcontentloaded' })
await page.locator('.designer').first().waitFor({ timeout: 20000 })
await page.waitForTimeout(1200)
await page.locator('.field-shell').first().click()
await page.waitForTimeout(500)
const out = await page.evaluate(() => {
  const g = (sel, i = 0) => {
    const el = document.querySelectorAll(sel)[i]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return Math.round(r.top) + '/' + Math.round(r.height)
  }
  const rows = [...document.querySelectorAll('.config__row')].slice(0, 6).map((el) => {
    const r = el.getBoundingClientRect()
    return Math.round(r.top) + '+' + Math.round(r.height)
  })
  return {
    head: g('.config__head'),
    sec1: g('.config__section', 0),
    row1: rows[0],
    row2: rows[1],
    row3: rows[2],
    row4: rows[3],
    label1: g('.config__row .config__label', 0),
    input1: g('.config__row .el-input__wrapper', 0),
  }
})
console.log(JSON.stringify(out))
await browser.close()
