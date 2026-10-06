# P63：MES前置能力 完成回执 01

2026-10-06；角色：Executor；等级：L；状态：**已提交完成回执，等待 Planner 功能验收**（本回执为事实登记，不含 PASSED/COMPLETED 终态裁决、不核销 P63、不改变功能46/清单46/22/22、ADV64、问题57 基线）。

## 0. 执行入口与提交索引

| 项 | 值 |
|---|---|
| 唯一执行方向 | `product/p63-mes-workflow-foundations/ready/direction-p63-mes-workflow-foundations.md`（L；READY） |
| 探索回执 | `search_fallback/p63-mes-workflow-foundations-readiness-20261006.md` + 附件 |
| 规划复核 | `product/p63-mes-workflow-foundations/receipts/planning-review-readiness-01.md` |
| Server 分支 develop | 72b5aef（S1 表单多选存储/子表放行/实例读 Facade）→ 08ba8a5（S2 FORM_FIELD 策略+逐部门负责人权威解析）→ 2c6adba（S3+S4 动态并行v2+手工并行网关）→ 6f0d1ea（S5 一次性 IoT 预约）→ edf5646（S9 预约链运行期缺陷修复） |
| Web 分支 develop | 5b0988a（S6 表单多选+datetime）→ ca75a54（S7 参与人结构化面板+动态并行v2面板+并行网关）→ 3116947（S8 预约配置/详情面板/取消链）→ 9ce09b6（S9 表单多选与datetime三缺陷修复） |
| 浏览器证据 | `receipts/evidence/browser-01/`（01—09 图 + db-readbacks.md，索引见 §6） |

## 1. 交付对象（实现拆解摘要）

- **表单来源**：`FieldDef/FieldSpec` 增 `multiple`；USER/DEPT 多选落 VARCHAR(1000)（沿 MULTISELECT JSON 数组先例）；`format='datetime'` 日期时间；子表列放行 USER/DEPT；新增 `FormRecordReadFacade` 跨模块只读实例接缝（显式租户、完整投影、子行 id）。
- **参与人策略**：注册表新增 `FORM_FIELD`（objectType USER|DEPT × scope MAIN|TABLE，field/tableField/column）；`FormFieldParticipantResolver` 服务端权威解析（findActiveUserIds / findDeptLeaderMap 逐部门负责人）；`formFieldConfigError` 按 ApiOptionalContractGate 返回 Optional。
- **动态并行 v2**：`semanticVersion=2` 门控；对象分支（USER 按人、DEPT 按部门唯一负责人、同负责人不同部门保留独立分支）；轮次以多实例根 executionId 键控（同轮复用、退回重入新轮、旧轮 START 行 SUPERSEDED_BY_ROUND）；`source_refs` 保留来源行；v2 进入重置会票计数；汇聚分母修复（最新轮有效分支数，DISTINCT 收敛缺陷修正）。
- **手工并行网关**：新增 `ParallelGatewayTranslator`（PARALLEL_GATEWAY，GATEWAY 类，拓扑 1..MAX/1..MAX）——见 §3 偏差 1。
- **一次性 IoT 预约**：迁移 V0.1.5（动态分支 6 列+轮次唯一键重建）、V0.1.6（sw_iot_command_reservation 冻结意图表）、R__ 菜单（9109/9318，避开 P62 占用）；`IotCommandReservationFacade`（同事务 createIntent 16 JDK 平铺参数、条件取消、按实例/按 id 查询）；`IotReservationDispatchJob`（@Scheduled 10s 轮询持久行、TenantLineSuspension 无登录上下文、UTC 比较、条件认领、命令到期对齐 due+窗口、立即外发尝试）；`BpmIotReservationIntentRecorder`（仅 PROCESS_APPROVED、deliveryMode=RESERVATION、dueField 时区歧义/不存在拒绝、lateWindow 1—3600 默认 60、意图失败审批整体回滚）；`IotReservationController`（查询/取消路由，权限 iot:view / iot:reservation:cancel）。
- **Web**：form-schema `multiple/format` 契约；设计器字段往返保键（USER/DEPT/DATE 分支）；填报控件 UserControl/DeptControl 多选、DateControl datetime；normalizeSubmitData/initField 多选数组归一；参与人 8 策略结构化面板与动态并行专面板（semanticVersion 开关、来源配置）+ 语义校验门禁；ApproverCandidatesDialog 部门多选；IotFlowActions 预约下发配置块；TaskDetail IoT 预约卡（状态/时间/时区/窗口/取消信息 + v-perm 取消按钮）；iot-reservation 适配器接缝（ESLint 模块跨界禁令合规）；mock 层同步。

## 2. A01—A10 逐项矩阵

| ID | 对象 | 实际结果 | 证据（层级） |
|---|---|---|---|
| A01 | 八种字段组合（主字段/表格列 × 人员/部门 × 单选/多选）的配置、填报、保存回显与运行读取；三类审批节点来源配置 | Server 存储/校验/序列化/读取全链实现；Web 设计器-填报-回显-提交全链实现（真实链缺陷见 §3 偏差 2，已修）；参与人 8 策略结构化面板+动态并行来源面板，全程无手写 JSON | 引擎/单元：P63FormMultiValueTest(3)、P63FormFieldParticipantResolverTest(4)、UserControl.spec(5)、DeptControl.spec、subfield-convert.spec、node-capabilities.spec、DateConfig.spec(4)；真实浏览器链：02/03/04/06 图（主字段 USER 单/USER 多/DEPT 多/DATE datetime 代表组合）；TABLE 列组合为引擎级（translator 校验+resolver TABLE 分支），浏览器级表格列全链未走全——如实注明 |
| A02 | 来源身份→实际待办、分支数、同负责人多部门独立、表格重复来源追溯 | 部门经服务端权威解析唯一负责人；真实链 dept_list=[\"1\"]→DEPT 对象1→leader=1→单分支单任务→通过；同负责人多部门独立分支与表格来源行追溯为引擎级验证 | 引擎：P63DynamicParallelV2Test(4)；真实链+DB：db-readbacks §2（semantic_version=2、source_refs、leader_id）+ 06 图 |
| A03 | 三类节点一致解析、普通审批/会签不漂移、跨租户/无权拒绝 | FORM_FIELD 注册为统一策略，三类节点共用同一 resolver 与权限边界；来源空/失效→PARTICIPANT_RESOLVE_EMPTY 阻断（fail-closed）；会签计票与 ALL/ANY/RATIO 逻辑未在本轮 diff 中改动；跨租户对象经带租户权威查询拒绝 | 引擎/单元：resolver 测试(4)；漂移防护：S2—S5 批次 form/bpm 定向门禁 + S9d iot/bootstrap 全量复跑 |
| A04 | 同轮快照冻结、新轮次重解析、历史不覆盖、旧任务不可串办、确定错误结果、单次汇聚 | freezeRound 同执行复用/重入新轮/旧轮 SUPERSEDED_BY_ROUND；closeRemaining 收敛于最新轮；v2 进入重置会票计数；recordAction 任务绑定优先 task_id 匹配 | 引擎：P63DynamicBranchPortV2Test(5)、P63DynamicParallelV2Test(4)；真实链：db-readbacks §2（round0 关闭、round1 承接）；首入双轮观察见 §3 偏差 3 |
| A05 | 成功完成可靠创建预约、非成功终态零预约、意图失败回滚、提交后失败不回滚、重复事件零重复 | 意图 recorder 仅监听 PROCESS_APPROVED；createIntent 同事务 MANDATORY，失败抛错令审批整体回滚；unique(租户,实例) 幂等；提交后调度/下发失败仅更新预约/命令状态 | 单元：P63ReservationIntentRecorderTest(3)；真实链：实例已通过→意图 13:55:26 同事务落库（db-readbacks §1） |
| A06 | 到点前零外发、窗口内触发、过期不外发、显式时区、服务恢复、取消竞争、执行有效性重核 | 到点前 PENDING 零外发；到点条件认领 PENDING→DISPATCHING→DISPATCHED；窗口内重新置回 PENDING 后再次合法认领（复用验证）；取消与认领竞争为 DB 行级条件更新单结果生效；时区 Asia/Shanghai 显示与 due_local_text，歧义/不存在时刻配置时拒绝 | 真实链：db-readbacks §1（PENDING→DISPATCHED→取消 CANCELED 全轨迹）+ 05/06 图；单元：P63IotReservationTest(6)（EXPIRED 扫描/条件认领/取消状态机）、P63ReservationIntentRecorderTest(3)（时区歧义）；服务停机恢复路径为设计级（意图持久行轮询）+引擎级覆盖，真实重启演练未独立走全——如实注明 |
| A07 | 流程↔预约↔命令↔回执同对象可查询链、部分失败/UNKNOWN 如实 | 实例→预约（按实例查询 API+任务详情卡）→命令（幂等键含预约 id、commandId 关联）→结果（发送通道未装配→FAILED 如实可查，未伪造设备成功）；UNKNOWN 禁自动重发边界未改动 | 真实链+DB：db-readbacks §1；UI：04/06 图（预约卡状态/时间/时区/窗口/取消信息）；路由：/iot/reservations、/{id}、/{id}/cancel |
| A08 | 可见浏览器真实全链、桌面与常见窄屏、对象/身份/请求/持久化关联可复核 | 表单设计发布→填报发起→审批→动态并行→流程通过→预约创建→到点认领→结果回查→取消，全程真实用户链（无 mock、XHR/DB 复核）；桌面 1920 与窄屏 375×812 均可用 | browser-01/01—09 图；db-readbacks.md；观察项：窄屏顶栏语言切换按钮「中文」换行（可用性无阻塞，§3 观察 6） |
| A09 | 手工并行分支配置/路径/汇聚原义（含多节点路径）、组合不提前/不重复汇聚、旧图发布不重写、旧实例继续办理 | 改动前事实：生产注册表无并行网关翻译器（审批 1入1出、仅 CONDITION 多出）——「现有手工并行」在生产图翻译链中此前不可配置；改动后：新增 ParallelGatewayTranslator（新增式，不触碰既有审批/条件翻译与汇聚规则），引擎级验证手工并行多节点分支、分支内动态先自汇聚再外层汇聚、汇聚不提前/不重复；已发布图设计器打开+显式加网关后 published_version 保持 1、部署与已办实例未重写 | 改动前事实：2c6adba 之前注册表源码（无 PARALLEL_GATEWAY 翻译器，仅校验器占位）；改动后行为：P63ManualParallelFlowableTest(2)+07 图（画布菱形渲染+PARALLEL_GATEWAY 属性面板）；旧图/旧实例：db-readbacks §3。**本条含偏差声明，交 Planner 裁决（§3 偏差 1）** |
| A10 | 旧单选/旧审批会签/旧动态快照去重/既有立即下发兼容、迁移可升级、关闭新配置零预约、已持久预约可管理 | multiple 缺省=旧单值语义；semanticVersion 缺省=1 旧合并/冻结规则；deliveryMode 缺省 IMMEDIATE 原义；迁移 V0.1.5/V0.1.6+R__ 菜单 PG/H2 字节一致、全链与升级演练锚点通过；RESERVATION 仅显式配置产生意图；已持久预约有取消/查询/过期明确去向 | 引擎：v1/v2 门控（isSemanticV2）、P63IotReservationTest；锚点：bootstrap FlywayFullChain/升级演练/Phase4/Phase5 门禁（S9d 复跑 253/0/27）；UI：IotFlowActions IMMEDIATE 缺省不写额外配置（IotFlowActions.spec 4） |

## 3. 偏差与如实登记项

1. **手工并行网关为新增交付（交 Planner 裁决）**：A09 要求「普通手工并行保持原义」，改动前事实为生产注册表**不存在**可配置的手工并行网关路径（探索阶段已确认：审批类节点 1入1出，PARALLEL_GATEWAY 仅校验器占位）。本批在授权的「流程图/节点配置」范围内**新增式**实现 ParallelGatewayTranslator 并以引擎行为测试承载「改动后行为」；未删除或改写任何既有审批/条件翻译。若 Owner 预期的「现有手工并行」指其他形态，此偏差需 Planner 重新限定；不得以本条自行放宽 A09。
2. **真实链发现并修复的缺陷（5 项，均已随 edf5646/9ce09b6 提交）**：
   - 调度线程无登录态触发租户拦截器报错→TenantLineSuspension 包裹过期扫描与认领下发；
   - createIntent 以本地时钟比对 UTC 窗口致意图误判过期→`LocalDateTime.now(ZoneOffset.UTC)`；
   - 预约设备解析走空登录态路径失败→`RESERVATION:` 键挂起态显式查询回退、命令租户取自设备记录；
   - Web 提交载荷：initField 多选初始值、normalizeSubmitData 数组透传/空串归一；
   - Web parseDefinition/mapRawField 丢 `multiple/format` 键致发布回读后多选退化。
   缺陷 2/3 在首轮真实链中实际暴露（意图误 EXPIRED、下发「设备不存在」），修复后重走链验证通过——真实链验收价值所在，如实登记。
3. **首入双轮观察项**：真实链首次进入动态并行节点时 17ms 内先后冻结 round0 与 round1（两个不同 executionId），round0 以 SUPERSEDED_BY_ROUND 关闭、round1 承接办理；净行为正确（单分支、单任务、单次汇聚、唯一终态）。登记为观察项待 Planner 裁决是否要求收敛轮次键控口径。
4. **受控对端边界**：验收环境未装配下发通道（无 broker/真实设备对端），命令按既有失败语义落 `FAILED`「发送通道未装配」并如实可查；A08 的「受控对端下发」覆盖到受理/外发尝试边界，设备物理回执层级未覆盖。
5. **设计器草稿自动保存**：07 证据的并行网关节点为画布显式添加，设计器草稿自动保存将其写入 def 行工作草稿（graph_json 含 node_3，def_version 1→2）；`published_version=1` 未变、Flowable 部署与已办实例未受影响；验收库已销毁。
6. **窄屏观察项**：375×812 下顶栏语言切换按钮「中文」文字换行（08 图），可用性无阻塞。

## 4. 实际门禁（终态复跑，2026-10-06）

| 门禁 | 结果 |
|---|---|
| Server `sw-basic-iot` 全量 | 63/0/0/0（含 P63IotReservationTest 6） |
| Server `sw-bootstrap` 全量 | 253/0/0/27（27 为既有参数手动测量跳过口径；含 Flyway 全链 H2/PG、I6G7/I6G7b 升级演练、Phase4 PG 迁移行为、Phase5 IoT API 边界门禁） |
| Web lint | 0 errors / 80 warnings（存量 prettier 风格告警） |
| Web typecheck | vue-tsc -b --noEmit 通过 |
| Web vitest | 1358 passed / 3 skipped（150 文件通过 + 1 跳过） |
| Web build | vue-tsc + vite build 通过（3.78s） |
| S1—S5/S6—S8 批次门禁 | 各批次提交时已分别执行（form/bpm/engine 定向 P63 套件与四门），记录见对应批次提交 |

## 5. 剩余项

1. **Planner 功能验收**：A01—A10 终态裁决与本回执偏差 1/3 的处理，由 Planner 独立验收后下发终态同步；本执行方不自行裁决 PASSED/COMPLETED、不核销、不改功能/清单计数（基线：功能46、清单✅46/🟦22/⬜22、ADV64、问题57）。
2. **未覆盖层级**：设备物理回执/真实 broker 对端；真实后端重启的停机恢复演练；TABLE 列来源的浏览器级全链；窗口过期路径的真实调度链（引擎/单元级覆盖）。
3. **knowledge 登记**：新建 `knowledge/features/p63-mes-workflow-foundations.md`（状态=已提交完成回执待功能验收）；P63 是否计入正式功能数（46→47）由 Planner 终态同步裁决。

## 6. 证据索引

| 文件 | 内容 |
|---|---|
| browser-01/01-workspace-1920.png | 工作台入口（桌面 1920） |
| browser-01/02-form-designer-published.png | 表单设计器发布态（5 字段含多选/部门/日期时间） |
| browser-01/03-form-filled.png | 真实填报（USER/DEPT 多选真实选择、datetime 填值） |
| browser-01/04-task-detail-reservation.png | 任务详情预约卡（待触发态） |
| browser-01/05-reservation-pending.png | PENDING 态预约卡（到点前零外发窗口） |
| browser-01/06-reservation-canceled.png | 已取消态+取消信息行（取消人/时间/原因） |
| browser-01/07-parallel-gateway-canvas.png | 设计器画布并行网关菱形渲染+PARALLEL_GATEWAY 属性面板 |
| browser-01/08-narrow-375-taskdetail.png | 375×812 任务详情（A08 窄屏） |
| browser-01/09-narrow-375-reservation.png | 375×812 预约卡/取消信息/流转记录 |
| browser-01/db-readbacks.md | 预约/动态分支/流程定义持久化关联回读 + 收尾销毁记录 |
| Server 测试类 | P63FormMultiValueTest(3)、P63FormFieldParticipantResolverTest(4)、P63DynamicBranchPortV2Test(5)、P63DynamicParallelV2Test(4)、P63ManualParallelFlowableTest(2)、P63IotReservationTest(6)、P63ReservationIntentRecorderTest(3) |
| Web 测试 | UserControl.spec(5)、DateConfig.spec(4)、DeptControl.spec(+2)、subfield-convert.spec(+3)、IotFlowActions.spec(4)、TaskDetail.spec(+6)、node-capabilities.spec（8 策略+动态并行 v2 语义校验） |
