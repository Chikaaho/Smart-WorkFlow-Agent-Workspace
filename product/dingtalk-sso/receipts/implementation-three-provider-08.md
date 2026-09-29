# 三方 SSO 实施回执 08（补证提示 04 账本）

入口：`planning-execution-prompt-three-provider-04.md`；依据审查 05（R1/R2）。VERIFYING；P31 不核销；追加回执。G6 企微维持 Owner 延期。

## R1a（企业成功审计完整导出与工具解析）
`feishu-real-chain-01/r1a-enterprise-audit-full.json`：审计 API 完整 JSON 导出，**python json.load 解析 OK**，`scope=enterprise` 过滤 **2 条**：DINGTALK `00325d5a`（10:08:14 SUCCESS）与 FEISHU `6bb50608`（10:08:55 SUCCESS），两厂商两主体一表齐（文件路径与实际一致，无截断）。

## R1b（企业错配拒绝＋无增量反向断言）
`feishu-real-chain-01/r1b-mismatch-bindings-assert.txt`：钉钉配置 `deliberately-wrong-corp-0001`（受控错误配置）→ 真实授权（组织选择"个人开发"，厂商 corpId=dingd6efc…）→ 拒绝落错误页。断言：①会话有效（me HTTP 200 code=0 user=t100user）；②错配后 bindings HTTP 200 `bindings:[]`——**无 DINGTALK 增量**；③审计行 `LOGIN_FAILED detail="enterprise mismatch (vendor field vs configured)"`（10:11:56）。飞书侧同构证据 `feishu-enterprise-mismatch-actual.txt`（09:44:01）。普通绑定冲突不可替代——同主体冲突另有独立实测（回执 07 g3a-conflict 段：`sso_binding_conflict`）。

## R1c（个人模式新链回归，会话保持）
`feishu-real-chain-01/r1c-personal-regression.txt`：钉钉 personal（extra={}）→ 真实授权 → 候选绑定页（digest 00325d5a）→ 绑定（t100user）→ **登出后 personal 模式已绑定登录：SSO 登录成功 userId=9002（10:16:21）→ 工作台**；审计 `EXCHANGE scope=personal`。新校验链下个人模式显式且登录能力保持。

## R2（最终候选完整 SHA/产物/门禁/1f950e9 与 762f427 边界）
`g4-gates-01/r2-final-candidate.txt`：Server HEAD **`7342e788d47868c0`**（含 corpid scope 修正 `762f427` 与 R2 scope 测试）；Web `d37a57b70de0b11466fac9a9fc98fcdff737031a`（未变）；运行 jar sha256 **`ea8c7ca97bcbc139b16112628d9c34c33244784b05676a1acc42f085c398baf6`**（7342e788 源码 mvn -Pdev 构建）；受影响门禁原始输出 `r2-system-biz-test-319.log`（**319/0/0/0** = 314+2 ScopeTest+3 G3b）与 `r2-boot-4.log`（4/0/0/0），EXIT=0。**边界解释**：1f950e9=G3b 企业归属校验＋SPI ExchangeResult；762f427=corpid scope 修正（在线实测发现 scope=openid 无 corpId）。scope 修正的受影响验证=新增 `DingtalkSsoProviderClientScopeTest` 2 项（企业 openid+corpid/个人 openid）——审查 04 要求"scope 修正确有变化须具备其受影响验证"，已补齐并计入 319。**1f950e9/cb5f17d 冒充问题消除**：全部引用更新至 7342e788。
（诊断代码已回退：`git checkout FeishuSsoProviderClient.java` 后重建，现行 jar 无临时日志代码。）

## 自检
四原子完成；R1a JSON 完整可解析（工具）；R1b 企业拒绝原因明确＋无增量反向断言；R2 完整 SHA/产物/门禁/时点一致且 1f950e9≠762f427 边界解释；秘密/密文/手机号零入库（扫描）；SUREFIRE 32/0 与源码一致（32=29+3 G3b）；旧待办无残留（提示 03 账本已被 04 替代并全部闭合）。剩余边界不变：企业成员批量边界（需可控第二成员）、生产部署授权（企微延期后非必需）。
