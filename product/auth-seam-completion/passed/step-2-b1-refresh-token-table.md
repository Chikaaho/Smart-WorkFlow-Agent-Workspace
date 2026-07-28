# Step B1：sys_refresh_token 表 + Entity/Mapper + JWT 双档过期配置

> 所属功能：auth-seam-completion（后端 seam 收尾）
> 域：**纯后端**（只改 `Smart-WorkFlow/`，禁止触碰前端）
> 本方案按根目录 system.md §6 的 17 项结构生成。

---

## 1. 当前状态

功能 auth-seam-completion 的 V1 已 PASSED（全量回归 210 tests，`src/main` 零改动），已取得 me/menus/权限三条 seam 的端到端测试证据。本 Step 是 B1——基础设施铺设阶段，为 B2（RefreshTokenService + login 改造 + /auth/refresh + /auth/logout）准备表结构、ORM 映射和 JWT 配置。

前置：V1 ✅ PASSED（`product/auth-seam-completion/passed/step-1-verify-existing-seams.md`）。

## 2. Step 目标

创建 `sys_refresh_token` 表（Flyway V18 双方言）、`SysRefreshToken` Entity + `SysRefreshTokenMapper`，并在 `JwtProperties` / `application.yml` 中增加 access token 与 refresh token 的双档过期配置，`JwtTokenProviderImpl` 使用新的 access 过期时间（向下兼容旧 `expireSeconds`）。

## 3. 推荐模型

```
推荐模型：deepseek-v4-pro
选择理由：涉及 Flyway 双方言建表 + JWT 安全配置 + 模块边界，触发 §2.3「数据库结构设计或迁移」+「权限、安全、认证」
是否触发升级条件：是 — Flyway 迁移 + JWT 安全配置
```

## 4. 模型选择理由

Flyway V18 需要同步编写 H2 和 PostgreSQL 两份 DDL（逐字节一致 + PG 带 COMMENT），同时修改 `sw-security` 的 JWT 配置属于安全敏感变更，需 Pro 级推理。

## 5. 已知上下文

- **D27**（refresh token 设计）：refreshToken 为不透明随机串（非 JWT），服务端存 SHA-256 哈希；`sys_refresh_token` 表存 `token_hash` + `user_id` + `expires_at` + `revoked`；accessToken 保持为短期 JWT（D26 定义：前端内存存储）
- **表前缀规则**：`sys_refresh_token` 使用 `sys_` 前缀（system 模块所有），合规
- **BaseEntity 选择**：`SysRefreshToken extends BaseEntity`（租户隔离表，含 `tenant_id`），**不**加 `sw.tenant.ignore-tables`
- **现有 JWT 配置**：`JwtProperties` 仅有单一 `expireSeconds=7200`（2h）；`JwtTokenProviderImpl.generateToken()` 用 `expireSeconds` 计算 JWT `exp` claim
- **SecurityProperties**：`sw.security.jwt` 嵌套在 `sw.security` 下，现有 `permitUrls` 含 `/auth/login`
- **Flyway 版本**：V1–V15 在 `db/migration/{vendor}/`（base），V16 在 `storage/{vendor}/`，V17 在 `job/{vendor}/`；下一个版本号 = **V18**。`sys_refresh_token` 属 system 模块（`sys_` 前缀），V18 放 base 目录 `db/migration/{h2,postgresql}/`
- **Entity/Mapper 模式**：Entity 用 `@Data @EqualsAndHashCode(callSuper=true) @TableName("...") extends BaseEntity`；Mapper 用 `@Mapper public interface XxxMapper extends BaseMapperX<Xxx> {}`
- **V17 建表风格**（最新规范）：大写 SQL 关键字、`BIGINT NOT NULL` 主键、审计列 `DEFAULT NULL`、`deleted SMALLINT NOT NULL DEFAULT 0`、`tenant_id BIGINT NOT NULL DEFAULT 0`、`version BIGINT DEFAULT NULL`、`PRIMARY KEY (id)` + `CREATE INDEX idx_... ON ... (tenant_id, deleted)`。PG 版额外 `COMMENT ON TABLE/COLUMN` 全量注释
- **SysRole 已知问题（I26）**：实体 `@TableField("is_builtin")`/`@TableField("description")` 与 V5 列重命名不一致，本 Step 不涉及 SysRole，仅作为上下文参考——新 Entity 确保列名与 Flyway DDL 一致
- **无 Redis 依赖**：本项目 `LoginUserCacheService` 引了 `RedisTemplate`（开发 H2 环境用 mock 绕过），但 refresh token 按 D27 存 DB 表、不入 Redis，本 Step 不碰 Redis

## 6. 执行前必须读取的文件

按优先级：

1. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java` — 现有 JWT 配置字段（确认 `expireSeconds` 的类型、默认值、getter/setter 模式——`@Data` 自动生成）
2. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProvider.java` — 接口方法签名（确认 `generateToken(Long userId)` 的参数和返回类型）
3. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProviderImpl.java` — `generateToken()` 实现细节（确认 `expireSeconds` 的引用方式、jjwt 链式调用链、`secretKey()` 私有方法）
4. `sw-bootstrap/src/main/resources/application.yml` — JWT 配置段（确认第几行的 `expire-seconds: 7200`）、Flyway locations 列表、MyBatis-Plus 全局配置
5. `sw-bootstrap/src/main/resources/db/migration/job/h2/V17__init_job_tables.sql` — H2 建表样板（列定义风格、索引命名）
6. `sw-bootstrap/src/main/resources/db/migration/job/postgresql/V17__init_job_tables.sql` — PG 建表样板（COMMENT ON 风格）
7. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysUser.java` — 同模块 Entity 样板（包名、注解风格、`BaseEntity` 继承）
8. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysUserMapper.java` — 同模块 Mapper 样板
9. `sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java` — 确认继承的字段列表（`id`/`createTime`/`createBy`/`updateTime`/`updateBy`/`deleted`/`tenantId`/`version`）

## 7. 允许修改的文件范围

### 新建（4 文件）

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-bootstrap/src/main/resources/db/migration/h2/V18__init_refresh_token_table.sql` | H2 建表 DDL |
| 2 | `sw-bootstrap/src/main/resources/db/migration/postgresql/V18__init_refresh_token_table.sql` | PostgreSQL 建表 DDL（含 COMMENT） |
| 3 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRefreshToken.java` | Refresh Token 实体 |
| 4 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysRefreshTokenMapper.java` | Refresh Token Mapper |

### 修改（3 文件）

| # | 文件 | 改动点 |
|---|------|--------|
| 5 | `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java` | 新增 `accessExpireSeconds` + `refreshExpireSeconds` 字段 |
| 6 | `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProviderImpl.java` | `generateToken()` 改用 `accessExpireSeconds`（向下兼容 `expireSeconds`） |
| 7 | `sw-bootstrap/src/main/resources/application.yml` | `sw.security.jwt` 下新增 `access-expire-seconds` + `refresh-expire-seconds` |

### 编译验证

- `sw-bootstrap` 模块（含 Flyway）会因 classpath 新增 SQL 自动参与编译
- `sw-framework/sw-security` 模块（修改 JwtProperties + JwtTokenProviderImpl）
- `sw-biz/sw-biz-system/sw-biz-system-biz` 模块（新增 Entity + Mapper）

## 8. 禁止修改的范围

- ❌ 任何 `src/main` 现有业务逻辑（不改 AuthController、AuthMeController、Security 过滤器链等）
- ❌ `JwtTokenProvider` **接口**（不新增方法——只改 impl 内部实现 + 不改签名）
- ❌ 前端 `Smart-WorkFlow-Web/**` 一律不碰
- ❌ 其他模块的 Entity/Mapper/Flyway 脚本
- ❌ 测试文件（本 Step 不要求测试——B3 统一做后端测试）
- ❌ 不添加 `/auth/refresh`、`/auth/logout` 端点（B2 范围）
- ❌ 不改 login 响应形状（B2 范围）

## 9. 详细执行方案

### 9.1 Flyway V18 — H2 建表

文件：`sw-bootstrap/src/main/resources/db/migration/h2/V18__init_refresh_token_table.sql`

参照 V17 H2 风格（大写关键字、`DEFAULT NULL` 审计列、`deleted SMALLINT NOT NULL DEFAULT 0`、`tenant_id BIGINT NOT NULL DEFAULT 0`）：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V18: Refresh Token 存储表 (H2)
-- ===================================================================
CREATE TABLE sys_refresh_token (
    id          BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    token_hash  VARCHAR(128) NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     SMALLINT     NOT NULL DEFAULT 0,
    create_time TIMESTAMP    DEFAULT NULL,
    create_by   BIGINT       DEFAULT NULL,
    update_time TIMESTAMP    DEFAULT NULL,
    update_by   BIGINT       DEFAULT NULL,
    deleted     SMALLINT     NOT NULL DEFAULT 0,
    tenant_id   BIGINT       NOT NULL DEFAULT 0,
    version     BIGINT       DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_srt_user_tenant ON sys_refresh_token (user_id, tenant_id);
CREATE UNIQUE INDEX uk_srt_token_hash ON sys_refresh_token (token_hash);
```

关键设计：
- `token_hash`：存 SHA-256 哈希（64 字符十六进制），`VARCHAR(128)` 给余量；加唯一索引 `uk_srt_token_hash`（查找 + 防重复）
- `user_id`：关联 `sys_user.id`，**不加 FK 约束**（项目惯例：关联表不加 DB 级 FK，如 `sw_job_log.job_id` 也无 FK）
- `expires_at`：`NOT NULL`，由 RefreshTokenService（B2）写入 = `now + refreshExpireSeconds`
- `revoked`：`0` = 有效，`1` = 已撤销（logout 或 refresh 轮换后旧 token 置 1）
- `srt` = `sys_refresh_token` 缩写，用于索引命名前缀

### 9.2 Flyway V18 — PostgreSQL 建表

文件：`sw-bootstrap/src/main/resources/db/migration/postgresql/V18__init_refresh_token_table.sql`

参照 V17 PG 风格：DDL 与 H2 逐字节一致（表名/列名/类型/约束完全相同），**额外追加** `COMMENT ON TABLE` 和 `COMMENT ON COLUMN`：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V18: Refresh Token 存储表 (PostgreSQL)
-- ===================================================================
CREATE TABLE sys_refresh_token (
    id          BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    token_hash  VARCHAR(128) NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     SMALLINT     NOT NULL DEFAULT 0,
    create_time TIMESTAMP    DEFAULT NULL,
    create_by   BIGINT       DEFAULT NULL,
    update_time TIMESTAMP    DEFAULT NULL,
    update_by   BIGINT       DEFAULT NULL,
    deleted     SMALLINT     NOT NULL DEFAULT 0,
    tenant_id   BIGINT       NOT NULL DEFAULT 0,
    version     BIGINT       DEFAULT NULL,
    PRIMARY KEY (id)
);

COMMENT ON TABLE  sys_refresh_token             IS 'Refresh Token 存储表';
COMMENT ON COLUMN sys_refresh_token.id          IS '主键';
COMMENT ON COLUMN sys_refresh_token.user_id     IS '关联用户 ID（sys_user.id）';
COMMENT ON COLUMN sys_refresh_token.token_hash  IS 'Refresh Token 的 SHA-256 哈希值';
COMMENT ON COLUMN sys_refresh_token.expires_at  IS '过期时间';
COMMENT ON COLUMN sys_refresh_token.revoked     IS '是否已撤销（0=有效, 1=已撤销）';
COMMENT ON COLUMN sys_refresh_token.create_time IS '创建时间';
COMMENT ON COLUMN sys_refresh_token.create_by   IS '创建人';
COMMENT ON COLUMN sys_refresh_token.update_time IS '更新时间';
COMMENT ON COLUMN sys_refresh_token.update_by   IS '更新人';
COMMENT ON COLUMN sys_refresh_token.deleted     IS '逻辑删除标记（0=未删, 1=已删）';
COMMENT ON COLUMN sys_refresh_token.tenant_id   IS '租户 ID';
COMMENT ON COLUMN sys_refresh_token.version     IS '乐观锁版本号';

CREATE INDEX idx_srt_user_tenant ON sys_refresh_token (user_id, tenant_id);
CREATE UNIQUE INDEX uk_srt_token_hash ON sys_refresh_token (token_hash);
```

### 9.3 SysRefreshToken Entity

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRefreshToken.java`

包名：`com.sw.ck.system.entity`（与 `SysUser`、`SysRole` 等同包）

```java
package com.sw.ck.system.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_refresh_token")
public class SysRefreshToken extends BaseEntity {

    @TableField("user_id")
    private Long userId;

    @TableField("token_hash")
    private String tokenHash;

    @TableField("expires_at")
    private LocalDateTime expiresAt;

    @TableField("revoked")
    private Integer revoked;
}
```

注意：
- 使用**显式 `@TableField`**（与 `SysUser` 同风格），列名与 DDL 精确对齐
- `extends BaseEntity`（租户隔离表），继承 `id`/`createTime`/`createBy`/`updateTime`/`updateBy`/`deleted`/`tenantId`/`version`
- `revoked` 使用 `Integer` 类型（匹配 `SMALLINT`），`LocalDateTime` 匹配 `TIMESTAMP`
- 不写 `implements Serializable`（`BaseEntity` 已实现）

### 9.4 SysRefreshTokenMapper

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysRefreshTokenMapper.java`

包名：`com.sw.ck.system.mapper`

```java
package com.sw.ck.system.mapper;

import com.sw.ck.common.mapper.BaseMapperX;
import com.sw.ck.system.entity.SysRefreshToken;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysRefreshTokenMapper extends BaseMapperX<SysRefreshToken> {
}
```

完全遵循 `SysUserMapper` / `SysRoleMapper` 模式：`@Mapper` + `extends BaseMapperX<Entity>` + 空 body。

### 9.5 JwtProperties — 新增双档过期字段

文件：`sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java`

现有字段：
```java
private String secret;
private long expireSeconds = 7200;
```

新增在 `expireSeconds` 之后：

```java
/**
 * Access Token 过期时间（秒），默认 15 分钟。
 * JwtTokenProviderImpl.generateToken() 优先使用此值；若为 0 则回退到 {@link #expireSeconds}。
 */
private long accessExpireSeconds = 900;

/**
 * Refresh Token 过期时间（秒），默认 7 天。
 * 用于设置 sys_refresh_token.expires_at = now + refreshExpireSeconds。
 * Refresh Token 本身为不透明随机串（非 JWT），此值仅控制 DB 中 expires_at 列的写入。
 */
private long refreshExpireSeconds = 604800;
```

- `accessExpireSeconds` 默认 900（15 分钟）——当前 7200（2h）过长，缩短减少 access 泄露窗口
- `refreshExpireSeconds` 默认 604800（7 天）——Refresh Token 有效时长
- 保留 `expireSeconds = 7200`（不删除、不改默认值），作为向下兼容的回退项

### 9.6 JwtTokenProviderImpl — 使用新的 access 过期时间

文件：`sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProviderImpl.java`

找到 `generateToken()` 方法中引用 `jwtProperties.getExpireSeconds()` 的位置（当前约 3 行：`now`/`exp`/`signWith`），将过期计算改为：

```java
long expireSeconds = jwtProperties.getAccessExpireSeconds() > 0
        ? jwtProperties.getAccessExpireSeconds()
        : jwtProperties.getExpireSeconds();
```

即：若配置了 `access-expire-seconds`（值 > 0），优先使用；否则回退到旧 `expire-seconds`。

实现时：
1. 在 `generateToken()` 方法体开头（`Date now = new Date();` 之前或之后）加入上述三元判断
2. 将原来的 `jwtProperties.getExpireSeconds()` 替换为局部变量 `expireSeconds`
3. 其余逻辑（`subject`/`issuedAt`/`expiration`/`signWith`/`compact`）**不改变**

### 9.7 application.yml — 新增 JWT 配置键

文件：`sw-bootstrap/src/main/resources/application.yml`

在 `sw.security.jwt` 块中，`expire-seconds: 7200` 之后追加：

```yaml
        access-expire-seconds: 900
        refresh-expire-seconds: 604800
```

注意缩进对齐（`jwt:` 是 `security:` 的子节点，`expire-seconds` 等是 `jwt:` 的子节点，使用 6 空格或 4 空格缩进——以实际文件缩进为准，与 `expire-seconds` 对齐）。

### 9.8 编译验证

```bash
# 增量编译（模块级）
cd Smart-WorkFlow
mvn -q compile -pl sw-framework/sw-security -am    # security 模块 + 依赖
mvn -q compile -pl sw-biz/sw-biz-system/sw-biz-system-biz   # system-biz 模块
mvn -q compile -pl sw-bootstrap                     # bootstrap（含 Flyway classpath）

# 全量编译
mvn -q compile
```

编译通过即证明：YAML 配置绑定正确、Entity/Mapper 注解正确、Flyway classpath 扫描无误。

## 10. 关键实现约束

- **Flyway 双方言必须字节级一致**：H2 和 PG 的 DDL（CREATE TABLE + CREATE INDEX）完全相同，PG 仅追加 COMMENT ON（V17 已验证此模式可行）
- **`sys_refresh_token` 不加 `sw.tenant.ignore-tables`**：`extends BaseEntity` = 租户隔离表，`TenantLineHandler` 自动注入 `tenant_id`
- **`token_hash` 使用 `UNIQUE INDEX`**：查找 refresh token 时按 hash 查，唯一索引保证性能 + 数据完整性
- **`user_id` 不加 FK 约束**：遵循项目惯例（`sw_job_log.job_id` 也无 FK），应用层保证引用完整性
- **不修改 `JwtTokenProvider` 接口**：仅改 `JwtTokenProviderImpl` 内部实现，不新增接口方法，保持签名不变
- **保留 `expireSeconds` 字段和配置键**：不删除、不改默认值，作为向下兼容回退
- **Entity 列名与 DDL 精确对齐**：使用显式 `@TableField("column_name")`，避免 I26 式的列名不一致
- **不引入新依赖**：所有新增文件均使用现有依赖（MyBatis-Plus、Lombok、jjwt）

## 11. 边界情况

- **配置键名转换**：`application.yml` 中 `access-expire-seconds`（kebab-case）→ Spring Boot 自动绑到 `JwtProperties.accessExpireSeconds`（camelCase）。确认 `@ConfigurationProperties(prefix = "sw.security.jwt")` 支持 Relaxed Binding
- **accessExpireSeconds = 0**：三元表达式回退到 `expireSeconds`，防止 token 立即过期
- **token_hash 长度**：SHA-256 输出 256 bit → 64 字符十六进制，`VARCHAR(128)` 有余量
- **revoked 列**：使用 `SMALLINT`（与 `deleted` 一致），取值为 `0`/`1`
- **`@TableLogic` 对 `deleted` 列生效**：`BaseEntity.deleted` 已有 `@TableLogic`，查询 `SysRefreshToken` 时 MyBatis-Plus 自动追加 `WHERE deleted=0`
- **`@Version` 对 `version` 列生效**：`BaseEntity.version` 已有 `@Version`，更新时 MyBatis-Plus 自动乐观锁检查

## 12. 风险和回滚方案

- **风险 1：`expireSeconds` 废弃导致全部 token 用短过期**：`JwtTokenProviderImpl` 已实现回退逻辑（`accessExpireSeconds > 0 ? ... : expireSeconds`），若 `access-expire-seconds` 未配置或为 0，行为不变
- **风险 2：application.yml 中已存在同名 key**：检查现有 YAML 确认无 `access-expire-seconds` / `refresh-expire-seconds`
- **风险 3：Flyway V18 与现有数据库冲突**：`sys_refresh_token` 表名/索引名全新，无冲突可能
- **回滚**：删除 4 个新建文件、回退 3 个修改文件的改动、`git checkout` 恢复。无 main 逻辑变更，回滚零副作用

## 13. 测试方案

### 13.1 静态检查

- `git diff --stat` 确认仅改 7 个文件（4 新建 + 3 修改），**不碰任何其他文件**
- `grep -r "expireSeconds" sw-framework/sw-security/src/main/java/` 确认旧字段仍存在（未被删除）
- `grep -r "sys_refresh_token" sw-bootstrap/src/main/resources/db/migration/` 确认仅 V18 文件中有此表名
- 确认 `sw.tenant.ignore-tables` 中**不含** `sys_refresh_token`

### 13.2 单元测试

本 Step 不要求新增测试（B3 统一覆盖）。但必须验证：

- `mvn -q compile` 全量通过（YAML 配置绑定正确性）
- `mvn -q test` 全量回归 ≥ 210 tests BUILD SUCCESS（基线不减少）

### 13.3 集成测试

不要求（B3 统一做）。

### 13.4 手工验证

不要求。

### 13.5 回归检查

- `mvn -q test` 全量：测试计数 **≥ 210**（V1 后基线 210，本 Step 不增减测试），BUILD SUCCESS
- V1 新增的 7 个测试（`AuthControllerTest` 3 + `AuthFlowIntegrationTest` 4）仍全绿
- `mvn -q compile` 全量模块编译通过（含 `sw-bootstrap`）

## 14. 验收标准（逐条可验证布尔条件）

1. `git diff --stat` 仅含 7 个文件：4 新建（V18 H2/PG + Entity + Mapper）+ 3 修改（JwtProperties + JwtTokenProviderImpl + application.yml）
2. V18 H2 和 V18 PG 的 DDL 中 CREATE TABLE + CREATE INDEX 部分**逐字节一致**（列名、类型、约束、默认值完全相同），PG 版额外有 COMMENT ON
3. `mvn -q compile` 全量 BUILD SUCCESS（YAML → `@ConfigurationProperties` 绑定成功）
4. `SysRefreshToken` 正确 `extends BaseEntity`（非 `BaseEntityNoTenant`），`@TableField` 注解的列名与 DDL 全部一致
5. `SysRefreshTokenMapper extends BaseMapperX<SysRefreshToken>`，有 `@Mapper` 注解
6. `JwtTokenProviderImpl.generateToken()` 中存在 `accessExpireSeconds > 0 ? accessExpireSeconds : expireSeconds` 的回退逻辑（或等价实现）
7. `JwtProperties` 有 `accessExpireSeconds`（默认 900）和 `refreshExpireSeconds`（默认 604800），旧 `expireSeconds` 仍保留
8. `application.yml` 的 `sw.security.jwt` 块中有 `access-expire-seconds: 900` 和 `refresh-expire-seconds: 604800`
9. `sw.tenant.ignore-tables` 列表中**不含** `sys_refresh_token`
10. `mvn -q test` 全量 BUILD SUCCESS，测试计数 ≥ 210（基线不减少）

## 15. 执行回执格式

按根目录 system.md §7.1 的 13 项，写入 `product/auth-seam-completion/receipts/step-2-b1-execution.md`。

## 16. 测试回执格式

按根目录 system.md §7.2 的 12 项，写入 `product/auth-seam-completion/receipts/step-2-b1-test.md`。最终结论只能是 PASSED / FAILED / BLOCKED 之一。

## 17. 明确禁止事项

- ❌ 不实现 `RefreshTokenService`（B2 范围）
- ❌ 不修改 `AuthController.login`（B2 范围）
- ❌ 不添加 `/auth/refresh`、`/auth/logout` 端点（B2 范围）
- ❌ 不修改 `JwtTokenProvider` 接口
- ❌ 不删除 `JwtProperties.expireSeconds` 字段或其 application.yml 配置
- ❌ 不在 `sw.tenant.ignore-tables` 中添加 `sys_refresh_token`
- ❌ 不引入新 Maven 依赖
- ❌ 不碰前端代码
- ❌ 不新增测试文件（B3 统一做）
- ❌ 不在 Flyway 脚本中使用 `IF NOT EXISTS`（V1–V17 均未使用）
