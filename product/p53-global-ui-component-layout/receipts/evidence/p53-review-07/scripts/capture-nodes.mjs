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
  'p53-review-07',
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
    const cs = (el, pseudo) => getComputedStyle(el, pseudo)
    // 文字元素：存在直接非空 text node 的元素
    const texts = []
    const placeholders = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent
      if (!t || !t.trim()) continue
      let el = n.parentElement
      if (!el || seen.has(el)) continue
      // SVG 多行标签：tspan 文本节点向上归并到 <text>，行框集合覆盖全部行
      if (el.namespaceURI && el.namespaceURI.includes('svg') && el.closest && el.closest('text')) {
        el = el.closest('text')
        if (seen.has(el)) continue
      }
      seen.add(el)
      const style = cs(el)
      const range = document.createRange()
      range.selectNodeContents(n)
      // 行框级遮挡检测：命中链自上而下找第一个真正绘制背景的元素——
      // 透明包装器/透明容器不遮挡；半透明层（弹窗遮罩 0.32）之下的文字仍可见（设计同以轻罩呈现）；
      // 不透明元素且不含目标文字（弹窗面板/覆盖卡片）才算遮挡。
      const occluded = (hit) => {
        for (let cur = hit; cur; cur = cur.parentElement) {
          if (cur === el || cur.contains(el) || el.contains(cur)) return false
          const bg = cs(cur).backgroundColor
          if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') continue
          const m = /rgba?\(([^)]+)\)/.exec(bg)
          const parts = m ? m[1].split(/[\s,]+/).filter(Boolean) : []
          const alpha = parts.length >= 4 ? Number(parts[3]) : 1
          return alpha >= 0.999
        }
        return false
      }
      const rects = []
      let occludedRects = 0
      // SVG <text> 的 Range.getClientRects 在 Chrome 会合并成单一矩形；
      // 多行（tspan）标签按子节点逐个取行框，保证双行标签的行盒几何可回读。
      const svgText = el instanceof SVGTextElement
      const rectSources = svgText && el.childElementCount > 0 ? Array.from(el.children) : [el]
      for (const src of rectSources) {
        const r2 = document.createRange()
        r2.selectNodeContents(src)
        for (const r of Array.from(r2.getClientRects())) {
          if (!(r.width > 0 && r.height > 0)) continue
          const hit = document.elementFromPoint(r.x + r.width / 2, Math.min(Math.max(r.y + r.height / 2, 0), innerHeight - 1))
          if (hit && occluded(hit)) { occludedRects++; continue }
          rects.push({ x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) })
        }
      }
      if (!rects.length) continue
      texts.push({
        tag: el.tagName.toLowerCase(),
        cls: typeof el.className === 'string' ? el.className.slice(0, 60) : String(el.className?.baseVal ?? '').slice(0, 60),
        overlay: Boolean(el.closest('.el-overlay, .el-dialog, .el-drawer, .el-dropdown-menu, .el-popper')),
        text: t.trim().slice(0, 80),
        bbox: bboxOf(el),
        lineRects: rects,
        occludedLineRects: occludedRects,
        font: {
          family: style.fontFamily,
          size: style.fontSize,
          weight: style.fontWeight,
          lineHeight: style.lineHeight,
          textAlign: style.textAlign,
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
    // 输入框 placeholder：非 DOM text node（TreeWalker 不可见），但其字形与真实文本同样参与
    // 设计比较——按占位符属性登记为文字遮罩（同一 DOM 属性来源，非结构遮罩）。
    // 矩形取实测文本宽度（canvas measureText），避免整框计入遮罩预算。
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')
    for (const el of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
      const ph = el.getAttribute('placeholder')
      if (!ph || !ph.trim()) continue
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) continue
      const style = cs(el)
      const fontSize = parseFloat(style.fontSize) || 14
      const lineH = parseFloat(style.lineHeight) || fontSize
      measureCtx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`
      const textW = Math.min(measureCtx.measureText(ph.trim()).width + 2, r.width - 4)
      const centerY = r.y + r.height / 2
      placeholders.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 60),
        overlay: Boolean(el.closest('.el-overlay, .el-dialog, .el-drawer, .el-dropdown-menu, .el-popper')),
        placeholder: true,
        text: ph.trim().slice(0, 80),
        bbox: { x: round(r.x), y: round(centerY - lineH / 2), w: round(r.width), h: round(lineH) },
        lineRects: [
          {
            x: round(r.x + 12),
            y: round(centerY - lineH / 2 - 1),
            w: round(textW),
            h: round(lineH + 2),
          },
        ],
        font: { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight, textAlign: style.textAlign },
        color: style.color,
      })
    }
    // 只识别布局侧栏（BasicLayout）；业务面板（如设计器组件库 <aside>）不算侧栏区域。
    const aside = document.querySelector('.basic-layout__aside')
    // 品牌栅格资产（logo/字标图片）：作为 raster 区域记录元素边界，供比较器独立遮罩声明。
    const brandRasters = Array.from(
      document.querySelectorAll('.app-logo__mark-frame, .app-logo__wordmark'),
    ).map((el) => bboxOf(el))
    // P53 EV-06c：生产组件 computed 色值普查（去重；每值记录首个选择器、属性与最大盒面积）
    const normalizeColor = (value) => {
      const raw = value.trim()
      const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/.exec(raw)
      if (srgb) {
        const channels = srgb.slice(1, 4).map((v) => Math.round(Number(v) * 255))
        const alpha = srgb[4] == null ? 1 : Number(srgb[4])
        return alpha < 1
          ? `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`
          : `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
      }
      const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(raw)
      if (!hex) return value
      let h = hex[1]
      if (h.length === 3) h = h.split('').map((c) => c + c).join('')
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      return 'rgb(' + r + ', ' + g + ', ' + b + ')'
    }
    const census = new Map()
    const px = (value) => {
      const m = /^(-?\d+(?:\.\d+)?)px$/.exec(String(value ?? '').trim())
      return m ? Number(m[1]) : null
    }
    const pseudoBoxOf = (el, style) => {
      const r = el.getBoundingClientRect()
      const width = px(style.width) ?? r.width
      const height = px(style.height) ?? r.height
      let x = r.x
      let y = r.y
      const left = px(style.left), right = px(style.right), top = px(style.top), bottom = px(style.bottom)
      if (left != null) x = r.x + left
      else if (right != null) x = r.right - right - width
      if (top != null) y = r.y + top
      else if (bottom != null) y = r.bottom - bottom - height
      const transform = String(style.transform ?? '')
      const translate = /translate(?:3d)?\(\s*(-?[\d.]+)px(?:\s*,\s*|\s+)(-?[\d.]+)px/.exec(transform)
      const translateX = /translateX\(\s*(-?[\d.]+)px/.exec(transform)
      const translateY = /translateY\(\s*(-?[\d.]+)px/.exec(transform)
      if (translate) { x += Number(translate[1]); y += Number(translate[2]) }
      if (translateX) x += Number(translateX[1])
      if (translateY) y += Number(translateY[1])
      return { x: round(x), y: round(y), w: round(width), h: round(height) }
    }
    const opaqueBgOf = (el) => {
      for (let cur = el; cur; cur = cur.parentElement) {
        const bg = cs(cur).backgroundColor
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') continue
        const m = /rgba?\(([^)]+)\)/.exec(bg)
        if (m) {
          const parts = m[1].split(/[\s,]+/).filter(Boolean)
          if (parts.length >= 4 && Number(parts[3]) < 1) continue
        }
        return bg
      }
      return cs(document.body).backgroundColor
    }
    const recordColor = (value, property, el, bboxArea, bboxOverride = null) => {
      if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') return
      const entry = census.get(value) ?? { property, count: 0, maxArea: 0, selector: null, bbox: null, matches: [] }
      entry.count += 1
      if (entry.matches.length < 240) {
        const cls = String(el.className?.baseVal ?? el.className ?? '').trim().split(/\s+/).slice(0, 2).join('.')
        entry.matches.push({
          property,
          bbox: bboxOverride ?? bboxOf(el),
          selector: (el.tagName.toLowerCase() + (cls ? '.' + cls : '')).slice(0, 80),
          area: bboxArea,
          opaqueAncestorBg: opaqueBgOf(el),
          bgImage: (() => { const v = cs(el).backgroundImage; return v && v !== 'none' ? v.replace(/%23/g, '#').slice(0, 400) : null })(),
          boxShadow: (() => { const v = cs(el).boxShadow; return v && v !== 'none' ? v.slice(0, 400) : null })(),
        })
      }
      if (bboxArea > entry.maxArea) {
        entry.maxArea = bboxArea
        const cls = String(el.className?.baseVal ?? el.className ?? '').trim().split(/\s+/).slice(0, 2).join('.')
        entry.selector = (el.tagName.toLowerCase() + (cls ? '.' + cls : '')).slice(0, 80)
        entry.bbox = bboxOverride ?? bboxOf(el)
        entry.opaqueAncestorBg = opaqueBgOf(el)
        entry.bgImage = (() => { const v = cs(el).backgroundImage; return v && v !== 'none' ? v.replace(/%23/g, '#').slice(0, 400) : null })()
        entry.boxShadow = (() => { const v = cs(el).boxShadow; return v && v !== 'none' ? v.slice(0, 400) : null })()
      }
      census.set(value, entry)
    }
    for (const el of document.querySelectorAll('body *')) {
      const style = cs(el)
      const box = el.getBoundingClientRect()
      const area = Math.round(box.width * box.height)
      const inDocument = box.width > 0 && box.height > 0
      const inSvg = Boolean(el.closest('svg'))
      if (inDocument && !inSvg) {
        recordColor(style.backgroundColor, 'background-color', el, area)
        recordColor(style.color, 'color', el, area)
        recordColor(style.borderTopColor, 'border-color', el, area)
        const borderPaints = [
          ['border-bottom', style.borderBottomColor, style.borderBottomWidth, { x: box.x, y: box.bottom - (parseFloat(style.borderBottomWidth) || 0), w: box.width, h: parseFloat(style.borderBottomWidth) || 0 }],
          ['border-right', style.borderRightColor, style.borderRightWidth, { x: box.right - (parseFloat(style.borderRightWidth) || 0), y: box.y, w: parseFloat(style.borderRightWidth) || 0, h: box.height }],
          ['border-left', style.borderLeftColor, style.borderLeftWidth, { x: box.x, y: box.y, w: parseFloat(style.borderLeftWidth) || 0, h: box.height }],
        ]
        for (const [, paint, width, edgeBox] of borderPaints) {
          const edgeWidth = parseFloat(width) || 0
          if (edgeWidth > 0) recordColor(paint, 'border-color', el, Math.round(edgeBox.w * edgeBox.h), edgeBox)
        }
        if (style.boxShadow && style.boxShadow !== 'none') recordColor(style.boxShadow.split(') ')[0] + ')', 'box-shadow', el, area)
        // 渐变与伪元素色（画布网格/遮罩等背景图像中的 RGB 全量入普查）；
        // data-URI SVG 图标色以 %23 编码，解码后纳入普查
        const bgImage = style.backgroundImage
        if (bgImage && bgImage !== 'none') {
          const decoded = bgImage.replace(/%23/g, '#')
          for (const m of decoded.matchAll(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b/g)) {
            recordColor(normalizeColor(m[0]), 'background-image', el, area)
          }
        }
        for (const pseudo of ['::before', '::after']) {
          const ps = cs(el, pseudo)
          const pseudoHasPaint = ps.backgroundColor !== 'rgba(0, 0, 0, 0)' || (ps.backgroundImage && ps.backgroundImage !== 'none')
          if (ps.content === 'none' || (!pseudoHasPaint && ps.content === '""')) continue
          const pseudoBox = pseudoBoxOf(el, ps)
          const parea = Math.round(pseudoBox.w * pseudoBox.h)
          if (parea <= 0) continue
          recordColor(ps.backgroundColor, 'background-color:' + pseudo, el, parea, pseudoBox)
          const pbg = ps.backgroundImage
          if (pbg && pbg !== 'none') {
            const pdecoded = pbg.replace(/%23/g, '#')
            for (const m of pdecoded.matchAll(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b/g)) {
              recordColor(normalizeColor(m[0]), 'background-image:' + pseudo, el, parea, pseudoBox)
            }
          }
        }
        if (el instanceof HTMLInputElement && el.placeholder) {
          const placeholder = cs(el, '::placeholder')
          if (placeholder.color && placeholder.color !== 'rgba(0, 0, 0, 0)') {
            recordColor(placeholder.color, 'color:::placeholder', el, area)
          }
        }
      }
      // SVG 图元：stroke/fill 展示属性与样式（连线/箭头/节点描边为设计令牌落地）
      if (inDocument && inSvg && area > 0) {
        const resolveSvgPaint = (attribute, computed) => {
          if (!attribute || attribute === 'none') return attribute
          // currentColor is a reference, not a production token. Resolve it through
          // the browser's computed SVG style before adding it to the census.
          return /^currentColor$/i.test(attribute.trim()) ? computed : attribute
        }
        const svgPaintElement = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'use'].includes(el.tagName.toLowerCase())
        const stroke = resolveSvgPaint(el.getAttribute('stroke') ?? (svgPaintElement ? style.stroke : null), style.stroke)
        const fill = resolveSvgPaint(el.getAttribute('fill') ?? (svgPaintElement ? style.fill : null), style.fill)
        if (stroke && stroke !== 'none') recordColor(normalizeColor(stroke), 'svg-stroke', el, area)
        if (fill && fill !== 'none') recordColor(normalizeColor(fill), 'svg-fill', el, area)
      }
    }
    // P53 EV-07a：生产组件身份（Vue 实例 type 名 + 源文件），机器采集，不依赖根 class 推断。
    const componentTypes = new Map()
    for (const el of document.querySelectorAll('body *')) {
      let inst = el.__vueParentComponent
      let hop = 0
      while (inst && hop < 4) {
        const type = inst.type
        if (type && !componentTypes.has(type)) {
          const name = type.__name ?? type.name ?? null
          const file = type.__file ? String(type.__file).replaceAll('\\\\', '/').replace(/^.*src\//, 'src/') : null
          if (name || file) componentTypes.set(type, { name, file })
        }
        inst = inst.parent
        hop++
      }
    }
    const productionComponentIds = [...componentTypes.values()]
      .filter((c) => c.name || c.file)
      .map((c) => c.file ? `${c.name ?? 'anonymous'}@${c.file}` : (c.name ?? 'anonymous'))
      .sort()
    return {
      node: nodeIdArg,
      url: location.href,
      effectiveRoute: location.pathname + location.search,
      viewport: { width: innerWidth, height: innerHeight },
      topbarHeight: header ? round(header.getBoundingClientRect().height) : null,
      sidebarWidth: aside ? round(aside.getBoundingClientRect().width) : null,
      pageBackground: cs(document.body).backgroundColor,
      productionComponentIds,
      colorCensus: Object.fromEntries([...census.entries()]),
      texts: [...texts, ...placeholders],
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
    // 设计 01 问候语为「下午好」、动态相对时间为「昨天」（=09-15）：固定 2026-09-16 14:00 对齐
    // 设计时段与相对时间基准（数据/时间注入，非视觉替换）
    await page.clock.setFixedTime(new Date('2026-09-16T14:00:00'))
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
  if (cfg.clickField) {
    if (cfg.clickNodeText) {
      const node = page.locator('.designer-node', { hasText: cfg.clickNodeText }).first()
      await node.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      if ((await node.count()) > 0) { await node.click(); await page.waitForTimeout(900) }
    } else {
      const shell = page.locator('.field-shell').first()
      await shell.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      if ((await shell.count()) > 0) { await shell.click(); await page.waitForTimeout(900) }
    }
    // 选中后移开鼠标：设计稿选中态不含 hover 拖拽条
    await page.mouse.move(0, 0)
    await page.waitForTimeout(300)
  }
  if (cfg.flowDesigner) {
    await page.locator('.designer-canvas-wrap,.designer-body').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(cfg.designerWaitMs ?? 6000)
    // 设计09：选中指定节点（右栏节点属性回显+画布选中态）
    if (cfg.clickNodeText) {
      const node = page.locator('.designer-node', { hasText: cfg.clickNodeText }).first()
      await node.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      if ((await node.count()) > 0) {
        await node.click()
        await page.waitForTimeout(900)
      }
    }
  }
  if (cfg.advancedConfig) {
    await page.locator('.designer-canvas-wrap,.designer-body').first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(cfg.designerWaitMs ?? 6000)
    const btn = page.getByRole('button', { name: '高级配置' })
    if ((await btn.count()) === 0) throw new Error('node ' + seq + ': 高级配置 entry missing')
    await btn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(900)
  }
  if (cfg.designerDialog) {
    await page.locator('.designer').first().waitFor({ state: 'visible', timeout: 20000 })
    if (cfg.designerDialog === '字段清单') {
      await page.getByRole('button', { name: '设置' }).first().click()
      await page.getByRole('menuitem', { name: cfg.designerDialog }).click()
    } else {
      await page.getByRole('button', { name: cfg.designerDialog }).first().click()
    }
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(900)
  }
  if (cfg.taskTab) {
    await page.locator('.detail-header').waitFor({ state: 'visible', timeout: 20000 })
    const label = { records: '流转记录', graph: '流程图', people: '审批详情列表' }[cfg.taskTab]
    // 非 force 点击：loading 遮罩吞掉 force 点击会导致页签未切换（node20 曾因此丢失专用几何）。
    const tab = page.locator('.detail-card--tabs .el-tabs__item', { hasText: label })
    await tab.waitFor({ state: 'visible', timeout: 10000 })
    await tab.click()
    await page.locator('.el-tabs__item.is-active', { hasText: label }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1100)
    if (cfg.taskTab === 'people') {
      await page
        .locator('.task-detail--people-active .detail-card--tabs .el-table__row')
        .first()
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {})
    }
    if (cfg.taskTab === 'graph') {
      await page.locator('.pg-view .pg-node').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    }
  }
  if (cfg.openDetail) {
    let btn
    if (cfg.openDetailRow) {
      // 指定审批人：在审批详情列表中打开该行的意见详情（对齐设计 15/17/18 的对象身份）
      const row = page
        .locator('.detail-card--tabs .el-table__row', { hasText: cfg.openDetailRow })
        .first()
      await row.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
      btn = row.getByRole('button', { name: '查看详情' })
    } else {
      btn = page.getByRole('button', { name: '查看详情' })
    }
    if ((await btn.count()) === 0) throw new Error('node ' + seq + ': no 查看详情 button (fixture data missing?)')
    await btn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
  }
  if (cfg.openSign) {
    const signBtn = page.locator('.flow-node__allbtn').first()
    if ((await signBtn.count()) === 0) throw new Error('node ' + seq + ': no sign group button')
    await signBtn.first().click()
    await page.locator('.el-dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
  }
  if (cfg.processDesignerApprover) {
    const nodes = page.locator('.designer-node')
    const total = await nodes.count()
    let opened = false;
    if (cfg.clickNodeText) {
      // Keep the reference node selected: iterating from node 0 would replace
      // the intended office-asset-manager context with the first approver.
      const node = page.locator('.designer-node', { hasText: cfg.clickNodeText }).first()
      await node.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
      if ((await node.count()) > 0) {
        await node.click()
        await page.waitForTimeout(400)
        const btn = page.getByRole('button', { name: /查看候选|选择审批人/ }).first()
        if ((await btn.count()) > 0 && (await btn.first().isVisible())) {
          await btn.first().click()
          opened = true
        }
      }
    } else {
      for (let i = 0; i < total && !opened; i++) {
        await nodes.nth(i).click()
        await page.waitForTimeout(400)
        const btn = page.getByRole('button', { name: /查看候选|选择审批人/ }).first()
        if ((await btn.count()) > 0 && (await btn.first().isVisible())) {
          await btn.first().click()
          opened = true
        }
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

  await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('.basic-layout__content')?.scrollTo(0, 0); })
  if (cfg.taskTab === 'graph') {
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
  inventory.fixtureIdForData = fixtureId
  inventory.fixture = null
  inventory.alternateRenderPath = await page.evaluate(() => ({
    fixtureComponentMarkers: ['.p53-task-fixture__overlay', '.p53-form-fixture__overlay', '.p53-process-fixture__overlay', '.p53-shell-fixture', '.p53-login-fixture', '.p53-form-fixture', '.p53-process-fixture'].filter((sel) => document.querySelector(sel) != null),
    storageDrivenVisualFlag: sessionStorage.getItem('sw.design-fixture-id') != null ? 'data-layer-only' : null,
  }))
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
