# P62 分级执行与统一命令 · 探索附表 A：身份/状态矩阵与入口覆盖（Q1+Q6）

日期：2026-09-30；角色：执行（Executor）；主回执 `p62-tiered-command-readiness-20260930.md` §Q1/§Q6。只读探索，事实层级[结构]/[测试]。

## A1 三条受理链的身份/去重/状态/错误矩阵

| 维度 | BPM 命令（sw_bpm_command） | 表单事务动作（sw_form_txn_invocation） | 批量入口（见 A2） |
|---|---|---|---|
| 受理入口 | `POST /workflow/drafts/{id}/submit`（+channel=P0）、表单提交链内 FLOW_START 受理、定时 `SwJobBean` | `POST /form/action/{id}/invoke`（`form:action:invoke`） | 各入口见 A2 |
| 持久化与提交边界 | enqueue `@Transactional(MANDATORY)`（`PersistentBpmCommandQueue.java:41-56`）＝与调用方同事务 | 调用记录/凭据/台账与业务效果同事务；拒绝记录 `REQUIRES_NEW`（`TxnActionTxOperations.java:456-466`） | 导入整批原子；批量审批逐项独立；通知 IN_APP 整批 |
| 去重键 | 唯一索引 `uk_sw_bpm_command_key(tenant_id, command_key)`（baseline:2410） | 唯一索引 (tenant_id, action_id, invocation_key) + `request_hash` 指纹 | 定时发起 `SCHEDULED_FLOW:{jobId}:{fireTime}`；其余无幂等键 |
| 状态机 | PENDING→PROCESSING→COMPLETED/FAILED（`CommandStatusEnum.java:12-15`）；FAILED 为有界重试终态 | SUCCEEDED/REJECTED/CONFLICT/FAILED（`TxnInvokeResult`；冲突=同键异载荷） | 逐项 success/errorCode/message 或行级 RowError |
| 领取/租约 | claimDue 条件 UPDATE→PROCESSING+UUID claim_token（`PersistentBpmCommandQueue.java:95-135`） | 无队列：动作在调用请求事务内执行 | 无租约（同步执行/job 触发） |
| 查询/回查 | `/workflow/commands`（受理+回查；`BpmCommandController`），草稿 `/workflow/drafts/{id}` | `/form/action` 调用记录/凭据/台账端点（`TxnActionController`） | 导入 ImportResult；审批=同步响应（不持久化）；交接=`BpmHandoverItem` 查询 |
| 错误语义 | 失败原因=BaseException.message 写 failure_reason；无错误码列 | 错误码目录 1600—1613（C1_WRITE_PROTECTED=1612 等，`FormErrorCode`） | 行号+文案；无统一错误码 |
| 过期语义 | 缺失 | 预占凭据 EXPIRED（含过期扫描结算） | 缺失 |

## A2 批量入口逐项事实（Q2 附表）

| 入口 | 位置 | 上限 | 事务 | 逐项身份/结果 | 幂等 |
|---|---|---|---|---|---|
| 表单导入 | `FormImportExportController:83`→`FormImportExportService:345-405` | 500 行/5MB | 整批原子（失败即回滚零落库） | `RowError(rowNum,message)`、`ImportResult(successIds,errors)` | 无 |
| BPM 批量审批 | `BpmOpsController:50-60`（`workflow:task:batch`）→`BpmBatchServiceImpl:39-92` | 无 | 逐项独立（`TaskActionService` @Transactional） | taskId + success/errorCode/message（仅同步响应） | 无 |
| 定时流程发起 | `SwJobBean:209-260`→`ScheduledFlowStartPortImpl:65-104` | 单次 | 受理与调度器同事务（MANDATORY） | commandId（最终结果异步） | `SCHEDULED_FLOW:{jobId}:{fireTime}` 唯一键 |
| 通知批量 | `NotifyController:172-192`（`notify:batch:send`）→`NotifyMessageServiceImpl:110-190` | 500 | IN_APP 整批；渠道逐接收人 | recipientId + `NotifyBatchItemFailure` | 无（batchKey 随机） |
| 流程交接 | `BpmOpsController:62-74`→`BpmHandoverServiceImpl:60-190` | 无 | 方法级事务+逐项落 `BpmHandoverItem` | MIGRATED/SKIPPED_ALREADY_MIGRATED/SKIPPED/FAILED+failReason，批次终态 COMPLETED/PARTIAL/FAILED | 逐项幂等（无请求级键） |

## A3 六类命令语义映射（现状）

| 语义 | 现状 | 载体 |
|---|---|---|
| 可靠受理 | 有 | 持久行 + enqueue MANDATORY；`CommandAcceptRespDTO(status=ACCEPTED)` |
| 执行中 | 有 | PROCESSING + 租约令牌 |
| 成功 | 有 | COMPLETED / SUCCEEDED / SUBMITTED |
| 明确失败 | 有 | FAILED + failure_reason / REJECTED + 错误码 |
| 过期 | 部分 | 仅预占凭据 EXPIRED；命令/实例级缺失 |
| 外部结果待核实 | 缺失（仅枚举） | IoT UNKNOWN 定义存在、无生产调用方（markUnknown 零调用） |

## A4 客户端状态兼容面

| 端 | 载体 | 风险 |
|---|---|---|
| Web 命令状态 | `src/contracts/bpm.ts:212` `'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'`；`:203` `status:'ACCEPTED'` | 新增值需同步联合类型与 label 映射；旧前端未知值→空标签 |
| Web 事务动作 | `src/modules/form/api/txn-action.ts:14-18`（动作/调用/凭据三组联合）；label 映射 `modules/form/utils/txn-action-status.ts`（`Record<T,…>`） | 同上；label 缺失显示空 |
| Server 枚举解析 | `CommandTypeEnum.of` 抛 IllegalArgumentException；`CommandStatusEnum` 同构 | **旧二进制消费新类型/新状态行即抛错**（混版本硬边界） |

## A5 本阶段入口覆盖清单（Q6）

| 类别 | 入口 |
|---|---|
| 低代码配置 | `POST/PUT /form/action`（view/manage/publish/invoke）；C1 策略端点；图设计器 `/workflow/defs`（含 `/node-capabilities`）；节点函数注册（`NodeFunctionService`，无 HTTP）；任务时限配置 |
| 发布校验 | 事务动作 `TxnActionService.validate/publish`（绑定/TTL/精度/业务键/未声明键）；流程 `GraphValidator`+发布冻结（`BpmProcessDefServiceImpl:273-334`） |
| 命令回查 | `/workflow/commands`（受理/按 id 回查）、`/workflow/drafts/{id}`、`/workflow/instances`、`/form/action` 调用记录/凭据/台账、OpenAPI `/openapi/v1/processes/{id}` |
| 权限 | `form:action:view|manage|publish|invoke`、`form:data:*`、`workflow:p0:dispatch`、`workflow:task:batch`、`workflow:monitor:view`、`notify:batch:send` |
| 租户/恢复 | `CommandDispatcher.restoreCurrentIdentity`（按信封租户/发起人回查 SPI）；`TenantLineSuspension`（全局表）；`@DS`/TM 共享提交边界 |
| 审计 | `sw_bpm_command`（受理/结果/重试）、`sw_form_txn_ledger`（台账）、`sw_form_txn_invocation`（调用）、V75 节点函数审计、访问日志 |
| 文档 | Server `功能清单.md`、`knowledge/current-status.md`、阶段方向与 ADR（P62）、`todo/` 需求 |

## A6 已被首阶段替代的旧探索事实（来自 `p62-current-seams-and-information-audit-20260930.md`）

| 旧事实 | 现状 | 依据 |
|---|---|---|
| "受控动作原语（原子条件更新/预占确认释放/台账）真实缺失" | **已交付** | V0.1.1 六表 + `TxnAction*`；首阶段审查03 COMPLETED |
| "命令状态机无 EXPIRED/外部待核实态" | 部分改变：预占 EXPIRED 已有；命令/实例级仍缺 | `sw_form_txn_reservation`；`CommandStatusEnum` 四值 |
| "发布校验无超时/脚本权限/等级/事务边界项" | 事务动作结构性校验已交付；等级/超时/事务边界仍缺 | `TxnActionService.validate`；`GraphValidator` |
| "全仓无性能测量资产" | 新增逐次 `duration_ms`；仍无负载/延迟资产 | V0.1.1:73；测试源码零命中 |
