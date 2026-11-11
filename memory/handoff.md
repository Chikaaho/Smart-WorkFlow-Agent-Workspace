# 交接

2026-11-12｜规划｜1.1.0 立项，阶段 1 评估。1.0.0 COMPLETED（`planning-review-100-05.md`），本机隔离环境已清理（18093/5275 停、`smart_workflow_100` 已删、六库容器已移除；`postgres`/`redis`/`mosquitto-024` 保留）。

## 当前

- **执行方**：做只读评估 `search_task/v110-graph-designer-train-assessment.md`（Q1 设计器现状与 Dify 对照、Q2 P67、Q3 人工/子图节点、Q4 小尾巴、Q5 版本与等级），回执 `search_fallback/v110-graph-designer-train-assessment.md`（<5KB，细节放 `-appendix.md`），截图本地不入 Git。
- **规划**：读回执后写正式方向 `product/v1.1.0-graph-designer/ready/`；范围 G1—G4 与版本号 1.1.0 待 Owner 确认。

## 线上基线

两仓 main/Latest=1.0.0（Server `aa7c86e5`、Web `a85aa8e2`）；UAT 跑 1.0.0，Flyway 34 行。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_a/b/c 与 uat100_role/uat100_post 已停用不删。

## 更早历史

1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
