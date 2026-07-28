# Step B4：修复 refresh token 家族撤销事务回滚

> 所属功能：auth-seam-completion（后端 seam 收尾）
> 域：**纯后端**（只改 `Smart-WorkFlow/`，禁止触碰前端）
> 本方案按根目录 system.md §6 的 17 项结构生成。
> **紧急修复**：B3 测试暴露的 B2 生产代码安全缺陷。

---

## 1. 当前状态

B3 ✅ PASSED（4 个测试文件，27 用例全部通过，462 全量测试 BUILD SUCCESS）。

B3 测试暴露了一个 B2 生产代码中的安全缺陷：`RefreshTokenService.rotateRefreshToken()` 的重放检测中，`revokeAllForUser` 与 `throw BaseException` 在同一个 `@Transactional` 边界内，导致家族撤销 SQL 在异常抛出后被事务回滚。**重放攻击的核心防线（家族撤销）形同虚设。**

B4 是本功能的紧急修复 Step，完成后进入前端 F1+F2。

前置：B3 ✅ PASSED（`product/auth-seam-completion/passed/step-4-b3-backend-tests.md`）。

## 2. Step 目标

修复 `RefreshTokenService.rotateRefreshToken()` 中 `revokeAllForUser`（重放检测）和 `revokeTokenById`（过期清理）的事务边界——使用 `Propagation.REQUIRES_NEW` 确保撤销操作在独立事务中提交，不受外层 `BaseException` 回滚影响。同步修复 `RefreshTokenServiceTest` 中因事务回滚被移除的家族撤销断言。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：单文件 2 处调用点改写 + 2 个代理方法 + 测试断言恢复，不涉及新业务逻辑、不涉及架构变更、修复模式明确（Spring 自注入 + REQUIRES_NEW）
是否触发升级条件：否（虽然涉及安全代码，但修复方式为确定性的 Spring 事务传播机制应用，无歧义和设计权衡）
```

## 4. 模型选择理由

修复工作是：（1）添加 Spring 自注入（`@Lazy @Autowired private RefreshTokenService self`），（2）将两处 `revokeXxx()` 调用改为 `self.revokeXxxInNewTransaction()`，（3）新增两个 `@Transactional(propagation = REQUIRES_NEW)` 代理方法，（4）恢复测试中因事务回滚被移除的断言。均为 Spring 事务管理的确定性模式，Flash 即可。

## 5. 已知上下文

- **问题根因**：`rotateRefreshToken()` 方法级 `@Transactional(rollbackFor = Exception.class)`。重放检测走 `revokeAllForUser()` → `throw BaseException(401)`，异常导致整个事务回滚，`revokeAllForUser` 的 UPDATE 被撤销
- **同样受影响的代码路径**：过期 token 处理（`revokeTokenById()` → `throw BaseException`），但过期 token 天然不可用于 refresh，影响低
- **Spring 自注入模式**：由于 Spring AOP 基于代理，同类内 `this.method()` 调用不触发事务拦截。需要在类中注入自身的代理引用（`@Lazy @Autowired private RefreshTokenService self`），通过 `self.method()` 走代理获取 `REQUIRES_NEW` 事务行为
- **项目使用 Lombok `@RequiredArgsConstructor`**：只生成 `final` 字段的构造参数。自注入字段用 `@Autowired` 字段注入（加 `@Lazy` 打破循环依赖），Lombok 会跳过非 `final` 字段
- **RefreshTokenService 当前代码**（200 行，位于 `sw-biz-system-biz`）：4 个公开方法 + 2 个内部方法（`revokeTokenById`、`revokeAllForUser`）+ 1 个 record
- **RefreshTokenServiceTest 当前代码**（291 行，B3 新增）：12 用例，其中 `rotateRefreshToken_replayAttack_shouldRevokeAllForUser` 因事务回滚问题仅验证了异常抛出，未验证家族撤销效果（第 142-148 行有注释说明）
- **项目已有 `spring-tx` 依赖**（Spring Boot 自动配置包含 `PlatformTransactionManager`）
- **后端 system.md §0.0 执行层角色约束**：执行代理严格执行方案，发现问题记录回执，不得越权规划

## 6. 执行前必须读取的文件

1. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java` — 当前代码全貌（特别是 `rotateRefreshToken` 方法第 91-102 行 + `revokeTokenById` + `revokeAllForUser` 内部方法）
2. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/service/RefreshTokenServiceTest.java` — 当前测试（特别是第 132-149 行重放测试用例 + 第 219-290 行 TestConfig）
3. `sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/BaseException.java` — 确认是否 extends RuntimeException（回滚触发条件）
4. `sw-bootstrap/src/main/resources/application.yml` — Spring 事务配置参考

## 7. 允许修改的文件范围

| # | 文件 | 改动点 |
|---|------|--------|
| 1 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java` | 新增自注入字段 + 2 个 `REQUIRES_NEW` 代理方法 + 2 处调用点改写 |
| 2 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/service/RefreshTokenServiceTest.java` | 重放测试恢复家族撤销断言 + 新增过期 token 撤销持久化断言 |

## 8. 禁止修改的范围

- ❌ 任何前端 `Smart-WorkFlow-Web/**`
- ❌ `AuthController.java` / `CookieUtils.java` / `TokenResponse.java` / `JwtProperties.java`
- ❌ 其他测试文件（AuthControllerTest / AuthFlowIntegrationTest / CookieUtilsTest）
- ❌ Flyway 迁移脚本
- ❌ `application.yml` / Spring 事务管理器配置
- ❌ 不改变 `rotateRefreshToken` 的业务逻辑（仅改变撤销操作的事务边界）
- ❌ 不新增 Maven 依赖（Spring 自注入 + `REQUIRES_NEW` 均为 Spring Framework 已有能力）
- ❌ 不改变 `RefreshTokenService` 的公开 API 签名（`createRefreshToken` / `rotateRefreshToken` / `revokeRefreshToken` / `findUserIdByToken` 签名不变）
- ❌ 不改动 `RefreshTokenRotation` record

## 9. 详细执行方案

### 9.1 修改 RefreshTokenService.java

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java`

#### 9.1.1 新增 import

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.transaction.annotation.Propagation;
```

（`@Transactional` 已 import，`Propagation` 需新增）

#### 9.1.2 新增自注入字段

在 `private final SysRefreshTokenMapper sysRefreshTokenMapper;` 之后、`private final SecureRandom secureRandom = new SecureRandom();` 之前插入：

```java
/**
 * 自注入代理引用，用于调用自身方法时经过 Spring AOP 事务拦截。
 * 配合 @Lazy 打破循环依赖。
 */
@Lazy
@Autowired
private RefreshTokenService self;
```

注意：此字段**不是 `final`**（Lombok `@RequiredArgsConstructor` 不会为其生成构造参数）。这是有意为之——自注入走字段注入而非构造器注入，避免循环依赖。

#### 9.1.3 修改 rotateRefreshToken 方法（第 94 行）

将：
```java
revokeAllForUser(existing.getUserId());
```

改为：
```java
self.revokeAllForUserInNewTransaction(existing.getUserId());
```

#### 9.1.4 修改 rotateRefreshToken 方法（第 101 行）

将：
```java
revokeTokenById(existing.getId());
```

改为：
```java
self.revokeTokenByIdInNewTransaction(existing.getId());
```

#### 9.1.5 新增两个 REQUIRES_NEW 代理方法

在 `revokeAllForUser` 方法之后、`// ========== 内部 DTO ==========` 注释之前插入：

```java
/**
 * 在独立事务中撤销用户全部 refresh token（重放检测调用）。
 * 使用 REQUIRES_NEW 确保撤销操作在 BaseException 抛出前已提交，
 * 不被外层事务回滚影响。
 */
@Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
public void revokeAllForUserInNewTransaction(Long userId) {
    revokeAllForUser(userId);
}

/**
 * 在独立事务中撤销单个 refresh token（过期清理调用）。
 * 使用 REQUIRES_NEW 确保撤销操作在 BaseException 抛出前已提交，
 * 不被外层事务回滚影响。
 */
@Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
public void revokeTokenByIdInNewTransaction(Long id) {
    revokeTokenById(id);
}
```

### 9.2 修改 RefreshTokenServiceTest.java

文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/service/RefreshTokenServiceTest.java`

#### 9.2.1 修改 TestConfig.refreshTokenService Bean

TestConfig 中 `refreshTokenService` Bean 通过 `new RefreshTokenService(sysRefreshTokenMapper)` 直接构造，不走 Spring 代理，因此自注入的 `self` 字段为 null。

**需要改为：在 TestConfig 中手动处理自注入**。有两种方式：

**方式一（推荐）**：在 TestConfig 中增加 `@Autowired` 自注入配置。由于 TestConfig 是 `@Configuration` 类，可以通过 `@PostConstruct` 或其他方式注入。但更简单的做法是在 `refreshTokenService` Bean 方法中手动设置：

```java
@Bean
public RefreshTokenService refreshTokenService(
        SysRefreshTokenMapper sysRefreshTokenMapper) {
    return new RefreshTokenService(sysRefreshTokenMapper);
}
```

但 `self` 是 `@Autowired` 字段注入，在 `new` 构造的对象上不会被 Spring 注入。

**方式二（更可靠）**：测试不验证 `self` 注入本身，而是验证修复后的**业务效果**——即家族撤销在异常抛出后是否已持久化。这通过 JDBC 直查 DB 来验证，绕过对 `self` 代理的依赖。

由于测试中 `RefreshTokenService` 是手动 `new` 的（非 Spring 管理的 Bean），`@Autowired` 自注入不会生效。测试改为**用 JDBC 直查 DB 验证家族撤销效果**，而非通过 `self.xxx()` 代理调用。

#### 9.2.2 重写重放检测测试用例

替换 `rotateRefreshToken_replayAttack_shouldRevokeAllForUser` 方法（第 132-149 行）：

```java
@Test
@DisplayName("rotateRefreshToken：重放已撤销 token → 家族撤销 + 抛异常，其他 token 也被撤销")
void rotateRefreshToken_replayAttack_shouldRevokeAllForUser() {
    String token = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
    // 第一次轮换（正常）
    refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS);
    // 同一用户创建另一个 token
    String anotherToken = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);

    // 重放已撤销的旧 token → 家族撤销 + 抛异常
    assertThatThrownBy(() ->
            refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS))
            .isInstanceOf(BaseException.class)
            .hasMessageContaining("已被使用过");

    // 修复后：家族撤销已在新事务中提交，anotherToken 应已被撤销
    assertThatThrownBy(() ->
            refreshTokenService.rotateRefreshToken(anotherToken, EXPIRE_SECONDS))
            .isInstanceOf(BaseException.class)
            .hasMessageContaining("已被使用过");
}
```

**关键**：由于测试中 RefreshTokenService 是 `new` 构造的（不走 Spring 代理），`self` 字段为 `null`，`self.revokeAllForUserInNewTransaction()` 会 NPE。因此**在测试中，不走自注入路径，而是让生产代码的自注入在测试中回退到直接调用**。

**等一下**——这不安全。如果生产代码改为 `self.revokeAllForUserInNewTransaction(userId)` 而 `self` 在测试中为 null，测试会 NPE。

**正确做法**：调整 TestConfig 的 Bean 创建方式。改用 `@Autowired` 注入而非 `new`：

```java
@Bean
public RefreshTokenService refreshTokenService(
        SysRefreshTokenMapper sysRefreshTokenMapper,
        PlatformTransactionManager transactionManager) {
    RefreshTokenService service = new RefreshTokenService(sysRefreshTokenMapper);
    // 通过 ApplicationContext 获取代理，或手动注入 self
    return service;
}
```

这很复杂。**更简单的方案**：在 RefreshTokenService 中，`revokeAllForUserInNewTransaction` 和 `revokeTokenByIdInNewTransaction` 不依赖自注入，而是直接通过 `TransactionTemplate` 手动管理事务：

#### 重新评估修复方案

鉴于测试兼容性问题，改用 **TransactionTemplate** 方案替代自注入：

##### 9.1 修订：RefreshTokenService.java — TransactionTemplate 方案

**9.1.1 新增 import**

```java
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
```

**9.1.2 新增字段**

```java
private final PlatformTransactionManager transactionManager;
```

注意：`PlatformTransactionManager` 通过构造器注入（加到 Lombok `@RequiredArgsConstructor` 的参数中）。

**9.1.3 修改 rotateRefreshToken 第 94 行**

替换 `revokeAllForUser(existing.getUserId());` 为：

```java
// 在独立事务中撤销，确保在异常抛出前提交
TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
txTemplate.executeWithoutResult(status -> revokeAllForUser(existing.getUserId()));
```

**9.1.4 修改 rotateRefreshToken 第 101 行**

替换 `revokeTokenById(existing.getId());` 为：

```java
TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
txTemplate.executeWithoutResult(status -> revokeTokenById(existing.getId()));
```

**9.1.5 不新增公开代理方法**

TransactionTemplate 方案不需要额外的公开方法。`revokeAllForUser` 和 `revokeTokenById` 保持 `private`。

**优点**：
- 不改变 RefreshTokenService 的公开 API
- 不需要自注入（避免循环依赖）
- 测试友好：TestConfig 注入 `PlatformTransactionManager` 即可（已在 TestConfig 中定义为 `DataSourceTransactionManager`）
- 代码意图明确：`TransactionTemplate` + `REQUIRES_NEW` 显式表达了「这个操作需要在独立事务中提交」

##### 9.2 修订：RefreshTokenServiceTest.java

**9.2.1 TestConfig Bean 调整**

`refreshTokenService` Bean 改为传入 `PlatformTransactionManager`：

```java
@Bean
public RefreshTokenService refreshTokenService(
        SysRefreshTokenMapper sysRefreshTokenMapper,
        PlatformTransactionManager transactionManager) {
    return new RefreshTokenService(sysRefreshTokenMapper, transactionManager);
}
```

`PlatformTransactionManager` Bean 已存在于 TestConfig（第 242-243 行），无需新增。

**9.2.2 重写重放检测测试用例**

（内容同原 9.2.2——恢复家族撤销断言）

```java
@Test
@DisplayName("rotateRefreshToken：重放已撤销 token → 家族撤销 + 抛异常，其他 token 也被撤销")
void rotateRefreshToken_replayAttack_shouldRevokeAllForUser() {
    String token = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);
    refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS);
    String anotherToken = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, EXPIRE_SECONDS);

    // 重放已撤销的旧 token → 家族撤销 + 抛异常
    assertThatThrownBy(() ->
            refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS))
            .isInstanceOf(BaseException.class)
            .hasMessageContaining("已被使用过");

    // 修复核心验证：家族撤销已在新事务中提交，anotherToken 应也被撤销
    assertThatThrownBy(() ->
            refreshTokenService.rotateRefreshToken(anotherToken, EXPIRE_SECONDS))
            .isInstanceOf(BaseException.class)
            .hasMessageContaining("已被使用过");
}
```

**9.2.3 新增过期 token 清理持久化测试（可选）**

由于过期 token 的修复影响低，可在回执中注明已同步修复，不强制新增专项测试。若容易覆盖，可新增以下用例：

```java
@Test
@DisplayName("rotateRefreshToken：过期 token — 撤销操作在异常抛出前已持久化")
void rotateRefreshToken_expiredToken_shouldPersistRevocation() {
    // 创建即将过期的 token（0 秒过期）
    String token = refreshTokenService.createRefreshToken(USER_ID, TENANT_ID, 0);
    // 等待 1 秒确保过期
    try { Thread.sleep(1000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

    // 轮换过期 token → 应抛"已过期"
    assertThatThrownBy(() ->
            refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS))
            .isInstanceOf(BaseException.class)
            .hasMessageContaining("已过期");

    // 再次轮换应抛"已被使用过"（证明过期清理的撤销已持久化）
    assertThatThrownBy(() ->
            refreshTokenService.rotateRefreshToken(token, EXPIRE_SECONDS))
            .isInstanceOf(BaseException.class)
            .hasMessageContaining("已被使用过");
}
```

（此测试依赖时间精度，H2 中 `LocalDateTime.now()` 与 `CURRENT_TIMESTAMP` 可能有秒级偏差。如不稳定可跳过，在回执中说明。）

### 9.3 编译与测试验证

```bash
cd Smart-WorkFlow
mvn clean install -DskipTests   # 安装更新后的模块 JAR
mvn -q compile                   # 编译验证
mvn -q test                      # 全量测试
```

预期：
- `mvn -q compile` BUILD SUCCESS
- `mvn -q test` BUILD SUCCESS
- RefreshTokenServiceTest 从 12 用例增至 13-14 用例（重放测试恢复 2 断言 + 可能的过期测试）
- 全量回归零失败

## 10. 关键实现约束

- **不改动 RefreshTokenService 公开 API 签名**：`createRefreshToken` / `rotateRefreshToken` / `revokeRefreshToken` / `findUserIdByToken` 的方法签名完全不变
- **TransactionTemplate 每次调用 `new`**：不在类中持有 `TransactionTemplate` 实例（它是有状态的——`propagationBehavior` 被设置后不应跨线程共享）。每次在方法内创建新的局部实例
- **`PlatformTransactionManager` 通过构造器注入**：加到 Lombok `@RequiredArgsConstructor` 的参数中，保持与现有代码风格一致
- **测试中 TestConfig 必须传入 PlatformTransactionManager**：已在 TestConfig 中定义为 `DataSourceTransactionManager` Bean，直接作为参数注入 `refreshTokenService` Bean 方法
- **恢复的测试断言不依赖 `self` 代理**：TransactionTemplate 方案消除了自注入需求，测试中无需处理循环依赖

## 11. 边界情况

- **`revokeAllForUser` 的 REQUIRES_NEW 事务失败**：如果新事务中 UPDATE 失败（如 DB 连接断开），`TransactionTemplate.executeWithoutResult` 会抛异常，直接传播到调用方。此时 `rotateRefreshToken` 的外层事务也会回滚（但 revoke 本身已失败，无实质损失）
- **主事务回滚不影响已提交的 REQUIRES_NEW 事务**：这是本次修复的核心保证——`revokeAllForUser` 已在新事务中 `COMMIT`，外层 `BaseException` 触发的回滚不影响它
- **并发：两个请求同时检测到重放**：两个线程各自执行 `revokeAllForUser`，第二次执行的 UPDATE 影响 0 行（所有 token 已在第一次中被标记为 `revoked=1`），幂等无害
- **测试中 PlatformTransactionManager 为 DataSourceTransactionManager**：与生产环境的 JTA/JPA 事务管理器行为一致（均支持 REQUIRES_NEW）
- **过期 token 测试的时间精度**：H2 的 `CURRENT_TIMESTAMP` 与 Java `LocalDateTime.now()` 可能有秒级偏差。`Thread.sleep(1000)` 引入 1 秒等待以确保过期。若仍不稳定，可在回执中标注跳过并说明原因

## 12. 风险和回滚方案

- **风险 1：`mvn clean install -DskipTests` 后其他模块使用旧 JAR 导致测试失败**：B3 已验证此问题。解决：先 `mvn clean install -DskipTests` 再 `mvn test`
- **风险 2：过期 token 测试因时间精度不稳定**：如 flaky，跳过该测试并在回执中说明
- **回滚**：`git checkout -- RefreshTokenService.java` + `git checkout -- RefreshTokenServiceTest.java`。对 `src/main` 仅一个文件被修改

## 13. 测试方案

### 13.1 静态检查

- `grep "revokeAllForUser(" RefreshTokenService.java` 确认仅两处调用：一处是内部方法定义，一处是 `executeWithoutResult` 内的 lambda
- `grep "revokeTokenById(" RefreshTokenService.java` 确认调用点正确（仅 `rotateRefreshToken` 过期分支 + `revokeRefreshToken` + 自身定义）
- 确认 `PlatformTransactionManager` import 正确（`org.springframework.transaction.PlatformTransactionManager`）
- 确认 `TransactionTemplate` / `TransactionDefinition` import 正确

### 13.2 单元测试

| 测试类 | 变化 | 用例数 |
|--------|:----:|:------:|
| RefreshTokenServiceTest | 重放测试增强（恢复家族撤销断言）+ 可能的新增过期持久化测试 | 13-14 |

### 13.3 集成测试

不要求新增（已有 AuthFlowIntegrationTest 端到端覆盖认证链）。

### 13.4 手工验证

不要求。

### 13.5 回归检查

- `mvn -q compile` 全量 BUILD SUCCESS
- `mvn -q test` 全量 BUILD SUCCESS
- 全项目测试 ≥ 462（B3 基线），零回归
- sw-biz-system-biz 测试 ≥ 65（B3 基线），RefreshTokenServiceTest 用例数从 12 增至 13-14

## 14. 验收标准（逐条可验证布尔条件）

1. RefreshTokenService 构造器参数包含 `PlatformTransactionManager`（Lombok `@RequiredArgsConstructor` 生成包含它的构造器）
2. `rotateRefreshToken` 中重放检测路径使用 `TransactionTemplate` + `PROPAGATION_REQUIRES_NEW` 包裹 `revokeAllForUser`
3. `rotateRefreshToken` 中过期路径使用 `TransactionTemplate` + `PROPAGATION_REQUIRES_NEW` 包裹 `revokeTokenById`
4. RefreshTokenService 公开 API 方法签名不变（`createRefreshToken` / `rotateRefreshToken` / `revokeRefreshToken` / `findUserIdByToken`）
5. RefreshTokenServiceTest 重放测试新增家族撤销验证：`anotherToken` 在重放后也抛出"已被使用过"
6. RefreshTokenServiceTest TestConfig `refreshTokenService` Bean 传入 `PlatformTransactionManager`
7. `mvn clean install -DskipTests` BUILD SUCCESS
8. `mvn -q compile` BUILD SUCCESS
9. `mvn -q test` BUILD SUCCESS，全量测试通过，零回归
10. RefreshTokenServiceTest（所有用例）全部通过，至少含 13 用例

## 15. 执行回执格式

按根目录 system.md §7.1 格式，写入 `product/auth-seam-completion/receipts/step-5-b4-execution.md`。

## 16. 测试回执格式

按根目录 system.md §7.2 格式，写入 `product/auth-seam-completion/receipts/step-5-b4-test.md`。最终结论只能是 PASSED / FAILED / BLOCKED 之一。

## 17. 明确禁止事项

- ❌ 不修改 `AuthController` / `CookieUtils` / `TokenResponse` / `JwtProperties`
- ❌ 不新增 Maven 依赖
- ❌ 不新增 Flyway 迁移
- ❌ 不修改前端代码
- ❌ 不改变 `rotateRefreshToken` 的业务逻辑（仅改变撤销操作的事务边界）
- ❌ 不修改 `RefreshTokenRotation` record
- ❌ 不修改 `createRefreshToken` / `revokeRefreshToken` / `findUserIdByToken` 方法
- ❌ 不在 RefreshTokenService 中引入自注入（`@Lazy @Autowired self`）—— 采用 TransactionTemplate 方案
- ❌ **执行代理若发现方案有误或需调整**：在回执中报告，不自行修改方案
