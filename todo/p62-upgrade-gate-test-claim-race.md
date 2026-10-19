# P62升级门控测试领取竞态（待排期）

来源：0.1.7返修复核阶段；CI run 39111840667（e2fe50f→main）中 P62UpgradeGatePgTest.upgradeConsumesLegacyTypesKeepsHistory 断言"命令未被领取"失败（259 中 1），日志同时存在后台 command-dispatcher 线程与嵌入式 PostgreSQL 重启的连接竞态噪音。该提交仅改租户旁路（CommonTenantLineHandler/身份装载），与本测试无因果路径；同型时序敏感先例见 [p63-reservation-test-timing-stability](p63-reservation-test-timing-stability.md)。最终提交的权威 CI 结论以本轮返修回执记录为准。

后续目标：复现并区分业务竞态与测试装置时序（测试认领与共享嵌入式 PG 实例上的后台调度器相互干扰），改善测试隔离与时间控制；不得以放宽业务规则或跳过测试消除失败。

## 兼容回滚 PG 用例失败（2026-10-19，待定位）

Server 纯文档提交 `790fe88` 的 CI run `39216284660` 中，`P62CompatRollbackPgTest` 为 2/1/0（5.2s）；相同业务代码的发布提交 `50a42c8` CI 已通过。沿本项跟踪，尚未确认该类失败与领取竞态具有相同根因。

下一动作：读取该次失败断言与环境日志，区分业务竞态、测试隔离及环境因素，再安排聚焦修复。完成条件是原兼容回滚断言在受控条件下通过，保留业务保护与失败路径断言。

来源：`product/iot-native-mqtt-submit-detect/receipts/release-018-02.md` §4。
