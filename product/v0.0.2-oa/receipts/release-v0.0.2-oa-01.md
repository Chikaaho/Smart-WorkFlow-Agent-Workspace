# v0.0.2 最终发布执行回执 01（自动 Release + 手动服务器部署，自验提交规划验收）

2026-09-07；执行角色：Executor。唯一执行入口：`product/v0.0.2-oa/ready/direction-v0.0.2-oa-release.md`（Planner READY，Owner 已授权发布）。本回执只提交 `VERIFYING / EXECUTION_SUBMITTED`，不自判发布终态；Planner 按下文 §9 边界独立验收。

## 1. 概要

两个代码仓库均完成 `develop → main` 发布，各自最终 `main` 提交上创建并推送精确标签 `0.0.2`（无 `v` 前缀）；push main 触发两仓 GitHub Actions 自动构建并生成 `build-<sha>` Release（保留）；服务器端由 Executor 手动完成前后端部署并回读服务状态与用户可见入口。工作区根仓库零 Git 发布动作。

| 仓库 | develop（远端） | main（远端，最终） | 标签 0.0.2（annotated） | 0.0.2 peeled |
|---|---|---|---|---|
| Smart-WorkFlow-aPaaS-server | `a5113b815170654a0ca3390cd284dd1ead6be55c` | `20fffc1ddec13ea665fc388f4243c6e063974883` | `733f75f752ad358724d6a1250c73a860f2b68108` | `20fffc1d…` = main |
| Smart-WorkFlow-aPaaS-Web | `9495a114d528fa8c4a4c122b7b788e7bd9f0a5d7` | `0bf6e8925059e4c254328c5d1643ebd8c1a2943e` | `3ad040478f14a87d45ac5e68c83bc669d51062ef` | `0bf6e892…` = main |

## 2. 候选提交与文件事实（方向 §4.1）

### 2.1 本会话在两仓 develop 新增提交（均为中文 Conventional Commits，无署名）

Server（5 个提交推送到远端 develop，`d5d0adb..a5113b8`；其中本轮新增 2 个）：
- `e3b03db` fix(oa): 抄送查询支持流程实例精确筛选与同时间稳定分页（验收 R2a/R2b 实现与测试收口）——6 文件 +172/−5：`BpmCopyController.java`、`CopyRecordMapper.java`、`BpmCopyQueryService.java`、`BpmCopyQueryServiceImpl.java`、新增 `CopyRecordMapperIntegrationTest.java`、新增 `schema-copy-h2.sql`（A3 已规划验收 04 锁定，工作树收口提交）
- `a5113b8` docs(oa): v0.0.2 产品介绍 README 收口与同源 Logo（A8）——2 文件 +41/−99：`README.md`、新增 `docs/images/ch-apaas-logo.png`

Web（5 个提交推送到远端 develop，`1864d8a..9495a11`；其中本轮新增 2 个）：
- `8a4d6ad` fix(oa): 抄送我的流程实例精确筛选与同时间稳定分页前端配套 ——3 文件 +28/−3：`src/foundation/mock/handlers.ts`、`src/modules/workflow/api/oa.ts`、`src/modules/workflow/views/MyCc.vue`
- `9495a11` docs(oa): v0.0.2 产品介绍 README 收口与同源 Logo（A8）——2 文件 +40/−104：`README.md`、新增 `docs/images/ch-apaas-logo.png`

### 2.2 最终 main 合并提交（与旧 main 的完整 diffstat）

- Server `20fffc1`（merge：父 `6ab9ae5` + 父 `a5113b8`）vs 旧 main `6ab9ae5`：**372 files, +25162/−1713**（OA 功能、Flyway V56—V58、登录安全 P45、测试资产、README/Logo、main 侧既有 CI/启停脚本与安全清理均保留）
- Web `0bf6e89`（merge：父 `4c044c6` + 父 `9495a11`）vs 旧 main `4c044c6`：**110 files, +11579/−533**

合并冲突仅 Server 两个 Flyway 全链测试文件（H2/PG 计数断言：main 侧 V46 基线 vs develop 侧 V58 基线），已按 develop 已验收版本解决（develop 计数即本地全量测试通过的 V58 基线），无 force、无历史改写；`.github/workflows/build-release.yml`（main 独有 CI 机制）与 main 侧启停脚本 `start.sh`/`stop.sh`、安全清理（`application-local.yml` 停止跟踪）均完整保留于合并结果。

### 2.3 提交后剩余工作树归属（如实报告）

- Server develop 工作树：`M 功能清单.md`（v0.0.2-oa 终态同步值：✅36/🟦26/⬜28、第 43 功能等。按发布方向 §2 范围不属发布提交内容，保持工作树未提交，由 Planner 裁决后续处理）；`?? sw-bootstrap/uploads/`（运行上传产物，不提交）
- Web develop 工作树：`?? f-cfg-fix.json`、`?? f-cfg.json`、`?? graph.json`（方向点名的既有杂散文件，未提交、未删除）
- 两仓 main worktree 提交后干净；`target/`、`node_modules/`、`dist/` 等构件均被 .gitignore 覆盖，未进入任何提交

## 3. README 与 Logo 跟踪及同源核验（方向 §4.2）

- 两仓 README 与 `docs/images/ch-apaas-logo.png` 已被最终提交跟踪（Server `a5113b8`、Web `9495a11`，均进入最终 main）。
- Logo 同源：提交前 SHA-256 复核，两仓 Logo 与 Owner 原图（验收 r2 证据哈希）一致：`f5194ac671c42957f46797228e9ffd827f996a8c289c04f83297c9d58d48552e` = Owner 原图 = 两仓 `docs/images/ch-apaas-logo.png`。
- 两仓 README SHA 与验收 r2 快照完全一致（Server `c148123f…`、Web `52a3c4b2…`），A8 验收后无任何改动。

## 4. 候选快照卫生（方向 §4.3）

- 提交清单无 f-cfg/graph/uploads/target/node_modules/dist 等杂散或产物；无凭据、Cookie、私钥、服务器地址写入任何提交与回执。
- Server 全量测试（develop 工作树，=候选提交树）：181 份 Surefire 报告、**Tests 1156 / Failures 0 / Errors 0 / Skipped 0**；Web 四门禁全部 exit 0（typecheck、lint、vitest **124 files passed + 1 skipped / 1168 tests passed + 3 skipped**、build 成功）。与阶段三终态基线完全一致，候选整理未破坏已验收基线。
- 合并后的 main 树再次全量验证：Server main `20fffc1` 树 182 份报告、**1158 / 0 / 0 / 0**（多出 main 侧既有 IoT 测试 2 条）；Web main `0bf6e89` 树 `pnpm build` 成功。

## 5. 远端分支最终 SHA 与提交关系（方向 §4.4）

- Server：`refs/heads/develop = a5113b8…`（已推送），`refs/heads/main = 20fffc1…`（已推送，合并提交，双父 `6ab9ae5`/`a5113b8`）；main 为 develop 超集（除 main 独有 CI/启停脚本链）。
- Web：`refs/heads/develop = 9495a11…`，`refs/heads/main = 0bf6e89…`（合并提交，双父 `4c044c6`/`9495a11`）。
- `git ls-remote` 回读与本地完全一致（回读原文见执行过程）。

## 6. 标签 0.0.2（方向 §4.5）

- 两仓推送前 `ls-remote --tags` 均无 `0.0.2` → 创建 annotated tag 并推送；推后回读：
  - Server `refs/tags/0.0.2`（annotated 对象 `733f75f7…`）peeled `20fffc1d…` = 最终 main ✓
  - Web `refs/tags/0.0.2`（annotated 对象 `3ad04047…`）peeled `0bf6e892…` = 最终 main ✓
- 未使用 `v` 前缀；无删除/移动/覆盖标签动作。

## 7. GitHub Actions 自动发布与产物（方向 §4.6/§4.8）

两仓 `main` push 均触发 `Build & Release (main)` 工作流并 **completed success**：

| 仓库 | run id | 用时 | 自动标签 | Release 链接 | 资产 |
|---|---|---|---|---|---|
| Server | 34119969372 | 3m40s | `build-20fffc1ddec13ea665fc388f4243c6e063974883` | https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/tag/build-20fffc1ddec13ea665fc388f4243c6e063974883 | `bootstrap.jar`（154,750,992 B，sha256 `94773a31…`） |
| Web | 34120006366 | 3m30s | `build-0bf6e8925059e4c254328c5d1643ebd8c1a2943e` | https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/releases/tag/build-0bf6e8925059e4c254328c5d1643ebd8c1a2943e | `dist-…zip`（820,817 B） |

`build-<sha>` 自动标签保留，与 Owner 指定的 `0.0.2` 分别列明（历史 `build-6ab9ae5`/`build-4c044c6` 亦保留未动）。Actions 自动机制只构建 Release，不含服务器部署 → 按方向 §3 转手动发布。

## 8. 服务器发布与回读（方向 §4.7）

### 8.1 方式与目标

手动发布：本地在最终 main 树构建产物 → 经 `~/ssh/ssh` 既有 personal 运维脚本族上传 → 服务器端备份替换 → 重启 → 健康轮询与入口回读。部署位与入口沿用现有运维约定（生产部署目录与 nginx 反代机制；入口 https://chikaho.cn/sw/ 与 /sw-server/）；未修改 nginx 配置。服务器地址、密钥、env 值等敏感信息不写入本回执。

### 8.2 Server 部署与回读

- 部署产物：本地最终 main 树（`20fffc1`）构建 `bootstrap.jar`，SHA-256 `91d7b50be28194161a3b317ac69abd236d013bfae7d0b0f6b8b6be6cbe702c4e`；上传后服务器端 `sha256sum` 一致。
- 替换与备份：现行 jar 已备份为 `bootstrap.jar.bak3`（旧 SHA `f626a5ba…`，回滚点）。
- 发布所需配置修正（服务器端，未触碰仓库）：v0.0.2 含 P45 登录安全 fail-fast（`RsaLoginKeyManager`/`LoginChallengeService`），要求 `SW_LOGIN_RSA_PRIVATE_KEY`（PKCS#8 RSA ≥2048）与 `SW_LOGIN_DIGEST_SECRET`；已在 `server.env` 注入（chmod 600，值不外泄回执）。v0.0.1 生产 jar（8/31 构建，P45 于 09-01 引入其后）无此要求，故旧 env 不含。
- 数据库迁移：启动日志 `Migrating schema … V47→V58`、`Successfully applied 12 migrations … now at version v58`（生产库升级至 V58）。
- 服务状态：`GET /api/actuator/health` → `{"status":"UP"}`，db PostgreSQL UP、redis UP、diskSpace UP；经 nginx 完整链路 `https://chikaho.cn/sw-server/api/actuator/health` 同样 UP。
- 版本生效行为证据：P45 新增公开端点 `GET /api/auth/challenge`（v0.0.1 jar 不存在）服务器本地与线上均返回 `{"code":0,…captchaImage…}`；未认证受保护端点 `GET /api/workflow/my/copies` 返回 401（认证链正常）。
- 服务身份：`Started StarterApplication`，Tomcat 8080 context `/api`，启动约 142s。

### 8.3 Web 部署与回读

- 部署产物：本地最终 main 树（`0bf6e89`）`pnpm build` 产物 `dist/`（打包 `dist.zip` SHA `7aa46cc047d81a00371652e335af00f8deda5c48597a9f4d3a397e7ee9c20f3d`，上传后服务器端一致）；新入口 `index.html` 引用 `/sw/assets/index-DEHt5Cj7.js`。
- 替换与备份：旧 `index.html` 与 `assets/` 已移入 `/opt/smart-workflow/web/backup-20260907/`（回滚点）；新 dist 解压到位。
- 回读：`https://chikaho.cn/sw/` 返回新 index（bundle 名 `index-DEHt5Cj7.js`），新 bundle 资源 HTTP 200；浏览器实际渲染（in-app browser，DOM 观察 + 截图）：自动跳转 `/sw/login?redirect=/`，页面标题 Smart-WorkFlow，含用户名/密码/验证码输入框与动态验证码图（验证码来自后端 challenge 接口）、登录按钮——登录页完整渲染且前后端闭环；截图存 `receipts/evidence/release-v0.0.2-oa-01/ui-login-page.png`。

### 8.4 回滚约定（未执行，仅记录）

- Server：`bootstrap.jar.bak3`（或 bak/bak2 历史件）+ `server.env` 的 RSA/DIGEST 行删除；Web：`backup-20260907/` 原资源；nginx 未改动无回滚需求。

## 9. 与发布方向验收边界的对照（方向 §5）

| 验收项 | 结果 |
|---|---|
| 发布内容与本方向范围一致 | 通过：A1—A7 已验收实现/直接验证资产 + A8 README/Logo + 服务器端发布配置修正；无夹带 |
| 两仓 develop→main 且远端 0.0.2 精确指向最终 main | 通过（§6 回读一致） |
| README 与 Logo 在两仓远端版本可追溯 | 通过（§3，进入最终 main 提交） |
| 自动或手动服务器发布已执行，服务状态与用户入口证明目标版本生效 | 通过：Actions success + 手动部署完成；health UP、迁移 v58、challenge 端点、登录页渲染均为行为证据 |
| 远端分支、标签、Actions、Release、产物与服务器结果均已回读 | 通过（§5—§8 原始回读） |
| 工作区没有提交、合并、推送、标签或 Release，通用 main 保持本轮发布前身份 | 通过：工作区根 HEAD 仍为 `f4a437e`（develop-sw），无新提交/tag/推送；本地 main `29f70338` 未变；`git status` 62 项 M/?? 与会话开始一致，仅追加了本回执与 evidence 文件（未提交） |

## 10. 偏差、问题与风险（如实报告）

- 偏差 1（服务器端配置修正）：如上 §8.2，属发布 v0.0.2 所必需，未触碰仓库代码；RSA 密钥在服务器端生成并注入，不回执内容。
- 偏差 2（部署过程）：首次替换后启动因缺两环境变量 fail-fast 两次（首次迁移 V47—V58 已成功应用，无副作用），修正 env 后第三次启动成功；服务启动约 142s，健康轮询见 UP。
- 风险/说明：
  - 未执行真实账号登录（无登录凭据授权）；用户可见入口证据 = 登录页实际渲染 + 公开端点行为 + health，未验证登录后业务页面（如需，Planner 可另行安排）。
  - Actions Release 的 `bootstrap.jar` digest（`94773a31…`）与本地部署 jar（`91d7b50b…`）不同：均为最终 main `20fffc1` 同源构建，GitHub runner 与本地环境差异所致；部署以本地构建件为准。
  - 服务器内存较紧（约 1.6G，启动耗时 142s），后续版本发布需预留启动时间。
  - 功能清单.md 保持 Server 仓工作树未提交（§2.3），未影响发布提交范围。
- 未完成内容：无（方向范围内全部完成）。

## 11. 执行自验结论

两仓 develop→main、精确标签 0.0.2、远端 refs/tags/Release、服务器部署与服务/入口回读全部完成且回读一致；工作区零 Git 发布动作。提交 `VERIFYING / EXECUTION_SUBMITTED`，等待 Planner 独立验收。