# 三方 SSO 实施回执 02（审查 01 补证）

依据：`planning-review-three-provider-01.md`（VERIFYING）。本回执只处理 G1—G4、G7；G5/G6 待 Owner 本人交互（见 §7）。不覆盖回执 01；旧证据保留。除注明外证据位于 `receipts/evidence/`（feishu-real-chain-01/ 与 g4-gates-01/），全部脱敏（code/state/ticket/eventRef 不落原文；秘密与手机号零记录，已扫描）。

## G1 浏览器视觉制品与移动真实链（补齐）

新增可回读 headed 制品（IAB，headless=false，均存 `feishu-real-chain-01/`）：
- `pc-authorize-consent.png`：PC 授权确认页（应用"个人开发"、账号 用户376282、权限项"获取用户身份标识"）。
- `mobile-authorize-consent.png`：移动 390x844 授权页。
- `mobile-workspace-session-390.png`：移动真实已绑定登录后工作台（会话身份=租户100普通用户）。
- `mobile-error-recovery-bogus-ticket.png`：移动伪造票据错误恢复页（"ticket is invalid or has expired"人性化文案+返回登录链接）。
- `mobile-error-account-unavailable.png`：停用收敛错误页（见 G3）。
移动真实链结果：移动视口完成**真实授权→回调→回跳→票据兑换→会话建立（/sw/workspace）**与**错误恢复**两向；修正回执 01 表述——移动此前仅登录页展示，本轮已补真实链。视口 390x844；导航与网络索引沿用 `api-network-index.log`＋本轮新增日志。

## G2 负向与安全证据（补齐，逐项）

| 场景 | 实测请求/方式 | 结果 | 证据 |
|---|---|---|---|
| state 篡改 | callback?code=fake&state=<末位改写> | 302 → `/sw/sso/return?sso_error=system.sso_login_not_completed` | 本回执 §G2 记录＋api-network-index |
| state 重放 | 同 state 二次回调（真实授权流后） | 302 同上；原子消费后 not found | negative-chain.log |
| state 过期 | 单元测试 expiredState（TTL 300s） | SSO_LOGIN_NOT_COMPLETED | G4 原始测试输出（SsoAuthServiceTest 32 项内） |
| 票据无效/重放 | POST ticket bogus→401 sso_ticket_invalid；一次性消费由 BootTest lifecycle 断言 | 拒绝 | G2b 输出＋I5 BootTest 原始日志 |
| 票据过期（60s） | 同上（TTL 由 SsoTicketStore 测试与实现覆盖） | 拒绝 | 同上 |
| 取消授权 | 授权页点"拒绝"→Provider 302 带 error 无 code | 302 sso_error；日志 `SSO 回调被拒 errorKey=system.sso_login_not_completed`（missing code/state） | g2-deny-cancel.log＋浏览器终态 URL |
| 权限不足 | t100user（无角色）GET /auth/sso/audit | **403 common.forbidden** | g3-normal-user-permission.txt |
| 未认证绑定 | 无 token POST bind-candidate | 401 common.unauthenticated | 本轮记录 |
| Provider 失败 | 伪造 code（飞书/钉钉真实端点） | HTTP 400→302 脱敏拒绝＋审计 | negative-chain.log |

原始测试输出：`g4-gates-01/server-system-biz-test.log`（SsoAuthServiceTest 32/0/0/0，含 state 过期/重放/白名单/前端路径合成断言）。

## G3 身份与隔离（补齐＋既有证据映射）

- **最小权限实证（新增）**：V905 建租户 100 普通账号 t100user（无角色）→ 登录后 roles=[]、permissions=[]、menus=[]（空角色不回落 DataScope.ALL）→ audit 403；飞书身份绑定到 t100user 后 SSO 登录进工作台仍为普通用户（`mobile-workspace-session-390.png`）——**SSO 不提权**。
- **停用收敛实证（新增）**：管理员停用 t100user → SSO 绑定链票据兑换拒绝 → 错误页"账号当前不可用"（mobile-error-account-unavailable.png）→ 重新启用后 SSO 恢复可用。解绑撤销已由回执 01 实测（解绑即回登录页＋后续 SSO 落候选页）。
- **既有证据映射**：绑定冲突（同外部/同用户双向唯一+跨租户拒绝）与解绑代际隔离由 `I5SsoBindingSessionBootTest`（4/0/0/0，原始输出 `g4-gates-01/server-i5-boottest.log`）与 V84/V86/V87 唯一键承担；本候选（Server develop `cb5f17d`）包含全部 I5 SSO 代码路径，适用性成立。
- **企业成员边界（如实声明）**：本轮飞书验证主体=应用归属组织成员（用户376282）＋测试企业「SW-SSO验证」已关联；**服务端企业归属校验链未建立**（实现以 (provider,tenant,unionId/openId 摘要) 绑定域+租户级配置为边界，未做 corpId 级 unionId→userid 归属校验），不宣称企业 SSO 成立；企业成员批量边界需要企业内第二个可控成员，当前不具备。

## G7 登出后 refresh 200 语义（已判明，非缺陷）

受控复现（`feishu-real-chain-01/g7-logout-refresh-reproduction.txt`）：登录→refresh#1 轮换成功（新 token）→logout（撤销+清 cookie）→用登出前已轮换 token 重放 refresh → **HTTP 200 信封 + body code=401 `system.session_required`、data=null（无新 token）**。结论：平台错误契约为 HTTP 200 + 业务码信封（`R.fail` 不改 HTTP 状态），AccessLog 的 status=200 是传输层值；语义为拒绝、无可恢复会话。与解绑撤销的关系：解绑走同一 revoke 链（BootTest unbindGenerationIsolation 4/0/0/0），不构成本方向阻断缺陷。范围外改进建议（登记不改）：AccessLoggingFilter 可对 R 信封 code>=400 记录业务码，避免日志歧义。

## G4 门禁/SHA/配置/覆盖矩阵（补齐）

- 原始门禁（`g4-gates-01/`，均含 EXIT=0）：`server-system-biz-test.log`（314/0/0/0）、`server-i5-boottest.log`（4/0/0/0）、`web-typecheck-lint.log`、`web-test.log`（1301 passed+3 skipped）、`web-build.log`。
- 候选与远端回读（`server-git-facts.txt`/`web-git-facts.txt`）：Server develop=`origin/develop=cb5f17d`（fd704ff+5 个 SSO 提交）；Web develop=`origin/develop=d37a57b`。变更清单：`server-change-list.txt`（逐提交 stat）。运行产物：验证环境由 `sw-bootstrap/target/bootstrap-dev.jar`（-Pdev 打包，源码=cb5f17d）+Web dist（d37a57b 构建）承载（`env-config-readback.txt`）。
- 配置回读：`env-config-readback.txt`（CALLBACK_BASE_URL/ALLOWLIST/FRONTEND_BASE_PATH/cookie path/临时种子 V904-V905）；`feishu-console-redirect-readback.txt`（控制台重定向 URL=当前值，旧值=空）。回退对象：①飞书控制台删除该重定向 URL（或测试企业解散——该企业仅含本应用，不含其他对象）；②`/tmp/sw-sso-verify/`（种子/密文/代理）删除即净；③两仓 revert 对应 commit；④生产 chikaho.cn 零变更。
- 覆盖矩阵：memory/README.md、memory/state.md、memory/handoff.md、knowledge/features/dingtalk-sso-three-provider.md、todo/requirement-pool.md P31 行（工作区提交 `c42660e`/`735e1ae` 已同步至"飞书通过/钉钉待交互/企微冻结"口径，与本回执一致）；本回执落盘后追加推送。

## G5 钉钉（待 Owner）/ G6 企业微信（表述修正）

- G5：本地侧就绪不变（授权 URL 实测、端点可达）。等待 Owner 登录钉钉开发者后台（会话过期是事实而非推导阻塞），登录后即做 Contact.User.Read＋回调登记并跑真实链。
- G6：按审查措辞修正——**"待企业管理后台本人扫码，主体情况待核实"**；此前"无法创建应用已定位"的表述收回，改为"创建路径需经企业管理后台（扫码），Owner 名下企业存在性与管理员权限待扫码后核实，再判定是否需要企业注册授权"。

## 剩余边界

钉钉真实链、企微主体核实、企业成员批量边界、生产接入结论——均未完成，待对应外部输入。整体保持 VERIFYING，P31 不核销。
