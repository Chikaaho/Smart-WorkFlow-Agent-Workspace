# P62 有限性能二轮回执 02

2026-10-11，执行。依据=[补充提示01](planning-execution-prompt-performance-bounded-01.md)（唯一当前执行待办）+[首轮审查](planning-review-performance-bounded-01.md)+主方向。各 G 项均已正式验收 1 轮，本回执=第二轮输入，不换编号重置轮数。**不写性能 PASSED**；策略默认 OFF；P64 Ⅰ/Ⅱ PASSED、Ⅲ 排队不变。

## 1. 运行身份

Server 任务分支 `feature/p62-perf-bounded-20261011`=`9e2b07f`（首轮 6 提交之上 + 本轮 `f2af26b`/`6335f7f`/`9e2b07f`）；工作树=仅 logs/ 未跟踪；指纹逐轮 env-frozen（P1 尝试3=`ae7ece4dd1d03761`）。**被测 JVM 有效堆=2048MiB**（`-DargLine=-Xmx2g`，三画像 env-frozen `heapMaxMiB=2048` 实读）；其余合同画像不变（隔离 PG17.5、池 64、异步 8、dispatcher 100ms/批 50）；串行不并行，每画像一次第二轮正式采集。

## 2. 逐 G 项（第二轮）

| G | 完成条件判定 | 原件与结果 |
|---|---|---|
| G1 对象/负载覆盖 | **成立**（环境+到达账可验证） | 堆根因=`MAVEN_OPTS` 不传导 surefire fork（JDK 默认 ¼ 物理内存=4032MiB）→`-DargLine=-Xmx2g` 修复，三画像 `heapMaxMiB=2048`。到达勾稽= paced-arrivals.txt 每角色 planned/dispatchedInFormal/deferredAfterStop/backpressureRounds + **逐秒实发直方图**（arrivalPerSec，30 桶/角色），秒级可对。正式采集=P1 尝试3 PASSED、P2 FAIL（G2 真实超界）、P3 PASSED |
| G2 行为结果 | **计量修正后如实报：受保护 5s P99 预算 P1/P3 过、P2 未达** | 提交点=实例专属调用行结算时刻（inv.update_time）；受保护提交可见 P99：**P1=1132ms✓、P2=9149ms✗、P3=373/381ms✓**；审批终结 P99：P1=898✓、P2=9005✗、P3=213/243✓；**每个≤30s 三画像全过**（全局最大 14486ms）；全部受理对象提交证据缺失=0×3 画像（`windowLightMissingSubmit=0 windowApprovalMissingSubmit=0`）。若 5s 预算按全租户口径，burst 侧 6543/14414ms 亦超——口径留 Planner 裁决 |
| G3 超预算信号 | **真实差异确认，修复超授权→按§3 返回规划** | 起点核查：命令 create_time=22:08:35.916 vs HTTP 受理 22:08:35.921（差 5ms，同 DB 时钟）——真实排队非钟差。根因=NORMAL 车道全局 FIFO + dispatch-workers=3 在突发负载下的容量排队；二轮同根复现且更宽（P2 受保护审批领取 8554ms、轻流程提交可见 9149ms）。容量/优先级属合同画像调定非装置授权，按补充提示§3 明确差异返回规划 |
| G4 结果闭环 | **修复+隔离验证+二轮实测成立** | 两半接缝=①`expireDue` 对 BATCH_INVOKE 增项级效果检查（存在非 PENDING 项=效果已发生，不判过期仅补 `overdue_at` 证据）；②`claimDue` 准入截止对在途批次续跑豁免（准入截止约束**首次执行**，续跑是对已生效工作的收敛推进）。隔离验证=TieredCommandSemanticsH2Test 7/7（过期跳过/超期证据/续跑领取/未开始批次照常过期/幂等）；process 模块全量 **385/0/0/0 BUILD SUCCESS**×2 轮。二轮实测=P1 大批次（500 项/20 切片）合法完成、counter=0、expired=0、openAfter=0；P2 convergence 22.1s openAfter=0 counter=0 |
| G5 收尾事实 | **成立** | 影响检查=process 385/0×2 + FlywayFullChain H2/PG 18 条/0.1.10 EXIT=0（`evidence/.../g5-existing-outputs/affected-checks.txt`）；监听器=租户异常 0（首轮 200—400）+投递真实执行且按 event 租户归属（回调失败=种子应用死端口，失败可查日志在案）；应用退出=Tomcat GracefulShutdown+Quartz shutdown 三画像在案（`g5-existing-outputs/listener-and-exit-facts.txt`）；Git=本回执随批提交，远端回读值写入提交说明，不为含自身 SHA 循环提交 |

## 3. 尝试台账（全披露；已知失败不重试到成功）

| 画像 | 尝试 | 结果 |
|---|---|---|
| r2-p1 | attempt1 | 装置计量缺陷：提交点误用共享热点目标行 update_time（后写污染 30207ms 假超界；真实命令侧≤5.2s）→ 改实例专属调用行；全档 `attempt1-shared-target-metric-defect/` |
| r2-p1 | attempt2 | 暴露 G4 第二半：claimDue 准入截止硬校验使让出到期批次成为「既不过期也无推进者」孤儿（120s counter 冻结 350、open=1）→ 6335f7f 修复；全档 `attempt2-claim-deadline-orphan/` |
| r2-p1 | **attempt3=正式采集** | **PASSED**（受保护预算全过 116.2/142.7/298.4/141.8ms；收敛 20.0s） |
| r2-p2 | **采集=FAIL（真实超界）** | 受保护提交可见 P99 9149ms/审批 9005ms 超 5s（G3 同根容量排队）；受理级预算全过（127.3/167.0/297.2/135.8ms）；occupancy 文件缺位=配对断言先失败（装置顺序，其收敛/勾稽事实来自 report） |
| r2-p3 | **采集** | **PASSED**（双租户全预算过，收敛 3s，零拒绝） |

## 4. 边界与未决（留 Planner）

1. **受保护提交可见/审批领取 5s P99 在突发画像下未达（P2）**：2GiB 合同环境下容量排队放大（首轮 4GiB 数字不可外推，已按 G1 失效）；修复路径=dispatch-workers 等容量参数调定，属合同画像范畴→随 G3 一并返回规划。
2. burst 轻流程是否适用 5s P99 口径（P1 burst 6543ms）。
3. P2 batchClaimWaitMax=27488ms（≤30s 合同内，接近上界）。
4. P1 突发拒绝 22.1%（593×2427+48×2428/2898）、500 项整批 6/6 明确拒绝 P99 978ms≤1s——拒绝率全披露保持。

原始证据：`receipts/evidence/performance-bounded-20261011/p62-bounded-20261011-r2-*/`（新 runId 旧根目录；旧原件未覆写）。

## 5. Git 与同步

Server 任务分支本轮 3 提交（`f2af26b` G4+二轮装置、`6335f7f` claimDue 续跑、`9e2b07f` percentile 排序）随回执批次推送远端回读；工作区回执+knowledge-first 同步另行批次提交。唯一状态：P62 已批准功能 COMPLETED；有限性能 VERIFYING（第二轮已提交，P2 超界待裁）；P64 IN_PROGRESS Ⅰ/Ⅱ PASSED、Ⅲ 排队；策略 OFF；47/46-22-22=90/ADV64/57、P63/VB 及正式基线保持。**下一动作=Planner 第二轮验收（G1—G5 逐项，含 §4 裁决点）**。
