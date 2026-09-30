# IG2a 附件：六项功能登记状态依据（#8/#15/#20/#23/#29/#30，information-governance-04 补证）

> 生成：2026-09-30 执行04。工作目录：工作区仓库根；读取时点 2026-09-30。#20/#23/#29/#30 已按审查03 给定值机械更正（见 §2 修改前后原文）；#8/#15 为状态依据查明结果（§1）。只核对文档与既有裁决，不重验历史业务。

## 1. IG2a1：#8 与 #15 的功能状态原文及有效依据

### #8 feature-checklist-sync（`knowledge/features/feature-checklist-sync.md`）

- **功能状态原文（完整句，§6 L~末节）**：「全部 4 个 Step 已完成执行、测试和验收，功能进入阶段三收尾（COMPLETED）。」——此为执行侧自述，另引规划侧有效汇总裁决：
- **有效依据（汇总裁决，早期能力域）**：`knowledge/history/current-status-through-2026-08-25.md:186` 功能表行原文：「| feature-checklist-sync | 功能清单状态同步（I1） | **COMPLETED** ✅ | 2026-07-24 | 4 Steps 全部 PASSED：Step1/2 后端+前端逐条核实 54 条明细，Step3 规划层按 MIN 规则（[[decisions]] D35）综合裁决，Step4 机械应用到 `功能清单.md`。全表 89 条明细最终状态 ✅17/🟦12/⬜60，独立子代理核查确认与目标完全吻合 |」；二轮复核 `knowledge/history/session-handoff-before-knowledge-full-reconciliation-20260904.md:231`：「**feature-checklist-sync**：**COMPLETED** ✅ — 清单二次核实与同步（D72/D73 PASSED，2026-08-12）」。
- **结论**：#8 = COMPLETED（2026-07-24；Step3 为规划层 D35 MIN 规则综合裁决、Step5 二次复核 D72/D73 PASSED），非"Step3 PASSED"的步骤级表述。

### #15 agent-model-orchestration（`knowledge/features/agent-model-orchestration.md`，2026-09-13 补录登记）

- **功能状态原文（完整句，§1 表「历史完成状态/时点」行）**：「**COMPLETED（历史功能链）**——末步 Step12 通过规划裁决 **PASSED（D71，2026-08-12）**；全过程裁决链 D53—D71（Step1—3 D55、Step4 D59、Step5 D61、Step6 D63、Step7 D64/D65、Step8 D64、Step9 D65、Step10 D66/D67、Step11 D68—D70、Step12 D71），执行时间 2026-08-09 → 2026-08-12」。
- **有效依据（末步规划裁决）**：`product/agent-model-orchestration/passed/step-12-execution-history-persistence.md` 头部「状态：PASSED（D71，2026-08-12）」（登记 §5 证据指针明载；12 份方向全部在 passed/）。
- **结论**：#15 = COMPLETED（末步 Step12 规划裁决 D71 PASSED，2026-08-12），登记文件创建日期行"2026-08-09（Step1—3 PASSED…）"仅为创建过程信息，不作为状态依据。

## 2. IG2a2：四项登记机械更正（修改前/后实际原文与回读）

### #23 agent-model-management-frontend（`knowledge/features/agent-model-management-frontend.md`）

- 修改前（§ 当前状态 首句）：「**🔄 D106 FAILED（复验中，候选终态；2026-08-19）**：…复验通过前，P5 核销与清单五行上调仅为执行层候选终态，不构成规划层最终确认。」
- 修改后（§ 当前状态 首句）：「**✅ COMPLETED（D107 补证最终复验 PASSED，2026-08-19；裁决 `product/agent-model-management-frontend/receipts/planning-final-review-d107.md` §1「结论：PASSED / COMPLETED」，标准 5/6/7 补证全部 PASSED、后端项目级 591/0/0）**。」；D106 全段降为"历史过程"引用块保留。
- 回读：更正后文件已重新读取，当前段无「待确认/FAILED（作为当前态）/复验中/同步中/等待确认」表述；历史原文保留于引用块/历史标注内。四份裁决文件（d107/d97/d174/d183）实测存在，引文与文件原文一致。

### #20 admin-role-governance（`knowledge/features/admin-role-governance.md`）

- 修改前（状态字段行）：「| 状态 | 规划层最终验收 PASSED（D96，阶段三知识同步中；P24/I49 关闭条件满足） |」
- 修改后（状态字段行）：「| 状态 | **COMPLETED（D97 阶段三审查最终判定，2026-08-18；裁决 `product/admin-role-governance/receipts/planning-stage3-review-d97.md`「最终判定：COMPLETED」…；P24/I49 关闭）**…」；D96 同步中措辞标为历史过程；新增终态裁决回执指针；未沿用 D97 中任何历史计数。
- 回读：更正后文件已重新读取，当前段无「待确认/FAILED（作为当前态）/复验中/同步中/等待确认」表述；历史原文保留于引用块/历史标注内。四份裁决文件（d107/d97/d174/d183）实测存在，引文与文件原文一致。

### #29 agent-token-usage-observability（`knowledge/features/agent-token-usage-observability.md`）

- 修改前（§ 功能状态）：「**D170功能级PASSED + D172阶段三PASSED，13/13；D173终态文字已同步，等待规划层零残留确认（第29个已完成功能）**」
- 修改后（§ 功能状态）：「**COMPLETED（D174 规划层最终验收 PASSED / COMPLETED（13/13），2026-08-22；裁决 `product/agent-token-usage-observability/receipts/planning-final-review-d174.md`「最终结论：PASSED / COMPLETED（13/13）」，其中"等待规划层零残留确认"已由该裁决直接满足）。…**」；原"等待…确认"标注为已消除的历史过程。
- 回读：更正后文件已重新读取，当前段无「待确认/FAILED（作为当前态）/复验中/同步中/等待确认」表述；历史原文保留于引用块/历史标注内。四份裁决文件（d107/d97/d174/d183）实测存在，引文与文件原文一致。

### #30 agent-graph-step-debugging（`knowledge/features/agent-graph-step-debugging.md`）

- 修改前（§ 功能状态 尾段）：「…终态同步回执已提交，待规划层最终复验与归档」
- 修改后（§ 功能状态）：「**COMPLETED（D180 … 15/15 PASSED + D183 终态同步最终复验 PASSED / COMPLETED（终态同步 8/8；功能标准 15/15 保持），2026-08-23；终态裁决 `product/agent-graph-step-debugging/receipts/planning-terminal-final-review-d183.md`「最终结论：PASSED / COMPLETED」）…**」；原"待规划层最终复验与归档"标注为 D183 已完成的历史过程。
- 回读：更正后文件已重新读取，当前段无「待确认/FAILED（作为当前态）/复验中/同步中/等待确认」表述；历史原文保留于引用块/历史标注内。四份裁决文件（d107/d97/d174/d183）实测存在，引文与文件原文一致。

## 3. 授权与边界

- 更正依据：`receipts/planning-review-information-governance-03.md`「Planner 已查明裁决，授权机械更正」表；仅更正登记文件当前摘要/有效指针，历史过程与旧回执保留；不新增验收、不改变 45 计数。
