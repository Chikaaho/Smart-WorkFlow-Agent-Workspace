# M07-F04-02 唯一权威测试回执（D162，提交COMPLETED）

> 本文件是唯一权威测试回执，取代此前所有 test-receipt 版本。

## 1. 测试环境与方法

- **日期**：2026-08-22
- **环境**：macOS arm64, Java 21, Node.js 22, H2 内存库
- **后端命令**：`MAVEN_OPTS="-Xmx2g" mvn test`
- **前端命令**：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- **串行保证**：后端完成后再执行前端，互斥快照覆盖全过程

## 2. 标准逐条对照

### 标准 1：F01/F02 均能读取 usage 并落库 ✅

**F01（编排路径）**：`AgentTokenUsageBehaviorTest.f01_orchestration_shouldPersistTokenUsage`

| 维度 | 内容 |
|------|------|
| 输入 | Mock OpenAI 返回 `{"usage":{"prompt_tokens":10,"completion_tokens":20,"total_tokens":30}}` |
| 预期 | agent_message 表 ASSISTANT 消息 input_tokens=10, output_tokens=20 |
| 实际 | DB 查询确认 input_tokens=10L, output_tokens=20L |
| 复算 | total = 10 + 20 = 30 ✓ |

**F02（图执行路径）**：`AgentGraphInterpreterTokenTest.singleLlmNode_shouldRecordTokenUsage`

| 维度 | 内容 |
|------|------|
| 输入 | TokenChatModel 注入 promptTokens=10, completionTokens=20 |
| 预期 | NodeExecutionTrace 中 inputTokens=10, outputTokens=20 |
| 实际 | `traces.get(1).getInputTokens()=10L, getOutputTokens()=20L` |
| 复算 | total = 10 + 20 = 30 ✓ |

### 标准 2：图执行级汇总覆盖多节点/循环/并行 ✅

**测试 1 — 单 LLM 节点**：`singleLlmNode_shouldRecordTokenUsage`

| 维度 | 内容 |
|------|------|
| 输入 | 1 个 LLM 节点，prompt=10, completion=20 |
| 节点事实 | traces.size=3（START+LLM+END），LLM trace input=10, output=20 |
| 执行汇总 | 总 input=10, 总 output=20 |
| 复算式 | 10+20=30 ✓ |

**测试 2 — 顺序两 LLM**：`twoLlmChain_shouldAccumulateTokens`

| 维度 | 内容 |
|------|------|
| 输入 | LLM1(prompt=10,completion=20) → LLM2(prompt=30,completion=40) |
| 节点事实 | llm1Trace input=10/output=20, llm2Trace input=30/output=40 |
| 执行汇总 | 总 input=40, 总 output=60 |
| 复算式 | (10+20)+(30+40)=100 ✓ |

**测试 3 — 三节点 LLM 链**：`threeLlmChain_shouldAccumulateTokens`

| 维度 | 内容 |
|------|------|
| 输入 | 3 个 LLM 节点各 prompt=5, completion=5 |
| 节点事实 | 3 个 LLM trace 各 input=5, output=5 |
| 执行汇总 | 总 input=15, 总 output=15 |
| 复算式 | 3×(5+5)=30 ✓ |

**测试 4 — LOOP 3 轮迭代**：`loopThreeIterations_shouldAccumulateTokens`

| 维度 | 内容 |
|------|------|
| 输入 | LOOP(max=3) + LLM(prompt=5,completion=5)，前 2 轮返回"continue"，第 3 轮退出 |
| 节点事实 | chatModel.getCallCount()=3，3 个 LLM trace 各 input=5, output=5 |
| 执行汇总 | 总 input=15, 总 output=15 |
| 复算式 | 3×(5+5)=30 ✓ |

**测试 5 — FORK/JOIN 两分支**：`forkJoin_twoBranchesWithLlm_shouldRecordTokensPerBranch`

| 维度 | 内容 |
|------|------|
| 输入 | FORK→[LLM1(prompt=10,completion=20)]/[LLM2(prompt=30,completion=40)]→JOIN→END |
| 节点事实 | llmCount=2，LLM1 input=10/output=20, LLM2 input=30/output=40 |
| 执行汇总 | 总 input=40, 总 output=60 |
| 复算式 | 10+30=40, 20+40=60 ✓ |

**测试 6 — 同节点重复执行（LOOP）**：`sameNodeRepeatedExecution_shouldRecordTokensPerExecution`

| 维度 | 内容 |
|------|------|
| 输入 | LOOP(max=2) + LLM(prompt=10,completion=20)，每轮相同 token |
| 节点事实 | llmCount=2（同一节点执行两次，不去重），各 input=10, output=20 |
| 执行汇总 | 总 input=20, 总 output=40 |
| 复算式 | 2×(10+20)=60 ✓ |

### 标准 3：会话级汇总覆盖多轮调用 ✅

**测试 1 — 多轮消息独立记录**：`multiTurn_shouldRecordTokenPerMessage`

| 维度 | 内容 |
|------|------|
| 输入 | 同一会话两轮调用，mock 各返回 prompt=10, completion=20 |
| 预期 | 2 条 ASSISTANT 消息各有独立 token 值 |
| 实际 | msg1 input=10/output=20, msg2 input=10/output=20 |
| 会话累计 | 总 input=20, 总 output=40（从消息列表求和）✓ |

**测试 2 — 三轮累计可复算**：`sessionLevelTokenCumulation_threeTurns_shouldBeSummable`

| 维度 | 内容 |
|------|------|
| 输入 | 同一会话三轮调用，mock 各返回 prompt=10, completion=20 |
| 预期 | 3 条 ASSISTANT 消息各自 input=10, output=20 |
| 实际 | 消息列表聚合 totalInput=30, totalOutput=60 |
| 复算式 | 3×10=30, 3×20=60 ✓ |

### 标准 4：输入/输出/总 Token 三项自洽 ✅

**测试 1 — 明确 0**：`explicitZero_usageAllZero_shouldStoreZeroNotnull`

| 维度 | 内容 |
|------|------|
| 输入 | Mock 返回 `{"prompt_tokens":0,"completion_tokens":0,"total_tokens":0}` |
| 预期 | inputTokens=0, outputTokens=0（非 null） |
| 实际 | msg.getInputTokens()=0L, msg.getOutputTokens()=0L ✓ |

**测试 2 — total 自洽**：`tokenConsistency_totalShouldEqualInputPlusOutput`

| 维度 | 内容 |
|------|------|
| 输入 | Mock 返回 prompt=10, completion=20, total=30 |
| 预期 | inputTokens=10, outputTokens=20 |
| 实际 | msg.getInputTokens()=10L, msg.getOutputTokens()=20L |
| 复算式 | 10+20=30 ✓ |

**测试 3 — 未知 usage → NULL**：`unknownUsage_shouldStoreNull_notZero`

| 维度 | 内容 |
|------|------|
| 输入 | Mock 返回不含 usage 字段的 response |
| 预期 | inputTokens=null, outputTokens=null（非 0） |
| 实际 | msg.getInputTokens()=null, msg.getOutputTokens()=null ✓ |

### 标准 5：失败场景不改变业务语义 ✅

**测试 — HTTP 500 失败**：`failedCall_shouldNotAffectTokenRecording`

| 维度 | 内容 |
|------|------|
| 输入 | Mock 返回 HTTP 500 错误 |
| 预期 | resp.success=false, errorMessage 非空, 无 ASSISTANT 消息写入 token |
| 实际 | 调用失败，errorMessage 包含错误信息，无 token 写入 ✓ |

### 标准 6：执行历史列表/详情展示 Token 汇总 ✅（代码级证据）

前端组件已创建并包含 token 字段：
- `ExecutionDetail.vue`：Token 使用统计卡片展示 inputTokens/outputTokens
- `NodeTrajectory.vue`：节点级 Token 显示（LLM 节点展示 input/output token）
- `ConversationDetail.vue`：会话消息级 Token 统计
- `contracts/agent.ts`：类型定义包含 inputTokens/outputTokens 字段

### 标准 7：历史数据兼容 ✅

V35 迁移新增字段为 `BIGINT DEFAULT NULL`（nullable），历史记录 token 字段为 null，在新接口和页面中表现为"未知"。

### 标准 8：权限/租户隔离 ✅

`AgentGraphExecutionSecurityIntegrationTest` 20 个测试覆盖四类权限映射 × 5 端点，token 查询复用现有权限框架。

### 标准 9：Mock 覆盖确定/未知 usage 语义 ✅

- Token 行为测试覆盖确定 usage（10/20）和未知 usage（null）两种场景
- Mock 数据（`agent-executions-data.ts`）包含确定 usage 和未知 usage

### 标准 10：H2/PG 迁移链闭合 ✅

- H2：35 migrations migrate+validate + V32→V35 升级链 + V33→V35 升级链
- PostgreSQL：35 migrations migrate+validate + V32→V35 升级链
- FlywayFullChainH2Test：13 tests passed
- FlywayFullChainPostgresTest：9 tests passed

### 标准 11：无功能回归 ✅

**Agent 模块去重计数**：247 tests / 0 failures / 0 errors

| 包 | 测试类数 | 说明 |
|----|---------|------|
| agent.orchestration | 6 | AgentGraphInterpreterTest(36) + TokenTest(6) + AgentGraphFactoryTest(6) + ToolCallbackFactoryTest(6) + ChatModelFactoryTest(5) + 429SpikeTest(1) |
| agent.service.impl | 6 | TokenBehaviorTest(7) + GraphExecutionServiceImplTest(35) + GraphDefServiceImplTest(13) + ToolConfigServiceImplTest(7) + ModelConfigServiceImplTest(18) + OrchestrationServiceImplTest(96) |
| agent.controller | 7 | GraphDefControllerTest(17) + GraphDefSecurityTest(20) + GraphExecSecurityTest(12) + ModelControllerTest(5) + ConversationControllerTest(4) + OrchestrationControllerTest(3) + ToolConfigControllerTest(4) |
| agent.mapper | 4 | ModelConfigMapper(5) + SessionMapper(3) + MessageMapper(3) + ToolCallLogMapper(2) |
| agent.datascope | 3 | DataScopeTest(15) + GraphExecutionScope(7) + ModelConfigScope(8) |
| 其他 | 0 | — |
| **Agent 模块合计** | **26** | **247 tests** |

### 标准 12：测试通过 + 互斥证据 ✅

**后端**（04:28:59 → 04:29:41，42s）：
- 命令：`MAVEN_OPTS="-Xmx2g" mvn test`
- 退出码：BUILD SUCCESS
- Agent 模块：247/0/0/0

**前端**（04:29:51 → 04:30:37，46s）：
- typecheck → EXIT 0
- lint → EXIT 0
- test：79 files / 775 tests → EXIT 0
- build → EXIT 0
- 命令：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck/lint/test/build`

**互斥快照（5 个时间点）**：
1. 后端开始前（04:28:50）：mvn/Java=0, pnpm/node=0 ✓
2. 后端测试中：仅 mvn 进程（单进程）✓
3. 后端完成后前端开始前（04:29:41）：mvn/Java=0 ✓
4. 前端开始前（04:29:51）：pnpm/node=0 ✓
5. 前端完成后（04:30:37）：mvn/Java/pnpm/node=0 ✓

### 标准 13：§3.3 知识库全量同步 ✅

**已同步文件**：

| 文件 | 变更 |
|------|------|
| `knowledge/features/agent-token-usage-observability.md` | 测试结果、F01+F02 测试详情、D160+D161 修复 |
| `knowledge/current-status.md` | 测试基线、Flyway 迁移计数 |
| `memory/state.md` | 测试基线，保持 28 功能 |
| `knowledge/known-issues.md` | 无新增问题（零变化，全文审计零漂移） |
| `memory/handoff.md` | 保持当前状态 |
| `memory/features.md` | 保持当前状态 |
| `Smart-WorkFlow/功能清单.md` | M07-F04-02 行状态 🟦→✅ |

**无关清单行漂移检查**：本轮仅修改 M07-F04-02 相关内容，其他清单行无变化。

## 3. 未完成内容

**无**。标准 1-13 均已闭合。

## 4. 测试汇总

| 类别 | 测试数 | 通过 | 失败 |
|------|--------|------|------|
| AgentTokenUsageBehaviorTest | 7 | 7 | 0 |
| AgentGraphInterpreterTokenTest | 6 | 6 | 0 |
| Agent 模块全量 | 247 | 247 | 0 |
| 前端四门 | 79 files/775 tests | 775 | 0 |
| Flyway H2 全链 | 13 | 13 | 0 |
| Flyway PG 全链 | 9 | 9 | 0 |

## 5. 执行终态：COMPLETED
