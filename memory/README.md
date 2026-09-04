# memory 使用说明

`memory/` 保存 Planner 可直接恢复和决策的最小摘要；不承载完整历史、原始证据或完整决策正文。

## 本目录文件

- `state.md` — 当前实例状态摘要与唯一下一动作
- `handoff.md` — 跨会话交接摘要
- `features.md` — 功能状态摘要
- `decisions.md` — 关键设计决策
- `issues.md` — 已知问题与遗留
- `constraints.md` — 当前约束
- `architecture.md` — 架构摘要

## 权威路径（通用）

- 完整知识库：`knowledge/`
- 当前状态唯一来源：`knowledge/current-status.md`
- 历史回执：`product/<feature>/receipts/`
- 暂不修复与需求池：`todo/README.md`、`todo/requirement-pool.md`

## 初始化口径

1. 每个短记忆文件 <5KB、总量 <20KB，只保留当前决策摘要与权威路径，详情改为 knowledge/receipt 指针。
2. `knowledge/` = 唯一完整持久状态源；`memory/` 只承载最少信息摘要，不承载 knowledge 中没有的完整信息。
3. 不一致时以 `knowledge/` 为准。
4. 执行角色触碰任何状态文件时必须先同步本项目 `knowledge/` 全量对应文件，再压缩 `memory/`。

## 接入

新项目取得 `main`（Engine）后，`memory/` 即为本文件提供的初始状态；项目运行后由 Planner 维护 `state.md`/`handoff.md` 等摘要。