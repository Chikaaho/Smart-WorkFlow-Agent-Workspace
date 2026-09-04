# P45 审查缺口修正与行为证据补充回执（G1-G10）

> 角色：执行。日期：2026-09-01。
> 审查对象：`planning-review-p45-implementation-01.md`（FAILED，缺口 G1-G10）。
> 权威输入：主方向 + `direction-p45-login-security-evidence-supplement-01.md`。
> 本回执为新建补充回执，不覆盖任何历史回执。功能状态保持 `VERIFYING`。

## 0. 输入版本（补充方向 §4-1）

- 后端：`develop` @ `9b1d80f`（基线）+ 本轮工作树（9 修改 + 9 新增，diff 基线即审查后 A3 已锁定文件范围外的行为修正：`PngCaptchaRenderer.java` 新增、`LoginChallengeService/LoginSecurityProperties` 有效期-保留期分离、前端 `rsa.ts/LoginPage.vue/handlers.ts` 载荷适配、`tool-real-permission-rejection.spec.ts` token 注入通道）。
- 前端：`develop` @ `103b636`（基线）+ 本轮工作树（15 修改 + 2 新增）。
- 证据环境：真实后端（H2 文件库 `/tmp/p45-h2/sw` + 真实 Redis + RSA 双版本密钥）+ 真实浏览器（IAB）+ 等价公开前缀网关（`/sw/` 静态 + `/sw-server/api/*` 反代，脚本 `evidence-p45-supplement-01/p45-gateway.mjs`）。
- 证据采集说明：验证码为像素 PNG（G1 约束），机器链路证据通过「证据环境 Redis 读摘要 → 离线 SHA-256 匹配」获得答案（测试者路径，不经过响应载荷）；浏览器链路由视觉读码完成（人机等同路径）。

## 1. 逐缺口证据（G1-G10）

### G1 验证码有效性 ✅（含实现修正）

修正：删除文本验证码；新增 `PngCaptchaRenderer`（Java2D 光栅化 PNG：逐字符随机旋转/配色 + 干扰线/点），挑战响应载荷为 `captchaImage`（`data:image/png;base64`），响应字段清单实测为
`['captchaId','captchaImage','expiresIn','keyVersion','publicKey','serverTime']` —— 无独立答案字段、无文本节点（像素图）、无可读答案元数据。
前端 `<img :src>` 渲染 + 仅提交用户输入（`LoginPage.vue`）。
反向：Redis 挑战记录字段实测 `['captchaDigest','createdAtEpochMs','keyVersion']`，无答案原文；两份真实服务器日志对明文密码/已知答案/PEM/refresh 原文均 0 命中（见 §4）。

### G2 过期语义 ✅（含实现修正 + 真实 Redis 行为）

修正：`LoginSecurityProperties` 分离 `challengeTtlSeconds=300`（业务有效期）与 `recordRetentionSeconds=600`（记录保留期 = Redis TTL）；`verifyCaptcha` 在有效期外但记录仍在时稳定返回 2102。
真实 Redis 短窗口行为链（TTL=5s / 保留=12s，原始输出 `p45-g2-result.txt`）：

```
A within validity(1s<5s): {"code":0,...,"hasToken":true,"setCookie":"PRESENT"}
B expired(6s, record still in redis: exists=1): {"code":2102,"msg":"验证码已过期","hasToken":false}
C beyond retention(13s>12s, exists=0): {"code":2101,"msg":"验证码错误","hasToken":false}
```

即：有效期内成功；内容正确但超 5 分钟且记录可判别 → 2102；保留期结束（Redis EXISTS=0）→ 2101。单元层另有 2102（回拨 6 分钟）与保留期外 2101 用例。

### G3 原子并发 ✅（真实 Redis + 真实认证链）

同一挑战 8 路并发提交（正确答案 + 正确密文，两轮，原始输出 `p45-g3-result.txt`）：

```
results=[{code:0,setCookie:1},{2101}×7]  （两轮各：success_count=1, with_set_cookie=1, rejected_2101=7）
sys_refresh_token(user_id=1, revoked=0)：并发前 6 → 并发后 7（本轮恰 +1；两轮合计恰 +2）
```

最多一个请求进入密码认证并签发 token/cookie，其余 2101 且无任何 token/cookie 副作用。

### G4 密钥轮换 ✅（真实服务链，四次服务运行）

- Run B'（active=v1）：签发挑战 `{"captchaId":"3eaeabea…","keyVersion":"v1"}`。
- Run C（active=v2 + extra v1，启动日志 `versions=[v1, v2]`）：旧 v1 挑战登录 `{"code":0,…,"hasToken":true}`（重叠窗口正向）；**新挑战 `keyVersion: v2`**（新挑战绑定当前版本）。
- Run D（仅 v2，`versions=[v2]`）：旧 v1 挑战（内容正确、记录仍在保留期）→ `{"code":2104,"msg":"密码错误","hasToken":false}`，服务端日志 `密码解密失败: 未知密钥版本: v1`（统一外显语义，不暴露版本差异；退役后稳定拒绝）。
原始输出：`p45-g4-b/c/d-result.txt`。

### G5 Cookie 生产前缀 ✅（等价公开前缀真实浏览器，修改前后同环境）

等价环境：`pnpm build`（`/sw/` + `/sw-server/api` 生产构建）+ 网关 5273 端口。同一浏览器、同一环境：

- **错误 Path**（`sw.security.cookie.path=/api/auth/`，即修改前硬编码值）：登录成功 `…/sw/dict`，`Set-Cookie: rt=<REDACTED>; Path=/api/auth/`；**F5 → `…/sw/login?redirect=/dict`**（第一断点在等价环境完整复现）。
- **正确 Path**（`/sw-server/api/auth/`）：登录成功；`document.cookie` 为空（rt HttpOnly，JS 不可见）；**F5 → 停留 `/sw/dict` 不闪登录页**；**深链 `…/sw/notify/template` 直达恢复成功**（菜单/身份装配完整）；退出 → `/sw/login`，**退出后刷新不可恢复**。
- 修复前断点（主分支代码 + 生产配置，第一轮回执 §4 curl 证据）与本环境复现相互印证：失败点 = Cookie Path 与公开前缀不匹配。

### G6 双用户/租户隔离 ✅（双用户全行为；跨租户登录属产品边界，如实披露）

- 第二用户 `opuser`（tenant 0，无角色绑定）经 H2 Shell 真实落库 seed，浏览器完成挑战登录。
- **会话不串用**：admin 退出 → Cookie 清除、刷新不可恢复；opuser 登录后 F5 恢复的是 opuser 自身会话（无菜单 → `/404` 兜底），非 admin 视图。
- **路由不越权**：opuser 直达 admin 深链 `/sw/notify/template` → **403 无权限**。
- **交叉 UUID 使用**（机器链，`p45-g6-cross-result.txt`）：admin 的挑战 UUID + opuser 凭据（及反向）→ 均成功但 token **按提交凭据归属**（DB 实测：user_id=1 与 user_id=2 的 refresh token 行数独立，5/3 条存活），挑战为无身份的人机凭证（行业惯例：CAPTCHA 保护表单而非账号）；未发生挑战、Token、会话或路由身份串用。
- **租户边界披露**：当前认证链 `getByUsername` 在无登录上下文时租户过滤固定为超管租户 0（`CommonTenantLineHandler` + `SUPER_TENANT_ID`），租户身份是认证后由用户行派生，**登录请求不存在租户输入**，"两个租户分别登录"在现产品能力下不可构造；如规划层要求登录期租户选择，属方向变更，提请规划裁决。本轮以双用户行为 + 租户派生机制事实覆盖 G6 可执行部分。

### G7 原始验证输出 ✅（原始输出/附件 + 勾稽修正）

- **勾稽更正**：第一次回执的"1952"为汇总口径错误（把 surefire 模块聚合行与逐类行重复相加）。本次以 surefire XML（136 个测试类）逐类聚合：**tests=977, failures=0, errors=0, skipped=0**，与模块聚合行一致。
- 逐模块叶子计数（后端，`mvn test` 原始输出）：Common 18 / Security 6 / Storage 19 / Notify 85 / Job 51 / IoT 23 / **Agent 346（与正式基线一致）** / System-Biz 232 / Form-Biz 81 / BPM-Engine 27 / BPM-Process 62 / Bootstrap 27，**SUM=977**。
- 相对基线 955 的增量 22：System-Biz 模块 P45 新增用例（挑战/过期/保留期/并发支撑/密钥管理/Redis 存储/Cookie Path 等，AuthControllerTest 16→17、新增 RsaLoginKeyManagerTest 6、RedisLoginChallengeStoreTest 5，扣除重写合并的旧用例后净增 22），Agent 346 与其余模块计数不变。
- 前端：**110 files / 1062 tests / 0 failed / 0 skipped**（基线 1060：净增 2 = rsa.spec +3 新用例、auth index.spec +1 fetchChallenge、K8 3 用例保留 live 运行，移除旧 login 断言 2 条）。K8 真实后端组在本轮以注入 token（`K8_ADMIN_TOKEN`，经挑战+RSA+摘要匹配机器链取得）**live 运行通过，0 skip**。
- 原始输出附件：`evidence-p45-supplement-01/`（G2/G3/G4/G6 行为输出 + 采集脚本 + 网关脚本）；本回执各代码块即原始输出转录。

### G8 输入与分支行为 ✅（脱敏请求/响应 + 状态核验 + 零执行证明）

各分支脱敏证据（响应为真实业务码/消息；`<PW>`=RSA 密文字段占位，`<TS>`=epoch 毫秒）：

| 分支 | 请求（脱敏） | 响应 | 挑战消费状态（Redis EXISTS） | 后续校验零执行证明 |
|---|---|---|---|---|
| 验证码内容错误 | `{username:"admin",password:"<PW>",captcha:"<REDACTED>",captchaId:"<uuid>",timestamp:"<TS>"}` | `{code:2101,msg:"验证码错误"}` | 1（未消费） | 挑战仍在 = 未进入消费/解密/账号查询 |
| 伪造 UUID | `captchaId:"not-exist"` | `{code:2101}` | —（无记录） | 同上 |
| 内容正确但过期 | 正确答案，t>300s | `{code:2102,msg:"验证码已过期"}` | 消费前删除记录（作废） | 未进入时间/解密/账号校验 |
| 机器时间异常 | timestamp=now-600000 | `{code:2103,msg:"机器时间异常"}` | 1（未消费） | 挑战未消费 + 单元断言 `getByUsername` 零调用 |
| 错误密码 | 正确挑战 + 错误密码密文 | `{code:2104,msg:"密码错误"}` | 0（已消费） | 密码认证阶段统一语义，无 token/cookie |
| 密钥版本退役 | 旧版本绑定挑战 + 正确凭据 | `{code:2104}` | 0（已消费） | 日志仅"未知密钥版本"类别，无明文 |
| 并发落败（7/8） | 同一挑战并发 | `{code:2101}` | 0（仅胜者消费） | 无 token、无 Set-Cookie（`setCookie:0`×7） |

状态拒绝（停用/锁定/refresh 撤销）行为保持既有语义并在后端全量回归中通过。

### G9 敏感信息反向检查 ✅（范围 + 命令 + 计数）

搜索范围：两份真实服务器完整日志（`/tmp/p45-main-server2.log`、`/tmp/p45-final-server.log`，覆盖登录/F5/并发/交叉全部请求期）、挑战响应体、Redis 挑战记录、浏览器存储。命令与计数（0 = 零命中）：

```
grep -c "<REDACTED>"            <log>  → 0 / 0    （明文密码）
grep -cE "cgcz|r2xj|qp8y"     <log>  → 0 / 0    （已知验证码答案）
grep -c "BEGIN.*PRIVATE"      <log>  → 0 / 0    （私钥 PEM）
grep -cE "rt=[0-9a-f]{64}"    <log>  → 0 / 0    （refresh token 原文）
```

- 挑战响应字段：`[captchaId, captchaImage, expiresIn, keyVersion, publicKey, serverTime]`（无答案）。
- Redis 记录字段：`[captchaDigest, createdAtEpochMs, keyVersion]`（无答案原文）。
- 浏览器矩阵：`document.cookie` = 空（rt HttpOnly 不可见）；`localStorage/sessionStorage` 无任何 token（既有不变式 spec 钉死，全量通过）；refresh token 仅存在于 HttpOnly `Set-Cookie`，从未进入响应体/JS/日志。

### G10 基线与迁移漂移 ✅（事实披露，不改变基线归属）

- 分支/HEAD：后端 `develop@9b1d80f`、前端 `develop@103b636`（P45 会话输入基线）；工作树状态即 §0 所列 P45 diff（后端 9M+9A / 前端 15M+2A，diff --stat 610+/258- 与 330+/60-）。
- **V45/V46 披露**：`V45__system_crud_button_perms.sql`、`V46__drop_lowcode_naming.sql`（PG 链同名迁移）由提交 `255a9ce`（2026-08-31，fix(security): 权限装配收集页面节点权限并补齐系统 CRUD 按钮菜单）与 `dcb90ca`（2026-08-31，refactor(menu): 清理 lowcode 命名残留）引入，**早于 P45 会话（2026-09-01），属本分支既有提交历史，非 P45 输入新增，P45 未新增任何迁移**。
- Flyway 全链测试计数断言（V44→V46、43→45）是对上述既有提交的**测试同步修正**：该两提交合入时未同步全链测试，导致本分支 `mvn test` 在 P45 修改前即红（第一轮回执 §3/§5 已披露）。修正只使断言与已提交迁移事实一致，未把任何迁移"归因于 P45"，也未改变正式基线声明权——V46 是否晋级正式基线由规划层裁决。
- 相对基线计数差异的来源与勾稽见 G7。

## 2. 与审查"已锁定项"的一致性

未触碰 A1（access 仅内存 + refresh HttpOnly Cookie 职责）、A2（未写功能终态）、A3（文件范围仅按 G1/G2 行为修正扩展，已披露）。

## 3. 结论

G1-G10 缺口在本轮全部完成行为修正与可复核证据，自验通过；建议规划层按本回执与证据附件组织复验。功能状态建议维持 `VERIFYING`，核销/晋级仍待规划验收。

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p45-login-security/receipts/supplement-evidence-p45-gaps-20260901.md","evidence":["G2 真实 Redis 短窗口：有效期内成功/过期 2102/保留期外 2101","G3 真实 Redis 8 并发×2 轮各恰 1 成功、DB 每轮恰 +1 行","G4 轮换：v2+v1 重叠旧挑战成功、新挑战绑 v2、退役后 2104+未知版本日志","G5 等价 /sw-server/api 前缀浏览器链：错误 Path 复现断点、正确 Path F5/深链/退出全过","G6 双用户行为隔离+交叉 UUID 无串用+403 越权拦截","后端 977/0/0/0（surefire XML 勾稽，agent 346）、前端 110f/1062t/0skip K8 live、日志/Redis/浏览器敏感反向 0 命中"],"feature_status":"VERIFYING"}
```
