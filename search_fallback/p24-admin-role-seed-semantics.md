# P24：内置超管与可配置管理员角色语义探索回执

## 探索结论

只有启用角色 `code=superadmin` 触发超管旁路；`built_in` 当前只是字段，后端没有内置角色保护。V29 只补 job/storage 菜单行，普通角色没有菜单可见性；job/storage 控制器也没有方法级 permission 鉴权。P24 不能只补 seed，需与角色菜单配置最小子集一起闭环；现有用户迁移和默认用户须产品裁定。

## 八问结论

1. **保护**：`UserDetailsProviderImpl:116-153` 以启用角色 code 判定 superadmin；`SysMenuServiceImpl:41-58` 超管全量菜单、普通角色经 `sys_user_role→sys_role_menu` 过滤。`SysRoleServiceImpl:39-71`/`RoleController:48-68` CRUD 无 builtIn/code/status/dataScope 保护，故 superadmin 可被 API 改名、改 code、停用、删除、改数据范围；无角色菜单写入口。测试只证明旁路。

2. **前端**：`Smart-WorkFlow-Web/src/modules/system/views/RoleList.vue:351-355` 对所有角色显示编辑/删除；`395` 只在编辑时禁用 code，不是 builtIn 保护；表单无菜单权限字段。`RoleList.spec.ts` 无 builtIn 保护用例。后端须强制保护，前端只作 UX。

3. **角色菜单 CRUD**：后端 `RoleController` 只有 CRUD，`SysRoleServiceImpl` 只写 `sys_role_dept`；前端 `src/modules/system/api/role.ts` 只有 CRUD，RoleList 只有基本信息/dataScope/部门树，无菜单树/按钮权限入口。I36（`knowledge/known-issues.md:427-435`）仍确认绑定写入缺失；P1（`todo/requirement-pool.md:22`）仍列菜单绑定、按钮配置入口缺口。

4. **job/storage**：V29 h2/pg 相同（`V29__job_storage_menu_seed.sql:24-38`）：16 storage:view(type=1)、17 job:view(type=0)、18 job:list(type=1)、19 job:log(type=1)，且不 seed `sys_role_menu`。无 job/storage `menu_type=2` 权限记录和 role_menu 关系。三个 Controller 无 `@PreAuthorize`/`hasAuthority`，全局只保证 authenticated；当前只能确认超管可达，不能确认普通角色接口 permission。闭环需补角色关系、按钮权限模型/记录（若需要）及端点校验，字符串待裁定。

5. **admin seed**：V2/V4 历史 id=1/code=admin，V5 `V5__m_seam_rbac.sql:69-73` 已改为 id=1/code=superadmin/status=1/built_in=true；正式 seed 没有普通 admin。代码特殊判断只有 superadmin（`UserDetailsProviderImpl:45,127`），新增 admin 不触发旁路。前端 mock 仍有 id=1/code=admin/superAdmin=true（`Smart-WorkFlow-Web/src/foundation/mock/seeds.ts:1002-1010`），属陈旧 mock。新角色须避开 id=1，id=2 可行但非最终裁定；V1:92-109 是字段约束，data_scope 不可照搬 mock 的 5。

6. **用户绑定**：V4 `V4__seed_system_data.sql:12-24` 只有用户 id=1/username=admin，绑定 role id=1；无第二个生产 seed 用户证据。自动改绑会移除 superadmin 保护，自动新增账号也改变安全边界，均不得探索层决定。

7. **最小范围**：后端补 superadmin 保护、admin seed、sys_role_menu 读写/回填和 job/storage 权限；迁移补 V31 H2/PG 角色与授权；前端补 builtIn 保护、菜单树配置；测试覆盖保护、全新库/V30 升级、菜单过滤、接口允许/拒绝、非目标角色不扩权、H2/PG 一致。排除人员角色绑定、关联筛选、完整 RBAC/租户管理、默认用户设计。

8. **验收证据**：全新库/V30 升级库验证 superadmin 不可改名、改 code、停用、删除、改 scope/menu；admin 启用并获 16-19 授权；普通 admin 菜单可见、接口按 permission 放行/拒绝；无目标角色不扩权；菜单读写回填；V31 H2/PG 对齐；扩展 `FlywayFullChainH2Test:52-102`（当前 30 条）及前后端回归。菜单可见不得代替接口鉴权。

## 已确定事实

- I49 仍 CONFIRMED：`knowledge/known-issues.md:565-572`；V29 h2/pg 无 role_menu。
- `Smart-WorkFlow/功能清单.md:69-70` 的 M02-F01-01/M02-F02-01 为 🟦。
- 超管依据是角色 code，不是 userId；只有启用角色参与。

## 分析推测 / 未确认事项

- id=2 可避开 id=1，但 admin 名称、built_in、data_scope、默认权限仍需裁定。
- job/storage 可能需页面行与按钮行同时授权；当前页面 permission 不能形成接口鉴权闭环。
- superadmin 不可变字段、admin 默认权限全集、现有用户策略、各写接口精确 permission、PG 运行期验证均未确认；本任务禁止迁移验证。

## 是否需要继续探索

否。八问均有静态证据，余项属于产品裁定或实现阶段核定。

## 建议返回规划层的最小结论

按“不可变 superadmin + 初始化可配置 admin”，P24 应与角色菜单配置最小子集一起下发：V31 H2/PG seed admin 与 job/storage 授权，后端做超管保护和 sys_role_menu 读写/回填，再补前端入口；不得自动迁移现有用户或创建默认用户。接口权限、admin 默认权限及字段值需规划层明确。
