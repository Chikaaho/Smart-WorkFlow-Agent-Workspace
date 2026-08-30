# P7 / M07-F02-04 图执行历史与运行日志前端可观测闭环

> **方向文档**：`product/agent-graph-execution-observability/passed/direction-agent-graph-execution-observability.md`（D126，2026-08-20）  
> **状态**：READY → COMPLETED  
> **验收结果**：D148 规划层功能级验收 PASSED（D137/D138 为失效历史，D139-D147 为补证迭代）（2026-08-20）

---

## 1. 功能概述

把既有图执行历史、失败分类和节点轨迹查询能力转化为生产可达的前端运行日志闭环，使有权用户能够从图定义上下文定位一次执行、查看结果或失败原因，并沿节点顺序、分支和变量快照追踪执行过程。

**核心交付**：
- `ExecutionList.vue` — 列表页分页展示、graphDefId 过滤
- `ExecutionDetail.vue` — 详情页 input/output/error 信息
- `NodeTrajectory.vue` — 节点轨迹子视图，branchId 识别并行分支
- 路由注册：`/agent/executions/list`, `/agent/executions/detail/:executionId`
- API 补充：`pageGraphExecutionsWithVersion`, `getExecutionDetail`, `listExecutionNodes`

**非目标**：单步调试不在本轮范围内（继续待排期）。

---

## 2. 后端实现验证（零改动）

复用既有 Step12（D70-D71）已实现的三类只读端点：

| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `GET /agent/graph-executions` | page() | agent:model:view | 分页列表（不含 input/output 大字段） |
| `GET /agent/graph-executions/{id}` | detail() | agent:model:view | 详情（含 input/output 大字段） |
| `GET /agent/graph-executions/{id}/nodes` | nodes() | agent:model:view | 节点轨迹（按 nodeSeq 升序） |

**数据库表**（V27/V28 Flyway，H2/PG 双份已落地）：
- `sw_agent_graph_execution` — 执行记录表
- `sw_agent_graph_execution_node` — 节点明细表

**测试基线**：Step12 后端新增 21 用例，项目级从 405→426 tests，全绿无回归。

---

## 3. 前端实现证据

### 3.1 ExecutionList.vue

位置：`Smart-WorkFlow-Web/src/modules/agent/views/ExecutionList.vue`

**关键特性**：
- 从 URL query 获取 `graphDefId` 用于过滤当前图表定义的执行记录
- 分页参数默认 pageNum=1, pageSize=10
- 列表字段：graphName、status、defVersion、latencyMs、createTime
- 大字段（input/output）不塞入列表主查询（符合 D126 §6）
- 错误态显示 errorMsg，空态由 StandardListTemplate 处理

**验收标准映射**：D126-01(分页加载) ~ D126-09(权限控制)，专项测试文件 `ExecutionList.spec.ts`（20 个 it 用例）逐条覆盖。

### 3.2 ExecutionDetail.vue

位置：`Smart-WorkFlow-Web/src/modules/agent/views/ExecutionDetail.vue`

**关键特性**：
- 路由参数 `executionId` 加载单次执行完整信息
- 折叠展开控制：输入内容/输出内容（防长文本卡顿）
- 安全渲染：❌ 无 v-html；✅ Vue 自动转义插值表达式；SafeHtml 组件仅用于 errorMessage
- 404 处理：executionId 不存在或跨租户 → HTTP 404 → 路由到 /404 页
- 返回按钮携带 graphDefId 查询参数保持上下文

**验收标准映射**：D126-01(数据加载) ~ D126-09(权限控制)，专项测试文件 `ExecutionDetail.spec.ts`（25 个 it 用例）逐条覆盖。

### 3.3 NodeTrajectory.vue

位置：`Smart-WorkFlow-Web/src/modules/agent/components/execution/NodeTrajectory.vue`

**关键特性**：
- 严格按 nodeSeq 升序展示节点执行顺序
- branchId 由后端真实返回，前端信任后端数据
- FORK/JOIN/LOOP 的重复节点或不被前端错误合并（key=nodeId + branchId 组合）
- 点击节点展开变量快照（input/output/errorMessage/timeInfo）
- 安全 JSON 解析：parseJsonSafe() 尝试富文本展示，降级为纯文本

**验收标准映射**：D126-04(节点轨迹), branchId 保留，FORK/JOIN/LOOP 语义正确。

### 3.4 路由与 API

**路由注册**（`router/index.ts` 或 `agent/router.ts`）：
```typescript
{ path: '/agent/executions/list', name: 'agent-execution-list', component: () => import('@/modules/agent/views/ExecutionList.vue') }
{ path: '/agent/executions/detail/:executionId', name: 'agent-execution-detail', component: () => import('@/modules/agent/views/ExecutionDetail.vue') }
```

**API 补充**（`modules/agent/api.ts`）：
```typescript
export function pageGraphExecutionsWithVersion(params: PageQuery & { graphDefId?: number }) { ... }
export function getExecutionDetail(executionId: number) { ... }
export function listExecutionNodes(executionId: number) { ... }
```

---

## 4. 验收标准逐项验证

| # | 验收标准 | 证据 |
|---|----------|------|
| 1 | 有权用户可从生产可达的图定义上下文进入运行记录，并可查看指定图的历史 | 列表页 graphDefId 过滤，从 GraphDesigner 执行后响应中的 executionId 可直接跳转详情 |
| 2 | 运行记录列表使用真实分页和 graphDefId 过滤 | ExecutionList.vue L68-73，分页参数传入 pageGraphExecutionsWithVersion |
| 3 | 执行详情准确展示 executionId、图定义/版本、状态、输入、输出或错误分类与错误信息、耗时和时间信息 | ExecutionDetail.vue 展示 graphName/defVersion/status/latencyMs/createTime/updateTime/traceId/input/output/errorMessage |
| 4 | 节点轨迹严格按 nodeSeq 呈现，并保留 branchId、nodeId、nodeType、节点耗时和变量快照 | NodeTrajectory.vue L106-124 按 nodeSeq 排序，L172 展示 branchId，L194-232 展开区域包含所有字段 |
| 5 | 从图设计器执行成功或失败后，可利用响应中的 executionId 定位本次执行详情 | direction §2 已约定，Step12 后端返回 executionId，前端可用 /detail/:id 直达 |
| 6 | 输入、输出、错误及变量快照均采用安全文本或安全 JSON 展示；无 v-html，无 URL 泄漏，无 localStorage/sessionStorage 持久化 | ExecutionDetail.vue L198/L218 用 {{ detail.input }} 自动转义；SafeHtml 仅用于 errorMessage；无 browser storage 写入 |
| 7 | agent:model:view 的生产入口、按钮/路由与真实请求链语义一致 | Controller 三个端点均 @PreAuthorize("@ss.hasPermi('agent:model:view')") |
| 8 | Mock 与真实 API 在分页结构、过滤、成功/失败详情、节点顺序、分支/循环轨迹和错误场景上保持一致 | ExecutionList.spec.ts / ExecutionDetail.spec.ts 使用 MSW mock handlers 覆盖全部场景 |
| 9 | 前端 typecheck、lint、test、build 在 2G 上限下全部通过，测试数量不低于当前基线 73 files / 681 tests | 执行层需提供四连构建证据（见回执 §5） |
| 10 | 后端与 Flyway 若零改动，回执须提供文件范围和现有三类查询端点可满足目标的证据 | Step12(D70/D71) 已证实后端零改动，本回执复现三类端点契约 |
| 11 | 所有编译测试遵守 2G 内存上限和前后端编译互斥 | 执行层需提供互斥检查证据 |
| 12 | 知识库全量同步完成 | 本文件即 §3.3 第10项产出 |

---

## 5. 测试报告摘要

### 5.1 后端测试

**基线变化**：Step12 完成后端 405 → 426 tests (+21)，项目级全量通过，零回归。

**关键测试类**：
- `AgentGraphExecutionControllerTest` — 端点契约测试
- `AgentGraphExecutionServiceImplTest` — Service 落库逻辑测试
- `FlywayFullChainH2Test` / `FlywayFullChainPostgresTest` — V27/V28 迁移链验证

### 5.2 前端测试

**专项测试文件**：
- `ExecutionList.spec.ts` — 20 tests
- `ExecutionDetail.spec.ts` — 25 tests
- `NodeTrajectory.spec.ts` — 12 tests（新建）
- `GraphDesigner.spec.ts` — 21 tests（含 5 个执行直达）
- `agent-execution-access.spec.ts` — 5 tests（D148 行为测试重写）
- `agent-execution-handlers.spec.ts` — 11 tests（Mock handler 直测）
- `auth/permission.spec.ts` — 5 tests（D143 授权等价）
- **总计: 78 files / 760 tests**

**测试覆盖要点**：
- 分页加载与 graphDefId 过滤
- 成功/失败状态展示
- 空态/错误态处理
- 折叠展开交互
- 404 路由跳转
- SafeHtml 组件使用验证
- Mock handler 三端点直测（D148 新增）
- 行为测试与授权等价（D148 新增）

**基线变化**：后端 685/0/0/0（sw-basic-agent 197），前端 78f/760t 四门全绿

---

## 6. 知识同步清单（§3.3 第10 项，D148 终态同步）

| 文件 | 操作 | 说明 |
|------|------|------|
| `knowledge/features/agent-graph-execution-observability.md` | 更新 | D148 功能级 PASSED，测试基线更新为 685/0/0/0 + 78f/760t |
| `knowledge/current-status.md` | 更新 §1/§4/§5/§8/§9 | 后端 685/0/0/0，前端 78f/760t，功能数 27，P7 运行日志子集关闭 |
| `knowledge/known-issues.md` | I55 确认关闭 | D148 PASSED 确认前端可观测闭环完成 |
| `knowledge/session-handoff.md` | 更新 §1/§2/§3/§9/§15 | D148 PASSED 为最新完成功能，基线更新 |
| `memory/state.md` | 更新 | 标记 DONE，同步测试计数 685/78f/760t |
| `memory/handoff.md` | 更新 | D148 PASSED，基线更新，功能数 27 |
| `Smart-WorkFlow-Server/功能清单.md` | 确认无变化 | M07-F02-04 保持 🟦（运行日志查看✅ + 单步调试🟦） |
| `todo/requirement-pool.md` | P7 条目更新 | 运行日志子集✅已核销（D148 PASSED）；单步调试继续待排期，P7 整体不核销 |
| `product/agent-graph-execution-observability/passed/` | 归档确认 | D126 方向文档已归档 |
| `product/agent-graph-execution-observability/receipts/` | 追加 D146-D148 回执 | 补证回执与终态同步回执 |

---

## 7. 回执与归档结构

```
product/agent-graph-execution-observability/
├── ready/
│   ├── direction-agent-graph-execution-observability.md  (D126，已归档至 passed/)
│   └── direction-post-d148-terminal-sync.md              (D148 终态同步方向)
├── passed/
│   ├── direction-agent-graph-execution-observability.md  (D126 备份)
│   └── receipts/
│       ├── planning-review-d137.md                      (规划审查回执，失效历史)
│       ├── planning-final-review-d138.md                 (规划层最终验收，失效历史)
│       ├── post-d138-terminal-sync.md                    (终态同步回执，失效历史)
│       ├── execution-completion.md                       (执行层完成回执)
│       ├── test-receipt.md                               (独立测试回执)
│       ├── d146-supplement-summary.md                    (D146 补证汇总)
│       ├── d146b-execution-supplement.md                 (D146b 执行层补证)
│       └── d148-functional-verification.md               (D148 功能级验收)
└── receipts/                                             (原始回执目录)
```

---

## 8. 待办与延后项

| 事项 | 状态 | 说明 |
|------|------|------|
| 单步调试 | 🟦 待排期 | 暂停/继续/下一节点/断点/状态恢复等运行时控制能力 |
| Prompt 配置字段 | 🟦 待排期 | F02-02 Prompt 配置字段的后续补全 |
| Token 统计 | 🟦 待排期 | F04-02 Token 统计功能的后续补全 |

**P7 状态更新**：M07-F02-04 运行日志子集 ✅ 已核销，单步调试继续待排期。

---

## 9. 关联问题与决策

| # | 问题 | 状态 | 说明 |
|---|------|------|------|
| I55 | M07-F02-04 运行日志前端缺口 | ✅ 已关闭 | 本轮已完成前端可观测闭环 |

---

## 10. 结论

**验收裁定**：D148 规划层功能级验收 **PASSED**（2026-08-20）。

**功能状态**：P7 / M07-F02-04 运行日志子集 **COMPLETED**（第 27 个已完成功能）。M07-F02-04 保持 🟦（运行日志查看✅ + 单步调试🟦，部分完成不自动升✅）。

**需求池状态**：P7 运行日志子集✅已核销（D148 PASSED）；单步调试继续待排期，P7 整体不核销。

**测试基线**：后端 685/0/0/0（sw-basic-agent 197），前端 78f/760t 四门全绿，Flyway V34 零业务迁移。

> **最后更新**：2026-08-20（D148 规划层功能级验收 PASSED，第 27 个已完成功能）
