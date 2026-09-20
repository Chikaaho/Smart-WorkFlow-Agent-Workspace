# P60 I5 三 Provider 文档级可用交付 —— 阶段实现回执 10

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 当前执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-09.md`
> 验收依据：`planning-review-stage-i5-v0.0.3-oa-iteration-09.md` 与 Owner 裁决（文档级可用交付）
> 回执状态：**自验提交，待规划验收**（`VERIFYING / EXECUTION_SUBMITTED`）
> Server HEAD：`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`；iteration-10 最终工作树 `486b1116eb6016024c8e1e4a00b50244af2f3cb5`（未提交、未推送）
> Web HEAD：`5788ead33c4347214a350d124331237e85068bdf`（零修改）

## 0. 本轮结论

按 Owner 裁决完成三 Provider **文档级可用交付**：官方文档—实现—配置三向对照完成（对照账本绑定官方 URL 与访问日期）；确证差异 1 处（飞书授权 URL 缺 `response_type=code`）已修复并过受影响回归；禁用态占位配置样例与统一 Owner 自验手册已交付；秘密零残留扫描通过。三 Provider 真实成功链（G8-WECOM / G8-FEISHU / G8-DINGTALK）转移为 **Owner 后续自验裁决**，本轮未声称任何真实 API 成功。

**Owner 验收入口：`Smart-WorkFlow-aPaaS-server/docs/sso/owner-acceptance-handbook.md`**（样例：同目录 `provider-config-example.yml`）。

## 1. G8-DOC-* 对照结果（[evidence/i5-10/doc-comparison.md](evidence/i5-10/doc-comparison.md)）

| Provider | 授权发起 | 换票 | 稳定主体标识 | 结论 |
|---|---|---|---|---|
| WECOM | qrConnect（98151：旧版仍可用、推荐迁移，未废弃） | gettoken（91039）+ getuserinfo（91023，errcode/userid） | userid | 一致；qrConnect 登记为「可用但推荐迁移」，切换属产品演进，不修复 |
| FEISHU | authen/v1/authorize（官方含 `response_type=code`） | authen/v2/oauth/token（grant_type/client_id/client_secret/code → data.access_token）+ app_access_token/internal | open_id（user_info v1） | **确证差异 1 处已修复**；另登记换票 redirect_uri 非确证观察点 |
| DINGTALK | login.dingtalk.com/oauth2/auth（clientId/redirect_uri/response_type/scope=openid/state/prompt） | POST /v1.0/oauth2/userAccessToken（clientId/clientSecret/code/grantType） | unionId（GET /contact/users/me + x-acs-dingtalk-access-token） | 一致 |

## 2. 实现改动（最小）

| 文件 | 摘要 |
|---|---|
| `sso/FeishuSsoProviderClient.java` | `buildAuthorizeUrl` 补 `&response_type=code`（官方授权 URL 固定值；对照差异唯一代码修复） |
| `docs/sso/provider-config-example.yml` | 新增：非秘密禁用态样例——系统级 3 个环境键（`SW_SSO_CIPHER_KEY`/`SW_SSO_CALLBACK_BASE_URL`/`SW_SSO_CALLBACK_ALLOWLIST`）+ 租户级 `sys_sso_provider_config` 行模板（`__SET_ME__` 哨兵、enabled=0、secret 占位留空）+ 启用边界 fail-fast 说明 |
| `docs/sso/owner-acceptance-handbook.md` | 新增：Owner 自验手册——控制台配置项、系统配置键、HTTPS 回调/白名单、启用顺序（disabled→enabled）、绑定/已绑定登录/解绑/失败恢复步骤与预期结果、清理与问题定位边界、安全红线 |

## 3. 验证与门禁（按提示 §4 最小充分）

- 聚焦：`SsoAuthServiceTest` 22/22（含飞书授权链断言，exit=0；`feishu-fix-sso-test.log`）。
- 受影响模块正式门禁：system-biz **295/0/0/0** BUILD SUCCESS（`system-biz-regression.log`）。
- 秘密零残留扫描：**NO-HITS**；`__SET_ME__` 哨兵仅存在于 `docs/sso/` 两个文档，运行时资源零残留；配置键与实现逐一核对一致（`secret-scan-and-consistency.txt`）。
- 样例静态回读：三 Provider 默认 `enabled=0`；占位值在启用边界由既有 `validateEnabledConfig` fail-fast 拒绝（实现未改，引用已锁定证据）。
- 指纹：`30fd54b2` → **`486b1116`**；manifest 去重 5 项，`sha256sum -c` exit=0。

## 4. iteration-10 四项明确区分（提示 §7）

1. **文档级可用交付：完成**（三对照、三占位样例、统一手册、最小验证、零残留扫描全部有可回读证据）。
2. **代码变更：1 处**（Feishu 授权 URL 补 response_type=code）；受影响回归如上，旧证据失效范围=飞书授权 URL 断言相关（已由本轮 22/22 覆盖），其余锁定证据不受影响。
3. **三 Provider 真实成功链：`WAIT_OWNER_ACCEPTANCE`**——无凭据，未声明成功；G8-WECOM/FEISHU/DINGTALK 由 Owner 按手册实测后裁决。
4. **Owner 入口：`docs/sso/owner-acceptance-handbook.md`**（先读样例 `provider-config-example.yml`）。

## 5. 边界与风险

- 飞书换票请求体未带 `redirect_uri`（官方示例含该字段，未取得「必填」明示）：登记为 Owner 自验关注点，修改需动 SsoAuthService 传参链，超出本轮最小修复范围。
- 企业微信沿用旧版 qrConnect（官方未废弃但推荐新版 wwlogin）：切换属产品演进决策，交 Planner/Owner。
- Provider 配置无 HTTP 管理端点（`saveConfig` 仅为服务层契约）：手册 §3 如实给出启用顺序与注入路径；是否补管理端点属产品演进，不在本轮范围。
- 未发起真实 Provider 出站调用；未写 I5 `PASSED/COMPLETED`；未动小程序/I6；工作树未提交未推送。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-10.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i5-10/doc-comparison.md","product/v0.1.0-oa-completion/receipts/evidence/i5-10/secret-scan-and-consistency.txt","product/v0.1.0-oa-completion/receipts/evidence/i5-10/feishu-fix-sso-test.log","product/v0.1.0-oa-completion/receipts/evidence/i5-10/system-biz-regression.log","product/v0.1.0-oa-completion/receipts/evidence/i5-10/g9-doc-fingerprint.raw","Smart-WorkFlow-aPaaS-server/docs/sso/owner-acceptance-handbook.md","Smart-WorkFlow-aPaaS-server/docs/sso/provider-config-example.yml"],"feature_status":"VERIFYING","work_items":[{"id":"G8-DOC-WECOM","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8-DOC-FEISHU","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8-DOC-DINGTALK","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8-OWNER-HANDOFF","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8-WECOM","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"Owner 按 docs/sso/owner-acceptance-handbook.md 注入真实凭据并实测后裁决"},{"id":"G8-FEISHU","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"同上"},{"id":"G8-DINGTALK","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"同上"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"提交规划验收 10：Planner 复核三 Provider 文档级可用交付与 Owner 交接包","next_action_type":"WAIT_PLANNER","progress_fingerprint":"486b1116eb6016024c8e1e4a00b50244af2f3cb5","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server: FeishuSsoProviderClient.java（授权 URL 补 response_type=code）","Smart-WorkFlow-aPaaS-server: docs/sso/owner-acceptance-handbook.md（新增）","Smart-WorkFlow-aPaaS-server: docs/sso/provider-config-example.yml（新增）"],"tool_actions":["三 Provider 官方文档只读核对（WebFetch/检索，URL+日期绑定 doc-comparison.md）","聚焦回归 SsoAuthServiceTest 22/22 + system-biz 295/0/0/0 BUILD SUCCESS","秘密零残留扫描 NO-HITS + 哨兵/配置键一致性检查","git write-tree 指纹 486b1116 + 去重 manifest verify exit=0"],"new_evidence":["evidence/i5-10/ 对照账本 + 扫描/回归原始流 + 指纹/manifest/verify","docs/sso/ 手册与禁用态样例"],"closed_work_items":["G8-DOC-WECOM","G8-DOC-FEISHU","G8-DOC-DINGTALK","G8-OWNER-HANDOFF"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"bash(mvn)","outcome":"SUCCEEDED","detail":"SsoAuthServiceTest 22/22 exit=0；system-biz 295/0/0/0 BUILD SUCCESS"},{"tool":"webfetch/websearch(官方文档)","outcome":"SUCCEEDED","detail":"WECOM 91022/91023/91039/98151 直接抓取；FEISHU/DINGTALK 官方契约经检索摘要核对，绑定官方 URL"},{"tool":"bash(grep/sha256sum/git)","outcome":"SUCCEEDED","detail":"秘密零残留 NO-HITS；哨兵仅 docs/sso；配置键一致；指纹 486b1116eb6016024c8e1e4a00b50244af2f3cb5；manifest 5 项去重 verify exit=0"},{"tool":"external-providers","outcome":"UNAVAILABLE","detail":"三 Provider 真实凭据未提供，真实成功链保持 WAIT_OWNER_ACCEPTANCE（G8-WECOM/FEISHU/DINGTALK PENDING）"}],"browser_status":"NOT_APPLICABLE"}
