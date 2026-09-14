# P60 I5 租户安全收口与第三方 SSO —— 阶段实现回执 07

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 当前执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-05.md`
> 验收依据：`planning-review-stage-i5-v0.0.3-oa-iteration-06.md`（原三项通过；G6c1 新增待补）
> 回执状态：**自验提交，待规划验收**（`VERIFYING / EXECUTION_SUBMITTED`）
> Server HEAD：`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`；iteration-07 最终工作树 `6ec847a6f6505d0fa271cf45f3d77a26816d0a4f`（未提交、未推送）
> Web HEAD：`5788ead33c4347214a350d124331237e85068bdf`（零修改）

## 0. 本轮结论

提示 05 唯一可执行缺口 G6c1 闭合：解绑后旧 token A 在 B 建立前、B 建立后、B 缓存重载后三个检查点始终拒绝；新第一方会话 B 建立与缓存重载均有效且不被 A 的撤销标记误伤；role 表零增量。G8 保持 PENDING。已锁定项未重验；实现改动仅触及提示允许的 session/token/cache/refresh/解绑路径，并以相称回归锁定。

## 1. G6c1 闭合（[evidence/i5-07/g6c1-generation-isolation.raw](evidence/i5-07/g6c1-generation-isolation.raw)）

固定对象：user 9503（同 user A/B 两代）、tenant 100、绑定 90013（ACTIVE→UNBOUND）、digestA/digestB 仅记录 SHA-256 前缀。时间顺序无替换：

1. 建立 A（第一方登录，真实 /auth/login：challenge + RSA-OAEP-SHA256 + dev 固定验证码）→ me 200、sessionRow=true、无标记。
2. 解绑（真实 HTTP，Bearer A）→ 200；A me 401、A refresh 401「全部会话已失效」；缓存清理、digestA 撤销标记写入。
3. 第一方登录建立 B（跨秒 1.1s）→ me 200（**未被 A 标记误伤**）、refresh 200。
4. A 再拒绝——此时 B 的 userId 缓存存在，A 借道仍 401（**不复活**）。
5. 清 B 缓存 → B 权威装载 me 200、B refresh（轮换 cookie）200。
6. A 终局 me 401；marker(digestA)=true、marker(digestB)=false；role 零增量。

## 2. 实现改动（提示 05 允许路径）

验收 06 指出的缺陷成立：userId 级标记 + 仅缓存未命中检查，存在 A 借 B 缓存复活与 B 被误伤两个可判定风险。修复为 **token 摘要维度撤销**：

| 文件 | 摘要 |
|---|---|
| `sw-security/cache/LoginUserCacheService.java` | userId 级 `markSsoRevoked/isSsoRevoked` → `markTokenRevoked/isTokenRevoked`（键 `sw:security:token-revoked:{sha256(token)}`，TTL=access 过期秒） |
| `sw-framework` `filter/JwtAuthenticationFilter.java` | JWT 校验后、装载前检查 `isTokenRevoked(token)`——撤销检查随 token 而非随 userId 缓存 |
| `sw-security/cache/LoginUserLoader.java` | 回退 userId 级未命中检查 |
| `system-biz/sso/SsoAuthService.java` | `unbind(provider, userId, currentToken)` 重载：UNBOUND+审计后 evict + 按当前 token 摘要标记 + 撤全部既有 refresh token |
| `system-biz/controller/SsoAuthController.java` | unbind 经 `@RequestHeader Authorization` 取当前 access token 传入 |
| `system-biz/config/SystemAutoConfiguration.java`、`service/RefreshTokenService.java` | 装配 + 公开撤销入口 |
| `AuthFlowIntegrationTest.java` | 过滤器 Bean 装配适配 |
| `I5SsoBindingSessionBootTest.java` | boot 显式激活 dev profile + test-mock（第一方登录固定验证码）；新增 G6c1 序列；G6b1b 标记断言适配新键 |

## 3. 相称回归与候选

- `SsoAuthServiceTest` 22/22；system-biz 模块 295/0/0/0 BUILD SUCCESS；`I5SsoBindingSessionBootTest` 3/3（原始控制台流 `g6c1-boot.log`）。
- fat jar 08:11:33 重建（含 token 维度撤销）；G6c1 序列采于其后。
- 指纹：`db8b2555`（iteration-05）→ `456b60f5`（iteration-06）→ **`6ec847a6`**（本轮）；manifest verify exit=0。

## 4. 已知边界（登记，不修复）

JWT 无 jti、iat 秒级：同一秒内两次登录产出逐字节相同 token（本轮实测触发）。同秒边界下 B 与被撤销的 A 同 token 而被一并拒绝至标记 TTL 过期。本轮以跨秒登录规避并登记；引入 jti 属 token 契约变更，超出提示 05 修改范围，建议后续独立处理。

## 5. G8

三 Provider 官方测试应用、HTTPS 回调白名单域、可控测试身份仍未提供，保持 PENDING / dependency_satisfied=false，未以受控失败链冒充。

## 6. 提交门禁自检

A/B 同 user 且 token digest 不同、顺序无替换 ✓；B 登录后与缓存重载后均能访问与 refresh ✓；A access/refresh 三个检查点均拒绝 ✓；每步 Redis cache/marker/revocation 真实回读且无 token 明文 ✓；实现修复已过相称回归并绑定最终候选 ✓；G8 如实 PENDING ✓。提交 `VERIFYING / EXECUTION_SUBMITTED`，等待规划验收 07。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-07.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i5-07/object-ledger.md","product/v0.1.0-oa-completion/receipts/evidence/i5-07/g6c1-generation-isolation.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-07/g6c1-boot.log","product/v0.1.0-oa-completion/receipts/evidence/i5-07/g9-fingerprint.raw"],"feature_status":"VERIFYING","work_items":[{"id":"G6c1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待 Owner/环境提供三 Provider 官方测试应用、HTTPS 回调白名单域与可控测试身份后补真实成功链"},{"id":"G9","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"提交规划验收 07：Planner 复核 G6c1 A/B 代际隔离序列与 token 维度撤销实现","next_action_type":"WAIT_PLANNER","progress_fingerprint":"6ec847a6f6505d0fa271cf45f3d77a26816d0a4f","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server: LoginUserCacheService.java","Smart-WorkFlow-aPaaS-server: LoginUserLoader.java","Smart-WorkFlow-aPaaS-server: JwtAuthenticationFilter.java","Smart-WorkFlow-aPaaS-server: WebSecurityAutoConfiguration.java","Smart-WorkFlow-aPaaS-server: SsoAuthService.java","Smart-WorkFlow-aPaaS-server: SsoAuthController.java","Smart-WorkFlow-aPaaS-server: RefreshTokenService.java","Smart-WorkFlow-aPaaS-server: SystemAutoConfiguration.java","Smart-WorkFlow-aPaaS-server: AuthFlowIntegrationTest.java","Smart-WorkFlow-aPaaS-server: I5SsoBindingSessionBootTest.java"],"tool_actions":["G6c1 A/B 代际隔离序列（真实 HTTP 第一方登录/解绑/refresh/权威装载 + 真实 Redis 逐步回读）","相称回归：SsoAuthServiceTest 22/22 + system-biz 295/0/0/0 + BootTest 3/3","git write-tree 指纹 + sha256sum manifest verify"],"new_evidence":["evidence/i5-07/ G6c1 证据包 + 原始控制台流 + 账本 + manifest/verify"],"closed_work_items":["G6c1","G9"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"bash(mvn)","outcome":"SUCCEEDED","detail":"SsoAuthServiceTest 22/22；system-biz 295/0/0/0 BUILD SUCCESS；I5SsoBindingSessionBootTest 3/3"},{"tool":"node/java(BootTest http+redis)","outcome":"SUCCEEDED","detail":"G6c1 九步时间序列：A 建立→解绑→A 三检查点拒绝→B 建立/refresh/重载全成功→role 零增量"},{"tool":"external-providers","outcome":"UNAVAILABLE","detail":"G8 官方测试应用/HTTPS 回调域/可控测试身份未提供，保持 PENDING"}],"browser_status":"NOT_APPLICABLE"}
