# 应用中心续办执行回执 03（G2 权限收尾）

2026-10-16｜Executor｜L｜续办指令 `planning-execution-prompt-application-center-02.md`（Owner 2026-10-16 明确授权，同 G2 轮数延续）｜状态：待规划复核

本轮为 G2 剩余入口的核实与最小验证。**核实结论：三类剩余入口均无应用范围旁路——导入/导出已经由 execution-02 修复的公共守卫路径覆盖，模板按指令口径属结构披露，ext 查询为独立租户隔离数据面，`recordOwnerUserId` 归属通道仅服务端内部命令链可达。本轮零生产代码变更、零 Web 变更、零迁移变更**；交付为行为证据（定向测试 + 模块门禁）。未新增 P 编号、未增加功能数、未写 PASSED/COMPLETED。

---

## 1. 逐入口核实结论（先核实调用链，后给行为结果）

### 1.1 `/form/data/{formKey}/template|import|export`（FormImportExportController）

| 入口 | 权限注解 | 实际调用链 | 应用范围约束位置 | 核实结论 |
|---|---|---|---|---|
| `GET /{formKey}/template` | `form:data:template` | `FormImportExportService.generateTemplate` | 无（按指令口径处理） | 仅从 definition 生成表头两行（字段显示名+映射标识），**零记录数据**；非数据出口，按既有模板权限口径，不新增闸门（行为证据：范围内/范围外模板均仅 2 行，测试 1/2） |
| `POST /{formKey}/import` | `form:data:import` | `FormImportExportService.importData` → `FormSubmitService.submitForm(formKey, rowData, null, null, null)`（第 9 参 `recordOwnerUserId`=null） | `FormSubmitService` 内闸门：`appAccessGuard.requireNewBusiness`（`FormSubmitService.java` 约 L375，归属人为空才判定），拒绝发生在写入前；任一行失败整批 `setRollbackOnly` | 已覆盖。范围外/空集合/停用导入 = 整批回滚零落库（测试 2/3/4）；跨租户连模板生成都不可达（`FORM_NOT_FOUND`，测试 4） |
| `POST /{formKey}/export` | `form:data:export` | `FormImportExportService.exportData` → `FormDataQueryService.queryFormData(formKey, req, scopeFilter, 1000)` → `doQueryFormData` | `doQueryFormData` Step2 闸门 `requireNewBusiness`（`FormDataQueryService.java` L187-190）+ DataScope 行范围强制（L229-233） | 已覆盖。范围外/停用/空集导出拒绝、无文件返回（测试 2/3/4）；非超管 SELF 导出仅本人行、ALL 用户全量（测试 5） |

### 1.2 `/form/ext/query/{queryKey}`（FormExtDataController）

- 权限：`form:design or form:data:query`（服务端，非前端隐藏）。
- 数据面核实：契约存 `sw_form_ext_query`（MyBatis-Plus + 租户拦截器），SQL/连接串仅存服务端；执行委托 `ExtDatasourceQueryPort` → `FormExtDatasourceQueryAdapter` → bpm-engine `SqlExecutor`（**外部数据源独立连接池、SELECT-only 校验、maxRows/超时、成功/失败审计**；数据源实体 `ExternalDatasource extends BaseEntity` 主库租户隔离）。
- 结论：ext 查询读取的是**外部数据源数据，不承载应用绑定表单的业务记录**，应用范围闸门结构性不适用；其可达性由「租户隔离 + 契约启用 + 服务端 SQL + 只读行限 + 审计」约束，无通向受限表单数据的旁路。行为证据（测试 6）：本租户启用契约可执行且输出列被契约 schema 钳制；契约停用 → `1213 EXT_QUERY_DISABLED`；跨租户同 queryKey → `1212 EXT_QUERY_NOT_FOUND`（租户列隔离）。

### 1.3 `recordOwnerUserId` 派发提交与纯系统发起通道

- HTTP 面：唯一提交入口 `FormSubmitController` 调 5 参 `submitForm`（`FormSubmitController.java` L48），**请求体不含也不透传归属人**；`recordOwnerUserId` 非空仅在 `FormDataSubmitFacade.submitOnBehalfOf`（`FormDataSubmitFacadeImpl` L48-53）。
- 唯一调用方：`OrchActionStartCommandHandler`（bpm-process，ORCH_ACTION_START 命令消费）。归属人由服务端从目标流程已发布图首节点参与人字段解析（`resolveRecordOwnerUserId`），解析不可得回退原 create_by 语义。
- 命令入队核实：ORCH_ACTION_START 仅由 `TriggerExecutionService`（运行中流程的编排触发，调用方事务内、冻结意图行）与 `ActionRefRecoveryService`（崩溃恢复重投）入队；`BpmCommandController` 仅暴露任务动作受理与命令查询，无命令注入端点。
- 身份链：`CommandDispatcher` 消费时以信封 tenantId/initiatorId 还原并复核登录上下文（L211-286）；纯系统定时发起 `ScheduledFlowStartPortImpl.requireIdentity` 强制身份、tenantId=任务配置租户、initiatorId=配置人，jobId+fireTime 幂等，无 HTTP 可达路径。
- 结论：普通请求无法伪造归属参数获得系统豁免；受控归属通道行为按契约锁定（测试 7：同一范围外上下文，普通提交 `1700` 被拒，`submitOnBehalfOf` 落库且 `create_by=归属人 99`）。

## 2. 与完成条件逐项对照

| 指令完成条件 | 结果 | 证据 |
|---|---|---|
| 合法用户 template/import/export 正常 | 通过（测试 1：模板 2 行结构、导入 2 行、导出 2 行） | evidence/execution-03/ |
| 范围外/空集合/停用/跨租户不能读受限数据、导入新记录、发起新实例 | 通过（测试 2/3/4；导入拒绝=整批回滚，导出拒绝=无文件；发起新实例复用 execution-02 G2 B/G 组锁定结果，本轮未重复） | 同上 |
| 导入拒绝后零写入 | 通过（物理行数回读不变，测试 2/3） | 同上 |
| 导出/扩展查询拒绝后无受限数据返回 | 通过（导出抛拒绝异常无文件；ext 契约停用/跨租户即拒，输出限 schema） | 同上 |
| 模板按实际披露处理、不作数据导出 | 通过（模板仅字段结构零记录行，范围内/外一致，测试 1/2） | 同上 |
| 应用可见不扩大行范围；非超管受限范围导出正反向对照 | 通过（SELF 导出 1 行本人 / ALL 导出 2 行，测试 5） | 同上 |
| 管理权不自动授予数据读取 | 无新增旁路（本轮零实现变更，沿用 execution-02 H 组锁定语义） | execution-02 |
| 系统通道：真实调用身份、租户与调用边界核实；普通请求不能伪造豁免 | 通过（§1.3 调用链核实 + 测试 7） | 本回执 §1.3 |
| 历史本人记录、流程参与者合法访问、旧待办续办保持 | 本轮零实现变更、未触及这些路径，按指令不重复复验（G2 已覆盖子集 F/G 组保持锁定） | execution-02 |

## 3. 实际命令与结果（原始输出位置）

- `MAVEN_OPTS="-Xmx2g" mvn -q test -pl sw-biz/sw-biz-form/sw-biz-form-biz -Dtest=FormG2EntryConsistencyTest` → **7/0/0/0**（原始报告：`evidence/execution-03/com.sw.ck.form.service.FormG2EntryConsistencyTest.txt`）
- `MAVEN_OPTS="-Xmx2g" mvn -q test -pl sw-biz/sw-biz-form/sw-biz-form-biz` → **BUILD SUCCESS，模块合计 209/0/0/0**（上轮基线 202 + 新增 7，零回归；摘要：`evidence/execution-03/module-test-summary.txt`。输出中的 ERROR 行均为 DynamicTableSqlGate/DeleteService 等负例测试的预期日志，非失败）
- 判级与依据：L（权限类，应用中心 G2 续办，沿用既有功能闭环）；无升级事由。

## 4. 与指令的偏差与限制（如实）

1. **导入拒绝是行级结果而非异常**：`importData` 逐行收集错误并整批回滚，返回 `ImportResult(errorCount>0, successCount=0)`；拒绝语义与零写入经结果断言证明，不影响完成条件。
2. **跨租户导出错误码为 `1000`（表单不存在族）而非 `1500`**：`exportData` 走 `loadFormContext`（模块内码 1000），与查询接口 `1500` 不同出口但同为"按不存在拒绝"；行为满足完成条件，未统一错误码（零生产代码变更原则）。
3. ext 查询为外部数据面，本轮以"租户隔离 + 停用即拒 + schema 钳制 + 只读引擎链核实"作为其一致性口径；未（也不需要）对 ext 契约施加应用范围判定——指令明确不把用户应用范围机械施加于全部系统/受控动作。
4. 未执行：发布分支合并、tag/Release、部署、UAT 变更；未触碰 V94 旧库；无服务启动、无浏览器会话（本轮无 UI 主张，全部为服务层行为证据）；未停止用户既有服务。

## 5. Git 摘要

| 仓 | 分支 | 提交 | 说明 |
|---|---|---|---|
| Smart-WorkFlow-aPaaS-server | `feature/application-center` | `68fe73f` | 新增 `FormG2EntryConsistencyTest`（744 行测试，零生产代码变更） |
| Smart-WorkFlow（根） | `develop-sw` | 见本回执所在批次提交 | 本回执、evidence 索引（本机留存）、knowledge/memory 同步、Planner 02 审查与提示 02 入库 |
| Smart-WorkFlow-aPaaS-Web | — | 无变更 | 本轮零 Web 变更 |

推送后回读：Server `68fe73f` = `origin/feature/application-center`（一致）。

## 6. 总进度与唯一下一动作

- 总 4 阶段：现状探索完成、方向定稿完成、**实施与验收进行中（G2 权限收尾——执行侧完成，待规划复核）**、终态同步未开始（**2/1/1**）。
- 功能状态 **VERIFYING**；48/90/ADV64/57 与 P62 延期/OFF 保持；不晋级正式基线、不核销 P 编号。
- **唯一下一动作：Planner 复核 execution-03（三类入口核实结论与行为证据）**。
