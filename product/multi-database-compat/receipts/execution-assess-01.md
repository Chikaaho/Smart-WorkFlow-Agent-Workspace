# P66 多数据库兼容：阶段 A 能力核对与方案（execution-assess-01）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容：迁移脚本与 SQL 种子适配（XL，目标版本 0.4.0） |
| 方向 | `product/multi-database-compat/ready/direction-multi-database-compat.md` |
| 阶段 | 阶段 A：能力核对与方案（只读，未改业务代码） |
| 日期 | 2026-11-08 |
| 执行角色 | Executor |
| 自验结论 | 阶段 A 完成，方案待 Planner 确认后进入阶段 B |
| 七阶段进度 | **1 / 1 / 5**（需求评估完成；执行阶段进行中，阶段 A 已完成；验收与同步、合并、发版、发布后同步、结束未开始） |

## 1. 结论

P66 可以实施，但不能只加方言目录。现有代码把 PostgreSQL 的语义带进了运行时 SQL、JSON 写入、标识符引用和迁移引擎。盘点后有三类问题必须先定方案：

1. **迁移引擎覆盖不全**：Flyway 11.3.4 没有达梦、KingbaseES、openGauss 的数据库模块；Spring Boot 3.4.4 也不认识这三种 JDBC URL，`{vendor}` 占位符会保留字面量，主迁移目录不会被解析。
2. **运行时 SQL 有 97 处 `.last("LIMIT …")`**：这些语句绕过了 MyBatis-Plus 的分页方言层；Oracle 19c 和 SQL Server 不能直接执行 `LIMIT`。
3. **达梦、金仓的官方容器镜像不可公开获得**：公共 registry 只有社区镜像，许可证和二进制来源不明确；Oracle 19c 同样需要授权镜像，公开可用的是 21c XE。

建议按“每方言独立脚本 + 运行时方言抽象 + 三种不支持数据库的自有迁移执行器”推进。阶段 A 已做的实测与证据见第 2、5 节。

## 2. 盘点结果

### 2.1 迁移脚本与配置

生产迁移脚本只在 `Smart-WorkFlow-aPaaS-server/sw-bootstrap/src/main/resources/db/migration/` 下：

| 目录 | 文件数 | 行数 | 状态 |
|---|---:|---:|---|
| `h2/` | 28 | 6,558 | 现有，保持不动 |
| `postgresql/` | 28 | 6,864 | 现有，保持不动 |
| `mysql/` | 0 个 SQL | — | 只有 README 占位 |
| `oracle/` | 0 个 SQL | — | 只有 README 占位 |
| `postgresql/` 的版本链 | 9 支 versioned（V0.2.0 + V0.2.2—V0.2.9） | — | 终点 V0.2.9 |
| `postgresql/` 的可重复脚本 | 19 支 `R__` | — | 菜单、角色授权、演示组织、管理员口令等对账 |

H2 与 PostgreSQL 目录文件名一一对应，内容是按方言翻译的两套脚本。`db/upgrade/0.1.5`—`0.2.0` 是历史升级通道，不在 Flyway 主扫描位置，不计入本次翻译范围。`db/prod-update/{h2,postgresql,mysql,oracle}` 目前只有占位文件，没有 SQL。

迁移位置配置在 `sw-bootstrap/src/main/resources/application.yml`：

```yaml
flyway:
  enabled: true
  locations:
    - classpath:db/migration/{vendor}
    - classpath:db/migration/bpm/{vendor}
    - classpath:db/migration/notify/{vendor}
    # …form/storage/job/agent/iot/openapi/system，共 10 组
  baseline-on-migrate: true
  validate-on-migrate: true
  table: flyway_schema_history
```

`{vendor}` 不是 Flyway 解析的，是 Spring Boot 的 `FlywayAutoConfiguration$LocationResolver` 用 `DatabaseDriver.getId()` 替换的。当前生效的 ID：`h2`、`postgresql`、`mysql`、`mariadb`、`oracle`、`sqlserver`。Spring Boot 3.4.4 的 `DatabaseDriver` 不含 DM、KingbaseES、openGauss；这三种会得到 `UNKNOWN`，`{vendor}` 原样保留。

`FlywayConfiguration.detectVendor` 也用同一个 `DatabaseDriver.fromJdbcUrl` 决定 `db/prod-update/{vendor}`，三种数据库同样会得到 `unknown`。

### 2.2 迁移脚本中的非通用写法

按 PostgreSQL 目录统计（H2 目录为对应方言版本）：

| 写法 | 出现次数 | 主要位置 | 受影响的数据库与处理方向 |
|---|---:|---|---|
| `COMMENT ON` | 337 | 基线 308，其余分散在各增量与 R__ | MySQL、SQL Server 不支持；MySQL 改内联 COMMENT，SQL Server 省略或扩展属性 |
| `BOOLEAN` | 33 | 基线、V0.2.2、V0.2.3 | MySQL `TINYINT(1)`，Oracle `NUMBER(1)`，SQL Server `BIT`，达梦待实测 |
| `JSONB` | 10 | 基线、V0.2.2 等 | MySQL `JSON`，Oracle/达梦 `CLOB`，SQL Server `NVARCHAR(MAX)`；Kingbase/openGauss 原生 |
| `TEXT` | 125 | 基线 107，其余分散 | MySQL `LONGTEXT`，Oracle/达梦 `CLOB`，SQL Server `NVARCHAR(MAX)` |
| `IF NOT EXISTS` | 160 | 基线 136，其余分散 | MySQL 5.7、Oracle 19c、SQL Server 不支持 `ADD COLUMN IF NOT EXISTS`/`CREATE INDEX IF NOT EXISTS`，需改写 |
| `ALTER COLUMN` | 34 | 基线 28、V0.2.3 6 | PostgreSQL 的 `ALTER COLUMN ... TYPE ... USING` 需改为 `MODIFY`/`ALTER COLUMN` |
| `ROW_NUMBER() OVER` | 10 | 基线、R__ 菜单授权、V0.2.6 | MySQL 5.7 无窗口函数；改用相关子查询计数或分步插入 |
| `ON CONFLICT` | 1 | 基线 tenant-0 | MySQL 用 `INSERT IGNORE`/`ON DUPLICATE KEY`，Oracle/达梦用 `MERGE`，SQL Server 用 `IF NOT EXISTS` |
| `DO $$` + `CREATE EXTENSION vector` | 各 1 | V0.2.5 | 仅 PostgreSQL；其余数据库没有 pgvector |
| `LIMIT` / `FOR UPDATE` | 0 | 迁移脚本 | 迁移脚本不依赖；运行时 Java SQL 有 |
| 自增/序列 | 0 | 全部种子显式给 id | 不依赖数据库自增；运行期用雪花 ID |
| 最长标识符 | 41 字符 | `idx_sw_agent_tool_external_tenant_deleted` | Oracle 19c、SQL Server、MySQL 64、PostgreSQL 63 均可容纳；Oracle 11g 不在范围 |

逐文件统计见 `assets/assess-01/01-migrations-inventory.md`。`V0.2.0__baseline_seed.sql` 单文件 5,646 行，是翻译量的主体；其余 27 支合计约 1,200 行。

### 2.3 SQL 种子

种子没有单独的 `seed/` 目录，全部在 Flyway 脚本里：`V0.2.0__baseline_seed.sql` 是基线，`R__*.sql` 是可重复对账脚本。

| 表 | INSERT 语句数 | 说明 |
|---|---:|---|
| `sys_menu` | 159 | 菜单树主体，含 R__ 增量菜单 |
| `sys_role_menu` | 49 | 部分语句按现有角色集合展开，行数不等于语句数 |
| `sys_user` / `sys_user_role` | 29 / 29 | 默认超管、演示租户用户与角色关联 |
| `sys_dept` | 15 | 演示组织树 |
| `sys_dict_data` / `sys_dict_type` | 17 / 6 | 字典 |
| `sys_workspace_card_type` | 11 | 工作台卡片类型 |
| `sys_role` | 7 | 角色模板 |
| `sys_tenant` | 4 | 默认租户与 tenant-0 |
| `sw_bpm_resource_usage` / `sw_bpm_node_function` | 4 / 3 | BPM 资源段与节点函数 |
| `sw_form_app` / `sw_form_app_scope` | 2 / 1 | 应用与可见范围 |
| `sw_openapi_app` | 1 | OpenAPI 应用 |
| `sw_agent_provider` / `sw_agent_model` / `sw_agent_graph_snapshot` | 1 / 1 / 1 | Agent 供应商、模型、图快照 |

共 18 张表、340 条 INSERT 语句。逐表清单见 `assets/assess-01/02-seed-inventory.md`。

需要单独处理的种子写法：

- `ROW_NUMBER() OVER (ORDER BY ...)` 用于 `sys_role_menu` 的 id 顺延，MySQL 5.7 不支持。
- `ON CONFLICT (id) DO NOTHING` 只有 tenant-0 一处，改写成本低。
- 280 处空字符串 `''`，主要集中在演示组织种子；Oracle 把 `''` 当 `NULL`，逐表比对时要按关键值口径或 `NULLIF` 归一化，否则 Oracle 会与 PostgreSQL 产生“差异”。
- 全部种子显式给主键 id，不依赖自增；这降低了 Oracle/达梦序列适配的难度。
- `INSERT ... SELECT ... WHERE NOT EXISTS` 是可移植写法；Oracle 需要补 `FROM dual`（常量 SELECT 在 Oracle 没有 FROM 时会报错），达梦 Oracle 兼容模式同样处理。

### 2.4 运行时 SQL 与数据访问

- 仓库没有 `*Mapper.xml`；SQL 主要在 `@Select`（50 处）、`@Insert`（2）、`@Update`（8）、`@Delete`（45）和 `JdbcTemplate` 里。
- **97 处 `.last("LIMIT …")`**，分布在 52 个文件：BPM 41、Form 16、IoT 14、Notify 9、System 9、Agent 4、OpenAPI 3、Job 1。另有 4 处手写 `LIMIT ? OFFSET ?`（FormDataQueryService 2、BpmResourceOpsService 2）。
- **6 处真实行锁 SQL**（另有注释和字符串替换不计）：
  - `DynamicTableSql:306`：动态宽表 `FOR UPDATE`；
  - `SysTenantMapper:21`：租户行 `FOR UPDATE`；
  - `BpmCommandMapper:19`：命令领取 `FOR UPDATE`；
  - `BpmInstanceMapper:101`：流程实例根链 `FOR UPDATE`；
  - `BpmResourceUsageMapper:62`：`FOR UPDATE SKIP LOCKED`；
  - `BpmUrgeServiceImpl:305`：实例 `FOR UPDATE`。
- `JsonStringTypeHandler` 用 `ps.setObject(i, parameter, Types.OTHER)` 写 JSON，依赖 PostgreSQL jsonb 的 JDBC 语义，当前用于 8 个实体字段。MySQL、Oracle、SQL Server、达梦需要按方言改写绑定方式。
- `PgKnowledgeVectorStore` 使用 `embedding <=> CAST(? AS vector)`；`KnowledgeVectorColumnInitializer` 查询 `pg_extension`/`pg_available_extensions`。这是 pgvector 专有链路，非 PostgreSQL 数据库没有等价物。
- `VendorDialect` 只有 `H2`、`POSTGRESQL` 两个枚举，未知数据库默认 H2；`DynamicTableSql.quote` 固定返回双引号；`DynamicTableManager` 的动态宽表 DDL 依赖该枚举的列类型映射。
- MyBatis-Plus 3.5.9 的 `DbType` 已包含 `MYSQL`、`MARIADB`、`ORACLE`、`SQL_SERVER`、`DM`、`KINGBASE_ES`、`OPENGAUSS`；`PaginationInnerInterceptor` 未显式指定 DbType，按 JDBC URL 自动识别，分页主路径本身没有方言硬编码。
- ID 策略是 MyBatis-Plus 雪花 `ASSIGN_ID` 或业务层 `INPUT`，没有 `IdType.AUTO`；不依赖数据库自增。

### 2.5 第三方组件

**Flowable 7.1.0**

`flowable-engine-common-7.1.0.jar` 的 `DbUtil` 默认映射：

| 产品名 | databaseType |
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

没有达梦、KingbaseES、openGauss 的默认映射。可通过 `databaseTypeMappings` 把产品名映射到 `oracle`/`postgres`；Spring Boot 的 `FlowableProperties` 没有这个属性，需要在 `ProcessEngineConfigurationConfigurer` 里设置。应用当前 `flowable.database-schema-update`：默认 profile `true`，prod/local/dev `false`；新建库验证时可用 `true` 让 Flowable 自建 `ACT_*` 表。

**Quartz**

`spring-boot-starter-quartz` 未配置 `job-store-type`，默认 RAMJobStore；`JobStartupRunner` 的注释明确说明重启后从 `sw_job_info` 恢复。因此不需要 `QRTZ_*` 表，Quartz 不增加多数据库 DDL 工作量。

### 2.6 框架与迁移引擎

- 当前依赖只有 `flyway-core`、`flyway-database-postgresql`、`flyway-mysql`，JDBC 驱动只有 MySQL、PostgreSQL（H2 仅在 test/dev）。
- Maven Central 有 `flyway-database-oracle`、`flyway-sqlserver`、`flyway-database-db2`；没有达梦、KingbaseES、openGauss 模块，`flyway-community-db-support` 也不包含这三种。
- Oracle 模块的 `OracleDatabaseType` 继承 `BaseDatabaseType`；在 `FlywayExecutor` 中只看到对 `CommunityDatabaseType` 的公告分支，没有发现针对 Oracle 数据库类型的运行期 license guard。正式采用前仍需核对 Redgate 的许可条款。
- `FlywayConfiguration` 用 `DatabaseDriver.fromJdbcUrl` 检测 vendor；Spring Boot 3.4.4 的枚举不含 DM、KingbaseES、openGauss。
- MyBatis-Plus 的 URL 识别支持 `:dm\d*:`、`:kingbase\d*:`、`:opengauss:`，分页插件可用。

### 2.7 CI 与 Docker

- 当前 `.github/workflows/build-release.yml` 只起了一个 `postgres:18` service，没有 MySQL 或其他数据库。
- 本机 Docker Engine 24.0.6，linux/amd64，12 CPU，8 GB 内存；已有 `postgres`、`redis`、`mosquitto-024` 三个用户容器，本轮未触碰。
- 镜像 manifest 可达性（`docker manifest inspect`，不拉取）：MySQL 5.7、MySQL 8.0、MariaDB 10.6、PostgreSQL 16、openGauss 5.0.0、SQL Server 2019/2022、Oracle XE 21c、社区达梦、社区金仓均返回 OK；`opengauss/opengauss:5.1.0` 的 tag 不存在。
- 实际拉取并启动验证了 **MySQL 5.7.44**：`mysqladmin --wait=60 ping` 返回 `mysqld is alive`；`SELECT VERSION(), @@character_set_server, @@sql_mode` 得到 `5.7.44`、`latin1`、严格模式；探测容器停止后按 `--rm` 自动删除。默认字符集是 latin1，建库必须显式 `utf8mb4`。
- 磁盘：Docker 数据盘约 18 GB 可用（C: 93% 已用）。一次性拉取全部数据库镜像会超过可用空间，因此阶段 A 只做了 manifest 可达性和 MySQL 5.7 启动实测；其余数据库的实际拉取/启动放在阶段 B 逐库执行，每库完成即清理容器与镜像层。
- 达梦、金仓官方镜像不在公共 registry；Docker Hub 上只有社区镜像（达梦 47 个搜索结果、金仓 101 个），许可证与二进制来源不明确。官方下载入口：达梦 `https://www.dameng.com/download/index.html`，金仓 `https://www.kingbase.com.cn/download.html`，通常需要注册/申请开发版或试用授权，金仓还需要 license 文件。
- Oracle 19c 免费镜像不可公开获得；公开可用的是 Oracle XE 21c（`container-registry.oracle.com/database/express:21.3.0-xe` 或 `gvenzl/oracle-xe:21-slim`）。19c 精确版本需要 Owner 提供授权镜像/环境，或用 21c XE 作为“12c 及以上”兼容代表并记录版本差异。

## 3. 建议方案

### 3.1 脚本组织

继续沿用“每方言一套完整脚本”的现有模式，不引入运行时脚本生成：

| 数据库 | 目录 | 来源与处理 |
|---|---|---|
| H2 | `db/migration/h2/` | 现有，保持不动 |
| PostgreSQL | `db/migration/postgresql/` | 现有，保持不动 |
| MySQL 5.7 / 8.0 | `db/migration/mysql/` | 新增；同一套脚本必须兼容 5.7（无窗口函数、无 CTE、无 `ADD COLUMN IF NOT EXISTS`、无 `CREATE INDEX IF NOT EXISTS`） |
| MariaDB 10.6+ | `db/migration/mariadb/` | 新增；以 MySQL 脚本为基础，保留 MariaDB 特有语法空间（JSON 为 LONGTEXT 别名、窗口函数可用） |
| Oracle 19c/21c | `db/migration/oracle/` | 新增；`VARCHAR2(n CHAR)`、`NUMBER(19)`、`CLOB`、`NUMBER(1)` 布尔、`MERGE`、`FROM dual`、PL/SQL 幂等块 |
| SQL Server 2019+ | `db/migration/sqlserver/` | 新增；`NVARCHAR(MAX)`、`DATETIME2`、`BIT`、`IF OBJECT_ID`/`IF COL_LENGTH`、`MERGE`/`IF NOT EXISTS` |
| 达梦 DM8 | `db/migration/dm/` | 新增；Oracle 兼容模式，按 Oracle 脚本为底，按达梦实测差异修正 |
| KingbaseES V8 | `db/migration/kingbase/` | 新增；以 PostgreSQL 脚本为底，去掉 pgvector 块，保留 JSONB/COMMENT ON/ROW_NUMBER 等 |
| openGauss 5 | `db/migration/opengauss/` | 新增；以 PostgreSQL 脚本为底，按 openGauss 5 实测修正 `ON CONFLICT`、`CREATE INDEX IF NOT EXISTS` 等 |

`db/prod-update/` 同步增加 `mariadb/`、`sqlserver/`、`dm/`、`kingbase/`、`opengauss/` 目录；H2/PostgreSQL/MySQL/Oracle 既有目录不删不改。

脚本生成方式：以 PostgreSQL 脚本为语义基准，先做一个确定性的转换脚本（只做类型/关键字/幂等块的机械替换），生成初稿后逐库人工校对。生成器与产物都进仓库，后续新增迁移时先改基准再重新生成；生成器不参与运行时。这样既避免 8 套脚本手写漂移，也保留每库可单独修正的空间。

### 3.2 运行时方言抽象

1. **扩展 `VendorDialect`**：增加 `MYSQL`、`MARIADB`、`ORACLE`、`SQL_SERVER`、`DM`、`KINGBASE`、`OPENGAUSS`，按 `DatabaseMetaData.getDatabaseProductName()`/JDBC URL 检测。列类型映射至少覆盖 `TEXT/RICH_TEXT/NUMBER/DATE/BOOL/DICT/REFERENCE/MULTISELECT/ATTACHMENT/IMAGE/TIME/USER/DEPT/FORMULA/DATASOURCE`。
2. **标识符引用**：PostgreSQL/H2/Oracle/达梦/Kingbase/openGauss 用双引号；MySQL/MariaDB 用反引号；SQL Server 用方括号。固定表用不引用的小写/大写名称（由数据库折叠决定），动态宽表统一用引用的小写名称，保证 `DynamicTableSql.quote` 与 `VendorDialect.wrapIdentifier` 一致。
3. **LIMIT 重写**：在 MyBatis 拦截器层集中处理尾部 `LIMIT n`/`LIMIT ? OFFSET ?`：Oracle 改成 `FETCH FIRST n ROWS ONLY`；SQL Server 改成 `TOP n`（无 OFFSET）或 `ORDER BY ... OFFSET m ROWS FETCH NEXT n ROWS ONLY`（有 OFFSET）；MySQL/MariaDB/达梦/Kingbase/openGauss 保留 `LIMIT`。这样 97 处 `.last` 和 4 处手写 SQL 不需要逐点改业务代码；如果拦截器解析风险不可接受，再退回逐点替换为方言 helper。
4. **行锁**：PG/MySQL 8/MariaDB/Kingbase/openGauss 保留 `FOR UPDATE [SKIP LOCKED]`；SQL Server 改 `WITH (UPDLOCK, ROWLOCK)`，`SKIP LOCKED` 语义用 `READPAST`；MySQL 5.7 没有 `SKIP LOCKED`，需要二选一：改为短暂阻塞的 `FOR UPDATE`（行为变化，需接受），或把 `BpmResourceUsageMapper` 的空闲探测改成原子 `UPDATE ... WHERE` 领取（推荐，能保持非阻塞语义）；达梦按实测决定是否支持 `SKIP LOCKED`。
5. **JSON 写入**：把 `JsonStringTypeHandler` 改成按方言选择绑定方式：PG/Kingbase/openGauss 用 `Types.OTHER`；MySQL/MariaDB/SQL Server 用 `setString`；Oracle/达梦用 `setCharacterStream`/`setClob`。读取统一 `getString`。
6. **布尔/JSON/文本映射矩阵**：

| 逻辑类型 | PostgreSQL/H2 | MySQL/MariaDB | Oracle | SQL Server | 达梦 | Kingbase/openGauss |
|---|---|---|---|---|---|---|
| BOOLEAN | boolean | TINYINT(1) | NUMBER(1) | BIT | BIT（待实测） | boolean |
| JSONB | JSONB | JSON/LONGTEXT | CLOB | NVARCHAR(MAX) | CLOB | JSONB |
| TEXT/CLOB | text/CLOB | LONGTEXT | CLOB | NVARCHAR(MAX) | CLOB | text |
| 时间戳 | timestamp | DATETIME（避开 2038） | TIMESTAMP | DATETIME2 | TIMESTAMP | timestamp |
| 布尔字面量 | true/false | 1/0 | 1/0 | 1/0 | 1/0 | true/false |

7. **向量存储**：非 PostgreSQL 数据库没有 pgvector。建议在非 PG 数据库使用 `sw.knowledge.vector-store=memory`（现有 `InMemoryKnowledgeVectorStore` 已实现），把 RAG 的向量检索作为“可启动、可写入、进程内可用”的能力；如果 Planner 要求独立数据库上的语义检索也达到 PostgreSQL 同等水平，需要另立方向，不能靠本次迁移解决。

### 3.3 达梦/Kingbase/openGauss 的迁移引擎

Flyway 没有这三种数据库的模块，Spring Boot 也不认识它们的 JDBC URL。可选方案：

- **方案 A（建议）**：在 `FlywayConfiguration` 里用自定义 vendor 检测（JDBC URL + `DatabaseMetaData`），对 DM/Kingbase/openGauss 跳过 Flyway，改由项目内的 `SwVendorMigrationRunner` 执行 `db/migration/{vendor}`。Runner 维护独立历史表 `sw_schema_history`，记录版本、脚本、SHA-256 校验和、执行时间、成功标记；versioned 脚本按版本排序执行，`R__` 脚本在校验和变化时重跑；每个脚本在支持 DDL 事务的数据库上包事务，达梦/Oracle 这类 DDL 自动提交的数据库按“执行成功后再记账”处理；空库首次执行即建表并跑全链，已有业务表但没有历史表时拒绝自动 baseline。这样 H2/PG/MySQL/MariaDB/Oracle/SQL Server 继续用 Flyway，PG/H2 校验和不受影响。
- **方案 B**：为三种数据库实现 Flyway `DatabaseType` 插件，复用 Flyway 的 Oracle/PostgreSQL `Database` 实现。好处是只保留一个迁移引擎；代价是依赖 Flyway 内部 API、需要自己解决 Spring 的 `{vendor}` 占位符、升级 Flyway 时要跟着改，风险高于方案 A。
- **方案 C**：全部换成 Liquibase 或其他迁移框架。会改变现有 H2/PG 的迁移历史和校验和口径，与“已执行 PostgreSQL 迁移脚本校验和不得改变”冲突，不建议。

建议采用方案 A，并在阶段 B 第一步先做一个只读空库验证：DM/Kingbase/openGauss 各起一个容器，Runner 跑通 V0.2.0—V0.2.9，再决定是否需要在 Runner 里补数据库特有分支。

### 3.4 种子等价与比对脚本

比对口径按方向 §3.2：同样的表、同样的行数、同样的关键值。建议做一个可重复运行的 JUnit/CLI 工具（放在 `sw-bootstrap/src/test` 或 `scripts/db-compat/`）：

1. 用 PostgreSQL 空库跑完整 Flyway 链，作为基准；目标库跑对应方言链。
2. 对每张 `sys_*`/`sw_*` 表比较 `COUNT(*)`。
3. 对关键表比较排序后的关键列摘要：`sys_menu`（id、parent_id、name、permission、hidden）、`sys_role`（id、code、status）、`sys_role_menu`（role_id、menu_id）、`sys_user`（id、username、tenant_id、is_admin）、`sys_tenant`（id、code）、`sys_dict_type`/`sys_dict_data`（code、value、label）、`sw_bpm_node_function`（func_key、version）。
4. 对空字符串与 `NULL` 做归一化：比较前统一 `NULLIF(col, '')`，或只比对关键列，避免 Oracle 把 `''` 当 `NULL` 造成假差异。
5. 输出每张表的“基准行数 / 目标行数 / 差异数 / 关键摘要是否一致”，失败即非零退出。
6. 比对脚本只读业务表，不碰 UAT；UAT 的 `flyway_schema_history` 校验和比对单独做只读查询，不写入。

### 3.5 PostgreSQL/H2 校验和保持

- `db/migration/h2/` 与 `db/migration/postgresql/` 的 56 个文件一字不改；新增方言只加新目录。
- 新方言脚本不引用、不覆盖既有脚本；`db/upgrade/` 历史通道不动。
- 阶段 B 完成后，用只读方式从 UAT 的 `flyway_schema_history` 读取 PostgreSQL 已执行记录的 `version/description/checksum`，与仓库文件重新计算的值逐条比对；不执行 UAT 迁移，不改 UAT 数据。
- 如果多数据库适配过程中发现 PostgreSQL/H2 脚本本身有缺陷，另立新版本迁移或单独方向处理，不在本次直接改旧脚本。

### 3.6 验证环境与 CI

| 数据库 | 版本 | 本机镜像 | 阶段 A 状态 | CI 建议 |
|---|---|---|---|---|
| H2 | 现有测试模式 | 内嵌 | 回归基准 | 每次 |
| PostgreSQL | UAT 现用版本（CI 为 18） | 现有 `postgres:latest` / `postgres:16` | 回归基准 | 每次 |
| MySQL 5.7 | 5.7.44 | `mysql:5.7` | 已拉取并启动 | 每晚/发布前 |
| MySQL 8.0 | 8.0 | `mysql:8.0` | manifest OK | 每次（服务容器） |
| MariaDB | 10.6+ | `mariadb:10.6` | manifest OK | 每晚/发布前 |
| Oracle | 19c（目标）/21c XE（公开可用） | `container-registry.oracle.com/database/express:21.3.0-xe` | manifest OK | 每晚/发布前；19c 需授权镜像 |
| 达梦 | DM8 | 官方镜像待获取 | 官方镜像未公开 | 本地/自托管；先确认许可证 |
| KingbaseES | V8 | 官方镜像待获取 | 官方镜像未公开 | 本地/自托管；需要 license |
| openGauss | 5.0.0 | `opengauss/opengauss:5.0.0` | manifest OK | 每晚/发布前 |
| SQL Server | 2019+ | `mcr.microsoft.com/mssql/server:2019-latest` | manifest OK | 每晚/发布前 |

CI 分两层：

- 主流水线：H2 全量测试 + PostgreSQL 全量测试 + MySQL 8.0 迁移/种子/登录冒烟；与现有 `build-release.yml` 合并，增加 MySQL service。
- 夜间/发布前：MySQL 5.7、MariaDB 10.6、Oracle 21c XE、openGauss 5.0.0、SQL Server 2019 的迁移 + 种子比对 + 冒烟；达梦、金仓在能拿到官方镜像/授权后加入自托管 runner，或在本地 Linux 主机执行并保存原始输出。

### 3.7 工作量估计

以下按单人执行估算，单位为人日：

| 工作包 | 估算 |
|---|---:|
| 阶段 B 公共能力：方言抽象、LIMIT/行锁/JSON 适配、驱动与迁移 Runner | 8—10 |
| 阶段 B 单库适配与验证：MySQL 5.7、MySQL 8.0、Oracle、达梦 | 12—16 |
| 种子比对与冒烟工具 | 4—6 |
| 阶段 C 四库：KingbaseES、openGauss、SQL Server、MariaDB | 8—12 |
| 阶段 D：发布、UAT、部署文档与同步 | 4—6 |
| **合计** | **36—50 人日** |

这是 XL 级估算，实际受达梦/金仓镜像获取、Oracle 19c 环境、Flowable 在达梦上的实测结果影响。P66 与三示例流程没有代码冲突：三示例流程当前只剩 Planner 终态复核，P66 从 develop 新建独立分支即可。

## 4. 需要 Planner 确认的事项

1. **迁移引擎方案**：是否同意对达梦/Kingbase/openGauss 使用项目内 `SwVendorMigrationRunner`（方案 A），而不是 Flyway 插件或更换迁移框架。
2. **镜像与版本**：达梦/金仓由 Owner 提供官方开发版镜像或授权文件，还是允许先用社区镜像做预验证（正式验收仍用官方）；Oracle 19c 是否必须精确验证，还是接受 21c XE 作为“12c 及以上”代表。
3. **MySQL 5.7 的 SKIP LOCKED 语义**：接受短暂阻塞的 `FOR UPDATE` 退化，还是把 `BpmResourceUsageMapper` 改成原子领取（推荐后者，但会动 BPM 资源分配代码）。
4. **非 PostgreSQL 的向量检索**：接受 `memory` 向量存储（RAG 进程内可用、重启丢失），还是把语义检索列为不支持项并写入验收边界。
5. **Oracle 空字符串语义**：种子比对是否按“关键值”口径（推荐，避免 `''`/`NULL` 假差异），还是要求逐列完全一致（需要为 Oracle 单独定义空字符串映射）。

## 5. 证据与原始输出

| 证据 | 路径 |
|---|---|
| 迁移脚本逐文件统计 | `product/multi-database-compat/assets/assess-01/01-migrations-inventory.md` |
| 种子表与 INSERT 统计 | `product/multi-database-compat/assets/assess-01/02-seed-inventory.md` |
| 运行时代码方言点（含 FOR UPDATE 位置） | `product/multi-database-compat/assets/assess-01/03-code-dialect-inventory.md` |
| Docker 环境与 MySQL 5.7 实测 | `product/multi-database-compat/assets/assess-01/04-docker-environment.md` |
| Flowable/Quartz/MyBatis-Plus/Spring/Flyway 能力 | `product/multi-database-compat/assets/assess-01/05-third-party-and-framework.md` |

主要命令（均在 `Smart-WorkFlow-aPaaS-server` 下执行）：

```text
find . -path '*/target' -prune -o -path '*/src/main/resources/db/*' -type f -print
grep -in "row_number|on conflict|if not exists|alter column|jsonb|boolean|comment on" postgresql/*.sql
py -3 -I ...（生成逐文件统计与种子统计）
docker manifest inspect mysql:5.7 / mysql:8.0 / mariadb:10.6 / postgres:16 / opengauss/opengauss:5.0.0 / mcr.microsoft.com/mssql/server:2019-latest / container-registry.oracle.com/database/express:21.3.0-xe
docker pull mysql:5.7
docker run -d --rm --name swmdb-probe-mysql57 -e MYSQL_ROOT_PASSWORD=... -e MYSQL_DATABASE=probe mysql:5.7
docker exec swmdb-probe-mysql57 mysqladmin --wait=60 -uroot -p... ping
docker exec swmdb-probe-mysql57 mysql -uroot -p... -N -e 'SELECT VERSION(), @@character_set_server, @@sql_mode'
docker stop swmdb-probe-mysql57
```

Docker 探测使用的密码只存在于一次性探测命令和容器环境变量中，未写入仓库；探测容器已停止并自动删除。

## 6. 自验与偏差

- 阶段 A 是只读核对，未修改 Server/Web 业务代码，未新增迁移脚本，未连接 UAT 数据库，未改 UAT 配置或实例。
- 已按方向 §4 阶段 A 输出：迁移/种子/注解 SQL 方言清单、Flowable/Quartz 支持情况、脚本组织与方言抽象方案、主键/布尔/JSON 映射、PG/H2 校验和保持方法、验证环境与工作量。
- **偏差**：方向要求“每种数据库的镜像能否拉取、能否在本机启动（实测）”。本轮只对全部候选镜像做了 manifest 可达性检查，实际拉取/启动只完成 MySQL 5.7。原因是 Docker 数据盘仅约 18 GB 可用，批量拉取 8—10 个数据库镜像会超过空间；阶段 B 将按库逐个拉取、启动、验证并清理，逐库保存结果。这一点在 Planner 确认方案时需要明确接受。
- 达梦/金仓官方镜像和 Oracle 19c 属于外部资源，当前不能由 Executor 自行取得；阶段 B 开始前需要 Owner/Planner 给出获取方式。
- 阶段 A 未开始写任何方言脚本；方案确认后才进入阶段 B。

## 7. 七阶段与下一步

| 阶段 | 状态 |
|---|---|
| 1 新需求评估 | ✅ 完成（本方向） |
| 2 执行（阶段 A→B→C） | 进行中：阶段 A 已完成并提交，待 Planner 确认方案 |
| 3 验收与同步 | ⬜ 未开始 |
| 4 合并 | ⬜ 未开始 |
| 5 发版（0.4.0） | ⬜ 未开始 |
| 6 发布后同步 | ⬜ 未开始 |
| 7 结束 | ⬜ 未开始 |

已完成 **1**，进行中 **1**，未开始 **5**。

下一步：Planner 审阅本回执与第 4 节 5 项决策，确认后 Executor 进入阶段 B；阶段 B 的顺序按方向：MySQL 5.7/8.0 → Oracle → 达梦，每完成一种数据库提交一份 `receipts/execution-progress-NN.md`。

## 8. 附：本轮实际读取/修改文件

- 读取：`product/multi-database-compat/ready/direction-multi-database-compat.md`、`knowledge/current-status.md`、`roles/executor.md`、`system.md`。
- 读取（Server 非代码与代码）：`application.yml`、`FlywayConfiguration.java`、`VendorDialect.java`、`DynamicTableSql.java`、`DynamicTableManager.java`、`JsonStringTypeHandler.java`、`PgKnowledgeVectorStore.java`、`KnowledgeVectorColumnInitializer.java`、`BpmResourceUsageMapper.java`、`BpmCommandMapper.java`、`BpmInstanceMapper.java`、`SysTenantMapper.java`、`SsoAuthStateMapper.java`、`FormDataQueryService.java`、`BpmResourceOpsService.java`、`JobStartupRunner.java` 等。
- 读取（迁移/种子）：`db/migration/h2/` 与 `db/migration/postgresql/` 全部 56 个 SQL 文件的文件清单与关键写法；`db/upgrade/0.2.0/README.md`；`db/migration/{mysql,oracle}/README.md`。
- 读取（工具/JAR）：`flowable-engine-common-7.1.0.jar` 的 `DbUtil` 映射；`mybatis-plus-annotation-3.5.9.jar` 的 `DbType`；`mybatis-plus-extension-3.5.9.jar` 的 `JdbcUtils`；`spring-boot-3.4.4.jar` 的 `DatabaseDriver`；`flyway-core-11.3.4.jar` 与 `flyway-database-oracle-11.3.4.jar` 的数据库类型/公告逻辑。
- 新增：本回执与 `assets/assess-01/` 下 5 份证据文件。未修改业务代码，未新增迁移脚本。
