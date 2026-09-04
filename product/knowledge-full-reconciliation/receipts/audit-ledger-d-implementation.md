# 审计账本 D — 工程入口 + 争议项实现定位（通知 / 三类个人流程查询 / 模板边界与 P3 剩余）

> 任务：知识库全量整理与同步（L级）A阶段全量审计 · 分账本 D
> 角色：Executor（只读审计）；审计时间：2026-09-04；快照基线：Server develop@22497aa、Web develop@4b62076（两仓均无未提交变更）
> 范围：方向 §4 必查样例中的通知、三类个人流程查询、M05/M06 模板边界、P3 剩余；关联 P58 已验收能力代码定位。
> 方法：grep/find 限定 notify/bpm 相关模块；未运行编译/测试/服务；测试证据均为现有文件静态定位（类名+用途），运行时证据引用 P58 回执附件并标明快照适用性。
> 裁决边界：本账本只记录差异与建议值，不修改被审计文件、不核销、不裁决业务完成态，全部建议交 Planner 裁决。

---

## 0. 固定基线

| 项 | 值 |
|---|---|
| Server 分支/提交 | develop@22497aa（`feat(p58): 流程节点通用选人、审批意见与会签结算、分支抄送、通知SPI、开发调试认证及验证资产测试化`） |
| Web 分支/提交 | develop@4b62076（`feat(p58): 流程节点配置、审批意见与任务处理前端及开发调试认证`） |
| 未提交变更 | 无（两仓 porcelain 均为空） |
| 权威状态 | knowledge/current-status.md：功能数 41；清单 ✅34/🟦23/⬜33（90 项）；后端基线 1035/0/0/0；前端 117f/1110t/3s |

---

## 1. README / 文档索引状态声明差异

核对对象：根 README.md、Smart-WorkFlow-Server/README.md、Smart-WorkFlow-Web/README.md 中与功能状态、功能数、功能清单、知识链接相关的段落。

| 文件 | 位置 | 声明值 | 与 current-status 差异 | 建议 |
|---|---|---|---|---|
| 根 README.md | L11-18「项目能力」 | 能力描述（表单/流程/组织/通用服务/AI/IoT），无功能数、无功能清单计数 | 无数量声明，不冲突 | 无需更正 |
| 根 README.md | L24-26、L107-114「文档导航」 | 三仓职责表 + 指向 knowledge/architecture.md、knowledge/current-status.md、两侧工程宪法 | 指向有效，与当前状态一致 | 无需更正 |
| Server/README.md | 全文 | 技术栈/模块结构/启动方式；「进一步阅读」含 功能清单.md 链接（L126） | 无功能数/清单计数声明；链接有效 | 无需更正 |
| Web/README.md | 全文 | 技术栈/目录结构/开发模式；「进一步阅读」含两侧入口 | 无功能数/清单计数声明；链接有效 | 无需更正 |
| Server/功能清单.md | L119 M05 节说明行 | 「**说明**：⚠ 当前无代码落地」（且 M05 落地模块标注 sw-basic-notify） | **内部矛盾**：M05 名下第 L123-126 四行全部 ✅（F01-01/02/03、F02-01），代码实际已在 sw-basic-notify 落地（见 §2）；「当前无代码落地」为历史残留描述 | 纯描述纠正：删除或改写该 ⚠ 说明（建议值：改为「已落地：站内信收发、批量发送、消息模板（P36）」，不改变任何状态列与计数） |
| Server/功能清单.md | L27 头部 HTML 注释 | 历史计数快照（✅31/🟦25/⬜34 等，标注 minimal-business-closure 时点） | 属于历史注释而非当前状态，与 L19 当前行（✅34/🟦23/⬜33）并存 | 保留为历史追溯（对账规则 §7 追加保留）；如需可补「历史快照」字样，非必需 |

结论：三仓 README 在 2026-08-29 现状重构后不声明功能数/清单计数，无过期数值需要纠正；唯一发现的 README 系描述过期点为 Server 功能清单 M05 节「⚠ 当前无代码落地」残留。

---

## 2. 通知各子项实现定位（方向 §4 第 1 条）

### 2.1 定位表

| 能力（清单项） | 后端位置 | API 端点 | 前端位置 | SPI/真实渠道判定 | 测试证据（现有快照，未运行） | 缺口 |
|---|---|---|---|---|---|---|
| M05-F01-01 站内信发送（指定人/部门/角色）✅ | `sw-basic-notify-biz`：NotifyController.batchSend/resolveCount；NotifyMessageServiceImpl.batchSend/resolveRecipientIds（用户 findValidUserIds/部门 findActiveUserIdsByDeptIds/角色 findActiveUserIdsByRoleCodes，服务端去重、≤500 上限、零接收人拒绝、事务批量落库）；权限 `notify:batch:send`（V39 菜单 218/219） | POST /notify/messages/batch-send；POST /notify/messages/resolve-count | modules/notify/views/NotifyBatchSend.vue（菜单「发送通知」notify/batch-send）；api/index.ts | 站内信真实行为；非 SPI 渠道 | NotifyBatchSendIntegrationTest（13 用例）、NotifyBatchSendEvidenceTest（32 用例）、NotifyBatchSend.spec.ts——均为正式/受控测试资产 | 无（清单 ✅ 与代码一致） |
| M05-F01-02 接收：已读/未读/删除 ✅ | NotifyController.messages/read/delete（recipient 归属越权校验 + 逻辑删除 + TenenantLineHandler 租户隔离） | GET /notify/messages；POST /notify/messages/{id}/read；DELETE /notify/messages/{id} | NotifyHome.vue（「收件箱」notify/inbox，V38 菜单 215） | 真实行为 | NotifyControllerIntegrationTest（10 用例）、NotifyHome.spec.ts；I41/I42 已关闭记录（known-issues L61-62） | 无 |
| M05-F01-03 按状态/关键字查询 ✅ | 同一 GET /notify/messages？read=&keyword=（title/content LIKE） | 同上 | NotifyHome.vue 过滤栏（状态下拉+关键词） | 真实行为 | 同上；I42 关闭记录 | 无（无分页参数，清单未要求分页，可作观察项） |
| M05-F02-01 消息模板维护+变量占位符 ✅（P36 已核销） | NotifyTemplateController（/notify/templates CRUD+toggle+preview+previewByCode+variables+send）；TemplateRenderService `\${变量名}`；requireEnabledByCode；渲染成功方可落库（历史通知保存渲染结果）；权限 notify:template:view/manage；表 sw_notify_template（V38） | GET/POST/PUT/DELETE /notify/templates(/id)；/toggle；/preview；/{code}/preview；/variables；/send | NotifyTemplateList.vue + NotifyTemplateFormDialog.vue（「消息模板」notify/template，V38 菜单 216/217） | 真实行为 | NotifyTemplateIntegrationTest（16）、NotifyTemplateSecurityIntegrationTest（12）、NotifyTemplateList.spec.ts、router/notify-template-route-guard.evidence.spec.ts | 无 |
| M06-F01-01 通知渠道：接入与开关 ⬜（P37 待对账） | 存在部分：NotifyChannel 枚举（IN_APP/SMS/FEISHU/DINGTALK/WECHAT_WORK/WECHAT_OFFICIAL/WECHAT_MINI_PROGRAM，sw-basic-notify-api）；NotifyChannelAdapter SPI；NotifyFacade.send(NotifySendRequest) 按渠道分派并落库投递结果（未配置适配器→FAILED「未配置生产渠道适配器」并持久化）；P58DebugNotifyChannelAdapter（`@Profile("dev")` 仅 dev 装配的 SMS 隔离适配器，marker 驱动 SUCCESS/TIMEOUT/FAILED）；P58DebugNotifyController /notify/debug/send（`@Profile("dev")`） | 无真实渠道配置端点；/notify/debug/send 仅 dev | 无渠道配置页面 | **站内信=真实**；**通知 SPI=真实且有消费方**（CopyNodeDelegate/NotificationNodeDelegate/BpmNotifyListener 均经 NotifyFacade 分派，见 §2.2）；**真实厂商渠道=未接入**（无厂商 Adapter 生产实例、无账号联调，隔离/dev Adapter 仅为 P58 验收证明，符合 P58 规划边界） | NotifyFacadeAdapterIdempotencyTest（P58 Z7，幂等重放，正式测试）；P58 回执 g1-notification/e5-real-adapter（运行时证据，快照适用 P58 时点） | 渠道配置表/开关 UI/厂商渠道实现不存在 → M06-F01-01 维持 ⬜、P37 待对账口径不变 |
| M06-F02-01 通知模板（按渠道配置内容与变量）⬜（P38 待对账） | 与 M05-F02-01 同一实现（同一表 sw_notify_template + NotifyTemplateController + 渲染链路），**无渠道维度列/逻辑** | 同 /notify/templates | 同消息模板页 | 判定：与 M05 模板为**同一实现**；「按渠道配置内容与变量」的渠道维度未实现 | 同 M05-F02-01 测试 | 渠道维度缺失见 §4 |
| M06-F03-01 通知规则：触发配置/订阅 ⬜（P39 待对账） | 存在部分：内置事件触发——BpmNotifyListener（@TransactionalEventListener AFTER_COMMIT + @Async，TODO_CREATED→WF_TODO（ProcessStartService 发布）、PROCESS_APPROVED/REJECTED/RETURNED→WF_APPROVED/WF_REJECTED/WF_RETURNED（BpmTodoController.handleAction 发布））；通知节点 NotificationNodeDelegate（节点配置 channel，默认 IN_APP）；**无触发规则配置表/UI、无用户订阅设置代码**（全仓 grep 订阅/triggerConfig/trigger_rule 无业务实现） | 无规则配置端点 | 无规则/订阅页面 | 内置触发（审批事件+通知节点）=真实；配置化规则与订阅=不存在 | BpmNotifyListener 行为证据在 P58 回执 g1-notification（运行时，快照适用）；无专门单元测试类 | 规则配置/订阅缺口 → M06-F03-01 维持 ⬜、P39 待对账 |
| M06-F04-01 发送记录：状态查询/失败重发 🟦（P3 剩余） | 存在部分：sw_notify_message 已具备 channel/delivery_status/external_message_id/failure_reason/idempotency_key（V48 双方言）；NotifyFacade.send(NotifySendRequest) 每次投递均持久化状态（含 FAILED 与失败原因），幂等键防重复投递 | 无发送记录/状态查询 API（个人收件箱 GET /notify/messages 仅 read/keyword，无 delivery 维度）；无失败重发端点 | 无发送记录页面 | 落库与幂等=真实；查询、重发、全局日志=不存在 | NotifyFacadeAdapterIdempotencyTest；NotifyBatchSendEvidenceTest 副带投递断言 | 见 §5 P3 剩余 |

### 2.2 通知 SPI 消费方（证实 SPI 非休眠）

- `NotifyFacade.send(SendNotifyCommand)` 消费方：BpmNotifyListener（通知表落库）。
- `NotifyFacade.send(NotifySendRequest)` 消费方：CopyNodeDelegate（抄送节点，IN_APP+幂等键+逐人审计 CopyRecord）、NotificationNodeDelegate（通知节点，按节点 channel 配置分派）、P58DebugNotifyController（dev）。
- `NotifyChannelAdapter` 注册方：P58DebugNotifyChannelAdapter（dev profile）；生产无 Adapter 时 NotifyFacadeImpl 按「未配置生产渠道适配器」FAILED 落库。
- `NotifyTargetResolver`：接口在 sw-basic-notify-api；实现 NotifyTargetResolverImpl（sw-biz-system-biz）为**骨架占位（resolveEmail/resolvePhone 直接返回 null，含 TODO 注释）**，无消费方调用（全仓 grep 无 main 代码注入/调用）。判定：该 SPI 存在但**无真实行为、无消费方**，不属于已验收能力，也不计入 M06-F01-01 完成证明。

---

## 3. 三类个人流程查询（方向 §4 第 2 条，必查）

### 3.1 我的待办（M04-F05-01 子项）

| 维度 | 事实 |
|---|---|
| 清单声明 | M04-F05-01 待办中心 🟦（待办、已办、我发起的、抄送我的，催办提醒） |
| 已验收范围 | P58 验收覆盖审批/会签/分支/抄送/通知动作；待办查询本身属既有 M04（BpmTodoController 基线测试在 1035 正式套件内） |
| 当前实现定位 | 后端：BpmTodoController.todo → GET /workflow/tasks/todo?pageNum=&pageSize=；BpmTaskFacadeImpl.queryTodoPage/countTodo：Flowable TaskQuery `taskTenantId + taskCandidateOrAssigned(userId)`，按创建时间倒序分页。身份过滤=当前登录用户（可处理者：assigned 或 candidate，普通多人候选自然覆盖）。数据来源=Flowable 运行时任务表（ACT_RU_TASK）。状态语义=未完成任务即待办（无独立状态字段）。分页筛选=仅分页，无状态/关键字过滤。详情可达=GET /workflow/tasks/{taskId}。权限：端点仅登录校验；菜单 workflow:todo:view（V44 菜单 20）由前端路由守卫控制 |
| 前端 | router path workflow/todo → modules/workflow/views/TodoList.vue（菜单「我的待办」）；TodoList.spec.ts（12 用例） |
| 证据层级 | 单元/集成测试（BpmTodoControllerTest：todo 分页/空列表/processName 富化/完成越权等）+ 前端 spec；运行时证据=无独立运行记录（待办页本身未见 P58 抽查回执专用附件；P58 g2 浏览器证据覆盖监控/详情页，快照适用 P58 时点，不直接覆盖待办列表） |
| 剩余缺口 | 无状态/关键字过滤；催办提醒无实现；会签 ANY/ALL 早结算后其余候选人的未完成任务是否立即从待办消失无运行证据（引擎 completionCondition 语义成立，未验证） |
| 建议 | 维持 🟦（M04-F05-01 整体未完成）；待办子能力已实，缺口聚焦过滤/催办/会签结算残留验证 |

### 3.2 我的已办

| 维度 | 事实 |
|---|---|
| 清单声明 | M04-F05-01 子项（已办） |
| 已验收范围 | 无独立验收记录声明「我的已办完成」；P58 无此声明 |
| 当前实现定位 | 后端：BpmTodoController.processed → GET /workflow/tasks/processed?pageNum=&pageSize=；BpmTaskFacadeImpl.queryProcessedPage/countProcessed：Flowable HistoricTaskInstanceQuery `taskTenantId + taskAssignee(userId) + finished`，按结束时间倒序分页。身份过滤=实际处理人（HI_TASKINST.ASSIGNEE_）。数据来源=Flowable 历史任务表。状态语义=已结束任务。详情可达=按 taskId 详情（含审批历史/意见/流程图数据） |
| 前端 | router path workflow/processed → ProcessedList.vue（菜单「已办任务」，V44 菜单 21）；ProcessedList.spec.ts（12 用例） |
| 证据层级 | 单元/集成测试（BpmTodoControllerTest processed 分页/空列表）+ 前端 spec；**运行行为未独立验证** |
| 剩余缺口与风险 | ① BpmTaskFacadeImpl 自注：「本引擎版本在 create 监听器内 setAssignee 不落 HI_TASKINST.ASSIGNEE_」——DESIGNATED 指定审批人（单审批人）节点完成任务后历史任务 ASSIGNEE_ 可能为空，queryHistoryByProcessInstance 已有 approver 变量兜底（R-04），但 **queryProcessedPage/countProcessed 无兜底 → 指定审批人流程的已办可能漏单（结构风险，未运行验证，需运行时最小验证确认）**；② 普通多人候选/会签：completeAsUser 先 claim 再 complete → ASSIGNEE_ 落实际处理人，结构上归属正确（未验证运行行为）；③ 无状态/关键字过滤 |
| 建议 | 维持 🟦；已办子能力结构存在但存在 ASSIGNEE_ 兜底疑点，列入可追踪未完成项（建议值：补运行时最小验证或加 auprover 兜底后按确认范围推进），不因审批动作成功视为查询完成 |

### 3.3 我发起的

| 维度 | 事实 |
|---|---|
| 清单声明 | M04-F05-01 子项（我发起的） |
| 已验收范围 | 无「我发起的」独立验收；P58 验收不覆盖个人发起查询 |
| 当前实现定位 | **无专用「我发起的」端点与页面**。最接近：BpmInstanceController GET /workflow/instances（流程监控，V44 菜单 22 workflow:instance:view）支持可选 initiatorId 过滤，身份隔离依赖 DataScope SPI（BpmInstanceMapper：SELF→initiator_id=userId；部门三档→initiator_id IN (sys_user.dept 子查询)；无 dept_id 列等效实现）；数据来源=sw_bpm_instance（status=RUNNING/APPROVED/REJECTED/FAILED，由完成/驳回/失败路径更新）；分页筛选=status/processDefKey/initiatorId/businessKey；详情=GET /workflow/instances/{processInstanceId}（活跃节点+流转记录） |
| 前端 | ProcessInstanceList.vue（「流程监控」，发起人过滤为**用户手选**，非强制当前用户）；无「我发起的」菜单/路由/页面 |
| 证据层级 | BpmInstanceControllerTest（列表/过滤/详情）、BpmInstanceDataScopeTest（SELF/DEPT/DEPT_AND_CHILD/CUSTOM/ALL/超管短路，集成）——数据范围过滤有真实测试；运行时证据=P58 g2 浏览器 DOM 证据（监控页，快照适用 P58 时点） |
| 剩余缺口 | ① 无专用入口（菜单/页面/强制 current-user 端点）——监控页「按发起人过滤」不等于「我发起的」个人查询；② 普通用户监控页默认数据范围取决于用户 DataScope 配置（默认值未见强制 SELF），跨用户可见性由 DataScope 决定，非个人查询语义；③ 「取消候选不等于实际已办」语义无代码存在（无取消/候选归属到已办逻辑），与 Owner 2026-09-04 确认方向一致 |
| 建议 | 维持 🟦；「我发起的」入口缺失明确成立，建议值=作为独立可追踪未完成项（与 P4 个人流程查询口径一致），入口/身份过滤/验证范围由 Planner 裁决 |

### 3.4 抄送我的与催办提醒（M04-F05-01 其余子项）

- 抄送产生：CopyNodeDelegate 经 NotifyFacade 站内信发送 + NodeActionAuditServiceImpl.recordCopy 落 sw_bpm_copy_record（V49 双方言）。
- 抄送查询：**全仓无「抄送我的」查询端点/页面**（bpm controllers 无 copy 相关路由）。
- 催办提醒：**无任何代码**（重发/催办搜索无命中）。
- 建议：两子项均维持缺口，列入 M04-F05-01 🟦 的未完成范围说明。

### 3.5 P58 已验收能力代码定位（同一映射链）

| P58 能力 | 后端 | 前端 |
|---|---|---|
| 通用选人（固定用户/角色/流程表达式/适配器） | ParticipantResolverRegistry + FixedUserParticipantResolver/RoleParticipantResolver/ExpressionParticipantResolver/AdapterParticipantResolver；NodeDelegateSupport.participantContext；ApprovalTaskListener（participantConfig 统一入口/approverConfig 兼容，DesignatedApproverResolver 单审批人、UnsupportedApproverResolver） | /workflow/defs/node-capabilities（BpmProcessDefController）、/workflow/defs/approver-candidates；模块 workflow/utils/node-capabilities |
| 审批（同意/驳回/退回+意见校验+追溯） | BpmTodoController handleAction（complete/reject/return）；ApprovalOpinionValidator（受控 JS 表达式）；ApprovalActionRecord（sw_bpm_approval_action，V49）；ParticipantSnapshotRecorderImpl（sw_bpm_participant_snapshot，V49） | TaskDetail.vue（审批历史/意见表单） |
| 会签 ALL/ANY/RATIO | ConsensusNodeTranslator、ConsensusTaskListener（consensusTotal）、ConsensusCompletionEvaluator（ANY/ALL/`ceil(total*ratio/100)` 向上取整）、ConsensusCollectionResolver | 节点配置（Consensus 类型） |
| 分支 | ConditionGatewayTranslator、BpmBranchConditionEvaluator（求值失败→实例 FAILED）、sw_bpm_branch_trace（V49） | 节点配置（条件表达式） |
| 抄送 | CopyNodeTranslator、CopyNodeDelegate（去重收件人+幂等+逐人审计）、sw_bpm_copy_record（V49） | 节点配置（copy 类型） |
| 通知（审批不通过/退回/通知节点/站内信/SPI） | BpmNotifyListener（事件→站内信）、NotificationNodeDelegate（渠道节点）、NotifyFacadeImpl（渠道分派+投递落库） | 节点配置（notification 类型） |

测试证据（现有）：ConsensusCompletionEvaluatorTest（ANY/ALL/RATIO 结算单测）、ApprovalUserTaskDesignatedAssigneeTest、P57IsolatedVerificationFlowableTest（注册表/翻译器隔离）、BpmTodoControllerTest（动作+越权）、NotifyFacadeAdapterIdempotencyTest；P58 回执附件运行时证据（e3-opinion-consensus、g1-notification、g2-snapshot/browser-dom、e4-failed-instance、e5-real-adapter，快照适用 P58 时点 2026-09-03/04）。

---

## 4. M05/M06 模板边界

- 判定：**M05-F02-01 与 M06-F02-01 在代码与表结构上是同一实现**（同一 sw_notify_template 表、同一 NotifyTemplateController/NotifyTemplateService/TemplateRenderService；模板仅 title_template/content_template 与启停/归属字段，无渠道列）。
- M06-F02-01「按渠道配置内容与变量」的渠道维度在代码/表结构上**不存在**（无渠道字段、无按渠道渲染分支）。
- 建议：由 Planner 裁决—（a）确认 M06 模板与 M05 模板为同一需求、渠道维度并入 M06-F01 渠道能力；或（b）M06 渠道专属模板为独立新需求（需新 P 编号时按规则另行登记）。P38 待对账不因 M05 完成自动核销。

## 5. P3 剩余核查（发送记录状态 / 失败重发 / 全局日志）

| 子项 | 是否存在代码 | 定位与判定 |
|---|---|---|
| 发送记录状态（落库） | 部分存在 | sw_notify_message.channel/delivery_status/external_message_id/failure_reason/idempotency_key（V48）；NotifyFacadeImpl.persistDelivery 每次投递（含 FAILED 原因）落库，幂等键防重放 → **真实存在且有测试**（NotifyFacadeAdapterIdempotencyTest） |
| 发送记录查询/状态过滤 API | 不存在 | 无 delivery_status 维度的查询端点/页面；个人收件箱仅 read/keyword |
| 失败重发 | 不存在 | 无按失败状态重发端点/定时任务/UI |
| 全局日志 | 不存在 | 无通知全局日志视图；现有 NodeActionAudit（抄送/分支动作审计表）不属于发送日志 |
| 判定 | **P3 剩余三项中「落库状态+幂等」已实现，查询/重发/全局日志无代码** → 与 requirement-pool P3「◐ 部分关闭、未核销」一致，建议维持该状态，剩余部分列为可追踪未完成项 |

---

## 6. 证据层级与快照适用性说明

- 本账本所有「代码存在性/端点/身份过滤/表结构」均为本审计静态定位（grep/find/读文件），未运行任何编译/测试/服务。
- 测试证据仅引用现有测试类名与用途（正式基线 1035 快照适用 P58 时点 2026-09-04，本审计未重跑）。
- 运行时证据引用 P58 回执 attachments（g1-g3/e1-e6/f1-f3 及 Z 系列），快照适用 P58 验收时点，不构成新的运行证据。
- 「未验证（无运行证据）」的项已逐处标注（已办 ASSIGNEE_ 兜底、会签结算残留、待办页运行行为、监控页默认数据范围）。

## 7. 差异与建议汇总（供 Planner 裁决）

1. 【描述纠正】功能清单.md L119 M05 节「⚠ 当前无代码落地」删除/改写为已落地描述（不涉及状态列与计数）。
2. 【范围映射确认】M06-F01-01：站内信+通知 SPI（含消费方）已实；厂商渠道仅隔离/dev Adapter；NotifyTargetResolver 为无消费方骨架（不视为完成证明）。P37 维持待对账。
3. 【范围映射确认】M06-F02-01 与 M05-F02-01 同一实现；渠道维度缺口成立。P38 待对账。
4. 【范围映射确认】M06-F03-01 内置触发真实、配置化规则/订阅缺失。P39 待对账。
5. 【产品缺口】三类查询：待办/已办 API 与页面存在（我的待办=可处理者、我的已办=实际处理人），「我发起的」无专用入口（仅监控页可选过滤+DataScope）；抄送我的/催办提醒无实现；已办存在指定审批人 ASSIGNEE_ 落库疑点（未运行验证）。M04-F05-01 维持 🟦，各子项缺口登记为可追踪未完成。
6. 【产品缺口】P3 剩余：发送记录状态落库+幂等已实；查询/重发/全局日志无代码。P3 维持 ◐ 部分关闭未核销。
7. 【计数影响】以上全部为描述/映射/缺口确认，不改变功能数 41 与清单 ✅34/🟦23/⬜33、不改变任何明细状态列；具体终态值由 Planner 授权。