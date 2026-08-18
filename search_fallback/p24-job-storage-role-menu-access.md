# 探索回执：P24 / I49 job/storage 普通角色菜单可达性

## 探索结论

I49 已确认：V29 只创建 job/storage 菜单，没有创建 `sys_role_menu`；超管因 `superadmin` 旁路可见，非超管必须经用户角色→角色菜单→菜单 ID 才能看到。当前数据库没有可直接作为“非超管内置管理角色”的 seed 角色，目标角色需产品确认。

## 检查范围

相关迁移、菜单/权限服务、Flyway 全链测试、knowledge、功能清单和需求池。未读前端，未运行命令，未修改业务代码。

## 八问结论

### 1. V29 菜单与不可见链路

`h2/postgresql/V29__job_storage_menu_seed.sql:24-38` 新增：

| ID | 父级 | 类型 | permission |
|---:|---:|---:|---|
|16|0|叶子菜单|`storage:view`|
|17|0|目录|`job:view`|
|18|17|叶子菜单|`job:list`|
|19|17|叶子菜单|`job:log`|

同文件第 20 行明确“不 seed sys_role_menu”。`SysMenuService.java:10-14`、`SysMenuServiceImpl.java:68-99` 证明：超管返回全量菜单，非超管按 `sys_user_role → sys_role_menu → sys_menu.id` 过滤。因此普通角色即使有接口 permission，没有 16-19 的菜单授权也拿不到菜单树。`UserDetailsProviderImpl.java:215-255` 另只从 `menu_type=2` 按钮记录装配权限，页面/目录行不能替代菜单授权。

### 2. 内置角色

完整 seed 只有 role ID `1`：V2 初始 code `admin`、名称“超级管理员”、内置标记 true（`V2__init_data.sql:56-57`）；V5 改 code 为 `superadmin`（`V5__m_seam_rbac.sql:71-73`）。没有其他内置角色。V2 为 role 1 绑定初始菜单 1、10-16、100-102、110-112（`V2__init_data.sql:79-93`）。

### 3. 授权先例与方言

先例是 V2：创建菜单后逐行插入 `sys_role_menu`，含租户/删除/版本/role/menu 字段；V6/V10/V15/V26/V29 对新增菜单均不 seed role_menu。V29 h2/pg 无差异；V5/V13 后唯一索引为 `uk_sys_role_menu_tenant`。

### 4. 最小迁移范围

若目标角色已存在且 role ID/code 已明确，新增 root 主迁移一枚（V31）并提供 h2/pg 两份，只插目标角色对菜单 16-19 的必要授权；前端和 job/storage Java 可零改动。当前没有非超管内置角色，因此若要求全新库自动可见，还必须先决定是否新增角色，不能自行猜定。

### 5. 版本与目录风险

最高版本 V30（`sys_role_dept`），V31 可用；主目录为 `db/migration/{h2,postgresql}`，其他模块另有各自目录。无版本冲突，需保持双方言同语义；主迁移先于 prod-update。

### 6. 全链测试与最小断言

`FlywayFullChainH2Test.java:42-102` 使用 7 个 location，校验迁移成功、30 条已应用、`validate()` 通过；当前没有 V29 菜单/role_menu 断言。最小新增断言：菜单 16-19 的存在、父子关系、类型、permission；目标 role 对 16-19 各有一条未删除授权；非目标 role 无新增授权；h2/pg V31 结构/ID/租户与删除字段对齐。因当前只有 role 1，非目标角色需在夹具中创建。

### 7. 知识与清单一致性

一致：`knowledge/known-issues.md:565-572` 将 I49 标为 CONFIRMED/待修复；`todo/requirement-pool.md:32` 的 P24 同样待排期；`knowledge/current-status.md:18,217` 记录 V1-V30 连续且 I49 在候选池。`功能清单.md:204,207` 将定时任务/文件存储标 ✅，表示功能及超管入口完成，不表示普通角色授权完成；与 I49 不冲突。`checklist-gap-hardening` 只覆盖 I43/I44 的超管可达口径。

### 8. 目标角色选择

事实是当前没有“非超管指定内置管理角色”，不能凭名称推荐。最小目标集合应是一个明确指定的非超管角色：

1. 指定已有 role code：影响最小，只补 4 条授权；
2. 新增并 seed 一个内置管理角色：还需定义角色语义及用户绑定；
3. 不自动 seed，依赖角色菜单配置入口：全新库不能自动可见。

## 已确定事实

V29 h2/pg 新增 16-19 但未写 role_menu；非超管依赖 role_menu，超管由 `superadmin` 旁路；当前仅 role 1，最高版本 V30；后端 V31 迁移即可覆盖，前端/业务 Java 非必要。

## 分析推测

若指定已有角色，V31 双方言迁移即可闭环；页面 permission 不能替代 role_menu。

## 未确认事项

目标角色的正式 code/ID/名称/数据范围，以及是否允许新增内置角色。

## 冲突信息

I43/I44 的“生产菜单可达”只覆盖超管旁路；I49 补充普通角色授权缺口，属于口径层级差异，不是 V29 文件冲突。

## 是否需要继续探索

否。证据足以进入规划层；唯一阻塞是产品选择目标角色。

## 建议返回规划层的最小结论

P24 可收敛为 root V31 h2/pg 数据迁移 + Flyway 最小断言，前端和业务 Java 零改动；先确认一个目标角色（已有 role code，或是否新增非超管内置角色）。
