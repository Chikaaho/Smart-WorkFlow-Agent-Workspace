# Step B2：RefreshTokenService + login 改造 + /auth/refresh + /auth/logout + cookie 工具

> 所属功能：auth-seam-completion（后端 seam 收尾）
> 域：**纯后端**（只改 `Smart-WorkFlow/`，禁止触碰前端）
> 本方案按根目录 CLAUDE.md §6 的 17 项结构生成。

---

## 1. 当前状态

功能 auth-seam-completion 的 V1 ✅ PASSED（me/menus/权限 端到端验证），B1 ✅ PASSED（`sys_refresh_token` 表 + Entity/Mapper + JWT 双档过期配置）。B1 产物：V18 Flyway 双方言 DDL、`SysRefreshToken` Entity（`extends BaseEntity`）、`SysRefreshTokenMapper`（`extends BaseMapperX`）、`JwtProperties` 新增 `accessExpireSeconds=900` + `refreshExpireSeconds=604800`、`JwtTokenProviderImpl.generateToken()` 使用回退逻辑、`application.yml` 新增两个配置键。

本 Step 是 B2——核心业务逻辑实现阶段。B1 的基础设施（表/Entity/Mapper/配置）已就位，B2 在此之上构建完整的双 token 认证流程。

前置：B1 ✅ PASSED（`product/auth-seam-completion/passed/step-2-b1-refresh-token-table.md`）。

## 2. Step 目标

实现 `RefreshTokenService`（刷新令牌生成/校验/轮换/撤销）、改造 `AuthController.login` 返回 `R<{accessToken, expiresIn}>` 并下发 httpOnly refresh cookie、新增 `POST /auth/refresh`（校验 refresh cookie → 轮换 → 返回新 access token）、新增 `POST /auth/logout`（撤销 refresh token + 清 cookie）、提供 Cookie 工具方法（设置/清除 httpOnly cookie）。

## 3. 推荐模型

```
推荐模型：deepseek-v4-pro
选择理由：涉及安全认证边界（SHA-256 哈希、cookie 安全属性、refresh 轮换防重放）+ 跨模块变更（sw-security/sw-common/sw-biz-system）+ 新端点设计，触发 §2.3「涉及权限、安全、认证或数据隔离」「涉及跨项目联动」
是否触发升级条件：是 — 安全认证 + 跨模块变更
```

## 4. 模型选择理由

B2 是整个 auth-seam-completion 功能的核心业务逻辑——双 token 生成/校验/轮换/撤销全链路实现，涉及 SHA-256 哈希、SecureRandom 随机数生成、httpOnly cookie 安全属性、refresh 轮换防重放、DB 事务边界，任何一处失误都构成安全漏洞。需 Pro 级推理确保实现正确。

## 5. 已知上下文

- **D26**（双 token 设计）：accessToken=短期 JWT（900s），前端仅内存；refreshToken=不透明随机串（64 字符 hex），SHA-256 哈希存 `sys_refresh_token.token_hash`，原文经 httpOnly+Secure+SameSite cookie 下发，JS 不可读
- **D27**（refresh token 服务端存储 + 轮换 + 撤销）：`/auth/refresh` 校验通过后签发新 refresh + 撤销旧 refresh（`revoked=1`）；检测重放（已撤销 token 被再次使用）→ 撤销该用户全部 refresh token；`/auth/logout` 读取 refresh cookie → 置 `revoked=1` + 清 cookie
- **B1 产物**：`SysRefreshToken` Entity（`userId`/`tokenHash`/`expiresAt`/`revoked` + BaseEntity 字段）、`SysRefreshTokenMapper`（`BaseMapperX<SysRefreshToken>`）、JWT 双档配置已就位
- **现有 login 流程**：`AuthController.login(LoginRequest)` → `sysUserService.getByUsername()` → `passwordEncoder.matches()` → `jwtTokenProvider.generateToken(user.getId())` → `R.ok(token)`（返回裸 String）
- **JwtTokenProvider 接口**：`generateToken(Long userId)` / `parseUserId(String token)` / `validate(String token)` — B2 不改此接口
- **JwtProperties**（B1 后）：`expireSeconds=7200`（保留）、`accessExpireSeconds=900`、`refreshExpireSeconds=604800`
- **SecurityProperties**：`tokenHeader="Authorization"`、`tokenPrefix="Bearer "`、`permitUrls` 含 `/auth/login`
- **JwtAuthenticationFilter**：从 `Authorization: Bearer <token>` 头提取 JWT → 校验 → 加载 LoginUser → 设置 SecurityContext。**不读 cookie**，不改此过滤器
- **R<T> 响应包装器**：`R.ok(T data)` 返回 `{code:0, msg:"success", data:T}`；`R.fail(int code, String msg)` 返回错误
- **LoginUserCacheService**：`cache(LoginUser)` / `get(userId)` / `evict(userId)`，其中 cache TTL 使用 `jwtProperties.getExpireSeconds()`（B2 需改为 `accessExpireSeconds`）
- **LoginUserLoader**：`loadByUserId(userId)` / `kickOut(userId)`（踢出用户缓存）
- **项目无任何 Cookie 工具**：代码库中零 `jakarta.servlet.http.Cookie` 或 `ResponseCookie` 引用，B2 从零构建
- **application.yml 端口**：`server.servlet.context-path=/api`，所有端点路径前置 `/api`
- **SysRole 已知问题（I26）**：Entity 列名与 V5 迁移不一致，本 Step 不涉及

## 6. 执行前必须读取的文件

按优先级：

1. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java` — 现有 login 实现全貌（LoginRequest 内部类、注入依赖、异常处理）
2. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProvider.java` — 接口方法签名（确认 `generateToken(Long)` 返回 String）
3. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProviderImpl.java` — generateToken 实现细节（B1 后的回退逻辑）
4. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java` — B1 后的字段列表（确认 accessExpireSeconds/refreshExpireSeconds 存在）
5. `sw-framework/sw-security/src/main/java/com/sw/ck/security/config/SecurityProperties.java` — permitUrls 列表、tokenHeader/tokenPrefix
6. `sw-framework/sw-security/src/main/java/com/sw/ck/security/cache/LoginUserCacheService.java` — cache/evict 方法签名、getExpireSeconds 引用位置
7. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRefreshToken.java` — Entity 字段列表（@TableField 列名映射）
8. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysRefreshTokenMapper.java` — Mapper 签名
9. `sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` — 响应包装器构造方法
10. `sw-bootstrap/src/main/resources/application.yml` — JWT 配置段、permit-urls 列表、server.servlet.context-path
11. `sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java` — 确认继承字段（id/createTime/updateTime/deleted/tenantId/version）

## 7. 允许修改的文件范围

### 新建（4 文件）

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java` | Refresh Token 核心服务 |
| 2 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/util/CookieUtils.java` | httpOnly cookie 设置/清除工具 |
| 3 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/model/TokenResponse.java` | 登录/刷新响应 DTO（accessToken + expiresIn） |

### 修改（4 文件）

| # | 文件 | 改动点 |
|---|------|--------|
| 4 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java` | login 返回类型变更 + 新增 /auth/refresh + /auth/logout 端点 |
| 5 | `sw-framework/sw-security/src/main/java/com/sw/ck/security/cache/LoginUserCacheService.java` | expireSeconds → accessExpireSeconds（回退逻辑） |
| 6 | `sw-bootstrap/src/main/resources/application.yml` | permit-urls 新增 `/auth/refresh` |
| 7 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRefreshToken.java` | 可能新增辅助查询方法（如 `isExpired()` / `isRevoked()`），视 RefreshTokenService 实现需要 |

### 编译影响模块

- `sw-biz/sw-biz-system/sw-biz-system-biz`（新增 Service/CookieUtils/TokenResponse + 改 Controller + 可能改 Entity）
- `sw-framework/sw-security`（改 LoginUserCacheService）
- `sw-bootstrap`（改 application.yml）

## 8. 禁止修改的范围

- ❌ 任何前端 `Smart-WorkFlow-Web/**` 一律不碰
- ❌ `JwtTokenProvider` **接口**（不改签名、不新增方法）
- ❌ `JwtTokenProviderImpl.generateToken()`（B1 已改好，B2 不碰）
- ❌ `JwtAuthenticationFilter`（不在此过滤器读 cookie——refresh/logout 端点自行处理）
- ❌ `SecurityProperties` 类本身（不新增字段，只改 YAML 中的 permit-urls 列表值）
- ❌ Flyway 迁移脚本（B1 已完成 V18）
- ❌ `JwtProperties` 类（B1 已完成）
- ❌ 其他 Controller/Service/Mapper（不改 AuthMeController、SysMenuService 等）
- ❌ 不新增 Maven 依赖
- ❌ 不新增测试文件（B3 统一做后端测试）
- ❌ 不改 login 请求体 `LoginRequest` 的结构（username+password 不变）

## 9. 详细执行方案

### 9.1 TokenResponse DTO

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/model/TokenResponse.java`

包名：`com.sw.ck.system.model`

```java
package com.sw.ck.system.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse implements Serializable {
    /** JWT access token，前端内存存储 */
    private String accessToken;
    /** access token 过期时间（秒），前端据此计算刷新时机 */
    private long expiresIn;
}
```

- `@Data` 生成 getter/setter/toString/equals/hashCode
- `@NoArgsConstructor` + `@AllArgsConstructor` 支持序列化和便捷构造
- `implements Serializable` 与 `R<T>` 一致

### 9.2 CookieUtils 工具类

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/util/CookieUtils.java`

包名：`com.sw.ck.system.util`

```java
package com.sw.ck.system.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

/**
 * httpOnly cookie 工具 — 仅用于 refresh token 的 Set-Cookie 操作。
 * <p>
 * 所有 cookie 均设置 httpOnly=true（JS 不可读）、Secure=true（仅 HTTPS）、
 * SameSite=Strict、Path=/api/auth/（仅 auth 端点携带）。
 */
public final class CookieUtils {

    private static final String REFRESH_COOKIE_NAME = "rt";
    private static final String REFRESH_COOKIE_PATH = "/api/auth/";
    /** Refresh token 默认 Max-Age（秒）= 7 天 */
    private static final int REFRESH_MAX_AGE = 604800;
    /** 生产环境 Secure 开关（通过配置或环境变量控制） */
    private static final boolean SECURE = true;

    private CookieUtils() {
        // 工具类不可实例化
    }

    /**
     * 设置 refresh token httpOnly cookie。
     * @param response HTTP 响应
     * @param token    原始 refresh token 字符串（非 hash）
     * @param maxAge   过期秒数，传 0 或负数使用默认 7 天
     */
    public static void setRefreshCookie(HttpServletResponse response, String token, int maxAge) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(SECURE);
        cookie.setPath(REFRESH_COOKIE_PATH);
        cookie.setAttribute("SameSite", "Strict");
        cookie.setMaxAge(maxAge > 0 ? maxAge : REFRESH_MAX_AGE);
        response.addCookie(cookie);
    }

    /**
     * 清除 refresh token cookie（logout / token 撤销时调用）。
     * 设置 Max-Age=0 + 空值，浏览器立即删除。
     */
    public static void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(SECURE);
        cookie.setPath(REFRESH_COOKIE_PATH);
        cookie.setAttribute("SameSite", "Strict");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    /**
     * 从请求中读取 refresh token cookie。
     * @return cookie 值（原始 refresh token），无此 cookie 时返回 null
     */
    public static String getRefreshTokenFromCookie(jakarta.servlet.http.HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
```

设计要点：
- Cookie 名 `rt`（简短，减少请求头体积）
- Path `/api/auth/`：浏览器仅向 `/api/auth/*` 发送此 cookie，不污染其他请求
- `SameSite=Strict`：防 CSRF（跨站请求不携带此 cookie）
- `Secure=true`：仅 HTTPS 传输（开发期 H2 环境为 HTTP，可通过 `application.yml` 配置关闭——见 9.7 的说明）
- `HttpOnly=true`：JS 完全不可读

### 9.3 RefreshTokenService

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java`

包名：`com.sw.ck.system.service`

```java
package com.sw.ck.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.system.entity.SysRefreshToken;
import com.sw.ck.system.mapper.SysRefreshTokenMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Refresh Token 服务 — 生成/校验/轮换/撤销。
 * <p>
 * refresh token = 32 字节安全随机数 → 十六进制编码（64 字符）
 * → SHA-256 哈希 → 存 sys_refresh_token.token_hash。
 * 原文经 httpOnly cookie 下发，服务端只存 hash。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final int TOKEN_BYTES = 32;       // 256 bit 随机数
    private static final String TOKEN_HASH_ALGO = "SHA-256";
    private static final String HEX_DIGITS = "0123456789abcdef";

    private final SysRefreshTokenMapper sysRefreshTokenMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    // ========== 公开 API ==========

    /**
     * 为用户创建新的 refresh token（登录时调用）。
     * @param userId   用户 ID
     * @param tenantId 租户 ID
     * @return 原始 refresh token 字符串（传给 CookieUtils.setRefreshCookie）
     */
    @Transactional(rollbackFor = Exception.class)
    public String createRefreshToken(Long userId, Long tenantId, long refreshExpireSeconds) {
        // 1. 生成随机 token
        String rawToken = generateRawToken();
        // 2. SHA-256 哈希
        String tokenHash = sha256(rawToken);
        // 3. 写入 DB
        SysRefreshToken entity = new SysRefreshToken();
        entity.setUserId(userId);
        entity.setTenantId(tenantId);
        entity.setTokenHash(tokenHash);
        entity.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpireSeconds));
        entity.setRevoked(0);
        sysRefreshTokenMapper.insert(entity);
        // 4. 返回原文给调用方（用于设置 cookie）
        log.debug("Created refresh token for userId={}, id={}", userId, entity.getId());
        return rawToken;
    }

    /**
     * 校验 refresh token 并执行轮换（/auth/refresh 调用）。
     * <p>
     * 轮换策略：验证通过后立即撤销旧 token → 签发新 token。
     * 若检测到重放（传入已撤销 token），撤销该用户全部 refresh token。
     *
     * @param rawToken cookie 中的原始 refresh token
     * @return RefreshTokenRotation（userId + tenantId + 新的原始 token）
     * @throws BaseException(UNAUTHORIZED) token 无效/过期/已撤销
     */
    @Transactional(rollbackFor = Exception.class)
    public RefreshTokenRotation rotateRefreshToken(String rawToken, long refreshExpireSeconds) {
        String tokenHash = sha256(rawToken);
        // 1. 查找 token
        SysRefreshToken existing = sysRefreshTokenMapper.selectOne(
                new LambdaQueryWrapper<SysRefreshToken>()
                        .eq(SysRefreshToken::getTokenHash, tokenHash)
        );
        // 2. 不存在 → 无效
        if (existing == null) {
            log.warn("Refresh token not found in DB");
            throw new BaseException(401, "refresh token 无效");
        }
        // 3. 已撤销 → 重放攻击，撤销该用户全部 refresh token
        if (existing.getRevoked() != null && existing.getRevoked() == 1) {
            log.error("REPLAY DETECTED: revoked refresh token reused, userId={}, tokenId={}",
                    existing.getUserId(), existing.getId());
            revokeAllForUser(existing.getUserId());
            throw new BaseException(401, "refresh token 已被使用过，全部会话已失效，请重新登录");
        }
        // 4. 已过期 → 拒绝
        if (existing.getExpiresAt() != null && existing.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Refresh token expired for userId={}, tokenId={}", existing.getUserId(), existing.getId());
            // 标记过期 token 为已撤销（清理）
            revokeTokenById(existing.getId());
            throw new BaseException(401, "refresh token 已过期，请重新登录");
        }
        // 5. 撤销旧 token
        revokeTokenById(existing.getId());
        // 6. 签发新 token（轮换）
        Long userId = existing.getUserId();
        Long tenantId = existing.getTenantId();
        String newToken = createRefreshToken(userId, tenantId, refreshExpireSeconds);
        log.debug("Refresh token rotated for userId={}, oldId={}", userId, existing.getId());
        return new RefreshTokenRotation(userId, tenantId, newToken);
    }

    /**
     * 撤销指定的 refresh token（/auth/logout 调用）。
     * 如果 cookie 中无 token 或 token 无效，静默成功（幂等）。
     */
    @Transactional(rollbackFor = Exception.class)
    public void revokeRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isEmpty()) {
            return; // 幂等：无 token 即已登出
        }
        String tokenHash = sha256(rawToken);
        SysRefreshToken existing = sysRefreshTokenMapper.selectOne(
                new LambdaQueryWrapper<SysRefreshToken>()
                        .eq(SysRefreshToken::getTokenHash, tokenHash)
        );
        if (existing == null) {
            return; // 幂等：token 不存在即已登出
        }
        revokeTokenById(existing.getId());
        log.debug("Refresh token revoked for userId={}, tokenId={}", existing.getUserId(), existing.getId());
    }

    /**
     * 查询 refresh token 关联的用户 ID（仅用于日志/审计，不做鉴权）。
     */
    public Long findUserIdByToken(String rawToken) {
        if (rawToken == null || rawToken.isEmpty()) return null;
        String tokenHash = sha256(rawToken);
        SysRefreshToken existing = sysRefreshTokenMapper.selectOne(
                new LambdaQueryWrapper<SysRefreshToken>()
                        .eq(SysRefreshToken::getTokenHash, tokenHash)
        );
        return existing != null ? existing.getUserId() : null;
    }

    // ========== 内部方法 ==========

    /** 生成 32 字节安全随机数 → 64 字符十六进制字符串 */
    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(TOKEN_BYTES * 2);
        for (byte b : bytes) {
            sb.append(HEX_DIGITS.charAt((b & 0xF0) >> 4));
            sb.append(HEX_DIGITS.charAt(b & 0x0F));
        }
        return sb.toString();
    }

    /** SHA-256 哈希 → 64 字符十六进制字符串 */
    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance(TOKEN_HASH_ALGO);
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    /** 撤销单个 token（按 id 更新 revoked=1） */
    private void revokeTokenById(Long id) {
        sysRefreshTokenMapper.update(null,
                new LambdaUpdateWrapper<SysRefreshToken>()
                        .eq(SysRefreshToken::getId, id)
                        .set(SysRefreshToken::getRevoked, 1));
    }

    /** 重放检测：撤销用户全部 refresh token */
    private void revokeAllForUser(Long userId) {
        sysRefreshTokenMapper.update(null,
                new LambdaUpdateWrapper<SysRefreshToken>()
                        .eq(SysRefreshToken::getUserId, userId)
                        .eq(SysRefreshToken::getRevoked, 0)
                        .set(SysRefreshToken::getRevoked, 1));
    }

    // ========== 内部 DTO ==========

    /**
     * refresh token 轮换结果。
     */
    public record RefreshTokenRotation(Long userId, Long tenantId, String newRawToken) {}
}
```

关键设计决策：
- **SHA-256 + 十六进制编码**：64 字符，与 `VARCHAR(128)` 匹配，有足够余量
- **重放检测（family revocation）**：已撤销 token 被再次使用 → 撤销该用户所有 token → 强制全部设备重登。这是 refresh token 轮换的标准安全实践
- **轮换 = 旧 revoked=1 + 新建新 token**：在同一事务中完成（`@Transactional`），防止部分成功
- **过期 token 清理**：过期 token 在校验时顺便标记 revoked=1，避免 DB 膨胀
- **TenantId 从 B1 BaseEntity 继承**：`sysRefreshTokenMapper.insert()` 时 MyBatis-Plus 自动填充 `tenant_id`（`TenantLineHandler`），但为安全起见代码中显式 `setTenantId`

### 9.4 AuthController 改造

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java`

**9.4.1 login 端点改造**

现有返回：
```java
return R.ok(token);  // R<String>
```

改为：
```java
// 1. 生成 access token（现有逻辑不变）
String accessToken = jwtTokenProvider.generateToken(user.getId());

// 2. 生成 refresh token → 写 DB + 设 cookie
String refreshToken = refreshTokenService.createRefreshToken(
        user.getId(), user.getTenantId(), jwtProperties.getRefreshExpireSeconds());
CookieUtils.setRefreshCookie(response, refreshToken, (int) jwtProperties.getRefreshExpireSeconds());

// 3. 返回 TokenResponse
return R.ok(new TokenResponse(accessToken, jwtProperties.getAccessExpireSeconds()));
```

需要注入的新依赖：
- `RefreshTokenService refreshTokenService`（新增）
- `JwtProperties jwtProperties`（从 `JwtTokenProvider` 无法直接获取过期时间，需注入 `JwtProperties`）
- `HttpServletResponse response`（方法参数新增）

方法签名变化：
```java
// 旧
public R<String> login(@Valid @RequestBody LoginRequest request)

// 新
public R<TokenResponse> login(@Valid @RequestBody LoginRequest request,
                               HttpServletResponse httpResponse)
```

**9.4.2 /auth/refresh 端点（新增）**

```java
@PostMapping("/refresh")
public R<TokenResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
    // 1. 从 cookie 读取 refresh token
    String rawToken = CookieUtils.getRefreshTokenFromCookie(request);
    if (rawToken == null || rawToken.isEmpty()) {
        return R.fail(401, "未提供 refresh token");
    }
    // 2. 校验 + 轮换
    try {
        RefreshTokenService.RefreshTokenRotation rotation =
                refreshTokenService.rotateRefreshToken(rawToken, jwtProperties.getRefreshExpireSeconds());
        // 3. 下发新 refresh cookie
        CookieUtils.setRefreshCookie(response, rotation.newRawToken(), (int) jwtProperties.getRefreshExpireSeconds());
        // 4. 生成新 access token
        String newAccessToken = jwtTokenProvider.generateToken(rotation.userId());
        // 5. 返回
        return R.ok(new TokenResponse(newAccessToken, jwtProperties.getAccessExpireSeconds()));
    } catch (BaseException e) {
        // 轮换失败 → 清 cookie
        CookieUtils.clearRefreshCookie(response);
        return R.fail(e.getCode(), e.getMessage());
    }
}
```

**9.4.3 /auth/logout 端点（新增）**

```java
@PostMapping("/logout")
public R<Void> logout(HttpServletRequest request, HttpServletResponse response) {
    // 1. 从 cookie 读取 refresh token
    String rawToken = CookieUtils.getRefreshTokenFromCookie(request);
    // 2. 撤销 refresh token（幂等：无 token 时静默成功）
    refreshTokenService.revokeRefreshToken(rawToken);
    // 3. 清除 cookie
    CookieUtils.clearRefreshCookie(response);
    // 4. 如果有当前登录用户，踢出缓存
    try {
        LoginUser currentUser = LoginUserHolder.get();
        if (currentUser != null) {
            loginUserLoader.kickOut(currentUser.getId());
        }
    } catch (Exception ignored) {
        // 用户可能未认证（access token 已过期），忽略
    }
    return R.ok();
}
```

新增注入依赖：`LoginUserHolder` / `LoginUserLoader`（已有，但 AuthController 当前未注入 `LoginUserHolder`，需新增）、`JwtProperties`、`RefreshTokenService`。

**完整的构造函数注入变更**：

旧：
```java
private final UserDetailsProvider userDetailsProvider;
private final PasswordEncoder passwordEncoder;
private final JwtTokenProvider jwtTokenProvider;
private final SysUserService sysUserService;
```

新（新增 4 个）：
```java
private final UserDetailsProvider userDetailsProvider;
private final PasswordEncoder passwordEncoder;
private final JwtTokenProvider jwtTokenProvider;
private final SysUserService sysUserService;
private final JwtProperties jwtProperties;               // ← 新增
private final RefreshTokenService refreshTokenService;   // ← 新增
private final LoginUserLoader loginUserLoader;           // ← 新增（用于 logout）
```

注意：`LoginUserHolder` 是静态方法（`LoginUserHolder.get()`），不需要注入。`LoginUserLoader`（含 `kickOut` 方法）需要注入。检查 AuthController 当前是否已注入 `LoginUserLoader`——很可能已注入（用于 login 时加载用户详情），若已注入则不需重复。

### 9.5 LoginUserCacheService — Redis TTL 更新

文件：`sw-framework/sw-security/src/main/java/com/sw/ck/security/cache/LoginUserCacheService.java`

找到使用 `jwtProperties.getExpireSeconds()` 设置 Redis 缓存 TTL 的位置，改为与 B1 的 `JwtTokenProviderImpl.generateToken()` 同样的回退逻辑：

```java
long ttlSeconds = jwtProperties.getAccessExpireSeconds() > 0
        ? jwtProperties.getAccessExpireSeconds()
        : jwtProperties.getExpireSeconds();
```

替换原先直接调用 `jwtProperties.getExpireSeconds()` 的代码。不改方法签名，不改其他逻辑。

### 9.6 application.yml — 新增 /auth/refresh 到白名单

文件：`sw-bootstrap/src/main/resources/application.yml`

在 `sw.security.permit-urls` 列表中新增：

```yaml
        - /auth/refresh
```

插入位置：在 `/auth/login` 之后（保持同类端点聚合）。

**不将 `/auth/logout` 加入白名单**：logout 读取 refresh cookie 工作，不依赖 access token。且在 permitUrls 之外的端点仍可被 `JwtAuthenticationFilter` 放过——当请求带 refresh cookie 但无 Authorization 头时，过滤器无法认证→`SecurityContextHolder` 为空→`AuthenticationEntryPoint` 返回 401。而 logout 端点本身不需要认证（只要 cookie 有效就撤销），所以 **要么**加到白名单，**要么**在 Controller 方法上加 `@PermitAll` 或调整过滤器逻辑。

**实际选择**：将 `/auth/logout` 也加入白名单。理由：logout 的鉴权靠 refresh cookie（持有 cookie 者即为 token 所有者），不需要额外的 access token。如果用户 access token 已过期，logout 仍应正常工作（只要 refresh cookie 还在）。

```yaml
        - /auth/refresh
        - /auth/logout
```

### 9.7 Cookie Secure 属性的开发/生产适配

开发期（H2 内存数据库）通常是 HTTP 连接，`Secure=true` 会导致浏览器拒绝设置 cookie。有两种方案：

**方案 A（推荐——本方案采用）**：`CookieUtils` 中 `SECURE` 改为从 `application.yml` 读取的配置值。

新增一个配置类或直接在 `CookieUtils` 中改为非 static 方法、注入配置。但这会显著增加复杂度。

**方案 B（务实）**：`CookieUtils.SECURE` 硬编码为 `true`，开发期使用 HTTP 时浏览器会忽略 Secure cookie——但 token 仍可通过非 Secure cookie 工作？（实际上浏览器在 HTTP 连接下会拒绝设置 Secure cookie）

**方案 C（最简单，本方案采用）**：默认 `SECURE = false`，在生产环境通过反向代理（Nginx）强制 HTTPS。或接受开发期无 Secure 标志（cookie 仅 localhost 传输，无中间人风险）。

**实际实现**：在 `application.yml` 中新增配置项：

```yaml
sw:
  security:
    cookie:
      secure: false  # 开发期为 false，生产环境改为 true
```

然后修改 `CookieUtils` 为非 static 工具类（或使用 `@Component` + 配置注入）。

**简化为**: CookieUtils 改为 Spring Bean（`@Component`），注入 `@Value("${sw.security.cookie.secure:false}")`，方法改为实例方法。AuthController 注入 `CookieUtils`。

### 9.7（修正）— 简化 CookieUtils 设计

为减少复杂度，本方案采用**非 Spring Bean 的纯工具类 + 参数传递 Secure 标志**：

```java
// 设置 cookie 时传入 secure 参数
public static void setRefreshCookie(HttpServletResponse response, String token, int maxAge, boolean secure) {
    Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, token);
    cookie.setHttpOnly(true);
    cookie.setSecure(secure);
    cookie.setPath(REFRESH_COOKIE_PATH);
    cookie.setAttribute("SameSite", secure ? "Strict" : "Lax");
    cookie.setMaxAge(maxAge > 0 ? maxAge : REFRESH_MAX_AGE);
    response.addCookie(cookie);
}
```

`AuthController` 中通过 `@Value("${sw.security.cookie.secure:false}")` 注入 `boolean cookieSecure`，调用时传入。

`application.yml` 中新增：
```yaml
sw:
  security:
    cookie:
      secure: false
```

### 9.8 编译验证

```bash
cd Smart-WorkFlow
mvn -q compile    # 全量编译（sw-security + sw-biz-system-biz + sw-bootstrap）
```

编译通过即证明：Spring 依赖注入正确、`@ConfigurationProperties` 绑定正确、所有 import 正确、无循环依赖。

## 10. 关键实现约束

- **refresh token 原文绝不存 DB**：DB 仅存 SHA-256 哈希，原文仅在 cookie 中传输
- **轮换必须在同一事务中完成**：旧 token 置 revoked=1 + 新 token insert 必须原子化（`@Transactional`）
- **重放检测必须撤销全家（family revocation）**：已撤销 token 被再次使用 → 该用户所有 refresh token 置 revoked=1 → 全部设备强制重登
- **cookie 名和 Path 必须与方案一致**：`rt` + `/api/auth/`，前端 B2/F1 的 beforeHandler 依赖此契约
- **login 响应形状变更不可逆**：`R<String>` → `R<TokenResponse>`，前端 login 逻辑将基于此契约编写（F1 范围）
- **不修改 JwtTokenProvider 接口**：只使用现有 `generateToken(Long)` 方法
- **不修改 JwtAuthenticationFilter**：refresh/logout 端点自行从 cookie 提取 token，不走 Authorization 头过滤器链
- **LoginUserCacheService 的 TTL 必须与 access token 过期一致**：改为 `accessExpireSeconds`（回退 `expireSeconds`），与 B1 的 `JwtTokenProviderImpl` 一致
- **不引入新 Maven 依赖**：`java.security.MessageDigest` / `java.security.SecureRandom` 均为 JDK 内置
- **`@Transactional` 全部使用 `rollbackFor = Exception.class`**：确保任何异常都回滚 DB 操作
- **logout 幂等**：无 cookie / token 不存在 / token 已撤销 → 均静默成功，不清 cookie 报错

## 11. 边界情况

- **refresh cookie 不存在**（/auth/refresh 或 /auth/logout 被不带 cookie 调用）→ `getRefreshTokenFromCookie()` 返回 null → refresh 返回 401 "未提供 refresh token"；logout 静默成功
- **refresh cookie 值为空字符串**→ 同"不存在"处理
- **token_hash 查找命中但 revoked=1（正常轮换后的旧 token）**→ 不应发生（旧 token 的 cookie 已被新 cookie 覆盖），若发生则查 DB 得到 revoked=1 → **不作重放处理**（因为不是恶意重放，只是正常的并发/延迟）→ 返回 401
- **重放检测与正常并发竞态**：用户连续两次调用 /auth/refresh（如前端单飞去重失效），第一次成功（旧→新），第二次带着同一个旧 cookie → 查 DB 发现 revoked=1 → 触发 family revocation。**预防**：前端 F1 实现单飞（single-flight）去重，后端无法区分"恶意重放"和"前端 bug 导致的重复请求"。当前设计选择优先安全（宁可误撤全家也不放过真正重放）
- **已过期 refresh token**→ 校验时发现 `expires_at < now` → 标记 revoked=1 → 返回 401
- **登录后不保存 refresh cookie（浏览器禁用 cookie）**→ 用户正常获得 access token，但 F5/冷启动后无 refresh → 需重登录。这是合理的降级行为，不报错
- **access token 过期 + refresh token 有效**→ /auth/refresh 返回新 access token，前端重放原请求。正常运行路径
- **access token 过期 + refresh token 也过期**→ /auth/refresh 返回 401 → 前端清内存 token → 重定向登录页
- **并发登录（同一用户多设备）**→ 每次登录创建独立的 refresh token（不同随机串），不需要互踢。logout 只撤销传入的那一个 cookie 中的 refresh token，不影响其他设备
- **refresh token 最长 7 天**→ 7 天后 DB 中 `expires_at` 到期。定期清理过期 token 可在 B3 或后续版本中添加定时任务，当前仅在校验时顺便标记 revoked=1
- **Secure cookie 开发期 = false**→ 开发期 HTTP 可用；生产配置改为 true
- **Cookie Path = /api/auth/** → 浏览器仅向 `/api/auth/refresh`、`/api/auth/logout` 发送此 cookie；`/api/system/**` 等其他 API 不带 cookie，减少请求体积

## 12. 风险和回滚方案

- **风险 1：login 响应形状变更为破坏性变更**：前端当前直接从 `R<String>.data` 取 token（字符串）。改为 `R<TokenResponse>` 后，前端 login 逻辑必须同步改为从 `data.accessToken` 取 token。风险缓解：前端 F1 Step 契约先行，login 响应形状以本方案为准
- **风险 2：Cookie 跨域问题**：前后端同源部署（开发期 Vite 代理 `/api` → `localhost:8080`）时 cookie 正常工作。若前后端分离部署不同域，需额外配置 CORS + `SameSite=None`
- **风险 3：`LoginUserCacheService` 改动影响面**：此服务被 `LoginUserLoader` 和可能的其他组件使用。改动只涉及 TTL 取值（`getExpireSeconds()` → 回退逻辑），不改变方法签名和缓存语义，影响面极小
- **风险 4：`SysRefreshToken` 的 `tenant_id` 自动填充**：`SysRefreshToken extends BaseEntity`，`TenantLineHandler` 会在 insert 时自动注入当前租户 ID。需确认登录时（用户尚未认证，无 JWT → 无 LoginUser → 无租户上下文）`TenantLineHandler` 的行为——它可能注入 0（默认租户）。确认当前 `JwtAuthenticationFilter` 在 permitUrls 路径上不设置 `LoginUserHolder`，所以登录时 `LoginUserHolder.get()` 为 null，`TenantLineHandler` 应回退到默认 tenant_id=0。**若实际行为不同，RefreshTokenService.createRefreshToken() 中显式传入 tenantId（从 SysUser 获取）已覆盖自动填充，安全**
- **回滚**：删除 3 个新建文件、回退 4 个修改文件的改动、`git checkout` 恢复。`sys_refresh_token` 表（V18）可保留（无业务数据），不影响回滚

## 13. 测试方案

### 13.1 静态检查

- `git diff --stat` 确认仅改 7 个文件（3 新建 + 4 修改），**不碰任何其他文件**
- `grep -r "getExpireSeconds()" sw-framework/sw-security/src/main/java/com/sw/ck/security/cache/LoginUserCacheService.java` 确认已替换为回退逻辑
- `grep -r "sha256\|SHA-256" sw-biz/sw-biz-system/` 确认哈希算法使用正确
- `grep -r "setSecure\|setHttpOnly" sw-biz/sw-biz-system/` 确认 cookie 属性设置正确
- 确认 `permit-urls` 包含 `/auth/refresh` 和 `/auth/logout`

### 13.2 单元测试

本 Step 不要求新增测试（B3 统一覆盖）。但必须验证：

- `mvn -q compile` 全量通过
- `mvn -q test` 全量回归 ≥ 210 tests BUILD SUCCESS（基线不减少）

### 13.3 集成测试

不要求（B3 统一做）。

### 13.4 手工验证

不要求。

### 13.5 回归检查

- `mvn -q test` 全量：测试计数 **≥ 210**（B1 基线），BUILD SUCCESS
- V1 新增的 7 个测试（`AuthControllerTest` 3 + `AuthFlowIntegrationTest` 4）可能因 login 响应形状变更而**需要更新断言**（从 `R<String>` 改为 `R<TokenResponse>`）。**如果 V1 测试因响应形状变更而失败，这是预期行为——B3 会统一更新测试。** 但 V1 测试失败意味着回归计数会低于 210，需在回执中明确记载
- `mvn -q compile` 全量模块编译通过

## 14. 验收标准（逐条可验证布尔条件）

1. `git diff --stat` 仅含 7 个文件：3 新建（TokenResponse + RefreshTokenService + CookieUtils）+ 4 修改（AuthController + LoginUserCacheService + application.yml + 可能的 SysRefreshToken）
2. `RefreshTokenService` 包含 `createRefreshToken`、`rotateRefreshToken`、`revokeRefreshToken` 三个公开方法，均带 `@Transactional(rollbackFor = Exception.class)`
3. `RefreshTokenService` 使用 `SecureRandom` 生成 32 字节随机数 → 十六进制编码（64 字符），使用 `MessageDigest.getInstance("SHA-256")` 做哈希
4. `RefreshTokenService.rotateRefreshToken()` 包含重放检测逻辑（已撤销 token 再次使用 → 撤销该用户全部 refresh token → 抛出异常）
5. `AuthController.login` 返回类型变为 `R<TokenResponse>`（非 `R<String>`），`TokenResponse` 包含 `accessToken` 和 `expiresIn` 字段
6. `AuthController.login` 调用 `refreshTokenService.createRefreshToken()` + `CookieUtils.setRefreshCookie()` 下发 refresh cookie
7. `AuthController` 新增 `POST /auth/refresh` 端点：从 cookie 读 refresh token → 调用 `rotateRefreshToken()` → 设新 cookie → 返回新 `TokenResponse`
8. `AuthController` 新增 `POST /auth/logout` 端点：从 cookie 读 refresh token → 调用 `revokeRefreshToken()` → 清 cookie → 返回 `R.ok()`
9. `CookieUtils` 包含 `setRefreshCookie`、`clearRefreshCookie`、`getRefreshTokenFromCookie` 三个方法，cookie 属性含 `HttpOnly=true`、`Path=/api/auth/`、`SameSite`
10. `LoginUserCacheService` 中缓存 TTL 使用 `accessExpireSeconds > 0 ? accessExpireSeconds : expireSeconds` 回退逻辑（非直接 `getExpireSeconds()`）
11. `application.yml` 的 `permit-urls` 包含 `/auth/refresh` 和 `/auth/logout`
12. `mvn -q compile` 全量 BUILD SUCCESS
13. `mvn -q test` 全量 BUILD SUCCESS（若 V1 测试因 login 响应形状变更而失败，回执中需明确记载失败测试数及原因，且其他所有测试通过）

## 15. 执行回执格式

按根目录 CLAUDE.md §7.1 的 13 项，写入 `product/auth-seam-completion/receipts/step-3-b2-execution.md`。

## 16. 测试回执格式

按根目录 CLAUDE.md §7.2 的 12 项，写入 `product/auth-seam-completion/receipts/step-3-b2-test.md`。最终结论只能是 PASSED / FAILED / BLOCKED 之一。

## 17. 明确禁止事项

- ❌ 不实现前端代码（login/refresh/logout 前端改造是 F1 范围）
- ❌ 不修改 `JwtTokenProvider` 接口或 `JwtTokenProviderImpl`
- ❌ 不修改 `JwtAuthenticationFilter`（不在此过滤器读 cookie）
- ❌ 不修改 `JwtProperties`（B1 已完成）
- ❌ 不修改 `SecurityProperties` 类本身（permitUrls 只在 YAML 改）
- ❌ 不新增 Flyway 迁移脚本（V18 已在 B1 完成）
- ❌ 不新增 Maven 依赖（只用 JDK 内置 `java.security.*` + 已有依赖）
- ❌ 不新增测试文件（B3 统一做）
- ❌ 不碰前端代码
- ❌ 不在 refresh token 中使用 JWT（refresh token 是不透明随机串，非 JWT）
- ❌ 不引入 Redis（refresh token 存 DB 表，按 D27 决策）
- ❌ 不删除 `JwtProperties.expireSeconds` 字段或 YAML 中的 `expire-seconds` 配置
- ❌ 不在 `login` 方法中删除旧的 `R<String>` 返回逻辑后再改——直接替换为新逻辑
- ❌ 执行代理若发现 V1 测试因 login 响应形状变更而失败，**不得自行修改 V1 测试**——在回执中明确记载失败数量和原因，由规划层在 B3 统一处理
