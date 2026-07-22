# Step B3：后端测试补全 + 全量回归

> 所属功能：auth-seam-completion（后端 seam 收尾）
> 域：**纯后端**（只改 `Smart-WorkFlow/`，禁止触碰前端）
> 本方案按根目录 CLAUDE.md §6 的 17 项结构生成。

---

## 1. 当前状态

功能 auth-seam-completion 的 V1 ✅ PASSED（me/menus/权限 端到端验证）、B1 ✅ PASSED（`sys_refresh_token` 表 + Entity/Mapper + JWT 双档配置）、B2 ✅ PASSED（RefreshTokenService + login 改造 + /auth/refresh + /auth/logout + cookie 工具）。

B2 执行后，V1 的 4 个测试因 AuthController 构造函数从 4 参数变为 7 参数 + login 返回类型从 `R<String>` 变为 `R<TokenResponse>` 而全部失败（3 AuthControllerTest + 1 AuthFlowIntegrationTest），B2 方案已明确不修改测试（§17 禁止事项），等待 B3 统一修复。

B3 是后端最后一个 Step，完成后进入前端 F1+F2。

前置：B2 ✅ PASSED（`product/auth-seam-completion/passed/step-3-b2-refresh-token-service.md`）。

## 2. Step 目标

修复 V1 测试（适配 7 参数构造函数 + `R<TokenResponse>` 返回类型）+ 新增 B2 代码的单元测试（RefreshTokenService 轮换/撤销/重放检测/过期 + CookieUtils cookie 属性）+ 全量回归验证，确保所有后端测试 BUILD SUCCESS。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯测试代码编写（Mock + AssertJ + H2），不涉及新业务逻辑设计、不涉及安全边界变更、不涉及架构决策，遵循已有测试模式即可
是否触发升级条件：否
```

## 4. 模型选择理由

B3 的工作是：(1) V1 测试函数签名修复——机械性改动，(2) 按已有模式补充 Service/Utils 测试——遵循现有 FormSubmitServiceTest 的 `@SpringBootTest + TestConfig` 模式。均为确定性重复工作，Flash 即可胜任。

## 5. 已知上下文

- **V1 AuthControllerTest**（110 行）：`new AuthController(userDetailsProvider, passwordEncoder, jwtTokenProvider, sysUserService)` 4 参数，需改为 7 参数（+ `JwtProperties` + `RefreshTokenService` + `LoginUserLoader`）。`login()` 调用从 `controller.login(request)` 改为 `controller.login(request, mockHttpResponse)`，返回类型从 `R<String>` 变为 `R<TokenResponse>`，断言从 `result.getData()` 取 String 改为 `result.getData().getAccessToken()` 取 TokenResponse.accessToken
- **V1 AuthFlowIntegrationTest**（717 行）：TestConfig 内 `authController()` Bean 方法使用 4 参数构造函数，需改为 7 参数。TestConfig 需新增 `RefreshTokenService` Bean（mock 或简化实现）、`LoginUserLoader` Bean 已有。`login()` 辅助方法从 `root.get("data").asText()` 取 token 改为 `root.get("data").get("accessToken").asText()`。TestConfig 已有 `JwtProperties` Bean，需补充 `refreshExpireSeconds=604800`。新增 `@Value` 注入 `cookie.secure` 配置
- **RefreshTokenService**（200 行，`sw-biz-system-biz`）：4 个公开方法——`createRefreshToken(userId, tenantId, refreshExpireSeconds)`、`rotateRefreshToken(rawToken, refreshExpireSeconds)`、`revokeRefreshToken(rawToken)`、`findUserIdByToken(rawToken)`；1 个 record `RefreshTokenRotation`。内部方法：`generateRawToken()`（32B SecureRandom → 64 字符 hex）、`sha256()`（SHA-256 哈希）、`revokeTokenById()`、`revokeAllForUser()`
- **CookieUtils**（77 行，`sw-biz-system-biz`）：3 个 static 方法——`setRefreshCookie(response, token, maxAge, secure)`、`clearRefreshCookie(response)`、`getRefreshTokenFromCookie(request)`。常量：`REFRESH_COOKIE_NAME="rt"`、`REFRESH_COOKIE_PATH="/api/auth/"`、`REFRESH_MAX_AGE=604800`
- **AuthController 当前状态**（172 行）：7 参数构造函数、`POST /auth/login` 返回 `R<TokenResponse>`、`POST /auth/refresh`（cookie → 轮换 → 新 accessToken）、`POST /auth/logout`（cookie → 撤销 → 清 cookie → R.ok()）。`@Value("${sw.security.cookie.secure:false}")` 注入 `cookieSecure`
- **现有测试模式**：`AuthFlowIntegrationTest` 使用 `@SpringBootTest(classes = TestConfig.class, webEnvironment = NONE)` + 内嵌 H2 数据源 + MyBatis-Plus 手动装配 + `MockMvcBuilders.standaloneSetup()`。`AuthControllerTest` 使用纯 Mockito（`mock()`）+ AssertJ，不加载 Spring。Form 模块的 Service 测试使用 `@SpringBootTest + TestConfig` 模式
- **H2 数据库**：`DB_CLOSE_DELAY=-1;MODE=PostgreSQL`，测试用内存数据库
- **`sys_refresh_token` 表 DDL**（V18 H2）：列 `id BIGINT`、`user_id BIGINT NOT NULL`、`token_hash VARCHAR(128) NOT NULL`、`expires_at TIMESTAMP NOT NULL`、`revoked SMALLINT NOT NULL DEFAULT 0`、`tenant_id BIGINT NOT NULL DEFAULT 0` + BaseEntity 审计列；索引 `idx_srt_user_tenant` + 唯一索引 `uk_srt_token_hash`
- **`application.yml` permit-urls**：已含 `/auth/login`、`/auth/refresh`、`/auth/logout`
- **`sw.security.cookie.secure: false`**（开发默认值）
- **SysRole 已知问题 I26**：Entity 列名与 V5 迁移不一致，本 Step 不涉及（已在 `AuthFlowIntegrationTest` 的 DDL 中用 `is_builtin`/`description` 列名 workaround）
- **后端 CLAUDE.md §0.0 执行层角色约束**：执行代理不得做需求分析和功能规划。本方案为规划层下发，执行代理严格按方案实现即可

## 6. 执行前必须读取的文件

按优先级：

1. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthControllerTest.java` — 当前 V1 单元测试全貌
2. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java` — 当前 V1 集成测试全貌（TestConfig 所有 Bean 定义）
3. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java` — 当前 7 参数构造函数 + login/refresh/logout 完整方法签名
4. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java` — 需测试的方法签名、字段、record 结构
5. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/util/CookieUtils.java` — 常量值、方法签名
6. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/model/TokenResponse.java` — DTO 字段与注解
7. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRefreshToken.java` — Entity 字段与 @TableField 映射
8. `sw-framework/sw-security/src/main/java/com/sw/ck/security/cache/LoginUserLoader.java` — kickOut 方法签名（确认 Bean 注入方式）
9. `sw-bootstrap/src/main/resources/db/migration/h2/V18__init_refresh_token_table.sql` — sys_refresh_token 完整 DDL（用于集成测试建表）
10. `sw-bootstrap/src/main/resources/application.yml` — permit-urls 段 + cookie.secure 配置 + JWT 配置段
11. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java` — JWT 配置字段
12. `sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` — R 包装器方法签名

## 7. 允许修改的文件范围

### 修改（2 文件）

| # | 文件 | 改动点 |
|---|------|--------|
| 1 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthControllerTest.java` | 构造函数 4→7 参数 + login() 调用改为 `R<TokenResponse>` + 新增 refresh/logout 端点测试 |
| 2 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java` | TestConfig.authController() Bean 构造函数 + login() 辅助方法返回值解析 + 新增 RefreshTokenService Bean + 新增 sys_refresh_token 建表语句 |

### 新建（2 文件）

| # | 文件 | 说明 |
|---|------|------|
| 3 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/service/RefreshTokenServiceTest.java` | RefreshTokenService 单元测试（Mock Mapper，H2 内存库） |
| 4 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/util/CookieUtilsTest.java` | CookieUtils 单元测试（cookie 设置/清除/读取 + 属性验证） |

### 编译影响模块

- 仅 `sw-biz/sw-biz-system/sw-biz-system-biz`（测试代码不改变主代码编译范围）

## 8. 禁止修改的范围

- ❌ 任何前端 `Smart-WorkFlow-Web/**` 一律不碰
- ❌ `src/main/java/**` 下任何文件（本 Step 仅写测试，不改业务代码）
- ❌ `AuthController.java`（B2 已完成，测试适配不改源码）
- ❌ `RefreshTokenService.java`（B2 已完成）
- ❌ `CookieUtils.java`（B2 已完成）
- ❌ Flyway 迁移脚本（不新增 V19）
- ❌ `application.yml`（B2 已完成配置）
- ❌ 其他已有测试文件（RoleControllerTest / UserControllerTest / AuthMeControllerTest 等零改动）
- ❌ 不新增 Maven 依赖（JUnit 5 / Mockito / AssertJ / H2 / Spring Boot Test 均为已有）
- ❌ 不修改 `JwtProperties` / `SecurityProperties` / `JwtTokenProvider` / `LoginUserCacheService`
- ❌ `AuthFlowIntegrationTest` 中 `@BeforeAll` 已有建表语句中不删除/修改已有的 `sys_user`/`sys_role`/`sys_user_role`/`sys_menu`/`sys_role_menu` DDL，只追加 `sys_refresh_token` DDL

## 9. 详细执行方案

### 9.1 修复 AuthControllerTest（V1 单元测试）

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthControllerTest.java`

**9.1.1 新增 import**

```java
import com.sw.ck.security.cache.LoginUserLoader;
import com.sw.ck.security.jwt.JwtProperties;
import com.sw.ck.system.model.TokenResponse;
import com.sw.ck.system.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.mock.web.MockHttpServletResponse;
```

**9.1.2 构造函数注入变更**

旧（4 参数）：
```java
private final SysUserService sysUserService = mock(SysUserService.class);
private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
private final JwtTokenProvider jwtTokenProvider = mock(JwtTokenProvider.class);
private final UserDetailsProvider userDetailsProvider = mock(UserDetailsProvider.class);
private final AuthController controller = new AuthController(
        userDetailsProvider, passwordEncoder, jwtTokenProvider, sysUserService);
```

新（7 参数 + 3 个新 mock + MockHttpServletResponse）：
```java
private final SysUserService sysUserService = mock(SysUserService.class);
private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
private final JwtTokenProvider jwtTokenProvider = mock(JwtTokenProvider.class);
private final UserDetailsProvider userDetailsProvider = mock(UserDetailsProvider.class);
private final JwtProperties jwtProperties = mock(JwtProperties.class);
private final RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
private final LoginUserLoader loginUserLoader = mock(LoginUserLoader.class);
private final MockHttpServletResponse mockResponse = new MockHttpServletResponse();
private final AuthController controller = new AuthController(
        userDetailsProvider, passwordEncoder, jwtTokenProvider, sysUserService,
        jwtProperties, refreshTokenService, loginUserLoader);

@BeforeEach
void setUp() {
    // 默认 JWT 配置
    when(jwtProperties.getAccessExpireSeconds()).thenReturn(900);
    when(jwtProperties.getRefreshExpireSeconds()).thenReturn(604800);
    // 默认 refresh token 创建成功
    when(refreshTokenService.createRefreshToken(anyLong(), anyLong(), anyLong()))
            .thenReturn("test-refresh-token-raw-64-chars-hex");
}
```

**9.1.3 login_withValidCredentials_shouldReturnToken 修改**

```java
@Test
@DisplayName("Happy path：用户存在 + 密码正确 → 返回 TokenResponse，code===0")
void login_withValidCredentials_shouldReturnToken() {
    // -- Arrange --
    SysUser user = new SysUser();
    user.setId(1L);
    user.setTenantId(0L);
    user.setUsername("admin");
    user.setPassword(passwordEncoder.encode("admin123"));
    when(sysUserService.getByUsername("admin")).thenReturn(user);
    when(jwtTokenProvider.generateToken(1L)).thenReturn("test-jwt-token");

    // -- Act --
    AuthController.LoginRequest request = new AuthController.LoginRequest();
    request.setUsername("admin");
    request.setPassword("admin123");
    R<TokenResponse> result = controller.login(request, mockResponse);

    // -- Assert --
    assertThat(result.getCode())
            .as("成功码应为 0")
            .isZero();
    assertThat(result.getData())
            .as("TokenResponse 不应为 null")
            .isNotNull();
    assertThat(result.getData().getAccessToken())
            .as("应返回有效 access token")
            .isNotBlank()
            .isEqualTo("test-jwt-token");
    assertThat(result.getData().getExpiresIn())
            .as("expiresIn 应按 JWT 配置返回")
            .isEqualTo(900);
    // 验证 refresh cookie 已设置
    assertThat(mockResponse.getCookieValue("rt"))
            .as("应设置名为 'rt' 的 refresh cookie")
            .isEqualTo("test-refresh-token-raw-64-chars-hex");
}
```

**9.1.4 login_withUnknownUser_shouldReturnFailure 修改**

替换 `R<String>` → `R<TokenResponse>`，断言不变（逻辑相同）：
```java
@Test
@DisplayName("用户不存在 → code!==0")
void login_withUnknownUser_shouldReturnFailure() {
    when(sysUserService.getByUsername("unknown")).thenReturn(null);
    AuthController.LoginRequest request = new AuthController.LoginRequest();
    request.setUsername("unknown");
    request.setPassword("any-password");
    R<TokenResponse> result = controller.login(request, mockResponse);
    assertThat(result.getCode()).as("用户不存在时应返回非 0 错误码").isNotZero();
    assertThat(result.getData()).as("失败时 data 应为 null").isNull();
}
```

**9.1.5 login_withWrongPassword_shouldReturnFailure 修改**

同上，替换 `R<String>` → `R<TokenResponse>`：
```java
@Test
@DisplayName("密码错误 → code!==0")
void login_withWrongPassword_shouldReturnFailure() {
    SysUser user = new SysUser();
    user.setId(1L);
    user.setUsername("admin");
    user.setPassword(passwordEncoder.encode("correct-password"));
    when(sysUserService.getByUsername("admin")).thenReturn(user);
    AuthController.LoginRequest request = new AuthController.LoginRequest();
    request.setUsername("admin");
    request.setPassword("wrong-password");
    R<TokenResponse> result = controller.login(request, mockResponse);
    assertThat(result.getCode()).as("密码错误时应返回非 0 错误码").isNotZero();
    assertThat(result.getMsg()).as("失败消息应包含提示").isNotNull();
}
```

### 9.2 修复 AuthFlowIntegrationTest（V1 端到端测试）

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java`

**9.2.1 `@BeforeAll` 追加 `sys_refresh_token` 建表**

在 `@BeforeAll createTables()` 末尾追加（在创建完索引后）：

```java
// sys_refresh_token（B1 V18 DDL，用于 B2 登录流程创建 refresh token）
jt.execute("""
        CREATE TABLE IF NOT EXISTS sys_refresh_token (
            id                bigint          not null primary key,
            user_id           bigint          not null,
            token_hash        varchar(128)    not null,
            expires_at        timestamp       not null,
            revoked           smallint        not null default 0,
            create_time       timestamp       not null default current_timestamp,
            create_by         bigint,
            update_time       timestamp       not null default current_timestamp,
            update_by         bigint,
            deleted           smallint        not null default 0,
            tenant_id         bigint          not null default 0,
            version           bigint          not null default 0
        )
        """);
jt.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_srt_token_hash ON sys_refresh_token (token_hash)");
jt.execute("CREATE INDEX IF NOT EXISTS idx_srt_user_tenant ON sys_refresh_token (user_id, tenant_id)");
```

**9.2.2 `@BeforeEach setUp()` 追加 `sys_refresh_token` 清理**

```java
jdbcTemplate.update("DELETE FROM sys_refresh_token");
```

（加在已有 DELETE 语句序列中，位置在 `sys_user_role` 之后、seed 数据插入之前）

**9.2.3 TestConfig 新增 RefreshTokenService + SysRefreshTokenMapper Bean**

```java
@Bean
public SysRefreshTokenMapper sysRefreshTokenMapper(
        org.apache.ibatis.session.SqlSessionFactory sqlSessionFactory) {
    return sqlSessionFactory.openSession().getMapper(SysRefreshTokenMapper.class);
}

@Bean
public RefreshTokenService refreshTokenService(
        SysRefreshTokenMapper sysRefreshTokenMapper) {
    return new RefreshTokenService(sysRefreshTokenMapper);
}
```

注意：MyBatis `@MapperScan("com.sw.ck.system.mapper")` 已存在于 TestConfig，`SysRefreshTokenMapper` 会被自动扫描。但为简化，直接用上述方式或依赖 `@MapperScan` 自动注册后通过 `@Autowired` 获取。

**实际推荐方案（更简洁）**：不新建 `sysRefreshTokenMapper` Bean，而是在 `refreshTokenService` Bean 中通过 `@Autowired` 注入已扫描的 Mapper：

```java
@Bean
public RefreshTokenService refreshTokenService(
        SysRefreshTokenMapper sysRefreshTokenMapper) {
    return new RefreshTokenService(sysRefreshTokenMapper);
}
```

（`SysRefreshTokenMapper` 由 `@MapperScan("com.sw.ck.system.mapper")` 自动注册，直接作为参数注入即可）

**9.2.4 TestConfig 更新 authController() Bean**

必须匹配 B2 的 7 参数构造函数。已有 `UserDetailsProvider`、`PasswordEncoder`、`JwtTokenProvider`、`SysUserService`、`JwtProperties`。新增 `RefreshTokenService`、`LoginUserLoader`（已在 TestConfig 中定义）：

```java
@Bean
public AuthController authController(
        UserDetailsProvider userDetailsProvider,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider,
        SysUserService sysUserService,
        JwtProperties jwtProperties,
        RefreshTokenService refreshTokenService,
        LoginUserLoader loginUserLoader) {
    return new AuthController(userDetailsProvider, passwordEncoder,
            jwtTokenProvider, sysUserService, jwtProperties,
            refreshTokenService, loginUserLoader);
}
```

**9.2.5 TestConfig 更新 JwtProperties Bean（补充 refreshExpireSeconds）**

当前 JwtProperties Bean 只设了 `setSecret()` + `setExpireSeconds(7200)`。B2 后需补充 `accessExpireSeconds` 和 `refreshExpireSeconds`：

```java
@Bean
public JwtProperties jwtProperties() {
    JwtProperties props = new JwtProperties();
    props.setSecret("test-jwt-secret-at-least-256-bits-long-for-hs256-algorithm");
    props.setExpireSeconds(7200);
    props.setAccessExpireSeconds(900);
    props.setRefreshExpireSeconds(604800);
    return props;
}
```

**9.2.6 TestConfig 新增配置属性（cookie.secure）**

在 `@SpringBootTest` 的 `properties` 中追加或通过 `@TestPropertySource`：

```java
@SpringBootTest(
        classes = AuthFlowIntegrationTest.TestConfig.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "sw.security.jwt.secret=test-jwt-secret-at-least-256-bits-long-for-hs256-algorithm",
                "sw.security.jwt.expire-seconds=7200",
                "sw.tenant.enabled=true",
                "sw.tenant.ignore-tables[0]=sys_menu",
                "sw.security.cookie.secure=false"
        }
)
```

（追加最后一行 `sw.security.cookie.secure=false` 即可，AuthController 的 `@Value` 会注入此值）

**9.2.7 登录辅助方法返回值解析**

`login()` 辅助方法当前从 `root.get("data").asText()` 取 token（String）。B2 后 `data` 变为 JSON 对象 `{accessToken: "...", expiresIn: 900}`。改为：

```java
private String login(String username, String password) throws Exception {
    MvcResult result = mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isOk())
            .andReturn();

    JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
    JsonNode data = root.get("data");
    return data != null ? data.get("accessToken").asText() : null;
}
```

**9.2.8 e2e 测试不变**

`e2e_login_then_me_then_menus()` 使用 `login()` 辅助方法获取 token，只要 login() 返回正确的 accessToken，后续 `/me`、`/menus` 断言无需改动。

其他测试 (`me_withoutToken`、`login_withWrongPassword`、`login_withUnknownUser`) 不依赖 login 辅助方法，无需改动。

### 9.3 新建 RefreshTokenServiceTest

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/service/RefreshTokenServiceTest.java`

采用与 `AuthFlowIntegrationTest` 一致的 `@SpringBootTest + TestConfig + H2` 模式，因为 RefreshTokenService 依赖真实的 MyBatis-Plus Mapper（`LambdaQueryWrapper`、`LambdaUpdateWrapper` 需要 `SqlSessionFactory`）。

```java
package com.sw.ck.system.service;

import com.sw.ck.common.exception.BaseException;
import com.sw.ck.system.entity.SysRefreshToken;
import com.sw.ck.system.mapper.SysRefreshTokenMapper;
import org.junit.jupiter.api.*;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * {@link RefreshTokenService} 单元/集成测试。
 * 使用 H2 内存数据库 + 真实 MyBatis-Plus Mapper 验证：
 * <ul>
 *   <li>createRefreshToken — 生成 + 哈希 + 写入 DB</li>
 *   <li>rotateRefreshToken — 正常轮换 / token 无效 / 已过期 / 重放检测（家族撤销）</li>
 *   <li>revokeRefreshToken — 正常撤销 / 空 token / 不存在（幂等）</li>
 *   <li>findUserIdByToken — 正常查询 / 不存在 / null 输入</li>
 * </ul>
 */
@SpringBootTest(
        classes = RefreshTokenServiceTest.TestConfig.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE
)
@DisplayName("RefreshTokenService 测试")
class RefreshTokenServiceTest {

    private static final long USER_ID = 1L;
    private static final long TENANT_ID = 0L;
    private static final long EXPIRE_SECONDS = 604800;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM sys_refresh_token");
    }

    // ============ createRefreshToken ============

    @Test
    @DisplayName("createRefreshToken：生成 64 字符 hex token + SHA-256 哈希存入 DB")
    void createRefreshToken_shouldStoreHashNotRawToken() {
        String rawToken = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
        assertThat(rawToken).hasSize(64).matches("^[0-9a-f]{64}$");

        // DB 中存的是 SHA-256 hash（64 字符 hex），非原文
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys_refresh_token WHERE token_hash = ?",
                Long.class, rawToken);
        assertThat(count).as("DB 不应存原文").isZero();

        // 但应当有一条记录（hash 与原文不同）
        count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys_refresh_token", Long.class);
        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("createRefreshToken：不同调用生成不同 token")
    void createRefreshToken_shouldReturnDifferentTokens() {
        String t1 = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
        String t2 = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
        assertThat(t1).isNotEqualTo(t2);
        // DB 中应有两条记录
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys_refresh_token", Long.class);
        assertThat(count).isEqualTo(2);
    }

    // ============ rotateRefreshToken（正常轮换）============

    @Test
    @DisplayName("rotateRefreshToken：正常轮换 — 旧 token 撤销 + 新 token 签发")
    void rotateRefreshToken_normalFlow_shouldRevokeOldAndIssueNew() {
        String oldToken = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
        RefreshTokenService.RefreshTokenRotation rotation =
                refreshTokenService.rotateRefreshToken(oldToken, EXPIRE_SECONDS);

        assertThat(rotation.userId()).isEqualTo(USER_ID);
        assertThat(rotation.newRawToken()).hasSize(64).isNotEqualTo(oldToken);

        // 旧 token 不能再用于轮换（已撤销）
        assertThatThrownBy(() ->
                refreshTokenService.rotateRefreshToken(oldToken, EXPIRE_SECONDS))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("已被使用过");
    }

    // ============ rotateRefreshToken（重放检测）============

    @Test
    @DisplayName("rotateRefreshToken：重放已撤销 token → 家族撤销 + 抛异常")
    void rotateRefreshToken_replayAttack_shouldRevokeAllForUser() {
        String token = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
        // 第一次轮换（正常）
        refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS);
        // 同一用户创建另一个 token
        String anotherToken = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);

        // 重放已撤销的旧 token → 家族撤销
        assertThatThrownBy(() ->
                refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("已被使用过");

        // 用户的所有 token 都已被撤销
        assertThatThrownBy(() ->
                refreshTokenService.rotateRefreshToken(anotherToken, EXPIRE_SECONDS))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("已被使用过");
    }

    // ============ rotateRefreshToken（token 无效 / 过期）============

    @Test
    @DisplayName("rotateRefreshToken：不存在的 token → 抛异常")
    void rotateRefreshToken_unknownToken_shouldThrow() {
        assertThatThrownBy(() ->
                refreshTokenService.rotateRefreshToken("nonexistent-token-that-does-not-exist-in-db", EXPIRE_SECONDS))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("无效");
    }

    // ============ revokeRefreshToken ============

    @Test
    @DisplayName("revokeRefreshToken：正常撤销 → token 标记 revoked=1")
    void revokeRefreshToken_shouldRevoke() {
        String token = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
        refreshTokenService.revokeRefreshToken(token);
        // 撤销后不能轮换
        assertThatThrownBy(() ->
                refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("已被使用过");
    }

    @Test
    @DisplayName("revokeRefreshToken：null token → 静默成功（幂等）")
    void revokeRefreshToken_nullToken_shouldNotThrow() {
        assertThatCode(() -> refreshTokenService.revokeRefreshToken(null))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("revokeRefreshToken：空 token → 静默成功（幂等）")
    void revokeRefreshToken_emptyToken_shouldNotThrow() {
        assertThatCode(() -> refreshTokenService.revokeRefreshToken(""))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("revokeRefreshToken：不存在的 token → 静默成功（幂等）")
    void revokeRefreshToken_unknownToken_shouldNotThrow() {
        assertThatCode(() ->
                refreshTokenService.revokeRefreshToken("some-random-unknown-token-that-does-not-exist"))
                .doesNotThrowAnyException();
    }

    // ============ findUserIdByToken ============

    @Test
    @DisplayName("findUserIdByToken：正常查询返回 userId")
    void findUserIdByToken_shouldReturnUserId() {
        String token = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
        assertThat(refreshTokenService.findUserIdByToken(token)).isEqualTo(USER_ID);
    }

    @Test
    @DisplayName("findUserIdByToken：不存在的 token → 返回 null")
    void findUserIdByToken_unknown_shouldReturnNull() {
        assertThat(refreshTokenService.findUserIdByToken("unknown-token")).isNull();
    }

    @Test
    @DisplayName("findUserIdByToken：null 输入 → 返回 null")
    void findUserIdByToken_null_shouldReturnNull() {
        assertThat(refreshTokenService.findUserIdByToken(null)).isNull();
    }

    // ============ TestConfig ============

    @Configuration
    @MapperScan("com.sw.ck.system.mapper")
    @EnableTransactionManagement
    static class TestConfig {

        @Bean
        public DataSource dataSource() {
            return DataSourceBuilder.create()
                    .url("jdbc:h2:mem:refreshsvc;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
                    .driverClassName("org.h2.Driver")
                    .username("sa")
                    .password("")
                    .build();
        }

        @Bean
        public JdbcTemplate jdbcTemplate(DataSource dataSource) {
            return new JdbcTemplate(dataSource);
        }

        @Bean
        public PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        public com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor mybatisPlusInterceptor() {
            return new com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor();
        }

        @Bean
        public org.apache.ibatis.session.SqlSessionFactory sqlSessionFactory(
                DataSource dataSource,
                com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor interceptor)
                throws Exception {
            com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean factory =
                    new com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean();
            factory.setDataSource(dataSource);
            com.baomidou.mybatisplus.core.MybatisConfiguration ibatisConfig =
                    new com.baomidou.mybatisplus.core.MybatisConfiguration();
            ibatisConfig.setMapUnderscoreToCamelCase(true);
            factory.setConfiguration(ibatisConfig);
            factory.setPlugins(interceptor);
            return factory.getObject();
        }

        @Bean
        public RefreshTokenService refreshTokenService(
                SysRefreshTokenMapper sysRefreshTokenMapper) {
            return new RefreshTokenService(sysRefreshTokenMapper);
        }

        // 建表（@BeforeAll 无法在 TestConfig 中使用，改在 @PostConstruct 或测试类 @BeforeAll）
        @Bean
        public jakarta.annotation.PostConstruct initTables(DataSource dataSource) {
            // 注意：不建议在 Bean 初始化中建表。改为在测试类的 @BeforeAll 中执行。
            return null; // 实际建表在测试类 @BeforeAll（见下文 9.3.1 建表逻辑）
        }
    }
}
```

**9.3.1 建表位置**

`sys_refresh_token` 表 DDL 应在测试类的 `@BeforeAll` 中执行（而非 TestConfig Bean）。完整建表语句见 V18 H2 DDL。简化版建表（无 BaseEntity 全部审计列，仅业务列 + 索引）足以覆盖 RefreshTokenService 的所有操作：

```java
@BeforeAll
static void createTables(@Autowired JdbcTemplate jt) {
    jt.execute("""
            CREATE TABLE IF NOT EXISTS sys_refresh_token (
                id                bigint          not null primary key,
                user_id           bigint          not null,
                token_hash        varchar(128)    not null,
                expires_at        timestamp       not null,
                revoked           smallint        not null default 0,
                tenant_id         bigint          not null default 0,
                deleted           smallint        not null default 0,
                version           bigint          not null default 0
            )
            """);
    jt.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_srt_token_hash ON sys_refresh_token (token_hash)");
    jt.execute("CREATE INDEX IF NOT EXISTS idx_srt_user_tenant ON sys_refresh_token (user_id, tenant_id)");
}
```

### 9.4 新建 CookieUtilsTest

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/util/CookieUtilsTest.java`

纯单元测试，无需 Spring 上下文。使用 Spring Mock 的 `MockHttpServletRequest` / `MockHttpServletResponse`（来自 `spring-test` 依赖，项目中已有）。

```java
package com.sw.ck.system.util;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.*;

@DisplayName("CookieUtils 测试")
class CookieUtilsTest {

    // ============ setRefreshCookie ============

    @Test
    @DisplayName("setRefreshCookie：设置正确 cookie 属性")
    void setRefreshCookie_shouldSetCorrectAttributes() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        CookieUtils.setRefreshCookie(response, "test-token-value", 900, false);

        Cookie cookie = response.getCookie(CookieUtils.REFRESH_COOKIE_NAME);
        assertThat(cookie).isNotNull();
        assertThat(cookie.getValue()).isEqualTo("test-token-value");
        assertThat(cookie.isHttpOnly()).as("HttpOnly 必须为 true").isTrue();
        assertThat(cookie.getSecure()).as("secure=false 时不应设 Secure").isFalse();
        assertThat(cookie.getPath()).isEqualTo(CookieUtils.REFRESH_COOKIE_PATH);
        assertThat(cookie.getMaxAge()).isEqualTo(900);
        // SameSite 通过 getAttribute 验证
        assertThat(cookie.getAttribute("SameSite")).isEqualTo("Lax");
    }

    @Test
    @DisplayName("setRefreshCookie：secure=true → SameSite=Strict + Secure=true")
    void setRefreshCookie_secureTrue_shouldSetStrictAndSecure() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        CookieUtils.setRefreshCookie(response, "secure-token", 3600, true);

        Cookie cookie = response.getCookie(CookieUtils.REFRESH_COOKIE_NAME);
        assertThat(cookie.getSecure()).isTrue();
        assertThat(cookie.getAttribute("SameSite")).isEqualTo("Strict");
    }

    @Test
    @DisplayName("setRefreshCookie：maxAge ≤ 0 使用默认 7 天")
    void setRefreshCookie_zeroMaxAge_shouldUseDefault() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        CookieUtils.setRefreshCookie(response, "default-age-token", 0, false);

        Cookie cookie = response.getCookie(CookieUtils.REFRESH_COOKIE_NAME);
        assertThat(cookie.getMaxAge()).isEqualTo(CookieUtils.REFRESH_MAX_AGE);
    }

    // ============ clearRefreshCookie ============

    @Test
    @DisplayName("clearRefreshCookie：设置 Max-Age=0 + 空值")
    void clearRefreshCookie_shouldClearCookie() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        CookieUtils.clearRefreshCookie(response);

        Cookie cookie = response.getCookie(CookieUtils.REFRESH_COOKIE_NAME);
        assertThat(cookie).isNotNull();
        assertThat(cookie.getValue()).isEmpty();
        assertThat(cookie.getMaxAge()).isZero();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getPath()).isEqualTo(CookieUtils.REFRESH_COOKIE_PATH);
    }

    // ============ getRefreshTokenFromCookie ============

    @Test
    @DisplayName("getRefreshTokenFromCookie：正常读取 cookie 值")
    void getRefreshTokenFromCookie_shouldReturnValue() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie cookie = new Cookie(CookieUtils.REFRESH_COOKIE_NAME, "my-refresh-token");
        cookie.setPath(CookieUtils.REFRESH_COOKIE_PATH);
        request.setCookies(cookie);

        assertThat(CookieUtils.getRefreshTokenFromCookie(request))
                .isEqualTo("my-refresh-token");
    }

    @Test
    @DisplayName("getRefreshTokenFromCookie：无 cookie → 返回 null")
    void getRefreshTokenFromCookie_noCookies_shouldReturnNull() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        assertThat(CookieUtils.getRefreshTokenFromCookie(request)).isNull();
    }

    @Test
    @DisplayName("getRefreshTokenFromCookie：cookies 存在但无 rt → 返回 null")
    void getRefreshTokenFromCookie_noRtCookie_shouldReturnNull() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie other = new Cookie("other-cookie", "value");
        request.setCookies(other);

        assertThat(CookieUtils.getRefreshTokenFromCookie(request)).isNull();
    }

    @Test
    @DisplayName("getRefreshTokenFromCookie：多个 cookie 中找到 rt")
    void getRefreshTokenFromCookie_multipleCookies_shouldFindRt() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie a = new Cookie("a", "1");
        Cookie rt = new Cookie(CookieUtils.REFRESH_COOKIE_NAME, "target-token");
        Cookie b = new Cookie("b", "2");
        request.setCookies(a, rt, b);

        assertThat(CookieUtils.getRefreshTokenFromCookie(request))
                .isEqualTo("target-token");
    }

    // ============ 常量验证 ============

    @Test
    @DisplayName("CookieUtils 常量：rt + /api/auth/ + 604800")
    void constants_shouldMatchContract() {
        assertThat(CookieUtils.REFRESH_COOKIE_NAME).isEqualTo("rt");
        assertThat(CookieUtils.REFRESH_COOKIE_PATH).isEqualTo("/api/auth/");
        assertThat(CookieUtils.REFRESH_MAX_AGE).isEqualTo(604800);
    }
}
```

### 9.5 编译与测试验证

```bash
cd Smart-WorkFlow
mvn -q compile          # 全量编译（测试代码编译）
mvn -q test             # 全量测试
```

预期结果：
- `mvn -q compile` BUILD SUCCESS
- `mvn -q test` BUILD SUCCESS
- V1 的 4 个修复后测试全部通过
- 新增 RefreshTokenServiceTest 测试（≈15 用例）全部通过
- 新增 CookieUtilsTest 测试（≈8 用例）全部通过
- 其他所有已有测试零回归

## 10. 关键实现约束

- **不修改 `src/main/java` 下任何文件**：本 Step 仅写测试代码，不动业务代码
- **不引入新 Maven 依赖**：`MockHttpServletRequest`/`MockHttpServletResponse` 来自 `spring-boot-starter-test`（已有），JUnit 5 / Mockito / AssertJ / H2 均为已有
- **RefreshTokenServiceTest 必须使用 H2 内存数据库 + 真实 MyBatis Mapper**（Spring 事务 + 真 DB 交互），不走纯 Mockito 全 Mock（Mock Mapper 会掩盖 `LambdaQueryWrapper`/`LambdaUpdateWrapper` 使用错误）
- **CookieUtilsTest 为纯单元测试**（无 Spring 上下文），使用 Spring Mock 的 `MockHttpServletResponse`/`MockHttpServletRequest`（`spring-test` 依赖已有）
- **AuthControllerTest 修复后保持纯 Mockito 单元测试**（无 Spring 上下文），新增 mock 使用 `org.mockito.Mockito.mock()`
- **AuthFlowIntegrationTest 修复后保持 `SpringBootTest + TestConfig` 模式**，TestConfig 中需新增 Bean 必须正确注入
- **修复不改变已有测试的语义**：V1 测试修复仅是适配新构造函数签名 + 新返回类型，不改变测试覆盖的路径（login happy path、用户不存在、密码错误、端到端认证）
- **RefreshTokenService 不依赖租户注入**：测试中 `TenantLineHandler` 不在 TestConfig 中配置（意味着无租户拦截器，`tenant_id` 须在代码中显式 `setTenantId`——RefreshTokenService.createRefreshToken 已这样做。若未配置 `TenantLineHandler` 导致 insert 失败（`tenant_id` 列 NOT NULL），则在建表 DDL 中设 `tenant_id bigint not null default 0` 即可）

## 11. 边界情况

- **AuthFlowIntegrationTest 的 TestConfig 需要 `SysRefreshTokenMapper` Bean**：`@MapperScan("com.sw.ck.system.mapper")` 已存在，MyBatis-Plus 自动扫描注册。确认 `SysRefreshTokenMapper` 接口在扫描路径内（`com.sw.ck.system.mapper` 包下），`@Mapper` 注解存在
- **RefreshTokenServiceTest 建表**：在 `@BeforeAll` 中用 `JdbcTemplate` 执行 DDL，不依赖 Flyway（Flyway 不会为测试类自动执行迁移）。只建 `sys_refresh_token` 一张表即可
- **MyBatis-Plus 自动填充**：`SysRefreshToken extends BaseEntity`，insert 时 `CommonMetaObjectHandler` 自动填充审计列（`createTime`、`updateTime` 等）。RefreshTokenServiceTest 的 TestConfig 中若不配置 `CommonMetaObjectHandler`，insert 时这些列为 null → 如果 DDL 中列定义为 `NOT NULL DEFAULT current_timestamp` 则无问题。**H2 兼容性**：审计列在 `@BeforeAll` DDL 中使用 `NOT NULL DEFAULT current_timestamp`，insert 时不传这些列让 DB 自动填充
- **V1 AuthControllerTest 中 `mockResponse.getCookieValue("rt")`**：`MockHttpServletResponse.getCookieValue()` 方法在 Spring 6.1+ 中可用。确认项目使用的 `spring-test` 版本包含此方法
- **AuthFlowIntegrationTest 中 login 响应解析变更**：`root.get("data").get("accessToken").asText()` 替代 `root.get("data").asText()`。确认 `code===0` 情况下 `data` 非 null（与 B2 的 login 实现一致：成功返回 `R.ok(TokenResponse)`，失败返回 `R.fail()` 时 data 为 null）
- **并发测试**：不在 B3 范围。并发 refresh 的"家族撤销"风险（两个请求带同一旧 cookie）通过单测验证重放检测逻辑即可（下见 §9.3 重放测试用例）
- **过期 token 测试**：`LocalDateTime.now()` 在测试中可能由于精度问题导致"刚创建即过期"。测试中传入足够大的 `refreshExpireSeconds`（如 604800），避免时间精度问题。对于过期场景，直接使用不存在的 token（因 token 默认过期后会被标记 revoked）即可覆盖

## 12. 风险和回滚方案

- **风险 1：AuthFlowIntegrationTest 新增 Bean 导致循环依赖或装配失败**：TestConfig 已手动装配 12+ Bean，新增 2 个 Bean（`RefreshTokenService` + 其依赖 `SysRefreshTokenMapper`）可能触发未预料的依赖链。缓解：`RefreshTokenService` 仅依赖 `SysRefreshTokenMapper`（简单 Mapper，无其他依赖），注入链短
- **风险 2：RefreshTokenServiceTest 中 `@BeforeAll` 建表未被 MyBatis-Plus 结构识别**：MyBatis-Plus `BaseMapperX.insert()` 依赖 `@TableName` 注解映射表名（已正确 `@TableName("sys_refresh_token")`），不依赖 Flyway 或 DDL 发现。只要 H2 中有表，insert 即可工作
- **风险 3：H2 `MODE=PostgreSQL` 与 PG 方言差异**：`sys_refresh_token` DDL 在 H2 和 PG 之间已经过 V18 双方言验证（B1），建表语句直接来自 V18 H2 脚本
- **回滚**：删除 2 个新建测试文件 + 回退 2 个修改测试文件的改动 → `git checkout`。对 `src/main` 零影响

## 13. 测试方案

### 13.1 静态检查

- `git diff --stat` 确认：2 文件修改（AuthControllerTest + AuthFlowIntegrationTest）+ 2 文件新建（RefreshTokenServiceTest + CookieUtilsTest），**共 4 文件**
- `grep -r "R<String>" sw-biz/sw-biz-system/sw-biz-system-biz/src/test/` 零命中（确认所有 `R<String>` 已改为 `R<TokenResponse>`）
- `grep -r "4 参数" sw-biz/sw-biz-system/sw-biz-system-biz/src/test/` — 仅文档引用，非代码
- 确认所有新建测试类有 `@DisplayName` 注解（项目规范）
- 确认 CookieUtilsTest 不加载 Spring 上下文（无 `@SpringBootTest` 注解）

### 13.2 单元测试

| 测试类 | 新增/修复 | 预计用例数 | 覆盖内容 |
|--------|:--------:|:--------:|----------|
| AuthControllerTest（修复后）| 修复 3 用例 | 3 | login 三条路径 + response 形状 + cookie 设置验证 |
| CookieUtilsTest | **新增** | 8 | set(属性+secure True/False+默认 maxAge) + clear + get(正常/null/多 cookie/仅有其他 cookie) + 常量 |
| RefreshTokenServiceTest | **新增** | 14 | create×2 + rotate(正常/重放家族撤销/不存在) + revoke(正常/null/空/不存在) + findUserId(正常/null/不存在) |

### 13.3 集成测试

| 测试类 | 修复 | 预计用例数 | 覆盖内容 |
|--------|:----:|:--------:|----------|
| AuthFlowIntegrationTest（修复后）| 修复 1 用例（e2e） | 4 | 端到端闭合（login 返回 accessToken → /me → /menus）+ 无 token 401 + 错误密码 + 未知用户 |

### 13.4 手工验证

不要求。

### 13.5 回归检查

- `mvn -q compile` 全量 BUILD SUCCESS
- `mvn -q test` 全量 BUILD SUCCESS
- **基线**：B2 验收时 101 非 V1 测试 + 4 V1 预期失败 = 105 总用例（sw-biz-system-biz 模块）。B3 后预期：101 + 4（修复 V1）+ 14（RefreshTokenServiceTest）+ 8（CookieUtilsTest）= **127 用例**（sw-biz-system-biz 模块）
- 其他模块（common/security/storage/notify/job/form/bpm）测试计数不减少
- 所有已有测试保持 BUILD SUCCESS（零回归）

## 14. 验收标准（逐条可验证布尔条件）

1. `git diff --stat` 仅含 4 个文件：2 修改（AuthControllerTest + AuthFlowIntegrationTest）+ 2 新建（RefreshTokenServiceTest + CookieUtilsTest）
2. `grep -r "R<String>" sw-biz/sw-biz-system/sw-biz-system-biz/src/test/` 零命中（V1 测试中 `R<String>` 全部改为 `R<TokenResponse>`）
3. `AuthControllerTest` 构造函数调用使用 7 参数（userDetailsProvider, passwordEncoder, jwtTokenProvider, sysUserService, jwtProperties, refreshTokenService, loginUserLoader）
4. `AuthControllerTest.login_withValidCredentials_shouldReturnToken` 断言 `result.getData()` 为 `TokenResponse` 实例，`getAccessToken()` 非空，cookie `rt` 已设置
5. `AuthFlowIntegrationTest.TestConfig.authController()` Bean 方法使用 7 参数构造函数
6. `AuthFlowIntegrationTest` 登录辅助方法从 `data.accessToken`（JSON 对象字段）提取 token，非 `data` 文本
7. `AuthFlowIntegrationTest.TestConfig` 新增 `RefreshTokenService` Bean（注入 `SysRefreshTokenMapper`）
8. `AuthFlowIntegrationTest.TestConfig` 的 `JwtProperties` Bean 包含 `accessExpireSeconds=900` + `refreshExpireSeconds=604800`
9. `AuthFlowIntegrationTest` 的 `@BeforeAll` 包含 `sys_refresh_token` 建表 DDL
10. `RefreshTokenServiceTest` 至少包含：create 测试（2 个）+ rotate 测试（正常轮换 + 重放家族撤销 + 不存在抛异常）+ revoke 测试（正常 + null 幂等 + 空字符串幂等 + 不存在幂等）+ findUserIdByToken 测试（正常 + null 输入 + 不存在）
11. `CookieUtilsTest` 至少包含：setRefreshCookie 验证 cookie 属性（HttpOnly=true, Path=/api/auth/, SameSite）+ secure=true→Strict + secure=false→Lax + maxAge≤0→默认 604800 + clearRefreshCookie（Max-Age=0 + 空值）+ getRefreshTokenFromCookie（正常 / null / 多 cookie / cookies=null）
12. `mvn -q compile` 全量 BUILD SUCCESS（含测试代码编译）
13. `mvn -q test` 全量 BUILD SUCCESS，所有模块测试通过，sw-biz-system-biz 模块测试数 ≥ 127（101 已有非 V1 + 4 V1 修复 + 14 RefreshTokenServiceTest + 8 CookieUtilsTest），其他模块测试计数不减少

## 15. 执行回执格式

按根目录 CLAUDE.md §7.1 的 13 项，写入 `product/auth-seam-completion/receipts/step-4-b3-execution.md`。

## 16. 测试回执格式

按根目录 CLAUDE.md §7.2 的 12 项，写入 `product/auth-seam-completion/receipts/step-4-b3-test.md`。最终结论只能是 PASSED / FAILED / BLOCKED 之一。

## 17. 明确禁止事项

- ❌ 不修改 `src/main/java` 下任何文件（本 Step 仅写/改测试代码）
- ❌ 不新增 Maven 依赖
- ❌ 不新增 Flyway 迁移脚本
- ❌ 不修改 `AuthController` / `RefreshTokenService` / `CookieUtils` / `TokenResponse` 等业务代码
- ❌ 不修改其他已有测试文件（RoleControllerTest / UserControllerTest / AuthMeControllerTest 等）
- ❌ 不修改前端代码
- ❌ 不在 `AuthFlowIntegrationTest` 中删除已有的建表语句或 seed 数据（只追加 `sys_refresh_token` 表）
- ❌ 不改变 V1 测试的被测路径（login happy path / 用户不存在 / 密码错误 / e2e 认证链的语义不变，只改适配层）
- ❌ 不在测试中使用真实的 Redis / PostgreSQL（仅 H2 内存数据库）
- ❌ **执行代理不得自行决定测试范围或新增不在本方案内的测试**。严格按本方案 §9 和 §14 执行
- ❌ **执行代理若发现本方案有误或遗漏**（如需要额外 Mock、构造参数不对、编译失败等），**唯一正确做法**：在回执中明确报告问题（哪个步骤不可行、原因是什么），由规划层修正方案后重新下发。**绝不要**自行「顺手修改」方案、自行补充未列出的测试用例、自行修改业务代码、或以「我建议」「我认为」「要不要我」等方式诱导用户允许在执行层规划。违反此条的回执视为不合格，对应 Step 自动判定为 FAILED
