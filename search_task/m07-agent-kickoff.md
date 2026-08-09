# 探索任务：M07 Agent 模块落地前置调研

**任务目标**：为规划层（Anthropic）在 M07 Agent 模块启动第一个功能的需求分析提供足够信息，使其能够拆分出可执行的 Step 队列，而不需要自行读取代码或 knowledge/。

**需要回答的问题**：

1. 后端 `sw-biz` 下是否已存在 agent 相关模块骨架（如 `sw-biz-agent` 或类似命名）？现有目录结构、已有的类/接口/占位实现是什么？还是完全空白？
2. 前端 `src/modules/agent/`（或等价目录）是否存在骨架/占位页面？现状是什么？
3. Vue Flow adapter（前端防腐层）当前对外暴露的具体 API/组件/类型是什么？"零消费方"具体指什么——即一个新的 AI 调度图消费页面接入它需要用到哪些现成能力，是否有已知的接入限制或已记录的坑？（查 `knowledge/features/vue-flow-adapter.md` 和 `product/vue-flow-adapter/passed/`）
4. `knowledge/known-issues.md` 中 I13（"M07 AI 引擎/工具沙箱/RAG 选型未定"）的完整原始记录是什么？是否有任何既往讨论、候选技术方案、产品侧已明确的约束或排除项？
5. `knowledge/model-registry.md` 中是否已有与 Agent/AI 引擎相关的模型注册信息（例如项目本身要接入的 LLM provider、API key 管理方式）？
6. `knowledge/decisions.md`（D1-D42 全量）中是否有任何与 M07/Agent/AI 调度图相关的历史决策，哪怕是被否决或搁置的？
7. 是否存在任何用户此前提出但未落地的 Agent 功能需求描述（在 `product/` 或 `knowledge/` 的任何位置）？

**搜索范围**：
- `knowledge/known-issues.md`（I13 完整条目）
- `knowledge/decisions.md`（全量，筛选 M07/Agent/AI 相关）
- `knowledge/features/vue-flow-adapter.md`
- `knowledge/model-registry.md`
- `knowledge/current-status.md`（agent 模块相关部分）
- `product/vue-flow-adapter/passed/`、`product/vue-flow-adapter/receipts/`
- `Smart-WorkFlow/sw-biz/`（搜索 agent 相关目录，确认是否存在及现状，不深入分析实现细节，只需结构性事实）
- `Smart-WorkFlow-Web/src/modules/`（搜索 agent 相关目录，同上）
- `Smart-WorkFlow-Web/src/adapters/`（Vue Flow adapter 防腐层实现，确认导出面）

**禁止范围**：
- 不得修改任何文件（本任务仅探索）
- 不得运行 `mvn`/`pnpm` 等改变项目状态的命令
- 不得做产品决策或技术选型建议（AI 引擎/RAG/沙箱选型属于规划层与用户的决策，探索只汇报现状与已知约束）
- 不得深入分析业务逻辑实现细节，只需结构性/存在性事实和关键接口签名

**预期证据**：
- 相关文件的具体路径列表（存在的骨架文件/占位文件，逐一列出）
- Vue Flow adapter 对外导出的类型/组件/函数签名（简要列出，不粘贴完整源码）
- I13 原始条目全文引用
- 相关决策编号及一句话摘要（如有）

**完成标准**：以上 7 个问题均有明确答案（或明确标注"未找到/不存在"），且证据可追溯到具体文件路径。

**执行模型**：`deepseek/deepseek-v4-pro`

**失败处理**：若信息不足或探索中发现问题范围超出预期（例如发现 agent 模块实际已有较多实现），在 `search_fallback/m07-agent-kickoff.md` 中如实标注"未确认事项"和"是否需要继续探索"，不得为了给出结论而猜测或编造文件路径。

**回执位置**：`search_fallback/m07-agent-kickoff.md`
