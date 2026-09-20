/**
 * P53 FORMAL_FLOW 最终移动态采集（提示08 / review-10 R1a+R1b）：
 *  - 可见有头 Chromium（headless=false），真实后端（/api/* 经 vite 代理到 8080）；
 *  - 真实验证码位图保存后由执行会话人工读数回填（文件握手，失败自动换挑战重试）；
 *  - 375×812 登录 /m/form /m/workflow /m/notify 四页 + 1440 桌面登录复核；
 *  - DOM 文字/控件两两碰撞检测（>4px² 判罚）、横向滚动、主要触控目标、
 *    未授权登录能力（账号登录租户输入/记住登录状态/忘记密码）DOM 计数必须为 0；
 *  - 非空 /api/* 网络索引；任何断言失败都以非零退出。
 * 用法：node formal-mobile-capture.mjs  （需 real dev server 已运行在 BASE_URL）
 */
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

const workspaceRoot = process.cwd()
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(
  workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-08',
)
const factsRoot = path.join(evidenceRoot, 'facts')
const baseUrl = process.env.P53_CAPTURE_BASE_URL ?? 'http://localhost:5173'
const username = process.env.P53_CAPTURE_USERNAME ?? 'superadmin'
const password = process.env.P53_CAPTURE_PASSWORD ?? 'admin123'
const formKey = process.env.P53_FORM_KEY ?? 'p53ev08_mobile_form'
const fingerprint = JSON.parse(await readFile(path.join(evidenceRoot, 'capture-source-fingerprint-before.json'), 'utf8'))

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
})
let page = await context.newPage()
const network = []
const pageErrors = []
const entries = []
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function pageAudit() {
  return page.evaluate(() => {
    const round = (n) => Math.round(n * 100) / 100
    const root = document.documentElement
    const visible = (el) => {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }
    const texts = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const value = n.textContent
      if (!value || !value.trim()) continue
      const el = n.parentElement
      if (!el || seen.has(el) || !visible(el)) continue
      seen.add(el)
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) {
        if (r.width <= 0 || r.height <= 0) continue
        texts.push({
          el,
          component: el.closest('.el-select,.el-input,.el-date-editor,.el-checkbox,.el-radio,.el-switch,.el-button,.el-dropdown-menu'),
          text: value.trim().slice(0, 40),
          rect: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) },
        })
      }
    }
    const controls = []
    for (const el of document.querySelectorAll('button,a,input,[role="button"],[role="tab"]')) {
      if (!visible(el)) continue
      const r = el.getBoundingClientRect()
      controls.push({
        el,
        component: el.closest('.el-select,.el-input,.el-date-editor,.el-checkbox,.el-radio,.el-switch,.el-button,.el-dropdown-menu'),
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        rect: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) },
      })
    }
    const overlaps = (a, b) => {
      const w = Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - Math.max(a.rect.x, b.rect.x)
      const h = Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - Math.max(a.rect.y, b.rect.y)
      return w > 0 && h > 0 ? round(w * h) : 0
    }
    const related = (a, b) => a.el === b.el
      || a.el.contains(b.el) || b.el.contains(a.el)
      || (a.component && b.component && a.component === b.component)
    const collisions = []
    const push = (a, b, kind) => {
      const area = overlaps(a, b)
      if (area > 4) collisions.push({ kind, area, a: { text: a.text, rect: a.rect }, b: { text: b.text, rect: b.rect } })
    }
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        if (!related(texts[i], texts[j])) push(texts[i], texts[j], 'text-text')
      }
    }
    for (const t of texts) {
      for (const c of controls) {
        if (!related(t, c)) push(t, c, 'text-control')
      }
    }
    collisions.sort((a, b) => b.area - a.area)
    const bodyText = document.body.innerText || ''
    const mainFormLabels = [...document.querySelectorAll('.login-page__form > label')]
      .map((el) => (el.textContent || '').trim().replace(/\s+/g, ' '))
    const forbiddenControls = [...document.querySelectorAll('button,a,[role="button"]')]
      .filter((el) => visible(el) && /忘记密码|记住登录/.test(el.textContent || ''))
      .map((el) => (el.textContent || '').trim())
    const audit = {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      horizontalScroll: root.scrollWidth > innerWidth,
      scrollWidth: root.scrollWidth,
      textLineCount: texts.length,
      controlCount: controls.length,
      collisions: collisions.slice(0, 40),
      collisionCount: collisions.length,
      unauthorized: {
        tenantLabelInMainFormCount: mainFormLabels.filter((t) => t.includes('租户')).length,
        rememberTextCount: (bodyText.match(/记住登录状态/g) || []).length,
        forgotTextCount: (bodyText.match(/忘记密码/g) || []).length,
        forbiddenControlCount: forbiddenControls.length,
        forbiddenControls,
        mainFormLabels,
        ssoTenantInputCount: document.querySelectorAll('.login-page__sso-tenant input').length,
      },
      primaryTouchTargets: controls
        .filter((c) => /登录|提交|发起|保存|待办|草稿|全部已读|查看详情|工作台/.test(c.text))
        .map((c) => ({ text: c.text, h: c.rect.h, w: c.rect.w })),
      pageTextSample: bodyText.replace(/\s+/g, ' ').trim().slice(0, 500),
    }
    return audit
  })
}

async function capture({ id, objectIds, readySelector, extra = {} }) {
  if (readySelector) await page.locator(readySelector).first().waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(400)
  const errorsBefore = pageErrors.length
  const audit = await pageAudit()
  const pngPath = path.join(evidenceRoot, id + '.png')
  await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' })
  const pngBytes = await readFile(pngPath)
  const dimensions = pngDimensions(pngBytes)
  const fact = {
    atom: 'P53-EV-07d-R1a/R1b',
    tier: 'FORMAL_FLOW',
    headless: false,
    capturedAt: new Date().toISOString(),
    capture: { source: 'visible headed Chromium browser', baseUrl, viewport: page.viewportSize(), url: page.url(), deviceScaleFactor: 1 },
    identity,
    objectIds,
    sourceFingerprint: fingerprint.treeFingerprint,
    screenshot: { relativePath: id + '.png', sha256: sha256(pngBytes), width: dimensions.width, height: dimensions.height },
    audit, extra,
  }
  const factsPath = path.join(factsRoot, id + '.json')
  await writeFile(factsPath, JSON.stringify(fact, null, 2) + '\n')
  entries.push({
    id, url: page.url(), viewport: page.viewportSize(), identity, objectIds,
    screenshot: fact.screenshot, factsPath: path.relative(evidenceRoot, factsPath).split(path.sep).join('/'),
  })
  if (audit.horizontalScroll) throw new Error(id + ': horizontal scroll detected')
  if (audit.collisionCount > 0) throw new Error(id + ': ' + audit.collisionCount + ' text/control collisions, largest=' + JSON.stringify(audit.collisions[0]))
  if (pageErrors.length > errorsBefore) throw new Error(id + ': new page errors: ' + JSON.stringify(pageErrors.slice(errorsBefore)))
  return fact
}

async function gotoRoute(route, readySelector) {
  await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' })
  if (readySelector) await page.locator(readySelector).first().waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(300)
}

await mkdir(factsRoot, { recursive: true })

await gotoRoute('/login', '.login-page__form')
const captchaLocator = page.locator('img.login-page__captcha')
await captchaLocator.waitFor({ state: 'visible', timeout: 20000 })
const captchaSrc = await captchaLocator.getAttribute('src')
if (!captchaSrc || !captchaSrc.startsWith('data:image/png')) {
  throw new Error('login captcha is not a real backend PNG bitmap (mock SVG detected): ' + String(captchaSrc).slice(0, 40))
}
const loginFact = await capture({ id: 'ev08m-login-375', objectIds: { route: '/login' }, readySelector: '.login-page__form' })
if (loginFact.audit.unauthorized.tenantLabelInMainFormCount !== 0
  || loginFact.audit.unauthorized.rememberTextCount !== 0
  || loginFact.audit.unauthorized.forgotTextCount !== 0
  || loginFact.audit.unauthorized.forbiddenControlCount !== 0) {
  throw new Error('unauthorized login capabilities present: ' + JSON.stringify(loginFact.audit.unauthorized))
}

let loggedIn = false
for (let attempt = 1; attempt <= 3 && !loggedIn; attempt++) {
  if (attempt > 1) {
    await gotoRoute('/login', '.login-page__form')
    await captchaLocator.waitFor({ state: 'visible', timeout: 20000 })
  }
  const attemptPng = path.join(evidenceRoot, 'captcha-real-attempt' + attempt + '.png')
  await captchaLocator.screenshot({ path: attemptPng })
  const answerFile = path.join(evidenceRoot, 'captcha-answer-' + attempt + '.txt')
  await rm(answerFile, { force: true })
  await writeFile(path.join(evidenceRoot, 'captcha-answer-request-' + attempt + '.json'), JSON.stringify({
    requestedAt: new Date().toISOString(), captchaPng: path.basename(attemptPng),
    answerFile: path.basename(answerFile), instructions: '把验证码图片中可见字符写入该答案文件（不区分大小写）',
  }, null, 2) + '\n')
  let code = null
  for (let i = 0; i < 120 && !code; i++) {
    await sleep(2000)
    try {
      const raw = await readFile(answerFile, 'utf8')
      code = raw.trim() || null
    } catch {}
  }
  if (!code) throw new Error('captcha answer file not provided in time: ' + path.basename(answerFile))
  await page.locator('input[autocomplete="username"]').fill(username)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('.login-page__captcha-row input').fill(code)
  await page.locator('.login-page__submit').click()
  try {
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30000 })
    loggedIn = true
  } catch {
    console.log('LOGIN attempt ' + attempt + ' failed (captcha expired or mismatched); retrying with a fresh challenge')
  }
}
if (!loggedIn) throw new Error('login did not succeed after 3 attempts')
await page.setViewportSize({ width: 375, height: 812 })
await page.locator('.app-topbar__user-name').waitFor({ state: 'visible', timeout: 20000 })
identity = {
  username,
  displayName: (await page.locator('.app-topbar__user-name').innerText()).trim(),
  tenantContext: 'T0（真实后端 8080，授权 dev/test 身份）',
  authMode: 'real captcha bitmap + RSA-OAEP login',
}

const mobilePages = [
  { route: '/m/form/' + formKey, id: 'ev08m-form-375', ready: '.form-render-page', objectIds: { formKey } },
  { route: '/m/workflow', id: 'ev08m-workflow-375', ready: '.mobile-workspace', objectIds: { page: 'mobile-workflow' } },
  { route: '/m/notify', id: 'ev08m-notify-375', ready: '.m-notify', objectIds: { page: 'mobile-notify' } },
]
for (const item of mobilePages) {
  await gotoRoute(item.route, item.ready)
  const fact = await capture(item)
  if (item.id === 'ev08m-form-375') {
    const errorAlerts = await page.locator('.form-render-page__alert--error, .el-alert--error').count()
    const titleText = (await page.locator('.form-render-page__title').first().innerText().catch(() => '')) || ''
    fact.extra.formObject = { formKey, pageTitle: titleText.slice(0, 80), errorAlertCount: errorAlerts }
    if (errorAlerts > 0) throw new Error('mobile form page shows error alert for ' + formKey)
    if (!titleText.trim()) throw new Error('mobile form page title is empty for ' + formKey)
  }
}

const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 1024 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
})
const desktopPage = await desktopContext.newPage()
const desktopErrors = []
desktopPage.on('pageerror', (error) => desktopErrors.push(error.message))
const mobilePageRef = page
page = desktopPage
await page.goto(new URL('/login', baseUrl).href, { waitUntil: 'domcontentloaded' })
await page.locator('.login-page__form').waitFor({ state: 'visible', timeout: 20000 })
await page.waitForTimeout(600)
const desktopFact = await capture({ id: 'ev08f-login-1440', objectIds: { route: '/login', viewport: '1440x1024' } })
if (desktopFact.audit.unauthorized.tenantLabelInMainFormCount !== 0
  || desktopFact.audit.unauthorized.rememberTextCount !== 0
  || desktopFact.audit.unauthorized.forgotTextCount !== 0
  || desktopFact.audit.unauthorized.forbiddenControlCount !== 0) {
  throw new Error('unauthorized desktop login capabilities present: ' + JSON.stringify(desktopFact.audit.unauthorized))
}
page = mobilePageRef
if (desktopErrors.length) throw new Error('desktop login page errors: ' + JSON.stringify(desktopErrors))
await desktopContext.close()

const apiRequests = network.filter((item) => item.path.startsWith('/api/'))
await writeFile(path.join(evidenceRoot, 'capture-network-index.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), baseUrl, mode: 'REAL_BACKEND', identity,
  sourceFingerprint: fingerprint.treeFingerprint,
  requestCount: apiRequests.length, requests: apiRequests,
}, null, 2) + '\n')
if (apiRequests.length === 0) throw new Error('network index is empty — FORMAL_FLOW requires real /api/* requests')

const manifest = {
  generatedAt: new Date().toISOString(),
  tier: 'FORMAL_FLOW',
  headless: false,
  browser: { name: 'Playwright Chromium', visible: true, baseUrl, backend: 'http://localhost:8080 (real)' },
  identity,
  sourceFingerprint: fingerprint.treeFingerprint,
  entryCount: entries.length,
  entries,
  checks: {
    collisionCountTotal: 0,
    horizontalScroll: false,
    pageErrors,
    unauthorizedLoginCapabilities: {
      tenantLabelInMainForm: 0, rememberLoginState: 0, forgotPassword: 0,
      note: 'SSO 区块租户 ID 输入为 EV-06 锁定契约（方向 §4.4），不属于账号登录未授权能力',
    },
    realCaptchaPng: true,
    realNetworkRequestCount: apiRequests.length,
  },
}
await writeFile(path.join(evidenceRoot, 'formal-mobile-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({
  captureCount: entries.length, identity,
  networkCount: apiRequests.length, pageErrors,
  sourceFingerprint: fingerprint.treeFingerprint,
}, null, 2))
await context.close()
await browser.close()

