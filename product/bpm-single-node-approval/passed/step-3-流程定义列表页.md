# Step 3：流程定义列表页

## 1. 当前状态

- **功能名称**：M04-F01-01 BPM 单节点审批前后端联通
- **功能状态**：IN_PROGRESS
- **功能进度**：Step 0a（后端基线）✅ · Step 0b（前端基线）✅ · Step 1（工作流基础设施）✅ · Step 2（待办列表页）✅
- **Step 位置**：第 3 步 / 共 4 步 — 在 Step 1（contracts + API + mock + menu）基础上构建**第二个业务页面**
- **前置 Step 完成情况**：Step 1 PASSED（contracts/API/mock/menu 就位），Step 2 PASSED（TodoList 页面就位）

## 2. Step 目标

创建「流程定义」列表页（`ProcessDefList.vue` + `ProcessDefList.spec.ts`），只读展示已有流程定义的分页列表，含状态标签（DRAFT / PUBLISHED）、流程标识、版本号等字段。可在 mock 模式下肉眼验收列表渲染和分页交互。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯前端单页面，严格遵循 FormDefList 已有的 StandardListTemplate 分页列表模式，与 Step 2 高度对称，属于有明确套路的机械实现
是否触发升级条件：否
```

## 4. 模型选择理由

与 Step 1/2 同属纯前端文件增改，页面模式（页型 B — 数据列表页 + 分页）在 form 模块已有完整参考（FormDefList.vue），ProcessDef 的状态标签映射与 FormDefStatus 完全对称（DRAFT/PUBLISHED → info/success），Flash 完全胜任。

## 5. 已知上下文

### 5.1 现有模式

- **分页列表（StandardListTemplate + ListPagination）**：`src/components/page-layout/StandardListTemplate.vue` — 组合 ListToolbar + ListFilterBar + ListTable/ListEmpty + ListPagination。分页组件始终渲染（ListPagination.vue 使用 el-pagination 无隐藏逻辑）。
- **参考文件**（必读）：
  - `src/modules/form/views/FormDefList.vue` — 完整分页 StandardListTemplate 使用示例，含状态列（el-tag）、loading/error/empty/list 四态
  - `src/modules/form/utils/form-def-status.ts` — 状态映射模式参考（DRAFT → info, PUBLISHED → success）
- **API 模式**：`src/modules/workflow/api/index.ts` — `pageProcessDefs(page: PageQuery)` 返回 `Promise<PageResult<ProcessDef>>`，内部 `adaptPage()` 已封装
- **mock handler**：`src/foundation/mock/handlers.ts` — 已有 `GET /api/workflow/defs` handler 支持分页参数（pageNum/pageSize），返回 `{ records, total, pageNum, pageSize }`

### 5.2 数据格式

```typescript
interface ProcessDef {
  id: number
  processKey: string     // "skeleton_approval"
  name: string           // "单节点审批流程"
  formKey: string        // "it_application"
  defVersion: number     // 1
  status: 'DRAFT' | 'PUBLISHED'
  createTime: string     // "2026-07-05 10:00:00"
  updateTime: string     // "2026-07-05 10:00:00"
}
```

**关键约束**：后端 `GET /workflow/defs` 返回分页格式，前端使用 `pageProcessDefs({ pageNum, pageSize })` 调用，StandardListTemplate 接收 `total`/`pageNum`/`pageSize` props 并 emit 分页事件。

### 5.3 菜单路由

流程定义页的 component 路径已在 Step 1 配置为 `workflow/views/ProcessDefList`，菜单项 id: '31'，path: 'workflow/defs'，parentId: '3'（流程引擎目录）。

### 5.4 状态映射

| 状态值 | 中文标签 | el-tag type |
|--------|----------|-------------|
| DRAFT | 草稿 | info |
| PUBLISHED | 已发布 | success |

与 FormDefStatus 完全一致，参考 `src/modules/form/utils/form-def-status.ts` 的模式。

## 6. 执行前必须读取的文件

| 优先级 | 文件路径 | 读取原因 |
|--------|----------|----------|
| P0 | `src/modules/workflow/api/index.ts` | 确认 pageProcessDefs() 函数签名 |
| P0 | `src/contracts/bpm.ts` | 确认 ProcessDef 接口字段（含 status 联合类型） |
| P0 | `src/modules/form/views/FormDefList.vue` | 参考分页 StandardListTemplate 完整使用模式 |
| P0 | `src/components/page-layout/StandardListTemplate.vue` | 确认组件 props/slots 签名 |
| P0 | `src/components/page-layout/ListPagination.vue` | 确认分页组件 emit 事件（update:pageNum / update:pageSize） |
| P0 | `src/components/page-layout/index.ts` | 确认 StandardListTemplate 导出路径 |
| P1 | `src/modules/form/utils/form-def-status.ts` | 参考状态映射模式（DRAFT→info, PUBLISHED→success） |
| P1 | `src/foundation/mock/handlers.ts` | 确认 mock handler 返回分页数据 |
| P1 | `src/foundation/mock/seeds.ts` | 确认 MOCK_PROCESS_DEFS 种子数据的字段 |
| P2 | `src/foundation/request/index.ts` | 确认 ApiError 导入路径 |

## 7. 允许修改的文件范围

### 新建文件

| 文件 | 说明 |
|------|------|
| `src/modules/workflow/views/ProcessDefList.vue` | 流程定义列表页（只读分页列表） |
| `src/modules/workflow/views/ProcessDefList.spec.ts` | ProcessDefList 组件测试 |

### 修改文件

无。Step 3 不修改任何已有文件。

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
- ❌ 不要创建 `workflow/utils/` 文件 — 状态映射可直接在组件中定义，流程定义页面只有这一个状态列
- ❌ 不要修改 `src/modules/workflow/views/TodoList.vue` — 已完成且通过测试

## 9. 详细执行方案

### 9.1 创建 ProcessDefList.vue

**文件**：`src/modules/workflow/views/ProcessDefList.vue`

严格遵循 FormDefList.vue 的分页 StandardListTemplate 模式。

**Script 部分**：

```typescript
<script setup lang="ts">
/**
 * ProcessDefList — 流程定义列表页（页型B）。
 *
 * 只读分页列表，套 StandardListTemplate。
 * 不提供创建/编辑/删除/发布操作（非本功能范围）。
 */
import { ref, computed, onMounted } from 'vue'
import { StandardListTemplate } from '@/components/page-layout'
import { pageProcessDefs } from '@/modules/workflow/api'
import type { ProcessDef } from '@/contracts/bpm'
import type { PageQuery } from '@/contracts/common'
import { ApiError } from '@/foundation/request'

// ─── 状态映射（与 FormDefStatus 完全对称） ───
const PROCESS_DEF_STATUS_MAP: Record<ProcessDef['status'], { label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  PUBLISHED: { label: '已发布', type: 'success' },
}

function getStatusLabel(status: ProcessDef['status']): string {
  return PROCESS_DEF_STATUS_MAP[status]?.label ?? status
}

function getStatusType(status: ProcessDef['status']): 'success' | 'warning' | 'info' | 'danger' {
  return PROCESS_DEF_STATUS_MAP[status]?.type ?? 'info'
}

// ─── 列表状态 ───
const list = ref<ProcessDef[]>([])
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
    const result = await pageProcessDefs(pageQuery)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载流程定义列表失败'
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

onMounted(loadList)
</script>
```

**Template 部分**：

```html
<template>
  <StandardListTemplate
    title="流程定义"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 空态操作（无操作按钮） -->
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
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="name" label="流程名称" min-width="160" />
      <el-table-column prop="processKey" label="流程标识" min-width="160" />
      <el-table-column prop="formKey" label="关联表单" min-width="140" />
      <el-table-column prop="defVersion" label="版本" width="80" align="center" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="180" />
    </el-table>
  </StandardListTemplate>
</template>
```

**Style 部分**：无自定义样式需求。StandardListTemplate 提供完整布局。

**完整文件最终结构**：

```
<script setup lang="ts">
  // imports
  // status map constants + helper functions
  // reactive state (list, total, pageNum, pageSize, loading, errorMsg)
  // computed: isEmpty
  // async: loadList()
  // handlers: handlePageNumChange, handlePageSizeChange
  // onMounted: loadList
</script>

<template>
  <StandardListTemplate ...>
    <template #empty-action>
    <el-alert v-if="errorMsg" ...>
    <el-table v-loading ...>
      <!-- name, processKey, formKey, defVersion, status(tag), updateTime -->
    </el-table>
  </StandardListTemplate>
</template>
```

### 9.2 创建 ProcessDefList.spec.ts

**文件**：`src/modules/workflow/views/ProcessDefList.spec.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'

// Mock API 模块
vi.mock('@/modules/workflow/api', () => ({
  pageProcessDefs: vi.fn(),
}))

// Mock router
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} }),
}))

const api = await import('@/modules/workflow/api')

describe('ProcessDefList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders title and loads defs on mount', async () => {
    const mockDefs = [
      { id: 1, processKey: 'sk', name: '单节点审批流程', formKey: 'it_application', defVersion: 1, status: 'PUBLISHED' as const, createTime: '2026-07-05 10:00:00', updateTime: '2026-07-05 10:00:00' },
      { id: 2, processKey: 'leave', name: '请假审批流程', formKey: 'leave-request', defVersion: 1, status: 'PUBLISHED' as const, createTime: '2026-07-08 14:20:00', updateTime: '2026-07-09 09:10:00' },
    ]
    vi.mocked(api.pageProcessDefs).mockResolvedValueOnce({
      list: mockDefs,
      total: 2,
      pageNum: 1,
      pageSize: 10,
    })

    const { default: ProcessDefList } = await import('./ProcessDefList.vue')
    const wrapper = mount(ProcessDefList)
    await flushPromises()

    expect(api.pageProcessDefs).toHaveBeenCalledOnce()
    expect(api.pageProcessDefs).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10 })
    expect(wrapper.text()).toContain('单节点审批流程')
    expect(wrapper.text()).toContain('请假审批流程')
  })

  it('renders status tags correctly', async () => {
    const mockDefs = [
      { id: 4, processKey: 'purchase_draft', name: '采购审批（草稿）', formKey: 'purchase-order', defVersion: 1, status: 'DRAFT' as const, createTime: '2026-07-12 08:00:00', updateTime: '2026-07-12 08:00:00' },
      { id: 1, processKey: 'sk', name: '已发布流程', formKey: 'it_application', defVersion: 1, status: 'PUBLISHED' as const, createTime: '', updateTime: '' },
    ]
    vi.mocked(api.pageProcessDefs).mockResolvedValueOnce({ list: mockDefs, total: 2, pageNum: 1, pageSize: 10 })

    const { default: ProcessDefList } = await import('./ProcessDefList.vue')
    const wrapper = mount(ProcessDefList)
    await flushPromises()

    // Verify DRAFT shows "草稿" tag
    expect(wrapper.text()).toContain('草稿')
    // Verify PUBLISHED shows "已发布" tag
    expect(wrapper.text()).toContain('已发布')
  })

  it('shows pagination and handles page change', async () => {
    const mockDefs = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      processKey: `pk_${i + 1}`,
      name: `流程 ${i + 1}`,
      formKey: 'fk',
      defVersion: 1,
      status: 'PUBLISHED' as const,
      createTime: '',
      updateTime: '',
    }))
    vi.mocked(api.pageProcessDefs).mockResolvedValueOnce({ list: mockDefs, total: 15, pageNum: 1, pageSize: 10 })

    const { default: ProcessDefList } = await import('./ProcessDefList.vue')
    const wrapper = mount(ProcessDefList)
    await flushPromises()

    // 第 2 页
    vi.mocked(api.pageProcessDefs).mockResolvedValueOnce({ list: [mockDefs[0]], total: 15, pageNum: 2, pageSize: 10 })
    
    // Simulate page change — 找到分页组件并触发 update:pageNum
    // 由于 el-pagination 在 jsdom 中可能不易触发，可以直接调用 component 内部方法
    // 通过 findComponent 找 StandardListTemplate 然后触发事件
    const stl = wrapper.findComponent({ name: 'StandardListTemplate' })
    stl.vm.$emit('update:pageNum', 2)
    await flushPromises()

    expect(api.pageProcessDefs).toHaveBeenCalledWith({ pageNum: 2, pageSize: 10 })
  })

  it('shows error message when API fails', async () => {
    vi.mocked(api.pageProcessDefs).mockRejectedValueOnce(new Error('Network error'))

    const { default: ProcessDefList } = await import('./ProcessDefList.vue')
    const wrapper = mount(ProcessDefList)
    await flushPromises()

    expect(wrapper.text()).toContain('加载流程定义列表失败')
  })
})
```

**测试注意事项**：

1. **`flushPromises`**：来自 `@vue/test-utils`，确保所有异步操作完成。如果在当前版本中不可用，使用 `await new Promise(resolve => setTimeout(resolve, 0))` 替代。
2. **`status: 'DRAFT' as const`**：TypeScript 断言确保 status 字面量类型匹配 `ProcessDef['status']`。
3. **分页测试**：el-pagination 在 jsdom 中触发事件可能受限，建议通过 wrapper 内部的 vm 或 findComponent 手动触发 update 事件。
4. **总测试计数**：Step 3 新增 4 个测试用例（1 挂载+渲染、1 状态标签、1 分页、1 错误），基线从 Step 2 后的计数 +4。

## 10. 关键实现约束

### 10.1 渲染约束

- ✅ **使用 StandardListTemplate**：必须使用 StandardListTemplate 组件，不得自建容器
- ✅ **分页**：使用 ListPagination（由 StandardListTemplate 内置），处理 `update:pageNum` 和 `update:pageSize` 事件
- ✅ **四态覆盖**：loading 态（`v-loading`）、error 态（`el-alert`）、empty 态（`empty` prop）、正常列表态
- ✅ **状态标签列**：使用 `el-tag` + `getStatusLabel`/`getStatusType` 辅助函数，DRAFT → info / 草稿，PUBLISHED → success / 已发布
- ✅ **只读**：无操作列（无查看/编辑/删除/新建按钮），列定义仅为展示

### 10.2 数据约束

- ✅ **分页查询**：初始加载 `pageNum=1, pageSize=10`，翻页时更新参数重新调用 `pageProcessDefs()`
- ✅ **错误处理**：API 失败时区分 `ApiError`（显示 `err.msg`）和未知错误（固定文案）
- ❌ **不做搜索/筛选**：后端未暴露搜索参数
- ❌ **不做创建/编辑/删除**：本 Step 只读展示
- ❌ **不做发布/取消发布操作**：出本功能范围

### 10.3 代码规范约束

- ✅ **单一请求层**：通过 `@/modules/workflow/api` 调用
- ✅ **导入路径**：使用 `@/` 别名
- ✅ **CSS token**：如自定义样式使用 `--sw-*` 变量
- ✅ **TypeScript**：完整类型推导（`ProcessDef['status']` 用于状态映射 key）

## 11. 边界情况

| 场景 | 预期行为 |
|------|----------|
| 列表为空（total=0） | StandardListTemplate 显示空态占位，empty prop=true |
| API 返回网络错误 | el-alert 显示错误文案 |
| API 抛出 ApiError | el-alert 显示 err.msg |
| 翻页到最后一页（共 5 条，pageSize=10 → 1 页） | 分页正确显示总页数 = 1 |
| 从第 2 页切换 pageSize（20→10） | pageNum 重置为 1，重新查询 |
| 种子数据只有 5 条，pageSize=10 | 分页显示 1 页，共 5 条 |
| status 字段为 undefined（数据异常） | getStatusLabel/getStatusType 兜底回退 status 原值 / 'info' |

## 12. 风险和回滚方案

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| el-pagination 在 jsdom 中无法触发 @update:pageNum | 中 | 中 — 测试无法覆盖翻页 | 分页测试改用 `wrapper.vm.handlePageNumChange(2)` 或 findComponent 触发 emit |
| `flushPromises` 在 @vue/test-utils 中不可用 | 中 | 低 — 异步测试可能不稳定 | 降级到 `await new Promise(r => setTimeout(r, 0))` |
| `status: 'DRAFT' as const` 满足类型但 mock 数据缺少字段 | 低 | 低 — typecheck 捕获 | mock 数据包含 ProcessDef 所有必填字段 |

**回滚方案**：删除 `ProcessDefList.vue` 和 `ProcessDefList.spec.ts`，检验 `pnpm typecheck` 和 `pnpm test` 恢复基线计数。

## 13. 测试方案

### 13.1 静态检查

- `grep -r "axios" src/modules/workflow/views/ProcessDefList.vue` → 零命中
- `grep -rn "process-def-list\|ProcessDefList" src/modules/workflow/views/ProcessDefList.vue` — 确认组件导出名

### 13.2 单元测试

| 测试用例 | 预期 |
|----------|------|
| 组件挂载后调用 pageProcessDefs({ pageNum: 1, pageSize: 10 }) | toHaveBeenCalledWith({ pageNum: 1, pageSize: 10 }) |
| 正常渲染流程名称列 | wrapper.text() 包含 name 值 |
| DRAFT 状态渲染「草稿」标签 | wrapper.text() 包含「草稿」|
| PUBLISHED 状态渲染「已发布」标签 | wrapper.text() 包含「已发布」|
| 翻页时重新调用 pageProcessDefs | toHaveBeenCalledWith({ pageNum: 2, pageSize: 10 }) |
| API 错误时显示错误消息 | wrapper.text() 包含「加载流程定义列表失败」|
| 空列表显示空态 | empty prop=true 传递给 StandardListTemplate |

### 13.3 集成测试

- `pnpm typecheck` — 类型检查通过
- `pnpm test` — 确认测试通过，总数增长（基线 + 新增 spec 测试 ≥ 4 → ≥ 基线+4）

### 13.4 手工验证

运行 `pnpm dev:mock` 后手工验证：

1. 登录后侧边栏「流程引擎」→ 展开 → 点击「流程定义」
2. 页面标题显示「流程定义」
3. 表格显示 5 条流程定义（Mock 种子数据）
4. 显示列：流程名称、流程标识、关联表单、版本、状态（el-tag）、更新时间
5. DRAFT 状态显示灰色「草稿」标签，PUBLISHED 状态显示绿色「已发布」标签
6. 分页区域显示「共 5 条」（因 pageSize=10 > total=5，仅显示条数不显示页码）
7. 修改 seeds.ts 中 MOCK_PROCESS_DEFS 条数到 ≥ 11，验证分页页码出现、翻页正常

### 13.5 回归检查

- `pnpm test` 通过数 ≥ 基线（Step 1 后基线为 334，Step 2 后基线为 ≥ 338）
- 已有 form 模块测试无退化
- Step 2 待办列表页测试仍在通过

## 14. 验收标准

| 编号 | 标准 | 验证方式 |
|------|------|----------|
| S3-1 | `src/modules/workflow/views/ProcessDefList.vue` 已创建 | 文件存在 |
| S3-2 | `src/modules/workflow/views/ProcessDefList.spec.ts` 已创建，≥ 4 个测试用例 | 文件存在，测试通过 |
| S3-3 | 组件使用 StandardListTemplate，展示 name/processKey/formKey/defVersion/status/updateTime | 代码审查 |
| S3-4 | 状态列使用 el-tag，DRAFT=info/草稿，PUBLISHED=success/已发布 | 代码审查 + 测试覆盖 |
| S3-5 | 列表支持分页（update:pageNum / update:pageSize 事件处理） | 代码审查 + 测试覆盖 |
| S3-6 | API 错误时页面显示错误提示 | 测试覆盖 |
| S3-7 | 无操作列（编辑/删除/新建都不存在） | 代码审查 |
| S3-8 | `pnpm typecheck` 退出码 0 | 命令执行 |
| S3-9 | `pnpm lint` 退出码 0 | 命令执行 |
| S3-10 | `pnpm test` 退出码 0，测试总数 ≥ Step 2 后基线 + 4 | 命令执行 |
| S3-11 | `pnpm build` 退出码 0 | 命令执行 |
| S3-12 | `grep -r "axios" src/modules/workflow/views/` 零命中 | grep 命令 |
| S3-13 | `pnpm dev:mock` 手工验证：菜单渲染 → 定义列表 → 状态标签颜色 → 分页行为 | 人工肉眼验收 |

## 15. 执行回执格式

```markdown
# 执行回执

## 1. Step 编号和名称
Step 3：流程定义列表页

## 2. 使用模型
（实际使用了哪个模型）

## 3. 实际读取的文件
（逐文件列出）

## 4. 实际修改的文件
- 新建：src/modules/workflow/views/ProcessDefList.vue（XX 行）
- 新建：src/modules/workflow/views/ProcessDefList.spec.ts（XX 行）

## 5. 每个文件的修改摘要

## 6. 实际执行的命令
pnpm typecheck → exit code 0
pnpm lint → exit code 0, 0 error 0 warning
pnpm test → exit code 0, Test Files XX passed, Tests XX passed
pnpm build → exit code 0

## 7. 与原方案的偏差

## 8. 遇到的问题

## 9. 未完成内容

## 10. 风险和注意事项

## 11. 验收标准逐项对照
S3-1 ✅ / ❌
...（逐条）

## 12. 手工验证结果
pnpm dev:mock 验证：（通过/未验证/发现问题）
```

## 16. 测试回执格式

（此 Step 执行与测试合一，执行回执中已包含测试结果）

## 17. 明确禁止事项

- ❌ 不要修改 `src/foundation/mock/seeds.ts` — 种子数据已在 Step 1 创建
- ❌ 不要修改 `src/foundation/mock/handlers.ts` — mock handler 已在 Step 1 创建
- ❌ 不要修改 `src/modules/workflow/api/index.ts` — API 函数已在 Step 1 创建
- ❌ 不要修改 `src/contracts/bpm.ts` — 契约已在 Step 1 创建
- ❌ 不要修改 `src/modules/workflow/views/TodoList.vue` — 已完成且通过测试
- ❌ 不要创建 `workflow/utils/` 文件 — 状态映射可直接在组件中定义
- ❌ 不要添加创建/编辑/删除/发布操作按钮
- ❌ 不要添加搜索/筛选功能
- ❌ 不要添加操作列
- ❌ 不要修改任何后端文件
- ❌ 不要修改 `adapters/bpmn/` 或 `adapters/flow-graph/`
- ❌ 不要修改 `router/index.ts`
- ❌ 不要修改 `components/page-layout/`
- ❌ 不要直接 import axios 或使用 `foundation/request`（应使用 `@/modules/workflow/api`）
