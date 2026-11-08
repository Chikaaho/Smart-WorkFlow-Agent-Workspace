# Docker 环境与镜像可用性（2026-11-08 实测）

## 宿主

- Docker Engine：24.0.6
- 容器平台：linux/amd64，12 CPU，8,195,117,056 B 内存
- 既有容器（未改动）：`mosquitto-024`（eclipse-mosquitto:2）、`postgres`（postgres:latest）、`redis`（redis:latest）
- Docker 数据盘可用空间：约 18 GB（C: 93% 已用），批量拉取 10 个数据库镜像前需先清理或扩容

## 镜像 manifest 可达性（`docker manifest inspect`，不拉取）

| 镜像 | 结果 |
|---|---|
| `mysql:5.7` | OK |
| `mysql:8.0` | OK |
| `mariadb:10.6` | OK |
| `postgres:16` | OK |
| `opengauss/opengauss:5.0.0` | OK |
| `opengauss/opengauss:5.1.0` | FAIL（tag 不存在） |
| `mcr.microsoft.com/mssql/server:2019-latest` | OK |
| `mcr.microsoft.com/mssql/server:2022-latest` | OK |
| `gvenzl/oracle-xe:21-slim` | OK |
| `container-registry.oracle.com/database/express:21.3.0-xe` | OK |
| `if010/dameng:latest`（社区镜像） | OK |
| `wephoon/kingbase:latest`（社区镜像） | OK |

## MySQL 5.7 拉取与启动实测

命令与结果：

```text
docker pull mysql:5.7
→ Status: Downloaded newer image for mysql:5.7

docker run -d --rm --name swmdb-probe-mysql57 -e MYSQL_ROOT_PASSWORD=<一次性探测口令> -e MYSQL_DATABASE=probe mysql:5.7
docker exec swmdb-probe-mysql57 mysqladmin --wait=60 -uroot -p<一次性探测口令> ping
→ Waiting for MySQL server to answer..
→ mysqld is alive

docker exec swmdb-probe-mysql57 mysql -uroot -p<一次性探测口令> -N -e 'SELECT VERSION(), @@character_set_server, @@sql_mode'
→ 5.7.44    latin1    ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION

docker stop swmdb-probe-mysql57
→ 容器按 --rm 自动删除，未遗留 swmdb-probe 容器
```

结论：

- 本机 Docker 可以拉取并启动 MySQL 5.7，镜像版本 5.7.44。
- 默认字符集是 `latin1`，建库/建表必须显式 `utf8mb4`；默认 `sql_mode` 为严格模式。
- 探测容器使用独立名称和独立数据（容器内），停止后自动删除；未触碰既有 `postgres`、`redis`、`mosquitto-024`。

## 达梦/人大金仓/ Oracle 19c 的限制

- 达梦、人大金仓官方 Docker 镜像未在 Docker Hub / 公共 registry 找到官方条目；Docker Hub 上均为社区镜像（达梦 47 个搜索结果、金仓 101 个），许可证与二进制来源不明确，不能直接用于正式验证。
- 官方下载入口：达梦 `https://www.dameng.com/download/index.html`，金仓 `https://www.kingbase.com.cn/download.html`；通常需要注册/申请开发版或试用授权，且金仓需要 license 文件。
- Oracle 19c 的免费镜像不可公开获得；可公开使用的是 Oracle XE 21c（`container-registry.oracle.com/database/express:21.3.0-xe` 或 `gvenzl/oracle-xe:21-slim`）。19c 精确版本需要 Owner 提供授权镜像/环境，或用 21c XE 作为“12c 及以上”兼容代表并记录版本差异。
- 阶段 A 只做了 manifest 可达性检查与 MySQL 5.7 启动探测；其余数据库的实际拉取/启动放到阶段 B/C 逐库执行，避免一次性占用十余 GB 磁盘。
