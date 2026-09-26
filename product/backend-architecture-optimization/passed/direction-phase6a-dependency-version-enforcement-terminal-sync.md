# Phase 6A 第三方版本集中化与 Enforcer 依赖收敛 · 终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-25）  
> 日期：2026-09-25  
> 性质：Phase 6A 功能级 PASSED 后的机械状态同步；禁止重新实现或重验  
> 权威裁决：`../receipts/planning-review-completion-phase6a-02-passed.md`

## 1. 目标

仅把 Phase 6A 已通过的单一结果同步到 knowledge、memory、总体架构优化方向和交接记录。不得修改后端/前端代码、测试、POM、数据库、证据、执行回执、规划复核或已归档主方向，不得重跑 Maven、服务、数据库或浏览器验证。

## 2. 唯一终态值

| 字段 | 目标值 |
|---|---|
| Phase 6A 名称 | `dependency-version-enforcement`（BAO-03 + BAO-04） |
| Phase 6A 状态 | `COMPLETED（规划已确认，2026-09-25）` |
| 功能级验收 | `PASSED（2026-09-25）`，8/8 |
| BAO-03/04 | 均 `COMPLETED`；第三方版本集中化、Enforcer 默认生命周期守门与依赖收敛已闭合 |
| 总体任务 | `backend-architecture-optimization`，保持 `IN_PROGRESS` |
| Phase 1—5 | 保持既有 `COMPLETED` |
| 版本集中化结果 | 五项业务/实现 POM 显式 version 为 0；Step A 2845 行解析集合逐项恒等；POI 在 Step B 收敛为 5.4.0 |
| Enforcer 结果 | 32/32 模块继承；在线/离线 `validate` 均成功；负向探针按预期失败；最终分叉 0/0 |
| 收敛结果 | 探索 14 项 + 新发现 `checker-qual` 全部收敛；无 production scope/exclusion 规避 |
| 兼容性结果 | Knowledge PDFBox→Tika 内存解析、Agent Spring AI Prompt/调用/usage 行为通过；定向 4/0/0/0 |
| Server 当前基线 | 32 模块，1563 tests / 0 failures / 0 errors / 0 skipped，`BUILD SUCCESS` |
| 证据基线 | 主证据 24/24、补证 10/10，现场回读通过；秘密扫描 CLEAN |
| Migration | 无新增迁移；仍为 V96，H2 97 migrations、PostgreSQL 95 migrations |
| 业务计数 | 功能数 45、清单 ✅46/🟦22/⬜22（90）、ADV64 均不变；不核销 P/I/ADV |
| 接受边界 | 不把离线兼容测试表述为真实云/模型服务送达；H2 生产隔离与 dev-only 制品边界留给 6B；版本身份留给 6C |
| 主方向 | `product/backend-architecture-optimization/passed/direction-phase6a-dependency-version-enforcement.md` |
| 本同步方向 | 执行后仍在 `ready/`；Planner 复核通过后移入 `passed/` |
| 下一阶段 | Phase 6B 尚未授权实施；终态同步通过后由 Planner 下发正式方向 |
| 最终仓库展示项 | 继续 `QUEUED`，不得在本同步中执行 |
| memory 上限 | 每文件 `<5KB`，总量 `<20KB` |

## 3. 允许写入

仅允许按上表写入：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`、必要的 `knowledge/decisions.md` 与 `knowledge/known-issues.md`；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，采用同值压缩；
- 总体方向 `ready/direction-backend-architecture-optimization.md`，仅更新 Phase 6A 行和当前下一动作；
- 新增 `receipts/completion-phase6a-dependency-version-enforcement-terminal-sync-01.md`。

不得写 coding 仓、`search_task/`、`search_fallback/`、证据目录、执行完成回执、规划复核或已归档主方向。

## 4. 同步与验证

1. knowledge-first，再压缩同步 memory，最后更新总体方向；
2. 当前区不得残留 Phase 6A 的 `READY`、`IN_PROGRESS`、`VERIFYING`、待验收、待补证或 1559 作为当前 Server 基线；历史回执与规划复核保留历史身份；
3. 保留总体任务 `IN_PROGRESS`、Phase 6B/6C 未实施、H2 的 test/dev 辅助定位和 PostgreSQL 优先原则；
4. 当前唯一下一动作改为：Planner 下发 Phase 6B 生产制品隔离正式方向；在新方向下发前不得实施 BAO-08/10。最终仓库展示项继续排在所有架构实施阶段之后；
5. PostgreSQL 只引用四个 `PG_*` 变量名，禁止写入连接值；
6. 只做全文检索、路径存在性、字段勾稽、Git 只读状态与字节数检查，不运行工程测试。

## 5. 回执

回执必须记录同步文件、单值逐项对照、旧当前态零残留、路径事实、memory 前后字节数及 coding 仓零修改证明。最后一个非空物理行必须是唯一：

`ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2",...}`

其中 `state=TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`，并含合法 `memory_compression`、`work_items`、`tool_results`、`browser_status=NOT_APPLICABLE`。不得自行归档本同步方向或启动 Phase 6B。
