# IG2a 附件：45 个业务功能逐名映射与状态依据（information-governance-03 补证）

> 生成：2026-09-30 执行03（python 严格 UTF-8）。工作目录：工作区仓库根。来源：`knowledge/feature-reconciliation-products.md` A 组表原文 + `knowledge/features/` 逐文件实读 + 各终态裁决回执。只核对文档与既有裁决，不重验历史业务。

> **45=45 的复算（工具输出）**：rows=45；unique_ids=45（#1—#45 各一次）；unique_paths=45（45 个不同登记路径，全部实测存在，缺失 0）；其中 40 行的登记文件含显式 COMPLETED/PASSED 状态行、4 行（#42—#45）以独立终态裁决回执为据、1 行（#23）登记文件头部为陈旧快照，以汇总裁决为有效状态依据（见行内说明）。**#1 特殊关系**：Walking Skeleton 无独立目录，A 组表原文注明由 `bpm-single-node-approval` 目录承载（"本目录为其承载之一"），故 #1 的登记路径=该承载目录的登记文件。

| # | 功能键 | 登记路径（存在✅） | 登记文件实际状态关键句（行号:原文） | 状态/裁决依据 |
|---|---|---|---|---|
| #1 | `bpm-single-node-approval` | `knowledge/features/bpm-single-node-approval.md` ✅ | L21: | 最终状态 | **COMPLETED** ✅ | | 登记文件状态行（L21） |
| #2 | `system-mgmt-crud` | `knowledge/features/system-mgmt-crud.md` ✅ | L16: | **当前状态** | **COMPLETED** — 全部 6 个 Step 已通过验收 | | 登记文件状态行（L16） |
| #3 | `bpm-task-center` | `knowledge/features/bpm-task-center.md` ✅ | L16: | **当前状态** | **COMPLETED** ✅ — B1+B2+B3+F1+F2+F3 全部通过验收 | | 登记文件状态行（L16） |
| #4 | `storage-multi-provider` | `knowledge/features/storage-multi-provider.md` ✅ | L16: | **当前状态** | **COMPLETED** ✅ — 全部 7 Steps PASSED | | 登记文件状态行（L16） |
| #5 | `job-scheduler` | `knowledge/features/job-scheduler.md` ✅ | L7: > 当前状态：**COMPLETED** ✅ | 登记文件状态行（L7） |
| #6 | `kb-verification` | `knowledge/features/kb-verification.md` ✅ | L8: **最终状态：COMPLETED ✅（2026-07-22，VB1 + VF1 均 PASSED，验收标准逐条独立复核通过）** | 登记文件状态行（L8） |
| #7 | `auth-seam-completion` | `knowledge/features/auth-seam-completion.md` ✅ | L196: > **最终状态**：COMPLETED ✅（7/7 Steps PASSED） | 登记文件状态行（L196） |
| #8 | `feature-checklist-sync` | `knowledge/features/feature-checklist-sync.md` ✅ | L48: | Step 3 | 规划层（不下发） | 综合 Step1+Step2 回执裁决最终状态，生成精确替换表 | **PASSED** | | 登记文件状态行（L48） |
| #9 | `vue-flow-adapter` | `knowledge/features/vue-flow-adapter.md` ✅ | L20: | 当前状态 | **COMPLETED** ✅（Step 0 PASSED，Step 1 PASSED，2026-07-25 阶段三收尾完成） | | 登记文件状态行（L20） |
| #10 | `bpmn-adapter` | `knowledge/features/bpmn-adapter.md` ✅ | L20: | 当前状态 | **COMPLETED** ✅（Steps 0-3 全部 PASSED，Step 4 SUPERSEDED 由 [[process-monitoring]] 承接） | | 登记文件状态行（L20） |
| #11 | `process-monitoring` | `knowledge/features/process-monitoring.md` ✅ | L20: | 当前状态 | **COMPLETED** ✅（Steps 0-3 PASSED，阶段三收尾完成，2026-07-30） | | 登记文件状态行（L20） |
| #12 | `checklist-gap-hardening` | `knowledge/features/checklist-gap-hardening.md` ✅ | L16: | 当前状态 | COMPLETED ✅ | | 登记文件状态行（L16） |
| #13 | `data-scope-enforcement` | `knowledge/features/data-scope-enforcement.md` ✅ | L16: | 当前状态 | **COMPLETED ✅（D79 规划层最终验收 PASSED，2026-08-15；归档 `product/data-scope-enforcement/passed/`）** | | 登记文件状态行（L16） |
| #14 | `notify-frontend` | `knowledge/features/notify-frontend.md` ✅ | L22: | **最终状态** | **COMPLETED** ✅ | | 登记文件状态行（L22） |
| #15 | `agent-model-orchestration` | `knowledge/features/agent-model-orchestration.md` ✅ | L18: | 创建日期 | 2026-08-09（Step1—3 PASSED，提交 `b222a78`；F04 前置调研同批） | | 登记文件状态行（L18） |
| #16 | `bpm-plugin-architecture` | `knowledge/features/bpm-plugin-architecture.md` ✅ | L20: | 当前状态 | **COMPLETED ✅（D82 规划层最终验收 PASSED，2026-08-16；归档 `product/bpm-plugin-architecture/passed/`）** | | 登记文件状态行（L20） |
| #17 | `status-semantics-alignment` | `knowledge/features/status-semantics-alignment.md` ✅ | L18: | 当前状态 | **PASSED 并已归档**（2026-08-17 规划层最终验收 PASSED，无独立 D 编号；前端 66f/576t 四连全绿；归档 `product/status-semantics-alignment/passed/`） | | 登记文件状态行（L18） |
| #18 | `sysrole-v5-column-alignment` | `knowledge/features/sysrole-v5-column-alignment.md` ✅ | L18: | 当前状态 | **PASSED 并已归档**（D86 规划层最终验收 PASSED，2026-08-17；527/0/0 全绿；归档 `product/sysrole-v5-column-alignment/passed/`） | | 登记文件状态行（L18） |
| #19 | `bpm-h2-v8-compat` | `knowledge/features/bpm-h2-v8-compat.md` ✅ | L18: | 当前状态 | **PASSED 并已归档**（D87 下发 / D88 规划层最终验收 PASSED，2026-08-17；543/0/0 全绿，30 条全链验证；归档 `product/bpm-h2-v8-compat/passed/`） | | 登记文件状态行（L18） |
| #20 | `admin-role-governance` | `knowledge/features/admin-role-governance.md` ✅ | L5: | 状态 | 规划层最终验收 PASSED（D96，阶段三知识同步中；P24/I49 关闭条件满足） | | 登记文件状态行（L5） |
| #21 | `user-org-association-query` | `knowledge/features/user-org-association-query.md` ✅ | L30: - 功能状态：`COMPLETED`；主方向已归档至 `product/user-org-association-query/passed/`。 | 登记文件状态行（L30） |
| #22 | `department-query-filtering` | `knowledge/features/department-query-filtering.md` ✅ | L5: **COMPLETED ✅（2026-08-18）**：D102 方向内实现（执行层自主拆分后端/前端两个 Step，严格串行、2G 内存上限、互斥证据齐全）→ D103 首轮验收仅终态同步 FAILED（memory/handoff.md 中下部旧口径），执行层全文修正（`receipts/post-d103-sync-correction.md`）→ D103 复验 + D104 最终验收 **PASSED**。M01-F01-04 🟦→✅，I31 关闭。方向归档 `product/department-query-filtering/passed/direction-department-query-filtering.md`，最终复验 `receipts/planning-final-review-d104.md`。 | 登记文件状态行（L5） |
| #23 | `agent-model-management-frontend` | `knowledge/features/agent-model-management-frontend.md` ✅ | ⚠ 登记文件头部为陈旧快照（"🔄 D106 FAILED（复验中…2026-08-19）"），有效状态以上列汇总裁决与映射索引"第 23 个"为准——差异如实列报交 Planner | 汇总裁决：product/knowledge-full-reconciliation/receipts/planning-final-review-terminal-sync-02-passed.md（2026-09-04 全量对账终态，A 组表性质原文同行保留） |
| #24 | `pg-v13-migration-chain-repair` | `knowledge/features/pg-v13-migration-chain-repair.md` ✅ | L18: | 当前状态 | **COMPLETED（D110 规划层最终验收 PASSED + 阶段三终态同步完成，2026-08-19）**；项目级 600/0/0/0、PG 全链 33 条 migrate+validate、H2 33 条回归零退化；方向归档 `product/pg-v13-migration-chain-repair/passed/` | | 登记文件状态行（L18） |
| #25 | `user-group-membership` | `knowledge/features/user-group-membership.md` ✅ | L16: | 当前状态 | **COMPLETED**（D117 PASSED + 阶段三同步，2026-08-19） | | 登记文件状态行（L16） |
| #26 | `role-menu-permission-parity` | `knowledge/features/role-menu-permission-parity.md` ✅ | L5: | 状态 | **COMPLETED**（D123 规划层最终验收 PASSED + 阶段三终态同步，2026-08-20）；第 26 个已完成功能 | | 登记文件状态行（L5） |
| #27 | `agent-graph-execution-observability` | `knowledge/features/agent-graph-execution-observability.md` ✅ | L220: **功能状态**：P7 / M07-F02-04 运行日志子集 **COMPLETED**（第 27 个已完成功能）。M07-F02-04 保持 🟦（运行日志查看✅ + 单步调试🟦，部分完成不自动升✅）。 | 登记文件状态行（L220） |
| #28 | `agent-graph-prompt-configuration` | `knowledge/features/agent-graph-prompt-configuration.md` ✅ | L3: > 状态：**COMPLETED（已确认，2026-08-21，第 28 个正式功能；D157 阶段三最终复验 PASSED）** — D150 主体实现保留；D151/D152/D153 补证迭代后 12 项业务功能标准全部通过（D151 标准1/5/11/12 未通过→D152 标准1/11 闭合→D153 标准11 互斥快照 + 标准12 全文同步 + 扩展零命中→D154 规划层最终验收 PASSED（功能级））。后端 723/0/0/0（sw-basic-agent 234）、前端 79f/775t 四门全绿、Flyway V34 零本轮迁移（**测试基线规划确认有效**）；D155/D156 阶段三 FAILED 为合法历史（提前宣告/残留问题，纠正已提交），**D157 阶段三最终复验 PASSED（2026-08-21）确认终态**：M07-F02-02 🟦→✅、终态 ✅24/🟦26/⬜40、功能数 27→28、P6 核销（历史 FAILED 记录保留为历史，见下）。 | 登记文件状态行（L3） |
| #29 | `agent-token-usage-observability` | `knowledge/features/agent-token-usage-observability.md` ✅ | L7: **D170功能级PASSED + D172阶段三PASSED，13/13；D173终态文字已同步，等待规划层零残留确认（第29个已完成功能）** | 登记文件状态行（L7） |
| #30 | `agent-graph-step-debugging` | `knowledge/features/agent-graph-step-debugging.md` ✅ | L7: **COMPLETED（D180 规划层最终验收 15/15 PASSED + 终态同步，2026-08-23）；P7 已核销、M07-F02-04 升 ✅、清单 ✅26/🟦24/⬜40、功能数 30（第30个）、正式基线 827/Agent338、86f/850t、V36；终态同步回执已提交，待规划层最终复验与归档** | 登记文件状态行（L7） |
| #31 | `agent-tool-configuration-frontend` | `knowledge/features/agent-tool-configuration-frontend.md` ✅ | L16: | 当前状态 | COMPLETED（D203 功能级 12/12 PASSED + 阶段三终态同步，2026-08-25，第31个） | | 登记文件状态行（L16） |
| #32 | `notify-management-closure` | `knowledge/features/notify-management-closure.md` ✅ | L19: | **最终状态** | **COMPLETED** ✅ | | 登记文件状态行（L19） |
| #33 | `notify-template-management` | `knowledge/features/notify-template-management.md` ✅ | L17: | **最终状态** | **COMPLETED（已确认，2026-08-26）✅**（第 33 个正式功能；规划终态复核 `planning-terminal-final-review-20260826.md` PASSED） | | 登记文件状态行（L17） |
| #34 | `notify-batch-send` | `knowledge/features/notify-batch-send.md` ✅ | L17: | **最终状态** | **✅ COMPLETED** | | 登记文件状态行（L17） |
| #35 | `minimal-business-closure` | `knowledge/features/minimal-business-closure.md` ✅ | L4: > 状态：功能级 **PASSED**（2026-08-28，规划最终验收）→ 阶段三终态落值 **COMPLETED（已确认，2026-08-28）**；2026-08-29 的 minimal-closure-first-acceptance 为后续验收审计（不新增功能数），两日期不混用。 | 登记文件状态行（L4） |
| #36 | `form-data-import-export` | `knowledge/features/form-data-import-export.md` ✅ | L4: > 状态：功能级 **PASSED**（2026-08-29，规划最终验收）→ 阶段三终态落值 **COMPLETED（已确认，2026-08-29）**（规划终态复核 `planning-terminal-final-review-20260829.md` PASSED）。 | 登记文件状态行（L4） |
| #37 | `p45-login-security` | `knowledge/features/p45-login-security.md` ✅ | L4: > 状态：功能级 **PASSED**（2026-09-01，规划最终验收 `planning-review-p45-implementation-08.md`）→ 阶段三终态最终复核 **COMPLETED（已确认）**（`planning-terminal-final-review-p45-20260901.md`）。 | 登记文件状态行（L4） |
| #38 | `p52-form-workbench` | `knowledge/features/p52-form-workbench.md` ✅ | L4: > 状态：功能级 **PASSED**（2026-09-02，规划功能级最终验收 `planning-final-review-p52-form-workbench-20260902.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-02）**（`planning-terminal-final-review-p52-form-workbench-20260902.md`）。 | 登记文件状态行（L4） |
| #39 | `p56-form-grid-layout` | `knowledge/features/p56-form-grid-layout.md` ✅ | L4: > 状态：功能级 **PASSED**（2026-09-02，规划功能级最终验收 `planning-review-p56-form-grid-layout-04-passed.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-02）**（`planning-final-review-p56-stage3-20260902.md`）。 | 登记文件状态行（L4） |
| #40 | `p57-bpm-node-extension` | `knowledge/features/p57-bpm-node-extension.md` ✅ | L4: > 状态：功能级 **PASSED**（2026-09-03，规划功能级最终验收 `planning-review-p57-bpm-node-extension-05-passed.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-03）**（规划最终复核 `planning-final-review-p57-terminal-sync-02-passed.md` **PASSED**）。 | 登记文件状态行（L4） |
| #41 | `p58-workflow-node-capabilities` | `knowledge/features/p58-workflow-node-capabilities.md` ✅ | L4: > 状态：功能级 **PASSED**（2026-09-04，规划功能级最终验收 `planning-review-p58-workflow-node-capabilities-08-passed.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-04）**（规划最终复核 `planning-final-review-p58-terminal-sync-01-passed.md` **PASSED**）。 | 登记文件状态行（L4） |
| #42 | `p4-oa-personal-center-dual-dispatch` | `knowledge/features/p4-oa-personal-center-dual-dispatch.md` ✅ | —（以独立终态裁决回执为准） | 功能级 PASSED（2026-09-07，规划复验09）；终态裁决 planning-final-review-terminal-sync-p4-02-passed.md（文件已实测存在：product/p4-oa-personal-center-dual-dispatch/receipts/planning-review-p4-09-passed.md; product/p4-oa-personal-center-dual-dispatch/receipts/planning-final-review-terminal-sync-p4-02-passed.md） |
| #43 | `v0.0.2-oa` | `knowledge/features/v0.0.2-oa.md` ✅ | —（以独立终态裁决回执为准） | COMPLETED（规划已确认，2026-09-07）；终态复核 planning-final-review-terminal-sync-v0.0.2-oa-03-passed.md（文件已实测存在：product/v0.0.2-oa/receipts/planning-final-review-terminal-sync-v0.0.2-oa-03-passed.md） |
| #44 | `p21-iot-device-access` | `knowledge/features/p21-iot-device-access.md` ✅ | —（以独立终态裁决回执为准） | COMPLETED（规划已确认，2026-09-08）；终态复核 planning-final-review-terminal-sync-p21-iot-02-passed.md（文件已实测存在：product/p21-iot-device-access/receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md） |
| #45 | `p53-global-ui-component-layout` | `knowledge/features/p53-global-ui-component-layout.md` ✅ | —（以独立终态裁决回执为准） | 功能级 PASSED（2026-09-21，规划验收审查12）；阶段三终态同步经规划最终复核01 PASSED（文件已实测存在：product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md; product/p53-global-ui-component-layout/receipts/planning-final-review-terminal-sync-p53-global-ui-component-layout-01-passed.md） |

## A 组表性质原文（#2—#41，供与上表状态句对照；完整未截断）

- #1 `bpm-single-node-approval`：Walking Skeleton 第三环（早期批处理 COMPLETED；正式功能第 1 项 Walking Skeleton 无独立目录，本目录为其承载之一）
- #2 `system-mgmt-crud`：正式功能第 2 个（早期批处理）
- #3 `bpm-task-center`：正式功能第 3 个（早期批处理）
- #4 `storage-multi-provider`：正式功能第 4 个（早期批处理）
- #5 `job-scheduler`：正式功能第 5 个（早期批处理）
- #6 `kb-verification`：正式功能第 6 个（早期批处理）
- #7 `auth-seam-completion`：正式功能第 7 个（早期批处理）
- #8 `feature-checklist-sync`：正式功能第 8 个（早期批处理）
- #9 `vue-flow-adapter`：正式功能第 9 个（早期批处理）
- #10 `bpmn-adapter`：正式功能第 10 个（早期批处理）
- #11 `process-monitoring`：正式功能第 11 个（早期批处理）
- #12 `checklist-gap-hardening`：正式功能第 12 个（早期批处理）
- #13 `data-scope-enforcement`：正式功能第 13 个（早期批处理）
- #14 `notify-frontend`：正式功能第 14 个（早期批处理）
- #15 `agent-model-orchestration`：正式功能第 15 个（早期批处理）
- #16 `bpm-plugin-architecture`：正式功能第 16 个（早期批处理）
- #17 `status-semantics-alignment`：正式功能第 17 个（PASSED 归档）
- #18 `sysrole-v5-column-alignment`：正式功能第 18 个（PASSED 归档）
- #19 `bpm-h2-v8-compat`：正式功能第 19 个（PASSED 归档）
- #20 `admin-role-governance`：正式功能第 20 个
- #21 `user-org-association-query`：正式功能第 21 个
- #22 `department-query-filtering`：正式功能第 22 个
- #23 `agent-model-management-frontend`：正式功能第 23 个
- #24 `pg-v13-migration-chain-repair`：正式功能第 24 个
- #25 `user-group-membership`：正式功能第 25 个
- #26 `role-menu-permission-parity`：正式功能第 26 个
- #27 `agent-graph-execution-observability`：正式功能第 27 个
- #28 `agent-graph-prompt-configuration`：正式功能第 28 个
- #29 `agent-token-usage-observability`：正式功能第 29 个
- #30 `agent-graph-step-debugging`：正式功能第 30 个
- #31 `agent-tool-configuration-frontend`：正式功能第 31 个
- #32 `notify-management-closure`：正式功能第 32 个
- #33 `notify-template-management`：正式功能第 33 个
- #34 `notify-batch-send`：正式功能第 34 个
- #35 `minimal-business-closure`：正式功能第 35 个
- #36 `form-data-import-export`：正式功能第 36 个
- #37 `p45-login-security`：正式功能第 37 个
- #38 `p52-form-workbench`：正式功能第 38 个
- #39 `p56-form-grid-layout`：正式功能第 39 个
- #40 `p57-bpm-node-extension`：正式功能第 40 个
- #41 `p58-workflow-node-capabilities`：正式功能第 41 个

## 与执行02 附件①的差异说明（IG2a 核销点）

1. 执行02 附件①正文称"44 个独立 features 文件"，与其自身 45 行×45 不同路径矛盾——本附件更正：**45 行=45 唯一 ID=45 唯一登记路径，全部存在**；#1 的登记由承载目录文件覆盖（A 组表注记"无独立目录"指无独立目录，非无登记文件）。
2. 执行02 表格"A组性质"列被截断为 40 字节（多字节截断产生"正式功"截断句）——本附件第 2 节提供完整原文。
3. 状态依据由"A组性质"升级为登记文件状态行原文（40 行）+ 独立终态裁决回执（#42—#45，文件存在性实测）+ 汇总裁决（#23，其登记文件头部陈旧快照与索引/汇总结论的差异如实列报）。
