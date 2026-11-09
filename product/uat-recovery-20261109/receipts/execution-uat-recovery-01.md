# UAT 恢复执行回执（execution-uat-recovery-01）

| 项目 | 内容 |
|---|---|
| 任务 | UAT 恢复：PostgreSQL 14 停止与磁盘水位（M，运维恢复） |
| 依据 | `product/uat-recovery-20261109/ready/direction-uat-recovery.md` |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 授权 | Owner 2026-11-09：只读诊断；诊断后恢复并清理可再生文件；reasonix 可清理 |
| 结论 | 已恢复：根分区 100% 导致 PG 14 崩溃恢复失败；清理 reasonix/旧备份/旧日志后 PG 自动恢复、后端 health UP、页面 200、三实例可只读打开；根分区降至 66%（6.4G 可用） |

## 1. 只读诊断

### 1.1 磁盘

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda3        20G   19G     0 100% /
```

`du -xh --max-depth=2 /` 前 30 项（节选）：

| 路径 | 大小 |
|---|---:|
| `/data` | 8.2G |
| `/data/reasonix` | 6.5G |
| `/usr` | 3.4G |
| `/opt` | 2.3G |
| `/var` | 1.8G |
| `/root` | 1.7G |
| `/opt/smart-workflow` | 1.5G |

### 1.2 PostgreSQL 停止原因

- `postgresql@14-main`：`failed (exit-code)`，停止时间 2026-11-09 10:00:48 CST。
- 日志：
  - `PANIC: could not write to file "pg_logical/replorigin_checkpoint.tmp": No space left on device`
  - checkpointer `terminated by signal 6: Aborted`
  - 自动恢复：`could not extend file "base/982014/982621_fsm": No space left on device`
  - `aborting startup due to startup process failure`
- 判断：**根分区写满导致 PG 崩溃；崩溃恢复因仍无空间而失败**。未执行任何 `pg_resetwal`、WAL 删除或重建操作。

### 1.3 后端与 journal

- 后端进程存在（PID 3308506），但 `http://127.0.0.1:8080/api/actuator/health` 返回 **503**；
  日志为 `ConnectException: Connection refused`（PG 5433 不可达）。
- `journalctl --disk-usage`：56.0M。
- 根分区可用空间 0，任何服务写盘都可能失败。

### 1.4 reasonix 盘点

| 形式 | 路径/名称 | 大小/状态 |
|---|---|---|
| 数据目录 | `/data/reasonix` | 6.5G |
| 会话数据 | `/data/reasonix/.reasonix-sessions` | 5.9G |
| 工作文件 | `/data/reasonix/files` | 583M |
| 进程 | `reasonix serve --addr 0.0.0.0:38784`（PID 2381370） | 运行中 |
| MCP 文件服务 | `npm exec @modelcontextprotocol/server-filesystem /data/reasonix` | 运行中 |
| npm 包 | `/root/.nvm/.../node_modules/reasonix` | 28M |
| 配置 | `/root/.reasonix` | 960K |
| 备份 | `/root/reasonix-module-backup-20261016` | 28M |
| systemd | 无 reasonix unit | — |
| Docker | 无容器/镜像/卷 | — |
| nginx | `/events`、`/rs`、`location ~ ^/(submit|...)` 反代 `127.0.0.1:38784` | 配置存在 |

依赖检查：CH-aPaaS Web 只引用后端 `/agent/.../events`、`properties/events` 等接口，
不依赖 nginx 的 reasonix `/events` 或 `/rs`；后端无 38784 引用。可清理。

### 1.5 可清理备份与旧日志

| 项 | 大小 | 处理计划 |
|---|---:|---|
| `/opt/smart-workflow/server/bootstrap.jar` | 211M | 保留（当前） |
| `bootstrap.jar.bak-pre032` | 211M | 保留（最近回退） |
| `bootstrap.jar.bak-031-pre` | 211M | 删除（更旧回退） |
| `/opt/smart-workflow/web` | 11M | 保留（当前） |
| `web.bak-20261105_pre022` | 11M | 保留（最近回退） |
| `web.old` | 11M | 删除（更旧） |
| `server.log-2026110{6,7,8}.gz` | 69M | 删除（已轮转压缩） |
| `/var/log` 下 `*.gz`、`*.1` | ~10M+ | 删除（已轮转） |
| apt 缓存 | 286M | `apt-get clean` |
| journal | 56M | `journalctl --vacuum-size=200M`（当前低于上限，预计无变化） |

## 2. reasonix 清理

### 2.1 执行顺序

1. 先停应用侧：`pm2 delete reasonix` → `pm2 save --force` → `pm2 kill` →
   `systemctl disable --now pm2-root` → `rm -rf /root/.pm2`。
2. 再删数据、安装物、配置与缓存。
3. nginx 配置先备份到 `/root/uat-recovery-20261109/`，再删除 reasonix 反代块，
   `nginx -t` 通过后 `nginx -s reload`。
4. 清理前已确认 CH-aPaaS 后端/Web/PG/Redis/EMQX 不依赖 reasonix（见 §1.4）。

### 2.2 清理清单

| 项 | 路径/名称 | 大小 | 删除命令 | 依据 |
|---|---|---:|---|---|
| 数据目录 | `/data/reasonix` | 6.5G | `rm -rf /data/reasonix` | §2.2-1 |
| 会话数据 | `/data/reasonix/.reasonix-sessions` | 5.9G | 随上项 | §2.2-1 |
| 工作文件 | `/data/reasonix/files` | 583M | 随上项 | §2.2-1 |
| npm 模块备份 | `/root/reasonix-module-backup-20261016` | 28M | `rm -rf` | §2.2-1 |
| 配置目录 | `/root/.reasonix` | 960K | `rm -rf` | §2.2-1 |
| 全局 npm 模块 | `/opt/node-v24.18.0/lib/node_modules/reasonix` | 28M | `rm -rf` | §2.2-1 |
| 可执行软链 | `/opt/node-v24.18.0/bin/reasonix`、`/root/.nvm/versions/node/v24.18.0/bin/reasonix` | 各 44B | `rm -f` | §2.2-1 |
| 运行缓存 | `/root/.cache/reasonix` | 76K | `rm -rf` | §2.2-1 |
| 安装归档 | `/root/reasonix-1.0.0-20261016.tgz`、`...20261016f.tgz`、`/root/reasonix-1.0.0.tgz` | 各 11M，合计 33M | `rm -f` | §2.2-1 |
| 配置文件 | `/root/reasonix.toml` | 12K | `rm -f` | §2.2-1 |
| PM2 守护 | `/root/.pm2` 与 `pm2-root` 服务 | 未单独记录 | `pm2 delete/kill`、`systemctl disable --now pm2-root`、`rm -rf /root/.pm2` | §2.2-1 |
| npx 临时缓存 | `/root/.npm/_npx`（reasonix 运行期） | 未单独记录 | `rm -rf /root/.npm/_npx` | §2.2-1 |
| nginx 反代 | `location /events`、`location ~ ^/(submit|...)`、`location /rs` → `127.0.0.1:38784` | 3 处配置块 | 备份后编辑删除；`nginx -t && nginx -s reload` | §2.2-1 |

nginx 备份：

- `/root/uat-recovery-20261109/chikaho.cn.conf.before`（4,601 B）
- `/root/uat-recovery-20261109/chikaho.cn.conf.before-edit2`（4,601 B）

### 2.3 保留项（交 Owner 决定）

| 项 | 大小 | 保留原因 |
|---|---:|---|
| `/root/TODO-reasonix-openrouter.md` | 4.0K | 个人备注，非 reasonix 运行数据；无空间收益，未删 |
| `/root/.claude/projects/-data-reasonix-files*` | 6.5M + 64K | Claude 会话历史，非 reasonix 数据；避免误删其他 agent 记录，未删 |

`/root/.npm` 保留 64M（通用 npm 缓存，非 reasonix 专属），未清理。

### 2.4 清理后核实

- reasonix 进程：无（`ps aux | grep -i reasonix` 为空）。
- PM2：`pm2-root` 为 `disabled` / `inactive`，`/root/.pm2` 不存在。
- systemd：无 reasonix unit。
- nginx：`grep -i reasonix /etc/nginx/conf.d/chikaho.cn.conf` 无结果。
- 文件系统：`find /data /root /opt /etc/nginx /etc/systemd/system -iname '*reasonix*'`
  仅剩 §2.3 两处保留项。

## 3. 其他清理与磁盘水位

### 3.1 清理清单

| 项 | 路径/名称 | 大小 | 删除命令 | 依据 |
|---|---|---:|---|---|
| 旧后端回退 | `/opt/smart-workflow/server/bootstrap.jar.bak-031-pre` | 211M | `rm -f` | §2.2-2 |
| 旧前端目录 | `/opt/smart-workflow/web.old`（目录） | 11M | `rm -rf` | §2.2-2 |
| 已轮转后端日志 | `server.log-2026110{6,7,8}.gz` | 69M | `rm -f` | §2.2-3 |
| 已轮转系统日志 | `/var/log` 下 `*.gz`、`*.1` | 约 10M | `find ... -delete` | §2.2-3 |
| apt 缓存 | `/var/cache/apt` | 286M | `apt-get clean` | §2.2-4 |
| journal | systemd journal | 56M | `journalctl --vacuum-size=200M` | §2.2-3（56M < 200M，实际未删） |

保留：当前 `bootstrap.jar` 211M + 最近回退 `bootstrap.jar.bak-pre032` 211M；
当前 `web/` + 最近回退 `web.bak-20261105_pre022`；`server.env` 与 `.bak-pre013`；
PG 数据目录/WAL、`uploads/`、`/data/swap`、`/data/backup` 均未触碰。

### 3.2 清理前后对比

```text
清理前：
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda3        20G   19G     0 100% /

清理后：
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda3        20G   12G  6.4G  66% /
```

精确值（清理后）：

```text
/dev/vda3  20747476992 bytes total
           12831207424 bytes used
            6836396032 bytes available
```

Inode：`18%`（232,168 / 1,299,984），不紧张。清理项合计约 7.1—7.2G（各项含舍入），
根分区已低于 85% 目标。

## 4. 恢复回读

### 4.1 PostgreSQL

PG 日志关键段：

```text
2026-11-09 10:00:47  PANIC: could not write to file "pg_logical/replorigin_checkpoint.tmp":
                     No space left on device
2026-11-09 10:00:48  FATAL: could not extend file "base/982014/982621_fsm":
                     No space left on device
2026-11-09 10:00:48  aborting startup due to startup process failure
2026-11-09 13:22:10  starting PostgreSQL 14.24 ... port 5433
2026-11-09 13:22:11  redo done at 1/BE160350
2026-11-09 13:22:11  database system is ready to accept connections
```

- 集群 `14-main`：**online**，端口 5433；`pg_isready` 返回 accepting connections。
- 版本：PostgreSQL **14.24**（Ubuntu 14.24-0ubuntu0.22.04.1）。
- 数据目录：`/var/lib/postgresql/14/main`，233M。
- 未执行 `pg_resetwal`、未删除 WAL、未重建集群；为自动崩溃恢复完成。
- `smart_workflow` 可连接；`flyway_schema_history` **31 行**，`success` 全为 `t`，
  versioned 终点 **0.2.9**。

### 4.2 后端

- 进程：PID **3353565**，启动时间 2026-11-09 13:22:36，`java -jar .../bootstrap.jar`。
- 端口：`*:8080` 监听。
- 健康：`http://127.0.0.1:8080/api/actuator/health` → `{"status":"UP"}`。
- 版本：`META-INF/production-build.properties` → `build.version=0.3.2`。
- 当前 jar 211M；最近回退 `bootstrap.jar.bak-pre032` 保留。

### 4.3 页面与登录

- `https://chikaho.cn/` → **200**；`https://chikaho.cn/login` → **200**。
- 浏览器登录成功，进入 `/workspace` 工作台，页面显示“系统管理员”。
- 操作说明：登录页“企业名称”按**租户名称**解析；本次使用“默认租户”。
  填租户编码不会命中，服务端统一返回“密码错误”。凭据不写入本回执。

### 4.4 三示例流程实例

| 示例编号（theme） | process_instance_id | business_key | 流程名称 | 发起人 | 状态 | 只读结果 |
|---|---|---|---|---|---|---|
| `YJ-20261108-008` | `88ede3ba-db34-11f1-8842-00163e0d142f` | `fd226433-3ce5-4abc-9ae6-914698fb0872` | 跨部门灾备演练计划审批 | 陈静 | 已完成 | 详情打开，流程图与流转记录可见 |
| `XY-20261108-015` | `0d6289f8-db34-11f1-8842-00163e0d142f` | `7b701fd5-8fed-40c5-887b-5c9b150ed110` | 校园出入口异常事件分级处置 | 系统管理员 | 已完成 | 详情打开，流程图与流转记录可见 |
| `MES-20261108-015` | `315ad673-db4c-11f1-8842-00163e0d142f` | `4ed697df-e659-4bca-891b-890b1a4f5da3` | MES 设备温度偏离研判与安全处置 | 系统管理员 | 已完成 | 详情打开，流程图与流转记录可见 |

只点击“查看详情”，未提交、未审批、未撤回、未修改任何实例。截图作为过程证据保存在本机：

```text
E:/code/Smart-WorkFlow-Agent-Evidence/uat-recovery-20261109/instances/
  YJ-20261108-008.png
  XY-20261108-015.png
  MES-20261108-015.png
```

截图未入 Git。

## 5. 2.4 两项结果

1. **0.3.3 补丁第 1 步（日志部分）**：`smallint = boolean`、`operator does not exist`、
   `smallint`、`boolean` 在可读后端日志中均为 **0 次**；24,698 条 ERROR 全部是 PG 停止
   导致的连接失败。详见
   `product/server-033-agent-tool-enabled-hotfix/receipts/execution-033-01.md`。
   该回执标记 **PARTIAL**：真实 PG 复现与 10 处调用路径映射未做，不能据此判定 UAT 不受影响。
2. **P66 UAT 校验和比对**：UAT 31 行历史、28 个唯一脚本的当前生效校验和与
   `feature/0.4.0-multi-database` 逐条一致（**28/28，0 差异**）；分支仅新增
   `V0.4.0` 与 `R__0.4.0`。详见
   `product/multi-database-compat/receipts/execution-final-02.md`；`execution-final-01.md`
   §5 阻塞已标注解除。

## 6. 防止再次发生（建议，未实施）

### 6.1 直接原因与水位

- 根分区 100% → PG checkpointer 写 `pg_logical/replorigin_checkpoint.tmp` 失败并 PANIC →
  崩溃恢复又因无空间无法扩展 FSM → 集群停止。
- 根分区同时承载 OS、PG 数据、应用、日志与 2.1G swap，20G 容量偏紧；当前虽已降至 66%，
  但只剩 6.4G。按每次部署约 1G 计，仅约 3 次部署余量。
- 后端日志约 **500MB/天**（11-08 为 509MB/24h；11-09 13:39 已达 288MB），是当前最快的
  空间消耗项；若不轮转，数天即可再次逼近水位。

### 6.2 监控与部署门槛

- 根分区告警：**80% 预警、85% 严重**；同时监控 inode。
- 部署硬门槛：可用空间 **≥ 3G**（或使用率 < 80%）才允许替换制品；不足时停止并报告。
- 部署前检查：`df -h /`、`pg_isready -p 5433`、后端 health、当前 jar/前端备份是否齐全。
- 部署后复核：health、`build.version`、Flyway 终点、页面 200、磁盘水位；随后只保留
  当前版本 + 最近一个回退版本。

### 6.3 日志轮转

- 后端：生产日志级别从 DEBUG 调为 INFO；使用按大小 + 时间轮转
  （建议单文件 100MB、保留 14 天/最多 10 个、压缩、总量上限约 1G）。
- journald：设置 `SystemMaxUse=500M` 或定期 vacuum；当前 56M，暂不紧迫。
- PG：`/var/log/postgresql/` 保持 logrotate 每日轮转、压缩、保留 14 天。

### 6.4 PostgreSQL 可用性

- `postgresql.service` 已 enabled；但 `postgresql@14-main` 为 `enabled-runtime`，
  且当前 unit `Restart=no`，崩溃后不会自动拉起。
- 建议在维护窗口验证并增加 systemd drop-in `Restart=on-failure`（或外部
  `pg_isready` 每分钟探活 + 告警），同时保留现有健康检查告警。
- 不建议把 PG 数据与高写入日志长期放在同一 20G 根分区；条件允许时迁移日志/备份到独立卷，
  或扩容根盘。

### 6.5 reasonix 类旁路服务

- 大会话数据（本次 5.9G sessions）不应与 PG 共置在根分区；如重新引入，必须独立卷 + 配额，
  并纳入磁盘告警。
- 停止服务后要同时清理进程守护（PM2/systemd）、npm 全局模块、缓存、归档与 nginx 反代，
  避免残留继续写盘或占用空间。

## 7. 约束遵守与遗留

- 未删除/重建 UAT 服务器、数据库或 CH-aPaaS 容器；未清业务数据。
- 未触碰 PG 数据目录、WAL、表空间、上传文件、Redis 数据；未执行破坏性恢复。
- 未强推、未改写历史、未移动 tag；截图未入 Git；凭据未写入回执。
- reasonix 运行内容、安装物与配置已清理；`TODO-reasonix-openrouter.md` 与
  `.claude/projects/-data-reasonix-files*` 两处非运行关联项保留，交 Owner 决定。
- UAT 仍为 0.3.2；0.3.3 与 0.4.0 均未部署。
