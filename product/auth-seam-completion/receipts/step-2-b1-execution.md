# 执行回执

## 1. Step 编号和名称

Step B1：sys_refresh_token 表 + Entity/Mapper + JWT 双档过期配置

## 2. 使用模型

deepseek-v4-flash（当前会话模型）

## 3. 实际读取的文件

1. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java` — 现有 JWT 配置字段
2. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProvider.java` — 接口签名
3. `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProviderImpl.java` — generateToken() 实现
4. `sw-bootstrap/src/main/resources/application.yml` — JWT 配置段、Flyway locations
5. `sw-bootstrap/src/main/resources/db/migration/job/h2/V17__init_job_tables.sql` — H2 建表样板
6. `sw-bootstrap/src/main/resources/db/migration/job/postgresql/V17__init_job_tables.sql` — PG 建表样板
7. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysUser.java` — Entity 样板
8. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysUserMapper.java` — Mapper 样板
9. `sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java` — 基类字段
10. `sw-framework/sw-common/src/main/java/com/sw/ck/common/mapper/BaseMapperX.java` — Mapper 基类

全部读取完成。

## 4. 实际修改的文件

### 新建（4 文件）

| # | 文件 | 类型 |
|---|------|------|
| 1 | `sw-bootstrap/src/main/resources/db/migration/h2/V18__init_refresh_token_table.sql` | 新建 |
| 2 | `sw-bootstrap/src/main/resources/db/migration/postgresql/V18__init_refresh_token_table.sql` | 新建 |
| 3 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRefreshToken.java` | 新建 |
| 4 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysRefreshTokenMapper.java` | 新建 |

### 修改（3 文件）

| # | 文件 | 类型 |
|---|------|------|
| 5 | `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java` | 修改 |
| 6 | `sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProviderImpl.java` | 修改 |
| 7 | `sw-bootstrap/src/main/resources/application.yml` | 修改 |

## 5. 每个文件的修改摘要

### 文件 1: V18 H2 DDL
- 新文件：H2 方言 `sys_refresh_token` 建表 + `idx_srt_user_tenant` 索引 + `uk_srt_token_hash` 唯一索引
- 完全遵循 V17 风格（大写关键字、`DEFAULT NULL` 审计列、`deleted SMALLINT NOT NULL DEFAULT 0`、`tenant_id BIGINT NOT NULL DEFAULT 0`）

### 文件 2: V18 PG DDL
- 新文件：与 H2 DDL 逐字节一致的 `CREATE TABLE + CREATE INDEX`，额外追加 `COMMENT ON TABLE/COLUMN` 全量注释

### 文件 3: SysRefreshToken Entity
- 新文件：`@TableName("sys_refresh_token")`，`extends BaseEntity`
- 字段：`userId`、`tokenHash`、`expiresAt`（LocalDateTime）、`revoked`（Integer）
- 使用显式 `@TableField("column_name")` 与 DDL 精确对齐

### 文件 4: SysRefreshTokenMapper
- 新文件：`extends BaseMapperX<SysRefreshToken>`，带 `@Mapper`

### 文件 5: JwtProperties.java
- 新增 `accessExpireSeconds`（默认 900，15 分钟）
- 新增 `refreshExpireSeconds`（默认 604800，7 天）
- 保留旧 `expireSeconds`（7200，未修改）
- 增加 Javadoc 注释，说明回退逻辑

### 文件 6: JwtTokenProviderImpl.java
- `generateToken()` 方法新增 `expireSeconds` 局部变量
- 优先使用 `accessExpireSeconds > 0 ? accessExpireSeconds : expireSeconds` 回退
- 原 `jwtProperties.getExpireSeconds()` 直接乘法替换为变量引用

### 文件 7: application.yml
- `sw.security.jwt` 块下新增 `access-expire-seconds: 900`
- 新增 `refresh-expire-seconds: 604800`
- 缩进与原 `expire-seconds` 对齐（8 空格）

## 6. 实际执行的命令

```bash
mvn -q compile          # 全量编译
mvn -q test             # 全量测试
```

## 7. 命令输出摘要

### mvn -q compile
- 输出：无（静默成功）
- 退出码：0（BUILD SUCCESS）

### mvn -q test
- 输出：全量回归测试，含 Spring Boot 启动、Flyway 迁移、各模块集成测试
- 退出码：0（BUILD SUCCESS）
- 关键观察：Flyway V18 自动在 H2 内存数据库中执行 `sys_refresh_token` 表创建，无任何迁移错误

## 8. 与原方案的偏差

无偏差。完全按方案执行。

## 9. 遇到的问题

1. **工作区隔离问题**：当前执行环境为 git 工作区（worktree），初始不含源代码。通过 `git read-tree` 从 `origin/develop` 加载代码后操作正常，未影响方案执行质量。

## 10. 未完成内容

无。方案要求全部完成。

## 11. 风险和注意事项

- `accessExpireSeconds` 新值 900 秒（15 分钟）比原 `expireSeconds` 7200 秒（2 小时）大幅缩短——这是对接 refresh token 机制的正确设计，但现有 login 流程产生的 access token 将更快过期，需 B2 中 RefreshTokenService 完成后端支持
- PG 方言的 V18 脚本仅在生产/本地 PostgreSQL 环境下执行，当前开发使用 H2 内存库

## 12. Git diff 摘要

- 修改文件：3
- 新建文件：4
- 新增行数：18（3 个修改文件）
- 关键变更：
  - `JwtProperties.java`：+12 行（2 个新字段）
  - `JwtTokenProviderImpl.java`：+4/-1 行（accessExpireSeconds 回退逻辑）
  - `application.yml`：+2 行（2 个新配置键）

## 13. 建议执行的测试

- 编译验证：已执行 `mvn -q compile` 全量通过
- 回归测试：已执行 `mvn -q test` 全量通过
- 建议在 B3 阶段增加：
  - `JwtProperties` 配置绑定测试（kebab-case → camelCase）
  - `JwtTokenProviderImpl.generateToken()` 配合新配置键的单元测试
  - `SysRefreshTokenMapper` 基本 CRUD 测试
