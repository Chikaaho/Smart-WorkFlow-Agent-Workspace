# P24 双层管理员角色模型——前端探索回执

## Q1: UserList 对 userId=1 的保护

**结论：无任何前端保护。userId=1 可被任意编辑/删除/启停/改角色。**

- `UserList.vue` L273–453 模板区无 `:disabled`/`v-if` 行级保护，编辑/删除按钮对所有行无条件渲染（L339-341）。
- 编辑弹窗可改 username/realName/email/status/deptId/岗位/角色（L365-433）。
- `SysUser` 类型有 `isAdmin?: boolean`（`types/user.ts:18`），但 UserList.vue 从未引用。
- API 层 `deleteUser`/`updateUser`/`updateUserRoles` 无客户端守卫（`api/user.ts:71-101`）。
- **前端完全依赖后端拒绝保护 userId=1，无前端级 disable/隐藏。**

## Q2: RoleList 对 superadmin 的保护

**结论：已有完备前端保护，判断条件 `builtIn===true && code==='superadmin'`。**

| 保护点 | 位置 | 行为 |
|--------|------|------|
| 行编辑/删除 disabled | `RoleList.vue:395-411` `canEditRole()` | builtIn+superadmin 时 disabled |
| 角色编码 disabled | L451 | 编辑态始终 disabled |
| 状态 select disabled | L462 | 超管不可改启停 |
| 数据范围 disabled | L487 | 超管不可改 |
| 权限树 disabled | L526 | 超管菜单只读 |
| 保存按钮隐藏 | L534 `v-if="!isProtectedRole"` | 超管无保存 |
| handleSubmit 跳菜单保存 | L261 | `if(!isProtectedRole)` |

核心逻辑 L285: `isProtectedRole = computed(() => form.builtIn===true && form.code==='superadmin')`。**不依赖 ID，依赖 builtIn+code 双字段**。

## Q3: 角色菜单/权限绑定配置入口

**结论：已有完整入口，可配置 admin 角色菜单绑定，无缺口。**

- 弹窗"菜单与按钮权限" el-tree（`RoleList.vue:518-529`）。
- 数据来源：`loadMenu()` → `GET /system/auth/menus`（`foundation/menu/index.ts:58-64`）。
- 保存：`updateRoleMenus()` → `PUT /system/role/{id}/menus`（`api/role.ts:83-89`）。
- 回填：`getRoleMenus()` → `GET /system/role/{id}/menus`（`api/role.ts:78-81`）。
- Mock 已有 admin（id=2, code=admin, builtIn=false）及全量绑定（`seeds.ts:1327-1337,1389`）。
- `MenuNode` 契约完整（`contracts/menu.ts:14-28`）。

## Q4: job/storage 菜单路由与侧边栏

**结论：零前端代码修改，可直接显示并进入。**

- `guard.ts:28-49` 登录后 `buildRoutesFromMenu()` 动态注册路由，组件经 `import.meta.glob('/src/modules/**/*.vue')` 白名单解析（`menu/index.ts:70`）。
- 侧边栏 `AppSidebar.vue` 读 menu store，`visibleMenu()`（`menu-utils.ts:36-44`）过滤渲染。
- Job（`modules/job/views/JobList.vue`、`JobLog.vue`）、Storage（`modules/storage/views/StorageList.vue`）组件已存在，在白名单范围内。
- Mock 菜单树已含 job（id=20 目录）和 storage（id=9 MENU）（`seeds.ts:505-557`）。
- 后端菜单树 `component` 字段匹配白名单即可自动注册路由+显示侧边栏。

## Q5: 前端最小影响范围与测试范围

### 现成功能（无需改动）
- 角色 superadmin 保护完备（编辑/删除/启停/菜单/数据范围/保存全锁）
- admin 角色可配置（builtIn=false，菜单绑定读写）
- job/storage 路由+侧边栏动态生成
- Session 含 `superAdmin: boolean`（`contracts/session.ts:19`）

### 缺失能力（需前端执行）
| 缺口 | 模块 | 描述 |
|------|------|------|
| userId=1 行保护 | `UserList.vue` | 需加行级 disabled，建议判断 `isAdmin===true` 或 `id==='1'` |
| 用户启停入口 | `UserList.vue` | 当前仅编辑弹窗内 status select，无行级启停按钮 |
| 重置密码入口 | `UserList.vue` | 编辑模式不传 plainPassword，需新增重置密码弹窗/按钮 |

### 最小影响范围
- **UI**: `UserList.vue`（加保护 + 可选启停/重置密码）
- **Contracts**: 无变更（`isAdmin` 已存在）
- **API**: 可选新增 `resetPassword` 封装
- **Router/Sidebar/Menu/Mock**: 无变更

### 测试范围
- `UserList.spec.ts`：补 userId=1 disabled 断言
- `RoleList.spec.ts`：已有覆盖
- E2E（可选）：admin 登录验证 job/storage 菜单可见可达

## 未确认事项
- 后端是否对 userId=1 DELETE/PUT 返回 403（前端无客户端守卫，完全依赖后端）
- 后端非超管会话菜单树是否已含 job/storage 节点（mock 已有，真实后端未联调）
