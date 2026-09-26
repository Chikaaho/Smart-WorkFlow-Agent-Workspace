# Phase 4 执行回执 03 · 规划验收

> 复核角色：规划（Planner）  
> 日期：2026-09-24  
> 审查对象：`completion-phase4-reliable-business-events-03.md` 与 `evidence/completion-phase4-03/`  
> 结论：**功能级 `PASSED`（21/21；待终态同步，不等于 `COMPLETED`）**

## 1. 验收裁决

Phase 4 方向 §5 的 A/B/C/D 四组共 21 条要求全部通过：

| 组别 | 结果 | 规划判定 |
|---|---|---|
| A. 原子持久化与真实状态 | 5/5 | must-deliver 意图与业务提交同边界；Quartz/脚本事务、真实状态、崩溃恢复和 Form 兜底退役均闭合 |
| B. 领取、重试与失败终态 | 5/5 | 状态机、并发领取、租约回收、有限重试、终止态和失败语义均有 PostgreSQL 行为结果 |
| C. 幂等与业务结果 | 5/5 | 稳定业务键、重复/重启/迟到隔离、FLOW/IoT/审批结果均闭合 |
| D. 兼容、验证与守门 | 6/6 | 11/11 发布矩阵、真实 PG、逐接缝、V96 迁移、防回退规则和最终全量门禁均闭合 |

执行回执保持 `VERIFYING`，没有自行写 `PASSED/COMPLETED`，没有实施其他 BAO，也没有执行 Git、发布或生产数据动作。

## 2. G3a/G3b 核销

| 原子 ID | 规划要求 | 最终行为证据 | 结论 |
|---|---|---|---|
| G3a | 审批引擎状态与设备命令、通知、回调意图必须同提交或确定性恢复，零永久缺失、零重复 | `raw/commit-boundary-behaviour.log`：正常提交三类意图齐全；显式回滚两侧为零；精确故障后 `engineAdvancedToT2=0`、`engineOnlyOrphans=0`；新上下文重放后引擎/任务/设备/回调均为 1、重复为 0。`raw/flowable-tx-fact.log` 同步证明回滚时引擎不再推进 | **PASSED** |
| G3b | 启动窗口崩溃后必须恢复为一个引擎实例、一个业务实例、一个可审计任务终态，零 engine-only 孤儿和重复 | `raw/start-window-crash.log`：Scheduled FLOW、IoT 规则、IoT 脚本在精确窗口故障后两侧均为 0；生产恢复路径续跑后均为 `engineInstances=1 businessInstances=1`，任务/触发行终态成功，旧写回被拒 | **PASSED** |

`pg_terminate_backend` 终止承载当前事务的真实 PostgreSQL 连接，使精确窗口内未提交的引擎与应用写入由数据库统一回滚；随后关闭并重建应用上下文完成恢复重放。该证据强度满足补充提示要求，不是 mock、代码扫描或单纯事务存在性声明。

## 3. 证据勾稽

- 证据包 30 个物理文件；`evidence.sha256` 现场回读 **26/26 OK**，`behavior-input.check` **245/245 OK**。
- G3a **3/0/0/0**、G3b **3/0/0/0**；最终事务事实 2/0/0/0。
- 最终快照重验：生命周期 7、双上下文恢复 1、流程接缝 9、交付接缝 8、机械守门 7，均 0 failure / 0 error / 0 skipped。
- 受影响模块：sw-common 32、sw-bpm-engine 61、job 51、notify 118、iot 50、bpm-process 205、form 159、openapi 10，均全绿。
- Server 全量按 class-level Surefire 行现场复算为 **1536/0/0/0**，`BUILD SUCCESS`，13:43。
- `command-results.tsv` 的最终每个唯一日志记录与当前文件行数一致。两次最终重跑复用了日志路径，较早的同名行不作为独立证据；验收只采用最后记录和被哈希的最终日志，不影响完成条件。
- 证据目录对本机 PostgreSQL 地址与密码值现场扫描均为零命中；连接信息未进入仓库证据。

## 4. 已锁定结果

1. Scheduled FLOW、IoT 规则/脚本、审批设备命令、通知意图、OpenAPI 回调已从内存事件唯一事实源收敛为持久、可恢复、幂等且有终态的交付链。
2. Flowable 与应用持久化使用同一 DataSource/事务管理器提交边界；审批推进与 must-deliver 意图不再出现单边提交。
3. 流程引擎实例与 `sw_bpm_instance` 记录同事务；三个启动入口的精确窗口崩溃均可无重复恢复。
4. 11 个既有发布点全部分类，零未分类 must-deliver 旁路；V96 升级保留既有数据并新增回调任务与 IoT 恢复结构。
5. G1/G2/G3/G4/G5/G6 与回执 02 暴露的 D1—D14 均已在最终实现快照上闭合或按快照失效规则复验。

## 5. 接受的边界

- 外部 SMS/EMAIL/FEISHU/DINGTALK/WECHAT_WORK Provider 的厂商真实送达仍按既有 Owner 延期边界，不属于本阶段通过声明。
- 当前生产代码没有 `@DS` 路由使用；未来若引入 `@DS` 或改变 Flowable DataSource/事务管理器，G3a/G3b 事务快照自动失效，必须重新评估并复验。
- 本阶段保证至少一次可恢复交付与业务幂等，不承诺消息物理层绝不重复。

这些边界与主方向的非目标一致，不降低可靠意图、恢复、幂等或原子提交标准，不阻塞本阶段通过。

## 6. 状态裁决

Phase 4 `reliable-business-events` 由 `IN_PROGRESS / VERIFYING` 进入功能级 **`PASSED（2026-09-24）`**。该阶段属于架构优化子阶段，不增加业务功能数，不核销 P/I/ADV；总体任务 `backend-architecture-optimization` 继续 `IN_PROGRESS`。

主方向归档：

`product/backend-architecture-optimization/passed/direction-phase4-reliable-business-events.md`

终态同步唯一入口：

`product/backend-architecture-optimization/ready/direction-phase4-reliable-business-events-terminal-sync.md`

终态同步复核通过前不得写 Phase 4 `COMPLETED`，不得启动 Phase 5 或其他 BAO 实施。

