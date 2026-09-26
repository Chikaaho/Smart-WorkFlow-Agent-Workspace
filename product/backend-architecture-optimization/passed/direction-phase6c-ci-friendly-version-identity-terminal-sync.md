# Phase 6C CI-friendly 版本身份 · 终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-26）  
> 日期：2026-09-26  
> 性质：Phase 6C 功能级 PASSED 后的机械状态同步；禁止重新实现或重验  
> 权威裁决：`../receipts/planning-review-completion-phase6c-03-passed.md`
> 终态复核：`../receipts/planning-review-completion-phase6c-terminal-sync-01-passed.md`

## 1. 目标

仅把 Phase 6C 已通过的单一结果同步到 knowledge、memory、总体架构优化方向和交接记录。不得修改后端/前端代码、测试、POM、workflow、脚本、数据库、证据、执行回执、规划复核或已归档主方向，不得重跑 Maven、构建、服务、数据库或浏览器验证。

## 2. 唯一终态值

| 字段 | 目标值 |
|---|---|
| Phase 6C 名称 | `ci-friendly-version-identity`（BAO-09） |
| Phase 6C 状态 | `COMPLETED（规划已确认，2026-09-26）` |
| 功能级验收 | `PASSED（2026-09-26）`，10/10 |
| BAO-09 | `COMPLETED`；CI-friendly `${revision}`、可消费 POM、版本同源链与 fail-closed 门禁闭合 |
| 总体任务 | `backend-architecture-optimization`，保持 `IN_PROGRESS` |
| Phase 1—6B | 保持既有 `COMPLETED` |
| develop 版本 | 默认 effective version `0.2.0-SNAPSHOT`，32/32 一致 |
| release 版本 | 显式 `revision=0.2.0`，32/32 一致；正式制品、Release 标题/说明与上传名同源 |
| POM/Flatten | 34/34 工程版本表达式统一；Flatten `resolveCiFriendliesOnly`；release install 32 项目成功，仓外 consumer 解析 `sw-basic-iot-api:0.2.0` |
| 负向能力 | 未解析 revision、release SNAPSHOT、单模块父版本分叉、Release 元数据不一致四向均非零失败 |
| 正式制品 | 唯一生产入口最后执行且 exit 0；216897994 bytes；sha256 `4fd3174c20a87a88e3a98a7638cb4f999527440030229c1aaeafbd72b0e1b0f1`；`build.profile=prod`、`build.version=0.2.0` |
| Phase 6B 制品门禁 | 负向 10 项全 0、正向 6 项齐备，继续成立 |
| Server 当前基线 | 1570 tests / 0 failures / 0 errors / 0 skipped，`BUILD SUCCESS` |
| 证据基线 | 主证据 17/17、补证 10/10、纠正证据 6/6 哈希回读通过；物理文件分别 19、12、8；真实秘密 0 |
| Migration | 无新增迁移；仍为 V96，H2 97 migrations、PostgreSQL 95 migrations |
| 业务计数 | 功能数 45、清单 ✅46/🟦22/⬜22（90）、ADV64 均不变；不核销 P/I/ADV |
| 历史引用 | 不修改 branch/tag/Release；不声称远端 develop 已同步，不推断 ahead/behind |
| 活动功能 | `backend-architecture-optimization` 继续为唯一主任务；Phase 6C 完成后仅剩 Final 展示收口 |
| 主方向 | `product/backend-architecture-optimization/passed/direction-phase6c-ci-friendly-version-identity.md` |
| 本同步方向 | 执行后仍在 `ready/`；Planner 复核通过后移入 `passed/` |
| 当前唯一下一动作 | Executor 仅执行本终态同步方向并提交同步回执 |
| 同步完成后的唯一下一动作 | Planner 将 `todo/repository-presentation-hygiene-final.md` 转为独立正式方向；在正式方向下发前不得执行 Final |
| memory 上限 | 每个短记忆文件 `<5KB`，`memory/` 总量 `<20KB` |

## 3. 允许写入

仅允许按上表写入：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`、必要的 `knowledge/decisions.md` 与 `knowledge/known-issues.md`；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，采用同值压缩；
- 总体方向 `ready/direction-backend-architecture-optimization.md`，仅把 Phase 6C 更新为 `COMPLETED` 并把唯一下一动作切换为 Planner 下发 Final 正式方向；
- 新增 `receipts/completion-phase6c-ci-friendly-version-identity-terminal-sync-01.md`。

不得写 coding 仓、`todo/`、`search_task/`、`search_fallback/`、证据目录、执行完成回执、规划复核或已归档主方向。

## 4. 同步与验证

1. knowledge-first，再压缩同步 memory，最后更新总体方向；
2. 当前区不得残留 Phase 6C 的 `READY`、`IN_PROGRESS`、`VERIFYING`、待补证、consumer POM 未冻结、当前 Boot Jar 身份不明或“最终生产制品待恢复”等旧当前态；历史回执与前两次规划复核保留历史身份；
3. 保留总体任务 `IN_PROGRESS`、Final `QUEUED`、BAO-01 延期、BAO-02 `PARTIAL`、H2 仅 test/dev 辅助及 PostgreSQL 优先原则；
4. 当前唯一下一动作改为：Planner 将 `todo/repository-presentation-hygiene-final.md` 转为独立正式方向；不得在本同步中直接修改 GitHub About 或后端根 POM URL；
5. PostgreSQL 只引用四个 `PG_*` 变量名，禁止写入连接值；
6. 只做全文检索、路径存在性、字段勾稽、Git 只读状态与字节数检查，不运行工程测试。

## 5. 回执

回执必须记录同步文件、单值逐项对照、旧当前态零残留、路径事实、memory 前后字节数及 coding 仓零修改证明。最后一个非空物理行必须是唯一：

`ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2",...}`

其中 `state=TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`，并含合法 `memory_compression`、`work_items`、`tool_results`、`browser_status=NOT_APPLICABLE`。不得自行归档本同步方向、启动或执行 Final。
