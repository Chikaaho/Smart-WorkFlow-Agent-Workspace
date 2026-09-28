# 飞书与企业微信 SSO 聚焦探索回执

核验时点 2026-09-28；浏览器经正常页面只读探索+授权内取凭据；官方文档当日核验。秘密零记录：飞书 App Secret 已取得并存运行时受保护临时文件（回执只记"已取得"），手机号不入任何制品。

## 1. 飞书应用现状（open.feishu.cn DOM，App ID `cli_aa30e5e269389cdc` 一致）
类型=**企业自建应用**（归属"用户376282的组织"），状态=**待上线**、版本表空（从未发布，控制台提示"应用发布后，当前配置方可生效"）；未添加任何应用能力。**权限：全部未开通**（"暂未开通任何权限"）；**重定向 URL 空**、IP 白名单空（安全设置接受 HTTP/HTTPS URL）。**App Secret 可经正常页面取得**（查看/复制控件；页面另有"重置"危险项，已取消未触碰）。**测试企业 0/3 未创建**：控制台明示"测试企业内直接获得开发所需各项权限，应用修改无需审核直接在已安装测试企业生效"（含解散路径）→ 飞书真实链无需版本发布即可验证。

## 2. 飞书官方契约（2026-09-28）
[获取授权码](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authorize/get)：GET `https://accounts.feishu.cn/open-apis/authen/v1/authorize`，参数 client_id（App ID）/response_type=code/redirect_uri（**须先在安全设置配置**，URL 编码）/scope（空格分隔权限键，**含未开通权限即报 20027**）/state（原样回传）/prompt=consent；支持自建应用；拒绝回调=`?error=access_denied&state=`。[获取 user_access_token](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/authentication-management/access-token/get-user-access-token-v3)：POST `https://accounts.feishu.cn/oauth/v3/token`（form/json），grant_type=authorization_code+client_id+**client_secret 必填**（Confidential Client）+code+redirect_uri；**用户无应用使用权报 20010**（可用范围即企业归属闸门）。[获取用户信息](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/user_info/get)：GET `open.feishu.cn/open-apis/authen/v1/user_info`，Bearer user_access_token，返回 open_id/union_id/name/tenant_key——**权限要求"无"**（手机号等敏感字段才需额外权限）→ 飞书 SSO 可零权限运行，稳定标识 open_id（现行实现一致），tenant_key 佐证租户归属。
适配器差异：authorize 用旧 host `open.feishu.cn/open-apis/authen/v1/authorize`（现行文档 host=accounts.feishu.cn，旧 host 兼容性实测）；token 用 `authen/v2/oauth/token`（现行=v3 `oauth/v3/token`，v2 为历史版本，实测可用则不替换，符合方向"实际响应核实"）。

## 3. 企业微信诊断（无法创建应用的定位）
developer.work.weixin.qq.com 为**公开开发者门户**（本浏览器无登录态标识）；"立即创建"→选主体：①个人身份创建=个人主体第三方应用（服务商/上架模型，**非**自建 SSO 所需）；②企业身份创建→**企业内部应用"前往企业管理后台创建"**（`work.weixin.qq.com/wework_admin/loginpage_wx`）→ 该页为**企业微信/微信扫码登录页，本浏览器无会话**，另有"企业注册"入口；服务商助手 `open.work.weixin.qq.com/wwopen/login` 亦需登录。**结论：Owner 无法创建应用的直接原因=企业管理后台独立登录态缺失（扫码页），且尚未确认名下是否已有企业微信企业**。企业内部应用（现有 WecomSsoProviderClient 契约=corpId+agentId+secret）只能在该后台创建；若无企业则需企业注册（主体/认证，属单列授权，超出本轮）。

## 4. 企业微信官方契约（2026-09-28）
[构造授权链接 Web 登录](https://developer.work.weixin.qq.com/document/path/98152)：`https://login.work.weixin.qq.com/wwlogin/sso/login?login_type=CorpApp&appid=CORPID&agentid=AGENTID&redirect_uri=...&state=...`；**redirect_uri 域名必须为应用"OAuth可信域名/Web网页授权回调域名"**（管理后台按应用配置）；错误 -31020/-31039=域名不一致；回调带 `?code&state`。[获取访问用户身份](https://developer.work.weixin.qq.com/document/path/91023)：GET `qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token&code` → 企业成员返回 **userid**（/非成员 openid）；前置=corpid+corpsecret 取 access_token（gettoken，path/91039）；code 一次一用 5 分钟。
适配器差异：authorize 用旧构造 `wwopen/sso/qrConnect`（官方现行文档为 wwlogin/sso/login；旧构造可用性需实测，实际响应否决再修）；gettoken/getuserinfo 已是新端点 ✓。稳定标识=userid（企业内唯一）；企业归属由 app access_token（每企业独立）+可信域名共同约束。

## 5. 选定验证环境（Owner 授权执行自定）
**本地 dev profile**：后端 `sw-bootstrap` dev（H2 内存+devseed 仅 dev 装载）——租户 100「I5测试租户」/t100admin（工程自带可控夹具，`V900__i5_tenant100_test_fixtures.sql`，非租户 0、非管理员主账号）；Provider 凭据行经**仓库外**临时 seed（AES-GCM 密文+独立 cipher key，均在 /tmp，不入仓库）注入。前端生产构建镜像生产路径：`/sw/` 静态 + `/sw-server/api`→后端 `/api` 反代（本地 Node 代理，验证资产）。回调基址用 `http://localhost:<port>/sw-server`（控制台安全设置接受 HTTP URL；localhost 实际可用性按平台实测，被拒再改公开通道）。生产 chikaho.cn 不动（部署不在授权内）。

## 结论
飞书：条件齐备（凭据已取、零权限 SSO 可行、测试企业路径免发布），可进入配置与真实链。企业微信：**受限于企业管理后台扫码登录（需 Owner 本人）+企业主体存在性未确认**；按方向冻结该项，不阻塞钉钉/飞书。钉钉沿用前回执。继续探索：**否**。
