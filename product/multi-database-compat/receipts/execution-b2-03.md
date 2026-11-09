# P66 多数据库兼容：B2 第三批（execution-b2-03）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容：迁移脚本与 SQL 种子适配（XL，目标版本 0.4.0） |
| 依据 | `receipts/planning-review-b2-02.md` §2—§5 |
| 阶段 | B2 返修 + SQL Server/Kingbase 收口 |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 分支 | Server `feature/0.4.0-multi-database` |
| 自验结论 | T1、T3、T4、T5、T6 完成；SQL Server 2022 Developer 单库验收通过；KingbaseES 脚本/种子/静态检查就绪（Owner 自验）；全库最终矩阵通过 |
| 七阶段 | **1 / 1 / 5** |

## 1. T1：MySQL/MariaDB 的 `||`

### 1.1 审计结果

MySQL/MariaDB 默认模式下 `||` 是逻辑或。修复前每个方言各有 **6 处可执行拼接**：

| 文件:行 | 原文 | 本意 | 处理 |
|---|---|---|---|
| `mysql/V0.2.0__baseline_seed.sql:5141` | `SELECT 'lc' || c.id` | 应用 id 前缀拼接 | `CONCAT('lc', c.id)` |
| `mysql/V0.2.0__baseline_seed.sql:5148` | `'lc' || MIN(pd.category_id)` | 同上 | `CONCAT('lc', MIN(...))` |
| `mysql/V0.2.0__baseline_seed.sql:5162` | `'uncat-t' || f.tenant_id` | 未分类应用 id | `CONCAT('uncat-t', f.tenant_id)` |
| `mysql/V0.2.0__baseline_seed.sql:5173` | `SET app_id = 'uncat-t' || f.tenant_id` | 同上 | `CONCAT(...)` |
| `mysql/V0.2.2__f1_agent_provider_model.sql:70` | `c.base_url || '/v1'` | Ollama base URL 拼接 | `CONCAT(c.base_url, '/v1')` |
| `mysql/V0.2.2__f1_agent_provider_model.sql:73` | `'...protocol=' || c.protocol_type || '）'` | 迁移说明文案 | `CONCAT('...protocol=', c.protocol_type, '）')` |

`mariadb/` 同源同位置，已同步修改。注释中的 `'lc' || category.id`、`IV||ciphertext` 是说明文字，不是可执行 SQL。

### 1.2 覆盖说明

- `SeedComparisonTest` 的种子数据中 `sw_form_app`、`sw_agent_provider`、`sw_agent_model` 均为 **0 行**，因此 0 差异**不能证明**这些拼接被执行过；本批以脚本审计 + CONCAT 修复 + 机械门禁覆盖。
- 种子比对不覆盖 DDL 默认值、视图、存储过程与运行时 SQL；已单独检查 Java/XML：源码中无 SQL 字符串形式的 `||`（Java 的 1897 处 `||` 均为逻辑或）。
- 新增 `SqlConcatPortabilityGateTest`：扫描 `mysql/`、`mariadb/` 脚本，忽略注释后任何 `||` 即失败；全量门禁中运行。

## 2. T2：最终提交上的实库矩阵

以下结果均在**本批最终工作树**（提交前）执行；迁移、种子比对、启动冒烟、业务冒烟同一提交。

| 库 | 迁移 | 种子两层比对 | 启动冒烟 | 业务冒烟 | form_key 断言 |
|---|---|---|---|---|---|
| MySQL 5.7 | 30 条 | 0 差异 | 通过 | 登录/菜单/表单发布/动态宽表/审批/Quartz | 通过 |
| MySQL 8.0 | 30 条 | 0 差异 | 通过 | 同上 | 通过 |
| Oracle 21c XE | 30 条 | 0 差异 | 通过 | 同上 + 空串 4 项 | 通过 |
| MariaDB 10.6 | 30 条 | 0 差异 | 通过 | 同上 | 同 MySQL 脚本 |
| openGauss 5.0 | 30 条（Runner） | 0 差异 | 通过 | 同上 | 同 PG 脚本 |
| SQL Server 2022 Developer | 30 条 | 0 差异 | 通过 | 同上 | 通过 |
| H2 / PostgreSQL | 全量门禁 | 既有 0 差异 | 既有覆盖 | 既有覆盖 | H2/PG 内嵌断言 |

- MySQL 5.7 种子迁移必须带 `sessionVariables=explicit_defaults_for_timestamp=ON`；`MySqlSeedMigrationTest` 已自动补齐。
- Oracle 冒烟容器为 `gvenzl/oracle-xe:21-slim-faststart`，PDB `XEPDB1`，字符集 AL32UTF8。
- openGauss 建库必须 `ENCODING 'UTF8' DBCOMPATIBILITY 'PG' TEMPLATE=template0`，启动检查强制。
- SQL Server 排序规则 `Chinese_PRC_CS_AS`，启动检查强制。

## 3. T3：DM8 可空唯一键与 binding_active

DM8 脚本已重新由 Oracle 脚本生成，恢复 9 个 `CASE WHEN` 函数索引和
`uk_sw_bpm_binding_active` 函数索引：

| 索引 | 判断条件 | 与 PG 语义 |
|---|---|---|
| `uk_sw_form_cfg_tname` | `table_name IS NOT NULL` | PG 任一键列为 NULL 不判重；本索引在 table_name 为 NULL 时全表达式 NULL |
| `uk_iot_device_product_device` | `product_id IS NOT NULL AND device_name IS NOT NULL` | 两列任一为空不判重 |
| `uk_sw_notify_msg_idempotency` | `idempotency_key IS NOT NULL` | 空幂等键可多条并存 |
| `uk_sw_form_trace_idem` | `submit_idempotency_key IS NOT NULL` | 同上 |
| `uk_sw_bpm_comm_instance_receiver` | `task_id IS NOT NULL` | 流程级（task 为空）通信可多条 |
| `uk_sw_notify_msg_identity` | `biz_id IS NOT NULL` | 空业务对象的系统通告可重复广播 |
| `uk_sw_bpm_command_logical` | `logical_command_id IS NOT NULL` | 非逻辑命令不参与判重 |
| `uk_sw_bpm_dyn_branch` | `round_no IS NOT NULL` | 空轮次不参与判重 |
| `uk_sw_agent_exec_req_idem` | `create_by IS NOT NULL AND idempotency_key IS NOT NULL` | 任一为空不判重 |
| `uk_sw_bpm_binding_active` | `active = 1` | 仅启用中的绑定唯一，多条 `active=0` 可并存 |

Owner 验证清单已写入 `db/migration/dm/README.md`，包含空键并存、非空键唯一、
多条 `active=0` 并存、单列可空唯一键、动态分支空轮次等正反例。

## 4. T4：form_key 与 Oracle 函数索引证据

- `FormKeyConstraintTest` 新增 MySQL/MariaDB、Oracle、SQL Server 三组真实库断言：
  - MySQL：`information_schema.statistics` 按 `seq_in_index` = `tenant_id, form_key, deleted`；
  - Oracle：`user_ind_columns` 按 `column_position` 同上；
  - SQL Server：`sys.index_columns` 按 `key_ordinal` 同上；
  - 三库均断言不存在仅 `form_key` 的唯一索引。
- 实测通过：MySQL 5.7、MySQL 8.0、Oracle 21c XE、SQL Server 2022。
- Oracle 9 个可空唯一键条件见 §3；全部采用“**所有可空键列都非空才参与判重**”的 CASE 条件，
  与 PG“任一键列为 NULL 即不判重”等价。

## 5. T5：DM/Oracle 与 Kingbase/PG 差异

- DM8：新增 `DmOracleScriptParityTest`，逐文件断言 30 个脚本除
  `VARCHAR2(n CHAR)` → `VARCHAR2(n)` 外与 Oracle 逐字节一致；共 **703** 处 CHAR 单位差异。
  报告：`db/migration/dm/ORACLE-DIFF.md`。H2 代理仍停用（H2 不支持 `MODIFY`/函数索引），
  已由逐文件一致 + 静态检查替代。
- KingbaseES：新增 `KingbasePostgresParityTest`，30 个文件中 29 个与 PG 逐字节一致；
  唯一差异 `V0.2.5` 去掉 pgvector `DO` 块与 `embedding vector` 列，改用 `sw_knowledge_vector`
  文本表。报告：`db/migration/kingbase/KINGBASE-DIFF.md`。

## 6. T6：动态宽表标识符改写防误改

- `DynamicTableSql.rewriteAnsiIdentifiers` 改为状态机扫描：
  - 只在 SQL 语法位置把 `"identifier"` 改为反引号；
  - 单引号字符串（含 `''` 转义、反斜杠转义）、`--` 行注释、`/* */` 块注释内的双引号原样保留。
- `DynamicTableSqlVendorQuoteTest` 4/4：
  - 四种 DDL 表名引用；
  - MySQL/MariaDB 标识符改写；
  - H2/PG 保持双引号；
  - 新增字符串/注释防误改用例。
- 说明：原 3/3 未覆盖字符串与注释，本批补第 4 条。

## 7. SQL Server 2022 Developer 单库验收

| 项 | 内容 |
|---|---|
| 镜像 | `mcr.microsoft.com/mssql/server:2022-latest`，Developer Edition |
| 镜像 digest | `sha256:cf8f0ab2ebe61feec2eed2629061a07d247f791c2a8ddda74a4ac9f06a291718` |
| 排序规则 | `Chinese_PRC_CS_AS`（启动检查通过） |
| 容器 | `swmdb-sqlserver`，127.0.0.1:11433 |
| 迁移 | 30 条，终点 0.4.0；`SqlServerSeedMigrationTest` |
| 种子比对 | 对 PG 基准 0 差异 |
| 启动/业务 | `SqlServerBootSmokeTest`：MyBatis、中文、JSON、动态宽表、向量、登录/审批/Quartz |
| 筛选索引 | 12 个全部落地（见 `db/migration/sqlserver/README.md`） |

### 7.1 首次支持基线说明

SQL Server 在 0.4.0 首次支持，无 0.3.x 升级路径，因此采用终态基线：

- `V0.2.0__baseline_seed.sql`：PG 0.4.0 终态 schema（136 表、主键、索引）；
- `R__0.2.0_sqlserver_seed.sql`：终态种子数据；
- 其余 9 个 V 与 19 个 R 为占位脚本，保持 30 条迁移身份；
- 生成工具 `scripts/db-compat/generate_sqlserver.py`，输入 PG 18 `pg_dump`（schema/data）。
- `flyway_schema_history` 由 Flyway 自建，基线不包含；12 个可空唯一键自动转筛选索引。
- 后续 SQL Server 版本升级按正常增量迁移，不再合并基线。

## 8. KingbaseES：脚本就绪（Owner 自验）

- 30 条脚本由 PG 复制，唯一差异 V0.2.5 去 pgvector；`KINGBASE-DIFF.md` + 差异测试。
- `db/migration/kingbase/README.md` 给出初始化、JDBC 示例、Owner 验证清单。
- 未取得官方安装包；按 Owner 裁决 A，实库验证由 Owner 执行。

## 9. 验证汇总

### 9.1 本批专项

| 测试 | 结果 |
|---|---|
| `SqlConcatPortabilityGateTest` | 1/1 |
| `DynamicTableSqlVendorQuoteTest` | 4/4 |
| `DmOracleScriptParityTest` | 1/1（30 文件，703 处 CHAR） |
| `KingbasePostgresParityTest` | 1/1（29 一致 + 1 差异） |
| `SqlServerScriptStaticTest` | 1/1（30 脚本、12 筛选索引） |
| `FormKeyConstraintTest` | H2/PG + MySQL 5.7/8.0 + Oracle + SQL Server 均通过 |
| `MySqlSeedMigrationTest` / `MariaDbSeedMigrationTest` / `OpenGaussSeedMigrationTest` / `SqlServerSeedMigrationTest` | 各 30 条通过 |
| `SeedComparisonTest` | MySQL 5.7/8.0、Oracle、MariaDB、openGauss、SQL Server 均 0 差异 |
| `MySqlBootSmokeTest`（5.7/8.0/MariaDB） | 各 1/1 |
| `OracleBootSmokeTest` | 1/1 |
| `OpenGaussBootSmokeTest` | 1/1 |
| `SqlServerBootSmokeTest` | 1/1 |

### 9.2 全量门禁

`mvn -o test`：

| 指标 | 值 |
|---|---|
| 测试 | **2,477** |
| Failures | **0** |
| Errors | **0** |
| Skipped | **44**（外部真实库属性门控测试） |
| 结果 | **BUILD SUCCESS**，29:27 |

## 10. 提交与容器

- Server 提交：`02598b8c`（`feat(multi-db): B2-03 SQL Server/Kingbase 与 T1-T6 返修`），已推送
  `origin/feature/0.4.0-multi-database`（远端回读 `02598b8c6f67b4880ff0e6a0601ea0bd470533a7`）。
- 容器：MySQL 5.7（既有）、MySQL 8.0、Oracle 21c XE、MariaDB、openGauss、SQL Server 2022；
  验证完成后清理本批新建容器与镜像（保留既有 MySQL 5.7）。
- 未合并 develop/main，未打 tag/Release，未触碰 UAT。
