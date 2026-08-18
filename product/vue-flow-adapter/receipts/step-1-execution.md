# 执行回执

## 1. Step 编号和名称

Step 1：实现 flow-graph adapter（mount/export/destroy + 事件回调）

## 2. 使用模型

- 模型：deepseek-v4-flash
- 模型选择：方案指定 deepseek-v4-flash，无 Pro 触发条件

## 3. 实际读取的文件

| # | 文件 | 是否读取 | 备注 |
|---|------|----------|------|
| 1 | `src/adapters/flow-graph/index.ts` | ✅ | 当前接口壳（8 行），已完全重写 |
| 2 | `src/adapters/bpmn/index.ts` | ✅ | 结构参照，函数拆分粒度一致 |
| 3 | `src/adapters/form-designer/index.spec.ts` | ✅ | 测试写法参照：`describe`/`it`/`vi`/`afterEach` 风格 |
| 4 | `package.json` | ✅ | `@vue-flow/core@^1.48.2` 确认，未新增依赖 |
| 5 | `eslint.config.js` | ✅ | `@vue-flow/*` 限制规则在 `adapters/` 内不受影响 |
| 6 | `@vue-flow/core` 类型声明 | ✅ | 检查了 `node.d.ts`/`edge.d.ts`/`connection.d.ts`/`flow.d.ts`/`hooks.d.ts` |

**§6 第 6 项检查结果（@vue-flow/core 真实类型声明）：**

- `Node<Data, CustomEvents, Type>`: `id: string` ✅, `position: XYPosition` (= `{ x: number; y: number }`) ✅, `type?: Type` ✅, `label?: string | VNode | Component` ✅（我方契约 label 为 `string`，已在 `toFlowGraphNode` 中做 `typeof === 'string'` 过滤）, `data?: Data` ✅
- `Edge<Data, CustomEvents, Type>` (union: `DefaultEdge | SmoothStepEdgeType | BezierEdgeType`): `id: string` ✅, `source: string` ✅, `target: string` ✅, `label?: string | VNode | Component` ✅（同上做 string 过滤）
- `Connection`: `source: string` ✅, `target: string` ✅, `sourceHandle?: string | null` ✅, `targetHandle?: string | null` ✅
- `NodeMouseEvent`: `{ event: MouseTouchEvent; node: GraphNode }` ✅ — `@node-click` 事件通过 `e.node` 获取原生节点对象
- `FlowEmits`: `nodeClick` → `onNodeClick`, `connect` → `onConnect`, `update:nodes` → `'onUpdate:nodes'` ✅

**结论：§9.1 协议字段名与 @vue-flow/core v1.48.2 真实类型声明一致，无需调整。**

## 4. 实际修改的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/adapters/flow-graph/index.ts` | 重写 | 从 8 行接口壳重写为 147 行完整实现 |
| `src/adapters/flow-graph/index.spec.ts` | 新建 | 创建 6 个测试场景，符合 §9.4 |

**无其他文件被修改**（已验证：git status 只显示上述 2 个文件 + 会话启动前已存在的 `docs/governance/engineering-constitution.md` 变更）。

## 5. 每个文件的修改摘要

### `src/adapters/flow-graph/index.ts`

- **导出类型（§9.1 契约）**：
  - `FlowGraphNode` — 节点类型，含 `id`/`type`/`label`/`position`/`data`
  - `FlowGraphEdge` — 边类型，含 `id`/`source`/`target`/`label`
  - `FlowGraphData` — 图数据容器 `{ nodes, edges }`
  - `FlowGraphEvents` — 事件回调接口 `onNodeClick`/`onEdgeCreate`/`onGraphChange`
  - `FlowGraphInstance` — 实例接口 `exportGraph()`/`destroy()`
  - `mountFlowGraph(container, initialData?, events?)` — 主入口

- **内部类型转换函数**（不导出）：
  - `toFlowGraphNode(node: VFNode): FlowGraphNode` — 将 Vue Flow 原生 `Node` 映射为我方类型，label 做 `typeof === 'string'` 保护
  - `toFlowGraphEdge(edge: VFEdge): FlowGraphEdge` — 同理映射 `Edge`

- **`mountFlowGraph` 实现**（§9.2）：
  - 使用 `ref<FlowGraphNode[]>` / `ref<FlowGraphEdge[]>` 维护内部响应式状态
  - 内联 `defineComponent` 通过 `h()` 渲染函数渲染 `<VueFlow>`
  - 事件转发：
    - `onNodeClick` → `events?.onNodeClick?.(toFlowGraphNode(event.node))`
    - `onConnect` → 生成新 `FlowGraphEdge`，push 进 edges 状态，触发 `onEdgeCreate` + `onGraphChange`
    - `onUpdate:nodes` → 同步 nodes 状态 + `onGraphChange`
    - `onUpdate:edges` → 同步 edges 状态 + `onGraphChange`
  - 返回 `FlowGraphInstance`：
    - `exportGraph()` — 深拷贝（`{ ...n }`）返回当前 nodes/edges 纯对象
    - `destroy()` — 幂等：内部 `destroyed` 布尔标记防止重复 unmount

- **边界处理**（§11）：
  - `initialData` 为 `undefined` → 空数组兜底 `?? []`
  - `events` 为 `undefined` → 可选链 `?.()`
  - `destroy()` 重复调用 → `destroyed` 标记，第二次直接 return
  - 不引入模块级单例状态；每次 `mountFlowGraph` 调用独立闭包

### `src/adapters/flow-graph/index.spec.ts`

- 6 个测试场景（§9.4）：
  1. 挂载不抛异常，实例含 `exportGraph`/`destroy`
  2. 传入 `initialData`（1 node + 1 edge），`exportGraph()` 返回数据一致
  3. 不传 `initialData`，返回 `{ nodes: [], edges: [] }`
  4. `destroy()` 后容器 DOM 被清空（`container.innerHTML === ''`）
  5. `destroy()` 调两次不抛异常（幂等）
  6. 传入全部 events 回调不抛异常，exportGraph 正常工作

- 测试环境适配：
  - `beforeEach` 中 `vi.stubGlobal('ResizeObserver', ...)` 用可构造函数（`vi.fn(function(){...})` 而非箭头函数）mock jsdom 缺失的 `ResizeObserver`

## 6. 实际执行的命令

```bash
# 1. TypeScript 类型检查
pnpm typecheck
# 退出码 0

# 2. ESLint（含架构边界规则）
pnpm lint
# 退出码 0

# 3. 单元测试（先单文件，后全量）
pnpm test src/adapters/flow-graph/index.spec.ts
# 6 passed ✓

pnpm test
# 57 files / 497 passed ✓

# 4. 生产构建
pnpm build
# 构建成功，退出码 0
```

## 7. 命令输出摘要

### `pnpm typecheck`
```
$ vue-tsc -b --noEmit
```
无输出（退出码 0）。

### `pnpm lint`
```
$ eslint .
```
无输出（退出码 0）。

### `pnpm test`（全量）
```
 Test Files  57 passed (57)
      Tests  497 passed (497)
```
基线 56 files / 491 tests → 新基线 57 files / 497 tests（新增 1 file / 6 tests）。

### `pnpm build`
```
$ vue-tsc -b && vite build
vite v8.1.0 building client environment for production...
✓ built in 3.02s
```
构建成功。仅在 `@vueuse/core`（第三方依赖）中产生 2 条 INFO 级别的 `INVALID_ANNOTATION` 警告，不影响产物正确性。

## 8. 与原方案的偏差

**无实质性偏差。** 以下细节与方案表述不同，但属合理实现选择：

| 项目 | 方案表述 | 实际做法 | 原因 |
|------|----------|----------|------|
| `@node-click` 事件名 | 方案描述为 `@node-click` | 实现中使用 `onNodeClick` | 方案描述用模板语法（kebab-case），渲染函数 `h()` 中事件 handler 使用 `onXxx` 驼峰命名，功能等价 |
| `@nodes-change`/`@edges-change` | 方案 §9.2 描述为 `@nodes-change`/`@edges-change` | 使用 `onUpdate:nodes`/`onUpdate:edges` | `nodesChange`/`edgesChange` 事件发射的是 `NodeChange[]`/`EdgeChange[]`（变更描述对象），而 `update:nodes`/`update:edges` 直接发射当前全部节点/边的新值（`GraphNode[]`/`GraphEdge[]`），更适合直接同步内部 ref。方案 §9.2 要求「节点位置变化或增删 → 更新内部状态后调用 onGraphChange」，`update:nodes/edges` 是更直接的实现路径 |
| `internal destroyed flag` | 方案 §9.2 建议布尔标记 | 使用 `let destroyed = false` 闭包变量 | 完全一致 |
| 测试 6（events） | 方案允许弱化断言 | 采用验证挂载不抛异常 + exportGraph 正常工作的方式 | jsdom 中无法通过模拟鼠标事件触发 VueFlow 的 node-click/connect/拖拽事件。弱断言已在预期内 |

## 9. 遇到的问题

### 9.1 ResizeObserver 在 jsdom 中缺失

- **问题**：VueFlow 初始化时使用 `new ResizeObserver(callback)` 监控容器尺寸，jsdom 不提供该 API。
- **解决**：在 `index.spec.ts` 的 `beforeEach` 中用 `vi.stubGlobal` mock，注意必须使用 `function()` 声明（而非 `() => {}` 箭头函数），因为 VueFlow 使用 `new ResizeObserver(...)` 构造方式调用。若用箭头函数会报 `TypeError: ... is not a constructor`。

### 9.2 jsdom 下的 "Not implemented: navigation to another Document" 警告

- **问题**：VueFlow 内部尝试操作 `window.location`，jsdom 提示未实现导航。
- **影响**：**无**。该警告来自 jsdom 自身，测试仍正常通过，不影响行为正确性。该警告已在全量测试输出中存在（非本 Step 引入）。

## 10. 未完成内容

**无。** §9.4 列出的全部 6 个测试场景已实现并通过。

## 11. 风险和注意事项

- **VueFlow 对 jsdom 的依赖**：当前测试通过 mock `ResizeObserver` 适配 jsdom，若未来 `@vue-flow/core` 升级后使用更多的浏览器 API（如 `IntersectionObserver`），需在 `beforeEach` 中补充对应 mock。
- **`update:nodes` vs `nodesChange` 方案差异**：当前实现使用 `onUpdate:nodes`/`onUpdate:edges` 而非 `@nodes-change`/`@edges-change`（见 §8 偏差说明）。如果未来消费方需要 `onGraphChange` 更细粒度的事件触发（而非每次全量同步），可引入 `nodesChange`/`edgesChange` 的变更类型信息，但当前阶段和未来 M07 消费场景下全量同步已足够。

## 12. Git diff 摘要

| 指标 | 值 |
|------|-----|
| 修改文件数 | 2（`index.ts` + `index.spec.ts`） |
| `index.ts` 新增行 | 147 |
| `index.ts` 删除行 | 2（原桩代码） |
| `index.spec.ts` 新增 | 96 行 |
| 其他文件变更 | 无（`docs/governance/engineering-constitution.md` 为会话启动前已有的预变更） |
| `package.json`/`pnpm-lock.yaml` 变更 | 无 |

关键变更点：
- 移除 `throw new Error('not implemented')` 桩代码 ✓
- 新增 6 个导出符号（`FlowGraphNode`/`FlowGraphEdge`/`FlowGraphData`/`FlowGraphEvents`/`FlowGraphInstance`/`mountFlowGraph`）
- `mountFlowGraph` 内部使用 `createApp` + `defineComponent` + `h()` 渲染函数挂载 `<VueFlow>`
- 4 个事件转发通道（`onNodeClick`/`onConnect`/`onUpdate:nodes`/`onUpdate:edges`）
- 6 个测试用例覆盖挂载、初始数据、空数据、destroy 清空、destroy 幂等、events 回调

## 13. 建议执行的测试

- **全量回归**：`pnpm test` 已执行并通过（497 tests），无需额外回归
- **消费方集成**：当前无任何业务模块消费 `adapters/flow-graph/`（预期状态），后续 M07 AI 调度图集成时需验证 `mountFlowGraph` + `exportGraph` + `destroy` 完整生命周期
