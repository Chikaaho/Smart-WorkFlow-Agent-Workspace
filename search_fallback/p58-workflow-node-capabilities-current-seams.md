# P58 流程节点能力现状探索回执

> 委派：Planner → Executor（XL 前置探索，只探索不回程）
> 结论基于仓库代码事实；外部存量未验证项已单列。

## 一、能力矩阵（× 设计/保存/校验/运行/持久化/查询）

| 能力 | 设计 | 保存 | 发布校验 | 运行 | 持久化 | 查询 |
|---|---|---|---|---|---|---|
| 通用选人（固定用户） | 已实现* | 已实现 | 已实现 | 已实现 | 已实现 | 已实现 |
| 通用选人（角色/表达式/适配器） | 未发现 | 仅占位 | 拒绝 | 拒绝 | — | — |
| 审批（单人） | 已实现 | 已实现 | 已实现 | 已实现 | 已实现 | 已实现 |
| 审批（候选多人任一完成） | 未发现 | 未发现 | 未发现 | 拒绝（取首人） | — | — |
| 会签（多实例/三种结算） | 未发现 | 未发现 | 未发现 | 未发现 | 未发现 | 未发现 |
| 分支（CONDITION/EXCLUSIVE_GATEWAY） | 未发现 | 未发现 | 拒绝 | 未发现 | — | — |
| 抄送 | 未发现 | 未发现 | 未发现 | 未发现 | 未发现 | 未发现 |
| 站内信（模板/批量/收件箱） | 已实现 | 已实现 | 已实现 | 已实现 | 已实现 | 已实现 |
| 第三方通知（短信/飞书/钉钉等） | 未发现 | — | — | 未发现 | — | — |

*固定用户选择器为下拉（`EditProcessDefDialog.vue` el-select），非组织树选择器；用户/部门/角色三选一 UI 仅存在于 `NotifyBatchSend.vue`。

## 二、11 问答案

**1. P57 接缝与新增节点最小接入面。**
契约：`sw-bpm-api/.../node/BpmNodeDefinition.java`（type/metadata/validateConfig）+ `BpmNodeMetadata`（含 configFields、capabilities、拓扑）。注册：`BpmNodeRegistryImpl`（fail-fast：类型正则、4 能力必齐、重复/空注册表拒启、排序冻结）。翻译：`NodeTypeTranslator` SPI 由 `GraphToBpmnTranslator`（`BpmNodeRegistry` 构造器）注册，未注册类型发布时确定性失败（NODE_CAPABILITY_MISSING）。校验：`GraphValidator` 全由注册结果驱动（未知类型 → GRAPH_UNKNOWN_NODE_TYPE）。前端：`GET /workflow/defs/node-capabilities`（需 workflow:def:view）→ `BpmNodeCapabilityDTO`（supports 由能力集映射）；`contracts/bpm-node.ts` + `node-capabilities.ts` 严格解析，`EditProcessDefDialog.vue` 单点消费；Mock 同构（`foundation/mock/workflow-node-capabilities.ts`）。**最小接入面：一个实现 `BpmNodeDefinition`+`NodeTypeTranslator` 的 @Component 类，重启自动发现，零改中心枚举/switch/前端目录**（P57_VERIFY 测试节点已证明路径）。

**2. 审批人选择。**
仅 `NodeApproverType.DESIGNATED（用户 ID 数组，v1 取首个）` + `SCRIPT`（桩，抛 2201）。SPI：`NodeApproverResolver.resolve(NodeApproverContext)`，经 `Map<String,NodeApproverResolver>`（qualifier `approverResolverMap`）分发——**后端 Bean 适配器接缝已就绪**，新增类型=新常量+新 @Component。固定用户全链完整（发布校验 `ApprovalUserTaskTranslator.validateConfig` 只认 DESIGNATED 且 value 非空；翻译写 BPMN assignee+扩展属性；create 监听器 `ApprovalTaskListener` 运行期兜底）。候选查询：`GET /workflow/defs/approver-candidates`（UserQueryFacade.searchActiveUsers，50 条，id/username/realName）。角色/表达式/适配器类型常量与实现均未发现。旧路径：`FixedApproverResolver`（@Deprecated，返回发起人）仅服务 skeleton（`ProcessStartService` + `${approver}` + `processes/skeleton_approval.bpmn20.xml`）。

**3. 前端选择器/表达式/脚本风险。**
无独立用户选择器组件（编辑对话框为 el-select 下拉）；`NotifyBatchSend.vue` 有用户搜索+部门树+角色列表三 tab 勾选（`/system/user/page`、`/system/dept/tree`、`/system/role/page`），是现存最完整的选人 UI 雏形但未抽取复用。表达式编辑器：未发现；`src/security/safe-eval.ts` 用 `expr-eval-fork` AST 求值（注释声明禁 eval/new Function），**当前零生产引用**（依赖在 package.json）。CSP 严格 `script-src 'self'`（禁 unsafe-inline/unsafe-eval，`src/security/csp.ts`）。结论：接入"可扩展 JS 选择器"只能走 AST/受限求值器，任何 eval/new Function 与动态脚本注入均与 CSP 冲突；expr-eval-fork 只支持表达式不支持任意语句，是现成安全边界。

**4. 审批任务运行语义。**
单 assignee 单人任务：无 candidateUsers/claim/认领（`BpmTaskFacadeImpl` 只 taskAssignee 查询 + 直接 complete）。越权校验：task.assignee==当前用户（`BpmTodoController.complete/reject`）。任一人完成即结束：**当前不成立**——DESIGNATED 数组只取首个（翻译与监听器均 `get(0)`），其余候选无落库。重复/并发请求：complete 重复提交同一 taskId → getTask null → NOT_FOUND（无业务幂等键，无显式锁；Flowable 内部乐观锁未验证）。审计：审批历史来自 Flowable 历史表（taskId/name/assignee/时间，`TaskDetail.detail`），**无意见、无结果字段**；`sw_bpm_instance` 仅 status(RUNNING/APPROVED/REJECTED)+initiator；"其他候选人失效结果"无可记录模型。

**5. 会签/多实例。**
全仓库（Java/XML/BPMN）未发现 multiInstance/completionCondition 生产代码。Flowable starter 本身支持 multiInstanceLoopCharacteristics 与 exclusive gateway（标准引擎能力，可作落点，属推断）。通过/拒绝计数、提前结束、并发幂等、结算审计字段：全未发现。接缝：新节点类型+翻译器（`UserTask.setLoopCharacteristics`）+完成监听器计数。

**6. 分支现状。**
CONDITION/EXCLUSIVE_GATEWAY 仅出现在测试中（作为"未注册类型被拒"证据）。生产无类型常量、无 gateway 翻译器、无边条件配置模型（GraphElement.edge 仅 id/source/target；`GraphValidator` 边校验只有存在/自环/重复）。发布含此类节点 → GRAPH_UNKNOWN_NODE_TYPE 拒绝（已实现）。前端无分支 UI、无条件编辑器（safe-eval 注释提及"流程条件 M04-F07"但无消费点）。缺口：多出边拓扑（APPROVAL 现为 1→1）、边条件配置、gateway 翻译与校验、前端条件编辑。

**7. 抄送。**
完全未发现（无类型/实体/表/UI/审计）。最小落点现成：`NotifyFacade.send(SendNotifyCommand)`（单用户入参）+ `NotifyMessageServiceImpl.resolveRecipientIds`（用户/部门/角色集合、LinkedHashSet 去重、500 上限、租户+有效校验，已实现批量原子落库）+ `sw_notify_message` 表 + 收件箱 API（`NotifyController`）。抄送=新节点类型+运行翻译（监听器/服务任务）+批量调 NotifyFacade。

**8. 通知能力。**
触发事件仅 `BpmNotifyTrigger.TODO_CREATED`（`ProcessStartService` 启动后）与 `PROCESS_APPROVED`（`BpmTodoController.complete` 流程结束时）；**reject 路径无任何事件发布、枚举无 REJECTED**——即"审批不通过无通知"的直接根因。模板：`NotifyTemplate`（code/name/title/content/enabled）+ `TemplateRenderService`（${var} 纯文本渲染，防注入，P36/M05-F02-01）。发送记录：`sw_notify_message` + `NotifyController`（列表/已读/删除，越权校验）。站内信：即该表+前端 notify 模块，链路完整。第三方通道：**未发现 channel 概念**——`SendNotifyCommand`/`NotifyMessage`/`NotifyTemplate`/批量请求均无渠道字段，无短信/飞书/钉钉/企业微信/公众号/小程序任何代码。统一接缝缺口：业务门面 NotifyFacade 已有，缺渠道维度（枚举/表列/SPI 均为空白）。

**9. 影响模块与双权威风险。**
后端：sw-bpm-api（契约/DTO/SPI/事件）、sw-bpm-engine（翻译/监听/facade）、sw-bpm-process（校验/控制器/服务）、sw-basic-notify-api/biz、sw-biz-system-api（UserQueryFacade 用户/部门/角色查询，选人与抄送候选的共同依赖）。前端：modules/workflow、modules/notify、contracts/bpm-node.ts、foundation/mock（handlers+workflow-node-capabilities 需同契约同步）。DB：sw_bpm_process_def.graph_json 结构受节点配置扩展影响；潜在新表（抄送快照/会签结算/审批意见）；V8/V14 无冲突；Flowable ACT_* 引擎自管。**双权威风险点**：① 节点权威已统一于 BpmNodeRegistry，但"发起路径"仍双轨——ProcessStartService 走 skeleton（绑定→key 启动），BpmProcessDefController.publish 走图翻译，P58 打通发起绑定到图发布流程时须处理并存兼容；② 前端 REQUIRED_WORKFLOW_NODE_TYPES 仅为兼容常量非目录，无平行权威；③ 通知以 NotifyFacade 为唯一入口，无双权威。无循环依赖发现（sw-bpm-process 依赖 notify-api 单向）。

**10. 存量兼容风险。**
已发现仓库内实际存量：`processes/skeleton_approval.bpmn20.xml`（classpath，Flowable starter 默认扫描 processes 目录——自动部署为推断）仍被 ProcessStartService 表单绑定路径使用；`sw_bpm_instance`/`sw_bpm_process_def` 无 seed SQL（V8/V14 只建表）；`sw_notify_message` 已承载既有站内信功能。**无法从仓库证明的外部存量（真实租户已发布 BPMN 部署、历史 graph_json 草稿、已发通知记录、流程实例）——一律标未验证，不得推断不存在**；P57 验收边界同样声明"验证 fixture 零生产命中、外部存量未验证"。

**11. 建议阶段依赖顺序（仅供排序参考，范围取舍归 Planner）。**
① 通用选人契约（类型+resolver+校验+前端选择器）→ ② 单人审批候选（候选多人任一完成+实际处理人审计，依赖①）→ ③ 会签多实例与三种结算（依赖①②）→ ④ 分支节点全链（依赖①的表达式基础；safe-eval/expr-eval-fork 为现成受限求值器）→ ⑤ 抄送节点（依赖①+notify）→ ⑥ 通知补齐（REJECTED 事件可独立先行；渠道 SPI+站内信扩展依赖⑤）。
每阶段浏览器证据入口：设计器保存/发布请求响应（含校验错误体）、待办中心任务出现与 complete/reject 后跳转、Flowable 运行轨迹（任务/历史查询接口返回 assignee 与实例状态）、sw_bpm_instance / sw_notify_message 持久化行、删除流程定义后零残留（节点能力清单与注册表不复现）。

## 三、分栏

**已验证（文件+位置，见上文各条）**：契约/注册/翻译/校验/前端消费链；审批人仅 DESIGNATED；单 assignee 语义；无 multiInstance、无 gateway 生产实现、无抄送、无渠道 SPI；reject 无通知事件；CSP 禁 eval；safe-eval 零引用；NotifyBatchSend 三选一 UI；skeleton BPMN 与 ProcessStartService 双路径。

**推断**：Flowable starter 自动部署 classpath/processes 与实例内置 multiInstance/gateway 引擎能力（引擎标准行为，未读引擎源码）；重复 complete 的 Flowable 内部乐观锁行为。

**未验证（外部）**：真实租户存量流程实例、已发布 BPMN 部署、历史 graph_json、已发通知记录；生产环境 CSP/权限实况。

**冲突**：`NotifyBizType.WF_APPROVED` 注释声称"通过/驳回后通知发起人"，与实现（仅 PROCESS_APPROVED 通过通知）不一致，属注释超前于实现。

**是否继续探索**：否，11 问均有事实答案，可支撑 Planner 锁定配置模型与阶段顺序。