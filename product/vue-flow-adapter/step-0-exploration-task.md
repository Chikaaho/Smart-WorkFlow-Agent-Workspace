# Step 0：Vue Flow adapter 现状与目标场景探索

> 按 CLAUDE.md §0.4.1 下发。本文件是 Step 0 的正式任务记录（探索类，非执行层方案），
> 不进入 §11.2 的 `ready/` → `passed/` 流转，作为规划层自身会话内执行的探索任务存档。
>
> 执行方式：用户在当前会话内手动切换模型为 DeepSeek 系（`deepseek-v4-pro` 或
> `deepseek-v4-flash`）后，在**同一会话**内按下方任务执行，不通过 Agent 工具派生子代理。

---

## ① 探索目标（要回答的具体问题）

1. `Smart-WorkFlow-Web/src/adapters/flow-graph/` 当前的接口壳长什么样？定义了哪些接口/方法签名？每个方法的 `throw new Error('not implemented')` 具体覆盖哪些能力（渲染画布/节点拖拽/连线/序列化/事件回调等）？
2. `package.json` 中 `@vue-flow/*` 系列实际安装了哪些子包及版本（如 `@vue-flow/core`、`@vue-flow/background`、`@vue-flow/controls`、`@vue-flow/minimap` 等）？
3. 全仓库范围内，谁在引用或计划引用 `adapters/flow-graph/`？搜索 `flow-graph`、`VueFlow`、`@vue-flow` 关键字，确认当前有无任何模块（`modules/form/`、`modules/bpm/`、`modules/agent/` 等）已经导入或调用该 adapter，还是完全零消费方。
4. **裁决知识库现存冲突**：`knowledge/architecture.md` §4.1 将 Vue Flow 定位为「AI 调度图」（M07 场景），但 `knowledge/current-status.md`/`knowledge/session-handoff.md` 部分表述倾向「表单设计器可视化集成」。请直接读取 `architecture.md` §4.1 原文和 `Smart-WorkFlow-PRD.md`（如可读取到）中关于 Vue Flow / 流程图可视化的描述，给出一个有代码或文档证据支持的结论：Vue Flow 的设计意图更倾向哪个场景？还是两者都需要（分时期或分模块）？
5. 与 `adapters/bpmn/`（同样是接口壳）做一次结构对比：两者的接口设计模式是否一致（如都遵循同一个"防腐层"约定）？`adapters/bpmn/` 是否已有任何比 `flow-graph/` 更完整的实现可参照？

## ② 探索范围（限定读取的目录/文件/关键字，防止无边界发散）

**允许读取**：
- `Smart-WorkFlow-Web/src/adapters/flow-graph/`（全部文件）
- `Smart-WorkFlow-Web/src/adapters/bpmn/`（全部文件，用于结构对比）
- `Smart-WorkFlow-Web/package.json`（依赖版本）
- 全仓库 grep：`flow-graph`、`VueFlow`、`@vue-flow`、`vue-flow`
- `knowledge/architecture.md` §4.1
- `knowledge/current-status.md` 中 Vue Flow / BPMN 相关行
- `knowledge/session-handoff.md` 中 Vue Flow 相关表述
- `Smart-WorkFlow-PRD.md`（若能定位到该文件，来源见 `current-status.md` §11 参考文档索引）

**禁止**：
- 不运行任何 `pnpm`/`npm`/`node`/`vite`/`vitest` 命令
- 不修改 `Smart-WorkFlow-Web/` 或 `Smart-WorkFlow/` 内任何文件
- 不进入本任务清单之外的其他模块做发散式浏览（如无关的 BPM/表单业务代码）

## ③ 当前模型确认

执行前请在探索摘要开头显式记录：「当前模型：xxx，可承担角色：探索模型」（按 CLAUDE.md §0.4 模型族对照表判定）。

## ④ 输出要求

请以结构化摘要形式输出，建议结构：

```markdown
# Step 0 探索摘要 — Vue Flow adapter

当前模型：xxx，可承担角色：探索模型

## 1. adapters/flow-graph/ 现状
（接口/方法清单 + 每个方法当前的未实现覆盖范围）

## 2. @vue-flow 依赖版本
（逐包列出）

## 3. 消费方排查结果
（有/无消费方，具体位置）

## 4. 场景冲突裁决结论
（M07 AI 调度图 / 表单设计器可视化 / 两者皆需，附证据出处）

## 5. 与 adapters/bpmn/ 的结构对比
（一致/不一致，具体差异点）

## 6. 建议（可选）
（如探索中发现明显应拆分为多个 Step 的理由，可附一句话建议，但不展开具体方案设计——方案设计仍由规划模型在切回后完成）
```

不使用 CLAUDE.md §7 回执格式（Step 0 不产出执行/测试回执，没有"修改文件"这类字段要记录）。

## ⑤ 完成后的分工提醒

探索完成、摘要产出后，**必须切回 Anthropic 系模型（规划层身份）** 再消费该摘要生成 Step 1 正式执行方案。不可在同一次调用/同一模型身份下同时完成探索和方案生成（CLAUDE.md §0.4 硬约束）。探索摘要产出后可回填至 `knowledge/features/vue-flow-adapter.md` §4 Step 0 详情，并可选存档副本到本目录下 `step-0-exploration-summary.md`。
