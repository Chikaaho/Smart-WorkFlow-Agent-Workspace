# backend-api-optional-contract · 完成回执 02（G1 收口）

> 角色：执行（Executor）  
> 日期：2026-09-24T11:24:26+08:00  
> 任务等级：XL  
> 处置范围：**仅 G1**（`planning-review-completion-01-verifying.md` §3 唯一剩余缺口）  
> 前序：`completion-backend-api-optional-contract-01.md`、`…-evidence-supplement-01.md`（保持原样，未覆盖）  
> 新证据目录：`product/backend-api-optional-contract/receipts/evidence/completion-02/`（18 个文件，全部可从 `product/` 回读）  
> 机器终态：`EXECUTION_SUBMITTED`（自验通过，待规划复验；不表示功能 `PASSED/COMPLETED`）

## 1 G1 处置结论

| G1 完成条件 | 结论 | 证据 |
|---|---|---|
| 1 生成唯一、完整、可复算的忽略返回值清单，闭合 6/8 数量差异 | 达成 | §2（6 = 原始终出；8 = 摘要误加旧轮次条目；**权威全量 27 处**） |
| 2 所有忽略 Optional 的生产调用均显式处理：可能 empty 者处理 empty，恒 present 者显式断言 | 达成 | §3（27 处：1 处显式 empty 分支 + 26 处 `orElseThrow` 断言） |
| 3 不得用 `get()` / `orElse(null)` / 哨兵 / 空集合 / catch 后 empty 规避；真实异常继续传播 | 达成 | §3 约束核对；未新增任何 catch；扫描第 1-11 节 0 违规 |
| 4 AM-107 提供 present、empty 两条调用方行为证据 | 达成 | §6（`DynamicBranchTaskListenerPortOutcomeTest` 3/0/0/0：APPLIED / ALREADY_APPLIED / empty） |
| 5 更新后的消费者扫描以 exit 0 证明忽略为 0 | 达成 | §5 C3：`返回值被忽略的生产调用点总数: 0`，exit 0（判据已收紧为**任意忽略即 exit 1**） |
| 6 重存受影响测试、test-compile、消费者扫描与全量门禁的原始输出/退出码/计数/新哈希 | 达成 | §5、§9（4 项命令 + 313 条输入哈希 + 16 条证据哈希） |

## 2 清单闭合（6 / 8 / 27）

| 来源 | 条目 | 说明 |
|---|---|---|
| completion-01 扫描原始输出 | **6** | `recordAction`×1、`recordBranch`×1、`NotifyFacade#send`×2、`ParticipantSnapshotRecorder#record`×2 |
| completion-01 补充回执摘要 | **8** | 上述 6 处**误加**上一轮扫描遗留的 `delegateTask`、`resumeProcessInstance`、`validateSubmission`（汇总侧错误） |
| 本轮权威清单 | **27** | 6 + 21（completion-01 扫描器未覆盖的真实忽略点） |

**两类扫描器假阴性（根因）**：

1. **注释噪声**：语句窗口把含 `=` 的说明注释当代码 → 已改为“先剥离注释再判定”；
2. **语句边界**：`window.split(";")[-1]` 对以 `;` 结尾的语句恒判“未结束”，窗口吞入**下一条语句**的消费标记 → 已改为**括号/方括号深度感知的语句切分**。

**判据收紧**：原判据只对“可能 empty 且被忽略”失败，导致 9 处恒 present 的忽略仍打印 PASS；现改为**任意忽略即 exit 1**，使 “exit 0 ⇔ 忽略 0 处” 严格成立。

## 3 修复内容（27 处，全部显式消费）

- **AM-107（1 处，可能 empty）**：`DynamicBranchTaskListener#recordBranchAction`
  → `Optional<MutationOutcome> recorded = port.recordAction(...)`，`isEmpty()` 时 **WARN「动态分支动作未落账：分支快照尚未冻结」**，
  present 时区分 `ALREADY_APPLIED`（debug，未产生第二次效果）与 `APPLIED`；未冻结分支不再被静默当作成功。
- **恒 present（26 处）**：统一追加 `.orElseThrow(() -> new IllegalStateException("<契约类型>#<方法> 契约恒 present，empty 属契约违约"))`
  —— 契约违背时不静默通过，且不改变任何业务分支。
  分布：`BpmTaskFacade` 12 处（`terminateProcess`×4、`setAssignee`×3、`setVariable`、`suspendProcessInstance`、`resumeProcessInstance`、`delegateTask`、`returnTask`）、
  `BpmDeployFacade` 3 处（`suspendProcessDefinition`×2、`activateProcessDefinition`）、
  `ParticipantSnapshotRecorder#record` 3 处、`NodeActionAuditPort#recordBranch` 2 处、`NotifyFacade#send` 2 处、
  `DynamicBranchPort#closeRemaining` 1 处、`FormDataSubmitFacade#validateSubmission` 1 处、`StorageFacade#delete` 1 处。
- **约束核对**：未使用 `get()`；无 `orElse(null)`；无哨兵；无用空集合/空 Map 兜底；未新增 catch（真实异常继续沿既有异常边界传播）。
- **测试侧同步（仅测试代码，因新断言暴露空桩）**：`BpmUrgeServiceTest`（`send` 桩）、`BpmHandoverServiceTest`（`setAssignee` 桩）、
  `BpmDraftControllerTest`（`validateSubmission` 桩）、`BpmTodoControllerTest`（`terminateProcess` 桩）。
- **新增行为测试**：`DynamicBranchTaskListenerPortOutcomeTest`（3 例，见 §6）。

## 4 修改文件（本轮 18 个：production 13 + test 5）

production：

| 文件 | 摘要 |
|---|---|
| `bpm-engine/.../listener/DynamicBranchTaskListener.java` | AM-107 显式消费（empty→WARN / present→区分幂等）+ 新增 logger |
| `bpm-engine/.../listener/ConsensusTaskListener.java` | `snapshotRecorder.record` 显式断言 |
| `bpm-engine/.../listener/ApprovalTaskListener.java` | `snapshotRecorder.record`（展示名重载）显式断言 |
| `bpm-engine/.../delegate/BpmBranchConditionEvaluator.java` | `auditPort.recordBranch` ×2 显式断言 |
| `bpm-process/.../impl/BpmProcessDefServiceImpl.java` | 定义挂起/激活 ×3 显式断言 |
| `bpm-process/.../impl/ApprovalLifecycleServiceImpl.java` | `setAssignee`/`delegateTask`/`terminateProcess`×3/`closeRemaining` 显式断言 |
| `bpm-process/.../impl/BpmMonitorServiceImpl.java` | 实例挂起/恢复/转办 显式断言 |
| `bpm-process/.../impl/BpmHandoverServiceImpl.java` | 交接转办 显式断言 |
| `bpm-process/.../impl/BpmUrgeServiceImpl.java` | 催办通知发送 显式断言 |
| `bpm-process/.../service/TaskActionService.java` | 退回/驳斥终止/变量写入 显式断言 |
| `bpm-process/.../service/DraftSubmitService.java` | 提交前校验 显式断言 + 注释同步 |
| `bpm-process/.../listener/BpmNotifyListener.java` | 流程通知发送 显式断言 |
| `sw-basic-storage-biz/.../controller/StorageController.java` | 删除结果显式断言（对外仍统一 `R.ok()`） |

test：`DynamicBranchTaskListenerPortOutcomeTest`（新增）、`BpmUrgeServiceTest`、`BpmHandoverServiceTest`、`BpmDraftControllerTest`、`BpmTodoControllerTest`。

**`-api` 契约零改动**（与 completion-01 输入哈希逐文件比对：116 个 `-api` 文件哈希完全一致）→ 121 项处置与账本不受影响，无需重做账本探索。

## 5 实际命令与原始结果

| # | 命令（cwd = `Smart-WorkFlow-aPaaS-server`） | 退出码 | tests/failures/errors/skipped | BUILD |
|---|---|---|---|---|
| C1 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test-compile` | 0 | （编译，无测试） | SUCCESS |
| C2 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test -pl sw-biz/sw-bpm/sw-bpm-engine -Dtest=DynamicBranchTaskListenerPortOutcomeTest -DfailIfNoTests=false` | 0 | 3/0/0/0 | SUCCESS |
| C3 | `python3 <evidence>/scripts/scan-optional-consumers.py /usr/local/projects/Smart-WorkFlow` | **0** | 忽略 0 处（174 个调用点全部消费） | — |
| C4 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process,sw-basic/sw-basic-storage/sw-basic-storage-biz` | 0 | 295/0/0/0（61+205+29） | SUCCESS |
| C5 | `MAVEN_OPTS="-Xmx2g" mvn -B test`（仓库根全量） | 0 | **1460/0/0/0** | SUCCESS |

全量逐模块：Common 32、Security 17、Storage 29、Notify 118、Job 51、IoT 50、Agent 346、System 305、Form 133、BPM Engine **61**、BPM Process 205、OpenAPI 10、Bootstrap 103 = **1460**（较 completion-01 的 1457 增加 3，即新增 AM-107 测试）。

## 6 AM-107 调用方行为证据（present / 幂等 / empty）

`sw-biz/sw-bpm/sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/listener/DynamicBranchTaskListenerPortOutcomeTest.java`（3 例全绿）：

| 用例 | 端口返回 | 断言 |
|---|---|---|
| `presentOutcomeIsConsumedWithoutUnrecordedWarning` | `Optional.of(APPLIED)` | 端口以预期参数被调用一次；WARN 中**不含**“未落账” |
| `alreadyAppliedOutcomeIsRecognizedAsIdempotent` | `Optional.of(ALREADY_APPLIED)` | 同上（幂等重复不视为未落账） |
| `emptyOutcomeIsReportedInsteadOfSilentlyTreatedAsSuccess` | `Optional.empty()` | WARN **包含**「动态分支动作未落账」「分支快照尚未冻结」及 nodeKey/action 上下文 → 未冻结分支不会被静默当作成功 |

## 7 与方向/审查的偏差、未完成项与风险

1. **发现并修复了 completion-01 扫描器的两处假阴性**（注释噪声、语句边界），因此权威清单由 6/8 扩为 **27**；这不是方向变更，而是把“唯一完整清单”做实。若规划认为该扩项超出 G1 授权，可指示回退——但回退会使 21 处真实忽略重新暴露。
2. **修复面超出 completion-01 回执中列出的方法**：因 v7 语句切分又发现 9 处（含 `returnTask`、`closeRemaining`、`validateSubmission`、`StorageFacade#delete`），
   已一并按 G1 条件 2 处理；未改变任何业务分支或对外语义（控制器响应形状不变）。
3. **计数口径变化**：调用点总数由 183 → **174**（语句切分后每条语句计 1 次，消除多行重复计数）；已在证据 §7 说明。
4. **判据收紧**：消费者扫描现为“任意忽略即 exit 1”，比 G1 条件 5 的字面要求更严（不区分 empty 是否可达）。
5. **未完成/未做**：未启动 BAO-01—BAO-10；未处理 Phase 2；未改 `-api` 契约、账本、功能状态；未写 `memory/`；未执行 Git 写动作或发布。
6. **风险**：新增的 `orElseThrow` 断言在“契约被违反”时会快速失败（设计如此）；测试桩已同步，全量门禁 1460/0/0/0 证明当前无违约路径。
   互斥规则与 Owner 指令的冲突沿用 completion-01 记录（前端 dev 进程未被操作，后端命令串行、2G 上限）。

## 8 Git diff 摘要与边界

- 仓库 `Smart-WorkFlow-aPaaS-server`，分支 `develop`，HEAD 仍为 `76dc947`（本轮**零提交**）；工作树 tracked 修改 194 个 + untracked 17 个文件（含本轮新增测试），`git diff --shortstat` = 194 files, +3238/−1763（与 `evidence/completion-02/workspace-identity.txt` 实测一致）。
- 本轮相对 completion-01 的输入变化：**18 个文件**（13 production + 5 test），`-api` 契约 0 变化（逐文件哈希比对）。
- 未改动：数据库迁移、HTTP 路由注解、前端仓库、功能数/P 编号/发布状态；未 commit/push/merge/tag/Release/部署。

## 9 证据文件与哈希索引

- 清单：`product/backend-api-optional-contract/receipts/evidence/completion-02/evidence.sha256`（16 条有效条目）；校验：`product/backend-api-optional-contract/receipts/evidence/completion-02/evidence-sha256-check.txt` → **16/16 OK、0 FAILED、exit 0**
- 行为输入：`product/backend-api-optional-contract/receipts/evidence/completion-02/behavior-input.sha256`（313 条）；校验：`product/backend-api-optional-contract/receipts/evidence/completion-02/behavior-input-sha256-check.txt` → **313/313 OK、0 FAILED、exit 0**
- 命令汇总：`product/backend-api-optional-contract/receipts/evidence/completion-02/command-results.tsv`（C1/C2/C4/C5 的退出码与精确计数）

| 文件 | 用途 | SHA-256（前 16 位） |
|---|---|---|
| `affected-modules-test.log` | 受影响模块回归：engine+process+storage（295/0/0/0） | `3cf8323854b26e25…` |
| `am107-caller-behavior.log` | AM-107 调用方行为测试（3/0/0/0） | `bd21a796b8746858…` |
| `behavior-input-sha256-check.txt` | 行为输入哈希回读（313/313 OK） | `a1e24f9cb3ecf116…` |
| `behavior-input.sha256` | 行为输入 SHA-256 清单（新固定点，313 条） | `ff0e91b77a9f9135…` |
| `command-results.tsv` | 4 项命令的命令/目录/起止/退出码/计数/BUILD 结论 | `c2c71b80cb65de74…` |
| `consumer-scan-remediation.txt` | G1 核心证据：清单闭合、两类假阴性根因、27 处修复表、扫描器迭代、修复后 exit 0 | `72e77bbd21ee1c3d…` |
| `evidence-sha256-check.txt` | 证据包哈希回读（16/16 OK） | `（清单外）` |
| `evidence.sha256` | 证据包哈希清单（16 条） | `（清单外）` |
| `forbidden-pattern-scan.txt` | 禁止模式扫描（新输入，exit 0） | `59e40b4eaa307753…` |
| `full-maven-test.log` | 仓库根全量门禁 mvn -B test（1460/0/0/0） | `929f0c71b4f8a8ba…` |
| `resource-mutex-check.txt` | 前后端互斥检查（本轮，沿用 completion-01 处置依据） | `625fde6f4a7e250f…` |
| `scripts/explain-hits.py` | 命中分类脚本 | `22c76922d50ec469…` |
| `scripts/run-logged.sh` | 命令记录器（pipefail + tee + PIPESTATUS） | `ecb6be334224495d…` |
| `scripts/scan-forbidden.py` | 禁止模式扫描脚本 | `1f0a6d0770065cce…` |
| `scripts/scan-optional-consumers.py` | 消费者扫描（v7：括号深度语句切分；任意忽略即 exit 1） | `d88467f7f8f92794…` |
| `scripts/summarize-runs.py` | 命令结果汇总脚本 | `429bd28ee6f46b9a…` |
| `test-compile.log` | 全仓 mvn -B -o test-compile（exit 0） | `97f6e38e98ac496c…` |
| `workspace-identity.txt` | 分支/HEAD/工作树计数/本轮涉及文件 | `4f662cc4fa080aaa…` |

## 10 本轮是否修改了代码

**是，且仅限 G1 范围**：production 13 个文件（`bpm-engine` 4、`bpm-process` 8、`sw-basic-storage-biz` 1）+ test 5 个文件（4 个测试桩同步 + 1 个新增行为测试）。
未修改 `-api` 契约、121 项账本、守门实现、数据库迁移、POM、前端仓库；未写 `memory/`，未写 `PASSED/COMPLETED`，未执行 Git 写动作或发布。

## 11 机器终态

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-api-optional-contract/receipts/completion-backend-api-optional-contract-02.md","evidence":["G1 清单闭合：权威 27 处忽略调用（6 = completion-01 原始输出；8 = 摘要误加旧轮次条目；21 处为扫描器两类假阴性漏报），逐处位置、empty 可达性与修复方式见 evidence/completion-02/consumer-scan-remediation.txt","G1 修复完成：27 处全部显式消费（AM-107 显式 empty 分支 + WARN；26 处 orElseThrow 显式断言）；无 get()/orElse(null)/哨兵/空集合/catch-empty","消费者扫描 exit 0：174 个生产调用点全部消费、忽略 0 处（判据收紧为任意忽略即 exit 1）","AM-107 行为证据：DynamicBranchTaskListenerPortOutcomeTest 3/0/0/0（APPLIED / ALREADY_APPLIED / empty→WARN 未落账）","回归与门禁：test-compile exit 0；受影响模块 295/0/0/0；仓库根全量 mvn -B test 1460/0/0/0 BUILD SUCCESS（较上轮 +3 为新增 AM-107 测试）","新输入身份与哈希：HEAD 仍 76dc947（零提交）；-api 契约 116 文件哈希零变化；行为输入 313/313 OK、证据包 16/16 OK，均 exit 0"],"feature_status":"VERIFYING","work_items":[{"id":"g1-authoritative-ignored-list","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复核清单唯一性与完整性"},{"id":"g1-callsite-remediation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复核 27 处显式消费写法"},{"id":"g1-am107-caller-evidence","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复核 present/empty 两条行为证据"},{"id":"g1-consumer-scan-exit0","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复算扫描 exit 0 与忽略 0 处"},{"id":"g1-regression-and-hashes","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复算测试计数与哈希"},{"id":"planner-reverification","status":"PENDING","authorized":false,"dependency_satisfied":false,"actionable":false,"next_action":"规划按 G1 完成条件复验并裁决标准 7"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"规划（Planner）按 planning-review-completion-01-verifying.md §3 的 G1 六项完成条件复验本回执，并裁决方向 §7 标准 7 是否可锁定","next_action_type":"WAIT_PLANNER","progress_fingerprint":"bapi-optional-xl-20260924-completion-02-g1-closed","progress_basis":{"files_changed":["production 13：bpm-engine listener/delegate 4、bpm-process service/impl/listener 8、sw-basic-storage-biz StorageController 1","test 5：DynamicBranchTaskListenerPortOutcomeTest（新增）、BpmUrgeServiceTest、BpmHandoverServiceTest、BpmDraftControllerTest、BpmTodoControllerTest","证据：product/backend-api-optional-contract/receipts/evidence/completion-02/（18 个文件）"],"tool_actions":["消费者扫描脚本迭代至 v7（注释剥离 + 括号深度语句切分 + 任意忽略即 exit 1）并复扫","4 项 Maven/扫描命令串行执行并落盘（pipefail + tee + PIPESTATUS）","sha256sum 生成并回读行为输入（313）与证据包（16）清单"],"new_evidence":["权威忽略清单 27 处并逐处修复；扫描 exit 0 且忽略 0 处","AM-107 present/幂等/empty 三条调用方行为证据 3/0/0/0","全量门禁 1460/0/0/0；-api 契约 116 文件哈希零变化（账本不受影响）"],"closed_work_items":["g1-authoritative-ignored-list","g1-callsite-remediation","g1-am107-caller-evidence","g1-consumer-scan-exit0","g1-regression-and-hashes"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash:mvn -B test","outcome":"SUCCEEDED","detail":"exit 0；1460 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS"},{"tool":"Bash:mvn -B -o test-compile","outcome":"SUCCEEDED","detail":"exit 0；全仓 main+test 编译通过"},{"tool":"Bash:scan-optional-consumers.py","outcome":"SUCCEEDED","detail":"exit 0；174 个生产调用点全部显式消费，忽略 0 处"},{"tool":"Bash:sha256sum -c","outcome":"SUCCEEDED","detail":"behavior-input 313/313 OK、evidence 16/16 OK，均 exit 0"}],"browser_status":"NOT_APPLICABLE"}
