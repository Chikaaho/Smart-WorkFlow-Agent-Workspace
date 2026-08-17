# 测试回执：P13 / I26 SysRole 与 V5 列契约对齐（sysrole-v5-column-alignment）

- **所属功能**：sysrole-v5-column-alignment（P13 / I26）
- **执行日期**：2026-08-17（Step 2，验证 subagent 执行）
- **测试范围**：代码修复后的 sw-biz-system-biz 模块 + 项目级全量回归
- **内存约束**：全部命令 `MAVEN_OPTS="-Xmx2g"`（2G 上限）；本机 1.6G 物理内存，所有 mvn 严格串行

---

## 1. 测试计划（对应验收方向 3/4）

| 层 | 目标 | 对应验收点 |
|----|------|-----------|
| 模块级 | sw-biz-system-biz 全部测试，重点 5 个触达 SysRole 的关键类 | 验收 3（列表/详情/按 code/登录装配/新增修改） |
| 项目级 | 全量 31 模块回归，对比 527 基线 | 验收 4（无回归） |
| 静态 | @TableField 确认、grep 残留复核、MP 生成 SQL 原文 | 验收 1/2 |

## 2. 模块级验证（sw-biz-system-biz）

**命令**：`MAVEN_OPTS="-Xmx2g" mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz -am`（项目根执行）

**结果**：退出码 **0**，BUILD SUCCESS（Reactor：Common/Security/Notify-API/System-API/System-Biz 全 SUCCESS）。

**汇总行原文**：`[INFO] Tests run: 111, Failures: 0, Errors: 0, Skipped: 0`

**surefire 口径**：运行起点 22:33:38（epoch 1786977218），窗口内 15 个 TEST-*.xml，聚合 `tests=111 failures=0 errors=0 skipped=0` 与汇总行一致；运行前模块 target 下 XML 计数为 0，无陈旧产物污染。

### 关键测试类（surefire XML：tests/failures/errors/skipped）

| 测试类 | 用例 | 失败 | 错误 | 覆盖路径 |
|--------|:---:|:---:|:---:|------|
| RoleDataScopeTest | 7 | 0 | 0 | 新增（create 3：withDeptIds/withoutDeptIds/withDuplicateDeptIds）+ 修改（update 3：overwriteDeptIds/NullDeptIds/overwriteDataScope）+ 数据权限；真实 H2 + MyBatis-Plus 集成 |
| RoleControllerTest | 6 | 0 | 0 | 列表/详情/新增/修改/删除（controller 层，纯 Mockito；SQL 层由 RoleDataScopeTest 兜底） |
| UserDetailsProviderDataScopeTest | 12 | 0 | 0 | 登录装配（多角色取最宽档 multipleRoles_shouldPickWidest_* 等），SysRole MP 查询路径 |
| AuthFlowIntegrationTest | 8 | 0 | 0 | 完整登录→/me→/menus 链（e2e_login_then_me_then_menus），superadmin 以 `built_in=true`（boolean 字面量）种子并断言 roles 含 superadmin；含 me 未授权/密码错误等 7 用例 |
| AuthMeControllerTest | 5 | 0 | 0 | /me 输出装配 |

模块内触达 SysRole 的全部测试（grep `SysRole\|sys_role` 定位）即以上 5 类 + AuthControllerTest（9/0/0/0），**全部通过，无遗漏**。

## 3. 项目级全量回归

**命令**：`MAVEN_OPTS="-Xmx2g" mvn test`（Smart-WorkFlow/ 根目录）

**结果**：退出码 **0**，BUILD SUCCESS（31/31 模块 SUCCESS），耗时 01:03 min。

**汇总行原文**：`[INFO] Tests run: 527, Failures: 0, Errors: 0, Skipped: 0`

**surefire 口径**：运行起点 22:34:11（epoch 1786977251），全仓窗口内 95 个 TEST-*.xml，聚合 `tests=527 failures=0 errors=0 skipped=0`；分模块：Common 16、Security 4、Storage-Biz 16、Notify-Biz 7、Job-Biz 48、Agent 178、System-Biz 111、Form-Biz 76、BPM-Engine 21、BPM-Process 50，全部 `Failures: 0, Errors: 0, Skipped: 0`，合计 527。

**与基线对比**：2026-08-16 CONFIRMED 基线 527/0/0 → 本次 **527/0/0 持平**（本轮零新增测试、零失败、无 flaky 重试）。

## 4. SQL 原文证据（验收 1 的运行时证据）

全量运行日志中 MP 实际生成的 sys_role SELECT（204 处 built_in 命中）：

```sql
SELECT id, name, code, sort, status, data_scope, built_in, remark AS description, tenant_id, create_time, ... FROM sys_role WHERE deleted = 0 AND (code = ?) AND tenant_id = 0
```

- `built_in`/`remark`：@TableField 变更已生效于 MP 生成 SQL（新列名）。
- `remark AS description`：MP 对字段名 `description`→列名 `remark` 的列别名映射，证明 JSON 对外键 `description` 不变。
- 与测试 DDL（schema-datascope-h2.sql：`remark varchar(255)`/`built_in boolean not null default false`/`uk_sys_role_tenant_code(tenant_id,code,deleted)`；AuthFlowIntegrationTest 内建表同）**双向闭合于 V5 链尾**。

## 5. 静态复核

- `SysRole.java:47` `@TableField("built_in")`、`:51` `@TableField("remark")`（git diff 确认由 is_builtin/description 改来）。
- 全后端 grep `is_builtin`：主代码/测试目录**零命中**；仅历史迁移脚本 V1__init_schema.sql、V2__init_data.sql、V5__m_seam_rbac.sql（改名迁移自身）允许存在。
- 无其他实体映射 `built_in`/`remark` 到 sys_role。

## 6. 失败/异常清单

- **环境性编译失败（非代码回归）**：在 `sw-biz-system-biz/` 目录直接跑 `mvn test` 时报编译错误——`AuthController.java` 6 处 `找不到符号: 方法 getRefreshExpireSeconds()/getAccessExpireSeconds()，位置: JwtProperties`。源码树中 `sw-framework/sw-security/.../JwtProperties.java` 的字段确实存在（Lombok @Data 生成 getter），根因是本地 `~/.m2` 中的 sw-security **旧产物**缺这两个 getter（环境依赖过期，与 P13/I26 改动无关）。已按任务允许改用根目录 `-pl -am`（从源码构建全部依赖模块）通过。**未做任何修改**。
- 除此外：零失败、零异常、零 flaky 重试。

## 7. 结论

- 模块级 111/0/0 + 项目级 527/0/0（与基线持平），验收方向 3/4 通过证据齐备；
- SQL 原文 + 测试 DDL 双向闭合，验收方向 1/2 通过；
- 未修改任何代码/测试/SQL 文件（本次为纯验证）。
