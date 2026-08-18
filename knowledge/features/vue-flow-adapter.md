# 功能追踪：vue-flow-adapter

> 工作区统一知识库 — 单功能规划与追踪。
> 本文件跟踪一个功能的完整生命周期：Step 0 探索 → 规划 → Step 执行 → 测试 → 验收 → 完成。
>
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED
>
> ⚠️ **2026-08-14 角色制上线**：本文件中的"推荐模型/实际模型"字段为当时执行事实，仅作历史存档；当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | 对应已知问题 [[known-issues]] I3（BPMN/Vue Flow adapter 未实现，本功能仅覆盖 Vue Flow 部分） |
| 功能名称 | Vue Flow adapter 实现（M07 AI 调度图可视化） |
| 功能目标 | 将 `adapters/flow-graph/index.ts` 从接口壳（`throw new Error('not implemented')`）实现为可用的 Vue Flow 防腐层：挂载画布、导出图数据、生命周期销毁、基础事件回调，见 §2.1 |
| 创建日期 | 2026-07-25 |
| 当前状态 | **COMPLETED** ✅（Step 0 PASSED，Step 1 PASSED，2026-07-25 阶段三收尾完成） |
| 涉及模块 | 仅前端 `Smart-WorkFlow-Web/src/adapters/flow-graph/`（CONFIRMED 2026-07-25 Step 0：零消费方，不涉及 `modules/form/`；`modules/agent/` 目前仅骨架，本功能不修改任何 `modules/`） |

---

## 2. 需求分析

### 2.1 功能目标

实现 `adapters/flow-graph/index.ts`（M07 AI 调度图可视化场景，[[decisions]] D39 裁决）：挂载 Vue Flow 画布并渲染节点/边数据、导出当前图数据、销毁实例、转发基础交互事件（节点点击/连线创建/画布变化），接口拆分粒度参照 `adapters/bpmn/`（mount + export 两函数）并按实际技术需要新增 `destroy()` 生命周期方法。**不含**与任何业务模块的联动（`sw-basic-agent` 后端骨架尚未就位，adapter 层独立先行）。

### 2.2 非目标

- BPMN adapter 实现 — [[known-issues]] I3 的另一半，独立功能，不在本功能范围内
- 与 `modules/agent/`、`modules/form/` 等业务模块的联动接入 — CONFIRMED 零消费方，无联动对象
- 安装 `@vue-flow/background`/`@vue-flow/controls`/`@vue-flow/minimap` 等配套子包 — 当前范围（挂载/导出/事件）不需要视觉控件，需要时另行评估
- 新增可视化编辑器工具栏（增删节点按钮、连线工具等 UI 交互控件）— Vue Flow 默认已支持节点拖拽和连线交互，adapter 只负责数据进出和事件转发，不重新实现交互
- 新增任何路由/菜单入口或演示页面 — 无消费方，不需要可达 UI

### 2.3 影响范围

| 维度 | 详情 |
|------|------|
| 后端模块 | 无（CONFIRMED 2026-07-25 Step 0：adapter 层可独立先行，`sw-basic-agent` 后端骨架未就位不阻塞本功能） |
| 前端模块 | 仅 `adapters/flow-graph/index.ts`（重写）+ `adapters/flow-graph/index.spec.ts`（新建） |
| 数据库表 | 无 |
| API 端点 | 无 |
| 前端路由 | 无（CONFIRMED 零消费方，不新增路由） |
| 依赖功能 | 无 |

### 2.4 依赖和风险

| 类型 | 描述 |
|------|------|
| 前置条件 | 无（Step 0 已裁决场景归属，不阻塞） |
| 技术风险 | `@vue-flow/core 1.48.2` 仅安装裸包（CONFIRMED），需在 index.ts 内以 `createApp` 方式命令式挂载并正确 `unmount()` 避免内存泄漏；`@vue-flow/core/dist/style.css` 需显式引入才能正确渲染 |
| 阻塞项 | 无 |

---

## 3. Step 列表

| Step | 名称 | 域 | 状态 | 推荐模型 | 执行回执 | 测试回执 | 验收结论 |
|------|------|:--:|:---:|:---:|:---:|:---:|:---:|
| 0 | Vue Flow adapter 现状与目标场景探索 | 规划层（自身会话，只读） | **PASSED** | DeepSeek 系（用户手动切换） | N/A（Step 0 不产出回执，见 system.md §0.4.1） | N/A | ✅ 探索摘要已产出（2026-07-25），见 `product/vue-flow-adapter/step-0-exploration-summary.md` |
| 1 | 实现 flow-graph adapter（mount/export/destroy + 事件回调） | 前端 | **PASSED** ✅ | deepseek-v4-flash | ✅ [执行回执](product/vue-flow-adapter/receipts/step-1-execution.md)（2026-07-25，测试一并完成） | N/A（含于执行回执，已独立验证） | ✅ 8/8 验收标准全部满足（2026-07-25 规划层复核） |

---

## 4. Step 详情

### Step 0：Vue Flow adapter 现状与目标场景探索

- **状态**：**PASSED**
- **目标**：厘清 Vue Flow adapter 当前实现现状、消费场景归属（M07 AI 调度图 vs 表单设计器可视化）、与 BPMN adapter 的结构对比，为后续 Step 1 正式方案提供依据
- **执行位置**：规划层自身会话（`/data/reasonix/files`），不下发到 `Smart-WorkFlow-Web/`
- **结构**：按 system.md §0.4.1 精简 5 项清单（非 §6 完整 17 项结构）
- **任务原文**：已下发并存档至 `product/vue-flow-adapter/step-0-exploration-task.md`（不进入 §11.2 `ready/`→`passed/` 流转，为 Step 0 专用存档位置）
- **探索摘要**：✅ 已产出并存档至 `product/vue-flow-adapter/step-0-exploration-summary.md`（2026-07-25）。关键结论：
  - 场景裁决：Vue Flow 的设计意图是 **M07 AI 调度图**（AI agent 任务编排可视化），非表单设计器（后者由 form-create 完整覆盖）。`current-status.md`/`session-handoff.md` 中「表单设计器可视化集成」的表述为知识库漂移，应更正。
  - 消费方：零消费方，`adapters/flow-graph/` 当前仅 1 个单函数接口壳（`mountFlowGraph`），与 bpmn adapter 处于同一成熟度阶梯。
  - 后端依赖：AI 调度图场景下最终需要 `sw-basic-agent`，但 adapter 层可独立先行。
- **PASSED 判定标准**：探索摘要已产出且规划层已消费用于生成 Step 1 方案（不套用 §5.3 修改文件证据类判据）

### Step 1：实现 flow-graph adapter（mount/export/destroy + 事件回调）

- **状态**：**PASSED** ✅
- **域**：纯前端
- **目标**：将 `adapters/flow-graph/index.ts` 从接口壳实现为可用的 Vue Flow 防腐层，配套单元测试
- **推荐模型**：`deepseek-v4-flash`（接口契约已在方案中完全钉死，无跨项目联动/无数据库/无鉴权/无复杂并发，属"已有模式下的功能补充"）
- **方案文件**：`product/vue-flow-adapter/passed/step-1-implement-flow-graph-adapter.md`（按 system.md §6 17 项结构，已归档）
- **执行回执**：`product/vue-flow-adapter/receipts/step-1-execution.md`（2026-07-25，含测试结果，REPORTED 并 CONFIRMED 独立验证）
- **验收摘要**（2026-07-25 规划层独立复核）：
  - **8/8 验收标准全部满足**：① grep `not implemented` 零命中 ✅；② 6 符号签名与 §9.1 一致 ✅；③ 实例含 `exportGraph()` + `destroy()` ✅；④ 6 测试场景全部实现 ✅；⑤ 四连退出码 0 ✅；⑥ 测试 57 files / 497 tests ≥ 491+6 ✅；⑦ `package.json`/lock 零改动 ✅；⑧ 仅 2 文件修改 ✅
  - **偏差复核**：`onUpdate:nodes`/`onUpdate:edges` 替代 `@nodes-change`/`@edges-change`（功能等价，以全量数组直接同步 ref，已如实记录，接受）；测试场景 6 弱化断言（方案 §9.4 已明确允许，接受）
  - **改动范围**：仅 `src/adapters/flow-graph/index.ts`（147 行重写）+ `index.spec.ts`（96 行新建，6 测试），与 `docs/governance/engineering-constitution.md` 预变更无关

---

## 5. 测试和验收汇总

| Step | 测试总数 | 通过 | 失败 | 跳过 | 验收结论 |
|------|:---:|:---:|:---:|:---:|:---:|
| 0 | N/A（探索类，无测试） | — | — | — | ✅ 探索摘要已产出并消费 |
| 1 | 6（新增）+ 491（基线回归）= 497 | 497 | 0 | 0 | ✅ 8/8 验收标准全部满足 |

前端新基线：**57 spec files / 497 tests**（CONFIRMED 2026-07-25 规划层独立复核，四连全绿）

---

## 6. 功能完成检查清单

- [x] Step 0 探索摘要已产出并被规划层消费
- [x] Step 1 已 PASSED（2026-07-25，8/8 验收标准全部满足）
- [x] 所有正式执行 Step 均已 PASSED
- [x] 已更新 `knowledge/current-status.md`
- [x] 已更新 `knowledge/known-issues.md`（I3 状态更新）
- [x] 已生成交接摘要 → `knowledge/session-handoff.md`
- [ ] 已标注 `功能清单.md` 中对应项状态（本功能仅实现 adapter 防腐层，不涉及业务模块功能——M07 AI 调度图前端应用本身仍为 ⬜，本 Step 不改变功能清单状态）

---

## 7. 实际修改范围

| 文件 | 操作 | 行数 | 说明 |
|------|------|:---:|------|
| `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts` | 重写 | 147 行 | 从 8 行接口壳重写为完整防腐层：6 导出符号 + 2 内部转换函数 + `mountFlowGraph`（createApp + defineComponent + h() 渲染函数） |
| `Smart-WorkFlow-Web/src/adapters/flow-graph/index.spec.ts` | 新建 | 96 行 | 6 测试场景：挂载/初始数据/空数据/destroy 清空 DOM/destroy 幂等/events 回调 |

无其他文件被修改。`package.json`、`pnpm-lock.yaml` 零改动。

---

## 8. 遗留问题

- **M07 AI 调度图消费方未就位**：`adapters/flow-graph/` 已完成，但 `sw-basic-agent` 后端仍为 AutoConfiguration 骨架（CONFIRMED I13：M07 AI 调度图执行引擎/工具沙箱/RAG 选型均未定），短期内无业务模块调用本 adapter。这是**预期状态**，非遗漏——adapter 层可独立先行，零消费方不阻塞 adapter 实现。
- **`package.json` 未变更**：当前仅安装 `@vue-flow/core@^1.48.2`（基础包），未安装 `@vue-flow/background`/`@vue-flow/controls`/`@vue-flow/minimap` 等视觉插件。M07 消费方落地时如需背景网格/控制器/缩略图等配套功能，需届时评估安装对应子包。

---

## 9. 关联知识

- [[known-issues]] I3
- [[current-status]] §2.2、§4、§8
- [[architecture]] §4.1（Vue Flow 场景定位，Step 0 已据此裁决为 M07 AI 调度图，见 [[decisions]] D39）
- [[decisions]] D37/D38（Step 0 机制）、D39（场景裁决）
- `system.md` §0.4.1（Step 0 机制定义）、§6（Step 1 方案 17 项结构）
