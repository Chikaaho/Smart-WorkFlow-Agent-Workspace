# Step F1：前端登录契约更新 + token 到期戳 + beforeHandler 单飞刷新 + refresh/logout 接真端点 + guard 冷启动续登

> 所属功能：auth-seam-completion（后端 seam 收尾 → 前端 seam 点亮）
> 域：**纯前端**（只改 `Smart-WorkFlow-Web/`，禁止触碰后端）
> 本方案按根目录 system.md §6 的 17 项结构生成。
> **前置**：后端 B1-B4 全部 PASSED ✅，`/auth/login` 返回 `R<{accessToken, expiresIn}>` + Set-Cookie rt，`/auth/refresh` + `/auth/logout` 端点已就位。

---

## 1. 当前状态

后端 B4 ✅ PASSED（462 tests BUILD SUCCESS，家族撤销事务回滚已修复）。前端 auth 模块当前状态：

| 模块 | 当前状态 |
|------|----------|
| `foundation/auth/token.ts` | 仅存 `accessToken` + `lastUsername`，无到期戳 |
| `foundation/auth/index.ts` | `login()` 返回 `R<string>`（裸 token），`refresh()` 抛 `NOT_IMPLEMENTED`，`logout()` 仅清本地态 |
| `foundation/request/index.ts` | 请求拦截器仅注入 Bearer token，无前置刷新逻辑；`AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING` 缺 `/auth/logout` |
| `router/guard.ts` | 冷启动 `refresh()` 必失败→重定向 `/login` |
| `LoginPage.vue` | 使用 `useAuth().login()`，不受内部实现变更影响 |
| `AppTopbar.vue` | 退出调用 `useAuth().logout()`，不受内部实现变更影响 |

后端新契约（B2 已就位）：
- `POST /api/auth/login` → `R<{accessToken: string, expiresIn: number}>` + `Set-Cookie: rt=<refreshToken>; Path=/api/auth/; HttpOnly; SameSite=Lax; Max-Age=604800`
- `POST /api/auth/refresh` → `R<{accessToken: string, expiresIn: number}>` + 新 `Set-Cookie: rt=...`（cookie 自动携带旧 rt，服务端轮换）
- `POST /api/auth/logout` → `R<null>` + `Set-Cookie: rt=; Max-Age=0`（清除 cookie），幂等
- access 过期：900s（15min），refresh 过期：604800s（7d）

F1 是本功能的前端第一步，第二步 F2 补 mock + 回归测试调整。

## 2. Step 目标

将前端 auth 模块从「占位 seam」升级为「连接真实后端双 token 认证」：

1. **登录契约更新**：`login()` 消费 `R<{accessToken, expiresIn}>` 替代 `R<string>`，计算 `expiresAt` 到期戳
2. **refresh 实现**：`refresh()` 调 `POST /auth/refresh`（cookie 自动携带），单飞去重，成功后更新内存 token
3. **logout 接真端点**：`logout()` 调 `POST /auth/logout` 通知后端撤销 refresh token，始终清除本地态
4. **beforeHandler 单飞刷新**：请求拦截器在 token 到期前 60s 自动触发 refresh，多个并发请求共享同一次 refresh 调用
5. **guard 冷启动续登**：页面刷新后 `refresh()` 成功→免登录直接进入，失败→重定向 `/login`
6. **D17 不变量等价改写**：access 不进 storage + refresh 仅 httpOnly

## 3. 推荐模型

```
推荐模型：deepseek-v4-pro
选择理由：涉及跨项目协议变更（TokenResponse 形状）、请求拦截器单飞去重（并发正确性）、cookie 认证（httpOnly 不可读）+ guard 冷启动流程（路由守卫+token+refresh 三者时序），多项需要系统性权衡
是否触发升级条件：是 — 涉及前后端协议变更 + 请求拦截器并发安全
```

## 4. 模型选择理由

F1 不是简单 CRUD 页面，而是修改整个应用的认证基础设施层：token 存储模型变更（引入到期戳）、请求拦截器增加异步 refresh 前置逻辑（单飞去重）、guard 冷启动路径行为变更。基础设施层修改对正确性要求极高——单飞锁泄露会导致并发刷新风暴，guard 时序错误会导致无限重定向。选择 Pro 确保方案推理充分。

## 5. 已知上下文

- **双 token 设计（D26/D27）**：access 短期 JWT（900s），前端仅内存；refresh 长期不透明串（7d），httpOnly + Secure + SameSite cookie，JS 不可读，浏览器自动携带
- **cookie Path=/api/auth/**：只有 `/api/auth/*` 路径的请求浏览器才自动发送 rt cookie。`/api/system/auth/me` 和 `/api/system/auth/menus` 不触发 cookie 发送——正确行为
- **单一请求层（硬约束）**：业务代码禁直引 axios，全部走 `foundation/request` 的 `request<T>()`。ESLint `no-restricted-imports` 规则强制
- **token.ts ↔ request 单向依赖**：`request → auth/token`（request 读 token 注入 header），`auth/token` 禁引 `request`。违反→循环依赖
- **依赖注入模式（已有先例）**：`unauthorizedHandler` 通过 `setUnauthorizedHandler()` 注入（`router/index.ts`→`request/index.ts`），避免 `request` 直接引 `router`。F1 的 `refreshHandler` 复用此模式
- **暗态 gating**：权限集为空时 `v-perm` 放行展示，后端权限装配上线后自然切回。F1 不改变此行为
- **Element Plus 自动导入**：`ElMessage` 等 API 自动引入，`modules/*` 不出现 `element-plus` import
- **TypeScript strict**（`erasableSyntaxOnly: true`）：禁用 `enum`/`namespace`/构造器参数属性
- **CSP**：`script-src 'self'`（禁 inline/eval），`connect-src 'self'`（fetch 仅同源）
- **前端 system.md §2.1 四连校验门**：`pnpm typecheck && pnpm lint && pnpm test && pnpm build` 是唯一有效完成判定
- **前端 system.md §0.0 执行层角色约束**：执行代理严格执行方案，发现问题记录回执，不得越权规划

## 6. 执行前必须读取的文件

1. `src/foundation/auth/token.ts` — 当前 token 存储（3 个变量，4 个函数，约 30 行）
2. `src/foundation/auth/index.ts` — 当前 login/logout/refresh/useAuth（约 60 行）
3. `src/foundation/request/index.ts` — axios 实例 + 拦截器 + `request<T>()` + `unauthorizedHandler`（约 120 行）
4. `src/router/index.ts` — 路由定义 + `setUnauthorizedHandler` 注入点（约 80 行）
5. `src/router/guard.ts` — authGuard + clearDynamicRoutes（约 120 行）
6. `src/views/LoginPage.vue` — 登录页（确认 `useAuth().login()` 调用方式）
7. `src/layouts/components/AppTopbar.vue` — 顶栏退出按钮（确认 `useAuth().logout()` 调用方式）
8. `src/foundation/session/index.ts` — loadSession()（确认返回类型）
9. `src/foundation/menu/index.ts` — loadMenu()（确认返回类型）
10. `src/contracts/common.ts` — `ApiResponse<T>` 类型
11. `src/contracts/session.ts` — Session 契约（不可变字段）

## 7. 允许修改的文件范围

| # | 文件 | 改动类型 |
|---|------|:--:|
| 1 | `src/foundation/auth/token.ts` | **修改** — 新增 `expiresAt` + `isTokenNearExpiry()` + `setTokenResponse()` + `clearToken()` |
| 2 | `src/foundation/auth/index.ts` | **修改** — 新增 `TokenResponse` DTO + 单飞 `refresh()` 真实实现 + `login()` 契约适配 + `logout()` 接端点 |
| 3 | `src/foundation/request/index.ts` | **修改** — 新增 `refreshHandler` 注入 + 请求拦截器到期刷新 + `AUTH_ENDPOINTS` 追加 `/auth/logout` |
| 4 | `src/router/index.ts` | **修改** — 新增 `setRefreshHandler(refresh)` 调用 |
| 5 | `src/router/guard.ts` | **修改** — 冷启动注释更新（行为已自动修复，仅同步注释） |
| 6 | `src/foundation/auth/__tests__/token.spec.ts` | **新建** — token 到期戳 + 不变量测试 |
| 7 | `src/foundation/auth/__tests__/index.spec.ts` | **新建** — login/refresh/logout 单元测试 |
| 8 | `src/router/guard.spec.ts` | **修改** — 冷启动 refresh 成功路径 + 失败路径 |

## 8. 禁止修改的范围

- ❌ 任何后端 `Smart-WorkFlow/**`
- ❌ `src/foundation/mock/` — F2 专属
- ❌ `src/foundation/session/` — session 契约不变
- ❌ `src/foundation/menu/` — 菜单不变
- ❌ `src/foundation/permission/` — 权限不变
- ❌ `src/stores/` — Pinia store 不变
- ❌ `src/contracts/session.ts` — 字段已锁定
- ❌ `src/views/LoginPage.vue` — 登录页通过 `useAuth().login()` 间接调用，不受内部变更影响
- ❌ `src/layouts/components/AppTopbar.vue` — 退出通过 `useAuth().logout()` 间接调用
- ❌ `src/security/` — CSP/SafeHtml/safe-eval 不变
- ❌ `vite.config.ts` / `tsconfig.*.json` / `eslint.config.js` — 构建配置不变
- ❌ `package.json` — 不新增依赖
- ❌ 不新建 `contracts/auth.ts` — `TokenResponse` 是 DTO（定义在 `auth/index.ts` 内部），不提升为契约

## 9. 详细执行方案

### 9.1 修改 `src/foundation/auth/token.ts` — token 到期戳

**当前代码**（约 30 行）：
```typescript
let accessToken: string | null = null
let lastUsername: string | null = null

export function getAccessToken(): string | null { return accessToken }
export function setAccessToken(token: string | null): void { accessToken = token }
export function getCurrentUsername(): string | null { return lastUsername }
export function setCurrentUsername(username: string | null): void { lastUsername = username }
```

**修改后**（新增 6 个导出 + 2 个内部变量）：

```typescript
let accessToken: string | null = null
let expiresAt: number | null = null  // ← 新增：到期时间戳（毫秒，Date.now() + expiresIn*1000）
let lastUsername: string | null = null

/** 提前刷新阈值：到期前 60 秒即触发刷新 */
const EXPIRY_BUFFER_MS = 60_000

// === 保留的已有导出（不改签名） ===
export function getAccessToken(): string | null { return accessToken }
export function setAccessToken(token: string | null): void { accessToken = token }
export function getCurrentUsername(): string | null { return lastUsername }
export function setCurrentUsername(username: string | null): void { lastUsername = username }

// === 新增导出 ===

/** 获取 token 到期时间戳（毫秒），null 表示无 token */
export function getTokenExpiresAt(): number | null { return expiresAt }

/** token 是否即将到期（到期前 60s 内或已到期） */
export function isTokenNearExpiry(): boolean {
  if (expiresAt === null) return false
  return Date.now() >= expiresAt - EXPIRY_BUFFER_MS
}

/** 一次性设置 token + 到期戳 + 用户名，用于 login 和 refresh 成功回调 */
export function setTokenResponse(token: string, expiresInSeconds: number, username?: string): void {
  accessToken = token
  expiresAt = Date.now() + expiresInSeconds * 1000
  if (username !== undefined) {
    lastUsername = username
  }
}

/** 清除全部 token 状态（login 用 setTokenResponse(username) 已有用户名，不影响退出清除） */
export function clearToken(): void {
  accessToken = null
  expiresAt = null
  lastUsername = null
}
```

**关键约束**：
- `setAccessToken` 保留（不改签名），用于不需要到期戳的极简场景。F1 中 login/refresh 统一使用新的 `setTokenResponse`
- `EXPIRY_BUFFER_MS = 60_000`（60 秒）——在 900s 的 access token 生命周期中，提前 60s 刷新意味着请求在到期前 1 分钟内触发刷新，足够覆盖正常请求间隔
- `clearToken()` 清除全部三项（`accessToken` + `expiresAt` + `lastUsername`），供 `logout()` 使用

### 9.2 修改 `src/foundation/auth/index.ts` — login/refresh/logout 真实实现

**当前代码结构**（约 60 行）：

```typescript
import { request } from '@/foundation/request'
import { getAccessToken, setAccessToken, getCurrentUsername, setCurrentUsername } from './token'

export interface LoginPayload {
  username: string
  password: string
}

export async function login(payload: LoginPayload): Promise<void> {
  const token = await request<string>({ method: 'POST', url: '/auth/login', data: payload })
  setCurrentUsername(payload.username)
  setAccessToken(token)
}

export async function logout(): Promise<void> {
  setAccessToken(null)
  setCurrentUsername(null)
}

export async function refresh(): Promise<void> {
  throw new Error('NOT_IMPLEMENTED: /auth/refresh seam')
}

export function useAuth() { /* ... */ }
```

**修改后**：

```typescript
import { request } from '@/foundation/request'
import {
  getAccessToken,
  getCurrentUsername,
  setTokenResponse,
  clearToken,
} from './token'

// ========== DTO（后端形状，不提升为 contract） ==========

interface TokenResponseDTO {
  accessToken: string
  expiresIn: number
}

// ========== 单飞锁 ==========

let refreshPromise: Promise<void> | null = null

// ========== 公开 API ==========

export interface LoginPayload {
  username: string
  password: string
}

export async function login(payload: LoginPayload): Promise<void> {
  const data = await request<TokenResponseDTO>({
    method: 'POST',
    url: '/auth/login',
    data: payload,
  })
  setTokenResponse(data.accessToken, data.expiresIn, payload.username)
}

export async function logout(): Promise<void> {
  try {
    await request<null>({ method: 'POST', url: '/auth/logout' })
  } finally {
    clearToken()
  }
}

export async function refresh(): Promise<void> {
  // 单飞：如果已有 refresh 在进行中，等它完成
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const data = await request<TokenResponseDTO>({
        method: 'POST',
        url: '/auth/refresh',
      })
      setTokenResponse(data.accessToken, data.expiresIn)
    } finally {
      // 无论成败，释放单飞锁。失败时调用方（请求拦截器/guard）各自处理异常
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export function useAuth() {
  return {
    getAccessToken,
    getCurrentUsername,
    login,
    logout,
    refresh,
  }
}
```

**关键改动说明**：

| 改动点 | 旧 | 新 | 理由 |
|--------|----|----|------|
| `login` 响应类型 | `request<string>` | `request<TokenResponseDTO>` | 后端 B2 已将 login 响应从裸 token 改为 `{accessToken, expiresIn}` |
| `login` token 存储 | `setAccessToken(token)` | `setTokenResponse(data.accessToken, data.expiresIn, payload.username)` | 一次调用同时设置 token + 到期戳 + 用户名 |
| `refresh` 实现 | `throw NOT_IMPLEMENTED` | 调 `POST /auth/refresh`，单飞去重 | 后端 B2 端点已就位；单飞防止并发请求触发多次 refresh |
| `refresh` token 存储 | N/A | `setTokenResponse(data.accessToken, data.expiresIn)` | refresh 只更新 token + 到期戳，不覆盖用户名（refresh cookie 不含用户名信息） |
| `logout` 后端调用 | 无 | `request<null>({ method: 'POST', url: '/auth/logout' })` | 通知后端撤销 refresh token + 清除 cookie |
| `logout` 本地清除 | `setAccessToken(null)` + `setCurrentUsername(null)` | `clearToken()` | 一次调用清除全部三项 |
| `logout` 异常处理 | 无 | `try...finally` — 无论后端调用成败都清除本地态 | 网络断开时 logout 仍应清除本地 token，否则用户卡在"半登出"状态 |

**单飞锁行为**：
- 首个调用者创建 `refreshPromise`，执行 POST /auth/refresh
- 后续并发调用者 `await refreshPromise`，共享同一个 HTTP 调用
- 成功后所有调用者返回，各自从 `getAccessToken()` 读取新 token
- 失败后所有调用者收到同一异常，由调用方（guard 或请求拦截器）处理
- `finally` 块确保锁释放（即使 refresh 失败），下次调用可重试

### 9.3 修改 `src/foundation/request/index.ts` — 请求拦截器到期刷新

**当前代码关键片段**（约 120 行）：

```typescript
import { getAccessToken } from '@/foundation/auth/token'

const AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING = ['/auth/login', '/auth/refresh']

// ... axios 实例 ...

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ... 响应拦截器 ...

type UnauthorizedHandler = (redirectPath: string) => void
let unauthorizedHandler: UnauthorizedHandler | null = null
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}
```

**修改后**：

```typescript
import { getAccessToken, isTokenNearExpiry } from '@/foundation/auth/token'

// 补充 /auth/logout：logout 自身的 401 不走全局跳登录处理
const AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING = ['/auth/login', '/auth/refresh', '/auth/logout']

// ========== refreshHandler 依赖注入（避免 request ↔ auth/index 循环依赖） ==========

type RefreshHandler = () => Promise<void>
let refreshHandler: RefreshHandler | null = null

export function setRefreshHandler(handler: RefreshHandler): void {
  refreshHandler = handler
}

// ========== 请求拦截器（异步：支持到期前自动刷新） ==========

client.interceptors.request.use(async (config) => {
  const url = config.url ?? ''
  const isAuthEndpoint = AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING.some(
    (path) => url.includes(path),
  )

  // 到期前刷新：只在非 auth 端点、有 token、即将到期时触发
  if (!isAuthEndpoint && getAccessToken() && isTokenNearExpiry()) {
    if (refreshHandler) {
      try {
        await refreshHandler()
      } catch {
        // refresh 失败 → 不清除 token（让响应拦截器的 401 统一处理跳登录）
        // 不做任何事，请求带着旧/过期 token 发出，后端返回 401 后正常跳登录
      }
    }
  }

  // 注入 Bearer token（可能是 refresh 后的新 token，或旧/过期 token）
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ========== 响应拦截器（不变 — 保留已有 401 处理） ==========

// ... 不变 ...
```

**关键约束**：

- **循环依赖规避（硬约束）**：`foundation/request` 不直接 import `refresh`（`auth/index`），而是通过 `setRefreshHandler()` 注入。依赖方向：`auth/index → request`（auth 调用 request 发 HTTP），`router/index → request`（router 注入 refreshHandler），`request → auth/token`（request 读 token）。无环。
- **`isAuthEndpoint` 检查**：`/auth/login`、`/auth/refresh`、`/auth/logout` 三个端点跳过到期刷新。否则 refresh 自身调用 `request()` 时会触发拦截器再调 refresh → 无限递归。
- **refresh 失败处理**：在拦截器中静默吞掉 refresh 异常。请求带着旧/过期 token 发出 → 后端返回 401 → 响应拦截器触发 `unauthorizedHandler` → 跳 `/login`。不在此处直接跳登录——保持职责分离（拦截器只管 token 注入，401 跳转由响应拦截器统一处理）。
- **`withCredentials`**：不需要。开发模式下 Vite 代理 `/api`→`localhost:8080`，浏览器视为同源，cookie 自动发送。生产部署如跨域需额外配置 `withCredentials: true` + 后端 CORS 头，此为独立运维配置项，非本 Step 范围。

### 9.4 修改 `src/router/index.ts` — 注入 refreshHandler

**当前代码**（约第 40-50 行，`setUnauthorizedHandler` 调用处）：

```typescript
import { setUnauthorizedHandler } from '@/foundation/request'
// ...
setUnauthorizedHandler((redirectPath) => {
  clearDynamicRoutes(router)
  router.push({
    path: '/login',
    query: redirectPath && redirectPath !== '/login' ? { redirect: redirectPath } : undefined,
  })
})
```

**修改后**（在 `setUnauthorizedHandler` 调用之后追加）：

```typescript
import { setUnauthorizedHandler, setRefreshHandler } from '@/foundation/request'
import { refresh } from '@/foundation/auth'
// ...
setUnauthorizedHandler((redirectPath) => {
  clearDynamicRoutes(router)
  router.push({
    path: '/login',
    query: redirectPath && redirectPath !== '/login' ? { redirect: redirectPath } : undefined,
  })
})

// 注入 refresh 函数供请求拦截器到期刷新使用（依赖反转，避免循环依赖）
setRefreshHandler(refresh)
```

### 9.5 修改 `src/router/guard.ts` — 冷启动注释更新

**当前代码**（约第 35-45 行）：

```typescript
if (!getAccessToken()) {
  try {
    // 冷启动静默刷新：seam 当前必失败（无端点），真端点落地后此分支用于免登录直接进入。
    await refresh()
  } catch {
    next(loginRedirectTarget(to))
    return
  }
}
```

**修改后**（代码不变，仅更新注释）：

```typescript
if (!getAccessToken()) {
  try {
    // 冷启动静默续登：浏览器自动携带 rt cookie 调 /auth/refresh，
    // 成功后 access 回到内存，继续加载 session + menu 构建动态路由。
    await refresh()
  } catch {
    // refresh 失败（无 cookie / 已过期 / 已撤销）→ 重定向登录页
    next(loginRedirectTarget(to))
    return
  }
}
```

**说明**：代码逻辑不变——`refresh()` 成功→继续路由构建，失败→跳登录。只是现在 `refresh()` 有了真实实现，冷启动续登路径从"必失败"变为"按 cookie 有效期可能成功"。

### 9.6 新建测试文件 `src/foundation/auth/__tests__/token.spec.ts`

（注意：前端测试目录惯例使用 `__tests__/` 或与源文件同级 `.spec.ts`，遵循项目已有的 `router/guard.spec.ts` 和 `foundation/session/index.spec.ts` 模式——即与源文件同级目录放置 `.spec.ts`。但 `foundation/auth/token.ts` 目前没有测试，项目内也无 `__tests__/` 目录。**保持一致：将 spec 文件放于 `foundation/auth/` 目录下，与源文件同级。**）

若项目中已有 `__tests__/` 约定（请阅读确认），则遵循之。以下按与源文件同级的 `.spec.ts` 文件列出。

**测试文件**：`src/foundation/auth/token.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAccessToken,
  setAccessToken,
  getCurrentUsername,
  setCurrentUsername,
  getTokenExpiresAt,
  isTokenNearExpiry,
  setTokenResponse,
  clearToken,
} from './token'

describe('token storage', () => {
  beforeEach(() => {
    clearToken()
  })

  describe('setTokenResponse', () => {
    it('should set access token, expiresAt, and username', () => {
      setTokenResponse('test-token', 900, 'admin')
      expect(getAccessToken()).toBe('test-token')
      expect(getTokenExpiresAt()).toBeGreaterThan(Date.now())
      expect(getTokenExpiresAt()).toBeLessThanOrEqual(Date.now() + 900_000)
      expect(getCurrentUsername()).toBe('admin')
    })

    it('should not overwrite username when not provided', () => {
      setTokenResponse('t1', 900, 'alice')
      expect(getCurrentUsername()).toBe('alice')
      setTokenResponse('t2', 900) // refresh 场景：不传 username
      expect(getAccessToken()).toBe('t2')
      expect(getCurrentUsername()).toBe('alice') // 用户名保持
    })
  })

  describe('isTokenNearExpiry', () => {
    it('should return false when no token', () => {
      expect(isTokenNearExpiry()).toBe(false)
    })

    it('should return false when token far from expiry', () => {
      setTokenResponse('t', 900)
      expect(isTokenNearExpiry()).toBe(false)
    })

    it('should return true when token within 60s buffer', async () => {
      // 设置已过期 30 秒前的 token
      const { setTokenResponse } = await import('./token')
      // 使用内部变量直接 set 来模拟近到期状态
      setAccessToken('near-expiry')
      setTokenResponse('near-expiry', 0) // 0 秒 → 立即视为近到期
      expect(isTokenNearExpiry()).toBe(true)
    })
  })

  describe('clearToken', () => {
    it('should clear all token state', () => {
      setTokenResponse('t', 900, 'admin')
      clearToken()
      expect(getAccessToken()).toBeNull()
      expect(getTokenExpiresAt()).toBeNull()
      expect(getCurrentUsername()).toBeNull()
    })
  })

  describe('invariant: token never in localStorage/sessionStorage', () => {
    it('setTokenResponse should not write to localStorage', () => {
      setTokenResponse('t', 900, 'admin')
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
    })

    it('setAccessToken should not write to localStorage', () => {
      setAccessToken('t')
      expect(localStorage.getItem('accessToken')).toBeNull()
    })

    it('clearToken should not touch localStorage', () => {
      localStorage.setItem('other-key', 'val')
      setTokenResponse('t', 900, 'admin')
      clearToken()
      expect(localStorage.getItem('other-key')).toBe('val') // 不影响其他 key
    })
  })
})
```

### 9.7 新建测试文件 `src/foundation/auth/index.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { login, logout, refresh } from './index'
import { getAccessToken, getCurrentUsername, getTokenExpiresAt, clearToken } from './token'

// Mock foundation/request
const mockRequest = vi.fn()
vi.mock('@/foundation/request', () => ({
  request: mockRequest,
}))

describe('auth operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearToken()
  })

  describe('login', () => {
    it('should call POST /auth/login and store token response', async () => {
      mockRequest.mockResolvedValueOnce({ accessToken: 'jwt-token', expiresIn: 900 })
      await login({ username: 'admin', password: 'admin123' })
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/login',
        data: { username: 'admin', password: 'admin123' },
      })
      expect(getAccessToken()).toBe('jwt-token')
      expect(getCurrentUsername()).toBe('admin')
      expect(getTokenExpiresAt()).toBeGreaterThan(Date.now())
    })

    it('should propagate login failure', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'))
      await expect(login({ username: 'admin', password: 'wrong' })).rejects.toThrow('Network error')
      expect(getAccessToken()).toBeNull()
    })
  })

  describe('logout', () => {
    it('should call POST /auth/logout and clear local state', async () => {
      mockRequest.mockResolvedValueOnce(null)
      await logout()
      expect(mockRequest).toHaveBeenCalledWith({ method: 'POST', url: '/auth/logout' })
      expect(getAccessToken()).toBeNull()
      expect(getCurrentUsername()).toBeNull()
    })

    it('should clear local state even if logout API fails', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'))
      await logout() // 不应抛异常
      expect(getAccessToken()).toBeNull()
      expect(getCurrentUsername()).toBeNull()
    })
  })

  describe('refresh', () => {
    it('should call POST /auth/refresh and update token', async () => {
      mockRequest.mockResolvedValueOnce({ accessToken: 'new-jwt', expiresIn: 900 })
      await refresh()
      expect(mockRequest).toHaveBeenCalledWith({ method: 'POST', url: '/auth/refresh' })
      expect(getAccessToken()).toBe('new-jwt')
    })

    it('should deduplicate concurrent calls (single-flight)', async () => {
      // 模拟慢速 refresh
      let resolveFirst: (value: unknown) => void
      const firstCall = new Promise((resolve) => { resolveFirst = resolve })
      mockRequest.mockReturnValueOnce(firstCall)

      const r1 = refresh()
      const r2 = refresh() // 并发：应共享 r1 的调用
      const r3 = refresh()

      resolveFirst!({ accessToken: 'shared-token', expiresIn: 900 })
      await Promise.all([r1, r2, r3])

      // mockRequest 只被调用一次（单飞）
      expect(mockRequest).toHaveBeenCalledTimes(1)
      expect(getAccessToken()).toBe('shared-token')
    })

    it('should release lock on failure and allow retry', async () => {
      mockRequest.mockRejectedValueOnce(new Error('refresh failed'))
      await expect(refresh()).rejects.toThrow('refresh failed')

      // 锁已释放，下一次调用可以重试
      mockRequest.mockResolvedValueOnce({ accessToken: 'retry-token', expiresIn: 900 })
      await refresh()
      expect(getAccessToken()).toBe('retry-token')
    })
  })
})
```

### 9.8 修改 `src/router/guard.spec.ts` — 冷启动测试更新

**当前测试**（约第 30-50 行，冷启动相关 case）：

```typescript
// 旧：refresh 必失败 → 断言重定向到 /login
```

需要新增/修改以下 case：

1. **冷启动 refresh 成功**（新）：`getAccessToken` 返回 null → `refresh` 成功 → 继续调用 `loadSession` + `loadMenu` → 构建路由
2. **冷启动 refresh 失败**（已有，保持）：`getAccessToken` 返回 null → `refresh` 抛异常 → 重定向 `/login?redirect=...`

具体实现参照现有 mock 模式（`vi.mock('@/foundation/auth', ...)` + `vi.mock('@/foundation/auth/token', ...)`）。

### 9.9 编译与测试验证

```bash
cd Smart-WorkFlow-Web
pnpm typecheck    # TypeScript 类型检查
pnpm lint         # ESLint（含架构边界规则）
pnpm test         # Vitest 单元测试
pnpm build        # 生产构建（含类型检查）
```

预期：
- `pnpm typecheck` 零错误
- `pnpm lint` 零告警（特别注意 `no-restricted-imports` 规则：`axios` 只能在 `foundation/request` 中出现）
- `pnpm test` 全量通过，新增 token.spec.ts + index.spec.ts 用例全绿
- `pnpm build` BUILD SUCCESS

## 10. 关键实现约束

- **循环依赖红线**：`foundation/request` 不直接 import `refresh`（`auth/index`）。使用 `setRefreshHandler()` 依赖注入。如执行代理发现循环依赖，请在回执中报告，不得自行改变架构
- **`token.ts` 禁引 `request`**：token.ts 是纯存储层，函数不能调用 HTTP。违反→循环依赖
- **单飞锁 `finally` 释放**：即使 refresh 失败也必须释放 `refreshPromise`，否则后续请求永远卡在等待已失败的 Promise
- **`isAuthEndpoint` 跳过刷新**：`/auth/login`、`/auth/refresh`、`/auth/logout` 三个端点不触发到期刷新。缺少此检查→无限递归
- **`logout` 的 `finally` 块**：无论后端调用成败都清除本地 token 态，防止"半登出"（本地 token 还在但后端 cookie 已清/网络断）
- **不引入新依赖**：`TransactionTemplate`/`Propagation` 等是后端概念，前端不涉及。不新增 npm 包
- **`TokenResponseDTO` 不提升为 contract**：这是后端 API 形状的临时 DTO，不是前端领域契约。`contracts/` 只放跨模块共享的稳定类型（如 `Session`、`MenuNode`）
- **不设 `withCredentials`**：开发模式同源代理自动发送 cookie。跨域部署是运维配置项，非本 Step 范围
- **请求拦截器 refresh 失败不跳登录**：让请求带着旧 token 发出，由响应拦截器 401 处理统一跳转。保持职责分离

## 11. 边界情况

- **无 cookie 的 refresh**：浏览器没有 rt cookie → 后端返回 401（"未提供 refresh token"）→ `refresh()` 抛 `ApiError` → 调用方（guard 或请求拦截器）处理
- **refresh 期间并发 N 个请求**：首个请求触发 `refresh()` 创建单飞锁，后续 N-1 个请求 `await refreshPromise`。refresh 成功后所有请求读取新 token 重放。需验证 `mockRequest` 只被调用一次
- **refresh 失败后重试**：单飞锁在 `finally` 中释放，下一次拦截器触发时重新调用 `refresh()`。无限重试不会发生（单次 refresh 失败后请求带着旧 token 发出→后端返回 401→跳登录）
- **login 响应中的 `expiresIn`**：后端返回的 `expiresIn` 值是 `accessExpireSeconds`（900）。使用 `Date.now() + expiresIn * 1000` 计算 `expiresAt`
- **Token 到期戳的时钟偏差**：客户端时钟与服务器可能不同步。`setTokenResponse` 使用客户端 `Date.now()` + 服务端 `expiresIn` 计算到期戳，不依赖服务端返回的绝对时间戳。偏差仅影响客户端的提前刷新时机（提前 60s 触发），不影响 token 有效性（服务端独立校验 JWT exp）
- **`setTokenResponse` 不传 username**：refresh 成功后只更新 token + 到期戳，不覆盖 `lastUsername`（refresh 时已登录用户不变）
- **`clearToken` vs `setAccessToken(null)`**：已有代码中可能有直接调 `setAccessToken(null)` 的地方（如 guard.spec.ts mock 中的 logout 实现）。F1 修改 `logout()` 改用 `clearToken()`，不影响外部调用方

## 12. 风险和回滚方案

- **风险 1：循环依赖**：`request/index.ts` import `refresh` 会形成 `auth/index → request → auth/index` 循环。缓解：使用 `setRefreshHandler` 依赖注入。验证方式：`pnpm typecheck` + `pnpm build` 不报循环依赖
- **风险 2：单飞锁泄露**：refresh 异常路径未释放 `refreshPromise`。缓解：`try...finally` 确保释放。测试：`index.spec.ts` 的 "release lock on failure" 用例
- **风险 3：无限递归刷新**：`/auth/refresh` 自身触发拦截器的 `isTokenNearExpiry` 分支。缓解：`isAuthEndpoint` 检查排除 `/auth/refresh`。验证：手动或集成测试确认 refresh 请求不触发二次 refresh
- **风险 4：cookie 在 dev 模式下不发送**：Vite 代理配置可能导致 cookie Path 不匹配。缓解：后端 `CookieUtils` 设置 `Path=/api/auth/`，与前端请求 `/api/auth/refresh` 匹配。若 dev 模式 cookie 不通，检查 Vite proxy 的 `cookieDomainRewrite` 配置。**此风险需要在执行回执中明确报告 cookie 是否正常工作**
- **回滚**：`git checkout -- src/foundation/auth/token.ts src/foundation/auth/index.ts src/foundation/request/index.ts src/router/index.ts src/router/guard.ts`。删除新建的 spec 文件。`token.ts` 的已有导出签名不变（`getAccessToken`/`setAccessToken`/`getCurrentUsername`/`setCurrentUsername` 保留了），`auth/index.ts` 的 `login`/`logout`/`refresh`/`useAuth` 签名不变，所以回滚不影响其他模块编译

## 13. 测试方案

### 13.1 静态检查

- `grep -r "localStorage" src/foundation/auth/` 确认无新增 `localStorage.setItem` 调用
- `grep -r "sessionStorage" src/foundation/auth/` 确认无新增 `sessionStorage.setItem` 调用
- `grep -r "from 'axios'" src/ --include="*.ts" --include="*.vue" | grep -v "foundation/request"` 零命中（axios 仅限 foundation/request）
- `grep "R<string>" src/foundation/auth/` 零命中（login 已改为 `R<TokenResponseDTO>`）
- `grep "throw new Error('NOT_IMPLEMENTED" src/foundation/auth/` 零命中（refresh 占位已替换）
- `grep "AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING" src/foundation/request/index.ts` 确认包含 `'/auth/logout'`

### 13.2 单元测试

| 测试文件 | 用例数 | 内容 |
|----------|:------:|------|
| `token.spec.ts`（新建） | ≥6 | `setTokenResponse` 设置三项、不传 username 不覆盖、`isTokenNearExpiry` 边界、`clearToken` 清除全部、不变量（无 localStorage 写入） |
| `index.spec.ts`（新建） | ≥6 | login 存 token+username、login 失败不存、logout 调 API+清除本地、logout 网络失败仍清除本地、refresh 更新 token、refresh 单飞去重（并发 3 次仅 1 次 HTTP）、refresh 失败释放锁可重试 |

### 13.3 集成测试

不要求新增。手动验证：

```bash
# 终端 1：启动后端
cd Smart-WorkFlow && cd sw-bootstrap && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 终端 2：启动前端
cd Smart-WorkFlow-Web && pnpm dev
```

手工验证清单：
1. 浏览器访问 `http://localhost:5173/login`，输入 admin/admin123 → 登录成功 → 跳转到首页
2. 打开 DevTools → Application → Cookies → 确认存在 `rt` cookie（HttpOnly: true, Path: /api/auth/）
3. 刷新页面 → 不应跳回登录页（冷启动 refresh 成功）
4. 等待 15 分钟或在 DevTools 中手动删除 access token（无法，因为仅内存）→ 发出请求 → 应自动 refresh
5. 点击退出 → 应清除本地 token + 后端 cookie
6. 退出后直接访问 `/system/user` → 应重定向到 `/login`

### 13.4 手工验证

同上 §13.3。

### 13.5 回归检查

- 已有测试总数基线：**203**（CONFIRMED 2026-07-22，来自 kb-verification）
- F1 新增测试：≥12 用例（token.spec.ts ≥6 + index.spec.ts ≥6）
- guard.spec.ts 已有用例数不应减少
- `pnpm lint` 已有告警数不应增加
- `pnpm typecheck` 零新增错误
- `pnpm build` BUILD SUCCESS

## 14. 验收标准（逐条可验证布尔条件）

1. `token.ts` 新增 `getTokenExpiresAt()` / `isTokenNearExpiry()` / `setTokenResponse()` / `clearToken()` 四个导出函数，且已有 `getAccessToken` / `setAccessToken` / `getCurrentUsername` / `setCurrentUsername` 四个函数签名不变
2. `grep -r "localStorage\|sessionStorage" src/foundation/auth/` 零命中（不变量：access 不进任何 JS 可读存储）
3. `auth/index.ts` 中 `login()` 调 `request<TokenResponseDTO>`（非 `request<string>`），调 `setTokenResponse()` 存 token + 到期戳 + 用户名
4. `auth/index.ts` 中 `refresh()` 调 `POST /auth/refresh` + 单飞锁（并发 3 次仅 1 次 HTTP），`finally` 释放锁
5. `auth/index.ts` 中 `logout()` 调 `POST /auth/logout` + `try...finally` 确保始终清除本地态
6. `request/index.ts` 中 `AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING` 包含 `'/auth/logout'`
7. `request/index.ts` 中请求拦截器在 `isTokenNearExpiry() === true` 时调 `refreshHandler()`，且 `isAuthEndpoint` 检查排除 `/auth/login`、`/auth/refresh`、`/auth/logout`
8. `router/index.ts` 中调 `setRefreshHandler(refresh)` 完成注入
9. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全部 BUILD SUCCESS
10. 新建 `token.spec.ts`（≥6 用例）和 `index.spec.ts`（≥6 用例）全部通过
11. `guard.spec.ts` 已有用例全部通过（无退化），冷启动 refresh 成功路径已覆盖
12. 全量测试 ≥ 203 + 12 = 215 用例，0 失败，0 跳过

## 15. 执行回执格式

按根目录 system.md §7.1 格式，写入 `product/auth-seam-completion/receipts/step-6-f1-execution.md`。

额外要求：
- **§8 偏差说明中必须报告**：cookie 在 dev 模式下是否正常发送和接收（手动验证或代码分析）
- **§9 问题中必须报告**：是否遇到循环依赖问题及其解决方式

## 16. 测试回执格式

按根目录 system.md §7.2 格式，写入 `product/auth-seam-completion/receipts/step-6-f1-test.md`。最终结论只能是 PASSED / FAILED / BLOCKED 之一。

额外要求：
- **§5 测试结果中必须包含**：`index.spec.ts` 单飞去重测试的详细结果（并发 3 次 refresh 仅 1 次 HTTP 调用）
- **§11 回归风险中必须报告**：已确认构建产物中不含 mock 代码（`import.meta.env.DEV` 阻断已在 production build 中 tree-shake）

## 17. 明确禁止事项

- ❌ 不修改任何后端文件
- ❌ 不修改 `src/foundation/mock/` — F2 专属
- ❌ 不修改 `src/foundation/session/` / `src/foundation/menu/` / `src/foundation/permission/` — 不变
- ❌ 不修改 `src/views/LoginPage.vue` — 通过 `useAuth().login()` 间接调用，内部实现变更不影响
- ❌ 不修改 `src/layouts/components/AppTopbar.vue` — 同上
- ❌ 不新增 `contracts/auth.ts` — `TokenResponseDTO` 是 DTO，定义在 `auth/index.ts` 内部
- ❌ 不在 `token.ts` 中引入 `foundation/request` — 循环依赖
- ❌ 不在 `request/index.ts` 中直接 import `refresh` from `auth/index` — 循环依赖
- ❌ 不设置 `axios.defaults.withCredentials = true` — 非本 Step 范围（同源自动发送 cookie）
- ❌ 不新增 npm 依赖
- ❌ 不在拦截器中直接跳 `/login` — 401 跳转统一由响应拦截器 `unauthorizedHandler` 处理
- ❌ **执行代理若发现方案有误或需调整**：在回执中报告，不自行修改方案
