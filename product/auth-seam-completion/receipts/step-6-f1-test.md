# 测试回执

## 1. Step 编号和名称

**Step F1**：前端登录契约更新 + token 到期戳 + beforeHandler 单飞刷新 + refresh/logout 接真端点 + guard 冷启动续登

## 2. 测试环境

| 项目 | 值 |
|------|-----|
| Node.js | v24.18.0 |
| 平台 | linux x64 |
| 包管理器 | pnpm |
| 测试框架 | Vitest v4.1.9 |
| TypeScript | vue-tsc (vue-tsc -b --noEmit) |
| ESLint | eslint .（含架构边界规则 `no-restricted-imports`） |
| 构建工具 | Vite v8.1.0 / Rolldown |
| 后端状态 | 未启动（纯前端测试，全部 mock） |
| 数据库 | N/A（前端测试无数据库依赖） |

## 3. 测试前置条件

- 依赖已安装：`node_modules/` 完整（`pnpm install` 已执行）
- Mock 模式：测试使用 `vi.mock` / `vi.hoisted` 模拟 `@/foundation/request` 和 `@/foundation/auth/token`
- Pinia：`guard.spec.ts` 在 `beforeEach` 中创建新 Pinia 实例隔离状态
- 无后端依赖：全部测试走 mocked HTTP 层

## 4. 实际执行的测试命令

```bash
# 全量测试
pnpm test

# 新增/修改测试文件独立运行（verbose）
npx vitest run --reporter verbose src/foundation/auth/token.spec.ts src/foundation/auth/index.spec.ts

# ESLint（含架构边界规则）
pnpm lint

# TypeScript 类型检查
pnpm typecheck

# 生产构建（验证 tree-shaking）
pnpm build
```

## 5. 各测试项结果

### 5.1 新增测试：`token.spec.ts`（12 用例，全部通过）

```
 ✓ token storage > legacy exports (unchanged signatures) > setAccessToken / getAccessToken round-trip
 ✓ token storage > legacy exports (unchanged signatures) > setCurrentUsername / getCurrentUsername round-trip
 ✓ token storage > setTokenResponse > should set access token, expiresAt, and username
 ✓ token storage > setTokenResponse > should not overwrite username when not provided (refresh scenario)
 ✓ token storage > isTokenNearExpiry > should return false when no token (expiresAt is null)
 ✓ token storage > isTokenNearExpiry > should return false when token far from expiry
 ✓ token storage > isTokenNearExpiry > should return true when token is within 60s buffer
 ✓ token storage > isTokenNearExpiry > should return true when token is already expired
 ✓ token storage > clearToken > should clear all token state
 ✓ token storage > invariant: token never in localStorage/sessionStorage > setTokenResponse should not write to localStorage
 ✓ token storage > invariant: token never in localStorage/sessionStorage > setAccessToken should not write to localStorage
 ✓ token storage > invariant: token never in localStorage/sessionStorage > clearToken should not affect unrelated localStorage keys
```

### 5.2 新增测试：`index.spec.ts`（7 用例，全部通过）

```
 ✓ auth operations > login > should call POST /auth/login and store token response
 ✓ auth operations > login > should propagate login failure and not store token
 ✓ auth operations > logout > should call POST /auth/logout and clear local state
 ✓ auth operations > logout > should clear local state even if logout API fails (try...catch...finally)
 ✓ auth operations > refresh > should call POST /auth/refresh and update token
 ✓ auth operations > refresh > should deduplicate concurrent calls (single-flight)
 ✓ auth operations > refresh > should release lock on failure and allow retry
```

### 5.3 单飞去重详细结果（方案额外要求 §16）

**测试用例**：`should deduplicate concurrent calls (single-flight)`

**测试方法**：
1. `mockRequest.mockReturnValueOnce(firstCall)` 返回一个外部可控的 pending Promise
2. 连续 3 次调用 `refresh()`（r1, r2, r3）——均在 `await` 前发起
3. `resolveFirst({ accessToken: 'shared-token', expiresIn: 900 })` 解析 Promise
4. `await Promise.all([r1, r2, r3])` 等待全部完成

**验证结果**：
- `expect(mockRequest).toHaveBeenCalledTimes(1)` — ✅ mockRequest 仅被调用 1 次（非 3 次）
- `expect(getAccessToken()).toBe('shared-token')` — ✅ 三次 refresh 均返回同一 token

**结论**：单飞去重正确——首个 `refresh()` 创建 `refreshPromise`，后续并发 `refresh()` 复用同一 Promise，仅发起 1 次 HTTP 请求。

### 5.4 扩增测试：`guard.spec.ts`（+1 用例，全部 7 用例通过）

```
 ✓ no token + refresh succeeds (cold start with rt cookie) -> builds routes and enters
   - 验证 refresh 成功后继续 loadSession() + loadMenu()
   - 验证动态路由构建（addRoute）
   - 验证 next({ ...to, replace: true })
```

已有 6 用例全部保持通过（零退化）。

### 5.5 已有测试回归

全量 `pnpm test`：**56 files, 491 tests**（基线 471 + 新增 20），0 失败，0 跳过。

## 6. 通过项

| # | 测试分组 | 文件 | 用例数 | 结果 |
|---|----------|------|:------:|:----:|
| 1 | token storage（新增） | `token.spec.ts` | 12 | ✅ 全部通过 |
| 2 | auth operations（新增） | `index.spec.ts` | 7 | ✅ 全部通过 |
| 3 | guard cold start（扩增） | `guard.spec.ts` | 7 (6+1) | ✅ 全部通过 |
| 4 | 已有全量测试 | 53 files | 465 | ✅ 零退化 |
| **合计** | | **56 files** | **491** | **✅ 0 失败** |

## 7. 失败项

无。全部 491 用例通过，0 失败。

## 8. 跳过项及原因

无。全部用例均执行并通过。

## 9. 关键日志或错误信息

无错误。lint 初始出现 3 个 prettier formatting warnings（非逻辑错误），`pnpm lint --fix` 已自动修复。

构建时 Rolldown 报告 2 个 `[INVALID_ANNOTATION]` 警告，来源为 `node_modules/.pnpm/@vueuse+core@14.3.0_vue@.../dist/index.js` 中的 `/* #__PURE__ */` 注释位置问题——非项目代码，与本次修改无关，属已有问题。

## 10. 是否满足验收标准

逐条对照方案 §14 验收标准：

| # | 验收标准 | 结果 | 证据 |
|---|----------|:--:|------|
| 1 | `token.ts` 新增 4 个导出函数，已有 4 个签名不变 | ✅ | `grep "export function" src/foundation/auth/token.ts` 显示 8 个导出（4 旧 + 4 新），旧签名完整保留 |
| 2 | `grep -r "localStorage\|sessionStorage" src/foundation/auth/` 零命中（源码） | ✅ | 仅测试文件和注释匹配，源码零 `setItem` 调用 |
| 3 | `login()` 调 `request<TokenResponseDTO>`，调 `setTokenResponse()` | ✅ | 源码行：`request<TokenResponseDTO>(...)` + `setTokenResponse(data.accessToken, data.expiresIn, payload.username)` |
| 4 | `refresh()` 调 `POST /auth/refresh` + 单飞锁 + `finally` 释放 | ✅ | 源码 + test 验证：并发 3 次仅 1 次 HTTP 调用 |
| 5 | `logout()` 调 `POST /auth/logout` + `try...catch...finally` 确保清除本地态 | ✅ | 源码 + test 验证：API 失败仍清本地态 |
| 6 | `AUTH_ENDPOINTS` 包含 `'/auth/logout'` | ✅ | `grep` 确认：`['/auth/login', '/auth/refresh', '/auth/logout']` |
| 7 | 请求拦截器到期刷新 + `isAuthEndpoint` 排除三个端点 | ✅ | 源码：`isTokenNearExpiry()` 检查 + `isAuthEndpoint` guard |
| 8 | `router/index.ts` 调 `setRefreshHandler(refresh)` | ✅ | 源码：`setRefreshHandler(refresh)` 在 `setUnauthorizedHandler` 之后 |
| 9 | 四连全绿 | ✅ | typecheck ✅ lint ✅ test ✅ build ✅ |
| 10 | `token.spec.ts`（≥6 用例）+ `index.spec.ts`（≥6 用例）全部通过 | ✅ | token: 12 用例 + index: 7 用例 |
| 11 | `guard.spec.ts` 已有用例全通过 + 冷启动 refresh 成功路径覆盖 | ✅ | 7 用例（6 旧 + 1 新）全部通过 |
| 12 | 全量 ≥215 用例，0 失败 | ⚠️ | 方案基线 203 已过时，实际基线 471，新总计 491（+20）。按方案数字精神远超 215 |

> 第 12 条：方案中"全量测试 ≥ 203 + 12 = 215"基于过时基线（kb-verification 时 203，后续大量功能增加测试至 471）。执行代理以实际数字报告：471 → 491（+20），0 失败，0 跳过。

## 11. 回归风险

**低风险**。理由：

- **已有测试零退化**：全量 465 个已有测试用例全部通过（56 files - 2 new = 54 existing files，0 退化）
- **导出签名兼容**：`token.ts` 的 4 个已有导出签名不变，`auth/index.ts` 的 `login`/`logout`/`refresh`/`useAuth` 签名不变——所有消费方（LoginPage、AppTopbar、guard、中间件）无需改动
- **依赖方向无变化**：`router → auth → request → token`，无新增循环依赖（ESLint + typecheck 双重验证）
- **构建产物不含 mock**：`grep -c "dispatchMock" dist/assets/*.js` 全零命中。mock 代码由 `import.meta.env.DEV` gate + Vite tree-shaking 完全移除，生产构建产物无 mock 残留（方案额外要求 §16 已满足）
- **`login()` 响应形状变更**：从 `R<string>` → `R<{accessToken, expiresIn}>`，已在调用方（LoginPage）确认——LoginPage 只调用 `await login({...})` 不读取返回值，不受影响

## 12. 最终结论

**PASSED**
