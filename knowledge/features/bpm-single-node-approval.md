# 功能追踪：BPM 单节点审批前后端联通

> 工作区统一知识库 — 单功能规划与追踪。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED
>
> ⚠️ **2026-08-14 角色制上线**：本文件中的"推荐模型/实际模型"字段为当时执行事实，仅作历史存档；当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。
>
> ⚠️ **2026-09-04 知识库全量整理 ID 更正**：本功能原编号误标「M04-F01-01」（该 ID 属清单流程设计器拖拽设计行，P47 缺口）。实际为 **Walking Skeleton 审批联通子集，服务 M04-F04-01（流程审批）/M04-F05-01（待办中心）**，不占用 M04-F01-01 设计器 ID。

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | Walking Skeleton 审批联通子集，服务 M04-F04-01/M04-F05-01（历史误标 M04-F01-01 已更正） |
| 功能名称 | BPM 单节点审批前后端联通（Walking Skeleton 第三环） |
| 功能目标 | 前端可查看待办任务列表并完成审批，打通"表单提交→自动启动流程→待办出现→审批完成"的端到端可见链路 |
| 创建日期 | 2026-07-14 |
| 完成日期 | 2026-07-15 |
| 最终状态 | **COMPLETED** ✅ |
| 涉及模块 | 后端：`sw-bpm-api`、`sw-bpm-engine`、`sw-bpm-process`（仅读取接口契约）；前端：`modules/workflow/` |

---

## 2. 需求分析

### 2.1 功能目标

在 Walking Skeleton 路径（登录→简单表单→单节点审批→通知）中，登录和表单已完成。本功能打通第三环：让审批流程在前端可见、可操作。最小薄切片：

1. 待办任务列表页 — 展示当前用户待审批任务，提供"审批通过"按钮
2. 流程定义列表页 — 只读展示已有流程定义
3. 前端基础设施 — types、API 层、mock 数据/handler、菜单结构调整

后端已有 88 个 Java 文件，端点已就位（`/workflow/tasks/todo`、`/workflow/tasks/{id}/complete`、`/workflow/defs`）。本功能不涉及后端改动。

### 2.2 非目标

- 不做流程设计器（不集成 bpmn-js）
- 不做通知模块前端
- 不做审批拒绝按钮（后端无 reject endpoint）
- 不做任务详情页/表单渲染链接
- 不做流程实例列表（后端 controller 未暴露）
- 不启动后端服务器做真端到端
- 后端代码零改动

### 2.3 影响范围

| 维度 | 详情 |
|------|------|
| 后端模块 | 无改动（仅读取 `sw-bpm-process` 的 Controller 作为接口契约参考） |
| 前端模块 | `modules/workflow/` — 从 1 个占位文件扩展为完整模块 |
| 数据库表 | 无改动 |
| API 端点 | 前端对接 3 个已有端点：`GET /workflow/tasks/todo`、`POST /workflow/tasks/{id}/complete`、`GET /workflow/defs` |
| 前端路由 | `/workflow/todo`（待办列表）、`/workflow/defs`（流程定义）；workflow 菜单从单 MENU 改为 DIRECTORY + 子 MENU |
| 依赖功能 | 登录认证 ✅ · 表单引擎 ✅ · 菜单/路由系统 ✅ |

### 2.4 依赖和风险

| 类型 | 描述 |
|------|------|
| 前置条件 | 测试基线验证（Step 0）需通过 |
| 技术风险 | 低 — 纯前端 CRUD/列表页，严格遵循 form 模块已有模式 |
| 阻塞项 | 无 |

---

## 3. Step 列表

| Step | 名称 | 状态 | 推荐模型 | 执行回执 | 测试回执 | 验收结论 |
|------|------|:---:|:---:|:---:|:---:|:---:|
| 0a | 后端测试基线验证 | **PASSED** | deepseek-v4-flash | ✅ 111 tests, 0 fail | N/A（执行与测试合一） | ✅ PASSED |
| 0b | 前端测试基线验证 | **PASSED** | deepseek-v4-flash | ✅ 331 tests, 0 fail | N/A（执行与测试合一） | ✅ PASSED |
| 1 | 前端工作流基础设施（contracts + API + mock + menu） | **PASSED** | deepseek-v4-flash | ✅ F: 3/3 C: 3/3 ✅ typecheck lint test build | ✅ 34 files / 334 tests | ✅ PASSED |
| 2 | 待办任务列表页（TodoList） | **PASSED** ✅ | deepseek-v4-flash | ✅ 新建2文件 | ✅ 35 files / 339 tests | ✅ PASSED |
| 3 | 流程定义列表页（ProcessDefList） | **PASSED** ✅ | deepseek-v4-flash | ✅ 新建2文件 | ✅ 36 files / 344 tests | ✅ PASSED |
| 4 | 端到端验证 | **PASSED** ✅ | deepseek-v4-flash | ✅ 全量回归 + 静态检查 + ElMessageBox 修复 | ✅ 36/344 + 后端 111 | ✅ PASSED ✅ |

---

## 4. Step 详情

### Step 0a：后端测试基线验证

- **状态**：PASSED ✅
- **目标**：在后端独立环境中执行 `mvn -q compile && mvn -q test`，确认 17 test 基线健康
- **推荐模型**：deepseek-v4-flash（纯机械执行，不写代码）
- **方案文件**：`product/bpm-single-node-approval/step-0a-后端测试基线验证.md`
- **执行回执摘要**：Java 21.0.11 + Maven 3.9.16，7 模块 111 tests 全部通过，BUILD SUCCESS 01:41
- **验收结论**：PASSED — 全部 6 项验收标准满足，基线健康

### Step 0b：前端测试基线验证

- **状态**：PASSED ✅
- **目标**：在前端独立环境中执行四连校验门，确认 33 spec 基线健康
- **推荐模型**：deepseek-v4-flash（纯机械执行，不写代码）
- **方案文件**：`product/bpm-single-node-approval/step-0b-前端测试基线验证.md`
- **执行回执摘要**：Node v24.18.0 + pnpm 11.13.0，33 files / 331 tests 全通过，四连全绿
- **验收结论**：PASSED — 全部 6 项验收标准满足，基线健康

### Step 1：前端工作流基础设施

- **状态**：PASSED ✅
- **目标**：建立 types、API 层、mock 数据/handler、菜单结构调整
- **推荐模型**：deepseek-v4-flash（纯前端文件增改，严格遵循 form 模块已有模式）
- **方案文件**：`product/bpm-single-node-approval/passed/step-1-前端工作流基础设施.md`
- **执行回执摘要**：新建 3 文件（`contracts/bpm.ts`、`api/index.ts`、`api/index.spec.ts`），修改 3 文件（`seeds.ts` 菜单 DIRECTORY+2 子菜单 + 2 种子数据、`handlers.ts` 追加 3 handler、`WorkflowHome.vue` 去 BlankPage）。四连校验门全部通过：typecheck ✅ lint 0/0 ✅ test 34/334 ✅ build ✅。grep axios workflow/ 零命中。
- **验收结论**：PASSED — 9/10 验收标准自动通过（S1-10 pnpm dev:mock 手工验证已由后续 Step 确认）

### Step 2：待办任务列表页

- **状态**：PASSED ✅
- **目标**：我的待办页面，含审批通过按钮
- **推荐模型**：deepseek-v4-flash（纯前端单页面，严格遵循 StandardListTemplate 模式）
- **方案文件**：`product/bpm-single-node-approval/passed/step-2-待办任务列表页.md`
- **新建文件**：`TodoList.vue`（153 行）、`TodoList.spec.ts`（117 行）
- **执行回执摘要**：新建 2 文件，未修改任何已有文件。四连校验门全部通过：typecheck ✅ lint ✅ test 35/339 ✅ build ✅。`grep axios workflow/views/` 零命中。
- **验收标准对照**：
  - S2-1 ✅ `TodoList.vue` 已创建
  - S2-2 ✅ `TodoList.spec.ts` 已创建，5 个测试用例
  - S2-3 ✅ 使用 StandardListTemplate
  - S2-4 ✅ 展示 taskId（短格式）、formKey、businessKey、createTime
  - S2-5 ✅ 每行有「审批通过」按钮，点击后弹出确认框（测试覆盖）
  - S2-6 ✅ 审批确认后调用 completeTask()，任务从列表移除（测试覆盖）
  - S2-7 ✅ API 错误时页面显示错误提示（测试覆盖）
  - S2-8 ✅ 审批按钮有 loading/disabled 防重复机制（代码审查 + 测试覆盖）
  - S2-9 ✅ `pnpm typecheck` 退出码 0
  - S2-10 ✅ `pnpm lint` 退出码 0
  - S2-11 ✅ `pnpm test` 35 files / 339 tests 全部通过
  - S2-12 ✅ `pnpm build` 退出码 0
  - S2-13 ✅ `grep axios src/modules/workflow/views/` 零命中
  - S2-14 ✅ `pnpm dev:mock` 手工验证通过（Step 4 端到端验证已确认）
- **关键约束落实**：不分页（pageSize=9999 + CSS 隐藏分页）、StandardListTemplate 容器、`approvingId` 防重复点击、`ElMessageBox.confirm` 确认弹框、`formatTaskId` 短格式

### Step 3：流程定义列表页

- **状态**：PASSED ✅
- **目标**：只读流程定义分页列表
- **推荐模型**：deepseek-v4-flash（纯前端单页面，严格遵循 FormDefList 分页模式）
- **方案文件**：`product/bpm-single-node-approval/passed/step-3-流程定义列表页.md`
- **新建文件**：`ProcessDefList.vue`（135 行）、`ProcessDefList.spec.ts`（144 行）
- **执行回执摘要**：新建 2 文件，未修改任何已有文件。四连校验门全部通过：typecheck ✅ lint ✅ test 36/344 ✅ build ✅。`grep axios workflow/views/` 零命中。
- **关键约束**：只读无操作列、DRAFT/PUBLISHED 状态 el-tag、标准分页交互（update:pageNum/update:pageSize）

### Step 4：端到端验证

- **状态**：PASSED ✅
- **目标**：全量回归测试 + mock 模式手工验收 + 修复 ElMessageBox 弹窗问题
- **推荐模型**：deepseek-v4-flash（纯验证步骤，无代码编写）
- **方案文件**：`product/bpm-single-node-approval/passed/step-4-端到端验证.md`
- **执行回执摘要**：
  - **全量回归**：pnpm typecheck ✅ · lint ✅ · test 36/344 ✅ · build ✅
  - **后端回归**：mvn compile ✅ · test 111/111 ✅
  - **静态检查**：grep axios 零命中 ✅ · 7 文件全部存在 ✅ · 菜单结构正确 ✅
  - **Bug 修复**：
    1. ElMessageBox 无样式弹窗 — 在 `main.ts` 中全局导入 `element-plus/dist/index.css`（因 ElementPlusResolver 不导入 transitively CSS 依赖如 ElOverlay）
    2. 快速点击出现多个确认框 — 将 `approvingId` 锁前置到 `ElMessageBox.confirm()` 之前，使用 `confirmed` 标记 + `finally` 块正确管理取消/确认态
  - **手工验收**（S4-8~S4-11）：✅ 用户确认 `pnpm dev:mock` 后已验证，弹窗正常居中显示，快速点击只弹一个框
- **验收标准对照**：
  - S4-1 ✅ 全量前端回归通过
  - S4-2 ✅ 全量后端回归通过
  - S4-3 ✅ 新增文件全部存在（7 文件）
  - S4-4 ✅ 菜单结构正确（DIRECTORY + 2 子菜单）
  - S4-5 ✅ grep axios 零命中
  - S4-6 ✅ grep lowcode 零命中
  - S4-7 ✅ workflow 模块 ESLint 边界检查通过
  - S4-8 ✅ 待办列表页加载、展示 5 条、审批通过消失（用户手动验证）
  - S4-9 ✅ ElMessageBox 确认弹窗正常居中显示，有遮罩层和样式（用户手动验证）
  - S4-10 ✅ 流程定义列表正常分页展示（用户手动验证）
  - S4-11 ✅ 快速点击只弹出一个确认框（用户手动验证）

---
## 5. 测试和验收汇总

| Step | 测试总数 | 通过 | 失败 | 跳过 | 验收结论 |
|------|:---:|:---:|:---:|:---:|:---:|
| Step 0a | 111（后端） | 111 | 0 | 0 | ✅ PASSED |
| Step 0b | 331（前端） | 331 | 0 | 0 | ✅ PASSED |
| Step 1 | 334（基线 331 + 新增 3） | 334 | 0 | 0 | ✅ PASSED |
| Step 2 | 339（基线 334 + 新增 5） | 339 | 0 | 0 | ✅ PASSED |
| Step 3 | 344（基线 339 + 新增 5） | 344 | 0 | 0 | ✅ PASSED |
| Step 4 | 344（全量回归）+ 111（后端） | 455 | 0 | 0 | ✅ PASSED |

---

## 6. 功能完成检查清单

- [x] 所有 Step 均已 PASSED
- [x] 已更新 `knowledge/current-status.md`
- [x] 已更新 `knowledge/decisions.md`（D11：Element Plus 全量 CSS 导入）
- [x] 已更新 `knowledge/known-issues.md`（如有新增）
- [x] 已生成交接摘要 → `knowledge/session-handoff.md`
- [x] 已标注功能清单中对应项状态

---

## 7. 实际修改范围

### 新建文件

| 文件 | Step | 说明 |
|------|:---:|------|
| `src/contracts/bpm.ts` | 1 | BPM 模块 TypeScript 类型定义（TodoTask/ProcessDef/BpmTask/BpmDeploy） |
| `src/modules/workflow/api/index.ts` | 1 | API 层（queryTodoTasks/completeTask/queryProcessDefs/queryPageTasks） |
| `src/modules/workflow/api/index.spec.ts` | 1 | API 层单元测试（3 用例） |
| `src/modules/workflow/views/TodoList.vue` | 2 | 我的待办列表页（StandardListTemplate + el-table + 审批按钮） |
| `src/modules/workflow/views/TodoList.spec.ts` | 2 | 待办页单元测试（5 用例） |
| `src/modules/workflow/views/ProcessDefList.vue` | 3 | 流程定义列表页（StandardListTemplate + el-table + 分页） |
| `src/modules/workflow/views/ProcessDefList.spec.ts` | 3 | 流程定义页单元测试（5 用例） |

### 修改文件

| 文件 | Step | 改动 |
|------|:---:|------|
| `src/modules/workflow/api/seeds.ts` | 1 | 菜单从单 MENU 改为 DIRECTORY + 2 子 MENU（/workflow/todo + /workflow/defs）；添加 TodoTask 和 ProcessDef 种子数据 |
| `src/mock/handlers.ts` | 1 | 追加 3 个 MSW handler（queryTodoTasks/completeTask/queryProcessDefs） |
| `src/modules/workflow/views/WorkflowHome.vue` | 1 | 去 BlankPage，改为流程菜单引导页 |
| `src/main.ts` | 4 (fix) | 新增 `import 'element-plus/dist/index.css'` 全局 CSS 导入，位于 tokens.css 之前 |
| `src/modules/workflow/views/TodoList.vue` | 4 (fix) | 修复 ElMessageBox 多次弹窗：`approvingId` 锁前置到 confirm() 之前 + `confirmed` 标记 |

### 涉及数据库表

无（纯前端功能，后端零改动）

---

## 8. 遗留问题

| # | 问题 | 严重程度 | 影响 | 后续处理 |
|---|------|:---:|------|----------|
| 1 | 待办列表不分页（pageSize=9999 + CSS 隐藏分页组件） | 低 | 待办量大时前端全量渲染 | 待后端提供分页端点后改为真分页 |
| 2 | 暂无任务详情/表单渲染链接 | 低 | 审批时看不到表单内容 | 下一轮（M04-F01-02）实现 |
| 3 | bpmn-js adapter 未实现 | 中 | 流程设计器不可用 | I3 已知问题 |
