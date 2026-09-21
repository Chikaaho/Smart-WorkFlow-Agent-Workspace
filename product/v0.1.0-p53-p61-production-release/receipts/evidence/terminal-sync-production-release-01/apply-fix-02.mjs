// 同步内一致性修正 02：
// 1) features 记录中 2026-09-15 条目的“（本轮）”标签在新一轮追加后会产生歧义，改为历史轮次并注明身份已重建；
// 2) 索引追踪条目补齐本次发布身份（main/tag、Release ID、CI run），使索引与权威状态携带同一组值。
import { readFileSync, writeFileSync } from 'node:fs';
const WS = (process.argv[2] || 'E:/code/Smart-WorkFlow-Agent-Workspace').split('\\').join('/');
const BT = String.fromCharCode(96);
const fixes = [
  {
    id: 'FIX-02-1-historical-round-label',
    file: 'knowledge/features/v0.1.0-oa-completion.md',
    find: '**2026-09-15 P60 整体终态同步（本轮）**',
    replace: '**2026-09-15 P60 整体终态同步（历史轮次；该轮两仓首次发布身份已于 2026-09-21 发布轮重建，见上条）**'
  },
  {
    id: 'FIX-02-2-index-identity',
    file: 'knowledge/feature-reconciliation-index.md',
    find: '- 0.1.0 P53/P61 演示环境发布（非业务功能任务，2026-09-21）：@BT@product/v0.1.0-p53-p61-production-release/@BT@（主方向',
    replace: '- 0.1.0 P53/P61 演示环境发布（非业务功能任务，2026-09-21）：发布身份 Server main/tag @BT@d18e9a39c552918615be8b158dfe0cc278cb309f@BT@（公开 Release ID @BT@392753737@BT@、main CI run @BT@35569219107@BT@）、Web main/tag @BT@039f987437ed6369c3c131631bd7622c6ae482e7@BT@（公开 Release ID @BT@392753751@BT@、main CI run @BT@35569219967@BT@）；@BT@product/v0.1.0-p53-p61-production-release/@BT@（主方向'
  }
];
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
writeFileSync(WS + '/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-01/apply-log-fix-02.json', JSON.stringify({ fixes: log, finished_at: new Date().toISOString() }, null, 2), 'utf8');
console.log('OK fixes=' + log.length);
