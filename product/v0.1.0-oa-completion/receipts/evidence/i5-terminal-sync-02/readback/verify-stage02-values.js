#!/usr/bin/env node
/**
 * I5 TS5-PUBLISH (terminal-sync iteration-02) — value + stage-pointer assertions.
 * 断言唯一授权终态值保持成立，并确认当前入口已前移到 TS5-PUBLISH 提示 01。
 * 运行：node verify-stage02-values.js（工作区根）
 */
const fs = require('fs');
const ROOT = process.cwd();
const read = (p) => fs.readFileSync(`${ROOT}/${p}`, 'utf8');

const VALUE_ENTRIES = [
  'knowledge/current-status.md',
  'knowledge/session-handoff.md',
  'knowledge/features/v0.1.0-oa-completion.md',
  'Smart-WorkFlow-aPaaS-server/功能清单.md',
  'todo/v0.1.0-oa-plan.md',
  'todo/requirement-pool.md',
  'memory/state.md',
  'memory/features.md',
  'memory/handoff.md',
];
const EXCEPTION_ENTRIES = [
  'knowledge/current-status.md',
  'knowledge/session-handoff.md',
  'knowledge/features/v0.1.0-oa-completion.md',
  'memory/state.md',
  'memory/features.md',
  'memory/handoff.md',
  'todo/requirement-pool.md',
];
const STAGE_ENTRIES = [
  'memory/state.md',
  'memory/handoff.md',
  'memory/features.md',
  'todo/requirement-pool.md',
  'product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md',
];

let pass = 0;
let fail = 0;
const out = [];
const say = (s) => out.push(s);
function ok(cond, label, file) {
  if (cond) { pass += 1; say(`  OK   ${label.padEnd(44)}${file ? ` | ${file}` : ''}`); }
  else { fail += 1; say(`  FAIL ${label.padEnd(44)}${file ? ` | ${file}` : ''}`); }
}
const assertIn = (f, needle, label) => ok(read(f).includes(needle), label, f);

say('# I5 TS5-PUBLISH (iteration-02) — value + stage-pointer assertions');
say(`captured_at=${new Date().toISOString()}`);
say('');
say('== authorized terminal values (must still hold) ==');
for (const f of VALUE_ENTRIES) {
  assertIn(f, 'COMPLETED（待规划确认，2026-09-14）', 'I5 阶段状态=COMPLETED（待规划确认）');
  assertIn(f, 'IN_PROGRESS', 'P60 保持 IN_PROGRESS');
}
for (const f of EXCEPTION_ENTRIES) {
  assertIn(f, 'planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md', 'I5 功能级验收裁决路径');
}
for (const f of ['knowledge/current-status.md', 'memory/state.md', 'memory/handoff.md', 'todo/requirement-pool.md']) {
  assertIn(f, '延期免验', '三 Provider 真实链=Owner 延期免验/未验证');
}
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-09）', 'I1 已确认值');
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-10）', 'I2 已确认值');
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-12）', 'I3 已确认值');
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-13）', 'I4 已确认值');
assertIn('knowledge/current-status.md', '功能数 44', '正式功能数 44，不增加');
assertIn('knowledge/current-status.md', '46/🟦22/⬜22', '90 明细计数 ✅46/🟦22/⬜22');
assertIn('knowledge/current-status.md', '8 模块、64 条', 'ADV 64 条不计入 90');
assertIn('knowledge/current-status.md', 'I6 通知与版本收口未开始', 'I6 未开始');
assertIn('Smart-WorkFlow-aPaaS-server/功能清单.md', '46/🟦22/⬜22', '工程功能清单 90 计数不变');
assertIn('todo/v0.1.0-oa-plan.md', '46/🟦22/⬜22', 'todo 计划 90 计数不变');
say('');
say('== stage pointers advanced to TS5-PUBLISH ==');
for (const f of STAGE_ENTRIES) {
  assertIn(f, 'planning-execution-prompt-terminal-sync-stage-i5-v0.0.3-oa-iteration-01', '当前入口=发布收尾提示 01');
}
assertIn('todo/requirement-pool.md', 'terminal-sync-stage-i5-v0.0.3-oa-iteration-02.md', '下一回执=iteration-02');
assertIn('product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md', 'terminal-sync-stage-i5-v0.0.3-oa-iteration-02.md', '终态同步方向指向 iteration-02');
assertIn('product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md', '禁止rebase、强推、历史改写', '方向记录 Owner 授权与禁止事项');
say('');
say('== negative assertions (exact literals, current-value entries) ==');
const NEG_ENTRIES = [...VALUE_ENTRIES, 'product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md', 'product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md', 'product/v0.1.0-oa-completion/passed/direction-stage-i5-tenant-safe-third-party-sso.md'];
const neg = (needle, label) => {
  const hits = NEG_ENTRIES.filter((f) => read(f).includes(needle));
  ok(hits.length === 0, label, hits.length ? hits.join(',') : 'hits=0');
};
neg('COMPLETED（规划已确认，2026-09-14）', '无 I5「规划已确认，2026-09-14」提前写入');
neg('P60 已完成', '无「P60 已完成」声明');
neg('I5为`VERIFYING`', '无旧 I5 VERIFYING 当前值');
neg('真实成功链.*已验证成功', '无三 Provider 真实链已验证成功声明');
say('');
say('== memory budget ==');
const memFiles = fs.readdirSync(`${ROOT}/memory`).filter((f) => f.endsWith('.md'));
const sizes = memFiles.map((f) => [f, fs.statSync(`${ROOT}/memory/${f}`).size]);
const total = sizes.reduce((n, [, s]) => n + s, 0);
const max = sizes.reduce((m, [, s]) => Math.max(m, s), 0);
say(`  files=${memFiles.length} total=${total} bytes (<20480 required)  max_file=${max} bytes (<5120 required)`);
ok(total < 20480, 'memory 总量 <20KB');
ok(max < 5120, 'memory 单文件 <5KB');
say('');
say(`RESULT: pass=${pass} fail=${fail}`);
process.stdout.write(`${out.join('\n')}\n`);
process.exit(fail === 0 ? 0 : 1);
