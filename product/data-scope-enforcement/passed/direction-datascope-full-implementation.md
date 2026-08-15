# 需求方向：data-scope-enforcement —— M02-F04-01 数据权限完整落地

> 规划层需求方向文档（D77）。执行层自行拆 Step、设计执行/测试方案、自主闭环，完成后提交功能级完成回执，规划层最终验收。
> 前置探索依据：`search_fallback/datascope-implementation-survey.md`（2026-08-13，11 问回执）。

## 背景

2026-08-12 全量审计确认 M02-F04-01「数据权限」实为零生效：`UserDetailsProviderImpl:111` 硬编码 `DataScope.ALL`，角色配置的数据范围完全不起作用，任何用户可见全租户数据（known-issues 对应条目，清单已降 ⬜）。前置探索（Q1-Q11）确认**基建完成度极高**：五档枚举双份就位、SysRole.dataScope 字段与 V1 建列就位、DataPermissionInterceptor + DataScopeHandler 四档拼接逻辑完整且已注册（链序租户→数据权限正确）、消费链（LoginUser→ThreadLocal→Handler）完整。缺口收敛为 4 处：

1. 登录装配硬编码 ALL，不读 `SysRole.dataScope`
2. 全仓库零 `@DataScope` Mapper 标注——拦截器完整但无任何查询生效
3. `sys_role_dept` 表不存在（CUSTOM 档无从装配，`LoginUser.customDeptIds` 从未填充）；`DeptScopeProvider` 无实现（DEPT_AND_CHILD 档 noop 兜底直接抛异常）
4. 前端角色页无 dataScope 控件、无部门树选择（类型定义已有字段）

## 目标

1. **装配去硬编码**：登录装配读取用户所有角色的 `SysRole.dataScope`，**多角色取最宽档**（并集语义：任一角色 ALL 即 ALL，以此类推），装入 LoginUser；CUSTOM 档同时装配 customDeptIds（取该用户 CUSTOM 角色关联部门的并集）。
2. **五档全部生效**：ALL / DEPT / DEPT_AND_CHILD / SELF / CUSTOM 端到端可用——
   - 实现 `DeptScopeProvider`（"本部门及以下"；sys_dept 无 ancestors 列，递归查询或加列由执行层权衡，若加列需 Flyway 迁移+回填）
   - 新建 `sys_role_dept` 表（Flyway 新版本，h2/postgresql 双份；root 路径 V29 已占用，现场确认空闲号）+ 角色 CRUD 读写关联
3. **查询纳管**：MP 通道业务列表查询按归属列（dept_id/create_by）接入数据权限。**最小强制集**：sys_user 分页（验收锚点）、sw_bpm_instance、sw_agent_graph_execution、sw_job_info/sw_job_log、sw_storage_file、sw_agent_model_config 的列表查询。其余 Q8 盘点候选由执行层裁定并在回执列明**最终纳管清单**（含"为何纳/不纳"一行理由）；本就按当前用户过滤的查询（notify recipient、agent session）不重复纳管。
4. **前端角色管理页**：dataScope 五档下拉；选 CUSTOM 时展示部门树多选（部门树接口已有 listTree）；编辑回填。
5. **知识库全量同步**（§3.3 第10项）：清单 M02-F04-01 状态按交付实际回升（预期 ⬜→✅）；known-issues 对应条目补修复记录；回执含清单变更明细+触碰文件清单。

## 非目标

- **不纳管**手写 SQL 通道：动态宽表（FormDataQueryService 等 JdbcTemplate 裸 SQL）与 bpm 外部数据源 SqlExecutor 完全绕过拦截器链（探索 Q7）——本轮不做手写拼接，作为已知限制记入 known-issues（与 I10 同源，可并入或关联）。
- **不做**数据权限实时生效：dataScope 登录时装配快照，改角色后下次登录/刷新生效（与停用 access token 900s 窗口同性质，记录即可）。
- **不做**行级自定义规则引擎/字段级权限——仅清单定义的五档部门维度。
- **不改**租户隔离机制与超管旁路（Handler 既有超管短路保留，装配时核对 isSuperAdmin 判定与 dataScope 读取联动）。

## 影响范围（预期，最终以执行层探索为准）

- 后端：sw-security（装配）、sw-common datascope 包（DeptScopeProvider 实现/SPI 装配）、sw-biz-system（角色 CRUD+sys_role_dept）、各纳管模块 Mapper（注意：`@DataScope` 只能标 Mapper 直声明方法，Service 直调 BaseMapper 的查询需改自定义 Mapper 方法或执行层另行设计全局接管——选择须在回执披露）、Flyway 新迁移（h2/pg 双份）
- 前端：RoleList.vue（下拉+部门树）、api/role.ts
- 测试：需自造多部门树+多用户种子（可复用 NotifyMessageIntegrationTest 裸插构造 + LoginUserHolder 切上下文先例）；基线 435（后端源码口径）/ 63f/552t（前端）

## 关键方向性判断

- **拦截器全局式**，不引入注解 AOP 式——项目已选定 RuoYi-Vue-Plus 路线（MP 3.5.9 + 拦截器已注册，全仓零 @Aspect），沿既有基建补缺口即可，不推翻重来。
- **多角色取最宽档**：与权限并集语义一致，避免"加角色反而看得更少"的反直觉。
- **空集恒假保留**：Handler 既有语义（CUSTOM 无关联部门→查不到数据）不改。
- **DEPT_AND_CHILD 实现方式（递归 vs ancestors 列）执行层定**：功能正确+有测试即可；若加列，迁移含存量回填。

## 验收标准（规划层最终验收依据）

1. 五档各至少一个集成测试证明过滤正确性：ALL 全量、DEPT 仅本部门、DEPT_AND_CHILD 含子部门（多层树）、SELF 仅本人、CUSTOM 仅关联部门（含空关联恒假）；多角色取最宽有测试；超管旁路回归不受影响。
2. 最小强制集全部接入并有测试；回执列明最终纳管清单及理由。
3. 前端角色页五档可配、CUSTOM 部门树可选可回填，四连（test/typecheck/lint/build）全绿。
4. 后端全量 BUILD SUCCESS 0 failures（基线 435+新增）；Flyway 新迁移 h2/pg 双份并通过迁移验证（仿 V26/V29 冒烟先例或执行层自定方式）。
5. 知识库全量同步完成（§3.3 第10项）：清单状态回升、known-issues 修复记录+手写 SQL 通道限制记录、回执含清单变更明细+知识库触碰文件清单。

## 待确认问题

无（用户已认可规划层推荐方向；执行层若发现方向性歧义或不可行——如最小强制集中某查询纳管后破坏既有业务语义——按 §3.2 在回执中报告，规划层再调整）。

---

**证据来源**：`search_fallback/datascope-implementation-survey.md` 全文（含执行层视角风险清单 7 条，执行层设计时应逐条对照）；`Smart-WorkFlow/功能清单.md:72` M02-F04-01 原文口径。
