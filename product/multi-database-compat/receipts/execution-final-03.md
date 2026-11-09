# P66 0.4.0 发布执行回执（execution-final-03）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容（XL，0.4.0） |
| 依据 | `product/multi-database-compat/ready/direction-multi-database-compat.md` §4 阶段 D；`product/server-033-agent-tool-enabled-hotfix/receipts/planning-review-033-02.md` §3 |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| Server 分支 | `feature/0.4.0-multi-database` |
| 状态 | **进行中**：X1、V2 六库冒烟、V3 CI（X1 提交）已完成；版本收敛与生产日志调整已推送，等待最终 CI；合并/发版/UAT 部署/发布后同步待续 |
| 结论 | X1 已恢复 Boolean 绑定并用真实 PG 覆盖 12 处查询；六库冒烟全部通过；0.4.0 版本与生产日志已收敛。发布链待最终 CI 与合并 |

## 1. X1：智能体工具 enabled 绑定

### 1.1 10 种方言最终列类型（迁移链跑完后的结果）

依据：各 `db/migration/<vendor>/V0.2.0__baseline_seed.sql` 与 `V0.2.3__f1_stage2_graph_snapshot.sql`；
PG 由 `AgentToolEnabledPgTest` 实读 `information_schema`，MySQL 5.7 由容器实读。

| 方言 | `sw_agent_tool_internal/external.enabled` 最终类型 | 证据 |
|---|---|---|
| H2 | `BOOLEAN` | `h2/V0.2.3` 重建为 `enabled_bool BOOLEAN` |
| PostgreSQL | `BOOLEAN` | `postgresql/V0.2.3`；真实 PG 测试实读 `boolean` |
| MySQL 5.7 | `SMALLINT` | `mysql/V0.2.0`；容器实读 `smallint(6)` |
| MySQL 8.0 | `SMALLINT` | 同 MySQL 迁移链 |
| MariaDB 10.6 | `SMALLINT` | `mariadb/V0.2.0` |
| Oracle 21c XE | `NUMBER(1)` | `oracle/V0.2.3` |
| SQL Server 2022 | `BIT` | `sqlserver/V0.2.0` 两表均 `BIT` |
| openGauss 5.0 | `BOOLEAN` | `opengauss/V0.2.3` |
| DM8 | `NUMBER(1)` | `dm/V0.2.3`；Owner 实库验证 |
| KingbaseES V8 | `BOOLEAN` | `kingbase/V0.2.3`；Owner 实库验证 |

### 1.2 绑定恢复

`26d0e8a7` 的 `1/0` 已全部恢复为 Boolean；动态筛选直接绑定 `query.getEnabled()`。
不改迁移、不改列类型、PG/H2 校验和不变。共 12 处：

- `AgentExternalCapabilityFacade`：2 处（listEnabled、requireConfig）
- `AgentToolCallbackFactory`：2 处（internal/external）
- `AgentGraphDebugServiceImpl`：2 处（internal/external）
- `AgentGraphExecutionServiceImpl`：2 处（internal/external）
- `AgentToolConfigServiceImpl`：4 处（listEnabledInternal/External、pageInternal/External 动态筛选）

### 1.3 新增测试

- `AgentToolEnabledPgTest`：zonky `EmbeddedPostgres` 真实 PG，Flyway 全链后断言两列 `boolean`，
  插入启用/停用行，覆盖 12 处查询（列表过滤、图调试/执行白名单、LLM 回调、服务层 listEnabled、
  表单外部能力门面）。
- `BusinessSmokeSupport.assertAgentToolEnabledFilter`：六库业务冒烟各追加一条内部/外部工具
  启用过滤查询；已接入 MySQL、Oracle、openGauss、SQL Server 冒烟。

### 1.4 门禁

```text
mvn -o test
files 458 | tests 2481 | failures 0 | errors 0 | skipped 45 | BUILD SUCCESS
```

新增 PG 测试计入后较上一轮 2,480 增加 1。用时 25:24。

## 2. V2：最终提交上的六库冒烟

全部在 `f45d2b5d`（X1 代码）上执行，均包含新增的智能体工具启用过滤查询：

| 库 | 版本 | 测试 | 结果 |
|---|---|---|---|
| MySQL 5.7 | 5.7（容器 `swmdb-mysql57`） | `MySqlBootSmokeTest` | 1/0/0 通过 |
| MySQL 8.0 | 8.0.46 | `MySqlBootSmokeTest` | 1/0/0 通过 |
| MariaDB | 10.6.28 | `MySqlBootSmokeTest` | 1/0/0 通过 |
| Oracle | 21c XE | `OracleBootSmokeTest` | 1/0/0 通过 |
| openGauss | 5.0.0 | `OpenGaussBootSmokeTest` | 1/0/0 通过 |
| SQL Server | 2022 (16.0.4305.5) | `SqlServerBootSmokeTest` | 1/0/0 通过 |
| PostgreSQL | 18.4（真实嵌入式） | `AgentToolEnabledPgTest` | 1/0/0 通过 |
| H2 | 既有测试模式 | 全量 `mvn test` | 0 失败 |

各库均完成 30 条迁移、种子、中文/JSON/动态宽表/向量/主流程冒烟；新增工具启用过滤未报
`smallint = boolean` / `boolean = integer`。

## 3. V3：远端 CI

- `f45d2b5d`（X1）run **#123**：**Success**，job `build` 18m 3s。
- `e3f00f93`（版本收敛 0.4.0）run **#124**：**Success**。
- `19ae82f3`（生产默认 INFO）run **#125**：首次与第 2 次尝试均在
  `JavaSubprocessSandboxTest.testFileWriteBlockedBySecurityManager` 失败
  （既有子进程输出读取竞态，见 §8）；第 3 次重跑 **Success**（attempt 3，08:34Z）。
- 合并后：develop `2c3bf850` run **#126** **Success**；main `a4f6c278` run
  **#127**（id `42588179160`）**Success**，并自动创建 `build-a4f6c278…` Release。

## 4. 版本与运维配置

- 根 `pom.xml` `<revision>`：`0.3.2-SNAPSHOT` → **`0.4.0-SNAPSHOT`**。
- `.github/workflows/build-release.yml`、`scripts/build-prod.sh`、`scripts/check-version-identity.sh`
  的版本断言/注释同步 0.4.0。
- `scripts/check-version-identity.sh pom`：PASS；`develop`：PASS（32/32 反应堆项目 = `0.4.0-SNAPSHOT`）。
- `application-prod.yml`：`com.sw.ck` 与 `org.springframework.jdbc` 从 `debug` 调为 `info`；
  root 保持 `info`，未改各类单独等级，后续日志管理页面仍可按类动态开启 DEBUG。

## 5. 合并与发布

- 合并链（普通合并，无强推）：
  - feature `19ae82f3` → develop 合并 **`2c3bf850`**（`merge feature/0.4.0-multi-database into develop`）；
  - develop → main 合并 **`a4f6c278`**（`merge develop into main for 0.4.0`）。
- 远端回读：`origin/develop = 2c3bf850`、`origin/main = a4f6c278`。
- annotated tag：**`0.4.0`** → `a4f6c278`（tag 对象 `6093c4cc…`）；`rev-parse 0.4.0^{commit}` 回读一致。
- 构建 Release：`build-a4f6c27815548e6fd63be0d40e24796139f3f1fa`（id `438913661`），资产
  `bootstrap-0.4.0.jar` **236,245,457 B**，sha256
  `188be963796af0583f2e59653cfc19cd482856e6fc4d0ecd22f102223b5e620b`；jar 内
  `build.version=0.4.0`。
- 语义 Release：**「CH-aPaaS Server 0.4.0」id `438918154`**，tag `0.4.0`，资产同上；
  `releases/latest = 0.4.0`，下载回读 sha256 一致。`build-<sha>` 自动 Release 保留。

## 6. UAT 部署与运维附带项

### 6.1 预检与备份

- 部署前磁盘：可用 **6.0G（68%）**，满足 ≥3G。
- 数据库备份：`/data/backup/smart_workflow_20261109_pre040.dump`（1.3M，sha256
  `2739eed991aa41ca634fdc89b926fae4078f0965cf9a20594808362972c6cea0`）。
- 后端备份：`/opt/smart-workflow/server/bootstrap.jar.bak-pre040`（211M，0.3.2）；
  配置 `server.env.bak-pre040`；最近回退 `.bak-pre032` 保留。
- 上传：`bootstrap.jar.new` 远端 sha256 与 Release 资产一致；替换前 0.3.2 PID 3353565。

### 6.2 升级执行

- `set -a; . ./server.env; set +a; ./stop.sh` → `mv bootstrap.jar.new bootstrap.jar` → `./start.sh`；
  新 PID **3361126**，启动 **174.882s**。
- Flyway：`Successfully applied 2 migrations ... now at version v0.4.0`：
  rank 37 `V0.4.0__knowledge_vector_persistence.sql` checksum `1776052103`；
  rank 38 `R__0.4.0_rename_bpm_opinion_comment.sql` checksum `1839631115`；
  `flyway_schema_history` **33 行**，`max(version)=0.4.0`，全部成功；旧 31 行校验和未变。
- 回读：`build.version=0.4.0`；health `{"status":"UP"}`；`https://chikaho.cn/` **200**；
  `sw_agent_tool_internal.enabled` 仍为 `boolean`。
- 管理员登录后调用：
  - `/agent/tool/internal?enabled=true` → 200，total 3；
  - `/agent/tool/external?enabled=true` → 200，total 1；
  - `/agent/tool/internal?enabled=false` → 200，total 0；
  无 `smallint = boolean` / `boolean = integer`。
- 停机窗口约 **3—4 分钟**（stop → Started）。

### 6.3 运维附带项

- 生产默认日志：`application-prod.yml` 的 `com.sw.ck`、`org.springframework.jdbc` 由 `debug` 调为
  `info`；重启后 17:16—17:32（约 16 分钟）日志 ` DEBUG ` 行 **0**，同期仅 156 行。
- logrotate：原配置备份 `/root/uat-ops-040/smart-workflow.logrotate.bak`；
  `rotate 14`、`maxage 14`、`maxsize 100M`、`compress`；`logrotate -d` 演练通过。
- PG：drop-in `/etc/systemd/system/postgresql@14-main.service.d/restart.conf`
  `Restart=on-failure`、`RestartSec=5s`；`daemon-reload`；`systemctl show` 回读
  `Restart=on-failure`、`RestartUSec=5s`；未重启 PG。
- 未加磁盘告警（Owner 裁决）。

## 7. 发布后同步

已更新（2026-11-09）：

| 入口 | 变更 |
|---|---|
| `README.md` | 按开源项目结构重排：徽章、首图、界面预览、三示例流程（已完成）、Mermaid 架构、多数据库矩阵、快速开始、仓库结构、版本/治理/文档导航、许可证与致谢 |
| `version.json` | 版本 0.4.0、功能 52、Server/Web 发布与部署事实、Flyway/资产/回滚 |
| `CHANGELOG.md` | 新增 0.4.0 段（矩阵、X1、迁移、验证、发布、UAT、运维） |
| `knowledge/current-status.md` | 新增 0.4.0 当前状态；旧 0.3.6 段标为历史 |
| `knowledge/features/multi-database-compat.md` | 第 52 个正式功能登记与矩阵/验收/边界 |
| `memory/state.md`、`handoff.md`、`README.md`、`issues.md` | 当前版本、发布事实、下一动作、风险与索引 |
| `todo/requirement-pool.md` | P66 改为“已完成/待 Planner 终态复核”；新增 IOT 竞态观察项 |
| `todo/iot-subprocess-output-race.md` | 新增 CI 子进程输出竞态记录 |

README 截图（`docs/assets/readme/`，均 <500KB）：

```text
workspace.png          工作台
form-designer.png      表单设计器
workflow-designer.png  流程设计器
approval-detail.png    审批详情/流转记录
agent-graph.png        智能体图编排
sample-a.png           A 应急演练
sample-b.png           B 值班协同
sample-c.png           C MES 异常研判
```

**说明**：宿主 IAB 视口固定 1280×720、DPR 1，无法设置为方向要求的 1440×900/DPR 2；
截图按实际视口留存，未拉伸伪造。链接与图片路径已本地检查；GitHub 渲染回读在推送后补。

## 8. 证据与约束

- 未改已发布迁移；PG/H2 校验和不变。
- UAT 已部署 0.4.0；部署前备份 `/data/backup/smart_workflow_20261109_pre040.dump`（1.3M，
  sha256 `2739eed991aa41ca634fdc89b926fae4078f0965cf9a20594808362972c6cea0`）。
- 未强推、未改写历史、未移动已发布 tag；凭据未写入本回执。
- 本机证据目录：`E:/code/Smart-WorkFlow-Agent-Evidence/p66-040/`（Release JSON、资产、
  UAT 验证码/登录响应/过滤结果；不含凭据正文）。

### 8.1 CI 失败说明（既有测试竞态）

`19ae82f3` 的 run #125 首次与第 2 次尝试均在
`JavaSubprocessSandboxTest.testFileWriteBlockedBySecurityManager` 失败：
`ScriptRunResult.getOutputJson()` 为 null，测试 `.contains()` NPE。根因是
`JavaSubprocessExecutor` 在 `process.waitFor()` 返回后立即读取 `outcome[0]`，
后台 RPC 读取线程可能尚未读到子进程最后的 RESULT 行；本地连续 3 次通过，第 3 次 CI 重跑通过。
该问题与 X1/版本/日志改动无关，已登记 `todo/iot-subprocess-output-race.md`，不阻塞本次发布。
