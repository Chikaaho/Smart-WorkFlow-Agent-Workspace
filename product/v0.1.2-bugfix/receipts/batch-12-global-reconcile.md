# 批次 12 回执 — 全局对账（015/016/018）与原文标记

- 日期：2026-09-28；任务 `v0.1.2-bugfix`（L）；依据 `direction-full-repair-20260927.md` §4/§5。
- 结论：**全局对账完成，原文七项已按授权标记；执行自验通过，待 Owner 逐项回归验收。**
- 证据目录：`receipts/evidence/batch-12/` 及各批次既有证据（复用，快照适用性随附）。

## 015 全局操作列对账

| 页面 | 证据 |
| --- | --- |
| 表单管理 FormDefList | 批次 6/补充 01/02 证据（三直显+更多、无底色、宽 240） |
| 通知模板 NotifyTemplateList | 批次 11 补证 02（宽 240 双视口完整可见+More 端到端） |
| 流程定义 ProcessDefList | 本轮截图 `batch-08/screens/system-sidebar-order-dict-two-level.png`（右侧动作区） |
| 定时任务 JobList | `batch-07/screens/job-flow-def-select.png`（同页操作列） |
| 用户/部门/角色/岗位/字典/菜单管理 | `batch-08/screens/system-sidebar-order-dict-two-level.png` + `batch-12` 无新增异常 |
| IoT 连接/脚本、通知渠道/记录/偏好 | 空数据页沿用统一组件（42 文件同一 `ListActionsColumn`，单测锁直显 3+更多） |

统一口径：`ListActionsColumn` 直显 ≤3 + 末位更多、link 无底色无描边、flex 四格对齐；超 4 动作自动收拢（组件级常驻回归 3 例）。观察项：TaskDetail 审批记录子表（详情页非数据列表）维持现状，待 Owner 裁决。

## 016 全局说明清理对账

- 批次 5 已清三处（侧栏注脚/流程定义说明/草稿发起卡）；本轮改版页面（目录/待办/详情/发起/菜单管理/字典数据）模板复核：保留均为字段级功能性提示（输入占位、规则文法说明、权限注记），无「用户看不懂」型说明新增；`grep 说明` 类键未新增噪音文案。

## 018 全局布局覆盖矩阵（本轮改版+巡检页；16:10 主视口 + 16:9 抽样）

| 分区 | 页面 | 证据指针 |
| --- | --- | --- |
| 登录 | /login | batch-07 `login-tenant-name-input.png`；batch-08 同 |
| 工作台 | /workspace | 登录后跳转截图（批次 7 会话）+ 批次 3/4 既有 |
| 管理端 | /system/dict、/system/menu | batch-08 `system-sidebar-order…png`、`menu-manage-tree-expanded.png`、`menu-icon-change-rendered.png` |
| 表单 | /form/form-def-list | batch-06/补证 01 双视口三图 |
| 流程中心 | /workflow/catalog | batch-09 `catalog-tree-sections.png` |
| 待办/已办/我的实例 | /workflow/todo、my-instances、my-processed | batch-10 `todo-theme-columns.png`；batch-12 `my-instances-sweep.png`、`my-processed-sweep.png` |
| 任务详情 | /workflow/task/{id} | batch-11 `task-detail-revamp.png` |
| 发起 | /form/form-render | batch-11 `start-takeover-full.png` |
| 通知 | /notify/template | batch-06 补证 02 双视口 |
| 定时任务 | /job/list | batch-07 `job-flow-def-select.png` |

窄桌面（1366×768）抽样：表单管理/通知模板/目录（批次 9/11 会话）；无遮挡/截断回归。

## 新发现缺陷（记录，未顺手修复）

- 「我发起的」列表 Flow name 列全部显示「—」（含历史实例）；且该列表未展示 010 实例主题。属既有展示缺口（MyProcessed/MyInstance 富化未含定义名/主题），建议 Owner 决定是否登记；证据 `batch-12/screens/my-instances-sweep.png`。

## 原文标记（§4 授权）

bug2.0.md 七项「是否已修复」已填「是」并附子项摘要（009/010/011/012/013/017/019）；「回归测试情况」栏留空由 Owner 填写。014–016、018 维持既有标记待 Owner 验收；001–008 保持通过锁定。

## 剩余项

- Owner 逐项回归验收；最近使用口径确认（批次 9 声明）；TaskDetail 子表操作列裁决。整体任务保持 IN_PROGRESS。
