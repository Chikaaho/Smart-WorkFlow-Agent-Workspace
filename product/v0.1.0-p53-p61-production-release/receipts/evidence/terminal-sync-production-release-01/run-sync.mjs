// 0.1.0 P53/P61 演示环境发布阶段三终态同步 —— 执行器
// 用法: node run-sync.mjs <workspace> <evidence-dir>
// 任一处锚点不唯一或 memory 文件与同步前快照不一致 => 整体不写入，退出码 1。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { edits, memFiles } from './apply-sync.mjs';

const WS = (process.argv[2] || 'E:/code/Smart-WorkFlow-Agent-Workspace').split('\\').join('/');
const EV = (process.argv[3] || (WS + '/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-01')).split('\\').join('/');

const snapPath = (rel) => EV + '/before/' + rel.split('/').join('__');
const log = { workspace: WS, evidence: EV, started_at: new Date().toISOString(), edits: [], memFiles: [], failures: [] };
const cache = new Map();

function load(rel) {
  if (!cache.has(rel)) {
    const abs = WS + '/' + rel;
    if (!existsSync(abs)) { throw new Error('missing file: ' + rel); }
    cache.set(rel, readFileSync(abs, 'utf8'));
  }
  return cache.get(rel);
}

for (const e of edits) {
  const src = load(e.file);
  const count = src.split(e.find).length - 1;
  if (count !== 1) {
    log.failures.push({ id: e.id, file: e.file, expected_hits: 1, actual_hits: count });
    continue;
  }
  const beforeBytes = Buffer.byteLength(src, 'utf8');
  const next = src.replace(e.find, () => e.replace);
  cache.set(e.file, next);
  log.edits.push({ id: e.id, file: e.file, hits: count, before_bytes: beforeBytes, after_bytes: Buffer.byteLength(next, 'utf8') });
}

for (const m of memFiles) {
  const cur = readFileSync(WS + '/' + m.file, 'utf8');
  const snap = readFileSync(snapPath(m.file), 'utf8');
  if (cur !== snap) {
    log.failures.push({ id: m.id, file: m.file, expected_hits: 'content==before-snapshot', actual_hits: 'differs' });
    continue;
  }
  cache.set(m.file, m.content);
  log.memFiles.push({
    id: m.id,
    file: m.file,
    before_bytes: Buffer.byteLength(snap, 'utf8'),
    after_bytes: Buffer.byteLength(m.content, 'utf8'),
    after_sha256: createHash('sha256').update(m.content, 'utf8').digest('hex')
  });
}

if (log.failures.length > 0) {
  writeFileSync(EV + '/apply-log.json', JSON.stringify(log, null, 2), 'utf8');
  console.error('FAILED ' + JSON.stringify(log.failures, null, 2));
  process.exit(1);
}

for (const [rel, content] of cache.entries()) {
  writeFileSync(WS + '/' + rel, content, 'utf8');
}

const totalBefore = memFiles.reduce((a, m) => a + Buffer.byteLength(readFileSync(snapPath(m.file), 'utf8'), 'utf8'), 0);
const totalAfter = memFiles.reduce((a, m) => a + Buffer.byteLength(m.content, 'utf8'), 0);
log.memory_total_before_bytes = totalBefore;
log.memory_total_after_bytes = totalAfter;
log.memory_max_file_after_bytes = Math.max.apply(null, memFiles.map((m) => Buffer.byteLength(m.content, 'utf8')));
log.finished_at = new Date().toISOString();
writeFileSync(EV + '/apply-log.json', JSON.stringify(log, null, 2), 'utf8');
console.log('OK edits=' + log.edits.length + ' memFiles=' + log.memFiles.length + ' memory_before=' + totalBefore + ' memory_after=' + totalAfter);
