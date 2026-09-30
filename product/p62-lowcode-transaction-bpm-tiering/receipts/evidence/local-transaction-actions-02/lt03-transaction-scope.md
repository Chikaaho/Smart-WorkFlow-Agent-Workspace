# LT03 补证：本阶段实际事务与传播范围（含「流程写入」不适用范围依据）

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查记录 LT03「对象不匹配：当前同事务证据仅表单+动作，无流程写入；以迁移测试通过论证可靠恢复无效」。

## 1. 本阶段实际事务范围（源码 + 实跑证据）

| 参与者 | 事务声明 | 说明 |
|---|---|---|
| `TxnActionTxOperations.reserve/confirm/release/adjust/settleExpired` | `@Transactional(rollbackFor=Exception.class)`，**默认 REQUIRED**（L135/209/216/318/370） | 参与调用方事务；调用方无事务时自建。写入次序统一：父行锁 → 条件更新（版本/可用量/状态守卫）→ 预占凭据 → 台账 → 调用记录（SUCCEEDED） |
| `TxnActionExecutor` | **无事务**（编排层） | 幂等判定（同键同指纹重放/同键异指纹冲突）与业务拒绝分发在事务外，`invoke` 只把请求交给内核或拒绝记录 |
| `TxnActionTxOperations.recordRejected` | `@Transactional(propagation = **REQUIRES_NEW**)`（L456） | 业务拒绝在**独立事务**落 `REJECTED` 调用记录，不回滚调用方其它工作，也不留半成品数据写入 |
| `TxnReservationExpiryJob.sweep` | 调度线程逐条调用 `settleExpired`（自带 REQUIRED） | 每条预占独立事务；逐行还原租户后结算；目标行不可用时保留 `EXPIRED` 终态并记 `FAILED` 调用记录（不伪造效果、不产台账） |
| 表单写入（`FormSubmitService`/`FormDataUpdateService`/`FormDataDeleteService`） | 各自 `@Transactional` | 与事务动作在**同一外层事务**内组合时同成同败 |

**组合实跑（真实 PG，`t03`）**：外层 `TransactionTemplate` 内先 `submitForm` 再 `executor.invoke(reserve)`——
- 提交路径：表单记录与预占同成（`reserved=5`、调用记录 1 条）；
- 回滚路径（强制抛错）：表单行 **0**、调用记录 **0**、预占凭据 **0**、台账 **0**（本轮补证把断言从「主表行 + 调用记录」扩展到「记录/调用/凭据/台账全灭」）。
原始输出：`[P62-EV] t03.same-tx commit=both-present rollback=both-absent (record/invocation/reservation/ledger all-absent)`（`P62TxnActionPgBehaviourTest`，Server `5f9e066` 树实跑 11/0/0/0）。

## 2. 「流程写入」组合：本阶段不适用 + 可核验范围依据

**结论：本阶段交付范围内不存在「流程状态 × 表单/动作」同事务组合的入口**，故按方向允许标不适用；依据如下（可核验、可复跑）：

1. 调用图证据：`TxnActionExecutor` 的生产调用点**只有** `TxnActionController`（HTTP，`POST /api/form/action/{id}/invoke`，权限 `form:action:invoke`）；`TxnActionTxOperations` 的生产调用点只有 `TxnActionExecutor` 与 `TxnReservationExpiryJob`（`@Scheduled`）。全仓无 BPM 节点、无命令消费者、无事件监听器调用事务动作（grep 结果见本文件生成记录）。
2. 反向依据：BPM 侧对表单只有**只读**引用（`ApprovalTaskListener`、`BpmBranchConditionEvaluator`、`NodeDelegateSupport`），BPM 内唯一表单写入通道是草稿提交经 `FormDataSubmitFacadeImpl → submitForm`（见 `lt02-c1-write-entry-inventory.md` §2 #5），该通道不调用事务动作。
3. 本阶段未新增跨事务传播：**未引入 Outbox/事务意图表**，未改 `FlowStartPort`、命令队列或恢复机制；因此「新增跨事务意图在提交后中断可恢复且不重复效果」在本阶段无对象可证（不适用），也未以迁移测试去论证恢复——原回执中「以迁移测试通过论证可靠恢复」的推理在本回执中不再使用。
4. 平台既有「引擎/业务同提交边界」的性质另有其权威证据（Phase 4 锁定），本轮仅在冻结门禁复跑中确认未破坏：`Phase4PgFlowSeamBehaviourTest` 9、`Phase4PgTransactionFactTest` 2、`Phase4PgDeliverySeamBehaviourTest` 8、`Phase4PgCommitBoundaryBehaviourTest` 3、`Phase4PgRestartRecoveryTest` 1、`Phase4PgLifecycleBehaviourTest` 7（均 0/0/0/0，Server `5f9e066` 树四段门禁实跑，原始日志 `lt02-A1.log`/`lt02-A2.log`/`lt02-B.log`）。

## 3. 结算语义与事务范围（本轮修复后）

- CONFIRM/RELEASE 结算的字段绑定与数量语义取自**预占受理时冻结的动作版本**（`requireFrozenVersion(reservation)`），不再取当前发布版本；冻结版本快照缺失时拒绝结算（不猜测）。
- 预占凭据须属于本次调用动作绑定的表单（跨表单拒绝；跨租户由受控查询过滤）；结算仍走「状态守卫 CAS（ACTIVE→CONFIRMED/RELEASED，确认额外要求未过期）→ 条件更新（预占 ≥ 数量、确认额外要求余额 ≥ 数量）→ 台账 → 调用记录」，全部在**同一事务**内，与过期释放竞争时仅一次合法结算（`t04.race settleEntries=1`）。
- 停用边界与结算的事务语义无关（停用只是入口门禁，不改变提交边界）；停用时既有凭据仍可结算、已受理请求重放不受影响，见 `lt04-t05-frozen-and-declaration.md`。

## 4. 边界

- 本文只陈述本阶段实际事务范围与不适用依据；不主张 Phase 4 之外的恢复能力，不把迁移/兼容测试当作恢复证据。
- 事务范围证据来自真实 PostgreSQL 实跑（`t03`），H2 侧模块回归（`TxnActionFlowH2Test` 7/0/0/0）仅作快速护栏，不作为正式证据。
