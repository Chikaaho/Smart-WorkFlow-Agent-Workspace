# 后台 SSO 配置管理 readiness 探索回执

只读探索；核验时点 2026-09-29；实现未做任何修改。范围=SSO 配置/加密/审计实现、权限与路由模式、前端管理表单模式。

## 可直接复用（服务层已齐备，缺的只是 Controller+UI）

- **配置模型**：`sys_sso_provider_config`（V84：tenant_id/provider/enabled/app_id/app_secret_enc AES-GCM 密文/extra_config JSON/redirect_path；V86 (provider,app_id) 唯一、V87 (provider,external_digest) 全局唯一；G3b 后 extra_config.enterpriseId=企业归属约束已实现校验）。实体 `SsoProviderConfig`，Mapper 齐备。
- **服务层完整可复用**：`SsoAuthService.saveConfig(provider, enabled, appId, appSecret, extraConfig, redirectPath)`（sw-biz-system-biz `.../sso/SsoAuthService.java:167` 起）已含 AES-GCM 加密、占位值拒绝、启用校验、跨租户 app_id 冲突拒绝与 CONFLICT_REJECTED 审计（单测覆盖：saveConfig 跨租户用例）；**留空/占位 secret 保留旧密文**机制已在 `validateEnabledConfig` 注释与实现中（"已有有效密文可在更新非凭据字段时保留"）。`queryAudit`（分页+租户隔离+权限点 `system:sso:audit:query`）已实现。
- **审计**：`sys_sso_audit_record`＋查询 API `GET /auth/sso/audit` 已在用——后台操作审计可同表扩展 event_type（CONFIG_SAVE/ENABLE/DISABLE/SECRET_ROTATE）。
- **权限/路由模式**：Controller 惯例=`@PreAuthorize("@ss.hasPermi('system:xxx:yyy')")`＋R 响应（UserController/RoleController 样板；角色/用户-角色 API 本轮实测可用）；前端=动态菜单权限驱动＋`modules/system/views/*` 页面样板（AccountBindings.vue、用户/部门管理页）。新增权限点建议 `system:sso:config:list|save|enable`。
- **企业标识兼容方案（G3b 已落）**：extra_config.enterpriseId（钉钉=corpId、飞书=tenant_key、企微=corpId 语义），后台表单加一个"允许企业标识"输入即可；留空=个人模式（审计 scope=personal 已实现）。

## 契约差异与风险

1. **加密器顶替契约（本轮 G4-S 实证）**：`ssoCipher` 被 agent 模块 AesGcmCipher `@ConditionalOnMissingBean` 顶替，实际密钥源=`SW_CIPHER_KEY`。后台"密钥更新"只轮换**密文**（saveConfig 重加密用生效加密器），但运维口径必须明确真实生效密钥源；建议后续独立小任务修正 bean 顺序或文档化（交 Planner/运维裁决，不改本功能范围）。
2. **保存后生效语义**：配置无缓存（authorize/callback 每次直查库）→ 保存即对后续授权生效；已签发未消费的 state 不受影响，但其换票在 callback 时才发生——若期间 Secret 已轮换，旧授权换票失败（可判定错误，用户重新发起即可）。需在产品方向声明该语义。
3. **enabled=1 启动 fail-fast**：`@PostConstruct validateEnabledProviderConfigsAtStartup` 对启用行校验非占位——后台启用前校验应复用同一规则（saveConfig 已做），避免保存成功但重启失败。
4. **多实例**：SsoTicketStore 进程内存态与本功能无关；配置为库表直读，多实例天然一致。
5. **前端权限显隐**：空权限默认隐藏（既有契约）→ 新权限点需菜单/权限种子数据，否则页面不可见。

## 候选最小范围（供 Planner 形成方向）

后端：`SsoConfigController`（list/get/save/enable-toggle/rotate-secret/check），复用 saveConfig/queryAudit/validate 规则，权限点三个；`check`=运行时完整性检查（启用行凭据解密+占位/企业标识格式）。前端：`modules/system/views/SsoConfig.vue`（列表/详情/编辑表单：appId、secret 只写留空保留、extra_config.enterpriseId、redirect_path 只读展示、启停开关）＋菜单种子＋locale 八语言。审计：CONFIG_* 事件入既有表。

## 待裁决

①真实生效密钥源口径（见风险 1）；②配置管理权限点命名与可见角色；③"配置检查"与"真实登录验收"的表述边界（探索任务要求分列）；④企业微信延期期间其后台配置项是否隐藏。

## 结论

可复用度高的探明完成；开发启动依赖当前 SSO 验收 PASSED（本回执不构成启动信号）。
