<!-- source: knowledge/session-handoff.md | collected: 2026-09-09 17:59:03 +0800 | sha256: 839a7696640798784a415705b4e85bd164b54dcb75a9ebcb04d42672e902b9fa -->
# 会话交接（session-handoff）— 当前压缩版

> 同步点：2026-09-09，P60 `v0.3.0-oa-completion`（0.3.0 OA 全功能收口，XL，P0）执行中：I1「组织与权限底座」已 **COMPLETED（待规划确认，2026-09-09）**（验收 04 PASSED），终态同步方向（`ready/direction-stage-i1-terminal-sync.md`）执行完成，三个独立仓库 I1 变更已提交推送并远端 SHA 回读。更早历史见 `knowledge/history/README.md`。

## 当前唯一值（v0.3.0-oa-completion 执行入口）

| 字段 | 值 |
|---|---|
| 当前活动正式功能 | `v0.3.0-oa-completion`（P60 0.3.0 OA 全功能收口）：**IN_PROGRESS**；I1「组织与权限底座」**COMPLETED（待规划确认，2026-09-09）**，终态同步完成；I2 未开始 |
| 正式业务功能数 | **44**（p21-iot-device-access 为第 44 个正式功能，COMPLETED（规划已确认，2026-09-08）） |
| 清单规模 | 10 模块、55 功能、90 明细（业务）＋ **ADV 高级能力规划项 8 模块、64 条**（不计入统计） |
| 清单状态计数 | **✅46 / 🟦22 / ⬜22**（46+22+22=90，业务明细零变化；ADV 64 条统一 ⬜ 规划登记/待现状核实） |
| P 编号 | **P21 已核销/完成（2026-09-08）**；**P2/P4 开放、部分实现未核销**；P34/P35/P37/P38/P39 部分实现未核销；P60 版本统筹项不替代既有编号；I 集合 54 条不增删（**I14 已满足/关闭**；I38/I39/I40/I45 保持开放） |
| Server 基线 | **12 个模块汇总，1223 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS**（I1 终态候选锁定） |
| Web 基线 | 126 files passed + 1 skipped / 1176 tests passed + 3 skipped；typecheck/lint/test/build exit 0（I1 终态候选锁定） |
| Flyway | H2 V66（66）/ PG V66（65） |
| 产品行为基线 | Owner Broker 真实双向 MQTT；19 个原子工作项全部 COMPLETED；最终 r3 固定输入 16/16 哈希通过；browser_status=`OPERABLE`；Validator exit=0 |
| 当前任务状态 | `v0.3.0-oa-completion`：**IN_PROGRESS**；I1 **COMPLETED（待规划确认，2026-09-09）**；终态同步复核 02 VERIFYING（T4/T7 锁定，TS-K1/TS-G1 待核销），当前入口=一级提示 `planning-execution-prompt-v0.3.0-oa-completion-i1-terminal-sync-01.md`，下一动作=Planner 复核回执 03 |
| 活动业务实现功能 | `v0.3.0-oa-completion`（P60） |
| 唯一下一动作 | **Planner 终态复核 I1 同步回执 03（`receipts/terminal-sync-stage-i1-v0.3.0-oa-completion-03.md`）并确认 I1 COMPLETED**；确认后进入 I2「低代码表单收口」 |

## v0.3.0-oa-completion 关键事实

- 唯一执行入口：`product/v0.3.0-oa-completion/ready/direction-v0.3.0-oa-completion.md`（六次迭代：I1 组织与权限底座、I2 低代码表单收口、I3 人工审批能力、I4 编排/流程运营/工作台、I5 第三方 SSO、I6 通知与版本收口）。
- 高级能力规划：`ready/advanced-capability-feature-checklist.md`（ADV-M11—ADV-M18、8 模块/64 条、统一 ⬜ 规划登记/待现状核实）；已映射进 `Smart-WorkFlow-Server/功能清单.md` 文末 ADV 章节，**未纳入 0.3.0 验收**。
- 统筹但不提前核销：P2/P4/P26/P31/P34/P35/P37/P38/P39 等既有开放 OA 范围。
- 六阶段外部依赖：四个 SSO Provider 测试应用/回调域/凭据，以及短信/飞书/钉钉/企业微信/小程序/邮件渠道可控测试配置（凭据只进安全配置，不进仓库/截图/日志/回执正文）。

## p21-iot-device-access 关键事实（已完成，规划已确认 2026-09-08）

- 阶段三最终复核 `planning-final-review-terminal-sync-p21-iot-02-passed.md` **PASSED**：功能状态 **COMPLETED（规划已确认，2026-09-08）**，第 44 个正式功能；主方向与阶段三方向均已归档 `product/p21-iot-device-access/passed/`。
- 交付范围：原生 MQTT（F01-01）、腾讯 IoT 配置（F01-02）、连接管理（F01-03）、设备维护（F02-01）、状态监控（F02-02）、Topic 订阅（F03-01）、Topic 发布配置（F03-02）、数据上报（F04-03）、消息日志（F04-04）、规则编排（F05-01）十项升✅；M08-F04-01 按钮发送保持🟦、F04-02 定时发送保持⬜、F05-02 指令模板保持⬜。
- 腾讯实网边界：真实腾讯账号、RequestId 与物理设备按 Owner 本轮免验，不写成实网已验证；账号口令继续禁止落盘。
- M08 模块：**部分完成**（10✅/1🟦/2⬜），不得因 P21 核销把整个 M08 写为全部完成。

## v0.0.2-oa 发布时点唯一事实（2026-09-07 已确认，历史）

- 规范地址：后端 `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-server.git`、前端 `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git`、工作区 `git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git`（产品 CH-aPaaS / PaaS）。
- 发布终态：Server `0.0.2` → `20fffc1ddec13ea665fc388f4243c6e063974883`；Web `0.0.2` → `0bf6e8925059e4c254328c5d1643ebd8c1a2943e`。两仓 Actions/Release 成功、服务器部署生效；工作区零 Git 发布动作，通用 `main` 未变。P59 发布时点 SHA（2026-09-04）见更早历史存档。
- 场景 3.1—3.3 仅原始记录，未实施（原文在 `todo/ch-apaas-project-update.md`，不改）。

## 固定文字口径（对账轮已锁定；M08 行已按 2026-09-08 p21-iot-device-access 交付更新，其余行仍有效）

| 明细/需求 | 已交付子集 | 剩余范围 |
|---|---|---|
| M04-F01-03/P34 | ALL/ANY/RATIO 会签结算、独立意见、取消语义 | 原明细完整规则（含一票否决）覆盖待确认，未完成整体核销 |
| M04-F07-01/P35 | 受控条件表达式、条件分支 | 超时处理、自动审批/自动通过规则 |
| M06-F01-01/P37 | 站内信、统一渠道 SPI 及已验收扩展接缝 | 真实厂商渠道、配置开关及账号联调 |
| M06-F02-01/P38 | 可复用通用消息模板与变量渲染 | 按渠道配置内容与变量；沿用 P38，不新编号 |
| M06-F03-01/P39 | 内置审批事件、通知节点触发 | 用户可配置规则、订阅设置 |
| M04-F05-01/P4 | 四入口（我发起的/我的草稿/我的待办/我的已办）＋异步/P0 同步＋回查＋幂等＋v0.0.2-oa 流程中心双视角/抄送/催办（2026-09-07） | **明细完整描述已交付，M04-F05-01 ✅**；P4 总项仍开放未核销：转办/委托/加签/撤回、流程版本/挂起激活等候选 |
| M06-F04-01/P3 | 投递状态持久化、幂等＋v0.0.2-oa A6 发送记录/失败重发/关联日志（2026-09-07） | **明细已交付，M06-F04-01 ✅；P3 已核销**；I45 保持开放，不因 P3 核销关闭 |
| M08-F01-01/02/03、F02-01/02、F03-01/02、F04-03/04、F05-01/P21 | p21-iot-device-access：原生 MQTT 与腾讯 IoT 双通道、连接管理、设备维护、状态监控、Topic 订阅/发布、数据上报、消息日志、规则编排（2026-09-08） | **十项明细 ✅，P21 已核销**；F04-01 按钮发送 🟦、F04-02 定时发送 ⬜、F05-02 指令模板 ⬜；腾讯实网免验边界保留 |

## 任务指针

- v0.3.0-oa-completion（P60）：方向与规划定义 `product/v0.3.0-oa-completion/ready/`；首次清单同步回执 `product/v0.3.0-oa-completion/receipts/checklist-sync-v0.3.0-oa-completion-01.md`；任务登记 `knowledge/features/v0.3.0-oa-completion.md`（I1 业务验收 PASSED、终态待规划确认、I2—I6 未开始；最新复核=终态同步复核 03，当前唯一入口=`planning-execution-prompt-v0.3.0-oa-completion-i1-terminal-sync-02.md`，下一动作=Planner 复核回执 04）。
- p21-iot-device-access：主方向与阶段三方向均归档 `product/p21-iot-device-access/passed/`；最终裁决 `receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md`（COMPLETED 规划已确认，2026-09-08）；任务登记 `knowledge/features/p21-iot-device-access.md`。
- v0.0.2-oa：主方向与 A8 方向归档 `product/v0.0.2-oa/passed/`；任务登记 `knowledge/features/v0.0.2-oa.md`；COMPLETED（规划已确认，2026-09-08 复核确认）。
- P4：主方向与能力边界方向均归档 `product/p4-oa-personal-center-dual-dispatch/passed/`；最终裁决 `receipts/planning-final-review-terminal-sync-p4-02-passed.md`（COMPLETED 规划已确认，2026-09-07）；任务登记 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`。
- P59：主方向与终态同步方向均归档 `product/p59-ch-apaas-project-update/passed/`；任务登记 `knowledge/features/p59-ch-apaas-project-update.md`；最终裁决 `receipts/planning-final-review-p59-terminal-sync-02-passed.md`（COMPLETED 规划已确认，2026-09-05）。
- `knowledge-full-reconciliation`：**COMPLETED（已确认，2026-09-04）**（最终裁决 `receipts/planning-final-review-terminal-sync-02-passed.md`）；三方向均归档 `product/knowledge-full-reconciliation/passed/`。
- 映射索引：`knowledge/feature-reconciliation-index.md`（主索引）+ `feature-reconciliation-issues.md`（54 I 逐项）+ `feature-reconciliation-products.md`（55 目录逐项）；90 明细/56 唯一 P/54 I/55 product 目录双向映射；ADV 高级能力规划项 64 条为独立登记（不并入审计集合）。
- 必读入口：`knowledge/current-status.md`、`Smart-WorkFlow-Server/功能清单.md`、`knowledge/known-issues.md`、`todo/requirement-pool.md`、本交接
