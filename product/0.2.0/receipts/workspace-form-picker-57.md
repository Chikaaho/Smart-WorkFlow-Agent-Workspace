# 0.2.0 工作台「选择表单」弹窗（批次57，任务03继续）

2026-10-26｜Executor｜消费任务03与 categories 增量参考（645:28735）；承接批次56

## 范围与实现

参考 645:28735（form-picker.png）：弹窗内选择器——左分类单字列表、右表单卡带记录数、选中态、底部提示与取消/确定；按 figma-sidebar-sync-02 口径保留局部尺寸与选择语义，不引入全局整栏开关。改造前运行态为 Inspector 简单下拉、无分类与记录数——登记缺口后实施。

- **服务端**（`codex/0.2.0-tenant-form-flow` `f530d33e..47385e74`）：`FormDataQueryService.workspaceRecordCount(formKey)` 新增——与列表查询同一可见性/租户/数据范围口径的 COUNT(*)，单表单失败按 0 留日志不阻断；`/form/workspace/analytics/sources` 扩展下发 `appId/appName`（取当前账号可见应用，不可见应用不下发名称）与 `recordCount`。
- **前端**（`codex/0.2.0-ui-tenant-form-flow` `81d3731..b4e1e1d`）：新增 `WorkspaceFormPickerDialog.vue`（搜索＋应用分类左对齐首字列表＋表单卡两列（名称/可见记录数/✓选中态）＋「仅展示有权查看的表单」提示＋取消/确认选择；双击卡片直选确认；打开时回显当前绑定并复位过滤）；`WorkspaceInspector` 关联表单由下拉改为触发器（当前绑定名＋更换＋清除，保留解绑语义）；`WorkspaceFormSource` 类型扩展可选 `appId/appName/recordCount`；i18n 中英新增 `workspace.formPicker.*`。

## 验证

- **服务端聚焦**：`FormDataQueryServiceTest` 27/0/0（新增 1 例：软删排除、SELF/ALL 数据范围分别计数、未知表单拒绝）。
- **前端四连**：typecheck 0、lint 0、**226 文件/1946 通过/3 跳过**（净增 1 文件 +4 测试）、build 5.96s，exit 0；提交态复跑弹窗 spec 4/4。
- **真实可见会话（FORMAL_FLOW，headless=false）**：dev jar（Server HEAD 重打包）+ 本地 PG；登录 t100admin → 配置页添加指标卡（自动绑定首个源）→ 属性面板触发器显示「富文本与子表探针 更换/清除」、卡上真实「共 2 条记录」→ 打开弹窗：标题「选择表单」760×522、分类列「全部应用」（dev 表单未挂应用故仅一项，首字「全」）、**11 个有权表单卡**带真实可见记录数（2/0/4/2/8/9/0/5…）、当前绑定 ✓ 回显、提示与搜索占位齐备 → 搜索「演练统计」过滤 → 选择「演练统计探针」→ 确认选择 → 触发器与卡值变为「演练统计探针＝4 共 4 条记录」（绑定与聚合链路真实生效）→ 弹窗关闭 → 撤销草稿卡回到 7 卡，未保存。IAB 定位点击不收敛时按回执07先例用页面内 DOM click；一次截图 surface 超时后重试成功，均如实记录。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/formal-57-picker-1920.png`、`formal-57-picker-geometry.json`、`formal-57-picker-bound-1920.png`、`formal-57-picker-interaction.json`。
- **环境收尾**：java/vite 按精确命令行身份核对后净停，8080/5175 回读无监听；PG/Redis 保持。

## 边界与剩余

- 分类列为数据驱动：dev 表单未归属应用时仅显示「全部应用」，有应用归属即按可见应用分组（服务端不下发不可见应用名称）。
- 弹窗为 ISOLATED 级组件测试＋FORMAL_FLOW 可见会话实测；645:28735 同态像素对照仍按 A03—A05 原标准统一执行。
- 剩余账本不变：门户 7:2、25 族其余状态、A03—A05 全量同态像素、66 不同语义、DR06；A17 合并/0.2.0 发布依赖整版验收。计数 49、46/22/22=90、ADV64/问题57、P 核销空保持。

总 7 阶段 1/1/5。常规决定：计数失败按 0 不阻断 sources（已留日志与测试口径）；未发其他会话消息。
