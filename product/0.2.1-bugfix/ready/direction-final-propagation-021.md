# 0.2.1 终态传播

日期：2026-11-03。下发角色：规划；承接角色：执行（Executor）。状态：`READY`。

依据：`product/0.2.1-bugfix/receipts/planning-final-review-021-completed.md`。本方向只传播裁决和回读一项发布观察，不派实现、业务验证、合并、发布或部署。

## 唯一终态值

| 字段 | 目标值 |
|---|---|
| 0.2.1 交付状态 | `COMPLETED`（规划 2026-11-03 终态复核） |
| 七阶段进度 | 7/0/0：评估、执行与逐项修复、验收与同步、合并、发布、发布后同步、结束全部完成 |
| 计数与编号 | 功能 49、46/22/22＝90、ADV64/问题57、P 编号、明细 ID、验证基线 [] 均不变 |
| 正式/部署版本 | Server、Web 0.2.1（发布源 `5c33eab3`/`07568b57`），UAT 已部署 |
| 开发版本 | Server `0.2.1-SNAPSHOT`、Web `0.2.1` |
| 方向目录 | `product/0.2.1-bugfix/passed/`（规划已归档 `direction-bugfix-021.md`、`direction-close-release-021.md`） |
| 活动功能 | 无 |
| 唯一下一动作 | 等待 Owner 安排下一目标 |

## 动作与完成条件

1. 把 `PASSED（待规划复核）` 改为上表值：先 `knowledge/current-status.md`、`knowledge/session-handoff.md`，再 `version.json`、根 `README.md`/`CHANGELOG.md` 中确有该状态的位置，以及 memory 的 state/handoff/features/README。规划已先行改写 memory 四份，Executor 只核对，有偏差再修。
2. 回读 Server CI `41613030060` attempt 2 的最终结论和两仓 `releases/latest`。若 latest 已不是语义 Release `0.2.1`，恢复为 latest 并回读。attempt 2 仍失败且仍为 P62 竞态测试时，只在回执如实记录并关联既有待办，不修测试、不重发版本。
3. 在 `develop-sw` 提交推送本批（含规划写入的复核记录、归档移动和本方向），回读远端 SHA。
4. 回执 `product/0.2.1-bugfix/receipts/final-propagation-021-01.md`：覆盖矩阵（入口、写入值、回读）、CI/latest 回读结果、提交 SHA、memory 字节数（单份 <5KB、总量 <20KB）。

保护 Web `vite.config.ts` 在途改动与 UAT/本地既有服务；不读取或传播秘密。终态按 `.codex/governance/terminal-contract.json`。
