/**
 * P53 DESIGN_FIDELITY 运行态采集：设计态 fixture 渲染 1440×1024（节点19 1512 高），
 * 输出 runtime PNG + DOM 清单（文字边界/字体/容器几何/computed style）。
 * 用法：node capture-nodes.mjs <familyId|all>  （需 dev:mock 已运行在 BASE_URL）
 */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NODES, FAMILIES } from './p53-nodes.mjs'

const workspaceRoot = path.resolve(process.cwd())
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-05',
)
const baseUrl = process.env.P53_BASE_URL ?? 'http://localhost:5174'
const only = process.argv[2] ?? 'all'

async function ensureVisible(page, selector, timeout = 15000) {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout }).catch(() => {})
}

async function openUserDropdown(page) {
  const dropdown = page.locator('.el-dropdown-menu').first()
  for (let i = 0; i < 4 && !(await dropdown.isVisible()); i++) {
    await page.locator('.app-topbar__user').click()
    await page.waitForTimeout(400)
  }
  await dropdown.waitFor({ state: 'visible', timeout: 8000 })
  return dropdown
}

async function enterAdmin(page) {
  const dropdown = await openUserDropdown(page)
  for (let i = 0; i < 3; i++) {
    try {
      await dropdown.getByText('进入后台').click({ timeout: 5000 })
      break
    } catch {
      await page.waitForTimeout(500)
    }
  }
  await page.locator('header.basic-layout__topbar--admin').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(700)
}

async function domInventory(page, nodeId) {
  return page.evaluate((nodeIdArg) => {
    const round = (n) => Math.round(n * 100) / 100
    const bboxOf = (el) => {
      const r = el.getBoundingClientRect()
      return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) }
    }
    const cs = (el) => getComputedStyle(el)
    // 文字元素：存在直接非空 text node 的元素
    const texts = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent
      if (!t || !t.trim()) continue
      const el = n.parentElement
      if (!el || seen.has(el)) continue
      seen.add(el)
      const style = cs(el)
      const range = document.createRange()
      range.selectNodeContents(n)
      const rects = Array.from(range.getClientRects())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) }))
      texts.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 60),
        text: t.trim().slice(0, 80),
        bbox: bboxOf(el),
        lineRects: rects,
        font: {
          family: style.fontFamily,
          size: style.fontSize,
          weight: style.fontWeight,
          lineHeight: style.lineHeight,
        },
        color: style.color,
      })
    }
    const pick = (sel) =>
      Array.from(document.querySelectorAll(sel)).map((el) => ({
        cls: String(el.className || '').slice(0, 60),
        bbox: bboxOf(el),
        bg: cs(el).backgroundColor,
        radius: cs(el).borderRadius,
        border: cs(el).borderTopColor,
        shadow: cs(el).boxShadow === 'none' ? null : cs(el).boxShadow,
      }))
    const header = document.querySelector('header')
    const aside = document.querySelector('aside, .app-sidebar, .basic-layout__sidebar')
    return {
      node: nodeIdArg,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      topbarHeight: header ? round(header.getBoundingClientRect().height) : null,
      sidebarWidth: aside ? round(aside.getBoundingClientRect().width) : null,
      pageBackground: cs(document.body).backgroundColor,
      texts,
      containers: {
        header: header ? { bbox: bboxOf(header), bg: cs(header).backgroundColor } : null,
        aside: aside ? { bbox: bboxOf(aside), bg: cs(aside).backgroundColor } : null,
        cards: pick('.el-card, .workspace-stat, .catalog-card, .portal-service, .portal__hero'),
        tables: pick('.el-table'),
        dialogs: pick('.el-dialog'),
        dropdowns: pick('.el-dropdown-menu'),
        primaryButtons: pick('.el-button--primary'),
      },
    }
  }, nodeId)
}

async function captureNode(browser, seq) {
  const cfg = NODES[seq]
  if (cfg.base === 'real') return { seq, ok: false, skipped: 'base=real (deferred to real-server capture)' }
  const outDir = path.join(evidenceRoot, cfg.family)
  await mkdir(outDir, { recursive: true })
  const viewport = cfg.viewport ?? { width: 1440, height: 1024 }
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  const pageErrors = []
  const consoleWarnings = []
  const page = await context.newPage()
  page.on('pageerror', (e) => pageErrors.push(String(e?.message ?? e)))
  page.on('console', (m) => {
    if (m.type() === 'warning') consoleWarnings.push(m.text().slice(0, 200))
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('sw.locale', 'zh-CN')
    const styleId = 'p53-visual-motion-reset'
    const install = () => {
      if (!document.documentElement || document.getElementById(styleId)) return
      const s = document.createElement('style')
      s.id = styleId
      s.textContent =
        '*, *::before, *::after { animation-duration: 0.01ms !important; animation-delay: 0ms !important; transition-duration: 0.01ms !important; transition-delay: 0ms !important; }'
      document.documentElement.appendChild(s)
    }
    install()
    new MutationObserver(() => install()).observe(document, { childList: true })
  })
  if (cfg.fixture) {
    await page.addInitScript(
      (id) => sessionStorage.setItem('sw.design-fixture-id', id),
      cfg.fixture,
    )
  }
  await page.clock.install()
  await page.clock.setFixedTime(new Date('2026-09-17T10:00:00'))

  const resolveRoute = async () => {
    if (cfg.route) return cfg.route
    if (cfg.designerDialog || cfg.processDesignerApprover) return '/form/designer/seed-def-001'
    if (cfg.taskTab) return '/workflow/task/mock-task-001'
    if (cfg.catalog !== undefined) return '/workflow/catalog'
    if (cfg.userMenu) return '/'
    throw new Error('no route for node ' + seq)
  }
  await page.goto(new URL(await resolveRoute(), baseUrl).href, { waitUntil: 'domcontentloaded' })
  if (cfg.ready) await ensureVisible(page, cfg.ready)
  await page.waitForTimeout(cfg.waitMs ?? 900)

  if (cfg.admin) {
    await enterAdmin(page)
  }
  if (cfg.designerDialog) {
    await page.locator('.designer').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.getByRole('button', { name: cfg.designerDialog }).first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(900)
  }
  if (cfg.taskTab) {
    await page.locator('.detail-header').waitFor({ state: 'visible', timeout: 20000 })
    const label = { records: '流转记录', graph: '流程图', people: '审批详情列表' }[cfg.taskTab]
    await page.locator('.el-tabs__item', { hasText: label }).click()
    await page.waitForTimeout(1100)
    if (cfg.taskTab === 'graph') {
      await page.locator('.pg-view .pg-node').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    }
  }
  if (cfg.openDetail) {
    const btn = page.getByRole('button', { name: '查看详情' })
    if ((await btn.count()) === 0) throw new Error('node ' + seq + ': no 查看详情 button (fixture data missing?)')
    await btn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
  }
  if (cfg.openSign) {
    const signBtn = page.locator('.people-group__head').first().getByRole('button')
    if ((await signBtn.count()) === 0) throw new Error('node ' + seq + ': no sign group button (fixture missing?)')
    await signBtn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
  }
  if (cfg.processDesignerApprover) {
    await page.goto(new URL('/workflow/defs/2100424929376403458/design', baseUrl).href, { waitUntil: 'domcontentloaded' })
    await page.locator('.designer-canvas-wrap,.designer-body').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(6000)
    const nodes = page.locator('.designer-node')
    const total = await nodes.count()
    let opened = false;
    for (let i = 0; i < total && !opened; i++) {
      await nodes.nth(i).click()
      await page.waitForTimeout(400)
      const btn = page.getByRole('button', { name: '查看候选' })
      if ((await btn.count()) > 0 && (await btn.first().isVisible())) {
        await btn.first().click()
        opened = true;
      }
    }
    if (!opened) throw new Error('node ' + seq + ': 查看候选 button not reachable')
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
  }
  if (cfg.catalog !== undefined) {
    await page.locator('.catalog-chip').first().waitFor({ state: 'visible', timeout: 15000 })
    const chips = page.locator('.catalog-chip')
    const count = await chips.count()
    if (count <= cfg.catalog) throw new Error('node ' + seq + ': fixture categories missing (' + count + ')')
    await chips.nth(cfg.catalog).click()
    await page.waitForTimeout(1000)
  }
  if (cfg.userMenu) {
    await page.locator('.workspace__greeting').waitFor({ state: 'visible', timeout: 20000 })
    if (cfg.userMenu === 'admin') {
      await enterAdmin(page)
    }
    await openUserDropdown(page)
    await page.waitForTimeout(500)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(350)
  const inventory = await domInventory(page, seq)
  const pngPath = path.join(outDir, seq + '-runtime.png')
  await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' })
  inventory.pageErrors = pageErrors
  inventory.consoleWarnings = consoleWarnings
  inventory.fixture = cfg.fixture ?? null
  await writeFile(path.join(outDir, seq + '-dom.json'), JSON.stringify(inventory, null, 2) + '\n')
  await context.close()
  return { seq, ok: true, url: inventory.url }
}

const targets =
  only === 'all'
    ? Object.keys(NODES)
    : only === 'family-a' || only === 'family-b' || only === 'family-c' || only === 'family-d'
      ? FAMILIES[only.replace('family-', '')].nodes
      : [only]
const browser = await chromium.launch({ headless: false })
const results = []
const failures = []
for (const seq of targets) {
  try {
    results.push(await captureNode(browser, seq))
    console.log('CAPTURED ' + seq)
  } catch (e) {
    failures.push({ seq, error: String(e?.stack ?? e).split('\n').slice(0, 4).join(' | ') })
    console.error('FAILED ' + seq + ': ' + failures.at(-1).error)
  }
}
await browser.close()
await writeFile(
  path.join(evidenceRoot, 'capture-log-' + only + '.json'),
  JSON.stringify({ targets, results, failures, finishedAt: new Date().toISOString() }, null, 2) + '\n',
)
if (failures.length) process.exitCode = 1
