# P45 登录安全现状与接缝探索（执行层回执）

> 会话角色：执行。任务来源：`search_task/p45-login-security-current-seams.md`。
> 只探索、只读，无任何文件修改。结论全部回到当前文件事实（基于 2026-09-01 工作区代码）。

## 0. 结论摘要

当前登录链路**已经具备 refresh token 落 httpOnly cookie、轮换+重放撤销、Redis 登录上下文缓存的完整底座**。P45 核心缺口的实锤有三个：
1. **access token 只存在浏览器内存**（`token.ts` 模块变量），页面 F5 即丢——后端 `JwtAuthenticationFilter` 只解析 `Authorization` 头（无 cookie→access 恢复路径），前端恢复完全押注 `refresh()` 冷启动续登。这是 Owner 点名的唯一直接断点。
2. **后端零 RSA、零验证码、零登录限流锁定实现**——仅 `CaptchaValidator`/`LoginLockoutStrategy` 两个 SPI 空壳（无实现、无调用点）。
3. **前端零 cookie 读写**（`document.cookie` 全仓零命中），且 `token.ts` 有「禁止落 localStorage/sessionStorage」的不变式断言。

## 1. 能力 / 现状 / 可复用接缝 / 缺口 / 证据矩阵

| 能力 | 现状 | 可复用接缝 | 缺口 | 证据 |
|---|---|---|---|---|
| 登录入口 | `POST /auth/login`，JSON `{username,password}`，`@NotBlank` | `AuthController.login()` 入参校验 | 无验证码/公钥/时间戳字段 | AuthController.java:76-110,225-232 |
| 密码校验 | BCrypt(strength=10) `matches` | `PasswordEncoder` bean（SystemAutoConfiguration） | **零 RSA/公钥/前端加密切缝**；`AesGcmCipher` 为 AES-GCM 对称（外部凭据用），非 RSA | SystemAutoConfiguration.java:50-53; AesGcmCipher.java:11-31 |
| **校验顺序** | **先密码后状态**（I50 仍存在）：L88 BCrypt → L93-97 状态 | — | P45 固定顺序需重排此链路 | AuthController.java:88-97 |
| access token | JWT（jjwt HS256 对称 secret），TTL 900s，无 jti | `JwtTokenProviderImpl.generateToken` | secret 默认值明文兜底、无轮换 | JwtTokenProviderImpl.java:27-39,66-68; application.yml:182-188 |
| refresh token | 不透明随机 SHA-256 存库，**httpOnly cookie `rt`**，7 天，轮换+重放全量撤销 | `RefreshTokenService`（生成/轮换/撤销全套） | DB 存活旧行不清理（无回收） | RefreshTokenService.java:51-121; CookieUtils.java:13-76; V18__init_refresh_token_table.sql |
| token 落点 | access 响应体（前端内存）；refresh httpOnly cookie | `TokenResponse{accessToken,expiresIn}` | **access 不落 cookie=刷新丢登录态断点** | TokenResponse.java:16-23; AuthController.java:105-109 |
| 过滤器链 | `JwtAuthenticationFilter`(OncePerRequest) → validate → parse → `LoginUserLoader` 装载 Redis → 注入双 Context | `resolveToken()` 为 header 接缝 | **无 cookie→token 恢复**；无踢下线广播 | JwtAuthenticationFilter.java:74-124 |
| Redis 接缝 | `RedisTemplate<String,Object>`(JSON)、`RedisUtils` set/get/delete/hasKey、`LoginUserCacheService` key 前缀 | `redisTemplate` bean 现成；`LoginUserLoader` 缓存先例 | **无原子 INCR/过期计数**（验证码/限流若走 Redis 需新增原子操作） | RedisConfig.java:21-42; RedisUtils.java:9-34; LoginUserCacheService.java:29-44 |
| 验证码 | 仅 `CaptchaValidator` SPI 空壳（无实现无调用） | SPI 为扩展点；hutool 5.8.36 在 BOM | **零实现**：无生成/存储/校验/过期/刷新/一次性 | CaptchaValidator.java:1-10; sw-dependencies/pom.xml:59 |
| 失败锁定 | 仅 `LoginLockoutStrategy` SPI 空壳；`status=2` 仅静态锁定 | SPI；refresh 已有状态撤销先例 | **零现网逻辑**：无失败计数、无 IP/账号维度、无窗口 | LoginLockoutStrategy.java:1-14; AuthController.java:217-222 |
| 审计日志 | 仅业务 `log.info("用户登录"/"登录成功")` + refresh 重放 `log.error` | 自定义 slf4j Logger | **零审计落库**：无 `sys_login_log`/`oper_log` 上下文 | AuthController.java:79,108,136; grep 零命中 |
| 统一异常 | 业务错误 200+body.code；filter 401/503 直写；500 兜底 | `BaseException`+`R.fail` 模式 | 无验证码/锁定专用错误码（CommonErrorCode 仅 5 项） | GlobalExceptionHandler.java:21-52 |
| Cookie 属性 | `rt`：HttpOnly、Secure=配置、Path=/api/auth/、SameSite 随 secure 切换、Max-Age=604800 | `CookieUtils` 可复用 | 无 access cookie 先例 | CookieUtils.java:13-76 |

**前端侧**：

| 能力 | 现状 | 可复用接缝 | 缺口 | 证据 |
|---|---|---|---|---|
| 登录表单 | 仅 username/password；`errorMessage` 单一展示位 | `onSubmit`→`login()` 单点入口 | 无验证码/公钥/时间戳字段与交互 | views/LoginPage.vue:10-30,33-49 |
| 登录/刷新/登出 API | 真实封装 `/auth/login`、`/auth/refresh`、`/auth/logout`；DTO 仅 accessToken | `useAuth()` 门面、单飞锁 refreshPromise | refreshToken 字段不存在 DTO；刷新靠后端 cookie | foundation/auth/index.ts:6-63 |
| Token 存储 | 纯内存，**禁止落 localStorage/sessionStorage**（spec 断言） | `setTokenResponse`/`clearToken`/`isTokenNearExpiry`(60s 缓冲) | **零 cookie 读写**（document.cookie 全仓零命中） | foundation/auth/token.ts:1-58; token.spec.ts:85-103 |
| Authorization 注入 | 请求拦截器统一 `Bearer` | request/index.ts:51-74 | 可扩展双 Token 头 | foundation/request/index.ts:51-74 |
| 401 处理 | 响应拦截器 401→`unauthorizedHandler`（注入），auth 端点豁免 | `setUnauthorizedHandler` DI、`AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING` | 登录失败依赖后端 message 透传 | foundation/request/index.ts:14-28,76-90 |
| 刷新协调 | `setRefreshHandler(refresh)`+ 请求拦截器到期前刷新+单飞锁 | 已有 createRefresh 式接缝 | mock 无 cookie 语义（mock 下断点不可复现） | foundation/request/index.ts:34-36,58-65; mock/handlers.ts:357-366 |
| 守卫恢复 | `authGuard`：无 token 冷启动 `refresh()`（guard.ts:134-144）→ 动态建路由 →`hasRouteAccess` | 冷启动续登接缝 + 401 清路由重定向 | 恢复只有 refresh 单点；失败无「清 session+撤动态路由」兜底 | router/guard.ts:123-182; router/index.ts:139-143,169 |
| 认证 store | pinia `useUserStore`(user/permissions/roles/superAdmin) | setSession/clearSession | 无 cookie 状态承载 | stores/user.ts |
| Mock | login/refresh/logout/me/menus 全 handler；login 不校验密码按 username 切会话 | mockRegistrations 样板 | mock 无验证码/RSA/密码错误语义 | foundation/mock/handlers.ts:336-402 |
| CSP | `script-src 'self'`（无 unsafe-inline/eval）、`img-src 'self' data:`、frame-ancestors none | security/csp.ts:10-20 | 验证码若走外域需调 CSP；RSA 用 WebCrypto 原生无冲突 | security/csp.ts; vite.config.ts:41-52 |

## 2. 当前登录时序摘要（实际顺序）

1. 入参校验（`@Valid` `@NotBlank` username/password，空=400）— AuthController.java:77,224-232
2. `log.info("用户登录: {username}")` — 79
3. `getByUsername` → 找不到返回 401「用户名或密码错误」— 82-85
4. `passwordEncoder.matches()` → 不匹配返回 401 — 88-90
5. 状态校验 `statusDenyMessage`：status=1 停用 / 2 锁定 / null=未知 → 401 对应文案 — 93-97,217-222
6. 签发 access JWT（TTL 900s）— 100
7. 生成 refresh 随机 token → SHA-256 写 `sys_refresh_token`（TTL 604800s）— 103-104
8. 下发 httpOnly `rt` cookie（Secure=true→Strict / false→Lax，Path=/api/auth/）— 105-106,34-42
9. 返回 `R.ok(TokenResponse{accessToken,expiresIn=900})` — 109

**刷新链路**：读 `rt` cookie → rotateRefreshToken（查 token_hash → 不存在 401 → 重放→全用户撤销 → 过期→撤销+401 → 撤销旧→签新）→ 重载用户再查 status（拒绝则撤销新+清 cookie）→ 下发新 cookie+新 access（AuthController.java:119-151）。

## 3. 行为链与唯一直接断点

登录成功 → **access 落响应体（前端内存），refresh 落 httpOnly cookie** → 前端内存持 access。
刷新：access 到期前用 `rt` cookie 调 `/auth/refresh`（免鉴权白名单）→ 轮换新 access+新 cookie。
恢复：冷启动 guard 发现内存无 token → `await refresh()`（浏览器自动带 `rt` cookie）→ 成功则重建 session+menu；失败 → `next(loginRedirectTarget)` 回登录页。
401：请求层 → `unauthorizedHandler` → 清动态路由 + push /login。
过期/退出：`/auth/logout` 撤销 refresh + 清 cookie + 踢 Redis 缓存（幂等），并 `setSecure(true)` 强清。

**唯一直接断点**：access token 只存浏览器内存，页面 F5 清空 → 后续带不出 Bearer → 401 → 回登录页。`rt` httpOnly cookie 仍在，但**后端 filter 只解析 `Authorization` 头，无 cookie→access 恢复路径**。前端口径「已有恢复入口」是真实的（guard.ts:134-144 冷启动续登），但完全押注 `refresh()` 单点，失败只走跳登录，无兜底清理。Mock 模式 refresh 直接返回新 token 无 cookie 语义，**该断点在 mock 下不可复现**。

## 4. P45 影响面与相邻非目标清单

**本轮必要影响面（Cookie 登录态修复 + 双 Token/加密/验证码演进接缝）**：
- 后端：`AuthController`（login/refresh 验证码+限流挂钩+固定校验顺序）、`JwtAuthenticationFilter.resolveToken`（cookie→access 恢复）、`CookieUtils`（access cookie 属性）、`JwtProvider`（如引入旋转）、可能新建验证码/限流/公钥实现、`application*.yml`（密钥密文化、permit-urls 补 `/auth/captcha`、`/auth/public-key`）、若审计/挑战落库则新增 Flyway。
- 前端：`LoginPage.vue`（验证码/刷新交互/时间戳/公钥承载）、`foundation/auth/index.ts`（LoginPayload 扩字段）、`foundation/request`（cookie/withCredentials/双 Token 头扩展；因 `config.headers.set` 存在，新增头无循环依赖问题）、`foundation/mock`（补验证码/密码错误 mock）、`error-code-map.ts`（补 P45 错误码）、可能新增 WebCrypto RSA 工具（CSP 无冲突）、**token.ts 的「禁止落 local/sessionStorage」不变式与「access 仅内存」需演进**。

**相邻非目标/需规划层裁决冲突**（编号 N1-N5）：
- **N1（范围裁决）**：密码链路是否引入 RSA 公钥加密+后端私钥解密？仓库现为 HTTPS 假定+BCrypt 明文传输，项目零 RSA 资产。若引入需定密钥生命周期/多实例共享（现只有 `SW_CIPHER_KEY` AES 对称环境变量先例）。
- **N2（接缝裁决）**：一次性登录挑战（验证码/失败计数）落 **Redis**（多实例安全，接缝现成，但需补原子 INCR）还是 **DB**（`sys_refresh_token` 已有 TTL/撤销先例）？否决本地内存（多实例不一致；`RedisUtils` 无 INCR 原语需新增）。
- **N3（双 Token 边界）**：access 持久化为 cookie 是否随本轮落地双 token 骨架（refresh 进同 cookie）还是仅修刷新丢登录态最小路径？规划层已要求预留双 Token 骨架，需定本轮交付边界与前端口径一致性。
- **N4（非目标）**：登录失败锁定落地是否要 `status=2` 自动解锁定时任务？（Quartz 单节点可承载，属扩展项）。
- **N5（非目标/记录类）**：审计 login 日志落库、`sys_refresh_token` 旧行回收——不阻塞 P45 主目标，需登记避免隐式扩张。
- **N6（默认值风险，建议规划层知悉）**：`sw.security.jwt.secret` 与 `cookie.secure:false` 均有明文默认兜底，生产依赖环境注入；P45 密钥管理可并入。

## 5. 已确定事实 / 推测 / 未确认事项 / 冲突

- **已确定**：先密码后状态（I50 确认存在）；access 仅响应体；refresh 已落 httpOnly cookie；后端零 RSA/验证码/锁定实现；前端零 cookie 读写；Redis 是唯一跨实例共享存储且无 INCR 原语；mock 刷新无 cookie 语义。
- **推测（低置信）**：`LoginUserLoader` 冷装载回查 `UserDetailsProvider` 走 DB——多实例下 login 上下文一致；refresh token 存 DB 跨实例天然共享。
- **未确认**：多实例实际部署实例数（仓内配置齐备但无法断定）；`SW_CIPHER_KEY` 是否已在生产配置（仅对称凭据加密先例）。
- **冲突（需规划层裁决）**：N1 RSA 引入范围；N2 挑战存储接缝；N3 双 Token 交付边界；I50 时序重排与「先状态后密码」对停用账号 BCrypt 消耗的影响。

## 6. 检查范围 / 证据摘要

后端：`AuthController.java`（全文）、`JwtAuthenticationFilter.java`、`CookieUtils.java`、`TokenResponse.java`、`JwtTokenProviderImpl.java`、`JwtProperties.java`、`RefreshTokenService.java`、`RedisConfig.java`/`RedisUtils.java`/`LoginUserCacheService.java`、SPI 空壳两个、`application*.yml` 四份、`V18__init_refresh_token_table.sql`、`AuthFlowIntegrationTest.java` 测试场景清单。关键字：login/auth/JWT/token/cookie/captcha/RSA/Redis/rateLimit/lock/audit/login_log。
前端：`LoginPage.vue`、`foundation/auth/index.ts`、`token.ts`、`request/index.ts`、`router/guard.ts`、`router/index.ts`、`mock/handlers.ts`、`error-code-map.ts`、`security/csp.ts`、相关 spec。关键字：login/token/cookie/localStorage/router/guard/401/me/captcha/RSA。

**测试覆盖现状**：后端已有登录成功→me→menus、无 token 401、密码错误、未知用户、停用/锁定拒绝、refresh 停用拒绝撤销；**无验证码、无 RSA、无机器时间、无登录锁定测试**。前端已有登录成功/失败不落 token、logout 清理、refresh 单飞、到期 60s 缓冲、token 永不落 localStorage、守卫冷启动恢复、会话装配失败登出；**无登录页组件单测、无 cookie 相关测试、无请求层 401→跳转直接测试、无刷新失败清 session 兜底断言**。

## 7. 是否需要继续探索

不需要。九问题全部可复核回答，证据充分；可进入规划层收敛正式方向。