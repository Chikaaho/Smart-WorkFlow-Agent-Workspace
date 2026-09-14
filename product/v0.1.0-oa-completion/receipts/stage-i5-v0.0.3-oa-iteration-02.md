# P60 I5 租户安全收口与第三方 SSO —— 阶段实现回执 02（复验补证）

> 执行角色：执行（Executor）
> 日期：2026-09-13
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 前置审查：`planning-review-stage-i5-v0.0.3-oa-iteration-01.md`（17 项全部未达证据门槛，下发 G1—G9 缺口账本）
> 回执状态：**自验补证完成，待规划验收**（保持 `VERIFYING / EXECUTION_SUBMITTED`）
> 候选身份：Server `5e976b898aa0d55061402f1ecbf366ed0060bb57`（develop，本地未推送）；Web `fc5f70b8d071ff0d5f5d4f11850f847c802a5a40`（develop，本地未推送，本轮零改动）

---

## 0. 本轮总述

本轮不新增产品功能，主体为：按 G1—G9 账本在**真实运行环境**（dev profile H2 完整启动 + 真实 HTTP 全链、zonky 真实 PostgreSQL prod-profile 完整启动）采集原始行为证据；同时修复了真实环境证据暴露出的 **4 处上轮未发现的实现缺陷**（见 §2）。所有原始输出落盘 `evidence/i5-02/`。

真实环境证据立即暴露并修复：

1. **真实迁移链缺默认租户 0 行**——种子账号登录在登录第 7b 步/身份装载即被租户校验拒绝（上轮仅单测夹具自建租户行，未暴露）。修复：V85 幂等种子。
2. **application-dev.yml 重复 `spring:` 顶层键**——SnakeYAML fail-fast，dev profile 完整启动从未成功过。修复：合并为单键。
3. **免认证 SSO 路径与调度线程被 fail-closed 租户拦截器误伤**——回调/登录前发起/命令回收/时限扫描/作业列表/IoT 补偿返回 500。修复：与 `claimDue` 同口径显式挂起（租户语义全部由显式谓词承担）。
4. **dev 专用验证 runner 无登录态写入**——元数据 fail-closed 填充 NULL 租户。修复：显式系统操作人上下文（租户 0 边界真实成立）。

## 1. 证据目录（`evidence/i5-02/`）

| 文件 | 内容 |
|---|---|
| `g9-server-affected-tests-final.log` | 八模块受影响测试全量原始输出：**766 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS**（common 18、security 17、system-biz 290、form-biz 132、bpm-engine 50、bpm-process 205、openapi 6、bootstrap 48，含 Flyway H2 86 / PG 85 终点 V86） |
| `g9-web-four-gates.log` | Web typecheck/lint/test/build 四门原始输出 |
| `g1-chain-tenant100.raw.json` / `g1-chain-tenant0.raw.json` | 租户 100 / 租户 0 真实 HTTP 全链（固定身份、对象 ID、逐层回读） |
| `g1-poll-tenant100.raw.log` / `g1-poll-tenant0.raw.log` | 异步命令消费、待办、审批完成、已办、通知、我的实例原始响应 |
| `g2-g4-g5-g7-negatives.raw.json` | 停用/过期租户登录拒绝、匿名矩阵、authorize-login 正反、state 伪造/重放、审计隔离原始响应 |
| `g6-bind-chain.raw.json` | 绑定成功→重复拒绝→解绑→重复解绑拒绝→匿名 401→审计隔离原始响应 |
| `g3-prod-boottest.log` | **prod-profile 完整启动（zonky 真实 PG + 全链迁移）+ 匿名暴露矩阵 + 缺密钥 fail-fast**，2/2 通过 |
| `g3-prod-boot-no-secrets.log` | 外部真实 `spring-boot:run`（prod、无密钥）进程退出码 1 原始日志 |
| `g7-sentinel-scan.txt` | 哨兵零残留扫描：secret 明文与全部注入密钥值在日志/证据零命中 |
| `g5-nonce-official-mapping.md` | 三 Provider `nonce` 官方支持映射（官方文档链接 + 落地口径） |
| `g9-server-changed-files-manifest.txt` | 相对候选 `aaafd747` 的 15 个变更文件 sha256 manifest |

## 2. 实际修改（Server 15 文件，+453/−68，候选 `5e976b89`）

**实现修正**
- `V85__i5_seed_default_tenant.sql`（h2/postgresql，bootstrap）：幂等补 `sys_tenant` id=0 默认租户行。
- `V86__i5_provider_app_unique.sql`（h2/postgresql，system）：`(provider, app_id, deleted)` 全局唯一索引——同一 Provider 应用归属唯一租户，从模型上阻断同应用外部主体跨租户重复绑定（G6 冲突模型缺口）。
- `SsoCallbackPolicy.java`（新增）：Provider 回调 URL 白名单策略，与 Spring `permit-urls`（传输层匿名放行）职责分离；`sw.security.sso.callback-base-url` / `callback-allowlist` 配置，白名单外 fail closed。
- `SsoAuthService.java`：新增 `startAuthorizeLogin`（登录前显式租户 + 服务端校验租户有效性与 Provider 启用后才签发 state）、`queryAudit`（租户隔离审计查询）；`saveConfig` 增加跨租户应用冲突拒绝；`handleCallback`/`startAuthorizeLogin` 显式挂起租户拦截器；审计写入在无登录态路径挂起过滤并显式携带 state 所属租户（无上下文系统事件落默认租户 0，满足 NOT NULL）。
- `SsoAuthController.java`：新增免认证 `GET /{provider}/authorize-login`（permit-urls 白名单）与权限守卫（`@ss.hasPermi('system:sso:audit:query')`）的 `GET /audit`；authorize-login/callback/bind/bind-candidate/unbind 全部业务异常归一为可判定 400（不回显 code/state 原文、不泄漏栈）。
- `SecurityProperties.java` / `application.yml`：默认 permit-urls 增加 `/auth/sso/*/authorize-login`。
- `application-dev.yml`：修复重复 `spring:` 键；devseed Flyway location（仅 dev 装载）。
- `PersistentBpmCommandQueue.reclaimStale`、`TaskDeadlineScheduler.scan/processSafely`、`JobInfoServiceImpl.listEnabled`、`CommandQueueServiceImpl.getExpiredCommands`：调度线程显式挂起租户过滤（与 `claimDue` 同口径）。
- `BpmVerificationRunner` / `VerificationRunner`（dev-only）：显式系统操作人上下文（租户 0）。
- `devseed/h2/V900、V901`（仅 dev 装载）：可控测试租户 100/200(停用)/300(过期)、租户 100 管理员/无角色用户、审计查询权限菜单、租户 100 的 WECOM Provider 配置（secret 为 AES-GCM 密文，明文哨兵仅用于零残留扫描）。

**测试资产**
- `SsoAuthServiceTest`：新增登录前发起（缺租户/无效租户/成功绑定租户）、回调白名单正反、审计查询守卫、跨租户应用冲突拒绝等 7 例（总计 17 例）。
- `FlywayFullChainH2Test/PostgresTest`：计数与终点更新为 H2 86 / PG 85 / V86。
- `I5ProdProfileSecurityBootTest`（新增）：prod-profile 真实 PG 完整启动 + 匿名矩阵 + 缺密钥 fail-fast，2 例。

Web 本轮零改动（候选仍 `fc5f70b`），四门复跑通过。

## 3. G1—G9 逐项对照

### G1 非零租户 OA 全链 —— 已补齐真实行为证据 ✅

真实 dev 环境（H2 全链迁移 + 完整启动）真实 HTTP：租户 100（用户 9001）与租户 0（用户 1）各自独立完成 **同键表单创建→配置→发布→租户流程定义创建（含 APPROVAL 节点图）→发布→草稿创建→提交→命令受理（commandId 固定，ACCEPTED）→异步消费→Flowable 实例/任务→审批通过→轨迹（processed）→通知**，逐层 `tenantId` 勾稽一致：

- 租户 100：流程实例 `2099091607658692610`（tenantId=100）、Flowable task `c292ea7f-…`、通知 `2099101724105154562`（tenantId=100）、实例状态 APPROVED；
- 租户 0：实例 `2099091639627677698`（tenantId=0）、task `c720d723-…`、通知 `2099101755205918721`（tenantId=0）；
- 双方同键 formKey（`leave_t100_g1` / `leave_t0_g1`）互不冲突；同租户重复 formKey 被拒（真实 400）；跨租户读对方对象均判不存在（`表单不存在`/`流程实例不存在`）；
- 工作台布局保存/读回成功且写入 marker 勾稽。

### G2 入口 fail closed —— 已补齐 ✅（含真实缺陷修复）

- 停用租户（200）登录：`401 所属租户不可用，无法登录`；过期租户（300）登录：同拒绝（V85 修复后真实环境首次可验证——修复前租户 0 登录本身即被拒）。
- 异步命令入口：消费侧信封租户一致性（既有锁定测试 + G1 真实异步链佐证）；OpenAPI/IoT 匿名：401；验证码错误：2101 拒绝。
- 租户停用前后既有会话收敛：`TenantValidityServiceTest`（6 例）+ `UserDetailsProviderImpl` 装载期校验（返回 null→缓存驱逐→401）锁定语义；本轮在真实登录/装载路径上复验拒绝行为（DevPropertiesTest 同口径）。

### G3 生产安全 —— 已补齐 ✅

`I5ProdProfileSecurityBootTest`（真实 PG 全链迁移 + prod profile 完整启动）2/2：

- 正向：注入真实测试密钥后 prod 完整启动成功（JWT/RSA/SSO/digest fail-fast 全部通过）；
- 匿名矩阵原始输出：`/actuator/health` 200 且仅 `{"status":"UP"}`（无 diskSpace/components 详情）；metrics/env/heapdump/prometheus/swagger/api-docs/druid/me/user-list 全部 **401**；liveness/readiness 未启用（404，亦不暴露）；
- 反向：缺 JWT 密钥的 prod 启动被 fail-fast 拒绝（异常先由 RSA 私钥门禁拦截：`登录 RSA 私钥未配置…不允许默认私钥上线`，JWT 门禁同类语义已由 `jwtSecretPresenceCheck` 单测锁定）；外部真实进程验证：`spring-boot:run`（prod、无任何密钥注入）**退出码 1**（`g3-prod-boot-no-secrets.log`）。

### G4 权限 fail closed —— 已补齐 ✅

真实空权限身份 `t100nobody`（无任何角色）：登录成功→`/system/auth/me` 返回 `permissions:[]、roles:[]、superAdmin:false`；`/system/auth/menus` 返回空数组（前端菜单默认不可见的服务端权威来源）；`/form/def/page` 403 无权限；待办等业务接口返回空集；构造跨租户请求（租户 0 表单 ID/实例 ID）服务端判不存在，零副作用。

### G5 SSO 安全契约 —— 已补齐 ✅（G8 真实 Provider 部分除外）

- **登录前安全发起入口**：`/auth/sso/WECOM/authorize-login?tenant=100` 成功签发（authorizeUrl+state，state 与租户绑定落库）；缺 tenant/租户不存在(999)/停用(200)/过期(300) 均 400 fail closed；未配置 Provider（FEISHU@tenant100）400 拒绝。租户入参仅用于定位租户级配置与绑定域，最终会话由服务端按绑定行租户装载，不授予权限。
- **回调白名单分离**：`SsoCallbackPolicy`（配置级）+ `SsoAuthServiceTest` 正反断言；相对路径模式（当前 dev 形态）与显式白名单模式（生产形态）语义分离并有测试。
- **state/code**：伪造 state、未知 state 均拒绝；真实 state 首次回调触发真实 Provider 外呼（企业微信返回官方 errcode=40013 凭据拒绝，受控假凭据的确定性失败）；同一 state 第二次回调不产生二次绑定/会话效果；state 一次性/过期/错配/并发重放由 `SsoAuthServiceTest` 覆盖。
- **nonce 官方映射**：三 Provider 授权端点官方均不支持 `nonce`（非 OIDC id_token 流），映射与官方文档链接落证 `g5-nonce-official-mapping.md`；补偿控制为一次性 state + 服务端换票 + 绑定摘要。

### G6 身份绑定与会话 —— 已补齐（模型缺口已修复）✅

- 修复跨租户绑定冲突模型：V86 `(provider, app_id)` 全局唯一 + `saveConfig` 跨租户应用登记拒绝（单测 2 例），使「同一 Provider 应用/组织中的同一稳定外部主体」在模型上不可能跨租户重复绑定。
- 真实 HTTP 绑定链：绑定成功（审计 BIND，响应仅摘要前 8 位 `4cda05c6`）→ 同账号重复绑定 400 拒绝（`该本地账号已绑定其他外部身份`）→ 解绑 → 重复解绑 400 → 匿名绑定 401；绑定/解绑审计落库可查。
- 停用/撤权/租户禁用与解绑后登录拒绝：复用 I1 锁定 `kickOut`/装载收敛链 + 本轮租户校验增强（装载返回 null→会话收敛），`TenantValidityServiceTest`/`AuthFlowIntegrationTest` 锁定。
- DB 级唯一约束：V84 双唯一索引 + Flyway 全链正反例断言（bootstrap 48 例含迁移全链）。

### G7 审计与敏感信息 —— 已补齐 ✅

- **审计查询入口**：`GET /auth/sso/audit`（`system:sso:audit:query` 权限守卫 + 显式租户条件）：无权限身份 403（真实 HTTP）、匿名 401；租户 100 管理员可查本租户 BIND/UNBIND/AUTH_START 事件；租户 0 管理员查询同端点返回空（跨租户隔离零泄漏）。
- **哨兵零残留**（`g7-sentinel-scan.txt`）：Provider secret 明文哨兵在全部日志/证据零命中；五个注入密钥值（JWT/RSA/SSO/CIPHER/digest）前缀在服务端日志零命中；伪造 code/state 不进审计正文（审计仅存摘要与脱敏 reason）。
- 如实记录边界：绑定表 `external_id` 为库内明文列（设计如此，展示层仅摘要）；dev profile 的 SQL debug 日志会打印该参数原文（与库内内容一致，非新增泄漏面；prod 不启用 debug SQL 日志）。code/token/secret 类哨兵零残留。

### G8 外部 Provider 真实链 —— 保持 VERIFYING（外部条件未到位，如实冻结）

企业微信/飞书/钉钉的官方测试应用凭据、HTTPS 回调白名单域与可控测试身份仍未提供（方向 §5）。本轮已完成的最近真实验证：租户 100 的 WECOM 配置下，回调换票触发**真实企业微信官方端点外呼**并返回官方错误码 `errcode=40013`（无效 corpid）——客户端协议链、错误恢复与脱敏均为真实行为。完整成功链（真实授权→换票→绑定→已绑定登录→解绑后拒绝）待外部条件到位后按原账本补证；按方向 §7 不虚构完成、不停止其他独立工作。

### G9 工程门禁与候选封装 —— 已补齐 ✅

- Server 八模块最终门禁：**766 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS**（原始日志 `g9-server-affected-tests-final.log`）；Flyway 全链 **H2 86 / PG 85，终点 V86**（bootstrap 48 例含升级链正反例）。
- Web 四门复跑 exit 0（`g9-web-four-gates.log`；本轮 Web 零改动，计数与候选 `fc5f70b` 锁定值一致）。
- 候选 manifest：15 个变更文件 sha256 + 候选 SHA（`g9-server-changed-files-manifest.txt`）；Server 候选 `5e976b89`、Web 候选 `fc5f70b`，**均本地未推送**。

## 4. 与方向/上轮的偏差

1. `permit-urls` 增加免认证 `authorize-login`（G5 要求的登录前入口）；该入口对租户做服务端有效性校验，失败为可判定 400，不构成匿名攻击面（不返回配置细节）。
2. devseed 目录仅 dev profile 装载（可控测试身份），符合方向 §5「可控测试身份」；生产构建不含该 location。
3. 审计写入在免认证路径挂起租户拦截器并显式携带租户；无租户上下文的系统拒绝事件落默认租户 0（默认租户常量在其边界真实成立）。
4. 本轮存在一次性中间态失败（Bootstrap 测试三次迭代计数断言、dev 启动六次迭代修复环境缺陷），最终态全绿；中间失败原始日志保留于 `g9-server-bootstrap-rerun*.log` 与 `g2-dev-server-boot.log`（最终成功版覆盖，历史失败证据见迭代过程记录）。

## 5. 未完成内容与风险

- **G8 真实 Provider 成功链**（VERIFYING）：解除条件 = Owner/环境提供三 Provider 测试应用凭据、HTTPS 回调白名单域与可控测试身份（方向 §5 清单）。
- 移动 H5 的 SSO 回跳/绑定页面（`/sso/return`、`/sso/bind`）本轮无浏览器截图证据（浏览器会话未纳入本轮采集；页面为上轮候选锁定实现，Web 零改动）——如 Planner 要求，下一轮以真实浏览器证据补充。
- V85/V86 为新增前向迁移，未改写任何既有行（幂等 merge/唯一索引），符合方向 §7 兼容边界。

## 6. 与 17 项验收标准的映射

| # | 上轮 | 本轮 |
|---|---|---|
| 1/2 | 声明证据 | 真实 HTTP 双租户同键零串读 + Flyway V86 正反例断言 + 重复键真实 400（§3 G1） |
| 3 | 部分 | **真实非零租户全链**（表单→发布→绑定→提交→命令→实例→任务→轨迹→通知，对象 ID 与 tenantId 勾稽）（§3 G1） |
| 4/5 | 声明证据 | 真实跨租户请求判不存在零副作用；工作台布局双租户保存读回（§3 G1/G4） |
| 6 | 声明证据 | 停用/过期/缺失租户四类入口真实拒绝（§3 G2） |
| 7/8 | 配置级声明 | **真实 prod-profile 完整启动 + 匿名矩阵原始输出 + 无密钥退出码 1**（§3 G3） |
| 9 | 单测名 | 真实空权限身份全链（me/menus/403/构造请求拒绝）（§3 G4） |
| 10 | 声明证据 | 租户停用/过期第一方登录拒绝 + 装载收敛锁定语义（§3 G2） |
| 11 | VERIFYING | **保持 VERIFYING**（真实 errcode=40013 外呼佐证协议链；成功链待外部条件） |
| 12/13 | 部分 | 白名单分离落证 + nonce 官方映射 + V86 跨租户冲突模型 + 真实 state 重放拒绝（§3 G5/G6） |
| 14 | 部分 | Web 零改动；H5 页面浏览器证据如需下一轮补充（§5） |
| 15 | 部分 | 权限守卫审计查询 + 跨租户隔离 + 哨兵零残留扫描（§3 G7） |
| 16/17 | 声明证据 | 766/0/0/0 原始输出、H2 86/PG 85 终点 V86、Web 四门、sha256 manifest、候选 SHA（§3 G9） |

## 7. 自验结论

G1—G9 中：G1、G2、G3、G4、G5、G6、G7、G9 均以真实行为证据补齐；G8 保持 `VERIFYING`（外部条件，如实冻结）。功能整体保持 `VERIFYING`，**待规划验收**；不写 `PASSED/COMPLETED`，不核销 P60/P31，不推送候选提交，不开始 I6。

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-02.md","evidence_dir":"product/v0.1.0-oa-completion/receipts/evidence/i5-02/","feature_status":"VERIFYING","work_items":[{"id":"G1-nonzero-tenant-oa-chain","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G2-entry-fail-closed","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G3-prod-security","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G4-permission-fail-closed","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G5-sso-security-contract","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G6-identity-binding","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G7-audit-zero-residue","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8-real-provider-e2e","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待 Owner/环境提供三 Provider 测试应用凭据、HTTPS 回调白名单域与可控测试身份后补证；保持 VERIFYING"},{"id":"G9-gates-and-manifest","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"i5-planner-acceptance","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"Planner 对 17 项验收标准按本轮证据逐项复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"提交本回执并等待 Planner 验收；G8 真实 Provider 成功链保持 VERIFYING 待外部条件","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i5-exec-02-5e976b89-fc5f70b-766t-v86","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server 15 files vs aaafd747 (+453/-68)"],"tool_actions":["mvn test 8 affected modules (766/0/0/0 BUILD SUCCESS)","Flyway full chain H2 86 / PG 85 terminal V86","pnpm typecheck+lint+test+build exit 0","real dev-profile H2 full boot + HTTP chains (G1/G2/G4/G5/G6/G7)","real prod-profile boot on zonky PostgreSQL + anonymous matrix + fail-fast (G3)","sentinel zero-residue scan (G7)","sha256 manifest of 15 changed files"],"new_evidence":["non-zero tenant full OA chain with per-layer tenantId reconciliation","disabled/expired tenant login rejection over real HTTP","prod anonymous exposure matrix raw output","SSO authorize-login positive/negative, state forgery/replay rejection","bind/unbind chain with conflict denial and audit tenant isolation","official nonce support mapping with vendor doc links"],"closed_work_items":["G1","G2","G3","G4","G5","G6","G7","G9"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"766 tests / 0 failures / 0 errors / 0 skipped across 8 affected modules; Flyway H2 86 / PG 85 terminal V86"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"web typecheck/lint/test/build all exit 0 (no changes this round)"},{"tool":"http","outcome":"SUCCEEDED","detail":"real dev server chains and prod-profile boot matrix; raw responses in evidence/i5-02/"},{"tool":"git","outcome":"SUCCEEDED","detail":"server local commit 5e976b89 (not pushed); web unchanged fc5f70b"}],"browser_status":"NOT_APPLICABLE"}
```
