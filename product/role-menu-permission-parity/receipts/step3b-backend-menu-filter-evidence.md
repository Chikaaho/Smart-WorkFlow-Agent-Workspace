# Step 3b 执行回执：验收 5「已授权菜单可见」「撤权后菜单不可达」后端自动化证据补齐

**角色**：执行（后端，`Smart-WorkFlow/`）
**任务**：仅补测试，补齐方向 §6 验收 5 两个缺失/弱证据子项的后端自动化证据；禁止修改生产代码/迁移/前端
**方向**：`product/role-menu-permission-parity/ready/direction-role-menu-permission-parity.md`（§2.3、§6 验收 5）
**前置回执**：`product/role-menu-permission-parity/receipts/role-menu-permission-parity-completion.md`（§验收 5 BLOCKED 定性）

## 1. 一句话结论

新增请求级 + service 级 + 真实装配三层共 11 个自动化用例，对「非超管已授权菜单可见（正面）」与「撤权后菜单不可达」两个子项形成完整证据链（绑定混合行可见/树形契约/按钮行契约/绑定删除后空树/角色停用如实行为/无绑定空树/超管对照/未认证/租户隔离），全量回归 **670/0/0/0**（基线 660 精确增量 +11，110 个 surefire 文件），生产代码与迁移零触碰。

## 2. 新增测试清单

新增类：`Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthMenusContractAndSecurityTest.java`
（模式：仿 `RoleMenusContractAndSecurityTest` 请求级先例——真实 Spring Security 过滤链 + 真实 `AuthMeController` + 真实 `SysMenuServiceImpl`（MyBatis-Plus + 租户拦截器 + 逻辑删除）+ H2；另注入真实 `UserDetailsProviderImpl` 做装配侧证据。共 11 个测试方法，全部通过。）

| # | 方法 | 层级 | 断言要点 |
|---|---|---|---|
| A1 | `menus_nonSuperAdmin_shouldReturnOnlyBoundMenus` | 请求级（正面） | 非超管 u1（绑定目录 100、页面 110/120、按钮 111 混合行）→ GET `/system/auth/menus` 树只含绑定行；根节点=目录 100（parentId=null、id 为 String、sort 升序）；子节点 110→120 按 sort 挂载且 parentId="100"；按钮 111 挂 110 下；未绑定 200/300 不可达 |
| A2 | `menus_voContract_shouldMapButtonAndDirComponentToNullAndKeepPermission` | 请求级（按钮契约） | menu_type=2 行出现在树中且 component=null（AuthMenuVO 转换契约）、permission 原样返回（system:user:btn111）；目录 component=null；页面 component 保留、permission 原样 |
| A3 | `menus_afterDeletingRoleMenuBindings_shouldReturnEmptyTree` | 请求级（撤权-绑定删除） | 撤权前树非空；`DELETE FROM sys_role_menu WHERE role_id=2` 后同一用户 → 菜单树空列表、code=0 |
| A4 | `menus_roleDisabled_shouldStillReturnBoundMenus` | 请求级（撤权-角色停用，如实断言） | 角色 status 1→0（绑定行不删）→ 菜单树仍返回绑定行：`loadMenuIdsByUserId` 仅经 sys_user_role→sys_role_menu 过滤，不按角色 status 过滤菜单侧（与 `UserDetailsProviderImpl` 按 status=1 装配 roles 不对称，记录不修复） |
| A5 | `menus_userWithoutAnyBinding_shouldReturnEmptyTree` | 请求级（无绑定空树） | 无 sys_user_role 行用户 → 空列表、code=0 |
| A6 | `service_getMenuTree_userWithoutBindings_shouldReturnEmptyList` | service 级（无绑定空树） | `getMenuTree(2L, false)` → 空列表 |
| A7 | `service_getMenuTree_userWithMultipleRoles_shouldDeduplicateAndFilterByBindings` | service 级（正面补充） | u5 双角色（admin→[100,110,111,120]、assist→[100] 重复绑定）→ 去重后树只含绑定行、100 仅出现一次、子节点 sort 升序 |
| A8 | `menus_superAdmin_shouldReturnFullTreeIncludingUnboundMenus` | 请求级（超管对照） | superAdmin=true → 全量根节点 100/200/300（含未绑定行）按 sort 升序——旁路对照，证明非超管过滤非「巧合为空」 |
| A9 | `menus_unauthenticated_shouldReturn401` | 请求级（未认证） | 无认证头 → HTTP 401 + body code=401 |
| A10 | `menus_tenantIsolation_shouldNotSeeOtherTenantRoleBindings` | 请求级（租户隔离） | u1 同时持租户0 角色（→100/110/111/120）与租户5 角色（→300）：租户0 会话菜单树只含 100，租户5 绑定 300 不可达 |
| A11 | `provider_roleStatus_shouldOnlyAffectRolesListNotMenusNorPermissions` | 真实装配（撤权语义） | `UserDetailsProviderImpl.loadByUserId`：启用角色 → roles=[admin]+按钮 permission 装配+菜单树非空；停用角色（status=0，绑定保留）→ roles 为空（status=1 过滤）、不触发超管；但按钮 permission 仍装配、菜单树仍返回（loadPermissions/getMenuTree 均不过滤角色 status，如实断言） |

覆盖映射（任务 5 项要求）：① 正面可见 → A1/A7；② 按钮行契约 → A2；③ 撤权不可达（绑定删除 + 角色停用两路径如实）→ A3/A4/A11；④ 无绑定空树 → A5/A6（service 级正面补齐）；⑤ 请求级优先 + 真实装配 → 全部按 RoleMenusContractAndSecurityTest 模式装配 `X-Test-User` 过滤器驱动 LoginUserHolder。

## 3. 测试结果

- **跑前互斥检查**：`ps aux | grep -iE "pnpm|vite|vitest" | grep -v grep` → EXIT=1，无前端进程 ✓
- **模块级**（`MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-biz/sw-biz-system/sw-biz-system-biz -am test -DskipTests=false`）：
  - 新类单测计数：**Tests run: 11, Failures: 0, Errors: 0, Skipped: 0**
  - 模块聚合（sw-biz-system-biz + sw-common + sw-security + sw-dependencies + sw-biz-system-api）：**231/0/0/0（28 个 surefire 文件）**
- **全量**（`MAVEN_OPTS="-Xmx2g" mvn -q test`，后台执行 + 退出码 0）：**670/0/0/0（110 个 surefire 文件，本次实际执行）**；若把 1 份历史残留 XML（PgV33VerificationTest，源码已删、本次未执行）一并聚合为 671/111。
- **与基线 660/0/0/0（110 文件）对比**：
  - 基线构成 = 108 旧文件（646 tests）+ PgV33VerificationTest（1 test）+ RoleMenusContractAndSecurityTest（13 tests）= 660/110
  - 本次构成 = 108 旧文件（646）+ RoleMenus（13）+ **AuthMenusContractAndSecurityTest（+11）** = 670/110（PgV33VerificationTest 源码已删、不再执行——I52 归档产物，非本次触碰）
  - **精确增量：+11 tests / +1 新增测试类文件；文件总数持平（-1 已删 +1 新增）**；0 failures / 0 errors / 0 skipped 不变
- 中途两次失败均为本测试类自身缺陷并已修复（见 §5 易错点），修复后模块级与全量全绿。

## 4. 撤权语义实测结论（绑定删除 vs 角色停用）

两条路径的真实行为（请求级 + service 级 + 真实 `UserDetailsProviderImpl` 装配三侧实测）：

| 撤权路径 | 实测行为 | 与方向 §2.3 一致性 |
|---|---|---|
| **绑定删除**（删 sys_role_menu，方向主路径） | 菜单树即刻为空列表（A3） | ✅ **一致**——§2.3「普通角色…清空权限后，菜单可见…必须与绑定关系一致」成立 |
| **角色停用**（sys_role.status 1→0，绑定行保留） | ① `UserDetailsProviderImpl.loadByUserId`：roles 为空（**roles 侧按 status=1 过滤**）、不触发超管旁路（A11）；② 菜单树**仍返回绑定行**（A4/A11：`loadMenuIdsByUserId` 与 `loadPermissions` 均不按角色 status 过滤菜单/权限侧） | ⚠️ **不一致（生产既有行为，记录不修复）**——「停用角色」作为撤权手段时，菜单可见性与按钮 permission 仍按绑定装配（仅 roles 列表剔除）。方向 §2.3 未明文覆盖角色停用语义（只约束「保存、清空权限」），且任务明确「按真实实现如实断言，发现语义与方向 §2.3 冲突处记录不修复」；本 Step 仅记录，不改生产代码 |

**附加发现（如实记录，不修复）**：`loadPermissions`（按钮 permission 装配）同样不过滤角色 status——停用角色绑定的按钮权限仍会装配进非超管用户 permissions，与 roles 侧的不对称同源。前端按 `permissions` 显隐按钮时，停用角色用户的按钮仍显示。此为生产既有行为，与菜单侧结论一致，仅记录供规划层知悉。

## 5. 触碰文件清单 / 易错点 / BLOCKED

**触碰文件（仅测试文件与回执）**：
1. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthMenusContractAndSecurityTest.java`（新增，11 用例）
2. `product/role-menu-permission-parity/receipts/step3b-backend-menu-filter-evidence.md`（本回执）

**未触碰（确认）**：后端生产代码（含 `SysMenuServiceImpl`、`AuthMeController`、`UserDetailsProviderImpl`）、Flyway 迁移、sw-bootstrap、前端仓库。

**易错点（为何不复发）**：① `-Dtest=` 过滤与 `-am` 上游模块冲突（sw-common 无匹配测试即 fail），最终按任务指定命令形态跑模块级全量；② `insertUser` 种子 SQL 占位符与参数数量不符（首跑 11 个错误），已修复为 4 参齐备——测试类内集中 5 个种子方法 + `@BeforeEach` 全量 DELETE 重灌，避免跨用例状态污染。

**BLOCKED 事项**：**无**。本 Step 无阻塞；§4 的「角色停用撤权语义与 §2.3 字面不一致」为生产既有实现，属记录项而非阻塞项，按任务要求未修复。
