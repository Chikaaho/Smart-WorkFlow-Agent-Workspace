# 当前状态摘要

> 规划侧最新同步点：2026-08-29（GOV-AUDIT-13 规划终态复核通过）；正式计数与基线权威为 `knowledge/current-status.md`。

- 验收审计 `minimal-closure-first-acceptance`：`COMPLETED`（已确认，2026-08-29，不新增正式功能）。正式基线后端 955/0/0/0 agent346、前端 110f/1060t/0skipped、Flyway H2 V44（44）/PG V44（43）；三份方向归档 `product/minimal-closure-first-acceptance/passed/`。
- 正式功能 `form-data-import-export`：`COMPLETED`（已确认，2026-08-29，第 36 个）。P32 / M03-F04-02 表单数据导入导出，已全部锁定。
- 终态值：清单 ✅32/🟦25/⬜33；功能数 36；P/I 编号不新增/不核销/不改变。
- 补充任务与治理闭环（均已 COMPLETED 已确认，2026-08-29）：三仓 README 重构与现状同步（未提交/未推送）；Admin 治理一致性审计（历史发现 16 项）；Admin 治理修复（可修项全部关闭）；GOV-AUDIT-13（业务状态、目录和摘要已一致，方向已归档 `passed/`）。
- Owner 于 2026-08-29 扩展 P21：完整 IoT 设备管理需覆盖通用物模型/行为管理、流程选择设备并触发已配置功能、内置 Provider 与自定义 Adapter 统一契约；已登记 `todo/requirement-pool.md`，P21 仍为部分关闭、未核销，尚未选为活动正式功能。
- 当前唯一活动正式功能：无；`v0.0.1-beta` 发布阻断修复已通过规划验收，B1 前端 1060/1060、B2 `SW_CIPHER_KEY` 首次启动、B3 Redis 503/200/401 三态均已关闭。修复方向已归档 `product/v0.0.1-beta-release-readiness/passed/`。
- 当前唯一下一动作：Owner 对根知识仓、后端仓、前端仓的精确提交范围作 Git 授权；形成干净候选 commit 后执行最终发布就绪复核。未冻结候选前不得创建 tag。
