# LT06 补证：较窄视口 UI 证据、对象身份与脱敏 R 信封

日期：2026-09-30；角色：执行（Executor）；会话：ZCode IAB 可见会话（`headless=false`，用户可见可交互，验收后保持打开）。用途：闭合审查记录 LT06「主链1920×1080界面+DB关联已成立；其余常用比例未提供，网络只给状态码，证据索引未绑定完整浏览器页面URL与制品指纹」。

代码身份：Server `5f9e066190707c80ad099f7f2ddd3f234716164e`（`develop`；本批补证修复后重建的 dev 制品 `bootstrap-dev.jar`，2026-09-30 17:22 构建，local profile + 专用库 `smart_workflow`，启动段 0 ERROR）；Web `19e1c472ad8b8fbfd5939811572548d69bf8d4e7`（Vite dev，`http://localhost:5173`）。
页面：**完整 URL `http://localhost:5173/form/txn-action`**（SPA 路由；后端经 `/api` 代理到 8080）。

## 1. 制品清单（视口 / 视口类型 / 内容 / 对象）

| 制品 | 视口 | 比例 | 内容 | 对象身份 |
|---|---|---|---|---|
| `20-lt06-1280-list.png` | 1280×720 | 16:9 | 事务动作列表（3 条：库存预占 v1 已发布 / 库存确认 v1 已发布 / 非法配置示例 草稿） | 表单「未命名表单」`7d91e5f1-c3f2-4d51-9d31-2691ed7291a2` |
| `21-lt06-1280-invoke-rejected.png` | 1280×720 | 16:9 | 业务拒绝：调用 库存预占 数量 999 → 「已拒绝 可用数量不足（可用=余额-有效预占），预占被拒绝」 | 记录 `02c874ac-777e-4bbb-92eb-74e2992d6ec7`、动作 `stock_reserve`、调用标识 `565c9f32-…` |
| `22-lt06-1280-invoke-replay.png` | 1280×720 | 16:9 | 成功 + 同键重放：「成功（重复调用已返回原结果）」；数量 5、余额 70、有效预占 5；同一调用标识与凭据 | 调用标识 `a760b8c6-…`、凭据 `597a6af3-…` |
| `23-lt06-1366-config.png` | 1366×768 | 16:9(768p) | 配置可操作：编辑动作对话框（动作标识 `stock_reserve`、类型 预占、余额字段 可用量、预占字段 预占量、时效等级 常规（2 小时）、**追溯维度 物料**、可用量不足时拒绝=开） | 同上动作 |
| `24-lt06-1366-invocation-records.png` | 1366×768 | 16:9(768p) | 回查：调用记录抽屉（`lt06-ok-1280` 成功、`lt06-reject-1280` 已拒绝、历史 `ACC-K1/K2`），**重放未新增行** | 同动作 + 调用人 1 |
| `25-lt06-1024-invocation-records.png` | 1024×768 | 4:3 | 上式在 4:3 窄视口的可读可操作复现 | 同上 |

## 2. 脱敏 R 信封（真实界面操作触发，页面内采集）

采集方式：验收会话内在页面上下文包裹 XHR 记录响应体（仪表只记录 `method/url/status/body`，不改变请求；请求头不落盘，无令牌/秘密）。信封文本落盘如下：

| 文件 | 来源 | 关键内容（R 信封） |
|---|---|---|
| `26-r-envelope-business-rejection.json` | 界面「执行调用」触发业务拒绝 | HTTP 200；`{"code":0,"msg":"success","data":{"status":"REJECTED","actionVersion":1,"reservationId":null,"errorCode":1604,"errorMsg":"可用数量不足（可用=余额-有效预占），预占被拒绝","replay":false}}`；`url=/api/form/action/8ba0dc9c-…/invoke` |
| `27-r-envelope-invoke-success-and-replay.json` | 成功 + 同键重放两次调用 | 两次信封 `invocationId` 相同 `a760b8c6-…`、`reservationId` 相同 `597a6af3-…`、`balanceAfter=70`、`reservedAfter=5`，唯一差异 `replay=false → true`（**同身份回查且无重复效果**） |
| `28-r-envelope-readback.json` | 调用记录回查（GET） | `data.records[*]`：`id/invocationKey/bizRecordId/status/errorCode/resultJson/callerId=1/actionVersion=1`；含 `lt06-ok-1280` 的 `resultJson={quantity:5,balanceAfter:70.000000,reservationId:597a6af3-…,reservedAfter:5.000000}` |

脱敏说明：信封为服务端 `R` 业务响应，不含凭据/令牌；`authorization` 请求头未被采集；主机地址与数据库口令不出现在任何制品中。

## 3. 界面 ↔ 数据库同对象核对（`db-lt06-readback.txt`）

| 维度 | 界面（截图/信封） | 数据库（同一时刻回读） |
|---|---|---|
| 目标记录 | 记录 `02c874ac-…`，余额 70、有效预占 5 | `field_2=70.000000`、`field_3=5.000000`、`version=3` |
| 新凭据 | 预占凭据 `597a6af3-…`（成功面板） | `sw_form_txn_reservation` 行 `qty=5`、`status=ACTIVE`、`reserve_invocation=a760b8c6-…` |
| 调用记录 | 抽屉两行（成功/已拒绝） | `lt06-ok-1280 SUCCEEDED`、`lt06-reject-1280 REJECTED(1604)`，**共 2 行**（3 次点击 → 重放未新增） |
| 台账 | （列表页台账入口，形状同前次验收） | `RESERVE` 一笔：`qty=5`、`balance_after=70`、`reserved_after=5`、`action_version=1` |

## 4. 与原 1920 主链的关系

原 1920×1080 主链证据（`../local-transaction-actions-01/01…15`）**不重做**，本轮在其基础上补较窄视口（1280×720、1366×768、1024×768）的配置/调用/结果/回查可操作证据；两次会话对象同身份（同表单、同记录、同动作；凭据 `8b92d166-…` 为原验收凭据，本轮新增 `597a6af3-…`）。会话在验收后保持可见可交互（视口已恢复 1920×1080）。

## 5. 哈希与回读

`evidence-sha256.txt` 由机器生成（`shasum -a 256`）并逐行回读校验；覆盖本目录全部制品（PNG/JSON/TXT/MD）。哈希绑定上述 Server/Web 提交身份。

## 6. 边界

- 本轮只做验收与证据，不修改业务代码；补证修复（结算冻结语义/停用边界/非法声明拒绝）发生在验收**之前**并已提交（Server `5f9e066`），本次界面会话即运行在该提交重建的制品上。
- 未使用 headless 浏览器；未以组件测试替代正式流程；未触碰线上环境或生产数据。
