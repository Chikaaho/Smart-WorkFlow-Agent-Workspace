# p4-oa-personal-center-dual-dispatch — P4 OA个人中心与流程双通道（本轮子集）

> 本文件为该交付的功能追踪登记；阶段三终态同步方向 `product/p4-oa-personal-center-dual-dispatch/ready/direction-p4-terminal-sync.md`（仅 Planner 复核通过后移 passed）。历史方向与回执见 `product/p4-oa-personal-center-dual-dispatch/`。

| 字段 | 值 |
|---|---|
| 功能标识/名称 | p4-oa-personal-center-dual-dispatch / P4 OA个人中心与流程双通道（本轮子集） |
| 功能状态 | COMPLETED（2026-09-07 功能级 PASSED，规划复验09 `planning-review-p4-09-passed.md`；阶段三终态同步完成日期 2026-09-07，待 Planner 全文复核确认） |
| 完成日期 | 2026-09-07 |
| 计数 | 第 **42** 个正式业务功能（41＋本轮子集 1，不另建 P 编号）；清单 **✅34 / 🟦28 / ⬜28**（90，零行升降级；M04-F05-01 仍 🟦） |
| P4 总项 | **开放、部分实现，未整体核销**；本轮子集完成，整体 OA 里程碑不因本子集标全完成 |
| 后端正式基线 | 174 份 Surefire 报告 / **1128 tests / 0 failures / 0 errors / 0 skipped**；MVN_EXIT=0（`receipts/evidence/p0-result-query/p4-p0result-per-report.txt`、`p4-full-test-run7.log`） |
| 前端正式基线 | **121 files passed + 1 skipped / 1153 tests passed + 3 skipped**；VITEST_EXIT=0，ESLINT/TSC/BUILD_EXIT=0（lint 验证范围按已锁原件注明，不扩称全仓零警告；沿 `planning-review-p4-07.md` L27） |
| 迁移正式基线 | Flyway **H2 V55（55 条）/ PostgreSQL V55（54 条）**（真实全量日志支持） |
| 主方向归档 | `product/p4-oa-personal-center-dual-dispatch/passed/direction-p4-oa-personal-center-dual-dispatch.md` |
| 配套方向归档 | `product/p4-oa-personal-center-dual-dispatch/passed/flow-platform-capability-boundary.md` |
| 关键回执/证据 | `receipts/completion-p4-supplement-06/07/08/09.md`；`receipts/planning-review-p4-06/07/08/09-passed.md`；`receipts/evidence/last-three-gaps/`、`receipts/evidence/p0-result-query/` |

## 交付范围（本轮子集，全部 PASSED）

- 表单可见范围、普通表单发起、草稿免必填保存、提交校验；四入口（我的待办/我的已办/我发起的/发起入口，含 0 草稿空态入口修复）。
- 普通可靠异步通道及 MQ 替换边界；P0 单次同步通道：有界等待、实际启动完成后才返回成功、超时返回受理态（ACCEPTED）并可凭原 commandId 经 `GET /workflow/commands/{id}` 的 `flowStart` 字段回查子启动处理中/成功/失败及原因；同意图幂等不新建第二流程。
- 命令队列租约令牌（complete/reject/failAndScheduleRetry 全分支原子领取权约束）、同命令确认丢失恢复、真实历史已办过滤与同时间确定性分页、跨租户读隔离、无动作节点不伪造。

## 边界与剩余（保持开放）

- 流程中心（管理员管理全部表单流程、普通用户按可见分类浏览并选择业务流程发起的双视角）、分类目录/筛选/聚合、抄送我的查询/催办入口：继续待办，与 P55 协同规划（`passed/flow-platform-capability-boundary.md`）。
- P4 总项未整体核销；M04-F05-01 保持 🟦。
