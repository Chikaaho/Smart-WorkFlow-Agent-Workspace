# 功能追踪：I52 PostgreSQL V13 迁移链修复（pg-v13-migration-chain-repair）

> 工作区统一知识库 — 修复轮追踪。
> 本文件记录 I52 修复轮的完整闭环：现场勘察 → 策略裁定 → 代码修复 → 真实 PG 验证 → 回归 → 知识库同步。
>
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | I52（known-issues 注册表，非 Mxx 功能明细；无需求池 P 编号） |
| 功能名称 | PostgreSQL V13 迁移链修复 |
| 功能目标 | 修复 PostgreSQL 全新数据库迁移链在 `V13__logical_delete_unique_constraints.sql` 的 `2BP01` 失败，使当前完整迁移链能从 V1 连续执行至最新版本并通过校验，同时保持已有数据库升级路径和逻辑删除唯一性语义安全 |
| 创建日期 | 2026-08-19 |
| 当前状态 | **COMPLETED（D110 规划层最终验收 PASSED + 阶段三终态同步完成，2026-08-19）**；项目级 600/0/0/0、PG 全链 33 条 migrate+validate、H2 33 条回归零退化；方向归档 `product/pg-v13-migration-chain-repair/passed/` |
| 涉及模块 | 后端 `Smart-WorkFlow`：sw-bootstrap（迁移 root/V13 + 永久 PG 全链测试基建） |

---

## 2. 需求分析

### 2.1 问题根源（现场勘察 CONFIRMED）

- form 模块迁移 `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/resources/db/migration/form/postgresql/V7__init_form_metadata.sql` 第 11 行 `form_key VARCHAR(100) NOT NULL UNIQUE`（inline UNIQUE）在 PostgreSQL 创建**约束背书的隐式索引** `sw_form_def_form_key_key`。
- root 目录 `sw-bootstrap/src/main/resources/db/migration/postgresql/V13__logical_delete_unique_constraints.sql` 第 58 行 `DROP INDEX IF EXISTS sw_form_def_form_key_key;` 在 PG 触发 **2BP01**：`cannot drop index sw_form_def_form_key_key because constraint sw_form_def_form_key_key on table sw_form_def requires it`——约束创建的索引必须 `ALTER TABLE ... DROP CONSTRAINT`，不能直接 `DROP INDEX`。
- **H2 允许直接 DROP INDEX**（行为不同），故 H2 侧全链 33 条一直通过（`FlywayFullChainH2Test`），缺陷仅 PG 暴露。
- V13 其余 8 项均安全：第 1-6、9 项 DROP 的是 V1/V3/V5 创建的**独立索引**（非约束背书）；第 8 项 `sw_form_config` 已是 `ALTER TABLE ... DROP CONSTRAINT`（V12 创建的是约束，写法正确）。
- V13 之后（V14–V33）**零引用** `sw_form_def_form_key_key` 或 `uk_sw_form_def_form_key`——修改 V13 无下游断裂。

### 2.2 策略裁定（执行层，方向 D108 授权「不预设手段，依据现场选择」）

**修改 PG 侧历史 V13（第 7 项），不新增 V34。** 理由：

1. **新库可达性是硬前提**：V13 执行时即失败，新增 V34 在新库场景**永远无法到达**——「新增链尾迁移」策略天然不可行。
2. **修改 V13 无既有校验和风险**：PG 侧不存在任何已成功应用 V13 的既有库（V13 必失败），不存在「修改已发布迁移导致 validate-on-migrate 校验和失败」的升级路径；H2 侧 V13 从未失败但**保持原样不动**（H2 语义本就正确）。
3. **对象安全**：V13 之后零下游引用；`DROP CONSTRAINT` 释放隐式索引后再 `CREATE UNIQUE INDEX uk_sw_form_def_form_key (form_key, deleted)` 与原设计产物完全一致。
4. **业务语义不弱化**：唯一约束形态从「约束背书隐式索引」变为「独立唯一索引」，唯一性语义完全一致（逻辑删除软删重建由复合列 `(form_key, deleted)` 承载）。

### 2.3 非目标

- 不新增业务表、接口、页面或用户可见功能；不修改前端。
- 不顺带处理 I36 用户组绑定、M02 权限配置入口、M07 Prompt/日志/调试/RAG、I50 登录校验时序等。
- 不重构整个 Flyway 目录或统一所有历史迁移写法。
- 不以关闭/跳过 PG 迁移验证、删除唯一性约束、手工标记迁移成功等方式绕过问题。
- **不新增 V34**（新库场景不可达，且会产生新的既有库校验和锚点）。

---

## 3. 执行记录

### 3.1 现场勘察（主会话直读，未派探索 subagent——目标单一明确）

- 迁移目录全貌：root/bpm/notify/form/storage/job/agent 7 目录、双方言（postgresql/h2），全链 V1-V33 共 33 条；V12 在 form 目录（`V12__upgrade_form_config_to_per_table.sql` 建 `uk_sw_form_cfg_tname` 约束），V7 在 form 目录。
- `application.yml`：7 个 locations（`{vendor}` 占位）、`validate-on-migrate: true`、`out-of-order: false`、`baseline-on-migrate: true`、表 `flyway_schema_history`。
- 环境勘查：本机 arm64 macOS、无 Docker daemon（CLI 存在但 Desktop 未安装）、无 psql/本地 PG 服务、Maven Central 可达 → 采用 **zonky embedded-postgres**（JUnit 内嵌真实 PG 二进制，Maven Central 有 darwin-arm64v8 17.5.0 产物）作为可重复自动化夹具。

### 3.2 代码修复（1 Sub Agent 实施，主会话复核）

| 文件 | 类型 | 改动 |
|------|------|------|
| `sw-bootstrap/src/main/resources/db/migration/postgresql/V13__logical_delete_unique_constraints.sql` | 修改 | 仅第 7 项：`DROP INDEX IF EXISTS sw_form_def_form_key_key;` → `ALTER TABLE sw_form_def DROP CONSTRAINT IF EXISTS sw_form_def_form_key_key;`；文件头新增「PG 侧说明」注释块 + 第 7 项注释同步更新；**其余 SQL 一字未动** |
| `sw-bootstrap/pom.xml` | 修改 | +2 个 test 依赖：`io.zonky.test:embedded-postgres:2.1.0`（含 exclusions，排除 core 默认携带的 4 个平台 binaries 避免解析歧义）+ `io.zonky.test.postgres:embedded-postgres-binaries-darwin-arm64v8:17.5.0` |
| `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java` | 新建 | 永久 PG 全链测试（8 用例，~290 行），与 `FlywayFullChainH2Test` 对称 |

**边界**：H2 侧 V13 零改动（git diff 验证）；无业务 Java 代码改动；无其他迁移 SQL 改动；前端零触碰；无新 V 编号。

### 3.3 测试验证（Sub Agent 模块级 + 主会话项目级）

- **修复前复现（先红）**：真实 PG 17.5 全链在 V13:58 失败，错误原文 `ERROR: cannot drop index sw_form_def_form_key_key because constraint sw_form_def_form_key_key on table sw_form_def requires it`（SQL State **2BP01**）；失败前 V1-V12 共 12 条正常应用。
- **修复后全链（后绿）**：`Successfully applied 33 migrations to schema "public", now at version v33`；`migrationsExecuted = 33`；`validate()` 通过（共 4 处 validate 全过）。
- **`FlywayFullChainPostgresTest` 8 用例全绿**（2.242s，BUILD SUCCESS）：
  1. `appliedMigrationCount_shouldBe33`（含 BPM V8/V14、V31、V33）
  2. `validate_shouldPass`
  3. V13 修复回归守卫：`pg_constraint` 中 `sw_form_def_form_key_key` 计数=0；`pg_indexes` 中 `uk_sw_form_def_form_key` 存在且为 `(form_key, deleted)` 复合索引
  4. 正例1：sys_user 插入 → 软删 → 同 username 重建 deleted=0 成功（两条共存）
  5. 正例2：sys_tenant 软删重建成功（两条共存）
  6. 反例：已存在 deleted=0 再插 deleted=0 → **23505**（uk_sys_user_username）
  7. 边界：已存在 deleted=1 再插第二条 deleted=1 → **23505**
  8. **既有库升级夹具**：独立库 `target("32")` migrate 32 条 → 全量 migrate 只执行 V33（共 33）→ `validate()` 通过
- **H2 回归**：`FlywayFullChainH2Test` 11 用例全绿（H2 全链 33 条 + V32→V33 升级链）。
- **项目级全量**（主会话，`MAVEN_OPTS="-Xmx2g"`，互斥检测通过）：**599 tests / 0 failures / 0 errors / 0 skipped**（105 surefire XML 聚合；591 基线 +8 = 新增 PG 测试 8 用例；sw-bootstrap 12→20），退出码 0。
- **D109 补证后（2026-08-19）**：pom 改 `embedded-postgres-binaries-bom:17.5.0` 统一全平台二进制版本（dependency:tree 证明 5 平台产物均 17.5.0，移除平台 exclusions）→ 跨平台可移植性闭合；新增永久守卫用例 `legacyOriginalV13Checksum_shouldFailValidateNotSilentlyPass`（模拟登记原 V13 checksum 的库 → validate-on-migrate 显式失败，不静默破坏）→ 既有库校验和安全兜底闭合。PG 全链测试 8→**9** 用例、项目级 **600/0/0/0**（599+1）。

**重要发现（真实 PG 引擎证伪，语义事实修正）**：原方案「正例2：两条 deleted=1 同 username 历史共存」与 V13 复合唯一 `(key, deleted)` 设计**矛盾**——修复后首轮运行被 PG 驳回 `duplicate key value violates unique constraint "uk_sys_user_username" Key (username, deleted)=(pg_sem_h1, 1)`。系统固定 `logic-delete-value: 1`，V13 复合唯一语义下**每个业务键最多一条 deleted=1 历史**；两条 deleted=1 共存是 partial 索引（如 bpm binding `WHERE active=true`）才有的语义。正例2 调整为 sys_tenant 软删重建正例 + 新增「重复软删被拒」边界用例固化该语义为回归守卫。

---

## 4. 关键设计决策

1. **修改 PG 历史 V13 而非新增 V34**：新库场景 V34 不可达；PG 无已应用 V13 的既有库故无校验和风险；V14-V33 零下游引用。（详见 §2.2）
2. **PG/H2 双方言各按自身能力实现同一语义**：PG `DROP CONSTRAINT`（约束背书索引不可直接 DROP）、H2 保持 `DROP INDEX`（H2 允许）。两文件均为 V13 同一版本号、同一复合唯一 `(key, deleted)` 语义，不引入版本号分叉。
3. **zonky embedded-postgres 作为永久 PG 验证夹具**：本机无 Docker/psql 环境限制下，以 Maven test 依赖内嵌真实 PG 17.5 二进制实现**可重复的自动化升级夹具**（方向文档验收方向第 2 条明确要求）；测试入 sw-bootstrap 与 `FlywayFullChainH2Test` 对称，成为永久回归防线。
4. **语义正反例以真实引擎为准**：「两条 deleted=1 共存」不可满足即如实修正测试（先被 PG 证伪），不降低验证标准、不弱化约束。

---

## 5. 验收方向对照（D108 六项 + D109 补证 + D110 复验）

| # | 验收条件 | 执行层证据 |
|---|----------|-----------|
| 1 | 真实 PG 环境新库 V1→链尾连续迁移 + validate，不再报 2BP01；报告迁移数/版本/验证入口 | ✅ PG 17.5（zonky embedded-postgres）全链 **33 条** migrate+validate 通过；入口 `FlywayFullChainPostgresTest`（sw-bootstrap） |
| 2 | 至少覆盖一个与现场修复策略匹配的既有库升级场景，证明无校验和/对象冲突；无旧库则用可重复自动化夹具 | ✅ 既有库升级夹具：target(32) → 全量只执行 V33，validate 通过；PG 侧无已应用 V13 的既有库，夹具证明 V32→V33 段不触碰 V13 |
| 3 | 逻辑删除唯一性语义正反例：有效记录冲突被拒绝、符合契约的已删除历史可共存 | ✅ sys_user/sys_tenant 软删重建共存正例（deleted=0 与 deleted=1 共存）+ 23505 反例 + 重复软删 23505 边界 |
| 4 | H2 全链新库可执行至链尾并通过校验，双方言迁移基线不退化 | ✅ `FlywayFullChainH2Test` 11 用例全绿，H2 全链 33 条 + V32→V33 升级链 migrate+validate；H2 侧 V13 零改动 |
| 5 | 后端受影响模块测试与项目级回归通过，总数不低于 591；mvn 命令 `MAVEN_OPTS="-Xmx2g"`，不与前端并行 | ✅ 项目级 **599/0/0/0**（591+8）；sw-bootstrap 8 用例（12→20）；所有 mvn 命令带 2G 上限、互斥检测通过、串行执行 |
| 6 | 前端零改动、无无关业务改动；回执列明修改范围/策略/命令/偏差/风险/清单变化与知识库触碰文件 | ✅ 前端零改动；修改范围见 §3.2；偏差见 §3.3 语义事实修正；详见完成回执 |

---

## 5.1 最终验收（D110，2026-08-19）

| # | 验收条件 | 结论 |
|---|----------|:---:|
| 1 | 真实 PG 新库 V1→链尾迁移 + validate | ✅ PASSED（PG 17.5 33 条 migrate+validate，先红 2BP01 后绿） |
| 2 | 既有库升级/校验和安全 | ✅ PASSED（git 审计链 + 原 V13 checksum 显式失败守卫 + 修改后升级夹具） |
| 3 | 逻辑删除唯一性语义正反例 | ✅ PASSED（23505 冲突/软删重建共存/重复 deleted=1 边界） |
| 4 | H2 全链零回归 | ✅ PASSED（11 用例、33 条、V32→V33、H2 V13 零改动） |
| 5 | 项目级回归 ≥591 + 跨平台可移植性 | ✅ PASSED（600/0/0/0；BOM 统一 17.5.0 全平台解析） |
| 6 | 前端零改动/范围/命令/偏差/风险/知识同步 | ✅ PASSED（前端零改动、清单零变化 ✅21/🟦28/⬜41） |

**D109 FAILED → D110 PASSED 历史**：D109（2026-08-19）判定验收项 2/5 证据不足 FAILED；执行层补证（`receipts/post-d109-supplement.md`）闭合两项后 D110 复验 PASSED。D109 为合法历史保留，不再作为当前状态出现。

## 6. 遗留与风险

- **复合唯一语义边界（已固化为回归守卫）**：V13 设计下每业务键最多一条 deleted=1 历史。若产品语义要求多条软删历史共存（ruo yi 系常见诉求），需 partial 索引设计（如 bpm binding 先例），属 V13 设计方案层面事项，超出本轮授权——如需调整应另行立项评估。
- PG 侧验证依赖 zonky 内嵌二进制（darwin-arm64v8 17.5.0）；其他平台（linux-amd64 等）由 zonky 对应 binaries 产物支持，exclusions 排除默认 4 平台后按目标平台解析。
- initdb 出现 `could not find suitable text search configuration for locale "zh_CN.UTF-8"` 告警，非阻断（本机 locale 所致）。
- 共享库（127.0.0.1）`flyway_schema_history` 仍不存在：正式启用 Flyway 前可直接对 PG 新库直跑全链（本轮已证明可达），无需目标验证法绕行。

## 7. 知识库同步（§3.3 第10项）

- `known-issues.md`：I52 表条目 ✅ 已关闭（D110）+ 详细条目修复/关闭记录（含语义事实修正）。
- `current-status.md`：§1 概览/测试基线/最近完成、§4 进行中（无）、§5 已完成表 COMPLETED 行、§8 候选池（23→24）、§9 测试基线（600 演进 + 双方言全链口径）。
- `session-handoff.md`：§1 新条目（COMPLETED 终态）+ I52 相关当前入口引用清理。
- `features/pg-v13-migration-chain-repair.md`：本文件（新建，COMPLETED 终态）。
- `todo/requirement-pool.md`：零变化（I52 未入池，复检无引用）。
- `功能清单.md`：状态列零变化（✅21/🟦28/⬜41 共 90 行复算自洽，I52 非清单明细行）。
- memory 压缩索引：`state.md`/`handoff.md`/`features.md`/`issues.md` 终态同步完成（D110 阶段三）。
- 回执：`product/pg-v13-migration-chain-repair/receipts/`（completion + planning-review-d109 + post-d109-supplement + planning-final-review-d110 + post-d110-terminal-sync）。
