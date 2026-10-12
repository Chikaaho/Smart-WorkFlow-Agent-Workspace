# P64阶段Ⅲ既有工单关闭与数量核实（只读回传）

2026-10-12 21:54:34+08 运行库 sw_p64_phase3 实读（psql 只读查询，未启动服务、未重跑场景、未改任何数据）；承接 [search_task](../search_task/p64-phase3-close-readback-20261012.md) 与[验收03](../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-3-03.md)。以下全部为直接读取结果，未做推断性补齐。

## 问题1：341/342 实例终态——两个实例均已真实关闭

`sw_bpm_instance`（权威状态表）与 `act_hi_procinst`、`act_ru_task` 实读：

| 工单 | 实例 | status | 开始 | Flowable end_time_ | 未完任务 |
|---|---|---|---|---|---|
| WO-2026-341 | 661adeda-c631-11f1-aae8-2214eaf7855f | APPROVED | 19:38:09.393 | 19:38:47.297（delete_reason_ 空） | 0 |
| WO-2026-342 | 7ec9fddf-c631-11f1-aae8-2214eaf7855f | APPROVED | 19:38:50.806 | 19:39:21.69（delete_reason_ 空） | 0 |

- 主流程人工节点 8/8 全部有 end_time_（341：领料确认→开工确认→首件生产→首件检验→批量生产→报工→完工检验→入库确认；342 同序）。
- 子流程实例全部 APPROVED：341 六个（最后 act_inbound 19:38:47.213 结束，早于主单 end 19:38:47.297）；342 三个（act_f_scrap 子单 19:39:19.434 结束，早于主单入库确认节点开始 19:39:19.506——等待齐备门槛真实生效后才推进并关闭）。
- 结论：r3-chain-run.log 当时读到的 RUNNING 是实例状态异步收敛（状态同步任务）的时点差，已被现库消解。两单均无剩余待办、无等待原因，关闭是真实终态，不是卡死也不是推断。

## 问题2：342 数量勾稽（真实字段值）

计划与产出（各表实读值）：

| 事实 | 实际字段值 | 位置 |
|---|---|---|
| 计划数量 | qty=10.000000（PWO-342） | sw_form_fiqhem52rm 工单 0ced9f49…（fg_inbound_key/fg_inbound_state 均空） |
| 领料 | 行领料 qty=5.000000（料342/W1），库存 50→45，reserved 现 0 | 行确认单 e52cfbbd…；既有调用账 19:38:53 RESERVE 5.000000 @50 |
| 首件检验 | verdict=NG，defect_type=PROCESS，note「342 工序不良」 | sw_bpm_task_form_data 7ec9fddf/node_first_insp |
| 整改复检 | rect_note「342 已整改」→ recheck_verdict=PASS（子单 86c5e847 两节点均 SUBMITTED，复检通过后才进批量生产） | 子实例任务数据 |
| 报工 | 无任何表单数据（data_text 无行）——**未声明任何实际产出数量** | node_report 无 sw_bpm_task_form_data 行 |
| 终检 | verdict=NG，disposition=SCRAP | node_final_insp SUBMITTED |
| 报废处置 | **scrap_qty=3，scrap_reason=「342 外观损伤无法返工」**，defect_type=SCRAP，19:39:19.427 提交 | 子实例 8efe666c node_handle（mes_scrap_form）任务数据 |
| 成品库存 | PWO-342 balance=0.000000，reserved=0（记录自建单起未增） | mes_stock 7e9aa4aa… |
| 入库 | 无 act_inbound 派发、无入库批次（与零派发一致） | child_item 仅 3 项（pick/rect/scrap） |

**勾稽结论**：计划 10 = 已报废 3（业务依据成立：终检 NG+SCRAP、报废处置登记含数量与原因）+ 未生产/未入账 7。其余 7 件在所有台账中**无任何去向记录**：报工节点未申报产出、无库存、无报废、工单无在制/未生产字段（工单表仅 wo_no/product/qty/fg_record_id/fg_inbound_key/fg_inbound_state）。关闭依据是**节点与门槛齐备**（报废子单结算→入库确认→APPROVED），不是数量齐套——v5 流程不存在"计划数=产出+报废"的校验节点。Plan 数 10 不必全量生产在当前流程语义下成立，但"剩余 7"目前是流程设计未覆盖的口径，不是已记录的事实去向。

## 顺带发现（事实+影响，不改变已通过项）

1. **报废单记录行未携带提交值**：报废处置单记录 e439b9a2-9acf-4dc6-9399-954f68c07c1e（sw_form_cpss45phrh）实读仅 defect_type=SCRAP（派发时预填），scrap_qty/scrap_reason/disposition/wo_no 全为 NULL，update_time=创建时刻；提交的 qty3+原因只存在于子实例任务数据（sw_bpm_task_form_data 8efe666c）。整改单 cb729311 同模式（rect_note/recheck_verdict 行上 NULL，任务数据在）。这是引擎一致行为（子记录在派发时预填创建、办理提交不回写记录行，除非配置 writeBack；act_f_scrap/act_r_proc 未配置回写，act_inbound/pick 配了所以 341 台账齐）。影响：台账层报废单本身不能作为 qty3 的直接读取处，数量证据路径是「实例 8efe666c → node_handle 提交数据」；对"单据完整性"口径是真实缺口，对流程关闭与门槛无影响。
2. 回执03 所称"报废单数量3+原因"在**提交层**准确（数量与原因确已申报并随子单结算进门槛），不在记录行层。

## 状态

P64 整体 IN_PROGRESS，Ⅰ/Ⅱ PASSED、Ⅲ VERIFYING；总 3 阶段：完成 2 / 进行中 1 / 未开始 0；功能47、46/22/22=90、ADV64、问题57 与正式基线保持，P62 性能延期/OFF 保持。唯一下一动作=Planner 读取本核实结果裁决 341/342 关闭与 342 数量口径（含上述两条事实是否立项）；已通过项与原累计记录保留。
