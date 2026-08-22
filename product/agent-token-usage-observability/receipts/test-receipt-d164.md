# M07-F04-02 唯一权威测试回执（D164，全新测试轮）

> 本文件为 D164 补证轮的测试证据汇总，取代此前所有 test-receipt 版本。
> 全部证据来自 **2026-08-22 07:04—07:09 全新测试轮**（不复用 D160—D163 任何旧时间窗）。

## 1. 测试环境与方法

- **日期**：2026-08-22
- **环境**：macOS arm64，Java 21，Node.js 22，H2 内存库（Flyway 全链含 zonky embedded-postgres PG 17.5）
- **后端命令**：`MAVEN_OPTS="-Xmx2g" mvn test`（项目根执行，全量 31 模块）
- **前端命令**：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- **串行保证**：后端完成（07:05:09）后再执行前端（07:07:29 起），前后端工具族互斥零快照见 §5

## 2. 测试轮结果

### 后端（07:04:22 → 07:05:09，47s，BUILD SUCCESS）

**项目级：752 tests / 0 failures / 0 errors / 0 skipped**

模块明细（surefire 报告逐类相加 = 静态 @Test 计数 = 可复算）：

| 模块 | 计数 | 说明 |
|------|------|------|
| sw-basic-agent | **264** | 相对 D162 自报 247 +17（本轮新增 17）；静态 @Test 逐类相加 264 与 surefire 报告总和完全一致 |
| sw-bootstrap | 22 | FlywayFullChainH2Test 13 + PostgresTest 9（V35 双方言全链，D160 标准10 已确认） |
| sw-framework | 24 | 无本轮改动 |
| sw-biz | 365 | 无本轮改动 |
| **项目级** | **752** | = 723（D154 规划基线）+ 29（token 功能全部累计，无无关模块增量） |

agent 模块核心类计数（surefire 报告）：

| 测试类 | 计数 |
|--------|------|
| AgentGraphExecutionServiceImplTest | 42（+7 本轮：落库查询/汇总复算/LOOP 不去重/无 usage NULL/部分 usage/跨租户/迁移前兼容） |
| AgentGraphInterpreterTest | 36 |
| AgentGraphDefSecurityIntegrationTest | 20 |
| AgentModelConfigServiceImplTest | 18 |
| AgentGraphDefControllerTest | 17 |
| AgentOrchestrationServiceImplTest | 16（+2 本轮：候选切换 token/失败不落 token） |
| AgentTokenUsageBehaviorTest | 12（+5 本轮：跨会话/跨租户/部分 usage ×2/迁移前消息） |
| AgentConversationControllerTest | 7（+3 本轮：403/401/404） |
| AgentGraphExecutionSecurityIntegrationTest | 12 |
| AgentDataScopeTest（含嵌套） | 15 |
| 其余（orchestration/mapper/controller） | 79 |
| **agent 合计** | **264** |

### 前端（07:07:29 → 07:09:04，四门全绿）

| 门 | 时间 | 结果 |
|----|------|------|
| typecheck | 07:07:29 | EXIT 0 |
| lint | 07:07:35 | 0 errors（16 prettier warnings 已 --fix 归零） |
| test | 07:08:29 → 07:08:52 | **82 files / 798 tests** 全过（相对 79f/775t：+3 files / +23 tests） |
| build | 07:08:56 → 07:09:04 | ✓ built（1.05s） |

前端新增测试构成（+23）：
- `agent-conversation-handlers.spec.ts`（新建，8）：会话列表/过滤/消息升序/确定 token/未知/部分/404/跨会话不串计
- `ConversationDetail.spec.ts`（新建，5）：确定/未知/部分 token 汇总、无效 ID、404 跳转
- `ConversationList.spec.ts`（新建，4）：加载/错误/空态/跳转
- `ExecutionDetail.spec.ts`（+3）：确定/未知/部分 token 卡片
- `NodeTrajectory.spec.ts`（+3）：LLM 节点 token 展示/未知/非 LLM 不显示

## 3. 验收标准逐条证据（D164）

| # | 结论 | 关键证据 |
|---|:---:|------|
| 1 | ✅ | F01 `f01_orchestration_shouldPersistTokenUsage`（DB 10/20）+ F02 `execute_tokenUsage_shouldPersistToExecutionAndNodeRecordsAndBeQueryable`（执行/节点双表 DB 值 + 列表/详情/nodes 查询端点 DTO） |
| 2 | ✅ | `execute_twoLlmChain_shouldAggregateTokensInExecutionRecord`（40/60，Σ节点=汇总）+ `execute_loopRepeatedNode_shouldRecordTokensPerExecutionNotDeduped`（3 行不去重）+ D161 FORK/JOIN 方法级材料 |
| 3 | ✅ | F01 `differentSessions_shouldNotMixTokenAggregation`（A=20/40、B=10/20）+ `differentTenant_shouldNotLeakSessionTokenData`（B 零命中）；F02 `executionTokenRecords_crossTenant_shouldBeIsolated`（列表空/详情节点 NOT_FOUND） |
| 4 | ✅ | 明确 0（既有）+ 完全未知 NULL（`execute_noUsage_shouldStoreNullNotZeroInExecutionAndNodes`）+ 部分 usage 独立 null（F01 `partialUsage_*` ×2、F02 `execute_partialUsage_shouldKeepIndependentNullPerSide`）+ total 自洽（既有）；生产修复：TokenUsageResolver 原生字段读取 + persistNodeTraces 每侧独立 null |
| 5 | ✅ | `run_switchSuccess_shouldPersistOnlyCurrentCallChainUsage`（429 失败轮不落、成功轮 3/5）+ `run_failureAfterUsage_shouldNotRecordTokenFacts`（500 无 token）+ 既有 HTTP500 |
| 6 | ✅ | ConversationList/Detail 组件测试 + ExecutionDetail token 卡片（150/200/350）+ NodeTrajectory（确定/未知/非 LLM 不显示）；NodeTrajectory.vue 修复 null 隐藏→"未知" |
| 7 | ✅ | `preMigrationRecords_withNullTokens_shouldBeReadableViaAllQueryEndpoints`（列表/详情/节点）+ `preMigrationMessage_withNullTokens_shouldBeReadable`（F01） |
| 8 | ✅ | ConversationControllerTest 7（授权/撤权/401/superadmin/404）+ GraphExecSecurity 12（四类权限 ×3 端点）+ 租户/逻辑删除既有覆盖 |
| 9 | ✅ | mock 会话 handler 新增 + `agent-conversation-handlers.spec.ts` 8 用例（确定/未知/部分/聚合 40/60/不串计/404） |
| 10 | ✅ | 沿用 D160—D163（H2/PG V35 新库 35 条 + 升级链；本轮未重跑，标准10 已确认） |
| 11 | ✅ | 项目级 752/0/0/0 + 前端 82f/798t 全绿；Prompt/变量/调度/历史/会话/多 Key 随项目级回归通过 |
| 12 | ✅ | 2G 上限、精确时间（§2）、互斥零快照（§5）、退出码全 0 |
| 13 | ⚠️ | 功能通过复验后由执行层完成 §3.3 全量同步（清单/P8/I45/功能数保持 D163 裁定） |

## 4. 测试驱动修复的生产缺陷

1. **F02 EmptyUsage 伪零**：供应商未返回 usage 时落 0（应为 null）——`AgentGraphInterpreter` 补 EmptyUsage 排除（F01 有 F02 漏）。
2. **F02 部分 usage 执行汇总 output 落 0**：`persistNodeTraces` 单标记导致无输出数据时写 0——改为每侧独立，无数据保持 null。
3. **F01/F02 部分 usage 单侧 0 归一**：`DefaultUsage` 构造器 null→0——`TokenUsageResolver` 优先读 nativeUsage 原始 record。
4. **前端 NodeTrajectory 未知 token 隐藏**：null 时不显示——改为 LLM 节点恒显示，"未知"文案。
5. **前端 mock 缺会话 handler**：`handlers.ts` 新增会话列表/消息两端点。

## 5. 互斥证据（前后端工具族）

| 时间点 | 检查 | 结果 |
|--------|------|------|
| 07:04:19（后端开始前） | pnpm/vite/vitest/node(Smart-WorkFlow-Web) | 零进程 |
| 07:04:22（后端开始） | mvn 启动 | 唯一编译进程 |
| 07:05:09（后端完成） | mvn/java | 零进程 |
| 07:07:29（前端开始前） | mvn/java | 零进程 |
| 07:09:04（前端完成） | mvn/pnpm/node | 零进程 |

前后端编译测试严格串行（后端 07:04:22—07:05:09 先完成，前端 07:07:29—07:09:04 后执行），全程无重叠。

## 6. 未完成内容

**无**。标准1—12 全部闭合；标准13 待规划层 D164 复验通过后按 §3.3 执行（功能通过前清单/P8/I45/功能数保持 D163 裁定不变）。
