# 探索任务：M07-F02 调度图编排（图设计器）前置调研

**当前模型**：anthropic/claude-sonnet-5，可承担角色：规划模型（入口 Agent / 首席规划 Agent / 上下文 Agent）
**任务来源**：F01（大模型管理）Step1-5 已全部 PASSED，规划层准备为 M07-F02（调度图编排）拆分 Step，但 memory 中信息截止于 Step5（多Key轮询），Step3（工具沙箱）/Step4（会话持久化）/Step5 落地后图编排相关代码是否发生变化未经核实，需重新确认真实现状再设计方案。

---

## 需要回答的问题

### 问题 1：`AgentGraphFactory` 当前真实完整源码与图结构

文件路径：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java`（若文件名/路径有出入，先 `find Smart-WorkFlow/sw-basic/sw-basic-agent -iname "*GraphFactory*"` 定位）

- 完整贴出当前文件源码。
- 当前图拓扑是否仍是 memory 记载的「START→callModel→END 单节点」？Step3 工具沙箱、Step5 多Key轮询落地后，节点数量/边结构/`StateGraph` 构造代码是否发生变化（是否新增节点，还是仍在单节点内部通过代码逻辑处理工具调用与Key切换）？
- `addNode`/`addEdge` 相关代码是否仍是 Java 硬编码，有无任何外部化配置（YAML/JSON/DB）迹象？

### 问题 2：图定义持久化现状

- `grep -rln "sw_agent_graph\|GraphDefinition\|graph_def" Smart-WorkFlow/sw-basic/sw-basic-agent/src/` 是否有命中（确认 Step2 决策"不建图定义 CRUD 表"是否仍然成立，Step3/4/5 是否新增了任何图定义相关表或实体）。
- 当前全仓库 agent 路径 Flyway 版本号（`find Smart-WorkFlow/ -path '*/.claude/worktrees/*' -prune -o -path '*/db/migration/agent/*' -name 'V*.sql' -print | sort -V`），确认 V24（Step5）是否仍是最大版本号，V25+ 是否空闲。

### 问题 3：`sw_agent_tool_internal`/`sw_agent_tool_external` 与图节点的关系

文件路径：Step3 相关表结构与 `AgentGraphFactory`/`AgentOrchestrationServiceImpl` 中工具调用的接入点

- 工具沙箱（Step3）是作为图中的独立节点存在，还是作为 `callModel` 单节点内部的 FunctionToolCallback 注入（ThreadLocal `tools` 四件套）？完整贴出当前 `AgentOrchestrationServiceImpl` 中工具注入相关的方法体。
- 若 F02 要做"可视化拖拽：LLM 节点/工具节点/条件分支/并行/循环"，当前后端代码结构下"工具节点"是否已有对应的图节点级实现，还是完全平铺在单节点内（需要明确回答，这直接影响 F02 图设计器对应的后端图执行引擎是否需要重构）。

### 问题 4：前端 `flow-graph` adapter 与 `modules/agent/` 当前接入状态

- `grep -rln "adapters/flow-graph" Smart-WorkFlow-Web/src/modules/` 是否仍为零命中（确认 kickoff 回执记载的"零消费方"现状是否仍然成立）。
- `Smart-WorkFlow-Web/src/modules/agent/` 目录当前完整文件清单（`find Smart-WorkFlow-Web/src/modules/agent -type f`），是否仍只有 `AgentHome.vue` 占位。
- Vue Flow adapter（`Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts`）导出契约是否有变化（对比 kickoff 回执记载的 6 个导出符号，完整贴出当前文件源码）。

### 问题 5：仓库现有"树状/图状结构 CRUD + 版本管理 + 发布"设计先例

搜索范围：`Smart-WorkFlow/sw-basic/`、`Smart-WorkFlow/sw-biz*/` 下是否有类似"版本管理"（version/publish/draft）语义的现有模块（如表单设计器 `sw-biz-form` 是否有版本/发布概念，BPM 流程定义是否有版本管理）。

- 若命中，贴出字段名/表结构/发布流程摘要（供 F02"图管理：CRUD/发布/版本管理"参考命名和状态机设计）。
- 若无命中，明确标注"仓库无版本/发布先例，需规划层自定设计"。

### 问题 6：`knowledge/known-issues.md` 中 I13 当前状态

- I13（M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定）当前状态描述是否已更新（Step1-5 落地后，"执行引擎落地形态""工具沙箱边界"两项是否已从 I13 中标记为解决，只剩"RAG 向量库选型""与流程/表单联动点"未决）？完整贴出 I13 当前原文。

---

**搜索范围**：
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/`（含 `AgentGraphFactory`、`ChatModelFactory`、相关 Service）
- `find Smart-WorkFlow/ -path '*/.claude/worktrees/*' -prune -o -path '*/db/migration/agent/*' -name 'V*.sql' -print`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java`
- `Smart-WorkFlow-Web/src/modules/agent/`、`Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts`
- `Smart-WorkFlow/sw-biz-form/`、BPM 流程定义相关模块（版本/发布先例检索）
- `knowledge/known-issues.md`（I13 条目）

**禁止范围**：
- 不得修改任何文件
- 不得运行 `mvn compile`/`mvn test`/`pnpm build` 等触发编译的命令（可用 `find`/`grep`/文件读取）
- 不得对 F02 图设计器的具体节点类型设计、DSL 结构、表结构命名做设计建议——只汇报"当前代码真实是什么样、仓库已有什么可参照的先例"，设计决策由规划层做

**预期证据**：
- 问题 1-4：均为文件真实现存内容的完整贴出或明确的 grep/find 结果，不得摘要替代
- 问题 5-6：命中则给出文件路径+行号原文；未命中则明确标注"无先例"/"未更新"

**完成标准**：6 个问题均有明确答案或明确标注"未找到/不存在/无先例"（含具体原因），证据可追溯到具体文件路径+行号。

**执行模型**：`deepseek/deepseek-v4-pro`（涉及对多个 Java 源文件的完整、准确摘录，以及判断"工具节点是否已有图节点级实现"这类需要理解代码语义的问题，长上下文一次性读取多个真实源码文件，用 pro 保证摘录准确不遗漏）

**回执位置**：`search_fallback/m07-f02-graph-designer-precedent.md`
