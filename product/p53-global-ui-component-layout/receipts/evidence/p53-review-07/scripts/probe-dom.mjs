import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
await page.addInitScript(() => { localStorage.setItem('sw.locale','zh-CN'); sessionStorage.setItem('sw.design-fixture-id','node07') })
await page.goto('http://localhost:5173/form/designer/seed-def-001', { waitUntil: 'domcontentloaded' })
await page.locator('.designer').first().waitFor({ timeout: 20000 })
await page.waitForTimeout(1200)
const out = await page.evaluate(() => {
  const y = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height) } }
  return {
    topbar: y('.basic-layout__topbar') ?? y('header.basic-layout__topbar'),
    appTopbar: y('.app-topbar'),
    workbench: y('.designer__workbench'),
    body: y('.designer__body'),
    paletteTitle: y('.palette__title'),
  }
})
console.log(JSON.stringify(out))
await browser.close()
