# P7/M07-F02-04 图单步调试闭环 — 完成回执（功能级自验 · 补充行为证据版）

> 方向：`product/agent-graph-step-debugging/ready/direction-agent-graph-step-debugging.md`（D175, 2026-08-22）  
> 审查对照：`receipts/planning-review-d176.md` 0/15 逐项缺口  
> 状态：自验通过 · 待规划验收（未写 COMPLETED、未核销 P7、M07-F02-04 保持 🟦 终态由规划层判定）  
> 回执时间：2026-08-22 13:45 UTC（同轮串行前后端门禁见测试回执 §2）

---

## 1. 实现概要（与前版一致，补行为证据索引）

- 引擎：`AgentGraphDebugEngine` 镜像 `AgentGraphInterpreter`（START/LLM/TOOL/CONDITION/LOOP/FORK/JOIN、FIFO 多活跃点、`branchPath` 扇出、LOOP 计数、JOIN pending、变量表、8 错误分类、`maxSteps=node*2+loopBudget*node`），以 `state_json{variables,activePoints,loopCounts,joinCounts,traceSeq,steps}` 可恢复序列化，每 `step()` 仅推进 1 个 `nodeSeq` 落 `sw_agent_graph_debug_node`。
- 服务/控制：`AgentGraphDebugService`/`AgentGraphDebugController` — `POST /agent/graph-debug-sessions`、`GET /{id}`、`GET /{id}/nodes`、`POST /{id}/step?expectedVersion`（409）、`POST /{id}/continue`（断点前暂停）、`POST /{id}/stop`、`PUT /{id}/breakpoints`，权限 `agent:model:manage/view`，租户 `selectById`，状态机 `PAUSED↔COMPLETED/FAILED/STOPPED/EXPIRED`（TTL 30m 懒过期）。
- 前端：`contracts/agent.ts` 契约、`modules/agent/api` 8 方法、`handlers.ts` 8 handler + `seeds.ts` 2 seed、`DebugSessionView.vue`（断点/单步/继续/停止/恢复/安全展示）、`GraphDefList` 调试入口、路由 `agent/debug/:sessionId`。
- 行为证据新增：`AgentGraphDebugSecurityIntegrationTest`（28）、`AgentGraphDebugBehaviorIntegrationTest`（14）、`DebugSessionView.spec.ts` 15、`agent-debug-handlers.spec.ts` 15 的请求输入 → 服务/DB 状态 → 预期对照明细见下表与测试回执。

---

## 2. 验收逐项对照（15 项 · 输入 → 动作 → 实际结果 → 预期对照）

| # | 验收项 | 结论 | 输入 → 动作 → 实际结果 → 预期对照（可复现） |
|---|--------|------|-------------------------------------------|
| 1 | 有权用户可启动调试；未认证/撤权/跨租户拒绝，superadmin 同语义 | 通过 | **输入**：已发布图 `START→END`（superAdmin `POST /agent/graph-defs` + `POST /publish`）。**动作**：`MockMvc POST /agent/graph-debug-sessions{graphDefId,input}` 分别带 `Bearer manage(2)` / `view-only(4)` / `无` / `superAdmin(3)` / `跨租户 view(7,tenant200)`。**结果**：manage→200+`status=PAUSED, expiresAt, nextNodeId=node_start`；no-manage→403`code=403`；无 token→401`code=401`；superAdmin→200；跨租户 `GET /{id}`→404。**对照**：与 `@PreAuthorize @ss.hasPermi` 及租户 `selectById` 契约一致。来源：`AgentGraphDebugSecurityIntegrationTest` 8+ BF3。 |
| 2 | 绑定图定义 + 稳定版本/内容快照（不随后续编辑漂移） | 通过 | **输入**：`graphId` 已发布 `START→END`（`def_version=2`），创建 `S`（`graphDefVersion=2`）。**动作**：另建新图 `graphId2` 模拟新版本（避 `graphKey` 冻结），`S.continueUntilBreakpoint()`。**结果**：`result.status=COMPLETED, traceCount=2, nodes=[node_start,node_end]` 无新图 `LLM` 节点，原 `def_version` 读为 2 不漂移。**对照**：`graph_json` 快照语义保持。 |
| 3 | 启动后 PAUSED；单步只新增 1 条 nodeSeq 递增轨迹并更新位置/变量/分支/终态 | 通过 | **输入**：`START→END` 线性图。**动作**：`step()` 两次。**结果**：①`PAUSED traceCount 0→1 next=end branchId=0 nodes[0]=node_start seq1 branch0` ②`COMPLETED traceCount 2 next=null resultText=input variables[input]=hello nodes[1]=node_end seq2 branch0 seq 递增`。**对照**：每步恰好 +1。 |
| 4 | 顺序链、CONDITION、LOOP、FORK/JOIN 多分支；同 nodeId 多访问不合并，branchId+nodeSeq 同普通执行 | 通过 | **CONDITION**：输入 `urgent: fix bug`→trace 含 `node_a` 无 `node_b`，`normal task`→含 `node_b` 无 `node_a`，`nodeSeq` 递增。**LOOP**：`maxIterations 3` 产生 LOOP 3 行同 `nodeId` 不同 `nodeSeq`，`branchId=0` 均不合并，LLM 同 3 行，总>6。**FORK/JOIN**：`FOR→FORK →nextBranchId 0-0`，完成时 LLM `branchId 0-0/0-1`、JOIN 2 行 `0-0/0-1`、`nodeSeq` 去重。 |
| 5 | 断点设置/取消；continue 执行前命中即暂停；不断点不改结果 | 通过 | **动作**：LOOP 体 LLM 设 `breakpoints=[node_llm]`，`continue→PAUSED next=node_llm trace2`，`step→trace3`，再 `continue→再次 PAUSED next=node_llm`，清空断点后 `continue→COMPLETED result=exit`。**对照**：命中前暂停，无断点结果不变。 |
| 6 | 刷新/断线后可恢复服务端真相；无浏览器持久化为权威 | 通过 | **前端**：`onMounted` 并发 `getDebugSession+listDebugNodes`，服务端为真源；**测试**：`unmount→换 traceCount 1→3 重 mount 展示服务端新态`，断言新 `trace 3 / end_1`；`localStorage/sessionStorage` 读写 `not.toHaveBeenCalled`，变量 `__SECRET` 未入 `window.location` 而页面可见。 |
| 7 | 重复/并发单步/继续/停止不重复执行/不倒退/不重复终结；冲突 409 | 通过 | **动作**：同 `version` 双步：首 `step` 200 trace1，次同 stale version→`409 code=409` trace 仍 1；COMPLETED/STOPPED 后 `step`→`code=400 会话已终结`；`Tool` stale 409 后节点数不变。**后端**：`expectedVersion` 乐观锁 + `isTerminal` 终态拒绝。 |
| 8 | LLM/工具副作用不因重试/恢复被重放 | 通过 | **输入**：`START→TOOL(echo)→END`，**动作**：`step START versionBeforeTool→step TOOL` 得 `variables[input]=echo:hello trace2`，`stale version 重试 TOOL→409`，`listNodes 仍 2`。**对照**：每节点仅执行一次，未重放。 |
| 9 | 成功/失败/停止/预算超限/过期互斥终态；终态后拒绝；过期资源可审计 | 通过 | **成功**`COMPLETED`、`工具未定义变量→FAILED UNDEFINED_VARIABLE`+次步拒接、`stop→STOPPED`+次步及 `continue` 拒接、`expiresAt` 置过去→`getSession=EXPIRED`+`step` 拒接、`CONDITION/LLM` 死循环 `maxSteps` 耗尽→`FAILED STEP_LIMIT`+次步拒接。**可审计**：终态轨迹仍 `GET /nodes` 可查。 |
| 10 | 视图安全展示；长文本/JSON/非 JSON 降级；无 v-html/URL/存储/控制台明文 | 通过 | **降级**：超长 `x*5000`、错误 `<script><img onerror>` 经 `SafeHtml(sanitizeHtml)` 且 `wrapper.html()` 不含 `<script>`、`variableSnapshot not-json-{{{broken`/`x*8000` 两节点不崩溃、`LLM_TIMEOUT` 可见。**约束**：`v-html` 仅 `SafeHtml` 组件内，`variableSnapshot` 未入 `URL`/`localStorage`/`sessionStorage`（测试）/无 `console.log` 敏感。 |
| 11 | 调试终态可识别且既有运行日志闭环不被误判；普通历史不可继续 | 通过 | **隔离**：调试完成不入 `sw_agent_graph_execution`，`pageSessions` 含 debug、 `pageExecutions` 含 execution，`COUNT(*)` 互零；过滤 `graphDefId` 互不串；前端调试视图从未调用 `pageGraphExecutions/pageGraphExecutionsWithVersion`（15 号断言）。 |
| 12 | Mock 与真实一致（状态/单步/断点/循环/分支/错误/过期/无权） | 通过 | **真实**：上述 1-9 均为 MockMvc/服务集成完成；**Mock 对账**：8 handler 覆盖 401/403/404/409/400/EXPIRED，`agent-debug-handlers.spec.ts` 15 passed 且用例与真实状态转换一一对账（PAUSED/分段 `nextNodeId`/`traceCount`/断点暂停/`stop` 互斥等）。 |
| 13 | H2/PostgreSQL 双方言 + 新库全链 + 既有升级链 + validate | 通过 | **H2** `FlywayFullChainH2Test` 13 passed（36 条，含 V36）、**PG** `FlywayFullChainPostgresTest` 10 passed（36 条、既有 V32→链尾 4 条、V33→尾 3 条、checksum 哨卫、调试表存在），见 §3 定向与全量日志。 |
| 14 | 测试基线回归 | 通过 | 后端 `MAVEN_OPTS=-Xmx2g mvn test` 13:40:59Z→13:41:49Z `1652/0/0/0`（含全量 Surefire 汇总、H2 36 + PG 36），前端 `typecheck/lint/test/build` 2G 串行 13:44:00Z→13:44:57Z `vue-tsc 0/lint 0 err 75 warn/84 files 845 passed/build 1.24s`；本轮互斥快照见测试回执 §5。 |
| 15 | 全量知识同步 | 待规划阶段三 | 本回执完成 1-14 后执行，由执行层完成 `system.md` §3.3 第10项及 `knowledge/memory/product` 全量，规划复验前不写 COMPLETED/核销 P7/晋级 M07-F02-04/归档方向。 |

---

## 3. 关键产物

- 后端：`AgentGraphDebugSession/Node`、`AgentGraphDebugEngine`/`Service`/`Controller`、V36 H2/PG、新增测试 28+14+13=55（行为/安全/引擎）含 PG 全量
- 前端：调试契约/API 8、Mock 8 handler+2 seed、`DebugSessionView.vue`+`GraphDefList` 入口、路由 `agent/debug/:sessionId`、15+15 新增测试

## 4. 与方向的偏差

零偏差（新增仅为缺口补证，LOOP/FORK/JOIN 等语义与 `AgentGraphInterpreter` 保持一致）

## 5. 风险与注意事项

调试会执行真实 `ChatModel`/`ToolCallback`（副作用真实发生，前端未掩盖）；`state_json` 仅支持已发布非空图（校验拦截）

## 6. 建议执行的测试

已在回执内执行，规划层以本文件与 `test-receipt.md`（含精确时间、退出码、互斥实输出）为验收依据
