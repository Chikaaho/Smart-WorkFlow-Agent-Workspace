# LT05a 补证：非空旧数据先于 P62 增量迁移的时间链（隔离真实 PostgreSQL）

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查02 LT05a「全新建库后写数据不能证明旧非空数据升级；需要"迁移前已存在→迁移后回读"的链」。
实现：`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p62/P62NonEmptyUpgradePgTest.java`（新增）；原始输出见 `lt02a-lt04a-lt05a-raw-output.txt`。

## 1. 环境与隔离声明

- **内嵌真实 PostgreSQL**（zonky binaries 17.5.0，临时集群随进程销毁）；不连接任何共享库/线上库，**不执行 `DROP DATABASE`**，不改动发布基线文件。
- 迁移文件来自当前提交树 `6e73a11`（`classpath:db/migration/postgresql`）；基线阶段用**字节级复制**把 0.1.3 发版批次（`a9483be`）当时存在的两支（`V0.1.0__baseline_seed.sql`、`R__i6_notify_menu_reconciliation.sql`）复制到临时目录执行，避免把本次增量才引入的 `R__p62` 提前执行，并从 SHA-256 逐字节证明同源（复制件与 classpath 资源一致）。

## 2. 时间链（三段可复算）

| 阶段 | 动作 | 机器事实（原始输出） |
|---|---|---|
| ① 0.1.3 基线 | 执行 V0.1.0 + R__i6（`target=0.1.0`） | `lt05a.baseline migrated=2 target=0.1.0 set=V0.1.0+R__i6`；history：`0.1.0:841228558:2026-09-30 18:07:16:true:223ms`、`i6 notify menu reconciliation:-1061893576:…:true:2ms` |
| ② 非空代表数据（**增量前**） | 写入表单元数据（`sw_form_def`/`sw_form_config`）+ 动态宽表 `lt05a_legacy_tbl` 2 行（`lt05a-rec-0001` 100/30、`lt05a-rec-0002` 7.5/0，含 `create_time`） | `lt05a.legacy-seeded rows=2 digest=e228ed24ed985de3364682dc089c413e digest_sha256=48d0fe95… inserted_before_increment=true`；同时断言：增量前 **P62 六表不存在**、**P62 菜单 9100—9103 不存在** |
| ③ 本次增量 | 执行当前树最新链（无 target） | `lt05a.increment migrated=2 applied=0.1.0>i6 notify menu reconciliation>0.1.1>p62 form txn action menu`；`history_0_1_1=0.1.1\|form local transaction actions\|257617857\|2026-09-30 18:07:16\|true\|13ms` |
| ④ 迁移后回读 | 行数/逐行身份与值/摘要/既有查询/新结构 | `lt05a.readback rows=2 digest=e228ed24… digest_equal=true p62_tables=6`；逐行一致（id/material/两数值列/create_time 全等）；既有查询 `tenant_id=0 AND deleted=0` 下可用量 = `LT05A-M1=70.000000`、`LT05A-M2=7.500000`；P62 六表齐备且业务表零行；菜单 4 行 + 角色授权 4 行随增量落库 |

迁移文件身份：`V0.1.1__form_local_transaction_actions.sql` SHA-256 = `0534ce414f92ca63017e07c5c6f43bc56679b0096d329c96fd09ad3d5354d7b2`（`lt05a.file-identity`）；历史校验和为 Flyway 自身口径（`257617857`），两者一并为对象身份。

## 3. 结论与边界

- 结论：非空旧数据（表单元数据 + 动态宽表行）存在于 `V0.1.1` 之前；应用本次增量后，对象身份、字段值、既有查询结果逐项一致（摘要与逐行比对双口径），无数据丢失/改写；增量带来的新结构与菜单授权按预期新增；迁移历史含版本、校验和、安装时间与成功标志。
- 与既有证据的关系：`I6G7bOldBaselineUpgradePostgresTest` 继续承担"0.1.0 基线全新建库"演练（其口径不变）；本项只补"非空数据先于增量"的时间链，不重复发布验收、不改发布基线。
- 边界一：代表数据为最小非空集（1 表单 + 1 动态表 + 2 行 + 元数据），用于证明时间链与无损回读，不构成全库规模/性能演练。
- 边界二：内嵌引擎为隔离环境，不触碰 dev/线上库；对象随引擎销毁，标识以上表为准。
- 边界三：`V0.1.1` 为纯新增（6 张新表，无既有表结构变更），本项结论限定于该增量的数据保持性；后续增量如引入既有表变更需按同一时间链口径另证。
