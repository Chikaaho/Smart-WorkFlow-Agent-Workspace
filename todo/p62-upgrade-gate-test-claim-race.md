# P62升级门控测试领取竞态（待排期）

来源：0.1.7返修复核阶段；CI run 39111840667（e2fe50f→main）中 P62UpgradeGatePgTest.upgradeConsumesLegacyTypesKeepsHistory 断言"命令未被领取"失败（259 中 1），日志同时存在后台 command-dispatcher 线程与嵌入式 PostgreSQL 重启的连接竞态噪音。该提交仅改租户旁路（CommonTenantLineHandler/身份装载），与本测试无因果路径；同型时序敏感先例见 [p63-reservation-test-timing-stability](p63-reservation-test-timing-stability.md)。最终提交的权威 CI 结论以本轮返修回执记录为准。

后续目标：复现并区分业务竞态与测试装置时序（测试认领与共享嵌入式 PG 实例上的后台调度器相互干扰），改善测试隔离与时间控制；不得以放宽业务规则或跳过测试消除失败。
