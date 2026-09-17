/**
 * P53 DESIGN_FIDELITY 比较器：glyph 遮罩（元素边界自动生成）+ 区域阈值判定。
 * 阈值：顶栏≤0.5%、侧栏≤0.5%、主区≤2%；遮罩每页≤12%；文字遮罩仅来自 DOM 文字行框。
 * 用法：node compare-family.mjs <a|b|c|d>   （先运行 capture-nodes.mjs）
 */
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { NODES, FAMILIES } from './p53-nodes.mjs'
import { installImageRuntime, loadImage } from './p53-image.mjs'

const workspaceRoot = path.resolve(process.cwd())
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const evidenceRoot = path.join(
  workspaceRoot,
  'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-05',
)
const lockedIndex = JSON.parse(
  await readFile(path.join(evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json'), 'utf8'),
)
const lockedBySeq = new Map(lockedIndex.nodes.map((n) => [String(n.seq).padStart(2, '0'), n]))

const refRoot = path.join(
  workspaceRoot, 'docs', 'ui', 'png'
)
const THRESHOLDS = { topbar: 0.005, sidebar: 0.005, main: 0.02 }

function regionsFor(inv, vw, vh) {
  const regions = []
  const topH = Math.round(inv.topbarHeight ?? 0)
  const sideW = Math.round(inv.sidebarWidth ?? 0)
  if (topH > 0 && sideW > 0) {
    regions.push({ name: 'topbar', x: 0, y: 0, w: vw, h: topH })
    regions.push({ name: 'sidebar', x: 0, y: topH, w: sideW, h: vh - topH })
    regions.push({ name: 'main', x: sideW, y: topH, w: vw - sideW, h: vh - topH })
  } else {
    regions.push({ name: 'main', x: 0, y: 0, w: vw, h: vh })
  }
  return regions
}

function buildMaskRects(inv, vw, vh) {
  const rects = []
  for (const t of inv.texts) {
    const boxes = t.lineRects && t.lineRects.length ? t.lineRects : [t.bbox]
    for (const b of boxes) {
      const x0 = Math.max(0, Math.floor(b.x) - 2)
      const y0 = Math.max(0, Math.floor(b.y) - 2)
      const x1 = Math.min(vw, Math.ceil(b.x + b.w) + 2)
      const y1 = Math.min(vh, Math.ceil(b.y + b.h) + 2)
      if (x1 <= x0 || y1 <= y0) continue
      rects.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, text: t.text.slice(0, 24) })
    }
  }
  rects.sort((p, q) => p.y - q.y || p.x - q.x)
  const merged = []
  for (const r of rects) {
    const hit = merged.find((m) => r.x < m.x + m.w && r.x + r.w > m.x && r.y < m.y + m.h && r.y + r.h > m.y)
    if (hit) {
      const x1 = Math.max(hit.x + hit.w, r.x + r.w)
      const y1 = Math.max(hit.y + hit.h, r.y + r.h)
      hit.x = Math.min(hit.x, r.x)
      hit.y = Math.min(hit.y, r.y)
      hit.w = x1 - hit.x
      hit.h = y1 - hit.y
    } else merged.push({ ...r })
  }
  return merged
}

const familyKey = process.argv[2]
if (!familyKey || !FAMILIES[familyKey]) throw new Error('usage: node compare-family.mjs <a|b|c|d>')
const family = FAMILIES[familyKey]
const outDir = path.join(evidenceRoot, family.id)
await mkdir(outDir, { recursive: true })

for (const seq of family.nodes) {
  const locked = lockedBySeq.get(seq);
  if (!locked) throw new Error('locked index missing node ' + seq)
  const refPath = path.join(refRoot, path.basename(locked.locked_png))
  const sha = createHash('sha256').update(await readFile(refPath)).digest('hex');
  if (sha !== locked.png_sha256) throw new Error('reference hash drift node ' + seq + ' (design package identity changed; stop per direction §2.5)');
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)

const nodeResults = []
for (const seq of family.nodes) {
  const refPath = path.join(refRoot, path.basename(lockedBySeq.get(seq).locked_png))
  const runPath = path.join(outDir, seq + '-runtime.png')
  const domPath = path.join(outDir, seq + '-dom.json')
  let ref, run, inv;
  try {
    ref = await loadImage(page, 'ref', refPath)
    run = await loadImage(page, 'run', runPath)
    inv = JSON.parse(await readFile(domPath, 'utf8'))
  } catch (e) {
    nodeResults.push({ node: seq, passed: false, error: 'input missing/undecodable: ' + String(e).slice(0, 120) })
    continue
  }
  if (ref.w !== run.w || ref.h !== run.h) {
    nodeResults.push({ node: seq, passed: false, error: 'dimension mismatch ref=' + ref.w + 'x' + ref.h + ' run=' + run.w + 'x' + run.h })
    continue
  }
  const w = ref.w, h = ref.h
  const maskRects = buildMaskRects(inv, w, h)
  const coverage = maskRects.reduce((s, r) => s + r.w * r.h, 0) / (w * h)
  const cmp = await page.evaluate(
    (p) => window.__p53.compare('ref', 'run', p.rects, p.thresh),
    { rects: maskRects, thresh: 0.1 },
  )
  const regions = regionsFor(inv, w, h)
  const stats = await page.evaluate((rg) => window.__p53.regionStats(rg), regions)
  const regionOut = regions.map((r) => {
    const s = stats[r.name]
    const ratio = s.total ? s.diff / s.total : 0
    const threshold = THRESHOLDS[r.name] ?? THRESHOLDS.main
    return { region: r.name, box: { x: r.x, y: r.y, w: r.w, h: r.h }, threshold, diffPixels: s.diff, totalPixels: s.total, ratio: Math.round(ratio * 1e6) / 1e6, passed: ratio <= threshold }
  })
  const maskGateOk = coverage <= 0.12
  const nodePassed = maskGateOk && regionOut.every((r) => r.passed)
  const diffPng = await page.evaluate((rects) => window.__p53.renderDiff('ref', rects), maskRects)
  await writeFile(path.join(outDir, seq + '-diff.png'), Buffer.from(diffPng.split(',')[1], 'base64'))
  await writeFile(path.join(outDir, seq + '-masks.json'), JSON.stringify({
    node: seq, generatedFrom: 'dom-text-line-rects', padPx: 2, rectCount: maskRects.length,
    coverage: Math.round(coverage * 1e6) / 1e6, coverageLimit: 0.12, coveragePassed: maskGateOk,
    protectedStructureMasked: false, rects: maskRects,
  }, null, 2) + '\n')
  await writeFile(path.join(outDir, seq + '-comparison.json'), JSON.stringify({
    node: seq, viewport: { w, h }, maskCoverage: Math.round(coverage * 1e6) / 1e6,
    regions: regionOut, failedRegions: regionOut.filter((r) => !r.passed).length, passed: nodePassed,
  }, null, 2) + '\n')
  const brief = regionOut.map((r) => r.region + '=' + r.ratio + (r.passed ? '' : '(FAIL)')).join(' ')
  nodeResults.push({ node: seq, passed: nodePassed, regions: brief })
  console.log(seq + ' ' + (nodePassed ? 'PASS' : 'FAIL') + ' ' + brief)
}
await browser.close()

const allPassed = nodeResults.length === family.nodes.length && nodeResults.every((n) => n.passed)
const summary = { family: family.id, nodes: nodeResults, allPassed, finishedAt: new Date().toISOString() }
await writeFile(path.join(outDir, 'family-comparison.json'), JSON.stringify(summary, null, 2) + '\n')
await appendFile(path.join(outDir, 'compare-runs.jsonl'), JSON.stringify({ at: new Date().toISOString(), allPassed, nodes: nodeResults }) + '\n')
await writeFile(path.join(outDir, 'design-compare.exit'), (allPassed ? '0' : '1') + '\n')
console.log('FAMILY ' + family.id + ' ' + (allPassed ? 'PASS' : 'FAIL'))
if (!allPassed) process.exitCode = 1
