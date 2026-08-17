# 探索任务回执：P13 SysRole / V5 列名一致性探索

- **任务来源**：`search_task/p13-sysrole-v5-column-alignment.md`（规划层下发，6 问）
- **执行方式**：3 个并行 Explore subagent（迁移链 / Java 映射 / 测试 DDL），只读取证，未运行任何编译/测试/迁移
- **总体结论**：I26 成立且被 D83 影响面上调后仍然成立。失配恰为 `SysRole.java` 两处 `@TableField`（`is_builtin`/`description`）vs V5 两方言逐字一致的列改名（→`built_in`/`remark`）。**任何跑完 V1→V30 链的库（PG local 或修复后的 H2）上，SysRole 全列 SELECT 必崩**；测试全绿因 5 个触达 sys_role 的测试 100% 绕过 Flyway。
- 路径前缀默认 `/usr/local/projects/Smart-WorkFlow/`；后端为 `Smart-WorkFlow/` 子目录。

## Q1 V5 改名明细（两方言逐字一致）✅

`sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V5__m_seam_rbac.sql`（diff 仅尾行差，h2/pg 行号相同）：

| 变更 | 行号 | SQL 摘要 |
|---|---|---|
| `is_builtin smallint` → `built_in boolean NOT NULL DEFAULT false` | 38-40 | ADD built_in → `UPDATE SET built_in = (is_builtin = 1)` → DROP is_builtin |
| `description clob/text` → `remark varchar(255)`（可空） | 43-45 | ADD remark → `UPDATE SET remark = description` → DROP description |
| 另：`name`/`code` 扩宽 varchar(64) | 48-49 | 仅类型，不改名 |
| `data_scope` 去 NOT NULL/DEFAULT | 52-53 | 保留列 |
| 唯一索引 `uk_sys_role_code` → `uk_sys_role_tenant_code(tenant_id,code)` | 56-57 | sys_user_role/sys_role_menu 索引同名改（61-67），无列改名 |

**链尾（V30 后）sys_role 实际列（两方言一致）**：`id, create_time, create_by, update_time, update_by, deleted, version, tenant_id, name, code, sort, status, data_scope, built_in, remark`；`is_builtin`/`description` 已不存在。V5 后 V6/V10/V13/V15/V18/V26/V29/V30 无任何脚本引用旧列名；改名列仅存在于 sys_role 自身，无跨表不一致。V30 新建 sys_role_dept（role_id/dept_id，与 V5 无关）。

## Q2 列名对照表：数据库实际列名 ↔ Java/MyBatis 映射 ↔ 测试 DDL ✅

| 列 | 迁移链尾（V30 后） | SysRole 实体映射 | 测试 DDL |
|---|---|---|---|
| `is_builtin`（实体）vs `built_in`（库） | **built_in** | `SysRole.java:47` `@TableField("is_builtin")` | `schema-datascope-h2.sql:43` `is_builtin smallint not null default 0`（旧名） |
| `description`（实体）vs `remark`（库） | **remark** | `SysRole.java:51` `@TableField("description")` | `schema-datascope-h2.sql:42` `description clob`（旧名） |
| 其余 13 列（含 data_scope、tenant_id、deleted、version） | 同名 | BaseEntity/BaseEntityNoTenant 隐式映射，无冲突 | 无冲突 |

**关键事实**：全仓无任何 `*Mapper.xml`、无角色注解 SQL——4 个角色 Mapper（SysRoleMapper.java:10-12 等）均为空接口，SQL 全由 MyBatis-Plus 按实体注解自动生成；**无任何 Role DTO/Converter**（RoleController.java:27-59 直接以 SysRole 实体做入参/出参）。实体注解是唯一列名来源，期望列全集 15 列 vs 库实际 15 列，差异恰为上述 2 对。

## Q3 失败路径（直接 vs 受影响 vs 不失败）✅

**直接故障点（全列 SELECT，必然失败）**[事实：实体映射 + 链尾 DDL 直接推出]：
- 角色列表：`SysRoleServiceImpl.java:75-88` `page()`（LambdaQueryWrapper → selectPage，SELECT 全映射列）
- 角色详情/按 code 查：`getById()`（95-101）、`getByCode()`（105）
- **登录装配**：`UserDetailsProviderImpl.java:117-120` `toLoginUser` 中 `sysRoleMapper.selectList(...)`（登录即查 sys_role 全列）

**条件性失败**[推测：MP 默认 NOT_NULL 字段策略]：`save()`（L46）/`updateById()`（L60）仅在 `builtIn`/`description` 字段非 null 时生成含这两列的 INSERT/UPDATE 列——UI 新增/修改若该两字段为 null 可不触发。

**不受影响**：`removeById()`（L70，逻辑删除仅写 `deleted`/`id`）；授权路径（角色-菜单/角色-部门绑定，L62-63/L123/L141-162 只触达 `sys_role_menu`/`sys_role_dept`，两表无改名列）；`dataScope` 解析（`data_scope` 列 V5 保留，无失配——**D83"读写 dataScope 同样命中失配列"的实质是 CRUD 全列读取路径命中前两列，非 data_scope 自身失配**）。

## Q4 测试为何未暴露 ✅（含 I26 引用位置更正）

全仓触达 sys_role 的测试仅 5 个，**全部绕过 Flyway**：

| 测试 | 建表方式 | 列名 | 掩盖 |
|---|---|---|---|
| RoleControllerTest / AuthMeControllerTest | 纯 Mockito，无 DB | — | 不执行 SQL |
| RoleDataScopeTest（:38-46） | `schema-datascope-h2.sql` + test profile（application-test.yml:31 排除 FlywayAutoConfiguration） | 旧名 | 是 |
| UserDetailsProviderDataScopeTest（:50-55） | 同上（种子 L108-115 不含冲突列，但 MP 回读全列） | 旧名 | 是 |
| AuthFlowIntegrationTest（:155-174, :296） | 类内 JdbcTemplate 建表，注释明写"列名匹配实体 @TableField，非 V5 后的新列名"；TestConfig 无 @EnableAutoConfiguration，classpath 无 flyway-core | 旧名（索引却用 V5 新名，混搭） | 是 |

**更正**：I26 所述"测试 DDL `schema-h2.sql` L43-44"位置有误——`schema-h2.sql` 仅 dict 两表（43 行），sys_role 旧列名 DDL 实际在 **`schema-datascope-h2.sql` L42-43**（文件头 L3-4 自述"与生产 V1/V30 一致"但未计入 V5）。**无任何测试跑完整迁移链**：sw-bootstrap 无 `src/test` 目录、全仓 0 个 Flyway 测试、0 处 Testcontainers、flyway-core 仅在 sw-bootstrap pom。

## Q5 最小修复边界（事实性判断，不替规划层定方向）

- 失配面极小：**恰 2 处 `@TableField`**（SysRole.java:47,51）。修正后需同步修测试 DDL：`schema-datascope-h2.sql:42-43`、`AuthFlowIntegrationTest.java:164-165,296`（及 :155 注释），否则实体修复后这三处旧名 DDL 会让现有测试反绿（SysUserDataScopeTest/DeptScopeProviderTest 也引用该 schema 但不触达 sys_role，同步修改无害）。
- 数据库历史：V5 在**两方言**均已完成"加新列→回填数据（built_in=is_builtin、remark=description）→删旧列"，且**仓库无任何"兼容回补旧列"的迁移先例**（prod-update 补丁链为空，仅有 .gitkeep/README；FlywayConfiguration.java:34-57 的补丁链从没跑过脚本）。追加兼容迁移（重建 is_builtin/description 并回填）方向无历史依据，且与 V5 设计意图（smallint→boolean、clob→varchar 收敛）相反。事实指向"修正 Java/MyBatis 映射（+测试 DDL）"为最小边界；是否追加兼容迁移供规划层裁定。
- I26 建议"修复后补全链迁移测试（可与 I47 修复轮合并排期）"与知识库状态一致，可作为验收方向参考。

## Q6 与 P10/P12 依赖裁定 ✅

- **同一 Flyway 实例**：`application.yml:51-64` 的 locations 含 `db/migration/{vendor}` + bpm/notify/form/storage/job/agent 七条链，同一 `flyway_schema_history`、同一 master 数据源（dynamic-datasource 自带 Flyway 集成被关闭，:20-22）；BPM V8 物理位于 `sw-biz/sw-bpm/sw-bpm-process/src/main/resources/db/migration/bpm/{h2,postgresql}/V8__init_bpm_metadata.sql`（h2:34 含 partial index `where active = true`，pg:39）。
- **H2 链死在 V8**（P10 事实基础）：partial index 语法为 PG 专有，H2 不支持（知识库 I47"bpm/h2 迁移链 V8 partial index——H2 全链 Flyway 从未可跑"佐证）。**推论：dev H2 全链在 V5 之后先死 V8**——I26/D83"任何全链 Flyway 环境（含开发 H2）SysRole 查询必崩"中"开发 H2"一档实际**当前不可达**（应用起不来即崩于 V8，SysRole 查询根本轮不到执行）；PG local 档才真实可达。
- **裁定证据**：P13 的最小修复（实体注解 + 测试 DDL）不依赖 P10/P12，可保持单功能边界；但 P13 的**真全链验收**（I26 建议的全链迁移测试）依赖：① P12 基建（不存在，需新建：sw-bootstrap 无 test 目录、无任何迁移测试先例）；② P10 修复（否则 H2 全链测试必然先死 V8）。dev H2 端到端可用需 P13+P10 **同轮或顺序同过**。若验收改为"修正后单模块测试 DDL 对齐链尾 + PG 链人工核验"，P13 可独立成轮。

## 未确认 / 冲突点（失败处理声明）

1. I26 引用测试 DDL 行号（schema-h2.sql L43-44）与事实不符——实际 schema-datascope-h2.sql L42-43，本回执已更正。
2. "开发 H2 SysRole 查询必崩"（I26/D83）与"H2 全链从未可跑"（I47/P10）表述存在重叠冲突：H2 上实际先死 V8；已按证据给出次序推断（H2 不支持 partial index 属平台常识推断，未运行验证——禁止范围不允许）。
3. MP 的 NOT_NULL 字段策略导致 save/update 条件性失败为默认行为推断（代码库无自定义 GlobalConfig 覆盖项，未见反证）。
4. 全部结论为静态取证，无运行期实测（禁止范围）；如需运行期证据，需在规划层授权后于 PG local profile 启动应用验证。

## 关键证据清单

- 迁移：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V1__init_schema.sql:106-107`、`V5__m_seam_rbac.sql:38-45,52-57`、`V30__sys_role_dept.sql:4-16`；`application.yml:51-64`；`FlywayConfiguration.java:34-57`
- BPM V8：`Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/resources/db/migration/bpm/h2/V8__init_bpm_metadata.sql:34`（pg:39）
- 实体：`Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRole.java:47,51`
- 服务/装配：`.../service/impl/SysRoleServiceImpl.java:46,60,70,75-88,95-101,105`；`.../security/UserDetailsProviderImpl.java:117-120`
- 测试：`.../src/test/resources/db/schema-datascope-h2.sql:26-45`；`.../controller/AuthFlowIntegrationTest.java:155-174,296`；`.../role/RoleDataScopeTest.java:38-46`；`.../security/UserDetailsProviderDataScopeTest.java:50-55`；`.../src/test/resources/application-test.yml:12-17,31`
