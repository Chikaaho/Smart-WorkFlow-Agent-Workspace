# 执行回执 03：G7 Agent 工单表单填充（仅配置，未发版）

2026-11-07｜Executor｜依据 `receipts/planning-execution-prompt-three-sample-02.md`｜未改任何代码、未发版、未动 tag。

## 一、修改的配置

**IoT 规则输入映射**（`PUT /iot/rules/{id}` + 重新发布，UAT 与本地 18091 同步）：

- `rule-gate-flow` / `rule-gate-north`：新增固定字段 `campusName=主校区`、`gateCode=SOUTH_GATE`（北门规则为 `NORTH_GATE`，字典 `gate_zone` 编码）、`observationWindowMinutes=15`、`inboundBaseline=320`。
- `rule-mes-judge`：新增固定字段 `facility=华东一厂`、`workshop=压铸车间`、`productionLine=7 号压铸线`、`normalTemperature=75`、`alarmThreshold=80`、`stopThreshold=85`、`assessmentWindowMinutes=10`（`slopeThreshold=1.5` 原有）。

**Agent 图提示词**（两图重发布；UAT `校园启闭门流量异常智能研判`/`MES 温度偏离智能研判`，本地同步）：

- 校园图 `node_p1`/`node_p0`、MES 图 `node_alert`：重写"发起工单流程"入参映射指令——formData 按事件与节点变量逐字段填写（campusName/gateCode/eventAt/observationWindowMinutes/inboundObserved/inboundBaseline/deviationRate（按基线计算，一位小数）/internalEventReferences（概括 kbHits+procHits）/publicEventSummary（概括 webHits，无结果写"未检索到相关公开活动"）/activityAssessment/assessmentRationale/recommendedPriority/assignedOwner/responseDueAt（P0=报告时间+30 分钟、P1=+4 小时）；MES 侧 facility/workshop/productionLine/equipmentCode/readingAt/currentTemperature/normalTemperature/alarmThreshold/stopThreshold/riseRatePerMinute（按 recentSeries 首末计算）/rapidRiseThreshold/assessmentWindowMinutes/temperatureSeriesSummary/agentKnowledgeEvidence/assessmentConclusion/recommendedAction/shiftLeader）。
- 用户可见文字（判定依据、两项检索摘要、温度序列说明、知识命中、处置建议、告警正文）一律中文成文，禁止出现 `SPECIAL_EVENT`/`NO_EXPLANATION`/`UNDECIDED`/`RAPID_RISE`/`SLOW_RISE`/`EMERGENCY` 等编码；字典编码仅保留在 `gateCode`/`activityAssessment`/`recommendedPriority`/`assessmentConclusion` 字段值与研判首行（条件路由用）。告警 `bizId` 保持按事件 reportTime 区分。

**应用包**：`assets/operations-risk-workbench.appbundle.json` 已用平台导出覆盖（26,029 B，`systemVersion=0.3.0`）。平台应用包导出格式只含 app/dirs/forms/opinionForms/processes/dictTypes，**不包含 Agent 图与 IoT 规则配置**——图与规则的当前内容以 UAT/本地平台的图定义 v7（UAT，发布版本递增至 v7）与规则映射为准，本回执即为配置快照记录。

## 二、验证实例与截图

UAT 注入（北门 `visitor_flow=527`、MES 温度 77.2→82.1℃/约 16 秒）：

| 场景 | Agent 执行 | 实例 | formData 断言 |
|---|---|---|---|
| 北门 P0 | `2118916386716200961` SUCCESS | `2118916536897449985`（XY-20261107-006） | 14 个必备字段全部有值；campusName=主校区、gateCode=NORTH_GATE、deviationRate=64.7、responseDueAt=2026-11-07 12:30；判定依据/两项摘要零英文编码（API 断言） |
| MES 快速升温 | `2118917467017916418` SUCCESS | `2118917564065722370`（MES-20261107-008） | 17 个必备字段全部有值；riseRatePerMinute=17.9、阈值 75/80/85、rapidRiseThreshold=1.5；序列说明/知识命中/处置建议零英文编码（API 断言） |

截图（headed 1440×900，`.runtime-030/uat-shots-rework/`）：

- `rw-g7-detail-01-XY-20261107-006.png` — XY 详情：校区/出入口（"北大门"字典标签）/时间/窗口/流量/基线/偏离率/两项检索摘要/研判依据（纯中文）/级别/负责人/响应时限全部有值
- `rw-g7-detail-02-MES-20261107-008.png` — MES 详情：厂区/车间/产线/设备/时间/温度/阈值/速率/序列说明/知识命中/结论/处置/负责人全部有值
- `rw-g7-zhaolei-notify.png` — 负责人赵磊收件箱：12:00 新 P0 告警正文为纯中文（含读数/基线/偏离度/中文结论/12:30 响应时限），无 `NO_EXPLANATION` 等编码

无失败截图；过程中的环境事实：1884 临时注入监听器重建→验证完成→再次移除并恢复 broker（仅 1883 认证监听）、平台两条常驻连接重连；一次注入 payload 曾因 ssh 引号转义损坏（parseStatus FAILED），改用 base64 文件方式注入后成功。

## 三、七阶段进度

总 7｜已完成 4（评估、执行、合并、发版）｜进行中 0（本回执即发布后同步范围内的批次记录）｜未开始 3（规划验收 G7 与 execution-final-02、发布后同步终态确认、结束）→ **4/0/3**。G1—G6 维持锁定，未重做；tag 与 Release 未动（0.3.0 覆盖后的 Owner 追认事项由规划与 Owner 处理）。
