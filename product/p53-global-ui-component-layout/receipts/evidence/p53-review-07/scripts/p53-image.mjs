/** 图像引擎：PNG base64 进页，解码/遮罩/比较/渲染全部在页面 canvas 内完成。 */

import { readFile } from 'node:fs/promises'

export async function installImageRuntime(page) {
  await page.setContent('<!doctype html><title>p53-image</title>')
  await page.evaluate(() => {
    window.__p53 = {
      slots: {},
      sample(name, x, y) {
        const slot = this.slots[name];
        if (!slot) throw new Error('no image slot: ' + name);
        const i = (y * slot.w + x) * 4;
        return [slot.data.data[i], slot.data.data[i + 1], slot.data.data[i + 2]];
      },
      async load(name, b64) {
        const img = new Image()
        await new Promise((res, rej) => {
          img.onload = res
          img.onerror = () => rej(new Error('image decode failed: ' + name))
          img.src = 'data:image/png;base64,' + b64
        })
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        this.slots[name] = { w: c.width, h: c.height, data: ctx.getImageData(0, 0, c.width, c.height) }
        return { w: c.width, h: c.height }
      },
      buildMask(rects, w, h) {
        const m = new Uint8Array(w * h)
        for (const r of rects) {
          for (let y = r.y; y < r.y + r.h; y++) m.fill(1, y * w + r.x, y * w + r.x + r.w)
        }
        return m
      },
      compare(refName, runName, rects, thresh) {
        const a = this.slots[refName];
        const b = this.slots[runName];
        const w = a.w, h = a.h;
        const da = a.data.data, db = b.data.data;
        const mask = this.buildMask(rects, w, h);
        const diffMask = new Uint8Array(w * h);
        const at = (x, y) => (y * w + x) * 4;
        const yiqAt = (d, i) => (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 / 255;
        const manySiblings = (d, i, x, y) => {
          const y0 = yiqAt(d, i);
          let same = 0;
          const nb = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
          for (let k = 0; k < 8; k++) {
            const nx = x + nb[k][0], ny = y + nb[k][1];
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (Math.abs(yiqAt(d, at(nx, ny)) - y0) <= 0.022) same++;
          }
          return same > 4;
        };
        let diffCount = 0, total = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (mask[idx]) continue;
            total++;
            const i = idx * 4;
            if (Math.abs(yiqAt(da, i) - yiqAt(db, i)) <= thresh) continue;
            if (manySiblings(da, i, x, y) && manySiblings(db, i, x, y)) continue;
            diffMask[idx] = 1;
            diffCount++;
          }
        }
        this.slots.__diff = { w, h, data: diffMask };
        return { diffCount, total };
      },
      regionStats(regions) {
        const diff = this.slots.__diff.data;
        const w = this.slots.__diff.w, h = this.slots.__diff.h;
        const out = {};
        for (const r of regions) out[r.name] = { total: 0, diff: 0 };
        for (let y = 0; y < h; y++) {
          const rowBase = y * w;
          for (const r of regions) {
            if (y < r.y || y >= r.y + r.h) continue;
            const xs = Math.max(0, r.x), xe = Math.min(w, r.x + r.w);
            for (let x = xs; x < xe; x++) {
              out[r.name].total++;
              if (diff[rowBase + x]) out[r.name].diff++;
            }
          }
        }
        return out;
      },
      renderDiff(refName, maskRects) {
        const a = this.slots[refName];
        const diff = this.slots.__diff.data;
        const mask = this.buildMask(maskRects, a.w, a.h);
        const c = document.createElement('canvas');
        c.width = a.w;
        c.height = a.h;
        const ctx = c.getContext('2d');
        const out = ctx.createImageData(a.w, a.h);
        const da = a.data.data;
        for (let idx = 0; idx < a.w * a.h; idx++) {
          const i = idx * 4;
          let r = da[i], g = da[i + 1], bl = da[i + 2];
          const lum = (r * 299 + g * 587 + bl * 114) / 1000;
          r = g = bl = lum;
          if (diff[idx]) { r = 255; g = 0; bl = 0; }
          else if (mask[idx]) { r = 60; g = 120; bl = 255; }
          out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = bl; out.data[i + 3] = 255;
        }
        ctx.putImageData(out, 0, 0);
        return c.toDataURL('image/png');
      },
      sample(name, points) {
        const s = this.slots[name];
        return points.map((p) => {
          const i = (p.y * s.w + p.x) * 4;
          return { x: p.x, y: p.y, rgb: [s.data.data[i], s.data.data[i + 1], s.data.data[i + 2]] };
        });
      },
      scanHits(name, box, expected) {
        // 元素几何内扫描：返回与预期 RGB 每通道 Δ≤3 的像素数与首命中点（细线/图标锚定采样）。
        const s = this.slots[name];
        let hitCount = 0;
        let firstHit = null;
        for (let y = box.y0; y <= box.y1; y++) {
          const row = y * s.w;
          for (let x = box.x0; x <= box.x1; x++) {
            const i = (row + x) * 4;
            const dr = Math.abs(s.data.data[i] - expected[0]);
            const dg = Math.abs(s.data.data[i + 1] - expected[1]);
            const db = Math.abs(s.data.data[i + 2] - expected[2]);
            if (dr <= 3 && dg <= 3 && db <= 3) {
              hitCount++;
              if (!firstHit) firstHit = { x, y };
              if (hitCount >= 100000) return { hitCount, firstHit };
            }
          }
        }
        return { hitCount, firstHit };
      },
    };
  })
}

export async function loadImage(page, name, filePath) {
  const b64 = (await readFile(filePath)).toString('base64')
  return page.evaluate(([n, b]) => window.__p53.load(n, b), [name, b64])
}
