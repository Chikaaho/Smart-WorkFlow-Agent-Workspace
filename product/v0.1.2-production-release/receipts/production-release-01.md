# 0.1.2 生产发布执行回执 01（合并 main + 生产部署 + 浏览器验收）

> 角色：执行（Executor）　日期：2026-09-26
> 授权：Owner 指令「开始执行develop合并main以及发布任务，具体发布信息参考运维文档描述。发布结束必须使用真实浏览器验收，需验证4:3\16:0\16:10等常见分辨率」。
> 流程依据：`docs/ops/production-ops.md` §8 发布/升级流程 + §9.1 备份；版本身份按 Owner 2026-09-26 裁决为 **0.1.2**（正式构建 `-Drevision=0.1.2`）。
> 状态：自验完成，待规划验收（本回执不写功能 `PASSED/COMPLETED`、不核销 P 编号、不改功能数）。

## 1. 任务判级

L 级（生产发布任务：远程部署 + 版本身份 + 跨会话跟踪；Owner 已对合并与发布作出明确授权，浏览器验收与分辨率集合按指令执行）。

## 2. 发布前事实与预检

- 两仓 fetch 后 `develop` 与 `origin/develop` 一致且工作树干净（Web 3 个 untracked 契约外文件不参与构建，`src/` 无引用，已核实）。
- 快进关系核实：Server `origin/main d18e9a3` 与本地 `main` 均为 `origin/develop ebf26ae` 祖先（ahead 9）；Web `origin/main 039f987`/本地 `main` 均为 `origin/develop 1871725` 祖先（ahead 53）；0 behind。
- 生产只读巡检：磁盘 72%（可用 5.3G）；运行 jar 为 09-21 的 0.1.0 CI 制品（218,971,165B）；`flyway_schema_history` 终点 **V93**（0 failed）；后端健康 200；域名 `chikaho.cn`（nginx TLS，80→443 301）。
- 生产配置匹配：`application-prod.yml` 引用的全部环境变量在 `server.env` 均有导出或带默认值；`SPRING_PROFILES_ACTIVE=prod`；fail-fast 秘密（`JWT_SECRET`/`SW_SSO_CIPHER_KEY`）齐备。
- 迁移内容核对（带数据升级安全性）：V94（工作台卡片类型新表+种子）、V95（管理后台菜单 IA 规整，全部带旧值守卫的 UPDATE）、V96（IoT 触发恢复列 + OpenAPI 回调任务新表），全部为增量/守卫式变更，无破坏性操作。
- 浏览器工具链预演：IAB（用户可见会话）打开现行生产站 + 视口设置验证通过后才开始部署。

## 3. 发布门禁（合并前，同一源码快照）

| 门禁 | 结果 |
|---|---|
| Server 唯一生产构建入口 | `MVN_FLAGS="-Dmaven.test.failure.ignore=false" REVISION=0.1.2 scripts/build-prod.sh` **整体 exit 0**：全量测试 **1570 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS**（与记录基线一致）；`-Pprod` 打包 BUILD SUCCESS；制品门禁 19 项全 OK（负向 10 项全 0：H2 驱动/五个 dev 适配器/IoT mock/dev-local 配置/devseed；正向齐备；`build.profile=prod`、`build.version=0.1.2`） |
| Server 版本身份门禁 | `check-version-identity.sh develop` PASS（32/32 = 0.1.2-SNAPSHOT）；`release 0.1.2` PASS（32/32 = 0.1.2） |
| Web 四连 | `NODE_OPTIONS=--max-old-space-size=2048 pnpm typecheck && lint && test && build` **exit 0**：**141 files passed + 1 skipped；1289 tests passed + 3 skipped**；lint **0 error** / 272 warning（既有）；build ✓（2.27s） |
| 正式制品 | `sw-bootstrap/target/bootstrap.jar` **216,898,012 B，sha256 `436e4e94e1abc7899e0e3aa8b47472806edb4a71c197003f76c55cd7ed89699a`** |

原始日志：`evidence/production-release-01/release-gate-server-build-prod.log`、`release-gate-web-four-gate.log`。

> 说明：`build-prod.sh` 在 macOS bash 3.2 下 `set -u` 空数组展开会立即失败（`mvn_flags[@]: unbound variable`），脚本设计的本地用法即显式传 `MVN_FLAGS`；按脚本注释以无害等价值传入，未改动仓内脚本。CI（ubuntu bash）不受影响。

## 4. 合并 main 与推送

- Server：本地 `main` 以 fast-forward 自 `20fffc1` 越过 `d18e9a3` 至 develop HEAD；首次推送 `d18e9a3..ebf26ae main->main`；后因 §6 修复追加 `2d4278b`，最终 `origin/main = origin/develop = 2d4278b3d1c645b5f8a5598be70ae3d516004b00`，`ls-remote` 回读一致。
- Web：`git fetch . develop:main`（`4ed9fdb→1871725`），推送 `039f987..1871725 main->main`；`origin/main = 1871725e85d5f8971233c7a4f6c9937e3cfa4288`，回读一致。
- 均为普通快进推送，非强制；未改写历史。

## 5. 生产部署（按 runbook `evidence/production-release-01/deploy-runbook.md`）

### 5.1 备份（先于任何变更）

- DB dump：`/data/backup/smart_workflow_20260926_1521.dump`（399K，`pg_dump -Fc`）。
- jar 轮换：旧 0.1.0 jar → `bootstrap.jar.bak`（218,971,165B）；更旧 0.0.2 jar → `bootstrap.jar.bak2`（154,752,595B）。
- 前端：`web.bak-20260921`（保留）+ 本次替换前 `web → web.bak-20260926`。

### 5.2 后端

1. jar 预上传至 `bootstrap.jar.new`，远端 `sha256sum` 与本地一致（`436e4e94…9699a`）。
2. `STOP_TIMEOUT=30 ./stop.sh` → PID 停止、`PORT_FREE`（8080 无监听）。
3. `mv bootstrap.jar.new bootstrap.jar` → 回读 sha256 一致。
4. 启动与迁移：**首次启动失败**（见 §6 偏差 1，操作层原因，DB 未受影响，`flyway_schema_history` 全程 0 failed）；纠正后 `source server.env && ./start.sh`，Flyway 自动执行 **V94→V95→V96 "Successfully applied 3 migrations"**，prod-update 迁移链完成。
5. 终态验证：本机 `http://127.0.0.1:8080/api/actuator/health` = **200 {"status":"UP"}**；`flyway_schema_history` max(success)=**96**、failed=**0**；新 PID 启动段 **0 ERROR**；经 nginx `https://chikaho.cn/sw-server/api/actuator/health` = **200 UP**。

### 5.3 前端

1. `dist/`（构建自 Web `1871725`，`.env.production`：base `/sw/`、API `/sw-server/api`）打包 zip（1,015,593B，sha256 `0df65b1089eb2c6448a605a2082c68a81b09b0a1df58c0547d4f6ddc7da40198`）上传，远端 sha256 一致。
2. `web → web.bak-20260926` → 新目录就位 → `chown -R root:root` → `nginx -t` 通过 → `nginx -s reload`。
3. 验证：`https://chikaho.cn/sw/` = **200**；`index.html` 引用新构建 hash `assets/index-3g59rUSC.js`（旧为 `index-NEtTwcni.js`）。

## 6. 偏差与处置

1. **后端首次启动失败（操作层）**：我在新 SSH 会话直接 `./start.sh`，而该脚本不加载 `server.env`（0.1.0 轮由操作者先 source 再启动）。JVM 无 PG 凭据 → Druid 报 `The server requested SCRAM-based authentication, but no password was provided`，启动期退出；**DB 未被触碰（迁移未开始，V93、0 failed）**。处置：`source server.env && ./start.sh` 纠正重启，服务正常。结论：非 0.1.2 代码/配置缺陷；建议后续把 `server.env` 加载并入 `start.sh`（记观察项，待 Owner 排期）。
2. **Server main CI 未触发（工作流文件缺陷，已修复）**：推送 `ebf26ae` 后 main 无 run；develop 推送出现 0 秒失败 run（"workflow file issue"）。定位：`build-release.yml` 第 60 行步骤名含裸冒号（`in-repo entry: tests + ...`）使 YAML 解析失败——该字符串由 BAO 批次（`41274d2`）引入，0.1.0 时期文件无此行，故 09-21 后 main 从未真正跑过此 workflow。修复：步骤名加引号（`2d4278b`，`ci(server): 修复 build-release 步骤名裸冒号导致 workflow 解析失败`），推送 develop 并快进 main。修复后 main run **36227258870** 触发（见 §8）。此缺陷与生产部署制品无关（本地构建不受影响），但意味着 0.1.0 之后 server 仓 main push CI/自动 Release 链路此前处于失效状态。
3. **Web `package.json` version 仍为 `0.1.0`**：Owner 2026-09-26 版本修正范围仅覆盖 server 仓与工作区文档，Web 版本字段未授权改动，本轮未动；Web CI Release 标题因此显示 `0.1.0 build <sha>`（事实记录，待 Owner 决定是否随下一轮统一）。

## 7. 正式浏览器验收（headless=false，用户可见可交互会话）

- 会话：ZCode In-app Browser（IAB，可见面板），入口 `https://chikaho.cn/sw/`；身份 = 迁移 V4 契约种子管理员 `admin`（显示名「系统管理员」），图片验证码经可见截图人工读码一次通过（`3azp`）。
- 覆盖视口与页面（制品均存 `evidence/production-release-01/`，索引 `evidence-index.json`）：

| 视口 | 页面与结果 | 制品 |
|---|---|---|
| 1920×1080（16:9） | 登录页渲染 ✓ → 登录成功 → 工作台 ✓ → 流程中心 ✓ → 管理后台 ✓（V95 新目录 Form management / Process management 已生效） | `login-` / `workspace-` / `process-center-` / `admin-console-1920x1080-16x9.png` |
| 1440×900（16:10） | 工作台加载完成态 ✓（统计卡/待办/快捷启动无溢出） | `workspace-1440x900-16x10.png` |
| 1024×768（4:3） | 工作台响应式 ✓（导航收缩、卡片重排、无横向溢出） | `workspace-1024x768-4x3.png` |
| 1366×768（16:9） | 工作台 ✓；管理后台用户表可用 | `workspace-` / `admin-console-1366x768-16x9.png` |

- 网络索引：全会话 16 个 `/sw-server/api/*` 调用（challenge/login/me/menus/workspace layout/workflow 全家/catalog/analytics/user page）全部命中新后端并正常返回（`evidence-index.json` 逐条记录）。
- 观察项（既有 UI 瑕疵，非本发布引入，不构成阻塞）：①管理后台顶部导航在 1366×768 下相邻项文字轻微重叠；②用户表 Gender/Status 空值列列头竖排。

## 8. CI 与 Release 资产（推送 main 自动链路）

- Web：main run **36226533431 completed success**（4m28s），`build-1871725…` Release 与 `dist-<sha>.zip` 资产生成。
- Server：workflow 修复后 main run **36227258870** 触发（全量测试 + prod 打包 + 制品门禁 + `build-<sha>` Release），最终结果与资产 sha256 见 §10 补记。

## 9. Git 与工作区收尾

- Server：develop 与 main 均至 `2d4278b`；Web：develop/main 均为 `1871725`；均普通推送。
- Workspace（本仓）：本回执、证据目录、`knowledge/current-status.md` 事实登记按批次提交推送 `develop-sw`（§0.8.1 持续授权）；不创建 0.1.2 版本 tag（`version.json` 规则：版本标签/Release 需 Owner 单独明确授权，本轮指令未含）。

## 10. 自验结论

- 合并 main：完成（两仓，快进，回读一致）。
- 生产发布：完成（后端 0.1.2 + 前端 0.1.2 构建产物上线，DB V96，双端健康，日志 0 ERROR）。
- 真实浏览器验收：完成（4 视口覆盖 16:9/16:10/4:3，PNG 与网络索引留存）。
- 偏差已处置并记录（§6），遗留观察项 3 条（start.sh 环境加载、Web 版本字段、既有 UI 瑕疵×2）。
- **自验通过，待规划验收。**
