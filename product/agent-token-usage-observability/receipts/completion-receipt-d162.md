# M07-F04-02 完成回执（D162，提交COMPLETED）

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
- 修改 `AgentOrchestrationServiceImpl.run()`：从 ThreadLocal 读取 token 数据并持久化到 ASSISTANT 消息
- 修复 SparseStateSerializer 丢 Token 问题（ThreadLocal UsageSnapshot 模式）
- 修复 EmptyUsage 伪零问题（检测 EmptyUsage 实例不记录）

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
- 新增 AgentTokenUsageBehaviorTest：7 个测试（F01 Token 行为 + 会话累计 + Token 语义）
- 新增 AgentGraphInterpreterTokenTest：6 个测试（F02 Token 聚合：单/多LLM/LOOP/FORK-JOIN/同节点重复）
- Agent 模块全量回归：247 tests / 0 failures
- 前端四门：typecheck ✓, lint ✓, 79 files/775 tests ✓, build ✓
- Flyway 全链验证：H2 35 migrations ✓, PostgreSQL 35 migrations ✓

### Step 10: 知识库同步与回执
- 同步 knowledge/features/、knowledge/current-status.md、memory/state.md
- 同步 knowledge/known-issues.md（零变化）、memory/handoff.md、memory/features.md
- 同步 Smart-WorkFlow/功能清单.md（M07-F04-02 🟦→✅）
- 编写唯一权威测试回执

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
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java` | 提取 usage + ThreadLocal UsageSnapshot |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java` | 提取 usage + NodeExecutionTrace 扩展 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java` | 读取 ThreadLocal + finally 清除 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImpl.java` | 持久化节点 token + 汇总到执行记录 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentConversationServiceImpl.java` | 返回 token 字段 |
| 4 个现有测试类 | 添加 input_tokens/output_tokens 列到建表语句 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentTokenUsageBehaviorTest.java` | **新建**：F01 Token 行为专项测试（7个） |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTokenTest.java` | **新建**：F02 Token 聚合行为测试（6个） |

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
| `src/foundation/mock/agent-executions-data.ts` | Mock 数据添加 token 字段 |

## 4. 验收标准对照

| # | 验收标准 | 结果 |
|---|----------|------|
| 1 | F01/F02 均能读取 usage 并落库 | ✅ |
| 2 | 图执行级汇总覆盖多节点/循环/并行 | ✅ |
| 3 | 会话级汇总覆盖多轮调用 | ✅ |
| 4 | 未知值与 0 严格区分 | ✅ |
| 5 | 重试/失败不改变业务语义 | ✅ |
| 6 | 执行历史列表/详情展示 token 汇总 | ✅ |
| 7 | 历史数据兼容 | ✅ |
| 8 | 权限/租户隔离不受影响 | ✅ |
| 9 | Mock 模式复现未知/确定 token 语义 | ✅ |
| 10 | H2/PG 迁移链闭合 | ✅ |
| 11 | 无功能回归 | ✅ |
| 12 | 测试通过 | ✅ |
| 13 | 知识库全量同步 | ✅ |

## 5. 遇到的问题与修复
- **SparseStateSerializer 丢 Token**：graph state 合并时 token 数据丢失 → 修复：ThreadLocal UsageSnapshot 模式
- **EmptyUsage 伪零**：Spring AI EmptyUsage 返回 0 值而非 null → 修复：检测 EmptyUsage 实例不记录
- **F02 测试桩 usage 注入**：ChatResponse.getMetadata().getUsage() 从 ChatResponseMetadata 获取 → 修复：测试桩在 ChatResponseMetadata.builder().usage() 中注入 DefaultUsage

## 6. 执行终态：COMPLETED
