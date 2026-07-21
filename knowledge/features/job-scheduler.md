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
| B3 | Controller + Facade | 后端 | **READY** |
| B4 | Controller 测试 + 全量回归 | 后端 | PENDING |
| F1 | Types + API + Specs | 前端 | PENDING |
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

### Step B3 — Controller + Facade（READY）

- **方案**：`product/job-scheduler/ready/step-B3-controller-facade.md`
- **状态**：READY — 方案已生成，可交付执行
- **验收标准数**：12
- **关键产出**：
  - 5 新建文件（JobFacade 接口 + JobFacadeImpl + JobInfoController + JobLogController + JobStartupRunner）
  - 2 追加修改（JobLogService 接口新增 page 方法 + JobLogServiceImpl 实现）
  - 0 修改 AutoConfiguration（ComponentScan 已覆盖所有新包）

## 6. 测试基线

| 项目 | 当前基线 | 目标 |
|------|:------:|:----:|
| 后端测试 | 166 tests（B1 验收基线，B2 无新增测试文件） | 不减少 |
| 前端测试 | 50 files / 438 tests | 不减少 |

## 7. 决策记录

| # | 日期 | 决策 | 原因 |
|---|------|------|------|
| D22 | 2026-07-20 | Entity 放 -biz 模块（非 -api） | 与 storage 模式一致；-api 不依赖 MyBatis-Plus |
| D23 | 2026-07-20 | Quartz 版本由 Spring Boot BOM 管理 | 避免版本冲突，利用 Spring Boot 官方兼容性测试 |
| D24 | 2026-07-20 | Flyway V17 先建两张表（job_info + job_log） | 宽度优先；后续可能新增配置表延后 |

---

> 最后更新：2026-07-21
> 当前 Step：B3（READY，方案已生成）
