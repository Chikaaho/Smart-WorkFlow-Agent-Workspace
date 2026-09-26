# Phase 4 执行回执 02 · 可靠业务事件交付收口（关闭规划复核 G1—G6）

> 复核角色：执行（Executor）  日期：2026-09-24  任务级别：XL
> 方向：`product/backend-architecture-optimization/ready/direction-phase4-reliable-business-events.md`
> 上一回执：`completion-phase4-reliable-business-events-01.md`；复核记录：`planning-review-completion-phase4-01-verifying.md`
> **状态：`IN_PROGRESS / VERIFYING`（执行自验完成并提交；功能级验收由规划裁决，本回执不写 `PASSED/COMPLETED`）**

本轮把回执 01 的实现声明全部换成**可回读的真实 PostgreSQL 行为证据**，并在产出证据的过程中
暴露并修复了 14 项实现缺陷（其中 5 项会让对应接缝在生产语义方言上整体失效）。所有证据位于
`receipts/evidence/completion-phase4-02/`（30 个物理文件：17 份原始日志、5 份复算/身份/扫描产物、4 个脚本、4 份哈希与回读清单）。

---

## 1. G1—G6 关闭对照

| ID | 复核要求的完成条件 | 关闭判据（原始证据） | 结论 |
|---|---|---|---|
| G1 | 在真实 PostgreSQL 上逐项产生原子提交/回滚、提交后崩溃恢复、并发领取、租约回收、重复投递、重试耗尽、迟到完成隔离的行为日志，含反向断言 | `raw/lifecycle-behaviour.log`（7/7 通过，12 条 `[P4-EV]` 事实行）；`raw/restart-recovery.log`（双进程装载崩溃→重启恢复 1/1） | 关闭 |
| G2 | 六类可靠接缝 + Form 兜底各证明持久意图、恢复执行、幂等结果、失败终态与业务状态 | `raw/flow-seam-behaviour.log`（9/9：Scheduled FLOW、IoT 规则、IoT 脚本、表单权威路径、通知意图）、`raw/delivery-seam-behaviour.log`（8/8：设备命令、通知投递、OpenAPI 回调） | 关闭 |
| G3 | 用运行时断言证明 Flowable 回调是否处于实际事务；必要时调整为能原子落持久意图的路径 | `raw/flowable-tx-fact.log`（2/2）：回调链运行时探针观测 `actualTransactionActive=true`；提交→意图可见，回滚→零孤儿意图。**并新增一项实测事实：引擎自身提交边界与应用事务边界分离**（见 §9） | 关闭（含新暴露风险，交规划裁决） |
| G4 | 11/11 发布点矩阵 + must-deliver 零未分类旁路复算 | `publish-matrix.tsv`（11 行全部分类完成）、`unclassified-bypass-scan.txt`（`ACCEPTED`，退出码 0）、`raw/rules-gate.log`（机械守门 7/7，含新增 P4-7） | 关闭 |
| G5 | H2/PG clean migrate、V95→V96 升级、既有记录保留/默认值/唯一性行为、迁移失败恢复边界的原始输出 | `raw/migration-behaviour.log`（3/3，含既有数据保留、新列默认值、唯一索引拒绝重复、失败边界）；`raw/h2-full-chain.log`、`raw/pg-full-chain.log` | 关闭 |
| G6 | 命令/cwd/退出码/逐项计数/原始日志/输入与证据哈希（含回读）/工作树身份 | `command-results.tsv`（17 条命令逐条记录 cwd/exit/耗时/日志/行数）、`behavior-input.sha256`+`.check`（243 项全 OK）、`evidence.sha256`+`.check`（26 项全 OK）、`workspace-identity.txt`、`secrets-scan.txt` | 关闭 |

环境前置：真实 PostgreSQL 可用（方向 §7），连接参数只从工作区外私有环境文件读取；本轮**变量齐备，无环境阻塞、无 Owner 输入需求**。固定验证库为 `sw_p4_evidence`（本阶段专用，服务器上既有库未被触碰）。

---

## 2. 真实数据库行为证据（方向 §5.B / §5.C / §5.D.2）

数据库身份（脱敏，来自原始日志）：`postgres/14.24 (Ubuntu 14.24-0.22.04.1) db=sw_p4_evidence`。

### 2.1 七类生命周期行为（`sw_bpm_command`，真实 PostgreSQL）

| 行为 | 正向断言 | 反向断言 | 证据行 |
|---|---|---|---|
| 原子提交 | 业务事务提交后意图行可见（`PENDING`，租户正确） | —— | `g1.atomic-commit rows=1 tenant=0` |
| 业务回滚 | 回滚后同一幂等身份可重新受理 | **回滚后孤儿任务数 = 0** | `g1.business-rollback orphanRowsAfterRollback=0` |
| 提交后崩溃恢复 | 消费者崩溃留下的 `PROCESSING` 被回收并重新领取 | 崩溃持有者不再持有租约 | `g1.stale-claim-reclaim reclaimed=1 recoveredByNewClaim=true` |
| 并发领取 | 4 线程竞争同一意图：`winners=1` | 状态/令牌与唯一获胜者一致 | `g1.concurrent-claim workers=4 winners=1` |
| 租约回收 + 迟到完成隔离 | 回收后新持有者写回生效（`COMPLETED`） | **旧令牌的 `complete`/`failAndScheduleRetry` 均被拒，不覆盖新持有者** | `g1.lease-reclaim staleTokenRejected=true staleFailRejected=true` |
| 重复投递 | 唯一索引命中，返回既有命令号 | **重复受理被拒且只有 1 行** | `g1.duplicate-delivery duplicateRejected=true rows=1` |
| 重试与耗尽 | 退避期内不可领取、到点后可领取；3 次尝试后进入终态 | **终态后不可再领取；`failure_reason`/`finished_at` 可审计** | `g1.retry-exhaustion terminal=FAILED claimableAfterTerminal=0` |

进程级崩溃/重启（G1b，双真实应用上下文 + 真实 Quartz 任务 + 真实引擎）：
`process-a-exit commandStatus=PENDING instances=0` → 关闭上下文 → `process-b-recovered commandStatus=COMPLETED engineInstance=1 swBpmInstances=1`，
且重启后命令租户归属不变、无第二条实例。

### 2.2 逐接缝端到端（方向 §5.D.3）

| 接缝 | 持久意图 | 恢复执行 | 幂等结果 | 失败/终态 | 业务状态 | 证据行 |
|---|---|---|---|---|---|---|
| Scheduled FLOW | `sw_bpm_command` `SCHEDULED_FLOW:{jobId}:{fireTime}` | 调度器消费→真实流程实例 | 重放返回 `SKIP_DUPLICATE`，实例仍为 1 | 无启用绑定→Job 日志 `FAILED` 且零意图（禁止静默成功） | `sw_bpm_instance` + `act_hi_procinst` 同时存在 | `g2.scheduled-flow*`（3 项） |
| IoT 规则 | `sw_iot_process_trigger`（含恢复身份三列） | 恢复调度认领→重投→监听器 | 同 `dedupKey` 重复消息仍 1 行/1 实例 | 恢复轮二次运行不产生第二实例 | 触发行 `SUCCESS` + `process_instance_id` + `sw_bpm_instance` | `g2.iot-rule`、`g2.iot-crash-recovery`、`g2.iot-stale-reclaim` |
| IoT 脚本 | `realRun` 登记 `PENDING` 触发行（含恢复身份） | 恢复调度续跑成功 | 试运行（`dryRun`）不登记任何意图 | —— | 脚本触发形成真实流程实例 | `g2.iot-script`（含 `dryRunIntentRows` 不变） |
| 审批设备命令 | `sw_iot_device_command`，幂等键 `APPROVAL:{pi}:{device}:{commandKey}` | 补偿调度真实领取并发起重试 | 重复投递仍 1 条；审批回滚 → 0 条 | 崩溃滞留 `SENDING` 被租约回收后续跑（`statusAfterStaleReclaim=FAILED`） | 指令落 `QUEUED` 且携带审批业务身份 | `g2.device-command*`（2 项） |
| 通知意图 | 外部渠道先落 `PENDING`+`RETRYABLE` 意图（无渠道 I/O） | 恢复投递轮接管 | 重复发布仍 1 条；审批回滚 → 0 条 | 无适配器→`NON_RETRYABLE`；预算耗尽→`RETRY_EXHAUSTED`；崩溃 `RESENDING` 被回收 | 站内信加速路径不产生第二条业务通知 | `g2.notify-*`（4 项） |
| OpenAPI 回调 | `sw_openapi_callback_task`（唯一索引 `uk_sw_openapi_cb_task`） | 恢复调度领取并投递到受控本机对端 | 重复发布仍 1 条任务；已投递任务不重复投递（`peerHits=1`） | 对端不可达→退避重试→`attempts=5`、`RETRY_EXHAUSTED`；崩溃 `SENDING` 被回收后成功 | 任务 `SUCCESS`+`delivered_at`+`sw_openapi_callback_log` 成功行 | `g2.openapi-*`（3 项） |
| Form 兜底退役 | 权威路径 `FLOW_START:{recordId}` 命令落库 | 调度器消费 | 无绑定表单：合法 no-op 且零意图 | —— | **提交全程零 `FormSubmittedEvent` 内存事件**（运行期登记监听器计数） | `g2.form-submit inMemoryFallbackEvents=0` |

外部对端声明：OpenAPI 回调证据使用**本机受控 HTTP 服务**，不冒称任何厂商真实送达；通知外部渠道在证据环境中**无生产适配器**，因此投递结论如实记为不可重试终态（未伪造成功）。

### 2.3 事务事实（G3，方向 §6）

- 运行时探针挂在真实回调链（下一审批节点 `create` 事件）上，直接读取 `TransactionSynchronizationManager.isActualTransactionActive()`：**`actualTransactionActive=true`**，即审批回调路径确实处于真实事务中（不再依赖注释推断）。
- 回调事务内发布的 must-deliver 事件由生产同事务记录器落持久意图：提交 → 意图 `=1`；回滚 → 意图与提交前一致（**零孤儿**）。
- 新增实测事实（回执 01 未具备）：**Flowable 引擎的提交边界与应用事务边界分离** —— 引擎绑定的是从 dynamic-datasource 抽取的物理 master DataSource，而应用事务由路由 DataSource 管理，两者 `ConnectionHolder` 不同；因此"引擎已推进 + 调用方回滚"会留下引擎状态而无对应意图。该现象已按实测记录并作为残余风险提交规划裁决（§9），本轮未做平台级事务统一改造。

### 2.4 迁移行为（G5，方向 §5.D.4）

| 项 | 事实 | 证据行 |
|---|---|---|
| clean migrate 终点 | `migrationsExecuted=95 targetVersion=96`，新表 + 3 个新索引 + 触发表 5 个新列齐备 | `g5.clean-migrate` |
| V95→V96 升级 | 升级前 2 行既有触发记录升级后仍为 2 行；`status`/`error` 原值保留；新列落默认值（`retry_count=0`、`next_retry_time` 为空） | `g5.upgrade` |
| 升级后唯一性 | 同 `(app_id,event,biz_ref)` 第二条回调任务被唯一索引拒绝 | `g5.upgrade-unique-index duplicateRejected=true` |
| H2/PG 全链 | H2 `FlywayFullChainH2Test` 15/15、PG `FlywayFullChainPostgresTest` 12/12（计数取原始日志） | `raw/h2-full-chain.log`、`raw/pg-full-chain.log` |
| 失败与恢复边界 | 故意损坏的 V97 在事务内整体回滚：**PostgreSQL 事务型 DDL 下不留 failed 历史行、版本不推进到失败版本**，既有数据不丢；修复后重跑直达终点且数据仍在（未以清空数据库证明迁移） | `g5.migration-failure`、`g5.migration-recovered` |

回滚边界声明：本阶段新增的持久结构（V96 两处）为**前向兼容新增**——旧行以默认值补齐、无列删除/无类型变更；迁移失败时按上述边界整体回滚，既有未完成任务与被保留数据不因回退而丢失。

### 2.5 身份

- 工作树身份：`workspace-identity.txt`（工作区 `develop-sw@a46e4f3`；server 仓 `develop@76dc947`，受跟踪改动 224 项、未跟踪 32 项）。
- 数据库身份：固定库 `sw_p4_evidence`，服务端 `14.24`；连接参数值零写入（见 §7）。

---

## 3. 行为证据暴露并修复的实现缺陷（14 项）

判定口径：只有在**真实 PostgreSQL 上先复现失败**、修复后**同一编排再次运行通过**的项，才计入本表。

| ID | 缺陷 | 修复前复现（原始日志） | 修复 | 修复后证据 |
|---|---|---|---|---|
| D1 | OpenAPI 回调任务无投递租约回收：领取后崩溃的任务永久滞留 `SENDING` | `statusAfterRecovery=SENDING`（修复前交付接缝用例失败） | `OpenApiCallbackRecoveryJob.reclaimStaleLeases()`（预算耗尽→`RETRY_EXHAUSTED`，否则回退可重试） | `g2.openapi-stale-sending statusAfterRecovery=FAILED` |
| D2 | 通知无投递租约回收：`RESENDING` 永久滞留 | `statusAfterRecovery=RESENDING` | `NotifyDeliveryRecoveryServiceImpl.reclaimStaleLeases()` + 领取刷新租约时间 | `g2.notify-stale-resending statusAfterRecovery=FAILED` |
| D3 | 设备命令无发送租约回收：`SENDING` 永久滞留（原注释声称有回收，实际无） | `statusAfterStaleReclaim=SENDING` | `CommandQueueService.findStaleSending/reclaimStaleSending` + `CommandCompensationJob.processStaleSending()` | `g2.device-command-retry statusAfterStaleReclaim=FAILED` 且当轮真实重试 |
| D4 | 通知重试预算耗尽不可见：`retry_count≥5` 的行既不在扫描集合内也无终态标记 | `failureClass=RETRYABLE`（`recoverDue` 不改判） | `NotifyDeliveryRecoveryServiceImpl.exhaustRetryBudget()` | `g2.notify-retry-exhausted failureClass=RETRY_EXHAUSTED nextRetryTime=null` |
| D5 | IoT 触发恢复的**认领**在无登录身份下 fail-closed，恢复链整体失效 | `IoT 触发恢复失败（下轮继续）: triggerId=94011, error=MyBatisSystemException` | `ProcessTriggerRecoveryJob.claim` 与 `findDue/reclaimStale` 同口径 | `g2.iot-crash-recovery status=SUCCESS instances=1` |
| D6 | OpenAPI 回调恢复的认领与投递写回同样 fail-closed | `回调恢复处理失败（留在可重试态，下轮继续）: error=MyBatisSystemException` | 恢复轮按任务自身租户还原执行边界（不逐一挂起过滤，避免抹掉多租户约束） | `g2.openapi-callback status=SUCCESS peerHits=1` |
| D7 | 设备命令补偿调度同因失效（领取/回写无法建立租户边界） | 用例抛 `MyBatisSystemException` | `CommandCompensationJob.withCommandTenant(...)` | `g2.device-command-retry retryCount` 递增 |
| D8 | 规则触发行缺少恢复身份三列，崩溃后不可恢复（`findDue` 要求 `process_template_key` 非空） | 断言失败"规则触发行必须携带恢复身份" | `RuleEngineService.fire` 写入 `process_template_key/trigger_source/configured_by/retry_count` | `g2.iot-rule recoveryIdentity=p4_iot_flow` |
| D9 | 规则幂等插入在 PostgreSQL 上**污染业务事务**：重复消息使摄入事务整体失败 | `ERROR: current transaction is aborted`（SQLState 25P02） | 新增 `com.sw.ck.common.persistence.IdempotentInsert`（SAVEPOINT 包装），规则与脚本路径共用 | 重复消息后降级分支可执行（`g2.iot-rule duplicateDeliveryInstances=1`） |
| D10 | 脚本路径持久化触碰已关闭的 JS 上下文：意图写入抛错 | `java.lang.IllegalStateException: The Context is already closed`（GraalJS） | `ScriptHostFunctions.funStartProcess` 在上下文存活期把表单快照深拷贝为普通结构 | `g2.iot-script recovered=SUCCESS engineInstance=1` |
| D11 | 调度线程无登录态导致任务定义读取 fail-closed：FLOW/BEAN 任务整体不可执行 | `MyBatisSystemException: 租户上下文缺失，拒绝生成租户过滤条件` | `SwJobBean`：定义按主键读取时挂起租户过滤，执行期按任务租户建立身份 | `g2.scheduled-flow jobLog=SUCCESS engineInstance=1` |
| D12 | `concurrent` 为 smallint 列而实体为 `Boolean`：PostgreSQL 上任务收尾更新必失败（H2 隐式转换掩盖） | `ERROR: column "concurrent" is of type smallint but expression is of type boolean` | 新增 `BooleanSmallintTypeHandler` + 字段级 `typeHandler` | `g2.scheduled-flow` 全链路成功（收尾更新不再报错） |
| D13 | 迟到写回可覆盖新持有者/降级终态 | 见 D1/D2 回收后时序 | 通知与回调的结论文写回绑定本次领取（状态 + 领取后的 `retry_count`/`attempts`）；`IotProcessTriggerFacadeImpl.markTriggerResult` 禁止 `SUCCESS→FAILED` 降级 | 反向断言在 D1/D2 用例中通过 |
| D14 | IoT 监听器缺少重复发起守卫：恢复重投存在重复创建流程实例的窗口 | 方向 §5.C.2 要求（"不能重复创建流程"） | 监听器按 `iot-{triggerId}` 业务键幂等短路（已存在实例即回写终态，不再次发起） | `g2.iot-rule`/`g2.iot-crash-recovery` 二次运行实例数不变 |

缺陷分类意义：D5/D6/D7（租户 fail-closed）与 D9（事务污染）、D11（调度无身份）在 H2 轻量回归与纯单元测试下均不可见，只有真实 PostgreSQL + 真实调度/引擎装载才会暴露——这正是规划复核要求 G1/G2/G3 补证的直接价值。

---

## 4. 发布点矩阵与零未分类旁路（G4）

- 复算脚本：`scripts/p4-publish-matrix.sh`（只读；被复核方可重跑）；产物 `publish-matrix.tsv`（11/11）与 `unclassified-bypass-scan.txt`（`ACCEPTED`，退出码 0）。
- 矩阵列：发布点 → 事件 → 事务边界 → 持久结构 → 领取者 → 幂等键 → 业务结果 → 重试/终态 → 分类 → 结构校验；11 个发布点分类为 10 × 必须交付 + 1 × 普通（表单内存兜底退役），全部 `PASS`。
- 零旁路口径：每个仍发布的 must-deliver 事件都必须存在事务内记录器/监听者；两个内存兜底事件（`ScheduledFlowTriggerEvent`、`FormSubmittedEvent`）必须**零裸发布**。脚本对 30 余条结构事实做断言（含"设备命令幂等键不含 UUID""补偿必须原子领取"等），任一失败即以非零退出。

## 5. 机械守门（防回退）

`ReliableEventGateTest` 本轮新增规则 **P4-7（must-deliver 零未分类旁路）**，与既有 P4-1—P4-6 合计 **7/7 通过**（`raw/rules-gate.log`）：裸 `DomainEventPublisher` 唯一链路、无事务 `AFTER_COMMIT`、无监听者 must-deliver 旁路均被识别并阻断；三个恢复调度器的租约回收能力被纳入守门（防止 D1—D3 类缺陷回退）。

## 6. 门禁与计数（只取实际命令输出）

| 范围 | 命令 | 结果（原始日志） |
|---|---|---|
| 全量门禁 | `mvn -B -o test`（server 根） | **BUILD SUCCESS；13 个模块合计 1530 tests，Failures 0 / Errors 0 / Skipped 0；12:29 min**（`raw/full-server-gate.log`） |
| 受影响模块 | `mvn -B -o -pl <module> test` | sw-common 32、sw-basic-job-biz 51、sw-basic-notify-biz 118、sw-basic-iot 50、sw-bpm-process 205、sw-biz-form-biz 159、sw-biz-openapi-biz 10（均 0/0/0，逐模块原始日志在 `raw/module-*.log`） |
| Phase 4 行为套件 | 见 `command-results.tsv` | lifecycle 7/7、restart 1/1、flow-seam 9/9、delivery 8/8、tx-fact 2/2、migration 3/3、rules-gate 7/7、H2 全链 15/15、PG 全链 12/12 |
| 计数复算口径 | `command-results.tsv` 逐条记录命令、cwd、退出码、耗时、日志文件与行数 | 17 条命令全部 `exit_code=0` |

计数增长解释：回执 01 的 1499 为**未含本轮行为证据套件**的计数；本轮新增 31 个测试（7 生命周期 + 1 重启恢复 + 9 流程接缝 + 8 交付接缝 + 2 事务事实 + 3 迁移行为 + 1 新增守门规则），故全量为 1530。**Phase 3 的 1493 正式基线不因本回执而替换**：Phase 4 尚未通过功能级验收，基线仍以 Phase 3 为准。

## 7. 秘密处理（方向 §7 执行记录）

- 连接参数唯一来源：工作区外 `~/.config/smart-workflow/pg.env`；本轮执行首次检查四变量齐备，未向 Owner 索要，未把私有文件复制进工作区。
- 命令文本只引用变量名（`scripts/run-phase4-evidence.sh`）；所有日志在落盘前经 `sed` 脱敏过滤器，值→`<redacted-*>` 占位符；证据只记录"变量已提供"与脱敏数据库身份。
- `secrets-scan.txt`：对证据包全量文件按**凭据上下文**（JDBC URL / `user=` / 口令字面量）扫描，四个变量命中数均为 **0 → CLEAN**；原始子串命中仅出现在脚本自身的变量名文本/通用词片段（已登记以便复核）。

## 8. 修改范围（本轮新增改动，叠加回执 01 的实现）

- 新增生产类：`com.sw.ck.common.persistence.IdempotentInsert`、`com.sw.ck.job.typehandler.BooleanSmallintTypeHandler`。
- 本轮修复涉及（回执 01 已改的文件继续演进）：`SwJobBean`、`JobInfo`、`RuleEngineService`、`ScriptHostEngineService`（`ScriptEngineService`/`ScriptHostFunctions`）、`CommandQueueService(+Impl)`、`CommandCompensationJob`、`ProcessTriggerRecoveryJob`、`IotProcessTriggerFacadeImpl`、`IotProcessTriggerListener`、`NotifyDeliveryRecoveryServiceImpl`、`NotifyFacadeImpl`、`OpenApiCallbackRecoveryJob`。
- 新增证据资产：`sw-bootstrap/src/test/.../phase4/` 下 5 个 PostgreSQL 行为证据类 + 1 个支撑基类（`Phase4PgLifecycleBehaviourTest`、`Phase4PgRestartRecoveryTest`、`Phase4PgFlowSeamBehaviourTest`、`Phase4PgDeliverySeamBehaviourTest`、`Phase4PgTransactionFactTest`、`Phase4PgMigrationBehaviourTest`、`Phase4PgSupport`），以及 `ReliableEventGateTest` 的 P4-7 规则。
- 未触碰：前端子层、`product/` 方向与既有回执、以及权限/认证/迁移语义之外的公开 HTTP 契约。

## 9. 残余风险与待规划裁决项（本回执不自行降级或升级结论）

1. **引擎提交边界与应用事务边界分离（G3 实测）**：引擎绑定物理 master DataSource、应用事务由路由 DataSource 管理，`ConnectionHolder` 不同。后果是"引擎已推进 + 调用方事务回滚"这一组合下，审批已发生而无持久通知/命令意图（本轮 D13/D14 已消除"意图覆盖与重复发起"两个方向，但**无法**消除"引擎已提交而意图回滚"这一方向）。根治需统一引擎与应用的 DataSource/事务管理器，属平台级变更，超出 Phase 4 授权范围（会改变全平台审批事务语义）。建议作为独立方向评估。
2. **引擎发起与业务实例记录之间的窄窗口**：IoT 监听器已按业务键幂等短路，但"引擎已发起、业务实例尚未落库、进程随即崩溃"仍需靠重投后的幂等判定兜底；如需更强保证，需要在监听器内建立"发起 + 实例记录"的显式事务边界（本轮未做，因其会改变设备动作与触发回写的失败语义）。
3. **`I6G7bOldBaselineUpgradePostgresTest` 存在本机占位连接串**（`127.0.0.1:5432` + `postgres/123456`）：系既有本机开发占位，非本阶段私有环境的连接值；本轮未改动，供规划决定是否清理。

## 10. 证据索引与哈希

- 目录：`product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/`
- 原始日志（17）：`raw/{lifecycle-behaviour,restart-recovery,flow-seam-behaviour,delivery-seam-behaviour,flowable-tx-fact,migration-behaviour,rules-gate,h2-full-chain,pg-full-chain,module-*,full-server-gate}.log`
- 复算产物：`publish-matrix.tsv`、`unclassified-bypass-scan.txt`、`command-results.tsv`、`secrets-scan.txt`、`workspace-identity.txt`
- 脚本：`scripts/{p4-publish-matrix.sh,p4-runtime-env.sh,run-phase4-evidence.sh,freeze-phase4-evidence.sh}`
- 哈希与回读：`behavior-input.sha256`（243 项行为输入，逐条 `OK`）、`evidence.sha256`（26 项受哈希文件自哈希，逐条 `OK`），`.check` 为回读结果（`check_exit=0`）。
- 进度指纹：`evidence.sha256` 内容 SHA-256 前 16 位 = `899c7a4c435dee3a`。

## 11. 未完成项声明

- 本轮不存在授权内仍可执行的遗留项：规划复核列出的 G1—G6 已全部按"完成条件"关闭并附原始证据。
- 未完成/不主张的部分如实声明：外部通知 Provider 的真实厂商送达（方向明令不验证）、D9 关联的引擎侧强持久化（§9.1，属平台级变更）、§9.2 的窄窗口加固。
- 依方向第 8 节：执行自验不等于规划功能级验收；本回执**不写** `PASSED/COMPLETED`。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase4-reliable-business-events-02.md","evidence":["product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/command-results.tsv","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/publish-matrix.tsv","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/unclassified-bypass-scan.txt","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/lifecycle-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/restart-recovery.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/flow-seam-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/delivery-seam-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/flowable-tx-fact.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/migration-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/full-server-gate.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/raw/rules-gate.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/behavior-input.sha256","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/evidence.sha256","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/secrets-scan.txt","product/backend-architecture-optimization/receipts/evidence/completion-phase4-02/workspace-identity.txt"],"feature_status":"VERIFYING","remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"请规划复核 completion-phase4-reliable-business-events-02.md：按 G1—G6 逐项核对原始证据并作 Phase 4 功能级验收裁决（含 §9 残余风险 1/2 的处置决定）。回执只提交执行自验结果，未写 PASSED/COMPLETED。","next_action_type":"WAIT_PLANNER","progress_fingerprint":"899c7a4c435dee3a","progress_basis":{"files_changed":["sw-framework/sw-common/src/main/java/com/sw/ck/common/persistence/IdempotentInsert.java","sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/typehandler/BooleanSmallintTypeHandler.java","sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/SwJobBean.java","sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobInfo.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/RuleEngineService.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/ScriptHostFunctions.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/CommandQueueService.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/CommandQueueServiceImpl.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/CommandCompensationJob.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/ProcessTriggerRecoveryJob.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotProcessTriggerFacadeImpl.java","sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyDeliveryRecoveryServiceImpl.java","sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/impl/NotifyFacadeImpl.java","sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/job/OpenApiCallbackRecoveryJob.java","sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListener.java"],"tool_actions":["mvn -B -o test（全量门禁，1530 tests 全绿）","mvn -B -o -pl <module> test（7 个受影响模块全绿）","真实 PostgreSQL 行为套件 6 个类（共 30 个用例，全部先复现后修复）","bash scripts/p4-publish-matrix.sh（11/11 矩阵 + 零旁路 ACCEPTED）","bash scripts/freeze-phase4-evidence.sh（243 输入 + 26 证据哈希回读全 OK）"],"new_evidence":["evidence/completion-phase4-02/raw/*.log（17 份原始日志，脱敏）","evidence/completion-phase4-02/publish-matrix.tsv","evidence/completion-phase4-02/unclassified-bypass-scan.txt","evidence/completion-phase4-02/command-results.tsv","evidence/completion-phase4-02/secrets-scan.txt（CLEAN）","evidence/completion-phase4-02/{behavior-input,evidence}.sha256(+.check)"],"closed_work_items":["G1 真实 PostgreSQL 七类生命周期行为 + 双进程崩溃重启恢复","G2 六接缝 + Form 兜底端到端行为包","G3 Flowable 回调事务事实（含新暴露的引擎边界事实）","G4 11/11 发布点矩阵与零未分类旁路","G5 V96 迁移行为、升级保留与失败恢复边界","G6 命令/计数/日志/哈希/工作树身份证据包","D1—D14 行为证据暴露的实现缺陷修复与再验证"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven","outcome":"SUCCEEDED","detail":"mvn -B -o test：13 模块 1530 tests，0 failures/0 errors/0 skipped，BUILD SUCCESS（12:29）；7 个受影响模块单独运行亦全绿"},{"tool":"postgresql","outcome":"SUCCEEDED","detail":"真实 PostgreSQL 14.24 固定库 sw_p4_evidence：clean migrate/migration 行为/生命周期/接缝端到端全部通过，连接值未记录"},{"tool":"bash","outcome":"SUCCEEDED","detail":"发布点矩阵与零旁路复算脚本 ACCEPTED（退出码 0）；哈希清单回读 243+26 项全部 OK；秘密扫描 CLEAN"}],"browser_status":"NOT_APPLICABLE","formal_browser_acceptance":false,"work_items":[{"id":"G1 真实 PostgreSQL 生命周期行为与双进程崩溃重启恢复","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"证据已提交（raw/lifecycle-behaviour.log、raw/restart-recovery.log）"},{"id":"G2 六接缝与 Form 兜底端到端行为包","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"证据已提交（raw/flow-seam-behaviour.log、raw/delivery-seam-behaviour.log）"},{"id":"G3 Flowable 回调事务事实","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"运行时事实已提交；引擎边界分离事实交规划裁决（§9.1）"},{"id":"G4 11/11 发布点矩阵与零未分类旁路","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复算脚本与产物已提交（publish-matrix.tsv、unclassified-bypass-scan.txt）"},{"id":"G5 V96 迁移行为、升级保留与失败恢复边界","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"证据已提交（raw/migration-behaviour.log、H2/PG 全链）"},{"id":"G6 命令/计数/日志/哈希/工作树身份证据包","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"证据已提交（command-results.tsv、哈希回读、secrets-scan CLEAN）"},{"id":"D1—D14 行为证据暴露的缺陷修复与再验证","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"修复后同一编排通过，逐项修复前后证据见回执 §3"},{"id":"§9 残余风险（引擎/应用事务边界分离、发起—实例记录窄窗口、既有占位连接串）","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"本轮授权范围内已如实记录与局部加固；是否开启新方向由规划裁决"}]}
