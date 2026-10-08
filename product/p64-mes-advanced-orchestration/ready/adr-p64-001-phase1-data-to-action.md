# ADR-P64-001：阶段Ⅰ数据到动作工程决策

2026-10-08；Executor；XL 阶段Ⅰ（A01—A04 及相关 A11/A12）。本文记录阶段Ⅰ实际实现选择、跨模块依赖、提交边界、兼容窗口与回退点；产品语义以主方向 R01—R04/§3 为准。阶段Ⅱ/Ⅲ接缝（岗位委托、父子流程、隔离回写、等待策略）不在本文范围。

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

**脚本边界**：sw-bpm-process 自持 `BpmScriptRunner`（`com.sw.ck.bpm.process.script`，GraalJS，`org.graalvm.polyglot` 版本走 sw-dependencies BOM；不依赖 sw-basic-iot 实现、不新增 process→engine 依赖——模块实测 process 仅依赖 bpm-api/form-api/system-api，脚本沙箱服务于编排判断故落 process；与最初拟放 engine 的差异在此如实登记）。`HostAccess.NONE`、无 IO/进程/线程/原生访问；硬限制：语句 ≤500,000（`ResourceLimits`）、wall clock ≤5,000ms（watcher 线程 `close(true)`）、输入快照 ≤1MiB、输出 ≤4KiB。脚本上下文只有 `variables`（快照只读映射）；输出仅 Number/String/Boolean/null，其他类型=类型错误。

**匹配与处置**：分支 `matchType+matchValue` 与返回值同类型同值精确比较（NUMBER 走数值相等、STRING/BOOLEAN 全等）；同类型同值重复分支发布拒绝；null/异常/超时/语句超限/未匹配 → `sw_bpm_trigger_exec` 行记录 status（UNMATCHED/FAILED + error/duration/snapshot），不自动走成功分支、不产生动作。触发评估在完成任务的同一事务内执行；脚本失败不回滚业务办理（异常就地捕获落 exec 行）。

**NODE_ROUND_COMPLETED 判定**：任务完成后同事务查 `BpmTaskFacade.queryByProcessInstance` 过滤 nodeKey，无活跃任务且本轮已有合法完成 → 触发；并发重复由 exec_key 唯一键（`TRG:{instance}:{triggerId}:{event}:{round}:{scopeTask?}`）吸收。

**预览**：`POST /workflow/triggers/preview` 按真实实例上下文（instanceId+triggerId）只读解析快照+评估+匹配，不落任何行、不登记命令（ISOLATED 只读预览）。

## 4. 配置化动作（PD01 部分 → A04）

**决策**：阶段Ⅰ只交付**独立关联流程**发起（START_SINGLE/START_EACH/START_GROUPED）；需回写/等待的子流程（Phase II）不在本决策范围。动作配置在 TriggerConfig 分支上，派发时冻结：

- 集合来源：START_EACH 逐项（USER_SET/DEPT_SET 按稳定 ID、ROWS 按行）；START_GROUPED 按 `groupBy` 稳定身份分组（USER/DEPT 项天然按 ID 一组一项；ROWS 按指定列值分组）；派发集合为空 → exec 处置 EMPTY_COLLECTION（阻止派发、可诊断）；超过 `maxDispatch`（默认 50、硬上限 200）→ 整体拒绝 OVER_LIMIT，不静默截断。
- **可靠意图**：命中后在完成任务的同事务为每项登记 `sw_bpm_command`（新 `CommandTypeEnum.ORCH_ACTION_START`，command_key=`P64ACT:{execKey}:{actionId}:{itemKey}`，payload=冻结映射数据+指纹，NORMAL 通道）+ `sw_bpm_action_ref` 行（INTENT_SUBMITTED）。未可靠登记即不冒称动作已受理；源业务提交成功而意图登记失败时整事务回滚（源业务亦未提交，无半成功）。
- **消费**：`OrchActionStartCommandHandler`（BpmCommandHandler SPI）在单事务内：目标表单建记录（`FormDataSubmitFacade.submit`，幂等键=commandKey）→ `ProcessStartService.start`（businessKey=新 recordId）→ 回填 `sw_bpm_action_ref`（target_record_id/target_instance_id/STARTED）。命令层 findByKey 幂等 + handler 内 ref 幂等双保险；恢复走既有 reclaimStale/requeueFailed；FAILED 可由有权用户重试（requeueFailed 复用同键）。
- **输入冲突**：同 execKey+actionId+itemKey 重放 = 回查原命令原结果；同身份异载荷由 payload_fingerprint 拒绝（既有 2426 语义）。
- **映射**：mapping 项 sourceVarId（快照值）/itemField（集合项字段）/literal → 目标表单字段；发布校验目标字段存在且类型相容（USER/DEPT 目标字段校验对象 ID）。
- **回查链**：`sw_bpm_trigger_exec`（判断）→ `sw_bpm_action_ref`（意图/目标实例）→ 目标 `sw_bpm_instance`（business_key）→ 目标表单记录；实例详情页可按链回查。

## 5. 跨模块依赖与提交边界

- sw-bpm-process 新增依赖：`org.graalvm.polyglot:polyglot` + `js-community`（BOM 管版本，Enforcer 收敛）；仅 `script` 包使用。
- sw-bpm-process 既有依赖不变（form-api/system-api/bpm-api）；`ProcessVariableValidator` 挂接 `BpmProcessDefServiceImpl.publish` 校验链（图校验之后、冻结之前，optional 装配不破坏既有直接构造的单测）。
- 写路径与既有可靠命令同一提交边界（任务完成事务内登记意图；命令消费事务内建记录+发起实例），沿 P62 G3a/G3b 已验证语义。
- 迁移：`V0.1.7__p64_orchestration_data_action.sql`（PG+H2 逐字节语义一致），三张新表（`sw_bpm_task_form_data`/`sw_bpm_trigger_exec`/`sw_bpm_action_ref`），不 ALTER 既有表；测试链 sw-bpm-process 增 `V105__p64_orchestration_data_action.sql`。

## 6. 兼容窗口与回退点

- 旧图（无 variables/triggers/节点表单绑定）：所有新路径在配置缺失时零动作，行为与现状一致；旧定义与运行实例按其 `def_version` 冻结图运行，不受新版本影响（A12）。
- 回退：新代码回滚后旧代码不读写三张新表、数据保留；命令队列中遗留 ORCH_ACTION_START 命令在旧代码下无 handler（保持 PENDING 事实，不产生部分效果）；不通过破坏性 DDL 删除事实。
- 关闭边界：新能力按发布版本显式配置存在才生效；删除图上配置并重新发布即停止新触发（存量 exec/ref/命令按事实保留）。

## 7. 错误码（2432 起）

2432 NODE_FORM_NOT_BOUND / 2433 NODE_FORM_VALIDATION_FAILED / 2434 NODE_FORM_ALREADY_SUBMITTED / 2435 VARIABLE_INVALID / 2436 VARIABLE_SNAPSHOT_TOO_LARGE / 2437 TRIGGER_INVALID / 2438 TRIGGER_SCRIPT_FAILED / 2439 TRIGGER_RESULT_UNMATCHED / 2440 TRIGGER_RESOURCE_LIMIT / 2441 ACTION_INVALID / 2442 ACTION_DISPATCH_EMPTY / 2443 ACTION_DISPATCH_OVER_LIMIT / 2444 ACTION_TARGET_INVALID。

## 8. 阶段Ⅰ边界与遗留

- 流程分支路由仍走既有 CONDITION 网关；Trigger 结果改变本流程走向不在阶段Ⅰ。
- 节点表单校验不复用 form 全矩阵（公式/显隐/字段权限），缺项登记于回执。
- 节点表单历史回看按实例/任务查询 API 提供；记录级行权限（S3 行级隔离）属阶段Ⅱ PD06。
- 性能值（5s/500k/1MiB/4KiB/50/200）为设计护栏与发布校验值，不冒充容量指标；P62 性能延期边界不因此开启。
