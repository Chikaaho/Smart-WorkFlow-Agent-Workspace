# BF20261013-047 执行回执：页签小图标（favicon）+ 页签按一级页签功能命名

2026-10-15｜执行者提交（fix-loop 持续修复批次）。Owner 反馈：
① 把 logo 搞个小 icon 放到页签 tab；
② 每个页面的页签要展示对应功能，不能全部只展示项目名；
执行中澄清：
③ **只展示对应一级页签的功能**；
④ **我重绘了一份 favicon，以我新放在 public 目录的为准**。

## 一、现状与成因

- `index.html` 没有 `<link rel="icon">` → 浏览器页签显示默认地球图标；
- 全仓没有 `document.title` 赋值 → 页签标题恒为模板里的「CH-aPaaS」，不随页面变化。

## 二、已修复

**图标（①④）**

| 文件 | 说明 |
|---|---|
| `public/favicon.png` | **Owner 重绘件**（1024×1024 RGBA）——按 Owner 指示直接引用为准，未做任何替换/改绘 |
| `public/apple-touch-icon.png` | 由 Owner 图标派生 180×180（iOS 主屏图标与页签一致） |
| `index.html` | `<link rel="icon" type="image/png" href="/favicon.png">` + `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` |

**页签标题（②③）**：新增 `src/router/page-title.ts`（纯函数 + 顺序敏感路径规则表）

- **前台（工作台外壳**，`resolveArea(path)='portal'`**）**：一级入口就是页面本身 → 用路由 `meta.title`：工作台 / 我的门户 / 流程中心 / 待办任务 / 已办任务 / 我的草稿 / 我发起的 …
- **管理端 / 移动端 / 账户 / 登录 / 错误页**：取**一级页签功能**（顶栏一级入口）——`/system/**`=系统管理、`/form/**`=表单管理、`/workflow/**`=流程管理、`/notify/**`=通知、`/agent/**`=智能体、`/iot/**`=物联网、`/job/**`=定时任务；`/m/form|workflow|notify`=移动填报/移动工作台/移动收件箱；`/account/bindings`=账号绑定；`/login`、`/sso/return`=登录；`/403|/404|/500`=无权限访问/页面不存在/服务异常。
- 未命中规则的深链兜底显示项目名 `CH-aPaaS`（不再出现「所有页面都是项目名」）。
- 接线：`src/main.ts` 里 `router.afterEach` 应用 + `watch(i18n.global.locale)`（中英切换时页签同步刷新）+ 首帧应用。
- 子页名（如「流程定义」「表单设计器」）按 Owner 口径**不**进页签。

## 三、验证

- 单测：新增 `src/router/page-title.spec.ts` **7 例**（管理端各一级映射、移动端/账户/登录/错误页、兜底项目名、前台 meta 优先、前台缺 meta 回落、管理端忽略子页名、`applyDocumentTitle` 落地）。四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1529** 通过 3 跳过、build ✓。
- 实景（应用内浏览器 1280×720，管理员会话）逐页读 `document.title`：

| 路由 | 页签标题 |
|---|---|
| /system/user | 系统管理 |
| /form/form-def-list | 表单管理 |
| /workflow/defs | 流程管理 |
| /notify/template | 通知 |
| /agent/tool | 智能体 |
| /iot/connections | 物联网 |
| /job/list | 定时任务 |
| /workspace | 工作台 |
| /portal | 我的门户 |
| /workflow/catalog | 流程中心 |
| /workspace/todo | 待办任务 |
| /workflow/my-instances | 我发起的 |

- 图标：`/favicon.png` 实测 HTTP 200、`image/png`、155396 bytes（Owner 件）；浏览器页签标题随之变为「我发起的」；页签图标 32px / 放大 64px 渲染证据见 `evidence/bf047-tab-icon-render.png`（图标原件另存 `evidence/bf047-favicon-owner.png`）。

## 四、观察与边界（未改，供 Owner 定夺）

1. Owner 的图标为 1024×1024（约 152KB），按「以我放的为准」原样直接引用；浏览器会缓存，但每次新会话首访会下载该体积。**如需更轻**，可降采样为 32/48 与 180 三张并保留原图作源（等 Owner 一句话即可）。
2. 动态菜单页（如「我发起的」）的标题取自**菜单节点标题**（服务端数据）——界面语言切到英文时该标题不随语言变化；静态页（系统管理/流程管理…）已随语言切换刷新（`watch(i18n.global.locale)`）。
3. `/workflow/catalog` 在管理端属于「流程管理」子项、在工作台外壳是一级入口「流程中心」，本批按**工作台一级入口**处理（显示「流程中心」）；如与预期不符可调整为「流程管理」。

## 五、提交

- Web：codex/bugfix-20261013（本批提交，含 `index.html`、`public/`、`src/router/page-title.ts(.spec.ts)`、`src/main.ts`）。
- 根仓：台账 BF20261013-047 行 + 本回执 + 证据索引。

## 六、状态

**待 Owner 点验**：换几个页面看页签标题是否按一级功能显示、页签图标是否为新 logo；若某页一级归属需调整（例如 /workflow/catalog 显示「流程中心」还是「流程管理」），点出页面即可。

## 补记（Owner 2026-10-15 追加两条，同日完成）

### 1. 小图多尺寸（Owner：「可以，帮我处理一下搞个小图」）

- `public/favicon.png`（Owner 主图 1024×1024）保留为**源**，页面不再直接引用；
- 由它派生：`public/favicon-32.png`（32×32，1.7KB）、`public/favicon-48.png`（48×48，2.7KB）、`public/apple-touch-icon.png`（180×180）；
- `index.html` 改为按 sizes 声明：`icon sizes="32x32"` + `icon sizes="48x48"` + `apple-touch-icon`（主图留作源，附再生成说明注释）。
- 实测：三个文件 HTTP 200 / image/png（1682B / 2675B / 16126B），页签等效 16px 与 32/48 渲染一致（evidence/bf047-tab-icon-sizes.png）。

### 2. 名字随「进入控制台」：后台进=管理，前台进/直接链入=中心（用户视角）

Owner 口径：*「需要区分是中心还是管理，如果是从后台进的该是管理就是管理，前台进的该是中心就是中心」*、*「可以给默认用户视角，比如是从链接直接进的详情，那直接展示用户视角信息，如果是明确从管理后台进的详情，那就得展示后台」*。

实现（`src/router/page-title.ts` 增加「进入控制台」状态，`main.ts` 每次导航推进）：

| 情形 | 规则 | 页签示例 |
|---|---|---|
| 直接链入（收藏/粘贴链接，冷启动） | 默认**前台** = 用户视角 | `/workflow/catalog` → 流程中心 |
| 从工作台点入 | 保持前台 | 工作台点「流程中心」 → 流程中心 |
| 从管理端点入**双入口页**（流程中心/待办任务/我发起的/我的草稿/我的已办/抄送我的/任务详情/表单填报） | 保持**后台** = 管理命名 | 管理端 → 流程中心 → **流程管理** |
| 管理端页面本身 | 后台 | `/workflow/defs` → 流程管理 |
| 回纯前台页（工作台/我的门户） | 回前台 | `/workspace` → 工作台 |

- 双入口集合按当前菜单数据：前台可达、且后台「流程管理」分组里也有（含任务详情/表单填报深链）。
- 实景核对：直接链入 `/workflow/catalog` = 流程中心；`/workspace` → 点「流程中心」 = 流程中心；`/workflow/defs` = 流程管理。
- **未实景的一面（如实登记）**：管理端侧栏按区域过滤后不含前台页，且当前环境无任务/通知深链可从后台点入，所以「后台进入双入口页 → 流程管理」这条只能由单测覆盖（`nextConsole` 保持后台 + 后台命名断言，共 4 条）。
- 单测：`page-title.spec.ts` 扩到 **9 例**；四门 lint 0e/3w、typecheck 0、全量 vitest **1531** 通过 3 跳过、build ✓。

### 3. 边界（需 Owner 定夺）

导航外壳（顶栏/侧栏的投影）仍按**页面归属**（path-based）切换——即：在管理端点「流程中心」后，页签按「流程管理」命名（已按你的口径），但顶栏/侧栏会切成工作台那套。如果你要的是「从后台进详情时整个界面都保持管理端样式」，那是区域模型层面的改动，需另开一项再做。
