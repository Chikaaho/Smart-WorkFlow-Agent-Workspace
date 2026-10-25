# 50:88 流程设置·结束通知配置与真实投递

2026-10-26｜Executor｜批次26，对应 W020-NOTIFY / 50:88 与 direction-ui-semantics-020「流程设置·通知」。

## 变更

- Server `63bd2e5..66ca50b`（codex/0.2.0-tenant-flow，已推送）：
  - `ProcessGraph.notification` 新增 `ProcessNotificationConfig`（initiator/approvers/otherRecipientIds/channels），随 graph_json 与发布快照冻结；旧定义 null 保持原行为。
  - 发布校验 `ProcessVariableValidator.validateNotification`：至少一个接收对象、至少一个渠道（IN_APP/EMAIL）、其他接收人必须是当前租户启用用户；失败以 2455 拒绝发布。
  - `ProcessEndNotificationResolver`：按实例冻结版本读取配置，解析发起人、参与人快照中的审批人、其他接收人（按当前租户启用用户复核），逐人产生事件；无配置走原发起人事件。
  - `BpmNotifyListener` / `BpmNotifyIntentRecorder`：配置渠道与平台路由渠道取交集；交集为空不投递/不登记、不虚报送达。
  - `BpmNotifyMessages.specFor`：仅发起人使用“您的申请已通过”；审批人/其他接收人使用中性“流程已通过 / 您关注的流程已审批通过”。
- Web `ec09d29..b5e52b1`（codex/0.2.0-ui-tenant-form-flow，已推送）：
  - 新增 50:88「流程设置」页 `/workflow/defs/:defId/settings`：通知/事件监听左导航；流程结束（发起人/审批人）、通知渠道（站内信/邮件）、其他接收人（UserRemoteSelect 多选）、保存；邮件提示以租户配置为准；事件监听页签只读列出现有触发器并回设计器维护。
  - 设计器工具条新增「流程设置」入口；该路由隐藏通用应用侧栏，按 50:88 独立页呈现。
  - 保存写回 `graph.notification`；发布仍走既有设计器发布，配置随版本冻结。
- `vite.config.ts` 在途改动未提交未触碰。

## 真实链（PG 18.4，t100admin@租户100）

1. **配置与发布**：A16 全链流程（id `2114316486343405570`，processKey `bpm_3e373530637b4888`）原已发布 v3；50:88 页加载显示旧定义默认（发起人+站内信，未配置提示）。勾选审批人、站内信+邮件，其他接收人选择 `无角色用户（t100nobody, 9101）`，保存成功；graph 草稿记录 `notification={initiator:true,approvers:true,otherRecipientIds:["9101"],channels:["IN_APP","EMAIL"]}`。回设计器发布成功，published_version 3→4；v4 冻结快照含 notification，v3 快照无 notification。
2. **实例消费**：新发起 A16 实例 `2114437173234184194`（defVersion=4）并审批通过；`sw_notify_message` 实际两行：
   - 9001（发起人兼审批人，去重）IN_APP PROCESS_APPROVED SUCCESS，标题“您的申请已通过”，内容“您发起的申请已审批通过”；
   - 9101（其他接收人）IN_APP PROCESS_APPROVED SUCCESS，标题“流程已通过”，内容“您关注的流程已审批通过”。
   - 配置虽含 EMAIL，但 `sw_notify_message` 无 EMAIL 行（租户邮件未配置/路由未返回），未虚报邮件送达。
3. **收件箱**：管理端 `/notify/inbox` 实际显示 03:22/03:32 两条“您的申请已通过”结果通知及此前历史，证明站内信可回看；t100nobody 无菜单角色，访问 `/notify/inbox` 被前端路由 404，但其 9101 消息行已 SUCCESS 落库，未把无菜单误报为投递失败。
4. **版本冻结/旧实例**：v3 快照无 notification，v4 快照有；老实例保持 defVersion=3，不追溯新配置；新实例 defVersion=4 使用新配置。
5. **重复去重**：`uk_sw_notify_msg_identity (tenant_id,event_type,biz_id,occurrence_no,recipient_id,channel)` 唯一；本次 9001 同时是发起人与审批人仍只产生一行，两接收人各一行；未重放重复 APPROVED 事件。
6. **跨租户负向**：在 50:88 页将其他接收人直接改成租户200用户 9201 并保存草稿，回设计器发布 → 服务端拒绝“其他接收人不属于当前租户或已停用: [9201]”，已发布 v4 不变；随后把草稿恢复为 9101 保存。

## 视觉与几何（真实浏览器）

- 1920×1080：设置页无通用应用侧栏；header x=20/w=1880，左导航 x=20/w=188，主卡 x=244/w=1158/h=378；流程结束/渠道/其他接收人三段可见；无横向溢出（scrollWidth=1920）。与 50:88 原稿的独立页结构、左导航/主卡位置对齐。
- 1366×768：主卡 x=244/w=1102，左导航 188，scrollWidth=1366 无横向溢出；事件监听页签显示 `A13发起标记 / PROCESS_START / 停用` 一条现有触发器，并提示在流程设计器维护。
- 修复后截图仍受宿主 surface preparation 超时/rAF 不触发/OS CopyFromScreen 句柄无效限制，本批无 PNG；以上为真实浏览器 DOM/computed style，A03—A05 正式像素未通过。

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **214 文件通过/1 跳过，1867 通过/3 跳过**、build 3.30s（`/tmp/web-fourgate-26.log`）。
- Server：`ProcessEndNotificationResolverTest` 4、`ProcessVariableValidatorTest` 9、`TaskNodeActionPolicyTest` 5、`TriggerExecutionServiceTest` 23，共 **41 通过/0 失败** BUILD SUCCESS（`/tmp/server-notify-test.log`）；bootstrap-dev.jar 重新打包并以 PG 18.4 运行，未声称整个后端全绿。

## 未验证/边界

- 邮件渠道未配置，实际未投递，未做 Provider 验证；页面仅提示以租户配置为准，不标“已送达”。
- t100nobody 无菜单角色，收件箱前端路由 404；其消息已由服务端 SUCCESS 落库，普通有菜单接收人的 UI 路径以 9001 管理端收件箱验证。
- 50:88 的事件监听页签本批只读承接现有触发器，编辑仍在流程设计器；W020 范围为结束通知，DR07 监听编辑未在本批扩展。
- 草稿 graph_json 保留原样字符串形式的 otherRecipientIds，服务端 `ProcessNotificationConfig` 解析为 Long 后校验/运行；功能链已按 Long 验证。
- 未重放重复 APPROVED 结束事件；去重由既有唯一身份索引与通知域托管，结果无重复行。
- W020 待 Planner 独立复核；0.2.0 IN_PROGRESS，未核销 P、未晋级基线。
