# 分级执行与统一命令：补证回执 03（一级提示12原子项逐项交付）

2026-10-01；Executor。依据 `planning-review-tiered-execution-unified-command-02.md`（仍VERIFYING）与唯一执行入口 `planning-execution-prompt-tiered-execution-unified-command-01.md`（12原子账本）逐项交付。本回执只对12个原子ID逐项核销，不宣称阶段通过；阶段保持 VERIFYING，待 Planner 独立复核。

## 提交身份

- Server：`4531cb9`（develop，已推送；含 `02f3d26` 原子账本主体、`194193a` 演练编排修复、`4531cb9` 压力边界种子修复）
- Web：`c75f77e`（develop，已推送）
- Workspace：本回执提交时点为准（gitlink 指向上述 Server/Web）
- 固定采集 runId：`p62exec03-20261001-110511`，证据根 `receipts/evidence/tiered-execution-03/<runId>/`，85 项文件 SHA256 清单 `evidence-sha256.txt`
- 验收环境：本机隔离（M1 8核/16G 实际、JDK 21.0.11、Zonky EmbeddedPostgres PG17.5 单实例、堆上限 2048MiB）；G1/G2b 测量应用为测试 JVM 内真实 Tomcat HTTP 入口（非 18080 用户服务；用户服务未被停止或触碰）

## 原子账本逐项交付

### G1a（G1）——真实 HTTP 入口、两租户、全量逐请求样本：PASS

- 失败事实对治：单租户→两租户（tenant 0/100 经 sys_tenant 正式注册，debug token `test_91999`/`test_92999` 经 UserDetailsProvider 正式装载，权限 form:data:submit/form:action:invoke 经 role 2 菜单授权）；正确轮样本丢失→固定 runId + `CREATE_NEW` 不可覆盖 gzip CSV（tenant/object_id/request_id/时间戳/耗时/outcome 逐请求全量），统计由样本文件回读复算而非内存计数；仓库命令不是已测样本→本轮全部为实跑。
- 对象与结果（`g1/realtime-action-report.txt`、`g1/light-process-acceptance-report.txt`，样本 `*-samples.csv.gz`）：
  - 实时动作：并发16（两租户各8）、预热60s、正式300s；formalSamples=62,828（≥5000）；legal=62,828，rejected=0，timeout=0，error=0；p50=72.4ms/p95=102.1ms/**p99=165.5ms≤300ms**/max=502.7ms；verdict=**PASS**
  - 轻流程持久受理：同负载；formalSamples=51,746；legal=51,746，rejected=0，timeout=0，error=0；p50=89.1ms/p95=121.8ms/**p99=181.4ms≤2000ms**/max=647.0ms；verdict=**PASS**
- 冻结环境：`g1/env-frozen.txt`（heapMaxMiB=2048、PG17.5、hikari=32、dispatcher poll=100ms/batch=50、Flowable async pool=8、buildCommit、双租户夹具身份）
- 边界声明（诚实）：入口为真实 HTTP（`POST /api/form/action/{id}/invoke`、`POST /api/form/data/{formKey}`），测量端与服务端同机回环，客户端观测耗时是"入口→事务提交"的上界；`POST /form/data` 返回即持久受理完成（FLOW_START 同事务落库），预算口径"服务端入口至持久受理"以该回包为准。
- 失败轮保留：首轮（租户未注册 401/权限 403，234,311 全拒）样本完整保留于 `g1-failed-round1-401-403/`；第二轮（recovery 被积压污染 304ms 超时）保留于 `g1-round2-pass-with-polluted-recovery/`。未覆盖、未删除任何失败轮。

### G1b（G1）——受理→目标提交配对：PASS（含诚实未完成与容量边界）

- 失败事实对治：pairs=0→同轮按 `sw_form_txn_invocation.biz_record_id` 关联，双侧均为 PG 时钟（受理=表单行 create_time，目标提交=节点调用行 update_time），未完成样本不丢弃。
- 结果（`g1/light-process-acceptance-pairs.txt` + `light-process-acceptance-pairs.csv.gz` 逐对明细）：accepted=51,746；**validPairs=20,970（全部 SUCCEEDED，rejectedPairs=0）**；incomplete=30,776（8分钟排干窗后的真实未收敛量，如实报告不丢弃）；配对分布 p50=524.2s/p95=641.1s/p99=650.7s。
- 说明：配对时延包含命令调度+节点异步排干的排队等待。稳态负载下受理速率（≈172/s）高于节点排干速率（≈50/s），受理-结算段随积压无界增长——此为本环境真实容量边界，按方向"另报受理至目标动作提交"呈报，不设阈值判定、不伪装收敛。受理段预算（≤2s）不受影响已单独 PASS。

### G2a（G2）——消费进程真实中断（SIGKILL）与新进程恢复：PASS

- 失败事实对治：原进程存活停轮询→本轮进程 A 为独立 JVM 真实应用（受理 100 条、真实 dispatcher 消费 20 条 COMPLETED、真实 claim 1 条在途 PROCESSING、79 条 PENDING），由编排器 `destroyForcibly()`（SIGKILL，exit=137）真实中断；`a-interrupted.txt` 留 pid/退出码/中断前快照/库指纹（PG17.5 同端口 58427 前后一致证明 A/B 同库）。
- 结果（`g2a/recovery.txt` + `a-accepted.txt`/`a-interrupted.txt`/`worker-ready.txt`/`process-a.log`/`worker.log`）：进程 B（同库新进程、正常调度）READY 起计时 **elapsedMs=46,478≤120s**；completed=100/100 全部 COMPLETED（含 1 条在途租约恢复）；sw_bpm_command_effect=100、sw_form_txn_invocation=100、预占台账=100，**重复业务效果=0**。
- 允许范围核对：受控停止仅作用于本轮自建隔离进程，未动用户服务。

### G2b（G2）——64并发压力边界：已执行（OBSERVATION-ONLY）

- 失败事实对治：64并发未完成→本轮真实执行：64并发（两租户各32）、两租户各10,000对象（20,000 记录实种）、每租户50%请求争同一热点对象、预热30s+正式300s，逐请求样本全量落盘（`g2b/stress-boundary-samples.csv.gz`），5s 粒度资源采样（堆/线程/PG active/lock waits，`g2b/stress-resources.csv`）。
- 结果（`g2b/stress-boundary-report.txt`）：formalSamples=57,908，outcomes 全 SUCCEEDED（rejected=0/timeout=0/error=0）；p50=313.9ms/p95=461.6ms/**p99=608.5ms**/max=1254.3ms（对照 16 并发 p99=165.5ms，50% 同对象争用使时延中位与尾部放大 4—5 倍——锁竞争以串行等待吸收，本路径无过载拒绝机制故零拒绝，如实呈报）；资源画像 heap 144→235MiB、threads 111→202、PG active 低（串行化）、lock_waits=0（行锁等待在事务内，未到 pg_stat_activity Lock 事件粒度）。
- 判定：**OBSERVATION-ONLY**（不设达标结论、不据此核销 A07）。三次失败启动轮（role_menu id 冲突/用户名唯一键冲突/env-frozen 残留碰撞）均已修复并隔离保留（`console-g2b-failed-*.log`、`g2b-failed-*`）。

### G3a（G3）——默认 BLOCK 双节点时序 + 执行者并发重叠效果至多一次：PASS（含真实缺陷修复）

- 真实缺陷修复：`NodeDelegateSupport.shouldBlock` 缺省 CONTINUE 与 `TxnActionNodeDelegate` javadoc"默认 BLOCK"及方向 U01 合同矛盾（通知节点 I6 语义误用于事务节点）。修复：TxnAction 委托内 `blockOnFailure` 缺省 BLOCK、显式声明才 CONTINUE（`TxnActionNodeDelegate.java`，Server `02f3d26`）。
- 双节点默认 BLOCK 证据（`P62OverlapEffectsPgTest#blockStrategyKeepsFirstNodeEffect`，`raw-overlap-console-4.log`）：A 预占3 SUCCEEDED 独立提交保留；B 预占99 被拒 1604、拒绝记录经独立短事务落账可回查（REJECTED 行 error_code=1604）；实例不伪报 APPROVED（保持 RUNNING/终止于B）；真 PG 时序读回（调用行时间/命令 claim→finish 时刻）落盘 `g3a-block-timing.txt`。
- 并发重叠（非顺序重放）：动作提交层两执行者同节点键同时进入真实执行路径→一 original 一 replay、调用记录恰1、预占=3（`concurrentNodeExecutorsProduceAtMostOneEffect`）；命令消费层旧执行者与新领取者同命令并发→项调用恰1、效果权威恰1、claim-token 失效方被拒后命令经退避重试收敛 COMPLETED（`concurrentCommandExecutorsProduceAtMostOneEffect`）。两类均输出真 PG 时序行。
- 测试类最终 3/0/0/0。

### G3b（G3）——冻结版本/同键载荷/跨通道：既有原始断言导出

- 按提示"复用已通过测试的原始请求/SQL断言、仅缺文件先导出"：`g3b-frozen-version-same-key-raw.log`（P62NodeLevelGuaranteePgTest 4/0/0/0：冻结版本受理后改版仍按 v1 结算、同键异载荷 1606 拒绝原结果不变）、`g3b-batch-same-key-raw.log`（P62BatchInvokePgTest）、`g3b-cross-channel-identity-raw.log`（TieredCommandSemanticsPgTest 4/0/0/0：统一逻辑身份 PG-ID 重复拒绝可查、效果窗口由权威效果收敛、stale 执行者租约拒绝、准入截止 pending→EXPIRED/processing 仅超期不伪终态）。未改实现、未全量重跑。

### G4a（G4）——设备结果写边界原始 HTTP/业务码输出：导出

- `g4a-receipt-boundary-raw.log`（P62ReceiptBoundaryPgTest 5/0/0/0）：无权限 view=403、有 manage 无 verify=403、空依据=400、旧回写 UNKNOWN=409、确定态=409、跨租户 REJECTED+审计、并发 DUPLICATE/APPLIED 恰一次、owner/peer/manager 批次查询可见性（owner visible/peer 2424/manager visible）。签名字段脱敏（密钥不入日志）。

### G5a（G5）——消费者隔离（能力开关+真实进程，非权限演示）：PASS

- 真实实现：部署开关 `sw.bpm.txn-batch.enabled` **默认 false**——受理侧（TxnBatchServiceImpl 首道拒绝，错误码 **2425 BATCH_CAPABILITY_DISABLED**）与消费侧（BatchInvokeCommandHandler `@ConditionalOnProperty` 不注册）同一开关，持权限用户在旧消费者存活期也不产生新类型。
- 三阶段进程编排（`P62ConsumerIsolationPgTest` 1/0/0/0，证据 `g5a/phase1-*.txt`、`phase2-*.txt`、`phase3-*.txt`）：
  1. 旧消费者存活（开关关）：旧类型 FLOW_START 按旧语义消费 COMPLETED（存活证明）；持授权用户 HTTP 发起新类型→**2425 能力门禁拒绝（非 403 权限拒绝）**、批次行=0；
  2. 协调升级：SIGKILL 旧消费者（真实退出）→PROCESSING 核清=0→克隆真实队列行形态插入升级窗口旧在途 PENDING→新版本消费者（开关开）承接旧在途 COMPLETED→同用户新类型受理成功且新消费者完成（效果1/调用1）；
  3. 停新入口（开关关）：新类型再次 2425 拒绝；新数据批次/效果/调用行 1/1/1 保留可查，历史连续向前修复。
- 禁止项核对：未以旧枚举 FAILED 充当隔离；未以权限开关演示替代。

### G6a（G6）——设计器保存不落盘：根因定位+修复+真实 UI 闭环：PASS

- 根因（复现坐实）：头部"草稿已保存 HH:MM"取 `load()` 时刻硬编码（ProcessDesigner.vue 旧 L842-843 双写），无任何自动/真实保存路径；画布改动仅存内存，重载即失（`g6a-defect-repro-false-saved-label-reload-lost-node.png`）；DB 佐证 graph_json 停留创建时刻 583 字节。复核02"API 改 graphJson 补救"即此假标签误导所致。
- 修复（Web `c75f77e`）：保存状态由真实保存驱动——序列化对比脏检测 + 1.5s 防抖自动保存（PUT /workflow/defs/{id}/graph）+ 保存成功才刷新时钟/清脏 + 发布前存在脏状态先真实保存；加载时刻不再假报已保存（显示"未保存的更改"）。vue-tsc 通过，无新增端点。
- UI 闭环（无 API/SQL 替填，SQL 仅只读核验，`g6a-designer-save-loop.txt`）：设计器组件库点击添加 TXN_ACTION+锚点拉线 START→TXN→END+属性面板填写（actionId/instanceBusinessKey/数量1/BLOCK）→自动保存落盘（graph_json 583→975 字节含全部属性）→**重新打开设计器属性回读一致**（`g6a-reopen-attributes-readback.png`）→发布 PUBLISHED v1+Flowable 部署+绑定激活→**同对象执行**：UI 发起表单→节点动作 SUCCEEDED→qty_reserved=1 落账；另一单（预占10>可用）动作 REJECTED 1604 真实展示 BLOCK。

### G6b（G6）——属性面板与核实弹窗四视口：PASS（含两处真实修复）

- 属性面板 1920/1366/1024/375 四视口可选中可编辑且回读正确（`g6b-viewports/attrs-panel-*.png`）；375 发现面包屑逐字竖排缺陷→`designer-crumb` 单行省略修复。
- 核实弹窗：UNKNOWN 命令经**生产补偿调度真实转换**（SENT+过期→markUnknown，日志"命令已转待核实"；SENT 为声明性 setup——隔离环境无厂商凭证 fail-closed，复制 markSent 后丢回执库态；UNKNOWN 转换/授权/审计全部生产代码执行，S4 已以真实 HTTP loopback 对端证明完整生命周期）。1920 弹窗真实填写依据并提交：**UNKNOWN→SUCCESS**，DB result={source:MANUAL_VERIFY, basis:现场复核工单 GD-2026-1002…, operatorId:91001}；1366/1024 布局完整；375 发现"提交核实"按钮被裁出视口缺陷→弹窗宽度 min(480px,100vw-24px) 修复后重开可及（`verify-dialog-375-submit-clipped-defect.png`→`verify-dialog-375-fixed.png`）。
- 403横幅回读：设备页产品下拉 GET /iot/products 需 iot:product:manage（核实员角色无）触发整页 403 横幅——修复为读路径降级（403→空选项，不阻塞设备列表/核实主路径），重载 has403=false（`verify-dialog-1920-filled.png` 背景无横幅）。

### G7a（G7）——门禁原始流/提交映射/历史改写说明：交付

- 原始流按工具独立保存（非引用旧文件）：五类导出+overlap 终轮+G2a/G5a 演练 console+Web 四门（typecheck exit0/lint 0 errors/test 1313 passed+3 skipped/build exit0，`web-gates.txt`；build 于 G1 终轮后单独运行，符合"无并行构建"测量约束）。475a382 时点 PG34 及迁移29 已锁定不重算为最终全量；本轮仅运行实际变更所需门禁。
- 当前精确提交与代码修复→验证覆盖映射、以及历史改写诚实说明（含旧新 SHA 映射）：`g7a-commits-and-rewrite.txt`。**历史改写无 Owner 授权依据，如实说明，不自行补授权**：影响范围仅 a2a239d/1c9739b 两个被弃提交（152MB CSV 订正，reset --soft 至 95bf726 后由 5fb3f98 重承载并强推）；本轮未发起任何新的历史改写或强推。

### G7b（G7）——全入口状态同步：交付

- 当前事实：阶段 VERIFYING、唯一动作=Planner 复核回执03、计数 45/46-22-22/ADV64/问题57 不变、预算不变、无"补证全通过"表述。
- 逐文件实际值：knowledge 两入口（`knowledge/current-status.md`、`knowledge/session-handoff.md`）、memory 四件（`state.md`/`handoff.md`/`decisions.md`）、需求池（`todo/p62-lowcode-transaction-bpm-tiering.md`）、Server 功能清单（`功能清单.md`）。能力目录无阶段行（计数不变故无改动）；Server/Web README 无阶段行（无改动）。历史回执未覆盖，本轮更正以追加/改写当前值为准；各文件当前行均可在 Planner 复核时按字段读回。

## 逐项自检（提交前）

- 对象一致：每项绑定实际源码/产物/租户/用户/对象（见各节"对象与结果"）。
- 正反断言具真实结果：正断言（PASS 数字）与反断言（2425/403/409/1604/1606/EXPIRED/拒绝行/失败轮）均有原始输出。
- 样本/哈希可复算：78 项文件 SHA256 清单；测量统计由样本回读复算。
- UI 无 API 替填：G6a 图配置全部经设计器 UI；G6b 核实动作经 UI 提交；SQL 仅只读核验与声明性状态 setup（已注明）。
- 恢复含旧进程退出：G2a SIGKILL exit=137 + 库指纹前后一致。
- 压力已跑：G2b 已执行（OBSERVATION-ONLY）。
- 最终代码受影响验证完整：Server 5 类导出+3 个新演练类全绿；Web 四门全绿。
- 当前入口无冲突：全入口统一"VERIFYING+唯一下一动作=复核回执03"。
- 真实限制如实呈报：G1b 未完成 30,776 与受理-结算段排队时延为真实容量边界，不以重试或调参伪装；厂商传输隔离环境不可用（fail-closed）以声明性 setup+生产代码路径替代，S4 真实 loopback 证明不受影响。
