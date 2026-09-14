# 会话交接（session-handoff）— 当前压缩版

> 同步点：2026-09-14，P60 `v0.1.0-oa-completion`（0.1.0 OA 全功能收口，XL，P0）执行中：目标版本已由 Owner 确认统一登记为 `0.1.0`（更正回执 `product/v0.1.0-oa-completion/receipts/planning-registration-correction-v0.1.0-01.md`）；I1「组织与权限底座」**COMPLETED（规划已确认，2026-09-09）**；I2「低代码表单收口」**COMPLETED（规划已确认，2026-09-10）**；I3「人工审批与自研流程设计器」**COMPLETED（规划已确认，2026-09-12）**；I4「编排、流程运营与工作台」**COMPLETED（规划已确认，2026-09-13）**（三个方向均已归档 `passed/`）；**I5「租户安全与三方 SSO」COMPLETED（待规划确认，2026-09-14）**（功能级验收 `planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md` PASSED；三 Provider 真实成功链=Owner 延期免验/未验证；主方向已归档 `passed/`），当前唯一入口 `product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md`（终态同步回执 01 已提交，等待 Planner 终态复核）；I6 未开始。更早历史见 `knowledge/history/README.md`。

## 当前唯一值（v0.1.0-oa-completion 执行入口）

| 字段 | 值 |
|---|---|
| 当前活动正式功能 | `v0.1.0-oa-completion`（P60 0.1.0 OA 全功能收口）：**IN_PROGRESS**；I1「组织与权限底座」**COMPLETED（规划已确认，2026-09-09）**；I2「低代码表单收口」**COMPLETED（规划已确认，2026-09-10）**；I3「人工审批与自研流程设计器」**COMPLETED（规划已确认，2026-09-12）**；I4「编排、流程运营与工作台」**COMPLETED（规划已确认，2026-09-13）**；**I5「租户安全与三方 SSO」COMPLETED（待规划确认，2026-09-14）**；I6 未开始 |
| 正式业务功能数 | **44**（p21-iot-device-access 为第 44 个正式功能，COMPLETED（规划已确认，2026-09-08）） |
| 清单规模 | 10 模块、55 功能、90 明细（业务）＋ **ADV 高级能力规划项 8 模块、64 条**（不计入统计） |
| 清单状态计数 | **✅46 / 🟦22 / ⬜22**（46+22+22=90，业务明细零变化；ADV 64 条统一 ⬜ 规划登记/待现状核实） |
| P 编号 | **P21 已核销/完成（2026-09-08）**；**P2/P4 开放、部分实现未核销**；P34/P35/P37/P38/P39 部分实现未核销；P60 版本统筹项不替代既有编号；I 集合 54 条不增删（**I14 已满足/关闭**；I38/I39/I40/I45 保持开放） |
| Server 基线 | I5 锁定（迭代 02—11 门禁）：受影响八模块 **766 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（common 18、security 17、system-biz 290、form-biz 132、bpm-engine 50、bpm-process 205、openapi 6、bootstrap 48；含 FlywayFullChain H2 86 / PostgreSQL 85 终点 V86；`I5PgTenantBehaviorBootTest`／`I5SsoBindingSessionBootTest`／`I5ProdProfileSecurityBootTest` 真实 PG·H2·Redis 行为链）；后续飞书修复聚焦 `SsoAuthServiceTest` **22/0**、system-biz **295/0/0/0**。最终候选工作树 `486b1116eb6016024c8e1e4a00b50244af2f3cb5`（`git write-tree` 临时索引含未跟踪文件），HEAD `4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`（本地 3 个 I5 提交：`aaafd74`/`5e976b8`/`4d98b67`，`origin/develop` 落后 3，**未推送**） |
| Web 基线 | I5 锁定（iteration-10/11 零修改）：typecheck/lint/test/build 四门 exit 0，128 个测试文件、**1183 passed + 3 skipped**；Web HEAD `5788ead33c4347214a350d124331237e85068bdf`；I5 新增 SsoReturnPage/SsoBindPage/AccountBindings 与权限 fail-closed 沿用 I5 执行回执 01 锁定结果 |
| Flyway | H2/PostgreSQL 同一迁移身份，终点 **V86**（I5 新增 V83 formKey 租户唯一、V84 SSO 身份四表、V85/V86 Provider 应用归属唯一（`sw-biz-system` system 迁移目录）；devseed H2 V900—V903 仅 dev 装载；`sw-bootstrap` FlywayFullChain H2 86 条 / PG 85 条） |
| 产品行为基线 | I5 G1—G9 真实行为/HTTP/持久化/浏览器证据见 `receipts/evidence/i5-02/`—`i5-11/`（非零租户 OA 全链同一对象链 tenantId 勾稽、生产匿名矩阵、SSO state 重放/错配/白名单拒绝、绑定/解绑与冲突拒绝、同秒 jti 撤销隔离、审计零残留与秘密扫描 NO-HITS、Owner 自验交接包回读与逐文件 manifest）；I1—I4 行为证据继续锁定。**三 Provider 真实成功链=Owner 延期免验/未验证** |
| 当前任务状态 | `v0.1.0-oa-completion`：**IN_PROGRESS**；I1—I4 **COMPLETED（规划已确认）**；**I5 COMPLETED（待规划确认，2026-09-14）**（终态同步回执 `receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`，`TERMINAL_SYNC_SUBMITTED`）；I6 未开始 |
| 活动业务实现功能 | 无（I5 已提交终态同步待规划复核；I6 通知与版本收口未开始，需 Planner 另行下发正式阶段方向） |
| 唯一下一动作 | **执行 I5 发布收尾提示 01「TS5-PUBLISH」**（`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`）：Workspace 普通 merge 保留远端 P53 登记与本地 I5 内容，三仓非强制推送（Server `origin/develop` 6 提交、Web `origin/develop` 2 提交、Workspace `origin/develop-sw` 同步链）与远端包含关系回读，提交 `terminal-sync-stage-i5-v0.0.3-oa-iteration-02.md`；Owner 已明确授权该合并与推送范围。确认 I5 `COMPLETED` 后由 Planner 形成 I6 正式方向并归档 I5 终态同步方向。P60 保持 IN_PROGRESS，功能数 44 与清单 ✅46/🟦22/⬜22、ADV64、P 编号不变 |

## v0.1.0-oa-completion 关键事实

- 主方向：`product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md`（六次迭代：I1 组织与权限底座、I2 低代码表单收口、I3 人工审批与自研流程设计器、I4 编排/流程运营/工作台、I5 第三方 SSO、I6 通知与版本收口）。
- I3 阶段方向（已归档）：`product/v0.1.0-oa-completion/passed/direction-stage-i3-manual-approval-first-party-process-designer.md`；I3 功能级裁决 `receipts/planning-review-stage-i3-v0.1.0-oa-completion-08-passed.md` **PASSED**（R0—R10 全部原子，十八项验收标准通过）；I3 终态最终复核 `receipts/planning-final-review-terminal-sync-stage-i3-v0.1.0-oa-completion-02-passed.md` **PASSED**（已确认 `COMPLETED`）。
- I4 阶段方向（已归档）：`product/v0.1.0-oa-completion/passed/direction-stage-i4-orchestration-process-operations-workbench.md`；I4 功能级裁决 `receipts/planning-review-stage-i4-v0.0.3-oa-iteration-06-passed.md` **PASSED**（R5/R6 关闭缺口，十二项验收标准全部通过）；终态同步最终复核 `receipts/planning-final-review-terminal-sync-stage-i4-v0.0.3-oa-iteration-03-passed.md` **PASSED**（I4 正式确认 `COMPLETED（规划已确认，2026-09-13）`）；终态同步方向与三层状态对账方向亦均已归档 `passed/`。
- I5 阶段方向（已归档）：`product/v0.1.0-oa-completion/passed/direction-stage-i5-tenant-safe-third-party-sso.md`；I5 功能级裁决 `receipts/planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md` **PASSED**（Owner 2026-09-14 明确延期免验三 Provider 真实链，其余标准与文档级可用交付锁定）；I5 阶段三终态同步回执 `receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`（`TERMINAL_SYNC_SUBMITTED`），I5 终态同步方向 `ready/direction-stage-i5-terminal-sync.md`（Planner 终态复核后方可归档 `passed/`）。
- 当前唯一执行入口：`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`（I5 发布收尾 TS5-PUBLISH；终态值与本地提交已通过规划复核 01，仅剩三仓远程发布）。
- 历史材料（I1 阶段证据，不改）：`product/v0.3.0-oa-completion/`。
- 高级能力规划：`ready/advanced-capability-feature-checklist.md`（ADV-M11—ADV-M18、8 模块/64 条）；已映射进 `Smart-WorkFlow-aPaaS-server/功能清单.md` 文末 ADV 章节，**未纳入 0.1.0 验收**。
- 统筹但不提前核销：P2/P4/P26/P31/P34/P35/P37/P38/P39 等既有开放 OA 范围。
- 六阶段外部依赖：三个 SSO Provider 测试应用/回调域/凭据（WECOM/FEISHU/DINGTALK 真实成功链按 Owner 2026-09-14 裁决**延期免验**，启用时按 `Smart-WorkFlow-aPaaS-server/docs/sso/owner-acceptance-handbook.md` 自验），以及短信/飞书/钉钉/企业微信/邮件渠道可控测试配置（凭据只进安全配置，不进仓库/截图/日志/回执正文）；小程序继续冻结。

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

- v0.1.0-oa-completion（P60，当前活动）：方向与规划定义 `product/v0.1.0-oa-completion/ready/`；主方向 `ready/direction-v0.1.0-oa-completion.md`；I2 主方向与终态同步方向均已归档 `passed/`（规划已确认，2026-09-10）；I3 主方向与终态同步方向均已归档 `passed/`（规划已确认，2026-09-12）；I4 主方向、终态同步方向与三层状态对账方向均已归档 `passed/`（规划已确认，2026-09-13，最终复核 03 PASSED）；**I5 主方向 `passed/direction-stage-i5-tenant-safe-third-party-sso.md` 已归档（功能级 PASSED，Owner 延期免验三 Provider 真实链）**，当前唯一执行入口 `ready/direction-stage-i5-terminal-sync.md`（终态同步回执 01 已提交，等待 Planner 终态复核）；任务登记 `knowledge/features/v0.1.0-oa-completion.md`（由 `v0.3.0-oa-completion.md` 更名承接；目标版本 Owner 确认登记 `0.1.0`；I1—I4 COMPLETED（规划已确认）；**I5 COMPLETED（待规划确认，2026-09-14）**，下一动作=等待 Planner 终态复核，确认后形成 I6 正式方向）。I1 历史证据（只读历史）：`product/v0.3.0-oa-completion/`。
- p21-iot-device-access：主方向与阶段三方向均归档 `product/p21-iot-device-access/passed/`；最终裁决 `receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md`（COMPLETED 规划已确认，2026-09-08）；任务登记 `knowledge/features/p21-iot-device-access.md`。
- v0.0.2-oa：主方向与 A8 方向归档 `product/v0.0.2-oa/passed/`；任务登记 `knowledge/features/v0.0.2-oa.md`；COMPLETED（规划已确认，2026-09-08 复核确认）。
- P4：主方向与能力边界方向均归档 `product/p4-oa-personal-center-dual-dispatch/passed/`；最终裁决 `receipts/planning-final-review-terminal-sync-p4-02-passed.md`（COMPLETED 规划已确认，2026-09-07）；任务登记 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`。
- P59：主方向与终态同步方向均归档 `product/p59-ch-apaas-project-update/passed/`；任务登记 `knowledge/features/p59-ch-apaas-project-update.md`；最终裁决 `receipts/planning-final-review-p59-terminal-sync-02-passed.md`（COMPLETED 规划已确认，2026-09-05）。
- `knowledge-full-reconciliation`：**COMPLETED（已确认，2026-09-04）**（最终裁决 `receipts/planning-final-review-terminal-sync-02-passed.md`）；三方向均归档 `product/knowledge-full-reconciliation/passed/`。
- 映射索引：`knowledge/feature-reconciliation-index.md`（主索引）+ `feature-reconciliation-issues.md`（54 I 逐项）+ `feature-reconciliation-products.md`（55 目录逐项）；90 明细/56 唯一 P/54 I/55 product 目录双向映射；ADV 高级能力规划项 64 条为独立登记（不并入审计集合）。
- 必读入口：`knowledge/current-status.md`、`Smart-WorkFlow-aPaaS-server/功能清单.md`、`knowledge/known-issues.md`、`todo/requirement-pool.md`、本交接
