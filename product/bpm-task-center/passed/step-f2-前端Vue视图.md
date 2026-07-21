# Step F2：前端 — Vue 视图（TodoList增强 + TaskDetail + ProcessedList）

## 1. 当前状态

- **功能**：bpm-task-center — BPM 待办中心增强
- **当前进度**：4/6 PASSED（B1 ✅ B2 ✅ B3 ✅ F1 ✅），后端全部完成 + 前端类型/API 层完成
- **此 Step 位置**：前端第二阶段，F1→F2→F3 的中间步
- **前置条件**：
  - F1 已 PASSED：`contracts/bpm.ts` 含 TodoTask/TaskDetail/ApprovalHistoryItem/ProcessedTask/ProcessDef 五种类型
  - F1 已 PASSED：`api/index.ts` 含 queryTodoTasks(分页)/queryTaskDetail/completeTask/rejectTask/queryProcessedTasks/pageProcessDefs 六个函数
  - F1 已 PASSED：`api/index.spec.ts` 6 条测试全绿，全量 46 files / 395 tests
- **后端端点契约**（不变）：
  | # | Method | URL | Response data |
  |---|--------|-----|---------------|
  | 1 | `GET` | `/workflow/tasks/todo?pageNum=&pageSize=` | `PageResult<TodoTaskRespDTO>` |
  | 2 | `GET` | `/workflow/tasks/{taskId}` | `TaskDetailRespDTO` |
  | 3 | `POST` | `/workflow/tasks/{taskId}/complete` | `void` |
  | 4 | `POST` | `/workflow/tasks/{taskId}/reject` | `void` |
  | 5 | `GET` | `/workflow/tasks/processed?pageNum=&pageSize=` | `PageResult<ProcessedTaskRespDTO>` |
- **当前前端状态**：
  - `TodoList.vue`：仍使用旧 `queryTodoTasks()` 无参调用 + `pageSize=9999` hack，无驳回按钮，无导航
  - `TodoList.spec.ts`：5 条测试基于旧 API 签名
  - 无 TaskDetail.vue / ProcessedList.vue
  - `ProcessDefList.vue`：F2 改造 TodoList 的**参考模板**（真分页模式）

## 2. Step 目标

改造 TodoList.vue 为真分页 + 驳回操作 + 页面导航；新建 TaskDetail.vue（任务详情 + 审批历史 + 通过/驳回）和 ProcessedList.vue（已办分页列表）；为三个视图编写完整 spec 测试。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：纯 Vue SFC 组件 + Vitest spec，严格遵循已有 ProcessDefList/TodoList/NotifyHome 的既存模式（StandardListTemplate、防重复门、ElMessageBox.confirm、vi.mock），无架构决策、无跨项目联动
是否触发升级条件：否
```

## 4. 模型选择理由

三个视图全部照搬已有代码模式：TodoList 改造参照 ProcessDefList 的分页模式；TaskDetail 参照 el-card/el-descriptions 标准布局；ProcessedList 几乎逐行照搬 ProcessDefList。spec 测试完全复用现有 mock 桩模式（`vi.mock('@/modules/workflow/api')` + StandardListTemplate 最小桩 + `wrapper.vm as unknown as` 桥接）。F2 是三个前端 Step 中工作量最大但最机械的一步。

## 5. 已知上下文

### 5.1 前端类型（F1 已交付，位于 `contracts/bpm.ts`）

```typescript
// TodoTask — 6 字段（待办列表项）
interface TodoTask {
  taskId: string; processInstanceId: string; processName: string;
  formKey: string; businessKey: string; createTime: string;
}

// TaskDetail — 12 字段（任务详情）
interface TaskDetail {
  taskId: string; taskName: string; processInstanceId: string;
  processDefinitionKey: string; processName: string | null;
  formKey: string; businessKey: string; assignee: string;
  initiatorId: number; createTime: string;
  processVariables: Record<string, unknown>;
  approvalHistory: ApprovalHistoryItem[];
}

// ApprovalHistoryItem — 5 字段
interface ApprovalHistoryItem {
  taskId: string; taskName: string; assignee: string;
  createTime: string; endTime: string | null;
}

// ProcessedTask — 8 字段（已办列表项）
interface ProcessedTask {
  taskId: string; taskName: string; processInstanceId: string;
  processName: string | null; formKey: string; businessKey: string;
  createTime: string; endTime: string | null;
}
```

### 5.2 API 函数（F1 已交付，位于 `api/index.ts`）

| 函数 | 签名 | 用途 |
|------|------|------|
| `queryTodoTasks` | `(page: PageQuery) => Promise<PageResult<TodoTask>>` | 待办分页 |
| `queryTaskDetail` | `(taskId: string) => Promise<TaskDetail>` | 任务详情 |
| `completeTask` | `(taskId: string) => Promise<void>` | 审批通过 |
| `rejectTask` | `(taskId: string) => Promise<void>` | 驳回 |
| `queryProcessedTasks` | `(page: PageQuery) => Promise<PageResult<ProcessedTask>>` | 已办分页 |
| `pageProcessDefs` | `(page: PageQuery) => Promise<PageResult<ProcessDef>>` | 流程定义 |

### 5.3 参考模板

- **真分页 B 型页面**：`ProcessDefList.vue`（`pageNum`/`pageSize` ref → `PageQuery` → `PageResult.list`/`.total` → `handlePageNumChange`/`handlePageSizeChange`）
- **非分页 B 型 + 操作**：`TodoList.vue`（现有，`approvingId` 防重复门 + `ElMessageBox.confirm` + `ApiError` 处理）
- **spec 参考**：`ProcessDefList.spec.ts`（分页列表测试）、`TodoList.spec.ts`（操作确认框测试）

### 5.4 路由策略

F2 **不注册路由**（F3 负责）。视图通过 `vue-router` 的 `useRouter().push()` 和 `useRoute().params` 进行页面间导航和参数获取。使用以下命名路由（F3 将注册）：

- `name: 'TodoList'` — 待办列表
- `name: 'TaskDetail'` — 任务详情，params: `{ taskId: string }`
- `name: 'ProcessedList'` — 已办列表

spec 测试中 mock `vue-router`：
```typescript
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: { taskId: 'task-001' } }),
}))
```

### 5.5 测试桩模板

```typescript
const stubs = {
  StandardListTemplate: {
    template: '<div><slot/><slot name="toolbar-actions"/><slot name="empty-action"/></div>',
    props: ['title', 'total', 'pageNum', 'pageSize', 'empty'],
    emits: ['update:pageNum', 'update:pageSize'],
  },
  'el-alert': { template: '<div class="el-alert">{{ title }}</div>', props: ['title', 'type'] },
  'el-table': { template: '<div><slot/></div>' },
  'el-table-column': { template: '<div/>' },
  'el-button': { template: '<button @click="$emit(\'click\')"><slot/></button>', emits: ['click'] },
  'el-tag': { template: '<span class="el-tag"><slot/></span>' },
  'el-card': { template: '<div class="el-card"><slot/></div>' },
  'el-descriptions': { template: '<div><slot/></div>' },
  'el-descriptions-item': { template: '<div><slot/></div>' },
}
```

## 6. 执行前必须读取的文件

按优先级排序：

1. `Smart-WorkFlow-Web/src/contracts/bpm.ts` — 确认 F1 类型定义（TaskDetail/ProcessedTask/ApprovalHistoryItem 字段）
2. `Smart-WorkFlow-Web/src/contracts/common.ts` — PageQuery / PageResult
3. `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` — 确认 API 函数签名
4. `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue` — **分页 B 型参考模板**
5. `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.spec.ts` — **分页 spec 参考模板**
6. `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` — 待改造的现有代码
7. `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.spec.ts` — 待更新的现有测试
8. `Smart-WorkFlow-Web/src/foundation/request/index.ts` — ApiError 类
9. `Smart-WorkFlow-Web/src/components/page-layout/StandardListTemplate.vue` — 了解插槽和事件

## 7. 允许修改的文件范围

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` | **修改** | 真分页 + 驳回 + 导航 |
| 2 | `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.spec.ts` | **修改** | 适配分页 + 新增驳回/导航测试 |
| 3 | `Smart-WorkFlow-Web/src/modules/workflow/views/TaskDetail.vue` | **新建** | 任务详情页 |
| 4 | `Smart-WorkFlow-Web/src/modules/workflow/views/TaskDetail.spec.ts` | **新建** | 详情页测试 |
| 5 | `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessedList.vue` | **新建** | 已办列表页 |
| 6 | `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessedList.spec.ts` | **新建** | 已办列表测试 |

**共 6 文件（2 修改 + 4 新建）。**

## 8. 禁止修改的范围

- ❌ 所有 `Smart-WorkFlow/` 下的后端代码
- ❌ `Smart-WorkFlow-Web/src/contracts/` 下的类型文件（F1 已完成）
- ❌ `Smart-WorkFlow-Web/src/modules/workflow/api/` 下的 API 文件（F1 已完成）
- ❌ `Smart-WorkFlow-Web/src/foundation/mock/` 下的 Mock 文件（F3 范围）
- ❌ `Smart-WorkFlow-Web/src/router/` 下的路由配置（F3 范围）
- ❌ `Smart-WorkFlow-Web/src/modules/workflow/views/WorkflowHome.vue`（F3 可能用到）
- ❌ `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue` 及其 spec（与本功能无关）
- ❌ 任何其他前端模块

## 9. 详细执行方案

### 9.1 TodoList.vue — 改造为真分页 + 驳回 + 导航

#### 9.1.1 导入更新

```typescript
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StandardListTemplate } from '@/components/page-layout'
import { queryTodoTasks, completeTask, rejectTask } from '@/modules/workflow/api'
import { ApiError } from '@/foundation/request'
import type { TodoTask } from '@/contracts/bpm'
import type { PageQuery } from '@/contracts/common'
```

新增：`useRouter`、`rejectTask`、`PageQuery`。

#### 9.1.2 状态变量改造

```typescript
const router = useRouter()

// ─── 列表状态 ───
const list = ref<TodoTask[]>([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const approvingId = ref<string | null>(null)
const rejectingId = ref<string | null>(null)

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// 真分页（不再 pageSize=9999）
const pageNum = ref(1)
const pageSize = ref(10)
```

关键变化：`pageSize` 从 9999 改为 10；新增 `rejectingId`；新增 `router`。

#### 9.1.3 loadList 改造

```typescript
async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const pageQuery: PageQuery = { pageNum: pageNum.value, pageSize: pageSize.value }
    const result = await queryTodoTasks(pageQuery)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载待办任务失败'
    }
  } finally {
    loading.value = false
  }
}
```

关键变化：`queryTodoTasks()` → `queryTodoTasks(pageQuery)`；`list.value = result.list` + `total.value = result.total`。

#### 9.1.4 分页事件处理（照搬 ProcessDefList）

```typescript
function handlePageNumChange(p: number) {
  pageNum.value = p
  void loadList()
}

function handlePageSizeChange(s: number) {
  pageSize.value = s
  pageNum.value = 1
  void loadList()
}
```

#### 9.1.5 操作函数改造

保留 `handleApprove`（含 `ElMessageBox.confirm('确认审批通过此任务？', ...)`）不变。

新增 `handleReject`：

```typescript
function rejectRow(r: unknown) {
  void handleReject(r as TodoTask)
}

async function handleReject(row: TodoTask) {
  if (rejectingId.value) return
  rejectingId.value = row.taskId

  let confirmed = false
  try {
    await ElMessageBox.confirm('确认驳回此任务？', '驳回确认', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    confirmed = true
  } catch {
    return
  } finally {
    if (!confirmed) rejectingId.value = null
  }
  try {
    await rejectTask(row.taskId)
    ElMessage.success('已驳回')
    list.value = list.value.filter((t) => t.taskId !== row.taskId)
    total.value = list.value.length
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('驳回操作失败')
    }
  } finally {
    rejectingId.value = null
  }
}
```

#### 9.1.6 行点击导航

```typescript
function handleRowClick(row: TodoTask) {
  router.push({ name: 'TaskDetail', params: { taskId: row.taskId } })
}
```

#### 9.1.7 模板改造

```html
<template>
  <StandardListTemplate
    title="我的待办"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 工具栏操作按钮 -->
    <template #toolbar-actions>
      <el-button @click="router.push({ name: 'ProcessedList' })">已办任务</el-button>
    </template>

    <!-- 空态 -->
    <template #empty-action>
      <span />
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
    <el-table
      v-loading="loading"
      :data="list"
      stripe
      highlight-current-row
      style="width: 100%"
      @row-click="handleRowClick"
    >
      <el-table-column label="任务编号" min-width="140">
        <template #default="{ row }">
          <span :title="row.taskId">{{ formatTaskId(row.taskId) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="processName" label="流程名称" min-width="140" />
      <el-table-column prop="formKey" label="表单标识" min-width="140" />
      <el-table-column prop="businessKey" label="业务单号" min-width="120" />
      <el-table-column prop="createTime" label="创建时间" min-width="170" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            :loading="approvingId === row.taskId"
            :disabled="approvingId !== null || rejectingId !== null"
            @click.stop="approveRow(row)"
          >
            通过
          </el-button>
          <el-button
            size="small"
            type="danger"
            :loading="rejectingId === row.taskId"
            :disabled="approvingId !== null || rejectingId !== null"
            @click.stop="rejectRow(row)"
          >
            驳回
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </StandardListTemplate>
</template>
```

关键变化：
- 绑定 `@update:page-num` / `@update:page-size`
- `#toolbar-actions` 插槽新增「已办任务」按钮
- 表格新增 `highlight-current-row` + `@row-click`
- 操作列新增 `processName` 列
- 操作列新增驳回按钮，宽度 140→200
- 通过/驳回按钮各自 `@click.stop` 阻止冒泡（避免触发行点击）
- disabled 条件互斥

#### 9.1.8 样式

**删除**以下样式块：
```css
:deep(.list-pagination) {
  display: none;
}
```

### 9.2 TaskDetail.vue — 任务详情页（新建）

#### 9.2.1 完整脚本

```vue
<script setup lang="ts">
/**
 * TaskDetail — 任务详情页。
 *
 * 展示任务详情信息、流程变量、审批历史，提供通过/驳回操作。
 * 路由参数：taskId
 */
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryTaskDetail, completeTask, rejectTask } from '@/modules/workflow/api'
import { ApiError } from '@/foundation/request'
import type { TaskDetail } from '@/contracts/bpm'

const router = useRouter()
const route = useRoute()

const taskId = route.params.taskId as string

// ─── 页面状态 ───
const detail = ref<TaskDetail | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const acting = ref<string | null>(null) // 'approve' | 'reject' | null

function formatTaskId(id: string): string {
  return id.length > 8 ? `...${id.slice(-8)}` : id
}

async function loadDetail() {
  loading.value = true
  errorMsg.value = ''
  try {
    detail.value = await queryTaskDetail(taskId)
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载任务详情失败'
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'TodoList' })
}

async function handleApprove() {
  if (acting.value) return
  acting.value = 'approve'

  let confirmed = false
  try {
    await ElMessageBox.confirm('确认审批通过此任务？', '审批确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'info',
    })
    confirmed = true
  } catch {
    return
  } finally {
    if (!confirmed) acting.value = null
  }
  try {
    await completeTask(taskId)
    ElMessage.success('审批通过')
    router.push({ name: 'TodoList' })
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('审批操作失败')
    }
    acting.value = null
  }
}

async function handleReject() {
  if (acting.value) return
  acting.value = 'reject'

  let confirmed = false
  try {
    await ElMessageBox.confirm('确认驳回此任务？', '驳回确认', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    confirmed = true
  } catch {
    return
  } finally {
    if (!confirmed) acting.value = null
  }
  try {
    await rejectTask(taskId)
    ElMessage.success('已驳回')
    router.push({ name: 'TodoList' })
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('驳回操作失败')
    }
    acting.value = null
  }
}

function formatVariables(vars: Record<string, unknown>): [string, string][] {
  return Object.entries(vars).map(([k, v]) => [k, String(v)])
}

onMounted(loadDetail)
</script>
```

#### 9.2.2 完整模板

```html
<template>
  <div class="task-detail" v-loading="loading">
    <!-- 顶栏 -->
    <div class="detail-header">
      <el-button @click="goBack">← 返回待办</el-button>
      <h2>任务详情</h2>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <!-- 任务信息 -->
    <el-card v-if="detail" class="detail-card">
      <template #header><span>基本信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">{{ detail.taskName }}</el-descriptions-item>
        <el-descriptions-item label="任务编号">
          <span :title="detail.taskId">{{ formatTaskId(detail.taskId) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ detail.processName ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="流程标识">{{ detail.processDefinitionKey }}</el-descriptions-item>
        <el-descriptions-item label="表单标识">{{ detail.formKey }}</el-descriptions-item>
        <el-descriptions-item label="业务单号">{{ detail.businessKey }}</el-descriptions-item>
        <el-descriptions-item label="当前审批人">{{ detail.assignee }}</el-descriptions-item>
        <el-descriptions-item label="发起人 ID">{{ detail.initiatorId }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 流程变量 -->
    <el-card v-if="detail && Object.keys(detail.processVariables).length > 0" class="detail-card">
      <template #header><span>流程变量</span></template>
      <el-table :data="formatVariables(detail.processVariables)" stripe>
        <el-table-column prop="0" label="变量名" min-width="180" />
        <el-table-column prop="1" label="变量值" min-width="280" />
      </el-table>
    </el-card>

    <!-- 审批历史 -->
    <el-card v-if="detail" class="detail-card">
      <template #header><span>审批历史</span></template>
      <el-alert
        v-if="detail.approvalHistory.length === 0"
        title="暂无审批历史"
        type="info"
        :closable="false"
        show-icon
      />
      <el-table v-else :data="detail.approvalHistory" stripe>
        <el-table-column label="任务编号" min-width="140">
          <template #default="{ row }">
            <span :title="row.taskId">{{ formatTaskId(row.taskId) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" min-width="120" />
        <el-table-column prop="assignee" label="审批人" min-width="100" />
        <el-table-column prop="createTime" label="创建时间" min-width="170" />
        <el-table-column label="完成时间" min-width="170">
          <template #default="{ row }">
            {{ row.endTime ?? '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 操作栏 -->
    <div v-if="detail" class="detail-actions">
      <el-button
        type="primary"
        size="large"
        :loading="acting === 'approve'"
        :disabled="acting !== null"
        @click="handleApprove"
      >
        审批通过
      </el-button>
      <el-button
        type="danger"
        size="large"
        :loading="acting === 'reject'"
        :disabled="acting !== null"
        @click="handleReject"
      >
        驳回
      </el-button>
    </div>
  </div>
</template>
```

#### 9.2.3 样式

```html
<style scoped>
.task-detail {
  padding: 16px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.detail-header h2 {
  margin: 0;
}
.detail-card {
  margin-bottom: 16px;
}
.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px 0;
}
</style>
```

### 9.3 ProcessedList.vue — 已办列表页（新建）

#### 9.3.1 完整脚本

照搬 `ProcessDefList.vue` 的分页模式，仅替换 API 调用和列定义：

```vue
<script setup lang="ts">
/**
 * ProcessedList — 已办任务列表页（页型 B）。
 *
 * 分页展示当前用户已办理完成的任务，支持点击行跳转详情。
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StandardListTemplate } from '@/components/page-layout'
import { queryProcessedTasks } from '@/modules/workflow/api'
import type { ProcessedTask } from '@/contracts/bpm'
import type { PageQuery } from '@/contracts/common'
import { ApiError } from '@/foundation/request'

const router = useRouter()

// ─── 列表状态 ───
const list = ref<ProcessedTask[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMsg = ref('')

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const pageQuery: PageQuery = { pageNum: pageNum.value, pageSize: pageSize.value }
    const result = await queryProcessedTasks(pageQuery)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载已办任务失败'
    }
  } finally {
    loading.value = false
  }
}

function handlePageNumChange(p: number) {
  pageNum.value = p
  void loadList()
}

function handlePageSizeChange(s: number) {
  pageSize.value = s
  pageNum.value = 1
  void loadList()
}

function handleRowClick(row: ProcessedTask) {
  router.push({ name: 'TaskDetail', params: { taskId: row.taskId } })
}

onMounted(loadList)
</script>
```

#### 9.3.2 完整模板

```html
<template>
  <StandardListTemplate
    title="已办任务"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 工具栏操作按钮 -->
    <template #toolbar-actions>
      <el-button @click="router.push({ name: 'TodoList' })">待办任务</el-button>
    </template>

    <!-- 空态 -->
    <template #empty-action>
      <span />
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
    <el-table
      v-loading="loading"
      :data="list"
      stripe
      highlight-current-row
      style="width: 100%"
      @row-click="handleRowClick"
    >
      <el-table-column prop="taskName" label="任务名称" min-width="140" />
      <el-table-column label="流程名称" min-width="140">
        <template #default="{ row }">
          {{ row.processName ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="formKey" label="表单标识" min-width="140" />
      <el-table-column prop="businessKey" label="业务单号" min-width="120" />
      <el-table-column prop="createTime" label="创建时间" min-width="170" />
      <el-table-column label="完成时间" min-width="170">
        <template #default="{ row }">
          {{ row.endTime ?? '-' }}
        </template>
      </el-table-column>
    </el-table>
  </StandardListTemplate>
</template>
```

### 9.4 TodoList.spec.ts — 测试更新

#### 9.4.1 mock 更新

```typescript
vi.mock('@/modules/workflow/api', () => ({
  queryTodoTasks: vi.fn(),
  completeTask: vi.fn(),
  rejectTask: vi.fn(),
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ params: {} }),
}))
```

新增 `rejectTask` 和 `mockPush`。

#### 9.4.2 mock 数据更新

```typescript
const mockTask: TodoTask = {
  taskId: 'mock-task-001',
  processInstanceId: 'mock-proc-001',
  processName: '单节点审批',   // ← 新增字段
  formKey: 'leave-request',
  businessKey: 'fd_001',
  createTime: '2026-07-10T09:15:00',
}

const mockPageResult = {
  list: [mockTask],
  total: 1,
  pageNum: 1,
  pageSize: 10,
}
```

#### 9.4.3 测试用例

| # | 测试名称 | 类型 | 关键断言 |
|---|----------|:----:|----------|
| 1 | `calls queryTodoTasks with pagination on mount` | **更新** | `queryTodoTasks` 被以 `{ pageNum:1, pageSize:10 }` 调用；`list` 长度 1；`total` 为 1 |
| 2 | `shows fallback error message when API fails with non-ApiError` | 保留 | `errorMsg === '加载待办任务失败'` |
| 3 | `shows ApiError message when API returns business error` | 保留 | `errorMsg === '任务列表为空'` |
| 4 | `calls completeTask and removes task on approve` | **更新** | mock `PageResult`；approve 后从 `list` 移除 |
| 5 | `does not call completeTask when user cancels confirm` | 保留 | `completeTask` 未被调用 |
| 6 | `calls rejectTask and removes task on reject` | **新增** | `rejectTask` 被调用；`ElMessage.success('已驳回')`；任务从列表移除 |
| 7 | `does not call rejectTask when user cancels reject confirm` | **新增** | `rejectTask` 未被调用 |
| 8 | `navigates to TaskDetail on row click` | **新增** | `mockPush` 被以 `{ name:'TaskDetail', params:{ taskId:'mock-task-001' } }` 调用 |
| 9 | `navigates to ProcessedList on toolbar button click` | **新增** | `mockPush` 被以 `{ name:'ProcessedList' }` 调用 |

**合计：9 条测试（5 保留/更新 + 4 新增）。**

### 9.5 TaskDetail.spec.ts — 测试新建

mock 设置：

```typescript
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ params: { taskId: 'task-001' } }),
}))

vi.mock('@/modules/workflow/api', () => ({
  queryTaskDetail: vi.fn(),
  completeTask: vi.fn(),
  rejectTask: vi.fn(),
}))
```

| # | 测试名称 | 关键断言 |
|---|----------|----------|
| 1 | `calls queryTaskDetail with taskId on mount` | `queryTaskDetail` 被以 `'task-001'` 调用 |
| 2 | `renders task detail fields (12 fields)` | `detail.taskName`/`processName`/`assignee` 等在 DOM/VM 中可见 |
| 3 | `shows fallback for null processName` | `processName ?? '-'` 渲染为 `-` |
| 4 | `shows ApiError message on business error` | `errorMsg === '...'` |
| 5 | `shows fallback error on non-ApiError` | `errorMsg === '加载任务详情失败'` |
| 6 | `shows empty history message when approvalHistory is []` | 「暂无审批历史」渲染 |
| 7 | `calls completeTask on approve and navigates to TodoList` | `completeTask` 被调用；`ElMessage.success('审批通过')`；`mockPush({ name:'TodoList' })` |
| 8 | `calls rejectTask on reject and navigates to TodoList` | `rejectTask` 被调用；`ElMessage.success('已驳回')`；`mockPush({ name:'TodoList' })` |
| 9 | `navigates back to TodoList on back button click` | `mockPush` 被以 `{ name:'TodoList' }` 调用 |

**合计：9 条测试。**

### 9.6 ProcessedList.spec.ts — 测试新建

mock 设置：

```typescript
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ params: {} }),
}))

vi.mock('@/modules/workflow/api', () => ({
  queryProcessedTasks: vi.fn(),
}))
```

| # | 测试名称 | 关键断言 |
|---|----------|----------|
| 1 | `calls queryProcessedTasks with pageNum=1 pageSize=10 on mount` | `queryProcessedTasks` 被以 `{ pageNum:1, pageSize:10 }` 调用 |
| 2 | `re-fetches on pageNum change` | `handlePageNumChange(2)` → `queryProcessedTasks` 被以 `{ pageNum:2, pageSize:10 }` 调用 |
| 3 | `resets to page 1 on pageSize change` | `handlePageSizeChange(20)` → `queryProcessedTasks` 被以 `{ pageNum:1, pageSize:20 }` 调用 |
| 4 | `shows fallback error on non-ApiError` | `errorMsg === '加载已办任务失败'` |
| 5 | `shows ApiError message on business error` | `errorMsg === '...'` |
| 6 | `displays empty state when list is empty` | `isEmpty === true` |
| 7 | `renders endTime as - when null` | `endTime ?? '-'` 渲染为 `-` |
| 8 | `navigates to TaskDetail on row click` | `mockPush` 被以 `{ name:'TaskDetail', params: { taskId: '...' } }` 调用 |
| 9 | `navigates to TodoList on toolbar button click` | `mockPush` 被以 `{ name:'TodoList' }` 调用 |

**合计：9 条测试。**

### 9.7 桩对象统一

三个 spec 文件共用统一的 stubs 对象（见 §5.5），TaskDetail.spec.ts 额外需要：

```typescript
'el-card': { template: '<div class="el-card"><slot/></div>' },
'el-descriptions': { template: '<div><slot/></div>' },
'el-descriptions-item': { template: '<div><slot/></div>' },
```

### 9.8 最终文件清单

| 文件 | 操作 | 预计行数 | 测试数 |
|------|:----:|:----:|:----:|
| `TodoList.vue` | 修改 | ~170 行（原 150） | — |
| `TodoList.spec.ts` | 修改 | ~200 行（原 118） | 9 |
| `TaskDetail.vue` | **新建** | ~200 行 | — |
| `TaskDetail.spec.ts` | **新建** | ~200 行 | 9 |
| `ProcessedList.vue` | **新建** | ~110 行 | — |
| `ProcessedList.spec.ts` | **新建** | ~200 行 | 9 |

## 10. 关键实现约束

- **TodoList 分页模式必须照搬 ProcessDefList**：`PageQuery` 构造、`result.list`/`result.total` 赋值、`handlePageNumChange`/`handlePageSizeChange` 函数签名和逻辑不得偏离参考模板
- **防重复门保持一致**：通过/驳回操作的 `approvingId`/`rejectingId`/`acting` 防重复模式不变，确认框在锁外但 API 调用在锁内
- **`@click.stop` 防止行点击冒泡**：操作列按钮必须加 `.stop` 修饰符，否则点击通过/驳回会同时触发行导航
- **命名路由**：所有 `router.push` 使用 `{ name: '...' }` 命名路由，不用硬编码路径（F3 将注册这些路由名）
- **TaskDetail 不使用 StandardListTemplate**：详情页非列表页，使用自定义布局（el-card + el-descriptions）
- **ProcessedList 使用 StandardListTemplate**：与 ProcessDefList/TodoList 保持一致的 B 型页面布局
- **`endTime` 和 `processName` 可为 null**：列渲染必须使用 `?? '-'` 兜底
- **不修改 API 层/类型层**：所有 import 来自 F1 已完成的文件，不新增或修改任何类型定义
- **不修改路由配置**：F2 仅使用 useRouter/useRoute，不注册路由（F3 负责）
- **spec 中 `wrapper.vm as unknown as` 桥接**：对 internal handler 的测试沿用现有模式，不导出私有函数

## 11. 边界情况

| 场景 | 处理方式 |
|------|----------|
| `processName` 为 null | TaskDetail/ProcessedList 中显示 `-` |
| `endTime` 为 null | ProcessedList 列渲染 `-`，ApprovalHistoryItem 同 |
| `approvalHistory` 为空数组 | 显示 `el-alert` type="info"「暂无审批历史」 |
| `processVariables` 为空对象 | 流程变量卡片整体隐藏（`v-if` 条件） |
| 分页切换时 `pageNum` 超出实际页数 | 依赖后端返回空列表，前端不做客户端截断 |
| 操作后列表变空 | `isEmpty` computed 自动响应（列表长度变为 0） |
| 行点击与操作按钮点击冲突 | 操作按钮 `@click.stop` 阻止冒泡 |
| 用户在确认框打开时导航离开 | `ElMessageBox.confirm` reject 自然处理，`finally` 清理锁 |
| `taskId` 为不存在的值时 | `queryTaskDetail` 抛 ApiError，显示错误信息 |
| Table row 类型不兼容 | 操作桥接函数 `approveRow(r: unknown)` / `rejectRow(r: unknown)` 保留 |

## 12. 风险和回滚方案

| 风险 | 影响 | 缓解 |
|------|------|------|
| F2 视图依赖命名路由（TodoList/TaskDetail/ProcessedList），但路由尚未注册 | `dev` 模式下页面无法导航（功能不可用），但 spec 全部 mock 不受影响 | F3 将注册这些路由。F2 验收不要求 `pnpm dev` 手动验证 |
| TodoList 从非分页改为分页后用户体验变化 | 每页只显示 10 条，需翻页 | 对齐 ProcessDefList/UserList 统一分页体验，默认 10 条 |
| TaskDetail 页操作后 `router.push({ name: 'TodoList' })`，但该路由可能尚未注册 | F2 阶段导航会失败 | spec 已 mock router，导航调用被验证。F3 注册路由后即可正常工作 |
| `el-descriptions` 在测试 stub 中无法完整渲染 | spec 中字段验证需要访问 VM 而非 DOM | 测试通过 `wrapper.vm` 访问 `detail` 对象断言字段值，不依赖 DOM stub |

**回滚方案**：`git checkout` 这 6 个文件即可。改动范围仅限于 `workflow/views/` 目录。

## 13. 测试方案

### 13.1 静态检查

- `grep -r "queryTodoTasks()" Smart-WorkFlow-Web/src/modules/workflow/views/` — 确认无无参调用（TodoList 已改为 `queryTodoTasks(pageQuery)`）
- `grep -r "pageSize.*9999" Smart-WorkFlow-Web/src/modules/workflow/views/` — 确认 9999 hack 已清除
- `grep -r ":deep(.list-pagination).*display.*none" Smart-WorkFlow-Web/src/modules/workflow/views/` — 确认隐藏分页样式已删除
- `grep "processName" Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` — 确认 TodoList 列定义含 processName
- `grep "rejectTask" Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` — 确认驳回已集成
- 数文件：`ls Smart-WorkFlow-Web/src/modules/workflow/views/*.vue` — 确认 TaskDetail.vue、ProcessedList.vue 存在
- 数文件：`ls Smart-WorkFlow-Web/src/modules/workflow/views/*.spec.ts` — 确认 TaskDetail.spec.ts、ProcessedList.spec.ts 存在

### 13.2 单元测试

运行三个 spec 文件：

```bash
pnpm test src/modules/workflow/views/TodoList.spec.ts
pnpm test src/modules/workflow/views/TaskDetail.spec.ts
pnpm test src/modules/workflow/views/ProcessedList.spec.ts
```

| 文件 | 测试数 | 预期 |
|------|:-----:|------|
| `TodoList.spec.ts` | 9 | 全部通过 |
| `TaskDetail.spec.ts` | 9 | 全部通过 |
| `ProcessedList.spec.ts` | 9 | 全部通过 |
| **合计** | **27** | **27/27 通过** |

### 13.3 集成测试

不适用。F2 仅涉及视图组件和单元测试。页面间导航的端到端验证在 F3（Mock + Menu）中通过 `pnpm dev:mock` 手工验收。

### 13.4 手工验证

不适用。F2 产出 Vue 组件，但路由未注册、Mock 未更新，dev 模式无法正常工作。手工验收在 F3 进行。

### 13.5 回归检查

- `pnpm test` — 全量测试文件数 ≥ 48（基线 46 + 新增 2 spec），测试数 ≥ 415（基线 395 + ≥20 新增）
- 已有 `ProcessDefList.spec.ts` 6 条测试不受影响
- 已有 `api/index.spec.ts` 6 条测试不受影响
- `pnpm lint` — 零新增告警（含架构边界规则）
- `pnpm typecheck` — 新增/修改的 6 个文件自身类型正确（全工程 typecheck 可能因 F3 未就绪的 mock/router 报错，但 `workflow/views/` 下不得有类型错误）

## 14. 验收标准

| # | 条件 | 验证方式 |
|:--:|------|----------|
| F2-1 | `TodoList.vue` 中 `queryTodoTasks` 被调用时传入 `PageQuery` 参数（含 `pageNum`/`pageSize`） | grep `queryTodoTasks(pageQuery)` 或 `queryTodoTasks({` |
| F2-2 | `TodoList.vue` 操作列含驳回按钮（调用 `rejectTask`），且带 `@click.stop` | grep `rejectTask` in TodoList.vue + grep `@click.stop` in TodoList.vue |
| F2-3 | `TodoList.vue` 表格含 `highlight-current-row` + `@row-click` 导航到 TaskDetail | grep `highlight-current-row` + grep `TaskDetail` in TodoList.vue |
| F2-4 | `TodoList.vue` toolbar-actions 含「已办任务」按钮导航到 ProcessedList | grep `ProcessedList` in TodoList.vue |
| F2-5 | `TodoList.vue` 不含 `pageSize.*9999` 且不含 `:deep(.list-pagination).*display.*none` | grep 零命中 |
| F2-6 | `TaskDetail.vue` 新建，`onMounted` 调用 `queryTaskDetail(route.params.taskId)`，展示至少 10 个 TaskDetail 字段 | 人工数 `el-descriptions-item` 或 `detail.xxx` 出现次数 ≥ 10 |
| F2-7 | `TaskDetail.vue` 含审批历史区域（表格），空数组时显示「暂无审批历史」 | grep `approvalHistory` + grep `暂无审批历史` |
| F2-8 | `TaskDetail.vue` 含通过/驳回操作按钮，调用 `completeTask`/`rejectTask`，成功后导航到 TodoList | grep `completeTask` + grep `rejectTask` + grep `TodoList` in TaskDetail.vue |
| F2-9 | `ProcessedList.vue` 新建，使用 StandardListTemplate + 真分页模式（同 ProcessDefList） | grep `StandardListTemplate` + grep `handlePageNumChange` + grep `handlePageSizeChange` |
| F2-10 | `ProcessedList.vue` 表格含 6 列（taskName/processName/formKey/businessKey/createTime/endTime），endTime null 显示 `-` | 人工数列定义 + grep `?? '-'` |
| F2-11 | `TodoList.spec.ts` ≥ 9 条测试且全部通过 | 数 `it(` 出现次数 + `pnpm test` 输出 |
| F2-12 | `TaskDetail.spec.ts` ≥ 8 条测试且全部通过 | 数 `it(` 出现次数 + `pnpm test` 输出 |
| F2-13 | `ProcessedList.spec.ts` ≥ 8 条测试且全部通过 | 数 `it(` 出现次数 + `pnpm test` 输出 |
| F2-14 | `pnpm test` 全量 ≥ 48 files / ≥ 415 tests 全绿 | `pnpm test` 输出摘要 |
| F2-15 | `pnpm lint` 零新增告警 | `pnpm lint` 输出 |

## 15. 执行回执格式

按 CLAUDE.md §7.1 返回，至少包含：

```markdown
# 执行回执 — Step F2 前端 Vue 视图

## 1. Step 编号和名称
## 2. 使用模型
## 3. 实际读取的文件（逐文件列出）
## 4. 实际修改的文件（逐文件列出，标注新建/修改）
## 5. 每个文件的修改摘要（改动点、改动行数、改动原因）
## 6. 实际执行的命令（逐条列出命令及参数）
## 7. 命令输出摘要（test / lint 退出码和关键输出）
## 8. 与原方案的偏差（如有）
## 9. 遇到的问题（如有）
## 10. 未完成内容（如有）
## 11. 风险和注意事项
## 12. Git diff 摘要（改动文件数、新增行数、删除行数）
## 13. 建议执行的测试
```

## 16. 测试回执格式

按 CLAUDE.md §7.2 返回，至少包含：

```markdown
# 测试回执 — Step F2 前端 Vue 视图

## 1. Step 编号和名称
## 2. 测试环境（Node 版本、pnpm 版本、OS）
## 3. 测试前置条件
## 4. 实际执行的测试命令（逐条列出）
## 5. 各测试项结果（逐文件列出测试项名称、预期结果、实际结果、是否通过）
## 6. 通过项
## 7. 失败项
## 8. 跳过项及原因
## 9. 关键日志或错误信息
## 10. 是否满足验收标准（逐条对照 §14 的 15 条验收标准）
## 11. 回归风险
## 12. 最终结论（PASSED / FAILED / BLOCKED）
```

## 17. 明确禁止事项

- ❌ **禁止修改路由配置**（`router/index.ts`、`router/guard.ts`、菜单配置）— 这是 F3 的工作
- ❌ **禁止修改 Mock handlers / seeds** — 这是 F3 的工作
- ❌ **禁止修改 `WorkflowHome.vue`** — F3 可能需要改为目录组件
- ❌ **禁止修改 API 层**（`api/index.ts`）— F1 已完成
- ❌ **禁止修改类型定义**（`contracts/bpm.ts`、`contracts/common.ts`）— F1 已完成
- ❌ **禁止修改 `ProcessDefList.vue` 及其 spec** — 与本功能无关
- ❌ **禁止修改 `foundation/request/`** — 请求层已就绪
- ❌ **禁止新建 API 函数或类型文件**
- ❌ **禁止触碰任何后端文件**
- ❌ **禁止在 TodoList 操作列中移除审批通过按钮**
- ❌ **禁止使用硬编码路径进行路由跳转**（必须使用命名路由 `{ name: '...' }`）
- ❌ **禁止在 spec 中直接 import SFC 文件（必须动态 import）以外的真实依赖** — 所有依赖（API/router/element-plus）必须 vi.mock
- ❌ **禁止使用 `@click` 而不加 `.stop` 修饰符**（操作列按钮必须阻止冒泡）
