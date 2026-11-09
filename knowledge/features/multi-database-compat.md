# 多数据库兼容（P66，第 52 个正式功能）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容 |
| 等级 | XL |
| 版本 | Server 0.4.0 |
| 登记 | 第 **52** 个正式功能 |
| 方向 | `product/multi-database-compat/ready/direction-multi-database-compat.md` |
| 执行回执 | `product/multi-database-compat/receipts/execution-final-01.md`、`execution-final-02.md`、`execution-final-03.md` |
| 发布 | tag `0.4.0`=`a4f6c278`，Release `438918154`，`bootstrap-0.4.0.jar` 236,245,457 B sha256 `188be963…` |
| UAT | Server 0.4.0，build.version=0.4.0，health UP，Flyway v0.4.0 |

## 1. 交付内容

- 迁移脚本与全部 SQL 种子按方言适配：H2、PostgreSQL、MySQL 5.7/8.0、MariaDB 10.6、Oracle 21c XE、SQL Server 2019+、openGauss 5.0、DM8、KingbaseES V8。
- 方言抽象：`DatabaseVendor`/`VendorDialect`、`JdbcVendorSupport`、供应商缓存、动态宽表方言改写、行锁/LIMIT、JSON/布尔/空串语义。
- 六库迁移、种子两层比对、启动与业务冒烟；U1 表结构一致性（表/列/可空性）0 差异。
- SQL Server 终态基线（显式方案偏离）与 `pg-repeatable-checksums.properties` 同步门禁。
- openGauss `DBCOMPATIBILITY 'PG'`、Kingbase `database_mode=pg` 启动检查。
- X1：智能体工具 `enabled` 恢复 Boolean 绑定，真实 PG 测试覆盖 12 处查询；六库冒烟各加启用过滤。
- 部署文档 `docs/deployment/multi-database.md`。

## 2. 支持矩阵

| 数据库 | 版本 | 验证 |
|---|---|---|
| H2 | 测试/开发模式 | 全量测试 |
| PostgreSQL | 14.24 UAT / 17.5+ CI | 实测 + UAT 校验和 28/28 |
| MySQL | 5.7 / 8.0 | 实测 |
| MariaDB | 10.6 | 实测 |
| Oracle | 21c XE | 实测 |
| SQL Server | 2019+ / 2022 | 实测 |
| openGauss | 5.0 | 实测 |
| DM8 | — | Owner 实库验证 |
| KingbaseES | V8 | Owner 实库验证 |

## 3. 验证

- 全量 `mvn test`：**2,481 / 0 failures / 0 errors / 45 skipped**。
- 六库冒烟在最终提交 `f45d2b5d` 上通过（MySQL 5.7/8.0、MariaDB、Oracle、openGauss、SQL Server）。
- PG 真实测试 `AgentToolEnabledPgTest`：12 处 enabled 查询通过。
- 远端 CI：feature run #123、develop #126、main #127 均 success；`build-<sha>` 与语义 Release 资产同字节。
- UAT 0.3.2→0.4.0：新增 `V0.4.0`/`R__0.4.0` 两条，旧 31 条校验和不变；33 行历史，终点 0.4.0。

## 4. 升级与回退

- 升级：备份 DB/jar → 停服 → 替换 jar → `. ./server.env` → 启动；Flyway 自动应用 2 条。
- 回退：`bootstrap.jar.bak-pre040`；数据库备份
  `smart_workflow_20261109_pre040.dump`（如需回退 schema）。
- 生产默认日志 INFO；logrotate `rotate/maxage 14`；PG `Restart=on-failure`/`RestartSec=5s`。

## 5. 已知边界

- DM8、KingbaseES 由 Owner 实库验证；发布说明标注“由 Owner 验证”。
- SQL Server 采用终态基线，版本号相同但占位脚本不代表历史增量，部署/发布说明必须标注。
- P66 期间发现 `JavaSubprocessExecutor` 子进程输出读取竞态（CI 偶发），已登记 `todo/iot-subprocess-output-race.md`，不属本功能范围。
