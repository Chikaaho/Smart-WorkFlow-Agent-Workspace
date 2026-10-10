# P64 阶段Ⅱ完成回执04（按二级提示02 唯一原子矩阵逐项收敛）

2026-10-10/11；Executor；XL（P64 阶段Ⅱ）。依据[复审03](planning-review-phase-2-03.md)与唯一执行入口[二级提示02](planning-execution-prompt-p64-phase2-02.md)，在既有完整实施授权内完成剩余原子矩阵（P2-02a…P2-07b），追加本回执；证据树 [phase2-04](evidence/phase2-04/INDEX.md)（MANIFEST.sha256 工具生成并回读全 OK）。已锁定子事实（复审03§1）未重验；阶段Ⅱ保持 **VERIFYING**、P64 整体 IN_PROGRESS、阶段Ⅰ PASSED、阶段Ⅲ未验收；不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。

## 0. 对象与环境（不可变事实）

- 验证库 `smart_workflow_p64p2c`（PG，17 迁移至 0.1.9）；修复运行身份 = Server 工作树内容（见 §3 run-identity 哈希，提交后另取截止）。
- **P2-02a/05a 对象**：委托定义 `bpm_4182219413fd418a`（表单 p64p2b_delegate_form）；A 链 taskA `43917603-c4bf-11f1-b10a-00ff9e2a8dfb`（recordA 19fb64cc-6191-4055-8f60-5fef3087484a）、B 链 taskB `479e24bb-c4bf-11f1-b10a-00ff9e2a8dfb`（recordB 00fddf15-92db-40f7-bc58-c1fa7b7be728）、C 链 taskC `4c44a269-c4bf-11f1-b10a-00ff9e2a8dfb`（recordC ec8b52de-bd4d-4fb1-93da-73844fcddb60）；委托关系 2108847481303412738（运维岗→主管岗，ORG）。
- **P2-02b 可见主链对象**：claim 候选任务 `2b8f516e-c4c5-11f1-aad4-00ff9e2a8dfb`（record ae8e6dd0-8efd-4347-ab95-af54d0ea254b）；父链 record `5b1ad219-853e-460f-88a9-819cfe1ac305`、父实例 `97f89219-c4c4-11f1-aad4-00ff9e2a8dfb`（APPROVED）、批次 `2108953698522652674`（SETTLED 2/2）、冲突项 `2108953698654830593`（恢复 WRITTEN）、张三子记录 `5276b840-7cfc-459e-a5f9-996cfd776081`、李四子记录 `61835090-8e82-4a89-b204-edcc3dc7279b`。
- 环境：真实 Chrome（`--remote-debugging-port=9333`，独立 profile，headless=false）+ 后端 prod profile（p64p2c）+ 前端 vite dev；登录=挑战/OCR（含刷新重试）；验证服务为本轮自身任务，收尾已按精确 PID/端口回读（见 §5）。

## 1. 逐项处置（原子ID → 行为/结果 → 原件）

### P2-02a 候选合法领取/办理路径（新增产品反证 → 确证缺陷 → 最小修复）
- **诊断**：候选组任务（assignee=NULL）在待办可见，但详情按 assignee 严格校验返回 403「无权查看该任务」，且全仓无任何 BPM 任务 claim/领取端点 → 候选无任何合法办理入口（复审03 新增反证成立）。
- **最小修复**：引擎 `BpmTaskFacade.claimTask`（仅未认领且候选可领；领取即竞争定胜负：`taskService.claim` + 移除其余候选链接；已领取确定性失败、非候选 403）+ `POST /workflow/tasks/{taskId}/claim` + `TodoTaskRespDTO.candidate` 标记 + Web 待办行「待领取」标签与「领取」按钮（确认框）。读取授权不放宽（详情仍按 assignee）。
- **实机（真实 HTTP + PG，原件 `raw/live/05a-delegate-freeze-chain.json`）**：张三领取 taskC → 200/0、详情 assignee=本人 200；**李四（非候选）领取 403「无权领取该任务（当前用户不是候选）」**；**乙（候选，后到）领取 2305「任务已被领取: 当前办理人 2108817586024214529」**；乙对已领取任务的办理命令受理后终态 **FAILED「无权处理该任务」**（原件 `raw/db/05a-freezeC-loser-command-final.txt`；taskC 保持 assignee=张三未被乙推进）；非候选/被领取后详情均 403。
- 层级：真实 API/SQL + 新增单测（引擎 4 例、控制器 3 例、Web 3 例）。

### P2-02b 可见可交互会话真实办理 + 桌面/768 视觉（新取证通道）
- 通道切换：宿主截图面已证失败不重试；改用**真实 Chrome + CDP**（headless=false，独立窗口 1440×900）——`Page.captureScreenshot` 像素原件 + `Runtime.evaluate` 真实控件动作（原生 value setter + input/change 事件驱动 Vue v-model）+ 服务端 AccessLoggingFilter 网络索引。
- **主链（原件 `raw/ui/r04-desktop-*.png|.txt`、`r04-chain-log.json`、`04-request-index-ui-session.txt` 180 行）**：张三待办（候选行「待领取」+领取按钮）→ 领取确认框 → 领取成功（行转待审）→ 任务详情（节点表单可见）→ 通过；admin 运维填报（表单实填 6 输入）→ 通过 → 子派发；张三子任务详情（结果表格预填本实例授权行）实填 4 输入 → 通过；李四子任务实填 2 输入 → 通过；**真实主记录版本冲突**（批次 BLOCKED、项 CONFLICT「回写与父记录当前版本冲突（当前权威版本 1）」）→ **有权恢复 `POST /workflow/child-items/{id}/retry-writeback` 200「回写已按当前版本应用」→ 批次 SETTLED 2/2**；admin 复核 → 通过 → **父实例 APPROVED**；实例回查抽屉「子流程批次与回写」面板含逐项 writeback JSON 实值（`{"rows":{…"feedback":"R04-ZS-4"},"main":…}` / `R04-LS-2`）。
- 768×1024：待办与实例回查窄屏像素与 DOM 快照（`r04-narrow-01/02`）；回查面板补采说明 `r04-readback-addendum.json`（详情抽屉由「查看详情」按钮打开，行点击不打开）。
- 层级：真实浏览器（可回读视觉制品/URL/视口/身份/对象/网络索引）。

### P2-03a COUNT 合法 K 阈值
- 新断言（`raw/unit/04-TEST-ChildOrchestrationServiceTest.xml` + 方法摘录）：未达 K 不结算不唤醒（K=2、1 成功）；失败不凑数（FAILED+WRITTEN 1<K=2 不结算）；达 K 且所需回写成功**只结算推进一次**（状态守卫 UPDATE 恰 1 次 + 唤醒恰 1 次），此后迟到完成记 LATE、不回写/不唤醒、已用结果不被改写。合法 K 冻结与 K>预期整体拒绝为复审03 已锁定共享路径（不重验）。

### P2-03b NONE 真实结算与迟到边界
- 冻结登记为 WAITING（可靠意图提交前不推进）→ 全部项登记后 `settleIfNone` 经**真实结算通道**（同一 settleBatch）SETTLED+唤醒恰一次；结算后迟到反馈**版本化留痕**（writeback_json/writeback_time/writeback_source 齐备）且零回写零唤醒（不覆盖父完成快照）。派发侧「登记完成后才结算」时序为复审03 锁定共享路径。

### P2-03c 取消/退回终态与旧回调失权
- 取消实值捕获（非 `update(any)`）：批次 set 值含 **CANCELLED**+失权原因「失去写回推进权」、项 set 值含 **REFUSED**+「失去向当前轮次写回/推进的资格」（`getParamNameValuePairs` 断言）；旧批次迟到终态 → REFUSED+快照留痕、applyWriteback 0、signalWaitNode 0；同父新轮次（round=2）批次不受污染照常结算推进。

### P2-04a 同业务角色跨负责人隔离（真实 HTTP 探针）
- 原件 `raw/live/04a-cross-owner-probes.json` + `04a-my-instances-exit.json`：张三读本人子记录 200、李四读本人子记录 200；**交叉读取对方子记录均 200 = 平台角色域 data_scope（SELF/DEPT/ALL 由用户角色配置）既有语义**，非 P64 实现路径、非本轮引入（角色less 甲 403 对照保持）；子记录内容仅含本人授权行（阶段Ⅱ已锁定）；**列表出口**：my-instances 张三/李四/甲各 0 条（互不串号），admin 37 条对照。
- 边界：owner 级记录隔离是否需产品级收口（改变平台数据域语义，影响全表单与 P62/P63）超出 P64 阶段Ⅱ授权，**留规划裁决**；P64 层面隔离（子实例行集/回写授权/详情按 assignee）均已受控。

### P2-04b 排序/重复/旧轮次不污染
- 新断言：提交行序倒置仍按**冻结行 ID+逐行版本**回写（row-a→v3、row-b→v4 不错行不串版本）；同一行重复出现仅回写一次（无重复副作用）；旧轮次提交不覆盖当前权威结果（latestSubmitted 取当前轮次，仅应用一次）；重复终态回调零回写零唤醒。

### P2-05a 清理前冻结快照（新对象，采集点置于清理前）
- 原件 `raw/db/05a-freeze*.txt`（SQL 快照，全部在清理前采集）：A 链启用前候选=运维岗任职 5 人（identitylink 逐行）；**启用委托期间 A 链逐对象不变**（两度启停后 final 与 before 逐行一致）；B 链启用期**零候选链接、直派李四**（assignee 逐字回读）；C 链停用后回候选 5 人；领取后 C 链候选清空仅存领取者链接（竞争单结果数据面）。旧已销毁对象不追造；本轮对象清理后终态见 §5。

### P2-05b 岗位策略目标断言（先封装既有，补缺）
- 既有锁定复用：部门优先、唯一有效关系、自委托/同优先级重叠、空缺不回退（PositionDelegateFacadeImplTest/PositionDelegateServiceImplTest 既有用例，复审03 已核不重验）。
- 本轮补齐：**超 4 跳运行期**（1→2→3→4→5 链解析终止抛「超过最大 4 跳」）与**配置期**（1→5 且既有 5→4→3→2→6 四跳链 → 保存拒绝）；**跨租户受托岗位**（越权异常、不自动回退）；**运行期循环**（1→2→2→1 → 循环异常）；**解析失败传播**（`PostParticipantResolver` 不吞异常 → 节点不产生任务不推进）。

### P2-06a 受影响护栏边界（小输入，不压测）
- 新断言：**根链 1000**（selectCount=1000 → CHILD_CHAIN_OVER_LIMIT，零新增批次/项/意图）；**嵌套硬 8**（配置抬高到 10 仍按硬钳 8 拒绝，深度 8 即拒）；**派发上限**（集合 > maxDispatch → OVER_LIMIT 整体拒绝，冻结从未发生、意图零新增，拒绝原因可诊断）。阶段Ⅰ 既有护栏按锁定不重开。

### P2-06b 在役/启停/回退（影响映射 + 最小实测）
- 依赖映射：阶段Ⅰ兼容原件锁定复用——P64AppendMigrationUpgradePostgresTest（旧 0.1.6 非空基线追加 3 条、存量行逐字节原义、六新表零写入 1/0）；instances 表 def_version 逐行冻结（旧实例沿冻结图）。
- 本轮实测（`raw/migration/04-additive-ddl-check.txt` + `raw/unit/04-TEST-P64RollbackBoundaryPostgresTest.xml`）：0.1.8/0.1.9 DDL **纯追加**（2+1 新表、索引若干、零 ALTER 既有表、零破坏性语句）；**回退边界真实观察**：旧迁移集（8 版本+6 个 R__，从 classpath 真实复制）对在役 0.1.9 库 validate **失败**且 `invalidMigrations=[0.1.8, 0.1.9, R__p64_position_delegate_menu]`；对照一：旧集对旧终点库（0.1.7）迁移+校验通过；对照二：在役完整集对 0.1.9 库 17 条校验通过——"不能处理存量的旧代码直接切回"有机器可判定的失败门。启停侧：委托 DISABLED→新任务回候选组、既有任务逐对象不变（P2-05a 同链原件）。

### P2-07b 权威覆盖矩阵（逐入口字段/值/时点）
- 覆盖矩阵见 §5；本轮实际受影响当前入口：`knowledge/current-status.md`（顶部回执04 条目）、`knowledge/features/p64-mes-advanced-orchestration.md`（当前状态行）、`knowledge/session-handoff.md`（覆盖值段）、`memory/{state,README,features,decisions,handoff}.md`、`todo/p64-mes-advanced-orchestration.md`、`todo/requirement-pool.md`、`ready/direction-p64-phase2-personnel-parent-child.md`（状态句）。Planner 本轮已修 memory/todo/product 范围按授权回读复用（不重复覆写其结论），knowledge 权威由本回执同步。
- 三仓 Git 截止与远端回读见 §5（提交后另取）。

## 2. 本轮实际修改文件

**Server（14 文件）**：
- 主码 5：`sw-bpm-api/.../facade/BpmTaskFacade.java`（+claimTask 契约）、`sw-bpm-api/.../orchestration/SubflowWaitPort.java`（void→Optional<MutationOutcome>）、`sw-bpm-engine/.../facade/BpmTaskFacadeImpl.java`（claimTask 实现）、`sw-bpm-engine/.../listener/SubflowWaitListener.java`（消费处置结果）、`sw-bpm-process/.../controller/BpmTodoController.java`（+claim 端点+candidate 标记）、`sw-bpm-process/.../dto/TodoTaskRespDTO.java`（+candidate）、`sw-bpm-process/.../port/SubflowWaitPortImpl.java`、`sw-bpm-process/.../service/ChildOrchestrationService.java`（等待到达返回 Optional 处置结果）。〔注：主码共 8 文件〕
- 测试 7：`BpmTaskFacadeImplClaimTest.java`（新 4 例）、`PostDelegateParticipantResolverTest.java`（+1）、`ChildOrchestrationServiceTest.java`（+13）、`TriggerExecutionServiceChildDispatchTest.java`（+1）、`BpmTodoControllerTest.java`（+3）、`PositionDelegateFacadeImplTest.java`（+3）、`PositionDelegateServiceImplTest.java`（+1）、`P64RollbackBoundaryPostgresTest.java`（新 1 例）、`I6G7bOldBaselineUpgradePostgresTest.java`（锚 14→17）、`ErrorCodeCatalogTest.java`（178/173）、`P64AppendMigrationUpgradePostgresTest.java`（appLocations 访问器）。〔注：测试共 11 文件〕
- 配置/文档：`docs/governance/error-code-catalog.md`（§2 169→178 + 9 行）、`i18n/messages_zh_CN.properties` + `messages_en_US.properties`（9 键双语）。
**Web（5 文件）**：`contracts/bpm.ts`（candidate）、`modules/workflow/api/index.ts`（claimTask）、`modules/workflow/views/TodoList.vue`（待领取标签+领取按钮+确认）、`locales/zh-CN.ts` + `en-US.ts`（5+1 键）、`views/TodoList.spec.ts`（+3 例）。
**工作区**：本回执、证据树 phase2-04（本机留存，`.gitignore`）、knowledge 三件、memory/todo/ready 指针；本机工具 `logs/p64p2h-r04-*.cjs/.java`（不入库）。

## 3. 门禁（本轮实跑，原件 `raw/gates/`）

| 门禁 | 计数 | 退出码 | 运行身份 |
|---|---|---|---|
| Server engine test | **114/0/0/0** | 0 | 工作树内容（`04-run-identity.txt` 哈希） |
| Server process test | **379/0/0/0** | 0 | 同上 |
| Server system-biz test | **363/0/0/0** | 0 | 同上 |
| bootstrap 受影响锚 8 类（FlywayFullChainH2/PG、Append、Rollback、I6G7b、ErrorCodeCatalog、Bilingual、ApiOptional） | **56/0/0/0** | 0 | 同上 |
| Web typecheck / lint / vitest / build | 四门 exit0；lint **0e/3w**（基线）；vitest **153+1 文件 / 1385+3 用例**；build ✓3.19s | 0 | 同上 |

- 完整 bootstrap 套件（test5）暴露的既有漂移 5 类已在本轮修复（双语 9 键/catalog 178/173、SubflowWaitPort 契约、I6G7b 锚、回退测试自身两轮修正）；**P63ImmediateMqttBrokerPgTest / P63ReservationUnknownPgTest** 依赖受控 MQTT broker 外部前置（任务启动脚本登记），属 P63 域环境前置，按复审03§3 不重开，原始失败行保留（`04-gateB-full-suite-excerpt.txt`）。
- 门禁命令与参数见 `04-gate-commands.txt`；日志 `04-gateA-three-modules.log`、`04-gateB-bootstrap-anchors.log`。

## 4. 与方向的偏差 / 遇到的问题 / 风险

1. **候选合法入口为新增确证缺陷并最小修复**（复审03 分类"实际产品行为不符"）；修复仅新增领取路径，未放宽任何读取授权（详情仍按 assignee）。
2. **交叉读取 200**：属平台角色域 data_scope 既有语义（全表单一致），P64 未引入；owner 级记录隔离若需要则属产品级收口（影响 P62/P63），留规划裁决。
3. **节点表单填充值按 DOM 顺序分配**（自动化交互的输入序，非产品语义）；业务结果以服务端回写实值为准（R04-ZS-4/R04-LS-2 已入父记录与批次 JSON）。
4. **真实版本冲突出现于主链**：两子并发回写父主记录（mainFields title），第二子 CONFLICT→有权恢复重放（设计内路径），已作为正例闭环证据。
5. 登录流程使用 OCR（挑战图）+刷新重试；`ch.dev.test-mock` 固定验证码仅 `-Pdev`/local 构建可用（dev profile 在主流构建下缺 prod 专属配置项，与 PG 验证库不兼容），本轮如实使用 prod profile。
6. P63 两测环境前置不属本轮范围；bootstrap 全量套件（含环境依赖项）不作为本轮门禁集合。

## 5. 自身收尾与覆盖矩阵（P2-07b/07c）

- **对象清理（采集后）**：本轮全部 RUNNING 实例逐个 `POST /workflow/instances/{id}/discard`（29 个，`raw/live/04-self-cleanup.json` 逐项 200）→ 回读 **RUNNING=0**、`act_ru_task=0`、`act_ru_execution=0`（`raw/db/04-final-object-states.txt`：75 实例=24 APPROVED+51 DISCARDED，历史保留）；委托关系终态 DISABLED（05a 链 P5 读回）；旧历史对象（上一轮 SETTLED 批次、DISCARDED 实例、BLOCKED 说明）保留。
- **服务收尾**：后端（PID 10072）/前端 dev（PID 28572）/Chrome（按独立 profile 精确清理）终止后 8080/5173 **零监听**；未触碰 Owner 既有服务（PG PID 15876 全程未动）。
- **覆盖矩阵（逐入口字段→实际值→回读位置→时点）**：`knowledge/current-status.md` 顶部条目（阶段Ⅱ=VERIFYING/回执04 待验收/唯一下一动作=Planner 验收）｜`knowledge/features/p64-mes-advanced-orchestration.md` 当前状态行｜`knowledge/session-handoff.md` 覆盖值段｜`memory/state.md`（下一步=Planner 验收回执04）｜`memory/handoff.md`｜`memory/README.md`｜`memory/features.md`｜`memory/decisions.md`｜`todo/p64-mes-advanced-orchestration.md`｜`todo/requirement-pool.md`｜`ready/direction-p64-phase2-personnel-parent-child.md`（状态句=回执04 已提交待验收）｜计数 47/46-22-22=90/ADV64/57、P63=COMPLETED/VB、P62 延期/策略 OFF、gitlink `78495dc`/`7af86f24` 逐项保持。核验时点=本回执提交时。
- **三仓 Git**：Server `4319bb4`→本批次（修复+测试+配置，另取截止）；Web `fbfb44a`→本批次（领取入口，另取截止）；工作区批次见提交后回读（memory/handoff 关联）；根 gitlink `78495dc` 保留不修改。

## 6. 自验结论

二级提示02 原子矩阵逐项闭合：候选合法办理以最小修复+真实反证闭环（含竞争单结果与失败方失权）；可见主链在真实浏览器完成多角色实填办理与父子回查（含真实冲突→有权恢复→单次结算）；策略阈值/终态失权/隔离出口/冻结/护栏/回退边界均有目标断言原件；门禁与自身收尾可回读；失败原件保留、层级如实。**自验通过，待规划按二级提示02 客观矩阵独立验收回执04 与 phase2-04 证据树。** Executor 不写功能 PASSED/COMPLETED、不核销 P、不移动方向到 passed/。
