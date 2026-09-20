# i5-10 三 Provider 官方文档—实现—配置三向对照账本（G8-DOC-*）

> 对照日期：2026-09-14。官方页面经只读抓取/检索获取；证据记录官方 URL、页面标题与所核对契约摘要，不复制正文大段。
> 结论分级：`一致` / `确证差异（已修复）` / `可用但推荐迁移（登记，不修复）` / `非确证（登记观察点）`。

## G8-DOC-WECOM（企业微信）

| 契约点 | 实现位置 | 官方文档 | 结论 |
|---|---|---|---|
| 扫码/Web 授权发起 | `WecomSsoProviderClient.AUTHORIZE_URL` = `https://login.work.weixin.qq.com/wwopen/sso/qrConnect`，参数 appid(corpId)、agentid(extra)、redirect_uri、state | 企业微信Web登录·开始开发 https://developer.work.weixin.qq.com/document/path/98151（2026-09-14 访问）：新版推荐 `wwlogin/sso/login`（login_type/appid/agentid/redirect_uri/state）或 JS-SDK 组件；旧版扫码登录「仍可用，建议迁移」，未声明废弃 | **可用但推荐迁移**：当前 qrConnect 契约（appid/agentid/redirect_uri/state，回调 `code&state`）与新版 wwlogin 参数一一对应，不构成确证不兼容；是否切换新版组件属产品演进，登记不修复 |
| 网页授权（对照参考） | —（实现走 Web 扫码链路） | 网页授权登录 https://developer.work.weixin.qq.com/document/path/91022：`open.weixin.qq.com/connect/oauth2/authorize`，scope=snsapi_base/privateinfo | 一致性无冲突（另一条链路，未采用） |
| corp access_token | `TOKEN_URL` = `/cgi-bin/gettoken?corpid=&corpsecret=`，缓存 7200s 按应用隔离 | gettoken https://developer.work.weixin.qq.com/document/path/91039：GET，corpid+corpsecret 必填，返回 errcode/errmsg/access_token/expires_in(7200)，要求后台缓存、按应用分开、预留失效重取 | **一致**（实现有进程内缓存+60s 提前刷新，符合"必须缓存"要求） |
| 换身份 | `USERINFO_URL` = `/cgi-bin/auth/getuserinfo?access_token=&code=`，取 `userid` | 获取访问用户身份 https://developer.work.weixin.qq.com/document/path/91023：GET，code 一次性 5 分钟；企业成员返回 userid；errcode=0 成功、40029 code 无效 | **一致**（实现按 errcode!=0 拒绝并要求 userid 非空） |
| 回调域要求 | 服务端 `/api/auth/sso/wecom/callback`；回调白名单 `sw.security.sso.callback-allowlist` | 98151：授权回调域必须与访问链接域名完全一致（含端口、不支持泛域、不含协议头），在管理后台自建应用「企业微信授权登录」配置 | **一致**（手册登记 Owner 控制台侧操作） |
| 凭据 | appId=CorpID，appSecret=应用 secret（extra.agentId=AgentID），AES-256-GCM 密文存储 | 同上 | 一致 |

## G8-DOC-FEISHU（飞书）

| 契约点 | 实现位置 | 官方文档 | 结论 |
|---|---|---|---|
| 授权发起 | `AUTHORIZE_URL` = `https://open.feishu.cn/open-apis/authen/v1/authorize`，参数 app_id、redirect_uri、state（**本轮已补 `response_type=code`**） | 获取授权码 https://open.feishu.cn/document/authentication-management/access-token/obtain-oauth-code 与官方最佳实践示例 `.../authen/v1/authorize?app_id=&redirect_uri=&response_type=code&state=`（2026-09-14 访问）：response_type 固定值 code | **确证差异（已修复）**：官方授权 URL 含 `response_type=code`，实现缺失 → `FeishuSsoProviderClient.buildAuthorizeUrl` 已补齐 |
| 换 user_access_token | `TOKEN_URL` = `/open-apis/authen/v2/oauth/token`，POST JSON grant_type=authorization_code/client_id/client_secret/code，取 `data.access_token` | 获取 user_access_token（v2）https://open.feishu.cn/document/authentication-management/access-token/get-user-access-token（2026-09-14 访问）：POST，grant_type=authorization_code，code 5 分钟一次性 | **一致** |
| app_access_token | `APP_TOKEN_URL` = `/open-apis/auth/v3/app_access_token/internal`（app_id/app_secret） | 自建应用获取 app_access_token（internal）官方接口，返回 app_access_token/expire | **一致**（用于既有 v1 user_info 链的凭证准备） |
| 稳定主体标识 | `USER_INFO_URL` = `/open-apis/authen/v1/user_info`，Bearer user_access_token，取 `data.open_id`（租户内稳定） | 获取登录用户信息（authen/v1/user_info）官方接口：返回 open_id/union_id 等 | **一致**（open_id 为应用内租户稳定标识，符合方向「租户内稳定主体」口径） |
| 回调域要求 | 回调白名单同上；redirect_uri 需在开放平台「安全设置/重定向 URL」预先登记 | 网页应用接入指南：重定向地址需预先配置 | **一致**（手册登记） |
| 观察点 | 换票请求体未带 `redirect_uri` | v2 token 官方请求示例中含 redirect_uri 字段 | **非确证**：未取得「必填」明示；OAuth 惯例仅在授权请求携带 redirect_uri 时需一致。登记为 Owner 自验关注点：若换票报 redirect_uri 相关错误，优先核对该字段（修改需动 SsoAuthService 传参链，超出本轮最小修复范围） |

## G8-DOC-DINGTALK（钉钉）

| 契约点 | 实现位置 | 官方文档 | 结论 |
|---|---|---|---|
| 授权发起 | `AUTHORIZE_URL` = `https://login.dingtalk.com/oauth2/auth`，参数 clientId、redirect_uri、response_type=code、scope=openid、state、prompt=consent | 获取登录用户的访问凭证 https://open.dingtalk.com/document/orgapp-server/obtain-identity-credentials（2026-09-14 访问/检索）：OAuth2 授权页 `login.dingtalk.com/oauth2/auth`，scope=openid，state 防 CSRF | **一致** |
| 换 user access token | `USER_TOKEN_URL` = `POST /v1.0/oauth2/userAccessToken`，JSON clientId/clientSecret/code/grantType=authorization_code，取 `accessToken` | 获取用户token https://open.dingtalk.com/document/development/obtain-user-token（2026-09-14 检索）：POST，clientId（AppKey）+clientSecret（AppSecret）+grantType=authorization_code+code 必填，返回 accessToken/expireIn/refreshToken | **一致** |
| 稳定主体标识 | `USER_INFO_URL` = `GET /v1.0/contact/users/me`，header `x-acs-dingtalk-access-token`，取 `unionId` | 获取登录用户信息/用户通讯录个人信息 https://open.dingtalk.com/document/development/dingtalk-retrieve-user-information（2026-09-14 检索）：携带用户级 accessToken，返回 unionId/nickName 等 | **一致**（unionId 为开放平台稳定主体标识） |
| 回调域要求 | 回调白名单同上；redirect_uri 需在开放平台应用「登录与分享/回调地址」登记 | 官方登录文档要求登记回调地址 | **一致**（手册登记） |
| PKCE | 授权页未带 code_challenge（PKCE 可选） | 授权页 PKCE 可选 | 一致（未启用为允许路径，state 必带已满足） |

## 覆盖边界

- 官方页面为 JS 渲染站点，飞书/钉钉部分契约经官方文档检索摘要核对（结果摘要绑定上文官方链接）；企业微信三条核心页面为直接抓取。
- 本轮不发起任何真实 Provider 出站调用；未写入任何真实凭据。
