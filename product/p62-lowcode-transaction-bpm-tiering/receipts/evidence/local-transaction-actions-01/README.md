# T07 正式浏览器验收证据索引（local-transaction-actions-01）

- 验收时间：2026-09-30 15:15—15:40（+08:00）；执行：Executor（ZCode 会话，恢复现场后本次实跑）。
- 会话形态：ZCode 内置浏览器（IAB）**用户可见、可交互**会话；`headless=false`；视口 **1920×1080**；语言 中文。
- 应用：前端 Vite dev `http://localhost:5173/`（仓库工作树，含本阶段 UI）；后端 `http://localhost:8080/api`（本次以 `local` profile + 专用库启动，见下）。
- 身份：`admin` / dev 测试口令 / 固定测试验证码（`ch.dev.test-mock=true` 的 dev/test 受控输入，非真实用户秘密）；登录后会话 `系统管理员`（超管）。
- 数据库：专用服务器 PostgreSQL `smart_workflow`（0.1.3 基线库，本次以增量迁移 V0.1.1 + R__p62 菜单种子前向升级；未新建/未删除数据库）。
- 对象（界面与数据库同一对象，可在 readback 中逐项对应）：
  - 表单：`未命名表单`（id `7d91e5f1-c3f2-4d51-9d31-2691ed7291a2`，标识 `未命名表单`，PUBLISHED，物理表 `sw_form_ouyylgp64c`，form_version=2）；
    字段 `field_1=物料`（文本）、`field_2=可用量`（数字）、`field_3=预占量`（数字）。
  - 库存记录：`02c874ac-777e-4bbb-92eb-74e2992d6ec7`（物料 M-001；验收终态 可用量 70 / 预占量 0 / version 2）。
  - 动作：`stock_reserve`（库存预占，RESERVE，PUBLISHED v1）、`stock_confirm`（库存确认，CONFIRM，PUBLISHED v1）、`stock_bad`（非法配置示例，保持 DRAFT）。
  - 预占凭据：`8b92d166-11d1-48c8-8648-e4f1291695f7`（30，CONFIRMED，settled_at 15:33:27）。
  - 调用：`ACC-K1` 成功（143/147ms）、`ACC-C1` 确认成功（129ms）、`ACC-K2` 业务拒绝 1604（82ms）；同键重放与同键冲突不新增调用行。

## 制品清单

| 文件 | 对应验收点 |
|---|---|
| `01-publish-validation-error.png` | 发布错误定位：非法配置（追溯维度=余额字段）被发布校验拒绝，弹窗按可读字段定位 |
| `02-invoke-dialog.png` | 业务调用入口（预占：目标记录/数量/调用标识） |
| `03-invoke-succeeded.png` | 预占成功（数量 30、余额 100、有效预占 30 + 调用标识） |
| `04-invoke-replay.png` | 幂等重放（同键同内容 → 「重复调用已返回原结果」） |
| `05-invoke-conflict.png` | 同键不同输入明确冲突（红色提示，凭原标识回查） |
| `06-invoke-rejected.png` | 可用量不足业务拒绝（可用=余额−有效预占） |
| `07-invocation-records.png` | 调用记录回查（仅 2 行：成功 + 拒绝） |
| `08-reservations.png` | 预占凭据回查（有效/过期时间） |
| `09-ledger.png` | 预占台账（预占 30，余额 100） |
| `10-reservations-with-id.png` | 预占凭据标识可见（补列后；确认/释放所需业务凭据） |
| `11-confirm-succeeded.png` | 确认成功（数量 30、余额 70、有效预占 0、预占凭据回显） |
| `12-ledger-confirm.png` | 确认台账（确认 30，余额 70） |
| `13-c1-enabled.png` | 关键数据保护启用保存成功 |
| `14-c1-direct-write-rejected.png` | C1 直接写入被拒（表单编辑页提交受保护字段 → 拒绝，值未改写） |
| `15-disabled-rejected.png` | 停用边界：停用后调用被拒（「该事务动作已停用，暂不能发起新的调用」）；随后已恢复启用 |
| `16-db-readback.txt` | 数据库回读（动作/版本/调用/预占/台账/C1/宽表记录/表单，与界面同对象；守恒复算 100−30=70） |
| `17-network-index.txt` | 网络索引（38 次 `/api/form/action*` 调用：list/validate/publish/invoke/invocations/reservations/ledger/c1-policy/disable/enable） |
| `db-pre-migration.txt` / `db-post-migration.txt` | 专用库增量迁移前后快照（既有表行数不变；菜单按设计 +4/+4；新增 6 张 P62 表） |
| `readback.sql` | 回读查询脚本（可复跑） |

## 说明

- 业务拒绝在 HTTP 层为 200（平台 R 信封，错误码/消息在响应体）；界面以业务化提示呈现，数据库以 `sw_form_txn_invocation.status/error_code` 留痕。
- 耗时事实：本次三次真实调用 `duration_ms` = 147 / 82 / 129（仅采集事实，不构成 A06/A07 时效隔离结论）。
- 跨租户与无权限拒绝：见 PG 行为测试（`T02`）与控制器鉴权测试（`TxnActionControllerAuthorizationTest`）证据；本浏览器会话为超管身份，不用于跨租户/无权限负例。
