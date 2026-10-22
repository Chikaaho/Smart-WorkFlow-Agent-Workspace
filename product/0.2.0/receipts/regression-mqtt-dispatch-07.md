# 0.2.0 回归修复：受控 MQTT 预约调度竞争

2026-10-22｜Executor｜分支实施进行中。总七阶段：需求评估已完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。

完整回归第二次执行中，`IotNativeMqttDeferredDispatchPgTest` 的正向用例读取到 DISPATCHING。自动调度先认领后，测试手动调用同一入口返回，随即查询终态，形成测试竞争；此前首批回执也记录过该抖动。

在写入任何测试预约或命令前，取消该隔离上下文的自动注解任务，由用例显式调用真实生产调度入口。保留真实 PostgreSQL、原生 MQTT Broker、QoS1 发送、命令 SENT、预约 DISPATCHED、实际接收主题/载荷和停用连接零发送断言。生产调度配置未改。Broker 在 PUBACK 前写入接收记录，生产发布同步等待确认，因此完成后直接读取对应新增行，去掉原来的 30 秒文件轮询。

修正后的目标检查：`mvn -pl sw-bootstrap -am -Dtest=TenantAdministrationDatabaseTest,P62NonEmptyUpgradePgTest,IotNativeMqttDeferredDispatchPgTest -Dsurefire.failIfNoSpecifiedTests=false test`，MAVEN_OPTS=-Xmx2g，exit 0；MQTT 两个用例均通过（35.50 秒），同次检查共 15 个用例，0 failure / 0 error / 0 skipped。原始日志及结果：`C:/Users/hjxch/.codex/evidence-020/tenant-identity/tenant-menu-and-regression.log`、同名 `-result.txt`。失败原文保留在 `full-test-02.log` 和 `full-test-02-reports/TEST-com.sw.ck.bootstrap.iot.IotNativeMqttDeferredDispatchPgTest.xml`。

Server 单文件提交 `ea364c3540fdd6756677c14c7c5284376160c110` 已普通推送到 `origin/codex/0.2.0-tenant-form-flow` 并回读一致。目标 JVM、Broker 与嵌入 PG 已随用例关闭，检查结束后没有遗留 Java/PG 进程。本结果是关联回归修复，不能代替 T020/A08 租户停用后的后台认领验证。

本次全工程命令到 900 秒上限后退出 124；保留原始失败与超时事实，未改写成 BUILD SUCCESS。后续按尚未完成的测试类继续有界执行，并修正受新增迁移影响的历史断言；结果另随租户关联回执登记。
