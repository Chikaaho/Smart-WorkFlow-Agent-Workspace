# 当前状态

> 最后更新：2026-07-30

## 进行中功能

**agent-model-orchestration (M07-F01/F02 部分)：规划中，Step1 PASSED**
- 2026-08-04：I13 产品设计决策已定（D47/D48/D49）——Step1 先做后端编排链路，工具沙箱支持内部方法+外部HTTP两类，RAG 推迟不阻塞
- 已完成 search_task 调研（storage-multi-provider 无加密先例，真实先例是 BPM 外部数据源 AesGcmCipher，见 search_fallback/m07-step1-model-management-precedent.md）
- 补充决策 D50/D51/D52（连通性测试设计/权限码三段拆分/protocolType 不建 enum）
- 2026-08-04：precedent 回执二次探索补充修正（PG 大文本列用 TEXT 非 CLOB；发现 BPM ExternalDatasourceManager.testConnection() 的 JDBC 探活先例，无调用方，不影响本 Step HTTP 探测设计）——已同步修正方案 §9.8 PG 建表脚本（`api_key_cipher` 改 TEXT）+ §14 验收标准 13
- **2026-08-05：Step 1 执行+测试回执已核验，PASSED**——`product/agent-model-orchestration/receipts/step-1-{execution,test}.md`，方案 §14 全部 13 项验收标准满足，15 个新增单测（Service 11+Controller 4）全绿，全量 480 测试 0 失败。方案文件已从 `ready/` 移至 `product/agent-model-orchestration/passed/step-1-backend-model-management.md`。判定见 D53（pom 依赖偏差裁定为必要基础设施补齐，非违规）
- **2026-08-09：Step 2 前置调研回执已核验通过**（`search_fallback/m07-step2-orchestration-engine-precedent.md`，D54）——LangGraph4j 1.5.14 图构造/编译/执行 API 全部 javap 签名确认（StateGraph/CompiledGraph/AgentState/Channels）；Spring AI 1.0.4 支持运行时 baseUrl+apiKey 编程式构造 ChatModel（OpenAiApi.builder()/OllamaApi.builder()）；工具调用接口全套存在（@Tool/ToolCallback/MethodToolCallback），仓库零引用；白名单机制三先例（SwJobBean handlerMap/SqlExecutor.validateSql/StorageProviderRegistry）；`sw_agent_` 仅表前缀预留无字段规划，归属 Step2 或 M07-F04 待规划层裁定；图定义仅支持纯代码构造，无 JSON/YAML 反序列化入口→图 CRUD+持久化无库支持，需自建或推迟（与 D47 节奏一致）
- **2026-08-09：Step 2 执行方案已起草**，写入 `product/agent-model-orchestration/ready/step-2-orchestration-engine.md`（17 项结构，推荐模型 deepseek-v4-pro）。范围裁定（详见方案 §5）：①图保持纯代码硬编码，不做图定义 CRUD/持久化（无库支持）；②`sw_agent_` 会话/消息/工具调用表**本 Step 不建**，留给 M07-F04 真正设计多轮交互时再定；③工具沙箱（内部+外部白名单）**推迟到 Step 3**，本 Step 只交付"最小单节点图 + 动态 ChatModel 客户端 + 动态装载生效"。方案已标注多项"D54 只确认签名未确认完整 wiring"的细节，要求执行层现场 javap/spike 验证，不得凑造（`AgentStateFactory`签名/图入边写法/`invoke()`异常传播行为/Options Builder setter名/completionsPath）
- **2026-08-09：Step 2 执行+测试回执已核验，PASSED**——`product/agent-model-orchestration/receipts/step-2-{execution,test}.md`，逐条对照方案原文 §14 全部 14 项验收标准 + §5 全部 5 项现场验证细节，均相符且证据可信（javap+spike实测+mock HTTP摘录），无凑造。14 个新增单测全绿，全量 494 = 480+14 测试 0 失败。方案文件已在 `product/agent-model-orchestration/passed/step-2-orchestration-engine.md`。判定见 D55（含一处回执表述性失实的排查记录，不影响判定；已知边界：`sw.agent.enabled=true` 真实自动配置路径未测试覆盖，同 Step1）
- **2026-08-09：Step 2 独立代码级校验完成**（`search_fallback/m07-step2-verification.md`，D56）——针对纸面核验无法覆盖的盲区，独立进仓库核实回执具体技术断言。7/8 项一致（12文件实现点/编译/静态检查七项/javap字节码断言/retryCount测试/`sw.agent.enabled`未覆盖披露/前端零改动零依赖均属实）。**发现重大不一致**：回执声称"全量494测试"独立复跑后实测本次真实报告只有291个（含14新增全绿），494 疑似混入了一个不相关陈旧 worktree 的203个7月遗留报告；"480基线"同样无法独立复现。核心功能验收不受影响（D55 PASSED 不撤销），但回归测试计数验收标准降级为"待重新核实"。**遗留风险**：Step1 回执同样声称的"480基线"可能有同款问题，需独立复核；建议先清理陈旧 worktree 残留再重新统计干净基线
- **2026-08-09：基线复核完成，数字已闭合**（`search_fallback/m07-baseline-recount.md`，D57）——全仓库主树真实测试总数 **291**（10 模块，69 报告，0 失败），历史 465/480/494 均因统计口径含 `.claude/worktrees/` Jul-22 陈旧报告（203 测试）偏高，差额精确吻合，差异来源唯一定位；各 Step 新增数（+15/+14）真实准确；真实层次：pre-Step1=262 → after-Step1=277 → after-Step2=291（当前）
- **2026-08-09：Step 3 前置调研回执已核验通过**（`search_fallback/m07-step3-toolsandbox-precedent.md`）——LangGraph4j 无 ToolNode（jar tf 空输出）、ChatModel.call() 内建 agentic loop（internalCall 字节码递归）、FunctionToolCallback.builder() lambda 路径确认、SwJobBean 安全边界仅接口类型、RestClient 外部 HTTP 先例（testConnection + ChatModelFactory 两处）、V19 建表脚本 + JSON 字段惯例（H2=CLOB/PG=TEXT）全部核实
- **2026-08-09：Step 3 执行方案已起草**，写入 `product/agent-model-orchestration/passed/step-3-toolsandbox.md`（已移 passed/）。核心架构决策：①图拓扑不变（仍单节点，agentic loop 在 ChatModel 内），②两类工具统一用 FunctionToolCallback + lambda，③内部工具安全边界靠 DB 白名单（beanName/methodName 来自 DB，不接受 LLM 侧传入），④外部工具 RestClient + 超时从 DB 读，⑤新增 14 生产文件 + 2 改造 + 3 测试文件（执行层如实补足 DTO×2+Query×2）
- **2026-08-09：Step 3 执行+回执核验，PASSED**——`product/agent-model-orchestration/receipts/step-3-execution.md`（step-3-test.md 缺失，测试证据内嵌于 execution 回执 §8/§8.1），方案 §12 全部 14 项验收标准满足，16 个新增单测（Factory 5+ServiceImpl 7+Controller 4）全绿，全量 307 tests（72 报告）0 failures。判定见 D59（三项可接受偏差记录：AutoConfiguredToolCallingManager 不存在 / call("{}") 行为 / test 回执分文件格式）
- **2026-08-09：M07-F04 前置调研任务单已起草**（`search_task/m07-f04-conversation-precedent.md`）——6 问：①Spring AI 1.0.4 ChatMemory/Advisor/ChatClient 全貌（jar 是否存在 + 是否支持运行时动态 ChatModel 绑定）；②LangGraph4j invoke() 历史消息注入机制（AgentState messages 初始化语义）；③BPM/notify 多记录持久化先例（CREATE TABLE 完整内容）；④Flyway V21/V22/V23 槽位确认；⑤V20 JSON 大字段类型（H2=CLOB/PG=TEXT 先例）；⑥AgentOrchestrationServiceImpl + AgentGraphFactory 完整代码（改造基线）
- **2026-08-09：M07-F04 前置调研回执完成**（`search_fallback/m07-f04-conversation-precedent.md`，6 问全部 jar 级/行号级证据）——关键发现：①Advisor 对裸 chatModel.call() 不生效→不用 ChatClient/Advisor；②当前图无 messages 通道，callModel 用 new Prompt(input) 非消息列表→需改造；③V21/V22/V23 全局空闲；④H2=CLOB/PG=TEXT 双重先例确认；⑤agent 模块 create_by=VARCHAR(64) 偏离 8 基列确认
- **2026-08-09：Step 4 执行方案已起草**（`product/agent-model-orchestration/ready/step-4-f04-conversation.md`）——采用 ThreadLocal messages 注入架构（不走 ChatClient/Advisor）；V21（sw_agent_session）+V22（sw_agent_message）+V23（sw_agent_tool_call_log）三表；callModel 节点从 HISTORY_MESSAGES_BINDING ThreadLocal 读历史消息构造 Prompt；ServiceImpl 新增 session 创建/加载 + 消息持久化 + 工具调用日志；新增查询端点 2 个；~18 新增单测；验收标准 14 项
- **下一步**：执行 Step 4（`deepseek/deepseek-v4-pro`），产出 `product/agent-model-orchestration/receipts/step-4-{execution,test}.md`

最新完成：**process-monitoring (M04-F06-01)：COMPLETED ✅**
- Step 0 探索：PASSED（范围裁定：首批仅流程图高亮 + 流转记录）
- Step 1 后端 Facade + Service：PASSED（15 @Test）
- Step 2 后端 BpmInstanceController：PASSED（6 @Test，14/14 验收）
- Step 3 前端 ProcessInstanceList：PASSED（4 @Test，16/16 验收）
- 阶段三收尾完成（2026-07-30）
- 耗时分析 + 流程干预延后至后续批次

## 测试基线

- 后端：项目级 **307 tests**（CONFIRMED 2026-08-09 Step3 全量，0 failures/0 errors，72 报告；原声称 465 含 `.claude/worktrees/` 203 陈旧报告，D57；pre-Step1=262，after-Step1=277，after-Step2=291，after-Step3=307 当前值）
- 前端：60 spec files / **521 tests**，四连校验门全绿（CONFIRMED 2026-07-28）
- 已完成功能：11 个

## 模块完成度（简表）

**后端**：security/system/form/bpm(notify/storage/job 完成，iot/agent/knowledge/openapi 骨架)
**前端**：login/shell/menu/auth/form/notify/workflow/system/storage/job 完成，iot/agent/openapi 占位
- BPMN adapter：查看器防腐层完成 + 后端 XML 端点 + 两个消费方（ProcessDefList + ProcessInstanceList，60f/521t）
- Vue Flow adapter：防腐层完成（零消费方，M07 AI 调度图业务模块未就位）

## Walking Skeleton

```
登录/认证 ✅ → 表单设计/渲染 ✅ → BPM 单节点审批 ✅ → 通知列表 ✅
```
四环全部闭合。

---
> 本文件为压缩摘要。完整状态（已完成功能列表、文件计数、核心能力枚举、延后项清单）在 `knowledge/current-status.md`。
> 需要时：创建 search_task，范围 `knowledge/current-status.md`
