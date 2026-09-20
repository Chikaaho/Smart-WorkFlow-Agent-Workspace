import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
await page.addInitScript(() => {
  localStorage.setItem('sw.locale', 'zh-CN')
  sessionStorage.setItem('sw.design-fixture-id', 'node07')
})
await page.goto('http://localhost:5173/form/designer/seed-def-001', { waitUntil: 'domcontentloaded' })
await page.locator('.designer').first().waitFor({ timeout: 20000 })
await page.waitForTimeout(1500)
// 选中第一个字段
await page.locator('.field-shell').first().click()
await page.waitForTimeout(600)
const out = await page.evaluate(() => {
  const y = (sel, i = 0) => {
    const el = document.querySelectorAll(sel)[i]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return Math.round(r.y)
  }
  const items = [...document.querySelectorAll('.palette__item')].slice(0, 6).map((el) => Math.round(el.getBoundingClientRect().y))
  const groups = [...document.querySelectorAll('.palette-group__title')].map((el) => Math.round(el.getBoundingClientRect().y))
  const labels = [...document.querySelectorAll('.designer-main-canvas .el-form-item__label')].slice(0, 5).map((el) => Math.round(el.getBoundingClientRect().y))
  const inputs = [...document.querySelectorAll('.designer-main-canvas .el-input__wrapper')].slice(0, 4).map((el) => Math.round(el.getBoundingClientRect().y))
  const panelRows = [...document.querySelectorAll('.config__row')].slice(0, 5).map((el) => Math.round(el.getBoundingClientRect().y))
  const panelSections = [...document.querySelectorAll('.config__section')].map((el) => Math.round(el.getBoundingClientRect().y))
  return {
    paletteTitle: y('.palette__title'),
    paletteSearch: y('.palette__search-input'),
    groups,
    items,
    ruler: y('.designer__ruler'),
    sheetTitle: y('.designer__sheet-title'),
    labels,
    inputs,
    panelTitle: y('.config__title'),
    panelSections,
    panelRows,
    workbar: y('.designer__workbench'),
    metaRow: y('.designer__canvas-meta'),
  }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
