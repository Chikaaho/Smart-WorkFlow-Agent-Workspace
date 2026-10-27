# 0.2.0 批次79：6:2 行节距/表头收口、定义统计承接、设计器深链修复与族状态实测

2026-10-27｜Executor｜任务03（唯一入口）｜0.2.0 IN_PROGRESS（1/1/5）

本轮承接 planning-receipt-read-unified-020-78.md 的桌面剩余：6:2 列表节距、定义四项统计可达、25 族真实不同状态、1366 实际交互。移动端不验。

## 一、6:2 行节距与表头列位（Planner 指出的累计偏移）

参考实测（x=1600）：前三条行分隔线 y251/296/341，节距 45；运行改为 45 高后同点实测 y251/296/341，后续行继续按 45 递增，累计偏移关闭。表头列宽同步校正为 366/234/132（名称/分类/版本），列文字起点实测 273/635/869/1001/1079/1291/1375/1741，与参考 273/635/869/1001/1079/1291/1375/1741 逐列一致（此前版本/分类差 1—2px 已消）。未压缩行数、未隐藏合法动作。

重采报告：diff 432,283/2,073,600，79.153%，排除 0。分数较 79.298% 再降 0.145 个百分点，原因是每行增高 1px 后第 4—8 条真实行整体下移 1—5px，与参考空画布的计差面积略增；静态骨架（工具栏/表头/前三条示例位/页脚）按参考落位，真实 8 行对 3 示例行的主体差异不变。

## 二、定义四项统计的同授权可达（原 6:2 统计卡承接）

核实结论：定义列表接口只返回 records/total，无 p53Stats、无 status 查询参数，也没有定义统计聚合端点；旧四卡数据来自设计 fixture，移除后能力确实缺承接。本轮在既有「流程分析」入口（同一流程管理授权，非新建 BI）增加四项真实统计：

- 数据来源：`pageProcessDefs` 授权列表，单次有界请求 pageSize=1000；全部返回时按 status 聚合，超过上限时仅总数取接口 total、分状态显示「—」，不估算。
- 实测（1920 与 1366 两视口）：流程总数 8 / 已发布 8 / 草稿 0 / 已停用 0，与定义列表真实 8 条全部已发布一致；与实例分析指标并列展示，未以实例列表偷换定义统计。
- 边界：该聚合是前端对授权列表的真实计数，不新增服务端统计接口；超 1000 条时如实降级为「—」，不伪造分状态数。

## 三、表单设计器深链崩溃修复（族状态采集中的真实缺陷）

复现：冷启动直达 `/form/designer/:id` 时路由启动失败，`#app` 为空，控制台报
`ReferenceError: Cannot access 'TableControl' before initialization`（`dynamic-field-registry.ts:56`）。从表单列表点「编辑」同样无法进入设计器。

原因：运行时循环依赖——注册表顶层数组引用 `TableControl`，而 `TableControl` 顶部又从注册表导入 `getSubFieldComponent`；`DeptControl`/`UserControl` 也从注册表导入 `normalizeIdList`。冷启动先加载控件时，注册表在数组求值阶段读取尚未初始化的 `TableControl` 绑定。

修复（不改变行为与公共 API）：

- `src/components/dynamic-field-utils.ts`：迁出 `normalizeIdList`（纯函数），控件直接引用，不再回依赖注册表。
- `src/components/dynamic-field-subfield.ts`：子表解析改为独立映射（type→组件，缺失/null 回退占位），`TableControl` 只依赖该模块。
- 注册表建表时与 `registerDynamicFieldDescriptor` 时写入映射，并从注册表转出 `getSubFieldComponent`/`normalizeIdList` 保持既有导入路径与测试契约。
- 控件导入改为叶子模块（TableControl→subfield，Dept/User→utils）。

验证：冷启动设计器正文 310 字符、`#app` 约 51KB，表单定义与 definition 接口 200；字段选中属性面板、脚本弹窗、明细表添加均可用；`dynamic-field-registry.spec` 6 例通过；全量 226 文件/1946 测试通过。

## 四、25 族真实状态采集（按具体状态记述，不外推整族）

证据：E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/（1920×1080/DPR1，t100admin/i5-tenant-100；另有 1366×768 六张）。

本轮取得真实结果的状态：

- FlowNode / WorkflowGrid：流程设计器画布真实节点（START/父审批/子流程/END）与任务详情「流程图」页签（START/父审批/子流程/END + 缩放/定位）。
- NodeProperties / NodeFieldPermissions / ApproverSource：审批节点「基础属性」（审批人策略/指定人员/可退回节点）与「字段属性」（字段名称/必填/编辑/隐藏）真实面板。
- FormPalette / FormProperties / BusinessForm：表单设计器三栏（组件库/画布/组件属性）与字段选中态；「明细表」业务组件添加后画布重排。
- ScriptWorkspace：字段「高级编辑（脚本）」面板与统一脚本弹窗（分类函数目录、预览、运行、应用）。
- DetailDialog：我发起的「查看」打开业务详情弹窗。
- NumberRuleBuilder：定义列表「编号设置」弹窗（模拟编号、日期/时间/流水号/常量/发起人/自定义、历史要素）。
- WorkflowSettingsLayout：`/workflow/defs/:id/settings` 真实设置页（通知/事件监听/结束通知渠道）。
- ThemeEntry / ColorPicker：主题弹窗（默认蓝色/青色/自定义取色）→ 完成青色（`--sw-color-primary=#087f8c`）→ 恢复蓝色（`#2563eb`），完成态截图两页。
- AppSidebar 收起态：管理侧栏 236→64px 图标列，真实截图；本身份菜单投影无目录层，目录浮层无真实入口可触发（组件能力保留，未删除）。
- TenantScope / ApplicationMenu / MenuItem / ActionMenu / IconPicker：顶栏租户徽标、管理端分区菜单、行内动作、菜单管理编辑弹窗图标选择器。
- WorkbenchCard / StatisticsChart：工作台配置 66 页（系统卡片+12 类数据组件+拖动排序/宽高提示）与真实工作台卡片布局。
- FormField / FormControl：表单填写页真实控件（文本、富文本工具条、必填标记）与设计器字段配置；子表字段配置面板。

仍未取得视觉数据的族（如实保留，不标通过）：

- ApplicationCard：应用中心 `/form/app-center` 当前真实空态「暂无可用应用」；应用管理 `/form/app-manage` 对该身份返回 403（`/form/app/manage/list`），无应用卡可渲染；不造应用数据。
- 目录浮层（收起态子级）：当前菜单投影无目录层，无法触发；非删除能力。

## 五、1366×768 实际交互（不只 overflowX）

六页均 `document` 横向溢出 0，并做了真实操作：

- `/workflow/defs`：表格内部滚动容器 1088→1642，可滚到最右；「编号设置」可见且点击打开弹窗。
- `/workspace`：待办「办理」点击后进入任务详情（`/workflow/task/...`）。
- `/form/form-render/form_a03_asset`：名称输入可填写，提交按钮可见。
- `/portal`：搜索框可见可聚焦。
- `/workflow/analytics`：四项定义统计 8/8/0/0 正常显示。
- `/form/designer/:id`：三栏 252/708/336，总宽 1296，页级无横向溢出。

## 六、门禁与变更

- typecheck 通过；lint 通过（注册表空行 prettier 警告已修正）；test 226 文件通过/1 跳过，1946 测试通过/3 跳过；build ✓ 4.25s。
- 变更：`ProcessDefList.vue`（行高 45、列宽 366/234/132）、`ProcessAnalytics.vue`（定义统计承接）、`dynamic-field-registry.ts`、新增 `dynamic-field-utils.ts`、`dynamic-field-subfield.ts`、`TableControl.vue`、`DeptControl.vue`、`UserControl.vue`。
- `vite.config.ts` 在途受保护，未纳入。

## 七、结论

6:2 节距与列位关闭，定义统计以真实计数承接，设计器深链崩溃修复；25 族中与设计器/详情/弹窗/脚本/设置/主题/收起/选择器相关的真实状态已取得，ApplicationCard 因无真实应用数据保留残余。整页像素未过（6:2 79.153%、7:2 98.638%、3:2 97.893%），排除口径仍不合规，不以分数宣称通过。A17 合并/发布/同步继续依赖整版验收。

## 八、Git 提交与推送回读（补记）

- Web：https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web.git，分支 codex/0.2.0-ui-tenant-form-flow，提交 c322225（b275273..c322225，8 文件）；`git ls-remote` 回读 `c32222513da739c52253df0d37310d4c5b3f82c1`，与本地 HEAD 一致。
- 根：https://github.com/Chikaaho/Smart-WorkFlow-Agent-Workspace.git，分支 codex/0.2.0-delivery，提交 a0f9bd9f（829decfd..a0f9bd9f，本回执+Web gitlink）；`git ls-remote` 回读 `a0f9bd9f0a6c48d2ef2a95934ea65f2ee56409ec`，与本地 HEAD 一致。
- 79 回执初版漏记该节，本次按实际提交补记；未执行合并、tag/Release、部署或强制推送。
