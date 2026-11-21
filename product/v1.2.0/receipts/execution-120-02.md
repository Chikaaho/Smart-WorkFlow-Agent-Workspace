# 1.2.0 第二批执行回执（execution-120-02）

日期：2026-11-21｜执行（Executor）｜覆盖：E1-1~E1-4 + E1-7 关联（流程侧）+ E1-8 + E2 全量｜自验通过，待规划验收

## 1. 概要与 Git 事实

第一批（§3 回答 + E3-1/E3-2 + E1-7 迁移）见 `execution-120-01.md`，本批为阶段 2 实施主批。

| 仓 | 提交 | 内容 | 远端回读 |
|---|---|---|---|
| Server | `3411135b` | E1 流程侧：agent-api 模块 + 端口实现 + Graph 执行器节点（翻译器/委托）+ E1-7 查询 + 实例详情关联 | `3411135b2e12` 一致 |
| Server | `92a04b27` | E2 日志等级：LoggingSystem 服务 + 控制器 + 权限点 + 审计 + 测试 | `92a04b2777b8` 一致 |
| Web | `6da6fd4` | E1 Web：设计器 Graph 执行器面板 + 执行列表来源筛选/列 + 实例详情关联区块 + composable/适配器/契约 | `6da6fd41edcd` 一致 |
| Web | `c3faf9a` | E2 Web：日志等级页（菜单种子 component `system/views/LogLevelList` 与 V1.2.0 种子一致，glob 白名单自动解析） | `c3faf9a9f22d` 一致 |

工作区仓本回执单独提交。Server/Web 工作树无未提交授权内成果（Web 遗留 `components.d.ts` 自动生成漂移，未提交）。

## 2. E1 流程侧（E1-1~E1-4、E1-8）

### 2.1 新契约模块 `sw-basic-agent-api`（零依赖，仿 sw-basic-iot-api）

- `AgentGraphInvokePort`：`describeBinding(graphDefId, defVersion)`（固定版本绑定描述）、`invoke(invocation)`（同步调用）、`listByProcessInstance/listByFormRecord`（E1-7 反查）。
- 记录：`AgentGraphVersionBinding`（含 `containsHumanNode` 递归子图判定、startParams[name/type/required/description]、endParams[name/description]、executionTimeoutSeconds）、`AgentGraphInvocation`、`AgentGraphInvocationResult`、`AgentGraphExecutionBrief`、`AgentGraphBusinessSources`（PROCESS/FORM/DIRECT，D52 不建 enum）。

### 2.2 agent 侧（sw-basic-agent）

- `AgentGraphExecutionLifecycleService` 新增固定版本 + 业务关联受理重载：`submit(graphDefId, defVersion, input, inputs, idempotencyKey, BusinessLink)`；defVersion 非空时校验版本存在且快照可解析，受理行写 `graph_def_version`=绑定版本（worker 按快照执行——P67「绑定固定版本」）与四列业务关联（E1-7）。既有三参入口行为不变（全量测试回归绿）。
- `AgentGraphInvokePortImpl`：describeBinding 按 START/END 节点 config（G1-4 键 `params`/`outputs`）解析声明，HUMAN 节点与子图递归（≤3 层、防环）判 `containsHumanNode`；invoke = 受理（幂等）→ **有界轮询受理行**（250ms，上限=min(调用方超时, 图自身超时)）→ 终态映射；WAITING_HUMAN 运行期兜底取消并按 HUMAN_PAUSE 失败；**成功守卫（E1-4）**：声明的结束输出缺失/空白 → `OUTPUT_MISSING` 失败，不允许「成功但出参为空」。租户隔离全部经租户拦截器按调用方上下文（跨租户=不存在——E1-8 运行期校验）。
- `AgentGraphDefController` 新增 `GET /{id}/versions/{version}/binding`（设计器与发布校验同源；权限 `agent:model:view`）。
- 执行历史分页 `GET /agent/graph-executions` 增 `businessSource` 过滤与行级来源列（`sw_agent_graph_execution` × 受理行子查询 MAX/COALESCE，九库可移植：不用 LIMIT；DIRECT=无 PROCESS/FORM 关联行）。

### 2.3 bpm 侧（sw-bpm-engine / sw-bpm-process）

- **`GraphExecNodeTranslator`**（type `GRAPH_EXEC`，`ServiceTaskNodeTranslator` 子类=服务节点执行器，不新增 BPMN 节点类别）：发布期校验（E1-2/E1-5/E1-8）——绑定图+版本必填；经端口 `describeBinding` 判存在/已发布/跨租户（跨租户按不可绑定拒绝）；**含人工节点（含子图递归）拒绝**（E1-5 裁定前口径，写明原因）；必填入参声明 ⊆ inputMappings；出参映射 source 必须在结束输出声明内、目标变量名非空；节点超时 ≤ 图自身执行超时。端口未装配（隔离引擎上下文）fail closed。
- **`GraphExecNodeDelegate`**（bean `graphExecNodeDelegate`）：**同步执行不设 async**（E1-3：推进线程内等待，Q3 已评估线程占用）；**系统身份** `{userId=0, username="bpm-graph-exec", tenantId=实例租户}` 调用，结束恢复原身份；幂等键 `bpm-graph:{processInstanceId}:{activityId}`（重试/恢复不重复执行）；入参从流程变量取值（缺失=配置失败）；出参按映射写回流程变量（后续条件分支可用，E1-3）；统一写 `graphExec.{activityId}.[executionId|status|latencyMs|errorCategory|errorMessage]`；失败三情况（超时/报错/出参缺必需）默认 BLOCK 抛业务异常（实例可见原因），`failureStrategy=CONTINUE` 记录并推进（**异常分支实现口径**：下游 CONDITION 节点按 `graphExec.{nodeId}.status/errorCategory` 分流——本仓无节点级异常边先例，未发明新 BPMN 语义，请规划确认，见 §6）。
- `BpmInstanceController.instanceDetail` 增 `graphExecutions` 关联段（经端口 `listByProcessInstance`，智能体模块未装配保持 null；E1-7 实例详情看执行编号/耗时/结果）。

### 2.4 Web（E1-1/E1-7）

- 跨模块经既有接缝：扩展 `src/adapters/agent-graph-catalog.ts`（`listPublishedGraphDefs/listGraphVersions/getGraphVersionBinding`，动态 import 不破坏模块边界 ESLint 门禁）。
- 设计器：`use-designer-graph-exec` composable + `DesignerGraphExecPanel`（绑定已发布图下拉→固定版本下拉→绑定声明驱动映射行编辑，**参数从声明列表选、不手写字符串**；必填标注；含人工节点醒目告警；映射行保留同名已填变量）+ 属性面板接入 + 调色板「自动处理」组新条目（复用智能体字形）。`genericConfigFields` 对 GRAPH_EXEC 剔除 graphDefId/graphDefVersion（由专属面板承载）。
- 执行列表：来源筛选下拉（流程/表单/直接调用）+ 来源列（DIRECT 兜底展示）；实例监控详情抽屉新增「Graph 执行记录」卡片（执行编号可跳转 `/agent/executions/detail/{id}`、图/版本/状态/耗时/失败原因）。
- 契约：`contracts/agent.ts` 增 binding/brief 类型；`contracts/bpm.ts` InstanceDetail 增 `graphExecutions?`。

## 3. E2 日志等级管理（全量）

- Server：`LogLevelService`（真实 `LoggingSystem`：`getLoggerConfigurations` 列表+keyword 过滤、`setLogLevel` 即时生效/level 空=恢复默认、非法等级拒绝含合法集合提示）；每次调整写审计（`AuditLogService.record`：logType=OP、action=LOG_LEVEL、target=logger、summary「A → B（重启后恢复配置文件等级）」——E2-3 谁/哪个 logger/从什么等级到什么等级）。`LogLevelController` `/system/log-levels`（GET 列表 / PUT `/{logger}/level`），**查看与调整共用独立权限点 `system:loglevel:manage`**（E2-3；种子已在 V1.2.0 迁移，默认不授任何角色、超管短路可见可调）。不换日志框架（E2-1 优先口径）。
- Web：`system/views/LogLevelList.vue`（菜单 component 与种子一致自动路由）——列表（配置等级 vs 生效等级、「默认」标注）、搜索、即时调整/恢复默认、**ROOT 调 DEBUG/TRACE 二次确认提示日志量增大（E2-5）**、**页首写明「调整立即生效，仅对本次运行有效；重启后恢复配置文件中的日志等级」（E2-4）**。
- E2-2「真实请求前后日志对照」与 E2-4「重启前后对照」证据属阶段 3 iso120 浏览器/环境证据，本批先交服务测试。

## 4. 验证证据

| 门禁 | 结果 |
|---|---|
| Server 编译（agent/-api/bpm-engine/bpm-process/system-biz -am） | BUILD SUCCESS×4 |
| agent 模块全量 `mvn test` | 160 tests 全绿（50 sw-common + 11 + 6 + 93） |
| bpm-engine + bpm-process `mvn test` | 74 + 56 全绿 |
| `LogLevelServiceTest` | 4/4 绿（真实 Log4j2 LoggingSystem：列表过滤/调整/恢复/非法拒绝/审计捕获） |
| `.last` 语料门禁 | 136→138（新增 2 处 LIMIT 关联查询，方言改写由既有拦截器覆盖，门禁绿） |
| Web typecheck | vue-tsc 零错误（三批各自过） |
| Web lint | 变更文件 0 error（prettier 自动整理已入提交） |
| Web vitest | ExecutionList 27→29 绿（P74 回归）；workflow 模块 43 文件 340/340 绿；agent 模块 301（298 过 3 skip）绿；新增 `use-designer-graph-exec.spec` 5/5 绿 |

原始输出见执行会话记录；阶段 3 需要的浏览器截图（服务节点配置、发布校验报错、实例跑通条件分支、超时/失败三分支、人工图拒绝、E2 调整前后日志对照、权限拒绝、重启对照、E3-1 前后对照）与九库多库迁移证据在 iso120 批次统一补齐。

## 5. 与方向/已定语义的偏差

1. **异常分支实现口径（需规划确认）**：E1-4「配了异常分支就走异常分支」实现为 `failureStrategy=CONTINUE` + 状态变量 + 下游条件节点分流。理由：本引擎无节点级异常边/错误边界事件先例（CONDITION 网关是唯一分流机制），新发明 BPMN 语义超出本批授权。行为与方向验收等价（走失败侧分支 + 原因在流程变量），但配置形态是「失败策略 CONTINUE + 条件节点」而非「节点上的异常出边」。若规划要求字面「异常出边」，需方向修订后追加。
2. **同步等待实现为有界轮询**（250ms 查受理行）而非进程内事件等待：受理行状态是权威且九库可移植的事实源，轮询窗口内最多 3 个并发等待（bpm 命令 worker 3）负载可忽略。语义满足「等到结束再往下走」。
3. **sw-basic-agent-api 新 maven 模块**：P67 语义只定「跨模块按 ObjectProvider + 白名单先例」，本仓跨模块契约的既有形态即独立 api 模块（iot-api/form-api/notify-api…），故按先例建模块而非 bpm 直接依赖完整 agent 模块。

## 6. 未完成（本批边界内）

- **E1-6 表单侧**（下一批）：表单设计器「调用 Graph」动作（提交前/按钮触发、出参回填、失败阻止提交/仅提示）——依赖本批端口，属表单模块接入。
- E1-5 挂起回调方案仍等 §3 问题 1 裁定（本批按发布拒绝实施）。
- 阶段 3 起的全部验收/合并/发版/部署（iso120、多库证据、E3-3 历史行）。
- 全量 `mvn test`（Server）与九库结论按 P66 口径在阶段 3 补。

## 7. 阶段进度

七阶段：已完成 1；进行中 1（阶段 2 实施：E1-1~E1-4/E1-7/E1-8、E2 已实现待浏览器证据，**余 E1-6 与 E1-5 裁定**）；未开始 5。下一批：E1-6 表单侧 → 阶段 3 iso120 验收证据。

## 8. 自验结论

本批交付物全部完成并通过适用机器门禁（编译×4、Server 模块测试 290+ 绿、Web typecheck/lint/模块测试 670+ 绿），**自验通过，待规划验收**。
