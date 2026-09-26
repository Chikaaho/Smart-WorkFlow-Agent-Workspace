# 后端架构优化重构 · 总体终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-26）  
> 日期：2026-09-26  
> 性质：Phase 1—6C 与 Final 均已通过后的机械总状态同步；禁止重新实现或重验  
> Final 权威裁决：`../receipts/planning-review-completion-final-03-passed.md`
> 终态复核：`../receipts/planning-review-completion-backend-architecture-optimization-terminal-sync-01-passed.md`

## 1. 目标

仅把 Final 与 `backend-architecture-optimization` 总体任务的已通过结果同步到 knowledge、memory、总体方向、todo 和交接记录。不得修改 coding 仓、GitHub 元数据、测试、POM、workflow、脚本、数据库、证据、执行回执、规划复核或已归档方向，不得重跑 Maven、服务、数据库、浏览器或远端写操作。

## 2. 唯一终态值

| 字段 | 目标值 |
|---|---|
| 总体任务 | `backend-architecture-optimization` |
| 总体状态 | `COMPLETED（规划已确认，2026-09-26）` |
| Final 状态 | `COMPLETED（规划已确认，2026-09-26）` |
| Final 功能级验收 | `PASSED（2026-09-26）`，8/8 |
| Phase 1—6C | 保持既有 `COMPLETED` 与各自已锁定验收结论 |
| BAO-01 | `DEFERRED`：审计为 `PARTIAL`；传递依赖污染成立、API 类型污染不成立，当前不拆 `sw-common` |
| BAO-02 | `PARTIAL`：IoT API 边界已完成；Knowledge/Agent 不机械拆分，保留后续按活调用面立项 |
| BAO-03/04 | `COMPLETED`：第三方版本集中化、Enforcer 生命周期守门与依赖收敛 |
| BAO-05 | `COMPLETED`：五道 must-deliver 接缝完成可靠交付收口 |
| BAO-06/07 | `COMPLETED`：动态宽表数据安全与并发引用完整性收口 |
| BAO-08/10 | `COMPLETED`：H2/dev 与生产制品边界、dev-only 物理隔离、生产门禁与 fail-closed |
| BAO-09 | `COMPLETED`：CI-friendly `${revision}`、可消费 POM 与版本同源链 |
| 后端 About | `Enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications, agent workflows and IoT integration.` |
| 前端 About | `Web console for an enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications and IoT integration.` |
| 后端 canonical URL | `https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server`；placeholder 残留 0 |
| Final 证据 | 主包 7/7、补证包 3/3 哈希通过；物理文件 9、5；POM 8/8 hunks 已归属；真实秘密 0 |
| Server 当前基线 | 1570 tests / 0 failures / 0 errors / 0 skipped，`BUILD SUCCESS` |
| Migration | 无新增；仍为 V96，H2 97 migrations、PostgreSQL 95 migrations |
| H2/PG 定位 | H2 仅 test/dev 快速辅助；PostgreSQL 为生产权威 |
| 业务计数 | 功能数 45、清单 ✅46/🟦22/⬜22（90）、ADV64 均不变；不核销 P/I/ADV |
| Git/发布边界 | GitHub About 已授权更新；未 commit/push/merge/tag/Release/deploy，后端 POM 仍为本地工作树变更 |
| 活动功能 | 无；总体任务进入已完成集合 |
| 当前唯一下一动作 | Executor 仅执行本终态同步方向并提交回执 |
| 同步完成后的唯一下一动作 | 无自动工程动作；等待 Owner 另行决定下一任务或明确授权 Git 提交/推送/发布 |
| Final 主方向 | `product/backend-architecture-optimization/passed/direction-final-repository-presentation-hygiene.md` |
| 总体主方向 | 执行后仍在 `ready/direction-backend-architecture-optimization.md`；Planner 终态复核通过后移入 `passed/` |
| 本同步方向 | 执行后仍在 `ready/`；Planner 终态复核通过后移入 `passed/` |
| todo 登记 | `todo/repository-presentation-hygiene-final.md` 改为 `COMPLETED`，指向 Final 已归档方向与规划验收 |
| memory 上限 | 每个短记忆文件 `<5KB`，总量 `<20KB` |

## 3. 允许写入

仅允许按上表写入：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`、必要的 `knowledge/decisions.md` 与 `knowledge/known-issues.md`；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，采用同值压缩；
- `ready/direction-backend-architecture-optimization.md`，只更新总体状态、Final 行、10 项最终去向与当前下一动作；
- `todo/repository-presentation-hygiene-final.md`，只更新终态和归档指针；
- 新增 `receipts/completion-backend-architecture-optimization-terminal-sync-01.md`。

不得写 coding 仓、GitHub、`search_task/`、`search_fallback/`、证据目录、既有回执、规划复核或已归档方向。

## 4. 同步与验证

1. knowledge-first，再同步 memory、总体方向与 todo；
2. 当前区不得残留总体任务/Final 的 `READY`、`IN_PROGRESS`、`VERIFYING`、待补证、待同步或旧唯一下一动作；历史回执和复核保留历史身份；
3. 10 项候选最终去向必须恰为：1 个 `DEFERRED`（BAO-01）、1 个 `PARTIAL`（BAO-02）、8 个 `COMPLETED`（BAO-03—10）；不得把延期/部分完成伪写为全部完成；
4. 保留 BAO-01/02、外部通知 Provider、腾讯 IoT 真实云端送达、PG 优先/H2 辅助、公开版本仍 0.1.0 等既有边界；
5. 当前活动功能改为空，下一动作改为等待 Owner；不得把未授权 Git 操作写成自动下一步；
6. PostgreSQL 只引用 `PG_*` 变量名，禁止写入连接值；
7. 只做全文检索、路径存在性、字段勾稽、Git 只读状态与字节数检查，不运行工程或远端写操作。

## 5. 回执

回执必须记录同步文件、唯一值逐项对照、10 项最终去向复算、旧当前态零残留、路径事实、memory 前后字节数及 coding 仓/GitHub 零写入证明。最后一行必须为合法 `ENGINE_TERMINAL`：

- `state=TERMINAL_SYNC_SUBMITTED`
- `feature_status=COMPLETED`
- `remaining_actionable_count=0`
- `next_action_type=WAIT_PLANNER`
- 包含合法 `memory_compression`、`work_items`、`tool_results`
- `browser_status=NOT_APPLICABLE`

不得自行移动总体主方向或本同步方向到 `passed/`，不得 commit/push/merge/tag/Release/deploy。
