# BF20261013-039 执行回执：表头底色与页面底色撞色修复（对齐标准列表页）

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 截图×2 + 文字「颜色不要跟背景色一样，审批意见这种不就挺好的了吗」（截图1 红框 = 流程定义列表表头左侧；截图2 红箭头 = 审批意见表单表头左缘，作为期望样式）。

## 原因（实测定位）

- 流程定义页表头底色是 fixture 迁移期写死的 `--el-table-header-bg-color: #f6f7fb`，而**页面底色**（`--sw-surface-page`）是 `#f4f6fb` —— 两色几乎相同（逐通道差 ≤2），表头看起来"就是页面背景"，与卡片白底之间缺少层次。
- 对照的「审批意见表单」等标准列表页表头是 `#fafbfe`（更接近白），读起来像卡片的一部分 —— 即 Owner 认可的样式。
- **附带机制发现**：全局 `tokens.css` 里的 `--el-table-header-bg-color: #fafbfe` 实际**不生效**——Element Plus 在 `.el-table` 自身重新声明了该变量（作用域比 `:root` 更近），标准列表页的表头灰底其实来自 `ListTable` 的**直接规则** `.list-table :deep(.el-table__header-wrapper th) { background: #fafbfe }`。因此"只删掉页面级覆盖"会退化成纯白（实测 thBg = rgb(255,255,255)），必须把底色直接落到 `th`。

## 修复

`ProcessDefList.vue`：

1. 删除页面级的 `--el-table-header-bg-color / --el-table-header-text-color / --el-table-row-hover-bg-color` 覆盖（后两者与全局标准一致，属冗余），只保留本页行分隔线色 `--el-table-border-color: #f0f2f7`。
2. 在 `.defs-table :deep(th.el-table__cell)` 上直接给 `background-color: #fafbfe` —— 与标准列表页 ListTable 完全同值，表头与卡片、页面底色拉开层次。

## 验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1506** 通过 3 跳过、build ✓。
- 实景（应用内浏览器 1280×720，管理员会话）：
  - 修复后 `/workflow/defs`：`thBg = rgb(250,251,254)`（= #fafbfe，含固定列「操作」表头同值）、`thColor = rgb(107,114,128)`、卡片 `rgb(255,255,255)`、页面 `rgb(244,246,251)`、表头 stripTop 仍为 0（BF038 成果不回退）；
  - 横向对照（同视口逐页实测表头底色）：`/workflow/approval-form`、`/system/user`、`/system/menu`、`/system/dict`、`/form/form-def-list` 均为 `rgb(250,251,254)` —— 修复后本页与它们**完全一致**；
  - 全局同类排查：全仓 grep `--el-table-header-bg-color` 仅本页一处覆盖（已删），其余页面走 ListTable/全局值 → 无同类撞色。
- 数据面：纯样式改动，无接口、无服务端改动、无迁移；列表数据未改动。

## 影响面

- `src/modules/workflow/views/ProcessDefList.vue`：仅样式区（表头底色）。
- 其余文件未改动（未触碰 `tokens.css` 全局变量——EP 作用域问题不在本批范围，已在回执登记）。

## 提交

- Web：codex/bugfix-20261013（表头底色对齐标准列表页）。
- Server：本批无改动。
- 根仓：台账 BF20261013-039 行 + 本回执 + 证据（本地，`.gitignore` 忽略）+ Web gitlink。

## 状态

待 Owner 点验（与 BF001—038 同批）。
