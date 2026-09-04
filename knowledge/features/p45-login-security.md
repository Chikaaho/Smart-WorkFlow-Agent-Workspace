# p45-login-security（P45 / M02-F06-01 登录安全与登录态恢复）

> 正式功能；阶段三终态最终复核完成（2026-09-01）。
> 状态：功能级 **PASSED**（2026-09-01，规划最终验收 `planning-review-p45-implementation-08.md`）→ 阶段三终态最终复核 **COMPLETED（已确认）**（`planning-terminal-final-review-p45-20260901.md`）。

## 功能目标

在既有 access/refresh 双 Token、refresh HttpOnly Cookie、轮换与重放撤销底座上，补齐登录安全与登录态恢复：RSA-OAEP 密码加密、验证码、客户端机器时间校验、Redis 一次性挑战与并发防重放、RSA 密钥版本轮换、默认租户 `tenant=0` 身份/权限隔离，以及 Cookie Path 修正后的 F5/深链/退出登录态恢复；access 仍只存前端内存，refresh 由 HttpOnly Cookie 承载，双 Token 职责不退化。

## 交付范围（已锁定，证据见下）

- 后端：`AuthErrorCode`（2101 验证码错误 / 2102 验证码已过期 / 2103 机器时间异常 / 2104 密码错误）；`LoginSecurityProperties`（TTL 300s、失败上限 5、时间窗 180s、密钥版本、无默认私钥）；`RsaLoginKeyManager`（构造 fail-fast、SPKI 派生、OAEP(SHA-256, MGF1-SHA256)、按挑战版本解密、明文上限 190 字节不截断）；`LoginChallengeStore`/`RedisLoginChallengeStore`（跨实例 Redis 权威、TTL、DEL 原子消费、INCR 失败计数、只落摘要）；`LoginChallengeService`（签发/内容/有效期/时间窗/原子消费）；`AuthController`（`GET /auth/challenge`、登录固定顺序 2101→2102→2103→原子消费→RSA+密码 2104、请求体五字段）；`CookieUtils` Path 参数化 + 生产 `Secure=true`/`Path=/sw-server/api/auth/` 覆盖；既有缺陷修复（Flyway 全链断言 44/43→46/45、V46 终点——分支历史 255a9ce/dcb90ca 新增 V45/V46 未同步测试计数）。
- 前端：`foundation/auth/rsa.ts`（WebCrypto RSA-OAEP/SHA-256、SPKI 导入、UTF-8 不截断）+ spec；`foundation/auth/index.ts`（`fetchChallenge()`、login 五字段契约、`useAuth` 暴露 fetchChallenge）；`LoginPage.vue`（验证码展示/点击刷新/失败换新挑战）；`router/guard.ts`（冷启动 refresh 失败清理：clearDynamicRoutes+clearToken 不留半登录态）；`error-code-map.ts`（2101-2104 映射）；`mock/handlers.ts`（`GET /api/auth/challenge` + 登录 mock 同语义）；相关 spec 更新。
- 默认租户边界：登录未选租户时账号查询使用默认租户 `tenant=0`；超管归属默认租户 `tenantId=0`；本轮只验证默认租户内超管与低权限用户，租户选择器、跨租户账号查询及非零租户登录协议不纳入。

## 验收与证据链

- 功能级最终验收：`product/p45-login-security/receipts/planning-review-p45-implementation-08.md`（**PASSED**，10 项验收边界全部通过：RSA-OAEP、固定校验顺序、一次性原子消费、RSA v1/v2 轮换、默认租户隔离、Cookie Path、双 Token 职责、项目级回归、证据树零敏感残留、状态纪律）。
- 执行完成回执：`product/p45-login-security/receipts/completion-p45-login-security-20260901.md`。
- 增量执行回执：`product/p45-login-security/receipts/p45-execution-supplement-20260901-{02,03,04,05,06,07}.md`（行为链、原子并发、轮换、默认租户隔离、扫描收口）。
- 探索回执（Executor 只读端）：`search_fallback/p45-login-security-current-seams.md`、`search_fallback/p45-login-state-direct-cause-supplement.md`。

## 阶段三终态（2026-09-01 落值 + 规划终态最终复核 COMPLETED（已确认））

- 已完成功能数 36→**37**；清单 **✅33 / 🟦24 / ⬜33**（全 90 行，M02-F06-01 🟦→✅ 完成）。
- P45 **已核销/完成**（仅核销 P45）。
- 候选正式基线：后端 **979/0/0/0（agent 346）**；前端 **110 spec files / 1062 tests / 0 skipped**（typecheck/lint/build 通过）。
- Flyway 正式基线保持 **H2 V44（全链 44）/ PostgreSQL V44（全链 43）**；**V45/V46 是当前分支既有事实，披露但不晋级为 P45 正式基线**（未见习于 P45 registry）。
- 活动功能：无；当前唯一下一动作为**规划比较并选择下一唯一正式功能**。

## 已知限制

- 本轮未新增或关闭 registered 已知问题（`knowledge/known-issues.md` 无变化）；非零租户登录扩展按需求池规则另行登记，不作为 P45 缺陷。
- 生产网关/部署未真实观测；生产 Cookie 生效需部署时确认 `sw.security.cookie.path` 与实际公开前缀一致（已在执行回执如实标注等价环境证据边界）。

## 证据路径

| 类型 | 路径 |
|------|------|
| 功能级验收 | `product/p45-login-security/receipts/planning-review-p45-implementation-08.md` |
| 执行完成回执 | `product/p45-login-security/receipts/completion-p45-login-security-20260901.md` |
| 增量执行回执 | `product/p45-login-security/receipts/p45-execution-supplement-20260901-*.md` |
| 行为证据附件 | `product/p45-login-security/receipts/evidence-p45-{h1-h7,k1-k6,l1-l5,n1-n5,o1,supplement-01,supplement-02}/` |
| 主方向 | `product/p45-login-security/passed/direction-p45-login-security.md`、`direction-p45-login-security-evidence-supplement-01.md`、`direction-p45-login-security-evidence-supplement-02.md` |
| 终态同步方向 | `product/p45-login-security/ready/direction-p45-login-security-stage3.md` |
| 探索回执 | `search_fallback/p45-login-security-current-seams.md`、`search_fallback/p45-login-state-direct-cause-supplement.md` |