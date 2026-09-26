# Phase 5 IoT API 模块边界抽取 · 终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-25）  
> 日期：2026-09-25  
> 性质：Phase 5 功能级 PASSED 后的机械状态同步；禁止重新实现或重验  
> 权威裁决：`../receipts/planning-review-completion-phase5-03-passed.md`

## 1. 目标

仅把 Phase 5 已通过的单一结果同步到 knowledge、memory、总体架构优化方向和交接记录。不得修改后端/前端代码、测试、POM、数据库、证据、完成回执、规划复核或已归档主方向，不得重跑 Maven、服务、数据库或浏览器验证。

## 2. 唯一终态值

| 字段 | 目标值 |
|---|---|
| Phase 5 名称 | `iot-api-boundary-extraction`（BAO-02-IoT） |
| Phase 5 状态 | `COMPLETED（规划已确认，2026-09-25）` |
| 功能级验收 | `PASSED（2026-09-25）`，8/8 |
| BAO-02 最终裁决 | `PARTIAL`：IoT 完成；Knowledge/Agent 不拆分 |
| 总体任务 | `backend-architecture-optimization`，保持 `IN_PROGRESS` |
| Phase 1/2/3/4 | 保持既有 `COMPLETED` |
| 模块结果 | 新增零基础设施依赖 `sw-basic-iot-api`；4 接口 + 1 事件；7/7 Optional；`sw-basic-iot` 原地保留实现 |
| 依赖结果 | BPM→完整 IoT、MQTT/Paho、GraalJS、Tencent SDK 均为 0；entity/mapper 跨模块生产引用为 0；fastjson2 为 BPM 直接依赖 |
| 装配结果 | 四类契约 Bean 各 1；三个 facade 来自 IoT 实现，反向 SPI 来自 BPM；Controller 注入同一单例；无循环/重复/缺 Bean |
| 可靠性结果 | 事务内意图失败时审批回滚；持久化后发送失败保留审批并进入 FAILED/重试恢复；Phase 4 接缝守门保持 |
| Server 当前基线 | 32 模块，1559 tests / 0 failures / 0 errors / 0 skipped，`BUILD SUCCESS` |
| 证据基线 | behavior-input 30/30、evidence 20/20，现场回读 exit 0；秘密扫描 CLEAN |
| Migration | 无新增迁移；仍为 V96，H2 97 migrations、PostgreSQL 95 migrations |
| 业务计数 | 功能数 45、清单 ✅46/🟦22/⬜22（90）、ADV64 均不变；不核销 P/I/ADV |
| 接受边界 | `agent→knowledge` 死边后续独立；fastjson2 局部版本待 BAO-03；IoT 原始异常文本脱敏为后续安全观察项；历史 PG `08006` 日志保留 |
| 主方向 | `product/backend-architecture-optimization/passed/direction-phase5-iot-api-boundary-extraction.md` |
| 本同步方向 | 执行后仍在 `ready/`；Planner 复核通过后移入 `passed/` |
| 最终仓库展示项 | 继续 `QUEUED`，不得在本同步中执行 |
| memory 上限 | 每文件 `<5KB`，总量 `<20KB` |

## 3. 允许写入

仅允许按上表写入：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`、必要的 `knowledge/decisions.md` 与 `knowledge/known-issues.md`；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，采用同值压缩；
- 总体方向 `ready/direction-backend-architecture-optimization.md`，仅更新 Phase 5 行与当前下一动作；
- 新增 `receipts/completion-phase5-iot-api-boundary-extraction-terminal-sync-01.md`。

不得写 coding 仓、`search_task/`、`search_fallback/`、证据目录、完成回执 01/02/03、规划复核或已归档主方向。

## 4. 同步与验证

1. knowledge-first，再压缩同步 memory，最后更新总体方向；
2. 当前区不得残留 Phase 5 的 `READY`、`IN_PROGRESS`、`VERIFYING`、待验收、待补证或 1536/1555 作为当前 Server 基线；历史回执和规划复核保留历史身份；
3. 保留 BAO-02 `PARTIAL`、Knowledge/Agent 不拆、BAO-03 等候选未完成以及总体任务 `IN_PROGRESS`；
4. 当前唯一下一动作改为：Planner 决定 Phase 6 构建/制品治理的正式前置探索；在新方向下发前不得实施其他 BAO。最终仓库展示项继续排在所有架构实施阶段之后；
5. PostgreSQL 只引用四个 `PG_*` 变量名，禁止写入连接值；
6. 只做全文检索、路径存在性、字段勾稽、Git 只读状态与字节数检查，不运行工程测试。

## 5. 回执

回执必须记录同步文件、单值逐项对照、旧当前态零残留、路径事实、memory 前后字节数及 coding 仓零修改证明。最后一个非空物理行必须是唯一：

`ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2",...}`

其中 `state=TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`，并含合法 `memory_compression`、`work_items`、`tool_results`、`browser_status=NOT_APPLICABLE`。不得自行归档本同步方向或启动 Phase 6。
