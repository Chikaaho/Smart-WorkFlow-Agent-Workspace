# P7/M07-F02-04 图单步调试闭环 — 补充完成回执（D179 剩余 G14/G15，执行补充提示3）

> 方向：`product/agent-graph-step-debugging/ready/direction-agent-graph-step-debugging.md`（D175）
> 审查对照：`planning-rereview-d179.md`（标准1—13已锁定PASSED，禁止重验；仅剩余 G14/G15）
> 执行补充提示：`planning-execution-prompt-agent-graph-step-debugging-3.md`
> 状态：自验通过 · 待规划验收（未写 COMPLETED、未核销 P7、M07-F02-04 保持 🟦、方向不移 passed）
> 时间：2026-08-23（本轮门禁 16:29:39—16:31:56Z，详见测试回执 §2）

---

## 1. 剩余缺口核销（仅 G14/G15，标准1—13 未重验）

### G14 — 标准14：唯一计数与完整互斥证据

**缺口事实（D179）**：755 基线错误计入 AgentGraphDebugServiceTest 10 项（净增写 5 而应为 15）；互斥仅注释摘要 + 限定子模式，未给通用完整工具族实际命令与原始零输出。

**补证（逐项对应缺口编号）**：

1. **真实基线重建（755 发生在 D175 前，本功能新建测试类基线全部为 0）**：
   - `git status --short` 未跟踪（`??`）测试文件 = `AgentGraphDebugBehaviorIntegrationTest`、`AgentGraphDebugServiceTest`、`AgentGraphDebugSecurityIntegrationTest`、`AgentGraphDebugEngineTest` —— 4 个类全部为本功能新建，D175 基线 755（D169 快照：`test-receipt-d169.md` §2.2 模块小计）时**不存在**，基线一律 0。
   - `AgentGraphInterpreterTokenTest`、`AgentTokenUsageBehaviorTest` 虽亦未跟踪，但属**前一功能** agent-token-usage-observability（D158—D170），已计入基线 755（Agent 267 逐类表 `test-receipt-d169.md` §2.3 含 36+12+6），**非本功能净增**。
   - 旧口径 `42/55/79`、`ServiceTest 基线10净增5` 全部废弃；当前唯一口径见下。
2. **Surefire XML 逐文件核对（当前 119 叶文件，`find . -name TEST-*.xml -path */surefire-reports/*` 聚合，D179 提示 G14 第 2 条）**：

| 文件（按模块） | 现状 | D175 前存在 | 净增 | 归属 |
|----------------|------|:---:|:---:|------|
| `AgentGraphDebugSecurityIntegrationTest` | 28 | ❌ | 28 | 本功能新增 |
| `AgentGraphDebugBehaviorIntegrationTest` | 15 | ❌ | 15 | 本功能新增 |
| `AgentGraphDebugEngineTest` | 13 | ❌ | 13 | 本功能新增 |
| `AgentGraphDebugServiceTest` | 15 | ❌ | **15** | 本功能新增（原错误记基线10净增5，现基线0净增15） |
| `FlywayFullChainPostgresTest` | 10 | ✅（基线9） | **1** | 本功能增量（V36 全链验证 9→10） |
| `AgentGraphExecutionServiceImplTest` 等已跟踪 agent 类增量（35→45 等） | — | ✅ | 0 | 已在 D169 基线 267 内，非本功能 |
| 其余 113 叶（framework/job/storage/notify/form/system/bpm/bootstrap） | — | ✅ | 0 | 基线内，零变化 |
| **净新增合计** | — | — | **72** | `755 + 72 = 827` ✓ |

   - **净新增 = 71（本功能 4 个新 Debug 测试类）+ 1（FlywayFullChainPostgresTest V36 全链）= 72**；当前唯一总数 **827**（leaf 107 / zero 12，failure 0 error 0 skipped 0）。
   - **勾稽**：`755（D169 基线）+ 72（逐文件净增）= 827（当前 XML 聚合）`，前后一致，无倒推。sw-basic-agent 合计 = 267（基线）+ 71 = **338**（与当前 XML agent 类聚合一致）。
   - 控制台 1654 为含 JUnit `$Nested`/inner 包装的二次计数，仅 XML 叶节点计数为唯一口径（口径与 D178 一致，不改变）。
3. **互斥：完整工具族实际命令 + 时间戳 + 逐命令退出码 + 原始零输出**（G14 第 4 条，非注释摘要）：
   - 每个门禁点（后端前/后、前端前/后）实际执行 `pgrep -f`，字符类规避自匹配，覆盖通用工具族 `mvn`/`java surefire`/`java maven`/`pnpm`/`npm run`/`node`/`vite`/`vitest`/`tsc`；node 附加编译进程精确子族（`node.*vite/vitest/tsc/rollup/esbuild`）。
   - **全部命令原始零输出**（exit:1 = 零进程）——完整命令、时间戳、退出码见测试回执 §2（本次实际粘贴，非摘要）。
   - 唯一命中：`pgrep -f "[n]ode"` 检出 7 个常驻服务（ChatGPT 桌面 `node_repl`、VSCode `Code Helper`、claude-opencode-proxy `server.js`×2 等，`ps` 验证 etime 9h+），**无任何编译/测试进程**；`node.*vite/vitest/tsc/rollup/esbuild` 子族全部 exit:1。
4. **2G 串行门禁（有效一轮，G14 第 5 条）**：后端 `MAVEN_OPTS="-Xmx2g" mvn compile`（16:29:39—16:29:42 exit:0）+ `mvn test`（16:29:43—16:30:36 BUILD SUCCESS exit:0）→ 前端 `NODE_OPTIONS="--max-old-space-size=2048"` 四门（typecheck 16:30:53 / lint 16:31:02 0 errors / vitest 16:31:15 86f850t / build 16:31:53 ✓ 1.18s），**前后严格串行**，每段前后互斥零快照。计数核对未改代码，XML 为 16:29:40 后全新生成（119 文件聚合 827），可复现聚合成立。
5. **结论**：计数唯一可复算（755+72=827 勾稽），互斥为完整工具族实际命令 + 原始零输出，2G 串行门禁有效 → **G14 闭合**。

### G15 — 标准15：实际阶段三同步

**缺口事实（D179）**：D178 仅"拟同步"，功能清单/knowledge/memory 正式改动未落盘。

**补证（本轮实际落盘，非拟）**——实际变更明细见独立回执 `stage-3-sync-receipt-d179.md` §1/§2；要点：

- **功能清单.md**：M07-F02-04 行描述更新为「运行日志查看 ✅ + 单步调试✅（D175—D179 全链闭环…拟晋级待规划复验确认）」，状态列保持 🟦；终态统计注释补注「不提前升✅」，计数保持 ✅25/🟦25/⬜40。
- **todo/requirement-pool.md**：P7 行更新为「单步调试行为验证全部完成，拟核销待规划复验确认，P7 整体暂不核销」，附基线 827/86f850t/V36。
- **knowledge/current-status.md**：概览（数据库 V1–V36、功能清单、测试基线）、当前进行段（本功能 D179 补证状态）、后续候选第 2 条、测试基线表（§9）全部实际更新。
- **knowledge/features/agent-graph-step-debugging.md**：新建（D178 列为拟变更、实际从未创建，本轮创建）。
- **knowledge/known-issues.md**：I45 汇总条目 + 详情新增 D179 部分关闭注记（M07-F02-04 单步调试子集，拟核销待规划复验）；无新增 I 编号。
- **memory/state.md / features.md / handoff.md**：三件套全部实际更新（当前进行、功能索引行、交接最新状态）。
- **product 当前入口**：receipts 追加本文件 + 测试回执 + 同步回执（不覆盖历史）；方向文档仍在 `ready/`，**未移动**。
- **边界遵守**：执行层不写 COMPLETED、不核销 P7、不晋级 M07-F02-04、不代写规划 PASSED；「拟核销/拟晋级，待规划确认」表述已用于全部文件，规划复验通过前清单统计与正式基线不变。

---

## 2. 与方向偏差

零偏差（G14/G15 均为审查记录列明补证项，未扩大范围、未重验标准1—13）。

## 3. 风险

- 基线 755 为 D169 快照（D170 功能级确认）；若规划层要求以 D170 后代码树重新核算基线，本勾稽基线口径不变（755 为规划已采信基线）。
- 控制台 1654 vs XML 827 双口径并存，唯一计数以 XML 叶节点为准（已全文统一）。
