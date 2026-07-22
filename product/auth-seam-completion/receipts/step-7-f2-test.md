# 测试回执

## 1. Step 编号和名称

**Step F2**：前端 mock（双 token + refresh + logout）+ 回归测试调整 + 四连

## 2. 测试环境

| 项目 | 值 |
|------|-----|
| Node.js | v24.18.0 |
| 平台 | linux x64 |
| 包管理器 | pnpm |
| 测试框架 | Vitest v4.1.9 |
| TypeScript | vue-tsc |
| ESLint | eslint .（含架构边界规则 `no-restricted-imports`） |
| 构建工具 | Vite v8.1.0 / Rolldown |
| 后端状态 | 未启动（纯前端测试） |
| 数据库 | N/A |

## 3. 测试前置条件

- 依赖已安装：`node_modules/` 完整
- Mock 模式：测试使用 `dispatchMock` 直接调用 handler 验证
- 无后端依赖：全部测试走 mock handler

## 4. 实际执行的测试命令

```bash
# 类型检查
pnpm typecheck

# ESLint + 架构边界规则
pnpm lint

# 全量单元测试
pnpm test

# 生产构建（含 tree-shaking 验证）
pnpm build

# tree-shake 验证
grep "dispatchMock\|mock-access-token\|mock-refreshed-token" dist/assets/*.js

# 静态检查
grep -n "expiresIn: 900" src/foundation/mock/handlers.ts
grep -n "'/api/auth/logout'" src/foundation/mock/handlers.ts
```

## 5. 各测试项结果

### 5.1 类型检查

`pnpm typecheck`：零错误。

### 5.2 ESLint

`pnpm lint`：0 errors, 0 warnings（初始 4 个 prettier formatting warnings，`--fix` 后清零）。

### 5.3 全量单元测试

```
pnpm test
  RUN  v4.1.9

  Test Files  56 passed (56)
       Tests  491 passed (491)

  Duration  101.85s
```

56 files, 491 tests, 0 失败, 0 跳过。与 F1 基线完全一致（零退化）。

### 5.4 mock 模块专项验证（从全量测试中提取）

| 测试用例 | 验证内容 | 结果 |
|----------|----------|:----:|
| 模块加载不抛 TDZ | `dispatchMock` / `defineMock` 导入正常 | ✅ |
| **login handler（F1 契约）** | `dispatchMock('POST', '/auth/login', ...)` → `data.accessToken` string + `data.expiresIn` 900 | ✅ |
| **refresh handler（新增）** | `dispatchMock('POST', '/auth/refresh', ...)` → `data.accessToken` string + `data.expiresIn` 900 | ✅ |
| **logout handler（新增）** | `dispatchMock('POST', '/auth/logout', ...)` → `data` null, `code` 0 | ✅ |
| dict handler | 返回 Array | ✅ |
| demo-form 全链路 | 元信息 / definition / submit / list | ✅ 全通过 |
| 业务错误码 | 1401（必填为空）/ 1403（字典值域错误） | ✅ 全通过 |
| DICT handler value 全 string | code 和 label 均为 string | ✅ |
| 未知 type 返回空数组 | 字典、未注册端点 fallthrough | ✅ |
| 运行时注册 | `defineMock` 后 dispatchMock 命中 | ✅ |

### 5.5 生产构建 + tree-shake 验证

```
pnpm build → BUILD SUCCESS (3.36s)
grep "dispatchMock\|mock-access-token\|mock-refreshed-token" dist/assets/*.js
  → 零命中（exit code 1）
```

`[INVALID_ANNOTATION]` 警告来自 `@vueuse/core` 第三方库，非项目代码。

## 6. 通过项

| # | 测试分组 | 文件数 | 用例数 | 结果 |
|---|----------|:------:|:------:|:----:|
| 1 | mock 模块（含新增 auth handler） | 1 | 10 (existing) | ✅ 全部通过 |
| 2 | 全量已有测试 | 55 | 481 | ✅ 零退化 |
| **合计** | | **56** | **491** | **✅ 0 失败** |

## 7. 失败项

无。全部 491 用例通过，0 失败。

## 8. 跳过项及原因

无。全部用例均执行并通过。

## 9. 关键日志或错误信息

无错误。ESLint 初始 4 个 prettier formatting warnings 已在 `--fix` 后清零。

## 10. 是否满足验收标准

逐条对照方案 §14 验收标准：

| # | 验收标准 | 结果 | 证据 |
|---|----------|:--:|------|
| 1 | `handlers.ts` 中 login handler 返回 `data: { accessToken, expiresIn: 900 }`（非 string） | ✅ | 源码确认：`data: { accessToken: ..., expiresIn: 900 }` |
| 2 | refresh handler 已注册，返回 `data: { accessToken, expiresIn: 900 }` | ✅ | 源码 + 测试：`dispatchMock('POST', '/auth/refresh', ...)` → `toMatchObject({ accessToken, expiresIn: 900 })` |
| 3 | logout handler 已注册，返回 `data: null`，`code: 0` | ✅ | 源码 + 测试：`dispatchMock('POST', '/auth/logout', ...)` → `data: null`, `code: 0` |
| 4 | `index.spec.ts` login 断言更新为 `toMatchObject`，不再断言 `typeof string` | ✅ | 源码确认：`expect(loginResult!.data).toMatchObject(...)` — 无 `typeof data === 'string'` |
| 5 | refresh handler 测试断言存在（验证 `code: 0` + `data` 含 `accessToken` + `expiresIn`） | ✅ | 代码行 48-55 |
| 6 | logout handler 测试断言存在（验证 `code: 0` + `data: null`） | ✅ | 代码行 57-61 |
| 7 | `pnpm typecheck` 零错误 | ✅ | 零错误 |
| 8 | `pnpm lint` 零错误零告警 | ✅ | 0 errors, 0 warnings |
| 9 | `pnpm test` 全量通过（≥491 tests） | ✅ | 491 tests, 0 failures, 0 skipped |
| 10 | `pnpm build` BUILD SUCCESS | ✅ | BUILD SUCCESS (3.36s) |
| 11 | 已有非 auth handler 测试全部通过 | ✅ | 全部 55 个已有测试文件零退化 |
| 12 | 构建产物零 mock 字符串 | ✅ | `grep "mock-access-token\|mock-refreshed-token\|dispatchMock" dist/assets/*.js` 零命中 |

**全部 12 条验收标准均满足。**

## 11. 回归风险

**低风险。** 理由：

- **已有测试零退化**：全量 491 测试全部通过（与 F1 基线一致），mock 模块的 form/bpm/notify/system/storage/job handler 测试均不受影响
- **仅修改 mock handler**：`foundation/auth/`、`foundation/request/`、`router/` 等 F1 稳定模块零改动
- **非 auth handler 零改动**：form/bpm/notify/system/storage/job 的 handler 代码完全不变
- **构建产物不含 mock 代码**：`grep` 零命中，tree-shake 确认无残留
- **构建产物不含 mock 代码**（验证）：`grep "mock-access-token\|mock-refreshed-token\|dispatchMock" dist/assets/*.js` 零命中 — tree-shake 验证通过

## 12. 最终结论

**PASSED**
