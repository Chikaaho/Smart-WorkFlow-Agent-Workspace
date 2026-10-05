# P63 探索附件：最小事实表

2026-10-06；执行角色；主回执 `p63-mes-workflow-foundations-readiness-20261006.md`。✅=服务端策略存在且有运行或静态可运行证据；✗=无路径；本轮全部为静态确认或既有运行证据引用，未运行任何服务。S=Smart-WorkFlow-aPaaS-server，W=Smart-WorkFlow-aPaaS-Web。

## 表0 逐题证据定位

| 题 | 关键定位 |
|---|---|
| Q1 | S README.md:36-42、W README.md:33-39（场景一）；todo/ch-apaas-project-update.md §3.1；knowledge/features/p62-lowcode-transaction-bpm-tiering.md（COMPLETED）；todo/requirement-pool.md:75,545（P60 段/P26 行）；V0.1.0 baseline_seed.sql:34-50（sys_dept.leader_id） |
| Q2 | BpmEngineAutoConfiguration.java:103-114（注册表装配）；BpmProcessDefController.java:366-375（能力端点）；DynamicParallelNodeTranslator.java:44-67（元数据）；ParticipantStrategy.java:8-21（7 策略）；RestrictedExpressionEvaluator.java:123-137,132-137（form.* Map 下钻/集合返 null）；DynamicBranchCollectionResolver.java:149-159（单键取值）；W form-schema.ts:194-202、UserControl.vue/DeptControl.vue（单选）；W ApproverCandidatesDialog.vue:151-156,270-295（人员页签可落值/部门角色只读）；W ProcessDesigner.vue:1357-1408（object→JSON 文本框）；W workflow-node-capabilities.ts:7-113（mock 7 类） |
| Q3 | DynamicParallelNodeTranslator.java:134-167（多实例翻译）；DynamicBranchCollectionResolver.java:66-118,105-108,149-161（边界/取最小/取值）；DynamicBranchPortConfiguration.java:39-48,53-87（冻结幂等/合并/CANCELED）；V76（sw_bpm_dynamic_branch DDL）；ConsensusCompletionEvaluator.java:42-85、ApprovalLifecycleServiceImpl.java:748-880（汇聚/投票幂等/分母）；BpmTaskFacadeImpl.java:320-323（退回同实例）；I4 回执03 六类异常、I4DynamicParallelFlowableTest |
| Q4 | ApprovalTaskListener.java:168-188、ConsensusCollectionResolver.java:23-42（统一注册表消费）；DynamicBranchCollectionResolver.java:84-108（动态并行直连 Facade）；SysDept.java:37-39、SysUserMapper.java:51-61（单值 leader/DISTINCT）；sw-biz-system 全模块分管领导零命中 |
| Q5 | TaskActionService.java:186,389-441（事务内终态+事件）；DomainEventPublisher.java:21-36；BpmDeviceCommandIntentRecorder.java:43-75（同事务意图 fail-closed）；BpmNotifyListener.java:53-55、OpenApiCallbackListener.java:27-55、BpmDeviceCommandListener.java:47-89（三个 AFTER_COMMIT 生产实现）；V0.1.0 baseline:2045-2078（sw_iot_device_command 幂等/approval_biz_id）；CommandCompensationJob.java:50-69,133-151；IotDeviceReceiptController.java:41-55（HMAC+人工核实）；JobStartupRunner.java:17-70、QuartzSchedulerService.java:37-165、JobInfo.java:29-76（RAM+Cron only）；TieredCommandReconcileJob/TaskDeadlineScheduler/ProcessTriggerRecoveryJob（@Scheduled+DB 认领）；PersistentBpmCommandQueue.java:40-42,399-413（deadline=准入截止）；product/p21-iot-device-access/passed/direction-p21-iot-device-access-terminal-sync.md:26（M08-F04-02 ⬜） |
| Q6 | QuartzSchedulerService.java:150、SwJobBean.java:188（本地时区）；IotDeviceCommandMapper.java:52-66（expiry）；Phase4PgRestartRecoveryTest；V0.1.2:6-29（幂等列+效果账本）；DeviceReceiptServiceImpl.java:26-170（回执恰一次）；sw-basic-iot 无 withdraw 处理（grep 零命中） |
| Q7 | W subfield-convert.ts:20-35,77-103（子表白名单禁 USER/DEPT；运行时注册表已预留 subFieldComponent:87-88）；W IotDeviceList.vue:157-181,368-468（命令抽屉/人工核实）；W IotFlowActions.vue:38-47,153-167（流程设备动作配置）；W TxnBatchConsole.vue（无静态路由/mock 种子）；W TaskDetail.vue（无 IoT 区块；实例图多活跃节点 contracts/bpm.ts:241-244） |

## 表1 R01—R05：要求→已有/缺口/未知→证据→影响

| 要求 | 已有 | 缺口/未知 | 关键证据 | 影响 |
|---|---|---|---|---|
| R01 动态并行节点 | 单节点多实例已交付可运行〔运行〕 | 分支体结构、专属配置 UI、表格/人员来源 | I4 验收06 PASSED；Translator:134 | 分支粒度由 Planner 定 |
| R02 表格列+多选来源 | 主表单部门字段单键取值 | 表格列解析无、多选组件无、行遍历无 | Q2 定位；form-schema.ts:194-202 | 新策略+表单组件改造 |
| R03 部门→负责人 | DEPT_LEADER 单值解析已交付〔运行〕 | 多负责人仅防御取最小；分管领导模型无 | leader_id；Resolver:105 | 身份模型产品决策 |
| R04 全部审批节点覆盖 | 服务端 7 策略统一注册表（动态并行除外） | 前端仅人员页签可配；动态并行未入注册表 | Q2/Q4 定位 | 前端面板为主+口径决策 |
| R05 一次性预约下发 | 终态钩子+命令链+幂等/UNKNOWN〔运行〕 | 预约表、到点触发器、过期/取消/迟到语义全缺 | Q5/Q6 定位；无 QRTZ_* 表 | 新持久调度能力（最大增量） |

## 表2 审批节点×来源覆盖清单

| 节点 | 直接选人 | 直接选部门 | 主表单人员/部门字段 | 表格列人员/部门 | 单选/多选 |
|---|---|---|---|---|---|
| APPROVAL 普通审批 | ✅ | ✅ | 人员仅 EXPRESSION；部门不展开 | ✗ | 表单组件仅单选 |
| CONSENSUS 会签 | ✅ | ✅ | 同上 | ✗ | 同上 |
| DYNAMIC_PARALLEL 动态并行 | ✗（恒为负责人） | 唯一语义（来源即部门集合） | 部门集合仅主表单键取值 | ✗ | — |
| COPY 抄送 / NOTIFICATION 通知 | ✅ | ✅ | 同 APPROVAL | ✗ | 同上 |
| TXN_ACTION 事务动作 | 无参与人配置 | 无 | 无 | 无 | — |

## 表3 相关迁移与测试清单

- 迁移：V49（参与人快照/会签票）、V71（会签/加签表）、V76（sw_bpm_dynamic_branch）、V77—V79/V82（模板/干预/交接/菜单）；生产基线 V0.1.0（sys_dept.leader_id、sw_iot_device_command、sw_job_info）、V0.1.1（表单事务）、V0.1.2（分级命令语义+效果账本）、V0.1.3（批量批次/项）、V0.1.4（资源保障）=当前链终点。
- 测试：I4DynamicParallelFlowableTest、I4CrossTenantServiceEntryTest、DynamicBranchPortTest、ConsensusVoteConcurrencyTest、ConsensusCompletionEvaluatorTest、ParticipantSnapshotRecorderImplTest、P62DeviceReceiptPgTest、P62ReceiptBoundaryPgTest、P62BatchInvokePgTest、Phase4PgRestartRecoveryTest。
