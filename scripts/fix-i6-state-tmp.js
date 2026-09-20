const fs = require('fs');
const W = 'E:/code/Smart-WorkFlow-Agent-Workspace/';
// 1. current-status line 17 repair
let p = W + 'knowledge/current-status.md';
const lines = fs.readFileSync(p, 'utf8').split('\n');
const clean17 = '| 后端正式基线 | I6 锁定：独立 compile 门 exit 0 ＋ 全仓 **1357 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain H2 15 / PG 12 终点 **V90**、I5 三个 Boot 测试真实 PG·H2·Redis 行为链回归通过、I6 补证证据 15/0、G7 升级演练 1/0）；I5 候选工作树 `486b1116…` 保持 I5 时点记录；I6 本地候选 HEAD：Server `a687f60`、Web `a786825`（均已本地提交，未推送） |';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('| 后端正式基线 |')) { lines[i] = clean17; break; }
}
fs.writeFileSync(p, lines.join('\n'));
// 2. memory/state.md I6 line
let m = W + 'memory/state.md';
let s = fs.readFileSync(m, 'utf8');
s = s.split('\u6055').join('\u6055'); // noop
const marker = 'I6';
s = s.replace(/I6[^。\n]*/g, function (first) {
  if (/I6.*VERIFYING/.test(first)) {
    return 'I6=VERIFYING（补证回执02 `EXECUTION_SUBMITTED`：G1/G2/G3/G7/G9 真实行为证据闭合；G4 浏览器/G5 五渠道/G8 候选固定与多身份全场景保持 VERIFYING；Server 1357/0/0/0、Web 1185+3、Flyway V90；三仓提交均未推送）';
  }
  return first;
});
fs.writeFileSync(m, s);
console.log('OK');
