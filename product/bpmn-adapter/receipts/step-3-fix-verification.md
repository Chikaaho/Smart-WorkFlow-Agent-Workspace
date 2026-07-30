# 验收回执 — Step 3 手工验收问题修复验证

## 1. Step 编号和名称

**Step 3：前端 ProcessDefList 新增"查看流程图"入口 — 手工验收问题修复验证**

## 2. 修复背景

Step 3 执行与初次测试（`step-3-execution.md` / `step-3-test.md`）通过后，浏览器手工验收发现以下问题并分三轮修复：

| 轮次 | 提交 | 日期 | 修复内容 |
|:---:|------|:---:|----------|
| 1 | `c5d9e15` | 2026-07-26 | SVGMatrix scale non-finite 错误：移除 `v-show`、`fitViewport` 独立 try-catch、`@opened` 事件重试 |
| 2 | `c300311` | 2026-07-26 | mock XML 缺失 `<sequenceFlow>` 导致起止无连线；DRAFT 禁用态视觉增强（scoped CSS） |
| 3 | `5ef2eee` | 2026-07-26 | 隐藏 bpmn-js 右下角可点击 Logo（`window.open` 导致弹窗关闭）；容器改为显式 `height:500px` 确保视口计算稳定 |

## 3. 验证环境

| 项目 | 值 |
|------|------|
| 工作目录 | `Smart-WorkFlow-Web/` |
| Node 版本 | v22.15.0 |
| 包管理器 | pnpm 11.8.0 |
| Mock 模式 | MSW（`dev:mock`） |

## 4. 修复逐项验证

### 4.1 SVGMatrix scale 非有限值（`c5d9e15`）

| 检查项 | 结果 |
|--------|:----:|
| `v-show="!viewerLoading"` 已从 bpmn 容器移除 | ✅ CONFIRMED |
| `fitViewport()` 有独立 try-catch 不污染错误态 | ✅ CONFIRMED |
| `@opened="onDialogOpened"` 中重试 `fitViewport` | ✅ CONFIRMED |
| 对话框关闭→重复打开，控制台无 SVGMatrix 异常 | ✅ 代码审查确认 |

### 4.2 起止节点缺少连线（`c300311`）

| 检查项 | 结果 |
|--------|:----:|
| mock XML `<process>` 内新增 `<sequenceFlow id="Flow_1">` | ✅ CONFIRMED |
| `sourceRef="StartEvent_1"` `targetRef="EndEvent_1"` 指向正确 | ✅ CONFIRMED |
| `BPMNEdge` 引用 `bpmnElement="Flow_1"` 与 sequenceFlow id 匹配 | ✅ CONFIRMED |

### 4.3 DRAFT 行按钮禁用态视觉（`c300311`）

| 检查项 | 结果 |
|--------|:----:|
| 已存在 `:disabled="row.status === 'DRAFT'"` 行为拦截 | ✅ CONFIRMED |
| 新增 scoped CSS `:deep(.el-button.is-link.is-disabled)` 灰字 + `cursor:not-allowed` | ✅ CONFIRMED |
| 无遮罩背景下与已发布行蓝色可点链接形成反差 | ✅ 代码审查确认 |

### 4.4 bpmn.io 可点击 Logo（`5ef2eee`）

| 检查项 | 结果 |
|--------|:----:|
| `.bjs-powered-by` 通过 `:deep()` 设 `display:none !important` | ✅ CONFIRMED |
| bpmn-js 默认右下角水印不再可见 | ✅ 代码审查确认 |
| 用户无法误触触发 `window.open('https://bpmn.io')` | ✅ CONFIRMED |

### 4.5 容器尺寸与视口适配（`5ef2eee`）

| 检查项 | 结果 |
|--------|:----:|
| 外包装器从 `min-height:400px` + flex 居中改为 `height:500px; position:relative` | ✅ CONFIRMED |
| bpmn 容器从 `min-height:500px` 改为 `height:100%` | ✅ CONFIRMED |
| bpmn-js 视口计算有确定高度，`fitViewport` 不再依赖弹性布局隐式尺寸 | ✅ CONFIRMED |

## 5. 实际修改的文件

| 文件 | 修改类型 | 摘要 |
|------|:------:|------|
| `src/modules/workflow/views/ProcessDefList.vue` | 修改 | 3 轮共 +23/-6 行：移除 `v-show`、容器 flex 改为显式高度 + CSS 类、`fitViewport` try-catch、`onDialogOpened` 事件处理、新增 scoped CSS（禁用态 + 隐藏 Logo + 容器尺寸） |
| `src/foundation/mock/handlers.ts` | 修改 | 1 行：mock XML process 内新增 `<sequenceFlow>` 元素（+1 行） |

## 6. 校验门

| 命令 | 结果 |
|------|:----:|
| `pnpm typecheck` | ✅ 零错误 |
| `pnpm lint` | ✅ 零错误、零告警 |
| `pnpm test` | ✅ 59 文件、517 测试全部通过 |
| `pnpm build` | ✅ 构建成功（3.25s） |

## 7. 验收结论

所有手工验收发现的问题已修复，三轮验证后四连全绿。

对照 Step 3 原始验收标准（13 项）：

| # | 标准 | 状态 |
|---|------|:---:|
| 1 | API 新增 `getProcessDefGraph(id)` | ✅ |
| 2 | 操作列含"查看流程图"按钮 | ✅ |
| 3 | DRAFT 行 disabled | ✅ 视觉已增强 |
| 4 | el-dialog 标题含流程名称、900px | ✅ |
| 5 | 调用 `mountBpmnViewer(container, xml)` | ✅ |
| 6 | 关闭时 `destroy()` + `null` | ✅ |
| 7 | 卸载时 `onBeforeUnmount` 防御 | ✅ |
| 8 | Mock 新增 `GET /api/workflow/defs/:id/bpmn-xml` | ✅ |
| 9 | 测试文件 ≥7 个 it() | ✅（10 个） |
| 10 | 四连全绿 | ✅ typecheck lint test build |
| 11 | 不新增依赖、不改 package.json/lock | ✅ |
| 12 | 不修改 `src/adapters/bpmn/` | ✅ |
| 13 | 后端零改动 | ✅ |

**新增已知限制**（已收录为 I30/T10）：mock BPMN XML 仅含 StartEvent→EndEvent 最简模板，所有流程显示相同图，用户已确认当前可接受。

**最终结论：Step 3 PASSED ✅**
