# P64阶段Ⅲ完成回执04：数量差异关闭收尾

2026-10-12；Executor。依据[裁决04](planning-review-phase-3-04.md)、[只读回传](../../search_fallback/p64-phase3-close-readback-20261012.md)与[提示03](planning-execution-prompt-p64-phase3-03.md)（Owner「修复，但没那么严重，以业务导向为要求」持续授权）。本回执只报告本项变更、代表性业务结果与原始结果位置；已过项（341/342真实关闭、UI/隔离、领料补办、成品入库、受控设备反馈、S2/S3及Ⅰ/Ⅱ）不重新包装。证据本机留存于 `receipts/evidence/phase3-04/`（[INDEX](evidence/phase3-04/INDEX.md)，gitignore 不入 Git）。

## 1. 业务结果（业务问题 → 修复后行为 → 结果位置）

**业务问题**：342计划10、报废3、入库0，报工未申报产出、无剩余计划记录，流程仍按节点走完关闭——差异未交代也能闭合，且关闭后无处查回数量交代。

**修复后行为（代表性报废场景 WO-2026-344，实例 13b25c20-c652-11f1-8487-2214eaf7855f，v6）**：

| 步骤 | 实际结果 |
|---|---|
| 发起：计划 qty=10，无领料行（EMPTY 分支），终检 NG:SCRAP、报废处置登记 qty=3+原因「344 外观损伤无法返工」 | 与342同形报废链，处置子单先于关闭结算 |
| 入库确认（报废终局，无入库） | 触发数量关闭说明子流程（配置为关闭必派、等待齐备门槛 ALL） |
| **第1次数量说明：实际0+报废3，剩余未填** | **主单保持 RUNNING 不能关闭**；补正任务自动出现（数量关闭说明单，按工单预填 wo_no=WO-2026-344、plan_qty=10） |
| **第2次数量说明：实际0+报废3+剩余7+处置「未生产」+原因** | 补正子单结算→链条回卷→**主单 APPROVED**（结束 23:34:56.071） |

- **差异未说明不能按数量完整关闭**：校验规则=实际+报废+剩余=计划，且剩余>0 时必须有处置与原因；不满足则说明子单不结算，等待门槛不放行，主单不产生关闭。
- **不强制满产**：剩余7 以「未生产+原因」交代即合法关闭；取消/结转同为合法处置值。
- **库存真实**：PWO-344 成品行 0.000000/0.000000 未虚增，工单无入库凭据（db-final-state.txt）。
- **关闭后可按工单查回**：`GET /workflow/instances/{id}/node-form-data` 按实例（工单记录=businessKey 关联）查回两次提交原文——未交代 `{actual_out_qty:0,close_scrap_qty:3,remain_qty:""}` 与交代齐备 `{...remain_qty:7,remain_disposition:"未生产",remain_reason:"344 实际产出样件3件已报废，其余7件取消生产"}`（queryback-by-instance.txt）；数量关闭说明单记录行含 wo_no+plan_qty（按工单预填，db-final-state.txt）。
- **单位边界**：勾稽仅在成品件数同单位字段（实际/报废/剩余/计划）内进行；领料数量不参与比较。

## 2. 实现选择（既有能力为主，一处必要局部实现）

- **配置资产（零代码路径）**：新增表单 `mes_close_form` v2（sw_form_gz7uehpljy，7 个普通字段，发布自动建表）；新增子流程「MES数量关闭说明」（`bpm_de133dee121c4729`，node_decl 填写→trg_decl 脚本校验→INCOMPLETE 派发自身补正（递归可见任务，两步自引用发布）→ACCOUNTED 结算）；主流程 **v6**：trg_inbound 两分支（INBOUND/SCRAP_NO_INBOUND）均加派 `act_close`（waitPolicy ALL），等待节点纳入 act_close。全用既有机制：NODE_FORM 变量、触发器 JS 脚本、CHILD 派发、等待门槛、按工单预填映射。零数据库迁移；v5 既有实例不受影响（341/342 保持 APPROVED，db-final-state.txt）。
- **必要局部实现（引擎缺口修复）**：链343 首次演练暴露真实引擎缺口——**子流程内部再有等待门槛、流程在请求外异步走到终态时，父批次永不结算**（`TaskActionService` 终态回调只覆盖同请求内结束；`BpmInstanceStateSyncJob` 原先只把行翻成 APPROVED 不触发编排结算，343 交代齐备后主单滞留 RUNNING）。修复：`BpmInstanceStateSyncJob` 对账收敛 RUNNING 行时同步触发既有 `ChildOrchestrationService.onChildProcessTerminal`（语义与审批完成路径一致；钩子异常保留 RUNNING 行下轮重试）。修复后链344 三跳结算全部到位：23:33:54 结算补正批次并唤醒子单等待节点 → 23:34:55 结算主单 act_close 批次并唤醒主单 → 23:35:56 主单行收敛 APPROVED（logs/settle-timeline.txt，每跳一次对账，有界可观察）。

## 3. 对象对照与遗留披露

- **342 历史保留原事实**：未回填、未改写；其"无差额说明"作为修复前对照，回执04 不再要求同一批历史补说明（沿裁决04）。
- **343（修复前演练）**：拦截证明与缺口发现均来自它；演练后主单与说明子单经引擎废弃端点受控置 DISCARDED，孙单（6f75247a）为修复前对账已收敛的 APPROVED 行；两条数量关闭说明单记录留存（db-final-state.txt）。未手工改任何业务数据。
- **344 为本项代表性交付对象**：完整走通拦截→交代→关闭→查回。

## 4. 门禁与限制

- **聚焦单测**：`BpmInstanceStateSyncJobTest` 3/0（钩子先于状态落库/钩子异常保留 RUNNING 重试/引擎活跃不动）；`mvn -Pdev package -DskipTests` 全仓 BUILD SUCCESS（bootstrap-dev 23:23 重建，含修复类）。变更面=单文件+单测试，未重跑全仓套件（既有 2006/3 既有归因基线沿回执03；本项无其他代码变更）。
- **Web 零变更**：节点表单渲染沿用既有 DynamicField 机制（验收03 已实证节点表单办理可见可填），本项未改前端、未启动 Web。
- **收敛时延**：异步终态结算走对账节奏（60s+静默1分钟），每跳一次对账，链344 全程约 3 分钟收敛——有界、可观察、幂等，属对账语义既有设计，非阻塞缺陷。
- **查询接口口径**：表单数据列表接口无按字段检索端点；"按工单查回"走实例关联路径（businessKey→实例→node-form-data/子批次），与既有结果查询同层，满足裁决04"节点提交数据持久保存、可按工单关联查看"的结果要求；数量关闭说明单记录行不携带提交值（沿裁决04：不另立记录行复制要求）。
- **运行环境**：agent 启动的 dev server 已受控结束（23:38:48，端口 8080 回收，进程退出）；用户 PostgreSQL 未动；代理进程收尾记录 r4-server-shutdown.txt。

## 5. Git 与状态

- Server（feature/p64-mes-advanced-orchestration）：`BpmInstanceStateSyncJob.java` + `BpmInstanceStateSyncJobTest.java` 提交 `4681634` 已推送，`git ls-remote` 回读=本地 HEAD（309d2aa→4681634）。
- 工作区（develop-sw）：回执04、evidence/phase3-04 INDEX、提示03/裁决04 归档、knowledge-first 路由同步，随后批提交推送。
- P64 整体 IN_PROGRESS，Ⅰ/Ⅱ PASSED、Ⅲ VERIFYING；总3阶段：完成2/进行中1/未开始0；功能47、46/22/22=90、ADV64、问题57与正式基线保持；P62 性能延期/OFF 保持。

**唯一下一动作=Planner 按提示03验收回执04**；不写阶段Ⅲ通过、不核销、不晋级基线。
