// 同步内一致性修正 01：把仍以“当前值”口径出现的 2026-09-15 首次发布身份显式标注为历史时点。
import { readFileSync, writeFileSync } from 'node:fs';
const WS = (process.argv[2] || 'E:/code/Smart-WorkFlow-Agent-Workspace').split('\\').join('/');
const fixes = [
  {
    id: 'FIX-01-header-0915-point',
    file: 'knowledge/current-status.md',
    find: 'P60 时点功能数 44、清单 ✅46/🟦22/⬜22、ADV64 与 P 编号全部保持现状。**0.1.0 已发布并锁定**（发布轮 Workspace 零 Git 写动作；',
    replace: 'P60 时点功能数 44、清单 ✅46/🟦22/⬜22、ADV64 与 P 编号全部保持现状。**0.1.0 已于 2026-09-15 首次发布并锁定**（该时点身份，后被 2026-09-21 发布轮重建，当前身份见本行开头；发布轮 Workspace 零 Git 写动作；'
  },
  {
    id: 'FIX-02-p60-bullet-0915-point',
    file: 'knowledge/current-status.md',
    find: '**P60 整体 COMPLETED（规划已确认，2026-09-15）**：整体 14/14 通过（发布最终验收 02 PASSED），0.1.0 两仓已发布并锁定（Server main @BT@c15428f0002f6bb0ceeff05c7cbcf842bd3d3148@BT@、Web main @BT@963df360ed18bc1c604652a13edb2a7ed0be8963@BT@、tag/Release @BT@0.1.0@BT@、迁移终点 V93），主方向与发布方向均已归档 @BT@passed/@BT@；',
    replace: '**P60 整体 COMPLETED（规划已确认，2026-09-15）**：整体 14/14 通过（发布最终验收 02 PASSED），0.1.0 两仓于 2026-09-15 首次发布并锁定（该时点身份 Server main @BT@c15428f0002f6bb0ceeff05c7cbcf842bd3d3148@BT@、Web main @BT@963df360ed18bc1c604652a13edb2a7ed0be8963@BT@、tag/Release @BT@0.1.0@BT@、迁移终点 V93；2026-09-21 已按 @BT@v0.1.0-p53-p61-production-release@BT@ 在合并后 main 重建 tag/Release，当前身份见本文件快照头与基线行），主方向与发布方向均已归档 @BT@passed/@BT@；'
  }
];
const BT = String.fromCharCode(96);
const cache = new Map();
const log = [];
for (const f of fixes) {
  const src = cache.get(f.file) || readFileSync(WS + '/' + f.file, 'utf8');
  const findStr = f.find.split('@BT@').join(BT);
  const count = src.split(findStr).length - 1;
  if (count !== 1) { console.error('FAILED ' + f.id + ' hits=' + count); process.exit(1); }
  const next = src.replace(findStr, () => f.replace.split('@BT@').join(BT));
  cache.set(f.file, next);
  log.push({ id: f.id, file: f.file, hits: count, before_bytes: Buffer.byteLength(src, 'utf8'), after_bytes: Buffer.byteLength(next, 'utf8') });
}
for (const [rel, content] of cache.entries()) { writeFileSync(WS + '/' + rel, content, 'utf8'); }
writeFileSync(WS + '/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-01/apply-log-fix-01.json', JSON.stringify({ fixes: log, finished_at: new Date().toISOString() }, null, 2), 'utf8');
console.log('OK fixes=' + log.length);
