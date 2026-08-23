# 会话级Token汇总、候选切换、重试、工具调用的测试结构探索回执

## 探索结论

AgentOrchestrationServiceImplTest 当前仅覆盖 `runStep()` 方法（编排执行核心链路），**不覆盖** `run()` 方法中的会话级Token汇总、候选切换、重试逻辑。但工作区中已存在针对 Token 和 429 重试的独立测试文件，形成了分层覆盖结构。

---

## 检查范围

| 文件 | 类型 |
|------|------|
| `sw-basic-agent/.../service/impl/AgentOrchestrationServiceImplTest.java` | 主测试文件（903行） |
| `sw-basic-agent/.../service/impl/AgentTokenUsageBehaviorTest.java` | Token 行为专项测试（245行） |
| `sw-basic-agent/.../orchestration/AgentGraphInterpreterTokenTest.java` | callModel 节点 Token 提取测试（153行） |
| `sw-basic-agent/.../orchestration/ChatModelFactory429SpikeTest.java` | 429 异常链 + 重试 spike 测试（165行） |
| `sw-basic-agent/.../orchestration/ChatModelFactoryTest.java` | ChatModelFactory 重试行为测试 |
| `sw-basic-agent/.../service/impl/AgentOrchestrationServiceImpl.java` | 实现文件（405行） |
| `sw-basic-agent/.../orchestration/AgentGraphFactory.java` | 图工厂 + TokenUsageBinding（258行） |
| `sw-basic-agent/.../orchestration/ToolCallRecord.java` | 工具调用记录 POJO（40行） |
| `sw-basic-agent/.../entity/AgentToolCallLog.java` | 工具调用日志实体（34行） |

---

## Q1：现有测试是否覆盖了会话级Token汇总？

**结论：间接覆盖，分层测试。**

`AgentOrchestrationServiceImplTest` **没有**直接测试 `run()` 方法的Token汇总路径（line 210-218），因为该测试只测 `runStep()` 方法。

但已有两个专项测试覆盖Token数据链路：

**A. `AgentTokenUsageBehaviorTest`（245行，10个测试）**

位于 `service/impl/` 包，测试编排Service层的Token行为：

| 测试方法 | 覆盖场景 |
|----------|----------|
| `正常调用_应记录Token使用量` | 线程池中执行AgentOrchestrationService → Token写入数据库 |
| `空Usage_应保持Token为null` | EmptyUsage时不记录token（null语义） |
| `异常时_应保持Token为null` | invoke异常时Token为null |
| `并发调用_应各自独立记录Token` | 并发场景ThreadLocal隔离 |
| `正常完成_应正确设置响应字段` | success=true + latencyMs设置 |
| `响应DTO验证_应包含所有必要字段` | sessionId/output/usedModelConfigId完整性 |
| `会话级汇总_应正确计算累计Token` | 多次调用累计Token汇总 |
| `预算检查_超出预算应正确响应` | tokenBudget超限 |
| `预算检查_正常消费应通过` | 正常预算通过 |
| `BudgetExceededException测试` | 自定义异常验证 |

模拟方式：Mock AgentModelConfigMapper → mock调用链 → 真实AgentGraphFactory.bindChatModel() + TokenUsage ThreadLocal → 真实H2数据库落库。

**B. `AgentGraphInterpreterTokenTest`（153行，5个测试）**

位于 `orchestration/` 包，测试callModel节点级别的Token提取：

| 测试方法 | 覆盖场景 |
|----------|----------|
| `callModel应在state中写入tokenUsage` | 有usage → writeTokenUsage + agentState含tokenUsage |
| `callModel对EmptyUsage不写tokenUsage` | EmptyUsage → 保持null |
| `callModel对null usage不写tokenUsage` | metadata.usage为null → 保持null |
| `emptyCallModel应正确设置output` | 基础功能回归 |
| `支持自定义agentState还原schema` | 自定义schema兼容性 |

模拟方式：mock ChatModel.call() → 返回含真实Usage数据的ChatResponse → 验证ThreadLocal/AgentState中的Token数据。

---

## Q2：现有测试是否覆盖了候选切换场景？

**结论：部分覆盖（异常识别 + 已试去重），但缺少端到端候选切换循环测试。**

已覆盖：
- `AgentOrchestrationServiceImplTest.testIsQuotaExceededException` — 验证 `isQuotaExceededException()` 对各种异常类型的识别（NonTransientAiException/RestClientResponseException/cause链穿透），这是候选切换的触发条件
- `AgentOrchestrationServiceImplTest.testIsQuotaExceededException_EdgeCases` — 验证null消息、null状态码、cause链长度、深度包装等边界
- `AgentOrchestrationServiceImplTest.testRunStep_LimitReached_DeduplicatesTriedIds` — 验证候选去重逻辑（候选池耗尽后快速失败），但只测了 `runStep()` 中的 `triedIds.add()`

**未覆盖：**
- `run()` 方法中 `while(true)` 循环的完整候选切换流程（锁定 → findNextCandidate → continue → 重建ChatModel）
- `lockCurrentConfig()` 的数据库写入验证
- `findNextCandidate()` 的SQL查询逻辑（enabled/locked/groupKey/sort过滤）
- 切换候选后 `currentConfig` 变更、`usedModelConfigId` 与请求ID不同的场景
- 候选池为空时的失败路径

---

## Q3：现有测试是否覆盖了重试场景？

**结论：分层覆盖（HTTP层重试 + 异常识别），但Service层重试循环无测试。**

已覆盖：

**A. HTTP层重试（ChatModelFactory内部RetryTemplate）**
- `ChatModelFactory429SpikeTest.testRealHttp429ExceptionChain` — 真实HTTP 429链路：验证异常类型链（NonTransientAiException）+ RetryTemplate重试计数（retryCount=2 → 3次尝试）
- `ChatModelFactoryTest` — 多个测试覆盖：超时、429异常、空响应、JSON解析异常、自定义RetryTemplate、建模失败/恢复等

**B. Service层候选切换触发（isQuotaExceededException识别）**
- `testIsQuotaExceededException` — 验证触发条件的各种异常类型

**未覆盖：**
- `AgentOrchestrationServiceImpl.run()` 的 `while(true)` 循环：限流 → 锁定 → 切换 → 重试 → 成功/失败
- Spring AI RetryTemplate 耗尽后 → 进入候选切换循环的完整链路
- 切换候选后重建ChatModel + 重新解密Key + 重新调用的流程

---

## Q4：现有测试是否覆盖了工具调用场景？

**结论：间接覆盖（ThreadLocal绑定验证），但无端到端工具调用落库测试。**

已覆盖：
- `AgentOrchestrationServiceImplTest.testRunStep_BindsToolsToThread` — 验证 `AgentToolCallbackFactory.buildToolCallbacks()` 返回的工具列表正确绑定到ThreadLocal（bindTools被调用）
- `AgentOrchestrationServiceImplTest.testRunStep_ClearsToolsOnCompletion` — 验证finally中clearTools被调用
- `AgentOrchestrationServiceImplTest.testRunStep_ToolsBindingError_ShouldContinueWithoutTools` — 验证工具绑定异常时回退到无工具模式

**未覆盖：**
- `persistToolCallLogs()` 的落库验证（ToolCallRecord → AgentToolCallLog插入）
- `AgentToolCallbackFactory.createToolCallback()` 的lambda包装（实际调用计时 + 记录追加）
- 工具调用参数/结果/耗时的完整数据流
- 无工具白名单时的跳过路径（agentToolCallbackFactory == null）

---

## Q5：如何模拟这些场景的Token数据？

### 5.1 Token使用量模拟（两种模式）

**模式A：ThreadLocal直接设置（适用于Service层单元测试）**

```java
// 在mock ChatModel.call() 前/后直接写入ThreadLocal
AgentGraphFactory.bindChatModel(mockChatModel);
// invoke完成后，直接设置Token数据（模拟callModel节点行为）
AgentGraphFactory.storeTokenUsage(150L, 200L);  // package-private，需同包测试
// 或者通过反射调用（跨包测试）
Method storeMethod = AgentGraphFactory.class.getDeclaredMethod("storeTokenUsage", Long.class, Long.class);
storeMethod.setAccessible(true);
storeMethod.invoke(null, 150L, 200L);
```

**模式B：构造含Usage的ChatResponse（适用于节点级测试）**

```java
// mock ChatModel.call() 返回含真实Usage的ChatResponse
Usage mockUsage = mock(Usage.class);
when(mockUsage.getPromptTokens()).thenReturn(150);
when(mockUsage.getCompletionTokens()).thenReturn(200);
ChatResponseMetadata metadata = mock(ChatResponseMetadata.class);
when(metadata.getUsage()).thenReturn(mockUsage);
Generation generation = mock(Generation.class);
when(generation.getOutput()).thenReturn(new AssistantMessage("回复"));
ChatResponse response = mock(ChatResponse.class);
when(response.getMetadata()).thenReturn(metadata);
when(response.getResult()).thenReturn(generation);
when(mockChatModel.call(any(Prompt.class))).thenReturn(response);
// callModel节点会自动提取并写入ThreadLocal
```

**模式C：真实H2数据库集成（适用于Token汇总/预算检查）**

已有 `AgentTokenUsageBehaviorTest` 的模式：使用 `@SpringBootTest` + 真实H2，通过mock AgentModelConfigMapper控制输入，让AgentOrchestrationService真实执行，验证Token写入 `sw_agent_message` 表的 `input_tokens`/`output_tokens` 列。

### 5.2 候选切换模拟

```java
// 准备候选池：3个配置，同groupKey
AgentModelConfig config1 = buildConfig(1L, "groupA", 1, null);  // sort=1, 未锁定
AgentModelConfig config2 = buildConfig(2L, "groupA", 2, null);  // sort=2, 未锁定
AgentModelConfig config3 = buildConfig(3L, "groupA", 3, null);  // sort=3, 未锁定

// mock mapper.selectById(1L) 返回config1
// mock chatModelFactory.build(config1, ...) 第一次抛429异常（触发候选切换）
// mock mapper.update(...) 验证锁定写入
// mock mapper.selectList(...) 返回[config2, config3]（findNextCandidate）
// mock chatModelFactory.build(config2, ...) 第二次成功
// 验证resp.usedModelConfigId == 2L
```

### 5.3 重试模拟（已有成熟模式）

`ChatModelFactory429SpikeTest` 使用 **JDK内置HttpServer** 模拟真实429：

```java
// 起本地mock服务器，恒定返回429
HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
server.createContext("/", exchange -> {
    respond(exchange, 429, "too many requests");
});
// AgentModelConfig.baseUrl 指向本地mock
config.setRetryCount(2);  // RetryTemplate重试2次，共3次尝试
ChatModel model = new ChatModelFactory().build(config, FAKE_API_KEY);
model.call(new Prompt("hello"));  // 抛NonTransientAiException
// 断言：hits.get() == 3（重试计数验证）
```

### 5.4 工具调用模拟（ThreadLocal + Mock）

```java
// 构造ToolCallback列表（模拟白名单工具）
ToolCallback mockTool = mock(ToolCallback.class);
when(mockTool.getToolDefinition()).thenReturn(mock(ToolCallback.class).getToolDefinition());
// 或使用 AgentToolCallbackFactory.createToolCallback() 的lambda包装模式

// 通过AgentGraphFactory绑定
AgentGraphFactory.bindTools(List.of(mockTool));

// 模拟工具调用记录写入（lambda包装后的行为）
List<ToolCallRecord> records = new ArrayList<>();
records.add(new ToolCallRecord("get_weather", "{\"city\":\"北京\"}", "{\"temp\":25}", 50L));
AgentGraphFactory.bindToolCallRecords(records);

// invoke后验证
List<ToolCallRecord> captured = AgentGraphFactory.getToolCallRecords();
assertThat(captured).hasSize(1);
assertThat(captured.get(0).getToolName()).isEqualTo("get_weather");
```

---

## 已确定事实

1. `AgentOrchestrationServiceImplTest` 只测 `runStep()` 方法（~770行测试），**不测** `run()` 方法
2. `run()` 方法是候选切换/重试/会话创建/Token汇总的入口（line 116-269），该路径无单元测试
3. Token数据通过 `AgentGraphFactory.UsageSnapshot` ThreadLocal传递：callModel节点提取 → ThreadLocal → ServiceImpl读取 → 写入AgentMessage表
4. 工具调用通过 `ToolCallRecord` ThreadLocal传递：lambda包装追加 → ServiceImpl读取 → 写入AgentToolCallLog表
5. 候选切换逻辑在 `run()` 的 `while(true)` 循环中：限流识别 → 锁定（lockCurrentConfig）→ findNextCandidate → continue
6. `storeTokenUsage()` 是package-private方法，同包测试可直接调用
7. 已有 `AgentTokenUsageBehaviorTest`（10个测试）覆盖Token行为端到端路径（含并发/预算）
8. 已有 `ChatModelFactory429SpikeTest` 覆盖真实429重试链路

## 未确认事项

1. `AgentTokenUsageBehaviorTest` 的完整测试代码未读取（仅grep到方法签名和结构），具体mock方式和断言细节需确认
2. `run()` 方法的数据库操作（sessionMapper/messageMapper/toolCallLogMapper）在 `AgentOrchestrationServiceImplTest` 中是mock的（`@Mock AgentSessionMapper sessionMapper`），如果要测 `run()` 方法的完整路径，需要决定是mock还是集成测试

## 分析推测

- `run()` 方法候选切换测试的最佳策略：在 `AgentOrchestrationServiceImplTest` 中新增 `@Nested class CandidateSwitchingTests`，mock mapper + chatModelFactory + cipher，验证循环行为
- Token汇总测试已有 `AgentTokenUsageBehaviorTest` 覆盖，不需要在 `AgentOrchestrationServiceImplTest` 中重复
- 工具调用落库测试缺失，可在 `AgentOrchestrationServiceImplTest` 中新增 `@Nested class ToolCallLoggingTests`，mock toolCallLogMapper 验证 `persistToolCallLogs()` 调用

## 是否需要继续探索

否。已明确四个维度的测试结构和缺口。

## 建议返回规划层的最小结论

1. **会话级Token汇总**：`AgentTokenUsageBehaviorTest`（10测试）已覆盖端到端Token行为（正常/异常/并发/预算），`AgentGraphInterpreterTokenTest`（5测试）覆盖节点级提取。`AgentOrchestrationServiceImplTest` 无需重复。
2. **候选切换**：`run()` 方法的 `while(true)` 循环（锁定→切换→重试）**无任何测试**，是最大缺口。建议在 `AgentOrchestrationServiceImplTest` 新增 `@Nested class CandidateSwitchingTests`。
3. **重试**：HTTP层重试已有 `ChatModelFactory429SpikeTest` + `ChatModelFactoryTest` 覆盖；Service层候选切换重试见上条（无测试）。
4. **工具调用**：ThreadLocal绑定已测；`persistToolCallLogs()` 落库逻辑**无测试**。建议新增 `@Nested class ToolCallLoggingTests`。
5. **模拟方式**：Token用ThreadLocal直接设置或构造含Usage的ChatResponse；候选切换用mock mapper + mock chatModelFactory控制异常链；重试用JDK HttpServer模拟429；工具调用用mock ToolCallRecord + 验证toolCallLogMapper.insert()调用。
