# p21-iot-device-access — P21 IoT 设备接入、受控脚本与流程联动

> 本文件为该交付的功能追踪登记；主方向与阶段三终态同步方向均已归档 `product/p21-iot-device-access/passed/`。历史方向与回执见 `product/p21-iot-device-access/`。

| 字段 | 值 |
|---|---|
| 功能标识/名称 | p21-iot-device-access / P21 IoT 设备接入、受控脚本与流程联动 |
| 功能状态 | **COMPLETED（规划已确认，2026-09-08）**；验收事件：功能级 PASSED（2026-09-08，规划验收08 `planning-review-p21-iot-08-passed.md`，A1—A8 及 L1—L39 全部通过并锁定）；阶段三最终复核 **PASSED**（2026-09-08，`planning-final-review-terminal-sync-p21-iot-02-passed.md`，TS1/TS2 全部通过） |
| 完成日期 | 2026-09-08 |
| 计数 | 第 **44** 个正式业务功能（43＋本轮 1）；清单 **✅46 / 🟦22 / ⬜22**（90；M08 十行 🟦/⬜→✅，其余 80 行零变化） |
| P 编号 | **P21 已核销/完成（2026-09-08）**（只核销本正式方向范围）；**I14 已满足/关闭（2026-09-08）** |
| Server 正式基线 | **12 个模块汇总，1182 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS**（`product/p21-iot-device-access/receipts/completion-p21-iot-08.md` 等锁定证据） |
| Web 正式基线 | **124 files passed + 1 skipped / 1168 tests passed + 3 skipped**；typecheck/lint/test/build exit 0 |
| 迁移正式基线 | Flyway **H2 V66（66 migrations）/ PostgreSQL V66（65 migrations）** |
| 产品行为基线 | Owner Broker 真实双向 MQTT；19 个原子工作项全部 COMPLETED；最终 r3 固定输入 16/16 哈希通过；browser_status=`OPERABLE`；Validator exit=0 |
| 主方向归档 | `product/p21-iot-device-access/passed/direction-p21-iot-device-access.md` |
| 关键回执/证据 | `receipts/completion-p21-iot-01..08.md`；`receipts/planning-review-p21-iot-01..07.md`、`planning-review-p21-iot-08-passed.md`；`receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md`；`receipts/evidence/` |

## 交付范围（A1—A8，全部 PASSED 并锁定）

- **F01 接入配置**：原生 MQTT 配置（Broker/ClientId/口令/SSL 等）与腾讯 IoT 配置（ProductId/DeviceName/DeviceSecret/Region 等）双通道；连接管理（连接/断开、状态监控、断线自动重连）。
- **F02 设备管理**：设备/产品新增、修改、删除/注销、查询、分组；设备生命周期（未激活/离线/在线/禁用）与连接状态分离；认证信息安全维护、轮换与脱敏展示。
- **F03 Topic 管理**：自定义 Topic 订阅/取消订阅（通配符与 QoS）；发布 Topic 与 Payload 模板；消息方向/模板变量/QoS/retain/物模型映射/订阅恢复/去重/错误记录。
- **F04 消息控制**：数据上报接收、解析、存储与展示；上行/下行消息日志记录与查询；按钮发送保持🟦（已交付命令下发/流程触发/受控重试，不扩称任意 Payload 独立手动按钮完整能力）；定时发送保持⬜。
- **F05 硬件编排**：场景联动规则（条件触发动作：A 上报触发 B 下发），规则新增/修改/删除/启停；指令模板保持⬜。
- **受控脚本与流程联动**：JavaScript/Java 双语言受控脚本（统一 `fun_publish`/`fun_subscribe`/属性读写/事件写入/行为调用/流程发起），草稿/校验/试运行/发布/版本/停用/回滚；流程选择设备来源＋功能＋参数映射＋触发时机＋失败策略；事件/阈值规则幂等发起流程；每次触发唯一命令记录并关联流程实例；权限/脱敏/审计全链。

## 边界与剩余（保持开放）

- **M08 模块**：部分完成（10✅/1🟦/2⬜），不得因 P21 核销把整个 M08 写为全部完成。
- M08-F04-01 按钮发送：保持 🟦（已交付命令下发、流程触发和受控重试，不扩称为任意 Payload 的独立手动按钮完整能力）。
- M08-F04-02 定时发送：保持 ⬜（Cron 定时发送不在 P21 本轮方向）。
- M08-F05-02 指令模板：保持 ⬜（Topic/规则/流程参数映射不扩称为独立指令模板管理）。
- 腾讯实网边界：真实腾讯账号、RequestId 与物理设备按 Owner 本轮免验，不写成实网已验证；具备账号与设备条件后另行下发联调专项方向；账号口令禁止落盘、脱敏展示。
- 非目标：OTA、规则引擎、时序数据分析、地图、告警中心、数字孪生可视化、海量设备压测不承诺一次覆盖。
