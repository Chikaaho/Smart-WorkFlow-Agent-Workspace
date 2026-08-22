# P7/M07-F02-04 图单步调试闭环 — 补充完成回执（D178 剩余 G11/G14，待 G15 后复验）

> 方向：`product/agent-graph-step-debugging/ready/direction-agent-graph-step-debugging.md`（D175）  
> 审查对照：`planning-rereview-d177.md` → `planning-rereview-d178.md`（锁定 1,2,3,4,5,6,7,8,9,10,12,13 PASSED，本轮仅 G11/G14/G15）  
> 执行补充提示：`planning-execution-prompt-agent-graph-step-debugging-2.md` G11/G14/G15  
> 状态：自验通过 · 待规划验收（未写 COMPLETED、未核销 P7、M07-F02-04 保持 🟦）  
> 时间：2026-08-22 15:00Z（本轮后端 14:54—15:46 → 前端 15:47—15:48 串行，见测试回执 §2）

---

## 1. 剩余缺口核销（仅 G11/G14，G15 单独）

### G11 — 标准11：既有运行日志入口闭环

- **输入**：既有入口 `ExecutionList`（`GET /agent/graph-executions` 执行域）已加载执行记录 `SUCCESS 101`；调试域 `pageDebugSessions` 返回 `PAUSED 201 / COMPLETED 202`。
- **动作（前端）**：`ExecutionList.loadList()` 并行 `Promise.allSettled([pageGraphExecutionsWithVersion, pageDebugSessions])` 合并两域为同一表格（`MergedRow {_debug}`，按 `createTime` 倒序），来源列渲染 `调试/执行` 标识（`el-tag type=info` vs `small`），`handleViewDetail` 依据 `_debug` 分流：`_debug→/agent/debug/:id` / `else→/agent/executions/detail/:id`。
- **实际输出（DOM/路由/API）**：`ExecutionList` 挂载后 `pageGraphExecutionsWithVersion 1次 + pageDebugSessions 1次`，`vm.list=2 vm.total=2`含 `debugRow.id=201 status=PAUSED` 与 `execRow.id=101 status=SUCCESS`，`wrapper.html` 含 `调试` 与 `执行`；点击 `debugRow` → `router.currentRoute=/agent/debug/201 name=agent-debug-session`；点击 `execRow` → `/agent/executions/detail/101 name=agent-execution-detail`。普通详情 `getExecutionDetail(101)` 不含 `单步/仅 PAUSED` 调试控制，调试详情 `getDebugSession(202)` 含 `已完成` 且三按钮禁用 `仅 PAUSED 状态可操作`。调试域失败时降级为仅执行列表 `list=1 id=101 _debug=false total=1`（不阻断运行日志）。
- **对照**：调试终态可从既有运行日志生产入口识别（`调试` 标识）并查看（路由至 `agent/debug/:sessionId` 终态详情），普通执行仍进普通详情且不可继续调试 → **PASSED**
- **测试**：`DebugExecutionLogClosure.spec.ts` G11-02/G11-02b/G11-03 4/4

### G14 — 标准14：唯一计数与完整互斥证据（见测试回执 §2/§5）

- **后端唯一正式计数**：`find . -name TEST-*.xml -path */surefire-reports/* | xargs grep tests= | awk` → **Surefire XML 827**（去重后 leaf 107 zero 12，failure 0 error 0）；控制台 `1654` 为含 JUnit 嵌套 inner-class wrapper（`$InnerTests 0 + InnerTests 3`）的二次计数，已在测试回执说明。
- **等式**：D175 基线 `755` + 本功能净新增 `72` = 终值 `827`。本功能各测试类现状/基线/净增明细见测试回执 §3.1 表，合计 `28+15+13+13+10 =79` 中含 `7` 个 `execution` 回归旧例非新增，净增 `72` 与差值一致；口径 `42/55/79` 已统一为“现状 827 / 净增 72”，全文废弃旧口径。
- **前端四门（同轮 2G 串行，精确时间）**：见测试回执 §2 — `typecheck 15:47前后 exit:0 / lint 0 errors 75 warnings / test 86 files 850 tests / build 1.18s`，后端 `compile 14:54:09—12 exit:0 / test 14:54:19—15:46 exit:0`，互斥 `pgrep -f "[m]vn" exit:1 / "[p]npm run" exit:1 / "[v]itest|[v]ite|[t]sc" exit:1` 原始零输出见 §5。
- **判定**：计数可复算，互斥工具族原始零输出齐全 → **PASSED**

---

## 2. 关键产物（本补丁）

- `ExecutionList.vue`：合并 `pageDebugSessions` 入既有列表（来源列、合并排序、穿透路由、降级）
- `DebugExecutionLogClosure.spec.ts`：新增 G11 合并入口 4 用例（真实路由并行拉取/标识/分流/可识别查看）
- `ExecutionList.spec.ts`：兼容新增 `pageDebugSessions` 空 mock

## 3. 与方向偏差

零偏差（既有入口穿透为方向既定闭环的实现，未改范围）

## 4. 风险

调试与执行共表时 `total = execTotal + debugTotal`（分页由两域各自处理，当前同页同 `pageNum/size`）
