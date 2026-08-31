# 当前状态摘要

> 规划侧最新同步点：2026-08-30（`v0.0.1-beta` Git 发布已通过规划验收）；正式计数与基线权威为 `knowledge/current-status.md`。

- 验收审计 `minimal-closure-first-acceptance`：`COMPLETED`（已确认，2026-08-29，不新增正式功能）。正式基线后端 955/0/0/0 agent346、前端 110f/1060t/0skipped、Flyway H2 V44（44）/PG V44（43）；三份方向归档 `product/minimal-closure-first-acceptance/passed/`。
- 正式功能 `form-data-import-export`：`COMPLETED`（已确认，2026-08-29，第 36 个）。P32 / M03-F04-02 表单数据导入导出，已全部锁定。
- 终态值：清单 ✅32/🟦25/⬜33；功能数 36；P/I 编号不新增/不核销/不改变。
- 补充任务与治理闭环（均已 COMPLETED 已确认，2026-08-29）：三仓 README 重构与现状同步；Admin 治理一致性审计（历史发现 16 项）；Admin 治理修复（可修项全部关闭）；GOV-AUDIT-13（业务状态、目录和摘要已一致，方向已归档 `passed/`）。
- Owner 于 2026-08-29 扩展 P21：完整 IoT 设备管理需覆盖通用物模型/行为管理、流程选择设备并触发已配置功能、内置 Provider 与自定义 Adapter 统一契约；已登记 `todo/requirement-pool.md`，P21 仍为部分关闭、未核销，尚未选为活动正式功能。
- 当前唯一活动方向：P51 Agent Coding Engine 解耦，方向位于 `product/p51-agent-coding-engine-decoupling/ready/`；目标是 `main` 通用化、`develop-sw` 保留 Smart-WorkFlow/OA 示例。`v0.0.1-beta` 发布阻断 B1～B3 已通过规划验收。已发布代码为后端 `ba59539`、前端 `f3a8988`；根 knowledge 仓当前示例起点为 `a86cbbd`。
- 发布状态：`RELEASED`。后端远端 tag peeled=`ba5953977ef8b8684e0d551216283727b7540ad4`，前端远端 tag peeled=`f3a89888e022d8b1c9de658e5a6cb5f97a8a9a2b`；根 knowledge 仓无该 tag。
- 当前唯一下一动作：执行角色按 P51 方向完成分支解耦、通用 Engine 边界整理和实例隔离验证；远端发布另行授权。
