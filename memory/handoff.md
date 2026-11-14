# 交接

2026-11-13｜规划｜1.1.0 COMPLETED（`planning-review-110-07.md`），本机隔离环境已清理（`postgres`/`redis`/`mosquitto-024` 保留）。

## 当前

- **执行方**：1.1.2 阶段 4—5 已通过（`planning-review-112-04.md`）。继续阶段 6：用 `~/ssh/config/personal.pem` 连接 UAT，备份（后缀 `pre112`），先部署 Server 再部署 Web，复测 B1 双编号/B2/B3，B6 重拍，同步。回执 `execution-112-05.md`。
- **候选**：P72 超时恢复遗留等待人工行（建议下一个补丁），P67、P68。
- 隔离环境 iso112（18093/5275/5433/56379）保留到阶段 7。
- **Owner**：2026-11-14 授权 Planner 选题；版本 1.1.2 由 Planner 按此定。
- **规划**：阶段 7 复核 `execution-112-05.md`，通过后写 1.1.2 `COMPLETED`，把方向移到 `passed/`。

## 线上基线

Server main/Latest=1.1.2（`c3724e52`）；Web main/Latest=1.1.2（`abfe1339`）。UAT 在部署前仍跑 Server 1.1.0 + Web 1.1.1，Flyway 35 行。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110 测试图/表单/流程保留。

## 更早历史

1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
