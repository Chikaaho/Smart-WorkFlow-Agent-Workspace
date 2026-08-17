# 功能级完成回执：P13 / I26 SysRole 与 V5 列契约对齐（sysrole-v5-column-alignment）

- **方向文档**：`product/sysrole-v5-column-alignment/ready/direction-sysrole-v5-column-alignment.md`
- **探索依据**：`search_task/p13-sysrole-v5-column-alignment.md`、`search_fallback/p13-sysrole-v5-column-alignment.md`
- **执行日期**：2026-08-17
- **执行方式**：执行层自主 3 Step 闭环——①代码修复（1 Sub Agent）→ ②测试验证（1 Sub Agent，MAVEN_OPTS="-Xmx2g"，独立测试回执见同目录 `sysrole-v5-column-alignment-test.md`）→ ③知识库全量同步 + 本回执
- **范围**：后端单功能（`Smart-WorkFlow` sw-biz-system-biz），前端零改动

---

## 1. 修改范围（实际修改文件）

| 文件 | 类型 | 改动摘要 |
|------|------|----------|
| `sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRole.java` | 修改 | L47 `@TableField("is_builtin")`→`"built_in"`；L51 `@TableField("description")`→`"remark"`。**字段名 `builtIn`/`description` 与 JSON 键不变**（方向：不改变对外接口字段语义） |
| `sw-biz-system-biz/src/test/resources/db/schema-datascope-h2.sql` | 修改 | sys_role：`description clob`→`remark varchar(255)`（L42）、`is_builtin smallint not null default 0`→`built_in boolean not null default false`（L43）；唯一索引对齐链尾：`uk_sys_role_tenant_code(tenant_id,code,deleted)`、`uk_sys_user_role_tenant`、`uk_sys_role_menu_tenant`（均含 V13 的 deleted 形态）；头注释失真口径（"与生产 V1/V30 一致"未计入 V5）改为指向 V1→V30 链尾 |
| `sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java` | 修改 | 内建表 L164-165 同 L2 列名/类型；L248-251 四个唯一索引对齐链尾（`uk_sys_role_dept_tenant`→生产实际名 `uk_sys_role_dept(role_id,dept_id)`；其余含 V13 deleted 形态）；L296 INSERT `is_builtin` 列与值 1→`built_in` true；L155 失真注释重写为按 V5 链尾建表 |
| 后端其他文件 | 零改动 | 无任何 Flyway 迁移脚本（db/migration、prod-update 一律未碰）、无 pom/配置/主业务逻辑改动 |

Git diff 摘要：3 文件修改，**+23 / −22 行**。

### 全局复核（grep 证据）

- `is_builtin` 全后端：主代码/测试 **零残留**；仅历史迁移脚本 V1（建表）/V2（种子）/V5（改名迁移自身）允许存在。
- `description`（sys_role 范围）：`SysRole.java:52` 为 Java 字段名（保留）；测试 DDL sys_role 块清零；SysDictData/SysDictType/SysPost/sys_dept/sys_menu 各自的 `description` 为**其他表合法列**，未动。
- 无其他实体把 `built_in`/`remark` 映射到 sys_role（无冲突）。

### 计划偏差

- 无方向级偏差。两点如实记录：
  1. **环境性**：在 sw-biz-system-biz 目录直跑 `mvn test` 编译失败（`~/.m2` 中 sw-security 旧产物缺 `JwtProperties.getRefreshExpireSeconds()` 等——Lombok getter 未进旧 jar），改用项目根 `mvn test -pl ... -am`（从源码构建依赖）通过；与 P13 改动无关，未做任何修改。
  2. **探索更正**：I26 原引"测试 DDL `schema-h2.sql` L43-44"位置有误（该文件仅 dict 两表），实际为 `schema-datascope-h2.sql` L42-43——已同步更正至 known-issues。

## 2. 验证命令与结果（均 `MAVEN_OPTS="-Xmx2g"`，满足 2G 上限）

| 命令 | 结果 |
|------|------|
| 模块级：`mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -am` | BUILD SUCCESS，退出码 0，**Tests run: 111, Failures: 0, Errors: 0, Skipped: 0**（surefire 时间窗过滤 15 个 XML，无陈旧产物） |
| 项目级：`mvn test`（Smart-WorkFlow/ 根） | BUILD SUCCESS 31/31 模块，退出码 0，**Tests run: 527, Failures: 0, Errors: 0, Skipped: 0**（时间窗 95 个 XML）——与 2026-08-16 基线 527/0/0 **持平**（本轮零新增测试、零失败） |

关键测试类全 PASSED（surefire XML：tests/failures/errors/skipped）：RoleDataScopeTest **7/0/0/0**（新增/修改路径：create 3 + update 3 + 数据权限）、RoleControllerTest **6/0/0/0**（列表/详情/按 code，controller 层）、UserDetailsProviderDataScopeTest **12/0/0/0**（登录装配多角色取最宽）、AuthFlowIntegrationTest **8/0/0/0**（含 `e2e_login_then_me_then_menus`，superadmin 以 `built_in=true` 种子并断言）、AuthMeControllerTest **5/0/0/0**。

**SQL 原文证据**（运行日志 204 处命中）：MP 实际生成 `SELECT id, name, code, sort, status, data_scope, built_in, remark AS description, ... FROM sys_role WHERE deleted = 0 AND ...` ——@TableField 变更已生效于 MP 生成 SQL，与测试 DDL 双向闭合于 V5 链尾（`remark AS description` 即 MP 对字段名 description→列名 remark 的别名映射，JSON 键不变）。

## 3. 验收方向逐项对照

| # | 验收条件 | 结论 | 证据 |
|---|----------|:---:|------|
| 1 | 持久化 SQL 不再引用 `is_builtin`/`description`，正确使用 `built_in`/`remark` | ✅ | SysRole.java:47,51；MP 生成 SQL 原文；grep 零残留 |
| 2 | 触达 sys_role 的测试库结构不再以旧列模拟生产契约，注释/夹具无失真口径 | ✅ | schema-datascope-h2.sql（列/类型/索引/头注释）、AuthFlowIntegrationTest（建表/索引/INSERT/注释）全部对齐链尾 |
| 3 | 列表/详情/按 code/登录装配/含相关字段的新增修改有可核验通过证据 | ✅ | RoleControllerTest（列表/详情/按 code 的 controller 层）+ RoleDataScopeTest（create/updateById 集成，H2 真实 SQL）+ UserDetailsProviderDataScopeTest/AuthFlowIntegrationTest（登录装配）全 PASSED |
| 4 | 受影响模块测试 + 项目级回归通过，2G 上限 | ✅ | 模块 111/0/0 + 项目级 527/0/0，BUILD SUCCESS，MAVEN_OPTS="-Xmx2g" |
| 5 | 不产生新 Flyway 迁移、不修改前端、不触碰 P10/P12 | ✅ | git status 佐证；BPM 模块零改动；db/migration 零改动 |
| 6 | 回执报告修改范围/验证命令与结果/计划偏差/遗留风险/§3.3 第10项清单 | ✅ | 见 §1/§2/§4/§5 本回执 |

## 4. 计划偏差与遗留风险

**偏差**：无方向级偏差（环境性编译问题见 §1，已绕行）。
**遗留风险**（如实分离，非本轮缺失）：
1. **H2 真全链验证仍受 P10/I47 阻断**（bpm/h2 V8 partial index，H2 不支持）——本轮证据为"测试 DDL 对齐链尾 + MP SQL 原文闭合"，未在真全链环境运行；PG local 全链运行期验证依赖启动应用（规划层授权后可补）。
2. **P12（sw-bootstrap 迁移测试基建）仍待决策**——I26 建议的"修复后补全链迁移测试"依赖该基建。
3. `.claude/settings.json`（后端工作区）有 3 行删除（enabledPlugins 配置），**非本轮产生**（subagent 声明未触碰，推测并行会话遗留）；本轮未动。

## 5. §3.3 第10项知识库全量同步（清单变更明细 + 触碰文件清单）

**清单变更明细**：`Smart-WorkFlow/功能清单.md` **状态列无变化**——M02-F01-01 角色管理仍 🟦（其缺口=角色-人员/用户组绑定写入等，P1 已登记，非本轮范围）；本轮修复为底层列契约缺陷（known-issues 编号 I26，非清单明细行），清单无需改行。

**触碰文件清单**：
- 代码/测试（后端工作区）：SysRole.java、schema-datascope-h2.sql、AuthFlowIntegrationTest.java（3 文件）
- knowledge：`known-issues.md`（I26 ✅ 已修复 + DDL 位置更正）、`current-status.md`（§1 前次验证/§4 进行中/§5 已完成 18 个·计数修正 16→18/§9 基线复验）、`features/sysrole-v5-column-alignment.md`（新建）、`session-handoff.md`（§1 新条目）
- todo：`requirement-pool.md`（P13 READY → ✅ 已修复，待规划层验收；I26 同步核销）
- memory（压缩索引）：`features.md`（该行 READY→COMPLETED 待验收）、`state.md`（进行中功能）、`handoff.md`（最新完成/进行中/基线/下一动作）

**结论**：P13/I26 修复闭环完成，验收方向 6 条全部满足。功能状态按方向文档要求**保持未 PASSED**，等待规划层最终验收；验收通过前不归档至 `passed/`。
