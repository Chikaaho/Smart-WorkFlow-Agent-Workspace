# D122 退回修正统一回执：role-menu-permission-parity

**日期**：2026-08-20
**角色**：执行
**对照**：`product/role-menu-permission-parity/receipts/planning-review-d122.md`（四类偏差）
**方向**：`product/role-menu-permission-parity/ready/direction-role-menu-permission-parity.md`（D121，保持 READY）
**性质**：D122 退回后的统一修正回执。四类偏差均已修正并经双端全量验证；功能级重验 PASSED，最终验收待规划层。

---

## 1. 偏差修正总览

| # | D122 偏差 | 修正 | 证据 |
|---|-----------|------|------|
| §2.1 | 真实生产权限拒绝链无 403 证据（测试用定制处理器改写链路） | **生产修复**：`GlobalExceptionHandler` 新增 `AuthorizationDeniedException` 分支 → HTTP 403 + body 403；移除测试专用处理器覆盖，请求级 403 走真实生产链路 | §3.1 |
| §2.2 | 停用角色仍继续授予菜单/按钮权限（不能有效撤权） | **生产修复**：`SysMenuServiceImpl.loadMenuIdsByUserId` 与 `UserDetailsProviderImpl.loadPermissions` 对称按 `sys_role.status=1` 过滤 | §3.2 |
| §2.3 | Mock 双角色身份语义未闭合（`roles:['admin']`+`superAdmin:true`） | **Mock 修正**：超管会话 username=superadmin/roles=['superadmin']；新增普通 `MOCK_SESSION_DATA_ADMIN`（admin 非超管、权限由 admin 绑定装配）；登录按 username 三会话映射 | §3.3 |
| §2.4 | 两项真实问题未登记权威 issue；阶段三终态提前 | **注册与同步**：I53/I54 登记 knowledge/known-issues.md + memory/issues.md；memory/handoff、state、issues 同步修正；功能清单/P1 终态改为"待规划层最终确认" | §4 |

**生产代码改动清单**（全部在方向 §4 影响范围内，零 Flyway、零表结构变更）：
- `sw-framework/sw-common/pom.xml`：+spring-security-core 编译期依赖（版本由 spring-boot-dependencies BOM 管理）
- `sw-framework/sw-common/.../GlobalExceptionHandler.java`：+AuthorizationDeniedException 403 分支
- `sw-biz/sw-biz-system/sw-biz-system-biz/.../SysMenuServiceImpl.java`：菜单装配链按启用角色过滤
- `sw-biz/sw-biz-system/sw-biz-system-biz/.../UserDetailsProviderImpl.java`：权限装配链按启用角色过滤

---

## 2. 测试环境

| 项 | 值 |
|---|---|
| 后端 | Java 21，Spring Boot 3.4.4（spring-security 7.0.3，Boot BOM），H2，MAVEN_OPTS="-Xmx2g"；前后端编译互斥满足（各自 ps 检查无对侧进程） |
| 前端 | Vue 3 + Vite + Vitest，NODE_OPTIONS="--max-old-space-size=2048" |

## 3. 偏差修正详述与证据

### 3.1 偏差 1：真实生产权限拒绝链（HTTP 403 + body 403）

**根因**：Spring Security 6 方法安全抛出的 `AuthorizationDeniedException` 是运行时异常，穿透 `ExceptionHandlerInterceptor` 直达 `DispatcherServlet`，被 `GlobalExceptionHandler.handleException` 通用兜底捕获 → HTTP 500 + body 500。此前测试通过测试配置定制 `GlobalExceptionHandler` 子类把该异常重抛给 `RestAccessDeniedHandler` 得到 403——证据链被改写，非生产链路。

**修正**：
- `GlobalExceptionHandler` 新增 `@ExceptionHandler(AuthorizationDeniedException.class)` + `@ResponseStatus(HttpStatus.FORBIDDEN)` 分支，返回 `R.fail(403, "无权限")`，与 `RestAccessDeniedHandler`（认证过滤器链路 403）语义一致。
- sw-common 增加 `spring-security-core` 编译期依赖（`spring-boot-starter-web` 不含 spring-security 类；版本由 spring-boot-dependencies BOM 统一管理，无显式版本号）。
- `RoleMenusContractAndSecurityTest` 删除测试专用 `GlobalExceptionHandler` 覆盖（恢复 `new GlobalExceptionHandler()` 真实实现），移除兜底重抛逻辑。
- 新增 `GlobalExceptionHandlerTest`（sw-common，2 用例）：AuthorizationDeniedException → R{code=403}；普通 Exception → R{code=500} 兜底不变。

**证据**：请求级 13/13 通过（`RoleMenusContractAndSecurityTest`），测试日志实证 `WARN GlobalExceptionHandler -- access denied: Access Denied` → HTTP 403 + body code=403；`GlobalExceptionHandlerTest` 2/2。

### 3.2 偏差 2：停用角色 = 有效撤权（菜单/按钮权限对称过滤）

**根因**：`SysMenuServiceImpl.loadMenuIdsByUserId`（菜单树）与 `UserDetailsProviderImpl.loadPermissions`（按钮 permission）直接经 `sys_user_role → sys_role_menu` 装配全部绑定角色，不按 `sys_role.status` 过滤；而 `toLoginUser` 的 roles 装配按 `status=1` 过滤——两处不对称。角色停用后菜单/按钮权限仍装配，停用不能作为有效撤权手段。

**修正**：
- `SysMenuServiceImpl.loadMenuIdsByUserId`：`sys_user_role` 查询后追加 `sys_role`（status=1）过滤，仅启用角色贡献菜单；无启用角色 → 空树。
- `UserDetailsProviderImpl.loadPermissions`：同步按启用角色过滤（与 roles 装配同源），停用角色不再贡献按钮 permission。

**测试更新**（`AuthMenusContractAndSecurityTest`）：
- A4 用例由"如实记录旧行为"改为"撤权生效"断言：请求级菜单树为空 + service 级空树。
- A9 真实装配用例改为：停用角色 permissions 不再装配、菜单树为空（roles/菜单/权限三侧一致）。

**证据**：AuthMenus 12/12 通过；项目级全量 **674/0/0/0**。

### 3.3 偏差 3：Mock 双角色身份语义闭合

**根因**：默认超管会话 `roles:['admin']`+`superAdmin:true` 混淆双角色身份（普通 admin 角色码 + 超管标志），与后端双角色契约（superadmin code 旁路 / admin 显式绑定）不符。

**修正**（`src/foundation/mock/seeds.ts` + `handlers.ts`）：
- 超管会话 `MOCK_SESSION_DATA`：username=superadmin、roles=['superadmin']、superAdmin=true（code 旁路语义）。
- 新增 `MOCK_SESSION_DATA_ADMIN`（普通管理员）：username=admin、roles=['admin']、superAdmin=false、permissions 由 `MOCK_ROLE_MENU_BINDINGS['2']` 的按钮行装配（与真实后端非超管装配一致）。
- `switchMockSession`/登录 handler 按 username 三会话映射：superadmin → 超管、admin → 普通管理员、user → 普通用户、其他回退超管。
- `MOCK_USERS` 增加 superadmin 条目（登录凭证与会话一一对应）。
- 依赖顺序修正：`MOCK_SESSION_DATA_ADMIN.permissions` 在 `MOCK_ROLE_MENU_BINDINGS` 声明后补齐（TDZ 规避）。

**测试更新**（`auth-session.spec.ts`，+3 用例）：
- 登录 admin → 普通管理员会话（superAdmin=false、roles=['admin']、权限=admin 绑定按钮 permission，与超管全量严格区分）。
- 登录 superadmin → 超管会话（roles=['superadmin']、全量 permissions）。
- admin 非超管 /auth/menus 按绑定过滤 vs superadmin 全量对照。

**证据**：auth-session 13/13、session/index.spec、mock/index.spec 全过；前端全量 **73 spec / 681 tests / 0 failures**。

### 3.4 偏差 4：权威问题注册与终态同步

- **I53**（方法级鉴权拒绝兜底为 500）：已登记 knowledge/known-issues.md（索引表 + 详细条目），标记 ✅ 已修复。
- **I54**（角色停用后权限仍按绑定装配）：已登记 knowledge/known-issues.md，标记 ✅ 已修复。
- memory/issues.md：追加 I53/I54 已修复行；memory/handoff.md、memory/state.md 同步为"修正完成、待规划层最终验收"。
- 功能清单 / requirement-pool / current-status / memory：**F02/F03→✅、P1 核销、功能数 26 均标注为执行层候选终态，最终确认以规划层验收为准**（不回退执行层已同步事实，但明确未获规划确认）。

## 4. 测试结果

### 后端（项目级全量，2G 上限）

| 项 | 结果 |
|---|---|
| 全量 surefire 聚合（112 报告文件） | **674 / 0 / 0 / 0** |
| GlobalExceptionHandlerTest（新增，2 用例） | 2/2 |
| RoleMenusContractAndSecurityTest（13，真实链路 403） | 13/13 |
| AuthMenusContractAndSecurityTest（12，含撤权生效） | 12/12 |
| 既有回归（Flyway 全链、AuthFlow 等） | 全过 |

### 前端（四连，2G 上限）

| 项 | 结果 |
|---|---|
| typecheck | 0 errors |
| lint | 0 errors / 0 warnings |
| test 全量 | **73 spec / 681 tests / 0 failures** |
| build | 成功 |

基线对比：后端 670→674（+4）、前端 73f/678t→73f/681t（+3）。

## 5. 验收对照（D121 验收 10 条）

| 验收 | 结果 |
|---|---|
| 1 真实 API 与 Mock 语义逐项一致 | ✅ 真实 403 契约（HTTP 403 + body 403）实证；Mock 三会话语义闭合 |
| 2 Mock 保存真实更新状态 | ✅（D121 已证，未变） |
| 3 权限树加载/保存/清空/回填 | ✅（D121 已证，未变） |
| 4 superadmin 前端禁用 + 后端拒绝；普通 admin 不旁路 | ✅ 后端真实 403 拒绝（新证据）+ Mock 普通 admin 会话不旁路（新证据） |
| 5 非超管授权链（已授权可见/撤权不可达/按钮显隐/接口允许拒绝/未认证） | ✅ 撤权（角色停用）现为有效撤权（新证据：菜单空 + permission 不装配 + 接口拒绝 403） |
| 6 租户隔离 | ✅（D121 已证，未变） |
| 7 前端自动化回归 + 后端请求级安全测试 | ✅ 后端 403 走真实生产链路（新证据）+ Mock 双角色 spec |
| 8 零 Flyway、零默认授权、无无关变更 | ✅ 零 Flyway；生产改动 4 文件均在方向 §4 影响范围 |
| 9 全量测试不低于基线 | ✅ 后端 674/0/0/0（基线 647）、前端 73f/681t（基线 71f/646t） |
| 10 阶段三知识同步 | ✅ 本回执后按最终事实同步；**终态确认（F02/F03→✅、P1 核销）待规划层最终验收** |

## 6. 风险与遗留

- 生产改动范围：GlobalExceptionHandler（sw-common）+ 菜单/权限装配两处（sw-biz-system-biz）+ sw-common pom。均直接服务 D122 偏差，无无关变更。
- 后端测试计数 +4 精确对应：GlobalExceptionHandlerTest 2 + AuthMenus 撤权 2。
- Mock 超管会话 username 由 admin 改为 superadmin（登录默认回退超管不变，前端无登录用户名硬编码依赖）。
- 遗留（非本轮范围，已在回执披露）：角色创建与菜单保存跨请求非事务（D121 已记录，未扩项）；停用角色在"已签发 token 900s 窗口内"仍可调用（I 既有登记，非本方向）。

## 7. 结论

**功能级重验 PASSED**——D122 四类偏差全部修正，后端 **674/0/0/0**、前端 **73f/681t** 四连全绿，生产真实链路 403 契约、停用角色有效撤权、Mock 双角色身份、权威问题注册（I53/I54）均有自动化证据。**最终验收与阶段三终态确认（F02/F03→✅、P1 核销、功能数 26、方向归档）由规划层执行**。
