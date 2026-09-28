# 三方 SSO 实施回执 06（二级补证提示 02 账本）

入口：`planning-execution-prompt-three-provider-02.md`（唯一账本）；依据审查 03 与 Owner 决定。VERIFYING；P31 不核销；追加回执。**Owner 决定已执行口径：企业微信延期退出待验范围——保留既有配置（应用/域名校验 location 未删），真实链未验证；当前摘要已区分"应用版本未部署"与"nginx 域名校验已变更"（见 G4b），不再写"生产零变更"。**

逐项（ID→证据→结果→边界）：

## G4-S（非秘密回读）
`g4-gates-01/g4s-key-source-readback.txt`：①独立密钥文件 /tmp（0600，32B）；②生效加密器链源码事实（ssoCipher 被 agentAesGcmCipher `@ConditionalOnMissingBean` 顶替→实际密钥源 SW_CIPHER_KEY，本轮=独立密钥，AEAD=0＋authorize-login 0 实证）；③隔离与正式契约影响：本轮单次运行/仓库外；**正式契约含义=顶替顺序下 SSO 凭据加密实际取 SW_CIPHER_KEY，运维须保证其为 SSO 凭据密钥或调整 bean 顺序——登记为契约观察项（非缺陷，待运维口径裁决）**；④旧密文扫描 0 命中（真实密文未进任何制品）；⑤秘密值零回传。

## G4b（入口与生产事实）
`g4-gates-01/g4b-entries-readback.txt`：五入口当前值逐文件回读＋**事实区分：应用版本未部署（生产仍 0.1.2 旧回调）vs nginx 域名校验已变更（WW_verify location，公网 200 实测）**。历史附件以追加更正，未覆盖原始结果。

## G2a-exp（有效会话下过期票）
`feishu-real-chain-01/g2a-expired-bind-with-session.txt`：[a] me HTTP 200 code=0 user=t100user（会话有效证明）→ [b] BEFORE bindings 200（FEISHU 1 条）→ [d] 过期票 bind-candidate（Bearer 有效会话）→ **业务码 401 `system.sso_ticket_invalid` 完整正文** → [e]/[f] AFTER 无增量（工具判定 True，1→1）。

## G2a-state（具名测试与断言映射）
`g4-gates-01/g2a-state-g3a-named-mapping.md`：state 不存在/过期/重放/Provider 错配/非法跳转 → 逐项具名测试:源码行→断言→原始输出行（server-system-biz-test.log:8279-8281，SsoAuthServiceTest 29 项基线；frontendPathComposition 断言非法目的不采用）。

## G3a-conflict（受控实测＋具名用例双证）
`feishu-real-chain-01/g3a-conflict-g5-unbind-actual.txt` [conflict]：同主体（DINGTALK 00325d5a）新候选票再次绑定 → **业务 400 `system.sso_binding_conflict` 完整正文**，原 FEISHU 绑定无变化；具名用例：bind_externalAlreadyBound_shouldReject:183、bind_userAlreadyBound_shouldReject:197、bind_crossTenantDigestConflict_shouldReject:470（V87 跨租户）、saveConfig 跨租户登记:456（映射文件含源码行）。

## G3a-status（真实状态转变）
- 角色撤销（API 实测）：`feishu-real-chain-01/g3a-role-revoke-actual.txt`——分配 9001 后已建立会话 me roles=['t100_admin']（缓存重载收敛）→ 撤销后 roles=[]。
- 租户停用（真实 status=1 翻转，聚焦 BootTest）：`g4-gates-01/g2a-state-g3a-named-mapping.md` 引 server-i5-boottest.log:1082（停用后票据兑换业务 401 `system.sso_tenant_invalid` 原文）与 :1088（既有会话权威装载 HTTP 401 原文）、恢复后 me 200。

## G3b（按审查 03 裁决实现）
Server commit `1f950e9`：SPI `ExchangeResult(externalId, enterpriseId)`；厂商可信企业字段——钉钉=换票响应 corpId（官方字段）、飞书=user_info tenant_key、企微=应用归属 corpId 作用域；`extra_config.enterpriseId` 配置即企业成员模式（厂商字段缺失/不一致 → 拒绝＋审计 ENTERPRISE_MISMATCH，无会话/绑定新增）；配置缺省=个人模式（审计 EXCHANGE scope=personal，显式区分）。门禁：system-biz **317/0/0/0**（SsoAuthServiceTest **32=29+3** 新增企业归属三断言：匹配放行/错配拒绝/个人显式）＋I5SsoBindingSessionBootTest **4/0/0/0**。
边界（如实）：企业模式逻辑经单测验证；**在线厂商 corpId 字段的企业模式真实链未跑**（本轮钉钉真实链为 personal scope；企业模式需配置 enterpriseId 后重跑授权链）——不宣称企业成员模式已在线验证。

## G5-unbind（完整响应，FEISHU 绑定语义；Provider 无关）
`feishu-real-chain-01/g3a-conflict-g5-unbind-actual.txt`：解绑 HTTP 200 业务 code 0 → **旧 refresh 完整响应：HTTP 200 信封业务 401 `system.session_revoked`** → **旧 access token：HTTP 401 `common.unauthenticated`** → 重认证成功 → bindings=[]（不含 FEISHU）。无 undefined（回执 04 的脚本缺陷已修正）。

## G5-mobile（钉钉 390 真实链＋恢复）
制品：`dingtalk-mobile-authorize-consent.png`、`dingtalk-mobile-workspace-bound-login.png`（390×844 实测，sips）、`dingtalk-mobile-error-recovery.png`；网络关联 `dingtalk-mobile-network-index.log`：T0=00:49:34 authorize-login → 00:50:28 callback → **SSO 登录成功 userId=9002** → ticket 200 → 工作台（租户100普通用户）；伪造票据错误恢复页实测。

## G6（Owner 延期口径）
企业微信退出待验：不索要 Secret/部署；既有配置（应用、AgentId 1000002、chikaho.cn 可信域名与 nginx 校验 location）保留；进展证据（wecom-g6-progress.md）保留不改。

## 门禁与候选
无新增实现变化的门禁按审查 02 锁定引用；本轮 G3b 实现变化后受影响门禁已重跑：system-biz 317/0/0/0、BootTest 4/0/0/0（终态代码）。候选：Server develop `1f950e9`（含 G3b）＋Web `d37a57b`（本轮无 Web 变化）；运行产物（localhost 验证环境）对应 G3b 之前构建（指纹见回执 03 材料时点），G3b 后未重启本地环境（其实测均为既有候选时点固定证据）——如实区分。

## 剩余
钉钉/飞书企业模式在线真实链（需配置 enterpriseId 后重跑）；生产部署授权（企微延期后非本轮必需）；G3b 模型如 Planner 有进一步裁决再行跟进。后台 SSO 配置管理只读探索已完成：`search_fallback/sso-admin-config-readiness-20260929.md`（本轮验收 PASSED 前不启动开发）。
