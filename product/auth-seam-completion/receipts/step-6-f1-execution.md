# 执行回执

## 1. Step 编号和名称

**Step F1**：前端登录契约更新 + token 到期戳 + beforeHandler 单飞刷新 + refresh/logout 接真端点 + guard 冷启动续登

## 2. 使用模型

`deepseek-v4-pro`（方案推荐模型）

## 3. 实际读取的文件

| # | 文件 | 状态 |
|---|------|------|
| 1 | `src/foundation/auth/token.ts` | ✅ 已读取（24 行原始代码） |
| 2 | `src/foundation/auth/index.ts` | ✅ 已读取（46 行原始代码） |
| 3 | `src/foundation/request/index.ts` | ✅ 已读取（98 行原始代码） |
| 4 | `src/router/index.ts` | ✅ 已读取 |
| 5 | `src/router/guard.ts` | ✅ 已读取 |
| 6 | `src/views/LoginPage.vue` | ✅ 已读取（确认仅通过 `useAuth().login()` 间接调用） |
| 7 | `src/layouts/components/AppTopbar.vue` | ✅ 已读取（确认仅通过 `useAuth().logout()` 间接调用） |
| 8 | `src/foundation/session/index.ts` | ✅ 已读取 |
| 9 | `src/foundation/menu/index.ts` | ✅ 已读取 |
| 10 | `src/contracts/common.ts` | ✅ 已读取 |
| 11 | `src/contracts/session.ts` | ✅ 已读取 |
| 12 | `src/router/guard.spec.ts` | ✅ 已读取（理解现有测试模式） |

全部 11 个要求的文件 + guard.spec.ts 均已读取。

## 4. 实际修改的文件

| # | 文件 | 类型 | 说明 |
|---|------|:--:|------|
| 1 | `src/foundation/auth/token.ts` | 修改 | 新增 `expiresAt`、`EXPIRY_BUFFER_MS`、4 个导出函数 |
| 2 | `src/foundation/auth/index.ts` | 修改 | login/refresh/logout 真实实现 + TokenResponseDTO + 单飞锁 |
| 3 | `src/foundation/request/index.ts` | 修改 | 新增 `setRefreshHandler` + async 请求拦截器 + `/auth/logout` |
| 4 | `src/router/index.ts` | 修改 | 导入并注入 `setRefreshHandler(refresh)` |
| 5 | `src/router/guard.ts` | 修改 | 冷启动注释更新（代码逻辑不变） |
| 6 | `src/foundation/auth/token.spec.ts` | **新建** | ≥12 用例（过期戳 + 不变量测试） |
| 7 | `src/foundation/auth/index.spec.ts` | **新建** | ≥7 用例（login/logout/refresh + 单飞去重） |
| 8 | `src/router/guard.spec.ts` | 修改 | 新增冷启动 refresh 成功路径测试 |

共 8 个文件：5 个修改 + 2 个新建 + 1 个扩增测试。

## 5. 每个文件的修改摘要

### 5.1 `src/foundation/auth/token.ts`（+35 行）

- 新增内部变量 `expiresAt: number | null`、`EXPIRY_BUFFER_MS = 60_000`
- 新增导出：`getTokenExpiresAt()`、`isTokenNearExpiry()`、`setTokenResponse(token, expiresInSeconds, username?)`、`clearToken()`
- 已有 4 个导出函数（`getAccessToken` / `setAccessToken` / `getCurrentUsername` / `setCurrentUsername`）签名完全不变
- 注释更新：反映双 token 到期戳模型

### 5.2 `src/foundation/auth/index.ts`（+54/-19 行）

- 新增 `TokenResponseDTO` 接口（`{accessToken: string, expiresIn: number}`，模块内 DTO）
- 新增模块级 `refreshPromise: Promise<void> | null` 单飞锁
- `login()`: `request<string>` → `request<TokenResponseDTO>`，消费 `{accessToken, expiresIn}` 后调 `setTokenResponse()` 同时设置 token + 到期戳 + 用户名
- `logout()`: **新增 catch 块**（见 §8 偏差说明），调 `POST /auth/logout`，`finally` 中调 `clearToken()`
- `refresh()`: `throw NOT_IMPLEMENTED` → 调 `POST /auth/refresh` + 单飞去重，`finally` 释放锁
- `useAuth()`: 返回签名不变（`login`/`logout`/`refresh` 函数引用指向新实现）
- 移除 `import { setAccessToken, setCurrentUsername }` → 改用 `setTokenResponse` + `clearToken`

### 5.3 `src/foundation/request/index.ts`（+34/-3 行）

- 导入 `isTokenNearExpiry` from `foundation/auth/token`
- `AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING` 追加 `'/auth/logout'`
- 新增 `RefreshHandler` 类型 + `setRefreshHandler()` 依赖注入函数
- 请求拦截器改为 `async`：检查 `isTokenNearExpiry()`，非 auth 端点且有 token 时调 `refreshHandler()`，失败静默吞掉
- 响应拦截器：不变（仅 `AUTH_ENDPOINTS` 数组因新增 `/auth/logout` 而扩展）

### 5.4 `src/router/index.ts`（+6/-1 行）

- 新增导入 `setRefreshHandler` from `@/foundation/request`
- 新增导入 `refresh` from `@/foundation/auth`
- 在 `setUnauthorizedHandler(...)` 后追加 `setRefreshHandler(refresh)` 完成注入

### 5.5 `src/router/guard.ts`（+4/-1 行）

- 仅更新冷启动注释："seam 当前必失败" → "浏览器自动携带 rt cookie 调 /auth/refresh"
- 代码逻辑完全不变

### 5.6 `src/foundation/auth/token.spec.ts`（新建，104 行，12 用例）

| 分组 | 用例数 | 覆盖内容 |
|------|:------:|----------|
| legacy exports | 2 | `setAccessToken`/`getAccessToken` round-trip、`setCurrentUsername`/`getCurrentUsername` round-trip |
| setTokenResponse | 2 | 设置三项（token+expiresAt+username）、refresh 场景不覆盖 username |
| isTokenNearExpiry | 4 | 无 token 返回 false、远未到期返回 false、到期前缓冲区内返回 true、已过期返回 true |
| clearToken | 1 | 清除全部三项 |
| invariants | 3 | `setTokenResponse` 不写 localStorage、`setAccessToken` 不写 localStorage、`clearToken` 不影响其他 key |

### 5.7 `src/foundation/auth/index.spec.ts`（新建，107 行，7 用例）

| 分组 | 用例数 | 覆盖内容 |
|------|:------:|----------|
| login | 2 | POST /auth/login 后存 token+username+expiresAt、登录失败不存 token |
| logout | 2 | POST /auth/logout 后清本地态、API 失败仍清本地态（try...finally） |
| refresh | 3 | POST /auth/refresh 更新 token、单飞去重（并发 3 次仅 1 次 HTTP）、失败释放锁可重试 |

### 5.8 `src/router/guard.spec.ts`（+19 行）

- 新增 `it('no token + refresh succeeds (cold start with rt cookie) -> builds routes and enters')`
- 验证 refresh 成功后继续 `loadSession()` + `loadMenu()` + 动态路由构建
- 已有 6 个用例全部保持通过

## 6. 实际执行的命令

```bash
# 四连校验门
pnpm typecheck          # vue-tsc -b --noEmit → 零错误
pnpm lint               # ESLint → 初始 3 个 prettier warnings，lint --fix 后零告警
pnpm lint --fix         # 自动修复格式化
pnpm lint               # 再次确认：零错误零告警
pnpm test               # vitest run → 56 files passed, 491 tests passed
pnpm build              # vue-tsc + vite build → BUILD SUCCESS (3.44s)

# 静态检查
grep -rn "localStorage\|sessionStorage" src/foundation/auth/  # 仅测试和注释
grep -rn "from 'axios'" src/ --include="*.ts" --include="*.vue" | grep -v "foundation/request"  # 零命中
grep -rn "request<string>" src/foundation/auth/  # 零命中
grep -rn "NOT_IMPLEMENTED" src/foundation/auth/  # 零命中
grep -n "AUTH_ENDPOINTS" src/foundation/request/index.ts  # 确认包含 '/auth/logout'
```

## 7. 命令输出摘要

| 命令 | 结果 |
|------|------|
| `pnpm typecheck` | 零错误 |
| `pnpm lint` | 0 errors, 0 warnings（prettier 格式问题已自动修复） |
| `pnpm test` | **56 files passed, 491 tests passed**（基线 471 → 491，+20） |
| `pnpm build` | BUILD SUCCESS，3.44s（`INVALID_ANNOTATION` 警告来自 node_modules/@vueuse/core，非项目代码） |
| 静态检查 | 全部零命中/符合预期 |

## 8. 与原方案的偏差

### 8.1 `logout()` 实现：新增 catch 块（偏差，已报告）

**方案要求**：
```typescript
export async function logout(): Promise<void> {
  try {
    await request<null>({ method: 'POST', url: '/auth/logout' })
  } finally {
    clearToken()
  }
}
```

**实际实现**：新增 `catch` 块静默吞异常。

**原因**：方案的 `logout` 实现代码使用 `try...finally`（无 catch），但方案的测试代码（§9.7）明确标注 `await logout() // 不应抛异常`，且 `logout` 的说明文档写道"网络断开时 logout 仍应清除本地 token，否则用户卡在半登出状态"。无 catch 时 `request` 异常会传播到调用方（`AppTopbar.onLogout()`），导致 `clearDynamicRoutes(router)` 和 `router.push('/login')` 被跳过，用户退出后卡在页面而不到达 `/login`。

**处理方式**：执行代理选择对齐方案测试的期望（logout 不应抛异常），在 `catch` 中静默吞掉，确保 `finally` 中的 `clearToken()` 不受影响。调用方行为正确：logout 始终成功返回，本地态始终清除。

### 8.2 测试基线数量（偏差，非代码问题）

方案 §13.5 称测试基线为 203（"CONFIRMED 2026-07-22，来自 kb-verification"），实际基线为 **471**。该数字已过时，kb-verification 后项目有大量新增测试。执行代理以实际测试计数为准。

### 8.3 无其他偏差

其余所有修改严格按方案执行：文件范围、函数签名、实现细节、单飞去重算法、循环依赖规避（依赖注入模式）。

## 9. 遇到的问题

### 9.1 `vi.mock` hoisting 与顶层变量冲突

`index.spec.ts` 初始使用 `const mockRequest = vi.fn()` + `vi.mock('@/foundation/request', () => ({ request: mockRequest }))`，因 `vi.mock` 工厂在编译时 hoist，导致 `mockRequest` 在工厂执行时尚未初始化。

**解决**：改用 `vi.hoisted(() => vi.fn())` —— `const mockRequest = vi.hoisted(() => vi.fn())`。

### 9.2 `logout` 测试 mock 顺序

初始 logout 测试中，`mockRequest.mockResolvedValueOnce(null)` 被 login 调用错误消费。

**解决**：改为直接用 `setTokenResponse()` 建立登录态，避免 login 调用消耗 mock 配额。logout 测试只需为 logout API 调用设一个 mock。

### 9.3 循环依赖

未遇到。依赖方向经过验证：
```
router/index → auth/index → request/index → auth/token
                  ↑                              ↓
                  └──── setRefreshHandler ────────┘ (依赖反转，无环)
```

## 10. 未完成内容

无。方案要求的全部 8 个文件修改/新建均已完成。

## 11. 风险和注意事项

### 11.1 Cookie 在 dev 模式下的行为（需手动验证）

方案 §12 风险 4 要求报告 cookie 是否正常。代码分析如下：

- **路径配置**：后端 `CookieUtils` 设置 `Path=/api/auth/`，与前端 `/api/auth/login`、`/api/auth/refresh`、`/api/auth/logout` 匹配
- **同源策略**：`pnpm dev` 使用 Vite proxy（`/api` → `localhost:8080`），浏览器将前端和代理视为同源，cookie 自动发送
- **httpOnly**：前端 JS 无法访问 rt cookie（正确行为），浏览器在发送 `/api/auth/refresh` 时自动携带
- **CORS**：开发模式无跨域问题。生产部署需额外配置 `withCredentials` + CORS 头，非本 Step 范围
- **建议**：在真实后端启动时进行 §13.3 手工验证清单确认 cookie 流程正常

### 11.2 单飞锁正确性

`refreshPromise` 在 `finally` 中释放（无论成败），确保：
- 单次 refresh 失败不阻塞后续重试
- 并发请求共享同一次 refresh 调用（mock 验证：3 次并发 refresh 仅 1 次 HTTP 调用）
- 锁释放后下一次拦截器触发时重新调用 refresh

### 11.3 请求拦截器 refresh 失败行为

拦截器静默吞掉 refresh 异常，请求带着旧/过期 token 发出 → 后端返回 401 → 响应拦截器统一 `unauthorizedHandler` → 跳 `/login`。职责分离清晰。

## 12. Git diff 摘要

```
 docs/governance/engineering-constitution.md               |   2 +            (pre-existing change)
 src/foundation/auth/index.ts    |  54 +++++++---   (login/refresh/logout 重写)
 src/foundation/auth/token.ts    |  35 +++++++      (到期戳 + 4 新函数)
 src/foundation/request/index.ts |  34 +++++--      (refreshHandler + async 拦截器)
 src/router/guard.spec.ts        |  19 +++++        (新测试用例)
 src/router/guard.ts             |   4 +-           (注释更新)
 src/router/index.ts             |   6 +-           (注入 refreshHandler)
 src/foundation/auth/token.spec.ts   (新文件, 104 行, 12 用例)
 src/foundation/auth/index.spec.ts  (新文件, 107 行,  7 用例)
─────────────────────────────────────────────────────
 7 modified + 2 new = 9 files total
 135 insertions, 19 deletions (modified files)
 +211 lines (new test files)
```

## 13. 建议执行的测试

1. **手工验证**（§13.3 完整清单）：需要后端 B4 服务运行
   - 登录 → 确认 cookie 存在 → 刷新页面免登录 → 退出 → 清除状态
2. **单飞去重回归**：`index.spec.ts` 中 `should deduplicate concurrent calls` 用例已通过，建议作为常驻回归保留
3. **`pnpm dev:mock` 验证**：新 auth 逻辑在 mock 模式下的行为（mock 模式仍会走 `foundation/auth` 的 login/logout/refresh，但 `request()` 被 mock 调度器拦截）——F2 会补充 auth mock handler
