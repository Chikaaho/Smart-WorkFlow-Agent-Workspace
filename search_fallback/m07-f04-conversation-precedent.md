# 探索回执：M07-F04「对话交互」前置调研

**执行模型**：deepseek-v4-flash（本会话实际执行）
**执行日期**：2026-08-09
**任务来源**：`search_task/m07-f04-conversation-precedent.md`
**只读确认**：本任务未修改/创建/删除仓库内任何文件；未运行任何 mvn 命令；仅使用 `jar tf`、`javap`、`find`、`grep`、文件读取。唯一写入为本回执文件。
**任务状态**：✅ 6 问均有明确答案，证据全部为本次实际探查的 jar 类名/方法签名（javap 原始输出）或仓库文件路径+行号/代码摘录，无训练记忆补填。
**关键"不存在"标注**：m2 仓库中**不存在独立的 `spring-ai-advisors-*.jar`**（Advisor 类全部内嵌于 `spring-ai-client-chat-1.0.4.jar`，见 §1）；LangGraph4j 1.5.14 的 `AgentState` 基类**无 `messages()` 方法**（仅 `MessagesState` 子类有，见 §2）；**BPM 历史/流转记录表不存在**——全仓库无 `sw_bpm_flow_trace`/`sw_bpm_history` 等任何 sw_bpm_* 历史表（grep 全量枚举仅 6 张 sw_bpm_ 表，见 §3）；`AgentGraphFactory` 图中**不存在 messages 通道**（channels 仅 input/output/chatModel，见 §2、§6）；Flyway **V21/V22/V23 全局均未被占用**（见 §4）。

---

## 问题 1：Spring AI 1.0.4 ChatMemory/Advisor API 全貌

**jar 路径**：`~/.m2/repository/org/springframework/ai/`（全量 23 个 jar）

### 1.1 Advisor 所在位置：不存在独立 advisors jar

`find ~/.m2/repository/org/springframework/ai/ -name "*.jar" | sort` 全量 23 个 jar 中**不存在独立的 `spring-ai-advisors-*.jar`**；Advisor 类全部内嵌于 `spring-ai-client-chat-1.0.4.jar`。另有 `spring-ai-autoconfigure-model-chat-memory-1.0.4.jar`（仅含 `ChatMemoryAutoConfiguration`）。

### 1.2 ChatMemory 接口（spring-ai-model-1.0.4.jar，`org/springframework/ai/chat/memory/` 包）

包内含：`ChatMemory`、`ChatMemoryRepository`、`MessageWindowChatMemory`、`InMemoryChatMemoryRepository`。

`javap -p ChatMemory` 原始输出：

```
public interface org.springframework.ai.chat.memory.ChatMemory {
  public static final java.lang.String DEFAULT_CONVERSATION_ID;
  public static final java.lang.String CONVERSATION_ID;
  public default void add(java.lang.String, org.springframework.ai.chat.messages.Message);
  public abstract void add(java.lang.String, java.util.List<org.springframework.ai.chat.messages.Message>);
  public abstract java.util.List<org.springframework.ai.chat.messages.Message> get(java.lang.String);
  public abstract void clear(java.lang.String);
}
```

（第一个参数即会话 ID → 历史消息读写，这是 DB 持久化的挂载点）

`javap -p ChatMemoryRepository` 原始输出：

```
public interface org.springframework.ai.chat.memory.ChatMemoryRepository {
  public abstract java.util.List<java.lang.String> findConversationIds();
  public abstract java.util.List<org.springframework.ai.chat.messages.Message> findByConversationId(java.lang.String);
  public abstract void saveAll(java.lang.String, java.util.List<org.springframework.ai.chat.messages.Message>);
  public abstract void deleteByConversationId(java.lang.String);
}
```

- `MessageWindowChatMemory`：final 类，私有构造 `(ChatMemoryRepository, int)`，public static `builder()`，`add/get/clear` 实现窗口裁剪；`InMemoryChatMemoryRepository`：public 无参构造，内部 `Map<String, List<Message>>`。

### 1.3 MessageChatMemoryAdvisor（spring-ai-client-chat jar，`org.springframework.ai.chat.client.advisor` 包）

- implements `BaseChatMemoryAdvisor`；`public static MessageChatMemoryAdvisor$Builder builder(ChatMemory)`；Builder 方法 `conversationId(String)` / `order(int)` / `scheduler(Scheduler)` / `build()`（chatMemory 是唯一必填依赖）。
- 同包还有其他 Advisor：`PromptChatMemoryAdvisor`（builder(ChatMemory)，带默认 System prompt 模板）、`SimpleLoggerAdvisor`、`SafeGuardAdvisor`、`ChatModelCallAdvisor`、`ChatModelStreamAdvisor`、`api/BaseChatMemoryAdvisor`。

### 1.4 ChatClient 接口与 Builder

`javap -p ChatClient` 原始输出（静态工厂/入口）：

```
public static org.springframework.ai.chat.client.ChatClient create(org.springframework.ai.chat.model.ChatModel);
public static org.springframework.ai.chat.client.ChatClient create(ChatModel, ObservationRegistry);
public static org.springframework.ai.chat.client.ChatClient create(ChatModel, ObservationRegistry, ChatClientObservationConvention);
public static org.springframework.ai.chat.client.ChatClient$Builder builder(org.springframework.ai.chat.model.ChatModel);
public static org.springframework.ai.chat.client.ChatClient$Builder builder(ChatModel, ObservationRegistry, ChatClientObservationConvention);
public abstract ChatClientRequestSpec prompt();
public abstract ChatClientRequestSpec prompt(String);
public abstract ChatClientRequestSpec prompt(org.springframework.ai.chat.prompt.Prompt);
public abstract ChatClient$Builder mutate();
```

- `ChatClient$Builder`：`defaultAdvisors(Advisor...)` / `defaultAdvisors(Consumer<AdvisorSpec>)` / `defaultAdvisors(List<Advisor>)` / `defaultToolCallbacks(...)` / `build()`。
- `ChatClient$ChatClientRequestSpec`（运行时逐请求）：`advisors(Advisor...)`、`advisors(List<Advisor>)`、`messages(Message...)`、`messages(List<Message>)`、`call()`、`stream()`；`AdvisorSpec` 有 `param(String,Object)` / `params(Map)`。
- `DefaultChatClientBuilder`：`public DefaultChatClientBuilder(ChatModel, ObservationRegistry, ChatClientObservationConvention)`（public）+ 包私有 `(ChatModel)` 构造。
- `ChatMemoryAutoConfiguration`（autoconfigure 包）：包私有方法 `chatMemoryRepository()` 与 `chatMemory(ChatMemoryRepository)` 两个 bean 方法（即自动装配默认 InMemory 存储 + MessageWindowChatMemory，但**不是必需**）。

### 1.5 架构事实（字节码层面）

`ChatClient.builder(ChatModel)` / `create(ChatModel)` 是静态工厂，直接接受运行时动态 ChatModel 实例 → 可在 ServiceImpl 内手工构造 ChatClient + MessageChatMemoryAdvisor，**不依赖 Spring AutoConfiguration**（观察器参数可用默认实例，构造器 public 为证）。Advisor 拦截的是 ChatClient 请求链（before/after 作用于 ChatClientRequest/ChatClientResponse），**对裸 `ChatModel.call(Prompt)` 不生效**——这是字节码层面可确认的架构事实。

---

## 问题 2：LangGraph4j 1.5.14 多轮历史消息注入机制

**jar 路径**：`~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar`

### 2.1 CompiledGraph invoke 与 AgentState

`javap -p CompiledGraph` 的 invoke 重载（原文）：

```
public java.util.Optional<State> invoke(java.util.Map<java.lang.String, java.lang.Object>, org.bsc.langgraph4j.RunnableConfig);
public java.util.Optional<State> invoke(java.util.Map<java.lang.String, java.lang.Object>);
```

→ 初始状态就是 `Map<String,Object>`。

`javap -p AgentState`：只包一层 `Map<String,Object> data`，`data()` 与 `value(String)→Optional<T>` / `value(String, T)` / `value(String, Supplier<T>)`；**基类无 messages() 方法**。

### 2.2 MessagesState（jar 中真实存在）

`org.bsc.langgraph4j.prebuilt.MessagesState<T> extends AgentState`：

```
public static final java.util.Map<java.lang.String, org.bsc.langgraph4j.state.Channel<?>> SCHEMA;
public org.bsc.langgraph4j.prebuilt.MessagesState(java.util.Map<java.lang.String, java.lang.Object>);
public java.util.List<T> messages();
public java.util.Optional<T> lastMessage();
public java.util.Optional<T> lastMinus(int);
```

SCHEMA 字节码：`Map.of("messages", Channels.appender(Supplier))`；bootstrap 方法确认默认 supplier 是 **`ArrayList::new`**（`REF_newInvokeSpecial java/util/ArrayList."<init>"`，任务猜测的 LinkedList 在 1.5.14 中不成立）。

### 2.3 AppenderChannel 语义（append-only）

`Channels.appender(Supplier)` 字节码：构造 `AppenderChannel(ReducerDisallowDuplicate, supplier)`；`appenderWithDuplicate` → ReducerAllowDuplicate。`AppenderChannel.update` 字节码：new 值为空则返回旧值；ReducerDisallowDuplicate.apply 字节码为「遍历新值，逐个 add() 进旧列表（Objects.hash 去重，已存在则跳过）」→ **append-only 语义**：已有列表保留，新消息追加在尾部。

### 2.4 初始消息注入可行性的既有实证（Step2 工作代码）

`AgentOrchestrationServiceImpl` 第 104-105 行 `agentCompiledGraph.invoke(Map.of("input", req.getInput(), "chatModel", chatModel))`，而 callModel 节点内 `state.value("chatModel")` 能读到该值（AgentGraphFactory 第 116-117 行）→ 证明 invoke 入参 map 的值直接进入节点可见的 state，不经过 channel reducer 重建。同一机制下，若初始 map 含 `messages` key，节点内同样可见。

### 2.5 当前仓库图的现状（关键事实）

`AgentGraphFactory.buildGraph()`（第 89-99 行）channels 只有 `input` / `output`（`Channels.base(() -> "")`）+ `chatModel`（last-wins reducer）；**图中不存在 messages 通道**。callModel（第 115-136 行）从 state 取 `chatModel` 与 `input` 字符串，直接 `new Prompt(input)`（无工具时，第 131 行）或 `new Prompt(input, ToolCallingChatOptions)`（第 129 行），**不是从 messages 列表构造 Prompt**。

---

## 问题 3：BPM / 通知多记录持久化先例

### 3.1 定位修正：建表脚本不在 sw-bootstrap

BPM 与 notify 的建表脚本**不在 sw-bootstrap**，而在各自模块：

- `sw-biz/sw-bpm/sw-bpm-process/src/main/resources/db/migration/bpm/{h2,postgresql}/V8__init_bpm_metadata.sql`（sw_bpm_form_binding + sw_bpm_instance）
- `sw-biz/sw-bpm/sw-bpm-process/src/main/resources/db/migration/bpm/{h2,postgresql}/V14__add_process_def.sql`（sw_bpm_process_def）
- `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/resources/db/migration/notify/{h2,postgresql}/V9__init_notify_message.sql`

### 3.2 sw_bpm_instance 完整 CREATE TABLE（V8 h2 第 37-56 行，原文摘录）

```sql
create table sw_bpm_instance (
    id                   bigint          not null primary key,
    create_time          timestamp       not null default current_timestamp,
    create_by            bigint,
    update_time          timestamp       not null default current_timestamp,
    update_by            bigint,
    deleted              smallint        not null default 0,
    tenant_id            bigint          not null default 0,
    version              bigint          not null default 0,
    process_instance_id  varchar(64)     not null,
    process_def_key      varchar(200)    not null,
    business_key         varchar(36)     not null,
    form_key             varchar(200)    not null,
    initiator_id         bigint          not null,
    status               varchar(20)     not null default 'RUNNING'
);
create index idx_sw_bpm_inst_process_inst on sw_bpm_instance (process_instance_id);
create index idx_sw_bpm_inst_business_key on sw_bpm_instance (business_key);
create index idx_sw_bpm_inst_tenant_status on sw_bpm_instance (tenant_id, status);
```

（脚本头注释声明约定：8 基列、bigint ASSIGN_ID 雪花、无真实 DB 外键、全归 Flyway 管理）

### 3.3 sw_notify_message 完整 CREATE TABLE（notify V9 h2 第 17-35 行，原文摘录）

```sql
create table sw_notify_message (
    id                bigint          not null primary key,
    create_time       timestamp       not null default current_timestamp,
    create_by         bigint,
    update_time       timestamp       not null default current_timestamp,
    update_by         bigint,
    deleted           smallint        not null default 0,
    tenant_id         bigint          not null default 0,
    version           bigint          not null default 0,
    recipient_id      bigint          not null,
    title             varchar(200)    not null,
    content           text            not null,
    biz_type          varchar(30)     not null,
    biz_id            varchar(64),
    is_read           boolean         not null default false
);
create index idx_sw_notify_msg_recipient on sw_notify_message (tenant_id, recipient_id);
```

（注意：content 用 text 而非 clob）

### 3.4 BPM 历史/流转记录表：**不存在**

全仓库（含 worktrees、target）无 `sw_bpm_flow_trace`/`sw_bpm_history`/任何 sw_bpm_* 历史表（grep 全量枚举 sw_bpm_ 表仅 6 张：ext_datasource、ext_sql_execution_audit、form_binding、instance、process_def、proc_def_form——后两个为索引/视图别名）。原因事实：BPM 引擎走 Flowable 7.1.0（`sw-biz/sw-bpm/sw-bpm-engine/pom.xml:49-50` 依赖 flowable-spring-boot-starter-process；`sw-dependencies/pom.xml:32` flowable.version=7.1.0；`application.yml:75-77` `flowable.database-schema-update: true`），历史数据在 Flowable 自管 ACT_* 表中，不落 Flyway 管理。

### 3.5 字段惯例汇总（供 F04 参照）

PK=bigint；时序字段=timestamp（非 datetime）；状态=**varchar**（如 status varchar(20)）；大文本=BPM 用 text / V20 agent 用 clob；8 基列含 tenant_id(bigint)、deleted(smallint)、version(bigint)；create_by 在 BPM/notify 为 **bigint**，但 agent 模块 V19/V20 为 **varchar(64)**（agent 模块偏离 8 基列惯例，含 create_time 无默认值）。

---

## 问题 4：Flyway V21+ 槽位

### 4.1 agent 路径版本占用

`sw-bootstrap/src/main/resources/db/migration/agent/` 下仅 h2/postgresql 各 2 个文件：`V19__init_agent_model_config.sql`、`V20__init_agent_tool_config.sql` → agent 路径内 V21 起空闲。

### 4.2 全局版本审计

对 sw-bootstrap/sw-biz/sw-basic 全部 migration 路径（排除 target/ 与 .claude/worktrees）执行 `sed -E 's/.*\/(V[0-9]+)__.*/\1/'` 统计：**V1-V20 每个恰好出现 2 次**（h2+pg 双写），**V21/V22/V23 全局均未被占用**（Flyway 单张 flyway_schema_history 表、out-of-order: false，版本号须全局唯一）。

### 4.3 application.yml flyway 配置（第 51-64 行，原文）

locations 列表依次 `classpath:db/migration/{vendor}`、`bpm/{vendor}`、`notify/{vendor}`、`form/{vendor}`、`storage/{vendor}`、`job/{vendor}`、`agent/{vendor}` —— **agent/{vendor} 在第 60 行，确认在列**；baseline-on-migrate: true；validate-on-migrate: true；out-of-order: false；table: flyway_schema_history。

### 4.4 V20/V19 脚本要点（agent 模块惯例）

- V20 h2 完整脚本（agent/h2/V20__init_agent_tool_config.sql，47 行）：脚本头注明「input_schema（JSON Schema 字符串，可能较长）：H2 用 CLOB（参照 V19 api_key_cipher 惯例）」；建两张表 `sw_agent_tool_internal`（id BIGINT PK, name VARCHAR(100) NOT NULL, description VARCHAR(500) NOT NULL, input_schema CLOB, bean_name VARCHAR(100) NOT NULL, method_name VARCHAR(100) NOT NULL, enabled SMALLINT DEFAULT 1, remark VARCHAR(500), create_time TIMESTAMP, create_by VARCHAR(64), update_time TIMESTAMP, update_by VARCHAR(64), deleted SMALLINT DEFAULT 0, tenant_id BIGINT DEFAULT 0, version BIGINT DEFAULT 0）与 `sw_agent_tool_external`（同构，url VARCHAR(500) NOT NULL, http_method VARCHAR(10) DEFAULT 'POST', timeout_seconds INT DEFAULT 30 替代 bean/method 列）；两条索引 idx_sw_agent_tool_internal_tenant_deleted / idx_sw_agent_tool_external_tenant_deleted。
- V19 h2（agent/h2/V19__init_agent_model_config.sql）：`api_key_cipher CLOB`（第 11 行），表 sw_agent_model_config，唯一索引 uk_sw_agent_model_name(tenant_id, name)。

---

## 问题 5：V20 JSON 字段类型惯例（H2 vs PG）

### 5.1 类型对照

- H2 版 `input_schema CLOB`（V20 h2 第 12、30 行）；PG 版 `input_schema TEXT`（V20 pg 第 12、30 行）。**H2=CLOB / PG=TEXT 模式成立**，且脚本注释明确「参照 V19 api_key_cipher 惯例」（V19 h2 api_key_cipher 亦为 CLOB）。

### 5.2 附带差异

PG 版另有 COMMENT ON TABLE/COLUMN 语句（第 48-56 行），H2 版无（H2 不支持 COMMENT ON，V8 脚本头注明）。

---

## 问题 6：AgentOrchestrationServiceImpl 当前实现结构

**文件**：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java`（157 行）+ `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java`（167 行）。

### 6.1 run(AgentOrchestrationRunReqDTO) 流程（行号依据）

手动校验（71-76）→ `mapper.selectById(configId)`（78，租户拦截器过滤）→ AES 解密 plainApiKey（84-87）→ `chatModelFactory.build(entity, plainApiKey)`（92）→ 工具白名单加载（96-98，工厂未注入则 List.of()）→ **ThreadLocal bind**：`AgentGraphFactory.bindChatModel(chatModel)`（99）、非空时 `bindTools(tools)`（101）→ **创建初始 state map 并执行图**：`agentCompiledGraph.invoke(Map.of("input", req.getInput(), "chatModel", chatModel))`（104-105）→ 结果处理：`result.get().value("output")`（111）→ `resp.setOutput(String.valueOf(output.get()))`（117）→ finally 中 `clearChatModel()` + `clearTools()`（122-123）→ catch IllegalArgumentException/Exception 均转 success=false + summarizeError（125-132，沿 cause 链取最深层 message）→ `resp.setLatencyMs(...)`（136）。

注意：**当前实现无任何 messages 构造/持久化代码**——输入只有 req.getInput() 字符串。

### 6.2 AgentGraphFactory.callModel（第 115-136 行，完整逻辑）

`state.value("chatModel")` + `state.value("input")` → 若 ThreadLocal 绑定了工具则 `new Prompt(input, ToolCallingChatOptions.builder().toolCallbacks(tools).build())`，否则 `new Prompt(input)` → `chatModel.call(prompt)`（第 133 行）→ **回复提取链**：`response.getResult().getOutput().getText()`（第 134 行，ChatResponse→Generation(AssistantMessage)→getText()）→ `return Map.of("output", output)`。

### 6.3 buildGraph()（第 89-99 行）

channels = Map.of("input", base(() -> ""), "output", base(() -> ""), "chatModel", base(last-wins))；`new StateGraph<>(channels, new SparseStateSerializer())`；addNode("callModel", ...)；START→callModel→END；compile()。

### 6.4 SparseStateSerializer（第 143-166 行）

write 只序列化 input/output（跳过 chatModel）；read 从 `CHAT_MODEL_BINDING.get()` 重新挂载 chatModel；`TOOL_CALLBACKS_BINDING` 同样 ThreadLocal（第 62 行），read 时**不**回填 tools（工具只在节点内从 ThreadLocal 读取，第 120 行）。
