# G6b 索引：跨租户读隔离 + 拒绝后同车道后续命令身份正确

## §2 事实
- 被验证路径（读隔离）：CrossTenantReadIsolationTest（sw-bootstrap）＝真实 BpmDraftService/BpmInstanceService + 真实 MyBatis-Plus TenantLineInnerInterceptor + 真实 H2/Flyway；运行报告见 g8b 清单（Tests run: 2, Failures: 0, Errors: 0）。
- 被验证路径（撤权窗口+同车道后续）：双进程文件库真实运行（phase1 轮询暂停受理 → 停用用户 X → 停止；phase2 同库恢复消费），原件 g4a-g6b-phase1.out / g4a-g6b-phase2.out / 两 phase 服务器日志。
- 结果判据：A 不能读取/修改 B 租户对象；拒绝命令与后续命令同车道顺序处理且后续业务对象归属正确。

## 断言→原件→实际值→结论
1. 读隔离（getById/list/update）→ CrossTenantReadIsolationTest.crossTenantDraftReadIsolation → 租户2 用户 getById(tenant1 草稿)=null、列表不含、updateById=false；租户1 本人读回内容未变；同租户他用户可见 → 成立。
2. 实例读隔离 → crossTenantInstanceReadIsolation → 租户2 getById(8901)=null；租户1 读回 businessKey=biz-cross-tenant-1 → 成立。
3. 撤权消费拒绝 → g4a-g6b-phase2-server.log 16:15:16.358 `命令消费前安全门禁拒绝: commandId=2096512346426540034, reason=发起用户不存在、已停用或租户不匹配` + `草稿提交终态失败: draftId=2096512346132938753`（phase1 A5 已停用 X：PUT /system/user status=1 code=0）→ 拒绝发生在受理前持久化之后、消费时真实身份回查 → 成立。
4. 同车道后续命令身份正确 → g4a-g6b-phase2.out B1/B4/B6 + 服务器日志顺序 → 同一 bpm-command-dispatcher 车道：16:15:16.358 X 拒绝 → 16:15:16.412 Y 命令开始 → 16:15:16.460 完成（COMPLETED，recordId=f8b69244…）→ 实例 2096512546893307906 initiatorId=2096512341871525889（=Y 本人，非残留 X）→ APPROVED（B6）→ 前一身份/租户未留给后一命令 → 成立。
5. 复用既有撤权窗口 → L10（g6b2-phase1/2，审查05已锁）不重做；本轮补的正是"拒绝后同车道后续命令归属关联"（审查05 §3 对 R9 的指认）→ 成立。

## 边界
- X 的命令/草稿终态 API 不可读（查询限发起人、发起人已停用）——以 phase2 服务器原始日志行为原件（拒绝原因与 draftId 全文誊录于 B2）。
- 非零租户受理前拒绝（单测层级，never enqueue）为审查05已接受项，不重做。
