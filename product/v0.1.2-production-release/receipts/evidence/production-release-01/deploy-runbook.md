# 0.1.2 生产发布执行序列（runbook，按 docs/ops/production-ops.md §8）

> 前置：Server `REVISION=0.1.2 scripts/build-prod.sh` exit 0（全量测试 + prod 打包 + 制品门禁）；
> Web 四连 exit 0；两仓 develop→main 快进合并并推送，main CI success。
> 服务器连接：`~/ssh/ssh/ssh_personal.sh`（命令执行用同参数 ssh -i ~/ssh/config/personal.pem）。

## A. 后端（bootstrap.jar，0.1.2，sha256 见构建摘要）

1. 上传：`~/ssh/ssh/scp_personal.sh Smart-WorkFlow-aPaaS-server/sw-bootstrap/target/bootstrap.jar /opt/smart-workflow/server/bootstrap.jar.new`
2. 服务器侧落位校验：`sha256sum /opt/smart-workflow/server/bootstrap.jar.new` 与本地一致。
3. 数据库备份（先于任何变更）：
   `sudo -u postgres pg_dump -p 5433 -Fc -d smart_workflow -f /data/backup/smart_workflow_$(date +%Y%m%d_%H%M).dump`
4. jar 备份轮换：`cd /opt/smart-workflow/server && mv bootstrap.jar.bak bootstrap.jar.bak2 && cp bootstrap.jar bootstrap.jar.bak`
5. 停服：`STOP_TIMEOUT=30 ./stop.sh`；确认 `ss -tlnp | grep :8080` 为空、PID 失效。
6. 替换：`mv bootstrap.jar.new bootstrap.jar && sha256sum bootstrap.jar`（再次核对）。
7. 启动：`./start.sh`（Flyway 自动迁移 V93→V96，期望 0 failed）。
8. 健康与日志：`curl 127.0.0.1:8080/api/actuator/health`=200 `UP`；
   `flyway_schema_history` max=96 且 0 failed；启动段日志 0 ERROR；经 nginx `/sw-server/api/actuator/health`=200。

## B. 前端（dist，构建自合并后 main）

1. 本地打包：`cd Smart-WorkFlow-aPaaS-Web/dist && zip -rq /tmp/sw-web-0.1.2-dist.zip .`
2. 上传：`~/ssh/ssh/scp_personal.sh /tmp/sw-web-0.1.2-dist.zip /tmp/sw-web-0.1.2-dist.zip`
3. 服务器侧：`mkdir -p /tmp/sw-web-new && unzip -oq /tmp/sw-web-0.1.2-dist.zip -d /tmp/sw-web-new`
4. 备份并替换：`mv /opt/smart-workflow/web /opt/smart-workflow/web.bak-20260926 && cp -r /tmp/sw-web-new /opt/smart-workflow/web && chown -R root:root /opt/smart-workflow/web`
5. `nginx -t && nginx -s reload`
6. 验证：`curl -k -H "Host: chikaho.cn" https://127.0.0.1/sw/`=200；index.html 引用新 assets 哈希。

## C. 回滚参照（异常时）

- 后端：`./stop.sh && mv bootstrap.jar.bak bootstrap.jar && ./start.sh`
- 前端：`rm -rf /opt/smart-workflow/web && mv /opt/smart-workflow/web.bak-20260926 /opt/smart-workflow/web`
- 数据库：`sudo -u postgres pg_restore -p 5433 -d smart_workflow --clean --if-exists /data/backup/smart_workflow_<TS>.dump`

## D. 真实浏览器验收（headless=false，可见可交互会话）

- 入口 `https://chikaho.cn/sw/`；身份=迁移种子管理员 admin（V4 契约种子）。
- 视口集合：1920×1080（16:9）、1366×768（16:9）、1440×900（16:10）、1024×768（4:3）。
- 每视口：登录页 → 登录 → 工作台 → 一个业务列表页；保存 PNG 制品、URL、视口、身份、网络索引。
