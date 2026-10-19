# 当前状态摘要

## 当前任务：README 首例灾备演练协作联调 IN_PROGRESS

承接：`product/readme-first-example-acceptance/receipts/execution-intake-01.md`。总 4 阶段：基线承接完成、实际操作与修复进行中、完整流程验收及结果同步未开始（1/1/2）。软件发布基线保持 0.1.8；本轮通过由 Owner 确认。

## 当前状态：0.1.8 COMPLETED（Owner 2026-10-19 验收通过并确认版本号）

回执：发布 `product/iot-native-mqtt-submit-detect/receipts/release-018-01.md`、发布后同步 `release-018-02.md`、实现 `implementation-01.md`（含 UAT 旧制品重走复验 §9）。

内容（修复批次，不新增业务功能数）：①原生 MQTT 设备控制通道（自建 MQTT 设备按流程驱动控制、预约到点真实发布、通道缺失 fail closed）；②提交后实例探测改用户态端点 `GET /workflow/my/instances/count`；③提交成功单文案。

事实：正式与实际后端 0.1.8（`50a42c8`·`5c0e66bd…`）、前端 0.1.8（`d94232b`·`f62f1a8f…`）、DB 0.1.7（无迁移）；开发默认 Server `0.1.8-SNAPSHOT`、Web `0.1.8`；两仓 annotated tag `0.1.8`→main、Release latest=0.1.8；任务分支（`e6f78bc`/`efdeb79`）已删除并回读；CI：Web `39208232197` success、Server `39208198955` attempt1 时序族抖动（同提交本地 11/0）→attempt2 success；UAT 由 0.1.7 就地升级（启动 175.771s、ERROR 0、健康 200、`build.version=0.1.8`）。

七阶段 7/0/0 全部完成。发布后复验：提交成功单文案、用户态计数 200、预约到点原生 MQTT 真实下发（命令 SENT）。计数保持：功能 49、46/22/22=90、ADV64/问题 57、P 核销空、P62 延期/OFF。

当前活动任务：README 首例灾备演练协作联调 IN_PROGRESS；Owner 实际操作并验收，Executor 处理遇到的 bug、测试和复验。下一动作：开始或继续页面操作并承接对应问题。运维注意：UAT 启动后端前必须加载 `server.env`。持续观察：预约 `2112002084486819842`（due 2026-10-20 20:00 CST）。

## 上轮发布归档摘要：0.1.7-bugfix

2026-10-18 规划最终确认 COMPLETED（7/0/0）：0.1.7 Bug 修复列车 43 项＋第 41 项线上返修＋openapi 回调租户上下文修复；正式/部署后端 0.1.7（`00e0a73`·`d8b390c1`，两次同版本覆盖）、前端 `4e89249`、DB 0.1.7；修复分支均已删除，P62 原分支保留。证据见 `product/0.1.7-bugfix/receipts/`。
