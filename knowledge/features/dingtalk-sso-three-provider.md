# 三方 SSO 真实接入（P31 相关，执行跟踪）

> 任务：`product/dingtalk-sso/ready/direction-three-provider-sso-20260928.md`（L）；P31 保持开放，功能计数不变。
> 本文件是执行进度的事实记录；验收裁决权在 Planner。

## 执行进度（2026-09-28）

- **共用回调修复（方向目标 A）**：完成。Server develop `98e0034`（302+前端基路径）、`edd7a02`（provider 大小写归一化）、`4f5454e`（飞书换票 v3 契约+SPI 传回调 URL）、`49b5f9f`（已绑定登录经回跳页兑换票据）、`cb5f17d`（测试桩）；Web develop `d37a57b`（sso_error 分支/清理 XHR 回调/企微文案）。门禁：Server system-biz 314/0/0/0＋I5SsoBindingSessionBootTest 4/4（终态代码复跑）；Web 1301 passed+3 skipped、typecheck/lint/build exit 0。
- **飞书/钉钉真实链**：自验六段全部通过（规划补证中，不得投影为 Planner 验收）；G3b 企业归属约束已按审查03裁决实现（extra_config.enterpriseId＋厂商可信字段校验，Server commit 1f950e9）（授权→v3 换票→open_id→绑定→已绑定登录（服务端 `SSO 登录成功: userId=9001`、ticket POST 200）→解绑失效；负向：伪造 code 400、state 重放拒绝；移动 390x844 视口可用）。证据 `product/dingtalk-sso/receipts/evidence/feishu-real-chain-01/`。控制台配置：重定向 URL 已登记、测试企业「SW-SSO验证」关联应用、零 API 权限（users/me 基础字段官方无权限要求）。
- **钉钉**：执行就绪待外部——authorize URL 生成实测正确；`api.dingtalk.com` 换票端点可达（伪造 code 400）。剩余：Owner 控制台登录后开通 Contact.User.Read＋登记回调 URL，再跑真实链。
- **企业微信**：冻结（企业管理后台扫码会话缺失＋企业主体存在性未确认；探索回执 `search_fallback/feishu-wecom-sso-readiness-20260928.md`）。
- **实施回执**：`product/dingtalk-sso/receipts/implementation-three-provider-01.md`。

## 已证实事实（供后续复核）

- 旧 I5 链存在四处真实断链（JSON 非 302、provider 大小写、票据无消费页、飞书 v2 端点 400），均已在真实链中复现并修复。
- 飞书换票官方现行契约为 `accounts.feishu.cn/oauth/v3/token`（2026-08-21 更新文档）；旧 v2 实测 400。
- 观察项（范围外）：第一方 logout 后 refresh cookie 疑似未失效（登出后静默 refresh 200），建议另立缺陷核实。
