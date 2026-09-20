import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
await page.addInitScript(() => { localStorage.setItem('sw.locale', 'zh-CN'); sessionStorage.setItem('sw.design-fixture-id', 'node09') })
await page.goto('http://localhost:5173/workflow/defs/2100424929376403458/design', { waitUntil: 'domcontentloaded' })
await page.locator('.designer-canvas-wrap,.designer-body').first().waitFor({ timeout: 20000 })
await page.waitForTimeout(6000)
const node = page.locator('.designer-node', { hasText: '办公室资产管理员意见' }).first()
console.log('node count:', await node.count())
if ((await node.count()) > 0) {
  await node.click()
  await page.waitForTimeout(900)
  await page.mouse.move(0, 0)
  await page.waitForTimeout(300)
}
const out = await page.evaluate(() => {
  const txt = (sel) => document.querySelector(sel)?.textContent?.trim().slice(0, 60) ?? null
  return {
    selectedClass: document.querySelector('.designer-node-selected') != null,
    propsTitle: txt('.props-title'),
    typeChip: txt('.props-type-chip'),
    section: txt('.props-section'),
    nodeKeyInput: [...document.querySelectorAll('.designer-props input')].map((i) => i.value).slice(0, 4),
    listeners: [...document.querySelectorAll('.listener-row__bean')].map((e) => e.textContent?.trim()),
    formItems: [...document.querySelectorAll('.designer-props .el-form-item__label')].map((e) => e.textContent?.trim()),
  }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
