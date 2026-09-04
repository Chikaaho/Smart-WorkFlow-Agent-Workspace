# P58 执行补证回执 07：F1—F3

日期：2026-09-04 ；角色：Executor ；状态：`VERIFYING`

本回执严格接手[规划验收记录 06](/usr/local/projects/Smart-WorkFlow/product/p58-workflow-node-capabilities/receipts/planning-review-p58-workflow-node-capabilities-06.md)与[执行提示 05](/usr/local/projects/Smart-WorkFlow/product/p58-workflow-node-capabilities/receipts/planning-execution-prompt-p58-workflow-node-capabilities-05.md)，只补 F1、F2、F3，不重开已锁定项，不修改历史审查记录和历史附件。

## 交付附件

- [F1 浏览器关联原始附件](attachments/f1-browser-correlation-20260904-07.txt)
- [F2 候选结算运行态原始附件](attachments/f2-runtime-snapshot-20260904-07.txt)
- [F3 原始输出、门禁、清理与工作区清单](attachments/f3-raw-output-manifest-20260904-07.txt)
- [F3 后端全量合并原始终端流](attachments/f3-backend-full-raw-terminal-20260904-10.txt)
- [F3 Flyway 全量合并原始终端流](attachments/f3-flyway-full-raw-terminal-20260904-11.txt)
- [F3 生产构建原始终端流](attachments/f3-production-build-raw-terminal-20260904-12.txt)
- [F3 生产产物扫描原始输出](attachments/f3-production-scan-raw-terminal-20260904-13.txt)
- [F1—F3 非秘密 ID 清单](attachments/ids-f1-f3-20260904-07.env)
- [F1—F3 SHA-256 清单](attachments/checksums-f1-f3-20260904-07.txt)

## F1 浏览器关联

完成了两类真实浏览器证据：

1. 在真实流程定义编辑器中分别保存 `ROLE=p58_f2r_role`、`EXPRESSION=form.ownerId`、`ADAPTER=p58_f2r_adapter`，每次浏览器保存均有对应 `PUT /api/workflow/defs/2095736841726107650/graph` 的 `ACCESS 200`，随后重新打开编辑器读取到相同策略和值，并有 `GET /api/workflow/defs/2095736841726107650` 的 `ACCESS 200`。
2. 在同一真实浏览器会话和同一流程实例中完成表单提交、首审通过、复审退回、退回后再次通过、复审驳回。DOM 依次出现“提交成功，流程已发起”“已退回”“已驳回”；每个动作均有浏览器 requestId、后端 `ACCESS method/path/status/userId`、动作 ID、意见和流程实例 ID。

3. 追加普通候选结算后的真实第二候选浏览器刷新：正式用户 1 在浏览器完成共享候选任务后，切换到独立正式用户 `2095743342486319106`，刷新待办和同一任务详情。两次浏览器 requestId 均与后端 `ACCESS 200` 关联；待办 DOM 为“共 0 条记录/暂无数据”，详情 DOM 为“业务错误(404)”且没有意见框和动作按钮；重放返回 `2305 节点已被处理`。

最终回读为：流程实例 `REJECTED`、`activeNodeIds=[]`、待办 `total=0`。驳回动作 `2095736416016834561` 的意见为“复审浏览器驳回意见 07”，通知类型为 `WF_REJECTED`，通知 ID 为 `2095736416109109250`。

认证边界已在附件中固定：`debugTokenId=test_1` 的正整数后缀解析为正式用户 `userId=1`，日志中的两者一致；没有读取或提交 Cookie、localStorage、sessionStorage、原始 Authorization、密钥或摘要秘密。

## F2 最后修复后的候选结算运行态

在包含最后快照修复的工作区构建上，完成两条真实运行验证：

- 普通候选：一个共享候选任务由操作者结算，观察者待办为空，实例 `APPROVED`，活动节点为空，重放返回 `code=2305`，只产生一个动作；F1 同时补充了该结算后第二候选的真实浏览器待办/详情刷新负断言。
- 会签 ANY：三名参与人生成三个不同 Flowable 子任务和子执行；操作者提前通过后，快照为一条 `HANDLED`、两条 `INVALIDATED`，取消原因完整；三名待办均为空，实例 `APPROVED`，活动节点为空，重放返回 `code=2305`，只产生一个动作。

附件保留了候选/任务/子执行/动作 ID、实际 SQL 及参数、Flowable 行索引、独立意见和所有正负断言。已锁定的 RATIO66 矩阵只作基线引用，未重复验收；当前 ANY 运行直接覆盖本次取消修复的跨子任务路径。

## F3 原始输出与清理

附件固定了后端全量、Flyway、前端全量、生产构建和生产产物扫描的命令、输出及退出码。此前摘要已由同一代码快照的新增原始附件补强：后端全量、Flyway、生产构建和生产产物扫描的完整合并终端流分别保存在新增附件，前端四门逐段输出和 152 份 Surefire 逐报告计数保存在 F3 附件；exec 捕获无法拆分 stdout/stderr，原始附件明确保留为合并流，并仅对非秘密系统临时 socket 路径作规则化脱敏：

- 后端：`1035` tests，`0/0/0` failures/errors/skipped，`152` Surefire reports，exit `0`。
- Flyway：PostgreSQL 17.5 应用 48 migrations 到 v49；H2 到 v49，exit `0`。
- 前端：lint `47` warnings、`0` errors；Vitest `1110` passed、`3` skipped；build 成功，exit `0`。
- 生产构建 exit `0`；生产产物扫描输出 `NO_PRODUCTION_DEBUG_MATCHES`、`P58_PROD_SCAN_RESULT=0`。
- PostgreSQL 清理逐表执行 12 条更新，逐表回读 12 个 `count=0`，`seed=12 cleanup=12 all_checked_counts=0 query_exit=0`。

Flyway-only 清理库不包含 Flowable 运行/历史表，Flowable 运行/历史零残留沿用已锁定的逐表基线并明确写入 F3 附件。临时浏览器配置草稿已由 API `DELETE 200` 清理；普通候选补证的表单按发布态规则返回业务码 `1100` 不允许直接删除，随后停止隔离后端使内存 H2 整体清理。隔离后端和前端停止后，端口 18084、5173 均无监听。

三仓 HEAD、跟踪差异指纹、嵌套仓库未跟踪文件内容 SHA-256、旧 E1/E3 哈希登记失配及新清单边界均写入 F3。历史 06 回执和附件保持原样，不追认旧清单为一致；新清单只覆盖本次新增五份回执/附件/ID 文件，实际 `shasum -c` 全部通过。

## 本轮代码快照

本轮修复的关键代码是 `ConsensusTaskListener` 的 participantId 本地变量优先读取、`ConsensusNodeTranslator` 的原生多实例 assignee 绑定；其余 P58 代码与门禁结果对应同一工作区快照。临时清理测试已删除，不留测试源文件。

## 结论

F1、F2、F3 的执行证据已追加且完成自验，但执行回执不替代 Planner 验收；P58 仍保持 `VERIFYING`，本回合不提交 `PASSED`、不做阶段三终态同步。
