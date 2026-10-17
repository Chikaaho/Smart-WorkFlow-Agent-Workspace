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

---

# 增补 16：#33 应用管理页去掉无意义侧边栏

- Owner 反馈：应用管理（/form/app-manage）左侧侧栏只挂着「应用管理」自身一个条目，没有意义 → 去掉。
- 根因（口径）：应用管理分区在菜单树里是**单页分区**——`sys_menu` 9130 `FormAppManage / form/app-manage`，parent_id=0、无子菜单；而根布局 `BasicLayout` 渲染的深色侧栏是「当前分区的菜单树」，该页因此恒渲染一个指向自身的条目。既有豁免清单（/portal、/form/designer、/form/app-center、/form/app-form/、/form/app-manage/:appId 等）恰好把这个精确路径漏在外面。
- 实现：`src/layouts/BasicLayout.vue` 的 `showAside` 增加精确路径判断 `route.path !== '/form/app-manage'`——应用管理列表页顶栏全宽、不渲染深色侧栏；同分区应用详情深链（`/form/app-manage/:appId`、`/form/app-manage/:appId/form/:formId`）继续走应用专属侧栏（#4 口径不变）。注释同步更新，不改动菜单数据与其它分区。
- 测试：新增 `src/layouts/BasicLayout.spec.ts`（4 条）——`/form/app-manage` 无侧栏且内容区在、`/form/app-manage/:appId` 仍不渲染通用侧栏、`/workflow/defs` 侧栏照常渲染、`/portal` 维持既有不渲染口径。全量 vitest **1583 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误。
- 浏览器自验（本地 5173 + 真实后端）：`/form/app-manage` 无 `.basic-layout__aside`，内容区 1280×656@y64 全宽，搜索框 x=24、应用网格 x=24 宽 1232，顶栏「应用管理」选中态保持。截图本地留存。
- Git：Web（本轮提交）、workspace（台账 #33 + 本增补）。

---

# 增补 17：#34 应用内左侧栏——头部应用身份 + 左下角新建占满

- Owner 反馈（应用详情工作台截图，两处红线框）：①左下角「新建」要占满（原按钮内容宽，右侧留空）；②左上角放 icon 和应用名称，名称只展示 5 个字、超长省略号。背景：#25 全局降噪时我把侧栏头部的应用名/图标当噪音去掉了，本轮按 Owner 口径补回（保留返回箭头）。
- 实现（`src/modules/form/views/AppWorkspace.vue`，应用专属侧栏）：
  - 头部：返回箭头 + `AppIcon`（13px，取 `content.app.icon/color`，不额外请求）+ 应用名称；名称 `max-width: 6em`（＝5 个全角字 + 1 个省略号位）、`overflow: hidden; white-space: nowrap; text-overflow: ellipsis`——刚 5 字不截断，超长稳定呈现「5 字 + …」；`title` 保留完整名称供悬浮查看。
  - 左下角：`.app-ws__side-foot :deep(.el-dropdown) { display: block; width: 100% }` —— el-dropdown 包裹层默认行内收缩，按钮自身 `width: 100%` 因此无从生效；包裹层撑满后按钮落到整栏宽（240 栏宽 − 左右 12 内距 = 216）。
- 测试：`AppWorkspace.spec`（#25 旧断言改为 #34 口径）——侧栏头含返回箭头 + 名称（文本与 title）+ 三项同排；底部「新建」入口在侧栏脚、包裹层与按钮结构齐备。全量 vitest **1584 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误。
- 浏览器自验（本地 5173 + 真实后端，应用「灾备演练」）：头部渲染为 返回箭头 + 橙色应用图标 + 「灾备演练」（宽 56px，未触发截断）；底部「新建」按钮 216×32、x=12，与侧栏内距对齐；截断用**页面内探针**验证（仅临时改 span 文本为 10 字「灾备演练测试超长名称」，clientWidth 84 / scrollWidth 140 → 省略号生效，渲染为「灾备演练测…」），探针后已 reload 还原，未改数据库与接口数据；截图本地留存。
- Git：Web（本轮提交）、workspace（台账 #34 + 本增补）。

---

# 增补 18：#35 应用目录可展开收起 + 右侧未选择态大图标占位

- Owner 反馈（应用详情工作台截图，两处红框）：①点击目录要能展开/收起（原目录行不可点，子表单一律铺开）；②进入后未选择任何目录/表单时，右侧用大 icon +「暂无内容」提示语占位（原为一行的「请从左侧选择目录或表单」）。
- 实现（`src/modules/form/views/AppWorkspace.vue`）：
  - 目录展开态：组件内 `collapsedDirIds`（默认全部展开，仅视图态不落库）；目录行加 `role="button"` / `tabindex` / `aria-expanded`，点击与回车/空格均可切换；行首 `CaretRight` 指示（展开旋转 90°、收起朝右，150ms 过渡），行 hover 变色提示可点；⋯ 菜单沿用既有 `@click.stop`，点菜单不会收起目录；目录内表单以 `<template v-if="isDirExpanded(dir.id)">` 包住。
  - 右侧占位：两态统一改为 `el-empty`（`image-size=120` 大图标）——空应用仍用原文案；未选择态主文案换为 `common.noContent`（暂无内容）+ 次级引导「请从左侧选择目录或表单」，样式 `.app-ws__placeholder(+-title/-hint)` 居中撑满；原 `.app-ws__empty` 文本态样式删除（无消费点）。
- i18n：新增 `common.noContent`（zh 暂无内容 / en No content），双语同步。
- 测试：`AppWorkspace.spec` +2 条（目录点击收起/展开 + ⋯ 菜单不改展开态 + aria-expanded；未选择态占位含「暂无内容」「请从左侧选择目录或表单」与 `.el-empty__image` 大图标）。全量 vitest **1586 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误。
- 浏览器自验（本地 5173 + 真实后端，应用「灾备演练」）：目录行 `aria-expanded` true→false→true，目录内表单数 1→0→1，caret 收起态类名同步；右侧占位文案「暂无内容」「请从左侧选择目录或表单」、图形 120×131。截图本地留存。
- 说明：本轮验证期间本地登录态过期，按回执 01 记录的本地开发口径（admin/admin123、验证码 1234）在登录页重新登录后继续，未改任何数据。
- Git：Web（本轮提交）、workspace（台账 #35 + 本增补）。

---

# 增补 19：#36 属性面板控件尺寸与宽度统一（参考同类产品）

- Owner 反馈（4 张图：我方表单设计器「组件属性」面板 + 流程设计器「节点属性」面板，对照同类产品两处面板；红箭头指在控件行上）：各种选择、填写框的大小宽度参考优化。
- 现状实测（改前）：表单面板——输入框/选择器均 32px 高、273px 宽（口径一致），但「数据类型 / 最大长度」被排成两列半宽格，每格仅 124.5px（数字步进器挤在 102px 值区里）；「扩展属性配置区域」是只有标题的大块空白框。流程面板——整个属性表单带 `size="small"`：选择器/按钮 24px、而输入框被 CSS 顶到 36px，同一面板内三种高度混杂；「审批意见表单」行是 178px 值框 + 两个小按钮。
- 修复（两面板统一口径：控件高 32px、宽占满面板主体）：
  - 表单设计器 `FieldConfigPanel.vue`：`.config` 上以 `--el-component-size / --el-component-size-small: 32px` 固化尺寸口径（替换已失效的 `--el-input-height: 36px`）；「数据类型」「最大长度」拆成两行满宽（移除 `.config__type-pair` 网格与其死样式）；扩展属性区改紧凑占位（padding 25/16/12 → 12/14）并补空态说明「当前版本暂无可配置的扩展属性」（i18n zh/en 同步新增 `form.extensionAreaEmptyHint`）。
  - 流程设计器 `ProcessDesigner.vue`：属性 `el-form` 去掉 `size="small"`（连带 3 个面板内按钮），面板容器加同一组尺寸变量，`.el-input__inner` 高度 34 → 30（行盒 32，与选择器一致，集中定义不再混用三种高度）；`.nodeform-row` 值框 `flex: 1`、按钮 `flex: none`（值框 + 动作按钮填满行宽）；删除已无引用的 `.approver-card*` / `.approver-field*` 死样式（约 55 行）。
- 测试：`FieldConfigPanel.spec` +2 条（数据类型/最大长度各自整行、扩展属性区含标题与空态说明），共 10 条通过。全量 vitest **1588 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误。
- 浏览器自验（本地 5173 + 真实后端）：表单面板——8 个 `.config__row` 控件全部 32px 高 / 288px 宽（改前数据类型与最大长度各 124.5px），扩展属性区 288×72 带说明；流程面板（选中「审批」节点）——输入/选择/按钮全部 32px 高，整行控件 287px 宽，`nodeform-row` = 值框 191 + 按钮 88 填满 287。截图本地留存。
- 边界：本轮只动两个属性面板的控件几何与扩展区占位；左侧组件库搜索框（36px）与列表页搜索框同口径（36px）未动，如需一并收敛请 Owner 指示。
- Git：Web（本轮提交）、workspace（台账 #36 + 本增补）。

---

# 增补 20：#37 流程编号改成要素编排器（参考同类产品，自定义=受控表达式要素）

- Owner 反馈（4 张参考截图）：流程编号优化，参考这个系统，「自定义」其实也是一个脚本。参考产品形态：①编号设置=「引用已有编号规则 / 自定义」二选一 + `模拟编号` 实时预览 + 要素按钮（日期/时间/流水号/常量/自定义）+ 要素条（点选、清空）+ 逐要素配置（常量内容/时间格式下拉，含语言前缀）+「编号生成时间（提交后生成 / 打开页面后生成）」+「描述」；②要素出错时要素条标红「!」并在条内汇总「编号元素设置存在 1 个错误」；③自定义=公式定义器（变量面板 + 表达式输入 + 书写规范说明）。
- 实现（Web 编排器，`ThemeRuleDialog.vue` 重写 + `utils/theme-rule.ts` 扩展模型；规则文本仍是唯一真源）：
  - 顶部 `模拟编号`：演示值（日期取当天、流水号取 1 按位数补零、发起人取当前用户；`{DATE/TIME:格式}` 按格式输出），实时随编排更新，空规则显示「—」。
  - 要素按钮：日期 / 时间 / 流水号 / 常量 / 发起人 / 自定义（右侧「清空」）；点击即在要素条追加并自动选中。
  - 要素条：每个要素一格（类型 + 演示值），点选切换；下方按类型配置——常量文字、日期格式 5 档（`yyyyMMdd|yyMMdd|yyyy-MM-dd|yyyy-MM|yyyy-M-d`，选项直接显示成日期样例）、时间格式 4 档（`HHmmss|HH:mm:ss|HH:mm|H:mm`）、流水号长度 1-10 位（含 0=不补零，既有 7-10 位规则自动并入以免回显丢失）、发起人说明、自定义表达式 + 10 个只读变量点选（同名变量不重复叠加）；支持 ←/→ 前后移动与删除；历史记法（`{TIMESTAMP}`/`{YYYYMMDD}`/`{YYYYMMDDHHMMSS}`）单独成格只读保留，删除后可改用新要素重建。
  - 「自定义」= 受控表达式要素：规则记为 `{EXPR:表达式}`，变量 `initiatorName|initiatorId|seq|yyyy|yy|MM|dd|HH|mm|ss`（与后端同名），发起编号时由服务端受限表达式求值器求值——**只读变量、不执行脚本**（无字符串拼接、无脚本引擎），取不到的变量按空处理。
  - 要素级校验（与参考产品同形）：空常量 / 空表达式 / 括号不成对 → 要素条红框 + 右上角「!」+ 顶部「编号元素设置存在 N 个错误，修正后才能保存」，保存按钮置灰；口径与服务端 `validateExpressionTokens` 同源，服务端仍是权威。
  - 控件尺寸沿用 #36 口径：要素按钮/配置区按钮与输入框统一 32px。
- 实现（服务端文法扩展，`ProcessThemeService`）：
  - 新增 `{DATE:格式}` / `{TIME:格式}`：白名单 `DATE_PATTERNS={yyyyMMdd, yyMMdd, yyyy-MM-dd, yyyy-MM, yyyy-M-d}`、`TIME_PATTERNS={HHmmss, HH:mm:ss, HH:mm, H:mm}`，生成时按 `DateTimeFormatter.ofPattern` 输出；不在白名单 → 保存即 400（不落库）。
  - 新增 `{EXPR:表达式}`：`RestrictedExpressionEvaluator` 求值（路径 / 布尔 / 比较 / `&&` / `||` / `exists()` / `not()` / 括号 / 字符串字面量 / 数组，无字符串拼接、无脚本执行）；表达式引用 `seq` 时按需分配流水号（未引用则不占号）；空表达式、括号不闭合 → 保存即 400。
  - 既有文法（`{TIMESTAMP}`/`{YYYYMMDD}`/`{YYYYMMDDHHMMSS}`/`{SEQ:n}`/`{INITIATOR}`、字面量 `{{ }}` 转义、`DEFAULT_RULE`、计数表加锁同事务）保持不变；库表未改（`sw_bpm_process_def.theme_rule varchar(200)`）。
- 测试：Web 全量 vitest **1593 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误。新增/更新：`theme-rule.spec`（要素类型判定、parse↔serialize 往返、格式/表达式读取、模拟编号新要素、要素级校验共 5 条新增）、`ThemeRuleDialog.spec` 5 条重写 + 2 条新增（要素按钮与逐要素配置、删除/移动/清空、保存序列化、要素级错误与保存拦截、空规则拦截）、`ProcessDefList.spec` / `RelatedProcessesPanel.spec` 改为新要素条口径。后端 `ProcessThemeServiceTest` 10/10（新增 3 条：白名单格式物化、表达式取值闭集、非法格式/未闭合括号/空表达式拒绝）。
- 接口实测（本地 5173 代理 + 真实后端，流程定义 `123`）：`PUT /api/workflow/defs/{id}/theme-rule` 合法规则 `OA-{DATE:yyyy-MM-dd}-{SEQ:3}-{EXPR:initiatorName}` → code 0 且 GET 回读一致；`{DATE:yyyy/MM/dd}` 与 `{TIME:hh}` → 400 且库内值不变（fail-closed）；旧文法 `JRZX_{YYYYMMDDHHMMSS}_{SEQ:3}` → 正常保存（不倒退）。
- 浏览器自验（本地 5173 + 真实后端）：弹窗内编排「常量 `OA-` + 日期 + 常量 `-` + 流水号 3 位 + 常量 `-` + 自定义 `initiatorName`」，模拟编号实时 `OA-20261017-001-系统管理员`；时间格式下拉选 `23:18:59`（HH:mm:ss）后要素格同步；←/→ 前后移动、删除、清空逐项生效；保存 → Toast「流程编号规则已保存」，列表「流程编号」列显示 `OA-[日期]-[自增序号 3 位]-[自定义]`，重开弹窗要素条与保存前完全一致（往返一致）；错误态：自定义表达式填 `(seq > 0` → 顶部「编号元素设置存在 1 个错误，修正后才能保存」+ 要素条红框 +「!」+ 保存置灰，修正后恢复；控件尺寸：要素按钮 56-69×32、要素格 72-82×58、配置区按钮/输入框 32px。截图本地留存。
- 边界（本轮未交付，供 Owner 裁量；均为参考产品的后两项配置，需存储与生成时机语义支持，超出 `theme_rule varchar(200)` 单一规则串）：
  1. 「引用已有编号规则」二选一（复用其它流程的规则）；
  2. 「编号生成时间」提交后生成 / 打开页面后生成（打开即占号）；
  3. 「描述」（编号规则备注）；
  4. 流水号高级配置：起始号、循环（按年/月重置）、跳号、计算范围（全局/按流程）；
  5. 自定义要素的完整公式定义器（变量面板取表单字段、`$$变量` 记法、`##函数##`、字符串拼接）：本轮为受控表达式（只读系统变量 + 比较/布尔），需要把表单字段接入求值上下文与脚本/公式引擎，属独立功能项；
  6. 时间格式的语言前缀（中文(中国)/英语(美国) 等本地化时段写法）。
- 环境与数据：为让新文法在浏览器里真实可用，重建并重启了本地后端（`bootstrap.jar`，local profile，23:17 `Started StarterApplication`）；验证用的流程定义「123」编号规则已**还原为验证前值** `{YYYYMMDD}-{SEQ:3}{YYYYMMDD}`（psql 读回确认），未改动其它数据；网络索引（登录 / 列表 / 弹窗读规则 / 正例与两条反例 / 旧文法 / 保存 / 还原共 12 条请求与状态码）本地留存：`C:/Users/hjxch/AppData/Local/Temp/sw-017/b37-network-index.json`；未新建流程实例（编号物化口径由后端单测覆盖）。
- Git：Web（本轮提交）、Server（本轮提交）、workspace（台账 #37 + 本增补）。

---

# 增补 21：#38 字段清单覆盖子表（明细表）字段 + 可编辑口径（发布过的字段只能改长度/名称/描述）

- Owner 反馈（参考产品「数据模型」页截图）：字段清单也参考目标系统，不止包含主表单，还包含明细表这些表格子表单的字段，但不需要删除和停用，发布过的字段就只能改长度名称和描述了。
- 实现（`FieldListPanel.vue` 新增，字段清单内容整体重做）：
  - **表范围**：顶部「主表 / 各子表」范围切换——主表列出非 TABLE 字段，每个 TABLE 字段（子表）自成一个范围并列出其 `subFields`；TABLE 自身不出现在主表行里（它就是一张表）。
  - **表名口径**：主表 = `formKey`，子表 = `formKey.子表字段编码`（与参考产品「表名：…」同位的表身份提示）。
  - **列集**：序号 / 字段名 / 字段编码 / 控件类型 / 数据类型 / 字段长度 / 必填 / 描述。参考产品里的「索引」「状态（已生效/停用）」与操作列（停用·删除）**一律不做**——即 Owner 的「不需要删除和停用」；原清单的「约束 / 状态」派生列与「宽度」列随参考口径移除（宽度属画布布局，仍在右侧属性面板维护）。
  - **可编辑项只有三项**：字段名（label）/ 字段长度（length）/ 描述（description），其余（字段编码、控件类型、数据类型、必填）为只读事实——即「发布过的字段只能改长度、名称和描述」。字段长度仅字符串族（TEXT / RICH_TEXT / DICT / DATASOURCE，即存储族 VARCHAR/TEXT）可改，其余类型显示「—」（`supportsFieldLength`，与 `getFieldTypeStorage` 同表）。
  - **单一数据源**：行里的字段就是画布持有的字段对象（主字段或子表子字段）引用，编辑经 `applyFieldPatch` 写回并由宿主 `patchListedField` 应用，脏标记/保存状态机原样复用；主表字段与子表子字段同样可改。
- 契约与适配（跨前端契约 + 服务端 DTO 同步）：
  - `BaseField` / `TableSubField` 新增 `description?: string`；`FieldPatch` 新增 `description`；`parseDefinition` 主字段与子表子字段都透传 `description`（缺省不携带，历史定义零影响）。
  - 服务端 `FormDefinitionSchema.FieldDef` 新增 `description`（注释写明：纯元数据，不参与发布校验、不产生动态列 DDL、不进入提交载荷，仅随 definition JSON 原样存取）。
- 测试：新增 `FieldListPanel.spec`（6 条：主表/子表分组与表名、无删除停用、名称/描述补丁回抛、只读事实与长度适用范围、搜索过滤、空表提示）。全量 vitest **1602 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误；后端 `mvn -o -pl sw-bootstrap -am package -DskipTests` BUILD SUCCESS。
- 浏览器自验（本地 5173 + 真实后端；自验用表单为本次专门创建、带子表的已发布表单）：
  - 主表范围：`表名：fl_check_…`，「报销金额（单行文本/VARCHAR/200）」「申请日期（日期/DATETIME/—）」，无删除/停用列；
  - 子表范围：`表名：fl_check_….items`，「费用项目（单行文本/VARCHAR/80）」「数量（数字/NUMERIC/—）」；
  - 编辑 4 处（主表 名称 金额→报销金额、长度 100→200、描述 含税金额（元）；子表 名称 费用项→费用项目、长度 50→80、描述 明细费用项）→ 保存状态变「未保存」→「保存」后 Toast「草稿已保存」；
  - **落库回读**（psql，服务端纯元数据透传）：`{"name":"amount",…,"label":"报销金额","length":200,…,"description":"含税金额（元）"}` 与 `subFields[0]{"label":"费用项目","length":80,"description":"明细费用项"}` 完全一致；
  - 刷新页面后清单回显与保存前一致（往返一致）。截图本地留存。
- 边界（供 Owner 裁量）：
  1. 「添加字段 / 添加表」不在本清单（我们的字段来自画布组件库，参考产品的添加字段入口对应组件库，未重复提供）；
  2. 子表字段的「控件类型」不可在本清单切换（属类型变更，与「发布过的字段只能改长度/名称/描述」一致）；草稿态如需换类型仍回画布/属性面板；
  3. **既有服务端边界（非本轮引入）**：`publishNewVersion` 对含 TABLE 字段的表单直接拒绝（「新版本暂不支持新增或变更 TABLE 字段」），所以带子表的已发布表单目前只能保存定义、不能发布新版本；纯主表表单的名称/长度/描述改动可正常走「发布新版本」。若 Owner 需要子表也能发新版本，请作为独立项排期；
  4. 描述为字段元数据，填报态暂未展示（本轮未纳入渲染）。
- 环境与数据：验证前新建自验表单（含子表）并在验证后**软删**，环境回到原 3 张表单；为让服务端 DTO 变更生效已重建 `bootstrap.jar`（01:22）并重启本地后端（01:23 `Started StarterApplication`）。首次重建时目标 jar 被运行中的进程占用导致构建失败（`spring-boot:repackage` 报错），已先停进程再重建，流程已在本回执留痕。
- Git：Web（本轮提交）、Server（本轮提交）、workspace（台账 #38 + 本增补）。

---

# 增补 22：#39 字段清单入口上收为居中页签（去掉左上角「设置」）

- Owner 反馈（我方设计器截图，红框标在「设置」与「表单设计」之间的空白）：把现在的入口放到表单设计的左边，三个选项一起居中，tab 名「字段清单」，去掉原来左上角的「设置」。
- 实现（`FormDesigner.vue` + `workbench.ts` + 新 `FieldListPanel.vue`）：
  - 页签从「表单设计 / 流程设计」两页签改为 **字段清单 / 表单设计 / 流程设计** 三页签（字段清单在表单设计左侧），沿用既有居中页签组（`designer__tabs` 在 56px 工具条内绝对居中，`left:50% + translateX(-50%)`）——三个选项整组居中。
  - 删除左上角「设置」下拉（`el-dropdown` + `designer__settings` 相关样式）与其命令处理：该下拉唯一入口就是字段清单，现已上收为页签，不再保留。
  - 字段清单弹窗（1040px `fields-dialog`）整体移除：弹窗模板、`fieldsDialogVisible`、`fieldSearch`/`filteredFields`/`storageTypeOf`/`constraintOf` 与弹窗专用样式（含全局 `el-dialog.fields-dialog` 段 1.8KB）一并清理；内容改由 `FieldListPanel` 在页签内以整宽面板承载（原「导出字段」真实下载能力保留在该面板工具栏）。
  - 深链：`parseWorkbenchTab` 支持 `fields`，`/form/designer/:id?tab=fields` 可直达字段清单工作区。
- 测试：`FormDesigner.spec` 新增 2 条（三页签顺序且同处 `.designer__tabs` 居中页签组、无「设置」按钮、默认落表单设计；点字段清单页签后画布卸载、清单渲染），`workbench.spec` 补 `parseWorkbenchTab('fields')`。全量 vitest **1602 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误。
- 浏览器自验（本地 5173 + 真实后端）：页签渲染为「字段清单 / 表单设计 / 流程设计」，页签组中心 x=640 与视口中心 640（1280×720）一致；左上角无「设置」按钮（仅「返回表单列表」+ 保存状态 + 面包屑）；点「字段清单」后整宽清单面板出现、画布卸载。截图本地留存。
- 与 #38 的关系：两条为同一轮交付（#39 决定入口形态，#38 决定清单内容），同一提交内完成，互相依赖。
- 验证工具口径（留痕）：本轮 IAB 的鼠标点击未送达页面（locator click 无异常但 Vue handler 未触发，登录页与设计器页签均复现），按逃生舱口径改用**页面脚本触发元素 click()**；文本输入仍走 Playwright fill（真实 input 事件）；登录、保存、回读链路与副作用均为真实接口与真实落库（psql 回读确认）。网络索引（登录 / 建表单 / 发配置 / 发布 / 打开设计器 / 保存 / 刷新回显 / 清理共 11 条请求与状态码）本地留存：`C:/Users/hjxch/AppData/Local/Temp/sw-017/b3839-network-index.json`；截图 `b38-field-list-main.png`、`b38-field-list-subtable.png` 本地留存。
- Git：Web（本轮提交）、Server（本轮提交）、workspace（台账 #39 + 本增补）。

---

# 增补 23：#40 字段清单页去噪（说明文案与单表冗余行）

- Owner 反馈（字段清单页截图，红箭头指向底部两行说明文案）：依旧老问题，噪音信息太多了。
- 实现（`FieldListPanel.vue` + i18n）：
  - 删除两行说明文案：「可直接维护：字段名 / 字段长度 / 描述；…本清单不提供删除与停用。」（`fieldList.editHint`）与「已发布字段结构受版本约束：字段变更随草稿保存，发布时进行兼容性校验。」（`fieldList.note`）——两个键连同面板内 `<p class="field-list__hint">` 与对应样式一并移除，双语目录同步删除，不留悬挂键。
  - 单表（只有主表、无子表）时**不渲染「表范围」与「表名」**：单表没有可切换对象，主表的表名又与工具条面包屑里的表单名重复；有子表（多表）时照旧显示范围切换与表名（子表表名 `formKey.子表字段编码` 是必要身份信息）。
  - 面板内保留的只有：多表时的范围切换 + 表名、搜索框、导出字段按钮、字段表格，以及「该表下暂无字段」的空态引导（仅空表时出现）。
- 测试：`FieldListPanel.spec` +2 条——说明文案缺席（不含「可直接维护」「版本约束」）；单表不渲染 `[role=tab]` 与表名、多表渲染 2 个范围与表名。全量 vitest **1604 通过 / 3 skipped**；vue-tsc 零错误；eslint 零错误（3 条预存 warning 在 StandardListTemplate.vue）。
- 浏览器自验（本地 5173 + 真实后端）：
  - 单表表单（Owner 截图里的 `323232`，已发布）`?tab=fields`：范围行 0 个、`[data-testid="field-table-name"]` 不存在、面板文本中无「可直接维护」「版本约束」，列集与三可选编辑项不变；
  - 多表表单（本轮临时自建含子表的已发布表单）：范围仍为「主表 / 报销明细」、表名 `fl_check_….items` 正常，面板文本同样无说明文案；截图本地留存。
- 环境与数据：自验表单验证后软删，环境回到原 3 张表单（表单列表复查 3 行）。
- 工具留痕：本轮 IAB 出现「文档级导航被页面取消（ERR_ABORTED）」与旧标签页停在已删表单的两个工具侧问题；通过新开受控标签页完成验证，旧标签页未恢复（页面本身即已删除表单的停留态）。交互仍以页面脚本触发元素 click() + Playwright fill 输入，链路与副作用均为真实接口。
- 未纳入本轮（供 Owner 裁量）：其它页面仍存在的说明性文案——组件属性面板扩展区空态说明「当前版本暂无可配置的扩展属性」（#36 引入）、流程编号弹窗内各要素的说明行（#37 引入，如「受控表达式：只读下列变量，不执行脚本」「该规则为必填配置…」）。若按同一口径收，请指示，一轮内可清。
- Git：Web（本轮提交）、workspace（台账 #40 + 本增补）。

---

# 增补 24：#41 流程中心版式三项（侧栏置顶 / 分类面板平行 / 集合区画布底纹）+ 组织架构演示种子

- Owner 反馈（流程中心截图，三处红框/箭头）：①流程中心在左侧侧边栏的位置需要置顶；②分类画布要和右侧搜索 bar 平行；③右下方的流程集合也要有画布底纹。另附需求④：整理一份组织架构数据作为种子，两个租户，结构中「总公司 →（分公司1 / 分公司2 → 部门1、部门2 → 团队1 / 分公司3）」，每个节点 2-4 个用户；管理员密码改 AdminP@ssw0rd，普通用户密码 123456。
- ① 侧栏置顶（数据口径，非前端排序）：新增可重复迁移 `sw-bootstrap/src/main/resources/db/migration/{postgresql,h2}/R__0.1.7_catalog_menu_first.sql`，把「流程中心」（菜单 320 ProcessCatalog）的 `sort` 由 24 改为 5。前台侧栏渲染口径（`AppSidebar` catalogSlim → 门户区「流程管理」父菜单 5 的子项，按 sort 升序）：原顺序 待办10 / 已办20 / 我发起的21 / 我的草稿22 / 我的已办23 / 流程中心24 / 抄送我的25 → 现「流程中心」置顶。浏览器实测侧栏首项为「流程中心」。
- ② 分类面板与搜索卡平行（前端）：`ProcessCatalog.vue` 里 `.catalog-tree` 的粘性偏移原为 `top: 76px`（按后台外壳高度估的值）；门户区内容区从顶部开始，粘性锚点因此把分类面板整体下压 48px（实测面板 y=140，而搜索卡片 y=92）。改为 `top: 12px`：静止时两者同高（实测 y 均为 92，宽 240 vs 732 分栏不变），滚动时面板贴内容区顶部。
- ③ 流程集合区加画布底纹（前端）：`.catalog-list` 改为「画布式容器」——底纹与流程设计器画布同源（24px 网格、`#eef2f8` 线，用两条 linear-gradient 实现），外框用画布的虚线圆角框（`dashed #c6cce0`、半径 12px、白底）；分组带与条目仍在纹理之上，悬停高亮不变。
- ④ 组织架构演示种子（可重复迁移，双方言）：`R__0.1.7_org_demo_seed.sql`（PG/H2 同构，全部 `INSERT … SELECT … WHERE NOT EXISTS` 幂等）：
  - 租户：9001 `demo-org-a`「演示集团A」、9002 `demo-org-b`「演示集团B」（status=0 启用）。
  - 组织（每租户 7 节点）：总公司（根）├ 分公司1 ├ 分公司2 ├ 部门1 / └ 部门2 └ 团队1 ├ 分公司3 —— 与 Owner 给的结构逐字对齐；部门带 code（`demo-a-hq` 等）与负责人（该节点第 1 个用户）。
  - 用户：`demo_{a|b}_{hq|br1|br2|br3|dept1|dept2|team1}_{1|2}`，每节点 2 人（共 14 人/租户、28 人）。
  - 角色与授权：每租户 `demo_admin`（租户管理员，数据范围 ALL；授权集＝既有 admin 角色 `role_id=2` 的产品授权集 ∪ 前台 7 页）与 `demo_user`（普通用户，数据范围 SELF；仅前台 7 页 + 所在分组）。
  - 密码：BCrypt cost=10（与系统 `PasswordEncoder` 同参）——租户管理员与既有 `admin` 账号为 `AdminP@ssw0rd`，其余演示用户 `123456`。
  - 既有 `admin`（sys_user.id=1）密码按 Owner 要求更新为 `AdminP@ssw0rd`；该更新只在本地 dev 库执行（未写入迁移，避免把生产管理员口令固化进产品迁移）；如需在其它环境同步：`UPDATE sys_user SET password='$2a$10$sj2aFVKYCMigtP4Lf31Y7O.UPgp5nKY3Xh6E2v4/FsU9ldYxzi95.' WHERE username='admin' AND deleted=0;`。
- 测试与修正：`FlywayFullChainH2Test` **17/17**、`FlywayFullChainPostgresTest` **12/12**（含新种子的全链应用；PG 用嵌入式 PG，安全不触碰既有库）。同时修正两个测试里**陈旧**的计数断言：迁移链现为 14 条（V0.1.6 基线 + V0.1.7 + 12 个 R__），终点 versioned 版本为 0.1.7（原先写 11 条 / 终点 0.1.6，自 V0.1.7 加入后即未同步）；`repeatableCount` 期望 10 → 12。Web 全量 vitest **1604 通过 / 3 skipped**、vue-tsc 零错误、eslint 零错误。
- 自验（浏览器 + 真实后端）：侧栏首项「流程中心」；分类面板 y=92 与搜索卡 y=92 同高；集合区 computed background-image 为 24px 网格、border 为 dashed #c6cce0、radius 12px；截图本地留存。
- 自验（种子，本地 PG + 真实后端）：psql 核对——租户 9001/9002 各 7 个组织节点、每节点恰 2 个用户、树父子关系与 Owner 结构一致；登录链路（RSA + 验证码 1234）实测 `admin/AdminP@ssw0rd`、`demo_a_hq_1/AdminP@ssw0rd`、`demo_a_br2_1/123456`、`demo_b_team1_2/123456` 全部成功；权限口径实测普通用户 `GET /workflow/tasks/todo` 200、`POST /system/user/page` 403，租户管理员 `POST /system/user/page` 200 且只看到本租户 14 人（租户隔离成立）。
- 遗留（环境侧，非代码）：本轮收尾阶段 Docker 守护进程停止，Owner 的 postgres 容器随之不可用（dev 库暂时连不上），因此**首版种子在 dev 库留下的角色菜单授权行（含 209/210/211 大模型管理菜单）尚未清理**。Docker 恢复后按顺序执行：
  ```sql
  delete from sys_role_menu where role_id in (9501, 9502, 9503, 9504);
  ```
  然后重启后端——Flyway 会因 `R__0.1.7_org_demo_seed.sql` 校验和变化重跑该迁移，按新口径（admin 角色授权集 ∪ 前台 7 页）重新授权，不再包含未自动授权的菜单。租户/组织/用户数据本身已是最终形态，无需重做。
- 口径备注：本种子是**演示数据**（租户 code `demo-org-*`、用户名 `demo_*` 前缀），落在产品迁移目录以便 Owner 环境自动装载；如需在其它环境移除，删掉该迁移文件并清理 9001/9002 租户数据即可，不影响既有 tenant-0/default 数据。
- Git：Web（本轮提交）、Server（本轮提交）、workspace（台账 #41 + 本增补）。


---

# 增补 25：#41 复审撤回画布底纹 → 流程集合区纯白背景；种子授权清理闭环

- Owner 反馈（流程中心截图）：我要的是普通的纯白背景，不是网格画布，改一下，不通过。——第③项按 Owner 口径重做。
- 实现（`src/modules/workflow/views/ProcessCatalog.vue`）：`.catalog-list` 移除首版 #41 加入的全部画布装饰（两条 linear-gradient 组成的 24px `#eef2f8` 网格 + `background-size: 24px 24px`、`dashed #c6cce0` 边框、12px 圆角、16px 内边距），改为普通纯白背景并回到 120px 最小高度：
  ```css
  .catalog-list {
    min-height: 120px;
    background: #fff;
  }
  ```
- 自验（本地 5173 + 真实后端，用户可见会话，headless=false，1280×720，身份 admin/系统管理员）：
  - `document.querySelector('.catalog-list')` 计算样式实测：`background-image: none`、`background-color: rgb(255, 255, 255)`、`border-style: none`、`border-width: 0px`、`border-radius: 0px`、`padding: 0px`、`min-height: 120px`——网格底纹与虚线圆角框均已不可见，即普通纯白背景。
  - 回归第①②项：侧栏菜单首项仍为「流程中心」（菜单 320 sort=5）；分类面板 `top rect y=92` 与搜索工具栏 `y=92` 同高（240px / 732px 分栏不变），粘性行为不变。
  - 截图（可见会话）：`C:/Users/hjxch/AppData/Local/Temp/sw-017/b41r-catalog-plain.png`；网络索引（登录 + 打开流程中心共 10 条请求，全部 200，含 `/api/auth/challenge`、`/api/auth/login`、`/api/system/auth/me`、`/api/system/auth/menus`、`/api/workflow/catalog/items`、`/api/workflow/catalog/categories`、`/api/workflow/catalog/category-counts`、`/api/workflow/favorites*`）：`C:/Users/hjxch/AppData/Local/Temp/sw-017/b41r-network-index.json`。
- 自动化检查：`eslint src/modules/workflow/views/ProcessCatalog.vue` 零错误；受影响视图 `vitest run src/modules/workflow/views` 20 文件 133 通过；全量 `vitest run` **1604 通过 / 3 skipped**（与既有基线一致，无新增失败）。
- 上轮遗留清理闭环（Docker 恢复后，dev 库 `sw_017_bugfix`，Owner 的 postgres 容器未由我方启停）：
  - `delete from sys_role_menu where role_id in (9501,9502,9503,9504);` → `DELETE 290`；
  - 重启本地后端（项目 `start.sh`，local profile）→ Flyway 日志：`Migrating schema "public" with repeatable migration "0.1.7 org demo seed"` → `Successfully applied 1 migration` → `Started StarterApplication in 29.686 seconds`；
  - 重授实测：9501/9503=80 条、9502/9504=8 条，`menu_id in (209,210,211)` 命中 **0**；9502 授权集逐行核对＝父菜单 5（流程管理）+ 流程中心 320（sort=5）/待办 20/已办 21/我发起的 24/我的草稿 25/我的已办 26/抄送我的 321，共 8 条；
  - 种子数据不变：租户 2、组织节点 14、用户 28（psql 计数），无需重做。
- 环境清理：本轮启动的前端 dev server 与本地后端在验证完成后均已停止（后端 `stop.sh`），浏览器保留流程中心标签页。
- 进度：0.1.7 回归批次台账 41 项，均已交付（#41 第③项按 Owner 复审重做）；进行中 0、未开始 0；等待 Owner 对 #37—#41 的回归结论。
- Git：Web（本轮提交）、workspace（台账 #41 更新 + 本增补）。
