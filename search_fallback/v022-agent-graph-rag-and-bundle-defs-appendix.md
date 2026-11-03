# 附录：v022 探索详细证据（Agent graph / RAG / LangChain4j / 定义细节）

主回执：`search_fallback/v022-agent-graph-rag-and-bundle-defs.md`。除特别说明外，路径相对 `Smart-WorkFlow-aPaaS-server/`；前端相对 `Smart-WorkFlow-aPaaS-Web/`。行号为 2026-11-03 工作树实际读取结果。

## C1 graph 数据模型与版本

| 项 | 事实 | 证据 |
|---|---|---|
| 表 | `sw_agent_graph_def` | `V0.2.0__baseline_seed.sql:1408-1434`（原 V25） |
| 列 | id BIGINT、graph_key、name、def_version、status(DRAFT/PUBLISHED)、graph_json TEXT、审计+tenant | 同上 :1411-1426 |
| 实体 | `AgentGraphDef`，`@TableName("sw_agent_graph_def")`，继承 BaseEntity | `sw-basic/sw-basic-agent/.../entity/AgentGraphDef.java:29-44` |
| graph_json | `ProcessGraph{graphKey,name,version,elements[],canvas}`；`GraphElement{id,kind(node/edge),type,source,target,config,style}`；config/style 后端不解释 | `.../dto/graph/ProcessGraph.java:24-45`；`GraphElement.java:28-58` |
| 发布 | 仅校验可解析+elements 非空、graph_key 冻结、def_version+1、status=PUBLISHED | `.../service/impl/AgentGraphDefServiceImpl.java:130-155` |
| 版本快照 | **无**。发布不复制 graph_json，重复发布覆盖同一行；执行记录只存 def_version，无历史图副本 | 同上；`AgentGraphExecution` 实体 |
| 智能体与图 | 无独立 agent 实体/表；“智能体”是模块，图定义即执行单元；F01 单智能体是固定内置 LangGraph4j 图 | 实体目录 `sw-basic/sw-basic-agent/.../entity/`；`AgentGraphFactory.java:1-260` |

## C2 节点类型与配置

常量：`sw-basic/sw-basic-agent/.../orchestration/AgentGraphInterpreter.java:99-146`。

| type | 配置字段 | 外部引用 | 语义/约束 |
|---|---|---|---|
| START | 无 | 无 | 唯一入口（执行前校验） |
| END | inputVar | 无 | 到达即终止全部活跃点 |
| LLM | agentModelConfigId、systemPrompt、userPromptTemplate、inputVar、outputVar | 模型配置 id（Long） | 单跳调用，不带工具/历史 |
| TOOL | toolName、inputVar、outputVar | 工具 name（内部/外部白名单） | 直接执行工具，不经过 LLM |
| CONDITION | inputVar；出边 config.keyword | 无 | 子串匹配，取第一个命中；无匹配走唯一默认边 |
| LOOP | maxIterations（默认 10） | 无 | 迭代计数超限报错 |
| FORK | 无 | 无 | 出边 ≥2；FIFO 逻辑并发，非线程并行 |
| JOIN | 无 | 无 | 入边 ≥2；按到达计数汇合 |

- 执行前校验在 `AgentGraphExecutionServiceImpl.java:406-500`：唯一 START、至少一条可达 END、LLM 模型存在、TOOL 工具存在且启用、CONDITION 默认边唯一、FORK≥2、JOIN≥2、LOOP maxIterations≥1。
- 没有 HUMAN / SUBGRAPH / KNOWLEDGE / RAG 节点。前端节点集合同为 8 类（`src/modules/agent/views/GraphDesigner.vue:124-133`）。

## C3 执行引擎能力

- **同步**：`execute()` 在请求线程内 `interpreter.run(...)`，一次性返回结果（`AgentGraphExecutionServiceImpl.java:170-206`）；无异步队列、无 SSE/WebSocket、无流式（agent 主代码无 Flux/SseEmitter）。
- **状态**：单次运行的 `Map<String,String>` 变量表（`AgentGraphInterpreter.java:250-266`）；FORK 分支写同名变量为“最后写入覆盖”（注释 :252-255）；变量不持久化。
- **轨迹**：节点轨迹（步序、分支路径、耗时、变量快照）由解释器采集，执行 Service 批量落 `sw_agent_graph_execution_node`（:229-241）。
- **记忆/会话**：图执行无会话；单智能体编排有 `sw_agent_session`/`sw_agent_message`，每轮加载全部历史消息（`AgentOrchestrationServiceImpl.java:275-282`），无摘要、无向量记忆。
- **工具调用**：单智能体路径用 Spring AI `ToolCallingChatOptions`，工具循环由 `ChatModel.call()` 内部完成（`AgentGraphFactory.java:180-215`）；图执行的 LLM 节点不带工具（`AgentGraphInterpreter.java:404-425`），工具只能走 TOOL 节点。
- **错误分类**：`STEP_LIMIT`、`LOOP_LIMIT`、`UNDEFINED_VARIABLE`、`CONDITION_NO_MATCH`、`TOPOLOGY_INVALID`、`MODEL_CALL_FAILED`、`TOOL_CALL_FAILED`、`UNKNOWN`（`AgentGraphInterpreter.java:171-192`）；执行失败回 `success=false`，不抛 HTTP 500。
- **重试/超时**：模型配置 `retryCount` → `RetryTemplate`，`timeoutSeconds` → RestClient 连接/读超时（`ChatModelFactory.java:110-126`）；工具 `timeoutSeconds`（`AgentToolCallbackFactory.java:148-165`）；**无图级超时**，用 maxSteps 预算（2×节点数 + Σloop 次数×节点数）兜底。
- **取消**：仅调试会话有 `/stop`（`AgentGraphDebugController.java:85-88`）；图执行无取消端点。

## C4 工具管理

- 表：`sw_agent_tool_internal`（name/description/input_schema/bean_name/method_name/enabled/remark）、`sw_agent_tool_external`（+url/http_method/timeout_seconds）（`baseline:1240-1288`）。
- 内部工具：Spring bean 反射，约定 `String execute(String)`，构造期解析失败即抛（`AgentToolCallbackFactory.java:104-135`）。
- 外部工具：HTTP GET/POST/PUT 白名单（`:64`），`RestClient` 调用，无鉴权头配置。
- 启停：`enabled` 列，加载时过滤；端点 `/agent/tool/internal|external` CRUD + `/{id}/toggle`，权限 `agent:tool:view`/`agent:tool:manage`（`AgentToolConfigController.java:43-130`）。

## C5 前端菜单与页面

- 菜单：智能体（id=7，`agent:view`，AgentHome 空白页）、图定义管理（id=15，`agent:model:view`）、大模型管理（id=209 + 按钮 210/211）、工具管理（id=212 + 按钮 213）（`baseline:555,1461,1708-1720,1910-1920`）。
- 静态路由：`agent/graph-designer/:id`、`agent/executions/list`、`agent/executions/detail/:id`、`agent/conversations/list`、`agent/conversations/detail/:sessionId`、`agent/debug/:sessionId`、`agent/tool`（`src/router/index.ts:301-330,462-530`）。
- 页面：ModelList/ModelFormDialog、GraphDefList/GraphDesigner、ToolList + Internal/ExternalToolFormDialog、ExecutionList/ExecutionDetail/NodeTrajectory、ConversationList/ConversationDetail、DebugSessionView、AgentHome（BlankPage，`AgentHome.vue:1-7`）。
- 设计器：Vue Flow + 自有防腐层 `utils/graphAdapter.ts`，节点面板按 `NODE_PANEL_REGISTRY` 动态挂载（`GraphDesigner.vue:1-30,424-450`）；坐标存 `style.x/y`。
- 执行入口：`GraphDefList` 调 `POST /agent/graph-defs/{id}/execute`（`src/modules/agent/api/index.ts:102-108`）；单智能体编排 `POST /agent/orchestration/run`（`agent:orchestration:run`）无前端页面。

## C6 已知缺陷/半成品

1. AgentHome 为空白页（`AgentHome.vue`）。
2. 无 RAG/知识检索；I13 仍记 "RAG 向量库选型、流程表单联动点未决"（`knowledge/known-issues.md:70,269-277`）。
3. 无流式输出、无异步执行、无执行取消、无检查点/续跑。
4. 图发布无历史版本快照，重发布覆盖 graph_json；历史执行无法按版本回放。
5. FORK 仅 FIFO 逻辑并发（单线程），JOIN 按静态入边数计数；分支写同名变量覆盖。
6. 图 LLM 节点不支持 function calling，工具必须独立 TOOL 节点。
7. `protocol_type=other` 可存不可跑（上一轮 A4）。
8. I48：flow-graph adapter 无边点击事件/命令式更新通道（`knowledge/known-issues.md:102`）。

## D7 知识库模块现状

- 文件仅：`pom.xml`、`config/KnowledgeAutoConfiguration.java`、`config/KnowledgeDataSourceProperties.java`、`META-INF/spring/...AutoConfiguration.imports`、`src/main/resources/db/migration/knowledge/.gitkeep`、`src/test/.../KnowledgeTikaPdfCompatTest.java`。
- 无 entity/mapper/service/controller；无前端页面（Web 全量搜索 knowledge/RAG 无业务命中）。
- 依赖已声明：Tika core + parsers、PDFBox、jsoup、postgresql、`com.pgvector:pgvector`、`spring-ai-starter-vector-store-pgvector`（`sw-basic-knowledge/pom.xml:41-75`）。
- 自动配置仅在 `sw.knowledge.enabled=true` 生效（`KnowledgeAutoConfiguration.java:12-15`）；全仓无该配置项设置。
- `KnowledgeDataSourceProperties` 只有 url/username/password（`:8-14`），未被任何类注入使用。
- 上传/切分/向量化/检索：**均未实现**；唯一测试是 Tika+PDFBox 内存解析兼容锚点（`KnowledgeTikaPdfCompatTest.java:1-40`）。

## D8 pgvector 与 H2

- 全部迁移（`db/migration`、`db/upgrade`）无 `CREATE EXTENSION`、无 vector 列/表、无 embedding 表。
- 知识库迁移目录为空（仅 `.gitkeep`）。
- H2：无任何 knowledge 库表或向量处理；H2 测试上下文不涉及 pgvector（依赖仅 PostgreSQL 方言可用）。

## D9 Embedding 配置

- 无 EmbeddingModel Bean/配置/调用；`sw_agent_model_config` 无 embedding 维度、无 embedding 模型类型字段，未被复用。
- knowledge 模块只声明了 pgvector starter，没有向量存储 Bean 配置。

## D10 graph 中的知识检索

- 节点类型清单无 KNOWLEDGE/RAG；编排链路无检索调用；模型配置、工具、图定义均无知识库 id 字段。

## E11 LangChain4j 版本与兼容性

- 最新稳定版 **1.23.0**（Maven Central `dev.langchain4j:langchain4j` metadata，`lastUpdated=20261102131050`）；部分模块为 `1.23.0-beta33`。
- 最低 JDK 17（官方 get-started："The minimum supported JDK version is 17."）→ Java 21 可用。
- Spring Boot：核心 artifact 无 Spring 依赖；Spring Boot 3 starter `langchain4j-open-ai-spring-boot-starter` 最新 **1.23.0-beta33**，其 POM 依赖 `spring-boot-starter:3.5.16`；本项目 Spring Boot **3.4.4**（`sw-dependencies/pom.xml:21`）。另有 `...-spring-boot4-starter` 1.23.0-beta33。
- 官方链接：https://docs.langchain4j.dev/get-started ；https://repo1.maven.org/maven2/dev/langchain4j/langchain4j/maven-metadata.xml

## E12 三种格式支持

| 格式 | 模块（版本） | 类 | 自定义 baseUrl |
|---|---|---|---|
| OpenAI Chat Completions | `dev.langchain4j:langchain4j-open-ai:1.23.0` | `OpenAiChatModel` / `OpenAiStreamingChatModel` | 支持 `.baseUrl(...)` |
| OpenAI Responses（experimental） | 同模块 1.23.0 | `OpenAiResponsesChatModel` / `OpenAiResponsesStreamingChatModel` | 支持 `.baseUrl(...)`（源码确认） |
| Anthropic Messages | `dev.langchain4j:langchain4j-anthropic:1.23.0` | `AnthropicChatModel` / `AnthropicStreamingChatModel` | 支持 `.baseUrl(...)` |
| （附）Google Gemini | `dev.langchain4j:langchain4j-google-ai-gemini:1.23.0` | `GoogleAiGeminiChatModel` / `GoogleAiGeminiStreamingChatModel` | 支持 |

- 文档：https://docs.langchain4j.dev/integrations/language-models/open-ai ；.../anthropic ；.../google-ai-gemini
- Responses 源码：https://github.com/langchain4j/langchain4j/blob/main/langchain4j-open-ai/src/main/java/dev/langchain4j/model/openai/OpenAiResponsesChatModel.java

## E13 能力对应模块

| 能力 | 模块 | 关键类 |
|---|---|---|
| 同步对话 | 各 chat model 模块 | `*ChatModel` |
| 流式 | 同上 | `*StreamingChatModel` |
| 工具调用 | `dev.langchain4j:langchain4j:1.23.0`（高层 API） | `AiServices`、`@Tool`、`ToolExecutor`；低层 `ChatModel` 需手工执行 |
| Embedding | `langchain4j-open-ai`（`OpenAiEmbeddingModel`，支持 baseUrl） | — |
| pgvector 存储 | `dev.langchain4j:langchain4j-pgvector:1.23.0-beta33` | `PgVectorEmbeddingStore`（需 pgvector 扩展；`createTable` 默认 true） |

- 文档：https://docs.langchain4j.dev/tutorials/tools ；.../integrations/embedding-models/open-ai ；.../integrations/embedding-stores/pgvector

## E14 与 Spring AI 1.0.4 的依赖风险

- **Jackson**：`langchain4j-open-ai:1.23.0` 声明 jackson-annotations 2.22、jackson-core/databind **2.22.4**；Spring Boot 3.4.4 BOM 管理 **jackson-bom 2.18.3**（spring-boot-dependencies-3.4.4.pom）。dependencyManagement 会把传递版本压到 2.18.3，LC4j 按 2.22.4 编译 → 存在 `NoSuchMethodError` 类风险，需要显式对齐/验证。
- **HTTP**：LC4j 1.23.0 使用 `langchain4j-http-client` + `langchain4j-http-client-jdk`（JDK HttpClient），**无 OkHttp/Retrofit**；Spring AI 用 Spring RestClient/WebClient → 无客户端库冲突。
- **Reactive**：`langchain4j-reactive-streaming:1.23.0-beta33` + `mutiny-zero:1.3.1`，与 Spring Reactor 并存，API 不同，非直接冲突。
- **Spring AI 1.0.4**：两者包名不同（`org.springframework.ai.*` vs `dev.langchain4j.*`），可共存但会有两套 ChatModel/Embedding/重试配置；替换时需迁移 `ChatModelFactory`、`AgentGraphFactory`、工具回调（FunctionToolCallback → ToolSpecification/@Tool）。
- 新增依赖：`com.knuddels:jtokkit:1.1.0`。

## F15 动态宽表

- 表名：`sw_form_{nanoId}`、子表 `sw_form_table_{nanoId}`，正则 `^sw_form(_table)?_[a-z][a-z0-9]{9}$`（`DynamicTableSql.java:79`；`DynamicTableManager.java:85-95`）。
- 建表时机：表单**发布**时（`FormDefServiceImpl.java:340-352`），字段校验通过后；已存在则跳过并 warn（`DynamicTableManager.java:139-147`）。
- 物理表名回填 `sw_form_def.physical_table_name`；TABLE 字段子表映射写入 `sub_table_mapping` JSON（`FormDefServiceImpl.java:354-370`）。
- 系统列：id VARCHAR(36) PK、tenant_id BIGINT、deleted SMALLINT、create_time/update_time TIMESTAMP、create_by/update_by BIGINT、version BIGINT（`DynamicTableManager.java:48-57`）；子表额外 `parent_record_id VARCHAR(36)`（:171-175）。
- 列类型：TEXT→VARCHAR(1000)、RICH_TEXT→CLOB/TEXT、NUMBER→NUMERIC(20,6)、DATE→TIMESTAMP、BOOL→SMALLINT、DICT→VARCHAR(100)、REFERENCE→VARCHAR(36)、MULTISELECT→VARCHAR(1000)、ATTACHMENT/IMAGE→CLOB/TEXT、USER/DEPT→VARCHAR(64)、FORMULA→NUMERIC(20,6)、DATASOURCE→CLOB/TEXT、TIME→TIME（`VendorDialect` 两方言实现）。
- 列名：REFERENCE → `ref_{name}_id`，其余按逻辑名（`ColumnValidation.java:163-186`）。
- 所有动态 SQL 经 `DynamicTableSql`：强制 tenant_id + deleted 条件、参数绑定、标识符白名单（`DynamicTableSql.java:1-90`）。
- 导入到新租户/新 key：form_key 租户内唯一（需改名或换租户）；发布生成**新随机表名**，不能复用源表；数据行要重写 tenant_id、生成新 id、按目标表重映射 REFERENCE id、确保 USER/DEPT/storageKey 存在；子表行按 parent_record_id 关联；DATASOURCE 冻结 JSON 里的 queryKey/version 需在目标环境存在。

## F16 表单 definition 字段类型与外部引用

启用：TEXT、RICH_TEXT、NUMBER、DATE、BOOL、DICT、REFERENCE、TABLE、MULTISELECT、ATTACHMENT、IMAGE、LABEL、TIME、USER、DEPT、FORMULA、DATASOURCE；占位：EMAIL、PHONE、URL、RATE、SLIDER（`FieldType.java` 枚举；前端 `src/contracts/form-schema.ts:9-30`）。

| 属性 | 外部引用 |
|---|---|
| DICT.dictType（source=dict 时） | `sys_dict_type.code` |
| REFERENCE.targetFormId | 目标表单（前端契约字段；后端列 `ref_{name}_id` 存记录 id） |
| DATASOURCE.dsBinding{queryKey,version,valueField,displayField} | `sw_form_ext_query` 契约（datasource_id 在契约侧） |
| USER / DEPT 的值 | `sys_user` / `sys_dept` 的 id（服务端校验同租户/有效） |
| ATTACHMENT / IMAGE 的值 | `[{storageKey,name}]` → `sw_storage_file` |
| TABLE.subFields | 生成 `sw_form_table_*` 子表 |
| FORMULA.expression | `${字段}` + ABS/ROUND/MIN/MAX/DAYS 白名单 |
| definition.fieldPermissions | `user:<id>`/`dept:<id>`/`role:<code>`（`FieldPermissionService.java:19-24`） |

## F17 流程 graph_json 节点配置全清单

节点类型来自 translator 的 `type()`：START、END、APPROVAL、CONSENSUS、CONDITION、PARALLEL_GATEWAY、DYNAMIC_PARALLEL、COPY、NOTIFICATION、TXN_ACTION、SUBFLOW_WAIT（`sw-biz/sw-bpm/sw-bpm-engine/.../translator/*.java`）。前端隔离 profile 提到 P57_VERIFY，后端 translator 无该类型。

| 节点 | 配置字段 | 外部引用 |
|---|---|---|
| START | 无 | — |
| END | 无 | — |
| APPROVAL | name、participant、opinionForm、nodeForm、allowedActions、returnTargets；节点级 functions/triggers | 参与人（用户id/角色code/部门id/岗位code/表单字段/节点表单聚合/表达式/适配器）、审批意见表单 formId+version、节点表单 formKey+冻结 formVersion、退回目标节点 id |
| CONSENSUS | participant、mode、ratio、nodeForm | 同上（参与人/表单） |
| CONDITION | name；边条件 keyword/expression | — |
| PARALLEL_GATEWAY | 拓扑 | — |
| DYNAMIC_PARALLEL | source{sourceType,...}、mode、ratio、maxBranches、emptyStrategy、invalidStrategy、semanticVersion、nodeForm | source 中的表单字段/固定对象 id、节点表单 |
| COPY | name、participant、failureStrategy | 参与人 |
| NOTIFICATION | name、participant、channel、title、content、failureStrategy | 参与人；`NotifyChannel` 渠道（IN_APP/SMS/EMAIL/FEISHU/DINGTALK/WECHAT_*） |
| TXN_ACTION | name、actionId、recordIdSource、quantity、failureStrategy | `actionId` → 表单事务动作（`FormTxnActionPort.describe`，跨租户不可达即发布失败） |
| SUBFLOW_WAIT | name、waitActionIds | 子流程动作 id 集合 |

流程定义级引用：`form_key`、`category_id`、`deployment_id`/`process_definition_id`（Flowable）、`iotDeviceActionJson`、`published_version`；版本表 `sw_bpm_process_def_version` 保存每版 `graph_json`（`baseline:3327-3355`），这点与 Agent 图不同。
