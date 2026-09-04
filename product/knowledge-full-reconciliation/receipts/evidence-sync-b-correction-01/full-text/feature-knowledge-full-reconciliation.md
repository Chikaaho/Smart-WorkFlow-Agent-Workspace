# knowledge-full-reconciliation（知识库全量整理与同步）活动任务登记

> 类型：知识对账整理任务（非业务功能，不加入正式功能计数）
> 状态：**VERIFYING**（A 阶段通过，B 阶段同步待规划复核）
> 同步点：2026-09-04

## 事实

- 正式业务功能数保持 **41**；本任务增量 0，不核销、不新增 P 编号（规划裁决 F1/F7，见 B 方向 §2）。
- 清单唯一值：**✅34 / 🟦28 / ⬜28 = 90**（本轮五行 M04-F01-03、M04-F07-01、M06-F01-01、M06-F02-01、M06-F03-01 ⬜→🟦；其余 85 行不变）。
- 已落实差异：A 阶段账本（A—E）→ 修正回执 full-audit-01-correction-01 → B 阶段逐文件同步（sync-b-01 回执）→ B 阶段首轮复核 B1—B3 补证（见下）。
- P34/P35/P37/P38/P39 部分实现、开放未核销；P4 开放；P3/P21 部分关闭未核销；三类个人查询（我发起的/我的待办/我的已办）保持 M04-F05-01/P4 开放范围。
- **B 阶段首轮复核（2026-09-04）**：Planner `planning-review-sync-b-01.md` 判定 VERIFYING 待补证——已锁定：需求池主要状态同步、memory 8 文件哈希 8/8 OK、todo 哈希 1/1 OK、memory 15,763B 满足限制、A 阶段及 G1—G5 继续锁定；本轮剩余差异 B1（实际内容回传全文/diff）、B2（原始复算与保全）、B3（范围口径：memory/architecture、constraints、issues 三文件不在 B 授权表、handoff 顶部历史/当前口径、current-status 业务/审计命名）。三处超授权 memory 修改经规划审阅后**裁决保留**。补证回执：`receipts/sync-b-01-correction-01.md`，证据附件 `receipts/evidence-sync-b-correction-01/`。

## 方向与回执指针

- 主方向：`product/knowledge-full-reconciliation/ready/direction-knowledge-full-reconciliation.md`（ready，待规划归档裁决）
- B 阶段同步方向：`product/knowledge-full-reconciliation/ready/direction-knowledge-full-reconciliation-sync-b.md`（ready）
- 规划复验：`receipts/planning-review-full-audit-02-passed.md`（A 阶段 PASSED）｜`receipts/planning-review-full-audit-01.md`（初验 VERIFYING 记录）｜`receipts/planning-review-sync-b-01.md`（B 阶段首轮复核 VERIFYING，B1—B3 补证）
- 审计回执与账本：`receipts/full-audit-01.md`、`receipts/full-audit-01-correction-01.md`、`receipts/audit-ledger-{a,b,c,d,e}-*.md`、`receipts/evidence-correction-g1-g5/`、`receipts/sync-b-01.md`、`receipts/sync-b-01-correction-01.md`（补证）、`receipts/evidence-sync-b-correction-01/`（补证证据）
- 映射索引：`knowledge/feature-reconciliation-index.md`

## 边界

本任务是文档对账与状态整理，不实施新业务功能、不接入第三方通知、不修改权限/认证/迁移、不重跑全量业务测试、不改变历史验收事实。历史回执与裁决追加保留，不覆盖删除。