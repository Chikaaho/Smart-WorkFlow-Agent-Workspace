# Phase 4 执行回执 01：可靠业务事件交付收口（BAO-05）

> 执行角色：执行（Executor）  
> 日期：2026-09-24  
> 方向：`../ready/direction-phase4-reliable-business-events.md`  
> 状态：**`IN_PROGRESS / VERIFYING`（实现已完成，方向 §5.D.2/§5.D.3 要求的真实数据库行为证据尚未产出，故不提交完成结论）**  
> 未执行：commit / push / merge / tag / Release / 部署；未启动 BAO-01—04、06—10

---

## 1. 实现结果（五道 must-deliver 接缝 + 兜底退役）

统一架构：**业务事务内持久意图（同步 `@EventListener`，非 `@Async`、非 AFTER_COMMIT）→ 持久结构的状态机领取（条件更新，单一领取者）→ 有限重试与退避 → 可审计终态 → 恢复调度**。未引入 MQ，未新增通用 outbox（复用既有表与队列）。

| 接缝 | 事务内持久意图 | 持久结构 | 幂等键 | 领取/重试/终态 | 恢复调度 |
|---|---|---|---|---|---|
| Scheduled FLOW | `SwJobBean` 显式 `TransactionTemplate` + 新增 job-api 端口 `ScheduledFlowStartPort`（bpm 实现） | `sw_bpm_command`（既有队列） | `SCHEDULED_FLOW:{jobId}:{fireTimeEpochMs}` | 既有 `claimDue`/`complete`/`failAndScheduleRetry`/`reclaimStale`（租约令牌 + 退避 + FAILED 终态） | 既有 `CommandDispatcher` 轮询 + stale 回收 |
| IoT 触发 | 规则路径原有 in-tx 插入；**新增脚本路径** `ScriptEngineService.persistProcessStartIntents`（与脚本执行同事务） | `sw_iot_process_trigger`（+ V96 新增身份/重试列） | 既有幂等键（规则 dedupKey；脚本 correlationId） | 新增 `ProcessTriggerRecoveryJob`：`PENDING/FAILED → PROCESSING` 条件更新领取、指数退避、`PROCESSING` 滞留回收、retry_count 上限终态 | 新增 `ProcessTriggerRecoveryJob`（`@Scheduled`） |
| BPM 设备命令 | 新增 `BpmDeviceCommandIntentRecorder`（同步 `@EventListener`）调用 `IotDeviceFacade.dispatchCommandIdempotent`（仅入队，无外部 I/O） | `sw_iot_device_command`（既有） | `APPROVAL:{流程实例}:{设备}:{命令标识}`（稳定业务身份，替代原随机 UUID） | 既有发送路径 + **补齐** `CommandCompensationJob`：`claimQueuedForSend`/`claimFailedForRetry` 条件更新领取、重试预算、过期终态 | `CommandCompensationJob`（`@Scheduled`，原为桩实现） |
| BPM 通知意图 | 新增 `NotifyFacade.recordIntent`（仅持久化，零渠道 I/O）+ `BpmNotifyIntentRecorder`（同步 `@EventListener`） | `sw_notify_message`（既有；PENDING + RETRYABLE + next_retry_time=now） | 既有唯一身份索引（租户+事件+业务对象+发生次序+接收人+渠道） | 既有 `NotifyDeliveryRecoveryServiceImpl`（条件更新认领、退避 1/2/4/8/16 分钟、`RETRY_EXHAUSTED` 终态） | 既有通知恢复调度 |
| OpenAPI 回调 | 新增 `OpenApiCallbackIntentRecorder`（同步 `@EventListener`） | **新增** `sw_openapi_callback_task`（V96，唯一键 租户+应用+事件+业务对象） | 同上唯一键（DB 强制） | 新增 `OpenApiCallbackRecoveryJob`：条件更新领取（attempts+1）、退避、`RETRY_EXHAUSTED` 终态、手工重发入口兼容 | 新增 `OpenApiCallbackRecoveryJob`（`@Scheduled`） |
| `FormSubmittedEvent` 兜底 | **已退役**：`FormSubmitService` 不再发布无人消费的兜底事件，改为显式告警；权威路径 `FlowStartPort + sw_bpm_command` 未降级 | — | — | — | — |

**真实阶段表达**：`SwJobBean` 的 Job 日志对 FLOW 任务写“已受理流程启动意图（commandId=…，待命令调度消费）”，不再写“执行成功”冒充下游完成；未受理（无绑定/端口缺失）时抛异常 → Job 日志 FAILED。

## 2. 机械守门（已实现并通过）

`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase4/ReliableEventGateTest.java`，**6/6 通过**（对 production 源码做注释剥离后的代码级判定 + 原始文本的标记判定）：

| 规则 | 内容 | 结果 |
|---|---|---|
| P4-1 | `SwJobBean` 不得再发布内存事件；必须含事务边界 + 端口调用；端口契约为 `Optional`；受理实现写入持久队列且使用稳定幂等键 | 通过 |
| P4-2 | `FormSubmitService` 不得再发布兜底事件，权威路径为 `FlowStartPort` | 通过 |
| P4-3 | 通知/设备/回调三类事务内登记器必须存在、同步（禁 `@Async`/AFTER_COMMIT）且对无事务上下文告警 | 通过 |
| P4-4 | 三类恢复调度存在且以条件更新认领；设备补偿不得保留桩实现；命令队列保留 stale 回收 | 通过 |
| P4-5 | IoT 脚本路径必须持久化触发意图 | 通过 |
| P4-6 | 审批设备命令幂等键来自业务身份（无随机成分），IoT 侧支持调用方幂等键 | 通过 |

## 3. 门禁与迁移边界

- **Server 全量门禁：`mvn -B -o test` → 1499 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS**（03:06）。基线由 Phase 3 的 1493 增至 1499（新增守门 6 项）。
- 受影响模块：form-biz 159/0/0/0、iot 50/0/0/0、notify-biz 118/0/0/0、bpm-process、openapi-biz 均绿；bootstrap 116/0/0/0。
- **迁移**：新增 `V96__p4_reliable_events.sql`（`db/migration/{postgresql,h2}` 各一份，内容一致）：IoT 触发补齐恢复身份列（`process_template_key`/`trigger_source`/`configured_by`/`retry_count`/`next_retry_time` + 恢复索引）与新建 `sw_openapi_callback_task`（唯一键 + 到期索引）。既有数据不回填、不删除；`FlywayFullChainH2Test`（97）、`FlywayFullChainPostgresTest`（95）、`I6G7UpgradeDrillH2Test`（终点 V96）随链断言同步并通过。
- 既有测试更新（随语义变更同步）：`FormSubmitServiceTest` 两处断言改为“兜底事件不再发布”；`BpmDeviceCommandListenerTest` 桩改为幂等重载。

## 4. 与方向的偏差与遗留（必须如实标注）

1. **未产出方向 §5.D.2/§5.D.3 要求的真实数据库行为证据**：原子提交/回滚、提交后崩溃恢复、并发领取、租约回收、重复投递、重试耗尽与迟到完成隔离，均**仅有实现与机械守门，尚无 PostgreSQL 行为用例与原始输出**。这是本阶段尚未完成的核心验收项。
2. 未验证 Flowable 回调（`ApprovalTaskListener`）与引擎事务边界的运行时事实（方向 §6 明确要求行为确认）；当前实现以“同步 `@EventListener` + 无事务上下文告警”兜底可观测性，但**未取得运行时证据**。
3. 通知意图语义变化：外部渠道通知改为“意图先持久化、由提交后加速或恢复调度投递”；IN_APP 行为不变（登记即终态）。若提交后加速未执行，外部渠道投递延迟上限为恢复调度周期（默认 60s）。
4. 未做：外部 Provider 真实送达验证（方向 §4 非目标）；IoT `onConnectionChanged` 无生产调用方（既有事实，未改）；`sw_bpm_instance.business_key` 非唯一（幂等仍依赖命令 key + handler 查重）。
5. 未新增事件/持久结构矩阵文件（方向 §5.D.1）与证据哈希包：待行为证据一并产出后提交。

## 5. 实际修改范围（本轮）

生产代码：`sw-basic-job-api`（新增端口 `ScheduledFlowStartPort`、`ScheduledFlowTriggerEvent` 增 `configuredBy`/`fireTimeEpochMillis`）；`sw-basic-job-biz`（`SwJobBean` 事务受理）；`sw-bpm-process`（新增 `ScheduledFlowStartPortImpl`、`ScheduledFlowCommandHandler`、`CommandTypeEnum.SCHEDULED_FLOW_START`、`BpmNotifyMessages`、`BpmNotifyIntentRecorder`、`BpmDeviceCommandIntentRecorder`、`BpmNotifyListener` 收敛映射、`IotProcessTriggerListener` 上下文还原、pom 增 `sw-basic-job-api`）；`sw-basic-notify`（`NotifyFacade.recordIntent` + 意图投递/回写）；`sw-basic-iot`（幂等键派发重载、补偿调度补齐、触发恢复调度、脚本路径持久化、实体列扩展）；`sw-biz-openapi-biz`（回调任务实体/Mapper/登记器/恢复调度、投递服务暴露 `isDelivered`）；`sw-biz-form-biz`（退役兜底发布）；`sw-bootstrap`（迁移 V96 + 链断言）。

## 6. 结论

实现层已把五道 must-deliver 接缝从“内存事件为唯一事实源”收敛为“事务内持久意图 + 可恢复领取 + 幂等消费 + 有限重试 + 可审计终态”，并建立防回退守门；全量门禁 1499/0/0/0 通过。**但方向 §5.D 要求的 PostgreSQL 行为证据与矩阵/哈希证据包尚未产出，故本阶段保持 `IN_PROGRESS / VERIFYING`，不提交完成结论，等待补充行为证据后再请规划验收。**
