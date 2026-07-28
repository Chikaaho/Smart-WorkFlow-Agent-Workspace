# Step F2：前端 mock（双 token + refresh + logout）+ 回归测试调整 + 四连

> 所属功能：auth-seam-completion（后端 seam 收尾 → 前端 seam 点亮）
> 域：**纯前端**（只改 `Smart-WorkFlow-Web/`，禁止触碰后端）
> 本方案按根目录 system.md §6 的 17 项结构生成。
> **前置**：F1 ✅ PASSED — `foundation/auth` 已使用新契约 `R<TokenResponseDTO>`，login/refresh/logout 均接真实端点。

---

## 1. 当前状态

F1 已将前端 auth 模块从占位 seam 升级为连接真实后端双 token 认证。但 mock 模式（`pnpm dev:mock`）的 auth handler 仍使用旧契约：

| 端点 | mock handler 当前状态 | F1 改动后的 `foundation/auth` 期望 |
|------|-----------------------|--------------------------------------|
| `POST /api/auth/login` | 返回 `R<string>`（`'mock-access-token-' + Date.now()`） | `request<TokenResponseDTO>` → 读取 `data.accessToken` + `data.expiresIn` |
| `POST /api/auth/refresh` | **未注册** → fallthrough 真实 axios → mock 模式失败 | `request<TokenResponseDTO>` → `setTokenResponse(data.accessToken, data.expiresIn)` |
| `POST /api/auth/logout` | **未注册** → fallthrough 真实 axios → mock 模式失败 | `request<null>` → 仅通知后端 |

**现状**：`dev:mock` 模式下 login 立即抛异常（`data.accessToken` 在 string 上为 `undefined`），refresh/logout 因无 handler 也失败。F2 修复这三个 handler，使 mock 模式恢复可用。

F2 是本功能最后一步。完成后整个 auth-seam-completion 功能全部 PASSED，进入阶段三收尾。

## 2. Step 目标

将 mock 模式的 auth handler 对齐 F1 的新契约（双 token），使 `pnpm dev:mock` 模式下登录/刷新/退出全链路可用。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：3 个 handler 更新/新增 + 1 个测试文件更新，单文件改动，明确的 CRUD 模式补充，无架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

F2 是纯数据适配——修改已有 handler 的返回值形状、按已有样板新增 2 个 handler、更新测试断言。所有模式（MockRegistration 结构、handler 签名、测试模式）均已有大量先例，不需要推理或权衡。

## 5. 已知上下文

- **Mock 架构**（`foundation/mock/index.ts`）：registry = `Map<"METHOD /path", MockHandler>`，`dispatchMock()` 匹配 → 命中返回 `ApiResponse<T>` / 未命中返回 `undefined`（fallthrough 真实 axios）
- **MockHandler 签名**：`(params: Record<string, string>, query: Record<string, string>, body: unknown) => ApiResponse<T>`
- **注册机制**：`handlers.ts` 导出 `mockRegistrations: MockRegistration[]`，`index.ts` 集中注册。handler 本身是纯函数，不 import `index.ts`（避免循环依赖 TDZ）
- **激活路径**：`foundation/request/index.ts` 中 `if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true')` → 动态 `import('@/foundation/mock/index')` → `dispatchMock()`
- **Tree-shake 安全**：`import.meta.env.DEV` 在生产构建中恒为 `false`，整块 dead-code elimination
- **F1 新增的 TokenResponseDTO 形状**：`{ accessToken: string, expiresIn: number }`（定义在 `foundation/auth/index.ts` 内部，不提升为 contract）
- **Mock 模式无 cookie**：`request()` 被 mock 调度器短路，不经过真实 HTTP。refresh 不需要 cookie 解析——mock handler 直接返回新 token
- **可变数据原则**：种子数据在 `seeds.ts` 中声明，handler 原地 mutate。F2 的 auth handler 不需要可变数据（全部纯函数返回）
- **Element Plus 自动导入**：无需 import。`ElMessage` 等 API 自动可用
- **ESLint 架构边界**：`foundation/mock/` 在 `foundation/` 下，无特殊限制。handler 不 import `modules/*` 即可
- **前端 system.md §2.1 四连**：`pnpm typecheck && pnpm lint && pnpm test && pnpm build` 是唯一有效完成判定

## 6. 执行前必须读取的文件

1. `src/foundation/mock/handlers.ts` — 当前 auth handler（第 62-71 行，login 返回 `R<string>`）
2. `src/foundation/mock/index.spec.ts` — 当前 mock 模块测试（第 30-35 行，login 断言 `typeof data === 'string'`）
3. `src/foundation/auth/index.ts` — F1 的 `TokenResponseDTO` 形状 + `login`/`refresh`/`logout` 对 `request<T>()` 的调用方式
4. `src/foundation/mock/index.ts` — MockHandler / MockRegistration 类型（确认无新增类型需要）
5. `src/foundation/mock/seeds.ts` — 种子数据（确认无需新增，auth handler 自包含）

## 7. 允许修改的文件范围

| # | 文件 | 改动类型 |
|---|------|:--:|
| 1 | `src/foundation/mock/handlers.ts` | **修改** — 更新 login handler 返回值 + 新增 refresh handler + 新增 logout handler |
| 2 | `src/foundation/mock/index.spec.ts` | **修改** — 更新 login 断言 + 新增 refresh/logout handler 测试 |

## 8. 禁止修改的范围

- ❌ 任何后端 `Smart-WorkFlow/**`
- ❌ `src/foundation/auth/` — F1 已稳定，不回改
- ❌ `src/foundation/request/` — F1 已稳定
- ❌ `src/router/` — F1 已稳定
- ❌ `src/foundation/mock/index.ts` — 调度器不变
- ❌ `src/foundation/mock/seeds.ts` — 无需新增种子
- ❌ `src/views/LoginPage.vue` / `src/layouts/components/AppTopbar.vue` — 不受影响
- ❌ `src/modules/` — 所有业务模块
- ❌ `vite.config.ts` / `tsconfig.*.json` / `eslint.config.js` / `package.json` — 构建配置不变
- ❌ 不新增 `contracts/` 文件

## 9. 详细执行方案

### 9.1 修改 `src/foundation/mock/handlers.ts` — 更新/新增 3 个 auth handler

**当前代码**（第 62-71 行）：

```typescript
  // ── 登录/会话 ────────────────────────────────────────────
  {
    method: 'POST',
    pattern: '/api/auth/login',
    handler: (_params, _query, _body) => ({
      code: 0,
      message: 'ok',
      data: 'mock-access-token-' + Date.now(),
    }),
  },
```

**修改后**（替换 + 追加）：

```typescript
  // ── 登录/会话（双 token 契约，对齐 F1 的 TokenResponseDTO） ──
  {
    method: 'POST',
    pattern: '/api/auth/login',
    handler: (_params, _query, body) => {
      const payload = body as { username?: string; password?: string } | undefined
      // mock 模式不校验凭证（任何用户名/密码均通过），返回固定 token
      const username = payload?.username ?? 'admin'
      return {
        code: 0,
        message: 'ok',
        data: {
          accessToken: 'mock-access-token-' + username + '-' + Date.now(),
          expiresIn: 900,
        },
      }
    },
  },

  // ── Token 刷新（mock 模式：直接返回新 token，无需 cookie） ──
  {
    method: 'POST',
    pattern: '/api/auth/refresh',
    handler: () => ({
      code: 0,
      message: 'ok',
      data: {
        accessToken: 'mock-refreshed-token-' + Date.now(),
        expiresIn: 900,
      },
    }),
  },

  // ── 登出（mock 模式：幂等，始终返回成功） ──
  {
    method: 'POST',
    pattern: '/api/auth/logout',
    handler: () => ({
      code: 0,
      message: 'ok',
      data: null,
    }),
  },
```

**关键约束**：

- **login handler 不校验凭证**：mock 模式是开发验收台，"零后端依赖"是它的核心价值。mock handler 接受任何 username/password。凭证校验是后端的职责，mock 不需要模拟
- **login handler 从 body 取 username**：用于生成可读的 mock token（`mock-access-token-admin-1734567890`），但不依赖它。`body` 可能为 `undefined`（测试中 `dispatchMock('POST', '/auth/login', '/api', {}, {})` 传空对象 `{}`），做好 `payload?.username ?? 'admin'` 回退
- **refresh handler 返回固定 token**：mock 模式不维护 token 状态（无 DB、无 cookie），每次 refresh 返回新的 `mock-refreshed-token-{timestamp}`
- **logout handler**：幂等，始终返回 `code: 0, data: null`
- **`expiresIn: 900`**：对齐后端 `JwtProperties.accessExpireSeconds`。F1 的 `setTokenResponse()` 使用 `Date.now() + expiresIn * 1000` 计算到期戳。mock 模式下客户端时钟就是唯一时钟（无服务端时钟偏差问题），900s 足够覆盖开发验证场景
- **handler 位置**：login handler 替换旧代码（同位置）。refresh 和 logout handler 紧随其后追加（保持"登录/会话"分组内聚）

### 9.2 修改 `src/foundation/mock/index.spec.ts` — 更新断言 + 新增测试

**当前代码**（第 30-35 行）：

```typescript
    // 验证 login handler 存在
    const loginResult = await mod.dispatchMock('POST', '/auth/login', '/api', {}, {})
    expect(loginResult).toBeDefined()
    expect(loginResult!.code).toBe(0)
    expect(typeof loginResult!.data).toBe('string')
```

**修改后**（替换 + 追加）：

```typescript
    // 验证 login handler 存在（F1 契约：R<TokenResponseDTO>）
    const loginResult = await mod.dispatchMock('POST', '/auth/login', '/api', {}, {
      username: 'admin',
      password: 'admin123',
    })
    expect(loginResult).toBeDefined()
    expect(loginResult!.code).toBe(0)
    expect(loginResult!.data).toMatchObject({
      accessToken: expect.any(String) as string,
      expiresIn: 900,
    })

    // 验证 refresh handler 存在（F1 契约：R<TokenResponseDTO>）
    const refreshResult = await mod.dispatchMock('POST', '/auth/refresh', '/api', {}, {})
    expect(refreshResult).toBeDefined()
    expect(refreshResult!.code).toBe(0)
    expect(refreshResult!.data).toMatchObject({
      accessToken: expect.any(String) as string,
      expiresIn: 900,
    })

    // 验证 logout handler 存在（幂等，返回 R<null>）
    const logoutResult = await mod.dispatchMock('POST', '/auth/logout', '/api', {}, {})
    expect(logoutResult).toBeDefined()
    expect(logoutResult!.code).toBe(0)
    expect(logoutResult!.data).toBeNull()
```

> **`toMatchObject` + `expect.any(String)` 类型**：`toMatchObject` 接受 `expect.any(String)` 返回的 `AsymmetricMatcher`。TS 对 `toMatchObject` 入参做结构推断时报 `AsymmetricMatcher<String>` 不可赋给 `string` 时，加 `as string` 类型断言即可。

**关键约束**：

- **不改变已有测试结构**：login 测试在原位置替换（保持测试编号和 `it('registry 有已注册的 handler', ...)` 的包裹不变），只是断言从 `typeof string` 变为 `toMatchObject`
- **refresh/logout 测试紧随 login 测试**：放在同一个 `it` 块内（该 it 块测试"registry 中有已注册 handler"），不创建新的 `it` 块（避免改变测试计数和结构）
- **login body 传入 `{username, password}`**：handler 从 body 取 username 生成 token。测试传明确值，断言 `accessToken` 存在即可（不断言具体 token 值，因为包含 `Date.now()` 不可预测）

### 9.3 编译与测试验证

```bash
cd Smart-WorkFlow-Web
pnpm typecheck    # TypeScript 类型检查
pnpm lint         # ESLint（含架构边界规则）
pnpm test         # Vitest 单元测试
pnpm build        # 生产构建（含类型检查 + tree-shaking 验证）
```

预期：

- `pnpm typecheck` 零错误
- `pnpm lint` 零告警（mock 文件在 `foundation/` 下，无特殊架构限制）
- `pnpm test` 全量通过，mock 模块测试 3 项断言更新（login 换 shape + refresh 注册 + logout 注册），其他已有测试零退化
- `pnpm build` BUILD SUCCESS（mock 代码在 `import.meta.env.DEV` gate 后，生产 tree-shake 不受影响）

## 10. 关键实现约束

- **login handler 返回值必须是 `{ accessToken: string, expiresIn: number }`**，不能是裸 string。F1 的 `login()` 读 `data.accessToken`，返回 string 会抛 `Cannot read properties of undefined`
- **`expiresIn` 必须是 `number`**（不是 string）。F1 的 `setTokenResponse()` 做 `Date.now() + expiresInSeconds * 1000`，string 参与算术会得到 `NaN` → `isTokenNearExpiry()` 永远返回 `false`（`Date.now() >= NaN` 为 `false`）
- **refresh handler 返回与 login 相同的 `{ accessToken, expiresIn }` 形状**：F1 的 `refresh()` 和 `login()` 都调 `setTokenResponse(data.accessToken, data.expiresIn)`，消费同一个 `TokenResponseDTO` 类型
- **logout handler 返回 `data: null`**：F1 的 `logout()` 调 `request<null>(...)`，`null` 是合法响应。不要返回 `data: undefined` 或 `data: {}`
- **handler 不抛异常**：mock handler 是纯函数同步返回 `ApiResponse`。F1 的 `login()` / `refresh()` / `logout()` 通过 `request<T>()` → `dispatchMock()` 路径消费 mock 响应，异常会沿 `ApiError` 管线抛出并触达调用方
- **mock handler 不 import `foundation/auth`**：`handlers.ts` 是数据文件，不 import 业务模块。TokenResponseDTO 的形状内联为对象字面量
- **不改变 `index.spec.ts` 的测试数量**：更新已有 login 断言（不新建 `it`），追加 refresh/logout 断言到同一个 `it` 块内。如果 lint/test 要求拆分，则可拆——但优先不拆

## 11. 边界情况

- **login body 为空 `{}`**：`payload?.username ?? 'admin'` 回退到 `'admin'`。测试中 `dispatchMock('POST', '/auth/login', '/api', {}, {})` 传空对象，handler 正常工作
- **login body 为 `undefined`**：`body` 参数在 mock dispatch 中可能为 `undefined`（取决于调用方）。handler 中做 `(body as Record<string, unknown> | undefined)` + `payload?.username ?? 'admin'` 安全访问
- **refresh 并发**：mock 模式不涉及——F1 的单飞锁在 `foundation/auth/index.ts` 层工作，refresh handler 只是数据提供方
- **logout 多次调用**：幂等。mock handler 不维护状态，每次返回相同响应
- **mock token 中 `Date.now()` 的不可预测性**：测试用 `expect.any(String)` + `expect.stringContaining('mock-')` 匹配，不断言具体值
- **login handler 在 mock spec 中的 body 参数**：现有测试 `mod.dispatchMock('POST', '/auth/login', '/api', {}, {})` — 第二个 `{}` 是 `query`，第三个已省略（即 body 为 `undefined`）。更新后的测试显式传 `{ username: 'admin', password: 'admin123' }` 作为 body

## 12. 风险和回滚方案

- **风险 1：login handler 返回形状错误**：若忘记改 `data` 从 string 变 object，`dev:mock` 启动后登录页调 `login()` 时抛 `TypeError: Cannot read properties of undefined (reading 'accessToken')`。缓解：执行后立即 `grep '"data":' src/foundation/mock/handlers.ts | grep auth` 确认 login 的 data 是对象
- **风险 2：`expiresIn` 误写为 string**：`'900'` 参与 `Date.now() + '900' * 1000` 在 JS 中 `'900' * 1000 = 900000`（自动类型转换），所以 string `'900'` 也能正常工作。但 `Date.now() + undefined * 1000 = NaN`，所以绝不能漏写 `expiresIn` 字段。缓解：测试断言 `expect(loginResult!.data).toMatchObject({ expiresIn: 900 })`（number，非 string）
- **风险 3：mock spec 类型错误**：`toMatchObject` 对 `expect.any(String)` 的类型推断可能在当前 vitest 版本中报错。若报错，按方案中注记加 `as string` 断言；若仍有问题，改用 `expect(typeof data.accessToken).toBe('string')`
- **回滚**：`git checkout -- src/foundation/mock/handlers.ts src/foundation/mock/index.spec.ts`

## 13. 测试方案

### 13.1 静态检查

- `grep -c '"data":' src/foundation/mock/handlers.ts` → 确认 login handler 的 `data` 是对象（含 `accessToken` + `expiresIn`），非裸 string
- `grep "mock-access-token" src/foundation/mock/handlers.ts` → 确认 login handler 中存在新版 token 生成（`mock-access-token-` + username + `-` + Date.now()），旧版 `'mock-access-token-' + Date.now()` 已被替换
- `grep "mock-refreshed-token" src/foundation/mock/handlers.ts` → 确认 refresh handler 已注册
- `grep "'/api/auth/logout'" src/foundation/mock/handlers.ts` → 确认 logout handler 已注册
- `grep "toMatchObject" src/foundation/mock/index.spec.ts` → 确认 login 断言已改为对象匹配

### 13.2 单元测试

mock 模块自身测试（`index.spec.ts`）：

| 测试项 | 变更 |
|--------|:--:|
| login handler 返回 `R<{accessToken, expiresIn}>` | 更新断言（string → object） |
| refresh handler 已注册且返回正确形状 | 新增 |
| logout handler 已注册且返回 `data: null` | 新增 |

### 13.3 集成测试

不要求新增。手工验证（可选）：

```bash
cd Smart-WorkFlow-Web
pnpm dev:mock
```

1. 浏览器访问 `http://localhost:5173/login`
2. 输入任意用户名/密码 → 登录成功 → 跳转首页
3. 打开 DevTools → Network → 确认 `/api/auth/login` 返回 `{ code: 0, data: { accessToken: "...", expiresIn: 900 } }`
4. 刷新页面 → 冷启动 refresh 成功（mock refresh handler 返回新 token）→ 保持在首页
5. 点击退出 → Network 确认 `/api/auth/logout` 返回 `{ code: 0, data: null }` → 跳回登录页

> **注意**：手工验证非 gate。四连绿即满足 F2 验收标准。dev:mock 验证是可选项。

### 13.4 手工验证

同上 §13.3。

### 13.5 回归检查

- 已有 `index.spec.ts` 测试用例数不应减少
- 已有 `handlers.ts` 中非 auth handler（form/bpm/notify/system/storage/job）零改动
- 全量 `pnpm test` 测试计数 ≥ 491（F1 基线），零退化，零新增失败
- `pnpm lint` 零新增告警
- `pnpm typecheck` 零新增错误
- `pnpm build` BUILD SUCCESS
- 构建产物 tree-shake 确认：`grep "dispatchMock\|mock-access-token\|mock-refreshed-token" dist/assets/*.js` 零命中

## 14. 验收标准（逐条可验证布尔条件）

1. `handlers.ts` 中 `POST /api/auth/login` handler 返回 `data: { accessToken: string, expiresIn: 900 }`（非 `data: string`）
2. `handlers.ts` 中 `POST /api/auth/refresh` handler 已注册，返回 `data: { accessToken: string, expiresIn: 900 }`
3. `handlers.ts` 中 `POST /api/auth/logout` handler 已注册，返回 `data: null`，`code: 0`
4. `index.spec.ts` 中 login 断言已更新为对象匹配（`toMatchObject` 或等价），不再断言 `typeof data === 'string'`
5. `index.spec.ts` 中 refresh handler 已注册的测试断言存在（验证 `code: 0` + `data` 含 `accessToken` + `expiresIn`）
6. `index.spec.ts` 中 logout handler 已注册的测试断言存在（验证 `code: 0` + `data: null`）
7. `pnpm typecheck` 零错误
8. `pnpm lint` 零错误零告警
9. `pnpm test` 全量通过（≥491 tests，0 失败，0 跳过）
10. `pnpm build` BUILD SUCCESS
11. 已有 `index.spec.ts` 中非 auth handler 测试全部通过（无退化）
12. 构建产物中 mock token 相关字符串零命中（tree-shake 验证）

## 15. 执行回执格式

按根目录 system.md §7.1 格式，写入 `product/auth-seam-completion/receipts/step-7-f2-execution.md`。

额外要求：
- **§5 修改摘要中必须列出**：login handler 的旧返回值（string）与新返回值（object）对比
- **§13 建议执行的测试中必须报告**：`pnpm dev:mock` 下手动验证 login → refresh → logout 全链路结果（如未执行，说明原因）

## 16. 测试回执格式

按根目录 system.md §7.2 格式，写入 `product/auth-seam-completion/receipts/step-7-f2-test.md`。最终结论只能是 PASSED / FAILED / BLOCKED 之一。

额外要求：
- **§11 回归风险中必须报告**：构建产物 tree-shake 结果（`grep "dispatchMock\|mock-access-token\|mock-refreshed-token" dist/assets/*.js` 零命中）

## 17. 明确禁止事项

- ❌ 不修改任何后端文件
- ❌ 不修改 `src/foundation/auth/` — F1 已稳定
- ❌ 不修改 `src/foundation/request/` — F1 已稳定
- ❌ 不修改 `src/router/` — F1 已稳定
- ❌ 不修改 `src/foundation/mock/index.ts` — 调度器不变
- ❌ 不修改 `src/foundation/mock/seeds.ts` — 无需新增种子
- ❌ 不修改 `src/views/LoginPage.vue` / `src/layouts/components/AppTopbar.vue` — 不受影响
- ❌ 不新建文件 — 本次改动仅在已有文件中修改/追加
- ❌ 不修改非 auth 的 mock handler（form/bpm/notify/system/storage/job）
- ❌ 不删除或减少 `index.spec.ts` 中已有测试用例
- ❌ 不新增 npm 依赖
- ❌ 不修改构建配置（`vite.config.ts` / `tsconfig.*.json` / `eslint.config.js` / `package.json`）
- ❌ **执行代理若发现方案有误或需调整**：在回执中报告，不自行修改方案
