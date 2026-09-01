# P45 登录态刷新断点补充探索（执行层回执）

> 会话角色：执行。任务来源：`search_task/p45-login-state-direct-cause-supplement.md`。
> 权威输入：`search_task/p45-login-security-current-seams.md`、`search_fallback/p45-login-security-current-seams.md`。
> 只读核实 G1-G4，不实现、不重复首轮已锁定事实；目标 <4KB。

## 一、登录态恢复逐点判定矩阵（G1）

| # | 环节 | 配置/代码位置 | 成立条件 | 当前事实 | 结论 |
|---|---|---|---|---|---|
| 1 | 后端 Set-Cookie | `AuthController.login()` L103-106 → `CookieUtils.setRefreshCookie` | 登录成功 | `rt` cookie：HttpOnly、Secure=配置、Path=/api/auth/、SameSite、Max-Age=604800 | 后端已签发，条件满足 |
| 2 | 浏览器接收 cookie | 同源/同域 | `Set-Cookie` 域与当前页面相同 | cookie 无 Domain，默认仅限**精确 host**；Path=/api/auth/ | **仅同源精确 host 可收**；若前端/网关不同域则不收 |
| 3 | 刷新请求携带条件 | 浏览器自动携带（同源） | axios `withCredentials` 默认 false，仅跨源需 true | **同源自动带；跨源不带**（axios 默认 false + 后端无 `.cors()` 链） | **同源可携；跨源必然不带** |
| 4 | Cookie Path 匹配 | 请求路径 vs Cookie Path=/api/auth/ | 请求 path 前缀含 /api/auth/ | 开发 `/api/auth/refresh` 匹配；生产 `/sw-server/api/auth/refresh` **不匹配** | **开发匹配；生产网关保前缀时不匹配** |
| 5 | `/auth/refresh` 可访问 | `permit-urls` L177-179 含 `/auth/refresh` | 免鉴权 | 满足 | refresh 无需 token 即可调 |
| 6 | refresh 响应回填 | `refresh()` → `setTokenResponse(data.accessToken, expiresIn)` | 后端轮换成功返回新 access | 单飞锁；成功写内存 | 成立 |
| 7 | session/menu 恢复 | `guard.ts:146-164` `buildDynamicRoutes` | 内存有 token + 会话/菜单装配 | `loadSession()`+`loadMenu()` 并行 | 成立 |
| 8 | 守卫放行 | `guard.ts:123-182` | 上述全过 | 放行进入目标路由 | 成立 |

**G1 结论——第一个不成立的条件是【3 + 4 的组合】。**
- **开发代理**（Vite → 8080）：浏览器只看到 `localhost:5173` 同源，cookie 自动带（axios 同源），Path `/api/auth/` 匹配 `/api/auth/refresh` → **refresh 可恢复**。
- **同源生产**（前端 `/sw/` 与 API `/sw-server/api` 同域 `chikaho.cn`）：若网关**保留 `/sw-server` 前缀**转发，请求 path `/sw-server/api/auth/refresh` 与 Cookie **Path=/api/auth/ 不匹配** → cookie 不发送 → refresh 无凭证 → 401 → 回登录页。**这是生产 F5 断点的直接根因候选。**
- 仅当网关**剥除 `/sw-server` 前缀**路由到 `/api/auth/refresh` 时,cookie 才匹配可发。

> **静态无法唯一定位**：仓库内无 nginx/网关配置证据（`grep -rn "sw-server|nginx|rewrite" --include="*.md"` 全工作区零命中网关配置）。必须由真实行为证据区分。

## 二、环境/Cookie 发送矩阵（G2）

| 环境 | 前端位置 | 请求 URL | 浏览器视角 | Cookie 可达? | 依据 |
|---|---|---|---|---|---|
| 开发 (`pnpm dev`) | `baseURL=/api` + Vite proxy→8080 | `localhost:5173/api/...` | 同源 | ✅ 自动带（axios 同源默认携带） | vite.config.ts proxy; request/index.ts:10 |
| 同源生产 (同域保前缀) | `.env.production` `baseURL=/sw-server/api`、`VITE_APP_BASE_URL=/sw/` | `chikaho.cn/sw-server/api/...` | 同源 | ⚠️ **cookie Path=不匹配 → 不带** | CookieUtils Path=/api/auth/; request/index.ts:10 |
| 同源生产 (网关剥前缀) | 同上 | 网关 `/sw-server/api`→后端 `/api` | 同源 | ✅ 自动带（若剥前缀到 /api） | 假设网关 rewrite，无仓库证据 |
| 跨源生产 | 若前端与 API 不同域 | 跨域 | 跨源 | ❌ **必然不带**（withCredentials=false 且后端无 .cors()） | WebSecurityAutoConfiguration.java:79-89 无 cors(); axios 默认 false |
| Mock (`pnpm dev:mock`) | `VITE_USE_MOCK=true` | 拦截器直出 | — | ❌ 无 cookie 语义（handlers.ts:357-366 直接返回新 token） | mock 不涉 cookie |

**G2 结论**：**开发与「剥前缀同源生产」下 cookie 可携、refresh 可恢复；「保前缀同源生产」与任何跨源下 cookie 必然不带或路径不匹配 → refresh 必然失败回登录页。** 同源定义：`chikaho.cn` 下 `/sw/` 与 `/sw-server` 同协议同 host 同端口 = 同源,仅 path 不同——**这正是"同源但不是 Cookie Path 前缀匹配"的边界情形**。

## 三、恢复失败后的精确控制流（G3）

| 分支 | 触发 | 代码 | 清理与跳转 | 误判风险 |
|---|---|---|---|---|
| B1 refresh 失败 | `await refresh()` reject（cookie 未带/无效/过期/撤销） | guard.ts:139-143 | 无清 token（内存本为空）→ `next(loginRedirectTarget)` 跳 /login | 有：**有效 cookie 只因 Path 不匹配被误判无效** |
| B2 refresh 成功但 session 装配失败 | `loadSession()`/`loadMenu()` reject | guard.ts:146-164 → catch → `logout()`+`clearDynamicRoutes()` | logout 调 `/auth/logout`（同样无 cookie → 幂等无副作用）→ 跳 /login | 低：无额外残留 |
| B3 menu/me 失败 | 同上（Promise.all 内任一 reject） | 同上 | 同上 | 低 |
| B4 动态路由失败 | `addRoute`/`buildRoutesFromMenu` 异常 | 同上 | 同上 | 低 |
| 运行期 401 | 后续请求 401 | request/index.ts:83-84 → `unauthorizedHandler` → clearDynamicRoutes + push /login | 清动态路由+跳 /login | 中：可能误伤隐性续登 |

**G3 结论**：**B1 是唯一直接让 F5 回到登录页的分支,且存在「有效 cookie 只因环境/Path 不匹配被误判无效」的误判定风险。** B2-B4 均配 logout+清路由兜底,逻辑完整。guard.spec 已覆盖：refresh 拒绝→跳 /login（spec:66-72）、refresh 成功→建路由（spec:75-88）、session 装配失败→logout+跳 /login（spec:160-170）。

## 四、最小真实浏览器/HTTP 行为证据设计（G4）

以下观测可区分四类原因（执行阶段、不改代码）：

1. **Cookie 是否写入**：登录响应头 `Set-Cookie: rt=...` 是否出现且含 `Path=/api/auth/`、`HttpOnly`、`Secure`。若登录响应用 `curl`/浏览器 DevTools 可见 → 后端已写。（区分「后端未写」）
2. **Cookie 是否被浏览器存储**：DevTools → Application → Cookies 检查 `rt` 是否存在、Domain/Path 是否匹配当前页面。若存了但 Domain/Path 不含当前页 → 浏览器不发送。（区分「未存储/不匹配」）
3. **刷新请求是否携带**：刷新时 DevTools → Network → POST /auth/refresh → Request Headers 是否含 `Cookie: rt=...`。若 HTTP 响应头已写入但刷新请求无 Cookie → 携帯失败（Path/Domain 不匹配或跨源）。（区分「未携带」）
4. **refresh 是否被拒绝**：刷新请求有 Cookie 但响应 401 → 后端轮换拒绝（需查 refresh 所在表是否存在、过期、IP/UA）。（区分「被拒绝」）
5. **回填是否失败**：refresh 响应 200 且含新 accessToken，但页面仍回登录 → 前端 `setTokenResponse`/session 装配失败（需前端 console/断点）。（区分「回填失败」）

**判定矩阵**：
- 写入✅ + 刷新无 Cookie + 生产保前缀 → **Path 不匹配根因**（G2 候选1）
- 写入✅ + 刷新无 Cookie + 跨源 → **跨源 withCredentials/CORS 根因**（G2 候选2）
- 写入✅ + 携带✅ + 401 → **后端轮换拒绝根因**（需查 refresh 表）
- 写入✅ + 携带✅ + 200 + 仍回登录 → **前端回填/装配根因**
- 写入❌ → **后端未签 cookie 或响应被网关吞**

## 五、需规划层裁决的冲突与事实

1. **工程宪法 `docs/governance/engineering-constitution.md:109` 明写「token 仅内存；刷新=重登录（refresh seam 未实现，非 bug）」**——与代码现状冲突：`foundation/auth/index.ts:43-63` 已真实实现 `refresh()`（真实调 `/auth/refresh` + 轮换 + 回填），guard.ts:134-144 已在冷启动调用。**该条目是历史措辞未随代码演进更新，还是「refresh seam 未实现」指某更强的能力（如 cookie 恢复 access）？需规划层裁决语义。** 若按字面，「刷新=重登录」意味着当前 refresh 恢复设计并非缺陷——但 Owner 2026-09-01 明言「登录 Token 未持久化至 Cookie 导致刷新返回登录页，本轮修复」,故仍属待修范围,二者张力需裁决。
2. **生产是否有网关/反代、是否保 `/sw-server` 前缀**——仓库零证据,静态无法下定论,直接决定 F5 断点是否真实存在于生产。**必须在执行阶段先观测行为证据（§4）确认,不能假设。**
3. **axios 未设 `withCredentials`,后端无 `.cors()` 链**——若未来走跨源,双 Token cookie 方案需同时补两侧;本轮若不改跨源部署则无此必要。

## 六、结论

- **开发/剥前缀同源生产**：断点不在代码逻辑（guard.spec 证明 refresh→建路由链路完整）。F5 能正常恢复,**静态无法判定存在唯一直接断点**。
- **保前缀同源生产**：**cookie Path=/api/auth/ 与请求 /sw-server/api/auth/refresh 不匹配 → cookie 不发送 → refresh 401 → 回登录页**,这是 Owner 断点描述的最可能指涉。
- **跨源生产**：必然回登录页（需 withCredentials+CORS）。
- **唯一直接断点（候选根因）**：**生产环境 cookie 因 Path/来源不匹配无法到达 refresh 端点**,而非代码逻辑缺陷。但**静态无法唯一定位,必须经 G4 行为证据确认**;若证据显示 cookie 已被携带且 refresh 200 仍失败,则根因移到前端回填/装配层（当前 spec 已覆盖该层逻辑）。

> 回执保留首轮已锁定事实不改动；本回执只提供 G1-G4 增量。