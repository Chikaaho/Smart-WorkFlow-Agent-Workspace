# 执行回执 — Step F1 前端 Types + API + Specs

## 1. Step 编号和名称

**Step F1**：前端 — Types + API + Specs

## 2. 使用模型

`deepseek-v4-flash`（方案推荐模型，仅机械性类型定义 + API 函数封装 + 测试）

## 3. 实际读取的文件

| # | 文件 | 备注 |
|---|------|------|
| 1 | `Smart-WorkFlow-Web/src/contracts/bpm.ts` | 现有 BPM 类型 |
| 2 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` | 现有 API 函数 |
| 3 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.spec.ts` | 现有 API 测试 |
| 4 | `Smart-WorkFlow-Web/src/contracts/common.ts` | 确认 PageQuery/PageResult 已就绪（未修改） |
| 5 | `Smart-WorkFlow-Web/src/foundation/request/index.ts` | 确认 request<T>() 类型签名（未修改） |

## 4. 实际修改的文件

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `Smart-WorkFlow-Web/src/contracts/bpm.ts` | **修改** | 扩展 TodoTask + 新增 3 接口 |
| 2 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` | **修改** | 修改 1 函数 + 新增 3 函数 |
| 3 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.spec.ts` | **修改** | 更新 1 测试 + 新增 3 测试 + 保留 2 测试 |

**无新建文件，严格按方案仅修改 3 个文件。**

## 5. 每个文件的修改摘要

### 5.1 contracts/bpm.ts

| 改动 | 说明 |
|------|------|
| `TodoTask` 增加 `processName: string` | 对齐后端 TodoTaskRespDTO |
| **新增** `TaskDetail` 接口（12 字段） | 对齐后端 TaskDetailRespDTO |
| **新增** `ApprovalHistoryItem` 接口（5 字段） | 对齐后端 ApprovalHistoryItemDTO |
| **新增** `ProcessedTask` 接口（8 字段） | 对齐后端 ProcessedTaskRespDTO |
| prettier 自动修复 | lint --fix 消除了行尾多余空格 |

### 5.2 api/index.ts

| 改动 | 行数 | 说明 |
|------|------|------|
| import 扩展 Tip | 1 | 新增 TaskDetail、ProcessedTask 类型导入 |
| `queryTodoTasks` 重写 | ~15 行 | 从无参 `Promise<TodoTask[]>` 改为 `(page: PageQuery) => Promise<PageResult<TodoTask>>` |
| **新增** `queryTaskDetail` | ~8 行 | `(taskId: string) => Promise<TaskDetail>` — GET /workflow/tasks/{taskId} |
| `completeTask` 不变 | — | 签名和实现未改动 |
| **新增** `rejectTask` | ~8 行 | `(taskId: string) => Promise<void>` — POST /workflow/tasks/{taskId}/reject |
| **新增** `queryProcessedTasks` | ~13 行 | `(page: PageQuery) => Promise<PageResult<ProcessedTask>>` — GET /workflow/tasks/processed |

### 5.3 api/index.spec.ts

| 测试 | 操作 | 断言要点 |
|------|------|----------|
| queryTodoTasks pagination + adaptPage | **更新** | GET 参数含 params、records→list 适配、processName 存在 |
| queryTaskDetail GET /{taskId} | **新增** | URL 拼接、返回 processVariables |
| completeTask POST /{taskId}/complete | 保留（不变） | 已有断言保持 |
| rejectTask POST /{taskId}/reject | **新增** | URL 拼接、void 返回 |
| queryProcessedTasks pagination | **新增** | GET 参数含 params、endTime 存在 |
| pageProcessDefs pagination + adaptPage | 保留（不变） | 已有断言保持 |

## 6. 实际执行的命令

```bash
# 1. 运行单文件测试
pnpm test src/modules/workflow/api/index.spec.ts

# 2. ESLint 检查
pnpm lint

# 3. 自动修复格式
pnpm lint --fix

# 4. 验证 lint 零告警
pnpm lint

# 5. TypeScript 类型检查（预期 TodoList.vue 报错）
pnpm typecheck

# 6. 全量回归测试
pnpm test
```

## 7. 命令输出摘要

| 命令 | 退出码 | 关键输出 |
|------|--------|----------|
| `pnpm test` (单文件) | 0 | 46 files passed / 395 tests passed |
| `pnpm lint` (首次) | 0 | 8 warnings（prettier 格式，已 auto-fix） |
| `pnpm lint --fix` | 0 | 自动修正 contacts/bpm.ts |
| `pnpm lint` (二次) | 0 | 零告警 |
| `pnpm typecheck` | 2 | 错误仅限 TodoList.vue(38,39,40) 和 TodoList.spec.ts(48,62,85,104) — **预期行为** |
| `pnpm test` (全量) | 0 | 46 files passed / 395 tests passed |

## 8. 与原方案的偏差

**无偏差。** 严格按方案 §9 执行，未新增、未遗漏任何改动点。

方案中 `api/index.ts` 的 import 原有 `TodoTask, ProcessDef`，我扩展为 `TodoTask, TaskDetail, ProcessedTask, ProcessDef`，新增 `queryProcessedTasks` 需要 `ProcessedTask` 类型。

## 9. 遇到的问题

| 问题 | 解决方式 |
|------|----------|
| eslint prettier 报 8 个 trailing whitespace 警告 | `pnpm lint --fix` 自动修复，类型注释中的行末空格被清理 |

**无其他问题。**

## 10. 未完成内容

**无未完成内容。** 方案要求的全部改动已完成。

## 11. 风险和注意事项

- `TodoList.vue` 因 `queryTodoTasks` 签名变更（从无参 → 需传 `PageQuery`）出现 typecheck 错误，属 **F1 预期行为**，由 F2 修复
- `TodoList.spec.ts` 同样因旧签名 mock 数据变为 `PageResult<TodoTask>` 而报错，F2 一并修复
- 新建的 `queryProcessedTasks` 当前无调用方（F2 在 TodoList.vue 或新视图中接入）

## 12. Git diff 摘要

改动 3 文件：~3 处修改 + 3 处新增接口/函数 + 3 处新增测试用例。

- `contracts/bpm.ts`：+35 行（3 新接口 + 1 字段扩展 — prettier 调整后）
- `api/index.ts`：~15 行重写 queryTodoTasks + ~29 行 3 个新函数
- `api/index.spec.ts`：~14 行旧测试替换 + ~80 行 3 个新测试

## 13. 建议执行的测试

| 测试场景 | 原因 |
|----------|------|
| `pnpm test src/modules/workflow/api/index.spec.ts` | 验证 6 条 API 测试全部通过 |
| `pnpm test` 全量回归 | 验证 46 files / 395 tests 基线不漂移 |
| `pnpm lint` | 验证架构边界规则无新增告警 |
