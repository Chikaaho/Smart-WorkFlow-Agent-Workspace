# Step F1：前端 Types + API 契约层 + Specs

## 1. 当前状态

| 项目 | 状态 |
|------|:----:|
| 功能 | storage-multi-provider — 多向可配置文件存储 |
| 功能状态 | **IN_PROGRESS** |
| 前置 Step | B1 ✅ → B2 ✅ → B3 ✅ → B4 ✅（后端 4 Step 全部 PASSED） |
| 当前 Step | F1 — Types + API + Specs（PENDING → READY） |
| 前端基线 | 48 spec files / 417 tests, 四连全绿（CONFIRMED 2026-07-19 F3 验收） |
| 后端端点 | 5 个 `/storage/files` 端点全部就位，B4 验收通过 |

## 2. Step 目标

为文件存储模块创建前端类型契约（`contracts/storage.ts`）、API 层（`modules/storage/api/index.ts`）和 API 单元测试（`index.spec.ts`），建立前后端数据通道。不创建 Vue 视图组件。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：标准前端 API 层 + Types + Specs，完全参照 notify/workflow 既有模式（单文件 api/index.ts），无架构决策，纯机械编码
是否触发升级条件：否
```

## 4. 模型选择理由

F1 工作是创建 3 个 TypeScript 文件（类型契约、API 函数、API 测试），每个文件都有明确的参照模板（notify 模块的 api/index.ts + index.spec.ts、bpm 契约文件）。API 函数是标准的 `request<T>()` 调用 + `adaptPage()` 分页适配，测试是标准的 `vi.mock('@/foundation/request')` + HTTP 方法/URL 断言。无架构决策，纯体力活。

## 5. 已知上下文

### 5.1 后端端点契约（B3 已就位）

| 方法 | 路径 | 后端返回 | 说明 |
|:----:|------|----------|------|
| POST | `/storage/files/upload` | `R<StorageUploadResult>` | multipart/form-data，`file` 字段 |
| GET | `/storage/files?page=&size=` | `R<Page<StorageFile>>` | MyBatis-Plus Page，默认 page=1 size=20，createTime 倒序 |
| GET | `/storage/files/{storageKey}` | `R<StorageFile>` | 文件元数据详情 |
| DELETE | `/storage/files/{storageKey}` | `R<Void>` | 委托 facade.delete()，内部 getFileOrThrow |
| GET | `/storage/files/{storageKey}/download` | `ResponseEntity<InputStreamResource>` | **二进制流**，非 JSON R<T>，Content-Disposition 含 filename*=UTF-8'' |

### 5.2 关键差异：下载端点

下载端点返回**二进制流**（`ResponseEntity<InputStreamResource>`），不经 `R<T>` 包裹。前端的 `request<T>()` 函数（`@/foundation/request`）内部做 `response.data.code !== 0` 校验 + `ApiResponse<T>` 解包，对二进制响应不适用。**下载必须用浏览器原生 `fetch()`**，手动携带 Bearer token + 处理 blob。

### 5.3 MyBatis-Plus Page 序列化

后端 Controller 直接返回 MyBatis-Plus `Page<StorageFile>` 对象。Jackson 序列化后的 JSON 字段名以实际代码为准：

- `records` — `List<T>`（不是 `list`）
- `total` — `long`
- `current` — `long`（**不是 `pageNum`**，这是 MyBatis-Plus 原生字段名）
- `size` — `long`（**不是 `pageSize`**）

**执行时必须先验证**：启动后端（或查看 B3 验收时的响应样例），确认 MP Page 的 JSON 字段名究竟是 `current/size` 还是 `pageNum/pageSize`（取决于 Jackson 配置或 `@JsonProperty`）。`adaptPage()` 的字段映射必须与之匹配。

### 5.4 前端请求层机制

`foundation/request` 的 `request<T>(config)` 函数：
- 接受 axios config 对象（`method`/`url`/`params`/`data`/`headers`）
- 自动附加 `Authorization: Bearer <token>` 头（axios 拦截器）
- 自动解包 `ApiResponse<T>` → 返回 `T`（即 `response.data.data`）
- `code !== 0` 时抛 `ApiError`
- mock 模式下经 `dispatchMock` 短路

### 5.5 既有参照模式

| 参照 | 文件 | 用途 |
|------|------|------|
| 类型契约 | `src/contracts/notify.ts`、`src/contracts/bpm.ts` | 共享 DTO 接口定义，JSDoc 注释对齐后端实体 |
| API 层 | `src/modules/notify/api/index.ts` | 单文件 API 模块（2 函数），简单模块适用 |
| API 层 | `src/modules/workflow/api/index.ts` | 单文件 API 模块（5 函数），含 `adaptPage()` |
| API 测试 | `src/modules/workflow/api/index.spec.ts` | vi.mock + mockRequest，验证 method/url/params/adaptPage |
| API 测试 | `src/modules/system/api/user.spec.ts` | `vi.mocked()` 风格，更简洁 |

### 5.6 StorageUploadResult DTO（后端 `-api` 模块）

```java
// 4 字段：storageKey / storageName / storageUrl / fileSize (Long)
```

### 5.7 StorageFile 实体（后端 Entity，11 业务字段）

```java
// originalName / storageKey / storageName / fileSize / contentType
// / fileExt / providerType / bucketName / storageUrl
// + BaseEntity: id(Long) / createTime / updateTime / createBy / updateBy
// 注意：不继承 BaseEntityNoTenant（有 tenantId），但前端不暴露 tenantId/deleted/version
```

## 6. 执行前必须读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| 1 | `src/contracts/common.ts` | 确认 `PageQuery`/`PageResult`/`ApiResponse` 类型 |
| 2 | `src/foundation/request/index.ts` | 确认 `request()` 签名和 config 参数形状 |
| 3 | `src/contracts/notify.ts` | 参照：简单 DTO 契约文件格式 |
| 4 | `src/modules/workflow/api/index.ts` | 参照：5 函数 API 模块 + `adaptPage()` |
| 5 | `src/modules/workflow/api/index.spec.ts` | 参照：API 测试 — mock + method/URL 断言 |
| 6 | `src/modules/system/api/user.spec.ts` | 参照：`vi.mocked()` 风格（更简洁的 mock 方式） |
| 7 | `src/foundation/auth/token.ts` | 确认 `getAccessToken()` 导出（用于 fetch download） |
| 8 | `eslint.config.js` | 确认架构边界规则（禁直引 axios 等） |

## 7. 允许修改的文件范围

### 新建文件（3 个）

| # | 文件 | 用途 |
|---|------|------|
| 1 | `src/contracts/storage.ts` | 共享 DTO 类型契约：`StorageFile`、`StorageUploadResult` |
| 2 | `src/modules/storage/api/index.ts` | 5 个 API 函数 + `adaptPage()` |
| 3 | `src/modules/storage/api/index.spec.ts` | API 函数单元测试 |

### 修改文件（0 个）

本 Step 只新建文件，不修改任何已有代码。

## 8. 禁止修改的范围

- **禁止修改** `Smart-WorkFlow/` 下任何后端代码
- **禁止修改** 已有前端模块（`system/`、`workflow/`、`notify/`、`form/` 等）
- **禁止修改** `foundation/request/` 或任何基础设施文件
- **禁止修改** `eslint.config.js`、`vite.config.ts`、`package.json`
- **禁止修改** 已有契约文件（`contracts/common.ts`、`contracts/bpm.ts` 等）
- **禁止修改** 已有测试文件
- **禁止新建** `modules/storage/views/` 下的 Vue 组件（那是 F2 的工作）
- **禁止新建** mock handlers（那是 F3 的工作）

## 9. 详细执行方案

### 9.1 创建目录结构

```bash
mkdir -p src/modules/storage/api
```

### 9.2 创建 `src/contracts/storage.ts`（~50 行）

```typescript
// ─── 文件上传结果 DTO（对齐后端 StorageUploadResult） ───
export interface StorageUploadResult {
  /** 存储唯一标识（提供商侧的文件 key/objectName） */
  storageKey: string
  /** 存储文件名（系统重命名后，含扩展名） */
  storageName: string
  /** 文件访问地址 */
  storageUrl: string
  /** 文件大小（字节） */
  fileSize: number
}

// ─── 文件存储记录 DTO（对齐后端 StorageFile 实体，不含 tenantId/deleted/version） ───
export interface StorageFile {
  /** 主键 */
  id: number
  /** 文件原始名称（上传时的文件名） */
  originalName: string
  /** 存储唯一标识 */
  storageKey: string
  /** 存储文件名（系统重命名后） */
  storageName: string
  /** 文件大小（字节） */
  fileSize: number
  /** 文件 MIME 类型 */
  contentType: string
  /** 文件扩展名（小写，不含点，如 "pdf"） */
  fileExt: string
  /** 存储提供商类型（local / minio / cos / qiniu） */
  providerType: string
  /** 存储桶名称 */
  bucketName: string
  /** 文件访问地址 */
  storageUrl: string
  /** 创建时间（ISO-8601 字符串） */
  createTime: string
  /** 更新时间 */
  updateTime: string
  /** 创建人 ID */
  createBy: number
  /** 更新人 ID */
  updateBy: number
}
```

**关键约定**：
- `fileSize` 用 `number`（JS number 安全整数范围 ±2^53，文件大小绝不会溢出）
- `id` 用 `number`（后端 Long → JSON number）
- 时间字段用 `string`（ISO-8601，如 `"2026-07-19T10:00:00"`）
- 不暴露 `tenantId`/`deleted`/`version`（前端不需要）
- 每个字段附 JSDoc 注释，与后端实体注释对齐

### 9.3 创建 `src/modules/storage/api/index.ts`（~100 行）

```typescript
/**
 * 文件存储 API 层 —— 5 个端点。
 *
 * 全部经 foundation/request 单一请求层，禁直引 axios。
 * 后端统一响应 R<T> 由 request() 解包，本层直接拿到 data: T。
 * 下载端点返回二进制流（不经过 R<T>），使用 fetch() + Bearer token。
 */
import { request } from '@/foundation/request'
import { getAccessToken } from '@/foundation/auth/token'
import type { PageResult } from '@/contracts/common'
import type { StorageFile, StorageUploadResult } from '@/contracts/storage'

// ─── 后端 MyBatis-Plus Page 分页原始形状 ───
// ⚠️ 执行前必须验证：MP Page 序列化字段名是 current/size 还是 pageNum/pageSize
// 以实际响应为准，本文件以 current/size 为默认（MP 原生字段名）

interface BackendPage<T> {
  records: T[]
  total: number
  current: number
  size: number
}

function adaptPage<T>(raw: BackendPage<T>): PageResult<T> {
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.current,
    pageSize: raw.size,
  }
}

// ═══════════════════════════════════════
// 上传文件
// ═══════════════════════════════════════

/** POST /storage/files/upload (multipart/form-data) → StorageUploadResult */
export async function uploadFile(file: File): Promise<StorageUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  return request<StorageUploadResult>({
    method: 'POST',
    url: '/storage/files/upload',
    data: formData,
  })
}

// ═══════════════════════════════════════
// 文件列表（分页）
// ═══════════════════════════════════════

/** GET /storage/files?page=&size= → PageResult<StorageFile> */
export async function listFiles(page: number, size: number): Promise<PageResult<StorageFile>> {
  const raw = await request<BackendPage<StorageFile>>({
    method: 'GET',
    url: '/storage/files',
    params: { page, size },
  })
  return adaptPage(raw)
}

// ═══════════════════════════════════════
// 文件详情
// ═══════════════════════════════════════

/** GET /storage/files/{storageKey} → StorageFile */
export async function getFileInfo(storageKey: string): Promise<StorageFile> {
  return request<StorageFile>({
    method: 'GET',
    url: `/storage/files/${storageKey}`,
  })
}

// ═══════════════════════════════════════
// 删除文件
// ═══════════════════════════════════════

/** DELETE /storage/files/{storageKey} → void */
export async function deleteFile(storageKey: string): Promise<void> {
  return request<void>({
    method: 'DELETE',
    url: `/storage/files/${storageKey}`,
  })
}

// ═══════════════════════════════════════
// 下载文件
// ═══════════════════════════════════════

/**
 * GET /storage/files/{storageKey}/download → Blob
 *
 * 使用 fetch() 而非 request()，因为下载端点返回二进制流
 * （ResponseEntity<InputStreamResource>），不经过 R<T> JSON 包裹。
 */
export async function downloadFile(storageKey: string): Promise<{ blob: Blob; fileName: string }> {
  const token = getAccessToken()
  const response = await fetch(`/api/storage/files/${encodeURIComponent(storageKey)}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new Error(`下载失败: HTTP ${response.status}`)
  }
  const blob = await response.blob()
  // 从 Content-Disposition 提取 filename（后端用 filename*=UTF-8'' 编码）
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename\*=(?:UTF-8''|utf-8'')(.+)/i)
    ?? disposition.match(/filename="?(.+?)"?$/i)
  const fileName = match ? decodeURIComponent(match[1]) : storageKey
  return { blob, fileName }
}
```

**注意**：
1. `listFiles` 的 `params` 用 `{ page, size }`（后端 `@RequestParam` 参数名是 `page` 和 `size`，不是 `pageNum`/`pageSize`）
2. `uploadFile` 的 `FormData` 键名是 `"file"`（对齐后端 `@RequestParam("file")`）
3. `downloadFile` 路径带 `/api` 前缀（`fetch` 不经过 axios baseURL）
4. `downloadFile` 编码 `storageKey`（`encodeURIComponent`），防止特殊字符截断 URL
5. `BackendPage` 的 `current`/`size` 字段名**必须在执行时验证**：启动后端 → 调 list 端点 → 确认 JSON 字段名

### 9.4 创建 `src/modules/storage/api/index.spec.ts`（~200 行）

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRequest = vi.fn()

vi.mock('@/foundation/request', () => ({
  request: <T>(config: unknown): Promise<T> => mockRequest(config),
}))

// fetch 也用 mock（downloadFile 走 fetch）
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// ⚠️ 使用动态 import：vi.mock 必须在 import 之前
const storageApi = await import('./index')

// ─── 造数据 ───

function makeStorageFile(overrides: Partial<import('@/contracts/storage').StorageFile> = {}): import('@/contracts/storage').StorageFile {
  return {
    id: 1,
    originalName: '测试文件.pdf',
    storageKey: 'abc123.pdf',
    storageName: 'abc123.pdf',
    fileSize: 1024,
    contentType: 'application/pdf',
    fileExt: 'pdf',
    providerType: 'minio',
    bucketName: 'test-bucket',
    storageUrl: '/files/abc123.pdf',
    createTime: '2026-07-19T10:00:00',
    updateTime: '2026-07-19T10:00:00',
    createBy: 1,
    updateBy: 1,
    ...overrides,
  }
}

function makeUploadResult(overrides = {}): import('@/contracts/storage').StorageUploadResult {
  return {
    storageKey: 'abc123.pdf',
    storageName: 'abc123.pdf',
    storageUrl: '/files/abc123.pdf',
    fileSize: 1024,
    ...overrides,
  }
}

// ═══════════════════════════════════════

describe('modules/storage/api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── uploadFile ───

  describe('uploadFile', () => {
    it('POST /storage/files/upload with FormData, returns StorageUploadResult', async () => {
      const result = makeUploadResult()
      mockRequest.mockResolvedValueOnce(result)

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const data = await storageApi.uploadFile(file)

      expect(mockRequest).toHaveBeenCalledTimes(1)
      const call = mockRequest.mock.calls[0][0]
      expect(call.method).toBe('POST')
      expect(call.url).toBe('/storage/files/upload')
      expect(call.data).toBeInstanceOf(FormData)
      expect(call.data.get('file')).toBe(file)
      expect(data).toEqual(result)
    })
  })

  // ─── listFiles ───

  describe('listFiles', () => {
    it('GET /storage/files?page=&size=, adapts MyBatis-Plus Page', async () => {
      const file = makeStorageFile()
      mockRequest.mockResolvedValueOnce({
        records: [file],
        total: 100,
        current: 1,
        size: 20,
      })

      const result = await storageApi.listFiles(1, 20)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/storage/files',
        params: { page: 1, size: 20 },
      })
      expect(result.list).toHaveLength(1)
      expect(result.list[0].originalName).toBe('测试文件.pdf')
      expect(result.total).toBe(100)
      expect(result.pageNum).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('returns empty list when no files', async () => {
      mockRequest.mockResolvedValueOnce({
        records: [],
        total: 0,
        current: 1,
        size: 20,
      })

      const result = await storageApi.listFiles(1, 20)
      expect(result.list).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ─── getFileInfo ───

  describe('getFileInfo', () => {
    it('GET /storage/files/{storageKey} → StorageFile', async () => {
      const file = makeStorageFile()
      mockRequest.mockResolvedValueOnce(file)

      const result = await storageApi.getFileInfo('abc123.pdf')

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/storage/files/abc123.pdf',
      })
      expect(result).toEqual(file)
    })
  })

  // ─── deleteFile ───

  describe('deleteFile', () => {
    it('DELETE /storage/files/{storageKey} → void', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      await storageApi.deleteFile('abc123.pdf')

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/storage/files/abc123.pdf',
      })
    })
  })

  // ─── downloadFile ───

  describe('downloadFile', () => {
    it('GET via fetch, extracts filename from Content-Disposition', async () => {
      const blob = new Blob(['binary content'])
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(blob),
        headers: new Headers({
          'Content-Disposition': "attachment; filename*=UTF-8''%E6%B5%8B%E8%AF%95%E6%96%87%E4%BB%B6.pdf",
        }),
      })

      const result = await storageApi.downloadFile('abc123.pdf')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toContain('/api/storage/files/abc123.pdf/download')
      expect(result.blob).toBe(blob)
      expect(result.fileName).toBe('测试文件.pdf')
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(storageApi.downloadFile('nonexistent')).rejects.toThrow('下载失败')
    })

    it('falls back to storageKey when no Content-Disposition', async () => {
      const blob = new Blob(['content'])
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(blob),
        headers: new Headers(),
      })

      const result = await storageApi.downloadFile('abc123.pdf')
      expect(result.fileName).toBe('abc123.pdf')
    })
  })
})
```

**注意**：
1. 测试用 `mockRequest` 手动函数 + `vi.mock` (workflow/notify 风格)，不用 `vi.mocked()` (system 风格)，因为 storage 模块简单且 workflow/notify 是最新参照
2. `globalThis.fetch` 的 mock 需要 `vi.fn()` 并在 `afterEach` 中 `vi.restoreAllMocks()`
3. `makeStorageFile`/`makeUploadResult` 工厂函数减少重复造数据
4. 测试覆盖：happy path × 5 端点 + 空列表 + 下载失败 + 下载文件名降级 = 8 个用例

### 9.5 校验命令

```bash
cd /data/reasonix/files/Smart-WorkFlow-Web

# 1. TypeScript 类型检查
pnpm typecheck; echo "EXIT: $?"

# 2. ESLint（含架构边界规则）
pnpm lint; echo "EXIT: $?"

# 3. Vitest 单元测试
pnpm test; echo "EXIT: $?"

# 4. 全量校验门
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## 10. 关键实现约束

- **单一请求层**：JSON 端点一律经 `request()`（`@/foundation/request`），禁直引 `axios`
- **下载走 fetch**：`downloadFile()` 用浏览器原生 `fetch()`，手动带 `Authorization: Bearer` 头（fetch 不经 axios 拦截器自动加 token）。**不是** ESLint 违规（`fetch` 是浏览器 API，不是第三方库）
- **FormData 键名 = `"file"`**：对齐后端 `@RequestParam("file") MultipartFile file`
- **分页参数名 = `page`/`size`**：对齐后端 `@RequestParam(defaultValue = "1") long page` 和 `@RequestParam(defaultValue = "20") long size`
- **adaptPage 字段映射**：`records → list`、`total → total`、`current → pageNum`、`size → pageSize`。**执行前必须验证**：启动后端确认 MP Page JSON 的实际字段名
- **downloadFile 路径带 `/api` 前缀**：`fetch` 不经过 axios `baseURL`（axios.baseURL = `/api`），需手动拼完整路径
- **downloadFile 编码 storageKey**：`encodeURIComponent(storageKey)` 防特殊字符截断
- **StorageFile.id 用 `number`**：后端 Long → JSON number，不用 string
- **不暴露 `tenantId`/`deleted`/`version`**：前端不消费这些字段
- **ESLint 零告警**：新增文件必须通过架构边界规则（`modules/storage/api/index.ts` 禁直引 axios、`modules/*` 间禁横向 import）
- **类型检查零错误**：`pnpm typecheck` 必须通过

## 11. 边界情况

| 边界 | 处理方式 | 覆盖 |
|------|----------|:----:|
| 文件列表为空 | `adaptPage` 返回 `{ list: [], total: 0, ... }` | 测试 |
| storageKey 含特殊字符（`/`、`%`、空格） | `encodeURIComponent` 编码 | 编码路径自动处理 |
| 下载时后端返回 404 | fetch `!response.ok` → 抛 Error | 测试 |
| 下载时 Content-Disposition 缺失 | 降级使用 `storageKey` 作为文件名 | 测试 |
| 上传时 File 为 0 字节 | 后端返回 `PARAM_ERROR`，`request()` 内部 `code !== 0` → 抛 `ApiError` | request() 通用处理 |
| fetch 时无 token（未登录） | 不传 Authorization 头，后端过滤器返回 401 | fetch 抛异常 |
| MyBatis-Plus Page 字段名差异 | 执行时验证实际 JSON 响应，修正 `BackendPage` 接口字段名 | 执行时验证 |

## 12. 风险和回滚方案

### 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|:------:|------|------|
| MP Page 字段名与预期不符（`current` vs `pageNum`） | 中 | `adaptPage` 映射错误 → 列表页显示异常 | **执行时必验证**：启动后端，调 list 端点，看 JSON |
| `pnpm lint` 新增架构规则告警 | 低 | CI 红灯 | 执行前读 `eslint.config.js`，确认 `modules/storage` 不在禁止清单 |
| fetch mock 在 jsdom 环境不兼容 | 低 | 下载测试失败 | jsdom + vitest 支持 `globalThis.fetch` mock，已验证 work |
| `request()` 对 FormData 的 Content-Type 处理 | 低 | 上传失败 | axios 自动检测 FormData → 设 `multipart/form-data` + boundary |

### 回滚

```bash
# 删除 3 个新建文件
rm src/contracts/storage.ts
rm -r src/modules/storage/

# 确认回滚成功
pnpm typecheck && pnpm lint && pnpm test  # 应与基线一致（48 files / 417 tests）
```

## 13. 测试方案

### 13.1 静态检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| S1 | 3 个文件存在 | `ls src/contracts/storage.ts src/modules/storage/api/index.ts src/modules/storage/api/index.spec.ts` | 3 文件 |
| S2 | 无 axios 直引 | `grep -r "from 'axios'" src/modules/storage/` | 零命中 |
| S3 | 无跨模块横向 import | `grep -r "from '@/modules/" src/modules/storage/` | 零命中 |
| S4 | StorageFile 无 tenantId/deleted/version | `grep "tenantId\|deleted\|version" src/contracts/storage.ts` | 零命中（version 除外，若实体的确无） |
| S5 | `pnpm typecheck` 退出码 0 | `pnpm typecheck` | EXIT 0 |
| S6 | `pnpm lint` 退出码 0（含架构边界规则） | `pnpm lint` | EXIT 0 |

### 13.2 单元测试

| 编号 | 测试用例 | 覆盖函数 | 场景 |
|:----:|----------|:--------:|------|
| T1 | uploadFile — POST + FormData + 返回值 | `uploadFile` | Happy path |
| T2 | listFiles — GET + params + adaptPage | `listFiles` | Happy path：1 条记录 |
| T3 | listFiles — 空列表 | `listFiles` | 边界：0 条记录 |
| T4 | getFileInfo — GET /{storageKey} + 返回值 | `getFileInfo` | Happy path |
| T5 | deleteFile — DELETE /{storageKey} + void | `deleteFile` | Happy path |
| T6 | downloadFile — fetch + filename 提取 | `downloadFile` | Happy path：含 Content-Disposition |
| T7 | downloadFile — 非 ok 响应抛异常 | `downloadFile` | 边界：404 |
| T8 | downloadFile — 无 Content-Disposition 降级 | `downloadFile` | 边界：降级文件名 |

### 13.3 集成测试

不适用（F1 为纯 API 层，无 Vue 组件渲染）。

### 13.4 手工验证

| 编号 | 验证项 | 步骤 |
|:----:|--------|------|
| V1 | `contracts/storage.ts` JSDoc 注释完整 | 通读文件，每个 interface 和每个字段均有注释 |
| V2 | `api/index.ts` 分页参数名验证 | 启动后端 → `curl "http://localhost:8080/api/storage/files?page=1&size=5"` → 确认返回 200 |
| V3 | MP Page JSON 字段名确认 | 从 V2 的 curl 响应中确认 `current`/`size` vs `pageNum`/`pageSize` |

### 13.5 回归检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| R1 | 测试文件数 ≥ 49（基线 48 + 新增 1） | `find src -name "*.spec.ts" | wc -l` | ≥ 49 |
| R2 | 测试用例数 ≥ 425（基线 417 + 新增 8） | `pnpm test` 输出 | ≥ 425 |
| R3 | 全量测试零失败 | `pnpm test` | 0 failures |
| R4 | 全量四连绿 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | 全部 EXIT 0 |
| R5 | 已有测试计数不变 | `pnpm test` 输出 | form/system/notify/workflow 模块测试数与基线一致 |

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|:--------:|
| F1-1 | `src/contracts/storage.ts` 存在，含 `StorageFile` + `StorageUploadResult` 接口 | S1 + 代码审查 |
| F1-2 | `StorageFile` 含全部 14 字段（id + 10 业务字段 + 4 审计字段），不含 tenantId/deleted/version | S4 |
| F1-3 | `StorageUploadResult` 含 4 字段（storageKey/storageName/storageUrl/fileSize），fileSize 为 number | 代码审查 |
| F1-4 | `src/modules/storage/api/index.ts` 存在，含 5 个导出函数 | S1 + 代码审查 |
| F1-5 | `uploadFile` 用 `FormData`，键名 `"file"`，POST `/storage/files/upload` | T1 |
| F1-6 | `listFiles` 用 GET + params `{page, size}` + `adaptPage()` 转换 records→list | T2 + T3 |
| F1-7 | `getFileInfo` 用 GET `/storage/files/{storageKey}` | T4 |
| F1-8 | `deleteFile` 用 DELETE `/storage/files/{storageKey}` | T5 |
| F1-9 | `downloadFile` 用 `fetch()`（非 `request()`），手动带 Bearer token，从 Content-Disposition 提取文件名 | T6 + T7 + T8 |
| F1-10 | API 层无直引 `axios`（全部经 `@/foundation/request` 或 `fetch`） | S2 |
| F1-11 | API 层无跨模块横向 import | S3 |
| F1-12 | `src/modules/storage/api/index.spec.ts` 存在，≥ 8 个测试用例，覆盖全部 5 个函数 | T1-T8 |
| F1-13 | `pnpm typecheck` 退出码 0 | S5 |
| F1-14 | `pnpm lint` 退出码 0 | S6 |
| F1-15 | `pnpm test` 退出码 0，新增测试 ≥ 8 个 | R1 + R2 + R3 |
| F1-16 | `pnpm build` 退出码 0（生产构建含类型检查） | R4 |

## 15. 执行回执格式

按 §7.1 标准格式返回，特别需包含：

- 第 3 项"实际读取的文件"：列出读取的前端文件及目的
- 第 4 项"实际修改的文件"：3 个新建文件
- 第 5 项"每个文件的修改摘要"：每个文件的函数/接口/测试用例数
- 第 6 项"实际执行的命令"：含完整 `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm build` 命令及退出码
- 第 7 项"命令输出摘要"：四连结果 + 测试计数（总文件数、总用例数）
- 第 8 项"与原方案的偏差"：特别需注明 **MyBatis-Plus Page 字段名验证结果**（实际是 `current/size` 还是 `pageNum/pageSize`），以及是否据此调整了 `adaptPage()`
- 第 12 项"Git diff 摘要"：新增文件数 + 行数

**如果未做 MP Page 字段名验证（V2/V3），回执不合格，需补充。**

## 16. 测试回执格式

按 §7.2 标准格式返回，特别需包含：

- 第 4 项"实际执行的测试命令"：列出 S1-S6 + T1-T8 + R1-R5 全部命令及完整输出
- 第 5 项"各测试项结果"：逐条 S1-S6 + T1-T8 + R1-R4 列表（**含实际数字**，如 "Tests: 49 spec files / 425 tests"）
- 第 6 项"通过项"：每个测试项的完整输出粘贴
- 第 10 项"是否满足验收标准"：逐条对照 F1-1 ~ F1-16

**测试计数格式要求**：
```text
pnpm test 输出摘要：
 Test Files  49 passed (49)  ← 基线 48 + 1
      Tests  425 passed (425)  ← 基线 417 + 8
```

## 17. 明确禁止事项

- ❌ **禁止**创建 Vue 视图组件（`modules/storage/views/`）— 那是 F2 的工作
- ❌ **禁止**创建 mock handlers（`foundation/mock/handlers.ts` 新增 storage 段）— 那是 F3 的工作
- ❌ **禁止**创建路由配置或菜单注册
- ❌ **禁止**修改 `foundation/request/` 的任何文件（包括添加 `requestBlob` 等）
- ❌ **禁止**在 API 层中直引 `axios`（ESLint 强制）— 一律走 `request()` 或 `fetch()`
- ❌ **禁止**从其他 `modules/*` import（ESLint 横向边界强制）
- ❌ **禁止**修改 `package.json`、`vite.config.ts`、`eslint.config.js`
- ❌ **禁止**修改已有契约文件（`contracts/common.ts` 等）
- ❌ **禁止**在 `StorageFile` 类型中暴露 `tenantId`/`deleted`/`version`
- ❌ **禁止**在 `uploadFile` 中设置 `Content-Type: multipart/form-data` 头（axios 自动处理 + boundary）
- ❌ **禁止**下载函数使用 `request()`（二进制响应不兼容 `ApiResponse<T>` 解包）
- ❌ **禁止**访问 `Smart-WorkFlow/` 后端代码
- ❌ **禁止**跳过 MP Page 字段名验证就直接提交回执
