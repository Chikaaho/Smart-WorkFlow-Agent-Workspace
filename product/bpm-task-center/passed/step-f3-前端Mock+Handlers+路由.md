# Step F3：前端 — Mock + Handlers + 路由

## 1. 当前状态

- **功能**：bpm-task-center — BPM 待办中心增强
- **当前进度**：5/6 PASSED（B1 ✅ B2 ✅ B3 ✅ F1 ✅ F2 ✅），只差最后一步
- **此 Step 位置**：前端最后一步，F1→F2→F3 的收尾
- **前置条件**：
  - F1 PASSED：类型 + API 函数就绪（contracts/bpm.ts + api/index.ts + spec）
  - F2 PASSED：Vue 视图就绪（TodoList + TaskDetail + ProcessedList + spec）
  - 测试基线：48 files / 417 tests 全绿
- **现状**：
  - Mock handler `GET /api/workflow/tasks/todo` 返回平铺数组（未适配 F2 分页）
  - 缺少 3 个 mock handler：detail / reject / processed
  - `MOCK_TODO_TASKS` 缺少 F1 新增的 `processName` 字段
  - 缺少 `MOCK_PROCESSED_TASKS` 已办种子数据
  - 无 TaskDetail / ProcessedList 前端路由

## 2. Step 目标

补齐 mock handler（适配分页 + 新增 detail/reject/processed）+ 补齐种子数据（processName + 已办数据）+ 注册前端路由，使 `pnpm dev:mock` 下完整闭环可用（待办分页列表 → 点击行→详情页 → 通过/驳回 → 已办列表）。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：mock 数据 + handler 逻辑 + 路由注册，纯机械工作，遵循已有 handler/seeds 模式和 form 静态路由模式，无架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

F3 是 bpm-task-center 的最后一步，也是最机械的一步。mock handler 照搬已有分页 handler 模式（`/api/form/data/:formKey/query`、`/api/workflow/defs`）；路由注册照搬已有 form 参数化路由模式（`form-render/:formKey`、`form-data/:formKey`）；种子数据照搬 MOCK_PROCESS_DEFS 结构。无跨项目/跨模块决策。

## 5. 已知上下文

### 5.1 Mock 系统架构

```
foundation/mock/
├── index.ts          — MSW registry，扫描 mockRegistrations 注册 handler
├── handlers.ts       — 导出 mockRegistrations: MockRegistration[]，所有 handler 定义
└── seeds.ts          — 共享种子常量（MOCK_TODO_TASKS / MOCK_PROCESS_DEFS / ...）
```

Handler 签名：`(params: Record<string,string>, query: Record<string,string>, body: unknown) => { code, message, data }`

### 5.2 当前 Workflow Mock Handler（3 个）

```typescript
// 1. GET /api/workflow/tasks/todo — 返回平铺数组（需改为分页）
{ method:'GET', pattern:'/api/workflow/tasks/todo', handler: () => ({ code:0, message:'ok', data: MOCK_TODO_TASKS }) }

// 2. POST /api/workflow/tasks/:taskId/complete — 从数组 splice（不变逻辑，需适配新字段）
{ method:'POST', pattern:'/api/workflow/tasks/:taskId/complete', handler: (params) => { ... } }

// 3. GET /api/workflow/defs — 已分页（无需改动）
{ method:'GET', pattern:'/api/workflow/defs', handler: ... }
```

### 5.3 需新增的 Handler（3 个）

| # | Method | Pattern | Response data | 说明 |
|---|--------|---------|---------------|------|
| 1 | `GET` | `/api/workflow/tasks/todo` | `{ records, total, pageNum, pageSize }` | **改造**：平铺数组 → 分页 |
| 2 | `GET` | `/api/workflow/tasks/:taskId` | `TaskDetail` 对象 | **新增** |
| 3 | `POST` | `/api/workflow/tasks/:taskId/reject` | `null` | **新增**（splice + 可选入已办列表） |
| 4 | `GET` | `/api/workflow/tasks/processed` | `{ records, total, pageNum, pageSize }` | **新增** |

### 5.4 种子数据需要更新

**MOCK_TODO_TASKS** 当前缺少 `processName`，需为每个条目补充：

```typescript
// 当前（5 字段，缺 processName）
{ taskId, processInstanceId, formKey, businessKey, createTime }

// → 更新为（6 字段）
{ taskId, processInstanceId, processName, formKey, businessKey, createTime }
```

**新增 MOCK_PROCESSED_TASKS**（8 字段，至少 3 条）：

```typescript
{ taskId, taskName, processInstanceId, processName, formKey, businessKey, createTime, endTime }
```

### 5.5 路由注册方式

前端路由有两类来源：
1. **静态路由**（`router/index.ts`）：根布局子路由，含参数化路径（`form-designer/:id?`、`form-render/:formKey`）
2. **动态路由**（`router/guard.ts` → `buildRoutesFromMenu()` 从菜单树生成）：非参数化的业务页面

**F3 路由策略**：
- `TaskDetail`（`workflow/task/:taskId`）→ 参数化 → **静态路由**（照搬 `form-render/:formKey` 模式）
- `ProcessedList`（`workflow/processed`）→ 非参数化 → **菜单树 + 静态路由双注册**（菜单提供侧边栏入口，静态路由确保障健壮）
- `TodoList` — 已有菜单项 `workflow/todo`，无需改路由

### 5.6 菜单树需更新

在 `MOCK_MENU_TREE` 中 workflow 目录下新增 ProcessedList 子菜单：

```typescript
{
  id: '32',
  parentId: '3',
  name: 'processed-list',
  title: '已办任务',
  path: 'workflow/processed',
  component: 'workflow/views/ProcessedList',
  icon: 'Checked',
  sort: 3,
  menuType: 1,
  permission: 'workflow:view',
  hidden: false,
}
```

### 5.7 已有分页 Handler 参考模式

```typescript
// 参考：GET /api/workflow/defs — 分页 handler（照搬此模式改造 todo 和 processed）
{
  method: 'GET',
  pattern: '/api/workflow/defs',
  handler: (_params, query) => {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 10)
    const total = MOCK_PROCESS_DEFS.length
    const start = (pageNum - 1) * pageSize
    const records = MOCK_PROCESS_DEFS.slice(start, start + pageSize)
    return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
  },
}
```

## 6. 执行前必须读取的文件

1. `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` — 当前 workflow handler 定义
2. `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` — 当前 MOCK_TODO_TASKS / MOCK_MENU_TREE 结构
3. `Smart-WorkFlow-Web/src/router/index.ts` — 静态路由定义 + 参数化路由模式
4. `Smart-WorkFlow-Web/src/contracts/bpm.ts` — TodoTask / TaskDetail / ProcessedTask 字段清单
5. `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` — 确认 queryTodoTasks 分页调用
6. `Smart-WorkFlow-Web/src/modules/workflow/views/TaskDetail.vue` — 确认 queryTaskDetail 调用
7. `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessedList.vue` — 确认 queryProcessedTasks 调用

## 7. 允许修改的文件范围

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | **修改** | 改造 1 个 handler + 新增 3 个 handler |
| 2 | `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | **修改** | 更新 MOCK_TODO_TASKS + 新增 MOCK_PROCESSED_TASKS + 更新菜单树 |
| 3 | `Smart-WorkFlow-Web/src/router/index.ts` | **修改** | 新增 TaskDetail + ProcessedList 静态路由 |

**仅此 3 个文件。不新建任何文件。**

## 8. 禁止修改的范围

- ❌ 所有 `Smart-WorkFlow/` 下的后端代码
- ❌ `Smart-WorkFlow-Web/src/contracts/` 下的类型文件（F1 已完成）
- ❌ `Smart-WorkFlow-Web/src/modules/workflow/api/` 下的 API 文件（F1 已完成）
- ❌ `Smart-WorkFlow-Web/src/modules/workflow/views/` 下的 Vue 视图（F2 已完成）
- ❌ `Smart-WorkFlow-Web/src/foundation/request/`（请求层）
- ❌ `Smart-WorkFlow-Web/src/router/guard.ts`（路由守卫）
- ❌ 任何其他模块的 mock handler/seeds

## 9. 详细执行方案

### 9.1 handlers.ts — 改造和新增 Handler

#### 9.1.1 import 新增种子常量

修改现有 import 语句，新增 `MOCK_PROCESSED_TASKS`：

```typescript
import {
  MOCK_DICT_DATA, MOCK_DICT_TYPES, MOCK_SESSION_DATA, MOCK_MENU_TREE,
  DEMO_FORM_KEY, MOCK_DEMO_FORM_DEFINITION, MOCK_DEMO_SUBMISSIONS,
  MOCK_FORM_DATA_RECORDS, MOCK_GENERIC_FORM_RECORDS, MOCK_FORM_DEF_STORE,
  MOCK_TODO_TASKS, MOCK_PROCESSED_TASKS,  // ← 新增
  MOCK_PROCESS_DEFS, MOCK_NOTIFY_MESSAGES,
  MOCK_USERS_LIST, MOCK_ROLES_LIST, MOCK_DEPTS_LIST, MOCK_POSTS_LIST,
} from './seeds'
```

#### 9.1.2 改造：GET /api/workflow/tasks/todo — 平铺数组 → 分页

**删除**旧 handler（返回 `MOCK_TODO_TASKS` 平铺数组），**替换**为分页版本：

```typescript
// ── 待办任务：当前用户待办分页列表 ──────────────────────
{
  method: 'GET',
  pattern: '/api/workflow/tasks/todo',
  handler: (_params, query) => {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 10)
    const total = MOCK_TODO_TASKS.length
    const start = (pageNum - 1) * pageSize
    const records = MOCK_TODO_TASKS.slice(start, start + pageSize)
    return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
  },
},
```

#### 9.1.3 保留 + 微调：POST /api/workflow/tasks/:taskId/complete

现有逻辑不变（splice 从 MOCK_TODO_TASKS 移除）。可选增强：将完成任务移入 MOCK_PROCESSED_TASKS。先保持最小变更——仅 splice 移除。

#### 9.1.4 新增：GET /api/workflow/tasks/:taskId — 任务详情

```typescript
// ── 待办任务：查询任务详情 ───────────────────────────
{
  method: 'GET',
  pattern: '/api/workflow/tasks/:taskId',
  handler: (params) => {
    const { taskId } = params as Record<string, string>
    const task = MOCK_TODO_TASKS.find((t) => t.taskId === taskId)
    if (!task) {
      return { code: 404, message: '任务不存在', data: null }
    }
    return {
      code: 0,
      message: 'ok',
      data: {
        taskId: task.taskId,
        taskName: task.processName + '审批',  // mock: 从 processName 派生
        processInstanceId: task.processInstanceId,
        processDefinitionKey: 'skeleton_approval',
        processName: task.processName,
        formKey: task.formKey,
        businessKey: task.businessKey,
        assignee: '2',                        // mock: 固定审批人
        initiatorId: 1,
        createTime: task.createTime,
        processVariables: { formKey: task.formKey },
        approvalHistory: [],
      },
    }
  },
},
```

#### 9.1.5 新增：POST /api/workflow/tasks/:taskId/reject — 驳回

```typescript
// ── 待办任务：驳回 ──────────────────────────────────
{
  method: 'POST',
  pattern: '/api/workflow/tasks/:taskId/reject',
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
```

#### 9.1.6 新增：GET /api/workflow/tasks/processed — 已办分页列表

```typescript
// ── 已办任务：当前用户已办分页列表 ────────────────────
{
  method: 'GET',
  pattern: '/api/workflow/tasks/processed',
  handler: (_params, query) => {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 10)
    const total = MOCK_PROCESSED_TASKS.length
    const start = (pageNum - 1) * pageSize
    const records = MOCK_PROCESSED_TASKS.slice(start, start + pageSize)
    return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
  },
},
```

### 9.2 seeds.ts — 更新种子数据

#### 9.2.1 更新 MOCK_TODO_TASKS — 每项新增 `processName`

为每条记录添加 `processName` 字段（放在 `processInstanceId` 之后）：

```typescript
export const MOCK_TODO_TASKS: Array<{
  taskId: string
  processInstanceId: string
  processName: string          // ← 新增字段
  formKey: string
  businessKey: string
  createTime: string
}> = [
  {
    taskId: 'mock-task-001',
    processInstanceId: 'mock-proc-001',
    processName: '请假审批流程',     // ← 新增
    formKey: 'leave-request',
    businessKey: 'fd_001',
    createTime: '2026-07-10T09:15:00',
  },
  {
    taskId: 'mock-task-002',
    processInstanceId: 'mock-proc-002',
    processName: '采购审批流程',     // ← 新增
    formKey: 'purchase-order',
    businessKey: 'fd_003',
    createTime: '2026-07-11T14:30:00',
  },
  {
    taskId: 'mock-task-003',
    processInstanceId: 'mock-proc-003',
    processName: '合同审批流程',     // ← 新增
    formKey: 'contract-approval',
    businessKey: 'fd_005',
    createTime: '2026-07-12T10:00:00',
  },
  {
    taskId: 'mock-task-004',
    processInstanceId: 'mock-proc-004',
    processName: '费用报销流程',     // ← 新增
    formKey: 'expense-report',
    businessKey: 'gen_001',
    createTime: '2026-07-13T08:45:00',
  },
  {
    taskId: 'mock-task-005',
    processInstanceId: 'mock-proc-005',
    processName: '请假审批流程',     // ← 新增
    formKey: 'leave-request',
    businessKey: 'gen_002',
    createTime: '2026-07-14T11:20:00',
  },
]
```

#### 9.2.2 新增 MOCK_PROCESSED_TASKS

在 MOCK_PROCESS_DEFS 之后新增：

```typescript
// ─── 已办任务 Mock 种子 ──────────────────────────────
export const MOCK_PROCESSED_TASKS: Array<{
  taskId: string
  taskName: string
  processInstanceId: string
  processName: string | null
  formKey: string
  businessKey: string
  createTime: string
  endTime: string | null
}> = [
  {
    taskId: 'processed-001',
    taskName: '请假审批',
    processInstanceId: 'proc-001',
    processName: '请假审批流程',
    formKey: 'leave-request',
    businessKey: 'fd_010',
    createTime: '2026-07-10T08:00:00',
    endTime: '2026-07-10T15:30:00',
  },
  {
    taskId: 'processed-002',
    taskName: '报销审批',
    processInstanceId: 'proc-002',
    processName: '费用报销流程',
    formKey: 'expense-report',
    businessKey: 'fd_011',
    createTime: '2026-07-12T09:00:00',
    endTime: '2026-07-12T17:00:00',
  },
  {
    taskId: 'processed-003',
    taskName: '合同审批',
    processInstanceId: 'proc-003',
    processName: null,                       // null 安全测试
    formKey: 'contract-approval',
    businessKey: 'fd_012',
    createTime: '2026-07-14T10:00:00',
    endTime: null,                           // null 安全测试
  },
]
```

#### 9.2.3 更新 MOCK_MENU_TREE — 新增 ProcessedList 子菜单

在 workflow 目录（id: '3'）的 children 数组中，`process-def-list` 之后追加：

```typescript
{
  id: '32',
  parentId: '3',
  name: 'processed-list',
  title: '已办任务',
  path: 'workflow/processed',
  component: 'workflow/views/ProcessedList',
  icon: 'Checked',
  sort: 3,
  menuType: 1,
  permission: 'workflow:view',
  hidden: false,
},
```

注意：`sort: 2` 的 process-def-list 需调整为 `sort: 2` 不变，新条目 `sort: 3`。

### 9.3 router/index.ts — 新增静态路由

在根布局（`'/'` → `ROOT_LAYOUT_NAME`）的 children 数组中，参照已有参数化路由模式，新增：

```typescript
{
  path: 'workflow/task/:taskId',
  name: 'TaskDetail',
  component: () => import('@/modules/workflow/views/TaskDetail.vue'),
  meta: { title: '任务详情' },
},
{
  path: 'workflow/processed',
  name: 'ProcessedList',
  component: () => import('@/modules/workflow/views/ProcessedList.vue'),
  meta: { title: '已办任务' },
},
```

**注意**：
- `TaskDetail` 使用参数化路径 `:taskId`（与 F2 views 中的 `route.params.taskId` 一致）
- `ProcessedList` 无参数
- 两个路由的 `name` 必须与 F2 视图中的 `router.push({ name: '...' })` 一致

### 9.4 变更汇总

| 文件 | 操作 | 变更量 |
|------|:----:|--------|
| `handlers.ts` | 修改 | 改造 1 handler + 新增 3 handler，~50 行 |
| `seeds.ts` | 修改 | MOCK_TODO_TASKS +5 processName + 新增 MOCK_PROCESSED_TASKS ~35 行 + 菜单树 +1 子菜单 ~10 行 |
| `router/index.ts` | 修改 | +2 静态路由 ~12 行 |

## 10. 关键实现约束

- **Mock handler 分页响应形状必须为 `{ records, total, pageNum, pageSize }`**（对齐后端 BackendPageResult，前端 API 层 `adaptPage` 将其转为 `list`）
- **Mock handler 的 pattern 不含 `/api` 前缀的 query 部分**：只匹配路径，query 参数在 handler 第二个参数中获取
- **`handleTodoPagination` 模式必须照搬 `GET /api/workflow/defs` 的分页逻辑**：`Number(query.pageNum ?? 1)` → slice → `{ records, total, pageNum, pageSize }`
- **不修改 `router/guard.ts`**：动态路由构建逻辑不变，静态路由直接注册在 root children
- **路由 name 必须与 F2 视图中 `router.push({ name: ... })` 精确匹配**：`'TaskDetail'` / `'ProcessedList'` / `'TodoList'`（TodoList 已有菜单路由，无需新增）
- **不修改任何 Vue 视图文件**（F2 已完成）
- **不修改 API 层和类型层**（F1 已完成）
- **MOCK_TODO_TASKS 的 `processName` 值使用真实流程名**（如「请假审批流程」），确保 dev:mock 下肉眼验收时列显示正常

## 11. 边界情况

| 场景 | 处理方式 |
|------|----------|
| `query.pageNum` / `query.pageSize` 为 undefined | `?? 1` / `?? 10` 兜底 |
| `taskId` 在 MOCK_TODO_TASKS 中不存在（detail/reject） | 返回 `{ code: 404, message: '任务不存在', data: null }` |
| MOCK_PROCESSED_TASKS 为空数组 | 分页 handler 返回 `{ records: [], total: 0, pageNum, pageSize }` |
| `processName` 为 null（种子第 3 条） | 前端 `?? '-'` 渲染，mock 透传 |
| `endTime` 为 null（种子第 3 条） | 前端 `?? '-'` 渲染，mock 透传 |
| `approvalHistory` 为空数组（mock detail） | 前端显示「暂无审批历史」 |
| 菜单树动态路由与静态路由同名 | Vue Router 按注册顺序，后注册覆盖前者。静态路由在 `createRouter` 时注册，动态路由由 `addRoute` 追加。同名路由会触发警告。F3 静态路由 `name` 不与菜单树节点 name 冲突 |
| `completeTask` handler splice 后数组变短 | 不影响下次分页（total 实时计算 `MOCK_TODO_TASKS.length`） |

## 12. 风险和回滚方案

| 风险 | 影响 | 缓解 |
|------|------|------|
| 静态路由与菜单动态路由重复注册 | 浏览器 console 出现 Vue Router 重复路由警告 | 菜单树不新增 TaskDetail 节点，ProcessedList 也加静态路由兜底。如出现警告，调整 MOCK_MENU_TREE |
| MOCK_TODO_TASKS 新增 `processName` 字段后，部分旧引用可能不兼容 | 类型检查报错 | F1 已更新 `TodoTask` 类型含 `processName`，无兼容问题 |
| `pnpm dev:mock` 肉眼验收时路由跳转失败 | 用户点击行无反应或白屏 | 确认路由 name 与 F2 `router.push` 参数一致，确认 component 懒加载路径正确 |

**回滚方案**：`git checkout` 这 3 个文件即可恢复。无数据库/配置依赖。

## 13. 测试方案

### 13.1 静态检查

- `grep "processName" Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` — MOCK_TODO_TASKS 每条记录含 `processName`（≥ 5 处）
- `grep "MOCK_PROCESSED_TASKS" Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` — 新增已办种子（≥ 2 处：export + 至少 1 条记录含 null processName + null endTime）
- `grep "MOCK_PROCESSED_TASKS" Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` — handler 引用了新种子
- `grep "/api/workflow/tasks/:taskId\"" Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` — detail handler 的 pattern 精确匹配 `:taskId` 参数
- `grep "/api/workflow/tasks/:taskId/reject" Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` — reject handler
- `grep "/api/workflow/tasks/processed" Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` — processed handler
- `grep "name: 'TaskDetail'" Smart-WorkFlow-Web/src/router/index.ts` — 静态路由存在
- `grep "name: 'ProcessedList'" Smart-WorkFlow-Web/src/router/index.ts` — 静态路由存在
- `grep "processed-list" Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` — 菜单树含 ProcessedList
- `grep -r "processName" Smart-WorkFlow-Web/src/foundation/mock/seeds.ts \| grep -c mock-task` — 确认 5 条待办均有 processName

### 13.2 单元测试

Mock 层无需新增单元测试（现有 mock infrastructure 无独立 test 文件，通过 `pnpm dev:mock` 手工验收）。

`pnpm test` 全量回归——验证已有 48 files / 417 tests 不受影响。

### 13.3 集成测试

不适用。Mock 层本身就是集成测试的替代品。

### 13.4 手工验证

**`pnpm dev:mock` 完整闭环验收**：

1. 启动 `pnpm dev:mock` → 浏览器打开
2. 登录 → 侧边栏「流程引擎」展开 → 点击「我的待办」
3. 验证待办列表显示分页（默认 10 条/页），processName 列有值
4. 验证底部分页组件正常显示
5. 点击某一行 → 跳转任务详情页
6. 详情页验证：基本信息（9 字段）、流程变量、审批历史（空态）
7. 点击「审批通过」→ 确认框 → 通过 → 跳回待办列表
8. 返回待办列表 → 验证已审批任务从列表消失
9. 点击另一行 → 详情页 → 点击「驳回」→ 确认框 → 驳回 → 跳回待办列表
10. 待办列表 → 点击「已办任务」按钮 → 跳转已办列表
11. 已办列表验证：分页显示 3 条，第 3 条 processName/endTime 显示 `-`
12. 已办列表 → 点击「待办任务」按钮 → 跳回待办列表

### 13.5 回归检查

- `pnpm test` — 全量 ≥ 48 files / ≥ 417 tests 全绿（不减）
- `pnpm lint` — 零新增告警
- `pnpm typecheck` — 零错误（新增的 seeds 类型与 contracts 一致）
- `pnpm build` — 构建成功

## 14. 验收标准

| # | 条件 | 验证方式 |
|:--:|------|----------|
| F3-1 | `handlers.ts` 中 `GET /api/workflow/tasks/todo` handler 改为分页（返回 `records/total/pageNum/pageSize`） | grep 确认 handler 含 `query.pageNum` / `query.pageSize` / `slice` |
| F3-2 | `handlers.ts` 中新增 `GET /api/workflow/tasks/:taskId` handler（检索 MOCK_TODO_TASKS，返回含 12 字段的 TaskDetail） | grep 确认 |
| F3-3 | `handlers.ts` 中新增 `POST /api/workflow/tasks/:taskId/reject` handler（splice 移除） | grep 确认 |
| F3-4 | `handlers.ts` 中新增 `GET /api/workflow/tasks/processed` 分页 handler | grep 确认 |
| F3-5 | `seeds.ts` 中 `MOCK_TODO_TASKS` 每条记录含 `processName` 字段（≥ 5 条） | grep 数 `processName` 出现 ≥ 5 次 |
| F3-6 | `seeds.ts` 中新增 `MOCK_PROCESSED_TASKS`（≥ 3 条），至少 1 条含 `processName: null` 和 `endTime: null` | 人工检查种子数据 |
| F3-7 | `seeds.ts` 菜单树 workflow 目录下新增「已办任务」子菜单（path: `workflow/processed`, component: `workflow/views/ProcessedList`） | grep `processed-list` + grep `ProcessedList` in seeds.ts |
| F3-8 | `router/index.ts` 中新增 `TaskDetail` 静态路由（path: `workflow/task/:taskId`, name: `'TaskDetail'`） | grep 确认 |
| F3-9 | `router/index.ts` 中新增 `ProcessedList` 静态路由（path: `workflow/processed`, name: `'ProcessedList'`） | grep 确认 |
| F3-10 | `pnpm test` 全量 ≥ 48 files / ≥ 417 tests 全绿 | `pnpm test` 输出 |
| F3-11 | `pnpm lint` 零新增告警 | `pnpm lint` 输出 |
| F3-12 | `pnpm typecheck` 零错误 | `pnpm typecheck` 输出 |
| F3-13 | `pnpm build` 构建成功 | `pnpm build` 输出 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step F3 前端 Mock + Handlers + 路由

## 1. Step 编号和名称
## 2. 使用模型
## 3. 实际读取的文件
## 4. 实际修改的文件
## 5. 每个文件的修改摘要
## 6. 实际执行的命令（含参数）
## 7. 命令输出摘要（test / lint / typecheck / build）
## 8. 与原方案的偏差
## 9. 遇到的问题
## 10. 未完成内容
## 11. 风险和注意事项
## 12. Git diff 摘要
## 13. 建议执行的测试
```

## 16. 测试回执格式

```markdown
# 测试回执 — Step F3 前端 Mock + Handlers + 路由

## 1. Step 编号和名称
## 2. 测试环境
## 3. 测试前置条件
## 4. 实际执行的测试命令
## 5. 各测试项结果
## 6. 通过项
## 7. 失败项
## 8. 跳过项及原因
## 9. 关键日志或错误信息
## 10. 是否满足验收标准（逐条对照 §14 的 13 条）
## 11. 回归风险
## 12. 最终结论（PASSED / FAILED / BLOCKED）
```

## 17. 明确禁止事项

- ❌ **禁止修改任何后端代码**
- ❌ **禁止修改 Vue 视图文件**（F2 已完成）
- ❌ **禁止修改 API 层/类型层**（F1 已完成）
- ❌ **禁止修改 `router/guard.ts`**（动态路由构建逻辑不变）
- ❌ **禁止修改 `foundation/mock/index.ts`**（MSW registry 逻辑不变）
- ❌ **禁止修改其他模块的 mock handler/seeds**（仅操作 workflow 相关的 3 个 handler + BPM 种子）
- ❌ **禁止删除现有 handler**（complete / defs handler 保留不动）
- ❌ **禁止改变 `MOCK_FORM_DEF_STORE` 或表单相关种子**
- ❌ **禁止在 handler 中使用 `Date.now()` / `Math.random()`**（种子数据是确定性的）
- ❌ **禁止新增 `.spec.ts` 测试文件**（Mock 层手工验收即可，F3 不新增自动化测试文件）
- ❌ **禁止在 MOCK_TODO_TASKS 中移除 `taskId` 字段或改变现有字段顺序**（只新增 `processName`）
