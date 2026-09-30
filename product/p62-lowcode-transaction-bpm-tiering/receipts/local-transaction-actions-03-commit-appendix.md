# 回执03 提交后附录：三仓提交与远端回读

日期：2026-09-30；角色：执行（Executor）。用途：记录回执03 正文与证据包的提交身份、远端包含性与原始日志留存口径。

## 1. 提交身份

| 仓 | 提交 | 内容 | 远端回读 |
|---|---|---|---|
| Server | `6e73a11` | 测试证据用例：`P62UpperEntryC1PgTest`（新增）、`P62TxnActionPgBehaviourTest`（+LT04a 单对象用例）、`P62NonEmptyUpgradePgTest`（新增） | 包含于 `origin/develop`（`git merge-base --is-ancestor` 通过） |
| Server | `09248b4` | `功能清单.md` 当前入口同步（回执03 状态与测试提交身份） | `origin/develop = 09248b4c8c87fd9a85caf2af06558d35ddd62386`（`git ls-remote` 与本地一致） |
| Workspace | `12808cd` | 回执03 正文 + `receipts/evidence/local-transaction-actions-03/`（9 件，含 5 件 `.txt` 按显式纳入处理）+ 审查02/一级提示文档 + knowledge/memory/todo 当前值同步 + gitlink（Server `09248b4`、Web `19e1c47`） | `origin/develop-sw = 12808cdba07b3053152d576cb675606faed096b8`（`git ls-remote` 与本地一致） |
| Web | `19e1c47` | 未变（本轮无前端改动） | `origin/develop = 19e1c47` 未变 |

## 2. 原始日志留存口径

- 四段门禁原始日志与运行脚本位于执行主机 `/tmp/p62-verify/lt03-{mod,A1,A2,B}.log` 与 `lt03-run.sh`（临时目录，随主机清理），其 **SHA-256 已固化入库**（`lt01a-log-sha256.txt`），白名单原文摘录入库（`lt01a-raw-excerpts.txt`，626 行，主机地址脱敏），逐类计数复算入库（`lt01a-per-class-counts.txt`），新增断言与消费链异常栈入库（`lt02a-lt04a-lt05a-raw-output.txt`）。
- 如需与其他执行者复核，按 `lt01a-gate-report.md` §6 的复算命令在 `6e73a11` 树上重跑即可重现同一集合与计数（引擎内嵌、隔离，不依赖 dev 库状态）。

## 3. 当前入口一致性

- `knowledge/current-status.md`、`knowledge/session-handoff.md`、`memory/{state,handoff,features}.md`、`todo/{p62-lowcode-transaction-bpm-tiering,requirement-pool}.md`、Server `功能清单.md` 同步为同一当前值：首事务阶段 VERIFYING（回执03 待复核）、唯一下一动作 = Planner 复核回执03 与证据包并独立验收 LT01a—LT05a；0.1.3 = COMPLETED（Owner已验收，2026-09-30）无剩余动作。
- 本轮未改动历史回执与旧证据；LT04a 口径撤回归档于 `receipts/evidence/local-transaction-actions-03/lt04a-single-object-frozen.md` §1。
