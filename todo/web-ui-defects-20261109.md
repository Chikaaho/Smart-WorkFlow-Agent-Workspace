# Web 界面缺陷（2026-11-09 登记，等下一个 Web 补丁）

来源：P66 发布后截图审查 `product/multi-database-compat/receipts/planning-review-final-03.md` §4。
Owner 2026-11-09 裁决：P66 先结束；这几项留到下一个 Web 补丁再修。
**2026-11-10 已排期**：Web 0.3.7 补丁，方向 `product/web-037-patch/ready/direction-web-037-patch.md`。
**2026-11-10 0.4.1/0.3.8 结果**：W-c 由 Server 0.4.1 补齐（`opinionFields`/`assigneeDept`），Web 会签弹窗显示摘要与部门；W-a2 连线左右接点、fit 与 ≥12px 标签；W-b2 长表单复测；W-e 列表时间统一。三张 README 图已重拍并回读 200。UAT 复测与发布事实见 `product/approval-record-patch/receipts/execution-041-02.md`。

**2026-11-10 结果**：W-a、W-b、W-d 已在 0.3.7 修复并在 UAT 实测（回执 `execution-037-01.md`/`execution-037-02.md`）。**W-c 未完成**：任务详情接口历史缺 `opinionFields`（`BpmTodoController` 未接 `resolveOpinionFields`），DTO 无 `assigneeDept`，必须改 Server；是否发 Server 0.4.1 待 Owner 裁决。README 补图：`agent-graph.png`、`sample-b.png` 完成，`approval-detail.png` 依赖 W-c 修复后重拍。

| 编号 | 缺陷 | 位置/线索 | 影响 |
|---|---|---|---|
| W-a | 智能体编排画布上的节点没有外框和底色，只显示文字标签 | `src/adapters/flow-graph/index.ts` 只引入了 `@vue-flow/core/dist/style.css`，没有引入 `theme-default.css`；图里的节点类型（START/KNOWLEDGE/LLM/CONDITION 等）也没有自定义节点组件 | 编排界面基本看不清 |
| W-b | 任务详情页 `/workflow/task/:id` 在 1440×900 下，`.instance-flow-panel` 的计算高度为 0（里面的 `.el-tabs` 有 447px，内容被裁掉了） | 任务详情页布局 | 审批人看不到流转记录和审批详情页签 |
| W-c | 会签记录弹窗的“动作/意见”列显示意见表单名（如“自定义审批表单”），不是意见摘要；“所属部门”整列显示 `-` | 会签记录弹窗；例如 A 流程 `YJ-20261108-008` 中“分公司技术委员会会签”这一步 | 看不到会签意见 |
| W-d | 流程实例详情的“发起时间”、审批记录的“开始/完成时间”直接显示 ISO 原文，还带微秒（如 `2026-11-08T13:23:30.73`）。0.3.4 只修了意见摘要里的时间 | 流程监控 → 实例详情抽屉 | 显示不规范 |

## 修复后要补的事

- 在 UAT 上重拍 `docs/assets/readme/agent-graph.png`（智能体编排，节点完整，打开属性面板）和 `approval-detail.png`（审批详情，换一个与 `sample-a.png` 不同的视角），放回 README。规格与 P66 Z1 一致：Playwright 1440×900、DPR 2，单张不超过 500KB。
- 顺带把 Server README“临届停机线”改为“临界”（final-11 §1）。
- 顺带可以修正 `sample-b.png`：顶部那行节点被裁掉，左侧菜单高亮在“待办任务”上。

## 不处理的项

- 流程中心列表里的测试流程（`0.1.5验收流程`、`流程版本1`）：Owner 2026-11-09 定为不处理，演示时不点开就行。

## 进度（2026-11-10 规划验收）

0.3.7 已修 W-d 与 W-a 节点样式；W-c、W-a2（连线/缩放）、W-b2（原场景补测）、W-e（列表发起时间）与三张 README 图转 Server 0.4.1 + Web 0.3.8：`product/approval-record-patch/passed/direction-server-041-web-038.md`。

## 观察（2026-11-10，未排期）

- 「实例监控干预」页：发起时间 ISO 带微秒、状态英文（APPROVED/WITHDRAWN）、流程定义显示内部 key（`product/v1.0.0-release/receipts/planning-review-100-01.md` §5，1.0.0 可顺带）。
- 任务详情页：底部操作栏（「更多」按钮）浮在页面中间，遮住明细表内容（`product/v1.0.0-release/receipts/evidence/u3_task_detail_table.png`，`planning-review-100-04.md` §4）。
- 流程监控列表：发起人筛选是数字输入框，最小值 1，无法筛出 IoT 实例（发起人 id 0），也不能按姓名选（`execution-100-05.md` §9-4）。
- ~~流程监控列表：IoT 触发的实例「发起人」显示为 `0`~~ 已在 1.0.0 F4 修复（显示「系统（IoT）」）（`product/approval-record-patch/receipts/planning-review-041-01.md` §5）。
