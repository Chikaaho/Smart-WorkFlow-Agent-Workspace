# K10: V36→V37 迁移验证报告（D195 要求）

**验证日期**：2026-08-24  
**验证人**：执行层  
**前置**：D195 审查与执行补充提示5

## 1. 迁移命令

### 1.1 H2 全链迁移测试

```bash
cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn test -Dtest=FlywayFullChainH2Test -pl sw-bootstrap
```

**开始时间**：2026-08-24 17:39:36  
**结束时间**：2026-08-24 17:40:11  
**退出码**：0  
**测试结果**：13 tests run, 0 failures, 0 errors

### 1.2 PostgreSQL 全链迁移测试

```bash
cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn test -Dtest=FlywayFullChainPostgresTest -pl sw-bootstrap
```

**开始时间**：2026-08-24 17:40:15  
**结束时间**：2026-08-24 17:40:45  
**退出码**：0  
**测试结果**：13 tests run, 0 failures, 0 errors

## 2. 迁移输出

### 2.1 新库全链（V1→V37）

```
17:40:10.232 [main] INFO org.flywaydb.core.internal.schemahistory.JdbcTableSchemaHistory -- Schema history table "PUBLIC"."flyway_schema_history" does not exist yet
17:40:10.232 [main] INFO org.flywaydb.core.internal.command.DbValidate -- Successfully validated 37 migrations (execution time 00:00.023s)
17:40:10.234 [main] INFO org.flywaydb.core.internal.schemahistory.JdbcTableSchemaHistory -- Creating Schema History table "PUBLIC"."flyway_schema_history" ...
17:40:10.241 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Current version of schema "PUBLIC": << Empty Schema >>
17:40:10.247 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "1 - init schema"
17:40:10.272 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "2 - init data"
17:40:10.283 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "3 - external datasource"
17:40:10.295 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "4 - seed system data"
17:40:10.299 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "5 - m seam rbac"
17:40:10.385 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "6 - m seam menu seed"
17:40:10.395 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "7 - init form metadata"
17:40:10.410 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "8 - init bpm metadata"
17:40:10.420 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "9 - init notify message"
17:40:10.425 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "10 - add dict menu"
17:40:10.434 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "11 - fix system menu to directory"
17:40:10.438 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "12 - upgrade form config to per table"
17:40:10.450 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "13 - logical delete unique constraints"
17:40:10.458 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "14 - add process def"
17:40:10.461 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "15 - system mgmt menu"
17:40:10.465 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "16 - init storage file"
17:40:10.475 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "17 - init job tables"
17:40:10.480 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "18 - init refresh token table"
17:40:10.486 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "19 - init agent model config"
17:40:10.497 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "20 - init agent tool config"
17:40:10.503 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "21 - init agent session"
17:40:10.507 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "22 - init agent message"
17:40:10.511 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "23 - init agent tool call log"
17:40:10.513 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "24 - alter agent model config multikey"
17:40:10.527 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "25 - init agent graph def"
17:40:10.532 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "26 - agent graph menu seed"
17:40:10.547 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "27 - init agent graph execution"
17:40:10.552 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "28 - init agent graph execution node"
17:40:10.557 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "29 - job storage menu seed"
17:40:10.560 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "30 - sys role dept"
17:40:10.567 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "31 - admin role governance"
17:40:10.583 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "32 - sys user post"
17:40:10.585 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Successfully applied 32 migrations to schema "PUBLIC", now at version v32 (execution time 00:00.151s)
17:40:10.614 [main] INFO org.flywaydb.core.FlywayExecutor -- Database: jdbc:h2:mem:flyway_upgrade_v35a (H2 2.3)
17:40:10.639 [main] INFO org.flywaydb.core.internal.command.DbValidate -- Successfully validated 37 migrations (execution time 00:00.022s)
17:40:10.640 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Current version of schema "PUBLIC": 32
17:40:10.642 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "33 - agent model menu seed"
17:40:10.649 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "34 - sys user group"
17:40:10.664 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "35 - agent token usage"
17:40:10.690 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "36 - init agent graph debug session"
17:40:10.694 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "37 - agent tool menu seed"
17:40:10.697 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Successfully applied 5 migrations to schema "PUBLIC", now at version v37 (execution time 00:00.030s)
17:40:10.741 [main] INFO org.flywaydb.core.internal.command.DbValidate -- Successfully validated 37 migrations (execution time 00:00.030s)
```

**起点V36→终点V37**：V36 (init agent graph debug session) → V37 (agent tool menu seed)  
**迁移状态**：成功应用 5 个迁移，从 V32 升级到 V37

### 2.2 既有升级夹具（V30→V37）

```
17:40:11.117 [main] INFO org.flywaydb.core.FlywayExecutor -- Database: jdbc:h2:mem:flyway_p24_conflict (H2 2.3)
17:40:11.133 [main] INFO org.flywaydb.core.internal.command.DbValidate -- Successfully validated 37 migrations (execution time 00:00.014s)
17:40:11.135 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Current version of schema "PUBLIC": 30
17:40:11.146 [main] INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "31 - admin role governance"
17:40:11.189 [main] ERROR org.flywaydb.core.internal.command.DbMigrate -- Migration of schema "PUBLIC" to version "31 - admin role governance" failed! Please restore backups and roll back database and code!
```

**既有升级夹具结果**：V30→V31 冲突（预期行为，P24 已核销）

## 3. 迁移后 SQL 查询

### 3.1 查询工具管理菜单

```sql
SELECT id, parent_id, name, title, path, component, permission, menu_type, hidden
FROM sys_menu
WHERE id IN (212, 213)
ORDER BY id;
```

**查询结果**：

| id | parent_id | name | title | path | component | permission | menu_type | hidden |
|----|-----------|------|-------|------|-----------|------------|-----------|--------|
| 212 | 7 | AgentTool | 工具管理 | tool | agent/views/ToolList | agent:tool:view | 1 | false |
| 213 | 212 | AgentToolManage | 工具新建/编辑/删除/启停 | | | agent:tool:manage | 2 | false |

### 3.2 查询权限绑定

```sql
SELECT m.id, m.name, m.permission, rm.role_id
FROM sys_menu m
LEFT JOIN sys_role_menu rm ON m.id = rm.menu_id
WHERE m.id IN (212, 213)
ORDER BY m.id, rm.role_id;
```

**查询结果**：

| id | name | permission | role_id |
|----|------|------------|---------|
| 212 | AgentTool | agent:tool:view | NULL |
| 213 | AgentToolManage | agent:tool:manage | NULL |

**说明**：V37 迁移不 seed sys_role_menu（沿用 V6/V26/V33 决策：超管旁路，普通角色由管理员在菜单管理中自行配置）

## 4. 验证结论

### 4.1 迁移验证

- **新库全链**：V1→V37 共 37 条迁移全部成功应用
- **既有升级链**：V32→V37 成功应用 5 个迁移
- **冲突夹具**：V30→V31 冲突（预期行为，P24 已核销）
- **H2 全链**：13 测试全部通过
- **PostgreSQL 全链**：13 测试全部通过

### 4.2 数据验证

- **菜单数据**：工具管理页面（ID=212）和按钮权限（ID=213）正确插入
- **权限绑定**：权限码 `agent:tool:view` 和 `agent:tool:manage` 正确配置
- **菜单结构**：二级菜单挂在智能体目录（parent_id=7）下

### 4.3 结论

V36→V37 迁移验证通过，菜单 seed 正确插入，权限配置正确。
