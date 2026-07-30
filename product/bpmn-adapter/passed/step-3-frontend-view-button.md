# Step 3：前端 ProcessDefList 新增"查看流程图"入口

## 1. 当前状态

- **功能**：bpmn-adapter（BPMN 查看器防腐层 + 后端 XML 端点 + 前端消费入口）
- **整体进度**：Step 0/1/2 均已 PASSED，Step 3/4 为 PENDING
- **前置依赖**：
  - Step 1（前端 bpmn viewer 防腐层 `mountBpmnViewer`）— PASSED ✅
  - Step 2（后端 `GET /workflow/defs/{id}/bpmn-xml` 端点）— PASSED ✅
- **本 Step 定位**：前端消费 Step 1 + Step 2 的产物，打通「列表点击 → 请求 XML → 渲染流程图」的端到端链路

## 2. Step 目标

在 `ProcessDefList.vue`（流程定义列表页）新增操作列"查看流程图"按钮，点击后弹窗内调用 `GET /workflow/defs/{id}/bpmn-xml` 获取 BPMN XML，使用 `mountBpmnViewer` 渲染只读流程图。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：单文件前端改动 + 一个 API 函数新增 + 一个 mock handler，无跨项目联动、无复杂架构决策
是否触发升级条件：否

## 4. 模型选择理由

纯前端改动，范围明确（1 个现有组件 + 1 个 API 文件 + 1 个 mock 文件 + 1 个新建测试文件），不涉及协议设计、数据库变更、权限模型或跨项目协调。所有依赖（bpmn viewer 防腐层、后端端点）均已就绪且验证通过。

## 5. 已知上下文

- **UI 库**：Element Plus 2.14+，`el-button`/`el-dialog`/`el-table-column` 等组件通过 `unplugin-vue-components` 自动按需导入，`modules/*` 下的 `.vue` 文件**不需要显式 import Element Plus 组件**
- **HTTP 客户端**：`request<T>(config)` from `@/foundation/request`，自动解包 `ApiResponse<T>` → `T`，错误时抛出 `ApiError`（含 `code` 和 `msg`）
- **流程定义数据类型**：`ProcessDef { id: number, processKey: string, name: string, formKey: string, defVersion: number, status: 'DRAFT' | 'PUBLISHED', createTime: string, updateTime: string }` from `@/contracts/bpm`
- **BPMN viewer 防腐层**：`mountBpmnViewer(container: HTMLElement, xml: string, events?: BpmnViewerEvents): Promise<BpmnViewerInstance>` from `@/adapters/bpmn`，返回 `{ destroy(), fitViewport(), highlight(), clearHighlight() }`
- **后端端点**：`GET /workflow/defs/{id}/bpmn-xml` → `R<String>`（原始 BPMN XML 字节），未发布时返回 `code=2104 (PROCESS_NOT_PUBLISHED)`
- **对话框模式**：项目中 `UserList.vue` 使用 `el-dialog` + `destroy-on-close` + `@closed` 事件清理，为既有成熟模式
- **ProcessDefList 当前无操作列**：现有 6 列（名称/标识/关联表单/版本/状态/更新时间），需新增第 7 列"操作"
- **ProcessDefList 使用 `StandardListTemplate` 包裹**，`<script setup lang="ts">` 语法
- **测试文件**：当前 `ProcessDefList.spec.ts` 不存在（该组件尚无单元测试）

## 6. 执行前必须读取的文件

按优先级排序：

| # | 文件路径（相对于 `Smart-WorkFlow-Web/`） | 读取目的 |
|---|------|------|
| 1 | `src/modules/workflow/views/ProcessDefList.vue` | 理解当前组件结构、插槽、数据源、需插入按钮的确切位置 |
| 2 | `src/modules/workflow/api/index.ts` | 理解现有 API 函数签名、`request<T>` 调用模式、需插入新函数的位置 |
| 3 | `src/adapters/bpmn/index.ts` | 确认 `mountBpmnViewer` 签名、`BpmnViewerInstance`/`BpmnViewerEvents` 类型导出 |
| 4 | `src/foundation/mock/handlers.ts` | 理解既有 mock 处理器模式、确认 `/workflow/defs` 分页 mock 位置、新增 `/workflow/defs/:id/bpmn-xml` mock 的插入位置 |
| 5 | `src/foundation/mock/seeds.ts` | 确认 `MOCK_PROCESS_DEFS` 数组结构与字段，用于构建有意义的 mock XML 返回 |
| 6 | `src/contracts/bpm.ts` | 确认 `ProcessDef` 接口定义 |
| 7 | `src/modules/system/views/UserList.vue` | 参考项目中 `el-dialog` 的标准使用模式（属性、事件、清理方式） |

## 7. 允许修改的文件范围

| 文件路径（相对于 `Smart-WorkFlow-Web/`） | 修改类型 | 说明 |
|------|:---:|------|
| `src/modules/workflow/views/ProcessDefList.vue` | 修改 | 新增操作列 + 对话框 + 查看器逻辑 |
| `src/modules/workflow/api/index.ts` | 修改 | 新增 `getProcessDefGraph(id)` API 函数 |
| `src/foundation/mock/handlers.ts` | 修改 | 新增 `GET /api/workflow/defs/:id/bpmn-xml` mock |
| `src/modules/workflow/views/__tests__/ProcessDefList.spec.ts` | **新建** | 单元测试（按钮渲染、对话框打开/关闭、错误处理、DRAFT 禁用） |

## 8. 禁止修改的范围

- ❌ **禁止**修改 `src/adapters/bpmn/index.ts`（Step 1 产物，已 PASSED 归档，不可回改）
- ❌ **禁止**修改 `src/adapters/bpmn/index.spec.ts`
- ❌ **禁止**修改后端 `Smart-WorkFlow/` 任何文件
- ❌ **禁止**修改 `package.json` / `pnpm-lock.yaml`（无需新增依赖）
- ❌ **禁止**修改 `vite.config.ts` / `tsconfig.json` / `eslint.config.js`
- ❌ **禁止**修改 `src/router/` 路由配置
- ❌ **禁止**修改 `src/foundation/mock/seeds.ts`（只读引用，不修改其中的 mock 数据）
- ❌ **禁止**修改 `src/contracts/bpm.ts`（ProcessDef 类型定义已足够，不新增字段）
- ❌ **禁止**修改 `src/modules/workflow/` 下除 ProcessDefList.vue 和 api/index.ts 以外的任何文件
- ❌ **禁止**新建独立组件文件（如 `ProcessDefViewer.vue`）— 查看器逻辑内联在 ProcessDefList.vue 的对话框中，不单独抽取

## 9. 详细执行方案

### 9.1 新增 API 函数：`getProcessDefGraph`

**文件**：`src/modules/workflow/api/index.ts`

在 `pageProcessDefs` 函数之后新增：

```typescript
/**
 * 获取流程定义已部署的原始 BPMN XML 流程图
 * @param id 流程定义 ID
 * @returns BPMN XML 字符串
 */
export async function getProcessDefGraph(id: number): Promise<string> {
  return request<string>({
    method: 'GET',
    url: `/workflow/defs/${id}/bpmn-xml`,
  })
}
```

- 返回类型 `Promise<string>` — `request<T>` 已自动解包 `R<T>` → `T`，不需要手动提取 `.data`
- 错误时 `request` 抛出 `ApiError`（含 `code: number` 和 `msg: string`），调用方 try-catch 处理
- 放在 `pageProcessDefs` 下方（与该文件其他函数保持一致的排版间距）

### 9.2 新增 Mock 处理器

**文件**：`src/foundation/mock/handlers.ts`

在 `/workflow/defs` 的 mock 之后新增：

```typescript
http.get('/api/workflow/defs/:id/bpmn-xml', ({ params }) => {
  const defId = Number(params.id)
  const def = MOCK_PROCESS_DEFS.find(d => d.id === defId)
  if (!def || def.status === 'DRAFT') {
    return new HttpResponse(null, {
      status: 200,
      body: JSON.stringify({
        code: 2104,
        message: '流程定义未发布，无法获取流程图',
        data: null,
      }),
    })
  }
  // 返回一个最简合法的 BPMN 2.0 XML（含 StartEvent + EndEvent）
  const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="${def.processKey}" name="${def.name}" isExecutable="true">
    <startEvent id="StartEvent_1" name="开始" />
    <endEvent id="EndEvent_1" name="结束" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${def.processKey}">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="80" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="400" y="80" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="flow1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="98" />
        <di:waypoint x="400" y="98" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`
  return new HttpResponse(JSON.stringify({ code: 0, message: 'ok', data: bpmnXml }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}),
```

**注意**：
- Mock 需要 import `MOCK_PROCESS_DEFS` from `../seeds`（检查 handlers.ts 顶部是否已有此 import；若无则新增）
- Mock 需要 import `HttpResponse` from `msw`（检查 handlers.ts 顶部是否已有；若无则新增）
- BPMN XML 中包含 `BPMNEdge`（连线）使渲染效果更完整（StartEvent → EndEvent），与 Step 2 集成测试中仅验证 StartEvent_1/EndEvent_1 的往返不同——mock 场景下数据由我们控制，多一条连线不影响正确性
- DRAFT 状态返回 `code: 2104` 模拟后端真实行为

### 9.3 修改 ProcessDefList.vue

#### 9.3.1 新增 imports

在 `<script setup lang="ts">` 顶部现有 import 之后添加：

```typescript
import { ref, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { mountBpmnViewer } from '@/adapters/bpmn'
import type { BpmnViewerInstance } from '@/adapters/bpmn'
import { getProcessDefGraph } from '@/modules/workflow/api'
import type { ProcessDef } from '@/contracts/bpm'
```

**注意**：
- 检查现有 import 是否已从 `vue` 导入 `ref`；若已导入则只补充 `nextTick` 和 `computed`
- `ElMessage` 需要显式 import（Element Plus 的 message 函数不在自动导入范围内）
- `ProcessDef` 类型可能已在文件中导入（检查后按实际情况合并，不重复导入）

#### 9.3.2 新增响应式状态

在现有 `const pageResult = ref<PageResult<ProcessDef>>(...)` 之后新增：

```typescript
// 查看流程图对话框
const viewerVisible = ref(false)
const viewerLoading = ref(false)
const viewerError = ref('')
const currentDefName = ref('')
const bpmnContainerRef = ref<HTMLElement | null>(null)
let viewerInstance: BpmnViewerInstance | null = null
```

**注意**：
- `viewerInstance` 用 `let` 而非 `ref`——它是 bpmn-js 内部对象，不需要 Vue 响应式追踪；在 `destroy()` 后必须置 `null` 防止重复清理
- `bpmnContainerRef` 是模板 ref，模板中 `<div :ref="(el) => bpmnContainerRef = el as HTMLElement">` 或使用 `ref="bpmnContainerRef"` 直接绑定

#### 9.3.3 新增查看器逻辑函数

在 `loadList` 函数之后新增：

```typescript
/** 打开查看流程图对话框 */
async function openViewer(row: ProcessDef) {
  currentDefName.value = row.name
  viewerVisible.value = true
  viewerLoading.value = true
  viewerError.value = ''

  // 等待 DOM 更新后容器元素就位
  await nextTick()

  try {
    const xml = await getProcessDefGraph(row.id)
    if (!bpmnContainerRef.value) {
      viewerError.value = '渲染容器未找到'
      return
    }
    viewerInstance = await mountBpmnViewer(bpmnContainerRef.value, xml)
    // bpmn-js 渲染完成后自适应画布
    await nextTick()
    viewerInstance.fitViewport()
  } catch (e: any) {
    // ApiError：后端业务错误（如未发布 2104）
    // 其他 Error：网络错误 / bpmn-js importXML 解析失败
    viewerError.value = e?.msg || e?.message || '流程图加载失败'
  } finally {
    viewerLoading.value = false
  }
}

/** 关闭对话框并清理 bpmn viewer 实例 */
function closeViewer() {
  if (viewerInstance) {
    viewerInstance.destroy()
    viewerInstance = null
  }
  viewerVisible.value = false
  viewerError.value = ''
  viewerLoading.value = false
}
```

**注意**：
- `openViewer` 接收整行 `row: ProcessDef` 而非仅 id——用于设置对话框标题（显示流程名称）
- `nextTick` 在 `viewerVisible = true` 之后调用，确保 `v-if` 或 `el-dialog` 的 DOM 已渲染、容器 div 已挂载，再传给 `mountBpmnViewer`
- `fitViewport()` 前再调一次 `nextTick`——`mountBpmnViewer` 内部的 `importXML` 是异步的，bpmn-js 完成 SVG 渲染后才适合自适应缩放
- catch 块中 `e?.msg` 对应 `ApiError`（后端统一错误响应），`e?.message` 对应普通 `Error`（网络/解析失败）
- `closeViewer` 中先 `destroy()` 再重置状态——防止 `destroy-on-close` 在 bpmn-js 内部 SVG 事件监听器未解绑时触发导致内存泄漏

#### 9.3.4 模板修改

##### A. 新增操作列

在 `<el-table-column label="更新时间" ...>` 之后新增：

```vue
<el-table-column label="操作" width="120" fixed="right">
  <template #default="{ row }">
    <el-button
      size="small"
      link
      type="primary"
      :disabled="row.status === 'DRAFT'"
      @click="openViewer(row)"
    >
      查看流程图
    </el-button>
  </template>
</el-table-column>
```

**注意**：
- `row` 的类型是 `ProcessDef`（从 `pageResult.list` 推导），有 `status: 'DRAFT' | 'PUBLISHED'` 字段
- DRAFT 状态下按钮禁用但**不显示额外 tooltip**（保持简洁；DRAFT 不可查看是流程定义的常识性约束）
- `fixed="right"` 保证操作列在表格横向滚动时始终可见
- `link` 属性使按钮呈现为文字链接样式，与项目中 `FormDefList.vue` 编辑按钮风格一致

##### B. 新增查看流程图对话框

在 `</StandardListTemplate>` 闭合标签**之前**（即作为 StandardListTemplate 默认插槽的最后一个子元素）新增：

```vue
<!-- 查看流程图对话框 -->
<el-dialog
  v-model="viewerVisible"
  :title="`流程图 - ${currentDefName}`"
  :close-on-click-modal="false"
  destroy-on-close
  width="900px"
  @closed="closeViewer"
>
  <div
    v-loading="viewerLoading"
    style="min-height: 400px; display: flex; align-items: center; justify-content: center;"
  >
    <!-- 错误提示 -->
    <el-result
      v-if="viewerError"
      icon="error"
      :title="viewerError"
      :sub-title="'请确认流程定义已发布且 BPMN XML 有效'"
    />
    <!-- BPMN 渲染容器（正常状态，隐藏的 canvas） -->
    <div
      v-show="!viewerError && !viewerLoading"
      ref="bpmnContainerRef"
      style="width: 100%; min-height: 500px;"
    />
  </div>
</el-dialog>
```

**注意**：
- 对话框宽度 `900px`——BPMN 图通常横向展开，比典型表单对话框（680px）更宽
- `destroy-on-close` + `@closed="closeViewer"`：关闭时先调用 `viewerInstance.destroy()` 清理 bpmn-js 内部 SVG 监听器，再由 `destroy-on-close` 销毁 DOM
- `v-loading="viewerLoading"` 是 Element Plus 指令（`v-loading` 已通过 `unplugin-auto-import` 在 `ElementPlusResolver` 中注册，无需显式导入）
- 容器 div 使用 `v-show` 而非 `v-if`——`v-show` 保证 DOM 始终存在（`ref="bpmnContainerRef"` 能正确绑定），但在加载中/出错时隐藏渲染区域
- `bpmnContainerRef` 绑定：由于 `<script setup>` 中 `ref<HTMLElement | null>(null)` 的变量名 `bpmnContainerRef` 与模板 `ref="bpmnContainerRef"` 一致，Vue 自动完成 ref 绑定，**不需要** `:ref="(el) => bpmnContainerRef = el as HTMLElement"`
- `min-height: 500px` 给 bpmn-js 足够的垂直空间渲染

### 9.4 新建测试文件

**文件**：`src/modules/workflow/views/__tests__/ProcessDefList.spec.ts`

**新建**测试文件（该路径下当前无此文件）。测试结构：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProcessDefList from '@/modules/workflow/views/ProcessDefList.vue'

// Mock API 调用
vi.mock('@/modules/workflow/api', () => ({
  pageProcessDefs: vi.fn().mockResolvedValue({
    list: [
      { id: 1, processKey: 'leave', name: '请假流程', formKey: 'form_001', defVersion: 1, status: 'PUBLISHED', createTime: '2026-01-01', updateTime: '2026-01-02' },
      { id: 2, processKey: 'expense', name: '报销流程', formKey: '', defVersion: 2, status: 'DRAFT', createTime: '2026-01-01', updateTime: '2026-01-01' },
    ],
    total: 2,
    pageNum: 1,
    pageSize: 10,
  }),
  getProcessDefGraph: vi.fn().mockResolvedValue('<definitions>...</definitions>'),
}))

// Mock bpmn adapter
const mockDestroy = vi.fn()
const mockFitViewport = vi.fn()
vi.mock('@/adapters/bpmn', () => ({
  mountBpmnViewer: vi.fn().mockResolvedValue({
    destroy: mockDestroy,
    fitViewport: mockFitViewport,
    highlight: vi.fn(),
    clearHighlight: vi.fn(),
  }),
}))
```

测试用例（至少覆盖以下场景）：

| # | 测试用例 | 预期行为 |
|---|------|------|
| 1 | 列表渲染操作列和"查看流程图"按钮 | 按钮存在，PUBLISHED 行启用，DRAFT 行 `disabled` |
| 2 | 点击 PUBLISHED 行的"查看流程图" | 对话框打开，标题含流程名称，`getProcessDefGraph` 被调用 |
| 3 | 点击后 mountBpmnViewer 被调用 | 传入容器元素和 XML 字符串 |
| 4 | 点击后 fitViewport 被调用 | 在 mountBpmnViewer resolve 之后调用 |
| 5 | API 返回错误时显示错误提示 | `el-result` error 状态渲染，含错误消息 |
| 6 | 关闭对话框时 destroy 被调用 | `mockDestroy` 被调用一次 |
| 7 | DRAFT 行按钮 disabled | `el-button` 的 `disabled` 属性为 `true`，点击不触发 openViewer |

**注意**：
- `el-dialog` 在 jsdom 中需要 stub：定义 `'el-dialog': { template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>', props: ['modelValue', 'title', 'destroyOnClose', 'closeOnClickModal', 'width'] }` 在 `mount` 的 `global.stubs` 中
- `el-table` / `el-table-column` 同理需要 stub（或使用 Element Plus 的完整 mount 方式）
- `v-loading` 指令在 jsdom 中不渲染，不强制断言 loading DOM 状态
- `bpmnContainerRef` 在 jsdom 中是普通 div 元素，传给 mock 的 `mountBpmnViewer` 不会被 mock 拒绝

### 9.5 校验门（四连）

按前端校验门流程执行：

```bash
pnpm typecheck   # TypeScript 类型检查，不得新增类型错误
pnpm lint        # ESLint（含架构边界规则），不得新增 lint 告警
pnpm test        # Vitest 单元测试，所有测试（含新增）通过
pnpm build       # 生产构建，Vite 构建成功
```

## 10. 关键实现约束

1. **`bpmnContainerRef` 绑定方式**：使用模板 `ref="bpmnContainerRef"` --- `<script setup>` 中同名 ref 变量自动完成绑定，**不要使用** `:ref="(el) => ..."` 函数形式
2. **对话框清理顺序**：`@closed` 事件中先调用 `viewerInstance.destroy()` 再重置状态，**不要在** `v-model` watcher 中清理（`destroy-on-close` 先于 `@closed` 触发 DOM 销毁，顺序反了会导致 destroy 操作已销毁的 DOM）
3. **`viewerInstance` 不用 `ref()` 包裹**：用普通 `let` 变量——bpmn-js 内部状态不需要 Vue 响应式追踪，包裹反而可能导致 proxy 陷阱干扰 bpmn-js 内部 this 绑定
4. **不引入新依赖**：bpmn-js `^18.18.0` 已在 Step 1 安装，Element Plus 已就位，不新增/升级任何 npm 包
5. **Mock 返回合法 BPMN XML**：mock XML 必须是合法的 BPMN 2.0 XML（含 `<definitions>` 根元素 + `<process>` + 至少一个 BPMN 元素），否则 `bpmn-js` 的 `importXML` 会 reject
6. **API 函数返回 `Promise<string>`**（不是 `Promise<R<string>>`）——`request<T>` 已解包 `ApiResponse<T>` → `T`，调用方直接拿到 string
7. **对话框宽度 900px**：不可窄于 800px（BPMN 图横向空间需求）
8. **操作列 `fixed="right"`**：保证横向滚动时按钮不滚动出视野
9. **不抽取独立组件**：查看器逻辑全部内联在 ProcessDefList.vue 中，不作为独立 `.vue` 组件文件抽取（本 Step 范围仅一个对话框 + 一个 API 调用，独立组件属于过度工程）

## 11. 边界情况

| 场景 | 处理方式 |
|------|------|
| **DRAFT 状态流程定义** | 按钮 `disabled`，不可点击 |
| **后端返回 2104 (PROCESS_NOT_PUBLISHED)** | `ApiError` 被 catch，`viewerError` 显示错误消息 |
| **网络错误（fetch 失败）** | `Error` 被 catch，`viewerError` 显示 `e.message` |
| **BPMN XML 格式非法** | `mountBpmnViewer` 内部 `importXML` reject，被外层 try-catch 捕获 |
| **容器元素未就位**（`bpmnContainerRef.value === null`） | `openViewer` 中 `await nextTick()` 后检查，若仍为 null 则设置 `viewerError` 并提前返回 |
| **重复点击"查看流程图"** | `openViewer` 开头重置 `viewerInstance`（若上一次的未清理），然后重新 fetch + mount |
| **对话框打开期间切换页面** | Vue 组件卸载时 `onBeforeUnmount` 清理 `viewerInstance`（若存在则 `destroy()`）。需在 `<script setup>` 中新增 `import { onBeforeUnmount } from 'vue'` 并添加 `onBeforeUnmount(() => { if (viewerInstance) viewerInstance.destroy() })` |
| **列表分页/刷新后对话框依然打开** | 对话框不依赖列表数据（只看当前行），分页/刷新不影响对话框内的流程图 |
| **Mock 模式下** | `getProcessDefGraph` 被 MSW 拦截，返回 mock XML；对话框正常渲染 |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:---:|------|------|
| `v-loading` 指令在 jsdom 测试中不生效 | 高 | 低（仅影响测试，不影响生产） | 测试中不断言 loading 状态，信任 Element Plus 运行时 |
| bpmn-js 在对话框中渲染尺寸异常 | 低 | 中（用户体验差） | `fitViewport()` 在 `importXML` 完成 + `nextTick` 后调用；容器设置 `min-height: 500px` |
| el-dialog destroy-on-close 与手动 destroy 冲突 | 低 | 中（内存泄漏或报错） | `closeViewer` 中 destroy 后置 null；`@closed` 事件在 DOM 销毁后触发，此时 bpmn-js 内部 SVG 已被 DOM 移除连带清理，我们的 `destroy()` 是防御性调用（解绑可能的全局事件监听器） |

**回滚方案**：还原 ProcessDefList.vue、api/index.ts、handlers.ts 三个文件至改动前状态（`git checkout -- <files>`），删除新建的测试文件。

**回滚验证**：`pnpm typecheck && pnpm lint && pnpm test && pnpm build` 四连全绿。

## 13. 测试方案

### 13.1 静态检查

| 检查项 | 命令 | 预期结果 |
|------|------|------|
| TypeScript 类型检查 | `pnpm typecheck` | 零新增错误 |
| ESLint（含架构边界规则） | `pnpm lint` | 零新增告警 |
| 旧导出/旧函数名残留检查 | `grep -rn "mountBpmn\b\|exportXml" src/modules/workflow/` | 零命中 |
| `@/adapters/bpmn` 导入路径检查 | `grep -rn "from '@/adapters/bpmn'" src/modules/workflow/views/ProcessDefList.vue` | 至少 1 处导入 |

### 13.2 单元测试

**文件**：`src/modules/workflow/views/__tests__/ProcessDefList.spec.ts`（新建）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | 列表渲染"查看流程图"按钮 | 操作列存在、按钮文本正确 |
| 2 | PUBLISHED 行按钮启用 | `disabled` 为 `false` |
| 3 | DRAFT 行按钮禁用 | `disabled` 为 `true` |
| 4 | 点击 PUBLISHED 行打开对话框 | `viewerVisible` 变化、标题含流程名称 |
| 5 | 点击后调用 `getProcessDefGraph(row.id)` | API 调用参数正确 |
| 6 | `mountBpmnViewer` 传入容器元素和 XML | mock 被调用且参数类型正确 |
| 7 | 加载完成后调用 `fitViewport()` | `mockFitViewport` 被调用至少 1 次 |
| 8 | API 错误时显示错误提示 | `viewerError` 非空，`el-result` 渲染 |
| 9 | 关闭对话框时 `destroy()` 被调用 | `mockDestroy` 调用 1 次 |
| 10 | 组件卸载时若实例存在则 `destroy()` | `onBeforeUnmount` 清理逻辑 |

### 13.3 集成测试

本 Step 不涉及多模块/多表/多服务交互的集成场景。端到端验证留待浏览器环境手工确认。

### 13.4 手工验证

| 验证场景 | 操作步骤 | 预期结果 |
|------|------|------|
| 列表页查看流程图 | `pnpm dev:mock` → 打开流程定义页 → 点击 PUBLISHED 行的"查看流程图" | 弹窗中渲染含 StartEvent → EndEvent 连线的 BPMN 图，画布自适应缩放 |
| DRAFT 行按钮禁用 | 确认列表中 DRAFT 行的"查看流程图"按钮灰色不可点击 | 按钮 disabled |
| 关闭对话框 | 点击对话框遮罩或右上角关闭按钮 | 对话框关闭，无控制台错误 |
| 重复打开 | 打开 → 关闭 → 再次打开同一行或不同行 | 每次正常渲染新图，无旧图残留 |

### 13.5 回归检查

| 检查项 | 预期结果 |
|------|------|
| 已有测试文件计数 | `pnpm test --run` 的测试文件数不应减少（新增 1 个文件，总数 +1） |
| 已有测试通过数 | Step 1 的 10 个 bpmn adapter 测试全部通过（不得退化） |
| ProcessDefList 列表功能 | `pageProcessDefs` mock 照常返回数据，列表渲染 6 列不变 |
| `pnpm build` | 生产构建成功，无 chunk 大小异常增长（bpmn-js 已在 Step 1 纳入，本 Step 不新增大依赖） |

## 14. 验收标准

| # | 验收标准 | 验证方式 |
|---|------|------|
| 1 | `src/modules/workflow/api/index.ts` 新增 `getProcessDefGraph(id: number): Promise<string>` 函数，调用 `GET /workflow/defs/${id}/bpmn-xml` | grep 函数签名 + URL 字符串 |
| 2 | `src/modules/workflow/views/ProcessDefList.vue` 新增操作列（第 7 列），含"查看流程图"按钮 | grep `查看流程图` |
| 3 | DRAFT 状态行"查看流程图"按钮 `disabled` | 代码中 `row.status === 'DRAFT'` 条件 |
| 4 | 点击按钮打开 `el-dialog`，标题含流程名称，宽度 900px | 模板中 `el-dialog` 组件存在 + `width="900px"` + `:title` 含 `currentDefName` |
| 5 | 对话框中调用 `mountBpmnViewer(container, xml)` 渲染 BPMN 图 | 代码中 `mountBpmnViewer` 调用存在 |
| 6 | 关闭对话框时调用 `viewerInstance.destroy()` + `viewerInstance = null` | `closeViewer` 函数中 destroy 调用 + 置 null |
| 7 | 组件卸载时清理 viewerInstance（`onBeforeUnmount` 中防御性 destroy） | 代码中 `onBeforeUnmount` 存在且含 destroy 逻辑 |
| 8 | `src/foundation/mock/handlers.ts` 新增 `GET /api/workflow/defs/:id/bpmn-xml` mock | grep mock URL 字符串 |
| 9 | 新建 `ProcessDefList.spec.ts` 至少覆盖 7 个测试场景（§13.2） | 测试文件 `@Test` 等价断言 ≥7 个（vitest `it()` 块） |
| 10 | 四连全绿：typecheck ✅ lint ✅ test ✅ build ✅ | 命令输出截图/摘要 |
| 11 | 不新增依赖、不改 `package.json`/`pnpm-lock.yaml` | `git diff --stat` 不含这两个文件 |
| 12 | 不修改 `src/adapters/bpmn/` 下的任何文件 | `git diff --stat` 不含 `adapters/bpmn/` |
| 13 | 后端零改动 | `Smart-WorkFlow/` 下 `git diff --stat` 为空 |

## 15. 执行回执格式

按 system.md §7.1 标准 13 项结构产出执行回执，写入 `Smart-WorkFlow-Web/product/bpmn-adapter/receipts/step-3-execution.md`。

特别注意回执中需包含：
- 四连命令的完整输出摘要（或退出码）
- `git diff --stat` 确认修改文件数、新增行数、删除行数
- 确认 `package.json` / `pnpm-lock.yaml` 零改动
- 确认 `src/adapters/bpmn/` 零改动
- 新增测试文件的确切 `it()` 块数量和文件路径

## 16. 测试回执格式

按 system.md §7.2 标准 12 项结构产出测试回执，写入 `Smart-WorkFlow-Web/product/bpmn-adapter/receipts/step-3-test.md`。

特别注意回执中需包含：
- `pnpm test` 的 Vitest 完整输出（含文件计数、测试数、通过/失败数）
- 逐条对照 §14 验收标准回答是否满足
- 如测试中有跳过的用例，需说明原因

## 17. 明确禁止事项

- ❌ **禁止**修改 `src/adapters/bpmn/` 下的任何文件（Step 1 产物，不可回改）
- ❌ **禁止**修改后端代码（`Smart-WorkFlow/` 零改动）
- ❌ **禁止**安装新 npm 包或升级已有依赖
- ❌ **禁止**新建独立 Vue 组件文件（查看器内联在 ProcessDefList.vue）
- ❌ **禁止**修改路由配置（`src/router/`）
- ❌ **禁止**修改 `src/foundation/mock/seeds.ts`
- ❌ **禁止**修改 `src/contracts/bpm.ts` 的类型定义
- ❌ **禁止**在 ProcessDefList.vue 中引入 `bpmn-js` 原生 API（`import BpmnViewer from 'bpmn-js'`）——只能通过 `@/adapters/bpmn` 防腐层访问，违反架构边界规则
- ❌ **禁止**为"查看流程图"按钮添加权限控制（`v-permission`）——本 Step 不引入新的权限点，与列表页查看权限保持一致
- ❌ **禁止**在 `el-dialog` 的 `@closed` 之前调用 `viewerInstance.destroy()`（`@closed` 是安全的清理时机）
