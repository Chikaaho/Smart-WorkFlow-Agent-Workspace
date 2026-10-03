# RA02b2 公平等待（普通OA领取≤5s / 批次项≤30s / 保护目标P99≤5s）

## 缺口→原始文件:键→实际结果→边界

1. 回执04正式窗：保护审批领取 max=39132ms（pairing.csv kind=approval tenant=0 排序 claim_wait_ms；最大对象 key=f4fd7eb3…）。归因（run-console.log.gz）：NORMAL 车道单线程串行消费，一轮 50 条处理器耗时串行累加（命令处理完成 耗时 分布 p50=21ms/p99=321ms/max=2558ms），三次 60—89s 车道停摆（23:25:36/23:27:29/23:29:46 后），期间数千条 jdbc DEBUG 且无命令完成；池 active≤39/64、pool_wait=0、pg_lock_waits≤15、CPU≤62% —— 排除池饥饿/锁/CPU，定性=消费串行化。

2. 修复（8e46fb4 对账 15s + ea17dde 消费领取/执行解耦并发3，领取节奏/批量=画像 100ms/批50 不变）：
   - 短轮对照链（evidence-05/ra02-window-short 各 run pairing-summary.txt）：p62ra05-short-01 claim max=6804ms → short-03 max=2525ms ≤5000ms 达标。
   - 自动收敛同步达标：autoConvergeMs=96871ms ≤120s（report convergence 键），不经手调对账。

3. 批次项领取≤30s：本轮正式画像下 500 项批次整笔被 RATE 拒绝（2428，samples outcome），无在途批次项；batch-accounting（locked，evidence-03/ra02-batch）承载按项会计行为。

4. 正式窗数值见 ra02-window-formal（本轮回执05补注）。

recordedAt=2026-10-04T00:55:58+08:00
