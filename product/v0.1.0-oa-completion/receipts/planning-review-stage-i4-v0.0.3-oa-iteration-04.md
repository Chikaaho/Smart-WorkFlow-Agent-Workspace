# P60 I4「编排、流程运营与工作台」规划验收 04：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-13  
> 验收对象：`stage-i4-v0.0.3-oa-iteration-04.md`  
> 结论：二级提示后的提交仍有行为缺口，进入三级执行补充提示

## 1. 总结论

R4 交接历史前后成功读取且内容未变，予以锁定；R2 的迁移审计分组修复、终止正向链，R3 的时长计算修复，R5 的 H5 详情与正式意见表单也形成了有效增量。

但 I4 仍不能 `PASSED`：R1 将明确要求的 PostgreSQL 服务入口场景替换为 H2；R2 没有未选任务样本且 outsider 未验证 TERMINATE；R3 固定全集驳回、超时、退回/驳回样本仍为零；R5 的 375px 已办回看严重溢出不可用，外键只显示原始 ID 且未覆盖附件授权回显；R6 回执计数与清单实际值不一致，并在上述缺口未闭合时写 remaining=0。

I4 保持 **`VERIFYING`**，不得进入阶段三、I5、标签或发布。

## 2. 独立复核事实

- **R1 环境替代不成立**：`gate-r1-cross-tenant-raw.log` 明确显示 `jdbc:h2:mem:r1crosstenant (H2 2.3)`。验收 03 后的二级提示要求真实双租户对象经正式服务入口在隔离 PostgreSQL 验证；既有 PG 表级测试不能替代本次 service-entry 组合行为。
- **R2 反向样本不完整**：O1 只有两条活动任务且两条都被迁移，回执承认没有组外任务，因而“未选任务不变”没有行为样本。`asserts-r2.json` 的 outsider 两动作实际为 TRANSFER/SUSPEND，不是 TRANSFER/TERMINATE，无法证明无权终止零写入。
- **R3 样本矩阵未满足**：`r3-fullset.json` 仅 APPROVED/TERMINATED/RUNNING 三实例；`r3-recompute.json` 与 API 虽精确相等，但 rejected=0，附件没有超时或退回样本。二级提示明确要求驳回非零，正式方向还要求超时与退回/驳回可复算。回执正文称 avg=3806ms，实际附件为 3756ms，另有转录不一致。
- **R4 通过**：`r4-x-history-before.json` 与 after 均 HTTP 200/code 0，包含两条真实办理意见；规范化历史业务字段一致。交接 totalItems=0 不影响“历史不改写”这一被验主张。
- **R5 移动结果查询不可用**：详情、正式意见表单和必填拒绝截图可读；但 `r5-h5-processed-lookback.png` 在 375px 下只显示被挤压的碎片和大面积横向滚动，不能完成可用结果查询。`r5-h5-deeplink-outsider-denied.png` 同样是桌面布局横向溢出。所谓外键回显只是 `ref_dept_ref_id` 原始 UUID，没有关联对象的授权后可读信息；证据中没有附件对象、附件权限或附件回显。
- **R6 清单本体通过、声明不一致**：Planner 从 workspace root 独立解析 GNU `*` 标记并复算 manifest，实际 209 项、missing=0、bad=0、自身未列、回执已列；terminal 22 条 evidence 路径均存在。但回执宣称 206 项，且 R1/R2/R3/R5 未闭合时六项 COMPLETED/remaining=0 不成立。

## 3. 锁定项

- 继续锁定验收 03 §3 的既有通过项。
- 新锁定 R4；R2 的分组迁移审计与管理员终止正向链、R3 的非零时长 exact-equality、R5 的移动详情/正式意见表单/必填拒绝均可沿用，除非后续代码直接触及对应路径。
- 当前 manifest、terminal 路径存在性和秘密处置作为机械证据锁定；代码变化后仅重建最终候选必要部分。

## 4. 当前唯一入口

`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i4-v0.0.3-oa-iteration-03.md`

下一回执：

`product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-05.md`
