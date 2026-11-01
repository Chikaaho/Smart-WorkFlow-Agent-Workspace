# B021 分支初始化与本地服务回执（第 2 轮：换设备后本机重建）

日期：2026-11-01。任务：`product/0.2.1-bugfix/ready/direction-bugfix-021.md` 第 2 阶段（执行并建分支）在本机恢复。执行角色：Executor。背景：第 1 轮（2026-10-31，另一台机器）完成分支初始化、服务启动与批次 1—5e 修复后换设备；本会话按 Owner 指令在原 E 盘工作区拉取最新代码、同步门禁版本、重建本地服务并恢复 0.2.1 流程。

## 1. 三仓实时状态核实与分支检出（方向第 1—2 步）

| 仓库 | 核实时点 | 动作与结果 |
|---|---|---|
| Smart-WorkFlow-Agent-Workspace | 2026-11-01 ~23:30 (UTC+8) | `develop-sw` 本地 8404a710 落后远端 19 提交，`git pull --ff-only` 快进至 `2900b252`（含 0.2.1 方向、台账、回执与子仓指针）；未跟踪 `.tmp-a03-schema.json` 保持不动 |
| Smart-WorkFlow-aPaaS-server | 同上 | 本地 `develop`=c25f5ea5 与 origin 一致；远端已有 `fix/0.2.1-bugfix`（tip `e8167d69`=批次5 种子），检出并建立本地跟踪分支，工作树干净 |
| Smart-WorkFlow-aPaaS-Web | 同上 | 本地 `develop`=3c1cfe2 与 origin 一致；检出 `fix/0.2.1-bugfix`（tip `77e2e5f`=批次5e）。`vite.config.ts` 在途改动（allowedHosts）跨检出逐字节保留——该分支未触碰此文件（`git diff origin/develop..origin/fix/0.2.1-bugfix -- vite.config.ts` 为空） |

根 gitlink：Server 对齐 HEAD 记录值；Web 因在途改动保持 modified 状态（有意本地项，未暂存）。

## 2. 门禁版本同步

拉取前后各执行一次 `py -3 init/check.py --harness zcode`：均为 `READY`，本机 `1.3.3` = 仓库要求 `1.3.3`，无 `UPDATE_REQUIRED`，无需更新 result。

## 3. 本地服务（方向第 4 步，本机重建）

### 后端（Server）

- 构建：`MAVEN_OPTS="-Xmx2g" mvn -q clean package -DskipTests -pl sw-bootstrap -am`，退出码 0，产物 `sw-bootstrap/target/bootstrap.jar` 218,555,228 B；`unzip -l` 复核 `db/migration/{postgresql,h2}/` 仅 `V0.2.0__baseline_seed` + R__（V0.1 versioned 残留=0，与第 1 轮同口径）。
- 配置：`application-local.yml` 在本机重建（第 1 轮的上机本机配置未随仓库迁移；文件命中 `.gitignore` 不入 Git）＋外置 `config/application-local.yml`（`file:./config/` 优先生效层；目录经 `.git/info/exclude` 本地排除）。与上机环境差异如实记录：上机为原生 PG 16.15/用户 chikan；本机为 Docker PostgreSQL 18（127.0.0.1:5432，用户 postgres）＋ Docker Redis（127.0.0.1:6379，无认证，`ping`→PONG，非 6379 既有带认证实例场景）。
- 数据库：新建全新库 `smart_workflow_021`（零用户数据）。Flyway 实测 `V0.2.0 baseline seed` + 19 支 R__ 全部 `success=true`，含 fix 分支新增 `R__0.2.1_workspace_stat_metric_cards`（9411—9414 统计指标卡种子就位）。
- 密钥：`SW_CIPHER_KEY`/`SW_SSO_CIPHER_KEY`/`JWT_SECRET`/`SW_LOGIN_DIGEST_SECRET`/登录 RSA 私钥均为本机一次性生成值，存放于本机临时文件与 gitignored 配置，不入台账、不入提交；`OPENAI_API_KEY` 为占位假值（AI 功能不用于本轮验证）。
- 过程事实：首次启动失败——IoT 模块直读环境变量 `SW_CIPHER_KEY`（与第 1 轮回执记录一致），仅写 yml 不够；启动命令补环境变量后重启成功。
- 进程身份：`java -Xms256m -Xmx1g -XX:MaxMetaspaceSize=256m -jar sw-bootstrap/target/bootstrap.jar`，PID 15200，工作目录 Server 仓根（uploads/ 位于此）；ZCode 后台任务 `exec_512b80c6-dd79-4abf-8f77-2a19037523a5`；日志 `backend-start.log`/`backend-start.err` 可持续读取（仓库忽略规则命中，不入 Git）。
- 健康：启动约 24s；`GET http://127.0.0.1:8080/api/actuator/health` → 200 `{"status":"UP"}`。

### 前端（Web）

- `NODE_OPTIONS="--max-old-space-size=2048" pnpm dev`（node_modules 沿用未重装），Vite 8.1.0 ready 1407 ms；ZCode 后台任务 `exec_49f53e22-593e-4fee-bf2e-4b32d1ab37f8`；日志 `vite-dev.log`。
- 访问入口：`http://localhost:5173/`（HTTP 200）；`/api` 代理 → `http://localhost:8080`；端到端 `http://127.0.0.1:5173/api/actuator/health` → `{"status":"UP"}`。

## 4. 停止与清理方法

- 后端：TaskStop `exec_512b80c6` 或结束 PID 15200（SIGTERM 走 Spring graceful shutdown）。
- 前端：TaskStop `exec_49f53e22`。
- 数据库：`smart_workflow_021` 零用户数据，可按需整体 DROP 重建；`uploads/` 随验证数据清理。

## 5. 偏差与对后续修复的影响（如实）

- 上机库中的批次 3 演示数据（灾备演练申请表单/流程/3 实例/1 已办/收藏、工作台自定义布局、3 张图表卡）不在本机新库中；B021-006/007 后续视觉验收如需同态数据，按 `B021-007-01.md` §6 配方在本机重建，或由 Owner 指定其他口径。
- 图表卡数据绑定、快捷发起目录管道两项遗留依赖 Owner/规划口径，未擅自处置。
- 其余无方向偏差；方向第 2 步完成条件四项（分支来源、远端跟踪、工作树保护、本地双端服务可回读）在本机全部满足并留有回读命令。
