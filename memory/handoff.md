# 交接

2026-11-13｜规划｜1.1.0 COMPLETED（`planning-review-110-07.md`），本机隔离环境已清理（`postgres`/`redis`/`mosquitto-024` 保留）。

## 当前

- **执行方**：无任务，等新方向。
- **Owner**：选下一项，候选 1.1.2 补丁（P70+P71）、P67、P68。
- **规划**：Owner 定下来后写评估任务或方向。

## 线上基线

Server main/Latest=1.1.0（`6d6bd666`）；Web main/Latest=1.1.1（`3cc05844`）；UAT 跑 Server 1.1.0 + Web 1.1.1，Flyway 35 行。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110 测试图/表单/流程保留。

## 更早历史

1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
