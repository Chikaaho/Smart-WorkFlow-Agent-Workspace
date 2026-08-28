# 腾讯 IoT 最小连接证据规划验收

> 日期：2026-08-28
> 验收对象：`tencent-iot-step-demo-alignment-execution.md`
> 所属正式功能：`minimal-business-closure`
> 本轮结论：`FAILED`

## 已锁定通过

- `productId + deviceName` 从两类 Util 传入 `DeviceControlProvider`。
- `EV_ONLINE` 回调解析后进入对应设备的 `flushDeviceCommands` 补发入口。
- 延迟生效和在线确认两类 Util 均通过 Provider 接口调用，不是 Util 内部固定模拟成功。
- 审批设备事件在审批事务提交后处理，设备调用异常不回滚已提交审批。
- Demo 对齐项继续锁定：GET `Echostr`、JSON/Base64 Payload、产品字段兼容、Fastjson2 和 SDK 默认超时。
- 当前阶段不要求腾讯账号、真实设备、真实云端响应或完整测试。

以上内容后续禁止重复实现和重复验证。

## 未通过缺口

### G1：腾讯模式仍会回退 Mock

回执给出的选择逻辑是：只有 `providerMode=tencent` 且凭证齐全时使用腾讯 Provider，否则使用 Mock。

这意味着生产明确配置为腾讯模式但凭证缺失时会进入 Mock，与方向中“生产腾讯模式不得静默回退模拟成功”直接冲突。回执中“不会在运行中切换”的说明不能消除启动时已经回退 Mock 的事实。

通过条件：只有显式 `providerMode=mock` 才允许创建 Mock；显式腾讯模式缺少凭证时必须明确失败或禁用，不能返回模拟成功。

### G2：腾讯失败结果尚不可见

回执只证明审批事务提交后，监听器捕获设备异常并写错误日志。没有证明对应命令记录被更新为失败或结果未知，也没有证明调用方可以查询该失败结果。

通过条件：审批保持已完成，同时关联设备命令保留可查询的失败/未知状态和脱敏错误；不能只有日志。

### G3：执行终态格式缺失

回执末尾没有合法的 `SWF_TERMINAL {JSON}` 结构化行，自然语言“未完成项说明”不能替代机器终态。

## 状态处理

- 正式功能 `minimal-business-closure` 总体保持未通过，不进入阶段三。
- 流程主链、Demo 对齐和本轮已锁定连接项不撤销。
- 下一次只修正并证明 G1、G2、G3，不运行完整测试，不重新提交已通过项。
