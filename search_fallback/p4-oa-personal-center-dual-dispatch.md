# P4 OA 个人中心与流程双通道现状探索回执

只读静态探索回执（2026-09-05，develop 代码，未运行服务/测试，无运行证据）。引擎=Flowable+自研 Facade。

## ① 状态核对

P59 COMPLETED（已确认 2026-09-05）、功能 41、清单 34/28/28、无活动功能（current-status.md），与规划摘要无差异。选题=requirement-pool §P4 补充需求（四入口+双通道，暂按 XL）；历史"等待新需求"为完成时点快照，不冲突。

## ② 四入口现状

- **待办**：已有。`GET /workflow/tasks/todo`（BpmTodoController L143）→ BpmTaskFacadeImpl L45 `taskCandidateOrAssigned`（ASSIGNEE+CANDIDATE 双覆盖）。缺口：列表行为、会签结算消失、取消语义未运行验证；Owner 判定整体未完成。
- **已办**：已有。`GET /workflow/tasks/processed`（同 Controller L633）→ 历史查询 `taskAssignee().finished()`（Facade L254-273）；处理人写 ACT_HI_TASKINST.ASSIGNEE_（completeAsUser claim 写入）。ASSIGNEE 漏单疑点：静态仅证明"查询只按 ASSIGNEE 过滤"，是否存在 completed 未写 assignee 路径需运行验证。取消走 deleteProcessInstance（Facade L159），其任务是否入 finished 历史取决于 HistoryLevel——未验证。`sw_bpm_approval_action`（uk tenant+task+actor，V49）可作真实办理锚点。
- **我发起的**：数据具备（`sw_bpm_instance.initiator_id`，bpm/V8，注释明示用途）；仅有监控端 `GET /workflow/instances`（initiatorId 过滤），无"当前用户=发起人"个人端点。缺口：专用个人接口/页面。
- **我的草稿**：业务发起草稿**不存在**（无表/实体/接口/迁移，已 grep）。现有草稿仅为表单定义 `sw_form_def` DRAFT、流程定义 `sw_bpm_process_def` DRAFT（设计态）。

## ③ 草稿生命周期

无业务草稿持久化；表单提交直接落动态宽表+`sw_form_trace`（form/V7），无暂存态。可复用接缝：`sw_form_def/sw_form_snapshot` 版本发布语义、trace.submit_user_id、前端 FormRender submitting 防重。待裁决：草稿版本绑定方式、发布/停用/校验失败处理、失败恢复与幂等——新契约决策，探索不擅定。

## ④ 发起与流转路径

唯一发起链：`POST /form/data/{formKey}` → FormSubmitService.submitForm（@Transactional，宽表+trace，事务内发 FormSubmittedEvent）→ FormSubmittedEventListener（@Async+AFTER_COMMIT，手动还原 LoginUserHolder）→ 唯一服务 ProcessStartService.start（@Transactional）→ BpmRuntimeFacade.startProcess（Flowable）→ 写 `sw_bpm_instance` → BpmNotifyEvent(TODO_CREATED)。表单与发起事务**独立**（ProcessStartService L48 注释明示），发起失败不回滚表单；通知/IoT 副作用均 AFTER_COMMIT 异步。流转 complete/reject/return 全同步 @Transactional（handleAction，越权校验 L210）；会签结算 ConsensusCompletionEvaluator+participant_snapshot.settle()。未发现绕过 ProcessStartService 的生产发起路径（main grep，测试除外）。本质：同步 HTTP+进程内事件副作用，**非可靠异步通道**。

## ⑤ 消息与队列基础

DomainEventPublisher=ApplicationEventPublisher 薄封装：进程内、无持久化、**无 outbox**；AFTER_COMMIT 事件重启即丢，无重试/失败记录。@Async 默认池；**全仓无 @EnableScheduling**（已复核），IoT CommandCompensationJob（@Scheduled）是否实际运行存疑。无任何 MQ 依赖/配置（已复核）。持久队列最近样本：IoT `sw_iot_device_command`（QUEUED/FAILED/滞留+补偿）、Quartz `sw_job_info/sw_job_log`（V17）、通知 `sw_notify_message`（V48 加 idempotency_key/delivery_status/failure_reason，bizId 幂等）。幂等/并发：approval_action uk(tenant,task,actor)；Facade 进程内实例锁+乐观锁重试+2305 已处理码——**仅单 JVM**；无通用受理标识/超时回查（instance.process_instance_id 可作锚点）。

## ⑥ 双通道与 P0 约束

异步受理-回查：无现成接缝；最近样本=IoT 命令（commandId 受理+回查+失败记录）。不引入 Broker 需"受理表+进程内消费+补偿"等新机制，**不能默认可行**，属方向决策。同步单次命令：现有 complete/reject/return 同步事务即蓝本；缺请求标识幂等与超时回查（现靠前端 businessKey 轮询约 5s）。P0：无优先级字段、独立工作池、资源隔离、调用方分级权限（仅 RBAC）；**P0 授权模型不存在，属新契约决策**，不得客户端自报提权。共享约束：LoginUserHolder ThreadLocal（异步线程手动还原）；TenantLineHandler 租户拦截（动态宽表需手动写 tenant_id）；同实例顺序仅进程内锁。

## ⑦ 前端现状

路由：workflow/todo（TodoList）、workflow/processed（ProcessedList）、workflow/instances（监控，无发起人过滤 UI）、workflow/task/:taskId（详情）；发起=FormRender 提交，无独立发起页。无"我发起的/我的草稿"入口；无 P0/受理标识痕迹。API src/modules/workflow/api/index.ts、契约 src/contracts/bpm*.ts；MSW 覆盖 todo/processed/instances/defs/complete/reject，**return 无 mock handler**。

## ⑧ 影响范围与最小待决策

范围：后端 sw-bpm-process/engine、sw-biz-form、新增草稿/受理迁移（Flyway 现 V49）；契约 /workflow/tasks|instances、表单提交事件链；前端 workflow/form 页面、契约、MSW。新增行为验收（推断）：四入口查询、草稿幂等、异步受理-回查、取消任务不伪入已办、P0 越权拒绝。最小待决策：1) 异步通道默认形态（受理表+进程内消费 vs MQ 接口抽象）；2) P0 调用方授权模型；3) 草稿版本绑定及失效策略；4) 已办权威口径（Flowable 历史 vs approval_action，涉取消语义）。

标注：未标"未验证"者为静态事实；未验证项=ASSIGNEE 漏单运行行为、取消任务历史可见性、@Scheduled 实际生效、线程池容量、mock 穷尽性。无工具错误（一轮 grep 失败已重试）。
