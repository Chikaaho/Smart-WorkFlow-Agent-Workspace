# Owner 最小业务闭环正式功能最终验收

> 日期：2026-08-28
> 正式功能：`minimal-business-closure`
> 功能级结论：`PASSED`
> 阶段三：尚未完成，不代表 `COMPLETED`

## Owner 结论

Owner 明确要求的正式功能已经达到当前验收口径：用户与权限、表单、流程、发起、审批和设备控制形成最小业务闭环；腾讯 IoT 已按 Owner 提供的 Demo 完成软件对接。

当前没有腾讯账号和真实设备，真实腾讯云请求及物理设备收发保留为后续现场联调项。Owner 已明确本阶段不要求真实云端联调或完整测试，因此该边界不阻塞功能级通过。

## 已通过范围

- 创建用户、登录、修改密码、分配角色和部门。
- 创建、修改、删除表单和流程。
- 发起流程、生成待办、审批流转和结果回查。
- 审批结果触发设备命令，设备异常不回滚审批，命令失败结果可查询。
- 腾讯设备使用 `productId + deviceName`，两类 Util 接入 Provider。
- 离线命令入队，上线回调进入补发入口。
- 腾讯回调与客户端按 Demo 对齐，包含 GET `Echostr`、JSON/Base64 Payload、`EV_ONLINE`、字段兼容、Fastjson2 和 SDK 默认超时。
- 腾讯模式缺凭证明确失败，Mock 构造为零；只有显式 Mock 模式才使用 Mock。
- 设备失败后审批状态保持 `APPROVED`，关联命令为失败状态，错误信息脱敏。
- 最终补证回执使用合法 v2 `EXECUTION_SUBMITTED` 终态并实际通过公共 Validator。

## 证据链

- 流程与模拟设备行为：`behavior-evidence-20260828.md`、`execution-receipt-20260828.md`、`test-receipt-20260828.md`。
- 腾讯身份、队列、Util 与 Hook：`tencent-iot-step-1-device-identity-upgrade-execution.md`、`tencent-iot-step-demo-alignment-execution.md`。
- 腾讯最小连接补证：`tencent-iot-g1g2-focused-evidence-20260828.md`。
- 最终原子断言：`tencent-iot-r1r2r3-focused-evidence-20260828.md`。

## 状态处理

- 正式功能状态更新为 `PASSED`。
- 流程子方向和腾讯 IoT 子方向均归档至 `passed/`。
- 已通过范围全部锁定，不得在阶段三重复实现或测试。
- 不提前写 `COMPLETED`，不提前增加正式功能数、核销需求或晋级基线。
- 下一步先核实阶段三唯一终态值，再由规划角色下发独立终态同步方向。
