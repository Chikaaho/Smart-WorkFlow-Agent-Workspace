# knowledge-full-reconciliation（知识库全量整理与同步）任务登记

> 类型：知识对账整理任务（非业务功能，不加入正式功能计数）
> 状态：**COMPLETED（已确认，2026-09-04）**（规划最终复核 `receipts/planning-final-review-terminal-sync-02-passed.md`；终态九项复核通过，T1—T3 已核销，无剩余验收项）
> 同步点：2026-09-04

## 事实

- 正式业务功能数保持 **41**；本任务增量 0（非新增业务功能），不核销、不新增 P 编号（规划裁决 F1/F7，见 B 方向 §2）。
- 清单唯一值：**✅34 / 🟦28 / ⬜28 = 90**（本轮五行 M04-F01-03、M04-F07-01、M06-F01-01、M06-F02-01、M06-F03-01 ⬜→🟦；其余 85 行不变）。
- 已落实差异：A 阶段账本（A—E）→ 修正回执 full-audit-01-correction-01 → B 阶段逐文件同步（sync-b-01 回执）→ B 阶段补证链（correction-01…06，历史）→ 阶段三终态同步（terminal-sync-01）。
- P34/P35/P37/P38/P39 部分实现、开放未核销；P4 开放；P3/P21 部分关闭未核销；三类个人查询（我发起的/我的待办/我的已办）保持 M04-F05-01/P4 开放范围。
- **B 阶段复核（2026-09-04）**：`planning-review-sync-b-01.md` 首轮 VERIFYING → B1—B3 补证（`sync-b-01-correction-01.md`）→ `planning-review-sync-b-02.md` 复验：**已锁定**五行状态变化、P/I 零增删、历史备份与 HEAD 比对、B3 范围偏差登记及保留裁决、A 阶段及 G1—G5；剩余四项按 `planning-execution-prompt-knowledge-full-reconciliation-01.md`（补充提示 01）补齐：B1a（54 I 逐项映射子表）、B1b（55 目录逐项映射子表）、B1c（P1 核销/P47 历史限定）、B2a（最终证据封装）。补证回执：`receipts/sync-b-01-correction-02.md`（补充提示 01）、`receipts/sync-b-01-correction-03.md`（补充提示 02）、`receipts/sync-b-01-correction-04.md`（补充提示 03）、`receipts/sync-b-01-correction-05.md`（补充提示 04：B2a-r1 真实 diff/B2a-r2 入口一致性），证据附件 `receipts/evidence-sync-b-correction-02/`、`receipts/evidence-sync-b-correction-03/`、`receipts/evidence-sync-b-correction-04/`、`receipts/evidence-sync-b-correction-05/`。（历史复核记录：01 首轮 B1—B3、02 补充提示 01 四项、03 补充提示 02、04 补充提示 03 六入口，均保留为历史）

## 方向与回执指针

- 主方向：已归档 `product/knowledge-full-reconciliation/passed/direction-knowledge-full-reconciliation.md`
- B 阶段同步方向：已归档 `product/knowledge-full-reconciliation/passed/direction-knowledge-full-reconciliation-sync-b.md`
- 阶段三方向：已归档 `product/knowledge-full-reconciliation/passed/direction-knowledge-full-reconciliation-terminal-sync.md`
- 规划复验：`receipts/planning-review-full-audit-02-passed.md`（A PASSED）｜`receipts/planning-review-sync-b-07-passed.md`（B 整体 PASSED）｜`receipts/planning-review-terminal-sync-01.md`（终态首轮，历史）｜`receipts/planning-final-review-terminal-sync-02-passed.md`（**终态最终裁决：COMPLETED 已确认**）｜`receipts/planning-review-sync-b-01..06.md`、`receipts/planning-review-full-audit-01.md`（历史）
- 审计回执与账本：`receipts/full-audit-01.md`、`receipts/full-audit-01-correction-01.md`、`receipts/audit-ledger-{a,b,c,d,e}-*.md`、`receipts/evidence-correction-g1-g5/`、`receipts/sync-b-01.md`、`receipts/sync-b-01-correction-01.md`（补证）、`receipts/evidence-sync-b-correction-01/`（补证证据）
- 映射索引：`knowledge/feature-reconciliation-index.md`

## 边界

本任务是文档对账与状态整理，不实施新业务功能、不接入第三方通知、不修改权限/认证/迁移、不重跑全量业务测试、不改变历史验收事实。历史回执与裁决追加保留，不覆盖删除。