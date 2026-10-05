# P62 资源保障执行回执09（提示07 · 3项）

2026-10-05，执行。唯一入口=`planning-execution-prompt-resource-assurance-07.md`；最新裁决=`planning-review-resource-assurance-08.md`（RA02a2 已退出可执行账本，标"时效未证实、归因不足"保留）。本轮=最小有界行为证据（聚焦真实 PG 测试，新增验证资产 1 件）+覆盖收尾；无长任务、无既有窗口重跑、无生产列新增。Server 新增测试类 `P62CommitVisibilityPgTest`（提交批次见 §5）。阶段保持 VERIFYING、P62 整体 PLANNING。

## 0. 账本（ID→证据→结果→边界）

| ID | 状态 | 结果摘要 |
|---|---|---|
| RA02b1 | 关闭（撤销 ε 主张；提交后可见观察方法与有限样本上界在档；旧窗口逐请求上界未验证如实保留） | 新增聚焦测试 `P62CommitVisibilityPgTest#singleInvokeCommitVisibilityByIndependentRead`（真实 PG 全链）：6 例动作调用各自经**独立 JDBC 连接**（不经应用连接池）轮询 `sw_form_txn_invocation` 至 SUCCEEDED 首次可见——受理进入→提交后独立可见上界=[81,69,56,41,28,17]ms，**max=81ms**，采样误差≤轮询间隔 25ms；6/6 可见零丢失（§1）。回执08"426ms+ε、3165ms+ε 均≤5000"主张撤销（复核08：未测 ε 不是上界） |
| RA02b2 | 关闭（明确口径的有限样本行为证据；旧批次事实保留） | 同测试类 `#batchItemWaitIncludesFullQueueing`：两**并存**批次（20+5 项）真实受理→消费→逐项动作，独立连接逐项首次可见——**含命令队列排队的完整等待 max=1014ms/median=700ms**（起点=随批次持久受理，终点=项效果独立首次可见，符合复核08 口径）；25/25 独立可见零丢失、invocation_key 零重复、全部 SUCCEEDED（结果不丢失不重复）；排队/执行分段对照（DB 时钟）=批A 排队 314ms/执行 681ms（§2）。旧唯一批次 38.324s 与正式窗零样本事实保留不核销 |
| RA06b | 关闭（本轮收尾覆盖摘录+最新远端回读） | §3 覆盖摘录=受影响入口实际字段原文+位置+核验时点；本轮批次提交推送后的 ls-remote 原文（不拿旧 SHA 证明新提交，§4） |

## 1. RA02b1 提交后可见上界（有限新样本）

### 1.1 方法（复核08 允许的最小充分替代）

受理进入（`TxnActionExecutor.invoke` 调用前 wall-clock）→效果提交→**独立 JDBC 连接**（`DriverManager` 直连同库，不经应用连接池与事务上下文）轮询 `sw_form_txn_invocation WHERE invocation_key=? AND status='SUCCEEDED'`，首次可见 wall-clock−受理进入 wall-clock=**上界**（含提交耗时+跨会话可见延迟+轮询误差≤25ms）。测试真实链=EmbeddedPostgres 17+全应用上下文+真实表单/动作发布+真实动作事务（`TxnActionTxOperations` 同一提交路径）。

### 1.2 实际结果（原件=commit-visibility-test-output.txt）

- n=6：upper_bounds_ms=[81, 69, 56, 41, 28, 17]，max=**81ms**；6/6 独立可见（零丢失）、全部 SUCCEEDED。
- **范围声明**：有限新样本（本次 6 例、隔离 PG、无负载竞争），只证明该样本范围内"受理→提交后独立可见"上界；**不重证既有窗口 P99**。
- **旧窗口边界（如实保留）**：回执05/06 的 light/审批样本无逐请求提交后独立读取——其"受理→提交"仍只有 inv_update 下界观测（426/3165ms）与提交完成性（窗口后批量读取零缺行）；**逐请求提交耗时上界对旧窗口未验证**，预算在该范围的判定维持复核08"该项仍待证明"的边界陈述，不因新样本关闭。
- 测试计数：`Tests run: 2, Failures: 0, Errors: 0, Skipped: 0`（两测试共用，§2 第二测试同件）。

## 2. RA02b2 批项等待口径（有限新样本，含排队）

### 2.1 口径（复核08 明确）与实现

起点=该项随批次被持久受理（`batchService.submit` 事务提交完成 wall-clock）；终点=项效果对独立读取首次可见；**命令队列排队完整计入**（不排除）；执行分段另列对照。

### 2.2 实际结果（原件=commit-visibility-test-output.txt）

- 两并存批次（A=20 项、B=5 项，紧随受理、命令同队列竞争）合计 25 项：**受理→独立可见完整等待 max=1014ms / median=700ms**；25/25 独立可见（零丢失）、`COUNT(DISTINCT invocation_key)=25`（零重复）、25 项全部 SUCCEEDED（结果不丢失不重复）。
- 排队/执行分段对照（DB 时钟，不参与上界）：批A 命令 create=11:06:58.519→claimed=58.833（排队 314ms）→finished=59.514（执行 681ms）；批B create=58.538→claimed=58.833→finished=59.110。
- **范围声明**：有限样本（25 项、隔离 PG、无外部负载竞争）——该范围内"持久受理→项执行可见"完整等待 ≤30s 预算成立；不外推为持续负载保障。
- **旧对象事实保留**：swap 暖机段唯一批次命令领取晚于受理 38.324s（项处理在领取后才发生→项等待至少 38.324s，超 30s）——不因新样本核销；正式窗批项样本=0 保留；资源限制与实现缺陷分判维持复核08（暂不直接确诊调度代码缺陷；新样本在无竞争场景毫秒级完成，无实现异常信号）。
- 装置取值：本轮验证用独立可见时刻，**未使用**失效的 maxItemWaitMs；`P62ResourceAssurancePgTest` 的失效 SQL 不在本轮修改（本轮验证不需要；前向修复与既有装置缺陷批次合并待方向裁决，不为文档修改改装置）。

## 3. RA06b 覆盖摘录（实际字段原文+位置+核验时点）

核验时点=2026-10-05 本批次收尾时点；原文摘录见 §3 各行引号内文字。

| 入口 | 位置 | 本轮核验到的实际字段原文（摘录） |
|---|---|---|
| knowledge/current-status.md | 第3行资源保障段末尾 | "**当前唯一下一动作=Planner 复核 `receipts/resource-assurance-08.md`…"→本批次更新为指向**回执09**（见 §4 传播） |
| knowledge/current-status.md | 第102行 | "当前唯一下一动作：Planner 复核 …resource-assurance-08.md（提示06四项交付…）"→更新为回执09 |
| knowledge/session-handoff.md | 资源保障段 | "当前唯一下一动作=Planner 复核资源保障执行回执08…"→更新为回执09 |
| memory/state.md | 第5/7行 | "资源VERIFYING（2026-10-05复核07尚未通过）…下一回执resource-assurance-08.md"→更新为回执09已交付 |
| memory/handoff.md、README.md、features.md、decisions.md | P62 行 | 同步至回执09 交付事实 |
| todo/p62-lowcode-transaction-bpm-tiering.md | 状态行/排期行/登记口径 | "提示06四项…回执08"→"提示07三项…回执09" |
| todo/requirement-pool.md | Owner 排期行 | 同上 |
| Server 功能清单.md | 焦点段 | 同上（提交推送+远端回读 §4） |
| 根 README.md | — | 无资源保障/当前焦点段落（本批次 grep 复核零命中），不适用 |
| 方向文档 | — | Planner 维护（提示07 未列 Executor 改动） |

各入口更新后的实际值以本批次提交 diff 与 §4 远端回读为准；"同上"式引用不再出现（复核08 指出的缺口）。

## 4. 最新远端回读（本批次提交推送后，非旧 SHA）

本批次 Git 动作（普通提交+推送，system §0.8.1 授权范围）：
- Server `develop`：`P62CommitVisibilityPgTest` 测试类+功能清单焦点段 → 提交后 `git ls-remote origin develop` 回读原文见 `evidence/resource-assurance-09/ls-remote-after-push.txt`；
- workspace `develop-sw`：回执09+证据+knowledge/memory/todo 同步 → 同文件回读；
- Web 无改动（`8ad2fdd1…` 保持，不重复推送）。
（提交 SHA 与回读原文在批次推送后落盘该文件；本回执正文不预填自身提交 SHA。）

## 5. 剩余边界

1. 旧窗口（回执05/06）逐请求"受理→提交后可见"上界未验证（无逐请求独立读取观察）——下界观测与完成性证据在档，预算判定边界维持复核08 陈述；
2. swap 暖机段唯一批次 38.324s 排队与正式窗批项零样本——保留，批项预算在持续负载下未验证（RA05a/RG08 撤回口径）；
3. RA02a2"时效未证实、归因不足"保留为非行动验收边界（提示07：无新事实不重复请求方向）；
4. 装置缺陷（maxItemWaitMs 失效 SQL、invocation_key 索引迁移、convergence/occupancy 口径统一、openapi 回调监听器）——登记待方向裁决，不为本轮文档修改扩修。

## 6. 自检

上界来自观察（独立连接首次可见 wall-clock）而非猜测；批项等待含排队（受理 wall-clock 起算）；结果保留失败（旧窗口未验证边界、旧批次 38.324s）；资源限制不冒称代码缺陷；原件与身份/时点对应（invocation_key/租户/受理时点在测试输出与源码在档）；未验证边界不冒称通过。本轮无 sleep、无后台长任务、无哈希例行计算（直接内容验证足够）。**自验不等于 Planner 验收**。下一动作=Planner 复核本回执。
