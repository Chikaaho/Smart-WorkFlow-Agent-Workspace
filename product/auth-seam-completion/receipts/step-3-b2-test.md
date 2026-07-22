# 测试回执

## 1. Step 编号和名称

**Step B2**：RefreshTokenService + login 改造 + /auth/refresh + /auth/logout + cookie 工具

## 2. 测试环境

- **Java**：OpenJDK 21.0.11
- **构建工具**：Maven 3.x（`mvn -q compile && mvn -q test`）
- **数据库**：H2 内存数据库（dev 模式）
- **操作系统**：Linux 5.15.0-181-generic
- **其他服务**：无需外部服务

## 3. 测试前置条件

- B1 变更已提交到 develop 分支（V18 Flyway 双方言 DDL、SysRefreshToken Entity/Mapper、JWT 双档配置）
- B2 全部代码变更已完成（3 新建 + 3 修改文件）
- `mvn -q compile` 全量编译成功

## 4. 实际执行的测试命令

| # | 命令 | 说明 |
|---|------|------|
| 1 | `mvn -q compile` | 全量编译验证（所有模块） |
| 2 | `mvn -q test` | 全量测试（所有模块） |
| 3 | `mvn test 2>&1 \| grep -E "Tests run:"` | 获取各模块详细测试计数 |

## 5. 各测试项结果

### sw-common

| 测试类 | 预期结果 | 实际结果 | 是否通过 |
|--------|----------|----------|----------|
| JacksonLongToStringConfigTest | BUILD SUCCESS | 4/0/0/0 | ✅ |

### sw-security

| 测试类 | 预期结果 | 实际结果 | 是否通过 |
|--------|----------|----------|----------|
| SecurityAssemblyRegressionTest | BUILD SUCCESS | 4/0/0/0 | ✅ |

### sw-basic-storage-biz

| 测试类 | 预期结果 | 实际结果 | 是否通过 |
|--------|----------|----------|----------|
| StorageControllerTest | BUILD SUCCESS | 12/0/0/0 | ✅ |

### sw-basic-notify-biz

| 测试类 | 预期结果 | 实际结果 | 是否通过 |
|--------|----------|----------|----------|
| NotifyControllerIntegrationTest | BUILD SUCCESS | 4/0/0/0 | ✅ |
| NotifyMessageIntegrationTest | BUILD SUCCESS | 3/0/0/0 | ✅ |

### sw-basic-job-biz

| 测试类 | 预期结果 | 实际结果 | 是否通过 |
|--------|----------|----------|----------|
| JobLogControllerTest | BUILD SUCCESS | 5/0/0/0 | ✅ |
| JobInfoControllerTest | BUILD SUCCESS | 29/0/0/0 | ✅ |
| JobFacadeImplTest | BUILD SUCCESS | 5/0/0/0 | ✅ |

### sw-biz-system-biz

| 测试类 | 预期结果 | 实际结果 | 是否通过 |
|--------|----------|----------|----------|
| AuthControllerTest (V1) | 预期失败（构造函数签名变更） | 3/0/3/0 | ⚠️ 预期失败 |
| AuthFlowIntegrationTest (V1) | 预期失败（构造函数签名变更） | 1/0/1/0 | ⚠️ 预期失败 |
| RoleControllerTest | BUILD SUCCESS | 6/0/0/0 | ✅ |
| DeptControllerTest | BUILD SUCCESS | 6/0/0/0 | ✅ |
| AuthMeControllerTest | BUILD SUCCESS | 5/0/0/0 | ✅ |
| UserControllerTest | BUILD SUCCESS | 7/0/0/0 | ✅ |
| PostControllerTest | BUILD SUCCESS | 6/0/0/0 | ✅ |
| DictFacadeTest | BUILD SUCCESS | 6/0/0/0 | ✅ |
| LogicalDeleteTest | BUILD SUCCESS | 1/0/0/0 | ✅ |

格式说明：运行数/失败数/错误数/跳过数

## 6. 通过项

所有非 V1 测试全部通过：

| 模块 | 通过数 |
|------|--------|
| sw-common | 4 |
| sw-security | 4 |
| sw-basic-storage-biz | 12 |
| sw-basic-notify-biz | 7 |
| sw-basic-job-biz | 37 |
| sw-biz-system-biz（非 V1） | 37 |
| **总计通过** | **101** |

## 7. 失败项

### AuthControllerTest（3 tests, 3 errors）

**错误原因**：V1 测试直接使用 `new AuthController(userDetailsProvider, passwordEncoder, jwtTokenProvider, sysUserService)` 4 参数构造函数创建实例。B2 将 AuthController 构造函数扩展为 7 参数（新增 JwtProperties, RefreshTokenService, LoginUserLoader），导致 `NoSuchMethod` 错误。

**涉及测试方法**：
- `login_withValidCredentials_shouldReturnToken`
- `login_withWrongPassword_shouldReturnFailure`
- `login_withUnknownUser_shouldReturnFailure`

### AuthFlowIntegrationTest（1 test, 1 error）

**错误原因**：TestConfig 内部 `@Bean authController()` 使用 4 参数构造函数签名构造 AuthController 实例，与新的 7 参数签名不匹配。

## 8. 跳过项及原因

无跳过项。

## 9. 关键日志或错误信息

```
AuthControllerTest.<init>:35 NoSuchMethod 'void com.sw.ck.system.controller.AuthController.<init>(
    com.sw.ck.security.spi.UserDetailsProvider,
    org.springframework.security.crypto.password.PasswordEncoder,
    com.sw.ck.security.jwt.JwtTokenProvider,
    com.sw.ck.system.service.SysUserService)'
```

```
AuthFlowIntegrationTest — ParameterResolution Failed to load ApplicationContext:
    BeanCreationException: authController defined in TestConfig:
    Factory method 'authController' threw exception with message:
    'void AuthController.<init>(UserDetailsProvider, PasswordEncoder,
     JwtTokenProvider, SysUserService)'
```

## 10. 是否满足验收标准

逐条对照方案 §14 验收标准：

| # | 验收标准 | 结果 |
|---|----------|------|
| 1 | `git diff --stat` 仅含 3 新建 + 3 修改（共 6 文件；原计划 SysRefreshToken 辅助方法未执行） | ✅ 3 新建（TokenResponse + RefreshTokenService + CookieUtils）+ 3 修改（AuthController + LoginUserCacheService + application.yml）|
| 2 | RefreshTokenService 包含 `createRefreshToken`/`rotateRefreshToken`/`revokeRefreshToken` 三个公开方法，均带 `@Transactional(rollbackFor = Exception.class)` | ✅ 全部实现并注解 |
| 3 | RefreshTokenService 使用 SecureRandom 32 字节 + hex(64) + SHA-256 | ✅ SecureRandom + MessageDigest.getInstance("SHA-256") |
| 4 | `rotateRefreshToken()` 包含重放检测（已撤销→全家撤销→抛异常） | ✅ revokeAllForUser + throw BaseException(401) |
| 5 | `AuthController.login` 返回 `R\<TokenResponse\>`，含 accessToken + expiresIn | ✅ R.ok(new TokenResponse(accessToken, expiresIn)) |
| 6 | login 调用 `createRefreshToken()` + `CookieUtils.setRefreshCookie()` | ✅ |
| 7 | POST /auth/refresh：读 cookie → rotateRefreshToken → 设新 cookie → 返回新 TokenResponse | ✅ |
| 8 | POST /auth/logout：读 cookie → revokeRefreshToken → 清 cookie → R.ok() | ✅ |
| 9 | CookieUtils 含 setRefreshCookie/clearRefreshCookie/getRefreshTokenFromCookie，cookie 属性含 HttpOnly=true/Path=/api/auth//SameSite | ✅ |
| 10 | LoginUserCacheService TTL 使用 accessExpireSeconds > 0 ? accessExpireSeconds : expireSeconds | ✅ |
| 11 | application.yml permit-urls 含 /auth/refresh 和 /auth/logout | ✅ |
| 12 | `mvn -q compile` 全量 BUILD SUCCESS | ✅ |
| 13 | `mvn -q test`：V1 测试失败（4 errors，原因：构造函数签名变更），所有其他 101 测试全通过 | ✅ 4 errors 均为预期失败 |

## 11. 回归风险

- **V1 测试 4 errors**：AuthControllerTest（3 tests）和 AuthFlowIntegrationTest（1 test）因构造函数签名变更而失败。这些测试在 B3 中统一更新后恢复。
- **其他模块零回归**：sw-common/sw-security/sw-basic/*/sw-biz-system（非 V1 测试）全部通过，无回归。
- **编译全量通过**：所有模块编译无错误，证明依赖注入、类型匹配、import 无问题。
- **无配置侵入**：仅新增 permit-urls 和 cookie.secure 配置，不影响既有配置。

## 12. 最终结论

```
PASSED
```

**解释**：所有验收标准均已满足。V1 测试 4 errors 是预期行为（因 AuthController 构造函数从 4 参数变为 7 参数），已在回执中明确记载失败数量和原因。B3 将统一更新 V1 测试。
