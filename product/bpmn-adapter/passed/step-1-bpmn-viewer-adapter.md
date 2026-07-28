# Step 1：实现 bpmn adapter 查看器（Viewer）— mount/destroy/highlight + 事件回调

## 1. 当前状态

功能 `bpmn-adapter` 处于 PLANNING 阶段。Step 0（探索类，规划层只读探索）已 PASSED：探索摘要（`product/bpmn-adapter/step-0-exploration-summary.md`）确认 `adapters/bpmn/` 当前为接口壳（仅 `mountBpmn(_container, _xml?)` 和 `exportXml()` 两个方法，均 `throw new Error('not implemented')`），零消费方，`bpmn-js ^18.18.0` 已裸包安装。范围已裁定为**只读查看器（Viewer）**，非可编辑设计器（Modeler），归档为 [[decisions]] D40。本 Step 是该功能的第 1 个正式执行 Step。

## 2. Step 目标

将 `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts` 从接口壳全量重写为可用的 bpmn-js 查看器防腐层：挂载只读流程图、自适应画布、节点高亮/取消高亮、转发节点点击事件、销毁实例（幂等）。配套新建单元测试文件。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：纯前端单文件重写 + 配套测试，不涉及跨项目协议、不涉及数据库/安全/复杂并发，属于"已有模式下的功能补充"（对照已完成的 [[vue-flow-adapter]] Step 1 同类工作，当时同样选用 flash）
是否触发升级条件：否

## 4. 模型选择理由

同上第 3 项——bpmn-js 是纯 JS 库（非 Vue 组件），实现复杂度低于 vue-flow-adapter（无需 `createApp`/`h()` 渲染），且已有 vue-flow-adapter 的同构实现可直接参照代码风格（防腐层注释模式、幂等 destroy 模式、jsdom polyfill 模式）。

## 5. 已知上下文

- **架构约束**：本仓库前端采用"防腐层"模式（`adapters/`），第三方库原生 API 只允许在 adapter 文件内出现，业务层只认 adapter 导出的契约。`eslint.config.js` 已配置架构边界规则，禁止 `modules/*` 直接导入 `bpmn-js`——此规则已就位，无需改动。
- **bpmn-js 公开 API（稳定的第三方库公开接口，不涉及本仓库私有代码）**：
  - `bpmn-js` 裸包同时导出 `Viewer` 和 `Modeler` 两个构造函数，通过导入路径区分：`import BpmnViewer from 'bpmn-js/lib/Viewer'`（本 Step 只用 Viewer，不导入 Modeler）
  - `new BpmnViewer({ container: HTMLElement })` 创建实例
  - `viewer.importXML(xml: string): Promise<{ warnings: any[] }>` — 异步导入 BPMN XML 渲染到 container，XML 格式错误时 Promise 会 reject
  - `viewer.get(serviceName: string)` — bpmn-js 内部服务定位器（继承自 `diagram-js` 的 `Diagram` 基类），用于获取内部服务：
    - `viewer.get('canvas')` 返回 canvas 服务，提供 `zoom(newScale: number | 'fit-viewport')`、`addMarker(elementId: string, markerClass: string)`、`removeMarker(elementId: string, markerClass: string)`
    - `viewer.get('eventBus')` 返回事件总线服务，提供 `on(eventName: string, callback: (event) => void)`，其中 `element.click` 事件的 `event.element` 携带 `id` 和 `type` 字段
  - `viewer.destroy(): void` — 销毁实例，清理 DOM 和内部状态，可安全调用一次
- **同构参照**：`adapters/flow-graph/index.ts`（[[vue-flow-adapter]] Step 1 产出）的以下模式应在本 Step 沿用：
  - 顶部防腐层说明注释风格
  - `destroy()` 幂等实现（内部用布尔标志防止重复销毁报错）
  - 事件回调采用可选字段的 `Events` 接口（`onXxx?(...)`），调用时用可选链 `events?.onXxx?.(...)`
  - 测试文件对 jsdom 缺失的浏览器 API 用 `vi.stubGlobal` 在 `beforeEach` 内按需 polyfill，不改动全局 vitest 配置

## 6. 执行前必须读取的文件

1. `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts`（当前接口壳，12 行，待重写）
2. `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts`（同构参照，防腐层实现模式）
3. `Smart-WorkFlow-Web/src/adapters/flow-graph/index.spec.ts`（同构参照，测试模式包括 jsdom polyfill 写法）
4. `Smart-WorkFlow-Web/package.json`（确认 `bpmn-js` 版本号，当前应为 `^18.18.0`，不得新增依赖）
5. `Smart-WorkFlow-Web/eslint.config.js`（确认 `bpmn-js` 仅允许在 `adapters/bpmn/` 内导入的边界规则，执行时不得违反）
6. `node_modules/bpmn-js` 内 `Viewer`/`BaseViewer` 相关类型定义（若本地 TypeScript 类型检查对 `viewer.get()` 泛型推断不足，允许按下方 §10 约束处理，不得删除或放宽 `tsconfig` 严格性配置）

## 7. 允许修改的文件范围

- `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts`（全量重写）
- `Smart-WorkFlow-Web/src/adapters/bpmn/index.spec.ts`（新建）

不允许创建 `adapters/bpmn/` 下的其他文件（如 `setup.ts`、Vue 组件文件）——bpmn-js 不依赖 Vue 组件树，本 Step 只需单文件实现，参照 flow-graph 的 1 文件模式，不参照 form-designer 的 4 文件模式。

## 8. 禁止修改的范围

- `Smart-WorkFlow-Web/package.json`、`pnpm-lock.yaml`（`bpmn-js` 已安装，禁止新增/删除/升级任何依赖）
- `Smart-WorkFlow-Web/src/modules/workflow/`（含 `ProcessDefList.vue`）——本 Step 不涉及任何业务模块改动
- `Smart-WorkFlow-Web/src/adapters/flow-graph/`、`Smart-WorkFlow-Web/src/adapters/form-designer/`（仅供参照读取，不得修改）
- `Smart-WorkFlow-Web/eslint.config.js`、`Smart-WorkFlow-Web/vitest.config.ts`、任何全局 vitest setup 文件——本 Step 不需要也不允许改动全局测试配置
- 任何后端文件（`Smart-WorkFlow/` 目录）——本 Step 为纯前端 Step，不涉及后端

## 9. 详细执行方案

1. 打开 `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts`，删除现有 `mountBpmn`/`exportXml` 两个函数及其 TODO 注释，保留顶部防腐层说明注释（原文风格："bpmn-js 的防腐层。原生 API 只允许在本文件内出现，业务层只认下方导出的我方契约。"）
2. 在文件顶部添加导入：`import BpmnViewer from 'bpmn-js/lib/Viewer'`（只导入 Viewer，不导入 Modeler，不导入任何属性面板/moddle 扩展包）
3. 定义并导出以下类型：
   ```typescript
   export interface BpmnViewerEvents {
     onElementClick?(elementId: string, elementType: string): void
   }

   export interface BpmnViewerInstance {
     destroy(): void
     fitViewport(): void
     highlight(elementId: string, markerClass?: string): void
     clearHighlight(elementId: string, markerClass?: string): void
   }
   ```
4. 定义默认高亮 CSS 类常量：`const DEFAULT_MARKER_CLASS = 'highlight'`（`highlight`/`clearHighlight` 未传 `markerClass` 时使用此默认值）
5. 实现并导出：
   ```typescript
   export async function mountBpmnViewer(
     container: HTMLElement,
     xml: string,
     events?: BpmnViewerEvents,
   ): Promise<BpmnViewerInstance> {
     const viewer = new BpmnViewer({ container })
     await viewer.importXML(xml)

     const canvas = viewer.get('canvas') as {
       zoom: (scale: number | 'fit-viewport') => void
       addMarker: (elementId: string, markerClass: string) => void
       removeMarker: (elementId: string, markerClass: string) => void
     }
     const eventBus = viewer.get('eventBus') as {
       on: (eventName: string, callback: (event: { element: { id: string; type: string } }) => void) => void
     }

     eventBus.on('element.click', (event) => {
       events?.onElementClick?.(event.element.id, event.element.type)
     })

     let destroyed = false

     return {
       destroy() {
         if (destroyed) return
         destroyed = true
         viewer.destroy()
       },
       fitViewport() {
         canvas.zoom('fit-viewport')
       },
       highlight(elementId, markerClass = DEFAULT_MARKER_CLASS) {
         canvas.addMarker(elementId, markerClass)
       },
       clearHighlight(elementId, markerClass = DEFAULT_MARKER_CLASS) {
         canvas.removeMarker(elementId, markerClass)
       },
     }
   }
   ```
   上方 `as {...}` 类型断言写法为**建议**，若执行时发现 `bpmn-js` 自带的 `.d.ts` 已能直接推断出 `canvas`/`eventBus` 的具体类型（无需断言即可通过 `pnpm typecheck`），应优先采用库自带类型、去掉断言；只有类型推断确实不足时才保留断言兜底。不允许用 `as any` 整体绕过类型检查。
6. `mountBpmnViewer` 内部**不要** `try/catch` 吞掉 `viewer.importXML(xml)` 可能的 rejection——非法 XML 应让 Promise 直接 reject 并向上抛出，由调用方（未来消费方）决定如何处理错误，不在防腐层内静默降级
7. 不保留 `mountBpmn`（旧签名）和 `exportXml`——按 [[decisions]] D40，零消费方场景下这是安全的破坏性接口替换，无需保留兼容旧签名的包装函数或废弃标记

## 10. 关键实现约束

- **不得**引入 `bpmn-js-properties-panel`、`camunda-bpmn-moddle` 或任何设计器专用扩展包——本 Step 严格限定于只读查看器能力
- **不得**导入 `bpmn-js/lib/Modeler`——只允许导入 `bpmn-js/lib/Viewer`
- `destroy()` 必须幂等——重复调用不得抛出异常或产生副作用（参照 flow-graph `index.ts` 的幂等实现模式）
- 事件回调字段必须是可选的（`onElementClick?`），调用处必须用可选链（`events?.onElementClick?.(...)`），不得假设消费方一定传入 `events`
- `mountBpmnViewer` 必须是 `async function` 或返回 `Promise`（因 `viewer.importXML()` 是异步 API），不得用同步包装掩盖异步本质
- 不得修改或放宽 `tsconfig.json` 的严格模式配置来"绕过"类型检查问题

## 11. 边界情况

- `xml` 参数为空字符串或格式错误的 BPMN XML：`viewer.importXML()` 应 reject，`mountBpmnViewer` 的 Promise 应随之 reject，不得吞掉错误
- `highlight`/`clearHighlight` 传入不存在于当前图中的 `elementId`：允许 bpmn-js 底层自身抛出的行为原样传播，不需要在防腐层额外做存在性校验（查看器场景下调用方应确保 `elementId` 来自已渲染的图数据）
- 连续调用 `destroy()` 两次以上：第二次及以后必须是无操作（no-op），不抛出异常
- `mountBpmnViewer` 未传 `events` 参数：不得抛出异常，节点点击事件静默无回调即可

## 12. 风险和回滚方案

- **风险**：bpmn-js 底层依赖浏览器 SVG API，jsdom 测试环境可能缺失某些 API（例如 `SVGElement.prototype.getBBox` 或类似），导致 `importXML` 在测试中抛出非预期错误
  - **应对**：若测试执行中遇到此类 jsdom 缺失 API 报错，在 `index.spec.ts` 的 `beforeEach` 内用 `vi.stubGlobal` 或对 `SVGElement.prototype` 的对应方法做局部 mock 补齐（参照 flow-graph `index.spec.ts` 对 `ResizeObserver` 的 polyfill 写法），**不得**修改全局 vitest 配置或新增全局 setup 文件
- **回滚步骤**：若本 Step 实现后四连校验门（`pnpm typecheck && pnpm lint && pnpm test && pnpm build`）任一环节失败且无法在本 Step 范围内修复，回滚 `adapters/bpmn/index.ts` 和 `index.spec.ts` 至 Step 前状态（即接口壳），在执行回执中如实报告失败原因，不擅自扩大修改范围或跳过校验门
- **回滚验证**：回滚后重新运行四连校验门，确认恢复到 Step 前的全绿状态（57 files / 497 tests）

## 13. 测试方案

### 13.1 静态检查

- `pnpm typecheck` 零新增类型错误
- `pnpm lint` 零新增 ESLint 告警（含架构边界规则：确认 `adapters/bpmn/index.ts` 是唯一导入 `bpmn-js` 的文件）
- grep 确认 `mountBpmn`（旧签名，不含 Viewer 后缀）与 `exportXml` 两个旧导出符号在全仓库前端代码中零命中残留引用（本身零消费方，预期只有 adapter 自身旧代码，重写后应清零）

### 13.2 单元测试

新建 `Smart-WorkFlow-Web/src/adapters/bpmn/index.spec.ts`，至少覆盖以下场景（参照 flow-graph 6 场景的最低标准，本 Step 场景需覆盖异步与错误路径，允许多于 6 个）：

1. 使用一段合法的最小 BPMN XML 字符串挂载，`mountBpmnViewer` 的 Promise 正常 resolve，返回的实例包含 `destroy`/`fitViewport`/`highlight`/`clearHighlight` 四个函数
2. 传入 `events.onElementClick` 回调，触发 bpmn-js `element.click` 事件后，回调被调用且收到正确的 `elementId`/`elementType`（可通过直接调用 viewer 内部 eventBus 触发，或通过模拟点击 DOM 元素触发，两种方式任选其一，需在测试中明确写出触发路径）
3. 调用 `destroy()` 后，`container` 内部由 bpmn-js 生成的 DOM 内容被清空
4. 连续调用 `destroy()` 两次，第二次不抛出异常
5. 调用 `highlight(elementId)` 和 `clearHighlight(elementId)` 不抛出异常（不强制断言 DOM class 变化细节，只验证调用链路通畅，避免测试和 bpmn-js 内部实现细节过度耦合）
6. 调用 `fitViewport()` 不抛出异常
7. 传入格式错误的 XML 字符串（如空字符串或非 XML 文本），`mountBpmnViewer` 返回的 Promise 应 reject（用 `await expect(mountBpmnViewer(...)).rejects.toThrow()` 或等价断言）

若上述场景在 jsdom 环境下因浏览器 API 缺失无法直接运行，按 §12 风险应对方案补齐 polyfill 后继续覆盖，不得删减场景数量或跳过（`it.skip`）来规避问题。

### 13.3 集成测试

不适用——本 Step 为零消费方的纯 adapter 层实现，无跨模块集成场景。

### 13.4 手工验证

不适用——本 Step 无 UI 页面改动，bpmn-js 挂载效果的可视化验证留给未来 Step 3（`ProcessDefList.vue` 新增查看入口）时进行。

### 13.5 回归检查

- 前端四连校验门（`pnpm typecheck && pnpm lint && pnpm test && pnpm build`）全部通过
- 测试总数不应减少，且应比当前基线（57 files / 497 tests）增加至少 1 个文件、至少 7 个测试用例（对应 §13.2 的 7 个场景）

## 14. 验收标准

1. `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts` 不再包含 `throw new Error('not implemented')`，`mountBpmn`/`exportXml` 旧签名已被移除
2. 新导出符号 `mountBpmnViewer`、`BpmnViewerEvents`、`BpmnViewerInstance` 均存在且签名与 §9 第 3/5 步一致（`mountBpmnViewer` 返回 `Promise<BpmnViewerInstance>`）
3. 仅 `bpmn-js/lib/Viewer` 被导入，未导入 `bpmn-js/lib/Modeler` 或任何设计器专用扩展包
4. `Smart-WorkFlow-Web/src/adapters/bpmn/index.spec.ts` 已新建，且 §13.2 所列 7 个测试场景全部存在并通过
5. `destroy()` 幂等性已有对应测试用例覆盖并通过
6. 非法 XML 输入导致 Promise reject 的路径已有对应测试用例覆盖并通过
7. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 四连全部通过（退出码 0）
8. 测试总数相比当前基线（57 files / 497 tests）只增不减
9. `Smart-WorkFlow-Web/package.json`、`pnpm-lock.yaml` 无任何改动（`git diff` 确认零改动）
10. `Smart-WorkFlow-Web/src/modules/workflow/` 目录下无任何文件被修改

## 15. 执行回执格式

按 system.md §7.1 全部 13 项返回，不得省略。第 4 项"实际修改的文件"须逐文件列出（预期仅 2 个文件：`index.ts` 修改 + `index.spec.ts` 新建）；第 6/7 项须包含 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 四条命令的完整输出摘要（含测试总数）；第 12 项 Git diff 摘要须包含改动文件数、新增/删除行数。

## 16. 测试回执格式

按 system.md §7.2 全部 12 项返回，不得省略。第 5 项"各测试项结果"须逐条列出 §13.2 的 7 个测试场景名称及各自通过/失败结果；第 10 项须逐条对照本方案 §14 的 10 条验收标准分别回答"满足"或"不满足"并给出依据；第 12 项最终结论只能是 PASSED / FAILED / BLOCKED 三者之一。

## 17. 明确禁止事项

- 不要顺手实现 `exportXml` 或任何导出能力——本 Step 明确排除设计器相关能力
- 不要顺手在 `modules/workflow/ProcessDefList.vue` 或任何业务模块中添加对本 adapter 的引用或"演示用法"——本 Step 保持零消费方状态，消费方接入是后续独立 Step
- 不要新增、升级或删除 `package.json` 中的任何依赖（`bpmn-js` 已满足需求）
- 不要修改 `eslint.config.js`、`vitest.config.ts` 或新增全局测试 setup 文件
- 不要修改 `adapters/flow-graph/`、`adapters/form-designer/` 中的任何文件（仅供参照读取）
- 不要触碰任何后端文件（`Smart-WorkFlow/` 目录）
- 不要在回执中预告、猜测或征询下一个 Step（Step 2 后端端点/Step 3 UI 入口/Step 4 监控页面）的范围与内容——按 system.md §0.3 硬约束，下一个 Step 何时开始、内容为何，只能由规划层判断并主动下发
- 不要在对话或回执中提出方案设计建议、修改本方案的邀请，或任何形式的规划性发言——发现方案有误时，唯一正确做法是在回执中明确报告问题，由规划层修正方案后重新下发
