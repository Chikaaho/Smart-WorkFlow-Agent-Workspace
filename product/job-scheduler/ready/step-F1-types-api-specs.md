# Step F1：Types + API + Specs

## 1. 当前状态

- **功能**：job-scheduler（定时任务调度模块），第 5/7 Step
- **前置 Step**：B1 ✅ B2 ✅ B3 ✅ B4 ✅ — 后端全部完成（10 个 REST 端点、406 测试通过）
- **后端端点已可用**（`/job/info` 8 端点 + `/job/log` 2 端点），前端可接真实数据
- **前端基线**：50 spec files / 438 tests（CONFIRMED 2026-07-20 storage F3 验收）
- **job 模块前端**：0 文件（`src/modules/job/` 目录不存在，合约文件 `src/contracts/job.ts` 不存在）
- **参照模块**：storage（已完成闭环）和 notify（已完成闭环）的 F1 产物

## 2. Step 目标

创建 job-scheduler 模块的 TypeScript 类型契约文件（`src/contracts/job.ts`）、API 层（`src/modules/job/api/index.ts`，10 个 API 函数）和 API 单元测试（`src/modules/job/api/index.spec.ts`），打通前端到后端所有 10 个 REST 端点的调用链路。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：纯 TypeScript 类型定义 + API 函数封装 + Vitest 单元测试 — 所有模式（合约接口定义、adaptPage 适配、vitest mock request）在 storage/notify/workflow 模块中已有成熟参照，无架构决策、无多约束收敛、无安全红线。
是否触发升级条件：否

## 4. 模型选择理由

本 Step 是将后端 10 个 REST 端点的契约逐条翻译为 TypeScript 类型和 API 函数，参照代码（storage/api/index.ts、notify/api/index.spec.ts、bpm.ts）形式完备，无需推断新逻辑或处理跨模块依赖。Flash 完全胜任。

## 5. 已知上下文

### 5.1 后端端点契约（已确认）

**JobInfoController** — `@RequestMapping("/job/info")`：

| # | HTTP | 路径 | 请求参数 | 响应体 | 说明 |
|---|------|------|----------|--------|------|
| 1 | POST | `/job/info/page` | `?pageNum=&pageSize=` + body `JobInfo`(可选过滤) | `PageResult<JobInfo>` | 分页查询 |
| 2 | GET | `/job/info/{id}` | 路径 id | `JobInfo` | 按 ID 查 |
| 3 | POST | `/job/info` | body `JobInfo` | `number` (id) | 创建 |
| 4 | PUT | `/job/info` | body `JobInfo` | `void` | 更新 |
| 5 | DELETE | `/job/info/{id}` | 路径 id | `void` | 删除（幂等） |
| 6 | POST | `/job/info/{id}/pause` | 路径 id | `void` | 暂停（幂等） |
| 7 | POST | `/job/info/{id}/resume` | 路径 id | `void` | 恢复（幂等） |
| 8 | POST | `/job/info/{id}/trigger` | 路径 id | `void` | 手动触发 |

**JobLogController** — `@RequestMapping("/job/log")`：

| # | HTTP | 路径 | 请求参数 | 响应体 | 说明 |
|---|------|------|----------|--------|------|
| 9 | POST | `/job/log/page` | `?jobId=&pageNum=&pageSize=` | `PageResult<JobLog>` | 按任务 ID 分页 |
| 10 | GET | `/job/log/{id}` | 路径 id | `JobLog` | 日志详情 |

### 5.2 后端实体字段（前端类型来源）

**JobInfo**（extends BaseEntity，表 `sw_job_info`）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| id | Long | 服务端生成 | 主键 |
| jobName | String | 是 | 任务名称 |
| jobGroup | String | 默认 "DEFAULT" | 任务组 |
| jobType | String | 默认 "BEAN" | BEAN / FLOW |
| cronExpression | String | 是 | Cron 表达式 |
| status | String | 默认 "NORMAL" | NORMAL / PAUSED |
| concurrent | Boolean | 默认 false | 是否并发 |
| misfirePolicy | Integer | 默认 0 | 0=忽略/1=立即触发/2=放弃 |
| description | String | 否 | 描述 |
| beanName | String | BEAN 时必填 | Spring Bean 名 |
| beanParams | String | 否 | 参数 JSON |
| flowDefKey | String | FLOW 时必填 | 流程定义 Key |
| formData | String | 否 | 表单数据 JSON |
| lastFireTime | LocalDateTime | 否 | 上次执行时间 |
| nextFireTime | LocalDateTime | 否 | 下次执行时间 |
| createTime | LocalDateTime | 服务端生成 | 创建时间 |
| updateTime | LocalDateTime | 服务端生成 | 更新时间 |
| createBy | Long | 服务端生成 | 创建人 |
| updateBy | Long | 服务端生成 | 更新人 |

**JobLog**（extends BaseEntity，表 `sw_job_log`）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| id | Long | 服务端生成 | 主键 |
| jobId | Long | 是 | 关联任务 ID |
| jobName | String | 否(冗余) | 任务名称 |
| jobGroup | String | 否(冗余) | 任务组 |
| triggerType | String | 是 | AUTO / MANUAL |
| jobParams | String | 否 | 参数快照 |
| execStatus | String | 是 | RUNNING / SUCCESS / FAILED |
| startTime | LocalDateTime | 否 | 开始时间 |
| endTime | LocalDateTime | 否 | 结束时间 |
| duration | Long | 否 | 耗时(ms) |
| resultMsg | String | 否 | 执行结果 |
| exceptionStack | String | 否 | 异常堆栈 |
| createTime | LocalDateTime | 服务端生成 | 创建时间 |

> **排除字段**：`deleted`、`tenantId`、`version`（BaseEntity 系统列，前端不暴露）。

### 5.3 前端模式（必须严格遵守）

| 模式 | 参照 | 说明 |
|------|------|------|
| 合约接口定义 | `src/contracts/storage.ts`、`src/contracts/bpm.ts` | `interface` + JSDoc 注释，`LocalDateTime` → `string`，不包含系统列 |
| 枚举值 | `src/contracts/bpm.ts`（`TaskStatus` 等） | 使用 `type XxxStatus = 'A' \| 'B'` 字符串字面量联合类型，**不用** TypeScript `enum` |
| API 函数 | `src/modules/storage/api/index.ts` | `request<T>()` 统一入口，分页用 `adaptPage` 适配 `records→list` |
| PageResult 适配 | `src/modules/storage/api/index.ts` L15-29 | `BackendPage<T>` 私有接口 + `adaptPage()` 函数 |
| API 测试 | `src/modules/storage/api/index.spec.ts` | `vi.mock('@/foundation/request')` + `mockRequest` + 验证 `method`/`url`/`params`/`data` |
| 测试文件命名 | `*.spec.ts`（与源文件同目录） | Vitest，`describe` + `it` 块 |
| 导入别名 | `@/contracts/xxx`、`@/foundation/xxx` | 使用 Vite 别名，不写相对路径 |

### 5.4 分页适配（关键）

后端 MyBatis-Plus `Page` Jackson 序列化格式：

```json
{ "records": [...], "total": 100, "pageNum": 1, "pageSize": 10 }
```

前端 `PageResult<T>`（`src/contracts/common.ts`）格式：

```ts
{ list: [...], total: 100, pageNum: 1, pageSize: 10 }
```

每个分页 API 函数内部需要定义私有 `BackendPage<T>` 接口并通过 `adaptPage()` 转换。此模式在 storage、workflow、system 模块中已统一使用，**必须沿用**。

### 5.5 `request<T>()` 行为

- 内部 `axios.request<ApiResponse<T>>(config)` → 自动解包 `R<T>` 的 `data` 字段
- `code !== 0` 时抛出 `ApiError`
- 所以 API 函数返回的是**裸业务数据**（不用 `R<T>` 包装）
- `config` 支持 `method`、`url`、`params`（查询字符串）、`data`（请求体）

### 5.6 新建目录结构

```
src/modules/job/
└── api/
    ├── index.ts        — 10 个 API 函数
    └── index.spec.ts   — API 函数单元测试
```

> F2/F3 将追加 `views/`、`types/`（如需本地类型扩展），本 Step 只建 `api/`。

## 6. 执行前必须读取的文件

按优先级排列：

1. `src/contracts/common.ts` — `PageResult<T>` / `PageQuery` 形状（分页适配必须）
2. `src/contracts/storage.ts` — 合约文件**格式参照**（JSDoc 注释风格、字段命名、可选/必选标记）
3. `src/contracts/bpm.ts` — 枚举**字符串字面量联合类型**参照（`type Xxx = 'A' | 'B'` 模式）
4. `src/foundation/request/index.ts` — `request<T>()` 签名确认（`method`/`url`/`params`/`data` 参数形状）
5. `src/modules/storage/api/index.ts` — API 文件完整参照（`adaptPage`、函数结构、JSDoc 注释格式）
6. `src/modules/storage/api/index.spec.ts` — API 测试完整参照（mock 模式、断言风格、测试数据工厂）

## 7. 允许修改的文件范围

| 文件 | 操作 | 说明 |
|------|:--:|------|
| `src/contracts/job.ts` | 🆕 新建 | 合约类型定义 |
| `src/modules/job/api/index.ts` | 🆕 新建 | API 函数层 |
| `src/modules/job/api/index.spec.ts` | 🆕 新建 | API 单元测试 |

> 共 3 个新建文件，0 个修改文件。

## 8. 禁止修改的范围

- ❌ `src/foundation/request/index.ts` — 不修改请求层
- ❌ `src/contracts/common.ts` — 不修改通用类型
- ❌ `src/foundation/mock/` — 不添加 mock handlers（mock 在 F3 中统一处理）
- ❌ `src/router/` — 不添加路由（路由在 F3 中统一处理）
- ❌ `src/stores/` — 不添加 Store
- ❌ `src/modules/*/`（除 job）— 不触碰其他模块
- ❌ `Smart-WorkFlow/` — 不触碰后端代码
- ❌ `package.json`、`vite.config.ts`、`tsconfig.json` — 不修改项目配置

## 9. 详细执行方案

### 9.1 新建 `src/contracts/job.ts`

创建合约类型文件，包含以下类型定义：

```typescript
/**
 * 定时任务调度模块合约类型。
 *
 * 对齐后端：
 * - JobInfo 实体（sw_job_info 表，BaseEntity 子类）
 * - JobLog 实体（sw_job_log 表，BaseEntity 子类）
 * - 枚举：JobStatus / JobType / ExecStatus / TriggerType
 *
 * 排除字段：deleted / tenantId / version（后端系统列，不暴露给前端）。
 * 日期字段（LocalDateTime → string，ISO-8601 格式）。
 */

// ─── 枚举（字符串字面量联合类型，不用 TypeScript enum） ───

/** 任务调度状态（对齐后端 JobStatus 枚举） */
export type JobStatus = 'NORMAL' | 'PAUSED'

/** 任务类型（对齐后端 JobType 枚举） */
export type JobType = 'BEAN' | 'FLOW'

/** 执行状态（对齐后端 ExecStatus 枚举） */
export type ExecStatus = 'RUNNING' | 'SUCCESS' | 'FAILED'

/** 触发方式（对齐后端 TriggerType 枚举） */
export type TriggerType = 'AUTO' | 'MANUAL'

// ─── 定时任务定义（对齐后端 JobInfo 实体，不含系统列） ───

/** 定时任务定义 */
export interface JobInfo {
  /** 主键（服务端生成） */
  id?: number
  /** 任务名称 */
  jobName: string
  /** 任务组（默认 "DEFAULT"） */
  jobGroup?: string
  /** 任务类型（默认 "BEAN"） */
  jobType?: JobType
  /** Cron 表达式 */
  cronExpression: string
  /** 调度状态（默认 "NORMAL"） */
  status?: JobStatus
  /** 是否允许并发执行（默认 false） */
  concurrent?: boolean
  /** Misfire 策略：0=忽略 / 1=立即触发一次 / 2=放弃（默认 0） */
  misfirePolicy?: number
  /** 任务描述 */
  description?: string
  /** Bean 名称（jobType=BEAN 时必填） */
  beanName?: string
  /** Bean 方法参数（JSON 字符串，可选） */
  beanParams?: string
  /** 流程定义 Key（jobType=FLOW 时必填） */
  flowDefKey?: string
  /** 流程表单数据（JSON 字符串，可选） */
  formData?: string
  /** 上次执行时间（ISO-8601） */
  lastFireTime?: string
  /** 下次执行时间（ISO-8601） */
  nextFireTime?: string
  /** 创建时间（ISO-8601，服务端生成） */
  createTime?: string
  /** 更新时间（ISO-8601，服务端生成） */
  updateTime?: string
  /** 创建人 ID（服务端生成） */
  createBy?: number
  /** 更新人 ID（服务端生成） */
  updateBy?: number
}

// ─── 执行日志（对齐后端 JobLog 实体，不含系统列） ───

/** 定时任务执行日志 */
export interface JobLog {
  /** 主键（服务端生成） */
  id?: number
  /** 关联任务 ID */
  jobId: number
  /** 任务名称（冗余字段） */
  jobName?: string
  /** 任务组（冗余字段） */
  jobGroup?: string
  /** 触发方式 */
  triggerType: TriggerType
  /** 执行时参数快照（JSON 字符串） */
  jobParams?: string
  /** 执行状态 */
  execStatus: ExecStatus
  /** 执行开始时间（ISO-8601） */
  startTime?: string
  /** 执行结束时间（ISO-8601） */
  endTime?: string
  /** 执行耗时（毫秒） */
  duration?: number
  /** 执行结果或异常消息 */
  resultMsg?: string
  /** 异常堆栈（仅失败时） */
  exceptionStack?: string
  /** 创建时间（ISO-8601，服务端生成） */
  createTime?: string
}
```

> **字段可选性规则**：服务端生成字段（id、createTime、updateTime、createBy、updateBy）标记 `?`；有后端默认值的字段（jobGroup、status、jobType、concurrent、misfirePolicy）标记 `?`；冗余/可选字段标记 `?`。`jobName`、`cronExpression` 为必填（后端 Controller 校验 `isBlank` 抛 PARAM_ERROR）。

### 9.2 新建 `src/modules/job/api/index.ts`

创建 API 函数层，10 个函数对应 10 个后端端点：

```typescript
/**
 * 定时任务调度模块 API 层 — 10 个端点。
 *
 * 全部经 foundation/request 单一请求层，禁直引 axios。
 * 后端统一响应 R<T> 由 request() 解包，本层直接拿到 data: T。
 * 分页端点使用 adaptPage 适配 MyBatis-Plus Page → PageResult。
 */
import { request } from '@/foundation/request'
import type { PageResult } from '@/contracts/common'
import type { JobInfo, JobLog } from '@/contracts/job'

// ─── 后端分页原始形状 ───
// MyBatis-Plus Page Jackson 序列化为 records/total/pageNum/pageSize
interface BackendPage<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

function adaptPage<T>(raw: BackendPage<T>): PageResult<T> {
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.pageNum,
    pageSize: raw.pageSize,
  }
}

// ═══════════════════════════════════════
// 任务定义 CRUD
// ═══════════════════════════════════════

/**
 * 分页查询任务定义。
 * POST /job/info/page?pageNum=&pageSize= + body JobInfo(可选过滤条件)
 */
export async function pageJobInfos(
  pageNum: number,
  pageSize: number,
  query?: Partial<Pick<JobInfo, 'jobName' | 'jobType' | 'status'>>,
): Promise<PageResult<JobInfo>> {
  const raw = await request<BackendPage<JobInfo>>({
    method: 'POST',
    url: '/job/info/page',
    params: { pageNum, pageSize },
    data: query,
  })
  return adaptPage(raw)
}

/**
 * 按 ID 查询任务定义。
 * GET /job/info/{id}
 */
export async function getJobInfo(id: number): Promise<JobInfo> {
  return request<JobInfo>({
    method: 'GET',
    url: `/job/info/${id}`,
  })
}

/**
 * 创建任务定义。
 * POST /job/info — body 完整 JobInfo 对象
 * @returns 新创建的任务 ID
 */
export async function createJobInfo(data: Omit<JobInfo, 'id' | 'createTime' | 'updateTime' | 'createBy' | 'updateBy'>): Promise<number> {
  return request<number>({
    method: 'POST',
    url: '/job/info',
    data,
  })
}

/**
 * 更新任务定义。
 * PUT /job/info — body 完整 JobInfo 对象（id 必填）
 */
export async function updateJobInfo(data: JobInfo): Promise<void> {
  return request<void>({
    method: 'PUT',
    url: '/job/info',
    data,
  })
}

/**
 * 删除任务定义（软删除 + 从 Quartz 移除，幂等）。
 * DELETE /job/info/{id}
 */
export async function deleteJobInfo(id: number): Promise<void> {
  return request<void>({
    method: 'DELETE',
    url: `/job/info/${id}`,
  })
}

/**
 * 暂停任务（幂等）。
 * POST /job/info/{id}/pause
 */
export async function pauseJob(id: number): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/job/info/${id}/pause`,
  })
}

/**
 * 恢复任务（幂等）。
 * POST /job/info/{id}/resume
 */
export async function resumeJob(id: number): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/job/info/${id}/resume`,
  })
}

/**
 * 手动触发一次任务执行（不改变调度计划）。
 * POST /job/info/{id}/trigger
 */
export async function triggerJob(id: number): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/job/info/${id}/trigger`,
  })
}

// ═══════════════════════════════════════
// 执行日志
// ═══════════════════════════════════════

/**
 * 按任务 ID 分页查询执行日志。
 * POST /job/log/page?jobId=&pageNum=&pageSize=
 */
export async function pageJobLogs(
  jobId: number,
  pageNum: number,
  pageSize: number,
): Promise<PageResult<JobLog>> {
  const raw = await request<BackendPage<JobLog>>({
    method: 'POST',
    url: '/job/log/page',
    params: { jobId, pageNum, pageSize },
  })
  return adaptPage(raw)
}

/**
 * 按 ID 查询单条日志详情。
 * GET /job/log/{id}
 */
export async function getJobLog(id: number): Promise<JobLog> {
  return request<JobLog>({
    method: 'GET',
    url: `/job/log/${id}`,
  })
}
```

> **关键注意**：
> - `pageJobInfos` 的 `params`（pageNum/pageSize）走查询字符串，`data`（过滤条件）走请求体
> - `pageJobLogs` 的 `jobId` 走的也是查询字符串（`@RequestParam`），放 `params`
> - `createJobInfo` 参数类型排除服务端生成字段
> - `updateJobInfo` 参数类型包含 `id`（必填，后端校验 `id == null` 抛 PARAM_ERROR）

### 9.3 新建 `src/modules/job/api/index.spec.ts`

创建 API 单元测试文件，采用 `vi.mock('@/foundation/request')` 模式：

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRequest = vi.fn()

vi.mock('@/foundation/request', () => ({
  request: <T>(config: unknown): Promise<T> => mockRequest(config),
}))

const jobApi = await import('./index')

// ─── 测试数据工厂 ───

function makeJobInfo(overrides: Partial<import('@/contracts/job').JobInfo> = {}): import('@/contracts/job').JobInfo {
  return {
    id: 1,
    jobName: '测试任务',
    jobGroup: 'DEFAULT',
    jobType: 'BEAN',
    cronExpression: '0/30 * * * * ?',
    status: 'NORMAL',
    concurrent: false,
    misfirePolicy: 0,
    description: '测试描述',
    beanName: 'testHandler',
    flowDefKey: undefined,
    lastFireTime: '2026-07-21T10:00:00',
    nextFireTime: '2026-07-21T10:00:30',
    createTime: '2026-07-20T00:00:00',
    updateTime: '2026-07-20T00:00:00',
    createBy: 1,
    updateBy: 1,
    ...overrides,
  }
}

function makeJobLog(overrides: Partial<import('@/contracts/job').JobLog> = {}): import('@/contracts/job').JobLog {
  return {
    id: 1,
    jobId: 1,
    jobName: '测试任务',
    jobGroup: 'DEFAULT',
    triggerType: 'AUTO',
    execStatus: 'SUCCESS',
    startTime: '2026-07-21T10:00:00',
    endTime: '2026-07-21T10:00:05',
    duration: 5000,
    resultMsg: '执行成功',
    createTime: '2026-07-21T10:00:05',
    ...overrides,
  }
}

function makeBackendPage<T>(records: T[], total: number, pageNum: number, pageSize: number) {
  return { records, total, pageNum, pageSize }
}

// ═══════════════════════════════════════

describe('modules/job/api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── pageJobInfos ───

  describe('pageJobInfos', () => {
    it('POST /job/info/page with params + body, adapts backend Page → PageResult', async () => {
      const job = makeJobInfo()
      mockRequest.mockResolvedValueOnce(makeBackendPage([job], 100, 1, 10))

      const result = await jobApi.pageJobInfos(1, 10, { jobName: '测试' })

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/job/info/page',
        params: { pageNum: 1, pageSize: 10 },
        data: { jobName: '测试' },
      })
      expect(result.list).toHaveLength(1)
      expect(result.list[0].jobName).toBe('测试任务')
      expect(result.total).toBe(100)
      expect(result.pageNum).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('passes undefined query body when no filter provided', async () => {
      const job = makeJobInfo()
      mockRequest.mockResolvedValueOnce(makeBackendPage([job], 50, 2, 20))

      const result = await jobApi.pageJobInfos(2, 20)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/job/info/page',
        params: { pageNum: 2, pageSize: 20 },
        data: undefined,
      })
      expect(result.list).toHaveLength(1)
    })

    it('returns empty list when no jobs', async () => {
      mockRequest.mockResolvedValueOnce(makeBackendPage([], 0, 1, 10))

      const result = await jobApi.pageJobInfos(1, 10)
      expect(result.list).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ─── getJobInfo ───

  describe('getJobInfo', () => {
    it('GET /job/info/{id} → JobInfo', async () => {
      const job = makeJobInfo()
      mockRequest.mockResolvedValueOnce(job)

      const result = await jobApi.getJobInfo(1)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/job/info/1',
      })
      expect(result).toEqual(job)
    })
  })

  // ─── createJobInfo ───

  describe('createJobInfo', () => {
    it('POST /job/info with body → returns new job id', async () => {
      mockRequest.mockResolvedValueOnce(42)

      const data = makeJobInfo()
      const result = await jobApi.createJobInfo(data)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/job/info',
        data,
      })
      expect(result).toBe(42)
    })
  })

  // ─── updateJobInfo ───

  describe('updateJobInfo', () => {
    it('PUT /job/info with body → void', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      const data = makeJobInfo()
      await jobApi.updateJobInfo(data)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/job/info',
        data,
      })
    })
  })

  // ─── deleteJobInfo ───

  describe('deleteJobInfo', () => {
    it('DELETE /job/info/{id} → void', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      await jobApi.deleteJobInfo(1)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/job/info/1',
      })
    })
  })

  // ─── pauseJob ───

  describe('pauseJob', () => {
    it('POST /job/info/{id}/pause → void', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      await jobApi.pauseJob(1)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/job/info/1/pause',
      })
    })
  })

  // ─── resumeJob ───

  describe('resumeJob', () => {
    it('POST /job/info/{id}/resume → void', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      await jobApi.resumeJob(1)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/job/info/1/resume',
      })
    })
  })

  // ─── triggerJob ───

  describe('triggerJob', () => {
    it('POST /job/info/{id}/trigger → void', async () => {
      mockRequest.mockResolvedValueOnce(undefined)

      await jobApi.triggerJob(1)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/job/info/1/trigger',
      })
    })
  })

  // ─── pageJobLogs ───

  describe('pageJobLogs', () => {
    it('POST /job/log/page?jobId=&pageNum=&pageSize=, adapts backend Page', async () => {
      const log = makeJobLog()
      mockRequest.mockResolvedValueOnce(makeBackendPage([log], 30, 1, 10))

      const result = await jobApi.pageJobLogs(1, 1, 10)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/job/log/page',
        params: { jobId: 1, pageNum: 1, pageSize: 10 },
      })
      expect(result.list).toHaveLength(1)
      expect(result.list[0].execStatus).toBe('SUCCESS')
      expect(result.total).toBe(30)
    })

    it('returns empty list when no logs for given job', async () => {
      mockRequest.mockResolvedValueOnce(makeBackendPage([], 0, 1, 10))

      const result = await jobApi.pageJobLogs(999, 1, 10)
      expect(result.list).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ─── getJobLog ───

  describe('getJobLog', () => {
    it('GET /job/log/{id} → JobLog', async () => {
      const log = makeJobLog()
      mockRequest.mockResolvedValueOnce(log)

      const result = await jobApi.getJobLog(1)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/job/log/1',
      })
      expect(result).toEqual(log)
    })
  })
})
```

> **测试用例统计**：3 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 2 + 1 = **13 个测试用例**，覆盖全部 10 个 API 函数（pageJobInfos 3 个含空列表和可选过滤；pageJobLogs 2 个含空列表；其余 8 个函数各 1 个 happy path）。

### 9.4 执行命令

```bash
cd Smart-WorkFlow-Web

# 1. 创建目录
mkdir -p src/modules/job/api

# 2. TypeScript 类型检查
pnpm typecheck

# 3. ESLint（含架构边界规则）
pnpm lint

# 4. 单元测试（含新 spec）
pnpm test

# 5. 全量校验门
pnpm typecheck && pnpm lint && pnpm test
```

> `pnpm build` 可在本地执行作为额外确认，但本 Step 不强制（无 UI 产出）。四连完整校验门（含 build）将在 F3 最终验收时强制执行。

## 10. 关键实现约束

1. **`request()` 是唯一 HTTP 入口** — 不 import axios、fetch（除 download 场景外）。ESLint 边界规则强制执行。
2. **分页适配不可省略** — 每个分页端点必须定义 `BackendPage<T>` + `adaptPage()`，后端返回 `records`，前端期望 `list`。
3. **枚举用字符串字面量联合类型** — 不用 TypeScript `enum`（与 bpm.ts、notify.ts、storage.ts 一致）。
4. **排除系统列** — 不在合约中包含 `deleted`、`tenantId`、`version`（后端系统列，前端无业务语义）。
5. **日期字段类型为 `string`** — 后端 `LocalDateTime` Jackson 序列化为 ISO-8601 字符串，前端合约中对应 `string`。
6. **API 函数不包装 `R<T>`** — `request()` 已解包，函数返回裸业务数据类型。
7. **测试不发起真实 HTTP** — 必须 `vi.mock('@/foundation/request')`，只验证 `mockRequest` 的参数。
8. **URL 路径不含 `/api` 前缀** — `baseURL` 在 axios 实例和 mock 匹配层分别追加。

## 11. 边界情况

| # | 场景 | 处理方式 |
|---|------|----------|
| 1 | `pageJobInfos` 无过滤条件（query 为 undefined） | `data: undefined`，axios 不发送 body（后端 `@RequestBody(required=false)` 接受） |
| 2 | `pageJobInfos` 空结果 | `records: []`，`total: 0`，`adaptPage` 正常转换 |
| 3 | `pageJobLogs` 空结果 | 同上 |
| 4 | `createJobInfo` 不传 `id`/`createTime` 等 | TypeScript 类型 `Omit<...>` 确保编译期排除 |
| 5 | `updateJobInfo` 不传 `id` | 运行期由后端抛 PARAM_ERROR，前端类型要求 `JobInfo`（含 `id?: number`，但建议业务层确保传入） |
| 6 | `getJobInfo` / `getJobLog` 传入不存在的 ID | 后端抛 NOT_FOUND（BaseException），`request()` 转 `ApiError` |
| 7 | 后端返回的 JSON 包含合约未声明的字段 | TypeScript 结构类型兼容，多余字段被忽略（安全） |
| 8 | ID 类型：后端 `Long` → 前端 `number` | JS number 安全整数范围 ±2^53，Long 在 ID 场景安全 |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解 |
|------|:--:|------|------|
| 后端分页端点 JSON 形状与假设不一致（如 `pageNum` vs `page`） | 低 | 分页列表不可用 | B1-B4 已验证后端 MP Page 序列化格式（records/total/pageNum/pageSize）。如出现不一致，`adaptPage` 只需改一处 |
| Mockito `any()` vs `nullable()` 教训重现在前端 | 不适用 | 无 | 前端 test 使用 vi.fn() mock，无类似问题 |
| 合约字段与后端序列化不匹配 | 低 | TypeScript 类型检查不报错，但运行时数据 shape 不一致 | 已对齐后端 Entity 字段名（Jackson 默认 camelCase 序列化） |
| ESLint 架构边界规则冲突 | 低 | 新文件可能违反导入白名单 | `src/modules/job/api/` 已在 `eslint.config.js` modules 目录下，自动适用规则 |

**回滚方案**：删除 3 个新建文件即可完全回滚（`rm src/contracts/job.ts src/modules/job/api/index.ts src/modules/job/api/index.spec.ts`）。0 个已有文件被修改，回滚无连带影响。

**回滚验证**：`pnpm typecheck && pnpm lint && pnpm test` 应与 F1 执行前基线一致（50 spec files / 438 tests）。

## 13. 测试方案

### 13.1 静态检查

| # | 检查项 | 预期结果 | 命令 |
|---|--------|----------|------|
| S1 | TypeScript 类型检查通过 | 退出码 0，无类型错误 | `pnpm typecheck` |
| S2 | ESLint 通过（含架构边界规则） | 退出码 0，无新增告警 | `pnpm lint` |
| S3 | `src/contracts/job.ts` 不含 `deleted`/`tenantId`/`version` | 零命中 | `grep -c 'deleted\|tenantId\|version' src/contracts/job.ts` → 0 |
| S4 | API 文件不直引 axios/fetch | 零命中 | `grep -c "from 'axios'" src/modules/job/api/index.ts` → 0 |
| S5 | API 文件不含 `/api` 硬编码路径前缀 | 零命中 | `grep -c "'/api/" src/modules/job/api/index.ts` → 0 |

### 13.2 单元测试

| # | 测试项 | 覆盖的 API 函数 | 验证内容 |
|---|--------|----------------|----------|
| T1 | `pageJobInfos` — 正常分页 + 过滤 | pageJobInfos | method=POST, url, params, data, adaptPage 转换 |
| T2 | `pageJobInfos` — 无过滤条件 | pageJobInfos | data=undefined 时正常调用 |
| T3 | `pageJobInfos` — 空结果 | pageJobInfos | records=[], total=0, adaptPage 正常 |
| T4 | `getJobInfo` — 按 ID 查 | getJobInfo | method=GET, url 含 id, 返回 JobInfo |
| T5 | `createJobInfo` — 创建 | createJobInfo | method=POST, url, data, 返回 number |
| T6 | `updateJobInfo` — 更新 | updateJobInfo | method=PUT, url, data |
| T7 | `deleteJobInfo` — 删除 | deleteJobInfo | method=DELETE, url 含 id |
| T8 | `pauseJob` — 暂停 | pauseJob | method=POST, url /pause |
| T9 | `resumeJob` — 恢复 | resumeJob | method=POST, url /resume |
| T10 | `triggerJob` — 手动触发 | triggerJob | method=POST, url /trigger |
| T11 | `pageJobLogs` — 正常分页 | pageJobLogs | method=POST, url, params(jobId+pageNum+pageSize), adaptPage |
| T12 | `pageJobLogs` — 空结果 | pageJobLogs | records=[], total=0 |
| T13 | `getJobLog` — 按 ID 查 | getJobLog | method=GET, url 含 id, 返回 JobLog |

> 预期：13 个测试全部通过。`pnpm test` 退出码 0。

### 13.3 集成测试

本 Step 不涉及集成测试（纯 TypeScript 类型 + API 封装 + 单元测试，无 UI 交互、无跨模块数据流）。

### 13.4 手工验证

本 Step 不需要手工验证（无 UI 产出）。

### 13.5 回归检查

| # | 检查项 | 预期结果 | 命令 |
|---|--------|----------|------|
| R1 | 已有测试不减少 | 50 spec files / 438 tests（+1 spec file / +13 tests） | `pnpm test` |
| R2 | 已有模块类型检查不受影响 | typecheck 零错误 | `pnpm typecheck` |
| R3 | ESLint 零新增告警 | lint 通过 | `pnpm lint` |
| R4 | 不修改任何已有文件 | git diff 仅 3 个新建文件 | `git diff --name-only` |

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| C1 | `src/contracts/job.ts` 存在，含 `JobInfo` 和 `JobLog` 两个接口及 4 个字符串字面量联合类型（`JobStatus`、`JobType`、`ExecStatus`、`TriggerType`） | 文件审查 |
| C2 | `JobInfo` 接口不含 `deleted`/`tenantId`/`version` 字段；日期字段类型为 `string` | grep + 文件审查 |
| C3 | `JobLog` 接口不含 `deleted`/`tenantId`/`version` 字段；日期字段类型为 `string` | grep + 文件审查 |
| C4 | `src/modules/job/api/index.ts` 存在，含 10 个 `export async function`（8 个 JobInfo + 2 个 JobLog） | 文件审查 |
| C5 | 分页函数（`pageJobInfos`、`pageJobLogs`）内部使用 `adaptPage` 适配 `records→list` | 文件审查 |
| C6 | 所有 API 函数通过 `request<T>()` 发请求（不直引 axios/fetch） | grep 确认 |
| C7 | API URL 不含硬编码 `/api` 前缀 | grep `'/api/` zero |
| C8 | `src/modules/job/api/index.spec.ts` 存在，含 ≥ 13 个 `it()` 测试用例 | 文件审查 |
| C9 | 测试使用 `vi.mock('@/foundation/request')` + `mockRequest` 模式，不发起真实 HTTP | 文件审查 |
| C10 | `pnpm typecheck` 退出码 0 | 命令执行 |
| C11 | `pnpm lint` 退出码 0，零新增告警 | 命令执行 |
| C12 | `pnpm test` 退出码 0，全部测试通过（≥ 51 spec files / ≥ 451 tests） | 命令执行 |
| C13 | 不修改任何已有文件（仅 3 个新建文件） | `git diff --name-only` |
| C14 | `src/contracts/job.ts` 有 JSDoc 注释标注对齐的后端实体/枚举名 | 文件审查 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step F1

## 1. Step 编号和名称
F1 — Types + API + Specs

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
（typecheck/lint/test 结果、退出码等）

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

- ❌ **不要添加 mock handlers** — mock 注册在 F3 中统一处理，本 Step 只做类型 + API + 测试
- ❌ **不要添加路由或菜单** — 路由在 F3 中统一处理
- ❌ **不要创建 Vue 视图组件** — 视图在 F2 中处理
- ❌ **不要创建 Store（Pinia）** — 如后续需要，在对应 Step 中创建
- ❌ **不要修改 `src/foundation/request/index.ts`** — 请求层保持现状
- ❌ **不要修改 `src/contracts/common.ts`** — 通用类型保持现状
- ❌ **不要修改项目配置文件**（`package.json`、`vite.config.ts`、`tsconfig.json`、`eslint.config.js`）
- ❌ **不要触碰后端代码**（`Smart-WorkFlow/`）
- ❌ **不要直引 axios** — API 文件必须经 `@/foundation/request` 的 `request()` 方法
- ❌ **不要用 TypeScript `enum`** — 枚举用字符串字面量联合类型
- ❌ **不要在合约中包含 `deleted`/`tenantId`/`version`** — 系统列不暴露前端
- ❌ **不要忘记 `adaptPage`** — 分页端点必须适配 `records→list`
