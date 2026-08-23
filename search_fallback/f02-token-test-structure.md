# 探索结论：F02 图执行路径 Token 相关代码与测试结构

## 检查范围

| # | 文件 | 行数 |
|---|------|------|
| 1 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java` | ~1320行 |
| 2 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImpl.java` | ~1542行 |
| 3 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImplTest.java` | ~1023行 |
| 4 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTest.java` | ~1203行 |

---

## 问题1：AgentGraphInterpreter.callLlmNode() 如何提取 token 数据？

### 方法签名

```java
private String callLlmNode(String input, Map<String, Object> config, String branchId,
                           Map<String, Object> parentVars)
```

### Token 提取逻辑（行 1054-1067）

```java
nodeUsage = new TokenUsage();
Object raw = generation.getMetadata().get("usage");
if (raw instanceof Map<?, ?> usageMap) {
  // Spring AI Usage 对象在序列化后变为 Map，字段名取决于 provider 实现
  usage = (long) usageMap.getOrDefault("promptTokens", 0L);
  usage += (long) usageMap.getOrDefault("completionTokens", 0L);
}
nodeUsage.setTotalTokens(usage);
```

**关键事实**：
1. `TokenUsage` 是 `AgentGraphInterpreter` 的**内部静态类**（行 1224-1242）：
   ```java
   static class TokenUsage {
     long promptTokens;    // 当前未赋值
     long completionTokens; // 当前未赋值
     long totalTokens;
     // getter/setter 省略
   }
   ```
2. 提取路径：`ChatResponse` → `Generation.getMetadata()` → `Map.get("usage")` → Map 取 `promptTokens` + `completionTokens` → 求和写入 `totalTokens`
3. **注意**：`promptTokens` 和 `completionTokens` 字段虽然有 setter 但当前未在 callLlmNode 中被赋值——只有 `totalTokens` 被设置。这是已有代码的现状。

### 变量累积逻辑（行 1068-1081）

- 无 `outputVar` 配置 → 累加到 `defaultUsage`（全图 token 总量）
- 有 `outputVar` 配置 → 累加到 `namedUsageMap.get(outputVar)`（命名变量级 token）

### 全局 token 汇总（行 1216-1221）

```java
public TokenUsage getUsage() {
  TokenUsage result = new TokenUsage();
  for (TokenUsage u : namedUsageMap.values()) {
    result.totalTokens += u.totalTokens;
  }
  result.totalTokens += defaultUsage.totalTokens;
  return result;
}
```

---

## 问题2：AgentGraphExecutionServiceImpl.persistNodeTraces() 如何持久化？

### 方法签名（行 338）

```java
private void persistNodeTraces(String execId, String graphId,
                               List<AgentGraphInterpreter.NodeExecutionTrace> traces)
```

### 持久化逻辑（行 340-344）

```java
JsonNode jsonNode = objectMapper.valueToTree(traces);
agentGraphTraceMapper.batchInsert(execId, graphId, jsonNode);
```

- 将 `List<NodeExecutionTrace>` 通过 Jackson 序列化为 JsonNode（包含每条 trace 的 `nodeUsage` 字段）
- 调用 MyBatis-Plus Mapper 的 `batchInsert` 批量写入 `agent_graph_trace` 表
- `nodeUsage` 中的 `totalTokens` 被序列化到 `metadata` JSONB 列中

### GraphExecutionSnapshot 汇总（行 481-496）

```java
private GraphExecutionSnapshot buildSnapshot(...) {
  Map<String, Long> namedTokenUsage = new LinkedHashMap<>();
  for (var entry : namedUsageMap.entrySet()) {
    namedTokenUsage.put(entry.getKey(), entry.getValue().getTotalTokens());
  }
  return GraphExecutionSnapshot.builder()
      .tokenUsage(interpreter.getUsage().getTotalTokens())
      .namedTokenUsage(namedTokenUsage)
      ...
}
```

- `tokenUsage` = 全图总 token（defaultUsage + namedUsageMap 所有值之和）
- `namedTokenUsage` = 各命名变量各自累计的 token（Map<String, Long>）

---

## 问题3：现有测试是否覆盖多节点/LOOP/FORK/JOIN 场景？

### AgentGraphInterpreterTest（36 个用例）

| 用例 | 场景类型 | Token 测试 | 说明 |
|------|---------|:---:|------|
| 1 | LLM 单跳 | ❌ | StubChatModel 无 usage metadata |
| 2 | TOOL 单跳 | ❌ | — |
| 7 | 顺序 LLM 链 | ❌ | 两跳无 token 断言 |
| 13 | LOOP 正常退出（3 轮） | ❌ | SequencedChatModel 无 usage metadata |
| 14 | LOOP 迭代超限 | ❌ | — |
| 15 | FORK→JOIN 两分支 | ❌ | LLM+TOOL 无 token 断言 |
| 16 | 并行同变量覆盖 | ❌ | — |
| 17 | JOIN 死锁兜底 | ❌ | — |
| 18 | END 早到终止 | ❌ | — |
| 20 | 顺序轨迹采集 | ❌ | nodeUsage 未验证 |
| 21 | FORK→JOIN 轨迹标识 | ❌ | nodeUsage 未验证 |
| 22 | LOOP 迭代轨迹 | ❌ | nodeUsage 未验证 |

**结论：36 个用例中 0 个测试 token 数据提取和累积。**

### AgentGraphExecutionServiceImplTest（22 个用例）

| 用例 | 场景类型 | Token 测试 |
|------|---------|:---:|
| 1-7 | 基本执行/回调/取消/历史等 | ❌ |
| 8 | 多变量执行 | ❌ |
| 12 | 并行图执行 | ❌ |
| 13-20 | 超时/图不存在/状态变更等 | ❌ |

**结论：22 个用例中 0 个验证 namedTokenUsage、tokenUsage 或 token 字段持久化。**

---

## 问题4：如何模拟 F02 路径的 Token 数据？

### 现有桩的局限

| 桩类 | 用途 | Token 支持 |
|------|------|:---:|
| `StubChatModel` | 固定回复 | ❌ `ChatResponse` 无 usage metadata |
| `CapturingChatModel` | 捕获 Prompt | ❌ 同上 |
| `SequencedChatModel` | 按序回复 | ❌ 同上 |

三者均 `new ChatResponse(List.of(new Generation(new AssistantMessage(reply))))` —— `Generation.getMetadata()` 返回空 Map，`callLlmNode` 中 `raw` 为 null，`nodeUsage.totalTokens` 恒为 0。

### Token 数据模拟方案

需要创建一个注入 usage metadata 的 ChatModel 桩：

```java
static class TokenChatModel implements ChatModel {
  private final String reply;
  private final long promptTokens;
  private final long completionTokens;

  TokenChatModel(String reply, long promptTokens, long completionTokens) {
    this.reply = reply;
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
  }

  @Override
  public ChatResponse call(Prompt prompt) {
    Generation gen = new Generation(new AssistantMessage(reply));
    // 关键：往 Generation metadata 注入 usage Map
    Map<String, Object> metadata = new HashMap<>();
    Map<String, Object> usageMap = new HashMap<>();
    usageMap.put("promptTokens", promptTokens);
    usageMap.put("completionTokens", completionTokens);
    metadata.put("usage", usageMap);
    // Generation 有 setMetadata / 构造器接受 metadata 的方式（需确认 Spring AI 版本）
    return new ChatResponse(List.of(gen));
  }
}
```

**注意**：`Generation` 类的 metadata 设置方式取决于 Spring AI 版本。需确认：
- `Generation` 是否有 `setMetadata(Map)` 方法
- 或是否需要通过 `ChatResponse` 的元数据传递
- 或是否需要自定义 `ChatOptions` 注入 metadata

### 多节点 Token 累积测试设计

```
场景 A：顺序 LLM 链 token 累积
  START → LLM1(prompt=10, completion=20) → LLM2(prompt=30, completion=40) → END
  预期：defaultUsage.totalTokens = 10+20+30+40 = 100

场景 B：LOOP 迭代 token 累积
  START → LOOP(maxIterations=3) → LLM(prompt=5, completion=5) → CONDITION(退出/回边)
  预期：3 轮 × 10 = 30

场景 C：FORK→JOIN token 累积
  START → FORK → [LLM(prompt=10, completion=20), TOOL] → JOIN → END
  预期：defaultUsage.totalTokens 包含 LLM 分支的 30

场景 D：命名变量 token 隔离
  START → LLM(outputVar="summary", prompt=10, completion=20) → LLM(prompt=5, completion=5) → END
  预期：namedUsageMap["summary"].totalTokens = 30, defaultUsage.totalTokens = 10
```

---

## 已确定事实

1. `TokenUsage` 是 `AgentGraphInterpreter` 内部静态类，仅 `totalTokens` 字段被赋值（`promptTokens`/`completionTokens` 未赋值）
2. Token 提取依赖 `Generation.getMetadata().get("usage")` 返回 `Map`，键为 `"promptTokens"` 和 `"completionTokens"`
3. `persistNodeTraces` 将 traces（含 nodeUsage）序列化为 JSONB 写入 `agent_graph_trace` 表
4. `GraphExecutionSnapshot` 有 `tokenUsage`（long）和 `namedTokenUsage`（Map<String, Long>）两个字段
5. 现有 36+22=58 个测试用例中 0 个覆盖 token 数据
6. 现有所有 ChatModel 桩均不注入 usage metadata → token 永远为 0

## 分析推测

- Spring AI `Generation` 的 metadata 可能需要通过 `Generation` 构造器或 builder 模式注入（而非 setter），需确认当前 Spring AI 版本的 API
- `nodeUsage` 的 `promptTokens`/`completionTokens` 未被赋值可能是有意简化或待补充，执行角色在实现 token 测试时需决定是否同步补充这两个字段的赋值

## 未确认事项

- Spring AI `Generation` 类的 metadata 注入具体 API（setMetadata / builder / 构造器参数）
- `Generation` 的 metadata 在 `ChatResponse` 序列化后是否保留
- `AgentGraphTraceMapper.batchInsert` 的具体 SQL 和 metadata 列映射

## 是否需要继续探索

**否**。四个指定文件已完整分析，token 路径、持久化结构和测试缺口已明确。Spring AI Generation API 属于第三方库公开 API，执行角色在实现测试时可直接查阅。

## 建议返回规划层的最小结论

- F02 路径 token 提取在 `callLlmNode()` 中完成，依赖 Spring AI `Generation.getMetadata().get("usage")` Map
- 持久化通过 `persistNodeTraces()` → Jackson 序列化 → `agent_graph_trace.metadata` JSONB 列
- **现有 58 个测试全部不覆盖 token**：桩类无 usage metadata 注入能力
- 需要新增 `TokenChatModel`（或类似桩）注入 promptTokens/completionTokens，再针对顺序链/LOOP/FORK-JOIN/命名变量隔离 4 种场景补充 token 累积断言
