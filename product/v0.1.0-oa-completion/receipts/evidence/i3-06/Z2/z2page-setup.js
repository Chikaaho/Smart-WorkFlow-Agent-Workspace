(() => {
  if (!window.__z2net) {
    window.__z2net = [];
    const X = XMLHttpRequest.prototype;
    const origOpen = X.open, origSend = X.send;
    X.open = function(m, u) { this.__z2 = { m, u: String(u), t: new Date().toISOString() }; return origOpen.apply(this, arguments); };
    X.send = function(body) {
      const rec = this.__z2 || (this.__z2 = { m: 'GET', u: '?', t: new Date().toISOString() });
      rec.body = body == null ? null : String(body).slice(0, 4000);
      this.addEventListener('loadend', () => {
        try { rec.status = this.status; rec.resp = String(this.responseText ?? '').slice(0, 4000); } catch (e) { rec.respErr = String(e); }
        window.__z2net.push(rec);
      });
      return origSend.apply(this, arguments);
    };
    window.__z2xhr = true;
  }
  const svg = document.querySelector('svg.pg-svg');
  const rect = svg.getBoundingClientRect();
  const vbRaw = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  window.__z2client = (gx, gy) => {
    const svg2 = document.querySelector('svg.pg-svg');
    const r2 = svg2.getBoundingClientRect();
    const p2 = svg2.getAttribute('viewBox').split(/\s+/).map(Number);
    return { x: Math.round(r2.left + (gx - p2[0]) / p2[2] * r2.width),
             y: Math.round(r2.top + (gy - p2[1]) / p2[3] * r2.height) };
  };
  window.__z2canvas = () => {
    const svg = document.querySelector('svg.pg-svg');
    const nodes = [...svg.querySelectorAll('g.designer-node')].map(g => ({
      id: g.getAttribute('data-node-id'), transform: g.getAttribute('transform'),
      label: g.querySelector('text.designer-node-label')?.textContent, type: g.querySelector('text.designer-node-type')?.textContent,
      selected: g.classList.contains('designer-node-selected'), error: g.classList.contains('designer-node-error') }));
    const edges = [...svg.querySelectorAll('path.designer-edge')].map(p => ({ d: p.getAttribute('d'), selected: p.classList.contains('designer-edge-selected') }));
    const props = [...document.querySelectorAll('.designer-props .el-form-item')].map(fi => ({ label: fi.querySelector('.el-form-item__label')?.textContent, value: fi.querySelector('input')?.value }));
    const toasts = [...document.querySelectorAll('.el-message')].map(m => ({ cls: m.getAttribute('class'), text: m.textContent?.trim() }));
    const errPanel = [...document.querySelectorAll('.designer-error-row')].map(e => e.textContent?.trim());
    return { nodes, edges, pending: svg.querySelector('path.designer-edge-pending')?.getAttribute('d') ?? null,
      palette: [...document.querySelectorAll('.palette-item')].map(el => { const r = el.getBoundingClientRect();
        return { type: el.querySelector('.palette-type')?.textContent, x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) }; }),
      props, toasts, errPanel, sel: document.querySelector('.designer-node-selected')?.getAttribute('data-node-id') ?? null };
  };
  window.__z2nodept = (id, which) => {
    const g = document.querySelector('g.designer-node[data-node-id="' + id + '"]');
    if (!g) return null;
    const r = g.getBoundingClientRect();
    if (which === 'port') return { x: Math.round(r.right - 8), y: Math.round(r.top + r.height / 2) };
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  };
  window.__z2client = (gx, gy) => {
    // SVG preserveAspectRatio 兼容映射：按实际缩放与 letterbox 偏移换算
    const svg2 = document.querySelector('svg.pg-svg');
    const r2 = svg2.getBoundingClientRect();
    const p2 = svg2.getAttribute('viewBox').split(/\s+/).map(Number);
    const scale = Math.min(r2.width / p2[2], r2.height / p2[3]);
    const offX = (r2.width - p2[2] * scale) / 2;
    const offY = (r2.height - p2[3] * scale) / 2;
    return { x: Math.round(r2.left + offX + (gx - p2[0]) * scale),
             y: Math.round(r2.top + offY + (gy - p2[1]) * scale) };
  };
  return 'setup ok';
})()
