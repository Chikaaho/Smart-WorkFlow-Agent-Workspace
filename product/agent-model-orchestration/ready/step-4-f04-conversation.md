# Step 4 执行方案：F04 对话交互（多轮会话持久化）

**状态**：Ready — 待执行  
**前置**：Step3 PASSED（D59），基线 307 tests（D59，after-Step3）  
**范围依据**：M07-F04 对话交互——会话主表 + 消息明细 + 工具调用日志 + 多轮历史注入 + 持久化  
**前置调研**：`search_fallback/m07-f04-conversation-precedent.md`（证据完整，6 问全部有 jar 级/行号级答案）  
**推荐执行模型**：`deepseek/deepseek-v4-pro`（多层改造：DB + 实体层 + ThreadLocal wiring + ServiceImpl 持久化）  
**回执位置**：`product/agent-model-orchestration/receipts/step-4-{execution,test}.md`

---

## §1 背景与目标

Step1-3 交付了：模型管理（CRUD + 加密 + 连通性测试）、最小 LangGraph4j 编排引擎（单节点 callModel + 动态 ChatModel）、工具沙箱（内部方法 + 外部 HTTP，FunctionToolCallback + DB 白名单）。

但每次调用 `AgentOrchestrationServiceImpl.run()` 都是**无状态单轮**：
- `AgentOrchestrationRunReqDTO` 只有 `agentModelConfigId + input`，无 `sessionId`
- callModel 节点创建 `new Prompt(input)`，无历史消息
- 执行完毕后无任何持久化

Step4 落地 **F04 对话交互**：

1. **会话层**：用户首次调用自动创建 session（`sw_agent_session` 表），后续调用携带 `sessionId` 复用。
2. **消息持久化**：每轮 user 输入 + assistant 最终回复写入 `sw_agent_message` 表，带顺序号。
3. **工具调用日志**：本轮工具调用（工具名 + 入参 JSON + 返回 JSON + 耗时）写入 `sw_agent_tool_call_log` 表。
4. **历史注入**：invoke 前从 DB 加载历史消息，构造完整消息列表，注入 callModel 节点，LLM 获得多轮上下文。
5. **查询接口**：会话列表 + 会话下消息列表两个只读端点。

---

## §2 前置调研关键发现（方案依据）

以下结论来自 `search_fallback/m07-f04-conversation-precedent.md` 的 jar 级/行号级证据：

| 发现 | 影响 |
|---|---|
| `ChatMemory`/`ChatMemoryRepository`/`MessageChatMemoryAdvisor` 存在于 `spring-ai-model`/`spring-ai-client-chat` jar | Spring AI 有完整 Memory API，但本 Step **不采用**（见 §3 架构决策）|
| `MessageChatMemoryAdvisor` 拦截 ChatClient 请求链，**对裸 `chatModel.call(Prompt)` 不生效**（字节码层面确认）| callModel 节点继续使用 `chatModel.call()`；Advisor 路径不可用，不引入 ChatClient |
| `CompiledGraph.invoke(Map<String,Object>)` 已在 Step2 实证：传入 map 的值直接进节点 state | ThreadLocal messages 注入可行，与现有 chatModel/tools ThreadLocal 模式完全一致 |
| `AgentGraphFactory.callModel` 当前：`state.value("input")` → `new Prompt(input, options)` → `chatModel.call()` → getText()，**无历史消息** | callModel 节点需增加：从 ThreadLocal 读 historyMessages → 构造 `messages` 列表（history + new UserMessage）→ `new Prompt(messages, options)` |
| 当前图 channels 仅 input/output/chatModel，**无 messages 通道** | 不改图通道；历史消息经 ThreadLocal 传入节点，不走 channel（与 tools ThreadLocal 相同模式） |
| V21/V22/V23 全局空闲（全仓库 V1-V20 精确 2 次，V21+ 零占用）| 三表安全落地 |
| H2=CLOB / PG=TEXT（V19/V20 双重先例，V20 脚本注释明确）| tool_call_args / tool_call_result / message content 大字段：H2 CLOB，PG TEXT |
| agent 模块惯例：create_by=VARCHAR(64)，create_time=TIMESTAMP（无默认值），status=VARCHAR（非 tinyint）| V21/V22/V23 建表严格遵循 V19/V20 字段惯例 |
| BPM 无流转历史表（Flowable 管 ACT_*）；仅 `sw_bpm_instance`（status varchar(20)）+`sw_notify_message`（content text）可参照 | session status 用 VARCHAR(20)；消息 content 大字段对齐 |
| `AgentOrchestrationServiceImpl.run()` 第 99/101 行：ThreadLocal bind 模式，finally clear 对称 | F04 新增 historyMessages ThreadLocal 沿用同一 bind/clear 生命周期 |

---

## §3 范围裁定

### 本 Step 包含

1. **DB 迁移**：V21（sw_agent_session）+ V22（sw_agent_message）+ V23（sw_agent_tool_call_log），h2 + postgresql 各三个脚本
2. **实体 + Mapper**：三张表的 Entity + Mapper 接口（MyBatis 注解，不建 XML）
3. **AgentGraphFactory 改造**：
   - 新增 `HISTORY_MESSAGES_BINDING` ThreadLocal（类型 `List<Message>`）
   - 新增 `bindHistoryMessages(List<Message>)` / `clearHistoryMessages()` 静态方法
   - callModel 节点：读取 historyMessages ThreadLocal + input，构造完整消息列表，`new Prompt(messages, options)` 替代 `new Prompt(input, options)`
   - 新增 `TOOL_CALL_RECORDS_BINDING` ThreadLocal（类型 `List<ToolCallRecord>`）用于捕获工具调用日志
   - 内部工具/外部工具的 FunctionToolCallback lambda 包装：记录 toolName/args/result/latencyMs 到 ThreadLocal list
4. **AgentOrchestrationServiceImpl 改造**：
   - `AgentOrchestrationRunReqDTO` 新增 `sessionId`（Long，nullable = 新建会话）
   - `AgentOrchestrationRunRespDTO` 新增 `sessionId`（Long，返回本次使用的会话 ID）
   - run() 前：load-or-create session，加载历史 messages，bind historyMessages ThreadLocal
   - run() 后：persist user message + assistant message（自增 msgOrder）+ tool call log，clear ThreadLocal
5. **AgentConversationService + 查询端点**：
   - `GET /agent/conversations?agentModelConfigId=` → 当前用户的会话列表
   - `GET /agent/conversations/{sessionId}/messages` → 会话内消息列表（按 msg_order 升序）
6. **测试**：新增单测覆盖 session CRUD、消息持久化、多轮历史注入、工具调用日志

### 本 Step 不包含

- ChatClient / MessageChatMemoryAdvisor / ChatMemoryRepository：**不引入**（Advisor 对 chatModel.call() 路径无效，引入增加复杂度无收益）
- session title 自动生成（从第一条消息截取，后续迭代）
- session 删除 / 归档 / 状态流转管理端点（ACTIVE 写死，会话永久有效）
- 前端页面（会话列表 / 历史消息展示，M07 前端留后续批次）
- `MessageWindowChatMemory` 窗口截断（历史消息全量加载，窗口裁剪作为性能优化留后续）
- RAG 检索注入（D49 推迟，不阻塞）

---

## §4 架构决策

### A. 历史消息注入：ThreadLocal 模式（不走 ChatClient/Advisor）

callModel 节点目前从 `CHAT_MODEL_BINDING` 和 `TOOL_CALLBACKS_BINDING` 两个 ThreadLocal 读取依赖，不依赖 Spring 上下文。F04 新增第三个 ThreadLocal：

```
HISTORY_MESSAGES_BINDING: ThreadLocal<List<Message>>
```

ServiceImpl 在 invoke 前 bind，callModel 节点读取，finally clear，生命周期与 chatModel ThreadLocal 完全对称。

callModel 节点消息构造逻辑（伪代码，仅用于方案说明，执行层按 javap 实测 API 实现）：

```
List<Message> history = AgentGraphFactory.HISTORY_MESSAGES_BINDING.get()
List<Message> messages = new ArrayList<>()
if (history != null) messages.addAll(history)
messages.add(new UserMessage(input))
Prompt prompt = tools.isEmpty()
    ? new Prompt(messages)
    : new Prompt(messages, ToolCallingChatOptions.builder().toolCallbacks(tools).build())
ChatResponse response = chatModel.call(prompt)
```

注意：**`Prompt(List<Message>)` 构造函数签名须执行层用 `javap -p` 确认**，见 §5 现场验证 V1。

### B. 工具调用日志捕获：FunctionToolCallback lambda 包装

Step3 在 AgentGraphFactory 中，内部工具和外部工具分别构造 `FunctionToolCallback.builder(name, Function<Input, String>).build()`。Step4 将每个 Function lambda 包装为计时版本：

```
// 包装 lambda（伪代码，仅方案描述）
Function<I, String> loggingWrapper = (input) -> {
    long start = System.currentTimeMillis()
    String args = serializeToJson(input)
    String result = originalFunction.apply(input)
    long latency = System.currentTimeMillis() - start
    TOOL_CALL_RECORDS_BINDING.get().add(new ToolCallRecord(toolName, args, result, latency))
    return result
}
```

`ToolCallRecord` 为仅含 4 字段的轻量 POJO（toolName/args/result/latencyMs），不入库，仅作 ThreadLocal 传递载体。

ServiceImpl 在 invoke 后读 TOOL_CALL_RECORDS_BINDING，批量 insert sw_agent_tool_call_log。

### C. session 创建 / 历史加载时序

```
run(req):
  1. sessionId = req.getSessionId()
  2. if sessionId == null:
       session = createSession(agentModelConfigId, tenantId, userId)
       sessionId = session.getId()
  3. historyMessages = loadMessagesFromDb(sessionId)  // List<Message>，按 msg_order 升序
  4. HISTORY_MESSAGES_BINDING.set(historyMessages)
  5. TOOL_CALL_RECORDS_BINDING.set(new ArrayList<>())
  6. [现有 bind chatModel + tools 逻辑]
  7. result = agentCompiledGraph.invoke(Map.of("input", req.getInput(), "chatModel", chatModel))
  8. output = result.get().value("output").orElse("")
  9. nextMsgOrder = historyMessages.size()  // 已有消息数作为下标
 10. persistMessage(sessionId, "USER", input, nextMsgOrder, userId, tenantId)
 11. persistMessage(sessionId, "ASSISTANT", output, nextMsgOrder + 1, userId, tenantId)
 12. persistToolCallLogs(sessionId, TOOL_CALL_RECORDS_BINDING.get(), userId, tenantId)
 13. resp.setSessionId(sessionId)
 finally:
  14. HISTORY_MESSAGES_BINDING.remove()
  15. TOOL_CALL_RECORDS_BINDING.remove()
  16. [现有 clear chatModel + tools 逻辑]
```

---

## §5 现场验证要求（禁止凑造，必须 javap/grep/读取文件实证）

| # | 验证项 | 方法 | 若不存在则 |
|---|---|---|---|
| V1 | `Prompt(List<Message>)` 和 `Prompt(List<Message>, ChatOptions)` 构造函数是否存在（`org.springframework.ai.chat.prompt.Prompt`） | `javap -p ~/.m2/repository/org/springframework/ai/spring-ai-model/1.0.4/spring-ai-model-1.0.4.jar` 解压后 Prompt.class javap，列出所有构造器 | 若只有 `Prompt(String)` 构造器，则改为 `new Prompt(UserMessage + history 转 SystemMessage)` 变通，必须如实记录 |
| V2 | `org.springframework.ai.chat.messages.UserMessage` / `AssistantMessage` 可用构造函数签名 | `javap -p UserMessage`（位于 `spring-ai-model-1.0.4.jar`） | N/A，标注实际存在的 Message 子类 |
| V3 | `AgentMessageMapper.selectBySessionId` 查询——确认 MyBatis 注解方式（`@Select`）在 agent 模块已有先例还是必须用 XML | `grep -r "@Select\|@Insert" Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/` 确认注解使用情况 | 若无注解先例则改用 XML mapper |
| V4 | `AgentToolCallbackFactory.java` 构造 FunctionToolCallback 的 lambda 类型——确认 `Function<String, String>` 还是 `Function<Object, String>` | 读取 `AgentToolCallbackFactory.java` 对应行，确认 FunctionToolCallback.builder 泛型 | 执行层现场 javap 确认 FunctionToolCallback builder 泛型 |
| V5 | `SparseStateSerializer.read()` 是否会在会话恢复时读取 HISTORY_MESSAGES_BINDING（当前 read 方法只恢复 chatModel，不恢复 tools）——确认 graph resume 路径不会覆盖 historyMessages | 读取 `AgentGraphFactory.java` 的 `SparseStateSerializer` 内部类 read 方法（§6.4 已有摘录，第 143-166 行）| 若 read 会清空 historyMessages，则在 read 方法中不 remove（ThreadLocal 生命周期已在 ServiceImpl finally 管理） |

---

## §6 新建文件清单

### 数据库迁移（6 文件）

```
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/
  h2/
    V21__init_agent_session.sql
    V22__init_agent_message.sql
    V23__init_agent_tool_call_log.sql
  postgresql/
    V21__init_agent_session.sql
    V22__init_agent_message.sql
    V23__init_agent_tool_call_log.sql
```

### 实体（3 文件）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  entity/
    AgentSession.java
    AgentMessage.java
    AgentToolCallLog.java
```

### Mapper 接口（3 文件，MyBatis 注解）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  mapper/
    AgentSessionMapper.java
    AgentMessageMapper.java
    AgentToolCallLogMapper.java
```

### 内部辅助类（1 文件）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  orchestration/
    ToolCallRecord.java   （轻量 POJO：toolName/args/result/latencyMs，不入库）
```

### DTO（2 新增字段，在现有文件改造，不新建文件）

```
改造：AgentOrchestrationRunReqDTO.java  （+sessionId Long nullable）
改造：AgentOrchestrationRunRespDTO.java （+sessionId Long）
```

### 会话查询服务 + 端点（3 文件）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  service/
    AgentConversationService.java           （接口）
  service/impl/
    AgentConversationServiceImpl.java       （实现：会话列表 + 消息查询，无 run 逻辑）
  controller/
    AgentConversationController.java        （GET /agent/conversations, GET /agent/conversations/{id}/messages）
```

### 改造文件（2 文件）

```
改造：AgentGraphFactory.java              （+HISTORY_MESSAGES_BINDING + TOOL_CALL_RECORDS_BINDING + callModel 变更）
改造：AgentOrchestrationServiceImpl.java  （+session 管理 + 历史注入 + 持久化）
```

**合计：新建 16 文件（6 SQL + 3 Entity + 3 Mapper + 1 POJO + 3 Service/Controller）；改造 4 文件（2 DTO + 2 核心类）**

---

## §7 DB 方案

### §7.1 脚本公共约定（严格对齐 V19/V20 intra-module 惯例）

- PK：`id BIGINT NOT NULL PRIMARY KEY`（雪花 ID，由 Java 层生成）
- 时序：`create_time TIMESTAMP NOT NULL`（**无 DEFAULT**，由 Java 显式赋值，对齐 V20 惯例）
- 创建人：`create_by VARCHAR(64)`（不是 bigint，agent 模块偏离 8 基列，V19/V20 一致）
- 更新：`update_time TIMESTAMP`、`update_by VARCHAR(64)`
- 软删：`deleted SMALLINT NOT NULL DEFAULT 0`
- 租户：`tenant_id BIGINT NOT NULL DEFAULT 0`
- 版本：`version BIGINT NOT NULL DEFAULT 0`
- 大文本：H2 用 CLOB，PG 用 TEXT（V20 双重先例）
- PG 版另加 `COMMENT ON TABLE/COLUMN`（V8 注明：H2 不支持）

### §7.2 V21 — sw_agent_session（H2 示例，PG 同构 + COMMENT）

```sql
-- sw_agent_session：Agent 会话主表
-- PK = 雪花 ID（Java 层生成）；status varchar(20) 对齐 sw_bpm_instance 惯例
create table sw_agent_session (
    id                   bigint          not null primary key,
    agent_model_config_id bigint         not null,
    title                varchar(500),
    status               varchar(20)     not null default 'ACTIVE',
    create_time          timestamp       not null,
    create_by            varchar(64),
    update_time          timestamp,
    update_by            varchar(64),
    deleted              smallint        not null default 0,
    tenant_id            bigint          not null default 0,
    version              bigint          not null default 0
);
create index idx_sw_agent_session_user on sw_agent_session (tenant_id, create_by, deleted);
create index idx_sw_agent_session_cfg  on sw_agent_session (agent_model_config_id, deleted);
```

### §7.3 V22 — sw_agent_message（H2 示例）

```sql
-- sw_agent_message：会话消息明细表
-- role：'USER' / 'ASSISTANT' / 'SYSTEM'
-- msg_order：本会话内消息顺序号（0-based，写入时由 Java 计算）
-- content：大文本（JSON 消息体或纯文本），H2=CLOB / PG=TEXT
create table sw_agent_message (
    id          bigint      not null primary key,
    session_id  bigint      not null,
    role        varchar(20) not null,
    content     clob        not null,
    msg_order   int         not null,
    create_time timestamp   not null,
    create_by   varchar(64),
    update_time timestamp,
    update_by   varchar(64),
    deleted     smallint    not null default 0,
    tenant_id   bigint      not null default 0,
    version     bigint      not null default 0
);
create index idx_sw_agent_msg_session on sw_agent_message (session_id, msg_order, deleted);
```

### §7.4 V23 — sw_agent_tool_call_log（H2 示例）

```sql
-- sw_agent_tool_call_log：工具调用日志
-- tool_call_args / tool_call_result：JSON 字符串，可能较长，H2=CLOB / PG=TEXT
create table sw_agent_tool_call_log (
    id               bigint      not null primary key,
    session_id       bigint      not null,
    tool_name        varchar(100) not null,
    tool_call_args   clob,
    tool_call_result clob,
    latency_ms       bigint,
    create_time      timestamp   not null,
    create_by        varchar(64),
    update_time      timestamp,
    update_by        varchar(64),
    deleted          smallint    not null default 0,
    tenant_id        bigint      not null default 0,
    version          bigint      not null default 0
);
create index idx_sw_agent_tcl_session on sw_agent_tool_call_log (session_id, deleted);
```

---

## §8 AgentGraphFactory 改造要点

### §8.1 新增 ThreadLocal 字段

```java
// 与 CHAT_MODEL_BINDING / TOOL_CALLBACKS_BINDING 对称
static final ThreadLocal<List<Message>> HISTORY_MESSAGES_BINDING = new ThreadLocal<>();
static final ThreadLocal<List<ToolCallRecord>> TOOL_CALL_RECORDS_BINDING = new ThreadLocal<>();

public static void bindHistoryMessages(List<Message> messages) { HISTORY_MESSAGES_BINDING.set(messages); }
public static void clearHistoryMessages() { HISTORY_MESSAGES_BINDING.remove(); }
public static void bindToolCallRecords(List<ToolCallRecord> records) { TOOL_CALL_RECORDS_BINDING.set(records); }
public static void clearToolCallRecords() { TOOL_CALL_RECORDS_BINDING.remove(); }
```

### §8.2 callModel 节点消息构造（核心变更）

原逻辑（伪代码摘要）：
```java
String input = state.value("input", () -> "");
// ... build prompt with or without tools
new Prompt(input)  or  new Prompt(input, options)
```

新逻辑：
```java
String input = state.value("input", () -> "");
List<Message> history = HISTORY_MESSAGES_BINDING.get();
List<Message> messages = new ArrayList<>();
if (history != null) messages.addAll(history);
messages.add(new UserMessage(input));   // 类名须 V2 spike 确认
Prompt prompt = tools.isEmpty()
    ? new Prompt(messages)              // 构造函数须 V1 spike 确认
    : new Prompt(messages, ToolCallingChatOptions.builder().toolCallbacks(tools).build());
ChatResponse response = chatModel.call(prompt);
// getText() 提取路径不变
```

### §8.3 工具 lambda 包装（内部工具和外部工具共用模板）

在 `AgentToolCallbackFactory`（Step3 实现）的 `buildCallback(tool)` 方法内，将原始 Function lambda 包装为日志包装版本，调用前后记录 `ToolCallRecord` 到 `TOOL_CALL_RECORDS_BINDING`。执行层须确认 `TOOL_CALL_RECORDS_BINDING.get()` 非 null（ServiceImpl 在 invoke 前 set，AgentGraphFactory 在节点内读取）。

---

## §9 AgentOrchestrationServiceImpl 改造要点

### §9.1 依赖注入新增

```java
@Resource private AgentSessionMapper sessionMapper;
@Resource private AgentMessageMapper messageMapper;
@Resource private AgentToolCallLogMapper toolCallLogMapper;
```

### §9.2 run() 方法新增前置逻辑（在现有校验 + chatModel 构造之后）

```java
// session 获取或创建
Long sessionId = req.getSessionId();
if (sessionId == null) {
    AgentSession session = new AgentSession();
    session.setId(IdUtil.getSnowflakeNextId());   // 雪花 ID，同 Step1 用法
    session.setAgentModelConfigId(req.getAgentModelConfigId());
    session.setStatus("ACTIVE");
    session.setCreateTime(LocalDateTime.now());
    session.setCreateBy(/* SecurityUtil 当前用户 ID 字符串，同 V19/V20 create_by 取法 */);
    session.setTenantId(/* 同 Step1 租户拦截器 */);
    sessionMapper.insert(session);
    sessionId = session.getId();
}

// 历史消息加载
List<AgentMessage> dbMessages = messageMapper.selectBySessionId(sessionId);
List<Message> historyMessages = convertToSpringAiMessages(dbMessages);   // USER→UserMessage, ASSISTANT→AssistantMessage
AgentGraphFactory.bindHistoryMessages(historyMessages);
AgentGraphFactory.bindToolCallRecords(new ArrayList<>());
```

### §9.3 run() 方法新增后置逻辑（在 `resp.setOutput(output)` 之后，finally 之前）

```java
int nextOrder = dbMessages.size();    // 0-based 顺序号

AgentMessage userMsg = new AgentMessage();
userMsg.setId(IdUtil.getSnowflakeNextId());
userMsg.setSessionId(sessionId);
userMsg.setRole("USER");
userMsg.setContent(req.getInput());
userMsg.setMsgOrder(nextOrder);
userMsg.setCreateTime(LocalDateTime.now());
// ... create_by / tenant_id / deleted / version 同上
messageMapper.insert(userMsg);

AgentMessage assistantMsg = new AgentMessage();
// ... role="ASSISTANT", content=output, msgOrder=nextOrder+1
messageMapper.insert(assistantMsg);

List<ToolCallRecord> records = AgentToolCallbackFactory.getToolCallRecordsThreadLocal().get();
// 逐条 insert sw_agent_tool_call_log
for (ToolCallRecord r : records) { /* ... */ }

resp.setSessionId(sessionId);
```

### §9.4 finally 块新增

```java
AgentGraphFactory.clearHistoryMessages();
AgentGraphFactory.clearToolCallRecords();
```

---

## §10 查询端点

### §10.1 AgentConversationController

权限码沿用 `agent:model:view`（只读操作，不新增权限码，对齐 D51 三段拆分，查询不属于 manage 级别）。

```
GET  /agent/conversations?agentModelConfigId={id}
     → 返回当前租户 + 当前用户的会话列表（按 create_time DESC）
     → resp: List<{id, agentModelConfigId, title, status, createTime}>

GET  /agent/conversations/{sessionId}/messages
     → 返回该会话下所有消息（按 msg_order ASC，不分页，会话消息量通常有限）
     → resp: List<{id, role, content, msgOrder, createTime}>
     → 安全断言：session.tenantId == 当前租户（租户拦截器兜底）
```

---

## §11 测试要求

以下测试须全部通过，无凑造：

### §11.1 单测（JUnit + Mockito，新增目标 ~18 个）

| 测试类 | 测试方法（示例） | 要点 |
|---|---|---|
| `AgentSessionMapperTest` | `testInsertAndSelectById` | 雪花 ID 写入后可查回 |
| `AgentMessageMapperTest` | `testInsertAndSelectBySessionId` | msgOrder 排序正确，USER/ASSISTANT 角色 |
| `AgentToolCallLogMapperTest` | `testInsertAndSelectBySessionId` | CLOB 字段（>1KB JSON）写入后可读回 |
| `AgentOrchestrationServiceImplTest` | `testRunCreatesSessionWhenNoneProvided` | sessionId=null 时自动创建，resp.sessionId 非 null |
| `AgentOrchestrationServiceImplTest` | `testRunUsesExistingSession` | sessionId 已存在时不创建新 session |
| `AgentOrchestrationServiceImplTest` | `testRunPersistsUserAndAssistantMessages` | invoke 后 messageMapper.insert 被调用 2 次，role 分别为 USER/ASSISTANT |
| `AgentOrchestrationServiceImplTest` | `testRunClearsThreadLocalsInFinally` | 即使图 invoke 抛异常，historyMessages + toolCallRecords ThreadLocal 均被 remove |
| `AgentGraphFactoryTest` | `testCallModelWithHistory` | historyMessages ThreadLocal 非 null 时，callModel 构造的 Prompt 包含历史消息 |
| `AgentConversationControllerTest` | `testListConversations` | 200 + 列表结构 |
| `AgentConversationControllerTest` | `testGetMessages` | 200 + 按 msg_order 排序 |

### §11.2 全量回归

- 全量 `mvn test`（排除 `.claude/worktrees/`）不得 < 307（Step3 基线）
- 测试报告（surefire .txt 输出摘录）须附于 execution 回执 §8 或单独 test 回执

---

## §12 禁止范围

1. **禁止引入 `ChatClient` / `MessageChatMemoryAdvisor` / `ChatMemoryRepository`**：本 Step 不采用 Advisor 路径，不引入 Spring AutoConfiguration 感知的 Memory bean
2. **禁止修改图拓扑**（channels 数量/节点数）：仍保持 START→callModel→END 单节点
3. **禁止对 V19/V20 已有脚本做任何修改**：若发现冲突须上报，不得私改
4. **禁止新增业务功能性依赖**（MessageWindowChatMemory、ChatMemory 等 Spring AI 高阶 bean 若引入则违规）
5. **禁止会话写入未经 tenantId 隔离的数据**：sessionMapper / messageMapper 所有查询须带租户拦截器或显式 tenantId 条件
6. **禁止 `String.format` / `System.out.println` 调试残留**（参照 Step3 同款禁止）
7. **禁止在 §5 现场验证项上凑造**：V1（Prompt 构造器）/ V2（Message 子类）须 javap 确认后才能编写 callModel 代码；若 API 与方案伪代码不符，执行层须如实报告并采用实际 API

---

## §13 验收标准

| # | 验收项 | 验证方式 |
|---|---|---|
| 1 | V21/V22/V23 Flyway 迁移在 H2 和 PG 双模式下均无报错 | `mvn test` Spring 上下文启动（AgentAutoConfiguration 路径）|
| 2 | `AgentOrchestrationRunReqDTO.sessionId`=null 时，run() 自动创建 sw_agent_session 并在 resp 返回 sessionId | 单测 testRunCreatesSessionWhenNoneProvided |
| 3 | 使用已有 sessionId 调用 run()，不新建 session，消息追加到现有会话 | 单测 testRunUsesExistingSession + Mapper 查询验证 |
| 4 | 每轮 run() 后 sw_agent_message 增加 2 行（USER + ASSISTANT），role 字段精确，msg_order 单调递增 | 单测 testRunPersistsUserAndAssistantMessages |
| 5 | 有工具调用时，sw_agent_tool_call_log 增加对应行，tool_call_args/result 非空 | 单测（mock FunctionToolCallback 调用链）|
| 6 | callModel 节点：historyMessages ThreadLocal 非空时，ChatModel.call() 收到的 Prompt 包含历史 + 新 UserMessage | 单测 testCallModelWithHistory（断言 Prompt.getInstructions() size > 1）|
| 7 | callModel 节点：historyMessages ThreadLocal 为 null 时（首轮），行为与 Step3 完全一致（回退为 Prompt(input)）| 单测验证不报 NPE，输出正常 |
| 8 | 即使 graph invoke 抛异常，historyMessages + toolCallRecords ThreadLocal 均被 remove（无 ThreadLocal 泄漏）| 单测 testRunClearsThreadLocalsInFinally |
| 9 | `GET /agent/conversations` 返回 200，列表结构包含 sessionId / status / createTime | 单测 testListConversations |
| 10 | `GET /agent/conversations/{sessionId}/messages` 返回 200，消息按 msg_order ASC 排列 | 单测 testGetMessages |
| 11 | 跨租户隔离：租户 A 无法查询租户 B 的会话（租户拦截器）| Controller 单测，SecurityContext 设定不同租户 |
| 12 | 权限码 `agent:model:view` 未授权时 GET 端点返回 403 | Controller 单测（与 Step3 同款验证模式）|
| 13 | §5 现场验证五项均已在回执中给出 spike 结果（javap 原始输出或 grep 结果），不得空白 | 回执 §3 标注"现场验证结果" |
| 14 | 全量 `mvn test` ≥ 325 tests（307 基线 + 约 18 新增）0 failures 0 errors | surefire 报告摘录附于回执 §8 |

---

## §14 执行顺序

建议执行层按以下顺序实施，避免循环依赖：

1. **§5 V1/V2 spike**：javap 确认 `Prompt(List<Message>)` 构造器 + `UserMessage`/`AssistantMessage` 类名，再写任何 callModel 代码
2. **V21/V22/V23 SQL 脚本**（6 文件）→ 验证 Spring 上下文启动不报 Flyway 错误
3. **Entity + Mapper**（3+3 文件）→ Mapper 单测
4. **ToolCallRecord POJO**（1 文件）
5. **AgentGraphFactory 改造**：ThreadLocal 字段 + callModel 变更 + lambda 包装 → callModel 单测
6. **AgentOrchestrationServiceImpl 改造**：session 创建/加载 + bind/clear + 持久化 → ServiceImpl 单测
7. **DTO 改造**（AgentOrchestrationRunReqDTO / RespDTO）
8. **AgentConversationService + Controller**（查询端点）→ Controller 单测
9. **全量 `mvn test`**，确认 ≥ 325 tests 0 failures
10. **回执写入**：`product/agent-model-orchestration/receipts/step-4-execution.md` + `step-4-test.md`（或内嵌于 execution 回执 §8）
