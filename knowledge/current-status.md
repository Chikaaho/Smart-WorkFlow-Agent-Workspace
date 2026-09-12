# 当前项目状态

> 唯一当前快照；截至/同步点：2026-09-12，P60 `v0.1.0-oa-completion`（0.1.0 OA 全功能收口，XL，P0）执行中：目标版本由 Owner 确认统一登记为 `0.1.0`（更正回执 `product/v0.1.0-oa-completion/receipts/planning-registration-correction-v0.1.0-01.md`）；I1「组织与权限底座」**COMPLETED（规划已确认，2026-09-09）**（最终复核 07 PASSED）；I2「低代码表单收口」**COMPLETED（规划已确认，2026-09-10）**（终态最终复核 `planning-final-review-terminal-sync-stage-i2-v0.1.0-oa-completion-02-passed.md` PASSED）；**I3「人工审批与自研流程设计器」COMPLETED（待规划确认，2026-09-12）**（规划验收 `planning-review-stage-i3-v0.1.0-oa-completion-08-passed.md` PASSED；阶段三终态同步已执行，机器状态 `TERMINAL_SYNC_SUBMITTED` 待 Planner 终态复核），唯一执行入口 `ready/direction-stage-i3-terminal-sync.md`。功能数 44、清单 ✅46/🟦22/⬜22、P 编号全部保持现状。历史快照见 `knowledge/history/`。
> 冲突处理：本文件为当前功能状态、计数、活动功能、正式基线与唯一下一动作的权威来源。

## 当前快照

| 维度 | 当前值 |
|---|---|
| 业务功能状态 | `v0.1.0-oa-completion`（P60 0.1.0 OA 全功能收口）：**IN_PROGRESS**（I1 COMPLETED（规划已确认，2026-09-09）；I2 低代码表单收口 COMPLETED（规划已确认，2026-09-10）；**I3 人工审批与自研流程设计器 COMPLETED（待规划确认，2026-09-12）**，阶段三终态同步已执行，机器状态 `TERMINAL_SYNC_SUBMITTED` 待 Planner 终态复核） |
| 上一完成功能 | `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：**功能状态 COMPLETED（规划已确认，2026-09-08）**（阶段三最终复核 `planning-final-review-terminal-sync-p21-iot-02-passed.md` **PASSED**），第 44 个正式功能 |
| 已完成功能数 | **44** |
| 功能清单 | 10 模块、55 功能、90 明细；**✅46 / 🟦22 / ⬜22**（46+22+22=90）；另登记 **ADV 高级能力规划项 8 模块、64 条（ADV-M11—ADV-M18）**——未纳入 0.1.0 验收、不计入 90 明细 ✅/🟦/⬜ 统计、不并入已完成功能数 |
| 后端正式基线 | **12 个模块汇总，1223 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS**（I1 终态候选锁定） |
| 前端正式基线 | **Test Files 126 passed + 1 skipped；Tests 1176 passed + 3 skipped**；typecheck/lint/test/build exit 0（I1 终态候选锁定） |
| 迁移基线 | Flyway **H2 V67（67 migrations）/ PostgreSQL V67（66 migrations）**（I1 V67 一条为加列/回填/种子；V66 已被 P21 iot 迁移占用） |
| 产品行为基线 | Owner Broker 真实双向 MQTT；19 个原子工作项全部 COMPLETED；最终 r3 固定输入 16/16 哈希通过；browser_status=`OPERABLE`；Validator exit=0 |
| 验证基线变更集合 | Server/Web/Flyway/产品行为四组（见上）；不得沿用 v0.0.2-oa 的 1156/V58 旧基线或最后单模块 43 tests 计数 |
| P 编号 | **P21 已核销/完成（2026-09-08）**（只核销本正式方向范围）；**P2、P4 开放、部分实现未核销**；P34/P35/P37/P38/P39 部分实现未核销；其余已核销项不变。审计基准 P 池 57 行、唯一 56 编号（P48 总表/明细双入口同值）；I 索引 54 条、区间 I1—I55 缺 I27，本轮不增删（**I14 已满足/关闭（2026-09-08）**；I38/I39/I40/I45 保持开放） |
| 变更类型记录 | 2026-09-12 I3 阶段三终态同步（阶段级，非版本级）：I3 写为 `COMPLETED（待规划确认，2026-09-12）`、机器状态 `TERMINAL_SYNC_SUBMITTED`；P60 保持 IN_PROGRESS，功能数 44、90 明细计数、P 编号零变化，未发布标签或 Release。此前 2026-09-10 I2 阶段三终态同步经最终复核确认为 `COMPLETED（规划已确认，2026-09-10）`；2026-09-09 目标版本登记更正（0.3.0→0.1.0，Owner 确认） |
| 当前活动正式功能 | `v0.1.0-oa-completion`（P60，XL）：IN_PROGRESS（I1、I2 COMPLETED（规划已确认）；**I3 人工审批与自研流程设计器 COMPLETED（待规划确认，2026-09-12）**；I4—I6 未开始） |
| 当前活动交付任务 | 无独立交付任务（P60 六阶段按方向排期推进） |
| 最近审查 | `product/v0.1.0-oa-completion/receipts/planning-review-stage-i3-v0.1.0-oa-completion-08-passed.md`（I3 功能级验收 PASSED，2026-09-12）\| 历史：`product/v0.1.0-oa-completion/receipts/planning-final-review-terminal-sync-stage-i2-v0.1.0-oa-completion-02-passed.md`（I2 终态最终复核 PASSED，2026-09-10）\| 更早：`product/v0.3.0-oa-completion/receipts/planning-final-review-terminal-sync-stage-i1-v0.3.0-oa-completion-07-passed.md`（I1 终态最终复核 PASSED） |

## 终态与方向归档事实（唯一口径）

- `v0.1.0-oa-completion`（P60 0.1.0 OA 全功能收口）：方向 **READY（2026-09-08）→ IN_PROGRESS**；主方向 `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md`；**I1 COMPLETED（规划已确认，2026-09-09）**（历史验收/终态证据在 `product/v0.3.0-oa-completion/receipts/`，终态同步方向归档 `product/v0.3.0-oa-completion/passed/`）；**I2 低代码表单收口 COMPLETED（规划已确认，2026-09-10）**：规划验收 06 PASSED，终态最终复核 02 PASSED，I2 主方向与终态同步方向均已归档 `product/v0.1.0-oa-completion/passed/`；**I3 人工审批与自研流程设计器 COMPLETED（待规划确认，2026-09-12）**：规划验收 08 PASSED，I3 主方向已归档 `product/v0.1.0-oa-completion/passed/direction-stage-i3-manual-approval-first-party-process-designer.md`，当前唯一执行入口 `ready/direction-stage-i3-terminal-sync.md`，终态同步回执 `receipts/terminal-sync-stage-i3-v0.1.0-oa-completion-01.md`；I3 范围=自研流程设计与查看（完整移除 `bpmn-js`）、定义版本冻结/挂起/激活/安全删除、APPROVE/DISAPPROVE/RETURN/REJECT 独立语义、ALL/ANY/RATIO/VETO 会签、加签/补签/转办/委托/授权代理/撤回/沟通/废弃、时限提醒催办升级、节点函数、意见表单与权限页面链；终态同步合法状态 `COMPLETED（待规划确认，2026-09-12） / TERMINAL_SYNC_SUBMITTED`；I4—I6 未启动。
- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：功能状态 **COMPLETED（规划已确认，2026-09-08）**（阶段三最终复核 `product/p21-iot-device-access/receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md` **PASSED**）；主方向与阶段三方向均已归档 `product/p21-iot-device-access/passed/`。任务登记：`knowledge/features/p21-iot-device-access.md`。
- p21-iot-device-access 交付范围：原生 MQTT 与腾讯 IoT 双通道配置（F01）、连接管理（F01-03）、设备维护（F02-01）、状态监控（F02-02）、Topic 订阅/发布配置（F03）、数据上报（F04-03）、消息日志（F04-04）、规则编排（F05-01）；腾讯实网（真实账号/RequestId/物理设备）按 Owner 本轮免验，不写成实网已验证；M08-F04-01 按钮发送保持🟦、F04-02 定时发送保持⬜、F05-02 指令模板保持⬜。
- `v0.0.2-oa`（v0.0.2 OA 完善）：**COMPLETED（规划已确认，2026-09-07）**，第 **43** 个正式功能（历史点；最终复核裁决 `product/v0.0.2-oa/receipts/planning-final-review-terminal-sync-v0.0.2-oa-03-passed.md`）；P54/P55/P3 随其核销、P2/P4 开放部分实现未核销。登记 `knowledge/features/v0.0.2-oa.md`；方向归档 `product/v0.0.2-oa/passed/`。
- `p4-oa-personal-center-dual-dispatch`（P4 OA 本轮子集）：功能状态 **COMPLETED（规划已确认，2026-09-07）**（历史点；验收事件：功能级 PASSED，规划复验09），第 42 个正式功能；P4 总项开放、部分实现未核销。登记 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`。
- `p59-ch-apaas-project-update`：**COMPLETED（规划已确认，2026-09-05）**、P59 已核销（历史，登记 `knowledge/features/p59-ch-apaas-project-update.md`）。
- 更早历史终态与基线见 `knowledge/history/` 与 `knowledge/feature-reconciliation-index.md`。

## 当前唯一下一动作

**P60 v0.1.0-oa-completion：Planner 终态复核 I3 阶段三终态同步回执 01（`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i3-v0.1.0-oa-completion-01.md`），确认 I3 `COMPLETED` 后再形成 I4 正式阶段方向。** 三仓 I3 归属状态已按各自当前分支核对并完成远端 SHA 回读。（P60 不替代、不提前核销 P2/P4/P26/P31/P34/P35/P37/P38/P39/P47 等既有开放编号。）

## 当前未关闭项入口

- 未关闭业务问题权威注册：`knowledge/known-issues.md`（54 条，I1—I55 区间缺 I27；I14 已满足/关闭）
- 正式功能明细与双向映射：`Smart-WorkFlow-Server/功能清单.md`（90 行业务明细＋文末 ADV 高级能力规划项 64 条）＋ `knowledge/feature-reconciliation-index.md`（90 明细/56 唯一 P/54 I/55 审计 product 目录；ADV 64 条为独立规划项，不并入审计集合）
- P60 方向与定义：`product/v0.1.0-oa-completion/`（ready/direction-*.md、ready/advanced-capability-feature-checklist.md、receipts/）；I1 历史证据 `product/v0.3.0-oa-completion/`
- p21-iot-device-access 交付追踪：`knowledge/features/p21-iot-device-access.md`；方向与回执：`product/p21-iot-device-access/`
- 历史状态与审计链：`knowledge/history/README.md`

## 新会话启动提示词

- 上轮完成：**I3「人工审批与自研流程设计器」功能级验收 PASSED**（`planning-review-stage-i3-v0.1.0-oa-completion-08-passed.md`）；I3 主方向已归档 `passed/direction-stage-i3-manual-approval-first-party-process-designer.md`；I3 阶段三终态同步已执行（回执 `terminal-sync-stage-i3-v0.1.0-oa-completion-01.md`），三仓 I3 归属状态已按各自当前分支核对并回读远端 SHA
- 当前状态：**P60 v0.1.0-oa-completion 为当前活动正式功能（XL，IN_PROGRESS）**；I1 **COMPLETED（规划已确认）**；I2 **COMPLETED（规划已确认，2026-09-10）**；**I3 COMPLETED（待规划确认，2026-09-12）**、机器状态 `TERMINAL_SYNC_SUBMITTED`，当前唯一执行入口 `product/v0.1.0-oa-completion/ready/direction-stage-i3-terminal-sync.md`，待 Planner 终态复核；I4—I6 未开始
- 完成数：清单 **46 / 22 / 22**（90，业务明细零变化）＋ ADV 规划项 64 条（不计入）；正式功能数 **44**
- 正式基线（I3 锁定）：Server 候选 `c18d074`＋运行时 JAR sha256 `74926960ff615681f3064e4061e3622480e8e56fdcfce94caf2d0f12738c73ad`（frozen-f）；`sw-bpm-process` 186/0、`sw-bootstrap` 43/0；全量实际 exit 1，6 例仅位于 IoT `JavaSubprocessSandboxTest`，基线 `f7101c8` 同机 Windows/JDK21 复跑同为 6/7 失败，作为 I3 非回归事实保留；Web 四门（typecheck/lint/test/build）实际 exit 0，I3 最终候选无后续 Web 代码变化；行为/页面/封装证据见 `receipts/evidence/i3-07/`、`evidence/i3-08/`、`evidence/i3-09/`
- 当前唯一下一动作：**Planner 终态复核 I3 阶段三终态同步回执 01，确认 I3 `COMPLETED` 后再形成 I4 正式阶段方向**
- P 编号：P21 已核销（2026-09-08）；P2/P4 开放、部分实现未核销；P34/P35/P37/P38/P39 部分实现未核销；P47 已纳入 I3 但本阶段不核销；P60 版本统筹项（不替代既有编号）
- 功能追踪：`knowledge/features/v0.1.0-oa-completion.md`；映射索引 `knowledge/feature-reconciliation-index.md`
- 未完成边界：P2 其余（计算公式/外部数据源/表单删除/列表配置持久化）；P4 候选（转办/委托/加签/撤回、流程版本/挂起激活）；M08-F04-01 按钮发送 🟦、F04-02 定时发送 ⬜、F05-02 指令模板 ⬜；P34/P35/P37/P38/P39 部分实现未核销；腾讯实网（真实账号/物理设备）按 Owner 免验未做；非零租户登录无受支持入口为认证产品边界；64 条 ADV 高级能力全部 ⬜ 规划登记（未探索未验收，实施需后续独立方向）
