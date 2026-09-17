import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

const workspaceRoot = process.cwd()
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-04')
const auditRoot = path.join(evidenceRoot, process.env.P53_AUDIT_DIR || 'current-audit')
const shotsRoot = path.join(auditRoot, 'current-screenshots')
const factsRoot = path.join(auditRoot, 'facts')
const baseUrl = process.env.P53_CAPTURE_BASE_URL || 'http://localhost:5173'
const username = process.env.P53_CAPTURE_USERNAME || 'admin'
const password = process.env.P53_CAPTURE_PASSWORD || 'admin123'
const answerFile = path.join(auditRoot, 'captcha-answer.txt')
const waitingFile = path.join(auditRoot, 'captcha-waiting.flag')
const captchaPng = path.join(auditRoot, 'captcha.png')

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

const STYLE_PROBES = [
  { label: 'topbarBg', selector: '.basic-layout__topbar', prop: 'backgroundColor' },
  { label: 'topbarClass', selector: '.basic-layout__topbar', prop: 'className' },
  { label: 'sidebarBg', selector: '.app-sidebar', prop: 'backgroundColor' },
  { label: 'asideWidth', selector: '.basic-layout__aside', prop: 'width' },
  { label: 'contentBg', selector: '.basic-layout__content', prop: 'backgroundColor' },
  { label: 'bodyBg', selector: 'body', prop: 'backgroundColor' },
  { label: 'bodyFont', selector: 'body', prop: 'fontFamily' },
  { label: 'bodyColor', selector: 'body', prop: 'color' },
  { label: 'primaryBtnBg', selector: '.el-button--primary', prop: 'backgroundColor' },
  { label: 'primaryBtnColor', selector: '.el-button--primary', prop: 'color' },
  { label: 'primaryBtnRadius', selector: '.el-button--primary', prop: 'borderRadius' },
  { label: 'defaultBtnBg', selector: '.el-button:not(.el-button--primary):not(.is-text):not(.el-button--text)', prop: 'backgroundColor' },
  { label: 'defaultBtnBorder', selector: '.el-button:not(.el-button--primary):not(.is-text):not(.el-button--text)', prop: 'borderColor' },
  { label: 'tableHeaderBg', selector: '.el-table th.el-table__cell', prop: 'backgroundColor' },
  { label: 'tableHeaderColor', selector: '.el-table th.el-table__cell', prop: 'color' },
  { label: 'tagBg', selector: '.el-tag', prop: 'backgroundColor' },
  { label: 'tagColor', selector: '.el-tag', prop: 'color' },
  { label: 'cardBg', selector: '.el-card', prop: 'backgroundColor' },
  { label: 'cardRadius', selector: '.el-card', prop: 'borderRadius' },
  { label: 'cardShadow', selector: '.el-card', prop: 'boxShadow' },
  { label: 'h1Size', selector: 'h1, .page-title, .standard-form-template__title, .standard-list-template__title', prop: 'fontSize' },
  { label: 'h1Weight', selector: 'h1, .page-title, .standard-form-template__title, .standard-list-template__title', prop: 'fontWeight' },
  { label: 'elInputBg', selector: '.el-input__wrapper', prop: 'backgroundColor' },
  { label: 'elInputBorder', selector: '.el-input__wrapper', prop: 'boxShadow' },
  { label: 'elPopoverBg', selector: '.el-popper', prop: 'backgroundColor' },
  { label: 'elDialogBg', selector: '.el-dialog', prop: 'backgroundColor' },
  { label: 'elDialogRadius', selector: '.el-dialog', prop: 'borderRadius' },
  { label: 'navItemActiveColor', selector: '.app-main-nav__item.is-active', prop: 'color' },
  { label: 'navItemColor', selector: '.app-main-nav__item:not(.is-active)', prop: 'color' },
  { label: 'sidebarItemColor', selector: '.app-sidebar .el-menu-item:not(.is-active)', prop: 'color' },
  { label: 'sidebarItemActiveColor', selector: '.app-sidebar .el-menu-item.is-active', prop: 'color' },
]

async function styleFacts() {
  return page.evaluate((probes) => {
    const out = {}
    for (const probe of probes) {
      const el = document.querySelector(probe.selector)
      out[probe.label] = el ? getComputedStyle(el)[probe.prop] : null
    }
    return out
  }, STYLE_PROBES)
}

async function shot(id, extra = {}) {
  await page.waitForTimeout(300)
  const pngPath = path.join(shotsRoot, id + '.png')
  await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' })
  const bytes = await readFile(pngPath)
  const fact = {
    id,
    capturedAt: new Date().toISOString(),
    url: page.url(),
    viewport: page.viewportSize(),
    screenshot: { file: path.relative(auditRoot, pngPath).split(path.sep).join('/'), bytes: bytes.length },
    styles: await styleFacts(),
    horizontalScroll: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    ...extra,
  }
  await writeFile(path.join(factsRoot, id + '.json'), JSON.stringify(fact, null, 2) + '\n')
  return fact
}

async function gotoRoute(route, readySelector = '.basic-layout__topbar') {
  await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' })
  await page.locator(readySelector).waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(400)
}

async function main() {
  await mkdir(shotsRoot, { recursive: true })
  await mkdir(factsRoot, { recursive: true })
  await rm(answerFile, { force: true })
  await rm(waitingFile, { force: true })

  await page.goto(new URL('/login', baseUrl).href, { waitUntil: 'domcontentloaded' })
  await page.locator('.login-page__captcha').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(300)
  const captchaSrc = await page.locator('.login-page__captcha').getAttribute('src')
  if (!captchaSrc || !captchaSrc.startsWith('data:image')) throw new Error('captcha image src is not an inline data URL')
  await writeFile(captchaPng, Buffer.from(captchaSrc.split(',')[1], 'base64'))
  await shot('cur-06-login', { note: 'login page captured before credentials; captcha saved for human reading' })
  await writeFile(waitingFile, new Date().toISOString())

  let answer = null
  for (let i = 0; i < 300; i++) {
    try {
      answer = (await readFile(answerFile, 'utf8')).trim()
      if (answer) break
    } catch {}
    await page.waitForTimeout(2000)
  }
  if (!answer) throw new Error('captcha answer file never appeared')

  let loggedIn = false
  for (let attempt = 1; attempt <= 4 && !loggedIn; attempt++) {
    await page.locator('input[autocomplete="username"]').fill(username)
    await page.locator('input[autocomplete="current-password"]').fill(password)
    await page.locator('.login-page__captcha-row input').fill(answer)
    await page.locator('.login-page__submit').click()
    loggedIn = await page.waitForURL((url) => url.pathname !== '/login', { timeout: 20000 }).then(() => true).catch(() => false)
    if (!loggedIn) {
      const errText = await page.locator('.el-message, .el-form-item__error').allInnerTexts().catch(() => [])
      await shot('cur-login-failed-attempt-' + attempt, { loginError: errText })
      if (attempt === 4) throw new Error('login failed after 4 attempts: ' + JSON.stringify(errText))
      await page.locator('.login-page__captcha').waitFor({ state: 'visible', timeout: 20000 })
      await page.waitForTimeout(400)
      const src = await page.locator('.login-page__captcha').getAttribute('src')
      await writeFile(captchaPng, Buffer.from(src.split(',')[1], 'base64'))
      await rm(answerFile, { force: true })
      await writeFile(waitingFile, new Date().toISOString())
      let next = null
      for (let i = 0; i < 300; i++) {
        try {
          next = (await readFile(answerFile, 'utf8')).trim()
          if (next) break
        } catch {}
        await page.waitForTimeout(2000)
      }
      if (!next) throw new Error('captcha answer file never appeared on retry ' + attempt)
      answer = next
    }
  }
  await page.locator('.app-topbar__user-name').waitFor({ state: 'visible', timeout: 20000 })
  const displayName = (await page.locator('.app-topbar__user-name').innerText()).trim()

  await gotoRoute('/workspace')
  await shot('cur-01-workspace', { identity: displayName })
  await page.locator('.app-topbar__user').click()
  const menu = page.locator('.app-topbar__dropdown')
  await menu.waitFor({ state: 'visible', timeout: 10000 })
  const portalMenuItems = (await menu.locator('.el-dropdown-menu__item').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
  await shot('cur-28-portal-menu', { menuItems: portalMenuItems })
  await page.keyboard.press('Escape')

  await gotoRoute('/workflow/my-instances')
  await shot('cur-02-my-instances')

  await gotoRoute('/form/form-def-list')
  await shot('cur-04-admin-home')
  await page.locator('.app-topbar__user').click()
  await menu.waitFor({ state: 'visible', timeout: 10000 })
  const adminMenuItems = (await menu.locator('.el-dropdown-menu__item').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
  await shot('cur-29-admin-menu', { menuItems: adminMenuItems })
  await page.keyboard.press('Escape')

  await gotoRoute('/portal')
  await shot('cur-05-portal')

  await gotoRoute('/workflow/catalog')
  await shot('cur-21-catalog')
  const tags = page.locator('.el-tag')
  const tagCount = Math.min(await tags.count(), 5)
  for (let i = 1; i < tagCount; i++) {
    const tag = tags.nth(i)
    const label = (await tag.innerText()).replace(/\s+/g, ' ').trim()
    await tag.click()
    await page.waitForTimeout(600)
    await shot('cur-2' + (i + 1) + '-catalog-category', { categoryLabel: label, categoryIndex: i })
  }

  await gotoRoute('/form/form-render/p61r10_batch_form', '.form-render-page')
  await shot('cur-27-form-render')

  await gotoRoute('/form/designer')
  await shot('cur-07-form-designer')
  for (const tabName of ['关联流程', '字段属性', '草稿历史']) {
    const tab = page.getByRole('tab', { name: tabName })
    if ((await tab.count()) > 0) {
      await tab.first().click()
      await page.waitForTimeout(600)
      await shot('cur-designer-' + tabName, { designerTab: tabName })
    }
  }

  const definitionId = '2100424929376403458'
  await gotoRoute('/workflow/defs/' + definitionId + '/design', '.designer-page')
  await shot('cur-09-process-designer')
  const advancedTab = page.getByRole('tab', { name: /高级配置|通知/ })
  if ((await advancedTab.count()) > 0) {
    await advancedTab.first().click()
    await page.waitForTimeout(600)
    await shot('cur-13-advanced-config', { designerTab: await advancedTab.first().innerText() })
  }
  const approvalNode = page.locator('.designer-node').filter({ hasText: '节点一-管理员审批' }).first()
  if ((await approvalNode.count()) > 0) {
    await approvalNode.click()
    const pickerButton = page.getByRole('button', { name: '查看候选', exact: true })
    await pickerButton.waitFor({ state: 'visible', timeout: 8000 })
    await pickerButton.click()
    const picker = page.locator('.el-dialog').filter({ hasText: '选择审批人' }).last()
    await picker.waitFor({ state: 'visible', timeout: 10000 })
    await shot('cur-12-approver-dialog')
    await page.keyboard.press('Escape')
    await picker.waitFor({ state: 'hidden', timeout: 10000 })
  }

  const taskId = 'af63f9ac-b248-11f1-9b6a-00ffa7734675'
  await gotoRoute('/workflow/task/' + taskId, '.detail-header')
  await shot('cur-03-taskdetail')
  const graphTab = page.getByRole('tab', { name: '流程图', exact: true })
  if ((await graphTab.count()) > 0) {
    await graphTab.click()
    await page.locator('.pg-view svg').waitFor({ state: 'visible', timeout: 15000 })
    await shot('cur-19-graph-tab')
  }
  const listTab = page.getByRole('tab', { name: '审批详情列表', exact: true })
  if ((await listTab.count()) > 0) {
    await listTab.click()
    const detailButton = page.getByRole('button', { name: '查看详情', exact: true }).first()
    await detailButton.waitFor({ state: 'visible', timeout: 15000 })
    await detailButton.click()
    const opinionDialog = page.locator('.el-dialog').filter({ hasText: '审批意见详情' }).last()
    await opinionDialog.waitFor({ state: 'visible', timeout: 10000 })
    await shot('cur-15-opinion-dialog')
    await page.keyboard.press('Escape')
    await opinionDialog.waitFor({ state: 'hidden', timeout: 10000 })
  }

  await writeFile(path.join(auditRoot, 'capture-summary.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    identity: displayName,
    pageErrors,
  }, null, 2))
  if (pageErrors.length) throw new Error('page errors: ' + JSON.stringify(pageErrors))
  await context.close()
  await browser.close()
  console.log('AUDIT_CAPTURE_OK')
}

await main().catch(async (error) => {
  console.error(error?.stack || String(error))
  await context.close().catch(() => {})
  await browser.close().catch(() => {})
  process.exitCode = 1
})
