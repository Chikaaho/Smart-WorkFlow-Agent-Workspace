# 执行回执 — Step F2 前端 Vue 视图

## 1. Step 编号和名称

**Step F2**：前端 — Vue 视图（TodoList增强 + TaskDetail + ProcessedList）

## 2. 使用模型

`deepseek-v4-flash`（方案推荐模型，纯 Vue SFC 组件 + Vitest spec，无架构决策）

## 3. 实际读取的文件

| # | 文件 | 备注 |
|---|------|------|
| 1 | `Smart-WorkFlow-Web/src/contracts/bpm.ts` | 确认 F1 类型定义 |
| 2 | `Smart-WorkFlow-Web/src/contracts/common.ts` | 确认 PageQuery / PageResult |
| 3 | `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` | 确认 API 函数签名 |
| 4 | `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue` | **分页 B 型参考模板** |
| 5 | `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.spec.ts` | **分页 spec 参考模板** |
| 6 | `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` | 待改造的现有代码 |
| 7 | `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.spec.ts` | 待更新的现有测试 |
| 8 | `Smart-WorkFlow-Web/src/foundation/request/index.ts` | ApiError 类（仅确认） |
| 9 | `Smart-WorkFlow-Web/src/components/page-layout/StandardListTemplate.vue` | 插槽和事件定义 |

## 4. 实际修改的文件

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.vue` | **修改** | 真分页 + 驳回 + 导航 |
| 2 | `Smart-WorkFlow-Web/src/modules/workflow/views/TodoList.spec.ts` | **修改** | 适配分页 + 新增驳回/导航测试 |
| 3 | `Smart-WorkFlow-Web/src/modules/workflow/views/TaskDetail.vue` | **新建** | 任务详情页 |
| 4 | `Smart-WorkFlow-Web/src/modules/workflow/views/TaskDetail.spec.ts` | **新建** | 详情页测试 |
| 5 | `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessedList.vue` | **新建** | 已办列表页 |
| 6 | `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessedList.spec.ts` | **新建** | 已办列表测试 |

**共 6 文件（2 修改 + 4 新建），严格按方案执行。**

## 5. 每个文件的修改摘要

### 5.1 TodoList.vue（修改，~155 行）

| 改动 | 行数 | 说明 |
|------|------|------|
| 新增 `useRouter` 导入 + `rejectTask` 导入 + `PageQuery` 类型导入 | ~3 | 路由导航和驳回所需 |
| 新增 `rejectingId` 状态变量 | — | 驳回操作的防重复锁 |
| 新增 `router` 实例 | ~1 | 页面间导航 |
| `pageSize` 从 `9999` 改为 `10` | ~1 | 真分页 |
| `loadList` 重写 | ~12 | 从 `const tasks = await queryTodoTasks()` → `PageQuery` 传参 + `result.list`/`result.total` |
| 新增 `handlePageNumChange`/`handlePageSizeChange` | ~8 | 照搬 ProcessDefList 分页事件 |
| 新增 `rejectRow` 桥接函数 + `handleReject` 方法 | ~30 | 驳回确认框 + API 调用 + 列表移除 |
| 新增 `handleRowClick` | ~4 | 行点击导航到 TaskDetail |
| `handleApprove` 防重复条件扩展 | ~1 | 增加 `rejectingId` 互斥检查 |
| 模板绑定额外事件 | ~3 | `@update:page-num`/`@update:page-size`/`highlight-current-row`/`@row-click` |
| 新增 `#toolbar-actions` 插槽 | ~3 | 「已办任务」导航按钮 |
| 表格新增 processName 列 | ~2 | 对齐后端字段 |
| 操作列新增驳回按钮（`@click.stop`） | ~8 | 宽度 140→210 |
| 删除 `:deep(.list-pagination) { display: none; }` 样式块 | — | 不再隐藏分页 |

### 5.2 TodoList.spec.ts（修改，~200 行）

| 改动 | 说明 |
|------|------|
| mock 中新增 `rejectTask` | 驳回 API mock |
| 新增独立 `mockPush` | 路由 push 断言 |
| `el-button` stub 改为 emit click 版本 | 支持按钮点击测试 |
| `StandardListTemplate` stub 含 `#toolbar-actions` 插槽 | 工具栏按钮渲染 |
| mock 数据新增 `processName` 字段 | 对齐新类型 |
| mock 数据改为 `mockPageResult`（list/total 形状） | 适配分页 API |
| 测试 1: `calls queryTodoTasks with pagination on mount` — 验证 `{ pageNum:1, pageSize:10 }` | **更新** |
| 测试 2-3: error 态 | **保留** |
| 测试 4: approve + 移除 | **更新**（PageResult 数据） |
| 测试 5: cancel approve | **保留** |
| 测试 6: `calls rejectTask and removes task on reject` | **新增** |
| 测试 7: `does not call rejectTask when user cancels reject confirm` | **新增** |
| 测试 8: `navigates to TaskDetail on row click` | **新增** |
| 测试 9: `navigates to ProcessedList on toolbar button click` | **新增** |

### 5.3 TaskDetail.vue（新建，~200 行）

- **脚本（~80 行）**：`loadDetail` 调用 `queryTaskDetail(taskId)`；`handleApprove`/`handleReject` 含确认框防重复锁 + API 调用 + 成功后导航 TodoList；`goBack` 返回；`formatVariables` 变量格式化
- **模板**：顶栏（返回按钮 + 标题）→ 错误提示 → el-card 基本信息（9 个 el-descriptions-item）→ el-card 流程变量表（条件隐藏）→ el-card 审批历史表（空数组显示「暂无审批历史」）→ 操作栏（通过 + 驳回按钮）
- **样式**：.task-detail 16px 内边距；.detail-header flex 布局；.detail-card 16px 底部间距；.detail-actions 居中 flex

### 5.4 TaskDetail.spec.ts（新建，~190 行）

9 条测试：mount 加载（queryTaskDetail with taskId）、12 字段渲染、null processName、ApiError 错误态、fallback 错误态、空审批历史、completeTask+导航、rejectTask+导航、后退按钮

### 5.5 ProcessedList.vue（新建，~110 行）

照搬 ProcessDefList.vue 分页模式，替换 API 为 `queryProcessedTasks`。6 列表格（taskName/processName/formKey/businessKey/createTime/endTime），processName/endTime `?? '-'` 兜底。行点击导航到 TaskDetail，工具栏按钮「待办任务」。

### 5.6 ProcessedList.spec.ts（新建，~190 行）

9 条测试：mount 分页参数、pageNum 切换、pageSize 切换、fallback 错误态、ApiError 错误态、空态、endTime null 渲染、行点击导航、工具栏按钮导航

## 6. 实际执行的命令

```bash
# 1. 单文件测试 — TodoList.spec.ts
pnpm test src/modules/workflow/views/TodoList.spec.ts

# 2. 单文件测试 — TaskDetail.spec.ts
pnpm test src/modules/workflow/views/TaskDetail.spec.ts

# 3. 单文件测试 — ProcessedList.spec.ts
pnpm test src/modules/workflow/views/ProcessedList.spec.ts

# 4. 静态检查 — 无参调用未被引入
grep -r "queryTodoTasks()" src/modules/workflow/views/

# 5. 静态检查 — 9999 hack 已清除
grep -r "pageSize.*9999" src/modules/workflow/views/

# 6. 静态检查 — 分页隐藏样式已清除
grep -r "list-pagination.*display.*none" src/modules/workflow/views/

# 7. TypeScript 类型检查
pnpm typecheck

# 8. ESLint（首次 8 个 prettier 警告）
pnpm lint

# 9. 自动修复格式
pnpm lint --fix

# 10. ESLint（确认零告警）
pnpm lint

# 11. 全量回归测试
pnpm test

# 12. 生产构建
pnpm build
```

## 7. 命令输出摘要

| 命令 | 退出码 | 关键输出 |
|------|--------|----------|
| `pnpm test` (TodoList.spec.ts) | 0 | 1 file / 9 tests passed |
| `pnpm test` (TaskDetail.spec.ts) | 0 | 1 file / 9 tests passed |
| `pnpm test` (ProcessedList.spec.ts) | 0 | 1 file / 9 tests passed |
| `grep -r "queryTodoTasks()"` | 1 | 零命中（无无参调用 ✅） |
| `grep -r "pageSize.*9999"` | 1 | 零命中（9999 hack 已清除 ✅） |
| `grep -r "list-pagination.*display.*none"` | 1 | 零命中（分页样式已删除 ✅） |
| `pnpm typecheck` | 0 | 无错误 |
| `pnpm lint` (首次) | 0 | 8 prettier 警告，已 `--fix` |
| `pnpm lint` (二次) | 0 | 零告警 |
| `pnpm test` (全量回归) | 0 | **48 files / 417 tests passed** |
| `pnpm build` | 0 | 构建成功（仅依赖包预置注解警告，无害） |

## 8. 与原方案的偏差

**无偏差。** 严格按方案执行：

- TodoList.vue 对照 ProcessDefList 实现真分页模式 ✅
- TodoList.vue 操作列含驳回按钮 + `@click.stop` ✅
- TodoList.vue 行点击导航 + highlight-current-row ✅
- TodoList.vue 不含 9999 hack 和隐藏分页样式 ✅
- TaskDetail.vue 含 9 个 el-descriptions-item 展示字段 + 流程变量卡片 + 审批历史 ✅
- TaskDetail.vue 含通过/驳回操作 + 导航 ✅
- ProcessedList.vue 使用 StandardListTemplate，与 ProcessDefList 同名分页模式一致 ✅
- ProcessedList.vue 6 列，endTime/processName `?? '-'` ✅
- 三个 spec 各 9 条测试 ✅

## 9. 遇到的问题

| 问题 | 解决方式 |
|------|----------|
| ESLint prettier 报 8 个格式警告（多行链式调用、属性顺序、`??` 换行） | `pnpm lint --fix` 自动修复 4 个文件 |

**无其他问题。**

## 10. 未完成内容

**无未完成内容。** 方案要求的全部改动已完成。

## 11. 风险和注意事项

- TaskDetail.vue 和 ProcessedList.vue 依赖命名路由（F3 注册），当前无法用 `pnpm dev` 手工验收
- TodoList.vue 的「已办任务」按钮和 ProcessedList.vue 的「待办任务」按钮也依赖路由注册
- 纯 vue-tsc 类型检查已通过（`pnpm typecheck` 零错误），增量安全

## 12. Git diff 摘要

改动 6 文件（2 修改 + 4 新建）：

- `TodoList.vue`：~80 行重写（分页 + 驳回 + 导航改造）
- `TodoList.spec.ts`：~80 行更新（适配分页 + 4 条新测试）
- `TaskDetail.vue`：**新建** ~220 行
- `TaskDetail.spec.ts`：**新建** ~190 行
- `ProcessedList.vue`：**新建** ~110 行
- `ProcessedList.spec.ts`：**新建** ~190 行

测试基线变化：**46 files / 395 tests → 48 files / 417 tests（+2 文件 / +22 测试）**

## 13. 建议执行的测试

| 测试场景 | 原因 |
|----------|------|
| `pnpm test src/modules/workflow/views/TodoList.spec.ts` | 9 条 TodoList 测试 |
| `pnpm test src/modules/workflow/views/TaskDetail.spec.ts` | 9 条 TaskDetail 测试 |
| `pnpm test src/modules/workflow/views/ProcessedList.spec.ts` | 9 条 ProcessedList 测试 |
| `pnpm test` 全量回归 | 48 files / 417 tests 基线不漂移 |
| `pnpm lint` | 架构边界规则无新增告警 |
