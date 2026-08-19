# Step 1 回执：后端契约与安全回归验证（P1/M02-F02/F03）

**角色**：执行（后端）
**方向**：`product/role-menu-permission-parity/ready/direction-role-menu-permission-parity.md`（§4、§6.4、§6.5、§6.7、§6.8）
**结论（一句话）**：`GET/PUT /system/role/{id}/menus` 六条契约与安全语义全部经静态代码 + 既有测试 + 新增 13 个请求级测试验证通过，与方向 §2.3 无冲突，全量回归 **660/0/0/0**（基线 647 + 新增 13），**无 BLOCKED**，未修改任何生产代码。

---

## 1. 检查范围与结论摘要

- 范围：`RoleController` 两个端点、`SysRoleServiceImpl.listMenuIds/updateMenuIds/assertMutable`、`CommonTenantLineHandler`、`sys_role_menu`/`sys_menu` 表与实体、方法级鉴权链（`@PreAuthorize`+`@ss.hasPermi`+401/403 handler）、既有测试覆盖核对。
- 方式：静态逐行确认 + 既有测试证据 + 新增 1 个请求级测试类（13 用例，真实 Spring Method Security + 真实 Service/Mapper + H2）。
- 结论：方向 §2.3（superadmin 后端拒绝、admin 无旁路、租户隔离、唯一约束不变）**全部成立**；未发现生产代码与方向冲突的真实缺陷，无 BLOCKED。

---

## 2. A 项六条逐项语义确认（证据）

### A1 读取：返回该角色全部已绑定 menuId（含按钮/目录/页面行），非空/空集合行为

- `RoleController.java:79-83`：`GET /system/role/{id}/menus` → `listMenuIds(id)`，`R<List<Long>>`。
- `SysRoleServiceImpl.java:124-128`：`selectList(sys_role_menu where role_id=?)` → stream map `menuId` → `filter(nonNull)` → `distinct()` → `toList()`。**不按 menu_type 过滤**：按钮(2)、目录(0)、页面(1)行均原样返回。
- 空集合：无绑定 → 返回 `data=[]`（code=0）。
- 新增测试：`getMenus_shouldReturnAllBoundIdsIncludingButtonAndDirRows`（[200,201,18] 混合树全返回）、`getMenus_withoutBindings_shouldReturnEmptyArray`（空数组 code=0）。

### A2 替换保存：先删后插、去重（filter+distinct）、null/空数组=清空

- `SysRoleServiceImpl.java:130-144`（`@Transactional(rollbackFor=Exception.class)`，:131）：
  - `:134` 先 `delete(where role_id=?)`（MyBatis-Plus 逻辑删除，UPDATE deleted=1）；
  - `:135-137` `menuIds==null` → return（此时删除已执行=清空）；
  - `:138` `filter(nonNull).distinct().forEach(insert)`。
- 去重语义在**应用层**（distinct），DB 唯一索引 `uk_sys_role_menu_tenant(tenant_id,role_id,menu_id,deleted)`（V13）为最终兜底。
- 新增测试：`putMenus_shouldReplaceAndReadBack`（替换+回读）、`putMenus_shouldDeduplicate`（重复提交只落 2 行）、`putMenus_withEmptyArray_shouldClearAll`、`putMenus_withNullBody_shouldClearAll`（经 service 直调验证 null=清空）。

### A3 未知角色：PUT 静默成功并写孤儿关系（如实记录）

- `updateMenuIds` **不校验角色是否存在**：`assertMutable` 对不存在角色直接跳过（:146-152），删除影响 0 行仍继续插入 → **孤儿 sys_role_menu 行**（无 sys_role 对应）。
- 方向 §3「非目标」明确不处理角色删除后历史关系清理等数据卫生问题；本条与方向无冲突，属**已知行为**而非缺陷。
- 新增测试：`putMenus_toUnknownRole_shouldSucceedSilentlyWithOrphanRows`（roleId=99999 → code=0，孤儿行落库）。

### A4 受保护角色：superadmin 被拒，admin 可写

- `assertMutable`（`SysRoleServiceImpl.java:146-152`）：`role!=null && builtIn==true && code=='superadmin'` → 抛 `BaseException(PARAM_ERROR=400, "内置超管角色不可修改或删除")`。**判定是 code 不是 id**（方向 §2.3/§6.4 一致）。
- 错误传输：`GlobalExceptionHandler.java:20-24` → **HTTP 200 + body `{"code":400,"msg":"内置超管角色不可修改或删除"}`**。
- role id=2 admin（V31 seed `built_in=false`）→ 不触发保护，可正常写。
- 新增测试：`putMenus_toSuperadmin_shouldBeRejectedWithParamError`（HTTP 200+code=400，superadmin 原绑定未被删改）、`putMenus_toAdminRole_shouldSucceed`。

### A5 鉴权链：403 / 401 / 超管旁路

- `@PreAuthorize("@ss.hasPermi('system:role:list')")`（GET，`RoleController.java:80`）、`@PreAuthorize("@ss.hasPermi('system:role:update')")`（PUT，:86）。
- `PermissionService.java:16-25`：`loginUser==null→false`；`isSuperAdmin()→true`（**超管旁路**）；否则查 `permissions.contains(permission)`。
- 401：permit-urls 仅 swagger/api-docs/actuator/auth/*（`application.yml:157-164`），**不含 /system/role/** → 未认证走 `RestAuthenticationEntryPoint`**（HTTP 401 + `R{code:401}`）；已认证无权限走 `RestAccessDeniedHandler`（HTTP 403 + `R{code:403}`），二者均见 `WebSecurityAutoConfiguration.java:82-88`。
- 新增测试：`putMenus_withoutPermission_shouldBeForbidden`（403）、`putMenus_unauthenticated_shouldBeUnauthorized`（401）、`putMenus_superAdminBypass_shouldPassMethodSecurity`（permissions 为空仍放行）。
- **重要环境事实（见 §6）**：全局 `GlobalExceptionHandler.handleException(Exception)` 会把 `@PreAuthorize` 抛出的 `AuthorizationDeniedException` 兜底为 **500**（生产 bug）。本测试环境对 `AccessDeniedException`/`AuthorizationDeniedException` 重抛交由 `RestAccessDeniedHandler` 恢复 403 语义（见 §5 新测试说明）。

### A6 租户隔离：sys_role_menu 受租户拦截器约束，sys_menu 为全局表

- `CommonTenantLineHandler.java:25-51`：`getTenantId()` 取 `LoginContextProvider.getTenantId()`（无登录态→`SUPER_TENANT_ID`）；`getTenantIdColumn()="tenant_id"`；`ignoreTable()` 非 master 数据源跳过，否则查 `tenantProperties.getIgnoreTables()`。
- `application.yml:136-139`：ignore-tables 仅 `sys_menu`。**sys_role_menu 不在 ignore-tables → 所有 select/update/insert 自动追加 tenant_id**。
- `SysRoleMenu extends BaseEntity`（`SysRoleMenu.java:15`）→ `BaseEntity` 追加 `tenantId`（`BaseEntity.java` `@TableField(fill=FieldFill.INSERT)`）→ `CommonMetaObjectHandler.insertFill` 写 tenant_id；`SysMenu` 全局表（无 tenant_id 列，`BaseEntityNoTenant`）。
- 无绕过路径：写路径 `updateMenuIds` 经 mapper（拦截器生效）；无裸 SQL。
- 新增测试：`roleMenus_shouldBeTenantIsolated`（租户0 读不到租户5 绑定；跨租户 PUT 按未知角色处理、孤儿行落在本租户、原租户数据不受影响）。

---

## 3. B 项覆盖度核对表

| 既有测试 | 覆盖内容 | 缺口 |
|---|---|---|
| `RoleControllerTest.menus_shouldReadAndWrite` | 控制器层 mock 调用透传（读返回列表、写空列表） | 仅 mock 单测，无请求级行为 |
| `RoleControllerTest.governanceEndpoints_shouldHaveMethodPermissions` | 反射断言 PUT /menus 的 `@PreAuthorize` 值 | 仅注解字符串，无真实链 |
| `AuthMeControllerTest`（3 用例） | 超管 /me 全量、超管 /menus 全树、普通用户空树、未认证 401 | 无 role/menus 端点 |
| `AuthFlowIntegrationTest`（7 用例） | login→/me→/menus 端到端、401/停用/锁定/refresh | 无 role/menus 端点 |
| `StorageControllerAuthorizationTest` / `JobInfoControllerAuthorizationTest` / `UserGroupAuthorizationTest` | 请求级 403/401 方法鉴权模式 | 非 role/menus 端点 |
| `FlywayFullChainH2Test`（9 用例） | V31 seed（admin 全量+按钮 200-208）、P24 冲突显式失败、V32→V34 链 | — |

**新增测试**：`RoleMenusContractAndSecurityTest`（13 用例，`sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/`）。

**新增原因（对应方向 §6 验收 4/5 缺口）**：
1. 「superadmin 前端不可改 + 后端拒绝」缺**请求级**证据 → 新增 `putMenus_toSuperadmin_shouldBeRejectedWithParamError`（HTTP 200 + code=400 + 绑定未删改）。
2. 「非超管允许/拒绝/未认证三类」在 role/menus 端点上无请求级证据 → 新增允许（admin 可写）、拒绝（403）、未认证（401）、超管旁路四用例。
3. 「租户隔离」在 role/menus 上无请求级证据 → 新增 `roleMenus_shouldBeTenantIsolated`（方向 §6 验收 6）。
4. 读/写/清空/去重/未知角色语义在真实 Service+DB 层无证据（既有为 mock）→ 新增 8 用例（A1/A2/A3 全覆盖）。

**未新增**：既有测试已充分覆盖的（超管 /me、菜单树、401 未认证 /me 等）未重复。

---

## 4. C 项测试结果

- 前置检查：编译前 `ps aux | grep -iE "pnpm|vite|vitest|node.*vite"` 无前端进程（EXIT=1）→ 前后端互斥满足。
- 命令（后端根目录 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow`）：
  1. `MAVEN_OPTS="-Xmx2g" mvn -q compile` → BUILD SUCCESS
  2. `MAVEN_OPTS="-Xmx2g" mvn -q test`（全量）→ BUILD SUCCESS
- **最终计数（surefire XML 聚合口径）**：**660 tests / 0 failures / 0 errors / 0 skipped，110 个报告文件**。
- **基线对比**：基线 647/0/0/0（109 文件）→ **增量 +13（1 个新文件）**：新增 `RoleMenusContractAndSecurityTest`（13/0/0/0）。
- 失败明细：无。
- 说明：输出中出现的 `Migration of schema ... to version "31" failed` 为 `FlywayFullChainH2Test.adminSeedConflict_shouldFailExplicitly` **预期内**日志（该测试故意构造 V31 冲突并断言 FlywayException，测试本身 PASS）；`429 too many requests` 等为 agent 测试的预期 mock 错误日志。均不影响结果。

---

## 5. 契约语义对照表（供前端 Mock 对齐的最小基准）

| 项 | 值 |
|---|---|
| 路径 | `GET /system/role/{id}/menus`、`PUT /system/role/{id}/menus`（真实无 `/api` 前缀；前端 MSW 按项目前缀 `/api/system/...`） |
| 方法 | GET（读）、PUT（整体替换） |
| 请求载荷 | `PUT` body = `number[]`（menuId 数组，Long 序列化；项目 Jackson 配置 Long→String，前端注意数字/字符串兼容） |
| 成功响应 | `{"code":0,"msg":"ok","data":[...]}`；GET data=menuId 数组（含按钮/目录/页面行，无序、去重）；PUT data=null |
| 读空角色 | `data: []`（code=0） |
| 清空 | 空数组 `[]` 或 body `null` → 删除全部绑定（=清空） |
| 重复保存 | 应用层 filter+distinct 去重，重复提交不产生重复行（等价幂等替换） |
| 未知角色 PUT | **静默成功** code=0，写入孤儿关系（删除影响 0 行仍继续插入） |
| 受保护角色 | `built_in=true && code='superadmin'` → **HTTP 200 + body `{"code":400,"msg":"内置超管角色不可修改或删除"}`**（业务错误走 200+body.code 模式） |
| 无权限 | 已认证但无 `system:role:update` → **HTTP 403 + body `{"code":403,"msg":"无权限"}`**（真实环境受 §6 全局 advice 影响见下方提示） |
| 未认证 | → **HTTP 401 + body `{"code":401,"msg":"未认证"}`** |
| 超管 | 超管旁路：permissions 为空数组仍可读写任意角色；但对 superadmin 角色本身的 PUT 仍被 assertMutable 拒绝（code=400） |
| 租户隔离 | sys_role_menu 按 tenant_id 隔离；sys_menu 全局表（无租户）。跨租户 roleId 读=空数组、写=按未知角色处理（静默成功写本租户孤儿行） |
| 数据范围 | `dataScope` 越界按 ALL 处理（`toDataScope`），Mock 无需特殊处理 |

**给前端 Mock 的三条提示**：
1. Mock 必须**真实更新内存状态**（保存后可被后续 GET 读到），否则回填失真（方向 §5 风险 1）。
2. Mock 对 superadmin 的 PUT 要模拟 code=400（而非 403/成功）；前端 `isProtectedRole` 禁用是 UI 层，后端拒绝必须独立存在（方向 §2.3/§6.4）。
3. Mock 端 401/403 用 HTTP 状态码 + body code 双信号；业务错误（400）只用 body code（HTTP 200）——与真实后端 axios 拦截器按 body.code 判断一致。

---

## 6. 已确定事实 vs 分析推测；BLOCKED

**已确定事实（静态+测试证据）**：
- 上述 A1-A6 全部行为均经测试实证（§2 每项附测试）。
- `GlobalExceptionHandler` 的 `@ExceptionHandler(Exception.class)`（`GlobalExceptionHandler.java:30-35`）会捕获方法级鉴权抛出的 `AuthorizationDeniedException` 并返回 **HTTP 500 + code=500**。**这是生产代码的既有行为**，方向 §5 风险 3 要求「保留允许、拒绝与未认证三类证据」——实际生产 403 语义被 advice 吞掉，仅 `RestAccessDeniedHandler` 定义存在。**不修改生产代码**（本任务默认不改），通过测试环境定制 handler 验证真实 403 语义；此事实已记录供规划层知悉（若需真实 403 可另行立项）。
- V31 seed：admin 角色（id=2）`built_in=false`、无 code 旁路；superadmin（id=1）`built_in=true`+code='superadmin'。
- `sys_role_menu` 唯一约束 `uk_sys_role_menu_tenant(tenant_id, role_id, menu_id, deleted)` 保持不变。
- V33（agent 菜单 209-211）不 seed sys_role_menu（超管旁路决策延续）。

**分析推测（无测试证据）**：
- 高并发下重复 PUT /menus 的竞态（delete+insert 非原子）——单事务内但无锁，理论上可丢绑定；无现成失败证据，属数据卫生级推测，不扩项。
- 前端 `RoleList.vue` 的 `getCheckedKeys(true)` 半选语义与后端「全量替换」的差异（只存叶子 vs 存全部）——属前端侧核对，不在本回执范围（前端 Step 处理）。

**BLOCKED 事项：无。**

---

## 7. 本次触碰文件清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/RoleMenusContractAndSecurityTest.java` | **新增测试文件** | 13 用例请求级契约+安全+租户证据 |
| `product/role-menu-permission-parity/receipts/step1-backend-regression.md` | 回执 | 本文件 |

**未触碰**：生产代码、Flyway 迁移、`sw-bootstrap`、任何前端文件。生产代码零修改。
