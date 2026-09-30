# P62 分级执行与统一命令：S4 设备未知结果与受控回执进度回执 01

日期：2026-09-30；角色：执行（Executor）；阶段状态：**IN_PROGRESS**（正式完成回执 `tiered-execution-unified-command-01.md` 在 U01—U08 全部完成后提交）。
依据：`../ready/direction-p62-tiered-execution-unified-command.md`（外部待核实实交范围 U04/U07）。前置：S1/S2/S3 进度回执。

## 1. S4 交付范围（设备未知结果接线 + 回调守卫 + 独立授权人工核实）

| 项 | 实现 | 位置 |
|---|---|---|
| 未知结果生产路径 | 补偿调度新增回执超时步骤：SENT/DELIVERED/ACKED 超过回执等待窗口（expiry_time）且无确定业务回执 → `markUnknown`（待核实）；**传输已真实发出不自动当失败重发**（既有重试路径仅覆盖 QUEUED/FAILED，UNKNOWN 无任何重发路径） | `CommandCompensationJob#processReceiptTimeoutCommands`、`CommandQueueService#getReceiptTimeoutCommands`、`IotDeviceCommandMapper#selectReceiptTimeout` |
| 受控回执守卫 | `DeviceReceiptService.applyReceipt`：HMAC-SHA256 来源签名（`sw.iot.receipt.secret`，未配置即通道关闭 fail closed）→ 命令关联（主键定位、无登录态通道挂起租户拦截、命令行 tenant_id 自承载）→ 状态转换矩阵（非终态与 UNKNOWN 可收敛；QUEUED/SENDING 未发出拒绝）→ 去重（同向重复 DUPLICATE 幂等）；**冲突回执留审计（RECEIPT_CONFLICT）不覆盖已确定结果**；迟到合法回执可收敛 UNKNOWN（RECEIPT_APPLIED） | `service/DeviceReceiptService`、`service/impl/DeviceReceiptServiceImpl`、`controller/IotDeviceReceiptController`（POST `/iot/commands/receipt`，已入匿名白名单） |
| 独立授权人工核实 | `verifyManually`：仅 UNKNOWN 命令；最小权限 `iot:command:verify`（新增；服务内复校防内部绕过；仅 monitor:view 不足以改结果——无权限 403）；**依据必填（不带可信依据不得宣告结果）**；收敛后 result 标记 MANUAL_VERIFY 来源+依据+操作者；审计记录依据、操作者、前后状态（COMMAND_MANUAL_VERIFY） | 同上（POST `/iot/commands/{id}/manual-verify`）；菜单/授权 `R__p62_iot_command_verify_menu.sql`（按钮 9104 挂设备管理菜单 332，仅授权管理员 role 2，不向普通用户默认授予） |
| BPM 关联回查 | `IotDeviceFacade.findByApprovalBizId(tenantId, processInstanceId)`：审批联动命令（approval_biz_id）按流程实例回查（含 UNKNOWN 状态）；显式租户边界 | `IotDeviceFacade`、`DeviceCommandSummary`、`IotDeviceFacadeImpl`、`IotDeviceServiceImpl#findByApprovalBizId` |
| 配置与迁移 | `sw.iot.receipt.secret`（默认空=回执通道关闭）；permit-urls 增 `/iot/commands/receipt`（HMAC 替代登录态） | `application.yml`、`DeviceReceiptServiceImpl#assertValidSignature` |

## 2. 验证（本轮实跑）

| 层 | 用例 | 结果 |
|---|---|---|
| 真实 PostgreSQL 端到端（受控真实传输对端） | `P62DeviceReceiptPgTest`：命令发送经真实 HTTP loopback（hutool → JDK HttpServer，对端计数）；回执超时转 UNKNOWN 且**对端仅收到一次下发**；坏签名拒绝（401）；迟到合法回执收敛 UNKNOWN（APPLIED+状态 SUCCESS）；重复回执 DUPLICATE 幂等（APPLIED 审计恰一条）；冲突回执 CONFLICT 留审计不覆盖；按流程实例回查关联命令；第二条命令走人工核实（无权限 403 → 无依据拒绝 → 带依据收敛，审计含依据与 before=UNKNOWN/after=SUCCESS） | **1/0/0/0**，证据行 `[P62-EV] s4.e2e lifecycle sent=1 no-resend=true unknown=true late-receipt=APPLIED duplicate=idempotent conflict=audited bad-signature=401 manual-verify=APPLIED basis-audited=true bpm-linked-lookup=1` |
| IoT 模块回归 | sw-basic-iot 既有测试（含 `IotDeviceReportResultSanitizeTest` 既有回写端点语义不变） | 全绿 |
| 迁移链 | `FlywayFullChainPostgresTest` 12、`FlywayFullChainH2Test` 17（R__ 3 条锚点同步） | 全绿 |
| 既有 P62 回归 | `TieredCommandSemanticsPgTest` 4、`P62LightProcessE2ePgTest` 3 | 全绿 |

## 3. 身份与提交

- Server（develop，已推送远端并回读一致）：`fabf7a7`（S4 全量）。Workspace gitlink 同步至 Server `fabf7a7`；Web `19e1c47` 未变（S5 处理界面）。
- 边界说明：腾讯实网、自动厂商对账、物理恰好一次不在本阶段（方向明确延期项）；既有设备回写端点（`POST /commands/{id}/result`，登录态+manage 权限）原语义保持（U06 兼容），S4 新通道独立并存。

## 4. 剩余与边界

- 剩余切片：S5 Web 界面（配置/执行回查/批量项/核实）；S6 兼容回滚演练（U06）+ 300ms/2s 预算实测（U08）+ 正式回执 `tiered-execution-unified-command-01.md`。
- 边界：S4 的"受控真实传输对端"为测试内真实 HTTP loopback（非 mock 业务桩），证明丢回执/迟到/重复/冲突与人工核实行为；真实厂商（腾讯云）对账与实网验证仍为 Owner 延期项，不在本阶段完成声明内。
