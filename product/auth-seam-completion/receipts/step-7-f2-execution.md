# 执行回执

## 1. Step 编号和名称

**Step F2**：前端 mock（双 token + refresh + logout）+ 回归测试调整 + 四连

## 2. 使用模型

`deepseek-v4-flash`（方案推荐模型）

## 3. 实际读取的文件

| # | 文件 | 状态 |
|---|------|------|
| 1 | `src/foundation/mock/handlers.ts` | ✅ 已读取（1381 行完整代码，auth handler 第 62-71 行） |
| 2 | `src/foundation/mock/index.spec.ts` | ✅ 已读取（283 行，login 断言在第 30-34 行） |
| 3 | `src/foundation/auth/index.ts` | ✅ 已读取（F1 的 TokenResponseDTO 形状确认） |
| 4 | `src/foundation/mock/index.ts` | ✅ 已读取（MockHandler / MockRegistration 类型确认） |
| 5 | `src/foundation/mock/seeds.ts` | ✅ 已读取（确认无需新增种子） |

全部 5 个要求的文件均已读取。

## 4. 实际修改的文件

| # | 文件 | 类型 | 说明 |
|---|------|:--:|------|
| 1 | `src/foundation/mock/handlers.ts` | **修改** | login handler 返回值从 `string` 改为 `{accessToken, expiresIn}` + 新增 refresh handler + 新增 logout handler |
| 2 | `src/foundation/mock/index.spec.ts` | **修改** | login 断言从 `typeof string` 改为 `toMatchObject` + 新增 refresh/logout 断言 |

共 2 个文件修改。无新建文件。

## 5. 每个文件的修改摘要

### 5.1 `src/foundation/mock/handlers.ts`

**login handler 旧返回值**（第 62-71 行 → 替换）：
```typescript
handler: (_params, _query, _body) => ({
  code: 0,
  message: 'ok',
  data: 'mock-access-token-' + Date.now(),
})
```

**login handler 新返回值**（3 个 handler 区块替换/追加）：
```typescript
// login handler（替换）：
handler: (_params, _query, body) => {
  const payload = body as { username?: string; password?: string } | undefined
  const username = payload?.username ?? 'admin'
  return {
    code: 0, message: 'ok',
    data: { accessToken: 'mock-access-token-' + username + '-' + Date.now(), expiresIn: 900 },
  }
},

// refresh handler（新增）：
handler: () => ({
  code: 0, message: 'ok',
  data: { accessToken: 'mock-refreshed-token-' + Date.now(), expiresIn: 900 },
}),

// logout handler（新增）：
handler: () => ({ code: 0, message: 'ok', data: null }),
```

**关键变更**：
- `data` 从 `string` → `{ accessToken: string, expiresIn: number }`，对齐 F1 的 `TokenResponseDTO`
- refresh handler 新增，返回与 login 相同的对象形状
- logout handler 新增，返回 `data: null`，幂等
- login handler 从 body 取 username 生成可读 token（`mock-access-token-admin-xxx`），`payload?.username ?? 'admin'` 安全回退

### 5.2 `src/foundation/mock/index.spec.ts`

**旧断言**（第 34 行）：
```typescript
expect(typeof loginResult!.data).toBe('string')
```

**新断言**（替换 + 追加）：
```typescript
// login：对象形状匹配
expect(loginResult!.data).toMatchObject({ accessToken: expect.any(String) as string, expiresIn: 900 })

// refresh：新增
expect(refreshResult!.data).toMatchObject({ accessToken: expect.any(String) as string, expiresIn: 900 })

// logout：新增
expect(logoutResult!.data).toBeNull()
```

login body 参数从 `{}, {}` 改为 `{}, { username: 'admin', password: 'admin123' }`。

已有测试结构完全保持：login/refresh/logout 断言均在同一个 `it('registry 有已注册的 handler', ...)` 块内。

## 6. 实际执行的命令

```bash
# 四连校验门
pnpm typecheck          # vue-tsc -b --noEmit → 零错误
pnpm lint               # ESLint → 初始 4 个 prettier warnings
pnpm lint --fix         # 自动修复格式化
pnpm lint               # 再次确认 → 零错误零告警
pnpm test               # vitest run → 56 files passed, 491 tests passed
pnpm build              # vue-tsc + vite build → BUILD SUCCESS (3.36s)

# 静态检查
grep -n "expiresIn: 900" src/foundation/mock/handlers.ts  # 确认 login + refresh handler
grep -n "'/api/auth/logout'" src/foundation/mock/handlers.ts  # 确认 logout handler 已注册
grep "toMatchObject" src/foundation/mock/index.spec.ts    # 确认断言已更新
grep "dispatchMock\|mock-access-token\|mock-refreshed-token" dist/assets/*.js  # tree-shake 验证：零命中
```

## 7. 命令输出摘要

| 命令 | 结果 |
|------|------|
| `pnpm typecheck` | 零错误 |
| `pnpm lint` | 0 errors, 0 warnings |
| `pnpm test` | **56 files passed, 491 tests passed**（F1 基线 491，无退化） |
| `pnpm build` | BUILD SUCCESS，3.36s（`INVALID_ANNOTATION` 警告来自 @vueuse/core，非项目代码） |
| `grep tree-shake` | 零命中 — mock 代码完全被 tree-shake |

## 8. 与原方案的偏差

**无偏差。** 所有修改严格按方案执行：handler 返回值形状、handler 位置顺序、测试断言更新方式、不新建测试 `it` 块、login body 传参方式均与方案完全一致。

## 9. 遇到的问题

### 9.1 Prettier 格式化（测试文件多行参数）

`index.spec.ts` 中 login dispatchMock 调用的 body 参数 `{ username, password }` 跨 5 行，prettier 将其格式化为多行展开（与方案原文的紧凑行内格式不同）。

**处理方式**：`pnpm lint --fix` 自动处理，最终格式 prettier 合规。

## 10. 未完成内容

无。方案要求的 2 个文件修改全部完成。

## 11. 风险和注意事项

### 11.1 mock refresh handler 无状态

mock 模式无 cookie、无 token 状态维护。refresh handler 每次返回全新的 `mock-refreshed-token-{timestamp}`。这是故意的——mock 模式是开发验收台，不需要模拟真实 token 生命周期。F1 的单飞锁在 `foundation/auth/index.ts` 层工作，mock 只是数据提供方。

### 11.2 login handler body 安全访问

`body` 可能为 `undefined`（取决于 dispatchMock 调用方的传参）。handler 中 `body as { username?: string } | undefined` + `payload?.username ?? 'admin'` 安全回退。实际测试中传空对象 `{}` 也能正常工作。

### 11.3 建议的手工验证

如方案 §13.3 所述，如需肉眼验收：
```bash
cd Smart-WorkFlow-Web
pnpm dev:mock
```
1. 浏览器访问 `http://localhost:5173/login`
2. 输入任意用户名/密码 → 登录成功 → 跳转首页
3. 刷新页面 → 冷启动 refresh 成功 → 保持在首页
4. 点击退出 → 跳回登录页

## 12. Git diff 摘要

```
 src/foundation/mock/handlers.ts     |  28 +++++++++++++++++++++++-----
 src/foundation/mock/index.spec.ts   |  20 +++++++++++++++++---
───────────────────────────────────────────────────
 2 files modified, 43 insertions, 5 deletions
```

## 13. 建议执行的测试

1. **mock 单元测试回归**：`pnpm test -t "registry 有已注册的 handler"` 确认 login/refresh/logout 三种 handler 均注册且返回正确形状
2. **`pnpm dev:mock` 手工验证**（可选）：完整登录 → 刷新 → 退出全链路
