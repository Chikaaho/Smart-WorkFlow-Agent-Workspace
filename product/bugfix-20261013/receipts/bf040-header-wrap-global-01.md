# BF20261013-040 执行回执：表头换行 / 空白筛选条 / 表头撞色 三类的全局根因修复

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 截图 + 文字「检查一下其他的有没有类似情况，而且这个莫名其妙的换行是什么东西」（截图 = `/workflow/workspace-card-types`，红框 = 表头「默认排序」被折成两行）。

## 一、换行的根因（系统性问题，不是那一列的问题）

标准列表页（`ListTable`）把单元格内距写在了 `td/th` 上（`padding-left/right: var(--sw-cell-padding-x)` = 16px），而 Element Plus 的 `.cell` 自带 12px 内距 → **两侧叠加成 28px/侧**。于是窄列装不下表头文字就自动折行：

- 70px 列放不下 2 字标签（需 2×12.25+56 = 80.5）→ `/system/user` 性别、`/system/role` 排序/内置；
- 80px 列放 2 字标签也差 0.5px → `/system/user`、`/system/dict`、`/system/role` 的状态；
- 100px 列放不下 4 字标签（需 105）→ `/workflow/workspace-card-types` 默认排序、`/workflow/catalog-admin` 流程状态。

**修复**：`ListTable` 的内距改为落在 `.cell` 上（**替换** EP 默认 12px，而不是叠加）→ 全站标准列表页单元格左右内距统一 **16px**（与 BF20261013-037 Owner 确认的口径一致），窄列内容宽度每列多出 24px。

## 二、空白筛选条（顺带查出，与 Owner 此前"莫名其妙的空白"同类）

`StandardListTemplate` 无条件渲染 `ListFilterBar`，而该组件自带 24px 卡片内距 + 20px 下间距 → 没传筛选槽的页面会留一条 **48px 空白白条**（`/workflow/workspace-card-types`、`/workflow/todo`、`/workflow/processed`、`/workflow/my-drafts` 实测）。

**修复**：两个槽（`filter` / `filter-actions`）都为空时不渲染筛选条。

## 三、表头撞色（BF20261013-039 的同类，全局收口）

BF039 只修了流程定义页；本轮把"表头底色"改为**全局统一**：`tokens.css` 增加 `#app .el-table th.el-table__cell { background-color: #fafbfe }`（含固定列表头）。原因同 BF039 的机制发现——`--el-table-header-bg-color` 变量被 Element Plus 在 `.el-table` 作用域重声明而失效，必须直接落 `th`。这样：
- 未走 `ListTable` 的页面（`/system/dept`、`/workflow/center` 的 5 张表、`/workflow/catalog-admin` 第 2 张表）原本是**纯白表头压在白卡片上**（表头看不见）→ 现在与标准页一致；
- 流程定义页的页面级声明同步删除（改由全局统一，避免两处维护）。

## 四、验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1506** 通过 3 跳过、build ✓。
- 实景（应用内浏览器 1280×720，管理员会话）逐页实测：
  - **换行全部消失**：`/workflow/workspace-card-types`（默认排序）、`/workflow/catalog-admin`（流程状态）、`/system/user`（性别/状态）、`/system/dict`（状态）、`/system/role`（排序/状态/内置）→ `wrapped = []`；单元格内距实测 `16px/16px`；
  - **空白筛选条消失**：`/workflow/workspace-card-types`、`/workflow/todo`、`/workflow/processed`、`/workflow/my-drafts` → `emptyFilterBars = []`；
  - **表头底色统一**：抽查 13 个页面全部 `rgb(250,251,254)`（含固定列「操作」表头、含此前为纯白的 dept / center / catalog-admin）；
  - **前几批不回退**（`/workflow/defs` 复核）：stripTop 0（BF038）、左右 band 0（BF037）、状态徽标 dy −0.5px 无裁切、操作列 overflow 0、9 列含更新人/更新时间、首列内距 16px、表头 `rgb(250,251,254)`（BF039）。
- 数据面：纯样式/模板改动（2 个共享组件 + 全局样式 + 1 个页面清理），无接口、无服务端改动、无迁移；列表数据未改动。

## 五、影响面

- `src/components/page-layout/ListTable.vue`：单元格内距 28px/侧 → 16px/侧（替换而非叠加）。
- `src/components/page-layout/StandardListTemplate.vue`：空筛选槽不渲染筛选条。
- `src/styles/tokens.css`：表头底色全局统一 `#fafbfe`。
- `src/modules/workflow/views/ProcessDefList.vue`：删除页面级表头底色声明（改由全局统一）。
- 说明：非 `ListTable` 页面的单元格内距仍为 EP 默认 12px（如 `/system/dept`），本批未统一（Owner 未提出；如需一并归一到 16px 可另开一项）。

## 六、提交

- Web：codex/bugfix-20261013（表头换行根因 + 空筛选条 + 表头底色全局统一）。
- Server：本批无改动。
- 根仓：台账 BF20261013-040 行 + 本回执 + 证据（本地，`.gitignore` 忽略）+ Web gitlink。

## 状态

待 Owner 点验（与 BF001—039 同批）。
