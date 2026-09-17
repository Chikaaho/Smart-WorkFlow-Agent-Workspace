import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const workspaceRoot = process.cwd()
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-03',
)
const factsRoot = path.join(evidenceRoot, 'facts')
const baseUrl = process.env.P53_CAPTURE_BASE_URL || 'http://localhost:5173'
const username = process.env.P53_CAPTURE_USERNAME
const password = process.env.P53_CAPTURE_PASSWORD
const captcha = process.env.P53_CAPTURE_CAPTCHA
if (!username || !password || !captcha) {
  throw new Error('Set P53_CAPTURE_USERNAME, P53_CAPTURE_PASSWORD, and P53_CAPTURE_CAPTCHA for this local capture run.')
}

const sourceFingerprint = JSON.parse(
  await readFile(path.join(evidenceRoot, 'capture-source-fingerprint-before.json'), 'utf8'),
)
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
let networkCursor = 0
let identity = null
const menuCaptures = []
const entries = []

page.on('response', (response) => {
  const url = new URL(response.url())
  if (url.origin !== baseUrl || !url.pathname.startsWith('/api/')) return
  const queryKeys = [...url.searchParams.keys()]
  const safePath = `${url.pathname}${queryKeys.length ? `?${[...new Set(queryKeys)].map((key) => `${key}=`).join('&')}` : ''}`
  network.push({
    capturedAt: new Date().toISOString(),
    method: response.request().method(),
    path: safePath,
    status: response.status(),
  })
})
page.on('pageerror', (error) => pageErrors.push(error.message))

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function pngDimensions(bytes) {
  if (bytes.readUInt32BE(0) !== 0x89504e47) throw new Error('Screenshot is not a PNG')
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
    const color = (selector, prop = 'backgroundColor') => {
      const el = document.querySelector(selector)
      return el ? getComputedStyle(el)[prop] : null
    }
    const root = document.documentElement
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const controls = [...document.querySelectorAll('button,a,[role="button"],[role="tab"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 64),
          width: +r.width.toFixed(2),
          height: +r.height.toFixed(2),
          tag: el.tagName,
          className: typeof el.className === 'string' ? el.className : '',
        }
      })
    return {
      url: location.href,
      viewport,
      document: { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, scrollHeight: root.scrollHeight },
      scroll: { x: window.scrollX, y: window.scrollY },
      horizontalScroll: root.scrollWidth > window.innerWidth,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      mainBg: color('.basic-layout__main, .mobile-form-page, .m-workflow, .m-notify, .login-page'),
      header: rect('.basic-layout__topbar'),
      brand: rect('.app-logo'),
      nav: rect('.basic-layout__nav'),
      actions: rect('.basic-layout__actions'),
      user: rect('.app-topbar__user'),
      headerBg: color('.basic-layout__topbar'),
      userName: document.querySelector('.app-topbar__user-name')?.textContent?.trim() || null,
      menuBox: rect('.app-topbar__dropdown'),
      menuItems: [...document.querySelectorAll('.app-topbar__dropdown .el-dropdown-menu__item')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => (el.textContent || '').trim().replace(/\s+/g, ' ')),
      controls,
      textSample: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 520),
    }
  })
}

function contrastRatio(fg, bg) {
  const parse = (value) => {
    const match = value.match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*([\d.]+))?\)/)
    if (!match) return null
    return [Number(match[1]), Number(match[2]), Number(match[3])]
  }
  const fgRgb = parse(fg)
  const bgRgb = parse(bg)
  if (!fgRgb || !bgRgb) return null
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      c /= 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const a = lum(fgRgb)
  const b = lum(bgRgb)
  return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2)
}

async function contrastSamples(selectors) {
  const samples = await page.evaluate((items) => {
    const parseAlpha = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/)
      if (!match) return 1
      const parts = match[1].split(',')
      return parts.length === 4 ? Number(parts[3]) : 1
    }
    const opaqueBackground = (el) => {
      for (let cur = el; cur; cur = cur.parentElement) {
        const bg = getComputedStyle(cur).backgroundColor
        if (parseAlpha(bg) === 1 && !bg.includes('0, 0, 0, 0')) return bg
      }
      return getComputedStyle(document.body).backgroundColor
    }
    return items.flatMap(({ selector, label }) => [...document.querySelectorAll(selector)].slice(0, 2).map((el) => ({
      label,
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
      foreground: getComputedStyle(el).color,
      background: opaqueBackground(el),
      fontSize: getComputedStyle(el).fontSize,
    })))
  }, selectors)
  return samples.map((sample) => ({ ...sample, ratio: contrastRatio(sample.foreground, sample.background) }))
}

async function capture({ id, atom, objectIds, details = {}, contrastSelectors = [], captureIdentity = identity }) {
  const url = page.url()
  const viewport = page.viewportSize()
  if (!viewport) throw new Error(`No viewport for ${id}`)
  const measured = await pageFacts()
  const captureTime = new Date().toISOString()
  const pngPath = path.join(evidenceRoot, `${id}.png`)
  await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' })
  const pngBytes = await readFile(pngPath)
  const dimensions = pngDimensions(pngBytes)
  const networkEvents = network.slice(networkCursor)
  networkCursor = network.length
  const fileHash = sha256(pngBytes)
  const contrast = contrastSelectors.length ? await contrastSamples(contrastSelectors) : []
  const fact = {
    atom,
    capturedAt: captureTime,
    capture: { source: 'visible headed Chromium browser', headless: false, viewport, url, deviceScaleFactor: 1 },
    identity: captureIdentity,
    objectIds,
    sourceFingerprint: sourceFingerprint.treeFingerprint,
    screenshot: {
      absolutePath: pngPath,
      relativePath: path.relative(evidenceRoot, pngPath).split(path.sep).join('/'),
      sha256: fileHash,
      width: dimensions.width,
      height: dimensions.height,
    },
    page: measured,
    contrast,
    networkEvents,
    details,
  }
  const factsPath = path.join(factsRoot, `${id}.json`)
  await writeFile(factsPath, `${JSON.stringify(fact, null, 2)}\n`)
  entries.push({
    atom,
    id,
    absolutePath: pngPath,
    relativePath: path.relative(evidenceRoot, pngPath).split(path.sep).join('/'),
    sha256: fileHash,
    width: dimensions.width,
    height: dimensions.height,
    capturedAt: captureTime,
    url,
    viewport,
    identity: captureIdentity,
    objectIds,
    sourceFingerprint: sourceFingerprint.treeFingerprint,
    factsPath: path.relative(evidenceRoot, factsPath).split(path.sep).join('/'),
    networkIndex: 'capture-network-index.json',
  })
  return fact
}

async function gotoRoute(route, readySelector = 'body') {
  await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' })
  await page.locator(readySelector).waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(250)
}

async function executeCapture() {
await mkdir(factsRoot, { recursive: true })
await page.goto(new URL('/login', baseUrl).href, { waitUntil: 'domcontentloaded' })
await page.locator('.login-page__form').waitFor({ state: 'visible', timeout: 20000 })
await page.locator('.login-page__captcha').waitFor({ state: 'visible', timeout: 20000 })
await capture({
  id: 'ev4-mobile-login-375',
  atom: 'P53-EV-04a-F',
  objectIds: { route: '/login' },
  details: { inputsBlank: true, captchaAnswerNotRecorded: true },
  captureIdentity: {
    username: null,
    displayName: null,
    tenantContext: null,
    authenticationState: 'anonymous login screen',
  },
  contrastSelectors: [
    { selector: '.login-page__form label', label: 'login form label' },
    { selector: '.login-page__welcome', label: 'login heading' },
  ],
})
const loginButtonBox = await page.locator('.login-page__submit').boundingBox()
if (!loginButtonBox || loginButtonBox.height < 40) {
  throw new Error(`Login touch target is below 40px: ${JSON.stringify(loginButtonBox)}`)
}

await page.setViewportSize({ width: 1440, height: 1024 })
const meResponsePromise = page.waitForResponse(
  (response) => response.url().includes('/api/system/auth/me'),
  { timeout: 20000 },
).catch(() => null)
await page.locator('input[autocomplete="username"]').fill(username)
await page.locator('input[autocomplete="current-password"]').fill(password)
await page.locator('.login-page__captcha-row input').fill(captcha)
await page.locator('.login-page__submit').click()
await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30000 })
await page.locator('.app-topbar__user-name').waitFor({ state: 'visible', timeout: 20000 })
const displayName = (await page.locator('.app-topbar__user-name').innerText()).trim()
if (displayName !== '系统管理员') throw new Error(`Unexpected authenticated display name: ${displayName}`)
let authPayload = null
const meResponse = await meResponsePromise
if (meResponse?.ok()) {
  try {
    const responseJson = await meResponse.json()
    authPayload = responseJson?.data ?? responseJson
  } catch {}
}
identity = {
  username,
  displayName,
  tenantContext: 'T0',
  authMeHttpStatus: meResponse?.status() ?? null,
  authUserId: authPayload?.user?.id ?? authPayload?.user?.userId ?? authPayload?.id ?? authPayload?.userId ?? null,
}

async function captureMenu(route, area, forbiddenItem, requiredItem, id) {
  await gotoRoute(route, '.basic-layout__topbar')
  await page.locator('.app-topbar__user').click()
  const menu = page.locator('.app-topbar__dropdown')
  await menu.waitFor({ state: 'visible', timeout: 10000 })
  const items = await menu.locator('.el-dropdown-menu__item').allTextContents()
  const normalized = items.map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean)
  if (!normalized.length || normalized.some((item) => item.includes(forbiddenItem))) {
    throw new Error(`${area} menu failed its forbidden-item check: ${normalized.join(' | ')}`)
  }
  if (!normalized.some((item) => item.includes(requiredItem))) {
    throw new Error(`${area} menu missing expected item ${requiredItem}: ${normalized.join(' | ')}`)
  }
  if (normalized.some((item) => /修改密码|忘记密码/.test(item))) {
    throw new Error(`${area} menu exposed a password action outside the P53 boundary`)
  }
  const fact = await capture({
    id,
    atom: 'P53-EV-02a-F',
    objectIds: { route },
    details: { area, menuItems: normalized, forbiddenItemAbsent: true },
  })
  menuCaptures.push({ area, url: fact.capture.url, items: normalized, box: fact.page.menuBox })
  await page.keyboard.press('Escape')
  await menu.waitFor({ state: 'hidden', timeout: 10000 })
}

await captureMenu('/form/form-def-list', 'admin', '进入后台', '返回前台', 'ev2a-admin-menu-expanded')
await captureMenu('/workspace', 'portal', '返回前台', '进入后台', 'ev2a-portal-menu-expanded')

const desktopRoutes = [
  { route: '/workspace', id: 'ev3-shell-workspace-1440', atom: 'P53-EV-03a-F', objectIds: { page: 'workspace' } },
  { route: '/workflow/catalog', id: 'ev3-shell-catalog-1440', atom: 'P53-EV-03a-F', objectIds: { page: 'workflow-catalog' } },
  { route: '/workflow/task/af63f9ac-b248-11f1-9b6a-00ffa7734675', id: 'ev3-shell-taskdetail-1440', atom: 'P53-EV-03a-F', objectIds: { taskId: 'af63f9ac-b248-11f1-9b6a-00ffa7734675', processInstanceId: '6f46dbc8-b248-11f1-9b6a-00ffa7734675', businessKey: '941bf7a3-513e-4329-a15e-705f1a86a934' } },
  { route: '/form/form-def-list', id: 'ev3-shell-admin-formdeflist-1440', atom: 'P53-EV-03a-F', objectIds: { page: 'form-definition-list' } },
]
for (const item of desktopRoutes) {
  await gotoRoute(item.route, '.basic-layout__topbar')
  const fact = await capture(item)
  if (fact.page.horizontalScroll) throw new Error(`Unexpected horizontal scroll at ${item.route}`)
}

const definitionId = '2100424929376403458'
await gotoRoute(`/workflow/defs/${definitionId}/design`, '.designer-page')
const approvalNode = page.locator('.designer-node').filter({ hasText: '节点一-管理员审批' }).first()
await approvalNode.waitFor({ state: 'visible', timeout: 20000 })
await approvalNode.click()
const pickerButton = page.getByRole('button', { name: '查看候选', exact: true })
await pickerButton.waitFor({ state: 'visible', timeout: 10000 })
await pickerButton.click()
const picker = page.locator('.el-dialog').filter({ hasText: '选择审批人' }).last()
await picker.waitFor({ state: 'visible', timeout: 10000 })
const adminRow = picker.locator('.el-table__row').filter({ hasText: '系统管理员' }).filter({ hasText: '1' }).first()
await adminRow.waitFor({ state: 'visible', timeout: 15000 })
const candidateText = (await adminRow.innerText()).replace(/\s+/g, ' ').trim()
const candidateModalFact = await capture({
  id: 'ev2b-picker-candidates',
  atom: 'P53-EV-02b-F',
  objectIds: { definitionId, processKey: 'bpm_ea1731b3ae1e4f38', node: '节点一-管理员审批', candidateId: '1' },
  details: { candidateVisible: candidateText, dialogTitle: '选择审批人', modalOpen: true },
})
await adminRow.getByRole('button', { name: '选入', exact: true }).click()
await picker.waitFor({ state: 'hidden', timeout: 10000 })
const approverInput = page.locator('.approver-field input').first()
await approverInput.waitFor({ state: 'visible', timeout: 10000 })
const backfilledValue = await approverInput.inputValue()
if (!backfilledValue.includes('1')) throw new Error(`Candidate id was not backfilled in the UI: ${backfilledValue}`)
const backfillFact = await capture({
  id: 'ev2b-picker-selected-backfilled',
  atom: 'P53-EV-02b-F',
  objectIds: { definitionId, processKey: 'bpm_ea1731b3ae1e4f38', node: '节点一-管理员审批', candidateId: '1' },
  details: { candidateId: '1', candidateName: '系统管理员', uiFieldValue: backfilledValue, pickerClosed: true },
})
await page.getByRole('button', { name: '保存草稿', exact: true }).click()
const saveToast = page.locator('.el-message--success').filter({ hasText: '草稿已保存' }).last()
await saveToast.waitFor({ state: 'visible', timeout: 15000 })
const saveText = (await saveToast.innerText()).replace(/\s+/g, ' ').trim()
const validateResponsePromise = page.waitForResponse(
  (response) => new URL(response.url()).pathname.endsWith(`/workflow/defs/${definitionId}/validate`),
  { timeout: 20000 },
)
await page.getByRole('button', { name: '校验', exact: true }).click()
const validateResponse = await validateResponsePromise
if (!validateResponse.ok()) throw new Error(`Server validation returned HTTP ${validateResponse.status()}`)
const validateToast = page.locator('.el-message--success').filter({ hasText: '校验通过' }).last()
await validateToast.waitFor({ state: 'visible', timeout: 15000 })
const validateText = (await validateToast.innerText()).replace(/\s+/g, ' ').trim()
const relevantValidation = /0\s*(条|个)?|通过/.test(validateText)
const saveValidateFact = await capture({
  id: 'ev2b-save-validate',
  atom: 'P53-EV-02b-F',
  objectIds: { definitionId, processKey: 'bpm_ea1731b3ae1e4f38', node: '节点一-管理员审批', candidateId: '1' },
  details: {
    savedDraft: true,
    saveToast: saveText,
    validateToast: validateText,
    validationZeroErrors: relevantValidation,
    noPublishAction: true,
    pickerScreenshot: candidateModalFact.screenshot.relativePath,
    backfillScreenshot: backfillFact.screenshot.relativePath,
  },
})
if (!relevantValidation) throw new Error(`Validation result did not expose a pass or zero-error state: ${validateText}`)

const taskId = 'af63f9ac-b248-11f1-9b6a-00ffa7734675'
await gotoRoute(`/workflow/task/${taskId}`, '.detail-header')
const taskObjects = { taskId, processInstanceId: '6f46dbc8-b248-11f1-9b6a-00ffa7734675', businessKey: '941bf7a3-513e-4329-a15e-705f1a86a934' }
const opinionBeforeFact = await capture({
  id: 'ev2c-taskdetail-before',
  atom: 'P53-EV-02c-F',
  objectIds: taskObjects,
  details: { opinionDialogOpen: false, completedTask: true },
})
await page.getByRole('tab', { name: '流程图', exact: true }).click()
const graphView = page.locator('.pg-view')
await graphView.scrollIntoViewIfNeeded()
await graphView.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }))
await page.waitForTimeout(100)
const graphBox = await graphView.boundingBox()
if (!graphBox || graphBox.y < 0 || graphBox.y + graphBox.height > 1024) {
  throw new Error(`Task detail process graph is not fully inside the viewport: ${JSON.stringify(graphBox)}`)
}
const processGraph = graphView.locator('svg')
await processGraph.waitFor({ state: 'visible', timeout: 15000 })
const graphNodeLabels = await page.locator('.pg-view .pg-node-label').allTextContents()
if (!graphNodeLabels.length) throw new Error('Task detail process graph rendered without any process nodes')
const processGraphFact = await capture({
  id: 'ev2c-taskdetail-processgraph',
  atom: 'P53-EV-03a-F',
  objectIds: taskObjects,
  details: { graphVisible: true, graphBox, nodeCount: graphNodeLabels.length, nodeLabels: graphNodeLabels },
})
await page.getByRole('tab', { name: '审批详情列表', exact: true }).click()
const detailButton = page.getByRole('button', { name: '查看详情', exact: true }).first()
await detailButton.waitFor({ state: 'visible', timeout: 15000 })
await detailButton.click()
const opinionDialog = page.locator('.el-dialog').filter({ hasText: '审批意见详情' }).last()
await opinionDialog.waitFor({ state: 'visible', timeout: 10000 })
const opinionText = (await opinionDialog.innerText()).replace(/\s+/g, ' ').trim()
const requiredOpinionFacts = ['节点一-管理员审批', '系统管理员', '表单版本', 'P53ev2 节点一审批意见：同意，转入节点二']
for (const expected of requiredOpinionFacts) if (!opinionText.includes(expected)) throw new Error(`Opinion dialog is missing ${expected}`)
const opinionOpenFact = await capture({
  id: 'ev2c-opinion-dialog-open',
  atom: 'P53-EV-02c-F',
  objectIds: taskObjects,
  details: { dialogTitle: '审批意见详情', fieldsVisible: requiredOpinionFacts, dialogText: opinionText },
})
await page.keyboard.press('Escape')
await opinionDialog.waitFor({ state: 'hidden', timeout: 10000 })
const returnedFocus = await page.evaluate(() => {
  const el = document.activeElement
  return { tag: el?.tagName || null, text: (el?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80), ariaLabel: el?.getAttribute('aria-label') || null }
})
const focusReturned = /查看详情/.test(returnedFocus.text)
const opinionEscape = {
  atom: 'P53-EV-02c-F',
  capturedAt: new Date().toISOString(),
  url: page.url(),
  identity,
  objectIds: taskObjects,
  sourceFingerprint: sourceFingerprint.treeFingerprint,
  dialogClosedByEscape: true,
  returnedFocus,
  focusReturnedToTrigger: focusReturned,
  openScreenshot: opinionOpenFact.screenshot.relativePath,
}
await writeFile(path.join(factsRoot, 'ev2c-opinion-dialog-escape.json'), `${JSON.stringify(opinionEscape, null, 2)}\n`)
if (!focusReturned) throw new Error(`Escape closed the opinion dialog but focus did not return to its trigger: ${JSON.stringify(returnedFocus)}`)

await page.setViewportSize({ width: 375, height: 812 })
const mobileRoutes = [
  { route: '/m/form/p61r10_batch_form', id: 'ev4-mobile-form-375', atom: 'P53-EV-04a-F', objectIds: { formKey: 'p61r10_batch_form' }, ready: '.form-render-page', contrast: [{ selector: '.form-render-page__field label, .el-form-item__label', label: 'mobile form label' }, { selector: '.form-render-page__hint', label: 'mobile form hint' }] },
  { route: '/m/workflow', id: 'ev4-mobile-workflow-375', atom: 'P53-EV-04a-F', objectIds: { page: 'mobile-workflow' }, ready: '.mobile-workspace', contrast: [{ selector: '.mobile-workspace .m-title', label: 'mobile workflow heading' }, { selector: '.mobile-workspace .m-item-meta, .mobile-workspace .m-empty', label: 'mobile workflow body' }] },
  { route: '/m/notify', id: 'ev4-mobile-notify-375', atom: 'P53-EV-04a-F', objectIds: { page: 'mobile-notify' }, ready: '.m-notify', contrast: [{ selector: '.m-notify-item .title', label: 'mobile notification title' }, { selector: '.m-notify-item .content, .m-notify-item .time', label: 'mobile notification body' }] },
]
const mobileFacts = []
for (const item of mobileRoutes) {
  await gotoRoute(item.route, item.ready)
  const fact = await capture({ id: item.id, atom: item.atom, objectIds: item.objectIds, contrastSelectors: item.contrast })
  if (fact.page.horizontalScroll) throw new Error(`Unexpected horizontal scroll at ${item.route}`)
  const labelled = fact.page.controls.filter((control) => control.text && /提交|发起|待办|我发起|草稿|全部已读|查看详情|工作台/.test(control.text))
  const below40 = labelled.filter((control) => control.height < 40)
  if (below40.length) throw new Error(`Mobile primary touch targets below 40px at ${item.route}: ${JSON.stringify(below40)}`)
  mobileFacts.push({ route: item.route, screenshot: fact.screenshot.relativePath, document: fact.page.document, horizontalScroll: fact.page.horizontalScroll, primaryTargets: labelled })
}

const allContrast = await Promise.all(entries.map(async (entry) => {
  const file = path.join(evidenceRoot, entry.factsPath)
  const contents = await readFile(file, 'utf8')
  return JSON.parse(contents).contrast.map((sample) => ({ screenshot: entry.relativePath, ...sample }))
}))
const contrastResults = allContrast.flat()
const failedContrast = contrastResults.filter((sample) => sample.ratio != null && sample.ratio < 4.5)
const contrastPayload = {
  method: 'WCAG 2.1 relative luminance, runtime getComputedStyle foreground and nearest opaque ancestor background',
  threshold: 'normal text >= 4.5:1',
  samples: contrastResults,
  failedCount: failedContrast.length,
}
await writeFile(path.join(evidenceRoot, 'contrast-verify.json'), `${JSON.stringify(contrastPayload, null, 2)}\n`)
if (failedContrast.length) throw new Error(`Mobile contrast samples below 4.5:1: ${JSON.stringify(failedContrast)}`)

await writeFile(path.join(evidenceRoot, 'capture-network-index.json'), `${JSON.stringify({
  capturedAt: new Date().toISOString(),
  baseUrl,
  identity,
  sourceFingerprint: sourceFingerprint.treeFingerprint,
  requests: network,
}, null, 2)}\n`)

const manifest = {
  generatedAt: new Date().toISOString(),
  browser: { name: 'Playwright Chromium', headless: false, visible: true, baseUrl },
  identity,
  sourceFingerprint: sourceFingerprint.treeFingerprint,
  entryCount: entries.length,
  formalPngCount: entries.length,
  entries,
  checks: {
    menuCount: menuCaptures.length,
    menuCaptures,
    mobilePages: mobileFacts,
    pageErrors,
    sha256GeneratedForEachPng: entries.every((entry) => /^[0-9a-f]{64}$/.test(entry.sha256)),
  },
}
if (pageErrors.length) throw new Error(`Browser page errors during capture: ${JSON.stringify(pageErrors)}`)
if (entries.length !== 16) throw new Error(`Expected 16 final PNGs including the real task process graph, captured ${entries.length}`)
await writeFile(path.join(evidenceRoot, 'capture-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(JSON.stringify({
  captureCount: entries.length,
  identity: { username: identity.username, displayName: identity.displayName, tenantContext: identity.tenantContext },
  menuCaptures,
  networkCount: network.length,
  pageErrors,
  sourceFingerprint: sourceFingerprint.treeFingerprint,
  manifest: path.join(evidenceRoot, 'capture-manifest.json'),
}, null, 2))

await context.close()
await browser.close()
}

await executeCapture().catch(async (error) => {
  console.error(error?.stack || String(error))
  await context.close().catch(() => {})
  await browser.close().catch(() => {})
  process.exitCode = 1
})
