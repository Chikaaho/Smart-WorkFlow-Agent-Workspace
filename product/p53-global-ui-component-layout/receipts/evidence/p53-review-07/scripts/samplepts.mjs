import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..')
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const { installImageRuntime } = await import(pathToFileURL(path.join(scriptsDir, 'p53-image.mjs')).href)
const evidenceRoot = path.join(scriptsDir, '..')
const seq = process.argv[2] ?? '11', dir = process.argv[3] ?? 'family-c'
const pts = JSON.parse(process.argv[4] ?? '[]')
const lockedIndex = JSON.parse(await readFile(path.join(evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json'), 'utf8'))
const node = lockedIndex.nodes.find((n) => String(n.seq).padStart(2, '0') === seq)
const refB64 = (await readFile(path.join(workspaceRoot, 'docs', 'ui', 'png', path.basename(node.locked_png)))).toString('base64')
const runB64 = (await readFile(path.join(evidenceRoot, dir, seq + '-runtime.png'))).toString('base64')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await page.evaluate((d) => window.__p53.load('ref', d), refB64)
await page.evaluate((d) => window.__p53.load('run', d), runB64)
const out = await page.evaluate((pts) => {
  return pts.map(({ name, x, y }) => ({
    name, x, y,
    design: window.__p53.sample('ref', [{ x, y }])[0].rgb,
    runtime: window.__p53.sample('run', [{ x, y }])[0].rgb,
  }))
}, pts)
for (const r of out) console.log(r.name, `(${r.x},${r.y})`, 'design=', r.design.join(','), 'runtime=', r.runtime.join(','))
await browser.close()
