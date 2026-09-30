# LT04a 补证：同一旧预占跨重发布与合法 C1 变更的冻结语义（单对象）

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查02 LT04a「C1 与版本证据分属两个表单却称同一对象；未证明同一旧预占经历策略变化」。
实现：`P62TxnActionPgBehaviourTest#singleObjectReservationSurvivesRepublishAndC1PolicyChange`（真实 PostgreSQL，新增用例）；原始输出见 `lt02a-lt04a-lt05a-raw-output.txt`。

## 1. 撤回声明（口径纠正）

审查02 认定：回执02 `lt04-t05-frozen-and-declaration.md` §2「同一真实 PG 用例/同一表单」的表述与实现不符——`p62_stock_multi`（冻结版本）与 `p62_stock_c1`（普通写入保护）是两个独立对象上分别执行的断言。

**本文件撤回该"同一对象"表述**；旧文档与旧证据保留不改（只作追溯）。同一对象证据改由下述单对象场景承担，对象集合全新且明确（旧隔离对象随内嵌引擎销毁，按授权声明替换）。

## 2. 单对象证据集（同一身份贯穿全程）

| 对象 | 当轮标识（段 B 原始输出） |
|---|---|
| 表单 | `p62_stock_single`，form_id `ea8cab38-4111-46d6-b071-dfc189b8cc55` |
| 记录（同一行） | record_id `77aba5d5-f109-464e-8bc8-1c8335ac55e0`（`material=LT04A-SINGLE`，初始 可用100/预占0/预占2=0） |
| 预占凭据（同一笔） | reservation_id `34800c9a-5608-47bc-8d6b-946525ef8b20`（受理时 `actionVersion=1`） |
| 预占动作 | `lt04a_reserve`，action_id `3e242e43-ef82-4e47-b3b8-261cea112874`（v1 → 重发布 v2） |
| 确认动作 | `lt04a_confirm`，action_id `bbd4e9f0-eca9-4b5e-8dd5-da7c8a88926a`（自身声明 `reserved=qty_reserved2`） |
| 租户/用户 | tenant 0 / user 1；真实 zonky PostgreSQL 17.5.0 |
| 策略变更生效时刻 | `policyChange=allowed(applyAt=2026-09-30T18:07:29.109597)` |

## 3. 时间链与结果（同一表单/记录/预占）

| 步骤 | 断言结果 |
|---|---|
| 1. 变更前普通写入（对照） | 普通更新 `qty_reserved2=7` **成功**（此时未启用 C1，同入口可用） |
| 2. v1 受理 | 预占 5 成功，`actionVersion=1`；`qty_reserved=5` |
| 3. **合法 C1 变更**（同一表单） | `C1PolicyService.save(enabled, protected=[qty_available,qty_reserved,qty_reserved2], balance=qty_available, reserved=qty_reserved, nonNegative=true)` **受理成功**（既有数据满足非负约束） |
| 4. 变更后普通写入 | 更新被拒 `1612 C1_WRITE_PROTECTED`；旧值不变（100/5/7） |
| 5. **非法 C1 变更** | 受保护字段不在表单定义（`no_such_field`）→ 拒 `1603 ACTION_FIELD_BINDING_INVALID`；**策略未被覆盖**（`policyJson`、`appliedAt` 与步骤 3 快照逐字段一致） |
| 6. 重发布 v2 | `currentVersion=2`，预占字段改指 `qty_reserved2` |
| 7. **旧凭据结算** | `CONFIRM` 成功且 `actionVersion=1`（冻结版本）：`qty_available 100→95`、`qty_reserved 5→0`、`qty_reserved2 保持 7`（新版本字段未被旧预占改写） |
| 8. 台账 | 该凭据 `CONFIRM` 台账恰 1 条，`action_version=1`、`balance_after=95`、`reserved_after=0` |
| 9. 重复结算 | 同凭据再次确认 → 拒 `1609 ACTION_RESERVATION_NOT_ACTIVE`；台账仍 1 条；余额仍 95（无第二次扣减） |
| 10. 结算后普通写入 | 仍被拒 `1612`；记录保持 95（策略持续有效） |

原始证据行：`[P62-EV] lt04a.single-object form=… record=… reservation=… reserveAction=…(v1->v2) confirmAction=… policyChange=allowed(applyAt=…) illegalChange=rejected(policy-unchanged) settle=frozen-v1(balance95/reserved0/reserved2-7) ordinary-write=blocked-before-and-after no-double-settle=true`。

## 4. 结论与边界

- 结论：同一笔旧预占在其表单经历**合法 C1 策略变更**与**动作重发布 v2** 后，仍按受理时冻结版本 v1 结算（字段/数量/版本/账实一致）；非法变更被明确拒绝且旧策略不变；普通写入口在变更前后分别表现为"可用→拒绝"，证明策略的作用域只在普通写入，受控动作通道不受影响；同一凭据不可重复结算。
- 与既有证据的关系：回执02 中"冻结版本 vs 重发布""停用边界""响应丢失回查"三组断言继续有效（复用未改）；本项只替换"跨对象拼接"的同一对象声明，不重跑停用/丢失场景。
- 边界一：场景覆盖"受理→允许的策略变更→非法变更被拒→重发布→旧凭据结算"；不代表任意策略变化组合（如把 `balanceField` 改为另一列并同时重发布）都被单独验证——该类组合由步骤 5 的拒绝路径与步骤 7 的冻结版本语义共同约束。
- 边界二：隔离对象随内嵌引擎销毁，不宣称与 dev 库对象同 ID；对象标识以上表为准。
- 边界三：未引入代码修复——本轮为证据补齐；相关产品语义（冻结版本结算/停用边界/声明封闭）在回执02批次 `5f9e066` 已实现并回归通过。
