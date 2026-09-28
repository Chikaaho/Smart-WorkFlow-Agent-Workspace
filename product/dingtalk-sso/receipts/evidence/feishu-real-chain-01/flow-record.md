# 飞书真实链验证流程记录（脱敏）

环境：本地同源验证（http://localhost:8081，/sw/ 前端 + /sw-server/api 反代；dev profile H2+devseed 租户 100「I5测试租户」）；浏览器：ZCode 可见 IAB（headless=false），PC 视口 1280x800 与移动视口 390x844。
身份：Provider 侧=用户376282（飞书自建应用 cli_aa30e5e269389cdc 授权页展示账号）；本地侧=t100admin（租户100管理员，userId=9001）。外部主体摘要前缀=6bb50608。URL 中 code/state/ticket 值一律脱敏。

## 链路时序（2026-09-28 22:00—22:16）
1. 授权发起：GET /api/auth/sso/FEISHU/authorize-login?tenantName=I5测试租户 → 200，authorizeUrl=accounts.feishu.cn/open-apis/authen/v1/authorize（client_id/redirect_uri/response_type=code/state）。
2. 真实授权：IAB 打开授权页（展示"获取用户身份标识"权限项）→ 点击"授权" → Provider 302 携带 code+state 回 http://localhost:8081/sw-server/api/auth/sso/feishu/callback。
3. 首次换票失败（旧 v2 端点）：飞书换票失败 HTTP 400（修复前）；后端 302 → /sw/sso/return?sso_error=system.sso_login_not_completed（脱敏拒绝页，URL 不含 code/state）。
4. 修复（commit 4f5454e，官方 v3 契约）：换票成功 → open_id → 无绑定 → 302 /sw/sso/bind?ticket=<一次性>；绑定页展示摘要前缀 6bb50608。
5. 绑定：Confirm binding → 未登录 → /sw/login?redirect=/sso/bind?ticket=… → 第一方登录 t100admin（dev 固定验证码门禁）→ 回绑定页 → Confirm binding → 302 /sw/workspace（会话=租户100管理员）。
6. 已绑定登录：登出 → 重新 authorize-login → 授权页（已授权应用快速确认）→ 授权 → callback 302 → **/sw/sso/return?sso_ticket=…&redirect=/workspace** → 回跳页 POST /api/auth/sso/ticket 200（服务端日志 "SSO 登录成功: userId=9001, provider-ticket"）→ 落 /sw/workspace。
7. 解绑失效：/sw/account/bindings 显示 Feishu=Bound(6bb50608…) → Unbind → 触发会话撤销回 /sw/login → 重新登录核对 Feishu=Not bound → 再次 SSO 授权 → 落 /sw/sso/bind?ticket=…（未绑定候选，解绑失效证明）。
8. 负向与安全：伪造 code 回调 → 真实 Provider 端点拒绝（飞书/钉钉均 400）→ 302 脱敏拒绝；同 state 重放 → 拒绝（state 原子消费）；票据重放/过期由 60s TTL+一次性消费覆盖（单元与 BootTest 断言）。
9. 移动 H5：390x844 视口下 /sw/login 正常渲染且 SSO Provider 区（WeCom/Feishu/DingTalk）可见可用（同会话守卫）。

## 配置事实（飞书控制台，授权内完成）
- 重定向 URL 登记：http://localhost:8081/sw-server/api/auth/sso/feishu/callback（安全设置，HTTP 明文被接受）。
- 测试企业「SW-SSO验证」创建（短信验证，Owner 本人完成）；应用已关联；测试人员=用户376282。应用无需版本发布即在该测试企业生效。
- 权限：未开通任何 API 权限（官方文档 users/me 基础字段权限要求"无"，零权限可行）。
- App Secret：经凭证页正常复制取得，仅存运行时受保护临时文件（/tmp，0600），未入仓库/日志/截图。

## 证据文件
- api-network-index.log：AccessLoggingFilter SSO 相关请求索引（method/path/status）。
- negative-chain.log：换票失败与重放拒绝原始日志（脱敏 eventRef）。
