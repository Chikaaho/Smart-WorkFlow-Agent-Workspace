# Step 1：前端通知基础设施

## 1. 当前状态

M02-F01-01 通知模块前端落地，已通过 Step 0 测试基线验证（后端 111 tests + 前端 344 tests ✅）。

目前通知模块状态：
- `modules/notify/views/NotifyHome.vue` = `<BlankPage />`（占位）
- 无 `api/` 目录和 API 函数
- 无 TypeScript 类型合约
- 无 MSW mock handler
- `seeds.ts` 中菜单已注册（`menuType: 1`，`component: 'notify/views/NotifyHome'`），但 `MOCK_SESSION_DATA.permissions` 缺少 `notify:view`

后端 API 已就绪：
- `GET /notify/messages` → `R<List<NotifyMessage>>`（按 create_time DESC，不分页）
- `POST /notify/messages/{id}/read` → `R<Void>`（验证 recipientId）

## 2. Step 目标

建立通知模块前端基础设施：TypeScript 合约、API 层（含单测）、MSW mock handler 和种子数据，并追加 `notify:view` 权限使菜单在 mock 模式下可见。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯前端类型+API+Mock 建立，严格遵循 BPM 模块已有模式，无架构决策需求
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 为重复已有模式（contracts + API + seeds + handlers），BPM 模块完全相同的模式已在 Step 1（前端工作流基础设施）中验证过。无需 Pro。

## 5. 已知上下文

- **API 模式**：`request<T>({ method, url, params })` 封装自 `@/foundation/request`
- **已有 API 层参考**：`modules/workflow/api/index.ts`
  - `queryTodoTasks()`：`request<TodoTask[]>({ method: 'GET', url: '/workflow/tasks/todo' })`
  - `completeTask()`：`request<void>({ method: 'POST', url: '/workflow/tasks/${taskId}/complete' })`
- **单测模式**：`api/index.spec.ts` 用 `vi.mock('@/foundation/request')` 模拟 request
- **Mock 模式**：`handlers.ts` 的 `mockRegistrations` 数组添加 `{ method, pattern, handler }`
- **种子模式**：`seeds.ts` 中导出常量数组/对象，供 handlers 引用
- **后端 R 响应**：`{ code: number, msg: string, data: T }` — 前端 ApiResponse 为 `{ code, message, data }`，`msg` 和 `message` 的映射由 `request` 层处理
- **后端返回 NotifyMessage 字段**：`id`, `recipientId`, `title`, `content`, `bizType`, `bizId`, `read`, `createTime`, `updateTime`, `createBy`, `updateBy`, `tenantId`
- **后端数据按 `create_time DESC` 排序**

## 6. 执行前必须读取的文件

| # | 文件 | 原因 |
|---|------|------|
| 1 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` | 参考 API 层写法和 handler 签名 |
| 2 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.spec.ts` | 参考单测写法 |
| 3 | `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 参考 handler 注册模式+导入约定 |
| 4 | `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 参考种子数据模式+ MOCK_TODO_TASKS 写法 |
| 5 | `Smart-WorkFlow-Web/src/contracts/bpm.ts` | 参考 contract 文件写法 |
| 6 | `Smart-WorkFlow-Web/src/contracts/common.ts` | 确认 ApiResponse 类型定义 |
| 7 | `Smart-WorkFlow-Web/src/modules/notify/views/NotifyHome.vue` | 确认当前内容（未来将被替换） |

## 7. 允许修改的文件范围

### 新建文件（3 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow-Web/src/contracts/notify.ts` | 新建 |
| `Smart-WorkFlow-Web/src/modules/notify/api/index.ts` | 新建 |
| `Smart-WorkFlow-Web/src/modules/notify/api/index.spec.ts` | 新建 |

### 修改文件（2 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 追加 MOCK_NOTIFY_MESSAGES + 追加 `notify:view` 到 permissions |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 追加 2 个 handler |

## 8. 禁止修改的范围

- ❌ `adapters/bpmn/` 和 `adapters/flow-graph/` — 保持 `throw Error('not implemented')`
- ❌ `foundation/request/` 和 `foundation/mock/index.ts` — 不动核心基础设施
- ❌ `router/index.ts` 和 `router/guard.ts` — 路由由菜单驱动
- ❌ 所有后端 Java 文件 — 零后端改动
- ❌ 其他业务模块（form / system / workflow）— 不跨模块修改

## 9. 详细执行方案

### 9.1 创建 `src/contracts/notify.ts`

```typescript
// ─── 通知消息 DTO（对齐后端 NotifyMessage） ───
export interface NotifyMessage {
  id: number
  recipientId: number
  title: string
  content: string
  bizType: 'WF_TODO' | 'WF_APPROVED'
  bizId: string | null
  read: boolean
  createTime: string
  updateTime: string
  createBy: number | null
  updateBy: number | null
  tenantId: number
}
```

### 9.2 创建 `src/modules/notify/api/index.ts`

创建 API 层文件，导出两个函数：

```typescript
import { request } from '@/foundation/request'
import type { NotifyMessage } from '@/contracts/notify'

/** GET /notify/messages → NotifyMessage[] */
export async function queryNotifyMessages(): Promise<NotifyMessage[]> {
  return request<NotifyMessage[]>({
    method: 'GET',
    url: '/notify/messages',
  })
}

/** POST /notify/messages/{id}/read → void */
export async function markAsRead(id: number): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/notify/messages/${id}/read`,
  })
}
```

**关键约束：**
- 使用 `id`（number）而非 `taskId`（string）— 匹配后端 NotifyMessage.id（Long 类型，前端为 number）
- 函数名 `queryNotifyMessages`（复数）匹配后端返回数组的语义
- 函数名 `markAsRead`（驼峰）而非 `mark_as_read`

### 9.3 创建 `src/modules/notify/api/index.spec.ts`

三个测试用例：

1. **`queryNotifyMessages` 发送 GET 请求到正确 URL**
   - mock request 返回 `[{ id: 1, title: 'Test', content: '...', bizType: 'WF_TODO', bizId: null, read: false, createTime: '2026-07-15T10:00:00', ... }]`
   - 验证 `expect(mockRequest).toHaveBeenCalledWith({ method: 'GET', url: '/notify/messages' })`
   - 验证返回值类型和字段

2. **`markAsRead` 发送 POST 请求到正确 URL**
   - mock 传入 id=5
   - 验证 `expect(mockRequest).toHaveBeenCalledWith({ method: 'POST', url: '/notify/messages/5/read' })`

3. **API 错误传递（可选，如有余力）**
   - mock request reject 一个 ApiError
   - 验证错误被正确传递

**测试模式参考（从 workflow/api/index.spec.ts）：**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/foundation/request')
import { request } from '@/foundation/request'
const mockRequest = vi.mocked(request)

import { queryNotifyMessages, markAsRead } from './index'
import type { NotifyMessage } from '@/contracts/notify'

describe('notify api', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('queryNotifyMessages sends GET to /notify/messages', async () => {
    const mockData: NotifyMessage[] = [ { ... } ]
    mockRequest.mockResolvedValueOnce(mockData)
    const result = await queryNotifyMessages()
    expect(mockRequest).toHaveBeenCalledWith({ method: 'GET', url: '/notify/messages' })
    expect(result).toEqual(mockData)
  })

  it('markAsRead sends POST to /notify/messages/:id/read', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await markAsRead(5)
    expect(mockRequest).toHaveBeenCalledWith({ method: 'POST', url: '/notify/messages/5/read' })
  })
})
```

### 9.4 修改 `seeds.ts`

**A. 追加 MOCK_NOTIFY_MESSAGES 种子数据**

在文件末尾（`MOCK_PROCESS_DEFS` 之后）追加：

```typescript
// ─── 通知消息 Mock 种子 ──────────────────────────────
export const MOCK_NOTIFY_MESSAGES: Array<{
  id: number
  recipientId: number
  title: string
  content: string
  bizType: 'WF_TODO' | 'WF_APPROVED'
  bizId: string | null
  read: boolean
  createTime: string
  createBy: number | null
  updateTime: string
  updateBy: number | null
  tenantId: number
}> = [
  {
    id: 1,
    recipientId: 1,
    title: '新待办任务：请假申请审批',
    content: '张三提交了请假申请，等待您审批。请假日期：2026-07-10，共2天。',
    bizType: 'WF_TODO',
    bizId: 'mock-task-001',
    read: false,
    createTime: '2026-07-15T09:00:00',
    createBy: null,
    updateTime: '2026-07-15T09:00:00',
    updateBy: null,
    tenantId: 1,
  },
  // ... 共 8 条，mix of read/unread, WF_TODO/WF_APPROVED
]
```

**种子数据要求：**
- 至少 8 条记录
- 混合已读（read: true）和未读（read: false），约各半
- 混合 WF_TODO 和 WF_APPROVED 两种类型
- 创建时间从 2026-07-10 到 2026-07-15，有合理的时间跨度
- 内容有中文，模拟真实场景
- 条目标题不同，区分场景

**B. 在 `MOCK_SESSION_DATA.permissions` 中追加 `'notify:view'`**

修改权限数组从：
```typescript
permissions: ['system:view', 'form:view', 'form:form:view', 'workflow:view'],
```
为：
```typescript
permissions: ['system:view', 'form:view', 'form:form:view', 'workflow:view', 'notify:view'],
```

⚠️ 注意：这是**关键改动**——缺少 `notify:view` 会导致 mock 模式下通知菜单不可见（权限校验拦截路由构建）。

### 9.5 修改 `handlers.ts`

在 `mockRegistrations` 数组中追加 2 个 handler：

**A. GET /notify/messages**

```typescript
{
  method: 'GET',
  pattern: '/notify/messages',
  handler: (params, query, body) => ({
    code: 0,
    msg: 'success',
    data: MOCK_NOTIFY_MESSAGES,
  }),
}
```

**关键约束：** 返回 `{ code, msg, data }` 而非 `{ code, message, data }` — 后端 R 类使用 `msg` 字段名，`request` 层会自动处理此映射。

**B. POST /notify/messages/:id/read**

```typescript
{
  method: 'POST',
  pattern: '/notify/messages/:id/read',
  handler: (params, query, body) => {
    // 找到对应通知并标记为已读
    const msg = MOCK_NOTIFY_MESSAGES.find(m => m.id === Number(params.id))
    if (msg) {
      msg.read = true
    }
    return { code: 0, msg: 'success' }
  },
}
```

**关键约束：** 使用 `Number(params.id)` 转换，因为 params 来自 URL 路径参数（字符串），而 id 在种子数据中是 number 类型。`msg.read = true` 修改**内存中的种子数据**，后续 GET 查询会反映状态变化。

**导出追加：** 在 `handlers.ts` 的 import 语句中添加 `MOCK_NOTIFY_MESSAGES`。

## 10. 关键实现约束

- **勿用错误的响应形状**：后端 `GET /notify/messages` 返回 `R<List<NotifyMessage>>`（data 是数组），非 `PageResult`。mock handler 直接返回 `{ code: 0, msg: 'success', data: [...] }`
- **markAsRead 使用 id（number）**，非字符串。后端 `{id}` 为 Long 类型，对应 TypeScript `number`
- **POST handler 修改种子数据**：`msg.read = true` 应在原对象上修改（非深拷贝），以确保后续 GET 反映最新状态
- **msg 字段名**：后端 R 的字段是 `msg` 不是 `message`，mock handler 必须返回 `msg`（`request` 层处理映射）
- **路径参数**: POST handler 的 pattern 为 `/notify/messages/:id/read`，params.id 为字符串，需 Number() 转换

## 11. 边界情况

- **空列表**：GET handler 在没有种子数据时返回空数组 `[]`，不应崩溃
- **不存在的 ID**：POST handler 在 params.id 无对应记录时应返回正常 success（不做错误模拟），因为后端真正的行为是标记不存在 ID 时抛异常
- **重复标记已读**：多次 POST 同一 ID 应幂等不报错
- **URL 优先匹配**：handler pattern `/notify/messages/:id/read` 不应被更宽泛的 pattern 优先拦截

## 12. 风险和回滚方案

| 风险 | 影响 | 应对 |
|------|------|------|
| handler pattern URL 不匹配 | handler 不触发 | 验证 mock 模式下请求可达；回滚：移除新增的 mockRegistrations 条目 |
| `msg` vs `message` 混淆 | 前端解析错误 | 已在约束中钉死，回执要求确认 |
| `notify:view` 漏加 | 菜单不可见 | 回执中要求 grep 确认 `notify:view` 出现在 permissions |
| TypeScript 类型错（如 read 字段为 boolean 但后端返回 0/1） | 类型检查不通过 | contract 中定义为 boolean，后端 Jackson 自动转换 |
| 测试三连不通过 | 阻塞后续 Step | 按错误修复后重试 |

回滚操作：删除新建的 3 个文件，撤销 seeds.ts 和 handlers.ts 的改动（从 git 恢复或手动移除新增内容）。

## 13. 测试方案

### 13.1 静态检查

- **grep `msg` vs `message`**：mock handler 的返回中必须使用 `msg` 字段名（不是 `message`）
- **grep `notify:view`**：确认 `seeds.ts` 的 `MOCK_SESSION_DATA.permissions` 数组包含 `notify:view`
- **grep `read` 类型**：确认 NotifyMessage 接口中 `read: boolean`（非 `number`/`string`）
- **编译通过**：`pnpm typecheck` 零错误

### 13.2 单元测试

新增 `src/modules/notify/api/index.spec.ts`，包含：
- `queryNotifyMessages` 发送 GET /notify/messages ✅
- `markAsRead(5)` 发送 POST /notify/messages/5/read ✅

### 13.3 集成测试

不适用。Mock handler 不涉及跨模块交互。

### 13.4 手工验证

在 `pnpm dev:mock` 下验证：
- 浏览器打开 /notify（通过菜单导航），确认页面不再是 BlankPage
- 确认菜单左侧「通知」图标 (Bell) 可见
- （页面内容验证在 Step 2 中完成）

### 13.5 回归检查

执行 `pnpm typecheck && pnpm lint && pnpm test`，确认：
- 测试计数不低于基线（344，新增 3 个 → ≥ 347）
- 已有测试无新增失败或错误

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| S1-1 | `src/contracts/notify.ts` 存在，导出 `NotifyMessage` 接口 | 文件存在 |
| S1-2 | `NotifyMessage` 包含所有必填字段（id, title, content, bizType, read, createTime 等）| 代码审查 |
| S1-3 | `src/modules/notify/api/index.ts` 存在，导出 `queryNotifyMessages` 和 `markAsRead` | 文件存在 |
| S1-4 | `src/modules/notify/api/index.spec.ts` 存在，至少 2 个测试用例 | 文件存在 |
| S1-5 | API 单测全部通过（≥2 tests） | `pnpm test` 输出 |
| S1-6 | `MOCK_SESSION_DATA.permissions` 包含 `'notify:view'` | grep 确认 |
| S1-7 | `seeds.ts` 导出 `MOCK_NOTIFY_MESSAGES`（≥8 条混合类型）| 文件审查 |
| S1-8 | `handlers.ts` 的 `mockRegistrations` 包含 GET /notify/messages | grep 确认 |
| S1-9 | `handlers.ts` 的 `mockRegistrations` 包含 POST /notify/messages/:id/read | grep 确认 |
| S1-10 | `pnpm typecheck` 通过，零 TS 错误 | 命令输出 |
| S1-11 | `pnpm lint` 通过，零新增 ESLint 错误 | 命令输出 |
| S1-12 | `pnpm test` 通过，全部测试通过，计数 ≥ 347 | 命令输出 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step 1

## 实际读取的文件
（逐文件列出）

## 实际修改的文件
（新建/修改区分，附 diff 摘要）

## 各文件改动摘要
（每个文件的改动点、行数、原因）

## 实际执行的命令
（逐条含完整参数和输出）

## 新建文件内容摘要
- contracts/notify.ts: XX 行，XX 接口
- notify/api/index.ts: XX 行，XX 函数
- notify/api/index.spec.ts: XX 行，XX 用例

## 静态检查结果
- grep "notify:view" in seeds.ts → ✅
- grep "msg" in handler return → ✅（不是 message）
- grep "read: boolean" in contracts/notify.ts → ✅

## 四连结果
- typecheck: ✅
- lint: ✅
- test: ✅ / XX passed / XX tests
（粘贴关键输出）


## 偏差说明
（如有与原方案不一致之处，逐条列出原因）

## 遇到的问题
（技术问题、理解偏差等）

## 结论
PASSED / FAILED
```

## 16. 测试回执格式

测试回执可与执行回执合并。验收时重点关注：
- 测试三连输出（typecheck / lint / test）
- grep 确认 `notify:view` 在 seeds.ts 中
- grep 确认 mock handler 使用 `msg` 字段名

## 17. 明确禁止事项

- ❌ 不新建 NotifyList.vue（已在 Step 2 中处理）
- ❌ 不修改 `NotifyHome.vue` 内容（已在 Step 2 中处理）
- ❌ 不修改后端代码
- ❌ 不修改 `foundation/request` / `foundation/mock` / `router` 等基础设施
- ❌ 不修改 `TodoList.vue` / `ProcessDefList.vue` 等其他模块文件
- ❌ 不引入第三方依赖
- ❌ 不修改 package.json 或 pnpm-lock
- ❌ 不添加 routes.ts 或 index.ts 到 notify 模块（路由由菜单驱动）
