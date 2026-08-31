# knowledge 使用说明

`knowledge/` 是实例的**完整持久知识库**（Executor 专用，Planner 不读），承载完整状态、已知问题、架构与决策。

## 本目录建议文件（由 Executor 维护）

- `current-status.md` — 当前功能状态、计数、活动功能与唯一下一动作（**唯一权威状态源**）
- `architecture.md` — 整体架构
- `decisions.md` — 决策记录
- `known-issues.md` — 已知问题完整列表
- `shared-constraints.md` — 跨项目共享约束
- `development-workflow.md` — 开发流程
- `model-registry.md` — 模型注册信息
- `features/` — 功能追踪文件
- `evidence/` — 行为证据留存
- `history/` — 旧状态快照与过程历史归档

## 初始化口径

1. 项目接入后由 Executor 在首次结算/同步时建立完整知识库。
2. `current-status.md` 只保存一份最新快照；旧快照与过程历史追加归档到 `knowledge/history/`。
3. `knowledge/` = 唯一完整持久状态源；`memory/` 从本目录压缩而来，不承载本目录没有的完整信息。
4. 触碰任何状态文件时必须先同步本项目 `knowledge/` 全量对应文件，再压缩 `memory/`。

## 接入

新项目取得 Engine 后，`knowledge/` 即为本文件与 `current-status.md` 提供的通用初始状态；随之由 Executor 按项目实际情况充实。