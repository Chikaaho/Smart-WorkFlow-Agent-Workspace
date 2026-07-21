# 执行回执

## 1. Step 编号和名称

**Step F2**：前端 Vue 视图 — 文件管理列表页

## 2. 使用模型

- deepseek-v4-flash（按方案推荐，纯机械编码无架构决策）

## 3. 实际读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| 1 | `src/modules/system/views/UserList.vue` | 参照：完整列表页模式（loading/error/page/dialog/delete） |
| 2 | `src/components/page-layout/StandardListTemplate.vue` | 确认 props/slots/emits 签名 |
| 3 | `src/modules/notify/views/NotifyHome.vue` | 参照：简单列表页 + 错误/空态处理 |
| 4 | `src/modules/notify/views/NotifyHome.spec.ts` | 参照：列表页测试 stub 模式 + API mock |
| 5 | `src/modules/storage/api/index.ts` | 确认 5 个 API 函数的精确签名 |
| 6 | `src/contracts/storage.ts` | 确认 StorageFile / StorageUploadResult 字段 |
| 7 | `src/contracts/common.ts` | 确认 PageResult<T> 类型 |
| 8 | `src/modules/storage/api/index.spec.ts` | 了解 API mock 返回值形状 |
| 9 | `src/foundation/request/index.ts` | 确认 ApiError 类型（用于 catch 分支） |
| 10 | `eslint.config.js` | 排查 no-undef 规则（用于解决 lint 报错） |

## 4. 实际修改的文件

### 新建文件（3 个）

| # | 文件 | 行数 | 用途 |
|---|------|:----:|------|
| 1 | `src/modules/storage/utils/format.ts` | 32 行 | `formatFileSize` 纯函数工具，字节→B/KB/MB/GB |
| 2 | `src/modules/storage/views/StorageList.vue` | 322 行 | 文件管理列表页组件（StandardListTemplate + 上传弹窗 + 表格 + 下载/删除） |
| 3 | `src/modules/storage/views/StorageList.spec.ts` | 338 行 | 13 个测试用例覆盖全部功能路径 |

### 修改文件（0 个）

本 Step 零修改，纯新建。

## 5. 每个文件的修改摘要

### `src/modules/storage/utils/format.ts`
- `formatFileSize(bytes)`：字节→B/KB/MB/GB 格式化，支持 `bytes ≤ 0` 返回 "0 B"，对数函数安全处理
- 无依赖，纯函数，32 行

### `src/modules/storage/views/StorageList.vue`
- **列表状态**：list/total/pageNum/pageSize/loading/errorMsg ref，isEmpty computed
- **双对象筛选**：filter（UI 绑定）+ currentFilter（查询按钮同步），注意：当前后端无 originalName 参数，筛选 UI 已就位但 loadList 不传筛选参数
- **上传弹窗**：原生 `<input type="file">` → `uploadFile()` API → 成功刷新列表/失败弹窗内错误提示
- **下载**：`downloadFile()` → `URL.createObjectURL` → `<a>` click 触发下载 → `revokeObjectURL`
- **删除**：`ElMessageBox.confirm` 确认 → `deleteFile()` → 刷新列表
- **表格 7 列**：文件名、大小（formatFileSize 格式化）、类型（大写+el-tag）、MIME、存储方式（中文+颜色标签）、上传时间、操作（下载+删除）
- **providerType 中文映射**：local→本地、minio→MinIO、cos→COS、qiniu→七牛云，不同颜色 el-tag
- **行操作类型桥接**：`downloadRow(r: unknown)` / `deleteRow(r: unknown)` 解决 el-table slot scope 类型不兼容

### `src/modules/storage/views/StorageList.spec.ts`
- 13 个测试用例（4 个 describe 块）：
  - T1: onMounted 调用 listFiles ✅
  - T2: 列表数据正确渲染 ✅
  - T3: API 错误（ApiError）设 errorMsg ✅
  - T4: API 错误（非 ApiError）fallback ✅
  - T5: 空列表 → isEmpty = true ✅
  - T6: 上传弹窗可见 ✅
  - T7: 上传成功 → ElMessage.success + 刷新列表 ✅
  - T8: 上传失败 → uploadError ✅
  - T9: 删除确认 → deleteFile + 刷新列表 ✅
  - T10: 删除取消 → 不调用 deleteFile ✅
  - T11: 删除失败 → ElMessage.error ✅
  - T12: 下载成功 → downloadFile 调用 ✅
  - T13: 下载失败 → ElMessage.error ✅

## 6. 实际执行的命令

```bash
# 目录创建
mkdir -p src/modules/storage/utils src/modules/storage/views

# 静态检查（手动验证）
ls src/modules/storage/utils/format.ts src/modules/storage/views/StorageList.vue src/modules/storage/views/StorageList.spec.ts
# → 3 files exist ✅

grep "export function formatFileSize" src/modules/storage/utils/format.ts
# → 命中 ✅

grep "StandardListTemplate" src/modules/storage/views/StorageList.vue
# → 1 import + 1 使用 + 2 注释 = 4 命中 ✅

grep -rn "from '@/modules/" src/modules/storage/views/
# → 仅自身模块引用（storage/api, storage/utils）——零跨模块 ✅

# 校验门四连
pnpm typecheck   → EXIT 0 ✅
pnpm lint        → EXIT 0 ✅（初始 8 个 no-undef 错误，添加 /* global ... */ 声明后解决）
pnpm test        → 50 files / 438 tests passed → EXIT 0 ✅
pnpm build       → built in 2.85s → EXIT 0 ✅

# 全量校验门（一步）
pnpm typecheck && pnpm lint && pnpm test && pnpm build
# → 全部 EXIT 0 ✅
```

## 7. 命令输出摘要

```text
# pnpm typecheck
vue-tsc -b --noEmit
EXIT: 0

# pnpm lint
0 errors, 0 warnings → EXIT 0

# pnpm test
 Test Files  50 passed (50)
      Tests  438 passed (438)
   Duration  89.05s

# pnpm build
✓ built in 2.85s
EXIT: 0
```

## 8. 与原方案的偏差

| 偏差项 | 方案初始值 | 实际值 | 原因 |
|--------|-----------|--------|------|
| **ESLint no-undef 规则** | 预期 lint 一次性零警告 | 初始 `pnpm lint` 报 8 个 `no-undef` 错误（`File`、`Event`、`HTMLInputElement`、`URL`、`document`） | 当前 eslint.config.js 的 `.vue` 文件配置未设置 `env: { browser: true }`，浏览器全局变量在 `.vue` 文件中不被识别。**解决方案**：在 StorageList.vue 顶部添加 `/* global File, Event, HTMLInputElement, URL, document */` 声明，不修改 eslint.config.js（§8 禁止修改） |
| **测试用例数** | ≥ 12 | **13** | 额外增加了 `handleDownload` 成功测试用例，确保下载路径覆盖 |
| **筛选功能** | 筛选 UI + 查询/重置按钮全功能 | UI 就位 + 按钮就位，但 `loadList()` 不传 `originalName` 参数 | 方案 §11 边界情况明确标注：后端当前无 `originalName` 筛选参数。loadList 调用 `listFiles(page, size)` 保持不传额外参数。筛选功能待后端 Search 端点就绪后再点亮 |

## 9. 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `pnpm typecheck` 报 `ElMessageBox.confirm` 参数类型不兼容 | `undefined` 不匹配 `MessageBoxData` 类型 | 改为 `undefined as never` 类型断言（测试中 `mockResolvedValueOnce`），与 NotifyHome.spec.ts 模式一致 |
| `pnpm typecheck` 报 `originalAppendChild` 未使用 | 声明的 `originalAppendChild` 变量未被消费 | 移除未使用的绑定，直接使用 `vi.spyOn` |
| `pnpm lint` 报 8 个 `no-undef` 错误 | `.vue` 文件 `env: { browser: true }` 未配置 | 在 StorageList.vue `<script setup>` 顶部添加 `/* global File, Event, HTMLInputElement, URL, document */` 声明 |

## 10. 未完成内容

无。方案中的所有 3 个文件均已创建，13 个测试用例全部通过。

**未做的内容（符合方案预期）**：
- ❌ 未添加 mock handlers（F3 的工作）
- ❌ 未修改路由或菜单（F3 的工作）
- ❌ 未修改 eslint.config.js（§8 禁止）
- ❌ 未修改 F1 已验收文件

## 11. 风险和注意事项

- **筛选功能暂停态**：后端 `GET /storage/files` 当前无 `originalName` 参数。`loadList()` 调用 `listFiles(page, size)` 不传筛选参数。筛选输入框和查询/重置按钮正常运作但实际效果仅为重新加载列表。后续需等后端 Search 端点就绪后，在 `listFiles()` 增加 `originalName` 参数并在 `loadList()` 中传入 `currentFilter.originalName`。
- **`/* global */` 声明**：StorageList.vue 中顶部声明的浏览器全局变量是 eslint 兼容性标记。TypeScript 类型检查不受影响。待 eslint config 后续添加 `env: { browser: true }` 后可移除。
- **下载依赖 `URL.createObjectURL`**：需及时 `revokeObjectURL` 避免内存泄漏，已实现。
- **StorageList 未注册路由**：属正常现象。菜单项和路由由 F3 负责注册，F2 仅创建视图组件。

## 12. Git diff 摘要

```
新增文件：3 个
新增行数：约 692 行（format 32 + StorageList.vue 322 + spec 338）
修改文件：0 个
```

## 13. 建议执行的测试

- F3 mock handlers 实现后，用 `pnpm dev:mock` 全链路验证上传/列表/下载/删除功能
- 验证 `formatFileSize` 边界值：0 B、500 B、1.5 KB、1.0 MB、1.0 GB
- 验证 providerType 标签显示：local→本地(info)、minio→MinIO(primary)、cos→COS(success)、qiniu→七牛云(warning)
- 验证下载文件名从 Content-Disposition 正确解析（中文文件名）
- 验证删除确认弹窗展示文件名、取消不触发删除
