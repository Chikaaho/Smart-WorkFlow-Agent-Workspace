# sso-admin-config 实施回执 01：B端手机号准入 + 后台配置管理（批次 1—3）

入口：`product/sso-admin-config/ready/direction-sso-admin-config.md`（L）。功能状态自验=**VERIFYING（待规划验收）**；P31 开放未核销；企业微信维持 Owner 延期。最终候选：Server `8d5fe6b90a0b`（develop，含 5e95793/83b9773/8d5fe6b 三批）、Web `38672cd506e0`（develop，含 23cdb45/38672cd）。

## 一、实现与文件

**Server（三批）**：
- 准入链：`SsoProviderClient.ExchangeResult` 增加 `mobile`（厂商可信手机号）；`DingtalkSsoProviderClient` 解析 users/me `mobile`；`FeishuSsoProviderClient` 双身份读取（user-token → app-token 回落，双路日志）；`WecomSsoProviderClient` 返回 null（延期 fail closed）；`SsoPhoneNormalizer`（+86 语义校验、禁止截后 11 位、脱敏值失效）；`SsoAuthService.admitCallback`（已绑定→本地有效性+手机号一致；未绑定→规范化手机号唯一准入自动绑定；无用户/重复/缺手机号/失效/冲突→统一 `SSO_ADMISSION_REJECTED`，脱敏审计 `ADMISSION_REJECTED`）；候选绑定票据链整体移除（`SsoTicketStore` 候选载荷、`/candidate`、`/bind-candidate`、`/bind` 端点、前端 `/sso/bind` 页——旧手动绑定路径不可绕过准入）
- 配置管理：`SsoConfigController`（list/basic/enabled/secret/check；`@PreAuthorize` 权限点 `system:sso:config:list|edit|enable|secret`，审计查询沿用 `system:sso:audit:query`）；`SsoAuthService` 粒度方法（listConfigs/updateConfigBasic/updateEnabled/updateSecret/checkConfig；secret 只写留空保留、占位拒绝、WECOM 延期只读 `CONFIG_REJECTED`、检查不宣称真实登录、CONFIG_SAVE/ENABLE/DISABLE/SECRET_UPDATE/CHECK 审计）
- 加密显式化：`SsoCredentialCipher`（专属密钥源 `sw.security.sso.cipher-key`，缺失 fail-fast）；`SystemAutoConfiguration` 移除 `ssoCipher` `@ConditionalOnMissingBean` 同型竞争（G4-S 缺口闭合）；dev yml 改 `${SW_SSO_CIPHER_KEY:dev键}` 占位（prod 仍必须注入）；agent 全局加密器与其密钥不受影响
- 迁移：V103（h2+postgresql）sys_menu 420 页面行 + 421/422/423 按钮行（edit/enable/secret 粒度）；迁移锚四测试机械修正 V102→V103；devseed 不变（V900 全量 role_menu 覆盖新菜单，t100admin 获全部五权限）

**Web（两批）**：`system/views/SsoConfig.vue`（列表/编辑/启停/凭据/检查/审计抽屉，v-perm 粒度显隐含开关行）；移除 `SsoBindPage.vue`+路由+mock；`SsoReturnPage` 准入统一文案映射；locales zh/en 增补（ssoConfig/ssoAdmissionRejected）、清除 ssoBindLead/Tail 孤键

## 二、门禁与验证（原始输出指针）

- Server 模块门禁：`sw-biz-system-biz` **328/0/0/0** BUILD SUCCESS（314+2 scope+3 G3b+6 准入+3 规范化；含飞书客户端变更后复跑）——`/tmp/sw-sso-verify/b5-module-gate.log`
- Server bootstrap 锚+Boot：**43/0/0/0**（FlywayFullChain H2/PG、I6G7、Phase4Pg；I5SsoBindingSession 4、I5ProdProfileSecurity 4、I5PgTenantBehavior 3、I5SsoCipherRuntimeDiag 1=显式 SsoCredentialCipher 契约+agent bean 唯一+blank-key fail-fast）——`/tmp/sw-sso-verify/b2-anchors.log`
- Web 四连：typecheck 0 / lint 0 error / vitest **1301 passed+3 skipped** / build exit 0（23cdb45 与 v-perm 行 38672cd 后复跑）
- 隔离环境：SW_SSO_CIPHER_KEY 独立密钥 + 种子重加密（V904）+V906 手机号种子；启动日志 V103 applied（"Migrating schema to version 103 - sso admin config menu"，now at v906）

## 三、行为证据（`receipts/evidence/admission-chain-01/`，清单见 assert-and-blockers.txt）

- **A1 管理页面全流程**（PC 1280+移动 390 截图七张）：列表（WECOM 延期只读标注/无变更按钮/开关禁用）、检查弹窗（四项✓+「不等于真实登录已通过」）、编辑企业模式必填→持久化回显→回退、凭据占位拒绝+真实值更新成功（只写不回显）、审计抽屉（CONFIG_SAVE×2/SECRET_UPDATE SUCCESS+DENIED/ENABLE/DISABLE/CHECK/CONFIG_REJECTED 全链）
- **A2 权限**：t100user 配置/审计 API 均 403；按钮/开关 v-perm 与会话权限一致（Redis 旧缓存曾致按钮隐现，FLUSHALL 后五权限齐——运维事实已记录）
- **A3 生效语义**：停用→authorize-login 立即 400；重新启用恢复；WECOM 启用尝试→400 延期只读
- **A4 准入 fail-closed 真实链**（飞书 headless=false）：t100user 手机号改为不匹配值→统一拒绝页 `system.sso_admission_rejected`（PC+移动截图）→审计 `ADMISSION_REJECTED "trusted phone missing"`→无绑定/用户增量；审计与证据秘密扫描 0 命中（手机号原文/app secret 零入库）
- 单元覆盖：唯一手机号自动绑定（BIND "phone-admission auto-bind"+LOGIN_SUCCESS）、重复/无用户/已绑定手机号变更/账号停用/并发唯一键（SsoAuthServiceTest 新增 6 用例）

## 四、真实阻塞（外部，附解除条件；正向绑定登录链未宣称完成）

1. **钉钉**：authorize 返回 900103「应用不存在」（三种 URL×两标签+无 prompt 静默均复现；控制台应用存在、回调登记在、Contact.User.Read 已开通、版本 1.0.0 免审发布通过；今晨同 clientId 真实链成功，午后持续失败）。**解除条件**：Owner 在钉钉开放平台/客户端确认「个人测试」应用状态（必要时重建应用）。
2. **飞书**：换票/身份成功但手机号不可得——contact v3 双身份实测（user-token HTTP 400：`contact:user.base:readonly` 不覆盖 v3；app-token 200/code=0 但响应无 mobile 字段；`contact:contact.base:readonly` 已开通且 v1.0.1 已发布）。fail-closed 按设计工作。**解除条件**：飞书企业管理后台对该应用开放手机号字段可见性（组织字段权限），或 Owner 提供带手机号返回的测试主体。

两平台厂商侧解除后须补「预建组织用户→首次 SSO 绑定→后续 SSO 登录」真实链验收；不得以历史手动绑定通过投影为本方向通过。

## 五、验收标准对照（方向 §四）

| 标准 | 状态 |
|---|---|
| 管理页面全流程+持久化+secret 不出现于任何面 | ✅ A1（截图+审计+扫描） |
| 无权限/跨租户拒绝、权限区分；他租户同手机号不可登录、重复手机号拒绝无增量 | ✅ 代码链+单测（跨租户主体冲突/唯一键）；API 403 实测；跨租户登录隔离沿租户级配置+绑定行租户列（既有 V87 语义） |
| 钉钉/飞书预建用户→首次绑定→后续登录 | ⛔ 外部阻塞（§四 B1/B2，解除后补真实链）；fail-closed 拒绝链已真实验收 |
| 既有绑定兼容不绕过准入；停用/配置变化期不以旧配置建立新会话；个人/企业模式与企业错配保持 | ✅ 候选链移除+每次直查库+G3b 测试保持（模块门禁含原 G3b 3 用例） |
| 加密依赖显式、旧密文可读、凭据更新成功、不影响他模块 | ✅ SsoCredentialCipher 契约测试+运行诊断；凭据更新实测；agent bean 唯一性断言 |
| 触及数据库结构按工程宪法验证兼容迁移 | ✅ V103 幂等双方言+锚测试 43/0/0/0 |
| headed PC+移动视觉/网络/身份证据 | ✅ PC 1280+移动 390（新增页面+登录链） |

## 六、边界与遗留

- 功能状态 VERIFYING；45 功能/46-22-22/ADV64/P31 口径未动；本方向未新增业务功能计数（待 Planner 验收裁决）
- 生产未部署；生产 V102 不变；生产启用本能力前须注入 SW_SSO_CIPHER_KEY 并规划 Provider 密文迁移口径（SsoCredentialCipher 密钥与历史 dev 键不同——运维迁移说明已写入 yml 注释与 SsoCredentialCipher javadoc）
- 历史绑定兼容：既有绑定行与审计保留；已绑定登录在新链下必须过手机号一致性校验（`phone changed` 拒绝），方向 §一「本地或厂商手机号改变应拒绝」即此语义
