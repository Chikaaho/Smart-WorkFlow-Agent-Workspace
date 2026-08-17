# 功能级完成回执：P10 / I47 BPM H2 V8 迁移链兼容性修复（bpm-h2-v8-compat）

- **方向文档**：`product/bpm-h2-v8-compat/passed/direction-bpm-h2-v8-compat.md`（2026-08-17 规划层最终验收 PASSED 后由 `ready/` 归档，D87/D88）
- **探索依据**：`search_fallback/known-issues-verification.md`、`search_fallback/baseline-static-recount.md`、`memory/issues.md`、`memory/state.md`（方向文档 §探索依据）；执行层自主探索（1 Explore subagent，8 问全答）
- **执行日期**：2026-08-17
- **执行方式**：执行层自主闭环——①探索（1 Sub Agent，I47 全事实确认）→ ②代码修复 + 测试基建 + 模块级自测（1 Sub Agent，`MAVEN_OPTS="-Xmx2g"`）→ ③项目级全量回归（主会话，测试回执见同目录 `bpm-h2-v8-compat-test.md`）→ ④知识库全量同步 + 本回执
- **范围**：后端单功能（`Smart-WorkFlow` sw-bpm-process + sw-bootstrap），前端零改动

---

## 1. 规划裁定落地（方向 §规划裁定 逐条）

| 裁定 | 落地 |
|------|------|
| 1. 唯一主问题 I47：H2 V8 partial unique index 语法不兼容 | h2/V8 L34 `create unique index ... where active = true` 为全链唯一阻塞点（探索确认双方言仅此一处语法差异） |
| 2. PG 侧语义必须保留；H2 侧等价约束由执行角色裁定 | PG V8 一字未改（git diff 零差异）；H2 侧裁定：**生成列 + 唯一索引**等价实现（H2 官方不支持 partial index 任何模式，社区 workaround=computed column；仓库已有"双方言不同写法、语义一致"先例 form V7 JSON/JSONB、bpm V14 clob/text） |
| 3. 验证目标是 BPM 纳入真实 H2 全链验证 | 永久全链测试 `FlywayFullChainH2Test`（sw-bootstrap）7 目录 30 条迁移 migrate + validate + 表/索引/语义断言全部通过 |
| 4. 最小测试基建可纳入 | 仅 sw-bootstrap pom 增 `junit-jupiter`（test）+ 1 个测试类；未重构测试框架、未扩为跨模块测试平台 |

## 2. 修改范围（实际修改文件）

| 文件 | 类型 | 改动摘要 |
|------|------|----------|
| `sw-biz/sw-bpm/sw-bpm-process/src/main/resources/db/migration/bpm/h2/V8__init_bpm_metadata.sql` | 修改 | ①文件头 L14-16 错误断言「条件唯一索引用 WHERE 子句（H2 支持）」改为准确描述；②建表 `active` 列后新增生成列 `active_key varchar(265) generated always as (case when active then (cast(tenant_id as varchar(64)) || ':' || form_key) end)`；③L34 partial index 替换为 `create unique index uk_sw_bpm_binding_active on sw_bpm_form_binding (active_key);`（**索引名不变**）。其余列/sw_bpm_instance/3 个普通索引/注释不动 |
| `sw-biz/sw-bpm/sw-bpm-process/src/test/resources/db/schema-h2.sql` | 修改 | 追加与修复后 h2/V8 **逐字一致**的 `sw_bpm_form_binding`（8 基列 + form_key/process_def_key/active + active_key 生成列）+ `uk_sw_bpm_binding_active` 唯一索引；头注释同步；纯增量（BpmInstanceDataScopeTest 同时挂 addon 文件无冲突） |
| `sw-bootstrap/pom.xml` | 修改 | 新增 `org.junit.jupiter:junit-jupiter`（scope=test，版本由 BOM 管理）——永久迁移测试基建最小补充 |
| `sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/impl/BpmFormBindingServiceImplTest.java` | 新建 | 绑定语义正反例 8 用例（见测试回执 §2） |
| `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainH2Test.java` | 新建 | 永久真全链 H2 验证 8 用例（见测试回执 §3） |

**生产迁移边界**：仅 h2/V8 一个生产文件被修改；pg/V8（git diff 零差异）、V13、V14 及全部 root/notify/form/storage/job/agent 迁移均未触碰；无新 V 编号迁移、无重编号。

Git diff 摘要：3 文件修改 **+39/−5** + 2 新文件（214 行 + 227 行）。

### 兼容策略与历史迁移风险裁定（方向 §风险方向 逐条）

1. **语义弱化风险**：未弱化——`active=true` 时 `active_key` 非空（`tenant_id:form_key` 单射，首个 `:` 前为纯数字租户无歧义）唯一约束生效；`active=false` 时 `active_key=NULL`，H2 唯一索引允许多个 NULL 共存=非 active 历史记录可共存。正反例均有测试证据（测试回执 §2/§3）。
2. **双方言漂移风险**：H2 与 PG 实现不同（生成列 vs partial index）但业务语义一致（仅 active=true 在 (tenant_id, form_key) 上唯一）；索引名 `uk_sw_bpm_binding_active` 双方言保持一致。
3. **历史迁移风险**：h2/V8 **从未在任何 H2 数据库执行成功过**（全链在 V8 处失败，V8 之后迁移从未被应用），故修改 h2/V8 无校验和/升级路径影响——任何真实 H2 库（含 dev H2 内存库）都不存在"已应用旧 V8"的可能；PG 侧已发布迁移零改动。h2/V13 文件内提及 `uk_sw_bpm_binding_active` 的注释（"已有 WHERE active=true，不冲突"）属文档性描述且 h2/V13 同样从未被应用，**保持原样未改**（避免无必要迁移文件触碰；该注释对 PG 侧描述仍准确）。
4. **验证假阳性风险**：未采用手写 DDL 代替——`FlywayFullChainH2Test` 跑真实 Flyway API 7 目录全链 migrate + validate，日志原文「Successfully applied 30 migrations ... now at version v30」；BPM 两条（version 8/14）在链内连续执行。
5. **范围蔓延风险**：测试基建最小化（1 依赖 + 2 测试类），未重构测试框架。

## 3. 验证命令与结果（均 `MAVEN_OPTS="-Xmx2g"`，串行，编译互斥检测先行）

| 命令 | 结果 |
|------|------|
| 模块级：sw-bpm-process `mvn test` | BUILD SUCCESS，**Tests run: 58, Failures: 0, Errors: 0**（50→58，+8 绑定语义用例） |
| 模块级：sw-bootstrap `mvn test` | BUILD SUCCESS，**Tests run: 8, Failures: 0, Errors: 0**（0→8，永久全链测试） |
| 项目级：`mvn test`（根目录） | BUILD SUCCESS 31/31 模块，退出码 0，**Tests run: 543, Failures: 0, Errors: 0, Skipped: 0**（surefire 时间窗 97 个 XML 聚合；527 基线 +16：bpm 71→79 +8、bootstrap 0→8 +8） |

**全链验证入口（永久）**：`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainH2Test.java`——独立 Flyway 实例 + `jdbc:h2:mem:flyway_full_chain`，7 个 locations 与 `application.yml` L50-64 一一对应（`{vendor}` 按 Spring Boot 语义替换为 `h2`，见 §4 偏差 1）。修复后迁移计数：**30 条**（28 + bpm V8/V14），7 目录链全覆盖，不再有"排除 BPM"口径。

## 4. 计划偏差与遗留风险

**偏差**：
1. **`{vendor}` 占位符解析（实现关键发现）**：flyway-core 11.3.4 **自身不解析** `{vendor}`——该占位符由 Spring Boot `FlywayAutoConfiguration$LocationResolver` 按 JDBC 驱动替换（生产路径不受影响，本测试复刻 Boot 逻辑显式替换为 `h2` 并在注释说明）。此为既有事实非本次引入；提示规划层：未来若直接用纯 Flyway API 跑生产迁移需显式选择方言目录。
2. BpmDeployRunner 完整幂等路径依赖 Flowable 部署（BpmDeployFacade），本模块测试上下文过重，降级为 Service 级验证查-插模式 + 重复插入被唯一索引兜底（方向允许执行角色依实际能力裁定，非目标缺失）。
3. 新测试类与 BpmInstanceServiceImplTest 共享内存库冲突（独立 URL `bpm_binding_test` 隔离，仿 BpmInstanceDataScopeTest 先例；属既定工程惯例）。

**遗留风险**：
1. PG 侧 partial unique index 语义依赖 PG 本地库运行期验证（需启动应用/联调，规划层授权后可补）——本轮 PG 侧零改动，回归风险极低。
2. `active_key` 生成列在 MP 全列 SELECT 下会多返回一列（H2 侧），实体未映射该列、MP 按实体字段消费，无影响；已实测通过。
3. 历史"28 条冒烟"为已删除的临时测试（不入库）；自本轮起由永久 `FlywayFullChainH2Test` 取代，口径 **28→30**。

## 5. §3.3 第10项知识库全量同步（清单变更明细 + 触碰文件清单）

**清单变更明细**：`Smart-WorkFlow/功能清单.md` **状态列无变化**——I47 为迁移链底层缺陷（known-issues 编号，非功能清单明细行），M04 各明细行状态不受本轮影响（M04-F08-01 可插拔机制维持 ✅；M04-F03-01 发起维持 ✅）。

**触碰文件清单**：
- 代码/测试（后端工作区）：`db/migration/bpm/h2/V8__init_bpm_metadata.sql`（改）、`schema-h2.sql`（改）、`sw-bootstrap/pom.xml`（改）、`BpmFormBindingServiceImplTest.java`（新）、`FlywayFullChainH2Test.java`（新）——共 5 文件
- knowledge：`known-issues.md`（I47 ✅ 已修复）、`current-status.md`（§1 整体概览/§4 进行中/§5 已完成 18→19/§9 测试基线 527→543 + Flyway 口径 28→30）、`features/bpm-h2-v8-compat.md`（新建）、`session-handoff.md`（§1 新条目）
- todo：`requirement-pool.md`（P10 待排期 → ✅ 已核销，D88 最终验收 PASSED；I47 同步关闭）
- memory（压缩索引）：由规划层在最终验收时按 §7.3 落盘（features/state/handoff/issues）

**结论**：P10/I47 修复闭环完成，验收方向 6 条全部满足（逐条对照见下）。规划层最终验收（D88，2026-08-17）：**PASSED**，六项验收方向全部满足；PG 侧运行期联调为零改动侧低风险遗留，不阻塞。方向文档已归档至 `product/bpm-h2-v8-compat/passed/`。后续阶段三知识同步收尾修正（D89，2026-08-18）：见 `receipts/post-sync-correction.md`。

## 6. 验收方向逐项对照

| # | 验收条件 | 结论 | 证据 |
|---|----------|:---:|------|
| 1 | H2 BPM 迁移链不再因 V8 partial index 失败，V8 之后迁移可连续执行 | ✅ | 全链日志「Migrating 8 - init bpm metadata → 14 - add process def」连续成功，30/30 应用 + validate 通过 |
| 2 | PG 保留 active 条件唯一语义；H2 等价方案有明确约束语义证据 | ✅ | PG V8 零改动（git diff 零差异）；H2 生成列 `active_key`（active=true→非空唯一、active=false→NULL 可共存），语义推理 + 正反例实测（SQLState 23505）双证 |
| 3 | active 唯一性、非 active 共存、启停/重复绑定边界均有可核验测试证据 | ✅ | BpmFormBindingServiceImplTest 8 用例（服务层 + DB 层正反例）+ FlywayFullChainH2Test JDBC 正反例（详见测试回执 §2/§3） |
| 4 | BPM 纳入可重复 H2 全链验证；回执报告修复后迁移计数与验证入口 | ✅ | 永久测试 `FlywayFullChainH2Test`（sw-bootstrap，入库保留）；修复后计数 **30**（28+2），7 目录全覆盖 |
| 5 | 受影响模块 + 项目级回归通过，≥527 tests，2G 上限 | ✅ | 模块 58/0/0 + 8/0/0；项目级 **543/0/0**（≥527）；全部命令 `MAVEN_OPTS="-Xmx2g"` 串行执行 |
| 6 | 无前端改动、无无关业务行为变化；回执列明修改范围/命令/偏差/风险/§3.3 第10项 | ✅ | 本回执 §2/§3/§4/§5；前端零改动（后端执行会话无前端触碰） |
