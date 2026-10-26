# 0.2.0 全屏工作台配置与真实图表数据链

2026-10-26｜执行｜XL｜自验通过，待规划独立验收

## 1. 功能与内部 Step

本批承接 `planning-execution-prompt-unified-020-03.md` 与 `direction-workspace-config-020-r2.md`，同一 0.2.0 交付内完成：

1. **授权集成与 DR06 收口**：表单侧允许清单冻结、服务端能力代理、调用幂等/请求哈希、副作用阶段约束、组织角色/岗位授权快照与脚本函数。
2. **全屏三栏工作台配置**：首页「配置工作台」进入 `/workspace/config`；组件库 4 类系统卡片 + 14 类数据组件；12 列画布；拖动排序、宽高调整、移除、撤销、草稿预览、保存、重置与未保存返回处置。
3. **数据与图表真实链**：指标卡、数据列表、12 种图表（柱/条形/折线/面积/组合/饼/环形/散点/雷达/漏斗/仪表盘/热力图）；多指标、左右轴、单位、颜色、筛选、分组、图例/标签/网格/堆叠；服务端按当前账号可见表单/字段/记录数据范围聚合。
4. **布局兼容**：沿用 `/system/workspace/layout` 与 `sys_workspace_card_type`；内置数据组件走服务端内置白名单，`instanceId` 支持同类型多实例，span 1—12、height 100—1600；旧个人布局与旧 `/workspace/edit` 保持可达。
5. **原剩余项补证**：富文本受控前缀的真实导出文件、TABLE 子表保存/发布/填写/详情/导出，冻结快照与 A06—A10 沿用既有有效证据，不重复整批业务。

## 2. 实际修改文件

**Web（`codex/0.2.0-ui-tenant-form-flow`，`ea9a61a..475814c`）**

- `src/contracts/catalog.ts`：渲染器键补 metric/list/chart，卡片补 instanceId/height/12 列 span。
- `src/modules/workflow/api/workspace-analytics.ts`：表单源/可见字段/聚合/列表 API。
- `src/modules/workflow/utils/workspace-components.ts`、`workspace-data.ts`、`workspace-studio.ts`：内置组件目录、配置模型、12 列排布、保存几何折算、字段默认值。
- `src/modules/workflow/components/WorkspaceStudioCard.vue`、`WorkspaceInspector.vue`、`WorkspaceFilterDialog.vue`、`WorkspaceColumnsDialog.vue`、`WorkspaceMetricsDialog.vue`、`WorkspaceChartTypeDialog.vue`：编辑外壳与属性面板/对话框。
- `src/modules/workflow/components/WorkspaceChart.vue`、`WorkspaceDataCard.vue`、`WorkspaceSystemCard.vue`：12 图型 SVG 渲染、指标/列表真实查询、4 类系统卡真实数据。
- `src/modules/workflow/components/WorkspaceBoard.vue`：首页渲染新数据组件、12 列保存几何回读、配置入口文案。
- `src/modules/workflow/views/WorkspaceStudio.vue`、`WorkspaceHome.vue`：全屏配置页与首页入口。
- `src/router/index.ts`、`src/layouts/BasicLayout.vue`：`/workspace/config` 路由与全宽配置壳。
- `src/locales/zh-CN.ts`、`en-US.ts`：工作台/图表/属性面板文案。
- 测试：`WorkspaceChart.spec.ts`（12 图型差异）、`WorkspaceDataCard.spec.ts`（真实查询/错误态）、`WorkspaceStudio.spec.ts`（加载/添加/保存/撤销）、`workspace-studio.spec.ts`（12 列/几何/默认值）、`WorkspaceHome.spec.ts`（入口改全屏）。

**Server（`codex/0.2.0-tenant-form-flow`，`4063f8e..f530d33`）**

- `FormDataQueryService`：新增 `workspaceFields`、`aggregateWorkspaceData`、`queryWorkspaceRows`；复用可见性、租户、数据范围、字段查看权与过滤校验。
- `FormWorkspaceAnalyticsController` + `dto/workspace/*`：`/form/workspace/analytics/{sources,forms/{key}/fields,aggregate,rows}`。
- `UserWorkspaceServiceImpl`：内置组件白名单、instanceId 多实例、12 列 span、100—1600 高度、256KB 布局上限、读取归一保留新字段。
- 测试：`FormDataQueryServiceTest` +3 组（聚合/列表/字段权限），`UserWorkspaceServiceImplTest` 4 项（多实例/旧重复/几何边界/读取归一）。

## 3. 实际命令与结果

- Web 四连：`NODE_OPTIONS=--max-old-space-size=2048 pnpm typecheck && pnpm lint && pnpm test && pnpm build`，exit 0；**223 文件通过/1 跳过，1936 测试通过/3 跳过，build 4.37s**。原始输出 `/tmp/web-fourgate-66.log`。
- Server 聚焦：`mvn ... -Dtest=FormDataQueryServiceTest,UserWorkspaceServiceImplTest,FormIntegrationServiceTest,AgentToolConfigServiceImplTest,SystemOrgScriptServiceTest,FormDefinitionServiceTest`，exit 0；**65 测试/0 失败**（26/4/7/7/2/19）。原始输出 `/tmp/server-focused-final-66.log`。
- 授权集成/DR06 前置批次：Web `b88ac2c`、Server `4a3ca81c`；Web 四连 219 文件/1909 通过、Server 35/0；组织函数探针 v5 页面实际值 `租户100管理员`、`负责人`、`9001`、`9001`。原始 `/tmp/web-fourgate-54.log`、`/tmp/server-focused-54.log`。
- 真实 PG 数据链（Node fetch；证据目录 `C:/Users/hjxch/.codex/evidence-020/real-joint/`）：
  - `ws-chain-positive.json`：表单 `u020_ws_probe_66` v2，4 条真实提交；字段 5；按 `category`（热力图再按 `region`）聚合 4 组，`SUM amount=28`、`SUM completed=22`、`COUNT=1`；列表按 amount 降序 total 4。
  - `ws-chain-permission.json`：字段权限表单 `u020_ws_perm_66`，当前账号字段目录仅 `title`；聚合/列表使用 `amount` 均返回 `1501`。记录数据范围：管理员 `totalRecords=4` / 查看员 SELF `totalRecords=1`，列表记录仅 `演练D`。跨租户（tenant 9001 用户）访问 tenant 100 表单返回 `1500`。
  - `ws-layout-before-66.json` / `ws-layout-after-66.json`：保存前 `custom=false`；保存 10 张卡（4 指标、2 系统卡、3 图、1 列表）后 `custom=true` 且 10 张、4 个同名 metric 实例共存；测试结束已 `DELETE` 恢复 `custom=false`。
  - `ws-config-e2e-66.json`：headless 真实页面登录 t100admin，`/workspace/config` 加载 10 卡/18 组件库；修改标题→预览可见→添加柱状图 11 卡→撤销回 10 卡→保存→刷新后标题保留；`PUT /system/workspace/layout` 200。
  - `ws-page-final-66.json`、`ws-home-final-66.png`、`ws-config-final-66.png`：首页 10 卡、4 指标值 `4/28/22/7.00`、3 个 SVG 图、列表 4 行；图表图例显示中文指标名；配置页无未翻译 `workspace.*` 键。
  - `ws-rich-table-66.json`、`ws-rich-table-prefixed-66.json`、`u020_rich_table_66.xlsx`：富文本+TABLE 表单 `u020_rich_table_66` 发布、真实提交、详情返回子表两行/受控前缀行；导出 xlsx 含 `数据` 与 `items` sheet，受控富文本导出 `加粗 下划线 蓝色大字`（无标签），子表行列分组正确。

## 4. 偏差与问题

- 新配置页按 273:1600 实现全屏三栏与 12 列；旧居中弹窗与 `/workspace/edit` 保留兼容，首页入口已改为全屏配置。
- 指标卡在服务端 COUNT 返回字符串（全局 Long 字符串序列化），前端统一 `Number()`/格式化处理；未改全局序列化契约。
- 布局高度下限从 120 调为 100，以承接设计 112px 指标卡；旧布局读取仍按既有几何兼容。
- 富文本导出仅对带 `<!--sw-rt:1-->` 受控前缀的值输出可见文本；无前缀旧值按纯文本原样导出（既有兼容语义）。
- 图表为自绘 SVG，无新增第三方图表依赖；12 图型分别实现，不用同一柱图换名。

## 5. 未完成 / 未验证

- **正式视觉像素**：A03—A05、258 画框/25 族、新侧栏独立参考仍未关闭。本批 headless 页面仅作 `ISOLATED_REGRESSION` 功能证据；IAB 实际会话出现空白页且 `browser screenshot surface preparation timed out after 3000ms`，不能作为正式可见浏览器/像素通过。真实工具失败见 `ws-page-final-66.json` 与浏览器工具输出；未把 headless 结果升级为正式验收。
- **A17**：分支→develop→main、0.2.0 发布与发布后同步仍等待 Planner 整版验收，不在本批提前合并/发布。
- **原矩阵视觉状态**：快照/富文本/TABLE 的功能证据可组合引用；对应同态像素仍按原清单待验，不因本批功能通过而整体核销。
- 测试用表单/记录保留在 dev PG（`u020_ws_probe_66`、`u020_ws_perm_66`、`u020_rich_table_66`）供复核；个人布局已恢复默认，临时跨租户探针用户已删除，数据范围角色已还原。

## 6. Git

- Web：`ea9a61a..475814c`（含前置 `b88ac2c`），已推送并回读同 SHA。
- Server：`4063f8e..f530d33e`（含前置 `4a3ca81c`），已推送并回读同 SHA。
- `vite.config.ts` 为他人既有在途改动，未纳入本批。

## 7. 与验收标准对照

| 验收点 | 结果 |
| --- | --- |
| 全屏三栏/组件库/12 列/拖动/宽高/移除/撤销/预览/保存/重置 | 页面与组件测试通过；headless 真实交互通过 |
| 指标卡/12 图型/数据列表/4 系统卡 | 12 图型分别渲染；真实 PG 聚合/列表数据；系统卡真实接口 |
| 多指标/左右轴/单位/颜色/图例/标签/网格/堆叠 | 配置面板与保存元数据、SVG 渲染均接入 |
| 筛选/分组/排序/分页/自动滚动 | 服务端受控过滤/分组/排序/分页；列表翻页与自动滚动 |
| 服务端记录/字段权限先于汇总 | 字段拒绝 1501；SELF 数据范围 1/4；跨租户 1500 |
| 保存/刷新回读与旧布局兼容 | 10 卡保存/回读；旧个人布局读取；旧路由保留 |
| 富文本/TABLE 实际文件 | 真实导出 xlsx 验证可见文本与子表 sheet |
| 正式像素/258 帧 | 未通过（宿主截图/可见会话限制），如实保留 |

## 8. 自验结论

本批新增功能自验通过，提交 Planner 独立验收。0.2.0 仍为 `IN_PROGRESS`，未核销 P、未晋级基线，A17 未开始。

总 7 阶段：需求评估完成；分支实施进行中；验收同步、合并、0.2.0 发布、发布后同步、结束未开始（1/1/5）。
