# P64 MES高级流程编排现状探索——事实附件

2026-10-08；执行角色。配套回执 `search_fallback/p64-mes-advanced-orchestration-readiness-20261008.md`。
路径简写：S=`Smart-WorkFlow-aPaaS-server`，W=`Smart-WorkFlow-aPaaS-Web`，根=`Smart-WorkFlow`（工作区）。
标记：〔运行〕=既有验收/测试/回执行为证据；〔静态〕=本次只读静态确认；〔待验证〕=证据不足。全部结论均未编译、未跑测试、未连库、未启服务；静态存在不冒充运行通过。

---

## A 节点与节点表单

- 引擎注册图节点类型 10 类〔静态〕：`START`/`END`/`APPROVAL`（人工审批）/`CONSENSUS`（会签）/`CONDITION`/`COPY`/`NOTIFICATION`/`DYNAMIC_PARALLEL`（动态并行）/`PARALLEL_GATEWAY`/`TXN_ACTION`。证据 `S/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/translator/*Translator.java`（各 `type()`）、`.../engine/registry/BpmNodeRegistryImpl.java:45`；能力端点 `GET /workflow/defs/node-capabilities`（`S/.../process/controller/BpmProcessDefController.java:368`）。人工任务类节点仅 APPROVAL/CONSENSUS/DYNAMIC_PARALLEL；COPY/NOTIFICATION 只解析参与人不产生待办；TXN_ACTION 无参与人。〔运行〕P57/P58/I3/I4/P63 回执。
- 节点级「审批意见表单」＝节点内联轻量字段配置，**不是**绑定已发布低代码表单〔静态〕：`ApprovalUserTaskTranslator.metadata()` 声明 configField `opinionForm`（object，`"审批意见表单"`）；结构 `{formId, version, fields[{key,type,required,visibleWhen,initialExpression,maxLength,min,max,options}]}`。受支持组件类型限 `TEXT/TEXTAREA/NUMBER/RADIO/CHECKBOX/SELECT/DATETIME/NOTE`（`S/.../process/validator/ApprovalOpinionValidator.java:23-25`）；发布/设计校验同矩阵（`ApprovalUserTaskTranslator.java:157-176`，`OPINION_FORM_COMPONENT_UNAVAILABLE`）。默认意见 `formId=DEFAULT_REMARK/version=1`、`comment` 键兼容固化（`ApprovalOpinionValidator.java:127-139`）。〔运行〕P58 回执（意见表单真实填写）、P63 回执 03 独立意见/轮次。
- 节点表单数据持久化＝任务/动作级，非独立表单实例〔静态〕：表 `sw_bpm_approval_action`，列 `opinion_form_id/opinion_form_version/opinion_form_snapshot/opinion_data(text JSON)/round_no/proxy_for_user_id`（`S/.../process/entity/ApprovalActionRecord.java:12-45`；写入 `.../service/TaskActionService.java:516-568`）。任务详情回读 `TaskDetailRespDTO.java:65`、`BpmTodoController.java:277`；实例历史合并回读 `BpmMyInstanceController.java:214-237`。〔运行〕P58/P63 回执与可见浏览器证据。
- 主业务表单＝流程级 formKey 绑定，物理表落库并可复用〔静态〕：`sw_bpm_process_def.form_key`、`sw_bpm_instance.form_key`、`sw_bpm_form_binding`（`S/sw-bootstrap/src/main/resources/db/migration/postgresql/V0.1.0__baseline_seed.sql:657-677`）；物理表 `sw_form_{nanoId}`/`sw_form_table_{nanoId}`，逻辑名→物理列 `ColumnValidation.physicalColumnName:173-188`；读取入口 `FormRecordReadFacadeImpl.java:45-113`。〔运行〕P60/I3/P63 回执与浏览器链。
- 轮次与并行数据〔静态+运行〕：退回重办 `round_no`（`ApprovalActionRecord.java:36`、`TaskActionService.java:571-583`）；动态并行快照 `sw_bpm_dynamic_branch`（`round_no/execution_id/source_refs`，`V0.1.5__p63_dynamic_branch_semantics.sql:6-14`）；会签计票 `sw_bpm_consensus_vote`、加签 `sw_bpm_sign_record`（V0.1.0:3437-3456/3409-3435）。运行证据 `P63DynamicRoundBindingTest`、`P63DynamicParallelV2Test`、`ConsensusVoteConcurrencyTest`。
- 静态否定（本次独立复核 grep 零命中）〔静态〕：无节点级 formKey/节点表单绑定表；无任务级独立「表单实例」实体/表/服务（taskForm 零命中）；后端 admin 实例详情 `BpmInstanceController.java:124` 未回读节点意见数据（观察项）。

## B BPM 变量

- 「BPM变量」配置模型不存在〔静态否定〕：`BpmVariable|bpm_variable|VariableDef` 全仓零命中，无表/实体/Mapper/Service/DTO。
- 最接近既有机制〔静态+运行〕：
  - 受控表达式 `RestrictedExpressionEvaluator.java:97-137`（`form.`/`data.`/`variables.` 路径），用于条件分支与意见表单 `visibleWhen/initialExpression`；
  - 主表单字段读取 `FormRecordReadFacade`（`S/sw-biz/sw-biz-form/sw-biz-form-api/.../facade/FormRecordReadFacade.java:16-34`，实现 `FormRecordReadFacadeImpl.java:45-113`）；消费方 P63 的 `FormFieldParticipantResolver.java:69-100`、`DynamicBranchCollectionResolver.java:193-227`；
  - 节点意见表单数据仅落动作表，**不可**作变量读取（`TaskActionService.java:311-319` 只注入 `outcome/lastApprovalActorId`）；
  - 流程系统变量：发起写入 `approver/formKey/recordId/submitter/tenantId/formData/deviceKey/targetRecordId`（`ProcessStartService.java:163-176`）；动态并行 `VARIABLE` 源读 `execution.getVariable`（`DynamicBranchCollectionResolver.java:211-215,386-405`）。
- 类型与身份〔静态〕：仅表单 `FieldType`（`S/.../form/dynamic/FieldType.java:43-78`；TEXT/NUMBER/USER/DEPT/TABLE 等）；表格行 `List<Map>` 保留稳定 `id`（`FormRecordReadFacadeImpl.java:98-112`）；引用身份＝formKey＋字段逻辑名（`field/tableField/column`，见 `W/src/contracts/bpm-node.ts:33-48`）；发布期校验字段存在与数值比较类型（`GraphValidator.java:283-336`）；版本冻结 `sw_bpm_process_def_version.form_version/function_versions`。
- 静态否定：无变量类型系统（人员/部门/集合/表格行类型）、无聚合规则（并集/拼接/分组）、无 `bpmAdapter/VariableResolver`；字段改名/删除仅在发布期校验，运行期无映射兼容。

## C Trigger 事件与脚本

- 可触发事件〔静态+运行〕：表单提交 `FormSubmittedEvent`→`FlowStartPort`（`S/sw-biz/sw-biz-form/sw-biz-form-api/.../event/FormSubmittedEvent.java:17`、`.../port/FlowStartPort.java:27`，权威路径经 `sw_bpm_command`）；定时 `job_type=FLOW`→`ScheduledFlowStartPortImpl.java:40-70`；IoT 规则 `IotEventRule.java:30-32`（PROPERTY_CHANGED/THRESHOLD/EVENT_OCCUR/ONLINE/OFFLINE，`RuleEngineService.java:136-155,249-256`）。
- 节点办理完成/流程完成触发：**未找到**〔静态否定〕。`BpmNotifyTrigger.java:16-54` 仅通知枚举；`EndEventTranslator.java:53-58` 无监听。
- 脚本引擎＝IoT 专用，可复用〔静态+测试〕：GraalJS `GraalJsRunner.java:30,50-63`（`HostAccess.NONE`、禁 IO/进程/线程/原生/环境、语句上限 50 万、watcher 超时）；Java 子进程 `JavaSubprocessExecutor.java:41-60`（`-Xmx128m`、SecurityManager、超时强杀）。配置 `IotScript/IotScriptVersion/IotScriptExec`、表 `sw_iot_script*`（V0.1.0:2747-2810）；入口 `ScriptEngineService.execute/dryRun/realRun:64-140`。超时配置 `sw_iot_script.timeout_ms`（默认 5000，`ScriptExecutionSpec.java:22`）。运行证据 `GraalJsSandboxTest`、`JavaSubprocessSandboxTest`。
- 脚本数据入口与返回值〔静态〕：`handler(input)`/`__input__`/`fun_*`（`GraalJsRunner.java:82-92`）；input 键 `tenantId/actorId/triggerSource/triggerRef/deviceId`（`ScriptHostFunctions.baseInput:435-446`）+ IoT `topic/payload/deviceKey`（`IotScriptService.java:194-200`）；**无 BPM 表单/变量读取函数**；返回值仅落 `output_json`（`IotScriptExec.java:48`），**无结果匹配消费**。
- 副作用边界〔静态+测试〕：`fun_publish/fun_setProperty/fun_invokeAction/fun_startProcess` 受 `sideEffectAllowed` 门（`ScriptHostFunctions.java:98,202,244,271`）；`fun_startProcess` 限已发布模板并经 `sw_iot_process_trigger` 幂等（`IotProcessTriggerListener.java:28-33`）；`funEmitEvent` **无副作用门**（`:223-239`，dryRun 也写事件记录）〔待验证：是否构成越权面〕；无 HTTP/任意 DB 能力。
- 流程内「判断→分支」现状〔静态+运行〕：条件网关＝布尔受控表达式＋priority＋恰一 DEFAULT 边（`GraphToBpmnTranslator.java:318-360`、`GraphValidator.java:141-183`），审计 `sw_bpm_branch_trace`（V0.1.0:2398-2408）。返回值 Number/String/Boolean 精确匹配、触发/动作配置模型与 UI：**未找到**。
- 前端〔静态〕：工作流模块无脚本编辑、触发器配置、返回值分支映射界面（高级配置只读，`W/src/modules/workflow/views/ProcessDesigner.vue:1951-1997,2012-2130`）；IoT 模块有 `W/src/modules/iot/views/IotScriptList.vue`（创建/校验/试运行/发布）可作复用起点；条件分支连线无条件表达式面板（`ProcessDesigner.vue:1563-1589`）。
- 既有「动作」配置〔静态〕：`iot_device_action_json`（deviceSource FIXED/FORM_FIELD/VARIABLE、failurePolicy、deliveryMode，`W/src/modules/iot/views/IotFlowActions.vue:33-63`）；节点函数注册表 `sw_bpm_node_function`（RESOLVE_PARTICIPANTS/HANDLE_RESULT，仅内建 bean，`NodeFunctionService.java:19-34`）。

## D 跨流程动作、可靠执行与子流程

- 流程内发起他流程的服务任务/调用活动：**未找到**〔静态否定〕。发起唯一入口 `ProcessStartService.start:118,187`；触发源＝`FLOW_START`/`SCHEDULED_FLOW_START` 命令消费＋IoT `AFTER_COMMIT` 监听（`FlowStartPortImpl.java:52,66`、`IotProcessTriggerListener.java:76`）；`FLOW_START` 幂等 `SKIP_DUPLICATE`〔运行〕`T/p62/P62FrozenSemanticsPgTest.java:210`。
- 可靠底座已有〔静态+运行〕：`sw_bpm_command`（`command_key` 租户唯一、channel `NORMAL|P0`、状态 `PENDING→PROCESSING→COMPLETED|FAILED|EXPIRED`、`retry_count/next_retry_at/claim_token`）V0.1.0:2400,2488；P62 增 `logical_command_id+payload_fingerprint` 唯一、`tier/deadline/overdue`（`V0.1.2__tiered_command_semantics.sql:6,15,20`）；`sw_bpm_command_effect` 与业务同事务；对账 `TieredCommandReconcileJob.java:29`；重试上限 5；批项键 `BATCH:{batchKey}:{itemKey}`；表单 `submit_idempotency_key`。运行证据 `P62RecoveryDrillOrchestrationTest.java:80`（SIGKILL 恢复零重复）、`P62CrossChannelIdentityPgTest.java:244`。
- 批量〔静态+运行〕：`TxnBatchServiceImpl.java:33,88`（1—500 项，调用方显式 `itemKey/recordId`）、批量审批 `BpmBatchService`；`P62BatchInvokePgTest.java:125`。按集合元素/按字段 GROUP BY 生成「流程发起」的业务配置：**未找到**。
- 事务动作〔静态+运行〕：`sw_form_txn_action/_version/_invocation/_reservation/_ledger`（`TxnActionConfig.java:22-38`；RESERVE/CONFIRM/RELEASE/ADJUST；数量精度/有效期/非负），`TxnActionController`；P62 回执（结算须授权用户手工调用）。
- 子流程/父子〔静态否定〕：无 SUBPROCESS/CALL_ACTIVITY 翻译器；`parentProcessInstanceId/parent_instance/parentDefId` 全仓零命中（本次复核）；无父子表单输入输出映射与回写；无 ALL/ANY/COUNT/NONE 子流程等待（现有 ALL/ANY/RATIO/VETO 属会签/动态并行收敛，`ConsensusCompletionEvaluator.java:44-67`）；无 Barrier 节点。最接近＝单节点并行多实例（`DynamicParallelNodeTranslator.java:37`、`DynamicBranchCollectionResolver`），P63 方向已明示「非按行复制子流程」。
- 取消/退回/迟到〔静态+运行〕：撤回＝`terminateProcess` 删实例（`ApprovalLifecycleServiceImpl.java:304`）；退回＝`returnTask`（`TaskActionService.java:290`）；旧轮＝`SUPERSEDED_BY_ROUND/closeRemaining`（`DynamicBranchPortConfiguration.java:131,247`）；设备迟到收敛 UNKNOWN〔运行〕`P62DeviceReceiptPgTest.java:172`、`P63DynamicRoundBindingTest.java:304`。跨流程取消级联：未找到。
- 现有规模限制〔静态+运行〕：动态并行 `maxBranches` 1—200（默认 50，`DynamicBranchCollectionResolver.java:36,430`）、批量 1—500、重试 5、轻流程禁环/全量图仅禁自环（`LightProcessGraphValidator.java:79`）；**无**跨流程嵌套深度、派发总量、循环次数限制。

## E 组织、动态参与者与委托

- 组织模型〔静态+运行〕：`sys_user`/`sys_dept`（含 `leader_id`）/`sys_post`/`sys_user_post`（`user_id/post_id/dept_id`）/`sys_role`/`sys_user_role`/`sys_role_dept`/`sys_user_group(_member)`（V0.1.0:35,54,1638）；控制器测试 `DeptControllerTest`/`PostControllerTest`。
- 参与人策略 8 种〔静态+运行〕：`FIXED_USER/ROLE/DEPT_LEADER/POST/DEPT_POST/EXPRESSION/ADAPTER/FORM_FIELD`（`S/.../bpm/api/participant/ParticipantStrategy.java:9-28`，白名单单一权威）。P63 的 `FORM_FIELD` value＝`{objectType: USER|DEPT, scope: MAIN|TABLE, field, tableField, column}`，覆盖主字段/表格列 × 人员/部门八组合。
- 解析链〔静态+运行〕：`ApprovalTaskListener.java:129-257`（UserTask create 读 `participantConfig`→注册表解析；1 人 `setAssignee`、多人 `addCandidateUser`）→`ParticipantResolverRegistry.java:29-58`；快照 `sw_bpm_participant_snapshot`。会签 `ConsensusCollectionResolver`、动态并行 `DynamicBranchCollectionResolver` 复用注册表；动态并行分支审批人仍自行「来源部门→负责人」解析（历史例外）。
- 部门负责人＝`leader_id` 单值〔静态+运行〕：`DeptLeaderParticipantResolver.java:29-42`→`SysUserMapper.selectActiveUserIdsByDeptLeaders:52-76`；`FORM_FIELD(DEPT)` 经 `findDeptLeaderMap` 逐部门唯一负责人。
- 「分管领导」身份/字段/策略：**未找到**〔静态否定〕（仅前端 mock 出现字样 `W/src/foundation/mock/design-fixtures.ts:1176`）。P63 已发布的部门负责人语义须保持原义，主管岗位映射属新增量。
- 委托现状＝用户级〔静态+运行〕：`sw_bpm_authorize_rule`（`principal_id→agent_id`，范围 GLOBAL/PROCESS/NODE/BUSINESS，生效期，冲突拒绝，A→B→A 循环拒绝）与 `sw_bpm_handover`；代理仅当解析结果为单人时生效；审计 `sw_bpm_approval_action(AUTHORIZE+proxy_for_user_id)`（`ApprovalLifecycleServiceImpl.java:518-596,613-645`）。运行证据 `BpmHandoverServiceTest`、I4 回执 G3b。
- 静态否定：无岗位级委托表/服务（源岗位→受托岗位）、无岗位空缺/自委托/循环委托的岗位语义、无多级委托链（现仅单级）、无部门特殊选岗规则表、无「上一轮并行节点表单人员字段聚合」能力（`FormFieldParticipantResolver` 仅读当前实例单条记录；`ConsensusTaskListener.java:39-57` 只聚选票）、无组织范围（范围配置项）；多任职＝返回全部有效任职人（DISTINCT，`SysUserMapper.java:78-103`），无择一规则；空缺 fail-closed（`PARTICIPANT_RESOLVE_EMPTY`，动态并行默认阻断，`DynamicBranchCollectionResolver.java:127-135`）。
- Web〔静态+运行〕：`W/src/modules/system/views/PostList.vue`（岗位 CRUD）；`W/src/modules/workflow/views/TaskHandover.vue`（任务级委托/转办，`workflow/api/index.ts:630,645` 的规则 API 无页面消费）；无「岗位委托设置」页；设计器参与人面板 8 策略可选岗位/部门（`ProcessDesigner.vue:905-914`）。

## F 三场景与外部对端

- MES 业务模型〔静态否定〕：MES/工单/检验/首件/不良 在源码、SQL seed、Web mock 全零命中；仅 P64 方向与 Owner 摘要描述目标链（`product/p64-mes-advanced-orchestration/`）。
- IoT 已有〔运行〕：P21 设备/连接/Topic 订阅发布/消息日志/规则编排/受控脚本/命令下发；P62 设备回执 HMAC＋`iot:command:verify` 人工核实；P63 一次性预约（`IotCommandReservation`、`IotReservationDispatchJob`、`BpmIotReservationIntentRecorder`、`V0.1.6__p63_iot_command_reservation.sql`；同事务意图、到点认领、取消、迟到窗 1—3600s、UNKNOWN 禁自动重发），功能级 PASSED 10/10。
- 外部系统接缝〔部分运行〕：OpenAPI 外部发起/状态/嵌入办理/出站回调＋补投（`OpenApiProcessController.java:52-178`、`OpenApiCallbackDeliveryService`）；P62/P63 受控真实 HTTP 对端证据。ERP/WMS/PDA/扫码：无适配器、无扫码组件〔静态否定〕。
- 低代码事务与库存语义〔运行〕：可表达「数量预占-确认-释放」台账（见 §D）；无库存账、无单据类型、无多行明细；结算须授权用户手工调用。
- 数据权限与回写〔部分运行〕：`DataScopeType`（ALL/DEPT/DEPT_AND_CHILD/SELF/CUSTOM）＋表单记录级过滤（`FormDataScopeSupport.java:10-84`）——过滤单元＝整条记录，**子表行不单独过滤**；主记录乐观锁 `id+version`（`FormDataUpdateService.java:160-168,252-307`），子表行随主记录更新且不共享锁（`:972`）；BPM 仅白名单变量回写（`ResultEchoFunction.java:12-27`）。
- 三场景结论：S1 全链缺 MES 模型与编排触发；S2 需要「集合条件」「动态选人（表格部门）」部分具备（P63 FORM_FIELD＋8 策略），「上一轮聚合会签」「特殊部门选岗规则」缺失；S3 需要的分组子流程/隔离/回写/ALL 汇聚**缺失**（静态否定）。真值表见 §H。
- 真实对端台账〔延期/未验证〕：腾讯 IoT 实网（Owner 免验）、五渠道通知（Owner 延期）、企业微信 SSO（延期）；钉钉/飞书 SSO 真实链 PASSED。

## G 版本、迁移、开关、限制、资产与入口

- 流程定义版本化〔运行〕：`sw_bpm_process_def`（`def_version`、`status DRAFT|PUBLISHED`、`deployment_id`、`published_version`、`graph_json`＝草稿）与 `sw_bpm_process_def_version`（不可变发布行：`graph_version` 单调、`status PUBLISHED|SUSPENDED|DISABLED`、冻结 `graph_json/form_version/function_versions`）（`BpmProcessDef.java:42-99`、`BpmProcessDefVersion.java:13-52`、`V70__i3_process_def_version_freeze.sql:16-52`）；实例绑定 `def_version` 快照（`BpmInstance.java:61-64`、`ProcessStartService.java:206-209`）。
- 存量实例〔运行〕：发布行禁原地覆盖；`SUSPENDED` 仅禁新实例；**无**版本跟随/批量迁移 API；P62「在途对象不随新发布改变」与 I3 方向锁定。
- 迁移链〔运行〕：PG/H2 生产链 `sw-bootstrap/src/main/resources/db/migration/{postgresql,h2}/`：`V0.1.0__baseline_seed` → 终点 `V0.1.6__p63_iot_command_reservation.sql`，另有 `R__p62_*`×5、`R__p63_iot_reservation_menu`、`R__i6*`。模块主迁移目录为空（`.gitkeep`）；mysql/oracle 仅 README。追加模式先例＝P62 `V0.1.1—V0.1.4`、P63 `V0.1.5/0.1.6`。
- 启停/回退〔运行〕：模块级 `@ConditionalOnProperty`（`sw.{bpm,form,iot,notify,agent,storage,knowledge,job}.enabled`）；P62 新策略默认关闭 `sw_bpm_resource_policy.enabled DEFAULT FALSE`（`V0.1.4:24-42`）＋授权门 `form:action:invoke`；P63 缺省旧语义/零预约；回退演练 `P62CompatRollbackPgTest.java:43-52`。
- 限制配置〔静态+运行〕：`sw_iot_script.timeout_ms`、`sw.external-datasource.execution.max-rows/query-timeout`、`sw.iot.tencent.max-retry-count/queue-expiry-minutes`、DB 化 `sw_bpm_resource_policy`（`global/tenant_max_outstanding`、并发、`tenant_rate_per_sec`、`batch_slice_items`）。**无**脚本内存/CPU/并发上限键（Graal `MEMORY_LIMIT_BYTES` 声明未接入 resourceLimits〔待验证〕）。
- 回归资产〔静态计数〕：Server 测试类分布 form-biz 22、bpm-process 50、bpm-engine 20、system-biz 43、iot 12、bootstrap 69（其中 `p62/` 24、`p63/` 9）；关键类 `FormSubmitServiceTest`、`FormDataIsolationIntegrationTest`、`P63DynamicBranchPortV2Test`、`P63ManualParallelFlowableTest`、`OrgParticipantResolverContractTest`、`P62RecoveryDrillOrchestrationTest`、`FlywayFullChainH2/PostgresTest`。Web Vitest 153 spec（`ProcessDesigner`/`FormDesigner`/`IotFlowActions` 等）＋Playwright `e2e/`（4 spec，`playwright.config.ts`）。
- 用户可见入口〔静态〕：`W/src/router/index.ts`——表单设计器 `form/designer/:id`（:136）、表单定义列表 `form/form-def-list`（:167）、流程定义 `workflow/defs`（:200）、流程设计器 `workflow/defs/:defId/design`（:211）、流程中心 `workflow/center`（:318）、待办 `workspace/todo`（:43）、任务详情 `workflow/task/:taskId`（:222）、实例列表/详情 `workflow/instances`（:252，drawer）、模板 `workflow/templates`（:263）；管理后台部门/岗位 `system/views/DeptList|PostList`（V0.1.0:937-940）。
- 相关既有回执：P62 `product/p62-lowcode-transaction-bpm-tiering/receipts/final-delivery-01.md`（R08 冻结、A10 兼容回退、V0.1.2—0.1.4 追加）、`resource-assurance-01.md`、`local-transaction-actions-03.md`；P63 `receipts/completion-*-01.md`、`terminal-sync-*-01/02.md`、`receipts/evidence/acceptance-05/G10a.md`（迁移版本不冒充产品发布版本）。

## H S2 招商：业务原规则真值表（表格部门集合 ⊆ {A,B,C}）

| 组合 | 原文规则命中 | 交叠/未覆盖 | Planner 建议优先级结果 |
|---|---|---|---|
| {A} | 规则①「只有 A」 | 唯一 | 分支 1 |
| {B} | 规则②「有 B 但没有 A」 | 唯一 | 分支 2 |
| {C} | 无 | **未覆盖** | 未匹配处置 |
| {A,B} | 规则③「有 A + B」 | 唯一（规则④需 C） | 分支 3 |
| {A,C} | 无 | **未覆盖** | 未匹配处置 |
| {B,C} | 规则②（含 B 且无 A） | 唯一 | 分支 2 |
| {A,B,C} | 规则④「有 A+B+C」与规则③同真 | **交叠** | 建议分支 1（按方向建议优先级） |
| {} | 规则⑤「没有 A/B/C」 | 唯一 | 分支 4 |

结论：8 组合中 1 处交叠（{A,B,C}）、2 处未覆盖（{C}、{A,C}）；未覆盖与交叠的处置须由 Planner 裁决后在配置/发布期可诊断，不能依赖脚本遍历顺序。当前平台无「集合条件」配置模型，需先有 R02/R03。

## I 附：本次复核使用的原始命令结论（摘要）

- `grep -rIn -E 'callActivity|subProcess|SUBPROCESS' --include='*.java' --include='*.sql' sw-biz sw-bootstrap` → 0 命中。
- `grep -rIn -E 'BpmVariable|bpm_variable' --include='*.java' --include='*.sql' sw-biz sw-bootstrap` → 0 命中。
- `grep -rIn -E 'parentProcessInstanceId|parent_instance|parentDefId'`（两仓 java/sql/ts/vue）→ 0 命中。
- `grep -rIn -E 'opinionForm|opinion_form'` → 命中集中在 `ApprovalUserTaskTranslator`/`ApprovalOpinionValidator`/`ApprovalActionRecord`/`TaskActionService`/`TaskDetailRespDTO`（内联意见表单，非表单绑定）。
- 节点 `type()` 清单与 `ParticipantStrategy.ALL` 八项、`sw-bootstrap` 迁移文件列表（终点 `V0.1.6`）逐项回读一致。

（静态否定＝代码/迁移/夹具中零命中，不等于运行期不可用；正式结论仍需实现轮的行为验证。）

---

## J R01—R12 现状矩阵（回执§2 的完整版）

| R | 现状 | 主要依据/缺口 |
|---|---|---|
| R01 节点审批表单 | 部分 | 意见表单/轮次/回读〔运行〕（§A）；绑定已发布表单、任务级表单实例、人员部门表格控件缺 |
| R02 BPM变量 | 缺失 | 无模型/类型/聚合/来源选择器（§B）；近似表达式与 Facade 可复用 |
| R03 Trigger判断 | 缺失 | 无节点/流程完成编排触发、无返回值匹配（§C）；IoT 沙箱可复用 |
| R04 配置化动作 | 缺失（底座有） | 命令/幂等/恢复/事务动作/批量〔运行〕（§D）；判断→动作配置模型与 UI 缺 |
| R05 主子流程 | 缺失 | 无调用活动/父子实例/映射/等待策略/Barrier（§D）；动态并行非子流程 |
| R06 隔离与回写 | 部分 | 记录级权限＋主记录乐观锁〔运行〕（§F）；行级权限、按行回写、迟到版本化缺 |
| R07 动态参与者与岗位委托 | 部分 | 8 策略/负责人/快照〔运行〕（§E）；分管领导、岗位委托、特殊选岗、委托顺序审计缺 |
| R08 聚合选人 | 缺失 | 无跨任务/上一轮读取与人员并集去重（§E） |
| R09 异常循环与关联 | 缺失 | 无 MES 模型与循环约束（§F）；退回/撤回/旧轮收敛可复用 |
| R10 MES样板 | 缺失 | 全仓零命中（§F） |
| R11 设备事件与外部衔接 | 部分 | IoT＋OpenAPI＋受控对端〔运行〕；ERP/WMS/PDA 缺，实网延期未验证（§F） |
| R12 配置审计与兼容 | 部分 | 版本冻结/开关/回退〔运行〕（§G）；迁移工具、兼容窗口、限制值、三权分置缺 |

层级说明：〔运行〕＝既有测试/回执/浏览器证据；其余为本轮静态否定（grep 零命中），不代表运行期不可用。

## K XL 关键架构决策（供 Planner 与未来 ADR）

1. **子流程载体**：在引擎引入 call activity/子流程实例（动作集全、代价＝引擎与运行模型演进、存量兼容窗口长），或在业务层以「关联流程＋父子关联表＋汇聚」实现（复用 `sw_bpm_command` 可靠底座、代价＝派发/等待/回写语义由应用承担）。
2. **变量层**：新建独立 BPM 变量模型与解析器（类型/来源/聚合完整、代价＝新契约与设计器改造），或扩展现有受控表达式与字段读取（代价＝类型与聚合表达力受限）。
3. **脚本运行时**：复用 IoT GraalJS 沙箱并补 BPM 变量绑定、返回值匹配与内存/并发限制（代价＝跨模块耦合与安全边界复核），或新建 BPM trigger 子系统。
4. **任务级节点表单**：新建任务表单实例模型（可作变量来源、行级权限，代价＝新存储与迁移），或把 opinionForm 扩展为「引用已发布表单＋任务表单数据表」。
5. **岗位委托归属**：作为通用组织能力落 `sw-biz-system`（可复用、代价＝组织模型扩展），或作为 BPM 内规则表（局部、代价＝跨流程复用受限）。
6. **行级权限与按行回写**：以稳定行 ID（P63 动态分支来源行契约）统一「行级数据出口＋回写」，代价＝form 与 bpm 双方契约同步演进。


