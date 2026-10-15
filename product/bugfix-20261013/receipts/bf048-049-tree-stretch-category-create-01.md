# BF20261013-048/049 执行回执：表单管理分类树不再拉伸（下方留白）+ 流程中心「管理分类」新建有反馈

2026-10-15｜执行者提交（fix-loop 持续修复批次）。Owner 反馈：

① 表单管理这个分类树太丑了，整个拉伸填满竖直区域，下方空白就让他空白（截图红框 = `/form/form-def-list` 左列分类树整段竖直区域）；
② 流程中心分类管理功能缺失，新建点了没效果（截图 = `/workflow/catalog`「管理分类」弹窗，输入框为空、红箭头指「新建」）。

判级：两项均为**局部视觉/交互修正**（不改数据模型、权限、API 与页面结构）→ **S/M**；无自动升级门命中。按 fix-loop 记入同一批次。

## 一、现状与成因

### BF048：`max-height: 100%` 在自动行高的网格里等于没有上限

`.form-def-page__tree` 写的是 `max-height: 100%; overflow: auto;`。但该卡片是 `display: grid`（`grid-template-columns: 220px minmax(0,1fr)`）的网格项，行高是**自动行**——百分比 `max-height` 解析不出确定值，浏览器按「无上限」处理，`overflow: auto` 因此永不触发。结果是**树节点一多，卡片就一路长高吃掉整段竖直空间**：

- 实测（修复前，1440×900，21 行树）：卡片 **600px**、`scrollHeight 598 = clientHeight 598`（**零内部滚动**）、页面随之长到 600px、下方**不再留白**——即 Owner 说的「整个拉伸填满竖直区域」。
- 同一会话内把旧规则 `max-height:100%` 内联回灌，复现同一数值（A/B 对照，见 §三）。

补充实测（供交叉核对 Owner 截图）：Owner 截图那一刻卡片的白色区域只到 `y≈CSS 372`、下方是页面底色 `rgb(244,246,252)`——即**短树时卡片本来就是内容自适应**，缺陷只在树变长时出现；本项按「不许拉伸填满」的口径把它做成**硬保证**。

### BF049：空名称静默返回 + 空态文案用错

- `addCategory()` 为 `const name = ...trim(); if (!name) return` —— **静默返回**。实景复现（输入框为空点「新建」）：**零请求、零提示消息、零 DOM 变化**（XHR 观测数组为空、`.el-message` 无节点）；按钮本身在空值时仍显示为可点。Owner 看到的「点了没效果」即此。同仓「流程归属管理」`ProcessCatalogAdmin.submitCategory` 早已是「提示必填」口径，两处不一致。
- 该弹窗空态复用了 `workflow.noCatalogItems`（「暂无可发起的事项」）——**分类列表用事项文案**，加上默认 100px 大图，看着像「功能没做出来」。

## 二、已修复

| 文件 | 修改摘要 |
|---|---|
| `src/modules/form/views/FormDefList.vue` | `.form-def-page__tree`：`max-height: 100%` → **`min(60vh, 480px)`**；补 `align-self: start`（明确不参与拉伸）；补 `box-shadow: var(--sw-shadow-card)`（与同页 `ListFilterBar`/`ListTable`、流程中心左栏同 token，卡片边界更清楚）。保留 `overflow: auto`——现在上限是确定值，长树改为**卡片内滚动** |
| `src/modules/workflow/views/ProcessCatalog.vue` | `addCategory()` 空名称先 `ElMessage.warning(t('workflow.categoryNameRequired'))`（「分类名称不能为空」，与归属管理同 key）；新增 `creatingCategory` 防重复提交；模板「新建」按钮 `:disabled="!newCategoryName.trim()"` + `:loading="creatingCategory"`；空态 `:description` 改 `catalog.noCategories`，并加 `:image-size="72"` |
| `src/locales/zh-CN.ts` / `en-US.ts` | 新增 `catalog.noCategories`：**暂无分类** / No categories yet |
| `scripts/p61-copy-dictionary-batch6.json` | 新文案登记 P61 字典（「暂无分类」→ `catalog.noCategories`）；`p61-validate-dictionary.mjs` 通过 |
| `src/modules/workflow/views/__tests__/ProcessCatalog.spec.ts` | 新增组件测试 5 例 |

## 三、验证

**四门**（Web，`codex/bugfix-20261013`）：`lint` **0 错 3 警**（既有基线）、`typecheck` exit 0、`vitest run` **165 文件 / 1536 通过 3 跳过**（较上批 +5 例即本批新增）、`build` ✓（`✓ built in 2.54s`；rolldown 对 `@vueuse/core` 的 `#__PURE__` 位置告警为既有依赖噪音）。

**新增单测（5 例）**：空名称按钮禁用（含空白串）/ 空名称回车提示必填且不发请求 / 填名后创建并发起刷新（`createCategory` 1 次、`listCategories` 刷新、`queryCatalogItems` 2 次、输入清空、提示「分类已创建」）/ 空列表显示「暂无分类」而非「暂无可发起的事项」/ 已有分类时三入口（重命名、删除）在位。

**实景点验**（应用内浏览器 tab `iab-tab:d2402b32-…`，1440×900，管理员会话）：

| 项 | 动作 | 实测 |
|---|---|---|
| BF048 长树（A） | 临时建 17 个分类 → 树 21 行 | 卡片 **506px**（上限 480 + 内距）、`scrollH 598 > clientH 504` → **卡片内滚动**、下方 **330px 留白**；证据 `evidence/bf048-tree-long-capped.png` |
| BF048 长树（B，反证） | 同会话把旧规则 `max-height:100%` 内联回灌 | 卡片 **600px**、`scrollH = clientH` → **零内部滚动**（复现缺陷） |
| BF048 短树 | 删除全部临时分类后 | 卡片 **158px**（= 内容高度）、`innerScroll=false`、下方 **678px 留白**；证据 `evidence/bf048-tree-short-blank.png` |
| BF049 空名称 | 输入框为空 | 按钮 `is-disabled`、`cursor: not-allowed`、禁用底色；点/回车均**零请求**（回车给「分类名称不能为空」）；证据 `evidence/bf049-create-disabled.png` |
| BF049 新建 | 填「验收新建分类」→ 回车 | 按钮转为可点 → `POST /api/workflow/categories 200` → 提示「分类已创建」→ 弹窗列表 18 行、**左树出现该分类（计数 0）**、输入清空、按钮回到禁用 |
| BF049 改名 | 「临时验证A」→「临时验证B」 | 提示「分类已更新」、行内显示新名 |
| BF049 删除 | 逐行删除 | 提示「分类已删除」、行数递减至 0、空态显示**「暂无分类」**（紧凑小图）；证据 `evidence/bf049-empty-categories.png` |

**数据边界（如实登记）**：为构造长树，本次临时创建了 17 个分类（`临时分类01…16`、`验证分类A`），点验中另建「验收新建分类」「临时验证A/B」；**全部经「管理分类」弹窗逐个删除**，终态 0 分类——左树恢复为 `全部 1 / 未分类 1`，与 Owner 原状一致；未直接改库、未触碰 Owner 的表单/流程/实例数据。

## 四、观察与边界（未改，供 Owner 定夺）

1. **渲染档位**：长树现在被 `min(60vh, 480px)` 截住并卡片内滚动（不再吃掉整段竖直空间）。若你期望的是「树再长也不滚动、整页跟着变长」，把上限去掉即可（一句话可改）——但那样下方就不会留白。
2. **卡片投影**：本次给分类树卡片补了与同页列表卡一致的 `--sw-shadow-card`（判为「太丑了」范围内的对齐收口）。如你更想要纯描边无投影，可回退这一行。
3. **卡片与右侧标题的基线**：树卡片贴在内容区左上角（与左侧导航栏齐边），右侧列表模板有自己的顶部内距，两者顶部不在同一基线上。本次**未动**版式基线；若你说的是这个「不齐」，我按对齐再改一版。
4. **归属 vs 分类**：`管理分类` 弹窗只维护分类本身；「哪个流程归到哪个分类」在**流程归属管理**（/workflow/catalog-admin）里维护。若你在分类弹窗里直接想勾流程归属，那是新能力，需单独登记。

## 五、提交

- Web：`codex/bugfix-20261013`（本批提交：2 个视图 + 2 个 locale + P61 字典 + 1 个新测试文件）。
- 根仓：台账 BF20261013-048/049 两行 + 本回执 + 证据索引（`evidence/bf023-network-index.md` 048/049 段）。

## 六、状态

**待 Owner 点验**：①打开「表单管理」看左侧分类树是否**只裹住内容、下方留白**（分类多时卡片内滚动）；②打开「流程中心 → 管理分类」，空输入时「新建」应为禁用态、填名后回车/点击即创建，列表与左树即时刷新；空态文案应为「暂无分类」。
