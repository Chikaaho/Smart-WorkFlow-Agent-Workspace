# P66 多数据库兼容：UAT 迁移校验和比对（execution-final-02）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容（XL，目标 0.4.0） |
| 依据 | `product/multi-database-compat/ready/direction-multi-database-compat.md` §5；`product/uat-recovery-20261109/ready/direction-uat-recovery.md` §2.4 |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 分支 | Server `feature/0.4.0-multi-database` @ `bf62381f` |
| UAT | PostgreSQL 14.24，`14-main`，端口 5433，库 `smart_workflow` |
| 结论 | UAT 0.3.2 迁移链的 **28 个唯一脚本校验和全部与 0.4.0 分支一致**；分支相对 UAT 仅新增 `V0.4.0__knowledge_vector_persistence.sql` 与 `R__0.4.0_rename_bpm_opinion_comment.sql`；`execution-final-01.md` §5 的阻塞解除 |
| 写操作 | 无；仅 `SELECT`/只读文件读取 |

## 1. 范围与方法

1. 在 UAT 上只读执行：

   ```sql
   SELECT installed_rank, version, script, checksum, success
   FROM flyway_schema_history
   ORDER BY installed_rank;
   ```

2. 读取分支 PG 迁移目录
   `sw-bootstrap/src/main/resources/db/migration/postgresql/`，共 **30** 个脚本。
3. 校验和算法使用 **Flyway 11.3.4** 的 `ChecksumCalculator`（与 UAT `bootstrap.jar` 内
   `flyway-core-11.3.4.jar` 同版本），对分支文件逐条计算。
4. 另将 UAT `bootstrap.jar` 内 `BOOT-INF/classes/db/migration/postgresql/` 的脚本
   与分支文件逐条做 SHA-256 比对：**28/28 完全相同**。

## 2. UAT 迁移历史概况

- `flyway_schema_history` 共 **31 行**，`success` 全部为 `t`。
- 唯一脚本 **28 个**：9 个 versioned（`V0.2.0`、`V0.2.2`—`V0.2.9`）+ 19 个 repeatable。
- versioned 终点：**`0.2.9`**。
- 0.4.0 未部署到 UAT，因此历史中不存在 `V0.4.0`/`R__0.4.0`，符合预期。

## 3. 重复应用留下的历史行

同一 repeatable 脚本因内容变化被多次应用，历史表保留多行。比对时以 `installed_rank`
最大的行为当前生效校验和；旧行是历史版本，不是差异。

| 脚本 | 历史行（rank → checksum） | 当前生效 |
|---|---|---|
| `R__application_center_menu.sql` | 15 → -628950224；21 → 361788479；33 → -1799982056 | rank 33 → **-1799982056** |
| `R__p62_form_txn_action_menu.sql` | 4 → -302206022；5 → 742371850 | rank 5 → **742371850** |

两处当前生效值均与分支一致。

## 4. 逐条比对

### 4.1 Versioned（9/9 一致）

| 脚本 | UAT rank | UAT checksum | 分支 checksum | 结果 |
|---|---:|---:|---:|---|
| `V0.2.0__baseline_seed.sql` | 22 | 1897854550 | 1897854550 | 一致 |
| `V0.2.2__f1_agent_provider_model.sql` | 28 | 1379571396 | 1379571396 | 一致 |
| `V0.2.3__f1_stage2_graph_snapshot.sql` | 29 | -1736819131 | -1736819131 | 一致 |
| `V0.2.4__f1_stage2_execution_node_detail.sql` | 30 | 1840655377 | 1840655377 | 一致 |
| `V0.2.5__f1_stage3_knowledge_rag.sql` | 31 | 1855273184 | 1855273184 | 一致 |
| `V0.2.6__f2_app_bundle.sql` | 32 | -773201416 | -773201416 | 一致 |
| `V0.2.7__agent_execution_lifecycle.sql` | 34 | -1950795910 | -1950795910 | 一致 |
| `V0.2.8__iot_agent_bridge.sql` | 35 | 848290856 | 848290856 | 一致 |
| `V0.2.9__agent_failure_channel_secret.sql` | 36 | -1082555452 | -1082555452 | 一致 |

### 4.2 Repeatable（19/19 一致）

| 脚本 | UAT rank | UAT checksum | 分支 checksum | 结果 |
|---|---:|---:|---:|---|
| `R__i6_notify_menu_reconciliation.sql` | 2 | -1061893576 | -1061893576 | 一致 |
| `R__p62_form_txn_action_menu.sql` | 5 | 742371850 | 742371850 | 一致 |
| `R__bf20261013_catalog_admin_menu.sql` | 7 | -1072873547 | -1072873547 | 一致 |
| `R__p62_iot_command_verify_menu.sql` | 8 | -1808999693 | -1808999693 | 一致 |
| `R__p62_resource_ops_menu.sql` | 9 | -103381364 | -103381364 | 一致 |
| `R__p62_txn_batch_menu.sql` | 10 | 1849138120 | 1849138120 | 一致 |
| `R__p63_iot_reservation_menu.sql` | 11 | 1993303345 | 1993303345 | 一致 |
| `R__p64_approval_form_menu.sql` | 12 | -1583022201 | -1583022201 | 一致 |
| `R__p64_position_delegate_menu.sql` | 13 | 724539293 | 724539293 | 一致 |
| `R__application_center_menu.sql` | 33 | -1799982056 | -1799982056 | 一致 |
| `R__0.1.7_catalog_menu_first.sql` | 17 | 1901749895 | 1901749895 | 一致 |
| `R__0.1.7_org_demo_seed.sql` | 18 | 903739137 | 903739137 | 一致 |
| `R__bf20261020_form_data_admin_grants.sql` | 19 | 1758932666 | 1758932666 | 一致 |
| `R__0.1.10_admin_password.sql` | 20 | -1247627235 | -1247627235 | 一致 |
| `R__0.2.0_approval_opinion_draft.sql` | 23 | 706389587 | 706389587 | 一致 |
| `R__0.2.0_ext_datasource_grant.sql` | 24 | 1436678291 | 1436678291 | 一致 |
| `R__0.2.0_form_integration.sql` | 25 | -801850523 | -801850523 | 一致 |
| `R__u020_user_group_menu.sql` | 26 | -1482148713 | -1482148713 | 一致 |
| `R__0.2.1_workspace_stat_metric_cards.sql` | 27 | -1097573900 | -1097573900 | 一致 |

## 5. 0.4.0 新增条目

| 脚本 | 分支 checksum | UAT 历史 | 说明 |
|---|---:|---|---|
| `V0.4.0__knowledge_vector_persistence.sql` | 1776052103 | 不存在 | 0.4.0 新增 versioned |
| `R__0.4.0_rename_bpm_opinion_comment.sql` | 1839631115 | 不存在 | 0.4.0 新增 repeatable |

机械比对结果：

```text
UAT history rows: 31
UAT unique scripts: 28
Branch files: 30
Matched checksums: 28 / 28
Mismatches: 0
UAT-only scripts: 0
Branch-only scripts: 2 (V0.4.0, R__0.4.0)
```

## 6. 结论

1. UAT 0.3.2 的 28 个唯一迁移脚本，其当前生效校验和与 `feature/0.4.0-multi-database`
   分支逐条一致；UAT jar 内脚本与分支文件 SHA-256 也逐条一致。
2. 0.4.0 分支相对 UAT 只新增 `V0.4.0` 与 `R__0.4.0` 两条，没有修改、删除或重命名既有迁移。
3. `execution-final-01.md` §5 记录的“UAT PostgreSQL 停止导致校验和比对阻塞”已解除。
4. 本次未部署 0.4.0、未改 UAT 数据库、未改 UAT 服务；0.4.0 的合并/发版仍按 Planner §4 与
   0.3.3 补丁顺序执行。

## 7. 证据与复现

本机证据目录（未提交 Git）：

- `E:/code/Smart-WorkFlow-Agent-Evidence/uat-recovery-20261109/uat-flyway-history.csv`
- `.../branch-flyway-checksums.txt`
- `.../uat-jar-migrations.sha256`
- `.../branch-migrations.sha256`
- `.../tools/ChecksumCalc.java`

校验和计算入口：

```bash
java -cp ~/.m2/repository/org/flywaydb/flyway-core/11.3.4/flyway-core-11.3.4.jar \
  ChecksumCalc.java <postgresql-migration-dir>
```

## 8. 约束遵守

- 仅执行 `SELECT` 与只读文件读取；未写 UAT 数据库、未改迁移、未重启服务。
- 未强推、未改写历史、未动 tag；凭据未写入本回执。
