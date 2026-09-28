# G1a 移动链关联表（对象尺寸与网络语义）

截图尺寸实测（sips）：mobile-authorize-consent.png=390、mobile-workspace-session-390.png=390、mobile-error-recovery-bogus-ticket.png=390；pc-error-account-unavailable.png=1280（已由误标 mobile-*.png 更名）、pc-workspace-after-bound-login.png=1280（已更名）、pc-authorize-consent.png=1280。1280 制品一律标注为桌面。

| 制品（390×844） | 关联请求（时点，boot 90474） | 业务结果 |
|---|---|---|
| mobile-authorize-consent.png | GET /FEISHU/authorize-login 200（22:36 前后）→ 用户点"授权" → GET /feishu/callback 302 | 授权页渲染含账号/权限项；回调后落候选或会话 |
| mobile-workspace-session-390.png | POST /auth/sso/ticket **200（22:37:06，已固定于 g2-deny-cancel.log 尾行）**；同窗 callback 302（22:36-37） | 普通账号会话建立，工作台显示"租户100普通用户" |
| mobile-error-recovery-bogus-ticket.png | POST /auth/sso/ticket（伪造票据）→ 401 信封 sso_ticket_invalid | 页面展示"票据无效或已过期"人性化文案＋返回登录 |

诚实边界：boot 90474 的完整 AccessLog 被后续重启覆盖；上表以提交在案的 api-network-index.log（22:12-22:15 桌面全链）＋已固定的 22:36:29/22:37:06 两次 ticket 200 行＋截图内业务文案做时点关联。同链桌面版全程原始行见 api-network-index.log。
