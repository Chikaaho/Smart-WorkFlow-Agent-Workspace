# G2a-state / G3a 具名测试与断言映射（原始输出行号）

原始文件：`server-system-biz-test.log`（SsoAuthServiceTest 29/0/0/0，行 8279-8281）与 `server-i5-boottest.log`（I5SsoBindingSessionBootTest 4/0/0/0）。测试源码：`sw-biz-system-biz/src/test/.../SsoAuthServiceTest.java`、`sw-bootstrap/src/test/.../I5SsoBindingSessionBootTest.java`。

## G2a-state
| 输入 | 具名测试:源码行 | 断言 | 原始输出 |
|---|---|---|---|
| state 不存在（篡改等价：任一未登记摘要） | handleCallback_unknownState_shouldReject: SsoAuthServiceTest | SsoRejectionException 且 errorKey=SSO_LOGIN_NOT_COMPLETED；审计 REPLAY/LOGIN_FAILED | 行 8279-8281（29/0/0/0 整类通过） |
| state 过期（TTL 300s，测试内操纵 expire_at） | handleCallback_expiredState_shouldReject | errorKey=SSO_LOGIN_NOT_COMPLETED | 同上 |
| state 重放（消费后再用） | handleCallback_replayedState_shouldReject | errorKey=SSO_LOGIN_NOT_COMPLETED | 同上 |
| Provider 错配 | （同套件 provider mismatch 用例） | errorKey=SSO_LOGIN_NOT_COMPLETED | 同上 |
| 非法跳转目的 | callbackPolicy_frontendPathComposition | `//evil`、外部 URL、非法基路径一律回落站内 fallback（不采用非法目的） | 同上（29 项内） |
| 真实 HTTP 佐证 | g2a-expired-bind-with-session.txt / negative-chain.log | 302 Location 携带脱敏 sso_error，业务码/审计为主断言 | 已提交 |

## G3a
| 场景 | 具名测试:源码行 | 断言 | 原始输出/实测 |
|---|---|---|---|
| 同主体重复绑定（运行时受控实测） | 本轮 G3a-candidate | HTTP 200 信封业务 400 `system.sso_binding_conflict`；原 FEISHU 绑定无变化 | `feishu-real-chain-01/g3a-conflict-g5-unbind-actual.txt` [conflict] 段 |
| 外部身份已被他人绑定 | bind_externalAlreadyBound_shouldReject: SsoAuthServiceTest:183 | SSO_BINDING_CONFLICT＋CONFLICT_REJECTED 审计 | 行 8279-8281 |
| 本地账号已绑其他身份 | bind_userAlreadyBound_shouldReject:197 | SSO_BINDING_CONFLICT | 同上 |
| 跨租户摘要冲突（V87） | bind_crossTenantDigestConflict_shouldReject:470 | 跨租户拒绝 | 同上 |
| 跨租户应用登记 | saveConfig_appRegisteredByAnotherTenant_shouldReject:456 | IllegalStateException 含"跨租户重复登记"＋审计 | 同上 |
| **租户停用（真实 status=1 翻转）** | bindingTicketSessionLifecycle:159-164 | 停用后票据兑换 → 业务 401 `system.sso_tenant_invalid` | **server-i5-boottest.log:1082 原文** |
| **租户停用既有会话收敛** | 同上:166-170 | 权威装载 me → HTTP 401 | **server-i5-boottest.log:1088 原文** |
| 恢复租户 | 同上:173-177 | status=0 后 me 200 | 同测试 |
| 角色撤销（运行时 API 实测） | 本轮 g3a-role-revoke | 分配后 me roles=['t100_admin']→撤销后 roles=[]（已建立会话收敛） | `feishu-real-chain-01/g3a-role-revoke-actual.txt` |

边界：角色撤销为 API 实测（分配→收敛→撤销→空）；租户停用为聚焦 BootTest 真实状态翻转（非过期替代）。
