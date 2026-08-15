# data-scope-enforcement — M02-F04-01 数据权限完整落地（D77）

> 单功能追踪文件。方向文档见 `product/data-scope-enforcement/ready/direction-datascope-full-implementation.md`（目标 5 为本知识库全量同步，system.md §3.3 第10项）。
> 前置探索：`search_fallback/datascope-implementation-survey.md`（2026-08-13，11 问回执）。

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | M02-F04-01 |
| 功能名称 | 数据权限（数据范围控制：本人/本部门/本部门及下级/自定义部门/全部） |
| 功能目标 | 五档数据范围端到端生效：登录装配去硬编码（多角色取最宽）+ 7 表查询纳管 + 前端角色页五档配置 |
| 创建日期 | 2026-08-13（探索）/ 2026-08-14（方向下发 D77） |
| 当前状态 | COMPLETED ✅（执行层自验，提请规划层最终验收） |
| 涉及模块 | 后端 `sw-security`（登录装配）、`sw-common` datascope 包（DeptScopeProviderImpl）、`sw-biz-system`（Role CRUD + sys_role_dept）、`sw-bootstrap`（Flyway V30）、各纳管模块 Mapper（sw-bpm / sw-basic-agent / sw-basic-job / sw-basic-storage）；前端 `modules/system`（RoleList） |

---

## 2. 功能目标

1. **装配去硬编码**：登录装配读取用户全部角色的 `SysRole.dataScope`，多角色取最宽档（并集语义，档序 ALL > DEPT_AND_CHILD > CUSTOM > DEPT > SELF）；CUSTOM 档装配 customDeptIds（该用户 CUSTOM 角色关联部门的并集）。
2. **五档全部生效**：ALL / DEPT / DEPT_AND_CHILD / SELF / CUSTOM 端到端可用（`DeptScopeProviderImpl` 递归 + `@Lazy` 破环；`sys_role_dept` 表 + 角色 CRUD 读写关联）。
3. **查询纳管（最小强制集 7 表）**：sys_user 分页五档 `@DataScope` 直标（验收锚点）；6 表等效条件纳管（bpm_instance / agent_graph_execution / agent_model_config / job_info / job_log / storage_file 列表查询）。
4. **前端角色管理页**：dataScope 五档下拉；选 CUSTOM 时部门树多选（listTree）；编辑回填。
5. **知识库全量同步**（§3.3 第10项）：清单 M02-F04-01 ⬜→✅；known-issues I37 修复记录 + 新登记手写 SQL 通道限制（I46）；回执含清单变更明细 + 触碰文件清单。

## 3. 非目标

- **不纳管**手写 SQL 通道：动态宽表（FormDataQueryService 等 `JdbcTemplate` 裸 SQL）与 bpm 外部数据源 `SqlExecutor` 完全绕过拦截器链（与 I10 同源，已记 known-issues **I46**）
- **不做**数据权限实时生效：dataScope 登录时快照，改角色后下次登录/刷新生效（与停用 access token 900s 窗口同性质）
- **不做**行级自定义规则引擎/字段级权限——仅清单定义的五档部门维度
- **不改**租户隔离机制与超管旁路（Handler 既有超管短路保留）

---

## 4. 实施记录（执行层自主闭环）

### 4.1 装配与五档引擎

- **装配去硬编码**：登录装配读取用户全部角色 dataScope，多角色取最宽档（并集语义：任一角色 ALL 即 ALL，以此类推）；CUSTOM 档取该用户 CUSTOM 角色关联部门的并集 → `customDeptIds`，不再硬编码 `DataScope.ALL`（原 `UserDetailsProviderImpl` L111）
- **`DeptScopeProviderImpl`**：DEPT_AND_CHILD 档"本部门及以下"——sys_dept 无 ancestors 列，采用**递归查询**子部门（未加列，无需迁移回填）；`@Lazy` 注入破循环依赖
- **`sys_role_dept` 表**：Flyway **V30**（root 路径 V29 已占用，V30 为空闲号），h2/postgresql 双份**逐字一致**；Role CRUD 读写 dataScope / deptIds

### 4.2 查询纳管（7 表，最小强制集）

| 表 | 纳管方式 | 理由 |
|----|---------|------|
| sys_user | 五档 `@DataScope` 直标 | 验收锚点（方向文档指定） |
| sw_bpm_instance | 等效条件 | 最小强制集（方向文档指定） |
| sw_agent_graph_execution | 等效条件 | 最小强制集（方向文档指定） |
| sw_agent_model_config | 等效条件 | 最小强制集（方向文档指定） |
| sw_job_info | 等效条件 | 最小强制集（方向文档指定） |
| sw_job_log | 等效条件 | 最小强制集（方向文档指定） |
| sw_storage_file | 等效条件 | 最小强制集（方向文档指定） |

- 本就按当前用户过滤的查询（notify recipient、agent session）**不重复纳管**
- 手写 SQL 通道（动态宽表 / bpm 外部数据源 SqlExecutor）**不纳管**——拦截器仅对 MyBatis-Plus 通道生效（见 I46）

### 4.3 前端

- `RoleList.vue`：dataScope 五档下拉 + CUSTOM 时部门树多选（listTree）+ 编辑回填；`api/role.ts` 契约同步

### 4.4 测试与验证

- 后端全量 **521 tests / 0 failures / 0 errors**（基线 435 → +86）；逐模块：sw-common 16、sw-security 4、sw-basic-agent 178、sw-basic-job-biz 48、sw-basic-notify-biz 7、sw-basic-storage-biz 16、sw-biz-form-biz 76、sw-biz-system-biz 111、sw-bpm-engine 18、sw-bpm-process 47
- 前端四连 typecheck / lint / test / build 全绿：**63 files / 552 tests**（typecheck/build 本次为**一次性 1024M 内存例外**，详见回执披露）
- Flyway V30：h2/pg 双份逐字一致；冒烟 6 目录链（I47 排除 bpm）**28 迁移按序应用 + validate 通过**
- **迁移数口径修正 27→28**：验证门发现 form/h2 `V12__upgrade_form_config_to_per_table.sql` 此前被漏计（batch1 V29 冒烟口径），实际 28 个迁移，全链绿

---

## 5. 测试和验收汇总

| 项目 | 结果 |
|------|------|
| 后端 | **521 tests / 0 failures / 0 errors**（435 基线 + 86 新增；mvn test BUILD SUCCESS） |
| 前端 | **63 files / 552 tests** 四连全绿（typecheck/lint/test/build；typecheck/build 一次性 1024M 内存例外） |
| V30 冒烟 | h2/pg 双份逐字一致；6 目录链（I47 排除 bpm）28 迁移按序应用 + validate 通过 |
| 功能清单 | M02-F04-01 ⬜→✅；全表 ✅10/🟦37/⬜43（90 行）→ **✅11/🟦37/⬜42**（90 行） |
| 基线演进 | 后端 435 → **521**（2026-08-15，+86）；前端 63f/552t 不变（2026-08-15 持平） |

---

## 6. 功能完成检查清单

- [x] 交付并测试通过（后端 521/0、前端 63f/552t、V30 冒烟 28 迁移）
- [x] 已更新 `knowledge/current-status.md`（计数演进链/测试基线/前次验证/§5 功能表/§8 编号清单/§9 基线行 + 迁移数口径 27→28 修正）
- [x] 已更新 `knowledge/known-issues.md`（I37 索引状态列 + 修复记录段；新登记 I46；I10 关联标注）
- [x] 已标注功能清单中对应项状态（M02-F04-01 → ✅）

---

## 7. 实际修改范围

| 文件路径 | 修改类型 | 摘要 |
|----------|:---:|------|
| 后端 `sw-security`（登录装配） | 修改 | 装配读取全部角色 dataScope，多角色取最宽，CUSTOM 装配部门并集（去硬编码 ALL） |
| 后端 `sw-common` datascope 包（DeptScopeProviderImpl） | 新增 | DEPT_AND_CHILD 递归实现 + `@Lazy` 破循环依赖 |
| 后端 `sw-biz-system`（Role CRUD + sys_role_dept 读写） | 修改 | 角色 dataScope/deptIds 读写 |
| `sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V30__sys_role_dept.sql` | 新增 | sys_role_dept 建表（双份逐字一致） |
| 后端 7 个纳管模块 Mapper | 修改 | sys_user `@DataScope` 直标 + 6 表等效条件纳管 |
| 前端 `RoleList.vue` / `api/role.ts` | 修改 | 五档下拉 + 部门树多选 + 回填 |
| `Smart-WorkFlow/功能清单.md` | 修改 | M02-F04-01 状态列 ⬜→✅ |
| `knowledge/known-issues.md` | 修改 | I37 修复记录 + I46 登记 + I10 关联标注 |
| `knowledge/current-status.md` | 修改 | 计数/基线/前次验证/已完成列表/迁移口径同步 |

> 注：具体业务代码文件清单以功能级完成回执为准（本文件为知识库追踪文件，仅记录事实层面）。

---

## 8. 遗留问题

| 问题 | 严重程度 | 计划处理 |
|------|:---:|------|
| 手写 SQL 通道无数据权限（动态宽表 JdbcTemplate + bpm 外部数据源 SqlExecutor 绕拦截器链） | 高 | 明确不纳管，已登记 known-issues I46（与 I10 同源），沿用代码审查 + 测试兜底红线 |
| dataScope 登录时快照、非实时生效（改角色后下次登录/刷新生效） | 低 | 已记录，与停用 token 900s 窗口同性质 |
| 子查询无 deleted 过滤（遗留质量项） | 低 | 待后续批次评估 |
| job/storage 纯 Mockito 测试强度（无集成断言） | 低 | 待后续批次评估 |
| 非分页入口未纳管（仅分页列表查询纳管） | 低 | 待规划层评估 |
| I47（既有）：bpm 目录全链 H2 阻断（V30 冒烟排除 bpm 目录） | — | 待规划层决策 |

---

> 证据来源：`product/data-scope-enforcement/ready/direction-datascope-full-implementation.md`（D77）；`search_fallback/datascope-implementation-survey.md`（探索 11 问）；本批执行/验证 agent 回执（后端 521/0、前端 63f/552t、V30 冒烟 28 迁移）。
