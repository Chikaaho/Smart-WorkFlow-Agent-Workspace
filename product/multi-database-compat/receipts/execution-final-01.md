# P66 多数据库兼容：最终回执（execution-final-01）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容（XL，目标 0.4.0） |
| 依据 | `ready/direction-multi-database-compat.md` §5、`receipts/planning-review-b2-03.md` §2—§5 |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 分支 | Server `feature/0.4.0-multi-database` |
| 结论 | U1—U4 完成；六库表结构/迁移/种子/启动/业务矩阵通过；UAT 校验和比对已完成（见 `execution-final-02.md`，28/28 一致、0 差异）；DM8/Kingbase 由 Owner 验证 |
| 七阶段 | **1 / 1 / 5**（实现完成；最终回执待审查；合并发版未完成） |

## 1. 数据库矩阵（含 U1 表结构）

基准：PostgreSQL 0.4.0 终态。U1 逐库比较 **表集合、每表列集合、每列可空性**。

| 库 | 迁移 | 种子两层比对 | U1 表结构 | 启动/业务冒烟 | form_key |
|---|---|---|---|---|---|
| MySQL 5.7 | 30 | 0 差异 | 0 差异 | 通过 | 通过 |
| MySQL 8.0 | 30 | 0 差异 | 0 差异 | 通过 | 通过 |
| MariaDB 10.6 | 30 | 0 差异 | 0 差异 | 通过 | 同 MySQL |
| Oracle 21c XE | 30 | 0 差异 | 0 差异 | 通过 + 空串 4 项 | 通过 |
| openGauss 5.0 | 30（Runner） | 0 差异 | 0 差异 | 通过 | 同 PG |
| SQL Server 2022 Developer | 30 | 0 差异 | 0 差异 | 通过 | 通过 |
| H2 / PostgreSQL | 30 | 既有 0 差异 | 基准 | 既有覆盖 | H2/PG 内嵌 |

### 1.1 U1 白名单

| 差异 | 方言 | 原因 |
|---|---|---|
| PG `sw_knowledge_chunk.embedding` | 仅 PG | pgvector 列；非 PG 用 `sw_knowledge_vector` 文本表 |
| MySQL/MariaDB `sw_bpm_form_binding.active_key` | MySQL/MariaDB | 无部分索引，用生成列承载 `active=1` 唯一语义 |

U1 测试：`SchemaConsistencyTest`（六库真实 JDBC，按 `DatabaseMetaData` 读表/列/可空性）。
DM/Kingbase 静态：`StaticSchemaParityTest` 解析脚本，表/列集合与 PG 一致
（`sw_knowledge_chunk.embedding` 白名单）。

### 1.2 U1 发现并修复

MariaDB 在 `explicit_defaults_for_timestamp=OFF` 时会把 `TIMESTAMP` 隐式建为 NOT NULL，
导致大量列可空性与 PG 不一致。已修复：

- `DatabaseCompatibilityGuard` 对 **MySQL 和 MariaDB** 都强制
  `explicit_defaults_for_timestamp=ON`，不满足拒绝启动；
- `MariaDbSeedMigrationTest` 自动追加 `sessionVariables=explicit_defaults_for_timestamp=ON`；
- 部署文档写入 MariaDB 建库前提。
修复后 MariaDB U1 0 差异、启动冒烟通过。

## 2. U2：SQL Server 终态基线与维护规则

- 方案偏离已明确记录在 `docs/governance/engineering-constitution.md` §6.3：
  SQL Server 版本号相同但占位脚本不代表历史增量；部署/发布说明必须标注。
- 维护门禁：`db/migration/sqlserver/pg-repeatable-checksums.properties` 固化
  20 个 PG `R__` 与 SQL Server 种子的 SHA-256；`SqlServerRepeatableSyncTest` 在 PG R__
  改动未同步时失败。规则已写入工程宪法与 SQL Server README。
- 输入来源：本机 PostgreSQL 18.4 `seed_base`，`pg_dump --schema-only` 与
  `--data-only --inserts --column-inserts`；`seed_base` 仅由迁移链生成，无手工数据。
  UAT 现用 PostgreSQL **14**（`14-main`，端口 5433）；SQL Server 为目标库，
  PG 18 dump 的 DDL 已通过 U1 与 SQL Server 实库冒烟验证。
- 生成工具：`scripts/db-compat/generate_sqlserver.py`（文件数、类型映射、筛选索引、
  Flyway 历史表排除均已固化）。

## 3. U3：Kingbase/openGauss 兼容模式

- openGauss：原有检查保留，必须 `DBCOMPATIBILITY 'PG'`。
- Kingbase：`DatabaseCompatibilityGuard` 依次探测
  `SHOW database_mode` / `SHOW sql_compatibility` / `SHOW compatibility_mode`；
  识别到值必须 `pg`/`postgresql`。三个参数都无法读取时只告警，Owner 验证时人工确认。
- `db/migration/kingbase/README.md` 已写明必须按 PostgreSQL 模式初始化，
  并列出参数名随版本差异与 Owner 确认项。

## 4. U4：提交身份

矩阵执行时工作树与 Server `02598b8c` 相同（该提交包含全部矩阵相关代码与脚本）。
为证明，另建 detached worktree：

```bash
git worktree add --detach /tmp/wt-b203 02598b8c
cd /tmp/wt-b203
mvn -pl sw-bootstrap -am -Dtest=SqlServerSeedMigrationTest,SqlServerBootSmokeTest ... test
```

- `SqlServerSeedMigrationTest`：30 条迁移通过；
- `SqlServerBootSmokeTest`：启动/业务冒烟通过。
- 结论：矩阵结果可归因到 `02598b8c`。U1—U3 后续改动仅为测试、守护与文档，
  未改变迁移/种子/业务代码。

## 5. UAT 只读校验和比对（阻塞）

只读 SSH 检查（未启动服务、未写数据库）：

- UAT PostgreSQL 14 集群 `14-main` 状态 **down**，端口 5433 无监听；
- 后端 `/api/actuator/health` 返回 **503**；
- 服务器根分区使用率 **95.7%**；
- 因此无法读取 `smart_workflow.flyway_schema_history`，校验和比对未完成。

未执行任何写操作。解除条件：Owner 启动 UAT PostgreSQL 14（或提供只读副本/连接），
Executor 再执行只读 `installed_rank/script/checksum` 对比，确认 0.4.0 仅新增
`V0.4.0` 与 `R__0.4.0` 两条、旧迁移校验和全部一致。

> **2026-11-09 更新（UAT 恢复后）**：UAT PG 14 已恢复运行；只读比对结果见
> `execution-final-02.md`。`flyway_schema_history` 31 行、28 个唯一脚本的当前生效
> 校验和与分支逐条一致（28/28，0 差异）；分支相对 UAT 仅新增 `V0.4.0` 与
> `R__0.4.0`。本节阻塞解除。

## 6. 方言改动清单（汇总）

| 方言 | 关键改动 |
|---|---|
| 公共 | `DatabaseVendor`/`JdbcVendorSupport`；SQL 方言改写；租户/逻辑删除；动态宽表受控入口按方言引用/类型/元数据；供应商缓存 |
| MySQL/MariaDB | 反引号；`utf8mb4_bin`；`explicit_defaults_for_timestamp=ON`；`JSON`/`LONGTEXT`；`active_key` 生成列；`||`→`CONCAT`；用户变量顺延；`FOR UPDATE` 版本分支 |
| Oracle | `VARCHAR2(n CHAR)`、`NUMBER`、CLOB；`FROM dual`；`DEFAULT ... NOT NULL`；空串=NULL；9 个可空唯一键 + `binding_active` 函数索引；`form_key (tenant_id, form_key, deleted)` |
| openGauss | UTF8 + `DBCOMPATIBILITY 'PG'`；Runner `DO $$`；ADD COLUMN 三步；去 `IF NOT EXISTS`；`ON CONFLICT` 改写；去 pgvector |
| SQL Server | 终态基线；`NVARCHAR/DATETIME2/BIT`；`Chinese_PRC_CS_AS`；12 个筛选索引；`flyway_schema_history` 排除；基线维护门禁 |
| DM8 | Oracle 派生，703 处 CHAR 单位差异；函数索引与 Owner 正反例；Owner 实库验证 |
| KingbaseES | PG 派生，V0.2.5 去 pgvector；PG 兼容模式检查；Owner 实库验证 |

## 7. 部署文档

`docs/deployment/multi-database.md` 已包含：

- 每库字符集/排序规则/兼容模式/DM 初始化参数；
- JDBC 示例；
- `sw.knowledge.vector-store`（PG `pgvector`，其他 `database`）；
- SQL Server 终态基线偏离说明；
- DM/Kingbase Owner 验证责任。

## 8. 验证与门禁

- 全量门禁：`mvn -o test` → **2,480 tests / 0 failures / 0 errors / 45 skipped / BUILD SUCCESS**（28:25）。
  45 skipped 均为需外部真实库的属性门控测试。
- 本批专项：U1 六库 0 差异；U2 同步门禁通过；U3 编译；U4 worktree SQL Server 迁移/冒烟通过；
  MariaDB 修复后启动冒烟与种子比对通过。
- 远端 CI：本环境未配置 `gh`，未触发/查询 GitHub Actions；发布前由 CI 复跑。

## 9. 排期与未完成

1. **UAT 校验和比对阻塞**：UAT PG 14 down，需 Owner 启动或提供只读副本。
2. **Server 0.3.3 补丁**：独立方向，尚未有 `execution-033-01.md`；合并/发版按 Planner
   §4 排在补丁之后。
3. **DM8/Kingbase**：Owner 实库验证。
4. **阶段 3/4/5**：UAT 只读比对、合并、发版、发布后同步、结束未开始。
5. 未合并 develop/main，未打 tag/Release，未触碰 UAT 数据库。

## 10. 提交

- Server 最终提交：`bf62381f`（`test(multi-db): U1-U4 表结构一致性、SQL Server 同步门禁与部署前提`），
  已推送 `origin/feature/0.4.0-multi-database`。
- 此前矩阵/收尾提交：`02598b8c`（B2-03 实现），U4 已在该提交的 detached worktree 上复跑
  SQL Server 迁移与启动冒烟。
- Workspace 回执随本文件提交。
