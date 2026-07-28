# Step F1：前端 — Types + API + Specs

## 1. 当前状态

- **功能**：bpm-task-center — BPM 待办中心增强
- **当前进度**：3/6 PASSED（B1 ✅ B2 ✅ B3 ✅），后端全部完成
- **此 Step 位置**：前端第一阶段，F1~F3 的第一步
- **前置条件**：B1/B2/B3 均已 PASSED，后端 5 个端点均已实现并测试通过
- **后端端点契约**：
  | # | Method | URL | Request | Response data | 变更 |
  |---|--------|-----|---------|---------------|------|
  | 1 | `GET` | `/workflow/tasks/todo` | `?pageNum=1&pageSize=10` | `PageResult<TodoTaskRespDTO>` | B1 改造：平铺数组 → 分页 |
  | 2 | `GET` | `/workflow/tasks/{taskId}` | Path: taskId | `TaskDetailRespDTO` | B1 新增 |
  | 3 | `POST` | `/workflow/tasks/{taskId}/complete` | Path: taskId, no body | `void` | 已有（B0） |
  | 4 | `POST` | `/workflow/tasks/{taskId}/reject` | Path: taskId, no body | `void` | B2 新增 |
  | 5 | `GET` | `/workflow/tasks/processed` | `?pageNum=1&pageSize=10` | `PageResult<ProcessedTaskRespDTO>` | B2 新增 |
- **当前前端状态**：
  - `contracts/bpm.ts`：仅有 `TodoTask`（5 字段，缺少 B1 新增的 `processName`）和 `ProcessDef`
  - `api/index.ts`：`queryTodoTasks()` 返回 `TodoTask[]`（未适配 B1 分页改造），`completeTask()` 不变，`pageProcessDefs()` 不变
  - `api/index.spec.ts`：3 条测试（queryTodoTasks / completeTask / pageProcessDefs）
  - `TodoList.vue`：使用旧 `queryTodoTasks()` → `TodoTask[]`，`pageSize=9999` 技巧
  - Mock handlers：`GET /api/workflow/tasks/todo` 返回平铺数组

## 2. Step 目标

根据后端 5 个端点的实际契约形状，更新前端 TypeScript 类型定义和 API 函数层，并通过 spec 测试验证每一个 API 函数的请求形状。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：纯类型定义 + API 函数封装 + spec 测试，均遵循已有代码模式（adaptPage / mockRequest），无架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

单文件类型扩展 + 已有模式的 API 函数封装 + 标准 Vitest mock 模式。不涉及跨文件架构决策、不涉及复杂并发、不涉及安全红线。已有 `adaptPage`、`mockRequest` 模式直接复用。F1 是前端三个 Step 中最机械的一步。

## 5. 已知上下文

### 5.1 后端 DTO → 前端 TS 类型映射

| 后端 Java 类型 | 前端 TS 类型 | 说明 |
|----------------|-------------|------|
| `String` | `string` | — |
| `Long` | `number` | Jackson 序列化为 JSON number |
| `LocalDateTime` | `string` | ISO-8601 格式（如 `"2026-07-17T10:30:00"`），不包含时区后缀 |
| `Map<String, Object>` | `Record<string, unknown>` | `processVariables` 字段 |
| `List<T>` | `T[]` | — |
| `R<T>` | — | `request()` 已自动解包 `R.data`，API 函数直接返回 `T` |
| `PageResult<T>` | 经 `adaptPage()` 转换 | 后端 `records` → 前端 `list` |

### 5.2 已有架构模式

- **类型文件**：`contracts/bpm.ts`（跨模块共享的 BPM 类型），`contracts/common.ts`（`PageQuery` / `PageResult`）
- **API 层**：`modules/workflow/api/index.ts`，所有函数通过 `@/foundation/request` 的 `request<T>()` 发请求
- **分页适配**：后端返回 `{ records, total, pageNum, pageSize }`，通过 `adaptPage()` 转为 `{ list, total, pageNum, pageSize }`
- **API Spec 模式**：`vi.mock('@/foundation/request', ...)` → 动态 `await import('./index')` → `mockRequest.mockResolvedValueOnce()` → 断言 `toHaveBeenCalledWith`
- **URL 路径**：全部 `/workflow/tasks/...`，baseURL `/api` 由 `foundation/request` 自动拼接

### 5.3 后端端点详细契约（来源：B1/B2/B3 已实现并验收通过的代码）

**端点 1：GET /workflow/tasks/todo**
- Query 参数：`pageNum`（long，默认 1），`pageSize`（long，默认 10）
- Response data：`PageResult<TodoTaskRespDTO>` — 后端返回 `records`（非 `list`）
- TodoTaskRespDTO 字段：`taskId`、`processInstanceId`、`processName`、`formKey`、`businessKey`、`createTime`（共 6 字段）
- 注意：后端不返回 `taskName`。待办列表的任务名称从 `processName` 派生

**端点 2：GET /workflow/tasks/{taskId}**
- Path 参数：`taskId`（String）
- Response data：`TaskDetailRespDTO`（非分页，单对象）
- 字段：`taskId`、`taskName`、`processInstanceId`、`processDefinitionKey`、`processName`、`formKey`、`businessKey`、`assignee`、`initiatorId`（Long → number）、`createTime`、`processVariables`（Map → Record）、`approvalHistory`（List）
- `processName` 可为 null（流程定义被删除时）
- `approvalHistory` 可为空列表

**端点 3：POST /workflow/tasks/{taskId}/complete**
- Path 参数：`taskId`（String），无 request body
- Response data：`void`（`R<Void>`，data=null）
- 已有端点，API 函数签名无需改动

**端点 4：POST /workflow/tasks/{taskId}/reject**
- Path 参数：`taskId`（String），无 request body
- Response data：`void`（`R<Void>`，data=null）
- 新端点

**端点 5：GET /workflow/tasks/processed**
- Query 参数：`pageNum`（long，默认 1），`pageSize`（long，默认 10）
- Response data：`PageResult<ProcessedTaskRespDTO>`
- ProcessedTaskRespDTO 字段：`taskId`、`taskName`、`processInstanceId`、`processName`、`formKey`、`businessKey`、`createTime`、`endTime`（共 8 字段）
- `endTime` 可为 null（历史数据极端情况）

## 6. 执行前必须读取的文件

按优先级排序：

1. `Smart-WorkFlow-Web/src/contracts/bpm.ts` — 现有 BPM 类型（需扩展）
2. `Smart-WorkFlow-Web/src/contracts/common.ts` — PageQuery / PageResult（已就绪，无需修改）
3. `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` — 现有 API 函数（需扩展）
4. `Smart-WorkFlow-Web/src/modules/workflow/api/index.spec.ts` — 现有 API 测试（需扩展）
5. `Smart-WorkFlow-Web/src/foundation/request/index.ts` — 了解 `request<T>()` 类型签名和 `ApiError` 类

## 7. 允许修改的文件范围

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `Smart-WorkFlow-Web/src/contracts/bpm.ts` | **修改** | 扩展 TodoTask + 新增 TaskDetail / ApprovalHistoryItem / ProcessedTask |
| 2 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` | **修改** | 修改 queryTodoTasks 为分页 + 新增 queryTaskDetail / rejectTask / queryProcessedTasks |
| 3 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.spec.ts` | **修改** | 更新现有 1 条测试 + 新增 4 条测试 |

**仅此 3 个文件。不新建任何文件。**

## 8. 禁止修改的范围

- ❌ 所有 `Smart-WorkFlow/` 下的后端代码
- ❌ `Smart-WorkFlow-Web/src/modules/workflow/views/` 下的 Vue 视图文件（F2 范围）
- ❌ `Smart-WorkFlow-Web/src/foundation/mock/` 下的 Mock 相关文件（F3 范围）
- ❌ `Smart-WorkFlow-Web/src/contracts/common.ts`（分页类型已就绪，无需改动）
- ❌ `Smart-WorkFlow-Web/src/foundation/request/`（请求层已就绪，无需改动）
- ❌ 任何其他前端模块

## 9. 详细执行方案

### 9.1 contracts/bpm.ts — 扩展类型定义

**9.1.1 扩展 `TodoTask` 接口**

在现有 `TodoTask` 接口中增加 `processName` 字段（B1 新增，来自 `BpmProcessDef.name`）：

```typescript
export interface TodoTask {
  taskId: string
  processInstanceId: string
  processName: string   // ← 新增：来自 BpmProcessDef.name，可为空字符串
  formKey: string
  businessKey: string
  createTime: string
}
```

**9.1.2 新增 `TaskDetail` 接口**

对齐后端 `TaskDetailRespDTO`（12 字段）：

```typescript
/** 任务详情 DTO（对齐后端 TaskDetailRespDTO） */
export interface TaskDetail {
  taskId: string
  taskName: string
  processInstanceId: string
  processDefinitionKey: string
  processName: string | null      // 流程定义被删除时为 null
  formKey: string
  businessKey: string
  assignee: string
  initiatorId: number             // 后端 Long → JSON number
  createTime: string              // LocalDateTime → ISO-8601 string
  processVariables: Record<string, unknown>  // Map<String, Object>
  approvalHistory: ApprovalHistoryItem[]
}
```

**9.1.3 新增 `ApprovalHistoryItem` 接口**

对齐后端 `ApprovalHistoryItemDTO`（5 字段）：

```typescript
/** 审批历史项 DTO（对齐后端 ApprovalHistoryItemDTO） */
export interface ApprovalHistoryItem {
  taskId: string
  taskName: string
  assignee: string
  createTime: string
  endTime: string | null          // 可能为 null
}
```

**9.1.4 新增 `ProcessedTask` 接口**

对齐后端 `ProcessedTaskRespDTO`（8 字段）：

```typescript
/** 已办任务 DTO（对齐后端 ProcessedTaskRespDTO） */
export interface ProcessedTask {
  taskId: string
  taskName: string
  processInstanceId: string
  processName: string | null      // 流程定义被删除时为 null
  formKey: string
  businessKey: string
  createTime: string
  endTime: string | null          // 极端历史数据可能为 null
}
```

**9.1.5 最终 contracts/bpm.ts 完整结构**

```
export interface TodoTask { ... }            // 修改：+processName
export interface TaskDetail { ... }          // 新增
export interface ApprovalHistoryItem { ... } // 新增
export interface ProcessedTask { ... }       // 新增
export interface ProcessDef { ... }          // 不变
```

### 9.2 api/index.ts — 修改和新增 API 函数

**9.2.1 更新 import**

新增类型导入：
```typescript
import type { TodoTask, TaskDetail, ProcessedTask, ProcessDef } from '@/contracts/bpm'
```

**9.2.2 修改 `queryTodoTasks` — 从平铺数组改为分页**

旧签名（删除）：
```typescript
export async function queryTodoTasks(): Promise<TodoTask[]> {
  return request<TodoTask[]>({ method: 'GET', url: '/workflow/tasks/todo' })
}
```

新签名（替换）：
```typescript
/** GET /workflow/tasks/todo?pageNum=&pageSize= → PageResult<TodoTask> */
export async function queryTodoTasks(page: PageQuery): Promise<PageResult<TodoTask>> {
  const raw = await request<BackendPageResult<TodoTask>>({
    method: 'GET',
    url: '/workflow/tasks/todo',
    params: page,
  })
  return adaptPage(raw)
}
```

参数改为必传 `PageQuery`（对齐 `pageProcessDefs` 模式），返回 `PageResult<TodoTask>`。

**9.2.3 新增 `queryTaskDetail`**

```typescript
/** GET /workflow/tasks/{taskId} → TaskDetail */
export async function queryTaskDetail(taskId: string): Promise<TaskDetail> {
  return request<TaskDetail>({
    method: 'GET',
    url: `/workflow/tasks/${taskId}`,
  })
}
```

**9.2.4 保留 `completeTask`（不变）**

现有签名和实现完全不变，仅确保 import 路径无变化。

**9.2.5 新增 `rejectTask`**

```typescript
/** POST /workflow/tasks/{taskId}/reject → void */
export async function rejectTask(taskId: string): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/workflow/tasks/${taskId}/reject`,
  })
}
```

**9.2.6 新增 `queryProcessedTasks`**

```typescript
/** GET /workflow/tasks/processed?pageNum=&pageSize= → PageResult<ProcessedTask> */
export async function queryProcessedTasks(page: PageQuery): Promise<PageResult<ProcessedTask>> {
  const raw = await request<BackendPageResult<ProcessedTask>>({
    method: 'GET',
    url: '/workflow/tasks/processed',
    params: page,
  })
  return adaptPage(raw)
}
```

**9.2.7 最终 API 函数清单**

| 函数 | 变更 | HTTP | 入参 | 返回 |
|------|:----:|------|------|------|
| `queryTodoTasks` | **修改** | `GET` | `page: PageQuery` | `PageResult<TodoTask>` |
| `queryTaskDetail` | **新增** | `GET` | `taskId: string` | `TaskDetail` |
| `completeTask` | 不变 | `POST` | `taskId: string` | `void` |
| `rejectTask` | **新增** | `POST` | `taskId: string` | `void` |
| `queryProcessedTasks` | **新增** | `GET` | `page: PageQuery` | `PageResult<ProcessedTask>` |
| `pageProcessDefs` | 不变 | `GET` | `page: PageQuery` | `PageResult<ProcessDef>` |

### 9.3 api/index.spec.ts — 更新和新增测试

**9.3.1 更新 queryTodoTasks 测试**

旧测试：「queryTodoTasks sends GET /workflow/tasks/todo」→ 替换为分页版本：

```typescript
it('queryTodoTasks sends GET /workflow/tasks/todo with pagination and adapts records→list', async () => {
  const mockRecords = [
    {
      taskId: 't1',
      processInstanceId: 'p1',
      processName: '单节点审批',
      formKey: 'leave-request',
      businessKey: 'fd_001',
      createTime: '2026-07-17T10:00:00',
    },
  ]
  mockRequest.mockResolvedValueOnce({
    records: mockRecords,
    total: 1,
    pageNum: 1,
    pageSize: 10,
  })
  const result = await workflowApi.queryTodoTasks({ pageNum: 1, pageSize: 10 })
  expect(mockRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: '/workflow/tasks/todo',
    params: { pageNum: 1, pageSize: 10 },
  })
  expect(result.list).toHaveLength(1)
  expect(result.list[0].processName).toBe('单节点审批')
  expect(result.total).toBe(1)
})
```

**9.3.2 新增 queryTaskDetail 测试**

```typescript
it('queryTaskDetail sends GET /workflow/tasks/{taskId}', async () => {
  const mockDetail = {
    taskId: 'task-001',
    taskName: '审批',
    processInstanceId: 'pi-001',
    processDefinitionKey: 'skeleton_approval',
    processName: '单节点审批',
    formKey: 'leave-request',
    businessKey: 'fd_001',
    assignee: '2',
    initiatorId: 1,
    createTime: '2026-07-17T10:00:00',
    processVariables: { formKey: 'leave-request', amount: 5000 },
    approvalHistory: [],
  }
  mockRequest.mockResolvedValueOnce(mockDetail)
  const result = await workflowApi.queryTaskDetail('task-001')
  expect(mockRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: '/workflow/tasks/task-001',
  })
  expect(result.taskId).toBe('task-001')
  expect(result.processVariables).toEqual({ formKey: 'leave-request', amount: 5000 })
})
```

**9.3.3 保留 completeTask 测试（不变）**

现有测试完全不变。

**9.3.4 新增 rejectTask 测试**

```typescript
it('rejectTask sends POST /workflow/tasks/{taskId}/reject', async () => {
  mockRequest.mockResolvedValueOnce(undefined)
  await workflowApi.rejectTask('task-001')
  expect(mockRequest).toHaveBeenCalledWith({
    method: 'POST',
    url: '/workflow/tasks/task-001/reject',
  })
})
```

**9.3.5 新增 queryProcessedTasks 测试**

```typescript
it('queryProcessedTasks sends GET /workflow/tasks/processed with pagination', async () => {
  const mockRecords = [
    {
      taskId: 't1',
      taskName: '审批',
      processInstanceId: 'pi-001',
      processName: '单节点审批',
      formKey: 'leave-request',
      businessKey: 'fd_001',
      createTime: '2026-07-16T10:00:00',
      endTime: '2026-07-16T11:00:00',
    },
  ]
  mockRequest.mockResolvedValueOnce({
    records: mockRecords,
    total: 1,
    pageNum: 1,
    pageSize: 10,
  })
  const result = await workflowApi.queryProcessedTasks({ pageNum: 1, pageSize: 10 })
  expect(mockRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: '/workflow/tasks/processed',
    params: { pageNum: 1, pageSize: 10 },
  })
  expect(result.list).toHaveLength(1)
  expect(result.list[0].endTime).toBe('2026-07-16T11:00:00')
  expect(result.total).toBe(1)
})
```

**9.3.6 最终 spec 测试清单**

| # | 测试名称 | 变更 | 验证点 |
|---|----------|:----:|--------|
| 1 | queryTodoTasks pagination + adaptPage | **更新** | GET 参数、records→list 适配、processName 存在 |
| 2 | queryTaskDetail GET /{taskId} | **新增** | URL 拼接、返回类型含 processVariables |
| 3 | completeTask POST /{taskId}/complete | 不变 | 已有测试保持 |
| 4 | rejectTask POST /{taskId}/reject | **新增** | URL 拼接、void 返回 |
| 5 | queryProcessedTasks pagination | **新增** | GET 参数、records→list 适配、endTime 存在 |
| 6 | pageProcessDefs pagination + adaptPage | 不变 | 已有测试保持 |
| **合计** | **6 条测试**（原 3 + 更新 1 + 新增 3） | | |

## 10. 关键实现约束

- **必须使用 `adaptPage()` 而非新建适配函数**：`api/index.ts` 中已有 `adaptPage<T>()`，`queryTodoTasks` 和 `queryProcessedTasks` 必须复用
- **必须保持 `BackendPageResult<T>` 局部接口**：不修改 `contracts/common.ts`，在 `api/index.ts` 内部保留 `BackendPageResult<T>` 私有接口
- **`TodoTask` 不新增 `taskName`**：后端 `TodoTaskRespDTO` 不含此字段，前端类型必须与后端一一对应，不可无中生有
- **`processName` 可为 null**：在 `TaskDetail` 和 `ProcessedTask` 中类型为 `string | null`（对应后端 `BpmProcessDef.name` 可能为 null）
- **`endTime` 可为 null**：在 `ProcessedTask` 和 `ApprovalHistoryItem` 中类型为 `string | null`
- **`initiatorId` 为 `number`**：后端 Java `Long` 类型，Jackson 序列化为 JSON number
- **不改变 `completeTask` 的签名和实现**：此端点未变化
- **不改变 `pageProcessDefs` 及其测试**：与本次功能无关
- **所有 API 函数必须通过 `request<T>()` 调用**，禁止直接 import axios
- **URL 路径不含 `/api` 前缀**：`baseURL` 已由 `foundation/request` 配置为 `/api`

## 11. 边界情况

| 场景 | 处理方式 |
|------|----------|
| `processName` 为 null（流程定义被删除） | `TaskDetail.processName` 和 `ProcessedTask.processName` 标注为 `string \| null` |
| `endTime` 为 null（极端历史数据） | `ProcessedTask.endTime` 和 `ApprovalHistoryItem.endTime` 标注为 `string \| null` |
| `approvalHistory` 为空数组 | `TaskDetail.approvalHistory` 类型为 `ApprovalHistoryItem[]`，空数组合法 |
| `processVariables` 为空对象 | `TaskDetail.processVariables` 类型为 `Record<string, unknown>`，空对象合法 |
| 分页参数 `pageNum=1, pageSize=10`（默认值） | API 函数直接透传 `PageQuery`，不做默认值处理（后端有默认值） |
| `request()` 因 `code !== 0` 抛 `ApiError` | 由 `foundation/request` 统一处理，API 函数不做额外 try/catch |
| TypeScript 编译报错（TodoList.vue 引用旧 `queryTodoTasks()` 签名） | **预期行为**。F1 改变 API 签名后，TodoList.vue 会出现类型错误，由 F2 修复。F1 的验收不要求 TodoList.vue 编译通过，仅要求 `contracts/bpm.ts` + `api/index.ts` + `api/index.spec.ts` 自身类型正确 |

## 12. 风险和回滚方案

| 风险 | 影响 | 缓解 |
|------|------|------|
| F1 修改 `queryTodoTasks` 签名后，TodoList.vue 编译报错 | TodoList.vue 无法通过 typecheck | **这是预期行为**，F2 会重写 TodoList.vue。F1 验收时不要求全工程 typecheck 通过 |
| `adaptPage` 函数假设后端始终返回 `records` 字段 | 若后端返回结构变化则运行时出错 | 后端 Java `PageResult` 类字段名为 `records`（已验证，B1 确认），不会变 |
| `TodoTask` 缺少 `taskName`，但 F2 TodoList 可能需要展示任务名 | F2 可能发现字段不足 | `TodoList` 可展示 `processName`（流程名）或 `taskId`。若确实需要 `taskName`，可在 F2 规划时评估是否需要后端补充字段 |
| 分页参数签名为必传 `PageQuery` | TodoList 调用方必须传参 | 对齐 `pageProcessDefs` 模式，F2 调用时传 `{ pageNum: pageNum.value, pageSize: pageSize.value }` |

**回滚方案**：`git checkout` 这 3 个文件即可恢复。改动范围极小（3 文件），无数据库/配置依赖。

## 13. 测试方案

### 13.1 静态检查

- `pnpm typecheck` — 仅检查 `contracts/bpm.ts`、`api/index.ts`、`api/index.spec.ts` 三个文件的类型正确性
  - 注意：全工程 typecheck 可能因 TodoList.vue 引用旧 `queryTodoTasks()` 签名而失败（预期行为，非阻塞）
- `grep -r "queryTodoTasks()" Smart-WorkFlow-Web/src/` — 确认除 TodoList.vue 外无其他无参调用
- `grep -r "completeTask\|rejectTask" Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` — 确认两个 mutation 函数签名不冲突
- 手动检查 `contracts/bpm.ts`：`TaskDetail` 含 12 字段、`ApprovalHistoryItem` 含 5 字段、`ProcessedTask` 含 8 字段、`TodoTask` 含 6 字段

### 13.2 单元测试

运行 `pnpm test src/modules/workflow/api/index.spec.ts`：

| # | 测试用例 | 预期结果 |
|---|----------|----------|
| 1 | `queryTodoTasks sends GET /workflow/tasks/todo with pagination and adapts records→list` | `mockRequest` 被以 `{ method:'GET', url:'/workflow/tasks/todo', params: {pageNum:1, pageSize:10} }` 调用；返回 `{ list, total, pageNum, pageSize }` 且 `list[0].processName` 存在 |
| 2 | `queryTaskDetail sends GET /workflow/tasks/{taskId}` | `mockRequest` 被以 `{ method:'GET', url:'/workflow/tasks/task-001' }` 调用；返回含 `processVariables` 字段的对象 |
| 3 | `completeTask sends POST /workflow/tasks/{taskId}/complete` | 不变，保持已有断言 |
| 4 | `rejectTask sends POST /workflow/tasks/{taskId}/reject` | `mockRequest` 被以 `{ method:'POST', url:'/workflow/tasks/task-001/reject' }` 调用 |
| 5 | `queryProcessedTasks sends GET /workflow/tasks/processed with pagination` | `mockRequest` 被以 `{ method:'GET', url:'/workflow/tasks/processed', params: {pageNum:1, pageSize:10} }` 调用；返回 `list[0].endTime` 存在 |
| 6 | `pageProcessDefs sends GET /workflow/defs and adapts records→list` | 不变，保持已有断言 |

**预期结果**：6/6 通过，0 失败。

### 13.3 集成测试

不适用。F1 仅涉及纯 TypeScript 类型和 API 函数封装，无跨模块/跨服务交互。集成测试在 F2（Vue 视图）和 F3（Mock 端到端）中覆盖。

### 13.4 手工验证

不适用。F1 不产出可见 UI。手工验证在 F2（页面）和 F3（Mock dev:mock 肉眼验收）中进行。

### 13.5 回归检查

- `pnpm test` 全量测试计数不应减少：基线 46 files / 392 tests → 预期 46 files / ≥395 tests（+3 新测试）
- 原有 API 测试（completeTask、pageProcessDefs）断言不变，不受影响
- `pnpm lint` 零新增告警
- `pnpm typecheck` 全工程（含 TodoList.vue 的预期类型错误除外 — 见 §11 边界情况）

## 14. 验收标准

| # | 条件 | 验证方式 |
|:--:|------|----------|
| F1-1 | `contracts/bpm.ts` 中 `TodoTask` 含 `processName: string` 字段 | grep `processName` in contracts/bpm.ts |
| F1-2 | `contracts/bpm.ts` 中 `TaskDetail` 接口含 12 字段（taskId / taskName / processInstanceId / processDefinitionKey / processName / formKey / businessKey / assignee / initiatorId / createTime / processVariables / approvalHistory） | 人工数字段 |
| F1-3 | `contracts/bpm.ts` 中 `ApprovalHistoryItem` 接口含 5 字段（taskId / taskName / assignee / createTime / endTime） | 人工数字段 |
| F1-4 | `contracts/bpm.ts` 中 `ProcessedTask` 接口含 8 字段（taskId / taskName / processInstanceId / processName / formKey / businessKey / createTime / endTime） | 人工数字段 |
| F1-5 | `api/index.ts` 中 `queryTodoTasks(page: PageQuery)` 签名改为接受 `PageQuery`、返回 `Promise<PageResult<TodoTask>>` | grep queryTodoTasks in api/index.ts |
| F1-6 | `api/index.ts` 中新增 `queryTaskDetail(taskId: string): Promise<TaskDetail>` 函数 | grep queryTaskDetail in api/index.ts |
| F1-7 | `api/index.ts` 中新增 `rejectTask(taskId: string): Promise<void>` 函数 | grep rejectTask in api/index.ts |
| F1-8 | `api/index.ts` 中新增 `queryProcessedTasks(page: PageQuery): Promise<PageResult<ProcessedTask>>` 函数 | grep queryProcessedTasks in api/index.ts |
| F1-9 | `api/index.ts` 中 `completeTask` 签名和实现不变 | diff 确认零变更 |
| F1-10 | `api/index.spec.ts` 中测试计数 ≥ 6（原 3 + 更新 1 + 新增 2 + 保留 2） | 数 `it(` 出现次数 |
| F1-11 | `pnpm test src/modules/workflow/api/index.spec.ts` 6/6 通过 | 测试命令输出 |
| F1-12 | `pnpm test` 全量测试文件数不减少（≥ 46 files），测试总数不减少（≥ 392 tests） | 全量测试命令输出 |
| F1-13 | `pnpm lint` 零新增告警（仅 `src/contracts/bpm.ts` + `src/modules/workflow/api/` 范围内） | lint 命令输出 |

## 15. 执行回执格式

按 system.md §7.1 返回，至少包含：

```markdown
# 执行回执 — Step F1 前端 Types + API + Specs

## 1. Step 编号和名称
## 2. 使用模型
## 3. 实际读取的文件（逐文件列出）
## 4. 实际修改的文件（逐文件列出，标注新建/修改）
## 5. 每个文件的修改摘要（改动点、改动行数、改动原因）
## 6. 实际执行的命令（逐条列出命令及参数）
## 7. 命令输出摘要（typecheck / lint / test / build 退出码和关键输出）
## 8. 与原方案的偏差（如有）
## 9. 遇到的问题（如有）
## 10. 未完成内容（如有）
## 11. 风险和注意事项
## 12. Git diff 摘要
## 13. 建议执行的测试
```

## 16. 测试回执格式

按 system.md §7.2 返回，至少包含：

```markdown
# 测试回执 — Step F1 前端 Types + API + Specs

## 1. Step 编号和名称
## 2. 测试环境（Node 版本、pnpm 版本、OS）
## 3. 测试前置条件
## 4. 实际执行的测试命令
## 5. 各测试项结果（逐条列出 §13.2 中的 6 条测试）
## 6. 通过项
## 7. 失败项
## 8. 跳过项及原因
## 9. 关键日志或错误信息
## 10. 是否满足验收标准（逐条对照 §14 的 13 条验收标准）
## 11. 回归风险
## 12. 最终结论（PASSED / FAILED / BLOCKED）
```

## 17. 明确禁止事项

- ❌ **禁止修改 `TodoList.vue`** — 这是 F2 的工作。即使它因为 `queryTodoTasks` 签名变更而编译报错，也不要碰它
- ❌ **禁止修改 `handlers.ts` / `seeds.ts`** — 这是 F3 的工作。Mock 层尚未适配分页，F3 会统一更新
- ❌ **禁止修改 `contracts/common.ts`** — `PageQuery` / `PageResult` 已满足需求，无需扩展
- ❌ **禁止新建任何文件** — 仅修改现有 3 个文件
- ❌ **禁止在 `TodoTask` 中增加 `taskName` 字段** — 后端 `TodoTaskRespDTO` 没有此字段，前端不可无中生有
- ❌ **禁止修改 `completeTask` 的签名或实现**
- ❌ **禁止修改 `pageProcessDefs` 及其测试**
- ❌ **禁止触碰任何后端文件**
- ❌ **禁止新建 `adaptPage` 的替代实现** — 必须复用已有的 `adaptPage` 函数
- ❌ **禁止在 API 函数中做业务逻辑处理**（如 try/catch、数据转换、默认值填充）— API 层只负责请求封装
