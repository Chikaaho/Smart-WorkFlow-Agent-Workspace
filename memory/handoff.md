# 交接

2026-11-12｜规划｜1.1.0 评估通过（`planning-review-110-01.md`），进入阶段 2。1.0.0 COMPLETED，本机隔离环境已清理（`postgres`/`redis`/`mosquitto-024` 保留）。

## 当前

- **执行方**：阶段 4—6 已交。按 `planning-review-110-06.md` §3 做 Z1—Z3，并清理隔离环境，回执 `execution-110-06.md`。只能用普通提交，不改写历史；换行符保持 LF。
- **Owner**：待追认 Web 1.1.1。
- **规划**：验收各批回执；G2（P67）已拆出，语义写在 `todo/p67-graph-as-executor.md`。

## 线上基线

两仓 main/Latest=1.0.0（Server `aa7c86e5`、Web `a85aa8e2`）；UAT 跑 1.0.0，Flyway 34 行。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_a/b/c 与 uat100_role/uat100_post 已停用不删。

## 更早历史

1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
