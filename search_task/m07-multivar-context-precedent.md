# 探索任务：M07「多变量执行上下文」前置调研

**当前模型**：anthropic/claude-sonnet-5，可承担角色：规划模型（仅规划，不探索代码）

**任务目标**：M07-F02 图设计器 Step8/Step9 已 PASSED（D64/D65），图解释执行引擎 `AgentGraphInterpreter` 当前 execution context 是单一 `String currentText`（LLM/工具节点输出整体覆盖，见 `product/agent-model-orchestration/passed/step-8-graph-interpreter-engine.md` §2-B/§3"不包含"第3条）。本轮待规划功能：把 execution context 从单一 `currentText` 扩展为**多变量存取**（节点可指定"从哪个变量读输入""结果写到哪个变量"），作为后续"并行/循环节点"批次的地基（并行分支需要各自独立的变量空间，单值覆盖会互相冲突）。

规划层需要在起草执行方案前摸清：①`AgentGraphInterpreter`/`AgentGraphExecutionServiceImpl`/`GraphElement`/`ProcessGraph` 的**当前真实完整源码**（Step9 未触碰后端，理论上应与 Step8 落地时一致，但不采信历史回执声称，需现场确认）；②节点 `config` 当前真实 JSON 结构（LLM/TOOL/CONDITION 三类节点 `config` 字段当前支持哪些 key，是否已有任何"变量名"语义字段）；③前端 `graphAdapter.ts`/`GraphDesigner.vue` 属性面板当前如何编辑节点 `config`（新增"输入变量名/输出变量名"字段需要改动哪些文件、遵循什么现有模式）；④仓库是否已有"多变量存取/上下文对象"命名先例（如其他模块的执行上下文/变量池设计）。

---

**需要回答的问题**：

### 问题 1：`AgentGraphInterpreter.java` 当前真实完整源码

文件路径：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java`

- 完整贴出当前文件源码（不是方案原文，是磁盘现存内容）。
- 确认 `run()`/核心循环方法的当前完整签名和实现，尤其是 `text`/`currentText` 变量在方法体内的传递方式（局部变量 vs 字段），及 `callLlmNode`/`callToolNode`/条件分支匹配三个方法的当前完整实现（含参数、返回值类型）。

### 问题 2：`AgentGraphExecutionServiceImpl.java` 当前真实完整源码

文件路径：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImpl.java`

- 完整贴出当前文件源码，尤其是 `execute()` 方法如何构造 `AgentGraphInterpreter` 实例并调用 `run()`，`AgentGraphExecuteReqDTO`/`AgentGraphExecuteRespDTO` 当前完整字段清单（贴出这两个 DTO 文件全文）。

### 问题 3：`GraphElement.java`/`ProcessGraph.java` 当前真实完整源码

文件路径：
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/graph/GraphElement.java`（或规划层记忆记录的实际包路径，若路径不确切先 `find Smart-WorkFlow/ -name "GraphElement.java" -not -path "*/target/*" -not -path "*/.claude/worktrees/*"` 定位）
- 同上定位 `ProcessGraph.java`

- 完整贴出两文件当前源码，尤其 `config` 字段的类型（`Map<String, Object>`？自定义 DTO？JSON 字符串？）及当前实际支持的 key 有哪些（`grep -rn "getConfig\(\)\." Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/` 找出所有读取 config 具体 key 的调用点，逐一列出）。
- 是否已存在任何"变量名"/"variable"/"varName"/"inputVar"/"outputVar" 语义的字段或 key？若无，明确标注"当前无此类字段"。

### 问题 4：节点类型常量与执行前校验的当前真实实现

- `START`/`END`/`LLM`/`TOOL`/`CONDITION` 五个节点类型常量当前定义在哪个文件、以什么形式（`grep -rn "\"LLM\"\|\"TOOL\"\|\"CONDITION\"" Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/`）。
- `validateForExecution`（或等价执行前校验方法）当前完整实现，贴出源码（用于判断新增"变量名必填校验"应插在哪里）。

### 问题 5：前端 `graphAdapter.ts` 当前真实完整源码

文件路径：`Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.ts`（若路径不确切先 `find Smart-WorkFlow-Web/src -name "graphAdapter.ts"` 定位）

- 完整贴出当前文件源码，尤其 `elementsToFlowGraphData`/`flowGraphDataToElements` 两个函数如何处理节点 `config`（当前 `FlowGraphNode.data` 与 `GraphElement.config` 之间的字段映射关系，逐字段列出）。

### 问题 6：前端 `GraphDesigner.vue` 属性面板当前真实实现

文件路径：`Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.vue`（若路径不确切先 `find Smart-WorkFlow-Web/src -name "GraphDesigner.vue"` 定位）

- 贴出属性面板相关的完整代码段（按节点类型切换表单字段的部分，`<script setup>` 中操作 `config` 的部分），确认当前 LLM 节点表单有哪些输入框（下拉选模型？）、TOOL 节点有哪些输入框（下拉选工具？），新增"输入变量名/输出变量名"输入框大致改动位置。

### 问题 7：仓库现有"多变量/上下文对象/变量池"设计先例

搜索范围：
- `grep -rln "variable\|varName\|contextVar\|变量池\|上下文变量" Smart-WorkFlow/sw-basic/ Smart-WorkFlow/sw-biz/ 2>/dev/null`（后端全局搜索，排除 target/worktrees）
- `grep -rln "variable\|varName\|contextVar" Smart-WorkFlow-Web/src/ 2>/dev/null`
- sw-bpm 模块（Flowable）是否有类似"流程变量"（BPMN process variable）概念可参照命名（`grep -rln "processVariable\|流程变量" Smart-WorkFlow/sw-biz/sw-bpm* 2>/dev/null`）

- 若命中，贴出具体设计（字段名/类型/存取方式）。
- 若无命中，明确标注"仓库无先例，需规划层自定命名"。

---

**搜索范围**：
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImpl.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecuteReqDTO.java` + `AgentGraphExecuteRespDTO.java`
- `find Smart-WorkFlow/ -name "GraphElement.java" -o -name "ProcessGraph.java"`（排除 target/worktrees，现场定位真实包路径）
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/`（grep 节点类型常量、config key 读取点、validateForExecution 实现）
- `find Smart-WorkFlow-Web/src -name "graphAdapter.ts" -o -name "GraphDesigner.vue"`
- `Smart-WorkFlow/sw-biz/sw-bpm*`（流程变量命名先例检查）

**禁止范围**：
- 不得修改任何文件
- 不得运行 `mvn compile`/`mvn test`/`pnpm build` 等触发编译的命令（可用 `find`/`grep`/文件读取）
- 不得对"多变量执行上下文"具体字段命名、数据结构（Map vs 具名对象）、节点 config schema 改造方式做设计建议——只汇报"当前代码真实是什么样、仓库已有什么可参照的命名先例"，设计决策由规划层做
- 若某文件不存在、某先例不存在，明确标注"不存在"/"无先例"，不得以训练记忆补填

**预期证据**：
- 问题 1-6：均为文件真实现存内容的完整贴出，不得摘要替代（这些文件是本次改造的直接对象，必须是磁盘现状）
- 问题 7：命中则给出文件路径+行号+设计摘要；未命中则明确标注"无先例"

**完成标准**：7 个问题均有明确答案或明确标注"未找到/不存在/无先例"（含具体原因），证据可追溯到具体文件路径+行号。

**执行模型**：`deepseek/deepseek-v4-flash`（本任务是纯粹的现状摘录+grep 检索，不涉及需要 pro 级语义判断的架构决策，flash 足以准确完整摘录多个源码文件）

**失败处理**：若问题 7 三处搜索全部落空，如实标注"仓库无多变量/上下文命名先例"，规划层将据此自定命名规则，不算调研失败。若问题 1-3 中任一文件与 Step8/Step9 归档方案描述有出入（如字段名不同、方法签名不同），如实按磁盘现状汇报，不得为了与历史方案一致而"纠正"现场读到的内容。

**回执位置**：`search_fallback/m07-multivar-context-precedent.md`
