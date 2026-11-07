# 执行提示 02：Agent 工单表单填充（G7）

2026-11-07｜规划 → 执行｜依据 `receipts/planning-review-02.md`｜替代提示 01，作为当前唯一入口。G1—G6 已锁定，不要重做。

## G7

**要做什么**：修改 UAT 上校园、MES 两张 Agent 图的提示词和“发起工单流程”工具的入参映射，让 Agent 发起实例时把手里已有的数据写进 formData；同时让研判依据、告警正文对用户只显示中文结论。研判首行的编码可以保留给条件路由使用，但给人看的文字不要出现英文编码。

**完成条件**：

| 流程 | 必须有值的字段 |
|---|---|
| XY | `campusName`、`gateCode`（字典值）、`eventAt`、`observationWindowMinutes`、`inboundObserved`、`inboundBaseline`、`deviationRate`、`internalEventReferences`（知识库/流程命中摘要）、`publicEventSummary`（联网搜索摘要；没有结果时写“未检索到相关公开活动”）、`activityAssessment`、`assessmentRationale`、`recommendedPriority`、`assignedOwner`、`responseDueAt`（P0 设为 30 分钟后，P1 设为 4 小时后） |
| MES | `facility`、`workshop`、`productionLine`、`equipmentCode`、`readingAt`、`currentTemperature`、`normalTemperature`、`alarmThreshold`、`stopThreshold`、`riseRatePerMinute`、`rapidRiseThreshold`、`assessmentWindowMinutes`、`temperatureSeriesSummary`、`agentKnowledgeEvidence`、`assessmentConclusion`、`recommendedAction`、`shiftLeader` |

遥测里如果没有离校数据，`outboundObserved`、`outboundBaseline` 可以留空；`batchNumber`、附件、结案摘要这类需要人工补录的字段也可以留空。

**验证**：在 UAT 上各注入一次（北门 P0、MES 快速升温），各自截一张新实例的详情页（headed），再截一张负责人收到的告警。告警正文里不能出现 `NO_EXPLANATION`、`SPECIAL_EVENT`、`RAPID_RISE` 等编码。

**版本**：只改图配置就不需要发版。如果确实要改代码，先停下来写明原因，等 Owner 确认版本号，不要再改动已有的 tag。

完成后导出应用包覆盖 `assets/`（包里要包含 Agent 图配置；如果平台导出不含图配置，在回执里说明）。

## 回执

写入 `receipts/execution-final-03.md`，内容只要三项：修改了哪些配置、两个实例的 ID 和三张截图的路径、七阶段进度。
