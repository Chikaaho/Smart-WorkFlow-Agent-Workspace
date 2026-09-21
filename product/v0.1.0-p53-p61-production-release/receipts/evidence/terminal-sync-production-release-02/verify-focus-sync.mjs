// TS-G1 定向断言：仅「当前焦点」行发生变化，新值齐全、旧值清零，且明细/计数/P-M-I 未被触及。
// 用法: node verify-focus-sync.mjs <server-repo> <before-snapshot> <assert-output.json>
import { readFileSync, writeFileSync } from 'node:fs';

const REPO = process.argv[2] || 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server';
const BEFORE = process.argv[3];
const OUT = process.argv[4];

const after = readFileSync(REPO + '/功能清单.md', 'utf8');
const before = readFileSync(BEFORE, 'utf8');
const A = after.split('\n');
const B = before.split('\n');
const results = [];
const check = (id, desc, ok, detail) => results.push({ id, desc, ok: !!ok, detail: detail === undefined ? '' : String(detail) });

check('L1-line-count', '行数与快照一致', A.length === B.length, 'before=' + B.length + ' after=' + A.length);
const diffIdx = [];
for (let i = 0; i < Math.max(A.length, B.length); i++) { if ((A[i] || '') !== (B[i] || '')) diffIdx.push(i + 1); }
check('L2-only-one-line-changed', '仅 1 行发生变化', diffIdx.length === 1, 'changed_lines=' + diffIdx.join(','));
check('L3-changed-line-is-focus', '变化行是「当前焦点」段', diffIdx.length === 1 && A[diffIdx[0] - 1].startsWith('> 当前焦点：'), 'line=' + diffIdx.join(','));
const changed = diffIdx.length === 1 ? A[diffIdx[0] - 1] : '';

const S_ID = 'd18e9a39c552918615be8b158dfe0cc278cb309f';
const W_ID = '039f987437ed6369c3c131631bd7622c6ae482e7';
const S_OLD = 'c15428f0002f6bb0ceeff05c7cbcf842bd3d3148';
const W_OLD = '963df360ed18bc1c604652a13edb2a7ed0be8963';
const newNeedles = [
  ['Server main/tag 新值', S_ID],
  ['Web main/tag 新值', W_ID],
  ['Server Release ID', '392753737'],
  ['Web Release ID', '392753751'],
  ['Server CI run', '35569219107'],
  ['Web CI run', '35569219967'],
  ['Server 门禁 1423', '**1423 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**'],
  ['Web 门禁 1217+3', '**1217 tests passed + 3 skipped**'],
  ['演示库 V93', '应用数据库 V93（0 failed）'],
  ['Owner 登录通过', 'Owner 登录通过'],
  ['发布任务状态', 'COMPLETED（待规划确认，2026-09-21）'],
  ['唯一下一动作', '等待 Owner 自行体验，发现问题另行立项']
];
for (const [name, needle] of newNeedles) { check('N-' + name, '新值存在：' + name, changed.includes(needle), needle); }

const oldNeedles = [
  ['旧 Server SHA', S_OLD],
  ['旧 Web SHA', W_OLD],
  ['旧 Server Actions', '34946504087'],
  ['旧 Web Actions', '34942666025'],
  ['旧 Server 门禁 1362', '1362'],
  ['旧 Web 门禁 1185', '1185']
];
for (const [name, needle] of oldNeedles) { check('O-' + name, '旧值已清零：' + name, !changed.includes(needle), needle); }

check('K-功能数45', '功能数 45 未被改动', changed.includes('功能数 **45**'), '');
check('K-清单计数', '清单 ✅46/🟦22/⬜22 未被改动', changed.includes('**✅46/🟦22/⬜22**'), '');
check('K-ADV64', 'ADV 64 条口径未变', changed.includes('64 条 ADV 高级能力以规划项登记'), '');
check('K-P53登记', 'P53 登记路径未变', changed.includes('knowledge/features/p53-global-ui-component-layout.md'), '');
check('K-历史段', '历史基线段仍在当前焦点行内保留', changed.includes('为历史记录，不作为当前值'), '');

const rows = after.split('\n').filter((l) => /^\| M\d\d-F\d\d-\d\d /.test(l));
check('K-90明细行数', 'M01—M10 明细行仍为 90 行', rows.length === 90, 'rows=' + rows.length);
const rowsBefore = before.split('\n').filter((l) => /^\| M\d\d-F\d\d-\d\d /.test(l));
check('K-90明细内容未变', '90 行明细逐行与快照一致', JSON.stringify(rows) === JSON.stringify(rowsBefore), 'identical=' + (JSON.stringify(rows) === JSON.stringify(rowsBefore)));

const passed = results.filter((r) => r.ok).length;
const report = { total: results.length, passed, failed: results.length - passed, changed_lines: diffIdx, before_bytes: Buffer.byteLength(before, 'utf8'), after_bytes: Buffer.byteLength(after, 'utf8'), results, at: new Date().toISOString() };
if (OUT) { writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8'); }
for (const r of results) { console.log((r.ok ? 'PASS' : 'FAIL') + ' ' + r.id + ' :: ' + r.desc + (r.ok ? '' : ' >> ' + r.detail)); }
console.log('RESULT: ' + passed + '/' + results.length + (passed === results.length ? ' ALL CHECKS PASSED' : ' FAILED'));
process.exit(passed === results.length ? 0 : 1);
