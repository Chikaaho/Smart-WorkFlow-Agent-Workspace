import { inflateSync } from 'node:zlib'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

function decodePng(file) {
  const buf = readFileSync(file)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png: ' + file)
  let off = 8
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]; interlace = data[12]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6) || interlace !== 0) {
    throw new Error('unsupported png ' + file + ' depth=' + bitDepth + ' color=' + colorType)
  }
  const channels = colorType === 6 ? 4 : 3
  const stride = width * channels
  const raw = inflateSync(Buffer.concat(idat))
  const out = Buffer.alloc(width * height * 3)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1)
    const filter = raw[rowStart]
    const row = raw.subarray(rowStart + 1, rowStart + 1 + stride)
    const cur = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0
      const b = prev[i]
      const c = i >= channels ? prev[i - channels] : 0
      let v = row[i]
      if (filter === 1) v = (v + a) & 0xff
      else if (filter === 2) v = (v + b) & 0xff
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
      }
      cur[i] = v
    }
    for (let x = 0; x < width; x++) {
      out[y * width * 3 + x * 3] = cur[x * channels]
      out[y * width * 3 + x * 3 + 1] = cur[x * channels + 1]
      out[y * width * 3 + x * 3 + 2] = cur[x * channels + 2]
    }
    prev = cur
  }
  return { width, height, data: out }
}

const pairsDir = process.argv[2]
const outJson = process.argv[3]
const results = []
for (const refFile of readdirSync(pairsDir).filter((f) => f.endsWith('-reference.png')).sort()) {
  const seq = refFile.slice(0, 2)
  const runPath = path.join(pairsDir, seq + '-runtime.png')
  const maskPath = path.join(pairsDir, seq + '-masks.json')
  if (!existsSync(runPath)) {
    results.push({ seq: Number(seq), reference: refFile, runtime: null, skipped: true, reason: '仅保留未来参考，无运行时入口（方向 §5 节点31）' })
    continue
  }
  const masks = existsSync(maskPath) ? JSON.parse(readFileSync(maskPath, 'utf8')) : []
  const a = decodePng(path.join(pairsDir, refFile))
  const b = decodePng(runPath)
  const w = Math.min(a.width, b.width)
  const h = Math.min(a.height, b.height)
  const totals = [0, 0, 0]
  const diffs = [0, 0, 0]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const region = y < 64 ? 0 : x < 224 ? 1 : 2
      let masked = false
      for (const m of masks) {
        if (x >= m.x && y >= m.y && x < m.x + m.w && y < m.y + m.h) { masked = true; break }
      }
      const o = (y * w + x) * 3
      if (!masked) totals[region]++
      const dR = Math.abs(a.data[o] - b.data[o])
      const dG = Math.abs(a.data[o + 1] - b.data[o + 1])
      const dB = Math.abs(a.data[o + 2] - b.data[o + 2])
      if (!masked && (dR > 8 || dG > 8 || dB > 8)) diffs[region]++
    }
  }
  results.push({
    seq: Number(seq), reference: refFile, runtime: path.basename(runPath),
    threshold: { topbar: 0.005, sidebar: 0.005, main: 0.02 },
    topbar: { total: totals[0], diff: diffs[0], ratio: +(diffs[0] / Math.max(totals[0], 1)).toFixed(5) },
    sidebar: { total: totals[1], diff: diffs[1], ratio: +(diffs[1] / Math.max(totals[1], 1)).toFixed(5) },
    main: { total: totals[2], diff: diffs[2], ratio: +(diffs[2] / Math.max(totals[2], 1)).toFixed(5) },
  })
}
writeFileSync(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), method: 'Node zlib PNG decode, per-pixel channel diff > 8 counted, regions: topbar y<64, sidebar x<224 && y>=64, main rest; dynamic-content masks per comparison-mask-index', pairs: results }, null, 2) + '\n')
console.log('compared=' + results.filter((r) => !r.skipped).length + ' skipped=' + results.filter((r) => r.skipped).length)