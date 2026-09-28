# 0.1.2 生产部署执行回执

- 日期：2026-09-28；角色：执行（Executor）；任务：`v0.1.2-release` 部署阶段（L）
- 授权：Owner 2026-09-28「completed，开始部署到服务器，然后更新说明，同时提交推送所有改动」——发布任务终态经 Owner 确认为 **COMPLETED**，并明确授权生产部署、说明更新与全部改动提交推送。
- 流程依据：`docs/ops/production-ops.md` §8 发布/升级流程 + §9.1 备份；制品 = 两仓 0.1.2 正式 Release 资产（与 tag `0.1.2` 提交一一对应）。

## 1. 制品与目标

| 制品 | 来源 | 大小 | sha256（本地=远端） |
|---|---|---|---|
| `bootstrap-0.1.2.jar` | Server Release `0.1.2`（CI run 36396145288 @ `fd704ff`） | 216,941,567 B | `a4d59613d662b42b03e9256ac8476d7b707fa675e4dc7f497aef2f11dd61c876` |
| `sw-web-dist-0.1.2.zip` | Web Release `0.1.2`（CI run 36396187465 @ `5368e6c`） | 1,035,442 B | `703fd2c43bc87003de9669658303452fbbe8a8a08860eaca7f5217381cadadbc` |

## 2. 部署前预检（只读）

- 磁盘 `/` 73%（可用 5.2G，容量足够）；后端运行中 PID 1454146，运行包 216,898,012 B（2026-09-26 0.1.2 构建）；本机 health **200**。
- `flyway_schema_history`：`max(version)=96, failed=0`（生产当前 **V96**，与记录一致）。

## 3. 备份（先于任何变更）

- DB：`/data/backup/smart_workflow_20260928_1757.dump`（`pg_dump -Fc`，414K；此前留有 0921/0926 两份）。
- jar 轮换：旧 09-26 包 → `bootstrap.jar.bak`（216,898,012 B）；0.1.0 包 → `bootstrap.jar.bak2`（218,971,165 B）。
- 前端：现网目录完整复制为 `/opt/smart-workflow/web.bak-20260928`（既有 `web.bak-20260921`、`web.bak-20260926` 保留）。

## 4. 后端切换

1. jar 预上传 `bootstrap.jar.new`，远端 `sha256sum` 与本地一致（`a4d59613…61c876`）。
2. `STOP_TIMEOUT=30 ./stop.sh`：服务已停止 PID=1454146，8080 无监听（PORT_FREE）。
3. `mv bootstrap.jar.new bootstrap.jar`，回读 sha256 一致。
4. `source server.env && ./start.sh`：服务启动成功 PID=1531211（吸取 09-26 偏差 1，显式加载 server.env）。
5. 就绪探测：绑定退出条件（200 或超时）轮询本机 `/api/actuator/health`，第 28 次探测返回 **200**。
6. 迁移：Flyway 自动应用 **V97→V98→V99→V100→V101→V102 共 6 个迁移，"Successfully applied 6 migrations … now at version v102"**（启动日志原文）；`flyway_schema_history` 复核 `max(version)=102, failed=0`。
7. 启动段日志：尾部 500 行 **ERROR 计数 0**。

## 5. 前端切换

1. dist zip 预上传 `/tmp/sw-web-dist-0.1.2.zip`，远端 sha256 一致（`703fd2c4…adadbc`）。
2. 备份 → 解包（`dist/` 内含 `index.html`+`assets/`）→ `web → web.bak-20260928` → 新目录就位 → `chown -R root:root` → `nginx -t` 通过 → `nginx -s reload` 成功。

## 6. 公网终态验证（本机发起）

- `https://chikaho.cn/sw/` → **200**
- `https://chikaho.cn/sw-server/api/actuator/health` → **200 {"status":"UP"}**
- `index.html` 引用新构建产物 **`assets/index-vDQskZXe.js`**（旧为 `index-3g59rUSC.js`）——0.1.2 前端已生效。

## 7. 说明：验收口径

- 本轮按运维手册完成部署冒烟验证（健康、迁移、日志、公网双端 200）。0.1.2 全部业务修复已经 Owner 2026-09-28 回归通过（bug2.0.md 20 项），本轮未重复正式浏览器验收流程；如需 IAB 多视口验收另行走正式流程。

## 8. 回滚参考

- 应用：`./stop.sh && mv bootstrap.jar.bak bootstrap.jar && source server.env && ./start.sh`（回到 09-26 快照，jar sha256 `436e4e94…9699a`）。
- 前端：`rm -rf /opt/smart-workflow/web && cp -r web.bak-20260928 /opt/smart-workflow/web && nginx -s reload`。
- 数据库：迁移 V97—V102 为前向唯一；如需库级回滚用升级前 dump `smart_workflow_20260928_1757.dump` 恢复（§9.1），须整体评估。

## 9. 自验结论

生产已上线 0.1.2（后端 `fd704ff` CI 制品 + 前端 `5368e6c` CI 制品），数据库 V96→**V102**（0 failed），双端健康 200，启动日志 0 ERROR；备份齐备、回滚路径明确。**部署自验通过。**
