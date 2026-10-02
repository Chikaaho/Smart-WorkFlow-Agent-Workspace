# P62 资源隔离与多租户保障 · 限定探索（回执）

执行（Executor），2026-10-02；入口 `search_task/p62-resource-isolation-readiness-20261002.md`。只读：未改代码/迁移、未构建/测试/压测/部署、未起停服务。定性：〔验〕既有证据实际值／〔静〕静态读码／〔推〕推断／〔核〕待运行核验。传播已先行完成（Workspace `0d4c7ad`、Server `677d551`；逐字段回读见 P62 receipts/`terminal-sync-tiered-execution-unified-command-01-final-confirmation-appendix.md`）。**全部 path:line 证据在附件 `p62-resource-isolation-readiness-20261002-details.md`（下称附件§号）（正文实测 6.4KB，超出 5KB 目标：六问逐项事实按任务结构保留于正文，全部原始 path:line 读回在附件）。**

## 结论

六问均可回答。真实接缝=**单进程、单 Druid 池、单 PG 库全共享；现有"隔离"只有车道级**（P0 领取优先+有界等待），无租户配额/公平/准入反压。r04/r05 基线的资源合同是 Harness 显式覆写（Druid maxActive=64、异步执行器 ON×8、dispatcher 100ms×50），与默认配置（Druid 20/prod **5**、执行器 **OFF**、500ms×20）差异巨大；默认配置下轻流程异步节点无人消费〔静+核〕。积压可在 sw_bpm_command 单表按 status/retry/deadline SQL 区分（deadline_at/EXPIRED 已存在），但无查询端点与业务指标（Actuator 仅 health、主代码 0 Meter）。产品决策归 Planner。

## 六问要点

- **Q1 资源图**：受理 enqueue=MANDATORY 同事务；消费=dispatcher 自有 2 线程池（NORMAL 500ms×20/P0 100ms×5，代码默认）单线程逐条 dispatchOne，领取=条件 UPDATE 无 FOR UPDATE、跨租户扫描〔静；§A1-A2〕。`async-executor-activate` 默认 false 而 TXN_ACTION 节点异步→**默认配置 act_ru_job 无人消费**，r04/r05 轻流程证据全来自 Harness 激活（ON、8 线程、锁60s）〔静+核；§A3〕。连接池=**Druid 非 Hikari**（yml 20/prod **5**，测量运行实际 **64**；池=5 曾连接饥饿）〔验+静；§A4〕；引擎与业务同一 DataSource/事务管理器〔§A5〕；@Async/@Scheduled/Quartz 均默认池、`sw.job.pool-size` 未接线〔推/静；§A6〕；锁=命令唯一键/宽表父行 FOR UPDATE+JVM 锁/REQUIRES_NEW 拒绝记录占第二连接〔§A7〕。
- **Q2 积压**：单表 SQL 可区分 等待/失败待重试/执行中/疑似卡死(stale 60s)/FAILED/EXPIRED，**deadline_at(默认30s 受理冻结)与 EXPIRED 已存在**〔静；§B1〕；39,434=报告无状态分布、pairP50≈541s 即排队等待、单车道 ~40/s vs 受理 207/s（8min≈22,666 吻合）→推断多数仍 PENDING〔验+推；§B2〕；不丢已受理对象的限制接缝=enqueue 内 save 之前（抛错仅回滚本次受理），现无任何队列深度/反压逻辑〔静；§B3〕。
- **Q3 覆盖**：P0=专用权限+领取优先+消费前权限复查+5s 有界等待，**无线程/连接/表隔离**；NORMAL=全局 FIFO〔静；§C1〕；租户仅信封承载+消费前身份回查，配额/并发上限/公平调度不存在〔静；§C2〕；单租户突发与 OA 读共享 Tomcat+Druid 池、无舱壁（r05 实测 64 并发 50% 热点下 OA 业务读零失败 p99≈559ms，OBSERVATION-ONLY）〔验；§C3〕；可调既有键=`sw.bpm.command.*` 11 键+Druid 池（prod 5 最紧、影响全模块），缺=租户配额/公平/优先级/准入/审计；独立线程≠DB/CPU 隔离（唯一独立池=外部数据源池）〔静；§C4〕。
- **Q4 指标与入口**：Actuator 仅 health、主代码 0 Meter=无业务指标〔静；§D1〕；真实入口=命令单条 GET（仅受理人本人）、批量 GET txn-batch/{batchKey}（Web TxnBatchConsole 菜单9105）、监控 analytics=实例维度，**无积压统计/列表端点**〔静；§D2〕；关联链 trace.record_id→FLOW_START:{recordId}→命令行(tenant/channel/tier/时间戳/deadline_at)→effect→invocation(action_version、duration_ms)→目标行可串，缺口=目标表时刻/stale 回收时间戳/恢复专用字段；最小缺口（复用现有列）=积压聚合端点、命令列表端点、Micrometer 五段计量、恢复字段〔静；§D3-D4〕。
- **Q5 负载合同**：环境不变式 8核/8GiB/JDK21.0.11/heap2048MiB/单进程/zonky PG17.5〔验〕；已支撑（OBSERVATION-ONLY、不调低已过预算）=16 并发热点10% 实时 p99=112.6ms≤300ms、受理 p99=147.9ms≤2s、64 并发 50% 热点拒绝 38.5-40.8% 且 p99 562-696ms、OA 零失败、恢复 100 条 46.478s 零重复，吞吐依赖 Harness 覆写合同〔验；§E1〕；未知待小型探索=8 分钟外排干、39,434 终态分布、prod 池5 真实吞吐、async OFF 生产语义、多小时稳定性〔§E2〕。
- **Q6 兼容回退**：在途冻结先例=动作版本/停用结算/payload_fingerprint(2426+旧行回推)/deadline_at 均受理时点冻结〔验；§F1〕；默认关闭=`sw.bpm.txn-batch.enabled` false+`sw.bpm.enabled` 门控+G5a 消费者隔离先例，0.1.3 不含分级能力〔静+验；§F2〕；锁定边界=P4/P0 双通道契约、旧二进制 CommandTypeEnum.of 抛错、REQUIRES_NEW 仅拒绝/审计、BATCH_INVOKE 逐项独立事务+幂等重放、设备 UNKNOWN 禁自动重发+HMAC 守卫+`iot:command:verify` 人工核实、回退=只停新受理保留结果向前修复不降级重放〔验+静；§F3〕；方案利弊（决策归 Planner）=A 调既有键（零代码但无公平且 prod 池5 先饥饿）/B enqueue 前计量+准入拒绝（可审计不丢已受理、需新错误码/端点/默认关）/C 扩 P0 式车道（线程级不解决 DB 共享）〔§F4〕。

## 未知与最小补核

①39,434 状态分布一条 SQL（新受控轮）；②async OFF 生产语义；③Tomcat/@Scheduled/Quartz 默认值运行核验；④`sw.job.pool-size` 接线；⑤prod Druid=5 下命令链可用性（风险登记）；⑥旧探索"六唯一索引"口径未逐条复核（本轮静态确认 4 个命名唯一键）。

## 受影响信息入口实际值

传播批次已同步 knowledge 两入口/Server 功能清单/memory/todo/requirement-pool/decisions 注记：两阶段 COMPLETED（规划已确认，2026-10-02）、passed 路径、唯一下一动作。本探索回传后当前唯一下一动作=**Planner 读取本回执并制定资源保障阶段方向（R06/R10、A06/A07/A12）**（本批次对下一动作字段机械二次同步）。功能 45、清单 46/22/22、ADV64、问题 57、P62 PLANNING 未核销、0.1.3 Owner已验收不变。
