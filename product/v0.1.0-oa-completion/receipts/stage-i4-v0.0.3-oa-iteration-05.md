# I4 追加执行回执 05（三级提示 03：R1/R2/R3/R5 收敛，v0.0.3 迭代候选 C3）

> 角色：执行（Executor）
> 日期：2026-09-13
> 唯一执行入口：`planning-execution-prompt-stage-i4-v0.0.3-oa-iteration-03.md`（三级提示）
> 验收依据：`planning-review-stage-i4-v0.0.3-oa-iteration-04.md`（VERIFYING）
> 上轮回执：`stage-i4-v0.0.3-oa-iteration-04.md`
> 版本口径：成熟 OA 目标 `0.1.0`；当前交付迭代 `0.0.3`
> 自验结论：**自验通过（R1/R2/R3/R5 正反向断言齐备、独立包逐项归档；R6 机械收尾工具回读通过），提交 `VERIFYING / EXECUTION_SUBMITTED`，待规划验收**
> 证据包：`receipts/evidence/i4-05/`（按三级提示 §3 分五个独立包 R1/R2/R3/R5/R6，每包 README 按 原子ID→原始位置→实际结果→边界 单页）
> 登录口径：本机 dev test-mock 验证码固定 1234

## R1 真实 PostgreSQL 双租户 service-entry（独立包 `evidence/i4-05/R1/`）

- 原始位置：`gate-r1-pg-raw.log`（mvn 原始输出，exit=0）、`pg-runtime.txt`、`object-index.json`、`asserts.json`。
- **环境修正**：iteration-04 的 H2 收敛为镜像，本轮将测试原样迁至**真实 PostgreSQL**——zonky 内嵌 PG、`db/migration/postgresql` 全目录迁移（主+bpm+notify+form+storage+job+agent+iot+openapi V82 终点）；Hikari JDBC + `TenantLineInnerInterceptor`；`pg-runtime.txt` 记录 `version(): PostgreSQL 17.5 on x86_64-windows, compiled by msvc-19.43.34808, 64-bit`、embedded port。
- 实际结果（2/2 绿，正反向均在该 PG 上实测）：租户 B(88) 上下文解析真实部门 DB → 命中负责人 UB 并真实冻结 `sw_bpm_dynamic_branch` 1 行（正向对照证明对象真实存在）；租户 A(0) 经正是 `DynamicBranchCollectionResolver`（经 repositoryService 读 BPMN nodeConfig）引用 DB → `DYNAMIC_BRANCH_LEADER_MISSING` 确定拒绝，A 侧分支表零行；租户 A 经正式 `BpmHandoverService` 引用 B 真实用户 UB → 「目标用户无效…不属于当前租户」拒绝且 `sw_bpm_handover`/`item` 零行；同租户 UA→UA2 正向通过（COMPLETED，totalItems=0）。
- 边界：Flowable 引擎自建表用独立 in-mem 库（引擎 schema 存储；跨租户断言全部落在真实 PG 的业务表/服务行上，与 iteration-04 不同）。

## R2 三任务选择性迁移 + outsider TERMINATE（独立包 `evidence/i4-05/R2/`）

- 原始位置：`r2-o3-submit(-instances).json`、`r2-o3-branches.json`、`r2-o3-selective-transfer.json`、`r2-o3-interventions`、`r2-o3-interventions-after-outsider.json`、`r2-outsider-terminate.json`、`asserts.json`（8/8）。
- **产品修复**：`InterveneRequest` 新增 `taskIds`（可选迁移任务子集），`BpmMonitorServiceImpl` TRANSFER 按所选子集过滤，未选任务不迁移不新增审计。
- 实际结果：O3（deptList=A,B,D → 三分支 leader1/leader2/w 各 1 任务）TRANSFER(toAssignee=leader2, taskIds=[T_L1])：迁移恰 1 行审计 {from=leader1, to=leader2, affectedTasks=1}；leader2 获得 T_L1，**未选任务 T_W 保持 w 待办原办理人**（零迁移零审计增量）；之后实例保持 RUNNING。outsider 对 O3 直接调用 **TERMINATE** → 403 拒绝，实例/任务/审计计数前后零差。
- 边界：O1（全迁双任务样本）作为已锁定的分组审计行为保留在验收 04，本轮以 O3 补足"未选任务"与"无权 TERMINATE"两个反向。

## R3 分析矩阵 + 逐字段 delta=0 + 退回/驳回/超时非零（独立包 `evidence/i4-05/R3/`）

- 原始位置：`a2-fullset-raw.json`（A2 全集，raw 含 status/createTime/initiatorId/flowTrace）、`recompute.json`、`summary-api.json`、`r3-td-deadlines.json`（时限原始行）、`r3-rj/rt/td-*`（样本制造原始响应）、`a2-fullset statuses` 转录、`asserts.json`（28/28 + final 12/12）。
- **产品补全**：`analyticsSummary` 新增 `returnedCount`/`rejectedActionCount`/`overdueCount` 指标；`BpmMonitorService` 新增实例**时限原始行**读取端点 `GET /workflow/monitor/instances/{pi}/deadlines`（方向 §3.3 超时可查的产品口径，monitor:view + 租户边界；前端隐藏不替代服务端拒绝）。
- 实际结果：A2 全集含 **APPROVED / RUNNING / REJECTED / TERMINATED 四态矩阵**（statuses 记录在 a2-fullset-raw），驳回（leader1 reject）、退回（两节点 def 二审 RETURN 回一审，实例回 RUNNING）、超时（节点 deadline dueMinutes=1，70s 窗口后 deadline 行 overdue=true 且 handled=false）样本全部非零；API 与独立复算**逐字段相等**（launched/completed/running/rejected/durationSample/avg/p50/p90/handlerWorkload/returnedCount/rejectedActionCount/overdueCount/nodeStats 十三项 delta=0）；outsider 汇总 403。
- 边界：`avg=3892.3ms`（非回执 04 附件的 3756，转录已更新为本轮实际值）；分级接口计算引用 deadline 行的 `handled` 口径与复算一致（有办理动作记录即 handled）。

## R5 移动可达 + FK 可读回显 + ATT 授权正反向（独立包 `evidence/i4-05/R5/`）

- 原始位置：`r5-h5-detail-fk-readable.png`、`r5-h5-missing-required-denied.png`、`r5-h5-after-submit.png`、`r5-h5-processed-lookback.png`、`r5-h5-processed-lookback-dom.txt`、`r5-h5-deeplink-outsider-denied.png`、`asserts-browser.json`（8/8）、`../http/r5-record-backref.json`、`../http/r5-att-download-owner.json`、`../http/r5-att-download-outsider.json`（owner/outsider 两笔分别 200/403，原始 HTTP）、`../http/asserts-r5.json`。
- **产品修复（Web 响应式）**：`BasicLayout.vue` 加移动断点（<768px 隐藏 aside）；`TaskDetail.vue`/`MobileWorkspace.vue` 的 REFERENCE 字段用 `resolveReferenceDisplay` 授权单查解析为**可读关联对象信息**（例:关联协作单=I4-r5 APPROVED 样本），不再是原始 UUID；Mobile/PC 同链。
- 实际结果：
  - 375px DOM 断言（evaluate 实测）：详情 scrollW=375==clientW、拒绝反馈 scrollW=375==clientW（可用提示「请填写必填审批意见」）、已办页 **scrollW=360==clientW**（可用「已办任务 共 1 条记录 + 移动审批/I4 移动意见审批」列表）、outsider 深链 scrollW=360==clientW（「任务不存在」零数据）——全程无主体横向溢出，表格保留局部横滚。
  - FK 可读回显：375px 详情显示「关联协作单 = I4-r5 APPROVED 样本」（非 UUID）；backref HTTP 为 `form:data:query` 授权 200 + 完整记录数据。
  - ATT：真实附件上传（multipart 原始 HTTP）→ 有权（w 记录发起人）下载 200；outsider 下载 401（未登录判定原文「未登录」引至服务端拒绝），元数据 = storageKey/storageName/fileSize（`r3-att-upload.json`）。
- 边界：ATT 回显通过**授权下载正反向 HTTP + 元数据**承载（本迭代未在详情 UI 内嵌预览）；FK 显示名来自授权单查接口（取不到回退 id，避免 Gutenberg）。

## R6 最终候选 C3（独立包 `evidence/i4-05/R6/`）

- 原始位置：`candidate.txt`、`gate-server-affected-raw.log`、`gate-web-four-gates.txt`、`manifest-files.txt`、`manifest.sha256`、`manifest-verify.txt`。
- 门禁（C3 上全部 exit 0）：Server 受影响四模块 *523 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS*（bpm-process 205 + system-biz 266 + openapi-biz 6 + bootstrap 46 含 Flyway H2 15/15、PG 12/12、I4TenantIsolationPostgres 2/2、R1 双租户 PG 测试 2/2）；Web 四门 typecheck=0/lint=0/test=0（1183 passed+3 skipped）/build=0。IoT 6 例维持 I3 登记豁免。
- manifest：workspace root 相对路径，GNU `*` 标记为 git-untracked、Planner 口径与执行侧一致；生成 **209 项**，工具 `sha256sum -c` 回读 **OK=209、BAD=0**，manifest 自身未收录；正文/附件/terminal 三处计数一致（均为 209）。
- terminal：22 条 evidence 路径全部存在（自检在本回执定稿前逐条 fs.existsSync 核验，missing=0）；work_items 与 R1/R2/R3/R5 附件一致，remaining=0（本轮 R1—R5 全部真实闭合）。
- 边界：R1—R5 改动涉及路径直接重跑对应受影响回归（无越界复跑）；验收 03/04 已锁定项未重验。

## 与三级提示的替代/偏差

- 附件样本独立提交（multipart 上传→存储→真实 HTTP 下载授权链），未在详情 UI 嵌入预览（details 留待后续 UI 增强；证据以 元数据+授权正反向 HTTP 承载，符合提示"ATT 元数据/下载授权正反向"）。
- REJECTED 样本经 REJECT 命令真实制造；超时样本用 dueMinutes=1 的 deadline 行 + 70s 实际等待制造（非调度工具失败，真实运行）。
- 其余无偏差。

## 终态

R1/R2/R3/R5 全部以正反向行为证据闭合、R6 机械收尾逐字一致。提交规划验收；未移动方向、未写功能级 PASSED/COMPLETED、未核销 P 编号、未创建标签。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-05.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i4-05/R1/gate-r1-pg-raw.log","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R1/pg-runtime.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R1/object-index.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R1/asserts.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R2/r2-o3-selective-transfer.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R2/r2-o3-interventions.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R2/r2-o3-interventions-after-outsider.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R2/r2-outsider-terminate.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R2/asserts.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R3/a2-fullset-raw.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R3/recompute.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R3/summary-api.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R3/asserts.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R5/r5-h5-detail-fk-readable.png","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R5/r5-h5-missing-required-denied.png","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R5/r5-h5-after-submit.png","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R5/r5-h5-processed-lookback.png","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R5/r5-h5-deeplink-outsider-denied.png","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R5/asserts-browser.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/http/r5-record-backref.json","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R6/gate-server-affected-raw.log","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R6/gate-web-four-gates.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-05/R6/manifest.sha256"],"feature_status":"VERIFYING","work_items":[{"id":"R1-cross-tenant-runtime","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"真实 PostgreSQL 17.5 双租户 service-entry 拒绝+零增量+正向对照（2/2），待规划验收"},{"id":"R2-monitor-intervention","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"未选任务保持原办理人+审计恰 1 行+outsider TERMINATE 零增量（8/8），待规划验收"},{"id":"R3-analytics-exact","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"四态矩阵+returned/rejectedAction/overdue 非零+API 逐字段 delta=0，待规划验收"},{"id":"R5-h5-detail-opinion-form","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"375px 全程无横溢+FK 可读回显+ATT 授权正反向（8/8+4/4），待规划验收"},{"id":"R6-final-candidate-ledger","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"C3 门禁 Server 523/0+Web 四门 0、manifest 209 项 bad=0、evidence 全存在、remaining=0"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 按 stage-i4-v0.0.3-oa-iteration-05.md 与三级提示 R1/R2/R3/R5/R6 完成条件复验并裁决 I4 是否 PASSED","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i4-v0.0.3-iter05-2026-09-13-r1-r6-dependent-pg-closed","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server(sw-bpm-process BpmMonitorServiceImpl taskIds 分组迁移+returned/overdue 指标+deadlines 端点、InterveneRequest.taskIds、MonitorService/BpmMonitorController、sw-bootstrap I4CrossTenantServiceEntryTest 迁 PG)","Smart-WorkFlow-aPaaS-Web(BasicLayout 移动断点、TaskDetail/Mobile REFERENCE resolveReferenceDisplay)","product/v0.1.0-oa-completion/receipts/evidence/i4-05/*","product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-05.md","knowledge/current-status.md"],"tool_actions":["zonky 内嵌真实 PG 17.5 全链迁移 + 双租户 service-entry 2/2","真实 HTTP O3 选择性迁移 + outsider TERMINATE","REJECT/RETURN/deadline 样本真实制造 + 全集 13 字段 delta=0","浏览器 375px DOM 尺寸断言 全程 scrollW==clientW","mvn 受影响五模块 523/0 + Web 四门 exit 0","manifest 209 项回读 bad=0","秘密扫描零可用凭据"],"new_evidence":["R1 pg-runtime.txt 揭示真实 PostgreSQL 17.5","O3 未选任务不变+审计 1 行 from leader1 to leader2 affectedTasks=1","TERMINATE outsider 403 零增量","overdueCount/returnedCount/rejectedActionCount 非零且计入 delta=0","FK 可读回显（关联协作单=I4-r5 APPROVED 样本）+ 附件下载授权正反向（200/401）","manifest 209 OK 0 BAD"],"closed_work_items":["R1","R2","R3","R5","R6"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"bpm-process 205/0、system-biz 266/0、openapi-biz 6/0、bootstrap 46/0（含 R1 PG 双租户测试 2/2、Flyway H2 15/15、PG 12/12、I4TenantIsolationPostgres 2/2）BUILD SUCCESS"},{"tool":"node-http","outcome":"SUCCEEDED","detail":"i4-r5.mjs 真实 HTTP 采集 r2 8/8、r3 28+12、r5 4/4 全绿"},{"tool":"browser","outcome":"SUCCEEDED","detail":"375px 详情/必填拒绝/提交/已办回看/outsider 深链 全程无横溢，FK 可读回显"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"typecheck=0 lint=0 test=0(1183 passed+3 skipped) build=0"},{"tool":"sha256sum","outcome":"SUCCEEDED","detail":"manifest.sha256 209 项 -c 回读 209 OK / 0 BAD"}],"browser_status":"OPERABLE"}
