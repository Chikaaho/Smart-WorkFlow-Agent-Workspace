# I4 终态三层状态全量对账：修正前差异表（TS4-R1）

> 生成时点：2026-09-13；方向 `product/v0.1.0-oa-completion/ready/direction-stage-i4-status-reconciliation.md`；前置复核 `receipts/planning-review-terminal-sync-stage-i4-v0.0.3-oa-iteration-01.md`（TS4-R1 未通过）。
> 逐项状态矩阵另见 `matrix-90.tsv`（90 行）与 `matrix-summary.json`；正式功能链见 `feature-44.tsv`（44 行）。
> 本表只登记**实际发生修正**的差异；90 个明细键的状态双向一致（missing=0/conflict=0/orphan=0/duplicate=0），无需修正。

## A. 明细状态层（90 键）

| 项 | 结论 | 证据 |
|---|---|---|
| 工程《功能清单》M01—M10 稳定键 | 90 行；✅46 / 🟦22 / ⬜22 | `matrix-90.tsv` |
| knowledge 映射索引 §1 稳定键 | 90 行；✅46 / 🟦22 / ⬜22 | `matrix-90.tsv` |
| 双向差集 | missing=0、orphan=0、duplicate=0、conflict=0 | `matrix-summary.json` |
| 模块明细数 | M01 13、M02 7、M03 8、M04 10、M05 4、M06 4、M07 14、M08 13、M09 8、M10 9，合计 90；模块总览声明 55 功能/90 明细 | `matrix-summary.json` |
| ADV 规划项 | 64 行、64 唯一键、8 模块（8/9/8/8/8/7/8/8）、P1 40／P2 24、全部 ⬜；与 Mxx 键交集 0 | `matrix-summary.json` |
| 修正 | **无需修正**（两层逐项状态已一致） | — |

## B. 当前指针 / 版本 / 基线层（实际修正项）

| # | 文件 | 位置 | 修正前 | 修正后 | 权威依据 |
|---|---|---|---|---|---|
| B1 | `Smart-WorkFlow-aPaaS-server/功能清单.md` | 当前焦点 | `v0.3.0-oa-completion`；`I1 … COMPLETED（待规划确认，2026-09-09）`、终态同步复核 02 VERIFYING、唯一入口 `product/v0.3.0-oa-completion/receipts/planning-execution-prompt-v0.3.0-oa-completion-i1-terminal-sync-01.md`、下一动作=Planner 复核回执 03、`I2—I6 未开始`；基线 Server 1223 / Web 126 files 1176 / Flyway V67 | `v0.1.0-oa-completion`（成熟 OA 目标 `0.1.0`／当前迭代 `0.0.3`）；I1—I3 `COMPLETED（规划已确认）`、I4 功能级 PASSED＋`COMPLETED（待规划确认，2026-09-13）`、复核 01 `VERIFYING`、`I5—I6 未开始`；基线 Server 523（受影响五模块）/ Web 128 files 1183 passed＋3 skipped / Flyway 终点 V82；下一动作指向 `knowledge/current-status.md` | `knowledge/current-status.md`、`receipts/planning-review-terminal-sync-stage-i4-v0.0.3-oa-iteration-01.md`、`receipts/planning-review-stage-i4-v0.0.3-oa-iteration-06-passed.md` |
| B2 | `Smart-WorkFlow-aPaaS-server/功能清单.md` | 可见 ADV 注记 | `P60 v0.3.0-oa-completion 首次功能清单同步`；`未纳入 0.3.0 验收` | `P60 首次功能清单同步`＋明示“当时版本口径 `v0.3.0-oa-completion`，后经 Owner 更正为成熟 OA 目标 `0.1.0`”；`未纳入 0.1.0 路线验收` | 同上＋`planning-registration-correction-v0.1.0-01.md` |
| B3 | `Smart-WorkFlow-aPaaS-server/功能清单.md` | 注释块末行 | 与可见注记同事件的重复全文（含 `方向 READY（product/v0.3.0-oa-completion/ready/）`） | 收敛为单行历史事件记录，不再重复展开现行口径 | `direction-stage-i4-status-reconciliation.md` §3「清理…重复」 |
| B4 | `Smart-WorkFlow-aPaaS-server/功能清单.md` | ADV 章节抬头／计数规则／定义权威／模块汇总表头 | `P60 v0.3.0-oa-completion 首次功能清单同步`；`product/v0.3.0-oa-completion/ready/direction-v0.3.0-oa-completion.md`；`未纳入 0.3.0 P0 验收`；`product/v0.3.0-oa-completion/ready/advanced-capability-feature-checklist.md`；表头 `0.3.0 关系` | `P60 首次功能清单同步`＋历史口径注明；`product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md`；`未纳入 0.1.0 路线 P0 验收`；`product/v0.1.0-oa-completion/ready/advanced-capability-feature-checklist.md`；表头 `0.1.0 关系` | `knowledge/current-status.md`（主方向与规划清单实际路径） |
| B5 | `knowledge/current-status.md` | 后端正式基线 | `12 个模块汇总，1223 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS（I1 终态候选锁定）` | I4 候选 C4：受影响五模块 `523 tests / 0 / 0 / 0 BUILD SUCCESS`（bpm-process 205、system 266、openapi 6、bootstrap 46；含 FlywayFullChain H2 15/15、PG 12/12、I4TenantIsolationPostgres 2/2）；并注明全量仍受 I3 登记的 IoT `JavaSubprocessSandboxTest` 6 例影响 | `receipts/planning-review-stage-i4-v0.0.3-oa-iteration-06-passed.md` §3 |
| B6 | `knowledge/current-status.md` | 前端正式基线 | `Test Files 126 passed + 1 skipped；Tests 1176 passed + 3 skipped（I1 终态候选锁定）` | `128 个测试文件；Tests 1183 passed + 3 skipped`；typecheck/lint/test/build 四门 exit 0 | `receipts/evidence/i4-06/R6/gate-web-four-gates.txt` |
| B7 | `knowledge/current-status.md` | 迁移基线 | `H2 V67（67）/ PostgreSQL V67（66）` | `H2/PostgreSQL 同一迁移身份，终点 V82`（I4 新增 bpm V76—V79＋V82、openapi V80/V81） | `receipts/evidence/i4-02/MANIFEST.md`、`i4-06` 门禁 |
| B8 | `knowledge/current-status.md` | 产品行为基线 | `Owner Broker 真实双向 MQTT；19 个原子工作项…`（P21 时点） | I4 R1—R6 与十二项标准的真实行为/页面/HTTP/持久化证据（`evidence/i4-01/`—`i4-06/`，含同一对象 M 同对象链、附件 ATT 绑定与 owner 200／已认证 outsider 403） | `receipts/planning-review-stage-i4-v0.0.3-oa-iteration-06-passed.md` §2—§4 |
| B9 | `knowledge/current-status.md` | 验证基线变更集合 | 仅列 v0.0.2-oa 1156/V58 与单模块 43 计数为禁用旧值 | 增列禁用 `I1 时点 1223/V67`、`P4 时点 1128/V55` | 同上 |
| B10 | `knowledge/current-status.md` | 当前唯一下一动作 | 等待 Planner 终态复核回执 01 | Executor 执行三层全量对账并提交终态同步回执 02，等待 Planner 复核；不重验 I4、不激活 I5 | `direction-stage-i4-status-reconciliation.md` §1/§2/§5 |
| B11 | `knowledge/current-status.md` | 新会话启动提示词（上轮完成／当前状态／唯一下一动作／门禁基线） | 上轮=I4 终态同步；I4 机器状态 `TERMINAL_SYNC_SUBMITTED` 待复核；入口为 terminal-sync 方向；Web“vitest 1183”未含文件数 | 上轮=终态同步复核 01 `VERIFYING`；I4 `COMPLETED（待规划确认，2026-09-13）`、复核 01 `VERIFYING`；入口为 status-reconciliation 方向；Web 记为 128 files、1183 passed + 3 skipped | 同上 |
| B12 | `knowledge/current-status.md` | 快照行／业务功能状态行／终态与方向归档事实行 | `阶段三终态同步已执行，机器状态 TERMINAL_SYNC_SUBMITTED 待 Planner 终态复核`；唯一执行入口 `ready/direction-stage-i4-terminal-sync.md`；`终态同步合法状态 …/ TERMINAL_SYNC_SUBMITTED` | `三仓发布与 terminal 封装已锁定，终态同步复核 01 VERIFYING，待三层状态对账`；入口 `ready/direction-stage-i4-status-reconciliation.md` | `planning-review-terminal-sync-stage-i4-…-01.md` |
| B13 | `knowledge/current-status.md` | 变更类型记录 | 首条为 2026-09-13 终态同步 | 首条增补 2026-09-13 三层状态全量对账事件；原终态同步条目保留为历史 | 本方向 §5 |
| B14 | `knowledge/current-status.md` | 未关闭项入口 | `Smart-WorkFlow-Server/功能清单.md`（路径不存在） | `Smart-WorkFlow-aPaaS-server/功能清单.md` | `project.md` 仓储关系、实际仓库目录 |
| B15 | `knowledge/session-handoff.md` | 同步点头／当前任务状态／活动业务实现功能／唯一下一动作／关键事实／任务指针 | I4 机器状态 `TERMINAL_SYNC_SUBMITTED` 待 Planner 终态复核；入口 `ready/direction-stage-i4-terminal-sync.md`；下一动作=Planner 复核回执 01 | I4 `COMPLETED（待规划确认，2026-09-13）`、复核 01 `VERIFYING`；入口 `ready/direction-stage-i4-status-reconciliation.md`；下一动作=三层对账并提交回执 02 | 同上 |
| B16 | `knowledge/session-handoff.md` | 高级能力规划行、必读入口行 | `Smart-WorkFlow-Server/功能清单.md` | `Smart-WorkFlow-aPaaS-server/功能清单.md` | 同上 |
| B17 | `knowledge/features/v0.1.0-oa-completion.md` | 抬头／功能状态行／方向位置行／关键回执行 | 入口=terminal-sync 方向；I4 机器状态 `TERMINAL_SYNC_SUBMITTED` 待复核；I4 回执链止于回执 01 | 入口=status-reconciliation 方向；I4 复核 01 `VERIFYING`；回执链增列 `planning-review-terminal-sync-stage-i4-…-01.md` | 同上 |
| B18 | `knowledge/features/v0.1.0-oa-completion.md` | ADV 规划项行、首次清单同步历史行 | `Smart-WorkFlow-Server/功能清单.md` | `Smart-WorkFlow-aPaaS-server/功能清单.md`（并注明回执文件名为历史口径） | 同上 |
| B19 | `knowledge/features/v0.1.0-oa-completion.md` | 已执行动作（追加式） | 最新条目为 2026-09-13 终态同步 | 新增 2026-09-13 三层状态全量对账条目；原条目保留并补记复核 01 结论 | 本方向 |
| B20 | `knowledge/feature-reconciliation-index.md` | §0 高级能力规划项行 | `P60 v0.3.0-oa-completion 首次同步`；`Smart-WorkFlow-Server/功能清单.md`；`未纳入 0.3.0 验收`；权威 `product/v0.3.0-oa-completion/ready/advanced-capability-feature-checklist.md` | 版本口径更正为 `0.1.0`（保留历史口径说明）；`Smart-WorkFlow-aPaaS-server/功能清单.md`；`未纳入 0.1.0 路线验收`；权威 `product/v0.1.0-oa-completion/ready/advanced-capability-feature-checklist.md` | 同上 |
| B21 | `knowledge/feature-reconciliation-index.md` | §2 审计外新增编号（P59） | `2026-09-04 功能级 PASSED 并核销，待阶段三终态复核` | `已核销并完成终态复核`：规划复验 PASSED（2026-09-05）、功能状态 `COMPLETED（规划已确认，2026-09-05）` | `planning-final-review-p59-terminal-sync-02-passed.md`、`knowledge/features/p59-ch-apaas-project-update.md` |
| B22 | `knowledge/feature-reconciliation-index.md` | §5 其余 search 资料行 | `当前执行入口见 …（P59 终态复核）` | 当前入口=I4 终态三层状态全量对账方向 | 本方向 |
| B23 | `knowledge/feature-reconciliation-index.md` | §6 链接与追踪 | `Smart-WorkFlow-Server/功能清单.md` | `Smart-WorkFlow-aPaaS-server/功能清单.md` | 同上 |
| B24 | `knowledge/feature-reconciliation-products.md` | 新增 F 组 | 正式功能序号链止于第 41 个（A 组）；当前权威功能数 44 | 新增 F 组（42 `p4-oa-personal-center-dual-dispatch`／43 `v0.0.2-oa`／44 `p21-iot-device-access`，含登记、完成日期与 P 映射）；注明 A—E 组 55 键集合校验为 2026-09-04 快照、结论不变 | `knowledge/current-status.md`（功能数 44）、`feature-44.tsv` |
| B25 | `memory/README.md` | 当前摘要行、完整功能清单行 | `I1—I3已确认，I4待终态确认`；`Smart-WorkFlow-Server/功能清单.md` | I1—I3 `COMPLETED（规划已确认）`、I4 `COMPLETED（待规划确认，2026-09-13）`＋复核 01 `VERIFYING`；`Smart-WorkFlow-aPaaS-server/功能清单.md`；下一动作对齐 | 同上 |
| B26 | `memory/state.md` | 当前规划段、P60 条目 | `I4待终态确认`；未含复核 01 状态 | I4 `COMPLETED（待规划确认，2026-09-13）`、复核 01 `VERIFYING`；下一动作=三层对账并提交回执 02 | 同上 |
| B27 | `memory/features.md` | 同步点行、P60 条目 | `I4 COMPLETED（待规划确认）`（缺日期）；`I1—I3已确认完成；I4待终态确认` | I4 `COMPLETED（待规划确认，2026-09-13）`、复核 01 `VERIFYING`；下一动作对齐 | 同上 |
| B28 | `memory/handoff.md` | §2 最终状态 | `I1—I3已确认，I4 COMPLETED（待规划确认）` | I1—I3 `COMPLETED（规划已确认）`、I4 `COMPLETED（待规划确认，2026-09-13）`、复核 01 `VERIFYING` | 同上 |
| B29 | `memory/architecture.md` | 子仓路径 | `Smart-WorkFlow-Server/`、`Smart-WorkFlow-Web/` | `Smart-WorkFlow-aPaaS-server/`、`Smart-WorkFlow-aPaaS-Web/`（remote 不变）；同步点更新为 2026-09-13 | 实际仓库目录、`project.md` |
| B30 | `todo/requirement-pool.md` | 抬头权威来源行、§五第 5 行 | `Smart-WorkFlow-Server/功能清单.md` | `Smart-WorkFlow-aPaaS-server/功能清单.md` | 同上 |
| B31 | `todo/requirement-pool.md` | 成熟 OA 路线行、P60 行 | `当前等待Planner终态复核…`；`终态同步已提交 TERMINAL_SYNC_SUBMITTED，待 Planner 终态复核` | 增列终态同步复核 01 `VERIFYING`；当前唯一动作=三层全量对账方向并提交回执 02 | 本方向 |
| B32 | `todo/frontend-eslint-module-boundaries.md` | 位置行 | `Smart-WorkFlow-Web/eslint.config.js` | `Smart-WorkFlow-aPaaS-Web/eslint.config.js` | 实际仓库目录 |

## C. 未修正但有据的记录（不算差异）

| 项 | 说明 |
|---|---|
| `knowledge/features/v0.1.0-oa-completion.md` 等历史事件条目中的 `TERMINAL_SYNC_SUBMITTED`、`v0.3.0-oa-completion` 文件名 | 属**已发生的历次阶段同步事件记录**与历史回执真实文件名，按「历史回执原文保留」不改写；当前口径已在各自抬头／当前状态行更新 |
| `product/v0.3.0-oa-completion/` 路径引用 | I1 阶段历史证据目录，实际存在，属历史材料，不迁移不改写 |
| 主索引 §2/§3 的 P/I 集合计数（56 唯一 P、54 I、缺 I27） | 与本轮目标一致（P 编号不增删、不核销），无差异 |
| `agent-model-orchestration` 缺失 feature 登记（正式功能第 15 个） | 主索引 §5 已记录的既有缺口，替代证据在 `product/agent-model-orchestration/passed/`；本轮不重建、不新增孤儿 |
| `project.md` 的“开发入口 `Smart-WorkFlow-Server/README.md` / `Smart-WorkFlow-Web/README.md`” | 与本轮一致性问题同源的断链，但 `project.md` **不在本方向授权的修改范围**（§4 只允许工程《功能清单》、knowledge、memory、todo 与 P60 当前指针）；已在本差异表中登记，待 Planner 决定是否另行下发 |
