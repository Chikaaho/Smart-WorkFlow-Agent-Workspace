# P62 分级执行与统一命令 · 探索附表 C：在途兼容与测量条件（Q4+Q5）

日期：2026-09-30；角色：执行（Executor）；主回执 `p62-tiered-command-readiness-20260930.md` §Q4/§Q5。只读探索。

## C1 在途兼容矩阵（Q4）

| 对象 | 现状事实 | 位置 | 混版本/回退影响 |
|---|---|---|---|
| NORMAL/P0 双通道 | 两通道共享业务校验/审计/幂等/结果契约；P0 独立容量+有界等待+专用权限 `workflow:p0:dispatch` | `CommandChannelEnum`；`CommandDispatcher.java:56-60,125-134`；`BpmDraftController.java:186-203` | 新增等级若复用通道需保持契约一致；P0 权限已注册未默认授权 |
| 旧命令行 | `sw_bpm_command` 四态落库（PENDING/PROCESSING/COMPLETED/FAILED），含 retry/claim/finished 字段 | `baseline:2400-2411`；`BpmCommand.java:56-70` | 旧行可继续被新版本消费；新增状态值需旧二进制可解析（当前 `of` 抛错） |
| 旧实例/任务 | 实例终态 RUNNING/APPROVED/REJECTED/WITHDRAWN/DISCARDED；任务级时限与催办独立 | `InstanceStatusEnum`；`BpmTaskDeadline`；`BpmUrgeServiceImpl.java:44,123-138` | 与新等级不冲突（各自对象），但统一结果展示需映射 |
| 动作版本冻结 | 发布版本不可变（`sw_form_txn_action_version`）；结算按预占受理冻结版本 | 首阶段 V0.1.1；`TxnActionTxOperations.requireFrozenVersion` | 改配置只影响新受理；在途对象语义稳定（已验证） |
| 表单版本冻结 | 草稿绑定表单版本，提交校验版本一致；表单发布冻结 | `DraftSubmitService.java:96-116`；`FormDefServiceImpl.publish` | 版本漂移拒绝而非静默改绑（已验证） |
| 迁移链 | 0.1.3 基线 `V0.1.0` + `V0.1.1`（**纯新增 6 表，无既有表结构变更**）+ 两个 R__；首阶段 LT05a 已验证非空数据升级回读无损 | `db/migration/postgresql/`；首阶段证据 `evidence/local-transaction-actions-03/lt05a-nonempty-upgrade.md` | 追加式迁移；旧二进制忽略新表；回退=不删除新表、不加新受理 |
| 前端查询 | 命令 `/workflow/commands`；草稿 `/workflow/drafts/{id}`；实例 `/workflow/instances`；动作调用记录/凭据/台账；OpenAPI 状态查询 | Web `src/contracts/bpm.ts`、`src/modules/form/api/txn-action.ts` | 旧前端对新增状态值显示空标签（不崩）；联合类型更新需前后端同批 |
| 回退安全边界 | 新语义（等级/命令类型/状态）旧二进制不可安全处理时：只停用新受理、保留结果、向前修复；不得降级盲目重放 | 阶段方向 §兼容/回滚；探索事实（`CommandTypeEnum.of` 抛错） | 混版本窗口需在 ADR 中固定 |

**既有 schema/测试资产（可复用）**：`sw_bpm_command` 六唯一索引与五道意图接缝（baseline:2378/2410/2442-2443/2484-2489 等）；`sw_form_txn_*` 六表（V0.1.1）；`sw_iot_device_command`（idempotent partial unique）；测试资产：`CommandQueueIntegrationTest`（受理不可见/唯一效果/stale 回收/多消费者/P0 优先）、`CommandLeaseHandoverOverlapTest`（租约交接重叠）、`CommandOverlapRealEngineTest`（跨通道重叠/迟到写回/ack 丢失恢复）、`G5aSyncWaiterChainTest`（同步等待链）、`Phase5PgDeviceCommandBoundaryBehaviourTest`（意图同提交边界）、`Phase3ReferenceConcurrencyPostgresTest`（宽表并发完整性）、`P62TxnActionPgBehaviourTest`（并发预占/同事务组合/冻结版本/丢失回查，12 例）。

## C2 测量环境事实（Q5，非敏感）

| 项 | 事实 |
|---|---|
| 主机 | macOS 26.3.1（Build 25D2128），Apple M1，8 核，8 GiB 内存 |
| JVM/构建 | OpenJDK 21.0.11；Apache Maven 3.8.6（测试默认 `MAVEN_OPTS=-Xmx2g`） |
| 数据库（隔离可选） | 本地 Homebrew PostgreSQL 16.15（127.0.0.1:5432，OS 用户连接）；zonky 内嵌 PostgreSQL 17.5.0（测试内临时集群，随进程销毁）；H2 2.3.232（模块级） |
| 缓存/其它 | Redis 7.2.5（本机 6379）；Node v24.9.0 / pnpm 11.9.0（前端门禁） |
| 进程/拓扑 | 单机单进程应用 + 单库 + 单 Redis；无集群/容器编排；无非敏感硬件基线表 |
| 可复现性 | 隔离测量建议使用 zonky 内嵌 PG（每轮新建集群，端口随机）或本地 PG 临时库（既有 `I6G7b`/`Phase4Pg*` 模式，drop/create 演练库） |

## C3 现有测量资产与缺口（Q5）

| 资产 | 事实 | 用途/局限 |
|---|---|---|
| `sw_form_txn_invocation.duration_ms` | V0.1.1:73，逐次调用耗时落库；结果对象含 durationMs | 单次粒度事实，可聚合；无并发/负载条件 |
| 命令时间戳 | `sw_bpm_command.claimed_at/finished_at` | 粗粒度端到端耗时（秒级观察），无 p99 |
| 首阶段行为输出 | `[P62-EV]` 行（计数/并发结果，如 20 路并发成功 10） | 正确性证据，非时延测量 |
| 负载/延迟资产 | **零命中**（p99/latency/throughput/QPS 于测试源码无匹配） | 300ms/2s 预算**未测量**；需新建可复现测量档位后方可声明 |
| 前端性能 | 无（Web 无性能门禁） | 不作为本阶段证据 |

## C4 可复现测量档位选项（选项、非承诺；待 Planner/ADR 固定）

| 维度 | 档位1（基线） | 档位2（常规） | 档位3（压力） | 说明 |
|---|---|---|---|---|
| 并发 | 1 请求串行 | 16 并发（≈2×核数） | 64 并发 | 以固定线程池+起跑闩锁复现（既有测试模式） |
| 数据与热点 | 单表单 1 行记录 | 单表单 1k 行、热点行 10% | 单表单 10k 行、热点行 1% | 热点=同一 recordId 争抢（锁竞争可测） |
| 样本窗口 | 30 s 或 500 次调用 | 5 min 或 5,000 次 | 15 min 或 20,000 次 | 记录 p50/p95/p99、失败/拒绝、恢复事件；含预热丢弃 |
| 故障恢复 | 无故障 | 消费中 kill -9 一次（stale 回收） | 交替故障（连续 3 次重启 + 网络拒绝） | 记录恢复耗时、重复效果数、终态分布 |
| 测量点 | 单次 duration_ms + 命令时间戳 | 同上 + 聚合脚本 | 同上 + 队列滞留直方图 | 均需固定硬件/拓扑/负载/样本口径后重跑 |

**未测量声明**：以上档位均为待选选项；当前无任何 p99/负载/恢复时间的真实测量值，实时动作 300ms 与生产轻流程 2s 预算在固定档位并实测前不得宣称达标。
