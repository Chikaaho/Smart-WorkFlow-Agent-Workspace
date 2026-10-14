# BF20261013-037 执行回执：流程定义列表页版式四项（列头留白 / 状态居中 / 操作四格 / 更新人·时间分列）

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 截图×2 + 文字四项：
①状态内容未居中，且底色被覆盖；②列头左右两边和画布不要留空白；③状态的值没有居中；④操作信息没有遵循四格布局；⑤更新人和更新时间是两个字段。
**执行前已按 Owner 要求先解释第 1 点并确认口径**：画布 = 这张白色表格卡片；表头灰底 + 表格 + 行分隔线铺满卡片宽度，第一列文字距卡片左缘 **16px**（Owner 选定「16px 内缩（推荐）」）。

## 原因（均为 fixture 迁移期遗留写法，逐项实测）

1. **列头左右白边**：`.p53-admin-defs__table-card` 有 `padding: 24px`，表格只占内部宽度 → 卡片 980px 内表格仅 932px（x 292→1224，卡片 268→1248），表头灰底（`--el-table-header-bg-color: #f6f7fb`）只铺表格 → 左右各露 24px 白边。
2. **状态未居中 + 底色被覆盖**：两处 `transform: translateY(-8px)`（`td .cell` 与 `.status`）叠加 → 徽标中心比行中心高 16px；且徽标布局盒上移 8px 后越出 `.cell`（el-table `.cell` 为 `overflow: hidden`）→ 徽标顶部 8px 被裁，观感即「底色被覆盖」（放大截图 `bf037-before-status-cell.png` 可见胶囊顶边被切平）。
3. **操作列非四格**：操作列宽 170px，而四格（设计/查看流程图/发布/更多）实测需 195px（中文）/ 237px（英文）→ 末位「更多」被裁 25px；同时末列表头有 `translate(33px, 0)`，表头「操作」与按钮错位。
4. **更新人/时间合并**：单列「更新人 / 时间」渲染 `更新人 · 时间`，未按两个字段分列。

## 修复

1. **全宽卡片（第 1 点）**：卡片内距改 `24px 0` 并加 `overflow: hidden`（灰底与行分隔线随卡片 14px 圆角裁切，左右不留白）；分页行单独补 `padding: 0 24px` 保持原有内距观感；`th/td .cell` 左右内距统一 `var(--sw-cell-padding-x)` = **16px**（Owner 确认口径，与其它标准列表页一致）。
2. **状态居中（第 2、③点）**：删除 `th .cell` / `td .cell` / `.status` 上全部 `translate` 位移（含末列表头 `translate(33px)`），状态列加 `align="center"`（与版本/实例数列一致）——徽标随单元格垂直居中且不再被裁。
3. **操作列四格（第 4 点）**：`ListActionsColumn` 宽度 170 → **240**，沿用 V012-BUG-015 四格标准与批次 6「190→240 消除按钮截断」的既有口径（中文 195 / 英文 237 均可容纳）。
4. **分列（第 5 点）**：拆为「更新人」（`workflow.updatedBy`，新增 zh/en key；已无引用的 `workflow.updatedByTime` 同步删除）+「更新时间」（`common.updateTime`）。

## 验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1506** 通过 3 跳过（新增 1 例：状态列 `align=center` / 更新人与更新时间分列 / 操作列宽 240）、build ✓。
- 实景（应用内浏览器 1280×720，管理员会话，tab `iab-tab:d2402b32-…`，URL `http://localhost:5173/workflow/defs`）实测：
  - 卡片 `padding: 24px 0px`、`overflow: hidden`；**表格与卡片同宽**（表头左缘 = 卡片左缘 268、右缘 = 卡片右缘 1248）；
  - 首列 `.cell` 内距 = 16px；
  - 状态徽标：相对单元格 **dx = 0 / dy = -0.5px / 顶部裁切 0px**（修复前：dy = -16px、顶部裁 8px）；
  - 操作列 `scrollWidth = clientWidth = 240`，「更多」右缘在列内（`moreFits = true`）；修复前 170px 列内 187px 内容被裁；
  - 行内 9 列：流程名称 / 分类 / 版本 / 状态 / 主题规则 / 实例数 / **更新人** / **更新时间** / 操作（`—` 与 `10-13 16:04` 分列渲染）；
  - `.el-message` = 0，无控制台报错。
- **宽度说明**：9 列固定宽合计 1452px（含操作列 240）。Owner 侧视口约 2000px（卡片约 1668px）无横向滚动；1280 视口会出现 el-table 标准横向滚动（固定右列常驻，仍可滚动到达全部列），这是 9 列宽表的固有行为，本批未压缩各列设计宽度。
- 数据面：本批纯前端版式/文案，无接口、无服务端改动、无迁移；列表数据未改动。

## 影响面

- `src/modules/workflow/views/ProcessDefList.vue`：模板列（状态 `align`、更新人/更新时间分列、操作列宽 240）+ 样式（卡片内距/`overflow`、分页内距、单元格内距、删除 translate 位移）。
- `src/locales/zh-CN.ts` / `en-US.ts`：`workflow.updatedBy` 新增、`workflow.updatedByTime` 删除（已确认无其它引用）。
- `src/modules/workflow/views/ProcessDefList.spec.ts`：`el-table-column` stub 增加 props 透出 + 新增 1 例列口径回归。

## 提交

- Web：codex/bugfix-20261013（列表页版式四项 + 列口径单测）。
- Server：本批无改动。
- 根仓：台账 BF20261013-037 行 + 本回执 + 证据（本地，`.gitignore` 忽略）+ Web gitlink。

## 状态

待 Owner 点验（与 BF001—036 同批）。
