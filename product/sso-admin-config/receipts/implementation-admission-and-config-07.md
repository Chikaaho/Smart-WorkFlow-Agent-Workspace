# sso-admin-config 实施回执 07：审查02回执06复核账本补证（A1a/A1b/A2/A3/A4/A6/S1a/S1b/B1）

入口：`planning-review-admission-and-config-02.md` 当前裁决（2026-09-29 回执06复核）。功能状态 **VERIFYING**；P31 开放；企业微信延期。权威输入：主方向、回执06、本账本及 evidence-index-07.json 所列附件。本轮为证据定点导出+最小局部修复（Web `86c5ec1`），无生产部署、无历史改写。

## S1a（扫描覆盖与索引）

- **已知值覆盖修正**：回执06 的扫描器从 mjs 脚本字面量提取 appSecret（0 命中→未实际检查）——本轮定源：真实 secret 存于专用运行时文件 `/tmp/sw-sso-dingtalk.secret`（64 字节）。扫描器重写已知值通道：`appSecret-dingtalk`（CHECKED，该文件）、`known-test-phone-1`（CHECKED，/tmp 种子 V906/V907 提取）、`password-dev-contract`（CHECKED，dev 测试契约常量）；无受控来源的类别显式标注 NOT_CHECKED（当前无此类；回执05 曾记录的第二手机号 139\*\*\*\*88 无受控运行时来源，其已知值检查标 NOT_CHECKED——仅存在于 e7b4371 历史版本，工作树已脱敏）
- **扫描结果**（`s1-final-scan.txt`，扫描器自排除）：scope_files=49、known_value_classes=3 全 CHECKED、`phone_real=0`、`keyedSecret=0`、`privateKey=0`、`bearer=0`、`knownValue(真实)=0`；非拦截分类单列：`phone_synthetic_fixture=7`（A2 集成夹具 178000099xx，等价测试源码常量）、`password_dev_contract_const=1`（a3-refixture.mjs 功能脚本，等价测试源码）；**fatal_hit_files=0、exit_code=0**。回执06 所写"40 文件全 0"以本报告为准（文件数随证据增加变动，数字以报告 scope_files 为准）
- **索引重建**：`evidence-index-07.json` 在扫描结束后生成；`s1-final-scan.txt` 标注 volatile 不参与哈希自引用（扫描器每次运行重写它）；其余条目逐项 sha256 校验存在且哈希为生成时点值

## S1b（远端暴露处置）

- **当前脱敏批次推送核实**：workspace `origin/develop-sw=2fe517a`（fetch 回读）；`git show origin/develop-sw:` 回读当前 a3-full-matrix.json 与回执05：**appSecret 命中 0、真实手机号命中 0、admin123 命中 0**（`s1b-remote-readback.txt`，值不回显）
- **传播范围**（汇总既有核实，未变）：泄露版本仅 e7b4371 单提交、origin/develop-sw 单分支；server 仓 0 命中
- **轮换影响/恢复方案（供 Owner 决定，执行不操作）**：
  1. **钉钉 appSecret（真实凭据，已在远端历史暴露）**：建议在钉钉控制台重置 secret——控制台/真实链冻结已随 B1 解除，重置时机由 Owner 定；重置后本地经 `PUT /system/sso/config/DINGTALK/secret` 写入新值（加密链与只写语义已验证），无需重建应用
  2. **admin123（dev 测试契约密码）**：仅 dev/test 契约与测试源码常量，生产密码策略独立；无需轮换，但生产管理员密码若与之同值应排除（Owner 核对项）
  3. **两个测试手机号**：178\*\*\*\*90 为 Owner 授权测试号（非个人敏感新暴露）；139\*\*\*\*88 建议 Owner 确认归属，必要时在厂商侧换绑
  4. **历史改写**：git filter-repo+force push 属破坏性操作，须 Owner 单独授权方可执行；不授权则历史在远端持续可见（上述轮换即主要缓解）

## A1a（同轮报告定点导出）

现存同轮 surefire XML（mtime 与门禁轮次吻合）5 份已脱敏导出并解析（`a1-xml-final-parse.txt` 全测试名清单+计数；XML 本体 a1-surefire-final-*.xml）：

| 文件 | tests/failures/errors | mtime | 所属日志 |
|---|---|---|---|
| SsoAuthServiceTest | **48**/0/0 | 19:27 | a1-final-upstream-gate.log（biz 351 轮） |
| SsoTicketExchangeConfigChangeTest | **7**/0/0 | 19:27 | 同上 |
| SsoAdmissionZeroIncrementIntegrationTest | **4**/0/0 | 19:27 | 同上 |
| I5SsoBindingSessionBootTest | **5**/0/0 | 19:59 | a1-final-bootstrap-gate.log（173 轮） |
| I5SsoCipherRuntimeDiagTest | **1**/0/0 | 20:00 | 同上 |

对象/候选：Server `dff266add04a59e0859547f11b647772b20f8e6a`（该 XML 所在运行即此源码树）。旧 16:38 XML（a1-surefire-*.xml 无 final 中缀者）保留并**标历史**（evidence-index-07 中标注"历史-错轮次"）。边界：identity 文件的 workspace 远端行曾在导出时点为 e7b4371，本轮随提交推进，最终值以 a1-run-identity-final.txt 重导出为准。

## A1b（Web 工程门禁输出）

- 宪法依据：Web 工程宪法 §2.1 L/XL=四连全绿（typecheck && lint && test && build，带 2G NODE_OPTIONS，确定退出码）
- 实跑（最终 Web 候选 **`86c5ec123f2fde2b2b06b14e8039f51fcfdc7a02`** 工作树）：typecheck exit 0 / lint exit 0 / vitest **1301 passed + 3 skipped（142 文件+1 skipped）** exit 0 / build exit 0——原始输出 `a1b-web-gate-86c5ec1.log`
- 适用范围说明：本轮 Web 改动=SsoConfig.vue 模板/样式两处（tooltip 列、列宽），涉及页面构建产物 → 适用完整四连（非纯样式豁免路径）；dev:mock 非本任务 gate（纯管理页面，宪法口径最多可选附注）

## A2（行为断言定位——与 A1a 共用同轮报告）

具名场景、固定对象与断言（测试名均可在 `a1-surefire-final-SsoAdmissionZeroIncrementIntegrationTest.xml` 定位，断言计数以测试源码与 XML system-out 对应）：

| 场景（测试名） | 固定对象 | 断言结果 |
|---|---|---|
| admissionNoLocalUser_rejected_zeroIncrement | tenant100（I5测试租户）、桩手机号 17800009999（合成） | 拒绝 SSO_ADMISSION_REJECTED；sys_user/sys_sso_user_binding 前后相等；LOGIN_SUCCESS 零增量；`no local user with trusted phone` 审计恰好 +1 |
| admissionAmbiguousPhoneInTenant_rejected_zeroIncrement | tenant100 用户 9521/9522 同号 17800009998 | 拒绝；零增量；`ambiguous phone in tenant` 审计 +1；重复夹具保留（count=2） |
| admissionOnlyOtherTenantHasPhone_stillRejected_otherTenantUntouched | tenant1 用户 9531 同号 17800009997；tenant100 无匹配 | tenant100 仍拒绝；tenant1 绑定零增量；审计 +1 |
| admissionUniquePhonePositiveControl_bindsWithoutUserCreation | tenant100 用户 9541 / 17800009996 | 自动绑定恰好 +1 行（user_id=9541）；用户零新建；LOGIN_SUCCESS 在册 |
- **票据/会话边界关联**：拒绝发生在 `handleCallback` 准入链内（`SsoAuthService.java` admitCallback 抛出先于控制器 `ticketStore.issue`）；票据签发与兑换是会话建立唯一路径（controller callback→issue→exchangeTicket→generateToken），拒绝路径不可达票据——以 LOGIN_SUCCESS 零增量+审计无票据事件断言，不重复真实链扫码（已锁定审计 a2-batch7-matrix-audit.json 继续保留）

## A3（390 触屏与延期标记——同一最终候选 86c5ec1）

- **延期标记局部修复**：provider 列 130px 下英文 tag "Deferred (read-only)" 物理截断且无 tooltip 能力（确不可达）→ 列宽 130→170（Web `86c5ec1`）；`a3-deferred-tag-full-pc.png`：tag 全文完整可见
- **390 触屏**（`setViewportSize(390×844)`，真实视口非仿真）：
  - `a3-mobile-390-final-candidate.png`：初始视口 Provider+Actions（Edit/Update credential/Check 直达可达）
  - `a3-mobile-390-scroll-fields.png` / `a3-mobile-390-scroll-appid-callback.png`：表体横向滑动（等价触屏滑动）依次露出 Credential/Identity mode/App ID 等中间字段——全部列经滑动可达，操作列 fixed-right 恒可达
- 边界：390 截图为 admin 身份（含操作）；受限身份 390 未单拍（PC 受限身份证据已核销，390 与 PC 同一权限渲染链）；App ID 全文在 390 依赖 tooltip（hover 在触屏为长按语义，已由 PC tooltip 证据覆盖能力本身）

## A4（生命周期定位——与 A1a 共用具名输出）

- **身份模式参与核实（说明性核销，无实现缺陷）**：服务端配置模型无独立 mode 列（`sys_sso_provider_config`=provider/enabled/app_id/app_secret_enc/extra_config/redirect_path）；`identityMode` 为派生态=`extra_config.enterpriseId` 有无（SsoAuthService.java 列表装配 264-265 行）；模式切换唯一途径=extra_config.enterpriseId 写入/清除（updateConfigBasic 296-300 行 + validateEnterpriseConfig 强制企业模式非空）。指纹材料第 4 段=该 enterpriseId 原值（personal=空串）→ **模式切换必然改变指纹，覆盖完整**
- **具名定位**（`a1-surefire-final-SsoAuthServiceTest.xml` / `...SsoTicketExchangeConfigChangeTest.xml` 测试名可检索）：
  - 回调侧 5 维：callback_appIdChangedAfterAuthorizeStart_rejected / callback_secretChangedAfterAuthorizeStart_rejected / callback_identityModeChangedAfterAuthorizeStart_rejected / callback_enterpriseIdentityChangedAfterAuthorizeStart_rejected / callback_disabledAfterAuthorizeStart_rejected
  - 历史行：callback_legacyStateWithoutDigest_failClosed；新配置重发起：callback_afterConfigChange_reinitiateSucceedsWithNewConfig（捕获式 client 断言换票用新 appId/secret）；企业错配语义保持：callback_enterpriseVendorFieldMismatch_rejectedAfterExchange
  - 票据侧 7 例：ticket_appIdChangedAfterIssue_rejected / ticket_secretChangedAfterIssue_rejected / ticket_identityModeChangedAfterIssue_rejected / ticket_enterpriseIdentityChangedAfterIssue_rejected / ticket_disabledAfterIssue_rejected / ticket_configUnchanged_exchangeSucceeds / **ticket_rejectedPaths_issueNoSession**（断言 generateToken 与 createRefreshToken **never()**——不签发会话的实际 verify，非推断）
- 边界：模块内服务端隔离集成（不出站），审查02授权口径

## A6（全当前入口回读矩阵）

| 入口 | 路径/字段 | 本轮实际值（核验时点 2026-09-29 21:0x） | 一致 |
|---|---|---|---|
| knowledge/current-status.md | 顶部三方 SSO 条目内 sso-admin-config 子句 | 已更新：回执06批次事实（dff266a/86c5ec1、351/173、根因裁决、扫描 exit0）；下一动作=回执07 账本 | ✓ |
| knowledge/features/sso-admin-config.md | 全文 | 回执06 口径（本轮 Web 候选更新为 86c5ec1 见回执07） | ✓ |
| memory/README.md / state.md / features.md / issues.md / handoff.md | sso 摘要行 | 回执06 口径（上轮已同步，replaced×5 回读）；本轮事实增量（86c5ec1、四连、390）随回执07 由下一轮同步或在终态同步收敛，当前无矛盾表述（VERIFYING+剩余项口径一致） | ✓ |
| todo/requirement-pool.md | P31 行 | VERIFYING（Planner 维护值，未核销） | ✓ |
| 功能数/清单 | 45、✅46/🟦22/⬜22、P31 开放 | 未动 | ✓ |

## B1（本人交互——授权页已打开）

- 新授权 URL（clientId 20 位）生成后**已在可交互 IAB 标签页打开**（headless=false）：钉钉响应页为「此账号已在使用，可直接登录个人测试 → 立即登录」**免扫码一键授权**页，无 900103；截图 `b1-fresh-authorize-page-opened.png`，标签页已 markHandoff 保留
- **提醒 Owner**：浏览器中已打开钉钉授权页，点击「立即登录」即完成本次授权（state 限时 5 分钟，过期我会重新生成再开）；授权完成后我核验：预建用户（t100user/tenant100）首次自动绑定、后续登录、无本地用户拒绝与零增量，并完成 A4 修复后真实链对应
- 边界：真人授权步骤不代点；state 过期属正常限时语义，重新发起即可

## 门禁增量（本轮）

- Server：无生产代码改动（仅证据/文档），不重跑（回执06 的 351/173 依旧适用同一 dff266a 树）
- Web：86c5ec1 四连全绿（见 A1b）；本批两处 Vue 改动各自 build 通过并提交（9375359→86c5ec1）

## 剩余项

1. B1：Owner 在已打开的授权页点击「立即登录」→ 我接续核验准入真实链（唯一外部依赖，页面已就绪）
2. S1b：凭据轮换/历史处置四项方案待 Owner 决定（见上，不阻塞其余工作）
其余独立可执行项：0
