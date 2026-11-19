# 交接

2026-11-19｜规划｜1.1.3 补丁立项（P72+P73，两仓 1.1.3），方向 `product/v1.1.3-patch/ready/direction-v1.1.3.md`。

## 当前（1.1.3 立项后）

- **执行方**：按方向开工。先确认 iso112 已清理（未清理则清理，回执写一行），回答方向 §3 的三个根因问题，两仓从 `develop` 建 `feature/1.1.3`，回执 `product/v1.1.3-patch/receipts/execution-113-01.md`。
- **规划**：收到回执后按方向 §5 验收。B1 若需迁移或要改演示环境旧数据，须先经规划确认。阶段 6 交接点名运维手册。
- **进度**：七阶段（评估、实施、验收、合并、发版、部署与同步、结束），已完成 0，进行中 1（评估），未开始 6。
- **常规决定（一行）**：B3「发生时间」ISO 显示由规划并入本补丁（同页小修，不单独立项）。

## 2026-11-19 执行批次（代码规范治理，已终态）

- 功能数 58、线上 1.1.2 不变（纯 develop 快进）。千行文件清零、两族存量测试全绿；p3c 豁免口径见 `knowledge/known-issues.md` 2026-11-19 条，勿重议。
- 1.1.3 之后的候选：P67、P68；i18n views 覆盖（487 处写死中文，产品级）；NodeFunctionService 线程池有界化（先做负载论证）。

## 线上基线

Server main/Latest=1.1.2（tag `c3724e52`）；Web main/Latest=1.1.2（tag `abfe1339`）。UAT 跑 Server 1.1.2 + Web 1.1.2，Flyway 35 行。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`、`postgres`/`redis`/`mosquitto-024` 容器；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110/UAT112 测试图、表单、流程、执行保留。

## 更早历史

2026-11-15 1.1.2 COMPLETED（`planning-review-112-06.md`）；1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
