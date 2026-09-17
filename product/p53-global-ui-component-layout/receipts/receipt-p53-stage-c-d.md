# P53 阶段 C/D 执行回执（数据与流程消费页面 · 设计器与复杂浮层）

> 阶段：C（数据与流程消费页面）+ D（设计器与复杂浮层）· 方向 §8
> 执行：Executor · 日期 2026-09-17 · 前序：`receipt-p53-stage-a-b.md`
> 自验结论：阶段 C/D 范围内自验通过（四连全绿 + 视觉套件全绿 + 截图人工复核），**待规划验收**；不构成功能级 PASSED。

## 1. 本阶段覆盖节点（32 节点处置矩阵对照）

| 节点 | 处置 | 实现 |
|---|---|---|
| 02 数据列表 | 真实页面改造 | MyInstances 保持页型 B 全真实能力（筛选/分页/撤回/催办/详情弹窗）；状态标签色对齐设计（RUNNING→品牌主色，EP tag type=primary） |
| 03 数据详情 | 真实页面改造 | TaskDetail 重组：页头（返回+标题+状态 tag+编号/发起人/时间 meta 行）+ 左「数据表单」行式卡 + 右「流程状态」卡 + 操作卡；流程变量卡保留。**只渲染真实可得节点**（已完成历史+当前节点），「后一节点」无数据不渲染 |
| 10 完整流程图 | 真实组件改造 | TaskDetail「流程图」tab 内嵌 ProcessGraphView（定义图 `getProcessDefDefinitionByKey` + 真实轨迹高亮：已完成=历史完结行 nodeKey 去重、活跃=当前任务 nodeKey）；切 tab 懒加载 |
| 15 审批意见详情 | 受限真实弹窗 | 意见详情弹窗：节点/审批人/时间 + 真实 `opinionFormVersion`（有则显 v{version}）+ comment + opinionData 结构化字段遍历；无快照数据不虚构（方向 §5.15） |
| 16 会签列表详情 | 受限真实弹窗 | 同 nodeKey 多行历史聚合弹窗：参与/已同意/待处理统计从分组真实派生 + 逐人送达/处理时间/意见 + 行级查看详情 |
| 17/18 部门负责人/李宁会签意见 | 状态变体 | 复用 15 同一弹窗组件与真实记录，无平行实现 |
| 19 数据详情·流程图 | 状态变体 | 10 的 tab 内嵌形态，支持长页滚动 |
| 20 数据详情·审批列表 | 状态变体 | 「审批详情列表」tab：按节点分组（historyGroups），行=审批人/状态/意见/查看详情；未提交行显「待提交」 |
| 21–26 流程中心及五分类 | 真实页面改造+数据状态变体 | ProcessCatalog 视觉改造：搜索卡+「可发起 N 个流程」计数、分类 chip（active 主色实底+计数）、事项卡（图标/名称/分类/formKey/发起流程按钮）、权限底注；数据链路（服务端分类/计数/可见集）逐行未动；卡片版本号/最近使用无契约字段不显示（如实差异） |
| 27 发起流程 | 真实页面改造 | FormRender 双栏化：左=24 列栅格表单卡（契约不变）+ 右「流程说明」卡（表单名称/formKey/模式，全部真实字段）；`processResolvedByBinding` 说明；窄屏单列 |
| 11 字段属性列表 | 受限只读组件 | FormDesigner 工具栏「字段清单」弹窗：表格展示真实 `previewSchema.fields`（名称/标识/类型/必填/栅格宽度 n/24）；SQL 类型/导出/兼容性校验无契约不提供（方向 §5.11） |
| 12 审批人选择 | 受限真实组件 | 新组件 ApproverCandidatesDialog：真实候选搜索（`/workflow/defs/approver-candidates`）+ 点选回填用户 ID（与既有手输 ID 语义一致）；ProcessDesigner 面板 APPROVER 类型字段加「查看候选」入口；部门/角色/动态规则 tab 无契约不显示（方向 §5.12） |
| 07/08/09/13/14 | 结构已同构 | 表单设计器三栏（组件库/画布/属性面板）、关联流程面板、草稿历史弹窗已存在且行为符合处置边界（24 列语义保持、无监听器/前后置/IoT/Agent 节点入口、无合并版本线）；视觉由统一令牌承载。13 流程高级配置按处置为「设计参考」：监听器/前置后置无契约，不加入口 |

## 2. 行为边界（未触碰项）

- 全部审批/提交/草稿/目录 API 语义、权限判断、异步命令轮询链路逐行保留；新增代码均为布局重组与只读弹窗。
- 意见表单（opinionForm visibleWhen 表达式/必填/初始值）逻辑未动；TaskDetail 提示语诚实性测试（fallback/FAILED reason/no fake success）全绿。
- 流程中心分类仍为服务端运行时数据，五类设计分类未写死（G3 结论落实）。
- locale 全部新键经 `p61-locales-manual.json` 单源双语同步（zh+en），生成器 `--check` 一致。

## 3. 验证结果（本次实际输出）

- 四连：typecheck ✓；lint 0 error 0 warning ✓；vitest 全量 134 files / **1217 passed + 3 skipped（0 失败）**；build ✓。
- Playwright 视觉套件：**23 passed + 1 skipped**（375 管理端切换冒烟按方向 §4.5 有意跳过）。
- 截图人工复核（1440）：TaskDetail 新布局与设计 03 同构（页头/双栏/三 tab/状态卡空态诚实）；流程中心 chip+卡片形态与设计 21 同构；空态/表单记录缺失等状态诚实可见。
- 过程修复：el-table DefaultRow 类型桥接 ×3（对齐既有 MyInstances 写法）；`form.infoFormName` 键不存在→改入单源 `formSide.formNameLabel`。

## 4. 回滚点

- TaskDetail/ProcessCatalog/FormRender/MyInstances 各自独立可回滚（无跨文件耦合，新增 import 均为既有模块）；新文件 `ApproverCandidatesDialog.vue` 删除即回滚（ProcessDesigner 4 处接线）。
- FormDesigner 字段清单弹窗为单点增量（状态+按钮+dialog）。
- locale 经生成器可逆向再生成。

## 5. 移交阶段 E

视口矩阵（4 projects 已配）、双语长文本、键盘焦点（全局 `:focus-visible` 已加入 tokens.css）、对比度复核与功能级 §9 逐条对照完成回执。
