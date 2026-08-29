# 完成回执 · 最小闭环第一轮验收

> 会话角色：执行（Executor，工作区根入口）
> 依据方向：`product/minimal-closure-first-acceptance/ready/direction-minimal-closure-first-acceptance.md`
> 日期：2026-08-29
> 性质：现有能力验收审计（不修改业务代码、不新增正式功能、不改变任何计数/终态）
> 自验结论：**FAILED**（自验通过·待规划验收 → 不成立；本轮判定为「自验未通过·提交规划裁决」：七项中两项必验能力在真实页面链路上缺失，且存在页面伪装成功行为）

---

## 一、验收环境与执行方式

| 项 | 值 |
|---|---|
| 后端 | `Smart-WorkFlow/` sw-bootstrap，dev profile（H2 内存），端口 8080，context `/api`，会话开始前已在运行（`ps` 快照含 `sw-bootstrap/target/classes` 启动进程） |
| 前端 | `Smart-WorkFlow-Web/` `pnpm dev`（真实后端模式，非 Mock），VITE v8.1.0，端口 5173，本轮由本会话启动（`/tmp/swf-web-dev.log`） |
| 浏览器 | ZCode 内置浏览器（IAB），桌面视口 1440×900，真实 DOM 交互 + 截图 |
| 模式声明 | 真实 HTTP + 真实持久化链路；全程未使用 `pnpm dev:mock`；MSW 未启用 |
| 编译/测试命令 | 本轮未执行任何编译（验收审计不修改代码，无编译需求；未触碰前后端互斥） |

**管理员登录行为证据**：`curl -X POST http://localhost:8080/api/auth/login {"username":"admin","password":"admin123"}` → `{"code":0,"msg":"success","data":{"accessToken":"eyJ...","expiresIn":"900"}}`（HTTP 200）。业务用户 `accuser01` 同样以真实登录接口取证（见 §三.1）。

**本轮唯一验收数据**（全部为本轮新建，可复现关联）：

- 组织：`验收一部门`（编码 `acc-dept-01`，根部门子节点，后编辑改名为 `验收一部门`→`验收一部门`（编辑动作验证名改为 `验收一部门`，见 §三.2 说明）
- 角色：`验收业务角色`（编码 `acc_biz`，勾选 低代码+全部子项+流程引擎 权限）
- 用户：`accuser01` / 姓名 `验收用户一` / 密码 `Acc@12345` / 部门 `验收一部门` / 角色 `验收业务角色`
- 表单：`验收申请表`（formKey=`验收申请表`，物理表 `sw_form_rn5c1y28g8`，字段 `field_1`/标签`申请事由`/必填，状态 PUBLISHED，formVersion=2）
- 业务数据：记录 ID `952bbde4-1256-4731-bbf7-fa991f446e3c`，字段值 `验收流转测试数据-20260829-01`

---

## 二、逐项验收结论总表

| # | 验收项 | 判定 | 关键依据 |
|---|--------|------|----------|
| 1 | 用户管理 | **PASSED** | 真实页面查/建/编/关联/回查/登录一致（§三.1） |
| 2 | 组织管理 | **PASSED** | 树查看、新建子部门、编辑保存、刷新一致（§三.2） |
| 3 | 角色管理 | **PASSED**（附缺陷 D-01） | 建/编/权限树/分配生效；路由层拒绝 + 后端 403 双重取证（§三.3） |
| 4 | 表单管理与数据展示 | **PASSED**（附缺陷 D-02/D-03） | 设计器建单字段表单→发布→业务用户真实提交→列表/详情/刷新展示真实数据（§三.4） |
| 5 | 流程管理 | **FAILED** | 真实模式无任何页面可创建/编辑/绑定/发布流程：`/workflow` 白屏、`/workflow/defs` 404（§三.5） |
| 6 | 简单流程流转 | **FAILED** | 提交表单未真实创建流程实例（两账号实例/待办均 0），页面却硬编码提示“流程已发起”；待办页 404，审批无法从页面完成（§三.6） |
| 7 | 页面质量 | **FAILED**（受 #5/#6 阻断项影响） | `/workflow` 白屏属阻断；另有非阻断展示缺陷 D-04/D-05（§三.7） |

**总体判定：FAILED。** 命中方向 §八 FAILED 条款：必验能力（流程管理页面链路）缺失、真实状态不一致（提交无实例却提示已发起）、存在阻断使用的明显页面问题（`/workflow` 白屏）。产品缺陷按方向要求只记录定级，未顺手修复。

---

## 三、逐项行为证据

### 3.1 用户管理 — PASSED

- 页面链：菜单 `系统管理→用户管理` → 路由 `/user`，列表渲染真实后端数据（共 2 条：admin、tooluser）。
- 新建：`新建用户` 对话框真实填写 → 保存 → `创建成功` alert → 列表出现 `accuser01` 行（共 3 条记录时回查）。
- 关联：部门下拉树选择 `验收一部门`；角色勾选 `验收业务角色`；保存成功。
- 刷新回查：浏览器 `reload()` 后重新打开 `编辑用户` 对话框——所属部门回显 `验收一部门`、`checkbox "验收业务角色" [checked]`（DOM 快照原文取证）。
- 登录一致：新标签页以 `accuser01/Acc@12345` 真实登录 → 跳转 `/workflow`，顶栏显示 `验收用户一`；`curl` 真实登录返回 accessToken（HTTP 200）。身份/组织/角色与管理端回查一致。

### 3.2 组织管理 — PASSED

- 页面链：`部门管理` → `/dept`，树显示 `根部门(root)`。
- 新建子部门：行内 `新建子部门` → 填 `验收一部`/`acc-dept-01` → `创建成功` → 树中根部门下出现该节点（带展开箭头）。
- 编辑：行内 `编辑` → 对话框回显正确 → 改名保存 → `创建成功`（编辑成功）alert → 列表更新。
- 观察项 D-05（非阻断）：编辑对话框「上级部门」回显原始 ID `1` 而非 `根部门`（名称映射缺失）。

### 3.3 角色管理 — PASSED（附缺陷 D-01）

- 新建：`新建角色` 对话框含权限树；勾选 `低代码`、`流程引擎` 两节点 → 保存 → 成功 → 列表出现 `验收业务角色/acc_biz`。
- 编辑：回显 `验收业务角色`/`acc_biz` 正确，保存成功。
- 权限持久化回查：重开编辑对话框，evaluate 读取权限树勾选态 → `低代码、低代码概览、表单设计、下载模板、数据导入、数据导出、流程引擎` 共 7 节点 `checked=true`。
- **路由层拒绝**：accuser01 会话直接访问 `http://localhost:5173/user` → 最终路由 `/404`（「页面不存在」），受限组件未挂载（快照无用户管理表格任何元素）。
- **后端拒绝**（真实 HTTP，同请求双账号对照）：
  - `POST /api/system/user/page?pageNum=1&pageSize=10`（Bearer accuser01 token）→ `{"code":403,"msg":"无权限"}`，HTTP 403
  - 同请求（Bearer admin token）→ HTTP 200
  - 权限点来源：`UserController.java:51-52` `@PostMapping("/page")` + `@PreAuthorize("@ss.hasPermi('system:user:list')")`
- **缺陷 D-01（中，非阻断主链）**：角色已授权「低代码」全子树，但 accuser01 登录后侧边栏菜单仅渲染 `流程引擎`。后端佐证：`GET /api/system/auth/menus`（accuser01）仅返回 `流程引擎|workflow` 一个节点；而角色-菜单回查（编辑对话框）7 节点均为 checked。授权与导航菜单不一致，授权用户无法从菜单进入低代码页面（直连 URL `/form/form-def-list` 可达且页面功能正常）。
- 观察项 D-06（非阻断）：角色管理多标签页会话串扰（见 §五.4）。

### 3.4 表单管理与数据展示 — PASSED（附观察项）

- 创建：`/form/form-def-list` → `新建表单` → 设计器 `/form/form-designer`：命名 `验收申请表`，拖拽（cua.drag 轨迹）`单行文本` 入画布，字段标签改 `申请事由`、必填开启。
- 保存/发布：`保存草稿` → `草稿已保存`，URL 携带 id `64ac4e26-0a3a-46ab-ba0c-1d37de68ea69`；`发布` → 确认对话框（“发布后表名/字段名冻结”）→ `确认发布` → `发布成功`。列表回查：`验收申请表 | 已发布`。
- 后端持久化：`GET /api/form/def/page`（admin）→ `formKey:"验收申请表", status:"PUBLISHED", physicalTableName:"sw_form_rn5c1y28g8", formVersion:2`（动态物理表真实创建，符合宽表约束）。
- 业务用户提交：accuser01 打开 `/form/form-render/验收申请表`（页面正常渲染必填项），填写 `验收流转测试数据-20260829-01` → `提交` → `表单提交成功，流程已发起` + `提交成功，记录 ID：952bbde4-1256-4731-bbf7-fa991f446e3c`。
- 数据展示与勾稽：`/form/form-data/验收申请表` 列表显示该记录（共 1 条）；`reload()` 刷新后数据仍在；`查看` → 只读详情页正确回显字段值（URL `form-render/…?recordId=952bbde4…&mode=view`）。非 Mock（MSW 未启用，数据来自 H2 真实表）。
- 观察项 D-02（低）：表单定义列表「业务标识」列显示与表单名称相同（`验收申请表`），formKey 实为中文串，业务标识语义弱化。
- 观察项 D-03（低）：accuser01 直连 `/form/form-def-list` 显示 `共 0 条记录`（看不到已发布表单），但 `/form/form-render/`、`/form/form-data/` 可正常访问，疑似列表接口过滤口径问题，未影响本轮主链。
- **注意**：「流程已发起」提示本身是缺陷（见 §3.6 D-07），但表单提交与数据展示能力本身真实可用，故本项判 PASSED。

### 3.5 流程管理 — FAILED

行为证据（全部为本轮真实页面/HTTP 取证）：

1. **`/workflow` 白屏**：管理员点击菜单 `流程引擎` → 路由 `/workflow`，`main` 区 DOM 为空（快照 `main:` 后无任何内容），截图确认为整块空白画布，无加载中、无报错提示、无内容。停留 >4s 不变。
2. **`/workflow/defs` 404**：直连 `http://localhost:5173/workflow/defs` → 最终路由 `/404`「页面不存在」。流程定义管理页（ProcessDefList.vue、CreateProcessDefDialog.vue 等组件存在于代码中）未注册任何真实路由。
3. **根因定位（结构证据，辅助）**：
   - 真实菜单种子 `sw-bootstrap/.../h2/V6__m_seam_menu_seed.sql:52`：`流程引擎` 为**叶子菜单**，component=`workflow/views/WorkflowHome`；
   - `WorkflowHome.vue` 内容为空占位：`// 目录重定向到第一个子页 /workflow/todo；本组件仅作 fallback` + `<div />`——但真实菜单下没有 todo 子页，重定向永不发生 → 白屏；
   - `/workflow/todo`、`/workflow/defs` 路由仅存在于 **Mock 菜单种子** `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts:409,422-423`；V6 之后所有迁移（V15/V26/V29/V33/V37/V38/V39/V43）均未补流程子菜单。
4. **后端 API 存在但无页面入口**：`GET /api/workflow/defs`（admin）→ HTTP 200 `{"records":[],"total":"0"}`（0 条流程定义）；`BpmProcessDefController` 提供创建/编辑/发布端点。即能力停留在 API 层，页面链路断裂。

对照方向 §二.5（创建/编辑/绑定表单/发布均要求“从真实页面”）——**全部无法完成，判定 FAILED**。

### 3.6 简单流程流转 — FAILED

1. 提交表单（见 §3.4）后页面提示「表单提交成功，流程已发起」，但：
   - `GET /api/workflow/instances`（admin 与 accuser01 分别查询）→ 均 `{"records":[],"total":"0"}` —— **未创建任何流程实例**；
   - `GET /api/workflow/tasks/todo`（admin 与 accuser01）→ 均 `{"records":[],"total":"0"}` —— **不存在任何待办**；
   - `GET /api/workflow/defs` → 0 条（系统内没有任何流程定义，提交也无从发起）。
2. **伪装成功（D-07，阻断级定性）**：`Smart-WorkFlow-Web/src/modules/form/views/FormRender.vue:291-309`——新建提交成功后**无条件**弹出「表单提交成功，流程已发起」（硬编码文案，与流程无关），并在 1.5s 后 `router.push({ name: 'TodoList' })`——该路由在真实模式未注册，跳转落空。命中方向 §三「接口失败不得被页面伪装为成功」的同类口径（无流程却报已发起）。
3. **待办页不可达**：直连 `/workflow/todo` → 404；已办页 `/workflow/processed` 可达（渲染“已办任务 共 0 条”），但页内「待办任务」按钮 `router.push({name:'TodoList'})` 点击后 URL 与页面均无变化（死按钮，真实点击取证）。
4. 结论：发起→待办→审批→结果勾稽的页面链路**无法走通**，判定 FAILED（产品缺陷，非环境阻塞）。

### 3.7 页面质量 — FAILED（受 #5/#6 阻断项影响；其余目标页面质量良好）

- 菜单可达性/路由/组件挂载：系统管理五页、表单三页、已办/监控页均正常（无白屏/404/循环跳转/持续加载）。
- 操作反馈：新建/编辑/发布/提交均有成功 alert。
- 数据一致性：表单数据刷新后与后端一致；用户-组织-角色关联刷新回查一致。
- 控制台：本轮主链操作未观察到页面报错弹层；无接口失败被伪装为成功的情况（除 D-07 反向伪装：成功但状态不实）。

---

## 四、缺陷表

| 编号 | 模块 | 复现入口 | 实际结果 | 期望结果 | 影响等级 | 阻断本轮 |
|------|------|----------|----------|----------|----------|----------|
| D-01 | 角色/菜单 | accuser01 登录看侧边栏；`GET /api/system/auth/menus` | 已授权「低代码」全子树，菜单仅返回/渲染 `流程引擎` | 授权菜单在导航生效 | 中 | 否（可直连 URL） |
| D-02 | 表单 | `/form/form-def-list` | 「业务标识」列显示表单名称（formKey=中文名） | 业务标识为稳定唯一 key 并正确展示 | 低 | 否 |
| D-03 | 表单 | accuser01 直连 `/form/form-def-list` | 共 0 条记录（看不到已发布表单） | 授权用户可见可提交的已发布表单 | 低 | 否 |
| D-04 | 字典 | `/dict` 列表 | 种子 status=0 的 6 条字典类型状态列全部显示「停用」 | 0=正常 | 低 | 否 |
| D-05 | 部门 | 部门编辑对话框 | 「上级部门」回显原始 ID `1` | 回显部门名称 | 低 | 否 |
| D-06 | 环境/会话 | IAB 双标签分别登录不同账号 | 后登录会话覆盖先登录标签的身份（token 纯内存、无存储同步代码，疑为 IAB 共享上下文所致） | 多标签会话相互隔离 | 低（疑似测试环境因素，非产品代码缺陷） | 否 |
| D-07 | 流程/表单 | 提交任意表单 | 无流程定义、无实例、无待办，页面仍提示「流程已发起」并跳转失效路由 | 真实创建实例或如实提示 | **高** | **是（#6 判 FAILED 的直接依据）** |
| D-08 | 流程 | 菜单「流程引擎」 | `/workflow` 白屏（WorkflowHome 空占位，无子菜单重定向） | 渲染流程工作台/待办 | **高** | **是** |
| D-09 | 流程 | 直连 `/workflow/defs`、`/workflow/todo` | 404（路由仅存在于 `foundation/mock/seeds.ts`，真实菜单种子 V6 无对应子菜单） | 真实模式可从页面管理流程定义、处理待办 | **高** | **是** |

---

## 五、其他记录

### 5.1 实际读取/触碰的文件（均只读，未修改任何业务/配置/迁移/测试文件）

- 方向文档、`system.md`、`roles/executor.md`、`.codex/governance/terminal-contract.json`
- 前端（只读定位根因）：`src/foundation/auth/token.ts`、`src/foundation/menu/index.ts`、`src/router/guard.ts`、`src/router/index.ts`、`src/foundation/mock/seeds.ts`、`src/modules/workflow/views/WorkflowHome.vue`、`ProcessedList.vue`、`src/modules/form/views/FormRender.vue`
- 后端（只读定位根因）：`sw-biz-system/.../UserController.java`、`AuthMeController.java`、`sw-bpm-process/.../Bpm*Controller.java`、`sw-biz-form/.../FormDefinitionController.java`、`sw-bootstrap/.../db/migration/h2/V2/V4/V6` 及迁移目录清单
- 全部为结构/根因辅助证据，行为证据以 §三命令与页面输出为准。

### 5.2 与方向的偏差

- 无范围偏差。补充说明：方向 §二.5「创建并编辑一个最小单节点审批流程」因页面链路断裂未能执行，属验收对象缺陷而非执行方式偏差；未以 API 直接造流程定义来“绕过页面完成流转”（方向 §八明令禁止以此判 PASSED）。

### 5.3 未完成内容与风险

- 表单 designer 中「占位提示/默认值」配置项页面标注“待契约扩展后接入（本刀不自造键）”——属既有声明未开放能力，不计缺陷。
- 部门改名历史：`验收一部`→`验收一部门`（编辑动作），后续关联回查均使用 `验收一部门`，数据勾稽无歧义。
- H2 内存库随本轮后端进程存续；若后端重启，本轮验收数据（组织/角色/用户/表单/记录）将清空，复验需重建（重建脚本化程度低，需注意）。
- 多标签会话串扰（D-06）导致中途一次角色页操作在错误身份下失败，已改用单标签顺序会话重做并取证，结论不受影响。

### 5.4 记忆更新草稿（仅供规划角色核对后落盘，不构成最终判定）

- state.md 新增行：最小闭环第一轮验收 | 真实链路审计：用户/组织/角色/表单通过，流程管理与简单流转页面链路缺失判 FAILED | 回执 `product/minimal-closure-first-acceptance/receipts/receipt-minimal-closure-first-acceptance-20260829.md` | 判定占位 PASSED（待编号）
- decisions.md：无新增
- issues.md：无新增（缺陷 D-01~D-09 已在本回执缺陷表登记，是否入 known-issues 由规划裁决）
- features.md：无变化

---

## 六、最终结论

**FAILED** —— 七项验收中：用户管理、组织管理、角色管理、表单管理与数据展示四项以本轮真实行为证据通过；流程管理、简单流程流转两项因真实模式下页面链路缺失（D-07/D-08/D-09）不通过；页面质量因 `/workflow` 白屏与伪装成功提示不通过。按方向 §八，产品缺陷不包装为环境阻塞，本轮不声明项目达到第一轮最小闭环验收标准，亦不修改任何正式功能终态。
