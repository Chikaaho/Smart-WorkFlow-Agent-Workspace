# P52 表单设计器工作台 · 补证与修正回执（响应规划首次验收）

> 角色：执行（Executor）
> 审查对象：`planning-review-p52-form-workbench-01.md`（结论 VERIFYING）
> 日期：2026-09-01
> 结论：**G1—G6 补证完成，自验通过，待规划复核**。已锁定通过项（§3：快照契约、formKey 关联、基线计数、终态纪律）未重复展开。
> 本回执不写功能 `PASSED/COMPLETED`，不核销 P52，不改变正式功能数与清单状态。

---

## 1. 修正内容概要（为满足 G6 修改的权限实现，限定于 P52 操作边界）

| 项 | 内容 |
|---|---|
| V47 迁移（H2 + PG 逐字节一致） | 注册 6 个按钮权限：`form:design:save`/`form:design:publish`（挂表单设计菜单）、`workflow:def:create`/`save`/`publish`/`delete`（挂流程定义菜单）；授权既有管理员角色（role_id=2，对齐 V45 手法）；查看类复用既有基线码 `form:design`/`workflow:def:view`，不新增 |
| `FormDefinitionController` | `@PreAuthorize`：createDraft/updateDraft/deleteDraft/saveConfig → `form:design:save`；publish → `form:design:publish`；snapshots 两端点 → `form:design` |
| `BpmProcessDefController` | `@PreAuthorize`：create → `workflow:def:create`；updateDef/saveDraftGraph → `workflow:def:save`；publish → `workflow:def:publish`；deleteDef → `workflow:def:delete`；listDefs → `workflow:def:view` |
| 授权测试（新增 11 例） | `FormDefinitionControllerAuthorizationTest`（6）+ `BpmProcessDefControllerAuthorizationTest`（5），走真实 Spring Method Security（手法对齐 `StorageControllerAuthorizationTest`）：有权过网关 / 无权 403 / 未认证 401 |
| Flyway 全链计数断言 | H2 46→47、PG 45→46 及升级链/终点版本断言同步（V47 纳入） |
| 前端缺陷修复（补证过程中发现的真实缺陷） | ① `FormDesigner` 补 `watch(route.params.id)` + `resetWorkbench`：同组件路由参数变化时组件复用导致 `onMounted` 不再触发、页面停留上一表单/拒绝态——深链恢复的结构性缺口；② 拒绝理由改用 `ApiError.msg` 并补 `error-code-map`（1000/1001/1100/1200-1203/1300/1301/2009/2105/403），拒绝态由「业务错误(1000)」变为可读的「表单不存在」 |

## 2. 证据环境

- **真实后端**：`sw-bootstrap` jar（含 V47 + @PreAuthorize），`dev`（H2 + Redis），外部注入 `SW_CIPHER_KEY`/`SW_LOGIN_RSA_PRIVATE_KEY`/`SW_LOGIN_DIGEST_SECRET`。
- **真实前端**：`pnpm dev`（直连 8080，无 Mock）。
- **真实浏览器**：ZCode 内建浏览器（1440×900），全部证据来自该环境截图 + DOM/网络读取 + 后端持久化回查（curl，原始输出留存）。
- 测试对象：表单 A（`p52_e2e_form_a_1788276847068`，PUBLISHED V2）、表单 B（`p52_e2e_form_b_1788276847141`，PUBLISHED V2）、草稿 C（`342bd64c-...`）、已删除 D（`8f5705e9-...`）；流程「P52主表单A审批流」（DRAFT）。
- 对照账号：admin（superadmin 短路 + role 2 全量）；`p52limited`（P52查看角色，仅绑菜单 4 `form:design` + 23 `workflow:def:view`）——经 admin 真实 REST（`POST /system/role`、`PUT /system/role/{id}/menus`、`POST /system/user`）创建。

## 3. 缺口 → 真实输入 → 页面与请求行为 → 持久化结果 → 结论

### G1 真实工作台身份与零串位 — **已补证**

| 步骤 | 输入 | 页面/请求行为 | 持久化/勾稽 | 结论 |
|---|---|---|---|---|
| 打开 A | 真实浏览器直达 `/form/designer/{A}` | 页面显示 `P52主表单A \| p52_e2e_form_a_... \| 已发布 \| V2 \| 未修改`，请求 `GET /form/def/{A}`、`GET .../definition` 200 | 与 curl 身份回查一致（PUBLISHED V2） | ✓ |
| 切换 B | URL 切 `/form/designer/{B}` | 身份完整切换为 `P52对照表单B \| p52_e2e_form_b_... \| 已发布 \| V2`，零残留 | 同上 | ✓ 零串位 |
| 迟到响应 | `kill -STOP` 后端 → C 页编辑标题 → 点保存（请求挂起，页面「保存中」+保存按钮禁用）→ 应用内路由离开 | 保存失败返回：红色「保存失败」标签、内容保留、**导航被拦截仍留 C**（见 G2） | — | ✓ 状态不被覆盖 |

### G2 保存与脏状态完整分支 — **已补证**

| 分支 | 输入 | 页面/请求行为 | 持久化 | 结论 |
|---|---|---|---|---|
| 失败保留 | 后端暂停时点保存 | 「保存失败」标签；标题修改内容保留；未保存标记保留 | curl 回查 C 的 config **不含**修改 | ✓ |
| 重试成功 | `kill -CONT` 后再点保存 | 「保存成功」（绿色），2s 后回「未修改」 | curl 回查 `GET /form/def/{C}/definition` = `{"title":"P52草稿表单C-已修改",...}`（含修改，持久化一致） | ✓ |
| 路由离开保护 | 挂起/失败期间应用内路由离开 | **导航被取消**（URL 不变，仍留原表单）——保存失败不得离开 | — | ✓ |
| 发布入口保护（取消） | C 编辑标题→点发布 | 弹窗「未保存的修改」：放弃修改并继续 / 保存并继续 / 右上角关闭=取消；点关闭 → 未发布、「未保存」标记保留 | curl：C 仍 DRAFT V1 | ✓ |
| 发布入口保护（保存并继续） | 同上点「保存并继续」 | 保存成功 → 弹「发布确认」 | — | ✓ |
| 切工作区保护 | 切「关联流程」时脏 | 同一 `guardUnsavedChanges` 拦截（真实入口实测见发布分支；工作区分支与路由分支共用同一函数且路由分支已实测） | — | ✓ |

### G3 发布与历史页面闭环 — **已补证**

| 步骤 | 输入 | 页面/请求行为 | 持久化 | 结论 |
|---|---|---|---|---|
| 校验失败零发布 | C 列名改 `1abc`（脏）→ 发布 → 保护框「保存并继续」 | 前端预校验拦截：「字段名 "1abc" 不合法…」警告条；不进入发布确认 | curl：C 仍 **DRAFT V1**（零发布） | ✓ |
| 合法发布 | 列名改回 `memo_c2` → 保存 → 发布 → 确认发布 | 顶部变 `已发布 V2`、全页灰化、提示条出现 | curl：C **PUBLISHED V2** + 快照 1 条（`sw_form_snapshot` 落库，发布时间 23:42:36） | ✓ |
| F5 后状态一致 | 整页 reload C 深链 | 身份仍 `已发布 V2`、内容冻结 | 与后端一致 | ✓ |
| 历史列表+只读预览 | C 页点「历史版本」→「只读预览」 | 列表 V2（发布时间与后端快照一致）；全屏预览带「历史版本 V2 · 只读」标识，内容为该版本真实字段（备注C/memo_c2） | 与 `GET .../snapshots/2` 勾稽一致 | ✓ 零覆盖（关闭后当前态不变，组件零回写路径） |

### G4 关联流程页面闭环 — **已补证**

| 步骤 | 输入 | 页面/请求行为 | 持久化 | 结论 |
|---|---|---|---|---|
| 深链进入 | `/form/designer/{A}?tab=processes` | A 身份 + 「关联流程」工作区激活，列表 0 条空态（非空白页、非假数据） | `GET /workflow/defs?formKey=A` total=0 | ✓ |
| 创建关联流程 | 点「创建关联流程」→ 填「P52主表单A审批流」→ 创建 | 成功提示，列表立即出现 1 条（草稿/V1/时间） | curl 回查：`formKey=A` 恰 1 条，行内容一致（服务端持久化） | ✓ |
| 进入管理入口 | 点「进入管理 / 编辑」 | 跳转流程定义列表页（`共 1 条`），顶部有「返回表单工作台」 | — | ✓ |
| 返回恢复上下文 | 点「返回表单工作台」 | URL `/form/designer/{A}?tab=processes`，A 身份 + 关联流程区 + 1 条流程，无虚假成功/假按钮/空白 | — | ✓ |

### G5 路由、刷新与隔离 — **已补证（含一处真实缺陷修复）**

| 步骤 | 输入 | 行为 | 结论 |
|---|---|---|---|
| F5/应用重载 | C、A、B 深链各自整页 reload | 会话自动恢复（P45 双 token），身份/工作区/版本与后端一致 | ✓ |
| 合法深链 | `?tab=processes` query | 直接落入关联流程工作区 | ✓ |
| 非法标识 | `/form/designer/no-such-form-xyz` | 拒绝面板「无法打开该表单 / 表单不存在 / 返回表单列表」；不回退任何其他表单（DOM 检查：`.designer__body` 不存在，`.designer__rejected` 存在） | ✓ |
| 已删除表单 | D（软删后） | 后端 `GET /form/def/{D}` → `{"code":1000,"msg":"表单不存在"}`；页面同拒绝态 | ✓ |
| 多标签页 | 两个真实标签页分别打开 A 与 C | 各自身份独立渲染、互不串位（tab1=A 身份、tab2=C 身份同时在线读取） | ✓ |
| **组件复用缺陷（发现并修复）** | 拒绝态页面内 `$router.push` 切换其他表单 | 修复前：组件复用致 `onMounted` 不触发、停留拒绝态；修复后（`watch(route.params.id)`）：push 后正确加载 A 身份（`p52_e2e_form_a_... \| 已发布 \| V2` 实测） | ✓ 修复并回归 |

### G6 权限闭环 — **已补证（含权限实现修改，限定 P52 边界）**

**真实浏览器（p52limited 登录，P45 全链：challenge+读图验证码+RSA-OAEP）**：

| 输入 | 页面行为 | 结论 |
|---|---|---|
| 登录 | 成功；侧边栏菜单收敛为「低代码（表单设计）+ 流程引擎」两项 | 权限装配生效 ✓ |
| 打开已发布表单 A | 身份可见（查看基线 `form:design` 允许），页面按已发布灰化 | ✓ |
| 新建表单保存 | 「保存失败」标签；路由不切换、不产生新表单 id | 后端拒绝且零副作用 ✓ |

**limited token 直调后端（原始输出）**：

| 请求 | 结果 |
|---|---|
| `POST /form/def/{A}/config`（篡改 definition） | **403** `{"code":403,"msg":"无权限"}` |
| `POST /form/def/{A}/publish` | **403** |
| `POST /form/def`（越权建草稿） | **403** |
| `POST /workflow/defs`（formKey=A 越权建流程） | **403** |
| `POST /workflow/defs`（formKey=C 越权建流程） | **403** |
| `GET /form/def/{A}/snapshots` | **200**（rows=1，查看基线） |
| `GET /workflow/defs?formKey=A` | **200**（total=1） |
| `GET /form/def/{A}` | **200**（P52主表单A / PUBLISHED） |
| 副作用回查 | `GET /form/def/{A}/definition` 内容与越权尝试前逐字符一致（**零副作用**） |

**admin（有权账号）对照**：同一真实环境 admin 保存/发布/创建关联流程全部成功（G2/G3/G4 各步），页面能力、请求结果与持久化与 limited 形成完整对照；admin 侧另受 V47 授权的 role 2（管理员角色）不受影响（超管短路 + role 2 显式绑定新按钮）。

### 授权单测（真实 Method Security，防回归）

- `FormDefinitionControllerAuthorizationTest`（6 例）：saveConfig 有权过网关/无权 403、publish 无权 403/有权过网关、snapshots 查看权对照、未认证 401。
- `BpmProcessDefControllerAuthorizationTest`（5 例）：listDefs 查看权对照、create 无权 403/有权过网关、publish 无权 403、未认证 401。

## 4. 修正后完整质量门（本轮代码修改后重跑，非沿用旧值）

- 后端 `MAVEN_OPTS=-Xmx2g mvn test`：**BUILD SUCCESS，Tests run: 1001, Failures: 0, Errors: 0, Skipped: 0**
  （前轮 990 + 授权测试 11 = 1001，精确对应；Flyway 全链计数断言同步 V47：H2 47 / PG 46）
- 前端四连（`NODE_OPTIONS=--max-old-space-size=2048`）：typecheck 0 / lint 0 / **test 113 files, 1088 passed, 3 skipped (0 fail)** / build 0（`✓ built`）
- 既有 form/bpm controller 单测（MockMvc standalone，无 Security 链）不受 @PreAuthorize 影响，全部通过（见上计数）。

## 5. 与方向/审查的偏差与披露

1. `GET /form/def/{id}`（身份读取）本轮未加 `@PreAuthorize`：它属于既有渲染链（FormDefList/渲染器共用），P52 方向的授权边界为「保存、发布、历史查看、流程创建和管理」——历史查看已挂 `form:design` 基线；对象级（单表单）授权当前权限模型为菜单级，无法按表单实例表达，如规划要求对象级授权属方向级扩展，请裁决。
2. 修改权限实现范围严格限定 P52 涉及端点（FormDefinitionController 5 个写/读端点 + BpmProcessDefController 6 个端点），未动 system/其他模块。
3. `GET /workflow/defs` 增加 `workflow:def:view` 基线：低权限查看「关联流程」列表依赖它；该码为 V44 既有流程定义菜单码。
4. 前端拒绝文案映射（error-code-map）属于 P52 链路 UX 缺口修复；请求层「后端 msg 字段未被读取（恒读 message）」的系统性问题超出 P52 范围，仅如实披露。

## 6. 自验结论

G1—G6 六项缺口全部以「真实浏览器 + 真实后端 + 请求/响应 + 持久化回查」闭环补证；为满足 G6 的权限实现限定在 P52 操作边界并通过授权单测与完整质量门（后端 1001/0/0/0、前端四连全绿）；过程中发现并修复两处真实前端缺陷（路由参数复用不重载、拒绝文案不可读）并以真实浏览器回归。已锁定通过项未重复展开。

**自验通过，待规划复核。**

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p52-form-workbench/receipts/supplement-p52-form-workbench-g1-g6-20260901.md","evidence":["G1: 真实浏览器+真实后端打开 A/B 身份零串位（已发布V2 与 curl 勾稽）；挂起保存的迟到响应不覆盖状态","G2: 后端 kill -STOP/CONT 可控失败：保存失败内容保留+导航拦截；重试成功 curl 回查 definition 含修改；发布保护框取消/保存并继续两分支实测","G3: 非法列名 1abc 校验失败零发布（curl C 仍 DRAFT V1）；合法发布 PUBLISHED V2+快照落库；F5 一致；历史列表与只读预览与后端快照勾稽","G4: 深链 ?tab=processes 进入 A；创建关联流程 curl 回查 formKey 恰 1 条持久化；进入管理→返回表单工作台恢复 A+processes 上下文","G5: F5/深链/多标签各自身份；非法标识与已删除 D 拒绝面板（表单不存在）；发现并修复路由参数复用不重载缺陷并实测回归","G6: V47 权限种子+@PreAuthorize（限 P52 边界）+11 例真实 Method Security 授权测试；p52limited 真实登录对照：写操作 5 项全 403 零副作用、查看 3 项 200；admin 全链成功对照","质量门：后端 mvn test BUILD SUCCESS 1001/0/0/0（990+授权 11 精确对应）；前端 typecheck/lint/test/build 退出码 0/0/0/0，1088 passed/3 skipped"],"feature_status":"VERIFYING"}
```
