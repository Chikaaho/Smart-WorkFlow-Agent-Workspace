# 当前状态摘要

> 规划侧最新同步点：2026-09-01；正式计数与基线权威为 `knowledge/current-status.md`。

- 验收审计 `minimal-closure-first-acceptance`：`COMPLETED`（已确认，2026-08-29，不新增正式功能）。正式基线后端 955/0/0/0 agent346、前端 110f/1060t/0skipped、Flyway H2 V44（44）/PG V44（43）；三份方向归档 `product/minimal-closure-first-acceptance/passed/`。
- 正式功能 `form-data-import-export`：`COMPLETED`（已确认，2026-08-29，第 36 个）。P32 / M03-F04-02 表单数据导入导出，已全部锁定。
- 终态值：清单 ✅32/🟦25/⬜33；功能数 36；P/I 编号不新增/不核销/不改变。
- 补充任务与治理闭环（均已 COMPLETED 已确认，2026-08-29）：三仓 README 重构与现状同步；Admin 治理一致性审计（历史发现 16 项）；Admin 治理修复（可修项全部关闭）；GOV-AUDIT-13（业务状态、目录和摘要已一致，方向已归档 `passed/`）。
- Owner 于 2026-08-29 扩展 P21：完整 IoT 设备管理需覆盖通用物模型/行为管理、流程选择设备并触发已配置功能、内置 Provider 与自定义 Adapter 统一契约；已登记 `todo/requirement-pool.md`，P21 仍为部分关闭、未核销，尚未选为活动正式功能。
- 发布状态：`v0.0.1` 正式版已发布（Owner 2026-08-31 确认）。规划侧当前只记录发布事实；本次正式版的远端 tag、提交映射与发布回执未在本摘要中登记，不从既有发布快照推定。
- P51 Agent Coding Engine 解耦：`COMPLETED（已确认，2026-08-31）`。main 正式历史已完成规划功能级 `PASSED`、阶段三 `COMPLETED` 与 Owner 授权发布；当前远端 `main=e0711fb`、`develop-sw=a2b8342`。终态对账裁决位于 `product/p51-agent-coding-engine-decoupling/receipts/planning-final-reconciliation-p51-main-terminal-authority-03.md`。
- P51 属 Engine 治理与仓库解耦，不新增 OA 正式业务功能；OA 功能数 36、清单 ✅32/🟦25/⬜33 保持不变。main 的功能数 0、清单 0/0/0 是通用 Engine 初始空状态，不覆盖 develop-sw 的 OA 业务计数。
- 当前无活动正式功能。唯一下一动作：规划角色从需求池选择下一个唯一功能；P51 不再重复修正、补证或阶段三同步。
