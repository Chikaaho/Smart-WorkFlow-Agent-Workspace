# sso-admin-config 实施回执 02：飞书阻塞解除与准入真实链全闭环（回执 01 追补）

入口：`direction-sso-admin-config.md`（L）；回执 01 的两行外部阻塞，其中**飞书一行已解除并全链验收**，钉钉一行收敛为单点动作。功能状态保持 **VERIFYING（待规划验收）**。最终候选不变：Server `8d5fe6b`、Web `38672cd`（本轮零代码变更）。

## 一、飞书 B2 已解除——Owner 判断成立（"配置少了什么"）

- **根因**：飞书 contact v3 的 `mobile` 属敏感字段，`contact:contact.base:readonly`/`contact:user.base:readonly` 均不携带手机号（实测：user-token 对 v3 HTTP 400；app-token 200 但响应无该字段）。缺失的配置是专用权限 **`contact:user.phone:readonly`（获取用户手机号）**。
- **处置**（全部 Owner 授权的控制台操作）：开通该权限（应用+用户双身份）→ 发布 v1.0.2（免审通过）→ **零代码变更**，回执 01 的双身份读取链路自动生效。
- **正向真实链全闭环**（headless=false；审计 23 行完整导出 `evidence/admission-chain-01/audit-full.json`，python json.load 解析 OK）：
  1. **首次授权自动绑定**：13:18:17 AUTH_START → 13:18:21 EXCHANGE scope=personal → 13:18:22 BIND `phone-admission auto-bind` + LOGIN_SUCCESS——预建用户 t100user 按可信手机号（规范化匹配）自动绑定并直达工作台（`positive-feishu-autobind-workspace.png`）；
  2. **后续 SSO 登录**：登出后再次授权 → EXCHANGE scope=personal + LOGIN_SUCCESS → 免密直达工作台（`positive-feishu-bound-login-workspace.png`）；
  3. **手机号变更拒绝**：本地手机号改为不匹配值 → ADMISSION_REJECTED `phone changed (vendor vs local)`，绑定不自动迁移（`real-feishu-phone-changed-rejected.png`）；
  4. **恢复**：手机号还原 → LOGIN_SUCCESS 恢复登录。
- 至此方向 §四 第 3 条「以厂商可信手机号完成预建组织用户→首次 SSO 绑定→后续 SSO 登录」在**飞书侧完整验收**；缺手机号/变更/无用户 fail-closed 拒绝链均经真实厂商响应验证。

## 二、钉钉 B1 收敛——排除法后唯一变量为浏览器登录态

逐项排除（工具证据）：应用存在于控制台（个人测试/开发中）✓存在；回调 URL 在册 ✓；Contact.User.Read 已开通 ✓；版本 1.0.0 已上线（12:45:34，免审通过）✓；可见范围=「仅我可见」即开发者本人 ✓；发版生效延迟排除（13:23 复测仍 900103 新 trace）。今晨 10:08-10:16 同 clientId 真实链成功（当时授权页出现组织选择，login.dingtalk.com 会话活跃）；下午起全部尝试 900103 且**不出现登录表单**——与「个人测试应用在登录中心会话缺失时无法匿名发起授权」行为一致。

**解除动作（需 Owner 一次扫码，真实人机验证）**：在本浏览器重新登录钉钉。登录后无需任何代码/配置变更，执行重试即可补齐钉钉侧同构矩阵。

## 三、口径与边界

- 全部证据与审计秘密扫描 0 命中（手机号原文/app secret/密钥零入库）；本回执不含任何凭据。
- 门禁与候选不变（回执 01 §二）；本轮回执仅追加证据与状态，未改任何代码/配置。
- 剩余待办：①Owner 扫码后补钉钉真实链矩阵；②Planner 对回执 01+02 的验收。P31 开放未核销。
