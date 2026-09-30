# LT05 补证：迁移/验收混合快照口径纠正与对象级核对

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查记录 LT05「快照与文字矛盾」。
数据来源：专用 dev 库 `smart_workflow`（`db-post-acceptance-facts.txt`，本次复核生成于 2026-09-30 17:20 +0800；主机地址脱敏）；对照组为迁移前快照 `../local-transaction-actions-01/db-pre-migration.txt`（15:10:55）与原「迁移与验收后」快照 `../local-transaction-actions-01/db-post-migration.txt`（15:55:39）。

## 1. 口径纠正（原表述与纠正后表述）

原回执 01 §4 的表述「既有表行数不变…表总数 146→153（新增 6 张 P62 表 + 1 张表记录差为既有表计数口径）」有两处不成立，现予纠正：

1. 该快照标题即写明「迁移**与验收后**」——它是在 UI 验收（15:18—15:39 创建表单/记录/动作并调用）**之后**采集的，其中 `sw_form_def 0→1`、动态表 1 张、P62 运行对象（动作/版本/调用/凭据/台账）全部来自**验收**，不是迁移效果；把两类事件混为一段叙述，且对 153−146=7 的第 7 张表以「计数口径」带过，属不成立的解释。
2. 更正后的正确表述：**迁移侧**按设计新增 6 张 P62 表、`sys_menu +4`、`sys_role_menu +4`；**验收侧**自建 1 张表单（`sw_form_def`/`sw_form_config`/`sw_form_snapshot` 各 +1、动态宽表 +1、记录 +1）；其余既有关键表行数不变。

## 2. 对象级核对（逐项依据，均为本次直接查询）

| 变更对象 | 迁移前 | 现状 | 归属 | 依据 |
|---|---|---|---|---|
| 表总数 | 146 | **153** | 迁移 +6 / 验收 +1 | `tables_total=153`；`p62_txn_tables=6`；`dynamic_wide_tables=1` → 146+6+1=153，闭合 |
| 第 7 张表 | — | `sw_form_ouyylgp64c` | **验收表单动态表** | 全库唯一动态宽表（命名契约 `^sw_form(_table)?_[a-z][a-z0-9]{9}$`）；`sw_form_def` 行 `7d91e5f1-c3f2-4d51-9d31-2691ed7291a2 | 未命名表单 | PUBLISHED | physical_table_name=sw_form_ouyylgp64c | v2 | create_by=1 | 15:18:30`（晚于迁移 15:11:26）——**不是计数口径，是对象归属** |
| 6 张 P62 表 | 无 | `sw_form_c1_policy`、`sw_form_txn_action`、`sw_form_txn_action_version`、`sw_form_txn_invocation`、`sw_form_txn_ledger`、`sw_form_txn_reservation` | 迁移 V0.1.1 | flyway `rank 3 | 0.1.1 | form local transaction actions | success=true | 15:11:26` |
| `sys_menu` | 122 | **126（+4）** | 迁移 R__p62 种子 | 菜单 9100/9101/9102/9103（9100 type=1 component=`form/views/TxnActionList` parent=2；9101—9103 type=2 parent=9100），权限串 `form:action:view/manage/publish/invoke` |
| `sys_role_menu` | 58 | **62（+4）** | 迁移 R__p62 种子 | `role2_grants=4`（9100—9103 全授予普通 admin 角色 2）；旧冲突 id 残留 `330—333` 计数 **0** |
| `sw_form_def` / `sw_form_config` / `sw_form_snapshot` | 0 / 0 / 0 | 1 / 1 / 1 | 验收 | 上表表单行 + `counts: def=1 config=1 snapshot=1` |
| 验收记录 | 无 | `02c874ac-777e-4bbb-92eb-74e2992d6ec7`（tenant=0、deleted=0、field_1=M-001、**field_2=70.000000**、field_3=0.000000、version=2） | 验收 | 可用量 70 = 100（建档）− 30（确认）；version=2 与「预占 +1、确认 +1」两次条件更新一致；预占 field_3 归零 |
| P62 运行对象 | 无 | actions=3（含 1 条发布错误演示用 DRAFT）、versions=2、invocations=3、reservations=1、ledger=2（RESERVE+CONFIRM） | 验收 | 与验收脚本逐对象同身份；守恒 100−30=70 与 `01/03/04/06/11/12` 截图、`16-db-readback.txt` 一致 |
| 既有业务/系统表 | `sys_user=1 sys_role=2 sys_dept=1 sys_dict_type=6`、`sw_bpm_*`/`sw_iot_device_command`/`sw_job_log`=0 | 同左（**均未变**） | 无变更 | 本次复核逐表计数与迁移前快照逐项相同 |

`flyway_schema_history` 全链（5 行）：`0.1.0 baseline seed`（01:41:42）→ `R__i6 notify menu reconciliation`（01:41:48）→ `0.1.1 form local transaction actions`（15:11:26）→ `R__p62 form txn action menu`（15:11:27）→ `R__p62` 再次执行（15:13:05）。**第 5 行不是重复异常**：菜单种子在验收中发现 id 冲突后修正（330—333 → 9100—9103），可重复迁移校验和随之变化并重跑；重跑前 4 条误授 `sys_role_menu` 行已按受控清理删除，本轮残留复核为 0。

## 3. 「旧业务对象兼容」的边界与替代证据

专用 dev 库中表单/流程/命令/IoT 表在迁移前即为 0 行（`db-pre-migration.txt`），**因此该库本身不能证明「非空旧业务对象兼容」**；本阶段也不以该库代替该证明。替代证据为冻结门禁中已实跑通过的兼容/迁移链测试（原始逐类结果见 `lt01-server-gate-report.md` 与 `lt01-raw-excerpts.txt`，均在 Server `eca1b52` 树实跑；本次补证树 `5f9e066` 复跑同样通过，见 §4）：

| 测试 | 结果 | 该测试覆盖的兼容语义（测试内 @DisplayName 原文要点） |
|---|---|---|
| `I6G7bOldBaselineUpgradePostgresTest` | 2 / 0 / 0 / 0 | 「I6 G7b 真实 PG V0.1.0 基线全新建库演练」：独立临时库 `i6_g7b_baseline` 用 0.1.3 基线种子全新建库，并在**非空代表数据**上回读——通知消息两租户真实写入/回读（`baseline rows: notify=3(two tenants), attempt=1(FAILED preserved semantics)`）、模板与发送尝试语义可解释、门面表齐备 |
| `I6G7UpgradeDrillH2Test` | 1 / 0 / 0 / 0 | 升级演练（H2 侧同一语义） |
| `FlywayFullChainPostgresTest` | 12 / 0 / 0 / 0 | 基线种子全链：`applied() 共 4 条（0.1.0+0.1.1+2 可重复对账）`、终点 0.1.1、**重复 migrate 幂等（0 条新执行）**、再次 validate 通过、**篡改 0.1.0 校验和后显式失败（不静默通过）**、逻辑删除唯一语义守卫、P62 菜单 9100—9103 与 role 2 授权 |
| `FlywayFullChainH2Test` | 17 / 0 / 0 / 0 | 同上（H2 侧）+ 历史菜单/唯一索引/绑定语义断言 |
| `Phase4PgFlowSeamBehaviourTest` / `Phase4PgTransactionFactTest` / `Phase4PgDeliverySeamBehaviourTest` / `Phase4PgCommitBoundaryBehaviourTest` / `Phase4PgRestartRecoveryTest` / `Phase4PgLifecycleBehaviourTest` | 9 / 2 / 8 / 3 / 1 / 7（均 0/0/0/0） | 既有流程接缝、事务事实、交付接缝、提交边界、重启恢复、生命周期：命令/实例路径在真实 PG 上未破坏 |
| `p4overlap.CommandOverlapRealEngineTest`、`G5aSyncWaiterChainTest`、`MyProcessedRealSourceTest`、`CrossTenantReadIsolationTest` | 4 / 5 / 4 / 2（均 0/0/0/0） | 旧命令/实例回查与跨租户读隔离（真实引擎） |

说明：本阶段新增的 1 张表单 + 6 张表只做**增量**；对既有表只执行 `CREATE TABLE`/`ALTER TABLE ADD COLUMN` 类增量 DDL（`DynamicTableManager` 无 `DROP TABLE` 能力），不删库、不改写既有行。

## 4. 本次补证树（Server `5f9e066`）在迁移维度上的复跑

补证批次（结算冻结语义/停用边界/非法声明拒绝）提交后全量门禁实跑：**1654 / 0 / 0 / 0**（1466 + 17 + 19 + 152，四段 exit 0），其中 `FlywayFullChainH2Test` 17/0/0/0、`FlywayFullChainPostgresTest` 12/0/0/0、`I6G7bOldBaselineUpgradePostgresTest` 2/0/0/0、`I6G7UpgradeDrillH2Test` 1/0/0/0 全部通过；P62 菜单断言输出 `[S3-production] P62 txn menu=(9100,…)`（双臂 H2/PG）。原始日志 `lt02-*.log`（哈希见 §5）。

## 5. 边界与材料

- 本轮**未**对任何数据库执行 DROP/CREATE/删除数据；无线上库操作；`smart_workflow` 为专用 dev 库。
- 支撑材料：`db-post-acceptance-facts.txt`（本次核对快照，含逐对象 SQL 结果）、`../local-transaction-actions-01/db-pre-migration.txt`、`../local-transaction-actions-01/db-post-migration.txt`（原快照保留不改写）、`lt01-server-gate-report.md`（兼容测试逐类结果）。
