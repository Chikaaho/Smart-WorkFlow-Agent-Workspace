# P24 双层管理员角色后端探索回执

## Q1 seed 迁移链
- **roleId=1 superadmin**: V2:57 初插(code='admin')→V5:71-73 改 code='superadmin',status=1,built_in=true,data_scope=NULL
- **userId=1**: V4:15-19 插入(username='admin',is_admin=1,status=0);V5 后无变更
- **绑定**: V4:22-24 sys_user_role(id=1,user=1,role=1);V6:18-21 清除旧 role_menu,此后超管走旁路不 seed role_menu

## Q2 保护矩阵
**userId=1 — 全无保护**: update/delete/停/密码重置均无拦截(`SysUserServiceImpl:77-102`);角色解绑可清空(`updateRoleIds():143` 先 delete all)
**roleId=1/superadmin — 有保护**: create 拒(`SysRoleServiceImpl:52-54`);update/delete/updateMenuIds 均经 `assertMutable():146-152`(built_in=true && code='superadmin' 抛异常)

## Q3 运行时判定
**完全依据 code='superadmin'**: `UserDetailsProviderImpl:45,127`(`SUPER_ADMIN_ROLE_CODE`);`PermissionService:21-23`(superAdmin 短路)
- userId==1 硬编码:**未发现**(全仓库 grep)
- isAdmin 字段:**死代码**(`SysUser:50-52` 映射,无业务读取)
- roleId==1/通配符 `*`:**未发现**

## Q4 admin 字段契约
`built_in=false`(V31 已 seed),`status=1`,`data_scope=0(ALL)或3(SELF)`,`code='admin'`。编辑/删除由 `built_in && code='superadmin'` 决定 → admin(built_in=false)**可被改删**

## Q5 API 充分性
**链路完整**: 角色 CRUD(`RoleController:53-77`)+菜单绑定(`:85-89`)+用户角色绑定(`UserController:111-116`)。**缺失**: admin 角色无不可变保护

## Q6 job/storage 权限
Controller 权限: `job:list/create/update/delete/pause/resume/trigger/log` + `storage:upload/list/delete/download`
V29 仅 seed 菜单 16-19(`storage:view/job:view/job:list/job:log`)→**会 403**(缺按钮权限)
V31 补 9 个按钮(id=200-208)+为 role_id=2 绑定全菜单 → 最小完整集=菜单 id 16-19+200-208(共 13 行)

## Q7 V31 冲突策略
**sentinel 机制**: V31:3-8 条件 INSERT 检测 code='admin'/id=2 存在 → 插 sentinel 行 → 紧接 VALUES INSERT 主键冲突 → Flyway 回滚。冲突即报错,不覆盖
- 全新库:无冲突
- 已升级库 code='admin' 存在:A)人工改名 B)可选迁移 C)裁定为保留 code
- id=2 占用:A)换 id B)人工腾挪 C)保留 id
- H2/PG V31 逐行一致

## Q8 测试覆盖
**已有**: RoleControllerTest/UserControllerTest(CRUD+PreAuthorize);FlywayFullChain H2/PG;UserDetailsProviderDataScopeTest;RoleMenusContractAndSecurityTest
**缺失**: 超管 update/delete 返业务异常;userId=1 无角色时 isSuperAdmin=false;admin 可配置全链;admin 权限点 200/403;V31 冲突 sentinel 回滚;userId=1 删除保护(需先补代码)

---

## 分类汇总
**已有保护**: assertMutable 拦截 superadmin CRUD;create 拒 builtIn/superadmin;updateRoleIds 过滤 superadmin;PermissionService 超管旁路;UserDetailsProvider 仅 code 判定;V31 sentinel 冲突即失败;H2/PG 一致
**缺失保护**: userId=1 全无保护;admin 可改删;superadmin-user 绑定可解;is_admin 死代码;V29 无按钮→403
**迁移冲突风险**: 已升级库 code='admin'/id=2 占用→V31 失败需人工;role_menu ROW_NUMBER 自增单线程安全
**需产品裁定**: admin.built_in 是否 true+assertMutable 扩展;userId=1 不可变保护;is_admin 废弃/赋义;V31 冲突处置策略;admin.data_scope 默认值;user=1↔role=1 绑定不可解

## 未确认项
未读 SysMenuController/Service;未验证 ROW_NUMBER id 连续性;未运行任何测试/迁移
