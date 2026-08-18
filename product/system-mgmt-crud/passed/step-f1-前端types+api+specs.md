# Step F1：前端 — Types + API + Specs（12 文件）

## 1. 当前状态

功能「系统管理核心 CRUD 做宽闭环」处于 **IN_PROGRESS** 状态。

前置 Step：
- B1 **PASSED** — 后端服务层基础（SysRoleService + SysPost 实体/Mapper/Service）
- B2 **PASSED** — 4 Controller (User/Role/Dept/Post) + Flyway V15 双方言菜单 seed
- B3 **PASSED** — 4 Controller 测试（25 tests），mvn test 全量通过

后端全部完成。此 Step 是前端第一阶段：建立类型契约、API 层和 API 单测。

## 2. Step 目标

为 User/Role/Dept/Post 四个实体各创建前端 Types + API 函数 + API 单测文件（3×4=12 文件），建立前后端契约层，为 F2 的 Vue 视图提供类型和 API 调用基础。

## 3. 推荐模型

推荐模型：**deepseek-v4-flash**

## 4. 模型选择理由

选择理由：纯样板代码机械复制 — 严格沿 `dict.ts` + `dict.spec.ts` 模式，替换实体名、字段名、URL 路径即可，零架构决策。

是否触发升级条件：否

## 5. 已知上下文

### 5.1 后端端点契约（B2 已确认）

| 实体 | Page | Get | Create | Update | Delete | 特殊 |
|------|------|-----|--------|--------|--------|------|
| User | `POST /system/user/page?pageNum=&pageSize=` + body `SysUser` | `GET /system/user/{id}` | `POST /system/user` body `UserFormRequest` | `PUT /system/user` body `UserFormRequest` | `DELETE /system/user/{id}` | UserFormRequest 含 `plainPassword` 字段，不含 `password` 字段 |
| Role | `POST /system/role/page?pageNum=&pageSize=` + body `SysRole` | `GET /system/role/{id}` | `POST /system/role` body `SysRole` | `PUT /system/role` body `SysRole` | `DELETE /system/role/{id}` | — |
| Dept | **无 page**，用 `GET /system/dept/tree` 返 `List<SysDept>` | `GET /system/dept/{id}` | `POST /system/dept` body `SysDept` | `PUT /system/dept` body `SysDept` | `DELETE /system/dept/{id}` | tree 端点无分页包装，直接返回数组 |
| Post | `POST /system/post/page?pageNum=&pageSize=` + body `SysPost` | `GET /system/post/{id}` | `POST /system/post` body `SysPost` | `PUT /system/post` body `SysPost` | `DELETE /system/post/{id}` | — |

### 5.2 前端模式（dict.ts / dict.spec.ts 已验证）

- **类型文件**：`modules/system/types/{entity}.ts` — 镜像后端实体字段 + 分页筛选接口，`id` 为 `string`，审计字段可选
- **API 文件**：`modules/system/api/{entity}.ts` — 从 `@/foundation/request` 导入 `request`，本地定义 `BackendPageResult<T>` + `adaptPage()`，导出 5 个 async 函数
- **API 单测**：`modules/system/api/{entity}.spec.ts` — `vi.mock('@/foundation/request')`，`vi.mocked(request)`，验证 method/url/params/data + 返回值形状
- **无 barrel 导出**：system 模块无 `api/index.ts` 和 `types/index.ts`，各实体文件独立
- **后端分页适配**：后端返回 `{ records, total, pageNum, pageSize }`，`adaptPage()` 转为前端 `PageResult { list, total, pageNum, pageSize }`
- **页面端点用 POST**（非 GET），query 参数通过 `params` 传，filter body 通过 `data` 传
- **request() 自动解包** `R<T>` 信封，直接返回 `data: T`
- **ID 类型统一用 `string`**（后端雪花 ID 经 Jackson `LongToString` 序列化为字符串）

### 5.3 后端实体字段（B1/B2 已确认）

**SysUser**：id, username, password(BCrypt, 不返回前端), realName, email, phone, sex(0/1/2), status(0/1/2), deptId, isAdmin(0/1), avatar + BaseEntity(id, createTime, createBy, updateTime, updateBy, deleted, version, tenantId)

**SysRole**：id, name, code, sort, status(0/1), dataScope, builtIn(Boolean), description + BaseEntity

**SysDept**：id, parentId(0=根), name, code, sort, status(0/1) + BaseEntity

**SysPost**：id, code, name, sort, status(0/1), description + BaseEntity

### 5.4 关键差异点

- **User**：使用 `UserFormRequest` DTO（含 `plainPassword` 字段），不同于列表返回的 `SysUser`（无 password 字段）。`pageUsers()` 的 query body 接受 `SysUser` 字段但后端当前不支持筛选（已知限制，代码注释标注）
- **Dept**：无 page 端点，用 `listDeptTree()` 函数调 `GET /system/dept/tree`，返回值是 `SysDept[]`（非 `PageResult`），**不需要 `adaptPage()`**
- **Role**：`builtIn` 字段是 boolean（后端 `Boolean` 类型）
- **Post**：标准 CRUD，最接近 DictType 模式

## 6. 执行前必须读取的文件

按优先级排序：

| # | 文件 | 目的 |
|---|------|------|
| 1 | `Smart-WorkFlow-Web/src/modules/system/types/dict.ts` | 类型定义模式（实体接口 + 筛选接口 + JSDoc） |
| 2 | `Smart-WorkFlow-Web/src/modules/system/api/dict.ts` | API 函数模式（request 导入、BackendPageResult、adaptPage、CRUD 函数签名） |
| 3 | `Smart-WorkFlow-Web/src/modules/system/api/dict.spec.ts` | API 单测模式（vi.mock、mockRequest、describe/it、断言结构） |
| 4 | `Smart-WorkFlow-Web/src/contracts/common.ts` | PageQuery / PageResult 类型定义 |
| 5 | `Smart-WorkFlow-Web/src/foundation/request/index.ts` | request() 函数签名和 ApiError 类 |
| 6 | `Smart-WorkFlow-Web/src/modules/form/api/form-def.ts` | 另一份 adaptPage 实例参考 |
| 7 | `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` | 前端工程宪法（§4 REFERENCE 红线、§7 编码规范） |

## 7. 允许修改的文件范围

### 新建（12 个）

```
Smart-WorkFlow-Web/src/modules/system/types/user.ts
Smart-WorkFlow-Web/src/modules/system/types/role.ts
Smart-WorkFlow-Web/src/modules/system/types/dept.ts
Smart-WorkFlow-Web/src/modules/system/types/post.ts
Smart-WorkFlow-Web/src/modules/system/api/user.ts
Smart-WorkFlow-Web/src/modules/system/api/role.ts
Smart-WorkFlow-Web/src/modules/system/api/dept.ts
Smart-WorkFlow-Web/src/modules/system/api/post.ts
Smart-WorkFlow-Web/src/modules/system/api/user.spec.ts
Smart-WorkFlow-Web/src/modules/system/api/role.spec.ts
Smart-WorkFlow-Web/src/modules/system/api/dept.spec.ts
Smart-WorkFlow-Web/src/modules/system/api/post.spec.ts
```

### 不修改任何已有文件

此 Step 只新建文件，不修改已有文件。

## 8. 禁止修改的范围

- 禁止修改 `Smart-WorkFlow-Web/src/modules/system/types/dict.ts`
- 禁止修改 `Smart-WorkFlow-Web/src/modules/system/api/dict.ts`
- 禁止修改 `Smart-WorkFlow-Web/src/modules/system/api/dict.spec.ts`
- 禁止修改 `Smart-WorkFlow-Web/src/contracts/common.ts`
- 禁止修改 `Smart-WorkFlow-Web/src/foundation/request/index.ts`
- 禁止触碰 `Smart-WorkFlow/` 下任何后端文件
- 禁止创建 barrel 文件（`api/index.ts`、`types/index.ts`）— 保持与现有 dict 模式一致
- 禁止创建 Vue 组件文件（那是 F2 的工作）

## 9. 详细执行方案

### 9.1 执行顺序

```
1. 创建 types/user.ts
2. 创建 types/role.ts
3. 创建 types/dept.ts
4. 创建 types/post.ts
5. 创建 api/user.ts
6. 创建 api/role.ts
7. 创建 api/dept.ts
8. 创建 api/post.ts
9. 创建 api/user.spec.ts
10. 创建 api/role.spec.ts
11. 创建 api/dept.spec.ts
12. 创建 api/post.spec.ts
13. 运行 pnpm typecheck && pnpm lint && pnpm test
```

### 9.2 types/user.ts

```typescript
/**
 * 用户管理前端类型 —— 镜像后端实体 SysUser 字段。
 */

/** 用户实体（镜像 SysUser，不含 password 密文） */
export interface SysUser {
  id?: string
  username: string
  realName?: string
  email?: string
  phone?: string
  sex?: number
  status?: number
  deptId?: string
  isAdmin?: boolean
  avatar?: string
  /** 审计字段 */
  createTime?: string
  updateTime?: string
}

/** 用户创建/更新表单（镜像 UserFormRequest DTO） */
export interface UserFormRequest {
  id?: string
  username: string
  realName?: string
  email?: string
  phone?: string
  sex?: number
  status?: number
  deptId?: string
  /** 明文密码，仅创建时必填，更新时可选 */
  plainPassword?: string
}

/** 用户分页筛选 */
export interface UserFilter {
  username?: string
  realName?: string
  status?: number
  deptId?: string
}
```

**字段映射说明**：
- `SysUser` 不含 `password` 字段（后端不返回密文），不含 `deleted`/`version`/`tenantId`（噪音列）
- `UserFormRequest` 含 `plainPassword` 字段，映射后端 `UserController.UserFormRequest`
- `isAdmin` 使用 `boolean` 类型（对齐前端 superAdmin 布尔约定 §4）
- ID 字段统一 `string`（对齐雪花 ID → Jackson LongToString 序列化）

### 9.3 types/role.ts

```typescript
/**
 * 角色管理前端类型 —— 镜像后端实体 SysRole 字段。
 */

/** 角色实体（镜像 SysRole） */
export interface SysRole {
  id?: string
  name: string
  code: string
  sort?: number
  status?: number
  dataScope?: number
  builtIn?: boolean
  description?: string
  /** 审计字段 */
  createTime?: string
  updateTime?: string
}

/** 角色分页筛选 */
export interface RoleFilter {
  name?: string
  code?: string
  status?: number
}
```

### 9.4 types/dept.ts

```typescript
/**
 * 部门管理前端类型 —— 镜像后端实体 SysDept 字段。
 */

/** 部门实体（镜像 SysDept） */
export interface SysDept {
  id?: string
  parentId?: string
  name: string
  code: string
  sort?: number
  status?: number
  /** 审计字段 */
  createTime?: string
  updateTime?: string
  /** 前端树形渲染用，后端不返回 */
  children?: SysDept[]
}
```

### 9.5 types/post.ts

```typescript
/**
 * 岗位管理前端类型 —— 镜像后端实体 SysPost 字段。
 */

/** 岗位实体（镜像 SysPost） */
export interface SysPost {
  id?: string
  code: string
  name: string
  sort?: number
  status?: number
  description?: string
  /** 审计字段 */
  createTime?: string
  updateTime?: string
}

/** 岗位分页筛选 */
export interface PostFilter {
  code?: string
  name?: string
  status?: number
}
```

### 9.6 api/user.ts

```typescript
/**
 * 用户管理 API 层 —— 5 个 CRUD 函数。
 *
 * 全部经 foundation/request 单一请求层，禁直引 axios。
 * 后端统一响应 R<T> 由 request() 解包，本层直接拿到 data: T。
 */
import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import type { SysUser, UserFormRequest, UserFilter } from '@/modules/system/types/user'

// ─── 后端分页原始形状 ───

interface BackendPageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

function adaptPage<T>(raw: BackendPageResult<T>): PageResult<T> {
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.pageNum,
    pageSize: raw.pageSize,
  }
}

// ═══════════════════════════════════════

/** POST /system/user/page?pageNum=&pageSize= + body 筛选
 *  NOTE: 后端 SysUserService.page(PageParam) 当前不支持 query 筛选，
 *  body 参数后端接受但不使用（已知限制，后续增强） */
export async function pageUsers(
  page: PageQuery,
  filter: UserFilter,
): Promise<PageResult<SysUser>> {
  const raw = await request<BackendPageResult<SysUser>>({
    method: 'POST',
    url: '/system/user/page',
    params: page,
    data: filter,
  })
  return adaptPage(raw)
}

/** GET /system/user/{id} */
export async function getUser(id: string): Promise<SysUser> {
  return request<SysUser>({
    method: 'GET',
    url: `/system/user/${id}`,
  })
}

/** POST /system/user → R<Long> */
export async function createUser(data: UserFormRequest): Promise<string> {
  return request<string>({
    method: 'POST',
    url: '/system/user',
    data,
  })
}

/** PUT /system/user → R<Void> */
export async function updateUser(data: UserFormRequest): Promise<void> {
  return request<void>({
    method: 'PUT',
    url: '/system/user',
    data,
  })
}

/** DELETE /system/user/{id} → R<Void> */
export async function deleteUser(id: string): Promise<void> {
  return request<void>({
    method: 'DELETE',
    url: `/system/user/${id}`,
  })
}
```

**注意**：`createUser` 和 `updateUser` 使用 `UserFormRequest`（非 `SysUser`），因为后端需要 `plainPassword` 字段。

### 9.7 api/role.ts

```typescript
/**
 * 角色管理 API 层 —— 5 个 CRUD 函数。
 */
import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import type { SysRole, RoleFilter } from '@/modules/system/types/role'

// ─── 后端分页原始形状 ───

interface BackendPageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

function adaptPage<T>(raw: BackendPageResult<T>): PageResult<T> {
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.pageNum,
    pageSize: raw.pageSize,
  }
}

// ═══════════════════════════════════════

/** POST /system/role/page?pageNum=&pageSize= + body 筛选 */
export async function pageRoles(
  page: PageQuery,
  filter: RoleFilter,
): Promise<PageResult<SysRole>> {
  const raw = await request<BackendPageResult<SysRole>>({
    method: 'POST',
    url: '/system/role/page',
    params: page,
    data: filter,
  })
  return adaptPage(raw)
}

/** GET /system/role/{id} */
export async function getRole(id: string): Promise<SysRole> {
  return request<SysRole>({ method: 'GET', url: `/system/role/${id}` })
}

/** POST /system/role → R<Long> */
export async function createRole(data: SysRole): Promise<string> {
  return request<string>({ method: 'POST', url: '/system/role', data })
}

/** PUT /system/role → R<Void> */
export async function updateRole(data: SysRole): Promise<void> {
  return request<void>({ method: 'PUT', url: '/system/role', data })
}

/** DELETE /system/role/{id} → R<Void> */
export async function deleteRole(id: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/system/role/${id}` })
}
```

### 9.8 api/dept.ts

**特殊：无 page 端点，用 `listDeptTree()` 替代，不需要 `adaptPage()`。**

```typescript
/**
 * 部门管理 API 层 —— 4 个 CRUD 函数 + tree 端点。
 *
 * 部门不分页，用 GET /tree 返回全量列表（前端 flat→tree 转换）。
 */
import { request } from '@/foundation/request'
import type { SysDept } from '@/modules/system/types/dept'

// ═══════════════════════════════════════

/** GET /system/dept/tree → 全量部门列表（flat，前端自行组装树） */
export async function listDeptTree(): Promise<SysDept[]> {
  return request<SysDept[]>({
    method: 'GET',
    url: '/system/dept/tree',
  })
}

/** GET /system/dept/{id} */
export async function getDept(id: string): Promise<SysDept> {
  return request<SysDept>({ method: 'GET', url: `/system/dept/${id}` })
}

/** POST /system/dept → R<Long> */
export async function createDept(data: SysDept): Promise<string> {
  return request<string>({ method: 'POST', url: '/system/dept', data })
}

/** PUT /system/dept → R<Void> */
export async function updateDept(data: SysDept): Promise<void> {
  return request<void>({ method: 'PUT', url: '/system/dept', data })
}

/** DELETE /system/dept/{id} → R<Void> */
export async function deleteDept(id: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/system/dept/${id}` })
}
```

**注意**：`listDeptTree()` 没有 `BackendPageResult` 包装，直接返回 `SysDept[]`；不导入 `PageQuery`/`PageResult`；无 `adaptPage()`。

### 9.9 api/post.ts

```typescript
/**
 * 岗位管理 API 层 —— 5 个 CRUD 函数。
 */
import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import type { SysPost, PostFilter } from '@/modules/system/types/post'

// ─── 后端分页原始形状 ───

interface BackendPageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

function adaptPage<T>(raw: BackendPageResult<T>): PageResult<T> {
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.pageNum,
    pageSize: raw.pageSize,
  }
}

// ═══════════════════════════════════════

/** POST /system/post/page?pageNum=&pageSize= + body 筛选 */
export async function pagePosts(
  page: PageQuery,
  filter: PostFilter,
): Promise<PageResult<SysPost>> {
  const raw = await request<BackendPageResult<SysPost>>({
    method: 'POST',
    url: '/system/post/page',
    params: page,
    data: filter,
  })
  return adaptPage(raw)
}

/** GET /system/post/{id} */
export async function getPost(id: string): Promise<SysPost> {
  return request<SysPost>({ method: 'GET', url: `/system/post/${id}` })
}

/** POST /system/post → R<Long> */
export async function createPost(data: SysPost): Promise<string> {
  return request<string>({ method: 'POST', url: '/system/post', data })
}

/** PUT /system/post → R<Void> */
export async function updatePost(data: SysPost): Promise<void> {
  return request<void>({ method: 'PUT', url: '/system/post', data })
}

/** DELETE /system/post/{id} → R<Void> */
export async function deletePost(id: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/system/post/${id}` })
}
```

### 9.10 api/user.spec.ts — 测试用例设计

严格沿 `dict.spec.ts` 模式。共 7 个测试：

| # | 测试 | 验证点 |
|---|------|--------|
| 1 | `pageUsers` 正常分页 | `POST /system/user/page`，`params` + `data`，`adaptPage` records→list |
| 2 | `pageUsers` filter 为空 | `data: {}` 不抛异常 |
| 3 | `getUser(id)` | `GET /system/user/1`，返回值相等 |
| 4 | `createUser(UserFormRequest)` | `POST /system/user`，body 含 `plainPassword`，返回 string ID |
| 5 | `createUser` 不含 plainPassword | body 不含 `plainPassword` 不抛异常 |
| 6 | `updateUser(UserFormRequest)` | `PUT /system/user`，body 含 `id` + `plainPassword`，返回 void |
| 7 | `deleteUser(id)` | `DELETE /system/user/1`，返回 void |

### 9.11 api/role.spec.ts — 测试用例设计

共 6 个测试：

| # | 测试 | 验证点 |
|---|------|--------|
| 1 | `pageRoles` 正常分页+筛选 | `POST /system/role/page`，`params` + `data`，adaptPage |
| 2 | `pageRoles` filter 为空 | `data: {}` |
| 3 | `getRole(id)` | `GET /system/role/1` |
| 4 | `createRole(SysRole)` | `POST /system/role`，body 含 `code`，返回 string ID |
| 5 | `updateRole(SysRole)` | `PUT /system/role`，body 含 `id` |
| 6 | `deleteRole(id)` | `DELETE /system/role/1` |

### 9.12 api/dept.spec.ts — 测试用例设计

共 6 个测试（tree 端点替代 page）：

| # | 测试 | 验证点 |
|---|------|--------|
| 1 | `listDeptTree` 返回列表 | `GET /system/dept/tree`，返回数组含 `parentId` |
| 2 | `listDeptTree` 空列表 | `GET /system/dept/tree` 返回 `[]` |
| 3 | `getDept(id)` | `GET /system/dept/1` |
| 4 | `createDept(SysDept)` | `POST /system/dept`，body 含 `parentId`，返回 string ID |
| 5 | `updateDept(SysDept)` | `PUT /system/dept`，body 含 `id` |
| 6 | `deleteDept(id)` | `DELETE /system/dept/1` |

### 9.13 api/post.spec.ts — 测试用例设计

共 6 个测试：

| # | 测试 | 验证点 |
|---|------|--------|
| 1 | `pagePosts` 正常分页+筛选 | `POST /system/post/page`，`params` + `data`，adaptPage |
| 2 | `pagePosts` filter 为空 | `data: {}` |
| 3 | `getPost(id)` | `GET /system/post/1` |
| 4 | `createPost(SysPost)` | `POST /system/post`，body 含 `code`，返回 string ID |
| 5 | `updatePost(SysPost)` | `PUT /system/post`，body 含 `id` |
| 6 | `deletePost(id)` | `DELETE /system/post/1` |

### 9.14 验证命令

```bash
cd /data/reasonix/files/Smart-WorkFlow-Web

# 第一步：类型检查
pnpm typecheck

# 第二步：lint（含架构边界规则）
pnpm lint

# 第三步：单元测试（全量，确认基线不漂移）
pnpm test

# 如果以上全部通过，再跑 build 确认
pnpm build
```

## 10. 关键实现约束

1. **每个 API 文件必须本地定义 `BackendPageResult<T>` + `adaptPage()`** — 不提取共享模块（沿现有 `dict.ts`/`form-def.ts`/`workflow/index.ts` 各自内联的模式）
2. **Dept API 不含 `BackendPageResult`/`adaptPage`/`PageQuery`/`PageResult` 导入** — `listDeptTree()` 直接返回 `SysDept[]`
3. **User API 的 create/update 使用 `UserFormRequest` 类型** — 不是 `SysUser`
4. **User API 的 `pageUsers()` 的 body 用 `UserFilter`** — 不是 `UserFormRequest`（page 不需要 plainPassword）
5. **`id` 字段统一 `string` 类型** — 对齐后端雪花 ID → Jackson LongToString
6. **`isAdmin` 和 `builtIn` 使用 `boolean`** — 对齐前端 superAdmin 布尔约定
7. **`children?: SysDept[]` 仅在 types/dept.ts 中定义** — 这是前端树形渲染字段，后端不返回
8. **Spec 文件 `vi.mock` 必须在 `import` 之前放在文件顶部** — 沿 `dict.spec.ts` 模式
9. **Spec 文件 `describe` 名称格式**：`modules/system/api/{entity} — {中文名} N 个`
10. **不创建 barrel 文件** — 与现有 dict 模式一致（单文件直接 import）

## 11. 边界情况

| # | 场景 | 处理 |
|---|------|------|
| 1 | `pageUsers` filter 为空对象 `{}` | 正常发送 `data: {}`，后端 `@RequestBody(required = false)` 接受 |
| 2 | `UserFormRequest.plainPassword` 为 `undefined` | 正常发送，body 不含该字段，后端 `plainPassword` 为 null |
| 3 | `listDeptTree()` 返回空数组 `[]` | 正常返回 `[]`，前端组件自行处理空树渲染 |
| 4 | `create*` 返回的 ID 是数字字符串 | `request<string>` 泛型正确，`typeof result === 'string'` |
| 5 | `update*`/`delete*` 返回 `void` | `request<void>` 泛型正确，`result === undefined` |
| 6 | TypeScript 编译：`SysDept` 的 `children` 可选字段 | 后端不返回，运行时为 `undefined`，前端 `flat→tree` 转换时注入 |

## 12. 风险和回滚方案

| 风险 | 概率 | 影响 | 缓解 |
|------|:----:|------|------|
| TypeScript 类型与后端实体字段不对齐 | 低 | 编译通过但运行时字段映射错误 | types 严格镜像实体字段名（驼峰），不自行重命名 |
| `adaptPage` 本地重复定义导致未来不一致 | 低 | 各 API 文件适配逻辑分化 | 明确约束：全部内联同一模式，code review 可见 |
| `pnpm typecheck` 因新类型引入未使用变量告警 | 低 | 新增告警 | types 文件只 export interface，不产生运行时代码，不会触发 unused-var |

回滚：删除 12 个新建文件即完全回滚。不影响已有功能。

## 13. 测试方案

### 13.1 静态检查

- `pnpm typecheck` 退出码 0（零类型错误）
- `pnpm lint` 退出码 0（零 lint 告警，含架构边界规则）
- `grep -r "from 'axios'" src/modules/system/api/user.ts src/modules/system/api/role.ts src/modules/system/api/dept.ts src/modules/system/api/post.ts` 零命中（硬约束：禁直引 axios）

### 13.2 单元测试

- **user.spec.ts**：7 个测试用例（§9.10）
- **role.spec.ts**：6 个测试用例（§9.11）
- **dept.spec.ts**：6 个测试用例（§9.12）
- **post.spec.ts**：6 个测试用例（§9.13）
- 合计新增 **25 个测试用例**

### 13.3 集成测试

无。此 Step 为纯类型 + API 函数 + 单元测试，不涉及组件渲染或端到端交互。集成测试在 F2（Vue 视图）中进行。

### 13.4 手工验证

无需。纯逻辑层无 UI，`pnpm test` 覆盖全部 API 函数行为。

### 13.5 回归检查

- `pnpm test` 全量测试计数 **不应减少**（基线约 38 spec files / 352 tests）
- 预期新基线：**42 spec files / ~377 tests**（+4 spec files, +25 tests）
- dict.spec.ts 的 10 个测试必须全部通过（零回归）

## 14. 验收标准

逐条列出，必须是可验证的布尔条件：

| 编号 | 条件 |
|:----:|------|
| **F1-1** | `types/user.ts` 存在，含 `SysUser`、`UserFormRequest`、`UserFilter` 三个接口 |
| **F1-2** | `types/role.ts` 存在，含 `SysRole`、`RoleFilter` 接口，`builtIn` 为 `boolean` |
| **F1-3** | `types/dept.ts` 存在，含 `SysDept` 接口（含 `children?: SysDept[]`），`parentId` 为 `string` |
| **F1-4** | `types/post.ts` 存在，含 `SysPost`、`PostFilter` 接口 |
| **F1-5** | `api/user.ts` 存在，含 `pageUsers`/`getUser`/`createUser`/`updateUser`/`deleteUser` 5 个导出函数，`createUser`/`updateUser` 使用 `UserFormRequest` 参数 |
| **F1-6** | `api/role.ts` 存在，含标准 5 个 CRUD 导出函数 |
| **F1-7** | `api/dept.ts` 存在，含 `listDeptTree`/`getDept`/`createDept`/`updateDept`/`deleteDept` 5 个导出函数，**不含** `adaptPage`/`BackendPageResult` |
| **F1-8** | `api/post.ts` 存在，含标准 5 个 CRUD 导出函数 |
| **F1-9** | 4 个 spec 文件存在，共 25 个测试用例（user 7 + role 6 + dept 6 + post 6） |
| **F1-10** | `pnpm typecheck` 退出码 0 |
| **F1-11** | `pnpm lint` 退出码 0 |
| **F1-12** | `pnpm test` 退出码 0，所有新增和已有测试全绿 |
| **F1-13** | `pnpm test` 总 spec files 数 42（38 基线 + 4 新增），tests 数 ≥ 377（352 基线 + 25 新增） |
| **F1-14** | `grep -r "from 'axios'"` 在 4 个新 API 文件中零命中 |
| **F1-15** | 无 barrel 文件（`api/index.ts`、`types/index.ts`）被创建 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step F1

## 1. Step 编号和名称

## 2. 使用模型

## 3. 实际读取的文件
（逐文件列出）

## 4. 实际修改的文件
（逐文件列出，新建/修改区分）

## 5. 每个文件的修改摘要
（每个文件的行数、导出项、关键设计点）

## 6. 实际执行的命令
（逐条列出命令及参数）

## 7. 命令输出摘要
（typecheck/lint/test/build 各阶段结果、退出码）

## 8. 与原方案的偏差
（哪些地方和方案不同，为什么）

## 9. 遇到的问题
（技术问题、环境问题、理解偏差等，以及如何解决的）

## 10. 未完成内容
（方案中要求但实际未完成的内容，及原因）

## 11. 验收标准对照
（逐条对照 §14 的 F1-1 ~ F1-15 回答是否满足）

## 12. 测试计数
- typecheck: 通过/失败
- lint: 通过/失败
- test: X spec files / Y tests total, 全绿/有失败
- 新增: +4 spec files / +25 tests

## 13. 风险和注意事项
```

## 16. 测试回执格式

此 Step 为纯逻辑层（类型 + API + 单测），无 UI。`pnpm test` 的输出即测试回执。如 `pnpm test` 全部通过且测试计数符合预期（+4 files / +25 tests），即为测试通过。

如测试未通过，请提供完整的失败信息和堆栈。

## 17. 明确禁止事项

- ❌ 不要创建 barrel 文件（`api/index.ts`、`types/index.ts`）
- ❌ 不要在 `api/dept.ts` 中定义 `BackendPageResult` 或 `adaptPage`（部门不用分页）
- ❌ 不要在 `api/user.ts` 的 `createUser`/`updateUser` 中使用 `SysUser` 类型 — 必须用 `UserFormRequest`
- ❌ 不要修改 `dict.ts` / `dict.spec.ts` 或任何已有文件
- ❌ 不要触碰 `Smart-WorkFlow/` 后端代码
- ❌ 不要创建 Vue 组件文件（那是 F2 的工作）
- ❌ 不要在 types 中包含 `password` 字段（SysUser 列表不返回密文）
- ❌ 不要在 types 中包含 `deleted`/`version`/`tenantId`（噪音列，前端不需要）
- ❌ 不要使用 `any` 类型 — 所有类型必须显式声明
- ❌ 不要使用 `import axios from 'axios'` 或任何直接 axios 引用
