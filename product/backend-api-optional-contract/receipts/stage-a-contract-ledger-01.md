# backend-api-optional-contract · 阶段 A 契约处置账本（121 个 AM ID）

> 角色：执行（Executor）  
> 日期：2026-09-24  
> 任务等级：XL  
> 权威来源：`search_fallback/backend-api-optional-contract-current-seams-supplement-01.md` 及 11 个 inventory TSV / 12 个 references TSV  
> 结果类型定义：`bpm-api/result/{MutationOutcome,BpmProcessStatus}.java`、`job-api/handler/JobExecutionOutcome.java`、`storage-api/StorageMutationOutcome.java`、`form-api/facade/SubmissionValidationOutcome.java`

## 1 统一契约规则（阶段 A 冻结）

| 语义层 | 规则 |
|---|---|
| present | 查询或命令已合法执行：合法零结果（空集合/空 Map/false/0）必须以 present 保留，不得改为 empty |
| empty | 仅表达查询目标/上下文不存在（对象标识为空、上下文字段缺失、目标记录/定义/实例不存在） |
| exception | 参数非法、权限拒绝、状态冲突、基础设施失败继续抛既有明确异常；不得以 empty 吞异常，也不得由调用方各自把同类异常映射成不同结果 |
| 类型约束 | 一律返回参数化 `Optional<T>`；禁止 raw `Optional`、`Optional<Void>`、嵌套 `Optional`、返回 `null` 的 `Optional` |
| void 改造 | 24 个原 `void` 方法改为 `Optional<结果类型>`：`MutationOutcome{APPLIED,ALREADY_APPLIED}`（bpm）、`JobExecutionOutcome{EXECUTED,NO_CHANGE}`（job）、`StorageMutationOutcome{APPLIED,ALREADY_APPLIED}`（storage）、`NotifySendResult`（notify）、`SubmissionValidationOutcome{VALID}`（form） |
| 哨兵 | `"NOT_FOUND"`、`-1` 等缺失哨兵消失：`BpmProcessStatus` 枚举承载合法状态，票数/分母返回 `Optional<Long>`（0 为 present）；openapi 边界把 empty 映射为原对外字面量 `"NOT_FOUND"`，外部 HTTP 契约不变 |

## 2 逐 AM ID 处置表（121 行，唯一且可复算）

| AM ID | 模块 | 契约类型 | 阶段 A 基线签名 | 最终签名 | 处置 |
|---|---|---|---|---|---|
| AM-055 | bpm | `BpmDeployFacade` | `String deployClasspathBpmn(String resourcePath, String deploymentName)` | `Optional<String> deployClasspathBpmn(String resourcePath, String deploymentName)` | 保留并合规 |
| AM-056 | bpm | `BpmDeployFacade` | `byte[] translateToBpmn(ProcessGraph graph)` | `Optional<byte[]> translateToBpmn(ProcessGraph graph)` | 保留并合规 |
| AM-057 | bpm | `BpmDeployFacade` | `BpmDeployResult deployModel(byte[] bpmnXml, String deploymentName)` | `Optional<BpmDeployResult> deployModel(byte[] bpmnXml, String deploymentName)` | 保留并合规 |
| AM-058 | bpm | `BpmDeployFacade` | `String getBpmnXml(String processDefinitionId)` | `Optional<String> getBpmnXml(String processDefinitionId)` | 保留并合规 |
| AM-059 | bpm | `BpmDeployFacade` | `void suspendProcessDefinition(String processDefinitionId)` | `Optional<MutationOutcome> suspendProcessDefinition(String processDefinitionId)` | 保留并合规 |
| AM-060 | bpm | `BpmDeployFacade` | `void activateProcessDefinition(String processDefinitionId)` | `Optional<MutationOutcome> activateProcessDefinition(String processDefinitionId)` | 保留并合规 |
| AM-061 | bpm | `BpmDeployFacade` | `String findProcessDefinitionIdByDeployment(String deploymentId)` | `—` | 删除且引用闭合 |
| AM-062 | bpm | `BpmRuntimeFacade` | `String startProcess(String processDefKey, String businessKey, Map<String, Object> variables, String tenantId)` | `Optional<String> startProcess(String processDefKey, String businessKey, Map<String, Object> variables, String tenantId)` | 保留并合规 |
| AM-063 | bpm | `BpmRuntimeFacade` | `List<String> getActiveActivityIds(String processInstanceId)` | `Optional<List<String>> getActiveActivityIds(String processInstanceId)` | 保留并合规 |
| AM-064 | bpm | `BpmRuntimeFacade` | `List<BpmActivityDTO> queryHistoricActivities(String processInstanceId)` | `Optional<List<BpmActivityDTO>> queryHistoricActivities(String processInstanceId)` | 保留并合规 |
| AM-065 | bpm | `BpmRuntimeFacade` | `Map<String, Object> getProcessVariables(String processInstanceId)` | `Optional<Map<String, Object>> getProcessVariables(String processInstanceId)` | 保留并合规 |
| AM-066 | bpm | `BpmRuntimeFacade` | `String getProcessInstanceStatus(String processInstanceId)` | `Optional<BpmProcessStatus> getProcessInstanceStatus(String processInstanceId)` | 保留并合规 |
| AM-102 | bpm | `ConsensusSettlementPort` | `void onNegativeSettlement(String tenantId, String processInstanceId, String nodeKey, String reason)` | `Optional<MutationOutcome> onNegativeSettlement(String tenantId, String processInstanceId, String nodeKey, String reason)` | 保留并合规 |
| AM-103 | bpm | `ConsensusVotePort` | `boolean record(String tenantId, String processInstanceId, String nodeKey, String taskId, String actorId, String outcome)` | `Optional<Boolean> record(String tenantId, String processInstanceId, String nodeKey, String taskId, String actorId, String outcome)` | 保留并合规 |
| AM-104 | bpm | `ConsensusVotePort` | `long count(String tenantId, String processInstanceId, String nodeKey, String outcome)` | `Optional<Long> count(String tenantId, String processInstanceId, String nodeKey, String outcome)` | 保留并合规 |
| AM-105 | bpm | `ConsensusVotePort` | `long total(String tenantId, String processInstanceId, String nodeKey)` | `Optional<Long> total(String tenantId, String processInstanceId, String nodeKey)` | 保留并合规 |
| AM-106 | bpm | `DynamicBranchPort` | `List<FrozenBranch> freeze(String tenantId, String processInstanceId, String nodeKey, String sourceType, String sourceDesc, String mode, List<BranchCandidate> candidates)` | `Optional<List<FrozenBranch>> freeze(String tenantId, String processInstanceId, String nodeKey, String sourceType, String sourceDesc, String mode, List<BranchCandidate> candidates)` | 保留并合规 |
| AM-107 | bpm | `DynamicBranchPort` | `void recordAction(String tenantId, String processInstanceId, String nodeKey, String leaderId, String taskId, String action, String reason)` | `Optional<MutationOutcome> recordAction(String tenantId, String processInstanceId, String nodeKey, String leaderId, String taskId, String action, String reason)` | 保留并合规 |
| AM-108 | bpm | `DynamicBranchPort` | `void closeRemaining(String tenantId, String processInstanceId, String nodeKey, String reason)` | `Optional<MutationOutcome> closeRemaining(String tenantId, String processInstanceId, String nodeKey, String reason)` | 保留并合规 |
| AM-109 | bpm | `LifecycleTaskEntryPort` | `String onTaskCreate(Long tenantId, String processInstanceId, String nodeKey, String taskId, List<String> resolvedUsers, String nodeConfig)` | `Optional<String> onTaskCreate(Long tenantId, String processInstanceId, String nodeKey, String taskId, List<String> resolvedUsers, String nodeConfig)` | 保留并合规 |
| AM-110 | bpm | `LifecycleTaskEntryPort` | `List<String> resolveParticipantsByFunction(Long tenantId, String processInstanceId, String nodeKey, String taskId, Map<String, Object> variables, String nodeConfig)` | `Optional<List<String>> resolveParticipantsByFunction(Long tenantId, String processInstanceId, String nodeKey, String taskId, Map<String, Object> variables, String nodeConfig)` | 保留并合规 |
| AM-111 | bpm | `NodeActionAuditPort` | `void recordCopy(String processInstanceId, String nodeKey, String taskId, String recipientId, String status, String reason, Long tenantId)` | `Optional<MutationOutcome> recordCopy(String processInstanceId, String nodeKey, String taskId, String recipientId, String status, String reason, Long tenantId)` | 保留并合规 |
| AM-112 | bpm | `NodeActionAuditPort` | `void recordBranch(String processInstanceId, String nodeKey, String branchId, String conditionVersion, Map<String, Object> inputSummary, Long tenantId)` | `Optional<MutationOutcome> recordBranch(String processInstanceId, String nodeKey, String branchId, String conditionVersion, Map<String, Object> inputSummary, Long tenantId)` | 保留并合规 |
| AM-117 | bpm | `ParticipantSnapshotRecorder` | `void record(String processInstanceId, String nodeKey, String taskId, List<String> participantIds, Long tenantId)` | `Optional<MutationOutcome> record(String processInstanceId, String nodeKey, String taskId, List<String> participantIds, Long tenantId) / Optional<MutationOutcome> record(String processInstanceId, String nodeKey, String taskId, List<String> participantIds, Map<String, String> displayNames, Long tenantId)` | 保留并合规 |
| AM-118 | bpm | `ParticipantSnapshotRecorder` | `void record(String processInstanceId, String nodeKey, String taskId, List<String> participantIds, Map<String, String> displayNames, Long tenantId)` | `Optional<MutationOutcome> record(String processInstanceId, String nodeKey, String taskId, List<String> participantIds, Long tenantId) / Optional<MutationOutcome> record(String processInstanceId, String nodeKey, String taskId, List<String> participantIds, Map<String, String> displayNames, Long tenantId)` | 保留并合规 |
| AM-119 | bpm | `ParticipantSnapshotRecorder` | `void settle(String processInstanceId, String nodeKey, String taskId, String actorId, String action, Long tenantId)` | `Optional<MutationOutcome> settle(String processInstanceId, String nodeKey, String taskId, String actorId, String action, Long tenantId)` | 保留并合规 |
| AM-093 | bpm | `BpmNodeDefinition` | `String type()` | `Optional<String> type()` | 保留并合规 |
| AM-094 | bpm | `BpmNodeDefinition` | `BpmNodeMetadata metadata()` | `Optional<BpmNodeMetadata> metadata()` | 保留并合规 |
| AM-095 | bpm | `BpmNodeDefinition` | `List<GraphValidationError> validateConfig(GraphElement node)` | `Optional<List<GraphValidationError>> validateConfig(GraphElement node)` | 保留并合规 |
| AM-096 | bpm | `BpmNodeRegistry` | `List<BpmNodeDefinition> definitions()` | `Optional<List<BpmNodeDefinition>> definitions()` | 保留并合规 |
| AM-097 | bpm | `BpmNodeRegistry` | `Optional<BpmNodeDefinition> find(String type)` | `Optional<BpmNodeDefinition> find(String type)` | 保留并合规 |
| AM-098 | bpm | `BpmNodeRegistry` | `List<BpmNodeCapabilityDTO> capabilities()` | `Optional<List<BpmNodeCapabilityDTO>> capabilities()` | 保留并合规 |
| AM-099 | bpm | `BpmNodeRegistry` | `List<GraphValidationError> validateConfig(GraphElement node)` | `Optional<List<GraphValidationError>> validateConfig(GraphElement node)` | 保留并合规 |
| AM-100 | bpm | `ParticipantFunction` | `List<String> resolveParticipants(NodeFunctionContext context)` | `Optional<List<String>> resolveParticipants(NodeFunctionContext context)` | 保留并合规 |
| AM-101 | bpm | `ResultFunction` | `NodeFunctionResult handleResult(NodeFunctionContext context, Map<String, Object> nodeResult)` | `Optional<NodeFunctionResult> handleResult(NodeFunctionContext context, Map<String, Object> nodeResult)` | 保留并合规 |
| AM-113 | bpm | `NodeParticipantAdapter` | `String id()` | `Optional<String> id()` | 保留并合规 |
| AM-114 | bpm | `NodeParticipantAdapter` | `List<String> resolve(NodeParticipantContext context)` | `Optional<List<String>> resolve(NodeParticipantContext context)` | 保留并合规 |
| AM-115 | bpm | `NodeParticipantResolver` | `String strategy()` | `Optional<String> strategy()` | 保留并合规 |
| AM-116 | bpm | `NodeParticipantResolver` | `List<String> resolve(NodeParticipantContext context)` | `Optional<List<String>> resolve(NodeParticipantContext context)` | 保留并合规 |
| AM-120 | bpm | `ApproverResolver` | `String resolve(ApproverContext context)` | `Optional<String> resolve(ApproverContext context)` | 保留并合规 |
| AM-121 | bpm | `NodeApproverResolver` | `List<String> resolve(NodeApproverContext context)` | `Optional<List<String>> resolve(NodeApproverContext context)` | 保留并合规 |
| AM-052 | bpm | `RestrictedExpressionEvaluator` | `Object value(String expression, Map<String, Object> variables)` | `Optional<Object> value(String expression, Map<String, Object> variables)` | 保留并合规 |
| AM-053 | bpm | `RestrictedExpressionEvaluator` | `boolean matches(String expression, Map<String, Object> variables)` | `Optional<Boolean> matches(String expression, Map<String, Object> variables)` | 保留并合规 |
| AM-054 | bpm | `RestrictedExpressionEvaluator` | `List<String> values(String expression, Map<String, Object> variables)` | `Optional<List<String>> values(String expression, Map<String, Object> variables)` | 保留并合规 |
| AM-067 | bpm | `BpmTaskFacade` | `List<BpmTaskDTO> queryTodo(String tenantId, String assignee)` | `Optional<List<BpmTaskDTO>> queryTodo(String tenantId, String assignee)` | 保留并合规 |
| AM-068 | bpm | `BpmTaskFacade` | `List<BpmTaskDTO> queryTodoPage(String tenantId, String assignee, int offset, int limit)` | `Optional<List<BpmTaskDTO>> queryTodoPage(String tenantId, String assignee, int offset, int limit)` | 保留并合规 |
| AM-069 | bpm | `BpmTaskFacade` | `long countTodo(String tenantId, String assignee)` | `Optional<Long> countTodo(String tenantId, String assignee)` | 保留并合规 |
| AM-070 | bpm | `BpmTaskFacade` | `List<BpmTaskDTO> queryByProcessInstance(String processInstanceId)` | `Optional<List<BpmTaskDTO>> queryByProcessInstance(String processInstanceId)` | 保留并合规 |
| AM-071 | bpm | `BpmTaskFacade` | `BpmTaskDTO getTask(String taskId)` | `Optional<BpmTaskDTO> getTask(String taskId)` | 保留并合规 |
| AM-072 | bpm | `BpmTaskFacade` | `void complete(String taskId, Map<String, Object> variables)` | `Optional<MutationOutcome> complete(String taskId, Map<String, Object> variables)` | 保留并合规 |
| AM-073 | bpm | `BpmTaskFacade` | `void completeAsUser(String taskId, String userId, Map<String, Object> variables)` | `Optional<MutationOutcome> completeAsUser(String taskId, String userId, Map<String, Object> variables)` | 保留并合规 |
| AM-074 | bpm | `BpmTaskFacade` | `void terminateProcess(String processInstanceId, String reason)` | `Optional<MutationOutcome> terminateProcess(String processInstanceId, String reason)` | 保留并合规 |
| AM-075 | bpm | `BpmTaskFacade` | `void suspendProcessInstance(String processInstanceId)` | `Optional<MutationOutcome> suspendProcessInstance(String processInstanceId)` | 保留并合规 |
| AM-076 | bpm | `BpmTaskFacade` | `void resumeProcessInstance(String processInstanceId)` | `Optional<MutationOutcome> resumeProcessInstance(String processInstanceId)` | 保留并合规 |
| AM-077 | bpm | `BpmTaskFacade` | `boolean isProcessInstanceSuspended(String processInstanceId)` | `Optional<Boolean> isProcessInstanceSuspended(String processInstanceId)` | 保留并合规 |
| AM-078 | bpm | `BpmTaskFacade` | `boolean canHandle(String taskId, String userId)` | `Optional<Boolean> canHandle(String taskId, String userId)` | 保留并合规 |
| AM-079 | bpm | `BpmTaskFacade` | `void returnTask(String taskId, String targetNodeId)` | `Optional<MutationOutcome> returnTask(String taskId, String targetNodeId)` | 保留并合规 |
| AM-080 | bpm | `BpmTaskFacade` | `boolean isProcessActive(String processInstanceId)` | `Optional<Boolean> isProcessActive(String processInstanceId)` | 保留并合规 |
| AM-081 | bpm | `BpmTaskFacade` | `String getVariable(String processInstanceId, String name)` | `Optional<String> getVariable(String processInstanceId, String name)` | 保留并合规 |
| AM-082 | bpm | `BpmTaskFacade` | `String getBusinessKey(String processInstanceId)` | `Optional<String> getBusinessKey(String processInstanceId)` | 保留并合规 |
| AM-083 | bpm | `BpmTaskFacade` | `Map<String, Object> getVariables(String processInstanceId)` | `Optional<Map<String, Object>> getVariables(String processInstanceId)` | 保留并合规 |
| AM-084 | bpm | `BpmTaskFacade` | `void setVariable(String processInstanceId, String name, Object value)` | `Optional<MutationOutcome> setVariable(String processInstanceId, String name, Object value)` | 保留并合规 |
| AM-085 | bpm | `BpmTaskFacade` | `Map<String, Object> getHistoricVariables(String processInstanceId)` | `Optional<Map<String, Object>> getHistoricVariables(String processInstanceId)` | 保留并合规 |
| AM-086 | bpm | `BpmTaskFacade` | `List<BpmTaskDTO> queryProcessedPage(String tenantId, String assignee, int offset, int limit)` | `Optional<List<BpmTaskDTO>> queryProcessedPage(String tenantId, String assignee, int offset, int limit)` | 保留并合规 |
| AM-087 | bpm | `BpmTaskFacade` | `long countProcessed(String tenantId, String assignee)` | `Optional<Long> countProcessed(String tenantId, String assignee)` | 保留并合规 |
| AM-088 | bpm | `BpmTaskFacade` | `List<BpmTaskDTO> queryHistoryByProcessInstance(String processInstanceId)` | `Optional<List<BpmTaskDTO>> queryHistoryByProcessInstance(String processInstanceId)` | 保留并合规 |
| AM-089 | bpm | `BpmTaskFacade` | `void setAssignee(String taskId, String userId)` | `Optional<MutationOutcome> setAssignee(String taskId, String userId)` | 保留并合规 |
| AM-090 | bpm | `BpmTaskFacade` | `void delegateTask(String taskId, String userId)` | `Optional<MutationOutcome> delegateTask(String taskId, String userId)` | 保留并合规 |
| AM-091 | bpm | `BpmTaskFacade` | `String getTaskOwner(String taskId)` | `—` | 删除且引用闭合 |
| AM-092 | bpm | `BpmTaskFacade` | `void addCandidateUser(String taskId, String userId)` | `—` | 删除且引用闭合 |
| AM-023 | form | `FormDataSubmitFacade` | `String submit(String formKey, Map<String, Object> submittedData, String idempotencyKey)` | `Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey) / Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel) / Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel, String processDefKey)` | 保留并合规 |
| AM-024 | form | `FormDataSubmitFacade` | `String submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel)` | `Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey) / Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel) / Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel, String processDefKey)` | 保留并合规 |
| AM-025 | form | `FormDataSubmitFacade` | `String submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel, String processDefKey)` | `Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey) / Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel) / Optional<String> submit(String formKey, Map<String, Object> submittedData, String idempotencyKey, String dispatchChannel, String processDefKey)` | 保留并合规 |
| AM-026 | form | `FormDataSubmitFacade` | `void validateSubmission(String formKey, Map<String, Object> submittedData)` | `Optional<SubmissionValidationOutcome> validateSubmission(String formKey, Map<String, Object> submittedData)` | 保留并合规 |
| AM-027 | form | `FormDefinitionService` | `String getFormDefinition(String formKey)` | `Optional<String> getFormDefinition(String formKey)` | 保留并合规 |
| AM-028 | form | `FormDefinitionService` | `String getFormDefinitionById(String formId)` | `—` | 删除且引用闭合 |
| AM-029 | form | `FormDefinitionService` | `boolean formExists(String formKey)` | `Optional<Boolean> formExists(String formKey)` | 保留并合规 |
| AM-030 | form | `FormDefinitionService` | `FormDefDTO getFormDef(String formKey)` | `Optional<FormDefDTO> getFormDef(String formKey)` | 保留并合规 |
| AM-031 | form | `FormDefinitionService` | `FormDefDTO getFormDefById(String formId)` | `—` | 删除且引用闭合 |
| AM-032 | form | `FormDefinitionService` | `boolean canCurrentUserInitiate(String formKey)` | `Optional<Boolean> canCurrentUserInitiate(String formKey)` | 保留并合规 |
| AM-033 | form | `FormDefinitionService` | `boolean canCurrentUserPerformAction(String formKey, String action)` | `Optional<Boolean> canCurrentUserPerformAction(String formKey, String action)` | 保留并合规 |
| AM-034 | form | `FormDefinitionService` | `boolean canCurrentUserAccessRecord(String formKey, String recordId)` | `Optional<Boolean> canCurrentUserAccessRecord(String formKey, String recordId)` | 保留并合规 |
| AM-035 | form | `ExtDatasourceQueryPort` | `ExtQueryResult executeQuery(Long datasourceId, String sql, Long operatorId, String operatorName)` | `Optional<ExtQueryResult> executeQuery(Long datasourceId, String sql, Long operatorId, String operatorName)` | 保留并合规 |
| AM-036 | form | `FlowStartPort` | `Long acceptFlowStart(FormSubmittedEvent event)` | `Optional<Long> acceptFlowStart(FormSubmittedEvent event)` | 保留并合规 |
| AM-001 | job | `JobFacade` | `JobInfoDTO getById(Long jobId)` | `Optional<JobInfoDTO> getById(Long jobId)` | 保留并合规 |
| AM-002 | job | `JobFacade` | `JobInfoDTO getByJobName(String jobName)` | `Optional<JobInfoDTO> getByJobName(String jobName)` | 保留并合规 |
| AM-003 | job | `JobHandler` | `void execute(String params)` | `Optional<JobExecutionOutcome> execute(String params)` | 保留并合规 |
| AM-004 | job | `JobHandler` | `String getName()` | `Optional<String> getName()` | 保留并合规 |
| AM-005 | notify | `NotifyChannelAdapter` | `NotifyChannel channel()` | `Optional<NotifyChannel> channel()` | 保留并合规 |
| AM-006 | notify | `NotifyChannelAdapter` | `NotifySendResult send(NotifySendRequest request)` | `Optional<NotifySendResult> send(NotifySendRequest request)` | 保留并合规 |
| AM-007 | notify | `NotifyFacade` | `void send(SendNotifyCommand cmd)` | `Optional<NotifySendResult> send(SendNotifyCommand cmd) / Optional<NotifySendResult> send(NotifySendRequest request)` | 保留并合规 |
| AM-008 | notify | `NotifyFacade` | `NotifySendResult send(NotifySendRequest request)` | `Optional<NotifySendResult> send(SendNotifyCommand cmd) / Optional<NotifySendResult> send(NotifySendRequest request)` | 保留并合规 |
| AM-009 | notify | `NotifyFacade` | `NotifySendResult attemptDelivery(NotifySendRequest request)` | `Optional<NotifySendResult> attemptDelivery(NotifySendRequest request)` | 保留并合规 |
| AM-010 | notify | `NotifyLinkAuthorizer` | `boolean canOpen(String linkType, String linkId)` | `Optional<Boolean> canOpen(String linkType, String linkId)` | 保留并合规 |
| AM-011 | notify | `NotifyRoutingService` | `List<NotifyChannel> channelsFor(String eventType, Long recipientId)` | `Optional<List<NotifyChannel>> channelsFor(String eventType, Long recipientId)` | 保留并合规 |
| AM-012 | notify | `NotifyRoutingService` | `boolean required(String eventType)` | `Optional<Boolean> required(String eventType)` | 保留并合规 |
| AM-013 | notify | `NotifyRoutingService` | `NotifyTemplateSelection templateFor(String eventType, NotifyChannel channel, Long tenantId)` | `Optional<NotifyTemplateSelection> templateFor(String eventType, NotifyChannel channel, Long tenantId)` | 保留并合规 |
| AM-014 | notify | `NotifyTargetResolver` | `String resolveEmail(Long userId)` | `Optional<String> resolveEmail(Long userId)` | 保留并合规 |
| AM-015 | notify | `NotifyTargetResolver` | `String resolvePhone(Long userId)` | `Optional<String> resolvePhone(Long userId)` | 保留并合规 |
| AM-016 | notify | `NotifyTargetResolver` | `NotifyTargetResolution resolvePhoneForTenant(Long tenantId, Long userId)` | `Optional<NotifyTargetResolution> resolvePhoneForTenant(Long tenantId, Long userId)` | 保留并合规 |
| AM-017 | notify | `NotifyTargetResolver` | `String resolveProviderSubject(Long tenantId, Long userId, String provider)` | `Optional<String> resolveProviderSubject(Long tenantId, Long userId, String provider)` | 保留并合规 |
| AM-018 | storage | `StorageFacade` | `StorageUploadResult upload(InputStream inputStream, String originalName, String contentType)` | `Optional<StorageUploadResult> upload(InputStream inputStream, String originalName, String contentType)` | 保留并合规 |
| AM-019 | storage | `StorageFacade` | `InputStream download(String storageKey)` | `Optional<InputStream> download(String storageKey)` | 保留并合规 |
| AM-020 | storage | `StorageFacade` | `void delete(String storageKey)` | `Optional<StorageMutationOutcome> delete(String storageKey)` | 保留并合规 |
| AM-021 | storage | `StorageFacade` | `String getUrl(String storageKey)` | `—` | 删除且引用闭合 |
| AM-022 | storage | `StorageFacade` | `boolean exists(String storageKey)` | `Optional<Boolean> exists(String storageKey)` | 保留并合规 |
| AM-037 | system | `DeptQueryFacade` | `List<DeptOptionDTO> searchActiveDepts(String keyword, int limit)` | `—` | 删除且引用闭合 |
| AM-038 | system | `DeptQueryFacade` | `List<Long> findActiveDeptIds(Collection<Long> ids)` | `Optional<List<Long>> findActiveDeptIds(Collection<Long> ids)` | 保留并合规 |
| AM-039 | system | `DictFacade` | `List<DictItemDTO> listByType(String dictType)` | `Optional<List<DictItemDTO>> listByType(String dictType)` | 保留并合规 |
| AM-040 | system | `DictFacade` | `boolean isValidCode(String dictType, String code)` | `Optional<Boolean> isValidCode(String dictType, String code)` | 保留并合规 |
| AM-041 | system | `DictFacade` | `String resolveLabel(String dictType, String code)` | `—` | 删除且引用闭合 |
| AM-042 | system | `TenantValidityFacade` | `boolean isValid(Long tenantId)` | `Optional<Boolean> isValid(Long tenantId)` | 保留并合规 |
| AM-043 | system | `UserQueryFacade` | `List<UserOptionDTO> searchActiveUsers(String keyword, int limit)` | `Optional<List<UserOptionDTO>> searchActiveUsers(String keyword, int limit)` | 保留并合规 |
| AM-044 | system | `UserQueryFacade` | `Map<Long, String> getUserDisplayNames(Collection<Long> ids)` | `Optional<Map<Long, String>> getUserDisplayNames(Collection<Long> ids)` | 保留并合规 |
| AM-045 | system | `UserQueryFacade` | `List<Long> findActiveUserIds(Collection<Long> ids)` | `Optional<List<Long>> findActiveUserIds(Collection<Long> ids) / Optional<List<Long>> findActiveUserIds(Collection<Long> ids, Long tenantId)` | 保留并合规 |
| AM-046 | system | `UserQueryFacade` | `List<Long> findActiveUserIds(Collection<Long> ids, Long tenantId)` | `Optional<List<Long>> findActiveUserIds(Collection<Long> ids) / Optional<List<Long>> findActiveUserIds(Collection<Long> ids, Long tenantId)` | 保留并合规 |
| AM-047 | system | `UserQueryFacade` | `List<Long> findActiveUserIdsByRoleCodes(Collection<String> roleCodes)` | `Optional<List<Long>> findActiveUserIdsByRoleCodes(Collection<String> roleCodes) / Optional<List<Long>> findActiveUserIdsByRoleCodes(Collection<String> roleCodes, Long tenantId)` | 保留并合规 |
| AM-048 | system | `UserQueryFacade` | `List<Long> findActiveUserIdsByRoleCodes(Collection<String> roleCodes, Long tenantId)` | `Optional<List<Long>> findActiveUserIdsByRoleCodes(Collection<String> roleCodes) / Optional<List<Long>> findActiveUserIdsByRoleCodes(Collection<String> roleCodes, Long tenantId)` | 保留并合规 |
| AM-049 | system | `UserQueryFacade` | `List<Long> findActiveUserIdsByDeptLeaders(Collection<Long> deptIds, Long tenantId)` | `Optional<List<Long>> findActiveUserIdsByDeptLeaders(Collection<Long> deptIds, Long tenantId)` | 保留并合规 |
| AM-050 | system | `UserQueryFacade` | `List<Long> findActiveUserIdsByPostCodes(Collection<String> postCodes, Long tenantId)` | `Optional<List<Long>> findActiveUserIdsByPostCodes(Collection<String> postCodes, Long tenantId)` | 保留并合规 |
| AM-051 | system | `UserQueryFacade` | `List<Long> findActiveUserIdsByDeptAndPost(Long deptId, String postCode, Long tenantId)` | `Optional<List<Long>> findActiveUserIdsByDeptAndPost(Long deptId, String postCode, Long tenantId)` | 保留并合规 |

## 3 处置汇总

- 保留并合规：**113**（其中 AM-097 `BpmNodeRegistry#find` 在基线已合规，本轮仅复核；其余 112 项完成签名与语义迁移）
- 删除并闭合：**8**，全部来自基线的 `ZERO_CALLER:UNUSED_FACADE_METHOD` 分类，删除依据=零生产调用 + 零测试断言 + 无继续承担契约的必要：

| AM ID | 删除项 | 删除前引用面 | 闭合证据 |
|---|---|---|---|
| AM-021 | `StorageFacade#getUrl(String)` | 生产 0 / 测试 0 | 实现方法删除；`StorageProvider#getUrl` 为其它类型方法，保留 |
| AM-028 | `FormDefinitionService#getFormDefinitionById(String)` | 生产 0 / 测试桩 1 | 实现方法删除；bpm-process 测试桩同步删除 |
| AM-031 | `FormDefinitionService#getFormDefById(String)` | 生产 0 / 测试桩 1 | 同上 |
| AM-037 | `DeptQueryFacade#searchActiveDepts(String,int)` | 生产 0 / 测试 0 | 实现方法删除；对外候选查询仍由 form 侧入口提供 |
| AM-041 | `DictFacade#resolveLabel(String,String)` | 生产 0 / 测试 2 | 实现方法删除；`DictFacadeTest` 用例与 javadoc 引用删除 |
| AM-061 | `BpmDeployFacade#findProcessDefinitionIdByDeployment(String)` | 生产 0 / 测试 0 | 实现方法删除 |
| AM-091 | `BpmTaskFacade#getTaskOwner(String)` | 生产 0 / 测试 0 | 实现方法删除；真实加签/委托链仍由引擎监听器驱动 |
| AM-092 | `BpmTaskFacade#addCandidateUser(String,String)` | 生产 0 / 测试 0 | 实现方法删除；Flowable `DelegateTask#addCandidateUser` 属第三方方法，保留 |

- 零调用但保留：`AM-012 NotifyRoutingService#required`（保留依据：I6 规则状态的唯一可观测契约，被 `I6NotifyClosureIntegrationTest` 断言；已按统一契约迁移为 `Optional<Boolean>`）；`AM-001/AM-002 JobFacade#getById/getByJobName`（RESERVED_API，BPM 预留契约）；`AM-004 JobHandler#getName`（MODULE_INTERNAL_SPI，bean 名匹配机制）；`AM-015 NotifyTargetResolver#resolvePhone`（API_DEFAULT_DELEGATED，被接口 default 调用）；`AM-120 ApproverResolver#resolve`（DEPRECATED，有内部调用者，退休为独立小刀）。
- 账本闭合性：121 行 = 113 保留 + 8 删除，无遗漏、无重复；`AM-097` 之外无未登记新公开契约（新增类型仅为结果类型与状态枚举，由架构守门统一覆盖）。

## 4 新增公共结果类型

| 类型 | 位置 | 取值 | 覆盖方法数 |
|---|---|---|---|
| `MutationOutcome` | `com.sw.ck.bpm.api.result` | `APPLIED` / `ALREADY_APPLIED` | 19 个原 void（bpm） |
| `BpmProcessStatus` | `com.sw.ck.bpm.api.result` | `RUNNING/APPROVED/REJECTED/WITHDRAWN/DISCARDED/FAILED/TERMINATED/UNKNOWN` | AM-066（哨兵改类型化） |
| `JobExecutionOutcome` | `com.sw.ck.job.handler` | `EXECUTED` / `NO_CHANGE` | AM-003 |
| `StorageMutationOutcome` | `com.sw.ck.storage.api` | `APPLIED` / `ALREADY_APPLIED` | AM-020 |
| `SubmissionValidationOutcome` | `com.sw.ck.form.api.facade` | `VALID` | AM-026 |

## 5 与方向基线的一致性

- 方法论基线 121 个 AM ID 全部落入本账本，无新增/未登记项。
- 影响基线 49 个实现文件、239 个生产调用点、230 个测试引用点均为迁移核对基线；实际勾稽结果见整体完成回执。
- 阶段 A 只锁定契约；迁移完成与行为证据由阶段 B/C 回执给出，本文件不表示功能完成。
