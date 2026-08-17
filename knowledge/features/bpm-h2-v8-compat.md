# 功能追踪：P10 / I47 BPM H2 V8 迁移链兼容性修复（bpm-h2-v8-compat）

> 工作区统一知识库 — 修复轮追踪。
> 本文件记录 P10/I47 修复轮的完整闭环：探索取证 → 规划裁定 → 代码修复 → 测试验证 → 知识库同步。
>
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P10（需求池）/ I47（known-issues 注册表，非 Mxx 功能明细） |
| 功能名称 | BPM H2 V8 迁移链兼容性修复 |
| 功能目标 | 消除 BPM H2 迁移链 V8 唯一约束处的方言不兼容（PG partial unique index 语法 H2 不支持），使 BPM 迁移纳入真实 H2 全链 Flyway 验证，同时保持 PostgreSQL 与 H2 的 active 唯一性业务语义一致 |
| 创建日期 | 2026-08-17 |
| 当前状态 | 执行层自验收完成（543/0/0 全绿），**待规划层最终验收**（验收前不得标 PASSED/归档） |
| 涉及模块 | 后端 `Smart-WorkFlow`：sw-bpm-process（迁移 h2/V8 + 测试）+ sw-bootstrap（永久全链测试基建） |

---

## 2. 需求分析

### 2.1 问题根源

- bpm 模块双方言 V8（`db/migration/bpm/{h2,postgresql}/V8__init_bpm_metadata.sql`，h2 L34 = pg L39 逐字相同）含 PG 独有 partial unique index：`create unique index uk_sw_bpm_binding_active on sw_bpm_form_binding (tenant_id, form_key) where active = true;`
- **H2 2.3.232 不支持 partial index 任何模式**（H2 官方确认，功能请求 h2database#2054 长期未实现；社区 workaround=生成列 + 唯一约束）。h2/V8 文件头 L14-16「条件唯一索引用 WHERE 子句（H2 支持）」为错误断言。
- 后果：bpm 全链 H2 Flyway 迁移从未可跑（全链死在 V8），模块测试均绕过 Flyway 直建 DDL（且测试 schema 不含绑定表，active 唯一性语义零测试覆盖）；冒烟验证用 6 目录链排除 bpm 两条（28 条口径，临时测试跑完即删）。
- 业务语义依赖方：`BpmFormBinding` 实体 Javadoc（同租户同表单最多一条 active）、`BpmFormBindingServiceImpl.findActiveByFormKey`、`ProcessStartService` L91-96 `bindings.get(0)`（唯一性缺失则静默任取）、`BpmDeployRunner.bindFormToProcess` 幂等种子。

### 2.2 规划裁定（方向文档）

1. 本轮唯一主问题是 I47；PG 侧「仅 active=true 唯一」业务语义必须保留；H2 侧等价约束实现由执行角色依据实际 H2/Flyway 能力裁定并在回执中说明。
2. 验证目标：BPM 迁移重新纳入**真实 H2 全链验证**，证明 V8 之后的 BPM 迁移可继续执行。
3. 永久全链验证可补充最小测试基建；不得重构测试框架或扩大为跨模块测试平台建设。

### 2.3 非目标

- 不改变 BPM 流程定义绑定/发布/激活停用业务规则；不以删除唯一约束换取兼容；不修改前端。
- 不处理 I49/I50/I48 或其他需求池缺口；不新增与迁移兼容性无关的表/接口/页面/业务能力。

---

## 3. 执行记录

### 3.1 探索（1 Explore subagent，8 问全答，只读）

- V8 双方言全文对比：唯一语法差异即 partial index 一处（COMMENT ON 为 H2 正确省略）；V8 之后仅 V14（建 sw_bpm_process_def，不引用 V8 表，无 PG 独有语法）。
- Flyway 配置：`application.yml` L50-64 共 7 个 locations（含 bpm），`{vendor}` 由 Spring Boot 按 JDBC 驱动解析；bpm 从未被配置排除，排除是临时冒烟测试的 locations 选择。
- 28 冒烟口径：30 − bpm 2（V8/V14）= 28；6 链 bootstrap 14 + notify 1 + form 2 + agent 9 + job 1 + storage 1；临时测试跑完即删、不入库。
- sw-bootstrap 无 src/test、无 junit 依赖；sw-bpm-process 测试经 `application-test.yml`（`MODE=PostgreSQL` + `spring.sql.init` + 排除 FlywayAutoConfiguration）直建 DDL，schema-h2.sql 仅 sw_bpm_instance（无绑定表）。
- H2 partial index：官方不支持；仓库先例=双方言不同写法语义一致（form V7 JSON/JSONB、bpm V14 clob/text）、V13 刻意避开 partial index 用 ANSI 复合唯一（但 V13 注释明确把 `uk_sw_bpm_binding_active` 列为无需改动）。
- 回执：探索结论在主会话汇总（本轮无独立 search_task 文件；探索依据=方向文档 §探索依据 4 个文件）。

### 3.2 代码修复（1 Sub Agent）

| 文件 | 类型 | 改动 |
|------|------|------|
| `sw-bpm-process/.../db/migration/bpm/h2/V8__init_bpm_metadata.sql` | 修改 | 文件头错误断言修正；建表 `active` 后新增生成列 `active_key varchar(265) generated always as (case when active then (cast(tenant_id as varchar(64)) || ':' || form_key) end)`；L34 partial index → `create unique index uk_sw_bpm_binding_active on sw_bpm_form_binding (active_key);`（索引名不变） |
| `sw-bpm-process/src/test/resources/db/schema-h2.sql` | 修改 | 追加与修复后 h2/V8 逐字一致的 `sw_bpm_form_binding`（含生成列）+ 唯一索引；头注释同步；纯增量 |
| `sw-bootstrap/pom.xml` | 修改 | +`org.junit.jupiter:junit-jupiter`（test，BOM 管版本） |
| `sw-bpm-process/.../service/impl/BpmFormBindingServiceImplTest.java` | 新建 | 绑定语义正反例 8 用例（214 行）：DB 级 JdbcTemplate 显式 tenant_id 正例 5 + 反例 1（SQLState 23505）+ Service 级 2（findActiveByFormKey、查-插幂等+兜底）；独立内存库 URL `bpm_binding_test` 隔离 |
| `sw-bootstrap/.../FlywayFullChainH2Test.java` | 新建 | 永久真全链 8 用例（227 行）：7 locations 独立 Flyway migrate=30 + applied 含 V8/V14 + validate + 表/生成列/索引元数据 + JDBC 语义正反例（23505/共存/租户隔离/切换） |

**边界**：pg/V8、V13、V14 及全部其他迁移零改动（git diff 验证）；无新 V 编号、无重编号；业务代码（实体/Service/DeployRunner）零改动；前端零触碰。

### 3.3 测试验证（实现 Agent 模块级 + 主会话项目级）

- sw-bpm-process：**58/0/0**（50→+8）；sw-bootstrap：**8/0/0**（0→8）。
- 项目级 `mvn test`（MAVEN_OPTS="-Xmx2g"）：BUILD SUCCESS 31/31，**543/0/0**（surefire 时间窗 97 XML 聚合；527+16：bpm 71→79、bootstrap 0→8）。
- 全链日志原文：「Migrating ... version "8 - init bpm metadata" → "14 - add process def"」→「Successfully applied 30 migrations ... now at version v30」→「Successfully validated 30 migrations」。
- 关键发现：flyway-core 11.3.4 **自身不解析** `{vendor}`（由 Spring Boot LocationResolver 替换）；测试显式替换 `h2` 复刻 Boot 逻辑（生产路径不受影响，已注释说明）。

---

## 4. 关键设计决策（D 编号待规划层验收后注记）

1. **H2 等价约束 = 生成列 + 唯一索引**（非 ANSI 复合唯一 (tenant_id, form_key, active)——后者只允许一条 inactive，破坏「非 active 历史共存」；H2 官方无 partial index 能力，生成列是社区标准 workaround）。`active_key` 语义：active=true → `'tenant_id:form_key'`（非空→唯一）；active=false → NULL（H2 唯一索引允许多个 NULL）。`active_key` 长度 265 = 64+1+200 恰好覆盖无截断；映射单射（首个 `:` 前为纯数字租户，解析无歧义）。
2. **仅改 h2/V8、不动 pg/V8**：h2/V8 从未在任何 H2 库执行成功（全链死在 V8），修改无校验和/升级路径风险；PG V8 已发布，validate-on-migrate 下不可动。
3. **永久全链测试入 sw-bootstrap**（最小基建：junit-jupiter + 1 测试类），取代已删除的临时 6 链冒烟；冒烟口径 28→30。
4. **h2/V13 注释保持原样**：提及 `uk_sw_bpm_binding_active`「已有 WHERE active=true」属文档性描述且 h2/V13 从未被应用，不触碰避免无必要迁移文件变更。

---

## 5. 验收方向对照（执行层自验收，待规划层最终验收）

| # | 验收条件 | 结论 |
|---|----------|:---:|
| 1 | H2 BPM 链不再因 V8 失败且 V8 后连续执行 | ✅ 30/30 全链 migrate+validate，8→14 连续成功 |
| 2 | PG 保留条件唯一语义；H2 等价方案有约束语义证据 | ✅ pg/V8 零改动；生成列语义推理 + 正反例实测（23505）双证 |
| 3 | active 唯一/非 active 共存/启停/重复绑定边界可核验 | ✅ 模块 8 用例 + 全链 JDBC 断言 |
| 4 | BPM 纳入可重复 H2 全链验证，报告计数与入口 | ✅ 永久 `FlywayFullChainH2Test`；计数 **30**（28+2） |
| 5 | 受影响模块 + 项目级回归 ≥527，2G 上限 | ✅ 58/0/0 + 8/0/0 + **543/0/0**，全命令 MAVEN_OPTS="-Xmx2g" 串行 |
| 6 | 无前端改动、无无关变化；回执列明范围/命令/偏差/风险/§3.3 第10项 | ✅ 完成回执 §2/§3/§4/§5 |

---

## 6. 遗留与风险

- PG 侧 partial index 运行期语义验证依赖 PG 本地库（规划层授权后可补）；本轮 PG 零改动，回归风险极低。
- `active_key` 生成列在 H2 全列 SELECT 下多返回一列，实体未映射、MP 按实体字段消费，无影响（实测通过）。
- BpmDeployRunner 完整幂等路径（Flowable 部署）测试上下文过重，本轮 Service 级验证查-插模式 + 唯一索引兜底；完整路径依赖联调。
- 自本轮起历史「28 条冒烟」口径失效，统一以永久 `FlywayFullChainH2Test` 为准。

## 7. 知识库同步（§3.3 第10项）

- `known-issues.md`：I47 表条目 + 详细条目 ✅ 已修复（含实现/验证摘要）。
- `current-status.md`：§1 测试基线 + 前次验证、§4 进行中、§5 已完成 18→19（sysrole 更新为 PASSED 归档 + bpm-h2-v8-compat 新增）、§9 543 演进 + 冒烟口径 28→30。
- `session-handoff.md`：§1 新条目。
- `todo/requirement-pool.md`：P10 待排期 → ✅ 已修复（待规划层验收）。
- `功能清单.md`：状态列无变化（I47 非清单明细行）。
- memory 压缩索引：由规划层最终验收时落盘。
- 回执：`product/bpm-h2-v8-compat/receipts/bpm-h2-v8-compat-{completion,test}.md`。
