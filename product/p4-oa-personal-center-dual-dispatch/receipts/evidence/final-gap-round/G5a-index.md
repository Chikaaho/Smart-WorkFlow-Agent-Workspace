# G5a 索引：P0 父子命令同通道与有界返回时点

## §2 事实
- 被验证路径：真实 REST（POST /workflow/drafts/{id}/submit?channel=P0）→ CommandAcceptService P0 受理 → P0 车道调度 → DraftSubmitCommandHandler → FlowStartPortImpl（子命令继承 dispatchChannel）→ FlowStartCommandHandler → ProcessStartService。无替身。
- 场景输入：bizP0（持 workflow:p0:dispatch，/auth/me 读回）草稿 2096476051568553985 必填齐全。
- 结果判据：父/子命令 channel=P0 可读回；P0 同步返回有界且 COMPLETED；父子 id/时点可分查；实例发起人=本人。

## 断言→原件→实际值→结论
1. 有界返回 → g5a-p0-channel.out P2 → 145ms 内返回 status=COMPLETED（未超时、不诱导重复命令）→ 成立。
2. 父子同通道 → g5a-p0-channel.out P3/P4（API 读回）+ P4b（server-8080.log 原始行誊录）→ 父 DRAFT_SUBMIT channel=P0、子 FLOW_START channel=P0 → 成立。
3. 父完成不冒充子启动 → 父 finished=13:50:16.145525，子受理/完成=13:50:16.142787/16:372694（独立时点、独立 id 可分查）→ 成立。
4. 子不回 NORMAL 积压 → 子 channel=P0 且由 p0 车道消费（受理至完成 13:50:16.143→.374）→ 成立。
5. 业务结果同位 → 实例 businessKey=recordId=fe458ad4…、initiatorId=bizP0 本人；admin NORMAL 审批后实例 APPROVED（P6/P7）；父命令结果与 recordId 一致（P8）→ 成立。

## 边界
本轮补齐 P0 父子通道正向原件；NORMAL 积压下 P0 优先调度复用既有锁定（L4/审查03 B2），不重跑。
