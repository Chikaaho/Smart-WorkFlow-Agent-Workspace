# Step F3：前端 Mock + Handlers + 路由

## 1. 当前状态

| 项目 | 状态 |
|------|:----:|
| 功能 | storage-multi-provider — 多向可配置文件存储 |
| 功能状态 | **IN_PROGRESS** |
| 前置 Step | B1 ✅ → B2 ✅ → B3 ✅ → B4 ✅ → F1 ✅ → F2 ✅（16/16 PASSED） |
| 当前 Step | F3 — Mock + Handlers + 路由（PENDING → READY） |
| 前端基线 | 50 spec files / 438 tests，四连全绿（CONFIRMED 2026-07-19 F2 验收） |
| F1 交付物 | contracts/storage.ts（43 行）、api/index.ts（110 行）、api/index.spec.ts（197 行） |
| F2 交付物 | utils/format.ts（32 行）、views/StorageList.vue（322 行）、views/StorageList.spec.ts（338 行，13 测试） |
| 当前状态 | F2 页面组件已就位但不可见 — 无菜单入口（`MOCK_MENU_TREE` 无 storage 项）、无 mock 数据（列表页在 `pnpm dev:mock` 下无数据） |

## 2. Step 目标

添加文件存储模块的 mock handlers（5 个端点中的 4 个）、mock 种子数据、菜单项和权限，使文件管理列表页在 `pnpm dev:mock` 模式下可肉眼验收。**不修改路由配置文件（动态路由通过 `import.meta.glob` 自动发现 `StorageList.vue`）。**

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：纯数据添加（mock handlers + seed data + menu item + permission），无架构决策，完全遵循已有 patterns（notify/workflow/system 的 handler + seed 模式），机械编码
是否触发升级条件：否
```

## 4. 模型选择理由

F3 工作是向 handlers.ts 和 seeds.ts 追加数据（4 个 handler 注册项 + 1 个种子数组 + 1 个菜单节点 + 1 个权限字符串），遵循已有模块（notify/workflow/system）的精确模式。零新建文件，零架构决策，零测试文件（mock handlers 通过 `pnpm dev:mock` 肉眼验收，不经单元测试覆盖）。

## 5. 已知上下文

### 5.1 Mock 系统架构

来自 `src/foundation/mock/index.ts` 和 `src/foundation/mock/handlers.ts`：

- **拦截点**：`foundation/request` 顶部短路 axios（`request<T>()` 函数）。**不拦截浏览器原生 `fetch()`**。
- **激活条件**：`import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'`（即 `pnpm dev:mock` 模式）
- **Handler 签名**：`(params: Record<string, string>, query: Record<string, string>, body: unknown) => ApiResponse<T>`
- **注册条目**：`MockRegistration = { method: MockMethod; pattern: `/${string}`; handler: MockHandler }`
- **响应形状**：`{ code: number, message: string, data: T | null }` — 即 `ApiResponse<T>`
- **分页形状**：`data: { records: T[], total: number, pageNum: number, pageSize: number }` — 对齐后端 MP Page Jackson 序列化
- **路径参数**：`:param` 占位符（如 `/api/storage/files/:storageKey`）
- **URL 拼接**：`baseURL(/api) + url` → 完整路径，所以 pattern 均以 `/api/` 开头
- **种子数据**：`seeds.ts` 中 `const` 声明可变数组，handler 中通过 `.splice()`/`.push()` 原地 mutate
- **导入模式**：handlers.ts 从 seeds.ts import，不反向依赖

### 5.2 关键限制：download 端点不走 Mock

`downloadFile()` 在 F1 中使用浏览器原生 `fetch()`（非 `request()`），**不经 mock 系统拦截**。`pnpm dev:mock` 下点击下载会尝试访问真实后端 → 网络错误 → UI 显示"下载失败"。

**这是已知限制，非 bug。** 在 `pnpm dev`（真后端）模式下下载正常工作。Mock 模式下不添加 download handler（添加也不会被调用，属死代码）。此限制在方案中明确标注。

### 5.3 API 端点形状（F1 已就位）

来自 `src/modules/storage/api/index.ts`：

| 函数 | HTTP | URL | Mock 拦截？ |
|------|:----:|-----|:----------:|
| `uploadFile` | POST | `/storage/files/upload` | ✅ 走 `request()` |
| `listFiles` | GET | `/storage/files?page=&size=` | ✅ 走 `request()` |
| `getFileInfo` | GET | `/storage/files/{storageKey}` | ✅ 走 `request()` |
| `deleteFile` | DELETE | `/storage/files/{storageKey}` | ✅ 走 `request()` |
| `downloadFile` | GET | `/api/storage/files/{storageKey}/download` | ❌ 走原生 `fetch()` |

> **query 参数名**：`listFiles(page, size)` → axios params `{ page, size }` → URL query `?page=1&size=10`。Mock handler 通过 `query.page` 和 `query.size` 读取（非 `pageNum`/`pageSize`）。
> **响应字段名**：后端 MP Page 序列化为 `pageNum`/`pageSize`，`adaptPage()` 期望 `records`/`total`/`pageNum`/`pageSize`。

### 5.4 StorageFile 契约形状（F1 已就位）

来自 `src/contracts/storage.ts`：

```typescript
interface StorageFile {
  id: number
  originalName: string    // 文件原始名称
  storageKey: string      // 存储唯一标识（UUID 风格）
  storageName: string     // 存储文件名（系统重命名后）
  fileSize: number        // 字节
  contentType: string     // MIME 类型
  fileExt: string         // 扩展名（小写，如 "pdf"）
  providerType: string    // local | minio | cos | qiniu
  bucketName: string      // 存储桶名称
  storageUrl: string      // 文件访问地址
  createTime: string      // ISO-8601
  updateTime: string
  createBy: number
  updateBy: number
}
```

### 5.5 菜单树结构

来自 `src/foundation/mock/seeds.ts` → `MOCK_MENU_TREE`：

```typescript
{
  id: string; parentId: string | null; name: string; title: string;
  path: string; component: string | null;  // component 如 "storage/views/StorageList"
  icon: string; sort: number; menuType: 0 | 1;  // 0 = 目录, 1 = 叶子页面
  permission: string; hidden?: boolean;
  children?: MenuNode[];
}
```

**component 路径格式**：`"storage/views/StorageList"`（不含 `/src/modules/` 前缀和 `.vue` 后缀）。由 `foundation/menu/index.ts::resolveComponent()` 拼接为 `/src/modules/storage/views/StorageList.vue`，经 `import.meta.glob('/src/modules/**/*.vue')` 白名单懒加载解析。

### 5.6 动态路由

- 业务模块路由不由 `src/router/index.ts` 静态定义
- 运行时由 `router/guard.ts` 调用 `buildRoutesFromMenu(MOCK_MENU_TREE)` → `router.addRoute()` 动态添加
- 组件通过 `import.meta.glob('/src/modules/**/*.vue')` 懒加载（F2 创建的 `StorageList.vue` 已在 glob 覆盖范围内）
- **F3 不修改 `src/router/` 下的任何文件**

### 5.7 已有菜单项 ID 和排序

来自 `MOCK_MENU_TREE`（当前最大 ID = 8，最大 sort = 8）：

| id | name | title | sort |
|:--:|------|-------|:----:|
| 1 | system | 系统管理 | 1 |
| 2 | form-designer | 表单设计器 | 2 |
| 3 | workflow | 流程引擎 | 3 |
| 4 | notify | 通知 | 4 |
| 5 | agent | 智能体 | 5 |
| 6 | iot | 物联网 | 6 |
| 7 | openapi | 开放接口 | 7 |
| 8 | form-def-list | 表单管理 | 8 |

新 storage 菜单项使用 `id: '9'`、`sort: 9`、`icon: 'FolderOpened'`（Element Plus Icons 内建图标，无需安装）。

### 5.8 已有权限

来自 `MOCK_SESSION_DATA.permissions`（当前 14 项）：

```
'system:view', 'form:view', 'form:form:view', 'workflow:view', 'notify:view',
'system:user:list', 'system:role:list', 'system:dept:list', 'system:post:list'
```

需新增 `'storage:view'`（与现有 `'notify:view'`、`'workflow:view'` 模式一致）。

### 5.9 参照模式

| 参照 | 文件 | 模式 |
|------|------|------|
| 通知模块 handler | `handlers.ts` L701–L726 | 2 个 handler（list + markAsRead），种子数据引用，`:id` 路径参数 |
| 工作流待办 handler | `handlers.ts` L591–L648 | 分页列表 handler（`query.pageNum`/`query.pageSize` → `records`/`total`/`pageNum`/`pageSize`），原地 mutate 删除 |
| 通知种子数据 | `seeds.ts` L741–L867 | 可变数组 `MOCK_NOTIFY_MESSAGES`，含 `read` 布尔字段原地修改 |
| 菜单树 | `seeds.ts` L40–L247 | `MOCK_MENU_TREE` 叶子节点结构 |

## 6. 执行前必须读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| **1** | `src/foundation/mock/handlers.ts` | 确认现有 handler 注册模式、import 语句、分页形状 |
| **2** | `src/foundation/mock/seeds.ts` | 确认种子数据模式、MOCK_MENU_TREE 结构、MOCK_SESSION_DATA 结构 |
| **3** | `src/modules/storage/api/index.ts` | 确认 5 个 API 函数的精确签名、URL、query 参数名 |
| **4** | `src/contracts/storage.ts` | 确认 StorageFile / StorageUploadResult 字段 |
| **5** | `src/foundation/mock/index.ts`（可选） | 确认 MockHandler 签名和 dispatchMock 机制 |
| **6** | `src/foundation/menu/index.ts`（可选） | 确认 `resolveComponent` glob 拼接逻辑 |

## 7. 允许修改的文件范围

### 修改文件（2 个）

```
src/foundation/mock/handlers.ts   — 追加 4 个 storage mock handler 注册项
src/foundation/mock/seeds.ts      — 追加 MOCK_STORAGE_FILES 种子数组 + 菜单项 + 权限
```

### 新建文件（0 个）

**无。** 本 Step 纯追加数据，不新建文件。

## 8. 禁止修改的范围

- ❌ `src/modules/storage/` 任何文件 — F1/F2 已验收，不可回退
- ❌ `src/contracts/storage.ts` — F1 已验收
- ❌ `src/router/index.ts` — 动态路由无需修改
- ❌ `src/router/guard.ts` — 菜单驱动路由构建无需修改
- ❌ `src/foundation/request/index.ts` — 全局请求层
- ❌ `src/foundation/menu/index.ts` — 菜单加载逻辑
- ❌ `src/stores/menu.ts` — 菜单 store
- ❌ `src/components/` 任何文件 — 页型组件
- ❌ `eslint.config.js`、`vite.config.ts`、`package.json`、`pnpm-lock.yaml`
- ❌ `Smart-WorkFlow/` 后端任何文件
- ❌ 已有模块（system/notify/workflow/form）的任何文件
- ❌ **不得**删除或修改 handlers.ts / seeds.ts 中任何已有注册项或种子数据
- ❌ **不得**修改已有菜单项或已有权限

## 9. 详细执行方案

### 9.1 修改 `src/foundation/mock/seeds.ts` — 追加种子数据

#### 9.1.1 在文件末尾（`MOCK_POSTS_LIST` 之后）追加 `MOCK_STORAGE_FILES`

```typescript
// ─── 文件存储 Mock 种子 ──────────────────────────────

export const MOCK_STORAGE_FILES: Array<{
  id: number
  originalName: string
  storageKey: string
  storageName: string
  fileSize: number
  contentType: string
  fileExt: string
  providerType: string
  bucketName: string
  storageUrl: string
  createTime: string
  updateTime: string
  createBy: number
  updateBy: number
}> = [
  {
    id: 1,
    originalName: '请假申请单模板.pdf',
    storageKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf',
    storageName: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf',
    fileSize: 245760,
    contentType: 'application/pdf',
    fileExt: 'pdf',
    providerType: 'minio',
    bucketName: 'sw-files',
    storageUrl: '/files/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf',
    createTime: '2026-07-15T09:00:00',
    updateTime: '2026-07-15T09:00:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 2,
    originalName: '产品原型截图.png',
    storageKey: 'b2c3d4e5-f6a7-8901-bcde-f12345678901.png',
    storageName: 'b2c3d4e5-f6a7-8901-bcde-f12345678901.png',
    fileSize: 1572864,
    contentType: 'image/png',
    fileExt: 'png',
    providerType: 'cos',
    bucketName: 'sw-images-1250000000',
    storageUrl: 'https://sw-images-1250000000.cos.ap-guangzhou.myqcloud.com/files/b2c3d4e5.png',
    createTime: '2026-07-15T14:30:00',
    updateTime: '2026-07-15T14:30:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 3,
    originalName: '2026年Q2工作总结.docx',
    storageKey: 'c3d4e5f6-a7b8-9012-cdef-123456789012.docx',
    storageName: 'c3d4e5f6-a7b8-9012-cdef-123456789012.docx',
    fileSize: 51200,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileExt: 'docx',
    providerType: 'local',
    bucketName: 'default',
    storageUrl: '/upload/c3d4e5f6-a7b8-9012-cdef-123456789012.docx',
    createTime: '2026-07-16T10:15:00',
    updateTime: '2026-07-16T10:15:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 4,
    originalName: '项目进度表.xlsx',
    storageKey: 'd4e5f6a7-b8c9-0123-defa-234567890123.xlsx',
    storageName: 'd4e5f6a7-b8c9-0123-defa-234567890123.xlsx',
    fileSize: 1048576,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileExt: 'xlsx',
    providerType: 'qiniu',
    bucketName: 'sw-docs',
    storageUrl: 'https://cdn.example.com/files/d4e5f6a7-b8c9-0123-defa-234567890123.xlsx',
    createTime: '2026-07-16T16:45:00',
    updateTime: '2026-07-16T16:45:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 5,
    originalName: '团建合影.jpg',
    storageKey: 'e5f6a7b8-c9d0-1234-efab-345678901234.jpg',
    storageName: 'e5f6a7b8-c9d0-1234-efab-345678901234.jpg',
    fileSize: 3145728,
    contentType: 'image/jpeg',
    fileExt: 'jpg',
    providerType: 'cos',
    bucketName: 'sw-images-1250000000',
    storageUrl: 'https://sw-images-1250000000.cos.ap-guangzhou.myqcloud.com/files/e5f6a7b8.jpg',
    createTime: '2026-07-17T08:00:00',
    updateTime: '2026-07-17T08:00:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 6,
    originalName: '会议纪要.txt',
    storageKey: 'f6a7b8c9-d0e1-2345-fabc-456789012345.txt',
    storageName: 'f6a7b8c9-d0e1-2345-fabc-456789012345.txt',
    fileSize: 2048,
    contentType: 'text/plain',
    fileExt: 'txt',
    providerType: 'local',
    bucketName: 'default',
    storageUrl: '/upload/f6a7b8c9-d0e1-2345-fabc-456789012345.txt',
    createTime: '2026-07-17T11:30:00',
    updateTime: '2026-07-17T11:30:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 7,
    originalName: '系统架构图.svg',
    storageKey: 'a7b8c9d0-e1f2-3456-abcd-567890123456.svg',
    storageName: 'a7b8c9d0-e1f2-3456-abcd-567890123456.svg',
    fileSize: 45056,
    contentType: 'image/svg+xml',
    fileExt: 'svg',
    providerType: 'minio',
    bucketName: 'sw-files',
    storageUrl: '/files/a7b8c9d0-e1f2-3456-abcd-567890123456.svg',
    createTime: '2026-07-18T09:45:00',
    updateTime: '2026-07-18T09:45:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 8,
    originalName: 'API接口文档.pdf',
    storageKey: 'b8c9d0e1-f2a3-4567-bcde-678901234567.pdf',
    storageName: 'b8c9d0e1-f2a3-4567-bcde-678901234567.pdf',
    fileSize: 2097152,
    contentType: 'application/pdf',
    fileExt: 'pdf',
    providerType: 'qiniu',
    bucketName: 'sw-docs',
    storageUrl: 'https://cdn.example.com/files/b8c9d0e1-f2a3-4567-bcde-678901234567.pdf',
    createTime: '2026-07-18T15:20:00',
    updateTime: '2026-07-18T15:20:00',
    createBy: 1,
    updateBy: 1,
  },
]
```

**设计要点**：
- 8 条记录覆盖全部 4 种 providerType：local(×2)、minio(×2)、cos(×2)、qiniu(×2)
- 文件大小多样化：2KB ~ 3MB，覆盖 `formatFileSize` 各级别（B、KB、MB）
- 文件类型多样化：pdf(×2)、png、docx、xlsx、jpg、txt、svg — 验证 fileExt 大写标签和 contentType 列
- 可变数组（`const` 声明），delete handler 通过 `.splice()` 原地删除
- `bucketName` 和 `storageUrl` 随 providerType 有所变化（真实感模拟）
- 时间戳递减（最新上传在前，模拟按时间倒序）

#### 9.1.2 在 `MOCK_MENU_TREE` 数组中追加菜单项

在现有最后一项 `id: '8'`（表单管理）之后追加：

```typescript
  {
    id: '9',
    parentId: null,
    name: 'storage',
    title: '文件管理',
    path: 'storage',
    component: 'storage/views/StorageList',
    icon: 'FolderOpened',
    sort: 9,
    menuType: 1,
    permission: 'storage:view',
  },
```

**验证**：`component: 'storage/views/StorageList'` → `resolveComponent()` 拼接为 `/src/modules/storage/views/StorageList.vue` → `import.meta.glob` 白名单命中（F2 已创建该文件）。

#### 9.1.3 在 `MOCK_SESSION_DATA.permissions` 数组中追加权限

在现有权限数组末尾追加 `'storage:view'`：

```typescript
export const MOCK_SESSION_DATA = {
  // ...
  permissions: [
    // ... 已有 9 项权限 ...
    'storage:view',   // ← 追加此项
  ],
  // ...
}
```

### 9.2 修改 `src/foundation/mock/handlers.ts` — 追加 4 个 storage handler

#### 9.2.1 在文件顶部 import 语句中追加

在现有 `MOCK_POSTS_LIST` 导入行之后追加：

```typescript
  MOCK_STORAGE_FILES,
} from './seeds'
```

（即把 `MOCK_STORAGE_FILES` 加到已有 `{ ..., MOCK_POSTS_LIST }` 解构导入的末尾）

#### 9.2.2 在 `mockRegistrations` 数组末尾（`]` 之前）追加 4 个 handler

```typescript
  // ── 文件存储：分页列表 ──────────────────────────────
  // GET /api/storage/files?page=&size=
  // 注意：响应字段 pageNum/pageSize 对齐后端 MP Page Jackson 序列化，
  // 但 query 参数名 page/size 对齐 listFiles() 发送的 axios params
  {
    method: 'GET',
    pattern: '/api/storage/files',
    handler: (_params, query) => {
      const page = Number(query.page ?? 1)
      const size = Number(query.size ?? 10)
      const total = MOCK_STORAGE_FILES.length
      const start = (page - 1) * size
      const records = MOCK_STORAGE_FILES.slice(start, start + size)
      return {
        code: 0,
        message: 'ok',
        data: { records, total, pageNum: page, pageSize: size },
      }
    },
  },

  // ── 文件存储：上传 ─────────────────────────────────
  // POST /api/storage/files/upload (multipart/form-data)
  // Mock 模式不解析 FormData body，直接返回静态上传结果。
  // 真实模式下 MultipartFile 由后端处理。
  {
    method: 'POST',
    pattern: '/api/storage/files/upload',
    handler: (_params, _query, _body) => {
      const id = MOCK_STORAGE_FILES.length + 1
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const storageKey = `mock-upload-${id}-${Date.now()}`
      // 将新文件插入数组头部（模拟最新上传在最前）
      MOCK_STORAGE_FILES.unshift({
        id,
        originalName: '新上传的文件.txt',
        storageKey,
        storageName: storageKey,
        fileSize: 1024,
        contentType: 'text/plain',
        fileExt: 'txt',
        providerType: 'local',
        bucketName: 'default',
        storageUrl: `/upload/${storageKey}`,
        createTime: now,
        updateTime: now,
        createBy: 1,
        updateBy: 1,
      })
      return {
        code: 0,
        message: 'ok',
        data: {
          storageKey,
          storageName: storageKey,
          storageUrl: `/upload/${storageKey}`,
          fileSize: 1024,
        },
      }
    },
  },

  // ── 文件存储：查询详情 ─────────────────────────────
  // GET /api/storage/files/:storageKey
  {
    method: 'GET',
    pattern: '/api/storage/files/:storageKey',
    handler: (params) => {
      const { storageKey } = params as Record<string, string>
      const file = MOCK_STORAGE_FILES.find((f) => f.storageKey === storageKey)
      if (!file) {
        return { code: 404, message: '文件不存在', data: null }
      }
      return { code: 0, message: 'ok', data: { ...file } }
    },
  },

  // ── 文件存储：删除 ─────────────────────────────────
  // DELETE /api/storage/files/:storageKey
  // 幂等：不存在的 storageKey 也返回 code: 0
  {
    method: 'DELETE',
    pattern: '/api/storage/files/:storageKey',
    handler: (params) => {
      const { storageKey } = params as Record<string, string>
      const idx = MOCK_STORAGE_FILES.findIndex((f) => f.storageKey === storageKey)
      if (idx !== -1) {
        MOCK_STORAGE_FILES.splice(idx, 1)
      }
      // 幂等 — 不存在的文件也返回成功
      return { code: 0, message: 'ok', data: null }
    },
  },
```

**设计要点**：
- **pattern 格式**：`/api/storage/files`（含 `/api` 前缀），因为 mock 系统拼接 `baseURL(/api) + url` 匹配
- **listFiles query 参数名**：`page`/`size`（非 `pageNum`/`pageSize`），因为 `listFiles()` 发送的 axios params 是 `{ page, size }`
- **listFiles 响应字段名**：`pageNum`/`pageSize`（非 `page`/`size`），因为 `adaptPage()` 从 `raw.pageNum`/`raw.pageSize` 读取
- **upload handler**：不解析 FormData body（mock 限制），直接返回静态 `StorageUploadResult` + 将新文件 unshift 到种子数组头部
- **delete handler**：幂等（不存在的 storageKey 也返回 code: 0），与已有 system/user、system/role 等 handler 模式一致
- **getInfo handler**：返回副本 `{ ...file }`（不直接暴露种子数组引用）
- **download 无 handler**：`downloadFile()` 使用原生 `fetch()`，不经 mock 系统，不添加不会被调用的 handler

### 9.3 执行步骤

```bash
# 1. 阅读 4 个参考文件（按 §6 优先级）
#    - src/foundation/mock/handlers.ts
#    - src/foundation/mock/seeds.ts
#    - src/modules/storage/api/index.ts
#    - src/contracts/storage.ts

# 2. 编辑 src/foundation/mock/seeds.ts：
#    a. 在文件末尾追加 MOCK_STORAGE_FILES 种子数组（约 100 行，8 条记录）
#    b. 在 MOCK_MENU_TREE 数组末尾追加 storage 菜单项（8 行）
#    c. 在 MOCK_SESSION_DATA.permissions 数组末尾追加 'storage:view'（1 行）

# 3. 编辑 src/foundation/mock/handlers.ts：
#    a. 在顶部 import 解构中追加 MOCK_STORAGE_FILES（1 行）
#    b. 在 mockRegistrations 数组末尾追加 4 个 handler（约 80 行）

# 4. 类型检查
pnpm typecheck
# → 预期 EXIT 0

# 5. Lint
pnpm lint
# → 预期 EXIT 0，0 errors / 0 warnings

# 6. 全量测试（确认已有测试不受影响）
pnpm test
# → 预期 50 files / 438 tests（与 F2 基线一致，无新增测试文件）

# 7. 生产构建
pnpm build
# → 预期 EXIT 0（mock 代码经 tree-shake 不进产物）

# 8. 全量校验门
pnpm typecheck && pnpm lint && pnpm test && pnpm build
# → 全部 EXIT 0

# 9. Mock 模式肉眼验收（可选，非 gate）
pnpm dev:mock
# → 浏览器打开，侧边栏应出现「文件管理」菜单项
# → 点击进入 → 列表页展示 8 条 mock 数据
# → 验证：上传弹窗打开 → 选择文件 → 点击上传 → 列表顶部出现新条目
# → 验证：删除确认弹窗 → 确认 → 条目消失
# → 验证：下载按钮点击 → ElMessage.error("下载失败")（预期行为 — mock 无后端）
# → 验证：侧边栏菜单 icon 为 FolderOpened、标题为「文件管理」
```

## 10. 关键实现约束

1. **只追加，不删除**：不得修改或删除 handlers.ts / seeds.ts 中任何已有 handler、种子数据、菜单项或权限
2. **pattern 必须以 `/api/` 开头**：与现有所有 handler 保持一致（完整 URL = baseURL + url）
3. **listFiles handler query 参数名**：`page`/`size`（对齐 `listFiles()` 发送的 axios params），不是 `pageNum`/`pageSize`
4. **listFiles handler 响应字段名**：`pageNum`/`pageSize`（MP Page 序列化），不是 `page`/`size`
5. **delete handler 幂等**：不存在的 storageKey 也返回 `code: 0`（与已有 system 模块 delete handler 一致）
6. **upload handler 插入头部**：使用 `unshift` 而非 `push`（模拟最新上传在前）
7. **getInfo handler 返回副本**：`{ ...file }` 而非直接引用（防止外部修改种子数据）
8. **不添加 download handler**：downloadFile 走原生 fetch，mock handler 不会被调用，添加即死代码
9. **菜单 component 路径**：`"storage/views/StorageList"` 不含 `.vue` 后缀和 `/src/modules/` 前缀
10. **菜单 menuType=1**：leaf page（非 directory，无需 children）
11. **菜单 id='9'，sort=9**：不与已有 1~8 冲突
12. **权限字符串 `'storage:view'`**：与已有 `'notify:view'`、`'workflow:view'` 命名模式一致

## 11. 边界情况

| 边界 | 处理方式 |
|------|----------|
| 列表为空（全部删除后） | `MOCK_STORAGE_FILES` 为 `[]` → `records: []`、`total: 0` → F2 测试 T5 已覆盖空态 |
| 删除不存在的文件 | 幂等返回 `code: 0`（`findIndex` 返回 -1 → splice 不执行） |
| 上传后列表刷新 | `unshift` 到数组头部 → 下次 `listFiles` 返回包含新条目 |
| 查询不存在的文件详情 | `find` 返回 undefined → `code: 404` → F1 已覆盖 `ApiError` 处理 |
| 分页越界（page > max） | `slice(start, start + size)` → 空数组 |
| 分页 page=0 或负数 | `Number(query.page ?? 1)` → 默认 1 |
| 菜单 component 路径拼写错误 | `resolveComponent()` 返回 undefined → 路由守卫输出 `console.warn` → 该菜单项不可点击（不会导致崩溃） |
| downloadFile 在 mock 模式 | 原生 `fetch()` 未拦截 → 网络错误 → F2 测试 T13 已覆盖 `ElMessage.error('下载失败')` |
| 种子数据被 delete handler 清空 | 页面刷新后恢复（`const` 数组在模块重新加载时重置） |

## 12. 风险和回滚方案

### 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|:------:|------|------|
| import 解构不一致 | 低 | TypeScript 编译错误 | seeds.ts 导出名 `MOCK_STORAGE_FILES` 与 handlers.ts import 名必须一致 |
| 菜单 component 路径解析失败 | 低 | 菜单项不可点击 | `'storage/views/StorageList'` 经 glob `/src/modules/**/*.vue` 匹配 F2 创建的文件 |
| `pnpm lint` 报 import 顺序错误 | 中 | lint 红灯 | 遵循现有 import 排序（MOCK_POSTS_LIST 之后按字母序追加 MOCK_STORAGE_FILES） |
| mock upload handler 中 `Date.now()` | 极低 | 非确定性行为 | `Date.now()` 在 CI/构建期不可用（会抛错）。但在 `pnpm dev:mock` 手动验收时，mock handler 仅在浏览器运行时执行，此时 `Date.now()` 可用 |
| 4 个 handler 全部追加到数组末尾导致 mockRegistrations 过长 | 低 | lint 行数告警 | mockRegistrations 当前约 1054 行，追加约 80 行，仍在合理范围 |

### 回滚

```bash
# 回滚方式：git checkout 两个文件
git checkout -- src/foundation/mock/handlers.ts src/foundation/mock/seeds.ts

# 确认回滚成功
pnpm typecheck && pnpm lint && pnpm test && pnpm build
# → 应回到基线 50 files / 438 tests

# 确认菜单树不含 storage 项
grep "storage" src/foundation/mock/seeds.ts
# → 零命中
```

## 13. 测试方案

### 13.1 静态检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| S1 | seeds.ts 含 `MOCK_STORAGE_FILES` | `grep "MOCK_STORAGE_FILES" src/foundation/mock/seeds.ts` | 命中 |
| S2 | seeds.ts 含 storage 菜单项 | `grep '"storage"' src/foundation/mock/seeds.ts` | 命中（`name: 'storage'` 或 `path: 'storage'`） |
| S3 | seeds.ts 含 `storage:view` 权限 | `grep "storage:view" src/foundation/mock/seeds.ts` | 命中 |
| S4 | handlers.ts import 含 `MOCK_STORAGE_FILES` | `grep "MOCK_STORAGE_FILES" src/foundation/mock/handlers.ts` | 命中 |
| S5 | handlers.ts 含 4 个 storage handler | `grep "/api/storage/files" src/foundation/mock/handlers.ts` | 4 命中（GET list ×1、POST upload ×1、GET :storageKey ×1、DELETE :storageKey ×1） |
| S6 | handlers.ts 不含 download handler | `grep "download" src/foundation/mock/handlers.ts` | 仅已有注释命中（非 storage download） |
| S7 | `pnpm typecheck` 退出码 0 | `pnpm typecheck` | EXIT 0 |
| S8 | `pnpm lint` 退出码 0 | `pnpm lint` | EXIT 0（0 errors, 0 warnings） |

### 13.2 单元测试

不适用（F3 不创建新测试文件。Mock handlers 不在单元测试中验证 — 单元测试 mock 了 API 层（`vi.mock('@/modules/storage/api')`），不经过 mock 系统）。

### 13.3 集成测试

不适用（F3 无多模块/多服务交互。集成验证通过 `pnpm dev:mock` 手工验收）。

### 13.4 手工验证

| 编号 | 验证项 | 步骤 |
|:----:|--------|------|
| V1 | 菜单项可见 | `pnpm dev:mock` → 浏览器打开 → 侧边栏应出现「文件管理」菜单项（FolderOpened 图标），位于「表单管理」下方 |
| V2 | 列表页渲染 | 点击「文件管理」→ 表格展示 8 条 mock 数据，7 列全部正确渲染 |
| V3 | formatFileSize 格式化 | 验证：2KB → "2.0 KB"、245760B → "240.0 KB"、1.5MB → "1.5 MB"、3MB → "3.0 MB" |
| V4 | providerType 标签 | 验证：local→本地(info)、minio→MinIO(primary)、cos→COS(success)、qiniu→七牛云(warning) |
| V5 | fileExt 大写标签 | 验证：PDF、PNG、DOCX、XLSX、JPG、TXT、SVG 均显示为大写 el-tag |
| V6 | 上传弹窗 | 点击「上传文件」→ 弹窗打开 → 选择文件 → 点击「上传」→ ElMessage.success → 弹窗关闭 → 列表顶部出现新条目「新上传的文件.txt」 |
| V7 | 删除确认 | 点击任一文件「删除」→ confirm 弹窗展示文件名 → 确认 → 条目消失 + ElMessage.success('删除成功') |
| V8 | 删除取消 | 点击「删除」→ confirm 弹窗 → 取消 → 条目不变 |
| V9 | 下载在 mock 模式失败 | 点击「下载」→ ElMessage.error('下载失败')（预期行为 — mock 模式无后端） |
| V10 | 空态验证 | 删除全部 8 条后 → 空态占位 + 「上传文件」按钮可见 |

### 13.5 回归检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| R1 | 测试文件数不变 | `pnpm test` 输出 | 50 files（与 F2 基线一致） |
| R2 | 测试用例数不变 | `pnpm test` 输出 | 438 tests（与 F2 基线一致） |
| R3 | 全量测试零失败 | `pnpm test` | 0 failures |
| R4 | F1 API 测试不受影响 | `pnpm test -- src/modules/storage/api` | 8 tests passed |
| R5 | F2 视图测试不受影响 | `pnpm test -- src/modules/storage/views` | 13 tests passed |
| R6 | 全量四连绿 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | 全部 EXIT 0 |
| R7 | 已有模块测试数不变 | `pnpm test` 输出 | form/system/notify/workflow 模块测试数与 F2 基线一致 |

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|:--------:|
| F3-1 | `seeds.ts` 含 `MOCK_STORAGE_FILES` 数组，≥ 6 条记录，覆盖全部 4 种 providerType | S1 + 代码审查 |
| F3-2 | `MOCK_STORAGE_FILES` 所有条目字段与 `StorageFile` 接口一致（14 字段） | 代码审查 |
| F3-3 | `seeds.ts` 中 `MOCK_MENU_TREE` 含 storage 菜单项（id='9', name='storage', component='storage/views/StorageList', menuType=1） | S2 + 代码审查 |
| F3-4 | `seeds.ts` 中 `MOCK_SESSION_DATA.permissions` 含 `'storage:view'` | S3 |
| F3-5 | `handlers.ts` import 含 `MOCK_STORAGE_FILES`，无循环依赖 | S4 |
| F3-6 | `handlers.ts` 含 4 个 storage handler：GET list、POST upload、GET info、DELETE delete | S5 + S6 |
| F3-7 | listFiles handler：query 参数 `page`/`size`，响应 `records`/`total`/`pageNum`/`pageSize` | 代码审查 |
| F3-8 | upload handler：返回 `StorageUploadResult`（4 字段），并将新条目 unshift 到 `MOCK_STORAGE_FILES` | 代码审查 |
| F3-9 | delete handler：幂等（不存在的 storageKey 也返回 code: 0），通过 `splice` 原地删除 | 代码审查 |
| F3-10 | getInfo handler：返回 `{ ...file }` 副本，不存在的 storageKey 返回 code: 404 | 代码审查 |
| F3-11 | 无 download handler（`downloadFile` 走原生 fetch，不添加死代码） | S6 |
| F3-12 | `pnpm typecheck` 退出码 0 | S7 |
| F3-13 | `pnpm lint` 退出码 0（0 errors, 0 warnings） | S8 |
| F3-14 | `pnpm test` 退出码 0，50 files / 438 tests（与 F2 基线一致，无退化） | R1 + R2 + R3 |
| F3-15 | `pnpm build` 退出码 0 | R6 |
| F3-16 | 已有模块 handler 和 seed 数据未被删除或修改 | 代码审查（grep 已有 handler pattern 行数不变） |

## 15. 执行回执格式

按 §7.1 标准格式返回，特别需包含：

- 第 3 项"实际读取的文件"：列出读取的前端文件及目的
- 第 4 项"实际修改的文件"：2 个修改文件（handlers.ts + seeds.ts），标注"修改"（非新建）
- 第 5 项"每个文件的修改摘要"：每个文件的追加位置、追加行数、追加内容摘要
- 第 6 项"实际执行的命令"：含完整四连命令及退出码
- 第 7 项"命令输出摘要"：`pnpm test` 的测试文件数 + 测试用例总数 + 全部通过确认（应与 F2 基线一致）
- 第 8 项"与原方案的偏差"：特别需注明 mock upload handler 的实现方式（是否解析 FormData body、`Date.now()` 处理）、delete handler 幂等实现
- 第 12 项"Git diff 摘要"：修改文件数 + 新增行数
- 第 13 项"建议执行的测试"：列出 V1-V10 手工验证场景

## 16. 测试回执格式

按 §7.2 标准格式返回，特别需包含：

- 第 4 项"实际执行的测试命令"：列出 S1-S8 + R1-R7 命令及输出
- 第 5 项"各测试项结果"：逐条列出，含实际数字
- 第 10 项"是否满足验收标准"：逐条对照 F3-1 ~ F3-16

**测试计数格式要求**：
```text
pnpm test 输出摘要：
 Test Files  50 passed (50)  ← 与 F2 基线一致
      Tests  438 passed (438)  ← 与 F2 基线一致
```

## 17. 明确禁止事项

- ❌ **禁止**修改 `src/modules/storage/` 任何文件 — F1/F2 已验收，不得回退
- ❌ **禁止**修改 `src/contracts/storage.ts` — F1 已验收
- ❌ **禁止**修改 `src/router/index.ts` 或 `src/router/guard.ts` — 动态路由无需修改
- ❌ **禁止**修改 `src/foundation/menu/index.ts` — 菜单加载逻辑无需修改
- ❌ **禁止**删除或修改 handlers.ts 中任何已有 handler 注册项
- ❌ **禁止**删除或修改 seeds.ts 中任何已有种子数据、菜单项或权限
- ❌ **禁止**添加 download handler（downloadFile 走原生 fetch，添加不会生效，属死代码）
- ❌ **禁止**在 handlers.ts 或 seeds.ts 中 import storage 业务模块（`@/modules/storage/*`）— mock 层不得依赖业务层
- ❌ **禁止**创建新文件（本 Step 纯修改已有文件）
- ❌ **禁止**修改 `package.json`、`vite.config.ts`、`eslint.config.js`
- ❌ **禁止**修改已有菜单项的 id、sort、path（只追加，不扰序）
- ❌ **禁止**访问 `Smart-WorkFlow/` 后端代码
- ❌ **禁止**将 `pnpm dev:mock` 的手工验证结果作为 gate（仅可选附注，四连绿为唯一 gate）
