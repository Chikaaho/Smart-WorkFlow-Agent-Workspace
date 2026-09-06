# P4 阶段 A+B 实现回执（自验通过，待规划验收）

日期：2026-09-05；角色：执行；方向：`../ready/direction-p4-oa-personal-center-dual-dispatch.md`（XL）。
状态：实现与自验完成，**不自行判定 PASSED/COMPLETED，不核销 P4**。

## 1. 内部 Step 概要

| Step | 内容 | 状态 |
|---|---|---|
| S0 | 基点核对：两仓 develop 干净、源码身份与探索一致 | ✅ |
| A1 | 持久化命令队列 + 可替换 MQ 边界 + 默认消费者 + 调度生效（D1/D5） | ✅ |
| A2 | 统一命令边界：发起/审批/草稿提交经受理；旧 AFTER_COMMIT 事件路径收编删除 | ✅ |
| A3 | 四入口 API：我发起的、我的草稿 CRUD+提交、已办 D4 权威口径 | ✅ |
| A4 | 前端四入口页面/路由/菜单/契约/mock/测试 | ✅ |
| B1 | P0 专用权限 + 独立调度车道 + 同步有界等待/超时回查（D2） | ✅ |
| A5/B2 | 后端全量 mvn test、前端四连、P0 行为测试 | ✅（分层证据，见 §7 缺口） |

## 2. 后端改动（Smart-WorkFlow-aPaaS-server，develop，53 文件变更）

**新增**：
- 迁移：`bpm/{h2,postgresql}/V50__p4_command_queue_and_draft.sql`（`sw_bpm_command` 受理/队列、`sw_bpm_draft` 草稿）、`V51__p4_p0_dispatch_permission.sql`（`workflow:p0:dispatch` 按钮 seed，role_id=2，幂等）、`form/{h2,postgresql}/V52__form_trace_idempotency_key.sql`（trace 幂等键；V13→V52 因全局版本号冲突改名）。
- 队列边界：`queue/BpmCommandQueue`（投递/领取/确认/重试退避/恢复接口）、`PersistentBpmCommandQueue`（enqueue=Propagation.MANDATORY 与业务同事务；条件更新原子领取）、`CommandEnvelope`、`BpmCommandHandler`（types()+onFinalFailure）、`CommandDispatcher`（NORMAL/P0 双车道，自有 ScheduledExecutorService，不依赖 @EnableScheduling；@Value 有界重试/退避/stale 恢复可配置）。
- 命令类型与处理器：FLOW_START（幂等：businessKey 已有实例则 SKIP_DUPLICATE）、DRAFT_SUBMIT（经 FormDataSubmitFacade 幂等键落表单数据；终态失败草稿转 FAILED 保留内容）、TASK_APPROVE/REJECT/RETURN。
- 服务/控制器：`TaskActionService`（审批动作唯一执行核心，自 BpmTodoController.handleAction 收编）、`CommandAcceptService`（幂等受理，FAILED 可重新提交）、`CommandSyncWaiter`（P0 有界等待，超时≠失败）、`FlowStartPortImpl`（form-api SPI，事务内受理，无绑定 no-op）、`BpmCommandController`（受理/回查/P0 同步）、`BpmDraftController`（CRUD+submit，D3 版本校验）、`BpmMyInstanceController`、`BpmMyProcessedController`（D4：ACTION 权威 + HISTORY_COMPAT 兼容标记）。
- 表单侧：`FormSubmitService` 幂等键重载（幂等前置检查+trace 落键）、`FormDataSubmitFacade(Impl)`、`FlowStartPort` SPI。
- 实体：`BpmCommand`、`BpmDraft`、`CommandStatusEnum`、`CommandTypeEnum`、`CommandChannelEnum`、`DraftStatusEnum`；`FormTraceEntity.submitIdempotencyKey`。

**修改**：`FormSubmitService`（Step9 收编：FlowStartPort 在位则事务内受理，仅 BPM 未装配时保留历史事件兜底）；`BpmTodoController`（查询保留，动作委托 TaskActionService；旧同步 HTTP 端点保留兼容，与新异步端点共享同一服务，无双执行路径）；`ApprovalActionService(+Impl)`（pageByActor/countByActor）；删除 `FormSubmittedEventListener`（move-not-copy，全仓零引用）。

## 3. 前端改动（Smart-WorkFlow-aPaaS-Web，develop，16 文件）

新增 `MyInstances.vue`、`MyDrafts.vue`、`MyProcessed.vue`（页型 B，全局 token）及 3 个 spec；契约 `bpm.ts` 扩展（BpmDraft/CommandAccept/CommandStatus/MyProcessedItem 等）；API 层新增 myInstances/myDrafts CRUD+submit/queryCommandStatus/acceptTaskAction/myProcessed/pollCommandStatus（500ms×10 轮询，超时如实提示不伪装成功）；TodoList/TaskDetail 改走异步命令通道（UI 不变，loading 防重）；seeds 菜单 33/34/35（import.meta.glob 白名单）；handlers 11 个新 mock（含 403/400 语义、FAILED 命令种子）。旧同步 completeTask/rejectTask/returnTask 删除（grep 零残留），旧 mock 端点保留未动。

## 4. 实际验证与原始结果

- 后端全量：`MAVEN_OPTS="-Xmx2g" mvn test -o` → **BUILD SUCCESS，166 份 Surefire XML，Tests 1088 / Failures 0 / Errors 0 / Skipped 0**（基线 1035 → 1088，+53：队列/调度/处理器/受理/草稿/越权/P0 等 46+7 条新增，既有零回归）。其中 bpm-process 129、form-biz 99。
- Flyway 全链：H2 **52** 条、PG **51** 条全部成功（链测试钉值按 XL 基线推进 49→52、48→51，含升级链/终点版本断言）。
- 前端四连（执行会话本人复核复跑）：typecheck 通过、lint **0 errors / 0 warnings**、`Test Files 121 passed | 1 skipped`、`Tests 1147 passed | 3 skipped`、build 退出 0。
- P0 行为测试（B1/B2/B3 调度与权限层）：无权限 403 且不受理；有权限 P0 受理+等待 COMPLETED/FAILED 终态；超时返回 ACCEPTED+commandId（不伪装完成）；普通积压（NORMAL 领取为空）时 P0 车道独立处理（**分层证据：调度层隔离验证**）；车道领取互斥。

## 5. 验收标准对照（当前证据 vs 缺口）

| ID | 当前证据 | 缺口 |
|---|---|---|
| A1 | MyInstances 控制器/测试：强制 initiator=当前用户；越权 FORBIDDEN（含改 id 读取他人实例）；分页/筛选 | 真实浏览器操作链未跑（见 §7） |
| A2 | 草稿 CRUD 测试：保存不触发实例；非本人 403；刷新恢复=持久化行 | 同上 |
| A3 | submit 校验链测试：未选流程/绑定失效/版本不一致均拒绝且草稿保留；SUBMITTING 冻结；重复提交 duplicated=true；幂等键防重复落数据 | 发布新版本后的兼容字段保留策略仅后端提示级 |
| A4 | 既有待办测试全绿 + 异步通道改造后回归；会签/取消语义未改（沿用 P58 实现） | 运行核实项未做 |
| A5 | D4：ACTION 权威 + HISTORY_COMPAT 兼容标记；取消任务无动作不入已办（结构保证） | ASSIGNEE 漏单/取消历史可见性需运行关闭 |
| A6 | 受理-回查契约+mock；前端区分 ACCEPTED/COMPLETED/FAILED/超时 | — |
| A7 | enqueue 同事务（MANDATORY）、幂等键、SKIP_DUPLICATE、stale 恢复、有界重试（测试覆盖）；MANDATORY 无事务分支未单测 | 跨进程并发/重启注入实验未做 |
| A8 | 默认实现经 BpmCommandQueue 接口；接口含投递/确认/重试/失败/恢复语义（非空接口） | 替代 MQ 实现的契约验证测试未写 |
| B1 | P0 同步端点+权限+等待器测试（COMPLETED/FAILED/TIMEOUT 三态）；超时回查端点既有 | 真实积压下的同步端到端未跑 |
| B2 | 调度层隔离测试（分层证据）；P0 独立车道+更高频轮询 | 生产可观察积压场景未构造 |
| B3 | 无权限 403 测试；消费端仍执行 assignee/状态校验（既有 TaskActionService 测试）；排队后撤权→确定性拒绝 | — |
| B4 | 进程内实例锁+APPROVAL_ALREADY_HANDLED 沿用；幂等命中测试；线程上下文清理测试 | 跨通道真实并发注入未做 |
| C1 | 前端四连+组件测试+mock 一致性测试（菜单/端点/语义）；前后端契约同源（本回执 §2/§3） | 真实浏览器肉眼验收未执行 |
| C2 | 迁移/权限/幂等键决策均入迁移注释与代码；D3/D4/D5 实现约束见代码注释 | — |

## 6. 偏差与风险

1. **迁移版本**：form 幂等键迁移原拟 V13 与主链冲突，改为 V52（全局统一版本号）；Flyway 链测试钉值 49→52/48→51 属基线推进，已同步修改并全绿。
2. **旧同步审批 HTTP 端点保留**（兼容既有调用方/测试），新增异步命令端点；两者共享 TaskActionService，无重复执行路径。前端待办/详情已全部切异步通道。
3. **P0 同步等待在服务端轮询命令行**（draft 提交路径在事务内等待，占连接有界时间，默认 5s/100ms 可配 `sw.bpm.command.p0-wait-*`）；未做异步化。
4. `CommandDispatcher` 用自有 ScheduledExecutorService 而非 @EnableScheduling（原 @Scheduled 补偿 Job 未生效疑点仍存在，未顺手修复）。
5. 风险：`reclaimStale` 单条恢复粒度（依赖 claimed_at 条件更新，多实例下重复消费由幂等键兜底）；默认线程池容量未调优；enqueue MANDATORY 分支无单测。

## 7. 剩余缺口（建议纳入规划验收/补证范围）

- 真实浏览器肉眼验收（四入口，dev:mock 或直连后端）未执行。
- 运行验证项：调度器实际生效日志、ASSIGNEE 漏单、取消任务历史可见性、同实例双通道并发注入、消费中断恢复实验。
- 替代 MQ 实现契约验证测试（A8 后半）。

Git：未提交（方向未授权 Git 操作）。前端四连与后端全量均为本地实际执行结果。
