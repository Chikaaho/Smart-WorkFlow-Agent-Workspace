# B021 分支初始化与本地服务回执（第 1 轮）

日期：2026-10-31。任务：`product/0.2.1-bugfix/ready/direction-bugfix-021.md` 第 2 阶段（执行并建分支）。执行角色：Executor。

## 1. 三仓实时状态核实（方向第 1 步）

| 仓库 | 核实时点 | 分支 | HEAD | 与远端 | 工作树 |
|---|---|---|---|---|---|
| Smart-WorkFlow-aPaaS-server | 2026-10-31 ~14:40 (UTC+8) | develop | c25f5ea | fetch --all --prune 后与 origin/develop 一致 | 干净 |
| Smart-WorkFlow-aPaaS-Web | 同上 | develop | 3c1cfe2 | 同上 | 干净 |
| Smart-WorkFlow-Agent-Workspace | 同上 | develop-sw | 8404a710 | 与 origin/develop-sw 一致 | 规划侧在途文件（memory/*.md 修改、product/0.2.1-bugfix/ 未跟踪）保留未动 |

memory 记载的 `vite.config.ts` 在途内容经 0.2.0 收尾确认与 HEAD 逐字节一致，本轮两仓工作树干净，无覆盖风险。

## 2. 任务分支（方向第 2 步）

- Server：`codex/0.2.1-bugfix` 自 `develop`（c25f5ea）创建，`git push -u origin codex/0.2.1-bugfix` 成功，跟踪 `origin/codex/0.2.1-bugfix`。
- Web：`codex/0.2.1-bugfix` 自 `develop`（3c1cfe2）创建，推送与跟踪同上。
- 均无无法安全带入的本地改动；未重置、未清理、未夹带。
- 根仓保持 `develop-sw`，承载方向、台账与本回执。

## 3. 本地服务（方向第 4 步）

### 后端（Server）

- 构建：`MAVEN_OPTS="-Xmx2g" mvn -q clean package -DskipTests -pl sw-bootstrap -am`，退出码 0，产物 `sw-bootstrap/target/bootstrap.jar` 218,553,883 B。
- 过程事实：首跑增量构建把已被 0.2.0 收敛移出 `db/migration/` 的旧 V0.1.x 迁移残片（target/classes 残留）打进 jar，导致全新库按 0.1.7→0.1.8→0.2.0 链执行后撞表失败；`clean` 重建后 jar 内 `db/migration/postgresql/` 仅含 V0.2.0 与 R__（`unzip -l` 复核 V0.1 残留=0）。后续启动排障依次补齐：`SW_CIPHER_KEY`（IoT 模块直读环境变量）、`sw.bpm/form/iot.enabled=true`（prod 独有开关，local 需显式）、`spring.autoconfigure.exclude` 排除 `PgVectorStoreAutoConfiguration`（prod 同款，避免双 EmbeddingModel 冲突）、`OPENAI_API_KEY` 占位（Spring AI bean 实例化要求非空）、`JWT_SECRET`（拒绝仓库占位值的 fail-fast）。
- 配置：`sw-bootstrap/src/main/resources/application-local.yml`（入仓 .gitignore 第 19 行命中）+ 外置 `config/application-local.yml`（Spring Boot `file:./config/` 优先级高于 jar 内；目录经仓库 `.git/info/exclude` 本地忽略）。二者内容一致，外置副本为生效层，改配置无需重打包。
- 数据库：新建本机验证库 `smart_workflow_021`（本地 PG 16.15，127.0.0.1:5432，trust 认证，用户 chikan）。既有库 `smart_workflow` 停留在旧迁移链（V66，P21 时代），按方向"不改写迁移历史、默认清库"边界**未触碰**。新库 Flyway 结果：单条 versioned `0.2.0 baseline seed` 成功 + R__（0.1.10 admin password / 0.1.7 catalog menu first / 0.1.7 org demo seed / 0.2.0 approval opinion draft 等）随启动应用，与 UAT 收敛模式一致。
- 进程身份：`java -Xms256m -Xmx1g -XX:MaxMetaspaceSize=256m -jar sw-bootstrap/target/bootstrap.jar`，PID 18677，工作目录 Server 仓根（uploads/ 位于此）。宿主后台会话 ID `exec_9df8989f-6057-4de5-bb95-5e5984eea0bc`，日志可持续读取（ZCode 任务输出文件）。
- 健康：`GET http://127.0.0.1:8080/api/actuator/health` → `{"status":"UP"}` HTTP 200；内存 RSS 空闲约 168 MB（启动峰值约 487 MB）。
- 非秘密环境说明：启动需注入 `SPRING_PROFILES_ACTIVE=local`、`SW_CIPHER_KEY`、`SW_SSO_CIPHER_KEY`、`SW_LOGIN_DIGEST_SECRET`、`JWT_SECRET`（均为本机生成的开发值，存放于本地启动命令与本机配置文件，不入台账）；`OPENAI_API_KEY` 为显式占位假值（AI 功能不用于本轮验证）。

### 前端（Web）

- `NODE_OPTIONS="--max-old-space-size=2048" pnpm dev`（node_modules 已存在，未重装），Vite 8.1.0 ready 479 ms。
- 进程身份：PID 19131（工作目录 Web 仓根），宿主后台会话 ID `exec_3d1c392c-58f5-464b-8aed-253ce4473c57`。
- 访问入口：`http://localhost:5173/`（HTTP 200）；`/api` 代理 → `http://localhost:8080`（vite.config.ts 默认），端到端 `http://127.0.0.1:5173/api/actuator/health` → 200。

### Redis

- 专用实例：`redis-server --port 6399 --save '' --appendonly no --daemonize no`（宿主后台会话 `exec_6b240dce-aac3-44e4-8897-237b8740d6a4`），`redis-cli -p 6399 ping` → PONG。不使用 6379 既有带认证实例（用户既有服务，未触碰）。

## 4. 停止与清理方法

- 后端：`kill 18677`（SIGTERM 走 Spring graceful shutdown）或 TaskStop `exec_9df8989f`。
- 前端：`kill 19131` 或 TaskStop `exec_3d1c392c`。
- Redis：`redis-cli -p 6399 shutdown nosave`（数据不持久化，无清理残留）。
- 数据库：验证库 `smart_workflow_021` 按需整体 DROP 重建（零用户数据）；`uploads/` 目录随验证数据清理。

## 5. 偏差与备注

- 无方向偏差。方向第 2 步完成条件四项（分支来源、远端跟踪、工作树保护、双端服务可回读）全部满足并留有回读命令。
- 本机 `application-local.yml` 此前缺失（0.2.0 收尾未迁移），本次按现配置结构重建；旧回执（2026-08-30）登记的 3897 端口 PG 已不存在，现用本机 5432。
- 后续缺陷修复循环由 Owner 经对话逐项下发，台账 `product/0.2.1-bugfix/items.md` 分配编号。
