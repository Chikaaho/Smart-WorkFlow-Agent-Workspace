# D162 缺口测试结构探索回执

## 探索结论

D162 要求的 8 个缺口在现有测试中**均有不同程度的覆盖缺失**。现有测试框架（TokenChatModel 桩、JDK HttpServer mock、SpringBootTest + H2 集成、纯 Java mock）已经建立，但具体场景断言不足。以下逐缺口分析现状、缺口和建议测试结构。

---

## 检查范围

| 目录/文件 | 类型 |
|-----------|------|
| `AgentGraphInterpreterTokenTest.java` | F02 Token 聚合（纯 Java） |
| `AgentGraphInterpreterTest.java` | 图解释器拓扑+轨迹（纯 Java） |
| `AgentTokenUsageBehaviorTest.java` | Token 端到端行为（SpringBootTest+H2） |
| `AgentOrchestrationServiceImplTest.java` | 编排 Service（SpringBootTest+H2） |
| `AgentGraphExecutionServiceImplTest.java` | 图执行 Service（SpringBootTest+H2） |
| `ChatModelFactory429SpikeTest.java` | 429 重试链路 |
| `AgentConversationControllerTest.java` | 会话 Controller 权限 |
| `AgentGraphInterpreter.java` | 解释器实现 |
| `AgentGraphFactory.java` | 图工厂+TokenUsage ThreadLocal |
| `AgentOrchestrationServiceImpl.java` | 编排 Service 实现 |
| `AgentGraphExecutionServiceImpl.java` | 图执行 Service 实现 |
| `AgentConversationServiceImpl.java` | 会话查询 Service |
| `AgentConversationController.java` | 会话 Controller |
| `AgentGraphExecutionController.java` | 图执行 Controller |
| `AgentConversationMessageDTO.java` | 消息 DTO（含 token 字段） |
| `AgentOrchestrationRunRespDTO.java` | 编排响应 DTO（**无 token 字段**） |
| `AgentMessage.java` | 消息实体（inputTokens/outputTokens） |
| `AgentGraphExecution.java` | 执行记录实体（inputTokens/outputTokens） |
| `AgentGraphExecutionNode.java` | 执行节点明细实体（inputTokens/outputTokens） |

---

## 缺口 1：F02 聚合 - FORK/JOIN Token 测试

### 现有覆盖

- `AgentGraphInterpreterTokenTest` 有 5 个测试：单节点、两节点链、三节点链、LOOP 3 轮
- `AgentGraphInterpreterTest` 有 4 个 FORK/JOIN 拓扑测试（用例 15/16/17/18/21）但**无 Token 断言**
- `AgentGraphExecutionServiceImplTest` 用例 16 有 FORK/JOIN 全链路测试但**无 Token 断言**

### 缺口

- **FORK/JOIN 场景下各分支 LLM 节点的 Token 是否正确分别记录到各自 NodeExecutionTrace**
- **JOIN 汇合后 totalTokens 是否正确累加（两分支 Token 求和）**
- **同节点在 FORK 多分支中重复执行时 Token 是否按分支独立记录**

### 建议测试结构

**测试类**: `AgentGraphInterpreterTokenTest` 新增方法

```java
@Test
@DisplayName("FORK/JOIN 两分支各含 LLM 节点 - 各分支 Token 独立记录 + 汇合后累加")
void forkJoin_twoBranchesWithLlm_shouldRecordTokensPerBranch() throws Exception {
    // 构建: START -> FORK -> [LLM1(prompt=10,completion=20)] / [LLM2(prompt=30,completion=40)] -> JOIN -> LLM3(prompt=5,completion=5) -> END
    // 验证: traces 中 LLM1(input=10,output=20), LLM2(input=30,output=40), LLM3(input=5,output=5)
    // 验证: 三条 LLM trace 的 token 总和 input=45, output=65
}
```

**模拟方式**: 复用现有 `TokenChatModel` 桩（每个 LLM 节点配置不同 token 值），按出边顺序分别注入。

---

## 缺口 2：会话级累计、跨会话隔离、跨租户隔离

### 现有覆盖

- `AgentTokenUsageBehaviorTest`:
  - `f01_orchestration_shouldPersistTokenUsage` — 单轮 Token 持久化
  - `multiTurn_shouldRecordTokenPerMessage` — 同会话两轮逐消息记录
  - `unknownUsage_shouldStoreNull_notZero` — NULL 语义
  - `failedCall_shouldNotAffectTokenRecording` — 失败场景
- `AgentConversationControllerTest` — 权限码 403/200 结构，**不验证消息 token 字段**

### 缺口

- **会话级累计**: 无测试验证同一会话多轮调用的 inputTokens/outputTokens 累计值是否正确（如消息1: input=10,output=20; 消息2: input=30,output=40 → 会话总计 input=40,output=60）
- **跨会话隔离**: 无测试验证两个不同 session 的 Token 不会互相影响
- **跨租户隔离**: 无测试验证 tenant_id=100 的会话 Token 与 tenant_id=200 的会话 Token 互不可见
- **AgentConversationMessageDTO 缺少会话级 Token 汇总字段**: 当前 DTO 只有逐消息的 inputTokens/outputTokens，无会话级汇总

### 建议测试结构

**A. 会话级累计** (`AgentTokenUsageBehaviorTest` 新增)

```java
@Test
@DisplayName("会话级 Token 累计 - 三轮调用后各消息 Token 独立，总计可从消息列表求和")
void sessionLevelTokenCumulation_threeTurns_shouldBeSummable() {
    // 第1轮: mock prompt_tokens=10, completion_tokens=20
    // 第2轮: mock prompt_tokens=30, completion_tokens=40
    // 第3轮: mock prompt_tokens=5, completion_tokens=5
    // 验证: 3条 ASSISTANT 消息 inputTokens=10/30/5, outputTokens=20/40/5
    // 验证: 消息列表聚合 input=45, output=65
}
```

**B. 跨会话隔离** (`AgentTokenUsageBehaviorTest` 新增)

```java
@Test
@DisplayName("跨会话隔离 - 两个 session 的 Token 互不影响")
void crossSessionIsolation_twoSessions_shouldBeIndependent() {
    // session A: 调用 run() → token 记录
    // session B: 调用 run() → token 记录
    // 验证: session A 的消息列表不含 session B 的 token 数据
}
```

**C. 跨租户隔离** (`AgentTokenUsageBehaviorTest` 新增)

```java
@Test
@DisplayName("跨租户隔离 - tenant 100 的会话 Token 对 tenant 200 不可见")
void crossTenantIsolation_tenantA不见tenantB() {
    // tenant 100 创建 session + 调用 run()
    // 切换 LoginUserHolder 为 tenant 200
    // 尝试 listMessages(sessionId) → 404（租户拦截器过滤）
}
```

**模拟方式**: 复用现有 `AgentTokenUsageBehaviorTest` 的 mock HTTP Server 模式，构造不同 usage 的响应，验证 DB 中 token 数据。

---

## 缺口 3：Token 语义 - 部分缺失 usage、明确 0、input/output/total 自洽

### 现有覆盖

- `AgentTokenUsageBehaviorTest.unknownUsage_shouldStoreNull_notZero` — 完全无 usage → NULL
- `AgentGraphInterpreterTokenTest` — TokenChatModel 桩始终返回完整 usage
- `AgentGraphFactory.callModel` — 区分 EmptyUsage 和有值 Usage

### 缺口

- **部分缺失 usage**: 无测试验证 response 有 usage 但 prompt_tokens/completion_tokens 其一为 null 的场景
- **明确 0**: 无测试验证供应商返回 prompt_tokens=0, completion_tokens=0 的场景（应持久化为 0 而非 NULL）
- **input/output/total 自洽**: 无测试验证 total_tokens = prompt_tokens + completion_tokens 的一致性断言
- **AgentOrchestrationRunRespDTO 缺少 token 字段**: 响应 DTO 无 inputTokens/outputTokens，前端无法从 F01 调用获取 token 信息

### 建议测试结构

**测试类**: `AgentTokenUsageBehaviorTest` 新增

```java
@Test
@DisplayName("部分 usage - prompt_tokens 有值 completion_tokens 为 null → 持久化 inputTokens 有值 outputTokens 为 NULL")
void partialUsage_completionTokensNull_shouldStorePartial() {
    // mock response: usage 有 prompt_tokens=10 但无 completion_tokens
    // 验证: agent_message.outputTokens == null, inputTokens == 10
}

@Test
@DisplayName("明确 0 - prompt_tokens=0 completion_tokens=0 → 持久化为 0 而非 NULL")
void explicitZero_usageAllZero_shouldStoreZeroNotnull() {
    // mock response: usage={"prompt_tokens":0,"completion_tokens":0,"total_tokens":0}
    // 验证: inputTokens == 0, outputTokens == 0 (非 null)
}

@Test
@DisplayName("input/output/total 自洽 - total = input + output")
void tokenConsistency_totalShouldEqualInputPlusOutput() {
    // mock response: prompt_tokens=15, completion_tokens=25, total_tokens=40
    // 验证: inputTokens=15, outputTokens=25, total=40 (自洽)
}
```

**模拟方式**: 自定义 HttpServer handler，根据请求构造含部分 usage / 明确 0 / 完整 usage 的响应。

---

## 缺口 4：候选切换/重试/工具调用/非账单文案

### 现有覆盖

- `AgentOrchestrationServiceImplTest` 用例 9-14 覆盖候选切换（429→锁定→切换→成功/耗尽失败）
- `AgentOrchestrationServiceImplTest` 用例 8 覆盖工具调用落库
- `ChatModelFactory429SpikeTest` 覆盖 HTTP 429 重试链路
- `AgentTokenUsageBehaviorTest.standard5_failedCall_shouldNotAffectTokenRecording` — 失败场景

### 缺口

- **候选切换后 Token 记录**: 无测试验证候选切换（从 configA 切到 configB）后，usedModelConfigId 正确且 Token 记录来自 configB 的调用
- **重试后 Token 记录**: 无测试验证 429 重试成功后 Token 是否正确记录（重试不产生额外 Token 记录）
- **工具调用场景的 Token**: 无测试验证 LLM 调用工具时的 Token 记录（工具调用本身不产生 Token，但 LLM 的 tool_calls 响应应记录 usage）
- **非账单文案**: 无测试验证 Token 字段的语义明确标注"非计费/账单用途"（仅代码注释级别，无运行时/接口级别断言）

### 建议测试结构

**A. 候选切换后 Token** (`AgentTokenUsageBehaviorTest` 或 `AgentOrchestrationServiceImplTest` 新增)

```java
@Test
@DisplayName("候选切换后 Token 记录来自实际服务的配置")
void candidateSwitch_tokenShouldMatchActualConfig() {
    // configA: 429 mock (prompt_tokens=10)
    // configB: 200 mock (prompt_tokens=50)
    // 调用 run(configA) → 切换到 configB → 验证 usedModelConfigId = configB
    // 验证 agent_message.inputTokens = 50 (来自 configB 的 mock 响应)
}
```

**B. 工具调用场景 Token** (`AgentOrchestrationServiceImplTest` 用例 8 扩展)

```java
// 在现有用例 8 基础上增加 Token 断言:
// 验证 ASSISTANT 消息的 inputTokens/outputTokens 非 null
// 验证两次 LLM 调用（tool_calls + 最终回复）的 Token 分别记录
```

**模拟方式**: 复用现有 `AgentOrchestrationServiceImplTest` 的 HttpServer mock 模式（按请求内容返回不同 usage）。

---

## 缺口 5：前端组件行为测试

### 现有覆盖

- `agent-token-frontend-exploration.md`（search_fallback）已有前端 Token 相关探索
- 前端无 Token 统计组件的行为测试（Vitest）

### 缺口

- **会话消息列表中 Token 字段展示**: 无测试验证消息列表正确渲染 inputTokens/outputTokens
- **执行历史列表中 Token 汇总展示**: 无测试验证执行历史列表正确展示 inputTokens/outputTokens
- **Token 为 null 时的 UI 行为**: 无测试验证 Token 为 null 时显示"-"或隐藏而非"null"
- **Token 为 0 时的 UI 行为**: 无测试验证 Token 为 0 时正确显示"0"而非隐藏

### 建议测试结构

**测试目录**: `Smart-WorkFlow-Web/src/modules/agent/__tests__/`

```typescript
// agent-conversation-message-token.spec.ts
describe('会话消息 Token 展示', () => {
  it('消息列表应渲染 inputTokens/outputTokens 字段')
  it('Token 为 null 时应显示占位符（- 或隐藏）')
  it('Token 为 0 时应显示 0')
  it('Token 大数值应格式化显示（如 1,234）')
})

// agent-execution-history-token.spec.ts
describe('执行历史 Token 展示', () => {
  it('执行列表应渲染 inputTokens/outputTokens 汇总')
  it('节点明细应展示逐节点 Token')
})
```

**模拟方式**: Mock API 响应（MSW 或 vitest mock），验证组件渲染行为。

---

## 缺口 6：历史兼容（迁移前 NULL 记录读取）

### 现有覆盖

- `AgentTokenUsageBehaviorTest.unknownUsage_shouldStoreNull_notZero` — 新记录 NULL 语义
- `AgentConversationServiceImpl.toMessageDTO` — 将 entity 的 null token 映射到 DTO 的 null

### 缺口

- **迁移前（V34 及更早）创建的 agent_message 记录的 input_tokens/output_tokens 列不存在或为 NULL**: 无测试验证通过 `listMessages` API 读取这些旧记录时，DTO 的 token 字段正确返回 null 而非报错
- **V35 Flyway 迁移后，旧数据的 token 列默认值**: 无测试验证迁移脚本对旧数据的处理

### 建议测试结构

**测试类**: `AgentTokenUsageBehaviorTest` 新增

```java
@Test
@DisplayName("历史兼容 - V34 迁移前创建的消息记录（token 列为 NULL）通过 listMessages API 正确返回 null")
void historicalRecords_tokenColumnNull_shouldReturnNullInDTO() {
    // 直接 INSERT 一条无 token 数据的 agent_message（模拟 V34 旧数据）
    // 调用 AgentConversationServiceImpl.listMessages(sessionId)
    // 验证 DTO 的 inputTokens == null, outputTokens == null
    // 验证不抛异常
}
```

**模拟方式**: JdbcTemplate 直接 INSERT 旧格式记录（不设 token 列），通过 Service 查询。

---

## 缺口 7：权限租户边界（新增会话 API/路由）

### 现有覆盖

- `AgentConversationControllerTest`:
  - 用例 1: 无权限 → 403
  - 用例 2: 有权限 → 200 + 结构
  - 用例 3: messages 200 + msg_order 升序
  - 用例 4: superAdmin 绕过
- `AgentGraphExecutionControllerTest` — 图执行端点权限测试

### 缺口

- **会话 API 无独立权限码**: 会话端点复用 `agent:model:view`，无独立的 `agent:conversation:view` 权限码
- **跨租户会话访问**: 无测试验证 tenant 100 的用户访问 tenant 200 的 sessionId → 404（租户拦截器）
- **跨用户会话访问**: 无测试验证 user A 的会话对 user B 不可见（`create_by` 过滤）
- **AgentOrchestrationRunRespDTO 无 token 字段**: 调用方无法从编排响应获取 Token 信息

### 建议测试结构

**A. 跨租户会话隔离** (`AgentConversationControllerTest` 新增)

```java
@Test
@DisplayName("跨租户访问 - tenant 100 的用户访问 tenant 200 的会话 → 404")
void crossTenantAccess_shouldReturn404() throws Exception {
    // tenant 200 创建 session（mock Service 返回）
    // tenant 100 尝试 GET /agent/conversations/{tenant200SessionId}/messages
    // 验证: 404 或 403
}
```

**B. 跨用户会话隔离** (`AgentTokenUsageBehaviorTest` 新增，集成测试)

```java
@Test
@DisplayName("跨用户隔离 - user 1 的会话对 user 2 不可见")
void crossUserIsolation_userCannotSeeOtherUserSessions() {
    // user 1 (tenant 100) 创建 session
    // 切换 LoginUserHolder 为 user 2 (tenant 100)
    // listConversations() → 不含 user 1 的 session
}
```

**模拟方式**: 复用现有 `AgentConversationControllerTest` 的 JWT + MockMvc 模式，或 `AgentTokenUsageBehaviorTest` 的 SpringBootTest + H2 集成模式。

---

## 缺口 8：Mock handler dispatch

### 现有覆盖

- `AgentTokenUsageBehaviorTest` 使用 JDK HttpServer mock OpenAI Chat Completions 端点
- `AgentOrchestrationServiceImplTest` 使用 JDK HttpServer mock
- `ChatModelFactory429SpikeTest` 使用 JDK HttpServer mock 429
- 前端 MSW mock 由 `pnpm dev:mock` 提供

### 缺口

- **Mock handler dispatch 测试**: 无测试验证 mock server 按请求内容分发不同响应的逻辑本身是否正确（如按 prompt_tokens 值分发、按 tool_calls 分发）
- **Mock handler 对不同协议的 dispatch**: 只 mock 了 openai 协议，无 mock 其他协议的 dispatch
- **Mock handler 边界**: 无测试验证 mock server 在异常输入（空 body、超大 body、非法 JSON）下的行为

### 建议测试结构

**测试类**: `AgentTokenUsageBehaviorTest` 或独立测试类

```java
@Test
@DisplayName("Mock dispatch - 按请求内容返回不同 usage 的响应")
void mockDispatch_basedOnRequestBody_shouldReturnDifferentUsage() {
    // mock handler: 请求含 "prompt_tokens" → 返回 usage
    // mock handler: 请求不含 "usage" → 返回无 usage 响应
    // 验证: 两次调用分别得到有/无 token 的消息记录
}
```

**模拟方式**: 复用现有 JDK HttpServer 模式，增加基于请求内容的分支逻辑。

---

## 已确定事实

| # | 事实 | 证据 |
|---|------|------|
| 1 | FORK/JOIN 拓扑测试存在但无 Token 断言 | `AgentGraphInterpreterTest` 用例 15/16/17/18/21, `AgentGraphExecutionServiceImplTest` 用例 16 |
| 2 | Token 聚合测试只有线性链和 LOOP | `AgentGraphInterpreterTokenTest` 4 个测试 |
| 3 | 会话级 Token 累计无测试 | `AgentTokenUsageBehaviorTest.multiTurn` 只验证"有值"不验证"求和" |
| 4 | 跨会话/跨租户 Token 隔离无测试 | 整个测试套件无此类用例 |
| 5 | 部分 usage / 明确 0 / total 自洽无测试 | `unknownUsage` 只测完全缺失 |
| 6 | 候选切换后 Token 记录无测试 | 用例 9-14 不验证 Token |
| 7 | 工具调用场景 Token 无断言 | 用例 8 不验证 Token 字段 |
| 8 | 前端无 Token 组件行为测试 | 无 Vitest 文件 |
| 9 | 历史兼容（旧数据 NULL 读取）无测试 | 无直接 INSERT 旧数据的测试 |
| 10 | 跨租户/跨用户会话隔离无测试 | ControllerTest 只测权限码，不测数据隔离 |
| 11 | AgentOrchestrationRunRespDTO 无 token 字段 | DTO 源码确认 |
| 12 | AgentConversationDTO 无会话级 token 汇总 | DTO 源码确认 |
| 13 | AgentSession 实体无 token 汇总列 | 实体源码确认 |
| 14 | 现有 mock 模式成熟可复用 | TokenChatModel/SequencedTokenChatModel/HttpServer mock |

## 关键实现细节（供测试编写参考）

### Token 数据流

```
ChatModel.call(Prompt) → ChatResponse.metadata.usage
  ↓
AgentGraphInterpreter.callLlmNode(): 读取 usage → 写入 NodeExecutionTrace.inputTokens/outputTokens
  ↓
AgentGraphFactory.storeTokenUsage(): 写入 ThreadLocal<UsageSnapshot>（仅 F01 路径）
  ↓
AgentOrchestrationServiceImpl.run(): 读取 ThreadLocal → insertMessage(sessionId, ASSISTANT, ..., inputTokens, outputTokens)
  ↓
AgentGraphExecutionServiceImpl.persistNodeTraces(): 读取 traces → 汇总 → 更新 execution.inputTokens/outputTokens
```

### 模拟工具清单

| 工具 | 用途 | 已有示例 |
|------|------|----------|
| `TokenChatModel(reply, promptTokens, completionTokens)` | 固定 token 注入 | AgentGraphInterpreterTokenTest |
| `SequencedTokenChatModel(replies, tokenSequences)` | 多次调用不同 token | AgentGraphInterpreterTokenTest |
| `JDK HttpServer + constructResponseBody(reqBody)` | 端到端 mock OpenAI | AgentTokenUsageBehaviorTest |
| `LoginUserHolder.set(loginUser)` | 租户/用户切换 | AgentTokenUsageBehaviorTest |
| `JdbcTemplate.execute(INSERT)` | 直接插入旧数据 | 无，需新增 |

## 是否需要继续探索

否。8 个缺口的测试结构已明确，包含：现有覆盖状态、具体缺口、建议测试方法名和签名、模拟方式、参考实现代码。

## 建议返回规划层的最小结论

1. **F02 FORK/JOIN Token**: 现有 `AgentGraphInterpreterTokenTest` 需新增 FORK/JOIN 场景的 Token 断言（2-3 个测试方法），复用 `TokenChatModel` 桩
2. **会话级累计/隔离**: `AgentTokenUsageBehaviorTest` 需新增 3 个测试（累计求和、跨会话隔离、跨租户隔离），复用现有 H2 集成模式
3. **Token 语义**: `AgentTokenUsageBehaviorTest` 需新增 3 个测试（部分 usage、明确 0、total 自洽），复用 HttpServer mock
4. **候选切换/工具 Token**: `AgentOrchestrationServiceImplTest` 需扩展用例 8（加 Token 断言）+ 新增候选切换 Token 测试
5. **前端行为**: 需新建 2 个 Vitest 测试文件（会话消息 Token 展示 + 执行历史 Token 展示）
6. **历史兼容**: `AgentTokenUsageBehaviorTest` 需新增 1 个测试（直接 INSERT 旧数据验证读取）
7. **权限租户**: `AgentConversationControllerTest` 需新增 2 个测试（跨租户/跨用户隔离）
8. **Mock dispatch**: 可选新增 1 个测试验证 mock handler 分发逻辑
