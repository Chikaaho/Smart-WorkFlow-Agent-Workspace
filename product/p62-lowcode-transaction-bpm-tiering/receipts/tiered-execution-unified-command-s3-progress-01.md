# P62 分级执行与统一命令：S3 后台批量命令进度回执 01

日期：2026-09-30；角色：执行（Executor）；阶段状态：**IN_PROGRESS**（正式完成回执 `tiered-execution-unified-command-01.md` 在 U01—U08 全部完成后提交）。
依据：`../ready/direction-p62-tiered-execution-unified-command.md`、`../ready/adr-p62-002-tiered-command.md`。前置：S1（`…-s1-progress-01.md`）、S2（`…-s2-progress-01.md`）。

## 1. S3 交付范围（U02/U07：后台批量形态——受控动作批量调用）

| 项 | 实现 | 位置 |
|---|---|---|
| 批次/项持久模型 | `sw_bpm_command_batch`（batch_key 同租户唯一；受理冻结 action_version；total/succeeded/failed 计数；command_id 回链）+ `sw_bpm_command_batch_item`（batch_id+item_key 唯一；逐项 status/invocation_id/error_code/error_msg/attempt_count） | `V0.1.3__batch_command.sql`（PG/H2，H2 双胞胎差异仅 COMMENT；测试链 V103 两处同源） |
| 批量受理服务 | `TxnBatchService.submit/get`：`form:action:invoke` 权限（与受控 Port 同口径）；项数 1—500、项键批次内唯一；经 `FormTxnActionPort.describe` 校验动作同租户已发布（fail closed）；同租户批次键已存在→**返回原批次（replay=true），不重建不重复执行**；受理同事务落批次/项行并入队 `BATCH_INVOKE`（`logical_command_id=BATCH:{batchKey}`、`tier=BULK`、`completion_point=BATCH_SETTLED`） | `service/TxnBatchService`、`service/impl/TxnBatchServiceImpl`（sw-bpm-process） |
| 批量命令处理器 | `BatchInvokeCommandHandler`：**逐项独立事务（REQUIRES_NEW）**；每项经受控 Port 以稳定幂等键 `BATCH:{batchKey}:{itemKey}` 调用——同键同载荷重放原结果、同键异载荷动作内核拒绝（1606）落 REJECTED 终态；业务拒绝不触发命令重试，基础设施异常向上传播由调度重试且**重入只处理 PENDING 项**；批次结算与 `CommandEffectRecorder` 效果权威账本同事务（biz_ref=`BATCH:{batchKey}`）；`onFinalFailure` 保留已处理项结果，不整批回滚 | `queue/BatchInvokeCommandHandler` |
| 受理/回查入口 | `TxnBatchController`（POST/GET `/workflow/txn-batch`）：受理与回查均 `form:action:invoke`；受理为异步语义（受理成功≠项完成），U07 逐项独立追踪基础 | `controller/TxnBatchController`、`dto/TxnBatchSubmitRequest`、`dto/TxnBatchView` |
| 配套 | `CommandTypeEnum` 增 `BATCH_INVOKE`；错误码 2424（BATCH_NOT_FOUND）+ 中英文 i18n；实体/枚举/Mapper | sw-bpm-api / sw-common / sw-bpm-process |

## 2. 验证（本轮实跑）

| 层 | 用例 | 结果 |
|---|---|---|
| 模块 H2（真实 H2 + 真实队列 + 迁移 V103） | `TxnBatchCommandH2Test` 6 例：受理边界（0/501 项、项键重复、未发布动作、无权限）；受理持久化与统一命令语义（BATCH_INVOKE/logical/tier/completion_point）；批次重放返回原批次；逐项混合成功/拒绝落持久结果且效果权威恰一条（`[P62-EV] s3.partial`）；基础设施中断后重入只处理 PENDING 项、已成功项不重做（`[P62-EV] s3.resume`）；同键异载荷冲突落 REJECTED 终态（`[P62-EV] s3.conflict`） | **6/0/0/0** |
| 真实 PostgreSQL 端到端 | `P62BatchInvokePgTest`：真实受理 → 真实命令调度消费（正式身份回查）→ 逐项真实预占（成功项落库 2、拒绝项 1604 无副作用、两项各恰一条调用记录）→ PARTIALLY_FAILED + 命令 COMPLETED + 效果权威 1 条 → 批次重放返回原批次、不新增命令、不重做已成功项（`[P62-EV] s3.e2e`） | **1/0/0/0** |
| 模块回归 | sw-bpm-process 全量 | **242/0/0/0**（S2 基线 236 + 新增 6，无漂移） |
| 迁移链 | `FlywayFullChainPostgresTest` 12、`FlywayFullChainH2Test` 17（V0.1.3 入链；条数/终点锚点同步至 0.1.3——该锚点在 S1 加 V0.1.2 时未同步，本批一并修正） | 全绿 |
| 既有 P62 回归 | `TieredCommandSemanticsPgTest` 4、`P62LightProcessE2ePgTest` 3、`P62TxnActionPgBehaviourTest` 12 | 全绿 |

## 3. 身份与提交

- Server（develop，已推送远端并回读一致）：`e4d58c8`（S3 全量：迁移+服务+处理器+入口+测试）。Workspace gitlink 同步至 Server `e4d58c8`；Web `19e1c47` 未变。

## 4. 剩余与边界

- 剩余切片：S4 设备未知结果接线 + 回调守卫 + 独立授权人工核实（U04/U07）；S5 Web 界面（配置/执行回查/批量项/核实）；S6 兼容回滚演练（U06）+ 300ms/2s 预算实测（U08）+ 正式回执。
- 边界：批量代表场景为"同一受控动作批量调用"（不同动作可拆多批次），不做跨项事务/整批原子回滚（方向明确保留部分效果口径）；既有导入、批量审批和通知入口原语义未动；S3 不含 Web 界面（S5）与预算测量（S6）。
