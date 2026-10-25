# 0.2.0 页面实现现状核实明细

2026-10-25｜Executor｜响应 search_task/0.2.0-ui-implementation-inventory-20261025.md｜只读核实，未改业务代码

核实时点：Web `codex/0.2.0-ui-tenant-form-flow` @ `8b564c5`（工作树仅 vite.config.ts 在途改动，未纳入核实结论）；Server `codex/0.2.0-tenant-form-flow` @ `6995f88`（工作树干净）。摘要见 `search_fallback/0.2.0-ui-implementation-inventory-20261025.md`。

## 总结论

182 个"仅待适配/验证"设计状态核实的分布：**108 已实现待验、63 等价复用、8 部分实现、3 未实现**。没有任何整页未实现；76 个有具体事实的条目按原证据承接不清零。真实缺口按页面归并后共 6 处（见文末），其中富文本格式 3 状态属方向已界定的待规划语义，其余 5 处为授权内可继续整改的 UI 形态/交互缺口。

分类口径：已实现待验=代码有完整承接、缺像素/行为验证；等价复用=共享组件或同页另一状态承接（主题变体由 CSS 变量机制作用于同一组件；超管页与普通页共用同一 views；多行操作菜单为按对象定位的重复展示引用）；部分实现=功能真实走通但缺设计稿中的形态元素；未实现=无承接。

## 一、逐组明细（182 状态）

### G03 数据详情与审批（15）

| 节点 | 设计名称 | 分类 | 承接位置 | 关键事实 |
| --- | --- | --- | --- | --- |
| 60:48 | 审批意见详情 | 已实现待验 | InstanceFlowPanel.vue:247-327,467-512 | 780px 意见详情弹窗：节点/审批人/部门/结果/时间/表单版本头 + 意见表单字段网格 + 意见 + 检查项芯片 + 附件行 |
| 60:190 | 会签列表详情 | 部分实现 | InstanceFlowPanel.vue:411-463,111-177 | 审批详情逐人行 + 流程图右栏会签进度；**无会签聚合视图**：locale 键 signGroupTitle/查看全部会签记录（zh-CN.ts:2256-2270）已备但全仓零 .vue 引用 |
| 60:413 | 部门负责人审批意见 | 等价复用 | 同 60:48 弹窗 | 部门以头部 assigneeDept 后缀展示，无专属视图 |
| 60:592 | 李宁会签审批意见 | 等价复用 | 同 60:48 弹窗 | 会签成员行→查看详情，同弹窗 |
| 90:68 | 数据详情·流程图 | 已实现待验 | InstanceFlowPanel.vue:357-408 + ProcessGraphView.vue + process-trace.ts | 懒加载定义图 + 真实轨迹高亮 + 右栏状态卡 + 图例 + 缩放；载体为 BusinessDetailDialog 全屏弹窗，另有整页 TaskGraphView |
| 90:311 | 数据详情·审批详情列表 | 已实现待验 | InstanceFlowPanel.vue:411-463 | el-table 五列，已处理行可开意见弹窗，未处理行"待提交" |
| 272:1746 | 驳回申请 | 部分实现 | TaskDetail.vue:620-629 + use-task-approval.ts:29-74 | REJECT 语义正确（区别 RETURN），走通用 ElMessageBox.confirm；无设计稿专用弹窗 |
| 273:1877 | 转办 | 已实现待验 | TaskDetail.vue:1264-1355（TRANSFER 分支） | 420px 弹窗：目标用户存 id 显姓名 + 备注；perm+canAct+节点策略三重门槛；spec 覆盖 |
| 273:1901 | 委托 | 已实现待验 | 同 lifecycle 弹窗 DELEGATE 分支 | 与转办共用模板，独立权限 |
| 273:1925 | 沟通 | 已实现待验 | 同弹窗 COMMUNICATE 分支:1289-1307 | 接收人多选必填 + 沟通内容 |
| 273:2001 | 退回申请 | 部分实现 | TaskDetail.vue:1184-1205,631-658 | RETURN 携 returnTargetNodeId，目标限审批历史人工节点（:438-445）；内联区+通用 confirm，无专用弹窗 |
| 273:2025 | 催办 | 部分实现 | TaskDetail.vue:889-918,865-871 | 仅发起人+实例 RUNNING+perm 可见；「更多」菜单直发，三态 toast；无弹窗/留言 |
| 299:1725 | 审批更多操作 | 已实现待验 | TaskDetail.vue:851-887,1207-1236 | 聚合转办/委托/沟通/加签/催办；通过/驳回直达、退回内联，符合"次要动作进更多" |
| 300:1808 | 审批·校验提示 | 部分实现 | TaskDetail.vue:555-567,256-270,1088-1111 | 意见/节点表单必填校验齐备（服务端 1401/2433 权威）；形态为 toast+内联错误块+星标，缺设计稿样式 |
| 329:6450 | 表单详情 | 已实现待验 | BusinessFormReadonly.vue | 24 栅格只读渲染、REFERENCE 显示名异步解析、空态；办理页与统一弹窗共用 |

### G04/G24-G31 系统管理与超管（30）

| 节点 | 设计名称 | 分类 | 承接位置 | 关键事实 |
| --- | --- | --- | --- | --- |
| 459:14712 | 超管·04 管理后台 | 已实现待验 | layouts/admin-sections.ts | 七段分组投影（system/applications/forms/workflow/notify/agent/iot），只重排展示、保留原 id/路径/权限 |
| 446:13693—16098 | 编辑 用户/部门/角色/菜单/字典/岗位/用户组/字典项 ×8 | 已实现待验 | modules/system/views/ 八个 List.vue | 各列表 dialog 均具备，编辑回显形态待逐页像素验证；UserList 编辑取用户详情租户、角色按目标租户装载（:151,199-207） |
| 446:16226 | 角色成员 | 已实现待验 | RoleList.vue:206-210 | I1 成员维护反向视图弹窗 |
| 447:12034/12274 | 部门/菜单管理·收起 ×2 | 已实现待验 | DeptList.vue:495、MenuList.vue:149 | setAllExpanded(false) 全部收起按钮 |
| 447:12885—13609 | 新增 用户/部门/角色/字典/岗位/用户组/字典项 ×7 | 已实现待验 | 同八个 List.vue 新增弹窗 | 新增用户按明确目标租户（DR03） |
| 459:12885—14490 | 超管·系统管理 8 页 | 等价复用 | 同 modules/system/views/ | 同一 views 经管理端 sections 呈现，无第二入口 |
| 459:15041 | 超管·35 应用管理 | 等价复用 | AppManageList.vue | applications section 复用 |
| 459:15228 | 超管·38 表单管理 | 等价复用 | FormDefList.vue | forms section 复用 |
| 460:14460/14689 | 超管·用户管理·CH科技/深圳中心 | 等价复用 | UserList.vue:118,126 | appliedTenant 租户筛选同一页面的两个取值状态 |
| 460:14918 | 超管·租户筛选 | 已实现待验 | UserList.vue（appliedTenant/tenantId） | 租户筛选真实生效；TenantList 租户 0 只读（TenantList.vue:302"租户 0 为保留对象，只提供查看"） |

### G07/G36/G37/G39 表单设计与属性（30）

| 节点 | 设计名称 | 分类 | 承接位置 | 关键事实 |
| --- | --- | --- | --- | --- |
| 49:2 | 字段属性列表 | 已实现待验 | modules/form/designer/FieldListPanel.vue | 工作区页签（0.1.7 #39），补丁回写字段名/长度/描述单一数据源，可导出 JSON |
| 272:1575 | 离开编辑器 | 已实现待验 | FormDesigner.vue:393-477 | 脏状态保护：切工作区/路由离开/beforeunload 共用「保存/放弃/取消」 |
| 272:1594 | 发布新版本 | 已实现待验 | FormDesigner.vue（发布链） | 发布只针对最近成功保存草稿；未保存先保护；发布失败不得继续 |
| 280:1863 | 设计器·未保存修改 | 等价复用 | 同上脏状态机制 | 同一机制的不同触发状态 |
| 272:1883 | 表单预览 | 已实现待验 | FormDesigner.vue:846 + PreviewModal.vue | 工具条预览按钮 |
| 472:15663 | 演练资源清单·流程未配置 | 已实现待验 | RelatedProcessesPanel.vue:198 | hasFormKey 空态（related-processes__empty） |
| 472:15867 | 演练资源清单·创建流程 | 已实现待验 | RelatedProcessesPanel.vue:86+ | 创建关联流程自动带入表单身份（POST /workflow/defs），不建平行体系 |
| 490:16184—16867 | 设计器·文字 默认/左/右/常规/24px/紫色 ×6 | 已实现待验 | field-types.ts:190-202（LABEL）+ LabelControl.vue + field-config.ts:38-46 | LabelField 契约：text/color/fontSize/fontWeight/textAlign 全齐 |
| 490:16919/16934 | 文字字号/文字颜色 | 已实现待验 | OaFieldConfig（LABEL configComponent） | 字号/颜色配置项真实存在 |
| 495:18648/18663/18680 | 富文本·字体/字号/颜色 ×3 | 未实现 | RichTextControl.vue | **降级 textarea，无工具栏**；富文本格式属方向"待规划语义"（安全编辑/显示、格式、旧值兼容需 Planner 明确；现状字符串存储） |
| 273:1845 | 字段校验规则 | 已实现待验 | field-config.ts + FieldConfigPanel.vue + FormRender.vue | 长度/正则配置在设计器与填写链均存在（minLength/pattern 命中三处） |

### G11/G12/G13/G16 应用与表单管理（38）

| 节点 | 设计名称 | 分类 | 承接位置 | 关键事实 |
| --- | --- | --- | --- | --- |
| 272:851 | 应用工作区 | 已实现待验 | AppWorkspace.vue | 目录/表单树 + 行尾菜单 |
| 272:1144 | 应用管理·目录与表单 | 已实现待验 | AppManageList.vue | 应用/目录/表单管理 |
| 272:1296 | 应用数据列表·目录收起 | 部分实现 | AppCenterDetail.vue:13 | 左侧目录/表单导航存在；**收起交互未找到**（AppWorkspace/AppCenterDetail/AppManageList 无 collapse/收起） |
| 272:1831 | 显示列设置 | 已实现待验 | FormDataList.vue:867 | 显示列抽屉分区（sectionColumns） |
| 273:1642 | 应用表单·查询受限 | 已实现待验 | FormDataList.vue:843-847 | data-forbidden 明确受限态，保留已授权填写入口 |
| 272:1698 | 新建目录 | 已实现待验 | AppWorkspace.vue:113 + newDir 对话框 | |
| 272:1722 | 目录设置 | 已实现待验 | AppWorkspace.vue:113（editDir） | 编辑目录对话框（同一弹窗新增/编辑态） |
| 273:1709 | 目录操作菜单 | 已实现待验 | AppWorkspace.vue:23 | 目录行尾三个点：修改/删除/新建表单 |
| 273:1731 | 表单操作菜单 | 已实现待验 | AppWorkspace.vue:23 | 表单行尾：修改（仅名称）/删除 |
| 273:1773 | 应用操作菜单 | 已实现待验 | AppManageList.vue | 应用行操作 |
| 471:17256 | 删除应用 | 已实现待验 | zh-CN.ts:999 deleteConfirm | 有目录/表单时服务端拒绝 |
| 471:17292—17432 | 应用操作菜单·2—12 ×11 | 等价复用 | AppManageList 行菜单 | 按对象定位的重复展示引用 |
| 527:24177 | 表单重命名 | 已实现待验 | AppWorkspace 修改（仅名称） | |
| 527:24216 | 新建表单 | 已实现待验 | AppWorkspace.vue:24,352 | 只收集名称、进设计器新建态，首次保存才建记录（回归01b） |
| 527:24255/24284 | 删除目录/表单确认 | 已实现待验 | zh-CN.ts:1028,1035 | deleteDirConfirm/deleteFormConfirm |
| 528:24117/24137/24157 | Form/Directory/Form 菜单 ×3 | 等价复用 | AppWorkspace 行尾菜单 | 重复展示引用 |
| 272:1401 | 表单管理 | 已实现待验 | FormDefList.vue | 含 V011-BUG-014 新建表单名称+归属 |

### G15/G33/G34/G35/G32/G18/G19/G20/G40 流程中心、任务与账户（37）

| 节点 | 设计名称 | 分类 | 承接位置 | 关键事实 |
| --- | --- | --- | --- | --- |
| 100:2 | 流程中心·行政办公 | 已实现待验 | ProcessCatalog.vue | 分类树（全部/分类/未分类+计数）数据驱动；设计稿 5 分类为数据示例 |
| 100:387/772/1157/1542 | 财务/IT运维/设备/平台权限 ×4 | 等价复用 | 同 ProcessCatalog 分类切换 | 服务端分类数据 |
| 445:13402 | 流程中心·多数据·第1页 | 已实现待验 | ProcessCatalog.vue:382 ListPagination | 分页完整：total/sizes/prev/pager/next/jumper 标准布局（初判"无翻页控件"为大小写敏感漏检 ListPagination，已更正） |
| 445:13732 | 第2页 | 等价复用 | 同上 | 同页翻页状态 |
| 101:2 | 用户端·发起流程 | 已实现待验 | ProcessCatalog 发起链 | 流程选择+表单填写 |
| 272:1784 | 申请提交结果 | 已实现待验 | FormRender.vue:1103 | el-result 提交成功居中确认弹窗（0.1.7 #16），确认后按去向跳转 |
| 272:1799 | 保存草稿结果 | 已实现待验 | FormRender.vue:810 | ElMessage draftSaved；MyDrafts 列表承接 |
| 300:1692 | 表单填写·校验提示 | 已实现待验 | FormRender.vue:127,492-543 | 字段内联校验与字段同处网格单元；脚本隐藏字段同口径不参与 |
| 278:1235 | 我的待办 | 已实现待验 | TodoList.vue | 含待确认加签取消（fe020 已按隔离层级采信） |
| 278:1437 | 我的草稿 | 已实现待验 | MyDrafts.vue | |
| 278:1591 | 流程分类维护 | 已实现待验 | ProcessCatalogAdmin.vue:31- | 分类 CRUD+归属调整（有归属须先解除，服务端约束） |
| 472:16071 | 流程管理·选择表单 | 已实现待验 | FormSelectDialog.vue | |
| 273:1563 | 账号绑定 | 已实现待验 | AccountBindings.vue + AppTopbar 入口 | |
| 273:1600 | 工作台布局配置 | 已实现待验 | WorkspaceEditor.vue + WorkspaceBoard.vue | |
| 103:2 | 用户端·个人菜单 | 已实现待验 | AppTopbar.vue（avatar dropdown） | 账号绑定/进入后台或返回前台/修改密码/退出 |
| 103:398 | 管理端·个人菜单 | 等价复用 | 同 AppTopbar | 管理上下文同一组件 |
| 134:2 | 用户头像菜单·原型浮层 | 已实现待验 | AppTopbar.vue:193- | el-dropdown trigger=click |
| 135:2 | 修改密码·原型浮层 | 已实现待验 | ChangePasswordDialog.vue（AppTopbar:331） | |
| 138:5 | 管理端头像菜单 | 等价复用 | 同 AppTopbar | |

### G08/G22 流程设计配置与脚本（63→本节含 46+17，逐项见下）

| 节点 | 设计名称 | 分类 | 承接位置 | 关键事实 |
| --- | --- | --- | --- | --- |
| 49:240 | 审批人选择 | 已实现待验 | contracts/bpm-node.ts:24 + ApproverCandidatesDialog.vue | PARTICIPANT_STRATEGIES 策略集（含 FORM_FIELD/NODE_FORM_AGGREGATE） |
| 50:88 | 流程设置·通知 | 部分实现 | ProcessDesigner.vue:409-481 | 高级配置弹窗**只读呈现** notifyTargets/channels/template（"不新增任何端点"）；无编辑入口 |
| 272:1814 | 流程校验结果 | 已实现待验 | ProcessDesigner.vue:20,24 | validateProcessDefGraph + 错误定位 |
| 273:2049 | 发布结果 | 已实现待验 | ProcessDesigner 发布链 | 保存/校验/发布同权威 |
| 273:1051 | 流程变量 | 已实现待验 | ProcessDesigner.vue:704- | BpmVariableDef 弹窗，var_ 前缀自动补齐（BF20261013-019⑦） |
| 273:1095 | 流程触发器 | 已实现待验 | ProcessDesigner.vue:802- | TriggerDraft+分支+启停校验 |
| 273:1257 | 审批意见表单选择 | 已实现待验 | ProcessDesigner.vue:502-547 | nodeForm formKey 绑定+名称解析，不向业务人员暴露内部标识 |
| 273:1332 | 动态并行配置 | 已实现待验 | ProcessDesigner.vue（动态并行 11 处） | 会签/动态并行随品牌色已锁定（U020-26） |
| 273:1368+405:8967—8971 | 编号设置 日期/流水号/常量/时间/发起人/自定义 ×6 | 已实现待验 | ThemeRuleDialog.vue | 要素编排器：要素条选中/删除/移动/清空 + 实时预览；自定义=受控表达式（只读变量不执行脚本） |
| 278:1567 | 节点操作与退回目标 | 已实现待验 | ProcessDesigner.vue:2610-2700,3916,3982 | allowedActions 多选+hint；可退回节点=本流程人工节点多选不手填（BF20261013-027） |
| 278:1634/1669/1719 | 子流程 目标流程/字段映射/等待与回写 ×3 | 已实现待验 | ProcessDesigner.vue:937,2009-2245 | 三步向导+行级/主记录回写映射+SUBFLOW_WAIT 等待块（ALL/ANY 继续条件） |
| 352:8058 | 流程设计器·高级 | 部分实现 | ProcessDesigner.vue:409 | 高级配置弹窗只读呈现（统一监听器/通知/前置/后置） |
| 549:24449 | 设计器·字段 | 已实现待验 | ProcessDesigner.vue:589 | 节点「字段属性」页签（必填/编辑/隐藏三态，BF20261013-013） |
| 549:24653/24857/25061/25265/25469/25673 | 蓝/青/自定义 ×字段/高级 ×6 | 等价复用 | 同上 + CSS 变量主题 | 主题四档共享颜色偏好（主题批次 d6ee85d 已锁定本地行为） |
| 380:7785 | 新增监听器 | 已实现待验 | ProcessDesigner.vue:4423-4429 | 事件监听弹窗「新增监听」+草稿编辑 |
| 380:7786 | 监听器·选择时机 | 已实现待验 | 同上 | 时机=事件类型选择（TASK_SUBMITTED/NODE_ROUND_COMPLETED/PROCESS_COMPLETED） |
| 383:8440 | 监听器·流程结束 | 已实现待验 | 同上 | 流程级事件留空源节点 |
| 549:26135/26167 | 事件监听·编辑发起前检查/结束后同步 | 已实现待验 | 同一触发器弹窗 | 编辑态承接 DR07 统一监听视图 |
| 558:26524—26693 | 时机 修改/选项/修改选项 ×6 | 等价复用 | 同一弹窗时机选择器 | 同一控件的状态变体 |
| 572:26308 | 默认·表单组件审批人 | 已实现待验 | FORM_FIELD/NODE_FORM_AGGREGATE 策略 | value 对象形状与服务端校验单一权威一致 |
| 572:26728/27148/27568 | 蓝/青/自定义·表单组件审批人 ×3 | 等价复用 | 主题变体 | |
| 574:27788 | 审批人·选择表单组件·默认 | 已实现待验 | 表单组件审批人选择器 | |
| 574:28035/28276/28517 | 蓝/青/自定义·选择表单组件 ×3 | 等价复用 | 主题变体 | |
| 352:9171 | 审批人·JS 脚本 | 已实现待验 | EXPRESSION + ScriptDialog | 服务端模拟（/workflow/scripts/preview 同 GraalJS 引擎，避免本地解释器漂移） |
| 355:6765 | JS 脚本·插入函数 | 已实现待验 | ScriptDialog.vue:6 | 左侧分类目录点击插入用法片段 |
| 355:6910 | 审批人脚本·运行结果 | 已实现待验 | ScriptDialog.vue:92-201,306 | 模拟运行结果区（服务端优先、表单脚本本地解释器） |
| 383:8007 | 事件监听·JavaScript | 已实现待验 | ScriptDialog + PROCESS_SCRIPT_FUNCTIONS | 流程脚本目录 |
| 563:26756/26825/26894 | 事件监听 JS 插入函数/运行结果/组合 ×3 | 已实现待验 | 同上 | |
| 273:1305 | 节点触发脚本 | 已实现待验 | ProcessDesigner.vue:2128 | ScriptDialog 应用目标含节点触发器 |
| 572:26514 | 默认·脚本审批人 | 已实现待验 | 同 352:9171 | |
| 572:26934/27354/27774 | 蓝/青/自定义·脚本审批人 ×3 | 等价复用 | 主题变体 | |
| 574:27895/27965/28136/28206/28377/28447 | 审批人脚本 蓝/青/自定义（含运行结果）×6 | 等价复用 | 主题变体 | |

## 二、25 组件族

覆盖表（u020-design-coverage.md §25 组件族）所列 25 族承接位置全部真实存在（Button/Input/Tag→tokens.css；FlowNode→ProcessGraphView；Select/Choice/Switch/Upload/RichText/Subtable/Date/Number→dynamic-field-controls/*；ProcessShortcut→ProcessCatalog；SidebarToggle→BasicLayout；MenuPermissionTree→RoleList；MenuItem/ActionMenu→ListActionsColumn；ApproverSource/流程节点画布→ProcessDesigner/ProcessGraphView；共享业务组件/BusinessForm/表单控件填写只读→business-detail/DynamicField）。族级完整视觉/状态对照仍未做，属视觉验收工作而非实现缺口；其中 RichText 族受富文本待规划语义约束、Subtable/BusinessForm 已有局部真实结果（回执 19/20）沿原边界。

## 三、Server 契约七项（search_task 问题 3）

| 问题 | 结论 | 位置与事实 |
| --- | --- | --- |
| 1 运行查询 formKey+fieldKey | 存在 | FormDataQueryController.java:17-47：POST /form/data/{formKey}/query；FormDataFilter.field=逻辑字段名（非物理列）；FieldPermissionService.java 评估 definition.fieldPermissions view/edit |
| 2 设计预览授权 | 存在 | FormExtDataController.java:21,53-76：/form/ext/query 同一入口按请求形态区分——不带 formKey=设计预览（检查当前设计授权，撤权后同 queryKey 预览拒绝）；带 formKey=运行读取按发布绑定 |
| 3 PROCESS_COMPLETED 语义 | 存在且与方向一致 | TriggerExecutionService.java:236「流程合法完成（APPROVED 终态）后触发；驳回/废弃/撤回不触发」；DR07 新配置提交后阶段、旧配置缺 enabled 同事务（:46） |
| 4 授权代理 DTO | 存在 | ApprovalAction 枚举 AUTHORIZE；ApprovalActionRequest.java:53-62 ruleId/scopeType(GLOBAL/PROCESS/NODE/BUSINESS)/processDefKey/节点范围；BpmAuthorizeRule+Mapper；前端 AuthorizeRules.vue 已对接（fe020） |
| 5 退回节点/轮次 | 部分 | ApprovalActionRequest.returnTargetNodeId（:16）；枚举注释明确 RETURN 生成新办理轮次——**轮次由服务端管理，请求不携带轮次字段**；候选退回节点无独立服务端 API，前端从审批历史人工节点派生（TaskDetail:438-445） |
| 6 加签位置/顺序/补签 | 存在 | ApprovalActionRequest.java:38-51：participants+mode(SERIAL/PARALLEL)+signPosition(BEFORE/AFTER，缺省 BEFORE 保持旧语义)+policy(ALL_PASS/ANY_PASS/AUTO_FINISH)+recordId（补签表态）；ADD_SIGN/SUPPLEMENT_SIGN 独立动作；候选由前端提交、服务端统一命令幂等 |
| 7 单任务 DISAPPROVE | 存在 | ApprovalAction 枚举独立 DISAPPROVE（"当前参与人不通过意见，交节点结算规则"），与 REJECT（流程级终态）明确区分；NodeActionPolicy 允许动作含 DISAPPROVE；ConsensusCompletionEvaluator/DynamicBranchTaskListener 均消费 |

结论：七项契约中六项完整存在、一项（退回轮次口径）为"服务端管理轮次+前端历史派生候选"的现状事实，无跨会话阻塞；前端可直接对接，旧"待后端"摘要应按本表现实取代。

## 四、锁定项复核（search_task 问题 4）

- Server HEAD 6995f88 含 G1/G2 测试文件（ExternalDatasourceGrantsWriteAdmissionTest.java、TriggerPartialFailureRecoveryTest.java 均在 HEAD 树内）。
- Web HEAD 8b564c5 为 d6ee85d（主题）、8c51283（会签夹具）、74fb365（21 设置收口）、873bd81（23 设计器几何）、34610e9（24 宽桌面）、2b93e53（26 语义色）的祖先——六个已锁定批次全部被当前 HEAD 承接。
- 快照查看器 PublishedSnapshotViewer.vue 存在（coverage 已按 08 回执消解，不重开实现）。
- 两分支与远端同点（Web 状态 -sb 无 ahead/behind；Server 同），无需重验推送。

## 五、真实差距清单（归并后 6 处）与下一动作

1. **富文本字体/字号/颜色（3 状态，未实现）**：方向已界定为待规划语义（安全编辑/显示、格式、旧值兼容）。下一动作：按方向§5 把字符串存储与降级现状事实回传 Planner 明确语义；不凭字段名制造控件能力。
2. **会签列表聚合详情（60:190）**：locale 键已备零引用。下一动作：在 InstanceFlowPanel 审批详情区接线会签聚合视图（复用已备键与既有行数据）。
3. **驳回/退回/催办弹窗形态（272:1746/273:2001/273:2025）**：功能与权限真实。下一动作：按设计稿补专用弹窗形态（理由/留言输入收进弹窗），不改接口语义。
4. **审批校验提示样式（300:1808）**：逻辑齐备。下一动作：对齐设计稿提示样式。
5. **通知与高级配置编辑化（50:88/352:8058）**：当前只读呈现。下一动作：评估既有服务端配置端点，补编辑入口或按契约确认只读边界。
6. **应用数据列表目录收起（272:1296）**：导航在、收起交互缺。下一动作：补收起/展开交互。

~~流程中心翻页~~：初判缺口为核实方法误差（大小写敏感 grep 漏检 ListPagination），实际分页完整，不构成差距。
以上 2—6 均在 U020 既有授权内，作为分支实施阶段继续整改项；108 个"已实现待验"项进入像素对照与行为验证队列（A03/A04 口径），63 个等价复用项随所属组件/页面的验证一并覆盖。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。本核实不改变功能数、P 编号与正式基线。
