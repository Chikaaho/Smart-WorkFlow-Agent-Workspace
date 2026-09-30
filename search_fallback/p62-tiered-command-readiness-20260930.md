# P62 分级执行与统一命令 · 实施准入限定探索（回执）

- 角色/日期：执行（Executor，Planner 委派），2026-09-30；入口 `search_task/p62-tiered-command-readiness-20260930.md`；基准 Server `ca8cb87`、Web `19e1c47`。
- 只读：未改代码/库/配置；未编译/测试/压测/部署；未发版/改远端/停服务；未访问回显秘密。[结构]/[测试] 行号见附表。附表：`…-identity-and-entries.md`（Q1+Q6）、`…-seams-and-recovery.md`（Q2+Q3）、`…-compat-and-measurement.md`（Q4+Q5）。

## Q1 身份/状态
三条链各自闭合、无跨链统一身份：命令 `sw_bpm_command`（唯一键 tenant+command_key；PENDING→PROCESSING→COMPLETED/FAILED）、事务动作 `sw_form_txn_invocation`（唯一键 tenant+action+invocation_key＋request_hash；SUCCEEDED/REJECTED/CONFLICT/FAILED）、批量四入口各异（附表A2）。稳定业务键可复用（FLOW_START/DRAFT_SUBMIT/TASK_*/SCHEDULED_FLOW）；**跨通道复用同一身份未被证明**。六类语义：前四类=有；过期=仅预占 EXPIRED（命令/实例级缺）；外部待核实=仅枚举未接线（缺）。兼容：Web 闭联合＋label Record 需前后端同步、旧前端空标签；`CommandTypeEnum.of` 未知 code 抛错 → 混版本旧二进制消费新类型即错（错误码 1600—1613，C1=1612）。

## Q2 最小接入
生产轻流程：**无调用事务动作的节点**（sw-bpm 对 TxnAction/invokeAction 零命中）→ 缺口=新节点类型；接缝完备（`NodeTypeTranslator`＋delegate bean 即插，注册/校验/能力清单自动生效，版本冻结在位）。选项：①新增节点类型（无新表；跨模块需 form-api port 或新增命令类型）；②复用 `NodeFunctionService` 挂既有服务节点（无新表；缺自动步骤触发点）。均不新增权限码。后台批量：入口=导入（整批原子/500行/无幂等键）、批量审批（逐项独立/结果不持久化/无上限）、定时发起（去重/单次）、通知批量、交接（批次+逐项先例）。选项：①仿批量审批（需自建批次记录）；②复用命令队列（持久/重试/回收/去重已有；缺通用批量提交与逐项结果查询）。

## Q3 恢复与事务
业务效果=handler 内 REQUIRED 事务；完成记录=其后另一 REQUIRED 事务（`complete:137-154`）；dispatchOne 无事务；受理 enqueue MANDATORY（与调用方同事务）→"业务已提交、完成记录未写/被拒"窗口存在。旧执行者：命令层仅拒**状态回写**（claim_token 双守卫）；handle 前无阻断、handler 不接收 token → 旧者仍进入业务逻辑；实际防护=业务层幂等（命令唯一键/表单 submit_idempotency_key/审批 uk+command_id/幂等跳过）；**命令层 fence 缺失**。REQUIRES_NEW 现仅用于事务动作拒绝记录（`TxnActionTxOperations.java:456-466`）：内层读不到外层未提交数据、占第二连接、外层回滚不回滚内层 → 不可用于成功记录。截止/取消：命令级与 BPMN 定时边界**缺失**；仅有任务级时限、实例撤回/废弃、催办；超时只结束等待由 `CommandSyncWaiter` TIMEOUT 实现（可回查）。外部待核实：IoT UNKNOWN 不可重试但 `markUnknown` **无生产调用方**；回调仅收 SUCCESS/FAILED 且无守卫；无对账/重发；BPM 侧意图持久化＋AFTER_COMMIT 投递存在。

## Q4 在途兼容
旧 NORMAL/P0 共享校验/幂等/结果契约；旧命令四态落库可查；动作/表单/流程版本冻结在位。0.1.3＋V0.1.1 纯新增（6 新表；LT05a 非空回读无损）。硬边界=旧二进制遇新类型/新状态抛错、旧前端空标签。回退=只停新受理、保留结果、向前修复，不降级重放。测试资产 7 类（附表 C1）。

## Q5 测量条件
隔离环境（非敏感）：macOS 26.3.1 / Apple M1 8核 / 8GiB / OpenJDK 21.0.11 / Maven 3.8.6；本地 PG 16.15 与 zonky 内嵌 PG 17.5.0；H2 2.3.232；Redis 7.2.5；Node 24.9.0 / pnpm 11.9.0。现有资产：`duration_ms`（V0.1.1:73）＋命令时间戳＋并发正确性测试；**无性能/负载/延迟资产**（p99/latency/QPS 零命中）→ 300ms/2s **未测量**。档位（并发 1/16/64、数据 1行/1k/10k、窗口 30s/5min/15min、故障 无/单kill/交替）为**选项非承诺**（附表 C4）。

## Q6 入口覆盖
配置/发布：`/form/action`＋C1、`/workflow/defs`、节点函数注册（无 HTTP）、`/job/info`；批量：`/form/data/{k}/import`、`/workflow/ops`、通知批量、`SwJobBean`。回查：`/workflow/commands`、草稿/实例/动作记录与台账。权限：`workflow:p0:dispatch|monitor:view|task:batch`、`form:action:*`、`notify:batch:send`。审计=命令/台账/调用/V75。**已过期旧事实**：①"受控动作原语缺失"→已交付；②发布校验已在动作侧交付（等级/超时/事务边界仍缺）；③新增 duration_ms（仍无负载资产）；④预占 EXPIRED 已有、命令级仍缺。

## 缺失项汇总
①调用事务动作节点＋跨模块契约；②批量批次身份/逐项持久化/幂等键；③命令层 fence；④命令/实例级 EXPIRED 与截止/取消；⑤外部待核实生产路径；⑥跨通道统一身份；⑦300ms/2s 与档位未测量。附表 A6 列新旧事实对照。
