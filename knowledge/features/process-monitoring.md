# 功能追踪：process-monitoring

> 工作区统一知识库 — 单功能规划与追踪。
> 本文件跟踪一个功能的完整生命周期：规划 → Step 执行 → 测试 → 验收 → 完成。
>
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED
>
> ⚠️ **2026-08-14 角色制上线**：本文件中的"推荐模型/实际模型"字段为当时执行事实，仅作历史存档；当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | M04-F06-01 |
| 功能名称 | 流程监控（首批：流程图实时高亮 + 流转记录） |
| 功能目标 | 提供流程实例监控页面：列表查看运行中/已完成实例，在流程图上高亮活跃节点/已完成节点，展示审批流转时间线 |
| 创建日期 | 2026-07-26 |
| 当前状态 | **COMPLETED** ✅（Steps 0-3 PASSED，阶段三收尾完成，2026-07-30） |
| 涉及模块 | 后端 `sw-bpm`（新增 `BpmRuntimeFacade` 方法 + `BpmInstanceController`）；前端 `Smart-WorkFlow-Web/src/modules/workflow/`（新建 `ProcessInstanceList.vue`） |
| 前置依赖 | [[bpmn-adapter]] Steps 0-3 COMPLETED（查看器防腐层 + 后端 BPMN XML 端点 + ProcessDefList 查看入口） |

---

## 2. 需求分析

### 2.1 功能目标（首批范围）

按 [[decisions]] 待定裁决：M04-F06-01 完整范围含 4 项子能力（流程图实时高亮、流转记录、耗时分析、流程干预），本批次仅实现前两项：

1. **流程图实时高亮**：在流程监控页面，对运行中/已完成的流程实例，在 BPMN 图上高亮活跃节点（绿色）、已完成节点（灰色）
2. **流转记录**：展示流程实例的审批时间线——谁在哪个节点什么时候做了什么操作

### 2.2 非目标（首批明确排除）

- 不实现耗时分析（各节点/整体耗时统计）——后续批次
- 不实现流程干预（终止/挂起/激活运行中实例）——后续批次
- 不新增 BPMN XML 获取端点（复用 `GET /workflow/defs/{id}/bpmn-xml`，Step 2 产物）
- 不修改 `BpmDeployFacade` / `BpmTaskFacade` 已有方法

### 2.3 影响范围

| 维度 | 详情 |
|------|------|
| 后端模块 | `sw-bpm-api`（Facade 接口扩展 + DTO）+ `sw-bpm-engine`（Facade 实现）+ `sw-bpm-process`（Service 增强 + Controller 新建） |
| 前端模块 | `contracts/bpm.ts`（新类型）+ `modules/workflow/api/index.ts`（新 API 函数）+ `modules/workflow/views/ProcessInstanceList.vue`（新建）+ `foundation/mock/handlers.ts`（新 mock） |
| 数据库表 | 无 DDL 变更（复用 `sw_bpm_instance` + Flowable `ACT_HI_*` 表） |
| API 端点 | 新增 `GET /workflow/instances`（分页列表）+ `GET /workflow/instances/{processInstanceId}`（详情含 activeNodes + flowTrace） |
| 前端路由 | 新增 `workflow/instances` → `ProcessInstanceList.vue`（静态 child route） |

### 2.4 依赖和风险

| 类型 | 描述 |
|------|------|
| 前置条件 | [[bpmn-adapter]] Steps 0-3 COMPLETED（查看器防腐层 + BPMN XML 端点 + ProcessDefList 查看入口）；Flowable RuntimeService/HistoryService 已在 `BpmTaskFacadeImpl` 中注入使用 |
| 技术风险 | Flowable `getActiveActivityIds()` 返回的是 Flowable 内部 activity ID（如 `Activity_0kx10is`），与 BPMN XML 中的 `bpmnElement` 属性对齐，需验证 ID 一致性 |
| 阻塞项 | 无 |

---

## 3. Step 列表

| Step | 名称 | 状态 | 推荐模型 | 执行回执 | 测试回执 | 验收结论 |
|------|------|:---:|:---:|:---:|:---:|:---:|
| 0 | M04-F06 流程监控需求与现状探索 | **PASSED** | DeepSeek 系（deepseek-v4-pro） | 不适用（探索类） | 不适用 | 探索摘要已产出（`product/bpmn-adapter/step-4-exploration-summary.md`），范围裁定为首批 2/4 能力 |
| 1 | 后端 Facade + Service 层：查询流程实例、活跃节点、流转记录 | **PASSED** ✅ | deepseek-v4-flash | `product/process-monitoring/receipts/step-1-execution.md` | 待测试（执行回执先到） | 2026-07-28 执行回执审查通过：15 项验收标准逐条对照，14/14 满足（#14 pom.xml 偏离为方案缺陷所致）。grep 零 Flowable 泄漏；8+7=15 @Test；项目级 241→256 tests。4 项方案偏离均评估为可接受。pom.xml +5 行 H2 为方案自相矛盾（要求 @SpringBootTest + 禁止改 pom.xml）所致，非执行代理擅自扩大范围 |
| 2 | 后端 Controller 层：`BpmInstanceController` REST 端点 + 测试 | **PASSED** ✅ | deepseek-v4-flash | `product/process-monitoring/receipts/step-2-execution.md` | `product/process-monitoring/receipts/step-2-test.md` | 2026-07-28 独立验收审查通过：14/14 标准全部满足。4 新建文件，6 @Test 全通，全量 465 tests 零退化。Controller 零 Flowable import。路由不冲突。pom.xml/Flyway 未修改。Step 1 sw-bpm-api 未 mvn install 导致单模块 -pl 运行失败（已确认根因非代码缺陷） |
| 3 | 前端 ProcessInstanceList 监控页面 + 流程图高亮 + 流转时间线 | **PASSED** ✅ | deepseek-v4-flash | `product/process-monitoring/receipts/step-3-execution.md` | `product/process-monitoring/receipts/step-3-test.md` | 2026-07-28 独立验收审查通过：16/16 标准全部满足。7 文件（2 新建 + 5 修改），pnpm lint 零错误，pnpm test 60f/521t 全绿，pnpm build 成功。ProcessInstanceList.vue 464 行 + spec 228 行 / 4 tests |

> Step 0 探索摘要存档于 `product/bpmn-adapter/step-4-exploration-summary.md`（共用 bpmn-adapter 目录）。
> Step 1 正式方案写入 `product/process-monitoring/ready/step-1-backend-facade-service.md`。

---

## 4. 测试验收汇总（功能完成后填写）

| Step | 测试总数 | 通过 | 失败 | 跳过 | 验收结论 |
|------|:---:|:---:|:---:|:---:|:---:|
| 1 | 15 | 15 | 0 | 0 | **PASSED**（2026-07-28 执行回执审查通过） |
| 2 | 6 | 6 | 0 | 0 | **PASSED**（2026-07-28 独立验收审查通过） |
| 3 | 4 | 4 | 0 | 0 | **PASSED**（2026-07-28 独立验收审查通过） |

---

## 5. 功能完成检查清单

- [x] 所有 Step 均已 PASSED
- [x] 已更新 `knowledge/current-status.md`
- [x] 已更新 `knowledge/decisions.md`（D43：首批范围裁定 + D44：el-drawer 选择 + D45：defKey→defId 映射策略 + D46：completedNodeIds 推导策略）
- [x] 已更新 `knowledge/known-issues.md`（无新增已知问题，现有 I3 BPMN 部分随 bpmn-adapter 完成已修复）
- [x] 已生成交接摘要 → `knowledge/session-handoff.md`
- [x] 已标注功能清单中 M04-F06-01 状态

---

## 6. 实际修改范围

### 后端（Smart-WorkFlow-Server/）— Steps 1-2

| 文件 | Step | 操作 | 摘要 |
|------|:---:|:---:|------|
| `sw-bpm-api/.../BpmRuntimeFacade.java` | 1 | 修改 | +3 方法签名（queryInstances / getInstanceDetail / pageProcessDefs） |
| `sw-bpm-api/.../dto/InstanceQueryDTO.java` | 1 | 新建 | 查询参数 DTO（status / processDefKey / initiatorId 过滤） |
| `sw-bpm-api/.../dto/InstanceListItemDTO.java` | 1 | 新建 | 列表项 DTO（精简字段，含 activeNodeIds） |
| `sw-bpm-api/.../dto/InstanceDetailDTO.java` | 1 | 新建 | 详情 DTO（extends InstanceListItemDTO，含 flowTrace） |
| `sw-bpm-api/.../dto/ActivityNodeDTO.java` | 1 | 新建 | 流转节点 DTO（activityId / activityName / activityType / startTime / endTime / assignee / taskId） |
| `sw-bpm-engine/.../BpmRuntimeFacadeImpl.java` | 1 | 修改 | +3 方法实现：分页查询（RuntimeService.createProcessInstanceQuery + HistoryService.createHistoricProcessInstanceQuery）、详情（含 getActiveActivityIds + HistoricActivityInstance 查询）、defKey→defId 映射 |
| `sw-bpm-process/.../BpmInstanceService.java` | 1 | 修改 | +2 接口方法（queryInstances / getInstanceDetail） |
| `sw-bpm-process/.../BpmInstanceServiceImpl.java` | 1 | 修改 | +2 实现（委托 Facade，零 Flowable import） |
| `sw-bpm-process/.../BpmInstanceController.java` | 2 | 新建 | REST 控制器：GET /workflow/instances + GET /workflow/instances/{processInstanceId}，6 @Test |
| `sw-bpm-api/.../BpmErrorCode.java` | 1 | 修改 | +1 错误码 2105（INSTANCE_NOT_FOUND） |
| `sw-bpm-process/pom.xml` | 1 | 修改 | +5 行 H2 依赖（方案缺陷：要求 @SpringBootTest 但禁止改 pom.xml，矛盾所致） |

### 前端（Smart-WorkFlow-Web/）— Step 3

| 文件 | 操作 | 摘要 |
|------|:---:|------|
| `src/contracts/bpm.ts` | 修改 | +30 行：ProcessInstance / ActivityNode / InstanceDetail 接口 |
| `src/modules/workflow/api/index.ts` | 修改 | +36 行：queryInstances / getInstanceDetail 函数 |
| `src/foundation/mock/seeds.ts` | 修改 | +157 行：MOCK_INSTANCES（6 条）+ MOCK_INSTANCE_DETAILS（6 条） |
| `src/foundation/mock/handlers.ts` | 修改 | +110 行：增强 BPMN XML handler + 2 个实例 mock handler |
| `src/router/index.ts` | 修改 | +6 行：/workflow/instances → ProcessInstanceList 路由 |
| `src/modules/workflow/views/ProcessInstanceList.vue` | **新建** | 464 行：监控页面组件（列表 + el-drawer 详情 + 流程图高亮 + 流转时间线） |
| `src/modules/workflow/views/__tests__/ProcessInstanceList.spec.ts` | **新建** | 228 行 / 4 tests |

### 测试统计

| Step | 新增测试 | 全量基线 |
|:---:|:---:|:---:|
| 1 | 15（8 Facade + 7 Service） | 后端 465 tests |
| 2 | 6（Controller） | 后端 465 tests |
| 3 | 4（前端） | 前端 60f/521t |

---

## 7. 遗留问题

| # | 问题 | 严重程度 | 说明 |
|---|------|:--------:|------|
| 1 | ActivityNode.activityName 接口定义为 `string`（非 `string | null`），但后端 sequenceFlow 节点返回 null | 低 | 当前 TypeScript 接口与后端实际数据语义不完全对齐。运行时无影响（模板使用 `?? '-'` 兜底），但严格类型安全角度看应改为 `string \| null` |
| 2 | BPMN XML handler 增强后 ProcessDefList「查看流程图」渲染更复杂图表 | 低 | 不影响功能（ProcessDefList 查看器不调用 highlight），但视觉效果与之前最简 XML 不同 |
| 3 | 耗时分析 + 流程干预延后至后续批次 | — | M04-F06-01 完整范围含 4 项子能力，本批次仅实现前两项（流程图高亮 + 流转记录） |
| 4 | Steps 1-3 文件均未 commit | 中 | 8 后端 + 2 前端文件（共 10 个）untracked/uncommitted。需后续 git commit |
