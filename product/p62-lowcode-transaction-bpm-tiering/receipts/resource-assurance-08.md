# P62 资源保障执行回执08（提示06 · 4项+三处纠正）

2026-10-05，执行。唯一入口=`planning-execution-prompt-resource-assurance-06.md`；最新裁决=`planning-review-resource-assurance-07.md`。本轮=离线现证归因+口径纠正+原件收集；**无长任务、无重跑验证窗**（Web 四门为同一提交 `8ad2fdd` 工作树的原件收集复跑，非新验证）。Server/Web 本轮零代码改动。证据根=`receipts/evidence/resource-assurance-08/`。阶段保持 VERIFYING、P62 整体 PLANNING。

## 0. 账本（ID→证据→结果→边界）

| ID | 状态 | 结果摘要 |
|---|---|---|
| RA02a2 | 关闭（改判"归因不足"，非产品缺陷） | 现证对应+资源对照完成（§1）：两次运行背景压力显著不同（load 中位 5.01/11.67、窗内 4.94/10.81）、实现层无资源异常信号（池等待均 0、堆 ≤865/2048 MiB、锁等待少量）、超限时刻 GC pause ≤16ms；缺整机内存/swap/进程竞争数据→根因不可确诊，归因不足如实保留；不判产品缺陷、不提高预算；时限判定=fixed 画像成立、swap 超限未归因闭环 |
| RA02b1 | 关闭（提交预算可信上界+因果纠正） | 受理→提交观测（下界）保护租户 p99=426ms(fixed)/3165ms(swap)，max=1959/4396ms；提交事务边界代码事实=invocation SUCCEEDED 是动作事务最后一步（父行锁→目标行条件更新→预占→台账→调用记录→commit，毫秒级余量）→保守上界=观测+ε（ε 为同事务固定几条语句+fsync，未测如实标注），均≤5000ms；提交完成性=全部 10946/18849 效果窗口后读取为 SUCCEEDED 零缺行+余额勾稽+占用归零；版本因果纠正=ea17dde 在 2065538 之前（§2.3） |
| RA02b2 | 关闭（口径纠正+矩阵；批项预算起点供方向裁决） | maxItemWaitMs=0.282ms 系失效口径——`sw_bpm_command_batch_item.update_time` 无写入方（实体无字段映射+updateById 不触该列+列仅 DEFAULT CURRENT_TIMESTAMP），恒等插入时刻（§3.1，装置测量缺陷登记）；项级真实时间（等强度替代）=唯一受理批次 500 项结算全部落在命令 [claimed,finished]=1.7s 内→项级受理→终态 ∈[38.324,40.024]s 且全生命周期在暖机段（§3.2）；formal/swap 测量窗内批项结算样本=0（131/132 整笔拒绝）如实登记；形态×等待矩阵（§3.3）：保护审批领取 1263/3033✓、保护受理→提交 426/3165✓、突发侧积压 FIFO 如实标注 |
| RA06b | 关闭（原件+覆盖） | engine/process 计数原件=surefire 报告 61/0/0/0（18 txt）+255/0/0/0（63 txt）（-q 静默日志补齐，§4.1）；Web 四门原件=同一提交复跑存档 exit0/1321+3（§4.2）；最终候选影响=三段 diff patch 原件 299 行（§4.3）；远端回读原文=ls-remote 双仓（§4.4）；逐字段覆盖矩阵见 §5（回执07"§8覆盖矩阵"系文字错误指向，本节为准） |

三处转录纠正见 §6（w11/w12 非零、convergence 分组口径、4313ms 归属）。

## 1. RA02a2 现证归因（离线，未重跑）

### 1.1 资源时点对应（复核07独立解析+本轮窗内重算互补）

| 指标 | formal（fixed，保护=0） | swap（保护=100） |
|---|---|---|
| resource-samples 全集（Planner 解析） | 646 条，load 中位 5.01/max 8.03 | 639 条，load 中位 11.67/max 29.78 |
| 窗口内重算（recompute.txt） | n=585，load med **4.94**/max 6.49 | n=579，load med **10.81**/max 23.80 |
| 应用单核 CPU | med 159%/max 441% | med 285%/max 458% |
| heap_used max | 855 MiB（上限 2048） | 865 MiB（上限 2048） |
| pool_wait_thread | 全窗集合={0} | 全窗集合={0} |
| pg_lock_waits 窗内合计 | 6 | 61 |

超限 2 样本（1056.4/1029.7ms，21:57:43.609/21:57:53.625）附近资源行（原件摘录 recompute.txt）：load 10.77→14.29（爬升）、单核 CPU 289—366%、heap 248—339 MiB、pool_active 0—19（上限 64）、pool_wait_thread=0、lock 0/1；GC young pause ≤16ms（回执07已核）。

### 1.2 归因判定

1. **背景压力不同成立**：swap 窗突发租户 light 提交 15617 vs formal 7712（2倍），整机 load 中位 4.94→10.81（8 核机 load>8=CPU 排队过饱和）、应用单核 CPU 159%→285%——两次运行负载画像不同，互换窗超限与该背景差异同时发生。
2. **实现层无资源异常信号**：连接池零等待线程、JVM 堆远未满（≤865/2048）、锁等待少量、GC pause 短——无池耗尽/堆压力/锁竞争/停顿的直接证据。
3. **归因不足如实保留**：缺当时整机可用内存、内存压力/swap 活动、其他进程与磁盘竞争数据（resource-samples 未采集）——JVM 堆未满不能排除整机 8GB 压力（Owner 说明本机 8GB），load_avg 不能独自区分 CPU 与内存根因。`pool_wait_millis_max` 恒 10000 系配置上限参数（含义未证），不作实际等待峰值证据。
4. **判定**：采纳复核07改判——"有限画像时效未证实、归因不足"，**不是确诊产品缺陷**：fixed 画像时效成立（7 路径 p99 达标+批拒绝 424.2ms）；swap 超限（1029.7ms，2/120 样本）与背景压力差异相关假设成立但因果未证；拒绝语义正确（整笔拒绝、无部分受理）且 formal 同路径达标——不以一窗通过否定另一窗，也不据超限数字判代码失败。
5. **不做短时定向验证的理由**：现有请求时点与系统负载原件已完整对应（复核07 解析+本轮重算），在无整机内存/swap 监控维度的情况下，最小占用定向验证不能新增归因信息量；若需进一步归因应扩展装置监控（整机内存/swap 采样）——属方向裁决，不自行启动。资源能力边界（8GB/8 核承载双租户满载注入）如实回传。

## 2. RA02b1 提交预算可信上界与版本因果

### 2.1 提交观测与事务边界（代码事实，可复算）

- 观测点 `target_invocation_update`（invocation 行 update_time，应用写入时点）——受理→提交**下界**：formal 保护(t0) p99=**426ms**/max=1959ms；swap 保护(t100) p99=**3165ms**/max=4396ms；突发侧 formal t100 p99=2311ms、swap t0 p99=22669ms（突发 ~40k 命令积压 FIFO，无保障承诺对象，如实登记）。
- 提交事务边界（`TxnActionTxOperations`，`@Transactional`）：写入次序=父行锁→目标行条件 UPDATE（版本/可用量守卫）→预占凭据→台账→**invocation SUCCEEDED（最后一步）**→方法返回即 commit。commit 与 inv_update 间隔=同事务内固定几条后续语句+fsync，量级毫秒（装置未测，如实标注 ε）。
- **保守上界=观测+ε**：formal 保护 ≤426ms+ε、swap 保护 ≤3165ms+ε——均≤5000ms 预算（ε 需 >1835ms 才会破预算，而同事务剩余为固定几条索引写；不以应用写入时间冒充 commit，ε 边界如实保留）。

### 2.2 提交完成性（提交后可见结果）

全部 light 效果（formal 10946/swap 18849）在窗口后被装置逐行读取为 SUCCEEDED 终态（零缺行，pairing.csv 可复算）；热点余额最终值=全部效果之和（回执05 双轨勾稽）；占用对账归零（occupancy [2] total=0）。每个效果的 commit 均已完成。

### 2.3 版本因果纠正（75EXPIRED 归属）

git-log-timeline.txt 原件（回执07 记载有误，以本节为准）：`ea17dde`(00:47:38) → `fc0552f`(01:16) → `ef33ea3`(01:21) → `2065538`(01:29:43)。**ea17dde（领取/执行解耦）在 2065538 之前**。75EXPIRED 所在 run（p62ra05-short-05，head=2065538）运行于 ef33ea3 引入的"审批种子 600、**供给线程不触发**"隔离实验装置——NORMAL 车道该时段无持续供给是**装置设计**，75 例受理后无领取→deadline 到期合法过期（终态合法判定维持）。它既不是"ea17 修复前的缺陷证据"，也不是"ea17 修复失败"；领取等待的达标证明在后续窗口（ea17 之后 d800f90/aebed6a 的 1263/3033ms 与收敛 94.4s/30.1s）。回执07§3.4"其后 ea17 修复"表述撤销。

## 3. RA02b2 批项口径、公平矩阵

### 3.1 maxItemWaitMs 失效口径（装置测量缺陷登记）

- 项行在受理事务插入（`TxnBatchServiceImpl`：batchMapper.insert+逐项 itemMapper.insert，create_time=DEFAULT CURRENT_TIMESTAMP=受理时刻）；结算由 `BatchInvokeCommandHandler.settleOneItem` 在命令消费内 `itemMapper.updateById`（仅 status/invocation_id/error/attempt 字段）。
- `sw_bpm_command_batch_item` 实体**无 create_time/update_time 字段映射**（`BpmCommandBatchItem.java` 无该属性），updateById 不触 update_time 列；该列定义仅 `NOT NULL DEFAULT CURRENT_TIMESTAMP`（无 ON UPDATE）→ **update_time 恒等插入时刻**。
- 因此装置 max_item_ms=MAX(update_time-create_time)≈0（实测 0.282ms=同事务多行插入时钟噪声）——**不是项级耗时**。回执07 引用的"项级 maxItemWaitMs=0.282s"撤销；装置 SQL 需前向修复（invocation 时间或独立结算时刻列）——登记，不在本轮改装置。

### 3.2 项级实际时间（等强度替代：命令消费边界）

唯一受理批次（swap 暖机段受理，B-p62ra06-swap-01-0-420b38d4…，500 项）：命令 claim=受理+**38.324s**、finish=受理+**40.024s**（pairing.csv 原件）；500 项结算由 settleOneItem 在命令处理内执行→**全部项终态落在 [claimed_at, finished_at] 的 1.7s 内**→项级"受理→终态"∈[38.324, 40.024]s。batchStatus=COMPLETED items=500 succeeded=500 failed=0 pending=0（零丢失零重复）。
- **预算起点材料（供方向裁决）**：合同"后台批量项最大领取等待≤30s"——若起点=项受理（受理后等待计入），该唯一对象领取等待 38.324s>30s；若起点=项进入可执行队列后的处理调度（排除批次命令在突发积压下的 FIFO 位置），则等待构成不同。该对象全生命周期（受理 21:54:56.65→全部项终态 21:55:36.67）位于**暖机段**（formalBegin=21:55:53.453）——非"以预热剔除解释"，而是对象本身不在 formal 测量窗内；formal/swap 窗内批项结算样本=0（131/132 批被 2428 整笔拒绝——burst 速率额度被 light 消耗后整笔拒绝，语义正确）。批项预算在本轮窗内未被任何窗内样本证明，如实登记；不凭 38.3s 直接等同项级违约（无异常/无丢失/按 FIFO 推进）。

### 3.3 形态×等待矩阵（canonical 重算，recompute.txt）

| 形态（租户角色） | fixed 窗 | swap 窗 | 预算 | 判定 |
|---|---|---|---|---|
| 审批领取·保护 | **1263ms**（n=658） | **3033ms**（n=657） | ≤5000ms | ✓（复核06锁定，本轮重算吻合；突发租户无审批提交形态） |
| 受理→提交观测·保护 | 426ms（p99）/1959(max) | 3165ms/4396 | ≤5000/每项≤30s | ✓（§2.1 上界口径成立） |
| light 命令领取·保护 | 1728ms | 3070ms | （含于受理→提交） | ✓ |
| light·突发 | 2747ms | 23889ms | 无保障承诺 | 突发积压 FIFO 位置（RA02b2 index 解释维持） |
| 受理→提交观测·突发 | 2311ms | 22669ms | 无保障承诺 | 如实登记 |
| 批项（项级） | 窗内样本=0 | 窗内样本=0 | ≤30s（起点待方向明确） | 窗内未证明+唯一暖机段对象如实登记（§3.2） |
| OA 读/实时·保护 | 已锁（复核06） | 已锁 | — | ✓ |

各形态完成性：全部 light/审批提交完成零缺行；占用勾稽归零（occupancy [1][2][3b]=0、引擎 pending/deadletter=0）。"所有合法活跃形态有界推进"在本轮窗内证据=上表各格；批项窗内样本缺失如实标注，不宣称覆盖。

## 4. RA06b 原件收集（evidence-08/ra06b-originals/）

1. **engine/process 计数原件**：本轮 `-q` 静默日志无摘要（不据此判失败）——补既有 Surefire 报告原件：engine 18 个 txt 汇总 **61/0/0/0**、process 63 个 txt 汇总 **255/0/0/0**（目录 engine-surefire/、process-surefire/）；本轮命令退出码=0（engine `mvn -q -pl sw-biz/sw-bpm/sw-bpm-engine test`、process 同构）。夹具 9/9 原流已由复核07认可（Tests run:9 BUILD SUCCESS），不重跑。
2. **Web 四门原件**：同一提交 `8ad2fdd` 工作树复跑存档（原件收集，非新验证）：typecheck exit=0、lint exit=0、test **1321 passed+3 skipped** exit=0、build exit=0（web-typecheck/lint/test/build.txt 四件）。
3. **最终候选影响原件**：三段 diff patch（diff-d800f90-aebed6a.patch 125 行=仅 V104 夹具迁移、diff-aebed6a-ac9ff6d.patch 77 行=仅测试装置、diff-ac9ff6d-910e03b.patch 97 行=仅 BpmResourceOpsService 视图键）——回执07§1.2 的正文分析由此可读复核。
4. **远端回读原文**：ls-remote-server.txt（`4f11e194…` develop）、ls-remote-web.txt（`8ad2fdd1…` develop）——与回执07批次提交后回读一致。
5. 版本时序原件：git-log-timeline.txt（ea17dde 00:47 → ef33ea3 01:21 → 2065538 01:29）。

## 5. 逐字段同步覆盖矩阵（本批次实际覆盖，回执07§8 文字错误在此纠正）

| 入口（路径/位置） | 是否受影响 | 权威来源 | 本轮目标值 | 处理 | 回读 |
|---|---|---|---|---|---|
| knowledge/current-status.md 第3行资源保障段 | 是 | 复核07+提示06 | 唯一下一动作=Planner 复核08；裁决链补复核07（RA02a2改判归因不足等） | 本批次更新 | §5 回读 |
| knowledge/current-status.md 第102行 | 是 | 复核07 | 下一动作=复核08 | 本批次更新 | 同上 |
| knowledge/session-handoff.md 资源保障段 | 是 | 复核07 | 回执07已复核未通过→剩4项→回执08 | 本批次更新 | 同上 |
| memory/state.md / handoff.md / README.md / features.md / decisions.md | 是 | 复核07+提示06 | 唯一下一动作=Planner 复核08；剩4项账本；传播待回读→本批次已传播 | 本批次更新 | 同上 |
| todo/p62-lowcode-transaction-bpm-tiering.md（状态行/排期行/登记口径） | 是 | 复核07 | 回执07已复核、剩4项、下一动作=复核08 | 本批次更新 | 同上 |
| todo/requirement-pool.md 排期行 | 是 | 复核07 | 同上 | 本批次更新 | 同上 |
| Server 功能清单.md 焦点行 | 是 | 复核07+提示06 | 回执07已复核→回执08交付→下一动作=复核08 | 本批次更新（提交推送） | 远端回读 |
| 根 README.md | 否 | — | 无资源保障/当前焦点段落（grep 零命中，历史发布段不受影响） | 不适用 | — |
| 方向文档 ready/direction-p62-resource-assurance.md | 否 | — | Planner 维护（提示06明确"Planner同步memory/todo/当前方向"） | 不改（角色边界） | — |

## 6. 三处转录纠正（合并账本，无须重跑）

1. **w11/w12 非零**：回执07§2.2"全部归入 w3—w9"与自身表矛盾（w11=92/7、w12=75/11 非零）。更正为：拒绝**集中在 w3—w9**（w1/w2=0，w3—w5 占约74%），w10 归零，w11/w12 有零星残留；2h 观察事实与时段分布表不变。
2. **convergence 分组口径**：`convergence-detail.txt` 的 `openChargedLightTargetChain` 标题下确有分组数值（formal：t100 SHARED 7712+t0 SHARED 2689+t0 PROD_RESERVED 545=10946=light 提交总数）——装置 SQL（P62ResourceAssurancePgTest 写入方法）仅按 `status='COMPLETED' AND resource_class='PROD' AND completion_point='TARGET_ACTION_DONE'` 分组，**无 `resource_released_at IS NULL` 条件、无目标链核对**——是宽口径"待核对清单"，非未释放事实。占用账以 `occupancy-responsibility.txt [2]` 为准（带 `resource_released_at IS NULL` 条件+逐行 `engineTargetChainActive` 核对，formal/swap total=0）——两文件口径不同、两者不矛盾。回执07"目标链标题下非空行实为固定说明文字"的表述撤销；装置 SQL 与注释不符登记为装置缺陷（不为本轮文档修改改装置）。
3. **4313ms 归属**：05 formal 装置 `protectedOaClaimWaitMaxMs=4313ms` 的收集条件硬编码 `tenant==0`（混收 light+approval），canonical 重算该窗 light×t0 claim_max=**4313ms**（n=3131）、approval×t0 max=**3696ms**（n=655）——4313ms 属 **light** 命令等待而非审批领取；审批领取真值沿复核05/06 更正链=06 窗 canonical 重算 1263/3033ms（锁定）。回执07§1.2"领取4313ms装置口径"表述按本节归属理解。

## 7. 剩余与方向裁决事项（非执行可闭环）

1. 互换窗批拒绝超限的最终归因（需整机内存/swap 监控维度或方向裁决接受"背景压力假设+归因不足"结案）；
2. 批项预算起点与区段适用性（§3.2 材料：唯一暖机段对象 38.324s vs 窗内零样本）；
3. 批项项级结算时刻的装置前向修复（invocation 时间或独立列）；
4. convergence/occupancy 装置 SQL 口径统一（§6.2 装置缺陷）；
5. openapi 回调监听器功能缺陷（范围外登记维持）。

## 8. 自检与边界

对象与主张一致；数值有原件（recompute.txt/surefire/patch/ls-remote/时序）；失败保留（2h 异常、批项窗内零样本、ε 未测、归因不足）；设备限制不冒称实现缺陷；下界不当上界（提交观测+ε 口径）；旧结论不因文案重验。本轮无新增哈希计算（提示06：不例行比对产物哈希，直接读取解析足够）。**自验不等于 Planner 验收，不写阶段 PASSED/COMPLETED**。下一动作=Planner 复核本回执。
