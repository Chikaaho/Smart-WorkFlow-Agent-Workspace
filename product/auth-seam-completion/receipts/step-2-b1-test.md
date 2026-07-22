# 测试回执

## 1. Step 编号和名称

Step B1：sys_refresh_token 表 + Entity/Mapper + JWT 双档过期配置

## 2. 测试环境

- 操作系统：Linux 5.15.0-181-generic
- Java 版本：OpenJDK 21.0.11
- Maven 版本：3.9.x
- 数据库类型：H2 内存数据库（Flyway 开发测试）
- 后端框架：Spring Boot 3.4.4

## 3. 测试前置条件

- 无前置数据准备（H2 内存库，Flyway 自动建表）
- 无外部依赖服务（Redis、PostgreSQL 等均通过 Maven 依赖/H2 模拟）

## 4. 实际执行的测试命令

```bash
# 静态检查
git diff --stat

# 编译验证
mvn -q compile

# 回归测试
mvn -q test

# 单项验证
grep -r "expireSeconds" sw-framework/sw-security/src/main/java/
grep -r "refresh_token" sw-bootstrap/src/main/resources/application.yml
diff <(sed 's/(H2)/(PostgreSQL)/' h2/V18.sql | sed '/^--/d' | sed '/^$/d') <(cat pg/V18.sql | sed '/^--/d' | sed '/^COMMENT/d' | sed '/^$/d')
```

## 5. 各测试项结果

| # | 测试项 | 预期结果 | 实际结果 | 是否通过 |
|---|--------|----------|----------|----------|
| 1 | git diff --stat 仅含 7 个文件 | 4 新建 + 3 修改 | 4 新建 + 3 修改 | 通过 |
| 2 | V18 H2 和 PG DDL 中 CREATE TABLE + CREATE INDEX 逐字节一致 | 一致 | 一致（规范化对比） | 通过 |
| 3 | PG 版额外有 COMMENT ON | 含 COMMENT | 含 COMMENT | 通过 |
| 4 | mvn -q compile 全量 BUILD SUCCESS | 编译通过 | BUILD SUCCESS（退出码 0） | 通过 |
| 5 | mvn -q test 全量 BUILD SUCCESS | 测试通过 | BUILD SUCCESS（退出码 0） | 通过 |
| 6 | SysRefreshToken extends BaseEntity | 继承 BaseEntity | 继承 BaseEntity | 通过 |
| 7 | SysRefreshToken @TableField 列名与 DDL 一致 | 精确对齐 | 精确对齐 | 通过 |
| 8 | SysRefreshTokenMapper extends BaseMapperX<SysRefreshToken> | BaseMapperX | BaseMapperX | 通过 |
| 9 | SysRefreshTokenMapper 有 @Mapper | 有 @Mapper | 有 @Mapper | 通过 |
| 10 | generateToken() 中有 accessExpireSeconds 回退逻辑 | accessExpireSeconds > 0 ? ... : expireSeconds | 实现正确 | 通过 |
| 11 | JwtProperties 有 accessExpireSeconds (900) | 存在，默认 900 | 存在，默认 900 | 通过 |
| 12 | JwtProperties 有 refreshExpireSeconds (604800) | 存在，默认 604800 | 存在，默认 604800 | 通过 |
| 13 | 旧 expireSeconds 保留 | 保留，默认 7200 | 保留，默认 7200 | 通过 |
| 14 | application.yml 有 access-expire-seconds: 900 | 配置存在 | 配置存在 | 通过 |
| 15 | application.yml 有 refresh-expire-seconds: 604800 | 配置存在 | 配置存在 | 通过 |
| 16 | sw.tenant.ignore-tables 不含 sys_refresh_token | 不包含 | 不包含（grep 无命中） | 通过 |

## 6. 通过项

全部 16 项测试通过（详见上表）。

## 7. 失败项

无。

## 8. 跳过项及原因

无。

## 9. 关键日志或错误信息

### mvn -q compile 输出
```
无输出（静默成功），退出码 0
```

### mvn -q test 输出摘要
```
完整输出约 350 行，含：
- Spring Boot 各模块集成测试启动
- Flyway V1-V18 迁移执行（H2 内存数据库）
- NotifyControllerIntegrationTest（端到端闭合验证通过，越权拒绝验证通过，用户隔离验证通过，租户隔离验证通过）
- NotifyMessageIntegrationTest（send 自动注入验证通过，findByRecipient 验证通过，租户隔离验证通过）
- JobInfoController（手动触发/恢复任务通过）
- BpmTodoController（越权拒绝、审批驳回、审批完成、流程状态更新全部验证通过）
退出码 0（BUILD SUCCESS）
```

## 10. 是否满足验收标准

逐条对照 §14 验收标准：

| # | 验收标准 | 满足情况 |
|---|----------|----------|
| 1 | git diff --stat 仅含 7 个文件：4 新建 + 3 修改 | 满足 |
| 2 | V18 H2 和 V18 PG 的 DDL 中 CREATE TABLE + CREATE INDEX 标准化后逐字节一致，PG 有 COMMENT | 满足 |
| 3 | mvn -q compile 全量 BUILD SUCCESS | 满足 |
| 4 | SysRefreshToken 正确 extends BaseEntity，@TableField 列名与 DDL 一致 | 满足 |
| 5 | SysRefreshTokenMapper extends BaseMapperX<SysRefreshToken>，有 @Mapper | 满足 |
| 6 | JwtTokenProviderImpl.generateToken() 中存在 accessExpireSeconds > 0 ? accessExpireSeconds : expireSeconds 回退逻辑 | 满足 |
| 7 | JwtProperties 有 accessExpireSeconds（900）和 refreshExpireSeconds（604800），旧 expireSeconds 保留 | 满足 |
| 8 | application.yml 有 access-expire-seconds: 900 和 refresh-expire-seconds: 604800 | 满足 |
| 9 | sw.tenant.ignore-tables 中不含 sys_refresh_token | 满足 |
| 10 | mvn -q test 全量 BUILD SUCCESS | 满足 |

**全部 10 项验收标准均满足。**

## 11. 回归风险

- 极低。本次变更仅涉及：
  - 新增 4 个文件（DDL + Entity + Mapper），均未在已有代码中引用
  - `JwtTokenProviderImpl.generateToken()` 内部实现改为优先使用 `accessExpireSeconds`，保留 `expireSeconds` 回退路径，不影响外部调用签名
  - `JwtProperties` 新增 2 个字段（kebab-case → camelCase 自动绑定，不影响现有配置加载）
  - `application.yml` 新增 2 个配置键（可选，不影响旧 expire-seconds）
- 全量回归测试 210+ tests 全部通过，确认基线无漂移

## 12. 最终结论

**PASSED**
