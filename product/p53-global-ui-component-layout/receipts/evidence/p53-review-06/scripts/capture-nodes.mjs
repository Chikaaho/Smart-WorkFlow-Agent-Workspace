/**
 * P53 DESIGN_FIDELITY 运行态采集（review-06）：设计态 fixture 渲染 1440×1024（节点19 1512 高），
 * 输出 runtime PNG + DOM 清单（文字边界/字体/容器几何/computed style）。
 * 未显式声明 fixture 的非公开节点默认挂 'shell'（设计壳层：菜单/会话/未读）。
 * 用法：node capture-nodes.mjs <familyId|all|seq>   （需 dev:mock 已运行在 BASE_URL）
 */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NODES, FAMILIES } from './p53-nodes.mjs'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(
  workspaceRoot,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-06',
)
const baseUrl = process.env.P53_BASE_URL ?? 'http://localhost:5173'
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
        overlay: Boolean(el.closest('.p53-task-fixture__overlay, .p53-form-fixture__overlay, .p53-process-fixture__overlay')),
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
    // 只识别布局侧栏（BasicLayout）；业务面板（如设计器组件库 <aside>）不算侧栏区域。
    const aside = document.querySelector('.basic-layout__aside')
    // 品牌栅格资产（logo/字标图片）：作为 raster 区域记录元素边界，供比较器独立遮罩声明。
    const brandRasters = Array.from(
      document.querySelectorAll('.app-logo__mark-frame, .app-logo__wordmark'),
    ).map((el) => bboxOf(el))
    return {
      node: nodeIdArg,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      topbarHeight: header ? round(header.getBoundingClientRect().height) : null,
      sidebarWidth: aside ? round(aside.getBoundingClientRect().width) : null,
      pageBackground: cs(document.body).backgroundColor,
      texts,
      brandRasters,
      containers: {
        header: header ? { bbox: bboxOf(header), bg: cs(header).backgroundColor } : null,
        aside: aside ? { bbox: bboxOf(aside), bg: cs(aside).backgroundColor } : null,
        cards: pick('.el-card, .workspace-stat, .catalog-card, .portal-service, .portal__hero'),
        tables: pick('.el-table'),
        dialogs: pick('.el-dialog, .task-dialog, .sign-table, .sign-head, .sign-row, .sign-body, .sign-note'),
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
  const fixtureId = cfg.fixture ?? (cfg.public ? null : 'shell')
  const p53StaticFixture = ['node06', 'node07', 'node09', 'node10', 'node11', 'node12', 'node13', 'node14', 'node15', 'node16', 'node17', 'node18'].includes(fixtureId)
  if (fixtureId) {
    await page.addInitScript(
      ({ id, dialogNode, reviewNode }) => {
        sessionStorage.setItem('sw.design-fixture-id', id)
        if (dialogNode) sessionStorage.setItem('sw.p53-dialog-node', dialogNode)
        if (reviewNode) sessionStorage.setItem('sw.p53-review-node', reviewNode)
      },
      {
        id: ['15', '16', '17', '18'].includes(seq) ? 'node03' : fixtureId,
        dialogNode: ['15', '16', '17', '18'].includes(seq) ? fixtureId : null,
        reviewNode: seq,
      },
    )
  }
  // 流程设计器（画布）依赖真实时间推进的渲染回调，fake clock 会冻结图形布局，故跳过。
  if (!(cfg.flowDesigner || cfg.advancedConfig || cfg.processDesignerApprover)) {
    await page.clock.install()
    await page.clock.setFixedTime(new Date('2026-09-17T10:00:00'))
  }

  const resolveRoute = async () => {
    if (cfg.route) return cfg.route
    if (cfg.flowDesigner) return '/workflow/defs/2100424929376403458/design'
    if (cfg.advancedConfig) return '/workflow/defs/2100424929376403458/design'
    if (cfg.processDesignerApprover) return '/workflow/defs/2100424929376403458/design'
    if (cfg.designerDialog) return '/form/designer/seed-def-001'
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
    if (cfg.adminRoute) {
      await page.goto(new URL(cfg.adminRoute, baseUrl).href, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(cfg.waitMs ?? 900)
    }
  }
  if (cfg.flowDesigner) {
    await page.locator('.designer-canvas-wrap,.designer-body').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(cfg.designerWaitMs ?? 6000)
  }
  if (cfg.advancedConfig && !p53StaticFixture) {
    await page.locator('.designer-canvas-wrap,.designer-body').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(cfg.designerWaitMs ?? 6000)
    const btn = page.getByRole('button', { name: '高级配置' })
    if ((await btn.count()) === 0) throw new Error('node ' + seq + ': 高级配置 entry missing')
    await btn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(900)
  }
  if (cfg.designerDialog && !p53StaticFixture) {
    await page.locator('.designer').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.getByRole('button', { name: cfg.designerDialog }).first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(900)
  }
  if (cfg.taskTab && !p53StaticFixture) {
    await page.locator('.detail-header').waitFor({ state: 'visible', timeout: 20000 })
    const label = { records: '流转记录', graph: '流程图', people: '审批详情列表' }[cfg.taskTab]
    await page.locator('.el-tabs__item', { hasText: label }).click({ force: true })
    await page.locator('.el-tabs__item.is-active', { hasText: label }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1100)
    if (cfg.taskTab === 'graph') {
      await page.locator('.pg-view .pg-node').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      await page.locator('.pg-view').first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
    }
  }
  if (cfg.openDetail && !p53StaticFixture) {
    const btn = page.getByRole('button', { name: '查看详情' })
    if ((await btn.count()) === 0) throw new Error('node ' + seq + ': no 查看详情 button (fixture data missing?)')
    await btn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
  }
  if (cfg.openSign && !p53StaticFixture) {
    const signBtn = page.locator('.people-group__head').first().getByRole('button')
    if ((await signBtn.count()) === 0) throw new Error('node ' + seq + ': no sign group button (fixture missing?)')
    await signBtn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
  }
  if (cfg.processDesignerApprover && !p53StaticFixture) {
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
    if (!cfg.route && !['node30', 'node32'].includes(fixtureId)) {
      await page
        .locator('.wsd-hero__greeting, .workspace__greeting')
        .first()
        .waitFor({ state: 'visible', timeout: 20000 })
    }
    if (cfg.userMenu === 'admin' && !['node30', 'node32'].includes(fixtureId)) {
      await enterAdmin(page)
      if (cfg.adminRoute) {
        await page.goto(new URL(cfg.adminRoute, baseUrl).href, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(700)
      }
    }
    if (!['node30', 'node32'].includes(fixtureId)) await openUserDropdown(page)
    await page.waitForTimeout(500)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  if (cfg.taskTab === 'graph' && !p53StaticFixture) {
    await page.locator('.pg-view').first().evaluate((el) => el.scrollIntoView({ block: 'start' })).catch(() => {})
  }
  // 等待 loading 遮罩消失（数据/计数全部就绪），避免截到 spinner 残影。
  await page
    .waitForFunction(
      () => {
        const masks = Array.from(document.querySelectorAll('.el-loading-mask'))
        return masks.length === 0 || masks.every((m) => {
          const s = getComputedStyle(m)
          return s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0
        })
      },
      { timeout: 10000 },
    )
    .catch(() => {})
  await page.waitForTimeout(350)
  const inventory = await domInventory(page, seq)
  const pngPath = path.join(outDir, seq + '-runtime.png')
  await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' })
  inventory.pageErrors = pageErrors
  inventory.consoleWarnings = consoleWarnings
  inventory.fixture = fixtureId
  await writeFile(path.join(outDir, seq + '-dom.json'), JSON.stringify(inventory, null, 2) + '\n')
  await context.close()
  return { seq, ok: true, url: inventory.url }
}

const targets =
  only === 'all'
    ? Object.keys(NODES)
    : only.startsWith('family-')
      ? FAMILIES[only.replace('family-', '')].nodes
      : [String(only).padStart(2, '0')]
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
