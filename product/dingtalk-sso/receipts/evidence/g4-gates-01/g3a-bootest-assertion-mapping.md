# G3a 既有测试断言与候选适用性映射

候选：Server develop `cb5f17d`（含全部 I5 SSO 路径与 V84/V86/V87 约束）；原始输出 `g4-gates-01/server-i5-boottest.log`（I5SsoBindingSessionBootTest 4/0/0/0，EXIT=0）。测试文件 `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/i5/I5SsoBindingSessionBootTest.java`（67 处断言）。

| 场景 | 测试方法:行 | 具体断言（行为语义） | 适用性 |
|---|---|---|---|
| 绑定→票据→会话生命周期 | bindingTicketSessionLifecycle:125 | 候选票据消费=一次性；绑定后 (provider,tenant,digest) 唯一；ticket 兑换签发本地会话；重复消费被拒 | 同一路径本轮真实链已复现（G2a 实测重放 401） |
| 租户过期收敛＋解绑 | expiredTenantAndUnbindConvergence:202 | 租户过期后回调/兑换拒绝（fail closed）；解绑触发会话撤销与 refresh 全代撤销；REPLAY DETECTED 拒绝（日志可见） | 租户停用同链路（TenantValidityService 统一校验）；本轮 22:13-22:15 真实解绑复现撤销 |
| 解绑代际隔离 | unbindGenerationIsolation:347 | 旧 refresh token 代际重放被拒（REPLAY DETECTED，userId 隔离）；A/B 会话互不复活 | 与 G7 实测一致（信封 401） |
| 冲突绑定/跨租户 | V84 双唯一键 (provider,tenant,external)/(provider,tenant,user)＋V87 全局摘要唯一＋bind() 双向冲突拒绝与 DuplicateKeyException 兜底（SsoAuthService.bind L465-523） | 同外部身份二次绑定/跨租户绑定 DuplicateKey/显式拒绝 | 单测 SsoAuthServiceTest 覆盖 bind 冲突路径（32 项内，原始输出 server-system-biz-test.log）；本轮未造第二外部身份，不重复断言 |
| 角色撤销/空角色 | SsoAuthService 登录装载走既有 LoginUser 权威（不写 sys_user_role）；空角色不回落 ALL | 本轮新增实证：t100user（无角色）SSO 登录后 roles/perms/menus 空、audit 403（g3-normal-user-permission.txt） | 角色撤销等效收敛（装载即当前角色，无 SSO 侧缓存旁路） |

边界：租户停用与角色撤销未在本轮重做独立运行时演示（既有 BootTest 断言＋候选适用成立）；企业成员归属校验未实现（见 G3b）。
