# M07-F04-02 唯一权威测试回执（D169，新鲜门禁）

> 本文件为 D169 收敛轮唯一权威测试证据，取代 D167/D168 的门禁时间与计数结论。
> 标准 1—5、7—10 沿用 D168 PASSED，仅回归验证；6、11、12 为本轮收敛重点并给出可复核证据。

## 1. 测试环境与方法

- **日期**：2026-08-22
- **环境**：macOS arm64，Java 21，Node 22，H2 内存库（Flyway 全链含 zonky embedded-postgres PG 17.5）
- **后端命令**：`MAVEN_OPTS="-Xmx2g" mvn test`（`Smart-WorkFlow` 根，31 模块全量，2G 上限）
- **前端命令**：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build`（`Smart-WorkFlow-Web`，四门串行，2G 上限）
- **串行保证**：后端先（08:57:33—08:58:18）→ 前端后（08:58:31—08:59:52），后端开始前查前端工具族、前端开始前查后端工具族，零快照采用 **`pgrep -f` 字符类排除自身**，时间与退出码证据见 §3、§5。

## 2. 计数与对账明细（标准 11）

### 2.1 三线对账表

| 口径 | 项目 | Agent | 非 Agent | 来源 |
|---|---:|---:|---:|---|
| 规划确认基线（D154 验收） | **723** | **234** | **489（隐含）** | `direction-agent-token-usage-observability.md` §6 标准 12 + D154 终态回执（723/agent234） |
| git HEAD 快照（731e70b，D154 提交） | 722 | 234 | 488 | `git grep -h "@Test" HEAD -- '*.java' \| wc -l`，按模块分解 |
| 本轮新鲜运行（D169 门禁） | **755** | **267** | **488** | Surefire 模块小计（§2.2）逐模块相加 |

### 2.2 本轮后端模块运行小计（D169 新鲜 Surefire，与源码 `@Test` 逐模块一致）

| 模块 | Surefire Tests run |
|---|---:|
| sw-framework（sw-common 18 + sw-security 6） | 24 |
| sw-basic-agent | 267 |
| sw-basic-job | 51 |
| sw-basic-storage | 19 |
| sw-basic-notify | 7 |
| sw-biz-form | 76 |
| sw-biz-system | 210 |
| sw-bpm（engine 21 + process 58） | 79 |
| sw-bootstrap | 22 |
| **合计** | **755** |

> 复算：24 + 344（267+51+19+7）+ 365（76+210+79）+ 22 = **755**；Agent 267 逐类表沿用 D167（45+36+20+18+17+16+15+13+12+12+7+7+6+6+6+5+5+5+4+3+3+3+2+1=267，三个 +5，含 @Nested 15），本轮门禁重跑一致。

### 2.3 差 1 溯源结论（非 Agent 489 → 488）

**定性：D154 历史计数口径错误（D150 报告增量中 1 个测试无文件落点），非删除/移动/改名/未发现，非当前代码回归。**

证据链：

1. **D150 报告**：`completion.md` 标准 7 记录后端 685 → 698（+13）；同回执修改文件清单仅列出 `AgentGraphInterpreterTest.java` 新增 **12** 个测试（agent 模块），无任何非 agent 测试文件新增；698 = 209（agent）+ **489**（非 agent）→ 第 13 个增量无文件落点。
2. **口径沿用**：D151（703/agent214 隐含非 agent 489）、D152/D153（723/agent234 隐含非 agent 489）各轮运行报告均延续该口径，被规划层采信为基线 723。
3. **git 恒定 488**：`a67283f`（D146，D148 基线 685 的源码集）非 agent = 488；`731e70b`（D154 提交）非 agent = 488；两提交间 `git ls-tree` 非 agent 测试文件清单逐文件 diff **零差异**（无新增/删除/改名）。
4. **当前零回归**：工作区非 agent 测试文件清单与 git HEAD 逐文件 diff 零差异；逐文件 `@Test` 计数比对（HEAD vs 工作区）**零差异**；本轮 Surefire 非 agent 模块小计（framework 24 + job 51 + storage 19 + notify 7 + form 76 + system 210 + bpm 79 + bootstrap 22 = 488）与 git HEAD 一致。

### 2.4 三线完全对账（规划 723 → 当前 755）

- `723 → 755`：净 +32 = Agent **+33**（234→267，D158 功能新增）+ 非 Agent **−1**（489→488，D150 无文件落点的计数幽灵消失）。
- `Agent 234 → 267`：+33，全部为本轮 Token 统计功能新增（`AgentTokenUsageBehaviorTest` 12 + `AgentGraphInterpreterTokenTest` 6 + 其余 D158 新增用例），逐类表见 D167 §2。
- `非 Agent 488 → 488`：**零变化**，逐文件零差异，无任何非目标回归。

## 3. 门禁时间与退出码（标准 12）

### 后端（08:57:33 — 08:58:18，45s，2G，BUILD SUCCESS）

- **命令**：`MAVEN_OPTS="-Xmx2g" mvn test`（全量 31 模块）。
- **开始前互斥**（排除自身）：`pgrep -f "[p]npm|[v]ite|[v]itest|[n]ode.*Smart-WorkFlow-Web"` → **exit=1（无匹配，零命中）**，另以 `ps aux | grep -E "[p]npm|..." | grep -v grep | wc -l` = **0** 复核；时间 08:57:30。
- **结束**：`BUILD SUCCESS / Finished at: 2026-08-22T08:58:18Z / Total time: 43.474s`；`mvn_exit=0`；Surefire 汇总 755/0/0/0（模块小计见 §2.2）。

### 前端（08:58:31 — 08:59:52，四门 2G 串行全绿）

| 门 | 命令 | 时间 | 退出码 | 结果 |
|---|---|---|---|---|
| typecheck | `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` | 08:58:31→08:58:38 | 0 | `vue-tsc -b --noEmit` 无错误 |
| lint | `… pnpm lint` | 08:59:06→08:59:15 | 0 | `eslint .` 0 errors（首轮 08:58:38 因本轮新代码 3 个 `no-explicit-any` error 失败，当轮修复后重跑通过；26 warnings 为 prettier 风格含 D167 既有代码，不阻断） |
| test | `… pnpm test` | 08:59:17→08:59:43 | 0 | `82 passed (82) / 815 passed (815)` |
| build | `… pnpm build` | 08:59:44→08:59:52 | 0 | `✓ built in 1.05s` |

- **开始前互斥**（排除自身）：`pgrep -f "[m]vn|[j]ava.*Smart-WorkFlow"` → **exit=1（无匹配，零命中）**，另以 `ps aux | grep -E "[m]vn|..." | grep -v grep | wc -l` = **0** 复核；时间 08:58:29。
- **串行**：后端 08:57:33—08:58:18 与前端 08:58:31—08:59:52 无重叠；全程 `MAVEN_OPTS="-Xmx2g"` 与 `NODE_OPTIONS="--max-old-space-size=2048"`。
- **前端测试增量**：D167 的 82f/812t → 本轮 **82f/815t**（+3 = D169-6a/b/c 真实导航用例）。

## 4. 逐项证据（标准 6 对照）

### 真实 router 导航到页（`Smart-WorkFlow-Web/src/router/agent-execution-access.spec.ts` 新增 D169-6a/b/c）

| # | 身份/前置 | 输入 URL | 导航动作 | 预期页面 | 实际挂载/页面结果 |
|---|---|---|---|---|---|
| D169-6a | 有 token（`getAccessToken=valid-token`），session 权限含 `agent:model:view`，会话/菜单构建成功 | `/agent/executions/detail/99` | 真实 `router.push` 走 `beforeEach` 守卫（首访构建动态路由 → `next(replace)` 重放 → 次访 `next()`），组件随导航挂载 | ExecutionDetail 执行详情页 | ✅ `getExecutionDetail` 以参数 **99** 被调用；`.execution-detail-page` 容器挂载；`.execution-id` 显示 **#99**；`.graph-name` 显示「客服分流」；`.token-section` 渲染「Token 使用统计」且 150+200=**350** |
| D169-6b | 同上 | `/agent/conversations/detail/42` | 同上 | ConversationDetail 会话消息页 | ✅ `listConversationMessages` 以参数 **42** 被调用；`.conversation-detail-page` 容器挂载；`.session-id` 显示 **#42**；`.page-title` 显示「会话消息」；`.token-summary-card` 渲染「Token 使用统计」 |
| D169-6c | 同上（**刷新 = 全新 router 实例冷启动**后首次导航） | `/agent/conversations/detail/42` | 新建 router 实例（模拟 F5）→ `router.push` 走守卫 → 组件挂载 | ConversationDetail 会话消息页 | ✅ `listConversationMessages(42)` 被调用；`.conversation-detail-page` 挂载；`.session-id` **#42**；`.message-item` 渲染消息；`.token-summary-card` 渲染 Token 汇总 |

**证据口径**：三项均为「目标详情组件实际挂载后」的可观察结果（稳定 DOM 标识 + 页面标题/字段 + 目标页数据请求），不是 `router.resolve`/手工 `authGuard`/`next()` 断言。

### 既有标准 6 相关证据（沿用 D165/D167，回归全绿）

| # | 测试 | 结果 |
|---|---|---|
| 6 | `ExecutionList.vue` + `ExecutionList.spec.ts` D165-06a/b/c（确定/未知/部分 Token 三列） | 全绿 |
| 6 | `agent-execution-access.spec.ts` D167 负向守卫（无 token + refresh 失败 → /login 带 redirect） | 全绿 |
| 6 | `agent-execution-access.spec.ts` D167 路由解析（`agent-execution-detail`/`agent-conversation-detail` 参数解析） | 全绿 |

## 5. 互斥快照（前后端工具族，排除自身）

| 时间点 | 命令 | 结果 |
|---|---|---|
| 08:57:30（后端开始前） | `pgrep -f "[p]npm|[v]ite|[v]itest|[n]ode.*Smart-WorkFlow-Web"` | **exit=1**（无匹配零命中）；`ps aux \| grep -E "[p]npm\|…" \| grep -v grep \| wc -l` = 0 |
| 08:58:18（后端完成） | `BUILD SUCCESS / Finished at 08:58:18Z`；`mvn_exit=0` | 后端已退出 |
| 08:58:29（前端开始前） | `pgrep -f "[m]vn|[j]ava.*Smart-WorkFlow"` | **exit=1**（无匹配零命中）；`ps aux \| grep -E "[m]vn\|…" \| grep -v grep \| wc -l` = 0 |
| 08:59:52（前端完成） | `✓ built in 1.05s / 82f/815t` | 全程串行无重叠 |

> 排除自身机制：`pgrep -f` 的模式用 `[x]` 字符类包裹，正则匹配的是真实进程名，检查命令自身命令行中的方括号使其不可能自匹配，退出码 1 即「无匹配」的明确零命中信号；并以 `grep -v grep` 复核计数 0。

## 6. 未完成内容

- 标准 13 终态同步：等待规划层确认 1—12 全部通过后再执行（本轮不改 `knowledge/*`、`memory/*`、P8、清单、功能数与方向归档）。

## 7. 回归与未触碰

- 项目级 755/0/0/0 中，标准 11/12 为本轮新鲜门禁；非 agent 模块逐文件 @Test 计数与 git HEAD 零差异（§2.3 证据链 4）。
- 标准 1—5、7—10 对应测试随 755 全量回归通过；未修改任何生产代码。
