# G5：三 Provider `nonce` 官方支持映射（I5 复验 02）

> 调研日期：2026-09-13；来源为各 Provider 开放平台官方文档。

## 结论矩阵

| Provider | 授权端点 | 官方支持的防重放参数 | `nonce` 官方支持 | 官方文档 |
|---|---|---|---|---|
| 企业微信 | `https://open.weixin.qq.com/connect/qrconnect`（扫码）/ `/connect/oauth2/authorize`（网页授权） | `state`（非必填，`a-zA-Z0-9`，≤128 字节，授权后原样回传，官方建议携带防 CSRF） | **不支持**（授权端点无 `nonce` 参数） | 构造网页授权链接：https://developer.work.weixin.qq.com/document/path/91022 ；网页授权链接（新版，state ≤128 字节）：https://developer.work.weixin.qq.com/document/path/96714 |
| 飞书 | `https://accounts.feishu.cn/open-apis/authen/v1/authorize` | `state`（标准 OAuth2，原样回传防 CSRF）；授权码有效期 5 分钟 | **不支持**（authorize 端点无 `nonce` 参数；非 OIDC id_token 流） | 获取授权码：https://open.feishu.cn/document/authentication-management/access-token/obtain-oauth-code?lang=zh-CN ；获取 user_access_token(v2)：https://open.feishu.cn/document/authentication-management/access-token/get-user-access-token?lang=zh-CN |
| 钉钉 | `https://login.dingtalk.com/oauth2/auth` | `state`（标准 OAuth2，原样回传）；code 经 `/v1.0/oauth2/userAccessToken` 换票 | **不支持**（`/oauth2/auth` 无 `nonce` 参数；流程非完整 OIDC，无 id_token nonce 语义） | 获取登录用户的访问凭证：https://open.dingtalk.com/document/orgapp-server/obtain-identity-credentials ；扫码登录第三方网站：https://open.dingtalk.com/document/isvapp/scan-qr-code-to-log-on-to-third-party-websites |

## 落地口径（方向 §3.4 的实现语义）

1. 三 Provider 官方授权端点均**不接受 `nonce` 请求参数**（OIDC `nonce` 语义只适用于返回
   id_token 的流程；三家的网页授权均返回 `code`，换票走服务端 secret 端点）。因此
   `nonce` 无法按 OIDC 方式落证，映射结论为「官方不支持」而非「未实现」。
2. 补偿控制（服务端已实现并测试）：
   - `state` 一次性、限时（300s）、服务端摘要落库、原子消费（CAS `consumed=0→1`），
     重放/过期/Provider 错配/伪造均拒绝（`SsoAuthServiceTest` 10 例 + 真实 HTTP 证据）；
   - 回调 URI 白名单与 Spring Security `permit-urls` 职责分离
     （`sw.security.sso.callback-base-url` + `callback-allowlist`，
     `SsoCallbackPolicy` 正反断言）；
   - 绑定键 `(provider, tenant_id, external_id)` 唯一；同一 Provider 应用
     `(provider, app_id)` 全局归属唯一租户（V86），阻断同应用外部主体跨租户重复绑定。
