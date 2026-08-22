# M07-F04-02 唯一权威测试回执（D167，新鲜门禁）

> 本文件为 D167 收敛轮唯一权威测试证据，取代 D165/D166 的门禁时间与计数结论。
> 标准 1—5、7—10 沿用 D166 PASSED，仅回归验证；6、11、12 为本轮收敛重点并给出可复现证据与正确互斥快照。

## 1. 测试环境与方法

- **日期**：2026-08-22
- **环境**：macOS arm64，Java 21，Node 22，H2 内存库（Flyway 全链含 zonky embedded-postgres PG 17.5）
- **后端命令**：`MAVEN_OPTS="-Xmx2g" mvn test -f Smart-WorkFlow/pom.xml`（项目根，31 模块全量，2G 上限）
- **前端命令**：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build`（`Smart-WorkFlow-Web`，四门串行，2G 上限）
- **串行保证**：后端先（08:41:09—08:42:03）→ 前端后（08:42:03—08:42:57），后端开始前查前端工具族、前端开始前查后端工具族，零快照与时间证据见 §3、§5

## 2. 计数与可复现明细（标准 11）

- **唯一口径**：源码 `@Test` 注解数 = Surefire `Tests run` 运行汇总 = Vitest `Tests` 汇总（同一口径；无 `@ParameterizedTest`/`@RepeatedTest`/`@TestFactory`）。
- **项目级**：`grep -rn "@Test" Smart-WorkFlow --include="*.java" | wc -l = 755`（`BUILD SUCCESS`，见 §3 Surefire）。
- **Agent 模块**：`grep -rn "@Test" Smart-WorkFlow/sw-basic/sw-basic-agent --include="*.java" | wc -l = 267`，逐文件 `grep -c "@Test"` 明细如下（24 个测试类，其中三个计数为 5，含 `@Nested` 内用例）：

| 测试类 | 计数 | 备注 |
|---|---:|---|
| AgentGraphExecutionServiceImplTest | 45 |  |
| AgentGraphInterpreterTest | 36 |  |
| AgentGraphDefSecurityIntegrationTest | 20 |  |
| AgentModelConfigServiceImplTest | 18 |  |
| AgentGraphDefControllerTest | 17 |  |
| AgentOrchestrationServiceImplTest | 16 |  |
| AgentDataScopeTest | 15 | @Nested：ModelConfigScopeTests 8 + GraphExecutionScopeTests 7，外层 0 |
| AgentGraphDefServiceImplTest | 13 |  |
| AgentTokenUsageBehaviorTest | 12 |  |
| AgentGraphExecutionSecurityIntegrationTest | 12 |  |
| AgentToolConfigServiceImplTest | 7 |  |
| AgentConversationControllerTest | 7 |  |
| AgentToolCallbackFactoryTest | 6 |  |
| AgentGraphInterpreterTokenTest | 6 |  |
| AgentGraphFactoryTest | 6 |  |
| ChatModelFactoryTest | 5 | 三个 5 之一 |
| AgentModelConfigMapperTest | 5 | 三个 5 之二 |
| AgentModelControllerTest | 5 | 三个 5 之三 |
| AgentToolConfigControllerTest | 4 |  |
| AgentSessionMapperTest | 3 |  |
| AgentMessageMapperTest | 3 |  |
| AgentOrchestrationControllerTest | 3 |  |
| AgentToolCallLogMapperTest | 2 |  |
| ChatModelFactory429SpikeTest | 1 |  |
| **agent 合计** | **267** | **= 45+36+20+18+17+16+15+13+12+12+7+7+6+6+6+5+5+5+4+3+3+3+2+1**（三个 +5，合计 267） |

> **复算自检**：45+36+20+18+17+16+15+13+12+12+7+7+6+6+6+5+5+5+4+3+3+3+2+1 = **267**（D165/D166 的 262 为漏写一个 +5，已在本轮等式中纠正，不再引用 262）。

- **后端模块运行小计（D167 新鲜 Surefire，与 @Test 完全一致）**：
  - `sw-framework 24` + `sw-basic 344`（其中 `sw-basic-agent 267` + `sw-basic-job 51` + `sw-basic-storage 19` + `sw-basic-notify 7`） + `sw-biz 365`（`sw-biz-form 76` + `sw-biz-system 210` + `sw-bpm 79`） + `sw-bootstrap 22` = **755**。
  - Surefire 关键行：`AgentGraphExecutionServiceImplTest 45`、`AgentGraphInterpreterTest 36`、`AgentGraphDefSecurityIntegrationTest 20`、`AgentDataScopeTest$ModelConfigScopeTests 8 / $GraphExecutionScopeTests 7 / 外层 0` 等，合计 267。

- **基线与增量（显式声明，不引入中间基线）**：
  - 规划确认基线（D154，验收数）：后端 **723** / agent **234** / 前端 **79 files/775 tests**。
  - `git HEAD` 快照（`git ls-files | xargs show HEAD | grep @Test`）：后端 **722** / agent **234** / 非 agent **488**（与规划 723 差 1 为快照时差，不作晋级依据）。
  - 本轮新鲜（D167）：后端 **755** / agent **267** / 前端 **82 files/812 tests**（前端 812 = 809 + D167 3 个正向直达用例）。
  - 增量闭合：`WORK 755 - HEAD 722 = +33`；`WORK agent 267 - HEAD agent 234 = +33`；**非 agent 净变化 0**（`488→488`）。若以规划基线 723 计，则 `755-723=+32` 比 `267-234=+33` 差 1，正好是规划 723 与 HEAD 722 的 1 之差，不代表非 agent 减少。
  - 前端：规划 79f/775t → 本轮 82f/812t（+3 files/+37 tests，其中 D165 9 与 D167 3 为本轮真实新增，不引用 805）。

## 3. 门禁时间与退出码（标准 12）

### 后端（08:41:09 — 08:42:03，54s，2G，BUILD SUCCESS）

- **命令**：`MAVEN_OPTS="-Xmx2g" mvn test -f Smart-WorkFlow/pom.xml`（-o 离线，全量 31 模块）。
- **开始前互斥**（正确对象）：`ps aux | grep -E "pnpm|vite|vitest|node.*Smart-WorkFlow-Web"` → **零进程**（前端工具族 pnpm/node/vite 零）。
- **结束**：`BUILD SUCCESS / Finished at: 2026-08-22T08:42:03Z / Total time: 52.332s`；`bootstrap` 22 用例（`FlywayFullChainH2Test 13 / PostgresTest 9`）均含在 755 中。

### 前端（08:42:03 — 08:42:57，四门 2G 串行全绿）

| 门 | 命令 | 时间 | 退出码 | 结果 |
|---|---|---|---|---|
| typecheck | `NODE_OPTIONS="--max-old-space-size=2048" pnpm --dir Smart-WorkFlow-Web typecheck` | 08:42:03→08:42:12 | 0 | `vue-tsc -b --noEmit` 无错误 |
| lint | `… pnpm lint` | 08:42:12→08:42:22 | 0 | `eslint .` 0 errors |
| test | `… pnpm test` | 08:42:22→08:42:51 | 0 | `82 passed (82) / 812 passed (812)` |
| build | `… pnpm build` | 08:42:51→08:42:57 | 0 | `✓ built in 1.03s` |

- **开始前互斥**（正确对象）：`ps aux | grep -E "mvn|java.*Smart-WorkFlow"` → **零进程**（后端工具族 mvn/java 零）。
- **串行**：后端 08:41:09—08:42:03 与前端 08:42:03—08:42:57 无重叠；全程 `MAVEN_OPTS="-Xmx2g"` 与 `NODE_OPTIONS="--max-old-space-size=2048"`。

## 4. 逐项证据（标准 6 对照，1—5、7—10 沿用 D166 PASSED 仅回归）

| # | 测试文件/方法 | 身份/前置与输入 | 预期 | 实际 |
|---|---|---|---|---|
| 6 | `agent-execution-access.spec.ts` D167-6a | 有 token（`getAccessToken=valid-token`），会话构建成功；`realRouter.resolve('/agent/conversations/detail/42')` → `name=agent-conversation-detail, params.sessionId=42`；首访 `authGuard(...,('/agent/conversations/detail/42'), nextFirst)` | 首访 `next({ ...to, replace:true })` 重放；次访 `next()` 直接通过（实际到达 ConversationDetail） | `resolved.name=agent-conversation-detail`，`nextFirst` 被调 `replace:true`，`nextSecond` 被调 `()`，全绿 |
| 6 | `agent-execution-access.spec.ts` D167-6b | 同上；`realRouter.resolve('/agent/executions/detail/99')` → `agent-execution-detail, params.executionId=99` | 首访 `replace:true` 重放，次访 `next()` 通过（到达 ExecutionDetail） | 同上，全绿 |
| 6 | `agent-execution-access.spec.ts` D167-6c | 同上；`/agent/conversations/detail/100`（模拟 F5 刷新后有 token） | 解析 `agent-conversation-detail` 且首访重放后次访通过 | `resolved.name=agent-conversation-detail`，两阶段断言全绿 |
| 6 | `ExecutionList.vue` + `ExecutionList.spec.ts` D165-06a/b/c（沿用） | 确定/未知/部分 Token | 三列正确，总 null 时未知 | 150/200→350、null→未知，沿用全绿 |
| 11 | 源码 vs 运行一致性 | `grep -c "@Test"` 24 行 vs Surefire `Tests run` | 两者同一 267，不混参数化 | 267=267，项目 755=755，见 §2 明细 |

## 5. 互斥快照（前后端工具族，正确对象）

| 时间点 | 命令 | 结果 |
|---|---|---|
| 08:41:09（后端开始前） | `ps aux \| grep -E "pnpm\|vite\|vitest\|node.*Smart-WorkFlow-Web"` | 零进程（前端工具族零） |
| 08:42:03（后端完成） | `BUILD SUCCESS / Finished at 08:42:03Z` | 后端已退出 |
| 08:42:03（前端开始前） | `ps aux \| grep -E "mvn\|java.*Smart-WorkFlow"` | 零进程（后端工具族零） |
| 08:42:57（前端完成） | `✓ built in 1.03s / 82f/812t` | 全程串行无重叠 |

## 6. 未完成内容

- 标准 13 终态同步：等待规划层确认 1—12 全部通过后再执行（本轮不改 `knowledge/*`、`memory/*`、P8、清单、功能数与方向归档）。

## 7. 回归与未触碰

- 项目级 755/0/0/0 中，标准 11/12 为本轮新鲜门禁；其余模块计数未单独重算但随全量回归一并验证通过（`sw-bootstrap 22`、`sw-basic 344`、`sw-biz 365` 等，见 §2 模块小计）。
