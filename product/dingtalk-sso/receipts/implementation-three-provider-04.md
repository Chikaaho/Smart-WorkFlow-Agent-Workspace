# 三方 SSO 实施回执 04（G5 钉钉真实链＋G6 企微进展）

入口不变（一级补证提示 01）；功能保持 VERIFYING；P31 不核销。追加回执，不改历史。

## G5 钉钉真实链（六段全部完成，Owner 登录后配置+授权）

控制台配置（授权内，Owner 登录后由执行完成并回读）：
- **Contact.User.Read（通讯录个人信息读权限，获取用户个人信息）已开通**——控制台状态"已开通"（无需审批，开通即生效）。
- **重定向 URL 已登记并保存回读**：`http://localhost:8081/sw-server/api/auth/sso/dingtalk/callback`（保存 toast 回显同值；控制台"版本发布后生效"提示存在，个人测试应用实测立即生效，见下）。

真实链六段（2026-09-28 23:43-23:47，本机验证环境）：
1. **真实授权**：授权页以黄佳欣账号"立即登录"→"同意"（授权项：个人头像昵称/企业OA后台免登/手机号昵称钉钉ID）→ Provider 302 携带 code+state 回 callback。
2. **回调换票**：`api.dingtalk.com/v1.0/oauth2/userAccessToken` → `/v1.0/contact/users/me` 取 unionId 成功（现行 .com 端点实测有效）。
3. **稳定主体**：DINGTALK 摘要前缀 `00325d5a`（绑定页/API bindings 实读）。
4. **绑定**：候选票确认绑定到 t100user（普通账号）。
5. **已绑定登录**：登出后再授权（"同意"）→ callback 302 → /sso/return 兑换 → **服务端日志 `SSO 登录成功: userId=9002`**（23:46:47，`dingtalk-network-index.log`）→ 工作台身份"租户100普通用户"（`dingtalk-pc-workspace-after-bound-login.png`）。
6. **解绑失效**：API unbind 200（`dingtalk-unbind-actual.txt`：解绑前 DINGTALK 00325d5a 在册，解绑即撤销会话——随后请求 401）；再次授权 → 落候选绑定页 digest 00325d5a（`dingtalk-pc-unbound-candidate-after-unbind.png`）。

辅助证据：无角色用户访问绑定管理页 UI 得 403（`dingtalk-pc-bindings-bound.png`，最小权限 fail-closed 正面样本；API 仍可解绑——接口仅需登录态，符合设计）。

**钉钉个人测试边界（与飞书同口径）**：验证主体=应用归属组织成员（黄佳欣）；服务端企业归属校验链未建立（同 G3b 能力差异，已交 Planner 裁决）；不宣称企业 SSO。

## G6 企业微信（主体已核实，创建被 Logo 上传阻塞于浏览器能力）

- Owner 扫码后管理后台登录确认：**企业主体存在、管理员权限成立**；应用管理页正常（已有自建应用"消息推送"）。
- **"创建应用"表单可正常打开并提交**（`#apps/createApiApp`，与"无法创建应用"历史报告不符——原卡点即后台未登录）。
- 表单必填**应用 Logo**，上传被浏览器环境阻断（IAB 不支持系统文件选择框）：已在 `/tmp/sw-sso-verify/wecom-app-logo.png` 准备合规 Logo（512×512），应用名已填"SW-SSO验证"。
- **剩余动作（Owner 一次点击）**：在该页面 Choose File 选择上述 Logo → 点 Create an app；随后由执行完成可信域名/回调配置并读取 CorpId+Secret 走真实链（企微适配器=qrConnect 旧构造，实测否决则按官方 wwlogin/sso/login 修正，与飞书同流程）。
- 表述按审查 02：主体已核实存在，管理员权限成立；"无法创建"历史原因定为后台登录态缺失，非主体/资格缺失。

## 当前剩余

①企微 Logo 上传（Owner 单点）→ 企微配置与真实链；②企微/钉钉企业成员边界（等待 G3b Planner 裁决与可控第二成员）；③生产接入结论（另行授权）。飞书/钉钉均为**自验通过、规划补证中**口径。
