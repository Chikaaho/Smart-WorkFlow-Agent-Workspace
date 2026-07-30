# Step 3：前端 ProcessInstanceList 监控页面 — 流程实例列表 + 流程图高亮 + 流转时间线

## 1. 当前状态

- **功能**：process-monitoring（M04-F06-01 流程监控首批能力）
- **整体进度**：Steps 0-2 PASSED，Step 3 READY
- **前置依赖**：
  - `GET /workflow/instances` — 分页实例列表（Step 2，`BpmInstanceController`）
  - `GET /workflow/instances/{processInstanceId}` — 实例详情含 activeNodeIds + flowTrace（Step 2，`BpmInstanceController`）
  - `GET /workflow/defs/{id}/bpmn-xml` — BPMN XML 流程图（[[bpmn-adapter]] Step 2，`BpmProcessDefController`）
  - BPMN viewer 防腐层 `@/adapters/bpmn`：`mountBpmnViewer()` + `BpmnViewerInstance`（[[bpmn-adapter]] Step 1）
  - `GET /workflow/defs` — 流程定义分页列表（用于 processDefKey → defId 映射）
- **本 Step 定位**：前端纯展示页面。新建 ProcessInstanceList.vue，消费已就绪的 3 个 REST 端点。不碰后端代码。

## 2. Step 目标

新建 `ProcessInstanceList.vue`（页型 B 列表页 + el-drawer 详情抽屉），提供流程实例分页列表、点击行查看实例详情（流程图高亮活跃节点/已完成节点 + 流转时间线）。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：单文件 Vue SFC + API 函数 + Mock 数据 + 单元测试，复用 ProcessDefList.vue 的 BPMN viewer 弹窗模式 + TaskDetail.vue 的审批历史表格模式 + contracts/bpm.ts 的接口契约风格。无新增架构决策，无跨项目联动。
是否触发升级条件：否

## 4. 模型选择理由

Step 3 是纯前端展示页面——列表 + 抽屉详情，所有后端端点已在 Steps 1-2 就绪、API 契约形状完全确定。前端工作仅涉及：在已有 contracts/bpm.ts 中追加 3 个 interface、在 api/index.ts 中追加 2 个 API 函数、在 handlers.ts 中追加 2 个 mock handler + seeds、在 router/index.ts 中追加 1 条静态路由、新建 ProcessInstanceList.vue + ProcessInstanceList.spec.ts。所有模式（StandardListTemplate / el-drawer / mountBpmnViewer + highlight / el-table / adaptPage）均已有明确参照。Flash 足够覆盖。

## 5. 已知上下文

- **后端两个端点均返回 `R<T>` 包装**（`code` / `message` / `data`），与现有 `api/index.ts` 的 `request<T>()` 泛型模式一致。`request()` 在 `code !== 0` 时自动抛 `ApiError`——前端无需手动判断 code
- **分页原始形状**：后端返回 `{ records, total, pageNum, pageSize }`（`PageResult` Java 类，Jackson 序列化为 camelCase），前端 `adaptPage()` 转为 `{ list, total, pageNum, pageSize }`
- **`InstanceListItemDTO` 字段**（Step 2 产物）：id(Long) / processInstanceId(String) / processDefKey(String) / processName(String, 可为 null) / businessKey(String) / formKey(String) / initiatorId(Long) / status(String: RUNNING/APPROVED/REJECTED) / createTime(LocalDateTime → ISO-8601 string)
- **`InstanceDetailDTO` 字段**（Step 2 产物）：extends InstanceListItemDTO + activeNodeIds: List\<String\> + flowTrace: List\<BpmActivityDTO\>
- **`BpmActivityDTO` 字段**（Step 1 产物，`sw-bpm-api` 层）：activityId / activityName / activityType / startTime(LocalDateTime|null) / endTime(LocalDateTime|null) / assignee(String|null) / taskId(String|null)
- **高亮数据语义**：`activeNodeIds` — 当前活跃节点（流程图绿色高亮）。`flowTrace` 中 `endTime != null` 的条目 → 已完成节点（流程图灰色高亮）。`flowTrace` 中 `endTime == null` 的条目 → 正在进行的节点（同绿色高亮，已在 activeNodeIds 中）
- **BPMN viewer 防腐层**（`@/adapters/bpmn`）：`mountBpmnViewer(container: HTMLElement, xml: string, events?) → Promise<BpmnViewerInstance>`。实例方法：`highlight(elementId, markerClass?)` / `clearHighlight(elementId, markerClass?)` / `fitViewport()` / `destroy()`。默认 markerClass = `'highlight'`
- **bpmn-js marker CSS**：`canvas.addMarker()` 给 SVG 元素追加 CSS class（如 `.highlight`、`.highlight-active`、`.highlight-completed`），需在本组件 `<style>` 中定义对应 CSS 规则（`fill` / `stroke`）
- **流程定义列表已有 4 条 mock 数据**（`MOCK_PROCESS_DEFS` in `seeds.ts`）：id=1 skeleton_approval / id=2 leave_approval / id=3 contract_approval / id=4 purchase_draft(DRAFT)。本 Step 的 mock 实例数据应引用 `leave_approval`（PUBLISHED）的 processKey，确保 processDefKey → defId 映射可工作
- **已有路由结构**：`/workflow/task/:taskId`（TaskDetail）、`/workflow/processed`（ProcessedList）。新增 `/workflow/instances` 需在 `router/index.ts` 的 `children` 数组中追加静态路由
- **StandardListTemplate props**：`title` / `total` / `pageNum` / `pageSize` / `empty`。事件：`@update:pageNum` / `@update:pageSize`
- **前端项目用 `pnpm`**，测试用 Vitest。不运行 `mvn` 系命令
- **前端测试基线**：59 spec files / 517 tests（CONFIRMED 2026-07-26），四连校验门全绿
- **TypeScript 接口契约**（`contracts/bpm.ts`）：已有接口中 `processName` 使用 `string | null`（可空）模式。本 Step 新增接口沿用此约定
- **Mock 系统**：`handlers.ts` 导出 `MockRegistration[]`，pattern 以 `/api/` 前缀为基准（`request()` 内部自动补 `/api` 前缀？→ 检查实际调用：`url: '/workflow/tasks/todo'` → 不带 `/api` 前缀。Mock pattern 以 `/api/` 开头是因为 handlers 注册时拼接了 prefix。新增 mock pattern 需与既有条目格式完全一致）

## 6. 执行前必须读取的文件

按优先级排序：

| # | 文件路径（相对于 `Smart-WorkFlow-Web/`） | 读取目的 |
|---|------|------|
| 1 | `src/modules/workflow/views/ProcessDefList.vue` | 参照 BPMN viewer 弹窗模式：`mountBpmnViewer()` + `fitViewport()` + `destroy()` + `@opened`/`@closed` 生命周期。**完整通读**——本 Step 的 drawer 内 BPMN viewer 与 ProcessDefList 的 dialog 内 viewer 是同一模式 |
| 2 | `src/modules/workflow/views/TaskDetail.vue` | 参照审批历史表格模式（`el-table` + `approvalHistory`），本 Step 的流转时间线使用相同表格结构 |
| 3 | `src/contracts/bpm.ts` | 确认已有接口契约（`TodoTask` / `TaskDetail` / `ApprovalHistoryItem` / `ProcessedTask` / `ProcessDef`），新增接口续写在同文件末尾 |
| 4 | `src/modules/workflow/api/index.ts` | 确认 API 函数模式（`adaptPage` / `request<T>()` / `BackendPageResult`），新增函数续写在同文件末尾 |
| 5 | `src/adapters/bpmn/index.ts` | 确认 `BpmnViewerInstance` 接口（`highlight(elementId, markerClass?)` / `clearHighlight(elementId, markerClass?)` / `fitViewport()` / `destroy()`），理解 markerClass 参数的默认值 `'highlight'` |
| 6 | `src/foundation/mock/handlers.ts` | 确认 `MockRegistration[]` 条目格式、`/api/workflow/defs` mock 模式、BPMN XML mock 模式。新增 handler 续写在同文件末尾 |
| 7 | `src/foundation/mock/seeds.ts` | 确认 `MOCK_PROCESS_DEFS` 数据（id / processKey / name / formKey）用于 mock 实例引用 |
| 8 | `src/router/index.ts` | 确认静态路由注册模式：`path` / `name` / `component` / `meta.title`。新增路由追加在 `children` 数组中 |
| 9 | `src/components/page-layout/StandardListTemplate.vue` | 确认 props 接口（`title` / `total` / `pageNum` / `pageSize` / `empty`）和 slot 名称（`empty-action` / `toolbar-actions` / `filter` / `filter-actions`） |
| 10 | `src/contracts/common.ts` | 确认 `PageQuery` / `PageResult` 接口定义 |

## 7. 允许修改的文件范围

| 文件路径（相对于 `Smart-WorkFlow-Web/`） | 修改类型 | 说明 |
|------|:---:|------|
| `src/contracts/bpm.ts` | 修改 | 追加 `ProcessInstance` / `InstanceDetail` / `ActivityNode` 三个 interface |
| `src/modules/workflow/api/index.ts` | 修改 | 追加 `queryInstances()` / `getInstanceDetail()` 两个 API 函数 |
| `src/modules/workflow/views/ProcessInstanceList.vue` | **新建** | 流程实例监控页面（列表 + 抽屉详情，含流程图高亮 + 流转时间线） |
| `src/foundation/mock/seeds.ts` | 修改 | 追加 `MOCK_INSTANCES` / `MOCK_INSTANCE_DETAILS` 种子数据 |
| `src/foundation/mock/handlers.ts` | 修改 | 追加 `GET /workflow/instances` + `GET /workflow/instances/:processInstanceId` mock handler |
| `src/router/index.ts` | 修改 | 追加 `workflow/instances` → `ProcessInstanceList` 静态路由 |
| `src/modules/workflow/views/__tests__/ProcessInstanceList.spec.ts` | **新建** | 页面组件单元测试（≥4 测试用例） |

## 8. 禁止修改的范围

- ❌ **禁止**修改后端 `Smart-WorkFlow/` 任何文件（Swagger / Controller / Service / DTO / pom.xml）
- ❌ **禁止**新增或修改后端 API 端点
- ❌ **禁止**修改 `src/adapters/bpmn/` 防腐层（Viewer 已就绪）
- ❌ **禁止**修改 `src/modules/workflow/views/ProcessDefList.vue` / `TaskDetail.vue` 及已有页面
- ❌ **禁止**修改 `src/foundation/request/index.ts`（`request()` 函数）
- ❌ **禁止**新增 Maven / npm 依赖（Element Plus / bpmn-js / vitest 均已就绪）
- ❌ **禁止**修改 `package.json` / `pnpm-lock.yaml`
- ❌ **禁止**修改 `src/foundation/mock/index.ts`（mock registry 初始化逻辑）
- ❌ **禁止**在 `contracts/bpm.ts` 中删除或修改已有 interface
- ❌ **禁止**在 `api/index.ts` 中删除或修改已有 API 函数
- ❌ **禁止**修改 `src/stores/` / `src/foundation/menu/` 等路由/菜单 store

## 9. 详细执行方案

### 9.1 追加 TypeScript 契约：`contracts/bpm.ts`

**文件**：`src/contracts/bpm.ts`（修改，在已有 `ProcessDef` interface 之后追加以下 3 个 interface）

```typescript
// ─── 流程实例列表项 DTO（对齐后端 InstanceListItemDTO） ───
export interface ProcessInstance {
  id: number                    // BpmInstance 主键 ID
  processInstanceId: string     // Flowable 流程实例 ID
  processDefKey: string         // BPMN 流程定义 key
  processName: string | null    // 流程名称（经后端 processDefService 富化，流程定义被删除时为 null）
  businessKey: string           // 业务键（= 表单 recordId）
  formKey: string               // 表单业务标识
  initiatorId: number           // 发起人用户 ID（后端 Long → JSON number）
  status: 'RUNNING' | 'APPROVED' | 'REJECTED'  // 实例状态
  createTime: string            // 发起时间（LocalDateTime → ISO-8601 string）
}

// ─── 活动节点 DTO（对齐后端 BpmActivityDTO） ───
export interface ActivityNode {
  activityId: string            // BPMN 元素 ID（如 "Activity_001"，与 bpmn-js bpmnElement 对齐）
  activityName: string          // 节点名称（如 "经理审批"）
  activityType: string          // 节点类型：userTask / startEvent / endEvent / exclusiveGateway 等
  startTime: string | null      // 开始时间（未开始节点可能为 null）
  endTime: string | null        // 结束时间（进行中节点为 null）
  assignee: string | null       // 处理人（仅 userTask 有值）
  taskId: string | null         // Flowable task ID（仅 userTask 有值）
}

// ─── 流程实例详情 DTO（对齐后端 InstanceDetailDTO） ───
export interface InstanceDetail extends ProcessInstance {
  activeNodeIds: string[]       // 当前活跃节点 activity ID 列表（流程图绿色高亮）。实例已结束时为空
  flowTrace: ActivityNode[]     // 全部历史活动节点（按结束时间升序，进行中节点排末尾）
}
```

**注意**：
- `ProcessInstance` 是列表项，`InstanceDetail extends ProcessInstance` 是详情——对应后端 `InstanceListItemDTO` → `InstanceDetailDTO` 的继承关系
- `status` 使用字面量联合类型（`'RUNNING' | 'APPROVED' | 'REJECTED'`），与后端 `InstanceStatusEnum` 对齐
- `processName` 使用 `string | null`，与已有 `TaskDetail.processName` / `ProcessedTask.processName` 一致（流程定义被删除时可为 null）
- `ActivityNode.activityId` 直接用于 `viewerInstance.highlight(activityId)` ——ID 必须与 BPMN XML 中的 `bpmnElement` 属性一致

### 9.2 追加 API 函数：`api/index.ts`

**文件**：`src/modules/workflow/api/index.ts`（修改，在 `getProcessDefGraph()` 之后追加以下 2 个函数）

```typescript
// ═══════════════════════════════════════
// 流程实例监控
// ═══════════════════════════════════════

/** 流程实例列表过滤参数 */
export interface InstanceFilter {
  status?: string        // RUNNING / APPROVED / REJECTED
  processDefKey?: string // 流程定义 key
  initiatorId?: number   // 发起人 ID
}

/** GET /workflow/instances?pageNum=&pageSize=&status=&processDefKey=&initiatorId= → PageResult<ProcessInstance> */
export async function queryInstances(
  page: PageQuery,
  filter?: InstanceFilter,
): Promise<PageResult<ProcessInstance>> {
  const raw = await request<BackendPageResult<ProcessInstance>>({
    method: 'GET',
    url: '/workflow/instances',
    params: { ...page, ...filter },
  })
  return adaptPage(raw)
}

/** GET /workflow/instances/{processInstanceId} → InstanceDetail */
export async function getInstanceDetail(
  processInstanceId: string,
): Promise<InstanceDetail> {
  return request<InstanceDetail>({
    method: 'GET',
    url: `/workflow/instances/${processInstanceId}`,
  })
}
```

**注意**：
- `request<T>()` 已内置 `code !== 0` → 抛 `ApiError` 的错误处理，前端只 catch `ApiError` 取 `err.msg`
- `queryInstances` 的 `filter` 参数通过 `{ ...page, ...filter }` 展开到 query string。Spring MVC 自动绑定到 `InstanceFilterDTO`（`?status=RUNNING&processDefKey=leave&initiatorId=1`）。undefined 字段不传入 params（axios 默认忽略 undefined 值）
- `adaptPage()` 复用已有函数（`raw.records` → `list`）
- `getInstanceDetail` 不需要 `adaptPage`——直接返回 `InstanceDetail`
- 需要新增 import：`import type { ProcessInstance, InstanceDetail } from '@/contracts/bpm'`

### 9.3 追加 Mock 种子数据：`seeds.ts`

**文件**：`src/foundation/mock/seeds.ts`（修改，在 `MOCK_PROCESS_DEFS` 之后追加）

```typescript
// ─── 流程实例 mock ──────────────────────────────────
// processDefKey 引用 MOCK_PROCESS_DEFS 中的 PUBLISHED 条目（leave_approval / skeleton_approval / contract_approval）
export const MOCK_INSTANCES: Array<{
  id: number
  processInstanceId: string
  processDefKey: string
  processName: string | null
  businessKey: string
  formKey: string
  initiatorId: number
  status: 'RUNNING' | 'APPROVED' | 'REJECTED'
  createTime: string
}> = [
  {
    id: 1,
    processInstanceId: 'proc-001',
    processDefKey: 'leave_approval',
    processName: '请假审批流程',
    businessKey: 'rec-leave-001',
    formKey: 'leave-request',
    initiatorId: 1,
    status: 'RUNNING',
    createTime: '2026-07-20T09:30:00',
  },
  {
    id: 2,
    processInstanceId: 'proc-002',
    processDefKey: 'skeleton_approval',
    processName: '单节点审批流程',
    businessKey: 'rec-it-002',
    formKey: 'it_application',
    initiatorId: 2,
    status: 'APPROVED',
    createTime: '2026-07-15T14:00:00',
  },
  {
    id: 3,
    processInstanceId: 'proc-003',
    processDefKey: 'contract_approval',
    processName: '合同审批流程',
    businessKey: 'rec-contract-003',
    formKey: 'contract-approval',
    initiatorId: 3,
    status: 'REJECTED',
    createTime: '2026-07-18T11:15:00',
  },
  {
    id: 4,
    processInstanceId: 'proc-004',
    processDefKey: 'leave_approval',
    processName: '请假审批流程',
    businessKey: 'rec-leave-004',
    formKey: 'leave-request',
    initiatorId: 1,
    status: 'RUNNING',
    createTime: '2026-07-22T08:45:00',
  },
  {
    id: 5,
    processInstanceId: 'proc-005',
    processDefKey: 'skeleton_approval',
    processName: '单节点审批流程',
    businessKey: 'rec-it-005',
    formKey: 'it_application',
    initiatorId: 4,
    status: 'APPROVED',
    createTime: '2026-07-10T16:30:00',
  },
  {
    id: 6,
    processInstanceId: 'proc-006',
    processDefKey: 'leave_approval',
    processName: '请假审批流程',
    businessKey: 'rec-leave-006',
    formKey: 'leave-request',
    initiatorId: 2,
    status: 'RUNNING',
    createTime: '2026-07-25T13:20:00',
  },
]

// ─── 流程实例详情 mock（按 processInstanceId 索引） ──
// activeNodeIds 中的 ID 对应 BPMN XML mock 中的 activity ID
export const MOCK_INSTANCE_DETAILS: Record<string, {
  activeNodeIds: string[]
  flowTrace: Array<{
    activityId: string
    activityName: string
    activityType: string
    startTime: string | null
    endTime: string | null
    assignee: string | null
    taskId: string | null
  }>
}> = {
  'proc-001': {
    // RUNNING — 活跃节点：部门审批
    activeNodeIds: ['Activity_approve1'],
    flowTrace: [
      { activityId: 'StartEvent_1', activityName: '开始', activityType: 'startEvent', startTime: '2026-07-20T09:30:00', endTime: '2026-07-20T09:30:00', assignee: null, taskId: null },
      { activityId: 'Flow_submit2approve', activityName: null, activityType: 'sequenceFlow', startTime: '2026-07-20T09:30:00', endTime: '2026-07-20T09:30:00', assignee: null, taskId: null },
      { activityId: 'Activity_submit', activityName: '提交申请', activityType: 'userTask', startTime: '2026-07-20T09:30:00', endTime: '2026-07-20T10:15:00', assignee: '1', taskId: 'task-submit-001' },
      { activityId: 'Flow_submit2approve1', activityName: null, activityType: 'sequenceFlow', startTime: '2026-07-20T10:15:00', endTime: '2026-07-20T10:15:00', assignee: null, taskId: null },
      { activityId: 'Activity_approve1', activityName: '部门经理审批', activityType: 'userTask', startTime: '2026-07-20T10:15:00', endTime: null, assignee: '2', taskId: 'task-approve1-001' },
    ],
  },
  'proc-002': {
    // APPROVED — 已完成（无活跃节点）
    activeNodeIds: [],
    flowTrace: [
      { activityId: 'StartEvent_1', activityName: '开始', activityType: 'startEvent', startTime: '2026-07-15T14:00:00', endTime: '2026-07-15T14:00:00', assignee: null, taskId: null },
      { activityId: 'Activity_submit', activityName: '提交申请', activityType: 'userTask', startTime: '2026-07-15T14:00:00', endTime: '2026-07-15T15:30:00', assignee: '2', taskId: 'task-submit-002' },
      { activityId: 'Activity_approve1', activityName: '部门经理审批', activityType: 'userTask', startTime: '2026-07-15T15:30:00', endTime: '2026-07-16T09:00:00', assignee: '3', taskId: 'task-approve1-002' },
      { activityId: 'EndEvent_1', activityName: '结束', activityType: 'endEvent', startTime: '2026-07-16T09:00:00', endTime: '2026-07-16T09:00:00', assignee: null, taskId: null },
    ],
  },
  'proc-003': {
    // REJECTED — 已驳回（无活跃节点）
    activeNodeIds: [],
    flowTrace: [
      { activityId: 'StartEvent_1', activityName: '开始', activityType: 'startEvent', startTime: '2026-07-18T11:15:00', endTime: '2026-07-18T11:15:00', assignee: null, taskId: null },
      { activityId: 'Activity_submit', activityName: '提交申请', activityType: 'userTask', startTime: '2026-07-18T11:15:00', endTime: '2026-07-18T14:00:00', assignee: '3', taskId: 'task-submit-003' },
      { activityId: 'Activity_approve1', activityName: '部门经理审批', activityType: 'userTask', startTime: '2026-07-18T14:00:00', endTime: '2026-07-18T16:00:00', assignee: '4', taskId: 'task-approve1-003' },
      { activityId: 'EndEvent_1', activityName: '结束', activityType: 'endEvent', startTime: '2026-07-18T16:00:00', endTime: '2026-07-18T16:00:00', assignee: null, taskId: null },
    ],
  },
  'proc-004': {
    // RUNNING — 刚启动（仅提交节点完成，部门审批活跃）
    activeNodeIds: ['Activity_approve1'],
    flowTrace: [
      { activityId: 'StartEvent_1', activityName: '开始', activityType: 'startEvent', startTime: '2026-07-22T08:45:00', endTime: '2026-07-22T08:45:00', assignee: null, taskId: null },
      { activityId: 'Activity_submit', activityName: '提交申请', activityType: 'userTask', startTime: '2026-07-22T08:45:00', endTime: '2026-07-22T09:00:00', assignee: '1', taskId: 'task-submit-004' },
      { activityId: 'Activity_approve1', activityName: '部门经理审批', activityType: 'userTask', startTime: '2026-07-22T09:00:00', endTime: null, assignee: '2', taskId: 'task-approve1-004' },
    ],
  },
  'proc-005': {
    // APPROVED
    activeNodeIds: [],
    flowTrace: [
      { activityId: 'StartEvent_1', activityName: '开始', activityType: 'startEvent', startTime: '2026-07-10T16:30:00', endTime: '2026-07-10T16:30:00', assignee: null, taskId: null },
      { activityId: 'Activity_submit', activityName: '提交申请', activityType: 'userTask', startTime: '2026-07-10T16:30:00', endTime: '2026-07-10T17:45:00', assignee: '4', taskId: 'task-submit-005' },
      { activityId: 'Activity_approve1', activityName: '部门经理审批', activityType: 'userTask', startTime: '2026-07-10T17:45:00', endTime: '2026-07-11T10:00:00', assignee: '2', taskId: 'task-approve1-005' },
      { activityId: 'EndEvent_1', activityName: '结束', activityType: 'endEvent', startTime: '2026-07-11T10:00:00', endTime: '2026-07-11T10:00:00', assignee: null, taskId: null },
    ],
  },
  'proc-006': {
    // RUNNING — 多活跃节点（并行网关后的两个审批）
    activeNodeIds: ['Activity_approve1', 'Activity_approve2'],
    flowTrace: [
      { activityId: 'StartEvent_1', activityName: '开始', activityType: 'startEvent', startTime: '2026-07-25T13:20:00', endTime: '2026-07-25T13:20:00', assignee: null, taskId: null },
      { activityId: 'Activity_submit', activityName: '提交申请', activityType: 'userTask', startTime: '2026-07-25T13:20:00', endTime: '2026-07-25T14:00:00', assignee: '2', taskId: 'task-submit-006' },
      { activityId: 'Activity_approve1', activityName: '部门经理审批', activityType: 'userTask', startTime: '2026-07-25T14:00:00', endTime: null, assignee: '3', taskId: 'task-approve1-006' },
      { activityId: 'Activity_approve2', activityName: 'HR 审批', activityType: 'userTask', startTime: '2026-07-25T14:00:00', endTime: null, assignee: '4', taskId: 'task-approve2-006' },
    ],
  },
}
```

**注意**：
- mock flowTrace 的 `activityId` 必须与 mock BPMN XML 中的 `bpmnElement` ID 一致（见 §9.6），否则高亮无效
- `endTime: null` 表示该节点正在进行中
- `taskId` 对 userTask 节点提供 task ID（可用于后续功能如"跳转任务详情"），本 Step 暂不使用
- `activityType: 'sequenceFlow'` 的条目——连线也有 `activityId`，但不需要高亮。前端显示流转时间线时只展示 `userTask` 类型的条目（过滤掉 `startEvent`/`endEvent`/`sequenceFlow`）。或者在时间线中显示所有类型，连线除外

### 9.4 追加 Mock Handlers：`handlers.ts`

**文件**：`src/foundation/mock/handlers.ts`（修改，在文件末尾 `]` 闭合之前、`MOCK_JOB_LOGS` 相关 handlers 之后追加以下 2 个 handler）

在文件开头的 import 中新增：
```typescript
  MOCK_INSTANCES,
  MOCK_INSTANCE_DETAILS,
```

（追加到已有 `import { ... } from './seeds'` 的解构列表中）

在 `mockRegistrations` 数组末尾（最后一个 job log handler 之后、`];` 闭合之前）追加：

```typescript
  // ═══════════════════════════════════════════════════
  // ── 流程实例监控 ──────────────────────────────────
  // ═══════════════════════════════════════════════════

  // GET /api/workflow/instances — 分页实例列表
  {
    method: 'GET',
    pattern: '/api/workflow/instances',
    handler: (_params, query) => {
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)

      // 可选过滤
      let list = [...MOCK_INSTANCES]
      if (query.status) {
        list = list.filter((i) => i.status === query.status)
      }
      if (query.processDefKey) {
        list = list.filter((i) => i.processDefKey === query.processDefKey)
      }
      if (query.initiatorId) {
        list = list.filter((i) => i.initiatorId === Number(query.initiatorId))
      }

      // 按创建时间倒序
      list.sort((a, b) => b.createTime.localeCompare(a.createTime))

      const total = list.length
      const start = (pageNum - 1) * pageSize
      const records = list.slice(start, start + pageSize)
      return {
        code: 0,
        message: 'ok',
        data: { records, total, pageNum, pageSize },
      }
    },
  },

  // GET /api/workflow/instances/:processInstanceId — 实例详情
  {
    method: 'GET',
    pattern: '/api/workflow/instances/:processInstanceId',
    handler: (params) => {
      const processInstanceId = (params as Record<string, string>).processInstanceId
      const instance = MOCK_INSTANCES.find(
        (i) => i.processInstanceId === processInstanceId,
      )
      if (!instance) {
        return { code: 404, message: '流程实例不存在', data: null }
      }
      const detail = MOCK_INSTANCE_DETAILS[processInstanceId]
      return {
        code: 0,
        message: 'ok',
        data: {
          ...instance,
          activeNodeIds: detail?.activeNodeIds ?? [],
          flowTrace: detail?.flowTrace ?? [],
        },
      }
    },
  },
```

**注意**：
- `processInstanceId` 不存在时返回 `code: 404`，与后端 `BpmInstanceController.instanceDetail()` 的错误处理一致
- 列表 handler 支持可选过滤（`status` / `processDefKey` / `initiatorId`），过滤字段未传时不过滤
- 排序：按 `createTime` 倒序（最新的在前），与后端 `orderByDesc(BpmInstance::getCreateTime)` 一致

### 9.5 注册路由：`router/index.ts`

**文件**：`src/router/index.ts`（修改，在 `children` 数组中追加一条静态路由）

在现有 workflow 相关路由（`TaskDetail` + `ProcessedList`）之后追加：

```typescript
      {
        path: 'workflow/instances',
        name: 'ProcessInstanceList',
        component: () => import('@/modules/workflow/views/ProcessInstanceList.vue'),
        meta: { title: '流程监控' },
      },
```

插入位置：`ProcessedList` 路由配置之后、`children` 数组其他条目之前。

**注意**：
- 路由名称 `ProcessInstanceList` 使用 PascalCase（与已有 `TaskDetail` / `ProcessedList` 风格一致）
- `meta.title` 用于浏览器标签页标题
- 使用动态 `import()`（lazy load），与其他所有 child route 一致

### 9.6 增强 Mock BPMN XML

**注意**：现有的 `/api/workflow/defs/:id/bpmn-xml` mock handler 对**所有** PUBLISHED 流程定义返回同一个最简 BPMN（仅含 StartEvent + EndEvent），不含 userTask 节点，无法演示流程图高亮效果。本 Step 需要增强该 mock handler，使其返回含 userTask 节点的 BPMN XML。

**文件**：`src/foundation/mock/handlers.ts`（修改，替换现有 `/api/workflow/defs/:id/bpmn-xml` handler）

**替换位置**：找到现有 `pattern: '/api/workflow/defs/:id/bpmn-xml'` 的 handler（搜索 `bpmn-xml`），将整个注册条目替换为以下增强版本：

```typescript
  // ── 流程定义：获取 BPMN XML 流程图（增强版：含 userTask 节点，支持高亮演示） ──
  {
    method: 'GET',
    pattern: '/api/workflow/defs/:id/bpmn-xml',
    handler: (params) => {
      const defId = Number((params as Record<string, string>).id)
      const def = MOCK_PROCESS_DEFS.find((d) => d.id === defId)
      if (!def || def.status === 'DRAFT') {
        return { code: 2104, message: '流程定义未发布，无法获取流程图', data: null }
      }
      // 返回含 3 个 userTask 的模拟审批流程 BPMN XML（activityId 与 mock seeds 中 MOCK_INSTANCE_DETAILS 的 activityId 对齐）
      const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="${def.processKey}" name="${def.name}" isExecutable="true">
    <startEvent id="StartEvent_1" name="开始" />
    <userTask id="Activity_submit" name="提交申请" />
    <userTask id="Activity_approve1" name="部门经理审批" />
    <userTask id="Activity_approve2" name="HR 审批" />
    <endEvent id="EndEvent_1" name="结束" />
    <sequenceFlow id="Flow_start2submit" sourceRef="StartEvent_1" targetRef="Activity_submit" />
    <sequenceFlow id="Flow_submit2approve1" sourceRef="Activity_submit" targetRef="Activity_approve1" />
    <sequenceFlow id="Flow_approve1_2approve2" sourceRef="Activity_approve1" targetRef="Activity_approve2" />
    <sequenceFlow id="Flow_approve2_2end" sourceRef="Activity_approve2" targetRef="EndEvent_1" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${def.processKey}">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_submit_di" bpmnElement="Activity_submit">
        <dc:Bounds x="260" y="95" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_approve1_di" bpmnElement="Activity_approve1">
        <dc:Bounds x="420" y="95" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_approve2_di" bpmnElement="Activity_approve2">
        <dc:Bounds x="580" y="95" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="740" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="flow1_di" bpmnElement="Flow_start2submit">
        <di:waypoint x="216" y="138" />
        <di:waypoint x="260" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow2_di" bpmnElement="Flow_submit2approve1">
        <di:waypoint x="360" y="135" />
        <di:waypoint x="420" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow3_di" bpmnElement="Flow_approve1_2approve2">
        <di:waypoint x="520" y="135" />
        <di:waypoint x="580" y="135" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow4_di" bpmnElement="Flow_approve2_2end">
        <di:waypoint x="680" y="135" />
        <di:waypoint x="740" y="138" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`
      return { code: 0, message: 'ok', data: bpmnXml }
    },
  },
```

**注意**：
- BPMN XML 中的 `userTask` element ID（`Activity_submit`、`Activity_approve1`、`Activity_approve2`）必须与 `MOCK_INSTANCE_DETAILS` 中 flowTrace 条目的 `activityId` 完全一致
- `StartEvent_1` / `EndEvent_1` 也需与 flowTrace 中的 activityId 一致
- BPMNDiagram 部分的 `bpmnElement` 引用必须与 process 中定义的 element ID 匹配，否则 bpmn-js 渲染异常
- 替换后需同步更新 `seeds.ts` 的 import（如有引用 MOCK_BPMN_XML 等独立导出变量的需要）；当前 mock XML 是内联在 handler 中的模板字符串，不涉及独立导出

### 9.7 新建页面组件：`ProcessInstanceList.vue`

**文件**：`src/modules/workflow/views/ProcessInstanceList.vue`（新建）

完整组件结构如下（分为 `<script setup lang="ts">`、`<template>`、`<style scoped>` 三部分）：

```vue
<script setup lang="ts">
/**
 * ProcessInstanceList — 流程实例监控页（页型 B + el-drawer 详情抽屉）。
 *
 * 列表页：分页展示流程实例，支持按状态/流程定义/发起人过滤。
 * 详情抽屉：实例基本信息 + BPMN 流程图高亮（活跃节点/已完成节点）+ 流转时间线。
 */
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { StandardListTemplate } from '@/components/page-layout'
import { queryInstances, getInstanceDetail, pageProcessDefs, getProcessDefGraph } from '@/modules/workflow/api'
import type { ProcessInstance, InstanceDetail } from '@/contracts/bpm'
import type { PageQuery } from '@/contracts/common'
import { ApiError } from '@/foundation/request'
import { mountBpmnViewer } from '@/adapters/bpmn'
import type { BpmnViewerInstance } from '@/adapters/bpmn'
import type { InstanceFilter } from '@/modules/workflow/api'

// ─── 状态映射 ───

const STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
  RUNNING: { label: '运行中', type: 'success' },
  APPROVED: { label: '已完成', type: 'info' },
  REJECTED: { label: '已驳回', type: 'danger' },
}

function getStatusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? status
}

function getStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  return STATUS_MAP[status]?.type ?? 'info'
}

// ─── 列表状态 ───

const list = ref<ProcessInstance[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMsg = ref('')
const filterStatus = ref<string>('') // '' = 全部

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const page: PageQuery = { pageNum: pageNum.value, pageSize: pageSize.value }
    const filter: InstanceFilter = {}
    if (filterStatus.value) {
      filter.status = filterStatus.value
    }
    const result = await queryInstances(page, filter)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载流程实例列表失败'
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

function handleFilterChange() {
  pageNum.value = 1
  void loadList()
}

// ─── 详情抽屉 ───

const drawerVisible = ref(false)
const drawerLoading = ref(false)
const drawerError = ref('')
const detail = ref<InstanceDetail | null>(null)

// 流程定义 key → id 映射（用于获取 BPMN XML）
const defKeyToIdMap = ref<Record<string, number>>({})

// BPMN viewer
const bpmnContainerRef = ref<HTMLElement | null>(null)
let viewerInstance: BpmnViewerInstance | null = null

/** 构建 processDefKey → defId 映射（页面初始化时加载一次） */
async function loadProcessDefMap() {
  try {
    // 取全量流程定义（pageSize 设大一些，mock 只有 4 条）
    const result = await pageProcessDefs({ pageNum: 1, pageSize: 100 })
    const map: Record<string, number> = {}
    for (const def of result.list) {
      map[def.processKey] = def.id
    }
    defKeyToIdMap.value = map
  } catch {
    // 静默失败 — 映射为空时流程图区域显示"无法获取流程图"
  }
}

/** 打开详情抽屉 */
async function openDrawer(row: ProcessInstance) {
  drawerVisible.value = true
  drawerLoading.value = true
  drawerError.value = ''
  detail.value = null

  try {
    detail.value = await getInstanceDetail(row.processInstanceId)
    await nextTick()

    // 加载 BPMN XML 并渲染
    const processDefKey = row.processDefKey
    const defId = defKeyToIdMap.value[processDefKey]
    if (!defId) {
      drawerError.value = '未找到对应流程定义，无法展示流程图'
      return
    }

    const xml = await getProcessDefGraph(defId)
    if (!bpmnContainerRef.value) {
      drawerError.value = '流程图容器未就绪'
      return
    }

    // 销毁旧 viewer（如果存在）
    if (viewerInstance) {
      viewerInstance.destroy()
      viewerInstance = null
    }

    viewerInstance = await mountBpmnViewer(bpmnContainerRef.value, xml)

    // 高亮活跃节点（绿色）和已完成节点（灰色）
    applyHighlights()

    // 自适应画布
    await nextTick()
    try {
      viewerInstance.fitViewport()
    } catch {
      // 抽屉动画可能尚未完成，忽略
    }
  } catch (err) {
    if (err instanceof ApiError) {
      drawerError.value = err.msg
    } else {
      drawerError.value = (err as Error)?.message || '加载实例详情失败'
    }
  } finally {
    drawerLoading.value = false
  }
}

/** 在 BPMN 图上应用高亮标记 */
function applyHighlights() {
  if (!viewerInstance || !detail.value) return

  // 获取已完成节点 activityId（flowTrace 中 endTime != null 的条目）
  const completedNodeIds = detail.value.flowTrace
    .filter((node) => node.endTime != null)
    .map((node) => node.activityId)

  // 绿色高亮：活跃节点
  for (const id of detail.value.activeNodeIds) {
    try {
      viewerInstance.highlight(id, 'highlight-active')
    } catch {
      // 可能该 element ID 在 BPMN XML 中不存在——忽略
    }
  }

  // 灰色高亮：已完成节点
  for (const id of completedNodeIds) {
    try {
      viewerInstance.highlight(id, 'highlight-completed')
    } catch {
      // 同上
    }
  }
}

/** 关闭抽屉并清理 */
function closeDrawer() {
  if (viewerInstance) {
    viewerInstance.destroy()
    viewerInstance = null
  }
  drawerVisible.value = false
  drawerError.value = ''
  drawerLoading.value = false
  detail.value = null
}

onBeforeUnmount(() => {
  if (viewerInstance) {
    viewerInstance.destroy()
    viewerInstance = null
  }
})

onMounted(() => {
  void loadProcessDefMap()
  void loadList()
})

// ─── 时间线过滤：只展示 userTask 类型的条目（排除 startEvent/endEvent/sequenceFlow） ───

function isUserTask(activityType: string): boolean {
  return activityType === 'userTask'
}
</script>

<template>
  <StandardListTemplate
    title="流程监控"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 空态操作 -->
    <template #empty-action>
      <span />
    </template>

    <!-- 筛选区：状态过滤 -->
    <template #filter>
      <el-select
        v-model="filterStatus"
        placeholder="全部状态"
        clearable
        style="width: 180px"
        @change="handleFilterChange"
      >
        <el-option label="运行中" value="RUNNING" />
        <el-option label="已完成" value="APPROVED" />
        <el-option label="已驳回" value="REJECTED" />
      </el-select>
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
      <el-table-column prop="processName" label="流程名称" min-width="160">
        <template #default="{ row }">
          {{ (row as ProcessInstance).processName ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="businessKey" label="业务单号" min-width="160" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType((row as ProcessInstance).status)" size="small">
            {{ getStatusLabel((row as ProcessInstance).status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发起人 ID" width="100">
        <template #default="{ row }">
          {{ (row as ProcessInstance).initiatorId }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="发起时间" width="180" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            link
            type="primary"
            @click="openDrawer(row as ProcessInstance)"
          >
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="流程实例详情"
      :close-on-click-modal="false"
      destroy-on-close
      size="900px"
      @closed="closeDrawer"
    >
      <div v-loading="drawerLoading" class="drawer-content">
        <!-- 错误提示 -->
        <el-alert
          v-if="drawerError"
          :title="drawerError"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />

        <template v-if="detail">
          <!-- 基本信息 -->
          <el-card class="detail-section">
            <template #header><span>基本信息</span></template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="流程名称">{{
                detail.processName ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="实例 ID">{{
                detail.processInstanceId
              }}</el-descriptions-item>
              <el-descriptions-item label="业务单号">{{
                detail.businessKey
              }}</el-descriptions-item>
              <el-descriptions-item label="表单标识">{{
                detail.formKey
              }}</el-descriptions-item>
              <el-descriptions-item label="发起人 ID">{{
                detail.initiatorId
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(detail.status)" size="small">
                  {{ getStatusLabel(detail.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="发起时间">{{
                detail.createTime
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 流程图高亮 -->
          <el-card class="detail-section">
            <template #header>
              <span>流程图</span>
              <span style="margin-left: 12px; font-size: 12px; font-weight: normal; color: #909399">
                <span class="legend-dot legend-active" /> 活跃节点
                <span class="legend-dot legend-completed" style="margin-left: 12px" /> 已完成节点
              </span>
            </template>
            <div v-if="!drawerError" class="bpmn-wrapper">
              <div ref="bpmnContainerRef" class="bpmn-container" />
            </div>
          </el-card>

          <!-- 流转时间线 -->
          <el-card class="detail-section">
            <template #header><span>流转记录</span></template>
            <el-alert
              v-if="detail.flowTrace.filter(n => isUserTask(n.activityType)).length === 0"
              title="暂无审批记录"
              type="info"
              :closable="false"
              show-icon
            />
            <el-table
              v-else
              :data="detail.flowTrace.filter(n => isUserTask(n.activityType))"
              stripe
            >
              <el-table-column prop="activityName" label="审批节点" min-width="140" />
              <el-table-column prop="assignee" label="审批人" min-width="100">
                <template #default="{ row }">
                  {{ row.assignee ?? '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" min-width="170" />
              <el-table-column label="完成时间" min-width="170">
                <template #default="{ row }">
                  {{ row.endTime ?? '进行中···' }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
      </div>
    </el-drawer>
  </StandardListTemplate>
</template>

<style scoped>
.drawer-content {
  padding: 0;
}

.detail-section {
  margin-bottom: 16px;
}

/* BPMN 容器 */
.bpmn-wrapper {
  height: 400px;
  position: relative;
}
.bpmn-container {
  width: 100%;
  height: 100%;
}

/* 隐藏 bpmn-js 右下角 Logo */
:deep(.bjs-powered-by) {
  display: none !important;
}

/* ─── 高亮标记 CSS ─── */

/* 活跃节点：绿色填充 + 绿色边框 */
:deep(.highlight-active:not(.djs-connection) .djs-visual > :nth-child(1)) {
  fill: rgba(34, 197, 94, 0.15) !important;   /* 浅绿填充 */
  stroke: #22c55e !important;                   /* 绿色边框 */
}
/* 活跃节点的连线也变绿 */
:deep(.highlight-active.djs-connection .djs-visual > :nth-child(1)) {
  stroke: #22c55e !important;
}

/* 已完成节点：灰色填充 + 灰色边框 */
:deep(.highlight-completed:not(.djs-connection) .djs-visual > :nth-child(1)) {
  fill: rgba(148, 163, 184, 0.15) !important;  /* 浅灰填充 */
  stroke: #94a3b8 !important;                   /* 灰色边框 */
}
/* 已完成节点的连线也变灰 */
:deep(.highlight-completed.djs-connection .djs-visual > :nth-child(1)) {
  stroke: #94a3b8 !important;
}

/* ─── 图例 ─── */
.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}
.legend-active {
  background: #22c55e;
}
.legend-completed {
  background: #94a3b8;
}
</style>
```

**关键实现说明**：

1. **列表页结构**：复用 `StandardListTemplate`，与 `ProcessDefList.vue` 的列表模式完全一致。状态过滤使用 `el-select` + `clearable` 属性，通过 `filter` slot 嵌入模板的筛选区

2. **详情抽屉**：使用 `el-drawer`（不是 `el-dialog`），`size="900px"`。内容垂直排列三个 `el-card`：基本信息（`el-descriptions`） → 流程图（`bpmn-js` viewer） → 流转记录（`el-table`）

3. **流程图高亮**：
   - 从 `detail.flowTrace` 中过滤 `endTime != null` 的条目 → `completedNodeIds`
   - 对 `activeNodeIds` 调用 `viewerInstance.highlight(id, 'highlight-active')`（绿色）
   - 对 `completedNodeIds` 调用 `viewerInstance.highlight(id, 'highlight-completed')`（灰色）
   - 通过 `:deep()` CSS 覆盖 bpmn-js 内部 SVG 样式（`fill` + `stroke` 颜色）
   - 每个 `highlight()` 调用包裹在 try-catch 中：activityId 可能在当前实例的 BPMN XML 中不存在（mock 实例引用的 XML 中只有部分 activityId）

4. **流转时间线**：`el-table` 展示 userTask 类型节点（`activityName` / `assignee` / `startTime` / `endTime`）。过滤掉 `startEvent`/`endEvent`/`sequenceFlow`——只展示审批节点。`endTime` 为 null 时显示"进行中···"

5. **processDefKey → defId 映射**：`loadProcessDefMap()` 在 `onMounted` 中调用一次，取全量流程定义构建 `Record<string, number>` 映射。映射失败时流程图区域显示错误提示

6. **viewer 生命周期**：
   - 每次打开抽屉 → 销毁旧 viewer → 重新 `mountBpmnViewer()` → `applyHighlights()` → `fitViewport()`
   - 关闭抽屉 → `viewerInstance.destroy()`
   - 组件卸载 → 防御性清理

7. **错误处理**：
   - 列表加载失败 → `el-alert` 显示错误信息
   - 详情加载失败（实例不存在/网络错误） → drawer 内 `el-alert`
   - 流程图渲染失败（BPMN XML 无效/容器未就绪） → drawer 内 `el-alert`，不阻断基本信息 + 流转记录展示
   - `processName` 为 null → 显示 `-`（与 `TaskDetail.vue` 的 `{{ detail.processName ?? '-' }}` 一致）

8. **状态 tag 颜色**：RUNNING → `success`（绿色）、APPROVED → `info`（默认）、REJECTED → `danger`（红色），使用 Element Plus 内置 tag type

### 9.8 新建页面测试：`ProcessInstanceList.spec.ts`

**文件**：`src/modules/workflow/views/__tests__/ProcessInstanceList.spec.ts`（新建）

测试策略：使用 Vitest + @vue/test-utils + vi.mock（mock API 模块），不加载真实 bpmn-js。

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ProcessInstanceList from '../ProcessInstanceList.vue'
import type { ProcessInstance } from '@/contracts/bpm'

// ─── Mock API ───
const mockQueryInstances = vi.fn()
const mockGetInstanceDetail = vi.fn()
const mockPageProcessDefs = vi.fn()
const mockGetProcessDefGraph = vi.fn()

vi.mock('@/modules/workflow/api', () => ({
  queryInstances: (...args: unknown[]) => mockQueryInstances(...args),
  getInstanceDetail: (...args: unknown[]) => mockGetInstanceDetail(...args),
  pageProcessDefs: (...args: unknown[]) => mockPageProcessDefs(...args),
  getProcessDefGraph: (...args: unknown[]) => mockGetProcessDefGraph(...args),
}))

// ─── Mock BPMN viewer ───
const mockViewerInstance = {
  destroy: vi.fn(),
  fitViewport: vi.fn(),
  highlight: vi.fn(),
  clearHighlight: vi.fn(),
}
vi.mock('@/adapters/bpmn', () => ({
  mountBpmnViewer: vi.fn().mockResolvedValue(mockViewerInstance),
}))

// ─── Mock StandardListTemplate（浅 stub：只渲染 slot 内容，绕过其内部复杂子组件） ───
vi.mock('@/components/page-layout', () => ({
  StandardListTemplate: {
    name: 'StandardListTemplate',
    props: ['title', 'total', 'pageNum', 'pageSize', 'empty'],
    emits: ['update:pageNum', 'update:pageSize'],
    template: `<div class="mock-standard-list">
      <slot name="filter" />
      <slot />
      <slot name="empty-action" />
    </div>`,
  },
}))

// ─── 测试夹具 ───
const MOCK_LIST: ProcessInstance[] = [
  {
    id: 1,
    processInstanceId: 'proc-001',
    processDefKey: 'leave_approval',
    processName: '请假审批流程',
    businessKey: 'rec-001',
    formKey: 'leave-request',
    initiatorId: 1,
    status: 'RUNNING',
    createTime: '2026-07-20T09:30:00',
  },
  {
    id: 2,
    processInstanceId: 'proc-002',
    processDefKey: 'skeleton_approval',
    processName: '单节点审批流程',
    businessKey: 'rec-002',
    formKey: 'it_application',
    initiatorId: 2,
    status: 'APPROVED',
    createTime: '2026-07-15T14:00:00',
  },
]

const MOCK_DETAIL = {
  ...MOCK_LIST[0],
  activeNodeIds: ['Activity_approve1'],
  flowTrace: [
    {
      activityId: 'StartEvent_1',
      activityName: '开始',
      activityType: 'startEvent',
      startTime: '2026-07-20T09:30:00',
      endTime: '2026-07-20T09:30:00',
      assignee: null,
      taskId: null,
    },
    {
      activityId: 'Activity_submit',
      activityName: '提交申请',
      activityType: 'userTask',
      startTime: '2026-07-20T09:30:00',
      endTime: '2026-07-20T10:15:00',
      assignee: '1',
      taskId: 'task-001',
    },
    {
      activityId: 'Activity_approve1',
      activityName: '部门经理审批',
      activityType: 'userTask',
      startTime: '2026-07-20T10:15:00',
      endTime: null,
      assignee: '2',
      taskId: 'task-002',
    },
  ],
}

function createWrapper() {
  return mount(ProcessInstanceList, {
    global: {
      stubs: {
        // 不 stub Element Plus 组件——让它们正常渲染（el-table 在 jsdom 中降级为普通 table）
        'el-drawer': {
          template: '<div v-if="modelValue" class="mock-drawer"><slot /></div>',
          props: ['modelValue', 'title', 'size', 'destroyOnClose', 'closeOnClickModal'],
        },
      },
    },
  })
}

describe('ProcessInstanceList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 默认 mock：列表 + 流程定义 map + BPMN XML 均成功
    mockPageProcessDefs.mockResolvedValue({
      list: [
        { id: 1, processKey: 'leave_approval', name: '请假审批流程', formKey: 'leave-request', defVersion: 1, status: 'PUBLISHED', createTime: '', updateTime: '' },
        { id: 2, processKey: 'skeleton_approval', name: '单节点审批流程', formKey: 'it_application', defVersion: 1, status: 'PUBLISHED', createTime: '', updateTime: '' },
      ],
      total: 2,
      pageNum: 1,
      pageSize: 100,
    })
    mockGetProcessDefGraph.mockResolvedValue('<definitions />')
  })

  // ────────────────────────────────────────────
  // 列表
  // ────────────────────────────────────────────

  it('挂载后加载实例列表并渲染表格行', async () => {
    mockQueryInstances.mockResolvedValue({
      list: MOCK_LIST,
      total: 2,
      pageNum: 1,
      pageSize: 10,
    })

    const wrapper = createWrapper()
    await nextTick()
    await nextTick()

    // 列表应包含 2 条记录
    expect(mockQueryInstances).toHaveBeenCalledTimes(1)
    const rows = wrapper.findAll('.el-table__body tbody tr')
    expect(rows.length).toBe(2)
  })

  it('API 报错时显示错误提示', async () => {
    mockQueryInstances.mockRejectedValue({ msg: '服务器内部错误' })

    const wrapper = createWrapper()
    // 等待异步操作完成（mock resolver/rejector）
    await new Promise((r) => setTimeout(r, 100))
    await nextTick()

    expect(wrapper.find('.el-alert--error').exists()).toBe(true)
  })

  // ────────────────────────────────────────────
  // 详情抽屉
  // ────────────────────────────────────────────

  it('点击"查看详情"打开抽屉并显示实例基本信息', async () => {
    mockQueryInstances.mockResolvedValue({
      list: MOCK_LIST,
      total: 2,
      pageNum: 1,
      pageSize: 10,
    })
    mockGetInstanceDetail.mockResolvedValue(MOCK_DETAIL)

    const wrapper = createWrapper()
    await nextTick()
    await nextTick()

    // 点击第一行的"查看详情"按钮
    const btn = wrapper.find('.el-table__body tbody tr:first-child .el-button')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')

    // 等待异步加载
    await new Promise((r) => setTimeout(r, 100))
    await nextTick()

    // 应调用详情 API
    expect(mockGetInstanceDetail).toHaveBeenCalledWith('proc-001')
    // 应调用 getProcessDefGraph
    expect(mockGetProcessDefGraph).toHaveBeenCalled()
  })

  it('实例不存在时 drawer 内显示错误', async () => {
    mockQueryInstances.mockResolvedValue({
      list: MOCK_LIST,
      total: 2,
      pageNum: 1,
      pageSize: 10,
    })
    // 实例不存在：API 抛 ApiError(code=404)
    const notFoundError = new Error('流程实例不存在') as Error & { msg: string; code: number }
    notFoundError.msg = '流程实例不存在'
    notFoundError.code = 404
    mockGetInstanceDetail.mockRejectedValue(notFoundError)

    const wrapper = createWrapper()
    await nextTick()
    await nextTick()

    const btn = wrapper.find('.el-table__body tbody tr:first-child .el-button')
    await btn.trigger('click')

    await new Promise((r) => setTimeout(r, 100))
    await nextTick()

    // drawer 内应显示错误 alert
    const drawerError = wrapper.find('.mock-drawer .el-alert--error')
    expect(drawerError.exists()).toBe(true)
  })
})
```

**注意**：
- 测试 mock 了 `@/modules/workflow/api`（避免真实网络调用）和 `@/adapters/bpmn`（避免 bpmn-js DOM 依赖）
- `StandardListTemplate` 被 stub 为简单容器（避免其内部复杂子组件的依赖问题）
- `el-drawer` 被 stub 为条件渲染容器（`v-if="modelValue"`），确保 drawer 打开时其内部内容可见
- 测试覆盖：列表渲染 / API 错误处理 / 抽屉打开 + 详情展示 / 实例不存在错误
- 不测试 bpmn-js 的 `highlight()` 调用（mock 的 `mountBpmnViewer` 返回 mock viewer 实例，verify `highlight` 被调用需要 await drawer 异步流程完成；当前 mock 下 highlight 会被调用但 verify 依赖异步时序——不在单元测试层面验证）

### 9.9 校验门

```bash
pnpm run lint          # ESLint 检查（零新增错误）
pnpm run test:unit     # Vitest 单元测试（含新增 ProcessInstanceList.spec.ts）
pnpm run build         # 生产构建（确认无编译/类型错误）
```

**预期结果**：
- `pnpm run lint` 零新增错误
- `pnpm run test:unit` 全部通过，59→60+ spec files, 517→521+ tests
- `pnpm run build` 成功，无 TS 类型错误
- 已有 spec 文件不退化（零失败）

## 10. 关键实现约束

1. **前后端分离红线**：本 Step 只改前端文件，不碰后端 `Smart-WorkFlow/` 任何文件
2. **API 契约对齐**：新增 `ProcessInstance` / `InstanceDetail` / `ActivityNode` interface 字段名必须与后端 DTO 完全一致（camelCase，Jackson 默认序列化）。不确定时参照 Step 2 方案 §9.1-9.2 的 DTO 字段定义
3. **BPMN viewer 生命周期**：每次打开抽屉重新 mount → 关闭抽屉必须 destroy。不重用 viewer 实例（BPMN XML 因实例不同可能不同）
4. **高亮 marker class 命名**：`highlight-active`（活跃节点绿色）、`highlight-completed`（已完成节点灰色）。不要覆盖 bpmn-js 内置的 `.highlight` class（ProcessDefList 可能用它做点击高亮）
5. **el-drawer 而不是 el-dialog**：按 [[process-monitoring §5]] D2 决策，详情使用侧边抽屉而非居中对话框
6. **已结束实例的 activeNodeIds 为空**：不抛异常，流程图只展示已完成节点灰色高亮
7. **processName 可能为 null**：显示 `-` 而非留空。与 `TaskDetail.vue` 的 `{{ detail.processName ?? '-' }}` 一致
8. **时间线只展示 userTask**：`flowTrace` 包含所有 BPMN 元素（startEvent / endEvent / sequenceFlow / userTask），时间线表格只展示 `activityType === 'userTask'` 的条目
9. **不修改已有 mock handler 的函数签名**：BPMN XML handler 的替换只是改变返回的 XML 内容，不改变 pattern / method / handler 签名
10. **`defKeyToIdMap` 失败不回退到错误**：映射加载失败时，流程图区域显示"未找到对应流程定义"，不阻断列表渲染

## 11. 边界情况

| 场景 | 处理方式 |
|------|------|
| **列表为空** | `StandardListTemplate` 的 `empty` prop 为 true → 显示空态插画。不显示错误 alert |
| **API 返回 code !== 0** | `request()` 内部抛 `ApiError`，前端 catch 后 `errorMsg = err.msg` |
| **网络断开/browser offline** | catch 非 ApiError → `errorMsg = '加载流程实例列表失败'` |
| **processName 为 null（流程定义已删除）** | 列表和详情均显示 `-` |
| **activeNodeIds 为空数组（已结束实例）** | 流程图不显示绿色高亮，仅显示灰色已完成节点 |
| **flowTrace 为空（刚启动的实例，无历史活动）** | 流转记录区域显示"暂无审批记录"（`el-alert type="info"`） |
| **processDefKey → defId 映射失败** | `defKeyToIdMap` 为空 → 流程图区域显示 `el-alert` 错误提示"未找到对应流程定义"。基本信息 + 流转记录仍正常展示 |
| **BPMN XML 渲染失败**（bpmn-js `importXML` 失败） | `mountBpmnViewer` 抛异常 → drawer 内 `el-alert.type="error"` 显示错误信息。已有 viewer 实例被销毁（如果有） |
| **el-drawer 打开过程中用户快速切换行** | 每次 `openDrawer()` 先设 `detail.value = null` → 重新创建 viewer → 重新加载详情。旧 viewer 在 `mountBpmnViewer` 前被销毁 |
| **`fitViewport()` 在 drawer 动画完成前调用** | try-catch 忽略——初始渲染位置由 bpmn-js 默认缩放决定。process-monitoring Step 0 D2 决策已明确此绕路方案 |
| **多个活跃节点（并行网关）** | `activeNodeIds` 可能含多个 ID → 全部绿色高亮。CSS `.highlight-active` 规则对所有匹配 SVG 元素生效 |
| **activityId 在 BPMN XML 中不存在** | `viewerInstance.highlight(id)` 内部调用 `canvas.addMarker(id)` → bpmn-js 对不存在的 element 静默忽略。外层 try-catch 兜底 |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:---:|------|------|
| 增强的 BPMN XML mock 导致 ProcessDefList 查看器出现意外高亮 | 低 | 低 | 新 XML 中的 userTask element 没有对应的 `bpmndi:BPMNShape` 外的意外引用。ProcessDefList 弹窗中不调用 `highlight()`，不会触发 marker CSS |
| el-drawer 与 el-dialog 的 DOM 层级差异导致 bpmn-js 渲染尺寸异常 | 中 | 中 | `el-drawer` 默认挂载在 body 下，容器宽度由 `size="900px"` 决定。bpmn-js 在 `mountBpmnViewer` 中读取 `container` 的实际 DOM 尺寸——如果 drawer 动画未完成时容器 size=0，`fitViewport()` 会失败。已通过 try-catch 忽略该时序问题 |
| `:deep()` CSS 选择器与 bpmn-js 版本不兼容 | 低 | 中 | 高亮 CSS 的 `:deep(.highlight-active:not(.djs-connection) .djs-visual > :nth-child(1))` 依赖 bpmn-js 内部 SVG 结构。bpmn-js 版本固定在 `package.json` 的 lockfile 中，不会自动升级 |
| `defKeyToIdMap` 在全量取流程定义时数据量过大 | 极低 | 低 | 当前 mock 只有 4 条数据，生产环境流程定义数量有限（≤ 100）。`pageSize: 100` 一次取全 |
| mock BPMN XML 替换后 ProcessDefList 的测试退化 | 低 | 中 | ProcessDefList 的测试使用 mock API，不加载真实 BPMN XML。唯一风险是手工查看 ProcessDefList 弹窗时，流程图变为含 4 个 userTask 的横向长图——视觉效果仍正常，只是比之前最简 XML 稍复杂 |

**回滚方案**：
- `git checkout --` 还原所有修改文件 + `git clean -f` 删除新建文件
- 回滚验证：
  ```bash
  pnpm run test:unit   # 确认回退到 59 spec files / 517 tests
  pnpm run lint        # 零新增错误
  ```

**回滚影响范围**：
- ProcessInstanceList.vue 独立新增，删除后不影响已有页面
- contracts/bpm.ts 只是追加 3 个 interface，删除追加行后不影响已有 interface
- api/index.ts 只是追加 2 个 API 函数，删除追加行后不影响已有函数
- mock handlers.ts 的追加条目独立于已有 handler，删除后不影响已有 mock
- mock BPMN XML 替换回原先的最简 XML 即可还原 ProcessDefList 查看效果

## 13. 测试方案

### 13.1 静态检查

| 检查项 | 命令 | 预期结果 |
|------|------|------|
| ESLint 零新增错误 | `pnpm run lint` | 零 error、零 warning（如有已有 warning 不计） |
| TypeScript 编译 | `pnpm run build`（或 `vue-tsc --noEmit`） | 零类型错误 |
| 新增文件存在 | `ls src/modules/workflow/views/ProcessInstanceList.vue src/modules/workflow/views/__tests__/ProcessInstanceList.spec.ts` | 两个文件均存在 |
| contracts/bpm.ts 含新 interface | `grep "ProcessInstance\|InstanceDetail\|ActivityNode" src/contracts/bpm.ts` | 至少匹配 ProcessInstance / InstanceDetail / ActivityNode |
| api/index.ts 含新函数 | `grep "queryInstances\|getInstanceDetail" src/modules/workflow/api/index.ts` | 匹配 2 处新函数 |
| router 含新路由 | `grep "ProcessInstanceList" src/router/index.ts` | 匹配 1 处路由注册 |
| handlers.ts 含新 mock | `grep "workflow/instances" src/foundation/mock/handlers.ts` | 匹配 2 处（列表 + 详情） |
| 不修改后端文件 | `git diff --name-only` | 零 `Smart-WorkFlow/` 路径的文件 |

### 13.2 单元测试

#### ProcessInstanceList.spec.ts（新建）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | 挂载后加载实例列表并渲染表格行 | 列表 API 调用 + DOM 渲染 |
| 2 | API 报错时显示错误提示 | 列表加载失败 → `el-alert` 展示错误信息 |
| 3 | 点击"查看详情"打开抽屉并显示实例基本信息 | 抽屉打开 + 详情 API 调用 + BPMN XML 获取 |
| 4 | 实例不存在时 drawer 内显示错误 | 详情 API 返回 404 → drawer 内 `el-alert` 展示错误 |

**测试策略**：
- 使用 Vitest + @vue/test-utils + vi.mock（mock `@/modules/workflow/api` + `@/adapters/bpmn`）
- 不加载真实 bpmn-js（mock `mountBpmnViewer` 返回 stub viewer instance）
- Stub `StandardListTemplate` 为简单容器（避免其复杂子组件依赖）
- Stub `el-drawer` 为条件渲染 div（`v-if` 控制可见性）
- 测试数据使用 simple POJO（`MOCK_LIST` / `MOCK_DETAIL`）
- 使用 `@vue/test-utils` 的 `find()` + `trigger()` 模拟用户交互

### 13.3 手工验证

| # | 验证场景 | 操作步骤 | 预期结果 |
|---|------|------|------|
| 1 | 列表页正常渲染 | 访问 `/workflow/instances`（mock 模式） | 看到 6 条实例，按创建时间倒序排列，状态列显示彩色 tag |
| 2 | 状态过滤 | 选择"运行中" → 列表刷新 | 只显示 RUNNING 状态的实例（proc-001/004/006），共 3 条 |
| 3 | 查看详情—运行中实例 | 点击 proc-001"查看详情" | 抽屉打开：基本信息正确、流程图显示 `Activity_approve1` 绿色高亮 + `Activity_submit`/`StartEvent_1` 灰色高亮 |
| 4 | 查看详情—已完成实例 | 点击 proc-002"查看详情" | 活跃节点 0 个（无绿色高亮）、已完成节点全部灰色高亮 |
| 5 | 查看详情—并行活跃节点 | 点击 proc-006"查看详情" | `Activity_approve1` + `Activity_approve2` 均绿色高亮 |
| 6 | 流转时间线 | 打开任意详情，滚动到流转记录卡片 | `el-table` 展示 userTask 节点（不含 startEvent/sequenceFlow），运行中节点"完成时间"列显示"进行中···" |
| 7 | 已驳回实例 | 页面加载后观察 proc-003 状态列 | 显示红色 tag"已驳回" |
| 8 | 空列表场景 | 选择"已驳回" → 再选"运行中"（mock 有数据，改为手动清空 `list.value`） | 或在 mock 中临时将 MOCK_INSTANCES 赋空：页面显示空态插画 |
| 9 | 关闭抽屉 | 打开详情 → 点击 drawer 外部或关闭按钮 | drawer 关闭，viewer 实例被销毁（无 console error） |

### 13.4 回归检查

| 检查项 | 预期结果 |
|------|------|
| 已有 spec 文件通过数不减少 | `pnpm run test:unit` 中所有已有 spec 仍全绿（59 files / 517 tests 不退化） |
| ProcessDefList.vue 不受影响 | 访问 ProcessDefList → 点击"查看流程图" → 弹窗正常显示（BPMN XML 变为增强版，视觉效果稍复杂但正常） |
| TaskDetail.vue 不受影响 | 任务详情页审批历史表格正常 |
| ESLint 零新增告警 | `pnpm run lint` 通过 |
| TypeScript 编译通过 | `pnpm run build` 成功 |

## 14. 验收标准

| # | 验收标准 | 验证方式 |
|---|------|------|
| 1 | `contracts/bpm.ts` 追加了 `ProcessInstance` / `InstanceDetail` / `ActivityNode` interface | grep 匹配 3 个 interface 名称 |
| 2 | `api/index.ts` 追加了 `queryInstances` / `getInstanceDetail` 函数 | grep 匹配 2 个函数名称 |
| 3 | `ProcessInstanceList.vue` 存在，包含 `StandardListTemplate` + `el-drawer` + `el-table`（列表 + 流转记录） | 读取文件确认 |
| 4 | 列表页使用 `el-select` 支持状态过滤（RUNNING/APPROVED/REJECTED/全部） | 模板中含 `el-select` + `v-model="filterStatus"` |
| 5 | 点击行"查看详情"按钮打开 `el-drawer`，drawer 内包含三个卡片：基本信息（`el-descriptions`）+ 流程图（bpmn viewer 容器）+ 流转记录（`el-table`） | 代码审查 + 手工验证 |
| 6 | 流程图加载后自动应用高亮：活跃节点绿色、已完成节点灰色 | 代码中含 `applyHighlights()` 调用 + `:deep()` CSS 定义 `.highlight-active` / `.highlight-completed` |
| 7 | `router/index.ts` 注册了 `/workflow/instances` → `ProcessInstanceList` 路由 | grep 匹配 `ProcessInstanceList` |
| 8 | `handlers.ts` 追加了 `GET /workflow/instances` + `GET /workflow/instances/:processInstanceId` mock handler | grep 匹配 `/api/workflow/instances` |
| 9 | Mock BPMN XML 含 `userTask` 节点（`Activity_submit` / `Activity_approve1` / `Activity_approve2`），ID 与 `MOCK_INSTANCE_DETAILS` flowTrace 的 activityId 一致 | grep BPMN XML 中的 `userTask` 元素 |
| 10 | `pnpm run lint` 零新增错误 | 命令输出 |
| 11 | `pnpm run test:unit` 全部通过，59→60+ spec files | 命令输出 |
| 12 | `pnpm run build` 编译成功 | 命令输出 |
| 13 | 已有 517 tests 不退化 | Vitest 输出 PASS，无 FAIL |
| 14 | 不修改后端 `Smart-WorkFlow/` 任何文件 | `git diff --name-only` 零后端文件 |
| 15 | `processName` 为 null 时列表/详情显示 `-`（不崩溃） | 代码中含 `?? '-'` 或等价 handle |
| 16 | drawer 关闭时销毁 bpmn viewer 实例 | `closeDrawer()` 中调用 `viewerInstance.destroy()` |

## 15. 执行回执格式

按 `Smart-WorkFlow-Web/.claude/system.md` 或上级规划代理指定的格式产出执行回执，写入 `Smart-WorkFlow-Web/product/process-monitoring/receipts/step-3-execution.md`。

特别注意回执中需包含：
- 新建文件清单（ProcessInstanceList.vue + ProcessInstanceList.spec.ts）+ 修改文件清单（contracts/bpm.ts + api/index.ts + seeds.ts + handlers.ts + router/index.ts）
- `pnpm run lint` 输出摘要（zero new errors）
- `pnpm run test:unit` 完整输出摘要（59→60+ spec files, 517→521+ tests, 0 failures）
- `pnpm run build` 编译结果
- `grep` 静态检查的命中结果（新 interface / 新 API 函数 / 新路由 / 新 mock handler）
- 后端文件零修改确认（`git diff --name-only` 中无 `Smart-WorkFlow/` 文件）
- 手工验证清单的执行结果（逐项标注通过/失败/跳过）

## 16. 测试回执格式

按 `Smart-WorkFlow-Web/.claude/system.md` 或上级规划代理指定的格式产出测试回执，写入 `Smart-WorkFlow-Web/product/process-monitoring/receipts/step-3-test.md`。

特别注意回执中需包含：
- 逐条对照 §14 验收标准（16 条）
- `ProcessInstanceList.spec.ts` 各 `it()` 的输出摘要（每个测试用例的通过/失败状态）
- 全量 `pnpm run test:unit` 的完整输出（59→60+ spec files, 517→521+ tests）
- 手工验证清单的执行结果
- 已有测试不退化确认

## 17. 明确禁止事项

- ❌ **禁止**修改后端 `Smart-WorkFlow/` 任何文件（Controller / Service / Facade / DTO / pom.xml / Flyway）
- ❌ **禁止**新增或修改后端 REST 端点
- ❌ **禁止**修改 `@/adapters/bpmn/index.ts` 防腐层
- ❌ **禁止**修改 `ProcessDefList.vue` / `TaskDetail.vue` / `TodoList.vue` / `ProcessedList.vue` 及已有页面
- ❌ **禁止**修改 `src/foundation/request/index.ts`（`request()` 函数）
- ❌ **禁止**修改 `src/foundation/mock/index.ts`（mock registry 初始化）
- ❌ **禁止**新增 npm 依赖或修改 `package.json`
- ❌ **禁止**修改 `src/stores/` 中的 menu/permission store
- ❌ **禁止**在 `contracts/bpm.ts` 中删除或重命名已有 interface 字段
- ❌ **禁止**在 `api/index.ts` 中删除或修改已有 API 函数签名
- ❌ **禁止**在 `ProcessInstanceList.vue` 中直接 import bpmn-js 内部模块（`bpmn-js/lib/Viewer` 等）——必须通过 `@/adapters/bpmn` 防腐层
- ❌ **禁止**在 drawer 中自动播放/轮询（不做 WebSocket / setInterval 实时刷新——首批范围不含实时监控）
- ❌ **禁止**新增页面级状态管理（Pinia store）——ProcessInstanceList 的状态留在组件内部（`ref` + `computed`），与其他列表页模式一致
