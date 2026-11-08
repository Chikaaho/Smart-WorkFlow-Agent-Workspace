# P66 多数据库兼容：B2 单库适配第一批（execution-b2-01）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容：迁移脚本与 SQL 种子适配（XL，目标版本 0.4.0） |
| 依据 | `ready/direction-multi-database-compat.md`、`receipts/planning-review-b1-01.md` |
| 阶段 | B2 单库适配第一批：R1—R7 返修 + MySQL 5.7/8.0 + Oracle 21c XE |
| 日期 | 2026-11-08 |
| 执行角色 | Executor |
| 分支 | Server `feature/0.4.0-multi-database` |
| 提交 | `36015ba8`（R1/R4）、`d590e5f2`（R2）、`8bbf92a6`（R3/R7）、`db2c9d96`（MySQL）、`de4d545f`（保留字别名/PG 向量初始化）、`21da4cea`（Oracle） |
| 七阶段 | **1 / 1 / 5**（评估完成；执行进行中：A、B0、B1 完成，B2 MySQL/Oracle 完成，DM8 待授权） |

## 1. Planner R1—R7 处理结果

| 编号 | 处理 | 证据 |
|---|---|---|
| R1 | `DatabaseCompatibilityGuard` 从 `ApplicationRunner` 前移到 `FlywayMigrationStrategy` 入口，先于 `detectVendor`、`SwVendorMigrationRunner`、Flyway 与 prod-update；失败时迁移零执行。新增 `FlywayConfigurationTest`，用 mock 证明检查抛错后 Flyway/DataSource 均未被调用 | `DatabaseCompatibilityGuard`、`FlywayConfiguration`、`FlywayConfigurationTest` |
| R2 | MySQL 5.7 走“1 秒会话锁等待”探测；探测、`SET SESSION innodb_lock_wait_timeout`、还原全部放在同一个 `ConnectionCallback`，连接归还池子前恢复。回执说明为何必须持有行锁（随后同一事务 `incrementWithinCap`；独立 UPDATE 在 5.7 既不能 NOWAIT 也不持锁）。真实 5.7 验证：行被持有时探测 < 3s 返回 null；行空闲返回 id；8 线程原子条件占用恰好 1 个成功 | `ResourceRowLockProbe`、`ResourceRowLockProbeTest`、`MySql57ResourceProbeTest` |
| R3 | `SeedComparisonTest` 补第二层：按主键配对比较所有共有列，`''`/NULL 归一，时间列非空哨兵，差异定位“表/主键/列”；标识符按 `DatabaseMetaData` 实际大小写引用；摘要改 Java 侧排序（Oracle 不能 `ORDER BY CLOB`）；生成型代理键 `sys_role_menu` 按 `(tenant_id, role_id, menu_id)` 业务键比较并跳过 id | `SeedComparisonTest`；MySQL 5.7/8.0、Oracle 均 0 差异 |
| R4 | `V0.4.1__knowledge_vector_persistence.sql` 改名 `V0.4.0`（H2/PG），迁移链仍 30 条、终点 0.4.0；全链与 0.3.2 升级测试同步，旧迁移校验和不变 | 迁移文件、`FlywayFullChain*`、`FlywayUpgradeFrom032Test` |
| R5 | 确认是 0.3.2 存量缺陷（`develop` 已存在 `.eq(getEnabled, true/false)`，`sw_agent_tool_internal/external.enabled` 为 `SMALLINT`）：PG（含 UAT）上相关智能体工具查询会报 `smallint = boolean` 类型错误，MySQL 因隐式转换不受影响。已在 B1 分支改为 1/0 绑定（`26d0e8a7`），随 0.4.0 发布；需求池已登记 | `todo/requirement-pool.md` P66 段；Server `26d0e8a7` |
| R6 | 确认 `R__0.2.0_approval_opinion_draft.sql` 不再重加 `comment`（只有建表时一次 `comment`，随后 0.4.0 改名）；MySQL/Oracle 脚本建表即用 `opinion_comment`，`R__0.4.0` 在两种方言上空跑 | MySQL/Oracle `R__0.2.0_approval_opinion_draft.sql`、`R__0.4.0` |
| R7 | `.last` 语料测试从源码提取 **129** 处，全部符合 `LIMIT n [OFFSET m]`，Oracle/SQL Server 改写路径均不抛异常；3 处 OFFSET 站点（`SsoAuthService:1319`、`BpmMyInstanceController:103`、`ApprovalActionServiceImpl:37`）均在 Wrapper 内 `orderByDesc`，OFFSET 无 ORDER BY = **0**。全量门禁结果见 §4 | `LastLimitCorpusTest`；`grep -rn --include=*.java ".last(" sw-framework sw-biz sw-basic sw-bootstrap/src/main` |

### 1.1 返修期间发现并修复的跨库缺陷

- **MySQL 保留字别名 `read`**：`NotifyMessage.read` 映射 `is_read`，MyBatis-Plus 生成 `is_read AS read`，MySQL 报语法错误。Java 字段改为 `isRead`，`@JsonProperty("read")` 保持 JSON/API 字段，调用方同步修改。
- **Oracle/达梦保留字别名 `comment`**：`BpmTaskOpinionDraft.comment` 映射 `opinion_comment`，会生成 `opinion_comment AS comment`。Java 字段改为 `opinionComment`，`@JsonProperty("comment")` 保持 JSON/API 字段。
- **MySQL 5.7 SKIP LOCKED 分流**：`supportsSkipLocked()` 对 MySQL 返回 true，导致 5.7 误走 SKIP LOCKED。`ResourceRowLockProbe` 增加主版本判断（5.x 走 1 秒超时探测，8.x 走 SKIP LOCKED）。
- **MySQL `explicit_defaults_for_timestamp`**：MySQL 5.7 迁移需要该会话变量为 ON。脚本内 `SET SESSION` 在 Flyway 事务中不可设置（错误 1766），改为 JDBC URL 参数 `sessionVariables=explicit_defaults_for_timestamp=ON`，并由兼容性检查在迁移前强制校验。
- **pgvector 初始化器**：`KnowledgeVectorColumnInitializer` 在非 PG 上执行 `current_schema()`/`pg_extension` 会失败。改为仅 PostgreSQL 执行，非 PG 明确提示配置 `sw.knowledge.vector-store=database`。
- **Oracle NULL 绑定**：MyBatis-Plus `.set(..., null)` 默认 `JdbcType.OTHER`，Oracle 报 ORA-17004。全局 `mybatis-plus.configuration.jdbc-type-for-null: 'NULL'`，PG/MySQL 行为等价。

## 2. MySQL 5.7 / 8.0 验证

### 2.1 环境

| 项 | MySQL 5.7 | MySQL 8.0 |
|---|---|---|
| 镜像 | `mysql:5.7` | `mysql:8.0` |
| 镜像 sha256 | `5107333e08a87b836d48ff7528b1e84b9c86781cc9f1748bbc1b8c42a870d933` | `6cd09145362dfe6831b14545de3d5fd6cc75c37cfd6ef8561429c1fc73518b39` |
| 版本 | 5.7.44 | 8.0.46 |
| 容器 | `swmdb-mysql57`（127.0.0.1:13307） | `swmdb-mysql80`（127.0.0.1:13308） |
| 字符集/排序 | utf8mb4 / utf8mb4_bin | utf8mb4 / utf8mb4_bin |
| 行格式/大前缀 | Dynamic / ON | Dynamic |
| `explicit_defaults_for_timestamp` | JDBC URL 显式 ON | 默认 ON |

### 2.2 结果

| 验证 | MySQL 5.7 | MySQL 8.0 |
|---|---|---|
| 空库 Flyway 全链 | 30 条，终点 V0.4.0，重复 migrate 0 条，validate 通过 | 同左 |
| PG→MySQL 种子两层比对 | 136 张表行数 + 18 张关键表关键列 + 全部共有列，差异 0 | 同左（同一脚本，独立容器） |
| 启动冒烟 | 完整应用启动；Flyway 30 条；MyBatis 查询；中文写入回读；JSON 列；分页第二页；Flowable 建表；字符集检查；`notify`/`opinion` 别名查询通过 | 同左 |
| 资源段探测/并发 | 行锁定时 < 3s 返回 null；空闲返回 id；8 线程原子领取恰好 1 成功 | SKIP LOCKED 路径（8.0）由冒烟与迁移覆盖；并发专项在 5.7 执行 |

### 2.3 MySQL 迁移实现要点

- 30 条脚本与 PG 同版本序列；`comment` 建表即 `opinion_comment`；`V0.4.0` 向量表。
- 无窗口函数：`ROW_NUMBER() OVER` 改用户变量顺延，并补 `ORDER BY` 贴近 PG 行序（授权行 id 仍可能不同，种子比对按业务键）。
- 部分唯一索引：`sw_bpm_form_binding` 用生成列 `active_key`；`sw_iot_device_command.idempotent_key` 直接唯一（MySQL 允许多个 NULL）。
- `TEXT` → `LONGTEXT`、去掉 LOB 默认值；`metadata_json` 非 PG 无库级默认，B2 后续补实体层 `'{}'` 回读测试。
- 重复可执行 DDL（表/索引/列）在 MySQL 可重复迁移中用 `information_schema` + `PREPARE/EXECUTE` 守卫，重复执行零错误。

## 3. Oracle 21c XE 验证

| 项 | 内容 |
|---|---|
| 镜像 | `gvenzl/oracle-xe:21-slim-faststart` |
| 镜像 sha256 | `c3406edbfaa13e8cae189cfaf67c8967420a64fb3630cc1f62a3034ca2c6a8ed` |
| 版本/字符集 | Oracle Database 21c Express Edition 21.0.0.0.0；PDB `XEPDB1`；NLS_CHARACTERSET=AL32UTF8 |
| 容器 | `swmdb-oracle21`（127.0.0.1:11521，APP_USER=swmdb） |
| 空库 Flyway 全链 | 30 条，终点 V0.4.0，重复 migrate 0 条，validate 通过 |
| 种子两层比对 | 136 张表行数 + 关键列 + 全部共有列，差异 0 |
| 启动冒烟 | 完整应用启动；Flyway 零新增；MyBatis 查询；中文写入回读；CLOB JSON；分页 `OFFSET/FETCH`；Flowable 建表；`NotifyMessage.isRead` 与 `BpmTaskOpinionDraft.opinionComment` 查询及 JSON 字段 `read`/`comment` 通过；日志 **0 个 ORA 错误** |

### 3.1 Oracle 迁移实现要点

- `BIGINT/SMALLINT/INT/BOOLEAN` → `NUMBER(19/5/10/1)`；`TEXT/JSON/大 VARCHAR` → `CLOB`；`VARCHAR(n)` → `VARCHAR2(n CHAR)`。
- Oracle 不接受 `NOT NULL DEFAULT` 顺序、`ADD COLUMN`、`ADD` 多列、`DROP INDEX IF EXISTS`、`ALTER COLUMN TYPE`；脚本已按 Oracle 语法重写。
- 无 `FROM` 的 `INSERT ... SELECT` 全部补 `FROM dual`；布尔表达式转 `CASE WHEN ... THEN 1 ELSE 0 END`。
- 部分唯一索引 `uk_sw_bpm_binding_active` 改函数索引 `(CASE WHEN active=1 THEN tenant_id END, CASE WHEN active=1 THEN form_key END)`，非激活行全 NULL 不参与唯一。
- `sw_form_def.form_key` 内联 `UNIQUE` 移除，0.4.0 统一建 `(form_key, deleted)` 唯一索引（与 PG/H2/MySQL 语义一致）。
- Oracle 21c XE 的 PDB 服务名在本机镜像为 `XEPDB1`/`freepdb1`，连接串使用 `jdbc:oracle:thin:@//127.0.0.1:11521/XEPDB1`。

## 4. 全量门禁

- 最新提交 `21da4cea` 上 `MAVEN_OPTS="-Xmx2g" mvn test`：**BUILD SUCCESS，2,454 个测试，0 失败 / 0 错误 / 35 跳过**（真实库测试未配置连接参数时跳过）。
- 既有 H2/PG 迁移链、`V0.4.0` 改名、R1—R7 返修测试全部通过；`.last` 语料测试 129/129。
- 真实库专项：MySQL 5.7/8.0、Oracle 21c XE 的空库迁移、种子比对、启动冒烟、5.7 并发探测全部通过。

## 5. 阻塞与下一步

- **DM8：待 Owner/Planner 提供官方镜像或安装包授权。** Docker Hub 只有社区镜像，未采用；官方渠道需要注册/授权。按规划审查 01 §5 停在 DM8，其他库继续。所需材料：达梦官方 DM8 Docker 镜像（含 sha256）或安装包 + 授权文件，以及初始化参数（`CASE_SENSITIVE=Y`、`LENGTH_IN_CHAR=1`、`COMPATIBLE_MODE` 默认）。
- **MySQL/Oracle 冒烟边界**：本批完成启动、迁移、种子、MyBatis、中文、JSON/CLOB、分页、Flowable 建表；管理员登录、表单发布、流程审批、定时任务的完整业务冒烟未在本批执行（PG 侧已有既有覆盖）。B2 下一批补。
- **MariaDB / Kingbase / openGauss / SQL Server**：按 Planner 顺序在 DM8 之后/并行推进；脚本目录先复用 MySQL/Oracle 经验。
- **UAT 0.3.2→0.4.0 升级演练**与 `flyway_schema_history` 只读比对：留到 0.4.0 发布前。
- **`metadata_json` 非 PG 实体默认与回读测试**：随下一个涉及非 PG 脚本的批次完成。

## 6. 提交与镜像清理

- Server 提交：`36015ba8`、`d590e5f2`、`8bbf92a6`、`db2c9d96`、`de4d545f`、`21da4cea`，已推送（远端回读 `21da4cea492269dc4f9a63cffcf181e3658fcdf3`）。
- 容器：`swmdb-mysql57`、`swmdb-mysql80`、`swmdb-oracle21`、`swmdb-pg17` 为本次任务创建；验证完成后已全部删除（含匿名卷）。本次拉取的 `mysql:8.0`（799 MB）与 `gvenzl/oracle-xe:21-slim-faststart`（4.66 GB）镜像已删除，sha256 已记录在上文，可重新拉取复跑；`mysql:5.7` 镜像为 B0 既有，保留。
- 未合并 develop/main，未打 tag/Release，未触碰 UAT。
