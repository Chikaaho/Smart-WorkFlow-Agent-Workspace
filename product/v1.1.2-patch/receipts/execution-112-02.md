# execution-112-02：1.1.2 阶段 3 返修（G1—G3）

方向 `product/v1.1.2-patch/ready/direction-v1.1.2.md`（L）｜执行（返修轮 1）｜2026-11-14｜依据 `planning-review-112-01.md` 与补充提示 `planning-execution-prompt-112-01.md`，两仓 `feature/1.1.2`。已锁定项（B1 接口四组/设计器按钮/入口评估、B2—B5、门禁）未重新验证，未改动其实现。

## 1. G1：取消后执行列表与详情状态不一致——根因、修复与复测

### 根因（补充提示要求的查清结论）

- **列表读的是结果执行行**：`GET /agent/graph-executions`（`AgentGraphExecutionController.page` → `pageExecutions`）读 `sw_agent_graph_execution`；**详情读的是受理行**：`GET /agent/graph-execution-lifecycle/executions/{id}`（requireOwned → `sw_agent_graph_execution_request`）。
- `cancel()` 此前只把**受理行**置 CANCELLED，对应**结果执行行**停留 `WAITING_HUMAN`（DB 核验：`2121512818611171329` WAITING_HUMAN 而受理行 `2121512818485342210` CANCELLED）→ 列表「等待人工」、详情「已取消」。
- **修复前按受理号取消同样存在此问题**（修复只改受理行，与用哪个编号无关）——审查指出的两行（设计器取消图 15:57:26、取消验证父图 15:55:51）均为 WAITING_HUMAN 取消路径的执行行。
- 取消接口地址与入参未改动（方向约束遵守）。

### 修复（Server `04049d08`）

`AgentGraphExecutionLifecycleServiceImpl.cancel()` WAITING_HUMAN 分支在受理行取消成功后调用新增 `markResultExecutionCancelled(resultExecutionId)`：结果执行行存在且非终态时同步置 CANCELLED（排队取消时执行行尚不存在，空操作；同步失败不回滚受理行终态，留日志）。测试 `AgentHumanTaskLifecycleTest` 补断言 `updateById` 携带 CANCELLED（7/7 通过）。

### 旧数据纠正（补充提示允许「纠正两条旧记录」）

以「受理行 CANCELLED 而执行行非终态」为口径全量对账，共 **4 行同因陈旧行**，逐一纠正并回读 CANCELLED：审查点名的两条（`2121512419015634946`、`2121512818611171329`）+ 同批遗留的 r1 行（`2121512416746516481`，同因同修）+ 他人取消图第一次运行行（`2121516047931650049`，见 §3 说明）。纠正后对账 **0 残留**。纠正范围仅限隔离库测试数据，演示环境未触碰。

### 复测（补充提示要求：受理号、执行编号各一次新取消 + 三处一致）

隔离环境（重启后运行返修 jar，18093/5275/iso112-pg 延续）：

| 次序 | 操作 | 接口 | 列表执行行（接口） | 详情页 |
|---|---|---|---|---|
| A | 新执行等待人工后按**受理号** `2121537906555338754` 取消 | code=0 **CANCELLED** | **CANCELLED**（`2121537907004129282`） | **已取消**，无耗时行，人工任务行**已关闭**（`g1-a-detail-top.png` / `g1-a-detail-tasks.png`） |
| B | 新执行等待人工后按**执行编号** `2121537909382299649` 取消 | code=0 **CANCELLED** | **CANCELLED**（`2121537909382299649`） | 同上口径（`g1-b-detail-*.png`） |
| C | 设计器按钮取消（G3 复测） | — | — | 设计器结果区「执行已取消」**无耗时行**（`g3-designer-cancelled.png`） |

- 列表截图 `g1-list-after-cancel.png`：新执行 A/B 两行与旧记录均为**已取消**（旧记录 15:55:50/15:55:51/15:57:26 三行已在第一屏外，DB 对账与接口核实其 CANCELLED；16:10:16 他人取消图行经纠正后亦为 CANCELLED）。
- 按 §2 要求重跑①②两组接口测试（G1 改动涉及 cancel()），结果 CANCELLED×2 如上；③④未重跑（未改动 requireOwned 归属/存在性路径）。

## 2. G2：「待我处理」3 条逐条核实

| 执行编号（列表显示） | 本次是否取消 | 受理行/任务状态（核实） | 是否还在待办 |
|---|---|---|---|
| `#2121512078710779905`（15:54:30） | **否**（脚本中断遗留，未执行过取消） | 受理行 `2121512078459121666`：任务 600s 超时（16:04:57 TIMEOUT）→ 按配置 timeoutKeyword 自动恢复 → **SUCCESS**（执行行 11ms） | 否（任务已非 PENDING） |
| `#2121512256402468865`（15:55:12） | **否**（同上） | 任务 16:05:27 TIMEOUT → 自动恢复 → **SUCCESS** | 否 |
| `#2121512507116990465`（15:56:12） | **否**（同上；即第一轮回测 r3） | 任务 16:06:27 TIMEOUT → 自动恢复 → **SUCCESS** | 否 |

- 三条都是**未取消**的测试执行（第一轮脚本在取消步骤前中断所遗留），不是「已取消仍显示」的缺陷；其人工任务按执行配置的 600s 超时自动恢复并已终结。
- 复测截图 `g1-list-after-cancel.png` 顶部「待我处理」区显示**暂无待处理任务**（DB 复核 `PENDING` 计数 = **0**）——已取消执行的任务零残留（既有 cancelPending 行为，第一轮 ①② 证据已锁定）。

## 3. G3：取消后「耗时 0ms」

- 根因：WAITING_HUMAN/排队取消路径不写 `latency_ms`（finish() 才写），前端空值显示为 0ms（设计器 `latencyMs ?? 0`、详情头部 `formatLatency(0)`）。
- 修复（Web `45a9340`，按提示「不显示耗时」选项）：**仅成功/失败展示耗时**——设计器结果区 `showExecutionLatency`、详情头部 `showHeaderLatency` 同一口径；取消/中断不显示。设计器单测同步更新（取消终态断言结果区不含「耗时」；运行中不显示耗时与成功/失败展示耗时的用例保持）。
- 证据：`g3-designer-cancelled.png`（设计器结果区无耗时行）、`g1-a-detail-top.png` / `g1-b-detail-top.png`（详情头部「已取消」无 0ms）。旧记录因口径为「不显示」自动一致，无需数据回填。

## 4. 范围外观察（如实登记，不在本轮处理）

1. 子执行行（列表中「取消验证子图」16:04—16:06 三行，父执行超时自动恢复后进入子图等待）显示等待人工：子执行行不在受理行簿上（W5 既有边界），详情按执行编号反查返回 404；属未取消测试执行的子执行自身状态，非取消链路缺陷。演示环境不删除、测试数据保留。
2. 执行列表「发生时间」ISO 原值显示：维持第一轮登记，候选待排期。
3. superadmin 跨租户取消语义：隔离复测中再次观察到 admin（系统超管，`CommonTenantLineHandler` 设计豁免）可取消其他租户执行；第一轮 ④ 的 404 证据来自同租户他人（t100admin 取消 t100nobody 的执行），结论不变。

## 5. 门禁与 CI

| 门禁 | 结果 |
|---|---|
| Server 目标测试（AgentHumanTaskLifecycleTest） | 7/7 通过（含 G1 新断言） |
| Server 全量 `mvn test -fae` | 全工程 **2,521 / 0 / 0 / 45**（sw-bootstrap 的 `IotNativeMqttDeferredDispatchPgTest` 在全量中报 zonky 内嵌 PG 环境错（`$libdir/plpgsql`，Windows 临时目录/文件锁类偶发，失败发生在 Flyway 种子前的基础设施层）；单独重跑 **3/3 通过**、BUILD SUCCESS。上一轮全量同模块亦 SUCCESS。非本轮改动引入（改动仅 agent 模块 cancel 路径）） |
| Web 四连 | typecheck 通过；lint 0 错误（56 警告均为 scripts/sw100-*.mjs 既有状态，CI 口径通过）；**2,102 passed / 3 skipped**；build 成功 |
| Server CI（最新提交 `04049d08`） | run **43578533350** **success** |
| Web CI（最新提交 `45a9340`） | run **43578572886** **success** |

## 6. 与补充提示验收标准逐项对照

| ID | 完成条件 | 实际 | 结论 |
|---|---|---|---|
| G1 | 查清原因并写进回执；两种编号各取消一次三处一致；旧记录已取消或说明 | §1 根因/修复/复测；A/B 三处一致（列表接口行 CANCELLED、详情已取消、设计器按钮路径同口径）；4 条陈旧行纠正后对账零残留 | **达成** |
| G2 | 逐条说明是否取消；已取消零残留；对照表+截图 | §2 对照表 3/3（均为未取消→超时自动恢复终结）；待我处理空（PENDING=0）截图 | **达成** |
| G3 | 真实耗时或不显示，两处一致；不出现与实际不符的 0ms | 选「不显示」：设计器+详情统一仅成功/失败展示；复测三张截图确认 | **达成** |
| 范围 | 未改取消接口地址/入参、未加迁移、未动已锁定项、未碰演示环境 | 符合；cancel() 内部同步执行行属修复所需，①②已按要求重跑 | **符合** |

## 7. 自验结论

G1—G3 返修自验通过（行为证据 + 门禁 + 两仓最新提交 CI success）。**总阶段数 7｜已完成 2（评估、实施）｜进行中 1（阶段 3 验收——第 2 轮回执提交，待规划验收）｜未开始 4（合并、发版、部署与同步、结束）**。

```text
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/v1.1.2-patch/receipts/execution-112-02.md","evidence":["product/v1.1.2-patch/receipts/execution-112-02.md",".runtime-v112/g1-list-after-cancel.png",".runtime-v112/g1-a-detail-top.png",".runtime-v112/g1-a-detail-tasks.png",".runtime-v112/g1-b-detail-top.png",".runtime-v112/g1-b-detail-tasks.png",".runtime-v112/g3-designer-cancelled.png"],"feature_status":"VERIFYING","browser_status":"OPERABLE","browser_evidence":{"tier":"ISOLATED_REGRESSION","headless":true,"artifacts":[".runtime-v112/g1-list-after-cancel.png",".runtime-v112/g1-a-detail-top.png",".runtime-v112/g1-a-detail-tasks.png",".runtime-v112/g1-b-detail-top.png",".runtime-v112/g1-b-detail-tasks.png",".runtime-v112/g3-designer-cancelled.png"],"url":"http://127.0.0.1:5275","viewport":"1920x900","identity":"admin（隔离环境测试账号）","object":"执行列表/执行详情（含人工任务行）/设计器结果区","network_index":"receipt section 1: A/B cancel responses + list rows"},"formal_browser_acceptance":false,"work_items":[{"id":"stage-4-merge","status":"PENDING","next_action":"两仓 feature/1.1.2 → develop → main 普通合并（CI 全 success 后删分支）","actionable":true,"authorized":true,"dependency_satisfied":false},{"id":"stage-5-release","status":"PENDING","next_action":"两仓 tag 1.1.2 + Release Latest + 发布说明 B1—B6","actionable":true,"authorized":true,"dependency_satisfied":false},{"id":"stage-6-deploy-sync","status":"PENDING","next_action":"演示环境部署与发布后同步（含 B6 展示图三仓）","actionable":true,"authorized":true,"dependency_satisfied":false}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 验收阶段 3 返修（回执 execution-112-02.md），通过后继续阶段 4 合并","next_action_type":"WAIT_PLANNER","progress_fingerprint":"execution-112-02:server-04049d08:web-45a9340:g1g2g3-fixed-passed","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server:AgentGraphExecutionLifecycleServiceImpl.java(+markResultExecutionCancelled)","Smart-WorkFlow-aPaaS-server:AgentHumanTaskLifecycleTest.java","Smart-WorkFlow-aPaaS-Web:GraphDesigner.vue(+spec)","Smart-WorkFlow-aPaaS-Web:ExecutionDetail.vue"],"tool_actions":["mvn full test -fae 2521/0/0/45 + flaky standalone rerun 3/3","pnpm typecheck/lint/test 2102/build","git commit+push both repos","gh-api CI runs success","playwright retest evidence","iso112-pg stale-row reconciliation (4 fixed, 0 left)"],"new_evidence":["G1 根因与修复：取消同步结果执行行","G1 复测 A/B 双编号三处一致截图","G2 三条待办对照表与空待办截图","G3 取消不显示耗时截图","旧数据对账零残留"],"closed_work_items":["G1-list-status-after-cancel","G2-pending-todo-after-cancel","G3-cancelled-duration"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"全量 -fae 2521/0/0/45（bootstrap zonky 偶发单独重跑 3/3）"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"typecheck/lint/test 2102/build 全绿"},{"tool":"gh-api","outcome":"SUCCEEDED","detail":"server run 43578533350 success; web run 43578572886 success"},{"tool":"playwright","outcome":"SUCCEEDED","detail":"G1/G3 复测 6 张视口截图 + A/B 双编号取消接口与列表行核验"}]}
```
