# 测试回执（后端）

## 1. Step 编号和名称

**M07-F02 并行/循环节点（后端）** — 执行层自主闭环（自拆 Step2，见执行方案 §四）。方向文档：`product/agent-model-orchestration/ready/step-11-parallel-loop-nodes.md`。

## 2. 测试环境

- 数据库：H2（`MODE=PostgreSQL`，内存库，Service 测试 @BeforeAll 建表 DDL 对齐 V25 等）
- Java：21 · Maven（多模块，sw-basic-agent + 全工程）· JUnit 5 + Mockito + AssertJ
- 解释器测试纯 Java 无 Spring；Service 测试 @SpringBootTest（TestConfig 组合装配）
- Linux 5.15

## 3. 测试前置条件

- 基线：后端全工程 392 tests（Step10 完结基线，memory/state 确认）；本次执行前已核实
- sw-basic-agent 模块编译通过；无外部依赖服务（LLM/工具均为 mock/桩）

## 4. 实际执行的测试命令

| # | 命令 | 范围 | 结果 |
|---|---|---|---|
| 1 | `mvn test -pl sw-basic/sw-basic-agent -Dtest='AgentGraphInterpreterTest,AgentGraphExecutionServiceImplTest'` | 定向（改造后首次） | 38/38 ✅ |
| 2 | `mvn test`（两次，grep 汇总 + surefire 报告汇总） | 全工程回归 | 405/405 ✅ BUILD SUCCESS ×2 |

## 5. 各测试项结果

### 5.1 `AgentGraphInterpreterTest`（12 → 19，新增 7 用例）

| # | 测试项 | 预期 | 结果 |
|---|---|---|---|
| 13 | 循环正常退出：START→LOOP(maxIterations=3)→LLM→CONDITION(关键词"退出"→END / 默认边回 LOOP) | LLM mock 调用 3 次后 CONDITION 匹配"退出"走 END；output = END inputVar 值 | ✅ |
| 14 | 循环超限抛错：START→LOOP(maxIterations=2)→LLM→(回边直回 LOOP，无 CONDITION) | 第 3 次到达 LOOP 抛 `循环迭代次数超限` | ✅ |
| 15 | FORK→JOIN 两分支全执行：{B1: LLM out=v1; B2: TOOL out=v2}→JOIN→END(in=v1) | 两分支各执行 1 次；END 读到 v1；v2 写入保留 | ✅ |
| 16 | 并行同变量后写覆盖：{B1: LLM out=v="A"; B2: TOOL out=v="B"}→JOIN→END(in=v) | 交替顺序确定 → END 读到"后推进分支"值 "B"（用户决策的"最后写入覆盖"显式断言） | ✅ |
| 17 | JOIN 死锁兜底：{B1: →JOIN; B2: LLM 自环(回边)}→JOIN | B2 永不达 JOIN → 全局步数超限抛 `执行步数超限` | ✅ |
| 18 | END 早到终止全部：{B1: →END; B2: LLM} | B2 不执行（mock 调用 0 次）；output = B1 END 值 | ✅ |
| 19 | 预算公式退化回归：旧图（无 LOOP）+ 自环（仿用例 6） | 行为与现状一致（超限抛错） | ✅ |

既有用例 1-12 全部保持通过（单路径/变量表/CONDITION 语义零回归）。

### 5.2 `AgentGraphExecutionServiceImplTest`（14 → 19，新增 5 用例）

| # | 测试项 | 预期 | 结果 |
|---|---|---|---|
| 15 | 全链路循环图（graph_json 序列化往返） | success=true + 循环退出输出 | ✅ |
| 16 | 全链路并行图（FORK→JOIN） | success=true + 汇合输出 | ✅ |
| 17 | FORK 出边 <2 | 执行前校验报 `扇出分支数必须 ≥ 2` | ✅ |
| 18 | JOIN 入边 <2 | 执行前校验报 `汇合入边数必须 ≥ 2` | ✅ |
| 19 | LOOP maxIterations=0 | 执行前校验报 `maxIterations 必须 ≥ 1` | ✅ |

### 5.3 全量回归

- 定向 38/38 通过（InterpreterTest 19 + ServiceTest 19）
- 全工程 `mvn test` 两次运行均 BUILD SUCCESS：**405/405 通过，0 失败 0 错误**（surefire 报告汇总，83 个测试类）
- 基线对照：392（Step10 完结）→ 405（+13；其中本轮新增 12 = Interpreter +7 + Service +5，余 +1 为基线后既有用例变化，非本轮引入，无回归）

## 6. 未覆盖/边界说明

- 嵌套循环（循环体内再含 LOOP）未单独建用例——由全局预算公式与 maxIterations 机制自然覆盖，非新语义
- 并行分支数 >2 未单独建用例——FORK 语义与 2 分支等价（N 出边 → N 活跃点）
- 真并发（线程级并行）不在本轮范围（执行决策 §7.1，非线程并行故无并发竞态测试需求）

## 7. 记忆更新草稿（供规划层核对后落盘 memory/）

**project_m07_status.md** 建议更新为：
- M07-F02 Step11 并行/循环节点：执行层自主闭环**已完成**（2026-08-12），提交后端 f42c0ac / 前端 a3cdf29；后端全量 405/405（392→405，新增 12 用例）、前端 63f/552t（546→552，新增 6 用例）；4 份回执 + 执行方案 + 归档见 `product/agent-model-orchestration/receipts|passed/`；**待规划层最终验收（D68 判定）**；无进行中功能

**decisions.md / features.md** 建议新增/更新（执行层自主决策，规划层核对采纳）：
- 图执行引擎新增 LOOP/FORK/JOIN 节点类型（config.maxIterations 缺省 10）；预算公式 `maxSteps = 2×节点数 + ΣmaxIterations×节点数`（无 LOOP 退化原公式）
- 并行 = 逻辑并发（多活跃执行点交错推进），非线程级并行；任一 END 早到终止全部；JOIN 挂起死锁由全局步数兜底
- 并行分支同写变量名 = 后写覆盖（用户已决策，用例 16 显式断言，不拦截不告警）
- 不做"循环体可达退出路径"静态分析（运行时 maxIterations+全局步数双层兜底已足）
