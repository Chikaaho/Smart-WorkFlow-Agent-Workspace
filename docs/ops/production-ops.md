# CH-aPaaS 生产运维手册（Ops Manual）

> 适用范围：CH-aPaaS 生产环境（单机部署，本仓库维护的正式运维手册；部署目录与库名沿用历史 `smart-workflow` / `smart_workflow` 命名）。
> **连接凭据不落入本文档**：主机 IP、SSH 密钥路径、SSH 用户/端口等一律由本地脚本 `~/ssh/ssh/ssh_personal.sh` / `~/ssh/ssh/scp_personal.sh` 封装，本文档只引用脚本，不写原始 IP 与私钥路径。
> 说明：本文件基于对生产服务器的只读巡检与架构文档编写（2026-09-01），记录除连接凭据与域名/证书之外的完整运维细节。
> **信息披露口径**：本文档只暴露前后端**部署位置与端口**；连接凭据（IP/密钥）、对外域名与 TLS 证书信息一律不写入。新增内容须遵守此口径。

---

## 1. 部署拓扑总览

生产为**单台云服务器 + 原生进程**部署（无容器），形态如下：

```text
客户端
  │  HTTPS（80/443）
  v
nginx（反向代理 + TLS 终止 + 前端静态托管）
  │  /            → 前端静态构建（/opt/smart-workflow/web；0.1.5 起挂载域名根路径）
  │  /sw、/sw/*   → 301 重定向到根路径（保留子路径，旧入口兼容）
  │  /sw-server/  → 后端 API（反代到 127.0.0.1:8080）
  v
CH-aPaaS 后端（Java 21 / Spring Boot，:8080，bootstrap.jar）
  ├── PostgreSQL 14（:5433，内网，库 smart_workflow）
  └── Redis（:6379，内网）
```

- 后端为模块化单体（`sw-bootstrap` 为唯一启动入口），生产使用 **PostgreSQL** 数据源。
- 前端为 Vue3 构建后的纯静态资源，由 nginx 直接托管（0.1.5 起挂载在域名根路径 `/`），运行时经 `/sw-server/` 调用后端。
- 时区：`+08:00`（日志、数据库时间均为 CST）。

---

## 2. 服务器与连接

| 项 | 值 |
|---|---|
| 平台 | 阿里云 / Ubuntu 22.04 LTS / x86_64 |
| 规格 | 2 vCPU / ~1.6 GiB 内存 / 20 GiB 系统盘 |
| SSH | 端口 22，用户 `root`，密钥认证（凭据由脚本封装） |

连接信息（IP、密钥路径）已封装在本地脚本中，统一通过脚本进入服务器：

```bash
# ① 交互式登录生产服务器
~/ssh/ssh/ssh_personal.sh

# ② 向生产服务器上传文件：<本地路径> <远端路径>
#    规则：远端路径以 / 结尾 ⇒ 视为目录并自动 mkdir -p；否则视为文件并自动创建其父目录
~/ssh/ssh/scp_personal.sh ./x.jar /opt/smart-workflow/server/bootstrap.jar
```

> 私钥与连接参数均由上述脚本封装；妥善保管本地密钥，勿外传。
> 若忘记连接方式，看这两个脚本；若换了服务器，只需改脚本内的主机/密钥即可，本文档其余内容不变。

---

## 3. 核心服务与端口

| 服务 | 进程/端口 | 监听地址 | 说明 |
|---|---|---|---|
| nginx | 80 / 443 | 0.0.0.0 | 反向代理、TLS 终止、前端静态托管 |
| 后端 | Java `bootstrap.jar`，8080 | `*:8080` | CH-aPaaS API 服务 |
| PostgreSQL 14 | 5433（非默认端口） | 127.0.0.1 / 127.0.1.1 | 业务数据库，库名 `smart_workflow` |
| Redis | 6379 | 127.0.0.1 | 缓存 / 会话 |

> 服务器上另有与本项目无关的进程（如代理工具、其他应用进程），排障时注意区分，勿误判为项目故障。

---

## 4. 应用访问入口（部署位置与端口）

| 用途 | 位置 / 端口 |
|---|---|
| 前端管理端 | nginx 根路径 `/` → 前端静态目录 `/opt/smart-workflow/web`（0.1.5 起；访问域名即进入系统/登录页） |
| 旧前端入口 | `/sw`、`/sw/…` → `301` 到根路径（保留子路径，例如 `/sw/workflow/catalog` → `/workflow/catalog`）；`/sw-server/` 为独立前缀，不受该重定向影响 |
| 后端 API | nginx 转发 `/sw-server/` → `127.0.0.1:8080` |
| 后端本机自检（非对外） | `http://127.0.0.1:8080` |

- 对外统一走 nginx（80/443，TLS 由 nginx 终止）。
- 根路径由前端 SPA 兜底（`try_files $uri $uri/ /index.html`）：深路由直达与刷新正常；`/sw-server/`、上传下载与认证回调等按前缀路由保留，不被前端兜底覆盖。
- 域名与 TLS 证书属于对外环境标识，**本手册不披露**，相关配置以 nginx 服务器本地记录为准。

---

## 5. 部署目录与关键文件

```
/opt/smart-workflow/
├── server/                       # 后端
│   ├── bootstrap.jar             # 当前运行包
│   ├── bootstrap.jar.bak         # 上一次版本备份
│   ├── bootstrap.jar.bak2        # 再上一次版本备份
│   ├── start.sh                  # 启动脚本（nohup + PID 文件）
│   ├── stop.sh                   # 停止脚本（优雅停止→超时 SIGKILL）
│   ├── server.env                # 运行环境变量（敏感！见 §7）
│   ├── server.pid                # 运行 PID
│   ├── logs/                     # 运行日志
│   │   └── server.log            # 主日志
│   └── uploads/                  # 上传文件存储
└── web/                          # 前端静态构建
    ├── index.html
    └── assets/
```

服务器本机构建工具：Maven `/opt/apache-maven-3.9.16`（`/opt/maven` 软链）、Node.js v24 `/opt/node-v24.18.0`。

---

## 6. 日常运维操作

以 `root` 在服务器上执行（先 `~/ssh/ssh/ssh_personal.sh` 登录）。

### 6.1 查看服务状态

```bash
# 后端是否运行
cat /opt/smart-workflow/server/server.pid
kill -0 "$(cat /opt/smart-workflow/server/server.pid)" && echo "后端运行中" || echo "后端未运行"
ss -tlnp | grep ':8080'

# 依赖服务
systemctl status nginx redis-server postgresql@14-main --no-pager
ss -tlnp | grep -E ':80|:443|:5433|:6379'
```

### 6.2 查看日志

```bash
# 实时跟踪后端日志
tail -f /opt/smart-workflow/server/logs/server.log

# 最近 N 行 / 检索错误
tail -200 /opt/smart-workflow/server/logs/server.log
grep -nE "ERROR|Exception" /opt/smart-workflow/server/logs/server.log | tail -50

# nginx 访问 / 错误日志
tail -f /var/log/nginx/default.access.log
tail -f /var/log/nginx/default.error.log
```

### 6.3 健康检查

```bash
# 后端存活（本机自检；context-path 为 /api）
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/api/actuator/health

# 经 nginx 反代校验前端与 API（本机回环 + Host，域名以占位符代替）
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -H "Host: <对外域名>" http://127.0.0.1:80/
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -H "Host: <对外域名>" http://127.0.0.1:80/sw-server/api/actuator/health
# 旧前端入口应为 301（0.1.5 起）
curl -sS -o /dev/null -w "HTTP %{http_code} → %{redirect_url}\n" -H "Host: <对外域名>" http://127.0.0.1:80/sw/
```

> 后端 context-path 为 `/api`：`curl 127.0.0.1:8080/api/actuator/health` 应返回 `{"status":"UP"}`；未启用则该地址 404 属正常。

### 6.4 停止 / 启动 / 重启后端

```bash
cd /opt/smart-workflow/server

# 停止（优雅停止，超时 30s 自动 SIGKILL；内置 PID 归属校验，防误杀）
STOP_TIMEOUT=30 ./stop.sh

# 启动（nohup 后台，PID 写入 server.pid；启动失败 2s 内自检并提示日志）
# 2026-10-19 实测：start.sh 自身不加载 server.env，必须先显式加载，否则 PG 报 SCRAM 无口令并退出
set -a && . ./server.env && set +a && ./start.sh

# 重启 = 先 stop 后 start（同样需先加载 server.env）
./stop.sh && set -a && . ./server.env && set +a && ./start.sh
```

> **重要**：后端由 `start.sh` 用 `nohup` 手工托管（PID 文件），**未注册为 systemd 服务**。服务器重启后必须手动加载 `server.env` 后 `./start.sh` 拉起（§10 建议补自启；建议后续把 `server.env` 加载写进 `start.sh`，本次未改脚本）。

### 6.5 前端静态（由 nginx 直接托管，无“启停”）

替换 `/opt/smart-workflow/web/` 下的构建产物后 `nginx -s reload` 即可生效，见 §8.2。

---

## 7. 配置与敏感信息

后端运行环境变量在 `/opt/smart-workflow/server/server.env`（`chmod 600`），当前包含（变量名）：

- `PG_USERNAME`、`PG_PASSWORD` — PostgreSQL 连接凭据
- `SW_CIPHER_KEY` — 应用加密密钥
- `JWT_SECRET` — JWT 签名密钥；0.1.0 起生产缺失或为占位值时启动期 fail-fast
- `SW_SSO_CIPHER_KEY` — SSO 主体凭据加密密钥；0.1.0 起生产缺失时启动期 fail-fast
- `SW_LOGIN_RSA_PRIVATE_KEY`、`SW_LOGIN_DIGEST_SECRET` — 登录口令 RSA 私钥与摘要盐
- `SPRING_PROFILES_ACTIVE` — Spring 激活 profile
- `OPENAI_API_KEY` — AI 能力 API 凭据

运维注意：

- `server.env` 属**高敏感**：不提交到任何 Git 仓库、不随文档外发、备份时加密或严格限制读取权限。
- 密钥轮换：修改 `SW_CIPHER_KEY` 会使已加密数据无法解密，**非必要不更改**；确需轮换须先规划数据迁移。
- 修改 `server.env` 后必须 `./stop.sh && ./start.sh` 重启才生效。
- `.bak` / `.bak2` 为历史 jar 备份，可留作回滚；磁盘紧张时按 §9.2 清理。

---

## 8. 发布 / 升级流程

> 变更发布会触及生产运行实例，属高风险动作。**执行发布前应取得 Owner 明确授权**，遵循“备份 → 停服 → 替换 → 启动 → 冒烟验证 →（异常）回滚”。
>
> **0.1.8 正式制品获取（2026-10-19）**：两仓公开 Release —— [`CH-aPaaS Server 0.1.8`](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/tag/0.1.8)（资产 `bootstrap-0.1.8.jar` 218,042,791 B sha256 `5c0e66bd…`）与 [`CH-aPaaS Web 0.1.8`](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/releases/tag/0.1.8)（资产 `sw-web-dist-0.1.8.zip` 1,346,615 B sha256 `f62f1a8f…`），两者即对应 `build-<sha>` CI 制品（仅版本化命名）。**0.1.8 无 DB 变更**（沿用 0.1.7 终点，无需 §8.3 衔接脚本）；UAT 已按本手册 §8.1/§8.2 由 0.1.7 就地升级部署（启动 175.8s、启动段 ERROR 0、健康 200、`build.version=0.1.8`）。

### 8.1 后端升级（替换 bootstrap.jar）

1. **登录**：`~/ssh/ssh/ssh_personal.sh`
2. **备份当前包**（沿用现有惯例，保留两个版本）：
   ```bash
   cd /opt/smart-workflow/server
   mv bootstrap.jar.bak bootstrap.jar.bak2 2>/dev/null || true
   cp bootstrap.jar bootstrap.jar.bak
   ```
3. **上传新包**（本机执行，用 `scp_personal`）：
   ```bash
   ~/ssh/ssh/scp_personal.sh ./新构建/bootstrap.jar /opt/smart-workflow/server/bootstrap.jar.new
   # 登录后：mv bootstrap.jar.new bootstrap.jar
   ```
4. **停服 → 替换 → 启动**：
   ```bash
   cd /opt/smart-workflow/server
   ./stop.sh
   # 确认当前 jar 为新包（发布热点时刻，勿把 .bak 当作活动包）
   set -a && . ./server.env && set +a && ./start.sh   # 2026-10-19 实测：必须先加载 server.env
   ```
5. **冒烟验证**（§6.3）：后端本机自检正常、日志无 ERROR 堆栈、经 nginx `/sw-server/` 的接口可用。
6. **异常回滚**：停服后将 `bootstrap.jar.bak` 改回 `bootstrap.jar` 再启动：
   ```bash
   ./stop.sh && mv bootstrap.jar.bak bootstrap.jar && ./start.sh
   ```

### 8.2 前端升级（替换静态构建）

1. 本机构建前端（生产模式），或直接取已构建产物。
2. 上传到临时目录后覆盖，保留旧版以便回滚：
   ```bash
   ~/ssh/ssh/scp_personal.sh ./dist-web /tmp/sw-web-new          # 本机
   # 登录后：
   mv /opt/smart-workflow/web /opt/smart-workflow/web.bak        # 备份
   cp -r /tmp/sw-web-new /opt/smart-workflow/web
   chown -R root:root /opt/smart-workflow/web
   nginx -t && nginx -s reload
   ```
3. 验证 nginx 根路径 `/`（§6.3；0.1.5 起前端挂根路径）与 `index.html`/`assets/` 正常；旧 `/sw/…` 应为 301 到根路径。
4. 回滚：`rm -rf /opt/smart-workflow/web && mv /opt/smart-workflow/web.bak /opt/smart-workflow/web`（建议备份目录带时间戳，与 §9.1 发布窗口备份一致）。

### 8.3 数据库变更（Schema 迁移）

- 项目后端采用 Flyway 管理 schema（管理员**不执行**迁移，仅提示运维要点）：
  - 升级前**必须备份数据库**（§9.1）。
  - Flyway 迁移随应用启动自动执行；**先备份、后启动**。
  - 一旦启动后发现迁移异常，立即停服并评估回滚，避免半迁移状态。
- **0.1.5 起的主迁移形态**：每个支持方言只有一条 versioned 迁移 `V0.1.5__baseline_seed.sql`（全量种子）+ `R__` 可重复迁移；开发新增迁移用 `V<yyyyMMddHHmmss>__<需求>.sql`，启动时按版本自动应用，不会重放旧链或重复执行种子。
- **在役库的存量衔接**（不删除审计记录）：仓库 `sw-bootstrap/src/main/resources/db/upgrade/0.1.5/` 提供两个一次性脚本，**不在** Flyway 扫描路径内，需按当前库版本二选一在停服窗口手工执行（脚本单事务、恰好一次；重复执行会在无守卫语句处显式失败）：
  - `transition-history-to-0.1.5.postgresql.sql`：库已应用旧链全部版本（如 0.1.10）——把 versioned 历史替换为单条 0.1.5 种子记录，业务数据与 `R__` 记录不动；
  - `upgrade-to-0.1.5-from-0.1.1.postgresql.sql`：库停在旧链 0.1.1（0.1.3 发布态）——增量 DDL + 同一历史衔接。
  - 执行顺序：备份（§9.1）→ 停服 → 执行脚本 → 启动 → 核对日志 `Successfully validated …`、无 versioned 重放、`R__` 按需单次执行。
- 衔接前建议先核对库内 `V0.1.0`/`V0.1.1` 的 checksum 与仓库档案一致，再执行脚本。
- **0.1.6 起的主迁移形态**：每支持方言仍只有一条 versioned 迁移 `V0.1.6__baseline_seed.sql`
  （= 0.1.5 种子与应用中心增量逐字节拼接，仅新增段头）+ `R__` 可重复迁移（10 支/方言，checksum 未变）；
  开发新增迁移继续用 `V<yyyyMMddHHmmss>__<需求>.sql`。
- **在役库衔接（0.1.6）**：仓库 `sw-bootstrap/src/main/resources/db/upgrade/0.1.6/` 提供两个一次性脚本
  （**不在** Flyway 扫描路径内；单事务、恰好一次，重复执行显式失败）。按现场 `flyway_schema_history` 判定：
  - `transition-history-to-0.1.6.<方言>.sql`：结构已达 0.1.6 终态（已应用应用中心增量，如开发库）——仅收敛历史记录；
  - `upgrade-to-0.1.6-from-0.1.5.<方言>.sql`：已衔接 0.1.5、未应用应用中心增量（versioned 终点=单条 `V0.1.5`）——增量 DDL + 同一历史衔接。
  - 顺序：备份（§9.1）→ 停服 → 执行脚本 → 替换服务端 jar 与前端静态（§8.1/§8.2）→ 启动 →
    核对日志 `Successfully validated …`、零 versioned 重放、DB versioned 终点=单条 0.1.6（checksum `-1768731444`）。
- **0.1.7 起的主迁移形态**：每支持方言仍只有一条 versioned 迁移 `V0.1.7__baseline_seed.sql`
  （= 0.1.6 种子与 0.1.7 菜单/应用范围增量逐字节拼接，仅新增段头）+ `R__` 可重复迁移（12 支/方言）；
  开发新增迁移继续用 `V<yyyyMMddHHmmss>__<需求>.sql`。
- **在役库衔接（0.1.7）**：仓库 `sw-bootstrap/src/main/resources/db/upgrade/0.1.7/` 提供两个一次性脚本
  （**不在** Flyway 扫描路径内；单事务、恰好一次，重复执行显式失败）。按现场 `flyway_schema_history` 判定：
  - `transition-history-to-0.1.7.<方言>.sql`：结构已达 0.1.7 终态（已应用 0.1.7 期增量，如开发库）——仅收敛历史记录；
  - `upgrade-to-0.1.7-from-0.1.6.<方言>.sql`：已衔接 0.1.6、未应用 0.1.7 期增量（versioned 终点=单条 `V0.1.6`，**UAT 0.1.6 形态**）——增量 DDL + 同一历史衔接。
  - 顺序：备份（§9.1）→ 停服 → 执行脚本 → 替换服务端 jar 与前端静态（§8.1/§8.2）→ 启动 →
    核对日志 `Successfully validated …`、零 versioned 重放、DB versioned 终点=单条 0.1.7（checksum h2 `-1195786777`／postgresql `2016046975`）。
  - 更早形态（0.1.5 及以前）先按 `db/upgrade/0.1.6/README.md` 到达 0.1.6 衔接态，再套用上表；≤0.1.2 旧链仍不支持原地升级。
  - 注意：0.1.7 主链含演示种子 `R__0.1.7_org_demo_seed.sql`（租户 9001/9002、28 个演示用户），随启动自动装载；
    如需在其它环境移除，删迁移文件并清理 9001/9002 租户数据即可（详见 `db/upgrade/0.1.7/README.md` 与回执）。
  - **0.1.7 正式制品获取**：两仓公开 Release `0.1.7`（Server `bootstrap-0.1.7.jar` **218,034,381 B sha256 `d8b390c1…`**（2026-10-18 Owner 授权同版本覆盖第二次，绑定 openapi 回调租户上下文修复提交 `00e0a73`；CI run `39125380917` 产物；此前 `c6a7c06`·`b016b5cc…` 与更早 `5af1329`·`309e9e1e…` 历史保留于发布说明）；Web `sw-web-dist-0.1.7.zip` 1,347,131 B sha256 `493dbaac…` 未变）；与同仓 `build-<sha>` Release 的对应资产为同一次 CI 构建产物，可取任一；替换与回滚步骤仍按 §8.1/§8.2/§9。

---

## 9. 备份与清理

### 9.1 数据备份（PostgreSQL）

```bash
# 库名 smart_workflow，端口 5433（本机执行，登录后）
mkdir -p /data/backup
sudo -u postgres pg_dump -p 5433 -Fc -d smart_workflow \
  -f /data/backup/smart_workflow_$(date +%Y%m%d_%H%M).dump
ls -lh /data/backup

# 恢复（示例：覆盖式恢复，谨慎执行）
# sudo -u postgres pg_restore -p 5433 -d smart_workflow \
#   --clean --if-exists /data/backup/smart_workflow_YYYYmmdd_HHMM.dump
```

- 建议每日定时备份（cron），异地或对象存储留存。
- 同时可备份 `server.env` 与 `uploads/`（业务上传文件）。
- **发布窗口的整体备份与恢复入口**（0.1.5 发布所用的模式，可沿用）：数据库 dump（如上，命名建议带 `_pre<版本>` 后缀）+ 后端包 `bootstrap.jar.bak`/`.bak2`（§8.1 轮换）+ 前端目录 `/opt/smart-workflow/web.bak-<时间戳>` + nginx 配置 `/etc/nginx/conf.d/*.conf.bak-<时间戳>`（改动前复制）。恢复：`./stop.sh` → 回填 jar / `web.bak-*` / nginx 配置（`nginx -t && nginx -s reload`）→ 按需 `pg_restore` → `./start.sh`；发布与恢复的完整实测记录见工作区 `product/bugfix-20261013/receipts/uat-015-01.md`。

### 9.2 磁盘与日志清理

- 系统盘 20G；水位以 `df -h` 实时为准（2026-09-21 发布前巡检：已用约 91%、可用约 1.8G，主日志 + `logs/` 合计约 8G，已列入 0.1.0 发布前强制清理项）。
- 后端主日志 `/opt/smart-workflow/server/logs/server.log` 增长无上限（巡检时已达 GB 级）。0.1.0 起本项目部署配套 logrotate 轮转与保留上限；仍建议：
  - 确认/配置应用日志滚动策略或 `logrotate`，避免单文件无限增长；
  - 定期归档或清理 `logs/backup/` 与陈旧 `server.log`。
- 历史 jar 备份（`.bak`/`.bak2`，各约 150MB）与前端 `web.bak` 按需清理。
- 释放空间前先 `df -h` 核对，误删业务文件不可逆。

---

## 10. 监控、自启与稳定性建议

以下为本实例当前**缺失或偏弱**、建议补强的项（供 Owner 决策，属治理/运维改进，不在此直接实施）：

| 缺口 | 影响 | 建议 |
|---|---|---|
| 后端无 systemd 托管 | 服务器重启后端不自启，存在停机风险 | 为 `start.sh` 补 systemd unit（`Restart=on-failure`、`After=postgresql redis`）并 `systemctl enable` |
| 主日志单文件增长 | 磁盘占用与排障困难 | 配置应用日志滚动 + `logrotate` |
| 无进程/端口监控告警 | 异常宕机无感知 | 引入系统级监控（如 Prometheus + node_exporter / 云监控），对 8080、5433、6379、443 设告警 |
| 数据备份为手工 | 无自动恢复能力 | 落地 §9.1 的每日自动备份 |
| 磁盘水位偏高 | 突发写满风险 | 处理 §9.2 清理 + 扩容评估 |

---

## 11. 常见故障排查速查

| 现象 | 排查步骤 |
|---|---|
| 页面打不开 / 网关 502 | `systemctl status nginx`；`nginx -t`；`curl 127.0.0.1:8080` 看后端是否存活；查 `/var/log/nginx/default.error.log` |
| 后端未启动 | `./start.sh`（脚本会提示日志路径）；看 `logs/server.log` 尾部报错 |
| 启动即退 / JVM 相关问题 | 看 `logs/server.log` 前若干行（配置错误、端口占用、连库失败通常在这里）；确认 8080 未被占用 |
| 数据库连接失败 | `systemctl status postgresql@14-main`；`ss -tlnp \| grep 5433`；核对 `server.env` 中 PG 凭据（仅修改后重启生效） |
| 缓存异常 | `systemctl status redis-server`；`redis-cli ping` 应返回 `PONG` |
| 资源不足（内存/盘） | `free -h`、`df -h`、`uptime`；处理 §9.2 与扩容 |

---

## 12. 安全注意

- SSH 仅密钥登录：连接脚本固定使用本地私钥，所封装的主机 IP 与私钥路径**不写入本文档**；妥善保管密钥，勿外传。
- **公网端口收敛**：5433、6379 仅本地监听；8080 实际监听 `*:8080`，公网可达性由云安全组/防火墙决定，须核实仅放行 80/443/22，8080 不对公网开放。
- `server.env` 含生产凭据，严禁提交版本库或外发。
- 生产变更执行前取得 Owner 授权；发布、回滚、数据库操作按 §8/§9 流程做足备份。
- 定期轮换 TLS 证书与密钥（证书由 nginx 使用，具体位置以服务器本地记录为准），关注 TLS 配置。

---

*本手册为 CH-aPaaS 生产环境的真实运维知识。改动部署结构、路径、端口或库后，应及时修订本文档；连接凭据变更只需改本地脚本即可。本文件含服务器部署细节，仅存放于私有仓库或本机，勿推送到公开仓库。*
