# Step 4 探索摘要 — M04-F06 流程监控页面

当前模型：**deepseek-v4-pro（DeepSeek 系）**，可承担角色：探索模型（按 system.md §0.4 模型族对照表判定）。

---

## 1. M04-F06-01 需求定义

来源：`Smart-WorkFlow/功能清单.md` L107

| ID | 功能 | 详情 | 描述 | 状态 |
|----|------|------|------|:---:|
| M04-F06-01 | 流程监控 | 跟踪 | **流程图实时高亮、流转记录、耗时分析、流程干预** | ⬜ |

四项子能力：

| 子能力 | 含义 | 复杂度 |
|--------|------|:---:|
| 流程图实时高亮 | 在 BPMN 图上高亮当前活跃节点（绿色）、已完成节点（灰色）、已走过的连线 | 中（依赖 bpmn-js highlight API + 后端活动节点查询） |
| 流转记录 | 展示流程实例的审批链路时间线（谁在哪个节点什么时候做了什么操作） | 低（`BpmTaskFacade.queryHistoryByProcessInstance` 已就绪） |
| 耗时分析 | 展示各节点耗时、整体耗时 | 中（需计算各节点 startTime→endTime 差值） |
| 流程干预 | 终止/挂起/激活运行中的流程实例 | 高（涉及 Flowable `RuntimeService.deleteProcessInstance`/`suspendProcessInstanceById`/`activateProcessInstanceById`，需新增 Facade 方法 + Controller 端点 + 权限校验） |

---

## 2. 后端已有能力

### 2.1 已就绪（可直接复用）

| 能力 | 位置 | 说明 |
|------|------|------|
| 流程定义 BPMN XML | `BpmProcessDefController.getBpmnXml()` → `GET /workflow/defs/{id}/bpmn-xml` | Step 2 产物，已 PASSED |
| 审批历史查询 | `BpmTaskFacade.queryHistoryByProcessInstance(processInstanceId)` | 返回 `List<BpmTaskDTO>`（含 taskId/name/assignee/createTime/endTime），已用于 TaskDetail 的 approvalHistory |
| 流程是否活跃 | `BpmTaskFacade.isProcessActive(processInstanceId)` | 已用于 `BpmTodoController.complete()` 判断流程结束 |
| 流程变量查询 | `BpmTaskFacade.getVariables(processInstanceId)` / `getVariable(...)` | 已就绪 |
| 实例记录 | `BpmInstance` 实体 + `BpmInstanceService` | 含 processInstanceId/processDefKey/businessKey/formKey/initiatorId/status |
| Flowable RuntimeService | `BpmTaskFacadeImpl` 已注入 | 可查询活动 ProcessInstance、ActiveActivity |
| Flowable HistoryService | `BpmTaskFacadeImpl` 已注入 | 可查询 HistoricProcessInstance、HistoricActivityInstance |

### 2.2 需要新增（后端 Step）

| 缺口 | 说明 | 难度 |
|------|------|:---:|
| **流程实例列表端点** | `GET /workflow/instances` — 分页查询运行中/已完成的流程实例。`BpmInstanceService` 无 `listInstances()` 方法。需从 `sw_bpm_instance` + Flowable Runtime/History 联合查询 | 低 |
| **流程实例详情端点** | `GET /workflow/instances/{processInstanceId}` — 返回实例基本信息 + 当前活跃节点 ID 列表（供前端高亮流程图） | 中 |
| **活动节点查询** | Flowable `RuntimeService.getActiveActivityIds(processInstanceId)` 可获取当前活跃节点；`HistoryService.createHistoricActivityInstanceQuery()` 可获取已完成节点 | 中 |
| **流程干预端点** | `POST /workflow/instances/{id}/terminate`、`/suspend`、`/activate` — 调用 Flowable RuntimeService 干预 | 中 |
| **BpmRuntimeFacade 扩展** | 当前仅有 `startProcess`，需新增 `getActiveActivityIds`、`terminateInstance`、`suspendInstance`、`activateInstance`、`queryInstances`、`getHistoricActivities` | 高（接口契约设计） |
| **Facade 实现** | `BpmRuntimeFacadeImpl` 需实现上述新方法，封装 Flowable API | 中 |

### 2.3 关键 Flowable API（服务端已有访问路径）

```java
// 获取活动节点 ID（流程图高亮用）
runtimeService.getActiveActivityIds(processInstanceId);  // → List<String>

// 查询运行中/已完成的流程实例
runtimeService.createProcessInstanceQuery()...
historyService.createHistoricProcessInstanceQuery()...

// 查询已完成的 activity 实例（流转记录用）
historyService.createHistoricActivityInstanceQuery()
    .processInstanceId(processInstanceId)
    .finished()
    .orderByHistoricActivityInstanceEndTime().asc()
    .list();

// 干预操作
runtimeService.deleteProcessInstance(processInstanceId, reason);  // 终止
runtimeService.suspendProcessInstanceById(processInstanceId);     // 挂起
runtimeService.activateProcessInstanceById(processInstanceId);    // 激活
```

这些 Flowable API 均在 `BpmTaskFacadeImpl` 所在模块（`sw-bpm-engine`）可以直接调用。

### 2.4 模块边界

- `BpmRuntimeFacade` 定义于 `sw-bpm-api`，实现于 `sw-bpm-engine`
- `BpmTaskFacade` 同上
- `BpmTodoController` 在 `sw-bpm-process`，通过 Facade 接口间接使用 Flowable
- 新增端点应放在 `sw-bpm-process` 的 Controller 中，Facade 方法定义在 `sw-bpm-api`，实现在 `sw-bpm-engine`

---

## 3. 前端已有能力

### 3.1 已就绪（可直接复用）

| 能力 | 位置 | 说明 |
|------|------|------|
| BPMN viewer 防腐层 | `adapters/bpmn/index.ts` | `mountBpmnViewer(container, xml)` + `highlight(nodeId)` / `clearHighlight()` — Step 1 产物 |
| 流程图弹窗模式 | `ProcessDefList.vue` | el-dialog 中渲染 BPMN viewer 的完整模式（Step 3 产物） |
| 流程定义 XML 获取 | `getProcessDefGraph(id)` → `GET /workflow/defs/{id}/bpmn-xml` | Step 3 新增 |
| 页型 B 模板 | `StandardListTemplate` | 列表页标准模板 |
| 待办/已办列表模式 | `TodoList.vue` / `ProcessedList.vue` | 分页 + loading/error/empty 状态管理 + 表格行点击导航 |
| 任务详情页 | `TaskDetail.vue` | 审批历史展示（`approvalHistory`）模式可复用 |
| BPM 类型定义 | `contracts/bpm.ts` | `TodoTask`/`TaskDetail`/`ApprovalHistoryItem`/`ProcessedTask`/`ProcessDef` |
| Mock 系统 | `foundation/mock/` | `MockRegistration` 模式，含已有 `/workflow/defs/:id/bpmn-xml` mock |
| 路由系统 | 动态 `buildRoutesFromMenu(menu)` + 静态 child routes | 新增路由可走静态 child route 或后端菜单 |

### 3.2 需要新增（前端 Step）

| 缺口 | 说明 |
|------|------|
| `ProcessInstance` 类型 | `contracts/bpm.ts` 中新增：processInstanceId/processDefKey/processName/businessKey/initiatorId/startTime/endTime/status/duration |
| 流程实例列表 API | `api/index.ts` 新增：`queryInstances(page)` → `GET /workflow/instances` |
| 流程实例详情 API | `api/index.ts` 新增：`getInstanceDetail(processInstanceId)` → `GET /workflow/instances/{id}`，含 activeActivityIds + flowTrace |
| 流程干预 API | `api/index.ts` 新增：`terminateInstance`/`suspendInstance`/`activateInstance` |
| Mock handlers | `handlers.ts` 新增对应 mock |
| 监控页面视图 | `views/ProcessMonitor.vue`（新建）— 或 `ProcessInstanceList.vue` |
| 路由注册 | 静态 child route 或后端菜单项 |
| BPMN 高亮逻辑 | 在监控页面中消费 `highlight(nodeId)` / `clearHighlight()` API |

---

## 4. 与 bpmn-adapter 的关系

bpmn-adapter 原始范围（探索摘要 §7.1）已将 Step 4 定义为 "M04-F06 流程监控（流程图实时高亮、流转记录）——消费 adapter 的事件回调"。但实际 M04-F06 的完整范围（4 项子能力）远超一个 Step 能容纳的工作量。

### 4.1 建议：M04-F06 作为独立功能

| 考量 | 结论 |
|------|------|
| bpmn-adapter 原始目标 | Steps 1-3 已将 adapter 防腐层实现 + 后端端点 + 前端入口全部交付，"BPMN adapter 查看器实现"本身已闭环 |
| M04-F06 规模 | 需 2-3 个后端 Step + 1-2 个前端 Step，总计 3-5 个 Step |
| 知识库追踪 | 作为独立功能更清晰，`knowledge/features/process-monitoring.md` 独立追踪 |

**建议**：bpmn-adapter Steps 0-3 视为已完成的功能（可进入阶段三收尾），M04-F06 作为**新功能**启动，bpmn-adapter 的 Step 4 占位符标记为 `SUPERSEDED`（由独立功能承接）。

### 4.2 Step 拆分建议（方向性，规划模型最终裁定）

按前后端分离约束，建议至少拆：

| Step | 项目 | 内容 | 复杂度 |
|------|------|------|:---:|
| Step 1 | 后端 | `BpmRuntimeFacade` 扩展 + `BpmInstanceController` 流程实例 CRUD（列表 + 详情 + activeActivityIds + flowTrace） | 🟡 Pro |
| Step 2 | 后端 | 流程干预端点（terminate/suspend/activate）+ 权限校验 | 🟡 Pro |
| Step 3 | 前端 | 流程监控页面：实例列表 + 详情抽屉（流程图高亮 + 流转时间线 + 耗时展示） | 🟢 Flash |

> Step 1 和 Step 2 可以合并（如果后端代理能力足够）或分开（降低单 Step 复杂度）。规划模型最终裁定。

---

## 5. 关键设计决策点（规划模型裁决）

| # | 决策点 | 选项 |
|---|--------|------|
| D1 | M04-F06 作为独立功能还是 bpmn-adapter Step 4？ | A: 新功能 `process-monitoring`；B: 继续作为 bpmn-adapter Step 4 |
| D2 | 监控页面布局 | A: 列表页 + 侧边抽屉（类似 TaskDetail）；B: 左右分栏（列表 + 流程图常驻） |
| D3 | BPMN XML 来源（监控场景需 processInstanceId 对应流程的 XML） | A: 通过 `processDefId` 复用现有 `GET /workflow/defs/{id}/bpmn-xml`；B: 新增 `/workflow/instances/{id}/bpmn-xml`（一步拿到） |
| D4 | 流程图高亮数据 | A: 后端返回 activeNodeIds + completedNodeIds 两个列表；B: 后端返回带状态的节点列表 |
| D5 | 流程干预的权限控制 | A: 复用现有权限（无额外注解，与列表页一致）；B: 新增 `bpm:instance:manage` 权限码 |
| D6 | bpmn-adapter 的收尾时机 | A: 现在对 Steps 0-3 做阶段三收尾，Step 4 占位为 SUPERSEDED；B: 等 M04-F06 全部完成后再对 bpmn-adapter 整体收尾 |

---

## 6. 前端页面模式参照

已有可参照的模式：

| 页面 | 模式 | M04-F06 适用点 |
|------|------|----------------|
| `ProcessDefList.vue` | 列表 + 弹窗查看流程图（当前 Step 3） | 单个流程实例查看流程图时复用弹窗模式 |
| `TodoList.vue` | 列表 + 行点击导航 | 实例列表的行点击行为 |
| `TaskDetail.vue` | 详情页含审批历史（approvalHistory） | 流转记录展示模式 |

无现有页面使用「列表 + 侧边抽屉」或「左右分栏」模式，需新设计。

---

## 7. 决策建议摘要（供规划模型快速消费）

- **D1**：建议 A — M04-F06 作为独立功能启动，bpmn-adapter Steps 0-3 做阶段三收尾。理由：M04-F06 是独立的功能清单明细项，bpmn-adapter 是防腐层基础设施，二者定位不同；bpmn-adapter 的原始目标已通过 Steps 0-3 达成。
- **D2**：建议 A — 列表页 + 侧边抽屉（`el-drawer`）。理由：Element Plus 内置组件，项目有 `el-dialog` 使用经验（ProcessDefList.vue），`el-drawer` 语义更匹配监控详情（侧边面板查看流程图 + 流转记录）。
- **D3**：建议 A — 复用现有端点，前端先查实例获取 `processDefKey` → 再查 `GET /workflow/defs` 获取 `defId` → 再调 `GET /workflow/defs/{id}/bpmn-xml`。不新增后端端点。不足：两次请求。
- **D4**：建议 A — `activeNodeIds: string[]` + `completedNodeIds: string[]`。前端调用 `highlight(nodeId)` 循环即可。
- **D5**：建议 A — 与列表页查看权限保持一致，不新增权限码。流程干预是属于监控页面的操作能力，非新权限域。
- **D6**：建议 A — 现在对 bpmn-adapter Steps 0-3 做阶段三收尾。bpmn-adapter 的防腐层目标已达成，M04-F06 作为独立功能推进。

---

## 8. 完成后的分工提醒

本摘要由探索模型（deepseek-v4-pro）产出。按 system.md §0.4 硬约束：**DeepSeek 系模型可承担探索模型和规划模型两种角色，但同一次任务中不可兼任**。

下一步应由**规划模型**（同一模型但独立调用）读取本摘要，按 system.md §3.1 阶段一步骤 10-12 生成 Step 方案。规划模型不应直接读取完整代码或 `product/`/`done/`/`todo/` 原始记录，只消费本摘要 + `knowledge/`。
