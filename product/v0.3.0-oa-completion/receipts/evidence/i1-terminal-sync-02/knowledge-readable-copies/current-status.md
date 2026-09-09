<!-- source: knowledge/current-status.md | collected: 2026-09-09 16:54:22 +0800 | sha256: 9808ff719560490deedc3c9ed2dec2676eaaa27d54014155f9de4f96d5596e5b -->
# 当前项目状态

> 唯一当前快照；截至/同步点：2026-09-09，P60 `v0.3.0-oa-completion`（0.3.0 OA 全功能收口，XL，P0）执行中：I1「组织与权限底座」**COMPLETED（待规划确认，2026-09-09）**——验收 04 PASSED（`planning-review-stage-i1-v0.3.0-oa-completion-04-passed.md`），终态同步方向（`direction-stage-i1-terminal-sync.md`）执行完成：knowledge/memory/product 指针同步、三个独立仓库 I1 变更提交推送并远端 SHA 回读。功能数 44、清单 ✅46/🟦22/⬜22、P 编号全部保持现状；I2 未开始。历史快照见 `knowledge/history/`。
> 冲突处理：本文件为当前功能状态、计数、活动功能、正式基线与唯一下一动作的权威来源。

## 当前快照

| 维度 | 当前值 |
|---|---|
| 业务功能状态 | `v0.3.0-oa-completion`（P60 0.3.0 OA 全功能收口）：**IN_PROGRESS**（2026-09-08；首次清单同步 PASSED；I1 COMPLETED（待规划确认）、终态同步完成待规划复核；I2 未开始） |
| 上一完成功能 | `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：**功能状态 COMPLETED（规划已确认，2026-09-08）**（阶段三最终复核 `planning-final-review-terminal-sync-p21-iot-02-passed.md` **PASSED**），第 44 个正式功能 |
| 已完成功能数 | **44** |
| 功能清单 | 10 模块、55 功能、90 明细；**✅46 / 🟦22 / ⬜22**（46+22+22=90）；另登记 **ADV 高级能力规划项 8 模块、64 条（ADV-M11—ADV-M18）**——未纳入 0.3.0 验收、不计入 90 明细 ✅/🟦/⬜ 统计、不并入已完成功能数（P60 首次清单同步 2026-09-08） |
| 后端正式基线 | **12 个模块汇总，1182 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS**（来源 `product/p21-iot-device-access/receipts/completion-p21-iot-08.md` 等锁定证据） |
| 前端正式基线 | **Test Files 124 passed + 1 skipped；Tests 1168 passed + 3 skipped**；typecheck/lint/test/build exit 0 |
| 迁移基线 | Flyway **H2 V67（67 migrations）/ PostgreSQL V67（66 migrations）**（P60 I1 V67 一条为加列/回填/种子；正式基线记载以最近一次规划验收快照为准，V66 已被 P21 iot 迁移占用） |
| 产品行为基线 | Owner Broker 真实双向 MQTT；19 个原子工作项全部 COMPLETED；最终 r3 固定输入 16/16 哈希通过；browser_status=`OPERABLE`；Validator exit=0 |
| 验证基线变更集合 | Server/Web/Flyway/产品行为四组（见上）；不得沿用 v0.0.2-oa 的 1156/V58 旧基线或最后单模块 43 tests 计数 |
| P 编号 | **P21 已核销/完成（2026-09-08）**（只核销本正式方向范围）；**P2、P4 开放、部分实现未核销**；P34/P35/P37/P38/P39 部分实现未核销；其余已核销项不变。审计基准 P 池 57 行、唯一 56 编号（P48 总表/明细双入口同值）；I 索引 54 条、区间 I1—I55 缺 I27，本轮不增删（**I14 已满足/关闭（2026-09-08）**；I38/I39/I40/I45 保持开放） |
| 变更类型记录 | 本次同步为 P60 v0.3.0-oa-completion 首次功能清单同步（执行进入登记）：功能数 44、90 明细 ✅46/🟦22/⬜22 全部保持不变；正式工程功能清单新增 ADV-M11—ADV-M18 高级能力规划项 8 模块/64 条（未纳入 0.3.0 验收、不计入统计）；P21 终态文字落实为规划已确认（规划最终复核 02 PASSED） |
| 当前活动正式功能 | `v0.3.0-oa-completion`（P60，XL）：IN_PROGRESS（I1 COMPLETED 待规划确认，终态同步完成） |
| 当前活动交付任务 | 无独立交付任务（P60 六阶段按方向排期推进） |
| 最近审查 | `product/p21-iot-device-access/receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md`（P21 阶段三最终复核 PASSED）\| 历史：`planning-review-p21-iot-08-passed.md`（P21 A1—A8 功能级 PASSED）、`planning-review-v0.0.2-oa-06-passed.md`（v0.0.2-oa A1—A8 功能级 PASSED）、`planning-review-p4-09-passed.md`（P4 子集功能级 PASSED） |

## 终态与方向归档事实（唯一口径）

- `v0.3.0-oa-completion`（P60 0.3.0 OA 全功能收口）：方向 **READY（2026-09-08）→ IN_PROGRESS（2026-09-08）**；唯一执行入口 `product/v0.3.0-oa-completion/ready/direction-v0.3.0-oa-completion.md`；规划定义 `ready/advanced-capability-feature-checklist.md`（8 模块/64 条 ADV 规划项，未纳入 0.3.0 验收）；首次清单同步 PASSED（`receipts/checklist-sync-v0.3.0-oa-completion-02.md` 验收记录）；**I1 首轮回执 01 已判 VERIFYING（`receipts/planning-review-stage-i1-v0.3.0-oa-completion-01.md`，G1—G7）；二轮验收 `planning-review-stage-i1-v0.3.0-oa-completion-02.md`（G4/G6 PASSED 锁定，剩 G1b/G2b/G3b/G5b/G7b）+ 一级补充提示；I1 终态同步回执 `receipts/terminal-sync-stage-i1-v0.3.0-oa-completion-01.md`（TERMINAL_SYNC_SUBMITTED，待规划复核）；阶段状态 **COMPLETED（待规划确认，2026-09-09）**（验收：`receipts/planning-review-stage-i1-v0.3.0-oa-completion-04-passed.md`）**：迁移链 V65→**V67**（H2 67 条/PG 66 条）、用户/角色/部门/岗位治理+权限即时收敛+部门负责人与岗位维度+DEPT_LEADER/POST/DEPT_POST 流程权威解析+参与人展示名冻结+发起人校验；门禁重跑 Server 1223/0/0/0、Web 四门禁全绿；I2—I6 未启动。
- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：功能状态 **COMPLETED（规划已确认，2026-09-08）**（阶段三最终复核 `product/p21-iot-device-access/receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md` **PASSED**）；主方向与阶段三方向均已归档 `product/p21-iot-device-access/passed/`。任务登记：`knowledge/features/p21-iot-device-access.md`。
- p21-iot-device-access 交付范围：原生 MQTT 与腾讯 IoT 双通道配置（F01）、连接管理（F01-03）、设备维护（F02-01）、状态监控（F02-02）、Topic 订阅/发布配置（F03）、数据上报（F04-03）、消息日志（F04-04）、规则编排（F05-01）；腾讯实网（真实账号/RequestId/物理设备）按 Owner 本轮免验，不写成实网已验证；M08-F04-01 按钮发送保持🟦、F04-02 定时发送保持⬜、F05-02 指令模板保持⬜。
- `v0.0.2-oa`（v0.0.2 OA 完善）：**COMPLETED（规划已确认，2026-09-07）**，第 **43** 个正式功能（历史点；最终复核裁决 `product/v0.0.2-oa/receipts/planning-final-review-terminal-sync-v0.0.2-oa-03-passed.md`）；P54/P55/P3 随其核销、P2/P4 开放部分实现未核销。登记 `knowledge/features/v0.0.2-oa.md`；方向归档 `product/v0.0.2-oa/passed/`。
- `p4-oa-personal-center-dual-dispatch`（P4 OA 本轮子集）：功能状态 **COMPLETED（规划已确认，2026-09-07）**（历史点；验收事件：功能级 PASSED，规划复验09），第 42 个正式功能；P4 总项开放、部分实现未核销。登记 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`。
- `p59-ch-apaas-project-update`：**COMPLETED（规划已确认，2026-09-05）**、P59 已核销（历史，登记 `knowledge/features/p59-ch-apaas-project-update.md`）。
- 更早历史终态与基线见 `knowledge/history/` 与 `knowledge/feature-reconciliation-index.md`。

## 当前唯一下一动作

**P60 v0.3.0-oa-completion：Planner 对 I1 终态同步回执（`product/v0.3.0-oa-completion/receipts/terminal-sync-stage-i1-v0.3.0-oa-completion-01.md`）进行终态复核并确认 I1 COMPLETED；确认后进入 I2「低代码表单收口」；验收通过后由规划下发 I2「低代码表单收口」独立执行入口。**（P60 不替代、不提前核销 P2/P4/P26/P31/P34/P35/P37/P38/P39 等既有开放编号。）

## 当前未关闭项入口

- 未关闭业务问题权威注册：`knowledge/known-issues.md`（54 条，I1—I55 区间缺 I27；I14 已满足/关闭）
- 正式功能明细与双向映射：`Smart-WorkFlow-Server/功能清单.md`（90 行业务明细＋文末 ADV 高级能力规划项 64 条）＋ `knowledge/feature-reconciliation-index.md`（90 明细/56 唯一 P/54 I/55 审计 product 目录；ADV 64 条为独立规划项，不并入审计集合）
- P60 方向与定义：`product/v0.3.0-oa-completion/`（ready/direction-*.md、ready/advanced-capability-feature-checklist.md、receipts/）
- p21-iot-device-access 交付追踪：`knowledge/features/p21-iot-device-access.md`；方向与回执：`product/p21-iot-device-access/`
- 历史状态与审计链：`knowledge/history/README.md`

## 新会话启动提示词

- 上轮完成：**P60 I1 终态同步**（验收 04 PASSED；同步方向 `ready/direction-stage-i1-terminal-sync.md` 执行：knowledge/memory/product 指针、三仓提交推送与远端 SHA 回读；回执 `receipts/terminal-sync-stage-i1-v0.3.0-oa-completion-01.md`，TERMINAL_SYNC_SUBMITTED 待规划复核）；此前首次清单同步 PASSED、P21 COMPLETED（规划已确认）
- 当前状态：**P60 v0.3.0-oa-completion 为当前活动正式功能（XL，IN_PROGRESS）**；I1 终态同步完成待规划复核；确认后进入 I2，I2 未开始
- 完成数：清单 **46 / 22 / 22**（90，业务明细零变化）＋ ADV 规划项 64 条（不计入）；正式功能数 **44**
- 正式基线（2026-09-08，p21-iot-device-access 验收快照）：Server 12 模块汇总 **1182 tests / 0 failures / 0 errors / 0 skipped（BUILD SUCCESS）**、Web **124 files passed + 1 skipped / 1168 tests passed + 3 skipped（typecheck/lint/test/build exit 0）**、Flyway **H2 V66（66）/PG V66（65）**、产品行为 Owner Broker 双向 MQTT/19 原子工作项 COMPLETED/r3 16/16 哈希/browser OPERABLE
- 当前唯一下一动作：**Planner 终态复核 I1 同步回执 01**（`receipts/terminal-sync-stage-i1-v0.3.0-oa-completion-01.md`）；通过后下发 I2「低代码表单收口」执行入口
- P 编号：P21 已核销（2026-09-08）；P2/P4 开放、部分实现未核销；P34/P35/P37/P38/P39 部分实现未核销；P60 版本统筹项（不替代既有编号）
- 功能追踪：`knowledge/features/v0.3.0-oa-completion.md`；映射索引 `knowledge/feature-reconciliation-index.md`
- 未完成边界：P2 其余（计算公式/外部数据源/表单删除/列表配置持久化）；P4 候选（转办/委托/加签/撤回、流程版本/挂起激活）；M08-F04-01 按钮发送 🟦、F04-02 定时发送 ⬜、F05-02 指令模板 ⬜；P34/P35/P37/P38/P39 部分实现未核销；腾讯实网（真实账号/物理设备）按 Owner 免验未做；非零租户登录无受支持入口为认证产品边界；64 条 ADV 高级能力全部 ⬜ 规划登记（未探索未验收，实施需后续独立方向）
