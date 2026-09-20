import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

const workspaceRoot = process.cwd()
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-04')
const auditRoot = path.join(evidenceRoot, 'final', 'runtime')
const shotsRoot = path.join(auditRoot, 'current-screenshots')
const baseUrl = 'http://localhost:5173'
const answerFile = path.join(auditRoot, 'captcha-answer.txt')
const waitingFile = path.join(auditRoot, 'captcha-waiting.flag')
const captchaPng = path.join(auditRoot, 'captcha.png')

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function shot(id, extra = {}) {
  await page.waitForTimeout(400)
  const pngPath = path.join(shotsRoot, id + '.png')
  await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' })
  const bytes = await readFile(pngPath)
  await writeFile(path.join(auditRoot, 'facts-supplement', id + '.json'), JSON.stringify({ id, url: page.url(), capturedAt: new Date().toISOString(), bytes: bytes.length, ...extra }, null, 2) + '\n')
}

async function gotoRoute(route, readySelector = '.basic-layout__topbar') {
  await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' })
  await page.locator(readySelector).waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(500)
}

async function main() {
  await mkdir(path.join(auditRoot, 'facts-supplement'), { recursive: true })
  await rm(answerFile, { force: true })
  await page.goto(new URL('/login', baseUrl).href, { waitUntil: 'domcontentloaded' })
  await page.locator('.login-page__captcha').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(300)
  const captchaSrc = await page.locator('.login-page__captcha').getAttribute('src')
  await writeFile(captchaPng, Buffer.from(captchaSrc.split(',')[1], 'base64'))
  await writeFile(waitingFile, new Date().toISOString())
  let answer = null
  for (let i = 0; i < 300; i++) {
    try { answer = (await readFile(answerFile, 'utf8')).trim(); if (answer) break } catch {}
    await page.waitForTimeout(2000)
  }
  if (!answer) throw new Error('captcha answer never appeared')
  await page.locator('input[autocomplete="username"]').fill('admin')
  await page.locator('input[autocomplete="current-password"]').fill('admin123')
  await page.locator('.login-page__captcha-row input').fill(answer)
  await page.locator('.login-page__submit').click()
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30000 })
  await page.locator('.app-topbar__user-name').waitFor({ state: 'visible', timeout: 20000 })

  // 经表单列表进入真实定义设计器（历史版本按钮需 formId）
  await gotoRoute('/form/form-def-list', '.basic-layout__topbar')
  const editButton = page.getByRole('button', { name: '编辑' }).first()
  await editButton.waitFor({ state: 'visible', timeout: 15000 })
  await editButton.click()
  await page.locator('.designer').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(800)

  // 历史版本弹窗（节点14）
  const historyButton = page.getByRole('button', { name: '历史版本' })
  if ((await historyButton.count()) > 0) {
    await historyButton.first().click({ timeout: 8000 })
    await page.waitForTimeout(800)
    await shot('cur-designer-history-dialog', { node: '14' })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  // 流程中心分类（节点22-26）：.catalog-chip 按钮逐个点击（容错）
  await gotoRoute('/workflow/catalog', '.catalog-page')
  const chips = page.locator('.catalog-chip')
  const chipCount = Math.min(await chips.count(), 6)
  for (let i = 1; i < chipCount; i++) {
    const chip = chips.nth(i)
    const label = (await chip.innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    try {
      await chip.click({ timeout: 5000, force: true })
      await page.waitForTimeout(800)
      await shot('cur-2' + (i + 1) + '-catalog-category', { node: '2' + (i + 1), categoryLabel: label })
    } catch (e) {
      await writeFile(path.join(auditRoot, 'facts-supplement', 'cur-2' + (i + 1) + '-error.json'), JSON.stringify({ node: '2' + (i + 1), label, error: String(e).slice(0, 200) }, null, 2))
    }
  }

  // 通知模板（节点13 受限真实映射）
  await gotoRoute('/notify/template', '.basic-layout__topbar')
  await shot('cur-13-notify-template', { node: '13', note: '受限映射：现有通知模板真实能力页' })

  if (pageErrors.length) throw new Error('page errors: ' + JSON.stringify(pageErrors))
  await context.close()
  await browser.close()
  console.log('SUPPLEMENT_CAPTURE_OK')
}

await main().catch(async (error) => {
  console.error(error?.stack || String(error))
  await context.close().catch(() => {})
  await browser.close().catch(() => {})
  process.exitCode = 1
})
