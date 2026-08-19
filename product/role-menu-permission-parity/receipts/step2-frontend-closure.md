# Step 2 回执：前端 Mock 层 + 角色页权限树全闭环（P1/M02-F02/F03）

**角色**：执行（前端）
**方向**：`product/role-menu-permission-parity/ready/direction-role-menu-permission-parity.md`（§2、§4、§5、§6 验收 1-4/7）
**契约基准**：`product/role-menu-permission-parity/receipts/step1-backend-regression.md` §5
**结论（一句话）**：前端 Mock 层新增角色菜单/按钮权限 GET/PUT 两个 handler（真实内存状态更新 + superadmin 拒绝），seeds 夹具补齐按钮节点并清除陈旧 dataScope，RoleList 权限树闭环经真实 el-tree 自动化验证「保存→重开→回填一致」，四连全绿 **72 spec / 668 tests / 0 failures**（基线 71/646，增量 +1 spec / +22 tests），**无 BLOCKED**。

---

## 1. A 项契约核对结果（读代码确认，非猜测）

### A1 现有端点与页面代码（role.ts / RoleList.vue）

- `src/modules/system/api/role.ts:62-68`：`getRoleMenus(id): Promise<string[]>`（GET `/system/role/{id}/menus`）、`updateRoleMenus(id, menuIds: string[])`（PUT，body=string[]）——**已有 API 函数，但从未被 mock 覆盖**（全 mock 模式下请求 404，与方向 §2.2 矛盾）。
- `RoleList.vue`：回填 `:224`（`permissionIds.value = await getRoleMenus(row.id!)`）、setCheckedKeys `:234`、保存 `:258`（编辑时 `if (!isProtectedRole.value) await updateRoleMenus(...)`；创建 `:262`）、superadmin 禁用 `:282-286`（canEditRole）/`:396-406`（行按钮 disabled）/`:523`（树 disabled）/`:531`（保存按钮 v-if）。权限树 `node-key="id"`、`check-strictly` 未设置（默认 false=父子联动）。
- 权限树数据源 `loadMenu()`（foundation/menu）与侧边栏/路由同源（菜单单一数据源不变量不受影响）。

### A2 数字/字符串漂移核对与处置（方向 §5 风险 2 前置项）

| 层 | 现状 |
|---|---|
| 真实后端契约（step1 §5） | `R<List<Long>>`，**数组元素为数字**；「项目 Jackson Long→String」仅影响对象字段 id，不影响数组元素类型 |
| 前端 API 层 | `getRoleMenus(): Promise<string[]>`（错误类型标注）、`updateRoleMenus(id, string[])`（错误载荷形状） |
| 页面 | `permissionIds: ref<string[]>` + el-tree `node-key="id"`（树节点 id 为 string） |

**处置**：在 **API 层做防腐转换**（最小改动、组件零改）：
- `getRoleMenus` 按 `request<number[]>` 取真实载荷 → `String()` 转为 string[] 返回组件；
- `updateRoleMenus` 收 string[] → `Number()` 转为数字数组提交。

若不做转换：真实后端数字数组直接赋给 `permissionIds`（string[] 声明）会运行时产生 string|number 混合；`setCheckedKeys` 用 number 去匹配 string 的 node-key 时**回填失效**（静默丢权限）。证据见 `role.spec.ts` 新增 4 用例（`toHaveBeenCalledWith(..., data: [1,11,12,110])` 与 `toEqual(['1','11',...])` 双向断言）+ `role-menus.spec.ts` GET 断言 `data.every(n => typeof n === 'number')`。

### A3 匹配器核对（foundation/mock/index.ts `tryMatch` :111-144）

- 逐段 token 匹配（`tokenize` 按 `/` 拆分），且 `actualTokens.length !== expectedTokens.length → continue`（:122）。`:id` 只占一段，`/system/role/:id/menus`（6 段）与 `/system/role/:id`（5 段）**不会互相吞并**；路由区分有专项测试（`role-menus.spec.ts`「路由区分」用例，GET /system/role/2 与 /system/role/2/menus 各自命中正确 handler）。
- 未命中 → fallthrough 真实 axios（:113），mock 模式零后端时 404——本次新增 handler 后闭环。

### A4 seeds 夹具核对与修正

- **MOCK_MENU_TREE 无任何 menuType=2 按钮节点**（方向要求按钮行补齐：menuType=2、component=null、permission 非空）→ 在系统管理页下补齐 6 个按钮（110/111/112 用户增改删、120/121/122 角色增改删），路由（foundation/menu `menuType===BUTTON → continue` :98-100）与侧边栏（menu-utils `visibleMenu` 过滤 BUTTON）均安全忽略。
- **superadmin 行 dataScope=5 为陈旧越界值**（后端 DataScope ordinal 0=ALL、V31 seed admin dataScope=0）→ 修正为 0（方向 §2.2 清除陈旧值）。
- **发现并修复 3 个夹具数据缺陷**（否则树勾选/绑定语义失真）：
  1. 菜单树 id 重复：agent 下二级菜单 id '15' 与系统管理下用户组管理 id '15' 重复 → 用户组管理改 '18'（id 唯一后 setCheckedKeys 不再漂移）。
  2. job 根节点 id '10' 与系统管理下字典管理 id '10' 重复 → job 根改 '20'（其子 100/101 parentId 同步）。
  3. MOCK_ROLES_LIST id '3' 重复（普通用户 与 部门经理）+ 部门经理/HR code 重复 + HR 专员 id '4' 与部门 id '4' 语义歧义 → 部门经理改 id '4'、HR 专员改 id '5'（wangwu 用户 roleIds 引用同步 '5'，保持原「HR 专员」语义）。角色列表 UI（getRole 单查、el-table row-key）此前已受此污染。

## 2. B 项实现说明（逐项，文件:行）

### B1 seeds.ts（夹具）

- `src/foundation/mock/seeds.ts` 菜单树（id '11'/'12' 下）新增按钮节点 110/111/112、120/121/122（menuType: 2, component: null, permission 非空, hidden: true）。
- 用户组管理 id '15'→'18'；job 根 '10'→'20'（子节点 parentId '10'→'20'）。
- `MOCK_ROLES_LIST`：superadmin dataScope 5→0；id/roleIds 去重修正（见 A4）。
- 新增 `MOCK_ROLE_MENU_BINDINGS: Record<string, number[]>`（seeds.ts:1171 附近）：
  - `'2'`（admin，V31 显式绑全量）：`[1, 11, 12, 13, 14, 18, 110, 111, 112, 120, 121, 122]`（目录/页面/按钮混合，回填可演示）；
  - `'1'`（superadmin）：**不建绑定行**（真实 V31 超管旁路，sys_role_menu 无 superadmin 行）；
  - `'3'`（user）：空绑定。

### B2 handlers.ts（Mock handler）

- `src/foundation/mock/handlers.ts`（角色 DELETE handler 后，约 :1282-1330）新增两条注册：

**`GET /api/system/role/:id/menus`** → `{ code: 0, message: 'ok', data: number[] }`
- 返回 `MOCK_ROLE_MENU_BINDINGS[id]` 副本；**未知角色 → `data: []`（code=0）**——与真实 `listMenuIds` 一致：仅按 role_id 查 sys_role_menu，不校验角色存在、不过滤 menu_type（step1 §5「读空角色 data:[]」+ 未知角色同为空数组）。
- 语义对照：路径/方法/响应结构/空角色/未知角色/清空后读回 全部与真实 API 一致（测试见 §5 对照表）。

**`PUT /api/system/role/:id/menus`** → `{ code: 0, message: 'ok', data: null }`
- **真实更新内存夹具状态**：`MOCK_ROLE_MENU_BINDINGS[id] = [...new Set(requested)]`（先删后插语义 = 整体替换；filter 去 null + `Set` 去重 = 应用层 filter+distinct，幂等）——后续 GET / 页面回填必须能观察到（方向 §5 风险 1 防护，测试实证）。
- **清空**：body `[]` 或 `null`（或非数组）→ 置 `[]`（真实 `menuIds==null → 删除后 return` = 清空）。
- **受保护角色**：`role.builtIn===true && role.code==='superadmin'` → `{ code: 400, message: '内置超管角色不可修改或删除', data: null }`，**绑定不被修改**（HTTP 200 + body code 400 的业务错误模式，与真实 GlobalExceptionHandler 传输一致；判定是 **code** 不是 id，与 assertMutable 一致）。
- **未知角色**：**静默成功 code=0**（真实写孤儿关系；方向 §3 非目标不处理数据卫生，如实复刻）。
- **重复保存**：同一集合两次 PUT → GET 结果一致（幂等，测试实证）。

### B3 RoleList.vue（最小修正）

- `src/modules/system/views/RoleList.vue:224` 后新增一行：`form.builtIn = detail.builtIn ?? false`。
  - **原因（既有保护缺口，实测发现）**：`isProtectedRole = form.builtIn===true && form.code==='superadmin'` 依赖 form.builtIn，而 `openEdit` 从未回填该字段 → superadmin 编辑态的权限树 disabled、保存按钮 v-if 全部失效（方向 §5 风险 4 / §6 验收 4 的直接违背）。一行回填修复，不动保护判定逻辑、不动后端语义。
- 其余权限树逻辑（setCheckedKeys 回填、getCheckedKeys(true) 保存、父子联动）**经实测验证语义正确，零修改**（证据 §4）。

### B4 测试（自动化回归，方向 §6 验收 7）

| 文件 | 增量 | 覆盖 |
|---|---|---|
| `src/modules/system/api/role.spec.ts` | +4 用例 | getRoleMenus 数字→string 防腐转换、空绑定、updateRoleMenus string→数字载荷、空数组清空载荷 |
| `src/modules/system/views/RoleList.spec.ts` | +5 用例 | 编辑回填 getRoleMenus + setCheckedKeys、编辑保存调 updateRoleMenus、**superadmin 打开后 isProtectedRole=true 且保存不调 updateRoleMenus**、创建后调 updateRoleMenus、**父子联动保存→重开→回填一致（半选不丢权）** |
| `src/foundation/mock/role-menus.spec.ts`（**新增 spec**） | 13 用例 | 夹具语义（dataScope=0 清除、按钮节点形态、id 唯一）+ GET 三态（绑定/空/未知）+ PUT（替换读回、[]清空、null 清空、重复幂等、superadmin 400、未知角色静默）+ 路由区分（:id 不吞 /:id/menus） |

RoleList.spec 采用真实 el-tree 渲染（vitest jsdom + Element Plus 按需自动注册，`el-tree` 不 stub），`vi.mock('@/foundation/menu', () => ({ loadMenu: vi.fn() }))` 注入混合树夹具，通过 `wrapper.vm` 暴露的 `permissionTreeRef`（真实 TreeInstance）断言勾选状态——非手工点击，核心契约测试。

### B5 未修改（确认）

菜单构建 `foundation/menu`（零改，仅回归验证）、权限指令 `foundation/permission`（零改）、后端/Flyway（未触碰）、无关页面（UserList/DeptList/Post 等零改）。handler 匹配器 `foundation/mock/index.ts` 零改。

## 3. 与 step1 §5 契约对照表逐项一致性核对（真实 API vs Mock）

| step1 §5 项 | 真实 API（后端测试实证） | Mock 实现 | 一致 |
|---|---|---|---|
| 路径 | `GET/PUT /system/role/{id}/menus`（前端 /api 前缀） | 同（`/api/system/role/:id/menus`） | ✅ |
| 方法 | GET 读 / PUT 整体替换 | 同 | ✅ |
| 请求载荷 | PUT body=number[] | 同（API 层 string[]→number[] 转换后提交） | ✅ |
| 成功响应 | `code:0, data: menuId 数字数组`（含按钮/目录/页面）；PUT data=null | 同（GET 返回 number[] 副本；PUT data=null） | ✅ |
| 读空角色 | `data: []`（code=0） | 同（无绑定行 → []） | ✅ |
| 清空 | 空数组或 body=null → 删全部绑定 | 同（`[]` / `null` 均置 []，GET 后读回 []） | ✅ |
| 重复保存 | filter+distinct 去重，幂等 | 同（filter + Set 去重；两次 PUT 后 GET 一致，测试实证） | ✅ |
| 未知角色 PUT | 静默成功 code=0（孤儿关系） | 同（code=0 并写绑定；测试实证） | ✅ |
| 受保护角色 | builtIn+code=superadmin → **HTTP 200 + body `{code:400,"msg":"内置超管角色不可修改或删除"}`**，绑定不变 | 同（code=400 同文案，绑定不被修改；测试实证） | ✅ |
| 无权限 | HTTP 403（契约意图；生产被 GlobalExceptionHandler 兜底为 500——见下方取舍记录） | **不模拟**（mock 模式无真实鉴权；页面可执行入口已在 UI 层禁用，方向 §4 仅要求「前端 Mock 层 + 角色页权限树」） | ✅（范围内） |
| 未认证 | HTTP 401 | 不模拟（同范围说明） | ✅（范围内） |
| 超管 | 旁路：可读写任意角色，但对 superadmin 角色本身 PUT 仍被拒（code=400） | 同（superadmin 旁路不在 mock 层判定，仅 assertMutable 语义复刻） | ✅ |
| 租户隔离 | sys_role_menu 按 tenant_id 隔离 | Mock 单租户（无租户维度，不违反——mock 无多租户会话） | ✅（范围内） |
| 数据范围 | dataScope 越界按 ALL 处理 | 夹具已清除越界值 5→0（与 V31 一致） | ✅ |

**403（契约意图）vs 500（生产缺陷）取舍记录**：
step1 回执 §5/§6 记录：生产环境 `GlobalExceptionHandler` 会把 `@PreAuthorize` 抛出的 `AuthorizationDeniedException` 兜底为 **HTTP 500 + code=500**（既有缺陷，后端已如实记录、未修）。Mock 侧**按契约意图实现 403 语义的等价物**——即：**不照抄 500**。具体落地：mock 层不引入「模拟鉴权拒绝」端点行为（前端调用侧在 UI 层无可执行入口 + 本方向 §4 前端影响范围不含 mock 鉴权），避免把生产 500 缺陷固化进 mock 契约。若未来需要 mock 级 403 证据，应在真实后端修复后按「HTTP 403 + body code=403」实现，而非 500。**生产 500 缺陷仍挂账 step1（规划层知悉，未扩项）**。

## 4. 父子联动与半选场景验证结论（方向 §5 风险 2，实测证据）

**结论：保存→重开→回填一致，父节点半选不会静默丢失权限。**

- **保存语义**：`handlePermissionCheck` 用 `getCheckedKeys(true)`（只取叶子）。验证（RoleList.spec「父子联动」用例）：
  - 树 = 目录1 → 页面11 → 按钮 110/111；getRoleMenus 返回 ['110','111'] → setCheckedKeys 后父子联动补全，`getCheckedKeys(false)` = `['1','11','110','111']`（父全选非半选）；
  - `getCheckedKeys(true)` 保存 = `['110','111']`（**仅叶子**，断言 `not.toContain('11')` / `not.toContain('1')`）——不会出现「勾了父没存子」；
  - `updateRoleMenus('2', ['110','111'])` 被调用。
- **重开回填**：第二次 `openEdit`，getRoleMenus 返回同样的叶子集（mock 持久化），setCheckedKeys 后 `getCheckedKeys(true)` 重新读回 `['110','111']`，**与保存时一致** → 无半选、无静默丢失。
- **半选场景**：若绑定为 `['110']`（仅单叶），el-tree 回填时父 11 半选、根 1 半选——但保存/回填均以叶子为准（getCheckedKeys(true)），后端只认叶子行，**半选父节点不会携带未授权子节点**（方向 §5 风险 2「静默扩大」也不会发生：父节点从不上送）。
- 证据链：RoleList.spec.ts 5 个权限树用例全部通过（真实 el-tree 实例断言，非 stub）。

**superadmin 无执行入口验证**：编辑 superadmin → `isProtectedRole===true`（表单 builtIn 回填后）→ 权限树 disabled、保存按钮隐藏；`handleSubmit` 走编辑分支但不调 `updateRoleMenus`（断言 `not.toHaveBeenCalled()`，且 `updateRole` 仍被调用——保留后端仍接受超管自身基础信息更新语义，与方向 §2.3 无冲突）。前端禁用是 UI 层，后端拒绝独立存在（step1 已请求级测试 code=400）。

## 5. 测试增量明细与四连结果

### 四连（最终，lint 修正后重跑）

| 命令 | 结果 |
|---|---|
| `pnpm typecheck` | ✅ 0 errors（vue-tsc -b --noEmit） |
| `pnpm lint` | ✅ 0 errors / 0 warnings（eslint .） |
| `pnpm test` | ✅ **72 spec files / 668 tests / 0 failures** |
| `pnpm build` | ✅ 成功（vite build，产物 dist/） |

- 全部命令带 `NODE_OPTIONS="--max-old-space-size=2048"`（2G 上限遵守）。
- 四连前 `ps aux | grep -iE "mvn|java|surefire"` 无后端进程（前后端编译互斥满足）；首轮 typecheck 失败（3 类新 spec 类型错误）已修复后重跑全绿。

### 基线对比（方向 §6 验收 9：基线 71 spec / 646 tests）

- spec 数：71 → **72**（+1：新增 `foundation/mock/role-menus.spec.ts`）
- 测试数：646 → **668**（+22 = role.spec +4 + RoleList.spec +5 + role-menus.spec +13）
- 逐项可回溯：role.spec 6→10（+4）、RoleList.spec 4→9（原 4 用例保留，+5）、role-menus.spec 0→13（1 新文件）；其余文件零变更。
- 失败/跳过：0/0。

## 6. 触碰文件清单与未触碰确认

| 文件 | 类型 | 说明 |
|---|---|---|
| `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 修改 | 按钮节点 6 个、菜单/角色 id 去重、dataScope 5→0、新增 MOCK_ROLE_MENU_BINDINGS |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 修改 | 新增 GET/PUT `/api/system/role/:id/menus`（真实状态更新 + superadmin 400） |
| `Smart-WorkFlow-Web/src/modules/system/api/role.ts` | 修改 | getRoleMenus/updateRoleMenus 防腐转换（number↔string） |
| `Smart-WorkFlow-Web/src/modules/system/views/RoleList.vue` | 修改 | openEdit 回填 form.builtIn（1 行，修复 superadmin 编辑态保护缺口） |
| `Smart-WorkFlow-Web/src/modules/system/api/role.spec.ts` | 修改 | +4 契约用例 |
| `Smart-WorkFlow-Web/src/modules/system/views/RoleList.spec.ts` | 修改 | +5 权限树用例（真实 el-tree） |
| `Smart-WorkFlow-Web/src/foundation/mock/role-menus.spec.ts` | 新增 | 13 用例 mock 契约专项 |
| `product/role-menu-permission-parity/receipts/step2-frontend-closure.md` | 回执 | 本文件 |

**未触碰**：`foundation/menu`、`foundation/permission`、`foundation/mock/index.ts`（匹配器）、`foundation/request`、后端仓库（`Smart-WorkFlow/`）任何文件、Flyway、UserList/DeptList/PostList/DictTypeList/UserGroupList 等无关页面与夹具（UserGroupList 未跟踪文件为 P28/I36 既有会话产物，本任务零改动）。工作区 `git status` 中 UserGroup 相关未跟踪文件不属于本 Step 触碰范围。

## 7. BLOCKED 事项

**无。** 附带说明（已如实记录，未扩项）：
1. 生产环境 403→500 兜底缺陷仍挂账（step1 §6，本回执 §3 取舍记录）；
2. 方向 §6 验收 5/6（非超管授权链允许/拒绝/未认证三类证据、租户隔离）属后端/联动 Step 范围，前端本 Step 未重复验证（后端 step1 已请求级测试覆盖）；
3. 阶段三知识同步（验收 10：M02-F02-01/M02-F03-01 状态、P1 核销）属后续 Step，本回执不做。
