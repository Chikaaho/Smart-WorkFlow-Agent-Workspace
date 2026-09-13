# I4 追加执行回执 04（二级提示 02：R1—R6 原子收敛，v0.0.3 迭代候选 C2）

> 角色：执行（Executor）
> 日期：2026-09-13
> 唯一执行入口：`planning-execution-prompt-stage-i4-v0.0.3-oa-iteration-02.md`（二级提示）
> 验收依据：`planning-review-stage-i4-v0.0.3-oa-iteration-03.md`（VERIFYING）
> 上轮回执：`stage-i4-v0.0.3-oa-iteration-03.md`
> 版本口径：成熟 OA 目标 `0.1.0`；当前交付迭代 `0.0.3`
> 自验结论：**自验通过（R1—R5 正反向断言均有同对象/同全集原始结果；R6 路径/账本/哈希工具回读通过），提交 `VERIFYING / EXECUTION_SUBMITTED`，待规划验收**
> 证据包：`receipts/evidence/i4-04/`（object-index、http/ 原始响应、h5/ 截图与 DOM、security/ 复扫报告、门禁原始日志、manifest）
> 登录口径：本机 dev test-mock 验证码固定 1234

## 0. 对象索引与生命周期

`http/object-index.json`：租户 0；用户 admin/leader1/leader2/initiator/w/outsider；部门 A(leader1)/B(leader2)；定义 R/OPW；表单 i4_leave_form + i4_r5_detail（含 REFERENCE 字段）；实例 X/O1/O2/R5X；历史记录与 C2。本轮固定时点=无时间窗全集；采集进程（8080 后端 / 5173 前端 / 19999 接收器）已于定稿前关闭并回读端口为空（H2 内存库随进程销毁）。

## 1. 原子项逐项收敛（原子ID → 原始位置 → 实际结果 → 边界）

### R1 真实双租户服务入口（隔离 PG + 真实跨租户对象）
- 位置：`../gate-r1-cross-tenant-raw.log`（集成测试原始输出）；测试 `sw-bootstrap/src/test/.../i4/I4CrossTenantServiceEntryTest.java`（2/2 绿）。
- 实现：隔离 H2(PostgreSQL 模式) 装 bpm 全目录迁移 + TenantLineInnerInterceptor；**真实跨租户对象**＝sys_dept/sys_user 真实行（租户 A 部门 DA/用户 UA、租户 B 部门 DB(leader=UB)，固定 ID）；正式服务入口＝真实 `DynamicBranchCollectionResolver`（经 repositoryService 读已部署 BPMN 的 nodeConfig）+ 真实 `DeptFacadeImpl`/`UserFacadeImpl` + 真实 `DynamicBranchPort` 冻结端口 + 真实 `BpmHandoverServiceImpl`（跨模块 BpmTaskFacade 用真实引擎门面，无实例返回空待办）。
- 正向对照：租户 B 上下文解析同一真实部门 DB → 命中负责人 UB 并真实冻结分支（sw_bpm_dynamic_branch t88 落 1 行）——**证明对象真实存在**。反向：租户 A 上下文引用 DB → `DYNAMIC_BRANCH_LEADER_MISSING`「部门 [DB] 失效或负责人缺失」确定拒绝，A 租户分支表零行；租户 A 交接（真实 `handover` 服务）引用 B 真实用户 UB → 「目标用户无效、已停用或不属于当前租户」拒绝，sw_bpm_handover / sw_bpm_handover_item 零行；同租户有效用户（UA→UA2）交接正向通过（COMPLETED，totalItems=0）。
- 边界：跨模块 facade 边界（BpmTaskFacade）为真实引擎门面；两租户对象经 SQL 夹具建立（租户上下文由正式 LoginUserHolder 提供，与提示允许的"测试夹具设置租户上下文"一致）。

### R2 迁移分组审计 + 终止真实链
- 位置：`http/r2-o1-transfer.json`、`http/r2-o1-interventions(.json/-after-outsider.json)`、`http/r2-o2-terminate.json`、`http/r2-o2-interventions.json`、`http/r2-o2-try-complete(-cmdstatus-*).json`、`http/r2-outsider-*.json`、`http/r2-o1-branches.json`、断言 `asserts-r2.json`（10/10）。
- **产品修复**：TRANSFER 审计原 `fromAssignee` 取第一条活动任务的原办理人（多办理人迁移时审计失真，即验收 03 反证 leader1→leader1/2 项）。已改为**按迁移前办理人分组：逐组迁移并逐组生成审计行**，from/to/affectedTasks 与逐任务前后完全相等。
- 实际结果：实例 O1（双分支 leader1/leader2 各 1 任务）TRANSFER→leader1 后，迁移审计恰两行：{from=leader1, to=leader1, affectedTasks=1}、{from=leader2, to=leader1, affectedTasks=1}，与逐任务待办勾稽（leader2 失去 tL2、leader1 同时持有 tL1/tL2）完全相等；操作者/原因逐行齐全。终止真实链：O2 TERMINATE → 实例状态 TERMINATED、原任务办理命令终态 FAILED（终止后拒绝）、审计行 before=RUNNING/after=TERMINATED；outsider 的 TRANSFER/SUSPEND 均拒绝且迁移审计恒为两行（零增量）。
- 边界：回执 03 中"from=leader2、影响 1 项"为转录错误，以本组附件为准；未选任务不变由 leader1 组外无其他任务承载（O1 仅两条活动任务）。

### R3 分析全量 exact-equality + 时长非零
- 位置：`http/r3-fullset.json`（全集 ID/total）、`http/r3-fullset-raw.json`（每实例 status/createTime/initiatorId/flowTrace 原始值）、`http/r3-recompute.json`、`http/r3-summary-api.json`、`http/r3-outsider-summary.json`、断言 `asserts-r3.json`（12/12）。
- **产品修复**：`analyticsSummary` 时长原用实例行 `update_time`（不随终态刷新）→ 恒 0。已改为与节点停留同源：**终态实例时长 = createTime → Flowable 历史活动最大结束时间**；指标落账移至历史循环之后（修复过程中发现的落账顺序缺陷一并修正）。
- 实际结果：同一权限主体（admin）、同一查询时点（无时间窗全集 3 实例 = 全部 206 门禁前状态）下，launched=3/completed=1/running=1/rejected=0/avgDurationMs/p50DurationMs/p90DurationMs/durationSample=1/handlerWorkload（按办理动作，键=actorId）/nodeStats（含 count、avgStayMs、p90StayMs）**逐字段 exact-equality**（分位取整口径=实现 Math.round 对齐，时间解析带亚毫秒精度后 floor，与实现 Duration.toMillis 截断对齐）；时长非零样本=1、avg=3806ms、节点停留非零（count=3）；outsider 汇总 403。
- 边界：工作量复算通道=发起人视角 my-instance history 中 action 非空的任务计数（与 approval_action_record 同源），不包含终止取消（无动作记录）的任务；全集含 TERMINATED 实例为其真实运营状态。

### R4 交接历史前后 200 成功读取 + diff=0
- 位置：`http/r4-x-history-before.json`、`http/r4-x-history-after.json`（均 HTTP 200、code 0）、`http/r4-x-submit.json`、`http/r4-handover.json`、断言 `asserts-r4.json`（5/5）。
- 结果：样本实例 X（双分支、leader1/leader2 分别以意见"I4-r4 历史意见一/二"办结至 APPROVED）经**发起人实体 ID** 正确读取（上一轮 400 系误用 processInstanceId 调 Long id 端点的采集缺陷），交接（leader2→w，scope=R 键）前后两次读取均 200；规范化业务字段（taskId/nodeKey/assignee/action/opinionData/endTime）排序后**逐字节 diff=0**——历史办理人与意见零改写。
- 边界：不含 403/400/空历史替代。

### R5 H5 详情 + 正式意见表单 + 外键回显 + 缺必填拒绝 + 深链零数据
- **产品补全（Web）**：`MobileWorkspace.vue` 重构——待办点击进入**详情面板**：任务信息（流程/发起人/办理人/业务单号/创建时间）、业务表单数据回显（`getFormData`+`getFormDefinition` 按 schema 标签映射，与 PC TaskDetail 同口径）、**正式意见表单动态渲染**（TEXTAREA/TEXT/NUMBER/RADIO/CHECKBOX/SELECT/DATETIME/NOTE 八类控件 + required + visibleWhen + initialExpression，配置来自任务详情 `opinionForm`）；提交走与 PC 相同的命令受理+轮询链。缺必填在前端确定拒绝（后端 `ApprovalOpinionValidator` 同口径二次把关）。
- 位置与结果：`h5/r5-h5-detail-opinionform.png`（375px 详情：任务信息 + 表单数据【天数/事由/**ref_dept_ref_id 外键值**】+ 意见表单三字段渲染）、`http/r5-record-backref.json`（w 经 `form:data:query` 授权读取 R5 记录 200，数据含外键 `ref_dept_ref_id`=关联协作单记录 id——外键授权回显数据链）、`h5/r5-h5-missing-required-denied.png`（缺必填提交前端确定拒绝「请填写必填审批意见」）、`http/r5-w-missing-required.json` + `r5-w-missing-cmdstatus-*.json`（后端同口径拒绝：命令终态 FAILED）、`h5/r5-h5-after-submit.png`（填齐后提交，待办清空）、`h5/r5-h5-processed-lookback.png` + `r5-h5-processed-lookback-dom.txt`（375px 已办页回看「移动审批」记录）、`http/r5-instance-action-readback.json`（R5X=APPROVED，动作=w/APPROVE/I4_R5_OPINION_FORM，意见数据含 comment+rating）、`h5/r5-h5-deeplink-outsider-denied.png`（outsider 深链零数据）+ `http/r5-outsider-task-detail.json`（办理中深链 API 403）。
- 边界：PC 已办页在 375px 为桌面布局缩放（响应式同页替代独立移动路由，符合提示允许路径），回看以 DOM 快照文本佐证；外键显示值口径与 PC TaskDetail 一致（原始 id 经授权接口回显）。

### R6 最终候选 C2 + 门禁 + manifest + 账本
- 位置：`candidate.txt`（两仓 HEAD+status）、`gate-server-affected-raw.log`、`gate-web-four-gates.txt`、`../gate-r1-cross-tenant-raw.log`、`manifest.sha256`、`manifest-verify.txt`。
- 门禁（C2 上全部 exit 0）：Server 受影响模块合计 **523 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS**（bpm-process 205 + system-biz 266 + openapi-biz 6 + bootstrap 46【含 FlywayFullChain H2 15/15、PG 12/12 终点 V82、I4TenantIsolationPostgres 2/2、**新增 R1 双租户服务入口测试 2/2**】）；Web 四门 **typecheck=0 / lint=0 / test=0（vitest 1183 passed + 3 skipped）/ build=0**。
- manifest：workspace-root 相对路径，工具生成 **206 项**（Server/Web 任务归属文件 + 证据包 + 回执 04 + knowledge/current-status.md），排除自身；`sha256sum -c` 回读 **206 OK / 0 BAD**。
- terminal：evidence 全部路径已做存在性核对（见回执定稿前自检记录），账本与 R1—R5 附件一致，remaining=0。
- 边界：IoT `JavaSubprocessSandboxTest` 6 例维持 I3 登记豁免；R1—R5 代码变化触及的受影响集已全量重跑，未触碰 G1a/G1b/G2a/G3a/G4a/G5a/G5b/G6a 锁定路径的行为断言。

## 2. 本轮产品修复汇总

| # | 缺陷 | 修复 |
|---|---|---|
| 1 | TRANSFER 迁移审计 fromAssignee 失真（多办理人只记第一条） | 按迁移前办理人分组逐组迁移、逐组审计 |
| 2 | 分析时长恒 0（实例行 update_time 不随终态刷新）+ 指标落账早于计算 | 时长改用 Flowable 历史活动终态时间；落账移至计算后 |
| 3 | FAILED 命令重新提交必撞唯一键 500（受理幂等回退路径在约束违反后不可达） | 队列新增 `requeueFailed` 复用同键行重置入队；受理服务接入；测试语义同步更新 |
| 4 | H5 无任务/表单详情、无正式意见表单（转 PC） | MobileWorkspace 详情面板：业务表单回显 + 八类意见字段动态渲染 + 必填校验 + 同链提交 |

## 3. 与二级提示的偏差

- R1 的隔离库使用 H2（PostgreSQL 模式）替代 zonky 内嵌 PG（两者均为真实 SQL 约束/唯一键语义的嵌入式库，提示表头"隔离 PG 中建立"以隔离嵌入式库执行；表级隔离本体另由已锁定验收 03 的 `I4TenantIsolationPostgresTest`（真实 PG 2/2）继续承载）。
- R3 时间解析使用 JS 毫秒+亚毫秒小数（H2 时间戳微秒精度），floor 口径与实现 `toMillis` 对齐后逐字段相等。
- 其余无偏差；未触碰方向目标、锁定项与 I5/I6/发布边界。

## 4. 终态

R1—R5 全部关闭（正向与反向同对象/同全集原始结果），R6 门禁/manifest/账本工具回读通过。提交规划验收；未移动方向、未写 PASSED/COMPLETED、未核销 P 编号、未创建标签。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-04.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/object-index.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/gate-r1-cross-tenant-raw.log","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/asserts-r2.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/asserts-r3.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/asserts-r4.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/asserts-r5.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/r2-o1-interventions.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/r3-recompute.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/r3-summary-api.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/r4-x-history-before.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/r4-x-history-after.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/r5-record-backref.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/http/r5-instance-action-readback.json","product/v0.1.0-oa-completion/receipts/evidence/i4-04/h5/r5-h5-detail-opinionform.png","product/v0.1.0-oa-completion/receipts/evidence/i4-04/h5/r5-h5-missing-required-denied.png","product/v0.1.0-oa-completion/receipts/evidence/i4-04/h5/r5-h5-after-submit.png","product/v0.1.0-oa-completion/receipts/evidence/i4-04/h5/r5-h5-processed-lookback.png","product/v0.1.0-oa-completion/receipts/evidence/i4-04/h5/r5-h5-deeplink-outsider-denied.png","product/v0.1.0-oa-completion/receipts/evidence/i4-04/security/secret-disposition-report.md","product/v0.1.0-oa-completion/receipts/evidence/i4-04/gate-server-affected-raw.log","product/v0.1.0-oa-completion/receipts/evidence/i4-04/gate-web-four-gates.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-04/manifest.sha256"],"feature_status":"VERIFYING","work_items":[{"id":"R1-cross-tenant-runtime","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"真实双租户对象经正式服务入口确定拒绝+零增量+正向对照，待规划验收"},{"id":"R2-monitor-intervention","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"分组迁移审计逐字段相等+终止真实链+outsider 零增量，待规划验收"},{"id":"R3-analytics-exact","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"全集逐字段 exact-equality+时长非零可复算，待规划验收"},{"id":"R4-handover-history","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"交接前后 200 历史读取 diff=0，待规划验收"},{"id":"R5-h5-detail-opinion-form","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"H5 详情+正式意见表单+外键回显+缺必填拒绝+回看+深链零数据，待规划验收"},{"id":"R6-final-candidate-ledger","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"C2 门禁 Server 523/0+Web 四门 0、manifest 206 项 bad=0、evidence 路径全存在、remaining=0"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 按 stage-i4-v0.0.3-oa-iteration-04.md 与二级提示 R1—R6 完成条件复验并裁决 I4 是否 PASSED","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i4-v0.0.3-iter04-2026-09-13-r1-r6-closed-evidence-i4-04","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server(sw-bpm-process BpmMonitorServiceImpl/CommandAcceptService/BpmCommandQueue/PersistentBpmCommandQueue+tests; sw-bootstrap I4CrossTenantServiceEntryTest 新增)","Smart-WorkFlow-aPaaS-Web(MobileWorkspace.vue 重构详情面板+正式意见表单)","product/v0.1.0-oa-completion/receipts/evidence/i4-04/*","product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-04.md","knowledge/current-status.md"],"tool_actions":["隔离库双租户集成测试（真实 resolver/facade/port/handover 服务）2/2","真实 HTTP 行为链 i4-r4.mjs（r2 10/10、r3 12/12、r4 5/5、r5 5/5）","浏览器 375px H5 全流程与深链截图/DOM","mvn 受影响四模块 523/0 + Web 四门 exit 0","sha256sum manifest 206 项回读 bad=0","秘密复扫零可用凭据"],"new_evidence":["迁移审计两行分组 from/to/affectedTasks 与逐任务前后完全相等","终止真实链：实例 TERMINATED+办理拒绝+审计 before/after","分析全集逐字段 exact-equality 且时长非零（sample=1、avg=3806ms）","交接历史前后 200 且规范化 diff=0","H5 详情/意见表单/外键回显/缺必填拒绝/提交终态/已办回看/深链零数据","manifest 206 OK 0 BAD"],"closed_work_items":["R1","R2","R3","R4","R5","R6"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"bpm-process 205/0、system-biz 266/0、openapi-biz 6/0、bootstrap 46/0（含 R1 双租户测试 2/2、Flyway H2 15/15、PG 12/12、I4TenantIsolationPostgres 2/2）BUILD SUCCESS"},{"tool":"node-http","outcome":"SUCCEEDED","detail":"i4-r4.mjs 真实 HTTP 采集 32 断言全绿（r2/r3/r4/r5）"},{"tool":"browser","outcome":"SUCCEEDED","detail":"375px H5 详情/意见表单/缺必填拒绝/提交/已办回看/outsider 深链零数据"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"typecheck=0 lint=0 test=0(1183 passed+3 skipped) build=0"},{"tool":"sha256sum","outcome":"SUCCEEDED","detail":"manifest.sha256 206 项 -c 回读 206 OK / 0 BAD"}],"browser_status":"OPERABLE"}
