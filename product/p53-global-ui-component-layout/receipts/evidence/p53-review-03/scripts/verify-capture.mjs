import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const evidenceDir = path.join(
  root,
  'product',
  'p53-global-ui-component-layout',
  'receipts',
  'evidence',
  'p53-review-03',
)
const manifest = JSON.parse(await readFile(path.join(evidenceDir, 'capture-manifest.json'), 'utf8'))
const pixelProbe = path.join(evidenceDir, 'scripts', 'pixel-probe.cjs')
const networkIndex = JSON.parse(await readFile(path.join(evidenceDir, 'capture-network-index.json'), 'utf8'))
const checks = []
const factPayloads = new Map()

for (const entry of manifest.entries) {
  const pngPath = path.join(evidenceDir, entry.relativePath)
  const bytes = await readFile(pngPath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const pixelData = JSON.parse(execFileSync(process.execPath, [pixelProbe, pngPath], { encoding: 'utf8' }))
  const factPath = path.join(evidenceDir, entry.factsPath)
  const facts = JSON.parse(await readFile(factPath, 'utf8'))
  factPayloads.set(entry.id, facts)
  const capturedUrl = facts.capture?.url ?? facts.page?.url ?? null
  const allOpaque = pixelData.points.every((point) => point.a === 255)
  const expectedMenuItems = entry.id === 'ev2a-admin-menu-expanded'
    ? ['账号绑定', '返回前台', '退出登录']
    : entry.id === 'ev2a-portal-menu-expanded'
      ? ['账号绑定', '进入后台', '退出登录']
      : null
  const actualMenuItems = facts.page?.menuItems ?? null
  checks.push({
    id: entry.id,
    atom: entry.atom,
    relativePath: entry.relativePath,
    sha256,
    manifestSha256: entry.sha256,
    hashMatches: sha256 === entry.sha256 && sha256 === facts.screenshot?.sha256,
    dimensions: { width: pixelData.width, height: pixelData.height },
    dimensionsMatch:
      pixelData.width === entry.width &&
      pixelData.height === entry.height &&
      pixelData.width === facts.screenshot?.width &&
      pixelData.height === facts.screenshot?.height,
    factIdentityMatches: JSON.stringify(facts.identity) === JSON.stringify(entry.identity),
    factObjectIdsMatch: JSON.stringify(facts.objectIds) === JSON.stringify(entry.objectIds),
    factSourceFingerprintMatches: facts.sourceFingerprint === entry.sourceFingerprint,
    factUrlMatches: capturedUrl === entry.url,
    factVisibleHeadedBrowser: facts.capture?.headless === false && facts.capture?.source?.includes('visible headed Chromium browser'),
    menuItemsMatch: expectedMenuItems === null || JSON.stringify(actualMenuItems) === JSON.stringify(expectedMenuItems),
    forbiddenMenuItemAbsent: expectedMenuItems === null || facts.details?.forbiddenItemAbsent === true,
    alphaPointCount: pixelData.points.length,
    alphaPoints: pixelData.points,
    allAlpha255: allOpaque,
  })
}

const mobilePages = manifest.checks.mobilePages.map((page) => ({
  route: page.route,
  screenshot: page.screenshot,
  horizontalScroll: page.horizontalScroll,
  clientWidth: page.document.clientWidth,
  scrollWidth: page.document.scrollWidth,
  primaryTargetCount: page.primaryTargets.length,
  minPrimaryTargetHeight: Math.min(...page.primaryTargets.map((target) => target.height)),
  primaryTargetsAtLeast40px: page.primaryTargets.every((target) => target.height >= 40),
}))
const contrast = JSON.parse(await readFile(path.join(evidenceDir, 'contrast-verify.json'), 'utf8'))
const contrastMinimum = Math.min(...contrast.samples.map((sample) => sample.ratio))
const failures = []
const adminMenu = factPayloads.get('ev2a-admin-menu-expanded')
const portalMenu = factPayloads.get('ev2a-portal-menu-expanded')
const candidate = factPayloads.get('ev2b-picker-candidates')
const backfill = factPayloads.get('ev2b-picker-selected-backfilled')
const saveValidate = factPayloads.get('ev2b-save-validate')
const opinionOpen = factPayloads.get('ev2c-opinion-dialog-open')
const processGraph = factPayloads.get('ev2c-taskdetail-processgraph')
const opinionEscape = JSON.parse(await readFile(path.join(evidenceDir, 'facts', 'ev2c-opinion-dialog-escape.json'), 'utf8'))
const desktopFacts = manifest.entries.filter((entry) => entry.id.startsWith('ev3-shell-')).map((entry) => factPayloads.get(entry.id))
const desktopGeometryMatches = desktopFacts.length === 4 && desktopFacts.every((facts) => {
  const page = facts?.page
  return page?.header?.x === 0 && page.header.y === 0 && page.header.w === 1440 && page.header.h === 64 &&
    page.brand?.y === 0 && page.brand.h === 64 && page.nav?.x === 240 && page.nav.y === 0 && page.nav.w === 864 && page.nav.h === 64 &&
    page.actions?.x === 1104 && page.actions.y === 0 && page.actions.w === 336 && page.actions.h === 64 && page.horizontalScroll === false
})
const expectedOpinionFields = ['节点一-管理员审批', '系统管理员', '表单版本', 'P53ev2 节点一审批意见：同意，转入节点二']
const mobileLogin = factPayloads.get('ev4-mobile-login-375')?.page
const loginButton = mobileLogin?.controls?.find((control) => control.text === '登录')
const semanticChecks = {
  manifestVisibleBrowser: manifest.browser?.visible === true && manifest.browser?.headless === false,
  browserPageErrorsEmpty: manifest.checks?.pageErrors?.length === 0,
  pngHashGeneratedForEveryEntry: manifest.checks?.sha256GeneratedForEachPng === true,
  adminMenuCorrect: JSON.stringify(adminMenu?.page?.menuItems) === JSON.stringify(['账号绑定', '返回前台', '退出登录']) && adminMenu?.details?.forbiddenItemAbsent === true,
  portalMenuCorrect: JSON.stringify(portalMenu?.page?.menuItems) === JSON.stringify(['账号绑定', '进入后台', '退出登录']) && portalMenu?.details?.forbiddenItemAbsent === true,
  approverCandidateVisible: candidate?.details?.modalOpen === true && candidate.details.candidateVisible?.includes('系统管理员') && candidate.details.candidateVisible?.includes('1'),
  approverSelectionBackfilled: backfill?.details?.candidateId === '1' && backfill.details.candidateName === '系统管理员' && backfill.details.uiFieldValue?.includes('1') && backfill.details.pickerClosed === true,
  graphSavedAndValidated: saveValidate?.details?.savedDraft === true && saveValidate.details.validationZeroErrors === true && saveValidate.details.noPublishAction === true,
  opinionDialogFieldsVisible: expectedOpinionFields.every((field) => opinionOpen?.details?.fieldsVisible?.includes(field)),
  opinionEscapeReturnsFocus: opinionEscape.dialogClosedByEscape === true && opinionEscape.focusReturnedToTrigger === true,
  taskProcessGraphVisibleWithNodes: processGraph?.details?.graphVisible === true && processGraph.details.nodeCount > 0 && processGraph.page?.url === 'http://localhost:5173/workflow/task/af63f9ac-b248-11f1-9b6a-00ffa7734675' && processGraph.details.graphBox?.y >= 0 && processGraph.details.graphBox?.y + processGraph.details.graphBox?.height <= 1024,
  desktopShellGeometryMatches: desktopGeometryMatches,
  desktopAdminAndPortalColorsMatch: desktopFacts.some((facts) => facts?.page?.headerBg === 'rgb(17, 27, 59)') && desktopFacts.some((facts) => facts?.page?.headerBg === 'rgb(64, 54, 154)'),
  mobileLoginNoHorizontalScroll: mobileLogin?.horizontalScroll === false,
  mobileLoginPrimaryTargetAtLeast40px: (loginButton?.height ?? 0) >= 40,
}
const networkChecks = {
  identityMatchesManifest: JSON.stringify(networkIndex.identity) === JSON.stringify(manifest.identity),
  sourceFingerprintMatchesManifest: networkIndex.sourceFingerprint === manifest.sourceFingerprint,
  candidateGet200: networkIndex.requests.some((request) => request.method === 'GET' && request.path.startsWith('/api/workflow/defs/approver-candidates') && request.status === 200),
  graphPut200Count: networkIndex.requests.filter((request) => request.method === 'PUT' && request.path === '/api/workflow/defs/2100424929376403458/graph' && request.status === 200).length,
  validatePost200: networkIndex.requests.some((request) => request.method === 'POST' && request.path === '/api/workflow/defs/2100424929376403458/validate' && request.status === 200),
  taskDetailGet200Count: networkIndex.requests.filter((request) => request.method === 'GET' && request.path === '/api/workflow/tasks/af63f9ac-b248-11f1-9b6a-00ffa7734675' && request.status === 200).length,
}

if (manifest.formalPngCount !== manifest.entries.length || manifest.entries.length < 15) failures.push('manifest formal PNG count is below 15 or differs from entry count')
for (const check of checks) {
  for (const field of ['hashMatches', 'dimensionsMatch', 'factIdentityMatches', 'factObjectIdsMatch', 'factSourceFingerprintMatches', 'factUrlMatches', 'factVisibleHeadedBrowser', 'menuItemsMatch', 'forbiddenMenuItemAbsent', 'allAlpha255']) {
    if (!check[field]) failures.push(`${check.id}: ${field} failed`)
  }
}
for (const [name, value] of Object.entries(networkChecks)) {
  const pass = typeof value === 'number' ? value >= (name === 'graphPut200Count' ? 1 : 2) : value === true
  if (!pass) failures.push(`network check ${name} failed`)
}
for (const [name, value] of Object.entries(semanticChecks)) if (!value) failures.push(`semantic check ${name} failed`)
if (mobilePages.some((page) => page.horizontalScroll || !page.primaryTargetsAtLeast40px)) failures.push('mobile overflow or primary target height check failed')
if (contrast.failedCount !== 0 || contrastMinimum < 4.5) failures.push('contrast check failed')

const result = {
  generatedAt: new Date().toISOString(),
  manifest: 'capture-manifest.json',
  formalPngCount: checks.length,
  screenshotChecks: checks,
  semanticChecks,
  networkChecks,
  mobilePages,
  contrast: {
    sampleCount: contrast.samples.length,
    threshold: contrast.threshold,
    failedCount: contrast.failedCount,
    minimumRatio: contrastMinimum,
  },
  failureCount: failures.length,
  failures,
}
await writeFile(path.join(evidenceDir, 'alpha-verify.json'), `${JSON.stringify(result, null, 2)}\n`)
const hashAndFactSummary = checks.map((check) => ({
  id: check.id,
  sha256: check.sha256,
  hashMatches: check.hashMatches,
  dimensionsMatch: check.dimensionsMatch,
  factIdentityMatches: check.factIdentityMatches,
  factObjectIdsMatch: check.factObjectIdsMatch,
  factSourceFingerprintMatches: check.factSourceFingerprintMatches,
  factUrlMatches: check.factUrlMatches,
  factVisibleHeadedBrowser: check.factVisibleHeadedBrowser,
  menuItemsMatch: check.menuItemsMatch,
  forbiddenMenuItemAbsent: check.forbiddenMenuItemAbsent,
})).concat([{ semanticChecks, mobilePages, contrast: result.contrast, failureCount: failures.length, failures }])
await writeFile(path.join(evidenceDir, 'sha256-check.json'), `${JSON.stringify(hashAndFactSummary, null, 2)}\n`)
console.log(JSON.stringify({
  formalPngCount: checks.length,
  hashAndFactPassCount: checks.filter((check) => check.hashMatches && check.dimensionsMatch && check.factIdentityMatches && check.factObjectIdsMatch && check.factSourceFingerprintMatches && check.factUrlMatches).length,
  alphaPassCount: checks.filter((check) => check.allAlpha255).length,
  alphaSamples: checks.reduce((sum, check) => sum + check.alphaPointCount, 0),
  mobilePageCount: mobilePages.length,
  mobileNoHorizontalScroll: mobilePages.every((page) => !page.horizontalScroll),
  primaryTargetsAtLeast40px: mobilePages.every((page) => page.primaryTargetsAtLeast40px),
  semanticChecks,
  networkChecks,
  contrastSampleCount: contrast.samples.length,
  contrastMinimumRatio: contrastMinimum,
  failureCount: failures.length,
  failures,
}, null, 2))
if (failures.length) process.exitCode = 1
