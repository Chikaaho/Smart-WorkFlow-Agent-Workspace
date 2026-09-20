import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const workspaceRoot = process.cwd()
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07')
const factsRoot = path.join(evidenceRoot, 'facts')
const baseUrl = process.env.P53_CAPTURE_BASE_URL ?? 'http://localhost:5173'
const username = process.env.P53_CAPTURE_USERNAME ?? 'superadmin'
const password = process.env.P53_CAPTURE_PASSWORD ?? 'admin123'

const sourceFingerprint = JSON.parse(await readFile(path.join(evidenceRoot, 'capture-source-fingerprint-before.json'), 'utf8'))
const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
})
const page = await context.newPage()
const network = []
const pageErrors = []
const entries = []
const menuCaptures = []
let identity = null

page.on('response', (response) => {
  const url = new URL(response.url())
  if (url.origin !== baseUrl || !url.pathname.startsWith('/api/')) return
  network.push({ capturedAt: new Date().toISOString(), method: response.request().method(), path: url.pathname, status: response.status() })
})
page.on('pageerror', (error) => pageErrors.push(error.message))

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function pngDimensions(bytes) {
  if (bytes.readUInt32BE(0) !== 0x89504e47) throw new Error('screenshot is not PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

async function pageFacts() {
  return page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) }
    }
    const root = document.documentElement
    const controls = [...document.querySelectorAll('button,a,[role="button"],[role="tab"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80),
          width: +r.width.toFixed(2), height: +r.height.toFixed(2), tag: el.tagName,
          className: typeof el.className === 'string' ? el.className : '',
        }
      })
    return {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      document: { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, scrollHeight: root.scrollHeight },
      scroll: { x: scrollX, y: scrollY },
      horizontalScroll: root.scrollWidth > innerWidth,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      header: rect('.basic-layout__topbar'), brand: rect('.app-logo'), nav: rect('.basic-layout__nav'),
      actions: rect('.basic-layout__actions'), user: rect('.app-topbar__user'),
      menuBox: rect('.app-topbar__dropdown'),
      controls,
      textSample: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 600),
    }
  })
}

async function capture({ id, atom, objectIds, details = {} }) {
  const pngPath = path.join(evidenceRoot, id + '.png')
  const measured = await pageFacts()
  await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' })
  const pngBytes = await readFile(pngPath)
  const dimensions = pngDimensions(pngBytes)
  const fact = {
    atom, capturedAt: new Date().toISOString(),
    capture: { source: 'visible headed Chromium browser', headless: false, viewport: page.viewportSize(), url: page.url(), deviceScaleFactor: 1 },
    identity, objectIds,
    sourceFingerprint: sourceFingerprint.treeFingerprint,
    screenshot: { absolutePath: pngPath, relativePath: path.relative(evidenceRoot, pngPath).split(path.sep).join('/'), sha256: sha256(pngBytes), width: dimensions.width, height: dimensions.height },
    page: measured, details,
  }
  const factsPath = path.join(factsRoot, id + '.json')
  await writeFile(factsPath, JSON.stringify(fact, null, 2) + '\n')
  entries.push({ id, atom, relativePath: fact.screenshot.relativePath, sha256: fact.screenshot.sha256, width: dimensions.width, height: dimensions.height, url: page.url(), viewport: page.viewportSize(), identity, objectIds, sourceFingerprint: sourceFingerprint.treeFingerprint, factsPath: path.relative(evidenceRoot, factsPath).split(path.sep).join('/') })
  return fact
}

async function gotoRoute(route, readySelector = 'body') {
  await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' })
  await page.locator(readySelector).first().waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(250)
}

async function openUserMenu() {
  const menu = page.locator('.app-topbar__dropdown')
  for (let attempt = 0; attempt < 6; attempt++) {
    if (await menu.isVisible().catch(() => false)) break
    await page.locator('.app-topbar__user').hover().catch(() => {})
    await page.locator('.app-topbar__user').click().catch(() => {})
    await page.waitForTimeout(500)
  }
  await menu.waitFor({ state: 'visible', timeout: 10000 })
  return menu
}

async function setFixture(id, dialogNode = null) {
  await page.evaluate(({ fixture, dialog }) => {
    sessionStorage.setItem('sw.design-fixture-id', fixture)
    if (dialog) sessionStorage.setItem('sw.p53-dialog-node', dialog)
  }, { fixture: id, dialog: dialogNode })
}

await mkdir(factsRoot, { recursive: true })

await gotoRoute('/login', '.login-page__form')
await capture({ id: 'ev4-mobile-login-375', atom: 'P53-EV-04a-F', objectIds: { route: '/login' }, details: { inputsBlank: true, captchaAnswerNotRecorded: true } })
await page.setViewportSize({ width: 1440, height: 1024 })
await page.locator('input[autocomplete="username"]').fill(username)
await page.locator('input[autocomplete="current-password"]').fill(password)
const captchaImage = await page.locator('.login-page__captcha').getAttribute('src')
const captchaAnswer = captchaImage?.startsWith('data:image/svg+xml;base64,')
  ? Buffer.from(captchaImage.slice('data:image/svg+xml;base64,'.length), 'base64').toString('utf8').match(/<text[^>]*>([^<]+)<\/text>/g)?.map((item) => item.replace(/^.*>([^<]+)<\/text>$/, '$1')).join('')
  : null
if (!captchaAnswer) throw new Error('mock captcha text was not readable from the visible image')
await page.locator('.login-page__captcha-row input').fill(captchaAnswer)
await page.locator('.login-page__submit').click()
await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30000 })
await page.locator('.app-topbar__user-name').waitFor({ state: 'visible', timeout: 20000 })
identity = { username, displayName: (await page.locator('.app-topbar__user-name').innerText()).trim(), tenantContext: 'T0' }

for (const item of [
  { route: '/form/form-def-list', id: 'ev2a-admin-menu-expanded', area: 'admin', required: '返回前台', forbidden: '进入后台' },
  { route: '/workspace', id: 'ev2a-portal-menu-expanded', area: 'portal', required: '进入后台', forbidden: '返回前台' },
]) {
  await gotoRoute(item.route, '.basic-layout__topbar')
  const menu = await openUserMenu()
  const items = (await menu.locator('.el-dropdown-menu__item').allTextContents()).map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean)
  if (!items.some((text) => text.includes(item.required))) throw new Error(`${item.area} menu missing ${item.required}`)
  if (items.some((text) => text.includes(item.forbidden))) throw new Error(`${item.area} menu exposed ${item.forbidden}`)
  const fact = await capture({ id: item.id, atom: 'P53-EV-02a-F', objectIds: { route: item.route }, details: { area: item.area, menuItems: items, requiredItemPresent: true, forbiddenItemAbsent: true } })
  menuCaptures.push({ area: item.area, url: fact.capture.url, items })
  await page.keyboard.press('Escape')
}

for (const item of [
  { route: '/workspace', id: 'ev3-shell-workspace-1440', objectIds: { page: 'workspace' } },
  { route: '/workflow/catalog', id: 'ev3-shell-catalog-1440', objectIds: { page: 'workflow-catalog' } },
  { route: '/workflow/task/mock-task-001', id: 'ev3-shell-taskdetail-1440', objectIds: { taskId: 'mock-task-001' } },
  { route: '/form/form-def-list', id: 'ev3-shell-admin-formdeflist-1440', objectIds: { page: 'form-definition-list' } },
]) {
  await gotoRoute(item.route, '.basic-layout__topbar')
  const fact = await capture({ id: item.id, atom: 'P53-EV-03a-F', objectIds: item.objectIds })
  if (fact.page.horizontalScroll) throw new Error(`desktop horizontal scroll at ${item.route}`)
}

// Use the seeded DRAFT definition for write/validate checks. The design fixture
// supplies the visual graph, while the draft id keeps save/validate on a real
// writable production route instead of a visual-only placeholder id.
const definitionId = '4'
await setFixture('node12')
await gotoRoute(`/workflow/defs/${definitionId}/design`, '.designer-canvas-wrap,.designer-body')
const approvalNode = page.locator('.designer-node').filter({ hasText: '办公室资产管理员意见' }).first()
await approvalNode.waitFor({ state: 'visible', timeout: 20000 })
await approvalNode.click()
const pickerButton = page.getByRole('button', { name: /查看候选|选择审批人/ }).first()
await pickerButton.waitFor({ state: 'visible', timeout: 10000 })
await pickerButton.click()
const picker = page.locator('.el-dialog').filter({ hasText: '选择审批人' }).last()
await picker.waitFor({ state: 'visible', timeout: 10000 })
const candidateText = (await picker.innerText()).replace(/\s+/g, ' ').trim()
const candidateFact = await capture({ id: 'ev2b-picker-candidates', atom: 'P53-EV-02b-F', objectIds: { definitionId, node: '办公室资产管理员意见' }, details: { candidateVisible: candidateText.slice(0, 1200), dialogTitle: '选择审批人', modalOpen: true } })
const confirmButton = picker.getByRole('button', { name: /确认选择/ }).last()
await confirmButton.click()
await picker.waitFor({ state: 'hidden', timeout: 10000 })
const backfill = page.locator('.approver-card, .approver-field input').first()
await backfill.waitFor({ state: 'visible', timeout: 10000 })
const backfilledValue = await backfill.evaluate((el) => el instanceof HTMLInputElement ? el.value : (el.textContent || '').replace(/\s+/g, ' ').trim())
if (!backfilledValue) throw new Error('approver selection did not return to the production property panel')
const backfillFact = await capture({ id: 'ev2b-picker-selected-backfilled', atom: 'P53-EV-02b-F', objectIds: { definitionId, node: '办公室资产管理员意见' }, details: { uiFieldValue: backfilledValue, pickerClosed: true, selectedFromProductionDialog: true } })
await page.getByRole('button', { name: '保存', exact: true }).click()
await page.locator('.el-message--success').filter({ hasText: /草稿已保存/ }).last().waitFor({ state: 'visible', timeout: 15000 })
await page.getByRole('button', { name: '校验流程', exact: true }).click()
await page.waitForTimeout(500)
const validationText = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
if (!/校验通过|0\s*条|无错误/.test(validationText)) throw new Error('process validation did not report a pass state')
await capture({ id: 'ev2b-save-validate', atom: 'P53-EV-02b-F', objectIds: { definitionId, node: '办公室资产管理员意见' }, details: { savedDraft: true, validationPassed: true, backfillScreenshot: backfillFact.screenshot.relativePath, pickerScreenshot: candidateFact.screenshot.relativePath } })

await setFixture('node03', 'node15')
await gotoRoute('/workflow/task/mock-task-001', '.detail-header')
const taskObjects = { taskId: 'mock-task-001', processInstanceId: 'mock-process-001' }
await capture({ id: 'ev2c-taskdetail-before', atom: 'P53-EV-02c-F', objectIds: taskObjects, details: { opinionDialogOpen: false, taskFixture: 'node03' } })
await page.getByRole('tab', { name: '流程图', exact: true }).click()
const graphView = page.locator('.pg-view')
await graphView.waitFor({ state: 'visible', timeout: 15000 })
const graphNodeLabels = await page.locator('.pg-view .pg-node-label').allTextContents()
if (!graphNodeLabels.length) throw new Error('task process graph rendered without process nodes')
await capture({ id: 'ev2c-taskdetail-processgraph', atom: 'P53-EV-03a-F', objectIds: taskObjects, details: { graphVisible: true, nodeCount: graphNodeLabels.length, nodeLabels: graphNodeLabels } })
await page.getByRole('tab', { name: '审批详情列表', exact: true }).click()
const detailButton = page.getByRole('button', { name: '查看详情', exact: true }).first()
await detailButton.waitFor({ state: 'visible', timeout: 15000 })
await detailButton.click()
const opinionDialog = page.locator('.el-dialog').filter({ hasText: '审批意见详情' }).last()
await opinionDialog.waitFor({ state: 'visible', timeout: 10000 })
const opinionText = (await opinionDialog.innerText()).replace(/\s+/g, ' ').trim()
if (!opinionText.includes('审批意见详情')) throw new Error('opinion dialog content missing')
await capture({ id: 'ev2c-opinion-dialog-open', atom: 'P53-EV-02c-F', objectIds: taskObjects, details: { dialogTitle: '审批意见详情', dialogText: opinionText.slice(0, 1400) } })
await page.keyboard.press('Escape')
await opinionDialog.waitFor({ state: 'hidden', timeout: 10000 })
await writeFile(path.join(factsRoot, 'ev2c-opinion-dialog-escape.json'), JSON.stringify({ atom: 'P53-EV-02c-F', capturedAt: new Date().toISOString(), sourceFingerprint: sourceFingerprint.treeFingerprint, objectIds: taskObjects, dialogClosedByEscape: true, focusText: (await page.evaluate(() => (document.activeElement?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80))) }, null, 2) + '\n')

await page.setViewportSize({ width: 375, height: 812 })
for (const item of [
  { route: '/m/form/p61r10_batch_form', id: 'ev4-mobile-form-375', ready: '.form-render-page', objectIds: { formKey: 'p61r10_batch_form' } },
  { route: '/m/workflow', id: 'ev4-mobile-workflow-375', ready: '.mobile-workspace', objectIds: { page: 'mobile-workflow' } },
  { route: '/m/notify', id: 'ev4-mobile-notify-375', ready: '.m-notify', objectIds: { page: 'mobile-notify' } },
]) {
  await gotoRoute(item.route, item.ready)
  const fact = await capture({ id: item.id, atom: 'P53-EV-04a-F', objectIds: item.objectIds })
  if (fact.page.horizontalScroll) throw new Error(`mobile horizontal scroll at ${item.route}`)
  const labelled = fact.page.controls.filter((control) => control.text && /提交|发起|待办|草稿|全部已读|查看详情|工作台/.test(control.text))
  if (labelled.some((control) => control.height < 40)) throw new Error(`mobile primary touch target below 40px at ${item.route}`)
}

await writeFile(path.join(evidenceRoot, 'capture-network-index.json'), JSON.stringify({ capturedAt: new Date().toISOString(), baseUrl, identity, sourceFingerprint: sourceFingerprint.treeFingerprint, requests: network }, null, 2) + '\n')
const manifest = {
  generatedAt: new Date().toISOString(), browser: { name: 'Playwright Chromium', headless: false, visible: true, baseUrl }, identity,
  sourceFingerprint: sourceFingerprint.treeFingerprint, entryCount: entries.length, formalPngCount: entries.length, entries,
  checks: { menuCount: menuCaptures.length, menuCaptures, mobilePages: 4, pageErrors, sha256GeneratedForEachPng: entries.every((entry) => /^[0-9a-f]{64}$/.test(entry.sha256)) },
}
if (pageErrors.length) throw new Error(`browser page errors during capture: ${JSON.stringify(pageErrors)}`)
if (entries.length !== 16) throw new Error(`expected 16 formal captures, got ${entries.length}`)
await writeFile(path.join(evidenceRoot, 'capture-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ captureCount: entries.length, identity, menuCaptures, networkCount: network.length, pageErrors, sourceFingerprint: sourceFingerprint.treeFingerprint, manifest: path.join(evidenceRoot, 'capture-manifest.json') }, null, 2))
await context.close()
await browser.close()
