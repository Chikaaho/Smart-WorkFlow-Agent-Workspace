# P62 资源隔离与多租户保障 · 探索附件（原始读回明细）

执行（Executor），2026-10-02；主回执 `p62-resource-isolation-readiness-20261002.md`（订正版02，按 `…/receipts/planning-review-resource-isolation-readiness-01.md` 订正1—5 落实；§号对应本文条目）。只读探索；`R=Smart-WorkFlow-aPaaS-server`，`P=R/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process`，`Y=R/sw-bootstrap/src/main/resources`。来源：两个只读探索子代理（A/B 节；C/D 节）+ 主执行亲核（A3/A4/env-frozen/配置键清单）。原版表述见 git 历史 Workspace `6f44ca6`。

## A. 资源图证据（Q1）

| # | 事项 | 事实 | 位置 | 定性 |
|---|---|---|---|---|
| A1 | Tomcat/准入 | 无任何 `server.tomcat.*` 键（仅 `application.yml`、`application-prod.yml` 两份配置）→默认 200 | `Y/application.yml` 全文无键 | 推 |
| A1 | 受理同事务 | enqueue `@Transactional(MANDATORY)`；表单事务内 acceptFlowStart | `P/queue/PersistentBpmCommandQueue.java:41-56`；`FormSubmitService.java:534` | 静 |
| A2 | dispatcher | 自有 `ScheduledExecutorService(2)` daemon；NORMAL poll 500ms/批 20、P0 poll 100ms/批 5（`sw.bpm.command.poll-interval-millis` 等 @Value 默认，yml 未覆写）；每轮 reclaimStale(60s)+claimDue 后单线程逐条 dispatchOne；消费前身份回查 :209-226、P0 权限复查 :173-176 | `P/queue/CommandDispatcher.java:50-69,100-153,173-176,209-226` | 静 |
| A2 | 领取 SQL | 条件 SELECT(PENDING,channel IN,order by create_time,LIMIT n)+逐条条件 UPDATE(claim_token)，无 SELECT FOR UPDATE；跨租户扫描（TenantLineSuspension） | `PersistentBpmCommandQueue.java:114-149,271-284` | 静 |
| A3 | Flowable 异步 | `flowable.async-executor-activate:false`、`database-schema-update:true`；全仓无其他 asyncExecutor/jobExecutor 配置或 configurer（唯一 configurer=A5） | `Y/application.yml:99-101`；`BpmEngineAutoConfiguration.java:155-173` | 配置键存在 |
| A3 | TXN_ACTION 异步 | `task.setAsynchronous(true)` | `P/…/translator/TxnActionNodeTranslator.java:81` | 静 |
| A3 | Harness 激活 | `props.put("flowable.async-executor-activate","true")`、`async.executor.core-pool-size=8`、`max-pool-size=8`、`async-job-lock-time-in-millis=60000`（r04/r05 测量与 E2E 全部经此装配） | `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p62/P62BudgetMeasurementPgTest.java:175-178`；`P62DefToInventoryChainPgTest.java:106` | 验（证据运行时） |
| A3 | 启用风险层级（复核01 订正4） | 配置 OFF+动作节点异步+测量显式 ON 形成**启用风险**；未证明现有生产服务已失效。核验须在获授权隔离环境进行（有效配置与消费者可用性），能力启用前提供明确检查与拒绝语义；不以停止现服务方式核实 | planning-review-resource-isolation-readiness-01.md §必须订正4 | 复核限定 |
| A4 | Druid 默认 | dynamic-datasource+Druid（非 Hikari）：`initial-size:5,min-idle:5,max-active:20,max-wait:60000`；prod 覆盖 `max-active:5,initial-size:2,min-idle:1` | `Y/application.yml:41-45`；`Y/application-prod.yml:21-24` | 配置键存在 |
| A4 | 测量生效值 | env-frozen：`druidMaxActive(actual)=64`、`hikariMaxPool(stale-key,ineffective)=null`、`dispatcherPollMillis=100`、`dispatcherBatchSize=50`、`flowableAsyncCorePool=8`、heapMaxMiB=2048、cores=8、pgVersion=PostgreSQL 17.5（zonky）；Harness 设 `druid.initial-size=10,min-idle=10,max-active=64,max-wait=10000` 并注明"旧键 hikari.maximum-pool-size 无效——maxActive=5 导致 16 并发连接饥饿（10s 超时）"；失败轮 env-frozen：druid5 轮 formalSamples=2578/TIMEOUT=16/FAIL、poolstarve 轮（池32）9726/TIMEOUT=31/FAIL | `product/p62-lowcode-transaction-bpm-tiering/receipts/evidence/tiered-execution-03/p62exec03r04/g1b/env-frozen.txt`、`g1/env-frozen.txt`、`g1-failed-r04-druid5/{env-frozen.txt,light-process-acceptance-report.txt}`、`g1-failed-r04-poolstarve/…`；`P62BudgetMeasurementPgTest.java:162-168,212-214` | 验 |
| A5 | 引擎绑定 | 引擎显式绑定应用 DataSource+应用 PlatformTransactionManager（单一提交边界，G3a）；生产代码无 `@DS` | `BpmEngineAutoConfiguration.java:142-173` | 静 |
| A6 | 其他池 | `@EnableAsync`+`@EnableScheduling` 在 FormAutoConfiguration，无自定义 Executor、无 TaskDecorator、无 `spring.task.*` 键→@Async=Boot 默认池、@Scheduled 默认单线程调度池；@Scheduled：TieredCommandReconcileJob 60s/limit200、TaskDeadlineScheduler fixedDelay60s/LIMIT50、BpmInstanceStateSyncJob 60s/200、IoT CommandCompensationJob 300s/50、ProcessTriggerRecoveryJob 60s/50、NotifyDeliveryRecovery 60s/100、TxnReservationExpiryJob 60s/100、OpenApiCallbackRecoveryJob 60s/50；Quartz starter+RAMJobStore（JobStartupRunner 注释），`sw.job.pool-size:10` 未见接线使用；fe7fc8c=PersistentBpmCommandQueue/TieredCommandReconcileJob 调度线程 TenantLineSuspension 挂起修复 | `form/config/FormAutoConfiguration.java:21-22`；各 Job 类 @Scheduled 行；`sw-basic-job/.../JobProperties.java:20`、`JobStartupRunner.java:17`；`git show fe7fc8c` | 静+推 |
| A7 | 锁/唯一键 | `uk_sw_bpm_command_key(tenant_id,command_key)` V0.1.0:2410；`uk_sw_bpm_command_logical(tenant_id,logical_command_id)` V0.1.2:15；批次 `uk_sw_bpm_command_batch_key` V0.1.3:25、batch_item V0.1.3:48；`idx(status,channel,next_retry_at)` V0.1.0 支撑领取；动态宽表父行=SELECT FOR UPDATE+JVM `ReentrantLock(tenant|table|recordId)` | `Y/db/migration/postgresql/V0.1.0__baseline_seed.sql:2410`、`V0.1.2__tiered_command_semantics.sql:15`、`V0.1.3__batch_command.sql:25,48`；`DynamicTableSql.java:296-350` | 静 |
| A7 | REQUIRES_NEW | recordRejected 独立短事务（占第二连接；仅拒绝/审计可用） | `sw-biz-form-biz/.../txn/service/TxnActionTxOperations.java:456-465` | 静 |
| A8 | 全部配置键 | `sw.bpm.command.{backoff-millis,batch-size,max-retries,p0-batch-size,p0-poll-interval-millis,p0-wait-poll-millis,p0-wait-timeout-millis,poll-interval-millis,reconcile-initial-delay-millis,reconcile-interval-millis,stale-seconds}`、`sw.bpm.enabled`、`sw.bpm.txn-batch.enabled`、`sw.bpm.instance.state-sync-{initial-delay,interval}-millis`（@Value/Conditional 默认值，yml 零覆写） | 全仓 grep `sw\.bpm\.` 唯一集合 | 配置键存在 |

## B. 积压与反压证据（Q2）

| # | 事项 | 事实 | 位置 | 定性 |
|---|---|---|---|---|
| B1 | 列清单 | sw_bpm_command 基线列：command_key/command_type/channel(默认NORMAL)/status(默认PENDING)/payload/result/failure_reason/retry_count/next_retry_at/claimed_at/finished_at/initiator_id+tenant_id（V0.1.0:2400-2417）；V0.1.2 增 logical_command_id/payload_fingerprint/tier/completion_point/**deadline_at**/overdue_at；V0.1.3 批次表 batch(+item: status/invocation_id/error_code/attempt_count) | `V0.1.0__baseline_seed.sql:2400-2417`；`V0.1.2__tiered_command_semantics.sql:6-16`；`V0.1.3__batch_command.sql:6,29` | 验 |
| B1 | 截止语义 | deadline_at 1-300s（默认30s）受理冻结；到期且无效果行→EXPIRED（expireDue 每轮 LIMIT 200）；PROCESSING 超期只记 overdue_at 不判失败 | `PersistentBpmCommandQueue.java:39-41,314-378` | 静 |
| B2 | r04 报告 | accepted=62100、validPairs=22666、succeededPairs=22666、incomplete=39434、pairP50=541325ms、outcomes={ACCEPTED=62100}——仅计数无状态分布；pairP50 为限定行时差口径，不能单独归为纯排队等待 | `…/p62exec03r04/g1b/light-process-acceptance-pairs.txt:1`、`light-process-acceptance-report.txt:1`；复核01 §订正1 | 验 |
| B2 | 归因撤回（复核01 订正1） | 原"默认配置 ~40/s→多数未完成仍 PENDING"推断**撤回**：该轮 env-frozen 实际 dispatcherPollMillis=100/batch=50/druidMaxActive=64，默认配置估算不适用本次运行；批量/间隔不等于实测消费吞吐。未完成构成与瓶颈归因=**未知**，待获授权受控轮 `GROUP BY status,channel,tenant_id`；pairs.txt 只证明 accepted/succeeded/incomplete 计数与限定行时差/可见探针，不证明全部未完成是命令队列等待 | planning-review-resource-isolation-readiness-01.md §必须订正1；本表 §A4 env-frozen | 撤回/待核实 |
| B3 | 无反压 | 全仓 queueDepth/backpressure/backlog/reject-by-depth 0 命中；enqueue 无条件 save | `PersistentBpmCommandQueue.java:52-69`；grep 0 命中 | 验（未找到） |
| B3 | 限制接缝 | enqueue 内 `commandService.save`（:64）之前抛错→仅回滚本次受理（MANDATORY 同调用方事务），已提交受理行不受影响；唯一键 uk+`FlowStartPortImpl.java:73` findByKey 去重 | `PersistentBpmCommandQueue.java:52-64` | 静 |
| B3 | 同步等待 | P0 有界等待默认 5000ms/轮询 100ms | `CommandSyncWaiter.java:31-35` | 静 |

## C. 等级/租户覆盖证据（Q3）

| # | 事项 | 事实 | 位置 | 定性 |
|---|---|---|---|---|
| C1 | P0 入口 | 审批动作受理 channel=P0 需 `workflow:p0:dispatch`；有界等待 5s | `P/controller/BpmCommandController.java:88,113` | 静 |
| C1 | P0 容量实质 | "独立容量"=独立领取过滤（channel='P0' 批5/100ms）+消费前权限复查；与 NORMAL 共用同一 2 线程调度池、同一 Druid 池 | `CommandDispatcher.java:102-110,140-153,173-176` | 静 |
| C1 | NORMAL 公平性 | 仅 `order by create_time asc` FIFO，无租户/优先级加权 | `PersistentBpmCommandQueue.java:127` | 静 |
| C2 | 租户语义 | 领取/回收/对账跨租户（TenantLineSuspension）；信封 tenant_id 承载+消费前身份回查；NodeFunctionService=tenant 0 全局+本租户 | `PersistentBpmCommandQueue.java:111-116`；`CommandDispatcher.java:209-226`；`NodeFunctionService.java:291-297` | 静 |
| C2 | 批量 | BATCH_INVOKE 受理与调用方同事务、逐项异步独立事务，租户随信封还原 | `TxnBatchServiceImpl.java:39,139` | 静 |
| C3 | 共享清单 | 单租户突发共享：2 线程 dispatcher、同一 Druid 池（prod max5）、同一 sw_bpm_command 行竞争、同一 act_ru_job、同一 Boot @Async 池、同一 Quartz 池、同一 Tomcat 池；OA 读（BpmTodoController:99、menus）与命令消费同池；grep semaphore/bulkhead/rate-limit/quota 0 命中 | 见 A 节各行；grep 0 命中 | 静 |
| C3 | OA 实测（复核01 订正3 区分窗口） | r05 **summary 窗口**：tenant0 1,272/tenant100 1,273 请求零失败、p99=559.0/552.3ms、todoTotal=1——该窗口**含正式压力段前请求**（OA 起点 12:31:29 vs 压力正式起点 12:31:59）；**正式压力窗口锁定 1,128/1,131（复核07）**；summary 值不转录为正式压力窗口 P99。有限观测不证明单租户突发/保留容量/不饥饿合同成立 | `…/p62exec03r05/g2b/oa-business-summary.txt`；复核01 §订正3；复核07 | 验（观测）+复核限定 |
| C4 | 缺失项 | 每租户配额、公平调度、NORMAL 内优先级、准入限流、租户级并发上限：业务代码与 yml 均 0 命中；唯一独立池=`sw.external-datasource.pool`（外部数据源只读仓库） | grep 0 命中；`application.yml:169-179` | 静（不存在） |

## D. 指标与入口证据（Q4）

| # | 事项 | 事实 | 位置 | 定性 |
|---|---|---|---|---|
| D1 | Actuator | 依赖仅 sw-bootstrap/pom.xml:118；`management.endpoints.web.exposure.include: health`、`show-details: never`、`metrics.tags.application` 有；主代码 MeterRegistry/@Timed/Counter/Timer 0 命中 | `Y/application.yml:258-268`；grep 0 命中 | 验 |
| D1 | 日志 | AccessLoggingFilter：`ACCESS method path status costMs eventRef clientRequestId userId`；[P62-EV] 仅测试源码（TxnActionFlowH2Test 等），main 0 命中 | `sw-framework/sw-security/.../filter/AccessLoggingFilter.java:45`；grep | 验 |
| D2 | 命令端点 | 仅 `POST /workflow/commands/tasks/{taskId}/{action}`（受理，P0 需权限）与 `GET /workflow/commands/{commandId}`（单条、仅受理人本人、含 flowStart 视图）；无按状态/租户/通道列表端点 | `BpmCommandController.java:40,67,118-143` | 验 |
| D2 | 批量端点/页面 | `POST /workflow/txn-batch`、`GET /workflow/txn-batch/{batchKey}`（status/totalCount/succeededCount/failedCount/逐项 status+invocationId+error）；Web TxnBatchConsole 菜单 9105（R__p62_txn_batch_menu.sql:7） | `TxnBatchController.java:24,34,41`、`TxnBatchView.java:13-45` | 验 |
| D2 | 监控 | `/workflow/monitor/analytics/summary` 为实例分析非命令积压；设备命令专用公开回查 GET 端点未找到（BPM 关联回查经命令 flowStart 视图） | `BpmMonitorController.java:96` | 验/未找到 |
| D3 | 关联链 | sw_form_trace.record_id（FormSubmitService Step8）→command_key=`FLOW_START:{recordId}`（FlowStartPortImpl:60）→命令行（tenant_id/channel/tier/claimed_at/finished_at/deadline_at）→sw_bpm_command_effect（result_json/biz_ref）→invocationKey=`NODE:{instanceId}:{nodeId}`（FormTxnActionPortImpl:54）→invocation（actionId/actionVersion/bizRecordId/duration_ms）→目标表行；action_version 在 invocation 与 batch_item 可关联 | 各类如左 | 静 |
| D3 | 时间戳缺口 | duration_ms 有（TxnInvocationEntity:49）；受理→领取→执行可由命令三时间戳支撑；目标业务行时刻只在其目标表；stale 回收不写专用时间戳（status→PENDING、claim_token=null）；update_time 自动填充器未见 | `TxnInvocationEntity.java:49`；`PersistentBpmCommandQueue.java:271-284` | 静 |
| D4 | 错误落点 | 1600-1613=FormErrorCode.java:85-98→sw_form_txn_invocation.error_code/batch_item.error_code；2305=APPROVAL_ALREADY_HANDLED、2426=COMMAND_PAYLOAD_MISMATCH（BpmErrorCode.java:57,100）→命令 failure_reason/响应体，无独立审计表 | 同左 | 静 |
| D4 | 恢复耗时 | 服务端仅事后近似：单命令 claimed_at→finished_at 差值、effect create_time、act_ru_job lock_exp_time；46.478s/26.8s 为 Harness 侧测量（g2a/g3a 证据） | `PersistentBpmCommandQueue.java:271-284`；r04 `g3a-window/*` | 验+推 |

## E. 环境与负载合同证据（Q5）

| # | 事项 | 事实 | 位置 | 定性 |
|---|---|---|---|---|
| E1 | 环境不变式 | M1 8核/8GiB（hw.memsize=8589934592，r04 `g7b/env-memory-facts.txt`）/macOS/JDK 21.0.11/Maven 3.8.6（`MAVEN_OPTS=-Xmx2g`）；测量=zonky 内嵌 PG 17.5（env-frozen pgVersion），本地另有 Homebrew PG 16.15；Redis 7.2.5；heapMaxMiB=2048（env-frozen） | r04 env-frozen 各件；`g7b/env-memory-facts.txt` | 验 |
| E1 | 证据分层（复核01 订正2） | **阶段通过值（复核07 保留，探索不重开）**=固定合规负载实时 76,785 p99=112.637083ms≤300ms 零拒绝零超时、轻流程持久受理 62,100 p99=147.877333ms≤2000ms（r04 合规 16 并发、两租户各8、热点10%、各1000对象、300s）。**OBSERVATION-ONLY（非生产 SLA）**=压力 64 并发（两租户各32、各10k 对象、50% 热点）：r04 72,232/rejected 29,465(40.79%) p99=562.4ms、r05 63,984/rejected 24,649(38.52%) p99=696.3ms、OA 画像（§C3）、恢复 100 条 46.478s 零重复（Harness 测量，r03 G2a）。300ms/2s 预算未调低；高负载画像不证明生产 SLA | `…/p62exec03r04/g1/*report.txt`、`g2b/stress-boundary-report.txt`、`…/p62exec03r05/g2b/*`；复核01 §订正2 | 验+复核限定 |
| E2 | 未知项 | ①39,434 终态分布（测量库随进程销毁不可再读；需新受控轮一条 `SELECT status,count(*) … GROUP BY status,channel,tenant_id`）②8 分钟外长时排干行为③prod Druid max-active=5 下整链真实吞吐④`async-executor-activate:false` 生产语义（当前生产/UAT 未启用分级负载；轻流程异步消费在默认配置下无执行器）⑤多小时稳定性⑥Tomcat/@Scheduled/Quartz 默认值运行核验、`sw.job.pool-size` 接线 | 本表与 A3/A4 | 待核实 |

## F. 兼容与回退证据（Q6）

| # | 事项 | 事实 | 位置 | 定性 |
|---|---|---|---|---|
| F1 | 在途冻结先例 | 动作版本受理冻结（`TxnActionTxOperations.requireFrozenVersion`）；停用后消费按冻结版本结算 SUCCEEDED、新调用被拒（r04 G3b）；payload_fingerprint 受理冻结+同键异载荷 2426 明确拒绝+旧行缺指纹按 payload 原文回推兼容（r07 G3b1）；deadline_at 受理冻结（§B1）——新增资源策略对已受理对象的同构模式=受理时点冻结 | 首阶段 V0.1.1；r04/r07 证据 | 验 |
| F2 | 默认关闭传播 | `sw.bpm.txn-batch.enabled`：`@ConditionalOnProperty(havingValue="true", matchIfMissing=false)`（BatchInvokeCommandHandler:42-43）+`@Value("${sw.bpm.txn-batch.enabled:false}")`（TxnBatchServiceImpl:64）→默认关闭；`sw.bpm.enabled` 门控 form→bpm 装配（fail-fast）；G5a 能力开关默认关+三阶段消费者隔离演练先例（Server `194193a`）；0.1.3 已发布不含分级执行能力、两仓 README/CHANGELOG 无该描述 | 代码行如左；r03 G5a | 静+验 |
| F3 | 必锁边界 | P4 NORMAL/P0 双通道共享业务校验/幂等/结果契约、P0 专用权限+有界等待（`CommandChannelEnum`；`CommandDispatcher:56-60,125-134`）；旧二进制 `CommandTypeEnum.of` 未知 code 抛错（错误码 1600-1613）；REQUIRES_NEW 仅拒绝/审计（成功记录必须同事务，§A7）；BATCH_INVOKE 逐项独立事务/持久结果/幂等重放（S3，`e4d58c8`）；设备回执超时→UNKNOWN 禁自动重发+HMAC 回执守卫+最小权限 `iot:command:verify` 人工核实（S4，`fabf7a7`）；回退边界=只停新受理、保留结果、向前修复，不降级重放（阶段方向） | 各提交与回执；附表 C1（20260930 探索） | 验+静 |
| F4 | 方案利弊（事实层） | A 仅调既有键（`sw.bpm.command.*`+Druid 池）：零代码、即时可逆；但无租户公平/配额语义，且 prod max-active=5 是最先饥饿点，调大影响全部模块共享池。B enqueue 前计量+准入拒绝：在 §B3 接缝处按（租户,通道）计数拒绝，REJECTED/错误码可审计、已受理不受影响；需新增错误码、统计端点、默认关闭键与权限/审计。C 扩展 P0 弔道（按租户或等级加领取车道）：复用 CommandDispatcher 车道模式；但仅线程级隔离，不解决同一 Druid 池/同一 PG 共享。三者可组合；最终产品决策归 Planner | 本表 B3/C1/C4 | 静 |

## 核对说明

- 唯一索引口径：本轮静态确认 sw_bpm_command 命名唯一键 2 个（uk_key/uk_logical）+批次表 2 个；20260930 探索附表 A 曾记"六唯一索引（baseline:2378/2410/2442-2443/2484-2489 等）"，未逐条复核，旧口径待核实（主回执已标注）。
- r04 证据 91/91、r05 32/32 哈希清单既有锁定，本探索未改动任何证据文件。
