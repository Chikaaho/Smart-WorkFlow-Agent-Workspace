# minimal-business-closure（Owner 最小业务闭环）

> 正式功能；Owner 最高优先级。流程主链子方向与腾讯 IoT 子方向均已归档 `product/minimal-business-closure/passed/`。
> 状态：功能级 **PASSED**（2026-08-28，规划最终验收）→ 阶段三终态落值 **COMPLETED（待规划终态复核）**。

## 功能目标

从组织与权限准备开始，打通「创建用户、登录、修改密码、分配角色和部门、管理表单、管理流程、发起审批、完成流转、审批结果驱动设备控制」的最小真实业务链路；腾讯 IoT 以 Owner 提供的 Demo 完成代码对接。

## 交付范围（已锁定，证据见下）

- 用户与权限：创建用户、登录、修改密码（`POST /auth/password`）、分配角色/部门，权限在真实请求链生效。
- 表单与流程：表单 CRUD+发布建宽表、流程定义 CRUD+`PUT graph`+发布、表单绑定发布时自动落启用绑定、发起生成 Flowable 实例、待办审批流转至 APPROVED、发起人可回查。
- 设备控制：`IotDeviceFacade` 跨模块门面；审批 AFTER_COMMIT 触发设备命令；设备异常仅保存命令 FAILED（脱敏 lastError），审批状态不倒退（R2 原子断言）。
- 腾讯 IoT（Demo 对齐口径）：腾讯 Provider（SDK，endpoint `iotexplorer.tencentcloudapi.com`，SDK 默认超时）、`productId+deviceName` 设备身份、延迟入队（QUEUED）+上线补发 Hook、在线确认类语义、GET `Echostr`/JSON+Base64 Payload/`EV_ONLINE`/Fastjson2、缺凭证抛 `IllegalStateException` 且 Mock 构造严格为零（R1）、生产腾讯模式无 Mock 静默回退。

## 验收与证据链

- 最终验收：`receipts/planning-final-review-minimal-business-closure-20260828.md`（PASSED）。
- 行为证据：`receipts/behavior-evidence-20260828.md`（37 步真实 HTTP 链）、`receipts/execution-receipt-20260828.md`、`receipts/test-receipt-20260828.md`。
- 腾讯补证：`receipts/tencent-iot-g1g2-focused-evidence-20260828.md`、`receipts/tencent-iot-r1r2r3-focused-evidence-20260828.md`（Mock 零创建/审批不倒退/Validator exit=0）。

## 阶段三终态（2026-08-28 落值）

- 已完成功能数 34→**35**；清单 **✅31 / 🟦25 / ⬜34**（M08-F01-02/F02-01/F02-02/F04-01/F04-04 升 🟦 部分完成，无任何 M08 项升 ✅）。
- 基线：后端 915/0/0/0（agent 346，不变）；前端 **109 files / 1050 tests**；Flyway **H2 V41 / PostgreSQL V40**（V41 仅 H2 专用，分别记录）。
- P21 部分关闭未核销；I14 部分关闭。

## 边界（未完成，不得写为已完成）

真实腾讯账号与真实云端请求、物理设备收发现场联调、原生 MQTT 接入路径、完整设备管理（修改/删除/分组、心跳/最后上报、上行记录、定时发送、规则编排）。
