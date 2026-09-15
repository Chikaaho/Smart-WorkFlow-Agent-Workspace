# I6 通知版本闭环执行回执 06

## 执行身份与边界

- 执行角色：Executor
- 执行日期：2026-09-15（Asia/Shanghai）
- 执行入口：`planning-execution-prompt-stage-i6-notification-version-closure-04.md`
- 当前阶段：I6 `VERIFYING`
- 结论边界：本回执不将 I6 或 P60 标记为 `PASSED` / `COMPLETED`。
- 浏览器边界：正式角色动作均通过 Codex 内置浏览器的可见页面完成；未使用无头浏览器。API/数据库仅用于确定性准备、结果回读和指纹复算。

## 环境前置

local/dev/test 配置已启用固定验证码模式，登录流程使用配置的固定验证码，不依赖图像识别。后端固定验证码聚焦测试 5 项通过，后端构建 `BUILD SUCCESS`；前端 `typecheck`、`lint`、`test`、`build` 均通过。

## R3 — 管理员通知闭环：已完成

已在可见浏览器完成管理员页面核验：模板、渠道、规则、记录日志、重发和无权限分流。固定记录为 `2099530803114123265`，收件人 `10001`，标题“您的申请已通过”，业务类型 `WF_APPROVED`，渠道 `EMAIL`，初始状态 `FAILED`。

- 重发操作由管理员在记录页可见执行，页面反馈“重发结果：FAILED”；回读确认同一业务记录的投递尝试从 8 增至 9，未新建业务记录。
- `I6_R6_COPY_1789402118501` 规则已在页面完成关闭/开启核验，最终状态为启用。
- `u3_100` 直接访问管理员记录页可见 `/403`，权限分流成立。
- `R3-admin-record-log.webp` 为重发前的可见日志快照；`R3-admin-record-after-retry.webp` 为重发后的可见记录页快照；两者与回读结果共同形成前后证据链。

可回读证据：

- `evidence/i6-06/R3-VISIBLE-ADMIN/browser-events.md`
- `evidence/i6-06/browser-media/R3-admin-record-log.webp`
- `evidence/i6-06/browser-media/R3-admin-record-after-retry.webp`
- `evidence/i6-06/browser-media/R3-admin-template.webp`
- `evidence/i6-06/browser-media/R3-admin-channel.webp`
- `evidence/i6-06/browser-media/R3-admin-rule.webp`
- `evidence/i6-06/browser-media/R3-admin-template-preview.webp`

## R4 — PC/H5 正向与无权限分流：已完成

固定通知 `2099530783065350145` 已在 PC 与 H5 可见页面核验。消息为已读，链接类型 `WF_PROCESS`，实例 `8c752756-b056-11f1-a6e0-00ffa7734675`，业务类型 `WF_APPROVED`，标题“您的申请已通过”。

- PC 收件箱可见固定消息并可跳转。
- H5 375×800 视口可见消息详情，跳转到同一实例并显示 `APPROVED`、发起人 `10001`、表单 `i6g1a_form_t100b` 及流程轨迹。
- H5 刷新后详情仍可回读。
- `u3_100` 在 PC 与 H5 访问该实例均可见 `/403`。

可回读证据：

- `evidence/i6-06/R4-VISIBLE-CROSS/browser-events.md`
- `evidence/i6-06/browser-media/R4-pc-positive-inbox.webp`
- `evidence/i6-06/browser-media/R4-h5-message-instance.webp`
- `evidence/i6-06/browser-media/R4-h5-refresh-instance.webp`
- `evidence/i6-06/browser-media/R4-pc-negative-403.webp`
- `evidence/i6-06/browser-media/R4-h5-negative-403.webp`

## R5 — 正式角色流程与抄送只读链：已完成

正式流程中的角色动作均由可见浏览器完成，具体链路如下：

- 流程定义：`2099686286806409218`；`processKey=bpm_25abb15a82254bf6`；业务键 `264cb225-8492-4f1d-a344-ee7c3d5ead38`；表单 `i6g1a_form_t100b`。
- 流程实例：`f42ba34b-b0ac-11f1-b25f-00ffa7734675`，状态 `APPROVED`。
- S1 任务 `f4305e48-b0ac-11f1-b25f-00ffa7734675`：T100 审批人在可见任务页完成“审批通过”。
- S2 任务 `1b18d91f-b0ad-11f1-b25f-00ffa7734675`：原审批人在可见任务页完成“委托”，委托到代理人 `2099538680528740353`，备注 `I6 R5 visible delegation`。
- 代理人 `i6_r5_proxy_1789404003476` 在可见任务页完成“审批通过”。
- 抄送记录 `2099687316675813378`，节点 `n_copy`，投递状态 `SUCCESS`；`u3_100` 在可见抄送页读取到流程、表单快照、业务键、节点及审批/委托轨迹。
- 管理员可见实例页显示流程已完成，并可见 S1/S2 角色轨迹表；流程图缺少对应定义时不作为本回执的主张依据。
- U0 用户在可见页面访问实例得到 `/403`，访问直接任务路由得到“任务不存在”，两条负向分流均已留存。

`setup-formal-flow.js` 仅执行确定性测试数据准备；`formal-flow-readback.json` 仅执行 UI 动作后的 API/数据库回读，均未代替正式角色操作。

可回读证据：

- `evidence/i6-06/R5-VISIBLE-FLOW/browser-events.md`
- `evidence/i6-06/R5-VISIBLE-FLOW/readback/formal-flow-readback.json`
- `evidence/i6-06/R5-VISIBLE-FLOW/readback/setup-stdout.json`
- `evidence/i6-06/browser-media/R5-s1-workspace.webp`
- `evidence/i6-06/browser-media/R5-s2-workspace.webp`
- `evidence/i6-06/browser-media/R5-delegatee-workspace.webp`
- `evidence/i6-06/browser-media/R5-copy-readonly-trace.webp`
- `evidence/i6-06/browser-media/R5-admin-flow-trace.webp`
- `evidence/i6-06/browser-media/R5-U0-instance-403.png`
- `evidence/i6-06/browser-media/R5-U0-task-not-found.png`

## R7 — 三仓内容指纹：已完成

已生成并可复算三仓内容指纹。脚本按仓库分别记录 base HEAD、工作树状态、差异文件、候选文件清单及 SHA-256 内容指纹；排除了构建产物、依赖、运行时数据库/日志和本轮证据目录的自引用。

- 脚本：`evidence/i6-06/R7-CONTENT-FINGERPRINT/scripts/generate-fingerprint.ps1`
- 清单：`evidence/i6-06/R7-CONTENT-FINGERPRINT/fingerprint-manifest.json`
- 清单侧车校验：`evidence/i6-06/R7-CONTENT-FINGERPRINT/fingerprint-manifest.sha256`
- 独立复算：`evidence/i6-06/R7-CONTENT-FINGERPRINT/recompute-output.json`
- 最终运行退出码：`0`
- sidecar 与实际清单 SHA-256 及独立复算结果一致。
- 三仓均保留 `DIRTY` 状态，但已由清单中的文件集合与内容指纹唯一化实际受测内容；未以 HEAD 代替受测内容身份。

## R8 — 五渠道外部条件：继续外部阻塞

按规划审查05锁定的 L33 边界，本轮不重复核验外部可用性。SMS、EMAIL、FEISHU、DINGTALK、WECHAT_WORK 的真实提供方条件、凭据/密钥和测试接收条件仍需 Owner 提供；本地可执行项 R3、R4、R5、R7 已收口，R8 是当前唯一剩余外部阻塞。

## 阶段结论

R3、R4、R5、R7 已完成并具备可回读证据；I6 仍保持 `VERIFYING`，P60 仍保持进行中。当前合法终态为等待 Owner 提供 R8 的五渠道真实条件，不得据此宣告 I6 或 P60 通过。

本轮未执行 push、commit、tag、Release 或任何外部发布动作。
