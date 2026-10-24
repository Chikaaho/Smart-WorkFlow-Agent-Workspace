# be020-04 补充01执行：G1 设计预览/运行授权与 G2 终态监听阶段闭合

2026-10-24｜Executor（后端）｜XL｜IN_PROGRESS｜补充自验通过，待规划第二轮复核

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执只处理 `planning-execution-prompt-backend-020-01.md` 的 BE020-G1/G2 两项，其余按验收锁定的原证据承接，不重做盘点。

Server 消费快照：`b3aadbe974e91b7c03588b0e5d8ac32c2076708a`（普通推送，`origin/codex/0.2.0-tenant-form-flow` 回读同 SHA；前置 `6c03afb7`）。开工核实：HEAD 为 `6c03afb7`、工作树干净、无新在途修改。

## BE020-G1 闭合：按请求形态区分的准入语义

实现（Server 6 文件批次 `b3aadbe`）：

1. **设计预览（不带 formKey）**：`GET /form/ext/query/{queryKey}?version=` 走 `preview()`——`resolveEnabled` 后**检查当前设计授权**（`requireReferenceAllowed`），撤权后直接构造同 queryKey 预览返回 `1220 EXT_DATASOURCE_UNAUTHORIZED`。
2. **已发布运行读取（带 formKey+fieldKey）**：新路径 `previewForPublishedBinding()`——按 Planner 明确语义：不追溯原设计者的引用授权，但校验 (a) formKey 为本租户 `PUBLISHED` 表单；(b) 该字段存在于发布定义、类型为 DATASOURCE 且 `dsBinding.queryKey` 命中所请求 queryKey；(c) 当前运行人具备该字段查看权（`FieldPermissionService.canView`，按 definition `fieldPermissions` 主体匹配）。任一不满足 → 1220；满足 → 按既有 `resolveEnabled`（停用/未知/版本语义不变）执行受控查询。
3. **提交期对象解析**（`resolveSelection`）拆出公共执行段 `executeContract`，不回查设计授权——对象资格由发布绑定与提交链既有校验承担（伪造/失效对象 → 既有 `1215 EXT_OBJECT_NOT_FOUND`）。
4. 带 formKey 但缺 fieldKey → `1216` 参数错误；跨租户表单/契约按不存在拒绝。

**前端可消费的旧新输入/输出与准入解释（兼容变化）**：

| 调用形态 | 旧准入 | 新准入 |
| --- | --- | --- |
| 不带 formKey（设计预览） | `form:design` 或 `form:data:query` 即可 | 调用者需持有该契约数据源的**当前授权**（管理员旁路），撤权者 1220 |
| 带 formKey+fieldKey（运行读取） | 同上，凭 queryKey 即可读 | 本租户已发布表单 + 该字段 dsBinding 命中 + 字段查看权；无授权要求 |
| 带 formKey 缺 fieldKey | — | 1216 参数错误 |

前端运行读取必须改为携带 `formKey`（已发布表单）与 `fieldKey`（DATASOURCE 字段名）；仅凭 queryKey 的直接读取不再放行（1220）。错误码 1220 的语义扩展为「未授权引用该外部数据源或无发布绑定/字段资格」，`errorKey` 不变。设计器预览调用不变。

**行为证据**（`FormExtQueryAdmissionTest` 9 项，H2 集成；授权判定经**真实迁移同 DDL 的 `sw_bpm_ext_datasource_grant` 表持久读取**，管理员旁路按 `LoginUser` 权限串判定，无始终放行桩；执行引擎为固定行桩，真实执行链已由 `FormExtDatasourceControlledChainTest` 承接并沿用）：

| 用例 | 结果 |
| --- | --- |
| 有权设计者预览（授权行命中） | 放行，1 行 |
| 撤权后直接构造同 queryKey 预览 | 1220；授权行（软删）、契约启停、数据源状态零变更 |
| 运行读取：有发布绑定且字段可查看（仅 form:data:query，无授权行） | 放行 |
| 运行读取：仅知道 queryKey（无表单上下文） | 1220 |
| 运行读取：字段绑定其他契约（伪造绑定） | 1220 |
| 运行读取：字段查看权不足拒 / 具备 `role:viewer` 资格放行 | 1220 / 放行 |
| 运行读取：表单不存在/未发布 | 1220 |
| 直接构造契约启停请求：跨租户 queryKey | 1212 且 enabled 零变更 |
| 跨租户主体读取本租户绑定 | 1220 且授权行零变更 |

授权替换（grants）负向：`ExternalDatasourceControllerTest` 覆盖数据源不存在拒绝；跨租户隔离由授权端口的真实租户过滤（上表末项）与 `requireExisting` 的租户隔离 `getById` 承接；非管理员拒绝由端点既有 `@PreAuthorize('workflow:datasource:manage')` 权限位承担（HTTP 过滤器层鉴权沿既有 A16 跨租户 403 证据链，本轮未重写）。

## BE020-G2 闭合：终态监听阶段与新旧解释

实现（同批次）：`TriggerExecutionService.onProcessCompleted` 按 DR07 区分阶段——**旧配置（缺 `enabled` 字段）保持同事务评估**（随办理事务一起提交/回滚）；**新配置（显式 `enabled`）在终态提交后评估**：有事务同步时挂 `afterCommit`，经独立短事务（`TransactionTemplate` REQUIRES_NEW，沿 `ResourceAdmissionService` 既有模式）承载 exec 行与意图登记；afterCommit 内异常只记日志不反向传播。评估入口、禁用过滤、顺序、快照冻结逻辑不变。PROCESS_START 维持「实例建立后、同事务」原语义（审查确认不自动构成缺陷）。

**实际终态事件映射（按 DR07 核实）**：

| 事件 | 触发条件 | 阶段（旧配置 / 新配置） |
| --- | --- | --- |
| PROCESS_COMPLETED | 仅 `APPROVED` 终态提交（`TaskActionService` 结算处显式守卫；驳回/撤回/废弃不触发） | 同事务 / 终态提交后独立短事务 |
| PROCESS_START | 实例建立成功后（同事务） | 同事务（新旧一致，保持原语义） |
| TASK_SUBMITTED / NODE_ROUND_COMPLETED / NODE_ENTERING | 任务/节点事件，办理事务内 | 同事务（本轮不变） |

与 DR07 的一致性：DR07 要求「旧事件、结果分支和动作语义保持」；`PROCESS_COMPLETED 仅 APPROVED` 为既有语义，本轮保留并显式声明。若规划认定「流程结束」还应覆盖 REJECTED 终态，属产品口径变化，交 Planner 裁量后另批实施。

**行为证据**（`TriggerTerminalCommitPhaseTest` 5 项，真实 `DataSourceTransactionManager` + 真实 H2 持久 exec 行（生产同 DDL，唯一索引 `uk_sw_bpm_trigger_exec` 承接幂等）；命令队列为受控观察桩；脚本求值按既有隔离门禁用桩）：

| 完成条件 | 证据用例 | 实际结果 |
| --- | --- | --- |
| 新配置终态提交后发生受控副作用 | `newConfigSideEffectsHappenOnlyAfterTerminalCommit` | 终态事务内零入队、独立连接不可见 exec 行；提交后入队 1 次、exec 行持久、终态哨兵行在库 |
| 回滚不外发 | `newConfigRollbackProducesNoSideEffect` | 事务回滚后零入队、零落行 |
| 监听失败不撤销已成立终态 | `listenerFailureDoesNotUndoTerminalState` | 脚本失败 → FAILED 行可诊断；同事务终态哨兵行与 FAILED 行同存 |
| 重复投递不重复成功效果 | `duplicateDeliveryIsIdempotentOnRealPersistence` | 两次终态投递：入队 1 次、exec 行 1 条（真实 selectCount 去重 + DB 唯一索引兜底） |
| 旧配置保持已定义事务阶段 | `legacyConfigKeepsInTransactionPhase` | 事务内已入队且本连接可见；回滚连带撤销 |
| 禁用/顺序/快照承接 | `TriggerExecutionServiceTest` 既有 23 项（禁用零执行、冻结版本按原配置、exec_key 语义、载荷冲突） | 原证据承接，未改动该路径 |
| 重试仅补失败/未执行动作 | 命令层认领/有界预算重试为 T020 既有已采信证据（t020-work-admission-05/claimed-identity-06：未开始不认领、认领后一次动作有界写回）；触发层 FAILED 行可诊断为重试来源 | 分层承接，未新建投递表（DR07 口径） |

## 工程验证

- `MAVEN_OPTS="-Xmx2g" mvn test -pl sw-biz/sw-biz-form/sw-biz-form-biz,sw-biz/sw-bpm/sw-bpm-process -am`，exit 0：**form-biz 242 / 0 / 0 / 0**（基线 233 + G1 新增 9；含 FormG2EntryConsistencyTest 既有 11 项继续通过）、**bpm-process 466 / 0 / 0 / 0**（含 G2 新增 5；既有 TriggerExecutionServiceTest 23 项未改动路径原样通过）。原文 `/tmp/g1g2-full-final.log`、`/tmp/g1-admission-test.log`、`/tmp/g2-phase-test.log`（本机 `C:/Users/hjxch/AppData/Local/Temp/` 留存）。
- engine（175）与迁移链（PG 12+H2 1）本轮未触及，沿 be020-03/02 原证据承接。

## 边界与下一动作

- 前端需按上表对齐运行读取的新入参（formKey+fieldKey）；对接问题不影响其余契约。
- 授权替换/契约启停的 HTTP 过滤器层权限位（`@PreAuthorize`）为既有框架行为，本轮以服务/Mapper 集成强度证明授权持久读取与跨租户拒绝，未另建全上下文 HTTP 测试。
- 独立密钥版本化、三种新节点语义、富文本格式交接仍为规划/协作项，未冒称完成，不以等待它们停止本轮两项闭合。
- G1/G2 已按补充任务完成实现与行为闭合，等待规划第二轮复核；自验不裁决整版 PASSED/COMPLETED。
