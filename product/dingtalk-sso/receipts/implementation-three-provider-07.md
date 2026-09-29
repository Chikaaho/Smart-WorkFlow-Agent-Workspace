# 三方 SSO 实施回执 07（三级补证提示 03 账本）

入口：`planning-execution-prompt-three-provider-03.md`；依据审查 04。VERIFYING；P31 不核销；追加回执。G6 企业微信维持 Owner 延期（未触碰其配置）。

## G3b/G4a（最新候选隔离部署＋两厂商企业模式在线矩阵）

- **最新候选**：Server develop `1f950e9`＋corpid-scope 修正 `762f427`（同一候选链）；隔离验证环境运行产物 bootstrap-dev.jar sha256 前缀 `f7150208327432f1`（1f950e9 源码构建，G3b 后无代码变化；期间一次诊断构建已回退，回退后重建 sha 见本文件时点采集）。Web 候选不变 `d37a57b`。
- **受影响门禁原始输出**：system-biz **317/0/0/0**（SsoAuthServiceTest **32**=29+3 G3b）与 I5SsoBindingSessionBootTest **4/0/0/0**——均在本候选源码上执行（此前已跑，本轮按审查 04 "不要求无变化重跑"引用；surefire 具名结果 `g4-gates-01/surefire-named-results.txt`＋原始 XML/txt 同目录入库）。
- **钉钉企业模式在线匹配（真实厂商字段）**：授权 scope=`openid+corpid` → 授权页出现**组织选择**（个人开发/深大计科…）→ 选"个人开发"（corpId=dingd6efc…与配置一致）→ 回调换票 → **企业校验通过** → 候选绑定页 digest `00325d5a` → API 绑定成功 → 审计 `EXCHANGE scope=enterprise`（`dingtalk-enterprise-audit.json`）。
- **钉钉错配拒绝（真实响应＋受控错误配置）**：配置 enterpriseId=`deliberately-wrong-corp-0001` → 真实授权（组织选择"个人开发"）→ 回调换票 corpId 与配置不符 → **拒绝**（错误页＋`dingtalk-enterprise-mismatch-actual.txt` 日志 `errorKey=system.sso_binding_conflict`）。
- **钉钉个人模式显式**：配置 `{}` → scope=openid（无组织选择）→ 审计 `EXCHANGE scope=personal`（`dingtalk-personal-audit.txt`）。
- **飞书企业模式在线匹配（真实厂商字段）**：tenant_key 经临时诊断构建读取（/tmp 0600，值不落制品；诊断代码已回退并重建候选）→ 配置 enterpriseId=真实 tenant_key → 真实授权 → **企业校验通过** → 审计 `EXCHANGE scope=enterprise`（`feishu-enterprise-audit.json`，digest 6bb50608）。
- **飞书错配拒绝（真实响应＋受控错误配置）**：配置 enterpriseId=`wrong-feishu-tenant-0001` → 真实授权 → tenant_key 与配置不符 → **拒绝**（错误页＋`feishu-enterprise-mismatch-actual.txt` 日志 `errorKey=system.sso_binding_conflict`）。
- **个人模式显式回归（两平台）**：钉钉 personal（audit scope=personal）＋飞书此前 personal 链——均显式审计。

关键实现发现（随 G3b 实测修正）：scope=openid 换票响应**不含 corpId**（企业模式实测被拒）；企业模式授权必须带 `openid+corpid`，授权页出现组织选择——修正 commit `762f427`（317/0 回归通过）。

## G5-unbind（钉钉本体完整链，FEISHU 不再替代）
`feishu-real-chain-01/g5-unbind-dingtalk-full.txt`：绑定（候选票+会话）→ 解绑前 bindings 含 DINGTALK 00325d5a → 解绑 HTTP 200 code 0 → **旧 access token：HTTP 401 `common.unauthenticated`** → **旧 refresh：业务 401 `system.session_revoked`** → 重认证成功 → bindings=[]。全程完整状态码/业务码/正文，无 undefined。

## G2a-state/G3a-conflict（Surefire 具名结果）
`g4-gates-01/surefire-named-results.txt`（32/32 PASS 逐用例）：state 不存在/过期/重放（handleCallback_unknownState/expiredState/replayedState）、Provider 错配（handleCallback_providerMismatch）、非法跳转（callbackPolicy_frontendPathComposition）、绑定冲突双向（bind_externalAlreadyBound/bind_userAlreadyBound）、跨租户（bind_crossTenantDigestConflict、saveConfig 跨租户）、G3b 三项（enterpriseMatch/Mismatch/personalMode）。受控 HTTP 实测佐证：同主体重绑 400 sso_binding_conflict（g3a-conflict-g5-unbind-actual.txt）。

## G4-S（运行时诊断）
`g4-gates-01/g4s-runtime-bean-diagnostic.txt`：聚焦测试运行容器实证——AesGcmCipher beans=[agentAesGcmCipher] count=1、**ssoCipherPresent=false**（顶替为运行时事实非推断）、SSO 注入实例加解密往返 OK。dev 实际链与 prod 契约区分回执 03/06 文字保留；后台配置开发须先裁决加密依赖绑定（审查 04 已列）。

## 剩余边界
企业成员批量边界（需企业内可控第二成员）未验证；生产部署授权未申请（企微延期后非必需）。除上述外账本项全部闭合。
