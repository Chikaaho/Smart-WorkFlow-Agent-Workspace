# 当前状态摘要

> 规划侧最新同步点：2026-09-03；正式计数与基线权威为 `knowledge/current-status.md`。

- 正式功能 `p57-bpm-node-extension`：**COMPLETED（已确认，2026-09-03）**，第40个。P57 BPM Engine 统一流程节点扩展能力：统一节点契约/启动发现唯一注册/fail-fast/发布确定性拒绝/前端统一消费/fail-closed/隔离扩展节点全链证明；十二项验收全过；不对应既有明细、90项明细状态零变化。
- 终态值：功能数 39→**40**；清单 **✅34/🟦23/⬜33**（34+23+33=90）；P57 **已核销**。
- 正式基线：后端 **1015/0/0/0**（全量147份Surefire XML，BUILD SUCCESS）＋P57聚焦 **21/0/0/0**、前端 **116f passed + 1 skipped / 1104t passed + 3 skipped**、Flyway **H2 V47（47）/PG V47（46）**（无新增迁移）。
- 主方向与阶段三方向均已归档 `product/p57-bpm-node-extension/passed/`。
- 当前活动业务功能：**无**。边界：生产能力目录只有 START/APPROVAL/END、验证 fixture 零生产命中；非零租户登录无受支持入口为认证产品边界，不纳入 P57 完成声明。当前唯一下一动作：**规划进入 P58 范围澄清（确定首批具体节点及各节点业务语义），Owner 确认前不下发 P58 正式实现方向**。
- 前一功能（历史语境）：`p56-form-grid-layout` COMPLETED（已确认，2026-09-02），第39个；基线 1004/0/0/0（全量）＋聚焦23/0/0/0、115f/1097t/3sk＋聚焦3 files/23 tests、H2/PG V47；M03-F01-01 🟦→✅、P46一并核销；`p52-form-workbench` COMPLETED（已确认，2026-09-02），第38个；基线 1002/0/0/0、114f/1092t/3sk；P52已核销。
- 历史记录（COMPLETED 已确认，2026-08-29）：`minimal-closure-first-acceptance`（验收审计不新增正式功能，清单 32/25/33、功能数 36）；三仓 README 同步、Admin 治理审计/修复、GOV-AUDIT-13 全部闭环。
- P51 Agent Coding Engine 解耦：COMPLETED（已确认，2026-08-31），不新增 OA 正式业务功能。
- P21 保持部分关闭、未核销（真实腾讯账号与物理设备现场联调、原生 MQTT、完整设备管理），尚未选为活动正式功能；P2 其余缺口继续开放；P58 待范围澄清未启动。
