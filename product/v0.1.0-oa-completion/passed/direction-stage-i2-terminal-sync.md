# P60 I2「低代码表单收口」终态同步方向

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-10  
> 前置裁决：`../receipts/planning-review-stage-i2-v0.1.0-oa-completion-06-passed.md`  
> 阶段状态：`COMPLETED（规划已确认，2026-09-10）`

## 1. 同步目标与边界

本轮只完成 I2 阶段终态同步，以及 Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web 三个独立仓库的 I2 变更提交、各自当前分支推送和远端 SHA 回读；不修改业务实现，不重跑已锁定测试或行为场景，不开始 I3。

只提交可由 I2 回执、候选状态和 task-owned crosscheck 证明归属的文件。工作树中的既有无关改动、历史删除、上传文件或其他功能内容继续保留，不得借终态同步一并提交、清理、reset 或覆盖。

## 2. 唯一终态值清单（执行时授权值，历史）

下表保留 Executor 阶段三执行时的精确授权值；Planner 最终确认后的当前状态与归档位置以 §7 为准。

| 字段 | 唯一授权值 |
|---|---|
| P60 功能状态 | `IN_PROGRESS` |
| I1 阶段状态 | `COMPLETED（规划已确认，2026-09-09）` |
| I2 阶段状态 | `COMPLETED（待规划确认，2026-09-10）` |
| I2 阶段验收 | `planning-review-stage-i2-v0.1.0-oa-completion-06-passed.md` |
| I3—I6 状态 | 未开始 |
| 正式完成功能数 | 44，不增加 |
| 既有 90 条清单计数 | ✅46 / 🟦22 / ⬜22 |
| ADV 64 条 | 保持规划映射现状，不因 I2 阶段完成计入上述 90 条或核销 |
| P 编号 | P60 及 P2/P4/P26/P31/P34/P35/P37/P38/P39 等关联开放编号全部保持现状，不因 I2 单阶段完成而核销 |
| 里程碑/明细 ID | 仅 I2 内部阶段进入待确认完成；不新增、不核销正式 P/M/I 编号或 90 条明细 |
| 活动主功能 | P60 `v0.1.0-oa-completion` |
| 当前阶段动作 | I2 终态同步、三个独立仓库当前分支提交推送与远端回读 |
| 同步后唯一下一动作 | 等待 Planner 终态复核；确认 I2 `COMPLETED` 后再规划 I3 |
| P60 主方向 | `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md` |
| I2 主方向 | `product/v0.1.0-oa-completion/passed/direction-stage-i2-low-code-form-closure.md` |
| I2 终态同步方向 | `product/v0.1.0-oa-completion/ready/direction-stage-i2-terminal-sync.md`（执行时路径；最终归档见 §7） |
| 标签与 Release | 不创建、不发布 |

## 3. 锁定验证基线集合

以下基线只同步引用，不重新运行：

- Server：回执 05 最终候选的表单模块 compile、Bootstrap package、Server `MAVEN_OPTS='-Xmx2g' mvn -q test` 均 exit 0；原始流在 `evidence/i2-05/e0b3/affected-gates-*`。
- Web：回执 02 的 typecheck/lint/test/build 均 exit 0；测试为 126 files passed + 1 skipped、1179 tests passed + 3 skipped；后续候选未修改 Web。
- 迁移：I2 回执 02 锁定 H2 69 条、PostgreSQL 68 条迁移链；后续无迁移改动反证。
- I2 行为：规划验收 02—06 已锁定的组件、公式、外部数据、生命周期、列表、五类身份权限、跨租户、PC/移动、撤权与版本历史全链。
- 封装：`i2-05` 102 项 manifest 与 `i2-06` 24 项 manifest 均由 Planner 独立回读通过；回执 06 terminal 末行 cmp=0、Validator exit 0。

若同步前只读候选核对发现 I2 代码或上述锁定附件在回执 06 后发生变化，停止提交并回传精确差异；不得自行把新快照冒充已锁定基线。

## 4. 必须同步的当前入口

Executor 按实际文件结构机械同步：

1. `knowledge/current-status.md`、`knowledge/session-handoff.md`；
2. `knowledge/features/v0.1.0-oa-completion.md` 及本阶段实际关联索引；
3. 正式功能清单与 `todo/requirement-pool.md` 的 P60/I2 当前阶段指针，计数和 P 编号保持 §2 唯一值；
4. `memory/state.md`、`memory/features.md`、`memory/handoff.md`、`memory/README.md` 及确需清除旧当前口径的短记忆文件；
5. P60 主方向、I2 主方向、验收 06 与本终态同步方向的当前指针。

同步后 `memory/` 每个短文件 `<5KB`、总量 `<20KB`。历史回执和旧时点原文保留，不把 I2 `COMPLETED` 写成 P60 `COMPLETED`，不提前写“规划已确认”。

## 5. 三仓提交、推送与回读

对 Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web 分别：

- 读取并记录仓库根、当前分支、HEAD、remote、upstream 和工作树；
- 只暂存本仓 I2 归属文件以及本终态同步直接要求的治理状态文件；
- 提交信息遵循 Angular/Conventional Commits，主题使用中文；无本仓 I2 变化时不得制造空提交；
- 推送到该仓库执行时的当前分支，不强推、不改写历史、不删除远端分支；
- fetch/ls-remote 回读远端完整 SHA，证明本地 I2 阶段提交已包含在对应远端分支；
- 保存 staged/commit 文件清单，并与 task-owned 清单逐项比较，排除无关存量。

## 6. 回执、证据与合法终态

执行回执：

`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i2-v0.1.0-oa-completion-01.md`

回执至少提供：唯一终态值的实际同步位置与全文回读、memory 压缩前后字节数、三仓各自当前分支/提交 SHA/远端 SHA/push 结果、逐仓提交文件与 task-owned 对账、未提交残留归属，以及现行 terminal Validator 的 input/stdout/stderr/exit、末行逐字节 cmp 和 manifest 回读。

Executor 合法提交状态为：I2 `COMPLETED（待规划确认，2026-09-10）`，P60 `IN_PROGRESS`，机器状态 `TERMINAL_SYNC_SUBMITTED`，`remaining_actionable_count=0`，下一动作 `WAIT_PLANNER`。Planner 复核前不得写“规划已确认”，不得开始 I3。

## 7. 最终复核状态

终态同步回执 02 经 `../receipts/planning-final-review-terminal-sync-stage-i2-v0.1.0-oa-completion-02-passed.md` 最终复核通过。Workspace 实际远端终点为 `afec348d020420a013818e9a2ed7a8150ae4e075`；六提交连续链、1011 项聚合集合与归属矩阵、Server/Web 远端 SHA、terminal 及 manifest 均已核销。

I2 正式为 `COMPLETED（规划已确认，2026-09-10）`，本方向归档至 `passed/`。下一动作由 Planner 形成 I3「人工审批能力」正式阶段方向；在方向下发前不得直接开始 I3 实现。
