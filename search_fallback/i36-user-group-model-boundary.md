# I36 用户组及剩余组织关系模型边界探索回执

> 探索任务：`search_task/i36-user-group-model-boundary.md`；执行角色产出。

## 探索结论

1. **I36 独立有效，剩余缺口 = 用户组绑定**：known-issues.md:48 + :436-446 修正段（「D101 关闭用户-普通角色绑定管理子集；用户组绑定仍待修复」）。用户-角色绑定子集已由 D101 关闭，不可重复。
2. **用户组前后端全链零实现**：后端 456 Java + 72 SQL、前端 229 src 文件检索 user_group/userGroup/usergroup/用户组/虚拟组 零命中（grep 已核验）。无实体/表/迁移/Mapper/Service/Controller/API/页面/路由/Mock/权限标识。清单 M01-F04-01 ⬜（功能清单.md:59），P28 未排期（requirement-pool.md:65）。
3. **用户组语义未定义**：唯一出处 = 功能清单.md:59「虚拟组/用户组维护，跨部门人员归集，供流程与权限引用」。无关系模型（绑角色/权限？多对多？租户/状态/负责人/层级？）。D108（memory/decisions.md:11）正因「缺用户组关系模型与产品边界」而优先选 I52。
4. **五条组织关系全部已实现**；M02-F02/F03 与 I36 是并列候选，无依赖。

## 检查范围

knowledge/（known-issues、current-status、session-handoff、features/*、model-registry）、功能清单.md、todo/requirement-pool.md、product/{admin-role-governance,user-org-association-query,sys-mgmt-crud}/、memory/、后端全 Java/SQL/XML、前端 src 全文件（均静态检索，未运行/未修改）。

## 关键证据

- **五条关系全实现**：用户-部门 SysUser.java:47-48（deptId 单值）+V1:82；用户-岗位 V32__sys_user_post.sql + SysUserServiceImpl.java:161-170（先删后插、仅启用岗位）；用户-角色 V1:137+V13:48 + SysUserServiceImpl.java:135-150（整量替换、superadmin 过滤:140）；角色-菜单/按钮 V1:152+V13:52 + RoleController.java:79-90（GET/PUT /system/role/{id}/menus）；角色-自定义部门 V30__sys_role_dept.sql + SysRole.java:35-37 + datascope/DeptScopeProviderImpl.java。
- **菜单自身 CRUD 不存在**：无 MenuController/无 /system/menu 端点；SysMenuServiceImpl 仅 getMenuTree/loadMenuIdsByUserId；菜单全由迁移种子装配（V2/V4/V6/V10/V15/V26/V29/V31/V33）。
- **权限标识**：@ss.hasPermi；Controller 实际仅 system:user/role:{list,create,update,delete}；system:menu:list 仅种子无写权限；Dept/Post/Dict Controller 无 @PreAuthorize。
- **迁移链**：最新 V33，H2/postgresql 双端同步，全 SQL 无用户组。
- **前端**：UserList.vue 部门/岗位/角色绑定齐全（L407-433）；组合查询 UI 缺失（筛选仅 username/status）但 UserFilter 已预留 deptId/postId/roleId；RoleList.vue 菜单权限树 L515-526、自定义部门 L493-511；无菜单管理页；菜单 mock 只读。
- **P24 完成面**：direction-admin-role-governance.md:13,34-36（按角色配置菜单/按钮权限读写回填+最小用户角色绑定）、:38-46（非目标：不完成 P1 其余缺口）；completion.md:29-31（M02 三行保持 🟦）；D97 核销 P24、关 I49。
- **M02 🟦 理由**：known-issues.md:387「用户组及其他组织关系不在本轮范围」，非「分配能力」缺失。
- **D101 完成面**：direction-user-org-association-query.md:1,15,21-38,45,67 + d101:47（I36 仅关闭用户角色绑定子集，不涉用户组）。

## 已确定事实

1. 用户组语义唯一来源 = 清单一行描述，无模型、无 P 级裁定。
2. 五条关系全部实现；组合查询后端已闭合（D101），前端组合查询 UI 仍缺（候选边界，不属 I36）。
3. 按角色分配菜单/按钮已完成（P24）；M02-F02/F03 🟦 原因 = known-issues.md:387（用户组等组织关系不在范围），非分配能力缺失。
4. 菜单管理页无实现证据，M02-F02-01 残余是否含它未裁定。

## 分析推测

M02-F02/F03 剩余 ≈「权限配置入口」补齐（菜单管理页、system 控制器权限纳管）——推测，材料仅 P1 合并提及（requirement-pool.md:22）；用户组「供权限引用」或复用 sys_role_menu 式绑定——推测，无证据。

## 未确认事项 / 冲突信息

- **用户组语义**（组绑角色/权限？多对多？租户/状态/逻辑删除/负责人/层级？）：无材料定义，**必须规划层裁定**。
- **I36 vs M01-F04-01**：「绑定」（M02-F01-01 描述内）vs「维护」（M01-F04-01），合一还是两个功能未裁定。
- **冲突**：前端 user.ts:32-34 注释「后端不支持 query 筛选」与 D101 已闭合后端组合查询冲突（旧注释未同步）；M02 🟦 口径 completion.md:29-31（不做终态裁决）与 known-issues.md:387（用户组缺口）措辞不同但事实一致。
- **M02-F02-01 残余边界**：checklist-gap-hardening.md:33（非目标：不新增菜单管理配置 UI）vs feature-checklist-full-audit.md:146（曾列「无菜单管理页」为缺口）口径不一。

## 是否需要继续探索

否。八问已答；剩余不确定性全部属产品裁定，非代码事实缺失。

## 建议返回规划层的最小结论

- **I36 仍独立有效**，有效部分仅「用户组绑定」，语义未定义。
- **若选 I36 必须先裁定**：①组与用户基数（建议多对多）②组是否绑角色/权限及引用方式 ③租户/状态/逻辑删除/负责人/层级 ④I36「绑定」与 M01-F04-01「维护」合一或分离。裁定后独立闭环可行：后端 V34 迁移（双端）+实体/Mapper/Service/Controller（对齐 sys_user_role 模式）+权限标识+前端页面/路由/API/Mock/测试，无 Flyway 链外依赖，不重复 D97/D101；验收证据对照 D101 标准（保存/替换/清空/回填、组合查询、双租户与数据权限、停用/删除边界、非 superadmin 保护、V34 迁移全链、前端专项+Mock、后端全量回归、§3.3 知识同步）。
