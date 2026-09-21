// 0.1.0 P53/P61 演示环境发布阶段三终态同步 —— 稳定断言（只读回读）
// 用法: node verify-terminal-sync.mjs <workspace> <assert-output.json>
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const WS = (process.argv[2] || 'E:/code/Smart-WorkFlow-Agent-Workspace').split('\\').join('/');
const OUT = process.argv[3] || (WS + '/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-01/assert-output.json');
const BT = String.fromCharCode(96);

const S_ID = 'd18e9a39c552918615be8b158dfe0cc278cb309f';
const W_ID = '039f987437ed6369c3c131631bd7622c6ae482e7';
const S_OLD = 'c15428f0002f6bb0ceeff05c7cbcf842bd3d3148';
const W_OLD = '963df360ed18bc1c604652a13edb2a7ed0be8963';
const PENDING = 'COMPLETED（待规划确认，2026-09-21）';

const F = {
  cs: 'knowledge/current-status.md',
  sh: 'knowledge/session-handoff.md',
  ix: 'knowledge/feature-reconciliation-index.md',
  ft: 'knowledge/features/v0.1.0-oa-completion.md',
  mr: 'memory/README.md',
  ms: 'memory/state.md',
  mf: 'memory/features.md',
  mh: 'memory/handoff.md',
  tp: 'todo/v0.1.0-oa-plan.md',
  rp: 'todo/requirement-pool.md',
  dr: 'product/v0.1.0-p53-p61-production-release/ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md'
};
const text = {};
for (const k of Object.keys(F)) { text[k] = readFileSync(WS + '/' + F[k], 'utf8'); }
const lines = {};
for (const k of Object.keys(F)) { lines[k] = text[k].split('\n'); }

const results = [];
function check(id, desc, ok, detail) { results.push({ id, desc, ok: !!ok, detail: detail === undefined ? '' : String(detail) }); }
function hasAll(key, needles) { return needles.every((n) => text[key].includes(n)); }
function missing(key, needles) { return needles.filter((n) => !text[key].includes(n)); }

// --- 1. 发布任务状态（唯一值 1）
const pendingFiles = ['cs', 'sh', 'ft', 'mr', 'ms', 'mf', 'mh', 'tp', 'rp'];
for (const k of pendingFiles) {
  check('V1-' + k, '发布任务状态 ' + PENDING + ' 出现于 ' + F[k], text[k].includes(PENDING), text[k].includes(PENDING) ? 'found' : 'MISSING');
}
check('V1-no-preliminary-confirm', '不得把发布任务写成 COMPLETED（规划已确认）', !/发布任务[^。]{0,40}COMPLETED（规划已确认/.test(text.cs + text.sh + text.ms + text.mh + text.tp + text.rp), 'ok');

// --- 2. Server / Web 身份（唯一值 2、3）
const idNeedles = {
  cs: [S_ID, '392753737', '35569219107', W_ID, '392753751', '35569219967'],
  sh: [S_ID, '392753737', '35569219107', W_ID, '392753751', '35569219967'],
  ft: [S_ID, '392753737', '35569219107', W_ID, '392753751', '35569219967'],
  ms: [S_ID, '392753737', '35569219107', W_ID, '392753751', '35569219967'],
  mh: [S_ID, '392753737', '35569219107', W_ID, '392753751', '35569219967'],
  mr: [S_ID, W_ID],
  mf: [S_ID, W_ID],
  tp: [S_ID, '392753737', '35569219107', W_ID, '392753751', '35569219967'],
  rp: [S_ID, '392753737', W_ID, '392753751'],
  ix: [S_ID, W_ID]
};
for (const k of Object.keys(idNeedles)) {
  const miss = missing(k, idNeedles[k]);
  check('V2-' + k, '发布身份（main/tag、Release ID、CI run）齐全于 ' + F[k], miss.length === 0, miss.length === 0 ? 'all found' : 'missing: ' + miss.join(', '));
}
check('V2-release-id-old-not-current', '旧公开 Release 不呈现为当前身份（无 388979846/388979873 出现）', !text.cs.includes('388979846') && !text.sh.includes('388979846'), 'ok');

// --- 3. 演示环境（唯一值 4）
for (const k of ['cs', 'sh', 'ft', 'ms', 'mh', 'tp']) {
  const ok = text[k].includes('V93') && (text[k].includes('Owner 登录通过') || text[k].includes('Owner登录通过') || text[k].includes('Owner 登录验证通过'));
  check('V3-' + k, '演示环境 V93 与 Owner 登录通过登记于 ' + F[k], ok, ok ? 'ok' : 'missing V93 or Owner 登录');
}

// --- 4. 计数零变化（唯一值 5、6、7、9）
check('V4-cs-count', 'current-status 已完成功能数保持 45', text.cs.includes('| 已完成功能数 | **45** |'), 'ok');
check('V4-sh-count', 'session-handoff 正式业务功能数 45', /正式业务功能数 \| \*\*45\*\*/.test(text.sh), 'ok');
check('V4-ft-count', 'features/v0.1.0-oa-completion 正式功能数 45（登记路径 45/45）', text.ft.includes('正式功能数 **45**') && text.ft.includes('45/45'), 'ok');
check('V4-ix-count', 'feature-reconciliation-index 正式功能数 45', text.ix.includes('- 正式功能数：**45**'), 'ok');
check('V4-ms-count', 'memory/state 功能数 45', text.ms.includes('功能数 **45**'), 'ok');
check('V4-mf-count', 'memory/features 功能数 45', text.mf.includes('功能数 **45**'), 'ok');
check('V4-tp-count', 'todo/v0.1.0-oa-plan 功能数45', text.tp.includes('功能数45'), 'ok');
check('V4-checklist-cs', 'current-status 清单 ✅46/🟦22/⬜22（90）', text.cs.includes('**✅46 / 🟦22 / ⬜22**'), 'ok');
check('V4-checklist-sh', 'session-handoff 清单 ✅46/🟦22/⬜22', text.sh.includes('**✅46 / 🟦22 / ⬜22**'), 'ok');
check('V4-checklist-others', 'memory 与 todo 清单计数零变化', text.mf.includes('✅46/🟦22/⬜22') && text.tp.includes('✅46/🟦22/⬜22') && text.rp.includes('✅46/🟦22/⬜22'), 'ok');
check('V4-adv', 'ADV64 零变化（current-status / session-handoff / memory / todo）', text.cs.includes('ADV 高级能力规划项 8 模块、64 条') && text.ms.includes('ADV64') && text.rp.includes('ADV64'), 'ok');
check('V4-milestone-unchanged', '里程碑/明细 ID 零变化（90 明细映射段落未被本轮改写）', text.ix.includes('## 1. 90 项清单明细 ↔ 交付/P 编号 双向映射'), 'ok');

// --- 5. P 编号（唯一值 8）
check('V5-p53', 'P53 保持既有已核销（规划已确认，2026-09-21）', text.cs.includes('**P53 已核销（规划已确认，2026-09-21）**'), 'ok');
check('V5-p61', 'P61 保持既有已核销（规划已确认，2026-09-20）', text.cs.includes('**P61 已核销（规划已确认，2026-09-20）**'), 'ok');
check('V5-no-new-p', '本发布任务不新增/核销 P 编号（声明存在）', text.cs.includes('本发布任务不新增/核销 P 编号') && text.rp.includes('不新增/核销 P 编号') || text.cs.includes('本发布任务不新增/核销 P 编号'), 'ok');
check('V5-index-p-class', '索引 §2 P 编号分类计数未变（已核销/完成 24）', text.ix.includes('**已核销/完成（24）**'), 'ok');

// --- 6. 活动功能与下一动作（唯一值 11、12）
check('V6-cs-no-active', 'current-status 无活动正式功能', text.cs.includes('**无活动正式功能**'), 'ok');
check('V6-sh-no-active', 'session-handoff 无活动正式功能', text.sh.includes('当前仍无活动正式功能') || text.sh.includes('无活动正式功能'), 'ok');
check('V6-mh-no-active', 'memory/handoff 无活动正式功能', text.mh.includes('无活动正式功能'), 'ok');
const nextNeedles = { cs: '等待 Owner 自行体验', sh: '等待 Owner 自行体验', ms: '等待Owner自行体验', mr: '等待Owner自行体验', mh: '等待Owner自行体验', tp: '等待 Owner 自行体验', rp: '等待 Owner 自行体验' };
for (const k of Object.keys(nextNeedles)) {
  check('V6-next-' + k, '唯一下一动作（等待 Owner 自行体验）登记于 ' + F[k], text[k].includes(nextNeedles[k]), text[k].includes(nextNeedles[k]) ? 'ok' : 'MISSING');
}
check('V6-no-republish', '锁定口径（不得重复发布 / 不得移动或重建 main/tag/Release）', text.cs.includes('不得重复发布、不得移动或重建 main/tag/Release') && text.sh.includes('不得重复发布、不得移动或重建 main/tag/Release'), 'ok');

// --- 7. 方向目录（唯一值 13、14）
const P = WS + '/product/v0.1.0-p53-p61-production-release/';
check('V7-main-passed', '主方向已归档 passed/（direction-v0.1.0-p53-p61-production-release.md）', existsSync(P + 'passed/direction-v0.1.0-p53-p61-production-release.md'), 'ok');
check('V7-sync-ready', '终态同步方向保持 ready/ 未被移动', existsSync(P + 'ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md'), 'ok');
check('V7-no-sync-in-passed', 'passed/ 内不存在终态同步方向（执行侧未归档）', !existsSync(P + 'passed/direction-v0.1.0-p53-p61-production-release-terminal-sync.md'), 'ok');
check('V7-ready-only-sync', 'ready/ 仅含终态同步方向', readdirSync(P + 'ready').length === 1 && readdirSync(P + 'ready')[0].indexOf('terminal-sync') >= 0, readdirSync(P + 'ready').join(','));
check('V7-pointer', '方向内含执行侧状态指针与未确认声明', text.dr.includes('执行侧状态指针') && text.dr.includes('不自行确认'), 'ok');

// --- 8. memory 限额
const memDir = WS + '/memory';
const memFiles = readdirSync(memDir).filter((n) => n.endsWith('.md'));
const sizes = memFiles.map((n) => ({ n, b: Buffer.byteLength(readFileSync(memDir + '/' + n, 'utf8'), 'utf8') }));
const maxSize = Math.max.apply(null, sizes.map((s) => s.b));
const totalSize = sizes.reduce((a, s) => a + s.b, 0);
check('V8-max-file', 'memory 单文件 <5KB（最大 ' + maxSize + ' bytes）', maxSize < 5120, 'max=' + maxSize);
check('V8-total', 'memory 总量 <20KB（实际 ' + totalSize + ' bytes）', totalSize < 20480, 'total=' + totalSize);

// --- 9. 历史时点口径：旧身份只以历史口径出现
const oldIdentityFiles = ['cs', 'sh', 'ix', 'ft', 'ms', 'mf', 'mh', 'mr', 'tp', 'rp'];
const historicalMarkers = ['历史', '首次发布', '→', '初次发布', '重建'];
let unmarked = [];
for (const k of oldIdentityFiles) {
  lines[k].forEach((ln, i) => {
    if (ln.includes(S_OLD) || ln.includes(W_OLD)) {
      const ok = historicalMarkers.some((m) => ln.includes(m));
      if (!ok) { unmarked.push(F[k] + ':' + (i + 1)); }
    }
  });
}
check('V9-old-identity-historical', '旧 2026-09-15 发布身份仅以历史时点口径出现', unmarked.length === 0, unmarked.join(', ') || 'all marked');

// --- 10. 两代码仓工作树未被本轮改动
let repoStates = [];
for (const repo of ['Smart-WorkFlow-aPaaS-server', 'Smart-WorkFlow-aPaaS-Web']) {
  let out = '';
  try { out = execSync('git -C "' + WS + '/' + repo + '" status --porcelain', { encoding: 'utf8' }).trim(); } catch (e) { out = 'ERROR ' + e.message; }
  repoStates.push({ repo, porcelain: out });
}
check('V10-server-clean', 'Server 代码仓工作树 clean（本轮零改动）', repoStates[0].porcelain === '', repoStates[0].porcelain || 'clean');
check('V10-web-clean', 'Web 代码仓工作树 clean（本轮零改动）', repoStates[1].porcelain === '', repoStates[1].porcelain || 'clean');

// --- 11. 禁止项：本轮无工程命令（以证据面自证：无新增构建/测试产物）
check('V11-no-new-evidence-dirs', '本轮未生成工程构建/测试产物目录', !existsSync(P + 'receipts/evidence/release-gate') , 'ok');

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
const report = { total: results.length, passed, failed: failed.length, results, repo_states: repoStates, memory: { files: sizes, max: maxSize, total: totalSize }, at: new Date().toISOString() };
writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');
for (const r of results) { console.log((r.ok ? 'PASS' : 'FAIL') + ' ' + r.id + ' :: ' + r.desc + (r.ok ? '' : ' >> ' + r.detail)); }
console.log('RESULT: ' + passed + '/' + results.length + (failed.length === 0 ? ' ALL CHECKS PASSED' : ' FAILED'));
process.exit(failed.length === 0 ? 0 : 1);
