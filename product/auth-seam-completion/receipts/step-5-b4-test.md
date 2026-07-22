# 测试回执

## 1. Step 编号和名称
Step B4：修复 refresh token 家族撤销事务回滚

## 2. 测试环境
- **数据库**：H2 内存数据库（MODE=PostgreSQL）
- **Java 版本**：OpenJDK 64-Bit Server VM (Java 21)
- **操作系统**：Linux 5.15.0-181-generic
- **构建工具**：Apache Maven
- **测试框架**：JUnit 5 + AssertJ

## 3. 测试前置条件
- `mvn clean install -DskipTests` 已完成，所有模块编译通过
- H2 内存数据库自动创建 `sys_refresh_token` 表
- 每个 `@BeforeEach` 清空 `sys_refresh_token` 表确保隔离

## 4. 实际执行的测试命令
```bash
mvn test
```

## 5. 各测试项结果

### RefreshTokenServiceTest（12 tests）
| 测试项 | 预期 | 实际 | 通过 |
|--------|------|------|------|
| createRefreshToken: 生成 64 字符 hex + SHA-256 存入 DB | PASS | PASS | ✅ |
| createRefreshToken: 不同调用不同 token | PASS | PASS | ✅ |
| rotateRefreshToken: 正常轮换 | PASS | PASS | ✅ |
| rotateRefreshToken: 重放 → 家族撤销 + 抛异常，其他 token 也被撤销 | PASS | PASS | ✅ |
| rotateRefreshToken: 不存在的 token → 抛异常 | PASS | PASS | ✅ |
| revokeRefreshToken: 正常撤销 | PASS | PASS | ✅ |
| revokeRefreshToken: null → 幂等 | PASS | PASS | ✅ |
| revokeRefreshToken: 空串 → 幂等 | PASS | PASS | ✅ |
| revokeRefreshToken: 不存在 → 幂等 | PASS | PASS | ✅ |
| findUserIdByToken: 正常返回 userId | PASS | PASS | ✅ |
| findUserIdByToken: 不存在 → null | PASS | PASS | ✅ |
| findUserIdByToken: null 输入 → null | PASS | PASS | ✅ |

### AuthFlowIntegrationTest（5 tests）
| 测试项 | 预期 | 实际 | 通过 |
|--------|------|------|------|
| 登录成功 → 200 + access/refresh token | PASS | PASS | ✅ |
| 无 token 调 /me → 401 | PASS | PASS | ✅ |
| 错误密码登录 → code≠0 | PASS | PASS | ✅ |
| 不存在的用户 → code≠0 | PASS | PASS | ✅ |
| /auth/refresh 正常轮换 | PASS | PASS | ✅ |

### 全量回归（462 tests, 0 failures, 0 errors, 0 skipped）
所有模块（system、form、bpm、notify、job、storage）的既有测试全部通过，无回归。

## 6. 通过项
全部 462 个测试用例通过。

## 7. 失败项
无。

## 8. 跳过项及原因
无。

## 9. 关键日志或错误信息
测试日志中记录了关键的 REPLAY DETECTED 日志行，以及家族撤销 SQL：
```
REPLAY DETECTED: revoked refresh token reused, userId=1, tokenId=2079847520149200897
==>  Preparing: UPDATE sys_refresh_token SET revoked=? WHERE deleted=0 AND (user_id = ? AND revoked = ?)
==> Parameters: 1(Integer), 1(Long), 0(Integer)
<==    Updates: 1
```

表明重放检测触发后，家族撤销 SQL 已执行（Update 影响 1 行），后续另一个 token 被重放时触发了同样的 REPLAY DETECTED 路径。

## 10. 是否满足验收标准

逐条对照方案 §14（修复验收标准）：

| # | 验收标准 | 验证结果 |
|---|----------|----------|
| 1 | `RefreshTokenService.rotateRefreshToken()` 中重放检测路径（已撤销 token 检测）的 `revokeAllForUser()` 使用 `TransactionTemplate` + `PROPAGATION_REQUIRES_NEW` 在独立事务中执行 | 确认：第 98-101 行已改为 `new TransactionTemplate(transactionManager) {{ setPropagationBehavior(...REQUIRES_NEW); }}.executeWithoutResult(...)` |
| 2 | 过期 token 清理路径的 `revokeTokenById()` 同样使用独立事务 | 确认：第 107-110 行已改为相同模式 |
| 3 | 正常轮换路径的 `revokeTokenById()` 不受影响（仍在外层 `@Transactional` 中） | 确认：第 114 行保持原样 `revokeTokenById(existing.getId())`，未包裹 TransactionTemplate |
| 4 | 新增 `@RequiredArgsConstructor` 兼容的 `PlatformTransactionManager transactionManager` 字段 | 确认：第 38 行 `private final PlatformTransactionManager transactionManager;` |
| 5 | 无需新增 Maven 依赖 | 确认：`PlatformTransactionManager` 等类来自 `spring-tx`（已存在于 classpath） |
| 6 | 不修改公开 API 签名 | 确认：`createRefreshToken`、`rotateRefreshToken`、`revokeRefreshToken`、`findUserIdByToken` 签名均未变 |
| 7 | 不修改 `AuthController` / `CookieUtils` / `TokenResponse` / `JwtProperties` | 确认：未触碰这些文件 |
| 8 | 测试用例覆盖：重放攻击后家族撤销已生效（anotherToken 也应被撤销） | 确认：`rotateRefreshToken_replayAttack_shouldRevokeAllForUser` 新增第二个 `assertThatThrownBy` 断言 |
| 9 | 测试配置类中 `RefreshTokenService` Bean 注入 `PlatformTransactionManager` | 确认：RefreshTokenServiceTest.TestConfig 和 AuthFlowIntegrationTest.TestConfig 均已注入 |
| 10 | 全量回归测试通过 | 确认：462 tests, 0 failures, BUILD SUCCESS |

## 11. 回归风险
- 低风险。核心改动仅在两条异常路径中引入 `TransactionTemplate(REQUIRES_NEW)`，正常路径完全不受影响。
- 所有 462 个既有测试全部通过，无回归。
- `AuthFlowIntegrationTest` 覆盖了完整的 auth 流程（登录 → refresh → 轮换），验证后端接口行为正确。

## 12. 最终结论
PASSED
