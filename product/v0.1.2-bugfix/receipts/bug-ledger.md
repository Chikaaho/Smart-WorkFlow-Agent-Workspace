# 0.1.2-bugfix 缺陷台账（累积维护，追加保留）

> 原始登记：Owner 维护 `~/Library/Mobile Documents/com~apple~CloudDocs/common-project/MarkDowns/bugfix/bug2.0.md`（每轮执行重新读取，空行不计数，复开沿用原编号）。
> 本台账由执行维护；`是否已修复` 由执行修复后填写，Owner 验收结论以原文档为准，本台账只记录事实与证据指针。

## 台账索引（截至 2026-09-26 首批读取：3 条非空登记）

| 稳定编号 | 原始描述摘要 | 期望摘要 | 批次 | 处理进展 | 验证证据 | 提交 SHA | Owner 验收 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V012-BUG-001 | 从"已办"列表点击任务进入查看详情，进入了待办详情且提示任务不存在 | 任何入口进入应展示流程详情，按流程状态与权限提示"无权限"或按审批状态决定字段可修改 | 批次 1 | 已实现（前后端） | 后端全仓 1573/0/0/0 + 3 例新增单测；前端四连全绿；headed 浏览器证据（已办只读+回跳、待办审批区保留） | Server `0.1.2-bugfix@72b8d01`、Web `0.1.2-bugfix@7e7c74a`（+修正 `3095329`） | **通过（Owner 2026-09-26 于 bug2.0.md 回归测试情况填"通过"）** |
| V012-BUG-002 | 所有数据列表最右边加入"操作"栏（全部列表） | 最右预留"操作"列，直接可见按钮最多 2 个，其余收进"更多"下拉 | 批次 2 | 已实现（46 页迁移 + ListActionsColumn 组件） | 前端四连全绿；浏览器证据与覆盖清单见批次 2 回执 | Web `0.1.2-bugfix@a6ea769` | **通过（Owner 2026-09-26 于 bug2.0.md 回归测试情况填"通过"）** |
| V012-BUG-003 | 按钮和文字贴得太近；"共x条"应在页面右下角，同时展示翻页按钮、每页x条下拉、共x条 | 分页区域统一右下角：翻页 + 每页条数下拉 + 总条数，间距清晰 | 批次 2 | 已实现（toolbar 内联 total 默认关闭 + 分页消失根因修复 + 无分页页补齐 + NotifyRuleList 接线） | 根因与修复见批次 2 回执；浏览器实测各列表分页右下角可交互 | Web `0.1.2-bugfix@a6ea769` + `3095329` | **通过（Owner 2026-09-26 于 bug2.0.md 回归测试情况填"通过"）** |
| V012-BUG-004 | 工作台的菜单不要展示太多东西 | 仅展示工作台页面，待办、已办、草稿 | 批次 3 | 已实现（/workspace 侧栏精简为 工作台+待办/已办/草稿 三直达项），待 Owner 验收 | 前端四连全绿；浏览器实测 /workspace 恰好 4 项、其它页面完整树不变；证据见批次 3 回执 | Web `0.1.2-bugfix@10be8c6`（推送回读一致） | 待验收 |
| V012-BUG-005 | 全局所有左侧菜单去掉边框 | 所有左侧菜单去掉边框，仅保留一整行的可选择区域 | 批次 3 | 已实现（一级/二级/激活态/变体/占位框边框全去，hover 与激活背景保留），待 Owner 验收 | 浏览器 computed style 实测 portal 完整树 11 项与 admin 7 项全部无边框；证据见批次 3 回执 | Web `0.1.2-bugfix@10be8c6`（推送回读一致） | 待验收 |

## 轮次记录

- **2026-09-26 轮 1（批次 1 + 批次 2）**：读取原文 3 条非空登记；两仓 develop 核实同步（Web `1871725`、Server `2d4278b`，均与 origin 一致）后创建 `0.1.2-bugfix` 分支；批次 1（V012-BUG-001）前后端完成并推送（Server `72b8d01`、Web `7e7c74a`）；批次 2（V012-BUG-002/003）完成并推送（Web `a6ea769` 主批次 + `3095329` 分页根因修正）。批次 2 关键根因：后端 `JacksonLongToStringConfig` 将 `PageResult.total`（Long）序列化为 JSON 字符串，`el-pagination` 的 `isAbsent`（typeof !== 'number'）判为缺省后整体渲染 null——**生产上所有服务端分页列表的分页条静默消失**（Owner 截图 2/3 与之吻合）；`ListPagination` 统一 Number 强转修复。headed 浏览器证据（admin/1440×900/真实库）：已办详情只读+回跳、待办审批区保留、46 页操作列与分页抽样验证，制品在 `receipts/evidence/batch-01|batch-02/`。memory 差异核实结论：`memory/state.md` 的"版本修正已 commit+push"与实际一致（POM canonical URL 与 `0.1.2-SNAPSHOT` 已在 `41274d2`/`ebf26ae` 入库）；`memory/handoff.md` 旧"未提交/POM 留工作树"描述失效。
- **批次 2 执行中发现并按"无关缺陷只记录"登记的既有缺陷（未顺手修复，待 Owner 决定是否登记修复）**：
  1. `StandardListTemplate` 从未声明过 `page-action` slot（I6 提交 `026c279` 起）：`NotifyRuleList` 的「新建规则」按钮、`NotifyPreference` 的「保存偏好」按钮因此从未渲染（`NotifyChannelList` 为空占位无影响）；修复方向为改用既有 `toolbar-actions` slot。
  2. `NotifyChannelList` / `NotifyPreference` 分页 props 为写死常量（`page-num=1/page-size=50`）：两页为固定小清单（渠道枚举/订阅偏好行），永远单页，分页控件无实际切页对象，本次按合理不适用处理。
- **2026-09-26 轮 2（批次 3）**：重读原文：001–003 Owner 回归测试情况填"通过"（验收通过，已记入台账）；新增 2 条登记编为 V012-BUG-004（工作台侧栏精简）与 V012-BUG-005（全局侧栏菜单去边框），补入原文序号列。批次 3 修改 `AppSidebar.vue`（workspaceSlim 精简派生 + 去边框样式）与 spec 新增 2 例，浏览器 headed 证据 `receipts/evidence/batch-03/`，回执 `batch-03-v012-bug-004-005.md`。
- 后续轮次：每轮重新读取原文，新增/变更/复开按编号续记。
