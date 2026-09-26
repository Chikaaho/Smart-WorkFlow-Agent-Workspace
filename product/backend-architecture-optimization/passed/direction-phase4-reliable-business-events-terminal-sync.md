# Phase 4 可靠业务事件交付收口 · 终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-24）  
> 日期：2026-09-24  
> 性质：Phase 4 功能级 PASSED 后的机械状态同步；禁止重新实现或重验  
> 权威裁决：`../receipts/planning-review-completion-phase4-03-passed.md`

## 1. 目标

仅把已通过规划验收的 Phase 4 结果按唯一值同步到 knowledge、memory、交接和总体架构优化记录。不得修改后端/前端代码、测试、POM、数据库、证据、完成回执、规划审查或已归档主方向，不得重跑 Maven、服务、数据库或浏览器验证。

## 2. 唯一终态值清单

| 字段 | 唯一目标值 |
|---|---|
| Phase 4 名称 | `reliable-business-events`（BAO-05） |
| Phase 4 状态 | `COMPLETED（规划已确认，2026-09-24）` |
| 功能级验收 | `PASSED（2026-09-24）`，21/21 |
| 总体任务 | `backend-architecture-optimization` |
| 总体任务状态 | `IN_PROGRESS` |
| Phase 1 / Phase 2 / Phase 3 | 保持既有 `COMPLETED`，不得改写 |
| 业务功能数 | `45`，不增加 |
| 功能清单 | `✅46 / 🟦22 / ⬜22`，总计 90，不改变 |
| P/I/ADV | 不新增、不核销、不改变；ADV64 保持独立计数 |
| Server 当前验证基线 | `1536 tests / 0 failures / 0 errors / 0 skipped`，`mvn -B -o test` exit 0，`BUILD SUCCESS`，13:43 |
| Phase 4 专项基线 | G3a 提交边界 3/0/0/0；G3b 启动窗口 3/0/0/0；事务事实 2/0/0/0；生命周期 7/0/0/0；双上下文恢复 1/0/0/0；流程接缝 9/0/0/0；交付接缝 8/0/0/0；机械守门 7/0/0/0；证据 26/26、行为输入 245/245 OK |
| Phase 4 受影响模块基线 | sw-common 32、sw-bpm-engine 61、sw-basic-job-biz 51、sw-basic-notify-biz 118、sw-basic-iot 50、sw-bpm-process 205、sw-biz-form-biz 159、sw-biz-openapi-biz 10；均 0/0/0 |
| Migration 当前验证基线 | H2：15/0/0/0、97 migrations、终点 V96；PostgreSQL：12/0/0/0、95 migrations、终点 V96；V95→V96 数据保留、默认值、唯一索引与失败恢复行为 3/0/0/0 |
| Web 验证基线 | 本 Phase 未涉及、未重验；保留既有 `1217 passed + 3 skipped` 为历史基线，不得表述为本轮结果 |
| Git/发布状态 | 工作区 `develop-sw@a46e4f3`；Server `develop@76dc947`；Server 225 tracked 修改 + 32 untracked；未 commit/push/merge/tag/Release/部署 |
| 接受的边界 | 外部五类通知 Provider 厂商真实送达仍为 Owner 延期；未来引入 `@DS` 或改变 Flowable DataSource/事务管理器时 G3a/G3b 快照失效；交付语义为至少一次 + 业务幂等，不承诺物理消息绝不重复 |
| Phase 4 主方向 | `product/backend-architecture-optimization/passed/direction-phase4-reliable-business-events.md` |
| 本终态同步方向 | 执行后仍在 `ready/`；Planner 复核通过后移入 `passed/` |
| 当前活动任务 | `backend-architecture-optimization`，总体 `IN_PROGRESS`；Phase 4 不再列入活动实施项 |
| 当前唯一下一动作 | Planner 下发 BAO-02 当前模块边界复核探索，作为 Phase 5 是否拆分 IoT API/Biz 的决策输入；在新方向下发前不得实施 BAO-02 或其他 BAO |
| memory 上限 | 每个短文件 `<5KB`，总量 `<20KB` |

## 3. 允许写入

仅允许为落实上表写入：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`；
- 既有 `backend-architecture-optimization` 完整记录、必要的 `knowledge/decisions.md`、`knowledge/known-issues.md` 与历史索引，仅限登记上述单值、Phase 4 结果和接受边界；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，仅做相同值压缩；
- `product/backend-architecture-optimization/ready/direction-backend-architecture-optimization.md`，仅把 Phase 4 行更新为上述完成值和归档路径；
- `product/backend-architecture-optimization/receipts/completion-phase4-reliable-business-events-terminal-sync-01.md`。

不得写入 coding 仓、`search_task/`、`search_fallback/`、已归档 Phase 4 主方向、既有完成/规划回执或证据目录。

## 4. 同步顺序与一致性

1. knowledge-first：先更新完整当前状态、总体任务记录和交接；
2. 再以相同单值压缩 memory，最后更新总体方向 Phase 4 行；
3. 全文检查当前区不存在 Phase 4 的 `READY`、`IN_PROGRESS`、`VERIFYING`、`待验收`、G3a/G3b 待修复，或 1493/1530 作为当前 Server 基线；历史回执可保留旧值但必须保持历史身份；
4. Phase 1/2/3/4 均已完成，但总体任务仍为 `IN_PROGRESS`，不得提前写总体完成；
5. BAO-02 只是下一规划探索对象，不得写成已授权实施、`READY` 或 `IN_PROGRESS`；
6. BAO-01、BAO-03/04、BAO-08/09/10 的既有审计裁决和去向不得改变；
7. PostgreSQL 环境继续只引用四个 `PG_*` 变量，禁止把连接值写入任何同步文件或回执。

## 5. 验证与回执

只使用全文检索、路径存在性、字段勾稽和字节数检查验证同步结果，不运行工程测试。回执必须包含：

- 实际写入文件及 knowledge-first 顺序；
- 唯一值清单的目标值与实际值逐项对照；
- Phase 4 旧当前态、旧 Server 当前基线、G3a/G3b 待修复和 BAO-02 提前实施状态的零残留检索；
- 主方向、终态同步方向、规划审查、完成回执及 02/03 证据目录的路径事实；
- memory 压缩前后各文件及总字节数，证明单文件/总量上限；
- coding 仓、测试、Git 和远程动作零改动声明；
- 唯一物理末行合法终态：`state=TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`，并携带合法 `memory_compression`、`work_items`、`tool_results` 与 `browser_status=NOT_APPLICABLE`。

任一单值无法逐字落实时必须如实 `BLOCKED`，不得自行重新计算、选择下一阶段或修改规划清单。
