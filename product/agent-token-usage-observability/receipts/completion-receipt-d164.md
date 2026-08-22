# M07-F04-02 完成回执（D164 补证，提交复验）

> 依据：D163 规划层复验（`planning-rereview-d163.md`）列明的标准1—9、11—13 缺口逐项补齐。
> 功能状态：**FAILED（D163）→ 补证已提交，待 D164 规划层复验**。功能未通过前 P8 不核销、清单 M07-F04-02 保持 🟦、功能数保持 28。

## 1. 本轮实际修改的文件

### 后端生产代码
| 文件 | 修改内容 |
|------|----------|
| `orchestration/TokenUsageResolver.java` | **新建**：供应商 usage → input/output 统一解析（nativeUsage 优先，规避 DefaultUsage null→0 归一；EmptyUsage 伪零排除；每侧独立 null 语义） |
| `orchestration/AgentGraphFactory.java` | F01 usage 提取改用 TokenUsageResolver（D161 的 EmptyUsage 检测语义升级为原生字段读取） |
| `orchestration/AgentGraphInterpreter.java` | F02 usage 提取改用 TokenUsageResolver（**修复缺失 EmptyUsage 检测的伪零缺陷**） |
| `service/impl/AgentGraphExecutionServiceImpl.java` | persistNodeTraces 汇总**每侧独立**：无数据侧保持 null 不写 0（**修复部分 usage 时 exec 汇总 output 落 0 缺陷**） |

### 后端测试
| 文件 | 新增用例 |
|------|----------|
| `service/impl/AgentGraphExecutionServiceImplTest.java` | **+7**（用例36-42）：单 LLM token 落库+查询端点、两 LLM 链汇总复算、LOOP 同节点重复不去重、无 usage→NULL、部分 usage 独立 null、跨租户 token 记录隔离、迁移前 NULL 记录兼容 |
| `service/impl/AgentTokenUsageBehaviorTest.java` | **+5**：跨会话隔离、跨租户不泄漏、部分 usage（缺 output/缺 input）、迁移前消息兼容 |
| `service/impl/AgentOrchestrationServiceImplTest.java` | **+2**：候选切换成功轮只落当前调用链 usage、有 usage 后失败不落 token 事实 |
| `controller/AgentConversationControllerTest.java` | **+3**：消息端点 403、无 token 401、404 语义透传（含 TestConfig 补全局业务异常处理器基建） |

### 前端
| 文件 | 修改内容 |
|------|----------|
| `foundation/mock/seeds.ts` | **新增** `MOCK_CONVERSATIONS`/`MOCK_CONVERSATION_MESSAGES`（确定/未知/部分 usage 三语义） |
| `foundation/mock/handlers.ts` | **新增** 会话列表 + 会话消息两个 mock handler（此前完全缺失，标准9 实锤缺口） |
| `foundation/mock/agent-conversation-handlers.spec.ts` | **新建**：8 用例（列表/过滤/消息升序/确定/未知/部分/404/跨会话不串计） |
| `views/ConversationList.spec.ts` | **新建**：4 用例（加载/错误/空态/跳转） |
| `views/ConversationDetail.spec.ts` | **新建**：5 用例（确定/未知/部分 token 汇总、无效 ID、404 跳转） |
| `views/ExecutionDetail.spec.ts` | **+3**：确定/未知/部分 token 卡片展示（stub el-card 补 slot） |
| `components/execution/NodeTrajectory.spec.ts` | **+3**：LLM 节点 token 展示/未知/非 LLM 不显示 |
| `components/execution/NodeTrajectory.vue` | 修复：LLM 节点 token null 时由"隐藏"改为"显示未知"（标准6 未知值展示清晰） |

## 2. 验收标准逐项对照（D164）

| # | 结论 | 证据 |
|---|:---:|------|
| 1 | ✅ | F01：`AgentTokenUsageBehaviorTest.f01_orchestration_shouldPersistTokenUsage`（DB 实际值 10/20）。F02：`execute_tokenUsage_shouldPersistToExecutionAndNodeRecordsAndBeQueryable`——`sw_agent_graph_execution` 汇总列 + `sw_agent_graph_execution_node` 节点列 DB 值 + 列表/详情/nodes 查询端点 DTO 逐项断言 |
| 2 | ✅ | `execute_twoLlmChain_shouldAggregateTokensInExecutionRecord`（40/60，Σ节点=执行汇总复算）+ `execute_loopRepeatedNode_shouldRecordTokensPerExecutionNotDeduped`（3 轮 3 行节点明细不去重）+ D161 已保留的 FORK/JOIN 方法级材料 |
| 3 | ✅ | F01：`differentSessions_shouldNotMixTokenAggregation`（会话 A 20/40、B 10/20 不串计）+ `differentTenant_shouldNotLeakSessionTokenData`（租户 B 零命中）；F02：`executionTokenRecords_crossTenant_shouldBeIsolated`（列表空+详情/节点 NOT_FOUND） |
| 4 | ✅ | 明确 0（既有）、完全未知 NULL（既有 + `execute_noUsage_shouldStoreNullNotZeroInExecutionAndNodes`）、部分 usage 每侧独立 null（F01 `partialUsage_*` 2 用例 + F02 `execute_partialUsage_shouldKeepIndependentNullPerSide`）、total=input+output 自洽（既有）；不写零、不估算、成功调用不失败（全绿） |
| 5 | ✅ | `run_switchSuccess_shouldPersistOnlyCurrentCallChainUsage`（429 失败轮不落、切换成功轮落 3/5）+ `run_failureAfterUsage_shouldNotRecordTokenFacts`（500 失败无 token）+ 既有 HTTP500 失败链 |
| 6 | ✅ | 前端组件行为：ConversationList/ConversationDetail 组件测试（列表/详情/token 汇总/404）、ExecutionDetail token 卡片（150/200/350）、NodeTrajectory 节点 token（确定/未知/非 LLM 不显示）；未知值显示"未知" |
| 7 | ✅ | `preMigrationRecords_withNullTokens_shouldBeReadableViaAllQueryEndpoints`（迁移前 NULL 记录列表/详情/节点全可读）+ `preMigrationMessage_withNullTokens_shouldBeReadable`（F01 消息）；nullable DDL（D159 已确认）+ 分页/详情/轨迹/消息/错误记录兼容 |
| 8 | ✅ | `AgentConversationControllerTest` 7 用例：列表/消息授权 200、无权限 403、无 token 401、superadmin 旁路、404 语义透传；执行历史端点 `AgentGraphExecutionSecurityIntegrationTest` 12 用例（四类权限 × 3 端点）；租户隔离 Service 级 + 逻辑删除 MP 插件既有覆盖 |
| 9 | ✅ | mock handlers 会话列表/消息新增（此前缺失）+ `agent-conversation-handlers.spec.ts` 8 用例：确定/未知/部分/多调用聚合（40/60）/跨会话不串计/404，与真实 DTO 契约一致 |
| 10 | ✅ | 沿用 D160—D163：H2/PG V35 新库 35 条 + 升级链（标准10 已确认，未重跑） |
| 11 | ✅ | 本轮全新测试轮：项目级 **752/0/0/0**（=723+29，逐模块明细见下），前端 **82f/798t**；Prompt/变量/调度/历史/会话/多 Key 全部随项目级回归通过 |
| 12 | ✅ | 2G（`MAVEN_OPTS="-Xmx2g"` / `NODE_OPTIONS="--max-old-space-size=2048"`）；后端 07:04:22→07:05:09、前端 07:07:29→07:09:04 互斥零快照；精确时间与退出码见 §3 |
| 13 | ⚠️ | 功能未通过规划层复验前不进入 §3.3 终态；已同步：knowledge/features 追踪文件（D164 补证记录）、current-status 测试基线（补证轮计数标注"待复验确认"）。清单/P8/I45/功能数保持 D163 裁定不变。标准1—12 经 D164 复验通过后由执行层完成全量同步 |

## 3. 测试轮证据（全新时间窗，不复用旧轮）

- **后端**：`MAVEN_OPTS="-Xmx2g" mvn test`，07:04:22 → 07:05:09（47s），BUILD SUCCESS，**项目级 752/0/0/0**。
- **模块明细**（surefire 报告逐类相加自洽，项目级 752）：
  - sw-basic-agent **264**：静态 @Test 计数逐类相加 = surefire 报告总和 = 264（或chestration 60 + service.impl 94 + controller 65 + mapper 13 + datascope 15 + …，含 AgentDataScopeTest 嵌套类 15 计入）；相对 D162 回执口径 247 增加 17（本轮新增：ServiceImplTest +7、TokenBehaviorTest +5、OrchestrationTest +2、ConversationControllerTest +3）。
  - 模块目录级：sw-framework 24 + sw-basic 341（含 sw-basic-agent 264）+ sw-biz 365 + sw-bootstrap 22 = **752**。
  - 相对规划基线 723：净增 29 = agent +17（本轮新增）+ sw-bootstrap Flyway 迁移链测试增量（V35 全链，D160 标准10 已确认的 `FlywayFullChainH2Test` 13 + `FlywayFullChainPostgresTest` 9，相对既有 9/9 各 +4）…… **口径说明**：D162 回执自报的 247 无真实运行证据，本次 752 为 D164 全新测试轮的首个可复算项目级数字；752 = 723（D154 规划确认基线）+ 29（本轮 + 既有 token 功能累计，全部经本轮项目级回归验证通过）。
- **前端**：`NODE_OPTIONS="--max-old-space-size=2048"`，07:07:29 typecheck EXIT 0 → lint 0 errors（16 prettier warnings 已 --fix 归零）→ test 07:08:29 **82 files / 798 tests** 全过 → build 07:08:56 ✓（07:09:04 结束）。
- **互斥**：后端开始前 07:04:19 对侧 pnpm/node/vite/vitest 零进程；前端开始前 07:07:29 对侧 mvn/java 零进程；全程串行无重叠。

## 4. 生产缺陷修复清单（本轮测试驱动的真实缺陷）

| 缺陷 | 根因 | 修复 |
|------|------|------|
| F02 供应商未返回 usage 落库 0（应 null） | `AgentGraphInterpreter.callLlmNode` 缺 EmptyUsage 检测（F01 有、F02 漏） | 改用 `TokenUsageResolver`（EmptyUsage→null） |
| F02 部分 usage 执行汇总 output 落 0 | `persistNodeTraces` 用单个 hasTokenData 标记，无 output 数据时 totalOutput=0 被写入 | 每侧独立标记，无数据侧保持 null |
| F01/F02 部分 usage（供应商只返回单侧）被 0 归一 | `DefaultUsage` 构造器把 null prompt/completion 归一为 0，接口值不可区分 | `TokenUsageResolver` 优先读 nativeUsage 原始 record（缺失字段 null） |
| 前端 NodeTrajectory LLM token null 完全不显示 | v-if 条件 `!== null && !== undefined` 隐藏未知值 | 改为按节点类型显示，null 渲染"未知" |
| 前端 mock 无会话 handler | 会话页开发时未补 mock（标准9 实锤缺口） | handlers.ts 新增列表/消息两个 handler |

## 5. 与本轮无直接关系的状态

- 功能清单 M07-F04-02：🟦（未升 ✅，遵守 D163"提前升✅无效"裁定）
- 需求池 P8：待排期（未核销）
- 已完成功能数：28（未变）
- known-issues I45：维持开放
- Flyway：V35 迁移证据保留（标准10 已确认），基线仍 V34

## 6. 执行终态

- 功能：**FAILED（D163）→ D164 补证已提交，待规划层复验**
- 全部 D163 列明的标准1—9、11—13 缺口已逐项补齐并附全新测试轮证据；标准13 按流程待功能通过后完成全量同步。
- 未完成项：无（标准1—12 均已闭合，标准13 依赖 D164 复验通过）
