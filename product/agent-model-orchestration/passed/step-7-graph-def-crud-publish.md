# Step 7 执行方案：M07-F02 图定义 CRUD + 版本 + 发布骨架

**状态**：Ready — 待执行
**前置**：F01（Step1-5）全部 PASSED（基线 341 tests，D62）；Step6 设计澄清完成（`ready/step-6-f02-design-clarification.md`，§4.1 建议 Step7 范围）
**范围依据**：Step6 §4.1 —— "Step 7（后端）：图定义 CRUD + 版本 + 发布骨架——借鉴 sw-bpm 的 `ProcessGraph`/`GraphElement` 统一节点边模型与 `def_version`/`status`/`graph_json` 表结构（V14 先例），新建 `sw_agent_graph_def` 表（Flyway V25），`graph_json` 节点 `config`/`style` 保持不透明。本 Step 仍不涉及执行，纯存储+管理，验证图定义的建模/发布流程可行"
**前置调研**：`search_fallback/m07-f02-graph-designer-precedent.md`（6 问全部有行号级证据；问题 5 含 sw-bpm B1-B5 与 sw-biz-form A1-A4 版本/发布先例完整路径+行号）
**推荐执行模型**：`deepseek/deepseek-v4-flash`（明确范围的 CRUD + 单表迁移 + 双测试类，仓库内既有模式完整可循，无跨项目联动、无新依赖、无复杂并发语义）
**回执位置**：`product/agent-model-orchestration/receipts/step-7-{execution,test}.md`

---

## §1 背景与目标

M07-F02（调度图编排/图设计器）的核心不确定项已由 Step6 设计澄清收敛（工具节点=独立图节点、MVP 节点=LLM+工具+条件分支、执行引擎=图定义驱动解释执行）。Step7 是 F02 的第一步落地：**图定义的持久化与生命周期管理骨架**——建表 + 实体/DTO + CRUD + 草稿保存 + 发布（版本递增/冻结），**不实现任何执行语义**（无解释器、不动 `AgentGraphFactory`/LangGraph4j、不引入新依赖、不碰前端）。

验证目标：图定义（`graph_json` 承载的节点/边列表）的建模、存储、发布流程在 agent 模块可行，且 `config`/`style` 不透明透传约定从第一天就以类型注释 + 测试固化，为 Step8（图解释执行引擎）与 Step9（前端图设计器）提供稳定契约。

## §2 前置调研关键发现（方案依据）

以下结论均来自 `search_fallback/m07-f02-graph-designer-precedent.md` 的路径+行号级证据，本方案不采信训练记忆：

| 发现 | 影响 |
|---|---|
| agent 路径 Flyway 最大版本号为 **V24**（`sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/V24__alter_agent_model_config_multikey.sql`），**V25 空闲**；agent 全部迁移脚本位于 `sw-bootstrap`（sw-basic-agent 模块内 `db/migration/agent/` 仅 `.gitkeep`） | V25 双 dialect 脚本写入 `sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/`，执行前现场 `find` 复核 |
| sw-bpm 先例 B1/B2（`sw-bpm-api/.../dto/ProcessGraph.java` L12-42、`GraphElement.java` L11-47）：图模型=`processKey/name/formKey/version/elements/canvas`；元素=`id/kind('node'\|'edge')/type/source/target + config/style` 统一模型；**类注释原文"后端仅解释拓扑（id/kind/type/source/target），config 与 style 为不透明 Map 原样透传，严禁在后端解析其内部字段"** | agent 模块**自建**同构图模型 DTO（不能依赖 sw-bpm-api——依赖方向 sw-biz→sw-basic 不可反向），注释禁令原文保留 |
| sw-bpm 先例 B3（`sw-bpm-process/.../db/migration/bpm/{h2,postgresql}/V14__add_process_def.sql`）：`sw_bpm_process_def` 列 `process_key/name/form_key/def_version INT NOT NULL DEFAULT 1/status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'/deployment_id/process_definition_id/graph_json text(clob)`，8 基列在前 | 表结构借鉴（process_key→graph_key、name、def_version、status、graph_json），**列顺序与审计列类型按 agent 模块惯例**（V19：审计列在后、`create_by VARCHAR(64)`、`create_time TIMESTAMP` 无默认值由 MetaObjectHandler 填充、大字段 H2=CLOB/PG=TEXT） |
| sw-bpm 先例 B5（`BpmProcessDefServiceImpl.java` L154-225 publish）：发布流=解析图→发布门校验→**process_key 冻结检查**（L195-204，已 PUBLISHED 后 key 不可变更，`PROCESS_KEY_FROZEN`）→部署→状态置 PUBLISHED；草稿保存 L94-101"status 保持 DRAFT，不跑校验（允许存残图）"；列表 L135-144"列表不返回 graph_json 大字段" | 发布冻结检查 + 草稿不校验 + 列表剥离大字段，三条语义直接沿用 |
| sw-biz-form 先例 A3/A4（`FormDefServiceImpl.java` L154-264 publish + `FormSnapshotEntity.java`）：**每次发布 `form_version` 递增**（L217 `entity.getFormVersion() == null ? 1 : entity.getFormVersion() + 1`），且**已发布不可重复发布**（L161-163 `FORM_ALREADY_PUBLISHED`——因发布即建动态宽表物理资源）；另存 `sw_form_snapshot` 版本快照行 | 版本**递增**语义取 form 先例（发布版本号有意义）；**重复发布禁止**不取 form（agent 图发布不建物理资源，无"不可重复发布"理由，且 Step6 决策 3 的迭代式图演进需要重复发布）；快照表本期不建（任务范围仅 1 张表，历史版本内容回溯留后续批次） |
| agent 模块惯例（V19-V24 + 现有代码）：实体继承 `BaseEntity`（`@TableName` + Lombok `@Data/@EqualsAndHashCode(callSuper=true)`）、Mapper `extends BaseMapper<T>`、Service 接口+`BaseServiceImpl` 实现、Controller `R<T>` 包裹 + `@PreAuthorize("@ss.hasPermi(...)")`；**varchar+String 状态，不建 enum 类**（D52 决策）；错误码只用 `CommonErrorCode`（PARAM_ERROR/NOT_FOUND）加自定义 message，无模块级错误码枚举 | 全部沿用，不新建类型 |
| agent 模块权限码现状：仅 3 枚（`agent:model:view/manage/test`，Step5 验收 13 确认未新增第 4 枚）；新增权限码需同步前端权限数据与种子数据（超本 Step 范围） | 图定义管理**沿用** `agent:model:view`（查询）/`agent:model:manage`（增改删发），不新增权限码，依据在 §4-C |
| sw-bootstrap 模块无测试（Step5 V5 先例：H2 内存库 RunScript 实测迁移链） | V25 迁移验证采用同款 RunScript 双 dialect 实测 + `mvn test` 回归 |
| Step6 §2 决策 2：条件分支求值方式**推荐值**=字符串/关键词匹配（"分支边携带一个关键词/正则条件，图执行引擎按上一节点输出文本逐条匹配边条件，取第一个命中的边"，不引入 SpEL/MVEL），**未最终拍板** | §9 复核小节：非阻塞（Step7 config 不透明）、待用户拍板、Step8 实现，本 Step 不实现 |

## §3 范围裁定

### 本 Step 包含

1. **DB 迁移 V25**（2 文件）：新建 `sw_agent_graph_def` 表（H2 + PostgreSQL 各一脚本）
2. **图模型 DTO**（2 文件）：`com.sw.ck.agent.dto.graph` 包下 `ProcessGraph` + `GraphElement`（与 sw-bpm 同名同构，agent 模块自建，config/style 不透明）
3. **实体 + Mapper**（2 文件）：`AgentGraphDef`、`AgentGraphDefMapper`
4. **Service**（2 文件）：`AgentGraphDefService` 接口 + `AgentGraphDefServiceImpl`（create / saveDraftGraph / getGraph / pageDefs / delete / publish）
5. **Controller**（1 文件）：`AgentGraphDefController`（`/agent/graph-defs`，6 端点）
6. **DTO**（2 文件）：`AgentGraphDefDTO`（列表/发布响应）、`AgentGraphCreateReqDTO`（创建入参）
7. **测试**（2 文件）：`AgentGraphDefServiceImplTest` + `AgentGraphDefControllerTest`（目标 ~19 个用例）
8. **文档/记忆产出**：执行方案、执行回执、测试回执、方案归档、memory 更新、knowledge/known-issues.md I13 更新、双仓库提交

### 本 Step 不包含

- **任何执行语义**：无解释器、无节点分发、不动 `AgentGraphFactory`/`AgentGraphAutoConfiguration`/`ChatModelFactory`/`AgentToolCallbackFactory`、不改图拓扑
- **拓扑校验器**（sw-bpm 的 GraphValidator 全规则，含 START/END 存在性、边引用完整性）——发布门只做"图可解析 + elements 非空"最小校验；完整拓扑校验与执行语义一起留 Step8（届时校验规则由节点类型集合决定，本轮过早固化会与 Step8 设计冲突）。已在 §4-D 记录此范围裁定
- **版本快照表**（sw-bpm 无快照表、sw-form 有 `sw_form_snapshot`）——任务范围仅 `sw_agent_graph_def` 单表；历史版本内容回溯能力推入 todo（方案 §12 展望）
- **手动解锁/回滚/撤回发布**——留后续批次
- **前端任何文件**（Smart-WorkFlow-Web 零改动）
- **新依赖**（禁止 SpEL/MVEL/任何新 jar）
- **新增权限码**（沿用 agent:model:view/manage）
- **条件分支求值实现**（§9）

## §4 架构决策

### A. 发布状态机：版本递增（form 风格）+ key 冻结（bpm 风格），允许重复发布

两先例语义不同（B6 对照）：
- sw-biz-form：`form_version` 每次发布 +1，**已发布不可重复发布**（发布即建动态宽表，物理资源不可重建）
- sw-bpm：`def_version` 恒 1（cut A 未实现递增，注释"本刀不递增"），**允许重复发布**，发布时做 process_key 冻结检查

**agent 场景选型**：**版本递增取 form 语义**（每次发布 `def_version + 1`，发布版本号对执行引用有意义——Step8 按图定义驱动执行时，发布版本是稳定引用点）；**冻结取 bpm 语义**（`graph_key` 发布后冻结，已 PUBLISHED 的定义再发布时 graph 内携带的 key 必须与实体一致，否则拒绝——对齐 bpm 2101 `PROCESS_KEY_FROZEN`）；**重复发布允许**（agent 图发布不产生物理资源，无 form 的"不可重复发布"理由；Step6 决策 3 的图迭代演进要求可重复发布）。

**版本号语义**：`create` 显式 `defVersion=1`（对齐 bpm L84 `setDefVersion(1)`）；发布时 `defVersion = (null ? 1 : 当前 + 1)`（对齐 form L217 原文），首次发布 1→2，此后每次 +1。发布保留当前 `graph_json` 内容（草稿已是最新内容），仅递增版本与置 PUBLISHED。快照表不建：`def_version` 记录版本演进序列，历史版本内容留存推入 todo（§12）。

### B. 实体/DTO 命名：与 sw-bpm 对齐（图模型同名），模块内按 agent 惯例

- 图模型 DTO 命名为 `ProcessGraph`/`GraphElement`（与 sw-bpm 完全同名同构），置于 `com.sw.ck.agent.dto.graph` 包——agent 模块不能依赖 `sw-bpm-api`（依赖方向 sw-biz→sw-basic 不可反向），自建同名类型由包名区分，Step8/9 消费语义与 bpm 设计器一致，便于跨模块对照
- agent 版 `ProcessGraph` 字段：`graphKey/name/version/elements/canvas`——去掉 bpm 的 `formKey`（agent 图不绑表单；LLM/工具节点绑定配置属于节点 `config`（不透明），Step8 定）
- 实体：`AgentGraphDef`（`@TableName("sw_agent_graph_def")`，无 Entity 后缀，agent 模块惯例）
- 状态：`String` 常量 `DRAFT`/`PUBLISHED`（varchar+String 不建 enum 类，D52 决策）
- 类注释**必须**写明：`GraphElement`/`ProcessGraph` ——"后端仅解释拓扑（id/kind/type/source/target），config 与 style 为不透明 Map 原样透传，严禁在后端解析其内部字段"（bpm B1/B2 原文禁令，验收 3）

### C. 权限码：沿用 `agent:model:view` / `agent:model:manage`，不新增

新增权限码需同步全局权限模型（前端菜单/种子数据/权限分配），属范围外；图定义管理与模型管理同属 M07 agent 管理域。查询端点 `agent:model:view`，增/改/删/发布 `agent:model:manage`（发布是状态变更动作，归 manage）。Step8 若引入执行端点再评估是否需要执行专用权限码。

### D. 发布门校验范围：最小校验，不做拓扑全规则

发布门只做：①图可解析且 `elements` 非空（对齐 bpm L170-172 `GRAPH_MISSING_START` 语义，报 PARAM_ERROR"图数据为空，无法发布"）②已发布定义的 `graph_key` 冻结检查。**不做** START/END 存在性、边引用完整性等 GraphValidator 全规则——完整拓扑校验依赖最终节点类型集合（Step8 才定），本轮过早固化校验规则会与 Step8 冲突。此为明确的范围裁定而非疏漏，回执中如实记录。

### E. 错误处理：`CommonErrorCode` + 自定义 message

agent 模块至今无模块级错误码枚举（D52 精神：不建多余类型），全部业务错误沿用 `CommonErrorCode.PARAM_ERROR`（参数/状态语义错误，含冻结冲突、图数据为空）/`NOT_FOUND`（id 不存在/跨租户）+ 明确中文 message。与 `AgentModelConfigServiceImpl` 完全同款。

## §5 现场验证要求（禁止凑造）

| # | 验证项 | 方法 | 若与预期不符则 |
|---|---|---|---|
| V1 | **执行前 Flyway 最大版本号现场复核仍为 V24、V25 空闲** | 现场 `find sw-bootstrap/src/main/resources/db/migration/agent`，排除 `.claude/worktrees/` 与字母序陷阱（D57 教训） | 若 V25 已被占用，顺延取下一空闲版本并在回执记录 |
| V2 | **V25 脚本 H2/PG 双 dialect 实测**（sw-bootstrap 无测试，同 Step5 V5 手法） | H2 内存库（MODE=PostgreSQL）RunScript 分别执行完整 agent 链（V19→V25 / V24→V25）+ V25 单脚本，`information_schema` 确认表/列/索引存在；PG 脚本含 `COMMENT ON` 需确认 H2 PG 模式可执行 | 若某 dialect 语法不兼容，如实调整脚本并记录 |
| V3 | **测试类 DDL 与 V25 对齐** | `AgentGraphDefServiceImplTest`/`AgentGraphDefControllerTest` 的 `@BeforeAll` 建表 DDL 与 V25 H2 脚本逐列一致（含索引），实体字段映射无遗漏 | 实测列名/类型差异导致 mapper 报错时，以 V25 为准修正测试 DDL 并记录 |
| V4 | **ObjectMapper 装配**：ServiceImpl 注入 `ObjectMapper` 序列化/反序列化 `ProcessGraph`（`Map`/`List` 嵌套无 `LocalDateTime`，裸 mapper 即可） | 单测里真实走 `graph_json` 写入→回读→解析全链路；Controller 测试靠 `@EnableAutoConfiguration` 的 JacksonAutoConfiguration 提供 | 若嵌套类型反序列化失败（如 `LinkedHashMap`→`Map` 泛型擦除），如实调整并记录 |

## §6 新建/改造文件清单

### 数据库迁移（2 文件，新建）

```
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/
  h2/V25__init_agent_graph_def.sql
  postgresql/V25__init_agent_graph_def.sql
```

### Java 生产代码（11 文件，全部新建，零修改既有文件）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  entity/AgentGraphDef.java
  dto/graph/ProcessGraph.java
  dto/graph/GraphElement.java
  dto/AgentGraphDefDTO.java
  dto/AgentGraphCreateReqDTO.java
  mapper/AgentGraphDefMapper.java
  service/AgentGraphDefService.java
  service/impl/AgentGraphDefServiceImpl.java
  controller/AgentGraphDefController.java
```

### 测试（2 文件，新建）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/
  service/impl/AgentGraphDefServiceImplTest.java
  controller/AgentGraphDefControllerTest.java
```

**零修改**：V19-V24 任何脚本、`AgentGraphFactory`/`ChatModelFactory`/`AgentToolCallbackFactory`/`AgentOrchestrationServiceImpl`、既有任何 entity/mapper/service/controller/测试、前端文件、pom.xml。

## §7 DB 方案

### §7.1 V25 — H2

```sql
-- ===================================================================
-- Smart-WorkFlow :: V25: 初始化 Agent 图定义表 (H2)
-- M07-F02 Step7：图定义 CRUD + 版本 + 发布骨架（纯存储+管理，无执行语义）
-- 借鉴 sw-bpm V14（sw_bpm_process_def：process_key/name/def_version/status/graph_json），
-- 适配 agent 模块惯例（V19-V24：审计列在后、create_by VARCHAR(64)、大字段 CLOB）
-- 本表走 MyBatis-Plus 常规通道：@TableLogic + 租户拦截器自动处理 deleted/tenant_id
-- ===================================================================
CREATE TABLE sw_agent_graph_def (
    id           BIGINT NOT NULL PRIMARY KEY,
    graph_key    VARCHAR(100) NOT NULL,
    name         VARCHAR(200) NOT NULL,
    def_version  INT NOT NULL DEFAULT 1,
    status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    graph_json   CLOB,
    create_time  TIMESTAMP,
    create_by    VARCHAR(64),
    update_time  TIMESTAMP,
    update_by    VARCHAR(64),
    deleted      SMALLINT NOT NULL DEFAULT 0,
    tenant_id    BIGINT NOT NULL DEFAULT 0,
    version      BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_sw_agent_graph_key ON sw_agent_graph_def (tenant_id, graph_key);
CREATE INDEX idx_sw_agent_graph_tenant_deleted ON sw_agent_graph_def (tenant_id, deleted);
```

### §7.2 V25 — PostgreSQL

```sql
-- ===================================================================
-- Smart-WorkFlow :: V25: 初始化 Agent 图定义表 (PostgreSQL)
-- M07-F02 Step7：图定义 CRUD + 版本 + 发布骨架（纯存储+管理，无执行语义）
-- 借鉴 sw-bpm V14，适配 agent 模块惯例（V19-V24：审计列在后、create_by VARCHAR(64)、大字段 TEXT）
-- ===================================================================
CREATE TABLE sw_agent_graph_def (
    id           BIGINT NOT NULL PRIMARY KEY,
    graph_key    VARCHAR(100) NOT NULL,
    name         VARCHAR(200) NOT NULL,
    def_version  INT NOT NULL DEFAULT 1,
    status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    graph_json   TEXT,
    create_time  TIMESTAMP,
    create_by    VARCHAR(64),
    update_time  TIMESTAMP,
    update_by    VARCHAR(64),
    deleted      SMALLINT NOT NULL DEFAULT 0,
    tenant_id    BIGINT NOT NULL DEFAULT 0,
    version      BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_sw_agent_graph_key ON sw_agent_graph_def (tenant_id, graph_key);
CREATE INDEX idx_sw_agent_graph_tenant_deleted ON sw_agent_graph_def (tenant_id, deleted);

COMMENT ON TABLE  sw_agent_graph_def IS 'M07 Agent 图定义表（图设计器后端存储）';
COMMENT ON COLUMN sw_agent_graph_def.graph_key IS '图业务 key（服务端生成，发布后冻结）';
COMMENT ON COLUMN sw_agent_graph_def.name IS '图名称';
COMMENT ON COLUMN sw_agent_graph_def.def_version IS '定义版本号（每次发布递增）';
COMMENT ON COLUMN sw_agent_graph_def.status IS '状态：DRAFT（草稿）/ PUBLISHED（已发布）';
COMMENT ON COLUMN sw_agent_graph_def.graph_json IS '图 JSON 文档（ProcessGraph 序列化，config/style 不透明透传）';
```

**字段设计依据**：`graph_key VARCHAR(100) NOT NULL`（服务端生成 `agent_` 前缀 UUID 短串，对齐 bpm `bpm_` 前缀先例；**租户内唯一索引**——图 key 是 Step8 执行的业务引用键，唯一性防歧义查找，索引命名 `uk_` 对齐 agent V19 `uk_sw_agent_model_name` 先例）；`def_version INT NOT NULL DEFAULT 1`（版本号，发布递增）；`status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'`；`graph_json CLOB/TEXT`（ProcessGraph 序列化，大字段 H2=CLOB/PG=TEXT 惯例）；8 基列按 agent V19-V24 惯例排列在业务列之后、`create_by VARCHAR(64)`、`create_time TIMESTAMP` 无默认值（MetaObjectHandler 填充）。**不设** bpm 的 `deployment_id`/`process_definition_id`（那是 Flowable 部署回填，agent 无此概念）。

## §8 API 设计（Controller `/agent/graph-defs`）

| 方法 | 路径 | 权限 | 入参 | 出参 | 语义 |
|---|---|---|---|---|---|
| POST | `/agent/graph-defs` | agent:model:manage | `AgentGraphCreateReqDTO{name}` | `R<Long>` | 创建：生成 `agent_` 前缀 graphKey + 初始图（START→END，对齐 bpm `buildInitialGraph` 3 元素）+ defVersion=1 + DRAFT |
| PUT | `/agent/graph-defs/{id}/graph` | agent:model:manage | `ProcessGraph` | `R<Void>` | 草稿保存：全量覆盖 graph_json，status 保持 DRAFT，不跑校验（允许残图） |
| POST | `/agent/graph-defs/{id}/publish` | agent:model:manage | — | `R<AgentGraphDefDTO>` | 发布：最小发布门（图可解析+elements 非空）+ key 冻结检查 + defVersion+1 + PUBLISHED |
| GET | `/agent/graph-defs/{id}` | agent:model:view | — | `R<ProcessGraph>` | 详情：解析 graph_json 返回图对象（设计器回显，对齐 bpm GET /{id} 返回 ProcessGraph） |
| GET | `/agent/graph-defs` | agent:model:view | `PageParam` | `R<PageResult<AgentGraphDefDTO>>` | 分页列表：**不含 graph_json 大字段**（对齐 bpm listDefs L139-142），按 update_time 倒序 |
| DELETE | `/agent/graph-defs/{id}` | agent:model:manage | — | `R<Void>` | 逻辑删除（@TableLogic），幂等 |

**Service 接口**：

```java
public interface AgentGraphDefService {
    Long create(String name);
    void saveDraftGraph(Long id, ProcessGraph graph);
    ProcessGraph getGraph(Long id);
    PageResult<AgentGraphDefDTO> pageDefs(PageParam pageParam);
    void delete(Long id);
    AgentGraphDefDTO publish(Long id);
}
```

**发布伪代码**（`AgentGraphDefServiceImpl.publish`）：

```java
AgentGraphDef entity = requireEntity(id);                       // selectById 经租户拦截器，null → NOT_FOUND
ProcessGraph graph = parseGraph(entity.getGraphJson());         // 解析失败/空 → PARAM_ERROR("图数据为空，无法发布")
if (graph == null || graph.getElements() == null || graph.getElements().isEmpty()) throw ...;
if (STATUS_PUBLISHED.equals(entity.getStatus())) {              // 冻结检查（bpm 2101 语义，仅已发布过）
    if (graph.getGraphKey() != null && !entity.getGraphKey().equals(graph.getGraphKey()))
        throw PARAM_ERROR("graphKey 已冻结，不可变更");
}
entity.setDefVersion(entity.getDefVersion() == null ? 1 : entity.getDefVersion() + 1);   // form L217 语义
entity.setStatus(STATUS_PUBLISHED);
updateById(entity);
return toDTO(entity);
```

**graphKey 冻结语义说明**：实体 `graph_key` 是 key 的唯一真源（服务端创建时生成）；设计器回显/保存的图对象里 `graphKey` 应始终等于实体值。冻结检查在"已 PUBLISHED"后生效（首次发布不检查，对齐 bpm 注释"首次发布时 def.getStatus() == DRAFT，跳过此检查"），首次发布后实体 key 即为冻结值。

## §9 条件分支求值方式复核（Step6 决策 2 原文复核）

**推荐值（Step6 §2 决策 2 原文）**：

> 建议采用**表达式匹配 LLM 输出文本**的最小实现（如分支边携带一个关键词/正则条件，图执行引擎按上一节点输出文本逐条匹配边条件，取第一个命中的边），不引入独立的表达式引擎依赖（如 SpEL/MVEL）——`sw-bpm` 的 `GraphElement.config`（不透明 Map）先例支持这种"条件配置随边携带、执行引擎只做字符串匹配"的轻量方案。**此为本文档给出的推荐值，非用户已拍板项，下一个 Step 方案中需再次显式确认。**

**本 Step 复核结论**：

- **状态**：**非阻塞**——Step7 纯存储，`config` 不透明原样透传，条件求值方式不影响本 Step 任何表结构/API 决策
- **推荐值保持**：字符串/关键词匹配（分支边 `config` 携带条件，执行引擎按上一节点输出文本逐条匹配、取第一个命中边），不引入 SpEL/MVEL 依赖
- **待用户拍板**：仍未最终确认，Step8（解释执行引擎）方案中需再次显式确认后才可实现
- **本 Step 不实现**：无任何条件求值代码

## §10 边界情况

| 场景 | 预期行为 |
|---|---|
| `create` name 为空/空白 | PARAM_ERROR"图名称不能为空"，不落库 |
| `saveDraftGraph` 保存残缺图（如仅 1 个节点、无边） | 允许保存（草稿不校验，对齐 bpm saveDraftGraph"不跑校验"）；发布时才会被发布门拦截 |
| `saveDraftGraph` 保存的图 `graphKey` 与实体不一致（设计器篡改 key） | 草稿阶段允许（仅存储）；发布时若已 PUBLISHED 则冻结检查拦截 |
| 首次发布（DRAFT→PUBLISHED） | 不检查冻结（无发布历史）；defVersion 1→2；graph_json 保留草稿内容 |
| 重复发布（PUBLISHED→再次 publish） | 允许；graphKey 与实体一致 → defVersion 再 +1；不一致 → PARAM_ERROR 冻结 |
| graph_json 为 null/空/损坏 JSON | `getGraph` 返回 null（对齐 bpm parseGraph 返回 null）；`publish` 抛 PARAM_ERROR"图数据为空，无法发布" |
| 不存在的 id / 跨租户 id | `requireEntity` selectById 经租户拦截器返回 null → NOT_FOUND（与 AgentModelConfig 同款） |
| 并发重复发布同一 id | 无分布式锁；两请求各自 selectById→+1→updateById，version 乐观锁由 updateById 触发（@Version），后者失败抛乐观锁异常（与既有模块同款行为，不引入额外基础设施） |
| 列表返回 | 不含 graph_json 大字段（DTO 无该字段，编译期防线） |
| 逻辑删除后 | selectById 返回 null → NOT_FOUND；删除幂等（对齐 AgentModelConfigService.delete） |

## §11 测试要求

### §11.1 新增单测（目标 ~19 用例，仿现有风格）

**`AgentGraphDefServiceImplTest`**（@SpringBootTest + H2 + TestConfig 组合装配，@Transactional 每用例回滚；TestConfig 含 ObjectMapper bean——ProcessGraph 序列化仅 Map/List/String，裸 ObjectMapper 即可，V4 现场确认）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| create 初始状态 | graphKey `agent_` 前缀、defVersion=1、DRAFT、初始图 3 elements（START/END/edge，含坐标 style） | 验收 4 |
| create name 空 | PARAM_ERROR，不落库 | 验收 5 |
| saveDraftGraph 覆盖 | 覆盖后 getGraph 回读新图；DRAFT 保持；残图（仅 1 节点）可存 | 验收 6 |
| saveDraftGraph 不存在 id | NOT_FOUND | 验收 7 |
| getGraph config/style 不透明透传 | 保存含自定义 config 字段（如条件关键词）与 style 字段的图 → 回读后原样一致（类型+值逐字段断言） | 验收 3 |
| getGraph 不存在 id | NOT_FOUND | 验收 7 |
| pageDefs 分页 + 剥离大字段 | 分页参数生效；DTO 无 graphJson 字段（反射断言，对齐 Step1 用例 4 手法） | 验收 8 |
| delete 逻辑删除 | deleted=1 落库；再 getGraph → NOT_FOUND | 验收 8 |
| publish 首次 | defVersion 1→2、PUBLISHED、graphKey 不变 | 验收 9 |
| publish 重复发布 + 冻结 | key 一致 → 2→3；图内 graphKey 篡改 → PARAM_ERROR"冻结" | 验收 9 |
| publish 空图 | graph_json 置 null/损坏 → PARAM_ERROR"图数据为空" | 验收 9 |
| publish 不存在 id | NOT_FOUND | 验收 7 |
| 跨租户隔离 | 租户 A 创建 → 租户 B getGraph/publish → NOT_FOUND | 验收 10 |

**`AgentGraphDefControllerTest`**（@SpringBootTest MOCK + MockMvc + 真实 JwtAuthenticationFilter/SecurityFilterChain/@EnableMethodSecurity，JWT 权限用户：1=无权限、2=仅 manage、3=superAdmin，复制 AgentModelControllerTest 装配；DDL 与 V25 对齐，V3）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| GET 列表无权限 | 403 | 验收 11 |
| POST 创建 manage | 200 + code=0 + id 正数 + 落库验证 | 验收 11 |
| PUT /{id}/graph 草稿 | 200 + 落库 graph_json 变化 | 验收 11 |
| POST /{id}/publish | 200 + defVersion=2 + PUBLISHED | 验收 11 |
| GET /{id} 详情 | 200 + 图对象 elements 非空 | 验收 11 |
| GET 列表 | 200 + 分页结构 | 验收 11 |
| DELETE 后 GET | DELETE 200；再 GET → 404（NOT_FOUND） | 验收 11 |
| 仅 manage 无 view | GET /{id} → 403（权限互不越权） | 验收 11 |

### §11.2 全量回归

- 全量 `mvn test`（根 pom reactor）不得 < 341（Step5 基线），0 failures 0 errors
- surefire 报告摘录附于测试回执；sw-basic-agent 79 + 新增数核对

## §12 禁止范围

1. **禁止任何执行语义实现**：无解释器、无节点分发、无条件求值、无图拓扑校验器（GraphValidator 全规则），发布门只做最小校验
2. **禁止修改** `AgentGraphFactory.java`/`AgentGraphAutoConfiguration.java`/`ChatModelFactory.java`/`AgentToolCallbackFactory.java`/`AgentOrchestrationServiceImpl.java`（git diff 为空）
3. **禁止修改 V19-V24 任何脚本**（git diff 为空）；V25 版本号执行前现场复核
4. **禁止修改前端任何文件**
5. **禁止引入新依赖**（无 SpEL/MVEL/新 jar；`ObjectMapper` 来自既有 spring 传递依赖，仅新建 bean 声明）
6. **禁止新增权限码**——沿用 `agent:model:view`/`agent:model:manage` 两枚
7. **禁止解析 config/style 内部字段**——图模型注释禁令 + 透传测试双重固化
8. **禁止**为实现 `def_version` 递增而改动 sw-bpm 或 sw-biz-form 任何代码（先例只读参照）
9. **禁止在 §5 现场验证项上凑造**（V1-V4 全部真实执行并记录）

## §13 验收标准

| # | 验收项 | 验证方式 |
|---|---|---|
| 1 | V25 双 dialect 迁移实测通过（表/唯一索引/普通索引就位，H2 CLOB / PG TEXT，PG COMMENT 语句可执行） | §5 V2 RunScript 实测输出附于回执 |
| 2 | `sw_agent_graph_def` 实体/表列一一对应；8 基列按 agent 惯例（create_by VARCHAR(64) 等） | 静态检查 + 单测落库回读 |
| 3 | `ProcessGraph`/`GraphElement` 类注释含"后端仅解释拓扑（id/kind/type/source/target），config 与 style 为不透明 Map 原样透传，严禁在后端解析其内部字段"禁令；config/style 经"保存→回读"后原样一致（单测固化） | 静态检查注释原文 + 透传测试 |
| 4 | create 生成 `agent_` 前缀 graphKey + 初始图（START→END 3 元素）+ defVersion=1 + DRAFT | 单测 |
| 5 | name 为空 → PARAM_ERROR 不落库 | 单测 |
| 6 | 草稿保存全量覆盖 graph_json、status 保持 DRAFT、允许残图 | 单测 |
| 7 | 不存在/跨租户 id → NOT_FOUND（getGraph/saveDraftGraph/publish 一致） | 单测 |
| 8 | 分页列表不含 graph_json 大字段（DTO 编译期无该字段）；逻辑删除幂等 | 单测（反射断言 + deleted 断言） |
| 9 | 发布状态机：首次 defVersion 1→2 + PUBLISHED；重复发布 key 一致版本再 +1；key 被篡改 → 冻结异常；空图 → 参数异常 | 单测 |
| 10 | 跨租户隔离（租户 B 不可读/不可发布租户 A 的图） | 单测 |
| 11 | Controller 6 端点 200 语义 + 403 权限（无 view 权限 GET 403 / 仅 manage 无 view 403）+ DELETE 后 GET 404 | Controller 测试 |
| 12 | §5 四项现场验证（V1-V4）全部给出真实执行结果，无凑造 | 回执 §3 |
| 13 | 全量 `mvn test` ≥ 341 + 新增数（预计 ~19），0 failures 0 errors | surefire 摘录附于测试回执 |
| 14 | 禁止范围静态检查：`AgentGraphFactory` 等 4 文件 git diff 为空、V19-V24 git diff 为空、前端零改动、pom.xml 零改动、权限码仍 3 枚（未新增第 4 枚） | git diff + grep 输出附于回执 |

## §14 执行顺序

1. §5 V1：现场复核 Flyway 最大版本号
2. V25 双 dialect 脚本 → §5 V2 RunScript 双链实测
3. 图模型 DTO（`dto/graph/ProcessGraph` + `GraphElement`）→ 实体 `AgentGraphDef` → Mapper → DTO（`AgentGraphDefDTO`/`AgentGraphCreateReqDTO`）
4. `AgentGraphDefServiceImpl`（create/saveDraftGraph/getGraph/pageDefs/delete/publish）→ `AgentGraphDefService` 接口 → Controller
5. §5 V3/V4：测试类 DDL 对齐 + ObjectMapper 装配确认
6. 单测：ServiceImpl 13 用例 → Controller 8 用例
7. sw-basic-agent 模块 `mvn test` → 全量 `mvn test`，确认 ≥ 341 + 新增，0 failures
8. 静态检查（验收 14 各项 git diff/grep）
9. 回执写入 `receipts/step-7-{execution,test}.md`；方案归档 `ready/` → `passed/`；memory 三件套更新；`knowledge/known-issues.md` I13 按 Step6 §5 建议文案更新
10. 双仓库提交（严禁 Co-Authored-By 尾行）

## §15 展望（仅记录，不实现）

Step8（图解释执行引擎）将消费本表 `graph_json`：按 elements 顺序/条件边解释执行；届时发布版本号成为执行引用的稳定锚点；完整拓扑校验（START/END/边引用）与执行语义一起落地。历史版本内容回溯（快照表）与并行/循环节点语义已在 Step6 §3 推入 todo，本 Step 不触碰。
