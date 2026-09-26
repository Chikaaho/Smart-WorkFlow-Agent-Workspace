# Phase 4 执行回执 02 · 规划复核

> 复核角色：规划（Planner）  
> 日期：2026-09-24  
> 审查对象：`completion-phase4-reliable-business-events-02.md`  
> 结论：**`VERIFYING`；G1/G4/G5/G6 已锁定，G2 局部锁定，G3 仍存在两个实际产品缺陷**

## 1. 证据复核结论

本轮证据包共有 30 个物理文件。规划侧现场复算确认：

- `evidence.sha256` 26/26 当前回读 `OK`，既有 `behavior-input.check` 243/243 为 `OK`；
- `command-results.tsv` 的 17 份日志行数与实际文件逐项一致；
- Server 全量按 class-level Surefire 行重新求和为 **1530/0/0/0**，各受影响模块计数与回执一致；
- 真实 PostgreSQL 生命周期、接缝、迁移、11/11 发布矩阵与零旁路均有可回读原始输出；
- 当前证据目录未发现本机 PostgreSQL 地址或密码值落盘。

因此，G1、G4、G5、G6 的上一轮缺证据问题关闭；G2 中已经证明的持久意图、领取、重试、幂等、失败终态和 Form 兜底退役行为予以锁定。回执 02 暴露的 D1—D14 修复结果可作为当前快照事实保留。

## 2. 未通过原因与诊断

回执 02 的 G3 原始日志同时记录：

`g3.callback-rollback ... orphanIntents=0 engineBoundary=independent engineAdvancedToT2=true`

这不是可接受的“残余风险”，而是已复现的**实际产品缺陷**：Flowable 引擎已推进到下一审批节点，但应用事务回滚，must-deliver 持久意图为零。它直接违反主方向：

- §3：Flowable 回调与不同事务来源的持久化边界属于本阶段范围；
- §5.A.1：业务事务提交时必须同时形成持久意图；
- §5.C.5：审批成功后设备命令、通知与已订阅回调意图必须可追溯。

`isActualTransactionActive=true` 只证明当前线程存在事务，不能证明 Flowable 状态与应用持久意图使用同一提交边界。执行回执已确认两者 `ConnectionHolder` 不同，因此 G3 不能关闭，受它影响的审批来源 G2 证据也不能完成最终锁定。

回执 §9.2 还承认“引擎已发起、业务实例尚未落库、进程崩溃”的窗口。现有证据只证明重投不重复启动，未证明重启后 `Flowable 实例 + sw_bpm_instance + 持久任务终态` 三者最终一致。这同样属于 Phase 4 已授权的流程启动可靠性，而不是新方向。

## 3. 唯一剩余原子账本

上一轮 G3 拆分为两个稳定子项；G2 的未锁定部分依赖它们，不另建重复工作项。

| 原子 ID | 分类 | 失败事实 | 完成条件 |
|---|---|---|---|
| G3a | 实际产品缺陷 | Flowable 已推进而应用事务回滚，审批关联 must-deliver 意图为零 | 在真实 Flowable + PostgreSQL 生产事务布线下证明：审批状态与其设备命令、通知、回调意图不会形成“前者提交、后者永久缺失”；正常提交、显式回滚和精确故障注入后均满足原子提交或确定性恢复，且无重复意图 |
| G3b | 实际产品缺陷 | 流程引擎实例创建与 `sw_bpm_instance`/触发任务写回之间仍有崩溃窗口 | 对所有受同一窗口影响的 Phase 4 流程启动路径做真实崩溃恢复：重启后恰好一个引擎实例、一个业务实例、一个可审计任务终态，零永久 engine-only 孤儿、零重复实例 |

## 4. 锁定项与快照失效边界

- 锁定：G1 七类生命周期 + 双进程恢复；G4 11/11 矩阵与零旁路；G5 V96/H2/PG 迁移行为；G6 身份、日志、计数和哈希包。
- 局部锁定：G2 已验证的下游领取、租约回收、重试耗尽、稳定幂等与失败终态；这些结果不因补文案重复运行。
- 若 G3 修复修改公共 DataSource、事务管理器、流程启动或审批回调路径，则仅受影响的锁定快照失效；执行层必须说明失效依据并运行相称回归。G4/G5 在发布矩阵或 schema 未变化时禁止无理由重做。
- Phase 3 的 Server **1493/0/0/0** 仍为正式基线；本轮 1530/0/0/0 是已验证候选快照，Phase 4 未通过前不晋级正式基线。

## 5. 继续执行裁决

G3 已连续两次未关闭：回执 01 缺事务事实，回执 02 的事务事实进一步证明实际缺陷。依据规划验收规则，已下发一级执行补充提示：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-phase4-reliable-business-events-01.md`

该提示是当前唯一执行入口。Executor 关闭 G3a/G3b 后追加：

`product/backend-architecture-optimization/receipts/completion-phase4-reliable-business-events-03.md`

不需要 Owner 再次提供 PostgreSQL 参数；不实施其他 BAO，不执行 Git/发布动作，不得把已知原子性缺陷改写成可接受残余风险，也不得自行写 `PASSED/COMPLETED`。

