# 知识库全量整理 B 阶段精确同步方向

> B阶段规划验收：PASSED（2026-09-04），见receipts/planning-review-sync-b-07-passed.md。下文保留原同步授权；后续按ready/direction-knowledge-full-reconciliation-terminal-sync.md执行。

日期：2026-09-04；角色：Planner；等级L；归属主功能`knowledge-full-reconciliation`。
前置：`receipts/planning-review-full-audit-02-passed.md`确认A阶段通过。

## 1. 权威输入与本轮目标

按A阶段账本、修正回执及规划复验02，将已确认差异落实到当前知识入口，建立可追溯的全量功能映射与剩余事项。规划复验02优先于修正回执，修正回执优先于A—E原账本；原件只作历史。

本方向授权文档同步，不授权新业务实现、补验收、Git提交/推送、分支切换、迁移、部署或治理规则修改。执行层先核对源快照是否变化；仅相关事实发生变化时回传新差异，不重新全量审计。

## 2. 唯一同步值

| 字段 | 本阶段唯一值 |
|---|---|
| 正式业务功能数 | 41；本审计增量0 |
| 清单规模 | 10模块、55功能、90明细 |
| 清单状态计数 | ✅34 / 🟦28 / ⬜28 |
| 唯一状态变化 | M04-F01-03、M04-F07-01、M06-F01-01、M06-F02-01、M06-F03-01：⬜→🟦；其余85行不变 |
| P编号 | 无新增、无新增核销；P34/P35/P37/P38/P39为部分实现、开放未核销；P4开放；P3/P21部分关闭未核销；P1/P7及其他已核销项不变 |
| P/I集合 | P物理57行、唯一56编号（保留P48总表/明细双入口）；I索引54条，区间I1—I55缺I27，本轮不增删 |
| 后端基线 | 1035/0/0/0，152份Surefire报告，既有P58验收快照 |
| 前端基线 | 117 files passed + 1 skipped / 1110 tests passed + 3 skipped；typecheck/lint/build退出0；lint 47 warnings/0 errors |
| Flyway | H2 V49（49迁移）/PG V49（48迁移） |
| 验证基线变更集合 | 空集；不把本轮文档检查计入业务测试数 |
| 当前任务状态 | knowledge-full-reconciliation：VERIFYING；A通过，B同步待Planner复核 |
| 活动业务实现功能 | 无 |
| 唯一下一动作 | Planner复核knowledge-full-reconciliation B阶段同步回执 |
| 方向目录 | 主方向和本B方向继续ready；不归档其他product方向 |

本阶段的VERIFYING是整个审计整理任务的状态，不影响A已通过事实，不提前写整体PASSED/COMPLETED。

## 3. 五项明细与查询固定文字口径

| 明细/需求 | 已交付子集 | 剩余范围 |
|---|---|---|
| M04-F01-03/P34 | ALL/ANY/RATIO会签结算、独立意见、取消语义 | 原明细完整规则（含一票否决）覆盖待确认，未完成整体核销 |
| M04-F07-01/P35 | 受控条件表达式、条件分支 | 超时处理、自动审批/自动通过规则 |
| M06-F01-01/P37 | 站内信、统一渠道SPI及已验收扩展接缝 | 真实厂商渠道、配置开关及账号联调 |
| M06-F02-01/P38 | 可复用通用消息模板与变量渲染 | 按渠道配置内容与变量；沿用P38，不新编号 |
| M06-F03-01/P39 | 内置审批事件、通知节点触发 | 用户可配置规则、订阅设置 |
| M06-F04-01/P3 | 投递状态持久化、幂等 | 状态查询/管理入口、失败重发、全局日志；不把状态落库写成完全缺失 |
| M04-F05-01/P4：我发起的 | 可复用流程监控数据，不能替代个人入口 | 专用入口与强制当前发起人查询缺失 |
| M04-F05-01/P4：我的待办 | API/页面及可处理者过滤已存在 | Owner确认尚未完成；列表行为、会签结算后消失及体验边界待后续验证 |
| M04-F05-01/P4：我的已办 | API/页面与历史处理人查询已存在 | 指定审批人ASSIGNEE缺失造成漏单的结构疑点待运行核实，不能写成已证实缺陷 |
| M04-F05-01/P4其他 | 抄送产生已有P58交付 | 抄送我的查询、催办入口仍缺 |

## 4. 逐文件授权

下表之外不修改；确需新增范围先回传差异。除新增索引外，只改列明的当前说明/状态/引用段，不替换整份历史回执。

| 文件/范围 | 精确改动 |
|---|---|
| `knowledge/current-status.md` | 按§2当前唯一值更新；登记本审计活动状态与唯一下一动作；GOV-AUDIT-13方向位置改为已在passed；保留P58历史交付计数与基线的日期，不让旧下一动作成为当前指令 |
| `knowledge/features/knowledge-full-reconciliation.md`（新增） | 登记本审计、A通过/B待复核、41业务功能不增加、主/B方向及规划审查指针；不加入业务功能计数 |
| `knowledge/feature-reconciliation-index.md`（新增） | 固化90明细、56个唯一P、54个I、55个审计product目录的双向映射与独立范围说明；可按章节压缩同义引用，但每个稳定ID必须可定位。附§5的证据待定位记录；注明41是历史正式功能计数而非product或feature文件数量 |
| `knowledge/session-handoff.md` | 先将修改前全文保存为`knowledge/history/session-handoff-before-knowledge-full-reconciliation-20260904.md`（若同名已存在不得覆盖，核对是否同一快照）；当前文件压缩为§2、§3及本任务指针。历史P57/P36候选指令不留在当前交接；移除不存在的agent-model-orchestration feature必读链接，改指新映射索引 |
| `knowledge/history/README.md` | 追加上项历史快照到索引；不改旧快照 |
| `knowledge/architecture.md` | A账本§6-11所列过期计数/成熟度/库待集成段改为指向current-status和功能映射索引；BPM/Agent/IoT按已交付子能力描述，不将模块整体写完成；不改变工程架构规则 |
| `knowledge/decisions.md` | 头部档案范围改D1—D48；历史正文不动 |
| `knowledge/known-issues.md` | 保留54条与原状态；I45追加通知批量发送已于2026-08-27完成及P58覆盖/剩余映射，指向§3和新索引；追加本轮同步说明。I27索引缺行在新索引记证据待定位，不凭审计A中的手工行恢复 |
| `knowledge/features/notify-frontend.md` | 独立功能ID改为“无独立清单ID；服务M05站内信”；保留原业务交付历史 |
| `knowledge/features/bpm-single-node-approval.md` | 独立功能ID改为“Walking Skeleton审批联通子集，服务M04-F04-01/M04-F05-01”；不占用M04-F01-01设计器ID |
| `knowledge/features/form-data-import-export.md` | 当前头部改COMPLETED（已确认，2026-08-29），引用对应规划终态复核 |
| `knowledge/features/minimal-business-closure.md` | 当前头部改COMPLETED（已确认，2026-08-28），08-29为后续审计；两日期不混用 |
| `knowledge/features/notify-template-management.md` | 当前头部改COMPLETED（已确认，2026-08-26）；限制段批量发送改已完成（2026-08-27），P3剩余按§3 |
| `knowledge/features/agent-graph-prompt-configuration.md` | 当前状态改COMPLETED（已确认，2026-08-21，D157），历史FAILED记录保留为历史 |
| `knowledge/features/p57-bpm-node-extension.md` | “P58未启动”限定为P57交付当时事实，当前引用P58已确认完成 |
| `knowledge/features/p58-workflow-node-capabilities.md` | 追加本轮五项部分实现映射及新计数指针，不改写P58当时“明细零变化”的历史裁决 |
| `knowledge/features/bpm-plugin-architecture.md` | I47历史遗留附已由bpm-h2-v8-compat修复指针 |
| `Smart-WorkFlow-Server/功能清单.md` | 仅§2五行状态和§3对应范围文字、M05说明、当前统计/焦点/下一动作及本轮对账记录；原90行ID保留。三类查询分列为同一明细的子项说明，不加明细行。P47等未经本轮定位的旧实现结论标为历史快照待核，不能宣称当前已验证 |
| `todo/requirement-pool.md` | P3/P4/P34/P35/P37/P38/P39采用§3；D83 stub不再作为当前缺口权威，改指knowledge当前状态/新索引与正式回执；T1—T10改当前T2—T9；当前统计与下一动作按§2。P58历史值保留日期；P48两个入口同值，不删Owner需求 |
| `memory/README.md`、`memory/state.md`、`memory/handoff.md`、`memory/features.md` | 当前值按§2，增加本任务与新索引指针；历史业务计数仅作时点值；8个memory文件保持单个<5KB、总量<20KB |
| `memory/decisions.md` | 发布候选改为历史决策指针；P51远端SHA如引用必须限定2026-08-31时点，不称实时远端 |
| `memory/handoff.md`P51段 | 明确P51 COMPLETED（已确认），无活动P51任务；原main/develop-sw SHA标历史时点 |

根/Server/Web README本轮无确认需修改项，保持不动。search_task及product方向归档属Planner职责，执行层不得移动；新索引记录当前有效性即可。

## 5. 历史、独立任务与证据缺口裁决

在新映射索引中单独列下述结果，不新增P/I编号，不伪造历史验收回执：

- X1 P51：采用`planning-final-reconciliation-p51-main-terminal-authority-03.md`，COMPLETED（已确认），OA旧ready路线是被后续Owner路线取代的历史，非独立活动功能；Engine main保留零业务初始态，本轮不改分支或搬运历史。
- X2 README入口修正：独立2026-08-30文档任务，仅有Admin回执；记录“规划复核证据待定位”，不自动并入08-29或补写通过。
- X3 form-binding/workflow-process-def-create/process-initiation：分别登记M04-F02-01创建/表单绑定子集、M04-F03-01前端发起子集的执行交付证据，不另加正式功能数、不将执行自述升级为新验收。
- X4按§4更正ID映射；X8 GOV-AUDIT-13方向已在passed，更新文字即可。
- X5历史状态清理、X7 beta发布方向集合、X9早期验收：保留既有历史结论，标明实际可用证据与缺失指针；缺独立文档不等于未曾验收，不追认、不重新计数、不移动方向。
- X6历史清理：只记录历史脱敏回执指针和证据边界，执行了哪些操作以回执明确部分为限，不新执行Git操作、不复制敏感值。
- I27缺行、P23无登记、agent-model-orchestration feature链接缺失：逐项记录实际枚举事实与可用历史指针，不将“未找到”解释为“不存在过”，不重建已缺失正文。
- search局部通知任务已被主方向吸收；其余7份活动目录中的探索文件已回传且为历史资料，4份归档和11份无任务历史回传保留链接。新索引只将本B方向列为当前执行入口，不删除历史文件。

本节证据待定位项不阻止文档对账完成，但须保留为明确可追踪事项，不能宣称历史证据全齐或所有产品缺陷已解决。

## 6. 回读验收与提交

按knowledge→功能清单/todo→memory顺序同步。提交`receipts/sync-b-01.md`及原始附件，至少包括：

1. 每个授权文件的实际改动/未改原因及diff；knowledge/Server当前关键段全文回传供Planner读取，不只给路径或“已同步”。
2. 从实际写入文件复算90行34/28/28，五行正确变化、其余85行零变化；56唯一P状态、54 I索引零增删；正式功能41不变；新建审计feature与总feature文件数增加区分业务计数。
3. 当前入口状态/基线/下一动作/有效指针检查，历史段明确排除于当前计数；新索引各集合无未解释孤立项、无冲突ID、无无解释悬空引用。
4. memory修改前后字节数和保留范围；历史交接快照与修改前原件哈希一致，原历史回执零改写。
5. 授权文件实际diff与越界零变更检查；本轮证据清单覆盖修改文件及回执附件，哈希由工具生成后回读，注明校验工作目录。无需业务测试/构建/迁移。

B完成后停在Planner复核门，不自行进入C/阶段三。本功能整体PASSED和COMPLETED仍由后续规划独立裁决。
