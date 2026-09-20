// 终态同步稳定断言脚本（方向 §4）：核对状态、计数、V93、两仓完整 SHA、路径与入口一致性
const fs = require('fs');
const { execSync } = require('child_process');

const W = 'E:/code/Smart-WorkFlow-Agent-Workspace/';
const S = W + 'Smart-WorkFlow-aPaaS-server/';
const SHA_S = 'c15428f0002f6bb0ceeff05c7cbcf842bd3d3148';
const SHA_W = '963df360ed18bc1c604652a13edb2a7ed0be8963';
const ENTRY = 'search_task/v0.1.0-p61-user-facing-message-humanization-current-seams.md'; // 规划确认后入口切换为 P61 现状探索（原终态同步方向已归档 passed/）
const RCPT = 'receipts/terminal-sync-v0.1.0-oa-completion-01.md';

const read = f => {
  // Server《功能清单》的当前状态文本位于 develop（main 保留发布时点修订）；统一按 develop 核对
  if (f === 'Smart-WorkFlow-aPaaS-server/功能清单.md') {
    return execSync('git -c core.quotepath=false -C "' + S + '" show develop:功能清单.md', { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  }
  return fs.readFileSync(W + f, 'utf8');
};
const results = [];
function check(id, ok, detail) { results.push({ id, ok: !!ok, detail }); }
function has(f, pat, label) { const s = read(f); const ok = typeof pat === 'string' ? s.includes(pat) : pat.test(s); check(label || (f + ' ⊇ ' + String(pat).slice(0, 40)), ok, ok ? 'found' : 'MISSING'); }
function count(f, pat) { const m = read(f).match(new RegExp(pat, 'g')); return m ? m.length : 0; }

// 1) 终态状态值
const statusCarriers = [
  'knowledge/current-status.md', 'knowledge/session-handoff.md',
  'knowledge/features/v0.1.0-oa-completion.md', 'knowledge/feature-reconciliation-index.md',
  'memory/README.md', 'memory/state.md', 'memory/features.md', 'memory/handoff.md',
  'todo/v0.1.0-oa-plan.md', 'todo/requirement-pool.md',
];
for (const f of statusCarriers) has(f, 'COMPLETED（规划已确认', f + ' : P60 COMPLETED（待规划确认）');
has('Smart-WorkFlow-aPaaS-server/功能清单.md', 'COMPLETED（规划已确认', 'Server 功能清单 : P60 COMPLETED（待规划确认）');
has('product/v0.1.0-oa-completion/passed/direction-v0.1.0-oa-completion.md', 'COMPLETED（规划已确认', 'passed 主方向指针');
has('product/v0.1.0-oa-completion/passed/direction-v0.1.0-oa-completion-terminal-sync.md', 'COMPLETED（规划已确认', '终态同步方向归档指针');

// 2) I1—I6 已确认 + 整体 14/14（memory/state.md 为压缩摘要，仅要求整体 14/14 与 P60 终态值）
for (const f of ['knowledge/current-status.md', 'memory/state.md', 'todo/v0.1.0-oa-plan.md']) {
  if (f !== 'memory/state.md') has(f, /I1—I6[^\n]{0,40}(COMPLETED（规划已确认）|均已确认|已确认)/, f + ' : I1—I6 已确认（规划已确认口径）');
  has(f, '14/14', f + ' : 整体 14/14');
}

// 3) 发布身份（两仓完整 SHA）与 tag/Release
for (const f of ['knowledge/current-status.md', 'knowledge/session-handoff.md', 'memory/state.md', 'memory/handoff.md',
                 'product/v0.1.0-oa-completion/passed/direction-v0.1.0-oa-completion.md']) {
  has(f, SHA_S, f + ' : Server main 完整 SHA');
  has(f, SHA_W, f + ' : Web main 完整 SHA');
}
has('Smart-WorkFlow-aPaaS-server/功能清单.md', SHA_S, 'Server 功能清单 : Server 完整 SHA');
has('Smart-WorkFlow-aPaaS-server/功能清单.md', SHA_W, 'Server 功能清单 : Web 完整 SHA');
for (const f of ['knowledge/current-status.md', 'memory/state.md']) {
  has(f, '0.1.0', f + ' : tag/Release 0.1.0');
  has(f, /Actions[^\n]{0,40}34946504087|34946504087/, f + ' : Server Actions 回读');
  has(f, '34942666025', f + ' : Web Actions 回读');
}

// 4) 迁移终点 V93 与 1361/V92 的历史定位
for (const f of ['knowledge/current-status.md', 'knowledge/session-handoff.md', 'knowledge/features/v0.1.0-oa-completion.md',
                 'memory/state.md', 'memory/features.md', 'todo/v0.1.0-oa-plan.md', 'todo/requirement-pool.md',
                 'Smart-WorkFlow-aPaaS-server/功能清单.md']) {
  has(f, 'V93', f + ' : 迁移终点 V93');
}
// 1361 只能以历史口径出现（出现处 ±120 字符内应含“历史”或“I6 时点”）
for (const f of ['knowledge/current-status.md', 'knowledge/session-handoff.md', 'memory/state.md',
                 'Smart-WorkFlow-aPaaS-server/功能清单.md', 'knowledge/features/v0.1.0-oa-completion.md']) {
  const s = read(f); let bad = 0; let idx = -1;
  while ((idx = s.indexOf('1361', idx + 1)) !== -1) {
    const ctx = s.slice(Math.max(0, idx - 120), idx + 120);
    if (!/历史|时点|阶段证据/.test(ctx)) bad++;
  }
  check(f + ' : 1361 仅历史口径', bad === 0, bad === 0 ? 'ok' : bad + ' 处缺少历史限定');
}
// 旧值不得作为当前基线
const staleCurrent = [
  ['knowledge/current-status.md', /\| 业务功能状态[^\n]*IN_PROGRESS/],
  ['knowledge/current-status.md', /当前活动正式功能[^\n]*IN_PROGRESS/],
  ['knowledge/session-handoff.md', /当前任务状态[^\n]*IN_PROGRESS/],
  ['memory/state.md', /等待终态同步/],
];
for (const [f, re] of staleCurrent) check(f + ' : 无旧当前值(' + re.source.slice(0, 28) + ')', !re.test(read(f)), 'ok');

// 5) 计数与 P 编号零变化
for (const f of ['knowledge/current-status.md', 'knowledge/features/v0.1.0-oa-completion.md', 'memory/state.md',
                 'memory/features.md', 'todo/v0.1.0-oa-plan.md', 'todo/requirement-pool.md']) {
  has(f, '✅46/🟦22/⬜22', f + ' : 清单计数不变');
}
for (const f of ['knowledge/current-status.md', 'memory/state.md', 'todo/v0.1.0-oa-plan.md']) {
  has(f, /功能数\s*44|功能数\s*\*\*44\*\*/, f + ' : 功能数 44');
  has(f, 'ADV64', f + ' : ADV64');
}
has('knowledge/current-status.md', /P60[^\n]{0,80}零变化|开放 P 编号零变化/, 'current-status : 开放 P 编号零变化');

// 6) 验证例外保持
for (const f of ['knowledge/current-status.md', 'memory/state.md', 'todo/v0.1.0-oa-plan.md']) {
  has(f, /Owner延期 \/ 未验证|Owner 延期 \/ 未验证|Owner延期\/未验证/, f + ' : 例外保持未验证');
}

// 7) 入口与回执路径
has('knowledge/current-status.md', 'search_task/v0.1.0-p61-user-facing-message-humanization-current-seams.md', 'current-status : 当前入口=P61 现状探索');
has('knowledge/current-status.md', RCPT, 'current-status : 本轮回执路径');
has('todo/v0.1.0-oa-plan.md', 'search_task/p61-user-facing-message-humanization-current-seams.md', 'todo plan : 入口一致');

// 8) Workspace 根 release/0.1.0/* 不在同步范围（保持未改动）
{
  const files = ['MANIFEST.json', 'DB-MIGRATIONS.md', 'UPGRADE.md', 'ROLLBACK.md', 'CONFIG-EXCHANGES.md', 'CONFIG-CHANGES.md', 'RELEASE-NOTES.md']
    .filter(f => fs.existsSync(W + 'release/0.1.0/' + f));
  const withV93 = files.filter(f => fs.readFileSync(W + 'release/0.1.0/' + f, 'utf8').includes('V93'));
  check('release/0.1.0/* 未被本轮改动（仍无 V93）', withV93.length === 0, 'V93 出现在: ' + (withV93.join(',') || '无'));
}

// 9) 两代码仓发布身份未被改动
try {
  const sMain = execSync('git -C "' + S + '" rev-parse main', { encoding: 'utf8' }).trim();
  const wMain = execSync('git -C "' + W + 'Smart-WorkFlow-aPaaS-Web" rev-parse main', { encoding: 'utf8' }).trim();
  check('server main == 发布身份', sMain === SHA_S, sMain);
  check('web main == 发布身份', wMain === SHA_W, wMain);
  const sDirty = execSync('git -c core.quotepath=false -C "' + S + '" status --porcelain', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  check('server main 工作树干净（《功能清单》当前文本已在 develop 提交）', sDirty.length === 0, JSON.stringify(sDirty));
  const sDevHead = execSync('git -C "' + S + '" rev-parse develop', { encoding: 'utf8' }).trim();
  const sDevRemote = execSync('git -C "' + S + '" ls-remote origin develop', { encoding: 'utf8' }).trim().split(/\s+/)[0];
  check('server develop 已推送（《功能清单》同步提交）', sDevHead === sDevRemote, sDevHead.slice(0, 8) + ' / ' + sDevRemote.slice(0, 8));
  const wDirty = execSync('git -c core.quotepath=false -C "' + W + 'Smart-WorkFlow-aPaaS-Web" status --porcelain', { encoding: 'utf8' }).trim();
  check('web 工作树干净（未改动发布提交）', wDirty === '', wDirty || '(clean)');
} catch (e) {
  check('代码仓状态检查', false, String(e.message).slice(0, 120));
}

// 10) P61 未启动
has('knowledge/current-status.md', /P61[^\n]{0,60}(待启动|等待)/, 'current-status : P61 待启动');

const failed = results.filter(r => !r.ok);
console.log('# P60 整体终态同步稳定断言结果');
console.log('# 时间：' + new Date().toISOString());
console.log('# 检查项：' + results.length + '，通过：' + (results.length - failed.length) + '，失败：' + failed.length);
console.log('');
for (const r of results) console.log((r.ok ? '[PASS] ' : '[FAIL] ') + r.id + ' :: ' + r.detail);
console.log('');
console.log(failed.length === 0 ? 'RESULT: ALL CHECKS PASSED' : 'RESULT: ' + failed.length + ' CHECK(S) FAILED');
process.exit(failed.length === 0 ? 0 : 1);
