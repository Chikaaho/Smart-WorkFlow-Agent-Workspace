// 0.1.0 P53/P61 演示环境发布阶段三终态同步 —— 机械同步脚本
// 用法: node apply-sync.mjs <workspace> <evidence-dir>
// 规则: 每处替换必须在该文件内唯一命中（count === 1），任一处不唯一则整体不写入。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const WS = (process.argv[2] || 'E:/code/Smart-WorkFlow-Agent-Workspace').replace(/\\/g, '/');
const EV = (process.argv[3] || (WS + '/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-01')).replace(/\\/g, '/');

const S_ID = 'd18e9a39c552918615be8b158dfe0cc278cb309f';
const W_ID = '039f987437ed6369c3c131631bd7622c6ae482e7';
const S_REL = '392753737';
const W_REL = '392753751';
const S_CI = '35569219107';
const W_CI = '35569219967';
const S_OLD = 'c15428f0002f6bb0ceeff05c7cbcf842bd3d3148';
const W_OLD = '963df360ed18bc1c604652a13edb2a7ed0be8963';
const RCPT = 'product/v0.1.0-p53-p61-production-release/receipts/terminal-sync-production-release-01.md';
const DIRS = 'product/v0.1.0-p53-p61-production-release/ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md';

const edits = [];

// ---------- knowledge/current-status.md ----------
edits.push({
  id: 'CS-01-header',
  file: 'knowledge/current-status.md',
  find: '> 唯一当前快照；截至/同步点：2026-09-21。',
  replace: '> 唯一当前快照；截至/同步点：2026-09-21。**0.1.0 P53/P61 演示环境正式发布（XL）功能级 `PASSED（2026-09-21）`**（最终裁决 `product/v0.1.0-p53-p61-production-release/receipts/planning-final-review-production-release-02-passed.md`）：两仓 `develop` 以普通合并进入 `main` 并推送，annotated tag 与公开 Release `0.1.0` 于合并后 main 重建——Server main/tag `' + S_ID + '`（公开 Release ID `' + S_REL + '`，main CI run `' + S_CI + '` success）、Web main/tag `' + W_ID + '`（公开 Release ID `' + W_REL + '`，main CI run `' + W_CI + '` success）；演示环境部署上述 CI 制品，本项目应用数据库全新迁移至 **V93**（0 failed），`/sw/` 与 `/sw-server/api/actuator/health` 均 200，Owner 登录验证通过；C1 临时敏感资产已删除并回读不存在。本轮为阶段三终态同步（方向 `' + DIRS + '`，回执 `' + RCPT + '`）：发布任务状态机械写为 `COMPLETED（待规划确认，2026-09-21）`，本发布任务不新增/核销 P 编号、不改变功能数与清单计数。'
});

edits.push({
  id: 'CS-02-server-baseline',
  file: 'knowledge/current-status.md',
  find: '0.1.0 最终门禁（终态同步轮只同步引用、不重跑）：独立 compile 门 exit 0 ＋ 全仓 **1362 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain H2 15 / PG 12 终点 **V93**、I5 三个 Boot 测试真实 PG·H2·Redis 行为链回归通过、I6 补证证据 15/0、G7 升级演练 1/0）；0.1.0 发布身份：Server main `' + S_OLD + '`（annotated tag/Release `0.1.0`，Actions 34946504087 成功，自动产物 `bootstrap.jar`）；I6 时点 1361/V92 与 I5 候选工作树 `486b1116…` 只作历史阶段证据',
  replace: '0.1.0 发布门禁（2026-09-21 发布轮实跑，终态同步轮只同步引用、不重跑）：`MAVEN_OPTS=-Xmx2g mvn -B test` exit 0 ＋ 全仓 **1423 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain H2 15 / PG 12 终点 **V93**、I5 三个 Boot 测试真实 PG·H2·Redis 行为链回归通过、I6 补证证据 15/0、G7 升级演练 1/0）；0.1.0 发布身份：Server main/tag `' + S_ID + '`（annotated tag/Release `0.1.0` 重建于该 main，公开 Release ID `' + S_REL + '`，main CI run `' + S_CI + '` success，CI 自动产物 `bootstrap.jar` sha256 `cce9efbe…24e0`）；2026-09-15 首次发布值（`' + S_OLD + '`、1362/0/0/0、Actions 34946504087）与 I6 时点 1361/V92、I5 候选工作树 `486b1116…` 只作历史阶段证据'
});

edits.push({
  id: 'CS-03-web-baseline',
  file: 'knowledge/current-status.md',
  find: '0.1.0 最终门禁（终态同步轮只同步引用、不重跑）：typecheck/lint/test/build 四门 exit 0（**128 files、1185 passed + 3 skipped**）；0.1.0 发布身份：Web main `' + W_OLD + '`（annotated tag/Release `0.1.0`，Actions 34942666025 成功，自动产物 `dist-963df36….zip`）',
  replace: '0.1.0 发布门禁（2026-09-21 发布轮实跑，终态同步轮只同步引用、不重跑）：typecheck/lint/test/build 四门 exit 0（**134 files passed + 1 skipped；1217 tests passed + 3 skipped**）；0.1.0 发布身份：Web main/tag `' + W_ID + '`（annotated tag/Release `0.1.0` 重建于该 main，公开 Release ID `' + W_REL + '`，main CI run `' + W_CI + '` success，CI 自动产物 `dist-039f987….zip` sha256 `17814747…9beb`）；2026-09-15 首次发布值（`' + W_OLD + '`、128 files、1185 passed + 3 skipped、Actions 34942666025）只作历史阶段证据'
});

edits.push({
  id: 'CS-04-migration-baseline',
  file: 'knowledge/current-status.md',
  find: 'devseed H2 V900—V903 仅 dev 装载；`sw-bootstrap` FlywayFullChain H2 15 条 / PostgreSQL 12 条） |',
  replace: 'devseed H2 V900—V903 仅 dev 装载；`sw-bootstrap` FlywayFullChain H2 15 条 / PostgreSQL 12 条）；2026-09-21 发布轮以正式迁移链在演示环境重建本项目应用数据库至 **V93**（V1→V93，0 failed，未载入 devseed V900—V903），迁移身份不变 |'
});

edits.push({
  id: 'CS-05-baseline-set',
  file: 'knowledge/current-status.md',
  find: '0.1.0 最终值为 Server 1362/0/0/0、Web 1185+3、迁移终点 V93；',
  replace: '2026-09-15 首次发布时值为 Server 1362/0/0/0、Web 1185+3、迁移终点 V93；**0.1.0 P53/P61 发布验证基线集合（2026-09-21 发布轮实跑，只证明本次发布）：Server `MAVEN_OPTS=-Xmx2g mvn -B test` exit 0 ＋ 全仓 **1423 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain 终点 V93）；Web typecheck/lint/test/build 四门 exit 0（**1217 passed + 3 skipped**）；两仓 main CI success（Server `' + S_CI + '`／Web `' + W_CI + '`）；演示环境应用数据库 V93（0 failed）；Owner 登录通过**；'
});

edits.push({
  id: 'CS-06-change-log',
  file: 'knowledge/current-status.md',
  find: '| 变更类型记录（历史事件，非当前值） | 2026-09-21 P53 规划最终确认与 P53/P61 统一集成',
  replace: '| 变更类型记录（历史事件，非当前值） | 2026-09-21 0.1.0 P53/P61 演示环境发布与阶段三终态同步（Owner 授权「推送发布并测试验收」；方向 `product/v0.1.0-p53-p61-production-release/passed/direction-v0.1.0-p53-p61-production-release.md`；回执 `receipts/production-release-01.md`、`receipts/production-release-cleanup-02.md`，最终裁决 `receipts/planning-final-review-production-release-02-passed.md` PASSED；本轮同步回执 `' + RCPT + '`，`TERMINAL_SYNC_SUBMITTED`）：两仓 develop 普通合并至 main 并推送（Server `' + S_OLD + '…→' + S_ID + '`、Web `963df36…→' + W_ID + '`），main CI success 并生成 CI 资产（Server jar sha256 `cce9efbe…24e0`、Web dist sha256 `17814747…9beb`），旧 `0.1.0` tag/Release 按授权删除并在合并后 main 重建（公开 Release ID `' + S_REL + '`／`' + W_REL + '`）；演示环境部署 CI 制品、本项目应用数据库重建至 V93（0 failed）、Owner 登录验证通过；C1 临时敏感资产清理并回读不存在。发布任务状态写为 `COMPLETED（待规划确认，2026-09-21）`；功能数 45、90 明细 ✅46/🟦22/⬜22、ADV64 与开放 P 编号零变化；本轮未重复发布/部署/建库、未运行测试/构建/浏览器验收、未执行任何 Git 写动作。2026-09-21 P53 规划最终确认与 P53/P61 统一集成'
});

edits.push({
  id: 'CS-07-active-feature',
  file: 'knowledge/current-status.md',
  find: '；独立提交 Server `742adb8` / Web `d110ed8` 先保留，P53 结束后统一合并** |',
  replace: '；独立提交 Server `742adb8` / Web `d110ed8` 已随 P53 于 2026-09-21 统一合入两仓 develop 并推送**；**0.1.0 P53/P61 演示环境正式发布（XL）功能级 `PASSED（2026-09-21）`、发布任务状态 `COMPLETED（待规划确认，2026-09-21）`**（发布为非业务功能任务，不增加业务功能数；当前无活动正式功能） |'
});

edits.push({
  id: 'CS-08-active-task',
  file: 'knowledge/current-status.md',
  find: '| 当前活动交付任务 | P53 阶段三终态同步（方向 ',
  replace: '| 当前活动交付任务 | 0.1.0 P53/P61 演示环境发布阶段三终态同步（方向 `' + DIRS + '`；回执 `' + RCPT + '`，机器 `TERMINAL_SYNC_SUBMITTED`；发布任务状态 `COMPLETED（待规划确认，2026-09-21）`，方向保持 `ready/` 待 Planner 复核）；P53 阶段三终态同步（方向 '
});

edits.push({
  id: 'CS-09-recent-review',
  file: 'knowledge/current-status.md',
  find: '| 最近审查 | `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md`',
  replace: '| 最近审查 | `product/v0.1.0-p53-p61-production-release/receipts/planning-final-review-production-release-02-passed.md`（0.1.0 P53/P61 发布最终审查 02 **PASSED**：锁定两仓 main/tag/Release、CI 资产、演示库 V93、Owner 登录与 C1 清理，2026-09-21） \| `product/v0.1.0-p53-p61-production-release/receipts/planning-review-production-release-01-verifying.md`（发布审查 01：发布行为通过并锁定，C1 临时资产清理待补，2026-09-21） \| `product/v0.1.0-p53-p61-production-release/receipts/planning-review-production-release-readiness-01.md`（发布就绪审查 01，2026-09-21） \| `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md`'
});

edits.push({
  id: 'CS-10-next-action',
  file: 'knowledge/current-status.md',
  find: '**无待执行方向：P53 已经规划最终复核 01 PASSED 确认 `COMPLETED（规划已确认，2026-09-21）` 并核销（第 45 个正式功能），主方向与阶段三方向均归档 `passed/`；P53/P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web develop `fc37608`、Server develop `fa96290`），受影响检查通过（Web 四连全绿＋locale 八值 8/8；Server compile exit 0＋聚焦测试 35/0/0/0）。** P61 已最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，独立提交 Server `742adb8` / Web `d110ed8` 已随合并进入 develop。P60 整体 14/14 已通过并完成两仓 0.1.0 发布（Server main `' + S_OLD + '`、Web main `' + W_OLD + '`，tag/Release `0.1.0`），发布身份未改动、不得重复发布。R8 五外部渠道真实链保持 `Owner延期 / 未验证`（P2 待办 `todo/i6-external-notification-channels-real-verification.md`）。功能数 45、清单 ✅46/🟦22/⬜22、ADV64 与开放 P 编号零变化；等待 Owner/Planner 下发下一轮任务。',
  replace: '**等待 Owner 自行体验：0.1.0 P53/P61 演示环境发布已经规划最终审查 02 PASSED，两仓 main/tag/公开 Release、CI 资产、演示环境 V93 与 Owner 登录全部锁定；本文件已按阶段三终态同步方向 `' + DIRS + '` 的唯一终态值清单机械同步（发布任务状态 `COMPLETED（待规划确认，2026-09-21）`，方向保持 `ready/` 待 Planner 复核）。** Owner 自行体验演示环境；发现问题时另行立项，否则等待下一轮任务（0.1.0 发布身份锁定，不得重复发布、不得移动或重建 main/tag/Release）。P53 已经规划最终复核 01 PASSED 确认 `COMPLETED（规划已确认，2026-09-21）` 并核销（第 45 个正式功能）；P61 已最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，独立提交 Server `742adb8` / Web `d110ed8` 已随 P53 合入两仓 develop 并推送（Web develop `fc37608`、Server develop `fa96290`）。R8 五外部渠道真实链保持 `Owner延期 / 未验证`（P2 待办 `todo/i6-external-notification-channels-real-verification.md`）。功能数 45、清单 ✅46/🟦22/⬜22、ADV64 与开放 P 编号零变化。'
});

edits.push({
  id: 'CS-11-entry-list',
  file: 'knowledge/current-status.md',
  find: '- R8 五外部通知渠道真实验证待办（P2，Owner 延期/未验证，等待外部条件）：`todo/i6-external-notification-channels-real-verification.md`',
  replace: '- R8 五外部通知渠道真实验证待办（P2，Owner 延期/未验证，等待外部条件）：`todo/i6-external-notification-channels-real-verification.md`\n- 0.1.0 P53/P61 演示环境发布（非业务功能任务）：`product/v0.1.0-p53-p61-production-release/`（主方向已归档 `passed/direction-v0.1.0-p53-p61-production-release.md`；阶段三终态同步方向保持 `ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md` 待 Planner 复核；回执 `receipts/production-release-01.md`、`receipts/production-release-cleanup-02.md`、`receipts/terminal-sync-production-release-01.md`；发布门禁原始日志 `receipts/evidence/production-release-01/`；发布任务不新增/核销 P 编号、不改变功能数与清单计数）'
});

edits.push({
  id: 'CS-12-prompt-last-round',
  file: 'knowledge/current-status.md',
  find: '- 上轮完成：**P53 规划最终确认与 P61/P53 统一集成推送**',
  replace: '- 上轮完成：**0.1.0 P53/P61 演示环境发布与阶段三终态同步**（方向 `product/v0.1.0-p53-p61-production-release/passed/direction-v0.1.0-p53-p61-production-release.md`；回执 `receipts/production-release-01.md`／`receipts/production-release-cleanup-02.md`／`' + RCPT + '`；最终裁决 `receipts/planning-final-review-production-release-02-passed.md` **PASSED**）：两仓 main/tag/公开 Release `0.1.0` 重建（Server `' + S_ID + '`／Release `' + S_REL + '`／CI `' + S_CI + '`；Web `' + W_ID + '`／Release `' + W_REL + '`／CI `' + W_CI + '`），两仓 CI success；演示环境部署 CI 制品、应用数据库 V93（0 failed）、Owner 登录通过；发布任务状态 `COMPLETED（待规划确认，2026-09-21）`；功能数 45、清单 ✅46/🟦22/⬜22、ADV64 零变化；本轮未重复发布/部署/建库、未运行测试/构建/浏览器验收、未执行 Git 写动作\n- 更早上轮完成：**P53 规划最终确认与 P61/P53 统一集成推送**'
});

edits.push({
  id: 'CS-13-prompt-baseline',
  file: 'knowledge/current-status.md',
  find: '- 门禁基线（0.1.0 最终，终态同步轮不重跑）：Server 独立 compile 门 exit 0 ＋ 全仓 **1362 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain 终点 **V93**）；Web 四门 exit 0（**128 files、1185 passed + 3 skipped**）；I6 时点 1361/V92 仅作历史阶段证据；发布身份 Server `' + S_OLD + '`、Web `' + W_OLD + '`；行为证据 `receipts/evidence/i6-05/`、`i6-06/`',
  replace: '- 门禁基线（0.1.0 发布门禁，2026-09-21 发布轮实跑，终态同步轮不重跑）：Server `MAVEN_OPTS=-Xmx2g mvn -B test` exit 0 ＋ 全仓 **1423 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain 终点 **V93**）；Web 四门 exit 0（**134 files + 1 skipped、1217 passed + 3 skipped**）；I6 时点 1361/V92 与 2026-09-15 首次发布值（Server `' + S_OLD + '`、Web `' + W_OLD + '`、1362/0/0/0、1185+3）仅作历史阶段证据；发布身份 Server `' + S_ID + '`、Web `' + W_ID + '`；行为证据 `receipts/evidence/i6-05/`、`i6-06/`、发布门禁 `product/v0.1.0-p53-p61-production-release/receipts/evidence/production-release-01/`'
});

edits.push({
  id: 'CS-14-prompt-next-action',
  file: 'knowledge/current-status.md',
  find: '- 当前唯一下一动作：**无待执行方向**——P53 已经规划最终复核 01 PASSED 确认并核销，P53/P61 已合入两仓 develop 及远端（Web `fc37608`、Server `fa96290`）。等待 Owner/Planner 下发下一轮任务（0.1.0 发布身份未改动，不得重复发布）',
  replace: '- 当前唯一下一动作：**等待 Owner 自行体验**——0.1.0 P53/P61 发布已经规划最终审查 02 PASSED 并完成阶段三终态同步（发布任务状态 `COMPLETED（待规划确认，2026-09-21）`，方向保持 `ready/` 待 Planner 复核）；发现问题时另行立项，否则等待下一轮任务（0.1.0 发布身份锁定，不得重复发布、不得移动或重建 main/tag/Release）'
});

edits.push({
  id: 'CS-15-prompt-release-baseline',
  file: 'knowledge/current-status.md',
  find: '- 发布基线：0.1.0 两仓已发布——Server `origin/main=' + S_OLD + '`、Web `origin/main=' + W_OLD + '`，精确 annotated tag 与公开 Release 均为 `0.1.0`，main Actions 成功；发布后不得重复发布、不得移动或重建 main/tag/Release；Workspace 不参与 0.1.0 版本身份且零 Git 写动作',
  replace: '- 发布基线：0.1.0 两仓已发布并重建身份——Server `origin/main=' + S_ID + '`（公开 Release ID `' + S_REL + '`，main CI run `' + S_CI + '`）、Web `origin/main=' + W_ID + '`（公开 Release ID `' + W_REL + '`，main CI run `' + W_CI + '`），精确 annotated tag 与公开 Release 均为 `0.1.0`（Latest、非 draft/prerelease），两仓 main Actions success；演示环境部署对应 CI 制品、应用数据库 V93（0 failed）、Owner 登录通过；发布后不得重复发布、不得移动或重建 main/tag/Release；Workspace 不参与 0.1.0 版本身份且本轮零 Git 写动作'
});

// ---------- knowledge/session-handoff.md ----------
edits.push({
  id: 'SH-01-header',
  file: 'knowledge/session-handoff.md',
  find: '> 同步点：2026-09-21。',
  replace: '> 同步点：2026-09-21。**0.1.0 P53/P61 演示环境发布（XL）功能级 `PASSED（2026-09-21）`**（`product/v0.1.0-p53-p61-production-release/receipts/planning-final-review-production-release-02-passed.md`）：两仓 main/tag/公开 Release `0.1.0` 重建并锁定（Server `' + S_ID + '`／Release `' + S_REL + '`／CI `' + S_CI + '`；Web `' + W_ID + '`／Release `' + W_REL + '`／CI `' + W_CI + '`），演示环境部署 CI 制品、应用数据库 V93（0 failed）、Owner 登录通过；本轮为阶段三终态同步（方向 `' + DIRS + '`；回执 `' + RCPT + '`，`TERMINAL_SYNC_SUBMITTED`），发布任务状态 `COMPLETED（待规划确认，2026-09-21）`，方向保持 `ready/` 待 Planner 复核。'
});

edits.push({
  id: 'SH-02-active-feature',
  file: 'knowledge/session-handoff.md',
  find: '（功能级验收 07 PASSED；阶段三最终复核 01 PASSED；确认值投影回执已提交） |',
  replace: '（功能级验收 07 PASSED；阶段三最终复核 01 PASSED；确认值投影回执已提交）；**0.1.0 P53/P61 演示环境发布（XL）功能级 `PASSED（2026-09-21）`、发布任务状态 `COMPLETED（待规划确认，2026-09-21）`**（非业务功能任务：不增加业务功能数，不核销 P 编号；当前仍无活动正式功能） |'
});

edits.push({
  id: 'SH-03-server-baseline',
  file: 'knowledge/session-handoff.md',
  find: '0.1.0 最终门禁（终态同步轮只同步引用、不重跑）：独立 compile 门 exit 0 ＋ 全仓 **1362 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain H2 15 / PostgreSQL 12、终点 **V93**；I6 时点 1361/V92 仅作历史阶段证据；I5 三个 Boot 测试真实 PG·H2·Redis 行为链回归通过；I6 补证证据 15/0、G7 升级演练 1/0）。0.1.0 发布身份：Server main `' + S_OLD + '`（annotated tag/Release `0.1.0`，Actions 34946504087 成功，自动产物 `bootstrap.jar`）；I6 本地候选 `e941d74` 与 I5 候选工作树 `486b1116eb6016024c8e1e4a00b50244af2f3cb5` 只作历史阶段证据',
  replace: '0.1.0 发布门禁（2026-09-21 发布轮实跑，终态同步轮只同步引用、不重跑）：`MAVEN_OPTS=-Xmx2g mvn -B test` exit 0 ＋ 全仓 **1423 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 FlywayFullChain H2 15 / PostgreSQL 12、终点 **V93**；I5 三个 Boot 测试真实 PG·H2·Redis 行为链回归通过；I6 补证证据 15/0、G7 升级演练 1/0）。0.1.0 发布身份：Server main/tag `' + S_ID + '`（annotated tag/Release `0.1.0` 重建于该 main，公开 Release ID `' + S_REL + '`，main CI run `' + S_CI + '` success，CI 自动产物 `bootstrap.jar` sha256 `cce9efbe…24e0`）；2026-09-15 首次发布值（`' + S_OLD + '`、1362/0/0/0、Actions 34946504087）、I6 时点 1361/V92、I6 本地候选 `e941d74` 与 I5 候选工作树 `486b1116eb6016024c8e1e4a00b50244af2f3cb5` 只作历史阶段证据'
});

edits.push({
  id: 'SH-04-web-baseline',
  file: 'knowledge/session-handoff.md',
  find: '0.1.0 最终门禁（终态同步轮只同步引用、不重跑）：typecheck/lint/test/build 四门 exit 0，128 个测试文件、**1185 passed + 3 skipped**；0.1.0 发布身份：Web main `' + W_OLD + '`（annotated tag/Release `0.1.0`，Actions 34942666025 成功，自动产物 `dist-963df36….zip`）；',
  replace: '0.1.0 发布门禁（2026-09-21 发布轮实跑，终态同步轮只同步引用、不重跑）：typecheck/lint/test/build 四门 exit 0，**134 files passed + 1 skipped、1217 tests passed + 3 skipped**；0.1.0 发布身份：Web main/tag `' + W_ID + '`（annotated tag/Release `0.1.0` 重建于该 main，公开 Release ID `' + W_REL + '`，main CI run `' + W_CI + '` success，CI 自动产物 `dist-039f987….zip` sha256 `17814747…9beb`）；2026-09-15 首次发布值（`' + W_OLD + '`、128 个测试文件、1185 passed + 3 skipped、Actions 34942666025）只作历史阶段证据；'
});

edits.push({
  id: 'SH-05-flyway',
  file: 'knowledge/session-handoff.md',
  find: 'devseed H2 V900—V903 仅 dev 装载；`sw-bootstrap` FlywayFullChain H2 15 条 / PG 12 条） |',
  replace: 'devseed H2 V900—V903 仅 dev 装载；`sw-bootstrap` FlywayFullChain H2 15 条 / PG 12 条）；2026-09-21 发布轮以正式迁移链在演示环境重建本项目应用数据库至 **V93**（V1→V93，0 failed，未载入 devseed V900—V903），迁移身份不变 |'
});

edits.push({
  id: 'SH-06-task-state',
  file: 'knowledge/session-handoff.md',
  find: '确认值投影回执 `final-state-projection-stage-i6-v0.0.3-oa-iteration-01.md` `TERMINAL_SYNC_SUBMITTED`） |',
  replace: '确认值投影回执 `final-state-projection-stage-i6-v0.0.3-oa-iteration-01.md` `TERMINAL_SYNC_SUBMITTED`）；**0.1.0 P53/P61 发布任务状态 `COMPLETED（待规划确认，2026-09-21）`**（非业务功能任务；阶段三终态同步回执 `' + RCPT + '`，方向保持 `ready/` 待 Planner 复核） |'
});

edits.push({
  id: 'SH-07-active-impl',
  file: 'knowledge/session-handoff.md',
  find: '（三份方向归档 `passed/`；独立提交 Server `742adb8` / Web `d110ed8` 已随 P53 合入 develop；P61 不再列为活动功能） |',
  replace: '（三份方向归档 `passed/`；独立提交 Server `742adb8` / Web `d110ed8` 已随 P53 于 2026-09-21 合入两仓 develop 并推送——Web `fc37608`、Server `fa96290`；P61 不再列为活动功能）；**0.1.0 P53/P61 演示环境发布已 PASSED 并完成阶段三终态同步**（发布为非业务功能任务，当前无活动正式功能） |'
});

edits.push({
  id: 'SH-08-next-action',
  file: 'knowledge/session-handoff.md',
  find: '**无待执行方向**：P53 已经规划最终复核 01 PASSED 确认 `COMPLETED（规划已确认，2026-09-21）` 并核销（第 45 个正式功能），P53/P61 已按 Owner 授权合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；正式业务功能数 45 与清单 ✅46/🟦22/⬜22、ADV64、开放 P 编号不变；0.1.0 两仓发布身份未改动、不得重复发布',
  replace: '**等待 Owner 自行体验**：0.1.0 P53/P61 演示环境发布已经规划最终审查 02 PASSED 并完成阶段三终态同步（发布任务状态 `COMPLETED（待规划确认，2026-09-21）`，方向保持 `ready/` 待 Planner 复核）；发现问题时另行立项，否则等待下一轮任务。P53 已经规划最终复核 01 PASSED 确认 `COMPLETED（规划已确认，2026-09-21）` 并核销（第 45 个正式功能），P53/P61 已按 Owner 授权合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；正式业务功能数 45 与清单 ✅46/🟦22/⬜22、ADV64、开放 P 编号不变；0.1.0 发布身份锁定，不得重复发布、不得移动或重建 main/tag/Release'
});

edits.push({
  id: 'SH-09-keyfacts',
  file: 'knowledge/session-handoff.md',
  find: '## v0.1.0-oa-completion 关键事实\n',
  replace: '## v0.1.0-oa-completion 关键事实\n\n- 0.1.0 P53/P61 演示环境发布（非业务功能任务，2026-09-21）：方向 `product/v0.1.0-p53-p61-production-release/passed/direction-v0.1.0-p53-p61-production-release.md`（Owner 授权「推送发布并测试验收」）；执行回执 `receipts/production-release-01.md`、补证回执 `receipts/production-release-cleanup-02.md`，最终裁决 `receipts/planning-final-review-production-release-02-passed.md` **PASSED**；阶段三终态同步方向 `' + DIRS + '`（保持 `ready/` 待 Planner 复核），同步回执 `' + RCPT + '`。两仓 main/tag/公开 Release `0.1.0` 重建（Server `' + S_ID + '`／Release `' + S_REL + '`／CI `' + S_CI + '`；Web `' + W_ID + '`／Release `' + W_REL + '`／CI `' + W_CI + '`），发布门禁 Server 1423/0/0/0、Web 四门 exit 0（1217+3）；演示环境部署 CI 制品、应用库 V93（0 failed）、Owner 登录通过；发布任务不新增/核销 P 编号，功能数 45、清单 ✅46/🟦22/⬜22、ADV64 零变化。\n'
});

edits.push({
  id: 'SH-10-task-pointer',
  file: 'knowledge/session-handoff.md',
  find: '- v0.1.0-oa-completion（P60，`COMPLETED（规划已确认，2026-09-15）`，已完成并发布）：**无活动入口**；',
  replace: '- 0.1.0 P53/P61 演示环境发布（非业务功能任务）：主方向已归档 `product/v0.1.0-p53-p61-production-release/passed/direction-v0.1.0-p53-p61-production-release.md`；阶段三终态同步方向保持 `ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md` 待 Planner 复核（同步回执 `receipts/terminal-sync-production-release-01.md`）；发布任务状态 `COMPLETED（待规划确认，2026-09-21）`；当前唯一下一动作=等待 Owner 自行体验。\n- v0.1.0-oa-completion（P60，`COMPLETED（规划已确认，2026-09-15）`，已完成并发布）：**无活动入口**；'
});

// ---------- knowledge/features/v0.1.0-oa-completion.md ----------
edits.push({
  id: 'FT-01-status-row',
  file: 'knowledge/features/v0.1.0-oa-completion.md',
  find: '0.1.0 最终门禁 Server 1362/0/0/0（BUILD SUCCESS，FlywayFullChain 终点 V93）、Web 四门 1185 passed + 3 skipped；发布身份 Server main `' + S_OLD + '`、Web main `' + W_OLD + '`，两仓 annotated tag 与公开 Release 均为 `0.1.0`',
  replace: '0.1.0 发布门禁（2026-09-21 发布轮实跑）：Server 1423/0/0/0 BUILD SUCCESS（FlywayFullChain 终点 V93）、Web 四门 exit 0（1217 passed + 3 skipped）；当前发布身份 Server main/tag `' + S_ID + '`（公开 Release ID `' + S_REL + '`，main CI run `' + S_CI + '`）、Web main/tag `' + W_ID + '`（公开 Release ID `' + W_REL + '`，main CI run `' + W_CI + '`），两仓 annotated tag 与公开 Release 均为 `0.1.0`（2026-09-21 重建；2026-09-15 首次发布值 `' + S_OLD + '`／`' + W_OLD + '`、1362/0/0/0、1185+3 只作历史阶段证据）'
});

edits.push({
  id: 'FT-02-count-row',
  file: 'knowledge/features/v0.1.0-oa-completion.md',
  find: '正式功能数 **44**（44/44 登记路径存在；本功能未完成不计数）',
  replace: '正式功能数 **45**（45/45 登记路径存在，P53 全局 UI 与组件布局优化为第 45 个正式功能，功能级 `PASSED（2026-09-21）`、`COMPLETED（规划已确认，2026-09-21）`；本版本统筹项不增加业务功能计数）'
});

edits.push({
  id: 'FT-03-actions',
  file: 'knowledge/features/v0.1.0-oa-completion.md',
  find: '## 已执行动作（追加式）\n\n',
  replace: '## 已执行动作（追加式）\n\n- **2026-09-21 0.1.0 P53/P61 演示环境发布与阶段三终态同步**（授权 = Owner 2026-09-21「推送发布并测试验收」；方向 `product/v0.1.0-p53-p61-production-release/passed/direction-v0.1.0-p53-p61-production-release.md`；回执 `receipts/production-release-01.md`、`receipts/production-release-cleanup-02.md`，最终裁决 `receipts/planning-final-review-production-release-02-passed.md` PASSED；同步回执 `' + RCPT + '`，`TERMINAL_SYNC_SUBMITTED`）：两仓 develop 普通合并至 main 并推送（Server `' + S_OLD + '→' + S_ID + '`、Web `963df36→' + W_ID + '`），main CI success 并生成 CI 资产（Server jar sha256 `cce9efbe…24e0`、Web dist sha256 `17814747…9beb`），旧 `0.1.0` tag/Release 删除并在合并后 main 重建（公开 Release ID `' + S_REL + '`／`' + W_REL + '`）；演示环境部署 CI 制品、本项目应用数据库全新迁移至 V93（0 failed）、Owner 登录验证通过；发布门禁 Server 1423/0/0/0、Web 四门 exit 0（1217 passed + 3 skipped）；发布任务状态 `COMPLETED（待规划确认，2026-09-21）`，不新增/核销 P 编号，功能数 45、清单 ✅46/🟦22/⬜22、ADV64 零变化；未重复发布/部署/建库、未运行测试/构建/浏览器验收、未执行 Git 写动作。\n'
});

// ---------- knowledge/feature-reconciliation-index.md ----------
edits.push({
  id: 'IX-01-feature-count',
  file: 'knowledge/feature-reconciliation-index.md',
  find: '- 正式功能数：**44**（p21-iot-device-access 为第 44 个，功能状态 COMPLETED（规划已确认）2026-09-08，43＋1 不另建 P 编号；历史点：v0.0.2-oa 为第 43 个，P4 OA 本轮子集为第 42 个，P58 为第 41 个）',
  replace: '- 正式功能数：**45**（`p53-global-ui-component-layout` 为第 45 个，功能级 `PASSED（2026-09-21）`、`COMPLETED（规划已确认，2026-09-21）`，44＋1 不另建 P 编号，登记路径 45/45 存在；历史点：p21-iot-device-access 为第 44 个（2026-09-08，43＋1），v0.0.2-oa 为第 43 个，P4 OA 本轮子集为第 42 个，P58 为第 41 个）'
});

edits.push({
  id: 'IX-02-p61-merge',
  file: 'knowledge/feature-reconciliation-index.md',
  find: '独立提交 Server `742adb8` / Web `d110ed8` 先保留，待 P53 结束后统一合并）',
  replace: '独立提交 Server `742adb8` / Web `d110ed8` 已随 P53 于 2026-09-21 统一合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`））'
});

edits.push({
  id: 'IX-03-entry-pointer',
  file: 'knowledge/feature-reconciliation-index.md',
  find: '当前执行入口以 `knowledge/current-status.md`「当前唯一下一动作」为准（2026-09-15 为 P60 整体终态同步——',
  replace: '当前执行入口以 `knowledge/current-status.md`「当前唯一下一动作」为准（当前为 2026-09-21 0.1.0 P53/P61 演示环境发布阶段三终态同步——发布任务状态 `COMPLETED（待规划确认，2026-09-21）`、两仓 main/tag/公开 Release 重建锁定、演示库 V93、Owner 登录通过，方向 `' + DIRS + '`（保持 `ready/` 待 Planner 复核）；历史 2026-09-15 为 P60 整体终态同步——'
});

edits.push({
  id: 'IX-04-tracking',
  file: 'knowledge/feature-reconciliation-index.md',
  find: '- 会议交接：`knowledge/session-handoff.md`',
  replace: '- 0.1.0 P53/P61 演示环境发布（非业务功能任务，2026-09-21）：`product/v0.1.0-p53-p61-production-release/`（主方向 `passed/direction-v0.1.0-p53-p61-production-release.md`；阶段三终态同步方向保持 `ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md` 待 Planner 复核；回执 `receipts/production-release-01.md`、`production-release-cleanup-02.md`、`terminal-sync-production-release-01.md`；不新增业务功能数、不核销 P 编号、不并入本索引审计集合计数）\n- 会议交接：`knowledge/session-handoff.md`'
});

// ---------- todo ----------
edits.push({
  id: 'TD-01-oa-plan',
  file: 'todo/v0.1.0-oa-plan.md',
  find: 'P60成熟OA `0.1.0`路线已**COMPLETED（规划已确认，2026-09-15）**，整体14/14；I1—I6均已确认。Server/Web `0.1.0`发布锁定，Workspace不参与版本判断；迁移终点V93。R8五渠道与I5三Provider保持Owner延期/未验证；功能数44、✅46/🟦22/⬜22、ADV64与其他开放P编号不变。当前主功能入口为 P53 提示07：`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`；P61 已 `COMPLETED（规划已确认，2026-09-20）` 并核销，仅作完成追溯（三份方向归档 `product/p61-user-facing-message-humanization/passed/`，现状探索 `search_task/p61-user-facing-message-humanization-current-seams.md`）。',
  replace: 'P60成熟OA `0.1.0`路线已**COMPLETED（规划已确认，2026-09-15）**，整体14/14；I1—I6均已确认。**0.1.0 已由 `v0.1.0-p53-p61-production-release` 重建发布身份并锁定**：Server main/tag `' + S_ID + '`（公开 Release ID `' + S_REL + '`、CI run `' + S_CI + '`）、Web main/tag `' + W_ID + '`（公开 Release ID `' + W_REL + '`、CI run `' + W_CI + '`），演示环境部署 CI 制品、应用数据库 V93、Owner 登录验证通过；Workspace 不参与版本判断；迁移终点V93。R8五渠道与I5三Provider保持Owner延期/未验证；功能数45、✅46/🟦22/⬜22、ADV64与其他开放P编号不变。发布任务状态 `COMPLETED（待规划确认，2026-09-21）`（方向 `' + DIRS + '` 待 Planner 复核）；P53 已 `COMPLETED（规划已确认，2026-09-21）` 并核销（第45个正式功能），P61 已 `COMPLETED（规划已确认，2026-09-20）` 并核销，均仅作完成追溯（P61 三份方向归档 `product/p61-user-facing-message-humanization/passed/`）；当前无待执行入口，唯一下一动作=等待 Owner 自行体验，发现问题时另行立项。'
});

edits.push({
  id: 'TD-02-requirement-pool',
  file: 'todo/requirement-pool.md',
  find: '**2026-09-21 当前排期**：P53 已经规划最终复核01 PASSED 确认`COMPLETED（规划已确认，2026-09-21）`并核销（第45个正式功能）；正式业务功能数45，清单✅46/🟦22/⬜22与ADV64不变。P53/P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`），受影响检查：Web 四连 exit0＋locale 八值8/8、Server compile exit0＋聚焦测试35/0/0/0。下一动作=无待执行方向，等待 Owner/Planner 下发下一轮任务。',
  replace: '**2026-09-21 当前排期**：0.1.0 P53/P61 演示环境发布已经规划最终审查02 PASSED，两仓 main/tag/公开 Release（Server `' + S_ID + '`／Release ID `' + S_REL + '`、Web `' + W_ID + '`／Release ID `' + W_REL + '`）、CI 资产、演示库 V93 与 Owner 登录全部锁定；阶段三终态同步已提交（发布任务状态 `COMPLETED（待规划确认，2026-09-21）`，方向 `' + DIRS + '` 待 Planner 复核）。P53 已经规划最终复核01 PASSED 确认`COMPLETED（规划已确认，2026-09-21）`并核销（第45个正式功能）；正式业务功能数45，清单✅46/🟦22/⬜22与ADV64不变。P53/P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）。下一动作=等待 Owner 自行体验，发现问题时另行立项，否则等待下一轮任务；0.1.0 发布身份锁定，不得重复发布。'
});

// ---------- 方向自身状态指针 ----------
edits.push({
  id: 'DR-01-status-pointer',
  file: 'product/v0.1.0-p53-p61-production-release/ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md',
  find: 'Executor提交`TERMINAL_SYNC_SUBMITTED`，不得自行写`COMPLETED（规划已确认）`或移动本方向。',
  replace: 'Executor提交`TERMINAL_SYNC_SUBMITTED`，不得自行写`COMPLETED（规划已确认）`或移动本方向。\n\n---\n\n## 执行侧状态指针（Executor，2026-09-21）\n\n- 机器状态：`TERMINAL_SYNC_SUBMITTED`；同步回执：`../receipts/terminal-sync-production-release-01.md`。\n- 已按 §3 完成 knowledge（current-status、session-handoff、feature-reconciliation-index、features/v0.1.0-oa-completion）、memory（README、state、features、handoff）、todo（v0.1.0-oa-plan、requirement-pool）与 product 目录核对的机械同步。\n- 本方向仍保留在 `ready/`：执行侧不自行确认 `COMPLETED（规划已确认）`、不移动方向、不写 `passed/`；等待 Planner 全文复核后归档。\n'
});

export { edits };

// ---------- memory 全文压缩 ----------
export const memFiles = [
  {
    id: 'MM-01-readme',
    file: 'memory/README.md',
    content: [
      '# memory 使用说明',
      '',
      '`memory/` 保存 Planner 可直接恢复和决策的最小摘要；不承载完整历史、原始证据或完整决策正文。',
      '',
      '- 当前摘要：`state.md`、`handoff.md`（截至2026-09-21：P53已`COMPLETED（规划已确认，2026-09-21）`并核销，为第45个正式业务功能；P61已`COMPLETED（规划已确认，2026-09-20）`并核销；两项独立提交已按Owner授权与P61→P53顺序合入两仓develop并推送（Web `fc37608`、Server `fa96290`）。**0.1.0已由 `v0.1.0-p53-p61-production-release` 重建发布身份并锁定**：Server main/tag `' + S_ID + '`（Release `' + S_REL + '`）、Web main/tag `' + W_ID + '`（Release `' + W_REL + '`），演示环境V93、Owner登录通过；发布任务`COMPLETED（待规划确认，2026-09-21）`，下一动作=等待Owner自行体验）',
      '- 全量双向映射索引：`knowledge/feature-reconciliation-index.md`',
      '- 未关闭问题：`knowledge/known-issues.md`；完整功能清单：`Smart-WorkFlow-aPaaS-server/功能清单.md`；历史证据：`product/*/receipts/`',
      ''
    ].join('\n')
  },
  {
    id: 'MM-02-state',
    file: 'memory/state.md',
    content: [
      '# 当前状态摘要',
      '',
      '> 发布（XL，功能级PASSED，终态同步待规划复核）：0.1.0由`v0.1.0-p53-p61-production-release`重建身份并锁定——Server main/tag `' + S_ID + '`（Release `' + S_REL + '`、CI run `' + S_CI + '`）、Web main/tag `' + W_ID + '`（Release `' + W_REL + '`、CI run `' + W_CI + '`），双CI success；演示环境部署CI制品、应用数据库V93（0 failed）、Owner登录通过；发布任务状态`COMPLETED（待规划确认，2026-09-21）`，同步回执`' + RCPT + '`。',
      '',
      '> 唯一下一动作：等待Owner自行体验演示环境；发现问题时另行立项，否则等待下一轮任务。P53/P61已确认核销并合入两仓develop（Web `fc37608`、Server `fa96290`）；0.1.0发布身份锁定，不得重复发布或移动main/tag/Release。',
      '',
      '- 终态值：功能数 **45**（P53为第45个，规划已确认）；清单 **✅46/🟦22/⬜22**（90，零变化）；**ADV64**（独立规划项，不计入）；P21/P61/P53已核销；P2/P4开放、部分实现未核销，P34/P35/P37/P38/P39部分实现未核销；本发布任务不新增/核销P编号。',
      '- 验证基线（2026-09-21发布轮实跑，终态同步不重跑）：Server **1423/0/0/0 BUILD SUCCESS**（Flyway终点V93）；Web四门exit 0、**1217 passed + 3 skipped**；2026-09-15首次发布值1362/0/0/0、1185+3为历史点。',
      '- 活动功能：**无**。P53（第45个，视觉71 passed/17 skipped/0 failed、Web四门exit0、可见FORMAL_FLOW 5制品/20条真实`/api/*`、节点06安全偏差锁定）与P61（八值8/8、154键/22修订、HTTP 22/22）均已确认核销。',
      '- `v0.1.0-oa-completion`（P60）：**COMPLETED（规划已确认，2026-09-15）**，整体14/14；终态同步最终复核01 PASSED。',
      '- 上一位次基线：P21 **COMPLETED（规划已确认，2026-09-08）**，第44个正式功能；更早：v0.0.2-oa第43个（09-07）、P4第42个（09-07）、P59（09-05）、p58第41个、p57第40个、p56第39个＋P46、p52第38个、p45第37个、p51引擎解耦（不计功能数）——详见`knowledge/history/`。',
      '- P剩余边界：P2其余（计算公式/外部数据源/表单删除/列表配置持久化）；P4候选（转办/委托/加签/撤回、流程版本/挂起激活）；M08-F04-01🟦、F04-02/F05-02⬜；P34/P35/P37/P38/P39剩余；腾讯实网与三Provider真实链免验未做；**I6五外部通知渠道真实链转P2待办（`todo/i6-external-notification-channels-real-verification.md`），保持Owner延期 / 未验证**；小程序冻结；多宿主执行监督治理真实ZCode闭环未完成（方向保持`ready/`）。',
      ''
    ].join('\n')
  },
  {
    id: 'MM-03-features',
    file: 'memory/features.md',
    content: [
      '# 功能摘要',
      '',
      '> 规划侧最新同步点：2026-09-21（0.1.0由`v0.1.0-p53-p61-production-release`重建发布身份并锁定：Server main/tag `' + S_ID + '`（Release `' + S_REL + '`）、Web `' + W_ID + '`（Release `' + W_REL + '`），演示环境V93、Owner登录通过；发布任务`COMPLETED（待规划确认，2026-09-21）`；P53=`COMPLETED（规划已确认，2026-09-21）`、已核销、第45个正式业务功能；P61=`COMPLETED（规划已确认，2026-09-20）`并核销；P60=`COMPLETED（规划已确认）`；清单✅46/🟦22/⬜22、ADV64）。',
      '> 清单当前值 **✅46/🟦22/⬜22**（90，M08 十行 🟦/⬜→✅，其余 80 行零变化）；功能数 **45**；全量双向映射见 `knowledge/feature-reconciliation-index.md`。',
      '',
      '- `v0.1.0-oa-completion`（P60，优先级P0）：**COMPLETED（规划已确认，2026-09-15）**，整体14/14；版本身份由2026-09-21发布重建（见上），迁移终点V93。',
      '- 0.1.0 P53/P61演示环境发布（XL，非业务功能任务）：功能级**PASSED（2026-09-21）**，主方向已归档`product/v0.1.0-p53-p61-production-release/passed/`；发布任务状态`COMPLETED（待规划确认，2026-09-21）`；不增加业务功能数、不核销P编号。',
      '- P53（P0/XL）：**功能级`PASSED（2026-09-21）`、`COMPLETED（规划已确认，2026-09-21）`、已核销，第45个正式功能**；主方向与阶段三方向均已归档`product/p53-global-ui-component-layout/passed/`。',
      '- P61（P1/L）：**`COMPLETED（规划已确认，2026-09-20）`，已核销**；独立提交Server `742adb8`、Web `d110ed8`已随P53合入两仓develop（Web `fc37608`、Server `fa96290`）；三份方向归档`passed/`，不增加业务功能数。',
      '',
      '- `p21-iot-device-access`：**COMPLETED（规划已确认，2026-09-08）**，第44个正式功能；P21已核销、I14关闭；两方向归档`passed/`。',
      '',
      '- `v0.0.2-oa`：**COMPLETED（规划已确认，2026-09-07）**，第43个正式功能；A1—A8锁定；P3/P54/P55已核销，P2/P4开放。',
      '',
      '- `p4-oa-personal-center-dual-dispatch`：**COMPLETED（2026-09-07）**，第42个正式功能；P4总项开放、部分实现未核销。',
      '',
      '- `p59-ch-apaas-project-update`：**COMPLETED（规划已确认，2026-09-05）**，P59已核销；两方向归档passed。',
      '',
      '- `knowledge-full-reconciliation`（非业务功能任务）：**COMPLETED（已确认，2026-09-04）**，三方向归档`passed/`。',
      '',
      '- 更早已确认功能（详见`knowledge/history/`）：p58第41个、p57第40个、p56第39个＋P46、p52第38个、p45第37个、p51引擎解耦（不计功能数）、form-data-import-export第36个、minimal-business-closure第35个。',
      ''
    ].join('\n')
  },
  {
    id: 'MM-04-handoff',
    file: 'memory/handoff.md',
    content: [
      '# 功能交接摘要',
      '',
      '## 0. 当前发布入口（2026-09-21）',
      '',
      '0.1.0 P53/P61演示环境发布已由规划最终审查02判定PASSED：Server/Web main、tag、公开Release、CI资产、演示库V93、Owner登录及C1临时敏感资产清理全部锁定。主方向已归档`product/v0.1.0-p53-p61-production-release/passed/`；阶段三终态同步方向`ready/direction-v0.1.0-p53-p61-production-release-terminal-sync.md`待Planner复核（回执`' + RCPT + '`，`TERMINAL_SYNC_SUBMITTED`）。',
      '',
      '## 1. 当前任务',
      '',
      '无活动正式功能；P53已`COMPLETED（规划已确认，2026-09-21）`并核销（第45个正式业务功能）；P61已`COMPLETED（规划已确认，2026-09-20）`并核销。发布为非业务功能任务：发布任务状态`COMPLETED（待规划确认，2026-09-21）`。',
      '',
      '## 2. Owner 排序',
      '',
      'P53与P61的功能实现、验收与终态确认均已收敛；Owner已授权统一集成（P61独立提交与P53一并合入两仓develop并推送：Web `fc37608`、Server `fa96290`）。0.1.0发布已按Owner 2026-09-21授权执行并锁定。',
      '',
      '## 3. 当前执行入口',
      '',
      '- 0.1.0 P53/P61发布：主方向归档`product/v0.1.0-p53-p61-production-release/passed/`；终态同步方向保持`ready/`待Planner复核，无其他待执行入口。',
      '- P53：主方向与阶段三方向归档`product/p53-global-ui-component-layout/passed/`；P61：三份方向归档`product/p61-user-facing-message-humanization/passed/`。',
      '',
      '## 4. 发布身份（锁定，2026-09-21）',
      '',
      'Server main/tag `' + S_ID + '`（公开Release ID `' + S_REL + '`、CI run `' + S_CI + '`）；Web main/tag `' + W_ID + '`（公开Release ID `' + W_REL + '`、CI run `' + W_CI + '`）；两仓annotated tag与公开Release `0.1.0`（Latest）；演示环境部署CI制品、应用库V93、Owner登录通过。',
      '',
      '## 5. 锁定基线',
      '',
      '功能数45（P53第45个）；清单✅46/🟦22/⬜22、ADV64不变；Server 1423/0/0/0、Web 1217+3（2026-09-21发布轮实跑）；迁移终点V93。多宿主Supervisor真实ZCode闭环仍开放；I6五外部通知渠道与三Provider保持Owner延期 / 未验证。',
      '',
      '## 6. 独立状态卫生任务',
      '',
      '当前状态引用卫生整改已PASSED（H1—H13、G1—G4全部关闭）；无后续执行入口。',
      '',
      '## 7. 新机器启动提示词',
      '',
      '唯一下一动作：等待Owner自行体验0.1.0演示环境；发现问题时另行立项，否则等待下一轮任务。禁止重复发布、部署、建库、测试或Git写动作。',
      ''
    ].join('\n')
  }
];
