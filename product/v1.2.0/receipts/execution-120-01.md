# 1.2.0 第一批执行回执（execution-120-01）

日期：2026-11-21｜执行（Executor）｜覆盖：§3 四问回答 + E3-1 + E3-2 + E1-7 迁移｜自验通过，待规划验收

## 1. 概要与 Git 事实

- 两仓自 `origin/develop` 建 `feature/1.2.0`（起点：Server `14891b02`、Web `4893dbb`，均与远端一致后开分支）。
- Server 提交：`329c1f89`（E3-2 恢复 I5 用例）、`f161c113`（E1-7 迁移）；远端回读 `feature/1.2.0 = f161c113d7a0`，一致。
- Web 提交：`aa99cc8`（E3-1 P74 修复）；远端回读 `feature/1.2.0 = aa99cc8bd502`，一致。
- Web 工作树遗留 `src/types/components.d.ts` 本地自动生成漂移（unplugin-vue-components 扫描差异），未纳入提交；无其他未提交改动。Server 工作树干净。
- 工作区仓（本回执）单独提交，不含两 coding 仓指针之外的动作。

## 2. §3 开工四问回答

### 问题 1：含人工节点的 Graph 被流程调用

**现状行为**（已亲核源码）：同步入口 `AgentGraphExecutionServiceImpl.execute()`（`sw-basic/sw-basic-agent/.../service/impl/AgentGraphExecutionServiceImpl.java:276-284`）遇到人工节点时，解释器抛 `HumanPauseException` 并携带可序列化 `PauseState`；execute() 检测到 `pauseState != null` 后直接 `markExecutionFailed(HUMAN_PAUSE)`，返回 `success=false`「运行到人工节点，需通过异步执行与运行页处理」。即**同步调用含人工节点的图 = 立即失败、不建待办、不可恢复**，不是挂起等待。人工等待只在异步受理路径成立：`AgentGraphExecutionLifecycleServiceImpl.submit()` 落 `WAITING_HUMAN` 受理行 + `AgentGraphHumanTask` 待办行 + `pause_state_json` 持久化，等待期间工作线程归还线程池不占用；恢复靠人工提交接口（`AgentGraphExecutionLifecycleController.java:70-78`）或 30s 超时扫描（`AgentHumanTaskSchedulingConfig.java:41-49`）。

**方案 A：发布时拒绝**（E1-5 当前口径）。代价：含人工节点的 Graph 完全不能被流程节点引用，人工环节必须改用 BPM 自身的人工节点承载。收益：同步语义完整、无新状态机、无对账负担。

**方案 B：流程节点挂起 + 终态回调继续**。流程服务节点落「等待 Graph」持久意图后实例暂停推进；新增 `AgentGraphExecutionTerminalEvent` 监听器（进程内 Spring 事件，仅异步路径在 `finish()` 后发布，`AgentGraphExecutionLifecycleServiceImpl.java:805-820`；IoT 桥 `AgentExecutionOutcomeListener` 是现成消费样例）按 executionId 唤醒流程。代价：需要 BPM 侧新的挂起/恢复语义、服务重启对账、取消联动（流程取消需级联取消 Graph 执行）、超时口径对齐（图级 `executionTimeoutSeconds` 默认 300s 只计运行窗口，不管等待时长）；等待期可能跨天。收益：长周期人工环节可编入 Graph。

**推荐**：1.2.0 按方向既定口径走方案 A（发布校验拒绝并写明原因）；方案 B 依赖面广（持久意图 + 对账 + 取消联动），建议作为独立方向另行立项评估，不并入本版。裁定前实施按 A 执行，不产生返工——A 的发布校验是 B 的子集。

### 问题 2：系统身份 + 指定租户

**有现成方式，可直接复用**。租户上下文唯一载体是 `LoginUserHolder`（ThreadLocal<LoginUser>，tenantId 即 `LoginUser.tenantId`），配套 MyBatis-Plus 租户行拦截器 fail-closed（`CommonTenantLineHandler.java:23-30`，租户缺失抛异常而非归零）。现成样例：

- **IoT 桥（最佳参照）**：事件携带 tenantId/configuredBy → `AgentGraphTriggerListener.java:65-79` 构造 `new LoginUser()` 还原租户 → `LoginUserHolder.set()/clear()` → `resolvePublishedGraphId`（租户拦截器自动过滤跨租户）→ `AgentGraphExecutionLifecycleService.submit()` 进程内 bean 直调（`:82-112`，幂等键 `iotag-{triggerId}`）；终态经 `AgentExecutionOutcomeListener` 回接。
- **定时任务范式**：`SwJobBean.java:124-131` 调度身份 `{tenantId=job.tenantId, userId=job.createBy, username="scheduler"}`；BPM 时限 `TaskDeadlineScheduler`、Notify/OpenAPI 恢复同构。
- 后台按租户执行前统一经 `TenantWorkAdmission.claim()`（行锁校验租户启用/未过期）。

**实施口径**：流程服务节点执行时构造 `{tenantId=实例租户, userId=0L(SYSTEM_OPERATOR_ID), username="bpm-agent-bridge"}`（不设 superAdmin，避免旁路租户过滤），该身份可访问本租户全部数据，与 IoT 桥同口径。Graph 内工具白名单（`AgentToolCallbackFactory.buildToolCallbacks(tenantId)`）与知识库向量检索（`PersistentKnowledgeVectorStore.requireTenantId()`）都吃这一个上下文，隔离自动成立。注意：`submit()` 强制非空 userId（`AgentGraphExecutionLifecycleServiceImpl.java:889-893`），0L 可过（IoT 桥直调路径只查非空、不回查用户表）。现有代码无统一系统身份工厂（各处手写构造），本批沿用 IoT 桥手写口径，不新增工厂。

### 问题 3：流程同步调用占用线程

引擎为嵌入式 **Flowable 7.1.0**，`flowable.async-executor-activate: false`（`sw-bootstrap/src/main/resources/application.yml:99-101`），全仓未定制 async 线程参数。流程推进线程有三类：

| 线程 | 默认上限 | 满了的表现 |
|---|---|---|
| Tomcat HTTP 请求线程（发起/办理主路径） | 200 | 请求挂起直至客户端超时；每请求还占 1 条 DB 连接（Druid max-active 口径 20），分钟级长调用会击穿 `ResourcePolicyServiceImpl` 的连接池预算模型 |
| `bpm-command-worker`（命令消费路径） | 固定 3（`sw.bpm.command.dispatch-workers:3`） | 无界排队 + 每轮批量 `future.get()` 串行等待（`CommandDispatcher.java:170-184`），3 线程被分钟级占用即全 BPM 命令处理停摆 |
| Flowable async executor | 未启用（开启则默认 8 线程/2048 有界队列） | 队列满 job 被 unacquire 反复重捞，吞吐封顶 8 |

Graph 侧自身执行在 agent 虚拟线程池（默认 4 worker/队列 64，`AgentGraphExecutionLifecycleServiceImpl.java:110-124`），容量满时 submit 拒绝。下批实施口径：节点内调用按 TXN_ACTION 先例走 REQUIRES_NEW 短事务（`TxnActionNodeDelegate.java:58-65`）避免长持主库连接；节点超时上限 ≤ 图级 `executionTimeoutSeconds`（1-3600s，默认 300s）。

### 问题 4：前端分页 total 同类问题

全仓排查（模式：`total +`、`+ total`、`total -`、`total +=`、`Math.ceil(...total`、直连 `el-pagination :total` 绑定）结论：

- **算术受害仅 1 处**：`src/modules/agent/views/ExecutionList.vue:331`（P74 本体，已修）。
- **同族受害 1 处**：`src/modules/system/views/SystemLogList.vue` 直连 `el-pagination :total` 未归一——字符串 total 触发 Element Plus `isAbsent`（typeof !== 'number'）判缺省，分页条静默消失（`ListPagination.vue:67-75` 注释记录的 V012-BUG-003 同根因），已修。
- 其余约 40 处 `total.value = result.total` 直传均经 `ListPagination` 内部 `Number()` 归一（无害）；`agent/utils/token.ts`、`MyInstances.vue:173`、`RoleList.vue:337`、`PostDelegateList.vue:112` 已显式归一（无害）。
- 类型层 `PageResult.total` 标注 `number` 与运行时字符串不符（类型谎言），全仓约 25 处 API 声明同构；本批不改类型（无行为收益、改动面大），在此登记，规划如需收敛可另行立项。

## 3. E3-1：P74 列表总数修复

**根因**：后端 `JacksonLongToStringConfig` 把 `PageResult.total`（Long）序列化为字符串；`ExecutionList.vue` 旧 289/303 行把字符串 total 赋给局部变量，331 行 `execTotal + debugTotal` 发生字符串拼接（`"10"+0="100"`），「共 N 条」与页数同错。

**修改**（Web `aa99cc8`，3 文件 +52/-3）：

| 文件 | 修改 |
|---|---|
| `src/modules/agent/views/ExecutionList.vue` | 289/303 行改为 `Number(...) \|\| 0` 归一（沿 `token.ts`/`RoleList.vue` 既有范本），加一行根因注释 |
| `src/modules/system/views/SystemLogList.vue` | 211 行 `total.value = Number(page.total) \|\| 0` + 注释（同族直连分页条消失问题） |
| `src/modules/agent/views/ExecutionList.spec.ts` | 新增 P74 回归用例：字符串 total `"10"+0 → 10`（number）、`"10"+"2" → 12`，断言值与类型 |

**验证**：`npx vitest run src/modules/agent/views/ExecutionList.spec.ts` → **27/27 通过**（含新用例）；三文件 eslint 干净；`npm run typecheck`（vue-tsc -b）通过。浏览器前后对照截图按方向 §5 属阶段 3 iso120 证据，本批未拍。

## 4. E3-2：恢复 I5SsoCipherRuntimeDiagTest

**修改**（Server `329c1f89`，1 文件 +102/-98）：`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/i5/I5SsoCipherRuntimeDiagTest.java` 整份恢复（原为全文件注释），javadoc 追加恢复说明（d53c7fb6 启动回归已由 583f1a38 修复）。类内容与注释前版本逐行一致，仅加说明段。

**验证**：`MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -am -Dtest=I5SsoCipherRuntimeDiagTest` →
`Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.sw.ck.bootstrap.i5.I5SsoCipherRuntimeDiagTest`，`BUILD SUCCESS`；诊断输出三行全过（agent bean 唯一、SSO 专属密钥往返 OK、空钥 fail-fast OK）。
**main CI 实际运行证据**（E3-2 验收要求的 run 号）待阶段 4 合并 main 后补，本批先交本地真实运行结果。

## 5. E1-7：V1.2.0 迁移（九库）

**设计**：`sw_agent_graph_execution_request` 加 4 列 + 2 索引：

| 列 | 类型 | 说明 |
|---|---|---|
| `business_source` | VARCHAR(32) | 来源 PROCESS / FORM / DIRECT；存量行 NULL，读侧按 DIRECT 展示 |
| `process_instance_id` | VARCHAR(64) | BPM 流程实例 ID（`BpmInstance.processInstanceId` 为 String，故用 VARCHAR 非 BIGINT） |
| `node_id` | VARCHAR(100) | 流程节点 activityId（与 `sw_agent_graph_human_task.node_id` 同宽） |
| `form_record_id` | BIGINT | 表单记录 ID |

索引：`idx_sw_agent_exec_req_biz_src (tenant_id, business_source)`（列表按来源筛选用）、`idx_sw_agent_exec_req_proc_inst (process_instance_id)`（实例详情反查用）。

**E2 菜单/权限种子**：`sys_menu` id=9116、parent_id=1（系统管理区，紧邻 SystemLog 9115）、name `SystemLogLevel`、title `日志等级`、path `system/log-level`、component `system/views/LogLevelList`、**独立权限点 `system:loglevel:manage`（查看与调整共用一点，对应 E2-3）**、sort 44。**默认不授任何角色**：超管经 `PermissionService.hasPermi` 短路（`sw-framework/sw-security/.../PermissionService.java:21-23`）默认可见可调，其他角色前端无菜单、后端 `@PreAuthorize` 拒绝，需菜单管理显式授权——与 E2-3「独立权限点（超管默认有）」字面一致。E2 页面本体（组件路径 `system/views/LogLevelList`、路由、LoggingSystem 接入）属下批 E2 实施，种子先行入库。

**文件清单**（10 个新 SQL）：

- 8 库版本化 `V1.2.0__graph_exec_business_link_and_loglevel_menu.sql`：postgresql、kingbase（与 PG 逐字节一致，测试契约）、opengauss、mysql、mariadb、h2（以上六库同文）、oracle（`VARCHAR2(n CHAR)` + `from dual` + hidden=0）、dm（oracle 去 CHAR 单位）——四列 + 两索引 + 菜单 INSERT（NOT EXISTS 幂等）。
- sqlserver：`V1.2.0__graph_exec_business_link_and_loglevel_menu.sql`（**真实增量**：仅四列 + 两索引，`[dbo].` + NVARCHAR + DATETIME2 方言）+ `R__1.2.0_log_level_menu.sql`（菜单种子放可重复脚本）。

**与方向的偏差 1（sqlserver 菜单种子位置）**：方向 §2 说种子「合并成一个 V1.2.0 迁移」。SQL Server 的用户/菜单基线在 `R__0.2.0_sqlserver_seed.sql`（可重复脚本），全新库版本化阶段父菜单尚未生成，版本化种子会被静默跳过——`R__1.0.0_audit_log_menu.sql` 头注释记录的 B1 实测教训。故 sqlserver 菜单沿该先例放 `R__1.2.0`，其余 8 库按方向合入 V1.2.0。若规划要求绝对单文件，需把 sqlserver 种子并入 R__0.2.0 基线并更新 `sqlserver.seed` 校验和清单，代价是改动已锁定基线，不建议。

**校验和清单**：未改任何 PG R__ 与 `R__0.2.0_sqlserver_seed.sql`，`pg-repeatable-checksums.properties` 无需更新（`SqlServerRepeatableSyncTest` 绿即证明）。

**断言更新**（13 个测试文件，`f161c113`）：迁移条数 32→33、终点 1.1.0→1.2.0、sqlserver 脚本数 33→35、032 升级新增 4→5 条、两个 legacy 演练 11→12 / 19→20。涉及：`migration/` 下 FlywayFullChainMySql/Oracle、FlywayUpgradeFrom032、Kingbase/DmOracle parity、SqlServerScriptStatic（35）；包外 FlywayFullChainH2/Postgres、I6G7UpgradeDrillH2、i6/I6G7bOldBaselineUpgradePostgres、ApplicationCenterLegacyUpgrade/UpgradeContinuity、multidb/SeedBaseMigration。`ApplicationCenterRecoveryDrillPostgresTest` 用动态计数（`newerThan020Count()`），自动适配无需改。

**验证**：`MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -am -Dtest="…（上列测试）"` → **68 run / 0 fail / 6 skip**，`BUILD SUCCESS`。含真实链路：zonky 内嵌 PostgreSQL 全链 33 条到 1.2.0（FlywayFullChainPostgresTest 13/13）、H2 全链 20/20、0.3.2 升级链 2/2（H2+PG 真实执行 V1.2.0 含菜单 INSERT）。跳过 6 = 全链 MySQL/Oracle（未配 `-Dmysql.url/-Doracle.url`，既有口径，阶段 3 iso120 多库证据补）、SeedBase（未配 seed.base.url）、FormKeyConstraint 库变体 3。**九库多库迁移结论按 P66 口径在阶段 3 iso120 补齐**，本批证据为 PG/H2 真实执行 + DM/Kingbase/SQLServer 静态 parity 门禁绿。

**待下批（随 E1-1~E1-4 接线）**：`AgentGraphExecutionRequest` 实体/Mapper 增四字段、`business_source` 常量、来源筛选查询、实例详情关联展示。本批仅迁移落库，不动实体（列未映射不报错，升级库无风险）。

## 6. 与验收标准逐项对照

| ID | 状态 | 说明 |
|---|---|---|
| §3 四问 | 已回答 | 见本回执 §2；问题 1 待规划裁定 |
| E3-1 | 代码完成，自验通过 | 修复 + 同族 1 处 + 回归用例；iso120 截图与「同类检查清单」清单见 §2 问题 4，阶段 3 拍对照图 |
| E3-2 | 本地通过 | main CI run 号待阶段 4 |
| E1-7 | 迁移完成 | 四列 + 种子 + 断言，九库；功能展示部分属 E1-1~E1-7 后续批次 |
| E1-1~E1-6、E1-8 | 未开始 | 下批实施（顺序按方向 §4：E1-1~E1-4 → E1-8 → E1-6；E1-5 按裁定） |
| E2 | 未开始（种子已入库） | 页面/接口/审计/防误操作下批 |
| E3-3 | 未开始 | 阶段 6 部署后执行 |

## 7. 功能计数建议（方向 §0）

knowledge 功能清单现值 58。建议 P67 计为第 **59** 个正式功能、P41 计为第 **60** 个（与方向规划默认一致）；P74（缺陷）、I5（用例恢复）、E3-3（数据修正）不计功能数。待规划裁决。

## 8. 阶段进度

七阶段：**已完成 1**（评估，方向即结论；本批补 §3 回答）；**进行中 1**（阶段 2 实施——E3-1/E3-2/E1-7 迁移已清，余 E1-1~E1-4、E1-8、E1-6、E2、E1-5 按裁定）；**未开始 5**（阶段 3 验收 iso120、4 合并、5 发版、6 部署与同步、7 结束）。下一批建议：E1-1~E1-4（流程侧接线）+ E1-8。

## 9. 问题与风险

- E1-5（问题 1）待规划裁定；裁定前发布校验拒绝含人工节点的 Graph，与方向一致。
- `business_source` 存量行为 NULL：IoT 桥触发的存量执行会显示为 DIRECT（来源枚举只有流程/表单/直接调用三种）。若规划希望区分 IoT 来源，需加枚举值并回填，请裁定。
- 全量 `mvn test` 与九库多库证据属阶段 3；本批未跑全量（Phase4 远程 PG 族既有环境问题不在本批范围）。
- 无偏离授权范围的改动；无未提交的授权内成果。

## 10. 自验结论

第一批交付物全部完成并通过本批适用机器门禁（vitest 27/27、eslint/typecheck 干净、I5 1/1、迁移相关 68/68、BUILD SUCCESS×3），**自验通过，待规划验收**。原始命令输出留存于执行会话记录，回执仅摘要；需要补证时按文件重跑即可复现。
