# 0.2.0 批次80：组件代表状态对照、1366 弹层可达与 79 Git 补记

2026-10-27｜Executor｜任务03（唯一入口）｜0.2.0 IN_PROGRESS（1/1/5）

本轮承接 planning-receipt-read-unified-020-79.md：已有代表 PNG 的同节点对照、1366 其余实际可达、ApplicationCard 具体项，并补记批次79的真实提交推送。

## 一、批次79 Git 补记（Planner 记录指出的缺口）

79 回执初版只在正文写了门禁与变更，没有 Git 章节，Planner 因此按“未提供新 SHA”记录是正确的。实际提交与推送早已完成，现补记并随本批提交：

- Web：`c32222513da739c52253df0d37310d4c5b3f82c1`（b275273..c322225，8 文件），分支 codex/0.2.0-ui-tenant-form-flow。
- 根：`a0f9bd9f0a6c48d2ef2a95934ea65f2ee56409ec`（829decfd..a0f9bd9f），分支 codex/0.2.0-delivery。
- 两仓 `git ls-remote` 回读与本地 HEAD 一致；79 回执已补第八节。

## 二、同节点组件对照（仅修确证差异）

逐一查看 components 参考帧与已采真实状态，能直接对应且可修的确证差异只有一项：

- NumberRuleBuilder（404:9320）：参考帧预览行为「预览 DRILL-20261022-001」，运行态为「模拟编号 20261027-001」。已将 `workflow.themeRulePreview` 改为「预览」/「Preview」，其余要素按钮（日期/时间/流水号/常量/发起人/自定义/清空）与令牌区结构已一致。参考帧的令牌区/历史区为空面板，运行态显示真实令牌，属真实数据不修。

其余对照结论（不作为通过，也不硬改）：

- FormProperties（401:8751）：数据类型行参考显示「文本」，运行显示存储族 `VARCHAR`。该行代码注释明确为“存储类型族展示”，多选还显示 JSON；改成「文本」需要为整族发明映射且会丢失存储口径，未改，按既有产品口径留账。
- FormPalette（401:8653）：参考基础组第二项为「多行文本」、高级组为「富文本」；当前契约只有 RICH_TEXT，无多行文本类型，运行态基础组用富文本、高级组富文本为未注册占位（禁用）。属契约能力边界，不改标签冒充多行文本，也不删占位入口。
- FlowNode（275:1251）：参考帧是带浅蓝图标底座的节点卡（默认/选中/进行中三态），任务详情图使用节点19的文档+人员徽标 SVG 形态；两者不是同一渲染上下文，未按卡片形态强改。
- ThemeEntry（351:6590）：参考帧是白底蓝字「主题」；当前顶栏为深色底白字，帧无上下文背景，未改顶栏配色。
- WorkflowSettingsLayout（379:7962）、NodeProperties（351:6581）、ScriptWorkspace（351:6584）等帧导出近似空白，无法据此认定像素差异；以真实运行态与交互为准，不凭空改。

## 三、1366 其余实际可达（新增六项）

在 1366×768 下逐项真实操作并截图（families-78/1366-*.png）：

| 对象 | 实测 |
| --- | --- |
| 流程监控 /workflow/instances | 「查看详情」可点，抽屉 900×768、x466，完整在视口内 |
| 定义列表「编号设置」 | 弹窗 720×447、x323/y115，保存按钮可见 |
| 门户主题弹窗 | 560×450、x403/y159，完整在视口内 |
| 我发起的业务详情 | 弹窗铺满 1366×768，内容可滚动 |
| 流程设置页 | 保存按钮可见，页级横向溢出 0 |
| 菜单编辑弹窗 | 560×467，图标选择器可见 |

六项页级 `scrollWidth-clientWidth` 均为 0；弹窗/抽屉的 `getBoundingClientRect` 均在视口内。锁定的是这些具体动作与尺寸，不外推全部桌面状态。

## 四、组件代表覆盖现状（非通过数）

按 77 的“承接/共用/部分/残余”口径，用本批已采真实代表状态更新当前分布（不代表像素通过，也不是正式通过数）：

- 有代表结果/共用：19 族。含原 9 族共用结果，加本批 7 族由“视觉未采”转为有代表运行图（FlowNode、DetailDialog、NodeProperties、ScriptWorkspace、WorkflowSettingsLayout、FormPalette/Properties、BusinessForm），加 BusinessRecordLayout/RecordTopbar、ThemeEntry、NumberRuleBuilder 三个代表状态。
- 部分：5 族。FormField/FormText/FormSection（字段排版未逐类）、AppSidebar（展开+收起已采，当前菜单投影无目录层，浮层无真实入口）、FormControl（部分控件/状态）、TenantScope/ApplicationMenu/IconPicker/ColorPicker/MenuPermissionTree/ActionMenu/MenuItem（菜单/图标/取色/动作已采，权限树未采）、NodeFieldPermissions/WorkflowGrid/ApproverSource/WorkbenchCard/StatisticsChart（字段权限/画布/审批源/工作台配置已采，图表真实渲染未逐类）。
- 残余：1 族 ApplicationCard。应用中心为空态「暂无可用应用」，应用管理 `/form/app-manage` 对 t100admin 返回 403（/form/app/manage/list）；未自授应用管理权、未造应用数据，按真实权限与数据条件留账。

## 五、门禁与变更

- typecheck、lint 通过；locale 变更不涉测试断言（theme-rule.spec 测函数而非标签）。
- 变更：`src/locales/zh-CN.ts`、`src/locales/en-US.ts`（预览标签）；回执79补 Git 节；本回执。
- `vite.config.ts` 在途未纳入；设计器循环依赖修复沿批次79提交。

## 六、结论

79 的 Git 缺口已补；编号规则预览标签与参考帧对齐；1366 弹层/抽屉/设置/菜单六项真实可达；组件代表覆盖更新为 19/5/1（非通过数），ApplicationCard 因无权限/无数据保留残余。整页像素与 A17 状态不变：6:2 79.153%、7:2 98.638%、3:2 97.893% 均未整页通过，排除口径仍不合规；移动不验。A17 合并/发布/同步继续依赖整版验收。

## 七、Git 提交与推送回读

- Web：提交 1b091c6（c322225..1b091c6，2 语言文件）；`git ls-remote` 回读 `1b091c69e46ba989d6268a8cd051f5b652c9172c`，与本地 HEAD 一致。
- 根：提交 4c09eeb7（a0f9bd9f..4c09eeb7，memory/ready/规划记录78—79/本批回执/Web gitlink）；`git ls-remote` 回读 `4c09eeb7bcddae90c83a37a4eea61ce0b52c1d98`，与本地 HEAD 一致。
- 未执行合并、tag/Release、部署或强制推送；`vite.config.ts` 在途未纳入。
