# G7a 共同契约断言映射（两实现 × 契约用例）

2026-09-06；Executor。目的：以"断言 → 测试名 → 文件:行 → 两实现运行结果"映射关闭 G7a，
不以套件通过自述替代覆盖。默认路径（Spring 生产装配）注入持久实现
（`CommandQueueIntegrationTest`/`CommandDispatcherTest` 经 Spring 上下文注入 `PersistentBpmCommandQueue`，
启动日志含"命令调度器已启动"），替代实现仅为契约验证，不冒称外部 Broker。

## 1. 共同契约抽象

- 契约基类：`sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/queue/BpmCommandQueueContractTest.java`
- 实现 A（默认生产路径）：`PersistentBpmCommandQueueContractTest`（真实 H2 + 真实 bpm 迁移，
  `@SpringBootTest(classes = QueueH2TestConfig.class)`，文件同目录 :12—:31）
- 实现 B（可替换边界证明）：`InMemoryCommandQueueContractTest`（内存实现，文件同目录 :11—:21）

两实现运行**同一组继承契约用例**（每个用例在两份 Surefire 报告中各出现一次，全部通过）：

| 契约断言（D1 语义） | 契约用例（基类行号） | 持久实现 | 内存实现 |
|---|---|---|---|
| 投递→领取→确认全生命周期（受理=持久化、领取=状态迁移、确认=结果落库） | `lifecycle_enqueueClaimComplete` BpmCommandQueueContractTest.java:56 | PersistentBpmCommandQueueContractTest（同报告文件，Tests run 4/0/0/0） | InMemoryCommandQueueContractTest（Tests run 4/0/0/0） |
| 失败可查/有界重试：退避后再次可领取，达上限进入 FAILED 终态（不无限占位） | `retryThenTerminalFailure` :75 | 同上 | 同上 |
| 恢复：消费中断（PROCESSING 残留）stale 回收后可重新领取 | `reclaimStale` :105 | 同上 | 同上 |
| 去重/幂等回查：同 commandKey 的 findByKey 往返 | `findByKeyRoundtrip` :118 | 同上 | 同上 |

## 2. 持久实现附加行为（真实 H2 集成，`CommandQueueIntegrationTest.java`）

| 断言 | 用例（行号） |
|---|---|
| 提交边界：受理未提交对消费者不可见，提交后才可领取（时间线断言） | `acceptanceInvisibleBeforeCommit_visibleAfterCommit` :122 |
| 重复投递：同 commandKey 只受理一次（DuplicateKeyException），效果一次 | `duplicateDelivery_singleAcceptance_singleEffect` :155 |
| 消费中断重启恢复：claimed 未确认被 stale 回收重投、效果恰一次 | `consumerCrash_reclaimOnRestart_effectOnce` :170 |
| 双消费者竞争领取：每命令恰一次效果 | `competingConsumers_eachCommandProcessedOnce` :192 |
| 真并发双调度线程：8 命令恰 8 效果（DB 级 CAS 领取） | `independentConsumersConcurrent_eachCommandExactlyOnce` :207 |
| 租约交接：回收后新消费者完成，旧领取者迟到 complete/失败处理不得复活或改判 | `staleReclaim_oldClaimantLateCompleteCannotResurrect` :243 |
| 普通积压下 P0 先处理、普通随后推进（B2 调度层） | `p0PrioritizedWhileNormalBacklogged` :275 |
| 租约交接重叠窗口（真实处理器 TaskActionCommandHandler + 受控外部效果适配器）：同任务 NORMAL/P0、处理中回收、迟到执行与写回被拒、效果恰一次、身份不串 | `CommandLeaseHandoverOverlapTest.leaseHandoverOverlap_oldClaimantLateExecutionAndWriteRejected`（独立文件） |

## 3. 运行证据

全量门禁（2026-09-06）`backend-full-test-final.log`：`mvn -q test` exit 0，
170 份 Surefire 报告合计 1111/0/0/0，其中上述两实现契约报告
`BpmCommandQueueContractTest`（基类直接计数 0，用例在两实现报告内）、
`PersistentBpmCommandQueueContractTest`（4/0/0/0）、`InMemoryCommandQueueContractTest`（4/0/0/0）、
`CommandQueueIntegrationTest`（7/0/0/0）、`CommandLeaseHandoverOverlapTest`（1/0/0/0）。
工作区副本：`receipts/evidence/review03/new-05/backend-full-test-final.log`。

## 4. 分层更正与源码副本（审查04 §2.4 回应）

- `findByKeyRoundtrip` 是幂等**查询**契约，不是去重证明；持久实现的去重证明分层为
  `CommandQueueIntegrationTest.duplicateDelivery_singleAcceptance_singleEffect`（同 key 二次受理 DuplicateKeyException + 效果一次）。
- `consumerCrash_reclaimOnRestart_effectOnce` 实际为**同进程内 stale 回收**行为；真实进程退出重启恢复由
  G4a 双进程原件（live-business G4a 段 + `new-06/g4a-phase1.out`/`g4a-phase2.out`）承担，两者不互相冒称。
- 基类与两实现源码副本：`contract-sources/BpmCommandQueueContractTest.java`（4 契约用例 :56/:75/:105/:118）、
  `contract-sources/PersistentBpmCommandQueueContractTest.java`、`contract-sources/InMemoryCommandQueueContractTest.java`、
  `contract-sources/CommandQueueIntegrationTest.java`。
- 默认注入：`CommandQueueIntegrationTest`/调度器相关测试经 Spring 上下文获得 `PersistentBpmCommandQueue`
  （`QueueH2TestConfig.bpmCommandQueue` Bean），启动日志含"命令调度器已启动"。
