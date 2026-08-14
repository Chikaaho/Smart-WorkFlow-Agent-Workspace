# Job Scheduler — 定时任务调度模块

> 功能编号：job-scheduler
> 功能名称：定时任务调度模块（Quartz 单节点 / BEAN + FLOW 双类型 / 前后端闭环）
> 对应功能清单：M10-F03-01 定时任务 > 任务调度
> 创建时间：2026-07-20
> 当前状态：**COMPLETED** ✅
> ⚠️ **2026-08-14 角色制上线**：本文件中的"推荐模型/实际模型"字段为当时执行事实，仅作历史存档；当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。

---

## 1. 功能目标

构建基于 Quartz 的定时任务调度模块，提供任务 CRUD、Cron 调度管理、执行记录追踪能力，前后端闭环。支持 BEAN（Spring Bean 处理器）和 FLOW（定时发起流程）两种任务类型。

## 2. 非目标

- 不做 Quartz 集群化（JDBC JobStore）— 当前仅单节点 RAMJobStore
- 不做 FLOW 任务与 BPM/Form 的端到端集成验证（仅发领域事件）
- 不做任务日志的自动清理/归档（配置项预留，逻辑延后）
- 不做前端可视化 Cron 编辑器（文本输入）
- 不做任务的导入导出

## 3. 影响范围

### 后端
- `sw-basic-job` → 拆分为 `-api` / `-biz`
- 新建 `sw_job_info` + `sw_job_log` 两张表（Flyway V17）
- 引入 `spring-boot-starter-quartz` 依赖
- BOM / POM / 配置文件联动更新

### 前端
- `src/contracts/job.ts` — 新建类型契约
- `src/modules/job/` — 新建完整业务模块
- `src/foundation/mock/` — 追加种子数据和 handlers

## 4. Step 列表

| Step | 名称 | 职责域 | 状态 |
|:----:|------|:------:|:----:|
| B1 | 模块拆分 + Flyway + Entity + Mapper + 配置 | 后端 | **PASSED** ✅ |
| B2 | JobHandler + Service + Quartz 调度 | 后端 | **PASSED** ✅ |
| B3 | Controller + Facade | 后端 | **PASSED** ✅ |
| B4 | Controller 测试 + 全量回归 | 后端 | **PASSED** ✅ |
| F1 | Types + API + Specs | 前端 | **PASSED** ✅ |
| F2 | Vue 视图（JobList + JobLog） | 前端 | **PASSED** ✅ |
| F3 | Mock + Handlers + 路由 | 前端 | **PASSED** ✅ |

## 5. Step 详情

### Step B1 — 模块拆分 + Flyway + Entity + Mapper + 配置（PASSED ✅）

- **方案**：`product/job-scheduler/passed/step-B1-module-split.md`
- **状态**：PASSED ✅ — 2026-07-20 验收通过
- **验收标准数**：17/17 通过
- **关键产出**：
  - 13 新建文件（3 POM + 2 package-info + 2 Entity + 2 Mapper + 1 Properties + 1 AutoConfiguration + 2 Flyway）
  - 5 修改文件（job 聚合 POM、sw-basic POM、bootstrap POM、application.yml ×2）
  - 2 删除文件（旧 AutoConfiguration、旧 package-info）

### Step B2 — JobHandler + Service + Quartz 调度（PASSED ✅）

- **方案**：`product/job-scheduler/passed/step-B2-jobhandler-service-scheduler.md`
- **状态**：PASSED ✅ — 2026-07-21 验收通过
- **验收标准数**：14/14 通过
- **关键产出**：
  - 12 新建文件（4 枚举 + JobHandler SPI + ScheduledFlowTriggerEvent + 4 Service 接口/实现 + QuartzSchedulerService + SwJobBean）
  - 1 修改文件（JobAutoConfiguration @ComponentScan 追加 scheduler 包）
- **方案偏差**：2 处方案笔误（文件计数 11→12、executeInternal throws Exception 误标），执行代理正确处理

### Step B3 — Controller + Facade（PASSED ✅）

- **方案**：`product/job-scheduler/passed/step-B3-controller-facade.md`
- **执行回执**：`product/job-scheduler/receipts/step-B3-controller-facade-execution.md`
- **测试回执**：`product/job-scheduler/receipts/step-B3-controller-facade-test.md`
- **状态**：PASSED ✅ — 2026-07-21 执行+测试+验收通过
- **验收标准数**：12/12 通过
- **关键产出**：
  - 6 新建文件（JobInfoDTO + JobFacade + JobFacadeImpl + JobInfoController + JobLogController + JobStartupRunner）
  - 4 修改文件（JobInfoService + JobInfoServiceImpl + JobLogService + JobLogServiceImpl 追加 page 方法）
  - `mvn -q compile` 退出码 0 / `mvn -q test` 退出码 0
- **方案偏差**：
  1. `JobFacade` 返回 `JobInfoDTO`（非 `JobInfo` Entity）— 因 -api 不可依赖 -biz，新增 JobInfoDTO 做契约
  2. 多修改 JobInfoService + JobInfoServiceImpl（方案遗漏 page 方法）
- **方案偏差原因**：方案未考虑 -api 模块不依赖 -biz 的模块边界约束

### Step B4 — Controller 测试 + 全量回归（PASSED ✅）

- **方案**：`product/job-scheduler/passed/step-B4-controller-test.md`
- **执行回执**：`product/job-scheduler/receipts/step-B4-controller-test-execution.md`
- **状态**：PASSED ✅ — 2026-07-21 执行+测试通过
- **验收标准数**：14/14 通过
- **关键产出**：
  - 3 新建测试文件（JobInfoControllerTest ~27 用例 + JobLogControllerTest ~5 用例 + JobFacadeImplTest ~5 用例）
  - 0 修改文件（纯测试新增，不碰源码）
  - `mvn -q compile` 退出码 0 / `mvn -q test` 退出码 0（全量 406 测试通过）
- **方案偏差**：
  1. JobLog Entity 字段名 `execStatus`（非 `status`），方案模板需对应修正
  2. `any(JobInfo.class)` 不匹配 null，实际使用 `nullable(JobInfo.class)`
- **关键教训**：Mockito 的 `any(Class)` 不匹配 null 参数，需用 `nullable(Class)`

### Step F1 — Types + API + Specs（PASSED ✅）

- **方案**：`product/job-scheduler/passed/step-F1-types-api-specs.md`
- **执行回执**：`product/job-scheduler/receipts/step-F1-types-api-specs-execution.md`
- **状态**：PASSED ✅ — 2026-07-21 执行+测试+验收通过
- **验收标准数**：14/14 通过
- **实际模型**：deepseek-v4-flash
- **关键产出**：
  - 3 新建文件（contracts/job.ts 103 行 + api/index.ts 112 行 + api/index.spec.ts 214 行，共 429 行）
  - 合约：2 接口（JobInfo 19 字段 + JobLog 13 字段）+ 4 字符串字面量联合类型
  - API：10 个 API 函数（8 JobInfo + 2 JobLog），adaptPage 适配
  - 测试：13 个 Vitest 用例，mock request 模式，全部通过
  - 0 修改已有文件
- **独立验证结果**（2026-07-21）：
  - C1-C9 静态检查全部通过（grep、文件审查）
  - C10 `pnpm typecheck` 退出码 0（独立执行确认）
  - C11 `pnpm lint` 退出码 0（独立执行确认）
  - C12 `pnpm test` 退出码 0，51 files / 451 tests（独立执行确认）
  - C13 仅 3 个未跟踪新文件（`git status` 确认）
  - C14 JSDoc 注释完整

### Step F2 — Vue 视图（JobList + JobLog）（PASSED ✅）

- **方案**：`product/job-scheduler/passed/step-F2-vue-views.md`
- **执行回执**：`product/job-scheduler/receipts/step-F2-vue-views-execution.md`
- **状态**：PASSED ✅ — 2026-07-21 执行+测试+验收通过
- **验收标准数**：14/14 通过
- **实际模型**：deepseek-v4-flash
- **关键产出**：
  - 5 新建文件（JobList.vue ~420 行 + JobList.spec.ts ~370 行/15 用例 + JobLog.vue ~245 行 + JobLog.spec.ts ~140 行/5 用例 + JobLog.no-id.spec.ts ~60 行/1 用例），0 修改文件
  - JobList.vue：StandardListTemplate 页型 B，筛选（jobName/status/jobType 双对象模式）+ 表格 9 列 + 创建/编辑弹窗（含 jobType 条件渲染 BEAN ↔ FLOW）+ 5 操作（编辑/暂停-恢复/触发/删除）+ operatingId 防重复
  - JobLog.vue：StandardListTemplate 页型 B 只读视图，route.query.jobId 获取参数 + 缺参 info alert + 详情弹窗（el-descriptions 含 exceptionStack 红色 code）
  - 21 个测试用例，全量基线 54 files / 471 tests
- **方案偏差**：
  1. JobLog 测试拆分为 2 文件（JobLog.spec.ts + JobLog.no-id.spec.ts），避免 vi.mock hoisting 冲突
  2. 测试使用静态 import（非动态），兼容 @vue/test-utils 4.x
  3. JobLog 组件 import 重命名为 JobLogComponent 避免与合约类型冲突
  4. JobList.vue import ElMessage/ElMessageBox 与 StorageList.vue/NotifyHome.vue 一致（既有模式）
- **独立验证结果**（2026-07-21）：
  - C1-C11 静态检查全部通过（文件审查）
  - C12 ElMessage/ElMessageBox import 符合既有模式（StorageList.vue L14 / NotifyHome.vue L9 同款）
  - C13 ApiError type import 符合既有模式（与 StorageList/NotifyHome 一致）
  - C14 typecheck 0 · lint 0 (0 errors) · test **54 files / 471 tests**（独立执行确认）

### Step F3 — Mock + Handlers + 路由（PASSED ✅）

- **方案**：`product/job-scheduler/passed/step-F3-mock-handlers-route.md`
- **执行回执**：`product/job-scheduler/receipts/step-F3-mock-handlers-route-execution.md`
- **状态**：PASSED ✅ — 2026-07-21 执行+测试+验收通过
- **验收标准数**：14/14 通过
- **实际模型**：deepseek-v4-flash
- **关键产出**：
  - 2 个手动修改文件（seeds.ts +312 行 + handlers.ts +231 行），0 新建文件
  - 2 个自动格式化文件（JobLog.spec.ts / JobLog.no-id.spec.ts — Prettier）+ 1 个自动生成类型声明（components.d.ts +4 行）
  - seeds.ts：MOCK_JOB_INFOS（5 条：3 BEAN + 2 FLOW + 1 PAUSED）+ MOCK_JOB_LOGS（8 条：6 SUCCESS + 1 FAILED + 1 RUNNING + 2 MANUAL + 6 AUTO）+ MOCK_MENU_TREE id:'10' 定时任务节点（含 JobList/JobLog 子节点）+ MOCK_SESSION_DATA.permissions（job:view/list/log）
  - handlers.ts：10 个 mock handler（8 JobInfo + 2 JobLog），完整覆盖 CRUD + pause/resume/trigger
  - 全量基线：54 files / 471 tests（无回归）
- **方案偏差**：
  1. `src/types/components.d.ts` 被 vue-tsc 自动注册 Element Plus 组件类型（预期行为）
  2. F2 测试文件被 `pnpm lint --fix` 格式化（Prettier 缩进调整，无逻辑变更）
  3. Git 提交将所有 F1-F3 文件合并为一个 commit（而非分 Step 提交）
- **独立验证结果**（2026-07-21）：
  - C1-C9 静态检查全部通过（代码审查逐项对照）
  - C10 `pnpm typecheck` 退出码 0（独立执行确认）
  - C11 `pnpm lint` 退出码 0（独立执行确认）
  - C12 `pnpm test` 退出码 0，54 files / 471 tests（独立执行确认）
  - C13 `pnpm build` 回执 REPORTED 退出码 0（规划代理禁止执行 build）
  - C14 手动修改仅 2 文件（seeds.ts + handlers.ts）

## 6. 测试基线（最终）

| 项目 | 基线 | 状态 |
|------|:------:|:----:|
| 后端测试 | 406 tests / 26 个测试文件 | ✅ B4 后全量通过 |
| 前端测试 | 54 spec files / 471 tests | ✅ F3 验收确认无回归 |

## 7. 最终清单

### 7.1 后端产出（B1–B4，共 4 个 Step）

| 类别 | 数量 | 明细 |
|------|:--:|------|
| 新建文件 | 34 | Entity ×2, Mapper ×2, Flyway ×2, POM ×3, package-info ×2, Properties ×1, AutoConfiguration ×1, 枚举 ×4, SPI ×1, 事件 ×1, Service 接口/实现 ×4, QuartzSchedulerService ×1, SwJobBean ×1, JobInfoDTO ×1, Facade 接口/实现 ×2, Controller ×2, JobStartupRunner ×1 |
| 修改文件 | 10 | 聚合 POM / sw-basic POM / bootstrap POM / application.yml ×2 / AutoConfiguration / JobInfoService 接口+实现 / JobLogService 接口+实现 |
| 删除文件 | 2 | 旧 AutoConfiguration、旧 package-info |
| 测试文件 | 3 | JobInfoControllerTest (~27) + JobLogControllerTest (~5) + JobFacadeImplTest (~5) |
| 数据库表 | 2 | `sw_job_info` + `sw_job_log`（Flyway V17） |

### 7.2 前端产出（F1–F3，共 3 个 Step）

| 类别 | 数量 | 明细 |
|------|:--:|------|
| 新建文件 | 8 | contracts/job.ts, api/index.ts, api/index.spec.ts, views/JobList.vue, views/JobList.spec.ts, views/JobLog.vue, views/JobLog.spec.ts, views/JobLog.no-id.spec.ts |
| 修改文件 | 2 | seeds.ts (+312), handlers.ts (+231) |
| 组件 | 2 | JobList (~527 行, 15 测试), JobLog (~255 行, 6 测试) |
| 测试 | 34 | F1: 13 (API) + F2: 21 (视图) |

## 8. 决策记录

| # | 日期 | 决策 | 原因 |
|---|------|------|------|
| D22 | 2026-07-20 | Entity 放 -biz 模块（非 -api） | 与 storage 模式一致；-api 不依赖 MyBatis-Plus |
| D23 | 2026-07-20 | Quartz 版本由 Spring Boot BOM 管理 | 避免版本冲突，利用 Spring Boot 官方兼容性测试 |
| D24 | 2026-07-20 | Flyway V17 先建两张表（job_info + job_log） | 宽度优先；后续可能新增配置表延后 |

---

> 最后更新：2026-07-21
> 当前状态：**COMPLETED** ✅ — 全部 7 个 Step 通过验收
> 后端全量测试：✅ 406 tests（26 个测试文件）
> 前端全量测试：✅ 471 tests（54 spec files）
> 全功能闭环：B1 → B2 → B3 → B4 → F1 → F2 → F3 全部 PASSED
