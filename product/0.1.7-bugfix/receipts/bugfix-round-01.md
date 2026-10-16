# 0.1.7 修复轮次回执 01（18/18 项已修复并自验）

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
