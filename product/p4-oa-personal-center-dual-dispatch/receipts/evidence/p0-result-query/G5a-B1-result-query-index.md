# G5a/B1 索引：超时后凭原标识回查实际业务结果（提示08 唯一剩余原子）

日期：2026-09-07；Executor。依据提示08 §2 / 审查08 §2。已锁范围（L29—L32、正常同步启动、初次超时 ACCEPTED、同意图幂等）沿用不重做。

## 契约核查结论（先核查，未把采集问题误判为产品缺陷）

- 上轮采集 P4 使用的 `POST /workflow/commands/page` 接口不存在（404 → 采集脚本取空列表 → found=false），属采集问题。
- 对外只读结果契约本就存在：`GET /workflow/commands/{commandId}`（`BpmCommandController.status`，仅受理人本人可查）；FLOW_START 子命令的发起人即业务发起人本人（子命令受理在父命令消费线程内以发起人上下文落库），越权边界不变。
- 真实缺口：调用方仅持有父 commandId，父内部 COMPLETED 的 result 只含 recordId，无对外字段呈现本次实际启动的处理中/成功/失败结论。

## 实现修复（仅 P0 查询/结果映射与等待器语义）

- `CommandStatusRespDTO` 增加 `flowStart` 只读关联视图（commandId/status/result/failureReason/createTime/finishedAt）：父命令为 DRAFT_SUBMIT 且 COMPLETED、结果携带 recordId 时，按受理时确定的唯一关联键 `FLOW_START:{recordId}` 解析子命令对外视图。父命令内部状态不改写；纯只读查询；身份仍限受理人。
- `CommandSyncWaiter.waitSyncResult`：缺 recordId 或子命令缺失（无实际启动结论）时不再返回父 COMPLETED 冒充业务成功，改按 TIMEOUT（受理态）返回（src/CommandSyncWaiter.java）。

## 证据一：真实 HTTP（phase3，`--sw.bpm.command.p0-wait-timeout-millis=50`，jar sha256=32ea3394…）

场景链：草稿 2096638747259473922（bizP0=2096638601478049793）→ 父命令 2096638747456606210 → 子命令 2096638747741818881（FLOW_START:e54418d0-…）→ 实例（发起人本人）。

原始输出 `g5a-result-query.out`；服务器时点 `g5a-phase3-server-extract.log`（行号=server-8080.log 原件行号）：

- Q2：POST 响应 50ms 预算到期返回 **ACCEPTED**（ACCESS .825，costMs=118）。
- Q3（GET .846，此时子命令排队未启动 .922 才完成）：HTTP 200，父 `status=COMPLETED`（内部保留）、`result` 含 recordId，**`flowStart.status=PENDING`、result=null** —— 处理中，不显示业务发起成功。
- Q3b/Q4（GET .985 / 48.022，子命令 .922 完成后）：`flowStart.status=COMPLETED`、`result={"status":"STARTED"}` —— 实际启动成功可读。
- Q5：凭 flowStart.commandId 以发起人身份直查子命令 200：COMPLETED/STARTED（关联链可读，无需管理员/后台日志/全局翻页/重复发起）。
- Q6：实例 businessKey=recordId、count=1、RUNNING、发起人本人。

## 证据二：实际控制器+服务+持久队列集成（无 mock，G5aSyncWaiterChainTest 5/0/0/0，报告本体在 surefire/）

`externalResultQuery_resolvesActualFlowStartOutcome`：

1. 子未完成（真实领取后）：父 status=COMPLETED（内部保留），flowStart 呈现处理中（PENDING/PROCESSING），不显示业务成功；
2. 回查只读：查询前后 `sw_bpm_command` 行数不变（不新建受理/实例）；
3. 实际成功：flowStart COMPLETED + result STARTED；
4. 实际失败：子命令经真实 `PersistentBpmCommandQueue.reject` 终态 FAILED → 父 status 仍 COMPLETED 但 flowStart=FAILED 且 failureReason 保留——父成功不掩盖子失败；
5. 身份不放宽：非发起人回查抛 FORBIDDEN（BaseException），发起人可重复查询。

`syncResult_missingChild_doesNotClaimSuccess`：父 COMPLETED 但子命令缺失 → waitSyncResult 返回 TIMEOUT（受理态），缺实际启动结论不宣称业务成功（响应审查08 对 59—78 行分支的核对要求：以语义修复而非仅论证不可达）。

## 受影响门禁

实现变化 → XL 全量门：`mvn -q test` **MVN_EXIT=0**，工具逐报告扫描 **174 报告 / 1128 tests / 0/0/0**（`p4-p0result-per-report.txt`；较 1126 +2 = 本轮新增 2 用例，G5aSyncWaiterChainTest 3→5，报告数不变可解释）。前端零改动，沿用 L27。

## 边界

- 不要求父 command.status 改为子状态、未新增 URL：以已公布的 `GET /workflow/commands/{id}` 契约增加业务结果字段（flowStart）呈现实际启动结论。
- 子失败分支的 HTTP 级在线触发需在受理后制造真实消费失败（如发起人停用时序），本轮以真实持久队列 reject 的控制器集成覆盖；HTTP 级覆盖处理中与成功两态。
- 清理：phase3 服务器进程已停止（`all-stopped.at`，内存库随进程销毁，无运行残留）。
