# backend-api-optional-contract（后端跨模块 API Optional 返回契约优化）

> 任务等级：XL（总体任务 `backend-architecture-optimization` 的 Phase 1）  
> 当前状态：**`COMPLETED（规划已确认，2026-09-24）`**，功能级验收 **`PASSED（2026-09-24）`，15/15**  
> 主方向（已归档）：`product/backend-api-optional-contract/passed/direction-backend-api-optional-contract.md`  
> 终态同步方向：`product/backend-api-optional-contract/ready/direction-backend-api-optional-contract-terminal-sync.md`（执行后仍在 `ready/`，Planner 复核通过后移入 `passed/`）  
> 权威裁决：`product/backend-api-optional-contract/receipts/planning-review-completion-02-passed.md`（前序 `planning-review-completion-01-verifying.md`）  
> 说明：本任务不新增/核销 P 编号、不改变业务功能数与清单计数、不改变 0.1.0 发布身份。

## 1 目标与边界

Owner 硬目标：后端所有 `-api` 模块中向其他模块提供调用或实现契约的方法，统一以非空 `java.util.Optional<T>` 作为模块内部结果类型；调用方显式处理 present / empty / exception。分层规范：`-api` 内部 `Optional<T>`，Controller/HTTP 边界继续 `Result<T>`，两者在应用边界显式转换，真实错误不吞为 empty。

非目标（方向 §3）：不改 HTTP 返回类型为 `Optional`、不建双签名兼容层、不重写业务流程/权限/数据库/前端、不把历史测试基线当本轮结果。

## 2 最终结果（规划已确认）

| 维度 | 权威值 |
|---|---|
| 账本闭合 | 121 个 AM ID = **113 保留并合规 + 8 删除并闭合**（删除项均为零生产调用 facade 方法）；逐项前后对照 `receipts/stage-a-contract-ledger-01.md` |
| 契约改造 | 6 个 `-api` 模块 35 个契约文件；新增 5 个公共结果类型（`MutationOutcome`、`BpmProcessStatus`、`JobExecutionOutcome`、`StorageMutationOutcome`、`SubmissionValidationOutcome`） |
| 影响面 | Server 工作树 194 tracked 修改 + 17 untracked 文件（211 个实际文件）；引用基线 134 个可解析文件中 132 个被修改 |
| Optional 架构守门 | 扫描 6 个 `-api` 模块产物（113 个契约方法）零违规；含 5 类故意违规反例（非 Optional / raw / `Optional<Void>` / 嵌套 / 公开 static 非 Optional）稳定失败的验证 |
| 调用方消费 | 消费者扫描 **174 个生产调用点、忽略 0、exit 0**；G1 收口时权威清单 27 处忽略调用全部显式消费（AM-107 显式 empty 分支 + 26 处 `orElseThrow` 断言） |
| 专项基线 | 守门 6/0/0/0；边界语义 8/0/0/0；system 专项 13/0/0/0；notify 118/0/0/0；AM-107 3/0/0/0；受影响模块 295/0/0/0 |
| Server 当前验证基线 | **1460 tests / 0 failures / 0 errors / 0 skipped**，`MAVEN_OPTS="-Xmx2g" mvn -B test` exit 0 / `BUILD SUCCESS` |
| Flyway 基线 | 随最终全量门禁通过：H2 15/0/0/0、96 migrations、终点 **V95**；PostgreSQL 12/0/0/0、94 migrations、终点 **V95**；migration 文件零改动 |
| Web 基线 | 本 Phase 未涉及、未重验；保留既有 **1217 passed + 3 skipped**（不得表述为本轮结果） |
| Git/发布 | Server `develop` HEAD `76dc947`；本 Phase 未 commit/push/merge/tag/Release/部署；0.1.0 发布身份与基线锁定不变 |
| 回执 | `receipts/completion-backend-api-optional-contract-01.md`、`completion-backend-api-optional-contract-02.md`、`completion-backend-api-optional-contract-evidence-supplement-01.md`、`completion-backend-api-optional-contract-terminal-sync-01.md` |

## 3 迁移前既有缺陷修复（阻塞全量门禁，与契约改造无关）

1. **V95 迁移断言静态漂移**：0.1.1 列车新增 V94/V95 后，`FlywayFullChainH2Test`/`FlywayFullChainPostgresTest`/`I6G7UpgradeDrillH2Test`/`I6G7bOldBaselineUpgradePostgresTest` 仍断言旧链尾、旧计数与 V95 规范化前的菜单路径。已把期望值对齐到迁移链实际与 V95 脚本声明的目标（H2 全链 96、PG 全链 94、链尾 V95、增量计数 +1、`agent/model`/`agent/tool`/`notify/batch-send`）。
2. **notify I6 引导测试类顺序依赖**：`I6G1a→G1b→G1c` 共享文件 H2 库模拟跨 JVM 重启，原依赖 surefire 文件系统顺序。已在 `sw-basic-notify-biz/src/test/resources/junit-platform.properties` 固定类名升序。

两项均可在迁移前工作树复现（迁移前 `mvn -B test` = BUILD FAILURE：notify 2 errors + bootstrap 3 failures）。

## 4 观察项（非本任务范围）

- `SysDictDataService#resolveLabel` 内部服务方法在 `DictFacade#resolveLabel` 删除后无生产调用者；不是 `-api` 契约方法，按“不做无关重构”保留。
- `ApprovalLifecycleServiceImpl` 补签场景保留 `getTask(...).orElseGet(...)`：empty 在此是业务结论（补签记录非 Flowable 任务），非哨兵复原。
- 动态表租户隔离/逻辑删除与 REFERENCE 并发完整性等 10 项扫描发现仅登记为 BAO-01—BAO-10 候选，未经审计不得表述为已确认缺陷。

## 5 后续边界

Phase 1 已 `COMPLETED（规划已确认，2026-09-24）`；唯一下一动作是 Executor 执行 `search_task/backend-architecture-optimization-candidate-audit-01.md` 的**只读** Phase 2 候选事实审计，**不得直接实施** BAO-01—BAO-10；总体任务 `backend-architecture-optimization` 保持 `IN_PROGRESS`。
