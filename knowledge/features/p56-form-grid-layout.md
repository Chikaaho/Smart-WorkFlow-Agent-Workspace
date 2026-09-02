# p56-form-grid-layout（P56 表单设计器 24 列网格布局）

> 正式功能；阶段三终态最终复核完成（2026-09-02）。
> 状态：功能级 **PASSED**（2026-09-02，规划功能级最终验收 `planning-review-p56-form-grid-layout-04-passed.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-02）**（`planning-final-review-p56-stage3-20260902.md`）。

## 功能目标

将表单设计器升级为确定性的 24 列网格布局。设计者像排列格子一样拖动组件、调整每个组件 1—24 列的横向宽度，并在设计、预览、填写和重新进入时获得一致布局；系统从左到右、从上到下自动排布，纵向尺寸由组件内容决定。

## 交付范围（已锁定，证据见回执）

- 24 列布局语义：每个表单页面横向 24 列；组件列宽为 1—24 整数；新加入组件立即获得合法列宽；同行累计放不下时按确定规则换行。
- 拖动与自动排布：拖动改变顺序和所在行，占位反馈、释放落点与预览一致；新增/移动/删除/宽度变化后按确定规则从左到右、从上到下紧凑重排，不产生可填充空洞、丢失、重复或覆盖。
- 组件宽度调整：1—24 任一合法整数；调整后整行和后续行即时重排；非法值（非整数/零/负/超 24）不得静默形成不可渲染数据。
- 纵向布局：高度由内容、校验提示和交互状态自动决定，按行排列；同行高度不一致不重叠、不遮挡、不截断后续行。
- 全链一致性：设计态、保存后重新进入、历史只读预览、发布前后预览与实际填写采用一致语义；配置持久化后刷新不丢失；不同表单布局相互隔离，深链/多标签不串位；既有校验与表单权限继续成立。

## 验收与证据链

- 功能级最终验收：`product/p56-form-grid-layout/receipts/planning-review-p56-form-grid-layout-04-passed.md`（**PASSED**；十项验收标准最终结论逐项锁定：网格与边界、合法初始状态、拖动排序、自动换行、紧凑重排、纵向自适应、持久化一致、表单隔离、既有主链回归、真实页面质量）。
- 规划审查链：`planning-review-p56-form-grid-layout-01/02/03.md`（历轮收敛）、`planning-execution-prompt-p56-form-grid-layout-01/02.md`（一级/二级执行提示）。
- 执行回执：`execution-completion-p56-form-grid-layout-20260902.md`、`execution-supplement-p56-form-grid-layout-20260902.md`、`execution-supplement-p56-form-grid-layout-20260902-g3-g6.md`、`execution-supplement-p56-form-grid-layout-20260902-g6a.md`（G6-A 保存五态与失败零写入）、`test-p56-form-grid-layout-20260902.md`。
- 规划裁决（审查04）：P56 功能级验收通过，阶段三后核销 P56；P56 完整覆盖需求池 P46 唯一剩余缺口（表单设计器无栅格配置、渲染端硬编码 2 列），P46 一并标记由 P56 完成并核销，不产生第二个正式功能计数；`M03-F01-01 表单设计器拖拽`由 🟦 升 ✅。

## 规划终态裁决（审查 04 锁定）

1. P56/P46 是同一交付对既有缺口和新增跟踪号的两个索引，只增加一个正式功能（39 = 38 + 1）。
2. 其余 P 编号/明细全部保持当前值：P2 表单模块其他缺口（控件、删除、列表持久化、联动、默认值、公式、外部数据源）继续开放；P57/P58 未启动。
3. 验证基线集合完整保留：全量（后端 143 份 Surefire XML、1004/0/0/0、BUILD SUCCESS；前端 115 files + 1 skipped、1097 tests + 3 skipped，typecheck/lint/build 通过）+ 最终变更后聚焦（后端 2 测试类 23/0/0/0；前端 3 files / 23 tests）；Flyway 无新增迁移。

## 阶段三终态（2026-09-02 已确认）

- 已完成功能数 38→**39**；清单 **✅34 / 🟦23 / ⬜33**（34+23+33=90；M03-F01-01 🟦→✅）。
- P56 **已核销/完成**；P46 **已由 P56 完成并核销**（不新增正式功能计数）。
- 正式基线：后端 **1004/0/0/0**（全量143份Surefire XML，BUILD SUCCESS + 聚焦 23/0/0/0）；前端 **115 files passed + 1 skipped / 1097 tests passed + 3 skipped**（+聚焦 3 files / 23 tests）；Flyway **H2 V47（47）/ PG V47（46）**（无新增迁移）。
- 活动功能：无；当前唯一下一动作为**规划为 P57 下发只读探索任务，核实现有节点种类、设计/运行链、硬编码入口和前后端契约**。
- 规划终态最终复核：`product/p56-form-grid-layout/receipts/planning-final-review-p56-stage3-20260902.md`（PASSED，九项终态复核全部通过）。

## 已知限制

- 本轮未新增或关闭 registered 已知问题（`knowledge/known-issues.md` 无变化）。
- 非目标保持：无旧布局数据迁移/历史表单兼容转换（当前无存量用户与存量表单）；无纵向自由缩放、跨行组件、绝对坐标画布；不扩充组件种类/外部数据源/显隐联动/默认值/计算公式（P2 既有缺口）；不进入 P57/P58；不并入 P53 全局 UI 改版。

## 证据路径

| 类型 | 路径 |
|------|------|
| 功能级验收 | `product/p56-form-grid-layout/receipts/planning-review-p56-form-grid-layout-04-passed.md` |
| 终态最终复核 | `product/p56-form-grid-layout/receipts/planning-final-review-p56-stage3-20260902.md` |
| 规划审查链 | `product/p56-form-grid-layout/receipts/planning-review-p56-form-grid-layout-01/02/03.md` |
| 执行回执 | `product/p56-form-grid-layout/receipts/execution-completion-p56-form-grid-layout-20260902.md`、`execution-supplement-p56-form-grid-layout-20260902.md`、`execution-supplement-p56-form-grid-layout-20260902-g3-g6.md`、`execution-supplement-p56-form-grid-layout-20260902-g6a.md`、`p56-stage3-terminal-sync-20260902.md` |
| 测试回执 | `product/p56-form-grid-layout/receipts/test-p56-form-grid-layout-20260902.md` |
| 主方向 | `product/p56-form-grid-layout/passed/direction-p56-form-grid-layout.md` |
| 阶段三方向 | `product/p56-form-grid-layout/passed/direction-p56-form-grid-layout-terminal-sync.md` |