# Step F2：前端 Vue 视图 — 文件管理列表页

## 1. 当前状态

| 项目 | 状态 |
|------|:----:|
| 功能 | storage-multi-provider — 多向可配置文件存储 |
| 功能状态 | **IN_PROGRESS** |
| 前置 Step | B1 ✅ → B2 ✅ → B3 ✅ → B4 ✅ → F1 ✅（16/16 PASSED） |
| 当前 Step | F2 — Vue 视图：文件管理列表页（PENDING → READY） |
| 前端基线 | 49 spec files / 425 tests，四连全绿（CONFIRMED 2026-07-19 F1 验收） |
| F1 交付物 | contracts/storage.ts（43 行）、api/index.ts（110 行）、api/index.spec.ts（197 行） |
| 后端端点 | 5 个 `/storage/files` 端点全部就位，B4 验收通过 |

## 2. Step 目标

创建文件管理列表页（`StorageList.vue`），提供文件上传、列表浏览、搜索筛选、下载和删除功能。使用 StandardListTemplate（页型 B），完全参照 UserList/DictTypeList 既有模式。**不添加 mock handlers（F3 负责），不修改路由或菜单（F3 负责）。**

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：标准 Vue 3 列表页组件，完全参照 UserList/DictTypeList/NotifyHome 既有模式（StandardListTemplate + el-table + el-dialog），无架构决策，纯机械编码
是否触发升级条件：否
```

## 4. 模型选择理由

F2 工作是创建 1 个 Vue 视图组件 + 1 个纯函数工具 + 1 个测试文件。StorageList.vue 完全遵循 UserList.vue 的 StandardListTemplate 模板结构（列表状态管理 → API 调用 → 筛选 → 分页 → 弹窗 CRUD）。上传走已有 `uploadFile()` API，下载走已有 `downloadFile()` API。无架构决策，纯参照模式机械编码。

## 5. 已知上下文

### 5.1 StandardListTemplate（页型 B）接口

来自 `src/components/page-layout/StandardListTemplate.vue`（71 行）：

**Props**：`title?: string`、`total: number`、`pageNum: number`、`pageSize: number`、`empty?: boolean`

**Emits**：`update:pageNum (number)`、`update:pageSize (number)`

**Slots**：
| Slot | 用途 |
|------|------|
| `toolbar-actions` | 工具栏操作按钮（如「上传文件」） |
| `filter` | 筛选控件（如文件名搜索输入框） |
| `filter-actions` | 查询/重置按钮 |
| default | 表格内容（`<el-table>`） |
| `empty-action` | 空态操作按钮（如「上传文件」） |

StandardListTemplate 是纯容器组件，零数据获取（无 onMounted），零路由耦合。消费方自行管理状态和生命周期。

### 5.2 参照模式：UserList.vue

来自 `src/modules/system/views/UserList.vue`（385 行）：

- **列表状态**：`list` ref、`total` ref、`pageNum`/`pageSize` ref、`loading` ref、`errorMsg` ref
- **筛选**：双对象模式 — `filter`（绑定到 input v-model）+ `currentFilter`（API 调用时使用，在「查询」按钮点击时同步），避免每次输入都触发 API
- **分页**：`handlePageNumChange(p)` / `handlePageSizeChange(s)` 处理 page 变更
- **弹窗**：`dialogVisible` ref + `el-dialog` + `destroy-on-close` + `@closed` 重置
- **删除**：`ElMessageBox.confirm` → API 调用 → `ElMessage.success` → 刷新列表
- **行操作桥接**：`editRow(r: unknown)` / `deleteRow(r: unknown)` 解决 el-table slot scope 类型不兼容
- **onMounted**：调用 `loadList()`

### 5.3 参照模式：NotifyHome.vue

来自 `src/modules/notify/views/NotifyHome.vue`（179 行）：

- 更简单的列表页（无弹窗、无新增/编辑）
- 同样的 StandardListTemplate + el-table 模式
- 错误/空态处理方式一致

### 5.4 测试参照：NotifyHome.spec.ts

来自 `src/modules/notify/views/NotifyHome.spec.ts`（138 行）：

- `vi.mock('@/modules/notify/api')` 模拟 API 层
- `vi.mock('element-plus')` 模拟 `ElMessage`/`ElMessageBox`
- 最小桩组件（StandardListTemplate、el-table、el-button、el-dialog 等）
- 测试模式：mount → mockResolvedValue → await nextTick → 断言 API 调用 + 状态
- `wrapper.vm as unknown as { ... }` 访问组件内部状态

### 5.5 API 层（F1 已就位）

来自 `src/modules/storage/api/index.ts`：

| 函数 | 签名 | HTTP |
|------|------|:----:|
| `uploadFile` | `(file: File) => Promise<StorageUploadResult>` | POST `/storage/files/upload` |
| `listFiles` | `(page: number, size: number) => Promise<PageResult<StorageFile>>` | GET `/storage/files` |
| `getFileInfo` | `(storageKey: string) => Promise<StorageFile>` | GET `/storage/files/{key}` |
| `deleteFile` | `(storageKey: string) => Promise<void>` | DELETE `/storage/files/{key}` |
| `downloadFile` | `(storageKey: string) => Promise<{ blob: Blob; fileName: string }>` | fetch GET `/api/storage/files/{key}/download` |

### 5.6 类型契约（F1 已就位）

来自 `src/contracts/storage.ts`：

```typescript
interface StorageFile {
  id: number; originalName: string; storageKey: string; storageName: string
  fileSize: number; contentType: string; fileExt: string; providerType: string
  bucketName: string; storageUrl: string; createTime: string; updateTime: string
  createBy: number; updateBy: number
}

interface StorageUploadResult {
  storageKey: string; storageName: string; storageUrl: string; fileSize: number
}
```

`fileSize` 为字节数（number），需要在展示时格式化为 KB/MB/GB。

### 5.7 路由和菜单

路由是动态的 — 业务模块路由由 `router/guard.ts` 在运行时从菜单树（`loadMenu()` → `buildRoutesFromMenu()`）构建。组件路径如 `"storage/views/StorageList"` 通过 `import.meta.glob('/src/modules/**/*.vue')` 懒加载解析。

**当前无 storage 菜单项** — mock 菜单树（`seeds.ts`）和路由均无 storage 条目。菜单项由 F3 负责添加。

**F2 不需要也不应修改路由或菜单。**

### 5.8 Element Plus

Element Plus 按需自动导入（`unplugin-vue-components` + `ElementPlusResolver`），以下组件/API 无需显式 import：

- 组件：`ElTable`、`ElTableColumn`、`ElButton`、`ElDialog`、`ElUpload`、`ElInput`、`ElTag`、`ElAlert`、`ElPagination`
- API：`ElMessage`、`ElMessageBox`

业务代码中直接使用，不出现 `from 'element-plus'` 的显式 import。

## 6. 执行前必须读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| **1** | `src/modules/system/views/UserList.vue` | 参照：完整列表页模式（loading/error/page/dialog/delete） |
| **2** | `src/components/page-layout/StandardListTemplate.vue` | 确认 props/slots/emits 签名 |
| **3** | `src/modules/notify/views/NotifyHome.vue` | 参照：简单列表页 + 错误/空态处理 |
| **4** | `src/modules/notify/views/NotifyHome.spec.ts` | 参照：列表页测试 stub 模式 + API mock |
| **5** | `src/modules/storage/api/index.ts` | 确认 5 个 API 函数的精确签名 |
| **6** | `src/contracts/storage.ts` | 确认 StorageFile / StorageUploadResult 字段 |
| **7** | `src/contracts/common.ts` | 确认 PageResult<T> 类型 |
| **8** | `src/modules/storage/api/index.spec.ts` | 了解 API mock 返回值形状 |
| **9** | `src/foundation/request/index.ts`（可选） | 了解 ApiError 类型（用于 catch 分支） |

## 7. 允许修改的文件范围

### 新建文件（3 个）

```
src/modules/storage/utils/format.ts          — formatFileSize 工具函数
src/modules/storage/views/StorageList.vue    — 文件管理列表页组件
src/modules/storage/views/StorageList.spec.ts — 列表页测试
```

### 修改文件

**无。** 本 Step 纯新建，不修改任何已有文件。

## 8. 禁止修改的范围

- ❌ `src/modules/storage/api/index.ts` — F1 已验收，不可修改
- ❌ `src/modules/storage/api/index.spec.ts` — F1 已验收，不可修改
- ❌ `src/contracts/storage.ts` — F1 已验收，不可修改
- ❌ `src/contracts/common.ts` — 共享契约
- ❌ `src/foundation/request/index.ts` — 全局请求层
- ❌ `src/foundation/mock/` 任何文件 — mock handlers 属 F3 范围
- ❌ `src/router/` 任何文件 — 菜单注册属 F3 范围
- ❌ `src/foundation/menu/` — 菜单加载逻辑
- ❌ `src/stores/menu.ts` — 菜单 store
- ❌ `src/foundation/mock/seeds.ts` — mock 种子数据属 F3 范围
- ❌ `eslint.config.js`、`vite.config.ts`、`package.json`、`pnpm-lock.yaml`
- ❌ `Smart-WorkFlow/` 后端任何文件
- ❌ 已有模块（system/notify/workflow/form）的任何文件

## 9. 详细执行方案

### 9.1 创建 `src/modules/storage/utils/format.ts`（~30 行）

纯函数工具，格式化字节数为人类可读字符串。

```typescript
/**
 * 文件大小格式化工具。
 *
 * 将字节数转换为人类可读的 B/KB/MB/GB 表示。
 */

/**
 * 格式化文件大小（字节 → B / KB / MB / GB）。
 *
 * @param bytes — 文件字节数（≥ 0）
 * @returns 格式化后的字符串，如 "1.5 MB"
 *
 * 规则：
 * - bytes < 1024 → "X B"（整数）
 * - bytes < 1024² → "X.X KB"（1 位小数）
 * - bytes < 1024³ → "X.X MB"（1 位小数）
 * - bytes ≥ 1024³ → "X.X GB"（1 位小数）
 * - bytes === 0 → "0 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1)
  const size = bytes / Math.pow(k, i)

  // 整数单位（B）不显示小数；其余保留 1 位小数
  const formatted = i === 0 ? Math.round(size).toString() : size.toFixed(1)
  return `${formatted} ${units[i]}`
}
```

**文件末尾导出 `formatFileSize`，供 StorageList.vue 引用。**

### 9.2 创建 `src/modules/storage/views/StorageList.vue`（~280 行）

#### 9.2.1 Script 结构

```typescript
<script setup lang="ts">
/**
 * StorageList — 文件管理列表页（页型 B）。
 *
 * 使用 StandardListTemplate 槽位模板。提供文件上传、列表浏览、
 * 文件名搜索、下载和删除功能。
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '@/foundation/request'
import { StandardListTemplate } from '@/components/page-layout'
import { listFiles, uploadFile, deleteFile, downloadFile } from '@/modules/storage/api'
import { formatFileSize } from '@/modules/storage/utils/format'
import type { StorageFile } from '@/contracts/storage'

// ─── 列表状态 ───
const list = ref<StorageFile[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMsg = ref('')

// ─── 筛选状态 ───
const filter = reactive({ originalName: '' })
const currentFilter = reactive({ originalName: '' })

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// ─── 列表加载 ───
async function loadList() { /* ... 调用 listFiles + 处理 ApiError ... */ }

function handleQuery() {
  currentFilter.originalName = filter.originalName
  pageNum.value = 1
  void loadList()
}

function handleReset() {
  filter.originalName = ''
  currentFilter.originalName = ''
  pageNum.value = 1
  void loadList()
}

function handlePageNumChange(p: number) { pageNum.value = p; void loadList() }
function handlePageSizeChange(s: number) { pageSize.value = s; pageNum.value = 1; void loadList() }

// ─── 上传弹窗 ───
const uploadDialogVisible = ref(false)
const uploadFileRef = ref<File | null>(null)
const uploading = ref(false)
const uploadError = ref('')

function openUpload() { /* reset state, show dialog */ }
function closeUpload() { /* hide dialog, reset state */ }

// 文件选择变更（input type="file" change 事件）
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  uploadFileRef.value = input.files?.[0] ?? null
  uploadError.value = ''
}

async function handleUpload() {
  if (!uploadFileRef.value) { uploadError.value = '请选择文件'; return }
  uploading.value = true; uploadError.value = ''
  try {
    const result = await uploadFile(uploadFileRef.value)
    ElMessage.success(`上传成功：${result.storageName}`)
    closeUpload()
    void loadList()
  } catch (err) {
    if (err instanceof ApiError) { uploadError.value = err.msg }
    else { uploadError.value = '上传失败' }
  } finally { uploading.value = false }
}

// ─── 下载 ───
async function handleDownload(row: StorageFile) {
  try {
    const { blob, fileName } = await downloadFile(row.storageKey)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = fileName
    document.body.appendChild(a); a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    if (err instanceof ApiError) { ElMessage.error(err.msg) }
    else { ElMessage.error('下载失败') }
  }
}

// ─── 删除 ───
async function handleDelete(row: StorageFile) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件"${row.originalName}"吗？删除后不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return /* 用户取消 */ }

  try {
    await deleteFile(row.storageKey)
    ElMessage.success('删除成功')
    void loadList()
  } catch (err) {
    if (err instanceof ApiError) { ElMessage.error(err.msg) }
    else { ElMessage.error('删除失败') }
  }
}

// row 类型桥接（el-table slot scope row 类型不兼容 StorageFile）
function downloadRow(r: unknown) { handleDownload(r as StorageFile) }
function deleteRow(r: unknown) { handleDelete(r as StorageFile) }

onMounted(loadList)
</script>
```

#### 9.2.2 Template 结构

```vue
<template>
  <StandardListTemplate
    title="文件管理"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 工具栏：上传按钮 -->
    <template #toolbar-actions>
      <el-button type="primary" @click="openUpload">上传文件</el-button>
    </template>

    <!-- 筛选区：文件名搜索 -->
    <template #filter>
      <el-input
        v-model="filter.originalName"
        placeholder="文件名"
        clearable
        style="width: 240px"
        @keyup.enter="handleQuery"
      />
    </template>
    <template #filter-actions>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </template>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="originalName" label="文件名" min-width="200" show-overflow-tooltip />
      <el-table-column label="大小" width="100" align="right">
        <template #default="{ row }">
          {{ formatFileSize(row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="fileExt" label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.fileExt.toUpperCase() }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contentType" label="MIME" width="160" show-overflow-tooltip />
      <el-table-column label="存储方式" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="providerTagType(row.providerType)">
            {{ providerLabel(row.providerType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="上传时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="downloadRow(row)">下载</el-button>
          <el-button size="small" link type="danger" @click="deleteRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空态操作 -->
    <template #empty-action>
      <el-button type="primary" @click="openUpload">上传文件</el-button>
    </template>
  </StandardListTemplate>

  <!-- 上传弹窗 -->
  <el-dialog
    v-model="uploadDialogVisible"
    title="上传文件"
    :close-on-click-modal="false"
    destroy-on-close
    width="480px"
    @closed="closeUpload"
  >
    <el-alert
      v-if="uploadError"
      :title="uploadError"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />
    <div style="display: flex; flex-direction: column; gap: 12px">
      <input
        type="file"
        @change="onFileChange"
        style="display: block"
      />
    </div>
    <template #footer>
      <el-button @click="closeUpload">取消</el-button>
      <el-button type="primary" :loading="uploading" :disabled="!uploadFileRef" @click="handleUpload">
        上传
      </el-button>
    </template>
  </el-dialog>
</template>
```

#### 9.2.3 providerType 辅助函数

```typescript
// providerType → 显示标签
function providerLabel(type: string): string {
  const map: Record<string, string> = {
    local: '本地', minio: 'MinIO', cos: 'COS', qiniu: '七牛云',
  }
  return map[type] ?? type
}

// providerType → el-tag type
function providerTagType(type: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    local: 'info', minio: 'primary', cos: 'success', qiniu: 'warning',
  }
  return map[type] ?? 'info'
}
```

### 9.3 创建 `src/modules/storage/views/StorageList.spec.ts`（~200 行）

参照 NotifyHome.spec.ts 的测试模式。

#### 9.3.1 Mock 设置

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock storage API 层
vi.mock('@/modules/storage/api', () => ({
  listFiles: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  downloadFile: vi.fn(),
}))

// Mock Element Plus API
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    ElMessage: { success: vi.fn(), error: vi.fn() },
    ElMessageBox: { confirm: vi.fn() },
  }
})

import { listFiles, uploadFile, deleteFile, downloadFile } from '@/modules/storage/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '@/foundation/request'
import type { StorageFile } from '@/contracts/storage'
import StorageList from './StorageList.vue'
```

#### 9.3.2 桩组件

```typescript
const stubs = {
  StandardListTemplate: {
    template: '<div><slot name="toolbar-actions"/><slot name="filter"/><slot name="filter-actions"/><slot/><slot name="empty-action"/></div>',
    props: ['title', 'total', 'pageNum', 'pageSize', 'empty'],
    emits: ['update:pageNum', 'update:pageSize'],
  },
  'el-alert': { template: '<div class="el-alert">{{ title }}</div>', props: ['title', 'type'] },
  'el-table': { template: '<div><slot/></div>', props: ['data'] },
  'el-table-column': { template: '<div/>' },
  'el-button': { template: '<button :disabled="disabled"><slot/></button>', props: ['disabled'] },
  'el-tag': { template: '<span><slot/></span>', props: ['type', 'size'] },
  'el-dialog': {
    template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
    props: ['modelValue', 'title'],
  },
  'el-input': { template: '<input/>', props: ['modelValue', 'placeholder'] },
}
```

#### 9.3.3 测试用例（≥ 10 个）

| 编号 | 测试 | 覆盖场景 |
|:----:|------|----------|
| T1 | `listFiles` 在 onMounted 调用 | 列表加载 happy path |
| T2 | 列表数据正确渲染到 list ref | 数据 -> 状态 |
| T3 | API 失败（ApiError）设 errorMsg | 错误处理 |
| T4 | API 失败（非 ApiError）设 fallback 错误 | 错误处理 fallback |
| T5 | 空列表 → isEmpty = true | 空态 |
| T6 | 点击上传按钮 → 弹窗可见 | 上传对话框 |
| T7 | 上传文件成功 → ElMessage.success + 刷新列表 | 上传 happy path |
| T8 | 上传文件失败 → 显示 uploadError | 上传错误 |
| T9 | 删除确认 → 调用 deleteFile → ElMessage.success | 删除 happy path |
| T10 | 删除时用户取消 → 不调用 deleteFile | 删除取消 |
| T11 | 删除失败 → ElMessage.error | 删除错误 |
| T12 | 下载成功 → 调用 downloadFile | 下载 happy path |
| T13 | 下载失败 → ElMessage.error | 下载错误 |

### 9.4 执行步骤

```bash
# 1. 创建目录
mkdir -p src/modules/storage/utils
mkdir -p src/modules/storage/views

# 2. 编写并写入 3 个文件：
#    - src/modules/storage/utils/format.ts
#    - src/modules/storage/views/StorageList.vue
#    - src/modules/storage/views/StorageList.spec.ts

# 3. 类型检查
pnpm typecheck
# → 预期 EXIT 0

# 4. Lint（含架构边界规则）
pnpm lint
# → 预期 EXIT 0，0 errors / 0 warnings

# 5. 全量测试
pnpm test
# → 预期 ≥ 50 spec files / ≥ 437 tests（基线 49/425 + 1/≥12）

# 6. 生产构建
pnpm build
# → 预期 EXIT 0

# 7. 全量校验门（一步）
pnpm typecheck && pnpm lint && pnpm test && pnpm build
# → 全部 EXIT 0
```

## 10. 关键实现约束

1. **StandardListTemplate 零侵入**：数据全部通过 props 传入，分页事件通过 emit 监听，不修改模板组件
2. **双筛选对象模式**：`filter`（UI 绑定）+ `currentFilter`（API 参数），只在「查询」按钮点击时同步，防止每次输入触发 API
3. **fileSize 必须格式化**：表格中 fileSize 列必须经过 `formatFileSize()` 转换，直接展示字节数不可接受
4. **上传用原生 `<input type="file">`**：不使用 `el-upload` 的自动上传模式。手动 change 事件获取 File 对象 → 调用 `uploadFile()` API。原因：el-upload 的 http-request 在测试中 mock 复杂；原生 input + 手动 API 更简单可控
5. **下载不走 `request()`**：downloadFile 已在 F1 中实现为 `fetch()` + blob。视图层只需调用 downloadFile → URL.createObjectURL → 触发 `<a>` 下载 → revokeObjectURL
6. **删除必确认**：`ElMessageBox.confirm` 拦截，展示文件名，防误删
7. **providerType 中文化展示**：local→本地、minio→MinIO、cos→COS、qiniu→七牛云，用 el-tag 不同颜色区分
8. **行操作类型桥接**：el-table slot scope 的 row 类型为 `DefaultRow`，与 `StorageFile` 不兼容。通过 `downloadRow(r: unknown)` / `deleteRow(r: unknown)` 包装函数桥接（与 UserList 的 `editRow` / `deleteRow` 模式一致）
9. **文件扩展名大写展示**：`row.fileExt.toUpperCase()` 用于标签文本，增加可读性
10. **OnMounted 调 loadList**：组件挂载时自动加载第一页数据

## 11. 边界情况

| 边界 | 处理方式 | 覆盖 |
|------|----------|:----:|
| 文件列表为空 | `isEmpty` computed → StandardListTemplate 显示 ListEmpty + empty-action 插槽 | 测试 T5 |
| 列表加载失败（ApiError） | 显示 `el-alert` 错误提示 + ElMessage.error | 测试 T3 |
| 列表加载失败（网络错误等） | fallback 错误信息 "加载文件列表失败" | 测试 T4 |
| 上传时未选择文件 | 按钮 disabled（`:disabled="!uploadFileRef"`）+ 点击时二次校验 | 模板逻辑 |
| 上传文件失败 | 弹窗内显示 uploadError + 保留弹窗不关闭 | 测试 T8 |
| 上传文件 0 字节 | 后端拒收 → ApiError（PARAM_ERROR）→ 弹窗内显示错误 | ApiError 通用处理 |
| 删除确认时用户取消 | `ElMessageBox.confirm` reject → catch 块 return | 测试 T10 |
| 删除文件不存在 | 后端 404 → ApiError（NOT_FOUND）→ ElMessage.error | 测试 T11 |
| 下载文件不存在 | downloadFile 抛 Error → ElMessage.error | 测试 T13 |
| storageKey 含特殊字符 | F1 已 encodeURIComponent，视图层不重复编码 | F1 已覆盖 |
| 分页切换时刷新 | `handlePageNumChange` / `handlePageSizeChange` → loadList | 模板逻辑 |
| filter.originalName 为空字符串 | 传给 API 时为空字符串（后端 Controller 自行处理过滤逻辑），但**注意：后端 Controller 的 list 端点当前无 originalName 参数**。筛选仅前端本地实现（通过后端全量分页后前端过滤不可行）。**正确做法：listFiles 调用时暂不传 originalName 参数，筛选功能标记为「待后端 Search 端点就绪后再点亮」。** | — |

> ⚠️ **重要：后端 `GET /storage/files` 当前只有 `page` 和 `size` 参数，无 `originalName` 筛选参数。**
> 本 Step 的筛选功能设计为：
> - filter 输入框保持渲染（UI 就位）
> - `loadList()` 调用 `listFiles(page, size)` 时不传 `originalName`（或传但后端忽略）
> - 筛选输入框的查询/重置按钮正常运作但实际效果仅为重新加载列表
> - **不创建假的前端过滤** — 数据一致性优先于 UI 便利
> - 筛选功能完全点亮需后端添加 `originalName` 查询参数（后续优化项，非本 Step 范围）

## 12. 风险和回滚方案

### 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|:------:|------|------|
| `pnpm lint` 报告跨模块 import 告警 | 低 | CI 红灯 | format.ts 在 `modules/storage/utils/`，视图在 `modules/storage/views/`，均为 storage 模块内部 import，不跨模块。ESLint 规则只禁跨 `modules/X` → `modules/Y` |
| `el-table` slot scope 类型问题 | 中 | TypeScript 编译错误 | 使用 `(r: unknown) => handler(r as StorageFile)` 桥接函数（与 UserList 一致） |
| `pnpm test` 中 `el-dialog` 默认关闭 | 中 | 弹窗相关测试失败 | el-dialog stub 使用 `v-if="modelValue"` 控制渲染，需在测试中先设置 dialog 为可见 |
| `formatFileSize` 的 `Math.log(0)` 返回 `-Infinity` | 低 | 显示 NaN | bytes ≤ 0 时直接返回 "0 B"，不进入对数计算 |
| 后端无 originalName 筛选 | 高 | 筛选功能不生效 | 明确标注：筛选 UI 就位但后端参数待补充。`loadList()` 调用 `listFiles(page, size)` 不传额外参数 |

### 回滚

```bash
# 删除 3 个新建文件 + 目录
rm src/modules/storage/utils/format.ts
rmdir src/modules/storage/utils/
rm src/modules/storage/views/StorageList.vue
rm src/modules/storage/views/StorageList.spec.ts
rmdir src/modules/storage/views/

# 确认回滚成功
pnpm typecheck && pnpm lint && pnpm test && pnpm build
# → 应回到基线 49 files / 425 tests
```

## 13. 测试方案

### 13.1 静态检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| S1 | 3 个新文件存在 | `ls src/modules/storage/utils/format.ts src/modules/storage/views/StorageList.vue src/modules/storage/views/StorageList.spec.ts` | 3 文件 |
| S2 | format.ts 导出 formatFileSize | `grep "export function formatFileSize" src/modules/storage/utils/format.ts` | 命中 |
| S3 | StorageList.vue 使用 StandardListTemplate | `grep "StandardListTemplate" src/modules/storage/views/StorageList.vue` | 命中 |
| S4 | 无跨模块横向 import | `grep -rn "from '@/modules/" src/modules/storage/views/` | 零命中（自身模块内部引用除外） |
| S5 | 无 axios 直引 | `grep -r "from 'axios'" src/modules/storage/` | 零命中 |
| S6 | `pnpm typecheck` 退出码 0 | `pnpm typecheck` | EXIT 0 |
| S7 | `pnpm lint` 退出码 0 | `pnpm lint` | EXIT 0（0 errors, 0 warnings） |

### 13.2 单元测试

| 编号 | 测试用例 | 覆盖函数/场景 |
|:----:|----------|:------------:|
| T1 | onMounted 调用 listFiles | 列表加载 |
| T2 | listFiles 成功 → list/total 正确设置 | 数据→状态 |
| T3 | listFiles 失败（ApiError）→ errorMsg 设置 | 错误处理 |
| T4 | listFiles 失败（非 ApiError）→ fallback 错误 | 错误处理 fallback |
| T5 | 空列表 → isEmpty = true | 空态 |
| T6 | openUpload → uploadDialogVisible = true | 上传对话框 |
| T7 | handleUpload 成功 → ElMessage.success + 对话框关闭 | 上传 happy path |
| T8 | handleUpload 失败 → uploadError 设置 | 上传错误 |
| T9 | handleDelete 确认 → deleteFile 调用 + ElMessage.success | 删除 happy path |
| T10 | handleDelete 取消 → deleteFile 未调用 | 删除取消 |
| T11 | handleDelete 失败 → ElMessage.error | 删除错误 |
| T12 | handleDownload 成功 → downloadFile 调用 | 下载 happy path |
| T13 | handleDownload 失败 → ElMessage.error | 下载错误 |

### 13.3 集成测试

不适用（F2 为纯视图组件，无多模块/多服务交互。集成测试在 F3 mock handlers 完成后通过 `pnpm dev:mock` 手工验收）。

### 13.4 手工验证

| 编号 | 验证项 | 步骤 |
|:----:|--------|------|
| V1 | `formatFileSize` 边界值 | 在浏览器 console 或 Node 中测试 `formatFileSize(0)`→"0 B"、`formatFileSize(500)`→"500 B"、`formatFileSize(1536)`→"1.5 KB"、`formatFileSize(1048576)`→"1.0 MB" |
| V2 | 组件渲染不崩溃 | `pnpm test` 中 StorageList 的 13 个测试通过即可。**不要求 `pnpm dev:mock` — 无 mock handler 时 dev:mock 下看不到数据，属正常现象。F3 完成后才可肉眼验收。** |

### 13.5 回归检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| R1 | 测试文件数 ≥ 50（基线 49 + 1） | `pnpm test` 输出 | ≥ 50 |
| R2 | 测试用例数 ≥ 437（基线 425 + ≥12） | `pnpm test` 输出 | ≥ 437 |
| R3 | 全量测试零失败 | `pnpm test` | 0 failures |
| R4 | 全量四连绿 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | 全部 EXIT 0 |
| R5 | F1 API 测试不受影响 | `pnpm test -- src/modules/storage/api` | 8 tests passed（不变） |
| R6 | 已有模块测试数不变 | `pnpm test` 输出 | form/system/notify/workflow 模块测试数与基线一致 |

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|:--------:|
| F2-1 | `src/modules/storage/utils/format.ts` 存在，导出 `formatFileSize` | S1 + S2 |
| F2-2 | `formatFileSize` 正确处理 0 B、B、KB、MB、GB 各级别 | V1 + 代码审查 |
| F2-3 | `src/modules/storage/views/StorageList.vue` 存在，使用 StandardListTemplate | S1 + S3 |
| F2-4 | StorageList 包含 7 个表格列：originalName、fileSize（格式化）、fileExt（大写+标签）、contentType、providerType（中文+标签）、createTime、操作（下载+删除） | 代码审查 |
| F2-5 | 上传弹窗含文件选择 input + 上传按钮，上传成功后刷新列表 | T6 + T7 |
| F2-6 | 下载操作调用 `downloadFile()` API → 创建 Blob URL → 触发浏览器下载 → 释放 URL | T12 + 代码审查 |
| F2-7 | 删除操作先 `ElMessageBox.confirm` 确认 → 调用 `deleteFile()` → 刷新列表 | T9 + T10 |
| F2-8 | 文件大小列经过 `formatFileSize()` 格式化（非直接展示字节数） | 代码审查 |
| F2-9 | providerType 使用中英文映射 + el-tag 颜色区分 | 代码审查 |
| F2-10 | API 错误使用 `ApiError` 类型守卫区分，非 ApiError 使用 fallback 错误信息 | T3 + T4 |
| F2-11 | 筛选使用双对象模式（filter + currentFilter），查询按钮点击时同步 | 代码审查 |
| F2-12 | `src/modules/storage/views/StorageList.spec.ts` 存在，≥ 12 个测试用例 | S1 + 测试计数 |
| F2-13 | `pnpm typecheck` 退出码 0 | S6 |
| F2-14 | `pnpm lint` 退出码 0 | S7 |
| F2-15 | `pnpm test` 退出码 0，≥ 50 spec files / ≥ 437 tests | R1 + R2 + R3 |
| F2-16 | `pnpm build` 退出码 0 | R4 |

## 15. 执行回执格式

按 §7.1 标准格式返回，特别需包含：

- 第 3 项"实际读取的文件"：列出读取的前端文件及目的
- 第 4 项"实际修改的文件"：3 个新建文件
- 第 5 项"每个文件的修改摘要"：每个文件的功能、行数、关键函数/组件/测试用例数
- 第 6 项"实际执行的命令"：含完整四连命令及退出码
- 第 7 项"命令输出摘要"：`pnpm test` 的测试文件数 + 测试用例总数 + 全部通过确认
- 第 8 项"与原方案的偏差"：特别需注明**筛选功能与后端参数不匹配的处理方式**（如何实现 loadList、originalName 参数是否传递）
- 第 12 项"Git diff 摘要"：新增文件数 + 行数
- 第 13 项"建议执行的测试"：列出需重点验证的测试场景

## 16. 测试回执格式

按 §7.2 标准格式返回，特别需包含：

- 第 4 项"实际执行的测试命令"：列出 S1-S7 + T1-T13 + R1-R6 命令及输出
- 第 5 项"各测试项结果"：逐条列出，含实际数字
- 第 10 项"是否满足验收标准"：逐条对照 F2-1 ~ F2-16

**测试计数格式要求**：
```text
pnpm test 输出摘要：
 Test Files  50 passed (50)  ← 基线 49 + 1
      Tests  437 passed (437)  ← 基线 425 + ≥12
```

## 17. 明确禁止事项

- ❌ **禁止**修改 `src/modules/storage/api/index.ts` — F1 已验收，不得回退
- ❌ **禁止**修改 `src/modules/storage/api/index.spec.ts` — F1 已验收
- ❌ **禁止**修改 `src/contracts/storage.ts` — F1 已验收
- ❌ **禁止**修改或新增 mock handlers（`src/foundation/mock/handlers.ts`）— 属 F3 范围
- ❌ **禁止**修改 mock 种子数据（`src/foundation/mock/seeds.ts`）— 属 F3 范围
- ❌ **禁止**修改路由配置（`src/router/index.ts` 或 `src/router/guard.ts`）— 菜单注册属 F3
- ❌ **禁止**修改菜单 store 或菜单加载逻辑 — 属 F3
- ❌ **禁止**使用 `el-upload` 组件（测试中 mock 困难）。使用原生 `<input type="file">` + `uploadFile()` API
- ❌ **禁止**在表格中直接展示 fileSize 数字（必须经 `formatFileSize()` 格式化）
- ❌ **禁止**在 StorageList.vue 中 import axios
- ❌ **禁止**从其他 `modules/X` 横向 import（`modules/storage/` 内部交叉引用除外）
- ❌ **禁止**删除文件时不弹确认框
- ❌ **禁止**修改 `package.json`、`vite.config.ts`、`eslint.config.js`
- ❌ **禁止**访问 `Smart-WorkFlow/` 后端代码
- ❌ **禁止**在 `loadList()` 中实现前端侧过滤（如 `list.filter(f => f.originalName.includes(...))`）— 数据一致性优先，后端筛选参数就位后再点亮。筛选 UI 保持渲染但 loadList 传不过滤参数即可
