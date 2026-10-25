# v7 实例消费结束通知：接收人文案与首节点触发器复核

2026-10-26｜Executor｜批次35，补批次29 边界“v7 新实例收件人/通知未重跑”；同时复核 v7 首节点触发器与通知配置保留。

## 真实链（PG 18.4，t100admin@租户100，1920 可见会话）

1. v7 实例 `e9e0cb29-d0b4-11f1-a397-00ff9e2a8dfb`（defVersion=7，流程 `bpm_3e373530637b4888`，发起人 9001）由表单 `a11_events_probe` 真实提交创建；当前任务 `e9ebeec6-...`（node_1 主管审批，办理人 9001）。
2. 在任务详情点击“同意”→审批确认“通过”，受理后状态成功；`sw_bpm_instance.status=APPROVED`。
3. `sw_notify_message` 实际两行（同一结束事件 occurrence_no=1）：
   - 9001：IN_APP / SUCCESS / “您的申请已通过 / 您发起的申请已审批通过”（发起人兼审批人，去重后一行）；
   - 9101：IN_APP / SUCCESS / “流程已通过 / 您关注的流程已审批通过”（其他接收人，中性文案）。
   配置含 EMAIL，但无 EMAIL 行；未配置邮件渠道，不虚报送达。
4. `sw_bpm_trigger_exec` 实际一行：`node_enter_node_1 / NODE_ENTERING / node_1 / result=true / UNMATCHED`，证明 v7 首节点触发器在实例落库后补执行。
5. v7 通知配置来自 50:88 保存 → 设计器保存/发布保留修复后的快照：`{initiator:true,approvers:true,channels:["IN_APP"],otherRecipientIds:["9101"]}`；旧 v4/v6 实例不被追溯。

## 覆盖矩阵回填

- 50:88 流程设置·通知：补充 v7 实例真实消费证据（26、29、35）。
- 273:1095 流程触发器：补充 v7 实例真实执行（30、35）。
- 273:1305 节点触发脚本：补充 v7 消费（30、35）。

## 门禁

- 本批无源码改动；Web 沿用批次32 四连 **215 文件/1871 通过/3 跳过/build 4.20s**；服务端沿用 `83f58d0`。
- 未触碰 `vite.config.ts` 与根工作区在途治理文件。

## 未验证/边界

- 邮件 Provider 未配置，仍无 EMAIL 投递；只有站内信真实落库。
- 9101 无菜单角色，未在本批重开其收件箱前端；消息行已 SUCCESS 落库，管理端 9001 收件箱此前已验。
- 未重放重复 APPROVED 结束事件；去重仍由唯一身份索引与既有通知域托管。
- 无修复后截图（宿主 surface/rAF/OS 捕获限制），同态像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
