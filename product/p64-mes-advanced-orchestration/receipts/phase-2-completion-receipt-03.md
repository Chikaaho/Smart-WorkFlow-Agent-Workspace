# P64 阶段Ⅱ完成回执03（按一级提示01 剩余账本逐项收敛）

2026-10-10；Executor；XL（P64 阶段Ⅱ）。依据[复审02](planning-review-phase-2-02.md)与唯一执行入口[一级提示01](planning-execution-prompt-p64-phase2-01.md)，在既有完整实施授权内完成九行剩余账本（P2-01…P2-07c），追加本回执；证据树 [phase2-03](evidence/phase2-03/INDEX.md)（**62 件，MANIFEST.sha256 工具生成并 `sha256sum -c` 回读 62/62 全 OK**）。已锁定子事实（复审02§已锁定）未重验；阶段Ⅱ保持 **VERIFYING**、P64 整体 IN_PROGRESS、阶段Ⅰ PASSED、阶段Ⅲ未验收；不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。

## 0. 对象与环境（不可变事实）

验证库 `smart_workflow_p64p2c`（PG，Flyway 17 迁移至 0.1.9）；父定义 2108817690357526529/`bpm_c5e9fcfffb7745ee`（冻结图 v2/v3）、子定义 2108817689703215105/`bpm_37a3eed391d2481d`、委托验证定义 `bpm_4182219413fd418a`、聚合验证定义 `bpm_ddb933f9cce14014`；SETTLED 批次 2108846864182882306（父实例 02434573-c48a-11f1-bd5c-00ff9e2a8dfb、父记录 bb8652b2-5f4e-4485-a58c-a3cafb069a70）；委托关系 2108847481303412738（运维岗 2108817585520898049→主管岗 2108817585617367042，ORG）；聚合链实例 9c3aba21-c49d-11f1-8088-00ff9e2a8dfb。本轮服务为自身验证会话任务（后端 40352、前端 dev 44396），收尾已按 PID 终止。

## 1. 逐项处置（ID → 行为/结果 → 原件）

### P2-01 设计器 CHILD 可视化配置原流（含保存/发布请求与图结果）
- 行为：可见会话登录（POST /auth/login 200, 19:38:43）→ redirect 直达设计器 → 触发器面板打开 trg_child → 编辑对话框内 CHILD 全部控件真实可见（主子流程勾选、等待策略 ALL、结果节点 node_result、result_table/src_row_id/hosts、行级映射 feedback→feedback、主记录映射 summary→title）→ 重填「主记录回写·父字段」=title（真实控件编辑事件）→「保存修改」→「保存」（**PUT /workflow/defs/2108817690357526529/graph 200, userId=1, 19:40:03**）→「发布」→ 确认对话框 →「确定发布」（**POST …/publish 200, costMs=2558, 19:40:24**；toast「发布成功：图、节点配置、表单与函数版本已冻结」）→ 冻结 graph_version=3。
- 一致性：草稿 API 图（GET /workflow/defs/{id} 200）与冻结 v3 图 triggers 的 CHILD 动作语义经键序规范化后**逐字段相等**（orchestration=CHILD、waitPolicy=ALL、writeBack{resultNodeKey/tableField/rowKeyField/parentTableField/fields/mainFields}、sourceVariable=var_hosts、groupBy=owner、maxDispatch=50）——CHILD/等待/映射无丢失。
- 原件：`evidence/phase2-03/raw/ui/01-*.txt`（7 件快照）、`raw/live/01-api-draft-graph.json`、`01-consistency-check.json`（draftEqualsFrozenChildSemantics=true）、`raw/db/01-frozen-v3-graph-db.txt`、`01-frozen-v3-triggers-reassembled.json`、请求原行 `raw/ui/02-request-index-ui-session.txt`。

### P2-02 业务页可见会话与请求关联（视觉限制如实）
- 行为：同一可见会话内完成 admin（实例列表→父实例 bb8652b2 详情回查）与张三（待办/已办）、李四（任务详情）多角色页面流；桌面 1280×720 与窄屏 768×1024 双视口。
- 结果：结构化 domSnapshot 原件 9 件（实例列表、**父实例详情含「子流程批次与回写（P64 阶段Ⅱ）」面板：SETTLED·ALL·预期2/已结算2·深度0 + 逐项回写值 JSON 可见**、张三待办与已办空态、李四任务详情业务控件页=节点业务表单可填+通过/驳回/转办/委托/加签/补签动作可见）；服务端 AccessLoggingFilter 逐请求原行 69 条（含方法/路径/状态/耗时/userId/web-* clientRequestId）。
- 如实：①候选任务（assignee NULL）打开任务详情返回「无权查看该任务」——真实页面状态原样存证（快照05），本轮未改实现，是否属产品口径问题留规划裁决；②**登录后页面像素视觉原件仍未取得**：截图通道本轮新错误变体（`activity capture failed for guest`、`tabs.new: guest not attached (webview not ready)`）与合成点击不触发提交（evaluate 派发可触发）均已归档（capability-error-archive.txt 追加段），已证失败路径未重复重试；正式 A11 视觉验收保持未通过，不以 HTTP/DB/快照冒充视觉。
- 原件：`raw/ui/02-*.txt`（9 快照+索引）、能力归档追加段。

### P2-03 SETTLED 链对象原流与四策略/负例分层
- 对象原流（真实 PG/Flowable 只读回读）：父实例 ACT_HI_ACTINST `node_ops=1、wait_children(receiveTask)=1、node_review=1`——**等待节点结算后单次推进恰一次**；父任务历史=运维填报 1 次（17:07:27）+运维复核 1 次（095aea5d）→ 父实例 APPROVED（sw_bpm_instance）；子实例 049dd757（张三 2 行）/049dd758（李四 1 行）各 1 任务创建→完成；批次 2108846864182882306 SETTLED 2/2（settledAt 17:07:36，与复审02 锁定值一致）。
- 逐 case 原件：本轮门禁重跑产出 4 类 20 testcase 全量 XML（编排 10 + CHILD 派发 3 + 聚合 4 + 等待翻译 3；20/0）；关键安全/行为方法按花括号配平边界原样摘录 20 方法（分组多行回写/恢复清冻结版本/冲突挂起/ANY 迟到留痕/取消退回/嵌套超限/K 超限/NONE 立即结算等）。
- 分层如实：ALL/N=2 有实机对象链；ANY/COUNT/NONE、迟到、取消、重试不增预期=UNIT 层（XML+摘录），不冒充实机、不新开 S3。
- 原件：`raw/db/03-settled-chain-history.txt`、`raw/unit/03-TEST-*.xml`、`03-assert-*.txt`。

### P2-04 父行终值、授权出口与隔离
- 失败 SQL（phase2-02 `raw/db/parent-rows.txt`：ERROR column src_row_id does not exist）**保留未改**；按真实 schema 正确只读查询（动态宽表 `sw_form_table_pucs20ea5b`）：稳定行 **34990247=host-01正常(version 1)、40c297a7=host-02需复检(v1)、7f81b23e=host-03正常(v2)**——与两项 WRITTEN 项 source_rows_json 冻结授权行集（张三 2 行/李四 1 行）精确对应；全父记录行级分布回读证明无越权行写入/泄露（其余父记录 hosts 行 feedback 为空/未动）。
- 授权读取/拒绝原结果（真实 HTTP）：张三读本人子记录 c899a2c8 **200/0**；甲（无业务角色，data_scope fail-closed）读张三/李四子记录 **403×2**；管理员对照 **200**。
- 集合外行拒绝/版本守卫=UNIT（摘录+XML：writebackVersionConflictSuspendsItem、groupedItemWritesBackAllAuthorizedRowsOnly）。
- 原件：`raw/db/04-parent-hosts-final.txt`、`04-parent-hosts-all-records.txt`、`04-record-authz-probes.txt`、`raw/db/03-items-all.txt`。

### P2-05 委托时点逐实例关联与真实聚合下一会签
- 委托净版链（先诊断：回执02 `p64p2b-delegate.json` before 相位被遗留 ENABLED 委托污染——本轮先显式 DISABLED+读回再取 before）：
  - 未启用：新实例（90ab175d）node_ops 任务=**岗位候选组**（act_ru_identitylink 候选=运维岗任职 5 人：张三/甲/乙/丙/丁；assignee NULL）；李四不在候选（identitylink 为证，非全局 boolean）。
  - 启用（PUT status=ENABLED，读回 ENABLED）：新实例（9345bf85）任务**直派受托岗位持有者李四**（assignee=2108817586460422146，零候选链接）。
  - 停用（读回 DISABLED）：新实例（95cd7be3）回候选组（5 人含张三）。
  - 旧冻结名单：75b73d48/77954c26/79761a24 三任务在启停全程逐对象回读**未被改动**（77954c26 保持李四、79761a24 保持候选态）。
- 聚合实机链（A07 本阶段基本行为，未整体推迟）：node_a（候选=甲/乙）甲办理填 handlers=[丁,丙,丁]（显式重复）、node_b 丙填 [甲]（负控）→ node_agg=CONSENSUS + NODE_FORM_AGGREGATE{nodeKey:node_a, formField:handlers, round:CURRENT} → **恰生成丁+丙两会签任务**（直派 assignee；[丁,丙,丁] 去重；甲 0 个）；来源/轮次可追溯（sw_bpm_task_form_data 两条 SUBMITTED、participant_snapshot 5 行、consensus_vote 丁/丙两票 APPROVE）→ 实例 9c3aba21 **APPROVED**（sw_bpm_instance）。
- 负例=UNIT 摘录+XML（invalidShapeRejectedWithActionableMessage/inactiveUserRejectsWholeResolution/missingPortYieldsEmpty/aggregatesUnionDedupAcrossTasks）。完整 S2 场景仍属阶段Ⅲ。
- 如实：participant_snapshot 中后结算方标注「节点已由先完成方以 APPROVE 处理」的 invalid_reason 为结算顺序记账，其自身 APPROVE 投票行同表可证（非丢票）。
- 原件：`raw/live/05-delegate-chain.json`、`raw/db/05-delegate-tasks-db.txt`、`raw/live/05-aggregate-chain.json`、`raw/db/05-aggregate-db.txt`、`raw/unit/03-assert-AggregateParticipant-keyMethods.txt`。

### P2-06 迁移版本原证与护栏
- 全新库迁移原件：`p64p2c-backend.log` 原行提取——`Successfully validated 17 migrations` → 逐条 `Migrating schema "public" to version "0.1.x"`（含 0.1.8 p64 phase2 parent child、0.1.9 p64 position delegate）→ `Successfully applied 17 migrations … now at version v0.1.9`；PG `flyway_schema_history` 回读 17/17 success=true。
- 锚门禁 30/0（4319bb4 内容）：H2 全链 FlywayFullChainH2Test **17/0** + PG 全链 FlywayFullChainPostgresTest **12/0** + P64 追加迁移演练 P64AppendMigrationUpgradePostgresTest **1/0**。
- **缺陷⑧（本轮发现并修复）**：`FlywayFullChainPostgresTest.tamperedBaselineChecksum_shouldFailValidateNotSilentlyPass` 的基线建库计数断言仍为旧链 14 条（同类锚已更新至 0.1.9 链=17 而此行遗漏）→ 重跑暴露 1 失败 → 修正为 17（含注释）→ 重跑 30/0 全绿。篡改校验和保护行为本身无回归。Server 提交 `4319bb4` 已推送。
- 护栏：freezeBatch_freezesIdentityAndRejectsInvalidCount、freezeBatch_nestingOverLimitRejected（摘录+XML）；受影响旧实例沿冻结 def_version 原义（instances 表 def_version 逐行可读）。
- 原件：`raw/migration/03-flyway-fresh-p64p2c.log`、`raw/db/03-flyway-history.txt`、`raw/gates/03-server-gate-bootstrap-anchors.log(+.exit)`。

### P2-07a 命令/断言/产物/层级封装与 ADR 措辞
- 门禁原件带退出码与运行身份：engine **109/0**（exit 0）、process **360/0**（exit 0）跑在 `8b5bb10`（identity 文件记录 rev-parse+脏计数=0）；bootstrap 锚 **30/0**（exit 0）重跑于 `4319bb4` 内容（8b5bb10+该 1 行测试修复，随后提交）。
- 逐 case XML（20 testcase）+ 方法边界摘录（20 方法，注明源文件路径/行区间/最后提交）与本轮回跑同源；未复制整类、未以 rg 方法名代摘录。
- 计数更正：phase2-02 树实际 34 条哈希全 OK（复审02 已核，正文 32 为转录笔误，原附件不改）；本轮树 62 件全 OK，按实际条目数转录。
- ADR-002 §5 证据层级措辞修正：「聚合会签在回执02 轮的证据层级为 UNIT…回执03 轮按一级提示01 补实机聚合下一会签演示与逐 case 原件」。

### P2-07b knowledge 覆盖与三仓 Git
- knowledge-first：`knowledge/current-status.md` 顶部新条目（回执03 提交待规划独立验收、九行处置要点、门禁与 Git 时点值）、`knowledge/features/p64-mes-advanced-orchestration.md` 登记状态更新、`knowledge/session-handoff.md` 交接刷新；memory 五入口与 `todo/p64-mes-advanced-orchestration.md`、`todo/requirement-pool.md` 按既有终态同步授权对齐到「复审02/提示01→回执03 已提交待验收」；旧当前段矛盾已由规划侧清除，本轮未覆写任何历史审查。
- 三仓截止与远端回读（原输出入 `raw/git/`）：Server `4319bb4`=origin（含缺陷⑧修复）、Web `fbfb44a`=origin（本轮零改动、工作树干净）、工作区 `feea9c82`=origin（本批次提交后以 memory/handoff 关联，不回执自 SHA）；根索引 gitlink Server `78495dc`/Web `7af86f24` 保持不修改。

### P2-07c 验证任务与自身收尾
- 自建对象清理：8 个 RUNNING 实例（委托链 6+聚合遗留 2）逐个 `POST /workflow/instances/{id}/discard` 全 200 → API 回读 **RUNNING=0**（31 实例=9 APPROVED+22 DISCARDED）；act_ru_task=0、act_ru_execution=0。
- 保留对象如实说明：批次终态 1 SETTLED+4 BLOCKED（4 个 BLOCKED 的父实例均已 DISCARDED=无活动等待节点，无写回/推进资格；SETTLED 批次保留历史 CONFLICT block_reason 为持久事实）；委托 1 条 DISABLED（deleted=0）；验证用户/岗位/部门保留供复核；验证库与 `logs/` 本机留存（不删除取证数据，不提交 Git）。
- 服务收尾：后端（PID 40352）/前端 dev（PID 44396）按精确 PID `taskkill /T /F` 终止，停止后 8080/5173 **零监听**（netstat 回读空）；未触碰用户既有服务。
- 原件：`raw/live/07-self-cleanup-discard.txt`、`raw/db/07-final-object-states.txt`、`raw/live/07-service-shutdown.txt`。

## 2. 本轮实际修改文件

- Server：`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java`（1 行断言修正=缺陷⑧；提交 `4319bb4`，推送后远端回读一致）。业务实现**零改动**。
- Web：零改动（`fbfb44a` 保持）。
- 工作区：本回执、证据树 phase2-03（`.gitignore` 内仅本机）、INDEX、ADR-002 §5 措辞、knowledge 三件、memory/todo 指针、规划侧下发的提示01/复审02 与 ready/memory/todo 修改一并纳入本批次。
- 本机工具（不入库）：`logs/p64p2h-*.cjs/.java`、净化 argfile、本轮 backend/webdev 日志。

## 3. 门禁（本轮实跑，原件见 raw/gates/）

| 门禁 | 计数 | 退出码 | 关联提交 |
|---|---|---|---|
| Server sw-bpm-engine test | 109/0 | 0 | 8b5bb10 |
| Server sw-bpm-process test | 360/0 | 0 | 8b5bb10 |
| Server bootstrap 锚（H2 17 + PG 12 + P64 追加 1） | 30/0 | 0 | 4319bb4 内容（缺陷⑧修复行） |

Web 四门未重跑：Web 本轮零代码改动，复审02 已锁定其 153+1/1382+3/lint 0e3w/build 3.17s 既有原件（提示01§3 锁定不重验）。

## 4. 已知边界与如实限制

1. **登录后页面像素视觉原件未取得**（正式 A11 视觉未通过）：截图通道限制如实归档（两轮三种错误变体），替代证据=domSnapshot 结构化状态+服务端逐请求原行+API/DB 回读；已证失败路径未重试。
2. 候选任务详情「无权查看该任务」：真实页面状态（任务详情按 assignee 严格校验、候选仅在待办可见）——是否调整属产品口径，未改实现，留规划裁决。
3. 四策略负例/安全负例=UNIT 层原件；聚合会签完整多角色 S2 场景属阶段Ⅲ A09（本轮已补 A07 基本聚合实机）。
4. zonky 内嵌 postgres 子进程 stderr 存在字面 U+FFFD（第三方内嵌件 gobbler 编码行为），门禁计数与结论行均为可读 ASCII；DB 回读类原件本轮按实际编码以 UTF-8 重采，未臆译、未改写失败原件。

## 5. 自验结论

九行剩余账本逐项闭合，每项产品断言均有实际结果原件；失败原件保留、成功查询原件在档；委托 before 错配已澄清并以净版链替代；全部门禁 exit 0；自身任务退出与对象终态可回读。**自验通过，待规划按提示01 客观矩阵独立验收回执03 与 phase2-03 证据树。** Executor 不写功能 PASSED/COMPLETED、不核销 P、不移动方向到 passed/。
