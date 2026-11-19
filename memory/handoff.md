# 交接

2026-11-19｜规划｜1.1.3 补丁立项（P72+P73，两仓 1.1.3），方向 `product/v1.1.3-patch/ready/direction-v1.1.3.md`。

## 当前（1.1.3 立项后）

- **执行方**：按 `product/v1.1.3-patch/receipts/planning-execution-prompt-113-03.md` 做阶段 4—6：两仓合并到 main（main CI success 才打 tag）、tag `1.1.3` + Release、按运维手册部署演示环境、复测 B1—B4/E2、旧子执行行改 INTERRUPTED（已预授权）、文档同步。回执 `execution-113-04.md`。
- **规划**：阶段 3 已 PASSED（`planning-review-113-03.md`）。收到回执后看演示环境截图、核对发布事实，再做阶段 7 结束复核并下发 iso113 清理。CI run 号在合并 main 后取（Owner 裁定）。演示环境旧子执行行 → INTERRUPTED 已预授权（`planning-review-113-01.md`）。阶段 6 交接点名运维手册；发布说明注明 `583f1a38` 修了启动回归。
- **进度**：七阶段（评估、实施、验收、合并、发版、部署与同步、结束），已完成 3，进行中 1（合并），未开始 3。
- **常规决定（一行）**：B3「发生时间」由规划并入；Server 全量测试中的环境类失败记为限制，以 main CI 为准。

## 2026-11-19 执行批次（代码规范治理，已终态）

- 功能数 58、线上 1.1.2 不变（纯 develop 快进）。千行文件清零、两族存量测试全绿；p3c 豁免口径见 `knowledge/known-issues.md` 2026-11-19 条，勿重议。
- 1.1.3 之后的候选：P67、P68；i18n views 覆盖（487 处写死中文，产品级）；NodeFunctionService 线程池有界化（先做负载论证）。

## 线上基线

Server main/Latest=1.1.2（tag `c3724e52`）；Web main/Latest=1.1.2（tag `abfe1339`）。UAT 跑 Server 1.1.2 + Web 1.1.2，Flyway 35 行。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`、`postgres`/`redis`/`mosquitto-024` 容器；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110/UAT112 测试图、表单、流程、执行保留。

## 更早历史

2026-11-15 1.1.2 COMPLETED（`planning-review-112-06.md`）；1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
