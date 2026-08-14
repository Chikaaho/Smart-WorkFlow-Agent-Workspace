# BPM 待办中心增强

> 工作区统一知识库 — 功能追踪文件。
> 本文件记录 BPM 待办中心增强的完整规划、Step 状态和测试结果。
> ⚠️ **2026-08-14 角色制上线**：本文件中的"推荐模型/实际模型"字段为当时执行事实，仅作历史存档；当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。

---

## 功能摘要

| 项目 | 内容 |
|------|------|
| **功能编号** | bpm-task-center — BPM 待办中心增强 |
| **功能名称** | BPM 待办中心增强：分页 + 任务详情 + 驳回 + 已办 |
| **功能目标** | 将 BPM 模块从「仅能看任务标题+点通过」增强到「可查看任务详情+表单内容+驳回+查看已办历史」的最低可用闭环 |
| **当前状态** | **COMPLETED** ✅ — B1+B2+B3+F1+F2+F3 全部通过验收 |
| **总 Step 数** | 6（B1~B3 后端 + F1~F3 前端） |
| **推荐模型** | `deepseek-v4-flash`（全部 6 个 Step） |

---

## Step 状态

| Step | 内容 | 状态 | 方案 | 回执 | 验收 |
|:----:|------|:----:|:----:|:----:|:----:|
| B1 | 后端 — 待办分页 + 任务详情端点 | **PASSED** ✅ | `passed/` | `receipts/` ✅ | 2026-07-17 10/10 |
| B2 | 后端 — 驳回端点 + 已办列表 + 审批历史 | **PASSED** ✅ | `passed/` | `receipts/` ✅ | 2026-07-17 13/13 |
| B3 | 后端 — Controller 测试 + 全量验证 | **PASSED** ✅ | `passed/` | `receipts/` ✅ | 2026-07-17 14/14 |
| F1 | 前端 — Types + API + Specs | **PASSED** ✅ | `passed/` | `receipts/` ✅ | 2026-07-17 13/13 |
| F2 | 前端 — Vue 视图（TodoList增强 + TaskDetail + ProcessedList） | **PASSED** ✅ | `passed/` | `receipts/` ✅ | 2026-07-17 15/15 |
| F3 | 前端 — Mock + Handlers + 路由 | **PASSED** ✅ | `passed/` | `receipts/` ✅ | 2026-07-19 13/13 |

---

## B1 验收详情

| 编号 | 条件 | 结果 |
|:----:|------|:----:|
| B1-1 | `BpmTaskFacade` 含 `queryTodoPage(String, String, int, int)` | ✅ 行 37 |
| B1-2 | `BpmTaskFacade` 含 `countTodo(String, String)` | ✅ 行 46 |
| B1-3 | `BpmTaskFacade` 含 `getVariables(String)` | ✅ 行 103 |
| B1-4 | `BpmTaskFacadeImpl` 使用 `TaskQuery.listPage(offset, limit)` | ✅ 行 85 |
| B1-5 | `BpmTodoController.todo()` 接受 `PageParam` → `R<PageResult<TodoTaskRespDTO>>` | ✅ 行 97 |
| B1-6 | `BpmTodoController` 含 `@GetMapping("/{taskId}")` | ✅ 行 214 |
| B1-7 | `TodoTaskRespDTO` 含 `processName` 字段 | ✅ 行 24 |
| B1-8 | `TaskDetailRespDTO.java` 新建含 11 字段 | ✅ 1006 字节 |
| B1-9 | `BpmProcessDefService` 含 `findByProcessKey(String)` | ✅ 行 22 |
| B1-10 | `mvn -q compile` 退出码 0 | ✅ 执行回执确认 |

**偏差**：
- `BpmProcessDefServiceImpl.findByProcessKey` 使用 `mapper.selectOne(LambdaQueryWrapper)` — 该类不继承 `BaseServiceImpl`，语义等价
- `TaskDetailRespDTO.processVariables` 使用 `Map<String, Object>` — 对齐 Flowable 返回类型

**修改文件**：7 文件（6 修改 + 1 新建），约 +150 行 / -20 行

---

## B2 验收详情

| 编号 | 条件 | 结果 |
|:----:|------|:----:|
| B2-1 | `BpmTaskDTO` 含 `endTime` 字段（Date 类型） | ✅ L42 |
| B2-2 | `BpmTaskFacade` 含 `queryProcessedPage` 方法签名 | ✅ L114 |
| B2-3 | `BpmTaskFacade` 含 `countProcessed` 方法签名 | ✅ L123 |
| B2-4 | `BpmTaskFacade` 含 `queryHistoryByProcessInstance` 方法签名 | ✅ L131 |
| B2-5 | `BpmTaskFacadeImpl` 注入 `HistoryService` 且使用 `createHistoricTaskInstanceQuery()` | ✅ L32,L5 |
| B2-6 | `BpmTodoController` 含 `@PostMapping("/{taskId}/reject")` 驳回端点 | ✅ L212 |
| B2-7 | `BpmTodoController` 含 `@GetMapping("/processed")` 已办端点 | ✅ L327 |
| B2-8 | `BpmTodoController.reject()` 使用 `InstanceStatusEnum.REJECTED` 更新状态 | ✅ L237 |
| B2-9 | `ProcessedTaskRespDTO.java` 新建含 8 字段 | ✅ |
| B2-10 | `ApprovalHistoryItemDTO.java` 新建含 5 字段 | ✅ |
| B2-11 | `TaskDetailRespDTO` 含 `approvalHistory` 字段 | ✅ L52 |
| B2-12 | `mvn -q compile` 退出码 0 | ✅ 编译通过 |
| B2-13 | 已有 `complete()` 端点行为不变 | ✅ @PostMapping("/{taskId}/complete") L137 未改动 |

**偏差**：
- `HistoricTaskInstance` import 路径修正：`org.flowable.engine.history` → `org.flowable.task.api.history`（方案中包名有误，编译时修正）

**修改文件**：7 文件（5 修改 + 2 新建），编译 0 错误，测试 8/8 通过无回归

---

## B3 验收详情

| 编号 | 条件 | 结果 |
|:----:|------|:----:|
| B3-1 | `BpmTodoControllerTest.java` 新建，测试方法数 ≥ 18 | ✅ 18 @Test |
| B3-2 | `@Nested` 分组含 5 个端点（Todo/Complete/Reject/Detail/Processed） | ✅ 5 @Nested |
| B3-3 | 纯 Mockito（不 import `@SpringBootTest`/`@AutoConfigureMockMvc`/`MockMvc`） | ✅ 零命中 |
| B3-4 | `GET /todo` 覆盖正常分页 + 空列表 + processName 空安全（≥ 2 用例） | ✅ 3 用例 |
| B3-5 | `POST /complete` 覆盖通过+结束+通知 / 通过+未结束(不发通知) / 任务不存在 / 越权（≥ 4 用例） | ✅ 4 用例 |
| B3-6 | `POST /reject` 覆盖驳回+结束+不发通知 / 驳回+未结束 / 任务不存在 / 越权（≥ 4 用例） | ✅ 4 用例 |
| B3-7 | `GET /{taskId}` 覆盖完整详情+审批历史 / 空审批历史 / 任务不存在 / processDef 空安全（≥ 4 用例） | ✅ 4 用例 |
| B3-8 | `GET /processed` 覆盖正常分页含 endTime / 空列表 / endTime 空安全（≥ 3 用例） | ✅ 3 用例 |
| B3-9 | `reject` 测试验证 `complete(taskId, {outcome: REJECTED})` 被调用且 `publish` 未被调用 | ✅ `argThat` + `verifyNoInteractions` |
| B3-10 | `@AfterEach` 中调用 `LoginUserHolder.clear()` | ✅ `tearDown()` |
| B3-11 | `mvn -q compile` 退出码 0（全工程） | ✅ 0 |
| B3-12 | `mvn test` 全工程 BUILD SUCCESS，无 FAILED/ERROR | ✅ 308 tests, 0 failures |
| B3-13 | 全量测试计数 ≥ 154（基线 136 + ≥18 新增），即无已有测试被删除 | ✅ 308 |
| B3-14 | 原有 8 个 BPM 测试（引擎 7 + 流程 1）全部通过 | ✅ 引擎 7 + 流程 19（+18 新） |

**偏差**：
- `@DisplayName` 中内嵌 `"` 字符修正为 `「」`（方案中为 ASCII 双引号，导致 Java 字符串字面量提前终止）
- `createTask()` 中 `processDefinitionKey` 使用 `"skeleton_approval"` 而非 `"skeleton_approval:1:abc123"`（对齐 `getProcessDefinitionKeyFromId` 真实行为）
- `instance.setInitiatorId("1")` → `setInitiatorId(1L)`（对齐 `Long` 类型）

**新建文件**：1 文件（BpmTodoControllerTest.java，460 行，18 测试方法）

---

## F1 验收详情

| 编号 | 条件 | 结果 |
|:----:|------|:----:|
| F1-1 | `contracts/bpm.ts` 中 `TodoTask` 含 `processName: string` | ✅ L5 |
| F1-2 | `contracts/bpm.ts` 中 `TaskDetail` 含 12 字段 | ✅ L13-25 |
| F1-3 | `contracts/bpm.ts` 中 `ApprovalHistoryItem` 含 5 字段 | ✅ L28-34 |
| F1-4 | `contracts/bpm.ts` 中 `ProcessedTask` 含 8 字段 | ✅ L37-46 |
| F1-5 | `api/index.ts` 中 `queryTodoTasks(page: PageQuery)` 分页签名 | ✅ L27 |
| F1-6 | `api/index.ts` 中新增 `queryTaskDetail(taskId)` | ✅ L37 |
| F1-7 | `api/index.ts` 中新增 `rejectTask(taskId)` | ✅ L53 |
| F1-8 | `api/index.ts` 中新增 `queryProcessedTasks(page)` | ✅ L65 |
| F1-9 | `api/index.ts` 中 `completeTask` 不变 | ✅ L45-50 |
| F1-10 | `api/index.spec.ts` 中测试 ≥ 6 | ✅ 6 it( |
| F1-11 | `pnpm test src/modules/workflow/api/index.spec.ts` 6/6 通过 | ✅ 回执 395 tests 全绿 |
| F1-12 | `pnpm test` 全量 ≥ 46 files / ≥ 392 tests | ✅ 46 files / 395 tests |
| F1-13 | `pnpm lint` 零新增告警 | ✅ 二次 lint 零告警 |

**偏差**：无。严格按方案执行，未新增、未遗漏任何改动点。

**修改文件**：3 文件（全部修改），约 +35 行 contracts/bpm.ts + ~44 行 api/index.ts + ~94 行 api/index.spec.ts

---

## F1 方案摘要

| 项目 | 内容 |
|------|------|
| **方案文件** | `product/bpm-task-center/ready/step-f1-前端Types+API+Specs.md` |
| **推荐模型** | `deepseek-v4-flash` |
| **修改文件** | 3 文件（contracts/bpm.ts 扩展类型 + api/index.ts 扩展函数 + api/index.spec.ts 扩展测试） |
| **新增类型** | TaskDetail（12 字段）、ApprovalHistoryItem（5 字段）、ProcessedTask（8 字段） |
| **扩展类型** | TodoTask +processName |
| **新增 API** | queryTaskDetail、rejectTask、queryProcessedTasks |
| **修改 API** | queryTodoTasks：平铺数组 → 分页 PageResult |
| **测试** | 从 3 条扩展到 6 条 |
| **验收标准** | 13 条 |

---

## F3 验收详情

| 编号 | 条件 | 结果 |
|:----:|------|:----:|
| F3-1 | `handlers.ts` 中 `GET /api/workflow/tasks/todo` handler 改为分页（返回 `records/total/pageNum/pageSize`） | ✅ L595-602（query.pageNum / slice / records/total） |
| F3-2 | `handlers.ts` 中新增 `GET /api/workflow/tasks/:taskId` handler（检索 MOCK_TODO_TASKS，返回含 12 字段的 TaskDetail） | ✅ L607-632（12 字段：taskId~approvalHistory） |
| F3-3 | `handlers.ts` 中新增 `POST /api/workflow/tasks/:taskId/reject` handler（splice 移除） | ✅ L653-666 |
| F3-4 | `handlers.ts` 中新增 `GET /api/workflow/tasks/processed` 分页 handler | ✅ L668-680（pageNum/slice/records/total） |
| F3-5 | `seeds.ts` 中 `MOCK_TODO_TASKS` 每条记录含 `processName` 字段（≥ 5 条） | ✅ 10 次出现 |
| F3-6 | `seeds.ts` 中新增 `MOCK_PROCESSED_TASKS`（≥ 3 条），至少 1 条含 `processName: null` 和 `endTime: null` | ✅ 3 条，第 3 条 processName=null + endTime=null |
| F3-7 | `seeds.ts` 菜单树 workflow 目录下新增「已办任务」子菜单 | ✅ processed-list / workflow/processed / ProcessedList |
| F3-8 | `router/index.ts` 中新增 `TaskDetail` 静态路由（path: workflow/task/:taskId, name: 'TaskDetail'） | ✅ L58-62 |
| F3-9 | `router/index.ts` 中新增 `ProcessedList` 静态路由（path: workflow/processed, name: 'ProcessedList'） | ✅ L64-67 |
| F3-10 | `pnpm test` 全量 ≥ 48 files / ≥ 417 tests 全绿 | ✅ 48 files / 417 tests（回执确认） |
| F3-11 | `pnpm lint` 零新增告警 | ✅ 回执确认零告警 |
| F3-12 | `pnpm typecheck` 零错误 | ✅ 回执确认零错误 |
| F3-13 | `pnpm build` 构建成功 | ✅ 回执确认构建成功 |

**偏差**：无。严格按方案执行，3 文件（全部修改），所有校验命令零问题。

**修改文件**：3 文件 — handlers.ts（~50 行，1 改+3 新 handler）/ seeds.ts（~45 行，processName + MOCK_PROCESSED_TASKS + 菜单树）/ router/index.ts（+14 行，2 静态路由）

---

## F3 方案摘要

| 项目 | 内容 |
|------|------|
| **方案文件** | `product/bpm-task-center/passed/step-f3-前端Mock+Handlers+路由.md` |
| **推荐模型** | `deepseek-v4-flash` |
| **修改文件** | 3 文件（handlers.ts 改造 + seeds.ts 扩建 + router/index.ts 新增路由） |
| **Handler 变更** | todo: 平铺→分页 · 新增 detail/reject/processed |
| **种子变更** | MOCK_TODO_TASKS +processName · 新增 MOCK_PROCESSED_TASKS · 菜单树子项 |
| **路由变更** | 新增 TaskDetail + ProcessedList 静态路由 |
| **测试** | 全量 ≥ 48 files / ≥ 417 tests 不变 |
| **验收标准** | 13 条 |

---

## 范围外
- 流程设计器（BPMN 可视化设计）、转办/委托/加签/抢办、流程图实时高亮
- 催办提醒、会签/或签、"我发起的"页面
- 审批人类型扩展（ROLE/POSITION/MANAGER 等）
- BPMN adapter 实现

---

## F2 验收详情

| 编号 | 条件 | 结果 |
|:----:|------|:----:|
| F2-1 | `TodoList.vue` 中 `queryTodoTasks` 传 `PageQuery` | ✅ L43-44 |
| F2-2 | `TodoList.vue` 操作列含驳回按钮 + `@click.stop` | ✅ L133,219 |
| F2-3 | `TodoList.vue` 表格 `highlight-current-row` + `@row-click` → TaskDetail | ✅ L149,190,192 |
| F2-4 | `TodoList.vue` toolbar-actions 「已办任务」→ ProcessedList | ✅ L167 |
| F2-5 | `TodoList.vue` 无 9999 hack / 无隐藏分页样式 | ✅ pageSize=10 |
| F2-6 | `TaskDetail.vue` 新建，≥10 字段展示 | ✅ 9 desc + 变量 + 历史 |
| F2-7 | `TaskDetail.vue` 审批历史 + 空态「暂无审批历史」 | ✅ L169-177 |
| F2-8 | `TaskDetail.vue` 通过/驳回 + 导航 TodoList | ✅ L68-70,99-101 |
| F2-9 | `ProcessedList.vue` StandardListTemplate + 真分页 | ✅ L46-55,65 |
| F2-10 | `ProcessedList.vue` 6 列 + endTime/processName `?? '-'` | ✅ L103-116 |
| F2-11 | `TodoList.spec.ts` ≥ 9 tests | ✅ 9/9 passed |
| F2-12 | `TaskDetail.spec.ts` ≥ 8 tests | ✅ 9/9 passed |
| F2-13 | `ProcessedList.spec.ts` ≥ 8 tests | ✅ 9/9 passed |
| F2-14 | `pnpm test` 全量 ≥ 48 files / ≥ 415 tests | ✅ 48 files / 417 tests |
| F2-15 | `pnpm lint` 零新增告警 | ✅ lint 二次零告警 |

**追加**：`pnpm typecheck` 0 errors · `pnpm build` SUCCESS

**偏差**：无。严格按方案执行，6 文件（2 修改 + 4 新建），27 条测试全部通过。

**修改文件**：6 文件 — TodoList.vue（~155行，改造）/ TodoList.spec.ts（~200行，更新）/ TaskDetail.vue（~220行，新建）/ TaskDetail.spec.ts（~190行，新建）/ ProcessedList.vue（~110行，新建）/ ProcessedList.spec.ts（~190行，新建）

---

## F2 方案摘要

| 项目 | 内容 |
|------|------|
| **方案文件** | `product/bpm-task-center/ready/step-f2-前端Vue视图.md` |
| **推荐模型** | `deepseek-v4-flash` |
| **修改文件** | 2 文件（TodoList.vue 改造 + TodoList.spec.ts 更新） |
| **新建文件** | 4 文件（TaskDetail.vue + TaskDetail.spec.ts + ProcessedList.vue + ProcessedList.spec.ts） |
| **视图** | TodoList（真分页+驳回+导航）+ TaskDetail（详情+审批历史+操作）+ ProcessedList（已办分页） |
| **测试** | 预计 27 条（TodoList 9 + TaskDetail 9 + ProcessedList 9），2 新 spec 文件 |
| **验收标准** | 15 条 |

---

## 执行日志

| 日期 | 事件 | 详情 |
|------|------|------|
| 2026-07-17 10:53 | B1 方案生成 | deepseek-v4-pro 规划，推荐 flash 执行 |
| 2026-07-17 11:04 | B1 执行回执 | deepseek-v4-flash 执行，7 文件，mvn compile 通过 |
| 2026-07-17 11:20 | B1 验收通过 | 根代理独立验证 10/10 通过 |
| 2026-07-17 11:27 | B2 方案读取 | deepseek-v4-flash 方案就绪，ready/ 中 |
| 2026-07-17 11:32 | B2 执行 + 验收 | 7 文件修改+新建，编译通过，测试 8/8 无回归，13/13 验收标准通过 |
| 2026-07-17 11:45 | B3 方案生成 | 18 测试用例（5×@Nested），纯 Mockito，推荐 deepseek-v4-flash |
| 2026-07-17 15:15 | F1 方案生成 | deepseek-v4-flash 规划，3 文件修改（contracts/bpm.ts + api/index.ts + api/index.spec.ts），13 验收标准
| 2026-07-17 15:47 | F1 执行回执 | deepseek-v4-flash 执行，3 文件修改，pnpm test 46 files / 395 tests 全绿
| 2026-07-17 16:05 | F1 验收通过 | 根代理独立验证 13/13 通过，代码逐条对照确认 |
| 2026-07-17 16:35 | F2 方案生成 | deepseek-v4-flash 规划，6 文件（2 改+4 新建），15 验收标准 |
| 2026-07-17 18:23 | F2 执行回执 | deepseek-v4-flash 执行，6 文件，48 files / 417 tests 全绿，typecheck+build 通过 |
| 2026-07-17 18:30 | F2 验收通过 | 根代理独立验证 15/15 通过，代码逐条对照确认 |
| 2026-07-17 19:00 | F3 方案生成 | deepseek-v4-flash 规划，3 文件（handlers.ts + seeds.ts + router/index.ts），13 验收标准 |
| 2026-07-19 | F3 执行回执 | deepseek-v4-flash 执行，3 文件修改，48 files / 417 tests 全绿，typecheck+lint+build 通过 |
| 2026-07-19 | F3 验收通过 | 根代理独立验证 13/13 通过，代码逐条对照确认 |
| 2026-07-19 | **功能完成** | bpm-task-center 全部 6 步 PASSED，阶段三收尾完成 |
