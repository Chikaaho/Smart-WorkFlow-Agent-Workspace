# G4b/B4 索引：失败写回的原子领取权约束（读取校验后、实际写回前的交接窗口）

日期：2026-09-06；Executor。依据提示07 §2 G4b B4 / 审查07 §2。

## 实现修复（src/PersistentBpmCommandQueue.java）

- `failAndScheduleRetry` 的两个最终 UPDATE（终态失败分支、PENDING 重试分支）均追加 `.eq(BpmCommand::getClaimToken, claimToken)`——与 complete/reject 同一领取权条件；读取校验通过不再豁免写入校验，状态相同不能代替领取代次。
- 读取抽为受保护方法 `readCommandForFailure`（行为不变），供窗口测试注入"读取后、写回前"的交接快照；共享测试配置的队列 Bean 换为 `StaleReadWindowQueue` 子类（不设快照时与真实队列逐字节同行为，src/OverlapH2TestConfig.java）。

## 窗口测试（真实 H2 + 真实持久化队列，无 mock）

`CommandOverlapRealEngineTest.assertion4_failWriteback_windowBetweenReadAndWrite_guardedByClaimToken`：

1. 真实受理 TASK_APPROVE 命令并由消费者 A 领取（tokenA，PROCESSING）。
2. 取 A 代真实行快照（readCommandForFailure，此时读取校验可通过）→ `reclaimStale` 回收 → B 重领（tokenB，仍 PROCESSING）。
3. 窗口内以快照调用 `failAndScheduleRetry(cmd, tokenA, …)`：
   - 重试分支：返回 false；行仍 PROCESSING/tokenB，retry_count=0、failure_reason=null（未被改写）。
   - 终态失败分支（maxRetries=1）：返回 false；行仍 PROCESSING/tokenB、未改判 FAILED、failure_reason=null。
4. 正向对照：当前持有者 tokenB 调用 → 返回 true，行转 PENDING、retry_count=1。

反向断言成立：A 读取通过后、写回前发生交接时，迟到失败既不打回 PENDING 扰乱重试计数，也不改判 B 的终态。原始报告 `surefire/com.sw.ck.bootstrap.p4overlap.CommandOverlapRealEngineTest.txt`（Tests run: 4, Failures: 0, Errors: 0——原三断言 + 新断言4，原有窗口断言未回退）。

## 边界

- complete/reject 的令牌条件为既有实现（审查07 已认可正确进展），本轮未改动。
- 已证场景（L24：交接后旧 fail 调用、同命令恢复）未重做；本索引只覆盖新发现窗口。
