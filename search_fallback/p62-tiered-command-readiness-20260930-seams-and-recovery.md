# P62 分级执行与统一命令 · 探索附表 B：接入接缝与恢复/事务边界（Q2+Q3）

日期：2026-09-30；角色：执行（Executor）；主回执 `p62-tiered-command-readiness-20260930.md` §Q2/§Q3。只读探索；根 `R=Smart-WorkFlow-aPaaS-server`，`P=R/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process`。

## B1 节点/流程接缝（Q2 证据）

| 事项 | 事实 | 位置 |
|---|---|---|
| 节点注册与冻结 | `BpmNodeRegistry`（api，8 类节点）+ `BpmNodeRegistryImpl` 构造期校验类型/元数据/能力并冻结；Spring 收集 `List<NodeTypeTranslator>` | `bpm-api/.../node/BpmNodeRegistry.java:20-63`；`bpm-engine/.../registry/BpmNodeRegistryImpl.java:32-68,84-121`；`BpmEngineAutoConfiguration.java:101-113` |
| 新增节点方式 | 一个 `NodeTypeTranslator` bean（metadata/validateConfig/translate）+ 一个 delegate bean；发布校验与设计端能力清单自动生效 | `GraphToBpmnTranslator.java:77-137`；`GraphValidator.java:33-39,96-106`；delegate 注入 `ServiceTaskNodeTranslator.java:140-157` |
| 已注册类型 | START、END、APPROVAL、CONDITION、CONSENSUS、NOTIFICATION、COPY、DYNAMIC_PARALLEL | 各 translator；`BpmNodeRegistryImpl` |
| 流程发起接缝 | `FlowStartPortImpl:46-73`（commandKey=`FLOW_START:recordId`）；消费 `FlowStartCommandHandler:44-56`（businessKey 幂等）；定时变体 `ScheduledFlowStartPortImpl:65-104` | `P/port/`、`P/queue/` |
| 节点函数运行时 | `NodeFunctionService` 读取（tenant=0 或本租户、enabled=1）；触发点仅"任务创建期"与"任务动作期"；3 个实现均为参与人/结果函数 | `P/service/NodeFunctionService.java:292-304,132-201,204-237`；`ApprovalTaskListener.java:226`；`TaskActionService.java:498` |
| 调用事务动作的节点 | **缺失**（`grep TxnAction|invokeAction` 于 sw-bpm 零命中）；事务动作仅有 HTTP 控制器入口 | `sw-biz-form-biz/.../txn/controller/TxnActionController.java:115` |
| 跨模块可见性 | bpm-engine/bpm-process 仅依赖 `form-api`；bpm-engine/pom.xml:56、bpm-process/pom.xml:55；无事务动作契约 | pom 事实 |
| 版本冻结 | 发布服务校验图/formKey/节点函数并冻结版本行 | `BpmProcessDefServiceImpl.java:273-334,359-394` |

**两种接入选项（事实与影响面）**
- 选项1：新增节点类型（`NodeTypeTranslator`+delegate）。不新增表；跨模块调用需二选一：在 `sw-biz-form-api` 增 port（现仅 form-api 可见），或经命令队列新增命令类型（现无事务动作命令类型）。不新增权限码（`form:action:invoke` 已存在；节点调用不经控制器 `@PreAuthorize`）。
- 选项2：复用 `NodeFunctionService` 挂到既有服务节点（如 NOTIFICATION/COPY）。不新增表（V75 审计可复用）；缺口=自动步骤期无触发点，需扩触发点；同样需要 form-api port。

## B2 批量选项（Q2 附表）

见附表 A2 的入口清单。两选项：①仿批量审批（逐项复用单条动作+逐项结果；缺口=无上限/无批次持久化/无幂等键；批次记录可仿 `BpmHandover*` 先例）；②复用持久命令队列（`CommandEnvelope`+`sw_bpm_command`+`CommandDispatcher`；已有持久/重试/stale 回收/commandKey 去重；缺口=命令类型仅 FLOW_START/SCHEDULED_FLOW_START/DRAFT_SUBMIT/TASK_*、payload 面向 StartCommand、无逐项业务结果查询）。

## B3 提交边界与租约（Q3 证据）

| 事项 | 事实 | 位置 |
|---|---|---|
| 队列入队 | `@Transactional(MANDATORY)`，冲突上抛调用方（回查既有 id / 转"已有提交在处理中"） | `PersistentBpmCommandQueue.java:41-56`；`FlowStartPortImpl.java:70-79`；`DraftSubmitService.java:146-150` |
| 领取 | 无事务；PENDING+channel+next_retry_at 到期→条件 UPDATE 写 claimed_at/claim_token（无 SELECT FOR UPDATE） | `:95-135` |
| 完成/拒绝 | `@Transactional(REQUIRED)`；PROCESSING+claim_token 双守卫，不匹配仅 warn 不写="仅拒绝状态回写" | `:137-173` |
| 失败重试 | REQUIRED；终态不复活、token 不匹配不打回；退避 backoff*(1<<retry)；达上限 FAILED | `:175-234` |
| stale 回收 | 无事务；PROCESSING+claimed_at<staleBefore→PENDING+清 token；返回值 0/1 不反映实际行数 | `:241-255` |
| 消费侧事务 | `dispatchOne` 无 `@Transactional`；顺序=身份还原→handle→complete；handle 内部业务事务（如 `FormSubmitService.submitForm` REQUIRED）与 complete 为**两个事务** | `CommandDispatcher.java:147-199`；`FormSubmitService.java:287` |
| 受理与业务同事务示例 | 表单事务内 `acceptFlowStart`（MANDATORY）写 FLOW_START 子命令 | `FormSubmitService.java:532-538`→`FlowStartPortImpl.java:69` |
| 旧执行者防护 | 命令层无 handle 前阻断、handler 不接收 claimToken；业务层防护=命令唯一键/表单幂等唯一索引/审批 uk+command_id/幂等跳过 | 附表 A1；`baseline:2378,2410,2442-2443`；`TaskActionService.java:106-124` |
| 拒绝记录独立事务 | `recordRejected` REQUIRES_NEW（业务回滚后保留）；同类先例：SSO 拒绝/重放审计、RefreshToken | `TxnActionTxOperations.java:456-466`；`SsoAuthService.java:1161`；`RefreshTokenService.java:109-120` |
| NESTED 先例 | `IdempotentInsert`（保存点，业务回滚即回滚，不产生孤儿）仅 IoT 两处调用 | `common/persistence/IdempotentInsert.java:8-18,31-40`；`ScriptEngineService.java:194`；`RuleEngineService.java:240` |

**约束事实**：REQUIRES_NEW 内层读不到外层未提交数据、占用第二个连接（外层持连接时并发可致连接池耗尽/自锁）、内层提交不随外层回滚 → 只可用于拒绝/审计类记录；成功业务记录必须与外层同事务。

## B4 截止/取消与外部结果待核实（Q3 附表）

| 事项 | 事实 | 位置 |
|---|---|---|
| 命令级 deadline/取消 | 缺失（无字段、无端点；`grep deadline` 于 P/queue、P/entity 零命中） | `baseline:2400-2411`；`BpmCommandController` 仅受理/回查 |
| BPMN 定时边界 | 缺失（`timer|boundary|duedate` 于 sw-bpm-process main 零命中） | 检索零命中 |
| 任务级时限（既有） | `BpmTaskDeadline`（due_at/escalation_fired/auto_action/run_state）+ `TaskDeadlineScheduler` 认领与执行 | `P/entity/BpmTaskDeadline.java:25,32-45`；`P/service/TaskDeadlineScheduler.java:86-108,150-212` |
| 实例取消（既有） | 撤回/废弃 + 幂等 + 已办禁撤；终态枚举 WITHDRAWN/DISCARDED | `ApprovalLifecycleServiceImpl.java:281-338`；`InstanceStatusEnum.java:19` |
| 等待超时语义 | `CommandSyncWaiter` Outcome(COMPLETED/FAILED/TIMEOUT)；TIMEOUT 返回受理态可回查，不触发取消 | `P/service/CommandSyncWaiter.java:42,59-118`；`BpmDraftController.java:198-203` |
| IoT 命令状态机 | QUEUED/SENDING/SENT/DELIVERED/ACKED/SUCCESS/FAILED/UNKNOWN/EXPIRED；`isRetryable` 仅 QUEUED/FAILED；UNKNOWN 不可自动重试 | `iot/enums/CommandStatus.java:10-79`；`iot/entity/IotDeviceCommand.java:66-81`；`baseline:2057-2078` |
| 待核实接线 | `markUnknown` 无生产调用方（全仓仅声明+实现）；设备回调 `reportResult` 仅 SUCCESS/FAILED 且无状态守卫/幂等 | `CommandQueueServiceImpl.java:151-165`；`IotDeviceServiceImpl.java:169-185` |
| 对账/重发 | 无命令状态查询 API（provider 仅 queryDeviceStatus/controlDeviceData/callDeviceActionSync）；补偿任务只处理 EXPIRED/FAILED/滞留 SENDING | `TencentCloudProvider.java:44,80,101`；`CommandCompensationJob.java:64-143` |
| BPM↔设备 | 审批事务内意图持久化（idempotentKey=`APPROVAL:{pi}:device:{key}`，不适用 fail closed）；AFTER_COMMIT+@Async 幂等投递，失败不回滚审批；`approval_biz_id` 只记录关联 | `BpmDeviceCommandIntentRecorder.java:42-75`；`BpmDeviceCommandListener.java:47-88` |
