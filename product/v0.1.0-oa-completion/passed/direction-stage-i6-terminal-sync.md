# P60 I6「通知与版本收口」阶段三终态同步方向

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-15  
> 前置裁决：`../receipts/planning-review-stage-i6-notification-version-closure-07-owner-deferral-passed.md`  
> 当前指针：终态同步回执01已由`../receipts/planning-final-review-terminal-sync-stage-i6-v0.0.3-oa-iteration-01-passed.md`复核通过；当前入口为`../ready/direction-stage-i6-final-confirmed-state-projection.md`。  
> 阶段状态：`COMPLETED（规划已确认，2026-09-15）`  
> 任务等级：XL阶段三机械同步

## 1. 唯一目标与边界

只把I6功能级`PASSED`机械同步为`COMPLETED（待规划确认，2026-09-15）`，回读当前候选身份并提交终态同步回执。不得修改业务实现、重跑L1—L37、执行五渠道真实调用、核销开放P编号或提前把P60写成`PASSED/COMPLETED`。

R8固定表述为：SMS、EMAIL、FEISHU、DINGTALK、WECHAT_WORK均为`Owner延期 / 未验证`，已转`todo/i6-external-notification-channels-real-verification.md`（P2）。

## 2. 唯一终态值清单

| 字段 | 唯一授权值 |
|---|---|
| P60功能状态 | `IN_PROGRESS` |
| I1 | `COMPLETED（规划已确认，2026-09-09）` |
| I2 | `COMPLETED（规划已确认，2026-09-10）` |
| I3 | `COMPLETED（规划已确认，2026-09-12）` |
| I4 | `COMPLETED（规划已确认，2026-09-13）` |
| I5 | `COMPLETED（规划已确认，2026-09-14）` |
| I6阶段状态 | `COMPLETED（待规划确认，2026-09-15）` |
| I6功能级验收 | `planning-review-stage-i6-notification-version-closure-07-owner-deferral-passed.md` |
| 正式完成功能数 | 44，不增加 |
| 90条清单 | ✅46 / 🟦22 / ⬜22 |
| ADV | 64条，保持规划映射现状，不计入90条 |
| P编号 | P60、P31、P37、P38、P39及其他开放编号保持现状，本阶段不核销 |
| R8例外 | 五渠道=`Owner延期 / 未验证`，P2待办已登记 |
| 活动主功能 | P60 `v0.1.0-oa-completion` |
| 当前唯一动作 | I6阶段三状态同步与候选只读核对 |
| 同步后唯一下一动作 | 等待Planner终态复核；确认I6`COMPLETED`后启动P60整体14条标准独立复核 |
| P60主方向 | `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md` |
| I6主方向 | `product/v0.1.0-oa-completion/passed/direction-stage-i6-notification-version-closure.md` |
| I6终态同步方向 | `product/v0.1.0-oa-completion/ready/direction-stage-i6-terminal-sync.md` |
| 标签与Release | 不创建、不发布 |

以上值由Planner唯一确定，Executor不得重新计算、选择或改写。

## 3. 锁定验证基线集合

只同步引用，不重新运行：

- I6 L1—L37全部锁定，最新行为裁决见规划审查06与审查07。
- Server：1361 tests、0 failures、0 errors、0 skipped，`BUILD SUCCESS`。
- Web：1185 passed / 3 skipped，typecheck、lint、test、build均通过。
- Flyway：H2与PostgreSQL终点V92。
- R3—R5：正式流程使用可见交互式浏览器、`headless=false`，17个PNG/WebP制品可回读。
- R7：三仓DIRTY内容候选已由文件清单和内容指纹固定；manifest SHA-256=`3942311b2d2712e490a011594102183ee2806abb11eefc46c0bb449ba16e716f`。
- R8：没有真实外部行为证据，只按Owner裁决延期，不纳入通过基线。

若只读核对发现候选文件集合、内容指纹或方向归档状态与回执06/审查07不一致，停止同步并回传精确差异；不得自行接受漂移候选。

## 4. 同步范围与验证

Executor按实际结构同步：

1. `knowledge/current-status.md`、会话交接和P60功能索引；
2. 正式功能清单、`todo/v0.1.0-oa-plan.md`、`todo/requirement-pool.md`及P2外部渠道待办指针；
3. `memory/state.md`、`memory/features.md`、`memory/handoff.md`及其他存在旧当前口径的短记忆；
4. P60主方向、I6已归档主方向、功能级PASSED记录与本方向的当前指针。

只运行状态、路径、计数、候选指纹和memory限额检查，不运行工程测试。同步后`memory/`每个短文件`<5KB`、总量`<20KB`。历史回执保留，不把例外写成真实通过。

## 5. Git与发布边界

本方向不授权commit、push、tag、Release、合并、rebase、强推或历史改写。只读记录Workspace、Server、Web的仓库根、分支、HEAD、upstream、工作树状态和R7内容指纹一致性；不得清理或覆盖既有脏文件。后续如需发布，由Owner另行确认远程、分支、精确范围与风险。

## 6. 回执与合法终态

终态同步回执写入：

`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i6-v0.0.3-oa-iteration-01.md`

合法提交状态为P60=`IN_PROGRESS`、I6=`COMPLETED（待规划确认，2026-09-15）`、机器`TERMINAL_SYNC_SUBMITTED`。回执必须包含唯一值逐入口回读、memory压缩前后字节数、路径/计数核对、三仓只读候选结果、R7指纹复算、未执行Git发布动作及terminal Validator结果。
