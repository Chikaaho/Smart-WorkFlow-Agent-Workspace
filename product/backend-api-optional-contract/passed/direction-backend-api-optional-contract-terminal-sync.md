# `backend-api-optional-contract` 阶段三终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-24）  
> 日期：2026-09-24  
> 性质：Phase 1 功能级 PASSED 后的机械状态同步；禁止重新实现或重验  
> 权威裁决：`../receipts/planning-review-completion-02-passed.md`

## 1. 目标

仅把已通过规划验收的 Phase 1 结果按唯一值同步到 knowledge、memory、交接与功能记录。不得修改后端/前端代码、测试、POM、数据库、证据、完成回执或总体架构方向，不得重跑 Maven、服务、数据库或浏览器验证。

## 2. 唯一终态值清单

| 字段 | 唯一目标值 |
|---|---|
| Phase 1 名称 | `backend-api-optional-contract` |
| Phase 1 状态 | `COMPLETED（规划已确认，2026-09-24）` |
| 功能级验收 | `PASSED（2026-09-24）`，15/15 |
| 总体任务 | `backend-architecture-optimization` |
| 总体任务状态 | `IN_PROGRESS` |
| 业务功能数 | `45`，不增加 |
| 功能清单 | `✅46 / 🟦22 / ⬜22`，总计 90，不改变 |
| P/I/ADV | 不新增、不核销、不改变；ADV64 保持独立计数 |
| Server 当前验证基线 | `1460 tests / 0 failures / 0 errors / 0 skipped`，`mvn -B test` exit 0，`BUILD SUCCESS` |
| Optional 专项基线 | 121 AM = 113 保留合规 + 8 删除闭合；守门 6/0/0/0；消费者 174、忽略 0、exit 0；AM-107 3/0/0/0；受影响模块 295/0/0/0 |
| Migration 当前验证基线 | H2：15/0/0/0、96 migrations、终点 V95；PostgreSQL：12/0/0/0、94 migrations、终点 V95；migration 文件零改动 |
| Web 验证基线 | 本 Phase 未涉及、未重验；保留既有 `1217 passed + 3 skipped`，不得表述为本轮结果 |
| Git/发布状态 | Server `develop` HEAD `76dc947` 上存在 194 tracked + 17 untracked 的未提交工作树；本 Phase 未 commit/push/merge/tag/Release/部署 |
| Phase 1 主方向 | `product/backend-api-optional-contract/passed/direction-backend-api-optional-contract.md` |
| 本终态同步方向 | 执行后仍在 `ready/`；Planner 复核通过后移入 `passed/` |
| 当前唯一下一动作 | Executor 执行 `search_task/backend-architecture-optimization-candidate-audit-01.md` 的只读 Phase 2 候选事实审计；不得直接实施 BAO-01—BAO-10 |
| memory 上限 | 每个短文件 `<5KB`，总量 `<20KB` |

## 3. 允许写入

仅允许为落实上表写入：

- `knowledge/current-status.md`；
- `knowledge/session-handoff.md`；
- `knowledge/features/backend-api-optional-contract.md`；
- 必要的 `knowledge/decisions.md`、`knowledge/known-issues.md` 与历史索引，仅限去除 Phase 1 当前态残留和登记上述单值；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，仅做相同值压缩；
- `product/backend-api-optional-contract/receipts/completion-backend-api-optional-contract-terminal-sync-01.md`。

不得写入 coding 仓、`search_task/`、`search_fallback/`、总体方向、已归档主方向或既有完成/规划回执。

## 4. 同步顺序与一致性

1. knowledge-first：先更新完整当前状态、功能记录和交接；
2. 再以相同单值压缩 memory；
3. 全文检查当前区不存在 Phase 1 的 `READY`、`VERIFYING`、`待验收`、旧回执下一动作或旧 Server 1423 基线作为当前值；
4. 历史段落可以保留旧状态和旧测试数字，但必须明确标注历史，不得与当前值竞争；
5. 总体任务继续 `IN_PROGRESS`，Phase 2 只是只读审计，不得写成十项整改已立项或实施中。

## 5. 验证与回执

只使用全文检索、路径存在性、字段勾稽和字节数检查验证同步结果，不运行工程测试。回执必须包含：

- 实际写入文件及 knowledge-first 顺序；
- 唯一值清单的目标值与实际值逐项对照；
- Phase 1 旧当前态残留的检索命令和零残留结果；
- 主方向、终态同步方向、两份规划审查和两份完成回执的路径事实；
- memory 压缩前后各文件及总字节数，证明单文件/总量上限；
- coding 仓、测试、Git 和远程动作零改动声明；
- 唯一物理末行合法终态：`state=TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`，并携带合法 `memory_compression`、`work_items`、`tool_results` 与 `browser_status=NOT_APPLICABLE`。

任一单值无法逐字落实时必须如实 `BLOCKED`，不得自行重新计算或修改规划清单。
