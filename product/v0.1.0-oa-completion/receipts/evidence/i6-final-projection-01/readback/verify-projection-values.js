// Read-only readback for the I6 planner-confirmed state projection.
// Asserts the projected values, archive paths, counts and memory limits; writes only its own log.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = 'E:/code/Smart-WorkFlow-Agent-Workspace';
const OUT = path.join(
  ROOT,
  'product/v0.1.0-oa-completion/receipts/evidence/i6-final-projection-01/readback/projection-values-readback.txt',
);

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

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
  memoryReadme: 'memory/README.md',
  memoryIssues: 'memory/issues.md',
};
const texts = {};
for (const [key, rel] of Object.entries(ENTRIES)) {
  try {
    texts[key] = read(rel);
  } catch (error) {
    check(`entry-exists:${rel}`, false, String(error.message));
  }
}

// 1. I6 planner-confirmed value in every entry
const I6_CONFIRMED = 'COMPLETED（规划已确认，2026-09-15）';
for (const [key, rel] of Object.entries(ENTRIES)) {
  if (!texts[key]) continue;
  check(`i6-confirmed:${rel}`, texts[key].includes(I6_CONFIRMED), I6_CONFIRMED);
}
const I6_PASSED_MAIN = read('product/v0.1.0-oa-completion/passed/direction-stage-i6-notification-version-closure.md');
const I6_PASSED_SYNC = read('product/v0.1.0-oa-completion/passed/direction-stage-i6-terminal-sync.md');
check(
  'i6-confirmed:passed main direction',
  I6_PASSED_MAIN.includes(I6_CONFIRMED),
  I6_CONFIRMED,
);
check(
  'i6-confirmed:passed terminal-sync direction',
  I6_PASSED_SYNC.includes(I6_CONFIRMED),
  I6_CONFIRMED,
);

// 2. no live (current-state) occurrence of the pre-confirmation value
const STALE = 'COMPLETED（待规划确认，2026-09-15）';
for (const [key, rel] of Object.entries(ENTRIES)) {
  if (!texts[key]) continue;
  const offenders = texts[key]
    .split('\n')
    .filter((line) => line.includes(STALE))
    .filter((line) => !/变更类型记录/.test(line) && !/\*\*2026-09-15 I6 阶段三终态同步\*\*/.test(line));
  check(`no-live-stale-value:${rel}`, offenders.length === 0, offenders.length ? offenders[0].slice(0, 120) : 'only historical records');
}

// 3. archive state and current entry
check('i6-main-direction-archived', exists('product/v0.1.0-oa-completion/passed/direction-stage-i6-notification-version-closure.md'));
check('i6-terminal-sync-direction-archived', exists('product/v0.1.0-oa-completion/passed/direction-stage-i6-terminal-sync.md'));
check('i6-terminal-sync-direction-not-in-ready', !exists('product/v0.1.0-oa-completion/ready/direction-stage-i6-terminal-sync.md'));
check('projection-direction-in-ready', exists('product/v0.1.0-oa-completion/ready/direction-stage-i6-final-confirmed-state-projection.md'));
check('i6-final-review-passed-receipt', exists('product/v0.1.0-oa-completion/receipts/planning-final-review-terminal-sync-stage-i6-v0.0.3-oa-iteration-01-passed.md'));
check('i6-terminal-sync-receipt', exists('product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i6-v0.0.3-oa-iteration-01.md'));
const projectionReceipt = 'product/v0.1.0-oa-completion/receipts/final-state-projection-stage-i6-v0.0.3-oa-iteration-01.md';
check('projection-receipt-exists', exists(projectionReceipt));
if (exists(projectionReceipt)) {
  const text = read(projectionReceipt).replace(/\n+$/, '');
  const lastLine = text.split('\n').pop();
  check('projection-receipt-terminal-lastline', lastLine.startsWith('ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2"'), lastLine.slice(0, 60));
}
for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'oaPlan', 'requirementPool', 'memoryState', 'memoryHandoff']) {
  if (!texts[key]) continue;
  check(`current-entry:${ENTRIES[key]}`, texts[key].includes('direction-stage-i6-final-confirmed-state-projection.md'), 'projection direction is current entry');
}

// 4. P60 / counts / ADV / R8
for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'oaPlan', 'requirementPool', 'memoryState']) {
  if (!texts[key]) continue;
  check(`p60-in-progress:${ENTRIES[key]}`, texts[key].includes('IN_PROGRESS'), 'P60 IN_PROGRESS');
  check(`count-90:${ENTRIES[key]}`, /✅46\s*\/\s*🟦22\s*\/\s*⬜22/.test(texts[key]), '✅46/🟦22/⬜22');
  check(`count-44:${ENTRIES[key]}`, /\b44\b/.test(texts[key]), '44 features');
  check(`adv-64:${ENTRIES[key]}`, /(ADV[^\n]{0,8}64|64[^\n]{0,8}ADV)/.test(texts[key]), 'ADV 64');
}
check('p60-not-confirmed', !/P60[^\n]{0,12}COMPLETED（规划已确认/.test(texts.currentStatus), 'P60 must stay IN_PROGRESS');

// 5. R8 boundary wording
const five = ['SMS', 'EMAIL', 'FEISHU', 'DINGTALK', 'WECHAT_WORK'];
for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'requirementPool', 'memoryState', 'memoryHandoff', 'memoryIssues', 'oaPlan']) {
  if (!texts[key]) continue;
  check(`r8-deferred:${ENTRIES[key]}`, /(Owner\s*延期|Owner延期)/.test(texts[key]) && /未验证/.test(texts[key]), 'Owner延期 / 未验证');
  check(`r8-five-channels:${ENTRIES[key]}`, five.every((channel) => texts[key].includes(channel)), five.join(','));
  check(`r8-not-real-pass:${ENTRIES[key]}`, !/五(外部|类)?(渠道|通知渠道)[^\n]{0,20}(真实通过|沙箱通过|外部联调完成)/.test(texts[key]), 'no real-pass wording');
}
check('p2-todo-exists', exists('todo/i6-external-notification-channels-real-verification.md'));

// 6. next action
for (const key of ['currentStatus', 'sessionHandoff', 'featuresIndex', 'checklist', 'oaPlan', 'requirementPool', 'memoryState', 'memoryFeatures', 'memoryHandoff', 'memoryReadme']) {
  if (!texts[key]) continue;
  check(`next-action:${ENTRIES[key]}`, /P60\s*整体\s*14\s*条/.test(texts[key]), 'P60 整体 14 条复核');
}

// 7. locked baseline still referenced (not re-run)
for (const key of ['currentStatus', 'sessionHandoff', 'checklist']) {
  if (!texts[key]) continue;
  check(`baseline-server-1361:${ENTRIES[key]}`, texts[key].includes('1361'), '1361');
  check(`baseline-web-1185:${ENTRIES[key]}`, texts[key].includes('1185'), '1185');
  check(`baseline-flyway-v92:${ENTRIES[key]}`, texts[key].includes('V92'), 'V92');
}
const R7_MANIFEST = '3942311b2d2712e490a011594102183ee2806abb11eefc46c0bb449ba16e716f';
for (const key of ['currentStatus', 'checklist']) {
  if (!texts[key]) continue;
  check(`r7-manifest-sha:${ENTRIES[key]}`, texts[key].includes(R7_MANIFEST), R7_MANIFEST);
}
const crypto = require('crypto');
const manifestPath = 'product/v0.1.0-oa-completion/receipts/evidence/i6-06/R7-CONTENT-FINGERPRINT/fingerprint-manifest.json';
if (exists(manifestPath)) {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, manifestPath))).digest('hex');
  check('r7-manifest-sha-recomputed', digest === R7_MANIFEST, digest);
}

// 8. no 0.1.0 tag / release
check('no-010-tag-marker', !exists('release/0.1.0/.tag') && !exists('.git/refs/tags/v0.1.0'), 'no 0.1.0 tag');

// 9. memory limits
const memoryFiles = fs.readdirSync(path.join(ROOT, 'memory')).filter((name) => name.endsWith('.md'));
let total = 0;
for (const name of memoryFiles) {
  const size = fs.statSync(path.join(ROOT, 'memory', name)).size;
  total += size;
  check(`memory-file-under-5kb:${name}`, size < 5120, `${size} bytes`);
}
check('memory-total-under-20kb', total < 20480, `${total} bytes`);

const passed = results.filter((item) => item.ok).length;
const failed = results.filter((item) => !item.ok);
const lines = [
  `# I6 planner-confirmed projection readback (${new Date().toISOString()})`,
  `root: ${ROOT}`,
  `assertions: ${results.length}  pass: ${passed}  fail: ${failed.length}`,
  '',
  ...failed.map((item) => `FAIL ${item.name} | ${item.detail}`),
  '',
  ...results.map((item) => `${item.ok ? 'PASS' : 'FAIL'} ${item.name} | ${item.detail}`),
];
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`assertions=${results.length} pass=${passed} fail=${failed.length}`);
for (const item of failed) console.log(`FAIL ${item.name} | ${item.detail}`);
process.exit(failed.length === 0 ? 0 : 1);
