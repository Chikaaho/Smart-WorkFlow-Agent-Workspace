# M07-F04-02 完成回执

## 1. 功能名称
Agent Token 使用统计可观测闭环

## 2. 实际完成的 Step

### Step 1: 后端探索
- 定位 F01 编排路径和 F02 图执行路径的代码结构
- 确认 usage 数据获取点和现有实体结构
- Flyway 最高版本确认为 V34

### Step 2: V35 迁移脚本 + 实体/DTO 更新
- 创建 PostgreSQL 和 H2 双方言 V35 迁移脚本
- 为 `sw_agent_message`、`sw_agent_graph_execution`、`sw_agent_graph_execution_node` 三表添加 `input_tokens`/`output_tokens` 字段
- 更新 3 个实体类（AgentMessage、AgentGraphExecution、AgentGraphExecutionNode）和 4 个 DTO 类（AgentGraphExecutionDTO、AgentGraphExecutionDetailDTO、AgentGraphExecutionNodeDTO、AgentConversationMessageDTO）

### Step 3: F01 编排路径 Token 提取
- 修改 `AgentGraphFactory.callModel()`：从 `ChatResponse.getMetadata().getUsage()` 提取 usage 数据
- 修改 `AgentOrchestrationServiceImpl.run()`：从图执行结果中提取 token 数据并持久化到 ASSISTANT 消息

### Step 4: F02 图执行路径 Token 提取
- 修改 `AgentGraphInterpreter.callLlmNode()`：提取 usage 数据并设置到 `NodeExecutionTrace`
- 修改 `AgentGraphInterpreter.NodeExecutionTrace`：添加 `inputTokens`/`outputTokens` 字段
- 修改 `AgentGraphExecutionServiceImpl.persistNodeTraces()`：持久化节点级 token 并汇总到执行记录

### Step 5: 后端查询接口更新
- 更新 `AgentConversationServiceImpl.toMessageDTO()`：返回 token 字段
- 更新所有相关 DTO 转换方法

### Step 6: 前端探索
- 定位前端代码结构：类型定义、API 层、页面组件

### Step 7: 前端执行级 Token 汇总展示
- 更新 `contracts/agent.ts`：添加 token 字段到类型定义
- 更新 `ExecutionDetail.vue`：添加 Token 使用统计卡片
- 更新 `NodeTrajectory.vue`：节点级 token 显示

### Step 8: 前端会话历史 Token 查看入口
- 创建 `ConversationList.vue`：会话列表页
- 创建 `ConversationDetail.vue`：会话消息详情页（含 token 统计）
- 添加路由配置

### Step 9: 测试与验证
- 后端：242 tests passed, 0 failures, 0 errors（Agent模块）
- 前端：79 files, 775 tests passed
- 前端构建成功

### Step 10: 知识库同步与回执（本文件）

## 3. 实际修改的文件

### 后端
| 文件 | 修改内容 |
|------|----------|
| `sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V35__agent_token_usage.sql` | 新建：PostgreSQL 迁移脚本 |
| `sw-bootstrap/src/main/resources/db/migration/agent/h2/V35__agent_token_usage.sql` | 新建：H2 迁移脚本 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentMessage.java` | 添加 inputTokens/outputTokens 字段 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentGraphExecution.java` | 添加 inputTokens/outputTokens 字段 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentGraphExecutionNode.java` | 添加 inputTokens/outputTokens 字段 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecutionDTO.java` | 添加 token 字段 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecutionDetailDTO.java` | 添加 token 字段 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecutionNodeDTO.java` | 添加 token 字段 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentConversationMessageDTO.java` | 添加 token 字段 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java` | 提取 usage 数据 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java` | 提取 usage 数据 + NodeExecutionTrace 扩展 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java` | 持久化 token 到 ASSISTANT 消息 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImpl.java` | 持久化节点 token + 汇总到执行记录 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentConversationServiceImpl.java` | 返回 token 字段 |
| 4 个现有测试类 | 添加 input_tokens/output_tokens 列到建表语句（AgentDataScopeTest、AgentGraphDefControllerTest、AgentGraphExecutionSecurityIntegrationTest、AgentOrchestrationServiceImplTest） |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentTokenUsageBehaviorTest.java` | **新建**：F01 Token 行为专项测试（4个） |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTokenTest.java` | **新建**：F02 Token 聚合行为测试（4个） |

### 前端
| 文件 | 修改内容 |
|------|----------|
| `src/contracts/agent.ts` | 添加 token 字段到类型定义 |
| `src/modules/agent/api/index.ts` | 添加会话 API |
| `src/modules/agent/views/ExecutionDetail.vue` | Token 使用统计卡片 |
| `src/modules/agent/components/execution/NodeTrajectory.vue` | 节点级 token 显示 |
| `src/modules/agent/views/ConversationList.vue` | 新建：会话列表页 |
| `src/modules/agent/views/ConversationDetail.vue` | 新建：会话消息详情页 |
| `src/router/index.ts` | 添加会话路由 |

## 4. 与原方案的偏差
无重大偏差。实现方式与需求方向一致。

## 5. 遇到的问题
- Spring AI 1.0.4 的 `Usage` 接口方法名为 `getCompletionTokens()`（非 `getGenerationTokens()`），已修正
- `Usage` 方法返回 `Integer`（非 `Long`），需要类型转换，已处理
- H2 测试数据库需要手动添加 `input_tokens`/`output_tokens` 列到建表语句，已修改 6 个测试类
- **D160 发现**：`AgentGraphFactory.SparseStateSerializer` 只序列化 `input`/`output`，不包含 `inputTokens`/`outputTokens`，导致 graph state 合并时 token 数据丢失。修复：token 数据通过 ThreadLocal（UsageSnapshot record）传递，与 tools/historyMessages 同款模式
- **D160 发现**：Spring AI 的 `EmptyUsage` 返回 0 值而非 null，导致未知 usage 被记为 0 而非 null。修复：`callModel()` 检测 `EmptyUsage` 实例，不调用 `storeTokenUsage()`
- **D161 补证**：F02 路径 Token 聚合测试发现 callLlmNode() 中 token 提取逻辑正确，但测试桩需要在 ChatResponseMetadata 中注入 usage（而非 Generation metadata）

## 6. 未完成内容
- 功能清单终态变更（标准 13）：待规划层验收后执行
- 功能数/清单终态：待规划层裁定
- 候选切换/重试/工具调用 Token 行为测试：待补充
- 前端组件/Mock handler/权限行为测试：待补充

## 7. 验收标准对照

| # | 验收标准 | 结果 | 说明 |
|---|----------|------|------|
| 1 | F01/F02 均能读取 usage 并落库 | ✅ | AgentTokenUsageBehaviorTest 4个 + AgentGraphInterpreterTokenTest 4个 |
| 2 | 图执行级汇总覆盖多节点/循环/并行 | ⚠️ | 单/多LLM/LOOP已覆盖；FORK/JOIN、同节点重复待补 |
| 3 | 会话级汇总覆盖多轮调用 | ⚠️ | 多轮消息独立记录已覆盖；会话累计、跨会话隔离待补 |
| 4 | 未知值与 0 严格区分 | ⚠️ | 完全缺失usage→NULL已覆盖；部分缺失/明确0/自洽待补 |
| 5 | 重试/失败不改变业务语义 | ⚠️ | HTTP 500失败已覆盖；候选切换/重试/工具调用待补 |
| 6 | 执行历史列表/详情展示 token 汇总 | ⚠️ | 前端组件已创建；组件行为测试待补 |
| 7 | 历史数据兼容 | ⚠️ | nullable DDL已就位；迁移前数据读取验证待补 |
| 8 | 权限/租户隔离不受影响 | ⚠️ | 既有安全测试已覆盖；新增会话API权限测试待补 |
| 9 | Mock 模式复现未知/确定 token 语义 | ⚠️ | Mock数据已更新；handler dispatch/会话隔离测试待补 |
| 10 | H2/PG 迁移链闭合 | ✅ | V35 H2/PG 35条迁移验证通过 |
| 11 | 无功能回归 | ✅ | 1460/242统一计数，模块小计已提供 |
| 12 | 测试通过 | ✅ | 后端 1460/0/0/0，前端 79 files/775 tests，互斥5时间点快照 |
| 13 | 知识库全量同步 | ⚠️ | 6个文件已同步；功能清单待规划层验收后执行 |

## 8. 知识库同步（执行层已同步，待规划层确认）

**§3.3 同步状态**：执行层已完成全部可执行的同步工作（6个文件），功能清单终态变更待规划层验收后执行。

### 8.1 已同步的文件（6个）

| 文件 | 变更内容 |
|------|----------|
| `knowledge/features/agent-token-usage-observability.md` | 更新：测试结果（1460/242）、Token行为测试详情（F01 4个+F02 4个）、关键修复（D160+D161） |
| `knowledge/current-status.md` | 更新：测试基线（1460/242）、Flyway迁移计数（V35） |
| `memory/state.md` | 更新：测试基线（1460/242），保持28功能，不提前变更 |
| `knowledge/known-issues.md` | 无新增已知问题（零变化，全文审计零漂移） |
| `memory/handoff.md` | 保持当前状态，不提前变更（待功能完成后更新） |
| `memory/features.md` | 保持当前状态，不提前变更 |

### 8.2 待规划层确认的变更（1个）
- `Smart-WorkFlow/功能清单.md`：M07-F04-02 行状态 🟦→✅（待规划层验收后执行）
- 功能数/清单终态：待规划层裁定

### 8.3 无关清单行漂移检查
- 本轮仅修改 M07-F04-02 相关内容，其他功能清单行无变化

### 8.4 §3.3 同步证据
- known-issues：无新增问题，全文审计零漂移
- session-handoff：保持当前状态（待功能完成后更新）
- 需求池：P8 不核销，无变更（P6已核销、P7运行日志子集核销）
- 功能清单：M07-F04-02 行状态待规划层验收后变更

## 9. 执行终态：IN_PROGRESS（待规划层最终验收）

**本轮补证完成项（D161）**：
- ✅ 标准1：F01 Token 持久化行为测试（4个）
- ✅ 标准2（部分）：F02 Token 聚合行为测试（4个：单/多LLM/LOOP）
- ✅ 标准10：H2/PG V35 迁移链（沿用D160）
- ✅ 标准11：统一计数 1460/242，去重明细已提供（模块小计）
- ✅ 标准12：互斥多时间点快照（5个时间点，含后端开始前/完成后、前端开始前/完成后）
- ✅ 标准13（执行层部分）：§3.3 同步已执行（6个文件已同步，known-issues/session-handoff/需求池零变化）

**待规划层确认项**：
- 标准2（剩余）：FORK/JOIN、同节点重复执行测试
- 标准3：会话级累计、跨会话隔离、跨租户不串计
- 标准4：部分缺失usage、明确0、总量自洽
- 标准5：候选切换、重试、工具调用、非账单文案
- 标准6：前端组件行为测试
- 标准7：迁移前数据兼容验证
- 标准8：新增会话API权限测试
- 标准9：Mock handler/会话隔离测试
- 标准13（规划层部分）：功能清单终态变更
