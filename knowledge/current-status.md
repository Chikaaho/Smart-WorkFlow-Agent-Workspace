# 当前项目状态

> 唯一当前快照；截至/同步点：2026-09-14，P60 `v0.1.0-oa-completion`（成熟 OA 目标版本 `0.1.0`；当前交付迭代 `0.0.3`，见 `receipts/planning-version-baseline-p60-current-iteration-02.md`；XL，P0）执行中：目标版本由 Owner 确认统一登记为 `0.1.0`（更正回执 `product/v0.1.0-oa-completion/receipts/planning-registration-correction-v0.1.0-01.md`）；I1「组织与权限底座」**COMPLETED（规划已确认，2026-09-09）**；I2「低代码表单收口」**COMPLETED（规划已确认，2026-09-10）**；I3「人工审批与自研流程设计器」**COMPLETED（规划已确认，2026-09-12）**；I4「编排、流程运营与工作台」**COMPLETED（规划已确认，2026-09-13）**；**I5「租户安全与三方 SSO」COMPLETED（待规划确认，2026-09-14）**（功能级验收 `receipts/planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md` PASSED；终态同步回执 `receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`，机器状态 `TERMINAL_SYNC_SUBMITTED`；WECOM/FEISHU/DINGTALK 真实成功链按 Owner 2026-09-14 裁决**延期免验/未验证**）；I5 主方向已归档 `passed/`，当前唯一入口 `product/v0.1.0-oa-completion/ready/direction-stage-i5-terminal-sync.md`。I6 通知与版本收口未开始。功能数 44、清单 ✅46/🟦22/⬜22、ADV64 与 P 编号全部保持现状。历史快照见 `knowledge/history/`。
> 冲突处理：本文件为当前功能状态、计数、活动功能、正式基线与唯一下一动作的权威来源。

## 当前快照

| 维度 | 当前值 |
|---|---|
| 业务功能状态 | `v0.1.0-oa-completion`（P60，成熟 OA 目标 `0.1.0`、当前交付迭代 `0.0.3`）：**IN_PROGRESS**（I1—I4 均 COMPLETED（规划已确认）；**I5 租户安全与三方 SSO COMPLETED（待规划确认，2026-09-14）**，三 Provider 真实成功链=Owner 延期免验/未验证；I6 未开始） |
| 上一完成功能 | `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：**功能状态 COMPLETED（规划已确认，2026-09-08）**（阶段三最终复核 `planning-final-review-terminal-sync-p21-iot-02-passed.md` **PASSED**），第 44 个正式功能 |
| 已完成功能数 | **44** |
| 功能清单 | 10 模块、55 功能、90 明细；**✅46 / 🟦22 / ⬜22**（46+22+22=90）；另登记 **ADV 高级能力规划项 8 模块、64 条（ADV-M11—ADV-M18）**——未纳入 0.1.0 验收、不计入 90 明细 ✅/🟦/⬜ 统计、不并入已完成功能数 |
| 后端正式基线 | I5 锁定（迭代 02—11 门禁）：受影响八模块 **766 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS**（common 18、security 17、system-biz 290、form-biz 132、bpm-engine 50、bpm-process 205、openapi 6、bootstrap 48；含 FlywayFullChain H2 86 / PostgreSQL 85、终点 **V86**，I5PgTenantBehavior/I5SsoBindingSession/I5ProdProfileSecurity 真实 PG·H2·Redis 行为链）；后续飞书修复聚焦 `SsoAuthServiceTest` **22/0** 与 system-biz **295/0/0/0**。最终候选工作树 `486b1116eb6016024c8e1e4a00b50244af2f3cb5`（`git write-tree` 临时索引含未跟踪文件），iteration-11 记录 HEAD `4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`（本地 3 个 I5 提交，`origin/develop` 落后 3，未推送） |
| 前端正式基线 | I5 锁定（iteration-10/11 零修改）：Web HEAD `5788ead33c4347214a350d124331237e85068bdf`；typecheck/lint/test/build 四门 exit 0（**128 files、1183 passed + 3 skipped**）；I5 新增 SSO 回跳/绑定/账号绑定页与权限 fail-closed 沿用 I5 执行回执 01 锁定结果 |
| 迁移基线 | Flyway **H2/PostgreSQL 同一迁移身份，终点 V86**（I5 新增 V83 formKey 租户唯一、V84 SSO 身份四表、V85/V86 Provider 应用归属唯一（`sw-biz-system` system 迁移目录）＋ devseed H2 V900—V903 仅 dev 装载；`sw-bootstrap` FlywayFullChain H2 86 条 / PostgreSQL 85 条） |
| 产品行为基线 | I5 G1—G9 真实行为证据：`receipts/evidence/i5-02/`—`i5-11/`（非零租户 OA 全链同一对象链 tenantId 勾稽、生产匿名矩阵、SSO state 重放/错配/白名单拒绝、绑定/解绑与冲突拒绝、同秒 jti 撤销隔离、审计零残留与秘密扫描 NO-HITS、Owner 自验交接包回读与逐文件 manifest）；I1—I4 行为证据继续锁定 |
| 验证基线变更集合 | Server/Web/Flyway/产品行为四组（见上）；不得沿用 I4 时点 523/V82、v0.0.2-oa 时点 1156/V58、I1 时点 1223/V67 等历史基线或最后单模块计数 |
| 验证例外 | WECOM/FEISHU/DINGTALK **三 Provider 真实成功链=`Owner 延期免验 / 未验证`**（Owner 2026-09-14 明确裁决：跳过、暂不验证、继续后续任务；不得写成真实通过、沙箱通过或外部联调完成）；不扩大到 I6 通知渠道，小程序继续冻结 |
| P 编号 | **P21 已核销/完成（2026-09-08）**；**P2、P4 开放、部分实现未核销**；P34/P35/P37/P38/P39 部分实现未核销；**P60、P31 及其他开放 P 编号全部保持现状，I5 阶段不核销**。审计基准 P 池 57 行、唯一 56 编号（P48 总表/明细双入口同值）；I 索引 54 条、区间 I1—I55 缺 I27，本轮不增删（**I14 已满足/关闭（2026-09-08）**；I38/I39/I40/I45 保持开放） |
| 变更类型记录（历史事件，非当前值） | 2026-09-14 I5 阶段三终态同步：按 `ready/direction-stage-i5-terminal-sync.md`（前置裁决 `receipts/planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md`）把 I5 机械写为 `COMPLETED（待规划确认，2026-09-14）`，机器状态 `TERMINAL_SYNC_SUBMITTED`；P60 保持 IN_PROGRESS，功能数 44、90 明细计数 ✅46/🟦22/⬜22、ADV64 与 P 编号零变化；I5 task-owned 文件本地提交、远程推送待 Owner 对具体远端/分支/范围授权；未重验 I5、未开始 I6、未创建标签或 Release。2026-09-14 I5 功能级验收 PASSED（`planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md`）：Owner 裁决三 Provider 真实凭据链延期免验，其余标准与文档级可用交付（三 Provider 官方文档对照、飞书 `response_type=code` 修复、安全配置占位、Owner 自验手册、零秘密扫描、五类对象 manifest）自审查 10—11 起锁定；记录语义固定为延期免验/未验证边界。2026-09-13 I5 实现推进至 `VERIFYING`：非零租户 OA 全链、生产认证安全、权限 fail-closed、SSO state/绑定/会话/审计与同秒 jti 撤销隔离按 G1—G9 逐原子收敛；P60 保持 IN_PROGRESS，计数与 P 编号零变化。2026-09-13 I4 规划确认终态投影与终态同步最终复核 03 PASSED：I4 写为 `COMPLETED（规划已确认，2026-09-13）`，I4 主方向、终态同步方向与三层状态对账方向均归档 `passed/`。2026-09-13 I4 终态三层一致性收敛：关闭 TS4-R1a（补齐第 15 项功能登记）、TS4-R1b（统一全部当前入口与动作）、TS4-R1c（修正并重跑当前入口残留验证器，含负向夹具）。2026-09-13 I4 三层状态全量对账：以 90 个稳定明细键与 knowledge/memory 双向逐项对账，机械修正过期当前指针；I4 保持 `COMPLETED（待规划确认，2026-09-13）`、终态同步复核 01 `VERIFYING`。2026-09-12 I4 进入执行（阶段级）：版本关系机械同步为「成熟 OA 目标 `0.1.0`、当前交付迭代 `0.0.3`」。2026-09-12 I3 阶段三终态同步（回执 02 经最终复核 02 确认 `COMPLETED（规划已确认，2026-09-12）`）。2026-09-10 I2 阶段三终态同步经最终复核确认为 `COMPLETED（规划已确认，2026-09-10）`；2026-09-09 目标版本登记更正（0.3.0→0.1.0，Owner 确认） |
| 当前活动正式功能 | `v0.1.0-oa-completion`（P60，XL）：IN_PROGRESS（I1—I4 均 COMPLETED（规划已确认）；I5 COMPLETED（待规划确认，2026-09-14）；I6 未开始） |
| 当前活动交付任务 | 无独立交付任务（P60 六阶段按方向排期推进）；当前唯一入口为 I5 终态同步方向（终态同步回执已提交，等待 Planner 终态复核） |
| 最近审查 | `product/v0.1.0-oa-completion/receipts/planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md`（I5 功能级验收 **PASSED**，Owner 延期免验三 Provider 真实链，2026-09-14）\| `receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`（I5 阶段三终态同步回执，`TERMINAL_SYNC_SUBMITTED`，2026-09-14）\| `receipts/planning-review-stage-i5-v0.0.3-oa-iteration-11.md`（G8 交接包通过并锁定，2026-09-14）\| 历史：`planning-final-review-terminal-sync-stage-i4-v0.0.3-oa-iteration-03-passed.md`（I4 终态同步最终复核 03 PASSED，2026-09-13）\| `planning-final-review-terminal-sync-stage-i3-v0.1.0-oa-completion-02-passed.md`（I3 终态最终复核 PASSED，2026-09-12）\| `planning-final-review-terminal-sync-stage-i2-v0.1.0-oa-completion-02-passed.md`（I2 终态最终复核 PASSED，2026-09-10） |

## 终态与方向归档事实（唯一口径）

- `v0.1.0-oa-completion`（P60 0.1.0 OA 全功能收口）：方向 **READY（2026-09-08）→ IN_PROGRESS**；主方向 `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md`；**I1 COMPLETED（规划已确认，2026-09-09）**（历史验收/终态证据在 `product/v0.3.0-oa-completion/receipts/`，终态同步方向归档 `product/v0.3.0-oa-completion/passed/`）；**I2 低代码表单收口 COMPLETED（规划已确认，2026-09-10）**、**I3 人工审批与自研流程设计器 COMPLETED（规划已确认，2026-09-12）**、**I4 编排、流程运营与工作台 COMPLETED（规划已确认，2026-09-13）**，三者主方向与终态同步方向均已归档 `product/v0.1.0-oa-completion/passed/`；I4 范围=动态并行编排（参与部门强制主场景）、流程模板中心、监控/干预/基础分析、流程专用跨系统接入（外部应用发起/查询/签名回调/重试/防重放）、批量审批、流程交接、完整工作台与响应式 H5；**I5 租户安全与三方 SSO COMPLETED（待规划确认，2026-09-14）**：规划验收 `planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md` **PASSED**（Owner 明确延期免验三 Provider 真实链），I5 主方向已归档 `passed/direction-stage-i5-tenant-safe-third-party-sso.md`，终态同步方向 `ready/direction-stage-i5-terminal-sync.md`（Planner 终态复核后方可移入 `passed/`），终态同步回执 `receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`；I5 范围=租户归属与流程主链收口（表单/配置/快照/列表配置/流程定义/绑定/工作台布局/实例任务显式归属、formKey 租户唯一与物理表名全局无碰撞、非零租户全链、缺失/冲突/停用/过期 fail closed）、生产认证与运维暴露收敛（固定验证码 profile 门禁、JWT/Druid/Provider 凭据零可用默认值、Actuator 最小暴露）、租户有效性与权限收敛（登录/refresh/缓存重载统一租户校验、会话撤销、空角色不回落 `DataScope.ALL`）、三 Provider SSO（服务端授权发起与回调换票、state 限时一次性绑定、稳定主体标识绑定、已绑定登录复用本地权限链、解绑/失效、最小持久审计与秘密零残留）。**I6 通知与版本收口未开始。** I5 阶段级完成不替代 P60 完成；P60 在六阶段全部完成前保持 `IN_PROGRESS`，不创建版本标签或 Release。
- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：功能状态 **COMPLETED（规划已确认，2026-09-08）**（阶段三最终复核 `product/p21-iot-device-access/receipts/planning-final-review-terminal-sync-p21-iot-02-passed.md` **PASSED**）；主方向与阶段三方向均已归档 `product/p21-iot-device-access/passed/`。任务登记：`knowledge/features/p21-iot-device-access.md`。
- p21-iot-device-access 交付范围：原生 MQTT 与腾讯 IoT 双通道配置（F01）、连接管理（F01-03）、设备维护（F02-01）、状态监控（F02-02）、Topic 订阅/发布配置（F03）、数据上报（F04-03）、消息日志（F04-04）、规则编排（F05-01）；腾讯实网（真实账号/RequestId/物理设备）按 Owner 本轮免验，不写成实网已验证；M08-F04-01 按钮发送保持🟦、F04-02 定时发送保持⬜、F05-02 指令模板保持⬜。
- `v0.0.2-oa`（v0.0.2 OA 完善）：**COMPLETED（规划已确认，2026-09-07）**，第 **43** 个正式功能（历史点；最终复核裁决 `product/v0.0.2-oa/receipts/planning-final-review-terminal-sync-v0.0.2-oa-03-passed.md`）；P54/P55/P3 随其核销、P2/P4 开放部分实现未核销。登记 `knowledge/features/v0.0.2-oa.md`；方向归档 `product/v0.0.2-oa/passed/`。
- `p4-oa-personal-center-dual-dispatch`（P4 OA 本轮子集）：功能状态 **COMPLETED（规划已确认，2026-09-07）**（历史点；验收事件：功能级 PASSED，规划复验09），第 42 个正式功能；P4 总项开放、部分实现未核销。登记 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`。
- `p59-ch-apaas-project-update`：**COMPLETED（规划已确认，2026-09-05）**、P59 已核销（历史，登记 `knowledge/features/p59-ch-apaas-project-update.md`）。
- 更早历史终态与基线见 `knowledge/history/` 与 `knowledge/feature-reconciliation-index.md`。

## 当前唯一下一动作

**P60 v0.1.0-oa-completion：等待 Planner 终态复核 I5 阶段三终态同步回执 01（`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`，`TERMINAL_SYNC_SUBMITTED`，前置裁决 `receipts/planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md`）：** Planner 复核通过并确认 I5 `COMPLETED（规划已确认，2026-09-14）` 后，由 Planner 形成 I6「通知与版本收口」正式阶段方向，并把 I5 终态同步方向归档 `passed/`。Executor 侧本轮动作已闭合：I5 唯一终态值已机械同步至 knowledge/memory/todo/工程《功能清单》与方向当前指针，I5 task-owned 文件已本地提交，三仓远端回读完成。**远程推送仍须 Owner 对具体远端、分支和范围明确授权**（Server `origin/develop` 3 个 I5 提交；Workspace `origin/develop-sw` 本轮同步提交）；授权前不得 push，禁止强推、历史改写、标签或 Release。三 Provider 真实成功链保持 `Owner 延期免验 / 未验证`，小程序继续冻结。P60 保持 `IN_PROGRESS`，I1—I4 均 `COMPLETED（规划已确认）`，I5 `COMPLETED（待规划确认，2026-09-14）`，功能数 44、清单 ✅46/🟦22/⬜22、ADV64 与 P 编号全部不变。**（P60 不替代、不提前核销 P2/P4/P26/P31/P34/P35/P37/P38/P39/P47 等既有开放编号。）**

## 当前未关闭项入口

- 未关闭业务问题权威注册：`knowledge/known-issues.md`（54 条，I1—I55 区间缺 I27；I14 已满足/关闭）
- 正式功能明细与双向映射：`Smart-WorkFlow-aPaaS-server/功能清单.md`（90 行业务明细＋文末 ADV 高级能力规划项 64 条）＋ `knowledge/feature-reconciliation-index.md`（90 明细/56 唯一 P/54 I/55 审计 product 目录；ADV 64 条为独立规划项，不并入审计集合）
- P60 方向与定义：`product/v0.1.0-oa-completion/`（ready/direction-*.md、ready/advanced-capability-feature-checklist.md、passed/、receipts/）；I1—I4 主方向与终态同步方向均已归档 `passed/`；I5 主方向已归档 `passed/direction-stage-i5-tenant-safe-third-party-sso.md`，当前唯一入口 `ready/direction-stage-i5-terminal-sync.md`；I1 历史证据 `product/v0.3.0-oa-completion/`
- I5 自验交接包（真实 Provider 启用时按手册执行）：`Smart-WorkFlow-aPaaS-server/docs/sso/owner-acceptance-handbook.md`、`docs/sso/provider-config-example.yml`
- p21-iot-device-access 交付追踪：`knowledge/features/p21-iot-device-access.md`；方向与回执：`product/p21-iot-device-access/`
- 历史状态与审计链：`knowledge/history/README.md`

## 新会话启动提示词

- 上轮完成：**I5「租户安全与三方 SSO」功能级验收 `PASSED`**（`receipts/planning-review-stage-i5-v0.0.3-oa-owner-waiver-01-passed.md`：Owner 2026-09-14 明确裁决三 Provider 真实凭据链延期免验、继续后续任务；验收标准 #1—#10、#12、#13、#15—#17 与 #14 本地边界此前已通过并锁定）+ **I5 阶段三终态同步回执 01 已提交**（`receipts/terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`，机器状态 `TERMINAL_SYNC_SUBMITTED`）
- 当前状态：**P60 v0.1.0-oa-completion 为当前活动正式功能（XL，IN_PROGRESS；成熟 OA 目标 `0.1.0`、当前交付迭代 `0.0.3`）**；I1 **COMPLETED（规划已确认，2026-09-09）**；I2 **COMPLETED（规划已确认，2026-09-10）**；I3 **COMPLETED（规划已确认，2026-09-12）**；I4 **COMPLETED（规划已确认，2026-09-13）**；**I5 COMPLETED（待规划确认，2026-09-14）**，主方向已归档 `passed/`；I6 通知与版本收口未开始
- 完成数：清单 **46 / 22 / 22**（90，业务明细零变化）＋ ADV 规划项 64 条（不计入）；正式功能数 **44**（44/44 登记路径存在）
- 门禁基线（I5 锁定，终态同步轮不重跑）：Server 受影响八模块 **766 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（含 Flyway H2 86 / PG 85 终点 V86；飞书修复后 SsoAuthServiceTest 22/0、system-biz 295/0/0/0）；Web 四门 exit 0（**128 files、1183 passed + 3 skipped**）；候选工作树 `486b1116eb6016024c8e1e4a00b50244af2f3cb5`（HEAD `4d98b671`）、Web `5788ead33c4347214a350d124331237e85068bdf`；行为证据 `receipts/evidence/i5-02/`—`i5-11/`
- 当前唯一下一动作：**等待 Planner 终态复核 I5 阶段三终态同步回执 01**；确认 I5 `COMPLETED` 后由 Planner 形成 I6 正式方向。远程推送待 Owner 对具体远端/分支/范围授权
- 验证例外：WECOM/FEISHU/DINGTALK 真实成功链=`Owner 延期免验 / 未验证`（不得写成真实通过）；小程序继续冻结
- P 编号：P21 已核销（2026-09-08）；P2/P4 开放、部分实现未核销；P34/P35/P37/P38/P39 部分实现未核销；P47 已纳入 I3 但本阶段不核销；P60、P31 及其他开放编号本轮零变化
- 功能追踪：`knowledge/features/v0.1.0-oa-completion.md`；映射索引 `knowledge/feature-reconciliation-index.md`
- 未完成边界：P2 其余（计算公式/外部数据源/表单删除/列表配置持久化）；P4 候选（转办/委托/加签/撤回、流程版本/挂起激活）；M08-F04-01 按钮发送 🟦、F04-02 定时发送 ⬜、F05-02 指令模板 ⬜；P34/P35/P37/P38/P39 部分实现未核销；腾讯实网（真实账号/物理设备）按 Owner 免验未做；非零租户登录无受支持入口为认证产品边界；64 条 ADV 高级能力全部 ⬜ 规划登记（未探索未验收，实施需后续独立方向）
