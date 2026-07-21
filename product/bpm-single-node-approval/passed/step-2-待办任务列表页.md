# Step 2：待办任务列表页

## 1. 当前状态

- **功能名称**：M04-F01-01 BPM 单节点审批前后端联通
- **功能状态**：IN_PROGRESS
- **功能进度**：Step 0a（后端基线）✅ · Step 0b（前端基线）✅ · Step 1（工作流基础设施）✅
- **Step 位置**：第 2 步 / 共 4 步 — 在 Step 1（contracts + API + mock + menu）基础上构建**第一个业务页面**
- **前置 Step 完成情况**：Step 1 PASSED — contracts/bpm.ts（TodoTask、ProcessDef 接口）、api/index.ts（3 个导出函数）、api/index.spec.ts（3 个测试用例）、seeds.ts（MOCK_TODO_TASKS + MOCK_PROCESS_DEFS + 菜单 DIRECTORY 改造）、handlers.ts（3 个 mock handler）已全部就位并通过四连校验门

## 2. Step 目标

创建「我的待办」列表页（`TodoList.vue` + `TodoList.spec.ts`），展示当前用户待审批任务，提供「审批通过」按钮，可在 mock 模式下肉眼验收完整交互闭环。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯前端单页面，严格遵循 FormDefList/FormData 已有的 StandardListTemplate 模式，无跨项目协议变更、无 DB 设计、无安全/认证变更
是否触发升级条件：否
```

## 4. 模型选择理由

与 Step 1 同属纯前端文件增改，页面模式（页型 B — 数据列表页）在 form 模块已有完整参考（FormDefList.vue），属于有明确套路的机械实现，Flash 完全胜任。

## 5. 已知上下文

### 5.1 现有模式

- **页型 B（StandardListTemplate）**：`src/components/page-layout/StandardListTemplate.vue` — 组合 ListToolbar + ListFilterBar + ListTable/ListEmpty + ListPagination。slots: `toolbar-actions`、`filter`、`filter-actions`、`empty-action`。props: `title`、`total`、`pageNum`、`pageSize`、`empty`。
- **参考文件**（必读）：`src/modules/form/views/FormDefList.vue` — 完整 StandardListTemplate 使用示例（loading/error/empty/list 四态处理 + el-table + el-tag 状态列 + 操作列）
- **API 模式**：`src/modules/workflow/api/index.ts` — `queryTodoTasks()` 返回 `Promise<TodoTask[]>`（后端返回平铺数组，不分页）
- **mock handler**：`src/foundation/mock/handlers.ts` — 已有 `GET /api/workflow/tasks/todo` handler 返回 `MOCK_TODO_TASKS`，`POST /api/workflow/tasks/:taskId/complete` handler 做 splice 删除

### 5.2 数据格式

```typescript
interface TodoTask {
  taskId: string       // "mock-task-001"
  processInstanceId: string  // "mock-proc-001"
  formKey: string      // "leave-request"
  businessKey: string  // "fd_001"
  createTime: string   // "2026-07-10T09:15:00"
}
```

**关键约束**：后端 `GET /workflow/tasks/todo` 返回平铺数组（非 PageResult），前端直接渲染，**不分页**。但 StandardListTemplate 需要 total/pageNum/pageSize props，因此手动传：`total={list.length}`、`pageNum=1`、`pageSize=9999`，隐藏分页组件通过 CSS。

### 5.3 菜单路由

workflow 菜单已配置为 DIRECTORY（`menuType: 0`），自动重定向到第一个子页 `/workflow/todo`。TodoList.vue 的 component 路径已配置为 `workflow/views/TodoList`。

## 6. 执行前必须读取的文件

| 优先级 | 文件路径 | 读取原因 |
|--------|----------|----------|
| P0 | `src/modules/workflow/api/index.ts` | 确认 queryTodoTasks() / completeTask() 函数签名 |
| P0 | `src/contracts/bpm.ts` | 确认 TodoTask 接口字段 |
| P0 | `src/modules/form/views/FormDefList.vue` | 参考 StandardListTemplate 完整使用模式 |
| P0 | `src/components/page-layout/StandardListTemplate.vue` | 确认组件 props/slots 签名 |
| P0 | `src/components/page-layout/index.ts` | 确认 StandardListTemplate 导出路径 |
| P1 | `src/foundation/mock/handlers.ts` | 确认 mock handler 中 complete 操作会 mutate MOCK_TODO_TASKS |
| P1 | `src/modules/workflow/views/WorkflowHome.vue` | 确认目录重定向正确 |
| P2 | `src/foundation/request/index.ts` | 确认 ApiError 导入路径 |

## 7. 允许修改的文件范围

### 新建文件

| 文件 | 说明 |
|------|------|
| `src/modules/workflow/views/TodoList.vue` | 待办任务列表页（标准页面） |
| `src/modules/workflow/views/TodoList.spec.ts` | TodoList 组件测试 |

### 修改文件

无。Step 2 不修改任何已有文件。

## 8. 禁止修改的范围

- ❌ `src/foundation/mock/seeds.ts` — 种子数据已在 Step 1 创建，不动
- ❌ `src/foundation/mock/handlers.ts` — mock handler 已在 Step 1 创建，不动
- ❌ `src/modules/workflow/api/index.ts` — API 函数已在 Step 1 创建，不动
- ❌ `src/contracts/bpm.ts` — 契约已在 Step 1 创建，不动
- ❌ 所有后端 Java 文件 — 零后端改动
- ❌ `adapters/bpmn/` 和 `adapters/flow-graph/` — 保持 `throw Error('not implemented')`
- ❌ `foundation/request/` 和 `foundation/mock/index.ts` — 不动核心基础设施
- ❌ `foundation/mock/` 中除 seeds.ts/handlers.ts 外的任何文件
- ❌ `router/index.ts` — 无需静态路由，菜单驱动动态路由
- ❌ `components/page-layout/` — 不动页型组件本身
- ❌ 不需要创建任何 `utils/` 文件 — 待办任务没有复合状态逻辑

## 9. 详细执行方案

### 9.1 创建 TodoList.vue

**文件**：`src/modules/workflow/views/TodoList.vue`

遵循 FormDefList.vue 的 StandardListTemplate 模式，含以下关键实现细节：

**Script 部分**：

```typescript
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StandardListTemplate } from '@/components/page-layout'
import { queryTodoTasks, completeTask } from '@/modules/workflow/api'
import type { TodoTask } from '@/contracts/bpm'

// ─── 列表状态 ───
const list = ref<TodoTask[]>([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const approvingId = ref<string | null>(null)  // 当前正在审批的任务 ID（loading 态）

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// 因为后端返回平铺数组（不分页）， StandardListTemplate 需要 total/pageNum/pageSize
// 传 total=length, pageNum=1, pageSize=9999, 隐藏分页组件
const pageNum = ref(1)
const pageSize = ref(9999)

function formatTaskId(taskId: string): string {
  // 短显示：取后 8 字符
  return taskId.length > 8 ? `...${taskId.slice(-8)}` : taskId
}

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const tasks = await queryTodoTasks()
    list.value = tasks
    total.value = tasks.length
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

// 重要：应导入 ApiError
import { ApiError } from '@/foundation/request'

async function handleApprove(row: TodoTask) {
  // 防重复点击
  if (approvingId.value) return
  
  try {
    await ElMessageBox.confirm('确认审批通过此任务？', '审批确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'info',
    })
  } catch {
    return // 用户取消
  }

  approvingId.value = row.taskId
  try {
    await completeTask(row.taskId)
    ElMessage.success('审批通过')
    // 从列表中移除已审批的任务
    list.value = list.value.filter(t => t.taskId !== row.taskId)
    total.value = list.value.length
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('审批操作失败')
    }
  } finally {
    approvingId.value = null
  }
}

onMounted(loadList)
</script>
```

**Template 部分**：

```html
<template>
  <StandardListTemplate
    title="我的待办"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
  >
    <!-- 空态操作 -->
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
    <el-table v-loading="loading" :data="list" stripe style="width: 100%">
      <el-table-column label="任务编号" min-width="140">
        <template #default="{ row }">
          <span :title="row.taskId">{{ formatTaskId(row.taskId) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="formKey" label="表单标识" min-width="140" />
      <el-table-column prop="businessKey" label="业务单号" min-width="120" />
      <el-table-column prop="createTime" label="创建时间" min-width="170" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            :loading="approvingId === row.taskId"
            :disabled="approvingId !== null"
            @click="handleApprove(row)"
          >
            审批通过
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </StandardListTemplate>
</template>
```

**Style 部分（隐藏 StandardListTemplate 的分页组件，因为不分页）**：

```html
<style scoped>
:deep(.standard-list .list-pagination) {
  display: none;
}
</style>
```

**重要**：`style scoped` 中必须用 `:deep()` 穿透到 StandardListTemplate 内部隐藏分页。如果 StandardListTemplate 内部的分页容器没有独立 class，则使用 StandardListTemplate 的容器选择器或传递 `pageSize=9999` 让其自然不显示第二页。经验证，StandardListTemplate 中的 `<ListPagination>` 是独立组件，需要 CSS 隐藏。

**更优方案：不隐藏分页，而是在 v-if 条件中传递 pageSize=9999 配合 total=list.length，因为 ListPagination 当 total <= pageSize 时只显示「共 X 条」不显示页码，这样不需要 CSS hack。**

检查 `ListPagination.vue` 组件确认此行为。如 ListPagination 在 total <= pageSize 时自动隐藏页码按钮，则无需 CSS。若仍渲染分页 DOM，则加 CSS 隐藏。

### 9.2 创建 TodoList.spec.ts

**文件**：`src/modules/workflow/views/TodoList.spec.ts`

遵循 form 模块的测试模式（`api/index.spec.ts` 的 `vi.mock` + 动态 import 模式）。

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'

// Mock API 模块
vi.mock('@/modules/workflow/api', () => ({
  queryTodoTasks: vi.fn(),
  completeTask: vi.fn(),
}))

// Mock router — StandardListTemplate 不使用 router，但为了安全
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} }),
}))

// 导入被 mock 后的 API
const api = await import('@/modules/workflow/api')

// Mock ElMessage
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn(),
    },
  }
})

describe('TodoList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders title and loads tasks on mount', async () => {
    const mockTasks = [
      { taskId: 'mock-task-001', processInstanceId: 'p1', formKey: 'leave-request', businessKey: 'fd_001', createTime: '2026-07-10T09:15:00' },
      { taskId: 'mock-task-002', processInstanceId: 'p2', formKey: 'purchase-order', businessKey: 'fd_003', createTime: '2026-07-11T14:30:00' },
    ]
    vi.mocked(api.queryTodoTasks).mockResolvedValueOnce(mockTasks)

    const { default: TodoList } = await import('./TodoList.vue')
    const wrapper = mount(TodoList)

    // 等待异步加载
    await vi.dynamicImportSettled()

    expect(api.queryTodoTasks).toHaveBeenCalledOnce()
    // 验证任务渲染（检查 formKey 或 businessKey 出现在页面中）
    expect(wrapper.text()).toContain('leave-request')
    expect(wrapper.text()).toContain('purchase-order')
  })

  it('shows error message when API fails', async () => {
    vi.mocked(api.queryTodoTasks).mockRejectedValueOnce(new Error('Network error'))

    const { default: TodoList } = await import('./TodoList.vue')
    const wrapper = mount(TodoList)

    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('加载待办任务失败')
  })

  it('calls completeTask and removes task on approve', async () => {
    const mockTasks = [
      { taskId: 'mock-task-001', processInstanceId: 'p1', formKey: 'leave-request', businessKey: 'fd_001', createTime: '2026-07-10T09:15:00' },
    ]
    vi.mocked(api.queryTodoTasks).mockResolvedValueOnce(mockTasks)
    vi.mocked(api.completeTask).mockResolvedValueOnce(undefined)

    // Mock ElMessageBox.confirm to resolve (user confirms)
    const ElMessageBox = await import('element-plus')
    vi.mocked(ElMessageBox.confirm).mockResolvedValueOnce(undefined)

    const { default: TodoList } = await import('./TodoList.vue')
    const wrapper = mount(TodoList)

    await vi.dynamicImportSettled()
    
    // 点击审批通过按钮
    const approveBtn = wrapper.find('button')
    await approveBtn.trigger('click')

    await vi.dynamicImportSettled()

    expect(api.completeTask).toHaveBeenCalledWith('mock-task-001')
    expect(ElMessage.success).toHaveBeenCalledWith('审批通过')
    // 列表应变为空
    expect(wrapper.text()).not.toContain('leave-request')
  })

  it('does not call completeTask when user cancels confirm', async () => {
    const mockTasks = [
      { taskId: 'mock-task-001', processInstanceId: 'p1', formKey: 'leave-request', businessKey: 'fd_001', createTime: '2026-07-10T09:15:00' },
    ]
    vi.mocked(api.queryTodoTasks).mockResolvedValueOnce(mockTasks)

    // Mock ElMessageBox.confirm to reject (user cancels)
    const ElMessageBox = await import('element-plus')
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'))

    const { default: TodoList } = await import('./TodoList.vue')
    const wrapper = mount(TodoList)

    await vi.dynamicImportSettled()
    
    const approveBtn = wrapper.find('button')
    await approveBtn.trigger('click')

    await vi.dynamicImportSettled()

    expect(api.completeTask).not.toHaveBeenCalled()
  })
})
```

**注意**：以上测试代码的 `vi.dynamicImportSettled()` 是伪代码。实际应用中请验证正确的等待方式。可能的替代方案：
- 使用 `wrapper.vm.$nextTick()` 或 `await new Promise(r => setTimeout(r, 0))`
- 使用 `await vi.waitFor()`（如果 vitest 版本支持）
- 在 mount 前先 import 组件，用 `flushPromises` 或 `await new Promise(process.nextTick)`

**建议使用 `flushPromises` 模式**（vitest 推荐）：
```typescript
import { flushPromises } from '@vue/test-utils'

// 在每个 vi.mocked 调用后使用：
await flushPromises()
```

实际编写时请验证 flushPromises 是否在 `@vue/test-utils` 中可用（vitest 2.0+/vue-test-utils 2.4+），如不可用则使用 `await new Promise(resolve => setTimeout(resolve, 0))`。

## 10. 关键实现约束

### 10.1 渲染约束

- ✅ **使用 StandardListTemplate**：不得自建 `<div>` 容器，必须使用 `StandardListTemplate` 组件
- ✅ **不分页**：后端返回平铺数组，传 `total=list.length`、`pageNum=1`、`pageSize=9999`
- ✅ **四态覆盖**：必须处理 loading 态（`v-loading`）、error 态（`el-alert`）、empty 态（StandardListTemplate 的 `empty` prop）、正常列表态
- ✅ **审批按钮防重复点击**：使用 `approvingId` 控制按钮 `:loading` 和 `:disabled`，防止同一行多次点击
- ✅ **审批前确认**：使用 `ElMessageBox.confirm` 弹确认框，用户取消时终止操作
- ✅ **短任务编号**：`formatTaskId()` 显示后 8 字符，原值放在 `title` 属性中

### 10.2 数据约束

- ✅ **审批后刷新**：调用 `completeTask()` 成功后，从 `list.value` 中 filter 移除已审批项，**不重新调用 queryTodoTasks()**
- ✅ **错误处理**：API 调用失败时，区分 `ApiError`（显示 `err.msg`）和未知错误（固定文案）
- ❌ **不分页筛选**：不做搜索框、不做筛选栏、不做分类标签 — 后端未暴露筛选参数
- ❌ **不做拒绝按钮**：后端无 reject endpoint
- ❌ **不做详情跳转**：不做 `router.push` 到表单渲染页

### 10.3 代码规范约束

- ✅ **单一请求层**：通过 `@/modules/workflow/api` 调用，不直接使用 request/axios
- ✅ **导入路径**：使用 `@/` 别名，不使用相对路径
- ✅ **CSS token**：使用 `--sw-*` CSS 变量（如果自定义样式），不使用硬编码颜色值
- ✅ **TypeScript**：template 和 script 使用完整类型推导

## 11. 边界情况

| 场景 | 预期行为 |
|------|----------|
| 待办列表为空 | StandardListTemplate 显示空态占位，`empty` prop=true |
| API 返回网络错误 | `el-alert` 显示错误文案，el-table 不渲染 |
| API 抛出 ApiError | `el-alert` 显示 `err.msg` |
| 点击审批后 API 失败 | `ElMessage.error()` 显示错误，任务保留在列表中 |
| 审批按钮点击后快速再次点击 | `approvingId !== null` 时按钮 disabled，阻止二次请求 |
| 用户取消确认框 | 不调用 completeTask，按钮恢复正常态 |
| 任务编号过长 | `formatTaskId()` 切片显示，`title` 属性展示完整 id |
| 后端返回超长列表（100+ 条） | 全部显示在一页（pageSize=9999），不做虚拟滚动 |
| 后端返回空数组 `[]` | list.length=0 → empty 态 |
| 审批最后一个任务后列表为空 | list filter 后为空 → empty 态 |

## 12. 风险和回滚方案

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| StandardListTemplate 的分页组件在 pageSize=9999 时仍显示 | 中 | 低 — 显示多余 UI | 加 CSS `display:none` 隐藏；或在 StandardListTemplate 的 slot 中传空分页 |
| `flushPromises` 在测试环境中不可用 | 中 | 中 — 测试可能不稳定 | 使用 `await new Promise(r => setTimeout(r, 0))` 替代，必要时用 `vi.useFakeTimers()` |
| api/index.ts 的 `completeTask` 返回类型为 `void` 但 mock 时不匹配 | 低 | 低 — 类型错误可在 typecheck 时捕获 | mockResolvedValueOnce(undefined) 确保返回 undefined |
| ElMessageBox.confirm 的 mock 在组件 mount 前未就绪 | 低 | 低 — 测试失败 | 在 vi.mock 中完整 mock element-plus，或用 `setTimeout` 延迟 import |

**回滚方案**：删除 `TodoList.vue` 和 `TodoList.spec.ts`，检验 `pnpm typecheck` 和 `pnpm test` 恢复基线计数（331 tests）。

## 13. 测试方案

### 13.1 静态检查

- `grep -r "axios" src/modules/workflow/` → 零命中
- `grep -rn "todo-list\|TodoList" src/modules/workflow/views/TodoList.vue` — 确认导出的组件名

### 13.2 单元测试

| 测试用例 | 预期 |
|----------|------|
| 组件挂载后调用 queryTodoTasks() | `expect(api.queryTodoTasks).toHaveBeenCalledOnce()` |
| 正常渲染任务列表 | wrapper.text() 包含 formKey 值 |
| API 错误时显示错误消息 | 页面包含 "加载待办任务失败" |
| 点击审批通过按钮调用 completeTask | `expect(api.completeTask).toHaveBeenCalledWith(taskId)` |
| 审批通过后 ElMessage.success 被调用 | `expect(ElMessage.success).toHaveBeenCalledWith('审批通过')` |
| 审批通过后任务从列表移除 | 页面渲染不再包含该任务的 formKey |
| 用户取消确认框时不调用 completeTask | `expect(api.completeTask).not.toHaveBeenCalled()` |
| 空列表显示空态 | StandardListTemplate 的 empty prop=true |

### 13.3 集成测试

- `pnpm typecheck` — 类型检查，确保组件 prop 类型匹配
- `pnpm test` — 确认测试通过，总数增长（基线 334 + 新增 spec 测试 ≥ 4 → ≥ 338）

### 13.4 手工验证

运行 `pnpm dev:mock` 后手工验证：

1. 登录后侧边栏「流程引擎」→ 展开 → 点击「我的待办」
2. 页面标题显示「我的待办」
3. 表格显示 5 条待办任务（Mock 种子数据）
4. 显示列：任务编号、表单标识、业务单号、创建时间
5. 点击「审批通过」→ 弹出确认框 → 确定 → 任务从列表消失 + 「审批通过」提示
6. 连续审批所有 5 条 → 列表显示空态
7. 审批按钮在点击后显示 loading 动画，不可重复点击

### 13.5 回归检查

- `pnpm test` 通过数 ≥ 基线 331（Step 1 后基线为 334）
- 已有 form 模块测试无退化

## 14. 验收标准

| 编号 | 标准 | 验证方式 |
|------|------|----------|
| S2-1 | `src/modules/workflow/views/TodoList.vue` 已创建 | 文件存在 |
| S2-2 | `src/modules/workflow/views/TodoList.spec.ts` 已创建，≥ 4 个测试用例 | 文件存在，测试通过 |
| S2-3 | 组件使用 StandardListTemplate，不使用自建容器 | 代码审查 |
| S2-4 | 列表展示 taskId（短格式）、formKey、businessKey、createTime | 代码审查 |
| S2-5 | 每行有「审批通过」按钮，点击后弹出确认框 | 测试覆盖 |
| S2-6 | 审批确认后调用 completeTask()，任务从列表移除 | 测试覆盖 |
| S2-7 | API 错误时页面显示错误提示 | 测试覆盖 |
| S2-8 | 审批按钮有 loading/disabled 防重复机制 | 代码审查 + 测试覆盖 |
| S2-9 | `pnpm typecheck` 退出码 0 | 命令执行 |
| S2-10 | `pnpm lint` 退出码 0 | 命令执行 |
| S2-11 | `pnpm test` 退出码 0，测试总数 ≥ 338（基线 334 + 新增 ≥ 4） | 命令执行 |
| S2-12 | `pnpm build` 退出码 0 | 命令执行 |
| S2-13 | `grep -r "axios" src/modules/workflow/views/` 零命中 | grep 命令 |
| S2-14 | `pnpm dev:mock` 手工验证：菜单渲染 → 待办列表 → 审批交互 → 空态 | 人工肉眼验收 |

## 15. 执行回执格式

要求下级代理按以下格式返回：

```markdown
# 执行回执

## 1. Step 编号和名称
Step 2：待办任务列表页

## 2. 使用模型
（实际使用了哪个模型）

## 3. 实际读取的文件
（逐文件列出）

## 4. 实际修改的文件
- 新建：src/modules/workflow/views/TodoList.vue（XX 行）
- 新建：src/modules/workflow/views/TodoList.spec.ts（XX 行）

## 5. 每个文件的修改摘要
（每文件的改动点）

## 6. 实际执行的命令
（逐条列出，含完整参数和退出码）

## 7. 命令输出摘要
pnpm typecheck: exit code 0
pnpm lint: exit code 0, 0 error 0 warning
pnpm test: exit code 0, Test Files XX passed (XX), Tests XX passed (XX)
pnpm build: exit code 0

## 8. 与原方案的偏差
（如果有）

## 9. 遇到的问题
（如果有）

## 10. 未完成内容
（如果有）

## 11. 风险和注意事项
（如果有）

## 12. Git diff 摘要
（改动文件数、新增行数、删除行数）

## 13. 验收标准逐项对照
- S2-1 ✅ / ❌
- S2-2 ✅ / ❌
- ...（逐条列出）

## 14. 手工验证结果
pnpm dev:mock 验证：（通过/未验证/发现问题）
```

## 16. 测试回执格式

（此 Step 执行与测试合一，执行回执中已包含测试结果，无需单独测试回执）

## 17. 明确禁止事项

- ❌ 不要修改 `src/foundation/mock/seeds.ts` — 种子数据已在 Step 1 创建
- ❌ 不要修改 `src/foundation/mock/handlers.ts` — mock handler 已在 Step 1 创建
- ❌ 不要修改 `src/modules/workflow/api/index.ts` — API 函数已在 Step 1 创建
- ❌ 不要修改 `src/contracts/bpm.ts` — 契约已在 Step 1 创建
- ❌ 不要创建 `utils/` 文件 — 待办任务没有复合状态逻辑
- ❌ 不要添加搜索/筛选/分类功能 — 后端未暴露
- ❌ 不要添加拒绝按钮 — 后端无 reject endpoint
- ❌ 不要添加详情页跳转 — 非本 Step 范围
- ❌ 不要修改任何后端文件
- ❌ 不要修改 `adapters/bpmn/` 或 `adapters/flow-graph/`
- ❌ 不要修改 `router/index.ts`
- ❌ 不要修改 `components/page-layout/`
- ❌ 不要直接 import axios 或使用 `foundation/request`（应使用 `@/modules/workflow/api`）
- ❌ 不要使用 `pnpm dev` 代替 `pnpm dev:mock` 做手工验证
- ❌ 测试中不要使用真实 API 调用（必须 mock）
