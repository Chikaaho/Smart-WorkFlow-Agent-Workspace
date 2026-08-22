# Agent 图单步调试闭环

## 功能编号
M07-F02-04 单步调试子集 / P7 第二子集

## 功能状态
**COMPLETED（D180 规划层最终验收 15/15 PASSED + 终态同步，2026-08-23）；P7 已核销、M07-F02-04 升 ✅、清单 ✅26/🟦24/⬜40、功能数 30（第30个）、正式基线 827/Agent338、86f/850t、V36；终态同步回执已提交，待规划层最终复验与归档**

## 功能概述
在既有图执行历史（运行日志查看，已由 agent-graph-execution-observability 闭环）基础上，为调度图提供**单步调试**能力：调试会话创建/断点设置/暂停/恢复/单步/终止、节点执行状态与轨迹、引擎驱动、权限安全、既有运行日志入口穿透，以及调试域失败时不影响普通运行日志的降级。

## 完成日期
COMPLETED 2026-08-23（D180 规划层最终验收 15/15 PASSED + 终态同步，第30个）

## D180 规划层最终验收（2026-08-23，锁定）
- 标准1—13沿用D179前已锁定结论；本轮标准14、15通过，累计 **15/15**。
- 正式基线晋级：后端 **827/0/0/0（Surefire XML 119文件；agent 338）**、前端 **86 spec files / 850 tests**、Flyway **V36** 双方言36条。计数勾稽 `755 + 71调试测试 + 1 V36 PG全链 = 827`。
- 终态同步（D180 后方向）已提交：P7 核销、M07-F02-04 升 ✅、清单 **✅26/🟦24/⬜40** 已实际落盘（标准1/2/3/4/7 锁定）。
- **终态同步完成（D180 后方向）**：P7 已核销、M07-F02-04 升 ✅、清单 **✅26/🟦24/⬜40**、已完成功能数 **30**、全文当前态收敛；终态同步回执已提交，待规划层最终复验与归档。
- 审查：`product/agent-graph-step-debugging/receipts/planning-final-review-d180.md`（D180）；终态同步方向 `ready/direction-post-d180-terminal-sync.md`（待规划层最终复验后归档）。

## D179 补证结论（2026-08-23，执行补充提示3 G14/G15）
- **标准14 计数（唯一可复算）**：D175 基线 755（D169 新鲜门禁快照）发生在调试功能创建前；本功能全部新建调试测试类在基线中数量为 0。当前 Surefire XML 逐文件核对：**827 tests / 0 failures / 0 errors / 0 skipped（119 叶文件，leaf 107 / zero 12）**；净新增 = 71（本功能 4 个新 Debug 测试类：Security 28 + Behavior 15 + Engine 13 + Service 15，全部未跟踪基线0）+ 1（FlywayFullChainPostgresTest 9→10，V36 全链验证） = **72**；`755 + 72 = 827` 严格一致，无需倒推。旧口径（42/55/79、ServiceTest 基线10净增5）在当前回执中明确废弃。
- **标准14 互斥（完整工具族实际命令）**：本轮 2G 串行门禁前后端每个门禁点均实际执行避免自匹配的 `pgrep -f`（`[m]vn`/`[j]ava.*surefire`/`[p]npm`/`[n]pm run`/`[n]ode`/`[v]ite`/`[v]itest`/`[t]sc`），附时间戳、逐命令退出码与原始零输出；node 检出仅常驻服务（ChatGPT 桌面/VSCode/代理）非编译进程。串行：后端 16:29:39—16:30:36 → 前端 16:30:53—16:31:56，2G 上限（MAVEN_OPTS / NODE_OPTIONS）。
- **标准15 阶段三实际同步**：功能清单（M07-F02-04 行描述拟晋级）、requirement-pool（P7 拟核销）、knowledge/current-status、功能追踪（本文件）、known-issues（无新增 I）、session-handoff、memory（state/features/handoff）与 product 当前入口全部实际落盘；执行层不写 COMPLETED、不移动方向、不代写规划 PASSED。

## D178 补证结论（2026-08-22，执行补充提示2 G11/G14/G15）
- G11（标准11 既有运行日志入口闭环）：ExecutionList 并行 `pageGraphExecutionsWithVersion + pageDebugSessions` 合并两域（`MergedRow {_debug}`，createTime 倒序），来源列 `调试/执行` 标识，`handleViewDetail` 按 `_debug` 分流 `/agent/debug/:id` vs `/agent/executions/detail/:id`；调试终态可从既有入口识别并查看，普通执行不受影响；调试域失败降级为仅执行列表。真实 router/API/DOM 行为，`DebugExecutionLogClosure.spec.ts` 4/4。
- G14（标准14 唯一计数与互斥）：当时报 Surefire XML 827 / 前端 86f/850t；互斥以注释摘要呈现、ServiceTest 基线错误（10 净增 5）→ D179 驳回要求真实基线重建与完整工具族实际命令。
- G15：当时仅"拟同步"，未落盘 → D179 驳回要求实际落盘。

## 核心产物（实现，D175—D177 锁定）
- 后端（sw-basic-agent）：`AgentGraphDebugController`（调试会话 CRUD/断点/步进/终止端点）、`AgentGraphDebugService(Impl)`（会话/断点/步进生命周期 + 权限）、`AgentGraphDebugEngine`（图单步解释器，state_json 冻结规则 graphKey null 跳过检查）、`AgentGraphDebugSession/Node/Entity + Mapper`、DTO 等；Flyway V36（调试会话表，H2/PG 双方言）。
- 前端（Smart-WorkFlow-Web）：DebugSessionView.vue（调试会话详情/控制）、ExecutionList 合并入口（调试/执行来源标识+分流路由+降级）、ConversationList/Detail 等。
- 测试：后端 4 个新 Debug 测试类（Security 28 / Behavior 15 / Engine 13 / Service 15）+ Flyway H2/PG V36 全链（36 条）；前端 agent-debug-refresh 1 + DebugExecutionLogClosure 4 等。

## 当前基线（G14 补证后，拟待规划复验确认）
- 后端 **827/0/0/0（surefire XML 119 叶文件；sw-basic-agent 338 = 267 + 71）**
- 前端 **86 spec files / 850 tests / 0 failures** 四门全绿（typecheck/lint 0 errors/vitest/build）
- Flyway **V36** 双方言 36 条全链（H2 13 / PG 10 用例，36 条 validate）

## 清单/池状态（终态，待规划层最终复验与归档）
- 功能清单 M07-F02-04：**`✅` 已升级（标准1 锁定）**；终态统计 **✅26/🟦24/⬜40**（共 90 行，标准1/3 锁定）
- requirement-pool P7：**正式核销（标准2 锁定）**（D180 规划层最终验收 15/15 PASSED）
- 已完成功能数：**30**（第30个，D180 15/15 PASSED + 终态同步完成）
- 正式基线：**后端 827/0/0/0（agent 338）、前端 86f/850t、Flyway V36 36 条**（标准3 锁定；755/267、82f/815t、V35 为 D170 历史基线）

## 审查链
- `product/agent-graph-step-debugging/receipts/planning-review-d176.md`（初审）
- `planning-rereview-d177.md` / `planning-execution-prompt-agent-graph-step-debugging-1.md`
- `planning-rereview-d178.md` / `planning-execution-prompt-agent-graph-step-debugging-2.md`
- `planning-rereview-d179.md` / `planning-execution-prompt-agent-graph-step-debugging-3.md`（当前：只处理标准14/15）
- 回执：`completion-supplement-d178.md`、`test-receipt-supplement-d178.md`、`stage-3-sync-receipt-d178.md`（拟）、D179 补充回执（G14/G15）
