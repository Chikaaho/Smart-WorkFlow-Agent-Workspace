# P60 I5 租户安全收口与第三方 SSO —— 阶段实现回执 05

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 当前执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-03.md`（三级零裁量提示）
> 回执状态：**自验提交，待规划验收**（`VERIFYING / EXECUTION_SUBMITTED`）
> Server HEAD：`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`；最终工作树 `db8b25556bd9a9958d06ab727372a1fe1853b26e`（未提交、未推送）
> Web HEAD：`5788ead33c4347214a350d124331237e85068bdf`（本轮零修改）

## 0. 本轮结论

按三级提示固定顺序完成除 G8 外全部 21 个原子证据包，每包独立文件、正反断言与对象身份全部为是（G8 如实 PENDING）。采集过程中发现并修复**两个真实行为缺陷**（§3），修复后重取受影响包。最终门禁六模块 658 tests / 0 failures / 0 errors / 0 skipped + Web 四门 exit 0。无推送、无核销、无 PASSED/COMPLETED。

## 1. 实际修改文件（15：12 改 + 3 新）

| 文件 | 摘要 |
|---|---|
| sw-biz-system-biz `sso/SsoAuthService.java` | **缺陷修复①**：新增 `auditDenial`——拒绝/重放/冲突审计以 REQUIRES_NEW 独立事务提交（原随 @Transactional 回滚丢失，验收 #15 不可满足）；有 stateRow 的回调拒绝显式携带 state 所属租户；控制器侧 `auditRejection` 公共入口 |
| sw-biz-system-biz `controller/SsoAuthController.java` | **缺陷修复②**：`/auth/sso/ticket` 兑换在匿名上下文调用 `getById` 触发租户拦截器 fail-closed → 已绑定登录整链 500；按免认证路径既有模式挂起拦截器，租户语义由票据载荷与账号行一致性显式承担；bind-candidate 跨租户 403 增补独立审计 |
| sw-biz-openapi-biz `service/OpenApiAuthService.java`、`OpenApiServiceTest.java`、4×sw-basic-iot、application-dev.yml、V901、I5ProdProfileSecurityBootTest | iteration-01—04 既有 I5 修复（本轮未再改动，仅重验） |
| `devseed/h2/V903__i5_g5_three_provider_fixtures.sql`（新） | tenant 100 的 FEISHU/DINGTALK 启用配置（密文 AES-GCM；启动 @PostConstruct 校验通过） |
| `i5/I5PgTenantBehaviorBootTest.java`（新） | G1a2/G6a1/G2a1 三合一真实 PostgreSQL 行为测试（zonky 17.5 + 全链迁移 + RANDOM_PORT HTTP） |
| `i5/I5SsoBindingSessionBootTest.java`（新） | G6b1 绑定-票据-会话生命周期（真实 SsoTicketStore 受控票据 + 真实 HTTP/H2/Redis） |

## 2. 证据包（evidence/i5-05/，21 包全双通过 + G8 PENDING）

| 原子 | 层级 | 关键结果 |
|---|---|---|
| G1a1 | H2+HTTP+SQL 回读 | 双租户同键四对象各自读回 marker；跨租户拒绝（1000/1300/400/null）；行数不变；同租户重复 1001 |
| G1a2 | 真实 PostgreSQL | 同键物理表 `sw_form_fxo8819r17` ≠ `sw_form_jb114xrh4v`（information_schema 验证 + 系统列）；同租户重复拒绝、行数=1 |
| G1b1 | H2+HTTP+ACT_* | 实例 APPROVED；轨迹 5 activity + HI_ACTINST/HI_TASKINST 同 task/node/actor(9001)；租户集合={100}；通知 tenantId 勾稽 |
| G1c1 | H2+HTTP+SQL | 定义/流程定义/实例/任务/布局跨租户读改发起办理全拒（1000/2010/404/403），副作用 7→7/6→6/8→8，两任务保持原租户 PENDING，无 500 |
| G2a1 | PG+HTTP | 合法签名达业务边界（1000 表单不存在=业务错）；PG nonce 行落库(t100)；缺头/坏签/过期租户(3009)/过期时间戳(3003) 零 nonce 增量；重放 3004 |
| G2a2 | H2+HTTP | 设备登记(t100)→命令 QUEUED→结果回调 SUCCESS，增量 0→1；匿名 401、跨租户 404/空、停用/过期租户不可入会话；增量 0 |
| G2a3 | H2+HTTP+队列 | 有效信封 ACCEPTED→COMPLETED（initiator 9001/tenant 100）+实例创建；匿名 401、停用/过期租户登录拒、跨租户键 404；负向零增量 |
| G2b1 | H2+HTTP+Redis | t1000 时间序列：有效登录/me 200 → 权威 expire_at 到点 → 新登录/refresh 401 → 缓存剔除后权威装载 401 + Redis 行清理；t100 对照 200 |
| G3b1 | 真实 PG+独立进程 | 正确凭据 prod 启动成功（14.4s，health 200，迁移 v87）；仅改错误用户名/密码各自进程 exit=1，首因=PG 认证失败（scram 反枚举语义）；secret scan=0 |
| G3b2 | 真实 PG+独立进程 | 三 Provider enabled=0 禁用行启动成功（health 200）；WECOM/FEISHU(placeholder)/DINGTALK enabled=1 各自进程 fail-fast exit=1，首因「启用 Provider 必须配置有效 appId 与 secret」 |
| G4a1 | H2+HTTP | （同候选已闭合，本轮复核保留）me 空 roles/permissions、dataScope 非 ALL；管理请求 403 |
| G4b1 | 浏览器 | PC/移动同会话工作台可用；menubar 空；/system/user 深链+刷新→/404；同源管理 API 401（带凭据 403 由 G4a1 锁定）；配置=纯个人布局对话框；两张截图落盘 |
| G5a1 | HTTP+进程 | 三 Provider redirect_uri 恰为白名单内绝对 URL；独立 8081 进程（白名单外基址）三 Provider 全 fail-closed 400，外呼 delta=0 |
| G5b1 | HTTP+代理计数+SQL | 三 Provider 首次 state/code 各恰好 +1 外呼进受控换票边界（40013/10003/HTTP400 受控失败）+state consumed=1；重放/篡改/Provider 错配（未消费态不消费）/自然过期 300s/发起期租户错配全部本地拒绝零外呼；绑定 0→0 |
| G5c1 | 浏览器 | 三 Provider 登录前入口 PC/移动可见（截图×2）；真实跳转 accounts.feishu.cn（app_id/redirect_uri/state 正确）；/sso/bind 无票据安全态+伪造候选 401；回跳 URL/storage 零残留 |
| G6a1 | 真实 PG barrier | 两租户同主体并发恰好一方成功；失败侧 IllegalStateException 业务冲突；绑定全局 1 行、role 零增量、DENIED 审计独立落库 |
| G6b1 | HTTP+H2+Redis | 受控票据兑换真实会话 200（me 200）；票据一次性 401；停用租户兑换 401+权威装载收敛 401；解绑后 bindings=[]；role 零增量 |
| G7a1 | H2+HTTP+SQL | result=DENIED 命中 8 条真实事件；摘要前缀筛选命中；provider/eventType/user 筛选 9/1/3；无权 403、匿名 401、跨租户不可见 |
| G7b1 | 全文扫描 | 本轮表面+两仓源码 10/10 hashLabel 命中 0；排除项=历史锁定证据；报告/回执/账本无自命中 |
| G9a1 | git+sha256sum | 最终树 db8b2555；41 项 manifest verify exit=0；逐包 SHA 绑定+不失效证明 |
| G9b1 | Maven+pnpm | 六模块 658 tests 0F/0E/0S exit=0（含 Flyway H2 15+PG 12）；Web 四门 exit=0（128 文件/1183 tests + 3 skipped）；附件全存在 |
| G8 | — | **PENDING**（dependency_satisfied=false）：三 Provider 官方测试应用/HTTPS 回调域/测试身份未提供 |

## 3. 采集中发现并修复的真实缺陷

1. **拒绝审计随事务回滚丢失**（验收 #15）：G7a1 首采 result=DENIED 命中 0；日志证明 INSERT 已发出但被 `handleCallback`/`bind` 的 @Transactional 回滚。修复为 REQUIRES_NEW 独立提交 + 显式租户；SsoAuthServiceTest 22/22 回归通过后重取 G5b1/G7a1。
2. **票据兑换整链 500**（验收 #14 链路）：G6b1 首采 `/auth/sso/ticket` 匿名上下文 `getById` 触发租户拦截器 fail-closed 异常。按免认证路径模式挂起拦截器修复；BootTest 全链通过。
3. 工具层发现（不修复、已登记）：外部数据源回读通道 SELECT CLOB 列（sys_user_workspace.layout）序列化 500——iteration-03 已有同款记录，非跨租户拒绝路径，属 I4 范围既有限制。

## 4. 实际命令与原始结果

- 采集驱动：Node 脚本（真实 fetch/签名/Redis RESP）+ `java -jar` 进程矩阵 + zonky PG——原始输出全部落盘 `evidence/i5-05/*-capture.log`、`g3b*.log`、`g9b-server-gates.log`、`g9b-web-gates.log`
- 门禁：`MAVEN_OPTS="-Xmx2g" mvn -pl <六模块> test` → 658/0/0/0，exit 0；`NODE_OPTIONS=2048 pnpm typecheck && lint && test && build` → exit 0
- manifest：`sha256sum` 41 项 → `g9a1-manifest.sha256`；`sha256sum -c` → exit 0（stdout/stderr/exit 分离落盘）

## 5. 与方向的偏差

- G6b1 正向票据经真实 `SsoTicketStore` bean 受控签发（真实 Provider 回调成功链属 G8）；其余会话/租户/解绑行为全部真实 HTTP+DB。
- G2a1 的 PG 层经 zonky 内嵌真实 PostgreSQL（项目既有 I4 先例层级）；G3b1/G3b2 为独立 OS 进程 + initdb 真实 PG 服务器（zonky 二进制）。
- sys_sso_provider_config.app_secret_enc 为 NOT NULL：进程矩阵「缺失」以空字符串表达（validateEnabledConfig 对 blank 同样拒绝）。

## 6. 未完成与风险

- G8 外部依赖（官方应用/回调域/测试身份）→ 保持 VERIFYING，不阻断其余 21 包验收。
- 消费侧身份回查（CommandDispatcher→UserDetailsProvider）以 G2b1 权威收敛链与代码路径佐证，未单独构造跨事务时序用例。

## 7. Git diff 摘要

`HEAD 4d98b671 → 工作树 db8b2555`：15 文件，+335/−53（见 §1）。未提交、未推送；未动历史回执/evidence；product 仅新增本回执与 evidence/i5-05/。

## 8. 验收标准对照

#1—#7、#9—#17 逐项行为证据见 §2 对照表（#8 生产匿名暴露矩阵为已锁定项，本轮未触碰对应路径不复验）。#11 的真实成功链 = G8 PENDING。

## 9. 自验结论

除 G8 外全部原子包正反断言为是、对象身份一致、层级真实、门禁全绿、零残留。提交 `VERIFYING / EXECUTION_SUBMITTED`，等待规划验收 05。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-05.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i5-05/object-ledger.md","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g1a1-form-objects.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g1a2-form-pg.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g1b1-trace.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g1c1-cross-tenant.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g2a1-openapi-http-pg.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g2a2-iot.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g2a3-async.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g2b1-session.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g3b1-db-auth.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g3b2-provider-boot.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g4a1-permission.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g4b1-browser.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g5a1-allowlist.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g5b1-state-code.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g5c1-browser.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g6a1-pg-concurrency.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g6b1-binding-session.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g7a1-audit.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g7b1-residue.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g8-real-provider.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g9a1-candidate.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-05/g9b1-gates.raw"],"feature_status":"VERIFYING","work_items":[{"id":"G1a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G1a2","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G1b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G1c1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G2a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G2a2","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G2a3","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G2b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G3b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G3b2","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G4a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G4b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G5a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G5b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G5c1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G6a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G6b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G7a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G7b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待 Owner/环境提供三 Provider 官方测试应用、HTTPS 回调白名单域与可控测试身份后补真实成功链"},{"id":"G9a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G9b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"提交规划验收 05：Planner 按三级提示复核 iteration-05 回执与 evidence/i5-05 全部原子包","next_action_type":"WAIT_PLANNER","progress_fingerprint":"db8b25556bd9a9958d06ab727372a1fe1853b26e","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server: SsoAuthService.java","Smart-WorkFlow-aPaaS-server: SsoAuthController.java","Smart-WorkFlow-aPaaS-server: V903__i5_g5_three_provider_fixtures.sql","Smart-WorkFlow-aPaaS-server: I5PgTenantBehaviorBootTest.java","Smart-WorkFlow-aPaaS-server: I5SsoBindingSessionBootTest.java"],"tool_actions":["真实 HTTP 采集（dev server / 独立进程 / RANDOM_PORT BootTest）","真实 PostgreSQL 进程矩阵（zonky 二进制 initdb scram + fat jar prod boot ×8）","真实浏览器 Chromium IAB 证据（PC/移动截图×4）","mvn 六模块门禁 + pnpm Web 四门","sha256sum manifest verify"],"new_evidence":["evidence/i5-05/ 22 原子包 + 9 原始采集日志 + 4 截图 + manifest/verify"],"closed_work_items":["G1a1","G1a2","G1b1","G1c1","G2a1","G2a2","G2a3","G2b1","G3b1","G3b2","G4a1","G4b1","G5a1","G5b1","G5c1","G6a1","G6b1","G7a1","G7b1","G9a1","G9b1"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"bash(mvn)","outcome":"SUCCEEDED","detail":"六模块 658 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS，exit=0（g9b-server-gates.log）"},{"tool":"bash(pnpm)","outcome":"SUCCEEDED","detail":"typecheck/lint/test/build 四门 exit=0；128 文件 1183 passed + 3 skipped（g9b-web-gates.log）"},{"tool":"node(http-drivers)","outcome":"SUCCEEDED","detail":"G1/G2/G5/G6/G7 真实 HTTP+SQL 回读采集，原始日志落盘"},{"tool":"bash(g3-process-matrix)","outcome":"SUCCEEDED","detail":"真实 PG 17.5 + fat jar 独立进程：正确凭据启动成功，错误账号/密码与三 Provider 缺失/占位各自 exit=1"},{"tool":"browser(chromium-iab)","outcome":"SUCCEEDED","detail":"G4b1/G5c1 DOM+网络+截图证据，g4b1-pc/mobile.png 与 g5c1-pc/mobile.png 落盘"},{"tool":"external-providers","outcome":"UNAVAILABLE","detail":"G8 三 Provider 官方测试应用/HTTPS 回调域/可控测试身份未提供，真实成功链保持 PENDING"}],"browser_status":"OPERABLE"}
