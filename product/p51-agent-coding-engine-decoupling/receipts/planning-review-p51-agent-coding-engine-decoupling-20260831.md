# P51 Agent Coding Engine 解耦规划验收记录

> 审查角色：规划（Planner）
> 日期：2026-08-31
> 审查对象：`develop-sw` 中的功能级执行回执 `completion-p51-agent-coding-engine-decoupling.md`
> 功能级结论：FAILED

## 一、结论

本轮执行已完成根仓分支分离，但 `main` 尚未形成可直接运行的通用 Agent Coding Engine 工作区，因此 P51 不通过功能级验收。

Owner 已明确最终运行模型：`main` 根目录直接保留完整标准工作区结构；新实例只配置 coding 仓库目录和项目说明，即可按统一协议运行。当前 `main` 的根级标准状态、任务和回执入口不完整，不能支持该运行模型。

## 二、锁定通过项

以下事实后续修正不得重复实施或改变：

1. `develop-sw` 已建立并保留 Smart-WorkFlow/OA 示例分支；
2. `main` 与 `develop-sw` 的分叉点和回滚点已有可复核 Git 记录；
3. 未执行远端 push、force push、远端分支删除或历史改写；
4. 终态契约自检已报告 `cases=35 passed=35 failed=0`；
5. 执行回执使用 `EXECUTION_SUBMITTED`，未越权声明功能完成。

## 三、未通过项

| 编号 | 方向级要求 | 当前事实 | 结论 |
|---|---|---|---|
| G1 | `main` 是可直接运行的完整 Engine 工作区 | 根级 `memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 不完整 | 未通过 |
| G2 | 新项目只配置 coding 仓库目录即可运行 | 当前还依赖额外目录准备，未证明仅配置项目入口即可进入工作流 | 未通过 |
| G3 | 通用协议不绑定 Smart-WorkFlow | `system.md`、`roles/` 仍含 Smart-WorkFlow 仓名、架构事实和本地绝对路径 | 未通过 |
| G4 | 新项目完成完整工作流闭环 | 回执仅证明结构和契约存在，没有非 Smart-WorkFlow 项目的角色门禁、探索、方向、执行回执和规划验收行为链 | 未通过 |
| G5 | 不同实例无状态串扰 | 只有执行摘要，没有可独立复核的正向结果与零交叉证据包 | 未验证 |
| G6 | Harness 入口可从工作区根稳定运行 | 契约脚本通过，但实际 Harness Hook 的工作目录和相对路径行为未形成可复核证据 | 未验证 |

## 四、职责分流

- G1、G2、G4、G5、G6 由执行角色按新的根级运行时方向处理；
- G3 涉及 `system.md`、`roles/`，由管理员角色按独立治理方向处理；
- 已锁定通过项禁止重做，后续回执只提交 G1～G6 的核销证据。

## 五、状态边界

- P51 保持未完成，不得写入 `PASSED`、`COMPLETED` 或进入阶段三；
- `develop-sw` 保持 Smart-WorkFlow/OA 示例身份；
- 远端发布仍不在授权范围；
- 修正完成后追加新的执行回执和管理员回执，不覆盖本记录或原执行回执。
