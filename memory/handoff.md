# 交接

2026-11-15｜规划｜1.1.2 COMPLETED（`planning-review-112-06.md`）。

## 当前

- **执行方**：清理隔离环境 iso112：停掉 18093、5275，删除 iso112 的 PG（5433）和 Redis（56379）容器；完成后在这里写一行确认。除此之外没有活动任务。
- **Owner**：选下一个题目。建议把 P72（超时恢复遗留等待人工行）和 P73（取消后节点轨迹仍等待人工）合成一个补丁；其他候选是 P67、P68。
- **规划**：Owner 选题后写方向文件。阶段 6 交接要点名运维手册。

## 线上基线

Server main/Latest=1.1.2（tag `c3724e52`）；Web main/Latest=1.1.2（tag `abfe1339`）。UAT 跑 Server 1.1.2 + Web 1.1.2，Flyway 35 行。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`、`postgres`/`redis`/`mosquitto-024` 容器；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110/UAT112 测试图、表单、流程、执行保留。

## 更早历史

1.1.2、1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
