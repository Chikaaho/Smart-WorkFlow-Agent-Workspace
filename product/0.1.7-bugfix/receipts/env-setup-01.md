# 0.1.7 本地点验环境就绪回执（执行侧）

日期：2026-10-16｜角色：Executor｜任务等级：L（0.1.7-bugfix 列车第 2 阶段「Executor 修复与 Owner 复测」进行中）
方向：`product/0.1.7-bugfix/ready/direction-bugfix-017.md`｜唯一缺陷清单：`product/0.1.7-bugfix/1.0.7bug.md`

本回执只记录**起步事实与本地服务就绪证据**，不代表任何缺陷修复结果：清单当前仍为模板空行，尚无 Owner 缺陷，功能计数、P 编号、基线、功能状态均不变。

## 1. 三仓起点核实（按「最新提交所在分支」对齐）

| 仓库 | 分支（当前=最新提交所在分支） | HEAD | 提交时间 | 与远端 |
|---|---|---|---|---|
| 工作区 | `develop-sw` | `679a0e6f` | 2026-10-16 17:25 | = `origin/develop-sw` |
| Server | `develop` | `eca43b7` | 2026-10-16 15:38 | = `origin/develop` |
| Web | `develop` | `a60a819` | 2026-10-16 14:54 | = `origin/develop` |

- 三仓均先 `git fetch --all --prune`，再按 `git for-each-ref --sort=-committerdate` 比较各分支提交时间取最新；Server/Web 本地原分别停在 `feature/p62-perf-bounded-20261011`、`feature/p64-mes-advanced-orchestration`，已切到最新提交所在分支 `develop` 并快进（Server 快进 65 提交、Web 快进 76 提交）。
- 工作区 gitlink 指针 = Server `eca43b7` / Web `a60a819`，与两子仓实际 HEAD 一致，无需指针调整。
- 工作树：Server 仅 `logs/` 未跟踪（本机运行日志，不入库）；Web 干净；工作区干净。被测代码即上述三个提交。

## 2. 常驻本地服务（Owner 测试入口）

| 项 | 值 |
|---|---|
| 后端 | `http://127.0.0.1:8080`（`SPRING_PROFILES_ACTIVE=local`），health `/api/actuator/health` |
| 前端 | `http://localhost:5173`（vite dev，`--port 5173 --strictPort`，`/api` 代理 → 8080） |
| 运行库 | 本机 Docker PostgreSQL 新建库 **`sw_017_bugfix`**（持久库：重启不丢数据） |
| Redis | `127.0.0.1:6379` 的 **db 3**（与其它本地服务键空间隔离） |
| 登录 | `admin` / `admin123`；local profile `ch.dev.test-mock=true` ⇒ 验证码固定 **1234** |
| 日志 | `/tmp/sw-017/server.log`、`/tmp/sw-017/web.log`、构建 `/tmp/sw-017/build-clean.log` |
| 密钥配方 | 本机 `/tmp/sw-017/local-env.sh`（不入库）：`SW_CIPHER_KEY`（仓库 dev 规范键）、`SW_LOGIN_RSA_PRIVATE_KEY`（本机自生成 PKCS#8，存工作区外 `%USERPROFILE%\.sw-local-dev\rsa-pkcs8.b64`）、`SW_LOGIN_DIGEST_SECRET`、`JWT_SECRET`，四项均按既有本地 dev 契约取值 |

重启配方：`source /tmp/sw-017/local-env.sh && java -Xmx2g -jar sw-bootstrap/target/bootstrap-dev.jar`（后端）；`NODE_OPTIONS="--max-old-space-size=2048" pnpm dev --port 5173 --strictPort`（前端）。`local` 后端构建入口为 `mvn -Pdev -pl sw-bootstrap -am package -DskipTests`（产物 `sw-bootstrap/target/bootstrap-dev.jar`，与正式构建 `bootstrap.jar` 同名规则区分）。

## 3. 起步发现：构建产物陈旧致启动失败（已处置，非源码缺陷）

- **现象**：首次启动 Flyway 校验失败 —— `Found more than one migration with version 0.1.6`，应用启动终止（`APPLICATION FAILED TO START` 前置于 Flyway）。
- **根因**：本机 `sw-bootstrap/target/classes/db/migration/postgresql|h2/` 残留 0.1.6 种子收敛**之前**的旧迁移链（`V0.1.0__baseline_seed.sql`…`V0.1.11__*`、`V0.1.6__p63_iot_command_reservation.sql` 等，文件时点为 10-08/10-11）。0.1.6 收敛把旧链移入 `db/upgrade/0.1.5/legacy-0.1.x/`，而增量构建不会删除目标目录中已不再产出的资源，于是旧 `V0.1.6__*` 与新 `V0.1.6__baseline_seed.sql` 同时进入 jar。**HEAD 源码本身只有单一 `V0.1.6__baseline_seed.sql`（git 追踪清单已核实），故属本机产物陈旧，不是源码/迁移缺陷。**
- **处置**：`MAVEN_OPTS="-Xmx2g" mvn -Pdev -pl sw-bootstrap -am clean package -DskipTests` 干净重建（BUILD SUCCESS，1:54）；重建后 jar 内 `db/migration/**/V0.1.6*` 仅剩单条基线种子，旧链只保留在 `db/upgrade/` 非扫描位置。
- 记录该事实供后续排查：**在旧工作树上增量构建出的 jar 不可信，本地起服务前需保证该轮做过 clean**。

## 4. 冒烟验证（实测结果）

1. **新库迁移**：`sw_017_bugfix` 首启 Flyway 应用 11 条（1 条 versioned `0.1.6 - baseline seed` + 10 条 repeatable），全部 `success=t`，终点 `v0.1.6`；`Successfully applied 11 migrations ... now at version v0.1.6 (execution time 00:02.250s)`。
2. **后端就绪**：`Started StarterApplication in 33.391 seconds`；`GET /api/actuator/health` → `200 {"status":"UP"}`。
3. **登录全链（经 5173 代理）**：`GET /api/auth/challenge` → `200`（返回验证码图、公钥、`keyVersion=v1`）→ 用该公钥 RSA-OAEP(SHA-256) 加密口令 → `POST /api/auth/login` → `200 code=0 msg=success` 且返回 token。即 Owner 可直接用浏览器登录。
4. **前端可用**：`GET /` → `200`（SPA 外壳），`GET /src/main.ts` → `200`（vite 模块图正常转译，依赖齐备）。
5. **库内种子现状（供 Owner 判断起点）**：`sys_user=1`（admin，系统管理员，tenant 0）、`sys_role=2`、`sys_dept=1`、`sys_menu=137`；**业务内容为空**（`sw_form_def=0`、`sw_form_app=0`、`sw_form_app_dir=0`、`sw_bpm_process_def=0`）——`local` 非 dev/test profile，骨架流程部署与绑定按设计跳过。
6. **可见浏览器就绪实测（非正式验收，仅环境就绪）**：可见会话打开 `http://localhost:5173/` → 路由到 `/login?redirect=/`（登录页完整渲染：账号/密码/验证码、SSO 三段入口）→ 以 `admin` / `admin123` / 验证码 `1234` 真实登录 → 落 `http://localhost:5173/workspace`，工作台渲染正常（顶栏 工作台/我的门户/流程中心/应用中心、侧栏 工作台/待办任务/已办任务/我的草稿、"晚上好，系统管理员"、四项统计卡与 0 待办）。视口 1280×720，身份=系统管理员。截图本机留存 `C:\Users\hjxch\AppData\Local\Temp\sw-017\smoke-workspace-1280x720.png`（不入库）。本轮未主张正式流程验收，故不构成 `browser_evidence` 层级证据。

## 5. 状态与下一步

- 总 7 阶段：1 已完成（流程/输入/版本确认）、**2 进行中（Executor 修复与 Owner 复测）**、3—7 未开始。
- 本轮未新增业务功能、未核销 P 编号、未改功能状态与基线；`knowledge/` 持久状态无须变更（环境事实只在本回执与本机日志）。
- 未创建修复任务分支：清单尚无缺陷，待首个缺陷修复批次落地时按方向「开发分支→develop（种子与版本收敛）→main→发布」约定处理。
- **下一动作**：Owner 在 `http://localhost:5173` 直接测试并按 `product/0.1.7-bugfix/1.0.7bug.md` 原编号反馈缺陷；Executor 逐项复现、修复、自验后在原表回填「是否已修复=是」，由 Owner 填「回归结果」。需要演示数据时可由 Owner 指定，或 Executor 按指定范围预置。
