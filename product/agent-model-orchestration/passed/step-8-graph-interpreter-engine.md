# Step 8 执行方案：M07-F02 图解释执行引擎第一版

**状态**：Ready — 待执行
**前置**：Step7（图定义 CRUD+版本+发布骨架）PASSED（362 tests，D63）；Step6 设计澄清（`passed/`待归档确认，见下）三项决策
**范围依据**：Step6 §4.1 第 2 条 + Step7 §15 展望（"Step8 将消费本表 graph_json：按 elements 顺序/条件边解释执行"）
**回执位置**：`product/agent-model-orchestration/receipts/step-8-{execution,test}.md`
**推荐执行模型**：`deepseek/deepseek-v4-pro`（本 Step 无仓库内可逐行照抄的先例——sw-bpm 的执行落地是"翻译为 BPMN 部署给 Flowable"，agent 图执行是"自建解释器直接走 elements/edges"，两者语义不同，需要更强的新架构落地能力而非模式复制；如需成本优化可替换为 flash，但建议保留 pro 优先）

---

## §1 背景与目标

Step6 确定了三项决策：①工具节点是独立图节点②MVP 节点=LLM+工具+条件分支③执行引擎必须走图定义驱动解释执行（技术必然结果）。Step7 落地了图定义的存储/发布骨架（`sw_agent_graph_def` + `ProcessGraph`/`GraphElement`），但**未实现任何执行语义**——发布只是状态位翻转，`graph_json` 从未被"跑"过。

Step8 的目标：给一个**已发布**的图定义一次性执行入口——按 `elements`（节点+边）解释遍历，依次执行 LLM 节点/工具节点，在条件分支节点处按边的关键词条件选路，直到 END 节点，返回最终输出。这是 F02 从"能画图、能存图"到"图能跑起来"的关键落地。

**范围边界（重要）**：本 Step **不修改、不复用 `AgentGraphFactory`/LangGraph4j `StateGraph`**，也**不改动 F01 既有 `/agent/orchestration/run` 接口**——两者是并存的两条独立执行路径（§2 架构决策 A 详述原因），互不干扰、互不依赖。

## §2 架构决策

### A. `AgentGraphFactory`/LangGraph4j 依赖去留 —— 保留不动，F02 建全新独立解释器，两条执行路径并存

**结论**：`AgentGraphFactory`（LangGraph4j `StateGraph` 单节点工厂）**零改动、不废弃**，继续服务 F01 现有的 `/agent/orchestration/run`（隐式 agentic 调用：LLM 内部 Function Calling 决定是否调工具，单次请求-响应，341+21=362 个既有测试覆盖，行为不可变）。

F02 新建一个**完全独立**的 Java 类（非 LangGraph4j `CompiledGraph`），直接解释 `ProcessGraph`/`GraphElement`（Step7 产物）的 `elements` 列表，按拓扑走节点/边。理由（技术必然性，非偏好选择）：

- LangGraph4j 1.5.14 的 `StateGraph.addNode`/`addEdge` 是编译期 Java 代码调用（回执问题1(c) 已证实无 JSON/YAML/DB 反序列化入口）。F02 的图结构在**运行时**由用户绘制、存于 `graph_json`，节点数量/类型/连线在请求到达前完全未知——不可能用"编译期已知拓扑"的 API 表达"运行时才确定的拓扑"。这不是"能不能用好 LangGraph4j"的技巧问题，是 API 设计前提（图结构静态）与 F02 需求（图结构动态）根本冲突。
- F01（`/agent/orchestration/run`）与 F02（图执行）语义本就不同：F01 是"LLM 自主决定是否调用工具"的单跳 agentic 调用；F02 是"用户显式画出的多步顺序，工具何时调、条件怎么分支由图拓扑而非 LLM 决定"。二者是两种不同的编排范式，不应该也不需要合并成一套执行引擎——保留两条独立路径反而是符合各自语义的正确设计，不是"技术债"。
- 新解释器**复用**的是更底层的构造块：`ChatModelFactory.build(AgentModelConfig, apiKey)` 构造 `ChatModel`（LLM 节点用）、`AgentToolCallbackFactory` 的白名单装载逻辑（工具节点用，需按名称精确定位单个 `ToolCallback` 而非像 F01 一次性批量注入全部）——这两个类**不改动**，只是被新解释器以不同方式调用。

### B. 节点类型与执行语义

MVP 三种节点类型（`GraphElement.type`，`kind='node'`）+ 隐式 `START`/`END`（Step7 `create` 已生成）：

| 节点类型 | `type` 值 | 执行语义 |
|---|---|---|
| 开始 | `START` | 无动作，直接沿唯一出边前进（Step7 初始图已含） |
| 结束 | `END` | 终止执行，当前累积文本即为最终 `output` |
| LLM 节点 | `LLM` | `config.agentModelConfigId`（Long，必填）指定使用哪个 `AgentModelConfig`；解密 Key → `ChatModelFactory.build()` → 用当前累积文本作为 `UserMessage` 调用一次模型（不带工具、不带历史——历史/多轮是 F01 语义，图执行节点各自独立单跳）→ 模型输出覆盖累积文本 |
| 工具节点 | `TOOL` | `config.toolName`（String，必填）按名称精确匹配 `sw_agent_tool_internal`/`sw_agent_tool_external` 中 `enabled=1` 的一条 → 构造单个 `ToolCallback` → 用当前累积文本作为工具入参调用 → 工具返回文本覆盖累积文本 |
| 条件分支节点 | `CONDITION` | 节点本身无动作，是纯路由点；下一步按其**出边**决定（见 §2-C） |

**"累积文本"（execution context）**：本版极简，只维护一个 `String currentText`（初始 = 请求 `input`），每个 LLM/工具节点执行后整体覆盖（非追加、非结构化多变量），END 节点时的 `currentText` 即为最终 `output`。这是本版明确的简化边界（§3 已列入"不包含"）——真正的多变量数据流/上下文对象是可预见的下一批次演进方向，本版不做。

### C. 条件分支求值方式 —— 本 Step 正式拍板并实现（Step6/Step7 遗留的推荐值，转为定案）

沿用 Step6 §2 决策2 / Step7 §9 的推荐值：**边携带关键词，按边顺序逐条匹配当前文本，取第一个命中的边**；未命中时走"默认边"（无 `config.keyword` 字段，或 `config.keyword` 为空的边）。

具体规则：
1. 条件分支节点的**出边**（`source == 该节点.id` 的边）中，每条边的 `config` 可含 `keyword`（String）字段。
2. 按边在 `elements` 列表中的出现顺序（**不排序，图定义中的原始顺序即优先级**，与 sw-bpm"仅解释拓扑不重排"原则一致）逐条检查：若边有 `keyword` 且 `currentText.contains(keyword)` → 命中，走该边。
3. 若全部有 `keyword` 的边未命中，取**唯一一条无 `keyword`（或 `keyword` 为空串/null）的边**作为默认边；若不存在默认边 → 抛运行时错误"条件分支无匹配且无默认边"（图设计缺陷，非法状态，不静默吞掉）。
4. 若存在 ≥2 条无 `keyword` 的边（默认边不唯一）→ 图非法，同样报错（发布/执行时校验，见 §2-D）。
5. 不引入 SpEL/MVEL/正则引擎依赖，`keyword` 仅做**子串包含**匹配（`String.contains`），与 Step6/7 文档"不引入独立表达式引擎"的决策一致。**不支持正则**（Step6 原文提到"关键词/正则"两种可能，本 Step 落地时收窄为仅关键词子串匹配，作为实现裁定记录在此，不在方案外静默扩展）。

### D. 执行前校验（比 Step7 发布门更严格，但仍非完整拓扑校验器）

Step7 发布门只做"图可解析 + elements 非空"。Step8 执行前**额外**做以下最小校验（发布时不做，执行时才做，理由：校验规则与节点类型强相关，Step7 时节点类型未定，现在才能定）：

1. 图必须处于 `PUBLISHED` 状态（执行只认发布版本，草稿不可执行——对齐"发布版本是执行引用的稳定锚点"）
2. 存在且仅存在一个 `START` 节点、至少一个 `END` 节点可达
3. `LLM` 节点的 `config.agentModelConfigId` 必须能解析到租户内存在的 `AgentModelConfig`
4. `TOOL` 节点的 `config.toolName` 必须能精确匹配一条 `enabled=1` 的工具白名单记录
5. `CONDITION` 节点的出边集合满足 §2-C 规则 4（默认边唯一或不存在歧义）
6. 执行步数上限（防死循环兜底，见 §2-E）

任一校验失败 → 不执行，返回明确错误信息（`PARAM_ERROR` + 具体原因），**不做部分执行**。

### E. 死循环防护（并行/循环节点未实现，但恶意/错误图仍可能画出环）

MVP 无循环节点类型，但用户仍可能手绘出图环（如 A→B→A 的边，不经过循环节点语义，纯拓扑意外形成环）。**执行步数硬上限**：`maxSteps = elements 中节点数 × 2`（经验值，允许条件分支来回但不允许无限绕圈），超过则终止并报错"执行步数超限，图可能存在环路"，不无限执行耗尽资源。此为兜底安全网，不是循环节点的功能实现（循环语义仍在 Step6 todo）。

## §3 范围裁定

### 本 Step 包含

1. **执行引擎核心类**（1 文件）：`AgentGraphInterpreter`（纯 Java，无 Spring 依赖，遍历 `ProcessGraph.elements`，按 §2-B/C/D/E 逻辑执行，返回最终文本 + 是否成功）
2. **Service**（2 文件）：`AgentGraphExecutionService` 接口 + 实现（加载图定义 → 校验 PUBLISHED → 反序列化 `graph_json` → 校验 §2-D → 调 `AgentGraphInterpreter` → 封装结果）
3. **DTO**（2 文件）：`AgentGraphExecuteReqDTO{input}`、`AgentGraphExecuteRespDTO{success, output, errorMessage, latencyMs}`
4. **Controller 端点**（1 个新增，追加到既有 `AgentGraphDefController`）：`POST /agent/graph-defs/{id}/execute`
5. **节点类型常量**：`START`/`END`/`LLM`/`TOOL`/`CONDITION`（沿用 D52 精神，String 常量非 enum）
6. **测试**：解释器单测（覆盖 LLM/工具/条件分支/校验失败/步数上限各路径）+ Controller 测试
7. **文档/记忆产出**：执行方案（本文件）、执行回执、测试回执、方案归档、memory 更新

### 本 Step 不包含

- **并行节点、循环节点**（Step6 todo，维持）
- **调试运行/单步调试**（依赖节点级中间状态暴露的 UI 设计，Step6 标注"未讨论"，本 Step 只做一次性整体执行，不暴露逐节点中间结果给调用方）
- **多变量执行上下文**（§2-B 已声明简化为单一 `currentText`，结构化上下文是可预见但本版不做的演进方向）
- **完整拓扑校验器**（sw-bpm 级 `GraphValidator` 全规则）——§2-D 是执行专用的最小充分校验，不是通用图合法性校验器
- **执行历史持久化**（不写会话/消息表，不新建执行日志表——本版返回值即结果，不落库；执行记录能力留后续批次，若需审计再补）
- **正则表达式条件匹配**（§2-C 已收窄为关键词子串匹配）
- **前端任何文件**
- **新依赖**（无 SpEL/MVEL/新 jar）
- **修改 `AgentGraphFactory`/`ChatModelFactory`/`AgentToolCallbackFactory`/`AgentOrchestrationServiceImpl`/F01 既有接口**（§2-A 已定，零改动）
- **多 Key 轮询/限流**（F02 图执行的 LLM 节点当前版本直接用 `config.agentModelConfigId` 指向单个配置，不支持组内候选切换——这是 F01 Step5 的能力，图节点级轮询语义超出本 Step 范围，推入 todo）

## §4 新建文件清单

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  orchestration/AgentGraphInterpreter.java          （核心解释器，无 Spring 依赖，纯逻辑，便于单测）
  dto/AgentGraphExecuteReqDTO.java
  dto/AgentGraphExecuteRespDTO.java
  service/AgentGraphExecutionService.java
  service/impl/AgentGraphExecutionServiceImpl.java
Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/
  orchestration/AgentGraphInterpreterTest.java
  service/impl/AgentGraphExecutionServiceImplTest.java
```

**改动（1 文件，追加方法，非结构性修改）**：`AgentGraphDefController.java` 追加 `POST /{id}/execute` 端点（权限沿用 `agent:model:manage`，与发布同级——执行是消耗模型调用成本的操作，归入 manage 而非 view，理由与 Step7 §4-C 一致）。

**零修改**：`AgentGraphFactory`/`AgentGraphAutoConfiguration`/`ChatModelFactory`/`AgentToolCallbackFactory`/`AgentOrchestrationServiceImpl`/V19-V25 任何脚本/前端/pom.xml。

## §5 Service 接口与执行流程

```java
public interface AgentGraphExecutionService {
    AgentGraphExecuteRespDTO execute(Long graphDefId, String input);
}
```

**执行伪代码**（`AgentGraphExecutionServiceImpl.execute`）：

```java
AgentGraphDef entity = requireEntity(graphDefId);              // NOT_FOUND（同 Step7 requireEntity）
if (!STATUS_PUBLISHED.equals(entity.getStatus()))
    throw PARAM_ERROR("图未发布，无法执行");
ProcessGraph graph = parseGraph(entity.getGraphJson());
if (graph == null || isEmpty(graph.getElements()))
    throw PARAM_ERROR("图数据为空，无法执行");
validateForExecution(graph);                                    // §2-D 1-5 项静态校验
long start = currentTimeMillis();
try {
    String output = new AgentGraphInterpreter(chatModelFactory, agentToolCallbackFactory, cipher,
            tenantId(), maxSteps(graph)).run(graph, input);      // §2-E 步数上限
    return success(output, currentTimeMillis() - start);
} catch (GraphExecutionException e) {
    return failure(e.getMessage(), currentTimeMillis() - start); // 不上抛，与 F01 run() success=false 语义一致
}
```

**`AgentGraphInterpreter.run()` 核心循环**（简化示意）：

```java
GraphElement current = findStart(graph);          // 唯一 START 节点
String text = input;
int steps = 0;
while (!"END".equals(current.getType())) {
    if (++steps > maxSteps) throw new GraphExecutionException("执行步数超限，图可能存在环路");
    switch (current.getType()) {
        case "LLM"       -> text = callLlmNode(current, text);
        case "TOOL"      -> text = callToolNode(current, text);
        case "CONDITION" -> { /* 不动 text，仅决定下一节点 */ }
        case "START"     -> { /* 不动 text */ }
    }
    current = nextNode(graph, current, text);      // CONDITION 节点走 §2-C 匹配；其余节点取唯一出边
}
return text;
```

## §6 边界情况

| 场景 | 预期行为 |
|---|---|
| 执行 DRAFT 状态的图 | `PARAM_ERROR`"图未发布，无法执行" |
| `graph_json` 为空/损坏 | `PARAM_ERROR`"图数据为空，无法执行" |
| LLM 节点 `config.agentModelConfigId` 指向不存在/跨租户配置 | 执行前校验拦截，`PARAM_ERROR`"LLM 节点引用的模型配置不存在" |
| TOOL 节点 `config.toolName` 无匹配白名单条目 | 执行前校验拦截，`PARAM_ERROR`"工具节点引用的工具不存在或未启用" |
| CONDITION 节点无默认边、且当前文本未命中任何关键词 | 运行时抛 `GraphExecutionException`，`execute()` 捕获返回 `success=false` |
| CONDITION 节点默认边不唯一（≥2 条无 keyword 边） | 执行前校验拦截，`PARAM_ERROR`"条件分支默认边不唯一" |
| 图中存在环（非法拓扑，非循环节点语义） | 步数超限终止，`success=false` + 错误信息 |
| LLM/工具节点调用本身抛异常（如模型 API 报错、工具执行报错） | 不做 F01 式多 Key 轮询/重试（§3 已声明推入 todo），直接终止，`success=false` + 异常摘要 |
| 不存在的 `graphDefId` / 跨租户 | `NOT_FOUND`（同 Step7 `requireEntity`） |
| `input` 为空 | `PARAM_ERROR`"input 不能为空"（对齐 F01 `run()` 校验） |

## §7 测试要求

**`AgentGraphInterpreterTest`**（纯 Java 单测，mock `ChatModelFactory`/`AgentToolCallbackFactory`，不起 Spring 上下文，快速）：
- LLM 节点单跳执行 → 文本被模型输出覆盖
- 工具节点单跳执行 → 文本被工具返回值覆盖
- 条件分支命中关键词边 → 走对应分支
- 条件分支未命中 → 走默认边
- 条件分支无匹配且无默认边 → 抛 `GraphExecutionException`
- 图存在环 → 步数超限终止
- LLM/START/END 顺序链路完整执行（START→LLM→END）

**`AgentGraphExecutionServiceImplTest`**（@SpringBootTest + H2，复用 Step7 装配模式）：
- 执行已发布图 → 返回预期输出
- 执行 DRAFT 图 → PARAM_ERROR
- 执行不存在 id → NOT_FOUND
- LLM 节点引用不存在模型配置 → 执行前 PARAM_ERROR
- TOOL 节点引用不存在/未启用工具 → 执行前 PARAM_ERROR
- 跨租户执行 → NOT_FOUND

**Controller 测试**：`POST /{id}/execute` 200 语义 + 403 权限（复制 `AgentGraphDefControllerTest` 装配）。

**全量回归**：`mvn test` ≥ 362（Step7 基线），0 failures 0 errors。

## §8 禁止范围

1. 禁止修改 `AgentGraphFactory`/`AgentGraphAutoConfiguration`/`ChatModelFactory`/`AgentToolCallbackFactory`/`AgentOrchestrationServiceImpl`（git diff 为空）
2. 禁止修改 V19-V25 任何脚本、禁止新建 Flyway 版本（Step8 无表结构变更，复用 Step7 的 `sw_agent_graph_def`）
3. 禁止修改前端任何文件
4. 禁止引入新依赖（无 SpEL/MVEL/正则引擎/新 jar）
5. 禁止新增权限码（沿用 `agent:model:manage`）
6. 禁止实现并行/循环节点、多变量上下文、执行历史持久化、单步调试（均已在 §3 明确推入 todo/排除）
7. 禁止静默扩展条件匹配为正则（§2-C 已收窄为关键词子串匹配，若执行中发现子串匹配不够用，需在回执中如实记录并停止，交回规划层决策，不擅自加正则）

## §9 验收标准

| # | 验收项 | 验证方式 |
|---|---|---|
| 1 | `AgentGraphFactory`/LangGraph4j 相关 4 文件零改动（git diff 为空），F01 既有 362 测试零回归 | git diff + 全量测试 |
| 2 | LLM 节点执行：解密 Key→`ChatModelFactory.build()`→单跳调用→文本覆盖，全链路真实跑通 | 单测 + mock 边界的现场验证（若真实调模型受限，需在回执说明降级验证方式） |
| 3 | 工具节点执行：按 `toolName` 精确匹配白名单→单个 `ToolCallback`→调用→文本覆盖 | 单测 |
| 4 | 条件分支：关键词命中/未命中默认边/无默认边报错，三路径全覆盖 | 单测 |
| 5 | 执行前校验 §2-D 五项全部实现且有对应测试 | 单测逐项覆盖 |
| 6 | 步数上限防死循环，人为构造环路图验证终止而非挂死 | 单测 |
| 7 | 执行仅接受 PUBLISHED 图，DRAFT 图执行报错 | 单测 |
| 8 | 跨租户隔离（沿用 Step7 租户拦截器机制） | 单测 |
| 9 | Controller 新端点 200/403 语义 | Controller 测试 |
| 10 | 全量 `mvn test` ≥ 362，0 failures 0 errors | surefire 摘录 |
| 11 | 禁止范围静态检查（§8 各项 git diff/grep） | 回执附证据 |

## §10 执行顺序

1. `AgentGraphInterpreter` 核心类 + 纯 Java 单测（不依赖 Spring，先把最复杂的执行逻辑独立验证）
2. `AgentGraphExecutionService`/`Impl`（校验 §2-D + 调用解释器）
3. DTO + Controller 端点追加
4. Service/Controller 集成测试
5. `mvn test`（模块 → 全量），确认 ≥ 362，0 failures
6. 静态检查（§8 各项 git diff/grep）
7. 回执写入 `receipts/step-8-{execution,test}.md`；方案归档 `ready/` → `passed/`；memory 三件套更新
8. 双仓库提交（严禁 Co-Authored-By 尾行）

## §11 展望（仅记录，不实现）

Step9（前端图设计器）将消费 Step7 的 CRUD/发布 API + 本 Step 的执行 API，提供可视化画图 + 一键执行体验。后续批次：并行/循环节点语义、多变量执行上下文、单步调试（依赖节点级中间状态暴露接口，需在本 Step 执行模型稳定后单独设计）、执行历史持久化与审计、图节点级多 Key 轮询。
