# P60 I5「租户安全与三方 SSO」终态同步方向

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-14  
> 前置裁决：`../receipts/planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md`  
> 当前指针：终态同步回执 `../receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md` 已提交（机器状态 `TERMINAL_SYNC_SUBMITTED`），I5 写为 `COMPLETED（待规划确认，2026-09-14）`；执行侧动作已闭合，等待 Planner 终态复核。本方向在 Planner 复核通过后由 Planner 移入 `passed/`。  
> 阶段状态：`COMPLETED（待规划确认，2026-09-14）`，待规划终态复核  

## 1. 唯一目标与边界

本轮只把 I5 功能级 `PASSED` 机械同步为 `COMPLETED（待规划确认，2026-09-14）`，整理并提交 I5 task-owned 变化，核对最终候选；不修改业务实现，不重跑已锁定测试，不发起真实 Provider 调用，不开始 I6。

真实 WECOM/FEISHU/DINGTALK 成功链的固定表述为“Owner 延期免验、当前未验证”。禁止写成真实通过、沙箱通过或外部联调完成。小程序继续冻结。

## 2. 唯一终态值清单

| 字段 | 唯一授权值 |
|---|---|
| P60 功能状态 | `IN_PROGRESS` |
| I1 阶段状态 | `COMPLETED（规划已确认，2026-09-09）` |
| I2 阶段状态 | `COMPLETED（规划已确认，2026-09-10）` |
| I3 阶段状态 | `COMPLETED（规划已确认，2026-09-12）` |
| I4 阶段状态 | `COMPLETED（规划已确认，2026-09-13）` |
| I5 阶段状态 | `COMPLETED（待规划确认，2026-09-14）` |
| I5 功能级验收 | `planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md` |
| I6 状态 | 未开始 |
| 正式完成功能数 | 44，不增加 |
| 既有 90 条清单计数 | ✅46 / 🟦22 / ⬜22 |
| ADV 64 条 | 保持规划映射现状，不计入上述 90 条 |
| P 编号 | P60、P31及其他开放 P 编号全部保持现状，本阶段不核销 |
| 里程碑/明细 ID | 仅内部阶段 I5 进入待确认完成；正式 P/M/I 编号集合及 90 条明细不增删、不核销 |
| 验证例外 | WECOM/FEISHU/DINGTALK 真实成功链=`Owner 延期免验 / 未验证` |
| 活动主功能 | P60 `v0.1.0-oa-completion` |
| 当前唯一动作 | I5 终态同步、task-owned 提交、候选与远端状态回读 |
| 同步后唯一下一动作 | 等待 Planner 终态复核；确认 I5 `COMPLETED` 后形成 I6 通知与版本收口正式方向 |
| P60 主方向 | `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md` |
| I5 主方向 | `product/v0.1.0-oa-completion/passed/direction-stage-i5-tenant-safe-third-party-sso.md` |
| I5 终态同步方向 | `product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md` |
| 标签与 Release | 不创建、不发布 |

以上值由 Planner 唯一确定，Executor 不得重新计算、选择或解释成其他值。

## 3. 锁定验证基线集合

只同步引用，不重新运行：

- Server 最终候选工作树：`486b1116eb6016024c8e1e4a00b50244af2f3cb5`；iteration-11 记录 HEAD=`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`。
- Web：iteration-10/11 均为零修改，记录 HEAD=`5788ead33c4347214a350d124331237e85068bdf`；I5 既有 Web 交付证据沿用审查 01—09 锁定结果。
- I5 最终门禁：Server 受影响模块 766/0、Web typecheck/lint/test/build exit 0；后续飞书修复聚焦 22/0及 system-biz 295/0。
- 数据与运行：H2 86、PostgreSQL 85 条迁移终点 V86；非零租户 OA 全链、生产匿名矩阵、SSO state/绑定/会话/审计、同秒 jti 撤销隔离均由审查 02—09锁定。
- 文档级交付：审查 10—11锁定三 Provider 官方文档对照、飞书授权参数修复、安全配置占位、Owner 手册、零秘密扫描及五类对象 manifest。
- 外部例外：三 Provider 真实成功链没有行为证据，按 Owner 2026-09-14 明确裁决延期免验。

若只读核对发现 Server 候选、I5 task-owned 文件或证据对象在审查 11 后发生漂移，停止提交并回传精确差异；不得自行接受新候选。

## 4. 必须同步的当前入口

Executor 按实际文件结构同步：

1. `knowledge/current-status.md`、`knowledge/session-handoff.md`；
2. `knowledge/features/v0.1.0-oa-completion.md`及实际关联索引；
3. 正式功能清单、`todo/v0.1.0-oa-plan.md`、`todo/requirement-pool.md`；
4. `memory/state.md`、`memory/features.md`、`memory/handoff.md`、`memory/README.md`及确需清除旧当前口径的短记忆文件；
5. P60 主方向、I5 已归档主方向、功能级 PASSED 记录与本终态同步方向的当前指针。

同步后 `memory/` 每个短文件 `<5KB`、总量 `<20KB`。历史回执原文保留；不得把 I5 阶段完成写成 P60 完成，也不得提前写“规划已确认”。

## 5. Git 与发布门禁

分别只读核对 Workspace、Server、Web 的仓库根、当前分支、HEAD、upstream、远端和工作树；仅暂存 I5 task-owned 实现/测试/迁移/文档，以及本终态同步授权的治理状态文件。既有无关改动不得提交、清理、reset 或覆盖；无归属变化的仓库不得制造空提交。

允许按 Conventional Commits 创建本地归属提交。**远程推送仍须 Owner 对具体远端、分支和范围明确授权**；授权前只能保存待推送提交与只读远端状态，不得 push。拟议范围固定为各仓当前 upstream 分支上的 I5 task-owned 提交；禁止强推、历史改写、标签或 Release。

## 6. 回执与合法终态

首次回执写入：

`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`

回执至少包含唯一值逐入口回读、memory 压缩前后字节数、三仓 task-owned 文件清单、候选核对、分支/HEAD/upstream/远端状态、本地提交结果、推送授权及实际结果、terminal Validator 和 manifest。

完整阶段同步的合法提交状态为 I5 `COMPLETED（待规划确认，2026-09-14）`、P60 `IN_PROGRESS`、机器 `TERMINAL_SYNC_SUBMITTED`、`remaining_actionable_count=0`、下一动作 `WAIT_PLANNER`。若唯一未完成动作是尚未获得远程推送授权，必须如实保持未完成并列出精确远端/分支/提交范围，不得冒充终态同步完成。
