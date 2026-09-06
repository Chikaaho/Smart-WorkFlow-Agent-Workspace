# P4 三缺口修复回执 08（对应提示07）

日期：2026-09-06；角色：执行；等级：XL（承接 P4 既有等级）；功能状态：VERIFYING（自验完成，待 Planner 独立复验）。
承接：`planning-execution-prompt-p4-07.md`（唯一当前入口）+ `planning-review-p4-07.md`。证据根：`evidence/last-three-gaps/`（每 ID 一索引 G3b-A5 / G4b-B4 / G5a-B1 + 清单 `COLLECTION-MANIFEST-last-three-gaps.json`，30 条：26 份逐字节副本双哈希回读一致、4 份工具派生明确标注；清单不含自身）。

## 0. 本轮改动文件（仅授权内直接相关）

| 文件 | 改动 | 动因 |
|---|---|---|
| `queue/PersistentBpmCommandQueue.java` | `failAndScheduleRetry` 两个最终 UPDATE（终态失败/PENDING 重试）追加 `claim_token` 条件；读取抽为受保护 `readCommandForFailure`（行为不变） | G4b B4 |
| `service/CommandSyncWaiter.java` | 新增 `waitSyncResult`：同一预算内等父命令终态后继续等 `FLOW_START:{recordId}` 子命令终态；仅实际启动完成返回 COMPLETED，失败 FAILED，预算到期 TIMEOUT（受理态） | G5a B1 |
| `controller/BpmDraftController.java` | P0 提交改用 `waitSyncResult`（`BpmCommandController` 单命令 P0 审批维持 `waitTerminal`，无需改） | G5a B1 |
| `engine/facade/BpmTaskFacadeImpl.java` | `queryProcessedPage` 次排序键 `orderByTaskId().desc()` | G3b A5 |
| `service/impl/ApprovalActionServiceImpl.java` | `pageByActor` 次排序键 `orderByDesc(taskId)` | G3b A5 |
| `controller/BpmMyProcessedController.java` | 默认合并排序 `handleTime` + `thenComparing(taskId)` | G3b A5 |
| 测试：`CommandOverlapRealEngineTest`（+断言4）、`MyProcessedRealSourceTest`（+同时间跨页用例）、`G5aSyncWaiterChainTest`（新增）、`OverlapH2TestConfig`（窗口注入子类）、`BpmDraftControllerTest`（stub 适配） | 直接相关测试 | 三项 |

已锁范围（L23—L28：真实历史过滤/原三并发场景/租户隔离/归集/门禁/无动作节点）零改动、未重做。

## 1. 提交表（提示07 §4 契约，仅三行）

| ID | 改动与原始附件 | 正向结果 | 反向结果 | 同对象/最终快照 | 是否仍有动作 |
|---|---|---|---|---|---|
| G5a B1 | 改动：`CommandSyncWaiter.waitSyncResult` + `BpmDraftController` P0 入口（src/ 副本哈希回读一致）。原件：phase1/phase2 服务器抽取片段（行号=原件行号）、g5a-normal.out、g5a-timeout.out、G5aSyncWaiterChainTest 报告 | 正常完成（默认预算，真实 REST，jar a8735159…）：父完成 .367 → 子实际启动 .478→**.612 完成** → POST 响应 .644 才返回 COMPLETED（客户端实测 342ms；修复前 145ms 返回时子命令尚未执行）——返回时实际启动结果已可读，实例 RUNNING 发起人本人 | 子失败/延迟不返回业务发起成功：受控超时（预算 250ms）子启动中（.174 < .289 < .368）返回 **ACCEPTED 受理态**+原 commandId，事后同一标识回查父 COMPLETED/实例可查；重复提交 duplicated=true 同一 commandId、实例计数仍=1（同意图不新建第二流程）；子启动失败经真实消费前安全拒绝路径断言 FAILED（G5aSyncWaiterChainTest，Tests run 3 全过）；父失败不新建 FLOW_START 受理 | 同一 P0 请求/父子命令 2096628692074139649→2096628692233523202 与 2096629093141864449→2096629093502574593；recordId 288da53a… / 735dd2e4…；不等待人工审批全程（实例 RUNNING 即返回，审批未发生） | 无 |
| G4b B4 | 改动：`failAndScheduleRetry` 两分支 UPDATE 加 `claim_token` 条件 + `readCommandForFailure` 钩子（src/ 副本）。原件：断言4 窗口测试 + surefire 报告本体 | 当前持有者（tokenB）失败写回正常生效（返回 true，PENDING/retry_count=1）；complete/reject 令牌条件为既有实现未动 | 窗口测试（真实 H2+真实持久化队列）：A 代快照读取校验通过 → 回收后 B 重领（tokenB，仍 PROCESSING）→ A 迟到失败写回：重试分支返回 false、行仍 PROCESSING/tokenB、retry_count=0、failure_reason=null；终态失败分支返回 false、未改判 FAILED——两分支最终写入均受当前领取权约束，状态相同不代替领取代次 | 同一命令两代领取者（tokenA/tokenB）同快照内切换 | 无 |
| G3b A5 | 改动：facade 次键 `orderByTaskId().desc()`、`pageByActor` 次键 `taskId`、合并排序 `thenComparing(taskId)`（src/ 副本）。原件：同时间跨页测试 + surefire 报告本体 | 真实引擎历史两条 `END_TIME_` 归一同值后 pageSize=1 强制跨页：集合恰两条、total=2 精确、页序=唯一 taskId 次键 desc、两轮读取顺序逐一相同；真实 ACTION 记录 `create_time`（=handleTime）归一同值后默认合并跨页：total 精确=2、不漏不重、同 handleTime 按 taskId 全序、顺序稳定 | 翻页集合不漏不重且不靠截断：同时间归一后旧行为（次键缺失）在本次开发过程中实际复现为同页重复/漂移，修复后跨页确定（同时间测试对象为真实数据源内归一，非 mock、非先删再查） | 同一隔离库、u3（兼容来源）/u4（默认合并）同一批对象逐页核对 | 无 |

## 2. 受影响回归（工程宪法 XL 完整校验门）

- `MAVEN_OPTS=-Xmx2g mvn -q compile` 通过 → `mvn test` 全量 **MVN_EXIT=0**（原始日志 `p4-full-test-run6.log`）；工具逐报告扫描 **174 份报告 / 1126 tests / 0 failures / 0 errors / 0 skipped**（`p4-g3g4g5-surefire-per-report.txt`，逐报告行+哈希可复算）。
- 与上轮 173/1121 差异可解释：+1 报告（新增 G5aSyncWaiterChainTest）、CommandOverlapRealEngineTest 3→4、MyProcessedRealSourceTest 3→4，共 +5 用例=1126。前端零改动，G8b 前端门禁证据不失效。

## 3. 过程披露

- 在线采集分两相位（phase1 默认预算 / phase2 `--sw.bpm.command.p0-wait-timeout-millis=250`），同 jar（sha256=a8735159…，PKG_EXIT=0，实体在工程 target/ 未入库）；起止时点原件与 `all-stopped.at`（两进程均已停止，无运行残留）在案。
- 夹具过程问题（非产品缺陷，已修正脚本重跑）：发布接口 TEXTAREA 不在 FieldType 枚举（改 TEXT）；新建用户 status 语义 0=启用（首轮误设 1 导致 debug 身份回查 USER_NOT_FOUND_OR_INACTIVE，拒绝行为本身正确）；`PUT /system/user` 全量更新会清空 roleIds（补 roleIds 重提）。夹具脚本修复版原件在案，表单/流程发布最终 code=0。
- 命令查询限发起人：admin 回查子命令 403（安全行为，未绕过），子命令状态以服务器原始日志行为原件。
- 开发中发现并修正测试自身缺陷：Flowable 该版本 `orderByHistoricActivityInstanceId` 被静默忽略（历史表无对应列），已改用映射唯一 ID_ 列的 `orderByTaskId`；ACT_ 表在引擎独立内存库（非业务 H2），时间归一经引擎自身数据源执行。
- 归集过程两次相对路径落点错误（stray 目录），均已合并/重拷至正确路径并以清单哈希回读校验，无证据缺失。
- 未 Git 提交推送、未触生产/真设备/认证存储；未改历史证据/审查。

## 4. 自验结论

提示07 三行正反断言均有真实原始输出/实现最终副本支撑，聚焦测试与全量门禁通过，三项登记关闭。保持 VERIFYING，待 Planner 独立复验；不自行 PASSED/COMPLETED、不核销 P4、不晋级正式基线。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p4-oa-personal-center-dual-dispatch/receipts/completion-p4-supplement-08.md","evidence":["product/p4-oa-personal-center-dual-dispatch/receipts/evidence/last-three-gaps/G5a-B1-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/last-three-gaps/G4b-B4-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/last-three-gaps/G3b-A5-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/last-three-gaps/COLLECTION-MANIFEST-last-three-gaps.json","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/last-three-gaps/p4-g3g4g5-surefire-per-report.txt"],"feature_status":"VERIFYING","work_items":[{"id":"G5a-B1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"待Planner复验同步发起时点链"},{"id":"G4b-B4","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"待Planner复验窗口测试"},{"id":"G3b-A5","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"待Planner复验同时间跨页"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待Planner按提示07三行逐项复验","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p4-supplement-08:last-three-gaps-manifest-30-0mismatch:g5a-child-finish-612-before-response-644:timeout-accepted-recall:g4b-window-token-guard:g3b-sametime-taskid-order:backend-174r-1126-0-0-0","progress_basis":{"files_changed":["PersistentBpmCommandQueue（两分支claim_token+读取钩子）","CommandSyncWaiter（waitSyncResult等待链）","BpmDraftController（P0入口）","BpmTaskFacadeImpl/ApprovalActionServiceImpl/BpmMyProcessedController（唯一次键）","测试：断言4/同时间跨页/G5aSyncWaiterChain新增+OverlapH2TestConfig/BpmDraftControllerTest适配"],"tool_actions":["真实REST在线采集两相位（默认预算/受控250ms）","真实H2+持久化队列窗口测试","真实引擎历史与ACTION同时间归一跨页测试","mvn -q compile→mvn test 全量（MVN_EXIT=0）","python逐报告计数工具（174/1126/0/0/0）"],"new_evidence":["last-three-gaps 三索引+30条清单（哈希回读一致）","g5a-phase1/2-server-extract.log（行号=原件）","g5a-normal.out/g5a-timeout.out","四份surefire报告本体"],"closed_work_items":["G5a-B1","G4b-B4","G3b-A5"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven","outcome":"SUCCEEDED","detail":"compile通过；mvn test全量MVN_EXIT=0：174报告/1126/0/0/0（=1121+新增5用例，173+1报告，可解释）；package PKG_EXIT=0 jar sha256=a8735159…"},{"tool":"http-api","outcome":"SUCCEEDED","detail":"phase1正常场景：POST响应.644晚于子启动完成.612返回COMPLETED；phase2受控250ms：子启动中.289返回ACCEPTED+原标识，回查父COMPLETED、实例1、重复提交duplicated=true不新建流程"},{"tool":"shell-integration-test","outcome":"SUCCEEDED","detail":"G4b断言4窗口：A代快照读通过后写回前交接，迟到失败两分支均false且不改写B状态/计数/原因；当前持有者写回正常；G5a等待链三分支；G3b同时间跨页确定序"},{"tool":"filesystem","outcome":"SUCCEEDED","detail":"last-three-gaps 30条清单：26份副本双哈希回读一致、4份派生标注、不含自身；两进程停止时点在案；两次路径落点错误已纠正并回读校验"}],"browser_status":"OPERABLE"}
