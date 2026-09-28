# 飞书与企业微信 SSO 聚焦探索回执

核验时点 2026-09-28；浏览器经正常页面只读探索+授权内取凭据；官方文档当日核验。秘密零记录：飞书 App Secret 已取得并存运行时受保护临时文件，手机号不入任何制品。

## 1. 飞书应用现状（App ID `cli_aa30e5e269389cdc` 一致）
类型=**企业自建应用**（归属"用户376282的组织"），状态=**待上线**、从未发布；未添加应用能力。**权限全未开通**；**重定向 URL 空**、IP 白名单空（安全设置接受 HTTP/HTTPS）。App Secret 可经正常页面取得（页面另有"重置"危险项，未触碰）。**测试企业 0/3 未创建**：控制台明示测试企业内免审核直接生效（含解散路径）→ 飞书真实链无需版本发布即可验证。

## 2. 飞书官方契约（2026-09-28）
[获取授权码](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authorize/get)：GET `https://accounts.feishu.cn/open-apis/authen/v1/authorize`，client_id/response_type=code/redirect_uri（**须先在安全设置配置**）/scope（**含未开通权限即 20027**）/state 原样回传；拒绝回调=`?error=access_denied`。[获取 user_access_token](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/authentication-management/access-token/get-user-access-token-v3)：POST `accounts.feishu.cn/oauth/v3/token`，grant_type=authorization_code+client_id+**client_secret 必填**+code+redirect_uri；**用户无应用使用权报 20010**（可用范围=企业归属闸门）。[获取用户信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/user_info/get)：GET `open.feishu.cn/open-apis/authen/v1/user_info`，Bearer uat，返回 open_id/union_id/name/tenant_key——**权限要求"无"** → 飞书 SSO 零权限可行，稳定标识 open_id（现行实现一致），tenant_key 佐证归属。
适配器差异：authorize 用旧 host `open.feishu.cn/...authen/v1/authorize`（现行文档 host=accounts.feishu.cn，兼容性实测）；token 用 `authen/v2/oauth/token`（现行=v3，v2 为历史版本，实测可用则不替换）。

## 3. 企业微信诊断（无法创建应用的定位）
developer.work.weixin.qq.com 为**公开门户**（本浏览器无登录态）；"立即创建"→选主体：①个人身份=个人主体第三方应用（服务商模型，非自建 SSO 所需）；②企业身份→**企业内部应用"前往企业管理后台创建"**（`wework_admin/loginpage_wx`）→ **企业微信/微信扫码登录页，本浏览器无会话**，另有"企业注册"入口。**结论：直接原因=企业管理后台独立登录态缺失（扫码页），且名下是否已有企业微信企业未确认**。企业内部应用（现有适配器契约=corpId+agentId+secret）只能在该后台创建；无企业则需企业注册（属单列授权）。

## 4. 企业微信官方契约（2026-09-28）
[构造授权链接](https://developer.work.weixin.qq.com/document/path/98152)：`login.work.weixin.qq.com/wwlogin/sso/login?login_type=CorpApp&appid=CORPID&agentid=...&redirect_uri&state`；**redirect_uri 域必须为应用"OAuth可信域名"**（管理后台按应用配置）；-31020/-31039=域名不一致；回调带 `?code&state`。[获取访问用户身份](https://developer.work.weixin.qq.com/document/path/91023)：GET `qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token&code` → 成员 **userid**/非成员 openid；前置 corpid+corpsecret 取 access_token；code 一次一用 5 分钟。
适配器差异：authorize 用旧构造 `wwopen/sso/qrConnect`（实测否决再修）；gettoken/getuserinfo 已是新端点 ✓。稳定标识=userid；企业归属由每企业独立 access_token+可信域名约束。

## 5. 选定验证环境（Owner 授权自定）
**本地 dev profile**（H2+devseed）：租户 100「I5测试租户」/t100admin（工程自带夹具，非租户 0）；Provider 凭据行经**仓库外**临时 seed（AES-GCM 密文+独立 cipher key，均在 /tmp）注入；前端生产构建镜像生产路径 `/sw/`＋`/sw-server/api` 反代（本地 Node 代理，验证资产）；回调基址 `http://localhost:<port>/sw-server`（控制台接受 HTTP，实际可用性实测）。生产 chikaho.cn 不动（部署不在授权内）。

## 结论
飞书条件齐备（凭据已取、零权限 SSO、测试企业免发布）可进入配置与真实链；企业微信**受限于企业管理后台扫码（需 Owner 本人）+企业主体存在性未确认**，按方向冻结不阻塞他项。继续探索：**否**。
