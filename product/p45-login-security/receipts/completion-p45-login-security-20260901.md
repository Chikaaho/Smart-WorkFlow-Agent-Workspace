# P45 登录安全与登录态恢复 · 执行完成回执

> 功能编号：P45 / M02-F06-01
> 状态：**自验通过，待规划验收**（Executor 不写功能 PASSED/COMPLETED，不核销 P45，不晋级 M02-F06-01）
> 日期：2026-09-01
> 权威方向：`product/p45-login-security/ready/direction-p45-login-security.md`

## 1. 功能与内部 Step 概要

| Step | 内容 | 结果 |
|---|---|---|
| S0 | 修改前真实行为取证（§7 标准 6） | 完成，第一断点定位（见 §5） |
| S1 | 后端：登录挑战（验证码+RSA 公钥+服务器时间，Redis 5min TTL 原子消费）+ 固定校验顺序 + 稳定错误码 + Cookie Path 可配置 | 完成 |
| S2 | 后端测试：四类分支顺序证明、一次性消费/重放、过期、时间窗、密钥绑定、Cookie Path | 完成，全绿 |
| S3 | 前端：登录页挑战交互、WebCrypto RSA-OAEP(SHA-256) 加密、auth API 契约、守卫恢复失败清理、错误码映射、mock 同语义 | 完成 |
| S4 | 前端 spec：index/rsa/guard/mock 探活更新与新增，token 不落 storage 不变式保持 | 完成，全绿 |
| S5 | 完整验证：后端 mvn 全量、前端四连、curl 真实行为链、真实浏览器 F5/深链/登出链 | 完成，全绿 |
| S6 | 本回执 | 完成 |

## 2. 实际读取与修改文件

### 后端 Smart-WorkFlow-Server（新增 9，修改 9）

新增（`sw-biz-system-biz/.../system/security/`）：
- `AuthErrorCode.java` — 认证专用错误码 2101-2104（2101 验证码错误 / 2102 验证码已过期 / 2103 机器时间异常 / 2104 密码错误）
- `LoginSecurityProperties.java` — `sw.security.login.*`（TTL 300s、失败上限 5、时间窗 180s、密钥版本、PKCS#8 私钥注入位，无默认私钥）
- `RsaLoginKeyManager.java` — 构造期 fail-fast（未配置/强度<2048/解析失败拒绝启动）、由 CRT 私钥派生 SPKI 公钥、OAEP(SHA-256, MGF1-SHA256) 解密、按挑战绑定版本解密、明文上限 190 字节不截断
- `LoginChallengeStore.java` / `RedisLoginChallengeStore.java` — 跨实例 Redis 权威状态：挑战 JSON+TTL、DEL 原子消费、INCR 失败计数；只落验证码摘要不落原文
- `LoginChallengeService.java` — 挑战签发（验证码原文仅出现一次）、内容/有效期/时间窗校验、原子消费

修改：
- `AuthController.java` — 新增 `GET /auth/challenge`；`POST /auth/login` 重排为固定顺序：验证码记录与内容(2101) → 有效期(2102) → 客户端时间(2103) → 原子消费 → RSA 解密 + 账号密码认证(2104 统一语义，含账号不存在/非法密文)；登录请求体改为五字段并移除 `@NotBlank`（缺失按所属阶段返回语义码）；账号状态语义（停用/锁定）保持不变
- `CookieUtils.java` — Path 参数化（`sw.security.cookie.path`，默认 `/api/auth/`）
- `application.yml` — permit-urls 增 `/auth/challenge`；`cookie.path`；`login.*` 配置（私钥经 `SW_LOGIN_RSA_PRIVATE_KEY` 注入）
- `application-prod.yml` — 生产 `cookie.secure=true`、`cookie.path=/sw-server/api/auth/`（覆盖同源保前缀部署）
- 测试：`AuthControllerTest.java`（重写，16 用例）、`AuthFlowIntegrationTest.java`（挑战+RSA 全链，11 用例）、`CookieUtilsTest.java`（签名适配）、新增 `LoginChallengeTestSupport.java`、`RsaLoginKeyManagerTest.java`（6）、`RedisLoginChallengeStoreTest.java`（5）
- **既有缺陷修复（非 P45 范围扩张，阻塞验证门，回执披露）**：`FlywayFullChainH2Test.java` / `FlywayFullChainPostgresTest.java` 全链迁移计数断言 44/43 → 46/45、终点版本 V44 → V46、升级链 +2 条——分支历史提交（255a9ce V45、dcb90ca V46）新增迁移时未同步测试计数，本分支 mvn 全量在本次修改前即红。

### 前端 Smart-WorkFlow-Web（新增 2，修改 15）

新增：
- `src/foundation/auth/rsa.ts` — WebCrypto RSA-OAEP/SHA-256 加密（SPKI 导入、UTF-8 不截断）+ `LoginChallengeDTO`
- `src/foundation/auth/rsa.spec.ts` — 真实 webcrypto 加解密往返/随机化/多字节断言（3 用例）

修改：
- `src/foundation/auth/index.ts` — `fetchChallenge()`；`login()` 契约升级：挑战公钥加密密码 → 提交 username/密文/captcha/captchaId/timestamp 五字段；`useAuth` 暴露 fetchChallenge
- `src/views/LoginPage.vue` — 验证码输入 + 展示（点击刷新）+ 挑战预载；登录失败自动换新挑战并提示后端 message
- `src/router/guard.ts` — 冷启动 refresh 失败分支补齐清理：`clearDynamicRoutes` + `clearToken`（access 内存、用户会话、权限菜单、动态路由）再跳登录，不留半登录态
- `src/foundation/request/error-code-map.ts` — 2101-2104 中文映射
- `src/foundation/mock/handlers.ts` — 新增 `GET /api/auth/challenge`；login mock 表达相同状态转换（验证码错误 2101、一次性消费、时间戳 2103、密码错误 2104 演示分支）
- spec 更新：`index.spec.ts`、`guard.spec.ts`、`agent-execution-access.spec.ts`、`notify-*-guard(evidence).spec.ts`（token mock 补 clearToken；断言只换名不弱化）、`auth-session.spec.ts`、`index.spec.ts`(mock)、`form-import-export-mock.spec.ts`（挑战式登录）、`tool-real-permission-rejection.spec.ts`（真实后端探活改挑战探活 + 挑战式登录）

## 3. 实际命令与原始结果摘要

| 验证 | 命令 | 结果 |
|---|---|---|
| 后端编译 | `MAVEN_OPTS="-Xmx2g" mvn -q compile` / `test-compile` | exit 0 |
| 后端认证域测试 | `mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -Dtest='AuthControllerTest,AuthFlowIntegrationTest,CookieUtilsTest,RedisLoginChallengeStoreTest,RsaLoginKeyManagerTest'` | 47/47 全绿（16+11+9+5+6） |
| 后端全量 | `MAVEN_OPTS="-Xmx2g" mvn test`（两仓互斥下串行） | **1952 tests / 0 failures / 0 errors / 0 skipped**（其中 agent 模块 346 与基线一致；总数较 955 基线增长源于分支历史新增模块/用例，非本次推算） |
| 前端四连 | `pnpm typecheck && lint && test && build`（均带 2G 上限） | **110 files / 1062 tests / 0 failed / 0 skipped**（后端在线运行，K8 真实后端 spec live 通过）；build ✓ |
| 真实 HTTP 行为链 | dev 后端（H2+Redis+RSA env 注入）+ `/tmp/p45-chain.mjs`（WebCrypto 加密） | ①挑战 200：captcha/captchaId/SPKI 公钥/keyVersion/expiresIn=300/serverTime；②登录 200 code=0 + `Set-Cookie: rt=…; Max-Age=604800; Path=/api/auth/; HttpOnly; SameSite=Lax` + accessToken；③错验证码→2101；④伪造 UUID→2101；⑤时间偏差 10min→2103「机器时间异常」；⑥错密码→2104「密码错误」；⑦refresh 携 cookie 200 轮换新 token+新 cookie；⑧无 Bearer /me→401 |
| 敏感泄漏反向断言 | grep 后端日志 / redis-cli | 日志 0 命中明文密码/私钥；Redis 挑战仅 `captchaDigest`+`keyVersion`+`createdAtEpochMs`，无验证码原文 |
| 真实浏览器链（IAB + Vite dev 直连后端） | 登录页加载→填 admin/密码/验证码→登录 | 登录成功跳 `/dict`；**F5 后停留 `/dict` 不回登录页**；**深层路由 `/notify/template` 直接打开恢复成功**；退出登录→`/login`，**退出后刷新仍是 `/login` 不能恢复**；每步菜单/会话正常装配 |

## 4. 修改前行为取证（§7 标准 6，修改前采集）

- `POST /auth/login`（明文 JSON）200，`Set-Cookie: rt=…; Path=/api/auth/`；同源 `/api/auth/refresh` 携 cookie 200 正常轮换。
- 无 `Authorization` 头调 `/system/user/me` → 401（access 仅内存，F5 后必 401）。
- 生产 `.env.production`：`VITE_API_BASE_URL=/sw-server/api`——请求路径 `/sw-server/api/auth/refresh` 与 Cookie `Path=/api/auth/` **不前缀匹配**，浏览器不发送 cookie → refresh 必失败 → 回登录页。**第一个失败点 = Cookie Path 与生产公开前缀不匹配**（环境型断点，非代码逻辑缺陷；与补充探索 G1-G4 判定一致）。
- 修复：`sw.security.cookie.path` 可配置 + prod 覆盖 `/sw-server/api/auth/`；**证据边界**：本验证环境为同源 `/api` 前缀（开发等价公开前缀），生产保前缀行为由路径参数化 + 单元测试断言 `Path=/sw-server/api/auth/` 承载，未在真实 chikaho.cn 生产网关复现（方向 §9 允许的等价环境路径，如实标注）。

## 5. 与方向的偏差

1. **既有 Flyway 全链测试计数未随 V45/V46 同步**（阻塞验证门的既有缺陷）：按分支历史事实修正计数断言（44→46 / 43→45、V46 终点、升级链 +2），非产品范围扩张。
2. 验证码为 4 位文本验证码（去除易混淆字符）直接在挑战响应中展示；方向未要求图片渲染，CSP 无需调整。
3. 集成/单元测试使用内存挑战存储测试替身（与 Redis 实现相同的原子 consume 语义）；生产权威状态唯一为 `RedisLoginChallengeStore`，真实行为链验证走真实 Redis。
4. mock 的 `username='wrong'` 作为密码错误演示分支（mock 既有口径不校验真实密码，保持 F1 会话切换行为）。

## 6. 遇到的问题 / 风险 / 已知限制

- `spring-boot:run` 使用 ~/.m2 快照，需先 `mvn install -DskipTests` 刷新（已记入流程，非代码问题）。
- 密钥轮换（`rsa-extra-keys`）已建立配置与按挑战版本解密的接缝，本轮未做轮换的端到端自动化场景（方向 §3.2 保留"至少保留到最后挑战过期"的运维约束）。
- 验证码失败次数上限（5 次）后挑战作废，已实现；限流/账号锁定属方向非目标，未实现。
- 生产网关/部署未真实观测（无仓库内网关配置证据），生产 Cookie 生效需部署时确认 `sw.security.cookie.path` 与实际公开前缀一致。

## 7. 与验收标准逐项对照（方向 §7）

| # | 标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | 前置响应含公钥/密钥版本/验证码 UUID/展示内容/有效期/服务器时间；无私钥与明文 | ✅ | curl 挑战 200 六字段；日志/Redis 反向 grep 0 命中 |
| 2 | 登录请求五字段、密码为协议内 RSA 密文；服务端解密后仍用既有 BCrypt，不改密码存储 | ✅ | 浏览器/curl 请求体含五字段、密文 Base64 256 字节；`RsaLoginKeyManagerTest` 往返 + `AuthFlowIntegrationTest` BCrypt 匹配链 |
| 3 | 四类分支规定错误码且证明后续校验未提前执行 | ✅ | 2101/2102/2103/2104 各分支用例 + 顺序断言（时间异常时挑战未消费、用户查询未执行；密码错误时挑战已消费） |
| 4 | 共享存储 5 分钟过期；一次性原子消费；重复/并发仅一次进入密码认证 | ✅ | Redis TTL 300s 配置 + 存储测试；DEL 原子消费；重放用例第二次 2101 且 token 仅生成一次 |
| 5 | 缺失/非法字段、错误密文、错误密钥版本、轮换窗口旧挑战均明确正反向；无明文降级 | ✅ | 非法 Base64→2104、未知版本拒绝、伪造 UUID→2101；`RsaLoginKeyManagerTest` 反向用例；无明文回退路径 |
| 6 | 修改前完整行为链取证并定位第一失败点 | ✅ | §4：Set-Cookie 观测、Path 与 /sw-server/api 前缀不匹配定位 |
| 7 | 修复后公开前缀下登录设安全 refresh cookie；F5/重载/深链有效凭证恢复原页面不闪登录页 | ✅ | 真实浏览器：F5 停 `/dict`、深链 `/notify/template` 恢复；Cookie 属性 HttpOnly/Path/Max-Age/SameSite 观测；生产前缀路径单测断言（等价环境边界见 §4） |
| 8 | refresh 无效/撤销/重放/状态拒绝时统一清理并回登录页，无循环/半登录态 | ✅ | guard 失败分支 clearDynamicRoutes+clearToken；停用/锁定/已删 refresh 拒绝+轮换撤销+清 cookie 用例；浏览器登出后刷新回登录页 |
| 9 | 主动退出撤销+清 cookie，刷新不可恢复；跨用户/租户挑战与会话不串用 | ✅ | 浏览器登出链；挑战 UUID 服务端生成（每挑战独立 key），refresh 撤销语义未退化（`AuthControllerTest` 回归） |
| 10 | access 仅内存；Cookie/localStorage/sessionStorage 无 access token；refresh 不暴露给 JS/响应体/日志 | ✅ | `token.spec.ts` 不变式保持全绿；`rt` HttpOnly（JS 不可读）、仅出现在 Set-Cookie；日志反向断言 |
| 11 | refresh 轮换/重放撤销、登录成功、状态、权限菜单、受保护 API 无回归；Mock 与真实契约一致 | ✅ | 全量 1952/1062 全绿；mock 表达相同状态转换与错误码 |
| 12 | 受影响范围测试、真实浏览器检查与项目级回归全通过；回执含命令/退出码/计数/请求响应/Cookie/路由 | ✅ | §3 表 |
| 13 | 仅提交执行回执与建议状态，不提前 PASSED/COMPLETED、不核销、不晋级 | ✅ | 本回执；功能状态建议 `VERIFYING`（待规划验收） |

## 8. 自验结论

P45 实现完成，方向 §7 十三项验收标准在可用证据边界内全部成立（唯一边界：生产网关真实环境未观测，以等价公开前缀 + 参数化配置 + 单测断言承载，已在 §4/§6 如实标注）。建议规划层按真实行为证据组织独立验收；本执行层不改变任何正式功能状态。

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p45-login-security/receipts/completion-p45-login-security-20260901.md","evidence":["后端全量 mvn test 1952/0/0/0（agent 346）","前端四连 110f/1062t/0skip build 绿","真实浏览器 F5/深链/登出恢复链全部通过","curl 真实登录行为链四类错误码+一次性消费+轮换全通过","日志与 Redis 无明文/私钥泄漏反向断言"],"feature_status":"VERIFYING"}
```
