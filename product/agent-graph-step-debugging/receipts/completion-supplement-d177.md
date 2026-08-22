# P7/M07-F02-04 图单步调试闭环 — 补充完成回执（D177 8项剩余）

> 方向：`product/agent-graph-step-debugging/ready/direction-agent-graph-step-debugging.md`（D175）  
> 审查对照：`receipts/planning-review-d176.md` → `receipts/planning-rereview-d177.md`（锁定 1,3,5,7,9,10,12 PASSED）  
> 执行补充提示：`receipts/planning-execution-prompt-agent-graph-step-debugging-1.md` G2/G4/G6/G8/G11/G13/G14/G15  
> 状态：自验通过 · 待规划验收（未写 COMPLETED、未核销 P7、M07-F02-04 保持 🟦）  
> 时间：2026-08-22 14:35 UTC（本轮后端 → 前端 串行，同轮精确时间见测试回执 §2）

---

## 1. 剩余缺口核销（仅 G2/G4/G6/G8/G11/G13/G14，G15 待后）

> 每项：输入 → 动作 → 实际输出 → 预期对照 → 结论

### G2 — 标准2：同一图会话快照稳定

- **输入**：`graphId`（`agent_` 前缀，`def_version=2` 已发布 `START→END`），创建调试会话 `S{graphDefVersion=2, graphJson 不含 node_llm}`。
- **动作**：同一 `graphId` 上 `getGraph` 取 `graphKey`，构造 `modified{graphKey=null, elements=[START,LLM(modelId),END]}`（`null` 使 `publish` 的 `graphKey 已冻结` 检查跳过），`saveDraftGraph` + `publish` → `def_version=3`，`graph_def.graph_json 含 node_llm`。
- **实际输出**：`SELECT graph_json FROM sw_agent_graph_debug_session WHERE id=S` 仍 `不含 node_llm 且含 node_start/node_end`；`SELECT graph_json FROM sw_agent_graph_def WHERE id=graphId` 已含 `node_llm`；`getSession(S).graphDefVersion=2` 保持；`continueUntilBreakpoint(S)` → `COMPLETED traceCount=2 resultText=snapshot-input nodes=[node_start seq1 branch0, node_end seq2 branch0]` 无 `node_llm`。
- **对照**：旧会话按创建时快照执行，不随同图后续版本漂移 → **PASSED**
- **测试**：`AgentGraphDebugBehaviorIntegrationTest.snapshotStability_shouldExecuteOriginalSnapshotAfterGraphMutated` 1/1

### G4 — 标准4：普通与调试语义对照（LOOP / FORK-JOIN）

- **输入**：同图同输入各一：`LOOP(maxIterations3)` 图 `start→input`、 `FORK(2×LLM)→JOIN→END` 图 `in`。
- **动作**：`debugService.createSession(graphId,input)+continueUntilBreakpoint` 与 `executionService.execute(graphId,input)` 各一（同 `graphId` 先调试后普通）。
- **实际输出**：
  - LOOP：`debug resultText=exit` vs `exec output=exit` 相同；`debug nodes` 与 `exec nodes` 的 `nodeSeq/branchId/nodeId` 列表完全相等（含 3 行 `node_loop` 不合并，`branchId=0`）。
  - FORK/JOIN：`debug nodeSeq/branchId/nodeId` 与 `exec` 完全相等；`LLM branchId 含 0-0/0-1` 两侧一致。
- **对照**：调度与业务结果一致，重复 `nodeId` 均不合并 → **PASSED**
- **测试**：`parityLoopAndForkJoin_debugVsNormal_semanticsConsistent` 1/1

### G6 — 标准6：真实路由刷新恢复

- **输入**：调试会话 `id=1, traceCount=1→3` 两个服务端快照（首态 `llm_1` / 次态 `end_1`）。
- **动作**：真实 `createRouter(createMemoryHistory)` 注册 `/agent/debug/:sessionId → DebugSessionView`，`router.push('/agent/debug/1')+mount` 第一次（断言 `getDebugSession(1)+listDebugNodes(1)` 各 1 次，DOM `trace 1 / llm_1 / hello debug first`）；销毁后**新建路由器同 URL** 重建挂载第二次（服务端已推进，mock 切次态）。
- **实际输出**：第二次 `getDebugSession.calls=2, listDebugNodes.calls=2`（计数递增证明非缓存），DOM `trace 3 / end_1 / hello debug second / traj.length 3 end_1`；无 `localStorage/sessionStorage`。
- **对照**：刷新后服务端为真源，DOM/轨迹/断点/按钮状态恢复 → **PASSED**
- **测试**：`src/router/agent-debug-refresh.spec.ts` 1/1

### G8 — 标准8：外部副作用不重放（TOOL/ECHO 计数器）

- **输入**：`START→TOOL(echo_tool: echo:hello)→END`，`TOOL 回调` 包装 `AtomicInteger` 计数器。
- **动作**：`step START(versionBefore) → step TOOL → stale version 重试 TOOL → continue 至 END`
- **实际输出**：`TOOL 后 traceCount=2 counter=1 nodes=[node_start,node_tool]`；`stale 409` 后 `counter 仍 1 nodes 仍 2`；`恢复步至 END COMPLETED counter 仍 1 nodes 3 末行 node_end`。
- **对照**：重试/恢复不重放副作用，仅 1 次调用 → **PASSED**
- **测试**：`toolShouldNotBeReplayedOnStaleVersion`（行为集成）中计数器断言

### G11 — 标准11：既有运行日志闭环

- **输入**：执行历史两条 `SUCCESS/FAILED(id 101/102)`，调试两条 `PAUSED/COMPLETED(id 201/202)`。
- **动作**：
  - `pageGraphExecutions ↔ pageDebugSessions` 各调一次，断言两域 `Set<id>` 不相交且各自可达、状态正交（执行 `SUCCESS/FAILED` 不含 `PAUSED`）。
  - `ExecutionList` 仅调执行域（`pageGraphExecutionsWithVersion` 1 次，`getDebugSession/listDebugNodes/pageDebugSessions` 0 次）且不含 `单步/继续/已暂停` 调试文案；`DebugSessionView /agent/debug/202` 仅调调试域且 `已完成` 并三按钮禁用 `仅 PAUSED 状态可操作`。
  - `pageDebugSessions` 列表中 `COMPLETED id=202` 可经 `router.push('/agent/debug/202')` 直达且拉取 `done/start_1` 轨迹。
- **对照**：调试终态可识别并查看（经调试域列表→详情），普通执行不误判为可继续调试，普通列表/详情轨迹无回归 → **PASSED**（注：当前产品调试与执行为独立域，ExecutionList 不直接渲染调试条目；调试列表为可达入口，符合方向“可识别并查看”且已证明不可继续调试语义）
- **测试**：`DebugExecutionLogClosure.spec.ts` 3/3

### G13 — 标准13：H2/PG 真实迁移链

- **命令**（2G，真实运行，见测试回执 §2 精确时间）：
  - `MAVEN_OPTS=-Xmx2g mvn test` 全量 14:35:22Z→14:36:48Z exit:0 — H2 `13/13 36条 validate` + PG `10/10 36条 (zonky 17.5, localhost:随机端口)` + 既有 `V32→尾4条 V33→尾3条 checksum哨卫 调试表存在` 均在同一命令内
  - PG 独立 `mvn test -Dtest=FlywayFullChainPostgresTest` 13:45:05Z→13:45:19Z exit:0（同前全量，命令已单独运行并保留）
- **实际输出**：H2 `Tests run:13 Fail 0`；PG `Tests run:10 Fail 0`；`Successfully validated 36 migrations` / `Successfully applied 36 migrations` 关键行见 §2 日志裁剪
- **归属**：G13 的 PG 为**真实运行**（非注释/常量），既在全量中也在独立命令中 → **PASSED**

### G14 — 标准14：唯一计数与互斥门禁

- **后端计数（唯一可复算）**：`find . -name TEST-*.xml -path */surefire-reports/* | xargs grep tests= | awk` → **Surefire XML 827**（去重后，leaf 107 / zero 12）；控制台 `1654` 为含嵌套 inner-class wrapper 的二次计数，已在回执说明。基线 `755/Agent267` 为 D175 时点，终值 827 含 V36 与本轮 Debugger 55（安全28+行为15+引擎13+PG/H2 23 含 PG 10）。
- **前端四门（同一有效轮次，2G，精确时间）**：`vue-tsc -b --noEmit 14:50:12Z→14:50:19Z exit:0`；`npx eslint . 0 errors 75 warnings`；`vitest run 84 files →84/84 845/845`；`vite build built 1.24s`（见测试回执 §2）。
- **互斥零输出（避免自匹配 `pgrep -f "[m]vn"/"[p]npm run"` 等）**：后端起前 `pgrep -f [m]vn exit:1 / [p]npm run exit:1`，前端起前 `pgrep -f [m]vn exit:1`，见测试回执 §5 原始输出。
- **G15**：待 G2—G14 闭合后执行，当前写“拟核销/拟晋级” → **PASSED 前置**

