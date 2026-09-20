#!/usr/bin/env node
/**
 * 零依赖 PNG 像素/alpha 探针（P53-review-02 取证工具）。
 * 用法：node pixel-probe.cjs <file.png> [points.json]
 *   points.json 缺省时输出：尺寸、四角、各边中点、中心点的 RGBA 与 alpha；
 *   提供 points.json 时按 [[x,y],...] 逐点输出。
 * 仅支持 8-bit RGB/RGBA（Playwright 截图形态）；输出纯 JSON 便于归档回读。
 */
const fs = require('fs')
const zlib = require('zlib')

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let pos = 8
  let width = 0,
    height = 0,
    colorType = 0,
    bitDepth = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') break
    pos += 12 + len
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`unsupported PNG: depth=${bitDepth} colorType=${colorType}`)
  }
  const bpp = colorType === 6 ? 4 : 3
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const out = Buffer.alloc(height * stride)
  let p = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]
    const line = raw.subarray(p, p + stride)
    p += stride
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null
    const cur = out.subarray(y * stride, (y + 1) * stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev ? prev[x] : 0
      const c = x >= bpp && prev ? prev[x - bpp] : 0
      let v = line[x]
      if (filter === 1) v = (v + a) & 0xff
      else if (filter === 2) v = (v + b) & 0xff
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff
      else if (filter === 4) {
        const pa = Math.abs(b - c),
          pb = Math.abs(a - c),
          pc = Math.abs(a + b - 2 * c)
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
      }
      cur[x] = v
    }
  }
  return { width, height, bpp, data: out }
}

function relLum(r, g, b) {
  const f = (c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

const file = process.argv[2]
const img = decodePng(fs.readFileSync(file))
const px = (x, y) => {
  const i = (y * img.width + x) * img.bpp
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.bpp === 4 ? img.data[i + 3] : 255]
}
let points
if (process.argv[3]) {
  points = JSON.parse(fs.readFileSync(process.argv[3]))
} else {
  const { width: w, height: h } = img
  points = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [3, 3],
    [w - 4, 3],
    [3, h - 4],
    [w - 4, h - 4],
    [Math.floor(w / 2), 0],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
    [Math.floor(w / 2), Math.floor(h / 2)],
  ]
}
const result = {
  file,
  width: img.width,
  height: img.height,
  colorType: img.bpp === 4 ? 'RGBA' : 'RGB',
  points: points.map(([x, y]) => {
    const [r, g, b, a] = px(Math.min(x, img.width - 1), Math.min(y, img.height - 1))
    return { x, y, r, g, b, a, luminance: +relLum(r, g, b).toFixed(4) }
  }),
}
console.log(JSON.stringify(result, null, 1))
