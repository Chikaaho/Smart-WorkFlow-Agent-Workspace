# LT04 补证：冻结版本结算、停用边界、响应丢失回查与非法声明拒绝

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查记录 LT04「缺行为证据：存在GET端点不证明断连后回查；action_version列与versionConfig描述不证明新发布保持旧语义；只有字段非法校验，没有非法事务/远程副作用与C1版本变化边界的运行结果」。

## 1. 断连（响应丢失）后同身份回查与无重复效果

场景：调用已受理但客户端未收到响应 → 以**同一调用标识**重试 → 回查真实结果。真实 PG 实跑（`P62TxnActionPgBehaviourTest.acceptedButResponseLostIsReadableByIdentity`）：

| 断言 | 结果 |
|---|---|
| 同键重试为**重放**（返回原结果） | `retry.replay=true`、`invocationId` 与首调一致、`reservationId` 一致 |
| 无重复效果 | 预占量保持 6（未变 12）、同键调用记录恰 **1** 条、该凭据台账恰 **1** 条 |
| 同调用身份回查调用记录 | `pageInvocations(actionId, 调用人=USER)` 命中该 `invocationId`，状态 `SUCCEEDED`，`resultJson` 含原 `reservationId`；`getInvocation(invocationId)` 的 `bizRecordId` = 目标记录 |
| 同身份回查凭据/台账 | `pageReservations(actionId, ACTIVE)` 含该凭据且 `quantity=6`；`pageLedger(actionId, actionVersion=1, reservationId)` 恰 1 条且 `entryType=RESERVE` |

原始输出：`[P62-EV] lt04.lost-response retry=replay/same-invocation no-duplicate-effect readback=invocation/reservation/ledger`。
说明：本次以**服务层真实事务链**（同一 Spring 上下文、真实 PG）证明「已受理→重试→回查」语义；界面侧同一语义另有可见会话证据（`…-01/04-invoke-replay.png`、`…-01/07-invocation-records.png`、`…-01/10-reservations-with-id.png`），两者对象同身份（动作 `stock_reserve`/`stock_confirm`、凭据 `8b92d166-…`）。

## 2. 新发布不改旧预占语义（本轮**修复**后新增证据）

修复前行为：CONFIRM/RELEASE 使用**当前发布版本**的字段绑定与数量语义 → 重新发布（例如把预占字段改指另一列）会改变既有预占的结算语义。本轮改为**按预占受理时的冻结版本结算**，并用真实 PG 反例链证明：

| 步骤 | 断言 |
|---|---|
| v1 发布（balance=`qty_available`, reserved=`qty_reserved`, TTL 600）→ 预占 5 | 成功；响应 `actionVersion=1` |
| 重新发布 v2（reserved 改指 `qty_reserved2`） | `currentVersion=2` |
| 以 CONFIRM 动作（其自身声明 reserved=`qty_reserved2`）确认 v1 凭据 | `SUCCEEDED` 且 `actionVersion=1`（冻结版本）；`qty_reserved` 5→**0**、`qty_reserved2` 保持 **0**（未被旧预占改写）、`qty_available` 100→95；台账 `action_version=1` |
| 跨表单凭据 | 其他表单的凭据结算 → `REJECTED`（`ACTION_RESERVATION_NOT_FOUND`），无副作用 |

原始输出：`[P62-EV] lt04.frozen-v2-published confirm=v1-semantics(qty_reserved-deducted/qty_reserved2-untouched) cross-form-credential=rejected …`；模块侧同一语义的 H2 回归 `TxnActionFlowH2Test.frozenSemanticsDisableBoundaryAndUnsupportedDeclarations`（7/0/0/0）。

**C1 策略变化边界**：启用 C1 只改变**普通写入口**（提交/编辑/删除被拒），受控动作通道与既有凭据结算不受影响——证据为同一真实 PG 用例内：受保护模型 `submit/update/delete` 全部 `REJECTED`（`t02.c1`）、而已有预占仍在同一表单上按冻结版本结算成功（本文件 §2 表的第 3 行；两断言在 `p62_stock_multi`/`p62_stock_c1` 分别独立执行，对象身份见 §5）。

## 3. 停用边界（本轮**修复**后新增证据）

语义：停用只拒绝该动作的**新调用**；引用既有凭据的结算调用不受停用影响；已受理请求的回查（重放）也不受停用影响（幂等判定前移）。真实 PG 实跑：

| 场景 | 结果 |
|---|---|
| 停用 RESERVE 动作后发起新预占 | `BaseException`「事务动作已停用，不能发起新调用」（`ACTION_DISABLED`） |
| 停用 RESERVE 动作后结算其停用前受理的凭据 | `SUCCEEDED`，`qty_reserved` 3→0 |
| 停用 CONFIRM 动作后无凭据的新调用 | `REJECTED`（`ACTION_DISABLED`） |
| 停用 CONFIRM 动作后结算既有凭据 | `SUCCEEDED` |
| 停用后重复提交同键请求 | 返回重放（`replay=true`，同一 `invocationId`） |
| 恢复（启用） | 两动作 `status=PUBLISHED` |

原始输出：`[P62-EV] lt04.frozen-v2-published … disable=new-call-rejected/old-credential-settled/replay-ok`；H2 回归同名用例含 `「停用」` 消息断言。

## 4. 非法事务组合 / 人工等待 / 远程副作用的发布拒绝（本轮**修复**后新增证据）

- 声明模型为**封闭集合**：`TxnActionConfig`（6 个字段）与 `C1PolicyModel`（5 个字段）之外的键被**显式收集**（`unsupportedKeys`），不再静默忽略。
- **保存入口**：`TxnActionService.create/update`、`C1PolicyService.save` 对未声明键抛 `ACTION_CONFIG_INVALID`，错误信息含违规键名（实跑：`humanWait`、`transactionPropagation`、`remoteApproval`）。
- **发布入口**：存量配置（历史行/直改库）含未声明键时，`validate()` 返回结构化错误 `config.remoteSideEffect`（字段路径 + 可读原因），`publish()` 被拒 — 覆盖「模型根本不支持的能力被声明」的场景。
- 真实 PG 输出：`[P62-EV] lt04.unsupported-declaration collect=remoteSideEffect/remoteApproval save=rejected(humanWait/propagation) publish=structured-error(config.remoteSideEffect)`。
- 合法配置仍可发布运行（既有 `t01/t04` 链与 H2 `publishValidation` 回归）。

**结构性发布校验（原有能力，回归通过）**：缺绑定/非数字字段/TTL 非法/精度越界（0—6）/业务键重复或不在定义中或为 TABLE 或与余额预占同列/余额=预占同列/动作类型非法——真实 PG 与 H2 均以结构化错误拒绝，合法配置发布后冻结为不可变版本（`TxnActionFlowH2Test.publishValidation`，7/0/0/0）。

## 5. 对象身份（两文档共用）

| 对象 | 标识 |
|---|---|
| 补证专用表单（真实 PG 测试内建） | `p62_stock_multi`（字段 material/qty_available/qty_reserved/qty_reserved2）、`p62_stock_c1imp`（导入入口 C1）、既有 `p62_stock`、`p62_stock_c1` |
| 动作 | `lt04_reserve`（v1→v2 重发布）、`lt04_confirm`、`lt04_reserve_other`（跨表单反例）、`lt02_reserve_keys`/`lt02_reserve_s3`/`lt02_reserve_s6`/`lt02_adjust`/`lt04_lost_reserve` |
| 运行环境 | zonky 内嵌真实 PostgreSQL（binaries 17.5.0），`P62TxnActionPgBehaviourTest` 11/0/0/0，Server `5f9e066` 树 |

## 6. 边界

- 本轮修复仅限本阶段已批准范围（T04/A08、T05/A09 的本地动作子集）；不新增 Outbox、不改恢复机制、不扩大后续分级与性能范围。
- 「调用记录/台账」的版本语义已在代码注释与本文件固定：**结算相关记录的 `action_version` = 该笔结算实际适用的冻结版本（即预占受理版本）**；被调用动作 id 仍归属结算动作，两者经 `reservation_id` 关联，可按租户/调用身份/动作/版本定位（A12）。
