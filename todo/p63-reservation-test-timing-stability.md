# P63预约边界测试时序稳定性（待排期）

来源：0.1.6终态回执terminal-sync-01§6.3；文档提交CI38865882855中P63ReservationBoundaryPgTest两项因2秒预约窗口提前EXPIRED失败，同代码基前一轮通过。正式发布来源及已部署制品保持通过结论，本项不重开0.1.6。

后续目标：复现并区分业务竞态与测试装置时序，保持到期/取消/认领业务断言，改善测试时间控制与隔离；不得以放宽业务规则或跳过测试消除失败。未排期、未启动实现，不新增P编号。Admin规则时点链接维护：system.md§3.0引用的0.1.6 ready方向已归档passed，按权限修正即可。

实例追加（2026-10-18）：main `f58e3ae`（纯文档）run `39117957733` failure＝`P63ReservationBoundaryPgTest.concurrentCancelVsClaimHasExactlyOneWinner:487`「认领胜→调度侧状态」，84.18s；同代码基 `c6a7c06` 制品 run `39115050365` 通过，判定时序族实例（非产品回退）。
