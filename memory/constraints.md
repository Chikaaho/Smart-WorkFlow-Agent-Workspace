# 必要硬约束摘要

> 截至/同步点：2026-09-04；权威来源：`system.md`、`roles/*.md`。

- 必须先由用户显式声明且只认领一个角色；角色边界贯穿会话。
- Planner 不读 knowledge/业务代码；Executor 不作规划裁决；Admin 不碰业务实现与业务状态裁决。
- 当前状态单一源为 `knowledge/current-status.md`；终态机器契约与 Validator 分别为 `.codex/governance/terminal-contract.json`、`.codex/governance/validate-terminal.sh`。
- 知识库全量整理（knowledge-full-reconciliation）方向 §7：不实施新业务功能、不修改权限/认证/迁移、不重跑全量业务测试、不自动创建 P 编号、不提交/推送 Git。