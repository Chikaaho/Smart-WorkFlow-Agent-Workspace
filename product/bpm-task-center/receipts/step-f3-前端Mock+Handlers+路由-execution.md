# 执行回执 — Step F3 前端 Mock + Handlers + 路由

## 1. Step 编号和名称

**Step F3**：前端 — Mock + Handlers + 路由

## 2. 使用模型

`deepseek-v4-flash`（方案推荐模型，纯 mock handler + 种子数据 + 路由注册机械工作，无架构决策）

## 3. 实际读取的文件

| # | 文件 | 备注 |
|---|------|------|
| 1 | `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 当前 workflow handler 定义 |
| 2 | `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 当前 MOCK_TODO_TASKS / MOCK_MENU_TREE 结构 |
| 3 | `Smart-WorkFlow-Web/src/router/index.ts` | 静态路由定义 + 参数化路由模式 |
| 4 | `Smart-WorkFlow-Web/src/contracts/bpm.ts` | 确认字段清单 |
| 5 | `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` | 确认 queryTodoTasks 分页调用 |
| 6 | `Smart-WorkFlow-Web/src/modules/workflow/views/TaskDetail.vue` | 确认 queryTaskDetail 调用 |
| 7 | `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessedList.vue` | 确认 queryProcessedTasks 调用 |

## 4. 实际修改的文件

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | **修改** | MOCK_TODO_TASKS +processName + 新增 MOCK_PROCESSED_TASKS + 菜单树 |
| 2 | `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | **修改** | 改造 1 handler + 新增 3 handler |
| 3 | `Smart-WorkFlow-Web/src/router/index.ts` | **修改** | 新增 2 静态路由 |

**共 3 文件（修改），无新建文件，严格按方案执行。**

## 5. 每个文件的修改摘要

### 5.1 seeds.ts

| 改动 | 说明 |
|------|------|
| MOCK_TODO_TASKS 类型新增 `processName: string` | 对齐 F1 类型 TodoTask |
| 5 条待办数据均新增 `processName` 字段 | 值使用真实流程名（请假审批流程/采购审批流程/合同审批流程/费用报销流程） |
| **新增** `MOCK_PROCESSED_TASKS`（3 条记录） | 8 字段，对齐 ProcessedTask 类型；第 3 条含 `processName: null` + `endTime: null` 安全测试 |
| MOCK_MENU_TREE workflow 目录新增 `processed-list` 子菜单 | sort:3，path: workflow/processed，component: workflow/views/ProcessedList |

### 5.2 handlers.ts

| 改动 | 说明 |
|------|------|
| import 新增 `MOCK_PROCESSED_TASKS` | 引用新种子 |
| `GET /api/workflow/tasks/todo` **改造**：平铺数组 → 分页 | 照搬 `/api/workflow/defs` 分页模式：`query.pageNum/pageSize` → slice → `{ records, total, pageNum, pageSize }` |
| **新增** `GET /api/workflow/tasks/:taskId` | 从 MOCK_TODO_TASKS 检索，返回 12 字段 TaskDetail（含空 approvalHistory + 固定 assignee/initiatorId） |
| `POST /api/workflow/tasks/:taskId/complete` | **保留不动**（splice 从 MOCK_TODO_TASKS 移除） |
| **新增** `POST /api/workflow/tasks/:taskId/reject` | splice 从 MOCK_TODO_TASKS 移除，返回 `code: 0` |
| **新增** `GET /api/workflow/tasks/processed` | 分页返回 MOCK_PROCESSED_TASKS |

### 5.3 router/index.ts

| 改动 | 说明 |
|------|------|
| **新增** `TaskDetail` 静态路由 | `path: 'workflow/task/:taskId'`，name: `'TaskDetail'`，照搬 `form-render/:formKey` 参数化模式 |
| **新增** `ProcessedList` 静态路由 | `path: 'workflow/processed'`，name: `'ProcessedList'` |

两个路由 name 与 F2 视图中 `router.push({ name: '...' })` 精确匹配。

## 6. 实际执行的命令

```bash
# 1. TypeScript 类型检查
pnpm typecheck

# 2. ESLint
pnpm lint

# 3. 全量回归测试
pnpm test

# 4. 生产构建
pnpm build

# 5. 静态检查
grep "processName" seeds.ts               # ≥ 5 处
grep "MOCK_PROCESSED_TASKS" seeds.ts      # export 存在
grep "MOCK_PROCESSED_TASKS" handlers.ts   # import + 2 次引用
grep "/api/workflow/tasks/:taskId" handlers.ts  # detail handler pattern
grep "reject" handlers.ts                 # reject handler
grep "processed" handlers.ts              # processed handler
grep "TaskDetail" router/index.ts         # 路由注册
grep "ProcessedList" router/index.ts      # 路由注册
grep "processed-list" seeds.ts            # 菜单树
```

## 7. 命令输出摘要

| 命令 | 退出码 | 关键输出 |
|------|--------|----------|
| `pnpm typecheck` | 0 | 无错误 |
| `pnpm lint` | 0 | 零告警 |
| `pnpm test` | 0 | **48 files / 417 tests passed**（基线不变） |
| `pnpm build` | 0 | 构建成功（仅依赖包注解警告，无害） |
| 静态检查全部通过 | — | 见 §5 摘要 |

## 8. 与原方案的偏差

**无偏差。** 严格按方案执行：

- MOCK_TODO_TASKS 新增 processName（5 条） ✅
- 新增 MOCK_PROCESSED_TASKS（3 条，含 null 安全测试） ✅
- 菜单树新增 processed-list 子菜单 ✅
- todo handler 改为分页（query.pageNum/pageSize → slice → records/total/pageNum/pageSize） ✅
- 新增 detail/reject/processed 三个 handler ✅
- 新增 TaskDetail + ProcessedList 静态路由 ✅

## 9. 遇到的问题

**无。**

## 10. 未完成内容

**无。** 方案要求的全部改动已完成，`pnpm dev:mock` 手工验收（方案 §13.4 的 12 步验收流程）需由人工在本地环境进行。

## 11. 风险和注意事项

- `complete` 操作后任务从 MOCK_TODO_TASKS splice 移除，但未被移入 MOCK_PROCESSED_TASKS（方案设计如此，保持最小变更）
- TodoList 的驳回操作将任务从 MOCK_TODO_TASKS 中移除（不会新增到 MOCK_PROCESSED_TASKS），后续刷新列表将看不到该任务
- mock detail handler 的 `approvalHistory` 固定返回空数组（方案设计如此），`processVariables` 仅含 `formKey`

## 12. Git diff 摘要

改动 3 文件（全部修改，无新建）：

- `seeds.ts`：~30 行新增（MOCK_TODO_TASKS +5 processName + ~30 行 MOCK_PROCESSED_TASKS + ~12 行菜单项）
- `handlers.ts`：~10 行 todo 改造 + ~40 行 3 个新 handler
- `router/index.ts`：+14 行 2 条静态路由

测试基线：**48 files / 417 tests（不变——F3 不新增测试文件）**

## 13. 建议执行的测试

| 测试场景 | 原因 |
|----------|------|
| `pnpm typecheck` | 验证新增种子类型一致 |
| `pnpm test` | 全量 48 files / 417 tests 不漂移 |
| `pnpm dev:mock` 手工验收 | 完整闭环：待办分页列表 → 详情 → 通过/驳回 → 已办列表 |
