# Step 1：实现 flow-graph adapter（mount/export/destroy + 事件回调）

## 1. 当前状态

功能 `vue-flow-adapter` 的 Step 0（规划层自身会话内只读探索）已 PASSED，探索摘要见
`product/vue-flow-adapter/step-0-exploration-summary.md`（规划层不下发此文件，仅供背景参考）。
Step 0 已确认：Vue Flow adapter 的目标场景是 **M07 AI 调度图可视化**（AI agent 任务编排），
非表单设计器场景（表单设计器已由 `@form-create/designer` 完整覆盖，与本 Step 无关）。
本 Step 是本功能唯一的正式执行 Step，通过后功能即可收尾。

## 2. Step 目标

将 `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts` 从接口壳
（`throw new Error('not implemented')`）实现为真实可用的 Vue Flow 防腐层，
提供：挂载画布、导出当前图数据、销毁实例、转发基础交互事件。配套单元测试。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：接口契约、字段名、方法签名、测试用例均已在本方案中完全钉死，无跨项目联动、
无数据库设计、无鉴权、无复杂并发或状态一致性问题，属于"已有模式下的功能补充"
（严格参照 adapters/bpmn/ 的函数拆分粒度）。
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 不涉及架构决策——数据模型、方法签名、事件命名均已在 §9 精确给出，执行代理只需照方案实现和写测试，不需要自行做技术选型或权衡。

## 5. 已知上下文

- **场景裁决（CONFIRMED，Step 0 + [[decisions]] D39）**：Vue Flow 定位为 M07 AI 调度图可视化，非表单设计器场景。当前无任何业务模块消费 `adapters/flow-graph/`（CONFIRMED 全仓库 grep 零命中），`sw-basic-agent` 后端仅为 AutoConfiguration 占位——本 Step 完成后短期内不会有消费方调用，这是预期状态，不是遗漏。
- **防腐层约定**：`adapters/*` 是第三方库（此处 `@vue-flow/core`）的唯一合法调用点。`@vue-flow/core` 原生 API（`VueFlow` 组件、`Node`/`Edge`/`Connection` 类型等）只允许出现在 `adapters/flow-graph/index.ts` 内，不得泄漏到 `modules/*`。ESLint 已有规则强制业务层禁止直引 `@vue-flow/*`（`eslint.config.js`，Step 0 已确认），本 Step 不需要新增 ESLint 规则。
- **参照 `adapters/bpmn/index.ts`（现状，8 行，两个导出函数）**：
  ```ts
  export function mountBpmn(_container: HTMLElement, _xml?: string): void {
    throw new Error('not implemented')
  }
  export function exportXml(): Promise<string> {
    throw new Error('not implemented')
  }
  ```
  本 Step 的接口设计沿用"mount 时可传入初始数据 + 独立 export 函数"的拆分粒度，但新增 `destroy()`
  生命周期方法——这是必要的技术偏离（不是无依据的自由发挥）：Vue Flow 的挂载方式是命令式创建一个
  Vue 子应用（`createApp` + `.mount()`），子应用创建后必须有对应的 `.unmount()` 出口，否则容器
  DOM 被移除或组件重新挂载时会产生残留的 Vue app 实例，造成内存泄漏。bpmn-js 的 `mountBpmn` 目前
  是桩函数，未来实现时若使用 bpmn-js 自带的 `modeler.destroy()`，也会面临同样的生命周期问题，
  但那是 BPMN adapter 独立功能的方案范畴，本 Step 不涉及、不修改 `adapters/bpmn/`。
- **依赖版本（CONFIRMED，Step 0）**：`package.json` 仅安装 `@vue-flow/core@^1.48.2`，未安装
  `@vue-flow/background`/`@vue-flow/controls`/`@vue-flow/minimap`。本 Step **不新增任何依赖**，
  不修改 `package.json`。

## 6. 执行前必须读取的文件

按优先级排序：

1. `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts`（当前接口壳，待重写）
2. `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts`（结构参照，仅读不改）
3. `Smart-WorkFlow-Web/src/adapters/form-designer/index.spec.ts`（测试写法参照：`describe`/`it`/`vi`/`afterEach` 风格）
4. `Smart-WorkFlow-Web/package.json`（确认 `@vue-flow/core` 版本号、`vue`/`vitest`/`@vue/test-utils` 版本，不得新增依赖）
5. `Smart-WorkFlow-Web/eslint.config.js`（确认 `modules/*` 禁止直引 `@vue-flow/*` 的规则位置，不需修改，仅确认本 Step 改动不触发该规则——因为改动本身就在 `adapters/` 内）
6. `node_modules/@vue-flow/core/dist/vue-flow-core.d.ts`（或该包 `package.json` 的 `types` 字段指向的类型声明文件）——确认 `VueFlow` 组件 props（`nodes`/`edges`/`fit-view-on-init` 等）与 `Node`/`Edge`/`Connection` 类型的真实导出名称和字段形状。**若本方案 §9 中列出的类型字段名与该包实际导出不一致，以实际类型声明为准，在执行回执 §8「与原方案的偏差」中如实记录差异**。

## 7. 允许修改的文件范围

- `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts`（重写，替换全部现有内容）
- `Smart-WorkFlow-Web/src/adapters/flow-graph/index.spec.ts`（新建）

不允许新建除以上两个文件之外的任何文件（包括不新建 `types.ts`——类型定义与实现同放在 `index.ts` 内，与 `adapters/bpmn/index.ts` 单文件风格保持一致）。

## 8. 禁止修改的范围

- `Smart-WorkFlow-Web/src/adapters/bpmn/`（结构参照对象，不得改动）
- `Smart-WorkFlow-Web/src/adapters/form-designer/`（测试写法参照对象，不得改动）
- `Smart-WorkFlow-Web/src/modules/`（本功能零消费方，不涉及任何业务模块）
- `Smart-WorkFlow-Web/package.json`、`pnpm-lock.yaml`（不新增/升级/删除任何依赖）
- `Smart-WorkFlow-Web/eslint.config.js`、`vite.config.ts`、任何路由/菜单配置文件
- `Smart-WorkFlow/`（后端仓库，本 Step 域为纯前端，禁止读写）

## 9. 详细执行方案

### 9.1 `index.ts` 目标接口契约（精确签名，不得自由发挥）

```ts
/**
 * @vue-flow/core 的防腐层。原生 API 只允许在本文件内出现，业务层只认下方导出的我方契约。
 */
import { createApp, type App as VueApp } from 'vue'
import { VueFlow, type Node as VFNode, type Edge as VFEdge, type Connection } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'

export interface FlowGraphNode {
  id: string
  type?: string
  label?: string
  position: { x: number; y: number }
  data?: Record<string, unknown>
}

export interface FlowGraphEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface FlowGraphData {
  nodes: FlowGraphNode[]
  edges: FlowGraphEdge[]
}

export interface FlowGraphEvents {
  onNodeClick?: (node: FlowGraphNode) => void
  onEdgeCreate?: (edge: FlowGraphEdge) => void
  onGraphChange?: (data: FlowGraphData) => void
}

export interface FlowGraphInstance {
  exportGraph(): FlowGraphData
  destroy(): void
}

export function mountFlowGraph(
  container: HTMLElement,
  initialData?: FlowGraphData,
  events?: FlowGraphEvents,
): FlowGraphInstance {
  // 具体实现见 9.2
}
```

字段命名和函数签名必须与上方一致（这是业务契约，不是示例）。如果 §6 第 6 项读取
`@vue-flow/core` 真实类型声明后发现 `Node`/`Edge`/`Connection` 的字段形状与预期不同
（例如字段名不是 `position`/`source`/`target`），**以实际类型声明为准调整内部转换逻辑**，
但导出的 `FlowGraphNode`/`FlowGraphEdge`/`FlowGraphData`/`FlowGraphEvents`/`FlowGraphInstance`
契约本身（即"我方对外契约"）不因此改变——防腐层存在的意义就是隔离第三方库形状变化。

### 9.2 `mountFlowGraph` 实现要点

1. 内部用一个包裹组件（可以是内联的 `defineComponent`/`h()` 渲染函数，不新建 `.vue` 文件）渲染
   `<VueFlow :nodes="..." :edges="..." @node-click="..." @connect="..." @nodes-change="..." @edges-change="...">`，
   `nodes`/`edges` 的初始值来自 `initialData`（若未传则为空数组 `[]`）。
2. 用 `createApp(WrapperComponent).mount(container)` 完成挂载，保存返回的 `VueApp` 实例引用（闭包变量，不用模块级单例——同一 adapter 文件应支持多次调用 `mountFlowGraph` 各自独立，不能像 bpmn 桩函数那样假设全局只有一个实例）。
3. 内部维护当前 `FlowGraphData`（`nodes`/`edges` 的响应式引用，如 `ref<FlowGraphNode[]>`/`ref<FlowGraphEdge[]>`），Vue Flow 的原生事件（节点位置拖拽、连线创建/删除）需要同步更新这份内部状态，这样 `exportGraph()` 才能返回最新数据。
4. 事件转发：
   - `@node-click="(e) => events?.onNodeClick?.(toFlowGraphNode(e.node))"`（需要把 Vue Flow 原生 `Node` 对象转换为我方 `FlowGraphNode` 形状的内部转换函数，函数名建议 `toFlowGraphNode`）
   - `@connect="(connection: Connection) => { /* 生成新 FlowGraphEdge，push 进内部 edges 状态，再调用 events?.onEdgeCreate?.(edge) */ }`
   - 节点位置变化或增删（`@nodes-change`/`@edges-change`）→ 更新内部状态后调用 `events?.onGraphChange?.(currentData)`
5. 返回的 `FlowGraphInstance`：
   - `exportGraph()`：把内部 `nodes`/`edges` 响应式状态转换回 `FlowGraphData` 纯对象（`.value` 解包，深拷贝或直接结构化返回均可，只要返回值不是 Vue 响应式 Proxy 本身——避免调用方拿到 reactive 对象产生意外副作用）
   - `destroy()`：调用 `app.unmount()`。必须允许重复调用不抛异常（第二次调用应是无操作，不重复 unmount 导致报错）——可用一个内部布尔标记（如 `let destroyed = false`）防止重复 unmount。

### 9.3 类型转换辅助函数

在 `index.ts` 内部（不导出）实现：
- `toFlowGraphNode(node: VFNode): FlowGraphNode` — 把 Vue Flow 原生节点对象映射为我方 `FlowGraphNode` 形状
- `toFlowGraphEdge(edge: VFEdge): FlowGraphEdge` — 同理
- 若 §6 第 6 项确认的真实字段名与此处假设不同，转换函数内部据实调整，对外导出类型形状不变（见 9.1 末尾说明）

### 9.4 `index.spec.ts` 测试用例

参照 `adapters/form-designer/index.spec.ts` 的 `describe`/`it`/`vi`/`afterEach` 风格，覆盖：

1. `mountFlowGraph` 在 jsdom 创建的 `document.createElement('div')` 容器上挂载不抛异常，返回的实例包含 `exportGraph`/`destroy` 两个函数
2. 传入 `initialData`（1 个节点 + 1 条边）后立即调用 `exportGraph()`，返回的节点/边数量与传入一致，`id` 字段一一对应
3. 不传 `initialData` 时 `exportGraph()` 返回 `{ nodes: [], edges: [] }`
4. 调用 `destroy()` 后容器内 DOM 被清空（`container.innerHTML` 为空或不再包含 Vue Flow 渲染的元素）
5. 调用 `destroy()` 两次不抛异常（幂等）
6. 传入 `events.onGraphChange` 回调，通过 `wrapper` 或直接调用内部暴露的测试钩子触发一次图变化后，断言回调被调用过——若 Vue Flow 组件事件在 jsdom 环境下不易通过真实指针交互触发，允许改为：直接构造一个新的 `FlowGraphData` 调用某种可测试的内部更新路径（如果 9.2 实现中有暴露更新方法），或至少断言 `events` 参数被正确传递到内部组件 props/监听器上（检查渲染出的 `VueFlow` 组件收到的 props 中包含对应的事件处理函数引用）。**若真实实现后发现某个事件在 jsdom 下确实无法可靠触发和断言，在执行回执 §9「遇到的问题」中说明具体原因，改为断言"事件处理函数已正确挂载"级别的弱一些的断言，不得跳过该测试用例不写。**

## 10. 关键实现约束

- **原生 API 不出圈**：`@vue-flow/core` 的任何导入（`VueFlow` 组件、`Node`/`Edge`/`Connection` 类型等）只能出现在 `adapters/flow-graph/index.ts` 内，不得在 `index.spec.ts` 中直接导入 `@vue-flow/core` 的内部实现细节做断言（测试只能通过本文件导出的 `mountFlowGraph`/`FlowGraphData` 等契约来验证行为）。
- **不引入模块级单例状态**：不使用模块级 `let activeApp` 之类的全局变量保存挂载实例——每次 `mountFlowGraph` 调用必须返回独立的 `FlowGraphInstance`，闭包内部状态不与其他调用共享（这是本 Step 与 bpmn 桩函数假设"全局只有一个实例"的关键设计差异，必须遵守）。
- **`destroy()` 幂等**：见 §9.2 第 5 点，不得因重复调用抛出未捕获异常。
- **不导出任何 `@vue-flow/core` 原生类型**（如直接 `export type { Node } from '@vue-flow/core'`）——业务层只能看到 `FlowGraphNode`/`FlowGraphEdge` 等我方契约类型。

## 11. 边界情况

- `initialData` 为 `undefined` → 以空图（`{ nodes: [], edges: [] }`）挂载，不抛异常
- `initialData.nodes`/`initialData.edges` 为空数组 → 同上，合法输入
- `events` 为 `undefined` → 各事件回调调用点需判空（`events?.onXxx?.(...)`），不因未传 `events` 而报错
- `container` 已经挂载过其他内容（非空 DOM）→ 不需要特殊清空逻辑，`createApp().mount(container)` 会替换容器内容，这是 Vue 的标准行为，不需要额外处理
- 重复调用 `destroy()` → 见 §10，幂等

## 12. 风险和回滚方案

- **风险**：`@vue-flow/core` 真实类型声明与 §9.1 假设的字段形状不符，导致 TypeScript 编译报错。
  **应对**：按 §6 第 6 项要求先读真实类型声明再写实现，若确有差异按 §9.1 末尾说明调整内部转换逻辑，对外契约不变，并在执行回执中记录差异。
- **风险**：jsdom 环境下 Vue Flow 的 Canvas/SVG 渲染依赖的浏览器 API（如 `ResizeObserver`）未 polyfill，导致测试报错。
  **应对**：若 `pnpm test` 报出具体的浏览器 API 缺失错误，检查项目现有 `vitest.config.ts`/`setupTests` 是否已有相关 polyfill（其他前端项目常见的 mock 方式），若没有则在 `index.spec.ts` 内用 `vi.stubGlobal` 或等价方式局部 mock 缺失的浏览器 API，不修改全局 vitest 配置文件。若该问题导致某个测试用例无法可靠通过，在执行回执 §9「遇到的问题」和 §10「未完成内容」中如实说明，不得静默跳过或删除测试用例。
- **回滚方案**：本 Step 只修改 2 个文件（`index.ts` 重写 + `index.spec.ts` 新建），且当前无任何消费方引用该 adapter，回滚只需 `git checkout` 还原 `index.ts` 为接口壳原文、删除 `index.spec.ts`，不影响任何其他模块。

## 13. 测试方案

### 13.1 静态检查

- `pnpm typecheck`：0 错误
- `pnpm lint`：0 新增告警（含 `modules/*` 禁止直引 `@vue-flow/*` 规则——本 Step 不改动 `modules/*`，不应触发该规则；但需确认 `adapters/flow-graph/index.ts` 自身的改动不违反其他既有 ESLint 规则）
- grep 检查：`grep -rn "not implemented" Smart-WorkFlow-Web/src/adapters/flow-graph/` 应零命中（确认桩代码已完全替换）

### 13.2 单元测试

- 按 §9.4 列出的 6 个测试点全部实现并通过
- 新增测试文件仅 1 个（`index.spec.ts`），测试用例数量在执行回执中如实报告

### 13.3 集成测试

不适用——本 Step 零消费方，没有跨模块集成场景。

### 13.4 手工验证

不适用——本 Step 无路由/菜单入口、无可视化 UI 入口，无法通过 `pnpm dev`/`pnpm dev:mock` 肉眼验收（这是预期状态，不是遗漏，参照 §5 已知上下文说明）。

### 13.5 回归检查

- `pnpm test` 全量测试通过数应等于「当前基线 + 本 Step 新增测试数」，不得有任何既有测试用例数量减少或失败
- 当前前端基线：CONFIRMED 56 spec files / 491 tests（见 `knowledge/current-status.md` §9），执行回执需报告新基线

## 14. 验收标准

逐条可验证条件：

1. `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts` 中不再存在 `throw new Error('not implemented')`（grep 零命中）
2. `index.ts` 导出 `mountFlowGraph`、`FlowGraphNode`、`FlowGraphEdge`、`FlowGraphData`、`FlowGraphEvents`、`FlowGraphInstance` 六个符号，签名与 §9.1 一致（或按 §9.1 末尾说明的合理调整，且已在回执中记录差异原因）
3. `mountFlowGraph` 返回的实例具备 `exportGraph()`、`destroy()` 两个方法
4. 新建 `index.spec.ts`，包含 §9.4 列出的全部 6 个测试场景（或对场景 6 采用 §9.4 允许的弱化断言变体，并说明原因）
5. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 四连全部退出码为 0
6. `pnpm test` 测试总数 ≥ 基线 491 + 本 Step 新增数（不得有既有测试失败或减少）
7. `package.json`、`pnpm-lock.yaml` 无任何改动（`git diff` 确认）
8. 除 §7 允许范围内的 2 个文件外，无其他文件被修改（`git status`/`git diff --stat` 确认）

## 15. 执行回执格式

按根目录 `system.md` §7.1 的 13 项结构提供，额外要求：

- §3「实际读取的文件」中必须明确报告 §6 第 6 项读取 `@vue-flow/core` 真实类型声明的结果（字段名是否与 §9.1 假设一致）
- §8「与原方案的偏差」中如涉及类型字段名调整、事件触发方式弱化等，必须逐条说明原因
- §12「Git diff 摘要」必须明确只涉及 §7 允许范围内的 2 个文件

## 16. 测试回执格式

按根目录 `system.md` §7.2 的 12 项结构提供，§10「是否满足验收标准」必须逐条对照本方案 §14 的 8 条标准逐一回答。

## 17. 明确禁止事项

- 不要新增 `@vue-flow/background`/`@vue-flow/controls`/`@vue-flow/minimap` 等依赖
- 不要新建除 `index.ts`/`index.spec.ts` 之外的任何文件（不新建 `.vue` 组件文件、不新建 `types.ts`）
- 不要修改 `adapters/bpmn/` 或 `adapters/form-designer/`（仅供参照读取）
- 不要在业务模块（`modules/*`）中新增任何对 `adapters/flow-graph/` 的引用或演示用法——本 Step 不创建消费方
- 不要新增路由、菜单项或任何可通过 UI 访问的入口
- 不要"顺手"修复本方案之外的其他已知问题或重构其他文件
- 不要将 `@vue-flow/core` 原生类型（`Node`/`Edge`/`Connection` 等）导出给业务层
- 完成本 Step 并写完回执后，不对下一个 Step（若有）的存在、编号或范围做任何预告或征询——按根目录 system.md §0.3 硬约束，下一步由规划层判断
