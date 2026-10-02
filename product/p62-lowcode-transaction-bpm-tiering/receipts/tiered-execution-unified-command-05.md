# 分级执行与统一命令：补证回执 05（三级提示03 剩余5项逐项交付）

2026-10-02；Executor。依据 `planning-review-tiered-execution-unified-command-04.md`（G1a/G1b/G3a/G6b 新增通过、G2a/G4a/G5a 锁定）与唯一执行入口 `planning-execution-prompt-tiered-execution-unified-command-03.md`（5 项剩余账本）逐项交付。新证据独立 runId 段 `p62exec03r05`（证据根 `evidence/tiered-execution-03/p62exec03r05/`；上轮 r04 证据与失败样本原样保留未动）。阶段保持 VERIFYING，待 Planner 复核。

## 提交身份

- Server：`7ba52ee118875355313b15b20bba0a177e3eec38`（develop，已推送；本轮批次 28d57b9→`b6e9a45`（G3b 生产修复+跨通道证据）→`369601a`（G2b/G6a 补证资产）→`7ba52ee`（功能清单同步）；远端读回 `g7a/remote-readback-server-postpush.txt`）
- Web：`c75f77ebe81a3a409bafdd503e9d75c9319a0af1`（develop，本轮无 Web 改动；远端读回 `g7a/remote-readback-web.txt`）
- Workspace：`9e9567f18f97fcc66a68daef2805a181bc8fb5d8`（develop-sw，已推送；远端读回 `g7a/remote-readback-workspace-postpush.txt`；含规划文件、本回执与证据）

## 5 项逐项交付

### G2b——真实 OA 业务代表读（同压力窗口并行）：交付

- 口径：64 并发（两租户各 32）、两租户各 10,000 对象、每租户 50% 共享热点、正式 300s 窗口；窗口内并行发起**真实 OA 业务读** `GET /api/workflow/tasks/todo`（每租户 1 条真实待办业务对象：APPROVAL 节点实例 approve 至测量用户）。
- 期望正向断言成立：两租户 OA 业务读 `non200=0 errors=0 nonZeroBizCode=0`，`todoTotalMin=todoTotalMax=1`（每请求实际读到 1 条真实待办；首响应原文落盘含 taskId/processInstanceId/formKey/businessKey/theme）。
- 反向情况排除：`/api/auth/menus` 仅作权限菜单并行读数保留，不再作为 OA 业务读的替代证据；OA 业务读等待画像由同窗口逐请求耗时给出（无 0 请求、无窗口外样本——首请求 12:31:29.632、末请求 12:36:59.754 覆盖负载正式段 12:31:59.428—12:36:59.408 全程）。
- 压力主体（锁定复用同规格）：formalSamples=63,984；legal=39,335 / rejected=24,649（38.52%，热点余额耗尽后的合法拒绝）；timeout=0 error=0；p50=287.6ms/p95=537.6ms/p99=696.3ms/max=1011.6ms；分布 tenant0 50.40%/tenant100 49.85%，每租户 hotspotSharedWorkers=32、uniqueTargets≈8,000（`g2b/stress-boundary-report.txt`）。
- OA 业务读等待画像：tenant0 1,272 请求（p50=212.7ms/p95=326.5ms/p99=559.0ms/max=731.2ms）、tenant100 1,273 请求（p50=212.3/p95=332.4/p99=552.3/max=678.1ms）；逐请求原始 CSV 与业务对象 JSON 见 `g2b/oa-business-todo-requests-t0.csv`/`-t100.csv`、`oa-business-todo-response-t0.json`/`-t100.json`、汇总 `g2b/oa-business-summary.txt`。
- 失败轮保留（不可覆盖）：`g2b-failed-round1-total-string-parse/`（压力与并行读均实际运行完成，采集器只解析裸数值、未覆盖 R 契约字符串渲染的 `"total":"1"`，`todoTotal=-1` 属采集缺陷；同轮请求数/状态仍真实，说明见该目录 README.txt）。
- 局限：OA 业务读的等待/拒绝为**观测画像**，不设生产阈值（沿用复核04 口径）；`todoTotal` 为 1 的固定对象，不构造多待办分布。

### G3b——跨同步/异步入口统一幂等身份：交付（含生产修复）

- 缺口根因（如实）：同步 HTTP 入口不携带受理命令标识（`commandId=null`），旧实现仅以 `command_id` 相等判定重放——跨入口同操作在"同步先行"时被放大为「节点已被处理」失败（旧轮 `retryCount=4` 命令终态 FAILED 已实际复现）。
- 修复（生产）：`TaskActionService.execute` 任务已消失且动作记录为同一 (任务, 操作人, 动作) 时按自身已提交结果恢复（返回成功）；`TaskActionCommandHandler` 运行期任务不存在且既有记录同身份时直接以 `RECOVERED` + 原 `actionRecordId` 回写命令结果，不进入执行核心；不同身份（他人/异动作/异命令）保持确定性冲突（Server `b6e9a45`）。
- 双向真实验证（真实 PG + 真实 HTTP，runId `p62exec03r05-13t20`；`g3b/cross-channel-raw.txt`、`g3b/cross-channel-async-first.json`、`g3b/cross-channel-sync-first.json`）：
  - 异步先行→同步跟进：命令 `COMPLETED/DONE`（createTime 13:01:35.787→finishedAt 13:01:35.983，retryCount=0），同步入口 `httpStatus=200 code=0`；动作台账 0→1、通知 1→1、命令台账 0→1（同身份重放不新增受理行）。
  - 同步先行→异步跟进：同步入口 `200/code=0`，提交后运行期任务行=[] 且历史行 end_time 已写（同操作不会再执行）；异步命令 `COMPLETED`，结果 `{"status":"RECOVERED","actionRecordId":2105885889721589762}`;动作台账 0→1、通知 1→1、命令台账 0→1。
  - 两方向均**:另一入口取得原结果/明确同操作去重**，实际效果不增加（动作恰一条、通知不增）。
- 回归：process 模块 95/0/0/0（含 CommandLeaseHandover/Tiered 语义等）；`P62OverlapEffectsPgTest` 3/0/0/0、`CommandOverlapRealEngineTest` 4/0/0/0、`P62FrozenSemanticsPgTest` 3/0/0/0；process 模块全量 242/0/0/0。
- 局限：同身份判定以 (任务, 操作人, 动作) 为幂等身份；不同操作人对同一任务的重放仍按既有越权/冲突语义拒绝（与方向 U02 合同一致，未放宽越权边界）。

### G6a——定义→版本→绑定→业务记录→实例→运行节点→动作调用→实际库存（只读原始链）：交付

- 缺口口径：复核04 指出 raw-chain.txt 的 DB/调用结果仍为整理语句、GET 截取含省略号，缺发布版本→绑定→业务 record→instance→node/action→实际库存的原始回读。
- 原对象登记：上轮 G6a 定义 `2105507486266904578` 所在运行环境（EmbeddedPostgres + 18080 验收应用）随上轮进程结束销毁，旧库不可再读（`g6a/def-chain-readonly.txt` 首部登记）；本轮不重拍 UI、不重做发布，按等价对象形状重建**最小替代链**并逐环输出实际只读 SQL 原始行。
- 实际链（`g6a/def-chain-readonly.txt`，逐段含 `SQL>`/`PARAMS>`/`ROWS>`/`ROW` 原始行）：
  - 发布版本：`sw_bpm_process_def` id=2105884906245402626 / process_key=bpm_dd89305990e84272 / **def_version=2 / published_version=2** / status=PUBLISHED（v1→v2 双发布事实）。
  - 版本冻结与绑定：`sw_bpm_form_binding` 有效绑定行 active=true；`sw_form_txn_action` action_key=chain_reserve/RESERVE/PUBLISHED/**current_version=2**；`sw_form_txn_action_version` 版本快照 **v1、v2 两行**（发布冻结版本可辨）。
  - 业务记录：`sw_form_ttcimzo156` id=ca355421-e268-4ee1-92d1-30739706a17a / material=CHAIN-R05-EXEC / qty_available=10.0 / **qty_reserved=2.0** / version=1。
  - 实例与运行节点：`sw_bpm_instance` process_instance_id=cceb2f0c-be1d-11f1-ad13-d22d583c6bf6 / business_key=同记录 id / status=RUNNING（导出时点）；`ACT_HI_ACTINST` 全节点行（start→e1→**act-node-1（serviceTask「库存预占」，START 12:57:42.725 / END 12:57:42.799）**→e2→end，各带 START/END_TIME）。
  - 动作调用与库存效果：`sw_form_txn_invocation` id=304f6c1c-28cd-4889-9e47-89e4c3933708 / action_version=**2** / invocation_key=**NODE:cceb2f0c-be1d-11f1-ad13-d22d583c6bf6:act-node-1** / biz_record_id=同记录 id / status=SUCCEEDED / result_json `{"quantity":2,"balanceAfter":10.0,"reservationId":"d2fe7915…","reservedAfter":2.0}`；`sw_form_txn_reservation` quantity=**2.0**/ACTIVE；`sw_form_txn_ledger` entry_type=RESERVE/quantity=2.0/reserved_after=2.0。
- 反向排除：以上各环均为同一 tenant/formKey/actionId/recordId 的实际行，未改图配置或库存来补链（无 API/SQL 替填，只有 SELECT 导出）。
- 局限：替代链为等价形状重建（非原 UUID 对象）；节点数量=2 语义只证明"发布版本→调用版本→库存数量"的绑定，不替代原对象的 UI 操作时点。

### G7a——当前 Server/Web/Workspace 精确 HEAD、远端读回与生产改动→验证覆盖：交付

- 身份：Server develop HEAD `7ba52ee118875355313b15b20bba0a177e3eec38`（批次前 `28d57b9a7ccb664960015d5a446f4c498bf29ca9`）、Web develop HEAD `c75f77ebe81a3a409bafdd503e9d75c9319a0af1`、Workspace develop-sw HEAD `be315fff450f2f112e4278e82d19308a9c4cb048`+本轮批次；三仓远端读回逐 SHA 一致、0/0 ahead/behind（`g7a/remote-readback-*.txt`）。
- 历史附件错位澄清：复核04 所指附件 4531cb9/8f5d470 是采集时点工作树，不是最终身份；本轮以最终 HEAD 重读，Server 全部关键提交 SHA 在本地仓库存在且 `origin/develop` 同 SHA。
- 生产改动→验证覆盖（`g7a/repo-identity-and-coverage.md`）：8f5d470 的 `ProcessStartService` target 透传由 G1a/G1b/真实 HTTP 已覆盖；本轮新增 `TaskActionService`/`TaskActionCommandHandler`（b6e9a45）由 G3b 双向真实证据 + 4 组既有回归覆盖；其余 f6547b8/9c7460c/1eb2510/28d57b9 全为测试文件（`--stat` 可核）。
- 未提交项如实登记：Server 功能清单为规划文本同步（本轮已随批次提交）；Web 工作树干净。

### G7b——全受影响当前入口单值同步与逐字段读回：交付

- 逐文件字段读回见 `g7b/entry-fields-readback.txt`（每项 path/field/value/time）：
  - `knowledge/current-status.md`、`knowledge/session-handoff.md`（阶段 VERIFYING、下一动作=Planner 独立复核回执05）
  - `memory/README.md`、`state.md`、`handoff.md`、`features.md`、`decisions.md`（同一下一动作）
  - `todo/p62-lowcode-transaction-bpm-tiering.md`、`todo/requirement-pool.md`（Owner 当前排期同值）
  - `product/p62-lowcode-transaction-bpm-tiering/ready/direction-p62-tiered-execution-unified-command.md`（当前执行账本=三级提示03已交付、下一动作=复核05）
  - Server `功能清单.md`（当前焦点下一动作=Planner 独立复核回执05）
- 路径与计数更正：证据真实目录/清单数沿用 r04 结论（`evidence/tiered-execution-03/p62exec03r04/`，91/91 哈希匹配、g1b/ 配对目录）；本轮新增证据根 `p62exec03r05/`（清单 30 项、30/30 匹配）。旧"85 哈希"为上一轮数量，当前不作现状。
- 反向检索：`独立复核回执04` 在 knowledge/memory/todo/product 当前入口零命中；无入口继续把旧摘要当现状派旧任务。
- 局限：`memory/` 为最小摘要，字段只覆盖阶段/下一动作；完整值以 `knowledge/current-status.md` 为权威。

## 过程失败轮保留清单（不可覆盖原则）

`g2b-failed-round1-total-string-parse/`（采集器字段解析缺陷，README.txt 说明）、G3b 修复过程轮（旧实现 `retryCount=4` 失败终态在 `/tmp` 构建日志中，已在本回执修复根因段如实记录，未删除历史证据）。r04 及更早的失败轮样本保持未动。

## 证据清单与哈希

- 本轮证据根：`product/p62-lowcode-transaction-bpm-tiering/receipts/evidence/tiered-execution-03/p62exec03r05/`，哈希清单 `evidence-sha256.txt` **32/32 匹配**（`shasum -a 256 -c` 实测）。
- 上轮 r04 证据保持未动（`p62exec03r04/` 91/91 匹配复算通过）；本轮不重跑已锁定项（G1、Web 四门、共享热点压力主体、停用冻结/旧 handler、UI/1280 布局）。

## 逐项自检

- 每包独立：G2b（压力窗口+OA 业务读）、G3b（两入口双向）、G6a（只读链八环）、G7a（三仓身份+覆盖）、G7b（字段读回）各自带原始文件路径与位置。
- 正向断言均实际输出：OA 业务读 todoTotal=1 且有首响应原文；两入口双向均取得原结果/明确去重；只读链含版本、绑定、节点映射、actionId/invocationKey/recordId/qty；三仓远端读回同 SHA；入口字段逐项可读。
- 反向排除：无登录/空权限错误页冒充成功；无不同载荷冒同操作；无改图配置/库存补链；无仅列路径当同步；无旧摘要继续派旧任务。
- 本回执自验通过，待 Planner 独立复核；不进入阶段三，不晋级正式功能数与项目基线（功能 45、清单 46/22/22（90）、ADV64、问题 57 不变）。
