import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
await page.addInitScript(() => { localStorage.setItem('sw.locale', 'zh-CN'); sessionStorage.setItem('sw.design-fixture-id', 'node11') })
await page.goto('http://localhost:5173/form/designer/seed-def-001', { waitUntil: 'domcontentloaded' })
await page.locator('.designer').first().waitFor({ timeout: 20000 })
await page.waitForTimeout(1200)
await page.locator('.designer__canvas-fields').click()
await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
await page.waitForTimeout(600)
const out = await page.evaluate(() => {
  const g = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return Math.round(r.top) + '/' + Math.round(r.height)
  }
  return {
    dialog: g('.fields-dialog .el-dialog__header') ?? g('.el-dialog'),
    dialogBox: g('.fields-dialog'),
    title: g('.el-dialog__title'),
    sub: g('.fields-dialog__sub'),
    toolbar: g('.fields-dialog__toolbar'),
    search: g('.fields-dialog__search'),
    table: g('.fields-dialog .el-table'),
    headerRow: g('.fields-dialog .el-table__header'),
    firstRow: g('.fields-dialog .el-table__row'),
    footer: g('.fields-dialog__close') ?? g('.fields-dialog .el-dialog__footer'),
  }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
