# Phase 6B 生产制品与开发运行边界 · 终态同步方向

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 方向状态：PASSED（规划终态同步复核通过，2026-09-26）  
> 日期：2026-09-26  
> 性质：Phase 6B 功能级 PASSED 后的机械状态同步；禁止重新实现或重验  
> 权威裁决：`../receipts/planning-review-completion-phase6b-02-passed.md`

## 1. 目标

仅把 Phase 6B 已通过的单一结果同步到 knowledge、memory、总体架构优化方向和交接记录。不得修改后端/前端代码、测试、POM、数据库、证据、执行回执、规划复核或已归档主方向，不得重跑 Maven、服务、数据库或浏览器验证。

## 2. 唯一终态值

| 字段 | 目标值 |
|---|---|
| Phase 6B 名称 | `production-artifact-isolation`（BAO-08 + BAO-10） |
| Phase 6B 状态 | `COMPLETED（规划已确认，2026-09-26）` |
| 功能级验收 | `PASSED（2026-09-26）`，10/10 |
| BAO-08/10 | 均 `COMPLETED`；H2/dev 运行边界、dev-only 物理隔离、生产构建与制品门禁闭合 |
| 总体任务 | `backend-architecture-optimization`，保持 `IN_PROGRESS` |
| Phase 1—6A | 保持既有 `COMPLETED` |
| H2/PG 定位 | H2 仅 test/dev 快速辅助；正式依赖与 Jar 中 H2 为 0；PostgreSQL 是生产权威 |
| 正式制品 | 入口 exit 0；prod marker；负向 10 项全 0、正向 6 项齐备；负向探针按预期失败 |
| dev 边界 | dev/local 配置、devseed、五个验证适配器与 IoT mock 仅在显式 dev 入口可用；dev H2 health 200 |
| IoT 生产语义 | prod 无 mock；IoT disabled/无 provider 可启动且操作 503 fail closed；tencent 缺凭据启动非零退出 |
| PostgreSQL 烟测 | PG 14.24；空库 95 migrations 至 V96；health 200；144 表；唯一临时库 DROP 回读 0 |
| Server 当前基线 | 32 模块，1570 tests / 0 failures / 0 errors / 0 skipped，`BUILD SUCCESS` |
| 证据基线 | 主证据 18/18、补证 16/16，现场回读通过；真实秘密 0 |
| Migration | 无新增迁移；仍为 V96，H2 97 migrations、PostgreSQL 95 migrations |
| 业务计数 | 功能数 45、清单 ✅46/🟦22/⬜22（90）、ADV64 均不变；不核销 P/I/ADV |
| 接受边界 | 不把 dev H2 外推为生产证明；不宣称腾讯 IoT 真实云端送达；版本身份留给 Phase 6C |
| 主方向 | `product/backend-architecture-optimization/passed/direction-phase6b-production-artifact-isolation.md` |
| 本同步方向 | 执行后仍在 `ready/`；Planner 复核通过后移入 `passed/` |
| 下一阶段 | Phase 6C 尚未授权实施；同步后由 Planner取得 Owner 版本策略裁决再下发方向 |
| 最终仓库展示项 | 继续 `QUEUED`，不得在本同步中执行 |
| memory 上限 | 每文件 `<5KB`，总量 `<20KB` |

## 3. 允许写入

仅允许按上表写入：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`、必要的 `knowledge/decisions.md` 与 `knowledge/known-issues.md`；
- `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`、`issues.md`，采用同值压缩；
- 总体方向 `ready/direction-backend-architecture-optimization.md`，仅更新 Phase 6B 行和当前下一动作；
- 新增 `receipts/completion-phase6b-production-artifact-isolation-terminal-sync-01.md`。

不得写 coding 仓、`search_task/`、`search_fallback/`、证据目录、执行完成回执、规划复核或已归档主方向。

## 4. 同步与验证

1. knowledge-first，再压缩同步 memory，最后更新总体方向；
2. 当前区不得残留 Phase 6B 的 `READY`、`IN_PROGRESS`、`VERIFYING`、待验收、待补证、mock 仍在生产、IoT disabled 不能启动、PG 未验或 1563 作为当前 Server 基线；历史回执与规划复核保留历史身份；
3. 保留总体任务 `IN_PROGRESS`、Phase 6C/Final 未实施、H2 仅 test/dev 辅助及 PostgreSQL 优先原则；
4. 当前唯一下一动作改为：Planner 请求 Owner 裁决 Phase 6C 版本策略（develop 使用下一版本 `SNAPSHOT`，或 Maven CI-friendly `${revision}`）；在 Owner 裁决和正式方向下发前不得实施 BAO-09；
5. PostgreSQL 只引用四个 `PG_*` 变量名，禁止写入连接值；
6. 只做全文检索、路径存在性、字段勾稽、Git 只读状态与字节数检查，不运行工程测试。

## 5. 回执

回执必须记录同步文件、单值逐项对照、旧当前态零残留、路径事实、memory 前后字节数及 coding 仓零修改证明。最后一个非空物理行必须是唯一：

`ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2",...}`

其中 `state=TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`，并含合法 `memory_compression`、`work_items`、`tool_results`、`browser_status=NOT_APPLICABLE`。不得自行归档本同步方向、启动 Phase 6C 或执行 Final。
