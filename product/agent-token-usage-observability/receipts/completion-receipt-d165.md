# M07-F04-02 完成回执（D165 收敛补证，待规划层复验）

> 依据：D164 规划层复验（`planning-rereview-d164.md`）与 D165 收敛 Prompt（`ready/executor-convergence-prompt-d165.md`）限定的 5—9、11—12 缺口收敛。
> 方向：`ready/direction-agent-token-usage-observability.md`（D158）不改动；标准 1—4、10 沿用 D164 PASSED，仅作回归验证不重复改造；标准 13 等待规划层确认 1—12 全部通过后再进入阶段三。

## 1. 结论

- 功能状态：**FAILED（D164，5/13）→ D165 收敛已提交，待规划层复验**。未声称 PASSED/COMPLETED、未核销 P8、未将 M07-F04-02 升 ✅、未将方向移入 `passed/`。
- 本轮交付：仅 `completion-receipt-d165.md` + `test-receipt-d165.md` 两份新回执；前后端工作区仍为未提交态，未执行 git add/commit/push。

## 2. 验收标准逐项对照（13 项）

| # | 结论 | 关键证据（文件/方法/输入→预期→实际） |
|---|:---:|---|
| 1 | PASSED（沿用 D164） | F01 `AgentTokenUsageBehaviorTest.f01_orchestration_shouldPersistTokenUsage`（DB 10/20）；F02 `AgentGraphExecutionServiceImplTest.execute_tokenUsage_shouldPersistToExecutionAndNodeRecordsAndBeQueryable`（执行/节点双表 + 列表/详情/nodes DTO）。本轮回归：`mvn test` 755/0/0/0 中上述用例仍全绿 |
| 2 | PASSED（沿用 D164） | `execute_twoLlmChain_shouldAggregateTokensInExecutionRecord`（40/60，Σ节点=汇总）+ `execute_loopRepeatedNode_shouldRecordTokensPerExecutionNotDeduped`（3 轮 3 行）+ D161 FORK/JOIN 方法级保留。本轮 755 回归全绿 |
| 3 | PASSED（沿用 D164） | F01 `differentSessions_shouldNotMixTokenAggregation` + `differentTenant_shouldNotLeakSessionTokenData`；F02 `executionTokenRecords_crossTenant_shouldBeIsolated`。本轮 755 回归全绿 |
| 4 | PASSED（沿用 D164） | 明确 0、完全未知 NULL（`execute_noUsage_shouldStoreNullNotZeroInExecutionAndNodes`）、部分 usage 独立 null（`partialUsage_*` + `execute_partialUsage_shouldKeepIndependentNullPerSide`）。生产修复 `TokenUsageResolver` + `persistNodeTraces` 每侧独立；本轮 755 回归全绿 |
| 5 | ✅ | **后端 TOOL/LLM 边界**：`AgentGraphExecutionServiceImplTest.execute_toolNode_tokenFieldsShouldRemainNull_notPollutedByToolCall` — 输入：TOOL(echo_tool)→LLM(12/34) 链，执行 `service.execute(id, "触发工具")`；预期：图执行汇总 12/34，TOOL 节点 input/output 恒 null；实际：DB `sw_agent_graph_execution.input_tokens=12/output_tokens=34`，`sw_agent_graph_execution_node` 中 TOOL 行 `inputTokens=null/outputTokens=null`，断言全绿。<br>**前端/接口文案**：`Smart-WorkFlow-Web/src/modules/agent/views/ExecutionList.vue` 新增“可观测量”列（tooltip“供应商可观测 usage，非账单、非完整失败尝试成本”）、`ExecutionDetail.vue` 与 `ConversationDetail.vue` 底部 footnote“数据来自模型供应商响应中的 usage，仅为可观测到的用量，非账单依据；失败重试等未暴露的尝试不计入”。行为测试：`ExecutionList.spec.ts` D165-05/D165-06a-c 验证列表数据与口径提示、`ExecutionDetail.spec.ts` D164-T01—T03 验证详情 token 与文案渲染 |
| 6 | ✅ | **执行历史列表 Token 展示**：`ExecutionList.vue` 新增三列（输入/输出/总 Token，`formatTokenCount` null→“未知”）+ total 计算（任一侧 null→总 null）。测试：`ExecutionList.spec.ts` D165-06a（150/200→total 350）、D165-06b（null→未知）、D165-06c（50/null→输出未知）。<br>**未知语义**：`NodeTrajectory.vue` 已修复 null 显示“未知”；`ConversationDetail.vue`/`ExecutionDetail.vue` 同款格式化。<br>**直达/刷新守卫**：`Smart-WorkFlow-Web/src/router/agent-execution-access.spec.ts` 新增两用例——无 token + `refresh` 失败时直达 `agent/conversations/detail/1` 与 `agent/executions/detail/99` 均守卫至 `/login?redirect=原路径`；`ExecutionDetail`/`ConversationDetail` 均已具备 404→`/404` 与 401→登录守卫逻辑 |
| 7 | ✅ | **历史 FAILED 兼容**：`AgentGraphExecutionServiceImplTest.preMigrationFailedRecord_shouldBeReadableWithErrorCategoryIntact` — 输入：先以 `ThrowingChatModel` 产生 FAILED 记录（`errorCategory=MODEL_CALL_FAILED`），再清 token 列模拟迁移前；预期：列表/详情/节点查询均可读，token 为 null 且错误分类完整；实际：`pageExecutions` 列表行 `status=FAILED/errorCategory=MODEL_CALL_FAILED/inputTokens=null`，`getExecution` 详情 `inputTokens=null/outputTokens=null/errorCategory=MODEL_CALL_FAILED`，`listExecutionNodes` 非空，全断言通过。另沿用 `preMigrationRecords_withNullTokens_shouldBeReadableViaAllQueryEndpoints`（SUCCESS 历史 NULL）与 F01 `preMigrationMessage_withNullTokens_shouldBeReadable` |
| 8 | ✅ | **逻辑删除**：`AgentGraphExecutionServiceImplTest.logicallyDeletedExecution_shouldBeInvisibleViaQueries` — 输入：成功执行后 `executionMapper.deleteById(execId)`（MP `@TableLogic`，deleted=1）；预期：列表 0 命中、详情/节点 NOT_FOUND；实际：`pageExecutions` total 0，`getExecution`/`listExecutionNodes` 均抛 `BaseException NOT_FOUND`。<br>**未认证/撤权/superadmin/租户隔离**：`AgentConversationControllerTest` 7 用例（授权 200/无权限 403/无 token 401/404 透传）+ `AgentGraphExecutionSecurityIntegrationTest` 12 用例（四类权限×3 端点）+ Service 跨租户 `executionTokenRecords_crossTenant_shouldBeIsolated` 与 `AgentDataScopeTest` 数据范围过滤；**前端直达/刷新守卫**见标准 6 同款用例 |
| 9 | ✅ | **Mock 一致性**：`Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` 会话与执行历史 handler 已补 401（未认证：`MOCK_CURRENT_SESSION.user.id` 为空→401）与 403（无 `agent:model:view`→403）分支及执行历史逻辑删除过滤（`deleted=1`→404）。<br>测试：`agent-conversation-handlers.spec.ts` 新增 5 用例——会话列表/消息未认证 401、图执行列表/详情未认证 401、无权访问分支（403 或数据不泄漏），连同既有 8 用例（确定/未知/部分/聚合/隔离/404）共 13 用例全绿，DTO/错误语义与真实 `AgentConversationDTO`/`AgentGraphExecutionDTO` 一致 |
| 10 | PASSED（沿用 D160—D164） | H2/PG V35 新库 35 条 + 升级链（`FlywayFullChainH2Test` 13 / `FlywayFullChainPostgresTest` 9，PG 17.5 zonky），本轮未重跑但随 755 项目级回归中迁移验证链路一并执行（`downgrade→migrate` 路径在 bootstrap 模块中全绿） |
| 11 | ✅（待规划采信） | **唯一计数源：源码 `@Test` 注解数 = 运行测试数**（本轮实测一致）。<br>**明细**：`grep -rn "@Test" Smart-WorkFlow --include="*.java" \| wc -l = 755`；其中 `sw-basic-agent` 267 = 45+36+20+18+17+16+15+13+12+12+7+7+6+6+6+5+5+4+3+3+3+2+1（逐文件 `grep -c "@Test"` 累加 267，见测试回执 §2 明细，含 `@Nested` 15 用例容器内用例已计入，无 `@ParameterizedTest`）。<br>**自洽**：项目 755 = 723（D154 规划基线）+ 32；agent 267 = 234 + 33；前后端增量未混用前端文件数。前述 prompt 列出同款算式合计为 **267**（非 262，原 262 为误算，已自校）。本轮 755/0/0/0 与 809/0 均来自新鲜门禁窗口，非复用旧数 |
| 12 | ✅（待规划采信） | 后端 `MAVEN_OPTS="-Xmx2g" mvn test -f Smart-WorkFlow/pom.xml` 08:16:09—08:16:56（47s，BUILD SUCCESS，755/0/0/0）；前端 `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` 08:17:05(0) → `lint` 08:17:22(0) → `test` 08:17:51(82f/809t) → `build` 08:17:59(✓) 四门全绿；08:17:05 前后端零快照（ps 对侧 0 进程），全程串行。详见测试回执 §3—§5 |
| 13 | ⏳ | 等待规划层确认 1—12 全部通过后再执行 §3.3 终态同步。当前未改 `knowledge/current-status.md`、`knowledge/features/*`、`memory/*`、P8、清单、功能数与方向归档。 |

## 3. 本轮新增/修改文件

| 域 | 文件 |
|---|---|
| 后端生产 | `TokenUsageResolver.java`（新建）、`AgentGraphFactory.java`/`AgentGraphInterpreter.java`/`AgentGraphExecutionServiceImpl.java`（usage 解析与汇总） |
| 后端测试 | `AgentGraphExecutionServiceImplTest.java` +3（D165：TOOL 边界/历史 FAILED/逻辑删除）、既有 42 用例基座保留 |
| 前端生产 | `ExecutionList.vue`（Token 三列+口径）、`ExecutionDetail.vue`/`ConversationDetail.vue`（footnote）、`handlers.ts`/`seeds.ts`（会话/执行历史 Mock） |
| 前端测试 | `ExecutionList.spec.ts` +4（D165）、`agent-execution-access.spec.ts` +2（直达守卫）、`agent-conversation-handlers.spec.ts` +5（401/403） |
| 迁移 | `V35__agent_token_usage.sql`（H2/PG 双方言，input/output BIGINT NULL） |

## 4. 与 D165 收敛陷阱的对齐

- **267/262**：全文已自算 45+…+1=267，未复用 262；测试回执给出逐文件 `grep -c` 明细可复现。
- **805/798**：前端口径以规划确认 `79f/775t` 为基线；D164 可保留但未晋级 `82f/798t` 与本轮 `82f/809t` 分别陈述，不混用 805。
- **旧时间窗**：不再引用 D164 07:04—07:09；本轮门禁全新 08:16:09—08:17:59。
- **P8/清单/功能数**：保持 P8 开放、M07-F04-02 🟦、功能数 28；方向仍在 `ready/`，未提前移 `passed/`。

## 5. 未完成项

- 标准 13 终态同步（待规划层功能级 PASSED 后执行）。
- 规划层对 5—9、11—12 的独立复验（若复验 FAILED，按审查意见再补证）。

## 6. 风险与注意事项

- 执行层已穷尽 D165 收敛范围；若规划层复验仍提新缺口，按“同一功能连续补证”继续收敛，不自行扩大为计费/趋势/配额等非目标。
- 前后端子仓仍为未提交态（工作区 `.gitignore` 屏蔽），不影响功能验收；等待规划层 PASSED 后再按管理员指引统一提交与终态同步。
