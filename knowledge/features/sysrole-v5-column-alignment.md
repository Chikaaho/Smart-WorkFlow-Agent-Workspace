# 功能追踪：P13 / I26 SysRole 与 V5 列契约对齐（sysrole-v5-column-alignment）

> 工作区统一知识库 — 修复轮追踪。
> 本文件记录 P13/I26 修复轮的完整闭环：探索取证 → 规划裁定 → 代码修复 → 测试验证 → 知识库同步。
>
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P13（需求池）/ I26（known-issues 注册表，非 Mxx 功能明细） |
| 功能名称 | SysRole 列名与 V5 Flyway 列重命名对齐 |
| 功能目标 | 以 V5 迁移完成后的 `sys_role` 表结构（`built_in`/`remark`）为唯一数据库契约，消除 SysRole 持久化映射与测试数据库口径的旧列残留，使完整迁移环境中的角色读取及登录角色装配不再因列不存在而失败 |
| 创建日期 | 2026-08-17 |
| 当前状态 | 执行层自验收完成（527/0/0 全绿），**待规划层最终验收**（验收前不得标 PASSED/归档） |
| 涉及模块 | 后端 `Smart-WorkFlow`：sw-biz-system-biz（实体/测试 DDL/集成测试） |

---

## 2. 需求分析

### 2.1 问题根源

- V5 迁移（`db/migration/{h2,postgresql}/V5__m_seam_rbac.sql:38-45`，两方言逐字一致）：`is_builtin smallint` → `built_in boolean NOT NULL DEFAULT false`（回填后删旧列）；`description clob/text` → `remark varchar(255)`（回填后删旧列）。
- 链尾（V30 后）sys_role 无 `is_builtin`/`description` 列；而 `SysRole.java:47,51` 的 `@TableField` 仍指向旧列 → 任何 MyBatis-Plus 全列 SELECT（角色列表/详情/按 code 查询、登录装配 `UserDetailsProviderImpl`）在真实迁移库上必报列不存在。
- 测试全绿原因：全仓触达 sys_role 的 5 个测试 100% 绕过 Flyway，用自建旧列名 DDL（`schema-datascope-h2.sql:42-43`、`AuthFlowIntegrationTest.java` 类内建表）匹配实体。
- 影响面上调（D83）：V5 改名 H2/PG 两方言相同，原「开发 H2 不受影响」描述错误。

### 2.2 规划裁定（方向文档）

1. 以 V5 链尾契约为权威，执行结果遵循该契约。
2. **不新增兼容迁移恢复旧列**，不反转 V5 的类型/命名收敛。
3. P13 独立完成，不与 P10（BPM/H2 V8 partial index）、P12（sw-bootstrap 迁移测试基建）合并；P10/P12 仅限制 H2 真全链验证，不构成本轮实现前置。

### 2.3 非目标

- 不修复 P10、不建 P12 基建、不恢复旧列、不追加兼容迁移。
- 不改变角色业务语义/权限模型/数据权限五档/角色关联/对外接口字段语义（`builtIn`/`description` 字段名与 JSON 键保留）。
- 不修改前端；不顺带处理 P24/P25 等其他缺口。

---

## 3. 执行记录

### 3.1 探索（2 个阶段并行 3 subagent，只读）

- 迁移链 agent：V5 两方言逐字一致改名明细、链尾列名全集、BPM V8 partial index 同 Flyway 实例证据、全仓零迁移测试证据。
- Java 映射 agent：SysRole 实体全字段、全仓无 Mapper XML/无角色 DTO（SQL 全由 MP 按实体注解生成）、登录装配消费链、期望列全集 vs 链尾差异集=恰 2 列。
- 测试 DDL agent：5 个触达 sys_role 测试的建表方式/列名/绕过矩阵、I26 引用的 `schema-h2.sql L43-44` 位置更正为 `schema-datascope-h2.sql L42-43`、sw-bootstrap 无 src/test。
- 回执：`search_fallback/p13-sysrole-v5-column-alignment.md`。

### 3.2 代码修复（1 subagent）

| 文件 | 改动 |
|------|------|
| `sw-biz-system-biz/.../entity/SysRole.java` | L47 `@TableField("is_builtin")`→`"built_in"`；L51 `@TableField("description")`→`"remark"`。字段名与 JSON 键不变 |
| `.../test/resources/db/schema-datascope-h2.sql` | sys_role `description clob`→`remark varchar(255)`、`is_builtin smallint not null default 0`→`built_in boolean not null default false`；唯一索引对齐链尾（`uk_sys_role_tenant_code(tenant_id,code,deleted)`、`uk_sys_user_role_tenant`、`uk_sys_role_menu_tenant` 含 V13 deleted 形态）；头注释失真口径（"与生产 V1/V30 一致"未计入 V5）改为指向 V1→V30 链尾 |
| `.../controller/AuthFlowIntegrationTest.java` | 内建表/INSERT 列名与值（`is_builtin` 1→`built_in` true）、索引名对齐链尾（`uk_sys_role_dept_tenant`→生产实际 `uk_sys_role_dept`）、L155 失真注释重写 |
| 全局 grep 复核 | `is_builtin` 主代码/测试零残留（仅历史迁移脚本 V1/V2/V5）；无其他实体映射 `built_in`/`remark` 到 sys_role |

### 3.3 测试验证（1 subagent，`MAVEN_OPTS="-Xmx2g"`）

- 模块级：`mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -am` BUILD SUCCESS，**111 tests / 0 failures / 0 errors**（surefire 时间窗过滤 15 个 XML）；关键类：RoleDataScopeTest 7/0/0、RoleControllerTest 6/0/0、UserDetailsProviderDataScopeTest 12/0/0（登录装配）、AuthFlowIntegrationTest 8/0/0（含 e2e_login_then_me_then_menus）、AuthMeControllerTest 5/0/0。
- 项目级：`MAVEN_OPTS="-Xmx2g" mvn test` BUILD SUCCESS 31/31 模块，**527 tests / 0 failures / 0 errors**（时间窗 95 个 XML），与基线持平。
- SQL 原文证据（运行日志 204 处）：`SELECT id, name, code, sort, status, data_scope, built_in, remark AS description, ... FROM sys_role ...` → @TableField 变更已生效于 MP 生成 SQL，与测试 DDL 双向闭合于 V5 链尾。
- 环境说明：模块目录直跑 `mvn test` 编译失败（`~/.m2` 中 sw-security 旧产物缺 `getRefreshExpireSeconds()`——Lombok 生成的 getter 在旧 jar 中不存在），改用 `-pl -am` 从源码构建依赖后通过；与 P13 改动无关，未做任何修改。

---

## 4. 验证结果

| 门 | 结果 |
|----|------|
| 验收方向 1（持久化 SQL 不再引用旧列） | ✅ CONFIRMED：@TableField 已改；MP 生成 SQL 原文含 `built_in`/`remark` |
| 验收方向 2（测试 DDL 不再以旧列模拟生产） | ✅ CONFIRMED：两处测试 DDL + 注释全部对齐链尾；grep 零残留 |
| 验收方向 3（列表/详情/按 code/登录装配/新增修改有通过证据） | ✅ CONFIRMED：RoleControllerTest（列表/详情，controller 层）+ RoleDataScopeTest（create/update 集成）+ UserDetailsProviderDataScopeTest/AuthFlowIntegrationTest（登录装配）全 PASSED |
| 验收方向 4（模块测试 + 项目级回归，2G 上限） | ✅ CONFIRMED：111/0/0 + 527/0/0，BUILD SUCCESS |
| 验收方向 5（零新迁移/零前端/零 P10/P12 触碰） | ✅ CONFIRMED：Flyway 零迁移；前端零改动；BPM 零改动 |
| 遗留风险 | H2 真全链验证仍受 P10/I47 阻断（与本轮无涉）；P12 迁移测试基建仍待决策；运行期 PG 全链验证依赖联调/启动验证 |

---

## 5. 知识库同步（§3.3 第10项）

- `knowledge/known-issues.md`：I26 ✅ 已修复（表格行 + 详情块状态更新 + DDL 位置更正）。
- `knowledge/current-status.md`：§1 前次验证、§4 进行中、§5 已完成清单（计数修正 16→18，含 status-semantics 漏改项）、§9 后端基线复验。
- `knowledge/session-handoff.md`：§1 最新完成功能新增条目。
- `todo/requirement-pool.md`：P13 状态 READY → 已修复（待规划层验收）；I26 同步已修复。
- `Smart-WorkFlow/功能清单.md`：状态列无变化（M02-F01-01 仍 🟦，其缺口为角色-人员绑定写入等，非本轮范围）。
- `memory/`：features.md / state.md / handoff.md 同步（压缩索引）。
