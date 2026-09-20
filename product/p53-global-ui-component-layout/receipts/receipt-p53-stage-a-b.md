# P53 阶段 A/B 执行回执（视觉基础·回归底座·全局壳·入口页面）

> 阶段：A（视觉基础与回归底座）+ B（全局壳、导航与入口页面）· 方向 §8
> 执行：Executor · 日期 2026-09-17 · 方向：`../ready/direction-p53-global-ui-component-layout.md`
> 自验结论：阶段 A/B 范围内自验通过（四连全绿 + 视觉套件全绿 + 截图人工复核），**待规划验收**；不构成功能级 PASSED。

## 1. 本阶段覆盖节点（32 节点处置矩阵对照）

| 节点 | 处置 | 状态 |
|---|---|---|
| 01 工作台 | 真实页面改造 | 本阶段完成：问候头（真实 displayName+待办 total）、4 统计卡（真实分页 total）、令牌化卡片；可配置卡片网格/布局持久化原样保留 |
| 04 管理后台 | 真实页面改造（壳层） | 本阶段完成壳与导航形态：管理端深色顶栏 + 服务端菜单顶层分组主导航 + 深色侧栏 + 「当前视图」卡；页面族改造留阶段 C/D |
| 05 企业门户 | 受限新视觉页面 | 本阶段完成：`/portal` 聚合真实统计（目录事项 total/我发起的 total）+ 服务卡（按服务端菜单可见集过滤）+ 我的关注（待办/未读，真实计数）；公告/知识/搜索/趋势区块按方向省略 |
| 06 登录页 | 真实页面改造 | 本阶段完成：品牌分栏（深色品牌区+表单卡）；验证码挑战/RSA-OAEP/会话/SSO 契约逐行保留；**未新增**租户/记住登录/忘记密码/修改密码（方向 §4.4） |
| 28/29 个人菜单 | 真实组件改造 | 完成：用户下拉=账号绑定 + 进入后台（adminCapable 时）/返回工作台（admin 区）+ 退出登录（danger 红字）；无修改密码项 |
| 30/32 头像菜单原型 | 组件视觉基准 | 该下拉即 28/29 的浮层实现，未建独立路由 |

未覆盖（后续阶段）：02/03/07–20/21–27（阶段 C/D）；阶段 E 收口项。

## 2. 阶段 A 交付（共享基础）

- **令牌单一源** `src/styles/tokens.css`（整篇替换）：品牌主色 `#6f2dff`、品牌阶（dark/light `#bfa7ff`/soft `#ece9ff`/softer `#e9e1ff`）、深色导航阶（`--sw-nav-sidebar-bg:#17213a`、`--sw-nav-topbar-admin-bg:#172033`、`--sw-nav-bg-raised:#19233b`、text/secondary/border/hover）、表面（page `#f7f8fc`/card）、语义色（success `#18a67a`、warning `#f59e0b`、danger `#e5484d`、info `#20b8cd`+浅底）、字体链 `--sw-font-family: Inter, 'PingFang SC', 'Microsoft YaHei', …`（本地安全链，无外部字体文件）、圆角（控件 6/卡片 10/弹窗 12）、深蓝基调阴影、顶栏高度 64px；中性色/字号/间距/密度随设计基线更新。色值出处=补充回执 G1 同批设计文件的 fill 统计与 PNG 目检。
- **Element Plus 覆盖**：全部 `--el-*` 绑定置于 `html:root` 块（specificity 高于 EP 按需注入 base.css 的 `:root` 默认值——已实测修复「组件按钮回退 EP 蓝 #409eff」缺陷）。语义色组同步重绑 EP success/warning/danger/error/info 及 light 阶，业务组件自动跟随。
- **对比度**：侧栏次级文字 `#7E89A1` on `#17213A` = 4.55:1 ≥ AA 4.5:1（保留设计原值，未做偏差）。
- **品牌资产**：`src/assets/brand/logo-mark.png`（444×468，自设计包 `docs/ui/svg/01 工作台.svg` 内嵌位图提取，与 05/06 等页同一图）；旧 `src/assets/logo.png` 删除，引用唯一（`AppLogo.vue`），grep 零残留。
- **tokens.spec.ts**：9→14 项（新增品牌阶/深色导航/表面/字体族类别断言 + P53 基线色值断言），旧 9 类断言全部保留未弱化。
- **视觉回归底座（方向 §4.7 批准的 @playwright/test 1.63.0 devDependency）**：
  - `playwright.config.ts`：4 视口 projects（1440×1024 / 1920×1080 / 1280×800 / 375×812，chromium）；webServer=`pnpm dev:mock --port 5174 --strictPort`（独立端口 + `reuseExistingServer:false`——实测修复「复用机器上既有非 mock 5173 dev server 导致请求穿透真实后端」的问题）；`expect.toHaveScreenshot` 全局 maxDiffPixels:0（区域阈值显式声明，不做整页百分比放行）。
  - `e2e/visual/regions.ts`：区域 clip（顶栏 64/侧栏 220/主区）+ 方向阈值（0.5%/0.5%/2%/长文本 3%）+ 三个独立阻断辅助（`expectNotClipped` 越界≤1px、`expectNotObscured` 遮挡、`expectPositionWithin` 偏差≤2px）。
  - `e2e/visual/auth.ts`：dev:mock 受控会话辅助（VITE_DEBUG_AUTH_ENABLED 注入链路 + 固定 zh-CN locale）。
  - 冒烟 spec（登录页结构/375 品牌区隐藏/守卫收敛）与壳 spec（登录后导航/菜单/区域切换/门户）共 6 用例 × 4 视口；**截图基线未建立**——按方向 §8 阶段 A「只建底座」，基线在阶段 C/D 页面族改造完成后统一建立，避免消耗唯一一次校准。
  - 截图存档（人工复核用）：`e2e/.artifacts/shell-portal-workspace.png`、`shell-portal-home.png`、`shell-admin.png`（1440 与 375 两版均已目检）。
- 工程接入：package.json（`test:visual`/`test:visual:update` 脚本 + devDependency）、tsconfig.node.json（config+e2e 纳入，lib+DOM）、eslint（ignores: test-results/playwright-report/.p61-tmp——后者为 P61 取证运行产物，此前即存在于 .gitignore）、vitest exclude `e2e/**`、.gitignore 增运行产物目录。

## 3. 阶段 B 交付（壳与入口）

- **BasicLayout.vue 重构**：顶部主导航条（64px：AppLogo + AppMainNav + 工具区）+ 深色侧栏（菜单 + 底部区域卡/折叠钮）+ 内容区；用户端顶栏=品牌主色、管理端顶栏=`--sw-nav-topbar-admin-bg`（区域 class 驱动）；767px 以下侧栏隐藏（R5 语义保留）+ logo 文字收起。
- **AppMainNav.vue（新）**：portal=工作台（常量路由）+我的门户+流程中心+收件箱（均以服务端菜单树可达性过滤；portal 路由不依赖菜单下发）；admin=服务端菜单顶层分组（点击进入目录注册的首叶 redirect）。条目全部真实可达，未落地「应用中心/数据中心」等无能力标签（方向 §4.3）。窄屏横向滑动可点。
- **AppTopbar.vue 重构**：通知铃铛（`unreadNotifyCount` 真实未读数，仅菜单树含收件箱时显示，失败静默为 0）+ LocaleSwitch（深色底样式适配）+ 用户下拉（账号绑定/进入后台/返回工作台/退出登录 danger）。区域切换自顶栏独立按钮移入下拉（入口重组，能力等价，`firstAdminLeafPath` 复用未重复实现）。面包屑移除（设计稿无面包屑；侧栏+主导航承担导航）——**差异记录**。
- **AppSidebar.vue**：深色导航样式（EP menu 变量定制），active=主色圆角块（对照设计 01）；数据链路不变（menuStore 单源 + visibleMenuForArea 区域过滤 + openedMenuKeys）。
- **LoginPage.vue**：分栏品牌区（logo+标语+徽标+能力 pill+footnote，全部 locale 键）+ 右侧表单卡（欢迎/安全徽标/账号/密码/验证码/登录）；SSO 保留 provider select + 租户输入 + 授权按钮（真实 SSO 契约需租户，与设计「三按钮直跳」的差异记录）；错误 `role="alert"`。
- **WorkspaceHome.vue**：问候头（时间分段 i18n + 真实 displayName）+「N 项待办待处理」（真实 total）；4 统计卡=todo/myInstances/myProcessed/myDrafts 真实分页 total（无本周/超时维度接口，不做伪统计）；卡片网格/配置抽屉/布局持久化逐行保留；样式令牌化。
- **PortalHome.vue（新，`src/views/`）**：受限聚合页——hero（标题/副标题 + 业务流程总数/本月实例=真实 total；「按时完成率」无数据源未展示）+ 常用服务卡（5 候选按菜单可见集过滤，superadmin 种子=4 卡可见；agent 会话为静态深链不在菜单树故不显示）+ 我的关注（待办/未读通知真实计数）。公告/知识/全局搜索/趋势图省略（方向 §4.3/§5.05）。`Promise.allSettled` 部分失败不阻塞整页。
- **路由/区域**：`/portal` 常量子路由（`router/index.ts`）+ `PORTAL_MENU_PATHS` 增加 `'portal'`（`foundation/area.ts`——否则区域判定错误）。
- **locale**：经单源 `scripts/p61-locales-manual.json` 新增 nav/login/workspace/portal 四段（zh+en 同步），`p61-gen-locales.mjs` 再生成，`--check` 一致；P61 机器语义与既有键未触碰。

## 4. 验证结果（本阶段实际输出）

- 四连（`NODE_OPTIONS=--max-old-space-size=2048`，前后端互斥检查：仅运行中 bootstrap.jar 服务、无 mvn 编译进程）：typecheck ✓；lint 0 error 0 warning ✓；vitest 全量 134 files / 1217 passed + 3 skipped ✓（相对 P60 基线增量来自 tokens.spec 断言新增与既有增量，0 失败）；`pnpm build` ✓（vue-tsc -b + vite build 成功）。
- Playwright 视觉套件：23 passed + 1 skipped（375 视口的区域切换冒烟按方向 §4.5 有意跳过——375 承诺范围为登录页与三个 H5 页）。
- Playwright 过程中发现并修复的真实缺陷：① EP 按需注入导致品牌变量回退默认蓝（html:root 修复）；② 端口复用导致 mock 失效穿透真实后端（独立端口+strictPort 修复）；③ 375 顶栏导航遮挡不可点（横向滑动修复）；④ 门户 hero 窄屏竖排/裁切（纵向布局修复）——均为视觉阻断条件定义的缺陷类型，已复测通过。
- 行为证据要点：个人菜单无「修改密码/忘记密码」项（断言）；登录页无租户/记住登录字段（结构保留原契约）；管理端主导航 9 分组全部来自服务端菜单树；门户服务卡数量=菜单可见集（断言 4）；区域切换后顶栏形态随 area class 切换（断言）。
- 已知限制：el-menu collapse 态的弹出子菜单暂为 EP 默认浅色（次要交互态，记录差异）；登录页图形验证码位图为后端契约内容，样式不在前端控制范围。

## 5. 回滚点

- 阶段 A：`src/styles/tokens.css` + `tokens.spec.ts` + `src/assets/brand/` 单点回滚（AppLogo 引用一处）；Playwright 底座为纯增量文件（package.json/tsconfig/eslint/vitest 接入行可独立还原）。
- 阶段 B：`src/layouts/`（4 组件）+ `LoginPage.vue` + `WorkspaceHome.vue` + `PortalHome.vue`（新文件，删除即回滚）+ `router/index.ts`、`area.ts` 各一处小改；locale 经生成器可逆向再生成。
- P60/0.1.0 发布身份未触碰；P61 机器语义、locale 既有键、提示语测试断言未改动（本轮全量 vitest 0 失败佐证）。

## 6. 待规划事项与移交

1. 阶段 C（数据/流程消费页面）与阶段 D（设计器族）按方向继续，处置矩阵已锁定。
2. 截图基线的建立时点：阶段 C/D 页面族完成后统一 `test:visual:update` 建基线（唯一一次校准留给其后真实的视觉微调）。
3. 面包屑移除为导航信息架构变化，已在 §3 记录；如 Planner 判定需要保留，可作为独立小步恢复。
