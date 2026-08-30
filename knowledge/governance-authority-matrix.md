# 核心治理规则权威归属矩阵

> 截至/同步点：2026-08-29，workspace-governance-consistency-remediation。

| 核心规则 | 唯一权威文件/章节 | 引用方（仅短引用） |
|---|---|---|
| 会话角色门禁、公共协议、业务三阶段状态机 | `system.md` §0.2、§3、§5 | `AGENTS.md`、两端 `AGENTS.md`、两端工程宪法 |
| Planner 权限、验收与记忆职责 | `roles/planner.md` | `system.md` §0.1/§0.9、工程宪法入口 |
| Executor 权限、证据与执行纪律 | `roles/executor.md` | `system.md` §0.1/§0.9、工程宪法入口 |
| Admin 权限与 Governance Implementation | `roles/admin.md` §2—§4 | `system.md` §0.8、Harness 入口 |
| 当前业务状态、计数、基线、活动项、唯一下一动作 | `knowledge/current-status.md` | `memory/*.md` 最小摘要、交接与方向仅带同步点引用 |
| 历史状态 | `knowledge/history/` | 当前状态仅链接索引，不复制历史正文 |
| 执行终态 schema 与合法状态 | `.codex/governance/terminal-contract.json` | `roles/executor.md`、Hook、回执模板 |
| 执行终态校验行为 | `.codex/governance/validate-terminal.sh` | `.claude/hooks/stop-execution-completeness.sh`、`.codex/hooks/stop-execution-completeness.sh` |
| 后端工程专属约束 | `Smart-WorkFlow-Server/docs/governance/engineering-constitution.md` | 后端 `AGENTS.md` |
| 前端工程专属约束 | `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` | 前端 `AGENTS.md` |
| 工程流程参考 | `knowledge/development-workflow.md`（仅工程步骤与命令导航） | 不得定义角色、授权、terminal 或回执生命周期 |
| 角色路径索引 | `knowledge/model-registry.md`（仅权威路径） | 不得镜像角色权限表 |
| 跨端工程约束 | `knowledge/shared-constraints.md`（安全、接缝、资源互斥） | 不得定义角色、terminal 或 product 流程 |
| 项目介绍与快速开始 | `README.md` | 不得保存当前状态数字、完整角色规则或停止门禁 |

历史原因、事故复盘与 superseded 规则只能进入 `knowledge/decisions.md`、`knowledge/history/` 或带日期/决策号的历史回执，不得作为当前规范正文。

参考文档只能说明自身主题并链接上表权威，不得复制规范正文；发现冲突时先修正参考文档，不得以其扩权或覆盖权威。
