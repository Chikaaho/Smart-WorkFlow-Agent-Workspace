# product 目录完整映射子表（feature-reconciliation-products）

> 隶属：知识库全量整理（knowledge-full-reconciliation）功能映射索引的持久子表；主索引 §4 链接本表。
> 同步点：2026-09-04；集合基准：`receipts/evidence-correction-g1-g5/raw-product-dirs-audited.txt`（55 个实际目录键 = product/ 57 − governance − knowledge-full-reconciliation）。
> 每项：目录键、性质、已有证据指针、对应明细/P 或独立范围。允许同一业务交付多目录（如 P58 系列多份方向），不称 41 功能与目录严格一一对应（41 为历史正式功能计数）。
> 证据指针仅引用既有回执/feature 追踪，不重验旧业务（本轮为文档对账）。

## A 组：正式功能目录（41 个，含早期批处理与 PASSED 归档）

| 目录键 | 性质 | 证据指针 | 对应明细/P 或范围 |
|---|---|---|---|
| system-mgmt-crud | 正式功能第 2 个（早期批处理） | knowledge/features/system-mgmt-crud.md；历史快照 08-25 | M01/M02-F01 核心 CRUD（M01-F01-01/03、M01-F02-03、M10-F04-01 等行） |
| bpm-task-center | 正式功能第 3 个（早期批处理） | knowledge/features/bpm-task-center.md | M04-F05-01 子集（待办分页/详情/驳回/已办；我发起的/抄送/催办未做） |
| storage-multi-provider | 正式功能第 4 个（早期批处理） | knowledge/features/storage-multi-provider.md | M10-F06-01 ✅（I44 关） |
| job-scheduler | 正式功能第 5 个（早期批处理） | knowledge/features/job-scheduler.md | M10-F03-01 ✅（I43 关） |
| kb-verification | 正式功能第 6 个（早期批处理） | knowledge/features/kb-verification.md | I24/I25（验证型） |
| auth-seam-completion | 正式功能第 7 个（早期批处理） | knowledge/features/auth-seam-completion.md | I2（refresh/logout 双 token 闭环，无独立 M 明细） |
| feature-checklist-sync | 正式功能第 8 个（早期批处理） | knowledge/features/feature-checklist-sync.md | I1（清单同步） |
| vue-flow-adapter | 正式功能第 9 个（早期批处理） | knowledge/features/vue-flow-adapter.md | I3 Vue Flow 部分（归属 M07 图设计器基建） |
| bpmn-adapter | 正式功能第 10 个（早期批处理） | knowledge/features/bpmn-adapter.md | I3 BPMN 部分（服务 M04-F06-01 查看器） |
| process-monitoring | 正式功能第 11 个（早期批处理） | knowledge/features/process-monitoring.md | M04-F06-01 首批子集（流程图高亮/流转记录；耗时分析/干预未做） |
| checklist-gap-hardening | 正式功能第 12 个（早期批处理） | knowledge/features/checklist-gap-hardening.md | I33/I43/I44（M01-F02-02、M10-F03-01、M10-F06-01 菜单） |
| data-scope-enforcement | 正式功能第 13 个（早期批处理） | knowledge/features/data-scope-enforcement.md | M02-F04-01 ✅（I37 关；I46 不纳管边界） |
| notify-frontend | 正式功能第 14 个（早期批处理） | knowledge/features/notify-frontend.md | 无独立清单 ID，服务 M05 站内信（I7 关） |
| agent-model-orchestration | 正式功能第 15 个（早期批处理） | knowledge/features/agent-model-orchestration.md | M07-F01/F02/F04 骨架（D53—D71） |
| bpm-plugin-architecture | 正式功能第 16 个（早期批处理） | knowledge/features/bpm-plugin-architecture.md | M04-F08-01 ✅（D82；I47 已由 bpm-h2-v8-compat 修复指针） |
| bpm-single-node-approval | Walking Skeleton 第三环（早期批处理 COMPLETED；正式功能第 1 项 Walking Skeleton 无独立目录，本目录为其承载之一） | knowledge/features/bpm-single-node-approval.md；历史快照 08-25 | Walking Skeleton 审批联通子集，服务 M04-F04-01/M04-F05-01（ID 已更正，不占用 M04-F01-01 设计器 ID） |
| status-semantics-alignment | 正式功能第 17 个（PASSED 归档） | knowledge/features/status-semantics-alignment.md | I51（前端 status 语义） |
| sysrole-v5-column-alignment | 正式功能第 18 个（PASSED 归档） | knowledge/features/sysrole-v5-column-alignment.md | P13/I26（核销闭环） |
| bpm-h2-v8-compat | 正式功能第 19 个（PASSED 归档） | knowledge/features/bpm-h2-v8-compat.md | P10/I47（核销） |
| admin-role-governance | 正式功能第 20 个 | product/admin-role-governance/passed/ + receipts/planning-stage3-review-d97.md | P24/I49（核销；不可变超管+可配管理员） |
| user-org-association-query | 正式功能第 21 个 | product/user-org-association-query/passed/ + receipts/planning-final-review-d101.md | I32/I34/I35 关（M01-F02-01/04、M01-F03-01） |
| department-query-filtering | 正式功能第 22 个 | product/department-query-filtering/passed/ + receipts/planning-final-review-d104.md | M01-F01-04 ✅（I31 关） |
| agent-model-management-frontend | 正式功能第 23 个 | product/agent-model-management-frontend/passed/ + receipts/planning-final-review-d107.md | P5 核销；M07-F01-01～05 ✅ |
| pg-v13-migration-chain-repair | 正式功能第 24 个 | product/pg-v13-migration-chain-repair/passed/ + receipts/planning-stage3-review-d111.md | I52 关（PG 全链迁移修复） |
| user-group-membership | 正式功能第 25 个 | product/user-group-membership/passed/ + receipts/planning-stage3-review-d120.md | P28 核销；I36 关用户组绑定子集；M01-F04-01 🟦 |
| role-menu-permission-parity | 正式功能第 26 个 | product/role-menu-permission-parity/passed/ + receipts/planning-stage3-final-review-d125.md | P1 核销；M02-F02-01/F03-01 ✅ |
| agent-graph-execution-observability | 正式功能第 27 个 | product/agent-graph-execution-observability/passed/ + receipts/planning-stage3-review-d149.md | P7 运行日志子集（D148）；M07-F02-04 分项 |
| agent-graph-prompt-configuration | 正式功能第 28 个 | product/agent-graph-prompt-configuration/passed/ + receipts/planning-stage3-review-d157.md | P6 核销；M07-F02-02 ✅ |
| agent-token-usage-observability | 正式功能第 29 个 | product/agent-token-usage-observability/passed/ + receipts/planning-final-review-d174.md | P8 核销；M07-F04-02 ✅ |
| agent-graph-step-debugging | 正式功能第 30 个 | product/agent-graph-step-debugging/passed/ + receipts/planning-terminal-final-review-d183.md | P7 单步调试子集（D180）；M07-F02-04 ✅ |
| agent-tool-configuration-frontend | 正式功能第 31 个 | product/agent-tool-configuration-frontend/passed/ + receipts/planning-final-review-d203.md + d207 | P48 核销；M07-F03-02 ✅ |
| notify-management-closure | 正式功能第 32 个 | product/notify-management-closure/passed/ + receipts/planning-terminal-final-review-d212.md | P3 子集/I41/I42 关；M05-F01-02/03 ✅ |
| notify-template-management | 正式功能第 33 个 | product/notify-template-management/passed/ + receipts/planning-terminal-final-review-20260826.md | P36 核销；M05-F02-01 ✅ |
| notify-batch-send | 正式功能第 34 个 | product/notify-batch-send/passed/ + receipts/planning-terminal-final-review-20260827.md | P3 子集（U1/U2 核销）；M05-F01-01 ✅ |
| minimal-business-closure | 正式功能第 35 个 | product/minimal-business-closure/passed/ + receipts/planning-terminal-final-review-20260828.md + planning-status-correction-owner-formal-feature-20260828.md | Owner 正式功能；M08 五行🟦部分完成不虚报；P21 部分关闭边界 |
| form-data-import-export | 正式功能第 36 个 | product/form-data-import-export/passed/ + receipts/planning-terminal-final-review-20260829.md | P32 核销；M03-F04-02 ✅ |
| p45-login-security | 正式功能第 37 个 | product/p45-login-security/passed/ + receipts/planning-terminal-final-review-p45-20260901.md | P45 核销；M02-F06-01 ✅ |
| p52-form-workbench | 正式功能第 38 个 | product/p52-form-workbench/passed/ + receipts/planning-terminal-final-review-p52-form-workbench-20260902.md | P52 核销；不对应既有明细 |
| p56-form-grid-layout | 正式功能第 39 个 | product/p56-form-grid-layout/passed/ + receipts/planning-final-review-p56-stage3-20260902.md | P56 核销 + P46 一并核销；M03-F01-01 ✅ |
| p57-bpm-node-extension | 正式功能第 40 个 | product/p57-bpm-node-extension/passed/ + receipts/planning-final-review-p57-terminal-sync-02-passed.md | P57 核销；不对应既有明细 |
| p58-workflow-node-capabilities | 正式功能第 41 个 | product/p58-workflow-node-capabilities/passed/ + receipts/planning-final-review-p58-terminal-sync-01-passed.md | P58 核销；五行对应清单项由本轮对账登记 🟦（P34/P35/P37/P38/P39） |

## B 组：非功能 COMPLETED（2 个，不进入 41 计数）

| 目录键 | 性质 | 证据指针 | 范围 |
|---|---|---|---|
| minimal-closure-first-acceptance | 验收审计 + 三仓 README 重构 | product/minimal-closure-first-acceptance/passed/（4 份）+ planning-terminal-review-20260829.md | 审计不新增功能；003 README 同步 |
| workspace-governance-consistency-audit | 管理员审计 GOV-AUDIT-13 + 治理修复 | product/workspace-governance-consistency-audit/passed/（3 份）+ planning-review-executor-current-status-reconciliation-gov-audit-13-20260829.md | 16 项发现闭环；35/35 terminal 测试；不进入业务计数 |

## C 组：方向仍在 ready/ 或缺失（2 个）

| 目录键 | 性质 | 证据指针 | 范围/建议 |
|---|---|---|---|
| p51-agent-coding-engine-decoupling | P51 抽取（本地视图 VERIFYING；main 终态 COMPLETED） | product/p51-agent-coding-engine-decoupling/ready/ + receipts/planning-final-reconciliation-p51-main-terminal-authority-03.md | 本地与 main 终态不同步（X1）；按 main 终态理解 |
| readme-project-entry-correction | 文档治理任务（2026-08-30） | product/readme-project-entry-correction/ready/ + receipts/receipt-admin-readme-project-entry-correction-20260830.md | 仅 Admin 回执，规划复核证据待定位（X2） |

## D 组：receipts-only、无方向（7 个）

| 目录键 | 性质 | 证据指针 | 范围 |
|---|---|---|---|
| bpm-test-verification | BPM 验证型任务（无代码改动） | receipts/test-verification-2026-08-27.md | 证据型（915 基线历史） |
| form-binding | 前端表单绑定（M04-F02-01 子集） | receipts/execution-receipt-20260827.md | X3：M04-F02-01 创建/表单绑定子集，不新增功能数 |
| workflow-process-def-create | 前端流程定义创建（M04-F02-01 子集） | receipts/execution-receipt.md | X3 同系列 |
| process-initiation | 前端流程发起（M04-F03-01 子集） | receipts/execution-receipt.md | X3；M04-F03-01 行 ✅ 成立 |
| local-development-config | 本地开发配置（工具性） | receipts/execution-2026-08-30.md | 环境配置任务，非功能 |
| repository-history-sanitization | 敏感连接历史清理（git 历史改写） | receipts/preflight-2026-08-30.md + service-purge-pending-2026-08-30.md | X6：仅登记脱敏事实与证据边界 |
| next-feature-candidate-comparison-20260825 | 候选功能探索（静态读取） | receipts/planning-review-20260825.md | 探索任务已关闭；正文在 search_fallback/ |

## E 组：特例（3 个）

| 目录键 | 性质 | 证据指针 | 范围 |
|---|---|---|---|
| governance-contract-consolidation | 管理员治理任务 GR-1 | product/governance-contract-consolidation/passed/ + planning-final-review-2026-08-25.md | 治理信息与终态契约单一化；PASSED |
| feature-tracking-terminal-state-cleanup | 知识状态清理任务（D91） | product/feature-tracking-terminal-state-cleanup/passed/ + receipts/completion.md | X5：缺规划裁决回执，保留历史结论 |
| v0.0.1-beta-release-readiness | v0.0.1-beta 发布任务 | product/v0.0.1-beta-release-readiness/passed/（仅 blockers 方向）+ planning-review-v0.0.1-beta-git-release-20260830.md | X7：RELEASED；方向归档集合不完整 |

## 集合校验（双向差集，原始输出见 evidence-sync-b-correction-02）

- 期望键：`evidence-correction-g1-g5/raw-product-dirs-audited.txt`（55）。
- 实际键：本表 55 行（A 41 + B 2 + C 2 + D 7 + E 3 = 55），与当前 `ls product/` 过滤结果双向 diff exit=0；duplicate=0；missing=0；extra=0。
- 41 为历史正式功能计数；第 1 项 Walking Skeleton 无独立目录（承载于 A 组早期目录与 D 组 form-binding/workflow-process-def-create/process-initiation），已在 X3 记录，非漏登。
- 「41 功能与目录严格一一对应」不成立：P52/P57/P58 等目录一一对应，但 Walking Skeleton 无目录、D 组多目录为同一明细子集；本表按目录键逐项定位为唯一口径。