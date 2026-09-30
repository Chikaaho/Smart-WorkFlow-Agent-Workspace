# P62 分级执行与统一命令：S2 事务动作节点与轻流程约束进度回执 01

日期：2026-09-30；角色：执行（Executor）；阶段状态：**IN_PROGRESS**（正式完成回执 `tiered-execution-unified-command-01.md` 在 U01—U08 全部完成后提交）。
依据：`../ready/direction-p62-tiered-execution-unified-command.md`、`../ready/adr-p62-002-tiered-command.md`。S1 进度见 `tiered-execution-unified-command-s1-progress-01.md`。

## 1. S2 交付范围（U01/U05：事务动作节点 + 受控 Port + 轻流程约束）

| 项 | 实现 | 位置（Server 提交） |
|---|---|---|
| S2a 受控 Port | `FormTxnActionPort`（invoke/describe 契约，`-api` 承载）+ `FormTxnActionPortImpl`：运行/发布期均要求 `form:action:invoke` 权限与租户身份（无 HTTP 控制器旁路）；`describe` 对不存在/跨租户动作统一返回 empty（不泄露存在性） | `f9866a4`（sw-biz-form-api / sw-biz-form-biz） |
| S2b TXN_ACTION 节点翻译器 | `TxnActionNodeTranslator extends ServiceTaskNodeTranslator`：注册 `TXN_ACTION` 类型；`validateConfig` 发布期校验绑定动作存在（经 Port.describe，跨租户按不存在）、同租户、已发布（fail closed）；Port 经 `ObjectProvider` 可选注入（隔离引擎上下文无 form 模块时动作节点 fail closed，无动作节点的图不受影响） | `27279bc`（sw-bpm-engine/translator） |
| S2b TXN_ACTION 节点委托 | `TxnActionNodeDelegate implements JavaDelegate`：经受控 Port 调用动作；节点稳定幂等键 `NODE:{processInstanceId}:{activityId}`；结果（status/reservationId/actionVersion）写回流程变量 `txnAction.{activityId}.*`；失败默认 BLOCK（业务异常保留已完成效果），可配 CONTINUE | `27279bc`（sw-bpm-engine/delegate） |
| S2c 生产轻流程图约束发布门 | `LightProcessGraphValidator`：图中含 TXN_ACTION 即施加形态约束——节点白名单 {START, END, CONDITION, TXN_ACTION}（禁混人工等待/并行/通知等）、无环（迭代 DFS 三色标记，定位环上节点）、动作节点 ≤16；不含 TXN_ACTION 的既有普通图不受约束（U06 兼容）。接入 `BpmProcessDefServiceImpl.publish`（通用图校验之后、翻译之前，首个错误拒绝发布）。错误码 2421/2422/2423 + 中英文 i18n | `8c7f0fd`（sw-bpm-api / sw-bpm-process / sw-common i18n） |
| S2c 真实 PG 端到端证据 | `P62LightProcessE2ePgTest`（内嵌 PG 17.5 + 全链启动 + Flyway 全迁移 + 真实命令调度消费） | `39ed182`（sw-bootstrap/src/test/…/p62/） |

## 2. 验证（本轮实跑）

| 层 | 用例 | 结果 |
|---|---|---|
| 单元（sw-bpm-process） | `LightProcessGraphValidatorTest` 12 例：合法线形/条件分支汇合通过；普通图不受约束（兼容）；混 APPROVAL/NOTIFICATION/DYNAMIC_PARALLEL 拒绝（2421 定位到节点）；条件回边环/自环拒绝（2422 环上定位）；16 动作通过、17 拒绝（2423）；菱形汇合非环；多约束不短路 | **12/0/0/0** |
| 模块回归（sw-bpm-process 全量） | `GraphValidatorTest` 4、`BpmProcessDefServiceImplTest` 7、`GraphJsonPersistenceIntegrationTest` 1 等全部 | **236/0/0/0**（S2b 基线 224 + 新增 12，无漂移） |
| 真实 PG 端到端 | `P62LightProcessE2ePgTest` 3 例 | **3/0/0/0** |
| 受影响回归 | `P62TxnActionPgBehaviourTest` 12、`TieredCommandSemanticsPgTest` 4、`MyProcessedRealSourceTest` 4（构造器补参） | 全绿 |

真实 PG 端到端证据行（原始输出摘要）：

- `[P62-EV] s2.e2e end-to-end published=true accepted=1 instanceDone=true reserved=3 invocationKey=NODE:{pid}:act_reserve invocation=SUCCEEDED command=COMPLETED`——表单提交同事务持久受理 FLOW_START → 命令调度器经正式身份回查消费 → Flowable 实例同步执行 TXN_ACTION → 受控 Port 真实调用已发布动作（预占 3 落库、余额不动）→ 实例直达终态（APPROVED）→ 调用记录恰一条、命令 COMPLETED。
- `[P62-EV] s2.e2e replay replay=true effect-once=true same-key-diff-payload=REJECTED reserved=2 invocations=1`——节点稳定幂等键重放返回原结果（replay=true）、预占不叠加、调用记录仍一条；同键异载荷（quantity 5≠2）明确冲突（1606 ACTION_IDEMPOTENCY_CONFLICT）、原结果不变。
- `[P62-EV] s2.e2e publish-gate rejected=2421 draft-unchanged bindings=0`——轻流程混入人工审批节点（参与人配置合法、通用校验通过）发布被 2421 拒绝；草稿状态不变、Flowable 未部署、表单绑定不激活。

## 3. 身份与提交

- Server（develop，已推送远端并回读一致）：`f9866a4`（S2a）→ `27279bc`（S2b）→ `8c7f0fd`（S2c 发布门）→ `39ed182`（S2c 端到端证据）。Workspace gitlink 同步至 Server `39ed182`；Web `19e1c47` 未变。
- 判级说明：本切片为 L/XL 阶段内批次（权限受控 Port、跨模块契约、发布门为自动升级门事项），沿用阶段既有 L 级流程与机器门禁。

## 4. 剩余与边界

- 剩余切片：S3 批量命令（批次表 + 逐项事务/持久结果/幂等 + 批次重放，U02/U07）；S4 设备未知结果接线 + 回调守卫 + 独立授权人工核实（U04/U07）；S5 Web 界面（配置/执行回查/批量项/核实）；S6 兼容回滚演练（U06）+ 300ms/2s 预算实测（U08）+ 正式回执 `tiered-execution-unified-command-01.md`。
- 边界：S2 覆盖生产轻流程的代表场景与发布/运行授权链，不替代 U01—U08 正式行为验收；未做浏览器验收（S5 后统一）、未测量预算（S6）、未发版/部署；轻流程节点内动作失败保留部分效果（方向明确的"先前已提交节点不自动撤销"口径），整流原子回滚不在本阶段合同内。
