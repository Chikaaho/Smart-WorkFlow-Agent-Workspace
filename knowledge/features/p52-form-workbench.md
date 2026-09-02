# p52-form-workbench（P52 表单设计器工作台与关联流程管理）

> 正式功能；阶段三终态最终复核完成（2026-09-02）。
> 状态：功能级 **PASSED**（2026-09-02，规划功能级最终验收 `planning-final-review-p52-form-workbench-20260902.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-02）**（`planning-terminal-final-review-p52-form-workbench-20260902.md`）。

## 功能目标

把表单设计器顶部区域优化为围绕当前表单的统一工作台：在保持表单身份与编辑上下文的前提下，完成当前表单名称/保存状态/发布状态展示、保存草稿、发布已保存草稿、历史发布版本只读预览、表单设计与关联流程直接切换、关联流程查看/创建/进入管理，并在刷新、深链或重新进入后准确恢复同一表单与所选工作区。

## 交付范围（已锁定，证据见下）

- 顶部工作台：表单身份与状态可见、中部“表单设计/关联流程”切换、右侧“保存/发布/历史版本”；保存五态（未修改/未保存/保存中/保存成功/保存失败）与发布状态（草稿/已发布+版本）；稳定业务标识确定当前表单，零串位。
- 保存与发布：保存只存草稿不隐式发布；发布只作用于最近一次成功保存的当前草稿；未保存修改统一保存/放弃/取消保护；发布沿用既有表单有效性校验，非法列名零发布。
- 历史版本：列表与持久化版本一致（版本号/发布时间/发布状态/可追溯信息）；只读预览带明确“历史版本”标识，退出返回当前冻结发布态；本轮不提供回滚/复制/删除/差异。
- 关联流程：仅返回当前表单关联流程（formKey 过滤，其他 key/伪关联零串入）；创建关联流程自动带入表单身份且服务端持久化校验；复用现有流程管理能力与权限，无假按钮/空态。
- 路由、权限与一致性：F5/重载/深链/多标签/非法/已删除对象/加载竞争/路由参数复用闭环；四类读取权限 403 零泄露、深链明确拒绝且操作区零渲染、管理员正向、跨租户零泄露；不新增同租户实例 ACL；`by-key` 填报运行时端点不绑定设计权限码。
- Mock 与测试资产：核心状态转换与错误语义与真实接口一致，但不替代真实行为证据。

## 验收与证据链

- 功能级最终验收：`product/p52-form-workbench/receipts/planning-final-review-p52-form-workbench-20260902.md`（**PASSED**，12 项验收标准全部通过：工作台身份与零串位、保存五态与失败保留、三入口离开保护、发布当前已保存草稿、历史列表与只读预览、关联流程过滤、关联流程持久化与返回、刷新/深链与隔离、权限一致性、无假按钮/空白/伪关联、回归与质量门、执行边界）。
- 执行完成回执：`product/p52-form-workbench/receipts/completion-p52-form-workbench-20260901.md`。
- 补证回执：`supplement-p52-form-workbench-g1-g6-20260901.md`、`supplement2-p52-r1-r5-20260902.md`、`supplement3-p52-s1-s2-20260902.md`（S1 读取权限拒绝页、S2 管理员流程发布/删除正向对照）。
- 行为证据附件：`product/p52-form-workbench/receipts/R1-load-race/`、`R2-leave-guard/`、`R5-process-perms/`、`S1-read-permission/`、`S2-admin-process-positive/`；方向冲突记录 `R3-direction-conflict/`、`R4-direction-conflict/`（对应轮次合法 `BLOCKED`，未提前写 PASSED/COMPLETED）。

## 规划关键裁决（2026-09-02）

1. 历史版本遵循现有一次性发布模型：只提供已发布快照只读列表/预览，不新增已发布后继续编辑、多次发布、回滚、差异或版本分支。
2. 权限遵循功能权限码与租户隔离：不新增同租户实例 ACL；缺少 `form:design` 的主体不能通过 API 或深链读取工作台身份链；跨租户继续零泄露。
3. `by-key` 填报运行时端点不绑定设计权限码，避免破坏无设计权限用户填写已发布表单的既有链路；该链路不属于 P52 工作台读取入口。

## 阶段三终态（2026-09-02 落值 + 规划终态最终复核 COMPLETED（已确认））

- 已完成功能数 37→**38**；清单 **✅33 / 🟦24 / ⬜33**（三类总数 90 不变；P52 不对应既有 Mxx-Fxx 明细，所有明细状态不变）。
- P52 **已核销/完成**（仅核销 P52）。
- 正式基线：后端 **1002/0/0/0**；前端 **114 files / 1092 tests / 3 skipped**（typecheck/lint/build 通过）；Flyway **H2 V47（47）/ PG V47（46）**（P52 涉及 V47，实际全链终点）。
- 活动功能：无；当前唯一下一动作为**规划比较需求池候选并选择下一唯一正式功能**。

## 已知限制

- 本轮未新增或关闭 registered 已知问题（`knowledge/known-issues.md` 无变化）。
- 历史版本只读，不做回滚/差异/删除/分支；同租户实例级 ACL、`by-key` 填报端点权限归属等按规划裁决维持既有语义，不作 P52 扩张。

## 证据路径

| 类型 | 路径 |
|------|------|
| 功能级验收 | `product/p52-form-workbench/receipts/planning-final-review-p52-form-workbench-20260902.md` |
| 终态最终复核 | `product/p52-form-workbench/receipts/planning-terminal-final-review-p52-form-workbench-20260902.md` |
| 执行完成回执 | `product/p52-form-workbench/receipts/completion-p52-form-workbench-20260901.md` |
| 补证回执 | `product/p52-form-workbench/receipts/supplement-p52-form-workbench-g1-g6-20260901.md`、`supplement2-p52-r1-r5-20260902.md`、`supplement3-p52-s1-s2-20260902.md` |
| 行为证据附件 | `product/p52-form-workbench/receipts/R1-load-race/`、`R2-leave-guard/`、`R5-process-perms/`、`S1-read-permission/`、`S2-admin-process-positive/` |
| 主方向 | `product/p52-form-workbench/passed/direction-p52-form-workbench.md` |
| 终态同步方向 | `product/p52-form-workbench/passed/direction-p52-form-workbench-stage3.md` |
