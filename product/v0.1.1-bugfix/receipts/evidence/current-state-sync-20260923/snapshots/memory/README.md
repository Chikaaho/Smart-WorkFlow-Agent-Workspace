# memory 使用说明

`memory/` 保存 Planner 可直接恢复和决策的最小摘要；不承载完整历史、原始证据或完整决策正文。

- 当前摘要：`state.md`、`handoff.md`（2026-09-23：0.1.1 阶段快照机械同步已完成，25 项登记 = 23 已提交候选 + 021 处理中 + 024 Owner 复开，均按最新回执区分验收边界；§3.1 未登记提交差异待 Planner 裁决）。唯一执行入口：`product/v0.1.1-bugfix/ready/direction-current-state-sync-20260923.md`；回执 `product/v0.1.1-bugfix/receipts/current-state-sync-20260923-01.md` 待 Planner 复核；knowledge 与根/两仓 README 已同步。
- 全量双向映射索引：`knowledge/feature-reconciliation-index.md`
- 未关闭问题：`knowledge/known-issues.md`；完整功能清单：`Smart-WorkFlow-aPaaS-server/功能清单.md`；历史证据：`product/*/receipts/`
