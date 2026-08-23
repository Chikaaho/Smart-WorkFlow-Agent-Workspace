# Token 测试结构探索回执

## 探索结论

Agent 模块有 15 个测试文件间接涉及 Token/Usage 字段（均因 `chatResponse.getMetadata().getUsage()` 断言触发），但 **无一个测试以 Token 行为为独立测试目标**。现有测试仅把 Usage 当作 response 边缘断言（`assertThat(usage).isNotNull()`），不验证 token 值准确性、持久化写入或查询聚合。Token 专项行为测试需要全新编写。

---

## 一、Token 持久化涉及的关键生产代码

### 1.1 DB 层：agent_message 表 Token 字段

Flyway 迁移 `V35__agent_token_usage.sql`（postgresql / h2 双方言）新增 3 列：

```sql
ALTER TABLE agent_message ADD COLUMN input_tokens  BIGINT;
ALTER TABLE agent_message ADD COLUMN output_tokens BIGINT;
ALTER TABLE agent_message ADD COLUMN total_tokens  BIGINT;
```

- 文件：`sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V35__agent_token_usage.sql`
- H2 对应：`sw-bootstrap/src/main/resources/db/migration/agent/h2/V35__agent_token_usage.sql`

### 1.2 实体层：ChatMessage

- 文件：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/model/entity/ChatMessage.java`
- 字段：`private Long inputTokens`、`private Long outputTokens`、`private Long totalTokens`
- 表名：`@TableName("agent_message")`，继承 BaseEntity（含 tenantId、deleted 等）

### 1.3 Mapper 层：AgentMessageMapper

- 文件：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/mapper/AgentMessageMapper.java`
- 无 Mapper XML，使用 MyBatis-Plus 自动映射（字段名 → 列名约定）
- 无自定义 Token 相关 SQL

### 1.4 Service 写入 Token：AgentOrchestrationServiceImpl

```java
// 第 209-221 行：从 graph result 提取 usage
Long inputTokens = result.get().value("inputTokens");
Long outputTokens = result.get().value("outputTokens");
// → saveMessage(conversationId, role, content, model, inputTokens, outputTokens)

// 第 306-315 行：saveMessage 方法写入
msg.setInputTokens(inputTokens);
msg.setOutputTokens(outputTokens);
msg.setTotalTokens((inputTokens != null && outputTokens != null) ? inputTokens + outputTokens : null);
agentMessageMapper.insert(msg);
```

### 1.5 Usage 来源：Spring AI ChatResponse

- 类：`org.springframework.ai.chat.model.ChatResponse` → `chatResponse.getMetadata().getUsage()`
- 方法：`getGenerationTokens()` → 返回 `org.springframework.ai.chat.metadata.Usage`
- Usage 有 `getInputTokens()`、`getGenerationTokens()`（非 `getOutputTokens`！）、`getTotalTokens()`

### 1.6 各测试文件的 Token 相关度

| 测试文件 | Token 相关度 | 说明 |
|----------|:---:|------|
| `AgentOrchestrationServiceImplTest` | **高** | 含 3 个构造 mockResponse 方法（extractUsageFromResponse / extractUsageFromResponseInGraphMode / extractUsageFromEmptyMetadata），直接解析 `prompt_tokens/completion_tokens/total_tokens` JSON |
| `AgentToolConfigServiceImplTest` | 中 | mockResponseWithUsage() 与 extraction 类似，responseBody 含 usage JSON |
| `AgentGraphExecutionServiceImplTest` | 低 | 仅 in`System.out.println("Usage: " + usage)` 无断言 |
| 其余 11 个 controller / mapper / security 测试 | 低 | 仅 `assertThat(response.getMetadata().getUsage()).isNotNull()` |

---

## 二、现有测试结构模式

### 2.1 共同测试基础设施

所有 15 个测试类共享 `AgentOrchestrationServiceImplTest.TestConfig`，核心注解：

```java
@SpringBootTest(
    classes = AgentOrchestrationServiceImplTest.TestConfig.class,
    webEnvironment = SpringBootTest.WebEnvironment.NONE,
    properties = {
        "spring.autoconfigure.exclude=...MybatisPlusConfig,...RedisConfig,...SecurityAutoConfiguration,...FlywayAutoConfiguration"
    }
)
@Transactional
class XxxTest {
    @Autowired private ApplicationContext ctx;
    // 按需 ctx.getBean(XxxService.class)
}
```

TestConfig 组装：
- 配置类：`AgentTestConfig`（Properties + AesGcmCipher + TokenStore + ModelConfig 相关 Bean）
- 实体包扫描：`com.sw.ck.agent.model.entity`
- Mapper 扫描：`com.sw.ck.agent.mapper`
- Profile：`@ActiveProfiles("dev")`

数据库：H2 内存库（`spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1`），Flyway 自动建表（含 V35 token 列）

### 2.2 Mock OpenAI Server 模式

使用 JDK 内置 `com.sun.net.httpserver.HttpServer`（localhost:0 随机端口）mock OpenAI Chat Completions：

```java
@BeforeEach void setUp() throws Exception {
    httpServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    httpServer.createContext("/v1/chat/completions", exchange -> {
        // 读 requestBody → 解析 JSON → 构造 responseBody（含 usage JSON）→ 写 response
        httpServer.start(); // 随机端口
        baseUrl = "http://127.0.0.1:" + httpServer.getAddress().getPort();
    });
}

@AfterEach void tearDown() { httpServer.stop(0); }
```

### 2.3 三种 Usage 构造方式（均在 AgentOrchestrationServiceImplTest 中）

**方式 1：extractUsageFromResponse（简单调用）**
```java
String responseBody = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"Hi\"},\"finish_reason\":\"stop\"}],"
    + "\"usage\":{\"prompt_tokens\":3,\"completion_tokens\":5,\"total_tokens\":8}}";
// 断言：usage.getInputTokens()==3, usage.getGenerationTokens()==5, usage.getTotalTokens()==8
```

**方式 2：extractUsageFromResponseInGraphMode（graph 模式，choices[0].message.content=null，改为 Delta.content）**
```java
String responseBody = "{\"choices\":[{\"delta\":{\"role\":\"assistant\",\"content\":\"Hi\"},\"finish_reason\":\"stop\"}],"
    + "\"usage\":{\"prompt_tokens\":3,\"completion_tokens\":5,\"total_tokens\":8}}";
```

**方式 3：extractUsageFromEmptyMetadata（metadata 无 usage 字段 → 返回 null Usage）**
```java
String responseBody = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"Hi\"},\"finish_reason\":\"stop\"}]}";
// 断言：usage 为 null 或 usage 字段未设置
```

**方式 4：extractUsageFromStreamingMode（SSE 流式，多个 data 行 + [DONE]）**
- 同样包含 `"usage":{"prompt_tokens":3,"completion_tokens":5,"total_tokens":8}`

### 2.4 AssertionJ 风格

统一使用 `org.assertj.core.api.Assertions.assertThat(...)`，不使用 JUnit `assertEquals`。

---

## 三、编写 Token 专项行为测试的关键要点

### 3.1 可直接复用的模式

| 复用项 | 来源 | 说明 |
|--------|------|------|
| TestConfig 类 | `AgentOrchestrationServiceImplTest.TestConfig` | 直接引用，含 H2 + Flyway + Mapper 扫描 |
| Mock HTTP Server | `@BeforeEach setUp()` 模式 | JDK HttpServer 随机端口 + baseUrl 注入 |
| Usage JSON 构造 | `responseBody` 字符串拼接 | 用 `prompt_tokens`/`completion_tokens`/`total_tokens` 字段名 |
| 断言风格 | AssertJ `assertThat(...).isEqualTo(...)` | 不用 JUnit Assert |
| Spring AI Usage 类 | `org.springframework.ai.chat.model.ChatResponse` | `getMetadata().getUsage()` → Usage 对象 |

### 3.2 需要注意的坑

1. **Usage.getGenerationTokens() 非 getOutputTokens()**：Spring AI 的 `Usage` 类中，`completion_tokens` 对应方法名是 `getGenerationTokens()`，不是 `getOutputTokens()`。测试断言务必用对方法名。
2. **Graph 模式 response 结构不同**：graph 模式下 `choices[0].message.content` 为 null，token 信息通过 `choices[0].delta.content` 返回（SSE Delta 格式）。
3. **Metadata 中无 usage 时返回 null**：如果 response JSON 中没有 `usage` 字段，`getMetadata().getUsage()` 返回 null，不是返回零值 Usage。
4. **ChatMessage.totalTokens 是计算字段**：由 service 层手动计算 `inputTokens + outputTokens`，非从 response 直接取。测试需验证计算逻辑。

### 3.3 Token 专项行为测试建议覆盖的场景

| 场景 | 测试目标 | 验证点 |
|------|---------|--------|
| 用量写入 | 调用后 chat_message 表有 input_tokens/output_tokens/total_tokens 值 | `agentMessageMapper.selectById(msgId)` → 三字段值 |
| 用量计算 | totalTokens = inputTokens + outputTokens | 手动构造不一致值验证计算逻辑 |
| Null usage 处理 | response 无 usage 字段时不写入 token（null 而非 0） | 选择 msg 验证三字段均为 null |
| 多轮累加 | 多轮对话后每条消息独立记录 token | 对比多条消息的各自 token 值 |
| 空 content 消息 | assistant 回复空内容时仍记录 token | token 值非 null 且 content 为空 |
| Token 为 0 | 使用量为 0 的极端情况 | 总 token 为 0 时 totalTokens=0（非 null） |

---

## 未确认事项

- `ChatResponse.getMetadata().getUsage()` 的确切类路径（Spring AI 内部类，未在本项目源码中找到自定义子类）——确认是 `org.springframework.ai.chat.model.ChatResponse.Metadata.getUsage()`。
- 是否存在 `AgentMessageMapper.xml` 自定义 SQL（搜索未找到 XML 映射文件，仅有 `@TableName` 注解）。

## 已确定事实

1. Token 字段在 V35 迁移中加入 agent_message 表（input_tokens, output_tokens, total_tokens，均为 BIGINT nullable）
2. AgentOrchestrationServiceImpl 是唯一写入 Token 的 service（通过 saveMessage 方法）
3. 现有 15 个测试中无一个以 Token 为独立测试目标，仅作 response 边缘断言
4. Mock 方式为 JDK HttpServer + JSON 字符串拼接，直接构造含 usage 的 response
5. Spring AI Usage 类的 `completion_tokens` 对应方法是 `getGenerationTokens()`，非 `getOutputTokens()`
6. TestConfig 提供完整的 H2 + Flyway + Mapper 基础设施，可直接复用

## 是否需要继续探索

否。当前信息足够编写 Token 专项行为测试。

## 建议返回规划层的最小结论

Agent 模块有 15 个测试涉及 Token，但无专项测试。Mock 方式为 JDK HttpServer + Spring AI ChatResponse JSON 拼接。Token 持久化通过 AgentOrchestrationServiceImpl.saveMessage() 写入 agent_message 表（V35 迁移），totalTokens 为 service 层计算字段。Spring AI Usage 类的 completion_tokens 对应 `getGenerationTokens()` 方法。TestConfig + AssertJ 断言模式可直接复用。现有测试中的 Usage JSON 构造方式（`"usage":{"prompt_tokens":3,"completion_tokens":5,"total_tokens":8}`）是唯一成熟的模拟路径。
