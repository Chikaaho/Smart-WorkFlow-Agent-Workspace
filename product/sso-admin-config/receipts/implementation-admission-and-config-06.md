# sso-admin-config 实施回执 06：审查 02 一级账本补证（S1/A1/A2/A3/A4/A6 + B1 解除）

入口：`planning-review-admission-and-config-02.md` 当前裁决（2026-09-29 回执 05 复核：整体 VERIFYING 未通过，一级补充提示）。功能状态 **VERIFYING**；P31 开放；企业微信延期。03 作废占位保留；回执 05 保留原文（其秘密扫描段"0 命中"声明按审查裁决作废，由本回执 S1 段替代）。

**B1 重大更新（Owner 人工验证结果，2026-09-29 19:2x）**：900103 根因裁决为本地种子脚本 12:29 轮换密钥重写时把钉钉 Client ID 手写错值（`dingzoptrn9m33rwe1` 18 位 ≠ 控制台真实值 `dingzoptrn9m3m33rwe1` 20 位），非浏览器登录态、非控制台配置、非代码缺陷。审查 02 "暂停控制台/真实链"冻结据此解除；memory README（Planner 同步）授权"修正配置/种子并续验真实链"。

## S1（已确认秘密入证据——暴露范围核实与处置）

- **已核实暴露范围**（工具回读，值不回显）：
  - 提交 `e7b4371`（**已推送 origin/develop-sw**，远端回读同 SHA）中：`evidence/admission-chain-01/a3-full-matrix.json` 含真实 appSecret 1 值（64 字符，出现于恢复凭据 PUT body）+ 明文测试密码 1 值（8 字符）；`implementation-admission-and-config-05.md` 秘密扫描段含原始手机号 2 个（178\*\*\*\*90 / 139\*\*\*\*88）。`git grep` HEAD 全树：真实 appSecret 仅命中该 1 文件；server 仓 HEAD 树 0 命中
  - a1-module-gate-332.log 的 "phone-like" 3 处为 40 位十六进制 token 哈希内数字段，误报（已用收紧边界复核定性）
- **处置**（不改写 Git 历史、不复制原文备份）：Planner 已就地脱敏真实值；执行补脱敏 2 个测试桩值（s1-redact-evidence.py，redacted=4），并落地**采集端脱敏工具**与**扫描器**入 evidence：
  - `s1-redact-evidence.py`（就地脱敏，幂等，仅输出计数）
  - `s1-secret-scan.py`（形态类+已知值类双通道，仅输出路径/计数/退出码）
  - `s1-final-scan.txt`：**40 文件，keyedSecret/phone/privateKey/bearer/knownValue 全 0，exit_code=0**
- **Owner 决策项（执行不越权）**：①历史与远端暴露后的凭据轮换（涉钉钉控制台，B1 冻结解除后由 Owner 决定时机）；②是否进行历史改写（需 Owner 明确授权）
- 已知值类扫描依赖 /tmp 运行时制品存在；扫描器对该依赖缺失时的行为=known_value_classes 计数下降并在报告中注明

## A4（验收目标偏离——实现修正+具名断言）

**核实结论：偏离属实。** 原实现 `doHandleCallback` 在回调时加载"当前"配置换票（回执 05 `usesCurrentConfig` 用例断言的正是该行为），与方向 §三"旧配置发起未完成授权安全失败并可重新发起，不串用新旧配置"相反。

**修正实现（配置生命周期绑定）**：
- V104 迁移（h2+postgresql）：`sys_sso_auth_state` 新增 `config_digest`（可空，历史行 NULL 回调侧一律 fail closed）
- 指纹材料单一来源 `SsoAuthService.fingerprintOf(provider, appId, 解密secret, 企业标识, 启停)` SHA-256（secret 以解密值参与——密文含随机 IV 不可作材料；解密失败以占位标记参与=同口径 fail closed）
- 发起侧：`startAuthorize`/`startAuthorizeLogin` 落库时写入指纹
- 回调侧：enabled 检查后比对 state 指纹 vs 当前指纹，失配 → 审计 `config changed since authorize start` + 统一拒绝（state 已原子消费，不可复用）
- 票据侧：`SsoTicketStore.issue` 增加指纹载荷；兑换时 `currentConfigDigestFor` 比对，失配/停用 → 审计 + 401 拒绝，**零会话签发**（不生成 access/refresh）

**具名用例与结果**（模块内服务端隔离集成，不出站）：
- 回调侧 7 例（SsoAuthServiceTest）：appId/secret/身份模式（个人→企业）/企业标识（corp-a→corp-b）/停用 各维变更 → 在途回调拒绝（不出站、零绑定插入、审计原因精确）；历史行无指纹 fail closed；**新配置重新发起 → 按新配置换票并正常准入绑定登录**（捕获式 client 断言换票用新 appId/secret）
- 票据侧 7 例（SsoTicketExchangeConfigChangeTest，新建）：5 维变更/停用 → 兑换拒绝；配置一致 → 正常签发；拒绝路径 verify **generateToken/createRefreshToken 从未调用**（会话零签发）
- 既有语义保持：G6b1 Boot 链、G3b 企业错配（ENTERPRISE_MISMATCH，指纹一致时仍在换票后拒绝）全部绿

## A2（零增量与 tenant1 同号夹具——具名集成断言）

`SsoAdmissionZeroIncrementIntegrationTest`（新建，4/0/0/0）：真实 H2（schema-datascope + V84/V87/V104 真实 DDL）、真实 Mapper/租户拦截器/事务链、受控厂商桩（不强制厂商扫码），固定对象 tenant100（I5测试租户）与 tenant1：
1. 可信手机号无本地用户 → 拒绝；sys_user/sys_sso_user_binding **零增量**、LOGIN_SUCCESS 零增量、`no local user with trusted phone` 审计精确 +1
2. 租户内重复手机号（两夹具同号）→ 拒绝；零增量；`ambiguous phone in tenant` 审计精确 +1（重复拒绝≠唯一约束拒绝；重复夹具保留不合并）
3. 仅 tenant1 有同号用户 → tenant100 仍拒绝（不跨租户搜索）；tenant1 对象零增量
4. 正验对照：唯一命中 → 自动绑定既有用户（不新建用户，绑定恰好 +1、LOGIN_SUCCESS 在册）——证明夹具与计数口径有效
会话零增量口径：拒绝发生在准入链内，票据签发/兑换（会话建立点）不可达，以 LOGIN_SUCCESS 零增量断言。与已锁定真实链审计 `a2-batch7-matrix-audit.json`（16:47:10 ambiguous / 16:49:18 no local user）组合覆盖，该审计保留原时点不改写。

## A1（快照错配与转录——同轮产物+身份关联）

- **转录错误承认与更正**：回执 05 称 SsoAuthServiceTest XML=42、BindingSession XML=6——实际入库存档 XML 为 **40** 与 **5**（工具回读）。根因：XML 于 16:38 轮（332 模块门禁）导出，门禁日志取自 16:54 轮（334），**产物与日志错轮次**；"Boot 6"实为 BindingSession 5 + CipherRuntimeDiag 1 的总数误标到单类。本轮全部计数改为**同一次门禁运行的日志与 XML 同源导出**（a1-run-identity-final.txt）
- 最终候选身份（a1-run-identity-final.txt 全文工具回读）：
  - Server HEAD 完整 40 位 `dff266add04a59e0859547f11b647772b20f8e6a`（develop；工作树 0 脏项；origin/develop 远端回读同值；= 964f2cb + 本批 A4 修正/V104/A2 集成测试/锚更新）
  - Web HEAD `38672cd…` → `9375359fae6b3bd511043e0299e96400318820f8`（A3 tooltip 局部修复批次，origin/develop 推送回读一致；工作树 0 脏项）
- 运行产物与进程关联：dev jar `sw-bootstrap/target/bootstrap-dev.jar` sha256 `46405d102b177b2aa8ce6aa8e641a1e71afeb71a179315fc078cbda13225a0ca`（dff266a 构建，20:01:02）；运行进程 PID 18938（lstart 20:01:15，lsof 加载该 jar 句柄 2 处）；flyway 113 迁移、终点 v907（**V104 在册**，backend-a4.log 迁移行）
- 门禁实跑（原始日志入 evidence：a1-final-upstream-gate.log + a1-final-bootstrap-gate.log）：
  - 上游（run2，源码与 dff266a 相同——其后仅 bootstrap 锚测试计数文件修正）：**sw-biz-system-biz 351/0/0/0**（[16/24]，= 347 + 4 A2 集成）；其余模块全绿（32/17/29/118/51/57/1/349/160/61/218/10 均 0 失败）
  - bootstrap（计数修正后单独重跑，= dff266a 精确树）：**173/0/0/0 BUILD SUCCESS**
  - 锚机械更新清单：FlywayFullChainH2Test（105/72/71/68/终点"104"）、FlywayFullChainPostgresTest（103/70/103 条）、I6G7UpgradeDrillH2Test（终点"104"）、Phase4PgMigrationBehaviourTest（"104"×3）——run2 中 5 例失败均为本清单首次遗漏的计数点，修正后 bootstrap 全绿
- 具名 XML 计数（与门禁同轮 surefire-reports，工具解析）：SsoAuthServiceTest **48**（= 42 实际基线〔16:38 存档 XML 40 为错轮次旧版；run2 树实为 42，含 2 例旧语义 A4〕− 2 例旧语义 + 7 例新 A4 生命周期 + 1 例企业厂商字段错配改写）、SsoTicketExchangeConfigChangeTest **7**（新建）、SsoAdmissionZeroIncrementIntegrationTest **4**（新建）、SsoPhoneNormalizerTest 3、SsoCredentialCipherCompatTest 2；Boot 侧 I5SsoBindingSessionBootTest **5** + I5SsoCipherRuntimeDiagTest **1**（**Boot 总 6 与单类 5 分列标注**——回执 05 的"XML 42/单类 6"为错轮次转录，已在本文开头承认更正）

## A3（恢复值异常与 UI 缺证）

- **恢复值差异定源**：本地种子 `/tmp/sw-sso-verify/seed/V904__sso_local_real_providers.sql` 即错值源头（`dingzoptrn9m33rwe1`，12:29 密钥轮换重写时手写误）；16:0x A3 矩阵的"恢复真实值"忠实写回了种子错值——测试改值与恢复机制本身无缺陷，错在种子字面量。**与 Owner 裁决互证：该错值同时是 900103 的根因**（本地配置错 → 授权 URL 带错 clientId → 钉钉 900103）
- 修正与回读：种子已改为 Owner 给定 20 位值；重启后 API 回读（t100admin 登录，GET /system/sso/config）：**DINGTALK appId=`dingzoptrn9m3m33rwe1`（len=20）**、enabled=true；FEISHU 启用；WECOM 停用+deferred=true（终态正确）
- UI 完整字段证据（PC 1280 视口，headless=false 可交互会话，截图入 evidence）：
  - `a3-fixed-admin-list.png`：整表终态（DingTalk/Feishu 启用+Configured；WECOM 延期标签+Not set+开关停用+仅 Check）
  - `a3-tooltip-appid-full.png`：DingTalk appId 单元格 tooltip 展开完整 20 位值
  - `a3-tooltip-callback-full.png`：callback 列 tooltip 展开完整回调 URL（**Web `9375359` 局部修复**：自定义 span 模板使 show-overflow-tooltip 溢出检测失效且确不可达，按审查授权改回纯 prop 列）
  - `a3-restricted-ua3flist-page.png`：受限身份 u_a3flist（A3查看用户）登录实际页面——仅 list+Check，无 编辑/更新凭据/开关/审计（DOM 断言 Edit/Audit/switch 均不存在），与权限分项一致
  - H5 边界：390 布局可达性沿用既有 `mobile-sso-config-390.png`（布局未变）；修正值的移动端回读未重摄，以 API 回读+PC 证据为准，边界如实登记

## A6（同步缺证——knowledge 先行+逐字段回读矩阵）

knowledge/features/sso-admin-config.md 已按本裁决更新（VERIFYING 未通过、B1 解除与根因、S1 处置、A4 修正、A2 断言、A3 定源+回读+UI、900103 表述=Owner 已验证事实、候选 dff266a/9375359、门禁 351/173）。逐字段回读矩阵（核验时点 2026-09-29 20:1x，全文回读比对）：

| 字段 | 目标值（审查02裁决） | knowledge 实际位置与值 | 一致 |
|---|---|---|---|
| 功能状态 | VERIFYING（未通过，补证推进） | 标题引语「VERIFYING（回执 05 未通过，执行补证推进中，待规划验收）」 | ✓ |
| 唯一账本指针 | planning-review-admission-and-config-02.md（回执05复核节） | 标题引语+当前裁决引用 | ✓ |
| 900103 根因 | Owner 人工验证已裁决；不再是工作假设 | B1 段「根因已由 Owner 人工验证裁决」+证据文件名 | ✓ |
| S1 | 暴露范围核实+采集端脱敏+扫描可判定 | S1 段（e7b4371 范围+工具+0 命中 exit 0+Owner 决策项） | ✓ |
| A4 | 旧授权安全失败实现修正 | A4 段（V104+指纹+具名用例清单） | ✓ |
| A2 | 零增量+tenant1 夹具具名断言 | A2 段（4 用例+口径声明） | ✓ |
| A3 | 恢复值定源+回读+UI 证据 | A3 段（定源+20 位回读+四图+Web 9375359+H5 边界） | ✓ |
| A5 | 已通过（锁定） | 已锁定保留行 | ✓ |
| 候选 | dff266a + 9375359 | 候选与门禁段 | ✓ |
| 门禁 | 实跑计数 | 模块 351/0/0/0、bootstrap 173/0/0/0、Boot 6=5+1 分列 | ✓ |
| 企业微信 | Owner 延期 | 独立行 | ✓ |
| P31 | 开放未核销 | 标题引语 | ✓ |

memory 五文件同步（先 knowledge 后摘要，逐文件实际写入回读）：README.md / state.md / features.md / issues.md / handoff.md 的 sso-admin-config 摘要行已替换为回执 06 口径（补证完成、根因裁决、剩余=Owner 扫码），handoff 下一动作行同步更新；五文件均 grep 回读替换成功（脚本输出 replaced×5）。knowledge/features/sso-admin-config.md 与 memory 摘要无现状冲突（memory 为压缩摘要，权威在 knowledge）。

## B1 恢复执行（按账本解除条件）

- Owner 探针证据固化入 evidence：b1-dingtalk-challenge-wrong-clientid-900103.html（900103 页内嵌 errorCode）、b1-dingtalk-challenge-correct-clientid-ok.html（正常页）、b1-dingtalk-authurl-correct-clientid.txt（10:15:49 授权 URL 用 20 位值）、b1-dingtalk-morning-chain-audit.json（10:14:52—10:16:21 AUTH_START→EXCHANGE→BIND 9002→LOGIN_SUCCESS 完整审计，四件均过敏感形态检查）
- 本地修正落实与探测（新实例 PID 18938，dff266a 构建）：
  - 配置回读：DINGTALK appId=`dingzoptrn9m3m33rwe1`（len=20）✓
  - 授权 URL：`GET /auth/sso/DINGTALK/authorize-login?tenantName=I5测试租户` → authorizeUrl 的 clientId=**20 位正确值**（b1-new-authorize-url-after-fix.txt）
  - 只读探测该 URL：钉钉响应页 HTTP 200、6483 字节（与 Owner 正常页同规格）、**900103 出现 0 次、无错误页变量**（b1-new-challenge-page-after-fix.html）——900103 复现路径消除
- **剩余**：钉钉 B 端准入新链（预建用户→手机号自动绑定→登录+解绑重绑）需 Owner 浏览器扫码授权（真实人机验证=外部依赖）；已按 memory README 授权口径执行至可扫码步骤，**需 Owner 交互时提醒**

## 门禁

- 上游模块（a1-final-upstream-gate.log，源码=dff266a）：sw-biz-system-biz **351/0/0/0**；其余 12 模块全绿（32/17/29/118/51/57/1/349/160/61/218/10）
- bootstrap（a1-final-bootstrap-gate.log，dff266a 精确树+计数修正）：**173/0/0/0 BUILD SUCCESS**
- Web：vue tsc+vite build 通过（9375359，lint-staged eslint/prettier 通过）；本批次 Web 无测试口径变化
- 与验收标准对照：方向 §三「修改 appId、身份模式、企业标识或应用 secret 时，旧配置发起且未完成的授权安全失败并可重新发起，不串用新旧配置」——A4 段具名用例逐维满足；「停用 Provider 后拒绝新授权及在途回调/未兑换票据的新会话签发」——回调侧停用拒绝+票据侧停用拒绝（既有语义保持）满足

## 剩余可执行项与外部依赖

1. 钉钉扫码授权（Owner 真实人机验证）→ 完成后重跑准入真实链补入回执
2. S1 凭据轮换与历史处置决策（Owner 裁量项）
其余独立可执行项：0（全部完成于本回执）
