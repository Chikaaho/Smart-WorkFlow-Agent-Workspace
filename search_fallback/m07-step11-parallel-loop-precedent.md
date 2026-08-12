# 探索回执：M07「并行/循环节点」前置调研

**执行时间**：2026-08-12
**执行模型**：deepseek/deepseek-v4-flash（执行层 subagent × 2：后端引擎 / 前端图设计器）
**任务文件**：`search_task/m07-step11-parallel-loop-precedent.md`
**结论**：7 问全部有现场证据；关键断言已由执行层抽查复核，与 subagent 报告一致，无偏差。

---

## 探索结论（一句话版）

当前图执行引擎是**纯单路径顺序解释**（`AgentGraphInterpreter`，无 Spring 注解）：单 `current` 指针 + `while` 循环，每步经出边解析出**唯一**下一节点（非条件节点出边多于一条直接抛错），END 节点结束。**没有任何多路径/并发/扇出支持，也没有任何「无环假设」**——环是被容忍的：发布校验不查环、执行时由全局步数上限 `maxSteps = 节点数 × 2` 兜底。前端同样零边校验（vue-flow 默认 `isValidConnection` 恒真），节点类型为开放字符串、config 为不透明 Map 原样透传。结论：**循环节点可以最小成本落地（CONDITION 关键词路由 + 回边 + maxSteps 预算改造即可复用），并行节点需要新增执行模型（FORK/JOIN 语义与变量合并语义），是真正的架构增量。**

---

## 检查范围

- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/`：`orchestration/AgentGraphInterpreter.java`、`service/impl/AgentGraphExecutionServiceImpl.java`、`service/impl/AgentGraphDefServiceImpl.java`、`dto/graph/GraphElement.java`、`dto/graph/ProcessGraph.java`、`entity/AgentGraphDef.java`、`controller/AgentGraphDefController.java`、`dto/AgentGraphDefDTO.java`
- 测试佐证：`sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTest.java`（用例 3/4/6/9/11）
- Flyway：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/V25__init_agent_graph_def.sql`、`db/migration/h2/V26__agent_graph_menu_seed.sql`
- 前端：`Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.ts`、`src/modules/agent/views/GraphDesigner.vue`、`src/modules/agent/GraphDefList.vue`（同目录）、`src/contracts/agent.ts`、`src/adapters/flow-graph/index.ts`、测试 `graphAdapter.spec.ts`/`GraphDesigner.spec.ts`
- 辅助文档（已确认结论直接引用，未重新验证）：`product/agent-model-orchestration/passed/step-8-graph-interpreter-engine.md`、`step-10-multivar-context-backend.md`、`step-9-graph-designer-frontend.md`

---

## 关键证据（按问）

### 问题 1：解释执行主循环结构 —— 单路径顺序，无并发

**已确认**。`AgentGraphInterpreter.java:161-189` 核心 `run(ProcessGraph graph, String input)`：

```java
GraphElement current = findStart(elements);
Map<String, String> variables = new HashMap<>();
variables.put(DEFAULT_VARIABLE_NAME, input);
int steps = 0;
while (!NODE_TYPE_END.equals(current.getType())) {
    if (++steps > maxSteps) { throw new GraphExecutionException("执行步数超限，图可能存在环路"); }
    ... // LLM/TOOL 执行、START/CONDITION 纯路由
    current = findNode(nextNodeId(current, elements, variables), elements);  // 单后继赋值
}
```

- 遍历方式：从当前节点查其出边（`outgoingEdges`，`Interpreter.java:372-380`：过滤 `kind=="edge" && source==当前id`）→ 得 target id → `findNode` 按 id 定位。非按 elements 顺序扫描。
- **选路唯一性强制**：`nextNodeId`（`Interpreter.java:345-352`）——非 CONDITION 节点出边多于一条抛 `"非条件节点的出边不唯一"`（`:350`）；CONDITION 也只返回单一下一个节点（`Interpreter.java:323-344`）。无队列/无多活跃执行点/无 join 语义。
- 节点类型为 String 常量比较（非 enum）：`NODE_TYPE_START/END/LLM/TOOL/CONDITION`，定义于 `Interpreter.java:74-87`。

### 问题 2：步数上限 —— 全局计数器，非按路径；无递归/嵌套

**已确认**。全局单计数器（循环内 `++steps`），上限由调用方构造时注入：

- `AgentGraphExecutionServiceImpl.java:119-124`：

```java
int nodeCount = (int) graph.getElements().stream().filter(e -> "node".equals(e.getKind())).count();
// §2-E 死循环防护：maxSteps = 节点数 × 2（经验值，允许条件分支来回但不允许无限绕圈）
new AgentGraphInterpreter(..., nodeCount * 2).run(graph, input);
```

- 设计意图为兜底安全网而非循环功能：`step-8-graph-interpreter-engine.md:71` 明示「MVP 无循环节点类型……此为兜底安全网，不是循环节点的功能实现」。
- **对循环功能的直接影响（已确认推论）**：经 CONDITION 回边形成的循环最多约 2 次迭代就触发上限 → 正式循环节点必须改造步数预算（如循环节点按 `maxIteration` 计数、其余路径仍按 2×节点数）。
- 无递归/嵌套：纯迭代 while，无调用栈、无子图节点类型。
- 测试佐证：`AgentGraphInterpreterTest.java:166-182`（用例6，自环 LLM 节点 + maxSteps=4 → 抛步数超限）。

### 问题 3：节点类型枚举与数据结构 —— 5 种 String 常量；config 不透明

**已确认**。类型为 String 常量共 5 种：START/END/LLM/TOOL/CONDITION（`Interpreter.java:74-87`，非 enum）。

- `GraphElement` 仅 6 字段（`dto/graph/GraphElement.java:27-49`）：`id / kind("node"|"edge") / type / source / target / config(Map<String,Object> 不透明) / style`。`ProcessGraph`（`ProcessGraph.java:27-43`）：`graphKey/name/version/elements/canvas`。
- **回边（循环）**：`edge.source/target` 已可表达任意回边（用例6 证明自环可执行），解释器按 id 迭代查找无「无环」假设 → **机械上可直接复用，无需新字段**。已确认。
- **并行分支**：现有字段不足以表达——CONDITION 是单选一语义、非条件节点出边强制唯一、无 join/聚合节点 → 需新增 FORK/PARALLEL 类节点类型 + JOIN/MERGE 类（或 config 键如 `branchMode`），以及解释器层面多活跃执行点/屏障语义。已确认（需新增）。
- **新增字段路径**：`GraphElement.java:18-21` 禁令「config/style 为不透明 Map 原样透传，严禁后端解析其内部字段」→ 节点/边 config 加键不需要 DDL 或 DTO 变更（`keyword/inputVar/outputVar` 即先例，`Interpreter.java:91-104`）。

### 问题 4：CONDITION 关键词路由 —— 可复用表达循环「继续/退出」

**已确认**。`nextNodeId` 条件分支段（`Interpreter.java:323-344`）：出边 `config.keyword` 关键词列表 + `String.contains` 子串匹配 + **elements 原始出现顺序即优先级**（不排序）+ 唯一无 keyword 边为默认边：

```java
if (NODE_TYPE_CONDITION.equals(current.getType())) {
    String matchText = readInput(current, variables);
    for (GraphElement edge : edges) {                       // 出现顺序 = 优先级
        String keyword = keywordOf(edge);
        if (keyword != null && matchText.contains(keyword)) return edge.getTarget();
    }
    List<GraphElement> defaultEdges = edges.stream().filter(e -> keywordOf(e) == null).toList();
    if (defaultEdges.size() == 1) return defaultEdges.get(0).getTarget();
    // 0 条或 >1 条均抛错（"条件分支无匹配且无默认边"/"条件分支默认边不唯一"）
}
```

- 宽松语义：`keywordOf`（`Interpreter.java:359-369`）——config 缺失/键缺失/非 String/空串均视为默认边；执行前校验（`AgentGraphExecutionServiceImpl.java:196-206`）仅查「默认边 ≤1」。
- **对循环的适用性（已确认推论）**：「继续」= 命中关键词的回边（或默认边回边），「退出」= 另一条边指向后续节点——匹配机制完全够用，**循环不需要新节点类型即可机械表达**；需要新增的是 (a) maxSteps 预算（问题 2）、(b) 前端回边建模/展示。
- 测试佐证：`AgentGraphInterpreterTest.java:92-116`（用例3）、`:118-143`（用例4）、`:291-325`（用例11，CONDITION 基于命名变量匹配）。

### 问题 5：命名变量表 —— 单一 HashMap，同键整体覆盖；并行冲突语义未定义

**已确认（读写机制）/ 推测（并行冲突行为）**。`run()` 内局部 `Map<String,String> variables`，初始含默认变量（`Interpreter.java:166-167`，默认名 `"input"`，`Interpreter.java:111`）：

- 读：`readVariable`（`Interpreter.java:275-283`）——`variables.get(varName)`，null 抛「引用了未定义的变量」（运行时错误，无执行前静态校验，类注释 `Interpreter.java:36` 明示）。
- 写：`writeOutput`（`Interpreter.java:290-292`）——纯 `Map.put(resolveVarName(node, outputVar), output)`，**整体覆盖**，新名即创建；变量名缺失/空白/非 String 回落默认变量（`resolveVarName`，`Interpreter.java:298-308`，零迁移锚点）。
- 顺序传递语义：用例9（`AgentGraphInterpreterTest.java:246-269`）——LLM1 写 raw → LLM2 `inputVar=raw` 读 → 写 final → END `inputVar=final`。
- **并行分支同写一变量名**：现实现单线程单指针推进，此场景不可达；代码无任何分支合并/追加逻辑、无测试、无文档定义 → 冲突行为（覆盖/报错/隔离）属**推测**，需新设计（如分支局部变量空间 + JOIN 时合并规则）。

### 问题 6：前端节点类型注册与渲染 —— 无集中注册表；新增 PARALLEL/LOOP 改动面小

**已确认**。类型表达散落两文件三处；vue-flow 画布无自定义 `nodeTypes`（全 `src/` grep 零命中），所有节点默认渲染（纯文本 label）：

| 层级 | 文件:位置 | 改动内容 |
|---|---|---|
| 类型常量 + 显示名 | `modules/agent/utils/graphAdapter.ts:39-43`（`NODE_TYPE_START...CONDITION`）、`:46-52`（`NODE_TYPE_LABELS`，`Record<string,string>` 开放索引） | 加 `NODE_TYPE_PARALLEL/LOOP` 常量 + LABELS 条目 |
| 侧边栏色板 | `GraphDesigner.vue:106-112`（`NODE_TYPES` 数组，点击按钮 `addNode(type)` 自动布点，`:138-149`） | 数组加项 |
| 属性面板 | `GraphDesigner.vue:376-492`（`<template v-else-if>` 链按类型硬编码表单；LLM: `agentModelConfigId/inputVar/outputVar`，TOOL: `toolName/inputVar/outputVar`） | 加新类型表单分支 |
| config 读写 | `updateNodeData`（`GraphDesigner.vue:174-178`）→ `node.data`；落库 `flowGraphDataToElements`（`graphAdapter.ts:112`）config 整包回填 | 无需改，config 全程不透明 `Record<string,unknown>` 透传，前端无任何结构校验 |
| contracts | `src/contracts/agent.ts:38`（`type?: string` 开放字符串，注释自带 `…`）、`:44-47`（config/style 不透明） | **零类型改动**；仅注释行可更新 |
| adapter | `src/adapters/flow-graph/index.ts:107-127`（未传 `nodeTypes`） | **无需改**；除非要求按类型差异化图标/颜色（受 step-9 §9「不得现场扩展 adapter 导出面」约束，需另评估） |
| 测试 | `graphAdapter.spec.ts:114-126` 已有「未知节点类型（预留扩展）不崩溃，原样透传」用例（用的正是 `type: 'LOOP'`） | 直接扩展此模式 |

- **CONDITION 分支 UI 参考模式（已确认）**：节点无特殊渲染，分支语义全部落在**边标签**——`config.keyword → FlowGraphEdge.label`（`graphAdapter.ts:79-86`，画布原生渲染边标签），反向 `edge.label.trim() → config.keyword`（`:117-132`）；条件配置入口放 CONDITION 节点属性面板内（`GraphDesigner.vue:470-492`，按 `conditionOutEdges` 逐边编辑关键词，写 `edge.label` 后 remountCanvas）。注意：**当前 UI 无「添加出边」入口**，出边靠画布拖连生成，面板只做关键词编辑/删除——并行/循环的多出边/多入边若需面板内建边，属新增面。

### 问题 7：图定义存储 / 发布校验 / 无环假设 —— 全链路无 DAG 假设

**已确认**。

- **存储**：V25 建表 `sw_agent_graph_def`（迁移实际在 sw-bootstrap，agent 模块自己的 `db/migration/agent/` 仅 `.gitkeep`）。字段（h2 用 CLOB / pg 用 TEXT）：`id, graph_key(100), name(200), def_version, status('DRAFT' 默认), graph_json, create_time, create_by, update_time, update_by, deleted, tenant_id, version`；唯一索引 `uk_sw_agent_graph_key(tenant_id, graph_key)`。文件：`sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/V25__init_agent_graph_def.sql:8-25`。V26 仅 sys_menu seed（`db/migration/h2/V26__agent_graph_menu_seed.sql`），无表结构变更；范围内无其他引用该表的 DDL。
- **发布校验（不查环）**：`AgentGraphDefServiceImpl.java:130-155` `publish()`——① 图可解析且 elements 非空；② 已发布则 graphKey 冻结检查；③ 版本递增+状态。类注释（`:33-38`）明示「纯存储+管理，无任何执行语义……完整拓扑校验与解释执行留 Step8」；草稿保存不跑校验（允许存残图，`:98`）。
- **拓扑校验在执行路径而非发布路径**：`AgentGraphExecutionServiceImpl.java:148-211` `validateForExecution`——START 唯一、BFS END 可达（`hasReachableEnd`，`:230-259`，`visited.add` 去重本身容忍环）、LLM 配置解析、TOOL 白名单、CONDITION 默认边唯一。
- **前端同样零边校验**：`adapters/flow-graph/index.ts:86-95` `handleConnect` 无条件加边（无 source/target 类型限制、无回边/自环拦截）；全 `src/` grep `isValidConnection` 零命中，vue-flow 默认 `alwaysValid = () => true`。
- **结论：全链路（存储 schema / 发布校验 / 执行校验 / 前端拖连）无任何「图是 DAG」假设**——环在现设计中是「被容忍、运行时兜底」，非发布拦截。

---

## 已确定事实（汇总）

1. 解释引擎纯单路径顺序执行，非条件节点出边强制唯一，无并发/扇出/join 语义（`AgentGraphInterpreter.java:161-189,345-352`）。
2. 步数上限为全局计数器，`maxSteps = 节点数 × 2`，由 `AgentGraphExecutionServiceImpl.java:119-124` 注入；现为死循环兜底而非循环功能。
3. 节点类型 5 种 String 常量（START/END/LLM/TOOL/CONDITION），非 enum；`GraphElement` 仅 id/kind/type/source/target/config/style，config 为不透明 Map，加键零 DDL。
4. CONDITION 关键词子串路由（出现顺序=优先级 + 唯一默认边）可完整表达循环「继续/退出」，无需新匹配机制。
5. 变量表为 `run()` 内局部 HashMap，同键整体覆盖（后写生效）；无并行合并语义。
6. 存储/发布/执行/前端四层均无 DAG 假设；环由运行时 maxSteps 兜底。
7. 前端类型为开放 string + config 不透明透传，新增节点类型零 contracts 改动、无需动 flow-graph adapter；已有 LOOP 未知类型透传测试。
8. CONDITION 分支的 UI 参考模式：分支语义在边标签（keyword），配置入口在节点属性面板。

## 分析推测（明确标注）

- 并行分支同写一变量名 → 按现有 `Map.put` 语义将是「最后执行的分支整体覆盖」；具体冲突策略（覆盖/报错/隔离+JOIN 合并）无代码/测试/文档定义，需新设计。
- 若引入正式循环节点，maxSteps 需从「全图 2×节点数」调整为循环节点自预算（如 `maxIteration`）——改造点已定位，但改法无既有依据。
- 新增 PARALLEL/LOOP 类型在画布上的实际渲染效果（无 nodeTypes 时未知类型节点的视觉表现、handle 可用性）未实测，需实现时验证或扩展 adapter（后者受 step-9 §9 约束需规划层单独评估）。

## 未确认事项

1. **循环/并行是否需要新节点类型**（LOOP/PARALLEL/JOIN 常量与 config 契约）：纯设计决策，代码无迹象（Q3/Q4 已确认机械可行性，取舍归规划层）。
2. **并行分支变量冲突语义**（Q5 推测）：无代码/测试/文档。
3. **maxSteps 改造方案**（Q2）：循环节点自预算 vs 全图预算，无既有设计依据。
4. **执行前静态校验是否升级**：`validateForExecution` 注释自称「非完整拓扑校验器」（`AgentGraphExecutionServiceImpl.java:140-141`），是否加环检测/数据流分析无设计文档。
5. **前端面板内建边**：当前 UI 无添加出边入口，并行/循环的多出边交互若需面板内建属新增面（Q6）。
6. **vue-flow 库级行为细节**：未知类型节点渲染效果、自环是否被库内部 handle 检查拦截，未运行级实测（只读范围内不可运行前端）。

## 冲突信息

未发现文档与现场代码的实质冲突。一处顺带说明：step-8 方案 §2-E「死循环防护」与现场实现一致（环被容忍、运行时兜底），且 step-8 归档对解释器行为的描述与现场代码吻合。

## 是否需要继续探索

**否**。7 问全部有现场证据，关键断言经执行层抽查复核；剩余未确认事项均为设计决策或需实现时实测的细节，不影响规划层判断「并行/循环节点」的影响范围与风险点。

## 建议返回规划层的最小结论

1. **循环节点（低成本）**：现有 CONDITION 关键词路由 + 边 source/target 回边 + `run()` 迭代模型已可机械执行循环（用例6 自环已验证），无 DAG 假设无存储改动；主要改造点：① maxSteps 从全图 2×节点数改为给循环语义留预算；② 前端画布回边建模（当前拖连本就允许回边）与循环配置 UI；③ 是否新增 LOOP 类型属设计取舍，非技术必需。
2. **并行节点（架构增量）**：解释器需新增多活跃执行点模型（当前非条件节点出边唯一、CONDITION 单选一、无 join）；需设计 FORK/JOIN 类型（或 config 分支模式）与「多分支同写变量的冲突/合并语义」（当前变量表为单路径后写覆盖，无并发语义定义）。
3. **改动面已收敛**：后端集中在 `AgentGraphInterpreter`（执行模型）+ `AgentGraphExecutionServiceImpl`（校验/步数预算）+ config 契约（不透明 Map 加键零 DDL）；前端集中在 `graphAdapter.ts`（常量/显示名）+ `GraphDesigner.vue`（色板/属性面板），contracts 与 flow-graph adapter 无需改动。
4. **主要风险点**：步数上限与循环迭代数的预算冲突；并行分支变量合并语义的契约设计；前端画布未知类型渲染与多出边交互需实测验证。
