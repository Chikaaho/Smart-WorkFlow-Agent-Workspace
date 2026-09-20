import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
const requireFromWeb = createRequire('E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-Web/package.json')
const { chromium } = requireFromWeb('@playwright/test')
const seq = process.argv[2] ?? '13'
const refNames = { '07': '07 表单设计器.png', '09': '09 流程设计器.png', '13': '13 流程高级配置.png' }
const ref = `E:/code/Smart-WorkFlow-Agent-Workspace/docs/ui/png/${refNames[seq] ?? `${seq}.png`}`
const run = `E:/code/Smart-WorkFlow-Agent-Workspace/product/p53-global-ui-component-layout/receipts/evidence/p53-review-06/family-c/${seq}-runtime.png`
const maskPath = `E:/code/Smart-WorkFlow-Agent-Workspace/product/p53-global-ui-component-layout/receipts/evidence/p53-review-06/family-c/${seq}-masks.json`
const masks = JSON.parse(await readFile(maskPath, 'utf8')).rects
const b = await chromium.launch({ headless: true })
const p = await b.newPage()
await p.setContent('<canvas></canvas>')
const out = await p.evaluate(async ({ ref, run, masks }) => {
  const read = async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await new Promise((r, j) => { img.onload = r; img.onerror = j }); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data } }
  const [a, z] = await Promise.all([read(ref), read(run)]); const m = new Uint8Array(a.w * a.h); for (const r of masks) for (let y = r.y; y < r.y + r.h; y++) m.fill(1, y * a.w + r.x, y * a.w + r.x + r.w)
  const yiq = (d, i) => (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 / 255; const tiles = new Map(); const tw = 40, th = 40
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) { const k = y * a.w + x; if (m[k]) continue; const i = k * 4; if (Math.abs(yiq(a.d, i) - yiq(z.d, i)) <= .1) continue; const tx = Math.floor(x / tw), ty = Math.floor(y / th), key = tx + ',' + ty; tiles.set(key, (tiles.get(key) ?? 0) + 1) }
  return [...tiles].sort((a, b) => b[1] - a[1]).slice(0, 30)
}, { ref: await readFile(ref).then((x) => x.toString('base64')), run: await readFile(run).then((x) => x.toString('base64')), masks })
console.log(JSON.stringify(out))
await b.close()
