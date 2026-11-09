# Server 0.3.3 补丁：智能体工具 `enabled` 整数绑定

日期：2026-11-09｜规划（Planner）｜等级：**M**（线上缺陷补丁，单仓 Server，无表结构变更）｜状态：`CANCELLED`（2026-11-09 第 1 步触发停止条件，UAT 不受影响，Owner 确认取消；`receipts/planning-review-033-02.md`）｜不计入功能数

## 0. Owner 裁决与来源

- 来源：P66 B1 返修 R5，以及规划审查 `product/multi-database-compat/receipts/planning-review-b2-01.md` 的 S1。
  - `sw_agent_tool_internal.enabled` 和 `sw_agent_tool_external.enabled` 的列类型是 `SMALLINT`，0.3.2 代码中有 5 个类、共 10 处 `.eq(getEnabled, true/false)`。在 PostgreSQL 上会生成 `smallint = boolean` 比较。
  - P66 分支已在 `26d0e8a7` 中改为 1/0 绑定。
- **Owner 2026-11-09 裁决：单独发 Server 补丁**，不等 0.4.0。

## 1. 目标

Server 在 0.3.2（tag `0.3.2` = `de8ec017`）的基础上发布 **0.3.3**。0.3.3 只包含本缺陷的修复，部署到 UAT，智能体工具相关查询在 PostgreSQL 上不再出现类型错误。Web 不变（维持 0.3.6）。

## 2. 步骤

1. **先查清影响（即 S1，只读）**：
   - 用 `de8ec017` 的代码在真实 PostgreSQL（本机容器，前缀 `swmdb-` 或 `sw033-`）上复现，给出调用入口、SQL 和堆栈。
   - 列出 10 处调用分别属于哪条业务路径，并标明 UAT 上是否走过。可对照三示例流程 C1、C2 的智能体链路。
   - 只读查看 UAT 后端日志，统计有无 `operator does not exist: smallint = boolean` 或同类报错，记录次数和时间范围。**不连接、不改动 UAT 数据库。**
   - 如果复现不出来，或者证明 UAT 不受影响，**停在这一步，回执给 Planner**，由 Planner 报告 Owner 后再决定是否继续发版。
2. **修复**：
   - 从 Server `main` 建分支 `hotfix/0.3.3-agent-tool-enabled`。
   - 只移植 `26d0e8a7` 中 `enabled` 绑定的改动。不得带入 P66 的其他改动，例如方言、拦截器、迁移。
   - 补一个在真实 PG 上执行的测试：修复前失败、修复后通过，覆盖 10 处调用对应的查询。
   - **不新增、不修改迁移脚本**；Flyway 迁移链与 0.3.2 完全相同。
3. **门禁**：
   - Server 全量 `mvn test` 通过。
   - 确认 Server 仓库里还没有 `0.3.3` 这个 tag。已存在的 tag 一律不动；万一 `0.3.3` 已被占用，顺延补丁号，并在回执中写明。
4. **合并与发版**：
   - hotfix 合入 `main`，并回合到 `develop`。
   - 打 tag `0.3.3`，CI 构建，发 Release，记录产物 sha256。
5. **部署到 UAT**：
   - 只替换后端：先备份原 jar 与配置，再替换，再重启。
   - 部署后核对：`build.version=0.3.3`，health 为 UP，`flyway_schema_history` 只读确认没有新增记录。
   - 用管理员账号在 UAT 上访问一遍智能体工具列表和启用过滤，确认没有报错。
   - **部署前确认根分区可用空间 ≥ 3G**（2026-11-09 恢复后为 66%，余 6.4G）。不够就停下报告，不得删除本次以外的文件。
   - 同一次部署完成 §6 的运维附带项。
6. **发布后同步**：更新 `version.json`（Server 0.3.3）、`CHANGELOG.md`、根 `README.md` 当前发布段、`knowledge/current-status.md`、`memory/*`、`todo/requirement-pool.md`。

## 3. 与 P66 的并行关系（system.md §4 冲突判定）

| 冲突类型 | 判定 | 处理 |
|---|---|---|
| 同一代码模块 | **有**：P66 分支已改同样的 10 处 | 本补丁先发。P66 在发布 0.4.0 前合入最新 `develop`；两边改动内容相同，冲突按 P66 一侧解决，并在 P66 回执中写明 |
| 迁移链 | 无（本补丁不动迁移） | — |
| 分支和版本号 | 无（`hotfix/0.3.3-*` / 0.3.3，P66 是 `feature/0.4.0-*` / 0.4.0） | — |
| UAT 环境 | 本补丁要部署 UAT；P66 在 0.4.0 发布前不碰 UAT | 无冲突 |
| 发布先后 | 0.3.3 先于 0.4.0 | P66 发版时从包含 0.3.3 的 `main` 走门禁 |

**排期**：本补丁优先执行；P66 B2 第二批可以并行推进，因为它不碰 Server 的 `main`/`develop` 和 UAT。

## 4. 回执

- 第 1 步（影响核实）：日志部分已在 `receipts/execution-033-01.md`（PARTIAL）；复现与 10 处路径映射写入 `receipts/execution-033-02.md`，覆盖第 1 步全部，并补 UAT 恢复审查 W1（PM2 整体移除后，确认没有其他进程因此停止：对比当前端口监听清单，若有留存则附删除前 `pm2 list`）。不受影响时就在这里停下。
- 第 2—6 步及 §6：`receipts/execution-033-03.md`。要包含发布事实（commit、tag、Release ID、sha256、UAT 部署回读）以及发布后同步覆盖矩阵。

## 5. 约束

- 不删除、不重建 UAT 服务器、数据库和容器，不清数据。
- 不强推，不改写历史，不移动已发布的 tag。
- 截图、凭据不入 Git。
- 不碰 Web 子模块里未提交的改动，也不碰 Web `vite.config.ts` 的在途改动。

## 6. 运维附带项（Owner 2026-11-09 裁决，随本补丁部署一起做）

来源：`product/uat-recovery-20261109/receipts/planning-review-uat-recovery-01.md` §4 W2/§6。如果第 1 步结论是取消 0.3.3，本节整体并入 0.4.0 的 UAT 部署执行，由 Planner 写入 P66 方向。

1. **默认不输出 DEBUG 日志**（属于代码仓配置改动，进本补丁）：
   - 先只读查明 UAT 上 DEBUG 输出的来源（生产 profile 的 `logging.level.*`、logback/log4j 配置、MyBatis SQL 日志等），写入回执。
   - 只把“默认输出 DEBUG”关掉，让生产默认只输出 INFO 及以上。**不逐个调整各类的日志等级**，也不新增按类配置。
   - 不能用 appender 级别的阈值过滤器把 DEBUG 永久挡掉：后续日志管理页面要能对单个类动态打开 DEBUG，并让它真正输出。
   - 不改业务代码；`mvn test` 照常全量通过。
   - 部署后回读：重启后 10 分钟内的日志无 DEBUG 行；记录部署后第一个完整 24 小时的日志量，写进发布后同步（预期远低于此前的约 500MB/天）。
2. **日志轮转**（UAT 运维）：先读现有 logrotate 配置（当前已按日轮转并压缩），在此基础上补 `maxsize 100M`、`rotate 14`、`compress`。如果后端用的是框架自带轮转，改为同样的口径即可，二者只保留一种。备份原配置到 `/root/uat-ops-033/`，再用 `logrotate -d` 演练。
3. **PG 崩溃后自动拉起**：为 `postgresql@14-main` 增加 systemd drop-in（`Restart=on-failure`、`RestartSec=5s`），执行 `daemon-reload`，回读 `systemctl show -p Restart`。**不需要为此重启 PG。**
4. **不做**：不加磁盘告警（Owner：系统不是一直在用，需要时再清理）。部署前“可用空间 ≥ 3G”的门槛保留。
5. reasonix 的两处保留项（`/root/TODO-reasonix-openrouter.md`、`/root/.claude/projects/-data-reasonix-files*`）Owner 同意保留，不要处理。
