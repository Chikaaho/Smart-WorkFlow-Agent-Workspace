# todo/ 骨架说明

`todo/` 是**暂不修复清单 + 需求缺口池**，与 `product/`、`knowledge/` 平级（不属于某个功能）。

## 文件

| 文件 | 用途 |
|------|------|
| `README.md` | 暂不修复问题索引（决策依据 + 对应 `knowledge/known-issues.md` 编号） |
| `requirement-pool.md` | 功能缺口需求池（Planner 维护；Executor 仅按终态清单/方向授权机械同步） |

## 收录规则（详见 `system.md` §11.2）

- 只收录 `known-issues.md` 中已有明确"暂不修复"决策依据的问题。
- 每条须能追溯到 `knowledge/known-issues.md` 的问题编号，不重复描述，只记决策依据和链接。
- 若后续决定要修复：从 `todo/README.md` 移除该条，并在 `known-issues.md` 同步更新问题状态。

## 初始化

1. 实例接入后由 Planner 依据 `knowledge/known-issues.md` 建立索引。
2. `requirement-pool.md` 的写入仅在阶段三唯一终态值清单或执行方向明确授权时进行。