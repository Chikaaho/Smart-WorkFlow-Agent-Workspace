# Agent Token 使用统计可观测闭环

## 功能编号
M07-F04-02 / P8

## 功能状态
**D170功能级PASSED + D172阶段三PASSED，13/13；D173终态文字已同步，等待规划层零残留确认（第29个已完成功能）**

## 功能概述
让有权用户能够从既有 Agent 执行与会话历史中看到供应商实际返回的输入、输出和总 Token 用量，并在多次模型调用场景下获得可追溯、可聚合且不伪装成计费数据的使用统计。

## 完成日期
功能级PASSED 2026-08-22（D170）；阶段三PASSED 2026-08-22（D172）；终态文字已同步 D173

## D170 功能级结论（2026-08-22）
- 标准1—12全部PASSED，标准13进入阶段三。
- D169闭合标准6（真实router.push+组件挂载到页）、标准11（723幽灵1项溯源：D150 +13含1无文件落点、当前755/Agent267/非Agent488自洽）、标准12（不自匹配pgrep零快照+2G串行门禁，新鲜轮08:57:33—08:58:18后端、08:58:31—08:59:52前端严格串行）。
- D170确认功能级基线：后端755/0/0/0（agent 267）、前端82f/815t四门全绿、Flyway V35双方言35条全链（H2/PG新库+ V33→V35/V34→V35升级链均通过）。
- P8已核销、M07-F04-02已升✅（清单25/25/40）、功能数29。
- D172确认标准13 PASSED，累计13/13；P8已核销、M07-F04-02✅、清单25/25/40、功能数29、后端755/Agent267、前端82f/815t、V35。
- 审查：`product/agent-token-usage-observability/receipts/planning-functional-review-d170.md`；阶段三审查：`product/agent-token-usage-observability/receipts/planning-stage3-review-d172.md`；终态入口：`product/agent-token-usage-observability/ready/executor-terminal-sync-prompt-d173.md`（当前唯一入口，D171已归档至`passed/`）。
- 历史阶段三入口：`product/agent-token-usage-observability/passed/executor-stage3-prompt-d171.md`（已归档，非当前入口）。

## 十三项验收
| # | 结论 | 证据 |
|---|:---:|------|
| 1 | PASSED | F01编排与F02图执行双路径持久化，usage经供应商响应进入消息/执行/节点记录 |
| 2 | PASSED | 图执行级聚合：单节点/多LLM链/LOOP重复/并行分支，同节点多次执行不去重，Σ节点=执行汇总可复算 |
| 3 | PASSED | 会话级累计：多轮调用各消息独立记录，会话汇总可由消息列表求和；跨会话/跨租户不串计 |
| 4 | PASSED | 已知/未知严格区分：缺失usage存NULL不写零，部分usage独立null，不估算；成功调用不因统计失败 |
| 5 | PASSED | 候选切换/重试/工具调用/失败链：只统计当前可取得usage，失败后不落token事实；界面不宣称为账单 |
| 6 | PASSED | 执行历史列表/详情可见执行级汇总，会话历史具备最小可达页面查看会话汇总及消息明细，未知值清晰；真实router导航到页 |
| 7 | PASSED | 历史兼容：迁移前记录表现为未知，分页/详情/轨迹/消息/错误仍可读取；V35可为空升级 |
| 8 | PASSED | 权限与隔离：Agent权限/未认证拒绝/撤权拒绝/superadmin放行/租户隔离/逻辑删除边界满足 |
| 9 | PASSED | Mock：确定/未知/多调用聚合/会话隔离/无权访问与真实DTO一致 |
| 10 | PASSED | V35 H2/PG双迁移链、校验和升级路径闭合，迁移仅含本功能字段 |
| 11 | PASSED | Prompt/变量/图调度/执行历史/会话消息/多Key轮询无回归；非目标能力未新增 |
| 12 | PASSED | 后端755/0/0/0、前端82f/815t四门全绿，2G串行门禁与不自匹配零快照通过 |
| 13 | PASSED | D172确认PASSED：P8已核销、M07-F04-02✅、清单25/25/40、功能数29、755/Agent267、82f/815t、V35；knowledge四文件全文同步、memory五文件压缩同步、零虚构编号、当前态旧词零残留 |

## 实现范围

### 后端
- V35 Flyway 迁移脚本（PostgreSQL + H2，双方言可为空）
- 三表添加 `input_tokens`/`output_tokens` 字段：
  - `sw_agent_message`（会话消息级）
  - `sw_agent_graph_execution`（图执行级汇总）
  - `sw_agent_graph_execution_node`（图执行节点级）
- F01 编排路径：`AgentGraphFactory.callModel()` 经 `TokenUsageResolver` 提取 usage，`AgentOrchestrationServiceImpl` 经 ThreadLocal UsageSnapshot 落库
- F02 图执行路径：`AgentGraphInterpreter.callLlmNode()` 经 `TokenUsageResolver` 提取 usage，`persistNodeTraces` 聚合落库
- 查询接口返回 token 字段（执行/节点/会话消息列表/详情）

### 前端
- TypeScript 类型定义更新（inputTokens/outputTokens可为空，未知时null）
- 执行详情页 Token 使用统计卡片（含确定/未知/部分语义）
- 节点轨迹组件 Token 显示（LLM节点，未知显示"未知"）
- 会话历史列表页 + 消息详情页（含会话汇总及消息级明细）
- Mock handlers/fixtures 契约同步

## 关键设计决策
1. **未知值与 0 严格区分**：供应商未返回 usage 时存储为 NULL，不为 0；部分usage独立null
2. **总 Token 不单独存储**：由 input + output 计算得出
3. **Spring AI Usage API**：使用 `getCompletionTokens()`（非 `getGenerationTokens()`），经 `TokenUsageResolver` 统一原生字段读取
4. **类型转换**：Usage 方法返回 Integer，需要转换为 Long；DefaultUsage null→0归一规避
5. **多调用聚合**：图执行按Σ节点求和，会话按消息列表求和；循环/并行/重复执行不去重

## 测试结果
- **功能级基线（D170）**：后端 755/0/0/0（agent 267）、前端 82 files / 815 tests / 0 failures 四门全绿、Flyway V35双方言35条全链
- **验证（D169新鲜门禁）**：后端08:57:33—08:58:18、前端08:58:31—08:59:52严格串行，2G上限，pgrep字符类不自匹配零快照（exit 1/0），BUILD SUCCESS / typecheck-lint-test-build全绿
- **Flyway（标准10）**：H2/PG 新库35条 migrate+validate + V33→V35 / V34→V35升级链通过

## 实际修改范围
- 迁移：`sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V35__agent_token_usage.sql`
- 后端实体/DTO：`sw-basic/sw-basic-agent` 三表实体与查询DTO新增token字段
- 后端逻辑：`AgentGraphFactory` / `AgentGraphInterpreter` / `TokenUsageResolver` / Service落库
- 前端：`Smart-WorkFlow-Web/src/contracts/agent.ts`、`src/modules/agent/views/`、`src/mocks/handlers.ts`
- 测试：`AgentTokenUsageBehaviorTest`、`AgentGraphInterpreterTokenTest`、`AgentGraphExecutionServiceImplTest`、`AgentOrchestrationServiceImplTest`、`AgentConversationControllerTest`、`ConversationList/Detail.spec`、`ExecutionDetail/NodeTrajectory token`、`agent-conversation-handlers.spec`

## 已知限制
- 金额换算/账单对账/预算/告警/配额扣减不在本轮
- 趋势图/排行/跨租户总览/导出/BI仪表盘不在本轮
- SSE对话窗口/助手配置/RAG/工具管理页/单步调试不在本轮
- 统计口径为"供应商响应可观测usage"，不等于厂商账单

## 风险与后续
- 供应商未返回usage时正确显示未知，不参与虚假汇总
- 互斥门禁与2G约束已验证，不新增本轮外能力
- 下一动作：D173终态文字已同步，等待规划层零残留确认后标记COMPLETED

## 相关文件
- 方向：`product/agent-token-usage-observability/passed/direction-agent-token-usage-observability.md`
- 审查：`product/agent-token-usage-observability/receipts/planning-functional-review-d170.md`
- 阶段三Prompt（历史）：`product/agent-token-usage-observability/passed/executor-stage3-prompt-d171.md`（已归档）
- 终态Prompt（当前唯一入口）：`product/agent-token-usage-observability/ready/executor-terminal-sync-prompt-d173.md`
- 迁移脚本：`sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V35__agent_token_usage.sql`
- 实体类：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/`
- DTO：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/`
- 业务逻辑：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/`
- 前端页面：`Smart-WorkFlow-Web/src/modules/agent/views/`
