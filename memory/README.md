# memory 使用说明

## 当前状态：0.1.8 COMPLETED（Owner 2026-10-19 验收通过并确认版本号）

回执：发布 `product/iot-native-mqtt-submit-detect/receipts/release-018-01.md`、发布后同步 `release-018-02.md`、实现 `implementation-01.md`（含 UAT 旧制品重走复验 §9）。

发布内容（修复批次，不新增业务功能数）：①原生 MQTT 设备控制通道（自建 MQTT 设备按流程驱动控制、预约到点真实发布、通道缺失 fail closed）；②提交后实例探测改用户态端点；③提交成功单文案。

事实：后端 0.1.8（`50a42c8`·`5c0e66bd…`）、前端 0.1.8（`d94232b`·`f62f1a8f…`）、DB 0.1.7（无迁移）；开发默认 Server `0.1.8-SNAPSHOT`/Web `0.1.8`；两仓 tag/Release `0.1.8`（latest）；任务分支已删并回读；UAT 就地升级（ERROR 0、健康 200、`build.version=0.1.8`）。发布后复验：单文案（真实 UI 提交）、用户态计数 200、预约到点 MQTT 真实下发（SENT）。计数保持（49、46/22/22=90、ADV64/问题 57、P 核销空、P62 延期/OFF）。

活动交付无；下一动作＝等待 Owner 安排需求（P65/P29 待排期）。运维注意：UAT 启动后端前必须加载 `server.env`；持续观察：预约 `2112002084486819842`（due 2026-10-20 20:00 CST）。

## 上轮发布归档摘要：0.1.7-bugfix

2026-10-18 规划最终确认 COMPLETED（7/0/0）：0.1.7 修复列车 43 项＋第 41 项返修＋openapi 回调修复；后端 `00e0a73`·`d8b390c1`（两次同版本覆盖）、前端 `4e89249`、DB 0.1.7。证据见 `product/0.1.7-bugfix/receipts/`。
