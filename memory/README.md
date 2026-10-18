# memory 使用说明

## 当前任务：0.1.7-bugfix 第41项线上返修

2026-10-18｜**核实结果**：线上组织种子已入库（9001/9002 各 7 节点/14 用户，与 R__ 种子对应）；admin 口令线上此前未更新，已一次性单行更新为 Owner 指定值（新口令成功/旧口令 code 2104）。**Owner 澄清 tenant 0＝超级租户（＝系统超管，仅一个用户）应见全部数据；已按原始设计恢复超管旁路**（CommonTenantLineHandler 接入既有 isSuperAdmin；一处生产改动），UAT 已换包部署。

方向：ready/direction-reopen-041-production-seed.md；裁决：receipts/planning-reopen-041.md；回传：search_fallback/reopen-041-production-seed.md；回执：receipts/reopen-041-01/02/03.md。分支 fix/super-tenant-visibility→develop→main（e2fe50f）；全量 13 模块 1800/0/0/0、制品门禁 PASS（0.1.7-SNAPSHOT 修复构建，无新版本）。**唯一下一动作：规划复核 reopen-041-01/02/03（含超管跨租户验收口径）**。

线上验证：admin 用户 **29 条**/部门树 **15 节点**；demo_a_hq_1 仍 **14 条**（隔离未削弱）；截图面工具超时如实披露。计数 49、46/22/22=90、ADV64/问题57、P 核销空、P62 延期/OFF、P65 待排期；清单只在本地留存并忽略。

## 上轮发布归档摘要：0.1.6-release

2026-10-16规划确认COMPLETED，5阶段5/0/0。终审：`product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md`。正式/部署0.1.6，Web e5aa357、Server e115857，验证R016-VB01—04，五方向passed。历史计数49、46/22/22=90、ADV64/57；P62延期/OFF。普通用户隔离通过，UAT管理员范围保留。后续Server文档CI的2项既有预约时序失败已另列待办。该轮无剩余发布动作。

