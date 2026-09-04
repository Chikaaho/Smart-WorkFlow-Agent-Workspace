# 近期有效决策摘要

> 截至/同步点：2026-09-04；权威详情：`knowledge/decisions.md` 与对应回执。

- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`，历史见 `knowledge/history/`。
- 终态机器契约单一源为 `.codex/governance/terminal-contract.json`，公共校验入口为 `.codex/governance/validate-terminal.sh`。
- Planner 以 `memory/` 最小摘要恢复；摘要冲突时按 knowledge 权威修正，不反向裁决。
- 知识库全量整理规划裁决（B 方向 §2/§3 固定值）：功能数 41 不变；清单 ✅34/🟦28/⬜28；五行 ⬜→🟦（M04-F01-03/M04-F07-01/M06-F01-01/M06-F02-01/M06-F03-01）；P34/P35/P37/P38/P39 部分实现开放未核销、P4 开放、P3/P21 部分关闭未核销；P/I 集合不增删。
- （历史决策）`v0.0.1-beta` 发布候选的必须业务链为用户/组织/角色配置、表单创建发布、单节点流程创建发布、真实提交发起、待办审批及结果/流转记录回看。⚠ `v0.0.1` 已于 2026-08-31 发布（Owner 确认），本条为历史决策指针，不再作为待办指令。