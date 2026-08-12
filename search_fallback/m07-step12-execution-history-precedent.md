# 探索回执：M07「执行历史持久化」前置调研

**执行时间**：2026-08-12
**执行模型**：deepseek/deepseek-v4-flash（执行层 subagent × 2：执行引擎链路 / 持久化先例与迁移）
**任务文件**：`search_task/m07-step12-execution-history-precedent.md`
**结论**：6 问全部有现场证据，无未确认阻塞项；唯一未确认事项为生产环境实际执行频率（无埋点可统计，见问题 4）。

---

## 探索结论（一句话版）

图执行路径（`POST /agent/graph-defs/{id}/execute`）当前**零持久化、零轨迹采集**：响应 DTO 仅有 `success/output/errorMessage/latencyMs` 四个字段，解释器内存中只有最终变量快照 + 活跃节点 id 工作队列（FIFO 出队即丢弃），无访问序列、无分支实例 id、无节点级耗时、无任何日志打印。失败异常仅 message 无错误码分类（`GraphExecutionException` 18 个抛出点靠子串区分）。但**持久化基建完全就绪**：F04 三表（V21-V23 会话/消息/工具日志）的雪花 PK + 审计列族 + 联合索引 + ThreadLocal 批量落库模式可原样类比；Flyway V26 后无占用（V27 空闲），agent 迁移统一集中 `sw-bootstrap/db/migration/agent/{h2,postgresql}/`（Step11 零迁移）。主要设计增量在：执行状态机（RUNNING/SUCCESS/FAILED + 失败路径落库）、并行/循环下的节点顺序号层级维度、错误分类枚举。

---

## 检查范围

- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/`：`controller/AgentGraphDefController.java`、`controller/AgentConversationController.java`、`service/impl/AgentGraphExecutionServiceImpl.java`、`service/impl/AgentOrchestrationServiceImpl.java`、`service/impl/AgentConversationServiceImpl.java`、`orchestration/AgentGraphInterpreter.java`、`orchestration/AgentGraphFactory.java`、`orchestration/AgentToolCallbackFactory.java`、`dto/AgentGraphExecute{Req,Resp}DTO.java`、`dto/AgentOrchestrationRun{Req,Resp}DTO.java`、`dto/graph/`、`entity/Agent{Session,Message,ToolCallLog,GraphDef}.java`、`mapper/`
- Flyway：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/{root,agent,storage,job}` + 各业务模块内迁移目录、`application.yml` locations；`sw-basic-agent/src/main/resources/db/migration/agent/`（仅 .gitkeep）
- 辅助文档（已确认结论直接引用）：`product/agent-model-orchestration/passed/step-4-f04-conversation.md`、`step-8-graph-interpreter-engine.md`、`step-10-multivar-context-backend.md`、`step-11-parallel-loop-nodes.md`
- git 提交核对：f42c0ac（Step11）、e288862（Step9 V26）、50dc0df（Step10）

---

## 关键证据（按问）

### 问题 1：执行调用链与 DTO —— 结果字段齐全，唯一中间信息是整次耗时

**已确认**。调用链：`POST /agent/graph-defs/{id}/execute` → `AgentGraphDefController.execute`（:95-100，权限 `agent:model:manage`）→ `AgentGraphExecutionServiceImpl.execute`（:97-150）：input 校验 → requireEntity（:349-358）→ 发布状态校验 → parseGraph（:360-372）→ `validateForExecution` 8 项校验（:168-254）→ **maxSteps 预算 = 节点数×2 + Σ(LOOP maxIterations)×节点数**（:120-136）→ `AgentGraphInterpreter.run` → 成功 `success=true+output`；异常 catch-all 转 `success=false+summarizeError`（:142-147，cause 链最深非空 message，不上抛，:378-388）。

- 请求 DTO `AgentGraphExecuteReqDTO`：仅 `input` 一字段。无执行 ID/版本/会话参数。
- 响应 DTO `AgentGraphExecuteRespDTO`：`success:boolean` / `output:String` / `errorMessage:String`（结果字段）+ `latencyMs:long`（**唯一中间信息字段**，Service 层 currentTimeMillis 起止差 :116/:148）。
- **确认不存在**：executionId/runId 全模块 grep 零命中、无执行状态字段、无节点轨迹、无变量快照、无节点级耗时。Service 类注释明示「本 Step 不落库，返回值即结果」（:48-49）。
- 相邻 F01 路径（`/agent/orchestration/run`）DTO 多出 `sessionId/usedModelConfigId` 且**已落库**——已有可参考先例。

### 问题 2：多活跃执行点模型 —— 只有工作状态，无轨迹，粒度仅节点 id

**已确认**。`AgentGraphInterpreter.run` 全部执行状态（:198-207）：
`variables`（最终值快照，并行分支后写覆盖）、`activeNodeIds`（List<String> FIFO 队列，出队执行即 remove(0) **丢弃**，:209）、`loopIterationCounts`/`joinArrivalCounts`（按节点 id 键）、`steps`（全局计数）。

- **无「已访问节点序列」**：活跃点是工作队列非轨迹；任一分支到 END 即 return（:213-215），完整路径都不留。
- **无分支实例 id**：FORK 两分支复用同一节点 id，无 branchId 概念 → 并行轨迹持久化需自造执行点标识。
- **无节点级耗时、无日志**：解释器无 logger；全链路唯一日志是 Service 层 graph_json 解析失败 warn（:369）。
- → 节点轨迹持久化 = 解释器新增采集，现状零基础可复用。

### 问题 3：F04 三表持久化先例 —— 结构/写入/查询模式清晰，可直接类比

**已确认**（迁移脚本 `sw-bootstrap/db/migration/agent/{h2,postgresql}/V21__init_agent_session.sql` / `V22__init_agent_message.sql` / `V23__init_agent_tool_call_log.sql`，双份同构仅 CLOB↔TEXT 与 COMMENT 差异）：

- **sw_agent_session**：雪花 PK（Java 层 ASSIGN_ID，无自增）、`agent_model_config_id BIGINT NOT NULL`、`title`、`status VARCHAR(20) DEFAULT 'ACTIVE'`（varchar 非 enum）；审计列族（create_time 由 MetaObjectHandler 赋值、create_by、update_time/by、deleted、tenant_id、version 乐观锁，BaseEntity 承载）；索引 `(tenant_id, create_by, deleted)` + `(agent_model_config_id, deleted)`；**无外键**。
- **sw_agent_message**：`session_id`、`role VARCHAR(20)`（USER/ASSISTANT/SYSTEM）、`content CLOB/TEXT NOT NULL`、`msg_order INT`（**Java 层计算 = 已有消息数**）；索引 `(session_id, msg_order, deleted)`。
- **sw_agent_tool_call_log**：`session_id`、`tool_name VARCHAR(100)`、`tool_call_args/tool_call_result CLOB/TEXT`（入参/返回 JSON）、`latency_ms BIGINT`；索引 `(session_id, deleted)`。
- 实体继承 BaseEntity；Mapper 全为空接口 `extends BaseMapper<T>`（零 @Select 先例）；查询走 Wrappers + 租户拦截器。
- **写入时机**（全在 `AgentOrchestrationServiceImpl.run()`）：会话惰性创建 **:164**（ChatModel 构造成功后，配置非法不落脏数据）、消息成功且有 output 后两行 **:212-213**（msg_order 计算 :211）、工具日志 **:214** → `persistToolCallLogs`（:304-318）从 ThreadLocal `TOOL_CALL_RECORDS_BINDING` 批量 insert；捕获点 `AgentToolCallbackFactory.java:177` 计时并 record。
- **查询端点**：`GET /agent/conversations`（列表，create_time 倒序）+ `GET /agent/conversations/{sessionId}/messages`（msg_order 升序不分页），权限复用 `agent:model:view`；**无工具日志查询端点**（只写不读）。
- **类比映射**：会话表↔执行记录表（骨架照搬，但需状态机 RUNNING/SUCCESS/FAILED + end_time/latency/error_message 列）；消息表↔节点执行记录（(execution_id, node_seq) 联合索引 + Java 层顺序号模式）；工具日志表↔工具调用记录（字段几乎照搬，关联键换 execution_id + 可加 node_id）。
- **需差异设计**：① 状态生命周期（F04 status 写死 ACTIVE 无 update，执行记录需 update 路径）；② **失败路径落库**（F04 三表只在成功分支写入 :211-215，执行历史必须记录失败）；③ 并行/循环下顺序号需含层级/并行维度（不能简单 0-based 计数）；④ 执行记录无限增长需分页（F04 消息端点不分页）。

### 问题 4：触发入口 —— 唯一生产入口，定位人工低频，测试为已知高频

**已确认**。唯一入口 `AgentGraphDefController.execute`（`POST /agent/graph-defs/{id}/execute`，权限 `agent:model:manage`）；全仓库 grep 无其他调用方、无 `@Scheduled`/`@EventListener`/MQ 异步触发。接口注释与权限设计（执行与发布同级）表明定位是**设计器内人工触发的一次性执行**（消费模型成本），非面向终端用户的高频接口。已知高频场景是单元测试（InterpreterTest ~17 用例、ExecutionServiceImplTest 16+），属开发期流量。
**未确认事项**：生产实际执行频率无埋点可统计；数据量级以「每触发一次 = 1 条执行记录 + N 条节点记录」为估算单位。

### 问题 5：Flyway 版本占用与路径规则 —— V26 封顶、V27 空闲、Step11 零迁移

**已确认**。全量清单 V1-V26 连续无空洞，**最高 V26**（root `V26__agent_graph_menu_seed.sql`，Step9 菜单种子，非建表）；V26 后**无任何占用**。版本号全局唯一（单库单 flyway_schema_history、out-of-order:false、validate-on-migrate:true），跨模块共享编号空间。
- agent 迁移路径规则：SQL **集中 sw-bootstrap** `db/migration/agent/{h2|postgresql}/`（V19-V25）；sw-basic-agent 模块自身只有 `.gitkeep` 无 SQL；注册于 `application.yml:53-60` locations 列表 + `:64` table。`{vendor}` 占位符按运行数据源解析，**每版本 h2+postgresql 双份同步**。
- **Step11 零迁移（已确认，双源证据）**：提交 f42c0ac 全量仅 4 个 Java/测试文件无 migration；step-11 文档 line 42/78 明示「语义全走 config 不透明 Map，零迁移」。Step10（50dc0df）同样零迁移。
- → 执行历史将是 agent 子目录 F04 之后**首个新迁移批次**，从 **V27** 起编号。

### 问题 6：失败异常结构 —— 消息可读可落库，但需新增错误分类字段

**已确认**。三类异常：

1. **`GraphExecutionException`**（Interpreter 静态内部类，RuntimeException，仅 `(message[, cause])`，**无 code/type**）—— 18 个抛出点全部消息自描述且含节点 id，如：步数超限 :218、循环迭代超限 :232（含 nodeId）、活跃点耗尽未达 END :260、变量未定义 :351-352、条件分支无匹配且无默认边 :414、非条件节点出边不唯一 :424、边引用不存在节点 :518 等。
2. **`BaseException`**（校验层）—— 仅 5 个通用错误码（SYSTEM/PARAM/UNAUTHORIZED/FORBIDDEN/NOT_FOUND），无执行域细分；校验失败**上抛**，运行时失败**不抛**（转 success=false）。
3. **第三方异常**（Spring AI 网络/超时/429、解密失败等）—— 被 Service catch-all 吞为单条文本；**图执行路径无 429 限流识别**（F01 有 `isQuotaExceededException` 专责判断，AgentOrchestrationServiceImpl.java:328-342，可平移）。
- 响应 `errorMessage` = summarizeError 取 cause 链最深非空 message，无堆栈无错误码；前端只能子串匹配区分。
- **复用性判断**：`errorMessage` 文本可原样落库为 errorDetail（人类可读）；**必须新设计**：① 错误分类枚举（STEP_LIMIT / LOOP_LIMIT / UNDEFINED_VARIABLE / CONDITION_NO_MATCH / TOPOLOGY_INVALID / MODEL_CALL_FAILED / TOOL_CALL_FAILED / PARAM_INVALID / NOT_FOUND 等）——现有靠子串匹配含节点 id 干扰不可靠；② 第三方异常需在 catch 处保留类型信息（区分网络/429/超时，支撑重试与故障统计）；③ 防御性兜底分支（:275/:309/:493/:518/:525/:534）归「图配置异常」类目；④ 节点级耗时需解释器新采集。

---

## 对规划层的直接启示（影响范围与风险点）

- **新增表 2-3 张**（V27 起，agent/{h2,postgresql} 双份）：执行记录表（graphDefId+defVersion 关联、状态机、latency、errorCategory/errorMessage）+ 节点执行明细表（执行点标识需自造 branchId、nodeSeq 层级、变量快照）+ 可选工具调用表（字段照搬 V23 加 execution_id/node_id）。
- **代码改造面**：解释器新增轨迹采集（注意保持纯 Java 无 Spring 注解，经回调注入）+ Service 执行前后包夹落库；失败分支新增落库；错误分类枚举贯穿异常构造（18 个抛出点）。
- **主要架构风险**：并行/循环下执行点标识与顺序建模（FORK 分支无 id 的现状）、失败路径与成功路径落库一致性、执行频率未知下的数据增长（分页/归档策略）。
