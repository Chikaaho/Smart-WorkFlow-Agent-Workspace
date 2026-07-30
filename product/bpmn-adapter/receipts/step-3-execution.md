# 执行回执

## 1. Step 编号和名称

**Step 3：前端 ProcessDefList 新增"查看流程图"入口**

## 2. 使用模型

- **模型**：deepseek-v4-flash
- **角色**：前端执行代理

## 3. 实际读取的文件

| # | 文件路径（相对于 `Smart-WorkFlow-Web/`） | 说明 |
|---|------|------|
| 1 | `src/modules/workflow/views/ProcessDefList.vue` | 理解当前组件结构、插槽、数据源 |
| 2 | `src/modules/workflow/api/index.ts` | 理解现有 API 函数签名和调用模式 |
| 3 | `src/adapters/bpmn/index.ts` | 确认 `mountBpmnViewer` 签名及类型导出（已事前读取） |
| 4 | `src/foundation/mock/handlers.ts` | 理解 mock 注册模式，插入新 handler |
| 5 | `src/foundation/mock/seeds.ts` | 确认 `MOCK_PROCESS_DEFS` 数组结构 |
| 6 | `src/contracts/bpm.ts` | 确认 `ProcessDef` 接口定义 |
| 7 | `src/modules/storage/views/StorageList.spec.ts` | 参考已有测试模式（stubs、mock 写法） |

## 4. 实际修改的文件

| 文件路径（相对于 `Smart-WorkFlow-Web/`） | 修改类型 | 行数 |
|------|:---:|:---:|
| `src/modules/workflow/api/index.ts` | 修改 | +12 行 |
| `src/modules/workflow/views/ProcessDefList.vue` | 修改 | +106 / -2 行 |
| `src/foundation/mock/handlers.ts` | 修改 | +42 行 |
| `src/modules/workflow/views/__tests__/ProcessDefList.spec.ts` | **新建** | 完整测试文件 |

## 5. 每个文件的修改摘要

### `src/modules/workflow/api/index.ts`（+12 行）
- 在 `pageProcessDefs` 后新增 `getProcessDefGraph(id: number): Promise<string>` 函数
- 调用 `GET /workflow/defs/${id}/bpmn-xml`，通过 `request<T>` 自动解包 `ApiResponse<string>` → `string`

### `src/modules/workflow/views/ProcessDefList.vue`（+106 / -2 行）
- **新增 import**：`nextTick`、`onBeforeUnmount`（vue）、`getProcessDefGraph`（api）、`mountBpmnViewer` / `BpmnViewerInstance`（bpmn adapter）
- **新增响应式状态**：`viewerVisible`、`viewerLoading`、`viewerError`、`currentDefName`、`bpmnContainerRef`
- **新增 `openViewer(row)`**：异步打开对话框 → `getProcessDefGraph` → `mountBpmnViewer(container, xml)` → `fitViewport()`，catch 错误到 `viewerError`
- **新增 `closeViewer()`**：调用 `viewerInstance.destroy()` → 重置全部状态
- **新增 `onBeforeUnmount` 清理**：防御性 destroy
- **模板新增**：操作列（el-table-column，固定右侧，DRAFT 禁用）+ 查看流程图 el-dialog（900px，destroy-on-close，含错误提示 el-result + BPMN 渲染容器）

### `src/foundation/mock/handlers.ts`（+42 行）
- 新增 `GET /api/workflow/defs/:id/bpmn-xml` mock handler
- DRAFT 状态返回 `code: 2104`（PROCESS_NOT_PUBLISHED）
- PUBLISHED 状态返回含 StartEvent + EndEvent + BPMNEdge 的合法 BPMN 2.0 XML
- 遵循项目 `MockRegistration` 模式（非 MSW `http.get` 原生语法）

### `src/modules/workflow/views/__tests__/ProcessDefList.spec.ts`（新建，~270 行）
- 10 个 it() 测试用例：
  1. `calls pageProcessDefs on mount` — onMounted 调用 API
  2. `populates list from API result` — 列表数据填充
  3. `openViewer sets viewer state correctly` — 设置对话框状态
  4. `openViewer calls getProcessDefGraph with row id` — API 调用参数
  5. `calls mountBpmnViewer after API resolves` — mountBpmnViewer 调用
  6. `calls fitViewport after mountBpmnViewer resolves` — 自适应缩放
  7. `sets viewerError on API failure` — ApiError 错误处理
  8. `sets viewerError from Error.message fallback` — 普通 Error 回退
  9. `closeViewer calls destroy and resets state` — 清理逻辑
  10. `viewerLoading is false after openViewer completes` — loading 状态归位

## 6. 实际执行的命令

```bash
# 类型检查
pnpm typecheck

# ESLint（含架构边界规则）
pnpm lint --fix
pnpm lint

# 单元测试（单文件 + 全量）
pnpm test src/modules/workflow/views/__tests__/ProcessDefList.spec.ts
pnpm test

# 生产构建
pnpm build
```

## 7. 命令输出摘要

| 命令 | 退出码 | 输出摘要 |
|------|:---:|------|
| `pnpm typecheck` | 0 | 零错误 |
| `pnpm lint` | 0 | 零错误，零警告 |
| `pnpm test`（全量） | 0 | 59 文件，517 测试全部通过 |
| `pnpm build` | 0 | 构建成功 |

## 8. 与原方案的偏差

原方案 §9.2 使用 MSW 原生 `http.get` 语法编写 mock，但项目实际使用自定义 `MockRegistration` 模式。已调整为项目既有模式（`method` + `pattern` + `handler`），行为与原方案一致（DRAFT 返回 2104，PUBLISHED 返回合法 BPMN XML）。

原方案 §9.3.1 要求 import `ElMessage from 'element-plus'`，但该组件未实际使用 `ElMessage`（错误处理通过 `viewerError` ref + `<el-result>` 渲染），为避免 unused import lint 告警，暂不导入。

## 9. 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| ESLint `no-undef: 'HTMLElement' is not defined` | `no-undef` 规则不认识 TypeScript DOM 类型 | 在 `<script setup>` 首行添加 `/* global Element, HTMLElement */` |
| ESLint `no-undef: 'Element' is not defined` | 同上 | 同上 |
| ESLint `@typescript-eslint/no-explicit-any` | catch 块使用了 `(e: any)` | 改为 `(e: unknown)` + 类型断言 |
| Vitest `vi.mock` hoisting 错误 | `mockDestroy`/`mockFitViewport` 变量定义在 `vi.mock` 之后被提升 | 改用 `vi.hoisted()` 包裹变量声明 |
| `el-table-column` stub 不传递 slot scope `row` | 测试桩组件未模拟 Element Plus 的行传递机制 | 在 stub 中传递默认 row 对象 + el-table 用 `v-for` 传递行数据 |
| 原方案 mock 代码不匹配项目实际 | 方案使用了 MSW `http.get` 语法，但项目使用 `MockRegistration` | 适配为 `method`/`pattern`/`handler` 模式 |

## 10. 未完成内容

无。方案要求的所有内容均已完成。

## 11. 风险和注意事项

- `v-loading` 指令在 jsdom 测试中不生效，测试中不断言 loading DOM 状态，信任 Element Plus 运行时
- `bpmnContainerRef` 需要 `nextTick()` 等待对话框 DOM 渲染完成后再使用
- 对话框使用 `destroy-on-close` + `@closed` 事件双重保障 bpmn-js 实例的清理
- 组件卸载时（`onBeforeUnmount`）防御性 destroy，防止切换页面后内存泄漏
- Mock 返回的 BPMN XML 是静态的最简图（StartEvent → EndEvent），非真实流程定义

## 12. Git diff 摘要

```diff
 src/foundation/mock/handlers.ts               |  42 ++++++++++
 src/modules/workflow/api/index.ts             |  12 +++
 src/modules/workflow/views/ProcessDefList.vue | 106 +++++++++++++++++-
 3 files changed, 158 insertions(+), 2 deletions(-)
```
（另：新建测试文件 `ProcessDefList.spec.ts` ~270 行；`adapters/bpmn/index.ts` 的变更为 Step 1 前置工作，非本 Step 改动）

| 检查项 | 结果 |
|--------|:---:|
| `package.json` / `pnpm-lock.yaml` 零改动 | ✅ |
| `src/adapters/bpmn/` 零改动（本 Step） | ✅ |
| 后端 `Smart-WorkFlow/` 零改动 | ✅ |
| 新建测试文件 it() 块数 | 10 |

## 13. 建议执行的测试

| 测试场景 | 建议方式 |
|------|------|
| 列表页查看流程图（PUBLISHED） | `pnpm dev:mock` → 流程定义页 → 点击 PUBLISHED 行的"查看流程图" → 确认弹窗渲染 BPMN 图 |
| DRAFT 行按钮禁用 | 确认 DRAFT 行按钮灰色不可点击 |
| 错误处理 | 修改 mock handler 返回 2104 确认错误提示显示 |
| 对话框关闭清理 | 打开 → 关闭 → 再次打开，确认无旧图残留，控制台无报错 |
