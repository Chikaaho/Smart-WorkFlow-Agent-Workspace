# Step F2：Vue 视图（JobList + JobLog）

## 1. 当前状态

- **功能**：job-scheduler（定时任务调度模块），第 6/7 Step
- **前置 Step**：B1 ✅ B2 ✅ B3 ✅ B4 ✅ F1 ✅ — 后端全部完成（406 tests），前端合约+API+测试已完成（51 files / 451 tests）
- **F1 产物已就位**：`src/contracts/job.ts`（合约类型）、`src/modules/job/api/index.ts`（10 API 函数）、`src/modules/job/api/index.spec.ts`（13 测试用例）
- **前端基线**：51 spec files / 451 tests（CONFIRMED 2026-07-21 F1 验收）
- **本 Step 是前端首个 UI 产出 Step**，创建两个 Vue 视图页面及其单元测试
- **参照模块**：storage（StorageList.vue + spec）和 notify（NotifyHome.vue + spec）的 F2 产物

## 2. Step 目标

创建任务调度模块的两个 Vue 页面组件：**JobList**（定时任务管理列表页，含创建/编辑/删除/暂停/恢复/触发操作）和 **JobLog**（执行日志查看页，按任务 ID 分页展示日志），以及对应的单元测试文件。打通前端 UI 到 API 层的完整调用链路。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：两个 StandardListTemplate 页型 B 实例 — 所有模式（列表加载、筛选、分页、CRUD 弹窗、el-table、el-tag、ElMessageBox 确认、Element Plus 组件使用）在 storage/notify/workflow 模块的 F2 产物中有成熟参照。0 个新架构决策、0 个新组件模式。Flash 完全胜任。
是否触发升级条件：否

## 4. 模型选择理由

本 Step 是将已有 API 层和合约类型组装为两个 StandardListTemplate 列表页，参照代码（StorageList.vue、NotifyHome.vue 及其 spec）形式完备，页面逻辑为标准列表 CRUD + 过滤 + 分页模式。

## 5. 已知上下文

### 5.1 F1 已产出的 API 函数

```typescript
// 来自 src/modules/job/api/index.ts — 10 个函数
pageJobInfos(pageNum, pageSize, query?) → Promise<PageResult<JobInfo>>
getJobInfo(id) → Promise<JobInfo>
createJobInfo(data) → Promise<number>
updateJobInfo(data) → Promise<void>
deleteJobInfo(id) → Promise<void>
pauseJob(id) → Promise<void>
resumeJob(id) → Promise<void>
triggerJob(id) → Promise<void>
pageJobLogs(jobId, pageNum, pageSize) → Promise<PageResult<JobLog>>
getJobLog(id) → Promise<JobLog>
```

### 5.2 F1 已产出的合约类型

```typescript
// 来自 src/contracts/job.ts
type JobStatus = 'NORMAL' | 'PAUSED'
type JobType = 'BEAN' | 'FLOW'
type ExecStatus = 'RUNNING' | 'SUCCESS' | 'FAILED'
type TriggerType = 'AUTO' | 'MANUAL'

interface JobInfo {
  id?: number; jobName: string; jobGroup?: string; jobType?: JobType;
  cronExpression: string; status?: JobStatus; concurrent?: boolean;
  misfirePolicy?: number; description?: string; beanName?: string;
  beanParams?: string; flowDefKey?: string; formData?: string;
  lastFireTime?: string; nextFireTime?: string;
  createTime?: string; updateTime?: string; createBy?: number; updateBy?: number;
}

interface JobLog {
  id?: number; jobId: number; jobName?: string; jobGroup?: string;
  triggerType: TriggerType; jobParams?: string; execStatus: ExecStatus;
  startTime?: string; endTime?: string; duration?: number;
  resultMsg?: string; exceptionStack?: string; createTime?: string;
}
```

### 5.3 StandardListTemplate 组件 API

```typescript
// 来自 src/components/page-layout/StandardListTemplate.vue
props: {
  title?: string        // 页面标题
  total: number          // 记录总数
  pageNum: number        // 当前页码
  pageSize: number       // 每页条数
  empty?: boolean        // 是否显示空态
}
emits: {
  'update:pageNum': [value: number]
  'update:pageSize': [value: number]
}
slots: {
  'toolbar-actions'  // 工具栏右侧操作按钮（如"新建任务"）
  'filter'           // 筛选输入区
  'filter-actions'   // 筛选操作按钮（查询/重置）
  default            // 表格主体（el-table）
  'empty-action'     // 空态操作按钮
}
```

### 5.4 列表页编码模式（从 StorageList/NotifyHome 提取）

```
1. 导入：ref/reactive/computed/onMounted + ElMessage/ElMessageBox + StandardListTemplate + API 函数 + ApiError + 合约类型
2. 状态：list ref、total ref、pageNum ref、pageSize ref（默认 10）、loading ref、errorMsg ref
3. 筛选：filter reactive（绑定 v-model）+ currentFilter reactive（查询时同步）。双对象模式：filter 实时绑定输入，currentFilter 只在点"查询"时更新
4. isEmpty computed：!loading && !errorMsg && list.length === 0
5. loadList() 异步函数：设 loading → 清 error → 调 API → 赋值 list/total → catch ApiError/fallback
6. handleQuery()：同步 currentFilter ← filter，pageNum=1，loadList()
7. handleReset()：清空 filter 和 currentFilter，pageNum=1，loadList()
8. handlePageNumChange / handlePageSizeChange：更新页码/页大小，loadList()
9. onMounted(loadList)
10. 模板：StandardListTemplate 包裹 el-alert（条件 v-if errorMsg）+ el-table（v-loading + data + stripe） + 操作列（link button）
11. 弹窗：el-dialog（v-model + destroy-on-close + width）+ 表单 + footer 按钮
12. 确认：ElMessageBox.confirm 用于删除等不可逆操作，catch 处理取消
13. 成功/失败提示：ElMessage.success / ElMessage.error
```

### 5.5 视图测试编码模式（从 StorageList.spec.ts 提取）

```
1. vi.mock API 层（路径 '@/modules/job/api'）+ vi.mock element-plus + vi.mock vue-router
2. 桩组件对象 stubs：StandardListTemplate / el-alert / el-table / el-table-column / el-button / el-tag / el-dialog / el-input / el-select / el-option
3. 数据工厂函数 makeJobInfo() / makeJobLog()
4. 动态 import SUT：const JobList = await import('./JobList.vue')
5. beforeEach vi.clearAllMocks()
6. 测试场景：mount 调 pageJobInfos / 数据进入 list ref / ApiError → errorMsg / fallback error → errorMsg / isEmpty 空态 / 弹窗开关 / 删除确认成功 / 删除取消 / 删除失败
```

### 5.6 新建目录结构

```
src/modules/job/
├── api/
│   ├── index.ts          — F1 产物（已存在）
│   └── index.spec.ts     — F1 产物（已存在）
└── views/
    ├── JobList.vue       — 🆕 本 Step
    ├── JobList.spec.ts   — 🆕 本 Step
    ├── JobLog.vue        — 🆕 本 Step
    └── JobLog.spec.ts    — 🆕 本 Step
```

## 6. 执行前必须读取的文件

按优先级排列：

1. `src/components/page-layout/StandardListTemplate.vue` — 页型 B 模板 API（props/slots/emits）
2. `src/contracts/job.ts` — 合约类型（JobInfo / JobLog / JobStatus / JobType / ExecStatus / TriggerType）
3. `src/modules/job/api/index.ts` — 10 个 API 函数签名
4. `src/modules/storage/views/StorageList.vue` — 列表页参照（StandardListTemplate 使用模式、筛选/分页/弹窗/确认）
5. `src/modules/storage/views/StorageList.spec.ts` — 列表页测试参照（mock 模式、桩组件、数据工厂）
6. `src/modules/notify/views/NotifyHome.vue` — 简单列表页参照（无弹窗、无复杂操作）
7. `src/foundation/request/index.ts` — ApiError 类（用于 catch 类型判断）
8. `.claude/CLAUDE.md` — 前端工作宪法（四连校验门、设计系统、编码规范）

## 7. 允许修改的文件范围

| 文件 | 操作 | 说明 |
|------|:--:|------|
| `src/modules/job/views/JobList.vue` | 🆕 新建 | 任务管理列表页 |
| `src/modules/job/views/JobList.spec.ts` | 🆕 新建 | 任务列表页单元测试 |
| `src/modules/job/views/JobLog.vue` | 🆕 新建 | 执行日志查看页 |
| `src/modules/job/views/JobLog.spec.ts` | 🆕 新建 | 日志页单元测试 |

> 共 4 个新建文件，0 个修改文件。

## 8. 禁止修改的范围

- ❌ `src/contracts/job.ts` — 合约类型已封版
- ❌ `src/modules/job/api/` — API 层已封版
- ❌ `src/foundation/request/` — 不修改请求层
- ❌ `src/contracts/common.ts` — 不修改通用类型
- ❌ `src/components/page-layout/` — 不修改页型模板
- ❌ `src/foundation/mock/` — 不添加 mock handlers（F3 统一处理）
- ❌ `src/router/` — 不添加路由（F3 统一处理）
- ❌ `src/modules/*/`（除 job/views）— 不触碰其他模块
- ❌ `Smart-WorkFlow/` — 不触碰后端代码
- ❌ `package.json`、`vite.config.ts`、`tsconfig.json`、`eslint.config.js` — 不修改项目配置

## 9. 详细执行方案

### 9.1 新建 `src/modules/job/views/JobList.vue`（~350 行）

任务管理列表页，提供任务的 CRUD 和调度控制。

#### 9.1.1 状态和计算属性

```typescript
// ─── 列表状态 ───
const list = ref<JobInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMsg = ref('')

// ─── 筛选状态（双对象模式）───
const filter = reactive({ jobName: '', status: '' as JobStatus | '', jobType: '' as JobType | '' })
const currentFilter = reactive({ jobName: '', status: '' as JobStatus | '', jobType: '' as JobType | '' })

// ─── 弹窗状态 ───
const dialogVisible = ref(false)
const dialogTitle = ref('新建任务')
const dialogLoading = ref(false)
const dialogError = ref('')
const editingId = ref<number | null>(null) // null = 创建模式

// ─── 表单数据 ───
const form = reactive<JobInfo>({
  jobName: '',
  cronExpression: '',
  jobGroup: 'DEFAULT',
  jobType: 'BEAN',
  status: 'NORMAL',
  concurrent: false,
  misfirePolicy: 0,
  description: '',
  beanName: '',
  beanParams: '',
  flowDefKey: '',
  formData: '',
})

// ─── 操作 loading（防重复点击）───
const operatingId = ref<number | null>(null)

// 计算属性
const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)
// 当表单 jobType 变更时清空不相关的字段
const showBeanFields = computed(() => form.jobType === 'BEAN')
const showFlowFields = computed(() => form.jobType === 'FLOW')
```

#### 9.1.2 列表加载和筛选

```typescript
async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const query: Partial<Pick<JobInfo, 'jobName' | 'jobType' | 'status'>> = {}
    if (currentFilter.jobName) query.jobName = currentFilter.jobName
    if (currentFilter.jobType) query.jobType = currentFilter.jobType as JobType
    if (currentFilter.status) query.status = currentFilter.status as JobStatus

    const result = await pageJobInfos(pageNum.value, pageSize.value, query)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载任务列表失败'
    }
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  currentFilter.jobName = filter.jobName
  currentFilter.status = filter.status
  currentFilter.jobType = filter.jobType
  pageNum.value = 1
  void loadList()
}

function handleReset() {
  filter.jobName = ''
  filter.status = ''
  filter.jobType = ''
  currentFilter.jobName = ''
  currentFilter.status = ''
  currentFilter.jobType = ''
  pageNum.value = 1
  void loadList()
}

function handlePageNumChange(p: number) { pageNum.value = p; void loadList() }
function handlePageSizeChange(s: number) { pageSize.value = s; pageNum.value = 1; void loadList() }
```

#### 9.1.3 弹窗逻辑

```typescript
// 重置表单为初始值
function resetForm() {
  form.jobName = ''
  form.cronExpression = ''
  form.jobGroup = 'DEFAULT'
  form.jobType = 'BEAN'
  form.status = 'NORMAL'
  form.concurrent = false
  form.misfirePolicy = 0
  form.description = ''
  form.beanName = ''
  form.beanParams = ''
  form.flowDefKey = ''
  form.formData = ''
}

function openCreate() {
  editingId.value = null
  dialogTitle.value = '新建任务'
  dialogError.value = ''
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: JobInfo) {
  editingId.value = row.id ?? null
  dialogTitle.value = '编辑任务'
  dialogError.value = ''
  // 将 row 数据复制到 form
  form.jobName = row.jobName
  form.cronExpression = row.cronExpression
  form.jobGroup = row.jobGroup ?? 'DEFAULT'
  form.jobType = (row.jobType ?? 'BEAN') as JobType
  form.status = (row.status ?? 'NORMAL') as JobStatus
  form.concurrent = row.concurrent ?? false
  form.misfirePolicy = row.misfirePolicy ?? 0
  form.description = row.description ?? ''
  form.beanName = row.beanName ?? ''
  form.beanParams = row.beanParams ?? ''
  form.flowDefKey = row.flowDefKey ?? ''
  form.formData = row.formData ?? ''
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  dialogError.value = ''
  dialogLoading.value = false
}

async function handleSave() {
  // 前端基本校验
  if (!form.jobName.trim()) { dialogError.value = '任务名称不能为空'; return }
  if (!form.cronExpression.trim()) { dialogError.value = 'Cron 表达式不能为空'; return }

  dialogLoading.value = true
  dialogError.value = ''
  try {
    if (editingId.value === null) {
      // 创建
      await createJobInfo(form)
      ElMessage.success('创建成功')
    } else {
      // 更新
      await updateJobInfo({ ...form, id: editingId.value })
      ElMessage.success('更新成功')
    }
    closeDialog()
    void loadList()
  } catch (err) {
    if (err instanceof ApiError) {
      dialogError.value = err.msg
    } else {
      dialogError.value = editingId.value === null ? '创建失败' : '更新失败'
    }
  } finally {
    dialogLoading.value = false
  }
}
```

#### 9.1.4 操作逻辑（删除/暂停/恢复/触发）

```typescript
async function handleDelete(row: JobInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${row.jobName}"吗？删除后不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch { return }

  try {
    await deleteJobInfo(row.id!)
    ElMessage.success('删除成功')
    void loadList()
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.msg : '删除失败')
  }
}

async function handlePause(row: JobInfo) {
  if (operatingId.value !== null) return
  operatingId.value = row.id!
  try {
    await pauseJob(row.id!)
    ElMessage.success('任务已暂停')
    void loadList()
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.msg : '操作失败')
  } finally {
    operatingId.value = null
  }
}

async function handleResume(row: JobInfo) {
  if (operatingId.value !== null) return
  operatingId.value = row.id!
  try {
    await resumeJob(row.id!)
    ElMessage.success('任务已恢复')
    void loadList()
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.msg : '操作失败')
  } finally {
    operatingId.value = null
  }
}

async function handleTrigger(row: JobInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要手动触发任务"${row.jobName}"吗？`,
      '手动触发',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' },
    )
  } catch { return }

  try {
    await triggerJob(row.id!)
    ElMessage.success('触发成功，请查看执行日志')
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.msg : '触发失败')
  }
}

// el-table slot scope row 类型桥接
function editRow(r: unknown) { openEdit(r as JobInfo) }
function deleteRow(r: unknown) { handleDelete(r as JobInfo) }
function pauseRow(r: unknown) { handlePause(r as JobInfo) }
function resumeRow(r: unknown) { handleResume(r as JobInfo) }
function triggerRow(r: unknown) { handleTrigger(r as JobInfo) }

onMounted(loadList)
```

#### 9.1.5 状态标签辅助函数

```typescript
function statusTagType(status: JobStatus): 'success' | 'warning' {
  return status === 'NORMAL' ? 'success' : 'warning'
}
function statusLabel(status: JobStatus): string {
  return status === 'NORMAL' ? '运行中' : '已暂停'
}
function jobTypeLabel(type: JobType): string {
  return type === 'BEAN' ? 'Bean' : '流程'
}
```

#### 9.1.6 模板

```vue
<template>
  <StandardListTemplate
    title="定时任务"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 工具栏：新建按钮 -->
    <template #toolbar-actions>
      <el-button type="primary" @click="openCreate">新建任务</el-button>
    </template>

    <!-- 筛选区 -->
    <template #filter>
      <el-input
        v-model="filter.jobName"
        placeholder="任务名称"
        clearable
        style="width: 200px"
        @keyup.enter="handleQuery"
      />
      <el-select v-model="filter.status" placeholder="状态" clearable style="width: 120px">
        <el-option label="运行中" value="NORMAL" />
        <el-option label="已暂停" value="PAUSED" />
      </el-select>
      <el-select v-model="filter.jobType" placeholder="类型" clearable style="width: 120px">
        <el-option label="Bean" value="BEAN" />
        <el-option label="流程" value="FLOW" />
      </el-select>
    </template>
    <template #filter-actions>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
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
      <el-table-column prop="jobName" label="任务名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="jobGroup" label="任务组" width="100" />
      <el-table-column label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.jobType === 'FLOW' ? 'warning' : 'info'">
            {{ jobTypeLabel(row.jobType as JobType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="cronExpression" label="Cron 表达式" width="160" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status as JobStatus)">
            {{ statusLabel(row.status as JobStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastFireTime" label="上次执行" width="170" />
      <el-table-column prop="nextFireTime" label="下次执行" width="170" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="editRow(row)">编辑</el-button>
          <el-button
            v-if="(row as JobInfo).status === 'NORMAL'"
            size="small" link type="warning"
            :loading="operatingId === (row as JobInfo).id"
            :disabled="operatingId !== null"
            @click="pauseRow(row)"
          >暂停</el-button>
          <el-button
            v-else
            size="small" link type="success"
            :loading="operatingId === (row as JobInfo).id"
            :disabled="operatingId !== null"
            @click="resumeRow(row)"
          >恢复</el-button>
          <el-button size="small" link type="info" @click="triggerRow(row)">触发</el-button>
          <el-button size="small" link type="danger" @click="deleteRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空态操作 -->
    <template #empty-action>
      <el-button type="primary" @click="openCreate">新建任务</el-button>
    </template>
  </StandardListTemplate>

  <!-- 新建/编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    destroy-on-close
    width="560px"
    @closed="closeDialog"
  >
    <el-alert
      v-if="dialogError"
      :title="dialogError"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />
    <el-form label-position="top" :model="form">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务名称" required>
            <el-input v-model="form.jobName" placeholder="请输入任务名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务组">
            <el-input v-model="form.jobGroup" placeholder="DEFAULT" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="Cron 表达式" required>
        <el-input v-model="form.cronExpression" placeholder="0/30 * * * * ?" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务类型">
            <el-select v-model="form.jobType" style="width: 100%">
              <el-option label="Bean（Spring Bean 处理器）" value="BEAN" />
              <el-option label="流程（定时发起流程）" value="FLOW" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="初始状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="运行中" value="NORMAL" />
              <el-option label="已暂停" value="PAUSED" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- Bean 配置（jobType=BEAN 时显示） -->
      <template v-if="showBeanFields">
        <el-form-item label="Bean 名称">
          <el-input v-model="form.beanName" placeholder="Spring Bean 名称" />
        </el-form-item>
        <el-form-item label="Bean 参数">
          <el-input v-model="form.beanParams" type="textarea" :rows="2" placeholder='{"key": "value"}' />
        </el-form-item>
      </template>
      <!-- Flow 配置（jobType=FLOW 时显示） -->
      <template v-if="showFlowFields">
        <el-form-item label="流程定义 Key">
          <el-input v-model="form.flowDefKey" placeholder="流程定义 Key" />
        </el-form-item>
        <el-form-item label="表单数据">
          <el-input v-model="form.formData" type="textarea" :rows="2" placeholder='{"field": "value"}' />
        </el-form-item>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="并发执行">
            <el-switch v-model="form.concurrent" active-text="允许" inactive-text="禁止" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Misfire 策略">
            <el-select v-model="form.misfirePolicy" style="width: 100%">
              <el-option label="忽略" :value="0" />
              <el-option label="立即触发一次" :value="1" />
              <el-option label="放弃执行" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="任务描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="dialogLoading" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>
```

#### 9.1.7 script setup 导入

```typescript
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '@/foundation/request'
import { StandardListTemplate } from '@/components/page-layout'
import {
  pageJobInfos, getJobInfo, createJobInfo, updateJobInfo,
  deleteJobInfo, pauseJob, resumeJob, triggerJob,
} from '@/modules/job/api'
import type { JobInfo } from '@/contracts/job'
import type { JobStatus, JobType } from '@/contracts/job'
```

### 9.2 新建 `src/modules/job/views/JobList.spec.ts`（~200 行）

参照 `StorageList.spec.ts` 模式，测试用例覆盖以下场景：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock job API 层
vi.mock('@/modules/job/api', () => ({
  pageJobInfos: vi.fn(),
  getJobInfo: vi.fn(),
  createJobInfo: vi.fn(),
  updateJobInfo: vi.fn(),
  deleteJobInfo: vi.fn(),
  pauseJob: vi.fn(),
  resumeJob: vi.fn(),
  triggerJob: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
}))

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    ElMessage: { success: vi.fn(), error: vi.fn() },
    ElMessageBox: { confirm: vi.fn() },
  }
})

import { pageJobInfos, createJobInfo, updateJobInfo, deleteJobInfo, pauseJob, resumeJob, triggerJob } from '@/modules/job/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '@/foundation/request'
import type { JobInfo } from '@/contracts/job'

// ─── 测试数据工厂 ───
function makeJobInfo(overrides: Partial<JobInfo> = {}): JobInfo {
  return {
    id: 1, jobName: '测试任务', jobGroup: 'DEFAULT', jobType: 'BEAN',
    cronExpression: '0/30 * * * * ?', status: 'NORMAL',
    concurrent: false, misfirePolicy: 0, description: '测试描述',
    beanName: 'testHandler', beanParams: undefined, flowDefKey: undefined, formData: undefined,
    lastFireTime: '2026-07-21T10:00:00', nextFireTime: '2026-07-21T10:00:30',
    createTime: '2026-07-20T00:00:00', updateTime: '2026-07-20T00:00:00',
    createBy: 1, updateBy: 1,
    ...overrides,
  }
}

// ─── 桩组件 ───
const stubs = {
  StandardListTemplate: {
    template: '<div><slot name="toolbar-actions"/><slot name="filter"/><slot name="filter-actions"/><slot/><slot name="empty-action"/></div>',
    props: ['title', 'total', 'pageNum', 'pageSize', 'empty'],
    emits: ['update:pageNum', 'update:pageSize'],
  },
  'el-alert': { template: '<div class="el-alert">{{ title }}</div>', props: ['title', 'type'] },
  'el-table': { template: '<div><slot/></div>', props: ['data'] },
  'el-table-column': { template: '<div/>' },
  'el-button': { template: '<button :disabled="disabled"><slot/></button>', props: ['disabled'] },
  'el-tag': { template: '<span><slot/></span>', props: ['type', 'size'] },
  'el-dialog': { template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>', props: ['modelValue', 'title'] },
  'el-input': { template: '<input/>', props: ['modelValue', 'placeholder'] },
  'el-select': { template: '<select><slot/></select>', props: ['modelValue', 'placeholder'] },
  'el-option': { template: '<option/>' },
  'el-form': { template: '<div><slot/></div>', props: ['model'] },
  'el-form-item': { template: '<div><slot/></div>', props: ['label', 'required'] },
  'el-row': { template: '<div><slot/></div>' },
  'el-col': { template: '<div><slot/></div>' },
  'el-switch': { template: '<input type="checkbox"/>', props: ['modelValue'] },
}

// ═══════════
// 测试用例（~14 个 it）
// ═══════════

describe('JobList.vue', () => {
  beforeEach(() => { vi.clearAllMocks() })

  // T1: onMounted 调用 pageJobInfos（默认 pageNum=1, pageSize=10, query={}）
  it('calls pageJobInfos on mount', async () => { ... })
  // T2: 数据进入 list ref
  it('renders job data into list ref', async () => { ... })
  // T3: ApiError → errorMsg
  it('sets errorMsg when pageJobInfos fails with ApiError', async () => { ... })
  // T4: 非 ApiError fallback
  it('sets fallback errorMsg for non-ApiError', async () => { ... })
  // T5: 空列表 → isEmpty=true
  it('isEmpty is true when list is empty', async () => { ... })
  // T6: 创建弹窗 openCreate
  it('openCreate sets dialogVisible and dialogTitle', async () => { ... })
  // T7: 编辑弹窗 openEdit → form 填充
  it('openEdit populates form from row data', async () => { ... })
  // T8: 保存创建成功 → ElMessage.success + 关闭弹窗 + 刷新列表
  it('handleSave creates job and refreshes', async () => { ... })
  // T9: 保存更新成功
  it('handleSave updates job and refreshes', async () => { ... })
  // T10: 删除确认 → 成功
  it('handleDelete confirm calls deleteJobInfo and refreshes', async () => { ... })
  // T11: 删除取消 → 不调 API
  it('handleDelete cancel does not call deleteJobInfo', async () => { ... })
  // T12: 暂停成功
  it('handlePause calls pauseJob and refreshes', async () => { ... })
  // T13: 恢复成功
  it('handleResume calls resumeJob and refreshes', async () => { ... })
  // T14: 触发确认 → 成功
  it('handleTrigger confirm calls triggerJob', async () => { ... })
})
```

> 完整的 async import + mount + 断言代码模式与 StorageList.spec.ts 一致，使用 `wrapper.vm as unknown as {...}` 类型断言访问内部状态。

### 9.3 新建 `src/modules/job/views/JobLog.vue`（~180 行）

执行日志查看页，只读展示，无 CRUD 操作。

#### 9.3.1 状态和计算属性

```typescript
// 从 query 参数获取 jobId
import { useRoute } from 'vue-router'
const route = useRoute()
const routeJobId = computed(() => {
  const raw = route.query.jobId
  return raw ? Number(raw) : null
})

// ─── 列表状态 ───
const list = ref<JobLog[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMsg = ref('')

// ─── 筛选状态 ───
const filter = reactive({ execStatus: '' as ExecStatus | '' })
const currentFilter = reactive({ execStatus: '' as ExecStatus | '' })

// ─── 详情弹窗 ───
const detailVisible = ref(false)
const detailLog = ref<JobLog | null>(null)

// ─── jobId 校验 ───
const noJobId = computed(() => routeJobId.value === null)

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)
```

#### 9.3.2 列表加载

```typescript
async function loadList() {
  if (noJobId.value) { errorMsg.value = '缺少任务 ID 参数'; return }
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await pageJobLogs(routeJobId.value!, pageNum.value, pageSize.value)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    errorMsg.value = err instanceof ApiError ? err.msg : '加载执行日志失败'
  } finally {
    loading.value = false
  }
}
```

#### 9.3.3 状态标签和详情

```typescript
function execStatusTagType(status: ExecStatus): 'success' | 'danger' | 'warning' {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  return 'warning' // RUNNING
}
function execStatusLabel(status: ExecStatus): string {
  if (status === 'SUCCESS') return '成功'
  if (status === 'FAILED') return '失败'
  return '运行中'
}
function triggerTypeLabel(type: TriggerType): string {
  return type === 'AUTO' ? '自动' : '手动'
}

function openDetail(row: JobLog) {
  detailLog.value = row
  detailVisible.value = true
}
function closeDetail() {
  detailVisible.value = false
  detailLog.value = null
}

// row 类型桥接
function detailRow(r: unknown) { openDetail(r as JobLog) }
```

#### 9.3.4 模板

```vue
<template>
  <StandardListTemplate
    title="执行日志"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <template #filter>
      <el-select v-model="filter.execStatus" placeholder="执行状态" clearable style="width: 140px">
        <el-option label="运行中" value="RUNNING" />
        <el-option label="成功" value="SUCCESS" />
        <el-option label="失败" value="FAILED" />
      </el-select>
    </template>
    <template #filter-actions>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </template>

    <!-- 缺少 jobId -->
    <el-alert
      v-if="noJobId"
      title="请从任务列表页跳转访问执行日志"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />
    <!-- 加载错误 -->
    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="jobName" label="任务名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="触发方式" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="(row as JobLog).triggerType === 'MANUAL' ? 'warning' : 'info'">
            {{ triggerTypeLabel((row as JobLog).triggerType as TriggerType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="执行状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="execStatusTagType((row as JobLog).execStatus as ExecStatus)">
            {{ execStatusLabel((row as JobLog).execStatus as ExecStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="170" />
      <el-table-column prop="endTime" label="结束时间" width="170" />
      <el-table-column label="耗时" width="100" align="right">
        <template #default="{ row }">
          {{ (row as JobLog).duration != null ? `${(row as JobLog).duration}ms` : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="resultMsg" label="结果" min-width="160" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="detailRow(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </StandardListTemplate>

  <!-- 详情弹窗 -->
  <el-dialog
    v-model="detailVisible"
    title="执行详情"
    width="640px"
    destroy-on-close
    @closed="closeDetail"
  >
    <template v-if="detailLog">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">{{ detailLog.jobName }}</el-descriptions-item>
        <el-descriptions-item label="触发方式">{{ triggerTypeLabel(detailLog.triggerType as TriggerType) }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag size="small" :type="execStatusTagType(detailLog.execStatus as ExecStatus)">
            {{ execStatusLabel(detailLog.execStatus as ExecStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailLog.duration != null ? `${detailLog.duration}ms` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detailLog.startTime ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ detailLog.endTime ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="结果信息" :span="2">{{ detailLog.resultMsg ?? '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="detailLog.jobParams" label="执行参数" :span="2">
          <code style="white-space: pre-wrap; font-size: 12px">{{ detailLog.jobParams }}</code>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailLog.exceptionStack" label="异常堆栈" :span="2">
          <code style="white-space: pre-wrap; font-size: 12px; color: #f56c6c">{{ detailLog.exceptionStack }}</code>
        </el-descriptions-item>
      </el-descriptions>
    </template>
    <template #footer>
      <el-button @click="closeDetail">关闭</el-button>
    </template>
  </el-dialog>
</template>
```

### 9.4 新建 `src/modules/job/views/JobLog.spec.ts`（~130 行）

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock job API 层
vi.mock('@/modules/job/api', () => ({
  pageJobLogs: vi.fn(),
  getJobLog: vi.fn(),
}))

// route.query.jobId → '1'（字符串）
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: { jobId: '1' } }),
}))

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...(actual as object), ElMessage: { error: vi.fn() } }
})

import { pageJobLogs } from '@/modules/job/api'
import { ApiError } from '@/foundation/request'
import type { JobLog } from '@/contracts/job'

// ─── 数据工厂 ───
function makeJobLog(overrides: Partial<JobLog> = {}): JobLog {
  return {
    id: 1, jobId: 1, jobName: '测试任务', jobGroup: 'DEFAULT',
    triggerType: 'AUTO', execStatus: 'SUCCESS',
    startTime: '2026-07-21T10:00:00', endTime: '2026-07-21T10:00:05',
    duration: 5000, resultMsg: '执行成功', exceptionStack: undefined,
    createTime: '2026-07-21T10:00:05',
    ...overrides,
  }
}

// ─── 桩组件（同 JobList）───
// ...

describe('JobLog.vue', () => {
  beforeEach(() => { vi.clearAllMocks() })

  // T1: onMounted 调用 pageJobLogs(jobId=1, pageNum=1, pageSize=10)
  it('calls pageJobLogs with jobId from route query on mount', async () => { ... })
  // T2: 数据进入 list ref
  it('renders log data into list ref', async () => { ... })
  // T3: ApiError → errorMsg
  it('sets errorMsg when pageJobLogs fails with ApiError', async () => { ... })
  // T4: 空列表
  it('isEmpty is true when list is empty', async () => { ... })
  // T5: 无 jobId → errorMsg 提示
  it('shows info alert when no jobId in query', async () => { ... })
  // T6: 详情弹窗
  it('openDetail sets detailLog and detailVisible', async () => { ... })
})
```

> 约 6 个测试用例，覆盖加载/空态/错误/缺 jobId/详情弹窗。

### 9.5 执行命令

```bash
cd Smart-WorkFlow-Web

# 1. 创建目录
mkdir -p src/modules/job/views

# 2. TypeScript 类型检查
pnpm typecheck

# 3. ESLint（含架构边界规则）
pnpm lint

# 4. 全量单元测试
pnpm test

# 5. 生产构建（推荐但非强制）
pnpm build
```

> `pnpm build` 在本 Step 推荐执行以验证视图组件的生产构建兼容性。F3 最终验收时强制执行四连全绿。

## 10. 关键实现约束

1. **`request()` 唯一入口已被 API 层封装** — 视图层不直接 import `request()`，全部用 API 函数
2. **StandardListTemplate 模式不可偏离** — 使用 slot 模式（`#toolbar-actions` / `#filter` / `#filter-actions` / `#empty-action`），不要自造列表布局
3. **双对象筛选模式** — filter（v-model 绑定）和 currentFilter（查询时同步），防止输入即触发请求
4. **错误处理两种路径** — ApiError（显示 `err.msg`）和 fallback（显示固定文案）
5. **Element Plus 按需自动导入** — `ElMessage`、`ElMessageBox`、`ElTable`、`ElButton` 等组件全局注册，不要在 `modules/*` 内显式 import Element Plus 组件或 API。（`ElMessage`/`ElMessageBox` 作为 API 在测试中需要 mock）
6. **不引入 `element-plus` 的显式 import** — ESLint 规则 `modules/*` 禁直引
7. **el-table slot scope row 类型桥接** — `{ row }` 类型为 `unknown`，需要 `row as JobInfo` / `row as JobLog` 转换
8. **操作列使用 `link` 按钮** — 参照 StorageList：`<el-button size="small" link type="primary">编辑</el-button>`
9. **el-dialog 使用 `destroy-on-close`** — 确保每次打开弹窗时表单重置
10. **jobType 切换时条件渲染** — Bean 配置（beanName/beanParams）和 Flow 配置（flowDefKey/formData）互斥显示
11. **防重复操作** — 暂停/恢复/触发操作使用 `operatingId` 状态防止重复点击
12. **JobLog 读取 `route.query.jobId`** — 从 URL 参数获取任务 ID，缺失时显示 info alert

## 11. 边界情况

| # | 场景 | 处理方式 |
|---|------|----------|
| 1 | 列表为空（0 条数据） | isEmpty=true，显示空态插槽（"新建任务"按钮） |
| 2 | API 返回 ApiError | errorMsg 显示 `err.msg`，el-alert type=error |
| 3 | API 返回非 ApiError（网络中断等） | errorMsg 显示通用 fallback 文案 |
| 4 | 删除确认 — 用户取消 | ElMessageBox.confirm reject → catch 后直接 return，不调 API |
| 5 | 创建/编辑 — 必填项为空 | 前端本地校验 `jobName` 和 `cronExpression` 非空，弹窗内显示 `dialogError` |
| 6 | 暂停已暂停的任务 | 后端幂等，前端不判断当前状态（按钮按 row.status 切换） |
| 7 | 恢复已恢复的任务 | 同上 |
| 8 | 编辑弹窗 — 切换 jobType | 不保留之前类型的字段值（BEAN → FLOW 时隐藏 beanName/beanParams，显示 flowDefKey/formData） |
| 9 | 操作按钮并发点击 | `operatingId` 状态 + `:disabled="operatingId !== null"` 拦截 |
| 10 | JobLog 缺 jobId 参数 | noJobId=true，显示 info alert "请从任务列表页跳转访问执行日志" |
| 11 | JobLog 空结果（正确 jobId 但无日志） | isEmpty=true |
| 12 | 删除/触发连续快速点击 | 无额外防抖（按钮级别），通过 ElMessageBox.confirm 天然串行 |
| 13 | `form.jobType` 切换时并发字段未清理 | 不需要清理 — 后端只使用对应 jobType 的字段，多余字段序列化时传 null/undefined |
| 14 | 分页切换后筛选条件丢失 | 不丢失 — currentFilter 在 loadList 中维持，仅通过 `pageNum`/`pageSize` 参数控制 |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解 |
|------|:--:|------|------|
| StandardListTemplate 内部子组件（ListToolbar/ListFilterBar/ListTable）API 不兼容 | 低 | 页面渲染失败 | 参照 StorageList 和 NotifyHome 的实际用法，这两个页面已在生产中验证。typecheck + build 会暴露模板错误 |
| Element Plus 组件版本 API 差异 | 低 | 编译/运行时错误 | 使用项目中已验证的组件用法（el-table-column 的 prop/label/width、el-tag 的 type/size、el-dialog 的 v-model/destroy-on-close） |
| `el-descriptions` 组件（JobLog 详情弹窗）使用方式与版本不匹配 | 低 | 详情弹窗渲染异常 | el-descriptions 是 Element Plus 标准组件，vue-tsc 会检查其 props。如有问题降级为手动 div 布局 |
| 测试桩组件不足以渲染视图 | 中 | 测试 mount 失败或渲染异常 | 桩组件已在 storage/notify 测试中验证，新增 el-form/el-select/el-option/el-row/el-col 桩已在 system 模块测试中出现过 |

**回滚方案**：删除 4 个新建文件即可完全回滚（`rm src/modules/job/views/JobList.vue src/modules/job/views/JobList.spec.ts src/modules/job/views/JobLog.vue src/modules/job/views/JobLog.spec.ts`）。0 个已有文件被修改。

**回滚验证**：`pnpm typecheck && pnpm lint && pnpm test` 应与 F2 执行前基线一致（53 spec files / ~470 tests → 51 files / 451 tests）。

## 13. 测试方案

### 13.1 静态检查

| # | 检查项 | 预期结果 | 命令 |
|---|--------|----------|------|
| S1 | TypeScript 类型检查通过 | 退出码 0，无类型错误 | `pnpm typecheck` |
| S2 | ESLint 通过（含架构边界规则） | 退出码 0，零告警 | `pnpm lint` |
| S3 | 视图文件不直引 axios/request | 零命中 | `grep -c "from '@/foundation/request'" src/modules/job/views/*.vue` → 0（API 层已封装） |
| S4 | 视图文件不 import element-plus 组件 | 零命中 | `grep -c "from 'element-plus'" src/modules/job/views/*.vue` → 0（全局注册） |
| S5 | `src/modules/job/views/` 目录存在 4 个文件 | ls 输出 4 个文件 | `ls src/modules/job/views/` |

### 13.2 单元测试

**JobList.spec.ts（~14 个测试用例）**：

| # | 测试项 | 验证内容 |
|---|--------|----------|
| T1 | onMounted 调用 pageJobInfos | 调用参数 pageNum=1, pageSize=10, query={} |
| T2 | 数据进入 list ref | list[0].jobName / total |
| T3 | ApiError → errorMsg | errorMsg = err.msg |
| T4 | 非 ApiError fallback | errorMsg = '加载任务列表失败' |
| T5 | 空列表 → isEmpty=true | isEmpty computed |
| T6 | openCreate 弹窗状态 | dialogVisible=true, dialogTitle='新建任务', editingId=null |
| T7 | openEdit 填充表单 | form 字段 = row 对应字段 |
| T8 | 创建成功 | ElMessage.success + dialogVisible=false + loadList 再次调用 |
| T9 | 更新成功 | ElMessage.success + updateJobInfo 被调用 |
| T10 | 删除确认成功 | ElMessageBox.confirm → deleteJobInfo → ElMessage.success → loadList |
| T11 | 删除取消 | deleteJobInfo 不被调用 |
| T12 | 暂停成功 | pauseJob 被调用 + ElMessage.success + loadList |
| T13 | 恢复成功 | resumeJob 被调用 + ElMessage.success + loadList |
| T14 | 触发确认成功 | ElMessageBox.confirm → triggerJob → ElMessage.success |

**JobLog.spec.ts（~6 个测试用例）**：

| # | 测试项 | 验证内容 |
|---|--------|----------|
| T15 | onMounted 调用 pageJobLogs | 参数 jobId=1 (from route.query), pageNum=1, pageSize=10 |
| T16 | 数据进入 list ref | list[0].jobName / list[0].execStatus |
| T17 | ApiError → errorMsg | errorMsg = err.msg |
| T18 | 空列表 → isEmpty=true | isEmpty computed |
| T19 | 缺 jobId → errorMsg | noJobId=true → el-alert type=info |
| T20 | openDetail 弹窗 | detailLog 非 null, detailVisible=true |

> 预期：20 个测试全部通过。`pnpm test` 退出码 0。

### 13.3 集成测试

本 Step 不涉及集成测试（纯前端页面组件 + 单元测试，不涉及跨系统数据流）。后台 API 的端到端联通在 F3（Mock + 路由）完成后通过 `pnpm dev:mock` 肉眼验收。

### 13.4 手工验证

| # | 验证项 | 验证方式 |
|---|--------|----------|
| M1 | JobList 页面渲染不报错（含筛选区/表格/空态） | `pnpm dev` 启动后访问（F3 路由注册后） |
| M2 | 创建/编辑弹窗表单字段正确、条件渲染正确 | 打开弹窗检查各字段、切换 jobType |
| M3 | JobLog 页面按 jobId 加载日志 | 从 JobList 跳转后验证日志列表 |

> 本 Step 无法独立完成肉眼验收（无路由/Mock），纯手工验证延后至 F3。F2 验收以四连（typecheck+lint+test+build）为准。

### 13.5 回归检查

| # | 检查项 | 预期结果 | 命令 |
|---|--------|----------|------|
| R1 | 已有测试不减少 | 51→53 spec files / 451→~471 tests | `pnpm test` |
| R2 | typecheck 零新增错误 | typecheck 退出码 0 | `pnpm typecheck` |
| R3 | ESLint 零新增告警 | lint 退出码 0 | `pnpm lint` |
| R4 | 不修改任何已有文件 | git diff 仅 4 个新建文件 | `git diff --name-only` |

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| C1 | `src/modules/job/views/JobList.vue` 存在，使用 StandardListTemplate 模板 | 文件审查 |
| C2 | `src/modules/job/views/JobList.spec.ts` 存在，含 ≥ 14 个 `it()` 测试用例 | 文件审查 |
| C3 | `src/modules/job/views/JobLog.vue` 存在，使用 StandardListTemplate 模板 | 文件审查 |
| C4 | `src/modules/job/views/JobLog.spec.ts` 存在，含 ≥ 6 个 `it()` 测试用例 | 文件审查 |
| C5 | JobList 包含筛选区（jobName 输入框 + status 下拉 + jobType 下拉 + 查询/重置按钮） | 文件审查 |
| C6 | JobList 表格列含 jobName / jobGroup / jobType / cronExpression / status / lastFireTime / nextFireTime / createTime / 操作列 | 文件审查 |
| C7 | JobList 操作列含编辑/暂停-恢复切换/触发/删除按钮（link 样式） | 文件审查 |
| C8 | JobList 含创建/编辑弹窗（el-dialog），表单字段完整含 jobType 条件渲染（BEAN ↔ FLOW） | 文件审查 |
| C9 | JobLog 从 `route.query.jobId` 获取任务 ID，缺参数时显示 info alert | 文件审查 |
| C10 | JobLog 表格列含 jobName / triggerType / execStatus / startTime / endTime / duration / resultMsg / createTime / 详情按钮 | 文件审查 |
| C11 | JobLog 含详情弹窗（el-descriptions），展示全部字段含 exceptionStack | 文件审查 |
| C12 | 视图文件不直引 `element-plus`（按需自动导入，ESLint 强制） | grep 确认 |
| C13 | 视图文件不直引 `@/foundation/request`（全部经 API 层） | grep 确认 |
| C14 | `pnpm typecheck && pnpm lint && pnpm test` 全部退出码 0 | 命令执行 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step F2

## 1. Step 编号和名称
F2 — Vue 视图（JobList + JobLog）

## 2. 使用模型
（实际使用了哪个模型）

## 3. 实际读取的文件
（逐文件列出，未读取的标注原因）

## 4. 实际修改的文件
（逐文件列出，新建和修改区分标注）

## 5. 每个文件的修改摘要
（每个文件的改动点、改动行数、改动原因）

## 6. 实际执行的命令
（逐条列出命令及参数）

## 7. 命令输出摘要
（typecheck/lint/test 结果、退出码、测试文件数/用例数）

## 8. 与原方案的偏差
（哪些地方和方案不同，为什么）

## 9. 遇到的问题
（技术问题、环境问题、理解偏差等，以及如何解决的）

## 10. 未完成内容
（方案中要求但实际未完成的内容，及原因）

## 11. 风险和注意事项
（执行过程中发现的潜在问题）

## 12. Git diff 摘要
（改动文件数、新增行数、删除行数、关键变更点）

## 13. 建议执行的测试
（执行者认为需要重点验证的测试场景）
```

## 16. 测试回执格式

本 Step 不区分独立的「测试回执」。执行回执中 §7（命令输出摘要）和 §12（Git diff 摘要）已包含测试结果和证据。执行代理只需交一份回执，测试结果为其中一部分。

如验收时发现测试证据不足，将要求补充。

## 17. 明确禁止事项

- ❌ **不要添加路由或菜单** — 路由在 F3 中统一处理，视图组件是纯 UI（不注册路由）
- ❌ **不要创建 Store（Pinia）** — 状态在组件内部用 ref/reactive 管理
- ❌ **不要修改 `src/components/page-layout/`** — 页型模板保持现状
- ❌ **不要修改 `src/contracts/job.ts`** — 合约类型已封版
- ❌ **不要修改 `src/modules/job/api/`** — API 层已封版
- ❌ **不要直引 axios 或 `@/foundation/request`** — 视图层只调 API 函数
- ❌ **不要 import Element Plus 组件或 API** — 按需自动导入已全局注册。（测试中 mock 例外）
- ❌ **不要在模板中硬编码颜色值** — 使用 Element Plus 内置 type 或 CSS 变量
- ❌ **不要使用 `<style scoped>` 写复杂样式** — 优先使用 Element Plus 组件默认样式
- ❌ **不要触碰后端代码**（`Smart-WorkFlow/`）
- ❌ **不要修改项目配置文件**（`package.json`、`vite.config.ts`、`tsconfig.json`、`eslint.config.js`）
- ❌ **不要添加 mock handlers** — F3 统一处理
- ❌ **不要在 JobLog 中添加 CRUD 操作** — 日志为只读视图
