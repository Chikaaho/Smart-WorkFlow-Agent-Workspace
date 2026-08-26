# 规划验收：下一功能候选比较探索

> 日期：2026-08-25
> 验收对象：`search_fallback/next-feature-candidate-comparison-20260825.md`
> 结论：**PASSED**

## 1. 验收结论

探索回执完整覆盖任务指定的 M07-F03-03 / RAG、图节点级多 Key 轮询、M03/M05 未完成候选与 I50，并分别给出了完成边界、既有基础、主要缺口、依赖、风险、范围和相对排序。回执没有把静态探索升级为功能验收，也没有代替规划层生成需求方向或实施业务代码。

完成回执说明本次仅执行静态读取，探索正文落在任务指定的 `search_fallback/`，机器终态回执落在 `product/*/receipts/`；两份载体职责清楚，不构成路径替换。

## 2. 候选裁决

- **下一业务功能首选：P36 / M05-F02-01 消息模板。**
- 次选：P9 图节点级多 Key 轮询。
- P32/P33 在选型收敛前不作为本轮首选。
- P25/I50 保留为小型后端缺陷，不单独占用当前主功能轮次，也不得搭车扩大 P36 范围。
- P19/RAG 受 I13 未收敛限制，本轮不得投入编码。

选择 P36 的依据：它能推进真实的清单空白项；现有通知发送链路、通知管理页面、CRUD、菜单种子和双方言迁移模式可复用；主要产品决策可以被限制在模板字段、占位符语法及模板与发送入口的关系，整体边界比核心图引擎改造更可控。

## 3. 前置冲突

探索回执报告：`knowledge/current-status.md` 仍把 `governance-contract-consolidation` 写为 `ready/`、执行中和当前唯一下一动作；但规划终审、`memory/` 当前摘要以及 `product/governance-contract-consolidation/passed/` 均表明该治理任务已通过并归档。

由于 `knowledge/current-status.md` 是当前状态唯一权威来源，该冲突必须先纠正。纠正完成并经规划复核前，不下发 P36 业务方向，避免同时出现两个“唯一下一动作”。

## 4. 下一唯一动作

执行 `product/governance-contract-consolidation/ready/direction-post-final-review-current-status-correction.md`。纠偏通过后，由规划层下发 P36 的正式需求方向。
