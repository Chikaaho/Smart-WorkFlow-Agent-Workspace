# P66 多数据库兼容：B1 公共能力批次（execution-b1-01）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容：迁移脚本与 SQL 种子适配（XL，目标版本 0.4.0） |
| 依据 | `ready/direction-multi-database-compat.md`、`receipts/planning-review-assess-01.md`、`receipts/planning-review-assess-02.md` |
| 阶段 | B1 公共能力（第一批，可分批提交） |
| 日期 | 2026-11-08 |
| 执行角色 | Executor |
| 分支 | Server `feature/0.4.0-multi-database`（从 `origin/develop` `4d606f60` 建） |
| 提交 | `e4ab77ce feat(multi-db): B1 公共方言能力与迁移执行器`、`36ff3957 test(multi-db): 验证 opinion_comment 改名保留数据` |
| 自验结论 | B1 核心能力已提交，受影响模块测试通过；全量门禁与真实数据库验证列为 B1-B |
| 七阶段进度 | **1 / 1 / 5**（需求评估完成；执行进行中，B1 核心批次完成；验收与同步、合并、发版、发布后同步、结束未开始） |

## 1. 本批完成内容

### 1.1 方言能力

- 新增 `sw-common` 的 `DatabaseVendor`：H2、PostgreSQL、MySQL、MariaDB、Oracle、SQL Server、达梦、KingbaseES、openGauss 九种厂商；JDBC URL 前缀优先、产品名兜底，未知厂商 fail-fast，不再默认 H2。
- 扩展表单 `VendorDialect` 到九种厂商，列类型、标识符引用与 `DatabaseVendor` 统一；动态宽表 BOOL/TEXT/大文本按方言映射。
- 标识符引用：MySQL/MariaDB 反引号，SQL Server 方括号，其余双引号；为 `type` 等后续保留字命中预留统一入口。

### 1.2 LIMIT 与行锁

- 新增 `SqlDialectRewriteInterceptor`（`StatementHandler.prepare`）：处理尾部 `LIMIT n [OFFSET m]`，大小写不敏感；Oracle 改 `FETCH FIRST`/`OFFSET ... FETCH`；SQL Server 改 `OFFSET ... FETCH`，无 ORDER BY 时补 `ORDER BY (SELECT NULL)`；SQL Server `FOR UPDATE [SKIP LOCKED]` 改 `WITH (UPDLOCK, ROWLOCK[, READPAST])`；Oracle `FOR UPDATE`+LIMIT、非顶层 LIMIT 直接报错。
- 单测覆盖：原生 LIMIT 不改写、Oracle/SQL Server 改写、`?` 占位、`FOR UPDATE`、字符串/注释内的 LIMIT、非顶层 LIMIT 报错。
- 实际站点：`.last` **129 处**（大写 97 + 小写 32）+ 注解 LIMIT **8 处**由拦截器统一处理；手写 LIMIT **10 处**（FormDataQueryService 4、FormAppAccessGuard 1、FormDataDeleteService 1、BpmResourceOpsService 2、TxnActionNodeDelegate 1、PgKnowledgeVectorStore 1）。前 9 处改用 `JdbcVendorSupport`，PgKnowledgeVectorStore 1 处只在 PG 执行、保持不变。覆盖 **146/147**。
- 行锁组合盘点：6 处真实行锁 SQL 与 LIMIT 同时出现的站点为 **0 处**；拦截器仍保留组合检测，遇到无法安全改写时抛错。

### 1.3 SQL 可移植性修复

- 15 处三参数 `CONCAT('%', #{p}, '%')` 全部改为嵌套 `CONCAT(CONCAT('%', #{p}), '%')`：JobInfoMapper 1、SysUserMapper 2、SysUserGroupMapper 4、CopyRecordMapper 8。
- `AgentGraphExecutionMapper` 的 2 处 `CAST(... AS VARCHAR)` 消除：SELF 档改绑 `DataScopeFilter.getUserIdText()`；部门档改 `create_by IN (SELECT CONCAT('', id) FROM sys_user ...)`。
- `JdbcMaps` 公共工具：`caseInsensitiveKeys`（保留原始键、大小写不敏感读取，用于内部取数）与 `lowerCaseKeys`（对外视图统一小写键）。修复 5 处 Map 键：
  - `TxnActionNodeDelegate`（error_code/error_msg/id）
  - `DeptFacadeImpl`（dept_id/parent_id/leader_id）
  - `UserFacadeImpl`（dept_id/leader_id）
  - `BpmProcessDefController`（cnt）
  - `ApprovalLifecycleServiceImpl`（max_round/branch_total/total）
- `BpmResourceOpsService` 原私有 `lowerCaseKeys` 改为委托公共工具；视图输出仍统一小写键。

### 1.4 comment 列改名

- `sw_bpm_task_opinion_draft.comment` → `opinion_comment`；`BpmTaskOpinionDraft.@TableField` 改为 `opinion_comment`，Java 字段名与对外 API 字段 `comment` 不变。
- **实现方式偏差**：Planner 要求“0.4.0 版本化迁移”，但版本化迁移在空库上先于 `R__0.2.0` 执行，此时表尚未创建，必然失败。改为 `R__0.4.0_rename_bpm_opinion_comment.sql` 可重复迁移，在 `R__0.2.0` 建表后执行；PG 用 `DO $$` 检查 `information_schema.columns`，H2 用 `MigrationSupport.renameColumnIfExists` Java 别名检查列存在性。重复执行幂等；旧脚本未改，校验和不变。
- 全仓检索：`sw_bpm_task_opinion_draft` 只被 `BpmTaskOpinionDraft` 与其 Controller 使用；对外 JSON 字段 `comment` 保持不变，前端接口字段未变。

### 1.5 启动检查与 JSON

- 新增 `DatabaseCompatibilityGuard`（`ApplicationRunner`）：
  - MySQL/MariaDB：数据库字符集 `utf8mb4`、排序规则 `utf8mb4_bin`；MySQL 5.7 另查 `innodb_default_row_format=dynamic`、`innodb_large_prefix=ON`；MySQL 8.0 跳过已移除的大前缀变量。
  - SQL Server：数据库排序规则含 `_CS_` 或 `_BIN`。
  - Oracle：`NLS_CHARACTERSET` 为 `AL32UTF8`/`UTF8`。
  - PostgreSQL/Kingbase/openGauss：`server_encoding=UTF8`。
  - 达梦：只记录 `CASE_SENSITIVE`、`LENGTH_IN_CHAR`、`COMPATIBLE_MODE`，不阻断。
  - H2：测试/开发库跳过。
- `JsonStringTypeHandler` 按方言绑定：PG/Kingbase/openGauss/H2 用 `Types.OTHER`，MySQL/MariaDB/SQL Server 用 `setString`，Oracle/达梦用字符流写 CLOB；读取按 CLOB/文本类型选择。

### 1.6 MySQL 5.7 资源段探测

- 新增 `ResourceRowLockProbe`：支持 `SKIP LOCKED` 的数据库沿用 `BpmResourceUsageMapper.probeIdleRow`；SQL Server 用 `WITH (UPDLOCK, ROWLOCK, READPAST)`；MySQL 5.7 用带语句超时和 `innodb_lock_wait_timeout=1` 的 `FOR UPDATE`，超时按段忙返回 null；达梦用语句超时探测。
- `ResourceAdmissionService` 通过可选 setter 注入探测器；单测直接构造时回退原 Mapper。
- 真实 MySQL 5.7 并发领取测试列为 B1-B（需要启动 5.7 容器并配置 utf8mb4_bin）。

### 1.7 非 PG 向量持久化

- 新增 `PersistentKnowledgeVectorStore`（`sw.knowledge.vector-store=database`）：向量以 `[0.1,0.2,...]` 文本存于 `sw_knowledge_vector`，检索时从数据库载入并在进程内计算 cosine；删除与 PG 实现同口径。
- 新增 H2/PostgreSQL `V0.4.1__knowledge_vector_persistence.sql`；PostgreSQL 继续使用 pgvector，本表供其他方言使用。
- 真实非 PG 库的写入/检索性能与正确性列为 B2。

### 1.8 迁移执行器与比对工具

- 新增 `SwVendorMigrationRunner`：达梦/Kingbase/openGauss 使用独立 `sw_schema_history`；SHA-256 校验和、版本化只执行一次、重复脚本校验和变化时重跑、`sw_schema_history_lock` 行锁、已有业务表无历史表拒绝自动 baseline、校验和不一致拒绝启动；`FlywayConfiguration` 按厂商分流，其他数据库继续 Flyway。
- 新增 `SwVendorMigrationRunnerTest`（H2 代理）：空库全链、重复启动零执行、已有业务表拒绝 baseline、锁占用拒绝并发，3/3 通过。
- 新增 `SeedComparisonTest`：通过 `seed.base.url`/`seed.target.url` 连接两库，比较全部 `sys_*`/`sw_*` 表行数与 18 张关键表的排序关键列 SHA-256；`''` 与 NULL 归一化。未配置系统属性时跳过，B2 每库执行。

## 2. 验证结果

### 2.1 受影响模块

| 模块 | 测试数 | 失败/错误/跳过 |
|---|---:|---|
| `sw-framework/sw-common` | 51 | 0/0/0 |
| `sw-biz-form-biz` | 272 | 0/0/0 |
| `sw-biz-system-biz` | 393 | 0/0/0 |
| `sw-bpm-process` | 522 | 0/0/0 |
| `sw-bpm-engine` | 180 | 0/0/0 |
| `sw-basic-agent` | 352 | 0/0/0 |
| `sw-basic-knowledge` | 14 | 0/0/0 |
| 合计 | **1,784** | 0/0/0 |

### 2.2 迁移与启动专项

| 测试 | 结果 |
|---|---|
| `FlywayFullChainH2Test` | 20/20；30 条迁移（10 versioned + 20 R__），终点 V0.4.1 |
| `FlywayFullChainPostgresTest` | 13/13；30 条迁移，终点 V0.4.1；重复 migrate 零执行 |
| `ApplicationCenterLegacyUpgradeTest` | 7/7；0.2.0 升级衔接后 17 条新增迁移，终点 V0.4.1 |
| `ApplicationCenterUpgradeContinuityTest` | 4/4 |
| `I6G7UpgradeDrillH2Test` | 2/2；两阶段升级终点 V0.4.1 |
| `I6G7bOldBaselineUpgradePostgresTest` | 2/2；历史表 30 条成功记录 |
| `TenantAdministrationDatabaseTest` | 30/30 |
| `SwVendorMigrationRunnerTest` | 3/3 |
| `MigrationSupportTest` | 1/1；comment→opinion_comment 保留“保留意见”数据，重复执行幂等 |

### 2.3 校验和

- `db/migration/h2/` 与 `db/migration/postgresql/` 的既有 56 个 SQL 文件未修改；本批只新增 `V0.4.1` 与 `R__0.4.0` 两个文件（各两份）。
- PG 全链 `validate()` 通过；UAT 的 `flyway_schema_history` 只读比对留到阶段 B 完成后执行。

## 3. 未完成项（B1-B）

1. **全工程 H2 + PG 全量测试**：本批已跑受影响模块与迁移专项，尚未完成整个 reactor 的 `mvn test`；B1-B 跑完并记录最终计数。
2. **0.3.2 库升级的数据保留**：H2 已有改名保留数据单测；PG 从 0.3.2 库（V0.2.9 终点）升级到 V0.4.1 并保留审批意见数据，需补一次真实升级测试。
3. **真实数据库验证**：MySQL 5.7/8.0、MariaDB、Oracle 21c XE、达梦、Kingbase、openGauss、SQL Server 的迁移、启动检查、JSON 绑定、向量持久化、种子比对尚未执行。
4. **MySQL 5.7 并发领取测试**：`ResourceRowLockProbe` 代码已就位，多线程不重复/不阻塞的真实测试待 B1-B。
5. **保留字完整清单**：`scripts/db-compat/check-reserved-words.py` 已固化常用清单并重跑，命中 `comment`（已改名）与 `type`（DM8/Kingbase 候选，B2 实测后决定引用或改名）；完整官方清单与各库 `DatabaseMetaData.getSQLKeywords()` 对照留到 B2。
6. **种子比对实际执行**：工具已就位，尚未用两个真实库跑差异报告。

## 4. 七阶段

| 阶段 | 状态 |
|---|---|
| 1 新需求评估 | ✅ 完成 |
| 2 执行（A→B0→B1→B2→C） | 进行中：A、B0 完成；B1 核心批次已提交，B1-B 继续 |
| 3 验收与同步 | ⬜ 未开始 |
| 4 合并 | ⬜ 未开始 |
| 5 发版（0.4.0） | ⬜ 未开始 |
| 6 发布后同步 | ⬜ 未开始 |
| 7 结束 | ⬜ 未开始 |

已完成 **1**，进行中 **1**，未开始 **5**。

下一步：继续 B1-B（全量门禁、0.3.2 升级数据保留、真实数据库验证、MySQL 5.7 并发、种子比对），完成后再进入 B2 单库适配。

## 5. 分支与提交

- 分支：`feature/0.4.0-multi-database`，从 `origin/develop` `4d606f60` 建。
- 提交：`e4ab77ce`（核心能力）、`36ff3957`（改名数据测试）。
- 远端回读：`git ls-remote origin refs/heads/feature/0.4.0-multi-database` = `36ff3957a1a25b98c386766acb143fc2a36ffe00`。
- 未合并到 develop/main，未创建 tag/Release，未发布。

## 6. 主要改动文件

- `sw-framework/sw-common`：`DatabaseVendor`、`JdbcVendorSupport`、`JdbcMaps`、`SqlDialectRewriteInterceptor`、`MybatisPlusConfig`、`DataScopeFilter` 及单测。
- `sw-biz-form-biz`：`VendorDialect`、`JsonStringTypeHandler`、`FormDataQueryService`、`FormDataDeleteService`、`FormAppAccessGuard`。
- `sw-biz-system-biz`：`DeptFacadeImpl`、`UserFacadeImpl`、`SysUserMapper`、`SysUserGroupMapper`。
- `sw-bpm-process`：`BpmTaskOpinionDraft`、`ResourceAdmissionService`、`ResourceRowLockProbe`、`BpmResourceOpsService`、`BpmProcessDefController`、`ApprovalLifecycleServiceImpl`、`CopyRecordMapper`。
- `sw-bpm-engine`：`TxnActionNodeDelegate`。
- `sw-basic-agent`：`AgentGraphExecutionMapper`。
- `sw-basic-knowledge`：`PersistentKnowledgeVectorStore`。
- `sw-bootstrap`：`FlywayConfiguration`、`DatabaseCompatibilityGuard`、`SwVendorMigrationRunner`、`MigrationSupport`、H2/PG `V0.4.1`/`R__0.4.0`、迁移与种子比对测试。
- `scripts/db-compat/check-reserved-words.py`。
