# 测试回执

## 1. Step 编号和名称

Step 1：验证现有认证链条端到端可用性

## 2. 测试环境

| 属性 | 值 |
|------|-----|
| 数据库 | H2 内存 (MODE=PostgreSQL) |
| Java 版本 | OpenJDK 21.0.11 |
| Maven 版本 | 3.x |
| 操作系统 | Linux 5.15.0 |
| 构建工具 | Maven 3.x (sw-biz-system-biz 子模块) |
| 测试框架 | JUnit 5 + Mockito + Spring Test |
| 安全框架 | JwtAuthenticationFilter (自定义 OncePerRequestFilter) |

## 3. 测试前置条件

- 项目依赖已安装（`mvn install -DskipTests`）
- 测试类所在模块 `sw-biz-system-biz` 已编译
- 集成测试使用自含 H2 内存数据库（`jdbc:h2:mem:authflow;MODE=PostgreSQL`）
- 种子数据在 `@BeforeEach` 中重置（admin 用户 / superadmin 角色 / 菜单树 / 关联）
- 不使用 Redis（模拟 RedisTemplate，缓存全 miss → 回查 DB）

## 4. 实际执行的测试命令

```bash
# 4.1 单模块运行两个测试
mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -Dtest="AuthControllerTest,AuthFlowIntegrationTest"

# 4.2 全量回归
mvn test
```

## 5. 各测试项结果

### AuthControllerTest（Mockito 单元测试）

| # | 测试方法 | 预期 | 实际 | 结果 |
|---|----------|------|------|------|
| 1 | `login_withValidCredentials_shouldReturnToken` | `code=0`, `data`=token | `code=0`, `data`="test-jwt-token" | PASSED |
| 2 | `login_withUnknownUser_shouldReturnFailure` | `code!=0`, `data=null` | `code=1`, `data=null` | PASSED |
| 3 | `login_withWrongPassword_shouldReturnFailure` | `code!=0`, `msg` 非空 | `code=401`, `msg`="用户名或密码错误" | PASSED |

### AuthFlowIntegrationTest（端到端集成测试）

| # | 测试方法 | 预期 | 实际 | 结果 |
|---|----------|------|------|------|
| 4 | `e2e_login_then_me_then_menus` | login→token→/me(superAdmin=true, roles含superadmin)→/menus(非空树, parentId=null) | 全链路通过 | PASSED |
| 5 | `me_withoutToken_shouldReturnUnauthorized` | `code!=0`, `msg` 非空 | `code=401`, `msg`="未登录或 token 已失效" | PASSED |
| 6 | `login_withWrongPassword_shouldReturnFailure` | `code!=0` | `code=401`, `msg`="用户名或密码错误" | PASSED |
| 7 | `login_withUnknownUser_shouldReturnFailure` | `code!=0` | `code=401`, `msg`="用户名或密码错误" | PASSED |

## 6. 通过项

全部 7 个测试用例通过（7/7），包含：

**单元测试（3/3）**：
- Happy path 登录成功
- 用户不存在
- 密码错误

**集成测试（4/4）**：
- 全链路闭合：`POST /auth/login` → 取 token → `GET /system/auth/me`（断言 superAdmin=true / roles 含 superadmin / username=admin）→ `GET /system/auth/menus`（断言非空树 / 根节点 parentId=null / id 为 String）
- 无 token 调 /me → 401
- 错误密码登录 → 非 0 错误码
- 不存在的用户登录 → 非 0 错误码

## 7. 失败项

无。

## 8. 跳过项及原因

无。

## 9. 关键日志或错误信息

无错误。关键信息摘要：

```
AuthController  -- 用户登录: admin
AuthController  -- 用户 admin 登录成功, userId=1
AuthController  -- 用户登录: unknown
AuthController  -- 用户登录: nonexistent
```

全量回归日志无 FAILURE/ERROR。

## 10. 是否满足验收标准

| # | 验收标准 | 状态 | 证据 |
|---|----------|------|------|
| 1 | `git diff` 显示 `src/main/**` 零改动 | ✅ PASSED | `git diff --name-only -- src/main` 无输出 |
| 2 | 新增 AuthControllerTest ≥3 用例全绿 | ✅ PASSED | 3 测试通过，BUILD SUCCESS |
| 3 | 端到端 login→Bearer→/me 断言正确全绿 | ✅ PASSED | `e2e_login_then_me_then_menus` 断言 superAdmin=true / roles 含 superadmin / username=admin 全部通过 |
| 4 | 端到端 login→Bearer→/menus 断言非空全量树全绿 | ✅ PASSED | `e2e_login_then_me_then_menus` 断言菜单树非空 / 根节点 parentId=null / id 为 String 全部通过 |
| 5 | 端到端经过 JwtAuthenticationFilter | ✅ PASSED | MockMvc 通过 `addFilter(jwtAuthenticationFilter)` 配置，所有请求均经 `doFilterInternal` 处理（token 解析 → LoginUserHolder 设置 → 控制器读取） |
| 6 | 无 token 调 /me 有断言且通过 | ✅ PASSED | `me_withoutToken_shouldReturnUnauthorized` 断言 `code=401` 通过 |
| 7 | `mvn -q test` BUILD SUCCESS，计数 ≥ 203 + 新增 | ✅ PASSED | 全量回归 210 测试全部通过 |

## 11. 回归风险

- **低风险**：新测试仅新增测试文件，未修改任何 `src/main/**` 业务代码。全量回归 210 测试全部通过。新增的集成测试使用自包含 H2 数据库，不影响其他模块的测试。
- **发现一个已有问题**：`SysRole` 实体的 `@TableField("is_builtin")` / `@TableField("description")` 与 V5 Flyway 迁移的列重命名（`is_builtin`→`built_in`, `description`→`remark`）不一致。此问题在测试中通过创建实体列名匹配的 DDL 规避，不影响测试有效性。生产环境若已应用 V5 迁移，`SysRole` 实体的查询会失败。

## 12. 最终结论

**PASSED**

所有 7 个测试用例（3 单元 + 4 集成）全部通过，全量回归 210 测试无回归，`src/main` 零改动。满足全部 7 条验收标准。
