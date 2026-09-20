/**
 * P53 EV-07a 渲染对象一致性校验（提示07 schema）：
 * 1) 静态：生产源码不得 import 任何 design-fixture 组件；sw.design-fixture-id /
 *    activeDesignFixtureFlag 只允许出现在 mock 数据层（foundation/mock/**）与标志模块本身。
 * 2) 运行时：31 节点逐条声明 effectiveRoute、productionComponentIds、dataInjection，
 *    且 usesAlternateRenderPath=false（fixtureComponentMarkers 必须为空）；
 *    机器计数 alternate_render_path_count 必须为 0。
 * 字段语义：usesAlternateRenderPath=true 表示“存在替代渲染路径”（与 06 轮反转语义不同）。
 * 输出：render-object-manifest.json、render-object-validate.stdout.log、render-object-validate.exit（单值 0/1）。
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NODES, FAMILIES } from './p53-nodes.mjs'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07')

const violations = []
const manifestNodes = []

// ── 静态扫描 ──
async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      await walk(p, files)
    } else if (/\.(vue|ts|js)$/.test(entry.name)) files.push(p)
  }
  return files
}
const sources = await walk(path.join(webRoot, 'src'))
const FIXTURE_IMPORT = /from '[^']*design-fixture\//
for (const file of sources) {
  const rel = path.relative(webRoot, file).replaceAll('\\', '/')
  const text = await readFile(file, 'utf8')
  const inMockLayer = rel.startsWith('src/foundation/mock/')
  const isFlagModule = rel === 'src/foundation/design-fixture-flag.ts'
  if (FIXTURE_IMPORT.test(text)) {
    if (!inMockLayer) violations.push({ kind: 'fixture-component-import', file: rel })
    else violations.push({ kind: 'fixture-component-import-in-mock', file: rel })
  }
  if (!inMockLayer && !isFlagModule) {
    if (text.includes('activeDesignFixtureFlag'))
      violations.push({ kind: 'fixture-flag-read-outside-mock', file: rel })
    if (text.includes('sw.design-fixture-id'))
      violations.push({ kind: 'fixture-storage-read-outside-mock', file: rel })
  }
}

// ── 运行时清单核对（EV-07a schema）──
for (const [seq, cfg] of Object.entries(NODES)) {
  const familyDir = path.join(evidenceRoot, cfg.family)
  let dom = null
  try {
    dom = JSON.parse(await readFile(path.join(familyDir, seq + '-dom.json'), 'utf8'))
  } catch {
    violations.push({ kind: 'dom-inventory-missing', node: seq })
    continue
  }
  const markers = dom.alternateRenderPath?.fixtureComponentMarkers ?? null
  if (markers === null) {
    violations.push({ kind: 'marker-field-missing', node: seq })
    continue
  }
  const effectiveRoute = dom.effectiveRoute ?? null
  const componentIds = Array.isArray(dom.productionComponentIds) ? dom.productionComponentIds : []
  const dataInjection = dom.fixtureIdForData ?? null
  const usesAlternateRenderPath = markers.length > 0
  if (!effectiveRoute || !effectiveRoute.startsWith('/')) {
    violations.push({ kind: 'effective-route-missing', node: seq, effectiveRoute })
  }
  if (componentIds.length === 0) {
    violations.push({ kind: 'production-component-identity-missing', node: seq })
  }
  if (!dataInjection) {
    violations.push({ kind: 'data-injection-unrecorded', node: seq })
  }
  if (usesAlternateRenderPath) {
    violations.push({ kind: 'alternate-render-path', node: seq, markers })
  }
  manifestNodes.push({
    node: seq,
    effectiveRoute,
    capturedUrl: dom.url,
    viewport: dom.viewport,
    productionComponentIds: componentIds,
    productionComponentCount: componentIds.length,
    dataInjection,
    dataInjectionLayer: 'data/state only (sessionStorage fixture id; no visual component swap)',
    usesAlternateRenderPath,
    alternateRenderPathMarkers: markers,
  })
}

const alternate_render_path_count = manifestNodes.filter((n) => n.usesAlternateRenderPath).length
const manifest = {
  feature: 'p53-global-ui-component-layout',
  reviewRound: 'p53-review-07',
  contract: 'production render objects only; fixtures may inject data/time/identity/state; usesAlternateRenderPath=true means an alternate visual render path exists',
  nodes: manifestNodes,
  families: Object.fromEntries(Object.entries(FAMILIES).map(([k, v]) => [v.id, v.nodes])),
  alternate_render_path_count,
  staticViolations: violations.filter((v) => v.kind.startsWith('fixture-')),
}
await writeFile(path.join(evidenceRoot, 'render-object-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

const runtimeViolations = violations.filter((v) => !v.kind.startsWith('fixture-'))
const summary = {
  nodes: manifestNodes.length,
  alternate_render_path_count,
  staticViolationCount: manifest.staticViolations.length,
  runtimeViolationCount: runtimeViolations.length,
  violations,
}
await writeFile(
  path.join(evidenceRoot, 'render-object-validate.stdout.log'),
  'RENDER_OBJECT_NODES ' + manifestNodes.length
    + ' ALTERNATE_RENDER_PATH_COUNT ' + alternate_render_path_count
    + ' STATIC_VIOLATIONS ' + manifest.staticViolations.length
    + ' RUNTIME_VIOLATIONS ' + runtimeViolations.length
    + (violations.length ? '\n' + JSON.stringify(violations, null, 2) : '') + '\n',
)
await writeFile(
  path.join(evidenceRoot, 'render-object-validate.exit'),
  (manifestNodes.length === 31 && alternate_render_path_count === 0 && violations.length === 0 ? '0' : '1') + '\n',
)
console.log('RENDER_OBJECT_VALIDATE', JSON.stringify(summary))
if (violations.length || manifestNodes.length !== 31 || alternate_render_path_count !== 0) process.exitCode = 1
