# M07-F02 Step12 需求方向：图执行历史持久化

> 规划层产出，仅含目标/非目标/影响范围/风险方向/待确认问题。**不设计表结构、不指定执行点标识方案、不拆解具体 Step、不设计执行/测试方案**——由执行层自主拆分与实现，完成后提交功能级完成回执供最终验收。
>
> **状态：PASSED（D71，2026-08-12）**——见 §8 执行层落地摘要。

## 1. 背景

M07-F02 图解释执行引擎（Step8-11）自设计之初即有意"不落库"（D64）：一次执行仅返回 `success/output/errorMessage/latencyMs`，解释器内存态执行完即释放，无任何持久化。前置探索（`search_fallback/m07-step12-execution-history-precedent.md`）已确认：

- 现有响应 DTO 已具备结果字段（success/output/errorMessage/latencyMs），但无 executionId、无节点级中间信息、无失败分类。
- Step11 引入的多活跃执行点模型（LOOP/FORK/JOIN）目前仅维护工作队列（出队即丢弃），无"已访问节点序列"，并行分支之间无唯一标识（FORK 两分支复用同一节点 id）。
- F04 会话持久化（V21-V23 三表）是现成的最相邻先例：雪花 PK+审计列族+联合索引+批量落库模式，可类比但不可照搬（F04 只在成功分支写入，执行历史必须覆盖失败路径）。
- Flyway V26 封顶，V27 起可用；agent 模块迁移集中在 `sw-bootstrap` 统一路径，双份（h2/postgresql）同步。
- 失败信息目前只有可读文本（`GraphExecutionException` 18 个抛出点均无错误码/分类），若要落库需新增分类维度。

## 2. 目标（一句话）

图执行（`AgentGraphExecutionServiceImpl`/`AgentGraphInterpreter`）的每一次调用产生可查询的持久化执行历史，既包含**执行摘要**（状态/耗时/最终结果或失败原因），也包含**节点级明细**（本次执行访问过的节点顺序、（若可行）关键变量快照、节点级耗时），覆盖成功与失败两类路径，支持并行/循环场景下的分支轨迹留痕。

## 3. 非目标（明确排除）

- 不做数据量控制／归档／清理策略（用户已决策：本轮不考虑，留给以后视实际使用量再定；执行层若认为不做基本分页会导致查询端点在当前范围内不可用，可自行判断是否需要最基础的分页支持，但不要求设计保留期/清理任务）
- 不做单步调试（todo 池另一独立项，不在本轮范围；本轮持久化的节点级明细是单步调试未来可能复用的地基，但两者是独立功能，不在本轮合并实现）
- 不做图节点级多Key轮询（todo 池另一独立项，不在本轮范围）
- 不改变 F01 编排路径（`AgentGraphFactory`/LangGraph4j、`AgentOrchestrationServiceImpl`/F04 会话持久化）——两条执行路径继续并存互不干扰，本轮只改 F02 自建的执行引擎侵入的持久化面
- 不要求为第三方异常（网络/超时/429）新增专门的重试或限流处理逻辑——图执行路径当前无 429 识别（与 F01 不同），本轮只要求把失败信息可分类地记录下来，不涉及行为改变（是否要平移 F01 的 429 识别属独立判断，若执行层认为落库需要更细的错误分类，可自行设计分类维度，无需另请规划层批准）
- 不修改现有执行请求/响应 DTO 的对外行为（`success/output/errorMessage/latencyMs` 语义不变）——新增 executionId 等标识字段视为新增而非破坏性变更，允许追加
- 不得现场扩展 `flow-graph` adapter 导出面或修改 `contracts/agent.ts` 现有开放式类型设计——本轮若涉及前端查询页面，遵循与既有列表页（如会话列表）一致的既有模式，不触碰防腐层契约；如确认必须扩展，按 I31 先例暂停并回规划层评估

## 4. 影响范围（模块级）

**后端**（`Smart-WorkFlow/sw-basic/sw-basic-agent/`）：
- `AgentGraphInterpreter`：需要新增执行过程中的轨迹采集（已访问节点序列、并行分支标识、节点级耗时），现状零基础，是本轮核心改造点
- `AgentGraphExecutionServiceImpl`：执行前后包夹持久化写入逻辑，覆盖成功与失败两类路径（区别于 F04 只写成功分支的既有模式）
- 新增 Flyway 迁移（从 **V27** 起，`sw-bootstrap/db/migration/agent/{h2,postgresql}/`，双份同步）——预计新增执行记录表 + 节点执行明细表（具体张数/字段由执行层设计）
- 可能需要新增查询端点（列表 + 明细），权限层面预期复用现有 `agent:model:view` 惯例（沿用 F04 先例，非强制）

**前端**（`Smart-WorkFlow-Web/src/modules/agent/`）：
- 若本轮包含执行历史查询页面：预期新增列表/详情视图，具体是否本轮一并做前端展示，由执行层根据实现节奏判断（方向文档不强制要求前端交付，只要求后端持久化能力具备可查询性——如果执行层认为没有前端展示无法验证功能价值，可自行决定是否包含前端，但这不是本轮的强制目标）

## 5. 风险方向

1. **并行/循环下的执行点标识**：现有 FORK 分支复用同一节点 id、无 branchId 概念，节点级明细要区分"哪个分支的第几次访问"需要新造标识机制，是本轮技术复杂度的核心来源。
2. **失败路径与成功路径的落库一致性**：F04 先例只在成功且有输出后才落库，执行历史要求两类路径都完整记录，执行层需确保异常处理链路（catch-all 转 `success=false`）不会漏记或记录不完整的中间状态。
3. **错误分类粒度设计**：现有 `GraphExecutionException` 及其 18 个抛出点均只有自由文本消息，无错误码；若要落库为结构化的失败原因，执行层需要设计分类维度（本轮不强制要求覆盖所有异常类型的精确分类，只要求失败记录本身完整可查）。
4. **解释器纯 Java 约束下的采集方式**：`AgentGraphInterpreter` 无 Spring 注解、无 logger，新增轨迹采集需要考虑如何把数据传递给持久化层（如通过回调/返回值携带轨迹，而非解释器直接持有 Mapper 依赖），避免破坏其"纯 Java 可独立测试"的既有设计定位。
5. **执行频率未知**：当前无生产调用量统计（仅确认为人工低频触发场景），执行层若发现该假设与探索结论不符，或发现记录粒度导致单次执行的写入开销过大，可在完成回执中说明并据实调整，不构成对本方向文档的偏离。

## 6. 待确认问题

暂无——持久化粒度（摘要+节点级明细）与数据增长策略（本轮不考虑）已在规划阶段与用户确认完毕（见 §3 非目标）。执行层若在实现中发现本方向文档存在歧义或不可行之处，按硬约束在完成回执中明确报告，不得自行变更方向或绕过方案（system.md §3.2）。

## 7. 前置调研引用

`search_fallback/m07-step12-execution-history-precedent.md`（探索时间 2026-08-12，已确认现有执行调用链/DTO 结构/F04 持久化先例/Flyway 版本占用/失败异常结构，供执行层实现时参考现场证据，非强制遵循的实现方案）。

---

## 8. 执行层落地摘要（功能级完成回执要点，供最终验收）

**执行层自主设计决策**（详见 `receipts/step-12-execution.md` §8）：

| 决策点 | 落地 |
|---|---|
| 分支标识 | `branchId` 分支路径字符串（FORK 按出边出现顺序追加下标，如 "0"→"0-0"/"0-1"），LOOP 迭代靠 `nodeSeq` 区分同 branchId 多条记录 |
| 轨迹采集 | 解释器新增 `NodeExecutionTrace`（纯 Java 静态内部类）：nodeSeq/branchId/nodeId/nodeType/nodeLatencyMs/变量快照；经 `getTraces()` 返回值携带给 Service，不持有 Mapper 依赖 |
| 落库时机 | Service 包夹：执行前建 RUNNING 记录 → 解释器运行 → 终态回写（SUCCESS/FAILED）→ 节点明细批量落库；失败路径与成功路径统一包夹，一致性有测试保证 |
| 错误分类 | `GraphExecutionException` 新增 `category` 字段（8 类：STEP_LIMIT/LOOP_LIMIT/UNDEFINED_VARIABLE/CONDITION_NO_MATCH/TOPOLOGY_INVALID/MODEL_CALL_FAILED/TOOL_CALL_FAILED/UNKNOWN），18 个既有抛出点 + 第三方异常包装点全部显式携带 |
| 迁移 | V27 `sw_agent_graph_execution`（执行记录）+ V28 `sw_agent_graph_execution_node`（节点明细），h2/postgresql 双份同步；踩坑：`output` 列名是 SQL 保留字（租户拦截器 JSqlParser 解析失败），最终列名改为 `result_text`，对外 DTO 字段仍为 `output` |
| 查询端点 | `AgentGraphExecutionController`：列表（分页+可选 graphDefId 过滤）/ 详情 / 节点明细，权限复用 `agent:model:view`，仅租户级隔离（非用户级） |
| 落库边界 | 执行前校验失败（PARAM_ERROR/NOT_FOUND/未发布）不产生执行记录，对齐 F04"配置非法不落脏数据"先例 |
| 前端 | 本轮未做（方向文档 §4 不强制），后端查询端点+三层测试已证明可查询性 |

**测试结果**：定向 71/71（Interpreter 24 + Service 30 + Controller 17）；全量两次 `mvn test` 均 BUILD SUCCESS，**405→426（+21，全部本轮新增：Interpreter+5/Service+11/Controller+5），0 failures/0 errors**，无既有用例回归。

**风险对照（需求 §5）**：①并行/循环执行点标识 → branchId 路径字符串方案解决，测试用例 21（FORK→JOIN，7 条轨迹含 JOIN 挂起到达）显式验证；②失败/成功落库一致性 → Service 包夹统一处理，测试用例 21/22-26 显式断言；③错误分类粒度 → 8 类分类贯穿 18 个抛出点+第三方包装，超预期完成；④纯 Java 采集约束 → `getTraces()` 返回值传递，解释器零 Mapper 依赖，满足；⑤执行频率未知 → 未发现与探索结论冲突，人工低频场景下写入开销可接受。

**硬约束核对**：F01 路径零触碰；DTO 对外行为不变（仅追加 executionId）；不做数据量控制/单步调试/多Key轮询/429行为改变；不扩展 flow-graph adapter/contracts；提交无 Co-Authored-By 尾注。全部满足，详见执行回执 §9。
