# knowledge/ 骨架说明

`knowledge/` 是实例的**完整持久知识库**（执行角色专用，规划角色不读），承载完整状态、已知问题、架构与决策。

## 建议文件（由执行角色维护）

- `current-status.md` — 当前功能状态、计数、活动功能与唯一下一动作（**唯一权威状态源**）
- `architecture.md` — 整体架构
- `decisions.md` — 决策记录
- `known-issues.md` — 已知问题（完整列表）
- `features/` — 功能追踪文件
- `history/` — 旧状态快照与过程历史归档
- `evidence/` — 行为证据留存
- `model-registry.md` — 模型注册信息

## 初始化

1. 由执行角色在实例首个结算/结束时建立完整知识库。
2. `current-status.md` 只保存一份最新快照；旧快照与过程历史追加归档到 `knowledge/history/`。
3. `knowledge/` 是唯一规范权威；`memory/` 从本目录压缩而来。

## 信息分层铁律

1. `knowledge/` = 唯一完整持久状态源。
2. `memory/` = 最少信息摘要。
3. 不一致时以 `knowledge/` 为准。
4. 触碰任何状态文件时必须先同步本项目 `knowledge/` 全量对应文件，再压缩 `memory/`。