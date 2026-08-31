# P51 Agent Coding Engine 阶段三管理员收口方向

> 下发角色：规划（Planner）
> 指定角色：管理员（Admin）
> 方向状态：READY
> 日期：2026-08-31
> 前置裁决：`receipts/planning-final-review-admin-p51-consolidated-2.md` = `PASSED`
> 任务性质：Owner 特别授权范围内的最终治理归档

## 一、目标

在不改变已通过实现和通用项目初始状态的前提下，完成 P51 方向归档、索引收口、状态一致性检查和本地提交，为规划角色最终确认 `COMPLETED` 提供唯一回执。

## 二、唯一终态值清单

| 字段 | 唯一目标值 |
|---|---|
| P51 功能状态 | `COMPLETED（待规划确认）` |
| 通用项目实例已完成功能数 | `0` |
| 通用项目实例清单计数 | `已完成=0 / 部分完成=0 / 待完成=0` |
| 需求池状态 | 空；P51 不写入通用项目实例需求池 |
| 里程碑/明细 ID | 空；通用项目实例未接入具体项目 |
| 验证基线集合 | `{terminal-contract-posix: cases=35 passed=35 failed=0, hook-runtime: engine-subdir+nested-git × valid+invalid+old-marker+missing-marker = 8/8 expected}` |
| 活动功能 | 无 |
| 当前唯一下一动作 | 等待 Owner 决定是否授权发布本地 `main` 与 `develop-sw`；不继续实现、补证或修改终态契约 |
| P51 主方向目标目录 | `product/p51-agent-coding-engine-decoupling/passed/` |
| 阶段三方向目标目录 | `product/p51-agent-coding-engine-decoupling/passed/direction-admin-p51-stage3-closeout.md` |
| 远端状态 | 不变；不得 push、force push、发布 tag 或改写历史 |

PowerShell 契约测试不在验证基线集合中；当前事实只记录为“环境无 `pwsh`，未执行”，不得写成通过。

## 三、方向归档清单

将以下 `ready/` 文件归档到同功能的 `passed/`，文件名保持不变：

1. `direction-admin-engine-governance-generalization.md`；
2. `direction-admin-p51-engine-governance-consolidated.md`；
3. `direction-p51-language-agnostic-project-contract.md`；
4. `direction-p51-root-runtime-workspace.md`；
5. `direction-admin-p51-stage3-closeout.md`。

归档后 `ready/` 目录不得残留活动方向；所有 receipts 与 evidence 原地保留。

## 四、通用项目初始状态

`knowledge/current-status.md`、`memory/`、`todo/` 表达的是新项目尚未接入的通用初始实例，不承载 P51 治理状态。管理员只核对以下值，不改变其语义：

- 当前活动功能：无；
- 已完成功能数：0；
- 清单计数：0/0/0；
- 需求池：空；
- 项目验证基线：空；
- 当前下一动作：填写项目说明并配置 coding 仓库后开始首个需求。

若文件事实与上述值不同，本任务必须 `BLOCKED`，不得自行选择新值。

## 五、memory 唯一字节目标

以下文件内容保持不变，阶段三回执逐项报告实际字节并与目标核对：

| 文件 | 目标字节 |
|---|---:|
| `memory/README.md` | 1339 |
| `memory/state.md` | 534 |
| `memory/handoff.md` | 561 |
| `memory/features.md` | 277 |
| `memory/decisions.md` | 183 |
| `memory/issues.md` | 228 |
| `memory/constraints.md` | 265 |
| `memory/architecture.md` | 225 |
| 合计 | 3612 |

## 六、允许修改范围

- P51 顶层 `README.md`；
- 本方向从 `ready/` 到 `passed/` 的归档；
- §三列出的其余方向从 `ready/` 到 `passed/` 的归档；
- 新增阶段三管理员回执；
- 为完成上述归档创建一个本地中文 Conventional Commit。

不得修改 `system.md`、`roles/`、`.codex/`、`.claude/`、根 README、项目说明、knowledge/memory/todo 内容、真实 coding 仓、`develop-sw`、分支、tag 或远端。

## 七、验收标准

1. P51 顶层索引显示 `COMPLETED（待规划确认）`，唯一下一动作为等待 Owner 发布裁决。
2. §三五份方向全部位于 `passed/`，`ready/` 无活动文件。
3. receipts/evidence 文件数量和内容未移动、覆盖或删除。
4. 通用项目初始状态六项与 §四逐字一致，不写入 P51 状态。
5. memory 八文件字节数逐项匹配，总量 3612，内容无修改。
6. 验证基线集合逐字使用 §二值；PowerShell 只记录未执行事实。
7. 实际修改严格为 §六范围，`git diff --check` 通过，工作树干净并形成可复核本地提交。
8. 未修改 `develop-sw`、真实 coding 仓、终态契约、分支和远端。

## 八、唯一回执

管理员只返回：

`product/p51-agent-coding-engine-decoupling/receipts/completion-admin-p51-stage3-closeout.md`

回执逐项提供：终态值清单、方向归档清单、初始状态核对、memory 字节核对、修改文件、提交哈希、工作树和未远端发布证据。管理员不自行写规划确认结论。
