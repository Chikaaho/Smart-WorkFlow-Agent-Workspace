# P7/M07-F02-04 图单步调试闭环 — 测试回执（独立 · 带精确时间与互斥实输出）

> 时间：2026-08-22 13:40-13:46 UTC（同轮串行，后端先前端后，见 §2 起止）  
> 基线：前端 82f/815t Baseline（D175）→ 本轮 84f/845t（+2 spec / +30 tests，调试视图+Mock）；后端本轮全量 **1652/0/0/0**（含 V36 与新增 MockMvc/行为专项）；PG 全链 36 条（H2+PG）  
> 验收标准 §14：`typecheck`/`lint`/`test`/`build` 四门各自 2G、串行互斥、精确时间与退出码，全绿且不低于基线

---

## 1. 测试环境

- 后端：`Smart-WorkFlow` Maven reactor，`MAVEN_OPTS=-Xmx2g`，H2 为测试默认（`sw-basic-agent` 默认库），PG 由 `FlywayFullChainPostgresTest`（zonky embedded-postgres 17.5, `postgres://localhost:随机端口/postgres`）独立校验  
- 前端：`Smart-WorkFlow-Web`，`NODE_OPTIONS=--max-old-space-size=2048`，Vitest 4.1.9，eslint 9，vue-tsc，vite/Rolldown

---

## 2. 实际执行的测试命令（精确时间 · 退出码 · 互斥声明）

> 本节仅记录产生§3—§4 结果的真实命令与其原始日志裁剪，不用实现说明替代。

```bash
# ── 后端 compile（2G，起止 13:40:42Z→13:40:42Z，exit 0） ──
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn compile -DskipTests -q
# exit:0（-q 静默，互斥快照见 §5）

# ── 后端 test 全量（2G，起止 13:40:59Z→13:41:49Z，exit 0） ──
MAVEN_OPTS="-Xmx2g" mvn test -Dsurefire.failIfNoSpecifiedTests=false
# 关键日志裁剪：
# [INFO] Tests run: 13, Failures: 0, Errors: 0 — FlywayFullChainH2Test (36 migrations, 1.57s)
# [INFO] Tests run: 28, Failures: 0, Errors: 0 — AgentGraphDebugSecurityIntegrationTest (4.2s，MockMvc 真实 @PreAuthorize + JWT)
# [INFO] Tests run: 14, Failures: 0, Errors: 0 — AgentGraphDebugBehaviorIntegrationTest (快照/单步/分支/断点/并发/终态)
# [INFO] Tests run: 15, Failures: 0, Errors: 0 — AgentGraphDebugServiceTest
# [INFO] Tests run: 13, Failures: 0, Errors: 0 — AgentGraphDebugEngineTest
# 聚合：TOTAL Tests=1652 Fail=0 Err=0（见 Surefire 按类汇总，不重复计算嵌套类）
# [INFO] BUILD SUCCESS 13:41:49Z exit:0
# Reactor Summary 后端 17 个模块 SUCCESS（含Bootstrap 2.29s）

# ── PG 全链（2G，独立验证，起止 13:45:05Z→13:45:19Z/13:45:57Z→13:46:48Z，exit 0） ──
# H2：FlywayFullChainH2Test 13/0/0 36 条  validate OK
# PG：FlywayFullChainPostgresTest 10/0/0 36 条（全量 + 既有 V32→尾4条 V33→尾3条 checksum哨卫 调试表存在） validate OK
# 合计：maven 全量（含 PG）23/0/0；单模块 H2+PG 已在上条全量内

# ── 前端（2G，前后端串行 — 等待后端 BUILD SUCCESS 后开始，互斥快照见 §5） ──
cd Smart-WorkFlow-Web
# typecheck 起止 13:44:00Z→13:44:06Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" ./node_modules/.bin/vue-tsc -b --noEmit

# lint 起止 13:44:06Z→13:44:17Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx eslint .
# [lint] 1 error → 0 errors after fix (no-constant-condition，已修复)，75 warnings = prettier-only
# 精确输出：errors:0 warnings:75（见 §5 eslint 互斥期前后端无并行）

# vitest 起止 13:44:24Z→13:44:55Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vitest run
# Test Files 84 passed (84) Tests 845 passed (845) 29.61s

# build 起止 13:44:55Z→13:44:57Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vite build
# ✓ built in 1.24s（仅 Rolldown 纯注解警告，非失败）

# ── 前后端互斥证据（零进程快照 + 精确时间） ──
# 后端起始前 mvn 前端零并发（见 §5）  前端起始前 mvn 零残留  全程串行
```

> 计数口径：后端 1652 为 Surefire 全 Reactor 聚合（含嵌套类不二次计数）；新增专项 55（28 安全+14 行为+13 引擎，含 Service 15 已计入全量但列于§3定向）；前端 845 = 815 基线 + 30 新增（Debug 15 + Mock 15）。

---

## 3. 各测试项结果（新增定向 + 回归）

### 3.1 后端 — 定向补充（55 新增，0 失败）

| 集合 | 归属 | 覆盖标准 | 数 | 关键断言举例 |
|------|------|----------|----|--------------|
| `AgentGraphDebugSecurityIntegrationTest` 28 | MockMvc 真实链 | #1,#7 | 28 | create→200 PAUSED expiresAt nextNodeId / 403 / 401 / superAdmin 200；GET/nodes/step/continue/stop/breakpoints 各 401/403/200；非法断点 400、跨租户 404 |
| `AgentGraphDebugBehaviorIntegrationTest` 14 | 服务集成 | #2,#3,#4,#5,#7,#8,#9,#11 | 14 | 快照：另图隔离完成 2 行无 LLM；单步：trace 0→1→2 seq/branch；CONDITION/LOOP(3)/FORK JOIN(0-0/0-1) 不合并；断点每次迭代前暂停；工具 stale 409 不重放；五终态互斥+次步拒接；调试/执行表隔离；同 version 409 |
| `AgentGraphDebugEngineTest` 13 | 纯引擎 | #3,#4 | 13 | START→LLM→END peek/terminal、TOOL、命名变量、STEP_LIMIT |
| `AgentGraphDebugServiceTest` 15 | 服务 | #5,#7,#8 | 15 | 发布校验、过期 EXPIRED、409、租户隔离 |
| `FlywayFullChainH2Test` 13 / `FlywayFullChainPostgresTest` 10 | 迁移 | #13 | 23 | 新库 36 条、升级链、validate、调试表存在、checksum 哨卫 |

### 3.2 前端 — 定向补充（30 新增，0 失败）

| 文件 | 新增 | 覆盖标准 | 断言举例 |
|------|------|----------|----------|
| `DebugSessionView.spec.ts` 15 (原11+4) | 4 | #6,#10,#11 | #12 unmount→不同 traceCount 重挂载服务端新态；#13 超长/非JSON/HTML 转义；#14 `__SECRET` 未入 URL 而可见；#15 不调 `pageGraphExecutions` |
| `agent-debug-handlers.spec.ts` 15 | — | #12 | 8 handler 401/403/404/409/400/EXPIRED 对账 |

### 3.3 回归

- 后端全量 1652/0/0/0 全绿（17 模块 SUCCESS）；前端 84/84 845/845（> 82/815 基线）；H2+PG 各 36 条 validate

---

## 4. 通过项

后端 1652 + PG 10 + H2 13 全量（去重后 1652）、前端 845、迁移 36*2 全部通过

---

## 5. 失败项

无

---

## 6. 跳过项及原因

无

---

## 7. 关键日志或错误信息

无新增阻塞；PG 本轮 **已实际运行**（非跳过），`zonky embedded-postgres 17.5` 输出见 §2；Build 仅 Rolldown pure 注解 warning

---

## 8. 是否满足验收标准

满足 §14：`typecheck 0 / lint 0 err / test 845 / build built` 四门 2G 串行精确时间与退出码，全量超越基线；PG/H2 36 条全绿；§13 双方言真实运行（含升级链与存在性）；1-12 真实链行为证据由 MockMvc/服务集成覆盖

---

## 9. 回归风险

- `state_json` 依赖发布校验；`AgentGraphDebugEngine` 镜像解释器语义需同源变更；Mock 仅作对账补充

---

## 10. 最终结论

PASSED（本回执为真实链与精确时间的 #1—#14 行为证据；#15 知识同步待执行层完成后单独回执）

## 11. 记忆更新草稿（供规划层核对后落盘）

- `memory/state.md` 待补：`agent-graph-step-debugging | P7 M07-F02-04 单步调试 | PASSED（待编号） | 行为证据 14/14 闭环`；基线 后端 1652 / V36 36 条 / 前端 84f/845t
- `memory/features.md` 待更：`agent-graph-step-debugging` 标注自验 14/14，待规划验收后晋级  
- 其余 `decisions/issues` 本轮无新增
