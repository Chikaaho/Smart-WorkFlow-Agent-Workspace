# 迁移脚本清单（PostgreSQL 目录，2026-11-08 盘点）

目录：Smart-WorkFlow-aPaaS-server/sw-bootstrap/src/main/resources/db/migration/postgresql

H2 目录文件集合同名同数量（28 个），内容为方言翻译版。版本链：V0.2.0 → V0.2.9（9 支 versioned），R__ 19 支。

| 文件 | 行数 | COMMENT ON | BOOLEAN | JSONB | TEXT | IF NOT EXISTS | ALTER COLUMN | ROW_NUMBER | ON CONFLICT | DO BLOCK | EXTENSION | LIMIT | FOR UPDATE | SERIAL/SEQ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R__0.1.10_admin_password.sql | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__0.1.7_catalog_menu_first.sql | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__0.1.7_org_demo_seed.sql | 265 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__0.2.0_approval_opinion_draft.sql | 24 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__0.2.0_ext_datasource_grant.sql | 18 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__0.2.0_form_integration.sql | 93 | 1 | 0 | 0 | 2 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__0.2.1_workspace_stat_metric_cards.sql | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__application_center_menu.sql | 93 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__bf20261013_catalog_admin_menu.sql | 29 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__bf20261020_form_data_admin_grants.sql | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__i6_notify_menu_reconciliation.sql | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__p62_form_txn_action_menu.sql | 27 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__p62_iot_command_verify_menu.sql | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__p62_resource_ops_menu.sql | 36 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__p62_txn_batch_menu.sql | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__p63_iot_reservation_menu.sql | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__p64_approval_form_menu.sql | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__p64_position_delegate_menu.sql | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| R__u020_user_group_menu.sql | 39 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| V0.2.0__baseline_seed.sql | 5646 | 308 | 27 | 10 | 107 | 136 | 28 | 1 | 1 | 2 | 0 | 0 | 0 | 1 |
| V0.2.2__f1_agent_provider_model.sql | 95 | 7 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| V0.2.3__f1_stage2_graph_snapshot.sql | 59 | 6 | 4 | 0 | 2 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| V0.2.4__f1_stage2_execution_node_detail.sql | 20 | 6 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| V0.2.5__f1_stage3_knowledge_rag.sql | 93 | 9 | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| V0.2.6__f2_app_bundle.sql | 74 | 0 | 0 | 0 | 1 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| V0.2.7__agent_execution_lifecycle.sql | 43 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| V0.2.8__iot_agent_bridge.sql | 21 | 0 | 0 | 0 | 1 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| V0.2.9__agent_failure_channel_secret.sql | 12 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

合计行数：6865

## 说明

- COMMENT ON：PostgreSQL/H2/Oracle/达梦/Kingbase/openGauss 支持；MySQL、SQL Server 不支持，MySQL 需内联 COMMENT，SQL Server 需扩展属性。
- BOOLEAN：PostgreSQL/H2/MariaDB/Kingbase/openGauss 原生；MySQL 为 TINYINT(1)，Oracle 为 NUMBER(1)，SQL Server 为 BIT，达梦待实测。
- JSONB：PostgreSQL/Kingbase/openGauss 原生；MySQL 用 JSON，Oracle/达梦用 CLOB，SQL Server 用 NVARCHAR(MAX)。
- TEXT：PostgreSQL/Kingbase/openGauss 原生；MySQL 用 LONGTEXT/TEXT，Oracle/达梦用 CLOB，SQL Server 用 NVARCHAR(MAX)。
- IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS / DROP INDEX IF EXISTS：MySQL 5.7、Oracle 19c、SQL Server 均需改写。
- ALTER COLUMN ... TYPE ... USING：PostgreSQL 专有；其余数据库用 MODIFY/ALTER COLUMN 改写。
- ROW_NUMBER() OVER：MySQL 5.7 不支持窗口函数；需改写为相关子查询计数或分步插入。
- DO 37702 + CREATE EXTENSION vector：仅 PostgreSQL；非 PostgreSQL 数据库无 pgvector。
- LIMIT/FOR UPDATE：迁移脚本中未使用；运行时 Java SQL 中存在。
