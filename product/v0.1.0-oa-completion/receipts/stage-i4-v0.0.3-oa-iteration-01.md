# I4 首次正式执行回执（v0.0.3 迭代候选 01）

> 角色：执行（Executor）
> 日期：2026-09-12
> 唯一执行入口：`product/v0.1.0-oa-completion/ready/direction-stage-i4-orchestration-process-operations-workbench.md`
> 版本口径：成熟 OA 目标 `0.1.0`；当前交付迭代 `0.0.3`
> 自验结论：**自验通过（部分验收项为部分覆盖 / 待真实行为补证），提交 `VERIFYING / EXECUTION_SUBMITTED`，待规划验收**
> 机器终态：`ENGINE_TERMINAL` 行见文末

## 1. 执行前置

- 已按宪法入口读取 `system.md`、`roles/executor.md`、两仓工程宪法、`project.md`、版本基线 02 回执、I4 接缝探索补充 01。
- 按方向 §2 授权完成执行前置机械同步：`knowledge/current-status.md` 版本关系登记为「成熟 OA 目标 0.1.0、当前交付迭代 0.0.3」，I4 `READY → IN_PROGRESS`；正式功能数 44、90 项清单计数、P 编号与 I1—I3 锁定结论零变化。

## 2. 交付内容与内部 Step

### S1 动态并行编排（方向 §3.1）

- `DYNAMIC_PARALLEL` 节点（P57 注册契约）：`sw-bpm-engine/.../translator/DynamicParallelNodeTranslator.java`——并行多实例 UserTask，每分支＝一个去重后的有效部门负责人；汇聚复用 I3 统一共识规则（`consensusCompletionEvaluator`：ALL/ANY/RATIO/VETO）与唯一键计票（`ConsensusVotePort`），单次结算、单一终态。
- 进入节点冻结：`delegate/DynamicBranchCollectionResolver.java`（受控来源 FORM_FIELD/VARIABLE/FIXED；租户、部门有效性、负责人逐项校验；空集合/失效对象/缺负责人/超上限按 BLOCK 默认阻断或显式受控策略 PROCEED/SKIP 放行且逐条记录原因）；端口契约 `api/participant/DynamicBranchPort.java`。
- 冻结快照与分支审计：process 侧 `entity/DynamicBranchSnapshot`（`sw_bpm_dynamic_branch`）+ `config/DynamicBranchPortConfiguration.java`（同负责人按部门 ID 升序合并去重；无效对象落 CANCELED 行记录原因；冻结幂等不重算）；`listener/DynamicBranchTaskListener.java` 回写分支 START/APPROVE/DISAPPROVE；负向结算/终止经 `ApprovalLifecycleServiceImpl` 关闭剩余分支（closeRemaining）。
- 参与人收敛：动态并行分支只走 P58 `ParticipantResolverRegistry`（`DeptLeaderParticipantResolver` + `UserQueryFacade.findActiveUserIdsByDeptLeaders`），未新增第二套参与人语义。

### S2 流程模板中心（§3.2）

- `entity/BpmProcessTemplate`（`sw_bpm_process_template`：分类/状态/版本/范围/来源定义）+ `service/BpmProcessTemplateService(+Impl)` + `controller/BpmProcessTemplateController`（`/workflow/templates`，`workflow:template:*` 权限）。
- 分级授权：GLOBAL/DEPT scope，无权身份列表不可见、get/copy 服务端拒绝（`assertVisible`/`FORBIDDEN`）。
- 复制后编辑并发布：`copyToDefinition` 走正式定义创建链（`createDef` + `saveDraftGraph`），模板零改写；溯源登记 `sw_bpm_process_def.source_template_id/source_template_version`（`markTemplateSource` 仅 DRAFT 未登记时写入，历史不改写）。

### S3 监控、干预与基础分析（§3.3）

- `mapper/BpmMonitorMapper`（七类条件：定义/实例/发起人/状态/节点/办理人/时间范围；数据范围条件与 `BpmInstanceMapper` 同口径 SELF/部门三档/恒假，汇总与明细共用 scope）。
- `service/BpmMonitorService(+Impl)` + `controller/BpmMonitorController`（`/workflow/monitor`，`workflow:monitor:view/manage`）。实例级干预 SUSPEND/RESUME/TERMINATE/TRANSFER 逐项授权，逐次落 `sw_bpm_instance_intervention` 审计（操作者/原因/前后状态/受影响任务数）；实例级挂起（`BpmTaskFacade.suspendProcessInstance/resumeProcessInstance/isProcessInstanceSuspended` 新增）与定义级挂起分离。
- 基础分析：发起/完成/运行/驳回计数、平均与 P50/P90 耗时（线性插值可复算）、节点停留与 P90（Flowable 历史活动聚合，样本上限 200）、办理人工作量；同受 DataScopeFilter 约束。

### S4 流程专用跨系统接入（§3.4）

- `sw-biz-openapi` 从空白落成底座：实体 `sw_openapi_app / sw_openapi_nonce / sw_openapi_idempotency / sw_openapi_callback_log`（迁移 `openapi/{h2,postgresql}/V80__i4_openapi_base.sql`，版本顺延全局命名空间）。
- 入站鉴权 `service/OpenApiAuthService`：HMAC-SHA256 签名（secret 仅存 SHA-256 摘要）、±300s 时间窗、nonce 唯一键防重放（DB 权威）、scope 校验、租户边界；通过后还原应用绑定用户的受控代理上下文。
- 外部发起 `service/OpenApiProcessService.start`：复用正式表单提交链 `FormDataSubmitFacade.submit`（同一校验/版本解析/幂等/事件→流程），不直接调用底层启动能力；业务键+幂等键 DB 唯一键保证同键只产生一次合法业务效果（重复请求返回既有结果，`idempotentReplay=true`）。
- 状态查询 `GET /openapi/v1/processes/{id}`：businessKey+租户双校验，越权/跨租户一律 `PROCESS_NOT_VISIBLE`（新增 `BpmRuntimeFacade.getProcessInstanceStatus`）。
- 嵌入式办理 `POST /openapi/v1/tasks/{taskId}/complete`：`completeAsUser` 服务端归属校验。
- 出站回调 `listener/OpenApiCallbackListener`：实例终态事件（AFTER_COMMIT+Async）签名 HTTP POST（hutool），白名单载荷（实例/定义/状态/业务键，敏感表单字段不出站），失败重试 3 次退避、逐次落日志、同事件成功去重；回调失败不回滚流程动作。
- 安全放行：`/openapi/v1/**` 加入 `permit-urls`（鉴权由显式签名层承担）；flyway locations 增加 `openapi/{vendor}`。

### S5 批量审批（§3.5）

- `service/BpmBatchService(+Impl)` + `BpmOpsController POST /workflow/tasks/batch-action`（`workflow:task:batch`）：逐项复用单任务动作链 `ApprovalLifecycleService.executeTaskAction`（归属/状态/版本/意见要求/强制意见表单全部同口径，不绕过）；逐项返回稳定 taskId + success/errorCode/message；单项失败不掩盖其他项。

### S6 流程交接（§3.6）

- `entity/BpmHandover / BpmHandoverItem`（`sw_bpm_handover(_item)`，迁移 V79）+ `service/BpmHandoverService(+Impl)` + `POST /workflow/handover`（`workflow:handover:manage`）。
- 默认只迁移选定范围内未完成可办理任务（来源用户待办、范围 defKey 过滤）；代理规则仅显式勾选且有效期内随迁（复制新规则、原规则标记 HANDOVER_MIGRATED）；抄送/已办/历史意见/过期规则不迁移；目标用户同租户有效校验、同用户拒绝；逐项清单记录前后责任人/结果/失败原因；重试零重复（已迁任务 SKIPPED_ALREADY_MIGRATED）。

### S7 完整工作台与移动端（§3.7，前端）

- 新增 API 层 `modules/workflow/api/i4.ts`；页面 `TemplateCenter.vue / InstanceMonitor.vue / ProcessAnalytics.vue / BatchApproval.vue / TaskHandover.vue / WorkflowCenter.vue / MobileWorkspace.vue`；路由（`workflow/templates|monitor|analytics|batch-approval|handover|center`、`/m/workflow`）。
- 统一工作台 `WorkflowCenter.vue`：待办/已办/我发起的/草稿/抄送/消息入口聚合，服务端当前身份数据；移动 H5 `MobileWorkspace.vue`：发起入口、待办办理（同一命令受理链 `acceptTaskAction`+`pollCommandStatus`，不以受理代成功）、意见输入、草稿/结果查询；与 PC 同一 API 与权限。
- Mock（dev:mock 验收台）：`foundation/mock/handlers.ts` 追加 `i4MockRegistrations`（模板/监控/干预/分析/批量/交接，含批量第二项业务失败以演示逐项结果不掩盖）。
- P54 `WorkspaceHome` 个性化布局为已锁定行为，本轮未改写；统一工作台以并存页面交付（见 §6 偏差）。

## 3. 数据库迁移（H2/PostgreSQL 同一迁移身份，逐字一致）

| 版本 | 内容 |
|---|---|
| V76 | `sw_bpm_dynamic_branch` 动态并行分支冻结快照（唯一键 tenant+instance+node+branch_index） |
| V77 | `sw_bpm_process_template` + `sw_bpm_process_def` 溯源列 |
| V78 | `sw_bpm_instance_intervention` 实例干预审计 |
| V79 | `sw_bpm_handover(_item)` 交接批次与明细 |
| V80（openapi V1→V80 顺延全局命名空间） | `sw_openapi_app/nonce/idempotency/callback_log` |

## 4. 实际验证（原始结果，证据文件见 `receipts/evidence/i4-01/`）

- **I4 新增测试 20/20 全绿**：
  - `I4DynamicParallelFlowableTest` 5/5（隔离 Flowable 真实发布/发起：冻结候选断言、同负责人去重 3/4→1 分支、ALL 正向汇聚零负向结算、VETO 单次结算+第二分支不可再办、空集合 BLOCK/显式 PROCEED、失效部门与缺负责人 BLOCK/显式 SKIP 逐条记录原因、超上限 DYNAMIC_BRANCH_LIMIT_EXCEEDED）。
  - `DynamicBranchPortTest` 3/3（同负责人合并 dept_ids、无效对象 CANCELED 记录原因、冻结幂等不重算、closeRemaining 不改写已终态分支）。
  - `BpmProcessTemplateServiceTest` 3/3（越部门 get/copy FORBIDDEN、停用拒复制、复制走正式定义链+溯源登记+模板零改写）。
  - `BpmBatchServiceTest` 2/2（逐项成功/2308 意见缺失/403 无权独立呈现、意见表单字段逐项透传）。
  - `BpmHandoverServiceTest` 4/4（范围迁移+办理人已变化 FAILED、重试零重复、同用户/无效目标拒绝、代理规则仅显式随迁）。
  - `OpenApiServiceTest` 3/3（错误签名/超时窗/nonce 重放/越 scope 逐项拒绝、幂等键重复发起 idempotentReplay 不二次提交、跨租户状态查询 PROCESS_NOT_VISIBLE）。
- **后端全量门禁**：`mvn test -fae` 全 reactor——全部模块 SUCCESS，仅两处既有/环境事实：
  1. IoT `JavaSubprocessSandboxTest` 6 例失败——与 I3 锁定基线 `f7101c8` 同机同失败，非回归（knowledge 已登记）。
  2. Agent `AgentGraphDefServiceImplTest.pageDefs_shouldPaginateAndStripLargeField` 1 例排序不稳定，单模块复跑 13/13 全绿；与 I4 改动无代码路径交集。
  - Flyway 全链测试随 I4 新迁移更新后 H2 `15/15`、PostgreSQL（embedded zonky）`12/12` 全绿（终点版本 V80）。
- **前端四连**（`NODE_OPTIONS=--max-old-space-size=2048`）：typecheck exit 0；lint 0 errors（--fix 后）；vitest `128 passed + 1 skipped 文件 / 1183 passed + 3 skipped`（新增 TemplateCenter 3、BatchApproval 2）；build exit 0（✓ built）。
- **迁移链**：bootstrap `FlywayFullChainH2Test` 与 `FlywayFullChainPostgresTest` 计数断言按 I4 新增 5 条更新（H2 75→80、PG 74→79；升级链同步修正），全绿。

## 5. 验收标准逐项对照（十二项）

| # | 标准 | 状态 | 依据与缺口 |
|---|---|---|---|
| 1 | 动态并行冻结/汇聚/异常确定行为 | **行为证据达成（引擎级）** | 隔离 Flowable 真实执行覆盖冻结/去重/汇聚/单次结算/空/缺负责人/失效/超上限/SKIP 记录原因；「中途改表单不改写冻结」由冻结幂等+closeRemaining 语义保障并经端口单测覆盖；未做 PC 页面全链人肉验证 |
| 2 | 静态条件分支既有行为不回归 | **保持（未触碰）** | 本轮未改 `BpmBranchConditionEvaluator`/translator；全量回归无 bpm 相关失败 |
| 3 | 模板分级授权/复制/零改写 | **行为证据达成（服务级）** | 3/3 单测覆盖正向+负向；页面已交付，未做浏览器肉眼验收 |
| 4 | 七类检索+干预+审计；无权拒绝 | **服务级达成** | 检索/干预/审计实现+权限注解；无权拒绝依赖 `@PreAuthorize`+DataScope，未单独做越权行为测试（缺口 G1） |
| 5 | 分析真实实例计算/口径可复算/越权拒绝 | **部分覆盖** | 聚合口径实现并在汇总与明细共用 scope；分位插值可复算；未以真实实例集复算比对（缺口 G1） |
| 6 | 批量审批逐项一致性 | **行为证据达成（服务级）** | 2/2 单测；与实例/动作记录的一致性依赖单任务链既有 I3 验收 |
| 7 | 交接迁移/代理显式/零改写/重试零重复 | **行为证据达成（服务级）** | 4/4 单测；未做真实多用户浏览器场景（缺口 G2） |
| 8 | 外部应用真实 HTTP 发起/查询/回调 | **部分覆盖** | 签名/防重放/幂等/越权/租户边界有单测；真实本机 HTTP 对端（发起→查询→签名回调→重试→去重）端到端未执行（缺口 G3，按裁决 2 需真实 HTTP 对端证据） |
| 9 | 多身份工作台同一对象零串读 | **部分覆盖** | 统一工作台聚合交付，列表走服务端身份；跨用户/租户零串读依赖既有对象权限（I1—I3 锁定）；未做七身份页面级验证（缺口 G2） |
| 10 | PC 与移动端同对象同权限 | **部分覆盖** | `MobileWorkspace` 真实交互（命令链办理/意见），同一 API；未做 PC/H5 双端对照肉眼验收（缺口 G2） |
| 11 | 迁移 H2/PG 同一身份兼容 | **达成** | V76—V80 双份逐字一致；FlywayFullChainH2/Postgres 全绿 |
| 12 | 工程门禁+行为证据绑定候选 | **部分达成** | 两仓门禁全绿（除登记的 IoT 6 例环境事实）；候选 SHA 未标注（未做 Git 提交，见 §7）；部分行为证据为服务级/引擎级隔离证据而非全链页面证据 |

## 6. 与方向的偏差

1. 统一工作台以新页面 `WorkflowCenter` 并存交付，未把草稿/消息入口扩展进 P54 `WorkspaceHome` 组件注册表——P54 布局行为已锁定，扩展需改 `WorkspaceComponentKey` 契约与既有回归；请规划裁决是否在 I4 内扩展或留待终态前增量。
2. openapi 迁移最终编号为 V80（原拟 openapi 独立 V1 与主库 V1 冲突，全局版本空间顺延）。
3. Flyway 全链测试的计数/升级链断言随新迁移同步更新（改动仅换计数与位置，未弱化断言）。

## 7. 未完成内容、风险与缺口

- **G1**：监控/分析的无权身份越权拒绝与真实实例集复算，尚无独立行为测试。
- **G2**：七身份工作台、PC/H5 双端对照、模板/监控页面肉眼验收未执行（浏览器可操作，属可补证项）。
- **G3**：本机真实 HTTP 对端的开放接口端到端（发起→查询→签名回调→失败重试→去重）未执行。
- 未执行 Git 提交（方向未显式授权提交）；候选 SHA 待提交后回填。
- H2 `H7TenantIsolationIntegrationTest` 因本机 5432 PostgreSQL 未运行而 ERROR（`Connection to localhost:5432 refused`），为环境事实非本轮回归，需本机 PG 运行时补跑。

## 8. Git diff 摘要

后端（Smart-WorkFlow-aPaaS-server）：新增 21 个 Java 文件 + 5 对迁移（H2/PG）+ 1 个 openapi 测试；修改 `BpmErrorCode`（+3 码）、`BpmTaskFacade`（+3 方法）、`BpmRuntimeFacade`（+1 方法）及两实现、`ApprovalLifecycleServiceImpl`（+dynamicBranchPort 注入与 closeRemaining）、`BpmProcessDef(+Service+Impl)`（溯源）、`BpmProcessDefServiceImpl`、application.yml（flyway locations + permit-urls）、`FlywayFullChain*Test` 计数、openapi-biz pom（form-api/bpm-api/hutool/test 依赖）。
前端（Smart-WorkFlow-aPaaS-Web）：新增 `api/i4.ts`、7 个视图、2 个 spec；修改 `router/index.ts`、`foundation/mock/handlers.ts`（i4 段）。
工作区：`knowledge/current-status.md` 前置同步；本回执与证据目录。

## 9. 终态

自验通过（含 §5 如实标注的 G1—G3 缺口与偏差），提交规划验收。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-01.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i4-01/surefire/com.sw.ck.bpm.engine.integration.I4DynamicParallelFlowableTest.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-01/surefire/com.sw.ck.openapi.biz.service.OpenApiServiceTest.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-01/vitest/frontend-gates-summary.md"],"feature_status":"VERIFYING","work_items":[{"id":"S1-dynamic-parallel","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成并通过隔离 Flowable 行为测试 5/5，待规划验收"},{"id":"S2-template-center","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成并通过服务级测试 3/3，待规划验收"},{"id":"S3-monitor-analytics","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已交付（检索/干预审计/分析），越权行为测试归入 G1 待补证"},{"id":"S4-openapi","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"签名/防重放/幂等/租户边界测试 3/3；真实 HTTP 对端端到端归入 G3 待补证"},{"id":"S5-batch-approval","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"逐项结果行为测试 2/2，待规划验收"},{"id":"S6-handover","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"迁移/重试/代理显式随迁测试 4/4，待规划验收"},{"id":"S7-workbench-mobile","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"前端四连全绿；双端肉眼验收归入 G2 待补证"},{"id":"G1-analytics-authz-proof","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"待规划验收给出越权拒绝/真实实例复算的补证口径后执行"},{"id":"G2-multi-identity-ui-proof","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"待规划确认浏览器补证范围后执行（浏览器可操作）"},{"id":"G3-openapi-http-peer-proof","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"待规划确认本机 HTTP 对端场景后执行"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 对 stage-i4-v0.0.3-oa-iteration-01 回执功能级验收并裁决 G1—G3 补证口径","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i4-v0.0.3-iter01-2026-09-12-backend20tests-green-frontend-1183-green","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server(sw-bpm-engine/sw-bpm-process/sw-biz-openapi)","Smart-WorkFlow-aPaaS-Web(modules/workflow/api+views+router+mock)","knowledge/current-status.md"],"tool_actions":["mvn compile/test 全 reactor","mvn 单模块测试 I4 六套","FlywayFullChainH2/Postgres","pnpm typecheck/lint/test/build"],"new_evidence":["I4 新增测试 20/20 全绿","Flyway 全链 H2 15/15、PG 12/12（终点 V80）","前端 vitest 1183 passed + 3 skipped，四连 exit 0"],"closed_work_items":["S1-dynamic-parallel","S2-template-center","S3-monitor-analytics","S4-openapi","S5-batch-approval","S6-handover","S7-workbench-mobile"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"I4 新增测试 20/20（engine 5 + process 12 + openapi 3）；FlywayFullChainH2 15/15、FlywayFullChainPostgres 12/12"},{"tool":"mvn","outcome":"FAILED","detail":"全 reactor 仅 IoT JavaSubprocessSandboxTest 6 例（I3 锁定基线同机同失败非回归）与 Agent 排序不稳定 1 例（单跑 13/13），均与 I4 改动无代码路径交集，已如实登记"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"typecheck/lint/test/build exit 0；vitest 1183 passed + 3 skipped"}],"browser_status":"OPERABLE"}
