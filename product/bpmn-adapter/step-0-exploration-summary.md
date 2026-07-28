# Step 0 探索摘要 — BPMN adapter

当前模型：**deepseek-v4-pro（DeepSeek 系）**，可承担角色：探索模型（按 system.md §0.4 模型族对照表判定）。

---

## 1. adapters/bpmn/ 现状

**文件清单**：仅 1 个文件 `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts`（12 行）。

**已有接口**：

| 方法签名 | 当前实现 | 注释意图 |
|---|---|---|
| `export function mountBpmn(_container: HTMLElement, _xml?: string): void` | `throw new Error('not implemented')` | `TODO(skeleton): 挂载 bpmn-js modeler` |
| `export function exportXml(): Promise<string>` | `throw new Error('not implemented')` | `TODO(skeleton): 调用 bpmn-js saveXML` |

**关键观察**：

1. `mountBpmn` 接受可选 `_xml?` 参数 → 设计上已考虑"导入已有 BPMN XML 渲染"场景
2. TODO 注释明确写的是 "modeler"（设计器），不是 "viewer"（查看器）— 暗示最初意图是可编辑设计器
3. `exportXml` 仅在 modeler 模式有意义（Viewer 只读不导出），说明接口壳的原始设计偏向设计器
4. 与 vue-flow-adapter Step 0 摘要（§5）中对 bpmn adapter 的描述一致：2 个导出（`mountBpmn` + `exportXml`），已显式分离"挂载渲染"和"数据导出"
5. **无测试文件**：`index.spec.ts` 不存在（对照 form-designer 的 509 行测试）

**防腐层注释模式**：与 flow-graph 和 form-designer 一致——"bpmn-js 的防腐层。原生 API 只允许在本文件内出现，业务层只认下方导出的我方契约。"

**ESLint 架构边界规则已就位**（`eslint.config.js`）：业务层（`modules/*`）禁止直引 `bpmn-js`，强制通过 `adapters/bpmn` 调用。防腐层基础设施完备。

---

## 2. bpmn-js 依赖版本

| 包名 | 版本 | 来源 |
|---|---|---|
| `bpmn-js` | `^18.18.0` | `package.json` L24 |

**未安装的常见配套包**：

- ❌ `bpmn-js-properties-panel` — 未安装（属性面板，设计器专用）
- ❌ `camunda-bpmn-moddle` — 未安装（Camunda BPMN 扩展属性模型）
- ❌ `diagram-js` — 未安装（`bpmn-js` 已内置，不单独安装属正常）
- ❌ `bpmn-moddle` — 未安装（`bpmn-js` 已内置）

仅有 `bpmn-js` **裸包**，无属性面板等扩展。`bpmn-js` 裸包同时包含 `Viewer` 和 `Modeler` 两个构造函数——选择哪个模式由代码中 `import` 决定（`import BpmnViewer from 'bpmn-js/lib/Viewer'` vs `import BpmnModeler from 'bpmn-js/lib/Modeler'`），不依赖额外包。

---

## 3. 范围裁决：查看器 vs 设计器

### 3.1 裁决结论

**结论：BPMN adapter 应实现为「查看器」（Viewer），理由如下。**

这不是"只做一半"——BPMN 设计器的前端工作已于后端 `ProcessGraph` JSON 模型完成，BPMN XML 是部署产物而非设计格式。前端 BPMN adapter 的职责是渲染已部署的流程图，供流程监控/查看场景使用。

### 3.2 证据链

#### 证 1 — 后端设计器路径已用 ProcessGraph JSON 完成，非 BPMN XML

`BpmProcessDefController.java`（`/workflow/defs`）提供了完整的设计器后端：

| 端点 | 方法 | 功能 |
|---|---|---|
| `POST /workflow/defs` | `create` | 创建流程定义（DRAFT），生成初始图（START → END）入 `graph_json` 列 |
| `PUT /workflow/defs/{id}/graph` | `saveDraftGraph` | 保存草稿图（`ProcessGraph` JSON 全覆盖 `graph_json`） |
| `GET /workflow/defs/{id}` | `getDef` | 读取流程定义 + 图（返回 `ProcessGraph`，非 BPMN XML） |
| `POST /workflow/defs/{id}/validate` | `validateGraph` | 图校验（6 类规则，独立端点不改数据） |
| `POST /workflow/defs/validate` | `validateGraph` | 实时图校验（不依赖 DB，供设计器用） |
| `POST /workflow/defs/{id}/publish` | `publish` | 发布流水线：校验 → **BPMN 翻译 → Flowable 部署** → 回填 → 状态变更 |

**关键发现**：前端设计器如果要实现拖拽编辑，应该操作的是后端的 `ProcessGraph` JSON 格式（通过上述 CRUD 端点读写 `graph_json`），而不是操作 `bpmn-js` Modeler 产出的 BPMN XML。`bpmn-js` Modeler 编辑 BPMN XML 再回传 → 后端需反向解析 BPMN XML → ProcessGraph，这是一条绕弯且易出错的路径。

BPMN XML 在此架构中的角色是**服务端生成的部署产物**——`ProcessGraph` → `GraphToBpmnTranslator.translate()` → `BpmnModel` → `BpmnXMLConverter.convertToXML()` → XML bytes → `RepositoryService.deploy()`。前端不需要直接生成或编辑 BPMN XML。

#### 证 2 — 后端尚无"返回 BPMN XML"的端点，但基础设施已就绪

- `BpmProcessDef` 表已有 `deployment_id` 和 `process_definition_id` 列（发布后回填）
- `BpmDeployFacade.translateToBpmn(ProcessGraph)` 可生成 BPMN XML 字节数组
- `ApprovalTaskListener` 已使用 `repositoryService.getBpmnModel(processDefinitionId)` 加载已部署流程的 BpmnModel
- `BpmnXMLConverter`（Flowable 内置）可将 BpmnModel 转回 XML 字节 → 再转 String → 即为标准 BPMN 2.0 XML
- **缺的只是一个端点**：`GET /workflow/defs/{id}/bpmn-xml`（返回流程定义的 BPMN XML 字符串），这是轻量新增

**对于未发布的 DRAFT 流程**：可通过 `BpmDeployFacade.translateToBpmn(ProcessGraph)` 将 `graph_json` 实时翻译为 BPMN XML 返回（不写库、不部署）用于预览。

**对于已发布的 PUBLISHED 流程**：走 `repositoryService.getBpmnModel(processDefinitionId)` → `BpmnXMLConverter.convertToXML()` → 返回 XML。

#### 证 3 — ProcessDefList.vue 无"查看流程图"入口

`ProcessDefList.vue`（124 行）当前仅为简单分页列表，表格列：流程名称 / 流程标识 / 关联表单 / 版本 / 状态 / 更新时间。无任何"查看流程图"按钮、链接或 TODO 注释。也没有跳转到流程图查看页面的路由入口。

这意味着 adapter 实现后，消费方（ProcessDefList 或其他页面）需要在后续 Step 中添加"查看流程图"入口——这与 flow-graph adapter 的模式一致（adapter 独立先行，消费方后加）。

#### 证 4 — 功能清单 M04 明细项区分了设计和查看

| 编号 | 功能 | 状态 |
|------|------|:--:|
| M04-F01-01 | 流程设计器 — 拖拽设计 | ⬜ |
| M04-F01-02 | 流程设计器 — 节点配置 | ⬜ |
| M04-F01-03 | 流程设计器 — 会签规则 | ⬜ |
| M04-F02-01 | 流程定义 — 维护（部署/版本管理/挂起/激活） | 🟦 |
| **M04-F06-01** | **流程监控 — 流程图实时高亮、流转记录** | ⬜ |

M04-F01（设计器）和 M04-F06（流程监控/查看流程图）是**两个独立的功能明细项**。BPMN adapter 的查看器实现直接服务于 M04-F06-01（流程图实时高亮），而设计器（M04-F01）的设计格式是 `ProcessGraph` JSON 而非 BPMN XML——若前端未来需要实现设计器，那将是操作 `ProcessGraph` 的不同前端组件（可能用 `bpmn-js` Modeler + 双向转换，也可能用其他可视化方案），不应混入当前 adapter 范围。

#### 证 5 — 现有接口壳的"modeler"注释不代表必须走设计器

`mountBpmn` 的 TODO 注释写的是"挂载 bpmn-js modeler"，但这写于项目初期 skeleton 阶段，当时后端架构（ProcessGraph → translateToBpmn → deploy）尚未落地。随着后端设计器路径明确采用 ProcessGraph JSON 而非 BPMN XML 作为设计格式，前端 `adapters/bpmn/` 的职责自然收窄为"BPMN XML 的渲染防腐层"——即查看器。

`exportXml()` 在设计器场景下用于"保存 → 导出 BPMN XML"，在查看器场景下可以保留为存根（或移除），方案设计时由规划模型裁决。

---

## 4. 与 flow-graph / form-designer adapter 的结构参照结论

### 4.1 实现模式参照：可部分套用，需差异化

| 维度 | flow-graph (vue-flow-adapter) | form-designer | bpmn (适用性) |
|---|---|---|---|
| 文件数 | 1（`index.ts`, 151 行） | 4（index + setup + FormPreview.vue + spec） | 建议参照 **flow-graph 的 1 文件模式**起步 |
| Mount 模式 | `createApp(Wrapper)` → `app.mount(container)` | `@form-create/designer` 是在 Vue 组件树内使用，非独立 app | bpmn-js **不依赖 Vue 组件树**，直接在 DOM container 上初始化，更简单——不需要 `createApp` |
| 返回值 | `{ exportGraph(), destroy() }` | 多函数导出（definition ↔ schema 转换） | 建议 `{ destroy() }`（查看器不需要 exportXml） |
| 事件回调 | `FlowGraphEvents`（onNodeClick 等） | 通过 form-create 自身事件系统 | 建议 `BpmnViewerEvents`（onElementClick 等，用于 M04-F06 节点高亮交互） |
| 初始数据 | `initialData?: FlowGraphData` | 通过 `definition` JSON | `xml?: string` 已就位——吻合 |
| 测试 | 6 tests（适配器层独立于消费方） | 509 lines spec | **必须有测试**（对照 flow-graph 6 tests 的最低标准） |

### 4.2 关键差异：BPMN adapter 不需 Vue App 创建

flow-graph adapter 的核心复杂度在于通过 `createApp` + `defineComponent` + `h(VueFlow)` 将 Vue 组件挂载到容器——这是因为 `@vue-flow/core` 本身是 Vue 组件，必须在 Vue 应用上下文中运行。

bpmn-js **不是 Vue 组件**——它是一个纯 JS 库，直接在 DOM 容器上初始化：

```javascript
import BpmnViewer from 'bpmn-js/lib/Viewer'
const viewer = new BpmnViewer({ container: containerElement })
await viewer.importXML(xmlString)
```

这使 BPMN adapter 的实现比 flow-graph **更简单**——不需要 Vue app 创建/销毁，不需要 `h()` 渲染函数，不需要 `ref()` 双向同步。核心逻辑就是 `new BpmnViewer()` + `importXML()` + `destroy()`。

### 4.3 form-designer 作为成熟度参照

`adapters/form-designer/` 展示了防腐层从接口壳到完整实现的路径：
- `index.ts`（298 行）— 核心防腐逻辑
- `setup.ts`（90 行）— 初始化/配置封装
- `FormPreview.vue` — Vue 组件封装
- `index.spec.ts`（509 行）— 常驻回归测试

BPMN adapter 当前处于此成熟度阶梯的**第一级**（接口壳），Step 1 目标是达到**第二级**（可用防腐层 + 测试），不需要 Vue 组件封装（bpmn-js 不依赖 Vue）。

---

## 5. 消费方排查结果

**结论：零消费方。** `adapters/bpmn/` 当前完全未被任何模块引用。

| 搜索范围 | 关键字 | 命中情况 |
|---|---|---|
| 前端 `src/modules/` | `adapters/bpmn` | **零命中** — 无任何业务模块导入 |
| 前端 `src/`（排除 adapter 自身） | `adapters/bpmn` / `mountBpmn` / `exportXml` | **零命中** |
| 前端全量（含 `.vue`/`.ts`） | `BpmnJS` / `bpmn-js` / `Bpmn`（排除 adapters/bpmn 自身） | **零命中** — 注释中无引用 |
| 后端 `Smart-WorkFlow/` | 前端 adapter 引用 | **零命中** — 后端不引用前端文件 |

唯一引用 `adapters/bpmn` 的是其自身的 `index.ts` 文件。

这与 vue-flow-adapter 的情况完全一致——adapter 独立先行，零消费方实现防腐层是正常的 Walking Skeleton 模式。flow-graph 在 Step 0 时同样零消费方，Step 1 实现后消费方仍未就绪（M07 AI 调度图业务模块待设计），但 adapter 层本身的防腐层价值已经兑现。

---

## 6. 后端 BPMN XML 数据流全貌（供 Step 1 方案参考）

### 6.1 当前数据流（发布方向）

```
前端 ProcessGraph JSON
  → PUT /workflow/defs/{id}/graph  → 存入 sw_bpm_process_def.graph_json
  → POST /workflow/defs/{id}/publish
    → BpmProcessDefServiceImpl.publish()
      → bpmDeployFacade.translateToBpmn(graph)     // ProcessGraph → BpmnModel → byte[]
      → bpmDeployFacade.deployModel(bpmnXml, name)  // byte[] → Flowable RepositoryService
      → 回填 deployment_id + process_definition_id 到 sw_bpm_process_def
```

### 6.2 所需新增方向（查看器获取 BPMN XML）

**方案 A：对已发布流程** — `GET /workflow/defs/{id}/bpmn-xml`
```
sw_bpm_process_def.process_definition_id
  → repositoryService.getBpmnModel(processDefinitionId)
  → BpmnXMLConverter.convertToXML(bpmnModel)
  → new String(xmlBytes, UTF-8)
  → 返回 BPMN 2.0 XML 字符串
```

**方案 B：对草稿流程** — `GET /workflow/defs/{id}/preview-bpmn-xml`
```
sw_bpm_process_def.graph_json
  → parseJson → ProcessGraph
  → bpmDeployFacade.translateToBpmn(graph)
  → new String(xmlBytes, UTF-8)
  → 返回 BPMN 2.0 XML 字符串（不部署、不写库）
```

方案 A 是主力场景（查看已发布流程的流程图）。方案 B 可在后续 Step 按需添加（设计器预览）。

**注意**：新增后端端点意味着 Step 1 如果选择纯前端实现（adapter 本身 + mock XML），Step 2 还需要后端 Step 来添加该端点。按 system.md §6.18 前后端分离约束，这必须拆成两个独立 Step（前端 Step 实现 adapter 防腐层 + 后端 Step 添加 BPMN XML 端点）。

---

## 7. 建议

### 7.1 对 Step 拆分的建议（仅方向性建议，不替代规划模型设计）

基于探索结论，BPMN adapter 实现建议拆分为以下 Step 序列：

| Step | 项目 | 内容 | 依赖 |
|------|------|------|------|
| 1 | 前端 | 实现 `adapters/bpmn/index.ts` 查看器防腐层（BpmnViewer 挂载/销毁/事件） + 单元测试 | 无（零消费方可独立完成） |
| 2 | 后端 | 新增 `GET /workflow/defs/{id}/bpmn-xml` 端点（返回已发布流程的 BPMN XML） | Step 1（可并行，但建议串行——先确认前端 adapter 接口形状后再定后端返回格式） |
| 3 | 前端 | 在 `ProcessDefList.vue` 添加"查看流程图"入口 + 流程图弹窗/页面消费 adapter | Step 1 + 2 |
| 4 | 前端 | M04-F06 流程监控（流程图实时高亮、流转记录）——消费 adapter 的事件回调 | Step 3 |

### 7.2 对 adapter 接口设计的建议

参照 flow-graph 的实现模式，建议 bpmn adapter 接口扩展为：

```typescript
// 挂载查看器
function mountBpmnViewer(
  container: HTMLElement,
  xml: string,
  events?: BpmnViewerEvents
): BpmnViewerInstance

// 实例方法
interface BpmnViewerInstance {
  destroy(): void           // 清理实例
  fitView(): void           // 自适应画布（对照 M04-F06 实时高亮场景）
  highlight(nodeId: string): void  // 高亮节点（流转记录场景）
  clearHighlight(): void
}
```

`exportXml()` 在当前查看器范围下可保留存根（不实现），待设计器 Step 再点亮。

### 7.3 对模型选择的建议

Step 1（纯前端，单文件实现 + 测试，无复杂架构决策）→ `deepseek-v4-flash` 可胜任（对照 flow-graph Step 1 也是 flash）。

Step 2（后端新增端点的接口契约设计 + Flyway 双写）→ `deepseek-v4-pro`（涉及前后端协议 + 数据查询路径选择，触发 system.md §2.3 升级条件"涉及前后端协议设计"）。

### 7.4 对知识库更新的建议

- `known-issues.md` I3：BPMN 部分描述需从"BPMN adapter 未实现"更新为"BPMN adapter 查看器实现中"（Step 1 完成后）→ "BPMN adapter 查看器已完成"（Step 1 PASSED 后）
- `current-status.md` §8：BPM 前端状态从"🔲 Placeholder"更新为"🟦 查看器适配中"
- `knowledge/features/bpmn-adapter.md`：回填 §2 功能目标和非目标、§3 Step 列表
