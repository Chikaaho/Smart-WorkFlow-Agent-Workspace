# 执行回执 — pg-v13-migration-chain-repair（I52）

> 功能级完成回执（执行层自验）。方向：`product/pg-v13-migration-chain-repair/ready/direction-pg-v13-migration-chain-repair.md`（D108）。
> 提交日期：2026-08-19。等待规划层对照六项验收方向最终验收。

---

## 1. 功能概述

**I52：PostgreSQL V13 迁移链修复** — 修复 PG 全新数据库迁移链在 `V13__logical_delete_unique_constraints.sql` 的 `2BP01` 失败，使 V1→V33 全链连续迁移 + `validate` 通过；同时证明既有库升级路径、逻辑删除唯一性语义、H2 全链零回归。

**执行层自拆 Step**：
1. 现场勘察：迁移目录全貌、V13 目标索引来源、Flyway 配置、环境能力（主会话直读，未派探索 subagent——目标单一明确，§7.1 结构下归并）→ PASSED
2. 修复实施：PG 侧 V13 第 7 项改写 + pom 测试依赖 + 永久 PG 全链测试（1 Sub Agent）→ PASSED
3. 真实 PG 验证：先红复现 → 后绿全链 + 升级夹具 + 语义正反例（Sub Agent 内完成）→ PASSED
4. 项目级回归：H2 全链 + 后端全量 599/0/0（主会话）→ PASSED
5. 知识同步 + 回执（§3.3 第10项）→ 本次提交

## 2. 现场勘察结论（Step 1）

- 迁移目录：root/bpm/notify/form/storage/job/agent 7 目录、双方言（postgresql/h2），全链 V1–V33 共 **33 条**；form 目录含 V7（建 sw_form_def）、V12（sw_form_config 约束）。
- **根因（CONFIRMED）**：`form/postgresql/V7__init_form_metadata.sql` L11 `form_key VARCHAR(100) NOT NULL UNIQUE`（inline UNIQUE）在 PG 创建**约束背书的隐式索引** `sw_form_def_form_key_key`；`root/postgresql/V13__logical_delete_unique_constraints.sql` L58 `DROP INDEX IF EXISTS sw_form_def_form_key_key;` 触发 **2BP01**（`cannot drop index ... because constraint ... requires it`）。H2 允许直接 DROP INDEX → H2 全链 33 条一直通过，缺陷仅 PG 暴露。
- V13 其余 8 项安全：第 1–6、9 项 DROP 的是 V1/V3/V5 创建的**独立索引**；第 8 项已是 `ALTER TABLE ... DROP CONSTRAINT`（正确）。
- V13 之后（V14–V33）**零引用** `sw_form_def_form_key_key` / `uk_sw_form_def_form_key` → 修改 V13 无下游断裂。
- 环境：本机 arm64 macOS、无 Docker daemon/psql/本地 PG 服务、Maven Central 可达 → 采用 **zonky embedded-postgres**（JUnit 内嵌真实 PG 17.5 二进制）作为可重复自动化夹具。

## 3. 迁移策略裁定（Step 2，方向 D108 授权「不预设手段，依据现场选择」）

**修改 PG 侧历史 V13 第 7 项，不新增 V34。** 理由（回执要求说明为何另一类路径不可行）：

| 路径 | 为何不可行/为何选用 |
|------|---------------------|
| 新增 V34 链尾迁移 | **新库场景永远无法到达**——V13 执行时即失败，V34 无机会运行；且会在 V13 之后制造新的既有库校验和锚点，留下「V13 仍失败」的不可达残留。**排除** |
| 修改 PG 侧 V13（选用） | ①PG 侧**不存在已成功应用 V13 的既有库**（V13 必失败）→ 修改无既有环境校验和风险、无升级路径断裂；②V14–V33 零下游引用 → 无依赖对象断裂；③`DROP CONSTRAINT` 释放隐式索引后 `CREATE UNIQUE INDEX uk_sw_form_def_form_key (form_key, deleted)` 与原设计产物一致，唯一性语义不弱化；④H2 侧 V13 语义本就正确（H2 允许 DROP INDEX）→ **零改动**，双方言各按自身能力实现同一复合唯一语义，无版本号分叉。**选用** |

## 4. 实际修改的文件（Step 2）

| 文件 | 类型 | 改动摘要 |
|------|------|----------|
| `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V13__logical_delete_unique_constraints.sql` | 修改 | 仅第 7 项：`DROP INDEX IF EXISTS sw_form_def_form_key_key;` → `ALTER TABLE sw_form_def DROP CONSTRAINT IF EXISTS sw_form_def_form_key_key;`；文件头新增「PG 侧说明」注释块 + 第 7 项注释同步更新。**其余 SQL 一字未动**（git diff 验证） |
| `Smart-WorkFlow/sw-bootstrap/pom.xml` | 修改 | +2 test 依赖：`io.zonky.test:embedded-postgres:2.1.0`（含 exclusions 排除 core 默认 4 平台 binaries）+ `io.zonky.test.postgres:embedded-postgres-binaries-darwin-arm64v8:17.5.0` |
| `Smart-WorkFlow/sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java` | 新建 | 永久 PG 全链测试（8 用例，~290 行），与 `FlywayFullChainH2Test` 对称 |

**明确零改动**：H2 侧 V13（git diff 为空）、任何业务 Java 代码、任何其他迁移 SQL、前端、knowledge/、memory/、product/（回执文件除外）。

## 5. 实际执行的命令

| # | 命令（均在 Smart-WorkFlow/ 内，均带 MAVEN_OPTS="-Xmx2g"） | 退出码 | 结果 |
|---|------|:---:|------|
| 1 | `cd sw-bootstrap && mvn test -Dtest=FlywayFullChainPostgresTest`（修复前） | 1 | **预期失败**：2BP01 复现（见 §6） |
| 2 | `cd sw-bootstrap && mvn test -Dtest=FlywayFullChainPostgresTest`（修复后） | 1 | 8 用例中 7 过 1 错——正例2 语义矛盾被真实 PG 引擎证伪（见 §7 偏差 1），非迁移问题 |
| 3 | `cd sw-bootstrap && mvn test -Dtest=FlywayFullChainPostgresTest`（调整语义用例后） | 0 | **Tests run: 8, Failures: 0, Errors: 0** → BUILD SUCCESS |
| 4 | `cd sw-bootstrap && mvn test -Dtest=FlywayFullChainH2Test` | 0 | **Tests run: 11, Failures: 0, Errors: 0** → BUILD SUCCESS（H2 回归零退化） |
| 5 | `MAVEN_OPTS="-Xmx2g" mvn test`（项目级全量，主会话，互斥检测通过） | 0 | **599/0/0/0**（105 surefire XML 聚合），BUILD SUCCESS |

互斥约束：命令 5 前 `ps` 检测无前端编译进程（无 vite/pnpm/node dev/build/test），放行；全程无前后端并行编译。前端未执行任何命令。

## 6. 修复前复现证据（先红，真实 PG 17.5 实测原文）

```
ERROR:  cannot drop index sw_form_def_form_key_key because constraint sw_form_def_form_key_key on table sw_form_def requires it
  建议：You can drop constraint sw_form_def_form_key_key on table sw_form_def instead.
```
- 失败迁移：`V13__logical_delete_unique_constraints.sql`（Location: `db/migration/postgresql/V13__logical_delete_unique_constraints.sql`，Line 58）
- SQL State：**2BP01**（Error Code 0）；底层异常链 `FlywayMigrateException → FlywaySqlScriptException → PSQLException`
- 失败前 V1–V12 共 12 条正常应用（与勘察结论一致）

## 7. 与原方案的偏差

1. **正例2 语义修正（重要发现，真实 PG 引擎证伪）**：原方案「正例2：两条 deleted=1 同 username 历史共存」与 V13 复合唯一 `(key, deleted)` 设计**矛盾**——修复后首轮运行被 PG 驳回：`duplicate key value violates unique constraint "uk_sys_user_username" Key (username, deleted)=(pg_sem_h1, 1) already exists`。系统固定 `logic-delete-value: 1`，V13 复合唯一语义下**每个业务键最多一条 deleted=1 历史**；「两条 deleted=1 共存」是 partial 索引（如 bpm binding `WHERE active=true`）才有的语义。已调整为：正例2 = sys_tenant 软删重建正例（真实可满足，覆盖第二张表）+ 新增「重复软删被拒 23505」边界用例，把引擎证伪的结论固化为回归守卫。**提示**：若产品语义要求多条软删历史共存（ruo yi 系常见诉求），需 partial 索引设计，属 V13 设计方案层面事项，超出本轮授权——如需调整应另行立项评估。
2. **zonky binaries exclusions**：首次跑通后发现 zonky core 默认携带 4 个平台 binaries 依赖（v14.15.0），已用 exclusions 清除，实测仅解析出 darwin-arm64 一份，无歧义。

## 8. 遇到的问题

- 修复后首轮语义用例失败：系第 7 节偏差 1（测试预期与真实引擎语义不符），修正测试预期而非迁移，未降低验证标准。
- `initdb: could not find suitable text search configuration for locale "zh_CN.UTF-8"` 非阻断告警（本机 locale 所致）。
- 无其他问题；V13 之外全链（V1–V12、V14–V33 共 32 条）在真实 PG 17.5 上全部一次通过。

## 9. 未完成内容

无。方向六项验收方向全部有证据（见 §10）。

## 10. 验收方向逐项对照（执行层自验）

| # | 验收方向 | 证据 | 结论 |
|---|----------|------|:---:|
| 1 | 真实 PG 新库 V1→链尾连续迁移 + validate，不再报 2BP01；报告迁移数/数据库版本/验证入口 | PG 17.5（zonky embedded-postgres 真实二进制）：`Successfully applied 33 migrations to schema "public", now at version v33`；`migrationsExecuted = 33`；`validate()` 通过（4 处 validate 全过）。入口：永久测试 `sw-bootstrap/.../FlywayFullChainPostgresTest` | ✅ |
| 2 | 至少覆盖一个与现场修复策略匹配的既有库升级场景，证明无校验和/对象冲突/缺失；无旧库则用可重复自动化夹具 | 既有库升级夹具：独立库 `target("32")` migrate 32 条 → 全量 migrate 只执行 V33（共 33）→ `validate()` 通过。PG 侧无已应用 V13 的既有库（V13 必失败），夹具证明 V32→V33 段不触碰 V13、修改 V13 不产生校验和/对象冲突 | ✅ |
| 3 | 逻辑删除唯一性语义正反例：有效记录冲突被拒绝、符合契约的已删除历史可共存 | sys_user 正例（插 deleted=0 → 软删 → 同 username 重建成功，两条共存）+ sys_tenant 正例（软删重建两条共存）+ 反例（已有 deleted=0 再插 deleted=0 → **23505** uk_sys_user_username）+ 边界（重复软删 deleted=1 → **23505**） | ✅ |
| 4 | H2 全链新库可执行至链尾并通过校验，双方言迁移基线不退化 | `FlywayFullChainH2Test` 11 用例全绿（H2 新库全链 33 条 + V32→V33 升级链 migrate+validate）；H2 侧 V13 零改动 | ✅ |
| 5 | 后端受影响模块测试与项目级回归通过，总数不低于 591；mvn 命令 `MAVEN_OPTS="-Xmx2g"`，不与前端并行 | 项目级全量 **599/0/0/0**（105 surefire XML；591 基线 +8 = `FlywayFullChainPostgresTest` 8 用例，sw-bootstrap 12→20）；全部 mvn 命令带 2G 上限；互斥检测通过、严格串行；前端未并行编译 | ✅ |
| 6 | 前端零改动、无无关业务改动；回执列明修改范围、迁移策略、命令与结果、偏差、遗留风险、清单变化明细与知识库触碰文件 | 前端零改动；修改范围 §4、策略 §3、命令 §5、偏差 §7、风险 §11、清单变化 §12、触碰文件 §13 | ✅ |

## 11. 遗留风险

- **复合唯一语义边界**（已固化守卫）：V13 设计下每业务键最多一条 deleted=1 历史；多条软删历史共存需 partial 索引设计（属设计方案层面，见 §7 偏差 1）。
- PG 验证依赖 zonky 内嵌二进制（darwin-arm64v8 17.5.0）；其他平台由 zonky 对应 binaries 产物支持。
- 共享库（127.0.0.1）`flyway_schema_history` 不存在：正式启用 Flyway 前可直接对 PG 新库直跑全链（本轮已证明可达），无需目标验证法绕行。

## 12. 功能清单变化明细

**零变化**。I52 为迁移链缺陷（known-issues 编号，非 `功能清单.md` 明细行），无 Mxx-Fyy-zz 行状态变动；全表维持 **✅21/🟦28/⬜41 共 90 行**（M07-F01-01～05 五行 ✅ 为 D107 已确认终态，本轮零触碰）。需求池无 P 编号条目（I52 未入池），无核销项。

## 13. 知识库触碰文件清单（§3.3 第10项，全量同步）

| 文件 | 变更 |
|------|------|
| `knowledge/known-issues.md` | I52 表条目 ✅ 已修复 + 详细条目追加修复记录（含语义事实修正） |
| `knowledge/features/pg-v13-migration-chain-repair.md` | 新建追踪文件（功能信息/根因/策略裁定/执行记录/决策/验收对照/遗留/同步清单） |
| `knowledge/current-status.md` | §1 概览（数据库双方言直跑口径、测试基线 599）、最近完成（pg-v13 新条目 + agent-model 降为此前）、§4 进行中（pg-v13 待验收）、§5 已完成表（pg-v13 新增行）、§8 候选池（I52 移除）、§9 测试基线（599 演进 + 双方言全链口径） |
| `knowledge/session-handoff.md` | §1 新条目（pg-v13 完整闭环）、§4 表格 I52 ✅、§6 小项池 I52 移除、§9 迁移基线双方言口径、候选池与下一动作引用清理 |
| `memory/`（state/handoff/features/decisions） | 本次未触碰（规划层最终验收时按 §7.2 记忆更新草稿核对后落盘，见 §14） |
| `todo/requirement-pool.md` | 无变更（I52 未入池） |
| `Smart-WorkFlow/功能清单.md` | 无变更（零变化明细见 §12） |

## 14. 记忆更新草稿（仅供规划角色核对后落盘，不构成最终判定）

### state.md 追加行
pg-v13-migration-chain-repair（I52）执行层闭环：PG 侧 V13 第 7 项 DROP INDEX→DROP CONSTRAINT（H2 侧零改动），不新增 V34；`FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5）先红 2BP01 复现→后绿 33 条 migrate+validate+既有库升级夹具+语义正反例 23505；H2 11 用例零退化；项目级 **599/0/0/0**（591+8，sw-bootstrap 12→20）。语义事实修正：复合唯一下每业务键最多一条 deleted=1 历史（真实 PG 证伪并固化守卫）。前端零改动、清单零变化。方向留 ready/，I52 待规划层最终验收。测试基线：591→599。

### decisions.md 新增条目
无新增（本轮为执行层实施轮，无新架构决策；若规划层最终验收通过，按既有惯例登记 D109 验收结论，正文由规划层起草）。

### issues.md 新增条目
无新增（I52 修复为关闭项；复合唯一语义边界已在 I52 修复记录中说明，不单列新 I 编号）。

### features.md 状态变更
pg-v13-migration-chain-repair：READY → 执行层闭环（完成回执已提交，待规划层最终验收）。状态标注「执行层闭环」，最终 PASSED/COMPLETED 由规划层验收后确认。

## 15. Git 变更摘要（工作区）

```
 M Smart-WorkFlow/sw-bootstrap/pom.xml
 M Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V13__logical_delete_unique_constraints.sql
?? Smart-WorkFlow/sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java
（knowledge/product 变更属规划层目录，未提交 git——按工作区惯例由规划层统一管理）
```

## 16. 最终结论

**执行层自验 PASSED**（六项验收方向全部有证据）。方向文档保留在 `ready/`，I52 保持开放——最终判定由规划层对照 D108 验收。
