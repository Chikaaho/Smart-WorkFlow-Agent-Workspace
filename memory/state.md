# 当前状态摘要

> 规划侧最新同步点：2026-09-01；正式计数与基线权威为 `knowledge/current-status.md`。

- 正式功能 `p45-login-security`：**COMPLETED（已确认，2026-09-01）**，第37个。P45 / M02-F06-01完成RSA-OAEP、验证码/有效期/机器时间固定校验、Redis一次性挑战与防重放、密钥轮换、默认租户`tenant=0`隔离、Cookie Path及F5/深链/退出恢复；access仅内存、refresh使用HttpOnly Cookie。
- 终态值：清单 **✅33/🟦24/⬜33**（M02-F06-01 🟦→✅）；功能数 **37**；P45 **已核销/完成**。
- 正式基线：后端 **979/0/0/0（agent346）**、前端 **110f/1062t/0skipped**、Flyway **H2 V44（44）/PG V44（43）**；V45/V46披露但不晋级。
- 四份P45方向均归档 `product/p45-login-security/passed/`。
- 当前活动业务功能：**无**；当前唯一下一动作：规划比较并选择下一唯一正式功能。
- 历史记录（COMPLETED 已确认，2026-08-29）：`minimal-closure-first-acceptance`（验收审计不新增正式功能，清单 32/25/33、功能数 36）；三仓 README 同步、Admin 治理审计/修复、GOV-AUDIT-13 全部闭环。
- P51 Agent Coding Engine 解耦：COMPLETED（已确认，2026-08-31），不新增 OA 正式业务功能，OA 技术栈与治理不受影响。
- P21 保持部分关闭、未核销（真实腾讯账号与物理设备现场联调、原生 MQTT、完整设备管理），尚未选为活动正式功能。
