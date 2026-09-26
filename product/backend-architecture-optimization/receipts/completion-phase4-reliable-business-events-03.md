# Phase 4 执行回执 03 · 提交边界与启动窗口原子性收口（关闭 G3a/G3b）

> 复核角色：执行（Executor）  日期：2026-09-24  任务级别：XL
> 唯一执行入口：`planning-execution-prompt-phase4-reliable-business-events-01.md`
> 审查记录：`planning-review-completion-phase4-02-verifying.md`
> **状态：`IN_PROGRESS / VERIFYING`（执行自验完成并提交；功能级验收由规划裁决，本回执不写 `PASSED/COMPLETED`）**

规划在审查 02 中把我在 §9 记为"残余风险"的两项改判为**已复现的实际产品缺陷**。本轮按此修复产品行为并给出
精确故障注入下的真实行为结果：**引擎与应用现在共享同一提交边界**，且**流程发起与业务实例记录同事务**。
证据位于 `receipts/evidence/completion-phase4-03/`（30 个物理文件：17 份原始日志、19 条命令记录、哈希回读与脱敏扫描）。

---

## 1. 缺口 → 原始文件/位置 → 实际结果 → 覆盖边界

| 原子 ID | 缺口 | 原始文件/位置 | 实际结果 | 覆盖边界 |
|---|---|---|---|---|
| G3a | 审批引擎状态与应用意图分属不同提交边界（审查 02 复现：`engineAdvancedToT2=true` 且意图为零） | 修复位置：`sw-biz/sw-bpm/sw-bpm-engine/.../BpmEngineAutoConfiguration#masterDataSourceBinding`（引擎改绑应用 DataSource + 应用事务管理器）<br>证据：`raw/flowable-tx-fact.log`、`raw/commit-boundary-behaviour.log` | 修复后同一断言：`engineCommitBoundary=application-transaction engineAdvancedToT2=false`；正常提交三类意图全部可追溯；显式回滚两侧均未提交；故障注入后两侧同时消失；重启重放恰好各一份 | 真实 PostgreSQL + 真实 Flowable；覆盖固定租户、流程实例、审批动作、设备命令/通知/回调三类意图及其幂等键。**不覆盖**：外部厂商真实送达（方向明令不验证） |
| G3b | 引擎实例创建与 `sw_bpm_instance`/触发行写回之间存在崩溃窗口（engine-only 孤儿） | 修复位置：`sw-biz/sw-bpm/sw-bpm-process/.../IotProcessTriggerListener#startProcessWithInstanceRecord`（发起 + 业务实例记录同事务）<br>证据：`raw/start-window-crash.log` | 三个共享窗口的入口（Scheduled FLOW、IoT 规则、IoT 脚本）在窗口内注入真实崩溃后：引擎实例 0、业务实例 0、engine-only 孤儿 0；各自生产恢复路径续跑后 **1 引擎实例 + 1 业务实例 + 1 可审计终态**，身份关联一致，零重复 | 真实 PostgreSQL + 真实 Flowable；故障点精确落在"引擎实例已创建、业务实例尚未落库"（流程 start 事件执行监听器）。**不覆盖**：设备侧物理送达 |

## 2. G3a · 提交边界的修复与行为结果

**根因（回执 02 已实测）**：引擎被绑到 `DynamicRoutingDataSource` 抽取出的物理 master DataSource，而应用事务由
路由 DataSource 管理；Spring 事务按 DataSource **实例身份**绑定连接，两者 `ConnectionHolder` 不同，于是引擎命令
在另一条连接上自行提交。

**修复**：引擎改绑**应用 DataSource 本身**，并把应用的 `PlatformTransactionManager` 交给引擎，使引擎命令按
REQUIRED 语义加入调用方事务（单一提交边界）。`@DS` 风险已评估：全仓生产代码**零** `@DS` 使用（仅一处注释），
不存在引擎被路由到非 master 的路径；一旦引入 `@DS` 必须重新评估，已写入代码注释。

| 场景 | 断言（含反向） | 结果（`raw/commit-boundary-behaviour.log`） |
|---|---|---|
| 正常提交 | 审批推进到下一节点；设备命令 / 通知 / 已订阅回调意图全部可追溯 | `normal-commit engineAdvancedToT2=1 deviceIntents=1 notifyIntents>0 callbackIntents=1 intentsMissing=0` |
| 显式回滚 | **引擎不推进**（停在原节点）；三类意图为零 | `explicit-rollback engineAdvancedToT2=0 deviceIntents=0 notifyIntents=0 callbackIntents=0` |
| 精确故障注入（引擎已写入、意图尚未写入） | 两侧同时消失；engine-only 孤儿为零 | `crash-window faultInjected=engine-written-intent-pending engineAdvancedToT2=0 deviceIntents=0 callbackIntents=0 engineOnlyOrphans=0` |
| 重启（新上下文）重放同一审批 | 引擎实例 1、下一节点任务 1、设备意图 1、回调意图 1，零重复 | `restart-replay engineInstances=1 t2Tasks=1 deviceIntents=1 callbackIntents=1 duplicateIntents=0` |

同一套断言在回执 02 快照上的对照（同一用例、同一日志字段）：`engineAdvancedToT2=true` → 本轮 `false`。
故障注入的实现是**终止承载该事务的 PostgreSQL 后端连接**（`pg_terminate_backend`），属进程级崩溃等价物：
PostgreSQL 立即回滚该连接上未提交的全部工作，因此结论不依赖应用事务管理器自身的回滚路径。

## 3. G3b · 启动窗口的修复与行为结果

**修复**：`IotProcessTriggerListener` 把"引擎发起 + 业务实例记录"放入同一事务（`TransactionTemplate`，事务管理器
缺失时**拒绝执行**而不是降级——降级会重新引入本方法要消除的窗口）。Scheduled FLOW 路径经 `ProcessStartService`
（方法级 `@Transactional`）天然同事务，本轮因 G3a 的单一提交边界才真正成立。

| 入口 | 窗口内崩溃后 | 恢复后（生产恢复路径） | 身份一致性 |
|---|---|---|---|
| Scheduled FLOW | `engineInstances=0 businessInstances=0 engineOnlyOrphans=0` | `flow-recovered commandStatus=COMPLETED engineInstances=1 businessInstances=1 retryCount=1`，重放返回 `SKIP_DUPLICATE` 且实例数不变 | 业务键 `sched-…`（由 jobId+fireTime 派生）与命令键、引擎实例一一对应 |
| IoT 规则 | `triggerStatus=FAILED engineInstances=0 businessInstances=0 engineOnlyOrphans=0` | `iot-rule-recovered engineInstances=1 businessInstances=1 triggerStatus=SUCCESS staleWritebackRejected=true` | 引擎业务键 = 稳定幂等键；`sw_bpm_instance.business_key = iot-{triggerId}`；触发行 `process_instance_id` 指向同一引擎实例 |
| IoT 脚本 | `engineInstances=0 businessInstances=0 engineOnlyOrphans=0` | `iot-script-recovered scriptId=9496 engineInstances=1 businessInstances=1 triggerStatus=SUCCESS` | 同上，且触发行保留 `script_id`（脚本来源可审计） |

反向断言：第三个恢复轮不再产生第二个引擎实例；**迟到的失败写回不得把 SUCCESS 降级为 FAILED**（实测
`staleWritebackRejected=true`），因此不存在"旧尝试覆盖新恢复结果"。

## 4. 受影响快照失效声明与重验范围

引擎绑定与流程启动路径发生变化，按提示第 3 节逐项声明：

| 上一轮快照 | 是否失效 | 处置 |
|---|---|---|
| G1 生命周期 / 双进程恢复 | 失效（流程启动路径变更，同一编排需在最终快照上复验） | **已重验**：`raw/lifecycle-behaviour.log` 7/7、`raw/restart-recovery.log` 1/1 |
| G2 流程类接缝（Scheduled FLOW / IoT 规则 / IoT 脚本 / 表单权威路径 / 通知意图） | 失效（审批与启动路径变更） | **已重验**：`raw/flow-seam-behaviour.log` 9/9 |
| G2 交付类接缝（设备命令 / 通知投递 / 回调） | 未受影响（不含引擎调用） | 仍重验同套件以对齐最终快照：`raw/delivery-seam-behaviour.log` 8/8 |
| G3 事务事实 | 失效（修复目标即此事） | **已重验并转为新结论**：`raw/flowable-tx-fact.log` 2/2，`engineAdvancedToT2=false` |
| G4 发布矩阵 / 零旁路 | 未失效（发布点与持久结构未变） | 仅复算脚本重跑确认 `ACCEPTED`（`unclassified-bypass-scan.txt`），未重做结论 |
| G5 V96 迁移 / H2·PG 全链 | 未失效（schema 与迁移链未变） | **未重做**（遵守"禁止无理由重做"） |
| G6 计数 | 失效（新增 6 个用例；全量计数变化） | 已给出最终快照计数（§5） |

## 5. 门禁与计数（只取实际命令输出）

| 范围 | 命令 | 结果（原始日志） |
|---|---|---|
| 全量门禁（最终快照） | `mvn -B -o test` | **BUILD SUCCESS；13 个模块合计 1536 tests，Failures 0 / Errors 0 / Skipped 0；13:43 min**（`raw/full-server-gate.log`） |
| 受影响模块 | `mvn -B -o -pl <module> test` | sw-common 32、**sw-bpm-engine 61**、sw-basic-job-biz 51、sw-basic-notify-biz 118、sw-basic-iot 50、sw-bpm-process 205、sw-biz-form-biz 159、sw-biz-openapi-biz 10（均 0/0/0） |
| 本轮直接证据 | 见 `command-results.tsv` | G3a `commit-boundary-behaviour` 3/3、G3b `start-window-crash` 3/3 |
| 受影响断言重验 | 同上 | tx-fact 2/2、flow-seam 9/9、delivery-seam 8/8、restart 1/1、lifecycle 7/7、rules-gate 7/7 |
| 计数复算口径 | `command-results.tsv` 逐条记录命令、cwd、退出码、耗时、日志与行数 | 19 条命令全部 `exit_code=0` |

计数变化：1530（回执 02 快照）→ **1536**（新增 G3a 3 例 + G3b 3 例）。**Phase 3 的 1493 仍为正式基线**；
Phase 4 未通过功能级验收前，1536 只作为已验证候选快照。

## 6. 秘密处理与证据身份

- 连接参数唯一来源仍是工作区外私有环境文件；两条采集脚本的命令文本只引用变量名，输出落盘前统一脱敏（值→占位符）。
- `secrets-scan.txt`：对证据包按**凭据上下文**（JDBC URL / `user=` / 口令字面量）扫描，四变量命中数均为 0 → `CLEAN`。
- 哈希与回读：`behavior-input.sha256` 245 项全部 `OK`（`check_exit=0`）；`evidence.sha256` 26 项全部 `OK`；进度指纹 = `evidence.sha256` 内容 SHA-256 前 16 位 `d4d0a4e43a33bb4c`。
- 工作树身份：`workspace-identity.txt`（工作区 `develop-sw@a46e4f3`；server 仓 `develop@76dc947`）。
- 固定验证库：`sw_p4_evidence`（本阶段专用隔离库，既有库未被触碰）。

## 7. 修改范围（本轮）

- `sw-biz/sw-bpm/sw-bpm-engine/.../BpmEngineAutoConfiguration.java`：引擎绑定应用 DataSource + 应用事务管理器（单一提交边界）。
- `sw-biz/sw-bpm/sw-bpm-process/.../IotProcessTriggerListener.java`：发起 + 业务实例记录同事务（新增事务管理器依赖）。
- `sw-biz/sw-bpm/sw-bpm-process/src/test/.../IotProcessTriggerListenerPolicyTest.java`：按新增构造参数更新测试装配（仅装配，不改断言语义）。
- 新增证据测试：`sw-bootstrap/src/test/.../phase4/Phase4PgCommitBoundaryBehaviourTest.java`（G3a）、`Phase4PgStartWindowCrashTest.java`（G3b）；`Phase4PgSupport` 增加精确故障注入助手。
- 陈旧日志标签修正：`Phase4PgTransactionFactTest` 的 `engineBoundary=independent` → `engineCommitBoundary=application-transaction`（**仅日志标签**，无断言或行为变化；为保持"门禁来自最后快照"，该用例与全量门禁均在标签修正后重跑）。
- 未触碰：发布矩阵、schema/迁移、既有回执与审查文件、前端子层；无 Git/发布动作。

## 8. 未完成项声明

- 本轮不存在授权内仍可执行的遗留项：G3a/G3b 的完成条件、必要反向断言均已以真实故障注入结果关闭。
- 如实声明不主张的部分：外部通知 Provider 真实送达（方向明令不验证）；`@DS` 引入后的引擎路由复核（当前零使用，属未来变更的前置条件，已写入代码注释）。
- 依方向第 8 节与提示第 8 节：执行自验不等于规划功能级验收；本回执**不写** `PASSED/COMPLETED`。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase4-reliable-business-events-03.md","evidence":["product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/command-results.tsv","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/commit-boundary-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/start-window-crash.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/flowable-tx-fact.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/flow-seam-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/delivery-seam-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/lifecycle-behaviour.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/restart-recovery.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/full-server-gate.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/raw/rules-gate.log","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/unclassified-bypass-scan.txt","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/behavior-input.sha256","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/evidence.sha256","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/secrets-scan.txt","product/backend-architecture-optimization/receipts/evidence/completion-phase4-03/workspace-identity.txt"],"feature_status":"VERIFYING","remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"请规划复核 completion-phase4-reliable-business-events-03.md：按 G3a/G3b 的完成条件与必要反向断言核对故障注入原始日志，并对 Phase 4 作功能级验收裁决。回执只提交执行自验结果，未写 PASSED/COMPLETED。","next_action_type":"WAIT_PLANNER","progress_fingerprint":"d4d0a4e43a33bb4c","progress_basis":{"files_changed":["sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/config/BpmEngineAutoConfiguration.java","sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListener.java","sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListenerPolicyTest.java","sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase4/Phase4PgCommitBoundaryBehaviourTest.java","sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase4/Phase4PgStartWindowCrashTest.java","sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase4/Phase4PgSupport.java","sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase4/Phase4PgTransactionFactTest.java"],"tool_actions":["真实 PostgreSQL 精确故障注入（pg_terminate_backend 终止承载事务的连接）：G3a 4 个场景 + G3b 3 个入口","mvn -B -o test（最终快照全量门禁：13 模块 1536 tests 全绿，13:43）","mvn -B -o -pl <module> test（8 个受影响模块全绿，含 sw-bpm-engine 61）","bash scripts/p4-publish-matrix.sh（零旁路 ACCEPTED）","bash scripts/freeze-phase4-evidence.sh（245 输入 + 26 证据哈希回读全 OK）"],"new_evidence":["evidence/completion-phase4-03/raw/*.log（17 份原始日志，脱敏）","evidence/completion-phase4-03/raw/commit-boundary-behaviour.log（G3a 提交边界四场景）","evidence/completion-phase4-03/raw/start-window-crash.log（G3b 三入口窗口崩溃恢复）","evidence/completion-phase4-03/command-results.tsv（19 条命令，exit 全 0）","evidence/completion-phase4-03/unclassified-bypass-scan.txt（ACCEPTED）","evidence/completion-phase4-03/secrets-scan.txt（CLEAN）","evidence/completion-phase4-03/{behavior-input,evidence}.sha256(+.check)"],"closed_work_items":["G3a 审批状态与设备命令/通知/回调意图的单一提交边界（正常提交、显式回滚、精确故障、重启重放）","G3b 引擎实例创建与业务实例记录窗口的崩溃恢复（Scheduled FLOW、IoT 规则、IoT 脚本三方各 1 且身份一致）","受影响快照失效声明与重验（G1/G2 流程类/G3 事务事实；G4/G5 未重做）","最终快照全量门禁与受影响模块回归 1536/0/0/0"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"postgresql","outcome":"SUCCEEDED","detail":"真实 PostgreSQL 14.24 固定隔离库：窗口/事务中途终止后端连接后，引擎与应用持久意图两侧同时回滚或同时提交；恢复后三方计数均为 1"},{"tool":"maven","outcome":"SUCCEEDED","detail":"最终快照 mvn -B -o test：13 模块 1536 tests，0 failures/0 errors/0 skipped，BUILD SUCCESS（13:43）；8 个受影响模块单独运行全绿"},{"tool":"bash","outcome":"SUCCEEDED","detail":"零旁路复算 ACCEPTED；哈希回读 245+26 项全 OK；秘密扫描 CLEAN"}],"browser_status":"NOT_APPLICABLE","formal_browser_acceptance":false,"work_items":[{"id":"G3a 审批状态与 must-deliver 意图单一提交边界","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"证据已提交（raw/commit-boundary-behaviour.log、raw/flowable-tx-fact.log）"},{"id":"G3b 引擎实例与业务实例记录窗口崩溃恢复","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"证据已提交（raw/start-window-crash.log，覆盖 Scheduled FLOW / IoT 规则 / IoT 脚本）"},{"id":"受影响快照失效声明与受影响断言重验","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"重验日志已提交；G4/G5 按提示要求未重做"},{"id":"最终快照受影响模块与全量门禁","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"1536/0/0/0，原始日志在 raw/module-*.log 与 raw/full-server-gate.log"},{"id":"证据哈希、秘密扫描与工作树身份","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"245+26 项回读 OK，扫描 CLEAN"}]}
