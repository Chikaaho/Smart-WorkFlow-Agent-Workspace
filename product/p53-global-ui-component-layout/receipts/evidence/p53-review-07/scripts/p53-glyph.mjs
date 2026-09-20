/**
 * P53 EV-07c glyph 遮罩运行时（提示07 §3 授权方法）：
 * 1. 候选区域 = DOM 文字行框（Range lineRects）膨胀 ≤4px；被遮挡/不可见行框不参与。
 * 2. 参考图（设计 PNG）中落在候选区域内的字形连通域 = 参考墨迹像素（与区域背景众数 YIQ 差 >0.06）
 *    的 8 连通分量；仅接受字形样分量（不越界、非细长结构线）。
 * 3. 遮罩 = 接受分量像素在候选区域内膨胀 ≤4px 的并集 ∪ 品牌栅格资产元素边界（raster 类）。
 * 4. 结构遮罩恒为 0：任何分量越出候选区域、细长（横条/竖条）、超大即排除并登记
 *    excludedNonText；遮罩像素必须全部落在候选区域内（机器断言）。
 * 5. 输出 glyph_mask_reason、原始行框、扩展边界、被排除非文字候选、topbar/sidebar/main 覆盖率。
 */

export async function installGlyphRuntime(page) {
  await page.evaluate(() => {
    window.__p53g = {
      yiq(d, i) {
        return (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 / 255
      },
      // 区域背景众数（量化 /8）
      modeColor(d, w, region) {
        const buckets = new Map()
        for (let y = region.y0; y <= region.y1; y++) {
          for (let x = region.x0; x <= region.x1; x++) {
            const i = (y * w + x) * 4
            const key = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3)
            buckets.set(key, (buckets.get(key) ?? 0) + 1)
          }
        }
        let bestKey = null, bestCount = 0, total = 0
        for (const [k, c] of buckets) { total += c; if (c > bestCount) { bestCount = c; bestKey = k } }
        return { share: bestCount / Math.max(1, total), rgb: [((bestKey >> 10) & 31) * 8 + 4, ((bestKey >> 5) & 31) * 8 + 4, (bestKey & 31) * 8 + 4] }
      },
      /**
       * args: { w, h, lineBoxes:[{x,y,w,h,text,cls}], brandRasters:[{x,y,w,h}], regions:[{name,x,y,w,h}], absorb:4 }
       * ref 已加载为 slots.ref。返回 { mask:Array8bit, accepted, excluded, regions, rawLineBoxes, expandedBounds }
       */
      buildMask(args) {
        const { w, h, lineBoxes, brandRasters, regions, absorb = 4 } = args
        const ref = window.__p53.slots.ref.data.data
        const allowed = new Uint8Array(w * h)
        const expanded = []
        for (const b of lineBoxes) {
          const x0 = Math.max(0, Math.floor(b.x) - absorb), y0 = Math.max(0, Math.floor(b.y) - absorb)
          const x1 = Math.min(w - 1, Math.ceil(b.x + b.w) + absorb), y1 = Math.min(h - 1, Math.ceil(b.y + b.h) + absorb)
          if (x1 <= x0 || y1 <= y0) continue
          expanded.push({ x0, y0, x1, y1, raw: { x: b.x, y: b.y, w: b.w, h: b.h }, text: b.text, cls: b.cls })
          for (let y = y0; y <= y1; y++) allowed.fill(1, y * w + x0, y * w + x1 + 1)
        }
        // 参考墨迹：候选区域内与局部背景 YIQ 差 > 0.06 的像素
        const ink = new Uint8Array(w * h)
        const lowMode = []
        for (const e of expanded) {
          const mode = this.modeColor(ref, w, e)
          if (mode.share < 0.35) { lowMode.push({ box: e.raw, text: e.text }); continue }
          for (let y = e.y0; y <= e.y1; y++) {
            for (let x = e.x0; x <= e.x1; x++) {
              const i = (y * w + x) * 4
              const mYiq = (mode.rgb[0] * 299 + mode.rgb[1] * 587 + mode.rgb[2] * 114) / 1000 / 255
              if (Math.abs(this.yiq(ref, i) - mYiq) > 0.06) ink[y * w + x] = 1
            }
          }
        }
        // 连通域标记（8 连通，仅 allowed 内）
        const label = new Int32Array(w * h).fill(0)
        const comps = []
        const stack = new Int32Array(w * h)
        let nextLabel = 0
        const NB = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x
            if (!ink[idx] || label[idx] || !allowed[idx]) continue
            nextLabel++
            let sp = 0
            stack[sp++] = idx
            label[idx] = nextLabel
            let minX = x, maxX = x, minY = y, maxY = y, area = 0
            while (sp > 0) {
              const cur = stack[--sp]
              const cx = cur % w, cy = (cur / w) | 0
              area++
              if (cx < minX) minX = cx
              if (cx > maxX) maxX = cx
              if (cy < minY) minY = cy
              if (cy > maxY) maxY = cy
              for (const [dx, dy] of NB) {
                const nx = cx + dx, ny = cy + dy
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
                const nIdx = ny * w + nx
                if (ink[nIdx] && !label[nIdx] && allowed[nIdx]) {
                  label[nIdx] = nextLabel
                  stack[sp++] = nIdx
                }
              }
            }
            comps.push({ id: nextLabel, minX, maxX, minY, maxY, area })
          }
        }
        // 字形分类：越界（分量触界且界外延续）、细长结构线、超大 → 排除
        const accepted = new Set()
        const excluded = []
        for (const c of comps) {
          const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1
          const touchesEdge = c.minX === 0 || c.minY === 0 || c.maxX === w - 1 || c.maxY === h - 1
          if (touchesEdge) { excluded.push({ box: { x: c.minX, y: c.minY, w: bw, h: bh }, reason: 'extends-to-page-edge' }); continue }
          // 分量必须完整落在某候选区域内（不得跨越区域边界延续）
          let host = null
          for (const e of expanded) {
            if (c.minX >= e.x0 && c.maxX <= e.x1 && c.minY >= e.y0 && c.maxY <= e.y1) { host = e; break }
          }
          if (!host) { excluded.push({ box: { x: c.minX, y: c.minY, w: bw, h: bh }, reason: 'crosses-region-boundary' }); continue }
          if (bw > host.raw.w + absorb * 2 + 2) { excluded.push({ box: { x: c.minX, y: c.minY, w: bw, h: bh }, reason: 'wider-than-line-box' }); continue }
          if (bh > host.raw.h + absorb * 2 + 2) { excluded.push({ box: { x: c.minX, y: c.minY, w: bw, h: bh }, reason: 'taller-than-line-box' }); continue }
          if (bw / bh > 10 && bw > host.raw.w * 0.9) { excluded.push({ box: { x: c.minX, y: c.minY, w: bw, h: bh }, reason: 'rule-like-horizontal' }); continue }
          if (bh / bw > 10 && bh > host.raw.h * 0.9) { excluded.push({ box: { x: c.minX, y: c.minY, w: bw, h: bh }, reason: 'rule-like-vertical' }); continue }
          accepted.add(c.id)
        }
        // 遮罩 = 接受分量膨胀 absorb（Chebyshev），且限制在候选区域并集内
        const mask = new Uint8Array(w * h)
        for (const c of comps) {
          if (!accepted.has(c.id)) continue
          const x0 = Math.max(0, c.minX - absorb), x1 = Math.min(w - 1, c.maxX + absorb)
          const y0 = Math.max(0, c.minY - absorb), y1 = Math.min(h - 1, c.maxY + absorb)
          for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
              const idx = y * w + x
              if (!allowed[idx]) continue
              const ddx = Math.max(c.minX - x, x - c.maxX, 0)
              const ddy = Math.max(c.minY - y, y - c.maxY, 0)
              if (Math.max(ddx, ddy) <= absorb) mask[idx] = 1
            }
          }
        }
        // 品牌栅格资产（logo/字标元素边界，非文字非结构容器）
        const rasterRects = []
        for (const b of brandRasters ?? []) {
          const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y))
          const x1 = Math.min(w - 1, Math.ceil(b.x + b.w) - 1), y1 = Math.min(h - 1, Math.ceil(b.y + b.h) - 1)
          if (x1 <= x0 || y1 <= y0) continue
          rasterRects.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 })
          for (let y = y0; y <= y1; y++) mask.fill(1, y * w + x0, y * w + x1 + 1)
        }
        // 覆盖率（glyph + raster 合计 ≤12%；分区报告）
        const regionStats = regions.map((r) => {
          let total = 0, masked = 0
          const xs = Math.max(0, r.x), xe = Math.min(w, r.x + r.w)
          const ys = Math.max(0, r.y), ye = Math.min(h, r.y + r.h)
          for (let y = ys; y < ye; y++) {
            for (let x = xs; x < xe; x++) {
              total++
              if (mask[y * w + x]) masked++
            }
          }
          return { name: r.name, total, masked, coverage: total ? Math.round((masked / total) * 1e6) / 1e6 : 0 }
        })
        const totalMasked = regionStats.reduce((s, r) => s + r.masked, 0)
        const totalPixels = regionStats.reduce((s, r) => s + r.total, 0)
        // 遮罩驻留页内（供 compareWithMask 复用），不做跨 JSON 序列化
        window.__p53g.__lastMask = mask
        return {
          expandedBounds: expanded.map((e) => ({ x: e.x0, y: e.y0, w: e.x1 - e.x0 + 1, h: e.y1 - e.y0 + 1, text: e.text })),
          rawLineBoxCount: lineBoxes.length,
          lowModeRegions: lowMode,
          acceptedComponents: [...accepted].length,
          excludedNonText: excluded.slice(0, 400),
          rasterRects,
          regionCoverage: regionStats,
          pageCoverage: totalPixels ? Math.round((totalMasked / totalPixels) * 1e6) / 1e6 : 0,
        }
      },
      // 比较与分区计分（像素遮罩版；遮罩来自 __p53g.__lastMask）
      compareWithMask(refName, runName, thresh) {
        const p53 = window.__p53
        const a = p53.slots[refName]
        const b = p53.slots[runName]
        const w = a.w, h = a.h
        const da = a.data.data, db = b.data.data
        const mask = window.__p53g.__lastMask
        if (!mask || mask.length !== w * h) throw new Error('glyph mask missing/stale')
        const diffMask = new Uint8Array(w * h)
        const at = (x, y) => (y * w + x) * 4
        const yiqAt = (d, i) => (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 / 255
        const manySiblings = (d, i, x, y) => {
          const y0 = yiqAt(d, i)
          let same = 0
          const nb = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]
          for (let k = 0; k < 8; k++) {
            const nx = x + nb[k][0], ny = y + nb[k][1]
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
            if (Math.abs(yiqAt(d, at(nx, ny)) - y0) <= 0.022) same++
          }
          return same > 4
        }
        let diffCount = 0, total = 0
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x
            if (mask[idx]) continue
            total++
            const i = idx * 4
            if (Math.abs(yiqAt(da, i) - yiqAt(db, i)) <= thresh) continue
            if (manySiblings(da, i, x, y) && manySiblings(db, i, x, y)) continue
            diffMask[idx] = 1
            diffCount++
          }
        }
        window.__p53.slots.__diff = { w, h, data: diffMask }
        window.__p53.slots.__mask = { w, h, data: mask }
        return { diffCount, total }
      },
      regionStats(regions) {
        return window.__p53.regionStats(regions)
      },
      renderDiff(refName) {
        return window.__p53.renderDiff(refName, [])
      },
      // 行框墨迹高度测量（ref/run 双侧；用于字号/行高机读代理）
      inkMetrics(box) {
        const out = {}
        for (const name of ['ref', 'run']) {
          const slot = window.__p53.slots[name]
          const d = slot.data.data
          const x0 = Math.max(0, Math.floor(box.x) - 2), x1 = Math.min(slot.w - 1, Math.ceil(box.x + box.w) + 2)
          const y0 = Math.max(0, Math.floor(box.y) - 2), y1 = Math.min(slot.h - 1, Math.ceil(box.y + box.h) + 2)
          const mode = window.__p53g.modeColor(d, slot.w, { x0, y0, x1, y1 })
          const mYiq = (mode.rgb[0] * 299 + mode.rgb[1] * 587 + mode.rgb[2] * 114) / 1000 / 255
          let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity, area = 0
          for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
              const i = (y * slot.w + x) * 4
              if (Math.abs(window.__p53g.yiq(d, i) - mYiq) > 0.06) {
                area++
                if (y < minY) minY = y
                if (y > maxY) maxY = y
                if (x < minX) minX = x
                if (x > maxX) maxX = x
              }
            }
          }
          out[name] = area > 0 ? { inkH: maxY - minY + 1, inkW: maxX - minX + 1, area, top: minY === Infinity ? null : minY, left: minX === Infinity ? null : minX, modeYiq: Math.round(mYiq * 1000) / 1000 } : { modeYiq: Math.round(mYiq * 1000) / 1000 }
        }
        return out
      },
    }
  })
}
