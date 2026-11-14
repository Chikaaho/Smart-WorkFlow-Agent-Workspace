# execution-112-01：1.1.2 补丁实施与隔离环境验收（阶段 1—3）

方向 `product/v1.1.2-patch/ready/direction-v1.1.2.md`（L）｜执行｜2026-11-14｜两仓 `feature/1.1.2`（Server 自 `8481fc55`、Web 自 `a98d720` 的 develop 切出）。

## 0. 阶段 1 评估结论：取消各入口传哪个编号（方向 §3 要求，写入第一份回执）

| 入口 | 传参事实 | 结论 |
|---|---|---|
| 设计器「取消执行」按钮 | `GraphDesigner.vue` `handleCancelExecution()` 用 `executeResult.executionId`，即 submit 受理响应的 `accepted.executionId`（受理号）。模板注释明示「executionId 保留受理编号用于取消」（GraphDesigner.vue:1493/1025） | 传受理号，修复前已能取消成功 |
| 待办（执行列表「待我处理」） | `ExecutionList.vue` 待我处理卡片只有「处理」入口（HumanTaskSubmitDialog），全仓 `cancelGraphExecution` 仅设计器一处调用 | 无取消入口，不受影响 |
| 执行详情页 | `ExecutionDetail.vue` 无取消按钮（仅人工任务提交入口） | 无取消入口，不受影响 |
| 服务端 | `AgentGraphExecutionLifecycleServiceImpl.cancel()` 用 `requireOwned` 解析双编号（W5），但后续 `cancelQueued/cancelWaiting/requestRunningCancellation/cancelPending/runningThreads/appendEvent` 全部用**原始入参**——按执行编号调用时 UPDATE 命中 0 行，接口 200 静默无效（P71 缺陷本体） | 已修复：变更统一落在受理行 id（与 `submitHumanTask` 的 W5 修复同模式） |

补充：不存在/他人编号由 `requireOwned` 抛 `NOT_FOUND`（错误码 404 `common.not_found`），修复前即已是「明确错误」，本次验证保持不变。

## 1. 修改内容与文件

### Server（`Smart-WorkFlow-aPaaS-server`，分支 feature/1.1.2，2 个 commit）

| commit | 文件 | 摘要 |
|---|---|---|
| `dcad9ec5` fix(agent) | `AgentGraphExecutionLifecycleServiceImpl.java` | B1/P71：`cancel()` 解析 `requestId = current.getId()` 后全部变更（cancelQueued/cancelWaiting/cancelPending/requestRunningCancellation/runningThreads/appendEvent/最终 toDto）改用受理行 id，执行编号取消不再静默无效 |
| 同上 | `AgentHumanTaskLifecycleTest.java` | 新增用例 `cancelByResultExecutionIdResolvesRequestRow`（P71 回归：按执行编号 900L 取消，断言变更落在受理行 5L、900L 零命中），7/7 通过 |
| `beb6f250` feat(bpm) | `BpmRuntimeFacade.java`（api） | B5：新增 `getActiveActivityNames(processInstanceId)` 契约（activityId→名称映射，未登记名称不进映射，调用方回退 id） |
| 同上 | `BpmRuntimeFacadeImpl.java`（engine） | 实现：活跃节点 id + 部署版本 BPMN 模型递归解析（含子流程容器）名称；实例无运行期记录/模型不可读时 empty（与 getActiveActivityIds 同容错口径） |
| 同上 | `BpmRuntimeFacadeImplTest.java` | 新增 `GetActiveActivityNamesTests` 5 用例（正常解析+无 name 不进映射+子图递归、空活跃、null/blank、实例缺失、异常容错），5/5 通过 |
| 同上 | `BpmMonitorService.java`（process） | `InstanceMonitorView` 增加 `activeNodeNames`（Map<String,String>） |
| 同上 | `BpmMonitorServiceImpl.java` | 监控行组装时经新 facade 方法填充 activeNodeNames |

### Web（`Smart-WorkFlow-aPaaS-Web`，分支 feature/1.1.2，2 个 commit）

| commit | 文件 | 摘要 |
|---|---|---|
| `b0e5114` fix(web) | `GraphDesigner.vue` | B2：新增 `executionTerminal`（空状态=旧同步结果视为终态；RUNNING/QUEUED 非终态）；alert 标题 RUNNING→「运行中」、QUEUED→「等待」（info 样式），不再落入「执行失败」；耗时行仅终态展示（运行中不再出现「耗时 0ms」） |
| 同上 | `ExecutionDetail.vue` | B3：状态映射补 QUEUED（等待）/CANCELLED（已取消）/INTERRUPTED（已中断）；人工任务状态标签中文化（已提交/已关闭/已超时） |
| 同上 | `ExecutionList.vue` | B3：状态映射补 QUEUED/CANCELLED/INTERRUPTED；B4：失败分类列改经 `failureCategoryLabel` 显示中文名、悬浮 tooltip 显示原值（未登记分类回落原值且关闭悬浮） |
| 同上 | `src/modules/agent/utils/error-category.ts`（新增）+ spec | B4：15 类失败分类线值→权威文案键映射（STEP_LIMIT/GRAPH_TIMEOUT/LOOP_LIMIT/UNDEFINED_VARIABLE/INPUT_MISSING/HUMAN_PAUSE/HUMAN_TIMEOUT/CONDITION_NO_MATCH/TOPOLOGY_INVALID/MODEL_CALL_FAILED/TOOL_CALL_FAILED/KNOWLEDGE_RETRIEVAL_FAILED/CAPACITY_REJECTED/GRAPH_EXECUTION_FAILED/SERVICE_RESTART/UNKNOWN），与 AgentGraphInterpreter ERROR_CATEGORY_* 及生命周期写入分类同源 |
| 同上 | `src/foundation/i18n/enum-label.ts` | B3：WORKFLOW_INSTANCE 注册表补 FAILED（失败）/WITHDRAWN（已撤回）/DISCARDED（已废弃），与后端 InstanceStatusEnum 及流程模块既有页面文案一致 |
| 同上 | `src/modules/workflow/api/i4.ts` + `InstanceMonitor.vue` | B5：MonitorInstance 契约加 `activeNodeNames`；监控页「当前节点」列优先显示名称（`displayActiveNodes`），名称缺省回退编码 |
| 同上 | `src/foundation/mock/handlers.ts` | mock 监控行补 activeNodeNames（dev:mock 保真） |
| 同上 | `src/locales/zh-CN.ts` / `en-US.ts` | 新增 `agent.executionInterrupted`、`agent.humanTaskStatusSubmitted/Cancelled/Timeout`、16 个 `agent.failureCategory*` 键（中英同步） |
| 同上 | `GraphDesigner.spec.ts` / `error-category.spec.ts`（新增） | B2 回归用例「运行中显示运行中（info），不出现失败文案与耗时 0ms」；失败分类映射单测 2 用例 |
| `97104b1` fix(web) | `ExecutionDetail.vue` + locales | B3：人工任务行状态标签 `humanTaskStatusLabel()`（PENDING→待处理、SUBMITTED→已提交、CANCELLED→已关闭、TIMEOUT→已超时；未登记回落原值） |

## 2. 验证与证据（隔离环境 + 机器门禁）

### 机器门禁

| 门禁 | 命令 | 结果 |
|---|---|---|
| Server 编译 | `MAVEN_OPTS="-Xmx2g" mvn -q compile -DskipTests` | EXIT=0 |
| Server 目标测试 | `mvn -q test -Dtest='AgentHumanTaskLifecycleTest'` | 7/7 通过（含 P71 新用例） |
| Server 门面/监控测试 | `mvn -q test -Dtest='BpmRuntimeFacadeImplTest,BpmMonitorServiceImplTest'` | 门面嵌套 4+5+5 全通过（GetActiveActivityNamesTests 5/5），监控 2/2 |
| Server 全量 | `MAVEN_OPTS="-Xmx2g" mvn test -fae` | **BUILD SUCCESS：全工程 2,521 tests / 0 failures / 0 errors / 45 skipped**（surefire 报告聚合） |
| Server CI（feature 分支） | run `43570063124` @ `beb6f250` | **success**（https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/actions/runs/43570063124） |
| Web 四连 | `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` | typecheck 通过；lint 0 错误 0 警告；**2,102 passed / 3 skipped**（含新增 B2 与分类映射用例）；build 成功（5.66s） |
| Web CI（feature 分支） | run `43572953530` @ `97104b18` | **success**（https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/actions/runs/43572953530） |

### 隔离环境实测（隔离 Server 18093 dev profile + 隔离库 iso112-pg@5433 + 隔离 Redis 56379 + 隔离 Vite 5275 `--strictPort`；未碰用户 8080/5173、5432、6379 与本机现有库）

隔离栈：`bootstrap-dev.jar`（revision=1.1.2，dev profile，`SW_DEV_DB_*` 指向 iso112-pg 全新迁移链）+ `pnpm exec vite --port 5275 --strictPort`（`VITE_PROXY_TARGET=http://localhost:18093`）。测试账号线：admin（默认租户，superadmin）、t100admin/t100nobody（I5测试租户 dev 夹具，为所有权验证给 t100nobody 授予 t100_admin 角色）。

**B1 取消（P71）— 接口响应四组 + 级联：**

| 组 | 操作 | 实际结果 |
|---|---|---|
| ① 受理号取消 | 父图 WAITING_HUMAN，`POST /executions/{受理号}/cancel` | HTTP 200 code=0，status **CANCELLED**；任务 `2121512416926871554` PENDING→**CANCELLED**（API `human-tasks` 前后对照） |
| ② 执行编号取消 | 人工提交 A 后子执行等待，`POST /executions/{执行编号 2121512419015634946}/cancel` | HTTP 200 code=0，status **CANCELLED**；DB 核验（iso112-pg）：子执行行 `2121512421108592641`（parent=…4946）**CANCELLED**，父受理行 `2121512418889805825` CANCELLED；父行任务 A=SUBMITTED、子图任务=**CANCELLED**（均已关闭，无 PENDING 残留） |
| ③ 不存在的编号 | `POST /executions/999999999/cancel` | code=**404** `common.not_found`（「请求的资源不存在或已被删除…」），data null，无副作用 |
| ④ 别人的编号 | t100nobody 创建执行，t100admin（同租户他人）取消其执行编号 | code=**404** `common.not_found`，data null，执行未被取消 |

- 设计器「取消执行」按钮实测：设计器内运行 → 等待人工卡片出现 → 点「取消执行」→ 状态 tag/结果区变「执行已取消」，API 复核 CANCELLED、任务 CANCELLED。截图 `b1-r3-designer-waiting.png`（等待态：取消按钮可见）、`b1-r3-designer-cancelled.png`（取消后）。
- 取消后详情截图：`b1-detail-cancelled.png`（执行编号 `#2121512818611711329`、状态 **已取消** 中文 tag；人工任务行 **已关闭** 中文标签）。
- 附注：admin 为系统超管（`CommonTenantLineHandler` 设计语义：superadmin 读可见全部租户、不追加租户条件），跨租户取消 t100admin 的执行返回成功属既有设计行为，非本次改动引入；普通用户同租户他人编号按上表 ④ 拒绝。

**B2 运行中误显示失败（P70）：** 不可达模型图（OPENAI_CHAT 供应商 baseUrl `http://10.255.255.1:9`，timeoutSeconds=15）设计器内运行：运行中结果区显示 **「运行中」**（info，无失败文案、无耗时行）→ 终态显示「执行失败 + 原因 + 耗时 5317ms」。截图 `b2-designer-running.png` / `b2-designer-failed.png`（同一次运行的两张）。开始新运行清空上次结果（`handleExecute` 既有 `executeResult=null`，回归保持）。

**B3 状态中文（P70）：** 执行详情/列表 CANCELLED→**已取消**（`b1-detail-cancelled.png`、`b4-execution-list.png` 可见）；实例监控 DISCARDED→**已废弃**（作废后 `b3-monitor-discarded.png`，页面无 DISCARDED 英文残留）。状态映射对照表（本次实现口径）：

| 原值 | 中文 | 位置 |
|---|---|---|
| QUEUED | 等待 | 执行列表/详情（agent.nodeStatusWaiting） |
| RUNNING | 运行中 | 执行列表/详情/设计器（common.statusRunning） |
| WAITING_HUMAN | 等待人工 | 既有键保留 |
| SUCCESS | 成功 | 既有键保留 |
| FAILED | 失败 | 既有键保留（实例同） |
| CANCELLED | 已取消 | 执行列表/详情（workflow.runtimeStateCancelled） |
| INTERRUPTED | 已中断 | 执行列表/详情（新键 agent.executionInterrupted） |
| WITHDRAWN | 已撤回 | 实例监控枚举注册表（与 MyInstances 一致） |
| DISCARDED | 已废弃 | 实例监控枚举注册表（与 MyInstances 一致） |
| 人工任务 SUBMITTED/CANCELLED/TIMEOUT | 已提交/已关闭/已超时 | 执行详情任务行（新键） |

**B4 失败分类列（P70）：** `b4-execution-list.png`（1920 视口）：FAILED 行失败分类显示 **「模型调用失败」** 完整可读，悬浮显示原值 `MODEL_CALL_FAILED`（tooltip 实现）；未登记分类回落原值。单测锁定映射（error-category.spec.ts）。

**B5 当前节点名称（P70）：** BPM 链实测（表单→流程「部门审批」（DESIGNATED admin）→发布→发起→运行中实例）：监控 API 行 `activeNodeIds=["node_approve"]`、`activeNodeNames={"node_approve":"部门审批"}`；`b5-monitor-node-name.png` 当前节点列显示 **「部门审批」**（非编码）。作废后见 B3 截图。

### 测试数据

隔离环境新建的图/表单/流程/实例/模型/供应商全部保留不删（取消验证父子图、设计器取消图、运行中显示图、监控验证表单/流程/实例、不可达供应商/模型）；演示环境未触碰。t100nobody 的 t100_admin 角色授权（sys_user_role id 99001）为隔离库测试夹具内新增，随隔离环境一并清理。

## 3. 与方向的偏差

1. **B5 由「纯 Web 显示修复」变为「Server 契约/引擎 + Web 显示」**：名称取不到时回退编码的前提是先能取到名称；监控接口原本只回 `activeNodeIds`（Flowable 活跃节点编码），Web 侧无从取得版本准确的节点名称（按 defKey 取图是草稿图、有漂移风险）。改为服务端按**部署版本 BPMN 模型**解析名称（新增 Facade 方法 + 监控行字段，无数据库迁移），Web 消费并回退。方向非目标「不改取消接口地址与入参、不加迁移」均未触碰。
2. **B3 范围小幅延伸**：执行详情人工任务行状态标签（SUBMITTED/CANCELLED/TIMEOUT 原样英文）按「凡是还显示英文原值的都补上中文」一并中文化；INTERRUPTED（服务重启中断态）同样补键。
3. 其余按方向执行，无偏差。

## 4. 问题、限制与风险

1. **既有 flaky（非本次引入，develop 上同样复现）**：`sw-basic-notify-biz` 的 `I6G1aNotifyFailureBootTest`/`I6G1bRecoveryBootTest`/`I6G1cRecoveryExhaustedBootTest` 在 fail-fast 全量与定向重跑中失败（RESENDING/重试计数/恢复轮超时），在 develop 分支检出后同样失败；但 `-fae` 全量重跑中**全部通过**（0 failures）。定性：启动恢复类 Boot 测试的时序敏感偶发，与本次 agent/bpm 改动无交集（改动不触及 notify 模块）。本次以最终 `-fae` 全量 2,521/0/0/45 为门禁结论，flaky 事实如实记录，建议后续单独登记排期收敛。
2. B4 列表在 1440 视口下因横向列多，「失败分类」列仍在视口外（既有横向滚动行为）；1920 视口完整可读。列宽未改动（中文比原值短，实际可读性提升），未扩大本次范围。
3. Agent 执行列表「发生时间」列显示 ISO 原值（`2026-11-14T15:59:07.006736`）——既有显示，不在 B1—B6 范围，未处理。
4. 演示环境（UAT）与发版部署在阶段 4—6 进行，本回执不覆盖。

## 5. Git diff 摘要

- Server `8481fc55..beb6f250`：2 commits，7 文件（+223/−13）：`dcad9ec5`（2 文件 +48/−9）、`beb6f250`（5 文件 +175/−4）。
- Web `a98d720..97104b1`：2 commits，15 文件（+278/−64）：`b0e5114`（12 文件 +258/−63）、`97104b1`（3 文件 +20/−1）。
- 换行符：`git ls-files --eol` 逐文件核对，无 LF→CRLF 漂移（BpmMonitorServiceImpl 保持原 CRLF）。

## 6. 与验收标准逐项对照（方向 §1/§5）

| 项 | 验收标准 | 实际 | 结论 |
|---|---|---|---|
| B1 | 双编号取消结果相同；人工任务关闭；子执行取消；不存在/他人编号明确错误；设计器按钮可取消 | 表 ①—④ 全部成立；任务/子执行 DB 核验；设计器按钮实测截图 | **达成** |
| B2 | 运行中显示「运行中」，结束才显示成败；新运行清空上次结果 | 运行中/终态两张截图；清空逻辑回归保持 | **达成** |
| B3 | CANCELLED/DISCARDED 中文；全部状态值检查补齐 | 详情/列表/监控截图 + 映射表；QUEUED/INTERRUPTED/WITHDRAWN/FAILED 一并补齐 | **达成** |
| B4 | 失败分类完整可读；放不下显示中文名+悬浮原值 | 1920 视口完整可读 + tooltip 原值 + 单测锁定 | **达成** |
| B5 | 当前节点显示名称，取不到回退编码 | 服务端按部署模型解析名称，截图显示「部门审批」 | **达成**（实现方式见偏差 1） |
| B6 | README 展示图三仓同步 | 阶段 6 随部署与 README 同步重拍 | 待阶段 6 |
| 门禁 | Web 四连；Server 全量 mvn test；两仓 feature CI success | 四连全绿；2,521/0/0/45；run 43570063124 / 43572953530 success | **达成** |

## 7. 自验结论

B1—B5 自验通过（隔离环境行为证据 + 机器门禁全绿），B6 待阶段 6。整体交付按七阶段推进：**总阶段数 7｜已完成 2（评估、实施）｜进行中 1（阶段 3 验收收尾，本回执提交后待规划验收）｜未开始 4（合并、发版、部署与同步、结束）**。

```
ENGINE_TERMINAL {"schema":"executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","evidence":{"artifacts":["product/v1.1.2-patch/receipts/execution-112-01.md"],"browser_evidence":{"tier":"ISOLATED_REGRESSION","headless":true,"artifacts":[".runtime-v112/b1-r3-designer-waiting.png",".runtime-v112/b1-r3-designer-cancelled.png",".runtime-v112/b1-detail-cancelled.png",".runtime-v112/b2-designer-running.png",".runtime-v112/b2-designer-failed.png",".runtime-v112/b4-execution-list.png",".runtime-v112/b5-monitor-node-name.png",".runtime-v112/b3-monitor-discarded.png"],"url":"http://127.0.0.1:5275","viewport":"1440x900/1920x900","identity":"admin/t100admin/t100nobody（隔离环境测试账号）","object":"Graph 取消/执行列表/执行详情/实例监控干预页","network_index":"见回执 §2 接口响应四组与监控 API 行"},"tests":{"server":"2521 passed/0 failed/0 errors/45 skipped（-fae 全量）","web":"2102 passed/3 skipped + typecheck/lint/build 全绿"},"ci":{"server_run":"43570063124","web_run":"43572953530"}},"work_items":[{"id":"stage-4-merge","title":"两仓 feature/1.1.2 → develop → main 普通合并","status":"PENDING","dependency":"planner-acceptance"},{"id":"stage-5-release","title":"两仓 tag 1.1.2 + Release Latest","status":"PENDING","dependency":"stage-4-merge"},{"id":"stage-6-deploy-sync","title":"演示环境部署与发布后同步（含 B6 展示图三仓）","status":"PENDING","dependency":"stage-5-release"}],"remaining_actionable_count":3,"independent_work_exhausted":false,"next_action":"提交回执等待 Planner 验收阶段 3；验收通过后继续阶段 4 合并","next_action_type":"PLANNER_REVIEW","progress_fingerprint":"execution-112-01:server-2commits:web-2commits:b1-b5-isolated-passed","progress_basis":"file_changes+tool_results","stop_reason":"awaiting_planner_stage3_acceptance","tool_results":[{"tool":"mvn","result":"BUILD_SUCCESS","detail":"2521/0/0/45"},{"tool":"pnpm","result":"GATE_GREEN","detail":"typecheck+lint+2102passed+build"},{"tool":"gh-api","result":"CI_SUCCESS","detail":"server:43570063124 web:43572953530"},{"tool":"playwright","result":"ISOLATED_EVIDENCE","detail":"B1-B5 8 张视口截图+API 四组响应"}]}
```
