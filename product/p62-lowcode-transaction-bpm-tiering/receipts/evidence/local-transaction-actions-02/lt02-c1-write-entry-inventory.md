# LT02 补证：C1 可达写入口清单（可达/拒绝/不支持）与声明边界实跑

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查记录 LT02「缺证据：导入/API/批处理/脚本/Agent/流程入口以源码位置、白名单和委托关系宣称覆盖」。
方法：穷尽枚举动态宽表写入路径（唯一受控入口 `DynamicTableSql` 的全部生产调用点与上层入口），对**剩余入口**做真实调用；对**无写入能力**的入口给出运行能力限制依据，不重复每条底层全套。行为证据取自真实 PostgreSQL 行为测试（`P62TxnActionPgBehaviourTest`，Server `5f9e066` 树实跑 11/0/0/0）与模块 H2 回归（`TxnActionFlowH2Test` 7/0/0/0）。

## 1. 唯一受控写入入口与结构约束

`sw-biz/sw-biz-form/sw-biz-form-biz/.../form/dynamic/DynamicTableSql.java`

- 写路径唯一执行出口：`update(...)`（L235，INSERT/UPDATE/软删）；结构写入 `ddl(...)`（L245，只允许 `CREATE TABLE`/`ALTER TABLE`，禁多语句/注释）；读/锁：`query`/`queryForLong`/`queryForInt`/`tryLockLiveRow`/`tryLockLiveRows`。
- 语句契约断言 `assertContract`（L384）：动态宽表语句必须同时含 `"deleted"` 与 `"tenant_id"`、占位符数量与参数一致、单表约束（禁跨动态表）；标识符经 `quote`（L170）字符集白名单。
- 全仓（排除 test）只有 `sw-biz-form-biz` 引用该类；`DynamicTableSqlGateTest`（模块测试，G1/G6）机械守护「dynamic 包外不得直接持有 JdbcTemplate」，G6 下限 40 个调用点。除 `information_schema` 存在性只读查询外，**不存在**其它直接拼 SQL 写动态宽表的位置（无 `${table}` 式动态 SQL、无 MyBatis 动态表 `@Insert/@Update`）。

## 2. 写入口清单：可达 → 白名单/委托 → 闸门 → 真实证据

| # | 用户入口（路由 / 权限） | 委托链（文件:行） | 写动态宽表 | C1 闸门 | 真实调用证据 |
|---|---|---|---|---|---|
| 1 | `POST /api/form/data/{formKey}`（`form:data:submit`） | `FormSubmitController.java:40` → `FormSubmitService.submitForm`（INSERT L420 / 子表 L494） | 是 | **是**（`C1PolicyService.assertBulkWriteAllowed`，`FormSubmitService.java:368`） | `[P62-EV] t02.c1 submit/update/delete=rejected` |
| 2 | `PUT /api/form/data/{formKey}/{recordId}`（`form:data:edit`） | `FormDataController.java:64` → `FormDataUpdateService.updateRecord`（UPDATE L312 / 子表 L436/489/513） | 是 | **是**（`:185`） | 同上 |
| 3 | `DELETE /api/form/data/{formKey}/{recordId}`（`form:data:delete`） | `FormDataDeleteController.java:35` → `FormDataDeleteService.deleteRecord`（软删 L145 / 级联 L395） | 是 | **是**（`assertDeleteAllowed`，`:130`） | 同上 |
| 4 | **批量导入** `POST /api/form/data/{formKey}/import`（`form:data:import`，≤500 行、整批原子） | `FormImportExportController.java:83` → `FormImportExportService.importData`（`:345`，`transactionTemplate` L366）→ 逐行 `formSubmitService.submitForm`（`:385`） | 是 | **是**（经 #1 同一底层闸门） | **本轮新增**：受保护表单导入 → `successCount=0 / errorCount=2`（行级错误反馈含 C1 原因）、表行数 0（`[P62-EV] lt02.import protected=rejected/zero-write`）；未保护表单同一导入 2 行成功落库 `plain=2-rows-committed` |
| 5 | **BPM 草稿提交** `POST /api/workflow/drafts/{id}/submit`（登录 + 本人草稿；P0 需 `workflow:p0:dispatch`） | `BpmDraftController.java:169` → `DraftSubmitService` 入队（`:130`）→ `CommandDispatcher.poll*`（`:107/123/132`）→ `DraftSubmitCommandHandler.java:78` → `FormDataSubmitFacadeImpl`（`:29/35/43`）→ `submitForm` | 是 | **是**（经同一 Facade→`submitForm`；`DraftSubmitCommandHandler` 无自有 SQL） | 委托关系证据（源码链）+ #1 底层闸门证据 |
| 6 | **OpenAPI 发起** `POST /api/openapi/v1/processes`（签名鉴权，permit-url） | `OpenApiProcessController.java:52` → `OpenApiProcessService.java:50/60` `submitFacade.submit` → `FormDataSubmitFacadeImpl` → `submitForm` | 是 | **是**（同上） | 同上 |
| 7 | **受控事务动作** `POST /api/form/action/{id}/invoke`（`form:action:invoke`） | `TxnActionController.java:115` → `TxnActionExecutor.invoke` → `TxnActionTxOperations`（RESERVE L173 / 结算 L293 / ADJUST L343） | 是 | 不经 C1 断言（**设计通道**：受保护字段的指定写入者；见 §5 观察项） | `[P62-EV] t01/t04/lt04` 全套 |
| 8 | 预占过期释放 `@Scheduled`（`TxnReservationExpiryJob.sweep`，60s，逐行还原租户） | `TxnReservationExpiryJob.java:48/82` → `txOps.settleExpired`（L401） | 是 | 同上（系统身份，无登录用户） | `[P62-EV] t04.race … sweepSettled=true` |
| 9 | 表单结构发布 `POST /api/form/def/{id}/publish`、`/publish-version`（`form:design:publish`） | `FormDefinitionController.java:173/182` → `FormDefServiceImpl.publish:264` / `publishNewVersion:364` → `DynamicTableManager`（`CREATE TABLE` L192 / `ALTER TABLE ADD COLUMN` L244） | 结构（不写数据行） | 不适用（DDL 无行级策略语义） | 迁移/发布链测试；无 `DROP TABLE` |

## 3. 无写入能力（不支持）入口的运行能力依据

| 入口 | 结论 | 运行能力限制依据 |
|---|---|---|
| IoT 脚本（GraalJS） | **无写入能力** | 沙箱 `HostAccess.NONE`、禁宿主类加载（`GraalJsRunner.java:50/128`）；脚本 API 白名单固定为 `fun_publish/fun_getProperty/fun_setProperty/fun_emitEvent/fun_invokeAction/fun_startProcess/fun_log`（`IotScriptApi.java:15—61`），无 JDBC/SQL 能力；`fun_startProcess` 只写 `sw_iot_process_trigger` 并发事件（`ScriptHostFunctions.java:269`）。`sw-basic-iot` 生产代码对 `DynamicTableSql`/`JdbcTemplate`/`sw_form_` 引用为 0 |
| Agent 可配置工具 | **无内置 SQL/直写能力**；外部 HTTP 工具经同一 API 闸门 | 内部工具为 DB 配置反射调用，约定签名 `String execute(String)`（`AgentToolCallbackFactory.java:112/190`），全仓无满足签名的 Bean；外部工具为白名单 URL 的 GET/POST/PUT（`:150`）——若配置为表单接口，等价于以工具身份调用 #1/#2/#3 HTTP 入口，**仍受 C1 闸门与权限约束**，无绕过 SQL 通道 |
| 批处理/批量审批 | **不写动态宽表** | 表单模块无批量数据行接口（唯一批量写=#4 导入）；BPM 批量审批 `BpmOpsController.java:51` → `BpmBatchServiceImpl` → `TaskActionService`（`:413—445` 只写审批记录）；定时任务 FLOW `SwJobBean.executeFlow:224` 只入队 `SCHEDULED_FLOW_START`，消费端 `ScheduledFlowCommandHandler.java:80` 仅只读校验 |
| 流程节点（审批/委托） | **不写动态宽表** | `sw-bpm` 对表单仅经 `form-api` 读取（`ApprovalTaskListener.java:179`、`BpmBranchConditionEvaluator.java:107`、`NodeDelegateSupport.java:67`）；BPM 侧唯一表单写入通道是 #5 的 Facade→`submitForm` |
| 外部数据源预览 | 只读 | `FormExtDataController.java:54` → `ExtDatasourceQueryPort` → `SqlExecutor.java:135—171` 只允许单条 SELECT；`POST /form/ext/query-contract`（`:40`）只写元数据表 `sw_form_ext_query` |

## 4. 剩余声明边界：业务键隔离与精度/负边界（本轮实跑）

声明模型（`TxnActionConfig`）：`balanceField`、`reservedField`、`keyFields`（声明业务键）、`quantityScale`（0—6，默认 3，**超出即拒绝不静默舍入**）、`expiresInSeconds`、`nonNegativeAvailable`。

| 声明项 | 真实结果（`P62TxnActionPgBehaviourTest`，真实 PostgreSQL） |
|---|---|
| 业务键隔离 | 键值与目标记录一致 → 成功，且**预占凭据冻结键值快照**（`biz_keys_json` 含 `material=LT02-KEY-A`）；键值不匹配 → `REJECTED`（`ACTION_FIELD_BINDING_INVALID`，无副作用）；未声明键（`warehouse`）→ `REJECTED`；不同键值记录互不影响（A 记录预占 5、B 记录预占 7，各自独立）。`[P62-EV] lt02.keys …` |
| 精度边界 | 声明 3 位：`1.234` 可受理、`1.2345` 明确拒绝（错误含「精度」，`ACTION_QUANTITY_INVALID`）、尾随零 `2.000` 可受理，余额=预占合计 `1.234+2.000=3.234`（**未发生静默舍入**）；声明 6 位：`0.000001` 可受理、`0.0000001` 拒绝；数量 `0`/负数拒绝；`100000000000000`（超可受理范围）拒绝 |
| 合法负边界 | `nonNegativeAvailable=true` 时，调整到「可用=0」**可受理（边界含等号）**；再减 `0.001` → `REJECTED`（`ACTION_INSUFFICIENT_AVAILABLE`）。`[P62-EV] lt02.precision … adjust=zero-boundary-ok/below-rejected` |
| 非法声明（模型不支持） | 模型未声明键（`remoteSideEffect`/`humanWait`/`transactionPropagation`、C1 的 `remoteApproval`）被**收集而非静默丢弃**；保存入口明确拒绝（错误含键名）；存量配置含未声明键时发布入口给出结构化错误 `config.remoteSideEffect`。见 `lt04-t05-frozen-and-declaration.md` |

## 5. 观察项与边界（如实记录，不扩大范围）

1. **C1 钩子为可选注入**：三个写服务（`FormSubmitService`、`FormDataUpdateService`、`FormDataDeleteService`）对 `C1PolicyService` 使用 setter `@Autowired(required=false)`（便于模块单测以 `new` 构造）。真实 Spring 上下文（dev/prod 启动、PG/H2 行为测试）中 bean 必存在，T02 已用真实拒绝证明闸门生效；若未来出现不含该 bean 的新上下文，钩子会静默不生效——**记为观察项**，本轮不改注入方式（改为必需注入会破坏既有手工构造的模块测试装配，超出本阶段修复边界）。
2. **事务动作路径不经 C1 断言**：这是 ADR-P62-001 的设计（受保护字段只能经受控动作写入）；其一致性证据在 `lt04-t05-frozen-and-declaration.md` 与 T01/T04 行为证据。
3. **DDL 不适用行级策略**：表单发布只做 `CREATE TABLE`/`ALTER TABLE ADD COLUMN` 增量，无 `DROP TABLE` 能力（`DynamicTableManager`）。
4. 未在本阶段引入新的写入入口；`FormSubmittedEvent` 内存监听已退役，form 模块无 `@EventListener`/MQ 写表路径。
