/**
 * 诊断工具（非证据）：裁剪设计/运行 PNG 的指定区域并放大并排输出。
 * 用法：node zoom.mjs <seq> <familyDir> <x> <y> <w> <h> <out.png> [scale]
 * refOverride 感知；scale 默认 2。
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', '..', '..', '..',
)
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const requireFromWeb = createRequire(path.join(webRoot, 'package.json'))
const { chromium } = requireFromWeb('@playwright/test')
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const { installImageRuntime, loadImage } = await import(
  pathToFileURL(path.join(scriptsDir, 'p53-image.mjs')).href
)
const evidenceRoot = path.join(scriptsDir, '..')
const refRoot = path.join(workspaceRoot, 'docs', 'ui', 'png')
const lockedIndex = JSON.parse(
  await readFile(
    path.join(evidenceRoot, '..', 'p53-review-04', 'reference', 'local-design-index.json'),
    'utf8',
  ),
)
const lockedBySeq = new Map(lockedIndex.nodes.map((n) => [String(n.seq).padStart(2, '0'), n]))
const nodesMod = await import(pathToFileURL(path.join(scriptsDir, 'p53-nodes.mjs')).href)
const NODES = nodesMod.NODES

const [seqRaw, dir, x, y, w, h, out, scaleArg] = process.argv.slice(2)
if (!seqRaw || !dir || !out) throw new Error('usage: node zoom.mjs <seq> <familyDir> <x> <y> <w> <h> <out.png> [scale]')
const seq = seqRaw.padStart(2, '0')
const refSeq = NODES[seq]?.refOverride ?? seq
const refPath = path.join(refRoot, path.basename(lockedBySeq.get(refSeq.padStart(2, '0')).locked_png))
const runPath = path.join(evidenceRoot, dir, seq + '-runtime.png')
const scale = Number(scaleArg ?? 2)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await installImageRuntime(page)
await loadImage(page, 'ref', refPath)
await loadImage(page, 'run', runPath)
const pngB64 = await page.evaluate(
  ({ x, y, w, h, scale }) => {
    const grab = (name) => {
      const slot = window.__p53.slots[name]
      const c = document.createElement('canvas')
      c.width = w * scale
      c.height = h * scale
      const ctx = c.getContext('2d')
      const img = ctx.createImageData(w, h)
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          const si = ((y + yy) * slot.w + (x + xx)) * 4
          const di = (yy * w + xx) * 4
          img.data[di] = slot.data.data[si]
          img.data[di + 1] = slot.data.data[si + 1]
          img.data[di + 2] = slot.data.data[si + 2]
          img.data[di + 3] = 255
        }
      }
      const tmp = document.createElement('canvas')
      tmp.width = w; tmp.height = h
      tmp.getContext('2d').putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, w, h, 0, 0, w * scale, h * scale)
      return c
    }
    const a = grab('ref')
    const b = grab('run')
    const out = document.createElement('canvas')
    out.width = a.width
    out.height = a.height + b.height + 4
    const ctx = out.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(a, 0, 0)
    ctx.drawImage(b, 0, a.height + 4)
    return out.toDataURL('image/png')
  },
  { x: Number(x), y: Number(y), w: Number(w), h: Number(h), scale },
)
await writeFile(out, Buffer.from(pngB64.split(',')[1], 'base64'))
await browser.close()
console.log('written ' + out)
