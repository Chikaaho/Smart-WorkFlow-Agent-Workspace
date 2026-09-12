# P60 I3「人工审批与自研流程设计器」终态同步方向

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-12  
> 前置裁决：`../receipts/planning-review-stage-i3-v0.1.0-oa-completion-08-passed.md`  
> 阶段状态：`COMPLETED（规划已确认，2026-09-12）`

## 1. 同步目标与边界

本轮只完成I3阶段终态同步，以及Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web三个独立仓库的I3归属提交、各自当前分支推送和远端SHA回读；不修改业务实现，不重跑已锁定测试或行为场景，不开始I4。

只提交可由I3回执、冻结候选和task-owned对账证明归属的文件。工作树中的既有无关改动继续保留，不得一并提交、清理、reset或覆盖。Server修复提交`c18d074`已被执行回执声明为推送完成，仍须只读回读其当前分支和远端包含关系；无新增归属变化的仓库不得制造空提交。

## 2. 唯一终态值清单（执行时授权值，历史）

下表保留 Executor 执行终态同步时的精确授权值；Planner 最终确认后的当前状态与归档位置以 §7 为准。

| 字段 | 唯一授权值 |
|---|---|
| P60功能状态 | `IN_PROGRESS` |
| I1阶段状态 | `COMPLETED（规划已确认，2026-09-09）` |
| I2阶段状态 | `COMPLETED（规划已确认，2026-09-10）` |
| I3阶段状态 | `COMPLETED（待规划确认，2026-09-12）` |
| I3功能级验收 | `planning-review-stage-i3-v0.1.0-oa-completion-08-passed.md` |
| I4—I6状态 | 未开始 |
| 正式完成功能数 | 44，不增加 |
| 既有90条清单计数 | ✅46 / 🟦22 / ⬜22 |
| ADV 64条 | 保持规划映射现状，不计入上述90条 |
| P编号 | P60、P4、P34、P35、P47及其他开放P编号全部保持现状，本阶段不核销 |
| 里程碑/明细ID | 仅迭代阶段I3进入待确认完成；正式P/M/I编号集合及90条明细不增删、不核销 |
| 活动主功能 | P60 `v0.1.0-oa-completion` |
| 当前唯一动作 | I3终态同步、三个独立仓库当前分支的归属提交/推送/远端回读 |
| 同步后唯一下一动作 | 等待Planner终态复核；确认I3 `COMPLETED`后再形成I4正式阶段方向 |
| P60主方向 | `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md` |
| I3主方向 | `product/v0.1.0-oa-completion/passed/direction-stage-i3-manual-approval-first-party-process-designer.md` |
| I3终态同步方向 | `product/v0.1.0-oa-completion/ready/direction-stage-i3-terminal-sync.md`（执行时路径；最终归档见 §7） |
| 标签与Release | 不创建、不发布 |

以上值由规划角色唯一确定。执行层不得重新计算、选择或解释成其他值。

## 3. 锁定验证基线集合

以下集合只同步引用，不重新运行：

- 候选：Server `c18d074`，运行时JAR sha256 `74926960ff615681f3064e4061e3622480e8e56fdcfce94caf2d0f12738c73ad`，frozen-f；回执09为同JAR会话重启、零代码变化。
- Server：`sw-bpm-process` 186/0、`sw-bootstrap` 43/0；全量实际exit 1，6例仅位于IoT `JavaSubprocessSandboxTest`，基线`f7101c8`同机Windows/JDK21复跑同为6/7失败，作为I3非回归事实如实保留。
- Web：typecheck、lint、test、build四门实际exit均为0；I3最终候选无后续Web代码变化。
- 行为：规划验收05—08锁定的R0—R10全部原子，包括自研设计/查看、版本、人工动作、会签与生命周期、调度通知、节点函数、意见表单、权限及页面链。
- 页面：`evidence/i3-08/R9c/`的7张真实页面/深链证据及身份、URL、DOM摘要。
- 最终原子：`evidence/i3-09/R8c/`的24条原始流、真实RETURN四步历史、实例APPROVED/PENDING=0、主表单零反写。
- 封装：`evidence/i3-09/R10/manifest.json` 13项，Planner独立复算bad=0；terminal payload sha256 `bec34c67f4aa8095551fe65431faa4c6bdf4be9fa883b98a50b9a2abe5675c42`，Validator exit0，最终监听清理为0。

若同步前只读候选核对发现I3代码、冻结JAR或上述锁定附件在验收08后发生变化，停止提交并回传精确差异；不得自行把新快照冒充锁定基线。

## 4. 必须同步的当前入口

Executor按实际文件结构机械同步：

1. `knowledge/current-status.md`、`knowledge/session-handoff.md`；
2. `knowledge/features/v0.1.0-oa-completion.md`及本阶段实际关联索引；
3. 正式功能清单、`todo/v0.1.0-oa-plan.md`、`todo/requirement-pool.md`的P60/I3当前指针；
4. `memory/state.md`、`memory/features.md`、`memory/handoff.md`、`memory/README.md`及确需清除旧当前口径的短记忆文件；
5. P60主方向、I3主方向、验收08与本终态同步方向的当前指针。

同步后`memory/`每个短文件`<5KB`、总量`<20KB`。历史回执和旧时点原文保留，不把I3 `COMPLETED`写成P60 `COMPLETED`，不提前写“规划已确认”。

## 5. 三仓提交、推送与回读

对Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web分别：

- 读取仓库根、当前分支、HEAD、remote、upstream和工作树；
- 只暂存I3归属文件及本终态同步直接要求的治理状态文件；
- 提交信息遵循Angular/Conventional Commits并使用中文主题；无本仓I3变化时不得制造空提交；
- 推送到执行时当前分支，不强推、不改写历史、不删除远端分支；
- fetch/ls-remote回读远端完整SHA，证明本地I3提交已包含在对应远端分支；
- 保存staged/commit文件清单并与task-owned清单逐项比较，排除无关存量。

Server `c18d074`、Web既有I3提交若已位于远端当前分支，只记录包含关系；终态同步不得为追求“三仓都有新SHA”而创建空提交。

## 6. 回执、证据与合法终态

执行回执：

`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i3-v0.1.0-oa-completion-01.md`

回执至少提供：唯一终态值的实际同步位置与全文回读、memory压缩前后字节数、三仓当前分支/提交SHA/远端SHA/push结果、逐仓提交文件与task-owned对账、未提交残留归属，以及现行terminal Validator的input/stdout/stderr/exit、末行逐字节比较和manifest回读。

Executor合法提交状态为：I3 `COMPLETED（待规划确认，2026-09-12）`，P60 `IN_PROGRESS`，机器状态`TERMINAL_SYNC_SUBMITTED`，`remaining_actionable_count=0`，下一动作`WAIT_PLANNER`。Planner复核前不得写“规划已确认”，不得开始I4。

## 7. 最终复核状态

终态同步回执 02 经 `../receipts/planning-final-review-terminal-sync-stage-i3-v0.1.0-oa-completion-02-passed.md` 最终复核通过。Workspace 实际远端终点为 `a2267da02306082852fafbf5539b8a33caed230e`；八提交连续链、`A..tip` 36 项限定附件范围、Server 授权临时副本清理、Server/Web 远端 SHA、terminal 与 33 项 manifest 均已核销。

I3 正式为 `COMPLETED（规划已确认，2026-09-12）`，本方向归档至 `passed/`。P60 继续 `IN_PROGRESS`，P47 等开放编号不核销；下一动作由 Planner 形成 I4「编排、流程运营与工作台」正式阶段方向，在方向下发前不得直接开始 I4 实现。
