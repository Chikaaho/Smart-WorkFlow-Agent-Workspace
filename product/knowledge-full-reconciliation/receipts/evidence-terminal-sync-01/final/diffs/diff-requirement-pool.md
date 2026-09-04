# diff -u product/knowledge-full-reconciliation/receipts/evidence-sync-b-correction-05/final/requirement-pool.md todo/requirement-pool.md
# exit-code=1

--- product/knowledge-full-reconciliation/receipts/evidence-sync-b-correction-05/final/requirement-pool.md	2026-09-04 17:53:17
+++ todo/requirement-pool.md	2026-09-04 20:46:37
@@ -7,7 +7,7 @@
 
 ## Owner 优先级覆盖
 
-**2026-09-04本轮目标**：知识库全量整理与同步。A 阶段审计通过（规划复验 02 PASSED，G1—G5 核销），B 阶段逐文件同步已按 `product/knowledge-full-reconciliation/ready/direction-knowledge-full-reconciliation-sync-b.md` 执行；当前唯一下一动作：**Planner 复核补充提示 04 回执（`product/knowledge-full-reconciliation/receipts/sync-b-01-correction-05.md`，B2a-r1/B2a-r2）**。通知及三类个人流程查询纳入全量对账；本任务不新增业务功能、不自动核销P编号。下文各轮完成记录与“等待选择”均按对应同步点理解，不替代本轮下一动作。
+**2026-09-04本轮目标**：知识库全量整理与同步。A 阶段通过（规划复验 02 PASSED）、B 阶段整体 PASSED（复核 07）已完成；阶段三终态同步已按 `product/knowledge-full-reconciliation/ready/direction-knowledge-full-reconciliation-terminal-sync.md` 落盘（COMPLETED 待终态复核）；当前唯一下一动作：**Planner 复核 `product/knowledge-full-reconciliation/receipts/terminal-sync-01.md` 确认终态**。通知及三类个人流程查询纳入全量对账；本任务不新增业务功能、不自动核销P编号。下文各轮完成记录与“等待选择”均按对应同步点理解，不替代本轮下一动作。
 
 Owner 已将“最小业务闭环”定义为已完成的基础能力。用户、权限、表单、流程、审批与腾讯云 IoT Explorer 最小接入均已锁定通过；设备在既有腾讯路径中以 `productId + deviceName` 唯一定位。
 
@@ -513,4 +513,4 @@
 - **P13**：池内无行（knowledge/features/sysrole-v5-column-alignment.md 确认已闭环核销，合规移除）；**P23**：全工作区零引用（备案，不重建）。
 - **D83 stub 引用**：维护规则 §5 已改为池内行级证据为准（原四份 stub 引用已失效）。
 - **T 编号**：todo/README 当前集合 T2—T9（T1/T10 已删除），§维护规则中 T1-T10 引用已更正为 T2-T9。
-- **统一下一动作**：Planner 复核 `product/knowledge-full-reconciliation/receipts/sync-b-01-correction-05.md`（补充提示 04）；本文件各历史「等待选择」表述均按对应同步点理解，不替代当前下一动作。
+- **统一下一动作**：Planner 复核 `product/knowledge-full-reconciliation/receipts/terminal-sync-01.md` 确认知识整理终态；本文件各历史「等待选择」表述均按对应同步点理解，不替代当前下一动作。
