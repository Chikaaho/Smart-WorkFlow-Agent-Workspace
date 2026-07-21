# Step 1：前端工作流基础设施（contracts + API + mock + menu）

> 需求：M04-F01-01 BPM 单节点审批前后端联通
> 定位：前端基础层 — 为 Step 2/3 的页面提供 types、API 函数、mock 数据和菜单路由
> 前置：Step 0a PASSED ✅、Step 0b PASSED ✅

---

## 1. 当前状态

功能 M04-F01-01 处于 IN_PROGRESS。Step 0a/0b 测试基线验证均已 PASSED。前端 `modules/workflow/` 当前仅 1 个占位文件 `WorkflowHome.vue`（渲染 `<BlankPage/>`）。本 Step 建立工作流模块的全部基础设施，使 Step 2（待办列表页）和 Step 3（流程定义列表页）可零开销接入。

## 2. Step 目标

建立工作流模块的 TypeScript 类型契约、API 函数层、mock 数据/处理器、菜单路由结构。完成后可通过 `pnpm test` 验证 API 层单测，通过 `pnpm dev:mock` 验证菜单和路由。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：纯前端 CRUD 类型定义 + API 包装 + mock 数据，严格遵循 form 模块已有模式（form-def.ts、form.spec.ts、handlers.ts、seeds.ts），零架构决策、零后端改动
是否触发升级条件：否
```

## 4. 模型选择理由

所有工作为机械性的"照搬已有模式"：API 层照搬 `form-def.ts`，mock 照搬 `handlers.ts` 中的已有条目，菜单照搬已有 `MOCK_MENU_TREE` 结构。不涉及协议设计、安全边界、并发或跨项目联动。

## 5. 已知上下文

- **后端契约**（仅参考，不修改）：
  - `GET /workflow/tasks/todo` → `R<List<TodoTaskRespDTO>>`（taskId / processInstanceId / formKey / businessKey / createTime）
  - `POST /workflow/tasks/{taskId}/complete` → `R<Void>`
  - `GET /workflow/defs?pageNum=&pageSize=` → `R<PageResult<BpmProcessDef>>`（records 字段，需 adapt 为 list）
  - `BpmProcessDef` 含：id (Long) / processKey / name / formKey / defVersion / status (DRAFT/PUBLISHED) / graphJson（列表不返回）
- **前端参考模式**：
  - API 层：`src/modules/form/api/form-def.ts` — `BackendPageResult<T>` + `adaptPage()` 模式，`request()` 调用
  - API 测试：`src/modules/form/api/form-def.spec.ts` — `vi.mock('@/foundation/request')` + 动态 import
  - Mock handlers：`src/foundation/mock/handlers.ts` — 17 个已有注册，pattern 带 `/api/` 前缀
  - Mock seeds：`src/foundation/mock/seeds.ts` — `MOCK_MENU_TREE`、`MOCK_SESSION_DATA`
  - 菜单解析：`src/foundation/menu/index.ts` — `buildRoutesFromNodes()` 对 DIRECTORY（menuType=0）自动 `findFirstLeafPath`
- **前端约束**：
  - 业务模块禁直引 axios（必须走 `foundation/request`）
  - 菜单单一数据源（`loadMenu()` 同时喂 router 和侧边栏）
  - 组件解析走 `import.meta.glob` 白名单
  - ESLint 强制模块边界规则

## 6. 执行前必须读取的文件

按优先级排序：

1. `Smart-WorkFlow-Web/src/modules/form/api/form-def.ts` — **必须读**：API 层模板（`BackendPageResult`、`adaptPage`、函数签名模式）
2. `Smart-WorkFlow-Web/src/modules/form/api/form-def.spec.ts` — **必须读**：API 测试模板（mock request、动态 import、验证调用参数）
3. `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` — **必须读**：了解现有 handler 注册格式、pattern 前缀约定
4. `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` — **必须读**：了解现有 `MOCK_MENU_TREE` 完整结构，定位 workflow 节点（id='3'）
5. `Smart-WorkFlow-Web/src/contracts/common.ts` — **必须读**：确认 `PageQuery`、`PageResult<T>` 的形状
6. `Smart-WorkFlow-Web/src/foundation/request/index.ts` — 了解 `request()` 函数签名（确认返回类型是直接 `T` 还是包装类型）

## 7. 允许修改的文件范围

| 文件 | 操作 | 说明 |
|------|:---:|------|
| `Smart-WorkFlow-Web/src/contracts/bpm.ts` | **新建** | 工作流 TypeScript 类型定义 |
| `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` | **新建** | API 函数层 |
| `Smart-WorkFlow-Web/src/modules/workflow/api/index.spec.ts` | **新建** | API 函数单测 |
| `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | **修改** | 新增 `MOCK_TODO_TASKS`、`MOCK_PROCESS_DEFS`；修改 `MOCK_MENU_TREE` 中 workflow 节点 |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | **修改** | `mockRegistrations` 数组末尾追加 3 个 handler |
| `Smart-WorkFlow-Web/src/modules/workflow/views/WorkflowHome.vue` | **修改** | 替换 `<BlankPage/>` 为最小占位 |

## 8. 禁止修改的范围

- ❌ `src/adapters/bpmn/index.ts` 和 `src/adapters/flow-graph/index.ts` — 保持 `throw Error('not implemented')`
- ❌ `src/router/index.ts` — 不添加静态路由（菜单驱动动态路由）
- ❌ `src/foundation/request/index.ts` — 不动请求层
- ❌ `src/foundation/mock/index.ts` — 不动 mock 框架核心
- ❌ 所有后端 Java 文件
- ❌ `src/contracts/common.ts` — 不动已有公共类型

## 9. 详细执行方案

### 9.1 新建 `src/contracts/bpm.ts`

```typescript
// ─── 待办任务 DTO（对齐后端 TodoTaskRespDTO） ───
export interface TodoTask {
  taskId: string
  processInstanceId: string
  formKey: string
  businessKey: string
  createTime: string
}

// ─── 流程定义列表项 DTO（对齐后端 BpmProcessDef，不含 graph_json） ───
export interface ProcessDef {
  id: number
  processKey: string
  name: string
  formKey: string
  defVersion: number
  status: 'DRAFT' | 'PUBLISHED'
  createTime: string
  updateTime: string
}
```

### 9.2 新建 `src/modules/workflow/api/index.ts`

完全照搬 `form-def.ts` 模式：

```typescript
import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import type { TodoTask, ProcessDef } from '@/contracts/bpm'

// ─── 后端分页原始形状 ───
interface BackendPageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

function adaptPage<T>(raw: BackendPageResult<T>): PageResult<T> {
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.pageNum,
    pageSize: raw.pageSize,
  }
}

// ═══════════════════════════════════════
// 待办任务
// ═══════════════════════════════════════

/** GET /workflow/tasks/todo → TodoTask[] */
export async function queryTodoTasks(): Promise<TodoTask[]> {
  return request<TodoTask[]>({
    method: 'GET',
    url: '/workflow/tasks/todo',
  })
}

/** POST /workflow/tasks/{taskId}/complete → void */
export async function completeTask(taskId: string): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/workflow/tasks/${taskId}/complete`,
  })
}

// ═══════════════════════════════════════
// 流程定义
// ═══════════════════════════════════════

/** GET /workflow/defs → PageResult<ProcessDef> */
export async function pageProcessDefs(
  page: PageQuery,
): Promise<PageResult<ProcessDef>> {
  const raw = await request<BackendPageResult<ProcessDef>>({
    method: 'GET',
    url: '/workflow/defs',
    params: page,
  })
  return adaptPage(raw)
}
```

### 9.3 新建 `src/modules/workflow/api/index.spec.ts`

完全照搬 `form-def.spec.ts` 模式：

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRequest = vi.fn()

vi.mock('@/foundation/request', () => ({
  request: <T>(config: unknown): Promise<T> => mockRequest(config),
}))

const workflowApi = await import('./index')

describe('modules/workflow/api', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('queryTodoTasks sends GET /workflow/tasks/todo', async () => {
    const tasks = [{ taskId: 't1', processInstanceId: 'p1', formKey: 'fk', businessKey: 'bk', createTime: '2026-07-14T10:00:00' }]
    mockRequest.mockResolvedValueOnce(tasks)
    const result = await workflowApi.queryTodoTasks()
    expect(mockRequest).toHaveBeenCalledWith({ method: 'GET', url: '/workflow/tasks/todo' })
    expect(result).toEqual(tasks)
  })

  it('completeTask sends POST /workflow/tasks/{taskId}/complete', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await workflowApi.completeTask('task-001')
    expect(mockRequest).toHaveBeenCalledWith({ method: 'POST', url: '/workflow/tasks/task-001/complete' })
  })

  it('pageProcessDefs sends GET /workflow/defs and adapts records→list', async () => {
    mockRequest.mockResolvedValueOnce({ records: [{ id: 1, processKey: 'sk', name: 'N', formKey: 'fk', defVersion: 1, status: 'PUBLISHED', createTime: '', updateTime: '' }], total: 1, pageNum: 1, pageSize: 10 })
    const result = await workflowApi.pageProcessDefs({ pageNum: 1, pageSize: 10 })
    expect(mockRequest).toHaveBeenCalledWith({ method: 'GET', url: '/workflow/defs', params: { pageNum: 1, pageSize: 10 } })
    expect(result.list).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})
```

### 9.4 修改 `src/foundation/mock/seeds.ts`

**追加种子数据**（在文件末尾，`MOCK_MENU_TREE` 等已有导出之后）：

```typescript
// ─── 待办任务 Mock 种子 ──────────────────────────────
export const MOCK_TODO_TASKS: Array<{
  taskId: string
  processInstanceId: string
  formKey: string
  businessKey: string
  createTime: string
}> = [
  {
    taskId: 'mock-task-001',
    processInstanceId: 'mock-proc-001',
    formKey: 'leave-request',
    businessKey: 'fd_001',
    createTime: '2026-07-10T09:15:00',
  },
  {
    taskId: 'mock-task-002',
    processInstanceId: 'mock-proc-002',
    formKey: 'purchase-order',
    businessKey: 'fd_003',
    createTime: '2026-07-11T14:30:00',
  },
  {
    taskId: 'mock-task-003',
    processInstanceId: 'mock-proc-003',
    formKey: 'contract-approval',
    businessKey: 'fd_005',
    createTime: '2026-07-12T10:00:00',
  },
  {
    taskId: 'mock-task-004',
    processInstanceId: 'mock-proc-004',
    formKey: 'expense-report',
    businessKey: 'gen_001',
    createTime: '2026-07-13T08:45:00',
  },
  {
    taskId: 'mock-task-005',
    processInstanceId: 'mock-proc-005',
    formKey: 'leave-request',
    businessKey: 'gen_002',
    createTime: '2026-07-14T11:20:00',
  },
]

// ─── 流程定义 Mock 种子 ──────────────────────────────
export const MOCK_PROCESS_DEFS: Array<{
  id: number
  processKey: string
  name: string
  formKey: string
  defVersion: number
  status: 'DRAFT' | 'PUBLISHED'
  createTime: string
  updateTime: string
}> = [
  { id: 1, processKey: 'skeleton_approval', name: '单节点审批流程', formKey: 'it_application', defVersion: 1, status: 'PUBLISHED', createTime: '2026-07-05 10:00:00', updateTime: '2026-07-05 10:00:00' },
  { id: 2, processKey: 'leave_approval', name: '请假审批流程', formKey: 'leave-request', defVersion: 1, status: 'PUBLISHED', createTime: '2026-07-08 14:20:00', updateTime: '2026-07-09 09:10:00' },
  { id: 3, processKey: 'contract_approval', name: '合同审批流程', formKey: 'contract-approval', defVersion: 1, status: 'PUBLISHED', createTime: '2026-07-06 16:30:00', updateTime: '2026-07-10 11:00:00' },
  { id: 4, processKey: 'purchase_draft', name: '采购审批（草稿）', formKey: 'purchase-order', defVersion: 1, status: 'DRAFT', createTime: '2026-07-12 08:00:00', updateTime: '2026-07-12 08:00:00' },
  { id: 5, processKey: 'expense_approval', name: '费用报销流程', formKey: 'expense-report', defVersion: 1, status: 'PUBLISHED', createTime: '2026-07-09 13:45:00', updateTime: '2026-07-11 15:30:00' },
]
```

**修改 workflow 菜单节点**（定位 `MOCK_MENU_TREE` 中 `id: '3'` 的 workflow 条目）：将原来的单 MENU 叶子改为 DIRECTORY + 两个子 MENU。

改前（当前）：
```typescript
{
  id: '3',
  parentId: null,
  name: 'workflow',
  title: '流程引擎',
  path: 'workflow',
  component: 'workflow/views/WorkflowHome',
  icon: 'Share',
  sort: 3,
  menuType: 1,                    // MENU
  permission: 'workflow:view',
  hidden: false,
},
```

改后：
```typescript
{
  id: '3',
  parentId: null,
  name: 'workflow',
  title: '流程引擎',
  path: 'workflow',
  component: null,                // DIRECTORY 不设 component
  icon: 'Share',
  sort: 3,
  menuType: 0,                    // 0 = DIRECTORY
  permission: 'workflow:view',
  hidden: false,
  children: [
    {
      id: '30',
      parentId: '3',
      name: 'todo-list',
      title: '我的待办',
      path: 'workflow/todo',
      component: 'workflow/views/TodoList',
      icon: 'List',
      sort: 1,
      menuType: 1,                // 1 = MENU
      permission: 'workflow:view',
      hidden: false,
    },
    {
      id: '31',
      parentId: '3',
      name: 'process-def-list',
      title: '流程定义',
      path: 'workflow/defs',
      component: 'workflow/views/ProcessDefList',
      icon: 'Document',
      sort: 2,
      menuType: 1,                // 1 = MENU
      permission: 'workflow:view',
      hidden: false,
    },
  ],
},
```

### 9.5 修改 `src/foundation/mock/handlers.ts`

在 `mockRegistrations` 数组**末尾**追加 3 个 handler（注意：需要先 import `MOCK_TODO_TASKS` 和 `MOCK_PROCESS_DEFS`）：

```typescript
// ── 待办任务：当前用户待办列表 ──────────────────────────
{
  method: 'GET',
  pattern: '/api/workflow/tasks/todo',
  handler: () => ({
    code: 0,
    message: 'ok',
    data: MOCK_TODO_TASKS,
  }),
},

// ── 待办任务：完成审批（从 mock 列表中移除对应 task） ────
{
  method: 'POST',
  pattern: '/api/workflow/tasks/:taskId/complete',
  handler: (params) => {
    const { taskId } = params as Record<string, string>
    const idx = MOCK_TODO_TASKS.findIndex((t) => t.taskId === taskId)
    if (idx === -1) {
      return { code: 404, message: '任务不存在', data: null }
    }
    MOCK_TODO_TASKS.splice(idx, 1)
    return { code: 0, message: 'ok', data: null }
  },
},

// ── 流程定义：分页列表 ─────────────────────────────────
{
  method: 'GET',
  pattern: '/api/workflow/defs',
  handler: (_params, query) => {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 10)
    const total = MOCK_PROCESS_DEFS.length
    const start = (pageNum - 1) * pageSize
    const records = MOCK_PROCESS_DEFS.slice(start, start + pageSize)
    return {
      code: 0,
      message: 'ok',
      data: { records, total, pageNum, pageSize },
    }
  },
},
```

### 9.6 修改 `src/modules/workflow/views/WorkflowHome.vue`

将原有的 `<BlankPage/>` 替换为最小占位组件。因为菜单改为 DIRECTORY 后，`buildRoutesFromNodes` 的 `findFirstLeafPath` 会自动将 `/workflow` 重定向到 `/workflow/todo`，WorkflowHome.vue 仅作为 fallback。

```vue
<script setup lang="ts">
// 目录重定向到第一个子页 /workflow/todo；本组件仅作 fallback。
</script>
<template>
  <div />
</template>
```

### 9.7 执行顺序

1. 先读取 §6 列出的 6 个必须文件
2. 创建 `src/contracts/bpm.ts`
3. 创建 `src/modules/workflow/api/index.ts`
4. 创建 `src/modules/workflow/api/index.spec.ts`
5. 修改 `src/foundation/mock/seeds.ts`（种子数据 + menu）
6. 修改 `src/foundation/mock/handlers.ts`（追加 3 个 handler，注意 import）
7. 修改 `src/modules/workflow/views/WorkflowHome.vue`
8. 运行 `pnpm typecheck && pnpm lint && pnpm test` 验证

## 10. 关键实现约束

- **API 层必须走 `foundation/request`**，不直引 axios
- **mock pattern 必须带 `/api/` 前缀**（与已有 17 个 handler 一致）
- **分页响应 `records` → `list`**：后端返回 `{ records, total, pageNum, pageSize }`，前端 `adaptPage()` 转为 `{ list, total, pageNum, pageSize }`
- **menuType 0 = DIRECTORY, 1 = MENU**：参考已有 `MOCK_MENU_TREE` 中的 form 节点（id='2'，DIRECTORY）模式
- **component 路径格式**：`'workflow/views/TodoList'`（不含 `src/` 前缀，不含 `.vue` 后缀）
- **手改 seeds.ts 中的 menu 节点**：先确认当前文件中 workflow（id='3'）节点的精确文本，再精确替换
- **handlers.ts 的 import**：确认 `MOCK_TODO_TASKS` 和 `MOCK_PROCESS_DEFS` 已在 handlers.ts 文件顶部从 `seeds.ts` import

## 11. 边界情况

- **WorkflowHome.vue 仍被旧缓存引用**：如果菜单缓存未刷新，用户在 `/workflow` 会看到空 div。这是预期行为——菜单刷新后自动重定向到 `/workflow/todo`
- **mock handler 的 `:taskId` 路径参数**：自定义 mock 框架（`foundation/mock/index.ts`）的 `:param` 匹配需确认是否支持。先阅读 `index.ts` 中的 `matchPattern` 实现——如不支持 `:param` 语法，改用查询参数或切换策略
- **menu children 的 `parentId`**：子节点的 `parentId: '3'` 必须与父节点的 `id: '3'` 一致，否则 `buildRoutesFromNodes` 无法正确构建父子关系
- **seeds.ts 中已有 `MOCK_MENU_TREE` 的导出和使用**：需确认 `MOCK_MENU_TREE` 是否被其他文件解构引用（如 `menu/index.spec.ts`）。菜单结构变更需要同步检查已有测试是否断言了 workflow 节点的 component 路径（`router/index.spec.ts` 中有相关断言）

## 12. 风险和回滚方案

- **风险**：`handlers.ts` 中 import 了新的 mock 种子但未在 seeds.ts 中导出 → `pnpm build` 或 `pnpm typecheck` 报错
  - **缓解**：先在 seeds.ts 中追加导出，再在 handlers.ts 中 import；完成后立即运行 `pnpm typecheck`
- **风险**：已有测试（如 `router/index.spec.ts`）断言了 workflow 节点的 `component: 'workflow/views/WorkflowHome'`，改为 DIRECTORY 后断言失败
  - **缓解**：运行 `pnpm test` 后检查失败项。如果有 router 相关测试失败，更新测试断言以匹配新的 DIRECTORY + children 结构；注意 `menu/index.spec.ts` 中的目录重定向测试
- **风险**：自定义 mock 框架的 pattern 匹配不支持 `:taskId` 参数占位符
  - **缓解**：先读 `foundation/mock/index.ts` 中 `dispatchMock` 的实现。如果不支持，改用固定前缀匹配 + handler 内部从 url 字符串手动解析 taskId
- **回滚**：`git checkout --` 恢复所有修改文件

## 13. 测试方案

### 13.1 静态检查

```bash
pnpm typecheck   # 退出码 0 — 确认新文件类型无错误
pnpm lint        # 退出码 0 — 确认 0 error（warning 可接受但须注明）
grep -r "axios" src/modules/workflow/   # 零命中 — 确认 API 层不直引 axios
```

### 13.2 单元测试

```bash
pnpm test   # 确认测试计数 = 基线 331 + 3（新增 api/index.spec.ts 3 个 it）= 334+ tests
```

新增 3 个测试用例：
1. `queryTodoTasks` 发送正确的 GET 请求
2. `completeTask` 发送正确的 POST 请求（taskId 在 URL 中）
3. `pageProcessDefs` 发送分页参数并正确 adapt `records→list`

### 13.3 集成测试

不适用（本 Step 仅基础设施，无页面组件）。

### 13.4 手工验证

```bash
pnpm dev:mock
```

1. 浏览器打开 → 登录
2. 侧边栏检查：「流程引擎」应展开为含「我的待办」「流程定义」两个子菜单
3. 点击「流程引擎」→ 应自动重定向到「我的待办」
4. 点击「流程定义」→ 应跳转到 `/workflow/defs`（页面尚未实现，预期 404 或空页）
5. 点击「我的待办」→ 应跳转到 `/workflow/todo`（页面尚未实现，预期 404 或空页）

> 注：步骤 3-5 的"404 或空页"是本 Step 预期行为 — TodoList.vue 和 ProcessDefList.vue 在 Step 2/3 才创建。

### 13.5 回归检查

- 已有 33 个 spec 文件计数不变
- 已有 331 个 tests 计数不变
- 已有菜单项（form、系统管理、通知等）路由行为不变

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| S1-1 | `src/contracts/bpm.ts` 已创建，含 `TodoTask` 和 `ProcessDef` 两个 interface | 回执 §4 文件清单 |
| S1-2 | `src/modules/workflow/api/index.ts` 已创建，含 3 个导出函数 | 回执 §4 |
| S1-3 | `src/modules/workflow/api/index.spec.ts` 已创建，≥ 3 个测试用例 | 回执 §7 test 计数 |
| S1-4 | `src/foundation/mock/seeds.ts` 已追加 `MOCK_TODO_TASKS`（5 条）和 `MOCK_PROCESS_DEFS`（5 条），workflow 菜单改为 DIRECTORY + 2 个 sub-MENU | 回执 §4 |
| S1-5 | `src/foundation/mock/handlers.ts` 已追加 3 个 mock handler（todo list、complete task、def page） | 回执 §4 |
| S1-6 | `pnpm typecheck` 退出码 0 | 回执 §7 |
| S1-7 | `pnpm lint` 退出码 0 | 回执 §7 |
| S1-8 | `pnpm test` 退出码 0，测试总数 ≥ 334（基线 331 + 新增 3） | 回执 §7 |
| S1-9 | `grep -r "axios" src/modules/workflow/` 零命中 | 回执 §7 |
| S1-10 | `pnpm dev:mock` 手工验证：侧边栏「流程引擎」为可展开目录，含「我的待办」「流程定义」两个子菜单 | 回执 §7 或手工验证截图 |

## 15. 执行回执格式

```markdown
# 执行回执

## 1. Step 编号和名称
Step 1：前端工作流基础设施

## 2. 使用模型
（实际使用的模型名称）

## 3. 实际读取的文件
（逐文件列出 §6 中的 6 个参考文件及任何额外读取的文件）

## 4. 实际修改的文件
（列出新建 3 + 修改 3 文件的完整路径，标注新建/修改）

## 5. 每个文件的修改摘要
- src/contracts/bpm.ts：新建，2 个 interface，N 行
- src/modules/workflow/api/index.ts：新建，3 个函数，N 行
- src/modules/workflow/api/index.spec.ts：新建，N 个测试用例，N 行
- src/foundation/mock/seeds.ts：追加 2 个 mock 种子 + 修改 1 个菜单节点
- src/foundation/mock/handlers.ts：追加 3 个 mock handler + 顶部 import
- src/modules/workflow/views/WorkflowHome.vue：BlankPage → 空 div

## 6. 实际执行的命令
（逐条列出完整命令和退出码）

## 7. 命令输出摘要
- pnpm typecheck：退出码、错误数
- pnpm lint：退出码、error/warning 数
- pnpm test：Test Files N passed, Tests N passed, 退出码
- grep -r "axios" src/modules/workflow/：命中数（预期 0）
- pnpm dev:mock 手工验证：侧边栏菜单截图/描述

## 8. 与原方案的偏差
（是否严格按方案执行，任何偏差说明原因）

## 9. 遇到的问题
（mock framework :param 支持情况、已有测试断言冲突等）

## 10. 未完成内容
（方案要求但未完成的内容及原因）

## 11. 风险和注意事项
（发现的潜在问题）

## 12. Git diff 摘要
改动文件数 N、新增行数 N、删除行数 N、关键变更点

## 13. 建议执行的测试
（如有特殊关注点，建议 Step 2/3 重点验证的场景）
```

## 16. 测试回执格式

本 Step 的测试与执行在同一代理完成（`pnpm test`）。仅在 `pnpm dev:mock` 手工验证需要单独操作时，可能需要分两次提交。如果在一份回执中完成，§7 中同时包含测试和手工验证结果即可。

## 17. 明确禁止事项

- ❌ 禁止修改 `src/adapters/bpmn/` 和 `src/adapters/flow-graph/`（保持 `throw Error('not implemented')`）
- ❌ 禁止创建 `TodoList.vue` 或 `ProcessDefList.vue`（那是 Step 2/3 的工作）
- ❌ 禁止修改 `src/foundation/request/index.ts` 或 `src/foundation/mock/index.ts`
- ❌ 禁止添加 workflow 静态路由到 `src/router/index.ts`
- ❌ 禁止直引 axios 或 Element Plus 在 `modules/workflow/` 中
- ❌ 禁止创建 Pinia store
- ❌ 禁止修改后端任何文件
- ❌ 禁止在 `contracts/bpm.ts` 中导入任何运行时模块（contracts 是纯类型层）
- ❌ 不要"顺手重构" seeds.ts 或 handlers.ts 的已有代码
