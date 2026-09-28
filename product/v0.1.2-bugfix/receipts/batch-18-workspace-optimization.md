# 批次 18 回执：工作台优化（V012-BUG-021/022/023）

- 日期：2026-09-28
- 执行：Executor（授权方向：`direction-full-repair-20260927.md` 连续分批修复；Owner 指令「登记了几个新的缺陷，继续读取」）
- 证据目录：`receipts/evidence/batch-18/`
- 前置事实：Owner 2026-09-28 午后回归 009–020 全部"通过"（累计 20 项锁定）

## 0. 新增登记（原文序号列已补填）

| 编号 | Owner 原文问题 | 期望 |
| --- | --- | --- |
| V012-BUG-021 | 工作台待办/已办等列表看不懂是什么流程（显示裸 formKey） | 展示流程主题、发起人、流程名称、发起时间 |
| V012-BUG-022 | 业务动态卡显示裸 processKey 且状态为未翻译英文枚举 | 可读流程名/主题 + 状态翻译 |
| V012-BUG-023 | 工作台待办/已办等不要跳流程中心，在工作台打开自己的页面 | 工作台本地页面（暂与流程中心同内容） |

## 1. 后端（Server `fd704ff`）

- **`/workflow/my/instances` 分页富化**（022，含核销已知记录未修缺陷「我发起的」Flow name 列全「—」）：原样返回裸 `BpmInstance` 实体导致前端流程名全「—」；新增 `MyInstanceItemDTO`，`enrichInstanceItems` 按定义键去重解析 `processName`、`UserQueryFacade.getUserDisplayNames` 批量解析 `initiatorName`，解析失败降级 null 不阻断列表。
- **`/workflow/my/processed` 富化**（021）：`MyProcessedItemDTO` 新增 `theme`/`createTime`（实例发起时间，区别于本人办理时间 handleTime）/`initiatorName`；原 toItem/fillFromTask 两处实例信息装配收敛为统一 `fillInstanceInfo`，`userQueryFacade` 缺省（兼容构造）时跳过名称解析。
- 新增单测 2 例（富化断言：流程名/发起人/主题；已办 ACTION 条目 theme/发起时间/发起人），控制器测试 10/10 绿。

## 2. 前端（Web `8618922`）

- **我的待办卡（021）**：行标题 `rowTitle` = 主题 → 流程名称 → 任务名 → 标题 → formKey 兜底；行元信息 `rowMeta` = 流程名称 · 发起人 · 发起时间（真实字段缺失时回退既有节点/动作/到期口径）。四个页签（待办/已办/抄送/草稿）同构生效。
- **业务动态卡（022）**：标题 = 主题 → 流程名称 → processDefKey 兜底（不再显示裸键）；状态/动作翻译（RUNNING→进行中、APPROVED→已通过、REJECT/DISAPPROVE→已驳回、APPROVE→已同意；未知值原样），已办行= 动作·状态，发起行= 节点·状态，抄送行= 抄送·状态。
- **工作台本地页（023）**：新增静态路由 `/workspace/todo`、`/workspace/processed`、`/workspace/my-drafts` 复用既有列表组件（暂与流程中心同内容，后续按 Owner 规划做展示区分）；`area.ts` 前台路径补三路由；侧栏工作台 slim 改固定本地三项（不再从流程管理菜单树挑 /workflow/* 节点）；工作台「全部待办 →」入口改 `/workspace/todo`。
- 契约补充：`ProcessedTask`/`MyProcessedItem` 增 theme/initiatorName/createTime 可选字段，`ProcessInstance` 增 theme。

## 3. 验证

- **前端四连全绿**：typecheck 0 / lint 0 error / vitest **1301 passed + 3 skipped**（142 文件，含更新后的 AppSidebar 工作台 slim 断言）/ build exit 0。
- **后端聚焦回归（完整爆炸半径）**：sw-bpm-process 模块全量 **218/0/0/0** + 上游模块 49 例同跑全绿，`BUILD SUCCESS`；本批次无新增迁移，迁移锚不受影响。全仓套件长跑按 Owner 指令改以模块级聚焦校验替代（本轮改动全部收敛于该模块）。
- **浏览器 E2E（headed，1920×1200）**：待办卡两行分别显示「测试1-20260928-1 / 测试1 · 系统管理员 · 05:23」与「测试1 / 测试1 · 系统管理员 · 09-23 21:00」；业务动态四行均为可读标题 + 翻译状态（含「已同意 · 已通过」）；侧栏「待办任务」点击进入 `/workspace/todo`，顶部导航保持工作台分区。
- 证据：`evidence/batch-18/screens/workspace-todo-card-readable.png`、`workspace-activity-translated.png`、`workspace-local-todo-page.png`。

## 4. 边界

- 工作台本地页当前与流程中心同组件同内容，展示区分待 Owner 后续规划（原文已声明）。
- 已办列表发起时间取实例 createTime；历史实例无主题时标题回退流程名称（发起时间/发起人真实字段缺失时元信息回退既有口径，不伪造数据）。
- 待 Owner 对 021/022/023 逐项回归验收。
