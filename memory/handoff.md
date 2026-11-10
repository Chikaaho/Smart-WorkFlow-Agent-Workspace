# 交接

2026-11-10｜Planner｜0.4.1/0.3.8 阶段 3 通过，进入合并发版（3/0/4），见 `receipts/planning-review-041-01.md`；Z4 置顶。

## 当前

P66 多数据库兼容（XL）**COMPLETED**，以 **Server 0.4.0** 发布，第 **52** 个正式功能。

- **发布**：tag `0.4.0`=`a4f6c278`（annotated tag 对象 `6093c4cc…`），Release `438918154`，
  `bootstrap-0.4.0.jar` 236,245,457 B sha256 `188be963…`。
- **UAT**：Server build.version=0.4.0、health UP、根 200、Flyway v0.4.0（33 行）；新增
  `V0.4.0__knowledge_vector_persistence.sql`、`R__0.4.0_rename_bpm_opinion_comment.sql`；
  旧 31 条校验和不变；管理员工具启用过滤 internal=3/external=1/disabled=0。
- **运维**：日志 INFO、logrotate 14 份、PG 自动拉起，见 issues.md。
- **验证**：全量 `mvn test` 2,481 / 0 / 0 / 45 skipped；六库冒烟
  （MySQL 5.7/8.0、MariaDB、Oracle、openGauss、SQL Server）通过；CI feature #123、
  develop #126、main #127 success。
- **回执**：`product/multi-database-compat/receipts/execution-final-03.md`；
  **功能登记**：`knowledge/features/multi-database-compat.md`。

三示例流程（0.3.1—0.3.6）保持 **`COMPLETED`**；Web **0.3.6**（tag `c3f1d6e`，Release
`438126185`，入口 `assets/index-CKdiXkhU.js`）不变。应用包维持 `systemVersion=0.3.2`。

**下一动作**：Executor 按 `product/approval-record-patch/ready/direction-server-041-web-038.md` 先做第一步收尾（Server CI 回读、memory 压缩、CI 源还原检查、17:16 后 Z4），再实施 0.4.1/0.3.8，验收通过前不合并。0.3.7 验收 `product/web-037-patch/receipts/planning-review-037-01.md`。可选手动删残留目录 `E:/code/p61-wt-web`；Server 2 个额外 worktree 保留。
Owner 侧：DM8、KingbaseES 实库验证。

## 待办/风险

- `JavaSubprocessExecutor` 子进程输出读取竞态（CI #125 两次失败、第 3 次通过）：
  `todo/iot-subprocess-output-race.md`；修复前 CI 偶发。
- UAT 日志轮转配置已是 `maxsize 100M/rotate 14/compress`；`server.log` 当前仍含旧 DEBUG 历史内容，
  后续按日轮转。

## 更早历史

0.3.0 退回见 `knowledge/features/0.3.0-three-sample-processes.md`。常规决定：过程证据截图不入 Git；
执行列表无菜单、冷却抑制、`mes_judge_config` 不参与判定按已登记边界处理。

## 保留与保护

Owner 定保留本机隔离环境（含 `.runtime-*`、隔离库、凭据密文，已 gitignore，只要求不泄露）。
继续保护 Web `vite.config.ts` 在途改动、`smart_workflow_f1v4b`、用户 8080/5173 服务和秘密；
Key/授权码不入 Git。
