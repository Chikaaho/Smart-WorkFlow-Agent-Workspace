# 钉钉 SSO 接入准备探索回执

核验时点 2026-09-28；全程只读（未改代码/配置/控制台/数据库，未部署）。凭据零记录：Secret/API Token 仅经掩码比对确认与提供值一致。

## 1. 两仓现状（旧"仅 SPI"快照已失效）
Server `main` `fd704ff`、Web `main` `5368e6c`（0.1.2，树净）；生产 0.1.2 已部署（`memory/state.md:11`、`handoff.md:13`；实测 `/sw/` 200、health UP、回调端点可达）。
实现完整：`sw-biz-system-biz` `com.sw.ck.system.sso.*`＋`SsoAuthController`，路由前缀 `/api/auth/sso`（授权/回调/换票/候选/绑定/解绑/审计）；V84 四表＋V86/V87 唯一键；state 300s 一次性原子消费、AES-GCM 加密、绑定冲突拒绝、审计、解绑撤销、白名单 fail-closed 均可复用。配置无管理端点：`sys_sso_provider_config` 行手工落行（app_id=Client ID、app_secret_enc、redirect_path、enabled；先 0 后 1），enabled=1 占位值 fail-fast；prod 强制 `SW_SSO_CIPHER_KEY`。无 corpId 字段/租户→企业映射。
钉钉=新版 OAuth2：`login.dingtalk.com/oauth2/auth`（scope=openid）→ POST `api.dingtalk.com/v1.0/oauth2/userAccessToken` → GET `/v1.0/contact/users/me` 取 **unionId**。**不校验企业归属**（官方可选 getbyunionid 接口/换票返回 `corpId`/scope `openid corpid`——均未用）。

## 2. 实现差异（真实链从未执行的缝隙）
a) `SsoAuthController.callback`（L117-136）返回 200 JSON `{"redirect":…}` 非 302——Provider 顶层重定向落在后端 JSON 页，链路断裂。
b) 前端 `/sso/return` 需 `?sso_ticket`，服务端签发目标=`redirect_path`+ticket，样例 `/workspace` 致页不可达；`completeSsoCallback` 亦无调用方。需 `redirect_path=/sso/return` 且修复 a)。
c) 次要：`LoginPage.vue:240` 首位文案「微信」实为 WECOM。

## 3. 控制台现状与字段用途
App ID `eb988221-cba1-…`、Client ID `dingzoptrn9m3m33rwe1` 与提供值一致；Secret 已配置（掩码非空）；AgentId `5034308591`。类型=**个人测试应用**，归属=**个人开发（未认证服务商）**，状态=**开发中**、从未发布版本；未添加应用能力；成员仅拥有者 1 人（开发阶段可用范围=拥有者）。
CorpId/API Token 显示于开发者后台首页、与提供值一致；API Token=持久展示令牌，官方用途为工作台自建组件网关鉴权（[钉钉工作台能力开放](https://developer.aliyun.com/article/989013)），**不在 OAuth 契约中——API Token 不参与 SSO（已核实）**；OAuth 链仅需 Client ID+Secret；UUID appId 是控制台标识。

## 4. 官方契约（2026-09-28 核验）
[授权与换票流程](https://open.dingtalk.com/document/development/obtain-identity-credentials)：redirect_uri 必填且须与登记域名一致；scope=openid 或 `openid corpid`。[获取用户token](https://help.dingtalk.io/zh/open/development/obtain-user-token)：POST `/v1.0/oauth2/userAccessToken`（clientId/clientSecret/code/grantType），返回含 corpId。[获取登录用户信息](https://open.dingtalk.com/document/orgapp-server/dingtalk-retrieve-user-information)：`x-acs-dingtalk-access-token` 调 `/v1.0/contact/users/me`。注：help.dingtalk.io 镜像端点写作 .io 域；实现用 `login/api.dingtalk.com`（迁移待确认）。

## 5. 精确缺口
- 权限：仅 `Contact.User.mobile` 已开通；**`Contact.User.Read`（users/me 所需）未开通** → 换票后必失败。
- 安全设置：**重定向 URL 为空**。拟用 `https://chikaho.cn/sw-server/api/auth/sso/dingtalk/callback`（服务端固定拼该路径；prod 需注入 `SW_SSO_CALLBACK_BASE_URL`＋`ALLOWLIST`）。
- 租户/账号：dev seed 仅 dev 装载（`V900__i5_tenant100_test_fixtures.sql`：租户 100「I5测试租户」、t100admin）；生产未载 → **生产 `tenantName`（精确唯一）与测试账号为缺失输入，需 Owner 指定**；未选 tenant 0/未绑定管理员。

## 6. 冲突回传（不裁决）
- P31=M02-F06-02 单点登录：`knowledge/feature-reconciliation-index.md:47`"⬜ 仅 SPI 预留"、`:165` 未排期；`current-status.md:47/98`"P31 保持现状"。与 I5 已交付完整实现（`features/v0.1.0-oa-completion.md:41`）时点冲突；未核销。
- 部署表述：`memory/README.md:8`"本次未部署"与 `memory/state.md:11`、`handoff.md:13`"生产已于 2026-09-28 部署上线 0.1.2（V102）"矛盾。

## 最小配置清单（拟用值；应用发布/扩权限单列授权）
控制台：开通 Contact.User.Read；重定向 URL 填上述值。服务端：注入 CALLBACK_BASE_URL/ALLOWLIST；落 DINGTALK 配置行（redirect_path=/sso/return）。代码：修复 §2a/b——属正式方向实施范围，本轮未改。

## 结论
§1—§6 均有文件行号/官方链接/控制台 DOM 依据。待确认：域名 .com/.io 迁移；生产租户名与测试账号；是否用 openid+corpid 校验企业归属（改授权 UX）。**真实登录链未执行**；配置存在不替代真实登录证据。继续探索：**否**；可支撑 Planner 下发 L 级方向。
