# 用户端应用中心入口缺失修复执行回执（user-entry-fix-01）

2026-10-16｜Executor｜L｜交付修复（新增业务功能 0）

- 入口方向：`product/0.1.6-release/ready/direction-release-016-user-entry-fix.md`（Owner 验收不通过退回；规划复核 `receipts/planning-review-release-016-02-user-entry-failed.md`）
- 前态回执：`product/0.1.6-release/receipts/release-016-02.md`（原文保留未改；其发布/部署事实沿用，用户端交付验收按本回执重开结果）
- 原型：Owner 2026-10-16 提供的两图（图1 应用中心列表、图2 应用内页），已按原型实现
- 证据目录（本机留存，gitignored）：`product/0.1.6-release/receipts/evidence/user-entry-fix/`
- 原发布任务五阶段：前三阶段完成；第四阶段发布事实保留、**用户端交付验收按本轮结果重开**；第五阶段终审同步未完成

## 1. 一句话结论

`/workspace` 顶栏缺失入口的根因是**用户端主导航默认派生清单未包含应用中心**（不是权限、不是缓存、也不是部署版本问题）；已在 `feature/application-center-user-entry`（从 develop 新建）修复顶栏入口，并按 Owner 原型补齐应用中心列表页（搜索应用 + 每行数量设置）与应用内页（左侧目录/表单导航 + 右侧内联数据列表 + 表头设置）；本地隔离环境与最终交付环境（chikaho.cn）均已按四项复验条件实测通过，普通用户权限在隔离环境实测（UAT 无普通身份，缺口如实登记）。

## 2. 根因与复现

### 2.1 复现（修复前，同一构建逻辑）

- 本地隔离环境以系统管理员身份打开 `/workspace`，中文顶栏 = **工作台 / 我的门户 / 流程中心**（与 Owner 截图一致，无「应用中心」）：`evidence/user-entry-fix/local-01-pre-fix-zh-workspace-topnav.png`。
- 交付环境（chikaho.cn）当前部署的前端**就是已发布 0.1.6 制品**：发布资产 `sw-web-dist-0.1.6.zip`（sha256 `c6f17308…`）解包后 `dist/index.html` sha256 = `56407dfcbc62110cdcae92907c46cda56b6a9cb255592fbac39e5f0810396420`，与 UAT `/opt/smart-workflow/web/index.html` 完全一致（`uat-precheck.log`）。

### 2.2 根因

| 层 | 事实 | 判定 |
|---|---|---|
| 前端顶栏 | `src/layouts/AppMainNav.vue` 门户分支默认派生只有「工作台（常量）+ 我的门户（常量）+ 菜单树中存在的流程中心」；服务端不下发 `topbar` 投影（服务端无该字段），故该分支恒走默认派生 | **主因**：用户端顶栏清单缺项 |
| 路由 | `/form/app-center`、`/form/app-center/:appId`、`/form/app-form/:formKey` 均已注册为**静态路由**，无 `authority` 声明，`resolveArea` 归门户区 | 非路由缺失 |
| 权限 | 页面与接口只要求登录态；应用可见范围、表单/数据权限由服务端过滤（`/form/app/center/apps`、`/form/center/apps/{id}`、`/form/data/{key}/query` 无后台管理权限要求） | 非权限缺失 |
| 菜单 | 应用中心菜单行（id 9131，父级=表单管理）默认只授予管理员/超管角色，普通用户菜单树里没有该行；侧栏因此只在管理端可见 | 解释了「只有 Form management 侧栏入口」 |
| 部署 | UAT 前端 = 0.1.6 正式制品；后端 jar 内嵌 `sw-common-0.1.6`、库内 versioned 终点单条 0.1.6 | 非部署/版本问题 |

- 结论口径：入口缺失是**用户端主导航清单缺项**；同时说明「不能靠后台菜单授权补齐」——普通用户不应被要求具备后台表单管理权限才能使用已授权应用（方向 §修复目标）。

## 3. 改动（分支、提交、范围）

| 仓库 | 分支（从 develop `55c3d39` 新建） | 提交 | 内容 |
|---|---|---|---|
| Web | `feature/application-center-user-entry` | `c3cd686`（fix(layout)） | 用户端顶栏常驻「应用中心」入口：与工作台/我的门户/流程中心同级；服务端下发顶栏投影时同样补齐并按目标路径去重；选中态覆盖应用内容与表单数据列表深链；入口只依赖登录态与用户端区域 |
| Web | 同上 | `f9798cd`（feat(app-center)） | 按原型实现：列表页搜索应用 + 每行应用数量设置（本机偏好）；应用内页左侧目录/表单导航 + 右侧内联数据列表（选中表单写入路由 query、刷新保持、保留返回应用中心）；数据列表表头设置（展示列与顺序，本机偏好，至少保留一列） |

- 文件：`src/layouts/AppMainNav.vue`、`src/modules/form/views/AppCenter.vue`、`AppCenterDetail.vue`、`AppFormData.vue`、`src/locales/{zh-CN,en-US}.ts`、单测 `AppMainNav.spec.ts`（新增）、`AppCenterDetail.spec.ts`（新增）、`AppCenter.spec.ts`、`AppFormData.spec.ts`。
- 远端回读：`git ls-remote origin feature/application-center-user-entry` = `f9798cd7510a429104167f69034cf84933b23823`；工作树干净；未强推、未改写历史、未新增/移动标签。
- 未触碰：ESLint/构建工程配置（无需变更）、后端仓库、0.1.6 标签与制品、数据库。
- 原型对照：图1（顶栏应用中心 + 搜索应用 + 每行数量设置 + 卡片网格）、图2（左侧目录/表单导航 + 搜索/表头设置/数据列表/分页）均已落位；图1 第二项原型写作「门户」，本系统既有文案为「我的门户」，本轮不改既有命名（差异登记，见 §6）。

## 4. 四项复验条件（实际结果）

### 4.1 条件1：用户可见浏览器从 /workspace 点击进入并刷新可用

| 环境 | 身份 | 结果 | 证据 |
|---|---|---|---|
| 本地隔离环境（`http://localhost:5173`） | 系统管理员（dev 调试身份） | 中文顶栏 = 工作台/我的门户/流程中心/**应用中心**；点击进入 `/form/app-center` 且顶栏保持选中；刷新后入口与选中态仍在 | `local-02-post-fix-zh-workspace-topnav.png`、`local-03-app-center-from-nav.png` |
| **最终交付环境 `https://chikaho.cn`** | 系统管理员（既有会话，未回登录页） | 中文顶栏 = 工作台/我的门户/流程中心/**应用中心**；点击进入 `/form/app-center`；`?formKey=` 深链刷新后选中表单与顶栏选中态保持 | `uat-01-workspace-topnav-zh-app-center.png`、`uat-03-app-inner-after-refresh.png`、`uat-04-app-center-list.png` |

- 英文标题同源核对：同一构建英文文案为 `App center`（`en-US.ts`），修复后在 UAT 英文界面实测顶栏第 4 项为 `App center`。
- 会话/缓存口径（不预设为浏览器缓存）：入口为前端常量派生，**不依赖会话菜单更新**，已登录会话刷新即生效；`index.html` 无 `Cache-Control`/`Expires`（仅 ETag/Last-Modified 协商缓存），资源文件名按内容哈希，部署后新入口随新 index.html 生效（`uat-nginx-cache.log`、`uat-deploy.log` 内服务端与域名侧 index.html 哈希一致）。

### 4.2 条件2：进入应用 → 目录/表单 → 数据列表，数据与表单一致

- UAT（真实生产数据）：应用「测试」→ 左侧目录/表单导航（未命名表单、请假申请）→ 默认选中「未命名表单」显示其真实记录（物料 M-001、可用量 70、预占量 0）；切换「请假申请」后列集合与记录随之切换（回家，886，2026-10-15 创建）→ `uat-02-app-inner-tree-datalist.png`、`uat-03-app-inner-after-refresh.png`。
- 本地隔离环境（新建配置）：应用「验收应用」→ 目录「验收目录」内「验收表单A」+ 应用内直接归属「验收表单B」→ 表单A 数据列表显示两条既有记录（管理端记录 + 普通用户本人记录）→ `local-04-app-inner-tree-and-datalist.png`。
- 入口证据均为**从 /workspace 点击进入**，未以深链接替代。

### 4.3 条件3：普通用户（无后台管理权限）可用与范围外拒绝

隔离验证环境：本地新建临时用户 `entryvisitor`（id `2110963056003059714`，角色 `entry_visitor`，数据范围=仅本人，仅授予流程中心 + 表单数据查询/提交；**不含** `form:app:manage`，**不含**应用中心菜单行 9131）：

| 项 | 结果 | 证据 |
|---|---|---|
| 入口可用 | 顶栏仍显示「应用中心」（侧栏无表单管理/应用中心等后台入口，证明其无后台管理权限） | `local-06-visitor-app-tree-datalist.png` |
| 允许应用可见 | 应用中心只显示「验收应用」；「受限应用」（可见范围=指定 admin）不出现 | 同上 |
| 范围外应用拒绝 | 深链 `/form/app-center/14630301…`（受限应用）→ 页面显示「应用不存在或不可见」，无内容下发 | `local-06` 同轮记录 |
| 数据按权限 | 表单A 数据列表仅返回本人 1 条记录（管理端记录不可见）；行操作仅「查看」（无编辑权限） | 同上 |
| 服务端口径 | 未绕过守卫：页面/接口仍由服务端按可见范围与数据范围过滤（本地 API 实测同口径） | `local-06` 同轮记录 |

- **UAT 缺口（如实登记）**：交付环境仅存在 `admin`（超管）身份，角色仅超管/管理员；创建临时普通账号属 UAT 真实权限与账号变更，按方向「缺少权限时报告具体缺口」**未执行、也未以管理员视角冒充普通用户**（`uat-readback.log`）。若 Owner 需要 UAT 侧同口径对照，请授权在该环境建受限测试身份。

### 4.4 条件4：受影响导航/权限/布局最小回归 + 前端门禁

```
pnpm typecheck → 0（exit 0）
pnpm lint      → 0 error / 3 warning（全部为既有组件告警，无新增）
pnpm test      → 171 文件通过 + 1 跳过；1563 用例通过 / 3 跳过 / 0 失败（较 0.1.6 基线 1549+3 净增 14 条，均为本轮新增单测）
pnpm build     → exit 0（built in 2.77s）
```
- 原始输出：`web-typecheck.log`、`web-lint.log`、`web-test.log`、`web-build.log`。
- 未重跑已锁定种子迁移与后端设施全套（方向明确不要求）；后端本轮零改动。
- 布局最小回归：1280×720 与 1024×768 下应用内页双栏、顶栏四项、无横向溢出（`local-06` 同轮实测）。

## 5. 构建与部署来源（候选验证与实际部署分列）

| 列 | 内容 |
|---|---|
| 修复候选 | 提交 `f9798cd`；`dist/index.html` sha256 `8853312f0739e7024a46696be3c1fa2cf6f1af30a8dd5f191a4eaf553654f389`；入口资源 `assets/index-Bpn4qGMQ.js`；打包 `/tmp/sw-web-entryfix-f9798cd.zip`（sha256 `d8f1c591de538ce2757c3e7e9d2da339a45c439a18b25ead1e183eed7a410967`，1,335,285 B） |
| 实际部署 | 经 `~/ssh/ssh/{ssh,scp}_personal.sh` 上传（服务端回读 sha256 一致）→ 备份 `mv /opt/smart-workflow/web /opt/smart-workflow/web.bak-entryfix-20261016_1352` → `mv web.new web` → `chown` → `nginx -t`（ok）→ `nginx -s reload`（OK）；线上 `https://chikaho.cn/` = 200，服务端与域名侧 index.html 哈希均 = `8853312f…` |
| 回滚入口 | `mv /opt/smart-workflow/web /opt/smart-workflow/web.rollback-tmp && mv /opt/smart-workflow/web.bak-entryfix-20261016_1352 /opt/smart-workflow/web && nginx -s reload`（备份目录即 0.1.6 正式制品内容） |
| 未变更 | 后端 `bootstrap.jar` 仍含 `sw-common-0.1.6`；库内 versioned 终点仍为单条 0.1.6（checksum `-1768731444`）；健康 `200`；0.1.6 tag/Release/制品未覆盖未移动 |
| 兼容性依据 | 本轮仅前端静态与既有接口（`/form/app/center/**`、`/form/data/{key}/query` 等），未新增后端接口或迁移；部署环境后端版本无需变更 |

## 6. 版本、开放项与风险

1. **版本口径**：修复提交在 `feature/application-center-user-entry`（未合入 develop/main、未建标签）；已公开 0.1.6 制品与标签保持原样；当前 UAT 运行事实 = **后端 0.1.6 正式制品 + 前端交付修复候选（`f9798cd`）**，两者身份分列、可回读。是否为新正式版本（如 0.1.7）以把修复纳入正式制品，**待 Owner 确认**；确认前不自行选版本、不冒充 0.1.6 产物。
2. **UAT 普通身份缺口**：见 §4.3，需 Owner 授权后方可补做交付环境同口径对照。
3. **表头设置/每行数量为本机个人偏好**（localStorage，不落服务端）：跨浏览器/换设备不共享；如需服务端持久化个人视图，属新需求。
4. **原型文案差异**：图1 顶栏第二项写作「门户」，系统既有文案为「我的门户」；本轮保持既有命名未改。
5. **数据列表宽表行为**：列数超过面板宽度时表格容器内横向滚动（既有列表口径），操作列固定，无布局破坏。
6. **未覆盖**：本轮未做移动端（≤767px）顶栏专项复验（既有设计在该断点隐藏顶栏导航，未受影响）。

## 7. 自验与唯一下一动作

- 自验：四项复验条件 3 项在最终交付环境实测通过、1 项（普通用户）在隔离环境实测通过并登记 UAT 缺口；前端四门禁全绿；两仓未受影响；发布事实未改动。
- 唯一下一动作：Owner/Planner 复核本回执与原型实现结果（UAT 已部署候选，可直接用中文界面从 /workspace 点击复验），并裁定是否需要新正式版本以纳入交付。

## 8. 设计修正轮（Owner 第二次退回，2026-10-16 14:10）

Owner 复核原型实现后指出两点：①应用中心不要侧边栏；②应用内侧边栏要全白底纹。已在同一分支修正并复验：

| 项 | 改动 | 复验（本地隔离环境 + UAT 实测） |
|---|---|---|
| 应用中心页面不渲染全局深色侧栏（顶栏全宽） | `src/layouts/BasicLayout.vue`：`/form/app-center*` 与 `/form/app-form/` 与 /portal、设计器同类，不渲染侧栏 | 列表页与应用内页 `basic-layout__aside` 计数=0；**工作台回归仍=1**（其余页面侧栏不变） |
| 应用内目录/表单侧栏全白底纹 | `src/modules/form/views/AppCenterDetail.vue`：`.app-tree` 背景 `#ffffff` | 计算样式 `rgb(255, 255, 255)`（本地与 UAT 一致） |

- 提交：`e5aa357`（远端回读 `e5aa3575bd18ba81b0f749b4ca5d60e34e89a393`）；门禁 typecheck 0／lint 0 error（3 既有 warning）／test 1563 通过+3 跳过／build 0。
- 候选与部署身份更新：zip sha256 `7963ade0768b08376677040205597d7d4cc7d0307ce802a687d8010cfa1dc3ce`；线上 `index.html` `858ffc22e7f341db1a183661b2d0fbc6ea166342c8765b6abb23849130af5ee5`，入口资源 `assets/index-BMLiWa_O.js`；本次替换前一候选（未新增备份），0.1.6 回滚入口仍为 `web.bak-entryfix-20261016_1352`；服务端与域名侧 index.html 哈希一致、健康 200、后端/库/标签制品未动。
- 证据：`evidence/user-entry-fix/local-07-app-inner-no-global-sidebar-white-tree.png`、`uat-05-app-center-no-global-sidebar.png`、`uat-06-app-inner-white-tree-no-sidebar.png`（`uat-deploy.log` 含本轮上传/替换/reload 回读）。
