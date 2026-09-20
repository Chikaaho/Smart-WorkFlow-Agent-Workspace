import { readFile, writeFile } from 'node:fs/promises'
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

const seq = process.argv[2] ?? '07'
const dir = process.argv[3] ?? 'family-c'
const y0 = Number(process.argv[4] ?? 60)
const y1 = Number(process.argv[5] ?? 132)
const out = process.argv[6] ?? path.join(evidenceRoot, 'analysis', `strip-${seq}.png`)

const lockedIndex = JSON.parse(await readFile(path.join(evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json'), 'utf8'))
const node = lockedIndex.nodes.find((n) => String(n.seq).padStart(2, '0') === seq)
const refB64 = (await readFile(path.join(workspaceRoot, 'docs', 'ui', 'png', path.basename(node.locked_png)))).toString('base64')
const runB64 = (await readFile(path.join(evidenceRoot, dir, seq + '-runtime.png'))).toString('base64')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: (y1 - y0) * 2 + 20 } })
await installImageRuntime(page)
await page.evaluate((d) => window.__p53.load('ref', d), refB64)
await page.evaluate((d) => window.__p53.load('run', d), runB64)
const url = await page.evaluate(({ y0, y1 }) => {
  const A = window.__p53.slots.ref
  const B = window.__p53.slots.run
  const c = document.createElement('canvas')
  c.width = 1440
  c.height = (y1 - y0) * 2 + 8
  const ctx = c.getContext('2d')
  const put = (slot, dy) => {
    const img = new ImageData(new Uint8ClampedArray(slot.data.data), slot.w, slot.h)
    const t = document.createElement('canvas')
    t.width = slot.w; t.height = slot.h
    t.getContext('2d').putImageData(img, 0, 0)
    ctx.drawImage(t, 0, y0, slot.w, y1 - y0, 0, dy, 1440, y1 - y0)
  }
  put(A, 0)
  put(B, y1 - y0 + 8)
  return c.toDataURL('image/png')
}, { y0, y1 })
await writeFile(out, Buffer.from(url.split(',')[1], 'base64'))
console.log('written', out)
await browser.close()
