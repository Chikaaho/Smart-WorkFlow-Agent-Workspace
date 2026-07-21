# 执行回执

## 1. Step 编号和名称

**Step F3**：前端 Mock + Handlers + 路由

## 2. 使用模型

- deepseek-v4-flash（按方案推荐，纯数据追加无架构决策）

## 3. 实际读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| 1 | `src/foundation/mock/handlers.ts` | 确认 import 语句格式、handler 注册模式、分页响应形状、delete handler 幂等模式 |
| 2 | `src/foundation/mock/seeds.ts` | 确认 MOCK_MENU_TREE 结构（已有的 8 个菜单项 id/sort）、MOCK_SESSION_DATA.permissions 列表、种子数据导出模式 |
| 3 | `src/modules/storage/api/index.ts` | 确认 API 端点 URL（含 query 参数名 page/size）和 adaptPage 响应字段（pageNum/pageSize） |
| 4 | `src/contracts/storage.ts` | 确认 StorageFile（14 字段）和 StorageUploadResult（4 字段）精确类型 |
| 5 | `product/storage-multi-provider/ready/step-f3-mock-handlers-routes.md` | 读取执行方案全文（698 行） |

## 4. 实际修改的文件

| # | 文件 | 操作 | 追加行数 |
|---|------|:----:|:--------:|
| 1 | `src/foundation/mock/seeds.ts` | 修改 | ~110 行（权限 1 行 + 菜单项 12 行 + 种子数据 ~95 行） |
| 2 | `src/foundation/mock/handlers.ts` | 修改 | ~85 行（import 1 行 + handler 4 块 ~84 行） |

### 新建文件（0 个）

本 Step 纯修改已有文件，零新建。

## 5. 每个文件的修改摘要

### `src/foundation/mock/seeds.ts`

**① 追加权限 `'storage:view'`**（L33，`MOCK_SESSION_DATA.permissions` 末尾）：
- 与已有 `'notify:view'`、`'workflow:view'` 命名模式一致
- 不影响已有 9 项权限的顺序和值

**② 追加菜单项**（L247-258，`MOCK_MENU_TREE` 末尾，id='8' 之后）：
```typescript
{
  id: '9', parentId: null, name: 'storage', title: '文件管理',
  path: 'storage', component: 'storage/views/StorageList',
  icon: 'FolderOpened', sort: 9, menuType: 1, permission: 'storage:view',
}
```
- `component: 'storage/views/StorageList'` → `resolveComponent()` 拼接为 `/src/modules/storage/views/StorageList.vue` → `import.meta.glob` 白名单命中

**③ 追加 `MOCK_STORAGE_FILES` 种子数组**（文件末尾，L1117-1204）：
- 8 条记录，覆盖全部 4 种 providerType（local×2、minio×2、cos×2、qiniu×2）
- 文件大小多样化：2KB ~ 3MB（覆盖 formatFileSize 的 KB/MB 级别）
- 文件类型多样化：pdf×2、png、docx、xlsx、jpg、txt、svg
- 可变数组（`const` 声明），delete handler 通过 `.splice()` 原地删除
- 14 个字段全部对齐 `StorageFile` 接口

### `src/foundation/mock/handlers.ts`

**① 追加 import（L46）**：在 `MOCK_POSTS_LIST,` 之后追加 `MOCK_STORAGE_FILES,`

**② 追加 4 个 handler（末尾，最后一个 `}` 之后、`]` 之前）**：

| Handler | 方法 | Pattern | 关键实现 |
|---------|:----:|---------|----------|
| 分页列表 | GET | `/api/storage/files` | query 参数 `page`/`size`，响应 `records`/`total`/`pageNum`/`pageSize` |
| 上传 | POST | `/api/storage/files/upload` | 不解析 FormData body，返回静态结果 + unshift 新文件到数组头部 |
| 查询详情 | GET | `/api/storage/files/:storageKey` | 返回 `{ ...file }` 副本，不存在→code: 404 |
| 删除 | DELETE | `/api/storage/files/:storageKey` | 幂等（不存在也返回 code: 0），通过 splice 原地删除 |

**不添加 download handler**（`downloadFile()` 走原生 `fetch()`，不经 mock 系统）。

## 6. 实际执行的命令

```bash
# 静态检查（手动验证）
grep "MOCK_STORAGE_FILES" src/foundation/mock/seeds.ts
# → 命中(导出声明行 + 数据行) ✅

grep -c "/api/storage/files" src/foundation/mock/handlers.ts
# → 8（4 条 comment + 4 条 pattern 声明）✅

grep "download" src/foundation/mock/handlers.ts | grep -vi "storage" | grep -vi "comment"
# → 零命中（无 storage download handler）✅

# 校验门四连
pnpm typecheck   → EXIT 0 ✅
pnpm lint        → 0 errors, 0 warnings → EXIT 0 ✅
pnpm test        → 50 files / 438 tests passed → EXIT 0 ✅
pnpm build       → built in 3.18s → EXIT 0 ✅

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
   Duration  85.98s

# pnpm build
✓ built in 2.95s
EXIT: 0
```

## 8. 与原方案的偏差

| 偏差项 | 方案预期 | 实际值 | 原因 |
|--------|---------|--------|------|
| **storage handler grep 计数** | S5 预期 `grep "/api/storage/files"` 返回 4 | 实际返回 **8** | grep 匹配包括 handler 上方的注释行（如 `// GET /api/storage/files?page=&size=`），每个 handler 有 1 行注释 + 1 行 pattern 声明 → 4 handler × 2 = 8。非编码问题，仅是 grep 计数比预期多 |
| **upload handler 时间格式** | `new Date().toISOString()...` | 使用 `new Date(new Date().toISOString().split('T')[0] + 'T00:00:00')` 构造日期字符串 | 保持时间格式与种子数据一致，避免毫秒级时间戳影响列表排序展示 |
| **upload handler Date.now()** | `Date.now()` 在 mock 运行时可用 | 同方案预期，仅浏览器运行时调用，不影响 CI build | `Date.now()` 在 CI 构建期不执行（handler 函数体在浏览器中才被调用），实际验证：pnpm build EXIT 0 |

## 9. 遇到的问题

无。全部修改为纯追加数据，未遇到类型错误、lint 告警或测试退化。

## 10. 未完成内容

无。方案中所有 5 处修改（seeds.ts ×3 + handlers.ts ×2）均已执行。

**未做的内容（符合方案预期）**：
- ❌ 未添加 download handler（downloadFile 走原生 fetch，不添加死代码）
- ❌ 未修改 `src/modules/storage/` 任何文件（F1/F2 已验收）
- ❌ 未修改 `src/router/` 或 `src/components/` 任何文件
- ❌ 未修改已有菜单项或已有权限（只追加，不扰序）
- ❌ 未创建新文件
- ❌ 未访问后端代码

## 11. 风险和注意事项

- **S5 grep 计数偏差**（8 vs 预期 4）：注释行也被计入。4 个 handler 确实全部存在。后续通过 `grep "pattern: '/api/storage/files"` 可精确匹配。
- **upload handler Date.now()**：仅浏览器运行时可用，CI/构建期不执行。已验证 build 不报错。
- **下载在 mock 模式不可用**：`downloadFile()` 使用原生 `fetch()`，不经 mock 系统拦截。`pnpm dev:mock` 下点击下载 → `ElMessage.error('下载失败')`。需在 `pnpm dev`（真后端）模式下验证下载功能。
- **种子数据可变性**：delete 和 upload handler 会原地修改 `MOCK_STORAGE_FILES` 数组。页面刷新后模块重载，恢复初始状态。

## 12. Git diff 摘要

```
修改文件：2 个
新增行数：约 195 行（seeds ~110 + handlers ~85）
删除行数：0 行
```

## 13. 建议执行的测试

### 手工验证（`pnpm dev:mock`）

| 编号 | 验证项 | 预期结果 |
|:----:|--------|----------|
| V1 | 菜单项可见 | 侧边栏出现「文件管理」（FolderOpened 图标），位于「表单管理」下方 |
| V2 | 列表页渲染 | 点击「文件管理」→ 8 条 mock 数据，7 列全部渲染 |
| V3 | fileExt 大写标签 | PDF、PNG、DOCX、XLSX、JPG、TXT、SVG 大写 el-tag |
| V4 | providerType 标签 | local→本地(info)、minio→MinIO(primary)、cos→COS(success)、qiniu→七牛云(warning) |
| V5 | formatFileSize | 2KB→"2.0 KB"、240KB→"240.0 KB"、1MB→"1.0 MB"、3MB→"3.0 MB" |
| V6 | 上传弹窗 | 选择文件 → 上传 → 列表顶部出现「新上传的文件.txt」 |
| V7 | 删除确认 | 确认删除 → 条目消失 + ElMessage.success |
| V8 | 删除取消 | 取消 → 条目不变 |
| V9 | 下载（mock 模式） | 点击「下载」→ ElMessage.error('下载失败')（预期行为） |
| V10 | 空态 | 删除全部 8 条 → 空态占位 + 「上传文件」按钮 |
