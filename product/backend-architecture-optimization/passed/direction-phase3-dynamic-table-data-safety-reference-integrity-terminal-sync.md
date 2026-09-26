# Phase 3 动态宽表数据安全与引用完整性 · 终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-24）  
> 日期：2026-09-24  
> 性质：Phase 3 功能级 PASSED 后的机械状态同步；禁止重新实现或重验  
> 权威裁决：`../receipts/planning-review-completion-phase3-01-passed.md`

## 1. 目标

仅把已通过规划验收的 Phase 3 结果按唯一值同步到 knowledge、memory、交接和总体架构优化记录。不得修改后端/前端代码、测试、POM、数据库、证据、完成回执或已归档方向，不得重跑 Maven、服务、数据库或浏览器验证。

## 2. 唯一终态值清单

| 字段 | 唯一目标值 |
|---|---|
| Phase 3 名称 | `dynamic-table-data-safety-reference-integrity`（BAO-06/07） |
| Phase 3 状态 | `COMPLETED（规划已确认，2026-09-24）` |
| 功能级验收 | `PASSED（2026-09-24）`，17/17 |
| 总体任务 | `backend-architecture-optimization` |
| 总体任务状态 | `IN_PROGRESS` |
| Phase 1 / Phase 2 | 保持既有 `COMPLETED`，不得改写 |
| 业务功能数 | `45`，不增加 |
| 功能清单 | `✅46 / 🟦22 / ⬜22`，总计 90，不改变 |
| P/I/ADV | 不新增、不核销、不改变；ADV64 保持独立计数 |
| Server 当前验证基线 | `1493 tests / 0 failures / 0 errors / 0 skipped`，`mvn -B test` exit 0，`BUILD SUCCESS` |
| Phase 3 专项基线 | form-biz 159/0/0/0；bootstrap 110/0/0/0；受控入口守门+契约 17/0/0/0；H2 安全行为 9/0/0/0；PostgreSQL 并发 7/0/0/0；证据 14/14、行为输入 17/17 OK |
| Migration 当前验证基线 | H2：15/0/0/0、96 migrations、终点 V95；PostgreSQL：12/0/0/0、94 migrations、终点 V95；本阶段 migration 文件零改动 |
| Web 验证基线 | 本 Phase 未涉及、未重验；保留既有 `1217 passed + 3 skipped` 为历史基线，不得表述为本轮结果 |
| Git/发布状态 | Server `develop` HEAD `76dc947`；工作树 204 tracked 修改 + 22 untracked，tracked shortstat +3650/−1996；未 commit/push/merge/tag/Release/部署 |
| 接受的残余 | 10 秒锁/语句超时未配置化；极端多引用死锁以 1511 + 事务回滚兜底、无自动重试；H2 不承担 PG 锁语义证明 |
| Phase 3 主方向 | `product/backend-architecture-optimization/passed/direction-phase3-dynamic-table-data-safety-reference-integrity.md` |
| 本终态同步方向 | 执行后仍在 `ready/`；Planner 复核通过后移入 `passed/` |
| 当前活动任务 | `backend-architecture-optimization`，总体 `IN_PROGRESS`；Phase 3 不再列入活动实施项 |
| 当前唯一下一动作 | Planner 基于 BAO-05 审计事实形成 Phase 4“可靠业务事件”正式方向；在该方向下发前不得实施 BAO-05 |
| memory 上限 | 每个短文件 `<5KB`，总量 `<20KB` |

## 3. 允许写入

仅允许为落实上表写入：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`；
- 既有 `backend-architecture-optimization` 完整记录、必要的 `knowledge/decisions.md`、`knowledge/known-issues.md` 与历史索引，仅限登记上述单值、Phase 3 结果和残余边界；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，仅做相同值压缩；
- `product/backend-architecture-optimization/receipts/completion-phase3-dynamic-table-data-safety-reference-integrity-terminal-sync-01.md`。

不得写入 coding 仓、`search_task/`、`search_fallback/`、总体方向、已归档 Phase 3 方向或既有完成/规划回执。

## 4. 同步顺序与一致性

1. knowledge-first：先更新完整当前状态、总体任务记录和交接；
2. 再以相同单值压缩 memory；
3. 全文检查当前区不存在 Phase 3 的 `READY`、`IN_PROGRESS`、`VERIFYING`、`待验收`或 1460 作为当前 Server 基线；历史段落可保留旧值但必须标明历史；
4. Phase 1/2/3 均已完成，但总体任务仍为 `IN_PROGRESS`；不得提前写总体完成；
5. BAO-05 仅是下一规划对象，不得写成已授权实施、`READY` 或 `IN_PROGRESS`；
6. BAO-01—04、08—10 的既有审计裁决和去向不得改变。

## 5. 验证与回执

只使用全文检索、路径存在性、字段勾稽和字节数检查验证同步结果，不运行工程测试。回执必须包含：

- 实际写入文件及 knowledge-first 顺序；
- 唯一值清单的目标值与实际值逐项对照；
- Phase 3 旧当前态、旧 Server 当前基线和 BAO-05 提前实施状态的零残留检索；
- 主方向、终态同步方向、规划审查、完成回执和证据目录的路径事实；
- memory 压缩前后各文件及总字节数，证明单文件/总量上限；
- coding 仓、测试、Git 和远程动作零改动声明；
- 唯一物理末行合法终态：`state=TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`，并携带合法 `memory_compression`、`work_items`、`tool_results` 与 `browser_status=NOT_APPLICABLE`。

任一单值无法逐字落实时必须如实 `BLOCKED`，不得自行重新计算、选择下一阶段或修改规划清单。
