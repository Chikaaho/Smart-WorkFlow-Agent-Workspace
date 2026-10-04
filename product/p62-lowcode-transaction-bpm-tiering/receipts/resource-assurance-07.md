# P62 资源保障执行回执07（提示05 · 6项有界补证）

2026-10-05，执行。唯一入口=`planning-execution-prompt-resource-assurance-05.md`；最新裁决=`planning-review-resource-assurance-06.md`（含 readback06）。本轮方法=已有制品离线核对 + 受影响断言短时有界验证；无任何长任务/后台挂起/2h重跑/600s重跑；RA05a/RG08 撤回口径已同步，未重建为任务。阶段保持 VERIFYING、P62 整体 PLANNING。

Server 本轮零代码改动（HEAD=910e03b 未变）；Web 修复2文件（见 RA03b）。证据根=`receipts/evidence/resource-assurance-07/`（SHA256SUMS 13 文件）。

## 0. 账本（ID→证据位置→结果→边界）

| ID | 状态 | 结果摘要 |
|---|---|---|
| RA01b | 关闭 | 每run身份映射更正+最终候选适用性证明（§1）；evidence-06/RA01b/index.md 中"d800f90=全部run head"与回执06正文"正式窗以d800f90执行"系错误陈述，run-identity.txt（装置运行时写入）为权威：正式/互换=aebed6a、2h=910e03b、GC对照=d800f90、05窗=ea17dde、stall-diag=2065538 |
| RA02a2 | 关闭（含异常全量分类） | 互换窗批拒绝 p99=1029.7ms>1s 复算成立（2/120样本，§2.1）；2h 受保护租户2427拒绝 5617/818 按时段归类=全部集中 w3—w9 劣化段（§2.2）；回执06"保护额度拒绝全窗仅2"系转录错误（§2.3）；拒绝路径逻辑无缺陷（formal p99=424.2 达标证明可达标），尾延迟机制归因维持回执06§3方向裁决事项 |
| RA02b1 | 关闭（副本落盘+口径纠正） | 05四个历史run规范化副本哈希/逐行语义断言全部通过（§3.1）；06 formal/swap 正典副本本轮落盘（§3.2）；效果账口径纠正=invocation时点是调用提交的观测点/真实commit时刻晚于它（§3.3）；75EXPIRED 终态合法与公平失约分判（§3.4） |
| RA02b2 | 关闭（按租户/kind重算） | canonical 重算=保护审批领取 fixed 1263ms/swap 3033ms ≤5000 与锁定值一致；kind×tenant 分组不混（§4）；目标链零缺行；占用勾稽 counter/fact=0、目标链占用=0；唯一受理批次项级 maxItemWaitMs=0.282s≤30s |
| RA03b | 关闭（含Web修复） | 完成/释放列修复+1024导航重叠修复（§5）；真实登录（无debugauth）同会话网络响应体/详情接口/对象ID/四视口截图全链闭合（evidence-07/ra03b-same-session/，Web四门全绿） |
| RA06b | 关闭 | 受影响模块门禁原件=engine 61/0/0/0、process 255/0/0/0、夹具 G5a 5/5+CommandOverlap 4/4（§6，原始日志已存）；远端实读 Server=910e03b/Web=28a2805 均与本地一致；callback missingtenant 影响判定维持登记文件（背景开销、openapi回调功能缺陷已登记范围外） |

## 1. RA01b 身份账更正

### 1.1 每run身份映射（权威=各 run-identity.txt，artifact-manifest 全量清单在档）

| runId | head | 窗口 | 位置 |
|---|---|---|---|
| p62ra05-formal-01 | ea17dde（领取/执行解耦） | 05回执正式窗 | evidence-05/ra02-window-formal/run-identity.txt |
| p62ra05-short-03 | ea17dde | 05短轮 | evidence-05/ra02-window-short/ |
| p62ra05-short-05 | 2065538（stall-diag快照，75 EXPIRED所在run） | 05诊断 | evidence-05/ra02-stall-diag/ |
| p62ra06-gc-g1/par/zgc | d800f90（OA读500修复） | GC三点对照 | evidence-06/ra02-gc-compare/*/ |
| p62ra06-formal-01 | **aebed6a**（V104夹具迁移） | 正式600s窗 | evidence-06/ra02-window-formal/ |
| p62ra06-swap-01 | **aebed6a** | 互换600s窗 | evidence-06/ra02-window-swap/ |
| p62ra06-2h-02 | **910e03b**（最终候选） | 2h（已撤回口径） | evidence-06/ra02-2h/ |

错误陈述更正（历史回执不改，本节为准）：回执06正文"GC/初始堆对照与正式窗均以 d800f90 快照执行"、evidence-06/RA01b/index.md"d800f90=本轮全部GC对照/正式/互换/2h运行head"、ra02-2h/sweep-12x10min.txt 头部"head=d800f90"（复算文件头部手写错，权威=2h run-identity head=910e03b）均与装置 run-identity 不符。正式/互换实际运行在 aebed6a。

### 1.2 最终候选适用性（git diff 逐提交，可复算）

- d800f90→aebed6a：仅新增 `sw-bootstrap/src/test/resources/db/migration/bpm-fixture/h2/V104__p62_resource_assurance.sql`（H2测试夹具链迁移，1文件119行）。formal/swap 为 PG 主链运行时，该文件不参与，**对正式窗断言零影响**。
- aebed6a→ac9ff6d：仅改 `P62ResourceAssurancePgTest.java`（30行，收集装置：protectedOaClaimWaits 只收 approval×保护租户、light 等待按租户分列）。纯 summary 字段口径，不改产品行为与 samples 采集。
- ac9ff6d→910e03b：仅改 `BpmResourceOpsService.java`（42行，运维台4处查询视图输出 lowerCaseKeys 包装）。仅影响运维台返回键大小写（PG 行为不变，键本已小写），不在准入/调度/审批/OA读受测路径。
- 结论：**aebed6a 上测得的 formal/swap 断言适用于最终候选 910e03b**；2h（910e03b）本就在最终候选上运行。ea17（05窗）与 d800f90+ 之间含 OA读500修复（产品改动），故 ea17 的 OA读断言不适用于修复后（已在回执06按 d800f90+ 重测覆盖）；ea17 其余断言（领取4313ms装置口径、清账74.318s）保持复核05锁定。

## 2. RA02a2 拒绝路径与异常全量分类

### 2.1 互换窗批拒绝 p99=1029.7ms>1s 复算成立

工具=tools/recompute-stats.py（nearest-rank、发起入组、窗口取自 report 的 windowFormalBegin/End——注意窗口起点≠run-identity start，boot/seed 耗时使真实窗晚约55s）：
- formal（保护=0）：120/120 个 2428 整笔拒绝，p50=138.0 p95=271.2 **p99=424.2** max=457.4 → ✓≤1000ms
- swap（保护=100）：120/120 个 2428 整笔拒绝，p50=226.8 p95=776.9 **p99=1029.7** max=1056.4 → ✗超预算29.7ms；超1s样本仅2个（21:57:43.609=1056.4、21:57:53.625=1029.7，相隔10.0s），其余118个 p95=776.9
- 归因：该2样本时刻 GC young pause 均≤16ms（swap raw-gc.log 21:57 段336事件逐条在档），非GC pause直接造成；与 2h w3—w8 持续尾延迟同类（调度/排队机制），维持回执06§3"持续尾延迟方向裁决"供Planner，非拒绝逻辑缺陷——formal 窗同路径 p99=424.2 证明拒绝路径可达标。2428=提交速率超限整笔拒绝（500项批次无部分受理、无偷偷补收），拒绝语义正确。

### 2.2 2h 受保护租户2427拒绝按时段分类（现有CSV离线，未重跑）

2h formal 段=23:44:19 起 12×10min（fixed-burst-report windowFormalBegin）。2427"受理额度已满：持久工作量超出适用上限"拒绝分布：

| 窗 | w1 | w2 | w3 | w4 | w5 | w6 | w7 | w8 | w9 | w10 | w11 | w12 | 窗外 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| protected-light | 0 | 0 | 1403 | 1475 | 1351 | 375 | 50 | 613 | 183 | 0 | 92 | 75 | 108 |
| oa-approval | 0 | 0 | 203 | 233 | 229 | 39 | 1 | 76 | 19 | 0 | 7 | 11 | 7 |

- 全CSV总量 light=5725/approval=825；formal 窗内 5617/818（与 readback06 一致，差值=暖机边界外样本）。
- 分类：w1/w2 完全干净（0/0）→ w3—w5 突发集中（占74%）→ w6—w9 衰减 → w10 归零 → w11/w12 零星。与 sweep-12x10min 劣化段（w3—w8持续劣化、w9—w12回落）完全吻合。
- 性质：全部为持久工作量账满时的如实额度拒绝（机制正确、无500/无静默丢弃/无UNKNOWN混入），但**违反"受保护合法请求过载拒绝=0"合同**——发生在已撤回的2h长时观察边界内，作为观察事实如实保留（撤回不抹去反证），持续保障未验证。

### 2.3 转录错误更正

回执06§2"保护额度拒绝全窗仅 2；zero 未解释责任"与 evidence-06/RA02a2/index.md"light 全窗额度拒绝仅 2"系转录错误——2h 窗实际 protected-light 5617 + approval 818（§2.2）。"zero 未解释责任"所指（效果/释放责任账）另见 §3/§4 的勾稽重算，不受该转录错误影响。

## 3. RA02b1 规范化副本与效果账口径

### 3.1 05历史run规范化副本（evidence-05/*/pairing-canonical-28.csv，本轮逐行回算）

| run | 数据行(28+30列) | 副本 sha256[:16] | 原始 sha256[:16] | 断言 |
|---|---|---|---|---|
| ra02-window-formal | 10053=9398+655 | 430ba1096d87af47 | e657bc20b4a32496 | 0失败 |
| ra02-window-swap | 4692=4543+149 | 298debad5a494f23 | 3d4b70cb1fab8f32 | 0失败 |
| ra02-window-short | 3343=3193+150 | 0fcae0a578a62c40 | b0a8287b419c8ba2 | 0失败 |
| ra02-stall-diag | 2406=2256+150 | aad4edcccb3b0104 | 492a4768a81d4f39 | 0失败 |

转换规则逐行断言：30列审批行[26]/[27]=='-' 且 [28]/[29]∈时间戳|'-'，副本=[0..25]+[28]+[29]；28列行原样；header 与副本逐字段相等。**规范化可回算成立**（副本此前未附，本轮验证并登记路径；文件保持 evidence-05 原位，历史附件不改）。

### 3.2 06 formal/swap 正典副本补齐（本轮落盘）

06 pairing.csv 行宽=formal 28:11078+30:658、swap 28:18981+30:657（与 readback06 一致）。同规则生成 `evidence-06/ra02-window-*/pairing-canonical-28.csv`：formal sha256[:16]=44378da42f64fb17、swap=607f348bd23cf98a，断言全通过。Planner 复核06的内存规范化结果（1263/3033）由此可独立复算（§4）。

### 3.3 效果账口径纠正（主张修正，不改数据）

- 旧主张"逐请求提交点配对（ea17 锁定 light 9266/9266、审批 655/655）"中的 target_invocation_create/update 是**应用层调用记录的写入时点（效果提交观测点）**，不是 DB commit 时刻；commit 晚于该时间戳（同事务剩余执行时长）。
- 因此以该观测点计算"受理→目标动作提交 P99"是真实提交耗时的**下界口径**：下界达标不证明 commit 时刻严格达标（差=事务内剩余毫秒级时长），方向§3"目标行时间差不能伪装精确提交"即此意。精确 commit 时刻证据（WAL/日志时点）现有装置未采集，旧ea17库已销毁不可回补，登记为口径边界；效果发生（invocation 行存在且状态终态）与目标行关联（target_record_id）不受该边界影响。
- 撤回的2h不重建效果账（pairing 阶段因 invocation_key 无索引被终止系装置缺陷登记，前向修复=迁移追加索引，维持回执06待裁决项）。

### 3.4 75EXPIRED：终态合法与公平失约分判

- **终态合法 ✓**（维持回执06分类）：75 例=受理后 deadline(+30s) 到期、claim 0/75、effect 0/75、expireDue 二次校验后单次 sweep 合法过期并 75/75 同刻释放；零重复效果、零未解释责任、对象可查可勾稽（等待超时≠删除）。EXPIRED 状态判定路径合法。
- **公平失约 ✗（如实保留）**：claim=0/75 且 NORMAL 车道该时段停摆未轮到——该窗口（2065538，修复前快照）消费侧未按时推进，"合法终态"不证明"按时推进"；其后 ea17（领取/执行解耦）+8e46fb4（对账15s）针对领取等待修复，正式窗收敛 94.4s/领取 1263ms 达标（RA02b2）。
- 本轮无新反证，维持既有快照，不重跑该窗口。

## 4. RA02b2 按租户/kind/时段的公平与目标链重算

06 canonical（§3.2）kind×tenant 分组（claim_wait_ms=命令创建→领取）：

| run | kind×tenant | n | 完成数 | claim_max | inv完成=有目标行 |
|---|---|---|---|---|---|
| formal（保护=0） | approval×0 | 658 | 658端点 | **1263ms** ✓≤5000 | 端点 658/658 |
| formal | light×0 | 3234 | 3234 | 1728ms | 3234=3234 |
| formal | light×100 | 7712 | 7712 | 2747ms | 7712=7712 |
| formal | batch×100 | 132 | 全2428拒绝 | — | — |
| swap（保护=100） | approval×100 | 657 | 657端点 | **3033ms** ✓≤5000 | 端点 657/657 |
| swap | light×100 | 3232 | 3232 | 3070ms | 3232=3232 |
| swap | light×0（突发） | 15617 | 15617 | 23889ms | 15617=15617 |
| swap | batch×0 | 131拒绝+1受理 | — | — | — |

- **保护审批领取 fixed 1263ms / swap 3033ms ≤5000 与复核06锁定值一致**（不混kind/租户；swap 23889ms 系突发租户 light 命令在 ~40k 积压下的 FIFO 位置，装置口径错位已由 ac9ff6d 修复，非保护侵犯——维持 RA02b2 index 解释）。
- **目标链零缺行**：light 全部 invocation 完成=有 target_record_id（formal 10946/10946、swap 18849/18849），审批 task/instance 端点齐全；"目标链标题下非空行"实为 occupancy-responsibility.txt [2] 段的固定说明文字（责任解释规则行），非占用对象行——formal/swap 的 [2] 段 total=0 且无对象行列示，不构成未释放事实。
- **占用勾稽**：formal/swap occupancy 对账前后 counter/fact 均 0、pass1 无修复无释放、[3b] expired_charged_unreleased=0、引擎 pendingJobs=0/deadLetterJobs=0、convergence protectedTenantUsage total=0；自动收敛 94.449s/30.119s（readback06 复算一致）。
- 批项预算：唯一受理批次（swap暖机段 21:54:56 受理、500项）batchStatus=COMPLETED items=500 succeeded=500 failed=0 **maxItemWaitMs=0.282s ≤30s** ✓；其批次命令级 claim 38.3s 发生在暖机段（command_create 早于 formalBegin 21:55:53，非窗内增量），非项级预算对象，如实登记。

## 5. RA03b 同会话修复与取证（Web develop-sw 2文件）

### 5.1 确证缺陷与修复

1. **完成/释放列取错字段**（`ResourceBacklogConsole.vue`）：列标签"完成/释放时间"只取 `finished_at`；夹具与真实生命周期中 EXPIRED 对象 finished_at=null 而 resource_released_at 同刻非空（V999 种子 781003 released=22:30:31、readback06 debugauth 响应同样可见）→ 显示"—"。修复=`finished_at ?? resource_released_at ?? '—'`。
2. **1024 导航重叠**（`AppMainNav.vue`）：admin 区导航项显式 `min-width: 88px` 压过 flex 的 min-width:auto，nowrap 文字溢出与相邻项重叠。修复=`min-width: max-content`（宽屏均分不变、窄屏容器横滑——与 G6 既定"不留不可操作元素"一致）。

### 5.2 同会话同对象链（无 debugauth，真实登录）

隔离夹具（H2 mem+V999种子，端口18080）+vite 15173，admin 真实登录（视觉读码1234）：

- 全量明细 5 行非空，四视口截图（1920/1280/1366/1024）关键字段（命令/状态/策略版本/受理时间/**修复后完成释放**）全部可读；
- 同会话真实 axios(XHR) 响应体：status=COMPLETED → 200/code=0/total=2；status=EXPIRED → 200/total=1/rows[0].command_key=RA03B-T1-CMD-EXPIRED/resource_released_at=14:30:31——**视觉行值=网络响应值=对象ID同值**，同浏览器网络链闭合（复核06缺口消除）；
- 详情接口同会话 GET .../commands/781003 → 200/code=0（command完整+effect=null 合法未生效+rejectLogs=[]+targetInvocations=[]）；
- 1024 操作可达：筛选=已过期恰1行；导航横滑最右（Notifications/Agent/IoT/Scheduled jobs 可达）+表格横滑后失败原因列完整（sw=755/cw=382 nav、sw=890/cw=740 表实测）。

证据=`evidence/resource-assurance-07/ra03b-same-session/`（6截图+2网络响应+1详情+index+哈希）。**Web 四门全绿**：typecheck exit0、lint 0 errors（90既有warnings、改动文件0）、test **1321 passed+3 skipped**（与基线零漂移）、build exit0。夹具进程已停（18080/15173 回读000）。H2种子只证明UI链，不替代真实生命周期（维持复核06口径）；权限矩阵维持复核04/05锁定。

## 6. RA06b 原件、远端与当前同步

- **受影响模块门禁原件**（本轮实跑，原始日志存 evidence-07/）：engine `mvn -q -pl sw-biz/sw-bpm/sw-bpm-engine test` exit0 **61/0/0/0**；process exit0 **255/0/0/0**；夹具 `mvn -pl sw-bootstrap test -Dtest=G5aSyncWaiterChainTest,CommandOverlapRealEngineTest` exit0 **5/5+4/4**。与回执06声明计数一致，"主要为声明"缺口消除。旧 gate2（2065538）全工程归因文件维持 evidence-05/gate/ 原件，不重跑已知失败凑证据。
- **远端实读**（git ls-remote 2026-10-05）：Server origin/develop=910e03b04f2939e4acab29b10592341f83991d28（门禁运行时点，本地一致）；Web origin/develop=28a28053d45e70cfe99704d60ac341c16f89aa9a（门禁运行时点，本地一致）。**本回执批次提交后回读**：Web 修复批次 `8ad2fdd1fd28d95275ae3944d802517b3c154f5f` 已推送（origin/develop 回读一致）；Server 功能清单焦点批次 `4f11e1940b0ce0f369e06378a19327d358e62887` 已推送（origin/develop 回读一致；零代码改动，文档同步）。
- **callback missingtenant 影响分类**（维持 RA06b-openapi-listener-registration.md）：454次/窗（2h 1040次）=@Async 监听线程无租户上下文致 openapi 模块自身查询抛租户拦截异常——保障路径不依赖该 listener（无回压、不占额度）；openapi 回调通知后台上下文 100% 失败为**范围外功能缺陷**（已登记+建议修法 TenantLineSuspension.suspended()），本轮不扩修。
- 当前入口逐字段覆盖=本回执批次 knowledge-first 同步（见 §8 覆盖矩阵）。

## 7. 撤回口径与锁定项确认

- RA05a/RG08 长时门禁已撤回：本轮未启动、恢复、拼接或后台挂起任何长任务；2h 既有数据仅作离线分类（§2.2），不作为通过项；长稳能力未验证。
- 锁定项未重跑：复核05锁定（专用manage授权矩阵、ea17自动清账74.318s、既有事务/恢复/减配）、复核06锁定（窗口四类入口结果、保护OA领取1263/3033ms——本轮§4独立重算吻合，属复算非重跑）。
- 本轮新反证一处（互换窗批拒绝p99=1029.7>1s，§2.1）如实保留，归入方向裁决尾延迟事项。

## 8. 剩余与方向裁决事项（非执行可闭环）

1. 持续尾延迟机制归因（含互换窗批拒绝2样本超限与 w3—w8 劣化段同类性）——维持回执06§3，供Planner裁决；
2. 2h 装置缺陷前向修复（invocation_key 索引迁移）——待裁决批次；
3. openapi 回调监听器功能缺陷——范围外已登记，待独立裁决；
4. 精确 commit 时点口径边界（§3.3）——如需严格提交时刻证据需装置扩展，由Planner决定是否纳入。

阶段自验=6项补证完成、证据可读、断言成立；**自验不等于Planner验收，不写阶段PASSED/COMPLETED**。下一动作=Planner复核本回执。
