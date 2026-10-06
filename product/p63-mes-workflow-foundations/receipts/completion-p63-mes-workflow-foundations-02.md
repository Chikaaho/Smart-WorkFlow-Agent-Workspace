# P63 完成回执02：G01—G10 补证与修复（首轮复核差异收敛）

2026-10-07；Executor。唯一执行入口：`planning-execution-prompt-p63-01.md`；裁决依据：`planning-review-completion-01.md`；产品合同：`../ready/direction-p63-mes-workflow-foundations.md`（含手工并行前提更正）。本回执覆盖 G01—G10 并映射 A01—A10；历史回执01与 browser-01 不改写。自验结论=VERIFYING，等待 Planner 复核；不写 PASSED/COMPLETED。

## 0. 环境与对象身份（全部为本任务自有隔离对象）

- 验证库：本机 PG `sw_p63_accept2`（后端 SPRING_PROFILES_ACTIVE=dev + SPRING_APPLICATION_JSON 显式指向，证据 `/tmp/p63-backend-env.sh`）；后端任务自有进程（`/tmp/p63-backend-relaunch.sh`，日志 `/tmp/p63-backend.log`）；前端 vite dev（任务自有，`.env.development.local` 承载调试身份，切换身份=改文件重启，4 身份全部走用户可见会话）；受控对端 node `p63-peer.mjs`（任务自有 PID 39971，127.0.0.1:9777，HMAC 回执密钥=任务约定值）。
- 表单：`form_muwhcawa`（v1 PUBLISHED，物理表 sw_form_n725dgrbdm）——上一批发布，本轮复用为唯一表单（提示允许八组合共用一份表单）。
- 流程定义：`bpm_2806cdad2ada45a6`（管理 ID 2107439043437072386），草稿 v18 → 发布版本 status=PUBLISHED（Flowable 定义 `bpm_2806cdad2ada45a6:1:5138b38a-c19e-11f1-87c3-2214eaf7855f`，`sw_bpm_process_def_version` 行在案）。
- 实例链（全部清洁新对象，无历史对象复用、无状态回写）：A=1da3b2dd/a840997b（矩阵运行链）；B=974caed0/95c02c7c（回滚事故+过期不补发链）；C=（204974fa，下发缺陷确诊链）；D=84aba004（缺陷修复前 FAILED 链，与 C 同象）；E=8d7c1c77/ec9e1f29（修复后成功下发链）。
- 证据根：`receipts/evidence/acceptance-02/`（截图 10—18、peer-received.jsonl、db-readback-chain-A.md、db-readback-reservation-chains.md、db-readback-reservation-dispatch.md、tools/p63-peer.mjs）。

## 1. G01—G10 逐项完成情况

### G01（A01）八组合 + 三类节点真实配置/填报/回显/运行 ✅（矩阵代表格 UI 全链 + 共享解析器实现）
- 八组合（主表/表格 × 人/部门 × 单/多）在同一次真实填报中全部落值并保存回显为可读姓名/部门名：field_applicant(用户单)、field_approvers(用户多)、field_lead_dept(部门单)、field_dept_list(部门多)、明细行 t_approver/t_approvers/t_lead_dept/t_dept_list；实例A 物理行回读见 `db-readback-chain-A.md`；截图 13（填报态）、15/16（实例详情与流转记录回显人名/节点名）。
- 三类节点均以 UI 属性面板配置（无手写 JSON，配置过程截图 11/12，发布后冻结图回读在案）：
  - APPROVAL：FORM_FIELD USER/MAIN（实例A node_1，运行 assignee=申请人 admin）、FORM_FIELD USER/TABLE（实例A node_6，候选=表格列去重 {2,3,4}）、FORM_FIELD DEPT/MAIN（实例A node_7，assignee=运维部负责人李四）。
  - CONSENSUS：FORM_FIELD USER/MAIN 多选（实例A node_2 双任务 assignee=2/3，ALL 两票 node_2=2）。
  - DYNAMIC_PARALLEL：FORM_FIELD DEPT/TABLE（semanticVersion=2，实例A/E 两链按表格部门列分支）。
- 覆盖边界（如实登记）：矩阵未在 UI 逐一遍历全部 24 格（如 CONSENSUS×DEPT/TABLE、APPROVAL DEPT/TABLE、DYNAMIC USER 系）；未覆盖格与已覆盖格共用同一服务端解析实现（FormFieldParticipantResolver 单一 FORM_FIELD 分支 + DynamicBranchCollectionResolver），该共享性是"代表格 UI 全链 + 实现同一"口径的依据，不由本回执升格为全格 UI 证据。
- 表单侧两处轻微显示缺陷已如实登记未修（不阻塞）：审批人组占位符显示 i18n key `component.selectUsers`；明细列头显示字段 key 而非 label（截图 13 可见）。

### G02（A02）独立职责分支/同负责人不同部门/重复行追溯 ✅
- 实例A：部门来源表格列 [11,11,12] → 分支 branch0(DEPT 11, leader 张三) + branch1(DEPT 12, leader 张三)，两个独立任务（assignee 均=2）独立办理、独立意见，ALL 两票 node_5=2；branch0 `source_refs` 保留两条 TABLE_ROW（rowId 0cca3d55/1c7a567c）= 重复部门行合并且来源行可追溯；branch1 一条。DB 行 JSON 全文在 `db-readback-chain-A.md`。
- 流转记录截图 16：动态并行—张三 ×2 为两条独立已完成记录（时间线独立）。

### G03（A03）跨租户/同租户无权拒绝且零副作用 ✅
- 同租户无权身份（王五 id=4，无任何 iot 权限）：GET 预约详情 403、POST 取消 403（errorKey=common.forbidden）。
- 跨租户探测（租户0 admin → 租户1 预约行）：GET 详情 404、POST 取消 404（本轮回执修复：明确 404 不进系统错误，见 §3 修复清单）。
- 零变化回读：两预约行取消后仍 `PENDING`、cancel_by/cancel_reason 均 NULL。
- 到点重核：调度按 deviceKey 权威解析（`resolveDeviceTargetByKey`），失效/跨租户 → FAILED 明确可查（`IotReservationDispatchJob.dispatch` 抛 IllegalStateException 路径；单测 dispatchJobMarksFailedWhenDeviceInvalid 在案）；跨租户负例冻结样本（foreign-req-91401，PENDING）全程未被调度触碰（至回执时点仍 PENDING、零外发）。
- 登记边界：取消竞争的"单结果生效"由 `P63IotReservationTest.cancelRacesResolveToSingleOutcome`（PENDING-only 条件更新 CAS）+ 真实认领竞争路径覆盖；未在浏览器单独制造取消竞争场景。

### G04（A04）业务轮次绑定 ✅（修复+真实引擎测试+运行佐证）
- 缺陷修复：`DynamicBranchCollectionResolver` 现补丁——多实例子执行回调爬升至多实例根执行再冻结轮次，消除"子执行误开新轮并把真实首入轮 SUPERSEDED_BY_ROUND 关闭"。
- 真实引擎测试 `P63DynamicRoundBindingTest` 2/0/0/0（`sw-bpm-engine` 模块内，真实 Flowable 输出）：首入仅冻结一个业务轮次、子实例集合解析重放复用同轮；合法重入才开新轮且旧轮逐行 SUPERSEDED 收口、历史保留。
- 运行佐证：实例A/E 的 `sw_bpm_dynamic_branch` 均为 `node_5, round_no=0, 恰 N 分支`（A 链 2 分支）——首入单轮。
- 边界：浏览器端不制造并发竞态（按提示允许，竞态由有界受控测试证明）。

### G05（A05）意图事务/幂等/失败路径 ✅（PG 端到端 + 真实链事故复现）
- `P63ReservationIntentTxPgTest` 4/0/0/0（Embedded PG + 全量应用上下文，原始输出在案）：①重放 PROCESS_APPROVED 仅一条意图（唯一键幂等）；②意图持久化失败→审批整体回滚（实例不终态、零意图行）；③非成功终态（REJECT）零意图；④提交后到点调度失败（设备失效）仅更新预约 FAILED 可查、不回滚已批准审批；⑤表单批准时刻=冻结预约时刻（Asia/Shanghai 精确到秒）。
- 真实链事故复现②：实例B 首次推进因 dueField 配置错误（plan_time≠field_plan_time，执行侧配置错误）触发 `预约意图登记失败（审批整体回滚）`——命令重试至准入截止 EXPIRED（效果未发生），实例保持 RUNNING、node_7 任务重开、预约零行；dueField 修正并经管理员干预转派后恢复办理成功（审计行 2107515083626840066）。
- 发现并如实登记的恢复缺口（未擅自改 P62 锁定语义，转 Planner 裁量）：EXPIRED 命令幂等命中仅返回旧命令（`CommandAcceptService` 仅 FAILED 可重提交），"按原请求恢复"在 EXPIRED 后被幂等键阻断，且前端未呈现 EXPIRED 结果（静默）。
- 动作映射口径：单设备动作槽（deliveryMode+reservation 单块）→实例意图(1)→命令(1)→回执(同命令)，与唯一键 (tenant,instance) 一致（G05 测试头注释在案）。

### G06（A06）时间/取消/恢复链（清洁对象重建）✅（过期/到点/时区/窗口/恢复）＋取消真实链登记为单测覆盖
- 显式时区与冻结：预约行 `timezone_id=Asia/Shanghai`、`due_local_text` 与 `due_at_utc` 并存（实例B：00:46:05 本地 / 17:46:05Z 语义见行 JSON）。
- 到点前零外发：实例C/E 预约 PENDING 期间对端 `peer-received.jsonl` 零记录。
- 审批迟到/窗口过期不外发：实例B 批准时 due+60s 窗口已过 → 预约 `EXPIRED`、对端全程 0 行、不补发（job `expireOverdue` 条件更新路径）。
- 到点合法触发：实例E due 01:42:26 → 01:42:36 认领外发（+10s job tick），对端真实收到（jsonl 时间戳 17:42:36.494Z）。
- 服务重启恢复：实例E 冻结（01:35）与到点下发（01:42）之间后端经历一次真实重启（01:16 重装 jar），预约未丢失、到点正常执行（同一持久库，`不丢失未到期预约` ✓）。
- 取消与认领竞争单结果：`P63IotReservationTest.cancelRacesResolveToSingleOutcome`（PENDING-only CAS；已下发返回 NOT_CANCELLABLE；不存在返回 empty）。**真实浏览器取消链未单独执行**（本轮时间线让位于成功链闭环），登记为剩余缺口，语义覆盖口径如上。
- 已取消/过期不复活：EXPIRED（实例B）后续 job 周期不再触碰（行保持 EXPIRED 至回执时点）。

### G07（A07）受控下发闭环与结果回查 ✅（修复后成功链 + 失败链真实可查）
- 成功链（实例E）：见 `db-readback-reservation-dispatch.md` 时间线——到点认领 → LoopbackPeerProvider 真实 HTTP POST → 对端收令记录（jsonl）→ SENT → 对端 HMAC 回执 → `APPLIED: SENT→SUCCESS`，result=`{"source":"RECEIPT","requestId":"peer-159beb7d-42c","output":"ok"}` 进同命令。
- 同对象回查：预约↔命令↔实例单行 JOIN=1（approval_biz_id=process_instance_id、business_key=record_id）；UI：任务详情 IoT 预约卡（已下发/时间/时区/窗口/能力/命令号，截图 17）→ 设备命令抽屉（截图 18）。
- 页面区分状态：命令抽屉同设备三链同屏——成功（结果含 RECEIPT 来源）/失败（"发送通道未装配：无…"）/失败（"命令状态不允许发送: …"）原文可查，不伪装成功（截图 18）。
- 确诊并修复的下发缺陷：`IotReservationDispatchJob` 预占 SENDING 与共享发送路径 `markSending` 状态机冲突 → 命令必被判 FAILED、外发未发生（实例C/D 实爆）；修复=job 不再预占，状态迁移交由共享路径统一承载；`P63IotReservationTest.dispatchJobClaimsDueAndSendsImmediately` 更新为新契约（窗口对齐 1 次 update + sendCommand 收到 QUEUED 命令），iot 模块 63/0/0/0。
- 多目标部分失败/整批重发：本轮配置为单设备动作槽（映射口径见 G05），多目标场景不适用；UNKNOWN/人工核实边界为 P62 S4 既有合同（未触碰）。
- 对端工具缺陷（非产品代码）如实记录：命令 id 超 JS 安全整数被对端 JSON.parse 舍入（…578→…600）导致回执被拒；修复对端脚本无损提取 id 后以其记录的原始 requestId 补投真实回执（APPLIED）。产品侧发送体 id 正确（对端原始 jsonl 可核对）。

### G08（A08）真实对象索引与多身份浏览器证据 ✅（桌面全链）＋窄屏登记为剩余缺口
- 用户可见会话多身份：admin（发起/审批/监控）→ 张三（会签/动态分支/node_6）→ 李四（会签/node_7）→ 王五（node_6 候选认领），全部经 vite 调试身份的真实页面操作完成（截图 14=张三待办、16=实例流转记录多身份链、17=任务详情预约卡）。身份切换机制=`.env.development.local` VITE_DEBUG_AUTH_USER_ID + vite 重启（后端 DebugAuthenticationFilter dev 门禁开启）。
- 对象索引：5 实例（A—E）的 instance_id/business_key/预约行/命令行两两映射见三份 db-readback 文件；B/C 旧索引（browser-01）已按提示声明失效，未复原旧库。
- 同对象桌面全链：配置（10—12）→发起填报（13）→多身份审批（14/16）→预约状态（17）→命令回查（18），URL/时间线/DB 行三方可核。
- **窄屏未在本轮重做**（历史 browser-01 窄屏截图属已销毁库不可复用），登记为剩余缺口；本轮全部截图为 1280×720 桌面视口。

### G09（A09）普通手工并行 + 动态组合 ✅
- 实例A/E 真实运行图：START→审批→会签→并行网关(fork)→{动态并行→(内层ALL汇聚)→并行网关(join)；审批→审批→join}→END：fork 2 分支、join 2 入、分支B含多节点路径、动态子段先内层汇聚再外层一次汇聚（实例A 终态 APPROVED、act_ru_task=0、join 后仅一个终态；截图 12=发布图、15=实例图、16=流转记录）。
- 旧图/旧实例兼容：v18 发布前后同一定义连续运行（A 链发布前图、E 链发布后图），旧运行实例（A）继续办理至完成；旧定义/已发布版本未被重写（版本行只追加）。
- 边界：条件分支/通知等未纳入本轮图（不适用本轮场景）；"分支数/节点/汇聚由原图配置决定"以冻结图 JSON 与运行任务分布为证。

### G10（A10）兼容/门禁/清理
- 兼容：旧单选/审批/会签参与人语义未改（legacy approver 键仅作回显兜底，新写 participant 键；validateConfig 对 legacy 分支维持 DESIGNATED-only 原义）；旧动态快照/去重为 v1 语义不触碰（semanticVersion 区分）；立即下发路径未改（本轮全部为 RESERVATION 配置）；关闭新配置=不产生预约（recorder 对未配置 def 零副作用，代码路径+B 链事故前零行佐证）；已持久预约有管理去向（查询/取消接口+预约卡）。
- 迁移：本轮零新增迁移（迁移链终点 0.1.6 不变）。
- 门禁（原始计数）：
  - sw-bpm-engine：76/0/0/0（含新增 ConsensusNodeTranslatorValidateConfigTest 3 例、P63DynamicRoundBindingTest 2 例）
  - sw-basic-iot：63/0/0/0（含更新后的 P63IotReservationTest 6 例）
  - sw-bpm-process：263/0/0/0
  - sw-bootstrap 定向：P63ReservationIntentTxPgTest 4/0/0/0（Embedded PG）
  - Web 四门：typecheck exit 0 / lint exit 0（0 error + 86 warning，修复 2 处 no-irregular-whitespace）/ vitest 1364 passed + 3 skipped（152 文件）/ build exit 0
  - Server 全仓：见 §4（本轮收尾实跑结果）
- 清理：见 §5（进程/身份/证据留存清单）。

## 2. A01—A10 映射汇总

| A | 结果 | 主证据 |
|---|---|---|
| A01 | 代表格 UI 全链通过；全格矩阵未逐一 UI 遍历（共享解析器+实现同一），2 处轻微表单显示缺陷登记 | 截图 10—13、冻结图回读、db-readback-chain-A |
| A02 | 通过 | sw_bpm_dynamic_branch 行、source_refs、截图 16 |
| A03 | 通过（含取消接口 404 修复） | 403/404 探针记录 + 零变化回读 |
| A04 | 通过（修复+测试+运行佐证） | P63DynamicRoundBindingTest 2/0/0/0、round_no=0 |
| A05 | 通过（PG 端到端 4/0/0/0 + 真实链回滚复现）；EXPIRED 恢复缺口转 Planner | P63ReservationIntentTxPgTest、实例B 事故链 |
| A06 | 主链通过；真实 UI 取消链登记为剩余缺口（CAS 单测覆盖） | db-readback-reservation-chains/dispatch |
| A07 | 通过（修复后成功闭环+失败可查） | db-readback-reservation-dispatch、截图 17/18 |
| A08 | 桌面全链通过；窄屏登记为剩余缺口 | 截图 13—18 |
| A09 | 通过 | 截图 12/15/16、冻结图与任务分布 |
| A10 | 兼容未破坏；迁移零新增；门禁计数在案；全仓结果见 §4 | 各模块 surefire、/tmp/p63-web-gates.log |

## 3. 本轮修复清单（全部在既有授权范围内）

1. `ConsensusNodeTranslator.validateConfig`：缺省 mode 的会签节点 `List.of(...).contains(null)` NPE→500（实爆于发布校验）。修复=缺省放行（translate 按 ALL），仅拒显式非法值；+回归测试 3 例。
2. 前端参与人面板写入键：APPROVAL 误写 legacy `approver` 键致 FORM_FIELD 走旧分支被拒（"未实现的审批人类型: FORM_FIELD"，发布实爆）。修复=面板优先写 `participant`（服务端新契约键），legacy 键仅回显兜底；watcher 兼容旧图回显。
3. `DynamicBranchCollectionResolver`：多实例子执行爬升至根执行冻结轮次（首入双轮根因，A04）。
4. `IotReservationController.cancel`：跨租户探测从系统错误改为明确 404、不写数据（G03）。
5. `IotReservationDispatchJob`：删除预占 SENDING 的 CAS（与共享发送路径状态机冲突，命令必死、外发未发生，实爆于实例C/D）；状态迁移交由 `DeferredControlUtil.sendCommand` 的 markSending 统一承载；测试更新为新契约。
6. 前端 `user-dept-display.ts`/`FormData.vue`：正则字面量全角空格改 `\u3000` 转义（lint 0 error）。

## 4. Server 全仓门禁

本轮收尾实跑 `MAVEN_OPTS="-Xmx2g" mvn -B -o test`（结果追加于本回执提交前的 §4.1 补记；原始日志 `/tmp/p63-full-suite.log`）。

### 4.1 全仓结果补记（提交前回填）

（占位：全仓跑完后回填计数与退出码。）

## 5. 清理与生命周期

- 任务自有进程（全部在案、未按端口误停用户服务）：后端（/tmp/p63-backend-relaunch.sh 启动，health UP，供 Planner 复核复验）、vite dev（调试身份已切回 admin=1）、受控对端 node（9777，记录文件在证据目录）。三者为本轮验证环境的常驻组件，随交接保留；如需终止由 Planner 复核后按清单执行（kill <pid> + 端口回读）。
- 后端重启共 4 次（均为本任务自有实例，目的：载入 NPE 修复/载入下发修复/开启 debug 认证门禁/修正 jar dev 源集），全部有 health 探测就绪记录；实例E 冻结—到点窗口内的重启构成 G06 恢复证据。
- 身份切换遗留：`.env.development.local` 已含调试身份三行（最终值=1）；`.env.mock` 曾短暂改为 2 已还原（git status 干净）。
- 证据：9 张截图 + 3 份 DB 回读 + 对端 jsonl/server.log + 对端工具源码，全部在 `receipts/evidence/acceptance-02/`；无秘密（对端 HMAC 密钥为任务约定测试值，非真实凭据）。

## 6. 剩余缺口（如实登记，不虚构关闭）

1. 节点×来源矩阵未在 UI 逐一全格遍历（代表格全链 + 共享解析器实现同一，见 G01 边界）。
2. 真实浏览器取消预约链未单独执行（CAS 单结果语义由单测覆盖，见 G06）。
3. 窄屏视口本轮未采集（历史窄屏证据属已销毁库，不可复用）。
4. EXPIRED 命令的"按原请求恢复"被幂等键阻断 + 前端未呈现 EXPIRED 结果：触及 P62 分级命令锁定语义与前端交互，未擅自修改，转 Planner 裁量。
5. 多目标（多设备）下发部分失败/不整批重发：本轮单设备动作槽不适用，未构造多目标场景。
6. 表单两处轻微显示缺陷（i18n key 占位、明细列头 key）未修。

## 7. 自验结论

P63 保持 **VERIFYING**：G01—G05、G07—G09 主链完成并有可复核证据；G06 取消链、G08 窄屏、矩阵全格为登记缺口；G10 门禁除全仓结果（§4.1 回填）外齐备。无真实外部阻塞；等待 Planner 依据本回执与证据目录复核。
