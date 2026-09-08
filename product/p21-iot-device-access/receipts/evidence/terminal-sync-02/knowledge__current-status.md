# 当前项目状态

> 唯一当前快照；截至/同步点：2026-09-08，`p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）功能状态 **COMPLETED（待规划确认，2026-09-08）**（验收事件：功能级 PASSED，2026-09-08 规划验收08 `planning-review-p21-iot-08-passed.md`）；阶段三终态同步回执 `product/p21-iot-device-access/receipts/terminal-sync-p21-iot-device-access-01.md` **待 Planner 复核确认**（审核信息，不替代已授权功能状态）。历史快照见 `knowledge/history/`。
> 冲突处理：本文件为当前功能状态、计数、活动功能、正式基线与唯一下一动作的权威来源。

## 当前快照

| 维度 | 当前值 |
|---|---|
| 业务功能状态 | 无活动正式业务功能；正式业务功能数 **44**（`p21-iot-device-access` 为第 44 个，43＋1，功能状态 COMPLETED（待规划确认）2026-09-08） |
| p21-iot-device-access 交付状态 | `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：**功能状态 COMPLETED（待规划确认，2026-09-08）**（验收事件：功能级 PASSED，规划验收08）；终态同步回执 `receipts/terminal-sync-p21-iot-device-access-01.md` 待 Planner 复核 |
| 已完成功能数 | **44**（43＋本轮 1） |
| 功能清单 | 10 模块、55 功能、90 明细；**✅46 / 🟦22 / ⬜22**（46+22+22=90）；M08 本轮 10 行 🟦/⬜→✅（F01-01/02/03、F02-01/02、F03-01/02、F04-03/04、F05-01），其余 80 行零变化 |
| 后端正式基线 | **12 个模块汇总，1182 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS**（来源 `product/p21-iot-device-access/receipts/completion-p21-iot-08.md` 等锁定证据） |
| 前端正式基线 | **Test Files 124 passed + 1 skipped；Tests 1168 passed + 3 skipped**；typecheck/lint/test/build exit 0 |
| 迁移基线 | Flyway **H2 V66（66 migrations）/ PostgreSQL V66（65 migrations）** |
| 产品行为基线 | Owner Broker 真实双向 MQTT；19 个原子工作项全部 COMPLETED；最终 r3 固定输入 16/16 哈希通过；browser_status=`OPERABLE`；Validator exit=0 |
| 验证基线变更集合 | Server/Web/Flyway/产品行为四组（见上）；不得沿用 v0.0.2-oa 的 1156/V58 旧基线或最后单模块 43 tests 计数 |
| P 编号 | **P21 已核销/完成（2026-09-08）**（只核销本正式方向范围）；**P2、P4 开放、部分实现未核销**；P34/P35/P37/P38/P39 部分实现未核销；其余已核销项不变。审计基准 P 池 57 行、唯一 56 编号（P48 总表/明细双入口同值）；I 索引 54 条、区间 I1—I55 缺 I27，本轮不增删（**I14 已满足/关闭（2026-09-08）**；I38/I39/I40/I45 保持开放） |
| 变更类型记录 | 本次同步为 p21-iot-device-access 阶段三终态同步：功能数 43→44、清单 M08 十行升✅（36→46、26→22、28→22，总和 90）、P21 核销、I14 关闭、四组基线更新（Server/Web/Flyway/产品行为） |
| 当前活动正式功能 | 无（已完成条目不同时列作活动功能） |
| 当前活动交付任务 | 无（p21-iot-device-access 终态同步待规划复核，不作为活动任务登记） |
| 最近审查 | `product/p21-iot-device-access/receipts/planning-review-p21-iot-08-passed.md`（**A1—A8 功能级 PASSED**）\| 历史：`planning-review-v0.0.2-oa-06-passed.md`（v0.0.2-oa A1—A8 功能级 PASSED）、`planning-review-p4-09-passed.md`（P4 子集功能级 PASSED） |

## 终态与方向归档事实（唯一口径）

- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：功能状态 **COMPLETED（待规划确认，2026-09-08）**（验收事件：功能级 PASSED，规划验收08）；主方向已归档 `product/p21-iot-device-access/passed/direction-p21-iot-device-access.md`；阶段三终态同步方向 `product/p21-iot-device-access/ready/direction-p21-iot-device-access-terminal-sync.md`（仅 Planner 复核通过后移 passed）。任务登记：`knowledge/features/p21-iot-device-access.md`。
- p21-iot-device-access 交付范围：原生 MQTT 与腾讯 IoT 双通道配置（F01）、连接管理（F01-03）、设备维护（F02-01）、状态监控（F02-02）、Topic 订阅/发布配置（F03）、数据上报（F04-03）、消息日志（F04-04）、规则编排（F05-01）；腾讯实网（真实账号/RequestId/物理设备）按 Owner 本轮免验，不写成实网已验证；M08-F04-01 按钮发送保持🟦、F04-02 定时发送保持⬜、F05-02 指令模板保持⬜。
- `v0.0.2-oa`（v0.0.2 OA 完善）：**COMPLETED（规划已确认，2026-09-07）**，第 **43** 个正式功能（历史点；最终复核裁决 `product/v0.0.2-oa/receipts/planning-final-review-terminal-sync-v0.0.2-oa-03-passed.md`）；P54/P55/P3 随其核销、P2/P4 开放部分实现未核销。登记 `knowledge/features/v0.0.2-oa.md`；方向归档 `product/v0.0.2-oa/passed/`。
- `p4-oa-personal-center-dual-dispatch`（P4 OA 本轮子集）：功能状态 **COMPLETED（规划已确认，2026-09-07）**（历史点；验收事件：功能级 PASSED，规划复验09），第 42 个正式功能；P4 总项开放、部分实现未核销。登记 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`。
- `p59-ch-apaas-project-update`：**COMPLETED（规划已确认，2026-09-05）**、P59 已核销（历史，登记 `knowledge/features/p59-ch-apaas-project-update.md`）。
- 更早历史终态与基线见 `knowledge/history/` 与 `knowledge/feature-reconciliation-index.md`。

## 当前唯一下一动作

**等待 Owner 选择下一需求。**（P21 已完成并通过规划验收，阶段三终态同步回执待 Planner 复核确认；不自动启动下一编号。）

## 当前未关闭项入口

- 未关闭业务问题权威注册：`knowledge/known-issues.md`（54 条，I1—I55 区间缺 I27；I14 已满足/关闭）
- 正式功能明细与双向映射：`Smart-WorkFlow-Server/功能清单.md`（90 行）＋ `knowledge/feature-reconciliation-index.md`（90 明细/56 唯一 P/54 I/55 审计 product 目录）
- p21-iot-device-access 交付追踪：`knowledge/features/p21-iot-device-access.md`；方向与回执：`product/p21-iot-device-access/`
- 历史状态与审计链：`knowledge/history/README.md`

## 新会话启动提示词

- 上轮完成：P21 IoT 设备接入、受控脚本与流程联动（`p21-iot-device-access`，第 44 个正式功能）**功能状态 COMPLETED（待规划确认，2026-09-08）**（验收事件：功能级 PASSED，规划验收08）；主方向已归档 `passed/`；终态同步回执待规划复核
- 当前状态：无活动业务功能、无活动交付任务；p21-iot-device-access 终态同步待规划复核
- 完成数：清单 **46 / 22 / 22**（90，M08 十行升 ✅）；正式功能数 **44**
- 正式基线（2026-09-08，p21-iot-device-access 验收快照）：Server 12 模块汇总 **1182 tests / 0 failures / 0 errors / 0 skipped（BUILD SUCCESS）**、Web **124 files passed + 1 skipped / 1168 tests passed + 3 skipped（typecheck/lint/test/build exit 0）**、Flyway **H2 V66（66）/PG V66（65）**、产品行为 Owner Broker 双向 MQTT/19 原子工作项 COMPLETED/r3 16/16 哈希/browser OPERABLE
- 当前唯一下一动作：**等待 Owner 选择下一需求**
- P 编号：P21 已核销（2026-09-08）；P2/P4 开放、部分实现未核销；P34/P35/P37/P38/P39 部分实现未核销
- 功能追踪：`knowledge/features/p21-iot-device-access.md`；映射索引 `knowledge/feature-reconciliation-index.md`
- 未完成边界：P2 其余（计算公式/外部数据源/表单删除/列表配置持久化）；P4 候选（转办/委托/加签/撤回、流程版本/挂起激活）；M08-F04-01 按钮发送 🟦、F04-02 定时发送 ⬜、F05-02 指令模板 ⬜；P34/P35/P37/P38/P39 部分实现未核销；腾讯实网（真实账号/物理设备）按 Owner 免验未做；非零租户登录无受支持入口为认证产品边界
