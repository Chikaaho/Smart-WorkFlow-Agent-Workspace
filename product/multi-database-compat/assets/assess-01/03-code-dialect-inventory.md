# 运行时代码方言点清单（2026-11-08 盘点）

扫描范围：1142 个 src/main/java 文件。

## 注解 SQL 与 Mapper

| 构造 | 次数 |
|---|---|
| @Select | 50 |
| @Insert | 2 |
| @Update | 8 |
| @Delete | 45 |
| Mapper XML | 0（仓库无 *Mapper.xml） |

## LIMIT（MyBatis-Plus .last 与手写 SQL）

- `.last("LIMIT …")` 调用文件数：52；调用点：97

| 模块 | 调用点 |
|---|---|
| sw-biz/sw-bpm | 41 |
| sw-biz/sw-biz-form | 16 |
| sw-basic/sw-basic-iot | 14 |
| sw-basic/sw-basic-notify | 9 |
| sw-biz/sw-biz-system | 9 |
| sw-basic/sw-basic-agent | 4 |
| sw-biz/sw-biz-openapi | 3 |
| sw-basic/sw-basic-job | 1 |

- 手写 `LIMIT ? OFFSET ?`：4 处（FormDataQueryService 2、BpmResourceOpsService 2）。
- `@Select` 内含 LIMIT：SsoAuthStateMapper 等（随注解 SQL 一并纳入重写）。
- 分页主路径 MyBatis-Plus PaginationInnerInterceptor 未显式指定 DbType，按 JDBC URL 自动识别；DbType 3.5.9 含 MYSQL/MARIADB/ORACLE/SQL_SERVER/DM/KINGBASE_ES/OPENGAUSS/GAUSS。

## 行锁

| 位置 | 写法 |
|---|---|
| sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/dynamic/DynamicTableSql.java:306 | `+ livePredicate() + " FOR UPDATE";` |
| sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/dynamic/DynamicTableSql.java:312 | `return !query(jdbcTemplate, table, sql.replace(" FOR UPDATE", ""), recordId, tenantId).isEmpty();` |
| sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysTenantMapper.java:21 | `@Select("SELECT * FROM sys_tenant WHERE id = #{id} AND deleted = 0 FOR UPDATE")` |
| sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/mapper/BpmCommandMapper.java:19 | `@Select("SELECT id, status, claim_token, tenant_id FROM sw_bpm_command WHERE id = #{id} FOR UPDATE")` |
| sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/mapper/BpmInstanceMapper.java:101 | `+ "AND deleted = 0 FOR UPDATE")` |
| sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/mapper/BpmResourceUsageMapper.java:62 | `+ "AND segment = #{segment} FOR UPDATE SKIP LOCKED")` |
| sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmUrgeServiceImpl.java:305 | `jdbcTemplate.queryForList("SELECT id FROM sw_bpm_instance WHERE id = ? FOR UPDATE",` |

- `FOR UPDATE SKIP LOCKED`：BpmResourceUsageMapper:62；MySQL 5.7 不支持 SKIP LOCKED，SQL Server 不支持 FOR UPDATE 语法，需方言策略。

## JSON / 向量 / 标识符

- `JsonStringTypeHandler`（sw-biz-form）：使用 `ps.setObject(i, parameter, Types.OTHER)`，依赖 PostgreSQL jsonb 语义，用于 8 个实体字段。
- `PgKnowledgeVectorStore`：`embedding <=> CAST(? AS vector)`，pgvector 专有；`KnowledgeVectorColumnInitializer` 查询 `pg_extension`/`pg_available_extensions`。
- `DynamicTableSql.quote` 固定返回双引号；`VendorDialect` 仅 H2、POSTGRESQL 两个枚举，未知数据库默认 H2。
- `DynamicTableManager` 动态宽表列类型经 VendorDialect 映射；H2 用 CLOB，PostgreSQL 用 TEXT。
- `FlywayConfiguration.detectVendor` 使用 Spring `DatabaseDriver.fromJdbcUrl`；Spring Boot 3.4.4 的 DatabaseDriver 不含 DM/Kingbase/openGauss，返回 UNKNOWN。
- Spring Boot `{vendor}` 占位符同样由 `DatabaseDriver.getId()` 解析；UNKNOWN 时保留字面量 `{vendor}`，不会指向实际目录。

