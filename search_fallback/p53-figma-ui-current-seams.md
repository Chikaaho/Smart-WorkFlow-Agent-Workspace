# P53 全局 UI 现状底图探索回执

> 回执：执行 → 规划 · 需求 P53 · 等级 XL（Planner 定级）· 日期 2026-09-16
> 性质：只读事实探索。未修改业务代码、测试、配置、资产与 Git 状态；未启动 P61 剩余执行包。
> 体积说明：任务书要求 32 节点逐项完整映射，超出探索通道 <5KB 指导值，已尽量压缩。

## 1. 执行环境与只读声明

- 工作区 HEAD `bd712af`（工作树含会话前既有未提交修改，本任务未新增改动）；Web 仓 HEAD `381ef74`（p61 UI 侧），工作树干净。
- 设计包 `docs/ui/`：32 SVG + 32 PNG，编号 01–32 与任务书节点一一对应；viewBox 1440×1024（19 号 1440×1512）与 PNG 像素 1:1；SVG clip id 即上游 nodeId（`01→clip0_3_2`↔`3:2`、`07→clip0_42_2`↔`42:2`、`21→clip0_97_2`↔`97:2`、`32→clip0_138_5`↔`138:5`）。SVG/PNG 未发现实质视觉差异；SVG 全部文本已转曲（0 个 `<text>`）、29/32 含内嵌 base64 位图。
- 检查范围：docs/ui 全量目检（32/32 PNG）+ SVG 抽样结构核对；Web 仓代码经三路只读盘点（路由壳/模块 API/样式与锁定测试）+ 工程宪法、knowledge、product 交叉核对。行号以当前工作树为准。

## 2. 工程底图（问题 A）

- 技术栈：Vue 3.5 + TS + Vite 8 + pnpm；Element Plus 2.14.2 按需自动导入（`vite.config.ts`）；pinia 3（`src/stores/`：app/user/menu 三store）；vue-router 5 静态表 `src/router/index.ts:17-463` + 守卫动态 `addRoute`（`guard.ts:85-107`）；vue-i18n 11 仅 zh-CN/en-US（`src/locales/index.ts:16-18`）；axios 唯一入口 `foundation/request/index.ts`。
- 布局壳：用户端/管理端**共用单一壳** `src/layouts/BasicLayout.vue:14-31`（侧栏 AppLogo+AppSidebar / 顶栏 AppTopbar / 主区），前后台靠区域过滤（`foundation/area.ts:17-27`）+顶栏切换按钮（`AppTopbar.vue:93-105`）区分，**无平行壳、无重复布局组件、无标签页组件**。菜单：服务端下发单一数据源（`foundation/menu/index.ts:58-64` GET /system/auth/menus），前端不裁剪。
- 权限：token 纯内存（`foundation/auth/token.ts:1-8`）；守卫 `hasRouteAccess`（`guard.ts:58-75`）+ 后台准入 `canEnterAdminArea`（`area.ts:59-66`）；按钮级 `v-perm` fail-closed（`foundation/permission/index.ts:36-43`）。
- 令牌：唯一全局 CSS `src/styles/tokens.css`，`--sw-*` 全套（主色 `#7e306b` :8、中性 :26-33、语义 :36-43、字号 :46-57、圆角 :60-63、间距 :66-72、阴影 :75-77、密度/布局 :80-94）；EP 变量经 color-mix 派生（:10-16）；`tokens.spec.ts:17-37` 锁 9 类 token 名；暗色仅注释预留。
- 字体/资产：**无全局 font-family、无 @font-face、无 Inter**，系统默认栈；`src/assets/` 仅 `logo.png`（`AppLogo.vue:4`）；图标全为 @element-plus/icons-vue 按需导入 + 菜单白名单映射（`menu-icons.ts:18-28`）；流程图为自研 SVG 内核（`adapters/process-graph/index.ts:1-7`），@vue-flow 仅用于 agent 图（`adapters/flow-graph/index.ts:5`）。
- 移动/断点：仅 `BasicLayout.vue:58` 一个 767px 断点；移动为 3 个专用 H5 路由 `/m/form/:formKey`、`/m/workflow`、`/m/notify`（375px 单列，`router/index.ts:383-413`）；工程宪法 §5.7 明确「桌面宽屏+亮色，移动/暗色延后」。
- 页面清单：壳外公共页 4（Login/SsoReturn/SsoBind/Error），业务页全部在 `src/modules/*/views/`（system 8、form 5+designer 组件、workflow 28、agent 13、notify 8、iot 9、job 2、storage 1、openapi 占位 1）。路由全表见 `src/router/index.ts` 与动态菜单（mock 种子 `foundation/mock/seeds.ts:215-930`）。

## 3. 32 节点逐项映射（问题 B）

状态：EXACT=能力与结构均有 / PARTIAL=能力有但布局或细节缺 / MISSING=无对应页/能力 / PROTOTYPE_ONLY=组件切图页。缩写：文件均在 `docs/ui/svg|png/NN*.同png名`。

| # | 页面(nodeId) | 现有路由/页面 | 状态 | 主要差异（→依赖的真实接口/建议复用） |
|---|---|---|---|---|
| 01 | 工作台(3:2) | `/workspace` WorkspaceHome.vue | PARTIAL | 有待办/我发起/抄送/草稿卡片+常用事项排序持久化（`api/oa.ts:197-209`）；缺顶部横向主导航+深色侧栏新壳、4 统计卡、快捷发起网格、业务动态 feed、流程效能卡（统计 API 仅 `api/i4.ts:171-184`） |
| 02 | 数据列表(4:2) | 动态菜单 MyInstances.vue | PARTIAL | 列表/详情/撤回/催办全有（`MyInstances.vue`、`oa.ts:184-190`）；缺新壳、卡片化筛选、时间范围、统计头；状态标签含已驳回/已撤回 |
| 03 | 数据详情(5:2) | 无独立页；TaskDetail.vue(`/workflow/task/:taskId`)+FormRender view | PARTIAL | 有表单回显/审批历史/变量/通过驳回退回/催办（`TaskDetail.vue:135-153,377-404,663-710`）；缺发起人视角只读详情页、左表单右流程状态双卡、流转记录/流程图/审批详情三 tab、前/当前/后节点状态卡 |
| 04 | 管理后台(6:2) | 动态菜单 ProcessDefList 等 | PARTIAL | 列表/设计/发布状态有；缺管理端独立顶部导航（表单/流程/应用/门户/系统/运行监控——应用/门户/运行为现状没有的顶级分类）、4 统计卡、版本列、实例数列、独立菜单管理页（现状在角色弹窗内 `api/role.ts:79-84`） |
| 05 | 企业门户(7:2) | 无对应（最近似 WorkspaceHome） | MISSING | hero banner+全局搜索+常用服务卡+趋势柱状图+我的关注+公告与知识均无（无公告能力、无图表组件） |
| 06 | 登录页(32:2) | `/login` LoginPage.vue | PARTIAL | 账密+图形验证码挑战+RSA-OAEP+SSO 三渠道有（`LoginPage.vue:49-92`、`foundation/auth/index.ts:32-90`、`sso.ts:34-101`）；缺左侧品牌区；**租户输入、记住登录、忘记密码与现状契约冲突见 §9** |
| 07 | 表单设计器(42:2) | `/form/designer/:id?` FormDesigner.vue | PARTIAL | 三栏（FieldPalette/DesignerCanvas/FieldConfigPanel）+预览+草稿历史+关联流程面板结构对应；缺 12 栏栅格（现状双列）、表单/流程双 tab 事项编辑器、流水号/关联数据/IoT 设备/Agent 结果组件、字段标识发布后不可改提示、自动保存时间戳 |
| 08 | 关联流程列表(42:3) | RelatedProcessesPanel（FormDesigner 内） | PARTIAL | 表单-流程关联有；缺版本列、v3.3-draft 草稿行、启用状态列；版本操作对应已有无 UI 的 `api/index.ts:467-500`（listDefVersions 等） |
| 09 | 流程设计器(42:4) | `/workflow/defs/:defId/design` ProcessDesigner.vue | PARTIAL | 拖拽/连线/缩放/保存/校验/发布/属性面板有（自研 SVG）；缺 IoT 指令/Agent/起草节点类型（能力契约仅 APPROVAL/CONSENSUS/CONDITION/COPY/NOTIFICATION，`utils/node-capabilities.ts:10-18`）、监听器配置、审批方式+选择审批人（现状手输 ID `ProcessDesigner.vue:672-695`） |
| 10 | 完整流程图(42:5) | ProcessGraphView.vue（消费于 `ProcessDefList.vue:325`、`ProcessInstanceList.vue:384`） | PARTIAL | 只读图+实例轨迹高亮有；缺申请信息/流程图/审批记录/流转日志 4 tab、节点状态图例、定位当前、版本+运行时长头 |
| 11 | 字段属性列表(49:2) | 无对应弹窗 | MISSING | 字段 schema 存在但无全字段清单/SQL 类型展示/宽度/约束状态/导出/发布兼容性校验视图 |
| 12 | 审批人选择(49:240) | 无 UI；API 已有未消费 `api/index.ts:219-225` | MISSING | 设计=组织树+搜索+多选+已选+审批策略+动态规则 4 tab；需新建通用组织选人器（候选接口形状已有：脱敏 id/username/realName） |
| 13 | 流程高级配置(50:88) | 无对应 | MISSING | 统一监听器/通知渠道(站内/微信/飞书/钉钉)+模板引用/前置后置处理器均无；通知模板管理能力在 notify 模块可复用 |
| 14 | 草稿历史版本(50:429) | HistoryVersionsDialog（FormDesigner） | PARTIAL | 表单定义历史版本有；缺表单+流程合并事项级草稿线（v3.3-draft）、对比当前、恢复不覆盖已发布语义 |
| 15 | 审批意见详情(60:48) | 无独立弹窗；TaskDetail 意见表单+历史（`:200-286,663-710`） | PARTIAL | 缺按人意见快照弹窗、**按审批时表单版本(v1.2)快照渲染**、已确认检查项 chips；快照需 Server 存储/接口支持（UNKNOWN，需 Server 侧核对） |
| 16 | 会签列表详情(60:190) | 无独立弹窗；加签/补签 API 有 `api/index.ts:530-545` | PARTIAL | 缺会签节点聚合记录（参与/同意/待处理/驳回统计+每人送达/处理时间）；会签模式 ALL/ANY 契约已有（mock `workflow-node-capabilities.ts:58-87`） |
| 17 | 部门负责人审批意见(60:413) | 同 15 模板变体(v1.0) | PARTIAL | 同 15 缺口 |
| 18 | 李宁会签审批意见(60:592) | 同 15 模板变体(v1.2) | PARTIAL | 同 15 缺口 |
| 19 | 数据详情·流程图(90:68) | ProcessGraphView 内嵌能力 | PARTIAL | 同 10 差异，落于 03 的 tab 内嵌 |
| 20 | 数据详情·审批详情列表(90:311) | TaskDetail 审批历史 `:663-710` | PARTIAL | 有节点/人/时间/意见表；缺状态列色标、查看详情（→15 弹窗）、自定义审批表单标记、会签按人展开行 |
| 21 | 用户端·流程中心(97:2) | `/workflow/catalog/:processKey?` ProcessCatalog.vue | PARTIAL | 分类+卡片+发起+权限过滤（服务端过滤）全有；缺分类 tab 内联计数、卡片版本号/最近使用、「可发起 N 个」计数 |
| 22–26 | 流程中心五分类(100:2/387/772/1157/1542) | 同 21 分类过滤视图 | PARTIAL | 与 21 同构（行政办公2/财务1/IT1/设备1/平台权限1），差异同 21；对应现状路由参数/分类点击 |
| 27 | 用户端·发起流程(101:2) | `/form/form-render/:formKey` FormRender.vue | PARTIAL | 填报三模式+草稿模式全有（`:8-16,45-49,74-80`）；缺左表单右「流程说明」双栏、横排 label/value、版本+发起范围说明卡 |
| 28 | 用户端·个人菜单(103:2) | AppTopbar 用户下拉 `:109-125` | PARTIAL | 有下拉（账号绑定/退出）；缺修改密码入口（无能力）、后台管理项（职责在顶栏独立按钮）、「当前空间」概念（现状无 workspace 切换） |
| 29 | 管理端·个人菜单(103:398) | 同 28 管理端变体 | PARTIAL | 「前往业务工作台」≈现状「返回前台」（`AppTopbar.vue:93-105`）；修改密码同缺 |
| 30 | 用户头像菜单·原型浮层(134:2) | —（28 的浮层切图） | PROTOTYPE_ONLY | 纯组件页：白卡+三按钮+红字退出；可作组件实现基准 |
| 31 | 修改密码·原型浮层(135:2) | 无对应（无 API 无页面） | PROTOTYPE_ONLY/MISSING | 原密码/新密码/确认弹窗；认证面新增能力，见 §9 |
| 32 | 管理端头像菜单·原型浮层(138:5) | —（29 的浮层切图） | PROTOTYPE_ONLY | 同 30 管理端版 |

**能力四分类**（B 第二问）：
- 已有真实行为：五类流程列表、发起/草稿、审批通过/驳回/退回、会签/加签/补签、委托/转办/沟通、催办/撤回、流程图轨迹、表单设计/填报/数据管理、系统管理、通知收发、SSO、双语。
- 有能力但入口/布局不同：后台入口（顶栏切换 vs 独立导航）、流程图（内嵌/弹窗 vs tab 页）、意见查看（表格行 vs 快照弹窗）、草稿历史（表单版本 vs 事项合并版本）、登录（纯表单 vs 品牌+表单分栏）。
- 仅视觉示例、当前无能力：企业门户整页、修改/忘记密码、记住登录、流程高级配置（监听器/前置后置）、字段属性清单与导出、意见表单版本快照、业务动态 feed、效能/趋势图表、公告与知识。
- 需另行产品裁决（改规则/权限/契约）：登录租户输入、记住登录状态、IoT 指令/Agent/起草流程节点、审批人动态规则（发起人/部门负责人/角色/表达式）、意见按表单版本快照（Server 存储结构）、菜单管理独立页、多工作空间/租户切换、修改密码 API。

## 4. 设计系统与资产（问题 C）

- 候选令牌（SVG fill 统计+PNG 目检）：主色 **#6F2DFF**（309 处，与工程宪法 §5 紫莓 `#7e306b` 冲突）；浅紫底 #ECE9FF/#E9E1FF；侧栏深色 #17213A/#19233B（系 #111B3B–#19233B 阶）；正文 #111B3B–#172033；次级 #7E89A1/#6B7280；边框 #DDE3EF/#C9D1E8；卡底 #FAFBFE/#F8FAFE；状态 chips 为浅底深字（成功绿/警告黄/危险红/信息紫）；卡片圆角≈9.5–12、控件≈6–8、chips 全圆角；顶部主导航为深紫底+白字+active 高亮。收敛唯一入口：`tokens.css` 替换品牌阶+新增导航/侧栏深色令牌，EP 覆盖沿用 color-mix；`tokens.spec.ts` 断言需同步更新（锁定行为）。
- 资产落库：SVG 全转曲+29/32 内嵌位图 → **不得整页嵌入**；建议仅按需从 SVG 拆取图标 path 或重绘矢量化（命名 `assets/icons/<域>-<名>.svg`）；logo 现为 `assets/logo.png` 紫底，设计为黑色圆 mark → 需新增品牌资产（来源设计包或上游 Figma fileKey `mbEKPcZv9pcchmElQanR5E`）；PNG 仅作视觉基准不作资产。
- 字体：SVG 转曲无法判定设计字体（任务书所提 Inter 在文件中零引用）；现状系统默认栈。建议实施时显式声明回退链（Inter + PingFang SC / Microsoft YaHei）并先解决 Inter 授权与引入方式（UNKNOWN：授权来源未定）。

## 5. 响应式 / 双语 / 可访问性（问题 D）

- 设计顶层全部 1440 宽；移动版无设计。现状=桌面优先+3 个 375 专用 H5 页+单一 767 断点；P53 不得以桌面缩放充当移动实现，移动决策缺失需 Planner 补充或明确继续延后（工程宪法 §5.7 现范围外）。
- 双语：locale 仓库 zh/en 键集一致有测试锁定（`messages-compile.spec.ts:53`、`locales/index.spec.ts:34,81,90`）；新增全部 UI 文案必须走 locale 键；P61 机器语义（errorKey/eventRef 不随语言变化、Accept-Language 注入 `request/index.ts:121-124`）为纯数据层，UI 改造不得触碰。
- 可访问性现状薄弱：aria 仅 4 处、无全局 `:focus-visible`、无 skip link、无弹窗焦点管理约定；新壳深色侧栏次级字 #7E89A1 on #17213A 对比度≈4:1 处于 WCAG AA 边缘，需在令牌层校正；建议 P53 方向纳入焦点管理/对比度验收项。

## 6. 组件矩阵（问题 C.2/E）

- **可直接复用**：StandardListTemplate/StandardFormTemplate 及槽位件、DynamicField+17 控件、DictSelect/DictTag、LocaleSwitch、ProcessGraphView（图内核）、form-create 预览链、adapters 防腐层。
- **需改造**：BasicLayout/AppTopbar/AppSidebar（新壳：顶部主导航+深色侧栏+区域导航重组）、ProcessCatalog（卡片/计数）、FormRender（双栏布局）、FormDesigner/ProcessDesigner（栅格、节点类型、选人入口）、AppTopbar 用户菜单、登录页。
- **需新增**：通用组织架构选人器（弹窗，树+搜索+多选+策略）、统计卡组件、状态 chips 规范、会签记录弹窗、意见快照弹窗、字段属性清单弹窗、流程高级配置弹窗、图表组件（趋势/效能，技术选型需另定，UNKNOWN）、公告/知识展示（能力缺失，随裁决）。

## 7. 实施切片与证据计划（问题 E.1/E.4）

建议顺序（共享基础优先，每片含回滚点）：① 令牌+资产+字体基线（回滚=单 tokens.css+资产目录，同步 tokens.spec）→ ② 全局壳与导航（触碰菜单单源/area 过滤不变量，有常驻回归测试钉死，不得弱化）→ ③ 通用组件（选人器/统计卡/chips/弹窗族）→ ④ 登录页（冲突项按 §9 裁决结论范围实施）→ ⑤ 工作台+企业门户 → ⑥ 数据页（列表/详情/流程中心/发起）→ ⑦ 设计器（表单/流程）→ ⑧ 浮层与响应式收口。依赖链：②③ 依赖 ①；⑤⑥⑦ 依赖 ②③；⑧ 收尾。
- 视觉回归：现状零快照/零 playwright（`src` 全量确认）；建议引入桌面 1440 基准截图+分组件 diff，阈值须能发现裁切/遮挡/错位/断点错误/状态缺失，人工复核点=新壳首屏、设计器画布、登录页；工具引入属工程裁决项（UNKNOWN：尚未批准具体工具）。

## 8. P60/P61 证据影响（问题 E.2/E.3）

- 会触碰的锁定测试（行为不变、仅视觉时应保持断言）：`tokens.spec.ts`（token 名）、`locales/index.spec.ts`+`messages-compile.spec.ts`（键集一致/EP 跟随/lang 同步）、`page-layout.spec.ts`（空态/页型）、`TodoList.spec.ts:104-162` 与 `NotifyBatchSend-r2cn.evidence.spec.ts`（提示语诚实性/四计数——文案键不可删改）、已知问题 I9 的 main.ts 全量 EP CSS 导入兜底须保留。
- **自然失效（Web 视觉层）**：P61 `receipts/evidence/p61-r10-01/shots/` 31 页族 zh/en 截图、`p61-r7-01` 截图与 probe、`r2b-h-final-matrix.md` 页面级失败矩阵——P53 新壳/新视觉实施后即失真，须按新 UI 基线重采（P61 hold 回执 §2 已预告）；**不得提前重跑或伪造新基线**。
- **可继续保留（Server 机器契约层+Web 数据层）**：errorKey/eventRef/错误码目录、双语 MessageSource 与 `BilingualMessageContractTest`、`ErrorCodeCatalogTest`；Web 侧 `error-code-map.spec.ts`、`failure-category.spec.ts`、locale 键集与可编译性测试（只要不删键）。
- P60 基线（`knowledge/features/v0.1.0-oa-completion.md`，两仓 0.1.0 已发布锁定）：UI 改造后 Web 侧四门计数会变，属正常演进，不构成对 P60 的回改。

## 9. 未决产品问题（仅列改变范围/行为者）

1. 主色 #7e306b→#6F2DFF 全站替换与工程宪法 §5 修订（文档冲突，需 Owner/Planner 裁决）。
2. 登录页「租户输入」与「前端不发租户头」红线（shared-constraints §1.3）冲突；「记住登录状态」与 token 仅内存/刷新=重登录铁律冲突；是否引入需安全裁决。
3. 修改密码/忘记密码：认证面新增能力（API/页面均无）。
4. 流程节点类型扩展（IoT 指令/Agent 调用/起草）与流程级监听器/前置后置处理：Server BPM 契约扩展。
5. 审批人动态规则（发起人/部门负责人/角色/表达式）：计算引擎现状不存在。
6. 审批意见按表单版本快照渲染：需 Server 存储与接口支持（现状 UNKNOWN，需 Server 侧探索）。
7. 管理端独立顶部导航信息架构（应用管理/门户管理/运行监控为现状没有的顶级分类）与菜单管理独立页。
8. 多工作空间/租户切换（「当前空间」）。
9. 企业门户图表与公告能力是否新增。

## 10. 事实/推测/未确认与冲突汇总

- 已确定事实：§1–§8 所列均有文件/行号或全量目检支撑；SVG/PNG/nodeId 三方一致。
- 推测：设计主色系（hover 深化值、disabled 阶）需从 PNG 近似取值，精确色阶应以 Planner 验收口径或上游 Figma 为准。
- UNKNOWN：设计字体（转曲）；图表组件选型；意见快照 Server 结构；Inter 授权；视觉回归工具批准。
- 冲突：仅 §9.1 文档层主色冲突；SVG/PNG 未见实质差异。
- 是否需继续探索：Web 侧已充分；Server 侧（意见快照、审批人候选契约细节、节点扩展、密码 API）建议在 P53 正式方向确定后另发 Server 探索任务。
