# Step V1：验证已实现的 auth seam（login / me / menus 端到端取证）

> 所属功能：auth-seam-completion（后端 seam 收尾）
> 域：**纯后端**（只改 `Smart-WorkFlow/`，禁止触碰前端）
> 本方案按根目录 system.md §6 的 17 项结构生成。

---

## 1. 当前状态

功能 auth-seam-completion 刚进入执行。本 Step 是第 1 步（V1），前置无依赖。目的：为「me/menus/权限三个 seam 后端已实现」这一裁决补充**端到端测试证据**，用于纠正知识库 §7 并作为后续 refresh/logout 改造的回归基线。

现状（CONFIRMED，代码直读）：
- `AuthController.login`（`POST /auth/login`）已实现，返回 `R<String>`（裸 token）。**无任何测试覆盖。**
- `AuthMeController.me/menus`（`GET /system/auth/me`、`GET /system/auth/menus`）已实现，`AuthMeControllerTest` 已覆盖，但**为单元测试、直接 Mock `LoginUserHolder`，未经过真实 `JwtAuthenticationFilter` 认证链**。
- 后端测试基线：**203** tests / 26 文件，`mvn -q test` BUILD SUCCESS（CONFIRMED 2026-07-22 kb-verification 运行期复验；原「406」为 job-scheduler B4 回执误报，已 SUPERSEDED）。

## 2. Step 目标

补齐认证链的测试取证：(a) 新增 `AuthController` 登录单元测试；(b) 新增一条**走真实 JWT 过滤器链**的端到端集成测试，证明 `login → 携带 Bearer token → /system/auth/me / /menus` 全链路对真实 seed 数据可用。**不改任何业务源码。**

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯测试代码编写，无架构/安全边界决策，属 flash 适用范围
是否触发升级条件：否
```

> 升级预案：若端到端测试的「测试库 seed（admin/superadmin/菜单）+ 过滤器链装配」连续 ≥2 次失败，按 §2.3 升级 deepseek-v4-pro，并在回执中说明原因。

## 4. 模型选择理由

测试用例生成是 flash 的核心适用场景；本 Step 不涉及生产逻辑改动、不涉及安全边界设计。

## 5. 已知上下文

- 统一响应体 `R<T>`：`{ code, msg, data }`，成功码 `code == 0`（注意后端字段是 `msg`；前端契约字段是 `message`，此差异属前端 adapter 处理范畴，本 Step 不涉及）。
- JWT：`sw-security` 的 `JwtTokenProvider` 仅编码 `subject=userId + iat + exp`；`JwtAuthenticationFilter` 解析→validate→`LoginUserLoader.loadByUserId`→注入 `LoginUserHolder` + `SecurityContextHolder`。
- superAdmin 判定：`UserDetailsProviderImpl` 用 `roles.contains("superadmin")`（角色 code），**非** userId==1。seed 绑定为 admin(id=1)→role(code=superadmin)。
- 权限聚合：`UserDetailsProviderImpl.loadPermissions` 取 `menu_type=2 且 permission 非空` 去重集合；**超管旁路返回空数组**。
- seed 数据：Flyway `V4__seed_system_data.sql` 建 admin 用户（id=1, BCrypt 明文 `admin123`, is_admin=1），`V5__m_seam_rbac.sql` 将超管角色 code 定为 `superadmin`，`V6__m_seam_menu_seed.sql` 重建 9 节点导航树且**不 seed sys_role_menu**（超管靠旁路）。
- 现有测试骨架分两类：单元 Mock（如 `AuthMeControllerTest`）与全上下文集成（如 `NotifyControllerIntegrationTest`、`DictFacadeTest`，用 H2）。

## 6. 执行前必须读取的文件

按优先级：
1. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java`（登录实现与 `LoginRequest` 形状）
2. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthMeControllerTest.java`（既有 me/menus 单元测试模式）
3. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/controller/NotifyControllerIntegrationTest.java`（**全上下文 `@SpringBootTest` 集成骨架样板** — 以实际为准）
4. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/resources/application-test.yml`（测试库配置：确认 H2 是走 Flyway 还是 `schema-h2.sql`+`data-h2.sql`）
5. `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/resources/db/schema-h2.sql` 与 `db/data-h2.sql`（现有 seed 仅字典数据 — 端到端登录需要额外 seed admin/role/menu）
6. `sw-framework/sw-security` 下 `JwtTokenProvider`、`JwtAuthenticationFilter`、`LoginUserLoader`、`UserDetailsProviderImpl`（确认认证链与 superadmin 口径，以实际签名为准）
7. `sw-security/src/test/java/com/sw/ck/security/config/SecurityAssemblyRegressionTest.java`（安全装配测试模式参考）

## 7. 允许修改的文件范围

**仅新增测试文件**（不改任何 `src/main`）：
- 新建 `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthControllerTest.java`（登录单元测试）
- 新建端到端集成测试类（名称建议 `AuthFlowIntegrationTest.java`，落 `sw-biz-system-biz` 的 test 目录 controller 或 integration 包，**以实际包组织为准**）
- 若端到端测试需要，**可新增/扩充测试专用 seed SQL**（如 test/resources 下的 H2 seed，仅新增 admin/superadmin/role_menu/menu 行）——**只动 test/resources，不动生产 Flyway 脚本**

## 8. 禁止修改的范围

- ❌ 任何 `src/main/**`（不改业务源码、不改 Controller、不改 Security、不改 Flyway 生产脚本）
- ❌ 前端 `Smart-WorkFlow-Web/**` 一律不碰
- ❌ 其他模块的测试文件
- ❌ 不改 `AuthMeControllerTest.java`（既有测试保持不动，仅新增）

## 9. 详细执行方案

### 9.1 AuthControllerTest（登录单元测试，Mock 依赖）
参照 `AuthMeControllerTest` 的单元 Mock 风格，`mock` 掉 `UserDetailsProvider` / `PasswordEncoder` / `JwtTokenProvider` / `SysUserService`，直接 `new AuthController(...)` 调 `login()`，覆盖：
1. happy path：`getByUsername` 返回用户 + `passwordEncoder.matches` 返回 true → `generateToken` 返回固定 token → 断言 `code==0` 且 `data` 等于该 token。
2. 用户不存在：`getByUsername` 返回 null → 断言 `code!=0` 且提示「用户名或密码错误」。
3. 密码错误：`matches` 返回 false → 断言 `code!=0` 且提示「用户名或密码错误」。
4. 校验参数：断言 `LoginRequest` 的 `@NotBlank`（可用 Validator 或说明由 MVC 层保证，二选一，以实际测试可行性为准）。

### 9.2 AuthFlowIntegrationTest（端到端，走真实过滤器链）
参照 `NotifyControllerIntegrationTest` 的 `@SpringBootTest` + `MockMvc`（`@AutoConfigureMockMvc`）骨架：
1. **前置 seed**：确保测试 H2 中存在 admin(id=1, 密码 `admin123` 的 BCrypt)、superadmin 角色、user_role 绑定、若干菜单节点。先读 `application-test.yml` 判定 seed 机制：
   - 若测试库走 Flyway → V4/V5/V6 已 seed，无需额外处理；
   - 若走 `schema-h2.sql`+`data-h2.sql`（当前仅字典）→ 需在测试 seed SQL 中补 admin/role/user_role/menu 行（BCrypt 值可用 `admin123` 的已知哈希或在测试内用 `PasswordEncoder` 现算后插入）。
2. **登录**：`POST /auth/login` body `{"username":"admin","password":"admin123"}` → 断言 `code==0`，取出 `data` 为非空 token 字符串。
3. **调 /me（带 Bearer）**：`GET /system/auth/me` header `Authorization: Bearer <token>` → 断言 `code==0`、`data.user.username=="admin"`、`data.superAdmin==true`、`data.roles` 含 `superadmin`。
4. **调 /menus（带 Bearer）**：`GET /system/auth/menus` 带 Bearer → 断言 `code==0`、`data` 为非空树（超管全量）、根节点 `parentId==null`、目录节点 `component==null`。
5. **无 token 调 /me**：不带 Authorization → 断言 401（或 `code!=0`，以实际过滤器行为为准）。
6. **错误密码登录**：`password` 错 → 断言 `code!=0`。

### 9.3 增量验证
每写完一个测试类执行一次 `mvn -q test -pl sw-biz/sw-biz-system/sw-biz-system-biz`（或模块内），再跑全量。

## 10. 关键实现约束

- 只新增测试，`src/main` 零改动（用 `git diff --stat` 自证 main 无改动）。
- 端到端测试必须**真正经过 `JwtAuthenticationFilter`**（用 MockMvc 发带 Bearer 的真实请求），不得像 `AuthMeControllerTest` 那样直接 set `LoginUserHolder` 绕过过滤器——否则失去「端到端取证」意义。
- BCrypt 密码不得硬编码明文进断言；如需插入 seed 用现算哈希。
- 断言用真实 seed 的 admin/superadmin 口径（superadmin 是角色 code，不是 userId==1）。
- 不得因端到端 seed 麻烦就退化为纯 Mock 测试；若确实无法在测试库跑通 Flyway/seed，在回执中报告并说明采用的替代 seed 方案。

## 11. 边界情况

- 测试库不含菜单 seed → /menus 可能返回空树：超管应返回全量，若为空说明 seed 缺失，需补菜单 seed 或报告。
- 过滤器对无 token 的行为：可能是 401 或放行到 controller 内 `LoginUserHolder==null` 返回 `R.fail(401,...)`（业务码而非 HTTP 401）——**以实际为准**断言，不臆断。
- tenant_id：admin 的 tenantId=0（super tenant），断言按实际 seed。

## 12. 风险和回滚方案

- 风险：测试库 seed 机制与生产 Flyway 不一致，端到端登录取不到用户 → 需补测试 seed。回滚：删除新增测试文件即可，无 main 改动，零副作用。
- 风险：全上下文 `@SpringBootTest` 启动慢/装配失败 → 参照已有集成测试的 profile 与排除项；连续失败 ≥2 次按 §2.3 升 pro。

## 13. 测试方案

### 13.1 静态检查
- `git diff --stat` 确认 `src/main` 零改动，仅新增 test 文件（+ 可选 test/resources seed）。
- `mvn -q compile` 通过。

### 13.2 单元测试
- `AuthControllerTest` 4 个用例全绿。

### 13.3 集成测试
- `AuthFlowIntegrationTest` 6 个场景（登录/带 token me/带 token menus/无 token/错密码/树结构）全绿，且经过真实过滤器链。

### 13.4 手工验证
- 无（纯后端测试，无 UI）。

### 13.5 回归检查
- `mvn -q test` 全量：测试计数 **≥ 203 + 新增数**（基线不减少，203 为 CONFIRMED 运行期真值），BUILD SUCCESS。
- 既有 `AuthMeControllerTest` 5 用例仍全绿。

## 14. 验收标准（逐条可验证布尔条件）

1. `git diff` 显示 `src/main/**` 与生产 Flyway 脚本零改动。
2. 新增 `AuthControllerTest`，含 happy/用户不存在/密码错误至少 3 个用例，全绿。
3. 新增端到端集成测试，`login→Bearer→/me` 断言 username=admin、superAdmin=true、roles 含 superadmin，全绿。
4. 端到端 `login→Bearer→/menus` 断言返回非空全量树、根 parentId=null、目录 component=null，全绿。
5. 端到端测试确实经过 `JwtAuthenticationFilter`（MockMvc 真实带 Bearer 请求，非直接 set LoginUserHolder）。
6. 无 token 调 /me 的场景有断言且通过。
7. `mvn -q test` 全量 BUILD SUCCESS，计数 ≥ 203 且新增可精确对应。

## 15. 执行回执格式

按根目录 system.md §7.1 的 13 项，写入 `product/auth-seam-completion/receipts/step-1-verify-existing-seams-execution.md`。

## 16. 测试回执格式

按根目录 system.md §7.2 的 12 项，写入 `product/auth-seam-completion/receipts/step-1-verify-existing-seams-test.md`。最终结论只能是 PASSED / FAILED / BLOCKED 之一。

## 17. 明确禁止事项

- ❌ 不改任何 `src/main` 业务源码、不「顺手」重构 AuthController/AuthMeController。
- ❌ 不改生产 Flyway 脚本。
- ❌ 不碰前端。
- ❌ 不删除或弱化既有 `AuthMeControllerTest`。
- ❌ 端到端测试不得绕过过滤器直接 set LoginUserHolder。
- ❌ 不提前实现 refresh/logout（那是 B1/B2 的范围）。
