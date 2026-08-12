# 测试回执（后端）

## 1. Step 编号和名称

**M07-F02 Step12 图执行历史持久化（后端）** — 执行层自主闭环（自拆 Step3，见执行回执 §7）。方向文档：`product/agent-model-orchestration/ready/step-12-execution-history-persistence.md`。

## 2. 测试环境

- 数据库：H2（`MODE=PostgreSQL`，内存库，Service/Controller 测试 @BeforeAll 建表 DDL 对齐 V27/V28 等）
- Java：21 · Maven（多模块，sw-basic-agent + 全工程）· JUnit 5 + Mockito + AssertJ
- 解释器测试纯 Java 无 Spring；Service 测试 @SpringBootTest（TestConfig 组合装配）；Controller 测试 MockMvc + 真实安全链（JWT + @EnableMethodSecurity）
- Linux 5.15 · `MAVEN_OPTS="-Xmx1g"`（硬约束）

## 3. 测试前置条件

- 基线：后端全工程 405 tests（Step11 完结基线，memory/state 确认）；本次执行前已核实
- sw-basic-agent 模块编译通过；无外部依赖服务（LLM/工具均为 mock/桩）
- V27/V28 H2 迁移脚本已用 H2 RunScript 实测执行通过（`MODE=PostgreSQL` 内存库，V27/V28/V21 对照均 OK）

## 4. 实际执行的测试命令

| # | 命令 | 范围 | 结果 |
|---|---|---|---|
| 1 | `mvn test -pl sw-basic/sw-basic-agent -Dtest='AgentGraphInterpreterTest,AgentGraphExecutionServiceImplTest,AgentGraphDefControllerTest'` | 定向（改造后首轮，经历 output 保留字修复前后） | 71/71 ✅ |
| 2 | `mvn test`（两次，surefire 报告汇总） | 全工程回归 | 426/426 ✅ BUILD SUCCESS ×2 |

## 5. 各测试项结果

### 5.1 `AgentGraphInterpreterTest`（19 → 24，新增 5 用例：轨迹采集 + 错误分类）

| # | 测试项 | 预期 | 结果 |
|---|---|---|---|
| 20 | 顺序链路轨迹：START→LLM→END | 3 条记录，nodeSeq 1-3、branchId 全 "0"、nodeLatencyMs ≥ 0、快照 START 后含入参原值 / LLM 后含模型输出 | ✅ |
| 21 | FORK→JOIN 并行分支轨迹 | 7 条记录：branchId "0"/"0"/"0-0"/"0-1"/"0-0"(JOIN 挂起)/"0-1"(JOIN 汇合)/"0-1"(END)；nodeSeq 1-7 严格递增 | ✅ |
| 22 | LOOP 迭代轨迹 | LOOP 节点 3 次访问 = 3 条 nodeSeq 递增记录（branchId 相同）；末轮 LLM 快照 = 最终输出 | ✅ |
| 23 | 失败路径轨迹 + 分类 | 条件无匹配抛错后 getTraces() 仍含 START+CONDITION 两行（失败节点也有行）；异常 category=CONDITION_NO_MATCH | ✅ |
| 24 | 错误分类：步数超限 | GraphExecutionException.category == STEP_LIMIT | ✅ |

既有用例 1-19 全部保持通过（单路径/多变量/LOOP/FORK/JOIN 语义零回归）。

### 5.2 `AgentGraphExecutionServiceImplTest`（19 → 30，新增 11 用例：落库 + 分类 + 查询）

| # | 测试项 | 预期 | 结果 |
|---|---|---|---|
| 20 | 执行成功全链路落库 | 执行记录 status=SUCCESS + output/input/graphDefId/defVersion=2 + 节点明细 3 行（START/LLM/END，branchId "0"，快照含 input）+ 响应 executionId | ✅ |
| 21 | 运行时失败落库 | status=FAILED + errorCategory=CONDITION_NO_MATCH + errorMessage + 节点明细含失败节点行（START+CONDITION） | ✅ |
| 22 | LLM 第三方异常分类 | errorCategory=MODEL_CALL_FAILED（errorMessage 语义不变含 cause 文本） | ✅ |
| 23 | 步数超限分类 | errorCategory=STEP_LIMIT（无 LOOP 回环 + END 可达，预算耗尽兜底） | ✅ |
| 24 | 循环迭代超限分类 | errorCategory=LOOP_LIMIT | ✅ |
| 25 | 未定义变量分类 | errorCategory=UNDEFINED_VARIABLE | ✅ |
| 26 | 工具回调运行时异常分类 | errorCategory=TOOL_CALL_FAILED | ✅ |
| 27 | 执行历史列表 | graphDefId 过滤 total=2 / 无过滤 total=3；status、latencyMs、graphDefId 回显 | ✅ |
| 28 | 执行详情 | input/output/latency/defVersion/createTime 回显；不存在的 id → NOT_FOUND | ✅ |
| 29 | 节点明细 | nodeSeq 1/2/3 升序 + 类型 + 快照；不存在的 id → NOT_FOUND | ✅ |
| 30 | 跨租户隔离 | 租户 B 列表 total=0、详情/节点 → NOT_FOUND（租户拦截器） | ✅ |

既有用例 1-19 全部保持通过（含 executionId 追加对既有断言零影响）。

### 5.3 `AgentGraphDefControllerTest`（12 → 17，新增 5 用例：查询端点 + 权限）

| # | 测试项 | 预期 | 结果 |
|---|---|---|---|
| 13 | 执行 → executionId 返回；GET /agent/graph-executions 列表 | total=1 + status=SUCCESS + graphDefId 回显；列表不含 input/output 大字段 | ✅ |
| 14 | 无 view 权限访问列表 | 403 | ✅ |
| 15 | 执行详情端点 | status=SUCCESS + input/output 回显（初始图输出=入参）+ latencyMs；不存在 → body.code=404 | ✅ |
| 16 | 节点明细端点 | 2 行（START/END）+ nodeSeq 升序 + branchId="0" + 变量快照含 input | ✅ |
| 17 | 执行 DRAFT 图 → 400 且不落库 | body.code=400；列表 total=0（校验失败不产生执行记录） | ✅ |

### 5.4 全量回归

- 定向 71/71 通过（Interpreter 24 + Service 30 + Controller 17）
- 全工程 `mvn test` 两次运行均 BUILD SUCCESS：**426/426 通过，0 失败 0 错误**（surefire 报告汇总，83 个测试类，与 Step11 同口径）
- 基线对照：405（Step11 完结）→ 426（+21；全部为本轮新增：Interpreter +5 + Service +11 + Controller +5），无既有用例变化、无回归

## 6. 未覆盖/边界说明

- **UNKNOWN 兜底分类未建触发用例**：全部运行时失败链均含带分类的 GraphExecutionException（抛出点显式携带 + 第三方包装），UNKNOWN 为防御性兜底（理论不可达），无自然触发路径
- **PG 方言未实机执行**：V27/V28 postgresql 脚本与 V21-V23 双份惯例逐字同构（仅 TEXT/COMMENT 差异），H2 端脚本已 RunScript 实测；PG 端沿用既有先例校验路径（dev/local 启动时由 Flyway 校验）
- **嵌套循环（循环体内再含 LOOP）轨迹未单独建用例**：branchId/nodeSeq 语义与单层一致（非新语义），由既有机制自然覆盖
- **并行分支数 >2 未单独建用例**：FORK 语义与 2 分支等价（N 出边 → N 个 branchId 后缀）
- **执行记录 RUNNING 中间态无查询端点**（决策 5）：测试覆盖终态记录（SUCCESS/FAILED），RUNNING 仅作事务内中间态

## 7. 记忆更新草稿（供规划层核对后落盘 memory/）

**project_m07_status.md** 建议更新为：
- M07-F02 Step12 执行历史持久化：执行层自主闭环**已完成**（2026-08-12），提交后端 bb71047（19 文件，+1729/-104）；后端全量 426/426（405→426，新增 21 用例）；V27/V28 迁移（执行记录+节点明细双表）+ 解释器轨迹采集（nodeSeq/branchId/节点耗时/变量快照）+ 错误分类维度（GraphExecutionException.category 8 类）+ 查询端点（列表/详情/节点明细）；前端未做（方向文档不强制）；回执见 `product/agent-model-orchestration/receipts/step-12-{execution,test}.md`；**待规划层最终验收（D70 判定）**；无进行中功能

**decisions.md / features.md** 建议新增/更新（执行层自主决策，规划层核对采纳）：
- 执行历史落库边界 = 进入执行阶段后（校验失败不落库，对齐 F04 不落脏数据）；成功/失败两路径统一包夹落库（RUNNING→SUCCESS/FAILED + 节点明细）
- 分支轨迹标识 = branchId 分支路径字符串（FORK 按出边顺序追加下标），LOOP 迭代靠 nodeSeq 区分；JOIN 挂起到达也留痕
- 错误分类 = GraphExecutionException.category 在 18 个抛出点显式携带 + 第三方异常调用点包装（MODEL_CALL_FAILED/TOOL_CALL_FAILED），errorMessage 摘要语义不变
- 列名规避保留字：最终输出列名 result_text（output 为租户拦截器 JSqlParser 非法 token，实测踩坑）
- 执行历史列表仅租户级隔离（不做 create_by 用户级过滤），分页必需；列表剥离 input/output 大字段走详情端点

**issues.md**：无新增。

## 8. 最终结论

**PASSED** — 方向文档 §2 目标（执行摘要 + 节点级明细 + 成功/失败两路径 + 并行/循环分支留痕 + 可查询性）全部落地并有测试证据；§3 非目标零触碰；§4 影响范围（解释器采集/Service 包夹/迁移/查询端点）全部完成；§5 风险（并行分支标识/失败路径一致性/错误分类/纯 Java 约束）全部按方案化解并在回执声明。
