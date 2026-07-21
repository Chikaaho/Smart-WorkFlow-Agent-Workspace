# Step F3：Mock + Handlers + 路由

## 1. 当前状态

- 功能：job-scheduler（定时任务调度模块）
- 进度：B1 ✅ → B2 ✅ → B3 ✅ → B4 ✅ → F1 ✅ → F2 ✅ → **F3 READY**
- 前端当前基线：54 spec files / 471 tests（CONFIRMED 2026-07-21 F2 验收）
- F2 产出：5 新建文件（JobList.vue / JobList.spec.ts / JobLog.vue / JobLog.spec.ts / JobLog.no-id.spec.ts），视图组件已就位，但**无路由和菜单无法肉眼验收**

## 2. Step 目标

为 job-scheduler 模块补齐 Mock 种子数据、10 个 API 端点 mock handler、菜单注册，使 `pnpm dev:mock` 零后端依赖可肉眼验收 JobList（CRUD/暂停/恢复/触发）和 JobLog（日志查看/详情弹窗）。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：3 个已有文件的追加修改 + 明确的 CRUD mock handler 模式，无架构决策，纯机械实现。
是否触发升级条件：否

## 4. 模型选择理由

本 Step 的三种操作（seeds 追加常量、handlers 追加 handler、菜单树追加节点）均为项目中最重复的模式化工作。user CRUD handlers 和 storage handlers 提供了精确的参照模板，无需跨文件推理或架构权衡。

## 5. 已知上下文

### 5.1 Mock 系统架构（`src/foundation/mock/`）

- **seeds.ts**：共享假数据常量（`MOCK_USERS_LIST`、`MOCK_STORAGE_FILES` 等），供 handlers 引用
- **handlers.ts**：导出 `mockRegistrations: MockRegistration[]`，由 `index.ts` 在初始化时集中注册到 `Map<RegistryKey, MockHandler>`
- **index.ts**：注册表 + 调度器。`dispatchMock(method, url, baseURL, params, body)` 被 `foundation/request` 在双重门（`import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'`）后调用
- **index.spec.ts**：15 个测试，验证注册表机制（TDZ 安全、已知端点可命中、未注册端点 fallthrough）

### 5.2 MockRegistration 类型

```typescript
interface MockRegistration {
  method: MockMethod    // 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  pattern: `/${string}` // 路径模式，:param 占位符
  handler: MockHandler  // (params, query, body) => ApiResponse<T>
}
```

### 5.3 seeds.ts 模式

- 使用 `export const MOCK_XXX: Array<{...}>` 导出**可变数组**（handler 中通过 `.push()`/`.splice()`/索引赋值原地 mutate）
- 日期字段使用 ISO-8601 字符串（如 `'2026-07-21T10:00:00'`）
- 每条记录包含完整字段（对齐后端 Entity 结构，但不含 `deleted`/`tenantId`/`version`）

### 5.4 handler CRUD 模式

参照 `handlers.ts` L728-814（用户管理 CRUD）和 L1056-1148（文件存储 CRUD）：

- **POST page**：从 body 提取筛选条件，filter 后用 `slice(start, start + pageSize)` 手动分页，返回 `{ records, total, pageNum, pageSize }`
- **GET :id**：`find()` 查找，不存在返回 `code: 404`
- **POST create**：从 body 构造新记录，分配 `Date.now()` 作为 id，`push()` 到数组，返回新 id
- **PUT update**：`findIndex()` 找到索引，合并字段（保留不可变字段如 `createTime`），赋回数组
- **DELETE :id**：`findIndex()` + `splice()`，**幂等**（不存在的 id 也返回 code: 0）
- **POST action**（如 pause/resume/trigger）：mock 直接返回成功（不实际执行调度逻辑）

### 5.5 菜单种子模式

`MOCK_MENU_TREE` 中的菜单节点结构：

```typescript
{
  id: string, parentId: string | null, name: string, title: string,
  path: string, component: string | null,  // component 相对 src/modules/
  icon: string, sort: number, menuType: number,
  permission: string, hidden: boolean,
  children?: MenuNode[]
}
```

- `menuType: 0` = 目录（无 component，有 children）
- `menuType: 1` = 菜单页（有 component）
- `component` 路径相对于 `src/modules/`，如 `'notify/views/NotifyHome'` → `@/modules/notify/views/NotifyHome.vue`

### 5.6 后端 API 端点

来自 F1 `src/modules/job/api/index.ts`，后端 baseURL 为 `/api`，完整路径为 `baseURL + url`：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/job/info/page` | 分页查询任务（含 filter body） |
| GET | `/job/info/:id` | 查询单个任务 |
| POST | `/job/info` | 创建任务，返回新 id |
| PUT | `/job/info` | 更新任务 |
| DELETE | `/job/info/:id` | 删除任务（幂等） |
| POST | `/job/info/:id/pause` | 暂停任务 |
| POST | `/job/info/:id/resume` | 恢复任务 |
| POST | `/job/info/:id/trigger` | 手动触发 |
| POST | `/job/log/page` | 分页查询日志（query: jobId, pageNum, pageSize） |
| GET | `/job/log/:id` | 查询单条日志 |

### 5.7 前端合约类型

来自 F1 `src/contracts/job.ts`：

- `JobInfo`：19 字段（id?, jobName, jobGroup?, jobType?, cronExpression, status?, concurrent?, misfirePolicy?, description?, beanName?, beanParams?, flowDefKey?, formData?, lastFireTime?, nextFireTime?, createTime?, updateTime?, createBy?, updateBy?）
- `JobLog`：13 字段（id?, jobId, jobName?, jobGroup?, triggerType, jobParams?, execStatus, startTime?, endTime?, duration?, resultMsg?, exceptionStack?, createTime?）
- `JobStatus`：`'NORMAL' | 'PAUSED'`
- `JobType`：`'BEAN' | 'FLOW'`
- `ExecStatus`：`'RUNNING' | 'SUCCESS' | 'FAILED'`
- `TriggerType`：`'AUTO' | 'MANUAL'`

## 6. 执行前必须读取的文件

| 优先级 | 文件 | 用途 |
|:--:|------|------|
| 1 | `src/foundation/mock/seeds.ts` | 了解现有种子数据结构和 ID 分配规则（避免 ID 冲突） |
| 2 | `src/foundation/mock/handlers.ts` | 了解 CRUD handler 模式和注册格式 |
| 3 | `src/contracts/job.ts` | 确认 JobInfo/JobLog 字段名和类型 |
| 4 | `src/modules/job/api/index.ts` | 确认 API 函数签名（参数顺序、路径、method） |
| 5 | `src/foundation/mock/index.spec.ts` | 了解现有 mock 测试，确认新增 handler 不破坏现有测试 |
| 6 | `src/modules/job/views/JobList.vue` | 确认视图层的 API 调用方式（filter 字段名、loadList 触发时机） |
| 7 | `src/modules/job/views/JobLog.vue` | 确认日志页的 API 调用方式 |

## 7. 允许修改的文件范围

| 文件 | 操作 | 说明 |
|------|:--:|------|
| `src/foundation/mock/seeds.ts` | 修改 | 追加 `MOCK_JOB_INFOS` + `MOCK_JOB_LOGS` + 菜单树追加 job 节点 + session permissions 追加 |
| `src/foundation/mock/handlers.ts` | 修改 | 追加 10 个 mock handler 到 `mockRegistrations` 数组 |

## 8. 禁止修改的范围

- ❌ `src/foundation/mock/index.ts` — 注册机制不修改
- ❌ `src/foundation/mock/index.spec.ts` — 除非因新增 handler 导致测试断言需更新（如 handler 计数），否则不修改
- ❌ `src/contracts/job.ts` — F1 已封版
- ❌ `src/modules/job/api/` — F1 已封版
- ❌ `src/modules/job/views/` — F2 已封版
- ❌ `src/router/index.ts` — 路由通过菜单动态构建，不手动添加静态路由
- ❌ `src/router/guard.ts` — 路由守卫不修改
- ❌ 任何其他已有文件（除 seeds.ts 和 handlers.ts 外）
- ❌ 后端代码（`Smart-WorkFlow/`）
- ❌ 项目配置文件（`package.json`、`vite.config.ts` 等）

## 9. 详细执行方案

### 9.1 修改 `src/foundation/mock/seeds.ts`

#### 9.1.1 追加 MOCK_JOB_INFOS 种子数据

在 `MOCK_STORAGE_FILES` 定义之前（或文件末尾 `]` 之前），新增约 5 条任务种子：

```typescript
export const MOCK_JOB_INFOS: Array<{
  id: number
  jobName: string
  jobGroup: string
  jobType: 'BEAN' | 'FLOW'
  cronExpression: string
  status: 'NORMAL' | 'PAUSED'
  concurrent: boolean
  misfirePolicy: number
  description: string
  beanName: string | null
  beanParams: string | null
  flowDefKey: string | null
  formData: string | null
  lastFireTime: string | null
  nextFireTime: string | null
  createTime: string
  updateTime: string
  createBy: number
  updateBy: number
}> = [
  {
    id: 1,
    jobName: '每日数据备份',
    jobGroup: 'DEFAULT',
    jobType: 'BEAN',
    cronExpression: '0 0 2 * * ?',
    status: 'NORMAL',
    concurrent: false,
    misfirePolicy: 1,
    description: '每日凌晨2点执行数据库备份',
    beanName: 'dataBackupHandler',
    beanParams: '{"backupType": "full", "compress": true}',
    flowDefKey: null,
    formData: null,
    lastFireTime: '2026-07-21T02:00:00',
    nextFireTime: '2026-07-22T02:00:00',
    createTime: '2026-07-15T00:00:00',
    updateTime: '2026-07-15T00:00:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 2,
    jobName: '周报自动生成',
    jobGroup: 'DEFAULT',
    jobType: 'FLOW',
    cronExpression: '0 0 9 ? * MON',
    status: 'NORMAL',
    concurrent: false,
    misfirePolicy: 0,
    description: '每周一9点发起周报提交流程',
    beanName: null,
    beanParams: null,
    flowDefKey: 'weekly-report-process',
    formData: '{"templateType": "weekly", "notifyUsers": [1, 2]}',
    lastFireTime: '2026-07-20T09:00:00',
    nextFireTime: '2026-07-27T09:00:00',
    createTime: '2026-07-10T00:00:00',
    updateTime: '2026-07-10T00:00:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 3,
    jobName: '临时数据清理',
    jobGroup: 'DEFAULT',
    jobType: 'BEAN',
    cronExpression: '0 30 1 * * ?',
    status: 'PAUSED',
    concurrent: false,
    misfirePolicy: 2,
    description: '清理超过30天的临时文件',
    beanName: 'tempFileCleanupHandler',
    beanParams: '{"maxAgeDays": 30, "dryRun": false}',
    flowDefKey: null,
    formData: null,
    lastFireTime: '2026-07-19T01:30:00',
    nextFireTime: null,
    createTime: '2026-07-08T00:00:00',
    updateTime: '2026-07-18T00:00:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 4,
    jobName: '系统健康检查',
    jobGroup: 'SYSTEM',
    jobType: 'BEAN',
    cronExpression: '0/30 * * * * ?',
    status: 'NORMAL',
    concurrent: true,
    misfirePolicy: 1,
    description: '每30秒检查系统各组件健康状态并发送告警',
    beanName: 'healthCheckHandler',
    beanParams: '{"checks": ["db", "redis", "disk"], "alertThreshold": 3}',
    flowDefKey: null,
    formData: null,
    lastFireTime: '2026-07-21T10:00:30',
    nextFireTime: '2026-07-21T10:01:00',
    createTime: '2026-06-01T00:00:00',
    updateTime: '2026-06-01T00:00:00',
    createBy: 1,
    updateBy: 1,
  },
  {
    id: 5,
    jobName: '请假到期自动审批',
    jobGroup: 'DEFAULT',
    jobType: 'FLOW',
    cronExpression: '0 0 10 * * ?',
    status: 'NORMAL',
    concurrent: false,
    misfirePolicy: 1,
    description: '每日10点检查逾期未审批的请假申请并自动通过',
    beanName: null,
    beanParams: null,
    flowDefKey: 'leave-auto-approve',
    formData: '{"maxOverdueDays": 3, "autoApproveType": "LEAVE"}',
    lastFireTime: '2026-07-21T10:00:00',
    nextFireTime: '2026-07-22T10:00:00',
    createTime: '2026-07-05T00:00:00',
    updateTime: '2026-07-05T00:00:00',
    createBy: 1,
    updateBy: 1,
  },
]
```

#### 9.1.2 追加 MOCK_JOB_LOGS 种子数据

新增约 8 条执行日志种子，覆盖多种状态和触发方式：

```typescript
export const MOCK_JOB_LOGS: Array<{
  id: number
  jobId: number
  jobName: string
  jobGroup: string
  triggerType: 'AUTO' | 'MANUAL'
  jobParams: string | null
  execStatus: 'RUNNING' | 'SUCCESS' | 'FAILED'
  startTime: string
  endTime: string | null
  duration: number | null
  resultMsg: string | null
  exceptionStack: string | null
  createTime: string
}> = [
  {
    id: 1,
    jobId: 1,
    jobName: '每日数据备份',
    jobGroup: 'DEFAULT',
    triggerType: 'AUTO',
    jobParams: '{"backupType": "full", "compress": true}',
    execStatus: 'SUCCESS',
    startTime: '2026-07-21T02:00:00',
    endTime: '2026-07-21T02:05:32',
    duration: 332000,
    resultMsg: '备份完成，文件大小 2.3GB，已上传至 OSS',
    exceptionStack: null,
    createTime: '2026-07-21T02:05:32',
  },
  {
    id: 2,
    jobId: 1,
    jobName: '每日数据备份',
    jobGroup: 'DEFAULT',
    triggerType: 'AUTO',
    jobParams: '{"backupType": "full", "compress": true}',
    execStatus: 'SUCCESS',
    startTime: '2026-07-20T02:00:00',
    endTime: '2026-07-20T02:04:58',
    duration: 298000,
    resultMsg: '备份完成，文件大小 2.1GB，已上传至 OSS',
    exceptionStack: null,
    createTime: '2026-07-20T02:04:58',
  },
  {
    id: 3,
    jobId: 4,
    jobName: '系统健康检查',
    jobGroup: 'SYSTEM',
    triggerType: 'AUTO',
    jobParams: '{"checks": ["db", "redis", "disk"], "alertThreshold": 3}',
    execStatus: 'SUCCESS',
    startTime: '2026-07-21T10:00:30',
    endTime: '2026-07-21T10:00:31',
    duration: 1200,
    resultMsg: '所有组件正常',
    exceptionStack: null,
    createTime: '2026-07-21T10:00:31',
  },
  {
    id: 4,
    jobId: 4,
    jobName: '系统健康检查',
    jobGroup: 'SYSTEM',
    triggerType: 'AUTO',
    jobParams: '{"checks": ["db", "redis", "disk"], "alertThreshold": 3}',
    execStatus: 'FAILED',
    startTime: '2026-07-21T10:00:00',
    endTime: '2026-07-21T10:00:05',
    duration: 5012,
    resultMsg: '磁盘使用率超过阈值：92%',
    exceptionStack: 'java.lang.RuntimeException: Disk usage 92% exceeds threshold 90%\n\tat com.example.health.DiskCheck.run(DiskCheck.java:42)\n\tat com.example.health.HealthCheckHandler.execute(HealthCheckHandler.java:28)',
    createTime: '2026-07-21T10:00:05',
  },
  {
    id: 5,
    jobId: 2,
    jobName: '周报自动生成',
    jobGroup: 'DEFAULT',
    triggerType: 'AUTO',
    jobParams: '{"templateType": "weekly", "notifyUsers": [1, 2]}',
    execStatus: 'SUCCESS',
    startTime: '2026-07-20T09:00:00',
    endTime: '2026-07-20T09:00:15',
    duration: 15000,
    resultMsg: '已发起周报流程，分配审批人：张三',
    exceptionStack: null,
    createTime: '2026-07-20T09:00:15',
  },
  {
    id: 6,
    jobId: 1,
    jobName: '每日数据备份',
    jobGroup: 'DEFAULT',
    triggerType: 'MANUAL',
    jobParams: '{"backupType": "incremental", "compress": false}',
    execStatus: 'SUCCESS',
    startTime: '2026-07-21T09:15:00',
    endTime: '2026-07-21T09:17:45',
    duration: 165000,
    resultMsg: '增量备份完成，文件大小 340MB',
    exceptionStack: null,
    createTime: '2026-07-21T09:17:45',
  },
  {
    id: 7,
    jobId: 5,
    jobName: '请假到期自动审批',
    jobGroup: 'DEFAULT',
    triggerType: 'AUTO',
    jobParams: '{"maxOverdueDays": 3, "autoApproveType": "LEAVE"}',
    execStatus: 'SUCCESS',
    startTime: '2026-07-21T10:00:00',
    endTime: '2026-07-21T10:00:03',
    duration: 3200,
    resultMsg: '自动审批完成：3条请假申请已通过',
    exceptionStack: null,
    createTime: '2026-07-21T10:00:03',
  },
  {
    id: 8,
    jobId: 3,
    jobName: '临时数据清理',
    jobGroup: 'DEFAULT',
    triggerType: 'MANUAL',
    jobParams: '{"maxAgeDays": 15, "dryRun": true}',
    execStatus: 'RUNNING',
    startTime: '2026-07-21T10:05:00',
    endTime: null,
    duration: null,
    resultMsg: null,
    exceptionStack: null,
    createTime: '2026-07-21T10:05:00',
  },
]
```

#### 9.1.3 更新 MOCK_MENU_TREE — 追加定时任务菜单

在 `MOCK_MENU_TREE` 数组末尾（`id: '9'` 的 storage 节点之后）新增 `id: '10'` 的定时任务菜单节点（含子节点）：

```typescript
{
  id: '10',
  parentId: null,
  name: 'job',
  title: '定时任务',
  path: 'job',
  component: null,
  icon: 'Clock',
  sort: 10,
  menuType: 0,
  permission: 'job:view',
  hidden: false,
  children: [
    {
      id: '100',
      parentId: '10',
      name: 'job-list',
      title: '任务管理',
      path: 'job/list',
      component: 'job/views/JobList',
      icon: 'List',
      sort: 1,
      menuType: 1,
      permission: 'job:list',
      hidden: false,
    },
    {
      id: '101',
      parentId: '10',
      name: 'job-log',
      title: '执行日志',
      path: 'job/log',
      component: 'job/views/JobLog',
      icon: 'Document',
      sort: 2,
      menuType: 1,
      permission: 'job:log',
      hidden: false,
    },
  ],
},
```

#### 9.1.4 更新 MOCK_SESSION_DATA — 追加权限

在 `MOCK_SESSION_DATA.permissions` 数组中追加：

```typescript
'job:view',
'job:list',
'job:log',
```

### 9.2 修改 `src/foundation/mock/handlers.ts`

#### 9.2.1 追加 import

在文件顶部 import 区域追加：

```typescript
// 在现有 MOCK_STORAGE_FILES 的 import 行之后新增：
import {
  MOCK_JOB_INFOS,
  MOCK_JOB_LOGS,
} from './seeds'
```

#### 9.2.2 追加 10 个 mock handler

在 `mockRegistrations` 数组末尾（`];` 之前）追加以下 handler：

```typescript
  // ═══════════════════════════════════════════════════
  // ── 定时任务：任务管理 CRUD ─────────────────────────────
  // ═══════════════════════════════════════════════════

  // POST /api/job/info/page — 分页查询（支持 jobName/status/jobType 筛选）
  {
    method: 'POST',
    pattern: '/api/job/info/page',
    handler: (_params, query, body) => {
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      let list = [...MOCK_JOB_INFOS]
      if (body && typeof body === 'object') {
        const f = body as Record<string, unknown>
        if (f.jobName) list = list.filter((j) => j.jobName.includes(String(f.jobName)))
        if (f.status) list = list.filter((j) => j.status === String(f.status))
        if (f.jobType) list = list.filter((j) => j.jobType === String(f.jobType))
      }
      const total = list.length
      const start = (pageNum - 1) * pageSize
      const records = list.slice(start, start + pageSize)
      return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
    },
  },

  // GET /api/job/info/:id — 查询单个任务
  {
    method: 'GET',
    pattern: '/api/job/info/:id',
    handler: (params) => {
      const id = Number((params as Record<string, string>).id)
      const job = MOCK_JOB_INFOS.find((j) => j.id === id)
      if (!job) return { code: 404, message: '任务不存在', data: null }
      return { code: 0, message: 'ok', data: { ...job } }
    },
  },

  // POST /api/job/info — 创建任务
  {
    method: 'POST',
    pattern: '/api/job/info',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const id = MOCK_JOB_INFOS.length > 0 ? Math.max(...MOCK_JOB_INFOS.map((j) => j.id)) + 1 : 1
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const newJob = {
        id,
        jobName: String(data.jobName ?? ''),
        jobGroup: String(data.jobGroup ?? 'DEFAULT'),
        jobType: (data.jobType as 'BEAN' | 'FLOW') ?? 'BEAN',
        cronExpression: String(data.cronExpression ?? ''),
        status: (data.status as 'NORMAL' | 'PAUSED') ?? 'NORMAL',
        concurrent: Boolean(data.concurrent ?? false),
        misfirePolicy: Number(data.misfirePolicy ?? 0),
        description: String(data.description ?? ''),
        beanName: data.beanName ? String(data.beanName) : null,
        beanParams: data.beanParams ? String(data.beanParams) : null,
        flowDefKey: data.flowDefKey ? String(data.flowDefKey) : null,
        formData: data.formData ? String(data.formData) : null,
        lastFireTime: null,
        nextFireTime: null,
        createTime: now,
        updateTime: now,
        createBy: 1,
        updateBy: 1,
      }
      MOCK_JOB_INFOS.push(newJob as typeof MOCK_JOB_INFOS[number])
      return { code: 0, message: 'ok', data: id }
    },
  },

  // PUT /api/job/info — 更新任务
  {
    method: 'PUT',
    pattern: '/api/job/info',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const idx = MOCK_JOB_INFOS.findIndex((j) => j.id === Number(data.id))
      if (idx === -1) return { code: 404, message: '任务不存在', data: null }
      const existing = MOCK_JOB_INFOS[idx]
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      MOCK_JOB_INFOS[idx] = {
        ...existing,
        jobName: data.jobName !== undefined ? String(data.jobName) : existing.jobName,
        jobGroup: data.jobGroup !== undefined ? String(data.jobGroup) : existing.jobGroup,
        jobType: data.jobType !== undefined ? (data.jobType as 'BEAN' | 'FLOW') : existing.jobType,
        cronExpression: data.cronExpression !== undefined ? String(data.cronExpression) : existing.cronExpression,
        status: data.status !== undefined ? (data.status as 'NORMAL' | 'PAUSED') : existing.status,
        concurrent: data.concurrent !== undefined ? Boolean(data.concurrent) : existing.concurrent,
        misfirePolicy: data.misfirePolicy !== undefined ? Number(data.misfirePolicy) : existing.misfirePolicy,
        description: data.description !== undefined ? String(data.description) : existing.description,
        beanName: data.beanName !== undefined ? (data.beanName ? String(data.beanName) : null) : existing.beanName,
        beanParams: data.beanParams !== undefined ? (data.beanParams ? String(data.beanParams) : null) : existing.beanParams,
        flowDefKey: data.flowDefKey !== undefined ? (data.flowDefKey ? String(data.flowDefKey) : null) : existing.flowDefKey,
        formData: data.formData !== undefined ? (data.formData ? String(data.formData) : null) : existing.formData,
        updateTime: now,
        updateBy: 1,
      }
      return { code: 0, message: 'ok', data: null }
    },
  },

  // DELETE /api/job/info/:id — 删除任务（幂等）
  {
    method: 'DELETE',
    pattern: '/api/job/info/:id',
    handler: (params) => {
      const id = Number((params as Record<string, string>).id)
      const idx = MOCK_JOB_INFOS.findIndex((j) => j.id === id)
      if (idx === -1) return { code: 0, message: 'ok', data: null }
      MOCK_JOB_INFOS.splice(idx, 1)
      return { code: 0, message: 'ok', data: null }
    },
  },

  // POST /api/job/info/:id/pause — 暂停任务
  {
    method: 'POST',
    pattern: '/api/job/info/:id/pause',
    handler: (params) => {
      const id = Number((params as Record<string, string>).id)
      const job = MOCK_JOB_INFOS.find((j) => j.id === id)
      if (!job) return { code: 404, message: '任务不存在', data: null }
      job.status = 'PAUSED'
      return { code: 0, message: 'ok', data: null }
    },
  },

  // POST /api/job/info/:id/resume — 恢复任务
  {
    method: 'POST',
    pattern: '/api/job/info/:id/resume',
    handler: (params) => {
      const id = Number((params as Record<string, string>).id)
      const job = MOCK_JOB_INFOS.find((j) => j.id === id)
      if (!job) return { code: 404, message: '任务不存在', data: null }
      job.status = 'NORMAL'
      return { code: 0, message: 'ok', data: null }
    },
  },

  // POST /api/job/info/:id/trigger — 手动触发
  {
    method: 'POST',
    pattern: '/api/job/info/:id/trigger',
    handler: (params) => {
      const id = Number((params as Record<string, string>).id)
      const job = MOCK_JOB_INFOS.find((j) => j.id === id)
      if (!job) return { code: 404, message: '任务不存在', data: null }
      // Mock 触发：追加一条 MANUAL 执行日志
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const logId = MOCK_JOB_LOGS.length > 0 ? Math.max(...MOCK_JOB_LOGS.map((l) => l.id)) + 1 : 1
      MOCK_JOB_LOGS.push({
        id: logId,
        jobId: job.id,
        jobName: job.jobName,
        jobGroup: job.jobGroup,
        triggerType: 'MANUAL',
        jobParams: job.beanParams ?? job.formData ?? null,
        execStatus: 'RUNNING',
        startTime: now,
        endTime: null,
        duration: null,
        resultMsg: null,
        exceptionStack: null,
        createTime: now,
      })
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ═══════════════════════════════════════════════════
  // ── 定时任务：执行日志查询 ─────────────────────────────
  // ═══════════════════════════════════════════════════

  // POST /api/job/log/page?jobId=&pageNum=&pageSize= — 分页查询日志
  {
    method: 'POST',
    pattern: '/api/job/log/page',
    handler: (_params, query) => {
      const jobId = Number(query.jobId)
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      let list = MOCK_JOB_LOGS.filter((l) => l.jobId === jobId)
      // 支持 execStatus 筛选（通过 query 或 body 传递，此处支持 query）
      if (query.execStatus) {
        list = list.filter((l) => l.execStatus === query.execStatus)
      }
      const total = list.length
      const start = (pageNum - 1) * pageSize
      const records = list.slice(start, start + pageSize)
      return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
    },
  },

  // GET /api/job/log/:id — 查询单条日志
  {
    method: 'GET',
    pattern: '/api/job/log/:id',
    handler: (params) => {
      const id = Number((params as Record<string, string>).id)
      const log = MOCK_JOB_LOGS.find((l) => l.id === id)
      if (!log) return { code: 404, message: '日志不存在', data: null }
      return { code: 0, message: 'ok', data: { ...log } }
    },
  },
]
```

### 9.3 执行命令

```bash
cd Smart-WorkFlow-Web

# 1. TypeScript 类型检查
pnpm typecheck

# 2. ESLint（含架构边界规则）
pnpm lint

# 3. 全量单元测试
pnpm test

# 4. 生产构建
pnpm build

# 5. Mock 模式开发服务器（人工肉眼验收）
pnpm dev:mock
# 浏览器访问侧边栏「定时任务 → 任务管理」和「定时任务 → 执行日志」
# 验证：列表加载 / 筛选查询 / 创建任务 / 编辑任务 / 暂停恢复 / 触发 /
#       删除 / 日志列表（从任务列表点击后跳转）/ 日志详情弹窗
```

> `pnpm build` 必须执行以验证新增的 seeds/handlers 代码在 tree-shake 路径下不出错。`pnpm dev:mock` 用于人工肉眼验收，非阻塞 gate。

## 10. 关键实现约束

1. **seed 数据 array 可变** — 使用 `const` 声明数组/对象引用，handler 中通过 `.push()`/`.splice()`/索引赋值原地 mutate。不要用 `let` 重新赋值整个数组
2. **handler 幂等** — DELETE handler 对不存在的 id 必须返回 `code: 0`（已删除=幂等），GET handler 对不存在的 id 返回 `code: 404`
3. **update handler 合并字段** — 使用 `...existing, field: newValue ?? existing.field` 模式，保留不可变字段（`createTime`、`createBy`、`id`）
4. **create handler id 分配** — 新 id = `Math.max(...array.map(x => x.id)) + 1`，空数组时回退 1
5. **page handler 响应形状** — 返回 `{ records, total, pageNum, pageSize }`（对齐后端 MyBatis-Plus Page 序列化），不是 `{ list, total, ... }`
6. **handler pattern 无 `/api` 前缀** — pattern 字段以 `/api/` 开头（与注册表中的 key 格式一致）
7. **import 顺序** — handlers.ts 中新增的 import 放在现有 MOCK_STORAGE_FILES import 行之后，mockRegistrations 数组中的新增 handler 放在末尾 `];` 之前
8. **不修改注册机制** — `defineMock`/`dispatchMock`/`tryMatch` 逻辑不碰
9. **菜单 component 路径** — `'job/views/JobList'` 和 `'job/views/JobLog'`，相对于 `src/modules/`，不包含 `.vue` 扩展名
10. **session permissions** — 追加 `'job:view'`、`'job:list'`、`'job:log'` 到 `MOCK_SESSION_DATA.permissions`，否则 mock 模式下无权限访问新菜单

## 11. 边界情况

| # | 场景 | 处理方式 |
|---|------|----------|
| 1 | 空任务列表（MOCK_JOB_INFOS 被删光） | page handler 返回 `records: [], total: 0`；create handler id 从 1 开始 |
| 2 | 空日志（某个任务无执行记录） | page handler 返回 `records: [], total: 0` |
| 3 | DELETE 不存在的 id | 幂等返回 `code: 0` |
| 4 | GET 不存在的 id | 返回 `code: 404, data: null` |
| 5 | PAUSE/RESUME/TRIGGER 不存在的 id | 返回 `code: 404, data: null` |
| 6 | page filter body 为空/undefined | 不过滤，返回全量列表 |
| 7 | page filter 字段为空字符串 | 跳过该筛选条件（`if (f.jobName)` — 空字符串为 falsy） |
| 8 | 并发创建任务（同一 mock session 同步操作） | 单线程 JS 无并发问题，每次 `push` + `Math.max` 保证 id 唯一 |
| 9 | 菜单点击后侧边栏高亮 | 由菜单系统自动处理（`loadMenu()` → `buildRoutesFromMenu()` → 路由匹配 → 菜单 store 选中态） |
| 10 | JobLog 缺 `route.query.jobId` | 前端组件已处理（F2）：显示 info alert，不调 pageJobLogs API |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解 |
|------|:--:|------|------|
| seed 数据 id 冲突（与已有 seed 数据 id 范围重叠） | 低 | 菜单 id/权限引用混乱 | MOCK_JOB_INFOS id 从 1-5，MOCK_JOB_LOGS id 从 1-8，菜单 id 使用 '10'/'100'/'101'（不与 id 1-9 冲突）。与现有 seed 无 ID 共享 |
| handler pattern 与后端响应形状不一致 | 低 | mock 模式下视图渲染异常 | 严格按 F1 API 函数中 `adaptPage` 的期望（后端返回 `records`）和 `PageResult` 契约（前端期望 `list`）来设计 handler 响应；adaptPage 在 API 层统一转换 |
| pageJobLogs 的 execStatus 筛选参数传递方式不明 | 中 | 日志筛选不生效 | 查看 F1 API `pageJobLogs` 的实际实现 — 日志分页只有 query 参数（jobId/pageNum/pageSize），没有 body filter。但 F2 JobLog.vue 用 currentFilter 管理 execStatus。如果后端方案与 API 签名不一致，mock handler 从 query 读取 execStatus 兜底 |
| 菜单节点导致循环路由 | 低 | 路由守卫报错 | `component` 路径正确指向已存在的 `.vue` 文件，`buildRoutesFromMenu` 使用 `import.meta.glob` 白名单解析，路径错误会在 typecheck 阶段暴露 |
| pnpm dev:mock 启动后菜单不显示 | 低 | 肉眼验收无法进行 | 检查 MOCK_SESSION_DATA.permissions 是否包含新权限码；检查 MOCK_MENU_TREE 节点 `hidden: false` 且 `menuType` 正确 |

**回滚方案**：还原 2 个文件到修改前状态（`git checkout -- src/foundation/mock/seeds.ts src/foundation/mock/handlers.ts`）。

**回滚验证**：`pnpm typecheck && pnpm lint && pnpm test` 应与 F2 基线一致（54 files / 471 tests）。回滚后菜单树恢复原样，定时任务页面不再可访问。

## 13. 测试方案

### 13.1 静态检查

| # | 检查项 | 预期结果 | 命令 |
|---|--------|----------|------|
| S1 | TypeScript 类型检查通过 | 退出码 0 | `pnpm typecheck` |
| S2 | ESLint 通过 | 退出码 0，0 errors | `pnpm lint` |
| S3 | seeds.ts 导出新常量 | grep 命中 | `grep "MOCK_JOB_INFOS\|MOCK_JOB_LOGS" src/foundation/mock/seeds.ts` |
| S4 | handlers.ts 注册新 handler | grep pattern 命中 10 个 | `grep "'/api/job/" src/foundation/mock/handlers.ts` |
| S5 | 菜单 tree 含 job 节点 | grep 命中 | `grep "'job'" src/foundation/mock/seeds.ts` |
| S6 | 生产构建通过 | 退出码 0 | `pnpm build` |

### 13.2 单元测试

本 Step **不新增**独立的 mock handler 单元测试文件（mock handler 的回归测试通过 foundation/mock/index.spec.ts 覆盖）。

**现有 mock 测试回归**：`pnpm test` 应保持 `foundation/mock/index.spec.ts` 的 15 个测试全部通过（已验证的 handler 如 login、dict、demo-form、user CRUD 等不受新增影响）。

**job API 测试回归**：`modules/job/api/index.spec.ts` 的 13 个测试应保持通过（API 层测试使用 `vi.mock`，不依赖真实 mock handler）。

**job 视图测试回归**：F2 的 JobList.spec.ts（15 用例）+ JobLog.spec.ts（5 用例）+ JobLog.no-id.spec.ts（1 用例）应保持通过（视图测试使用 `vi.mock('@/modules/job/api')`，不依赖 mock handler）。

### 13.3 集成测试

Mock 集成验证通过 `pnpm dev:mock` + 浏览器手工操作：

| # | 场景 | 操作步骤 | 预期结果 |
|---|------|----------|----------|
| I1 | 左侧菜单「定时任务」可见 | 登录后查看侧边栏 | 侧边栏出现「定时任务」菜单组 |
| I2 | 点击「任务管理」→ 列表加载 | 点击侧边栏「任务管理」 | 表格展示 5 条种子任务数据 |
| I3 | 筛选：任务名称 | 输入"备份"，点击查询 | 过滤后仅显示 1 条（每日数据备份） |
| I4 | 筛选：状态「已暂停」 | 选择状态=已暂停，点击查询 | 过滤后仅显示 1 条（临时数据清理） |
| I5 | 筛选：类型「流程」 | 选择类型=流程，点击查询 | 过滤后显示 2 条（周报自动生成、请假到期自动审批） |
| I6 | 创建任务（BEAN 类型） | 点击「新建任务」，填写表单，保存 | ElMessage 提示「创建成功」，列表刷新显示新任务 |
| I7 | 编辑任务 | 点击某行的「编辑」，修改任务名称，保存 | ElMessage 提示「更新成功」，列表刷新 |
| I8 | 暂停/恢复 | 对运行中任务点击「暂停」，对已暂停任务点击「恢复」 | 状态切换，列表刷新 |
| I9 | 触发执行 | 点击某行的「触发」，确认对话框 | ElMessage 提示「触发成功」 |
| I10 | 删除任务（确认） | 点击「删除」，确认对话框 | ElMessage 提示「删除成功」，列表刷新 |
| I11 | 删除任务（取消） | 点击「删除」，取消对话框 | 列表不变，API 不被调用 |
| I12 | 跳转到执行日志 | 点击某任务行的任何位置（或从应用逻辑跳转 `/job/log?jobId=1`） | 日志列表加载该任务的日志 |
| I13 | 日志详情弹窗 | 点击日志行「详情」按钮 | 弹窗显示全量字段（含执行参数和异常堆栈（如果有）） |
| I14 | 日志筛选 | 选择状态=失败，点击查询 | 列表过滤仅显示 FAILED 记录 |
| I15 | 日志缺 jobId | 直接访问 `/job/log`（不带 query） | 显示 info alert「请从任务列表页跳转访问执行日志」 |

### 13.4 手工验证

| # | 验证项 | 命令/操作 |
|---|--------|----------|
| M1 | `pnpm dev:mock` → 登录 → 侧边栏定时任务菜单 | 肉眼确认 |
| M2 | 任务管理列表渲染：5 条种子数据、筛选、分页 | 肉眼确认 |
| M3 | 创建/编辑弹窗：表单字段、jobType 条件渲染切换 | 肉眼确认 |
| M4 | 操作按钮：暂停/恢复切换、触发确认、删除确认 | 肉眼确认 |
| M5 | 执行日志：按 jobId 列表、详情弹窗 | 肉眼确认 |

### 13.5 回归检查

| # | 检查项 | 预期结果 |
|---|--------|----------|
| R1 | 已有测试不减少 | 54 spec files / 471 tests（与 F2 基线一致）；mock index.spec.ts 15 个测试全通过 |
| R2 | typecheck 零新增错误 | `pnpm typecheck` 退出码 0 |
| R3 | ESLint 零新增 errors | `pnpm lint` 退出码 0 |
| R4 | `pnpm build` 通过 | 退出码 0（验证 tree-shake 路径安全） |
| R5 | 不修改 seeds/handlers 之外的已有文件 | `git diff --name-only HEAD` 仅含 2 个文件（seeds.ts + handlers.ts） |
| R6 | 已有菜单节点不受影响 | 系统管理/表单/流程/通知等菜单仍正常渲染 |

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| C1 | `seeds.ts` 导出 `MOCK_JOB_INFOS`（≥ 5 条）和 `MOCK_JOB_LOGS`（≥ 8 条） | grep + 代码审查 |
| C2 | `seeds.ts` 中 `MOCK_MENU_TREE` 含 `id: '10'` 的定时任务目录节点，含 `id: '100'`（JobList）和 `id: '101'`（JobLog）子节点 | grep + 代码审查 |
| C3 | `seeds.ts` 中 `MOCK_SESSION_DATA.permissions` 含 `'job:view'`、`'job:list'`、`'job:log'` | grep + 代码审查 |
| C4 | `handlers.ts` 含 10 个 pattern 以 `/api/job/` 开头的 mock handler | grep 计数 |
| C5 | handler 覆盖全部 10 个 API 端点（8 JobInfo + 2 JobLog） | 逐个对照 API 文件 |
| C6 | page handler 返回 `{ records, total, pageNum, pageSize }` 形状 | 代码审查 |
| C7 | DELETE handler 幂等（不存在记录返回 code: 0） | 代码审查 |
| C8 | PAUSE handler 修改 status 为 `'PAUSED'`，RESUME 修改为 `'NORMAL'` | 代码审查 |
| C9 | TRIGGER handler 在 MOCK_JOB_LOGS 中追加一条 MANUAL 日志 | 代码审查 |
| C10 | `pnpm typecheck` 退出码 0 | 独立执行 |
| C11 | `pnpm lint` 0 errors | 独立执行 |
| C12 | `pnpm test` 退出码 0，≥ 54 files / ≥ 471 tests（不减少） | 独立执行 |
| C13 | `pnpm build` 退出码 0 | 独立执行 |
| C14 | git diff 仅含 2 个文件：`seeds.ts` + `handlers.ts` | `git diff --name-only HEAD` |

## 15. 执行回执格式

```markdown
# 执行回执 — Step F3

## 1. Step 编号和名称
F3 — Mock + Handlers + 路由

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
（typecheck/lint/test/build 结果、退出码、测试文件数/用例数）

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

本 Step 不区分独立的「测试回执」。执行回执中 §7（命令输出摘要）和 §12（Git diff 摘要）已包含测试结果和证据。mock handler 的正确性通过四连 gate + 肉眼验收确保。

## 17. 明确禁止事项

- ❌ **不要修改 `src/foundation/mock/index.ts`** — 注册机制保持现状
- ❌ **不要修改 `src/foundation/mock/index.spec.ts`** — 除非现有测试因新增 handler 而失败（几乎不可能，现有测试不计数 handler）
- ❌ **不要新增独立的 mock handler 测试文件** — mock handler 通过集成和肉眼验收
- ❌ **不要新建任何文件** — 只修改 2 个已有文件（seeds.ts + handlers.ts）
- ❌ **不要修改 `src/contracts/job.ts`** — 合约类型已封版
- ❌ **不要修改 `src/modules/job/api/`** — API 层已封版
- ❌ **不要修改 `src/modules/job/views/`** — 视图层已封版（F2 通过）
- ❌ **不要修改 `src/router/index.ts` 或 `src/router/guard.ts`** — 路由通过菜单动态构建
- ❌ **不要 import Element Plus 组件或 API 到 seeds/handlers 中**（纯数据处理，不需要 UI）
- ❌ **不要在 handlers 中使用 `Date.now()`**（会导致 seed 数据时间戳不稳定）— 使用固定日期字符串
- ❌ **不要触碰后端代码**（`Smart-WorkFlow/`）
- ❌ **不要修改项目配置文件**（`package.json`、`vite.config.ts`、`tsconfig.json`、`eslint.config.js`）
- ❌ **不要添加或修改 env 文件**（`.env`、`.env.mock`）
