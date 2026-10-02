# 分级执行与统一命令：补证回执 04（二级提示02 剩余9项逐项交付）

2026-10-02；Executor。依据 `planning-review-tiered-execution-unified-command-03.md`（G2a/G4a/G5a 通过锁定）与唯一执行入口 `planning-execution-prompt-tiered-execution-unified-command-02.md`（9 项剩余账本）逐项交付。新证据独立 runId `p62exec03r04-223024`（下称 r04；上一轮 p62exec03-20261001-110511 的 85 哈希与失败/有效样本原样保留未动）。阶段保持 VERIFYING，待 Planner 复核。

## 提交身份

- Server：`28d57b9`（develop，已推送；链 8f5d470→4531cb9→1eb2510→9c7460c→f6547b8→28d57b9，远端读回 `g7a-web-gates/server-remote-readback.txt`。测量/JVM 采集基于采集时点工作树，其后提交均为测试资产修正——池 introspection/种子幂等——不影响已采集证据语义，逐项在对应证据目录的 console 说明）
- Web：`c75f77e`（develop，已推送；本轮无新 Web 代码改动）
- 环境内存更正（复核03 待核验项）：`sysctl hw.memsize` = 8589934592 = **8GiB 实际**（`g7b/env-memory-facts.txt`），与原方向"M1 8GiB"一致；回执03 中"M1 8核/16G 实际"为 Executor 誊写笔误，就此更正。无环境差异、无预算放宽，堆上限 2GiB 不变。

## 9 项逐项交付

### G1a——实测对象与合同不符修正 + 原窗口重测两场景：PASS（本轮合规负载）

- 缺陷根因（如实）：旧 `pickRecord` 每次调用以固定种子重建 Random——序列恒定，每 worker 恒命中同一对象（实时每租户仅 8 对象、每线程独占 1）；轻流程以每请求新业务键冒充目标。两个失败短验轮与样本保留（`../p62exec03r04-short2-failed-varprefix/` 等）。
- 修正：①每 worker 一条贯穿全程的前进随机序列（`workerRandoms.computeIfAbsent`）；②轻流程真实目标映射——流程启动透传 `target_record_id/targetRecordId` 为流程变量（`ProcessStartService`，复刻 device_key 透传先例），TXN_ACTION `recordIdSource=variable`/`recordIdVariable=variable:targetRecordId` 解析预置对象为实际动作目标；样本 object_id=真实目标。
- 短分布验证先行（10s/30s，shortVerify=true 样本不作判定）：每租户 formal=24，uniqueTargets=21—24，热点频率 4.2%—12.5%（小样本 10% 附近），热点跨 worker 共享=1—2 ✓。
- 正式测量（原窗口：并发16 两租户各8、预热60s、正式300s、两租户各1000对象、热点 records[0] 10%/其余999均匀）：
  - 实时动作：formalSamples=76,785（≥5000）legal=76,785 rejected=0 timeout=0 error=0；p50=59.7ms/p95=77.5ms/**p99=112.6ms≤300ms**/max=538.8ms；verdict=**PASS**（shortVerify=false；samplesSha256=b7c7e5a3…）
  - 逐租户目标分布（正式段回读复算）：tenant=0 formal=38,398 hotspotHits=3,813 **hotspotFreq=9.93%** uniqueTargets=1,000 hotspotSharedWorkers=8 ✓；tenant=100 同构（见 light 报告 distribution 段）
  - 轻流程受理：formalSamples=62,100（同轮 G1b JVM）legal=62,100 rejected=0 timeout=0 error=0；p50=73.7ms/**p99=147.9ms≤2000ms**/max≈460ms；verdict=**PASS**；分布 tenant0/100 各 formal≈31k hotspotFreq≈9.9% uniqueTargets=1,000 sharedWorkers=8（`g1b/console-g1b.log` 与报告文件）
  - 样本 SHA256 与逐请求明细见 `g1/realtime-action-report.txt`、`g1b/*report.txt`、`g1/*samples.csv.gz`、`g1b/*samples.csv.gz`

### G1b——受理→目标提交配对（同轮合规负载 + 时点边界语义）：交付

- 配对对合同负载同轮重做：record/command(FLOW_START 命令id)/target(调用行id)/tenant/受理行时点/目标行时点/status 逐对落 `g1/light-process-acceptance-pairs.csv.gz`。
- 时点边界语义（明确标注，不以行赋值时间冒充精确 commit）：受理行 create_time 为 DB 时钟事务内赋值（≤受理提交时刻）；目标调用行 update_time 为目标行时点（≤目标提交后可见时刻）；排干后对前 100 对做提交后只读可见性探针并记录 PG 时钟（`light-process-acceptance-pairs.txt` visibility-probe 段）。
- 结果：受理 62,100（同轮 G1a 轻流程 JVM）；**validPairs=22,666（全 SUCCEEDED，rejectedPairs=0）**；incomplete=39,434（8 分钟排干窗后真实未收敛量，如实保留）；配对分布与逐对明细见 `g1b/light-process-acceptance-pairs.txt`/`.csv.gz`；**提交后只读可见性探针 reRead=100 visible=100**（PG 时钟记录于报告）。
- 未完成样本如实保留计数；不因本轮数量增设排干 SLA（遵提示02）。

### G2b——64并发共享热点 + OA 并行：已执行（OBSERVATION-ONLY）

- 修正后重测：64 并发（两租户各32）、两租户各 10,000 对象、每租户 50% 请求共享同热点（前进序列真实命中分布见报告 target-distribution 段）、正式 300s。
- OA 并行请求（真实并行窗口）：GET /api/auth/menus 压力窗口全程发起 **1,249 次，non200=0 errors=0**（`g2b/oa-parallel-requests.csv` 逐请求 endpoint/时间/状态/耗时，`g2b/oa-parallel-summary.txt` 汇总）。压力热 contention 下 OA 读路径零失败——并行等待/拒绝画像完整（contention 段拒绝记录在压力样本 outcomes 内，未隐藏）。
- 压力结果：formalSamples=72,232；legal=42,767 rejected=29,465（**40.79%**，热点对象余额 5,000 耗尽后的合法 1604 拒绝——真实竞争画像，observation-only 不设阈值）timeout=0 error=0；p50=259.0ms/p95=448.0ms/**p99=562.4ms**/max=972.7ms；verdict=OBSERVATION-ONLY。分布：tenant0 formal=36,059 hotspotFreq=**50.45%** uniqueTargets=8,303 sharedWorkers=32；tenant100 formal=36,173 hotspotFreq=**49.70%** uniqueTargets=8,405 sharedWorkers=32（`g2b/stress-boundary-report.txt`）
- 资源采样 `g2b/stress-resources.csv`（heap/threads/pg_active/pg_lock_waits 原字段；零值如实呈现，不作"锁吸收"解读）。
- 判定 OBSERVATION-ONLY，不设生产阈值，不据此核销 A07。

### G3a——动作已提交/引擎进度未提交窗口中断恢复：PASS

- 确定性窗口：进程 A 提交轻流程表单（START→TXN_ACTION→END，async 节点独立短事务）；编排器在异步任务被领取后对 `act_ru_job` 行持 FOR UPDATE 锁——引擎完成事务在任务行阻塞，而节点委托独立短事务已提交；窗口事实（调用行 SUCCEEDED + 进度变量缺失 + 实例 RUNNING）经轮询确认后 SIGKILL 进程 A（`g3a-window/window-captured.txt`、`window-interrupted.txt`）。
- 锁处置（诚实标注）：Flowable 7 默认任务锁=1 小时（lock_exp_time 读回捕获+3600s；engine configurer 60s 未生效，失败轮3证据保留）。生产恢复由 ResetExpiredJobsRunnable 锁过期重置；本演练由编排器 kill 后重置锁+duedate（`window-lock-reset.txt`，等价该生产路径提前触发）。
- 恢复：新进程 B 经 Flowable 生产管理 API `ManagementService.executeJob` 重执行残留任务（管理控制台恢复卡住任务的真实路径，经同一命令栈=幂等键重放）——**进度变量 SUCCEEDED 写回、实例 APPROVED、invocation=1、reservation=1（无新效果）**（`g3a-window/window-recovered.txt`、console.log；Tests run 1/0/0/0，109.5s）。窗口竞态失败轮 7 个全部保留（`g3a-window-failed-round*/`）。

### G3b——停用冻结语义 + 真实 FLOW_START 非空业务 + 跨会话回查：PASS（`P62FrozenSemanticsPgTest` 3/0/0/0）

- 受理后停用：批次受理冻结 v1 → `disable` → 消费仍按冻结版本结算 SUCCEEDED、invocation action_version=1、预占 3 落账；同动作新调用（未冻结入口）被拒 ✓（`g3b/console.log` g3b.freeze-disable 行）。
- 真实 FLOW_START：发布真实轻流程后旧类型命令经真实 `FlowStartCommandHandler` 消费——真实实例启动（sw_bpm_instance=1）；重复消费不重复启动（仍 1）（g3b.real-flow-start 行）。
- 跨会话回查：批次项结算后以新事务重放同幂等键（含冻结版本同形状请求）→ replay=true 原结果、预占不叠加（g3b.replay-after-break 行）。

### G6a——同对象原始链（UI→服务器记录→DB→效果）：交付

- 全链同一流程定义 2105507486266904578：UI 编辑（数量1→2）→**服务器 AccessLoggingFilter 原始行** PUT /graph 200 eventRef=req-4fd6d757a0c→DB def_version=2/quantity=2；UI 重开→GET 200+面板回读 5 字段；UI 发布→POST publish 200 costMs=844→published_version=2+curl 只读 GET 原始响应；UI 表单发起→POST /form/data 200 eventRef=req-7ef19ec3…→recordId f2e2071a…→invocation 4548d692 SUCCEEDED（NODE:1c72f8c7…:node_1）→库存行 G6A-R04-EXEC qty_reserved=2.0（v2 语义）。
- 文件：`g6a-chain/raw-chain.txt`（逐环 eventRef/时点/DB 行）、`g6a-chain/access-log-lines.txt`（服务器原始行）。无 API 替填（curl 仅只读）。
- 时点说明：该链采集于提交 4531cb9 的构建（18080 验收应用）；本链使用 instanceBusinessKey 目标源，与本轮 targetRecordId 透传/种子绑定修正无交集，证据语义不受后续提交影响。

### G6b——1280×720 补齐 + 四视口索引：交付

- 新增 1280×720 两图：`g6b-viewports-r04/attrs-1280.png`（同定义属性面板，回读含 v2 数量2）、`g6b-viewports-r04/verify-1280.png`（命令 g6b-r04-1280 UNKNOWN 经生产补偿调度转换后人工核实弹窗，提交按钮可及）。
- 全部视口逐图索引（视口实际宽高/URL/身份/对象与请求关联）：`g6b-viewport-index.md`。未重做已锁定正向核实业务。

### G7a——原始门禁与身份对齐：交付

- Web 四门原始输出落盘：`g7a-web-gates/typecheck.txt`（exit=0）、`lint.txt`（exit=0；0 errors+87 存量 warnings 原样）、`test.txt`（145 files passed/1 skipped；1313 passed+3 skipped/0 failed）、`build.txt`（exit=0）。均含 commit/时点头。
- 五类导出轮 17/2F/1E 与 overlap 终轮 3/0/0/0 **分开记录**（`g7a-commits-r04.txt`），不冒称首轮 exit0。
- 身份对齐：Server 最终 `8f5d470` + 远端读回同 SHA；本轮全部执行基于该工作树。
- 历史改写：无 Owner 授权事实维持登记，本轮无新改写/强推。

### G7b——全入口字段级同步：交付（回执04提交前最后刷新）

- 26.8s/46.478s 冲突已更正（knowledge/current-status、session-handoff、memory/state、功能清单）；各入口当前值：阶段 VERIFYING、G2a/G4a/G5a 锁定、9 项→回执04→Planner 复核04、计数 45/46-22-22/ADV64/问题57 不变、清单=85 项指纹（本轮证据清单 `evidence-sha256.txt`）。
- 环境内存事实：`g7b/env-memory-facts.txt`（hw.memsize=8GiB 原始读数；"16G"笔误更正）。
- 逐文件字段值见回执04 附录自检段（文件路径→字段→当前值→时点）。

## 过程失败轮保留清单（不可覆盖原则）

`p62exec03r04-short2-failed-varprefix`、`p62exec03r04-short2-failed-json`（负载修正前）、`g1-failed-*`（本轮无）、`g3a-window-failed-round1..7`（窗口竞态/列名/参数错位/1小时锁各因）、`g2b-failed-*`（上一 runId）。

## 逐项自检

目标分布可复算（报告 target-distribution 段）；OA 存在并行请求（oa-parallel-summary）；commit 时点定义正确（行时点边界+可见性探针）；窗口同对象恢复（captured/interrupted/recovered 三件套）；旧 handler 非空（instances=1）；UI 关联完整且 1280 存在；原始门禁与最终身份匹配（8f5d470+远端读回）；当前入口一致（VERIFYING/指向复核04）。哈希与计数由工具生成并回读。
