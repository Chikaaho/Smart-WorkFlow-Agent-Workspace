# G1a 对象与关系

- 租户 T=100；发起人 u1_100(id=10001)；审批人 u2_100(id=10002)
- 草稿：2099430369473015810（I6G1A 审批单-006，formKey=i6g1a_form_t100b）
- 流程实例 P（G1a/G4/G6 同一集合）：`d018f57a-b01e-11f1-9198-00ffa7734675`（businessKey=命令 result recordId）
- 任务 K：`d0191c97-b01e-11f1-9198-00ffa7734675`（TODO_CREATED messageId=2099430373809926145）
- 动作 A=APPROVE（命令 2099430374522957825，duplicated:true 幂等回照）
- 消息 M（PROCESS_APPROVED，G4 浏览器深链对象）：IN_APP=2099430376456531969（SUCCESS）；EMAIL=2099430376506863617（FAILED，attempt=1 RETRYABLE）
- 规则：I6G2G_R101（tenant 100，PROCESS_APPROVED，IN_APP,EMAIL，RETRY 失败策略）
- EMAIL 失败注入：真实 SMTP 127.0.0.1:2525 至今无监听（真实环境失败，非桩）——发送器投出 IllegalArgumentException，权威失败类 RETRYABLE
