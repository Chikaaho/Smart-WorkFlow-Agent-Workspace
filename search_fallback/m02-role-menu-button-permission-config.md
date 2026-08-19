# M02 角色菜单/按钮权限配置闭环探索回执

**角色确认**：本会话为 `执行`，仅现状探索，未生成需求方向、未实施、未运行任何状态变更命令。
**回执位置**：`search_fallback/m02-role-menu-button-permission-config.md`
**状态注记（2026-08-19，D121）**：本探索回执已被 **role-menu-permission-parity（D121）** 方向消费——方向文档前置探索引用即本文件；方向按本回执结论收敛为真实 API—Mock—页面—安全回归一致性收口，并已完成执行层功能级 PASSED（验收 1-9 全部 PASS、BLOCKED 已解除；后端 670/0/0/0、前端 73f/678t、生产代码与 Flyway 零修改；清单 M02-F02-01/F03-01 🟦→✅、P1 核销）。本文件保留为历史探索记录，不再改写内容。

## 探索结论（建议返回规划层）

**M02-F02-01 与 M02-F03-01 应合并为一个功能方向**：二者共享同一条 `sys_role_menu` 绑定表、同一组读/写端点（`GET/PUT /system/role/{id}/menus`）与前端同一个菜单权限树控件，按钮(menu_type=2)只是菜单树中的一种节点。规划可并入 P1 的"M02-F02/F03 权限配置入口"待排期项，形成"角色管理页增加菜单/按钮权限配置"单方向；两者独立拆分没有链路差异证据。

**最小闭环现状**：本轮（admin-role-governance，D96 PASSED，方向已归档 `product/admin-role-governance/passed/`）已经实现了后端读/写/回填闭环 + 前端树形配置入口 + superadmin 不可变保护 + V31 双方言 seed + 请求级 200/403/401 测试；**剩余真实缺口是 Mock 层无 `role/{id}/menus` handler**（`Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` 全文件仅 4 个角色 handler：page/:id/POST/PUT/DELETE；`GET/PUT /api/system/role/:id/menus` 零命中），以及前后端对权限树配置的自动化测试缺失（前端 RoleList.spec.ts 5 个用例仅覆盖挂载/分页/重置/删除，未覆盖权限树回填与保存；role.ts 与 role.spec.ts 无 menus 契约测试）。

## 七问结论

### 1. sys_role_menu 链路（读取/写入/删除/事务/租户）

- **表**：`sys_role_menu`（V1 建表，tenant_id+role_id+menu_id，逻辑删除 deleted，V13 唯一索引 `uk_sys_role_menu_tenant (tenant_id, role_id, menu_id, deleted)`；V5 曾调整为 `(tenant_id, role_id, menu_id)`，V13 再演进为带 deleted）。实体 `SysRoleMenu`（继承 BaseEntity，有 tenant_id 列）。
- **读**：`SysMenuServiceImpl.loadMenuIdsByUserId`（`sw-biz-system-biz/.../service/impl/SysMenuServiceImpl.java:72-100`，菜单过滤链路）；`SysRoleServiceImpl.listMenuIds`（`SysRoleServiceImpl.java:124-128`）；`UserDetailsProviderImpl.loadPermissions`（`sw-biz-system-biz/.../security/UserDetailsProviderImpl.java:219-256`，按钮权限装配）。
- **写**：`SysRoleServiceImpl.updateMenuIds`（`SysRoleServiceImpl.java:131-144`）——@Transactional 内**先删后插**（delete by roleId → 逐行 insert，filter+distinct）；`RoleController` `GET/PUT /system/role/{id}/menus`（`RoleController.java:79-90`），`@PreAuthorize` 分别绑定 `system:role:list`/`system:role:update`。
- **租户隔离**：`CommonTenantLineHandler`（`sw-common/.../mybatis/tenant/CommonTenantLineHandler.java`）在 MyBatis-Plus 层对所有租户实体自动追加 `tenant_id` 条件与写入填充（BaseEntity `FieldFill.INSERT`）；`sys_menu` 是全局表（无 tenant_id，配置 `application.yml:138` 在 ignore-tables，`SysMenu extends BaseEntityNoTenant`），故菜单数据全局共享，但**角色-菜单绑定严格按租户隔离**。无跨租户写入口证据。
- **seed**：V2（role 1 绑定 1/10-16/100-102/110-112）、V31（role 2 全量菜单+按钮 200-208）。其余新增菜单（V6/V10/V15/V26/V29/V33）均不 seed sys_role_menu。
- **事务**：create/update/delete/updateMenuIds 均 `@Transactional(rollbackFor=Exception.class)`。**风险点**：`create()` 与 `updateMenuIds()` 是两个独立事务（前端先 POST /system/role 拿 id 再 PUT /menus，`RoleList.vue:261-263`），角色创建后菜单保存失败会留下"有角色无权限"的空角色，无补偿机制。
- **删除风险**：`delete()`（`SysRoleServiceImpl.java:83-86`）只 `removeById`，**不清理 `sys_role_menu`/`sys_user_role`/`sys_role_dept`**——孤儿 role_menu 与 user_role 行残留（逻辑删除的 role 经 `sys_user_role` 仍可能被 UserDetailsProvider 查询到 roleIds，但 role 查询按 status=1 过滤；role_menu 的孤儿行无消费路径，属数据卫生问题而非安全漏洞）。

### 2. 角色 CRUD 时菜单/按钮关系与风险

- **新增/修改**：都不在事务内同步写 role_menu（只有 deptIds 先删后插）。前端创建/编辑后额外调 `updateRoleMenus` 补写（`RoleList.vue:256-264`）。编辑超管时前端跳过菜单保存（`RoleList.vue:258`，isProtectedRole），后端 `updateMenuIds` 对 superadmin 有 `assertMutable` 抛错兜底。
- **内置角色误改**：`assertMutable`（`SysRoleServiceImpl.java:146-152`）仅当 `built_in=true && code='superadmin'` 才拒绝 update/delete/updateMenuIds；**其他任何 built_in=true 的角色（如 V31 之后 seed 的 admin 是 built_in=false；若未来 seed 其他内置角色）不受保护**。V31 的 admin 明确 built_in=false，故当前无第二个内置角色被误改风险。`create()` 另有"不可创建内置超管角色"检查。
- **孤儿关系**：见 Q1 删除不清理；`V31` 的 `updateMenuIds` 先删后插是"清空重授"语义，无增量更新。
- **跨租户绑定/越权配置**：租户拦截器对 sys_role_menu 生效（未在 ignore-tables），且 `assertMutable`/权限端点有 `system:role:update` 方法级鉴权；**未见可绕过租户的写路径**。但注意 `SysMenuServiceImpl.loadMenuIdsByUserId` 查 `sys_user_role` 时未按 tenant 显式过滤——由租户拦截器自动补条件，仍受保护。
- **判断**：主要剩余风险为"创建后菜单写失败产生空角色"与"删除残留孤儿行"（数据卫生级），以及内置角色保护条件只识别 superadmin 单角色。

### 3. 菜单/按钮模型区分与权限贯通

- **模型**：`sys_menu.menu_type`（0=目录 1=菜单 2=按钮，V1 建表，V2 seed 字典 11-13 行）；`SysMenu` 实体含 `permission` 列。菜单与按钮**同一张表同一棵树**，按钮是 menu_type=2 的叶子节点（component=null，V1/V2 seed 的 100-112、V31 的 200-208、V33 的 209-211 均为按钮行）。
- **后端加载**：登录时 `UserDetailsProviderImpl.toLoginUser`（`:97-156`）→ 非超管 `loadPermissions`（`:219-256`）只取 `menu_type=2` 且 permission 非空的按钮行 → `LoginUser.permissions`（超管空数组旁路，`LoginUser.isSuperAdmin()` 短路）。**契约**：只有按钮行（menu_type=2）进入权限集合；目录/页面行不参与 `hasPermi`。
- **接口鉴权**：`@EnableMethodSecurity`（`WebSecurityAutoConfiguration.java:34`）+ `@Bean("ss") PermissionService`（`:55-57`）→ `@PreAuthorize("@ss.hasPermi('...')")`（RoleController:31/45/54/63/73/80/86；UserController 各端点；JobInfoController 8 个方法；StorageController 5 个方法）。`/system/auth/me|menus` 不在 permit-urls，无 token → 401（AuthMeControllerTest 断言）。
- **前端过滤**：`GET /system/auth/menus`（AuthMeController:81-91）→ 超管全量、非超管按 role_menu 过滤（SysMenuServiceImpl:41-66）→ `foundation/menu/index.ts` 路由构建时 `menuType===BUTTON` 跳过（`:98-100`）→ 侧边栏/路由只含目录与菜单；`foundation/permission/index.ts` `hasPerm`/`v-permission` 指令按 `session.permissions` 控制按钮显隐（`isSessionPlaceholder` 占位态放行）。
- **契约（不得破坏）**：① 权限来源只能是 menu_type=2 按钮行（改动会让现有 `@PreAuthorize` 失效）；② `superadmin` 旁路是 code 判定不是 id；③ AuthMenuVO 的 id/parentId String 化、component 目录/按钮置 null（AuthMenuVO:32-42）；④ `uk_sys_role_menu_tenant` 唯一约束；⑤ 菜单树不做租户过滤（全局表）。

### 4. 前端角色管理页现有配置能力

- **能力已具备**：`RoleList.vue` 已有"菜单与按钮权限"树形配置区（`:515-526`：el-tree show-checkbox、node-key=id、props label=title、check-strictly 未开=父子联动，`@check` 用 `getCheckedKeys(true)` 只取叶子全选；`isProtectedRole` 时整树 disabled）；编辑回填 `getRoleMenus`（`:224`）、保存 `updateRoleMenus`（`:258/262`）；超级管理员编辑/删除按钮禁用（`:283-286,396-406`）；部门树（CUSTOM 数据范围）先例 `applyDeptCheckedKeys` 回填模式（`:154-157,232-234`）。
- **可复用模式**：StandardListTemplate/StandardFormTemplate 槽位模板 + FormSection/FormGrid（同 DeptList/PostList 页型 B）；`foundation/menu` `loadMenu()` 直接复用为权限树数据源（角色页已经这么用）；`foundation/permission` 指令体系。
- **API/types**：`role.ts` 已有 `getRoleMenus`/`updateRoleMenus`（`:62-68`）；`types/role.ts` 无菜单字段（树勾选在组件内用独立 `permissionIds` 状态，不走 SysRole 类型）。
- **Mock 缺口**：`handlers.ts` **无** `GET/PUT /api/system/role/:id/menus` handler（全文仅 4 个角色 CRUD handler，pattern 见 `:1200/:1220/:1230/:1252/:1273`）——mock 模式下角色菜单配置的读/写会 404，属真实未闭环项。
- **测试缺口**：RoleList.spec.ts 仅 5 个用例（挂载分页/页码/重置/删除），`vi.mock('@/modules/system/api/role')` 未 mock `getRoleMenus/updateRoleMenus`（超管保护、权限树回填、保存调用均未覆盖）；role.spec.ts 未覆盖 menus 两个 API。seeds.ts 的 `MOCK_ROLES_LIST` 中 superadmin 行 `dataScope:5`（`seeds.ts:1112` 附近）与后端 DataScope 枚举 0-4 不符（后端 `toDataScope` 越界按 ALL 处理，语义一致但数值陈旧，属陈旧 mock）。

### 5. 近期功能对旧审计结论的修正

- **admin-role-governance（D96 PASSED，已归档）**：旧结论"无角色菜单写入口"**已失效**——`GET/PUT /system/role/{id}/menus` + `updateMenuIds` 已实现；"后端 CRUD 无 builtIn/code/status 保护"**已修正**——`assertMutable`/create 检查已加；"job/storage 无方法级鉴权"**已修正**——JobInfoController 8 个 + StorageController 5 个 `@PreAuthorize` 已加；"V29 不 seed role_menu"**已修正**——V31 双方言 seed role 2 全量菜单 + 按钮 200-208。但注意 **V33（agent 菜单 209-211）仍不 seed sys_role_menu**——沿用超管旁路决策，普通角色不可见（这是明确决策不是缺口）。
- **user-group-membership（D117 PASSED + 阶段三 COMPLETED，已归档）**：I36 正式关闭（关闭的是用户组绑定缺口），**P1 中 M02-F02/F03 权限配置入口仍待排期**（requirement-pool.md:22）；M01-F04-01 为 🟦 不升 ✅。用户组**消费端（流程/权限）未接**，与本需求直接相交的边界：用户组绑定角色/菜单暂无关联表，不在本需求范围。
- **pg-v13-migration-chain-repair（D108-D111）**：PG 全链 V1→V34 现可直跑（`FlywayFullChainPostgresTest` 9 用例），**消除了此前"PG 侧无法验证迁移链"的旧阻塞**——若本方向新增 V35 双方言迁移，PG 侧可直接全链验证。
- **仍成立**：superadmin 超管判定是 code 不是 id；`menu_type=2` 是权限唯一来源；`sys_menu` 全局表无租户隔离；菜单可见性 ≠ 接口权限（页面 permission 不能代替按钮 permission）；"未来新增菜单不自动授权 admin"（V33 未 seed role_menu 正是该决策的延续）。

### 6. 模块级影响范围、Flyway 判断、安全边界与最小验收

- **影响范围**：`sw-biz-system-biz`（SysRoleServiceImpl/Controller + 测试）、`sw-framework/sw-security`（无改动，契约已支持）、`sw-bootstrap`（Flyway + FlywayFullChainH2Test/PostgresTest）、前端 `Smart-WorkFlow-Web`（handlers.ts 补 mock、RoleList.vue/RoleList.spec.ts/role.spec.ts 补测试、seeds.ts 清理陈旧 dataScope=5；RoleList.vue 本体已是闭环实现，无新 UI 代码）。
- **Flyway 判断**：仅当需要"为既有角色补默认授权/新增菜单按钮行"时才需 V35 双方言迁移；**若只做"配置入口 + mock/测试闭环"，迁移为零**。如需迁移：最新版本 V34（user-group-membership），V35 可用；h2/pg 同语义双份、主迁移目录 `db/migration/{h2,postgresql}`（application.yml:104-112 主迁移 location 首位）；PG 全链现可直跑验证（I52 已关闭）。参照先例：V31 的 INSERT SELECT WHERE NOT EXISTS 幂等 + 冲突显式失败（`V31__admin_role_governance.sql`）。
- **安全边界**：① superadmin 不可经 API 改 code/停用/删除/改 scope/改菜单授权（assertMutable + 前端禁用双保险）；② 非 superadmin 的 `system:role:*` 权限者也只能操作本租户角色（租户拦截器）；③ 按钮权限必须经 menu_type=2 行授予，页面可见不等于接口可调；④ 创建与菜单保存两个事务若拆分，需接受"空角色"可能或由规划裁定合并为单事务端点。
- **最小验收场景**：a) 新建普通角色→勾选目录/菜单/按钮→保存→刷新回填一致（H2 全链 + 前端 spec）；b) superadmin 角色编辑/删除/菜单保存被禁（前后端 403/禁用双路径）；c) 非超管普通用户登录：菜单树只含被授权菜单、按钮显隐按 permission、调未授权接口 403、调授权接口 200（AuthMeControllerTest 已有普通用户空树基线 + RoleControllerTest 端点 200/403 门禁可扩展）；d) 全新库 + V34 升级库均通过（含 V35 时）；e) h2/pg 双方言一致性（若含迁移）。

### 7. F02/F03 合并判断

**适合合并**，直接证据：
- 同一张表 `sys_role_menu`、同一组端点（`GET/PUT /system/role/{id}/menus` 同时覆盖菜单与按钮）、同一个前端树控件（RoleList.vue 的"菜单与按钮权限"区将目录/菜单/按钮渲染在一棵树上，`getCheckedKeys(true)` 只存叶子）。
- 数据模型上按钮是菜单树的子节点（menu_type=2），**不存在独立于菜单树的按钮绑定表**。
- 拆分需要人为制造两套写入口与两套回填逻辑，反而破坏现有单一链路。
- 唯一微调：若规划要求"按钮与菜单分开展示/分步保存"，才需在树控件上按 menu_type 分组过滤——属于 UI 呈现问题，不构成数据层拆分。

## 已确定事实 vs 分析推测

**已确定事实**：sys_role_menu 读写端点与实现已存在（Q1 文件行号）；superadmin 保护在 assertMutable/create；V31 seed 角色 2 全量菜单+按钮 200-208；V33 不 seed role_menu；前端 RoleList.vue 权限树配置已实现但 Mock 缺 handler（handlers.ts 全文无 role/:id/menus pattern）、RoleList.spec.ts 5 用例无权限树覆盖；P1 中 M02-F02/F03 仍待排期；最新迁移 V34、PG 全链直跑已修复。

**分析推测**：创建/菜单保存双事务的"空角色"残留属推测风险（无现成失败证据，但代码路径明确）；删除残留孤儿 role_menu 行属数据卫生推测（无安全影响证据）；`seeds.ts` 的 `dataScope:5` 与后端枚举 0-4 数值不一致属陈旧 mock（后端越界按 ALL 处理，行为等价）。

## 未确认事项

- 规划层是否要求"创建角色与保存菜单合并单事务"（当前是两个端点两个事务）。
- 是否需要在 V35 中为既有普通角色补充默认授权（若规划要求"新功能菜单对既有角色默认授权"，则违反 V33"不自动授权"决策，需规划裁定）。
- 前端权限树父子联动（check-strictly=false）与半选节点的保存语义（当前只存全选叶子）是否符合规划预期。

## 是否需要继续探索

否。七问均有静态证据，无冲突信息；剩余为产品裁定项（是否拆/是否迁移/事务合并）。本探索未运行任何命令、未修改任何文件。
