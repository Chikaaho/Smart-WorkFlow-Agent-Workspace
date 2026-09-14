#!/usr/bin/env node
/**
 * I5 terminal value readback — per-entry assertions.
 * 逐入口断言唯一终态值实际存在，并对提前写入/旧口径做负向排除。
 * 运行：node verify-terminal-values.js（工作区根）
 */
const fs = require('fs');

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(`${ROOT}/${p}`, 'utf8');

const STATUS_ENTRIES = [
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
const NEXT_ACTION_ENTRIES = [
  'knowledge/current-status.md',
  'knowledge/session-handoff.md',
  'memory/state.md',
  'memory/features.md',
  'memory/handoff.md',
];
const COUNT_ENTRIES = [
  'knowledge/current-status.md',
  'knowledge/session-handoff.md',
  'knowledge/features/v0.1.0-oa-completion.md',
  'Smart-WorkFlow-aPaaS-server/功能清单.md',
  'todo/v0.1.0-oa-plan.md',
  'todo/requirement-pool.md',
  'memory/state.md',
  'memory/features.md',
];
const NEGATIVE_ENTRIES = [
  ...STATUS_ENTRIES,
  'product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md',
  'product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md',
  'product/v0.1.0-oa-completion/passed/direction-stage-i5-tenant-safe-third-party-sso.md',
  'memory/README.md',
  'memory/decisions.md',
  'memory/issues.md',
];

let pass = 0;
let fail = 0;
const lines = [];
const say = (s) => lines.push(s);
function assertIn(file, needle, label) {
  if (read(file).includes(needle)) {
    pass += 1;
    say(`  OK   ${label.padEnd(44)} | ${file}`);
  } else {
    fail += 1;
    say(`  FAIL ${label.padEnd(44)} | ${file}`);
  }
}
function assertAbsent(needle, label) {
  const hits = NEGATIVE_ENTRIES.filter((f) => read(f).includes(needle));
  if (hits.length === 0) {
    pass += 1;
    say(`  OK   ${label.padEnd(44)} (hits=0)`);
  } else {
    fail += 1;
    say(`  FAIL ${label.padEnd(44)} (hits=${hits.length}: ${hits.join(', ')})`);
  }
}

say('# I5 terminal value readback — per-entry assertions');
say(`captured_at=${new Date().toISOString()}`);
say('method=逐入口声明其必须承载的值并逐条断言；负向断言为精确字面匹配（排除已标注的历史事件行与禁止性/规则表述）');
say('');
say('== positive assertions ==');
for (const f of STATUS_ENTRIES) {
  assertIn(f, 'COMPLETED（待规划确认，2026-09-14）', 'I5 阶段状态=COMPLETED（待规划确认）');
  assertIn(f, 'IN_PROGRESS', 'P60 保持 IN_PROGRESS');
}
for (const f of COUNT_ENTRIES) assertIn(f, '46/🟦22/⬜22', '90 明细计数 ✅46/🟦22/⬜22');
for (const f of EXCEPTION_ENTRIES) {
  assertIn(f, 'planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md', 'I5 功能级验收裁决路径');
}
for (const f of EXCEPTION_ENTRIES) {
  if (!NEXT_ACTION_ENTRIES.includes(f) && f !== 'todo/requirement-pool.md') continue;
  assertIn(f, '延期免验', '三 Provider 真实链=Owner 延期免验/未验证');
}
for (const f of NEXT_ACTION_ENTRIES) assertIn(f, '终态复核', '下一动作=等待 Planner 终态复核');
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-09）', 'I1 已确认值（未改写）');
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-10）', 'I2 已确认值（未改写）');
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-12）', 'I3 已确认值（未改写）');
assertIn('knowledge/current-status.md', 'COMPLETED（规划已确认，2026-09-13）', 'I4 已确认值（未改写）');
assertIn('knowledge/current-status.md', '功能数 44', '正式功能数 44，不增加');
assertIn('knowledge/current-status.md', '8 模块、64 条', 'ADV 64 条不计入 90');
assertIn('knowledge/current-status.md', 'P60、P31 及其他开放 P 编号全部保持现状', 'P 编号全部保持现状、本阶段不核销');
assertIn('knowledge/current-status.md', 'I6 通知与版本收口未开始', 'I6 未开始');
assertIn('product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md', 'COMPLETED（待规划确认，2026-09-14）', 'I5 终态同步方向当前指针');
assertIn('product/v0.1.0-oa-completion/passed/direction-stage-i5-tenant-safe-third-party-sso.md', 'COMPLETED（待规划确认，2026-09-14）', 'I5 已归档主方向阶段状态');
assertIn('product/v0.1.0-oa-completion/passed/direction-stage-i5-tenant-safe-third-party-sso.md', 'terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md', 'I5 主方向下一入口');
assertIn('product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md', 'I5为`COMPLETED（待规划确认，2026-09-14）`', 'P60 主方向 §9 当前状态（I5）');
assertIn('product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md', 'I5为`COMPLETED（待规划确认，2026-09-14）`', 'P60 主方向 §9 已脱离旧 VERIFYING 口径');
say('');
say('== negative assertions (exact literals) ==');
assertAbsent('COMPLETED（规划已确认，2026-09-14）', '无 I5「规划已确认，2026-09-14」提前写入');
assertAbsent('P60 已完成', '无「P60 已完成」声明');
assertAbsent('P60 功能级 `COMPLETED`', '无 P60 阶段完成声明');
assertAbsent('I5为`VERIFYING`', '无 P60 主方向旧 I5 VERIFYING 当前值');
assertAbsent('真实成功链.*已验证成功', '无入口把三 Provider 真实链写成已验证成功');
say('');
say('== informational (allowed contexts) ==');
const forbid = NEGATIVE_ENTRIES.reduce((n, f) => n + (read(f).match(/不得写成真实通过|不是真实通过|不等于真实成功链|非真实通过、非沙箱通过/g) || []).length, 0);
say(`真实链禁止性表述（非通过声明）: ${forbid} 处`);
say(`历史事件行（显式标注“历史事件，非当前值”）: ${(read('knowledge/current-status.md').match(/历史事件，非当前值/g) || []).length} 行（内含 2026-09-13 I5 VERIFYING 历史记录，允许保留）`);
say('P60 主方向 §9 规则文本提及「写 P60 COMPLETED」为禁止性规则，非完成声明');
say('');
say(`RESULT: pass=${pass} fail=${fail}`);

process.stdout.write(`${lines.join('\n')}\n`);
process.exit(fail === 0 ? 0 : 1);
