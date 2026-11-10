# memory 索引

2026-11-09｜Executor（P66 0.4.0 发布）｜READY 1.3.7。

P66 多数据库兼容以 **Server 0.4.0** 发布并部署 UAT，登记第 **52** 个正式功能；Web 维持 **0.3.6**。三示例流程 0.3.1—0.3.6 保持 `COMPLETED`。0.4.0 发布审查通过；补做审查 `product/multi-database-compat/receipts/planning-review-final-03.md` §7 已裁决方案 A，Z4 后终态复核；Web 缺陷见 `todo/web-ui-defects-20261109.md`。

发布：Server tag `0.4.0`=`a4f6c278`（Release `438918154`，`bootstrap-0.4.0.jar` sha256 `188be963…`）；Web tag `0.3.7`=`a6781c8`（Release `439939910`，`sw-web-dist-0.3.7.zip` sha256 `1bb0d03c…`）。UAT Server build.version=0.4.0、Flyway v0.4.0、health UP；Web 入口 `index-jYV2b5yF.js`、根 200。基线：功能 52，M59/18/13、ADV1/7/56、实际 P63、问题 57。

阅读顺序：state.md → handoff.md → issues.md；方向规定范围、验收与完整交付。0.4.0 执行回执 `product/multi-database-compat/receipts/execution-final-03.md`；CI 子进程竞态见 `todo/iot-subprocess-output-race.md`。
