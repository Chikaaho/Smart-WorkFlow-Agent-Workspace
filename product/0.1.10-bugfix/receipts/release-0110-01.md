# 0.1.10 发布回执（01）

2026-10-21｜Executor｜L｜EXECUTION_SUBMITTED（发布执行中，待规划终审）

入口：`../ready/direction-release-handoff-0110.md`；收口：`closeout-0110-01.md`；就绪核查：`search_fallback/release-readiness-0110.md`。

## 1. 版本与合并

- 确认版本：0.1.10（Owner 已确认，沿用）。
- Web：任务分支 `bugfix/0.1.10`（22 提交，tip `302fce1`）→ develop 快进 `302fce1` → 版本收敛 `28c2ecf`（package.json 0.1.10）→ main 合并 `e03a886`；推送回读一致。
- Server：任务分支 `bugfix/0.1.10`（6 提交，tip `e4e2205`）→ develop 快进 `e4e2205` → 版本收敛 `654b176`（pom/CI 断言/脚本 0.1.10）→ main 合并 `08f995a` → 测试夹具修复 `8a2aa56`（I5 SSO 提交口令恢复与哈希一致）；推送回读一致。
- 版本源核验：Server `check-version-identity.sh pom` PASS、`workflow` PASS、`develop` PASS（32/32 flattened POM=0.1.10-SNAPSHOT），Maven effective=0.1.10-SNAPSHOT；Web package=0.1.10。
- DB：versioned 终点保持 `V0.1.7`；本轮新增 `R__0.1.10_admin_password.sql`（超管种子口令 AdminP@ssw0rd），变更 `R__application_center_menu.sql`（应用管理顶级归位）；启动时由 Flyway 自动应用，无手工衔接脚本。

## 2. CI 与制品

- Web：run `39611689870` **success**（main `e03a886`，2026-10-21T13:51:37Z→13:56:46Z）；CI 产物 `dist-e03a886….zip` **1,360,081 B sha256 `a9d6a5088f406ede626e84a0a8ccbfb657dddfeee71b37f5dba3b2ec4386cd6c`**，入口 `assets/index-qOqx_U4O.js`；CI 测试 **179 文件 / 1653 通过 / 3 跳过**。
- Server：run `39616993514` **success**（main `8a2aa56`）；CI 制品 `bootstrap.jar` **218,065,590 B sha256 `b447fa09f6a6146e22a0adb01616a76fab47b348574b28dcacfe5d7a8be86f57`**，`build.version=0.1.10`。
- 语义 Release：Web annotated tag `0.1.10`（对象 `32e1972a…`→`e03a886`）与 Release `CH-aPaaS Web 0.1.10`（ID `419653361`，资产 `sw-web-dist-0.1.10.zip` 1,360,081 B sha256 `a9d6a508…`）；Server annotated tag `0.1.10`（对象 `0564ee7b…`→`8a2aa56`）与 Release `CH-aPaaS Server 0.1.10`（ID `419678054`，资产 `bootstrap-0.1.10.jar` 218,065,590 B sha256 `b447fa09…`）。

## 3. UAT 部署

- 预部署备份已完成（2026-10-21 22:14）：数据库 `smart_workflow_20261021_2215_pre0110.dump`（634K）、后端 `bootstrap.jar.bak-20261021_pre0110`（208M）、前端 `web.bak-20261021_pre0110`。
- 替换完成（2026-10-21 22:54）：Server `bootstrap.jar` **218,065,590 B sha256 `b447fa09…`**、`build.version=0.1.10`；Web 入口 `assets/index-qOqx_U4O.js`；nginx 配置检查通过并 reload；服务已启动（PID 2512193）。
- 启动与健康：`Started StarterApplication in 181.914 seconds`，健康 `{"status":"UP"}`（HTTP 200），本次启动段 `ERROR` 计数 **0**；根路径 200。
- DB：Flyway 应用 2 条 repeatable——`0.1.10 admin password`、`application center menu`，均 success；versioned 终点保持 `0.1.7`，无 versioned 重放或手工衔接脚本。

## 4. 发布后复验

- 制品身份：UAT 运行包 sha256 与语义 Release 资产一致（`b447fa09…`），`build.version=0.1.10`；Web 入口 `index-qOqx_U4O.js` 与 0.1.10 CI 制品一致。
- 服务健康：UAT 根路径 200、`/api/actuator/health` 200/UP、启动段 ERROR 0。
- DB：两条 0.1.10 repeatable 已应用，版本化终点 `V0.1.7`。
- 未重跑 0.1.9 已锁定业务验收；本次为修复批次，不新增业务功能数。

## 5. 偏差与风险

- Server attempt1/2 的 SSO 测试失败经定位为本轮测试夹具口令与哈希不一致，已修复并在本地 5/5 通过；新 CI run 以修复提交为准。
- 应用导入导出仍未实现，缺 L 方向；不进入本次候选，不表示通过或延期（`app-bundle-io-blocked-01.md`）。

## 6. 结论

0.1.10 已发布并部署 UAT：两仓 annotated tag `0.1.10` 分别指向 Server `8a2aa56`、Web `e03a886`，公开 Release 资产与 CI 制品同源；UAT 运行 `build.version=0.1.10`、健康 UP、启动 ERROR 0，两条 0.1.10 repeatable 已应用。发布执行完成，功能与整体交付状态待规划终审；应用导入导出仍待 L 方向，不进入本次候选。下一动作＝Planner 复核 `closeout-0110-01.md`、本回执与 `final-sync-0110-01.md`。
