# SQL 种子盘点（PostgreSQL 目录，2026-11-08）

目录：Smart-WorkFlow-aPaaS-server/sw-bootstrap/src/main/resources/db/migration/postgresql

- 种子全部位于 Flyway 迁移脚本内：`V0.2.0__baseline_seed.sql`（基线）与 `R__*.sql`（可重复对账）。
- 表数量：18；INSERT 语句数：340。

| 表 | INSERT 语句数 | 涉及文件 |
|---|---|---|
| sys_menu | 159 | R__0.2.0_form_integration.sql, R__application_center_menu.sql, R__bf20261013_catalog_admin_menu.sql, R__i6_notify_menu_reconciliation.sql, R__p62_form_txn_action_menu.sql, R__p62_iot_command_verify_menu.sql, R__p62_resource_ops_menu.sql, R__p62_txn_batch_menu.sql, R__p63_iot_reservation_menu.sql, R__p64_approval_form_menu.sql, R__p64_position_delegate_menu.sql, R__u020_user_group_menu.sql, V0.2.0__baseline_seed.sql, V0.2.6__f2_app_bundle.sql |
| sys_role_menu | 49 | R__0.1.7_org_demo_seed.sql, R__0.2.0_form_integration.sql, R__application_center_menu.sql, R__bf20261013_catalog_admin_menu.sql, R__bf20261020_form_data_admin_grants.sql, R__p62_form_txn_action_menu.sql, R__p62_iot_command_verify_menu.sql, R__p62_resource_ops_menu.sql, R__p62_txn_batch_menu.sql, R__p63_iot_reservation_menu.sql, R__p64_approval_form_menu.sql, R__p64_position_delegate_menu.sql, R__u020_user_group_menu.sql, V0.2.0__baseline_seed.sql, V0.2.6__f2_app_bundle.sql |
| sys_user | 29 | R__0.1.7_org_demo_seed.sql, V0.2.0__baseline_seed.sql |
| sys_user_role | 29 | R__0.1.7_org_demo_seed.sql, V0.2.0__baseline_seed.sql |
| sys_dict_data | 17 | V0.2.0__baseline_seed.sql |
| sys_dept | 15 | R__0.1.7_org_demo_seed.sql, V0.2.0__baseline_seed.sql |
| sys_workspace_card_type | 11 | R__0.2.1_workspace_stat_metric_cards.sql, V0.2.0__baseline_seed.sql |
| sys_role | 7 | R__0.1.7_org_demo_seed.sql, V0.2.0__baseline_seed.sql |
| sys_dict_type | 6 | V0.2.0__baseline_seed.sql |
| sys_tenant | 4 | R__0.1.7_org_demo_seed.sql, V0.2.0__baseline_seed.sql |
| sw_bpm_resource_usage | 4 | V0.2.0__baseline_seed.sql |
| sw_bpm_node_function | 3 | V0.2.0__baseline_seed.sql |
| sw_form_app | 2 | V0.2.0__baseline_seed.sql |
| sw_openapi_app | 1 | V0.2.0__baseline_seed.sql |
| sw_form_app_scope | 1 | V0.2.0__baseline_seed.sql |
| sw_agent_provider | 1 | V0.2.2__f1_agent_provider_model.sql |
| sw_agent_model | 1 | V0.2.2__f1_agent_provider_model.sql |
| sw_agent_graph_snapshot | 1 | V0.2.3__f1_stage2_graph_snapshot.sql |

## 种子中的非通用写法

| 写法 | 次数/位置 | 影响 |
|---|---|---|
| `ROW_NUMBER() OVER (ORDER BY ...)` | 10 处：R__application_center_menu ×3、R__bf20261020_form_data_admin_grants ×1、R__u020_user_group_menu ×2、V0.2.6 ×2、V0.2.0 基线 ×1、其余为注释 | MySQL 5.7 无窗口函数，需改为相关子查询计数或分步插入 |
| `ON CONFLICT (id) DO NOTHING` | V0.2.0 基线 1 处（tenant-0） | MySQL 用 INSERT IGNORE/ON DUPLICATE KEY，Oracle/达梦用 MERGE，SQL Server 用 IF NOT EXISTS |
| 空字符串字面量 `''` | 280 处（主要在 R__0.1.7_org_demo_seed 的组织/部门种子） | Oracle 将 '' 视为 NULL，逐表比对需把空字符串列排除或按 NULL 口径比较 |
| 多行 VALUES | 0 处（全部单行 INSERT ... VALUES 或 INSERT ... SELECT） | Oracle 无多行 VALUES 问题 |
| 布尔字面量 `false/true` | 33 处（boolean 列与菜单 hidden） | MySQL 用 0/1，Oracle/达梦用 0/1，SQL Server 用 0/1 |
| `INSERT ... SELECT ... WHERE NOT EXISTS` | R__ 对账脚本普遍使用 | 可移植；MySQL 5.7 需注意子查询不能引用同表更新的限制（本处为 INSERT 自表 SELECT，需实测） |
| `UPDATE ... SET ... WHERE id = ...` | R__ 脚本 | 可移植 |
| 固定主键 id | 全部种子显式给 id | 不依赖自增/序列；与雪花 ID 运行期策略一致 |

## 关键种子基线（空库预期）

- 默认租户：`sys_tenant` id=1（default）与 id=0（tenant-0，I5 收口）；重复执行由 ON CONFLICT 兜底。
- 菜单：`sys_menu` 159 条 INSERT 语句；角色：`sys_role` 7 条；角色菜单：`sys_role_menu` 49 条语句（部分按现有角色集合展开）。
- 用户与授权：`sys_user` 29、`sys_user_role` 29；组织：`sys_dept` 15。
- 字典：`sys_dict_type` 6、`sys_dict_data` 17。
- 工作台：`sys_workspace_card_type` 11。
- 业务种子：`sw_bpm_resource_usage` 4、`sw_bpm_node_function` 3、`sw_form_app` 2、`sw_form_app_scope` 1、`sw_openapi_app` 1、`sw_agent_provider` 1、`sw_agent_model` 1、`sw_agent_graph_snapshot` 1。

行数以实际执行后 `COUNT(*)` 为准；部分 R__ 语句按现有角色/菜单集合展开，不能直接用语句数当行数。

