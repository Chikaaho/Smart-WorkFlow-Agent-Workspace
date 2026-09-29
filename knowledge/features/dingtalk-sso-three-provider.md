# 三方 SSO 真实接入（P31 相关，执行跟踪）

> 任务：`product/dingtalk-sso/passed/direction-three-provider-sso-20260928.md`（L，主方向已归档 `passed/`）。
> **功能级验收 `PASSED（2026-09-29，审查 07 `receipts/planning-review-three-provider-07-passed.md`）`；接入功能状态 `COMPLETED（待规划确认，2026-09-29）`；P31 开放未核销，功能数 45/增量 0。**

## 终态快照（2026-09-29）

- **验收范围与结果**：钉钉、飞书既定接入范围 PASSED——共用回调 302/前端回跳链、provider 大小写归一、飞书 v3 换票契约（`accounts.feishu.cn/oauth/v3/token`）、G3b 企业归属约束（`extra_config.enterpriseId`＋厂商可信字段：钉钉 corpId/飞书 tenant_key；错配→`LOGIN_FAILED/ENTERPRISE_MISMATCH` 且无绑定/会话增量）、个人模式显式（`scope=personal` 审计，未绑定走候选绑定页、绑定后免密直达工作台）。
- **最终候选**：Server `7342e788d47868c0b10790c61fe19aef4269c781`（develop，工作树净，含 `762f427` corpid scope 修正与 `DingtalkSsoProviderClientScopeTest`）；Web `d37a57b70de0b11466fac9a9fc98fcdff737031a`；运行 jar sha256 `ea8c7ca97bcbc139b16112628d9c34c33244784b05676a1acc42f085c398baf6`（进程-产物 lsof 关联，见 `receipts/evidence/feishu-remaining-01/r2-run-identity.txt`）。
- **验收集合**：Server 本任务模块 319/0/0/0（`receipts/evidence/g4-gates-01/r2-system-biz-test-319.log`）＋Boot 4/0/0/0（`r2-boot-4.log`）；Web 1301 passed + 3 skipped 及本任务四连 exit 0；不替换全仓历史 1586 基线。
- **边界**：企业微信 Owner 延期（保留配置，真实链未验证；nginx 域名验证 location 已有变更）；企业成员批量边界（需可控第二成员）不设门槛；本任务未部署生产应用（生产仍 0.1.2/V102）。Owner 新增 B 端手机号准入不在本次 PASSED 内，由 `sso-admin-config` 方向实现。
- **回执链**：实施 01—09、审查 01—07、补证提示 01—05；关键证据 `receipts/evidence/feishu-real-chain-01/`（六段真实链/企业矩阵）、`g4-gates-01/`（门禁/候选指纹）、`feishu-remaining-01/`（飞书错配/个人/R2 运行身份）。

## 已证实事实（供后续复核）

- 旧 I5 链存在四处真实断链（JSON 非 302、provider 大小写、票据无消费页、飞书 v2 端点 400），均已在真实链中复现并修复。
- 飞书换票官方现行契约为 `accounts.feishu.cn/oauth/v3/token`（2026-08-21 更新文档）；旧 v2 实测 400。
- 钉钉企业模式必须 `scope=openid+corpid`（`scope=openid` 换票响应无 corpId，实测拒绝）。
- SSO 凭据加密实际 bean 为 `agentAesGcmCipher`（`@ConditionalOnMissingBean` 顶替 `ssoCipher`），密钥源 `SW_CIPHER_KEY`——运行诊断证实（`I5SsoCipherRuntimeDiagTest`），加密依赖显式化由 `sso-admin-config` 方向承接。
- 观察项（范围外）：第一方 logout 后 refresh cookie 疑似未失效（登出后静默 refresh 200），建议另立缺陷核实。
