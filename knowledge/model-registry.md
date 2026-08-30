# 会话角色权威索引

> 本文件只提供治理入口导航，不定义或镜像角色权限、授权、终态、回执生命周期和停止条件。
> 最后验证：2026-08-29。

## 权威入口

| 主题 | 唯一权威 |
|------|----------|
| 角色认领、公共协议、工作流与 Git 治理 | `system.md` |
| Planner 完整定义 | `roles/planner.md` |
| Executor 完整定义 | `roles/executor.md` |
| Admin 完整定义 | `roles/admin.md` |
| Executor terminal schema 与合法 state | `.codex/governance/terminal-contract.json` |
| terminal JSON 语义校验 | `.codex/governance/validate-terminal.sh` |
| 后端工程专属规则 | `Smart-WorkFlow-Server/docs/governance/engineering-constitution.md` |
| 前端工程专属规则 | `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` |

## 使用规则

1. 用户声明角色后，按 `system.md` 的门禁读取对应 `roles/<role>.md`；不得以本索引替代角色文件。
2. 本文件不得复制允许读取、允许写入、状态枚举、terminal 字段或回执流转正文。
3. 权威文件路径变化时只更新本索引；治理语义变化只在对应权威文件中修改。
