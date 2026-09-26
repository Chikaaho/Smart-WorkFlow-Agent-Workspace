# 后端跨模块 API `Optional` 契约现状 · 探索回执

> 任务：`search_task/backend-api-optional-contract-current-seams.md`。只读探索：未改文件、未跑编译/测试。

## 1 结论

7 个 `-api` 模块中 6 个含调用面（openapi-api 仅错误码枚举，0 接口）：**33 接口 / 118 方法**（含 15 default）。已合规仅 1：`BpmNodeRegistry.find→Optional<BpmNodeDefinition>`（BpmNodeRegistry.java:22），未包装 117。**无 ArchUnit/Checkstyle/ErrorProne/NullAway 守门**（全仓 pom 无），机械验证需新建。全仓无异步返回形态（无 CompletableFuture/@Async）；事件走 sw-common DomainEventPublisher（无返回值）。61 个 Controller 全在 biz/engine/process/iot/agent，HTTP 契约与 -api Java 面解耦。

## 2 计数与复算规则

- 按返回：void 24 / boolean 13 / long 4 / Long 1 / List·Map 33 / byte[] 1 / String 24 / 对象 17 / Optional 1=118。分页均 List+offset/limit，无 Page 类型。
- 按模块：job 4 / notify 13 / storage 5 / form 14 / system 15 / bpm 67。另计静态工具 RestrictedExpressionEvaluator（3 static，engine 5 文件、process 2）。
- 复算：接口=7 个 `-api` 内 `public interface` 方法（含 default；排除 record 头/DTO/枚举/异常/错误码）；调用方=`grep -rl '\b<接口>\b' --include='*.java' sw-{basic,biz,framework,bootstrap}` 取 `/src/main/`（test 同法）。清点脚本会话内执行未入仓，规则可重放。

## 3 接口×方法×生产调用方（消费←实现）

- job：JobFacade 2（**外部调用 0**）；JobHandler 2（main 零实现，SPI 预留；SwJobBean:62 Map 消费）。
- notify：NotifyFacade 3（engine 4 文件、process 2；iot IotDeviceFacade 仅 javadoc 提及）；NotifyRoutingService 3（engine 1、process 2）；NotifyChannelAdapter 2（无外部，自实现 5 适配器）；NotifyLinkAuthorizer 1（notify-biz←process）；NotifyTargetResolver 4（notify-biz←system-biz）。
- storage：StorageFacade 5（form-biz 1、process 1）。
- form：FormDataSubmitFacade 4（openapi-biz 1、process 2）；FormDefinitionService 8（process 5）；ExtDatasourceQueryPort 1（form-biz 2←engine）；FlowStartPort 1（form-biz←process）。
- system：DeptQueryFacade 2（form-biz 2、engine 1）；DictFacade 3（form-biz 3）；TenantValidityFacade 1（openapi-biz 1）；UserQueryFacade 9（form-biz 2、engine 9、process 10）。
- bpm：BpmTaskFacade 26（openapi-biz 1、process 13）；BpmDeployFacade 7（process 3）；BpmRuntimeFacade 5（openapi-biz 1、process 4）；BpmNodeRegistry 4（engine 3、process 2）；BpmNodeDefinition 3（engine NodeTypeTranslator:24 继承、process GraphValidator:210）；ConsensusVotePort 3、LifecycleTaskEntryPort 2、ParticipantSnapshotRecorder 3、DynamicBranchPort 3、NodeActionAuditPort 2、ConsensusSettlementPort 1（均 engine←process 匿名 bean：BpmLifecyclePortConfiguration、DynamicBranchPortConfiguration）；NodeApproverResolver 1（engine 2 实现）；NodeParticipantAdapter 2、NodeParticipantResolver 2（engine 内）；ParticipantFunction 1、ResultFunction 1（process 内）；ApproverResolver 1（**@Deprecated**，仅 process 老 skeleton）。

## 4 缺失语义（javadoc+实现双证）

- **null 返回 21**：JobFacade.getById/getByJobName（Impl:42）；FormDefinitionService 4 个 get*（FormDefServiceImpl:406）；DictFacade.resolveLabel（SysDictDataServiceImpl:75）；NotifyRoutingService.templateFor（Impl:104）；NotifyTargetResolver.resolveEmail/Phone/ProviderSubject（default null）；FlowStartPort.acceptFlowStart（null=无绑定 no-op 非失败，Impl:49）；LifecycleTaskEntryPort.onTaskCreate（null=不改写）/resolveParticipantsByFunction（null=未配置）；BpmTaskFacade.getTask(:82)/getVariable(:466)/getTaskOwner(:186)/getBusinessKey（**getTaskOwner javadoc 缺 null 态**）；BpmDeployFacade.findProcessDefinitionIdByDeployment(:141)；BpmNodeDefinition.metadata（default null，registry fail-fast）。
- **空集合/Map=缺失（契约钉死）**：UserQueryFacade 9、DeptQueryFacade 2、DictFacade.listByType、BpmRuntimeFacade.getActiveActivityIds（javadoc"实例不存在返空列表"）/queryHistoricActivities/getProcessVariables、BpmTaskFacade.getVariables/getHistoricVariables。
- **布尔/数值判定**：13 boolean（formExists、exists、isValid、isValidCode、canOpen、canHandle、isProcessActive、isProcessInstanceSuspended、required、canCurrentUser×3、ConsensusVotePort.record=false=幂等）+ 4 long（countTodo、countProcessed、ConsensusVotePort.count）+ 1 Long（acceptFlowStart）。
- **哨兵**：ConsensusVotePort.count/total=-1（不可用回退）；getProcessInstanceStatus="NOT_FOUND"（Impl:183）；getTaskOwner="DELEGATED"。
- **异常=缺失/失败（无 null）**：StorageFacade.upload/download/getUrl/delete（getFileOrThrow 抛 NOT_FOUND，Impl:146）；ExtDatasourceQueryPort.executeQuery；FormDataSubmitFacade.submit/validateSubmission；两 ApproverResolver.resolve（明示不可 null）；JobHandler.execute（抛=失败）。
- **结果对象恒非 null**：NotifyFacade.send/attemptDelivery、NotifyChannelAdapter.send（FAILED 不抛）、upload、deployModel、handleResult、resolvePhoneForTenant（UNRESOLVED 对象）。

## 5 难点签名

Optional<void> 不存在（24 void：NotifyFacade.send(cmd)、BpmTaskFacade 12 命令、delete、suspend/activate、execute、各 Port 写入方法、validateSubmission）；Optional<List<T>>/Map 双重语义（33 个现以空集合表"无匹配"，包 Optional 引入二义并破坏既有约定）；原始类型 17 个三态装箱冲突。

## 6 兼容影响

- 实现 25 处：19 Impl 类（各 -api 同名 `*Impl` 于对应 -biz/engine/process）+ 6 配置 bean（BpmLifecyclePortConfiguration、DynamicBranchPortConfiguration、SystemAutoConfiguration:53 方法引用）。
- **外部调用 0 的接口**（零波及）：JobFacade、JobHandler、NotifyChannelAdapter、ApproverResolver。
- 测试夹具模块：notify/storage/form/system/openapi-biz、engine、process、sw-bootstrap（bootstrap 仅 src/test 引 4 接口）。
- 序列化/反射：接口签名不涉 Jackson/反射绑定；分发全经 Spring 注入，无类名字符串选择。
- 依赖红线（pom 实测）：7 个 -api 仅依赖 sw-common；无 -biz 互依、无环。非 -api 直依两处（目标未拆分）：process→basic-iot、agent→basic-knowledge；system-biz→notify-api 为合法反向 SPI。form↔bpm 经 Spring 注入反转，无编译互依。

## 7 待 Owner/Planner 裁决

1. void 24 + 原始类型 17 是否豁免（字面不可 Optional）。
2. 集合/Map 33：豁免 vs 统一 Optional 化并重定义缺失契约（波及 system/form/bpm 调用方）。
3. 哨兵 3 处是否纳入。
4. 抛异常表缺失 5 组的深度：仅"消灭 null"达标 vs 缺失统一 Optional（调用方 try/catch 改造）。
5. SPI 回调接口（返回值由他模块实现）是否属"开放方法"；本盘点按 api 全部接口方法全量纳入。
6. @Deprecated ApproverResolver 是否随退休豁免。

## 8 未确认 / 推测

调用方计数为文件级，未做方法级矩阵（实现期可 IDE 引用精化）；bootstrap src/test 4 接口引用推断为集成夹具；JobHandler/NotifyChannelAdapter 仓外实现不存在为推测（仓内 0 实现）；118 方法逐行清单可按 §2 规则重放，如需落盘明细请 Planner 指定位置。
