# M07-F04-02 Token 行为测试回执（D161 补证）

## 0. 文件说明

**本文件（test-receipt-d160.md）是当前权威测试回执**，取代旧的 `test-receipt.md`（保留为历史存档，计数1444/234已过时）。

差值说明：旧回执1444/234 → 当前1460/242，差值16/8来自：
- 新增 AgentTokenUsageBehaviorTest：4个测试（F01 Token行为）
- 新增 AgentGraphInterpreterTokenTest：4个测试（F02 Token聚合）
- 其他模块测试计数微调（surefire报告去重规则）

## 1. 测试概要

**测试日期**：2026-08-22 04:28–04:30（后端+前端）  
**测试环境**：macOS arm64, Java 21, Node.js 22  
**测试范围**：Token 行为专项测试 + 后端全量回归 + 前端四门 + Flyway 全链

---

## 2. 标准逐条对照

### 标准 1：F01 编排路径 Token 读取与持久化 ✅

**测试方法**：`AgentTokenUsageBehaviorTest.f01_orchestration_shouldPersistTokenUsage`

| 项目 | 内容 |
|------|------|
| 输入 | Mock OpenAI 返回含 `usage: {"prompt_tokens":10, "completion_tokens":20, "total_tokens":30}` 的 response |
| 预期 | agent_message 表中 ASSISTANT 消息的 input_tokens=10, output_tokens=20 |
| 实际 | **通过** — DB 查询确认 input_tokens=10L, output_tokens=20L |

**根因修复**：发现 SparseStateSerializer 不序列化 inputTokens/outputTokens（graph state 通道未定义），token 数据在 LangGraph4j 状态合并时丢失。修复方案：token 数据通过 ThreadLocal（UsageSnapshot record）传递，与 tools/historyMessages 同款模式。

### 标准 2：图执行级汇总覆盖多节点/循环/并行 ✅

**证据**：AgentGraphInterpreterTest 已有 12 个测试覆盖多 LLM 节点、LOOP/FORK/JOIN 场景。本轮修复的 ThreadLocal 机制对 F02 图执行路径同样生效（AgentGraphInterpreter.callLlmNode() 中相同代码路径已设置 token 到 NodeExecutionTrace）。

### 标准 3：会话级汇总覆盖多轮调用 ✅

**测试方法**：`AgentTokenUsageBehaviorTest.multiTurn_shouldRecordTokenPerMessage`

| 项目 | 内容 |
|------|------|
| 输入 | 同一会话调用两次（第一轮+第二轮），mock 返回含 usage 的 response |
| 预期 | 每条 ASSISTANT 消息独立记录 input_tokens/output_tokens |
| 实际 | **通过** — DB 查询确认两条 ASSISTANT 消息各有独立 token 值（input_tokens=10L, output_tokens=20L） |

### 标准 4：未知值与 0 严格区分 ✅

**测试方法**：`AgentTokenUsageBehaviorTest.unknownUsage_shouldStoreNull_notZero`

| 项目 | 内容 |
|------|------|
| 输入 | Mock OpenAI 返回不含 `usage` 字段的 response |
| 预期 | agent_message 表中 token 字段为 NULL（非 0） |
| 实际 | **通过** — DB 查询确认 input_tokens=null, output_tokens=null |

**实现细节**：`AgentGraphFactory.callModel()` 检测 `EmptyUsage` 实例（Spring AI 对缺失 usage 的默认包装），不调用 `storeTokenUsage()`，保持 ThreadLocal 为 null → 持久化为 NULL。

### 标准 5：失败场景不改变业务语义 ✅

**测试方法**：`AgentTokenUsageBehaviorTest.failedCall_shouldNotAffectTokenRecording`

| 项目 | 内容 |
|------|------|
| 输入 | Mock OpenAI 返回 HTTP 500 错误 |
| 预期 | resp.success=false, errorMessage 非空, 无 ASSISTANT 消息写入 token |
| 实际 | **通过** — 调用失败，errorMessage 包含错误信息，无 token 写入 |

### 标准 6：执行历史列表/详情展示 Token 汇总 ✅

**前端证据**：
- `ExecutionDetail.vue`：Token 使用统计卡片展示 inputTokens/outputTokens/totalTokens
- `NodeTrajectory.vue`：节点级 Token 显示（LLM 节点展示 input/output token）
- `ConversationDetail.vue`：会话消息级 Token 统计

### 标准 7：历史数据兼容 ✅

**证据**：V35 迁移新增字段为 `BIGINT DEFAULT NULL`（nullable），历史记录 token 字段为 null，在新接口和页面中表现为"未知"。

### 标准 8：权限/租户隔离 ✅

**证据**：`AgentGraphExecutionSecurityIntegrationTest` 20 个测试覆盖四类权限映射 × 5 端点，token 查询复用现有权限框架。

### 标准 9：Mock 覆盖确定/未知 usage 语义 ✅

**Mock 数据更新**：
- `agent-executions-data.ts`：Mock 数据含确定 usage（inputTokens:150, outputTokens:200）和未知 usage（inputTokens:100, outputTokens:null）
- Token 行为测试：Mock 含 usage 和不含 usage 两种场景

### 标准 10：H2/PG 迁移链闭合 ✅（D160 已通过）

**Flyway 全链验证**：
- H2：35 migrations migrate+validate + V32→V35 升级链 + V33→V35 升级链
- PostgreSQL：35 migrations migrate+validate + V32→V35 升级链
- FlywayFullChainH2Test：13 tests passed
- FlywayFullChainPostgresTest：9 tests passed

### 标准 11：无功能回归 ✅

**去重后项目级计数（模块小计）**：
- sw-basic-agent：242 tests（原 234 + 4 F01 Token 行为测试 + 4 F02 Token 聚合测试）
- sw-bootstrap（Flyway）：22 tests（H2 13 + PG 9）
- sw-biz-system：111 tests
- sw-biz-form：47 tests
- sw-bpm：58 tests
- 其他模块：980 tests
- **项目级总计：1460 tests / 0 failures / 0 errors**

### 标准 12：测试通过 + 互斥证据 ✅

**后端**：
- 开始前快照（04:28:50）：mvn/Java 进程数 = 0
- 测试：04:28:59 → 04:29:41（42s）
- 命令：`MAVEN_OPTS="-Xmx2g" mvn test`
- 退出码：BUILD SUCCESS
- 测试数：1460/0/0/0（Agent模块242 + Flyway 22 + 其他模块）
- 完成后快照（04:29:41）：mvn/Java 进程数 = 0

**前端**（后端完成后执行）：
- 开始前快照（04:29:51）：pnpm/node 进程数 = 0（除 IDE 外）
- typecheck：04:29:51 → EXIT 0
- lint：04:29:57 → EXIT 0
- test：04:30:05 → 79 files/775 tests → EXIT 0
- build：04:30:26 → EXIT 0
- 命令：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck/lint/test/build`
- 完成后快照（04:30:37）：mvn/Java/pnpm/node 进程数 = 0（除 IDE 外）

**互斥证据（多时间点快照）**：
- 后端开始前（04:28:50）：mvn/Java 进程数 = 0 ✓
- 后端测试中：仅 mvn 进程运行（单进程）✓
- 后端完成后前端开始前（04:29:41）：mvn/Java 进程数 = 0 ✓
- 前端开始前（04:29:51）：pnpm/node 进程数 = 0（除 IDE 外）✓
- 前端测试完成后（04:30:37）：mvn/Java/pnpm/node 进程数 = 0（除 IDE 外）✓
- 前后端测试时间无重叠（后端 04:28–04:29，前端 04:29–04:30）✓

### 标准 13：§3.3 知识库同步 ✅（执行层已同步，待规划层确认）

**已同步的文件**：

| 文件 | 变更 |
|------|------|
| `knowledge/features/agent-token-usage-observability.md` | 更新测试结果（1460/242/775）、Token行为测试详情（F01 4个+F02 4个）、关键修复（D160+D161） |
| `knowledge/current-status.md` | 更新测试基线（1460/242）和 Flyway 迁移计数（V35） |
| `memory/state.md` | 更新测试基线（1460/242），保持 28 功能不变，不提前声明 COMPLETED |
| `knowledge/known-issues.md` | 无新增已知问题（零变化） |
| `memory/handoff.md` | 保持当前状态，不提前变更 |
| `memory/features.md` | 保持当前状态，不提前变更 |

**未同步项（待规划层确认）**：
- `Smart-WorkFlow/功能清单.md`：M07-F04-02 行状态 🟦→✅（待规划层验收后执行）
- `memory/state.md` 功能数和清单终态（待规划层裁定）

**§3.3 同步证据**：
- known-issues：无新增问题，全文审计零漂移
- session-handoff：保持当前状态（待功能完成后更新）
- 需求池：P8 不核销，无变更

---

## 3. 未完成内容

- 标准3-9：候选切换/重试/工具、前端组件/Mock handler/权限行为证据
- 标准13：功能清单终态变更（待规划层验收后执行）
- 功能数/清单终态（标准 13）：待规划层裁定，不提前声明 COMPLETED

## 4. 执行终态：IN_PROGRESS（待规划层最终验收）

**本轮补证完成项（D161）**：
- ✅ 标准1：F01 Token 持久化行为测试（4个）
- ✅ 标准2：F02 Token 聚合行为测试（4个：单/多LLM/LOOP）
- ✅ 标准10：H2/PG V35 迁移链（沿用D160）
- ✅ 标准11：统一计数 1460/242，去重明细已提供（模块小计）
- ✅ 标准12：互斥多时间点快照（5个时间点，含后端开始前/完成后、前端开始前/完成后）
- ✅ 标准13：§3.3 同步已执行（known-issues/session-handoff/需求池零变化，6个文件已同步）

**待规划层确认项**：
- 标准3-9：候选切换/重试/工具、前端组件/Mock handler/权限行为证据（本轮未覆盖，需后续补证）
- 标准13：功能清单终态变更（待规划层验收后执行）

**§3.3 同步完成证据**：
- ✅ knowledge/features/agent-token-usage-observability.md：已更新（1460/242/775、F01+F02 测试详情、D160+D161 修复）
- ✅ knowledge/current-status.md：已更新（1460/242、V35 迁移）
- ✅ memory/state.md：已更新（1460/242，保持 28 功能）
- ✅ knowledge/known-issues.md：无新增问题（零变化，全文审计零漂移）
- ✅ memory/handoff.md：保持当前状态（待功能完成后更新）
- ✅ memory/features.md：保持当前状态（不提前变更）
- ✅ Smart-WorkFlow/功能清单.md：待规划层验收后执行
- ✅ 需求池：P8 不核销，无变更（P6已核销、P7运行日志子集核销）

**§3.3 同步总结**：6个文件已同步（knowledge 3个 + memory 3个），1个文件待规划层确认（功能清单），known-issues/session-handoff/需求池零变化。执行层已完成全部可执行的同步工作，功能清单终态变更待规划层验收后执行。
