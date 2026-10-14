# BF20261013-038 执行回执：表头空白行修复 + 四类版式缺陷全局巡检

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 文字 + 截图「拉上去，不要留这种莫名其妙的空白行。不止这一个页面，包括上面几个问题，全局检查一下有没有类似的情况」。

## 一、本次修复（列表页表头上方的空白行）

**原因**：`ProcessDefList` 的表格卡片在 BF037 保留了纵向内距 `padding: 24px 0`（BF037 只去掉了左右内距），于是表头灰底之上仍有一条 24px 白条（实测 `stripTop = 24`，即 Owner 红框处）。

**修复**：卡片内距改 `padding: 0`——表头即卡片首行（灰底一直铺到卡片圆角上沿）；分页行自带 `16px 24px` 内距，分页与表格间距观感不变。实测 `stripTop = 0`、`bandL/bandR = 0`，状态徽标仍居中（dy −0.5px、无裁切）。

## 二、全局巡检（Owner 要求：不止这一个页面）

**方法**：①静态清单——遍历 `src` 全部 `.vue`，提取 46 个使用 `ListActionsColumn` 的页面（声明列宽 + 动作文案键）；②静态扫描——所有含 `el-table` 的页面，取其直接父容器 class 并读取该容器的 padding 规则；③实景实测——在应用内浏览器遍历 88 条路由中可渲染列表的页面（有数据的页实测几何，空数据页记录卡片结构与内距）。

**同类问题与处置**：

| # | 同类问题 | 定位 | 证据 | 处置 |
|---|---|---|---|---|
| ① | 表头上方空白行（本次主诉） | `ProcessDefList` 卡片 `padding: 24px 0` | 实测 stripTop 24 → 0 | **已修**（`padding: 0`） |
| ② | 操作列装不下四格/三格，末格被裁 | `/system/dict`、`/system/dict-manage`（同一 `DictTypeList` 组件）操作列 150，实测内容 166（中文）/181（英文）→ 裁 48px | 实测 `scrollWidth−clientWidth = 48` → 0 | **已修**（150 → 200） |
| ③ | 卡片包住表格留内距（表头左右白边） | `DeptList` `.dept-list__table-card { padding: var(--sw-space-16) }` | 静态：卡片直接包 `el-table`，16px 四周内距 | **已修**（padding 0 + `overflow: hidden`；空态自带 16px 横向内距） |
| ④ | 卡片包住表格留内距（表头上方空白行 + 左右白边） | 表单设计器「关联流程」面板 `.related-processes__table-card { padding: 24px 23px 0 }` | 静态 24/23px；实景复测 stripTop 1、bandL 1（仅剩 1px 边框） | **已修**（padding 0） |
| ⑤ | 单元格 `translateY` 位移（与 BF037 状态徽标被裁同源） | `TaskDetail` 人员表 `header .cell −2.5px / td .cell −6px / 末列 −1px`、P53 记录表 `head −4px / row −8px`；`MyInstances` 面板新建按钮 `−8px` | 静态定位（三处规则） | **未改，登记待决**：三处均为 P53 设计对齐用的微调，且本环境无任务数据（待办/实例列表为空）无法实景复核裁切与否；如 Owner 要求按同一口径清理，可随下次有数据时一并处理 |
| ⑥ | 更新人与更新时间合并为一列 | 全仓 grep（`}} · {{` / `· {{`） | 仅 `TaskDetail` 审批时间线条目（非表格列）与 IoT 版本·状态标签 | **无同类**（不适用） |
| ⑦ | 空数据页的"空白" | `/job/log` stripTop 104、`/workflow/instances` 等 | 实测该 104px 为卡片内的告警/筛选内容高度，非空白 | **非缺陷** |

**巡检覆盖面**：实景遍历 `/workflow/*`（defs/instances/todo/processed/my-*/templates/monitor/center/approval-form/resource-*/analytics/batch-approval 等）、`/system/*`（user/dept/role/post/menu/dict/dict-data）、`/form/*`（form-def-list/designer）、`/notify/*`、`/agent/*`、`/iot/*`、`/job/*`、`/storage`；其中本环境有数据可实测的页面：`/workflow/defs`、`/system/user`、`/system/menu`、`/system/dict`、`/system/dict-manage`、`/form/form-def-list`、`/workflow/approval-form` —— 这些页面的卡片均为标准 `list-table`（padding 0、stripTop 0、band 0、无单元格位移、徽标居中）✓，唯一异常即上表 ②。

## 三、验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1506** 通过 3 跳过、build ✓。
- 实景（应用内浏览器 1280×720，管理员会话）：
  - `/workflow/defs`：卡片 `padding: 0px`、`stripTop = 0`、`bandL/bandR = 0`、状态徽标 dy −0.5px 无裁切、分页 `padding: 16px 24px`；
  - `/system/dict`：操作列三格（编辑/管理字典项/删除）`clientWidth = scrollWidth = 168`、overflow 0；
  - `/system/dept`：卡片 `padding: 0px`、`overflow: hidden`；
  - 表单设计器「关联流程」（`/form/designer/8b348942-…`，切到「流程设计」工作区）：面板 `padding: 0px`、表头 stripTop 1 / bandL 1（1px 边框）、表格铺满卡片。
- **数据安全**：本次只做读取与工作区切换，未触发任何保存——表单定义 `8b348942-35f5-48ba-bf02-a65cf721d4cc` 的 `update_time` 仍为 `2026-10-14 01:39:04`（未变）；页面头部「草稿已保存 HH:mm」文案取的是**加载时刻**而非保存时刻（`FormDesigner.loadForm` 内 `savedAtText = formatClock(new Date())`），易被读成"刚保存过"，仅登记观察，不在本批改动范围。

## 四、影响面

- `src/modules/workflow/views/ProcessDefList.vue`：卡片 `padding: 24px 0` → `0`（表头即首行）。
- `src/modules/system/views/DictTypeList.vue`：操作列 150 → 200（四格标准）。
- `src/modules/system/views/DeptList.vue`：卡片内距 16px → 0 + `overflow: hidden`；空态补 16px 横向内距。
- `src/modules/form/designer/RelatedProcessesPanel.vue`：卡片内距 `24px 23px 0` → 0。
- `scripts/p61-copy-dictionary-batch6.json`：补 `"更新人" → workflow.updatedBy` 单源条目（BF037 新增键回填到生成源，避免下次 `p61-gen-locales` 重新生成时丢键）。
- 数据面：无接口、无服务端改动、无迁移。

## 五、提交

- Web：codex/bugfix-20261013（空白行修复 + 巡检三项同类修复 + 单源回填）。
- Server：本批无改动。
- 根仓：台账 BF20261013-038 行 + 本回执 + 证据（本地，`.gitignore` 忽略）+ Web gitlink。

## 状态

待 Owner 点验（与 BF001—037 同批）。
