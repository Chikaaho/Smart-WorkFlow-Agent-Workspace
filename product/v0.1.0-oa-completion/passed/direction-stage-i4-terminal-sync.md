# P60 I4「编排、流程运营与工作台」终态同步方向

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-13  
> 前置裁决：`../receipts/planning-review-stage-i4-v0.0.3-oa-iteration-06-passed.md`  
> 阶段状态：`COMPLETED（规划已确认，2026-09-13）`

## 1. 同步目标与边界

本轮只完成 I4 阶段终态同步，以及 Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web 三个独立仓库的 I4 归属提交、各自当前分支推送和远端 SHA 回读；不修改业务实现，不重跑已锁定测试或行为场景，不开始 I5。

只提交可由 I4 回执、C4 候选和 task-owned 对账证明归属的文件。工作树中的既有无关改动继续保留，不得一并提交、清理、reset 或覆盖。无本仓 I4 归属变化时不得制造空提交。

## 2. 唯一终态值清单

| 字段 | 唯一授权值 |
|---|---|
| P60 功能状态 | `IN_PROGRESS` |
| I1 阶段状态 | `COMPLETED（规划已确认，2026-09-09）` |
| I2 阶段状态 | `COMPLETED（规划已确认，2026-09-10）` |
| I3 阶段状态 | `COMPLETED（规划已确认，2026-09-12）` |
| I4 阶段状态 | `COMPLETED（待规划确认，2026-09-13）` |
| I4 功能级验收 | `planning-review-stage-i4-v0.0.3-oa-iteration-06-passed.md` |
| I5—I6 状态 | 未开始 |
| 正式完成功能数 | 44，不增加 |
| 既有 90 条清单计数 | ✅46 / 🟦22 / ⬜22 |
| ADV 64 条 | 保持规划映射现状，不计入上述 90 条 |
| P 编号 | P60、P4、P34、P35、P47及其他开放 P 编号全部保持现状，本阶段不核销 |
| 里程碑/明细 ID | 仅迭代阶段 I4 进入待确认完成；正式 P/M/I 编号集合及 90 条明细不增删、不核销 |
| 活动主功能 | P60 `v0.1.0-oa-completion` |
| 当前唯一动作 | I4 终态同步、三个独立仓库当前分支的归属提交/推送/远端回读 |
| 同步后唯一下一动作 | 等待 Planner 终态复核；确认 I4 `COMPLETED` 后再形成 I5 SSO 正式阶段方向 |
| P60 主方向 | `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md` |
| I4 主方向 | `product/v0.1.0-oa-completion/passed/direction-stage-i4-orchestration-process-operations-workbench.md` |
| I4 终态同步方向 | `product/v0.1.0-oa-completion/ready/direction-stage-i4-terminal-sync.md` |
| 标签与 Release | 不创建、不发布 |

以上值由规划角色唯一确定。执行层不得重新计算、选择或解释成其他值。

## 3. 锁定验证基线集合

以下集合只同步引用，不重新运行：

- 候选 C4：Server HEAD `c18d074f4c9f85c5baf65af222e159437fb1e509`；Web HEAD `192e0647a8f1b1e2b270d4ea13e87854b247fcc7`；I4 工作树候选由 `evidence/i4-06/R6/manifest.sha256` 的 184 项共同绑定，其中 `MobileWorkspace.vue` sha256=`2cd736952969e0c9d52cf509e4a21e5d7db03c7ad370d2feb2910ddad4fea500`。
- Server：验收 05 锁定受影响全集 523/0，其中 bpm-process 205、system 266、openapi 6、bootstrap 46；H2 Flyway 15/15、PostgreSQL Flyway 12/12；I4 tenant isolation PostgreSQL 2/2；R1 PostgreSQL service-entry 2/2。
- Web：lint/typecheck/test/build 均 exit 0，128 个测试文件，1183 passed + 3 skipped。
- 行为：规划验收 03—06 锁定的 R1—R6 与正式方向十二项标准，包括动态并行、模板、监控干预、分析、批量、交接、开放接口、完整工作台和响应式 H5 同对象闭环。
- R5 最终原子：BK `0f870b17-d72a-4209-9912-22de59733fba`、PI/T `7c6468…` 同对象链，附件绑定、owner 200、authenticated outsider 403、最终结果 APPROVED，`asserts-final.json` 17/0。
- 封装：i4-06 manifest 184 项且 bad/missing=0；terminal evidence 18 条且 missing=0；assert 与 terminal validator 均 exit 0。

若同步前只读候选核对发现 I4 代码或锁定附件在验收 06 后发生变化，停止提交并回传精确差异；不得自行把新快照冒充锁定基线。

## 4. 必须同步的当前入口

Executor 按实际文件结构机械同步：

1. `knowledge/current-status.md`、`knowledge/session-handoff.md`；
2. `knowledge/features/v0.1.0-oa-completion.md`及本阶段实际关联索引；
3. 正式功能清单、`todo/v0.1.0-oa-plan.md`、`todo/requirement-pool.md`的 P60/I4 当前指针；
4. `memory/state.md`、`memory/features.md`、`memory/handoff.md`、`memory/README.md`及确需清除旧当前口径的短记忆文件；
5. P60 主方向、I4 主方向、验收 06 与本终态同步方向的当前指针。

同步后 `memory/` 每个短文件 `<5KB`、总量 `<20KB`。历史回执和旧时点原文保留，不把 I4 `COMPLETED` 写成 P60 `COMPLETED`，不提前写“规划已确认”。

## 5. 三仓提交、推送与回读

对 Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web 分别读取仓库根、当前分支、HEAD、remote、upstream和工作树；仅暂存 I4 归属文件及本终态同步直接要求的治理状态文件；按 Angular/Conventional Commits 使用中文主题提交；推送执行时当前分支并回读远端完整 SHA，证明本地 I4 提交已被对应远端分支包含。禁止强推、改写历史、删除远端分支或夹带无关存量。

回执必须保存逐仓 staged/commit 文件清单与 task-owned 对账。Server/Web 既有提交若已位于远端当前分支，只记录包含关系，不为追求三仓新 SHA 创建空提交。

## 6. 回执、证据与合法终态

首次执行回执：

`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i4-v0.0.3-oa-iteration-01.md`

回执至少提供：唯一终态值的实际同步位置与全文回读、memory 压缩前后字节数、三仓当前分支/提交 SHA/远端 SHA/push 结果、逐仓提交文件与 task-owned 对账、未提交残留归属，以及现行 terminal Validator 的 input/stdout/stderr/exit、末行逐字节比较和 manifest 回读。

Executor 合法提交状态为：I4 `COMPLETED（待规划确认，2026-09-13）`，P60 `IN_PROGRESS`，机器状态 `TERMINAL_SYNC_SUBMITTED`，`remaining_actionable_count=0`，下一动作 `WAIT_PLANNER`。Planner 复核前不得写“规划已确认”，不得开始 I5。

## 7. 最终复核状态

终态同步回执01、三层状态对账回执02及一致性收敛回执03经 `../receipts/planning-final-review-terminal-sync-stage-i4-v0.0.3-oa-iteration-03-passed.md` 最终复核通过。I4正式为 `COMPLETED（规划已确认，2026-09-13）`，本方向归档至`passed/`。
