# ADR-P64-001：阶段Ⅰ数据到动作工程决策

2026-10-08；Executor；XL 阶段Ⅰ（A01—A04 及相关 A11/A12）。本文记录阶段Ⅰ实际实现选择、跨模块依赖、提交边界、兼容窗口与回退点；产品语义以主方向 R01—R04/§3 为准。阶段Ⅱ/Ⅲ接缝（岗位委托、父子流程、隔离回写、等待策略）不在本文范围。

> 修订（2026-10-09，规划审查01 P1-08）：§3/§4/§5/§6 按实际实现与依赖门禁结果修订——脚本运行器落 sw-bpm-engine（非 process）、经 bpm-api 端口消费；动作目标实例为 FLOW_START 命令异步二段创建；回退收敛为"未知类型有界重试终态 FAILED"（非"保持 PENDING"）。
>
> 修订02（2026-10-09，复审03 + 二级提示02）：①§3 执行空间与并发按实际 worker 进程池重写（`-Xmx128m` 真实堆上限、握手自报 134,217,728、全局/租户并发上限、**等候数量硬上限**（0=立即繁忙）、shutdown 回收自身进程），取代"无 128MiB 护栏 / 调用方线程内联评估"的早前记录；②§3 新增 BPM 变量回退端口 `BpmVariableReadPort`（引擎动态并行"流程变量"来源在缺省时读取业务变量快照同一口径）；③§1 节点表单 definition 以结构化对象返回（契约形状，非 JSON 字符串），绑定版本快照缺失为可诊断拒绝、不静默回退最新；④§4/§6 动作意图持久 status=STARTING、展示/重试门槛按持久事实解析为 STARTED，回退前置收敛核查已实跑（见回执04）。
>
> 修订03（2026-10-09，复审04 + 三级提示03 收敛实测）：§4 消费项修正持久状态语义笔误——意图受理回填为 `target_record_id/持久 STARTING`（`OrchActionStartCommandHandler:75` 实测原输出），此前"回填 STARTED"表述与持久行冲突；并按三级收敛实测补记两点边界：办理事务故障（意图登记撞键）整事务回滚零半提交、FAILED→同载荷重置→EXPIRED→`:R1` 恢复代数链实测收敛；二段 FLOW_START 载荷在受理时固化当时绑定 defKey，受理后绑定修复不改变既有载荷，FLOW_START 终态失败窗口的收敛需 ORCH 级重跑（当前 retryActionRef 仅覆盖 ORCH-FAILED 形态，原样记录为观察项，不改判为已恢复）。
>
> 修订04（2026-10-09，复审05 产品反证 + 提示04 收敛实测）：①**任务绑定版本冻结改口径**——发布时把各节点 `config.nodeForm` 的当前已发布表单版本冻结进**冻结图**（`formVersion`；`BpmProcessDefServiceImpl#freezeNodeFormVersions`），`NodeFormDataService.resolveBinding`/`saveDraft`/`submitFinal` 与 `BpmNodeFormController`/`TaskActionService` 一律按**绑定版本**校验与落行：任务创建读取即已绑定，首次草稿前后与表单再发布都不漂移；冻结图无记录的历史图回退当前发布（旧无绑定兼容），绑定版本快照缺失保持可诊断拒绝（取代"首行落库才绑定/按最新校验"）。②**二段恢复语义落地**——`ActionRefRecoveryService`：ORCH FAILED 复用同键；ORCH EXPIRED 与 ORCH COMPLETED+FLOW_START FAILED/EXPIRED 窗口**按当前有效绑定登记新的 `FLOW_START:{recordId}:R{n}` 恢复代**（载荷=原受理输入+当前绑定指针；原 EXPIRED/FAILED 行与载荷一律保留不改写；无有效绑定→零目标安全处置）；`FlowStartCommandHandler.onFinalFailure` 与零目标处置路径把意图标记 FAILED+原因（不再永久 STARTING 冒正常）；恢复端点权限 `workflow:instance:view`，不再 500。③**重复延续缺陷修复（X7 双激活）**——`BpmTaskFacadeImpl.completeWithOptimisticRetry`：乐观锁冲突时**禁止同事务重放已执行副作用**——任务已消失=幂等竞争转 2305；任务仍存在=抛原始冲突使整事务回滚、由命令层新事务受控重试；租约交接重叠语义（G4b）保持不变。

## 1. 节点业务表单（PD04 → A01）

**决策**：任务级表单数据存 BPM 域新表 `sw_bpm_task_form_data`，一行 = 一个任务的数据身份（唯一键 `tenant_id+task_id`）；`status` DRAFT→SUBMITTED；`form_key+form_version` 在行上冻结；数据存 JSON（`text` 列，双方言一致）。

**理由与代价**：
- 不走 `FormDataSubmitFacade`/动态宽表：主表单提交链会触发 `FlowStartPort` 流程发起路径，节点表单数据必须与任务办理同事务原子生效且不得产生流程发起副作用；宽表行身份也会与主业务单据混淆。
- 校验在 BPM 侧按发布快照 definition 执行（必填/类型/USER/DEPT 对象存在性经 `UserQueryFacade`/`DeptQueryFacade` 权威校验），复用 form-api 元数据，不复制表单校验的全部矩阵（公式/显隐规则不适用于节点表单场景，缺项如实登记）。
- 默认审批意见（comment/opinionData/`sw_bpm_approval_action`）完全不动；节点表单数据是并列新增。
- 轮次语义（阶段Ⅰ口径）：`round_no` = 该实例 RETURN 动作数 + 1（与 `TaskActionService#nextReturnRound` 同源）；退回前旧轮数据不混入新轮读取。P63 动态并行各分支任务天然以 task_id 独立。
- 提交时机：仅 APPROVE/DISAPPROVE（任务合法完成）时任务表单数据随同事务落 SUBMITTED；REJECT/RETURN 不产生有效提交，草稿保持 DRAFT 且不进入变量读取。

## 2. BPM 变量（PD02 → A02）

**决策**：`ProcessGraph` 契约新增文档级可选字段 `variables`（`List<ProcessVariableDef>`，向后兼容：旧图缺省=无变量、零行为）；发布时经 `ProcessVariableValidator` 校验后随 `sw_bpm_process_def_version.graph_json` 冻结；运行时从实例 `def_version` 对应冻结版本行解析（`BpmVariableSnapshotService`）。

**变量模型**：稳定引用 `varId`（`var_` 前缀，显示名 name 可改不影响引用）；类型 NUMBER/STRING/BOOLEAN/USER/DEPT/USER_SET/DEPT_SET/ROWS；来源 MAIN_FORM（主业务表单字段，经 `FormRecordReadFacade.findRecord`）/ NODE_FORM（节点表单已 SUBMITTED 数据，roundRule=CURRENT 本轮口径）/ SYSTEM（只读白名单：processInstanceId、processDefKey、businessKey、formKey、initiatorId、tenantId、currentNodeKey、roundNo，不接受客户端扩充）。聚合：USER_SET/DEPT_SET 按 UNION 并集去重（稳定 ID）；ROWS 按 CONCAT 拼接（保留来源 task_id/rowId 追踪字段）；标量来源多任务同字段必须单任务选定，否则发布拒绝。缺值：必填变量缺失阻止触发（exec=FAILED 可诊断）；`nullable=true` 返回 null，脚本返回 null → 未匹配处置。

**快照一致性**：一次触发评估构建一份快照（同事务读点），整判断共用；快照序列化 ≤1MiB，超限判 FAILED（资源超限可诊断）。快照 JSON 落 `sw_bpm_trigger_exec.snapshot_text` 供追踪。

## 3. Trigger 判断（PD03 → A03）

**决策**：`ProcessGraph.triggers`（`List<TriggerConfig>`）文档级配置，随版本冻结；事件 TASK_SUBMITTED（默认关闭，须显式选择）/ NODE_ROUND_COMPLETED（默认语义）/ PROCESS_COMPLETED（仅 APPROVED 合法终态；REJECT/退回/废弃/撤回不触发）。

**脚本边界**：脚本运行器 `BpmScriptRunner` 落 **sw-bpm-engine**（`com.sw.ck.bpm.engine.script`，GraalJS，`org.graalvm.polyglot` 版本走 sw-dependencies BOM）；sw-bpm-api 定义端口 `BpmScriptEvaluatePort`（`run/validate` + `ScriptOutcome`），**sw-bpm-process 仅依赖 bpm-api 端口，类路径无 GraalJS**（engine 持运行器与端口实现；IotContractBoundaryIsolationTest 门禁实测保持）。`HostAccess.NONE`、无 IO/进程/线程/原生访问。**护栏（P64 审查01 P1-02 / 复审03 P1-02a/02b 修订为实测事实）**：语句 ≤500,000（`ResourceLimits`，超限→RESOURCE_LIMIT）；wall clock 默认 ≤5,000ms（worker 内 watcher `close(true)` 强制中断→TIMEOUT，下限 500ms；宿主另有 wall-clock 兜底 `destroyForcibly`+`onExit` 等实际退出，`shouldTimeoutAndLeaveNoLiveJudgement` 以 500ms 实测并核验进程受管复用）；guest 内存耗尽 → RESOURCE_LIMIT（`shouldCapExecutionSpaceAt128MiBAndRecover` 实证，含 Java heap space 根因与池恢复）；输出序列化 ≤4KiB（超限→RESOURCE_LIMIT）。

**执行空间与并发（复审03 修订，取代早前"无 128MiB 护栏 / 调用方线程内联评估"记录）**：判断脚本在**专职 worker JVM 进程池**（`ScriptWorkerPool`/`ScriptWorkerMain`，stdin/stdout 行式 JSON 协议 + 启动握手自报堆上限）内执行——每个 worker 以 `-Xms32m -Xmx128m` 启动，`maxHeapBytes` 实测 134,217,728（=128MiB）；脚本可分配内存被该真实堆上限约束，不在宿主堆内联评估。并发与排队：全局并发上限=常驻 worker 数（`sw.bpm.script.workers` 默认 2）、单租户上限（`tenant-workers` 默认 1）、**等候数量硬上限**（`queue-capacity` 全局默认 8、`tenant-queue-capacity` 默认 4；0=不允许等候，满额立即繁忙）叠加等候时限 `queue-wait-ms`（默认 50ms）；满额/超限判 RESOURCE_LIMIT（"判断执行繁忙"，可恢复），无无界等待。HTTP 办理、命令消费、预览三入口共用同一池与同一组限额、队列。脚本上下文只有 `variables`（快照只读映射）与宿主函数 `流程变量取值(name)`（别名 `getVariable`）；输出仅 Number/String/Boolean/null。测试证据：`shouldEnforceTenantAndGlobalConcurrencyCapsWithBusyRejection`、`shouldRejectImmediatelyWhenTenantQueueCapacityIsZero`、`shouldAdmitBoundedWaiterThenRejectOverflow`、`shouldRejectImmediatelyWhenGlobalQueueCapacityIsZero`、`shouldReclaimOwnWorkerProcessesOnShutdown`。**BPM 变量回退端口（复审03 新增）**：引擎动态并行等节点以"流程变量"配置集合来源时，流程变量缺省经 sw-bpm-api `BpmVariableReadPort`（bpm-process 以 `BpmVariableSnapshotService` 实现）读取同一份业务变量快照（冻结图 + 当前有效轮次），避免"设计器变量"与"流程变量"两套语义分叉；端口未接线时保持原语义（空集合按节点 emptyStrategy 处置）。

**匹配与处置**：分支 `matchType+matchValue` 与返回值同类型同值精确比较（NUMBER 走数值相等、STRING/BOOLEAN 全等）；同类型同值重复分支发布拒绝；null/异常/超时/语句超限/未匹配 → `sw_bpm_trigger_exec` 行记录 status（UNMATCHED/FAILED + error/duration/snapshot），不自动走成功分支、不产生动作。触发评估在完成任务的同一事务内执行；脚本失败不回滚业务办理（异常就地捕获落 exec 行）。

**NODE_ROUND_COMPLETED 判定**：任务完成后同事务查 `BpmTaskFacade.queryByProcessInstance` 过滤 nodeKey，无活跃任务且本轮已有合法完成 → 触发；并发重复由 exec_key 唯一键（`TRG:{instance}:{triggerId}:{event}:{round}:{scopeTask?}`）吸收。

**预览**：`POST /workflow/triggers/preview` 按真实实例上下文（instanceId+triggerId）只读解析快照+评估+匹配，不落任何行、不登记命令（ISOLATED 只读预览）。

## 4. 配置化动作（PD01 部分 → A04）

**决策**：阶段Ⅰ只交付**独立关联流程**发起（START_SINGLE/START_EACH/START_GROUPED）；需回写/等待的子流程（Phase II）不在本决策范围。动作配置在 TriggerConfig 分支上，派发时冻结：

- 集合来源：START_EACH 逐项（USER_SET/DEPT_SET 按稳定 ID、ROWS 按行）；START_GROUPED 按 `groupBy` 稳定身份分组（USER/DEPT 项天然按 ID 一组一项；ROWS 按指定列值分组）；派发集合为空 → exec 处置 EMPTY_COLLECTION（阻止派发、可诊断）；超过 `maxDispatch`（默认 50、硬上限 200）→ 整体拒绝 OVER_LIMIT，不静默截断。
- **可靠意图**：命中后在完成任务的同事务为每项登记 `sw_bpm_command`（新 `CommandTypeEnum.ORCH_ACTION_START`，command_key=`P64ACT:{execKey}:{actionId}:{itemKey}`，payload=冻结映射数据+`payload_fingerprint`（`CommandFingerprint.of(payload)`，审查01 后补齐），NORMAL 通道）+ `sw_bpm_action_ref` 行（INTENT_SUBMITTED）。未可靠登记即不冒称动作已受理；源业务提交成功而意图登记失败时整事务回滚（源业务亦未提交，无半成功）。
- **消费**：`OrchActionStartCommandHandler`（BpmCommandHandler SPI）在单事务内：目标表单建记录（`FormDataSubmitFacade.submit`，幂等键=commandKey）→ **目标流程实例由 submit 内部既有流程发起链受理（FormSubmitService→FlowStartPort→`sw_bpm_command` FLOW_START 命令→`FlowStartCommandHandler`→`ProcessStartService` 唯一入口，businessKey=新 recordId）异步二段创建**——意图受理事务只保证"目标记录+FLOW_START 受理"原子落库，不内联 start；→ 回填 `sw_bpm_action_ref`（target_record_id/**持久 status=STARTING**——`OrchActionStartCommandHandler:75`；"STARTED"不是持久状态，由回查层按目标实例持久事实解析展示并动态解析关联实例，重试门槛同按持久事实）。`target_instance_id` 不在意图事务回填（此时目标实例尚未创建），实例回查按 `target_record_id`（=目标 business_key）动态解析（`BpmTriggerController#resolveTargetInstanceId`，修复审查01 O02"关联实例列为空"）。命令层 findByKey 幂等 + handler 内 ref 幂等（STARTED/STARTING+targetRecordId→SKIP_DUPLICATE）双保险；恢复走既有 reclaimStale/requeueFailed；FAILED 可由有权用户重试（`BpmTriggerController#retryActionRef`→requeueFailed 复用同键命令，零图配置依赖——触发器配置已关闭的冻结版本实例同样可恢复；该重试仅覆盖 ORCH 命令 FAILED 形态——FLOW_START 已受理而其消费终态失败的窗口，ref 保持 STARTING 可诊断，收敛需 ORCH 级重跑，见修订03 观察）。
- **输入冲突**：同 execKey+actionId+itemKey 重放 = 回查原命令原结果；同键并发受理时 `payload_fingerprint` 一致才吸收为幂等命中，**异载荷显式留冲突痕迹不冒称成功**（`dispatchItem` DuplicateKeyException 分支，审查01 后补齐；既有 2426 语义同源）。
- **映射**：mapping 项 sourceVarId（快照值）/itemField（集合项字段）/literal → 目标表单字段；发布校验目标字段存在且类型相容（USER/DEPT 目标字段校验对象 ID）。
- **回查链**：`sw_bpm_trigger_exec`（判断）→ `sw_bpm_action_ref`（意图/目标实例）→ 目标 `sw_bpm_instance`（business_key）→ 目标表单记录；实例详情页可按链回查。

## 5. 跨模块依赖与提交边界

- sw-bpm-engine 新增依赖：`org.graalvm.polyglot:polyglot` + `js-community`（BOM 管版本，Enforcer 收敛）；仅 `engine/script` 包使用。**sw-bpm-process 无 GraalJS 依赖**（实测 pom 零引用），仅经 bpm-api `BpmScriptEvaluatePort` 消费。
- sw-bpm-process 既有依赖不变（form-api/system-api/bpm-api）；`ProcessVariableValidator` 挂接 `BpmProcessDefServiceImpl.publish` 校验链（图校验之后、冻结之前，optional 装配不破坏既有直接构造的单测）。
- 写路径与既有可靠命令同一提交边界（任务完成事务内登记意图；命令消费事务内建目标记录+受理 FLOW_START；目标实例由既有 FLOW_START 消费链创建），沿 P62 G3a/G3b 已验证语义。
- 迁移：`V0.1.7__p64_orchestration_data_action.sql`（PG+H2 逐字节语义一致），三张新表（`sw_bpm_task_form_data`/`sw_bpm_trigger_exec`/`sw_bpm_action_ref`），不 ALTER 既有表；测试链 sw-bpm-process 增 `V105__p64_orchestration_data_action.sql`。
- A01 越权边界（审查01 后补齐）：`BpmNodeFormController` 任务级读=任务办理人（assignee/canHandle，fail closed）或实例发起人；任务级写（草稿）仅办理人——与 `TaskActionService` 办理校验同语义。

## 6. 兼容窗口与回退点

- 旧图（无 variables/triggers/节点表单绑定）：所有新路径在配置缺失时零动作，行为与现状一致；旧定义与运行实例按其 `def_version` 冻结图运行，不受新版本影响（A12；真实 PG 0.1.6 非空基线追加演练实证：13 迁移至 v0.1.6 → V0.1.7 追加 1 迁移，存量定义 graph_json 逐字节不变、运行实例/任务动作行原义保持、三新表零写回、迁移历史恰一条 0.1.7）。
- **关闭边界（审查01 后补测试实证）**：新能力按发布版本显式配置存在才生效。删除图上配置并重新发布后：**冻结版本中的存量实例继续按其原触发配置运行至收敛**（def_version 冻结语义，`shouldKeepFrozenTriggerForOldVersionAndSilenceNewVersion` 实证），新版本实例零触发；存量 `sw_bpm_trigger_exec`/`sw_bpm_action_ref`/命令按事实保留且可回查，**FAILED 动作意图重试零图配置依赖**（`shouldRetryFailedRefWithoutGraphDependency` 实证）。
- **回退（审查01 P1-07 修订，替代早前"无 handler 保持 PENDING"的错误声明）**：回滚到旧代码后，命令队列中遗留 ORCH_ACTION_START 命令由 `CommandDispatcher` 对未知类型执行 `failAndScheduleRetry("无命令处理器: ORCH_ACTION_START")`——按既有有界重试策略（`sw.bpm.command.max-retries` 默认 5、退避 1s）终态 **FAILED**，不阻塞其他命令消费、不产生部分效果、意图行与源业务事实保留可诊断（`rollback_shouldConvergeOrchActionStartWithoutHandler` 实证）；不通过破坏性 DDL 删除事实。
- **回退前置收敛核查（复审03 P1-07b，本会话实跑）**：回滚前应在役 ORCH_ACTION_START 命令收敛至终态（核查 SQL：`SELECT count(*) FROM sw_bpm_command WHERE command_type='ORCH_ACTION_START' AND status NOT IN ('COMPLETED','FAILED')`）——本会话在隔离库实测结果为 **0**；同时按业务动作把 P64 实例全部收敛到终态（v1/v2 主实例经授权实例干预 TERMINATE、v3 主实例 APPROVED、10 个整改目标实例 REJECTED、运行期任务清零），核查输出见 `receipts/evidence/phase1-04/db/rollback-convergence-check.txt`。"存量命令在旧代码下自然收敛为 FAILED"是被验证的兼容行为，不冒称意图会继续执行。
- **升级续办（复审03 P1-07a，本会话实跑）**：在隔离库 `p64_upgrade_run` 以 `spring.flyway.target=0.1.6` 建 13 迁移基线（P64 三新表不存在），经 API 创建真实在役对象（表单+流程定义 v1+实例+待办）；去 target 重启后 Flyway 追加 1 迁移至 v0.1.7（三新表建立），**同一在役实例按其冻结 def_version=1 继续办理并收敛为 APPROVED**，P64 三新表对该旧图实例零写入，P63 既有表保持；证据 `receipts/evidence/phase1-04/db/upgrade-016-baseline.txt`、`upgrade-017-after.txt`。

## 7. 错误码（2432 起）

2432 NODE_FORM_NOT_BOUND / 2433 NODE_FORM_VALIDATION_FAILED / 2434 NODE_FORM_ALREADY_SUBMITTED / 2435 VARIABLE_INVALID / 2436 VARIABLE_SNAPSHOT_TOO_LARGE / 2437 TRIGGER_INVALID / 2438 TRIGGER_SCRIPT_FAILED / 2439 TRIGGER_RESULT_UNMATCHED / 2440 TRIGGER_RESOURCE_LIMIT / 2441 ACTION_INVALID / 2442 ACTION_DISPATCH_EMPTY / 2443 ACTION_DISPATCH_OVER_LIMIT / 2444 ACTION_TARGET_INVALID。

## 8. 阶段Ⅰ边界与遗留

- 流程分支路由仍走既有 CONDITION 网关；Trigger 结果改变本流程走向不在阶段Ⅰ。
- 节点表单校验不复用 form 全矩阵（公式/显隐）；字段级权限在节点表单场景无对应配置对象，越权边界按任务办理人/发起人控制（§5），行级隔离（S3）属阶段Ⅱ PD06。
- 节点表单历史回看按实例/任务查询 API 提供。
- 性能值（5s/500k/1MiB/4KiB/50/200）为设计护栏与发布校验值，不冒充容量指标；P62 性能延期边界不因此开启。社区版无脚本级堆上限选项（§3 平台边界）。
