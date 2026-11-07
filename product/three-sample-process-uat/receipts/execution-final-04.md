# 0.3.1 执行回执：审批意见、流程变量与脚本驱动流转

日期：2026-11-08｜角色：执行（Executor）｜方向：`ready/direction-approval-comment-rework-031.md`｜等级：L（沿用主方向 §0 第 2—5 条）

结论：方向 §2 的三流程驱动关系全部落地并在 UAT 逐条实证（每个流程 ≥2 条意见驱动路径，共 8 条 UAT 路径全部 `APPROVED`）；代码改动发 0.3.1 并已合并、打 tag、发布 Release、部署 UAT；应用包已从 UAT 导出覆盖 `assets/`。0.3.0 tag/Release 未改动。唯一遗留：UAT 角色配置与设计稿有 2 处偏差（已修正），本地隔离环境若干迭代残留实例保持 `RUNNING`（不回滚、不影响 UAT 取证）。

## 1. 能力核对结果（a）—（e）

| 项 | 结论 | 依据 |
|---|---|---|
| (a) 意见表单字段写入流程变量 | **原已支持变量机制；本次开发补齐「意见→变量」写入**。审批完成时把意见表单值写入 `opinion`（对象）、`opinion_<字段名>`（平铺）并把同名字段回写 `formData`；写在 complete 事务内、引擎 REQUIRED 校验同事务，失败整体回滚 | 提交 `83045569`（`TaskActionService#writeOpinionVariables`）；测试 `TaskActionServiceOpinionVariableTest`（4 例） |
| (b) 条件分支引用意见变量 | **原已支持**（CONDITION 表达式可引用 `variables.*`），本次在配置层落地三图分流，无代码改动 | 三图 CONDITION 节点（见 §2.4）；UAT 路径见 §3 |
| (c) 参与人按变量/意见人员字段解析 | **原已支持**（EXPRESSION 策略，GraalJS 读流程变量）。本次配置为 `return 获取流程变量("opinion_fieldHandler" / "opinion_assignee" / "opinion_fieldCommander")` | UAT B-II 现场处置人=周涛、C-I/C-II 维修人=李强、A-I 现场指挥=赵磊，均按意见解析（§3） |
| (d) 脚本计算变量 | **原已支持节点触发器**（GraalJS worker 进程隔离，经宿主函数 `获取流程变量`/`设置流程变量` 读写）。**本次开发补齐**两处：① `TASK_SUBMITTED`/`NODE_ROUND_COMPLETED` 事件注入 `nodeOpinions`（本节点意见快照，供脚本读取他人意见）；② 会签节点意见按字段类型聚合写入 `opinionAgg_*`（RADIO/SELECT=选项序最大值、NUMBER=最大值、CHECKBOX=并集与 `_Count`）——因网关在 complete 事务内即时路由、触发器在 complete 后执行，聚合必须 Java 前置 | 提交 `83045569`（nodeOpinions 注入）、`1fc035fc`（按节点过滤修正：complete 路径轮次为空）、`1ce7b3bc`（`@Autowired` 移至完整构造器，修复注入静默失效）、`6a113431`（`aggregateConsensusOpinions`）；测试 `TriggerExecutionServiceNodeOpinionsTest`（3 例）+ 既有触发器测试对齐 `9ba59e97`；`sw-bpm-process` 模块 520 通过 / 0 失败 |
| (e) 定时预约时间取自变量 | **原已支持**（预约 `dueField` 读 `formData` 顶层字段）；本次验证意见新时间覆盖表单时间 | UAT A-I：表单计划开始 `2026-11-08 10:00`，会签意见「调整窗口」新时间 `2026-11-08 23:30` → 预约 `sw_iot_command_reservation` id `2119088560647270401` `due_local_text=2026-11-08 23:30:00`（`emergency_shutdown`，PENDING） |

说明：§2 A 流程「用脚本计算 `drillImpactLevel`」的要求由**会签聚合变量 `opinionAgg_downtimeMinutes` / `opinionAgg_impactSystemsCount` + CONDITION 表达式**承接（`> 240 || >= 5` → 分管副总审批）。聚合放在 Java（见 (d) 的时序约束）而非脚本节点，效果等价且被 UAT 实证；脚本能力本身由 B/C 两个触发器实证。

## 2. 意见表单、变量与脚本

### 2.1 意见表单（17 张 APPROVAL_COMMENT，UAT 全部 `PUBLISHED` v2）

> 节点级 `opinionForm` 为发布时冻结快照（意见词汇 RADIO/CHECKBOX/DATETIME/TEXTAREA/USER/NUMBER）；独立 FORM 定义用 FORM 词汇（DICT/MULTISELECT/DATE/TEXT/USER）承载流转记录标签渲染。以下为意见快照字段。

| 流程 | formKey | 表单名 | 字段（名称:类型[选项]） |
|---|---|---|---|
| A | op_drill_head | 负责人审核意见 | planReadiness: RADIO[完备/需补充]；fieldCommander: USER；rollbackNotes: TEXTAREA |
| A | op_drill_rework | 方案补正意见 | reworkNotes: TEXTAREA |
| A | op_drill_tech | 技术委员会会签意见 | riskRating: RADIO[低/中/高]；impactSystems: CHECKBOX[调度自动化/配电自动化/通信系统/营销系统/办公系统]；downtimeMinutes: NUMBER；techOpinion: TEXTAREA |
| A | op_drill_compliance | 安全合规复核意见 | complianceResult: RADIO[通过/退回整改]；complianceNotes: TEXTAREA |
| A | op_drill_vp | 分管副总审批意见 | vpDecision: RADIO[同意/不同意]；vpComment: TEXT |
| A | op_drill_hq | 总公司科技部会签意见 | executionDecision: RADIO[按计划执行/调整窗口/否决]；plannedStart: DATE(datetime)；extraConditions: TEXTAREA |
| A | op_drill_field | 现场指挥确认意见 | readyConfirm: RADIO[是/否]；personnelStatus: TEXT |
| B | op_gate_duty | 值班复核意见 | factResult: RADIO[属实/部分属实/误报]；fieldHandler: USER；arrivalTime: DATE(datetime)；sceneDescription: TEXTAREA |
| B | op_gate_misreport | 误报记录意见 | misreportReason: TEXTAREA |
| B | op_gate_dispose | 现场处置意见 | measures: CHECKBOX[疏导/封闭通道/增派安保/联系主办方]；disposeDoneAt: DATE(datetime)；remainingRisks: TEXT |
| B | op_gate_p0 | P0 应急响应意见 | reportScope: RADIO[无需上报/上报学校/联动属地派出所]；reportTarget: TEXT；disposeConclusion: TEXTAREA |
| B | op_gate_supervise | 处长督办意见 | superviseNote: TEXTAREA |
| C | op_mes_scene | 班组长现场确认意见 | measuredTemp: NUMBER；causeCategory: RADIO[设备故障/工艺参数/传感器漂移/环境因素]；stopped: RADIO[是/否]；assignee: USER |
| C | op_mes_calib | 仪表校准意见 | calibMeasure: TEXT；calibStandard: TEXT；tempAfterCalib: NUMBER |
| C | op_mes_repair | 设备维修意见 | repairMeasure: TEXT；partsReplaced: TEXT；tempAfter: NUMBER |
| C | op_mes_adjust | 工艺环境调整意见 | adjustMeasure: TEXT；envFactors: TEXT |
| C | op_mes_resume | 复产审批意见 | resumeApproved: RADIO[同意/不同意]；resumeConditions: TEXTAREA |

### 2.2 变量表

| 变量 | 来源 | 用途 |
|---|---|---|
| `opinion` | complete 时写入（意见对象） | 意见整体快照 |
| `opinion_<字段>` | 同上（平铺） | CONDITION 表达式、EXPRESSION 参与人、触发器脚本读取 |
| `formData`（同名字段回写） | 同上 | 预约 `dueField`、既有表单渲染兼容 |
| `opinionAgg_riskRating` / `opinionAgg_downtimeMinutes` / `opinionAgg_impactSystemsCount`（+`opinionAgg_impactSystems` 并集） | 会签节点 complete 时 Java 聚合 | A 流程 `高风险→合规`、`停机>240 或 系统≥5→分管副总` 分流 |
| `responseOverdue` | 触发器 `tg_duty_overdue`（TASK_SUBMITTED@node_duty） | B 流程 `超时→处长督办` 分流 |
| `sensorSuspect` | 触发器 `tg_scene_sensor`（TASK_SUBMITTED@node_scene_confirm） | C 流程 `偏差>3℃→强制仪表校准` 分流 |
| `nodeOpinions` | 触发器执行前按节点注入（instanceVariables） | 脚本读取本节点其他审批人意见 |

### 2.3 脚本内容（发布图触发器，GraalJS 语句体）

`tg_duty_overdue`（值班复核超时计算，node_duty，TASK_SUBMITTED）：

```js
var arrival = String(获取流程变量("opinion_arrivalTime") || "");
var due = String((获取流程变量("formData") || {}).responseDueAt || "");
var a = Date.parse(arrival.replace(" ", "T"));
var d = Date.parse(due.replace(" ", "T"));
var overdue = (!isNaN(a) && !isNaN(d) && a > d);
设置流程变量("responseOverdue", overdue);
return "OK";
```

`tg_scene_sensor`（现场实测温度偏差校验，node_scene_confirm，TASK_SUBMITTED）：

```js
var measured = Number(获取流程变量("opinion_measuredTemp") || 0);
var agentReading = Number((获取流程变量("formData") || {}).currentTemperature || 0);
var suspect = Math.abs(measured - agentReading) > 3;
设置流程变量("sensorSuspect", suspect);
return "OK";
```

### 2.4 三图分流结构（0.3.1 发布版）

- A（27 节点）：`dept_head → cond_head(完备/需补充) → [tech_committee → cond_tech(高风险→compliance；停机>240或系统≥5→vp；默认→bl_normal) / rework] → bl_* → hq_* → cond_hq_*(按计划/调整→field；否决→veto) → field_* → copy_* → END`
- B（20 节点）：`duty → cond_duty(属实/部分属实→field_dispose；误报→misreport→END) → triage(responseOverdue→supervise→cond_p0_ov；SPECIAL→p1；默认→p0) → cond_p0(reportScope→school/police/no-report) → END`
- C（24 节点）：`scene_confirm → cond_scene(stopped=是→resume；sensorSuspect 或 传感器漂移→calib；设备故障→repair；工艺/环境→adjust) → grade_*(EMERGENCY/RAPID_RISE/NORMAL) → END`

## 3. 驱动关系覆盖表

UAT 证据：站点 `https://chikaho.cn`；实例均 0.3.1 运行包（`build.version=0.3.1`）。截图本机留存 `.runtime-030/uat-shots-031/`（凭据与截图不入 Git）。

### 3.1 A 跨部门灾备演练计划审批（UAT：YJ-20261107-004 / 003）

| 驱动关系 | 实例 | 实际路径 | 截图 |
|---|---|---|---|
| 「需补充」退回方案补正 | YJ-20261107-003（`7063aef3…`，APPROVED） | dept_head(需补充) → node_rework(陈静补正) → END | 本地同类：`YJ-20261107-040`；截图见 B/C 同面板 |
| 「需补充/完备」分流（完备进会签） | YJ-20261107-004（`91af53a6…`，APPROVED） | dept_head(完备) → cond_head → tech_committee | `uat-031-detail-a1-records.png` |
| 技术委员会会签 3 人 + 聚合（最长停机 300>240） | 同上 | tech_committee(刘洋/杨帆/冯雪) → cond_tech → vp_approve(李强) | `uat-031-detail-a1-records/-opinions.png`（会签记录 3 人已同意） |
| 分管领导并行（参与部门 2 个） | 同上 | bl_impact(孙悦/赵磊，带意见) → hq_impact | `uat-031-detail-a1-records.png` |
| 「调整窗口」预约使用新时间 | 同上 | hq_impact(张伟，调整窗口 2026-11-08 23:30) → cond_hq → field_impact | `uat-031-fill-hq.png`（填写页）、预约行 `2119088560647270401` |
| 「现场总指挥」成为现场指挥确认处理人 | 同上 | field_impact 处理人=赵磊（意见 fieldCommander） | `uat-031-detail-a1-records.png` |
| 「高风险→安全合规复核」 | 本地 `YJ-20261107-039`（APPROVED）、UAT 未跑 | dept_head → tech(高) → compliance → bl_high → hq_high → field_high → END | 本地证据；UAT 等价分流已由「停机>240→副总」实证 |
| 「否决→结束并通知申请人」 | 本地 `YJ-20261107-041`（APPROVED 终态，veto COPY 节点） | hq_normal(否决) → cond_hq → veto_normal → END | 本地证据 |

### 3.2 B 校园出入口异常事件分级处置（UAT：XY-20261107-008 / 011 / 010）

| 驱动关系 | 实例 | 实际路径 | 截图 |
|---|---|---|---|
| 「误报」→ 误报登记 → 结束 | XY-20261107-008（`50946e13…`，APPROVED） | duty(误报) → misreport → END | 本地同类 `XY-20261107-014/018/021` |
| 「现场处置人」成为现场处置处理人 | XY-20261107-011（`3a137574…`，APPROVED） | duty(属实，处置人=周涛) → field_dispose(周涛) | `uat-031-detail-b2-records.png` |
| 「上报学校」→ 上报节点 | 同上 | p0(王芳，上报学校) → school(王芳) → END | `uat-031-detail-b2-records.png` |
| 脚本超时（到场 21:58 > 时限 20:30）→ 处长督办 | XY-20261107-010（`10d8386a…`，APPROVED） | duty(属实) → field_dispose → triage(responseOverdue) → supervise(王芳) → p0_ov(无需上报) → END | `uat-031-fill-duty.png`（填写页）；督办节点在 `uat-031-detail-*` 同类面板 |
| 「SPECIAL→P1」活动关联分流 | 本地 `XY-20261107-017`（APPROVED） | duty → field_dispose → p1 → END | 本地证据 |

### 3.3 C MES 设备温度偏离研判与安全处置（UAT：MES-20261107-009 / 010 / 011）

| 驱动关系 | 实例 | 实际路径 | 截图 |
|---|---|---|---|
| 实测偏差>3℃ 或「传感器漂移」→ 强制仪表校准 | MES-20261107-009（`9585fad8…`，APPROVED；实测 84.5 vs Agent 80.1） | scene_confirm(传感器漂移，指派人=李强) → calib(李强) → grade_calib → rapid_calib(孙悦) → END | `uat-031-detail-c1-records.png`、`uat-031-fill-mes-scene.png`（填写页） |
| 「设备故障」→ 设备维修；处理人=指派维修人 | MES-20261107-010（`dc717f80…`，APPROVED） | scene_confirm(设备故障，指派=李强) → repair(李强) → rapid_repair(孙悦) → END | `uat-031-detail-c1-*` 同面板 |
| 「已停机=是」→ 复产审批 | MES-20261107-011（`e11b0a88…`，APPROVED） | scene_confirm(停机=是) → resume(李强) → grade_resume → emergency_resume(李强) → END | 同上 |
| 「工艺参数/环境因素」→ 工艺环境调整 | 本地（`node_process_adjust` 已在本地 E2E 走通） | scene_confirm(工艺参数) → adjust → … | 本地证据 |

### 3.4 截图索引

| 文件（`.runtime-030/uat-shots-031/`） | 内容 |
|---|---|
| `uat-031-fill-duty.png` | B 值班复核意见填写页（单选/选人/日期/多行） |
| `uat-031-fill-mes-scene.png` | C 班组长现场确认意见填写页（数值/原因分类/停机/指派维修人） |
| `uat-031-fill-hq.png` | A 总公司会签意见填写页（执行决定/调整后时间/附加条件） |
| `uat-031-detail-a1-records/-opinions/-graph.png` | A-I 流转记录（含 3 委员会签）、审批详情（会签记录 3 人/2 人）、流程图（绿色轨迹） |
| `uat-031-detail-b2-records/-opinions/-opinion-detail/-graph.png` | B-II 流转记录（复核→处置→P0→上报学校）、审批详情与意见抽屉、流程图 |
| `uat-031-detail-c1-records/-opinions/-opinion-detail/-graph.png` | C-I 流转记录（复核→校准→快速处置归档）、意见抽屉（校准全字段中文标签与值）、流程图 |
| `uat-031-inbox-zhaolei.png` | 值班负责人收件箱：校园出入口流量异常 P0 告警（含设备、观测值、研判结论与处置要求） |
| `uat-031-inbox-wangfang.png` | 应急负责人收件箱：P0/上报学校待办通知 |

## 4. 发布事实（0.3.1）

| 项 | 事实 |
|---|---|
| 代码改动 | Server 分支 `feature/0.3.1-approval-driven-flow`：`83045569`（意见→变量 + nodeOpinions 注入）、`1fc035fc`（按节点过滤修正）、`1ce7b3bc`（`@Autowired` 修复）、`aa0aa09e`（测试构造器补参）、`6a113431`（会签聚合 `opinionAgg_*`）；develop `de66f1d0`（版本收敛 0.3.1-SNAPSHOT：pom revision + CI 断言 + check-version-identity.sh + build-prod.sh）、`9ba59e97`（测试断言对齐）；Web **无改动**（保持 0.3.0） |
| 合并/CI | develop → main `452178d8`（含 `68bad8a8` 发布合并）；CI run success（0.3.1 构建与测试通过） |
| tag/Release | Server tag `0.3.1` = `452178d8`；GitHub Release id `437557325`（`bootstrap-0.3.1.jar` 220,861,064 B，sha256 `9379195e…`）；**0.3.0 tag 未改动**（= `a0ac3a1a`） |
| UAT 部署 | 运行包与 Release 资产同字节、`build.version=0.3.1`、health UP、启动完成；DB 快照 `pre031` |
| UAT 配置 | 17 张 APPROVAL_COMMENT 表单 PUBLISHED（v2）；三图发布（A v9 / B v9 / C v11，2026-11-07 20:31）；触发器 2 条；角色修正：`drill_tech_committee` 补杨帆/冯雪（3 委员）、`campus_emergency_lead` 归王芳（张伟仅保留 `drill_hq_signoff`） |
| 应用包 | 从 UAT 平台导出（`GET /form/app/manage/bundle/{appId}/export`）覆盖 `assets/operations-risk-workbench.appbundle.json`：`systemVersion=0.3.1`、66,734 B、含 app/3 目录/3 业务表单/3 流程（流程内含 11/6/5 个节点意见快照）/6 字典类型 |
| 应用包缺项 | 包内 **不含**：① 独立 APPROVAL_COMMENT 表单定义（`opinionForms` 为空；节点级冻结快照已随流程携带）；② 触发器脚本（B/C 两条）；③ Agent 图；④ IoT 产品/设备/规则与通知渠道凭据。导入后需按 §2 在目标环境补建 |

## 5. 七阶段进度（执行侧口径）

| 阶段 | 状态 | 说明 |
|---|---|---|
| 1 评估 | ✅ | 方向 `direction-approval-comment-rework-031.md` 下发 |
| 2 执行 | ✅ | 能力核对 + 代码开发 + 本地配置/E2E + UAT 配置/E2E/截图（本回执） |
| 3 验收与同步 | 🟡 同步完成，待 Planner 验收 | knowledge/memory/需求池/version.json 已同步；验收裁决属规划 |
| 4 合并 | ✅ | feature → develop `de66f1d0` → main `452178d8` |
| 5 发版 | ✅ | 0.3.1 tag/Release/制品 + UAT 部署（Owner §3.0 持续授权） |
| 6 发布后同步 | ✅ | 本回执 + knowledge/memory 同步批次 |
| 7 结束 | ⬜ | 待 Planner |

已完成 6、进行中 0（第 3 阶段验收部分待规划）、未开始 1。

## 6. 遗留与观察

1. **UAT 角色偏差（已修）**：0.3.0 时期 UAT `drill_tech_committee` 仅刘洋、`campus_emergency_lead` 绑张伟，与设计（3 委员 / 王芳）不符；本轮修正后 A-I 出现 3 人会签、B-II P0 归王芳。修正前产生的旧实例（`XY-20261107-009`、`YJ-20261107-002`）已 discard，并新建实例重跑。
2. **旧图残留实例**：0.3.1 配置发布（20:31）前创建的 7 个旧图实例（4 个校园 + 3 个 MES）已全部 discard（理由：旧图迭代残留）。
3. **本地隔离环境**：若干迭代残留 `RUNNING`（如 `XY-20261107-022/023`、`MES-20261107-006/008/009`、`YJ-20261107-0xx` 若干）；Owner 口径保留不删，不参与本回执取证。
4. **审核状态说明**：A-I 的现场指挥确认节点在旧 A-I（`YJ-20261107-002`）中已按「调整窗口」完成过一次；该实例因会签只有 1 人于 22:5x 被 discard 并由 `YJ-20261107-004` 替代，最终证据只取后者。
5. **应用包缺口**见 §4；若后续要求「单包可复现 0.3.1 配置」，需规划补充意见表单定义与触发器脚本的导出能力（当前平台导出不含）。
6. 本地 E2E 另有 2 条本地专属路径（A 高风险→合规、A 否决、B P1、C 工艺调整），UAT 未重复跑；UAT 已满足「每流程 ≥2 条」的验收口径。
