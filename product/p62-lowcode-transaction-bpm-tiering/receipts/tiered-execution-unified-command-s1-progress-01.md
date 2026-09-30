# P62 分级执行与统一命令：S1 命令语义核心进度回执 01

日期：2026-09-30；角色：执行（Executor）；阶段状态：**IN_PROGRESS**（阶段 READY 已授权实施；正式完成回执 `tiered-execution-unified-command-01.md` 在 U01—U08 全部完成后提交）。
依据：`../ready/direction-p62-tiered-execution-unified-command.md`、`../ready/adr-p62-002-tiered-command.md`。

## 1. S1 交付范围（命令语义核心：U02/U03/U04 基础）

| 项 | 实现 | 位置 |
|---|---|---|
| 统一逻辑身份与载荷指纹 | `sw_bpm_command.logical_command_id` + `payload_fingerprint` + 唯一索引 `uk_sw_bpm_command_logical(tenant_id, logical_command_id)`；`CommandFingerprint`（sha256 口径）；`findByLogicalId` 回查 | `V0.1.2__tiered_command_semantics.sql`（PG/H2）、`entity/BpmCommand`、`queue/CommandEnvelope`、`queue/CommandFingerprint`、`queue/PersistentBpmCommandQueue` |
| 受理时冻结形态/完成点/准入截止 | `tier`/`completion_point`/`deadline_at`（1—300s，默认 30，越界受理即拒绝） | 同上（`applyTieredSemantics`） |
| 效果权威账本（关闭"业务已提交、完成记录未写"窗口） | 新表 `sw_bpm_command_effect`（command_id 主键，效果至多一条）+ `CommandEffectRecorder`：MANDATORY 同事务写入、行锁 `lockLeaseById` 校验执行权、重复记录保留首次 | `V0.1.2`、`entity/BpmCommandEffect`、`mapper/BpmCommandEffectMapper`、`mapper/BpmCommandMapper#lockLeaseById`、`queue/CommandEffectRecorder` |
| 执行权防护（旧执行者不得提交效果） | 租约回收（PENDING/清令牌）或转手后，旧执行者在业务事务内的行锁校验失败即中止；新领取者据既有权威行跳过业务（效果至多一次） | `queue/CommandEffectRecorder#assertLease`；`queue/PersistentBpmCommandQueue#reclaimStale` |
| 准入截止语义 | `EXPIRED`（仅"待执行且效果未发生"可过期）；执行中超过截止仅写 `overdue_at`（不改状态、不判失败/过期） | `entity/CommandStatusEnum`、`queue/PersistentBpmCommandQueue#expireDue/#markOverdue` |
| 对账恢复任务 | `TieredCommandReconcileJob`：三类收敛——过期、超期标记、按权威效果补写完成（令牌守卫沿用 `complete` 双条件；逐条还原命令租户/发起人身份，不产生超管兜底） | `queue/TieredCommandReconcileJob` |

## 2. 验证（本轮实跑）

| 层 | 用例 | 结果 |
|---|---|---|
| 模块 H2（真实 H2 + 真实持久化队列 + 迁移 V102） | `TieredCommandSemanticsH2Test` 6 例：窗口闭合收敛、旧执行者被拒/效果唯一、首个效果即权威、截止只过期未执行、逻辑身份唯一可回查、截止参数校验 | **6/0/0/0** |
| 真实 PostgreSQL（内嵌 PG 17.5 + 应用启动迁移 V0.1.2） | `TieredCommandSemanticsPgTest` 4 例：`[P62-EV] tiered.effect/stale/deadline/identity` | **4/0/0/0** |
| 受影响回归 | `P62TxnActionPgBehaviourTest` 12、`P62UpperEntryC1PgTest` 4、`CommandOverlapRealEngineTest` 4、`G5aSyncWaiterChainTest` 5、`MyProcessedRealSourceTest` 4、`CrossTenantReadIsolationTest` 2 | 全绿（另：`sw-bpm-process` 模块 **224/0/0/0**） |

迁移落地范围：生产链 `sw-bootstrap/src/main/resources/db/migration/{postgresql,h2}/V0.1.2__tiered_command_semantics.sql`；测试链 `sw-biz/sw-bpm/sw-bpm-process/src/test/resources/db/migration/bpm/h2/V102__…`、`sw-bootstrap/src/test/resources/db/migration/bpm-fixture/h2/V102__…`（三处同源同字节）。

## 3. 身份与提交

- Server `8a5acae`（S1 实现与测试）+ `4d365b0`（功能清单 IN_PROGRESS 记录）；Workspace `4d8374f`→`ce417c4`→`a8168df`（阶段 READY→IN_PROGRESS 入口同步 + gitlink=Server `4d365b0`）；Web `19e1c47` 未变。远端 `git ls-remote` 回读一致。
- 当前入口（knowledge 两入口、Server 功能清单）已记录：阶段 READY→IN_PROGRESS（S1 已交付），下一动作=Executor 继续 S2—S6 并完成 U01—U08。

## 4. 剩余与边界

- 剩余切片：S2 事务动作节点+form-api 受控 port+发布/运行授权与配置校验（U01/U05）；S3 批量（U02/U07）；S4 设备未知结果接线与独立授权人工核实（U04/U07）；S5 Web 界面；S6 兼容回滚演练（U06）+ 测量套件与 300ms/2s 预算实测（U08）+ 正式回执。
- 边界：S1 只交付"机制与核心语义"；旧 handler 的 effect 接线与新路径（节点/批量）的"先查权威行"在 S2/S3 落地并逐项验证；本回执不替代 U01—U08 的正式行为验收；未测量预算、未做浏览器验收、未发版/部署。
