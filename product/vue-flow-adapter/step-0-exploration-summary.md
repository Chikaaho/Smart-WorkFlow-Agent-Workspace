# Step 0 探索摘要 — Vue Flow adapter

当前模型：**deepseek-v4-pro**，可承担角色：探索模型（DeepSeek 系，按 CLAUDE.md §0.4 模型族对照表判定）。

---

## 1. adapters/flow-graph/ 现状

**文件清单**：仅 1 个文件 `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts`（8 行）。

**已有接口**：

| 方法签名 | 当前实现 | 覆盖能力 |
|---|---|---|
| `export function mountFlowGraph(_container: HTMLElement): void` | `throw new Error('not implemented')` | 在指定容器中挂载 Vue Flow 画布实例 |

**未实现的能力（以单函数 `mountFlowGraph` 的范围推断，需在 Step 1 方案中细化分解）**：
- 画布渲染（`_container` 挂载 → Vue Flow 实例创建）
- 节点拖拽/增删
- 连线/边编辑
- 序列化/反序列化（图数据的 save/load）
- 事件回调（节点点击、连线创建、画布变化等）

**与 bpmn adapter 的对比**：bpmn adapter 同样是接口壳，但有 2 个导出（`mountBpmn` + `exportXml`），已显式分离了"挂载渲染"和"数据导出"两个职责。flow-graph 当前仅 1 个函数，后续方案设计时应考虑是否需要类似拆分（如 `mountFlowGraph` + `exportGraph` / `importGraph`）。

---

## 2. @vue-flow 依赖版本

| 包名 | 版本 | 来源 |
|---|---|---|
| `@vue-flow/core` | `^1.48.2` | `package.json` L22 |

**未安装的子包**（常见配套包均不在 `package.json` 中）：
- ❌ `@vue-flow/background` — 未安装
- ❌ `@vue-flow/controls` — 未安装
- ❌ `@vue-flow/minimap` — 未安装

仅有 `core` 裸包，无辅助功能包。后续实现时若需要背景网格/控制面板/小地图，需额外安装。

---

## 3. 消费方排查结果

**结论：零消费方。** `adapters/flow-graph/` 当前完全未被任何模块引用。

详细搜索结果：

| 搜索范围 | 关键字 | 命中情况 |
|---|---|---|
| 前端 `src/modules/` | `adapters/flow-graph` / `adapters/bpmn` | **零命中** — 无任何业务模块导入这两个 adapter |
| 前端 `src/`（全量，排除 adapter 自身） | `adapters/flow-graph` | **零命中** |
| 前端全量（含 `.vue`/`.ts`） | `VueFlow` / `@vue-flow` / `vue-flow` | 仅 `adapters/flow-graph/index.ts` 自身注释 + `eslint.config.js` 的禁止直引规则 + 文档中的技术栈列举 |
| 后端 `Smart-WorkFlow/` | `flow-graph` / `VueFlow` / `vue-flow` | **零命中** — 后端无任何引用 |

ESLint 架构边界规则已就位（`eslint.config.js` L40-41）：业务层禁止直引 `@vue-flow/*`，强制通过 `adapters/flow-graph` 调用。该规则与 bpmn-js / form-create 的隔离规则模式一致，防腐层基础设施已完备。

---

## 4. 场景冲突裁决结论

**裁决结果：Vue Flow 的设计意图是 M07 AI 调度图（AI Agent 任务编排/流程图可视化），而非表单设计器可视化。**

### 证据链

**证 1 — `architecture.md` §4.1 作为权威来源（CONFIRMED）**：

> 「唯一偏 React 的是 AI 调度图（React Flow），用 Vue Flow 兜。」

这句话出现在"技术选型与理由"一节，是**选型决策本身的原文记录**，不是后续维护中可能漂移的状态摘要。它明确定义了 Vue Flow 的引入理由：React Flow 是 AI 调度图领域的主流方案（偏 React 生态），但在 Vue 技术栈下需要替代品——Vue Flow 就是那个替代品。这里的"AI 调度图"（AI scheduling/orchestration graph）明确指向 M07（AI 智能助手）场景中的 agent 任务编排可视化。

**证 2 — `current-status.md` §8 / `session-handoff.md` 的「表单设计器可视化集成」标签与事实矛盾**：

- 表单设计器已经由 `@form-create/designer 3.5` 完整覆盖（CONFIRMED：8 字段类型拖拽设计、配置面板、预览、子表设计、防腐层隔离）。前端 `adapters/form-designer/` 是一个**已完整实现的 4 文件防腐层**（`index.ts` 298 行 + `setup.ts` 90 行 + `FormPreview.vue` + 509 行单测）
- 不存在「表单设计器还需要 Vue Flow 来做可视化集成」的技术缺口——form-create 本身就是一个完整的可视化表单设计器框架
- 因此 `current-status.md` 和 `session-handoff.md` 中将其标注为「表单设计器可视化集成」属于**知识库维护过程中的表述漂移**（ASSUMED 写成了 CONFIRMED），应更正为与 `architecture.md` §4.1 一致的「AI 调度图可视化」

**证 3 — M07 AI 调度图的现状进一步印证**：

- `known-issues.md` I13 确认：M07 AI 调度图的「执行引擎落地形态、工具沙箱边界、RAG 向量库选型」均待专项产品设计
- 但 AI 调度图的**可视化前端**（Vue Flow adapter 实现）可以也需要独立先行——就像 BPMN adapter 在流程引擎业务逻辑之前已预留接口壳一样
- 这符合 Walking Skeleton 先打通端到端薄切片的哲学：先把 AI agent 的流程图可视化搭起来（前端侧），后端 agent 执行引擎晚些时候再点亮

**证 4 — 技术对照**：

| 设计器 | 第三方库 | 场景 | 前端状态 |
|---|---|---|---|
| 表单设计器 | `@form-create/designer 3.5` | 低代码表单拖拽设计 | ✅ 完整实现 |
| 流程设计器 | `bpmn-js 18` | BPMN 流程图设计 | 📦 接口壳 |
| AI 调度图 | `@vue-flow/core 1.48` | AI agent 任务编排可视化 | 📦 接口壳 |

三块"硬骨头设计器"各有独立的第三方库和场景，不可混淆。

### 最终结论

- **主要场景**：M07 AI 调度图 — AI agent 任务编排/流程图可视化（唯一有选型理由支撑的场景）
- **表单设计器可视化集成**：**错误标签**，应更正。表单设计器已由 form-create 完整覆盖，不存在 Vue Flow 的用武之地
- **是否需要后端配合**：是——AI 调度图场景下最终需要 `sw-basic-agent` 提供 agent 编排数据/任务图结构 API。但 adapter 层本身（防腐层薄接口 + Vue Flow 实例管理）可独立先行，与 bpmn adapter 的模式一致

---

## 5. 与 adapters/bpmn/ 的结构对比

### 结构一致性：✅ 一致

| 维度 | `adapters/flow-graph/` | `adapters/bpmn/` |
|---|---|---|
| 文件数 | 1（`index.ts`） | 1（`index.ts`） |
| 防腐层注释模式 | `@vue-flow/core 的防腐层。原生 API 只允许在本文件内出现` | `bpmn-js 的防腐层。原生 API 只允许在本文件内出现` |
| 接口实现状态 | skeleton（`throw new Error('not implemented')`） | skeleton（`throw new Error('not implemented')`） |
| 导出函数数 | 1（`mountFlowGraph`） | 2（`mountBpmn` + `exportXml`） |
| 测试文件 | 无 | 无 |
| 消费方 | 零 | 零 |

### 差异点

1. **函数拆分粒度**：bpmn 已将"挂载渲染"（`mountBpmn`）和"数据导出"（`exportXml`）拆为两个独立函数；flow-graph 当前仅一个 `mountFlowGraph`，尚未拆出序列化/反序列化接口
2. **函数签名差异**：`mountBpmn(_container, _xml?)` 接受可选的初始 XML 参数（导入已有流程定义），`mountFlowGraph` 仅接受容器参数，缺少初始图数据导入入口

### 与 form-designer adapter 的参照

`adapters/form-designer/` 是一个**已完整实现**的参考模板（4 文件 / 298+90 行实现 + 509 行单测），展示了防腐层从接口壳到完整体实现的标准模式：

- `index.ts` — 核心防腐逻辑（definition ↔ form-create schema 双向转换）
- `setup.ts` — 初始化/配置封装
- `FormPreview.vue` — Vue 组件封装
- `index.spec.ts` — 常驻回归测试

bpmn 和 flow-graph 都处于这个成熟度阶梯的**第一级**（接口壳），后续可以 form-designer 为参照逐步推进。

---

## 6. 建议

1. **场景归属需在知识库中更正**：建议将 `current-status.md` §8 和 `session-handoff.md` 中「Vue Flow adapter — 表单设计器可视化集成」更正为「Vue Flow adapter — AI 调度图可视化（M07）」或对齐 `architecture.md` §4.1 的「AI 调度图」表述。这不是本功能的编码内容，是知识库维护动作（规划层权限内）。

2. **Step 1 正式方案的核心方向建议**（仅建议方向，不展开具体方案——方案设计由规划模型在切回 Anthropic 系模型后完成）：
   - Step 1 应为**纯前端 Step**，不涉及后端（AI 调度图后端尚未就绪，adapter 层可独立先行）
   - 设计 adapter 接口时建议参照 bpmn 的函数拆分粒度（至少拆出 mount + export + 可选 import），避免所有能力塞进单函数
   - `@vue-flow/core` 目前仅安装了裸包，若参考示例/文档发现需要 `@vue-flow/background` / `@vue-flow/controls` / `@vue-flow/minimap`，应在方案中明确是否需要新增依赖
   - 参照已完整的 `adapters/form-designer/` 模式：实现后应包含单元测试（`index.spec.ts`），且 ESLint 架构边界规则已就位

3. **后端侧**：bpmn adapter 与 flow-graph adapter 的消费方均为零，但 bpmn 对应 `sw-bpm` 模块（已有 78 个 Java 文件在开发中），未来消费方明确；而 flow-graph 对应的 `sw-basic-agent` 目前仅为 AutoConfiguration 占位。这意味着 flow-graph adapter 实现后短期内不会有业务模块来调用它——这并非问题（bpmn adapter 同样零消费方但已先预留接口壳），但 Step 方案中应如实说明这一背景，避免执行代理产生「实现了但没人用是不是做错了」的困惑。
