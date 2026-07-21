# Job Scheduler — 定时任务调度模块

> 功能编号：job-scheduler
> 功能名称：定时任务调度模块（Quartz 单节点 / BEAN + FLOW 双类型 / 前后端闭环）
> 对应功能清单：M10-F03-01 定时任务 > 任务调度
> 创建时间：2026-07-20
> 当前状态：**IN_PROGRESS**

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
| F1 | Types + API + Specs | 前端 | **READY** 📋 |
| F2 | Vue 视图（JobList + JobLog） | 前端 | PENDING |
| F3 | Mock + Handlers + 路由 | 前端 | PENDING |

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

### Step F1 — Types + API + Specs（READY 📋）

- **方案**：`product/job-scheduler/ready/step-F1-types-api-specs.md`
- **状态**：READY 📋 — 2026-07-21 方案已生成
- **方案内容**：3 新建文件（合约 `src/contracts/job.ts` + API `src/modules/job/api/index.ts` + 测试 `src/modules/job/api/index.spec.ts`）
- **验收标准数**：14 项
- **推荐模型**：deepseek-v4-flash
- **关键产出预期**：
  - 合约：2 接口（JobInfo + JobLog）+ 4 字符串字面量联合类型（JobStatus/JobType/ExecStatus/TriggerType）
  - API：10 个 API 函数（8 JobInfo + 2 JobLog），分页用 adaptPage 适配
  - 测试：13 个 Vitest 用例，mock request 模式
  - 0 修改已有文件

## 6. 测试基线

| 项目 | 当前基线 | 目标 |
|------|:------:|:----:|
| 后端测试 | 406 tests / 26 个测试文件（B4 后，含 job 模块 3 文件） | 新增 3 个测试文件，37 个测试用例 |
| 前端测试 | 50 files / 438 tests | 不减少 |

## 7. 决策记录

| # | 日期 | 决策 | 原因 |
|---|------|------|------|
| D22 | 2026-07-20 | Entity 放 -biz 模块（非 -api） | 与 storage 模式一致；-api 不依赖 MyBatis-Plus |
| D23 | 2026-07-20 | Quartz 版本由 Spring Boot BOM 管理 | 避免版本冲突，利用 Spring Boot 官方兼容性测试 |
| D24 | 2026-07-20 | Flyway V17 先建两张表（job_info + job_log） | 宽度优先；后续可能新增配置表延后 |

---

> 最后更新：2026-07-21
> 当前 Step：F1（READY 📋 — 方案已生成，待执行）
> 后端全量测试：✅ 406 测试全部通过
> 下一步：执行 F1 — Types + API + Specs（前端）
