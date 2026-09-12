# 当前状态摘要

> 当前规划（2026-09-12）：P60 `v0.1.0-oa-completion`为 **P0 / XL / IN_PROGRESS**。I1、I2均 **COMPLETED（规划已确认）**；I3回执09经规划验收08确认功能级 **PASSED**，阶段三终态同步已执行，I3写为 **COMPLETED（待规划确认，2026-09-12）**、机器状态 `TERMINAL_SYNC_SUBMITTED`。R8c真实RETURN链已证明A-R1→B-RETURN-R1→A-R2→B-R2、四份意见、零主表反写与单一终态；i3-09 manifest 13/13、5xx=0、Validator=0。R6事务缺陷修复（Server `c18d074`，frozen-f/JAR `74926960…`）及IoT 6例Windows/JDK21环境性非回归裁决继续锁定。I3主方向已归档，当前唯一入口为终态同步方向；下一动作=Planner终态复核同步回执01，确认后形成I4方向；复核前不写I3规划已确认、不开始I4。正式功能数44、清单✅46/🟦22/⬜22、P编号均不变。

> 最近完成基线：P21 **COMPLETED（规划已确认，2026-09-08）**。功能44、清单✅46/🟦22/⬜22、P21核销、I14关闭均锁定；正式计数以 `knowledge/current-status.md` 为准。

> 历史（2026-09-05）：P59 COMPLETED（规划已确认）、已核销，两个方向归档 passed。knowledge-full-reconciliation COMPLETED（已确认，2026-09-04）。历史细节见 knowledge/history 与 features/。

- `v0.1.0-oa-completion`（P60，P0）：**IN_PROGRESS**。I1、I2 **COMPLETED（规划已确认）**；I3功能级 **PASSED**，阶段三终态同步已执行（`COMPLETED（待规划确认，2026-09-12）`、`TERMINAL_SYNC_SUBMITTED`），当前唯一入口`direction-stage-i3-terminal-sync.md`，下一动作=Planner终态复核回执01；I4—I6未开始。正式功能数与清单计数不变。
- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：**COMPLETED（规划已确认，2026-09-08）**，第 **44** 个正式功能。交付 M08 十行升✅（F01-01/02/03、F02-01/02、F03-01/02、F04-03/04、F05-01）；F04-01 保持🟦、F04-02/F05-02 保持⬜；P21 已核销、I14 已满足/关闭（腾讯实网按 Owner 免验）。主方向与阶段三方向均归档 `product/p21-iot-device-access/passed/`。
- `v0.0.2-oa`（v0.0.2 OA 完善）：**COMPLETED（规划已确认，2026-09-07）**，第 **43** 个正式功能（历史点）。交付 A1—A8；P3/P54/P55 核销、P2/P4 开放。登记 `knowledge/features/v0.0.2-oa.md`。
- 终态值：功能数 **44**；清单 **✅46/🟦22/⬜22**（90，零变化）；**P21 已核销（2026-09-08）**；P2/P4 开放部分实现未核销、P34/P35/P37/P38/P39 部分实现未核销，P47 已纳入 I3 但未核销；I 集合 54 条不增删（**I14 已满足/关闭**、I38/I39/I40/I45 保持开放）。
- 历史功能（均已确认，详见 knowledge/history 与 features/）：`v0.0.2-oa` 第 43 个（2026-09-07）；`p4-oa-personal-center-dual-dispatch` 第 42 个（2026-09-07，P4 总项仍开放）；P59 统一交付（2026-09-05 确认）；`p58-workflow-node-capabilities` 第 41 个；`p57-bpm-node-extension` 第 40 个；`p56-form-grid-layout` 第 39 个＋P46；`p52-form-workbench` 第 38 个；`p45-login-security` 第 37 个；更早见 history。
- 发布终态（I3 终态同步）：Workspace `develop-sw`、Server `develop=c18d074…`（父 `f7101c8`，运行时 JAR `74926960…`）、Web `develop=192e0647…` 已完成远端回读；Server/Web 的 I3 既有提交已位于远端当前分支，只记录包含关系、未制造空提交。I2 时点 SHA（`afec348…`/`7342de3…`/`5dfd6ee…`）与更早时点为历史锁定；不创建 0.1.0 标签或 Release。
- P 剩余边界：P2 其余（计算公式/外部数据源/表单删除/列表配置持久化）；P4 候选（转办/委托/加签/撤回、流程版本/挂起激活）；M08-F04-01 🟦、F04-02/F05-02 ⬜；P34/P35/P37/P38/P39 剩余；腾讯实网（真实账号/物理设备）免验未做。
