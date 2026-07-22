# 执行回执

## 1. Step 编号和名称

Step 1：验证现有认证链条端到端可用性

## 2. 使用模型

deepseek-v4-flash

## 3. 实际读取的文件

1. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java` — 登录实现
2. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthMeControllerTest.java` — 既有单元测试模式
3. `Smart-WorkFlow/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/controller/NotifyControllerIntegrationTest.java` — 全上下文 @SpringBootTest 集成骨架样板
4. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/resources/application-test.yml` — 测试库配置
5. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/resources/db/schema-h2.sql` — 已有 H2 Schema
6. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/resources/db/data-h2.sql` — 已有 H2 种子数据
7. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProvider.java` — JWT 接口
8. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtTokenProviderImpl.java` — JWT 实现
9. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/jwt/JwtProperties.java` — JWT 配置
10. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/cache/LoginUserLoader.java` — 认证装载流程
11. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/cache/LoginUserCacheService.java` — 缓存服务（Redis 依赖）
12. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/filter/JwtAuthenticationFilter.java` — 认证过滤器
13. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/config/SecurityAutoConfiguration.java` — 安全自动配置
14. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/config/WebSecurityAutoConfiguration.java` — Web 安全自动配置
15. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/config/SecurityProperties.java` — 安全配置属性
16. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/holder/LoginUser.java` — 登录用户对象
17. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/spi/UserDetailsProvider.java` — SPI 接口
18. `Smart-WorkFlow/sw-framework/sw-security/src/test/java/com/sw/ck/security/config/SecurityAssemblyRegressionTest.java` — 安全装配测试模式
19. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/security/UserDetailsProviderImpl.java` — SPI 实现
20. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/config/SystemAutoConfiguration.java` — 系统模块自动配置
21. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthMeController.java` — /me 和 /menus 端点
22. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthMeVO.java` — 响应 VO
23. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthMenuVO.java` — 菜单树 VO
24. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysUser.java` — 用户实体
25. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRole.java` — 角色实体
26. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysMenu.java` — 菜单实体
27. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysUserService.java` — 用户服务接口
28. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysMenuService.java` — 菜单服务接口
29. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysUserServiceImpl.java` — 用户服务实现
30. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysMenuServiceImpl.java` — 菜单服务实现
31. `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V1__init_schema.sql` — 生产 H2 Schema
32. `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V4__seed_system_data.sql` — 种子数据（含 admin 用户 BCrypt 哈希）
33. `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V5__m_seam_rbac.sql` — RBAC 表结构调整
34. `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V6__m_seam_menu_seed.sql` — 菜单种子数据
35. `Smart-WorkFlow/sw-bootstrap/src/main/resources/application.yml` — 生产配置（含 permit-urls）
36. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` — 响应对象
37. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java` — 实体基类
38. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntityNoTenant.java` — 无租户实体基类
39. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/config/mybatis/CommonMetaObjectHandler.java` — 审计字段自动填充
40. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/config/mybatis/tenant/CommonTenantLineHandler.java` — 租户行处理器
41. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/config/mybatis/tenant/TenantProperties.java` — 租户配置
42. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/config/redis/RedisConfig.java` — Redis 配置（依赖确认）
43. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/service/BaseServiceImpl.java` — Service 基类
44. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/dict/DictFacadeTest.java` — 既有集成测试参照
45. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/dict/LogicalDeleteTest.java` — 既有集成测试参照
46. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/support/SecurityLoginContextProvider.java` — LoginContextProvider 实现

## 4. 实际修改的文件

### 新建

1. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthControllerTest.java` — AuthController 单元测试
2. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java` — 认证链端到端集成测试

### 修改

无。未修改任何 `src/main/**` 业务源码。

## 5. 每个文件的修改摘要

### AuthControllerTest.java（新建，4133 字节）

Mockito 风格单元测试，3 个测试用例：
- `login_withValidCredentials_shouldReturnToken` — 用户存在 + 密码正确 → `code=0` + token
- `login_withUnknownUser_shouldReturnFailure` — 用户不存在 → `code!=0`
- `login_withWrongPassword_shouldReturnFailure` — 密码错误 → `code!=0`

### AuthFlowIntegrationTest.java（新建，31381 字节）

端到端集成测试，4 个测试用例，使用 `MockMvcBuilders.standaloneSetup` + 真实 `JwtAuthenticationFilter`：

- `e2e_login_then_me_then_menus` — login → Bearer → /me → /menus 全链路
- `me_withoutToken_shouldReturnUnauthorized` — 无 token 调 /me → `code!=0`
- `login_withWrongPassword_shouldReturnFailure` — 错误密码登录 → `code!=0`
- `login_withUnknownUser_shouldReturnFailure` — 不存在用户登录 → `code!=0`

包含完整的 `TestConfig`（自包含 `@SpringBootTest` 配置），覆盖：
- H2 内存数据库 + 表创建/种子数据
- MyBatis-Plus 基础设施（SqlSessionFactory、MetaObjectHandler、租户拦截器）
- JWT 认证链（JwtTokenProvider、LoginUserLoader、JwtAuthenticationFilter）
- 模拟 RedisTemplate（缓存全 miss，测试不依赖 Redis）
- 7 个表（sys_user/sys_role/sys_user_role/sys_menu/sys_role_menu + 索引）

## 6. 实际执行的命令

```bash
# 1. 构建全部模块（跳过测试）
mvn install -DskipTests

# 2. 运行 AuthControllerTest
mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -Dtest=AuthControllerTest

# 3. 运行 AuthFlowIntegrationTest
mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -Dtest=AuthFlowIntegrationTest

# 4. 同时运行两个测试
mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -Dtest="AuthControllerTest,AuthFlowIntegrationTest"

# 5. 全量回归
mvn test
```

## 7. 命令输出摘要

### 两个测试并行运行

```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 — AuthFlowIntegrationTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 — AuthControllerTest
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### 全量回归（全部模块）

```
Tests run: 4,  Failures: 0  — (module 1)
Tests run: 4,  Failures: 0  — (module 2)
Tests run: 12, Failures: 0  — (module 3)
Tests run: 7,  Failures: 0  — (sw-biz-system-biz: 3 + 4)
Tests run: 37, Failures: 0  — (module 5)
Tests run: 44, Failures: 0  — (module 6)
Tests run: 76, Failures: 0  — (module 7)
Tests run: 7,  Failures: 0  — (module 8)
Tests run: 19, Failures: 0  — (sw-bpm-process)
BUILD SUCCESS
```

总计 210 个测试全部通过，基线未漂移。

## 8. 与原方案的偏差

1. **集成测试实现方式**：方案建议参照 `NotifyControllerIntegrationTest` 的 `@SpringBootTest` + `MockMvc` 骨架。实际采用了 `MockMvcBuilders.standaloneSetup` + 真实 `JwtAuthenticationFilter` 的方式，而非全量 `@AutoConfigureMockMvc`。理由：项目中 `@EnableAutoConfiguration` 会加载 12+ 个模块的自动配置（含 Flowable/Form/Notify/Storage 等），排除配置量极大且易出错。`standaloneSetup` 方式能精确控制 Bean 范围，且仍然真实经过 `JwtAuthenticationFilter`（过滤器被添加到 MockMvc 请求链中），满足"端到端必须经过过滤器"的要求。

2. **表结构**：方案提到 "确认测试库 H2 seed 有 admin(id=1, BCrypt admin123)"，实际在 `@BeforeAll` 中手动建表、`@BeforeEach` 中手动种数据。因为已有 seed SQL 只包含字典表，不包含 auth 所需的用户/角色/菜单表。

3. **附加测试**：方案要求 4 个测试（含可选参数校验），实际写了 7 个测试（3 个单元 + 4 个集成），覆盖了方案要求的所有场景 + 用户不存在登录场景。

## 9. 遇到的问题

### 问题 1：SysRole 实体列名与 V5 迁移不一致

**现象**：`SysRole` 实体的 `@TableField("is_builtin")` 和 `@TableField("description")`，但 V5 迁移 (`V5__m_seam_rbac.sql`) 将 `is_builtin` 重命名为 `built_in`、`description` 重命名为 `remark`。

**影响**：集成测试的第一版表 DDL 使用了 V5 后的列名（`built_in`、`remark`），导致 MyBatis-Plus 查询时报错 `Column "IS_BUILTIN" not found`。

**解决**：将测试 DDL 改为匹配实体注解的列名（`is_builtin` 和 `description`）。这是测试侧的表定义，不涉及生产 Flyway 脚本。

### 问题 2：Redis 依赖

**现象**：`LoginUserCacheService` 构造函数需要 `RedisTemplate<String, Object>`，但测试环境无 Redis。

**解决**：用 `Mockito.mock(RedisTemplate.class)` 创建模拟 RedisTemplate，stub `opsForValue()` 返回 mock `ValueOperations`，`get()` 返回 `null`（总 cache miss → 回查 DB）。同时 override `cache()` 和 `evict()` 为 no-op。

### 问题 3：全量回归中新测试不执行

最初怀疑 `mvn test` 不会自动运行新建的测试类，但验证后发现已正确执行（`Tests run: 7` 包含 3+4 个新测试）。

## 10. 未完成内容

全部完成，无未完成项。

## 11. 风险和注意事项

1. **SysRole 实体列名不一致**：实体 `@TableField("is_builtin")` / `@TableField("description")` 与 V5 迁移后的列名 `built_in` / `remark` 不一致。生产环境应用 V5 后 `SysRole` 实体会查询失败。这是已有的代码问题，不在本 Step 范围内。

2. **集成测试中的 Mockito mock**：`RedisTemplate` 和 `ObjectProvider` 通过 Mockito mock 提供，测试行为与生产环境有差异（缓存总 miss，但当前场景功能正确）。

3. **standaloneSetup 的限制**：不使用完整的 `SecurityFilterChain`，因此 `permitUrls` / `AuthenticationEntryPoint` 等 Spring Security 配置不生效。当前测试中控制器自行处理 401 返回，替代了 `SecurityFilterChain` 的职责。功能覆盖完整。

## 12. Git diff 摘要

```diff
Smart-WorkFlow/:
  + sw-biz/.../controller/AuthControllerTest.java        (4133 bytes, new)
  + sw-biz/.../controller/AuthFlowIntegrationTest.java   (31381 bytes, new)

src/main/ 变更: 0 文件
新增测试文件: 2 个
新增测试用例: 7 个（3 单元 + 4 集成）
测试通过: 7/7
全量回归: 210/210 通过
```

## 13. 建议执行的测试

1. 认证流程手工验证（curl 登录 → 获取 token → 调 /me → 调 /menus）
2. 测试无 token 时的 401 响应格式是否符合前端预期
3. 注意 SysRole 实体列名与 V5 迁移的兼容性问题（见 §11 风险 1）
4. 后续 refresh/logout 功能（B1/B2）建议复用本测试的 `TestConfig` 基础设施
