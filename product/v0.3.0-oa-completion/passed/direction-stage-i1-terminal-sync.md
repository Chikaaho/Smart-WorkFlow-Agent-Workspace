# P60 I1「组织与权限底座」终态同步方向

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-09  
> 前置裁决：`../receipts/planning-review-stage-i1-v0.3.0-oa-completion-04-passed.md`  
> 阶段状态：`PASSED`，待终态同步与规划复核

## 1. 同步目标与边界

本轮只完成 I1 阶段终态同步，以及各独立仓库的 I1 变更提交、当前分支推送和远端 SHA 回读；不修改业务实现，不重跑已锁定测试或行为场景，不开始 I2。

Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web 是三个独立 Git 仓库。每个仓库分别读取并记录自己的当前分支，只把本仓 I1 范围提交并推送到该当前分支；不在规划文档中假定三个仓库使用相同分支名。

## 2. 唯一终态值

| 字段 | 唯一授权值 |
|---|---|
| P60 功能状态 | `IN_PROGRESS` |
| I1 阶段状态 | `COMPLETED（待规划确认，2026-09-09）` |
| I1 阶段验收 | `planning-review-stage-i1-v0.3.0-oa-completion-04-passed.md` |
| ADV 清单同步 | `PASSED` |
| 正式完成功能数 | 44，不增加 |
| 既有 90 条清单计数 | ✅46 / 🟦22 / ⬜22 |
| P 编号 | P60 及 P2/P4/P26/P31/P34/P35/P37/P38/P39 均保持现状，不因 I1 单阶段完成而核销 |
| 活动主功能 | P60 `v0.3.0-oa-completion` |
| 当前阶段动作 | I1 终态同步、独立仓库当前分支提交推送与远端回读 |
| 同步后下一动作 | 等待 Planner 终态复核；确认 I1 `COMPLETED` 后进入 I2 |
| I2 状态 | 未开始 |
| 主方向 | `product/v0.3.0-oa-completion/ready/direction-v0.3.0-oa-completion.md` |
| I1 终态同步方向 | `product/v0.3.0-oa-completion/ready/direction-stage-i1-terminal-sync.md` |
| 标签与 Release | 不创建、不发布 |

## 3. 锁定验证基线

以下只同步，不重新运行：

- Server：12 模块，1223 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS；
- Web：126 files passed + 1 skipped，1176 tests passed + 3 skipped，typecheck/lint/test/build exit=0；
- I1 行为：用户、角色、部门、岗位、负责人管理，三类身份与非零租户，权限即时收敛与 fail-secure，四类流程参与人解析，历史身份快照冻结均 PASSED；
- 证据封装：`evidence/i1-03/` 18 项 SHA256 回读通过，I1 回执 04 终态 Validator exit=0。

## 4. 必须同步的当前入口

Executor 按实际文件结构机械同步：

1. `knowledge/current-status.md`、`knowledge/session-handoff.md`；
2. `knowledge/features/v0.3.0-oa-completion.md` 及本阶段实际关联索引；
3. 正式功能清单与 `todo/requirement-pool.md` 中的 P60 当前阶段指针，计数和 P 编号保持 §2 唯一值；
4. `memory/state.md`、`memory/features.md`、`memory/handoff.md`、`memory/README.md` 及确需清除旧当前口径的短记忆文件；
5. P60 product 方向、I1 回执、规划验收和本终态同步方向的当前指针。

同步后 memory 每个短文件 `<5KB`、总量 `<20KB`。历史回执与历史时点原文保留，不把 I1 `COMPLETED` 写成 P60 `COMPLETED`。

## 5. 独立仓库提交与推送

对 Workspace、Server、Web 分别执行：

- 读取仓库根、当前分支、HEAD、remote、upstream 和工作树；
- 只暂存本仓 I1 变更，保留无关存量与用户改动；
- 提交信息遵循 Angular/Conventional Commits，主题使用中文；
- 推送到该仓库执行时的当前分支；
- 回读该远端分支完整 SHA，并证明本地阶段提交已经包含在远端；
- 不制造空提交，不强推、不改写历史、不删除远端分支。

## 6. 回执与合法终态

执行回执：

`product/v0.3.0-oa-completion/receipts/terminal-sync-stage-i1-v0.3.0-oa-completion-01.md`

回执至少给出：唯一终态值的实际同步位置、memory 体积、三个独立仓库各自的当前分支/提交 SHA/远端 SHA/push 结果、未提交残留归属，以及现行机器终态 Validator 原始结果。

Executor 合法提交状态为：阶段 `COMPLETED（待规划确认）`，P60 `IN_PROGRESS`，机器状态 `TERMINAL_SYNC_SUBMITTED`，`remaining_actionable_count=0`，下一动作 `WAIT_PLANNER`。Planner 复核前不得写“规划已确认”，不得开始 I2。
