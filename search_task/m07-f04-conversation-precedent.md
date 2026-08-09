# 探索任务：M07-F04「对话交互」前置调研

**任务目标**：Step1-3 已完成模型管理、最小编排引擎、工具沙箱三层基础。M07-F04 目标是落地「对话交互」——使 Agent 具备**多轮会话能力**：用户每次调用携带会话 ID，系统从 DB 加载历史消息注入图上下文，执行完毕后将本轮 用户消息 + 助手回复 + 工具调用日志持久化回 DB，前端可查询会话列表/消息历史。

当前现状：
- `AgentOrchestrationRunReqDTO` 仅有 `agentModelConfigId + input` 两字段（无 conversationId）
- `AgentOrchestrationServiceImpl.run()` 每次调用均为无状态单轮（无消息历史注入、无持久化）
- `sw_agent_*` 表仅有 V19（model_config）+ V20（tool_config 两张），V21 起空闲
- Spring AI 1.0.4 工具调用 API 已验证（FunctionToolCallback）；ChatMemory/Advisor API 从未使用，现有仓库零引用

本任务需摸清：①Spring AI 1.0.4 是否有 ChatMemory/Advisor 层可直接复用于历史消息注入；②LangGraph4j `CompiledGraph.invoke()` 如何接受已有消息历史作为初始状态；③仓库内多轮记录持久化的先例（BPM 流程实例/流转记录模式，通知消息模式）；④Flyway 需新开几个 V 号以及惯例脚本结构；⑤JSON 字段（工具调用参数/返回值）存储类型惯例（V20 已有先例，需读取确认）。禁止凑造签名，所有结论须有 jar 级或文件行号级证据。

---

**需要回答的问题**：

### 问题 1：Spring AI 1.0.4 ChatMemory / Advisor API 全貌

**jar 路径**（先用 `find ~/.m2/repository/org/springframework/ai/ -name "spring-ai-*.jar" | sort` 列出所有可用 jar，重点关注含 `advisor`/`memory`/`client-chat` 关键字的 jar）

- 全量列出 `~/.m2/repository/org/springframework/ai/` 下所有 1.0.4 jar 文件名（`find` 输出），确认是否存在 `spring-ai-advisors-*.jar`（或等价）。
- 若存在 `spring-ai-client-chat-1.0.4.jar`：用 `jar tf` 列出其中所有类，grep 含 `ChatClient`/`Advisor`/`ChatMemory`/`Memory` 关键字的类名，给出完整类路径列表。
- 若找到 `ChatMemory` 接口（或 `ChatMemoryStore`/`ChatMemoryRepository`）：javap -p 输出完整方法签名——重点是"按会话 ID 读取历史消息"和"追加新消息"两个方法的参数类型。
- 若找到 `MessageChatMemoryAdvisor`（或等价 Advisor 类）：javap -p 输出构造函数/静态工厂签名。
- 若找到 `ChatClient` 类：javap -p 输出 `builder`/`prompt`/`advisors`/`call` 方法签名，说明 ChatClient 是否可以接受运行时动态 `ChatModel` 实例（即 `ChatClient.builder(chatModel)` 形式，而非 Spring 自动注入的 `@Autowired ChatClient`）。
- **关键判断**：ChatMemory/Advisor 层是否与直接 `ChatModel.call(Prompt)` 的调用路径兼容（即：可以在 ServiceImpl 手动构造 ChatClient + Advisor，不依赖 Spring 自动装配），还是必须走 Spring Boot AutoConfiguration 才能生效？若不确定，给出字节码层面的观察（构造函数是否 public、是否有必填的框架注入字段）。

### 问题 2：LangGraph4j 1.5.14 多轮历史消息注入机制

**jar**：`~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar`

- `CompiledGraph` 的 `invoke` 方法完整签名（javap -p，重点是参数类型：接受 `Map<String, Object>` 还是 `AgentState`？）
- `AgentState` 中 `messages` 字段的类型和初始化方式（javap -p AgentState，找 `messages` 相关方法）：
  - 若 `invoke(Map<String, Object>)` 接受初始输入 map，`messages` key 对应的值类型是 `List<Message>` 还是其他？
  - `AgentState` 是否支持在 `invoke` 调用前传入已有消息列表（即把从 DB 加载的历史消息作为初始 `messages`），还是 `messages` 只能从空列表开始累积？
- `AgentState.messages()` 的返回类型（完整泛型），以及 Step2 中 `AgentGraphFactory` 里 `callModel` 节点读取 `state.messages()` 的具体调用方式——读取文件 `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java`，给出 `callModel` lambda 中读取和追加消息的完整代码片段（不截断）。
- `Channels.appender(LinkedList.class)` 的语义：每次 `invoke` 时 messages 通道是追加（append-only）还是覆盖？若是追加，从 `invoke` 外部传入的初始 messages 是否会被保留在第一轮 LLM 调用之前？

### 问题 3：BPM / 其他模块的多记录持久化先例

目标是为 `sw_agent_session`（会话主表）和 `sw_agent_message`（消息明细表）设计提供仓库内真实先例，重点关注"一主多从、带时序、带状态枚举"的 DB 设计模式。

- 读取以下文件，摘录 **表结构（CREATE TABLE）完整内容**（不截断）：
  - BPM 流程实例表（Flyway 脚本）：先用 `find Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration -name "*.sql" | xargs grep -l "bpm_process_instance\|process_inst" 2>/dev/null` 定位文件，再读取 h2 版本。
  - BPM 历史/流转记录表（如 `sw_bpm_flow_trace`/`sw_bpm_history`）：同上定位后读取 h2 版本。
  - 通知消息表（如 `sw_notify_message`/`sw_message`）：`find Smart-WorkFlow/sw-bootstrap -name "*.sql" | xargs grep -l "notify_message\|sw_message" 2>/dev/null`，读取 h2 版本。
- 对每张表，特别标注：
  - 主外键关联方式（`id` 字段类型是 bigint auto_increment 还是其他）
  - 时序字段（`create_time`/`update_time`/`end_time` 是 TIMESTAMP 还是 DATETIME）
  - 状态字段（`status` 用 tinyint 还是 varchar）
  - 大文本/JSON 字段（用 TEXT/CLOB/LONGTEXT/VARCHAR(MAX)）
  - `tenant_id` / `create_by` 等公共审计字段是否存在

### 问题 4：Flyway V21+ 槽位及脚本惯例

- `find Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/ -name "*.sql" | sort` 确认当前 agent/ 下最高已用 V 号（预期 V20），V21 是否空闲。
- 读取 `V20__init_agent_tool_config.sql`（h2 版本完整内容）作为建表脚本模板参考。
- 读取 `Smart-WorkFlow/sw-bootstrap/src/main/resources/application.yml`（或 `application-dev.yml`）中 `flyway.locations` 配置，确认 `classpath:db/migration/agent/{vendor}` 是否已在列表中（Step3 已确认，此处再次确认以防后续有改动）。
- F04 预计需要新建 3 张表：`sw_agent_session`（会话主表）、`sw_agent_message`（消息明细）、`sw_agent_tool_call_log`（工具调用日志）。确认 V21/V22/V23 均未被占用（3 个 V 号）。

### 问题 5：工具调用日志 JSON 字段类型惯例（V20 参照）

- 读取 `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V20__init_agent_tool_config.sql` 和 `postgresql/V20__init_agent_tool_config.sql`（完整内容，不截断）。
- `input_schema` 字段的类型（H2 侧 vs PG 侧），确认 H2=CLOB / PG=TEXT 模式是否成立。
- `sw_agent_tool_call_log` 需要存储 `tool_call_args`（LLM 传入的 JSON 参数字符串）和 `tool_call_result`（工具返回的 JSON 字符串），两者可能较长（数 KB）。确认 V20 的 `input_schema` 字段类型选择可作为此类大文本字段的直接先例。

### 问题 6：AgentOrchestrationServiceImpl 当前实现结构

读取以下文件，给出**完整代码**（不截断）：
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java`

回答：
- `run(AgentOrchestrationRunReqDTO)` 方法的完整实现流程（ThreadLocal bind → graph invoke → clear），标注哪一行创建初始 `messages` 列表、哪一行执行图、哪一行从结果中取最终回复文本。
- `AgentGraphFactory` 中 `callModel` 节点如何构造输入 `Prompt`——是直接把 `state.messages()` 传给 ChatModel，还是从 state 中只取最新一条用户消息？这直接决定"在 invoke 前把历史 messages 塞入 AgentState"是否能让 ChatModel 看到完整上下文。
- `invoke()` 调用之后如何从返回结果中提取最终回复文本（返回值类型 + 字段路径）。

---

**搜索范围**：

```
find ~/.m2/repository/org/springframework/ai/ -name "spring-ai-*.jar" | sort
jar tf ~/.m2/repository/org/springframework/ai/spring-ai-client-chat/1.0.4/spring-ai-client-chat-1.0.4.jar | grep -i "advisor\|memory\|ChatClient\|Memory"
javap -p (ChatMemory/MessageChatMemoryAdvisor/ChatClient 等相关类)
javap -p ~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar (CompiledGraph/AgentState)
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/ (V20 h2+pg 完整内容)
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/ (BPM/notify 表先例定位)
Smart-WorkFlow/sw-bootstrap/src/main/resources/application.yml (flyway.locations 确认)
```

**禁止范围**：
- 不得修改任何文件
- 不得运行 `mvn compile`/`mvn test` 等触发编译的命令（可用 `jar tf`/`javap`/`find`/`grep`/文件读取）
- 不得对 F04 的具体实现方案做设计建议，只汇报"库真实支持什么、仓库已有什么可参照"，设计决策由规划层做
- 若某 jar 中确实不存在某类/方法，明确标注"不存在"，不得以训练记忆补填

**预期证据**：
- 问题 1：Spring AI advisor jar 存在性（`find` 输出）+ ChatMemory/ChatClient javap 原始摘录，含"能否运行时动态绑定 ChatModel"的判断依据
- 问题 2：`CompiledGraph.invoke()` 参数类型 + AgentState messages 初始化语义（javap 原始片段）+ AgentGraphFactory.java 完整代码
- 问题 3：至少 2 张 BPM/notify 先例表的完整 CREATE TABLE 语句
- 问题 4：V21/V22/V23 空闲确认 + V20 h2 完整脚本
- 问题 5：V20 H2 vs PG input_schema 字段类型对比（完整脚本）
- 问题 6：AgentOrchestrationServiceImpl 完整代码 + AgentGraphFactory 完整代码

**完成标准**：6 个问题均有明确答案或明确标注"未找到/不存在"（含具体原因），证据可追溯到具体 jar 类名/方法签名或文件路径+行号。

**执行模型**：`deepseek/deepseek-v4-pro`（需理解 Spring AI ChatMemory/Advisor 语义与 LangGraph4j AgentState 的会话历史注入兼容性，属语义判断类调研，用 pro）

**失败处理**：
- 若 Spring AI 1.0.4 无 ChatMemory/Advisor 层（jar 不存在），明确标注，规划层将改为纯手工历史消息注入（从 DB 加载 → 构造 `List<Message>` → 手动注入 invoke 入参）
- 若 `CompiledGraph.invoke()` 不支持传入初始 messages（LangGraph4j 始终从空消息列表开始），如实说明，规划层将评估是否在 callModel 节点内从 ThreadLocal 读取历史消息
- 若 BPM 先例表结构与预期差异较大，如实呈现，不要强行匹配

**回执位置**：`search_fallback/m07-f04-conversation-precedent.md`
