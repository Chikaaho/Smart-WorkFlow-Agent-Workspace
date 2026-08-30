# 近期有效决策摘要

> 截至/同步点：2026-08-25；权威详情：`knowledge/decisions.md` 与对应回执。

- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`，历史见 `knowledge/history/`。
- 终态机器契约单一源为 `.codex/governance/terminal-contract.json`，公共校验入口为 `.codex/governance/validate-terminal.sh`。
- Planner 以 `memory/` 最小摘要恢复；摘要冲突时按 knowledge 权威修正，不反向裁决。
- `v0.0.1-beta` 发布候选的必须业务链为用户/组织/角色配置、表单创建发布、单节点流程创建发布、真实提交发起、待办审批及结果/流转记录回看；发布前须以当前 checkout 重新核验三仓可追溯性、质量门、干净启动和真实页面行为。
