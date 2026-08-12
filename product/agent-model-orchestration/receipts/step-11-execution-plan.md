# Step11 执行层自主方案（M07-F02 并行/循环节点）

**依据**：`product/agent-model-orchestration/ready/step-11-parallel-loop-nodes.md`（需求方向，唯一权威任务定义，§1 明确"不拆 Step/不设计契约/不写方案——由执行层自主拆分与实现"）
**前置调研**：`search_fallback/m07-step11-parallel-loop-precedent.md`（2026-08-12，7 问全量现场证据）
**执行时间**：2026-08-12
**执行模型**：deepseek/deepseek-v4-flash（执行层会话自主闭环，subagent 执行）

---

## 一、自拆 Step 与责任矩阵

| Step | 名称 | 内容 | 执行方式 |
|---|---|---|---|
| 1 | 后端执行引擎改造 | `AgentGraphInterpreter` 多活跃点执行模型（LOOP/FORK/JOIN）+ 步数预算公式改造 + `AgentGraphExecutionServiceImpl` 校验/注入调整 | 后端 subagent |
| 2 | 后端测试 | `AgentGraphInterpreterTest` 新用例（循环/并行/死锁兜底）+ `AgentGraphExecutionServiceImplTest` 新用例（全链路+校验）+ 模块全量回归 | 后端 subagent |
| 3 | 前端图设计器扩展 | `graphAdapter.ts` 常量/显示名 + `GraphDesigner.vue` 色板/属性面板 + spec 扩展 + 四连校验 | 前端 subagent |
| 4 | 全量回归 + 回执 + 归档 | 两端全量测试确认、验收抽查、回执×4、归档 passed/、记忆压缩草稿 | 执行层主会话 |

前后端严格分离（各自仓库宪法硬约束）：后端 subagent 不碰 Web 仓库，前端 subagent 不碰 Smart-WorkFlow。

## 二、节点契约设计（执行层自主决策，subagent 严格实现）

### 2.1 新增节点类型（3 个 String 常量，沿用"类型=String 常量非 enum"惯例）

| 类型 | 语义 | config 键 | 出/入边约束 |
|---|---|---|---|
| `LOOP` | 循环头：迭代计数，超限抛错 | `maxIterations`（Integer，可选，缺省默认 `DEFAULT_MAX_ITERATIONS = 10`；<1 视为非法） | 单出边（进循环体），**保持"非条件节点出边唯一"现有约束**；循环体（通常末尾 CONDITION）回边回 LOOP 构成循环 |
| `FORK` | 扇出：多分支并发执行 | 无必需键 | 出边 ≥ 2（每出边一个分支） |
| `JOIN` | 汇合：等待全部分支到达后合并单点继续 | 无必需键 | 入边 ≥ 2；出边唯一（沿用现有约束） |

### 2.2 执行模型：多活跃执行点（逻辑并发，交错推进，非线程级并行）

- `run()` 主循环从"单指针 while"改为**活跃点集合交替推进**：任一时刻维护一组活跃执行点（FORK 后分支并存），每轮取一个活跃点执行一步，产出 0/1/N 个后继活跃点。
- 变量表仍为**单一共享 `Map<String,String>`**（用户已决策：并行分支写同一变量名按"最后写入覆盖"，系统不承担并发合并/隔离责任；单线程交替推进无并发安全问题）。写覆盖行为在文档/回执中明确说明，避免被误判为缺陷（需求 §5.2）。
- 语义规则：
  - LLM/TOOL/START/CONDITION：现有逻辑不变（CONDITION 单选一出边、关键词子串路由）。
  - LOOP：到达时该节点迭代计数 +1（按节点 id 计数），若计数 > maxIterations → 抛 `GraphExecutionException("循环迭代次数超限: <nodeId>")`；否则沿唯一出边进入循环体。
  - FORK：将当前活跃点替换为其全部出边分支活跃点（确定性顺序 = 出边在 elements 中的出现顺序）。
  - JOIN：活跃点到达时到达计数 +1，未达静态入边数 → 该点挂起（等待其他分支）；达到 → 合成单个活跃点沿唯一出边继续。
  - END：任一活跃点到达 END → **立即终止全部执行**（其余分支停止），返回该 END 节点 `inputVar` 读取值。
  - 任意活跃点执行抛异常 → 整个执行终止并抛出（沿用现有语义）。
- **并发语义声明**（写入回执）：本轮"并发" = 逻辑并发（多活跃执行点交错推进，全部分支都会执行并汇合），**非线程级并行**（不引入线程池/CompletableFuture）；若未来需要真并行提速，为独立后续批次。理由：需求核心诉求是编排表达力（扇出→全执行→汇合），交替推进行为确定性、可测、可文档化，无并发安全风险；"最后写入覆盖"在交替模型下 = 按图推进顺序覆盖，行为可预期。

### 2.3 步数预算重设计（回应需求 §5.1）

- 公式：`maxSteps = 2 × 节点数 + Σ(maxIterations of 所有 LOOP 节点) × 节点数`
- 注入位置不变（`AgentGraphExecutionServiceImpl`，构造 `AgentGraphInterpreter` 处），计算时先遍历 elements 收集 LOOP 节点及其 maxIterations（缺省用默认值 10）。
- 性质：无 LOOP 时退化为 `2 × 节点数`（与现状完全一致，回归安全）；有循环时给显式循环留足预算（近似最坏情况：每个循环跑满配置次数 × 全图节点数），避免"循环刚跑 1-2 次被误判死循环"；全局兜底保留（意外死循环/JOIN 死锁统一由超限抛错拦截）。
- 死锁兜底：分支被挂起在 JOIN、其余分支死循环 → 全局 steps 超限抛错（沿用异常信息"执行步数超限，图可能存在环路"，可微调措辞）。

### 2.4 执行前校验增强（`validateForExecution`，回应需求 §5.4）

新增（沿用现有校验风格，非法即抛）：
- FORK：出边数 ≥ 2，否则 `"FORK 节点扇出分支数必须 ≥ 2: <id>"`
- JOIN：入边数 ≥ 2，否则 `"JOIN 节点汇合入边数必须 ≥ 2: <id>"`
- LOOP：`maxIterations` 存在且 <1 → `"LOOP 节点 maxIterations 必须 ≥ 1: <id>"`；出边唯一沿用现有非条件节点约束

**不做**"循环体必须存在可达退出路径"静态分析（需求 §3 非目标：由执行层自行判断是否必要——判断：运行时已有 maxIterations + 全局步数兜底双层防护，静态分析复杂度高且循环体路径依赖动态变量匹配，易误报，非本轮必要；在回执中说明该判断）。既有校验（START 唯一 / END 可达 BFS / CONDITION 默认边唯一 / LLM 配置 / TOOL 白名单）不变——BFS visited 去重天然容忍环。

### 2.5 兼容性与迁移（回应需求 §3/§4）

- 旧图（无 LOOP/FORK/JOIN）：执行行为与现状完全一致（活跃点退化为单点、预算公式退化为 2×节点数、新增校验不命中）。
- 零迁移：全部语义走 `GraphElement.config` 不透明 Map（新键 `maxIterations` 等），**无 Flyway 迁移、无 DDL、无 DTO 契约变更**。
- F01（AgentGraphFactory/LangGraph4j）路径零触碰。
- 不做执行历史持久化、不做单步调试、不做多 Key 轮询（非目标）。

## 三、前端方案（Step3）

- `modules/agent/utils/graphAdapter.ts`：
  - 新增常量 `NODE_TYPE_LOOP='LOOP'`、`NODE_TYPE_FORK='FORK'`、`NODE_TYPE_JOIN='JOIN'`（仿现有 :39-43 块）
  - `NODE_TYPE_LABELS` 加条目：LOOP→"循环"、FORK→"并行分支"、JOIN→"汇合"（:46-52，Record<string,string> 开放索引）
  - 顶部文档注释登记 `NODE_CONFIG_KEY_MAX_ITERATIONS = 'maxIterations'`（仿 `NODE_CONFIG_KEY_*` 常量模式）
- `modules/agent/views/GraphDesigner.vue`：
  - `NODE_TYPES` 色板数组（:106-112）追加 LOOP/FORK/JOIN
  - 属性面板（:376-492 模板分支链）新增：LOOP → maxIterations 数字输入（绑定 `updateNodeData('maxIterations', …)`，空值/非法删键，参考 `handleVarNameChange` 模式；min 校验 1）；FORK/JOIN → 无 config 编辑项，仅说明文本（"出边数 = 分支数" / "入边数 = 汇合分支数"）
- **不改** `contracts/agent.ts`（开放 `type?: string` 天然容纳，需求 §3 硬约束）、**不改** `src/adapters/flow-graph/index.ts`（需求 §3 硬约束；画布默认渲染 + data 透传已足够，颜色/图标差异化不在本轮）
- 测试：`graphAdapter.spec.ts` 扩展（常量/LABELS 断言 + LOOP/FORK/JOIN 透传不崩溃，仿既有未知类型用例 :114-126）；`GraphDesigner.spec.ts` 扩展（色板按钮渲染 3 新类型；选中 LOOP 显示 maxIterations 输入）
- 校验门：`typecheck && lint && test && build` 四连（前端宪法）

## 四、测试方案（Step2 明细）

### 4.1 `AgentGraphInterpreterTest` 新增用例（纯 Java，无 Spring）

| # | 用例 | 图结构 | 断言 |
|---|---|---|---|
| 13 | 循环正常退出 | START→LOOP(maxIterations=3)→LLM→CONDITION(关键词"退出"→END / 默认边回 LOOP) | LLM mock 调用次数 = 3（第三轮 CONDITION 匹配"退出"走 END）；output = END inputVar 值 |
| 14 | 循环超限抛错 | START→LOOP(maxIterations=2)→LLM→(回边直回 LOOP，无 CONDITION) | 第 3 次到达 LOOP 抛 `循环迭代次数超限` |
| 15 | FORK→JOIN 两分支全执行 | START→FORK→{B1: LLM out=v1; B2: TOOL out=v2}→JOIN→END(in=v1) | 两分支 mock 各执行 1 次；END 读到 v1；v2 写入保留（构造后验断言：JOIN 后节点可读 v2） |
| 16 | 并行同变量后写覆盖 | START→FORK→{B1: LLM out=v="A"; B2: TOOL out=v="B"}→JOIN→END(in=v) | 交替顺序确定（出边顺序）→ END 读到"后推进分支"值（B2 的 "B"）；文档化该行为 = 用户决策"最后写入覆盖" |
| 17 | JOIN 死锁兜底 | START→FORK→{B1: →JOIN; B2: LLM 自环(回边)}→JOIN→END | B2 永不达 JOIN → 全局步数超限抛 `执行步数超限` |
| 18 | END 早到终止全部 | START→FORK→{B1: →END; B2: LLM} | B2 不执行（mock 调用 0 次）；output = B1 END 值 |
| 19 | 预算公式退化回归 | 旧图（无 LOOP）+ 自环（仿用例 6） | 行为与现状一致（超限抛错） |

### 4.2 `AgentGraphExecutionServiceImplTest` 新增用例

| # | 用例 | 断言 |
|---|---|---|
| 15 | 全链路循环图（graph_json 序列化往返） | success=true + 循环退出输出 |
| 16 | 全链路并行图（FORK→JOIN） | success=true + 汇合输出 |
| 17 | FORK 出边 <2 | 执行前校验报 `扇出分支数必须 ≥ 2` |
| 18 | JOIN 入边 <2 | 执行前校验报 `汇合入边数必须 ≥ 2` |
| 19 | LOOP maxIterations=0 | 执行前校验报 `maxIterations 必须 ≥ 1` |

### 4.3 回归口径

- 基线：后端全工程 392 tests（D66/D67 后）；前端 63f/546t（F02 完结基线）
- 后端执行命令：`mvn -q test -pl sw-basic/sw-basic-agent -Dtest=AgentGraphInterpreterTest`（Step2 快速验证）→ `mvn test -pl sw-basic/sw-basic-agent -Dtest='AgentGraphInterpreterTest,AgentGraphExecutionServiceImplTest'` → 全工程 `mvn test` 两次汇总一致
- 前端执行命令：`pnpm typecheck && pnpm lint && pnpm test && pnpm build`（按仓库宪法四连；可先跑 `pnpm vitest run` 定向验证）

## 五、硬约束核对清单（回执必须逐项声明）

1. 无 Flyway 迁移/DDL；DTO 对外契约零改动（仅注释可同步）
2. 不碰 F01 路径（AgentGraphFactory/LangGraph4j）
3. 不扩展 flow-graph adapter 导出面；不改 contracts/agent.ts 类型设计
4. 并行变量冲突 = 最后写入覆盖，不拦截不告警，文档/回执明确说明
5. 后端 subagent 不触碰 Smart-WorkFlow-Web，前端 subagent 不触碰 Smart-WorkFlow
6. 不做单步调试/执行历史持久化/多 Key 轮询/数据流静态校验（运行时报错策略沿用）

## 六、交付物

- 后端执行回执 `receipts/step-11-execution.md`、测试回执 `receipts/step-11-test.md`
- 前端执行回执 `receipts/step-11-frontend-execution.md`、测试回执 `receipts/step-11-frontend-test.md`
- 归档 `product/agent-model-orchestration/passed/step-11-parallel-loop-nodes.md`（方向文档 + 完成回执汇总）
- 记忆压缩草稿（memory/，交规划层核对落盘）
