# 三方 SSO 实施回执 03（一级补证提示 01 账本）

入口：`planning-execution-prompt-three-provider-01.md`（唯一补证入口）；依据审查 02。功能保持 VERIFYING；P31 不核销。飞书记录口径=**真实链自验已提交，规划补证中**，不投影为 Planner 验收。G5/G6 待 Owner 本人交互（§7），其余账本项本轮闭合。

## G4-S 运行密钥独立性冲突（已核实并隔离替换）

**核实结论：非转录错误，实际即仓库公开 dev key。** 回执 01/探索回执所称"独立 cipher key"为错误声明；encrypt 脚本实际引用 `application-dev.yml` 的公开开发密钥。
处置：①生成仓库外独立密钥（/tmp/sw-sso-verify/independent-cipher.key，0600，32B 随机）；②V904 以独立密钥重加密（/tmp 种子重写，旧 dev-key 密文被覆盖删除）；③后端以独立密钥重启成功（AEADBadTag=0），authorize-login code=0 回读非秘密属性（enabled 校验+解密链通）；④暴露范围核查：真实 secret 明文与独立密钥从未进入仓库/证据/回执/命令行参数（grep 验证仓库无该密文；独立密钥仅存 /tmp 0600）；dev-key 密文仅存在于本机 /tmp 且已删除，未发生仓库/公共日志暴露，无需扩大处置。
**实施事实（供复核）**：SSO 实际生效加密器为 agent 模块 AesGcmCipher（`@ConditionalOnMissingBean` 注册顺序顶替 `ssoCipher`），其密钥源=env `SW_CIPHER_KEY`——已与 V904 同钥切换；`SW_SSO_CIPHER_KEY`/`SW_SECURITY_SSO_CIPHER_KEY` 等 env 名不生效的原因=dev yml 为字面量且该键由 @Value 精确名解析（过程详见本轮排查记录，非实现缺陷）。WECOM 哨兵行已停用（V904 内，本轮不验证）。

## G2a state/票据生命周期（受控 HTTP 实测，原始响应在案）

证据：`feishu-real-chain-01/g2a-ticket-lifecycle-actual.txt`（过期组）＋`g2a-ticket-bind-replay-actual.txt`（重放组）。逐项（**以业务码与绑定表断言，不以 302 断言**）：
- 票据有效：candidate peek 200（digestPrefix 6bb50608）。
- **票据过期**：候选票据静置 61s（TTL 60s）→ peek/bind-candidate → 401 `system.sso_ticket_invalid`。
- **票据重放**：bind-candidate 首次消费 200 → 同票再消费 → 401；candidate 同票再 peek → 401。
- **state 篡改**：callback?state=<末位改写> → 302 `sso_error=system.sso_login_not_completed`（state not found，审计 LOGIN_FAILED）。
- **state 过期**：单测 `handleCallback_expiredState_shouldReject`（断言 errorKey=SSO_LOGIN_NOT_COMPLETED；原始输出行见 server-system-biz-test.log SsoAuthServiceTest 段）。
- **state 重放**：真实授权流后同 state 二次回调 → 拒绝（negative-chain.log）。
- **非法跳转**：`resolveFrontendPath` 单测断言 `//evil`/外部 URL/非法基路径一律回落站内 fallback（frontendPathComposition；原始输出同上）；controller `safeRedirect` 双保险。
- **反向断言**：全部拒绝前后 `GET /auth/sso/bindings` 由 `[]` → 拒绝后仍 `[]`/成功恰增 1（绑定表以 API 实读）。

## G2b Provider 侧三类（输入↔结果一一对应）

- 取消授权：输入=授权页"拒绝"→Provider 302 带 `error=access_denied`（无 code）→ 我方 missing code/state 拒绝 → 302 脱敏错误页；日志 `SSO 回调被拒 errorKey=system.sso_login_not_completed`（`g2-deny-cancel.log` 22:37:48 行）。
- Provider 失败：输入=伪造 code → 真实换票端点 HTTP 400（飞书/钉钉均实测）→ 302 脱敏错误页＋审计 LOGIN_FAILED/FAILED（negative-chain.log）。
- 权限不足——**适用范围分述**：本地 403（t100user audit，`common.forbidden`）是**本地权限链**证据；**Provider 侧权限不足不适用**——飞书 users/me 官方契约权限要求"无"（基础字段），未申请敏感 scope 即不存在 Provider 权限拒绝路径，按账本以官方契约说明，不强开权限制造失败。

## G3a 隔离矩阵（既有断言映射＋本轮实证）

`g4-gates-01/g3a-bootest-assertion-mapping.md`：逐场景→测试方法:行→断言语义→候选适用性（BindingTicketSessionLifecycle/租户过期收敛/解绑代际隔离/冲突绑定唯一键/空角色）。本轮新增运行实证：普通账号不提权（roles/perms/menus 空＋audit 403）与停用收敛（票据兑换拒绝→错误页）。**未重做**独立运行时演示的项（租户停用/角色撤销）以既有断言＋候选适用性成立如实标注。

## G3b 飞书成员归属边界（能力差异与可行范围）

实际官方字段：users/me 返回 open_id/union_id/tenant_key；实现稳定标识=open_id（应用内唯一），绑定域=(provider, tenant_id, 摘要)。**现有契约的能力边界**：企业归属闸门=①授权换票的可用范围（20010）②本地租户级配置与绑定域；**缺失**：sys_tenant 无企业标识字段、未做 unionId→corpId 级归属校验、tenant_key 未参与校验——即"配置了该飞书应用的任何可授权账号均可进入其绑定的本地租户"，满足个人/可控范围，**不满足**"验证配置企业与身份归属"的企业级要求。补齐需：租户表增企业标识＋换票后归属断言（或 scope/接口取企业身份）——属新身份模型与数据模型决策，**提交 Planner 裁决**；缺第二成员不视为已实现校验。个人测试范围不升级为企业 SSO。

## G1a/G4a/G4b

- G1a：`feishu-real-chain-01/g1a-mobile-chain-correlation.md`——390×844 制品（3 张，sips 实测）与带时点请求/业务结果关联；1280 制品更名（mobile-error-account-unavailable→**pc**-error-account-unavailable、mobile-workspace-after-bound-login→**pc**-workspace-after-bound-login），1280 一律不标移动。
- G4a：**更正**——回执 02 称"SsoAuthServiceTest 32 项"系转录错误，原始输出为 **29 项**（模块总 314 一致），不重跑；运行产物指纹 `g4-gates-01/runtime-artifact-fingerprint.txt`：bootstrap-dev.jar sha256 `a4f22e6d…65165`（219,628,269B，Server cb5f17d -Pdev 构建）、dist 聚合 sha256 `42c8963a…2da3`（Web d37a57b 构建）、运行进程 pid 97836 起始 23:24:50（cmdline 指纹不含密钥值）。
- G4b：五个入口（memory README/state/handoff、knowledge/features/dingtalk-sso-three-provider.md、todo P31 行）已改为"**真实链自验已提交，规划补证中**"口径并逐文件落盘（本次提交内含实际值与时间）；回退对象限定：飞书重定向 URL 本条、测试企业（仅含本应用）、/tmp/sw-sso-verify 全目录、两仓对应 commit revert；生产零变更。

## G5/G6（外部依赖，非冻结其他项）

- G5：钉钉控制台登录（Owner）→ 配置 Contact.User.Read＋回调 URL（回读）→ 真实链。
- G6：企微管理后台扫码（Owner）→ 核实主体/管理员权限/创建入口实际结果 → 判定是否需要企业注册授权；不预设主体缺失。

## 自检

逐项 ID→证据文件→结果→边界已对应；原始对象未错配（截图尺寸实测、日志行时点固定）；秘密/密文/手机号零入库（已扫描）；计数与原始输出一致（29 项更正）；候选 cb5f17d/d37a57b 适用；无已授权可执行项被报为等待 Owner。本轮无新增实现代码，不触发全量门禁重跑；既有门禁结果（采集时点）按审查 02 锁定引用。
