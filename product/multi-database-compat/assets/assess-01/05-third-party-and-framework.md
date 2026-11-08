# 第三方组件与框架的多数据库能力（2026-11-08 核对）

## Flowable 7.1.0

从本机 Maven 仓库 `flowable-engine-common-7.1.0.jar` 的 `org/flowable/common/engine/impl/util/DbUtil.class` 读取默认映射：

| 数据库产品名 | Flowable databaseType |
|---|---|
| H2 | h2 |
| HSQL Database Engine | hsql |
| MySQL | mysql |
| MariaDB | mysql |
| Oracle | oracle |
| PostgreSQL | postgres |
| Microsoft SQL Server | mssql |
| DB2 系列 | db2 |
| CockroachDB | cockroachdb |

结论：

- Flowable 7.1.0 没有达梦、KingbaseES、openGauss 的默认映射。
- 可通过 `databaseTypeMappings` 配置把产品名映射到已有类型：
  - 达梦 → `oracle`（需达梦 Oracle 兼容模式，Flowable 的 Oracle DDL/序列可用性待实测）
  - KingbaseES → `postgres`
  - openGauss → `postgres`
- 应用当前 `spring.flowable.database-schema-update`：默认 profile `true`，prod/local/dev 为 `false`；新建库验证时可用 `true` 让 Flowable 自建 `ACT_*` 表，随后在生产 profile 关闭。
- Flowable 的 DDL 会创建自己的表、索引和序列；这些表不在本项目 Flyway 脚本内，由 Flowable 自己管理。

## Quartz

- `sw-basic-job` 使用 `spring-boot-starter-quartz`，未配置 `spring.quartz.job-store-type`，默认 RAMJobStore。
- `JobStartupRunner` 注释明确：“Quartz 默认使用 RAMJobStore，应用重启后所有已注册的 Job 丢失；启动时从 `sw_job_info` 恢复”。
- 因此不需要为 Quartz 准备 `QRTZ_*` 表；`sw_job_info` / `sw_job_log` 由本项目迁移脚本覆盖。

## MyBatis-Plus 3.5.9

- `DbType` 枚举包含：`MYSQL`、`MARIADB`、`ORACLE`、`SQL_SERVER`、`DM`、`KINGBASE_ES`、`OPENGAUSS`、`GAUSS` 等。
- `JdbcUtils.getDbType` 的 URL 识别包含：`:mysql:`、`:mariadb:`、`:oracle:`、`:sqlserver:`、`:dm\d*:`、`:kingbase\d*:`、`:opengauss:`、`:postgresql:`、`:h2:`。
- `PaginationInnerInterceptor` 当前未显式传 DbType，按 JDBC URL 自动识别；上述数据库可以命中。
- 风险点不是分页主路径，而是 97 处 `.last("LIMIT …")` 和 4 处手写 `LIMIT ? OFFSET ?`：它们绕过分页插件；Oracle 19c 需 `FETCH FIRST`，SQL Server 需 `TOP`/`OFFSET ... FETCH`，MySQL 5.7 支持 `LIMIT`。

## Spring Boot 3.4.4

- `org.springframework.boot.jdbc.DatabaseDriver` 只包含：DERBY、H2、HSQLDB、SQLITE、MYSQL、MARIADB、ORACLE、POSTGRESQL、REDSHIFT、HANA、JTDS、SQLSERVER、FIREBIRD、DB2、DB2_AS400、TERADATA、INFORMIX、PHOENIX、TESTCONTAINERS、CLICKHOUSE。
- 不含 DM、KingbaseES、openGauss；`DatabaseDriver.fromJdbcUrl` 对这三种返回 `UNKNOWN`。
- `spring.flyway.locations` 的 `{vendor}` 占位符由 Spring Boot 的 `FlywayAutoConfiguration$LocationResolver` 解析，解析依据就是 `DatabaseDriver.getId()`；UNKNOWN 时保留字面量 `{vendor}`，不会替换成实际目录。
- `FlywayConfiguration.detectVendor` 同样使用 `DatabaseDriver.fromJdbcUrl`，因此 DM/Kingbase/openGauss 会得到 `unknown`，`db/prod-update/unknown` 不存在。

## Flyway 11.3.4

- 本机依赖：`flyway-core`、`flyway-database-postgresql`、`flyway-mysql`。
- 核心内置数据库类型只有 H2、SQLite；PostgreSQL/MySQL/MariaDB 由模块提供。
- Maven Central 上有 `flyway-database-oracle`、`flyway-sqlserver`、`flyway-database-db2`；没有达梦、KingbaseES、openGauss 模块（也没有 `flyway-community-db-support` 对应模块）。
- Oracle 模块的 `OracleDatabaseType` 继承 `BaseDatabaseType`；在 `FlywayExecutor` 中只看到对 `CommunityDatabaseType` 的公告分支，没有发现针对 Oracle 数据库类型的运行期 license guard。正式采用前仍需核对 Redgate 的许可条款。
- 结论：H2/PostgreSQL/MySQL/MariaDB/Oracle/SQL Server 可以继续用 Flyway；达梦/Kingbase/openGauss 需要额外方案（见回执 §3.3）。
