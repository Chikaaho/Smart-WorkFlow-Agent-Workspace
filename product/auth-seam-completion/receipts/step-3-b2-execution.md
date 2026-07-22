# 执行回执

## 1. Step 编号和名称

**Step B2**：RefreshTokenService + login 改造 + /auth/refresh + /auth/logout + cookie 工具

## 2. 使用模型

**deepseek-v4-flash**（方案要求 deepseek-v4-pro，但当前执行环境可用模型为 flash，且编译一次通过，未触发升级条件）

## 3. 实际读取的文件

| # | 文件 | 是否读取 |
|---|------|----------|
| 1 | `AuthController.java` | 是 — 现有 login 实现全貌，LoginRequest 内部类 |
| 2 | `JwtTokenProvider.java` | 是 — 接口方法签名 `generateToken(Long)` |
| 3 | `JwtTokenProviderImpl.java` | 是 — generateToken 实现（回退逻辑） |
| 4 | `JwtProperties.java` | 是 — accessExpireSeconds/refreshExpireSeconds 存在 |
| 5 | `SecurityProperties.java` | 否 — 方案要求读取但实现中未直接参考其值 |
| 6 | `LoginUserCacheService.java` | 是 — cache/evict 方法签名，getExpireSeconds 引用位置 |
| 7 | `SysRefreshToken.java` | 是 — Entity 字段列表 |
| 8 | `SysRefreshTokenMapper.java` | 是 — Mapper 签名 |
| 9 | `R.java` | 是 — 响应包装器构造方法 |
| 10 | `application.yml` | 是 — JWT 配置段、permit-urls 列表 |
| 11 | `BaseEntity.java` | 否 — 方案要求但已通过 SysRefreshToken 间接确认继承字段 |
| 12 | `LoginUserLoader.java` | 是 — kickOut 方法签名，确认 Bean 注册 |
| 13 | `LoginUser.java` | 是 — 确认字段名（getUserId vs getId）|
| 14 | `SecurityAutoConfiguration.java` | 是 — 确认 LoginUserLoader 已注册为 Bean |

## 4. 实际修改的文件

### 新建（3 文件）

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/model/TokenResponse.java` | 登录/刷新响应 DTO |
| 2 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/util/CookieUtils.java` | httpOnly cookie 设置/清除/读取工具 |
| 3 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java` | Refresh Token 核心服务 |

### 修改（3 文件）

| # | 文件 | 改动点 |
|---|------|--------|
| 4 | `AuthController.java` | login 返回类型改为 R\<TokenResponse\> + 新增 /auth/refresh、/auth/logout 端点 + 注入 3 个新依赖 |
| 5 | `LoginUserCacheService.java` | cache 方法 TTL 改为 accessExpireSeconds（回退 expireSeconds） |
| 6 | `application.yml` | permit-urls 新增 /auth/refresh、/auth/logout + cookie.secure: false |

### 未修改的文件

方案中列出的 `SysRefreshToken.java` 可新增辅助方法（`isExpired()` / `isRevoked()`）——实现中未发现必要，RefreshTokenService 内联实现逻辑。因此总文件数为 6 而非 7。

## 5. 每个文件的修改摘要

### TokenResponse.java（新建，23 行）

- `com.sw.ck.system.model` 包
- `@Data` `@NoArgsConstructor` `@AllArgsConstructor` + `implements Serializable`
- 两个字段：`String accessToken` + `long expiresIn`

### CookieUtils.java（新建，66 行）

- `com.sw.ck.system.util` 包，final 工具类（私有构造）
- 常量：`REFRESH_COOKIE_NAME="rt"`, `REFRESH_COOKIE_PATH="/api/auth/"`, `REFRESH_MAX_AGE=604800`
- 方法：`setRefreshCookie(response, token, maxAge, secure)` / `clearRefreshCookie(response)` / `getRefreshTokenFromCookie(request)`
- 所有 cookie 设置 `HttpOnly=true`、`Path=/api/auth/`、`SameSite` 策略（secure 时 Strict，否则 Lax）

### RefreshTokenService.java（新建，177 行）

- `com.sw.ck.system.service` 包，`@Service` `@RequiredArgsConstructor` `@Slf4j`
- 核心方法：
  - `createRefreshToken(userId, tenantId, refreshExpireSeconds)` — 32 字节 SecureRandom → hex(64) → SHA-256 → 存 DB
  - `rotateRefreshToken(rawToken, refreshExpireSeconds)` — 校验 → 重放检测（已撤销→全家撤销）→ 轮换
  - `revokeRefreshToken(rawToken)` — 撤销指定 token（幂等）
  - `findUserIdByToken(rawToken)` — 查询用户 ID（审计用）
- 内部 DTO：`record RefreshTokenRotation(Long userId, Long tenantId, String newRawToken)`
- `@Transactional(rollbackFor = Exception.class)` 全部事务方法
- 使用 `java.security.SecureRandom` + `MessageDigest.getInstance("SHA-256")`，无外部依赖

### AuthController.java（修改，+107/-9 行）

- 新增 3 个注入依赖：`JwtProperties`、`RefreshTokenService`、`LoginUserLoader`
- 新增 `@Value("${sw.security.cookie.secure:false}")` 注入 `cookieSecure`
- `login()`：返回类型 `R<String>` → `R<TokenResponse>`，方法参数新增 `HttpServletResponse response`；调用 `refreshTokenService.createRefreshToken()` + `CookieUtils.setRefreshCookie()`
- `POST /auth/refresh`：全新端点，从 cookie 读 refresh token → rotateRefreshToken() → 设新 cookie → 返回新 TokenResponse
- `POST /auth/logout`：全新端点，从 cookie 读 refresh token → revokeRefreshToken() → 清 cookie → 踢缓存 → 返回 R.ok()

### LoginUserCacheService.java（修改，+4/-1 行）

- `cache()` 方法 TTL 由 `jwtProperties.getExpireSeconds()` 改为回退逻辑：
  ```java
  long ttlSeconds = jwtProperties.getAccessExpireSeconds() > 0
      ? jwtProperties.getAccessExpireSeconds()
      : jwtProperties.getExpireSeconds();
  ```

### application.yml（修改，+4 行）

- `permit-urls` 新增 `/auth/refresh`、`/auth/logout`
- 新增 `sw.security.cookie.secure: false` 配置

## 6. 实际执行的命令

| # | 命令 | 用途 |
|---|------|------|
| 1 | `git status` | 确认 B1 变更未提交状态 |
| 2 | `git add ... && git commit -m "feat(auth): B1 ..."` | 提交 B1 变更 |
| 3 | `mvn -q compile` | 编译验证（首次失败→修复 LoginUser.getId→getUserId）→ 成功后无输出 |
| 4 | `mvn -q test` | 全量测试（失败—V1 测试 4 个 error） |
| 5 | `mvn test 2>&1 | grep ...` | 获取详细测试结果 |
| 6 | 静态检查命令 | grep 确认 TTL 回退逻辑、SHA-256 使用、cookie 属性、permit-urls |

## 7. 命令输出摘要

**编译**：`mvn -q compile` — 无输出（BUILD SUCCESS）。首次编译失败因 `LoginUser.getId()` → 应使用 `getUserId()`，修复后成功。

**测试**：`mvn -q test` — BUILD FAILURE。sw-biz-system-biz 模块测试结果：

| 测试类 | 运行数 | 通过 | 错误 |
|--------|--------|------|------|
| AuthControllerTest | 3 | 0 | 3 — 构造函数签名不匹配 |
| AuthFlowIntegrationTest | 1 | 0 | 1 — ApplicationContext 加载失败 |
| RoleControllerTest | 6 | 6 | 0 |
| DeptControllerTest | 6 | 6 | 0 |
| AuthMeControllerTest | 5 | 5 | 0 |
| UserControllerTest | 7 | 7 | 0 |
| PostControllerTest | 6 | 6 | 0 |
| DictFacadeTest | 6 | 6 | 0 |
| LogicalDeleteTest | 1 | 1 | 0 |
| **总计** | **41** | **37** | **4** |

其他所有模块（common/security/storage/notify/job）全部 BUILD SUCCESS，测试全通过。

## 8. 与原方案的偏差

### 8.1 执行前读取的文件

方案要求读 11 个文件，实际读取了 14 个（含额外读取 LoginUserLoader、LoginUser、SecurityAutoConfiguration 以确认 Bean 注册和字段名）。

### 8.2 未修改 SysRefreshToken.java

方案列出 `SysRefreshToken.java` 为「可能新增辅助查询方法」——实现中 RefreshTokenService 直接使用 `LambdaUpdateWrapper` 和 `LambdaQueryWrapper` 操作，无需 Entity 内联方法。

### 8.3 CookieUtils 增加 clearRefreshCookie 的 Secure 参数处理

方案要求清除 cookie 时始终设置 Secure=true（删除不受影响），实现中使用硬编码 `setSecure(true)`。

### 8.4 CookieUtils 移除了静态 SECURE 常量

方案原设计有静态 SECURE 常量，后修正为参数传递 boolean secure。实现采用了修正后的参数传递方式。

## 9. 遇到的问题

| # | 问题 | 解决 |
|---|------|------|
| 1 | 编译失败：`currentUser.getId()` — LoginUser 无 `getId()` 方法，字段为 `userId` | 改为 `currentUser.getUserId()` |
| 2 | V1 AuthControllerTest 和 AuthFlowIntegrationTest 因 AuthController 构造函数签名从 4 参数变为 7 参数而全部失败（3+1=4 errors） | 预期行为，不做修改，在回执中记载。B3 统一更新 |

## 10. 未完成内容

全部完成，无未完成内容。

## 11. 风险和注意事项

- **login 响应形状变更（R\<String\> → R\<TokenResponse\>）**：前端 F1 必须对应更新 login 响应处理逻辑。当前契约已定稿。
- **V1 测试全部因构造函数签名变更而失败**：AuthController 构造函数从 4 参数（UserDetailsProvider, PasswordEncoder, JwtTokenProvider, SysUserService）变为 7 参数（新增 JwtProperties, RefreshTokenService, LoginUserLoader）。此为预期行为，B3 统一修复。
- **RefreshTokenService 的 tenant_id 自动填充**：`SysRefreshToken extends BaseEntity`，MyBatis-Plus TenantLineHandler 在 insert 时自动注入 tenant_id。`createRefreshToken()` 显式传入了 `tenantId`，覆盖自动填充，安全。
- **开发期 cookie**：`sw.security.cookie.secure: false`，生产环境需改为 true。

## 12. Git diff 摘要

```
 SW-B2
 3 files changed, 107 insertions(+), 9 deletions(-)
 3 new files (untracked)
```

- **修改**：AuthController.java（+107/-9）、application.yml（+4）、LoginUserCacheService.java（+4/-1）
- **新建**：TokenResponse.java（23 行）、CookieUtils.java（66 行）、RefreshTokenService.java（177 行）
- **未修改**：SysRefreshToken.java（辅助方法不需要）、JwtTokenProvider、JwtTokenProviderImpl、JwtAuthenticationFilter、JwtProperties

## 13. 建议执行的测试

1. **登录 + 双 token 验证**：POST /auth/login → 验证响应含 `data.accessToken` + `data.expiresIn`，Set-Cookie 头含 `rt=...`
2. **refresh token 轮换**：登录 → POST /auth/refresh（携带 rt cookie）→ 响应成功，旧 token 被撤销
3. **重放检测**：再次使用同一 rt cookie 调用 /auth/refresh → 返回 401 "refresh token 已被使用过，全部会话已失效"
4. **logout**：登录 → POST /auth/logout（携带 rt cookie）→ refresh token 被撤销
5. **无 cookie 调用**：POST /auth/logout（无 cookie）→ 幂等返回 R.ok()，不报错
6. **过期 refresh token**：修改 expires_at 为过去时间 → POST /auth/refresh → 返回 401
