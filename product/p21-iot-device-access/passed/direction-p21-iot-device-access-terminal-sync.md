# P21 IoT 设备接入阶段三终态同步方向

2026-09-08；Planner；XL 功能的机械终态同步；状态 **COMPLETED（规划已确认，2026-09-08）**。前置裁决：`../receipts/planning-review-p21-iot-08-passed.md`，P21 A1—A8 功能级 `PASSED`。同步回执01的证据封装缺口已由回执02补齐，最终裁决：`../receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md`。

本方向只同步持久状态、清单、索引与交接，不修改业务/测试实现，不运行浏览器、Broker、API、数据库行为、编译、测试、构建、迁移或部署，不执行 Git 提交、推送或发布。执行角色不得重新计算或自行选择下列值。

## 一、唯一终态值清单

| 字段 | 唯一授权值 |
|---|---|
| 功能标识/名称 | `p21-iot-device-access` / P21 IoT 设备接入、受控脚本与流程联动 |
| 功能状态 | **`COMPLETED（规划已确认，2026-09-08）`** |
| 正式完成功能数 | **44**（43＋1，第44个正式功能） |
| 清单计数 | **✅46 / 🟦22 / ⬜22 = 90** |
| M08-F01-01 原生 MQTT 配置 | **⬜→✅** |
| M08-F01-02 腾讯 IoT 配置 | **🟦→✅**；既有腾讯配置与通用契约已交付，真实账号/RequestId/物理设备按 Owner 本轮免验，不写成实网已验证 |
| M08-F01-03 连接管理 | **⬜→✅** |
| M08-F02-01 设备维护 | **🟦→✅** |
| M08-F02-02 状态监控 | **🟦→✅** |
| M08-F03-01 Topic 订阅 | **⬜→✅** |
| M08-F03-02 Topic 发布配置 | **⬜→✅** |
| M08-F04-03 数据上报 | **⬜→✅** |
| M08-F04-04 消息日志 | **🟦→✅** |
| M08-F05-01 规则编排 | **⬜→✅** |
| M08-F04-01 按钮发送 | **保持🟦**；已交付命令下发、流程触发和受控重试，不扩称为任意 Payload 的独立手动按钮完整能力 |
| M08-F04-02 定时发送 | **保持⬜**；Cron 定时发送不在 P21 本轮方向 |
| M08-F05-02 指令模板 | **保持⬜**；Topic/规则/流程参数映射不扩称为独立指令模板管理 |
| 其余 77 个清单明细 | **全部保持原值** |
| P21 | **已核销/完成（2026-09-08）**；只核销本正式方向范围 |
| I14 | **已满足/关闭（2026-09-08）**；保留腾讯实网未验证边界，不再把 Owner 已免验事项登记为当前阻塞 |
| I 问题集合 | **54条，I1—I55 缺 I27，不增删编号**；只更新 I14 状态 |
| M08 模块 | **部分完成**；10✅/1🟦/2⬜，不得因 P21 核销把整个 M08 写为全部完成 |
| 活动功能 | **无** |
| 当前唯一下一动作 | **等待 Owner 选择下一需求** |
| 主方向目录 | `product/p21-iot-device-access/passed/direction-p21-iot-device-access.md` |
| 阶段三方向目录 | `product/p21-iot-device-access/passed/direction-p21-iot-device-access-terminal-sync.md` |

清单勾稽：当前 M08 为 0✅/5🟦/8⬜；本轮 4 行 🟦→✅、6 行 ⬜→✅，得到 M08 10✅/1🟦/2⬜。项目总计由 36/26/28 变为 **46/22/22**，三类合计保持 90。

## 二、唯一验证基线集合

| 范围 | 唯一基线 |
|---|---|
| Server | **12 个模块汇总，1182 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS** |
| Web | **124 files passed + 1 skipped / 1168 tests passed + 3 skipped；typecheck、lint、test、build exit=0** |
| Flyway | **H2 V66（66 migrations）/ PostgreSQL V66（65 migrations）** |
| 产品行为 | Owner Broker 真实双向 MQTT；19 个原子工作项全部 COMPLETED；最终 r3 固定输入 16/16 哈希通过；browser_status=`OPERABLE`；Validator exit=0 |

上述为本功能实际涉及的完整授权集合。不得把最后单模块 43 tests 登记为后端总数，不得沿用 v0.0.2-oa 的 1156/V58 旧基线，也不得重新运行已锁定验证。

## 三、必须同步的当前入口

Executor 按实际文件结构机械同步，至少包括：

1. `knowledge/current-status.md`、`knowledge/session-handoff.md`；
2. `knowledge/features/p21-iot-device-access.md`（新建正式功能记录）；
3. `knowledge/feature-reconciliation-index.md`、`knowledge/known-issues.md`；
4. `Smart-WorkFlow-Server/功能清单.md`；
5. `todo/requirement-pool.md`；
6. `memory/state.md`、`memory/features.md`、`memory/handoff.md`、`memory/README.md`、`memory/issues.md`，以及为清除旧当前入口确需同步的其他短记忆文件；
7. 当前终态机器契约及项目既有状态投影入口。

当前入口中清除这些过期口径：P21 仍为 VERIFYING/PASSED 待同步、review07/prompt06/completion08 为当前下一动作、L1—L39/H10d-R4 仍待处理、功能数43、清单36/26/28、I14仍部分关闭、当前活动功能为P21。历史回执、旧审查和历史时点原文保留。

## 四、memory 压缩门槛

同步后必须满足：每个短记忆文件 `<5KB`，`memory/` 短文件总量 `<20KB`；回执逐文件给出同步前后字节、保留摘要与移除的旧当前口径。完整证据留在 product/knowledge，不复制进 memory。

## 五、执行、回执与复核门禁

执行顺序：快照当前值 → knowledge-first 落唯一值 → 同步清单/索引/todo/memory → 全文检索旧当前口径 → 机械勾稽功能数、清单、P/I 与基线 → 统计 memory → 校验终态契约 → 追加回执。

提交前必须全部为是：

- [x] 当前入口统一为第44个正式功能、清单46/22/22，总数90？
- [x] 仅列明的10个 M08 明细升✅，F04-01保持🟦，F04-02/F05-02保持⬜，其余77行零变化？
- [x] P21已核销，I14已满足/关闭，M08仍为部分完成且I编号集合不变？
- [x] Server/Web/Flyway/产品行为四组基线与本方向逐字一致？
- [x] 活动功能为空，当前唯一下一动作是等待Owner选择下一需求？
- [x] 同步复核时主方向在passed、阶段三方向在ready；Planner通过后两者均归档passed？
- [x] memory单文件及总量均达标，回执包含当前真实体积？
- [x] 没有修改实现、重跑验证、改写历史、执行Git或泄露凭证？

执行回执：`product/p21-iot-device-access/receipts/terminal-sync-p21-iot-device-access-01.md`、补证回执 `terminal-sync-p21-iot-device-access-02.md`。Planner 最终复核02已通过，状态确认为 `COMPLETED（规划已确认，2026-09-08）`，本方向归档 `passed/`。
