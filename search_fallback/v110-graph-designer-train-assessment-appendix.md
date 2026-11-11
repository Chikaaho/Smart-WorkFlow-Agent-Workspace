# v110 评估附录：细节证据与过程记录

> 主回执：`search_fallback/v110-graph-designer-train-assessment.md`。本附录存放完整证据、对照表与过程记录。
> 日期：2026-11-12｜角色：执行｜只读评估，未修改任何代码/配置/迁移/演示环境。
> 行号对应当前检出：Web `main@a85aa8e2`、Server `main@aa7c86e5`（均为 1.0.0 发布源）。

## 1. Q1 设计器现状（Web）

### 1.1 GraphDesigner.vue 结构（单文件 748 行）

| 部分 | 位置 |
|---|---|
| 头部工具栏（返回列表/保存草稿/发布） | `src/modules/agent/views/GraphDesigner.vue:481-497` |
| 左侧「节点」色板：按钮点击添加（非拖拽） | 同文件 :510-521；`addNode` :173-184 |
| 画布：空 div 由 `mountFlowGraph` 挂载 | 同文件 :524-526、:306 |
| 右侧属性面板（280px） | 同文件 :529-562 |
| 底部执行测试面板（输入/运行/取消/跳详情） | 同文件 :566-615、轮询 :386-445 |

- 节点类型 9 种：START/END/LLM/TOOL/CONDITION/LOOP/FORK/JOIN/KNOWLEDGE（`src/modules/agent/utils/graphAdapter.ts:55-64`）。
- **节点卡片全部是 vue-flow default 节点 + CSS 着色，无自定义节点组件**：`src/adapters/flow-graph/index.ts:120-137` 强制 `type:'default'`（源码注释：未注册类型回退渲染会报错，业务类型经 `vf-node-<type>` class 表达）；`src/adapters/flow-graph/node-theme.css:8-58` 仅边框色/底色/字号。0.3.7 W-a 即止于此。
- **新增节点落点无布局逻辑**：色板点击 `addNode` 用固定默认坐标，连点即重叠（截图 `.runtime-v110/graph-designer-1440x900.png` 中 LLM 调用与工具调用两节点重叠）。
- 属性面板按注册表动态挂载：`src/modules/agent/views/panels/node-panel-registry.ts:69-79`；START/END → `EmptyPanel.vue:7-17`（纯空态，无可编辑项）。
- LLM 面板内容：供应商/模型配置/挂载工具/系统 Prompt/用户 Prompt 模板（`{{input}}` 占位示例，`LlmPanel.vue:33-35`）/输入输出变量名（默认 `input`，`LlmPanel.vue:176-189`）。
- 执行/调试组件仅 1 个：`src/modules/agent/components/execution/NodeTrajectory.vue`（538 行，按 nodeSeq 展示轨迹+变量快照展开），被 `ExecutionDetail.vue:48,375` 与 `DebugSessionView.vue:38,563` 复用。

### 1.2 流程设计器（BPM）可复用资产

组成：`src/modules/workflow/views/ProcessDesigner.vue`（7717 行，编辑态）+ `src/components/ProcessGraphView.vue`（604 行，只读查看）+ `src/adapters/process-graph/index.ts`（1593 行）。**整套为自研 SVG 渲染内核，与 Vue Flow 无关**（process-graph/index.ts 零 vue-flow 引用；ProcessGraphView.vue:214-326 手写 `<svg><rect><path>`）。

| 能力 | 实现位置 | 状态 |
|---|---|---|
| 节点卡片（图标/类型配色/可选中） | ProcessGraphView.vue:214-326 SVG 自绘 | 有，视觉参照 |
| 节点库拖入（DragEvent） | ProcessDesigner.vue:1705-1721 | 有 |
| 连线/接点拖拽 | ProcessDesigner.vue:1444-1572；adapter :773 | 有 |
| 撤销（无重做） | adapter index.ts:1528-1533（MAX_HISTORY :1233） | 有 |
| 自动布局 layoutTopDown | adapter index.ts:1528-1547 | 有 |
| fitViewport/滚轮缩放/底部缩放栏 | ProcessGraphView.vue:67-111 | 有 |
| 右侧属性页签面板（basic/fields/advanced） | ProcessDesigner.vue:543-544、3831-3850 | 有 |
| 小地图 | — | 无 |

适配层消费关系：`flow-graph` 仅 3 处消费（GraphDesigner.vue:33、graphAdapter.ts:28、node-panel-registry.ts:20）；`process-graph` 被 ProcessGraphView.vue:18、ProcessDesigner.vue:95,107 消费。**两者不共用适配层**。只读查看组件被 InstanceFlowPanel/ProcessDefList/ProcessInstanceList 复用；编辑态画布为 ProcessDesigner 私有（:3574 自有 svg；:5766 版本预览嵌 ProcessGraphView）。

结论：G1 走 vue-flow 路线时可复用的是**交互模式与视觉规范**（卡片样式、节点库分组、属性页签、布局/缩放行为），不是直接代码复用；若迁到 process-graph 自研内核可直接复用画布能力，但 agent 图数据结构、面板生态要迁移，成本更高。

### 1.3 I48 适配层契约

`knowledge/known-issues.md:636-644`（I48，CONFIRMED）：「`flow-graph` adapter 契约无边点击事件、无命令式数据更新通道……若未来节点自定义渲染/直接点边编辑需求增多，需回规划层评估扩展 adapter 导出面」；影响条目注明 bpm-plugin-architecture 轮明确不扩展（D80 非目标）。当前事件面仅 `onNodeClick/onEdgeCreate/onGraphChange`（`src/adapters/flow-graph/index.ts:40-44`）；GraphDesigner 每次数据变更走 destroy+重挂载（`remountCanvas` GraphDesigner.vue:160-168）。

对 G1 的影响：自定义节点卡片渲染、边点击编辑（条件分支关键词）、运行时节点状态高亮（命令式更新）三者均超出当前契约 → **G1 的前置决策点是扩展 flow-graph adapter 导出面（或 GraphDesigner 绕过 adapter 直用 vue-flow）**，属规划层裁决（I48 与 D80 的既有裁定需要修订）。

### 1.4 Q1.3 Dify 对照表

Dify 行为依据：单节点运行 `Run this step` 与整图 `Test Run`（[Schedule Trigger 文档](https://docs.dify.ai/en/cloud/use-dify/nodes/trigger/schedule-trigger)、[issue #12257](https://github.com/langgenius/dify/issues/12257)、[issue #4192](https://github.com/langgenius/dify/issues/4192)——运行面板显示状态/耗时/入参出参）；变量引用 value selector `[node_id, "text"]`（[discussion #25238](https://github.com/langgenius/dify/discussions/25238)）；Human Input 节点暂停/表单/按钮决策/超时分支（[Human Input 文档](https://docs.dify.ai/en/cloud/use-dify/nodes/human-input)，默认超时 3 天，首个响应即关闭，按钮 action 走 `__action_id/__action_value` 下游分支）。节点卡片摘要与"+"插入按钮为 Dify 产品公开行为（教程/issue 截图可见），官方文档未找到逐条描述页——**标未确认**。

| # | Dify 做法 | 现有设计器 | 差距 |
|---|---|---|---|
| 1 | 节点卡片：类型图标+标题+关键配置摘要 | default 节点仅类型文字 label，无图标/摘要 | 缺：需自定义节点组件（I48 决策点） |
| 2 | 节点间「+」插入下一节点，自动落位连线 | 无；色板按钮点击添加、固定落点、互相重叠 | 缺：插入交互+落位/整理布局（可参照 process-graph layoutTopDown） |
| 3 | 变量选择器引用上游输出（`{{#node.field#}}` 类） | 无；单全局累积变量模型（inputVar/outputVar 文本 + Prompt `{{var}}` 占位） | 缺：结构性——需开始/结束节点入参出参声明 + 引用语法 + 选择器 UI |
| 4 | 单节点运行（Run this step） | 无；调试会话有断点暂停（近似） | 部分：`DebugSessionView` 断点续跑，但为同步内存态 |
| 5 | 整图试运行 | 有：底部执行测试面板（图须已发布） | 已有 |
| 6 | 运行时节点级状态/耗时/入参出参展示 | 无节点级高亮；节点轨迹仅执行后详情页可查，且 lifecycle 异步执行前端未接节点数据（§2.2） | 缺：前端面板 + 后端逐节点进度事件（0.2.3 锁定限制「无逐节点进度事件」，`knowledge/features/0.2.3-agent-execution-lifecycle.md` §6） |

### 1.5 Q1.5 图定义 JSON 存储

- 后端 `sw_agent_graph_def.graph_json` 纯存储不解释节点/边含义（Server `AgentGraphDefServiceImpl.java:33` 注释；`GraphElement.java:27-48`）。
- 前端契约：`src/contracts/agent.ts:47-72` `GraphElement {id,kind,type,source,target,config?,style?}`，`config/style` 为不透明 Map 原样透传；`ProcessGraph {graphKey,name,version,elements,canvas}`。
- 坐标存 `style.x/y`（前端自裁定，graphAdapter.ts:6-9）；条件边关键词 `config.keyword` ↔ `edge.label`（graphAdapter.ts:21-22,153-167）。
- **START/END 无入参/出参声明字段**（面板为 EmptyPanel）；执行契约仅单 `input` 文本（`contracts/agent.ts:110-113`；Server `AgentGraphExecuteReqDTO.java:13-17`）。
- 迁移结论：**改设计器/加配置键不需要后端迁移**（graph_json 加键即落库，GraphDesigner.vue:230 注释「graph_json 零迁移干净落库」）；旧图兼容靠前端缺省处理（旧图无参数声明 → 视为无参图）。变量模型若改统一引用语法，属 graph_json 内容演进，需前端转换/兼容策略。

### 1.6 Q1.6 G1 建议拆分

必须（建议 1.1.0）：
1. 前置决策：扩展 flow-graph adapter 导出面（边点击/命令式更新/自定义节点渲染）或 GraphDesigner 直用 vue-flow——规划层裁决；
2. 自定义节点卡片组件（图标/标题/配置摘要/状态色）；
3. 节点库拖入 +「+」插入 + 自动落位/整理布局；
4. 变量引用选择器（依赖开始/结束节点参数声明，graph_json config 扩展，无 DB 迁移）；
5. 右侧配置面板统一流程设计器页签风格。

可后放：
6. 单节点运行（依赖调试会话改造或后端逐节点事件）；
7. 运行时节点级状态高亮+入参出参查看（依赖后端事件改造，0.2.3 已锁定无逐节点进度事件）；
8. 小地图、撤销重做补全。

截图（本地 `.runtime-v110/`，不入 Git）：
- `graph-designer-1440x900.png`：现有 Graph 设计器全貌（新建「演示流程图」，START→END，色板点击加的 LLM/工具节点重叠在画布中上部，右侧空态面板，底部执行测试栏）；
- `graph-designer-llm-panel.png`：LLM 节点属性面板（供应商/模型/挂载工具/系统 Prompt/用户 Prompt 模板 `{{input}}`/输入输出变量名）；
- `process-designer-1440x900.png`：流程设计器全貌（节点库三组、START/END 卡片带图标与配色、撤销/整理布局、右侧五页签、底部缩放栏）。

## 2. Q2 P67 Graph 执行器（Server）

路径缩写：`agent/` = `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent`；`bpm/` = `sw-biz/sw-bpm`。

1. **P57 接入点**：注册表 `bpm/api/node/BpmNodeRegistry.java:20`（definitions/find/validateConfig），实现 `bpm/engine/registry/BpmNodeRegistryImpl.java:32,45-68`（构造期校验类型唯一/必含 TRANSLATE，重复 fail-fast）；**Spring 自动发现所有 `NodeTypeTranslator` Bean 即注册**（`bpm/engine/config/BpmEngineAutoConfiguration.java:111-115`）。分发：`NodeTypeTranslator.java:26`（`type()` 为 key）→ `GraphToBpmnTranslator.java:64,105-122`（Map 分发禁 switch）。服务节点参照：抽象基类 `ServiceTaskNodeTranslator.java:19-33,149`（校验+BPMN ServiceTask+`${delegateBean}` FieldExtension）；实例 `CopyNodeTranslator.java:9-16`（type=COPY→`copyNodeDelegate`）、`TxnActionNodeTranslator.java:30`；运行期委托 `bpm/engine/delegate/CopyNodeDelegate.java`、`TxnActionNodeDelegate.java`。
   - 改动量对比：**作为服务节点的一种执行器** = 1 个 `ServiceTaskNodeTranslator` 子类 + 1 个 delegate Bean + GraphValidator 校验项（`bpm/process/validator/GraphValidator.java`），前端节点面板加执行器选择，改动最小；**作为新节点类型** = 上述之外还要节点库/前端面板/文档，语义上与「服务节点」重叠。推荐前者。
2. **表单侧**：P65 表单 JS 事件在前端仓：`src/modules/form/utils/form-events.ts:15-18`（onLoad/beforeSubmit/afterSubmit）、`script-interpreter.ts:1-15`（CSP 安全 JS 子集解释器，**仅支持同步函数**）、宿主函数注册为平铺 Map：`script-hosts.ts:99-120`（组织快照）与 `field-scripts.ts:84-115,390`（字段操作）。加 `api.graph.run(...)` 在该 Map 扩展；但异步执行不适配同步解释器 → 更合适的是「提交前/按钮触发的服务端动作」形态。服务端依赖方向：form→agent 不允许（`sw-biz-form-biz/pom.xml:35-55` 仅依赖 form-api/sw-common/sw-security/system-api/storage-api；openapi 也无 agent）；跨模块先例为 **ObjectProvider + Spring 事件**（`agent/../service/impl/AgentToolCallbackFactory.java:69-127` 经 `sw_agent_tool_internal_config` 白名单反射调 `execute(String)`；反向 `bpm/process/tool/AgentProcessStartTool.java:33-46`）。可选通道：新增含 `execute(String)` 的 Bean 进白名单，或 form 侧 `ObjectProvider<AgentGraphExecutionLifecycleService>`。
3. **入参/出参声明**：现在没有。图定义实体 `agent/entity/AgentGraphDef.java:26-44`（graphKey/defVersion/status/graphJson/executionTimeoutSeconds）无 params；请求体 `agent/dto/AgentGraphExecuteReqDTO.java:13-17` 仅 `String input`（写入默认变量 `input`，`AgentGraphInterpreter.java:185`）；输出 = END 节点 inputVar 值文本（`AgentGraphInterpreter.java:330-332` → `AgentGraphExecuteRespDTO.output` → `resultText`）。**G2 依赖 G1 的开始/结束节点参数声明**（graph_json config 扩展），G1→G2 存在先后依赖。
4. **运行记录关联**：`sw-bootstrap/src/main/resources/db/migration/mysql/V0.2.7__agent_execution_lifecycle.sql:1-25` request 表字段 graph_def_id/graph_def_version/idempotency_key/request_fingerprint/status/input/result_execution_id/error_category/error_message/latency_ms/时间戳——**无 processInstanceId/formRecordId/traceId/source 业务关联列**；event 表（:27-43）仅 execution_id/sequence_no/event_type/node_id/payload。受理 API 仅 `Idempotency-Key` 头 + body.input（`AgentGraphExecutionLifecycleController.java:30-37`）。唯一关联先例：IoT 桥回写 `IotProcessTrigger.agent_execution_id`（`sw-basic-iot/.../agentbridge/AgentGraphTriggerListener.java:26-29`）。G2 需加关联列（V1.1.0 迁移）或沿用 IoT 的回写模式。

## 3. Q3 人工节点与子图节点

1. **恢复机制现状**：`AgentGraphExecutionLifecycleServiceImpl.recover():92-112`（@PostConstruct）：RUNNING/CANCEL_REQUESTED → INTERRUPTED(reason=SERVICE_RESTART)，仅重新派发 QUEUED（:102-111）；派发 `dispatch:213-225`（ThreadPoolExecutor 满则 FAILED/CAPACITY_REJECTED）；取消 `cancel():197-211`（QUEUED 直接 CANCELLED；RUNNING 置 CANCEL_REQUESTED + `runningThreads` interrupt，:206-207，靠状态复查 :244-258 收敛）。**无 WAITING/PAUSED 状态、无外部恢复执行点**（解释器一次性跑完，变量表为内存态，仅 `NodeExecutionTrace.variableSnapshot` 落库）。
   - 人工节点需改：状态机常量（:46-52）与 mapper transition（`mapper/AgentGraphExecutionRequestMapper`）、事件类型（`appendEvent:292`）、新增「外部提交→重新 dispatch」端点、解释器可持久化挂起变量/活跃点。断点先例：`AgentGraphDebugServiceImpl.java:272-307`（断点暂停/续跑、会话持久化）但为同步内存态，非跨请求恢复。
   - 与 BPM 待办关系：**零关联**（bpm 模块无 agent 引用，仅反向工具 `bpm/process/tool/AgentProcessStartTool/AgentProcessQueryTool`）；BPM 实例挂起 API `bpm/api/facade/BpmTaskFacade.java:114-134`（suspendProcessInstance，实现 `BpmTaskFacadeImpl.java:302`）可作语义参照。人工待办放 Graph 运行页处理成本远低于打通 BPM 待办列表；Dify Human Input 也是独立表单送达机制（文档确认），不进审批中心。
2. **子图节点**：节点分派为 `AgentGraphInterpreter.java:339-376` 的 `switch(current.getType())`（常量 :99-123；default 抛 TOPOLOGY_INVALID），新增类型须改该 switch + 执行校验 switch（`AgentGraphExecutionServiceImpl.java:472-561`）。**发布快照机制已有**：`agent/entity/AgentGraphSnapshot.java`（表 sw_agent_graph_snapshot）；`AgentGraphSnapshotServiceImpl.createSnapshot:35-44`（发布固化 graph_json）、`requireSnapshot:49-67`、`loadPublishedGraph:70-80`；执行绑定 defVersion（`AgentGraphExecutionServiceImpl.java:155-156`，request 表亦存）——子图节点可直接引用「已发布图 defId+defVersion」复用快照读取。**取消传递/嵌套深度/循环引用均无**：request 表无 parent_execution_id；防环仅运行期步数预算 maxSteps=2×节点数+Σloop×节点数（:179-190）与 LOOP 迭代计数（`AgentGraphInterpreter.java:356-363`）；图级校验仅 START 唯一+END 可达 BFS（:486-489）。子图需新增：parent_execution_id 列（迁移）、提交/发布时引用环检测、cancel() 沿父子链传播。
3. **行为风险**：流式——子图事件 sequence 需与父执行事件命名空间隔离（现 event 表无父子概念）；超时——父 executionTimeoutSeconds 与子图各自超时叠加语义需定义；取消——现仅线程 interrupt + 状态复查，跨执行传播要显式实现；重启恢复——INTERRUPTED/SERVICE_RESTART 对父子链的判定（父 INTERRUPTED 时子执行如何收敛）需定义。

## 4. Q4 小尾巴

1. **任务详情底部操作栏遮挡**：操作卡 `src/modules/workflow/views/TaskDetail.vue:1274`（`el-card.detail-card--actions`，按钮 bar :1401）；定位 `position: sticky; bottom: 0; z-index: 5`（:1925-1930，0.1.7 #18 设计）；滚动容器 `.task-detail` 为 `position: fixed; overflow-y: auto; padding: 12px 24px 24px`（:1794-1804）。遮挡原因：吸底悬浮于滚动视口，容器底部 padding 仅 24px 未预留操作卡高度（意见 textarea 3 行+按钮 ≈150px+），卡片不透明。截图参照 `product/v1.0.0-release/receipts/evidence/u3_task_detail_table.png`（明细表末行被「更多/同意/驳回」操作条盖住）。修法：给 `.task-detail` 加动态 bottom padding（≥操作卡实测高度）或操作卡改文档流内末尾元素。
2. **发起人筛选**：`src/modules/workflow/views/InstanceMonitor.vue:225-232` 用 `el-input-number :min="1"` → 不能输 0（IoT 发起人 initiatorId=0 检索不到）、无姓名输入；查询参数直传（`filters()` :42-53 → GET `/workflow/monitor/instances`，`src/modules/workflow/api/i4.ts:125-135`；后端 `BpmMonitorController.java:54` 收 `Long initiatorId`）。可复用 `src/components/UserRemoteSelect.vue`（弹窗搜索选人返回 ID，`TaskHandover.vue:21` 已用），但**无「系统（IoT）」选项**；该显示映射仅在后端 `InitiatorDisplay.java:16`（initiatorId=0→「系统（IoT）」）。改人员选择器需为 IoT 发起人补一个固定选项。
3. **实例监控干预页三处显示**（同 InstanceMonitor.vue）：①时间原样输出（列表 `instance.createTime` :288、干预历史 `intervenedAt` :327）→ 可复用 `ProcessInstanceList.vue:98-114` `formatDrawerTime`（1.0.0 已统一格式）；②状态英文（`<el-tag>{{ instance.status }}</el-tag>` :276，历史 beforeState/afterState :324-325）→ 可复用 `src/foundation/i18n/enum-label.ts` `ENUM_LABEL_KEYS.WORKFLOW_INSTANCE`（:81-90）+ `enumLabel()`（:133）或页面级 `ProcessInstanceList.vue:46-88` `STATUS_MAP`；③流程定义显示内部 key（`{{ instance.processDefKey }}` :272）→ 前端 `MonitorInstance`（i4.ts:98-110）与后端 `InstanceMonitorView`（`BpmMonitorService.java:35-37`）均无名称字段，需后端补 defName（或前端用 pageProcessDefs 关联映射，页面当前未用）。
4. **`JavaSubprocessSandboxTest.testFileWriteBlockedBySecurityManager` 偶发空指针**：测试 `sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/script/JavaSubprocessSandboxTest.java:206-221`（同步调 `executor.run`，timeoutMs=20000，断言 `result.getOutputJson().contains("blocked")` :220）；被测 `sw-basic-iot/src/main/java/com/sw/ck/iot/script/JavaSubprocessExecutor.java`：RPC 读 stdout 放后台 daemon 线程（:116-124，收 RESULT 行写 `outcome[0]` :199），主线程 `waitFor(timeoutMs)` :125-126，`exitValue()==0` 后**直接 `ScriptRunResult.success(outcome[0], ...)` :138**——RPC 线程尚未读到 RESULT 行时 `outcome[0]` 为 null → SUCCESS+null output，测试 :220 NPE。**根因在被测代码（竞态），非测试等待方式**；与 `todo/iot-subprocess-output-race.md` 登记一致。修法：`exitValue()==0` 后对 `rpcThread` 有界 join（1–2s）再读 `outcome[0]`；join 后仍 null 返回明确 FAILED（「子进程未返回输出」），不得 SUCCESS+null。

## 5. Q5 版本与等级

- **Server**：`pom.xml:48` `<revision>1.0.0-SNAPSHOT</revision>`（34 个 POM 唯一来源，Flatten 收敛）→ 改 1.1.0-SNAPSHOT；CI 硬编码断言 `.github/workflows/build-release.yml:72-73`（develop effective version 必须 == 1.0.0-SNAPSHOT）→ 同步改；:75 剥 `-SNAPSHOT` 得正式版（**无 x.0.0/0.x 格式限制**）；`build.version` 断言动态比对（:120-123 取 JAR 内 production-build.properties），`scripts/check-prod-artifact.sh:113-129`、`scripts/check-version-identity.sh:14-21,85` 均动态，无需改。
- **Web**：`package.json:4` `"version": "1.0.0"` → 1.1.0；CI `build-release.yml:35` 动态 `require('./package.json').version`，无断言无正则。
- **工作区**：根 `version.json`（version/targetVersion=1.0.0，:4/:10/:24-26）发布时同步。
- **迁移**：Flyway `{vendor}` 占位符按 JDBC URL 选方言目录（`sw-bootstrap/src/main/resources/application.yml:73-82`，10 个 location）；方言目录 9 个（dm/h2/kingbase/mariadb/mysql/opengauss/oracle/postgresql/sqlserver），每目录 11 个 V 脚本，最新 `V1.0.0__audit_log_and_must_change_password.sql`；sqlserver 用合并终态基线（V0.2.9/V0.4.0 merged）。G2（关联列）+G3（parent_execution_id/WAITING 状态/事件枚举扩展）→ 1 份 `V1.1.0__*.sql` 复制 9 目录 + 同步 `pg-repeatable-checksums.properties` 门禁（`knowledge/features/multi-database-compat.md:20`）。CI 实跑 H2+PostgreSQL（build-release.yml services）；六库冒烟（MySQL 5.7/8.0、MariaDB、Oracle、openGauss、SQL Server）为脚本/人工验证（Server README.md:79,87）。
- **XL 判定**：G1=L（Web 设计器重做）、G2=L（跨仓 BPM/表单/Agent 三处接入+迁移）、G3=M（执行核心状态机+迁移）、G4=S（两仓小修）。合计跨仓、含数据模型迁移、持续演进方向 → **XL 成立**。若 Owner 要收窄：G2 可独立成后续版本（P67 待定事项 3/4/5 语义未定），G1+G3+G4 亦可支撑 1.1.0；G4 建议随版本顺带清掉（`JavaSubprocessSandboxTest` 偶发已影响 main CI 首跑）。

## 6. 需要 Owner 决定的事项（附推荐）

| # | 事项 | 推荐 | 备选 |
|---|---|---|---|
| 1 | G1 技术路线 | 继续 vue-flow，扩展 flow-graph adapter 导出面（修订 D80 裁定）或 GraphDesigner 直用 vue-flow；流程设计器作交互/视觉规范参照 | 迁到自研 process-graph SVG 内核（画布能力直接复用，但 agent 图数据结构与面板生态要迁） |
| 2 | G2 流程侧接入方式 | 服务节点的一种执行器（ServiceTaskNodeTranslator 子类） | 新节点类型（语义重叠、改动更大） |
| 3 | G2 同步/异步与等待策略（P67 事项 3） | 同步等待+超时上限+异常分支，受理复用 lifecycle | 异步回调（需流程侧事件支持，成本高） |
| 4 | G2/G3 绑定版本（P67 事项 4） | 固定 defVersion（快照机制已支持） | 跟随最新发布版（需补查询语义） |
| 5 | 运行身份/权限（P67 事项 5） | 系统身份运行+租户隔离沿既有体系 | 发起人/处理人身份（数据范围语义需另定） |
| 6 | 人工节点待办去向 | 只在 Graph 运行页/执行详情处理，不进 BPM 待办列表 | 打通 BPM 待办（成本高，当前零关联） |
| 7 | 版本号与范围 | 1.1.0 = G1+G2+G3+G4（XL） | 收窄：G2 拆出（P67 语义待定项多） |
| 8 | 表单侧 api.graph.run 形态 | 服务端动作（提交前/按钮触发），不做成同步 JS 函数 | 前端同步函数（解释器仅支持同步，长任务不适配） |

## 7. 未确认事项

1. lifecycle 异步执行的**节点轨迹是否落 `sw_agent_graph_execution_node`**：前端 lifecycle 详情确定未接节点数据（ExecutionDetail.vue:179-181 命中即 return、nodeDetails: []），后端是否写该表未核实（0.2.3 文档 §6 说「节点轨迹在执行后可回查」，未指明 lifecycle 路径）。
2. Dify 节点卡片摘要与「+」插入按钮的官方文档页未找到（对照表 #1/#2 按产品公开行为与教程描述写，标未确认）。
3. 本地 H2 dev 实例无流程/表单种子数据，截图所用「演示申请表单/演示审批流程/演示流程图」为本机自建（仅存于已停的内存实例，不残留）。

## 8. 过程记录（审计事实）

1. 首次用发布 jar（`bootstrap.jar`，prod 构建）加 `--spring.profiles.active=dev` 启动：发布 jar 不含 `application-dev.yml` 与 H2 驱动（POM 明确「生产 Boot Jar 均不含 H2」），按基础配置连到本机 PostgreSQL `smart_workflow` 库，Flyway validate 失败中止（校验先于迁移，**未写入任何变更**，用户库零改动）；随后改用源码 dev-profile 构建（`mvn -Pdev -pl sw-bootstrap -am -DskipTests package` → `bootstrap-dev.jar`，H2 内存库，零数据库残留）。
2. 前端首次经 `pnpm dev -- --port 5275` 启动，`--` 被 pnpm 当位置参数透传，vite 未收到 `--port` 落在 5173（用户保护端口）；即按精确 PID 44792 停止（wmic/PowerShell 核实 CommandLine 后 taskkill），改用 `pnpm exec vite --port 5275 --strictPort` 直启成功。
3. 隔离实例所需本地一次性凭据（`SW_CIPHER_KEY` 等 + 登录 RSA 私钥）由 openssl 现生成于 `.runtime-v110/`（不入 Git）；dev 种子的 SSO 密文要求 `SW_SSO_CIPHER_KEY` 保持 dev 默认值，随机值会导致 ssoAuthService 启动失败（已按默认值处理）。
4. 退出清理：后端 PID 35332、前端 PID 12924 经 PowerShell 核实 CommandLine 后按精确 PID 终止，netstat 回读两端口无监听；浏览器标签已关闭。日志、密钥、三张截图留存 `.runtime-v110/`（本机，不入 Git）。
5. 代码事实经 4 个只读探索子代理扫描 + 本会话对 12 处关键结论逐条抽查（flow-graph default 节点、800ms 轮询仅 MODEL_DELTA、ExecutionDetail lifecycle 空轨迹、TaskDetail sticky、InstanceMonitor el-input-number、JavaSubprocessExecutor 竞态、pom revision、CI 断言、node-panel-registry、agent.ts 契约、EmptyPanel、known-issues I48 原文），全部坐实。
