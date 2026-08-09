# 探索任务：全仓库真实测试基线复核

**任务目标**：近期独立校验任务（`search_fallback/m07-step2-verification.md`）发现，执行回执声称的"全量 494 测试"在独立复跑后实测本次 surefire 报告只有 291 个（69 个报告类），与回执数字差 203，怀疑回执统计时混入了 `.claude/worktrees/agent-a89847e1fdb50384e/` 下 7 月 22 日陈旧报告（203 个测试）。但 291 这个数字本身是否准确，也存疑——该校验代理的统计方法是"按时间戳筛选当次 target 目录下的报告"，可能因路径遗漏而不完整。本任务要求**重新独立运行 `mvn test`，然后全面、完整地统计全仓库所有模块的 surefire 报告**，给出可信的真实测试总数，并与历史声称的"Step2 前基线 480（=465+15）"以及"465 基线（2026-07-28 确认）"做比对，厘清数字差异的来源。

**需要回答的问题**：

1. **独立重新运行全量 `mvn test`**，等待完成，取得本次运行的退出码和 BUILD 状态。

2. **全面统计本次 surefire 报告**：
   - 在 `Smart-WorkFlow/` 下，找出**所有**模块的 `target/surefire-reports/` 目录（用 `find Smart-WorkFlow/ -path './.claude' -prune -o -name "surefire-reports" -print`，**明确排除 `.claude/` 路径**）
   - 对上述每个 `surefire-reports/` 目录，统计其下 `TEST-*.xml` 报告文件的时间戳——区分本次运行新产生的报告（时间戳在本次 `mvn test` 开始时刻之后）与陈旧报告
   - 给出每个模块（所有模块，不得省略）的测试数：模块路径 + 报告文件数 + 测试数（TESTS 字段汇总）+ 报告时间戳范围
   - 给出全仓库**主树（排除 `.claude/`）当次新鲜报告**的测试总数（TESTS + FAILURES + ERRORS + SKIPPED 各字段）

3. **检查 `.claude/worktrees/` 下是否存在陈旧 surefire 报告**：
   - `find .claude/worktrees/ -name "TEST-*.xml" 2>/dev/null | head -20`（了解范围）
   - 统计 `.claude/worktrees/` 下的陈旧报告总测试数，和主树结果分别列示（**不得合并**）

4. **与历史声称数字比对**：
   - Step1 执行回执（`product/agent-model-orchestration/receipts/step-1-execution.md`）声称：全量 `mvn test` = 480 测试，其中 465 基线 + 15 新增（Step1 的 AgentModelConfigServiceImplTest 11 + AgentModelControllerTest 4）
   - Step2 执行回执（`product/agent-model-orchestration/receipts/step-2-execution.md`）声称：全量 `mvn test` = 494 测试，其中 480 基线 + 14 新增（Step2 新增 4 个测试类合计 14 个用例）
   - 当前复跑结果 = X（本任务实测），与 494 的差值是多少？与 480 的差值是多少？与 465 的差值是多少？
   - Step2 校验代理声称"独立复跑得 291"——本次如得出不同数字，需说明差异原因（可能是该代理搜索路径遗漏导致漏计部分模块）

5. **定位测试数差异来源**：
   - 若当前实测总数与历史声称差距明显（超出 Step1+Step2 新增的 29 个用例范围），列出哪些模块的报告时间戳是陈旧的（非本次运行）、有多少测试数，以及 `.claude/worktrees/` 下是否有同量级的陈旧报告——核实差异是"主树内有陈旧模块报告被计入"还是"`.claude/worktrees/` 陈旧报告被混入统计"还是"部分模块报告被漏计"
   - 若当前实测与 494 相符（在 ±2 以内），也需说明为什么 Step2 校验代理得出 291

**搜索范围**：
- 实际运行 `mvn test`（全量，`Smart-WorkFlow/` 根目录下）
- `find Smart-WorkFlow/ -path 'Smart-WorkFlow/.claude' -prune -o -name "surefire-reports" -type d -print`（全模块 surefire 路径发现，明确排除 `.claude/`）
- 每个发现的 `surefire-reports/` 目录下的 `TEST-*.xml` 文件（读取 `testsuite` 根元素的 `tests`/`failures`/`errors`/`skipped` 属性，或等价的 `grep -h 'tests=' TEST-*.xml` 汇总）
- `find .claude/worktrees/ -name "TEST-*.xml" 2>/dev/null`（了解 worktree 下的陈旧报告情况）
- `product/agent-model-orchestration/receipts/step-1-execution.md`（读取 Step1 声称的基线数字）
- `product/agent-model-orchestration/receipts/step-2-execution.md`（读取 Step2 声称的总数数字）

**禁止范围**：
- 不得修改任何生产代码/测试代码/pom.xml/任何文件
- 不得删除、移动、清理 `.claude/worktrees/` 下的任何文件（仅只读统计）
- 不得合并主树新鲜报告与 `.claude/worktrees/` 陈旧报告——必须分开列示，合并统计是导致历史数字混乱的根因

**预期证据**：
- 完整的逐模块报告统计表（每个模块一行：路径 + 本次新鲜报告数 + 测试数 + 时间戳范围）
- 全仓库主树当次新鲜报告的汇总数字（TESTS / FAILURES / ERRORS / SKIPPED）
- `.claude/worktrees/` 下陈旧报告的测试数（分开列示）
- 与历史声称数字（494 / 480 / 465）的差值分析

**完成标准**：给出全仓库主树（排除 `.claude/`）本次 `mvn test` 产生的真实测试总数，逐模块可追溯，差值来源已定位。

**执行模型**：`deepseek/deepseek-v4-flash`（纯统计+命令执行任务，无语义判断需求，用 flash 即可）

**失败处理**：若某个模块的 surefire 报告不存在或时间戳判断困难，如实说明，不得估算或补填；若 `mvn test` 本身 BUILD FAILURE，如实报告失败原因和失败时的测试计数。

**回执位置**：`search_fallback/m07-baseline-recount.md`
