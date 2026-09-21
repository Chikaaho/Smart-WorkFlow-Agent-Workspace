// TS-G1：《功能清单》「当前焦点」段发布投影修正（唯一允许的修正面）
// 用法: node apply-focus-sync.mjs <server-repo> <evidence-dir>
// 规则: 每处锚点必须唯一命中；任一处不唯一则整体不写入。
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const REPO = (process.argv[2] || 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-PaaS-server').split('\\').join('/');
const EV = (process.argv[3] || 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-02').split('\\').join('/');
const BT = String.fromCharCode(96);
const FILE = REPO + '/功能清单.md';

const S_ID = 'd18e9a39c552918615be8b158dfe0cc278cb309f';
const W_ID = '039f987437ed6369c3c131631bd7622c6ae482e7';
const S_OLD = 'c15428f0002f6bb0ceeff05c7cbcf842bd3d3148';
const W_OLD = '963df360ed18bc1c604652a13edb2a7ed0be8963';

const edits = [
  {
    id: 'FOCUS-01-baseline-server',
    find: '当前正式基线（0.1.0 最终，终态同步轮只同步引用、不重跑）：Server 独立 compile 门 exit 0 ＋ 全仓 **1362 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain H2 15 / PostgreSQL 12、终点 **V93**',
    replace: '当前正式基线（2026-09-21 发布轮实跑，终态同步轮只同步引用、不重跑）：Server @BT@MAVEN_OPTS=-Xmx2g mvn -B test@BT@ exit 0 ＋ 全仓 **1423 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain H2 15 / PostgreSQL 12、终点 **V93**'
  },
  {
    id: 'FOCUS-02-identity-web-and-demo',
    find: '）＋ 前端四门 exit 0（128 files / **1185 tests passed + 3 skipped**）；**0.1.0 发布身份：Server main @BT@' + S_OLD + '@BT@（annotated tag/Release @BT@0.1.0@BT@，main Actions 34946504087 成功，自动产物 @BT@bootstrap.jar@BT@）、Web main @BT@' + W_OLD + '@BT@（annotated tag/Release @BT@0.1.0@BT@，main Actions 34942666025 成功，自动产物 @BT@dist-963df36….zip@BT@）**；',
    replace: '）＋ 前端四门 exit 0（**1217 tests passed + 3 skipped**）；**0.1.0 发布身份：Server main/tag @BT@' + S_ID + '@BT@（annotated tag/Release @BT@0.1.0@BT@ 重建于该 main，公开 Release ID @BT@392753737@BT@，main CI run @BT@35569219107@BT@ success，CI 自动产物 @BT@bootstrap.jar@BT@）、Web main/tag @BT@' + W_ID + '@BT@（annotated tag/Release @BT@0.1.0@BT@ 重建于该 main，公开 Release ID @BT@392753751@BT@，main CI run @BT@35569219967@BT@ success，CI 自动产物 @BT@dist-039f987….zip@BT@）；演示环境已部署上述 CI 制品，应用数据库 V93（0 failed）、Owner 登录通过**；'
  },
  {
    id: 'FOCUS-03-task-status-next-action',
    find: '（最终复核 01 PASSED），当前唯一下一动作见 @BT@knowledge/current-status.md@BT@。',
    replace: '（最终复核 01 PASSED）；**0.1.0 P53/P61 演示环境发布（非业务功能任务）功能级 @BT@PASSED（2026-09-21）@BT@，发布任务状态 @BT@COMPLETED（待规划确认，2026-09-21）@BT@**；当前唯一下一动作=**等待 Owner 自行体验，发现问题另行立项**（细节见 @BT@knowledge/current-status.md@BT@）。'
  }
];

const before = readFileSync(FILE, 'utf8');
let after = before;
const log = { file: FILE, before_bytes: Buffer.byteLength(before, 'utf8'), before_sha256: createHash('sha256').update(before, 'utf8').digest('hex'), edits: [], failures: [], started_at: new Date().toISOString() };

for (const e of edits) {
  const findStr = e.find.split('@BT@').join(BT);
  const count = after.split(findStr).length - 1;
  if (count !== 1) { log.failures.push({ id: e.id, expected_hits: 1, actual_hits: count }); continue; }
  after = after.replace(findStr, () => e.replace.split('@BT@').join(BT));
  log.edits.push({ id: e.id, hits: count });
}

if (log.failures.length > 0) {
  writeFileSync(EV + '/apply-log.json', JSON.stringify(log, null, 2), 'utf8');
  console.error('FAILED ' + JSON.stringify(log.failures));
  process.exit(1);
}

writeFileSync(FILE, after, 'utf8');
log.after_bytes = Buffer.byteLength(after, 'utf8');
log.after_sha256 = createHash('sha256').update(after, 'utf8').digest('hex');
log.finished_at = new Date().toISOString();
writeFileSync(EV + '/apply-log.json', JSON.stringify(log, null, 2), 'utf8');
console.log('OK edits=' + log.edits.length + ' before=' + log.before_bytes + ' after=' + log.after_bytes);
