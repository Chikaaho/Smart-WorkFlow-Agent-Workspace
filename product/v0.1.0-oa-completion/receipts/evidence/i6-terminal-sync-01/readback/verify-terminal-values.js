// Read-only terminal-value readback for the I6 stage-three terminal sync.
// Asserts every unique terminal value against the actual entry files; writes nothing
// except its own output log next to this script.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = 'E:/code/Smart-WorkFlow-Agent-Workspace';
const OUT = path.join(ROOT, 'product/v0.1.0-oa-completion/receipts/evidence/i6-terminal-sync-01/readback/terminal-values-readback.txt');

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

const ENTRIES = {
  currentStatus: 'knowledge/current-status.md',
  sessionHandoff: 'knowledge/session-handoff.md',
  featuresIndex: 'knowledge/features/v0.1.0-oa-completion.md',
  checklist: 'Smart-WorkFlow-aPaaS-server/功能清单.md',
  oaPlan: 'todo/v0.1.0-oa-plan.md',
  requirementPool: 'todo/requirement-pool.md',
  p60Direction: 'product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md',
  memoryState: 'memory/state.md',
  memoryFeatures: 'memory/features.md',
  memoryHandoff: 'memory/handoff.md',
};

const texts = {};
for (const [key, rel] of Object.entries(ENTRIES)) {
  try {
    texts[key] = read(rel);
  } catch (error) {
    check(`entry-exists:${rel}`, false, String(error.message));
  }
}

// 1. I6 stage status value in every entry
const I6_VALUE = 'COMPLETED（待规划确认，2026-09-15）';
for (const [key, rel] of Object.entries(ENTRIES)) {
  if (!texts[key]) continue;
  check(`i6-stage-status:${rel}`, texts[key].includes(I6_VALUE), I6_VALUE);
}

// 2. P60 stays IN_PROGRESS in every entry
for (const [key, rel] of Object.entries(ENTRIES)) {
  if (!texts[key]) continue;
  check(`p60-in-progress:${rel}`, /IN_PROGRESS/.test(texts[key]), 'P60 IN_PROGRESS');
}
check('p60-not-completed', !/P60[^\n]{0,12}COMPLETED（规划已确认/.test(texts.currentStatus), 'P60 must not be written as planner-confirmed');

// 3. I1—I5 planner-confirmed values retained
const CONFIRMED = [
  ['I1', '2026-09-09'],
  ['I2', '2026-09-10'],
  ['I3', '2026-09-12'],
  ['I4', '2026-09-13'],
  ['I5', '2026-09-14'],
];
for (const [stage, date] of CONFIRMED) {
  const needle = `COMPLETED（规划已确认，${date}）`;
  for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'memoryState', 'memoryFeatures', 'p60Direction']) {
    if (!texts[key]) continue;
    check(`stage-confirmed:${stage}:${ENTRIES[key]}`, texts[key].includes(needle), needle);
  }
}

// 4. I6 functional acceptance record + archived main direction + current entry
const I6_REVIEW = 'planning-review-stage-i6-notification-version-closure-07-owner-deferral-passed.md';
for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'requirementPool', 'memoryState', 'memoryFeatures', 'memoryHandoff', 'oaPlan']) {
  if (!texts[key]) continue;
  check(`i6-acceptance-record:${ENTRIES[key]}`, texts[key].includes(I6_REVIEW), I6_REVIEW);
}
check('i6-direction-archived-exists', exists('product/v0.1.0-oa-completion/passed/direction-stage-i6-notification-version-closure.md'));
check('i6-direction-old-path-absent', !exists('product/v0.1.0-oa-completion/ready/direction-stage-i6-notification-version-closure.md'));
check('i6-terminal-sync-direction-exists', exists('product/v0.1.0-oa-completion/ready/direction-stage-i6-terminal-sync.md'));
check('i6-terminal-sync-direction-not-in-passed', !exists('product/v0.1.0-oa-completion/passed/direction-stage-i6-terminal-sync.md'));

// 5. Counts, ADV, baseline, candidate identity
for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'memoryState', 'memoryFeatures']) {
  if (!texts[key]) continue;
  check(`count-90:${ENTRIES[key]}`, /✅46\s*\/\s*🟦22\s*\/\s*⬜22/.test(texts[key]), '✅46/🟦22/⬜22');
  check(`count-44:${ENTRIES[key]}`, /\b44\b/.test(texts[key]), '44 features');
  check(`adv-64:${ENTRIES[key]}`, /(ADV[^\n]{0,8}64|64[^\n]{0,8}ADV)/.test(texts[key]), 'ADV 64 条');
}
for (const key of ['currentStatus', 'sessionHandoff', 'checklist']) {
  if (!texts[key]) continue;
  check(`baseline-server-1361:${ENTRIES[key]}`, texts[key].includes('1361'), '1361 tests');
  check(`baseline-web-1185:${ENTRIES[key]}`, texts[key].includes('1185'), '1185 passed');
  check(`baseline-flyway-v92:${ENTRIES[key]}`, texts[key].includes('V92'), 'V92');
}
const R7_MANIFEST = '3942311b2d2712e490a011594102183ee2806abb11eefc46c0bb449ba16e716f';
for (const key of ['currentStatus', 'checklist', 'memoryState']) {
  if (!texts[key]) continue;
  check(`r7-manifest-sha:${ENTRIES[key]}`, texts[key].includes(R7_MANIFEST), R7_MANIFEST);
}
const manifestPath = 'product/v0.1.0-oa-completion/receipts/evidence/i6-06/R7-CONTENT-FINGERPRINT/fingerprint-manifest.json';
check('r7-manifest-file-exists', exists(manifestPath));
const crypto = require('crypto');
if (exists(manifestPath)) {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, manifestPath))).digest('hex');
  check('r7-manifest-sha-recomputed', digest === R7_MANIFEST, digest);
}
check('r7-sidecar-matches', exists('product/v0.1.0-oa-completion/receipts/evidence/i6-06/R7-CONTENT-FINGERPRINT/fingerprint-manifest.sha256') &&
  read('product/v0.1.0-oa-completion/receipts/evidence/i6-06/R7-CONTENT-FINGERPRINT/fingerprint-manifest.sha256').startsWith(R7_MANIFEST));

// 6. R8 exception semantics and P2 todo pointer
for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'requirementPool', 'memoryState', 'memoryHandoff', 'oaPlan', 'issues']) {
  const rel = key === 'issues' ? 'memory/issues.md' : ENTRIES[key];
  const text = key === 'issues' ? read(rel) : texts[key];
  if (!text) continue;
  check(`r8-deferred:${rel}`, /(Owner\s*延期|Owner延期)/.test(text) && /未验证/.test(text), 'Owner延期 / 未验证');
  const five = ['SMS', 'EMAIL', 'FEISHU', 'DINGTALK', 'WECHAT_WORK'];
  check(`r8-five-channels:${rel}`, five.every((channel) => text.includes(channel)), five.join(','));
  check(`r8-not-real-pass:${rel}`, !/五(外部|类)?(渠道|通知渠道)[^\n]{0,20}(真实通过|沙箱通过|外部联调完成)/.test(text), 'no real-pass wording');
}
check('p2-todo-exists', exists('todo/i6-external-notification-channels-real-verification.md'));
const p2Todo = read('todo/i6-external-notification-channels-real-verification.md');
check('p2-todo-priority', p2Todo.includes('P2') && p2Todo.includes('DEFERRED / UNVERIFIED'));
for (const key of ['currentStatus', 'requirementPool', 'memoryHandoff', 'oaPlan']) {
  if (!texts[key] && key !== 'requirementPool') continue;
  const text = texts[key];
  if (!text) continue;
  check(`p2-pointer:${ENTRIES[key]}`, text.includes('i6-external-notification-channels-real-verification.md'), 'pointer present');
}

// 7. Active feature, unique action, P numbering untouched
check('active-feature', texts.currentStatus.includes('v0.1.0-oa-completion'));
check('next-action', texts.currentStatus.includes('确认 I6 `COMPLETED` 后启动 P60 整体 14 条标准的独立复核'), 'P60 14-standard review next');
check('p-numbering', texts.requirementPool.includes('P60') && !/P60[^\n]{0,80}已核销/.test(texts.requirementPool), 'P60 not cleared');
check('known-issues-unchanged', read('knowledge/known-issues.md').includes('I1—I55'));

// 8. No tag / release claim
check('no-010-tag-file', !exists('release/0.1.0/.tag') && !exists('.git/refs/tags/v0.1.0'), 'no 0.1.0 tag marker');

// 9. memory size limits
const memoryFiles = fs.readdirSync(path.join(ROOT, 'memory')).filter((name) => name.endsWith('.md'));
let total = 0;
for (const name of memoryFiles) {
  const size = fs.statSync(path.join(ROOT, 'memory', name)).size;
  total += size;
  check(`memory-file-under-5kb:${name}`, size < 5120, `${size} bytes`);
}
check('memory-total-under-20kb', total < 20480, `${total} bytes`);

// 10. direction files carry the synced pointers
check('p60-direction-header', texts.p60Direction.includes('IN_PROGRESS'));
check('i6-archived-header', read('product/v0.1.0-oa-completion/passed/direction-stage-i6-notification-version-closure.md').includes(I6_VALUE));
check('i6-terminal-sync-header', read('product/v0.1.0-oa-completion/ready/direction-stage-i6-terminal-sync.md').includes(I6_VALUE));

const passed = results.filter((item) => item.ok).length;
const failed = results.filter((item) => !item.ok);
const lines = [
  `# I6 terminal value readback (${new Date().toISOString()})`,
  `root: ${ROOT}`,
  `assertions: ${results.length}  pass: ${passed}  fail: ${failed.length}`,
  '',
  ...results.filter((item) => !item.ok).map((item) => `FAIL ${item.name} | ${item.detail}`),
  '',
  ...results.map((item) => `${item.ok ? 'PASS' : 'FAIL'} ${item.name} | ${item.detail}`),
];
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`assertions=${results.length} pass=${passed} fail=${failed.length}`);
for (const item of failed) {
  console.log(`FAIL ${item.name} | ${item.detail}`);
}
process.exit(failed.length === 0 ? 0 : 1);
