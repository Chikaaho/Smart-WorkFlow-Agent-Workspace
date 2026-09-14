const fs = require('fs');
const p = 'todo/requirement-pool.md';
const s = fs.readFileSync(p, 'utf8');
const checks = [
  ['远端 P53 登记：P53 表行含 Figma 设计边界', /P53 \| 全局 UI 与组件布局优化 \| Owner 2026-08-30、2026-09-13 补充需求/],
  ['远端 P53 登记：Figma 插件形成 UI 设计稿边界', /后续使用 Figma 插件为本项目形成 UI 设计稿/],
  ['远端 P53 登记：参考图不上传边界', /参考图仅用于查看，不上传到 Figma、项目仓库或需求附件/],
  ['本地 I5：当前规划段 I5=COMPLETED（待规划确认，2026-09-14）', /I5=`COMPLETED（待规划确认，2026-09-14）`/],
  ['本地 I5：终态同步回执 01 链接', /terminal-sync-stage-i5-v0\.0\.3-oa-iteration-01\.md/],
  ['本地 I5：当前入口=TS5-PUBLISH 提示 01', /planning-execution-prompt-terminal-sync-stage-i5-v0\.0\.3-oa-iteration-01\.md/],
  ['本地 I5：P60 行 I5 状态', /I5=`COMPLETED（待规划确认，2026-09-14）`.*I6未开始/s],
  ['本地 I5：P60 统筹不提前核销', /统筹既有开放OA编号但不替代或提前核销/],
];
let fail = 0;
for (const [label, re] of checks) {
  const ok = re.test(s);
  if (!ok) fail += 1;
  console.log(`${ok ? '  OK  ' : '  FAIL'} ${label}`);
}
console.log(`\nfigma_hits=${(s.match(/Figma/g) || []).length}  i5_20260914_hits=${(s.match(/COMPLETED（待规划确认，2026-09-14）/g) || []).length}`);
console.log(`RESULT: fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
