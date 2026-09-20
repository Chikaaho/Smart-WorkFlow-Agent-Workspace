import { createRequire } from 'node:module'
import path from 'node:path'
const webRoot = path.join(process.cwd(), 'Smart-WorkFlow-aPaaS-Web')
const { chromium } = createRequire(path.join(webRoot, 'package.json'))('@playwright/test')
const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'zh-CN' })
const page = await context.newPage()
const net = []; const perr = []; const cerr = []
page.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/')) net.push(r.request().method() + ' ' + u.pathname + ' -> ' + r.status()) })
page.on('pageerror', (e) => perr.push(String(e).slice(0, 200)))
page.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text().slice(0, 200)) })
await page.goto('http://localhost:5176/login', { waitUntil: 'domcontentloaded' })
await page.locator('img.login-page__captcha').waitFor({ state: 'visible', timeout: 15000 })
await page.locator('input[autocomplete="username"]').fill('admin')
await page.locator('input[autocomplete="current-password"]').fill('admin123')
await page.locator('.login-page__captcha-row input').fill('1234')
await page.locator('.login-page__submit').click()
await page.waitForURL((u) => u.pathname !== '/login', { timeout: 30000 })
await page.goto('http://localhost:5176/m/form/p53ev08_mobile_form', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const state = await page.evaluate(() => ({
  url: location.href,
  formPage: Boolean(document.querySelector('.form-render-page')),
  skeleton: Boolean(document.querySelector('.el-skeleton')),
  alerts: [...document.querySelectorAll('.el-alert')].map((el) => el.textContent.trim().slice(0, 120)),
  bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300),
}))
console.log(JSON.stringify({ state, net, perr, cerr: cerr.slice(0, 6) }, null, 2))
await browser.close()
