# 腾讯 IoT Demo 对接进展审查

> 日期：2026-08-28
> 验收对象：`tencent-iot-step-demo-alignment-execution.md`
> 所属正式功能：`minimal-business-closure`
> 当前结论：`VERIFYING`

## 已确认进展

执行层已读取 Owner 提供的三个 Demo，并完成回调与腾讯客户端相关对齐：GET `Echostr` 验证、JSON/Base64 Payload、`EV_ONLINE`、`productID`/`ProductId` 兼容、Fastjson2 解析以及 SDK 默认超时。

回执报告 IoT 模块测试、受影响模块编译和全量编译通过。Owner 已明确不要求腾讯账号、真实云端联调或完整测试，因此以上 Demo 对齐内容锁定，不要求重复执行或扩大测试范围。

## 方向同步调整

- 回调鉴权按 Owner Demo 使用公开回调与 GET 验证，不再要求规划此前追加的自定义 Hook Token。
- 连接/读取超时按 Demo 使用腾讯 SDK 默认值，不再作为外部配置验收项。
- 腾讯 IoT 仍属于 `minimal-business-closure` 正式功能的组成部分，不登记为独立功能。

## 当前未完成的最小验收信息

本回执主要是修改清单和测试摘要，尚未直接展示以下连接结果：

- `productId + deviceName` 已从控制入口传到腾讯 Provider。
- 上线回调解析成功后实际进入对应设备的待发送队列补发入口。
- 延迟生效和在线确认两类 Util 均调用腾讯 Provider，而不是固定模拟成功。
- 审批完成后仍能生成设备命令；腾讯调用失败不回滚审批，命令结果可见。
- 生产腾讯模式不会静默回退 Mock，配置与日志中没有腾讯 Secret。

重新提交只需提供上述最小连接证据或可复现的本地输出，不要求腾讯账号、真实设备、真实云端响应、完整测试套件或重复执行已经锁定的 Demo 对齐工作。

## 状态处理

- 正式功能 `minimal-business-closure` 更新为 `VERIFYING`。
- 腾讯 IoT 当前方向继续留在 `ready/`，等待最小补证。
- 不进入阶段三，不写 `PASSED` 或 `COMPLETED`，不改变正式功能数与基线。
