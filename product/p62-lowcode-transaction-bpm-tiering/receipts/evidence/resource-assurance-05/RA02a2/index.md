# RA02a2 时效与统计（诊断+修复链）

## 缺口→原始文件:键→实际结果→边界

1. 负载对象不足（复核04：保护light 1311拒绝、审批494 SKIP）：根因=①审批任务种子160耗尽后装置无供给（SKIP）→ d7c9389 加持续供给（真实起实例补任务，与消费解耦）；②保护额度拒绝=目标链释放慢导致占用堆积 → 8e46fb4 对账15s。修复后：short-03/approval 655/655 ACCEPTED 零SKIP（formal），保护额度拒绝 formal=4（原1311）。

2. 统计单源沿用回执04锁定口径（发起入组主口径/nearest-rank/转义CSV/复算脚本）。

3. 修复后短轮（p62ra05-short-03）与正式窗（p62ra05-formal-01）数值见两目录 fixed-burst-report.txt：正式窗达标=light 1199.8≤2000、审批763.6≤1000、burst合法506.9≤1000、burst拒绝934.0≤1000、领取4313≤5000、自动收敛74.3s≤120s、额度拒绝4；未达=实时810.6/300、OA读1303.6/1000、批拒绝2101.8/1000（~35s周期尾尖：GC≤44ms、锁≤12、CPU≤72%、池≤39/64；候选=审批实例供给的周期引擎成本，非GC/锁/CPU定论）。

4. 死锁=0（pg-server-20261004.log 零标记）。

recordedAt=2026-10-04T01:10:50+08:00
# RA02a2 尾尖归因诊断（p62ra05-short-05，含原始GC/安全点与PG info级日志）

## 缺口→原始文件:键→实际结果→边界

1. 审批供给候选已排除：ra02-isolation-exp（种子600，供给线程未触发）尾尖依旧且更密（realtime slow 47 次）——供给启动非根因。
2. 安全点排除：raw-gc-safepoint.log 703 个安全点，Reaching-safepoint max=24.9ms（无 JVM 全局冻结）；G1 暂停 3—60ms（G1PauseRemark at-safepoint 最大 58.4ms@01:34:18）。
3. PG checkpoint 排除：pg-server-20261004.log（info级）窗口内 checkpoint=0。
4. 剩余事实：慢请求时刻与 G1 分配回收时刻相关（01:30:41/01:31:31/01:32:05-10/01:33:03 与 Safepoint/GC 行一一对应）；gc_time_ms 采样 max=102ms/秒，回收期间并发阶段抢占 CPU。结论=分配风暴型尾延迟（JVM 堆 2GiB=G1 默认），属合同画像维度（堆冻结），GC 器/堆参调整需 Planner 裁决；已按『不可无限无变化重试』停止迭代并回传可复算事实。
5. 附件：raw-gc-safepoint.log.gz（原始事件，-Xlog:gc*,safepoint）、run-console.log.gz、pg-server-20261004.log（info级）、resource-samples.csv。

recordedAt=2026-10-04T01:38:18+08:00
