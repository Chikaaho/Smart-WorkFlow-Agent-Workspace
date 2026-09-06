# G5a/B1 索引：P0 同步发起返回与实际启动的先后关系

日期：2026-09-06；Executor。依据提示07 §2 G5a B1 / 审查07 §2。

## 实现修复

- `CommandSyncWaiter` 新增 `waitSyncResult(parentCommandId)`：同一预算内先等父命令（DRAFT_SUBMIT）终态，再按父结果 recordId 定位 `FLOW_START:{recordId}` 子命令并等其终态；仅实际启动完成才返回 COMPLETED；任一环节失败返回 FAILED；预算到期返回 TIMEOUT（受理态，按原 commandId 可回查）。
- `BpmDraftController` P0 提交改用 `waitSyncResult`；`BpmCommandController` 的 P0 任务审批为单命令语义，维持 `waitTerminal` 不变。
- 内部父命令实现保留（审查07 允许），只改外部同步业务结果语义。

## 正向：正常完成（phase1，默认预算 5000ms，真实 REST）

场景链：草稿 2096628691897978882 → 父命令 2096628692074139649（DRAFT_SUBMIT/P0）→ 子命令 2096628692233523202（FLOW_START/P0, key=FLOW_START:288da53a-7302-433d-a956-3dc6b9f1f8d0）→ 实例（businessKey=recordId，发起人=bizP0 本人）。

服务器原件时点（`g5a-phase1-server-extract.log`，行号=server-8080.log 行号）：

- 450884：13:50 前受理父命令（23:56:48.326）
- 451249：父命令处理完成 .367
- 451460/451650：子命令开始处理 .478 → 处理完成 .612（实际启动完成）
- 451679：POST /submit ACCESS status=200 costMs=331 → 响应返回时点 .644

**响应返回（.644）晚于子命令实际启动完成（.612）**：返回体 status=COMPLETED 时本次启动已完成。客户端实测 342ms（修复前同链路 145ms 即返回、子命令尚未执行）。实例 RUNNING、发起人=bizP0 本人（g5a-normal.out P5）。

## 受控延迟超时（phase2，`--sw.bpm.command.p0-wait-timeout-millis=250`）

场景链：草稿 2096629092625965058 → 父命令 2096629093141864449 → 子命令 2096629093502574593（key=FLOW_START:735dd2e4-…）。

服务器原件时点（`g5a-phase2-server-extract.log`）：父完成 .039 → 子开始处理 .174 → **POST 响应返回 .289（预算到期，status=ACCEPTED 受理态，携带原 commandId）** → 子处理完成 .368。回查（g5a-timeout.out P3/P5）：父 COMPLETED、实例存在 RUNNING 发起人本人。

反向断言：

- 延迟不得返回业务发起成功：子启动未完成时返回 ACCEPTED（受理态）而非 COMPLETED（g5a-timeout.out P2 + 时点 .174 < .289 < .368）。
- 原标识回查最终结果：同一 commandId 回查父 COMPLETED、实例最终可查（P3/P5）。
- 同意图不新建第二流程：重复 P0 提交同一草稿 duplicated=true、同一 commandId（P6）、实例计数仍=1（P7）。
- 子启动失败不返回成功：`G5aSyncWaiterChainTest.syncResult_childFailure_returnsFailed`（真实队列 + 真实消费前安全门禁拒绝路径 `PersistentBpmCommandQueue.reject`）断言 waitSyncResult 返回 FAILED 且命令终态 FAILED/failureReason 保留；父失败同理（`syncResult_parentFailure_returnsFailed`，且不新建 FLOW_START 受理）。原始报告 `surefire/com.sw.ck.bootstrap.p4overlap.G5aSyncWaiterChainTest.txt`（Tests run: 3, Failures: 0, Errors: 0）。

## 边界

- 命令查询限发起人：admin 回查子命令返回 403（安全行为，未绕过）；子命令状态以服务器原始日志行 + 发起人链路回查为原件。
- phase2 表单/流程夹具经修复后脚本重建（formKey/TEXT 字段/status=0），角色-权限 /auth/me 读回含 workflow:p0:dispatch。
