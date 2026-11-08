# P66 多数据库兼容：B2 第二批（execution-b2-02）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容：迁移脚本与 SQL 种子适配（XL，目标版本 0.4.0） |
| 依据 | `receipts/planning-review-b2-01.md` §2—§5 |
| 阶段 | B2（单库验收补做 + 其它库推进） |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 分支 | Server `feature/0.4.0-multi-database` |
| 自验结论 | S2/S3/S6 完成；MySQL 5.7/8.0、Oracle、MariaDB、openGauss 单库验收通过；DM8 脚本/种子/静态检查就绪（Owner 实库验证）；SQL Server 与 Kingbase 未完成 |
| 七阶段 | **1 / 1 / 5**（需求评估完成；执行进行中，B2 部分完成；验收与同步、合并、发版、发布后同步、结束未开始） |

## 1. S1（R5）处置

按 Owner 裁决（planning-review-b2-01 §5.2），R5 的 UAT 影响核实与修复转入独立补丁
`product/server-033-agent-tool-enabled-hotfix/ready/direction-server-033-hotfix.md`；
P66 本回执不再回答 S1。

## 2. S2：`sw_form_def.form_key` 唯一约束

新增 `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/migration/FormKeyConstraintTest.java`，用真实库断言终态：

| 库 | 证据 | 结果 |
|---|---|---|
| H2 | 完整迁移链后查 `INFORMATION_SCHEMA.INDEX_COLUMNS`，`UK_SW_FORM_DEF_FORM_KEY` = `["tenant_id","form_key","deleted"]` | 通过 |
| PostgreSQL | 完整迁移链后查 `pg_indexes.indexdef` 含 `(tenant_id, form_key, deleted)`；`pg_constraint` 无 `UNIQUE(form_key)` | 通过 |

结论：PG/H2/Oracle/MySQL 四方言终态一致，均为 `(tenant_id, form_key, deleted)` 复合唯一索引；
不存在“PG 仅 `UNIQUE(form_key)`”的偏差，0.4.0 无需新增统一迁移。

## 3. S3：单库验收

### 3.1 总表

| 库 | 迁移 | 种子两层比对 | 启动冒烟 | 业务冒烟 | 向量/元数据 | 结果 |
|---|---|---|---|---|---|---|
| MySQL 5.7 | 30 条 | 0 差异（B2-01） | 通过 | 登录、菜单、表单发布、动态宽表读写、审批到终态、Quartz | 写入/检索/删除；`metadata_json='{}'` | 通过 |
| MySQL 8.0 | 30 条 | 0 差异（B2-01） | 通过 | 同上 | 同上 | 通过 |
| Oracle 21c XE | 30 条 | 0 差异（B2-01） | 通过 | 同上 + Oracle 空串 4 项 | 同上 | 通过 |
| MariaDB 10.6 | 30 条 | 0 差异 | 通过 | 同上 | 同上 | 通过 |
| openGauss 5.0 | 30 条（Runner） | 0 差异 | 通过 | 同上 | 同上 | 通过 |
| SQL Server | 未开始 | — | — | — | — | 未完成 |
| KingbaseES | 未开始 | — | — | — | — | 待授权/下载验证 |
| DM8 | 脚本就绪 | 待 Owner | 待 Owner | 待 Owner | 待 Owner | Owner 验证 |

### 3.2 新增/加强的冒烟内容

- `BusinessSmokeSupport`：管理员登录（RSA-OAEP + dev 验证码）、菜单加载、表单草稿→发布、
  动态宽表插入/读取/软删、BPMN 部署→发起→完成至终态、Quartz 任务触发。
- `metadata_json`：实体默认 `{}`，非 PG 库插入后直接回读 `metadata_json = '{}'`。
- 向量持久化：`sw.knowledge.vector-store=database` 下 `store/search/deleteByDocument`，
  断言删除后向量与 chunk 计数为 0。
- Oracle 空串 4 项：
  1. 可选 `sys_user.email=''` 回读 NULL；
  2. 清空后再保存回读 NULL；
  3. 必填 `sys_dict_type.name=''` 写入被拒（`DataAccessException`）；
  4. `BpmTaskOpinionDraft.opinionComment=''` 回读 NULL。
- 启动冒烟上下文显式加入 `FlywayConfiguration` 与 `DatabaseCompatibilityGuard`：
  B2-01 使用的 `ProdBootTestApplication` 排除了 `com.sw.ck.bootstrap.*`，导致真实迁移策略与
  启动检查实际未执行；本批已修正测试入口，迁移策略/守卫在冒烟中真实生效。

### 3.3 本批修复的跨库缺陷

| 缺陷 | 影响 | 修复 |
|---|---|---|
| 动态宽表 DDL 契约只认双引号表名 | MySQL/MariaDB 表单发布被自身守门拦截 | `DynamicTableSql.ddl` 改为解析 `CREATE/ALTER TABLE` 目标表，兼容双引号、反引号、方括号、未引用 |
| 动态宽表 DML 固定 ANSI 双引号 | MySQL/MariaDB 上被当字符串字面量 | 受控执行入口按方言把 ANSI 标识符改写为反引号（MySQL/MariaDB），查询/更新/DDL/锁查询全覆盖；新增单测 |
| 动态宽表元数据检查写死 `information_schema` | Oracle 上表单发布失败 | `tableExists/columnExists` 按方言查询：Oracle/DM `user_tables`/`user_tab_columns`，SQL Server `sys.tables/sys.columns`，MySQL `DATABASE()`，PG 系 `current_schema()` |
| 动态宽表系统列类型写死 `BIGINT/SMALLINT` 与 `NOT NULL DEFAULT` 顺序 | Oracle 不支持 | Oracle/DM 系统列改 `NUMBER(19)/NUMBER(5)` 且 `DEFAULT ... NOT NULL`；SQL Server 改 `NVARCHAR(36)/DATETIME2` |
| Oracle 复合唯一索引“部分列 NULL 仍判重” | 无幂等键通知、空业务键等第二行起写入失败 | 9 个可空唯一键改函数索引：仅非空键参与判重；单列可空唯一索引保持不变 |
| openGauss 默认建库为 `A` 兼容 | 空串变 NULL，种子/业务语义与 PG 不一致 | 冒烟库显式 `ENCODING 'UTF8' DBCOMPATIBILITY 'PG'`；启动检查新增 openGauss 必须 PG 兼容模式 |
| `SwVendorMigrationRunner` 不支持 `DO $$` | openGauss 迁移在块内分号处被切断 | Runner 先整块执行 `DO $$...$$`，剩余脚本再交 `ScriptUtils`；纯注释脚本跳过 |
| openGauss 5 不支持 `ADD COLUMN IF NOT EXISTS`、`ADD COLUMN NOT NULL DEFAULT` 同句 | 迁移链中断 | openGauss 版本化脚本拆为“加列带默认→回填→SET NOT NULL”；去掉 `IF NOT EXISTS` 并去重 3 处重复加列 |
| openGauss 不支持 `INSERT ... ON CONFLICT` | 默认租户种子失败 | 改 `INSERT ... SELECT ... WHERE NOT EXISTS` |
| `DatabaseCompatibilityGuard` 依赖 `JdbcTemplate` 形成启动环 | 冒烟上下文无法启动 | 改为直接依赖 `DataSource` 并自建 `JdbcTemplate`，断开与 Flyway/MyBatis 的环 |
| `JdbcVendorSupport` 每次取方言都借连接 | 高并发动态表路径额外占用连接池 | 增加按 `DataSource` 的弱引用缓存；P62 并发用例复跑通过 |

### 3.4 单库镜像与命令

| 库 | 镜像 | 镜像 sha256 | 容器/端口 |
|---|---|---|---|
| MySQL 5.7 | `mysql:5.7` | `5107333e08a87b836d48ff7528b1e84b9c86781cc9f1748bbc1b8c42a870d933` | `swmdb-mysql57` / 13307 |
| MySQL 8.0 | `mysql:8.0` | `6cd09145362dfe6831b14545de3d5fd6cc75c37cfd6ef8561429c1fc73518b39` | `swmdb-mysql80` / 13308 |
| Oracle 21c XE | `gvenzl/oracle-xe:21-slim-faststart` | `c3406edbfaa13e8cae189cfaf67c8967420a64fb3630cc1f62a3034ca2c6a8ed` | `swmdb-oracle21` / 11521 |
| MariaDB 10.6 | `mariadb:10.6` | `d29a34d05b1de1afa84c88bdad35cbba6dc1d1135ad2a95a8ceb56a710819e82` | `swmdb-mariadb` / 13309 |
| openGauss 5.0 | `opengauss/opengauss:5.0.0` | `187da08af341fe43cb83a24a13ffebdbe15074dacca3bf00204d665c137fe18c` | `swmdb-opengauss` / 15432 |

复跑命令（节选，完整属性见测试类）：

```bash
# MySQL/MariaDB（jdbc:mysql 或 jdbc:mariadb）
mvn -pl sw-bootstrap -am -Dtest=MySqlBootSmokeTest -Dsurefire.failIfNoSpecifiedTests=false \
  -Dmysql.url='jdbc:mysql://127.0.0.1:13307/mysql?...' -Dmysql.user=root -Dmysql.password=*** test

# Oracle
mvn -pl sw-bootstrap -am -Dtest=FlywayFullChainOracleTest,OracleBootSmokeTest -Dsurefire.failIfNoSpecifiedTests=false \
  -Doracle.url='jdbc:oracle:thin:@127.0.0.1:11521/XEPDB1' -Doracle.user=swmdb -Doracle.password=*** test

# openGauss（目标库必须 UTF8 + PG 兼容）
mvn -pl sw-bootstrap -am -Dtest=OpenGaussBootSmokeTest -Dsurefire.failIfNoSpecifiedTests=false \
  -Dopengauss.url='jdbc:opengauss://127.0.0.1:15432/postgres' -Dopengauss.user=gaussdb -Dopengauss.password=*** test
```

## 4. S4：MySQL 8.0 用户变量弃用告警

- 8.0 冒烟日志中出现 `Error Code 1287: Setting user variables within expressions is deprecated`。
  触发点是可重复脚本里 `SET @var := ...` / `SELECT (@var := @var + 1)` 形式的幂等 DDL 守卫与
  授权行 id 顺延；最终迁移结果与 5.7 一致。
- 取舍：不新增 8.0 专用脚本分支。原因：
  1. 8.0 仍完整支持该写法，仅为弃用告警；移除前没有阻断路径。
  2. 分支会复制整套可重复脚本/种子，校验和与种子比对口径分叉，维护成本高于告警收益。
  3. 8.0 窗口函数只能覆盖 ROW_NUMBER 部分，`SET @ddl` + `PREPARE` 的幂等 DDL 守卫仍需保留。
- 触发升级到 MySQL 9（或该语法被移除）时，再单独开任务把守卫改为
  `information_schema` + 应用层判断或存储过程；本批记录为非阻断。
- 同时观察到 `Integer display width is deprecated` 与 `'|| as a synonym for OR'` 告警，
  均不影响执行，后续脚本整理时再清理。

## 5. S5：SQL Server 可空唯一键（方案 + Oracle 已落地）

SQL Server 唯一索引只允许一个 NULL；计划在 SQL Server 脚本生成时统一改为筛选索引：

| 表/索引 | 筛选条件 |
|---|---|
| `sw_notify_message.uk_sw_notify_msg_idempotency` | `WHERE idempotency_key IS NOT NULL` |
| `sw_notify_message.uk_sw_notify_msg_identity` | `WHERE biz_id IS NOT NULL` |
| `sw_form_trace.uk_sw_form_trace_idem` | `WHERE submit_idempotency_key IS NOT NULL` |
| `sw_agent_graph_execution_request.uk_sw_agent_exec_req_idem` | `WHERE create_by IS NOT NULL AND idempotency_key IS NOT NULL` |
| `sw_bpm_command.uk_sw_bpm_command_logical` | `WHERE logical_command_id IS NOT NULL` |
| `sw_bpm_communication.uk_sw_bpm_comm_instance_receiver` | `WHERE task_id IS NOT NULL` |
| `sw_bpm_dynamic_branch.uk_sw_bpm_dyn_branch` | `WHERE round_no IS NOT NULL` |
| `sw_form_config.uk_sw_form_cfg_tname` | `WHERE table_name IS NOT NULL` |
| `sw_iot_device.uk_iot_device_product_device` | `WHERE product_id IS NOT NULL AND device_name IS NOT NULL` |
| `sw_bpm_urge_record.uk_sw_bpm_urge_cooldown` | `WHERE cooldown_key IS NOT NULL`（单列唯一，SQL Server 只允许一个 NULL） |
| `sw_iot_device_command.uk_iot_command_idempotent` | `WHERE idempotent_key IS NOT NULL` |
| `sw_bpm_form_binding.uk_sw_bpm_binding_active` | `WHERE active = 1` |

Oracle 侧同一问题已在本批落地：9 个复合可空唯一键改为 `CASE WHEN ... IS NOT NULL THEN ... END`
函数索引；Oracle 冒烟新增“空幂等键/空业务键可并存、非空键仍唯一”的正反例断言。
SQL Server 脚本尚未生成，筛选索引随 SQL Server 迁移目录一并实现。

## 6. S6：补证据

| 证据 | 测试 | 结果 |
|---|---|---|
| 连接归还池后 `innodb_lock_wait_timeout` 恢复原值 | `MySql57ResourceProbeTest` 新增 Hikari 单连接池用例 | 4/4 通过 |
| `read`/`comment` 对外 JSON 键不变 | `ReservedAliasJsonContractTest`：`NotifyMessage` → `"read":true`；`BpmTaskOpinionDraft` → `"comment"` | 2/2 通过 |

## 7. DM8：脚本与静态检查就绪（Owner 实库验证）

- 新增 `db/migration/dm/` 30 条脚本：由 Oracle 脚本转换，去掉 `VARCHAR2(n CHAR)` 的 `CHAR`
  长度单位，按 `CASE_SENSITIVE=Y`、`LENGTH_IN_CHAR=1`、UTF-8 初始化。
- 新增 `db/migration/dm/README.md`：初始化参数、连接示例、`SeedComparisonTest` 命令、
  Owner 验证清单。
- 静态检查：
  - 保留字清单复核：760 个标识符，DM8 无未处理命中（`comment` 已改名 `opinion_comment`）。
  - 标识符长度：DM 最大 41，低于 128；openGauss/MariaDB 最大 41，低于 63/64。
- **H2 代理未通过**：H2 Oracle 兼容模式不支持达梦的 `ALTER TABLE ... MODIFY (col ...)` 与
  函数索引；`SwVendorMigrationRunnerDmProxyTest` 已加 `@Disabled` 并写明原因，未伪造通过。
- **DM8 待 Owner 确认**：可空唯一键 NULL 判重语义、`uk_sw_bpm_binding_active` 普通唯一索引
  对多条 `active=0` 历史绑定的影响；若与 Oracle 同语义，需单独补丁。

## 8. 阻塞与未完成

1. **SQL Server 2019/2022 未开始**：迁移目录、筛选索引、真实库冒烟均未做；下一批按 S5 方案落地。
2. **KingbaseES V8 未取得安装包**：官网下载中心需要“下载验证”/联系信息，未提供免交互直链；
   按 Planner §3 口径暂停并报告，等待 Owner/Planner 提供授权材料。
3. **DM8 H2 代理不成立**：见 §7；实库由 Owner 验证。
4. **UAT 0.3.2→0.4.0 升级演练**与 `flyway_schema_history` 只读比对：仍留到 0.4.0 发布前。

## 9. 验证汇总

### 9.1 本批专项

| 测试 | 结果 |
|---|---|
| `FormKeyConstraintTest` | 2/2 |
| `MySql57ResourceProbeTest` | 4/4 |
| `ReservedAliasJsonContractTest` | 2/2 |
| `DynamicTableSqlVendorQuoteTest` | 3/3 |
| `DynamicTableSqlContractTest` | 10/10 |
| `DynamicTableSqlGateTest` | 7/7 |
| `DynamicTableManagerMetadataTest` | 1/1 |
| `FlywayFullChainOracleTest` | 1/1（30 条，终点 0.4.0） |
| `MySqlBootSmokeTest`（5.7 / 8.0 / MariaDB） | 各 1/1 |
| `OracleBootSmokeTest` | 1/1 |
| `OpenGaussBootSmokeTest` | 1/1 |
| `OpenGaussSeedMigrationTest` + `SeedComparisonTest` | 1/1 + 1/1（0 差异） |
| `MariaDbSeedMigrationTest` + `SeedComparisonTest` | 1/1 + 1/1（0 差异） |

### 9.2 全量门禁

`mvn -o test`（修复 `JdbcVendorSupport` 方言缓存后重跑）：

| 指标 | 值 |
|---|---|
| 测试 | **2,467** |
| Failures | **0** |
| Errors | **0** |
| Skipped | **39**（含需外部真实库的属性门控测试，如 MySQL/Oracle/openGauss/DM/SQL Server 冒烟与种子比对） |
| 结果 | **BUILD SUCCESS**，25:46 |

首次全量门禁在 `P62TxnActionPgBehaviourTest.concurrentReserveNeverOversells` 出现 1 次锁等待超时；
单测复跑通过。排查发现 `DynamicTableSql` 每次执行都通过 `JdbcVendorSupport` 借连接读方言，
高并发时额外占用连接池；已改为按 `DataSource` 弱引用缓存，二次全量门禁 0 失败。

## 10. 提交与容器

- Server 提交：`7d301304`（`feat(multi-db): B2 单库业务验收与 openGauss/MariaDB/DM8 适配`），已推送
  `origin/feature/0.4.0-multi-database`（远端回读 `7d301304a893f4b86304badd202886cf7aa431ee`）。
- 最终复跑：MySQL 5.7/8.0、Oracle、MariaDB 冒烟在显式加入真实 `FlywayConfiguration` 后全部通过；
  openGauss 冒烟与种子比对使用 Runner 路径通过。
- 容器：`swmdb-mysql57`（B0 既有）保留；本批新建的 `swmdb-mysql80`、`swmdb-oracle21`、
  `swmdb-mariadb`、`swmdb-opengauss` 已删除，对应镜像 `mysql:8.0`、`mariadb:10.6`、
  `opengauss/opengauss:5.0.0`、`gvenzl/oracle-xe:21-slim-faststart` 已清理，sha256 见 §3.4；
  PG 基准库 `seed_base` 已删除。
- 未合并 develop/main，未打 tag/Release，未触碰 UAT 数据库。
