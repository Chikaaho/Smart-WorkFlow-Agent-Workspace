# Owner 正式功能状态纠正

> 日期：2026-08-28
> Owner 明确口径：`minimal-business-closure` 是正式功能；腾讯 IoT 是该正式功能的一部分
> 当前总体状态：`IN_PROGRESS`

## 纠正结论

此前 `planning-final-review-20260828.md` 将流程主链、审批和模拟设备链路判为功能级 `PASSED`。Owner 后续明确：最小业务闭环是一个完整正式功能，腾讯 IoT 接入属于其中不可拆出的组成部分。

因此，原 `PASSED` 只保留为流程主链与模拟设备子集的锁定验收结果，不再代表正式功能总体通过。正式功能在腾讯 IoT Demo 对接通过前保持 `IN_PROGRESS`，不进入阶段三、不写 `COMPLETED`、不增加正式功能数、不核销总体需求。

## 当前唯一剩余范围

- 已锁定通过且禁止重复执行：用户、登录、密码、角色、部门、表单、流程、发起、审批流转以及模拟设备链路。
- 当前唯一待执行：`../ready/direction-tencent-iot-device-control.md`。
- 腾讯 IoT 按 Owner 提供的三个 Demo 完成代码接入；不要求腾讯账号、真实云端联调或完整测试。
- 腾讯 IoT 子方向验收通过后，再对 `minimal-business-closure` 正式功能整体作最终验收；只有总体 `PASSED` 后才能下发阶段三终态同步方向。

## 目录口径

- 流程先行子方向归档于 `../passed/direction-process-first.md`，表示该子集已通过，不表示总体功能完成。
- 腾讯 IoT 当前方向位于 `../ready/direction-tencent-iot-device-control.md`，是唯一执行入口。
- 原独立 `product/tencent-iot-device-control/` 不再承载活动方向或回执，避免被误识别为第二个正式功能。
