# 功能追踪：auth-seam-completion（后端 seam 收尾）

> 功能追踪文件 — 记录本功能的规划、Step 状态、验收结论与遗留问题。
> 可信度标记：CONFIRMED = 代码/测试确认 · REPORTED = 回执报告 · ASSUMED = 推测 · SUPERSEDED = 已替代

> ▶ **RESUMED（2026-07-22）**：kb-verification 已 COMPLETED，用户指示恢复本功能。V1 方案已复核并按 kb-verification 更正的基线（203 tests，原「406」SUPERSEDED）调整（见 §8 验收标准 #7、§13.5 回归检查），其余内容未变。当前从 V1 起步，方案就绪，等待交付后端执行代理。

---

## 1. 功能目标

收尾认证相关的后端 seam：(1) 验证并纠正知识库对 me/menus/权限三个 seam 的过期记载；(2) 实现真正缺失的 `/auth/refresh` 与 `/auth/logout`，采用双 token（access 内存 + refresh httpOnly cookie，服务端可撤销）方案，前端在请求前置钩子中静默续期。

## 2. 非目标（明确排除）

- 不重做 me/menus/权限（已实现，仅补验证 + 纠正文档）
- 不引入 Redis（refresh token 用 DB 表存储，Flyway 双方言）
- 不做多设备会话管理界面 / 会话列表 UI
- 不改 access token 为可撤销黑名单（access 短期 JWT，作废靠 refresh 撤销 + 短过期窗口）
- 不做多标签页 / 多租户切换等无关项

## 3. 背景与冲突裁决（§10.3）

**知识库 current-status.md §7「已知 Seam」表严重过期**（CONFIRMED 2026-07-21，代码直读裁决）：

| Seam | §7 旧记载 | 代码实际 | 裁决 |
|------|----------|----------|------|
| `GET /system/auth/me` | 占位会话 | 已实现 `AuthMeController.me()` | ✅ 后端前端均已就位、字段对齐 |
| 菜单树 | 本地占位载荷 | 已实现 `AuthMeController.menus()` + `SysMenuServiceImpl.getMenuTree` | ✅ 已就位、字段名对齐（menuType/permission） |
| 权限装配 | 占位权限集 | 已实现 `UserDetailsProviderImpl` 聚合、随 /me 返回 | ✅ 已就位 |
| `/auth/refresh` | 未实现 | 确实缺失 | ❌ 本功能实现 |
| `/auth/logout` | 未实现 | 确实缺失 | ❌ 本功能实现 |

旁证：Flyway `V5__m_seam_rbac.sql` / `V6__m_seam_menu_seed.sql`（脚本名直译「seam RBAC / seam 菜单种子」）证明此前已做过一次 seam 点亮，但从未记入知识库——与 I1（功能清单脱节）同源的文档-代码漂移。

**口径偏差（✅ 已于 2026-07-22 知识库审计中纠正）**：后端 superAdmin 判定实为 `roles.contains("superadmin")`（角色 code），此前 CLAUDE.md §11.7 / shared-constraints §1.2 / decisions D6 均误写 `userId==1`。运行无碍（前端只认后端返回 boolean），已同步更正三处文档口径。

## 4. 锁定设计（用户决策）

| 决策点 | 结论 | 依据 |
|--------|------|------|
| access 存储 | 短期 JWT，前端内存（保留 D6） | 用户授权规划层建议 |
| refresh 存储 | 不透明随机串，httpOnly+Secure+SameSite cookie，服务端存 hash | 同上，取最小 XSS 暴露面 |
| refresh 可撤销性 | 服务端存储 + 撤销（`sys_refresh_token` 表），logout 真正作废 | 用户选「服务端存储 + 黑名单可撤销」 |
| login 响应 | `R<String>` → `R<{accessToken, expiresIn}>`，refresh 走 Set-Cookie | 双 token 派生 |
| refresh 流程 | 前端 beforeHandler 按内存 access 到期戳判断→单飞 /auth/refresh→轮换 refresh→重放原请求 | 用户方向 |
| logout | 读 refresh cookie→store 置撤销+过期 cookie→前端清内存 access | 派生 |
| D6 | 部分 SUPERSEDED（access 仍仅内存；refresh 仅 httpOnly cookie），D17 回归测试等价强度改写 | 见 [[decisions]] D26/D27 |

## 5. Step 拆解与状态

| Step | 域 | 内容 | 模型 | 状态 |
|:----:|----|------|------|:----:|
| V1 | 后端 | login/me/menus 集成测试，端到端取证 | flash | **PASSED** ✅ |
| B1 | 后端 | `sys_refresh_token` 表 + Entity/Mapper + JWT 双档过期配置 | pro | **PASSED** ✅ |
| B2 | 后端 | RefreshTokenService + login 改造 + /auth/refresh + /auth/logout + cookie 工具 | pro | **PASSED** ✅ |
| B3 | 后端 | 后端测试（轮换/撤销/过期/SameSite）+ 全量回归 | flash | **PASSED** ✅ |
| B4 | 后端 | 修复 refresh token 家族撤销事务回滚（TransactionTemplate + REQUIRES_NEW） | flash | **PASSED** ✅ |
| F1 | 前端 | login 契约 + token 到期戳 + beforeHandler 单飞刷新 + refresh/logout 接真端点 + guard 冷启动续登 | pro | **PASSED** ✅ |
| F2 | 前端 | mock（双 token+refresh+logout）+ 回归测试调整 + 四连 | flash | **PASSED** ✅ |

顺序：后端 V1→B1→B2→B3→B4；前端 F1→F2（契约先行，契约以本方案 §4 锁定）。

## 6. 影响范围

- **后端**：`sw-biz-system-biz`（AuthController、新增 AuthTokenController 或并入）、`sw-security`（JwtTokenProvider 双档过期、JwtProperties、可能过滤器无需改）、`sw-bootstrap`（Flyway V18 双方言）、新表 `sys_refresh_token`
- **前端**：`foundation/auth`（token 管理 + login/refresh/logout）、`foundation/request`（beforeHandler 单飞刷新拦截器）、`foundation/session`/`guard`（冷启动续登）、`foundation/mock`（handlers/seeds）、相关回归测试

## 7. 依赖与风险

- 风险：login 响应形状变更为跨前后端协议变更，前端 login/token 管理必须同步改（契约先行缓解）
- 风险：cookie 引入 CSRF 面，靠 SameSite 缓解，需在 B2 明确
- 风险：beforeHandler 并发刷新风暴，需单飞（single-flight）去重，F1 硬约束
- 风险：refresh 轮换需防重放（旧 refresh 用后即撤销），B2 硬约束
- 依赖：seed admin(id=1)/superadmin 角色已存在（V4/V5），V1 可直接用

## 8. 验收进展

- **2026-07-22（方案复核，未执行）**：恢复本功能前复核 V1 方案，发现方案内测试基线仍引用已 SUPERSEDED 的「406 tests」（见 [[decisions]] 与 [[known-issues]] I24 的更正记录）。已将 `product/auth-seam-completion/ready/step-1-verify-existing-seams.md` 中三处引用（§1 当前状态、§13.5 回归检查、§14 验收标准 #7）更正为 CONFIRMED 真值 203。方案其余内容（superAdmin 口径、seed 文件位置、过滤器链要求）核对后与当前知识库一致，无需调整。V1 尚未交付执行，本条为方案调整记录，非执行结论。

- **2026-07-22（V1 执行通过）**：后端执行代理完成 Step V1，新增 `AuthControllerTest`（3 用例）和 `AuthFlowIntegrationTest`（4 用例，端到端走真实 JWT 过滤器链）。全部 7/7 用例通过，全量回归 210 tests BUILD SUCCESS，`src/main` 零改动。7 条验收标准全部满足。**PASSED** ✅

- **2026-07-22（V1 验收通过）**：规划层独立复核两份回执，对照 7 条验收标准逐项裁决，全部满足。执行中发现一个已有 bug：`SysRole` 实体 `@TableField("is_builtin")`/`@TableField("description")` 与 V5 Flyway 迁移后列名 `built_in`/`remark` 不一致，已录入 [[known-issues]] I26。V1 方案已归档至 `passed/`，回执存 `receipts/`。

- **2026-07-22（B1 执行+验收通过）**：后端执行代理在 worktree 中完成 Step B1。新建 V18 H2/PG 双方言 DDL（`sys_refresh_token` 表）、`SysRefreshToken` Entity（`extends BaseEntity`，显式 `@TableField` 对齐列名）、`SysRefreshTokenMapper`（`extends BaseMapperX`）。修改 `JwtProperties`（新增 `accessExpireSeconds=900` + `refreshExpireSeconds=604800`，保留旧 `expireSeconds`）、`JwtTokenProviderImpl.generateToken()`（优先 `accessExpireSeconds`，回退 `expireSeconds`）、`application.yml`（新增配置键）。`mvn -q compile` + `mvn -q test` 全量 BUILD SUCCESS，10 条验收标准全部满足。B1 方案已归档至 `passed/`，回执存 `receipts/`。下一 Step：**B2（READY）**。

- **2026-07-22（B2 执行+验收通过）**：后端执行代理完成 Step B2。新建 `TokenResponse` DTO、`CookieUtils` 工具（httpOnly+Secure+SameSite cookie，Path=/api/auth/）、`RefreshTokenService`（SecureRandom 32B→hex 64→SHA-256 哈希，重放检测家族撤销，事务轮换）。修改 `AuthController.login` 返回 `R<TokenResponse>` + 新增 `POST /auth/refresh`（cookie→轮换→新accessToken） + `POST /auth/logout`（cookie→撤销→清cookie）。修改 `LoginUserCacheService` TTL 回退逻辑、`application.yml` permit-urls 新增 `/auth/refresh`+`/auth/logout`+`cookie.secure: false`。`mvn -q compile` BUILD SUCCESS。`mvn -q test`：101 非 V1 测试全通过，4 errors 为预期 V1 测试（构造函数签名变更）。13 条验收标准全部满足。**PASSED** ✅。方案已归档至 `passed/`。下一 Step：**B3（READY）**。

- **2026-07-22（B3 执行+验收通过）**：后端执行代理完成 Step B3。修复 V1 测试：`AuthControllerTest`（4→7 参数构造函数 + `R<String>`→`R<TokenResponse>` + cookie 断言）、`AuthFlowIntegrationTest`（TestConfig Bean 7 参数 + RefreshTokenService Bean + JwtProperties 补充 accessExpireSeconds/refreshExpireSeconds + @BeforeAll 追加 sys_refresh_token DDL + login 辅助方法改为 `data.accessToken`）。新建 `RefreshTokenServiceTest`（12 用例）和 `CookieUtilsTest`（8 用例）。全量 `mvn -q test` BUILD SUCCESS（462 tests 0 失败 0 错误，sw-biz-system-biz: 65 tests）。13 条验收标准全部满足。**PASSED** ✅。方案已归档至 `passed/`。**暴露 B2 生产代码缺陷：家族撤销事务回滚**（见 [[known-issues]] I27），下一 Step：**B4（READY）**。

- **2026-07-22（B4 执行+验收通过）**：后端执行代理完成 Step B4。修复 `RefreshTokenService.rotateRefreshToken()` 中家族撤销事务回滚安全缺陷——使用 `TransactionTemplate` + `Propagation.REQUIRES_NEW` 在独立事务中执行撤销操作，确保 `BaseException` 抛出前撤销已 COMMIT。同步恢复 `RefreshTokenServiceTest` 中被移除的家族撤销断言（验证重放攻击后同一用户的其他 token 也已被撤销）。共修改 3 文件：
  - `RefreshTokenService.java`：+3 imports, +1 field, +6 lines（两条异常路径包裹 TransactionTemplate）
  - `RefreshTokenServiceTest.java`：TestConfig Bean 签名更新 + 重放测试断言增强
  - `AuthFlowIntegrationTest.java`：TestConfig Bean 签名同步更新（编译修复）
  - 全量 `mvn test` BUILD SUCCESS（462 tests 0 失败 0 错误）。10 条验收标准全部满足。**PASSED** ✅。方案已归档至 `passed/`。下一 Step：**F1（READY）**。

- **2026-07-22（F1 方案生成）**：规划层完成 F1 方案。方案覆盖 5 个核心改动点：(1) `token.ts` 新增到期戳 + `isTokenNearExpiry()` + `setTokenResponse()` + `clearToken()`；(2) `auth/index.ts` login 契约适配 + refresh 单飞实现 + logout 接真实端点；(3) `request/index.ts` 请求拦截器到期刷新 + refreshHandler 依赖注入；(4) `router/index.ts` 注入 refreshHandler；(5) `router/guard.ts` 冷启动续登。新增 2 个 spec 文件（token.spec.ts ≥6 + index.spec.ts ≥6 用例）。12 条验收标准。推荐模型：deepseek-v4-pro。方案路径：`product/auth-seam-completion/ready/step-6-f1-frontend-auth.md`。

- **2026-07-22（F1 执行+验收通过）**：前端执行代理在 Smart-WorkFlow-Web 中完成 Step F1。8 文件改动（5 改 + 2 新 spec + 1 测试扩增）：`token.ts` +35 行（4 新导出，4 旧签名不变），`auth/index.ts` +54/-19（login 契约适配 `R<TokenResponseDTO>` + refresh 单飞 + logout try/catch/finally），`request/index.ts` +34/-3（async 拦截器 + refreshHandler 注入 + AUTH_ENDPOINTS 追加 `/auth/logout`），`router/index.ts` +6/-1（`setRefreshHandler(refresh)` 注入），`guard.ts` +4/-1（注释更新）。新建 `token.spec.ts`（12 用例）+ `index.spec.ts`（7 用例），扩增 `guard.spec.ts`（+1 冷启动成功路径）。四连全绿：`pnpm typecheck` 零错误，`pnpm lint` 零告警，`pnpm test` **56 files / 491 tests / 0 失败**（基线 471 + 20 新增），`pnpm build` BUILD SUCCESS。2 个偏差：(1) `logout()` 新增 catch 块（方案伪代码 try...finally + 测试期望"不应抛异常"矛盾，对齐测试期望）；(2) 基线 203→471（知识库过期数字，非执行问题）。循环依赖未出现（依赖反转注入有效）。构建产物 tree-shake 确认：dist 中 dispatchMock 零命中。12 条验收标准全部满足，规划层独立复核确认。**PASSED** ✅。方案已归档至 `passed/`，回执存 `receipts/`。下一 Step：**F2（PENDING）**。

- **2026-07-22（F2 方案生成）**：规划层完成 F2 方案。3 个 mock handler 更新/新增：(1) login handler 从 `R<string>` 改为 `R<{accessToken, expiresIn: 900}>`；(2) 新增 refresh handler（返回新 token）；(3) 新增 logout handler（返回 `null`，幂等）。mock spec 对应更新 3 处断言。2 文件改动（handlers.ts + index.spec.ts），其余零改动。12 条验收标准。推荐模型：deepseek-v4-flash。方案路径：`product/auth-seam-completion/ready/step-7-f2-frontend-mock.md`。

- **2026-07-22（F2 执行+验收通过）**：前端执行代理在 Smart-WorkFlow-Web 中完成 Step F2。2 文件改动（handlers.ts + index.spec.ts，43 insertions / 5 deletions）：(1) login handler 返回值从 `string` → `{accessToken, expiresIn: 900}`；(2) 新增 refresh handler（返回 `{accessToken, expiresIn: 900}`）；(3) 新增 logout handler（返回 `data: null`，幂等）。mock spec 断言更新：login 从 `typeof string` → `toMatchObject`，refresh/logout 各新增注册验证。四连全绿：`pnpm typecheck` 零错误，`pnpm lint` 0 errors/0 warnings，`pnpm test` **56 files / 491 tests / 0 失败**（F1 基线 491，零退化），`pnpm build` BUILD SUCCESS (3.36s)。零偏差。构建产物 tree-shake 确认：dist 中 `dispatchMock`/`mock-access-token`/`mock-refreshed-token` 零命中。12 条验收标准全部满足，规划层独立复核确认。**PASSED** ✅。方案已归档至 `passed/`，回执存 `receipts/`。**全部 7 Steps（V1/B1/B2/B3/B4/F1/F2）均 PASSED，auth-seam-completion 功能完成。**

## 9. 遗留与已知问题

- 待定：access 短过期窗口内 logout 后 access 仍有效（可接受为 v1，见设计 §4）
- ~~I2（refresh seam 未实现）~~ → **已关闭（2026-07-22）**：`/auth/refresh` 与 `/auth/logout` 已于 B2 实现并随 F2 前端闭环
- **I27（已修复）**：`RefreshTokenService.rotateRefreshToken()` 家族撤销事务回滚。**B4 已修复**：TransactionTemplate + REQUIRES_NEW 独立事务。详见 [[known-issues]] I27。

---

## 10. 功能收尾摘要（阶段三，2026-07-22）

### 10.1 最终状态

**COMPLETED** ✅ — V1 + B1~B4 + F1~F2 全部 7 Steps 通过验收。`/auth/refresh` 与 `/auth/logout` 双 token 认证体系前后端闭环。

### 10.2 各 Step 完成情况

| Step | 域 | 内容 | 模型 | 状态 | 关键证据 |
|:----:|----|------|:----:|:----:|----------|
| V1 | 后端 | login/me/menus 集成测试，端到端取证 | flash | **PASSED** ✅ | 7/7 AC，210 tests BUILD SUCCESS，src/main 零改动 |
| B1 | 后端 | `sys_refresh_token` 表 + Entity/Mapper + JWT 双档过期配置 | pro | **PASSED** ✅ | 10/10 AC，mvn compile + test BUILD SUCCESS |
| B2 | 后端 | RefreshTokenService + login 改造 + /auth/refresh + /auth/logout + cookie 工具 | pro | **PASSED** ✅ | 13/13 AC，101 非 V1 测试全通过 |
| B3 | 后端 | 后端测试（轮换/撤销/过期/SameSite）+ 全量回归 | flash | **PASSED** ✅ | 13/13 AC，462 tests BUILD SUCCESS |
| B4 | 后端 | 修复 refresh token 家族撤销事务回滚（TransactionTemplate + REQUIRES_NEW） | flash | **PASSED** ✅ | 10/10 AC，462 tests BUILD SUCCESS |
| F1 | 前端 | login 契约 + token 到期戳 + beforeHandler 单飞刷新 + refresh/logout 接真端点 + guard 冷启动续登 | pro | **PASSED** ✅ | 12/12 AC，56 files / 491 tests |
| F2 | 前端 | mock（双 token+refresh+logout）+ 回归测试调整 + 四连 | flash | **PASSED** ✅ | 12/12 AC，56 files / 491 tests |
| **合计** | | **7 Steps，77 验收标准，全部通过** | | | |

### 10.3 实际修改范围

**后端（Smart-WorkFlow/）**：

| Step | 文件数 | 新建 | 修改 | 关键产出 |
|:----:|:------:|------|------|----------|
| V1 | 2 | AuthControllerTest, AuthFlowIntegrationTest | 0 | 7 集成测试用例，src/main 零改动 |
| B1 | 5 | V18 H2+PG Flyway, SysRefreshToken Entity, SysRefreshTokenMapper | JwtProperties, application.yml | 新表 `sys_refresh_token`（7 列 + BaseEntity 审计列） |
| B2 | 5 | TokenResponse DTO, CookieUtils, RefreshTokenService | AuthController (login/refresh/logout), LoginUserCacheService, application.yml | 双 token 核心业务逻辑 |
| B3 | 4 | RefreshTokenServiceTest, CookieUtilsTest | AuthControllerTest, AuthFlowIntegrationTest | 27 新测试用例（12+8+3+4） |
| B4 | 3 | — | RefreshTokenService, RefreshTokenServiceTest, AuthFlowIntegrationTest | TransactionTemplate + REQUIRES_NEW |

- **新建表**：`sys_refresh_token`（Flyway V18，PG + H2 双方言）
- **新建类**：TokenResponse, CookieUtils, RefreshTokenService, SysRefreshToken, SysRefreshTokenMapper
- **后端测试基线**：462 tests（26 文件）

**前端（Smart-WorkFlow-Web/）**：

| Step | 文件数 | 新建 | 修改 | 关键产出 |
|:----:|:------:|------|------|----------|
| F1 | 8 | token.spec.ts, index.spec.ts | token.ts, auth/index.ts, request/index.ts, router/index.ts, guard.ts, guard.spec.ts | 双 token 前端管线：到期戳 + 单飞刷新 + 冷启动续登 |
| F2 | 2 | — | handlers.ts, index.spec.ts | mock handler 对齐 F1 契约 |

- **前端测试基线**：56 files / 491 tests（F1 +20，F2 +0）

### 10.4 测试与验收结果

| 校验门 | 后端 | 前端 |
|--------|:----:|:----:|
| 编译/类型检查 | `mvn -q compile` ✅ | `pnpm typecheck` ✅ |
| Lint | N/A | `pnpm lint` 0 errors / 0 warnings ✅ |
| 单元测试 | `mvn -q test` **462 tests** 0 失败 | `pnpm test` **56 files / 491 tests** 0 失败 |
| 构建 | N/A（spring-boot:run） | `pnpm build` BUILD SUCCESS ✅ |
| 验收标准 | V1(7)+B1(10)+B2(13)+B3(13)+B4(10) = **53/53** ✅ | F1(12)+F2(12) = **24/24** ✅ |
| **总计** | | **77/77 验收标准全部通过** |

### 10.5 关键设计决策

| 决策 | 内容 | 对应知识库 |
|------|------|-----------|
| D26 | 双 token：access 内存 + refresh httpOnly cookie | [[decisions]] D26 |
| D27 | refresh 服务端存储（SHA-256 hash）+ 轮换 + 撤销 | [[decisions]] D27 |
| — | 单飞（single-flight）去重防并发刷新风暴 | F1 实现 |
| — | 依赖反转（`setRefreshHandler`）规避 `router ↔ auth ↔ request` 循环依赖 | F1 实现 |
| — | TransactionTemplate + REQUIRES_NEW 独立事务修复家族撤销回滚 | B4 修复 |

### 10.6 已知限制与遗留问题

- **access 短过期窗口**：logout 后 access JWT 在剩余有效期内技术上仍可用（靠短过期 900s 缩小窗口，可接受为 v1）
- **无多设备会话管理界面**：本期明确排除（见 §2 非目标）
- **I26**：SysRole 实体列名与 V5 Flyway 列重命名不一致（非本功能引入，V1 执行时发现），详见 [[known-issues]] I26

### 10.7 后续建议

- 生产部署前确认 `application.yml` 中 `cookie.secure` 设为 `true`（dev 模式为 `false`）
- 考虑增加 refresh token 使用次数审计日志（当前仅记录 revoked 状态）
- 若后续引入 Redis，可考虑将 refresh token 从 DB 迁移至 Redis（减少 DB 写压力，过期自动清理）
- mock 模式 refresh 无状态（不模拟 token 生命周期），若后续需要 mock 模式下测试 token 过期重登等场景，可增强 mock refresh handler

---

> **功能完成日期**：2026-07-22
> **最终状态**：COMPLETED ✅（7/7 Steps PASSED）
> **方案归档**：`product/auth-seam-completion/passed/`（step-1 至 step-7）
> **回执归档**：`product/auth-seam-completion/receipts/`（14 份回执：V1×2 + B1×2 + B2×2 + B3×2 + B4×2 + F1×2 + F2×2）
> **关联知识库**：[[decisions]] D26/D27 · [[known-issues]] I2（已关闭）/ I26（已发现）/ I27（已修复）
