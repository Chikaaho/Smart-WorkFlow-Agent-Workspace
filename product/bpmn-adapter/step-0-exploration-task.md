# Step 0：BPMN adapter 现状与目标场景探索

> 按 CLAUDE.md §0.4.1 下发。本文件是 Step 0 的正式任务记录（探索类，非执行层方案），
> 不进入 §11.2 的 `ready/` → `passed/` 流转，作为规划层自身会话内执行的探索任务存档。
>
> 执行方式：用户在当前会话内手动切换模型为 DeepSeek 系（`deepseek-v4-pro` 或
> `deepseek-v4-flash`）后，在**同一会话**内按下方任务执行，不通过 Agent 工具派生子代理。

---

## ① 探索目标（要回答的具体问题）

1. `Smart-WorkFlow-Web/src/adapters/bpmn/` 当前的接口壳长什么样？定义了哪些接口/方法签名（已知参照 vue-flow-adapter Step 0 摘要：`mountBpmn(_container, _xml?)` + `exportXml`，但请**重新直读**确认是否有变化，不要直接采信旧摘要）？每个方法的 `throw new Error('not implemented')` 具体覆盖哪些能力（渲染流程图/拖拽设计/连线/属性面板/导入导出 XML 等）？
2. `package.json` 中 `bpmn-js` 及其常见配套包（如 `bpmn-js-properties-panel`、`diagram-js`、`camunda-bpmn-moddle` 等）实际安装了哪些？版本号是什么？只有裸的 `bpmn-js` 还是已经装了属性面板等扩展？
3. **范围裁决（本 Step 0 的核心问题）**：`bpmn-js` 同时支持 `Viewer`（只读渲染流程图）和 `Modeler`（可拖拽编辑设计）两种模式。请排查现有代码和文档线索，判断当前阶段的 BPMN adapter 应该实现为**只读查看器**还是**可编辑设计器**：
   - 查看 `modules/workflow/` 下 `ProcessDefList.vue`（流程定义列表页）现有实现，是否已有"查看流程图"的入口占位（按钮/链接/TODO 注释）？
   - 查看后端 `sw-bpm` 模块（`Smart-WorkFlow/sw-bpm/`）是否已有返回 BPMN XML 的 API 端点（如流程定义详情接口是否包含 `bpmnXml`/`resourceXml` 字段，或是否有独立的 "导出流程定义 XML" 端点）？搜索关键字：`bpmnXml`、`resourceXml`、`ProcessDefinition`、`getBpmnXml`。
   - 查看 `Smart-WorkFlow/功能清单.md` 中 M04（流程引擎）的明细项，是否有明确区分"流程图设计"和"流程图查看"两个不同粒度的功能点？各自的验收标准描述是什么？
   - 若后端暂无 XML 数据来源、且前端也无设计器落地页面入口，说明当前阶段更可能是"先做 adapter 防腐层本身"（与 vue-flow-adapter 同构：零消费方也先做），而非"整功能打通"——请给出结论并说明依据。
4. 与已完成的 `adapters/flow-graph/`（vue-flow-adapter 已实现）和 `adapters/form-designer/`（已完整实现）做结构参照：这两者的实现模式（mount/export/destroy + 事件回调防腐层）是否可以直接套用到 BPMN adapter？还是 BPMN 因为"设计器 vs 查看器"的范围差异需要不同的接口形状？
5. 全仓库范围内，谁在引用或计划引用 `adapters/bpmn/`？搜索关键字：`adapters/bpmn`、`BpmnJS`、`bpmn-js`、`mountBpmn`、`exportXml`，确认当前有无任何模块已经导入或调用该 adapter，还是完全零消费方（参照 vue-flow-adapter 摘要，flow-graph 是零消费方，需确认 bpmn 是否同样）。

## ② 探索范围（限定读取的目录/文件/关键字，防止无边界发散）

**允许读取**：
- `Smart-WorkFlow-Web/src/adapters/bpmn/`（全部文件）
- `Smart-WorkFlow-Web/src/adapters/flow-graph/`、`Smart-WorkFlow-Web/src/adapters/form-designer/`（全部文件，用于结构参照）
- `Smart-WorkFlow-Web/src/modules/workflow/`（全部文件，重点看 `ProcessDefList.vue` 和相关 API/contracts）
- `Smart-WorkFlow-Web/package.json`（依赖版本）
- `Smart-WorkFlow/sw-bpm/`（重点找流程定义详情/导出相关的 Controller、DTO、Facade，搜索 `bpmnXml`/`resourceXml`/`ProcessDefinition`）
- `Smart-WorkFlow/功能清单.md` 中 M04 相关行
- 全仓库 grep：`adapters/bpmn`、`BpmnJS`、`bpmn-js`、`mountBpmn`、`exportXml`
- `knowledge/architecture.md`、`knowledge/known-issues.md` I3 相关条目
- `product/vue-flow-adapter/step-0-exploration-summary.md`（已有的同类探索摘要，可作为参照起点，但**不可替代重新直读代码**，尤其是 §5 与 adapters/bpmn/ 的对比部分需重新验证是否仍准确）

**禁止**：
- 不运行任何 `mvn`/`pnpm`/`npm`/`node`/`vite`/`vitest` 命令
- 不修改 `Smart-WorkFlow-Web/` 或 `Smart-WorkFlow/` 内任何文件
- 不进入本任务清单之外的其他模块做发散式浏览（如无关的表单引擎、存储、定时任务代码）

## ③ 当前模型确认

执行前请在探索摘要开头显式记录：「当前模型：xxx，可承担角色：探索模型」（按 CLAUDE.md §0.4 模型族对照表判定）。

## ④ 输出要求

请以结构化摘要形式输出，建议结构：

```markdown
# Step 0 探索摘要 — BPMN adapter

当前模型：xxx，可承担角色：探索模型

## 1. adapters/bpmn/ 现状
（接口/方法清单 + 每个方法当前的未实现覆盖范围，与旧摘要的差异如有请注明）

## 2. bpmn-js 依赖版本
（逐包列出，含是否已装配套的属性面板/moddle 等扩展包）

## 3. 范围裁决：查看器 vs 设计器
（结论 + 证据：ProcessDefList.vue 现状、后端 XML 数据来源排查结果、功能清单 M04 明细描述）

## 4. 与 flow-graph / form-designer adapter 的结构参照结论
（可直接套用 / 需要差异化设计，具体差异点）

## 5. 消费方排查结果
（有/无消费方，具体位置）

## 6. 建议（可选）
（如探索中发现明显应拆分为多个 Step 的理由，可附一句话建议，但不展开具体方案设计——方案设计仍由规划模型在切回后完成）
```

不使用 CLAUDE.md §7 回执格式（Step 0 不产出执行/测试回执，没有"修改文件"这类字段要记录）。

## ⑤ 完成后的分工提醒

探索完成、摘要产出后，**必须切回 Anthropic 系模型（规划层身份）** 再消费该摘要生成 Step 1 正式执行方案。不可在同一次调用/同一模型身份下同时完成探索和方案生成（CLAUDE.md §0.4 硬约束）。探索摘要产出后请存档到本目录下 `step-0-exploration-summary.md`（强制，按 CLAUDE.md §0.4.1 D38），并可回填至 `knowledge/features/bpmn-adapter.md`（新建）。
