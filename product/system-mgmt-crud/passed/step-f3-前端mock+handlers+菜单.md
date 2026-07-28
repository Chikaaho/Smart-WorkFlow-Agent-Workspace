# Step F3：前端 — Mock 数据 + Handlers + 菜单更新

## 1. 当前状态

功能「系统管理核心 CRUD 做宽闭环」处于 **IN_PROGRESS** 状态。

前置 Step：
- B1/B2/B3 **PASSED** — 后端全部完成（4 Controller + 4 Service + 迁移 + 25 tests，136 tests 总计）
- F1 **PASSED** — Types + API + Specs（12 文件，42 spec files / 377 tests）
- F2 **PASSED** — Vue 视图 + 页面单测（8 文件，46 spec files / 392 tests）

此 Step 是最终阶段：为 4 个实体创建 mock 种子数据、CRUD handlers，并更新菜单树和权限，使 `pnpm dev:mock` 模式下用户/角色/部门/岗位管理页面完整可用。

## 2. Step 目标

1. 在 `seeds.ts` 中新增 4 个可变 mock 数据数组（User/Role/Dept/Post）
2. 在 `seeds.ts` 中更新 `MOCK_MENU_TREE`（系统管理下追加 4 个子菜单 id=11~14）
3. 在 `seeds.ts` 中更新 `MOCK_SESSION_DATA.permissions`（追加 4 个新权限）
4. 在 `handlers.ts` 中新增 ~20 个 mock handler（每实体 5 个 CRUD 端点）
5. 验证四连全绿 + `pnpm dev:mock` 肉眼验收

## 3. 推荐模型

推荐模型：**deepseek-v4-flash**

## 4. 模型选择理由

选择理由：纯样板代码机械复制 — mock 种子数据沿现有 `MOCK_DICT_TYPES`/`MOCK_FORM_DEF_STORE` 模式，handler 沿 `form-def` CRUD handler 模式（in-memory mutate + filter + paginate），零架构决策。

是否触发升级条件：否

## 5. 已知上下文

### 5.1 Mock 系统架构

- **MockMethod**：`'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'`
- **MockHandler 签名**：`(params: Record<string, string>, query: Record<string, string>, body: unknown) => ApiResponse<T>`
- **MockRegistration**：`{ method: MockMethod; pattern: string; handler: MockHandler }`
- **注册机制**：`handlers.ts` 导出 `mockRegistrations: MockRegistration[]`；`index.ts` 模块顶层遍历注册到 `Map<RegistryKey, MockHandler>`
- **激活条件**：`import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'`（仅 dev 环境 + 显式启用）
- **路径匹配**：支持 `:param` 占位符（如 `/api/system/user/:id`），params 注入 handler 第一个参数
- **响应形状**：`{ code: number, message: string, data: T | null }` — 即 `ApiResponse<T>`

### 5.2 可变数据模式（参考 MOCK_FORM_DEF_STORE + MOCK_TODO_TASKS）

- `MOCK_FORM_DEF_STORE`：`Map<string, {...}>` — 支持 `get`/`set` 用于 CRUD
- `MOCK_TODO_TASKS`：可变数组 — 通过 `splice` 实现删除
- **模式**：在 `seeds.ts` 中用 `let` 声明可变数组/Map（或 `const` 声明可变容器），在 `handlers.ts` 中 import 后原地 mutate

### 5.3 Handler CRUD 模式（参考 form-def handler）

**分页查询**（form/def/page，handlers.ts line 543）：
```typescript
handler: (_params, query) => {
  const pageNum = Number(query.pageNum ?? 1)
  const pageSize = Number(query.pageSize ?? 10)
  // filter + paginate mutable array
  const start = (pageNum - 1) * pageSize
  const records = all.slice(start, start + pageSize)
  return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
}
```

**创建**（form/def，handlers.ts line 413）：
```typescript
handler: (_params, _query, body) => {
  const id = String(Date.now())  // 简单 ID 生成
  MOCK_FORM_DEF_STORE.set(id, { ...body, id, status: 'DRAFT' })
  return { code: 0, message: 'ok', data: id }
}
```

**更新**（form data update，handler PUT）：
```typescript
handler: (params, _query, body) => {
  const recordId = (params as Record<string, string>).recordId
  const idx = records.findIndex(r => r.id === recordId)
  if (idx === -1) return { code: 404, message: '记录不存在', data: null }
  Object.assign(records[idx], body as object)
  return { code: 0, message: 'ok', data: null }
}
```

**删除**（workflow task complete，handler POST）：
```typescript
handler: (params) => {
  const idx = MOCK_TODO_TASKS.findIndex(t => t.taskId === taskId)
  if (idx === -1) return { code: 404, message: '任务不存在', data: null }
  MOCK_TODO_TASKS.splice(idx, 1)
  return { code: 0, message: 'ok', data: null }
}
```

### 5.4 MOCK_MENU_TREE 节点结构

```typescript
{
  id: string         // 菜单 ID（对齐 Flyway V15 的 id=11~14）
  parentId: string | null  // 父菜单 ID（子菜单 parentId = '1' 指 System）
  name: string       // 菜单内部名
  title: string      // 显示标题
  path: string       // 路由路径
  component: string | null  // 组件路径（如 'system/views/UserList'）
  icon: string       // Element Plus 图标名
  sort: number       // 排序
  menuType: number   // 0=目录 1=菜单
  permission: string // 权限标识
  hidden: boolean    // 是否隐藏
  children?: MenuNode[]  // 子菜单（递归）
}
```

### 5.5 端点清单（与 B2 后端 Controller 一致）

| 实体 | Page | Tree | Get | Create | Update | Delete |
|------|------|:----:|-----|--------|--------|--------|
| User | `POST /system/user/page` | — | `GET /system/user/:id` | `POST /system/user` | `PUT /system/user` | `DELETE /system/user/:id` |
| Role | `POST /system/role/page` | — | `GET /system/role/:id` | `POST /system/role` | `PUT /system/role` | `DELETE /system/role/:id` |
| Dept | — | `GET /system/dept/tree` | `GET /system/dept/:id` | `POST /system/dept` | `PUT /system/dept` | `DELETE /system/dept/:id` |
| Post | `POST /system/post/page` | — | `GET /system/post/:id` | `POST /system/post` | `PUT /system/post` | `DELETE /system/post/:id` |

### 5.6 权限标识（与 Flyway V15 一致）

```
system:user:list
system:role:list
system:dept:list
system:post:list
```

### 5.7 菜单 ID（与 Flyway V15 一致）

| ID | name | title | component | permission | icon |
|:--:|------|-------|-----------|------------|------|
| 11 | User | 用户管理 | system/views/UserList | system:user:list | User |
| 12 | Role | 角色管理 | system/views/RoleList | system:role:list | Avatar |
| 13 | Dept | 部门管理 | system/views/DeptList | system:dept:list | Collection |
| 14 | Post | 岗位管理 | system/views/PostList | system:post:list | Tickets |

## 6. 执行前必须读取的文件

按优先级排序：

| # | 文件 | 目的 |
|---|------|------|
| 1 | `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 种子数据模式（MOCK_MENU_TREE/MOCK_SESSION_DATA/MOCK_DICT_TYPES 结构） |
| 2 | `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | Handler 注册模式（MockRegistration 结构 + CRUD handler 模式） |
| 3 | `Smart-WorkFlow-Web/src/foundation/mock/index.ts` | MockMethod/MockHandler 类型 + dispatch 机制 |
| 4 | `Smart-WorkFlow-Web/src/foundation/mock/index.spec.ts` | Mock 系统测试（确认不破坏现有注册） |
| 5 | `Smart-WorkFlow-Web/src/modules/system/types/user.ts` | SysUser/UserFormRequest 字段 |
| 6 | `Smart-WorkFlow-Web/src/modules/system/types/role.ts` | SysRole 字段 |
| 7 | `Smart-WorkFlow-Web/src/modules/system/types/dept.ts` | SysDept 字段 |
| 8 | `Smart-WorkFlow-Web/src/modules/system/types/post.ts` | SysPost 字段 |
| 9 | `Smart-WorkFlow-Web/src/modules/system/api/user.ts` | User API 端点路径 |
| 10 | `Smart-WorkFlow-Web/src/modules/system/api/role.ts` | Role API 端点路径 |
| 11 | `Smart-WorkFlow-Web/src/modules/system/api/dept.ts` | Dept API 端点路径 |
| 12 | `Smart-WorkFlow-Web/src/modules/system/api/post.ts` | Post API 端点路径 |
| 13 | `Smart-WorkFlow-Web/.claude/system.md` | 前端工程宪法 |
| 14 | `product/system-mgmt-crud/ready/step-f3-前端mock+handlers+菜单.md` | 本执行方案 |

## 7. 允许修改的文件范围

### 修改（2 个）

```
Smart-WorkFlow-Web/src/foundation/mock/seeds.ts      — 新增 4 个可变数组 + 更新 MOCK_MENU_TREE + MOCK_SESSION_DATA
Smart-WorkFlow-Web/src/foundation/mock/handlers.ts   — 新增 ~20 个 handler 注册
```

### 不新建任何文件

此 Step 仅修改已有种子数据和 handler 注册文件。

## 8. 禁止修改的范围

- 禁止修改 `Smart-WorkFlow-Web/src/modules/system/api/*.ts`（F1 已验收）
- 禁止修改 `Smart-WorkFlow-Web/src/modules/system/types/*.ts`（F1 已验收）
- 禁止修改 `Smart-WorkFlow-Web/src/modules/system/views/*.vue`（F2 已验收）
- 禁止修改 `Smart-WorkFlow-Web/src/modules/system/views/*.spec.ts`（F2 已验收）
- 禁止修改 `Smart-WorkFlow-Web/src/foundation/mock/index.ts`（mock 调度机制不动）
- 禁止触碰 `Smart-WorkFlow/` 下任何后端文件
- 禁止新建 barrel 文件
- 禁止修改 router 配置

## 9. 详细执行方案

### 9.1 执行顺序

```
1. 修改 seeds.ts — 新增 4 个可变 mock 数组
2. 修改 seeds.ts — 更新 MOCK_MENU_TREE（系统管理下追加 4 个子菜单）
3. 修改 seeds.ts — 更新 MOCK_SESSION_DATA.permissions（追加 4 个权限）
4. 修改 seeds.ts — 更新 exports（如需要）
5. 修改 handlers.ts — 新增 imports（4 个可变数组 + 类型）
6. 修改 handlers.ts — 新增 User CRUD handler（5 个）
7. 修改 handlers.ts — 新增 Role CRUD handler（5 个）
8. 修改 handlers.ts — 新增 Dept CRUD handler（5 个：tree + get + create + update + delete）
9. 修改 handlers.ts — 新增 Post CRUD handler（5 个）
10. 运行 pnpm typecheck && pnpm lint && pnpm test && pnpm build
11. 运行 pnpm dev:mock 肉眼验收 4 个页面
```

### 9.2 seeds.ts — 新增可变 Mock 数据数组

在 `seeds.ts` 文件末尾（`MOCK_NOTIFY_MESSAGES` 之后）新增以下 4 个 `let` 可变数组：

```typescript
// ─── 系统管理 CRUD mock 数据（可变数组，handler 中原地 mutate） ───

export let MOCK_USERS_LIST = [
  { id: '1', username: 'admin', realName: '系统管理员', email: 'admin@example.com', phone: '13800000001', sex: 1, status: 1, deptId: '1', isAdmin: true, avatar: null, createTime: '2026-06-01 10:00:00', updateTime: '2026-07-01 10:00:00' },
  { id: '2', username: 'zhangsan', realName: '张三', email: 'zhangsan@example.com', phone: '13800000002', sex: 1, status: 1, deptId: '2', isAdmin: false, avatar: null, createTime: '2026-06-15 09:00:00', updateTime: '2026-07-10 14:00:00' },
  { id: '3', username: 'lisi', realName: '李四', email: 'lisi@example.com', phone: '13800000003', sex: 2, status: 1, deptId: '2', isAdmin: false, avatar: null, createTime: '2026-06-20 11:00:00', updateTime: '2026-07-12 16:00:00' },
  { id: '4', username: 'wangwu', realName: '王五', email: 'wangwu@example.com', phone: '13800000004', sex: 1, status: 1, deptId: '3', isAdmin: false, avatar: null, createTime: '2026-07-01 08:00:00', updateTime: '2026-07-15 10:00:00' },
  { id: '5', username: 'zhaoliu', realName: '赵六', email: 'zhaoliu@example.com', phone: '13800000005', sex: 2, status: 0, deptId: '3', isAdmin: false, avatar: null, createTime: '2026-07-05 13:00:00', updateTime: '2026-07-08 09:00:00' },
]

export let MOCK_ROLES_LIST = [
  { id: '1', name: '超级管理员', code: 'admin', sort: 1, status: 1, dataScope: 5, builtIn: true, description: '系统内置超级管理员角色', createTime: '2026-06-01 10:00:00', updateTime: '2026-06-01 10:00:00' },
  { id: '2', name: '普通用户', code: 'user', sort: 2, status: 1, dataScope: 1, builtIn: true, description: '系统内置普通用户角色', createTime: '2026-06-01 10:00:00', updateTime: '2026-06-01 10:00:00' },
  { id: '3', name: '部门经理', code: 'manager', sort: 3, status: 1, dataScope: 3, builtIn: false, description: '部门级管理权限', createTime: '2026-06-15 09:00:00', updateTime: '2026-07-01 14:00:00' },
  { id: '4', name: 'HR 专员', code: 'hr', sort: 4, status: 1, dataScope: 2, builtIn: false, description: '人事管理权限', createTime: '2026-07-01 08:00:00', updateTime: '2026-07-10 10:00:00' },
]

export let MOCK_DEPTS_LIST = [
  { id: '1', parentId: '0', name: '总公司', code: 'HQ', sort: 1, status: 1, createTime: '2026-06-01 10:00:00', updateTime: '2026-06-01 10:00:00' },
  { id: '2', parentId: '1', name: '技术部', code: 'TECH', sort: 1, status: 1, createTime: '2026-06-01 10:00:00', updateTime: '2026-06-15 09:00:00' },
  { id: '3', parentId: '1', name: '产品部', code: 'PRODUCT', sort: 2, status: 1, createTime: '2026-06-01 10:00:00', updateTime: '2026-07-01 14:00:00' },
  { id: '4', parentId: '1', name: '人事部', code: 'HR', sort: 3, status: 1, createTime: '2026-06-01 10:00:00', updateTime: '2026-07-10 10:00:00' },
  { id: '5', parentId: '2', name: '前端组', code: 'TECH-FE', sort: 1, status: 1, createTime: '2026-06-15 09:00:00', updateTime: '2026-07-01 10:00:00' },
  { id: '6', parentId: '2', name: '后端组', code: 'TECH-BE', sort: 2, status: 1, createTime: '2026-06-15 09:00:00', updateTime: '2026-07-01 10:00:00' },
]

export let MOCK_POSTS_LIST = [
  { id: '1', code: 'CEO', name: '首席执行官', sort: 1, status: 1, description: '公司最高决策者', createTime: '2026-06-01 10:00:00', updateTime: '2026-06-01 10:00:00' },
  { id: '2', code: 'CTO', name: '首席技术官', sort: 2, status: 1, description: '技术方向负责人', createTime: '2026-06-01 10:00:00', updateTime: '2026-06-01 10:00:00' },
  { id: '3', code: 'DEV', name: '开发工程师', sort: 3, status: 1, description: '软件开发', createTime: '2026-06-15 09:00:00', updateTime: '2026-07-01 10:00:00' },
  { id: '4', code: 'PM', name: '产品经理', sort: 4, status: 1, description: '产品规划与需求管理', createTime: '2026-06-20 11:00:00', updateTime: '2026-07-10 14:00:00' },
  { id: '5', code: 'QA', name: '测试工程师', sort: 5, status: 0, description: '质量保障（已停用）', createTime: '2026-07-01 08:00:00', updateTime: '2026-07-15 10:00:00' },
]
```

### 9.3 seeds.ts — 更新 MOCK_MENU_TREE

在 `MOCK_MENU_TREE` 的 System 菜单（id='1'）的 `children` 数组中，**在现有 dict 菜单（id='10'）之后**追加 4 个子菜单节点：

```typescript
{
  id: '11',
  parentId: '1',
  name: 'User',
  title: '用户管理',
  path: 'system/user',
  component: 'system/views/UserList',
  icon: 'User',
  sort: 2,
  menuType: 1,
  permission: 'system:user:list',
  hidden: false,
},
{
  id: '12',
  parentId: '1',
  name: 'Role',
  title: '角色管理',
  path: 'system/role',
  component: 'system/views/RoleList',
  icon: 'Avatar',
  sort: 3,
  menuType: 1,
  permission: 'system:role:list',
  hidden: false,
},
{
  id: '13',
  parentId: '1',
  name: 'Dept',
  title: '部门管理',
  path: 'system/dept',
  component: 'system/views/DeptList',
  icon: 'Collection',
  sort: 4,
  menuType: 1,
  permission: 'system:dept:list',
  hidden: false,
},
{
  id: '14',
  parentId: '1',
  name: 'Post',
  title: '岗位管理',
  path: 'system/post',
  component: 'system/views/PostList',
  icon: 'Tickets',
  sort: 5,
  menuType: 1,
  permission: 'system:post:list',
  hidden: false,
},
```

**注意**：Dept 的 icon 使用 `Collection`（与 dict 管理不同，dict 已用 Collection，此处改为 `OfficeBuilding` 或保留 `Collection` 均可。建议使用 `OfficeBuilding` 以示区分）。

### 9.4 seeds.ts — 更新 MOCK_SESSION_DATA.permissions

在 `MOCK_SESSION_DATA.permissions` 数组中追加 4 个权限标识：

```typescript
'system:user:list',
'system:role:list',
'system:dept:list',
'system:post:list',
```

### 9.5 handlers.ts — 新增 Imports

在 `handlers.ts` 顶部的 import 块中，从 `./seeds` 新增导入：

```typescript
MOCK_USERS_LIST,
MOCK_ROLES_LIST,
MOCK_DEPTS_LIST,
MOCK_POSTS_LIST,
```

### 9.6 handlers.ts — User CRUD Handlers（5 个）

在 `mockRegistrations` 数组中新增（位置：在现有系统管理相关 handler 之后，建议放在 `/api/system/dict/type/page` handler 之后）：

```typescript
// ── 用户管理 CRUD ──────────────────────────────────────────

// POST /api/system/user/page
{
  method: 'POST',
  pattern: '/api/system/user/page',
  handler: (_params, query, body) => {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 10)
    let list = [...MOCK_USERS_LIST]
    // 筛选（body 为 filter 对象）
    if (body && typeof body === 'object') {
      const f = body as Record<string, unknown>
      if (f.username) list = list.filter(u => u.username.includes(String(f.username)))
      if (f.status !== undefined && f.status !== null && f.status !== '') list = list.filter(u => u.status === Number(f.status))
    }
    const total = list.length
    const start = (pageNum - 1) * pageSize
    const records = list.slice(start, start + pageSize)
    return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
  },
},

// GET /api/system/user/:id
{
  method: 'GET',
  pattern: '/api/system/user/:id',
  handler: (params) => {
    const id = (params as Record<string, string>).id
    const user = MOCK_USERS_LIST.find(u => u.id === id)
    if (!user) return { code: 404, message: '用户不存在', data: null }
    return { code: 0, message: 'ok', data: { ...user } }
  },
},

// POST /api/system/user
{
  method: 'POST',
  pattern: '/api/system/user',
  handler: (_params, _query, body) => {
    const data = body as Record<string, unknown>
    const id = String(Date.now())
    const newUser = {
      id,
      username: String(data.username ?? ''),
      realName: String(data.realName ?? ''),
      email: String(data.email ?? ''),
      phone: String(data.phone ?? ''),
      sex: Number(data.sex ?? 0),
      status: Number(data.status ?? 1),
      deptId: String(data.deptId ?? ''),
      isAdmin: false,
      avatar: null,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }
    MOCK_USERS_LIST.push(newUser as typeof MOCK_USERS_LIST[number])
    return { code: 0, message: 'ok', data: id }
  },
},

// PUT /api/system/user
{
  method: 'PUT',
  pattern: '/api/system/user',
  handler: (_params, _query, body) => {
    const data = body as Record<string, unknown>
    const idx = MOCK_USERS_LIST.findIndex(u => u.id === String(data.id))
    if (idx === -1) return { code: 404, message: '用户不存在', data: null }
    // 保留不可变字段
    const existing = MOCK_USERS_LIST[idx]
    MOCK_USERS_LIST[idx] = {
      ...existing,
      username: String(data.username ?? existing.username),
      realName: String(data.realName ?? existing.realName),
      email: String(data.email ?? existing.email),
      phone: String(data.phone ?? existing.phone),
      sex: data.sex !== undefined ? Number(data.sex) : existing.sex,
      status: data.status !== undefined ? Number(data.status) : existing.status,
      deptId: data.deptId !== undefined ? String(data.deptId) : existing.deptId,
      updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }
    return { code: 0, message: 'ok', data: null }
  },
},

// DELETE /api/system/user/:id
{
  method: 'DELETE',
  pattern: '/api/system/user/:id',
  handler: (params) => {
    const id = (params as Record<string, string>).id
    const idx = MOCK_USERS_LIST.findIndex(u => u.id === id)
    if (idx === -1) return { code: 0, message: 'ok', data: null }  // 幂等：不存在的记录删除也返回成功
    MOCK_USERS_LIST.splice(idx, 1)
    return { code: 0, message: 'ok', data: null }
  },
},
```

### 9.7 handlers.ts — Role CRUD Handlers（5 个）

与 User 模式一致，字段差异：
- Page：筛选 `name`/`code`/`status`
- Get：按 `id` 查找，返回 `SysRole`
- Create：生成 id，push 到 `MOCK_ROLES_LIST`
- Update：按 `id` 查找，merge 字段（`name`/`code`/`sort`/`status`/`description`），保持 `builtIn`/`dataScope` 不变
- Delete：按 `id` splice，幂等

### 9.8 handlers.ts — Dept CRUD Handlers（5 个）

**特殊：无 page 端点，用 tree 端点替代。**

```typescript
// GET /api/system/dept/tree
{
  method: 'GET',
  pattern: '/api/system/dept/tree',
  handler: () => {
    // 返回 flat 列表（前端自行 flat→tree）
    return { code: 0, message: 'ok', data: [...MOCK_DEPTS_LIST] }
  },
},

// GET /api/system/dept/:id
// POST /api/system/dept
// PUT /api/system/dept
// DELETE /api/system/dept/:id
```

### 9.9 handlers.ts — Post CRUD Handlers（5 个）

标准 CRUD，与 Role 模式一致：
- Page：筛选 `code`/`name`/`status`
- Get/Create/Update/Delete：同 Role 模式

### 9.10 验证命令

```bash
cd /data/reasonix/files/Smart-WorkFlow-Web

# Step 1: 类型检查
pnpm typecheck

# Step 2: Lint
pnpm lint

# Step 3: 单元测试（含 mock 系统回归）
pnpm test

# Step 4: 生产构建（确认 mock 代码可 tree-shake）
pnpm build

# Step 5: Mock 模式肉眼验收
pnpm dev:mock
# 访问 http://localhost:5173 → 登录 → 系统管理 →
#   - 用户管理（查看列表/新建/编辑/删除）
#   - 角色管理（查看列表/新建/编辑/删除）
#   - 部门管理（查看树形/新建子部门/编辑/删除）
#   - 岗位管理（查看列表/新建/编辑/删除）
```

## 10. 关键实现约束

1. **可变数组用 `let` 声明** — `export let MOCK_USERS_LIST = [...]` 以支持 handler 原地 mutate（`push`/`splice`/索引赋值）
2. **Dept tree handler 不返回嵌套结构** — 返回 flat 列表，前端 `DeptList.vue` 的 `buildTree()` 自行转换
3. **菜单 ID 必须为字符串 `'11'`~`'14'`** — 与 Flyway V15 SQL 一致（但 mock 数据为 JS 字符串）
4. **菜单 component 路径无后缀无前导斜杠** — `system/views/UserList`（非 `/system/views/UserList.vue`）
5. **Create handler 的 `id` 使用 `String(Date.now())`** — 简单唯一 ID 生成
6. **Update handler 合并字段而非整体替换** — 保留不可变字段（如 `isAdmin`/`builtIn`/`createTime`）
7. **Delete handler 幂等** — 不存在的记录也返回 `code: 0`
8. **Handler 放在现有 `mockRegistrations` 数组末尾** — 不改变已有 handler 顺序，避免路由匹配冲突
9. **所有 handler 返回 `ApiResponse<T>` 形状** — `{ code: 0, message: 'ok', data: ... }` 或 `{ code: 404, message: '...', data: null }`

## 11. 边界情况

| # | 场景 | 处理 |
|---|------|------|
| 1 | User page query body 为 null/undefined | 检查 `body && typeof body === 'object'` 后过滤 |
| 2 | Dept tree 空列表 | 返回 `[]`，前端 `buildTree([])` 返回 `[]`，表格显示空态 |
| 3 | Dept 删除有子部门的节点 | mock 不做 RESTRICT 检查（简化），删除仅移除该节点 |
| 4 | Role 编辑 builtIn 角色 | mock 不拦截（简化），前端操作正常执行 |
| 5 | 分页 pageSize 超大值 | `slice(start, start + pageSize)` 自动截断 |
| 6 | 重复创建同名用户 | mock 不校验唯一性（简化），每次生成新 id |
| 7 | GET 不存在的 id | 返回 `{ code: 404, message: '...不存在', data: null }` |

## 12. 风险和回滚方案

| 风险 | 概率 | 影响 | 缓解 |
|------|:----:|------|------|
| MOCK_MENU_TREE 子菜单导致侧边栏渲染异常 | 低 | 新增菜单不显示或布局错乱 | 沿现有 dict 菜单（id='10'）结构逐字段复制 |
| Handler URL 路径与真实 API 冲突 | 低 | mock 模式下请求被错误拦截 | 路径严格对齐 B2 后端 Controller 的 `@RequestMapping` |
| seeds.ts 导出遗漏 | 低 | handlers.ts import 失败 / typecheck 报错 | 每个可变数组显式 `export let` |
| Mock 数据在 handler 间不一致 | 低 | 创建后列表不显示新数据 | 同一声明周期内 `push` → `MOCK_*_LIST` 被后续 page handler 引用 |

回滚：删除 seeds.ts 和 handlers.ts 中新增的代码段即可完全回滚。不影响已有 mock 数据和行为。

## 13. 测试方案

### 13.1 静态检查

- `pnpm typecheck` 退出码 0
- `pnpm lint` 退出码 0
- `grep -r "from 'axios'"` 在修改文件中零命中

### 13.2 单元测试

- 已有 `index.spec.ts`（14 tests）必须全部通过（零回归）
- 已有 `DictTypeList.spec.ts`/`DictDataList.spec.ts` 等必须全部通过
- mock 系统本身已有完整测试覆盖（14 个），新增 handler 本质是数据追加，不改变 mock 系统调度逻辑

### 13.3 集成测试

无。Mock 模式的功能验证通过手工进行。

### 13.4 手工验证（必需）

`pnpm dev:mock` 后逐页验收：

| # | 页面 | 验证项 |
|---|------|--------|
| 1 | 用户管理 | 列表默认展示 5 条；筛选 username 有效；新建用户后列表刷新；编辑用户；删除用户（确认弹窗→列表刷新） |
| 2 | 角色管理 | 列表默认展示 4 条；筛选 name/code；新建角色（code 可输入）；编辑角色（code disabled）；删除角色 |
| 3 | 部门管理 | 树形表格默认展开；新建子部门（选择上级部门）；编辑部门；删除部门（无子部门校验） |
| 4 | 岗位管理 | 列表默认展示 5 条；筛选 code/name；新建岗位；编辑岗位；删除岗位 |
| 5 | 侧边栏 | 系统管理下出现 5 个子菜单（字典管理/用户管理/角色管理/部门管理/岗位管理） |

### 13.5 回归检查

- `pnpm test` 全量测试计数不应减少（基线 46 spec files / 392 tests）
- `index.spec.ts` 的 14 个测试全部通过
- 所有已有 Vue 视图 spec 测试全部通过
- `pnpm build` 构建成功（mock 代码在 production mode 下被 tree-shake，产物不增大）

## 14. 验收标准

| 编号 | 条件 |
|:----:|------|
| **F3-1** | `seeds.ts` 含 `MOCK_USERS_LIST`（≥3 条可变数据）、`MOCK_ROLES_LIST`（≥3 条）、`MOCK_DEPTS_LIST`（≥4 条含多层级）、`MOCK_POSTS_LIST`（≥3 条） |
| **F3-2** | `MOCK_MENU_TREE` 的 System（id='1'）children 中含 5 个子菜单（id=10 dict + id=11~14 User/Role/Dept/Post） |
| **F3-3** | `MOCK_SESSION_DATA.permissions` 含 `system:user:list`、`system:role:list`、`system:dept:list`、`system:post:list` |
| **F3-4** | `handlers.ts` 含 User page/get/create/update/delete 5 个 handler |
| **F3-5** | `handlers.ts` 含 Role page/get/create/update/delete 5 个 handler |
| **F3-6** | `handlers.ts` 含 Dept tree/get/create/update/delete 5 个 handler（tree 返回 flat 列表） |
| **F3-7** | `handlers.ts` 含 Post page/get/create/update/delete 5 个 handler |
| **F3-8** | `pnpm typecheck` 退出码 0 |
| **F3-9** | `pnpm lint` 退出码 0 |
| **F3-10** | `pnpm test` 退出码 0，总 spec files ≥ 46，tests ≥ 392 |
| **F3-11** | `pnpm build` 退出码 0 |
| **F3-12** | `pnpm dev:mock` 下 4 个管理页可访问、列表默认展示 mock 数据、新建/编辑/删除功能正常 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step F3

## 1. Step 编号和名称

## 2. 使用模型

## 3. 实际读取的文件
（逐文件列出）

## 4. 实际修改的文件
（逐文件列出，新建/修改区分）

## 5. 每个文件的修改摘要
（seeds.ts：新增数组行数/菜单节点数/权限数；handlers.ts：新增 handler 数和关键逻辑）

## 6. 实际执行的命令
（逐条列出命令及参数）

## 7. 命令输出摘要
（typecheck/lint/test/build 各阶段结果、退出码）

## 8. 与原方案的偏差
（哪些地方和方案不同，为什么）

## 9. 遇到的问题
（技术问题、环境问题、理解偏差等，以及如何解决的）

## 10. 未完成内容

## 11. 验收标准对照
（逐条对照 §14 F3-1 ~ F3-12）

## 12. 测试计数
- typecheck / lint / test / build 各阶段结果
- 测试计数与基线比较

## 13. Mock 模式验收截图或描述
（pnpm dev:mock 下 4 个页面行为描述）

## 14. 风险和注意事项
```

## 16. 测试回执格式

`pnpm test` 全量通过即为测试回执。如失败，请提供完整错误信息。另请报告 `pnpm dev:mock` 下 4 个页面的手工验收行为描述。

## 17. 明确禁止事项

- ❌ 不要修改 `Smart-WorkFlow-Web/src/foundation/mock/index.ts`（mock 调度机制不动）
- ❌ 不要修改 `Smart-WorkFlow-Web/src/modules/system/api/*.ts`（F1 已验收）
- ❌ 不要修改 `Smart-WorkFlow-Web/src/modules/system/types/*.ts`（F1 已验收）
- ❌ 不要修改 `Smart-WorkFlow-Web/src/modules/system/views/*.vue`（F2 已验收）
- ❌ 不要修改已有 handler 的 method/pattern（避免路由匹配冲突）
- ❌ 不要在 Dept tree handler 中返回嵌套结构（保持 flat 列表）
- ❌ 不要使用 `any` 类型 — handler body 参数显式 `Record<string, unknown>`
- ❌ 不要触碰 `Smart-WorkFlow/` 后端代码
- ❌ 不要新建任何文件（仅修改 seeds.ts 和 handlers.ts）
