# 执行回执（后端）

## 1. Step 编号和名称

**M07-F02 Step12 图执行历史持久化（后端）** — 需求方向文档驱动的执行层自主闭环（自拆 Step1-3，见 §二执行方案；规划层不逐 Step 收取回执，此为功能级完成回执）

- 方向文档：`product/agent-model-orchestration/ready/step-12-execution-history-persistence.md`（目标 §2 / 非目标 §3 / 影响范围 §4 / 风险 §5，唯一权威任务定义，未修改）
- 前置调研：`search_fallback/m07-step12-execution-history-precedent.md`（6 问现场证据）
- 回执格式参照：`receipts/step-11-execution.md` / `step-11-test.md`
- 前置：Step11 并行/循环节点（后端 405 tests 基线，2026-08-12 确认）
- **执行时间**：2026-08-12
- **改动文件清单（实际）**：修改 8 + 新建 11 = 19 个文件，1729 insertions / 104 deletions
- **提交**：`Smart-WorkFlow` bb71047（feat: M07 Step12 执行历史持久化 — ... COMPLETED）

## 2. 使用模型

- 执行模型：deepseek-v4-flash（执行层会话自主闭环，subagent 执行；同族模型替换属用户成本优化选型惯例）

## 3. 实际读取的文件

| 文件 | 用途 |
|---|---|
| `ready/step-12-execution-history-persistence.md` | 需求方向文档（目标/非目标/风险，唯一权威任务定义） |
| `search_fallback/m07-step12-execution-history-precedent.md` | 前置调研（调用链/DTO 结构/F04 三表先例/Flyway 版本占用/失败异常结构） |
| `receipts/step-11-execution.md` / `step-11-test.md` | 回执格式参照（同功能族先例） |
| `orchestration/AgentGraphInterpreter.java` | 改造对象（多活跃执行点模型 + 18 个异常抛出点 + 变量表） |
| `service/impl/AgentGraphExecutionServiceImpl.java` | 调用点（maxSteps 预算 + catch-all + summarizeError） |
| `service/AgentGraphExecutionService.java` | 接口（追加查询方法） |
| `entity/Agent{Session,Message,ToolCallLog}.java` / `BaseEntity.java` | F04 实体先例（审计列族/雪花 PK） |
| `mapper/AgentSessionMapper.java` | Mapper 空接口惯例 |
| `controller/Agent{Conversation,GraphDef}Controller.java` | 查询端点/权限码惯例（agent:model:view） |
| `dto/AgentConversationDTO.java` / `AgentGraphExecute{Req,Resp}DTO.java` / `PageParam.java` / `PageResult.java` | DTO/分页惯例 |
| `sw-bootstrap/db/migration/agent/{h2,postgresql}/V21-V23.sql` | F04 迁移先例（CLOB↔TEXT、审计列族、索引、COMMENT） |
| `service/impl/AgentOrchestrationServiceImpl.java` | persistToolCallLogs 批量落库模式（F04） |
| `Smart-WorkFlow/.claude/system.md` | 后端工程宪法（执行层边界/硬约束） |
| 测试：`AgentGraphInterpreterTest` / `AgentGraphExecutionServiceImplTest` / `AgentGraphDefControllerTest` | 既有测试风格与组合装配（TestConfig/H2 DDL） |

## 4. 实际修改的文件

**修改 8**：
1. `orchestration/AgentGraphInterpreter.java`（+346/-60 含 Javadoc）
2. `service/impl/AgentGraphExecutionServiceImpl.java`（+257）
3. `service/AgentGraphExecutionService.java`（+34）
4. `dto/AgentGraphExecuteRespDTO.java`（+executionId 字段）
5. `src/test/.../orchestration/AgentGraphInterpreterTest.java`（+178，用例 20-24）
6. `src/test/.../service/impl/AgentGraphExecutionServiceImplTest.java`（+363，用例 20-30）
7. `src/test/.../controller/AgentGraphDefControllerTest.java`（+192，用例 13-17）
8. `sw-bootstrap/.../db/migration/agent/h2/V27__init_agent_graph_execution.sql`（含 result_text 改名修订）

**新建 11**：
1. `sw-bootstrap/.../db/migration/agent/{h2,postgresql}/V27__init_agent_graph_execution.sql`（执行记录表）
2. `sw-bootstrap/.../db/migration/agent/{h2,postgresql}/V28__init_agent_graph_execution_node.sql`（节点明细表）
3. `entity/AgentGraphExecution.java` / `entity/AgentGraphExecutionNode.java`
4. `mapper/AgentGraphExecutionMapper.java` / `mapper/AgentGraphExecutionNodeMapper.java`
5. `dto/AgentGraphExecutionDTO.java` / `AgentGraphExecutionDetailDTO.java` / `AgentGraphExecutionNodeDTO.java`
6. `controller/AgentGraphExecutionController.java`

未修改：`GraphElement`/`ProcessGraph`、`AgentGraphExecuteReqDTO`、F01 路径（`AgentGraphFactory`/LangGraph4j、`AgentOrchestrationServiceImpl` 零触碰）、前端（本轮后端单仓，方向文档 §4 不强制前端）。

## 5. 每个文件的修改摘要

### 5.1 `AgentGraphInterpreter.java`（核心改造点：轨迹采集 + 错误分类维度）

**轨迹采集（方向文档 §4 核心改造点，风险 §5.1/§5.4）**：
- 新增 `NodeExecutionTrace`（纯 Java 静态内部类，无 Spring 依赖）：`nodeSeq`（本次执行内全局步序，1-based，节点出队即分配，含 END）/ `branchId`（并行分支标识）/ `nodeId` / `nodeType` / `nodeLatencyMs`（出队到本步路由完成的毫秒耗时，System.nanoTime 计时）/ `variableSnapshot`（该节点执行后变量表快照 `Map<String,String>`，由 Service 序列化为 JSON）
- 活跃点模型升级：`List<String>` → `List<ActiveExecutionPoint>`（nodeId + branchPath）。FORK 扇出按出边在 elements 中的出现顺序追加下标（"0"→"0-0"/"0-1"…）；非 FORK 路径恒为根路径 "0"；JOIN 汇合后沿用最后到达分支的 branchPath；LOOP 同分支迭代 = 多条 nodeSeq 递增记录——满足"区分哪个分支的第几次访问"（方向文档风险 §5.1）
- **采集方式**：解释器只采集，经 `getTraces()` 返回值携带给 Service 落库，不持有 Mapper 依赖（方向文档 §5.4 硬约束满足）；每次 run 重建 traces 列表；成功/失败路径都完整留痕——失败节点在 catch 中补录耗时与失败时点快照后上抛（方向文档风险 §5.2）
- 数据载体为 Map 拷贝（非引用），Service 侧序列化，解释器零 Jackson 依赖

**错误分类维度（方向文档 §5.3 新设计）**：
- `GraphExecutionException` 新增 `category` 字段（String 常量，D52 精神不建 enum），8 个分类：`STEP_LIMIT` / `LOOP_LIMIT` / `UNDEFINED_VARIABLE` / `CONDITION_NO_MATCH` / `TOPOLOGY_INVALID` / `MODEL_CALL_FAILED` / `TOOL_CALL_FAILED` / `UNKNOWN`
- 18 个既有抛出点全部显式携带分类（非文本匹配）；既有 1/2 参构造保留（分类=UNKNOWN，兼容外部直接构造）
- 第三方异常（解密失败/模型网络超时/429/工具执行抛错）：`callLlmNode`/`callToolNode` 调用点 catch 包装为带分类的 `GraphExecutionException`（message 沿用 cause 最深非空文本——`summarizeError` 摘要语义不变，`errorMessage` 对外行为零变化）；自有异常（未返回文本等）原样上抛

### 5.2 `AgentGraphExecutionServiceImpl.java`（包夹持久化 + 查询）

- **execute() 重构（方向文档 §4「执行前后包夹持久化写入」）**：校验通过、进入执行阶段后 ①建 `RUNNING` 执行记录 → ②解释器运行 → ③终态回写（成功 `SUCCESS`+output；失败 `FAILED`+errorCategory+errorMessage）→ ④节点轨迹批量落库（逐条 insert，与 F04 `persistToolCallLogs` 同款模式）；`@Transactional(rollbackFor=Exception.class)` 保证两阶段写一致；DB 异常位于运行时 catch 之外（上抛不吞，不会伪装成 success=false）
- **失败路径一致性（方向文档风险 §5.2）**：catch-all 转 success=false 的路径同样回写终态 + 落节点明细，区别于 F04 只写成功分支
- **错误分类落地**：`classifyError` 沿 cause 链找带分类的 GraphExecutionException（第三方包装保证链上必有分类），UNKNOWN 为理论不可达兜底
- **查询端点**（方向文档 §4 预期新增，权限复用 `agent:model:view` 惯例）：`pageExecutions(PageParam, graphDefId)` 分页列表（create_time 倒序，graphDefId 可选过滤，selectPage 直连 mapper——Service 基类泛型绑定 AgentGraphDef 不可复用）；`getExecution(id)` 详情（含 input/output 大字段）；`listExecutionNodes(id)` 节点明细（nodeSeq 升序）；不存在/跨租户 → NOT_FOUND（同会话查询先例）
- 响应 DTO 追加 `executionId`（纯追加，四字段语义不变，方向文档 §3 允许）
- 变量快照序列化：Service 侧 ObjectMapper → JSON（失败理论不可达，兜底 null）

### 5.3 迁移（V27/V28，h2+postgresql 双份同步）

- **V27 `sw_agent_graph_execution`**（执行记录表，F04 三表惯例类比）：雪花 PK + 审计列族（BaseEntity）+ `graph_def_id`/`graph_def_version`（执行时版本快照）/`status`（RUNNING/SUCCESS/FAILED，varchar 非 enum）/`input`/`result_text`（最终输出）/`error_category`（VARCHAR 50）/`error_message`/`latency_ms`；索引 `(graph_def_id, deleted)` + `(tenant_id, create_time, deleted)`；无外键
- **V28 `sw_agent_graph_execution_node`**（节点明细表）：`execution_id` + `node_seq`（联合索引，Java 层顺序号模式同 F04 消息表）+ `branch_id`/`node_id`/`node_type`/`node_latency_ms`/`variable_snapshot`（CLOB/TEXT）
- 大文本 H2=CLOB / PG=TEXT，PG 追加 COMMENT，完全对齐 V21-V23 双份惯例

### 5.4 查询 Controller（新建）

`AgentGraphExecutionController`（`/agent/graph-executions`）：列表 `GET`（PageParam + 可选 graphDefId 过滤）/ `GET /{executionId}` 详情 / `GET /{executionId}/nodes` 明细；三端点均 `@PreAuthorize("@ss.hasPermi('agent:model:view')")`（对齐 F04 会话查询与 D51 三段拆分，不新增权限码）；`R<T>` 包装

### 5.5 测试文件

见 `step-12-test.md`（InterpreterTest 新增用例 20-24 共 5 个；ServiceTest 新增用例 20-30 共 11 个；ControllerTest 新增用例 13-17 共 5 个）。

## 6. 执行中发现的方案偏差/问题

**问题 1（实测踩坑，已解决）：`output` 列名是 SQL 保留字，租户拦截器 JSqlParser 解析失败。**
- 现象：`updateById` 抛 `MybatisPlusException: Failed to process`，根因 `net.sf.jsqlparser.parser.ParseException: Encountered unexpected token: "output"`——MyBatis-Plus `TenantLineInnerInterceptor` 用 JSqlParser 解析 UPDATE SET 子句，`output` 为非法 token（H2/PG 双端一致）
- 处理：执行记录表最终输出列命名为 `result_text`（实体字段 `resultText`），响应/详情 DTO 字段仍为 `output`（对外契约不变）；V27 双份脚本 + 实体 + Service + 测试 DDL 同步修正。F04 先例无此坑（其大文本列名 content 非保留字）
- 该问题不构成对方向文档的偏离（表字段名属执行层设计权，方向文档未指定列名）

**问题 2（实现细节澄清）：JOIN 挂起到达同样产生节点记录。**
- JOIN 未达静态入边数的"挂起到达"也是一次活跃点执行，轨迹中留一行（branchId = 该分支路径）——这正是并行分支轨迹留痕的价值点（可看出哪个分支先到 JOIN），并在测试用例 21 显式断言（JOIN 两行：0-0 挂起、0-1 汇合放行）

**问题 3（明确不落库的边界）：执行前校验失败（PARAM_ERROR/NOT_FOUND/未发布）不产生执行记录。**
- 校验失败发生在执行阶段之前（requireEntity/parseGraph/validateForExecution），连解释器都未启动，不构成"图执行调用"的持久化对象；对齐 F04"配置非法不落脏数据"先例。方向文档 §2 目标"每次调用"结合风险 §5.2 的表述（"catch-all 转 success=false 不会漏记"）——catch-all 覆盖的正是进入执行阶段的失败路径，已全部落库

## 7. 执行方案（自拆 Step 概要）

| Step | 内容 | 状态 |
|---|---|---|
| Step1 持久化地基 | V27/V28 双份迁移 + 实体/Mapper + 错误分类维度（GraphExecutionException.category 18 点 + 第三方包装） | ✅ |
| Step2 采集与落库 | 解释器轨迹采集（branchId/耗时/快照）+ Service 包夹落库（RUNNING→终态 + 节点明细）+ DTO executionId + 查询端点 | ✅ |
| Step3 测试闭环 | 三测试类新增 21 用例 + 全量回归（405→426 两次 BUILD SUCCESS） | ✅ |

## 8. 设计决策记录（执行层自主，供规划层验收关注）

1. **分支标识 = 分支路径字符串（branchId）而非独立自增实例号**：FORK 按出边出现顺序追加下标（"0-0"/"0-1"），天然编码"从哪个 FORK 的哪条出边来"的确定性语义，与 FIFO 交错推进的确定性执行顺序一一对应，可读可断言；LOOP 迭代靠 nodeSeq 区分（同 branchId 多条记录）。不做全局实例号（无状态恢复需求，避免过度设计）
2. **节点轨迹 = 每次活跃点出队一条记录（含 JOIN 挂起到达与 END）**：轨迹语义 = "本次执行访问过的节点序列"（方向文档 §2），挂起到达也是访问；nodeSeq 全局递增即访问顺序
3. **变量快照 = 节点执行后的整表快照（Map 拷贝 + JSON 落库）**：方向文档 §2「(若可行)关键变量快照」判断为可行——人工低频触发场景（探索回执问题 4），单次执行记录数 = 访问节点数级，写入开销可接受；不截断（保持完整可查），不做变量级差异存储（过度设计）
4. **错误分类在抛出点显式携带，而非 Service 文本子串匹配**：18 个抛出点 + 2 个第三方包装点全部带分类（探索回执建议的"贯穿异常构造"方案），文本匹配仅作为 UNKNOWN 兜底；`errorMessage` 摘要语义（最深非空 message）完全不变
5. **执行记录状态机 = RUNNING（执行前建行）→ SUCCESS/FAILED（执行后回写）**：方向文档 §4「执行前后包夹持久化写入」字面落地；RUNNING 状态本身无查询端点暴露（查询端点只查终态记录），保留为中间态语义
6. **查询列表含 errorMessage/errorCategory，剥离 input/output 大字段**：errorMessage 实际为短文本且是列表价值核心（失败原因一屏可见）；input/output 大字段走详情端点（编译期防线，同 pageDefs 剥离 graphJson 先例）
7. **列表不做用户级（create_by）过滤，仅租户级隔离**：执行历史是设计器/运维视角（execute 权限与发布同级 manage），非 F04 会话那样的个人对话资产；方向文档未指定，执行层按此实现并在此声明
8. **分页为必需（方向文档 §3 非目标允许执行层自判）**：执行记录无限增长，无分页则查询端点在列表场景不可用；复用既有 PageParam/PageResult
9. **前端不做（方向文档 §4 不强制）**：后端查询端点 + 三层测试已证明可查询性；前端涉及 contracts/agent.ts 与 flow-graph adapter 边界（方向文档 §3 触及即需 I31 暂停评估），本轮不做前端属方向文档明示允许的选项
10. **落库边界 = 进入执行阶段后（问题 3）**：校验失败不落库（不构成执行），与 F04 先例一致

## 9. 硬约束核对

| 约束 | 状态 |
|---|---|
| 方向文档歧义/不可行 → 回执明确报告，不得自行变更方向 | ✅ 无不可行项；两处实现细节澄清见 §6（output 保留字、落库边界），均未变更方向文档本身 |
| 不修改方向文档（ready/ 只读） | ✅ 零触碰 |
| 不碰 F01 路径（AgentGraphFactory/LangGraph4j、AgentOrchestrationServiceImpl/F04） | ✅ 零触碰（两条执行路径并存互不干扰） |
| 不改变现有 DTO 对外行为（success/output/errorMessage/latencyMs 语义不变） | ✅ 四字段语义不变，executionId 为允许的追加字段 |
| 解释器纯 Java 无 Spring 注解、不持 Mapper | ✅ 轨迹经 getTraces() 返回值携带，NodeExecutionTrace 为纯 Java 载体 |
| 失败路径与成功路径落库一致性 | ✅ 两类路径统一包夹落库，测试用例 21/22-26 显式断言 |
| Flyway V27 起、双份同步 | ✅ V27/V28 h2+postgresql 各一份，H2 脚本经 RunScript 实测执行通过 |
| 错误分类不强制覆盖所有异常类型精确分类 | ✅ 已超预期全覆盖（18 点 + 第三方包装），UNKNOWN 兜底 |
| 不做数据量控制/归档/清理策略 | ✅ 未做（分页按决策 8 自判为必需） |
| 不做单步调试/多 Key 轮询/429 行为改变 | ✅ 未做（429 仅分类记录为 MODEL_CALL_FAILED，无重试/限流行为变化） |
| 不扩展 flow-graph adapter / 不改 contracts | ✅ 本轮未触碰前端仓库 |
| mvn 命令限制最大内存（MAVEN_OPTS=-Xmx1g） | ✅ 全部命令带 MAVEN_OPTS="-Xmx1g" |
| 提交不带 Co-Authored-By 尾注 | ✅ 无 |

## 10. 遗留事项

无。未触发任何"暂停并回规划层"条件（I31 先例未命中：本轮未扩展前端防腐层契约）。
