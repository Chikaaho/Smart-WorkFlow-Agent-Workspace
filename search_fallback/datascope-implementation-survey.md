# 探索任务回执：数据权限（DataScope）完整落地前置调研

- **任务来源**：`search_task/datascope-implementation-survey.md`（2026-08-13 规划层下发，11 问）
- **执行方式**：4 个并行 Sub Agent 分线调查（设计遗产/拦截基建/纳管盘点/清单先例），统一汇总
- **总体结论**：基建完成度极高（枚举/字段/拦截器/SPI 全就位），缺口 4 处——① `UserDetailsProviderImpl:111` 硬编码 ALL；② Mapper 零标注；③ `sys_role_dept` 表缺失；④ 前端零 UI。
- 路径前缀默认 `/data/reasonix/files/Smart-WorkFlow/`，Web 为 `Smart-WorkFlow-Web/`

## A. 设计遗产

**Q1 DataScope 枚举：✅可复用（5 档，双模块双份）**
- sw-security `security/holder/DataScope.java:7-19`：ALL/DEPT/DEPT_AND_CHILD/SELF/CUSTOM（全部/本部门/本部门及以下/仅本人/自定义部门）
- sw-common `common/datascope/DataScopeType.java:8-20` 同 5 档（按 name() 解耦）；同包 `DataScope.java:20` 另为 `@interface` 注解（deptAlias/userAlias）

**Q2 SysRole 字段与映射表：字段✅ / 映射表❌**
- 实体 `sw-biz-system-biz/.../entity/SysRole.java:35` 已有 dataScope（注释"S7 预留"）；postgresql/h2 `V1__init_schema.sql:105` 已建列 `data_scope smallint default 0`
- `sys_role_dept`/RoleDept：java/sql 全仓库**零命中**；`V5__m_seam_rbac.sql` 空文件

**Q3 硬编码上下文：载体 ThreadLocal✅ / 消费链完整✅ / 零生效❌**
- 硬编码：`UserDetailsProviderImpl.java:111` `setDataScope(DataScope.ALL)`（L105-110 未读 SysRole.dataScope）
- 载体：`LoginUser.java:27/32`（dataScope/customDeptIds）→ `LoginUserHolder.java:13-15` ThreadLocal；JWT 只带 userId
- 消费方 2 个链路完整：`SecurityLoginContextProvider.java:40-46` 映射 DataScopeType；`sw-common/.../datascope/DataScopeHandler.java:56-80` MultiDataPermissionHandler 四档拼接齐全（CUSTOM→L110-113、SELF→create_by=userId、空集恒假 L145-147）
- 但全仓库 main 代码 `@DataScope(` 命中 **0 个** Mapper → 拦截器完整、无查询生效

**Q4 前端角色页：🟡半成品（类型有字段，UI 零控件）**
- `Web/src/modules/system/types/role.ts:12` 有 `dataScope?: number`
- `Web/src/modules/system/views/RoleList.vue` 表单仅 name/code/sort/status/description（resetForm L109-117、回填 L129-134），**无 dataScope 选项、无部门树**；`api/role.ts` 零命中

## B. 查询拦截基建

**Q5 拦截器链：租户✅ / 数据权限🟡半成品（基建全、零接入）**
- 注册 `common/config/mybatis/MybatisPlusConfig.java` 链序 L82-98：**租户 → 数据权限 → 乐观锁 → 分页**；数据权限 Bean L75-80（`sw.data-scope.enabled` matchIfMissing=true）
- 租户 `CommonTenantLineHandler.java:13`：列固定 tenant_id、兜底租户 0；忽略=**纯表名单**（application.yml:137-139 仅 sys_menu），零 `@InterceptorIgnore`
- 数据权限半成品：DataScopeHandler 实现完整，但①零 @DataScope 标注；②`DeptScopeProvider` 无实现，MybatisPlusConfig:66-73 noop 兜底对 DEPT_AND_CHILD 抛 UnsupportedOperationException

**Q6 用户-部门归属：单列✅ / 部门树无 ancestors❌**
- `SysUser.java:46-47` 仅 dept_id 单列；`V1__init_schema.sql` sys_dept:28-45（id/parent_id/name/code/sort/status/leader_id，**无 ancestors/path**，仅 idx_parent_id）；sys_user:83 dept_id+索引 → "本部门及以下"需递归逐层查

**Q7 动态宽表兼容性：❌裸 SQL 完全绕过拦截器链**
- `FormDataQueryService.java:172/192/258/301` JdbcTemplate 执行（:42 自注释"拦截器对裸 JdbcTemplate 失效"）；Update/DeleteService 同模式
- `sw-bpm-engine/.../executor/SqlExecutor.java:70` 独立 JdbcTemplate 连外部数据源（:169"裸 JDBC"）
- 其余全仓：零 XML mapper、零注解 SQL，全走 BaseMapper → 拦截器覆盖 MP 侧、不覆盖手写 SQL 通道

## C. 纳管范围盘点

**Q8 有归属列、多用户共享读取候选（12 条：表 | 归属列 | 查询入口）**
1. sys_user | dept_id | `SysUserServiceImpl.java:61` page()，零过滤
2. sw_bpm_instance | initiator_id | `BpmInstanceServiceImpl.java:51` pageInstances（:77 selectList，仅可选过滤）
3. Flowable 待办 | taskAssignee | `BpmTaskFacadeImpl.java:84` queryTodoPage（tenantId+assignee=userId）— Flowable API
4. sw_bpm_process_def | create_by | `BpmProcessDefServiceImpl.java:138` selectPage
5. sw_notify_message | recipient_id | `NotifyMessageServiceImpl.java:20-22` findByRecipient
6. 动态表单物理表 | create_by（`DynamicTableManager.java:52` DDL 固定列）| `FormDataQueryService.java:115` — **手写 JDBC**
7. sw_storage_file | create_by | `StorageController.java:67-72` service.page
8. sw_agent_session | create_by | `AgentConversationServiceImpl.java:52-57`（已做用户级过滤）
9. sw_agent_graph_execution | create_by | `AgentGraphExecutionServiceImpl.java:220-231`（:227 selectPage，注释"仅租户级不过滤用户"）
10. sw_agent_model_config | create_by | `AgentModelConfigServiceImpl.java:66-72` pageModels
11. sw_job_info / sw_job_log | create_by | `JobInfoServiceImpl.java:38-53`、`JobLogServiceImpl.java:40-45` page
12. sys_dept 部门树 | 无归属列（parent_id 树）| `SysDeptServiceImpl.java:63-66` listTree

**Q9 测试夹具先例：✅可复用（H2 集成+LoginUserHolder 切上下文），❌无多部门种子**
- `DictFacadeTest`：@SpringBootTest+H2；TestConfig 全量 LoginContextProvider Bean（:169-206），@BeforeEach `LoginUserHolder.set(...)` → **多用户只换 LoginUser**
- `NotifyMessageIntegrationTest`：手搭 MP 基建，JdbcTemplate 裸插 2 收件人×2 租户验证隔离（:181-247）— 最直接先例
- `FormDataQueryServiceTest`：LoginUserHolder.set + 裸 INSERT 显式写 create_by；`BpmTodoControllerTest`：Mockito+LoginUserHolder
- 缺口：无 Testcontainers/BaseTest 抽象类、data-h2.sql 无 sys_dept/sys_user 种子

## D. 清单与先例

**Q10 功能清单原文（仅 Smart-WorkFlow 持有）**
- `功能清单.md:72`：`| M02-F04-01 | 数据权限 | 配置 | 数据范围控制：本人/本部门/本部门及下级/自定义部门/全部 | ⬜ |`（状态⬜无备注列）；L35 横切先行含数据权限；落地 sw-biz-system+sw-security；前端无清单

**Q11 框架先例倾向：拦截器全局式（项目已选定的 RuoYi-Vue-Plus 路线）**
- 若依经典 4.x/5.x = 注解+AOP；RuoYi-Vue-Plus（MP 3.5.x）= 拦截器全局式（DataPermissionInterceptor+MultiDataPermissionHandler）
- 硬证据：① `sw-dependencies/pom.xml:25` MP 3.5.9 + :86-92 已管 jsqlparser；② 拦截器+DataScopeHandler 已注册（MybatisPlusConfig:75-98），SPI 按拦截器式就位；③ 全仓零 @Aspect 先例、无 starter-aop
- 结论：**倾向拦截器全局式**；剩余 = 去硬编码读 SysRole.dataScope + 实现 DeptScopeProvider + Mapper 标注 + 前端 UI

---

## 执行层视角风险清单

1. **DEPT_AND_CHILD 即炸**：DeptScopeProvider noop 兜底直接抛异常（MybatisPlusConfig:66-73）——角色选"本部门及以下"必现，须实现部门树递归（sys_dept 无 ancestors，需递归/加列）
2. **拦截器与租户叠加**：链序租户→数据权限正确，但忽略机制不同（租户=表名单，数据权限=注解反射），叠加时注意注入条件的表别名匹配；宽表两条链都不覆盖
3. **动态宽表绕过**：form/外部数据源裸 SQL 完全绕过（Q7），若纳管 form 需手写拼条件
4. **@DataScope 只标 Mapper 直声明方法**（DataScope.java:15 自注释），BaseMapper 裸调无法标注——12 条候选多为 Service 直调 BaseMapper，需改自定义 Mapper 方法或拦截器全局接管
5. **超管旁路**：handler L61-63 有超管短路，装配时 isSuperAdmin 判定需与 SysRole.dataScope 读取联动核对
6. **CUSTOM 链路最长**：customDeptIds（LoginUser:32）从未填充 + sys_role_dept 表不存在 → 建表+装配+前端部门树三级联动
7. **测试缺口**：无多部门种子/部门树先例，需自造 sys_dept 树+多用户；可复用 NotifyMessageIntegrationTest 构造模式
