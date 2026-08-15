# 功能级完成回执：data-scope-enforcement —— M02-F04-01 数据权限完整落地

- **功能编号/名称**：data-scope-enforcement（D77）M02-F04-01 数据权限
- **方向文档**：`product/data-scope-enforcement/ready/direction-datascope-full-implementation.md`
- **执行日期**：2026-08-14 ~ 2026-08-15
- **执行方式**：执行层自主拆 5 Step，subagent 分线执行（后端基建装配 / 前端角色页 / 查询纳管 / 独立验证门 / 知识库同步），统一汇总
- **最终判定（执行层自验）**：**符合全部验收标准，提请规划层最终验收**

---

## 1. 功能目标

修复 2026-08-12 审计确认的 M02-F04-01 零生效问题（known-issues I37）：`UserDetailsProviderImpl:111` 硬编码 `DataScope.ALL`，角色数据范围配置完全不生效。按 D77 方向实现五档数据权限端到端可用（ALL/DEPT/DEPT_AND_CHILD/SELF/CUSTOM）+ 查询纳管 + 前端配置 UI。

## 2. 自拆 Step 概要

| Step | 内容 | 执行方式 | 结果 |
|------|------|---------|------|
| B-A | 基建与装配：Flyway V30 sys_role_dept（h2/pg 双份）、DeptScopeProviderImpl（递归）、Role CRUD 扩展 dataScope/deptIds、装配去硬编码（多角色取最宽） | subagent | ✅ 103 tests 全绿 |
| F1 | 前端角色页：五档下拉 + CUSTOM 部门树多选 + 编辑回填 | subagent | ✅ 四连全绿 |
| B-B | 查询纳管：最小强制集 7 表接入 + 测试 + 纳管清单裁定 | subagent | ✅ 新增 58 tests 全绿 |
| 验证门 | 后端全量 test + V30 Flyway 冒烟 + 枚举 ordinal 前后端对账 | 独立验证 agent | ✅ 521/0/0 |
| K1 | 知识库全量同步（§3.3 第10项） | subagent | ✅ 完成 |

## 3. 实际修改范围

**后端（Smart-WorkFlow，未提交，约 40+ 文件）**

- **Flyway**：`sw-bootstrap/.../db/migration/{h2,postgresql}/V30__sys_role_dept.sql`（新建，双份逐字一致）：BaseEntity 全列 + role_id/dept_id + `uk_sys_role_dept(role_id, dept_id)` 唯一索引
- **实体/Mapper**：`SysRoleDept`（新）、`SysRoleDeptMapper`（新）、`SysRole`（+瞬态 deptIds）
- **装配**：`UserDetailsProviderImpl` 去硬编码——`resolveWidestScope` 多角色取最宽（ALL > DEPT_AND_CHILD > CUSTOM > DEPT > SELF，按枚举名比较；CUSTOM 档 customDeptIds = 全部启用 CUSTOM 角色关联部门并集；无角色/越界兜底 ALL，与历史行为一致；超管判定未动）；`SystemAutoConfiguration` 装配补 Mapper
- **DeptScopeProviderImpl**（新，sw-biz-system datascope 包）：Java 递归 + 单表查询（不加 ancestors 列，避免存量回填）；**修复生产级循环依赖**（sqlSessionFactory→拦截器→Provider→Mapper 环，@Lazy 破环）；环保护 visited 集；`@ConditionalOnMissingBean` noop 被自动覆盖（测试断言生效 bean 非 noop）
- **Role CRUD**：`SysRoleServiceImpl` create 写关联（去重）、update 事务内先删后插、getById/分页批量回填 deptIds（无 N+1）
- **查询纳管**：sw-common 新增 `DataScopeFilter`（resolve 值对象，复用既有 LoginContextProvider/DeptScopeProvider，未另造 SPI）；7 表接入见 §7.3
- **测试**：新增 86 个（详见 §4）；`schema-datascope-h2.sql`/`data-datascope-h2.sql` 测试种子（3 层部门树 5 部门 + 6 用户）

**前端（Smart-WorkFlow-Web，未提交，2 文件）**

- `types/role.ts`（+6）：deptIds?: string[] + dataScope ordinal 注释
- `views/RoleList.vue`（+127/-5）：五档下拉、CUSTOM 时 el-tree 部门树多选（check-strictly，getCheckedKeys 同步）、编辑回填（setCheckedKeys）、非 CUSTOM 提交 deptIds=[]；自测修复 TDZ bug（watch 在 form 声明前）

## 4. 测试与验收结果

### 4.1 后端全量（CONFIRMED 2026-08-15，独立验证 agent）
`MAVEN_OPTS="-Xmx512m" mvn -q test` exit 0：**521 tests / 0 failures / 0 errors**（基线 435 → **+86**；surefire XML 按时间窗过滤防陈旧产物污染；源码口径 @Test 计数 521 逐条吻合）。
逐模块：sw-common 16、sw-security 4、sw-basic-agent 178、sw-basic-job-biz 48、sw-basic-notify-biz 7、sw-basic-storage-biz 16、sw-biz-form-biz 76、sw-biz-system-biz 111、sw-bpm-engine 18、sw-bpm-process 47

### 4.2 前端四连（CONFIRMED 2026-08-14）
typecheck ✅ / lint ✅（0 warn）/ test ✅（**63 files / 552 tests**，基线持平）/ build ✅。
**一次性内存例外披露（用户拍板）**：typecheck/build 在 512M 下实测必然 OOM（exit 134，V8 堆 ~510MB 顶满，与仓库 0869748 提交定 1024M 的原因一致）；经用户裁决本次仅这两个阶段用 1024M（串行独占，其余命令仍 512M），1024M 下 exit 0 全绿。此为一次性例外非通用授权，512M 硬约束不变。

### 4.3 V30 迁移冒烟（仿 V26/V29 先例，临时测试跑完已删、pom 零改动）
纯 Flyway API + H2：**28 个迁移**（V1→V30）按序应用 + validate 通过；V30 断言全绿（表/三列/唯一索引/重复插入被拒）。**口径修正**：历史记载"27 迁移"漏计 form V12，实际 28，已同步修正知识库。6 目录链排除 bpm（既有 I47 问题，非本批引入，生产 PG 不受影响）。

### 4.4 数据权限过滤测试明细（验收标准 1/2 的证据）
| 测试 | 强度 | 覆盖 | 结果 |
|---|---|---|---|
| SysUserDataScopeTest（system） | H2 真过滤，真实拦截器链 + 真实 DeptScopeProviderImpl，3 层部门树 | ALL/DEPT/DEPT_AND_CHILD 含子部门/SELF/CUSTOM/CUSTOM 空关联恒假/超管短路/DEPT 无部门恒假；断言分页 total（count 带范围条件） | 8/8 |
| BpmInstanceDataScopeTest（bpm-process） | H2 真过滤 | 五档 + 超管 + 空关联 + DEPT-null（initiator_id 归属） | 8/8 |
| AgentDataScopeTest（agent） | H2 真过滤 | model_config 8 + graph_execution 7（VARCHAR create_by CAST 实测，含业务条件叠加） | 15/15 |
| UserDetailsProviderDataScopeTest | Mockito | 多角色最宽×3、CUSTOM 并集、单角色×3、无角色默认、停用角色排除、null 兜底、超管、未知用户 | 12/12 |
| DataScopeFilterTest（sw-common） | Mockito | resolve 五档语义 + 超管/null 边界 | 12/12 |
| JobInfo/JobLog/StorageFile DataScopeTest | 纯 Mockito 传参 | scope + 业务条件透传、空串归一化 | 15/15 |
| DeptScopeProviderTest | Mockito | 递归/多层级/空父/环保护 | 9/9 |
| RoleDataScopeTest | H2 | deptIds 写入/回读/更新覆盖/分页回填/去重/清空 | 7/7 |

### 4.5 验收标准逐条对照（方向文档）

| # | 验收项 | 结果 | 证据 |
|---|--------|:---:|------|
| 1 | 五档各至少一个集成测试 + 多角色最宽测试 + 超管回归 | ✅ | §4.4（sys_user 五档 H2 真过滤 8/8 为锚点；多角色最宽 12/12；超管短路多测试覆盖 + 既有 AuthFlowIntegrationTest 全绿回归） |
| 2 | 最小强制集全部接入并有测试；回执列明纳管清单及理由 | ✅ | 7 表接入（§7.3 清单+理由）；测试见 §4.4 |
| 3 | 前端五档可配、CUSTOM 部门树可选可回填、四连全绿 | ✅ | RoleList.vue；四连全绿（typecheck/build 一次性 1024M 例外已披露） |
| 4 | 后端全量 0 failures + Flyway 双份迁移验证 | ✅ | 521/0/0；V30 双份逐字一致 + 28 迁移冒烟全绿 |
| 5 | 知识库全量同步 | ✅ | §5/§6 |

## 5. 清单变更明细（`Smart-WorkFlow/功能清单.md` 状态列）

| ID | 功能 | 变更前 | 变更后 |
|----|------|:---:|:---:|
| M02-F04-01 | 数据权限（本人/本部门/本部门及下级/自定义部门/全部） | ⬜ | ✅ |

**全表计数**：✅11 / 🟦37 / ⬜42 / 总 **90 行**（现场实读。演进链：batch1 后 89 行 ✅10/🟦37/⬜42 → 2026-08-14 M04-F08-01 登记新增 ⬜ 行 90 行 → 本轮 M02-F04-01 回升 ✅11/🟦37/⬜42）

## 6. 知识库触碰文件清单

| 文件 | 变更摘要 |
|------|---------|
| `Smart-WorkFlow/功能清单.md` | L72 M02-F04-01 状态列 ⬜→✅（仅此一处） |
| `knowledge/known-issues.md` | I37 → ✅ 已修复（2026-08-15）+ 修复记录详情段；**新增 I46**「手写 SQL 通道无数据权限」；I10 补关联注 |
| `knowledge/current-status.md` | §1 计数演进链/测试基线（435→521）/前次验证行（逐模块+迁移口径 27→28 修正）；§5 功能表追加；§8 编号清单 12→13 项；§9 基线行 |
| `knowledge/features/data-scope-enforcement.md` | 新建功能追踪文件（按 _template，覆盖全部交付事实与遗留） |

未触碰：memory/（规划层验收后职责）、todo/、search_task/、search_fallback/、业务代码以外的其他 knowledge 文件。

## 7. 关键设计决策与偏差

1. **多角色取最宽排序**：ALL > DEPT_AND_CHILD > CUSTOM > DEPT > SELF（理由：任一角授予"本部门及以下"宽于单点自定义集合）；CUSTOM 并集取全部启用 CUSTOM 角色的关联部门；无角色/越界兜底 ALL 与历史硬编码行为一致
2. **DEPT_AND_CHILD 实现**：Java 递归 + 单表查询，**不加 ancestors 列**（避免存量回填迁移；部门规模小）；@Lazy 破拦截器依赖环（无 @Lazy 生产启动即 BeanCurrentlyInCreationException）
3. **纳管方式（重要偏差披露）**：DataScopeHandler 实测能力——SELF 档硬编码 `create_by` 列 + LongValue 字面量、部门三档硬编码 `dept_id` 列、**不支持** RuoYi-Vue-Plus 原版的 userAlias→sys_user 子查询。故最小强制集 7 表中**仅 sys_user 可用 @DataScope 直标**（唯一有 dept_id 的表）；其余 6 表走"自定义 Mapper 方法内等效条件"（SELF→归属列=当前用户；部门三档→归属列 IN (SELECT id FROM sys_user WHERE dept_id IN (...))；空集恒假 1=0），scope 由 sw-common 新增 `DataScopeFilter.resolve` 复用既有 SPI 解析后传参（Mapper 接口无法注入 Bean，传参是唯一不另造基建的路径）。agent 两表 create_by 为 VARCHAR(64)，一律 CAST 比较（PG 下 varchar=bigint 无 operator，H2 测不出，代码注释已说明）
4. **纳管清单（方向文档要求）**——**纳管 7**：sys_user（dept_id+create_by 双归属，五档 handler 直纳）/sw_bpm_instance（initiator_id）/sw_agent_graph_execution、sw_job_info、sw_job_log、sw_storage_file、sw_agent_model_config（create_by）。**不纳管 6**：Flowable 待办（assignee=当前用户已过滤）、sw_notify_message（recipient_id=当前用户）、sw_agent_session（已按 create_by 过滤）、动态表单物理表（手写 JDBC 绕过拦截器，方向文档排除）、sys_dept 部门树（无归属列且 CUSTOM 配置必须全员可见）、sw_bpm_process_def（租户内共享定义资源，启动权限另有管控）
5. **快照生效**：dataScope 登录时装配，改角色后下次登录/刷新生效（方向文档非目标已定，未做实时生效）
6. **前端值映射对账闭环**：后端枚举 ordinal 实测 ALL=0/DEPT=1/DEPT_AND_CHILD=2/SELF=3/CUSTOM=4，与前端 0-4 映射完全一致（F1 的"待联调确认"点由验证门消解）

## 8. 遗留问题与风险（提请规划层知悉）

1. **I46（新增登记）**：手写 SQL 通道无数据权限（动态宽表/外部数据源 SqlExecutor 绕过拦截器链）——方向文档非目标明确不纳管，作为已知限制登记，与 I10 同源关联；未来纳管需 SQL 构建层统一注入
2. **I47 悬空引用**：batch1 及 current-status 多处引用"known-issues I47（bpm V8 partial index）"但注册表无该实体条目（I46/I47 为审计临时编号已腾空）——建议正式注册消除悬空引用
3. **测试强度差异**：sw-basic-job/sw-basic-storage 为纯 Mockito 传参测试（模块无 H2 基建），等效条件 SQL 实体在 H2 真过滤测试的仅 sys_user/bpm_instance/agent 三组——SQL 正确性对 PG 生产库的最终验证依赖联调
4. **子查询无 deleted 过滤**：`SELECT id FROM sys_user WHERE dept_id IN (...)` 未加 deleted=0（与 RuoYi 系行为一致）——逻辑删除用户的数据在部门档下仍可见
5. **非分页入口未纳管**：sw_job_info/log 的 listEnabled/listByJobId/getLatestByJobId 等不在最小强制集，后续批次可评估
6. **前端 mock 未改**：dev 模式 PUT 不持久化 dataScope/deptIds、GET 详情不返回 deptIds，联调后端后自然消失
7. **迁移数口径**：27→28 已修正（form V12 漏计），knowledge 已同步；建议后续批次沿用 28
8. **sw-bootstrap 无测试基建**：V30 冒烟仍为临时测试先例，永久迁移测试基建待规划层决策

## 9. 结论

M02-F04-01 数据权限五档已端到端落地：装配去硬编码（多角色最宽+CUSTOM 并集）、DeptScopeProvider 递归实现（含生产级依赖环修复）、sys_role_dept 建表与角色 CRUD 打通、7 表查询纳管、前端角色页五档+部门树配置。验证门全绿：后端 521/0/0（+86）、前端四连 63f/552t、V30 迁移 28 链冒烟通过、前后端值映射对账一致。知识库全量同步完成（清单 ✅11/🟦37/⬜42 共 90 行、I37 修复记录、I46 新增登记、current-status/features 更新）。**执行层自验：符合方向文档全部验收标准，无 BLOCKED/FAILED 项，提请规划层最终验收。**
