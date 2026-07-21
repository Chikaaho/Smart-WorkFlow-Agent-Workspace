# 执行回执

## 1. Step 编号和名称

**Step F1**：前端 Types + API 契约层 + Specs

## 2. 使用模型

- deepseek-v4-flash（按方案推荐，非 Pro 级别，纯机械编码无架构决策）

## 3. 实际读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| 1 | `src/contracts/common.ts` | 确认 `PageResult`/`ApiResponse` 类型签名 |
| 2 | `src/foundation/request/index.ts` | 确认 `request<T>()` 签名和 mock 模式 |
| 3 | `src/contracts/notify.ts` | 参照：简单 DTO 契约文件格式 |
| 4 | `src/modules/workflow/api/index.ts` | 参照：5 函数 API 模块 + `adaptPage()` 模式 |
| 5 | `src/modules/workflow/api/index.spec.ts` | 参照：API 测试 — `vi.mock` + method/URL 断言 |
| 6 | `src/modules/system/api/user.spec.ts` | 参照：`vi.mocked()` 风格 |
| 7 | `src/foundation/auth/token.ts` | 确认 `getAccessToken()` 导出（用于 fetch download） |
| 8 | `product/storage-multi-provider/passed/step-b3-*.md`（B3 后端方案，间接） | 确认端点形状 |

## 4. 实际修改的文件

### 新建文件（3 个）

| # | 文件 | 行数 | 用途 |
|---|------|:----:|------|
| 1 | `src/contracts/storage.ts` | 31 行 | 共享 DTO 类型契约：`StorageFile`（14 字段）、`StorageUploadResult`（4 字段） |
| 2 | `src/modules/storage/api/index.ts` | 110 行 | 5 个 API 导出函数 + `adaptPage()` + `BackendPage<T>` 接口 |
| 3 | `src/modules/storage/api/index.spec.ts` | 197 行 | 8 个测试用例覆盖全部 5 个函数 |

### 修改文件（0 个）

本 Step 零修改，纯新建。

## 5. 每个文件的修改摘要

### `src/contracts/storage.ts`
- `StorageUploadResult` 接口：4 字段（storageKey/storageName/storageUrl/fileSize）
- `StorageFile` 接口：14 字段（id + 10 业务字段 + 4 审计字段：createTime/updateTime/createBy/updateBy）
- 不暴露 `tenantId`/`deleted`/`version`
- 每个字段附 JSDoc 注释

### `src/modules/storage/api/index.ts`
- `BackendPage<T>` 接口：`{ records, total, pageNum, pageSize }` — **使用 `pageNum`/`pageSize`**（与 workflow/system 模块一致），**非方案初始建议的 `current`/`size`**
- `adaptPage<T>()`：转换 `records → list`，因后端字段名已兼容，实际上为简单映射
- `uploadFile(file)`：POST multipart/form-data，FormData 键名 `"file"`
- `listFiles(page, size)`：GET 分页，params `{ page, size }`
- `getFileInfo(storageKey)`：GET 单条
- `deleteFile(storageKey)`：DELETE
- `downloadFile(storageKey)`：fetch() 原生下载，手动 Bearer token，Content-Disposition 解析文件名

### `src/modules/storage/api/index.spec.ts`
- 工厂函数 `makeStorageFile()` / `makeUploadResult()`
- 8 个测试用例（4 个 describe 块）：
  - uploadFile: 1 case — POST + FormData 验证
  - listFiles: 2 cases — 正常分页 + 空列表
  - getFileInfo: 1 case — GET 单条
  - deleteFile: 1 case — DELETE
  - downloadFile: 3 cases — 正常下载含文件名提取 + HTTP 404 抛异常 + 无 Content-Disposition 降级

## 6. 实际执行的命令

```bash
# 目录创建
mkdir -p src/modules/storage/api

# 静态检查（手动验证）
ls src/contracts/storage.ts src/modules/storage/api/index.ts src/modules/storage/api/index.spec.ts
grep -r "from 'axios'" src/modules/storage/  # 零命中（EXIT 1）
grep -rn "from '@/modules/" src/modules/storage/  # 零命中（EXIT 1）
grep "tenantId\|deleted\|version" src/contracts/storage.ts  # 仅注释行（EXIT 0）

# 校验门四连（成功）
pnpm typecheck      → EXIT 0
pnpm lint           → EXIT 0（自动修复 prettier 格式后重跑）
pnpm test           → 49 files / 425 tests passed → EXIT 0
pnpm build          → built in 2.92s → EXIT 0
```

## 7. 命令输出摘要

```text
# pnpm typecheck
vue-tsc -b --noEmit
EXIT: 0

# pnpm lint
0 errors, 0 warnings → EXIT 0

# pnpm test
 Test Files  49 passed (49)
      Tests  425 passed (425)
   Duration  86.87s

# pnpm build
vue-tsc -b && vite build
✓ built in 2.92s
EXIT: 0
```

## 8. 与原方案的偏差

| 偏差项 | 方案初始值 | 实际值 | 原因 |
|--------|-----------|--------|------|
| **MP Page 字段名** | `current`/`size`（方案 §9.3 默认） | **`pageNum`/`pageSize`** | 执行时验证发现：workflow API + system API 已有测试均使用 `pageNum`/`pageSize`，表明后端已配置 Jackson 将 MP Page 映射为 `pageNum`/`pageSize`。`BackendPage<T>` 和测试 mock 据此修正。 |
| **lint prettier** | 预期零警告 | prettier 3 处格式警告 | `pnpm lint --fix` 自动修复后重跑零警告。 |
| **typecheck 未使用变量** | 预期零错误 | `init` 未读 | 测试中 `const [url, init] = mockFetch.mock.calls[0]` 的 `init` 未使用。改为 `const url = mockFetch.mock.calls[0][0]` 后通过。 |

**MP 字段名验证说明**：
- 方案中 §9.3 以 `current`/`size` 为默认（MP 原生字段名），要求执行时验证
- 实际验证方式：读取 `src/modules/workflow/api/index.ts`（BackendPageResult 使用 `pageNum`/`pageSize`）和 `src/modules/workflow/api/index.spec.ts`（测试 mock data 使用 `pageNum`/`pageSize`）以及 `src/modules/system/api/user.spec.ts`（同样使用 `pageNum`/`pageSize`）
- 结论：后端已将 MP Page 序列化为 `pageNum`/`pageSize`，本 API 层保持一致

## 9. 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `pnpm typecheck` 报 `init` 未使用 | 测试中 `[url, init]` 解构，`init` 变量未消费 | 改为 `const url = mockFetch.mock.calls[0][0]` |
| `pnpm lint` 报 prettier 格式告警 | `.eslintrc` 中 prettier 规则要求特定换行 | 自动修复 `pnpm lint --fix` |

## 10. 未完成内容

无。方案中的所有 3 个文件均已创建，5 个 API 函数和 8 个测试用例全部完成。

**未做的内容（符合方案预期）**：
- ❌ 未创建 Vue 视图组件（F2 的工作）
- ❌ 未创建 mock handlers（F3 的工作）
- ❌ 未修改任何已有文件

## 11. 风险和注意事项

- MP Page 字段名使用 `pageNum`/`pageSize`，与 workflow/system 模块一致。如果后端将来升级 Jackson 配置，需要同步调整 `BackendPage<T>` 接口。
- `downloadFile` 使用浏览器原生 `fetch()`，不经过 axios 拦截器，token 手动注入。如果后端将来修改下载端点的鉴权方式，需要同步更新。
- `encodeURIComponent(storageKey)` 已在路径参数中使用，防止特殊字符截断 URL。

## 12. Git diff 摘要

```
新增文件：3 个
新增行数：约 338 行（contracts 31 + api 110 + spec 197）
修改文件：0 个
```

## 13. 建议执行的测试

- F2 视图组件渲染时，可手动验证 `listFiles` 返回空列表时的 UI 空态展示
- F3 mock handlers 实现后，可用 `pnpm dev:mock` 全链路验证 5 个端点的数据一致性
- 后端启动后，curl 验证 `/api/storage/files?page=1&size=5` 的 MP Page 字段名确认 `pageNum`/`pageSize`
