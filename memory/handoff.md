# 交接

2026-11-20｜规划｜1.1.3 功能级 PASSED（`planning-review-113-04.md`），剩终态同步。

## 当前（1.1.3 终态同步）

- **执行方**：按 `product/v1.1.3-patch/receipts/planning-execution-prompt-113-04.md` 做 T1—T8：knowledge features/known-issues/current-status、两仓 README、演示服务器 `apt-mark manual` PG 两包并回读服务状态、历史行 `#2121178715751251970` 一句话说明（不改）、更正 `execution-113-04.md` §5 第三条、清理 iso113（保留 evidence）。回执 `terminal-sync-113-01.md`。
- **规划**：复核回执后把方向文件移到 `passed/`，需求池 1.1.3 段改为已结束，memory 记 iso113 清理确认，七阶段 7/0/0。
- **进度**：七阶段，已完成 5，进行中 1（部署与同步），未开始 1（结束）。
- **常规决定（一行）**：prod-* 无头截图由 formal-* 取代；执行方提前写的 P72/P73 核销经验收认可；Chromium 先不卸，留观察。

## 2026-11-19 执行批次（代码规范治理，已终态）

- 功能数 58、线上 1.1.2 不变（纯 develop 快进）。千行文件清零、两族存量测试全绿；p3c 豁免口径见 `knowledge/known-issues.md` 2026-11-19 条，勿重议。
- 1.1.3 之后的候选：P67、P68；i18n views 覆盖（487 处写死中文，产品级）；NodeFunctionService 线程池有界化（先做负载论证）。

## 线上基线

Server main/Latest=1.1.3（tag `54b2657b`）；Web main/Latest=1.1.3（tag `05b9739`）。UAT 跑 Server 1.1.3 + Web 1.1.3，Flyway 35 行。登录私钥走文件 `SW_LOGIN_RSA_PRIVATE_KEY_FILE`。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`、`postgres`/`redis`/`mosquitto-024` 容器；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110/UAT112 测试图、表单、流程、执行保留。

## 更早历史

2026-11-15 1.1.2 COMPLETED（`planning-review-112-06.md`）；1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
