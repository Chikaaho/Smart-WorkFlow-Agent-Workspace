# Agent Token Usage 探索回执

## 探索结论

**Spring AI 的 `ChatResponse` 在两条执行路径中均已被获取，但 usage 数据目前均未落库。**

- **F01 编排路径（Orchestration）**：`processResponse()` 拿到了 `ChatResponse`，只取了 `getResult().getOutput().getText()`，**未提取 `response.getMetadata().getUsage()`**。
- **F02 图执行路径（Graph）**：`executeLLMNode()` 调用 `chatModel.call(userMessage)` 返回 `String`，**ChatResponse 对象被完全丢弃**，usage 不可获取。
- **实体层**：`AgentMessage` 已有 `inputTokens`/`outputTokens` 字段（Long, nullable），但**从未被赋值**。
- **Flyway 最高版本**：`V34`（agent 专用迁移为 V19-V28）。

---

## 检查范围

1. `sw-basic/sw-basic-agent/` 全部源码（48 个 Java 文件）
2. `sw-biz/sw-biz-agent/` 全部源码（42 个 Java 文件，含 API + impl）
3. Flyway 迁移脚本（agent 子目录 V19-V28，全局 V19-V34）
4. `Smart-WorkFlow/功能清单.md`

---

## 关键证据

### 1. F01 编排路径：ChatResponse 获取点

**文件**：`sw-biz/sw-biz-agent/sw-biz-agent-biz/.../impl/AgentOrchestrationServiceImpl.java`
**方法**：`processResponse()` (line ~141)

```java
private AgentMessage processResponse(AgentMessage userMsg, ChatResponse response, String sessionId) {
    AgentMessage aiMsg = new AgentMessage();
    aiMsg.setSessionId(sessionId);
    aiMsg.setRole(AgentMessageRole.ASSISTANT);
    // ...
    // ===== 关键：只取了文本，未取 usage =====
    String text = response.getResult().getOutput().getText();
    aiMsg.setContent(text);
    // response.getMetadata().getUsage() 在此完全未使用
    // ...
}
```

**ChatResponse 调用链**：`callWithTools()` → `ChatClient.prompt()...call()` → 返回 `ChatResponse`
**可用但未使用的 usage 入口**：`response.getMetadata().getUsage()` 返回 `org.springframework.ai.chat.metadata.Usage`，含 `getPromptTokens()`、`getGenerationTokens()`、`getTotalTokens()`

---

### 2. F02 图执行路径：ChatResponse 获取点

**文件**：`sw-basic/sw-basic-agent/.../orchestration/AgentGraphInterpreter.java`
**方法**：`executeLLMNode()` (line ~107)

```java
private String executeLLMNode(AgentGraphContext ctx, AgentNodeEntity node, Map<String, Object> varBindings) {
    // ...
    String response = chatModel.call(userMessage);  // 返回 String，ChatResponse 已丢弃
    return response;
}
```

**问题**：`ChatModel.call(String)` 返回 `String`，原始 `ChatResponse` 对象丢失。若要获取 usage，需改为 `ChatModel.call(Prompt)` 返回 `ChatResponse`，再从中提取 `getMetadata().getUsage()`。

**同类方法参考**：同一类中的 `parseJSONWithLLM()` (line ~395) 同样使用 `chatModel.call()` 返回 String，也未提取 usage。

---

### 3. 现有实体结构

#### AgentMessage（会话消息）
**文件**：`sw-basic/sw-basic-agent/.../entity/AgentMessage.java`

| 字段 | 类型 | 说明 |
|------|------|------|
| `inputTokens` | `Long` | **已定义，从未赋值** |
| `outputTokens` | `Long` | **已定义，从未赋值** |

- MyBatis-Plus 自动映射，建表 SQL（V22）中已有 `input_tokens BIGINT`、`output_tokens BIGINT` 列
- **结论：表结构已就位，只缺赋值逻辑**

#### AgentExecutionRecord（编排执行记录）
**文件**：`sw-biz/sw-biz-agent/sw-biz-agent-biz/.../entity/AgentExecutionRecord.java`

| 字段 | 类型 | 说明 |
|------|------|------|
| `inputTokens` | `Long` | **已定义** |
| `outputTokens` | `Long` | **已定义** |

- 但 `create()` 静态工厂方法中**未赋值这两个字段**
- 实际建表 SQL（V27/V28）中对应列可能不存在（需确认 V27 SQL）

#### AgentGraphExecutionNode（图执行节点）
**文件**：`sw-biz/sw-biz-agent/sw-biz-agent-biz/.../entity/AgentGraphExecutionNode.java`

- **无 token 相关字段**

#### AgentModelConfig（模型配置）
**文件**：`sw-basic/sw-basic-agent/.../entity/AgentModelConfig.java`

| 字段 | 类型 | 说明 |
|------|------|------|
| `maxTokens` | `Integer` | 模型输出上限（请求参数，非 usage） |

- 无 usage 累计字段

---

### 4. Flyway 迁移版本

| 类别 | 最高版本 | 路径 |
|------|----------|------|
| 全局 PostgreSQL | **V34** | `db/migration/postgresql/V34__sys_user_group.sql` |
| 全局 H2 | **V34** | `db/migration/h2/V34__sys_user_group.sql` |
| Agent PostgreSQL | **V28** | `db/migration/agent/postgresql/V28__init_agent_graph_execution_node.sql` |
| Agent H2 | **V28** | `db/migration/agent/h2/V28__init_agent_graph_execution_node.sql` |
| Storage PostgreSQL | **V16** | `db/migration/storage/postgresql/V16__init_storage_file.sql` |

**新迁移版本号建议**：V35（全局），或 agent 子目录内新增 V29（需确认 Flyway 对子目录版本号是否独立计算——从 V19-V28 看，agent 子目录版本号与全局共享同一版本序列）。

---

## 已确定事实

1. **F01 usage 获取点**：`AgentOrchestrationServiceImpl.processResponse()` 方法中，`ChatResponse` 对象可用，`response.getMetadata().getUsage()` 可获取 usage 数据，但当前未提取。
2. **F02 usage 获取点**：`AgentGraphInterpreter.executeLLMNode()` 中 `chatModel.call(String)` 返回 String，ChatResponse 已丢弃，需改用 `chatModel.call(Prompt)` 返回 ChatResponse 才能获取 usage。
3. **AgentMessage 表结构已就位**：`input_tokens`/`output_tokens` 列已存在（V22），实体字段已定义，只缺赋值。
4. **AgentExecutionRecord 也已定义 token 字段**，但建表 SQL（V27）中实际未包含（需确认）。
5. **Flyway 最高版本号 = V34**。

## 分析推测

1. 给 `processResponse()` 添加 3 行代码（提取 usage 并赋值到 aiMsg）即可完成 F01 usage 落库，影响范围极小。
2. F02 图执行路径需要将 `chatModel.call(String)` 改为 `chatModel.call(Prompt)` 返回 ChatResponse，再提取 usage——这会改变 `executeLLMNode()` 的返回方式，需要同步修改调用方。
3. AgentGraphExecutionNode 表如需记录 token，需要新增字段（当前无 token 列）。

## 未确认事项

1. V27 `init_agent_graph_execution.sql` 中 `sw_agent_graph_execution` 表是否有 token 字段（尚未读取该文件）。
2. `AgentExecutionRecord` 建表 SQL（V27）中实际是否有 `input_tokens`/`output_tokens` 列。
3. Spring AI 0.8.x 版本中 `ChatResponse.getMetadata().getUsage()` 的具体 API 签名（不同版本可能有差异）。

## 是否需要继续探索

是——建议确认 V27 建表 SQL 和 Spring AI Usage API 签名。

## 建议返回规划层的最小结论

- F01 修 1 个方法（3 行代码）可落库 usage
- F02 需改 `executeLLMNode` 返回类型，影响面稍大
- 表结构 AgentMessage 已就位，AgentGraphExecutionNode 缺 token 字段
- Flyway 最高版本 V34
