# P36 消息模板管理阶段三终态同步方向

> 下发角色：规划（Planner）
> 承接角色：执行（Executor）
> 前置裁决：P36 功能级验收已 PASSED（11/11）
> 方向状态：PASSED（2026-08-26，规划终态复核通过）
> 任务性质：机械同步唯一终态值，不重新实现、测试或裁决功能

## 1. 目标

将 P36 / M05-F02-01 的规划 PASSED 裁决机械同步至完整知识、压缩记忆、功能清单、需求池和交接入口，消除当前入口中的旧功能状态，同时保留 P3 其他通知缺口与全部历史验收记录。

## 2. 唯一终态值清单

| 字段 | 唯一目标值 |
|---|---|
| 功能 | `notify-template-management` |
| 功能状态 | `COMPLETED`（待规划终态复核） |
| 已完成功能数 | **33** |
| 清单计数 | **✅30 / 🟦21 / ⬜39**（总数 90） |
| P36 | **已核销**，仅代表 M05-F02-01 消息模板完成 |
| P3 | **保持部分关闭/未核销**；批量发送、发送记录等剩余缺口继续存在 |
| M05-F02-01 | **✅** |
| 后端正式基线 | **870 / Failures 0 / Errors 0 / Skipped 0；agent 346** |
| 前端正式基线 | **104 files / 1025 tests；typecheck、lint、test、build 全绿** |
| Flyway 正式基线 | **V38；H2/PostgreSQL 均 38 migrations** |
| 当前活动业务功能 | **无** |
| 当前活动治理任务 | **无** |
| 当前唯一下一动作 | **规划层基于更新后的候选池选择下一唯一业务功能；需要现场信息时先下发 search_task** |
| 主方向目标目录 | `product/notify-template-management/passed/direction-notify-template-management.md` |
| 阶段三方向当前目录 | `product/notify-template-management/ready/direction-notify-template-management-stage3.md` |
| 阶段三方向复核通过后的目录 | `product/notify-template-management/passed/direction-notify-template-management-stage3.md` |
| memory 单文件上限 | 每个短记忆文件 **< 5120 bytes** |
| memory 总量上限 | **< 20480 bytes** |

执行角色不得推算、替换或解释上述值。若任何现有权威材料与清单值冲突，必须停止并提交 `BLOCKED`，不得自行选择口径。

## 3. 同步范围

- 完整同步 `knowledge/current-status.md`、P36/M05 对应功能追踪、已知问题/决策/交接等所有受本轮终态影响的当前入口；
- 更新 `Smart-WorkFlow/功能清单.md`，只推进 M05-F02-01；
- 更新 `todo/requirement-pool.md`：核销 P36，保留 P3 未完成边界；
- 将 `memory/state.md`、`memory/handoff.md`、`memory/features.md` 及其他受影响短摘要压缩为终态后的最小当前信息；
- 保留 `product/notify-template-management/receipts/` 中全部执行、失败审查、补充提示和复验历史；
- 追加阶段三执行回执，不覆盖任何历史回执。

## 4. 非目标与锁定项

- 不修改后端、前端业务源码、测试、迁移、依赖或运行配置；
- 不重跑 Maven、pnpm、Flyway、数据库或业务行为测试；
- 不重新解释 870、agent 346、104 files / 1025 tests 或 V38；
- 不核销 P3，不处理批量发送、发送记录、外部通知渠道或其他候选；
- 不删除、覆盖或改写历史失败记录、补证回执及一级执行提示；
- 不自行移动阶段三方向到 `passed/`，该动作只由规划终态复核后执行。

## 5. 全文同步与反向审计要求

同步必须覆盖当前状态全文，而不是只改标题或首段。回执至少证明：

1. 所有当前入口中 P36 只呈现 `COMPLETED（待规划终态复核）`，不再出现 READY/VERIFYING/PASSED 作为当前值；
2. 33、✅30/🟦21/⬜39、870/agent346、104f/1025t、V38 在全部当前入口逐字一致；
3. P36 已核销且 M05-F02-01 为 ✅，P3 明确保持未核销；
4. 当前活动功能、候选列表、下一动作和新会话提示中没有 P36 执行/补证/验收残留；
5. 主方向已在 `passed/`，阶段三方向仍在 `ready/`；
6. 历史中的 READY/VERIFYING/PASSED 和旧基线保留在明确历史语境中，没有被误删；
7. `memory/` 每个短文件及总量满足上限。

## 6. 回执证据包

阶段三回执必须包含：

- 唯一值清单逐项“目标值 → 实际文件/位置 → 实际值 → 一致性”矩阵；
- 实际触碰文件清单；
- 清单 M05-F02-01 变更与 P36/P3 需求池变更明细；
- 当前入口正向唯一值命中和旧当前值反向零残留的可复现全文统计；
- memory 各文件压缩前后字节数、保留摘要、移除范围及总字节数；
- 历史文件未被覆盖或删除的证据；
- 提交前自检矩阵。

## 7. 合法执行终态

- 全部清单值机械落盘并提交回执：`TERMINAL_SYNC_SUBMITTED`；
- 权威材料与清单冲突且无法在本方向内裁决：按机器契约如实 `BLOCKED`。

不得使用 `EXECUTION_SUBMITTED`、功能 `PASSED` 或 `COMPLETED` 作为本阶段执行任务终态。

## 8. 回执位置

`product/notify-template-management/receipts/terminal-sync-receipt.md`
