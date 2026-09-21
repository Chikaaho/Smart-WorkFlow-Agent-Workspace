# memory 使用说明

`memory/` 保存 Planner 可直接恢复和决策的最小摘要；不承载完整历史、原始证据或完整决策正文。

- 当前摘要：`state.md`、`handoff.md`（截至2026-09-21：0.1.0已`COMPLETED`；**0.1.1长周期缺陷修复与发布任务已下发READY方向**，分支尚未初始化、缺陷账本为空。唯一下一动作=执行角色读取`product/v0.1.1-bugfix/ready/direction-v0.1.1-bugfix.md`，核对0.1.0基线并创建`0.1.1-bugfix`分支后开放收件）
- 全量双向映射索引：`knowledge/feature-reconciliation-index.md`
- 未关闭问题：`knowledge/known-issues.md`；完整功能清单：`Smart-WorkFlow-aPaaS-server/功能清单.md`；历史证据：`product/*/receipts/`
