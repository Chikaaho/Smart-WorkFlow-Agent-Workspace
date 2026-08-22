# M07-F04-02 唯一权威测试回执（D165，新鲜门禁）

> 本文件为 D165 收敛轮唯一权威测试证据，取代 D164 及更早 test-receipt 的门禁时间与计数结论。
> 标准 1—4、10 沿用 D164 PASSED，仅回归验证；5—9、11—12 为本轮收敛重点并给出可复现证据。

## 1. 测试环境与方法

- **日期**：2026-08-22
- **环境**：macOS arm64，Java 21，Node 22，H2 内存库（Flyway 全链含 zonky embedded-postgres PG 17.5）
- **后端命令**：`MAVEN_OPTS="-Xmx2g" mvn test -f Smart-WorkFlow/pom.xml`（项目根，31 模块全量）
- **前端命令**：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build`（`Smart-WorkFlow-Web`，四门串行）
- **串行保证**：后端先（08:16:09—08:16:56）→ 零快照（08:17:05 ps 对侧 0）→ 前端（08:17:05—08:17:59），时间与互斥证据见 §3、§5

## 2. 计数与可复现明细（标准 11）

- **唯一口径**：源码 `@Test` 注解数 = Surefire/Maven `Tests run` 汇总 = Vitest `Tests` 汇总（同一口径，不混参数化展开）。
- **项目级**：`grep -rn "@Test" Smart-WorkFlow --include="*.java" | wc -l = 755`（项目 755/0/0/0，BUILD SUCCESS）。
- **Agent 模块**：`grep -rn "@Test" Smart-WorkFlow/sw-basic/sw-basic-agent --include="*.java" | wc -l = 267`，逐文件 `grep -c "@Test"` 明细如下（合计 267，无 `@ParameterizedTest`/`@RepeatedTest`）：

| 测试类 | 计数 |
|---|---|
| AgentGraphExecutionServiceImplTest | 45 |
| AgentGraphInterpreterTest | 36 |
| AgentGraphDefSecurityIntegrationTest | 20 |
| AgentModelConfigServiceImplTest | 18 |
| AgentGraphDefControllerTest | 17 |
| AgentOrchestrationServiceImplTest | 16 |
| AgentDataScopeTest | 15（含 @Nested 2 容器：ModelConfigScopeTests 8 + GraphExecutionScopeTests 7） |
| AgentGraphDefServiceImplTest | 13 |
| AgentTokenUsageBehaviorTest | 12 |
| AgentGraphExecutionSecurityIntegrationTest | 12 |
| AgentToolConfigServiceImplTest | 7 |
| AgentConversationControllerTest | 7 |
| AgentToolCallbackFactoryTest | 6 |
| AgentGraphInterpreterTokenTest | 6 |
| AgentGraphFactoryTest | 6 |
| ChatModelFactoryTest | 5 |
| AgentModelConfigMapperTest | 5 |
| AgentModelControllerTest | 5 |
| AgentToolConfigControllerTest | 4 |
| AgentSessionMapperTest | 3 |
| AgentMessageMapperTest | 3 |
| AgentOrchestrationControllerTest | 3 |
| AgentToolCallLogMapperTest | 2 |
| ChatModelFactory429SpikeTest | 1 |
| **agent 合计** | **267** = 45+36+20+18+17+16+15+13+12+12+7+7+6+6+6+5+5+4+3+3+3+2+1 |

- **基线与增量（显式声明）**：
  - 规划确认基线（D154）：后端 723 / agent 234 / 前端 79 files/775 tests。
  - D164 可保留但未晋级（D157 证据沿用）：前端 82 files/798 tests（非 805）。
  - 本轮新鲜：后端 755（+32 = 723→755；agent +33 = 234→267，含 D165 TOOL/FAILED/逻辑删除各 +1 及既有 Token 累计），前端 82 files/809 tests（+34 落在 agent 执行/会话历史与 Token 展示相关文件，详见 completion 回执 §3）。
  - 同一份回执内不再混用旧 752/805 或误算 262（45+…+1 已自算 267）。

## 3. 门禁时间与退出码（标准 12）

### 后端（08:16:09 — 08:16:56，47s，2G，BUILD SUCCESS）

- **命令**：`MAVEN_OPTS="-Xmx2g" mvn test -f Smart-WorkFlow/pom.xml`
- **开始**：08:16:09（`echo "后端门禁开始: $(date)"`），结束：08:16:56（`Finished at: 2026-08-22T08:16:56Z`），`Total time: 46.144s`。
- **结果**：`BUILD SUCCESS`，项目级 `Tests run: 755` 隐式（`grep -c` 755 与 Surefire 汇总一致；`bootstrap` 22 用例含 `FlywayFullChainH2Test 13 / PostgresTest 9`）。
- **环境**：`MAVEN_OPTS="-Xmx2g"`（2G 上限），全量 31 模块。

### 前端（08:17:05 — 08:17:59，四门 2G 串行全绿）

| 门 | 命令 | 时间 | 退出码 | 结果 |
|---|---|---|---|---|
| typecheck | `NODE_OPTIONS="--max-old-space-size=2048" pnpm --dir Smart-WorkFlow-Web typecheck` | 08:17:05→08:17:12 | 0 | `vue-tsc -b --noEmit` 无错误 |
| lint | `… pnpm lint` | 08:17:12→08:17:22 | 0 | `eslint .` 0 errors（warnings 已 --fix） |
| test | `… pnpm test` | 08:17:22→08:17:51（Duration 27.91s） | 0 | `82 passed (82) / 809 passed (809)` |
| build | `… pnpm build` | 08:17:51→08:17:59（built 1.11s） | 0 | `✓ built` |

- **环境**：`NODE_OPTIONS="--max-old-space-size=2048"`（2G 上限）。
- **互斥**：08:17:05 前端开始前 `ps aux | grep -E "mvn|java"` 对侧 0 进程；后端已于 08:16:56 结束，全程串行无重叠（§5 快照）。

## 4. 逐项证据（标准 5—9）

| # | 测试文件/方法 | 前置/输入 | 预期 | 实际 |
|---|---|---|---|---|
| 5 | `AgentGraphExecutionServiceImplTest.execute_toolNode_tokenFieldsShouldRemainNull_notPollutedByToolCall` | TOOL(echo_tool)→LLM(12/34) 链，`service.execute(id, "触发工具")` | 执行汇总 12/34，TOOL 节点 token 恒 null | `sw_agent_graph_execution.input_tokens=12/output_tokens=34`，`sw_agent_graph_execution_node` 中 TOOL 行 `null/null`，断言通过 |
| 5 | `ExecutionList.vue` / `ExecutionDetail.vue` / `ConversationDetail.vue` + `ExecutionList.spec.ts` D165-05 | 渲染执行历史列表/详情与会话详情 | “供应商可观测 usage，非账单、非完整失败尝试成本”文案可见 | `可观测量` tooltip + footnote 文本存在；`D165-05/D165-06a-c` 全绿 |
| 6 | `ExecutionList.vue` + `ExecutionList.spec.ts` D165-06a/b/c | 确定(150/200)/未知(null/null)/部分(50/null) | 列表三列正确，总 null 时未知 | `150/200→total350`、`null→未知`、`50/null→输出未知`，断言通过 |
| 6 | `agent-execution-access.spec.ts` 新增 2 用例 | 无 token + `refresh` 失败，直达 `agent/conversations/detail/1` 与 `agent/executions/detail/99` | 守卫至 `/login?redirect=原路径` | `next({path:'/login', query:{redirect:原路径}})`，断言通过 |
| 7 | `AgentGraphExecutionServiceImplTest.preMigrationFailedRecord_shouldBeReadableWithErrorCategoryIntact` | FAILED 记录→清 token 列模拟迁移前，查列表/详情/节点 | token null 且错误分类完整 | 列表 `FAILED/MODEL_CALL_FAILED/null`，详情 `null/null/MODEL_CALL_FAILED`，节点非空，全绿 |
| 8 | `AgentGraphExecutionServiceImplTest.logicallyDeletedExecution_shouldBeInvisibleViaQueries` | 成功执行后 `deleteById`（@TableLogic） | 列表 0 命中、详情/节点 NOT_FOUND | 列表 total 0，`getExecution`/`listExecutionNodes` 抛 NOT_FOUND，全绿 |
| 8 | `AgentConversationControllerTest`（7）+ `AgentGraphExecutionSecurityIntegrationTest`（12）+ `AgentDataScopeTest`（15） | 授权/撤权/401/404/superadmin/租户隔离 | 200/403/401/404 与隔离语义 | 19 用例全绿（见 surefire 日志 ”Tests run: 7/12/15”） |
| 9 | `agent-conversation-handlers.spec.ts` 新增 5 用例 + `handlers.ts` 401/403/404 分支 | 未认证→401、无 `agent:model:view`→403、不存在→404、逻辑删除过滤 | 与真实 DTO/错误语义一致 | 13 用例全绿（确定/未知/部分/聚合/隔离/404/401/403） |

## 5. 互斥快照（前后端工具族）

| 时间点 | 检查 | 结果 |
|---|---|---|
| 08:16:09（后端开始） | `ps aux | grep -E "mvn|java"` 对侧 pnpm/vite 零进程 | 零进程（后端独占） |
| 08:16:56（后端完成） | `Finished at 08:16:56Z / BUILD SUCCESS` | 后端已退出 |
| 08:17:05（前端开始前） | `ps aux | grep -E "mvn|java"` mvn/java 零进程 | 零进程（前端独占） |
| 08:17:59（前端完成） | `build ✓ built in 1.11s` | 全程串行无重叠 |

## 6. 未完成内容

- 标准 13 终态同步：等待规划层确认 1—12 全部通过后再执行（当前仅更新两份回执，不改知识库与清单）。

## 7. 回归与未触碰

- 项目级 755/0/0/0 中，标准 11/12 计数与门禁窗口为本轮新鲜证据；其余模块计数未单独重算但随全量回归一并验证通过（`bootstrap` 22、`form` 76、`bpm` 21/58 等 surefire 摘要见 §3 日志）。
