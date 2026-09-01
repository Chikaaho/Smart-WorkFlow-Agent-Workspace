# Smart-WorkFlow 生产运维手册（Ops Manual）

> 适用范围：Smart-WorkFlow 生产环境（单机部署，本仓库维护的正式运维手册）。
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
  │  /sw          → 前端静态构建（/opt/smart-workflow/web）
  │  /sw-server/  → 后端 API（反代到 127.0.0.1:8080）
  v
Smart-WorkFlow 后端（Java 21 / Spring Boot，:8080，bootstrap.jar）
  ├── PostgreSQL 14（:5433，内网，库 smart_workflow）
  └── Redis（:6379，内网）
```

- 后端为模块化单体（`sw-bootstrap` 为唯一启动入口），生产使用 **PostgreSQL** 数据源。
- 前端为 Vue3 构建后的纯静态资源，由 nginx 直接托管，运行时经 `/sw-server/` 调用后端。
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
| 后端 | Java `bootstrap.jar`，8080 | `*:8080` | Smart-WorkFlow API 服务 |
| PostgreSQL 14 | 5433（非默认端口） | 127.0.0.1 / 127.0.1.1 | 业务数据库，库名 `smart_workflow` |
| Redis | 6379 | 127.0.0.1 | 缓存 / 会话 |

> 服务器上另有与本项目无关的进程（如代理工具、其他应用进程），排障时注意区分，勿误判为项目故障。

---

## 4. 应用访问入口（部署位置与端口）

| 用途 | 位置 / 端口 |
|---|---|
| 前端管理端 | nginx 转发 `/sw` → 前端静态目录 `/opt/smart-workflow/web` |
| 后端 API | nginx 转发 `/sw-server/` → `127.0.0.1:8080` |
| 后端本机自检（非对外） | `http://127.0.0.1:8080` |

- 对外统一走 nginx（80/443，TLS 由 nginx 终止）。
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
# 后端存活（本机自检）
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/

# 经 nginx 反代校验前端与 API（本机回环 + Host，域名以占位符代替）
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -H "Host: <对外域名>" http://127.0.0.1:80/sw/
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -H "Host: <对外域名>" http://127.0.0.1:80/sw-server/actuator/health  # 若启用 actuator
```

> 若后端暴露 Spring Boot Actuator 健康端点，`curl 127.0.0.1:8080/actuator/health` 应返回 `{"status":"UP"}`；未启用则该地址 404 属正常。

### 6.4 停止 / 启动 / 重启后端

```bash
cd /opt/smart-workflow/server

# 停止（优雅停止，超时 30s 自动 SIGKILL；内置 PID 归属校验，防误杀）
STOP_TIMEOUT=30 ./stop.sh

# 启动（nohup 后台，PID 写入 server.pid；启动失败 2s 内自检并提示日志）
./start.sh

# 重启 = 先 stop 后 start
./stop.sh && ./start.sh
```

> **重要**：后端由 `start.sh` 用 `nohup` 手工托管（PID 文件），**未注册为 systemd 服务**。服务器重启后必须手动 `./start.sh` 拉起（§10 建议补自启）。

### 6.5 前端静态（由 nginx 直接托管，无“启停”）

替换 `/opt/smart-workflow/web/` 下的构建产物后 `nginx -s reload` 即可生效，见 §8.2。

---

## 7. 配置与敏感信息

后端运行环境变量在 `/opt/smart-workflow/server/server.env`（`chmod 600`），当前包含（变量名）：

- `PG_USERNAME`、`PG_PASSWORD` — PostgreSQL 连接凭据
- `SW_CIPHER_KEY` — 应用加密密钥
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
   ./start.sh
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
3. 验证 nginx `/sw/`（§6.3）与 `index.html`/`assets/` 正常。
4. 回滚：`rm -rf /opt/smart-workflow/web && mv /opt/smart-workflow/web.bak /opt/smart-workflow/web`。

### 8.3 数据库变更（Schema 迁移）

- 项目后端采用 Flyway 管理 schema（管理员**不执行**迁移，仅提示运维要点）：
  - 升级前**必须备份数据库**（§9.1）。
  - Flyway 迁移随应用启动自动执行；**先备份、后启动**。
  - 一旦启动后发现迁移异常，立即停服并评估回滚，避免半迁移状态。

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

### 9.2 磁盘与日志清理

- 系统盘 20G，当前已用约 67%（约 6.1G 可用），**需关注增长**。
- 后端主日志 `/opt/smart-workflow/server/logs/server.log` 当前约 39MB 且持续增长（另有 `logs/backup/`）。建议：
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
- **公网仅开放 80/443/22**：8080、5433、6379 均在本地/内网监听，保持其不暴露公网。
- `server.env` 含生产凭据，严禁提交版本库或外发。
- 生产变更执行前取得 Owner 授权；发布、回滚、数据库操作按 §8/§9 流程做足备份。
- 定期轮换 TLS 证书与密钥（证书由 nginx 使用，具体位置以服务器本地记录为准），关注 TLS 配置。

---

*本手册为 Smart-WorkFlow 生产环境的真实运维知识。改动部署结构、路径、端口或库后，应及时修订本文档；连接凭据变更只需改本地脚本即可。本文件含服务器部署细节，仅存放于私有仓库或本机，勿推送到公开仓库。*
