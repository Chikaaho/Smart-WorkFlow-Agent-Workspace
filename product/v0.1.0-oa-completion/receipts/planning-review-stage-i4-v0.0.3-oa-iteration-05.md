# P60 I4「编排、流程运营与工作台」规划验收 05：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-13  
> 验收对象：`stage-i4-v0.0.3-oa-iteration-05.md`  
> 结论：R1/R2/R3 通过；R5 对象与附件证据仍不成立，R6 账本未闭合

## 1. 总结论

真实 PostgreSQL 双租户 service-entry、三任务选择性迁移与无权终止、四态分析及退回/驳回/超时逐字段复算均已达到三级提示要求，R1/R2/R3 锁定通过。

I4 仍不能 `PASSED`。R5 的浏览器对象与 HTTP/object-index 不是同一业务对象；附件没有绑定到固定记录，回执引用的两份原始下载响应不存在，只留下布尔摘要；R6 manifest 未包含本轮回执，terminal 又引用了一份 `failed=1` 的中间断言而未引用最终断言。

I4 保持 **`VERIFYING`**。下一轮只允许关闭 R5/R6，不得重验 R1—R4 或推进 I5/阶段三。

## 2. 独立复核结果

- **R1 通过**：`pg-runtime.txt` 与原始门禁显示 PostgreSQL 17.5；双租户 service-entry 2/2 通过。
- **R2 通过**：O3 三分支仅迁移 T_L1，未选 T_W 保持不变；审计 from/to/affected=1 与所选任务一致；authenticated outsider TERMINATE 返回 403，审计前后均 1。
- **R3 通过并纠正证据指针**：最终 `a2-fullset-raw.json` 为 APPROVED/RUNNING/REJECTED/TERMINATED 四态，returned/rejectedAction/overdue 均 1，`recompute.json` 与 `summary-api.json` 逐字段相等。`asserts-final.json`/`asserts-r3b.json` 为 19/19；旧 `asserts.json` 的 `failed=1` 是新增 APPROVED/TERMINATED 前的中间失败，不是最终断言。
- **R5 对象不匹配**：`http/object-index.json` 与 `r5-w-submit.json` 固定业务键为 `bd355a5c…`、实例 `fe4d90f0…`、任务 `fe4db80d…`；浏览器已办 DOM/截图中的业务键为 `349f4170…`。两者不相等，`asserts-browser.json` 的“同一对象贯穿”没有 ID 依据。
- **R5 附件链不成立**：`object-index.attachment.recordKey=null`；详情截图没有附件回显。回执引用 `http/r5-att-download-owner.json` 与 `http/r5-att-download-outsider.json`，两文件均不存在。`att-ownership-evidence.json` 只有布尔值；`asserts-r5.json` 是汇总断言，不是原始下载响应，且附件未与固定 R5 记录勾稽。
- **R6 机械缺口**：Planner 从 workspace root 独立复算 manifest 为 209 项、bad=0、missing=0、自身未列，但本轮回执也未列；terminal 23 条路径存在，却引用 `R3/asserts.json`（failed=1）而未引用最终 `asserts-final.json`。

## 3. 锁定范围

R1/R2/R3/R4 及验收 03—04 的所有既有通过项全部锁定。R5 的响应式布局、可读外键显示、正式意见表单和必填拒绝也锁定；仅重新采同一对象闭环和真实附件授权链。代码不变时不得重跑已锁定业务场景。

## 4. 当前唯一入口

`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i4-v0.0.3-oa-iteration-04.md`

下一回执：

`product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-06.md`
