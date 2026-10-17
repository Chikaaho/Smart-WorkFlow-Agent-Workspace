# 0.1.7 修复轮次回执 01（18/18 项已修复并自验）

> **回归补丁 01c（2026-10-17）**：Owner 回归反馈——树行点击应看数据列表（数据列表不能丢），「修改表单」入口应放在三点菜单里。
> 处置：应用详情树点击表单恢复右侧数据列表（formKey 选中态 + AppFormData 内嵌）；
> 表单行三点菜单 = 表单设计（直达设计器，已发布可改）/ 编辑（改名）/ 删除；设计器返回应用详情与新建不落库行为不变。
> 验证：可见浏览器实测（行点击出数据列表、菜单三项、表单设计直达已发布表单设计器）；vue-tsc 零错误。
> 提交：Web `bugfix/0.1.7@61e71a5`（已推送回读）。

> **回归补丁 01b（2026-10-17）**：Owner 回归反馈 bug4 三问——①新建表单未保存不应新建记录；
> ②应用中心进入表单设计保存后返回应落在应用详情（此前落到「表单上下文」中转页）；
> ③已发布表单在应用详情找不到修改入口。
> 处置：应用详情「新建表单」只收集名称不落库，进设计器新建态、首次保存才创建（携带应用/目录归属与预填名称）；
> 设计器 `from=app-form` 时保存/返回统一回应用详情（按钮文案「返回应用」）；应用详情树点击表单直达设计器（修改入口，配合 #14 保存+发布新版本）。
> 验证：DB 计数对照（新建未保存=3 不变；设计器保存后=4 且 app_id/dir_id 正确；删除清理后=3）；
> 可见浏览器实测 返回落点/树点击直达设计器/已发布表单按钮组（保存+发布新版本）；vue-tsc 零错误。
> 提交：Web `bugfix/0.1.7@722ef82`（已推送回读）。

> **回归补丁 01a（2026-10-17）**：Owner 回归反馈「待办已办等左上角标题未去除，全局所有（含后台管理）」。
> 处置：全部 `StandardListTemplate` 列表页（37 个，含后台 31 个与门户 6 个）剥除 `:title`；
> 模板在无标题且无动作且不显示总数时不再渲染工具栏（不留空条）。后台页保留其右上动作（如「新建用户」）。
> 验证：可见浏览器实测 门户待办（无标题无空条）+ 后台用户管理（仅动作按钮）；
> `vue-tsc` 零错误；page-layout spec 38/38（空态用例按 #7 新契约演进）。
> 提交：Web `bugfix/0.1.7@ea9c372`（已推送回读）。

日期：2026-10-17。角色：执行（Executor）。依据：`product/0.1.7-bugfix/ready/direction-bugfix-017.md` 与唯一缺陷清单。

## 0. 清单位置变更（重要）

清单文件已由 Owner 由 `1.0.7bug.md` 更名为 **`product/0.1.7-bugfix/0.1.7bug.md`**（本回执与台账回填均使用新路径；方向文件中的旧引用建议由规划在信息同步时一并校正）。

## 1. 范围与结果

台账 1—18 项全部完成修复与执行侧自验，已在 `0.1.7bug.md` 原表逐项回填「是否已修复=是」；「回归结果」列按分工留给 Owner。19/20 为空行未动。

## 2. 逐项落点（原序号 → 修复要点）

| 序号 | 落点（关键文件） | 要点 |
|---|---|---|
| 1 | Server `sw_form_app_scope` + `FormAppScopeMatcher` + `FormAppSaveReq/FormAppDTO`；Web `AppScopePicker.vue` | 可见范围扩展为 用户/部门(主属)/角色(code)/岗位(sys_user_post)/租户 五维度，任一命中即可见；V0.1.7 迁移建表并迁移存量指定用户；判定收敛于服务端 matcher，列表/详情/闸门同口径 |
| 2 | Web `AppManageList.vue` | 颜色仅保留 8 色预设色板，删除自由输入（含 RGB/HEX） |
| 3 | Web `AppManageList.vue` 重构 | 网格画布：卡片上图标下名称、右上三点（修改/删除）、最后一张固定「新建应用」；去分页与顶部新建按钮 |
| 4 | Web `AppWorkspace.vue` 重构 + `BasicLayout` | 应用专属侧边栏（同用户端树 + 左下角「新建」目录/表单），行尾三点：修改（仅名称）/删除，目录多「新建表单」；空应用中间仅「暂无数据」；左上角返回箭头；管理端详情路由不再渲染通用侧边栏 |
| 5 | Web `AppLogo.vue` | 品牌列宽与侧栏同源（portal=`--sw-layout-aside-width` 224px、admin=236px），多分辨率随 token 对齐 |
| 6 | Server `V0.1.7__bugfix017_menu_and_app_scope.sql`（PG+H2） | 定时任务（id 17/18/19）并入系统管理（sort 90）；应用管理（id 9130）上提顶级 sort 15=第二项 |
| 7 | Web `StandardListTemplate.vue` | 空列表恒渲染表头；空态文案用 el-table 内建「暂无数据」；empty-action 槽移到表格卡片底部继续可用（30+ 调用方零破坏） |
| 8/9 | Web `TodoList.vue` / `ProcessedList.vue` | 移除右上角「已办任务/批量审批」「待办任务」按钮 |
| 10 | Web `StandardListTemplate.vue` | 模板改纵向 flex 画布：数据卡片撑满、分页固定右下；`MyInstances.vue` 去左上说明文字 |
| 11 | Web `AppFormDetail.vue` | 冗长返回按钮改左上角圆形返回箭头 |
| 12 | Web `AppWorkspace.vue` | 新建表单成功后直达 `/form/designer/:id`（顶部「表单设计/流程设计」页签可切换） |
| 13/15/16/18 | Web `FormRender.vue` 重构 | 统一数据表单画布：整条 top 导航栏=左上圆角返回+右上圆角保存草稿/提交；画布仅渲染设计器 24 栅格字段（无表单名/流程名/流程图噪音）；提交成功改为居中「提交成功」确认弹窗（#16），确认后按是否发起成功跳转 |
| 14 | Web `FormDesigner.vue` | 解除已发布表单的画布编辑封锁（组件库添加/拖拽/子表编辑/保存），「保存」持久化工作定义（运行时填写仍走已发布快照），「发布新版本」原子落库；离开保护与草稿同一套「保存/丢弃/取消」 |
| 17 | Web `MyInstances.vue` | 「查看详情」改为直达该实例表单本体（`/form/form-render/:formKey?recordId=&mode=view`，businessKey=表单记录 ID）；无表单绑定实例才回落元数据弹窗 |
| 18（TaskDetail 部分） | Web `TaskDetail.vue` | 页头只留返回箭头；删除右侧「流程状态」轨；数据表单按设计器栅格直出（LABEL 文字随之展示，修「该表单无可展示业务字段」）；审批意见（默认备注）置底、全部操作按钮（催办/转办/委托/沟通/加签/补签/驳回/通过）右下角且操作卡吸底；全屏画布不渲染侧边栏/页顶栏 |

## 3. 附带工程项（修复必需）

- Server 新增 `PUT /form/def/{id}/name` 仅改名端点（0.1.7 #4 应用树上「修改」；不动 formKey/定义/物理列，全部状态可改），前端 `renameFormDef` 接线。
- `GET /form/app/manage/tenants` 租户选项端点（TENANT 维度候选）。
- 既有 4 个测试的构造器/H2 夹具随接口同步（`FormAppServiceTest` 夹具迁至 `sw_form_app_scope`）。

## 4. 验证记录（执行侧自验）

- 视觉/交互：可见浏览器实测（本机 1280×720），关键截图（本地证据，不入库）：`%TEMP%\sw-017\b2-app-manage-grid.png`、`b2-app-workspace.png`、`b3-form-render-fill.png`、`b3-submit-dialog.png`、`b3-task-detail.png`。
- 菜单（#6）：`GET /system/auth/menus` 顶级顺序=系统管理(10)→应用管理(15)→表单管理(20)→…；系统管理侧边栏含 定时任务/任务管理/执行日志。
- 多维度（#1）：创建含 DEPT+ROLE 维度应用→回显正确→删除清理；matcher 服务端口径单点。
- 改名端点：`PUT /form/def/{id}/name` 返回 0。
- 数据库：Flyway `0.1.7 bugfix017 menu and app scope` success=t；`sw_form_app_scope` 存量迁移 1 行。
- 前端门禁：`vue-tsc -b --noEmit` 零错误；改动文件 ESLint 零错误；`FormRender.spec.ts` 12/12 通过（按 #13 新 UI 演进断言：无表单名、动作收进顶部导航栏）。
- 后端：`mvn -Pdev -pl sw-bootstrap -am clean package -DskipTests` BUILD SUCCESS；常驻后端以 local profile 重启并 `Started StarterApplication`、health UP。

## 5. 已知边界与说明

- dev:mock 的菜单种子（`src/foundation/mock/seeds.ts` MOCK_MENU_TREE）未同步 #6 结构（该模式仅前端独立开发辅助；真实菜单以 sys_menu 为准）。如实说明，未伪装。
- TaskDetail 底部「流转记录/流程图/审批详情列表」页签按 #18 未点名保留（审批历史可用性优先）；右侧流程状态轨已按要求移除。如需一并移除请 Owner 在回归时指出。
- 表单级「发起范围」（`sw_form_def.visibility_scope`）为既有独立能力，#1 仅涉及应用级可见范围，未混用两套语义。
- 已发布表单「保存」只更新工作定义，线上版本仍由快照服务，须「发布新版本」后生效（与 #14 期望一致）。
- 本轮服务端验证提交的测试数据均已清理（临时目录/验证表单/验证应用）；Owner 自测产生的数据未触碰。

## 6. Git 与环境事实

- 三仓起点：workspace `develop-sw@92ce0cd9`、Server `develop@eca43b7`、Web `develop@a60a819`（本轮修复在 Server/Web 新建 `bugfix/0.1.7` 分支提交，后续按链 开发分支→develop→main 走）。
- 常驻本地服务：后端 8080（local profile，PG `sw_017_bugfix`，Flyway 至 0.1.7）、前端 5173（vite 代理 /api）。登录 `admin/admin123`，验证码固定 `1234`。
- 台账回填批次与回执：workspace `develop-sw` 提交推送（见提交记录）。

---

# 增补 02：回归01通过（1–18 全 Y）+ 新增 19/20/21 修复

Owner 回归：台账 1–18「回归结果」全部 Y；同批提交新 bug 19/20/21。本轮（2026-10-17）三项修复并完成执行侧自验。

## 1. 修复对照

| 序号 | 位置 | 内容 |
| :--: | :--- | :--- |
| 19 | Web `FormRender.vue` | 提交按钮 `form.launch`（发起流程）→ `common.submit`（提交）；`form.launch` 键两语言移除（仅此一处使用，`catalog.launch` 流程目录语义不动） |
| 20 | Web `TaskDetail.vue` | 根因：`goBack`/`navigateAfterAction` push 不存在的命名路由 `TodoList` → 静默 reject，返回点击无效。改为「返回上一页」：`history.state.back` 存在即 `router.back()`，直达打开无历史时兜底回 `workspace-todo`；审批结束（通过/驳回及转办/委托/沟通/加签/补签完成）统一走该语义 |
| 21（流程禁删） | Server `BpmProcessDefController/Service/Impl` + Web `ProcessDefList.vue`、`RelatedProcessesPanel.vue`、`api/index.ts`、`adapters/process-catalog.ts` | 删除流程定义能力整体移除（DELETE `/workflow/defs/{id}` 端点、`deleteDef` 服务方法、前端删除入口与 API/接缝函数）；流程草稿（我的草稿 `BpmDraftController`）不在禁删范围 |
| 21（表单软删） | Server `FormDefServiceImpl.deleteDraft` + Web `FormDefList.vue` | 表单删除解除「仅 DRAFT」限制：任何状态可软删（`@TableLogic` deleteById，物理表/快照/数据保留 deleted=1），审计记录 DELETE；表单管理列表新增「删除」动作（确认弹窗） |
| 遗留债收敛 | Web `ThemeRuleDialog.vue` | `visible` watch 补 `immediate: true`——异步组件晚于 visible=true 挂载时首次打开不加载编号规则（HEAD 上既有失败用例暴露的真实缺陷，非仅测试问题） |
| 遗留债收敛 | Web `TaskDetail.spec.ts` | 同步 #18 后契约：移除已不存在的 `isFinishedTask`/`headerTagLabel` 断言；新增「有历史→router.back」「无历史→兜底 workspace-todo」两用例 |

## 2. 验证记录（执行侧自验，2026-10-17）

- 前端门禁：`vue-tsc --noEmit` 零错误；`FormRender.spec`（12）+`TaskDetail.spec`（20）+`ProcessDefList.spec`（7）+`RelatedProcessesPanel.spec`（5）共 44 用例全绿（含上述新增/改写用例）。
- 后端门禁：`mvn -q -DskipTests package` BUILD SUCCESS；受影响测试 `FormI2ClosureIntegrationTest`(8，含改写「已发布表单可软删+DELETE 审计」)+`FormDefinitionServiceTest`(17)+`FormDefinitionControllerAuthorizationTest`(7)+`FormDataDeleteServiceTest`(7)=39/39 绿。
- 浏览器实测（本机 1280×720，证据本地留存不入库）：
  - #19：填写页顶栏=返回/保存草稿/**提交**，无「发起流程」。
  - #20：待办行点击进详情→左上返回箭头回 `/workspace/todo`（修复前点击无效）；待办列表对 20261017-002 快捷「通过」→确认弹窗→审批完成后停留上一页且列表刷新（该待办消失）。
  - #21：流程定义列表行操作仅剩 设计/查看流程图/流程编号设置（无删除）；表单管理「已发布」行 更多 菜单含 删除；新建临时表单「临时软删验证」→删除→列表即消失，只读 SQL 复核 `sw_form_def` 该行 `deleted=1` 保留。
- 服务：8080 以 `sw-bootstrap/target/bootstrap.jar`（13:50 构建，含本轮后端改动）local profile 重启 `Started StarterApplication`，`/api/auth/captcha` 401（可达）；5173 vite 200。

## 3. 已知边界与说明

- 自验动作动了的 Owner 测试数据：待办 20261017-002 被执行「通过」（审批回归验证）；临时表单「临时软删验证」已软删（deleted=1 保留）。其余未触碰。
- 表单管理左侧分类树计数在列表页内删除后不即时刷新（来源 app-center 接口，重进页面即正确）——计数展示瑕疵，未在本轮扩散修改。
- 流程定义禁删后，`workflow:def:delete` 权限标识随之失去服务端挂载点（前端入口与后端端点均已移除）；如需在权限体系保留占位请 Owner 裁量。
- dev:mock `handlers.ts` 仍保留 DELETE /api/workflow/defs/:id 假实现（仅 mock 模式，无真实链路），与已记录的 mock 种子未同步同批，不单独处理。

## 4. Git 事实

- Web `bugfix/0.1.7`：本轮提交（见仓库提交记录），前置 `61e71a5`（回归01c）。
- Server `bugfix/0.1.7`：本轮提交（FormDef 软删 + Bpm 禁删）。
- workspace `develop-sw`：台账 19/20/21 回填 + 本增补。

---

# 增补 03：回归02通过（19/20/21 由 Owner 复测）+ 新增 22–26 修复（全局布局降噪轮）

Owner 提交补充批 22–26（全局返回/表头设置/按钮位/顶部噪音/留白密度）。本轮全部前端改动（无服务端变更），逐项修复并完成执行侧自验。

## 1. 修复对照

| 序号 | 位置 | 内容 |
| :--: | :--- | :--- |
| 22 | Web `AppFormData.vue`、`AppCenterDetail.vue` | 右上角「返回应用中心」全部移除：深链数据列表页改左上角圆角返回箭头（`form-data-back`）；应用内页头部只留左上角圆角箭头（`app-detail-back` 保留 testid）。全局核查无其他右上角返回残留 |
| 23 | Web `AppFormData.vue`、`ListActionsColumn.vue` | 「表头设置」从工具栏按钮改为表头最右端固定 ≡ 小图标（操作列表头可选插槽）；点击拉起右侧抽屉（el-drawer 320px）：字段按当前顺序排列，每行右侧「显示」勾选框 + ≡ 拖拽手柄（仅手柄可发起拖拽），勾选/拖拽即时生效并持久化本机偏好；至少保留一列约束保留。原 ↑↓ 对话框整体下线 |
| 24 | Web `AppFormData.vue` | 「新增/填写」更名「新增」（locale `createRecord`），从工具栏移入筛选栏动作区、位于「查询」左侧 |
| 25 | Web `StandardListTemplate.vue`、`AppWorkspace.vue`、`AppCenter.vue`、`ProcessDefList.vue` | 搜索/筛选栏成为列表页最顶部元素：`StandardListTemplate` 把 `toolbar-actions` 槽全局并入筛选栏动作区（22 个使用页一次性生效，独立工具栏行取消）；应用工作台侧栏头只留返回箭头（应用名/图标/停用标去除）；应用中心、流程定义列表的 h1 标题+副标题去除；工具栏「共 N 条记录」（AppFormData/AppFormDetail）去除，总数只保留右下分页 |
| 26 | Web `tokens.css`、`StandardListTemplate.vue`、`ListToolbar.vue`、`ProcessDefList.vue` | 全局留白收紧：`--sw-card-padding` 24px→12px 16px、`--sw-section-gap` 20px→10px、表格行高 50→44px（表头 40→38px）、列表画布内边距 20/24→12/16、工具栏间距 16→10px；参考 Owner 提供的密集型系统截图「适当留白」 |

## 2. 验证记录（执行侧自验，2026-10-17）

- 门禁：`vue-tsc --noEmit` 零错误；全量 vitest **1561/1561 通过**（含本轮新/改用例）。
- 存量债收敛（HEAD 上已失败、非本轮引入，一并修复）：`AppManageList.spec` 3 条对齐网格卡片契约；`AppWorkspace.spec` 2 条（错误类名/侧栏头契约）；`TodoList.spec`+`ProcessedList.spec` 各 1 条「工具栏按钮跳转」随 #8/#9 契约移除；`MyInstances.spec` 拆为「有表单绑定直达数据表单页 / 无绑定回落弹窗」两条；`notify-template-route-guard.evidence.spec` 去除已不存在的工具栏标题断言。
- 浏览器实测（1280×720，截图本地留存不入库）：
  - 数据列表页：筛选栏在页面最顶部，动作区顺序=新增/查询/重置；侧栏头仅返回箭头；无「共 2 条记录」顶部残留；操作表头右端 ≡ 图标在位。
  - 表头设置抽屉：标题「表头设置」，行=文字/创建时间（含「显示」勾选+≡ 手柄）；取消「创建时间」显示→表列即时消失；手柄拖拽换序→抽屉行序与表列序同步翻转；localStorage `sw:app-form-columns:{formKey}` 写入 `{"order":["create_time","field_1"],"hidden":[]}`；验后已还原默认偏好。
  - #22 双面：`/form/app-center/:appId` 与 `/form/app-form/:formKey` 左上角均为圆角箭头，「返回应用中心」文案全局无残留。
  - #26 截图对比：筛选卡、表格卡、分页间距明显收紧，无独立工具栏行。
- 数据说明：验后已清除本机列偏好键（Owner 侧保持默认顺序）；其余数据未触碰。

## 3. 已知边界与说明

- `toolbar-actions` 槽名保留（页面代码零改动），仅渲染位置并入筛选栏；后续新增列表页默认即达「搜索栏置顶」。
- 「无筛选字段的表单」筛选栏左侧为空、动作按钮贴右——与参考系统行为一致。
- 列偏好仍为本机个人偏好（localStorage），不落服务端（与既有口径一致）。
- 通知中心/流程定义列表等自有布局页面的内距按同密度口径手动收敛；若 Owner 回归发现个别页面密度不一致，按原序号返回修复。

## 4. Git 事实

- Web `bugfix/0.1.7`：本轮提交（见仓库提交记录），前置 `7c65c1f`（回归02）。
- Server：无变更（本轮纯前端）。
- workspace `develop-sw`：台账 22–26 登记+回填、本增补。

---

# 增补 04：#27 空列表去重（回归03 追加反馈）

- 现象：空数据列表表格下方居中渲染「新增」按钮，与筛选栏「新增」重复（Owner 截图圈注「很别扭」）。
- 修复：Web `AppFormData.vue` 移除 `#empty-action` 槽——空态仅保留表头 + 「暂无数据」，新增入口唯一保留在筛选栏（#24 口径）。
- 自验：vue-tsc 零错误、`AppFormData.spec` 6/6；浏览器实测空表单（323）——「暂无数据」在位、`.standard-list__empty-actions` 容器不再渲染、页面内「新增」按钮仅筛选栏 1 个。
- 边界：其余列表页的 `#empty-action`（如各管理页空态引导键）未在本条范围内改动；若 Owner 认为同样重复，按原序号反馈。
- Git：Web `bugfix/0.1.7` 本轮提交（前置 `3b4c728`）；workspace 台账 27 登记+回填、本增补。

---

# 增补 05：#28 表头设置独立入口 + 查询字段设置（回归03 追加反馈，含 Owner 两轮裁决收敛）

- 需求：≡ 入口固定在最右且视觉上不与操作栏混排；抽屉内可设置哪些字段可查询；勾选框改小、以区块标题「显示列/查询字段」表意；图标须为真三横线（EP `Menu` 实为点阵，弃用）。
- 终态实现（Web `AppFormData.vue`）：
  - ≡（内联 SVG 三横线，14px）合并进「操作」列表头右侧（不换行、6px 间距）——Owner 裁决「合并进去不就行了」，过程中试过的独立 48px 固定列已废弃不留痕。
  - 抽屉两区块：「显示列」（小号勾选框+≡ 拖拽手柄）、「查询字段」（小号勾选框）。勾选框不再带「显示/查询」文字，title/aria-label 保留无障碍语义。
  - 查询字段：候选池=服务端列表配置 filters（若有）否则全部可过滤类型字段（TEXT/NUMBER/DATE/BOOL/DICT，不截断 3 个）；勾选集持久化 `sw:app-form-filters:{formKey}`；筛选栏渲染=候选∩偏好，未设置偏好维持原口径；取消勾选即丢弃该字段已填值（不产生看不见的过滤条件）；loadData 的 op 匹配改走候选池。
- 自验：vue-tsc 零错误、`AppFormData.spec` 6/6、eslint 0 errors；浏览器实测——表头单元格=「操作」+≡（svg rect=3），独立列与多余圆点消失；抽屉两区块勾选框均 small 且无文字；取消/恢复查询字段→筛选栏输入框 0↔1 联动、偏好正确写入；验后已清理本机查询偏好。
- Git：Web `bugfix/0.1.7` 本轮提交；workspace 台账 28 登记+回填、本增补。

---

# 增补 06：#28 入口位置二次裁决——独立小固定列（真三横线）

- Owner 二次回归：合并进操作表头「又跟操作栏在一起了」，要求参考其截图在最右侧固定一个小位置。
- 终态：`AppFormData.vue` 在操作列（还原 140 宽、无表头插槽）之后追加 40px 独立小固定列（fixed right），表头单元格居中渲染 ≡（内联 SVG 三横线）；列体留空。`ListActionsColumn` 的可选表头插槽同步移除（无使用方）。上次独立列观感差源于 EP `Menu` 点阵图标，换真 SVG 后已消除。
- 自验：vue-tsc 零错误、spec 6/6；浏览器实测——表头序列=单行文本/创建时间/操作(140)/独立40px 列（含 ≡，svg rect=3），视觉与操作栏分离；抽屉两区块从新入口正常拉起。
- Git：Web `bugfix/0.1.7` 本轮提交；workspace 台账不变（#28 仍为待回归）。

---

# 增补 07：#28 三次收敛——≡ 悬浮于卡片右上角（圆点伪影根除）

- Owner 三次回归指出「右下角三个点又出现了」。定位过程：圆点非文本节点/伪元素/图标字体/下拉组件——与「设置列」共存时出现、随其移动，定性为 EP 固定列表格在「操作列+额外小列」双列布局下的表头缝渲染伪影。
- 终态方案（釜底抽薪）：表格内不再增加任何列——`el-table` 外包 `.afd__table-shell`（relative），≡（内联 SVG 三横线 14px）以 `position:absolute` 悬浮于表格卡片右上角（top 11px / right 8px / z-10），即 Owner 截图红框位；操作列还原 140 宽居中，视觉完全分离且无列缝。
- 自验：vue-tsc 零错误、`AppFormData.spec` 6/6、eslint 0 errors；浏览器实测——表头仅三列（单行文本/创建时间/操作），≡ 独立悬浮无任何圆点；抽屉（显示列/查询字段）从悬浮钮正常拉起。期间一次模板闭合标签误伤（ListActionsColumn 开标签被误删致整页白屏）已在提交前修复并复验。
- Git：Web `bugfix/0.1.7` 本轮提交；workspace 回执本增补。

---

# 增补 08：#29 数据详情/填写画布与设计器画布同宽

- 需求：数据详情页（FormRender 查看/填写）字段画布不再通栏铺满，与表单设计器画布宽度一致、两边留白、随视口同等比例放大。
- 实现：实测设计器画布=视口−658px 侧板（1280 视口下 622px）。`FormRender.vue` `.form-render-page__sheet` 增加 `max-width: min(100%, max(622px, calc(100vw - 658px)))` + `margin: 0 auto`——任意视口下与设计器画布同宽同比例，窄屏回落铺满（622px 下限保底）。
- 自验：vue-tsc 零错误、`FormRender.spec` 12/12；浏览器实测 1280 视口——sheet=622px、左右留白各 329px 居中（截图留存本地）。
- 台账事故与恢复：#28 的登记/回填曾因 shell 工作目录漂移误写他处丢失，本轮以绝对路径补录 28（已回填是）+29，并即时提交（workspace 4815ec6e）；已复核台账现含 29 行且 28=是。
- Git：Web `bugfix/0.1.7` 本轮提交；workspace 台账+回执本增补。

---

# 增补 09：#30 详情权限与页面统一（单一控制面）

- 需求：统一所有表单详情/流程详情——无权限提示；参与人只读详情；审批人展示审批动作；有流程展示流程相关信息。
- 架构（遵循 Owner「数据详情必须单一控制面，不得多处复制」directive）：
  - 后端：`BpmMyInstanceController` 新增 `GET /workflow/my/instances/relations?formKey=&businessKey=`——APPROVER（存在指派给当前用户的活动任务，附 pendingTaskId）/ PARTICIPANT（发起人或历史任务经办人）/ NONE。NONE 不回传实例任何信息（fail-closed 不泄露存在性）；数据可见性仍由 form:data:query 行权限独立把关。
  - 控制面唯一：`workflow/composables/use-task-approval.ts` = 通过/驳回唯一链路（确认→受理→轮询→消息）。TaskDetail 的 handleApprove/handleReject 重构为委托该控制面（注入意见表单/节点表单预检、actionPayload 负载、完成后导航），runAction 仅保留 return 等扩展动作。
  - 统一详情页=FormRender：查看态加载关系（经 `adapters/instance-relation` 接缝消费同一控制面，form 模块零复制）；PARTICIPANT → 流程信息条（流程/状态/发起人/当前节点，状态映射真实 InstanceStatusEnum：RUNNING/APPROVED/REJECTED/WITHDRAWN/DISCARDED）；APPROVER → 信息条+内联审批动作卡（意见默认备注，通过/驳回经唯一控制面，完成自动刷新关系降级为参与人）；NONE/无流程 → 纯只读数据详情。数据记录查询被行权限拒绝时沿用既有错误提示（后端文案即「无权」口径）。
- 自验：vue-tsc 零错误；全量 vitest **1563/1563**（含新增 2 条关系用例：参与人信息条/审批人动作卡）；后端 `mvn -DskipTests package` BUILD SUCCESS 并重启；浏览器三关系实测——APPROVER（form_mvb3uqg4+625a045e 运行中：信息条+驳回/通过）、PARTICIPANT（同表单 b4d2534d 已通过：仅信息条，状态「已通过」）、NONE（form_mvb9kf9w 无实例：纯详情）；内联审批与任务详情共用同一控制面（TaskDetail.spec 37/37 委托后行为不变）。未实际消费 Owner 的待办 20261016-001（避免动数据，链路与 TaskDetail 同源）。
- 边界：数据行权限拒绝的无权限提示沿用记录加载错误告警（后端权威文案）；MyInstances/待办列表的既有入口不变（详情统一收敛到 FormRender 查看态）。
- Git：Server `bugfix/0.1.7` 本轮提交（relations 端点）；Web `bugfix/0.1.7` 本轮提交；workspace 台账+回执本增补。

---

# 增补 10：#30 回归不通过重做——流程信息=表单外挂组件（单一控制面）+ 单一权限链

- Owner 回归不通过三点：① 顶部「流程信息/流程/状态/发起人」信息条是无效信息，删除；② 页签应只叫「详情」；③ 表单画布必须止于最后一个组件，下方紧贴新开流程信息区，且与任务详情「图三」同一控制面。
- Owner 业务规则（本轮回执固化）：表单可独立存在；流程必须依赖表单，流程信息只作为有流程的表单详情下的**外挂组件**渲染；两者共用一套权限控制——先判有无权限，再判是否参与人，再判是否审批人，再按当前节点控制字段显隐等属性；无流程时第一步（表单数据权限）通过即可查看。
- 实现（单一控制面，零复制）：
  - Web 新组件 `workflow/components/InstanceFlowPanel.vue`：流转记录/流程图/审批详情列表三页签 + 意见详情弹窗 + 进度右栏，全部由传入的真实审批历史派生；TaskDetail 删除原内联实现改为消费本组件（`InstanceFlowPanel.spec` 4 条覆盖派生/懒加载/缺图提示）。
  - form 模块经新接缝 `adapters/instance-flow.ts`（defineAsyncComponent 动态 import）消费同一组件；表单详情不再自建流程视图。
  - 后端 `GET /workflow/my/instances/relations` 补齐 `approvalHistory`（与「我发起的」详情共用同一 `buildApprovalHistory` 装配方法，含动作/结果/意见/参与人快照名）与 `instance.currentNodeKeys`；NONE 仍 fail-closed 不回传。
  - 表单详情（FormRender）：删除顶部信息条与其 i18n 词条；`.form-render-page__sheet` 取消 `flex:1/min-height` 改为内容高度（画布止于最后一个组件）；外挂面板与动作卡同宽（622px@1280）居中，画布纵向 gap 8px 紧贴；查看态页签标题统一为「详情」（`window.document.title`，复用 `common.detail`）。
  - 权限链顺序落地：`loadRecord` 返回是否通过第一关（表单数据读取）；仅通过后才查 relations（403 → 「无权限查看该数据」，1507 保持后端文案）；关系 NONE 或无实例 → 不渲染任何流程信息。
  - 流转记录四列改 `110px minmax(90px,1fr) 100px minmax(120px,1.8fr)`：窄容器（622px）下事件/结果列不再被压成省略号（实测 24px → 233px）。
- 自验：vue-tsc 零错误；全量 vitest **1569/1569**（新增 InstanceFlowPanel 4 条 + FormRender 权限顺序/无流程 2 条；TaskDetail 22/22）；后端 `BpmMyInstanceControllerTest` **8/8**（新增 3 条：审批人返回外挂流程信息/无关系 fail-closed/无实例不查任何流程数据）；后端重打包（17:43 fat jar）并重启。
- 浏览器实测（系统管理员）：① Owner 原例 323232/33743480（已通过，参与人）——无信息条、画布止于多行文本、面板紧贴（gap=8px，宽 622=画布宽）三页签+真实流转行「10-17 02:18 审批 系统管理员 已同意 · 123332123」；② APPROVER（form_mvb3uqg4/625a045e）——面板+驳回/通过动作卡，流程图页签懒加载出图（pg-svg）；③ NONE（新建无流程记录 form_mvb9kf9w/f7fed0b6）——纯表单详情、无面板无动作卡；④ 任务详情（待办 20261016-001 进 TaskDetail）——同一组件渲染三页签、流程图出图、动作区完整；四例页签标题均为「详情」/「任务详情」。
- 边界与数据：为验证 NONE 新建了一条无流程数据（form 323 / 记录 f7fed0b6，内容「回归06-无流程」，仅开发库）。节点字段三态（设计器配置）运行期仍未消费——「按当前节点控制字段」当前落在节点业务表单链路（TaskDetail nodeForm）与审批人动作上；若需在业务记录字段上按节点显隐/可编辑（涉及记录写路径），按原序号反馈再评估，本轮不虚构行为。
- Git：Server/Web/workspace 三仓本轮提交（见各仓 log）。

---

# 增补 11：#30 二次验收——任务详情中间空白拉上去（自然高度 + 12px 紧贴）

- Owner 二次验收不通过：任务详情页表单卡与流程面板之间出现一大块空白（截图红框），要求拉上去紧贴，参考外部系统布局（表单内容后立刻接页签区）。
- 根因：`.task-main` 仍是 0.1.7 #18 的 `flex: 1; min-height: 0`（表单卡撑满剩余高度），表单字段少时中间被弹性撑开；面板组件本体已无 flex 拉伸。
- 修复（仅 TaskDetail 布局）：`.task-main` 改 `flex: 0 0 auto`（自然高度）；`.instance-flow-panel` 与 `.detail-card--actions` 各加 `margin-top: 12px`。面板组件与表单详情（画布 gap 8px）不动。
- 自验：eslint 0 错误；TaskDetail.spec 22/22 + InstanceFlowPanel.spec 4/4；浏览器实测——表单卡 bottom 232 → 面板 top 244（12px）、面板 bottom 358 → 动作卡 top 370（12px）、内容总高 538/720（无空白拉伸）；截图本地留存。
- Git：Web `bugfix/0.1.7` 本轮提交；workspace 台账 30 行补记、本增补。

---

# 增补 12：#31 流程图视觉与默认走向 + #32 设计器页面重构 + 走线规则澄清

- Owner 三点反馈：① 流程图有点丑（附同类产品截图：上下走向、开始/结束圆形标识、节点卡、橙色网关、浅底网格）；默认走向改上下；② 整个设计页面参考同类产品重构；③ 走线规则澄清——「不重叠」只要求**单条连线自身**不重叠，**不同连线之间允许重叠/交叉**（否则复杂流程无法表达）。
- 默认走向（单一实现，三处共用）：
  - `adapters/process-graph` 新增 `layoutGraphTopDown`（BFS/Kahn 分层，汇合节点取 max(父层深)+1，同层等距；确定性）。缺坐标历史图按 TB 还原；`normalizeGraph` 增加 `layout: 'topDown'` 选项——只读流程图视图一律按 TB 呈现（宽图不再横排缩成一条线），且不算「兼容布局」。
  - 设计器第二行工具栏新增「整理布局」：`DesignerModel.layoutTopDown()` 一次撤销单元重排全部节点并回归默认路由（历史拐点不再钉住几何）。
  - 后端初始图种子改竖向：START(300,120) → END(300,360)（`BpmProcessDefServiceImpl.buildInitialGraph`）。
  - 实测：设计器「整理布局」后 测试11 三节点竖排（DB 已存 start(400,120)/审批(400,246)/end(400,372)）；表单详情与任务详情「流程图」页签均竖排且可读。
- 视觉（viewer + designer 同口径）：开始=绿色胶囊、结束=红色胶囊、节点卡圆角 8/浅描边、网关=橙色菱形+白十字且标签居中下方、连线 #C3CCDB 1.4、画布浅底 + 24px 更轻网格、缩放控件移至画布右上、画布外框（随内容平移缩放）带流程名标签。
- 设计器页面重构：节点面板移到左侧竖栏并按能力分类分组（事件节点/人工节点/分支节点/其他节点，双列图标块，拖拽与点击添加双入口）；新增第二行工具栏（撤销 / 整理布局 / 变量 / 触发器 / 高级配置 / 校验流程）；画布外框与流程名标签；缩放控件右上；右侧属性面板（基本属性/字段属性）保持不变。
- 走线规则：折线归一口径（`normalizeOrthogonalPoints`）保证**单条线**不自重叠；代码与测试均无跨线避让——新增用例固化「不同连线几何重合/交叉均保留、不丢弃不改写」。
- 自验：vue-tsc 零错误；eslint 0 错误；全量 vitest **1575/1575**（新增 TB 分层/只读走向/缺坐标回落/跨线重叠允许等 6 条）；浏览器实测——设计器（左栏分组面板 + 第二行工具栏 + 整理布局竖向 + 画布框）、表单详情流程图（竖排、绿 START/红 END）、任务详情流程图（竖排 + 动作区）；截图本地留存。
- 边界：设计器按图内坐标编辑（WYSIWYG），历史流程如需转竖向点一次「整理布局」即可；只读视图始终按默认 TB 呈现。测试过程对开发库 测试11 执行了一次整理布局并保存（应 Owner「默认上下」要求）。
- Git：Server（种子图竖向）、Web（adapter/viewer/designer/locales/spec）、workspace（台账 31/32 + 本增补）。

---

# 增补 13：#32 复反馈——去掉画布外框，开始/结束/网关改小图标

- Owner 复反馈：我加的「画布外框 + 流程名标签」是误解了参考图（那是对比系统的泳道组件，我们没有泳道）→ 去掉；开始、结束（及网关）改为小图标节点。
- 实现：设计器删除 `designer-frame` 模板/CSS 与之配套 computed；START/END 由 158×48 卡片改为 r=18 圆形图标（绿/红、图标居中、名称居中于图标下方），网关菱形由 44px 缩为 36px 且名称居中于下方；四向连接锚点在事件节点上贴合圆周（±18）。只读流程图（ProcessGraphView）同口径：START/END 小圆形图标 + 名称下方，运行态光晕/端口按形状适配。
- 自验：vue-tsc 零错误、eslint 零错误、process-graph 50 条 + InstanceFlowPanel 4 条通过；浏览器实测设计器（无外框、绿圆 START/红圆 END、审批卡片）与表单详情「流程图」（同一口径竖排）截图本地留存。
- Git：Web（本轮提交）、workspace（台账 31/32 补记 + 本增补）。

---

# 增补 14：#31 复反馈——连线接到小图标 + 保留左右走向

- Owner 复反馈两点：① 设计器联线断开（截图 START/END 处线悬空）；② 「默认改成上下走向」不等于废弃左右走向。
- 根因：开始/结束改小圆形（r=18）后，端口/连线端点仍按旧卡片盒几何（半宽 80 / 半高 25）计算 → 线停在旧盒边缘、看起来没接上；同时网关菱形缩为 36px 后，模型的 `gatewayRadius` 仍传 22，与图形不一致。
- 修复（单一几何口径）：适配器 `portPoint` 对 START/END 按 `EVENT_NODE_RADIUS=18` 取圆周点（左/右/上/下），网关继续按传入半径；设计器 `P53_GATEWAY_RADIUS` 22→18 与绘制的菱形一致（运行时端口与预览同源）。
- 走向口径澄清落地：只读流程图恢复「按图内坐标」（authored）——左右布局完整保留；「默认上下」只作用于 ①新流程初始图种子（后端已改）②缺坐标历史图的还原③设计器「整理布局」按钮。此前把只读视图强制 TB 的解释已撤回（不再产出该行为）。
- 自验：全量 vitest **1575/1575**（适配器 50 条中 6 条与端口几何相关的期望按新口径更新：事件圆周端口、肘点居中、句柄中点）；vue-tsc 零错误、eslint 零错误；浏览器实测 123 流程设计器——START 圆 → 线 → 审批卡 → 线 → END 圆，线端精确落在圆周、左右走向保持原样。
- Git：Web（本轮提交）、workspace（本增补）。

---

# 增补 15：#25 回归不通过——顶部降噪补刀 + 关联流程工作区版式（编号设置右上角 / 查询与新建靠右）

- Owner 反馈（同一条消息三项）：①「流程编号设置」放到右上角；②「新建流程」放到查询后面，查询与新建一起放到右边；③ 全局检查是否还有「蓝线标记」的噪音信息——与 #25 同一问题，#25 回归不通过。截图红线标记的噪音=①页面左上角大标题「关联流程」②描述段（管理当前事项关联的流程定义…）③筛选栏内「共 1 个流程 · 启用 1 个」汇总计数。
- 关联流程工作区（`RelatedProcessesPanel`）：删除标题/描述/汇总计数（页首即筛选栏，顶部内距 36→20）；筛选栏改弹性排布——搜索 350 + 状态 130 靠左，「查询」「新建流程」成组靠右（`__filter-actions`，间距 12，右缘对齐卡片内距）；面板自身不再持有编号设置按钮。
- 编号设置入口上收（单一实现，不复制弹窗逻辑）：设计器工具条 `FormDesigner.designer__actions` 在「流程设计」页签下渲染「流程编号设置」，位置=右上角动作组首项（草稿历史左侧＝Owner 箭头落点）；面板经 `defineExpose({ openNumberSettings })` 暴露同一入口，并以 `update:process-count` 上报数量驱动禁用态（0 个流程时置灰）。
- 全局噪音巡检（仅限可达页面，逐页核对首屏结构）：删除 应用管理 / 流程中心 / 流程分析 / 流程交接 / 工作台 / 会话历史 / 账号绑定 / SSO 配置 的页面级 h1/h2 标题与描述段（应用管理搜索框回到内容区左上首位，不再靠右）；删除 应用表单详情 工具条的「共 N 条记录」汇总；删除 流程中心 工具栏「可发起 N 个流程」与结果区标题「全部流程 · N 个可发起」（分类树节点计数与分组计数属过滤/分组语义，保留）。
- i18n 清理（zh/en 同步，双语键集保持一致）：`form.relatedProcessTitle|Description|Summary|Footnote`、`workflow.catalogSubtitle`、`catalog.countHint|allProcesses|resultTitle`。
- 测试：`RelatedProcessesPanel.spec`（噪音缺席 + 筛选栏即页首 + 查询/新建同组 + 编号设置经 expose 生效 + 空数据空操作）、`FormDesigner.spec`（流程设计页签下入口位于 `.designer__actions` 内、点击转交面板；表单设计页签不渲染）、`ProcessCatalog.spec`（页首无标题/描述/计数）、`ConversationList.spec`（标题去除）。全量 vitest **1579 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误。
- 浏览器自验（本地 5173 + 真实后端）：关联流程工作区——筛选栏为页首（y=140，无标题/描述/计数），查询 x=1011 w=88、新建流程 x=1111 w=82（同组右对齐，组右缘距卡片右边 24px），工具条「流程编号设置」x=884 y=78，与草稿历史/预览/保存/发布新版本同排；流程中心 / 应用管理 / 流程分析 / 流程交接 / 工作台 / 会话历史 / 账号绑定 逐页 DOM 核验：噪音选择器全空，首个内容元素为筛选栏/列表/表单本体。截图本地留存。
- 边界：①流程定义列表（管理端）四张统计卡属已验收设计元素（P53 设计节点04），非文本噪音，本轮未动——若 Owner 认为需与筛选栏对调再行调整；②未纳入本轮：不可达页面（P64 控制台页与 system 列表页未挂路由）、弹窗内小标题/说明（草稿历史弹窗副标题、字段清单说明等）、移动端页面、控制台页内分区标题（命令明细/拒绝审计等）。
- Git：Web（本轮提交）、workspace（台账 #25 补记 + 本增补）。
