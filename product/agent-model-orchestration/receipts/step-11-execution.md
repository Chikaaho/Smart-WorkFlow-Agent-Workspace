# 执行回执（后端）

## 1. Step 编号和名称

**M07-F02 并行/循环节点（后端执行引擎）** — 需求方向文档驱动的执行层自主闭环（自拆 Step1-2，见执行方案 §一；规划层不逐 Step 收取回执，此为功能级完成回执）

- 方向文档：`product/agent-model-orchestration/ready/step-11-parallel-loop-nodes.md`（目标 §2 / 非目标 §3 / 影响范围 §4 / 风险 §5，唯一权威任务定义）
- 执行方案：`product/agent-model-orchestration/receipts/step-11-execution-plan.md`（执行层自主设计：节点契约 §2、预算公式 §2.3、校验增强 §2.4、测试方案 §四）
- 前置调研：`search_fallback/m07-step11-parallel-loop-precedent.md`（7 问全量现场证据）
- 前置：Step10 多变量执行上下文（D66/D67，后端 392 tests 基线）
- **执行时间**：2026-08-12
- **改动文件清单（实际）**：修改 4（`AgentGraphInterpreter.java`、`AgentGraphExecutionServiceImpl.java`、`AgentGraphInterpreterTest.java`、`AgentGraphExecutionServiceImplTest.java`，540 insertions / 16 deletions）；新建 0；Flyway 0；前端 0（禁止触碰）
- **提交**：`Smart-WorkFlow` f42c0ac（feat: M07 Step11 ... COMPLETED）

## 2. 使用模型

- 执行模型：deepseek-v4-flash（执行层会话自主闭环，subagent 执行；同族模型替换属用户成本优化选型惯例）

## 3. 实际读取的文件

| 文件 | 用途 |
|---|---|
| `ready/step-11-parallel-loop-nodes.md` | 需求方向文档（目标/非目标/风险，唯一权威任务定义） |
| `receipts/step-11-execution-plan.md` | 执行层自主方案（节点契约/预算/校验/测试设计） |
| `search_fallback/m07-step11-parallel-loop-precedent.md` | 前置调研（解释器现状/无 DAG 假设/改动面证据） |
| `sw-basic-agent/.../orchestration/AgentGraphInterpreter.java` | 改造对象（单路径顺序执行 + 变量表 + 出边唯一约束现状） |
| `sw-basic-agent/.../service/impl/AgentGraphExecutionServiceImpl.java` | 调用点（maxSteps 注入 + validateForExecution） |
| `sw-basic-agent/src/test/.../AgentGraphInterpreterTest.java` / `AgentGraphExecutionServiceImplTest.java` | 既有单测/集成测试（12+14 用例基线，扩展模式） |
| `Smart-WorkFlow/docs/governance/engineering-constitution.md` | 后端工程宪法（执行层边界/硬约束） |
| `receipts/step-10-execution.md` / `step-10-test.md` | 回执格式参照（同功能族先例） |

## 4. 实际修改的文件

1. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java`
2. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImpl.java`
3. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTest.java`
4. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImplTest.java`

未修改：`GraphElement`/`ProcessGraph`、DTO（契约零改动）、Controller、Flyway（0 迁移）、F01 路径（`AgentGraphFactory`/LangGraph4j 零触碰）。

## 5. 每个文件的修改摘要

### 5.1 `AgentGraphInterpreter.java`（+126/-16）

**执行模型：单指针 while → 多活跃执行点集合（逻辑并发，交错推进，非线程级并行）**

- 新增常量：`NODE_TYPE_LOOP="LOOP"`、`NODE_TYPE_FORK="FORK"`、`NODE_TYPE_JOIN="JOIN"`、`CONFIG_KEY_MAX_ITERATIONS="maxIterations"`、`DEFAULT_MAX_ITERATIONS=10`
- 主循环改造：维护活跃执行点集合 + 每节点迭代计数（LOOP）与 JOIN 到达计数；每轮取队首活跃点执行一步，产出 0/1/N 个后继活跃点
- 节点语义：
  - **LOOP**（循环头）：到达时按节点 id 迭代计数 +1，计数 > maxIterations 抛 `GraphExecutionException("循环迭代次数超限: <id>")`；唯一出边进循环体（出边唯一约束保持生效）
  - **FORK**（扇出）：当前活跃点替换为全部出边分支（确定性顺序 = 出边在 elements 中的出现顺序）
  - **JOIN**（汇合）：到达计数未达静态入边数 → 挂起等待；达到 → 合成单活跃点沿唯一出边继续
  - **END**：任一活跃点到达 END 立即终止全部执行，返回该 END 的 `inputVar` 读取值（早到终止语义）
- 兜底：全局步数上限跨所有活跃点累计（死循环 / JOIN 挂起死锁统一拦截）；活跃点耗尽未达 END 抛 `"所有执行点已终止但未到达 END 节点（JOIN 汇合入边数无法满足）"`
- 变量表仍为单一共享 `Map<String,String>`（单线程交错推进，无并发安全问题；并行分支同写一变量名 = 按推进顺序后写覆盖，即用户决策的"最后写入覆盖"，不拦截不告警）
- 路由：FORK 走全出边分支；其余节点单后继逻辑不变（CONDITION 单选一 / LOOP/JOIN 出边唯一约束保持）

### 5.2 `AgentGraphExecutionServiceImpl.java`（+74/-2）

- **步数预算公式（回应需求 §5.1）**：`maxSteps = 2 × 节点数 + Σ(maxIterations of 所有 LOOP 节点) × 节点数`；LOOP 缺省 maxIterations 用 `DEFAULT_MAX_ITERATIONS` 参与预算；无 LOOP 时退化为现状 `2 × 节点数`（回归安全）；近似最坏情况预算避免"循环刚跑 1-2 次被误判死循环"，意外死循环 / JOIN 死锁仍由全局兜底
- **执行前校验增强（回应需求 §5.4）**：新增 ⑥FORK 出边 ≥2（`"FORK 节点扇出分支数必须 ≥ 2"`）⑦JOIN 入边 ≥2（`"JOIN 节点汇合入边数必须 ≥ 2"`）⑧LOOP maxIterations 存在且 <1 → `"LOOP 节点 maxIterations 必须 ≥ 1"`（缺失用默认 10 不报错）；新增 `incomingEdges` 辅助方法
- 既有校验（START 唯一 / BFS END 可达 / CONDITION 默认边唯一 / LLM 配置 / TOOL 白名单）不变——BFS visited 去重天然容忍环
- **不做"循环体可达退出路径"静态分析**（执行层判断依据：运行时已有 maxIterations + 全局步数兜底双层防护，循环体路径依赖动态变量匹配易误报，非本轮必要；需求 §3 非目标允许执行层自行判断）

### 5.3/5.4 测试文件

见 `step-11-test.md`（InterpreterTest 新增用例 13-19 共 7 个；ServiceTest 新增用例 15-19 共 5 个）。

## 6. 执行中发现的方案偏差/问题

无。方向文档与现场代码无歧义冲突；契约设计（LOOP/FORK/JOIN + 预算公式）按执行层方案文档落地，未触发"暂停回规划层"条件。

## 7. 设计决策记录（执行层自主，供规划层验收关注）

1. **并发语义 = 逻辑并发（多活跃执行点交错推进），非线程级并行**：需求核心诉求是编排表达力（扇出→全执行→汇合），交替推进行为确定、可测、可文档化、无并发安全风险；"最后写入覆盖"在交替模型下 = 按图推进顺序覆盖，可预期。真并行提速（线程池）如需为独立后续批次。
2. **循环用显式 LOOP 节点而非纯 CONDITION+回边**：区分"设计意图内的合法环"（需求 §5.4）——LOOP 是合法循环的显式标记与迭代上限来源；纯回边无 LOOP 仍由全局步数兜底拦截。
3. **预算公式取近似最坏情况**（每个循环跑满配置次数 × 全图节点数）：静态可算、无 LOOP 时退化为原公式、无需按路径计数。
4. **变量冲突按用户决策**（需求 §3/§5.2）：并行分支同写一变量名 = 后写覆盖，不拦截不告警，行为在测试用例 16 中显式断言并在本文档声明。

## 8. 硬约束核对

| 约束 | 状态 |
|---|---|
| 无 Flyway 迁移 / DDL / DTO 契约变更 | ✅ config 不透明 Map 加键（`maxIterations`），graph_json 透传落库，零迁移 |
| 不碰 F01 路径（AgentGraphFactory/LangGraph4j） | ✅ 零触碰 |
| 不扩展 flow-graph adapter / 不改 contracts 类型 | ✅ 后端未触碰 Web 仓库 |
| 并行变量冲突 = 最后写入覆盖，不拦截不告警 | ✅ 见 §7.4 |
| 不做单步调试/执行历史持久化/多 Key 轮询/数据流静态校验 | ✅ 运行时报错策略沿用 |

## 9. 遗留事项

无。未触发任何"暂停并回规划层"条件（I31 先例未命中：本轮前端未扩展 flow-graph adapter 契约，见前端执行回执）。
