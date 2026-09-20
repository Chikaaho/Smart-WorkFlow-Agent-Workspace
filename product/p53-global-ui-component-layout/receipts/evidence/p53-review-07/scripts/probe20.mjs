/** 临时探测：node20 people 表 CSS 生效状态。 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
await page.addInitScript(() => {
  sessionStorage.setItem('sw.design-fixture-id', 'node03')
  sessionStorage.setItem('sw.p53-review-node', '20')
  sessionStorage.setItem('sw.locale', 'zh-CN')
})
await page.goto('http://localhost:5173/workflow/task/mock-task-001', { waitUntil: 'domcontentloaded' })
await page.locator('.detail-header').waitFor({ state: 'visible', timeout: 20000 })
const tabsCount = await page.locator('.el-tabs__item').count()
const peopleTab = page.locator('.detail-card--tabs .el-tabs__item', { hasText: '审批详情列表' })
console.log('tabsCount', tabsCount, 'peopleTabCount', await peopleTab.count())
await peopleTab.click({ force: true })
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const root = document.querySelector('.task-detail')
  const tabsCard = document.querySelector('.detail-card--tabs')
  const table = document.querySelector('.detail-card--tabs .el-table')
  const headerCell = document.querySelector('.detail-card--tabs .el-table__header-wrapper th')
  const activePane = document.querySelector('.detail-card--tabs .el-tab-pane.is-active')
  const cs = headerCell ? getComputedStyle(headerCell) : null
  const tag = document.querySelector('.detail-header__title-row .el-tag')
  return {
    rootClass: root?.className,
    tabsCardParent: tabsCard?.parentElement?.className?.slice(0, 60),
    activePaneClass: activePane?.className,
    activePaneText: activePane?.textContent?.trim().slice(0, 30),
    tableWidth: table?.getBoundingClientRect().width,
    tableLeft: table?.getBoundingClientRect().x,
    headerCellHeight: cs?.height,
    headerRowHeight: document
      .querySelector('.detail-card--tabs .el-table__header-wrapper tr')
      ?.getBoundingClientRect().height,
    tagBox: tag ? tag.getBoundingClientRect().toJSON() : null,
    tagText: tag?.textContent?.trim(),
    titleBox: document.querySelector('.detail-header__title')?.getBoundingClientRect().toJSON(),
    tableRule: [...document.styleSheets].some((s) => {
      try {
        return [...s.cssRules].some((r) => r.cssText?.includes('task-detail--people-active'))
      } catch {
        return false
      }
    }),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
