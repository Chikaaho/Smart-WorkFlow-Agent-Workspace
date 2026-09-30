# P62 探索附件 B：能力接缝现状与 R/A 映射（2026-09-30，执行只读探索）

> 主回执：`search_fallback/p62-current-seams-and-information-audit-20260930.md`。证据分级：**已证实**=本次代码/测试文件实读确认存在且语义明确；**当时行为证据**=真实行为测试在仓但为既往阶段快照（本次未重跑）；**仅结构线索**=代码/注释/前端 mock 存在但无行为或无生产调用方；**真实缺失**=全仓检索零命中。路径缩写 SR=Smart-WorkFlow-aPaaS-server。

## B0. Q3：低代码写入通道与统一约束（面向 R02/A03）

### B0.1 动态宽表受控入口【已证实】
- 表单数据写入口收敛 3 个 Controller（`FormSubmitController.java:40-42` / `FormDataController.java:64-72` / `FormDataDeleteController.java:35-37`，均 @PreAuthorize），SQL 一律经 `DynamicTableSql`（`sw-biz-form-biz/.../dynamic/DynamicTableSql.java`）：表名正则 :70、列白名单 :146-158、强制 `deleted=0 AND tenant_id=?` :180-197/416-425、参数绑定 :427-431、禁多语句 :388-393、父行锁 JVM 锁+`FOR UPDATE` :294-352（本次抽查证实 `LOCK_WAIT_MILLIS=10_000L` 硬编码 :101，即 Phase 3 残余边界①）、DDL 白名单 :245-262；配套 `DynamicTableSqlGateTest`/`ContractTest`。
- 乐观锁：宽表 `version` 系统列 + UPDATE WHERE `id+version+deleted+tenant_id`，缺 version 拒绝 `VERSION_CONFLICT`（`FormDataUpdateService.java:160,292-299`）。

### B0.2 各通道与统一约束【已证实】
- **导入复用保存链**：`FormImportExportService.java:345,385` 直接调 `formSubmitService.submitForm`（500 行/5MB 上限）——无独立写路径。
- **OpenAPI 复用同链**：`OpenApiProcessController.java:52-97` 发起经 `FormDataSubmitFacade`，HMAC+nonce+幂等。
- **流程侧不直写表单**：发起/定时/IoT 脚本统一入 `sw_bpm_command`；节点函数只写审计表 `sw_bpm_node_function_audit`（`NodeFunctionService.java:241-258`）；委托仅通知/抄送记录。
- **脚本无表单写能力**：GraalJS HostAccess.NONE + 8 个 fun_* 白名单，最远到 IoT 命令队列表与流程触发事件（`IotScriptApi.java:15-59`、`ScriptHostFunctions.java:200-303`）。
- **Agent**：内部工具=DB 白名单 `name→(beanName,methodName)`（`AgentToolInternalConfig.java:19-22`）——可达性取决于配置，属配置治理风险非代码旁路。

### B0.3 旁路/豁免点清单（纳入 C1 约束叙事的候选）
1. `ProcessThemeService.java:93,96`：裸 JdbcTemplate insert/update `sw_bpm_theme_seq`（固定全局序号表，参数绑定，无租户列）——**DynamicTableSql 管辖外唯一直写点**。
2. `BpmUrgeServiceImpl.java:233`：裸 `SELECT…FOR UPDATE` `sw_bpm_instance`（只读行锁，非写）。
3. `SqlExecutor.java:83,135-169`：外部数据源执行（jsqlparser 解析+仅 SELECT+只读连接），租户拦截器不生效但隔离于扩展 DS；`FormExtDataService.registerQuery:66-102` 接受设计者 sqlText 登记（`form:design:save` 权限）。
4. IoT 补偿/恢复在 `TenantLineSuspension` 下跨租户扫描/回收（`CommandQueueServiceImpl.java:191-200`、`ProcessTriggerRecoveryJob.java:87-141`，含 UPDATE）——已知"挂起+按行还原租户"模式。
5. 全部 Quartz/OpenAPI/通知 job 只写各自固定平台表，不触宽表——不构成表单约束绕过。
- **结论**：Phase 3"宽表旁路 0"在代码上可复现（宽表 6 条写路径全部收敛单一出口）；R02/A03 的真实缺口不在旁路而在**缺少受控动作原语**（B1.6）与 C1 分类机制。

### B0.4 发布校验【已证实；两项缺口】
- 表单发布校验布局/字段类型/公式依赖/数据源绑定/列名并建表+快照（`FormDefServiceImpl.java:209-267,333-404`）；BPM 发布校验图结构/节点配置/表单字段引用/节点函数注册一致性并冻结版本（`BpmProcessDefServiceImpl.java:273-404`、`GraphValidator.java`、`NodeFunctionService.java:90-127`）。
- **未找到**：外部调用超时校验、脚本权限校验、等级授权校验、事务边界校验——R08"发布检查超时与失败规则/脚本权限/事务边界"现状为缺失项。

## B1. Q4：BAO 共同提交、P4 双通道、命令身份/幂等/回查、队列/恢复/事件（面向 R02/R03/R04/R05）

### B1.1 共享提交边界【已证实代码 + 当时行为证据】
- Flowable 引擎显式绑定应用 DataSource 与应用 PlatformTransactionManager（`SR/sw-biz/sw-bpm/sw-bpm-engine/.../config/BpmEngineAutoConfiguration.java:143-171`，"single commit boundary"）；G3b 消费侧在单 TransactionTemplate 内"引擎发起+业务实例落库"（`.../listener/IotProcessTriggerListener.java:51-52,266-313`）。
- 行为证据在仓（2026-09-24 Phase 4 快照，真实 PG + `pg_terminate_backend` 故障注入）：`SR/sw-bootstrap/src/test/.../phase4/Phase4PgCommitBoundaryBehaviourTest.java`（G3a-1..4）、`Phase4PgStartWindowCrashTest.java`（G3b 三窗口）、`Phase4PgTransactionFactTest.java`。**本次未重跑**；未来引入 `@DS`/换事务管理器即失效（Phase 4 接受边界原文）。

### B1.2 持久命令与五道意图接缝【已证实】
- `sw_bpm_command`：建表于 `V0.1.0__baseline_seed.sql:2400-2411`（V50）+ claim_token V55（:2479-2489）；实体 `BpmCommand.java`、事实源 `PersistentBpmCommandQueue.java:30`；`FlowStartPort` 契约（form-api）+ `FlowStartPortImpl.java:46-81`（commandKey=`FLOW_START:{recordId}`，DuplicateKey 幂等回查）；调用点 `FormSubmitService.java:509-535`。
- 五个意图写入点齐备：定时 FLOW（`ScheduledFlowStartPortImpl.java:65-104`+`SwJobBean.java:224-265`）、审批设备命令（`BpmDeviceCommandIntentRecorder.java:42-75`）、通知意图（`BpmNotifyIntentRecorder.java:44-86`）、OpenAPI 回调（`OpenApiCallbackIntentRecorder.java:48-90`）、IoT 规则/脚本（`RuleEngineService.java:240-241`、`ScriptEngineService.java:137-195`）。

### B1.3 领取/租约/恢复【已证实，但为五套同构独立实现（非统一框架）】
- BPM 命令：claim 条件更新 PENDING→PROCESSING + 一次性 claim_token（`PersistentBpmCommandQueue.java:106-135`）、complete/reject 三重守卫（:137-234）、`reclaimStale`（:241-255）、指数退避 5 次到 FAILED 终态；调度 `CommandDispatcher.java:100-145` 自建 2 线程双车道（NORMAL 500ms/P0 100ms、批 20/5、stale 60s、消费前还原租户）。
- 其余四条各自独立：IoT 触发 `ProcessTriggerRecoveryJob.java:65-140`（60s）；IoT 设备命令 `CommandCompensationJob.java:50-79`（5min，批 50）；OpenAPI 回调 `OpenApiCallbackRecoveryJob.java:78-171`；通知 `NotifyDeliveryRecoveryServiceImpl.java:57-200`。

### B1.4 命令身份/幂等/状态机【已证实，含 R04 缺口】
- 幂等=稳定业务键+6 组唯一索引（`uk_sw_bpm_command_key(tenant_id,command_key)` seed:2410、`uk_sw_form_trace_idem`:2443、IoT/通知/OpenAPI 各 1）+ PG 保存点防 25P02（`IdempotentInsert.java:31-40`）。
- 状态机 `CommandStatusEnum.java:10-15`：PENDING→PROCESSING→COMPLETED/FAILED。**无 EXPIRED、无"外部结果待核实"态**（EXPIRED 仅 IoT 设备命令 `CommandQueueService.java:91` 有）——R04 要求的六态语义中后两态在 BPM 命令通道缺失。
- 双通道共享身份【已证实】：`BpmCommandController.java:67-113` 同一 `commandAcceptService` 受理、commandKey 同源；P0 需 `workflow:p0:dispatch` 专用权限（服务端授权，符合 R06）；同步=受理事务先提交再 `CommandSyncWaiter` 有界等待，超时返回受理态不重发（`CommandSyncWaiter.java:50-80`）。回查 `GET /workflow/commands/{commandId}`（:118-184，限受理人本人）。

### B1.5 事件发布与 Outbox【守门已证实/Outbox 真实缺失】
- `ReliableEventGateTest.java:16-32` 六条规则存在，但为**源码文本断言型**（stripCommentsAndLiterals，:49,86）——属结构守门，非运行时行为测试。
- `FormSubmittedEvent` 生产发布已退役（`FormSubmitService.java:509-535` 无 publishEvent 调用，仅 BPM 未装配时 warn）；**残留过时 javadoc** `FormSubmitService.java:42` 仍写"发布 FormSubmittedEvent"——唯一"内存事件仍活"结构线索，治理/实现时应清理。
- **Outbox 机制真实缺失**：全仓 grep outbox 零命中（.java/.sql）；跨事务可靠性由各意图表+恢复调度承载。R03"持久事件或等效可靠机制"现状=意图表等效路线，是否引入 Outbox 属 ADR 事项。

### B1.6 事务动作原语【真实缺失（符合 P62 预期）】
- 无预占/确认/释放、台账/余额、通用原子条件更新原语（全仓检索命中均为注释）；`@Version` 仅 2 处基类（`BaseEntityNoTenant.java:47`、`FormBaseEntity.java:69`），未用于业务冲突处理；队列写回靠状态+claim_token 条件更新，非版本竞争语义。

### B1.7 行为证据资产（在仓测试，本次未运行）
sw-bootstrap：phase4 9 个（G3a/G3b/事务事实/生命周期/双上下文/流程接缝/交付接缝/重启恢复/迁移）+ `ReliableEventGateTest`；phase3 `Phase3ReferenceConcurrencyPostgresTest`；phase5 4 个；p4overlap 4 个（`CommandOverlapRealEngineTest`、`G5aSyncWaiterChainTest`、`CrossTenantReadIsolationTest`、`MyProcessedRealSourceTest`）。模块内：`PersistentBpmCommandQueueContractTest`、`CommandLeaseHandoverOverlapTest`、`CommandDispatcherP0PriorityTest`、notify I6G1a/b/c BootTest 等。

## B2. Q5：P21 IoT 回执/未知结果、P57/P58 节点图契约、调度与租户（面向 R01/R06/R07/R08）

### B2.1 IoT 命令回执与未知结果【双通道链路已证实；UNKNOWN/对账为真实缺口】
- 腾讯通道 `sw_iot_device_command`：QUEUED→SENDING→SENT→DELIVERED→ACKED→SUCCESS/FAILED/UNKNOWN/EXPIRED（`sw-basic-iot/.../enums/CommandStatus.java:10-79`）；markSent 落 tencentRequestId（`CommandQueueServiceImpl.java:71-180`）；发送 `DeferredControlUtil.java:205-236`（provider 缺失 fail-closed）；设备回调只接受 SUCCESS/FAILED（`IotDeviceServiceImpl.java:36,167-185`）。
- **缺口**：`markUnknown` 全仓无生产调用方（接口+实现外零命中，本次抽查证实）；无 RequestId 反查/对账任务；UNKNOWN 是终态且永不复核——A08"回执不明进入可对账状态"现状为**未实现**。
- MQTT 通道 `sw_iot_command`：PENDING/BROKER_ACK/SUCCESS/FAILED/DEVICE_REPLY，correlationId 校验+终态去重（`MessageIngestService.java:257-296`）；审批联动 AFTER_COMMIT+幂等键复用（`BpmDeviceCommandListener.java:47-89`）。
- 补偿：过期/滞留补发/SENDING 租约回收/失败重试（`CommandCompensationJob.java:27-67,117-148`）。

### B2.2 IoT 脚本与规则【已证实】
- GraalJS 沙箱：HostAccess.NONE/IO NONE/50 万语句/64MB/超时强断（`GraalJsRunner.java:37-105`）；宿主函数白名单 `fun_publish/subscribe/getProperty/setProperty/emitEvent/invokeAction/startProcess/log`（`IotScriptApi.java:15-59`）——**脚本不能写任意业务表/调任意业务 API**；规则路径防抖/冷却/幂等键/保存点（`RuleEngineService.java:183-277`）+ `ProcessTriggerRecoveryJob` 恢复。

### B2.3 P57/P58 节点与图契约【已证实；IOT_COMMAND 节点仅结构线索】
- 可插拔机制：Spring 发现 NodeTypeTranslator→`BpmNodeRegistryImpl.java:34-153` 构造期 fail-fast→`GraphToBpmnTranslator.java:105-120` 只消费注册结果；已注册 8 类：START/END/APPROVAL/COPY/CONDITION/NOTIFICATION/CONSENSUS/DYNAMIC_PARALLEL。
- 图契约 `ProcessGraph.java:23-45`（contractVersion、坐标显式）；能力清单前后端共享 `GET /workflow/defs/node-capabilities`（`BpmProcessDefController.java:366-375`），前端契约 `src/contracts/bpm-node.ts`（"前端不得维护第二份节点目录"）、第一方 SVG 内核（无 bpmn-js）。
- **IOT_COMMAND：前端图标与 mock 预留（`ProcessDesigner.vue:987`、`design-fixtures.ts:1288`），后端无翻译器**——设备命令现走事件监听器而非图节点；若 P62 选择节点化，需新增 NodeTypeTranslator（机制已就绪）。
- P57 时点边界（requirement-pool 420 行）：生产能力目录曾仅 START/APPROVAL/END，现已扩至 8 类；P58 交付会签/条件/通知/抄送子集（P34/P35/P37/P38/P39 部分核销边界不变）。

### B2.4 版本快照【已证实】
- 流程：`BpmProcessDefVersion.java:19-67`（PUBLISHED 行不可原地覆盖）+ 实例绑定 `published_version`（`BpmInstance.java:61-64`、`ProcessStartService.java:201-205`）；表单：`FormSnapshotEntity.java:18-30` 每次发布存 snapshot JSON。R08"运行对象版本固定"基础在位；**发布校验对"等级授权/事务边界/外部调用超时"尚无对应检查项**（现有校验为节点/图/表单项级，Q3 代理补充）。

### B2.5 资源调度【部分；无限流】
- Quartz 单节点（线程池默认 10，`QuartzSchedulerService.java:22-43`）；BPM 命令 DB 持久队列+双车道（见 B1.3）；IoT 补偿 @Scheduled；并发控制=CAS 领取+有界批次。**无限流/准入组件**（全仓仅注释提及）；**隐患**：`NodeFunctionService.java:46-47` 无界 cachedThreadPool；MQTT 上行直接跑 Paho 回调线程无独立池；`@EnableAsync` 无定制 executor。

### B2.6 多租户隔离【已证实成体系；两处风险入口】
- TenantLineInnerInterceptor 列级隔离、无身份 fail-closed（`CommonTenantLineHandler.java:25-57`），白名单仅 `sys_menu`（application.yml:165-166）；DataScope 注解体系（`DataScopeHandler.java:56-80`，空集恒假、超管/ALL 放行）；调度线程"挂起过滤+按行还原租户"成熟模式（`CommandCompensationJob.java:157-173` 等 7+ 处）。
- 风险入口：①MQTT 上行 ingest 线程无租户身份——tenant.enabled=true 时上行整体失败（fail-closed 但功能不可用）；②`IotDeviceServiceImpl.getByDeviceKey:80-85` 等个别查询未显式带租户条件（靠拦截器兜底）。测试：`H7TenantIsolationIntegrationTest`、`I4TenantIsolationPostgresTest`、`CrossTenantReadIsolationTest`、`I5PgTenantBehaviorBootTest` 等。

## B3. R01—R10 / A01—A12 映射总表（现状基线）

| 需求/验收 | 已有基础（复用点） | 缺口/新建设 |
|---|---|---|
| R01 四类执行形态 | 标准流程=Flowable；后台批量=Quartz+意图接缝；生产命令=双车道 DB 队列（P0/NORMAL 两级） | 实时动作形态（短事务无 BPM 实例）整体缺失；等级体系只有 NORMAL/P0 两级 |
| R02 事务动作 | 共享提交边界（B1.1）；动态宽表受控入口（见主回执 Q3） | 受控动作原语（原子条件更新/增减/预占/版本冲突/台账）真实缺失（B1.6） |
| R03 可靠传播 | 意图表+恢复调度等效路线（B1.2/1.3）；G3a/G3b 快照 | Outbox 缺失（等效路线 ADR 裁决）；跨事务预占/确认/释放/冲正/对账语义缺失 |
| R04 统一命令 | 命令身份跨双通道统一（B1.4）；回查/同步等待 | EXPIRED/"外部结果待核实"两态缺失（B1.4）；IoT UNKNOWN 无复核（B2.1） |
| R05 持久队列 | DB 队列+租约+恢复已实证（B1.3）；内存通知非权威（守门） | 五套同构实现未收敛；租约过期后旧执行者副作用防护=claim_token 单层，无执行版本/目标端校验 |
| R06 资源与多租户 | 租户隔离+DataScope 成体系（B2.6）；P0 服务端权限 | 准入/限流/公平性/下游预算全缺（B2.5）；无界线程池隐患 |
| R07 IoT 边界 | 双通道命令+遥测分离（RuleEngine vs 命令队列） | 遥测/命令共享 ingest 线程与库；响应式/虚拟线程未验证（无任何代码） |
| R08 发布校验 | 版本快照机制（B2.4）；节点 fail-fast 注册 | 发布校验缺等级/事务边界/超时/脚本权限项；校验失败可读性未评估 |
| R09 部署适配 | 平台无 Broker 绑定（DB 队列默认） | 云边协同/现场自治零实现（符合"不预设"） |
| R10 运行治理 | 发送记录/调用日志已有（M06/M09 部分） | 分段延迟/队列等待/违约率/台账差异指标缺失；无性能测量基线（见主回执 Q6） |
| A01 | 标准流程+批量场景可运行 | 实时动作/生产命令代表场景未建 |
| A02/A08 | 库存约束/预占竞争无任何基础 | **真实缺失**（依赖 R02 原语） |
| A03 | 动态宽表统一入口+租户强制（主回执 Q3） | C1 分类与全入口强制覆盖未建立 |
| A04 | 同事务组合提交（G3a/G3b）；异步可恢复 | 表单/业务/流程三写同成败的声明式组合未建 |
| A05 | 双通道共享身份+回查+重叠测试（`CommandOverlapRealEngineTest`） | 过期态与外部待核实态缺失（B1.4） |
| A06/A07 | 无任何性能/隔离测量 | **真实缺失**；预算输入未固定 |
| A09 | 版本固定+fail-fast 注册 | 校验项缺口（B2.4） |
| A10 | P4 兼容=现网行为本身；迁移=种子基线全新建库 | 分级扩展的兼容窗口/回滚未定义 |
| A11 | 五条接缝各自恢复证据（Phase4 快照） | 按新拓扑/适配器逐项取证未开始 |
| A12 | 命令/台账可按租户追踪（uk 含 tenant_id） | 按等级/动作版本追踪与指标缺失 |
