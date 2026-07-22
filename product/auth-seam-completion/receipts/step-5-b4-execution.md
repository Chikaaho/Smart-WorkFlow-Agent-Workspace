# 执行回执

## 1. Step 编号和名称
Step B4：修复 refresh token 家族撤销事务回滚

## 2. 使用模型
deepseek-v4-flash

## 3. 实际读取的文件
1. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java` — 确认当前代码
2. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/service/RefreshTokenServiceTest.java` — 确认当前测试代码
3. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java` — 定位编译错误

## 4. 实际修改的文件
1. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java` — 修改（新增 import、新增字段、修改两处撤销调用）
2. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/service/RefreshTokenServiceTest.java` — 修改（更新 TestConfig Bean 签名、更新重放测试断言）
3. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java` — 修改（修复 TestConfig Bean 签名，非预期变更但编译需要）

## 5. 每个文件的修改摘要

### RefreshTokenService.java
- **新增 import**：`PlatformTransactionManager`、`TransactionDefinition`、`TransactionTemplate`
- **新增字段**：`private final PlatformTransactionManager transactionManager;`（放在 `sysRefreshTokenMapper` 和 `secureRandom` 之间，通过 `@RequiredArgsConstructor` 自动构造注入）
- **修改第 94 行（重放检测路径）**：`revokeAllForUser(existing.getUserId())` 改为 `TransactionTemplate` 包装，使用 `PROPAGATION_REQUIRES_NEW` 在独立事务中执行
- **修改第 101 行（过期清理路径）**：`revokeTokenById(existing.getId())` 改为 `TransactionTemplate` 包装，使用 `PROPAGATION_REQUIRES_NEW` 在独立事务中执行
- **不改动第 105 行**（正常轮换路径的 `revokeTokenById`）：该路径走正常流程，外层 `@Transactional` 提交时一起提交，不存在回滚问题

### RefreshTokenServiceTest.java
- **TestConfig.refreshTokenService Bean**：增加 `PlatformTransactionManager transactionManager` 参数
- **rotateRefreshToken_replayAttack_shouldRevokeAllForUser 测试方法**：增加第二个断言，验证家族撤销后同一用户的其他 token 也已被撤销

### AuthFlowIntegrationTest.java（编译修复）
- **TestConfig.refreshTokenService Bean**：增加 `PlatformTransactionManager transactionManager` 参数（与 RefreshTokenServiceTest 同步变更）

## 6. 实际执行的命令
```bash
cd /data/reasonix/files/Smart-WorkFlow
mvn clean install -DskipTests -q
mvn -q compile
mvn test
```

## 7. 命令输出摘要
- `mvn clean install -DskipTests -q`：BUILD SUCCESS（无输出）
- `mvn -q compile`：BUILD SUCCESS（无输出）
- `mvn test`：BUILD SUCCESS（总测试数 462，全部通过，0 失败，0 错误，0 跳过）

具体测试模块计数：
- AuthControllerTest：3 tests
- AuthFlowIntegrationTest：5 tests
- RefreshTokenServiceTest：12 tests
- 其余 form、bpm、notify、job 等模块：442 tests

## 8. 与原方案的偏差
**偏差 1**：需要额外修改 `AuthFlowIntegrationTest.java`
- **原因**：`RefreshTokenService` 的构造器签名从 `(SysRefreshTokenMapper)` 变为 `(SysRefreshTokenMapper, PlatformTransactionManager)`，`AuthFlowIntegrationTest.TestConfig` 中也有一个 `refreshTokenService` Bean 使用了旧签名，导致编译失败。
- **处理**：按相同模式修正该 Bean 的签名。
- **影响**：无功能影响，纯编译修复。

## 9. 遇到的问题
编译阶段遇到 `AuthFlowIntegrationTest.java` 编译失败，原因同上。修复后编译和测试全部通过。

## 10. 未完成内容
无。方案中所有要求均已实现。

## 11. 风险和注意事项
- `TransactionTemplate` 的 `PROPAGATION_REQUIRES_NEW` 会挂起外层事务，新事务独立提交。这确保撤销操作在异常抛出前已持久化，符合安全目标。
- 需要注意：新事务使用的 DataSource 必须与外层事务相同——由于 `PlatformTransactionManager` 来自同一个 `DataSourceTransactionManager`，指向同一个 H2/PostgreSQL 数据源，不存在跨数据源问题。
- 正常轮换路径（第 114 行）的 `revokeTokenById` 保持在外层事务中，这是正确的——正常轮换不需要独立提交，且失败时应整体回滚。

## 12. Git diff 摘要
3 files changed, ~20 insertions, ~10 deletions
- RefreshTokenService.java：+3 imports, +1 field, +6 lines (TransactionTemplate wrapper for two revocation calls)
- RefreshTokenServiceTest.java：+2 lines (new constructor param + enhanced test assertion)
- AuthFlowIntegrationTest.java：+2 lines (new constructor param for Bean)

## 13. 建议执行的测试
- RefreshTokenServiceTest 全量（12 用例，本次重点验证重放检测增强断言）
- AuthFlowIntegrationTest（5 用例，验证完整 auth 流程不受影响）
