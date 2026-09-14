#!/usr/bin/env node
/**
 * TS5-PUBLISH step 5 — remote ref readback + ancestry containment + remote dual preservation.
 * 运行：node step5-containment.js（工作区根；需已 push）
 */
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const run = (cmd, cwd) => execSync(cmd, { cwd, encoding: 'utf8' }).trim();
const ROOT = process.cwd();
const out = [];
const say = (s) => out.push(s);

const SERVER = 'Smart-WorkFlow-aPaaS-server';
const WEB = 'Smart-WorkFlow-aPaaS-Web';
const serverCommits = ['aaafd74', '5e976b8', '4d98b67', '26961ca', 'eeb23f2', '4c7fc24'];
const webCommits = ['fc5f70b', '5788ead'];
const wsCommits = ['1075107', '4d702cb', '34b2cb8', 'ef1e8b3', '728c411', 'd531beb', 'eec171c', 'cef6029', '28dfc6d', '47fa269', 'eaab37a'];

say('# TS5-PUBLISH step 5 - ls-remote readback + ancestry containment + remote dual preservation');
say(`captured_at=${new Date().toISOString()}`);
say('');
say('== ls-remote (live remote refs) ==');
for (const [label, cwd, br] of [['Workspace', ROOT, 'develop-sw'], ['Server', `${ROOT}/${SERVER}`, 'develop'], ['Web', `${ROOT}/${WEB}`, 'develop']]) {
  const line = run(`git ls-remote origin ${br}`, cwd);
  say(`  ${label.padEnd(10)} ${line}`);
}
say('');
let fail = 0;
function ancestry(label, cwd, branch, commits) {
  say(`== ${label}: authorized commits contained in origin/${branch} ==`);
  for (const c of commits) {
    const sha = run(`git rev-parse ${c}`, cwd);
    let contained = true;
    try { execSync(`git merge-base --is-ancestor ${sha} origin/${branch}`, { cwd, stdio: 'pipe' }); } catch { contained = false; }
    if (!contained) fail += 1;
    const subject = run(`git log -1 --format=%s ${c}`, cwd);
    say(`  ${contained ? 'CONTAINED' : 'MISSING  '} ${c} (${sha})  ${subject}`);
  }
  say(`  remote=${run(`git rev-parse origin/${branch}`, cwd)}`);
  say(`  ahead_behind(HEAD...origin/${branch})=${run(`git rev-list --left-right --count HEAD...origin/${branch}`, cwd)}`);
  say('');
}
ancestry('Server', `${ROOT}/${SERVER}`, 'develop', serverCommits);
ancestry('Web', `${ROOT}/${WEB}`, 'develop', webCommits);
ancestry('Workspace', ROOT, 'develop-sw', wsCommits);

say('== Workspace dual preservation on the remote ref (origin/develop-sw blob) ==');
const blob = execSync('git show origin/develop-sw:todo/requirement-pool.md', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const checks = [
  ['remote P53 Figma 登记表行', /P53 \| 全局 UI 与组件布局优化 \| Owner 2026-08-30、2026-09-13 补充需求/],
  ['remote P53 Figma 插件边界', /后续使用 Figma 插件为本项目形成 UI 设计稿/],
  ['remote P53 参考图不上传边界', /参考图仅用于查看，不上传到 Figma、项目仓库或需求附件/],
  ['remote I5 终态值 COMPLETED（待规划确认，2026-09-14）', /I5=`COMPLETED（待规划确认，2026-09-14）`/],
  ['remote TS5-PUBLISH 入口指针', /planning-execution-prompt-terminal-sync-stage-i5-v0\.0\.3-oa-iteration-01/],
];
for (const [label, re] of checks) {
  const okk = re.test(blob);
  if (!okk) fail += 1;
  say(`  ${okk ? 'OK  ' : 'FAIL'} ${label}`);
}
say(`  sha256(remote blob)=${crypto.createHash('sha256').update(blob, 'utf8').digest('hex')}`);
say('');
say(`RESULT: fail=${fail}`);
process.stdout.write(`${out.join('\n')}\n`);
process.exit(fail === 0 ? 0 : 1);
