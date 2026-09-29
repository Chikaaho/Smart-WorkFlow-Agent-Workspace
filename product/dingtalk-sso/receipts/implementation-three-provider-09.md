# 三方 SSO 实施回执 09（补证提示 05 账本）

入口：`planning-execution-prompt-three-provider-05.md`；依据审查 06（仅剩差异四项）。VERIFYING；P31 不核销；追加回执。G6 企微维持 Owner 延期；不部署生产；提示 05 明确删除项（R1a、模块 319/Boot4、钉钉已锁定登录/解绑/错配原因）未重做。

执行顺序按提示 05：先只读确定 R2，再趁存活进程导出审计（R1封装），最后才为飞书两场景重启（H2 内存库重启即清库，钉钉个人审计必须在重启前导出）。

## R1b-F（飞书企业错配拒绝＋绑定/会话无增量）
`evidence/feishu-remaining-01/r9b-feishu-mismatch-assert.txt`（全包）。对象：FEISHU `cli_aa30e5e269389cdc`，extra_config.enterpriseId=`deliberately-wrong-tenant-0001`（受控错误，种子 V904 10:36 修改后重启），真实厂商主体 tenant_key=`19dfd15385df1b9d`（组织「个人开发」）。浏览器真实授权（headless=false）：登录页组织名「I5测试租户」→ Feishu SSO → 授权页（用户376282）→「授权」→ 回调拒绝 → 302 `/sw/sso/return?sso_error=system.sso_binding_conflict` 错误页（截图 `r9b-feishu-mismatch-error-page.png`）。反向断言四组：①前置密码令牌 T1 错配后 me HTTP 200 code=0 userId=9002（`r9b-me-before/after.json`，同一令牌未换新）；②bindings 前后均 `{"bindings":[]}`（`r9b-bindings-before/after.json`，无 FEISHU 增量）；③审计完整导出 `r9b-feishu-mismatch-audit-full.json`（python json.load 解析 OK）：`LOGIN_FAILED result=ENTERPRISE_MISMATCH detail="enterprise mismatch (vendor field vs configured)"` 10:38:27；④该进程审计窗口 LOGIN_SUCCESS 行数=0——签发审计+受控断言组合，非仅旧 me 推导。普通绑定冲突另有独立实测（回执 07 g3a-conflict），未互替。

## R1c-F（最终候选飞书个人模式保持登录能力）
`evidence/feishu-remaining-01/r9c-feishu-personal-assert.txt`（全包）。FEISHU extra_config={}（个人模式）重启（PID 58282，10:40:26）后浏览器真实链：授权（同一主体 digest 6bb50608）→ 未绑定拒绝 → 候选绑定页 `/sw/sso/bind?ticket=…`（「digest 6bb50608」）→ 确认绑定→登录页（票据保留）→ t100user 密码登录 → Confirm binding → 绑定成功直达工作台 → Sign out 登出 → 再次飞书授权 → **免密直达 /sw/workspace**（截图 `r9c-feishu-personal-bound-login-workspace.png`，身份「租户100普通用户」）。审计完整导出 `r9c-feishu-personal-audit-full.json`（解析 OK，7 行）：AUTH_START→EXCHANGE **scope=personal**（显式）+LOGIN_FAILED not bound→BIND SUCCESS→AUTH_START→EXCHANGE scope=personal+LOGIN_SUCCESS（10:42:43 会话签发）。绑定终态 `r9c-bindings-final.json`：恰好 1 条 `{"provider":"FEISHU","externalDigestPrefix":"6bb50608"}`。与钉钉个人链（10:15-10:16）完全同构。

## R1封装（钉钉个人完整审计重导出＋两平台拒绝无新会话）
- 钉钉个人审计完整重导出：`r9-dingtalk-personal-audit-full.json` + `r9-dingtalk-personal-audit-parse.txt`——在 10:36 重启**之前**从存活进程（PID 55288）导出，python json.load 解析 OK，7 行无截断：AUTH_START(10:14:52)→EXCHANGE scope=personal+LOGIN_FAILED not bound(10:15:17)→BIND(10:15:35)→AUTH_START(10:15:49)→EXCHANGE scope=personal+LOGIN_SUCCESS(10:16:21)。审查 06 指出的截断问题以完整导出闭合，成功链未重跑。
- 两平台拒绝无新会话：钉钉=10:11:56 错配（审查 06 已锁定：audit ENTERPRISE_MISMATCH+有效会话读 bindings 空）+本次导出的签发时间线（10:15:17 拒绝后无 LOGIN_SUCCESS 直至 10:15:35 BIND 之后）；飞书=10:38:27 错配四组断言（同令牌 me+bindings 空+窗口 LOGIN_SUCCESS=0）。

## R2身份（完整 SHA 与实际运行身份）
`evidence/feishu-remaining-01/r2-run-identity.txt`（全工具回读）。修正审查 06 两缺口：
- **完整 40 位 SHA**：Server HEAD `7342e788d47868c0b10790c61fe19aef4269c781`（develop→origin/develop，工作树 0 脏项；FeishuSsoProviderClient 最后提交 1f950e9、TEMPDIAG 标记 0——诊断回退经工具核验）；Web `d37a57b70de0b11466fac9a9fc98fcdff737031a`（21:34:38 提交，工作树干净）。
- **进程-产物关联（lsof 文件句柄级，非环境名称）**：矩阵时点进程 PID 55288（10:14:36–10:36）与飞书场景进程 PID 57800（10:36:13）/58282（10:40:26，当前）三者 lsof fd 4r/5r 均打开 `sw-bootstrap/target/bootstrap-dev.jar`；该 jar 此刻 shasum -a 256 回读=`ea8c7ca97bcbc139b16112628d9c34c33244784b05676a1acc42f085c398baf6`（与回执 08 一致；mtime 10:00:45 早于全部启动时点，期间未再构建）。前端实际加载=proxy.mjs（PID 83111）服务的 `Smart-WorkFlow-aPaaS-Web/dist`（22:41:07 构建，资产 index-CwWaRphI.js）。门禁 319/0/0/0+Boot 4/0/0/0 对应同一 HEAD，未重跑（提示 05 删除项）。

## 自检（提示 05 提交前清单）
四行均有实证（R1b-F/R1c-F/R1封装/R2身份，证据文件逐一列名）；JSON 无截断（4 份导出均 python json.load 解析成功）；SHA 完整（40 位×2 仓）；实际运行身份明确（PID/启动时点/lsof 加载路径/哈希回读，非环境名称）；秘密零入库（证据目录全文扫描：密钥明文/手机号/private key/app_secret 0 命中；配置摘要仅含 app_id 与 extra_config）；无授权内可执行项遗漏。真正外部阻塞：无。剩余边界不变：企业成员批量边界（需可控第二成员，提示 05 明确不设门槛）、企微 Owner 延期、生产部署单列授权。功能保持 VERIFYING，Planner 通过后才启动后台配置页面开发。

环境留存说明：/tmp/sw-sso-verify 当前种子 FEISHU/DINGTALK 均 extra_config={}（个人模式），错配种子备份 `V904…sql.bak-personal`；当前后端进程 58282 运行中（同 jar），代理 8081 运行中。
