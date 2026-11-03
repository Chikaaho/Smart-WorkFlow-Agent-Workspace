# v022 探索回执：Agent graph / RAG / LangChain4j / 定义细节

日期 2026-11-03　执行　基线 develop　细节见同名 `-appendix.md`

## 范围

server/web 工作树、迁移、knowledge、m07 探索；LangChain4j 官方文档/Maven Central。未构建/测试/启动。

## C. Agent graph

1 表 `sw_agent_graph_def`（graph_key/def_version/status/graph_json）；graph_json=`ProcessGraph{elements{id,kind,type,source,target,config,style},canvas}`，config/style 不解释。发布只 +def_version、冻结 graph_key、覆盖同一行，**无版本快照**；无独立 agent 实体，图即执行单元。
2 节点 8 类：START、END(inputVar)、LLM(agentModelConfigId/systemPrompt/userPromptTemplate/inputVar/outputVar)、TOOL(toolName/inputVar/outputVar)、CONDITION(inputVar+边 keyword)、LOOP(maxIterations)、FORK(≥2 出边)、JOIN(≥2 入边)。外部引用仅模型 id、工具名；无人工/子图/知识节点。
3 执行同步、无异步/流式/取消；状态=单次变量表(String)，轨迹落 `sw_agent_graph_execution_node`；图执行无会话，单智能体有 session/message 历史；function calling 仅单智能体路径，图 LLM 不带工具；无图级超时，maxSteps 兜底。
4 工具：`sw_agent_tool_internal`（bean 反射 String→String）、`sw_agent_tool_external`（HTTP GET/POST/PUT+超时），enabled 启停，权限 agent:tool:view/manage。
5 前端：菜单 智能体(7,AgentHome 空白)/图定义(15)/大模型(209-211)/工具(212-213)；页面 ModelList、GraphDefList、GraphDesigner(Vue Flow+graphAdapter)、ToolList、Execution/Conversation/Debug；执行入口 `POST /agent/graph-defs/{id}/execute`，单智能体 run 无页面。
6 缺陷：AgentHome 空白、无 RAG、无流式/异步/取消/续跑、发布无历史版本、FORK 仅 FIFO 逻辑并发、JOIN 静态入边计数、分支同变量覆盖、图 LLM 不调工具、other 协议不可跑；I13/I48 未决。

## D. RAG

7 `sw-basic-knowledge` 仅 pom+2 个 config+空迁移目录+1 个 Tika/PDFBox 测试；无 entity/service/controller/前端。上传/切分/向量化/检索均未实现；`sw.knowledge.enabled` 全仓未配置。
8 迁移无 `CREATE EXTENSION`/向量表；H2 无知识库表或向量处理。
9 无 Embedding 配置/调用，未复用 `sw_agent_model_config`。
10 无知识节点、无编排挂知识库入口、无知识库 id 字段。

## E. LangChain4j

11 最新稳定 **1.23.0**（Maven Central，2026-11-02）；部分模块 1.23.0-beta33。最低 JDK 17→Java 21 可用。SB3 starter 1.23.0-beta33 依赖 spring-boot-starter 3.5.16，本项目 3.4.4，有版本差。
12 Chat Completions=`langchain4j-open-ai:1.23.0` `OpenAiChatModel/Streaming`（baseUrl 支持）；Responses=同模块 `OpenAiResponsesChatModel/Streaming`（experimental，源码支持 baseUrl）；Anthropic=`langchain4j-anthropic:1.23.0` `AnthropicChatModel/Streaming`（baseUrl 支持）。
13 同步/流式=各 chat 模块；工具=`langchain4j:1.23.0` 的 `AiServices`+`@Tool`；Embedding=`langchain4j-open-ai` 的 `OpenAiEmbeddingModel`；pgvector=`langchain4j-pgvector:1.23.0-beta33` 的 `PgVectorEmbeddingStore`（需扩展）。
14 冲突：Jackson LC4j 2.22.4 vs Boot BOM 2.18.3（会被压制，NoSuchMethodError 风险）；HTTP 用 JDK HttpClient 无 OkHttp；Reactive 多 mutiny-zero；与 Spring AI 包名不同可共存但两套配置，迁移点 ChatModelFactory/AgentGraphFactory/工具回调。

## F. 定义细节

15 动态宽表：`sw_form_{nanoId}`/`sw_form_table_{nanoId}`，发布时建表并回填 physical_table_name，TABLE 建子表+sub_table_mapping；系统列 id/tenant_id/deleted/create|update_time/create|update_by/version，子表 parent_record_id；REFERENCE→`ref_{name}_id`；SQL 全走 DynamicTableSql。导入新租户/key：form_key 唯一需改名、新表、重写 tenant_id/id、重映射引用、确保用户/部门/storageKey 存在。
16 字段类型：TEXT/RICH_TEXT/NUMBER/DATE/BOOL/DICT/REFERENCE/TABLE/MULTISELECT/ATTACHMENT/IMAGE/LABEL/TIME/USER/DEPT/FORMULA/DATASOURCE；占位 EMAIL/PHONE/URL/RATE/SLIDER。引用：dictType、targetFormId、dsBinding{queryKey,version}、用户/部门 id、storageKey、子表、公式白名单、fieldPermissions 主体。
17 流程节点：START/END/APPROVAL/CONSENSUS/CONDITION/PARALLEL_GATEWAY/DYNAMIC_PARALLEL/COPY/NOTIFICATION/TXN_ACTION/SUBFLOW_WAIT；引用参与人（用户/角色/部门/岗位/表单字段/聚合）、意见表单 formId+version、节点表单 formKey+冻结版本、退回节点、通知渠道、actionId、waitActionIds；流程级 form_key/category_id/Flowable id/IoT JSON。BPM 有版本表存每版 graph_json，Agent 无。

## 未确认

- LC4j 在 Boot 3.4.4+Jackson 2.18.3 下的实际运行兼容。
- Agent 历史执行按版本回放（无快照，理论不可）。
- 流程 functions/triggers 完整引用清单。

## 是否需继续

事实已够进方向；若做 LangChain4j 迁移，实施阶段须先验证依赖对齐。
