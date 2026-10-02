# P62 资源隔离与多租户保障 · 限定探索（回执·订正版02）

执行（Executor），2026-10-02；入口 `search_task/p62-resource-isolation-readiness-20261002.md`。只读：未改代码、未构建/测试/压测/部署。**按规划复核01订正**（P62 receipts/`planning-review-resource-isolation-readiness-01.md`）；原版见 git 历史（`6f44ca6`）。全部 path:line 证据与逐条定性（验/静/核）在附件 `p62-resource-isolation-readiness-20261002-details.md`（下称附件§号）。

## 结论

六问经复核01 采信为规划输入（不证明资源保障已实现或 A07 通过）。接缝=单进程、共享 Druid 池与 PG 库；P0 独立领取车道而非完整资源隔离；缺租户配额/公平/上限。测量运行合同=Harness 覆写（Druid 64、执行器 ON×8、dispatcher 100ms×50，env-frozen）；默认配置（Druid 20/prod 5、执行器 OFF）为配置事实，运行生效与整链可用性待隔离环境核验。积压可按 sw_bpm_command 单表 status/retry/deadline SQL 区分（deadline_at/EXPIRED 在）；39,434 无状态分布、归因未知。产品决策归 Planner。

## 六问要点

- **Q1**：受理 enqueue=MANDATORY 同事务；消费=dispatcher 2 线程池（代码默认 500ms×20/P0 100ms×5；运行实际 100ms×50，env-frozen），领取=条件 UPDATE 无 FOR UPDATE、跨租户扫描；连接池=**Druid 非 Hikari**（yml 20/prod 5、运行实际 64、池=5 曾连接饥饿（失败轮））；引擎与业务同一 DataSource/事务管理器；执行器 OFF+节点异步+测量显式 ON=**启用风险**，未证明现有服务失效。〔静+验+核；§A1-A7〕
- **Q2**：单表 SQL 可区分 等待/失败待重试/执行中/疑似卡死(stale 60s)/FAILED/EXPIRED，deadline_at(默认30s 受理冻结)与 EXPIRED 已存在〔静〕；62,100/22,666/39,434=报告仅计数，**未完成构成与瓶颈归因未知**（pairP50 为限定行时差口径非纯排队；默认配置估算不适用该轮），待受控轮 GROUP BY〔验〕；准入接缝=enqueue 内 save 之前（不丢已受理）；另须覆盖重复回查/竞争/整笔受理事务（复核01 边界）〔静〕。〔§B1-B3〕
- **Q3**：P0=专用权限+领取优先+5s 有界等待=独立领取车道，无线程/连接/表隔离；NORMAL=全局 FIFO；配额/公平/上限不存在〔静〕；OA 读 summary 窗口 1,272/1,273 零失败，但含压力段前请求（正式窗口 1,128/1,131=复核07；552.3/559.0 为 summary 值非其 P99），不证明保留容量合同〔验〕。共享瓶颈=Tomcat/Druid/命令表行/act_ru_job/@Async/Quartz 全共享，独立线程≠DB/CPU 隔离〔静〕。〔§C1-C4〕
- **Q4**：Actuator 仅 health、主代码 0 Meter=无业务指标；命令单条 GET（仅受理人本人）+批量 txn-batch/{batchKey}+实例维度监控；无积压统计/列表端点；关联链 record_id→FLOW_START:{recordId}→命令行→effect→invocation→目标行可串〔静〕。最小缺口=积压聚合、运维列表、分段计量、恢复字段；复核01 边界=固定权限/租户隔离/状态口径/恢复耗时/目标可见点，防高基数标签泄露。〔§D1-D4〕
- **Q5**：**阶段通过值（复核07 保留）**=合规负载实时 p99=112.637083ms≤300ms（76,785）、轻流程受理 p99=147.877333ms≤2s（62,100）；高负载/压力/OA 画像=OBSERVATION-ONLY 非生产 SLA〔验〕。硬件/负载身份与 300ms/2s 预算沿用；新策略须冻结实际配置并验证共享瓶颈，不以调大池或提高拒绝率替代；待运行=prod 池5 可用性、执行器 OFF 消费可用性、长时排干、39,434 分布、多小时稳定性〔核〕。〔§E1-E2〕
- **Q6**：在途冻结先例=动作版本/停用结算/payload_fingerprint(2426+旧行回推)/deadline_at 受理时点冻结，**资源策略不得改在途业务语义**〔验〕；默认关闭=`sw.bpm.txn-batch.enabled` false+`sw.bpm.enabled` 门控+G5a 先例，0.1.3 不含分级能力〔静+验〕；必锁=P4 权限/双通道、C1 同事务、批量逐项事务、设备 UNKNOWN 禁盲重发、旧二进制枚举退出、REQUIRES_NEW 仅拒绝/审计；方案 A 调键/B 准入拒绝/C 扩车道利弊详附件。〔§F1-F4〕

## 未知与最小补核

①39,434 状态分布 SQL（受控轮）②执行器 OFF 消费可用性③Tomcat/调度/Quartz 默认值④`sw.job.pool-size` 接线⑤prod 池5 整链可用性⑥长时排干/多小时稳定性。索引：定位 4 个命名唯一键，旧"六唯一索引"未逐条核实，不能宣布其余不存在。

## 提交身份

探索原批次 Workspace `6f44ca6`/Server `08b0917` 远端读回一致；传播批次见提交附录；本订正批次身份由其提交与远端读回承载。

## 受影响信息入口实际值

复核01 后唯一下一动作=Planner 依据复核01及探索回执制定 R06/R10 资源保障阶段方向。功能 45、清单 46/22/22、ADV64、问题 57、P62 PLANNING、0.1.3 不变。
