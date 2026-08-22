# D177 规划层补证复验：agent-graph-step-debugging

> 审查日期：2026-08-22  
> 对照方向：`product/agent-graph-step-debugging/ready/direction-agent-graph-step-debugging.md`  
> 前次审查：`product/agent-graph-step-debugging/receipts/planning-review-d176.md`  
> 审查输入：原地更新后的 `receipts/completion.md`、`receipts/test-receipt.md`  
> 结论：**FAILED（7/15 PASSED；8项未闭合）**

## 1. 总体结论

D176 后的补证已把部分实现声明提升为输入—动作—实际结果级行为证据，标准 **1、3、5、7、9、10、12** 本轮确认 PASSED 并锁定，后续不得重复验证。

标准 **2、4、6、8、11、13、14、15** 仍未闭合：其中标准2、4、6、8为近似证据，标准11暴露实际产品闭环偏差，标准13/14的命令、时间、计数与互斥证据仍自相矛盾，标准15明确待执行。方向继续留在 `ready/`，P7不核销、M07-F02-04保持🟦、功能数保持29，规划基线仍为后端755/Agent267、前端82f/815t、Flyway V35。

同一功能连续第二次复验未通过，依 `roles/planner.md` §7.1 第6条生成执行补充提示：`product/agent-graph-step-debugging/receipts/planning-execution-prompt-agent-graph-step-debugging-1.md`。执行层下一轮仅按该提示与本审查补剩余8项。

## 2. D176 缺口逐项核销

| 标准 | D176缺口 | 本轮证据 | 判定 |
|---|---|---|---|
| 1 | 缺真实Controller/Security请求链 | MockMvc给出manage成功、view-only 403、无token 401、superadmin成功、跨租户404的输入与响应 | **PASSED（锁定）** |
| 2 | 缺同一图会话快照不漂移行为 | 回执“另建新图graphId2模拟新版本（避graphKey冻结）”，未编辑/发布会话所绑定的同一图；不同图天然隔离，不能证明旧会话快照稳定 | **FAILED** |
| 3 | 缺逐步状态/轨迹实际值 | START→END两步给出PAUSED→COMPLETED、trace 0→1→2、seq/branch/变量/next实际值 | **PASSED（锁定）** |
| 4 | 缺各拓扑实际轨迹及与普通执行对照 | 已补CONDITION/LOOP/FORK/JOIN调试轨迹值，但没有对相同图、相同输入的普通执行轨迹做 `branchId + nodeSeq` 行为对照；“同普通执行”仍为声明 | **FAILED** |
| 5 | 缺断点/continue实际状态序列 | LOOP断点设置、命中前暂停、单步、再次命中、取消后完成的状态序列明确 | **PASSED（锁定）** |
| 6 | 缺真实刷新/重新挂载恢复链 | 仅组件单测 `unmount→mock数据变化→mount`；未以真实router直达/刷新挂载目标页面并观察服务端GET、DOM、轨迹/断点/按钮状态 | **FAILED** |
| 7 | 缺并发/重复控制实际结果 | stale version双步200/409、trace保持1、终态后400的服务行为结果明确 | **PASSED（锁定）** |
| 8 | 缺可观察副作用调用次数 | TOOL后stale 409与节点数不变只能证明轨迹未新增；没有工具回调/外部副作用计数器证明实际调用次数始终为1，不能排除“执行了副作用但落库冲突”的窗口 | **FAILED** |
| 9 | 缺五终态、终态拒绝、过期审计行为 | COMPLETED/FAILED/STOPPED/EXPIRED/STEP_LIMIT及终态后拒绝、nodes仍可查均给出实际结果 | **PASSED（锁定）** |
| 10 | 缺安全渲染与降级行为 | 超长、非JSON、HTML注入、URL/存储不泄漏均给出渲染行为断言 | **PASSED（锁定）** |
| 11 | 缺既有运行日志闭环 | 回执明确“调试完成不入 `sw_agent_graph_execution`、debug列表/历史列表分离、调试视图不调用pageGraphExecutions”；这证明双轨隔离，却未证明既有运行日志能识别并进入调试终态，实际未满足方向原文 | **FAILED** |
| 12 | Mock缺逐项与真实API对账 | 本轮真实1—9状态链与8个handler的401/403/404/409/400/EXPIRED逐项对账明确 | **PASSED（锁定）** |
| 13 | PG链明确跳过 | 回执宣称PG 10 passed，但PG段没有实际Maven命令，只列注释；全量Maven在13:41:49结束，却又称PG在13:45:05—13:46:48独立运行且“已在上条全量内”，时间与归属冲突；缺原始命令/退出码/关键输出 | **FAILED** |
| 14 | 缺lint、计数、精确时间、互斥 | lint已补；但测试回执多次引用“互斥快照见§5”，实际§5仅写“失败项：无”，无ps/pgrep命令和零输出。后端755→1652与本轮约55新增无法勾稽，未提供17模块非重复小计或Surefire XML聚合。PG归属也与时间冲突 | **FAILED** |
| 15 | 阶段三未执行 | 两份回执均明确待执行，无同步回执 | **FAILED** |

## 3. 已锁定通过项

以下标准锁定 PASSED，后续补证不得重跑或重写其结论：

- 标准1：真实权限、认证、superadmin、跨租户请求链。
- 标准3：单步严格新增一个轨迹及状态/变量/分支更新。
- 标准5：断点设置/取消与continue命中行为。
- 标准7：重复/并发版本冲突和终态拒绝。
- 标准9：五类终态、终态拒绝、过期轨迹审计。
- 标准10：安全展示、长文本/非JSON降级及泄漏约束。
- 标准12：Mock与真实状态契约对账。

## 4. 剩余缺口

仅剩标准 **2、4、6、8、11、13、14、15**。具体证据要求与禁止事项见同目录执行补充提示；不得以不同图替同图、调试轨迹替普通/调试对照、组件mount替真实路由刷新、节点数替副作用调用次数、双轨分离替运行日志闭环、注释替PG命令输出、声明“空”替互斥零快照。
