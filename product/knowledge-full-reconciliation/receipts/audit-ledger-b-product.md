# 审计账本 B：product/ 交付全集（A 阶段全量审计）

- 审计时间：2026-09-04（截至本账本落盘）
- 审计角色：Executor（只读审计，未修改任何被审计文件/代码/清单/Git）
- 依据方向：`product/knowledge-full-reconciliation/ready/direction-knowledge-full-reconciliation.md` §2（交付全集）、§3（对账规则）、§4（已知冲突）、§5A（A 阶段全量审计）
- 审计范围：`product/` 下 55 个功能/任务目录（57 个总目录 − governance 工具目录 − knowledge-full-reconciliation 自身）
- 状态口径基线：`knowledge/current-status.md`（2026-09-04 快照）：41 个正式功能、清单 ✅34/🟦23/⬜33 共 90 项；历史快照 `knowledge/history/current-status-through-2026-08-25.md`（29+3 项早期完成清单）与 08-26/27/28/29 各快照。
- 正式功能序号链（41 项，与目录一一对应）：1 Walking Skeleton（无独立目录，承载于早期目录）→ 2 system-mgmt-crud → 3 bpm-task-center → 4 storage-multi-provider → 5 job-scheduler → 6 kb-verification → 7 auth-seam-completion → 8 feature-checklist-sync → 9 vue-flow-adapter → 10 bpmn-adapter → 11 process-monitoring → 12 checklist-gap-hardening → 13 data-scope-enforcement → 14 notify-frontend → 15 agent-model-orchestration → 16 bpm-plugin-architecture → 17 status-semantics-alignment → 18 sysrole-v5-column-alignment → 19 bpm-h2-v8-compat → 20 admin-role-governance → 21 user-org-association-query → 22 department-query-filtering → 23 agent-model-management-frontend → 24 pg-v13-migration-chain-repair → 25 user-group-membership → 26 role-menu-permission-parity → 27 agent-graph-execution-observability → 28 agent-graph-prompt-configuration → 29 agent-token-usage-observability → 30 agent-graph-step-debugging → 31 agent-tool-configuration-frontend → 32 notify-management-closure → 33 notify-template-management → 34 notify-batch-send → 35 minimal-business-closure → 36 form-data-import-export → 37 p45 → 38 p52 → 39 p56 → 40 p57 → 41 p58。

---

## A. 交付全集账本（55 目录）

### A1. 正式功能 — COMPLETED（已确认，含 product 内规划终态/最终复核回执）〔22 个功能目录 + 2 个非功能目录〕

> 判定：主方向与阶段三方向均已归档 `passed/`；receipts 内存在规划最终/终态复核回执且结论 PASSED / COMPLETED（已确认）。终态值（功能序号、P 核销、清单计数变化）取自回执原文。

| 目录 | P/清单 ID | 主方向位置 | 最新裁决回执（文件名 → 结论） | 功能状态 | 终态值（序号/P/清单） |
|---|---|---|---|---|---|
| p58-workflow-node-capabilities | P58（补充需求，不对应既有明细） | passed（3 份：主方向＋debug-auth＋terminal-sync） | `planning-final-review-p58-terminal-sync-01-passed.md` → COMPLETED（已确认）；功能级 `planning-review-p58-workflow-node-capabilities-08-passed.md` → PASSED | COMPLETED | 第 41 个；P58 已核销；90 行明细零变化；后端 1035/前端 117f+1skip/1110t；H2 V49/PG V48 |
| p57-bpm-node-extension | P57（不对应既有明细） | passed（2 份） | `planning-final-review-p57-terminal-sync-02-passed.md` → PASSED；功能级 `planning-review-p57-bpm-node-extension-05-passed.md` → PASSED | COMPLETED | 第 40 个；P57 已核销；90 行明细零变化；清单 ✅34/🟦23/⬜33 |
| p56-form-grid-layout | P56，并核销 P46/M03-F01-01 | passed（2 份） | `planning-final-review-p56-stage3-20260902.md` → COMPLETED（已确认）；功能级 `planning-review-p56-form-grid-layout-04-passed.md` → PASSED | COMPLETED | 第 39 个；P56 已核销；P46 同一交付一并核销不重复计数；M03-F01-01 🟦→✅ |
| p52-form-workbench | P52（不对应既有明细） | passed（2 份） | `planning-terminal-final-review-p52-form-workbench-20260902.md` → PASSED / COMPLETED（已确认）；功能级 `planning-final-review-p52-form-workbench-20260902.md` → PASSED | COMPLETED | 第 38 个；P52 已核销；无既有明细晋级；清单 ✅33/🟦24/⬜33 不变 |
| p45-login-security | P45 / M02-F06-01 | passed（4 份：主方向＋补充 01/02＋stage3） | `planning-terminal-final-review-p45-20260901.md` → PASSED / COMPLETED（已确认） | COMPLETED | 第 37 个；P45 已核销；M02-F06-01 🟦→✅ |
| form-data-import-export | P32 / M03-F04-02 | passed（2 份） | `planning-terminal-final-review-20260829.md` → PASSED / COMPLETED（已确认） | COMPLETED | 第 36 个；P32 已核销；M03-F04-02 ✅ |
| minimal-business-closure | Owner 正式功能（腾讯 IoT 为其组成部分；原 P21 设备管理边界外） | passed（3 份） | `planning-terminal-final-review-20260828.md` → PASSED / COMPLETED（已确认）；`planning-status-correction-owner-formal-feature-20260828.md` 确立正式功能口径 | COMPLETED | 第 35 个（34→35）；清单 M08-F01-02 等五行 🟦 部分完成不虚报 ✅ |
| notify-batch-send | P3 子集 / M05-F01-01 | passed（2 份） | `planning-terminal-final-review-20260827.md` → PASSED / COMPLETED（已确认） | COMPLETED | 第 34 个；P3 保持部分关闭未核销；M05-F01-01 ✅；清单 U1/U2 核销（P3 与 P36 语义分离） |
| notify-template-management | P36 / M05-F02-01 | passed（2 份） | `planning-terminal-final-review-20260826.md` → PASSED / COMPLETED（已确认） | COMPLETED | 第 33 个；P36 已核销；P3 保持部分关闭未核销 |
| notify-management-closure | P3 子集 / I41 / I42 / M05-F01-02/03 | passed（2 份） | `planning-terminal-final-review-d212.md` → PASSED，COMPLETED | COMPLETED | 第 32 个；P3 保持部分关闭；I41/I42 已关闭；M05-F01-02/03 ✅ |
| agent-tool-configuration-frontend | P48 / M07-F03-02 | passed（2 份） | `planning-terminal-final-review-d207.md` → PASSED（终态 8/8，功能 COMPLETED）；功能级 `planning-final-review-d203.md` → PASSED（12/12） | COMPLETED | 第 31 个；P48 已核销；M07-F03-02 ✅；100f/981t/V37 |
| agent-graph-step-debugging | P7 第二子集 / M07-F02-04 | passed（2 份） | `planning-terminal-final-review-d183.md` → PASSED / COMPLETED（终态 8/8） | COMPLETED | 第 30 个；P7 已核销；M07-F02-04 ✅；清单 ✅26/🟦24/⬜40 |
| agent-token-usage-observability | P8 / M07-F04-02 | passed（主方向＋D171 阶段三方向） | `planning-final-review-d174.md` → PASSED / COMPLETED（13/13，零残留确认由本审查满足） | COMPLETED | 第 29 个；P8 已核销；M07-F04-02 ✅；清单 ✅25/🟦25/⬜40 |
| agent-graph-prompt-configuration | M07-F02-02（P6 关联） | passed（4 份） | `planning-stage3-review-d157.md` → PASSED / COMPLETED | COMPLETED | 第 28 个；P6 正式核销；M07-F02-02 🟦→✅；清单 ✅24/🟦26/⬜40 |
| agent-graph-execution-observability | P7 第一子集 / M07-F02-04 | passed（2 份） | `planning-stage3-review-d149.md` → PASSED / COMPLETED | COMPLETED | 第 27 个；P7 仅关运行日志子集（单步调试另计）；M07-F02-04 🟦 不误升 ✅；清单 ✅23/🟦27/⬜40 |
| role-menu-permission-parity | P1 / M02-F02-01 / M02-F03-01 | passed（2 份） | `planning-stage3-final-review-d125.md` → PASSED / COMPLETED | COMPLETED | 第 26 个；P1 正式核销；M02-F02-01/F03-01 ✅ |
| user-group-membership | P28 / I36 / M01-F04-01 | passed（3 份） | `planning-stage3-review-d120.md` → PASSED / COMPLETED | COMPLETED | 第 25 个；P28 核销；I36 仅关用户组绑定子集；M01-F04-01 🟦 |
| pg-v13-migration-chain-repair | I52（无需求池 P 编号） | passed（2 份） | `planning-stage3-review-d111.md` → PASSED / COMPLETED | COMPLETED | 第 24 个；I52 关闭 |
| agent-model-management-frontend | P5 / M07-F01-01～05 | passed | `planning-final-review-d107.md` → PASSED / COMPLETED（补证闭环） | COMPLETED | 第 23 个；P5 核销；M07-F01-01～05 五行 ✅ |
| department-query-filtering | M01-F01-04 / I31 | passed | `planning-final-review-d104.md` → PASSED / COMPLETED | COMPLETED | 第 22 个；M01-F01-04 🟦→✅；I31 关闭 |
| user-org-association-query | I32 / I34 / I35 / I36（普通角色子集） | passed（2 份） | `planning-final-review-d101.md` → 十项标准 PASSED＋阶段三终态同步完成（`post-acceptance-knowledge-sync.md`） | COMPLETED | 第 21 个；I32/I34/I35 关闭；I36 仅关普通角色绑定子集 |
| admin-role-governance | P24 / I49 | passed（2 份） | `planning-stage3-review-d97.md` → 最终判定 COMPLETED；`planning-final-review-d96.md` → PASSED | COMPLETED | 第 20 个；P24 已核销；I36 子集关闭（P1 其余缺口保持开放，无误核销） |

非功能目录（COMPLETED 已确认，不进入 41 计数）：

| 目录 | 编号 | 主方向位置 | 最新裁决回执 → 结论 | 状态 | 终态值 |
|---|---|---|---|---|---|
| minimal-closure-first-acceptance | 验收审计（不新增正式功能）＋三仓 README 重构 | passed（4 份） | `planning-terminal-review-minimal-closure-first-acceptance-20260829.md` → COMPLETED（已确认） | COMPLETED | 正式功能数保持 36；P 编号不新增/不核销；清单 ✅32/🟦25/⬜33 不变 |
| workspace-governance-consistency-audit | 管理员审计 GOV-AUDIT-13＋两项 Admin 治理修复 | passed（3 份，含 GOV-AUDIT-13 方向，文件系统事实） | `planning-review-executor-current-status-reconciliation-gov-audit-13-20260829.md` → PASSED / COMPLETED（已确认，18 项终态字段一致） | COMPLETED | 16 项历史发现已闭环；35/35 terminal 治理测试通过；不进入业务计数 |

### A2. 早期（2026-07 ~ 08-16，批处理时代）COMPLETED — 方向已归档 passed/，证据在 feature 追踪＋历史快照〔16 目录〕

> 判定：方向（step-* 或 direction-*）均在 `passed/`；`knowledge/features/*.md` 与 `knowledge/history/current-status-through-2026-08-25.md` 登记 COMPLETED 并计入 41 基线；但本目录 receipts 内**无规划终态/最终复核回执文件**（该时期规划验收结论记录于 feature 追踪与历史快照，product 内仅执行/完成回执）。此差异统一登记，不推断漏登。

| 目录 | P/清单 ID（或来源） | 主方向位置 | receipts 内最新裁决类文件 → 结论 | 功能状态 | 终态证据指针 |
|---|---|---|---|---|---|
| system-mgmt-crud | M01/M02-F01 核心 CRUD（正式功能第 2 个） | passed（step-b1…f3） | 仅 step-* 执行/测试回执 | COMPLETED | `knowledge/features/system-mgmt-crud.md`；历史快照 08-25 第 2 项 |
| bpm-task-center | M04-F05-01 子集（待办分页/详情/驳回/已办/审批历史；「我发起的・抄送・催办」未做） | passed（step-b1…f3） | 仅 step-* 执行回执 | COMPLETED | `knowledge/features/bpm-task-center.md`（明列未做项）；清单 M04-F05-01 保持 🟦 |
| storage-multi-provider | 文件存储多提供商（第 4 个） | passed（step-b1…f3） | 仅 step-* 执行/测试回执 | COMPLETED | `knowledge/features/storage-multi-provider.md` |
| job-scheduler | 定时任务调度（第 5 个） | passed（step-B2…F3） | 仅 step-* 执行/测试回执 | COMPLETED | `knowledge/features/job-scheduler.md` |
| kb-verification | 知识库运行期验证（第 6 个） | passed（step-VB1/VF1） | 仅 step-* 执行/测试回执 | COMPLETED | `knowledge/features/kb-verification.md` |
| auth-seam-completion | 双 token 认证 seam 收尾（第 7 个） | passed（step-1…7） | 仅 step-* 执行/测试回执 | COMPLETED | `knowledge/features/auth-seam-completion.md`（V1/B1–B4/F1–F2 全 PASSED） |
| feature-checklist-sync | I1（第 8 个） | passed（step-1…5） | 仅 step-* 执行回执 | COMPLETED | `knowledge/features/feature-checklist-sync.md` |
| vue-flow-adapter | I3 Vue Flow 部分（第 9 个） | passed（step-1） | 仅 step-0/1 执行回执 | COMPLETED | `knowledge/features/vue-flow-adapter.md` |
| bpmn-adapter | I3 BPMN 部分，服务 M04-F06-01（第 10 个） | passed（step-1…3＋correction） | 仅 step-* 执行/测试回执 | COMPLETED | `knowledge/features/bpmn-adapter.md`（step4 SUPERSEDED 由 process-monitoring 承接） |
| process-monitoring | M04-F06-01（首批；第 11 个） | passed（step-1…3） | 仅 step-* 执行/测试回执 | COMPLETED | `knowledge/features/process-monitoring.md`；清单 M04-F06-01 保持 🟦（非全量） |
| checklist-gap-hardening | I33＋I43/I44 批次（第 12 个） | passed | 仅 `checklist-gap-hardening-batch1-completion.md` | COMPLETED | `knowledge/features/checklist-gap-hardening.md` |
| data-scope-enforcement | M02-F04-01（第 13 个） | passed | 仅 `data-scope-enforcement-completion.md`（D79 裁决见 feature/历史） | COMPLETED | `knowledge/features/data-scope-enforcement.md`（D79 规划层最终验收 PASSED） |
| notify-frontend | M02-F01-01（第 14 个） | passed（step-0…3） | 无 receipts 目录 | COMPLETED | `knowledge/features/notify-frontend.md` |
| agent-model-orchestration | M07-F01/F02/F04（第 15 个，D53–D71） | passed（step-1…12） | 仅 step-* 执行/测试回执，0 份 planning | COMPLETED | `knowledge/features/agent-model-orchestration.md`；历史快照 08-25 第 15 项 |
| bpm-plugin-architecture | M04-F08-01（第 16 个，D82） | passed | 仅 completion＋frontend-four-gate-verification | COMPLETED | `knowledge/features/bpm-plugin-architecture.md`（D82 规划层最终验收 PASSED） |
| bpm-single-node-approval | 自标 M04-F01-01（Walking Skeleton 第三环；**与清单行冲突，见异常 X4**） | passed（step-0a…4） | 无 receipts 目录 | COMPLETED | `knowledge/features/bpm-single-node-approval.md` |

### A3. PASSED 并已归档 — 无阶段三终态复核回执〔3 目录〕

> 判定：feature 追踪当前写「PASSED 并已归档」，方向在 `passed/`，**已计入 41 正式功能基线**（历史快照 08-25 列为 ✅），但 receipts 内无阶段三/终态最终复核文件，终态语义为「PASSED（归档）」而非「COMPLETED（已确认）」。

| 目录 | P/清单 ID | 主方向位置 | 回执 → 结论 | 功能状态 | 建议 |
|---|---|---|---|---|---|
| bpm-h2-v8-compat | P10 / I47 | passed（2 份） | 仅 completion＋test＋post-sync-correction；D87/D88 裁决在 feature/历史 | PASSED（归档） | 建议 Planner 裁决补终态确认或维持历史口径 |
| sysrole-v5-column-alignment | P13 / I26 | passed | 仅 completion＋test；D86 裁决在 feature/历史 | PASSED（归档） | 同上 |
| status-semantics-alignment | I51 | passed | 仅 completion（无独立 D 编号） | PASSED（归档） | 同上 |

### A4. 方向仍在 ready/ 或缺失〔2 目录〕

| 目录 | P/清单 ID | 主方向位置 | 最新回执 → 结论 | 功能状态 | 说明/建议 |
|---|---|---|---|---|---|
| p51-agent-coding-engine-decoupling | P51 | ready（仅 1 份） | 本地 receipts：`planning-review-01` FAILED（VERIFYING）→ `planning-rereview-02` BLOCKED → `planning-final-reconciliation-p51-main-terminal-authority-03` **COMPLETED（已确认，功能级 PASSED，Owner 确认并授权远端发布，终态权威在 main@e0711fb）**；另 `planning-review-admin-execution-continuation-gates-02-passed` PASSED（Engine 治理任务，不计业务） | 本地实例 VERIFYING；回执 03 声明 main 侧 COMPLETED | 异常 X1：本地 OA 实例与 main 终态不同步，需裁决归档/同步 |
| readme-project-entry-correction | 文档治理任务（不新增正式功能） | ready（仅 1 份） | 仅 `receipt-admin-readme-project-entry-correction-20260830.md` → 结论「通过」（管理员回执，**无规划复核回执**） | READY（未归档） | 异常 X2：与 08-29 已 COMPLETED 的 three-repository-readme-refresh 疑似重叠 |

### A5. receipts-only、无方向目录〔7 目录〕

| 目录 | 性质/清单关联 | 回执 → 结论 | 状态 | 建议 |
|---|---|---|---|---|
| bpm-test-verification | BPM 模块测试验证（无代码改动，验证型任务） | `test-verification-2026-08-27.md`（全量 915、BPM 79 通过） | 无方向/无规划裁决；作为证据使用（915 基线进过正式基线历史） | 建议登记为证据型任务，不入功能清单 |
| form-binding | 前端表单绑定（FormSelectDialog 集成流程定义创建）→ M04-F02-01 子集 | 仅 `execution-receipt-20260827.md` | 无方向/无规划裁决 | 异常 X3：已开发未映射清单、无 P 编号 |
| workflow-process-def-create | 前端流程定义创建 → M04-F02-01 子集 | 仅 `execution-receipt.md` | 同上 | 异常 X3 |
| process-initiation | 前端流程发起（表单提交→跳转待办）→ M04-F03-01 子集 | 仅 `execution-receipt.md` | 同上 | 异常 X3 |
| local-development-config | 本地开发配置（application-local.yml 保留+忽略，非功能） | 仅 `execution-2026-08-30.md` | 已完成（工具性，无规划裁决） | 建议登记为环境配置任务 |
| repository-history-sanitization | 敏感数据库连接历史清理（含 git 历史改写、force push） | `preflight-2026-08-30.md`＋`service-purge-pending-2026-08-30.md` | 已执行；无方向/无规划裁决 | 异常 X6；涉及 §7 敏感信息边界，仅登记脱敏事实 |
| next-feature-candidate-comparison-20260825 | 候选功能比较探索（静态读取） | `planning-review-20260825.md` → PASSED（探索任务验收）；`exploration-completion.md` | 已关闭（探索）；无方向文件 | 正常（探索任务不产生方向归档；正文在 `search_fallback/`） |

### A6. 特例〔3 目录〕

| 目录 | 编号 | 主方向位置 | 最新回执 → 结论 | 状态 | 说明/建议 |
|---|---|---|---|---|---|
| governance-contract-consolidation | 管理员治理任务 GR-1 | passed（2 份） | `planning-final-review-2026-08-25.md` → PASSED（不进入业务功能三阶段状态机） | 管理员任务 COMPLETED | 正常；治理信息与终态契约单一化 |
| feature-tracking-terminal-state-cleanup | 知识状态清理任务（D91） | passed（已归档） | 仅 `completion.md`（功能级完成回执）；**无规划裁决回执** | 已完成（归档） | 异常 X5：规划复核证据缺失 |
| v0.0.1-beta-release-readiness | v0.0.1-beta 发布任务 | passed（**仅** `direction-v0.0.1-beta-release-blockers.md` 1 份归档） | `planning-review-v0.0.1-beta-final-ready-20260830.md` → READY；`planning-review-v0.0.1-beta-git-release-20260830.md` → PASSED / RELEASED；blockers → PASSED | RELEASED（任务闭环） | 异常 X7：主方向/发布范围方向文件缺失，归档集合不完整 |

---

## B. 方向 §4/§3.3 专项核对结论

1. **P52/P57/P58 不对应原 90 项明细** — 成立，三项均各有回执原文证据（不属漏登、不构成重复计数）：
   - P52：`planning-terminal-final-review-p52-form-workbench-20260902.md` 第 20/44 行「P52不对应既有清单明细，因此功能数增加一项而清单三类计数保持不变」「无既有Mxx-Fxx明细晋级」。
   - P57：`planning-final-review-p57-terminal-sync-02-passed.md`「90 项既有明细状态不变」。
   - P58：`planning-final-review-p58-terminal-sync-01-passed.md`「P58 核销、不改变其他明细」；补充边界（验收 08）：第三方渠道为 **SPI/隔离 Adapter 证明，非厂商账号联调**；意见 JS 为受控表达式；FAILED 任务为明确失败＋禁止继续处理边界。P58 通知 SPI 证据：`planning-review-p58-workflow-node-capabilities-08-passed.md` 标准 12「通知SPI及生产排除：E5 真实注册 Adapter 成功/失败/超时/幂等＋G3b 通过」。
   - P56 为覆盖关系已说明：`planning-final-review-p56-stage3-20260902.md`「P46（M03-F01-01）由同一交付一并核销且不重复计数」。
2. **通知相关** — 四个目录全部 COMPLETED 且 P 编号分离无重复（P3 部分关闭未核销、P36 已核销语义由 notify-batch-send U2 核销锁定；M05-F01-01/02/03、M05-F02-01 全部 ✅；M06-F01-01/02/03 保持 ⬜（P37/P38/P39 缺口未做），M06-F04-01 🟦（P3 剩余发送记录/失败重发/全局日志未完成）。P58 通知能力为 SPI 证明，未与真实厂商渠道混同。
3. **BPM 相关映射**（M04 明细）：
   - bpm-task-center → M04-F05-01 子集（待办/已办/详情/驳回/审批历史；**「我发起的/我的已办/我的待办」个人查询三入口：已办列表已做，「我发起的・抄送・催办」明确未做**（feature 文件第 192 行），与方向 §4「Owner 确认未完成项」一致，清单保持 🟦）。
   - process-monitoring → M04-F06-01 首批（流程图高亮/流转记录子集；耗时分析/干预未做，保持 🟦）。
   - process-initiation → M04-F03-01 前端发起子集（清单 ✅ 成立）。
   - workflow-process-def-create＋form-binding → M04-F02-01 流程定义创建子集（部署/版本/挂起/激活未做，保持 🟦）。
   - bpm-single-node-approval → Walking Skeleton 第三环（待办列表/通过/流程定义列表）；**功能文件自标 M04-F01-01 与清单行语义冲突**（M04-F01-01 是流程设计器拖拽设计行，缺口 P47 未做，保持 🟦）→ 异常 X4。
   - bpm-plugin-architecture → M04-F08-01 ✅。
   - bpmn-adapter → I3 BPMN 部分（服务 M04-F06-01）；vue-flow-adapter → I3 Vue Flow 部分；两目录均已 COMPLETED 且无独立明细编号（历史快照第 9/10 项）。
   - bpm-test-verification → 验证型任务（无功能编号）。
4. **已开发但漏登 / 已验收却称未开发 / 未完成却核销 / 重复计数检查**：
   - 漏登候选：form-binding、workflow-process-def-create、process-initiation（A5，无方向、无 P 编号、未单独入 41 计数；实际由 Walking Skeleton/minimal-business-closure 覆盖，需显式说明，不自动加计数）。
   - 「已验收却仍称未开发」：未发现正式功能如此；M04-F01-01 行 🟦 与 bpm-single-node-approval 功能文件自标编号冲突（X4）是唯一此类表象，属编号误标而非清单漏标。
   - 「未完成却已核销」：未发现（P3 部分关闭未核销、P1 其余缺口保持开放、P7 仅关子集、P21 现场联调未核销等均为正确不核销记录）。
   - 「重复计数」：未发现同交付双计；P46/P56、P3/P36、P7 双子集、I36 子集边界均有回执分离证据。三仓 README 两轮修订（08-29 已确认完成 vs 08-30 readme-project-entry-correction）为重叠风险（X2），非重复计数。
5. **GOV-AUDIT-13 方向位置**：文件系统事实 = 已归档 `passed/`；但 `knowledge/current-status.md`「终态与方向归档事实」段落仍写「仍留 ready/，待规划归档」→ 当前状态文字过期（异常 X8，纯描述/链接纠正类）。

---

## C. 异常项清单（待 Planner 裁决）

| # | 异常 | 路径/证据 | 类型 | 建议值（供裁决，不自行生效） |
|---|---|---|---|---|
| X1 | P51 本地实例状态与 main 终态不同步：方向仍 ready/、receipts 无 passed/；回执 03 声明 main@e0711fb 上 COMPLETED（已确认）且 Owner 授权发布，本地却无对应归档文件 | `product/p51-agent-coding-engine-decoupling/ready/direction-p51-agent-coding-engine-decoupling.md`；`receipts/planning-final-reconciliation-p51-main-terminal-authority-03.md` | 状态/范围映射 | 裁决：按 main 终态将主方向＋阶段三收口方向归档本实例 `passed/` 并同步状态为 COMPLETED；或按 §3.1 明确「Engine main 与 OA 实例分离」声明本地维持 VERIFYING |
| X2 | readme-project-entry-correction 方向仍在 ready/、无规划复核回执（仅管理员回执「结论：通过」）；与 08-29 COMPLETED 的 three-repository-readme-refresh 同改三仓 README，疑似范围重叠 | `product/readme-project-entry-correction/ready/direction-admin-readme-project-entry-correction.md`；`receipts/receipt-admin-readme-project-entry-correction-20260830.md`；`product/minimal-closure-first-acceptance/passed/direction-three-repository-readme-refresh.md` | 范围映射/状态 | 裁决两任务关系：并入已确认 README 任务、补规划复核并归档、或明确独立范围 |
| X3 | 三个前端交付目录无方向、无 P 编号、未入 41 正式功能计数（已开发但未映射） | `product/form-binding/receipts/execution-receipt-20260827.md`；`product/workflow-process-def-create/receipts/execution-receipt.md`；`product/process-initiation/receipts/execution-receipt.md` | 漏登/映射 | 裁决：登记为 M04-F02-01/M04-F03-01 子集完成说明（清单行状态不变或按证据微调），不新增正式功能数 |
| X4 | bpm-single-node-approval 功能追踪自标「M04-F01-01」，与清单行语义（流程设计器拖拽，P47 缺口 🟦）冲突；实为 Walking Skeleton 第三环（审批联通） | `knowledge/features/bpm-single-node-approval.md` §1；`Smart-WorkFlow-Server/功能清单.md` M04-F01-01 行 | 描述/范围映射 | 裁决：修正编号映射说明（归属 Walking Skeleton 或 M04-F04-01 子集），清单行保持 🟦 |
| X5 | feature-tracking-terminal-state-cleanup 方向已归档 passed/，但 receipts 仅完成回执、无规划裁决回执 | `product/feature-tracking-terminal-state-cleanup/receipts/completion.md`；`passed/direction-feature-tracking-terminal-state-cleanup.md` | 证据不足/状态 | 裁决：补登记规划裁决来源或维持历史口径 |
| X6 | repository-history-sanitization 无方向文件、无规划裁决，已执行 git 历史改写与 force push | `product/repository-history-sanitization/receipts/preflight-2026-08-30.md`、`service-purge-pending-2026-08-30.md` | 治理/安全边界 | 按 §7 仅登记脱敏事实与风险位置；裁决是否需要管理员补方向/回执 |
| X7 | v0.0.1-beta-release-readiness 已 RELEASED，但 passed/ 仅归档 1 份方向（blockers），发布主方向/范围方向文件缺失 | `product/v0.0.1-beta-release-readiness/passed/`（仅 `direction-v0.0.1-beta-release-blockers.md`） | 归档完整性 | 裁决：补归档或登记方向缺失说明 |
| X8 | current-status.md 记载 GOV-AUDIT-13 方向仍留 ready/，文件系统事实已归档 passed/ | `knowledge/current-status.md`「终态与方向归档事实」段 vs `product/workspace-governance-consistency-audit/passed/direction-executor-current-status-reconciliation-gov-audit-13.md` | 纯描述纠正 | 裁决：修正 current-status 文字为已归档 |
| X9（低危） | 早期批处理 16 目录 + PASSED 归档 3 目录在 product/receipts 中无规划终态复核文件，规划验收证据仅存于 feature 追踪/历史快照（D79/D82/D86/D87/D88/D91 等） | 见 A2/A3 各目录 | 证据指针 | 建议在同步阶段统一补「规划验收证据指针」条目，不要求重跑验收 |

---

## D. 统计汇总

| 指标 | 数量 | 说明 |
|---|---|---|
| 审计目录总数 | 55 | product/ 57 目录 − governance − knowledge-full-reconciliation |
| 正式功能 COMPLETED（已确认，含终态回执） | 22 目录 | 对应 41 正式功能序号 20–41 全部 22 项（见 A1 表） |
| 非功能目录 COMPLETED（已确认） | 2 | minimal-closure-first-acceptance（审计）、workspace-governance-consistency-audit（治理） |
| 早期批处理 COMPLETED | 16 | 2026-07~08-16 时代，方向已归档，规划证据在 feature/历史快照 |
| PASSED 并已归档（终态复核缺失） | 3 | bpm-h2-v8-compat、sysrole-v5-column-alignment、status-semantics-alignment |
| 方向在 ready/（未完成或未同步） | 2 | p51（本地视图 VERIFYING）、readme-project-entry-correction（READY） |
| receipts-only 无方向 | 7 | 见 A5 |
| 特例 | 3 | governance-contract-consolidation（admin PASSED）、feature-tracking-terminal-state-cleanup（归档缺复核）、v0.0.1-beta-release-readiness（RELEASED，归档不完整） |
| 异常项 | 9 | X1–X9 |
| 41 个正式功能与其 product 目录对账 | 41/41 可追溯 | Walking Skeleton（第 1 项）无独立目录，承载于 bpm-single-node-approval/process-initiation/form-binding/workflow-process-def-create 等早期交付 → 需显式说明，非漏登 |
| 清单 90 行 | 按当前快照 **✅34 / 🟦23 / ⬜33**（34+23+33=90），与 current-status/P52-P58 各终态复核回执一致 | 无重复行、无悬空 P 编号；M05 四行 ✅；M06（P37/P38/P39）未动 |

> 注：本账本为 A 阶段审计输出，仅登记事实、差异与建议值；所有裁决归 Planner，本审计不修改任何被审计目录状态、清单或代码。