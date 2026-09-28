# 三方 SSO 真实接入实施回执 01

方向：`product/dingtalk-sso/ready/direction-three-provider-sso-20260928.md`（L）。
执行窗口：2026-09-28。状态：**执行中（自验部分通过；钉钉/企业微信两项待 Owner 本人交互，非执行方可解除）**。不自宣 PASSED/COMPLETED，不核销 P31。

## 1. 目标 A：共用回调与同源前端返回链（已完成，真实链验证）

四个真实缺陷全部修复（Server develop，均已推送）：
- `98e0034` callback 由 JSON 200 改真实 302 同源回跳；新增 `sw.security.sso.frontend-base-path`（`SW_SSO_FRONTEND_BASE_PATH`）前端基路径合成，含开放重定向防护（`resolveFrontendPath` 拒绝 `//`、外部 URL、非法基路径；单测 callbackPolicy_frontendPathComposition）。
- `edd7a02` 回调入口归一化 provider 大小写——`resolveCallbackUrl` 生成小写路径而 `PROVIDERS`/state 存储大写，真实 Provider 回跳必被拒（真实链未执行暴露的断链）；回归测试 handleCallback_providerCaseNormalized。
- `49b5f9f` 已绑定登录统一经 `/sso/return` 兑换票据（`redirect_path` 转为兑换后去向参数）——修复直接 302 工作台路径无人消费票据的断链。
- Web `d37a57b` 回跳页支持 `sso_error` 拒绝分支、移除未用 XHR 回调函数、登录页 Provider 文案改 i18n（修复企微显示"微信"）。

验证：负向链 curl 实测（伪造 code→302 脱敏拒绝；state 重放→拒绝）；飞书真实链浏览器全程走通（见 §2）；门禁 Server system-biz **314/0/0/0** + I5SsoBindingSessionBootTest **4/4**（终态代码复跑）、Web **1301 passed+3 skipped**、typecheck/lint/build exit 0。

## 2. 目标 B：飞书真实链（已完成六段）

真实结果（非配置推断）：授权（用户376282，权限项"获取用户身份标识"）→ Provider 302 回调携带 code+state → v3 换票成功 → open_id 稳定主体（摘要前缀 6bb50608）→ 第一方登录后绑定 → 已绑定登录（服务端日志 `SSO 登录成功: userId=9001, provider-ticket`；`POST /api/auth/sso/ticket 200`；浏览器落 /sw/workspace）→ 解绑触发会话撤销 → 重新 SSO 落候选绑定页（失效证明）。负向：伪造 code Provider 端点 400、state 重放拒绝。移动 H5 390x844 视口登录页 SSO 区可用。证据：`receipts/evidence/feishu-real-chain-01/`（flow-record.md + 脱敏日志索引）。

实施中发现并修复：飞书换票旧 v2 端点实测 HTTP 400（`4f5454e` 升级官方现行 v3 契约 `accounts.feishu.cn/oauth/v3/token`，form 表单 + redirect_uri 回传 + 平铺响应兼容解析；SPI `exchangeExternalId` 增加回调 URL 参数，钉钉/企微实现签名对齐）——符合方向"官方文档+实际响应双证后替换"。

配置事实：飞书控制台重定向 URL 已登记；测试企业「SW-SSO验证」创建并关联应用（Owner 短信验证本人完成）；零 API 权限（官方 users/me 基础字段无权限要求）；App Secret 经正常页面取得仅存运行时受保护临时文件。个人测试范围与企业成员边界：本轮授权账号=应用归属组织（用户376282的组织）成员，测试企业关联完成但**企业成员批量边界未验证**（无第二个可控飞书成员），如实报告为个人/可控范围验证。

## 3. 目标 B：钉钉（执行就绪，待 Owner 控制台登录）

本地侧全部就绪：authorize-login 实测生成正确授权 URL（client_id/redirect_uri/scope=openid/prompt=consent）；负向链证明 `api.dingtalk.com/v1.0/oauth2/userAccessToken` 可达且凭据格式被处理（伪造 code → HTTP 400）。**剩余两步需 Owner 本人**：①开发者后台会话已过期（浏览器停在登录页）→ 登录后我完成 Contact.User.Read 权限开通与重定向 URL 登记；②真实授权页本人确认。此前回执指出的控制台缺口（权限/回调未配置）未变。

## 4. 目标 B：企业微信（按诊断冻结）

无法创建应用原因已定位（探索回执）：企业管理后台独立扫码会话缺失 + 名下企业存在性未确认。企业注册属单列授权。冻结该项，不阻塞他项；诊断证据见 `search_fallback/feishu-wecom-sso-readiness-20260928.md`。

## 5. 验收边界对照
- A 共用回调：**达成**（真实浏览器 302 链 + 负向拒绝）。
- B 三平台：飞书**达成**；钉钉待①②；企微冻结（主体资格）。
- C 身份隔离：绑定/冲突/跨租户由既有权威链承担（V86/V87 唯一键 + BootTest 4/4）；本轮新增真实主体摘要 6bb50608 固定记录。
- D 安全与恢复：state 篡改/过期/重放、伪造 code、脱敏拒绝页实测；秘密/手机号零残留（证据文件已扫描）。
- E 页面与回归：PC+移动视口真实链与错误恢复页实测；两仓门禁全绿。
- F 配置与交付：回退清单=飞书重定向 URL 删除、测试企业解散、`/tmp` 种子与密钥文件删除、两仓 revert 对应 commit；生产未触碰。

## 6. 遗留与风险
- dev H2 内存库重启即重置绑定行（验证环境特性，非缺陷）；生产配置行仍需正式方向下的部署授权。
- 观察项（不在本方向范围）：第一方 logout 后 refresh cookie 疑似未即时失效（实测登出后静默 refresh 200），建议另立缺陷核实。
- todo/requirement-pool.md P31 行含 Planner 未提交登记与本次执行进度（一并提交，见工作区批次）。

## 7. 自验结论
飞书真实链与共用回调修复自验通过（真实行为证据）；钉钉/企业微信为外部依赖未完成，不构成整体完成。等待 Planner 验收与钉钉/企微 Owner 交互排期。
