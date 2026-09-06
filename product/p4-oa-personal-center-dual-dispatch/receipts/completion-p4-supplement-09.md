# P4 P0 超时结果回查回执 09（对应提示08）

日期：2026-09-07；角色：执行；等级：XL（承接 P4 既有等级）；功能状态：VERIFYING（自验完成，待 Planner 独立复验）。
承接：`planning-execution-prompt-p4-08.md`（唯一当前入口）+ `planning-review-p4-08.md`。证据根：`evidence/p0-result-query/`（唯一索引 `G5a-B1-result-query-index.md` + 清单 `COLLECTION-MANIFEST-p0-result-query.json`，16 条：12 份逐字节副本双哈希回读一致、4 份工具派生明确标注；清单不含自身）。已核销的 G4b/L29、G3b/L30 与 L31/L32 已锁范围零改动、未重做。

## 缺口 → 原件/位置 → 实际结果 → 边界

**缺口**：超时返回原标识后，缺"调用方经对外契约查到子启动处理中/成功/失败实际结论"的证据；等待器子失败分支未经对外入口；缺 recordId/子命令时返回父成功的分支未核对。

**契约核查（先行，避免误判）**：上轮采集 P4 的 found=false 是采集脚本调用了不存在的 `POST /workflow/commands/page`（404 取空），非产品缺陷。对外只读契约 `GET /workflow/commands/{commandId}` 已存在且限受理人；FLOW_START 子命令受理人即业务发起人本人。真实缺口是父回查响应无实际启动结论字段，调用方仅凭父 commandId 无法区分处理中/成功/失败。

**原件/位置**：`src/CommandStatusRespDTO.java`（flowStart 只读视图）、`src/BpmCommandController.java`（按 `FLOW_START:{recordId}` 关联解析，身份/只读/父状态均不变）、`src/CommandSyncWaiter.java`（缺实际启动结论不再返回父成功，改受理态）、`src/G5aSyncWaiterChainTest.java`；HTTP 原始输出 `g5a-result-query.out`；服务器原始片段 `g5a-phase3-server-extract.log`（行号=原件行号）；集成报告本体 `surefire/`。

**实际结果**：

- HTTP（phase3，预算 50ms，jar sha256=32ea3394…，全部以发起人本人身份）：POST 超时返回 ACCEPTED（.825）；原标识 GET（.846，子命令未启动）父 status=COMPLETED（内部保留）+ **flowStart=PENDING（处理中，不显示业务成功）**；子命令 .922 完成后再查 flowStart=COMPLETED/STARTED（成功）；凭 flowStart.commandId 直查子命令 200；实例 count=1、RUNNING、发起人本人。
- 集成（真实控制器+服务+持久队列，无 mock）：处理中呈现、查询只读（命令行数不变）、成功 STARTED、**失败（真实 reject）→ 父 COMPLETED 不掩盖 flowStart=FAILED+原因**、非发起人 FORBIDDEN；`syncResult_missingChild_doesNotClaimSuccess` 证明缺实际启动结论按受理态返回（响应审查08 对等待器 59—78 行分支的核对要求）。
- 受影响门禁：`mvn test` 全量 **MVN_EXIT=0**，逐报告扫描 **174 报告 / 1128 tests / 0/0/0**（较 1126 +2 新用例，可解释）。前端零改动沿用 L27。

**边界**：

- 未改父 command.status、未新增 URL：在已公布契约上增加业务结果字段（提示08 明确允许）。
- 子失败分支以真实持久队列 reject 的实际控制器集成覆盖（HTTP 级在线触发需受理后制造真实消费失败时序）；HTTP 级覆盖处理中与成功。
- 提交前核对项逐项为是：原标识→实际业务结论可追（Q3→Q5 链）；处理中/失败不显示业务成功（Q3 flowStart=PENDING、集成断言 FAILED 不被掩盖）；查询无新增实例且身份有效（只读断言+FORBIDDEN 断言）；证据与最终快照一致（清单哈希回读 0 不符）；门禁充分（全量 1128/0）；清理属实际环境（phase3 进程停止、内存库随进程销毁，`all-stopped.at`）；授权内剩余动作 0。

## 过程披露

- jar 新指纹 32ea3394…（PKG_EXIT=0），实体保留工程 target/ 未入库；phase3 起止时点原件在案，无运行残留。
- 未 Git 提交推送、未触生产/真设备/认证存储；未改历史证据/审查/已核销分页与队列竞争逻辑。

## 自验结论

提示08 唯一原子 G5a B1 的正反断言有真实 HTTP 与集成双层原件支撑，登记关闭。保持 VERIFYING，待 Planner 独立复验；不自行 PASSED/COMPLETED、不核销 P4、不晋级正式基线。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p4-oa-personal-center-dual-dispatch/receipts/completion-p4-supplement-09.md","evidence":["product/p4-oa-personal-center-dual-dispatch/receipts/evidence/p0-result-query/G5a-B1-result-query-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/p0-result-query/COLLECTION-MANIFEST-p0-result-query.json","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/p0-result-query/g5a-result-query.out","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/p0-result-query/g5a-phase3-server-extract.log","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/p0-result-query/p4-p0result-per-report.txt"],"feature_status":"VERIFYING","work_items":[{"id":"G5a-B1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"待Planner复验超时后实际业务结果回查"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待Planner按提示08唯一原子复验","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p4-supplement-09:p0-result-query-manifest-16-0mismatch:flowstart-pending-846-started-922:waiter-no-success-without-launch-conclusion:backend-174r-1128-0-0-0:jar-32ea3394","progress_basis":{"files_changed":["CommandStatusRespDTO（flowStart只读视图）","BpmCommandController（关联解析）","CommandSyncWaiter（缺启动结论不宣称成功）","G5aSyncWaiterChainTest（对外回查+缺失分支用例）"],"tool_actions":["契约核查（page接口不存在=采集问题）","真实HTTP在线采集（50ms预算，处理中/成功两态+子命令直查+实例）","真实控制器+服务+持久队列集成（三态/只读/身份/失败）","mvn test 全量（MVN_EXIT=0）+逐报告计数（174/1128/0/0/0）"],"new_evidence":["p0-result-query 索引+16条清单（哈希回读一致）","g5a-result-query.out 完整非秘密请求/响应","g5a-phase3-server-extract.log（行号=原件）","三份surefire报告本体"],"closed_work_items":["G5a-B1"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven","outcome":"SUCCEEDED","detail":"mvn test全量MVN_EXIT=0：174报告/1128/0/0/0（=1126+2新增用例可解释）；package PKG_EXIT=0 jar sha256=32ea3394…"},{"tool":"http-api","outcome":"SUCCEEDED","detail":"发起人身份：超时ACCEPTED→原标识GET父COMPLETED+flowStart=PENDING（处理中）→子完成后flowStart=STARTED→凭flowStart.commandId直查子命令200；实例count=1发起人本人"},{"tool":"shell-integration-test","outcome":"SUCCEEDED","detail":"G5aSyncWaiterChainTest 5/0/0/0：处理中不显示成功、查询只读、成功STARTED、失败FAILED+原因不被父COMPLETED掩盖、非发起人FORBIDDEN、子缺失按受理态"},{"tool":"filesystem","outcome":"SUCCEEDED","detail":"16条清单：12份副本双哈希回读一致、4份派生标注、不含自身；phase3进程停止、无运行残留"}],"browser_status":"OPERABLE"}
