# UAT 恢复：PostgreSQL 14 停止与磁盘水位

日期：2026-11-09｜规划（Planner）｜等级：**M**（运维恢复，不改代码、不发版）｜状态：`READY`｜不计入功能数｜**优先级最高，先于 0.3.3 补丁和 P66 发版**

## 0. 来源与 Owner 授权

- **来源**：P66 最终回执 `product/multi-database-compat/receipts/execution-final-01.md` §5 只读检查发现以下问题：
  - UAT 的 PG 14 集群 `14-main` 已停止，5433 端口无监听；
  - 后端 `/api/actuator/health` 返回 503；
  - 根分区使用率 95.7%。
- **Owner 2026-11-09 授权**：
  - (a) 只读诊断；
  - (b) 诊断后恢复，清理部署产生的可再生文件；
  - **reasonix 可清理**。

## 1. 目标

1. UAT 恢复可用：PG 14 运行，后端 health UP，`https://chikaho.cn/` 返回 200，三示例流程实例能打开。
2. 根分区降到 **85% 以下**，给 0.3.3 和 0.4.0 部署留出空间（每次部署约需 1GB）。
3. 查清停止原因，并写出防止再次发生的建议。

## 2. 步骤

### 2.1 只读诊断（先做，做完再动手）

- `df -h`，以及 `du -xh --max-depth=2 /` 的前 30 项，查清空间被什么占用。
- `systemctl status postgresql@14-main`，加上 PG 14 日志尾部 200 行（`/var/log/postgresql/` 或数据目录下的 `log/`），确定停止原因：磁盘满、OOM、手工停止，或其他。
- 后端服务状态与日志尾部；`journalctl --disk-usage`。
- **reasonix**：找出它在服务器上的全部存在形式，逐项列出路径或名称以及大小。包括：
  - 目录；
  - 进程和 systemd 服务；
  - Docker 容器、镜像、卷；
  - nginx 站点配置；
  - 数据库（如有）。
- 诊断结果写入回执 §1，**然后再进入 2.2**。

### 2.2 清理（只在以下范围内）

**允许清理：**
1. **reasonix 的全部内容**（Owner 授权）。
   - 先停掉进程或服务，再删除目录、容器、镜像和卷。
   - 如果它有 nginx 站点配置，删除前先备份到 `/root/uat-recovery-20261109/`，删除后执行 `nginx -t` 并 reload。
   - 删除前，确认没有 CH-aPaaS 服务（后端、Web、PG 14、Redis、EMQX 等）依赖它。发现有依赖就停下报告，不要删。
2. 本项目以往部署留下的备份：`web.old*`、旧版 jar 备份、旧发版 zip。**当前在用的版本和最近一个回退版本各保留一份**。
3. 已压缩或已轮转的旧日志（`*.gz`、`*.1` 等）；`journalctl --vacuum-size=200M`。
4. 包管理缓存（`apt-get clean`），以及 Docker 中无主的悬空镜像和构建缓存（`docker image prune`、`docker builder prune`）。**不要用** `docker system prune -a --volumes`。

**禁止触碰：**
- PG 14 数据目录、WAL、`pg_wal`、表空间；
- 正在使用的 jar、Web 目录和配置；
- 上传文件和对象存储目录；
- Redis 数据；
- 其他不明归属的文件。拿不准就列入回执，交 Owner 决定。

**每删一项，都要在回执清单里记录**：路径或名称、大小、删除命令、依据（属于上面第 1—4 条中的哪一条）。

### 2.3 恢复

1. 启动 PG 14。启动失败时，按日志定位原因。**不得**执行 `pg_resetwal`、删除 WAL、重建集群这类可能丢数据的操作；遇到这种情况停下报告。
2. PG 正常后，只读确认 `smart_workflow` 库可以连接，`flyway_schema_history` 最新版本为 v0.2.9。
3. 启动或重启后端，确认 health UP、`build.version=0.3.2`。
4. 浏览器打开 `https://chikaho.cn/`，确认能登录，三示例流程各打开一个实例，例如 `YJ-20261108-008`、`XY-20261108-015`、`MES-20261108-015`。只看，不提交。

### 2.4 顺带完成（UAT 恢复后，只读）

- **0.3.3 补丁第 1 步的日志部分**：在后端日志中统计 `smallint = boolean` 报错，写入 0.3.3 的回执 `product/server-033-agent-tool-enabled-hotfix/receipts/execution-033-01.md`。
- **P66 的 UAT 校验和比对**：只读读取 `flyway_schema_history` 的 `installed_rank/script/checksum`，与 `feature/0.4.0-multi-database` 的 PG 迁移比对，结果补进 P66 回执，可另起 `execution-final-02.md`。

## 3. 防止再次发生（在回执中给出建议，不实施）

- 停止原因与磁盘水位的关系；
- 是否需要日志轮转、监控和告警，以及部署前的水位门槛；
- PG 是否设为开机自启，宕机后是否自动拉起。

## 4. 回执

`product/uat-recovery-20261109/receipts/execution-uat-recovery-01.md`，内容包括：
1. 诊断结论；
2. reasonix 盘点与清理清单；
3. 其他清理清单，以及清理前后的 `df -h`；
4. 恢复回读：PG、health、页面、三个实例；
5. 2.4 的两项结果，或写明它们在哪份回执里；
6. 防止再次发生的建议。

## 5. 约束

- 不删除、不重建 UAT 服务器、数据库和 CH-aPaaS 容器，不清业务数据。
- 不强推，不改写历史，不动 tag。
- 凭据不写入回执；截图只作为过程证据留在本机，不入 Git。
