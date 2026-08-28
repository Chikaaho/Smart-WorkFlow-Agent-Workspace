# 最小业务闭环阶段三终态值核实回执

> **探索结论**：`minimal-business-closure`（功能级 PASSED）阶段三同步所需的当前事实已全部核实；迁移基线、前端基线、清单计数注释、M08 模块说明、known-issues I14 与需求池 P21 共 6 处存在旧值残留必须在阶段三清除。功能数口径与 M08 明细晋级粒度存在无法唯一确定的项，已显式列出待规划裁决，未猜测。

## 一、事实矩阵（字段 / 当前值 / 建议目标值 / 依据 / 权威位置）

| 字段 | 当前值 | 建议目标值 | 变化依据 | 权威位置 |
|---|---|---|---|---|
| 业务功能状态 | 无进行中；最近完成 M05-F01-01 ✅COMPLETED | 最近完成 `minimal-business-closure`，✅COMPLETED（仅阶段三复核通过后写） | `planning-final-review-minimal-business-closure-20260828.md` 功能级 PASSED | `knowledge/current-status.md` 快照表 |
| 已完成功能数 | 34 | 35（待规划确认口径，见 §四-1） | 该功能为独立正式功能并通过验收 | 同上 |
| 清单计数（明细） | ✅31 / 🟦20 / ⬜39（表体实数，2026-08-28 逐行复核=90 行吻合） | ✅31 / 🟦20+N / ⬜39−N（N=M08 晋级数，待规划裁决，见 §四-2） | M08 交付了部分实现但清单仍全 ⬜ | `Smart-WorkFlow/功能清单.md` M08 表 + 行 27 注释 |
| 后端正式基线 | 915 / Failures 0 / Errors 0 / Skipped 0；agent 346 | 不变（915/0/0/0；agent 346） | `execution-receipt-20260828.md` §4：TOTAL=915 FAIL=0 ERR=0，无新增用例 | `knowledge/current-status.md` |
| 前端正式基线 | 108 spec files / 1039 tests | **109 files / 1050 tests** | `execution-receipt-20260828.md` §4：`pnpm test` 109 文件/1050 用例全过 | 同上 |
| 迁移基线 | Flyway V39；H2/PG 均 39 | **H2 链 41（V40 IoT + V41 form CLOB）；PG 链 40（V41 仅 H2 专用）**——不得写"均 41" | `execution-receipt-20260828.md` §2 末三行：V40 双方言、V41 仅 h2 目录、FlywayFullChainH2Test 41 版全过 | `sw-basic-iot/.../db/migration/iot/{h2,postgresql}/V40__`、`sw-biz-form-biz/.../db/migration/form/h2/V41__` |
| 活动功能 | 无（快照仍写 M05） | 无 | PASSED 功能进入阶段三收尾 | `knowledge/current-status.md` |
| 当前唯一下一动作 | 规划层基于候选池选择下一功能 | 阶段三期间=执行终态同步方向；复核通过后=规划比较并选择下一唯一功能 | system.md §3.4 状态表 | 同上 |
| 主方向目录 | `product/minimal-business-closure/ready/`（旧） | `passed/`（两个子方向均已归档 ✓ 已就位） | 目录实测已归档 | `product/minimal-business-closure/passed/` |
| 终态同步方向目录 | — | 阶段三期间 `ready/`；规划终态复核通过后移 `passed/` | system.md §3.4/§5.5 | 规划下发时确定 |

## 二、M08 对应明细与晋级候选（依据 execution/behavior 回执实际交付）

已交付（真实行为证据）：设备注册/状态查询/命令下发/命令列表/结果回写（模拟设备）、审批自动下发 power_on（approvalBizId=实例 ID）、腾讯 Provider（SDK ControlDeviceData/CallDeviceAction、endpoint iotexplorer）、`productId+deviceName` 身份、QUEUED 队列+上线补发 Hook、Echostr/EV_ONLINE/Fastjson2/Demo 对齐、缺凭证失败+Mock 零回退。

| 明细 ID | 清单描述要点 | 交付覆盖 | 晋级建议 |
|---|---|---|---|
| M08-F01-02 腾讯IoT配置 | **每台硬件**自定义参数含 DeviceSecret | 全局 Provider 配置（SecretId/Key/Region/endpoint）；非每设备、无 DeviceSecret 管理 | 🟦（部分） |
| M08-F02-01 设备维护 | 增删改查+分组 | 仅注册+查询 | 🟦（部分） |
| M08-F02-02 状态监控 | 在线/离线、心跳、最后上报 | 在线状态查询（模拟 ONLINE/腾讯状态查询）；无心跳/最后上报 | 🟦（部分） |
| M08-F04-01 按钮发送 | 手动下发+自定义 Payload | 后端手动下发+命令 key 已贯通；**前端按钮未做**（merged=min 口径） | 🟦（部分） |
| M08-F04-04 消息日志 | 上行+下行记录查询 | 仅下行命令列表 | 🟦（部分） |
| M08-F01-03 / F04-02 / F04-03 / F05-01 / F05-02 等 | 连接管理/定时/数据上报/编排 | 无对应交付 | ⬜ 不动 |

即 N 候选=5（全部 ⬜→🟦，无一行可升 ✅）；**是否晋级及 N 值由规划裁决**，本回执不代决。

## 三、必须清除的旧状态残留（6 处）

1. `Smart-WorkFlow/功能清单.md` 行 27 终态注释 `✅ 30 / 🟦 21`——落后于表体实数 31/20，需随本次计数一并重写（历史决策注记可保留）。
2. 同文件行 38 `当前焦点：sw-biz-system 最小登录切片`——远古残留，需删除或更新。
3. 同文件 M08 模块说明 `⚠ 腾讯 IoT 接入路径待补全`、M05 说明 `⚠ 当前无代码落地`（M05 部分已过时）——按阶段三口径更新。
4. `knowledge/current-status.md` 全文仍是 2026-08-27 M05 快照（状态/最近审查/下一动作/迁移基线/前端基线 5 处旧值）——阶段三唯一快照整体覆盖，历史移 `knowledge/history/`。
5. `knowledge/known-issues.md` I14（M08 腾讯接入路径待补全）——状态需改为部分关闭：Demo 对接与最小链已交付，剩余为真实账号/物理设备现场联调。
6. `todo/requirement-pool.md` P21（M08 仅骨架，待产品设计）——需更新为"最小腾讯接入已交付；剩余边界=真实腾讯账号+物理设备现场联调、原生 MQTT、完整设备管理"；建议同时登记现场联调新 P 编号。

memory/ 三文件（state/handoff/features）已是 PASSED+只读核实口径，无残留；阶段三同步时由规划下发唯一终态值后机械覆盖。

## 四、无法唯一确定、必须由规划裁决的冲突项

1. **已完成功能数口径**：历史计数 34 为交付正式功能累计账（与清单 ✅明细 31、✅功能级 14 均不相等），无法从文件唯一推导 minimal-business-closure 是否 +1（→35）。规划需在终态值清单中显式给定单值。
2. **M08 明细晋级粒度**：§二建议 5 行 ⬜→🟦；若规划裁定"阶段三只动状态文件不动清单"，则 N=0 且清单计数不变。两口径均自洽，需唯一裁决。
3. **迁移基线表达**：H2=41 与 PG=40 首次不一致，终态值清单需分别给出（或规定只记 H2 全链口径 V41 并注明 PG=40）。
4. **新 P 编号**：现场联调项是否新登记 P 编号及编号值，由规划决定。

## 五、检查范围与未确认事项

- 实际读取：`knowledge/current-status.md`、`Smart-WorkFlow/功能清单.md`（90 行逐行计数）、`todo/requirement-pool.md`、`product/minimal-business-closure/passed/` 两方向、`receipts/planning-final-review-*.md`、`receipts/execution-receipt-20260828.md`、`memory/state.md`/`handoff.md`/`features.md`、`knowledge/known-issues.md`（grep I14/M08）。
- 未逐字通读 `knowledge/session-handoff.md`（57KB）；候选池排序以 requirement-pool §二为准，若规划需要 handoff 候选3 最新排序需另行核实。
- 未运行任何编译/测试命令；未修改任何文件。
