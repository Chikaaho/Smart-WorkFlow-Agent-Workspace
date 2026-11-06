# 执行总回执：三个业务示例流程本地配置 → UAT 导入验证 → 0.3.0

2026-11-07｜Executor｜L（Owner 指定轻量流程）｜唯一入口 `product/three-sample-process-uat/ready/direction-three-sample-process-uat.md`

执行侧七阶段 **6/0/1**：评估、执行、验收与同步（本回执）、合并、发版、发布后同步完成；结束待 Planner 一次性验收后关闭。

## 1. 三个流程的配置

应用：`运营与风险管理工作台`（目录 3 个，表单 3 张，流程 3 条，字典 3 组）。最终应用包由平台导出，覆盖到 `product/three-sample-process-uat/assets/operations-risk-workbench.appbundle.json`（27,291 B；`bundleFormatVersion=1`，`systemVersion=0.3.0`）。字典：`drill_category`（5 项）、`risk_level`（4 项）、`gate_zone`（5 项）、`incident_priority`（3 项）。

### 1.1 表单字段清单

> 平台表单 schema（`schemaVersion:1`）没有独立"分组"属性，分组由字段顺序、`colSpan` 栅格与标签体现；下表按业务语义分组列出，便于验收阅读。

### 跨部门灾备演练计划（`ops_drill_plan`，25 字段）

| 分组 | 字段名 | 类型 | 标签 | 必填 | 字典/多值 |
|---|---|---|---|---|---|
| 基本信息 | `drillName` | TEXT | 演练名称 | 是 | — |
| 基本信息 | `planCode` | TEXT | 演练计划编号 | 是 | — |
| 基本信息 | `undertakingBranch` | DEPT | 申请单位（分公司） | 是 | — |
| 基本信息 | `initiatingDepartment` | DEPT | 发起部门 | 是 | — |
| 基本信息 | `drillOwner` | USER | 演练负责人 | 是 | — |
| 基本信息 | `onSiteLead` | USER | 现场保障负责人 | 是 | — |
| 基本信息 | `drillCategory` | DICT | 演练类型 | 是 | drill_category / multiple |
| 基本信息 | `riskLevel` | DICT | 风险等级 | 是 | risk_level |
| 基本信息 | `participatingDepartments` | DEPT | 参与部门 | 是 | multiple |
| 基本信息 | `targetMachineRooms` | TEXT | 目标机房与系统 | 是 | — |
| 时间窗口 | `plannedStart` | DATE | 计划开始时间 | 是 | — |
| 时间窗口 | `plannedEnd` | DATE | 计划结束时间 | 是 | — |
| 时间窗口 | `maintenanceWindowMinutes` | NUMBER | 维护窗口时长（分钟） | 是 | — |
| 时间窗口 | `rtoMinutes` | NUMBER | 恢复目标 RTO（分钟） | 是 | — |
| 时间窗口 | `rpoMinutes` | NUMBER | 数据恢复点 RPO（分钟） | 是 | — |
| 时间窗口 | `noticeLeadHours` | NUMBER | 提前通知时长（小时） | 是 | — |
| 执行参数与影响评估 | `powerOffRequired` | BOOL | 到点执行机房断电 | 是 | — |
| 执行参数与影响评估 | `fireAlarmRequired` | BOOL | 到点触发火警告警 | 是 | — |
| 执行参数与影响评估 | `businessImpact` | RICH_TEXT | 业务影响评估 | 是 | — |
| 执行参数与影响评估 | `rollbackPlan` | RICH_TEXT | 回退与恢复方案 | 是 | — |
| 执行参数与影响评估 | `successCriteria` | RICH_TEXT | 演练成功判定标准 | 是 | — |
| 审批与知会 | `technicalReviewers` | USER | 技术委员会会签人 | 是 | multiple |
| 审批与知会 | `stakeholderIds` | USER | 需知会的相关领导 | 是 | multiple |
| 审批与知会 | `deviceCommandPayload` | TEXT | 设备指令参数（JSON） | 是 | — |
| 附件 | `drillPlanAttachment` | ATTACHMENT | 演练方案与回退脚本 | 是 | — |

### 校园出入口异常事件记录（`campus_gate_incident`，20 字段）

| 分组 | 字段名 | 类型 | 标签 | 必填 | 字典/多值 |
|---|---|---|---|---|---|
| 事件基本信息 | `campusName` | TEXT | 校区名称 | 是 | — |
| 事件基本信息 | `gateCode` | DICT | 异常出入口 | 是 | gate_zone |
| 事件基本信息 | `eventAt` | DATE | 异常发生时间 | 是 | — |
| 事件基本信息 | `reportedBy` | USER | 发现人（值班安保） | 是 | — |
| 事件基本信息 | `observationWindowMinutes` | NUMBER | 统计窗口（分钟） | 是 | — |
| 流量偏离观测 | `inboundObserved` | NUMBER | 窗口内入校人数 | 是 | — |
| 流量偏离观测 | `inboundBaseline` | NUMBER | 入校常态基线（人次） | 是 | — |
| 流量偏离观测 | `outboundObserved` | NUMBER | 窗口内离校人数 | 是 | — |
| 流量偏离观测 | `outboundBaseline` | NUMBER | 离校常态基线（人次） | 是 | — |
| 流量偏离观测 | `deviationRate` | NUMBER | 综合偏离率（%） | 是 | — |
| 现场与检索 | `weatherAndSiteContext` | TEXT | 天气与现场情况 | 否 | — |
| 现场与检索 | `internalEventReferences` | TEXT | 校内活动与近期流程检索摘要 | 否 | — |
| 现场与检索 | `publicEventSummary` | TEXT | 公开活动与节假日检索摘要 | 否 | — |
| 研判结论 | `activityAssessment` | TEXT | 活动关联结论（SPECIAL / NO_EXPLANATION） | 是 | — |
| 研判结论 | `assessmentRationale` | TEXT | 判定依据与不确定项 | 是 | — |
| 研判结论 | `recommendedPriority` | DICT | 建议处置级别 | 是 | incident_priority |
| 处置与归档 | `assignedOwner` | USER | 处置负责人 | 是 | — |
| 处置与归档 | `responseDueAt` | DATE | 首次响应时限 | 是 | — |
| 处置与归档 | `gateCameraClips` | ATTACHMENT | 现场监控截图与证据 | 否 | — |
| 处置与归档 | `resolutionSummary` | TEXT | 现场处置与结案摘要 | 否 | — |

### MES 设备温度偏离研判记录（`mes_temperature_review`，23 字段）

| 分组 | 字段名 | 类型 | 标签 | 必填 | 字典/多值 |
|---|---|---|---|---|---|
| 设备与批次 | `facility` | TEXT | 厂区 | 是 | — |
| 设备与批次 | `workshop` | TEXT | 车间 | 是 | — |
| 设备与批次 | `productionLine` | TEXT | 生产线 | 是 | — |
| 设备与批次 | `equipmentCode` | TEXT | 设备编号 | 是 | — |
| 设备与批次 | `batchNumber` | TEXT | 当前生产批次 | 否 | — |
| 测温与阈值 | `readingAt` | DATE | 测温时间 | 是 | — |
| 测温与阈值 | `currentTemperature` | NUMBER | 当前温度（℃） | 是 | — |
| 测温与阈值 | `normalTemperature` | NUMBER | 常温基线（℃） | 是 | — |
| 测温与阈值 | `alarmThreshold` | NUMBER | 告警阈值（℃） | 是 | — |
| 测温与阈值 | `stopThreshold` | NUMBER | 停机阈值（℃） | 是 | — |
| 速率与窗口 | `riseRatePerMinute` | NUMBER | 升温速率（℃/分钟） | 是 | — |
| 速率与窗口 | `rapidRiseThreshold` | NUMBER | 快速升温判定值（℃/分钟） | 是 | — |
| 速率与窗口 | `assessmentWindowMinutes` | NUMBER | 研判窗口（分钟） | 是 | — |
| 速率与窗口 | `temperatureSeriesSummary` | TEXT | 温度序列与数据质量说明 | 是 | — |
| 工艺与校准 | `materialAdditionInProgress` | BOOL | 是否处于人工加料阶段 | 是 | — |
| 工艺与校准 | `materialName` | TEXT | 当班加料物料 | 否 | — |
| 工艺与校准 | `calibrationStatus` | TEXT | 传感器校准状态 | 否 | — |
| Agent 研判 | `agentKnowledgeEvidence` | TEXT | 知识样本命中与研判依据 | 否 | — |
| Agent 研判 | `assessmentConclusion` | TEXT | 研判结论（NORMAL / SLOW_RISE / RAPID_RISE / EMERGENCY） | 是 | — |
| Agent 研判 | `recommendedAction` | TEXT | 建议处置与安全措施 | 是 | — |
| 处置与归档 | `shiftLeader` | USER | 当班负责人 | 是 | — |
| 处置与归档 | `telemetrySnapshot` | ATTACHMENT | 温度曲线与遥测截图 | 否 | — |
| 处置与归档 | `reviewNotes` | TEXT | 复核与交接记录 | 否 | — |

### 1.2 流程节点清单

### 跨部门灾备演练计划审批（`bpm_857d84258ce24bb3`，7 节点 / 6 连线，主题规则 `YJ-{YYYYMMDD}-{SEQ:3}`）

| 节点 ID | 类型 | 名称 | 参与人/配置 |
|---|---|---|---|
| `start` | START | 提交演练计划 | — |
| `node_dept_head` | APPROVAL | 申请单位负责人审核 | 参与人 `ROLE=drill_reviewer` |
| `node_tech_committee` | CONSENSUS | 分公司技术委员会会签 | 会签 `ROLE=drill_tech_committee`，mode=ALL |
| `node_branch_leaders` | DYNAMIC_PARALLEL | 参与部门分管领导并行审批 | 动态来源 `FORM_FIELD participatingDepartments`（DEPT, MAIN），mode=ALL，maxBranches=12，空/无效分支 BLOCK/SKIP |
| `node_hq_signoff` | APPROVAL | 总公司科技部会签 | 参与人 `ROLE=drill_hq_signoff` |
| `node_copy` | COPY | 知会演练相关领导 | `FORM_FIELD stakeholderIds`（USER），失败策略 CONTINUE |
| `end` | END | 审批完成，等待演练窗口 | — |

### 校园出入口异常事件分级处置（`bpm_f3ea41967d2f4419`，7 节点 / 7 连线，主题规则 `XY-{YYYYMMDD}-{SEQ:3}`）

| 节点 ID | 类型 | 名称 | 参与人/配置 |
|---|---|---|---|
| `start` | START | 登记出入口流量异常 | — |
| `node_duty` | APPROVAL | 安保值班负责人复核事件事实 | 参与人 `ROLE=campus_duty_officer` |
| `node_triage` | CONDITION | 核对活动关联与处置级别 | 条件边 `e3: form.activityAssessment == "SPECIAL"`，其余默认出口 |
| `node_p1` | APPROVAL | P1 活动关联记录与跟踪 | 参与人 `ROLE=campus_duty_officer` |
| `node_p0` | APPROVAL | P0 无法解释事件应急响应 | 参与人 `ROLE=campus_emergency_lead` |
| `node_p0_copy` | COPY | 知会校园应急负责人 | 参与人 `ROLE=campus_emergency_lead`，失败策略 CONTINUE |
| `end` | END | 处置记录归档 | — |

### MES 设备温度偏离研判与安全处置（`bpm_5e892fce35464e71`，6 节点 / 7 连线，主题规则 `MES-{YYYYMMDD}-{SEQ:3}`）

| 节点 ID | 类型 | 名称 | 参与人/配置 |
|---|---|---|---|
| `start` | START | 接收温度偏离记录 | — |
| `node_grade` | CONDITION | 按停机阈值与升温速率分级 | 条件边 `e2: form.assessmentConclusion == "EMERGENCY"`、`e3: ... == "RAPID_RISE"`，默认 `node_normal` |
| `node_emergency` | APPROVAL | 停机阈值紧急处置复核 | 参与人 `ROLE=mes_emergency_lead` |
| `node_rapid` | APPROVAL | 快速升温异常工单处置 | 参与人 `ROLE=mes_shift_supervisor` |
| `node_normal` | APPROVAL | 正常工艺波动记录复核 | 参与人 `ROLE=mes_process_engineer` |
| `end` | END | 处置结果归档 | — |

流程 A 的设备动作：`iotDeviceActionJson` 启用 `RESERVATION`，固定设备 `drill-room-hq-a`，命令 `emergency_shutdown`，参数取 `deviceCommandPayload`，到期字段 `plannedStart`（Asia/Shanghai），迟到窗口 1800s（设备 ID 随环境重新绑定，见 §5）。

## 2. 实例与截图

### 2.1 本地（隔离实例 18091 / `smart_workflow_030`；用户 8080/5173 未动）

| 实例编号 | 实例 ID | 走过的路径/分支 | 最终状态 | 截图 |
|---|---|---|---|---|
| YJ-20261106-001 | `2118729675898359809` | 部门负责人→技术委员会→动态并行→总公司会签→抄送→结束 | APPROVED（预约 EXPIRED：到期早于审批完成） | `.runtime-030/shots/local-02-my-instances.png`（列表） |
| YJ-20261106-002 | `2118729912641654785` | 同上（早期配置验证轮次，未生成预约） | APPROVED | 同上 |
| YJ-20261106-003 | `2118730866489298946` | 同上 | APPROVED（预约 EXPIRED，同上口径） | 同上 |
| YJ-20261106-004 | `2118735095669047298` | 同上；`plannedStart` 到期后预约 DISPATCHED | APPROVED；预约 `2118735111276052482` DISPATCHED；命令 `2118736705937850370` 已发布 | 同上；broker 实收 payload 见 §4 |
| XY-20261107-001 | `2118742689586462721` | 值班复核→分级→`unexplained-p0`→P0→知会→结束 | APPROVED | `.runtime-030/shots/local-02-my-instances.png` |
| XY-20261107-002 | `2118745393561976834` | 同上（P0） | APPROVED | 同上 |
| XY-20261107-003 | `2118746377793159170` | 同上（P0） | APPROVED | 同上 |
| XY-20261107-004 | `2118752792817549314` | 值班复核→分级→`special-event-p1`→P1→结束 | APPROVED | 同上 |
| MES-20261107-001 | `2118750172862332929` | 分级→默认出口→`node_normal`→结束 | APPROVED | 同上 |
| MES-20261107-002 | `2118750706054840322` | 同上（规则触发，默认出口） | APPROVED | 同上 |
| MES-20261107-003 | `2118782513311760385` | 分级→`rapid-rise`→`node_rapid`→结束 | APPROVED | 同上（03:08 后运行，列表截图未含） |
| MES-20261107-004 | `2118782808649482241` | 分级→`stop-threshold`→`node_emergency`→结束 | APPROVED | 同上（03:09 后运行，列表截图未含） |

本地页面证据：`local-01-catalog`、`local-02-my-instances`、`local-03-iot-rules`、`local-05-knowledge`（headed，1440×900，见 `.runtime-030/shots/`）。本地 NORMAL 研判执行 `2118751579237629953`，结果文本以 `NORMAL` 开头（只记录，不建实例）。

### 2.2 UAT（`https://chikaho.cn`，8.166.112.85）

| 实例编号 | 实例 ID | 走过的路径/分支 | 最终状态 | 截图 |
|---|---|---|---|---|
| YJ-20261107-001 | `2118773003574140930` | 申请单位负责人（李强）→技术委员会会签（刘洋）→**动态并行 2 路**（赵磊、孙悦）→总公司科技部会签（张伟）→抄送→结束；预约到期派发指令 | APPROVED；预约 `2118774077760561153` DISPATCHED；命令 `2118776467725312002` 已发布 | `uat-shots/uat-10-detail-yj-001.png`、`uat-10b-detail-yj-001-flow.png` |
| XY-20261107-001 | `2118777162222362626` | 值班复核（赵磊）→分级→`special-event-p1`→P1（赵磊）→结束 | APPROVED | `uat-shots/uat-01-my-instances.png` |
| XY-20261107-002 | `2118777594135011330` | 值班复核（赵磊）→分级→`unexplained-p0`→P0（张伟）→知会→结束 | APPROVED | `uat-shots/uat-11-detail-xy-002.png` |
| MES-20261107-004 | `2118779764477616129` | 规则 `mes-judge`(AGENT) 02:57 触发→`rapid-rise`→`node_rapid`（孙悦）→结束 | APPROVED | `uat-shots/uat-12-detail-mes-004.png` |
| MES-20261107-005 | `2118780073866256386` | 规则 `mes-stop`(FLOW) 02:58 触发→`stop-threshold`→`node_emergency`→结束 | APPROVED | `uat-shots/uat-13-detail-mes-005.png` |

补充：MES-20261107-001/002/003 在条件字段修正与重复验证过程中被作废（DISCARDED），不计入覆盖。UAT NORMAL 研判执行 `2118782181717925889`（03:06:51，SUCCESS，结果文本以 `NORMAL` 开头，只记录不建实例）。页面证据另含 `uat-01-my-instances`、`uat-02-catalog`、`uat-03-iot-rules`、`uat-05-knowledge`、`uat-07-process-defs`、`uat-08-app-center`、`uat-09-agent-home`（headed，1440×900，均在 `.runtime-030/uat-shots/`；截图不入 Git）。

## 3. 缺口与缺陷

| # | 现象 | 根因 | 修复 | 测试 |
|---|---|---|---|---|
| 1 | 流程保存/发布时审批人取值为空返回 500（`List.of(null)` NPE） | 审批人策略配置值未做空值校验，翻译器直接构造不可变列表 | `ApprovalUserTaskTranslator#validateParticipantValue` 空值返回结构化配置错误（"审批人取值不能为空（策略 …）"）；Server `79f00d3c` | 新增 `ApprovalUserTaskParticipantValidateTest`（5 例） |
| 2 | 应用包导入字典项被静默丢弃，报告项数与实际不符 | 导入读取 `value`，导出/条目字段为 `dictValue`；缺失项未进入清除清单 | `FormAppBundleService#toItemDTOs` 跳过空 `dictValue` 并记 `cleared("DICT_ITEM", …)`，`itemCount` 按实际导入统计；Server `79f00d3c` | `FormAppBundleServiceTest` 新增字典项跳过用例（opinionKeys `op_form_dict_item`） |
| 3 | 定时 MQTT 指令体被二次序列化，设备收到带引号的 JSON 字符串 | 预约意向记录器对已是 JSON 文本的参数字段统一 `JSON.toJSONString` | `BpmIotReservationIntentRecorder` 对以 `{`/`[` 开头且可解析的字符串按原文作为 payload；Server `79f00d3c` | `P63ReservationIntentRecorderTest`（原始 JSON + 纯文本引号两用例） |
| 4 | Agent 内部工具"发起工单"必然失败：工具入参被包成 `{"input":"…"}` 未解包；业务键 `agent-tool-`+UUID 超 36 字符列宽 | 工具回调工厂未识别单键信封；`businessKeyOf` 直接拼接前缀 | `AgentToolCallbackFactory#unwrapArguments` 解包单键信封；`AgentProcessStartTool#businessKeyOf` 空值→UUID、≤36 原样、超长→`at-`+SHA-256 前 33 位；Server `79f00d3c` | `AgentToolCallbackFactoryTest`（信封解包）、`AgentProcessStartToolTest`（businessKey 三态） |
| 5 | 生产门禁脚本 `set: pipefail: invalid option name`，CI 发布失败 | 版本收敛提交把脚本写成 CRLF，Linux `set -o pipefail` 解析失败 | 四个版本/构建文件统一 LF 重提交；Server `b4af4c3e` | CI run `42265184368` success、制品 `build.version=0.3.0` |

配置级问题（非代码缺陷，已在 UAT 按平台契约处理）：

- **D022-13**：应用包导入会清空 `FIXED_USER`/`DEPT_LEADER` 参与人值，并丢弃未定义的 `ROLE`/`POST` 编码。处理：导入前先建 9 个业务角色并为每角色配置**在岗成员**，流程参与人统一改用角色编码；导入后回读角色解析正常。
- **设备动作按环境重绑**：应用包内 `iotDeviceActionJson.deviceId` 是导出环境设备 ID，UAT 导入后重新绑定到 UAT 设备；租户 0 的 MQTT 连接 `uat-mosquitto-t0` 使用既有 broker 凭据创建（凭据不出库、不回显）。
- **流程 C 条件字段**：初版条件引用 `currentTemperature` 等字段，Agent 程序化 `formData` 未携带时全部走默认出口；改为按 `assessmentConclusion`（EMERGENCY/RAPID_RISE）路由后，UAT 实测两分支正确命中。本次为配置修正，未改代码。

## 4. 发布事实（0.3.0）

| 项 | Server | Web |
|---|---|---|
| 分支与 SHA | feature `79f00d3c` → develop `63c9bcf5` → 版本 `18e89e0f` → main `7e379ebd` → LF 修复 `b4af4c3e`（远端 main=develop=`b4af4c3e`） | develop `a80414d`（版本收敛 0.3.0）→ main `271d40c`（远端 main=`271d40c`、develop=`a80414d`） |
| Tag `0.3.0` | annotated tag 对象 `3b350acc` → commit `b4af4c3e` | annotated tag 对象 `a00ea285` → commit `271d40c` |
| CI | run `42265184368` success（`b4af4c3e`） | run `42264490453` success（`271d40c`）；develop run `42264458396` success |
| Release | id `436832133`「CH-aPaaS Server 0.3.0」，资产 `bootstrap-0.3.0.jar` 220,857,298 B sha256 `479c6c78bc5e688d3ca82d9dc3d92391f744907ee8ab49f5a04462c8d0a1de6c` | id `436817268`「CH-aPaaS Web 0.3.0」，资产 `sw-web-dist-0.3.0.zip` 6,194,537 B sha256 `79a51b5935abd72d66ba326ab19b736154220ecf9733f695daffab1ea7da79a7`，入口 `assets/index-egL2MRAT.js` |
| 开发版本 | `0.3.0-SNAPSHOT`（pom revision；正式构建 `-Drevision=0.3.0`） | `0.3.0`（package.json） |
| 全量测试 | 本地 `mvn test`：**2410 tests / 0 failures / 0 errors / 32 skipped**（14 个模块汇总，BUILD SUCCESS） | 无代码改动；沿用 0.2.4 的 typecheck/lint/vitest/build 四连通过 |
| UAT 部署 | 由 0.2.4 就地升级：备份 DB `smart_workflow_20261107_0217_pre030.dump`（736,270 B）、jar `bootstrap.jar.bak-0.2.4`、web `web.bak-0.3.0-pre.tar.gz`；启动 **170.894s**（PID 3263327）、启动段 ERROR 0、本机 `/api/actuator/health` **UP**、`build.version=0.3.0`；Flyway **v0.2.9**（0.3.0 无新增迁移）；HTTPS 根 200；磁盘可用 **1.6G（92%）** | 入口与 0.3.0 zip 一致 |

其他发布事实：

- UAT 临时注入监听器 `/etc/mosquitto/conf.d/zz-uat-test-inject.conf`（仅回环 1884，匿名，用于测试遥测注入）已在验证结束后删除并 `systemctl restart mosquitto`；现仅保留原 `auth.conf`，1883 认证监听正常，平台两条连接（`uat-mosquitto`、`uat-mosquitto-t0`）均回读"常驻连接已建立"。
- 本地 MQTT 实收：YJ-20261106-004 到期派发后，本地订阅端收到 `drill/room/drill-room-hq-a/down`，payload 为 `{"powerOff":true,"fireAlarm":true,"machineRooms":["A机房","B机房"],"drillCode":"DR-2026-Q4-EC-017"}`，与表单 `deviceCommandPayload` 逐字一致（原始 JSON，无二次引号）。
- UAT 命令回执：命令 `2118776467725312002` 状态 `UNKNOWN`（测试设备无真实回执），预约状态 `DISPATCHED`、payload 已按原文入库；无物理设备接入属预期。
- UAT EMAIL 渠道：系统级 `systemConfigured=true`、`hasSecret=true`（`smtp.163.com:465 SSL`），租户级 `tenantEnabled=false`（未向真实邮箱发信；站内信/审批流验证不受影响）。
- 测试数据均位于租户 0；未删除/重建 UAT 服务器、数据库、容器，未清空既有数据；仅新增应用、流程、角色、用户、Agent 图、知识文档、IoT 连接/设备/规则与测试实例。

## 5. 已知限制

1. **B/C 实例详情页表单面板为空**：XY/MES 实例以 API 直传 `formData` 启动（未建独立表单记录），详情页"表单数据"显示"暂未取到表单数据"；流转记录、流程图、审批详情正常，路由依据的 `formData` 在实例变量与 IoT 触发快照中完整（YJ 实例因先建表单记录，详情页表单完整）。影响仅限详情页回看；如需展示，应在发起时先创建表单记录。未在本次范围内改造详情页回退逻辑。
2. **NORMAL 只记录不建单**：MES 缓慢升温/正常波动由 Agent 判 `NORMAL` 后结束于图，不创建流程实例（符合"只记录"要求）；流程 C 的默认节点 `node_normal` 保留给手工/低风险入口，UAT 未以该入口跑实例（本地 MES-001/002 已跑到该节点结束）。
3. **表单分组无 schema 原生分组**：平台表单 schema 无 group 属性，业务分组靠字段顺序与 `colSpan` 栅格呈现；未改表单引擎。
4. **短信/电话渠道未采购**：按方向 §2 未接入，通知节点保留站内信/邮件能力。
5. **UAT 磁盘余量**：1.6G（92%），后续大版本升级前仍需按运维手册 §9.2 清理。
6. **命令回执**：测试设备无真实回执，`sw_iot_device_command.status=UNKNOWN`；本地 broker 实收与 UAT 预约/命令入库已证明发布链路，端到端设备确认需真实设备。
7. **Web 制品入口指纹与 0.2.4 相同**（`index-egL2MRAT.js`）：0.3.0 无 Web 代码改动，仅版本元数据变化；zip 摘要不同（`79a51b59…` vs `b40cf483…`）。

## 6. 七阶段与常规决定

- 七阶段：评估 ✅、执行 ✅、验收与同步 ✅（本回执，待 Planner 一次性验收）、合并 ✅、发版 ✅、发布后同步 ✅、结束 ⬜ → **6/0/1**。
- 计数不变：正式功能 **51**；清单 M **59/18/13=90**；ADV **1/7/56=64**；实际 P **63**（已核销 P2/P4/P9/P15/P19/P29/P34/P47/P65 不变，P35 部分、P20 未核销）；问题 **57**；正式验证基线变更 **[]**。
- 常规决定一行：UAT 按测试环境处理（登录/导入/发布/实例/通知/MQTT 测试主题均实跑，未删改服务器、数据库与既有数据；临时 1884 监听器已移除并恢复原 broker 配置）；本地使用隔离实例 18091 与独立库 `smart_workflow_030`，用户 8080/5173 未动；截图本机留存不入 Git；B/C 直传 formData 导致详情页表单面板为空按已知限制登记，不做详情页改造。

## 7. 证据路径

- 应用包：`product/three-sample-process-uat/assets/operations-risk-workbench.appbundle.json`（27,291 B，平台导出）
- 包说明：`product/three-sample-process-uat/assets/README.md`
- 本机页面截图：`.runtime-030/shots/`（local-01/02/03/05）
- UAT 页面截图：`.runtime-030/uat-shots/`（uat-01/02/03/05/07/08/09/10/10b/11/12/13）
- 运行脚本与日志：`.runtime-030/scripts/`、`.runtime-030/logs/`（均 gitignore，不入库）
