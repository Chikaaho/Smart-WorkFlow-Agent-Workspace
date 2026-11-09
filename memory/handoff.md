# 交接

2026-11-09｜Executor（Z7）｜两代码仓 main README 重排为开源结构并实测启动：Server main=develop=`7d0f2a2e`、Web `bed840d`；`--latest=false` 已进工作流，0.4.0/0.3.6 已设回 Latest（Owner 授权）；Z4 待 11-10 17:16 后。

## 当前

P66 多数据库兼容（XL）以 **Server 0.4.0** 发布，登记第 **52** 个正式功能。

- **发布**：tag `0.4.0`=`a4f6c278`（annotated tag 对象 `6093c4cc…`），Release `438918154`，
  `bootstrap-0.4.0.jar` 236,245,457 B sha256 `188be963…`；`build-<sha>` Release `438913661` 同字节。
- **UAT**：Server build.version=0.4.0、health UP、根 200、Flyway v0.4.0（33 行）；新增
  `V0.4.0__knowledge_vector_persistence.sql`、`R__0.4.0_rename_bpm_opinion_comment.sql`；
  旧 31 条校验和不变；管理员工具启用过滤 internal=3/external=1/disabled=0。
- **运维**：生产默认日志 INFO（部署后 16 分钟 DEBUG 0）；logrotate rotate/maxage 14；
  `postgresql@14-main` drop-in `Restart=on-failure`/`RestartSec=5s`；未加磁盘告警。
- **验证**：全量 `mvn test` 2,481 / 0 / 0 / 45 skipped；六库冒烟
  （MySQL 5.7/8.0、MariaDB、Oracle、openGauss、SQL Server）通过；CI feature #123、
  develop #126、main #127 success。
- **回执**：`product/multi-database-compat/receipts/execution-final-03.md`；
  **功能登记**：`knowledge/features/multi-database-compat.md`。

三示例流程（0.3.1—0.3.6）保持 **`COMPLETED`**；Web **0.3.6**（tag `c3f1d6e`，Release
`438126185`，入口 `assets/index-CKdiXkhU.js`）不变。应用包维持 `systemVersion=0.3.2`。

**下一动作**：Z6、Z7 已完成（`execution-final-05.md` §6/§7）；2026-11-10 17:16 后在同一回执 §3 只读补 Z4（`server.log` 大小、`df -h /`、logrotate 实际轮转），然后 Planner 终态复核（第 52 功能、方向归 `passed/`、COMPLETED）。已按 Owner 授权完成：两仓工作流 `gh release create` 加 `--latest=false`，Server `0.4.0`、Web `0.3.6` 经 PATCH 设回 Latest。可选手动删残留目录 `E:/code/p61-wt-web`（312M，内容全在 main）。Server 2 个额外 worktree 属隔离环境，保留（final-06 §3）。Web 缺陷见 `todo/web-ui-defects-20261109.md`。
Owner 侧：DM8、KingbaseES 实库验证。

## 待办/风险

- `JavaSubprocessExecutor` 子进程输出读取竞态（CI #125 两次失败、第 3 次通过）：
  `todo/iot-subprocess-output-race.md`；修复前 CI 偶发。
- 0.3.3 已取消，见 state 教训。
- UAT 日志轮转配置已是 `maxsize 100M/rotate 14/compress`；`server.log` 当前仍含旧 DEBUG 历史内容，
  后续按日轮转。

## 更早历史

0.3.0 退回见 `knowledge/features/0.3.0-three-sample-processes.md`。常规决定：过程证据截图不入 Git；
执行列表无菜单、冷却抑制、`mes_judge_config` 不参与判定按已登记边界处理。

## 保留与保护

Owner 定保留本机隔离环境（含 `.runtime-*`、隔离库、凭据密文，已 gitignore，只要求不泄露）。
继续保护 Web `vite.config.ts` 在途改动、`smart_workflow_f1v4b`、用户 8080/5173 服务和秘密；
Key/授权码不入 Git。
