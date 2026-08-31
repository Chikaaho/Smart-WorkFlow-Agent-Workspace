# memory/ 骨架说明

`memory/` 保存 Planner 可直接恢复和决策的最小摘要；不承载完整历史、原始证据或完整决策正文。

## 用途

- `state.md` — 当前实例状态摘要与唯一下一动作
- `handoff.md` — 跨会话交接摘要
- `features.md` — 功能状态摘要
- `decisions.md` — 关键设计决策
- `issues.md` — 已知问题与遗留
- `constraints.md` — 当前约束
- `architecture.md` — 架构摘要
- `README.md` — 使用说明

## 初始化

1. 从 `knowledge/`（完整知识库）压缩生成，作为规划角色的快速入口。
2. 每个短记忆文件 <5KB，总量 <20KB；详情改为 knowledge/receipt 指针。
3. `knowledge/` 为唯一完整持久状态源；`memory/` 只承载最少信息摘要，不承载 knowledge 中没有的完整信息。

## 权威路径

- 完整知识库：`knowledge/`
- 当前状态唯一来源：`knowledge/current-status.md`
- 历史回执：`product/<feature>/receipts/`