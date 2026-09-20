/**
 * 诊断工具（非证据）：裁剪锁定设计 PNG 的指定区域。
 * 用法：node crop-design.mjs <seq> <x> <y> <w> <h> <out.png> [scale]
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const refRoot = path.join(workspaceRoot, 'docs', 'ui', 'png')
const lockedIndex = JSON.parse(
  await readFile(
    path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-04', 'reference', 'local-design-index.json'),
    'utf8',
  ),
)
const [seqRaw, x, y, w, h, out, scaleArg] = process.argv.slice(2)
const seq = String(Number(seqRaw)).padStart(2, '0')
const refPath = path.join(refRoot, path.basename(lockedIndex.nodes.find((n) => n.seq === Number(seq)).locked_png))
const scale = Number(scaleArg ?? 1)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
await page.setContent('<canvas id="c"></canvas>')
const b64 = (await readFile(refPath)).toString('base64')
const url = await page.evaluate(async ({ b64, x, y, w, h, scale }) => {
  const img = new Image()
  await new Promise((res, rej) => {
    img.onload = res
    img.onerror = rej
    img.src = 'data:image/png;base64,' + b64
  })
  const c = document.getElementById('c')
  c.width = w * scale
  c.height = h * scale
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, x, y, w, h, 0, 0, w * scale, h * scale)
  return c.toDataURL('image/png')
}, { b64, x: Number(x), y: Number(y), w: Number(w), h: Number(h), scale })
await writeFile(out, Buffer.from(url.split(',')[1], 'base64'))
await browser.close()
console.log('written ' + out)
