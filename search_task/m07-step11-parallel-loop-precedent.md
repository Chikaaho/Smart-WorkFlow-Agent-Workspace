**当前模型**：anthropic/claude-sonnet-5，可承担角色：规划模型（首席规划 Agent）

## 任务目标

M07-F02 图设计器已完结 Step6-10（图定义 CRUD+发布 + `AgentGraphInterpreter` 解释执行引擎 + 命名变量表）。本轮候选功能是 todo 池中的「并行/循环节点」，需要探明当前执行引擎和前端图设计器的现状，为规划层撰写需求方向文档（目标/非目标/影响范围/风险）提供依据。

## 需要回答的问题

1. `AgentGraphInterpreter`（后端 `sw-basic/agent` 模块）当前的解释执行主循环是什么结构？是单路径顺序执行（每步产生唯一下一节点）还是已支持任何形式的多路径/并发？
2. 当前"步数上限"（step limit）的实现方式——是全局计数器还是按路径计数？是否有任何递归/嵌套执行的支持？
3. 图节点类型枚举当前有哪些（START/END/LLM/TOOL/CONDITION 等），节点/边的数据结构（`GraphElement`、边）是否已有字段可复用于表达"并行分支"或"循环回边"，还是需要新增字段？
4. CONDITION 节点当前的关键词子串路由逻辑（D64）能否复用于表达循环的"继续/退出"判断，还是循环需要一种新的节点类型？
5. 命名变量表（Step10，`Map<String,String>`）在当前实现中是否有并发写入/合并语义？如果引入并行分支，多个分支写同一变量名会如何冲突？
6. 前端 `GraphDesigner.vue`/`graphAdapter.ts`（Smart-WorkFlow-Web `modules/agent`）当前的节点类型注册和渲染方式，新增节点类型（PARALLEL/LOOP）大致需要改动哪些文件/层级（不需要设计具体实现，只需明确改动面）？
7. 循环节点如果允许"回边"（边指向拓扑上更早的节点），当前图定义存储（V25 `sw_agent_graph_def`）、发布校验、前端 vue-flow adapter 是否有任何假设"图是 DAG（无环）"？如果有，具体在哪里假设？

## 搜索范围

- `Smart-WorkFlow/sw-basic/agent/` 模块下与图执行相关的类（`AgentGraphInterpreter` 及其依赖、执行 Service、DTO）
- `Smart-WorkFlow/sw-basic/agent/` 中 V25/V26 相关 Flyway 脚本（了解表结构，不需要读完整迁移历史）
- `Smart-WorkFlow-Web/src/modules/agent/`（`GraphDesigner.vue`、`GraphDefList.vue`、`graphAdapter.ts`）
- `Smart-WorkFlow-Web/src/contracts/agent.ts`
- `product/agent-model-orchestration/passed/step-8-graph-interpreter-engine.md`、`step-10-multivar-context-backend.md`（已有方向文档/回执，可直接读取辅助理解，无需重新验证其中已确认的结论）

## 禁止范围

- 不得修改任何代码或配置文件
- 不得运行 `mvn`/`pnpm` 等命令
- 不涉及 IoT/OpenAPI/知识库(RAG) 等其他模块

## 预期证据

- 涉及问题的类名、方法名、文件路径
- 关键代码片段（仅摘录必要的判断逻辑，不粘贴整段大方法）
- 明确标注"已确认"vs"推测"

## 完成标准

7 个问题均有明确回答（或明确标注"当前实现未涉及，需要新设计"），且给出的证据可支撑规划层判断"并行/循环节点"功能的大致影响范围和主要架构风险点。

## 执行模型

deepseek/deepseek-v4-pro（涉及跨文件、执行引擎架构理解，属于复杂代码探索，触发 §2.5.4 升级条件）

## 失败处理

若某问题在限定范围内无法确定，明确写入"未确认事项"，不得猜测代替探索结论。

## 回执位置

`search_fallback/m07-step11-parallel-loop-precedent.md`
