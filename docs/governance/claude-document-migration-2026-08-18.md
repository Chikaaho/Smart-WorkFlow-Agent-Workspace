# `.claude` 项目文档迁移回执（2026-08-18）

## 目标与边界

本次仅迁移工程治理、项目规则与工具配置说明，不修改业务源码、业务测试、数据库迁移或产品需求，不运行构建、测试或部署，不提交或推送 Git。

工作区根目录 `/usr/local/projects/Smart-WorkFlow` 是 planning layer；`Smart-WorkFlow/` 与 `Smart-WorkFlow-Web/` 分别是后端、前端 executor sublayer。禁止跨前后端操作是 executor sublayer 的会话边界，不是把工作区根目录定位成后端仓库。

## 迁移映射

| 原路径 | 处理结果 | 判定依据 |
|---|---|---|
| `.claude/` + `memory/backend-only-` + `repo.md` | 删除；正确语义合并到根 `system.md` 与 `AGENTS.md` | 旧后端专属定位与现行 planning workspace 架构冲突，不得迁移为有效规则；子层禁止跨项目约束由各自工程宪法保留 |
| `.claude/` + `memory/no-claude-commits.md` | 合并到根 `AGENTS.md` 的 Git 提交规则 | 禁止 Claude 署名仍有效，但属于仓库治理规则，不应存放在 Claude memory |
| `.claude/` + `memory/MEMORY.md` | 删除 | 仅索引上述两份 memory；迁移完成后没有独立保留价值 |
| `Smart-WorkFlow/.claude/` + `system.md` | `Smart-WorkFlow/docs/governance/engineering-constitution.md` | 后端工程宪法仍有效，迁入后端项目正式治理目录并保持唯一权威 |
| `Smart-WorkFlow-Web/.claude/` + `system.md` | `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` | 前端工程宪法仍有效，迁入前端项目正式治理目录并保持唯一权威 |

## `.claude` 保留项

| 路径 | 保留理由 |
|---|---|
| `.claude/settings.json` | Claude 权限运行配置 |
| `Smart-WorkFlow/.claude/settings.json` | 后端项目 Claude settings 配置 |
| `Smart-WorkFlow/.claude/settings.local.json` | 后端项目本机 Claude settings 配置 |
| `Smart-WorkFlow-Web/.claude/settings.json` | 前端项目 Claude 权限运行配置 |

上述 JSON 均经只读检查，仅包含 Claude permissions 或空 settings 对象；未删除、未修改。迁移完成后，三处 `.claude/` 不再承载 Markdown、memory、工程宪法、项目规则、提示词或项目知识。

## 引用处理

- 根 `AGENTS.md`、根 `system.md`、两端 `AGENTS.md` 已改为引用项目正式治理路径。
- `knowledge/`、`product/`、`search_fallback/` 中指向旧工程宪法路径的引用已更新为新路径；历史内容只改路径，不改变其业务结论。
- 迁移验收以全工作区检索旧工程宪法路径、旧 Claude memory 路径和旧根仓库后端语义均为零命中为准。

## 三层治理一致性

- 根 `system.md` 与根 `AGENTS.md`：工作区根是 planning layer，两个子项目是隔离的 executor sublayer。
- 后端入口与宪法：只允许后端执行范围，禁止读写、构建、测试或分析前端项目。
- 前端入口与宪法：只允许前端执行范围，禁止读写、构建、测试或分析后端项目。
- 管理员仅可在授权范围内跨层维护宪法、架构文档与工程治理配置，不因此获得业务规划或业务实现权限。
