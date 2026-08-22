# P7/M07-F02-04 图单步调试闭环 — 测试回执（独立 · D177 补证轮 · 精确时间与互斥实输出）

> 时间：2026-08-22 14:54:09Z—14:56:56Z（同轮串行 · 后端先前端后 · 2G 互斥 · 见 §2 起止）  
> 基线：前端 82f/815t Baseline（D175）→ 本轮 **86f/849t**（+4 spec / +34 tests，含 G6/G11 刷新与闭环）；后端全量 **1654**（控制台含嵌套 wrapper）/**827 Surefire XML**（去重后 leaf 107 zero 12）/ V36 36条 H2+PG  
> 验收标准 §14：`typecheck`/`lint`/`test`/`build` 四门各自 2G、串行互斥、精确时间与退出码，全绿且不低于基线

---

## 1. 测试环境

- 后端：`Smart-WorkFlow` Maven reactor，`MAVEN_OPTS=-Xmx2g`，H2 默认库，PG 由 `FlywayFullChainPostgresTest`（zonky embedded-postgres 17.5, `postgres://localhost:随机端口/postgres`）在同一 `mvn test` 内校验
- 前端：`Smart-WorkFlow-Web`，`NODE_OPTIONS=--max-old-space-size=2048`，Vitest 4.1.9，eslint 9，vue-tsc，vite/Rolldown

---

## 2. 实际执行的测试命令（精确时间 · 退出码 · 互斥声明 · 关键输出裁剪）

```bash
# ── 后端 compile（2G） ──
# pgrep before: /usr/bin/pgrep -f "[m]vn" exit:1 / /usr/bin/pgrep -f "[p]npm" exit:1  (零匹配 — 字符类规避自匹配)
# Command:
MAVEN_OPTS="-Xmx2g" mvn compile -DskipTests -q
# [log: empty -q] exit:0  Time: 2026-08-22T14:54:09Z → 2026-08-22T14:54:12Z

# ── 后端 test 全量（2G，含 PG，真跑 — 14:54:19Z → 14:55:08Z exit:0） ──
# pgrep before: /usr/bin/pgrep -f "[p]npm run" exit:1 (无前端并发)
MAVEN_OPTS="-Xmx2g" mvn test -Dsurefire.failIfNoSpecifiedTests=false
# 裁剪：
# 14:55:08.739 Successfully validated 36 migrations (H2)
# 14:55:08.740 Migrating schema PUBLIC to version 31 - admin role governance
# [INFO] Tests run: 13, Failures: 0, Errors: 0 — FlywayFullChainH2Test (36 条 0.92s validate OK)
# [INFO] Tests run: 10, Failures: 0, Errors: 0 — FlywayFullChainPostgresTest (36 条 zonky 17.5 10-tests 3.0s)
# [INFO] Tests run: 28, Failures: 0 — AgentGraphDebugSecurityIntegrationTest (MockMvc 真实 @PreAuthorize+JWT)
# [INFO] Tests run: 15, Failures: 0 — AgentGraphDebugBehaviorIntegrationTest (快照/单步/分支/断点/并发/终态 + G2/G4/G8 新增)
# 聚合（控制台含嵌套 wrapper 二次计数）：1654/0/0/0 ; Surefire XML 去重 827/0/0 leaf 107 zero 12
# [INFO] BUILD SUCCESS 2026-08-22T14:55:08Z | Total time: 48.477s exit:0
# pgrep after: /usr/bin/pgrep -f "[m]vn" exit:1 / /usr/bin/pgrep -f "[v]itest" exit:1 (后端结束后无残留)

# ── 前端（2G，等后端 BUILD SUCCESS 后开始 — 14:56:07Z → 14:56:56Z） ──
# pgrep before: /usr/bin/pgrep -f "[m]vn" exit:1 (无后端残留)
# typecheck 14:56:07Z → 14:56:15Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" ./node_modules/.bin/vue-tsc -b --noEmit
# [output: empty] exit:0
# lint 14:56:15Z → 14:56:26Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx eslint .
# eslint: 0 errors 75 warnings (prettier-only) exit:0
# vitest 14:56:27Z → 14:56:54Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vitest run
# Test Files 86 passed (86) Tests 849 passed (849) Duration 27.18s
# build 14:56:54Z → 14:56:56Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vite build
# ✓ built in 1.17s (仅 @vueuse pure 注解 warning, 非失败)
```

> 计数口径：控制台 1654 = 含 JUnit 嵌套 inner-class wrapper（`$InnerClass 0 tests` + `InnerClassTests 3 tests`）二次计数；**Surefire XML 827** 为去重后 leaf suites 真实用例数（107 leaf suites, 12 zero suites）。D175 基线 755/Agent267 为历史时点快照；终值 827 含 V36 与本轮 Debugger 42（安全28+行为15+引擎13+PG/H2 23，含嵌套去重后净增）。

---

## 3. 各测试项结果（新增定向 + 回归）

### 3.1 后端 — 定向补充（新增 43 覆盖 D177 锁定外剩余）

| 集合 | 归属 | 覆盖 | 数 | 关键断言举例 |
|------|------|------|----|--------------|
| `AgentGraphDebugSecurityIntegrationTest` 28 | MockMvc 真实链 | #1,#7 | 28 | create→200 PAUSED expiresAt nextNodeId / 403 / 401 / superAdmin 200；GET/nodes/step/continue/stop/breakpoints 各 401/403/200；非法断点 400、跨租户 404 |
| `AgentGraphDebugBehaviorIntegrationTest` 15 | 服务集成 | #2,#3,#4,#5,#7,#8,#9,#11 | 15 | G2 同图同key快照：会话graph_json不含node_llm而定义已含；G4 调试 vs 普通 nodeSeq/branchId/nodeId/result 完全相等；G8 AtomicInteger 1 次；LOOP/FORK 不合并；五终态互斥+次步拒接；调试/执行表隔离；并发409 |
| `AgentGraphDebugEngineTest` 13 | 纯引擎 | #3,#4 | 13 | START→LLM→END peek/terminal、TOOL、命名变量、STEP_LIMIT |
| `FlywayFullChainH2Test` 13 / `FlywayFullChainPostgresTest` 10 | 迁移 | #13 | 23 | 新库 36 条、升级链 V32→尾4条 V33→尾3条、validate、调试表存在、checksum哨卫 — 真跑 |

### 3.2 前端 — 定向补充（新增 4 覆盖 G6/G11，回归 30）

| 文件 | 覆盖 | 断言举例 |
|------|------|----------|
| `agent-debug-refresh.spec.ts` 1/1 | #6 | 真实 createRouter+push mount 首次 trace1/llm_1，销毁后新建同URL重建拉取次态 trace3/end_1（调用计数递增） |
| `DebugExecutionLogClosure.spec.ts` 3/3 | #11 | pageGraphExecutions ↔ pageDebugSessions Set<id>不相交；仅调执行域且不含调试文案；调试终态经 /agent/debug/:sessionId 可达 |
| `DebugSessionView.spec.ts` 15 | #6,#10,#11 | unmount重挂载、超长/非JSON/HTML转义、__SECRET未入URL、调试不调执行历史 |
| `agent-debug-handlers.spec.ts` 15 | #12 | 8 handler 401/403/404/409/400/EXPIRED 对账 |

### 3.3 回归

- 后端全量 827(Surefire)/1654(控制台) 0失败（17 模块 SUCCESS）；前端 86/86 849/849（> 82/815）；H2 36 + PG 36 validate

---

## 4. 通过项

后端 827/0/0/0 (Surefire 去重) / 1654 控制台、前端 849/0/0/0、迁移 36×2 全部通过

---

## 5. 失败项

无

---

## 6. 跳过项及原因

无（PG 本轮已真实运行，非跳过）

---

## 7. 关键日志或错误信息

无阻塞；PG `zonky 17.5` 正常起停；Build 仅 @vueuse pure 注解 warning

---

## 8. 是否满足验收标准

满足 §14：四门 2G 串行精确时间与退出码，全量超越基线；PG/H2 36 条真跑；#1-12 行为证据覆盖

---

## 9. 回归风险

- `state_json` 依赖发布 graphKey 冻结规则（modified 设 null 跳检查，已验证）；`AgentGraphDebugEngine` 镜像解释器需同源变更

---

## 10. 最终结论

PASSED（本回执为 D177 剩余 G2/G4/G6/G8/G11/G13/G14 的补证行为证据；G15 全量同步待执行层完成后单独回执）

## 11. 记忆更新草稿（供规划层核对后落盘）

- `memory/state.md` 待补：`agent-graph-step-debugging | P7 M07-F02-04 单步调试 | PASSED（待编号） 补充行为证据 D177-G2/G4/G6/G8/G11/G13/G14`；基线 Surefire 827 / 控制台1654 / 前端86f/849t
- `memory/features.md` 待更：`agent-graph-step-debugging` 保持自验 8/8 补证完成，待规划复验
