# Step 3 执行方案：工具沙箱（内部方法调用 + 外部 HTTP 调用）

**状态**：Ready — 待执行  
**前置**：Step2 PASSED（D55），基线 291 tests（D57）  
**范围依据**：D48（工具沙箱两类）  
**前置调研**：`search_fallback/m07-step3-toolsandbox-precedent.md`（D_Step3Research，证据完整）  
**推荐执行模型**：`deepseek/deepseek-v4-pro`（工具调用 API 语义理解 + 反射调用 + agentic loop wiring）  
**回执位置**：`product/agent-model-orchestration/receipts/step-3-{execution,test}.md`

---

## §1 背景与目标

Step2 交付了最小单节点 LangGraph4j 图：`AgentGraphFactory` 内 `callModel` 节点调用 `chatModel.call(new Prompt(input))`，`AgentOrchestrationServiceImpl` 负责 bind/invoke/clear ChatModel ThreadLocal 生命周期。

Step3 落地 D48 定义的**工具沙箱**——两类白名单工具调用：

- **内部工具（internal）**：通过 DB 白名单表指定 Spring bean 名称 + 方法名，运行时反射调用；调用方（LLM）只能触发白名单内的 bean/method，禁止任意 bean 访问（=禁 RCE）。
- **外部工具（external）**：通过 DB 白名单表指定 URL + HTTP method，运行时用 RestClient 发起请求；LLM 只能调用白名单内的 URL，禁止任意 URL（=禁 SSRF）。

两类工具均由**管理员写入 DB 白名单表**，用户（LLM 调用方）不可在运行时添加新条目。

---

## §2 前置调研关键发现（方案依据）

以下结论均来自 `search_fallback/m07-step3-toolsandbox-precedent.md` 的 jar 级/行号级证据：

| 发现 | 影响 |
|---|---|
| LangGraph4j 1.5.14 **无任何 ToolNode/工具类**（`jar tf \| grep -i tool` 空输出）| 图拓扑**无需改变**；tool_calls 往返在 ChatModel 层处理，不在图层 |
| `OpenAiChatModel.internalCall` 字节码：调用 `ToolCallingManager.executeToolCalls()`，若非 returnDirect 则递归调自身 | **agentic loop 内建于 ChatModel.call()**，ServiceImpl 不需要自写循环 |
| `ToolCallingChatOptions.setToolCallbacks(List<ToolCallback>)` 存在；`OpenAiChatOptions`/`OllamaOptions` 均实现该接口 | 工具列表经 `new Prompt(messages, options)` 传入，每次调用可携带不同工具集 |
| `FunctionToolCallback.builder(String name, Function<I,O>).description().inputSchema().build()` | 两类工具统一用 FunctionToolCallback + lambda，不需要 `@Tool` 注解 |
| `ToolDefinition`: `name()`/`description()`/`inputSchema()`（JSON Schema 字符串） | 工具定义三字段均存 DB，不在代码里硬编 |
| `Prompt` 构造函数**无工具参数重载**（javap 8 个构造器全部无工具参数）| 工具必须经 `ChatOptions`（`ToolCallingChatOptions`）传入 |
| SwJobBean 安全模型：`@Autowired Map<String,JobHandler>` 接口类型约束，**无额外白名单机制** | 本 Step 内部工具安全边界：DB 白名单表（beanName+methodName）作为唯一控制，runtime 验白名单后再反射 |
| `AgentModelConfigServiceImpl.testConnection()`：`RestClient` + `SimpleClientHttpRequestFactory`，超时硬编码 5s；`ChatModelFactory.buildRestClientBuilder()`：超时从 DB `timeoutSeconds` 字段读 | 外部工具超时从 DB 读（参照 ChatModelFactory 模式），不硬编码 |
| JSON 大字段规范：H2 用 `CLOB`，PG 用 `TEXT`；小字段（JSON 短字符串）两者均 `TEXT` | Step3 建表 `input_schema`（JSON Schema 字符串，可能较长）：H2=CLOB、PG=TEXT |

---

## §3 范围裁定

### 本 Step 包含

1. **DB 白名单表**：`sw_agent_tool_internal`（内部工具）+ `sw_agent_tool_external`（外部工具），Flyway V20
2. **Entity + Mapper**：两张表的 MyBatis entity/mapper
3. **AgentToolCallbackFactory**：从 DB 加载两类工具配置，构造 `FunctionToolCallback` 列表
4. **管理 CRUD 接口**：AgentToolConfigService + AgentToolConfigController（内部+外部工具的增删改查）
5. **编排服务改造**：`AgentOrchestrationServiceImpl.invoke()` 加载工具 → 传入图调用；`AgentGraphFactory.callModel` 节点支持携带工具选项
6. **单元测试**：Service 层 + Factory 层 + Controller 层，覆盖工具构造逻辑与 CRUD

### 本 Step 不包含

- **Agent Model ↔ Tool 多对多关联表**（按模型分配工具集，留后续步骤）——本 Step 加载该 tenant 下所有 `enabled=1` 的工具
- **前端管理页面**（工具配置 UI，留后续步骤）
- **RAG / 知识库工具**（D49 推迟）
- **工具调用历史持久化**（留 M07-F04 会话模块）
- **工具调用参数校验（JSON Schema 运行时校验）**——DB 存储 schema 字符串，传给 LLM 做参数生成引导，不在 Java 侧做 schema 校验

---

## §4 数据库迁移（Flyway V20）

### V20 两张表规格

**`sw_agent_tool_internal`（内部工具白名单）**

| 字段 | H2 类型 | PG 类型 | 约束 | 备注 |
|---|---|---|---|---|
| id | BIGINT | BIGINT | NOT NULL PK | 雪花 ID |
| name | VARCHAR(100) | VARCHAR(100) | NOT NULL | 工具名（英文下划线），传给 LLM |
| description | VARCHAR(500) | VARCHAR(500) | NOT NULL | 工具描述，传给 LLM |
| input_schema | CLOB | TEXT | nullable | JSON Schema 字符串，描述入参结构 |
| bean_name | VARCHAR(100) | VARCHAR(100) | NOT NULL | Spring bean 名称（白名单值） |
| method_name | VARCHAR(100) | VARCHAR(100) | NOT NULL | 方法名（白名单值，约定签名 String→String） |
| enabled | SMALLINT | SMALLINT | NOT NULL DEFAULT 1 | 1=启用 0=禁用 |
| remark | VARCHAR(500) | VARCHAR(500) | nullable | 备注 |
| create_time/create_by/update_time/update_by | TIMESTAMP/VARCHAR(64) | 同左 | nullable | 审计字段 |
| deleted | SMALLINT | SMALLINT | NOT NULL DEFAULT 0 | 逻辑删除 |
| tenant_id | BIGINT | BIGINT | NOT NULL DEFAULT 0 | 租户 |
| version | BIGINT | BIGINT | NOT NULL DEFAULT 0 | 乐观锁 |

**`sw_agent_tool_external`（外部 HTTP 工具白名单）**

| 字段 | H2 类型 | PG 类型 | 约束 | 备注 |
|---|---|---|---|---|
| id | BIGINT | BIGINT | NOT NULL PK | 雪花 ID |
| name | VARCHAR(100) | VARCHAR(100) | NOT NULL | 工具名 |
| description | VARCHAR(500) | VARCHAR(500) | NOT NULL | 工具描述 |
| input_schema | CLOB | TEXT | nullable | JSON Schema 字符串 |
| url | VARCHAR(500) | VARCHAR(500) | NOT NULL | 白名单 URL（完整 URL，含路径） |
| http_method | VARCHAR(10) | VARCHAR(10) | NOT NULL DEFAULT 'POST' | GET/POST/PUT |
| timeout_seconds | INT | INT | NOT NULL DEFAULT 30 | 超时（参照 ChatModelFactory 模式从 DB 读） |
| enabled | SMALLINT | SMALLINT | NOT NULL DEFAULT 1 | 1=启用 |
| remark | VARCHAR(500) | VARCHAR(500) | nullable | |
| create_time/create_by/update_time/update_by | 同上 | 同上 | nullable | |
| deleted | SMALLINT | SMALLINT | NOT NULL DEFAULT 0 | |
| tenant_id | BIGINT | BIGINT | NOT NULL DEFAULT 0 | |
| version | BIGINT | BIGINT | NOT NULL DEFAULT 0 | |

**文件路径**：
- `sw-bootstrap/src/main/resources/db/migration/agent/h2/V20__init_agent_tool_config.sql`
- `sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V20__init_agent_tool_config.sql`

**现场验证**：执行前先确认 V20 未被其他模块占用（`find sw-bootstrap/src/main/resources/db -name "V20__*.sql" 2>/dev/null`），若已存在则改用下一可用版本号。

---

## §5 Entity + Mapper

**包路径**：`com.sw.ck.agent.entity.tool`（entity）、`com.sw.ck.agent.mapper.tool`（mapper）

**Entity 规格**（参照仓库已有 `AgentModelConfig.java` 风格）：
- `AgentToolInternalConfig.java`：字段与 §4 表字段一一对应，使用 `@TableId`/`@TableField`/`@TableLogic` 等 MyBatis-Plus 注解（与 `AgentModelConfig` 保持一致）
- `AgentToolExternalConfig.java`：同上

**Mapper**：
- `AgentToolInternalConfigMapper.java`：`extends BaseMapper<AgentToolInternalConfig>`
- `AgentToolExternalConfigMapper.java`：`extends BaseMapper<AgentToolExternalConfig>`
- Mapper XML：仅在需要自定义 SQL 时创建，简单 CRUD 靠 MyBatis-Plus 即可

---

## §6 工具回调工厂（AgentToolCallbackFactory）

**文件**：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentToolCallbackFactory.java`

**职责**：从 DB 加载启用工具 → 构造 `ToolCallback` 列表。两类工具统一用 `FunctionToolCallback`（不用 `MethodToolCallback`，原因：`FunctionToolCallback.builder(String name, Function<I,O>)` lambda 路径更简洁，签名由调研 §2.3 确认）。

### 6.1 内部工具构造逻辑

```
// 伪代码（执行层按真实签名实现）
for AgentToolInternalConfig config : internalConfigs:
    ToolCallback cb = FunctionToolCallback
        .builder(config.getName(), (String jsonArgs) -> {
            // 安全检查：config 来自 DB 白名单，不接受外部传入的 beanName
            Object bean = applicationContext.getBean(config.getBeanName());
            Method method = bean.getClass().getMethod(config.getMethodName(), String.class);
            // 约定：白名单方法签名 = String execute(String params)
            // 若实际方法签名与约定不符，抛出 IllegalStateException（禁止静默失败）
            return (String) method.invoke(bean, jsonArgs);
        })
        .description(config.getDescription())
        .inputSchema(config.getInputSchema())   // 可为 null，传 null 时 FunctionToolCallback 使用空 schema
        .inputType(String.class)
        .build();
```

**安全边界说明**：
- `config.getBeanName()`/`config.getMethodName()` 均来自 DB 白名单表，**不来自 LLM 输出或用户请求**
- LLM 侧的 tool_calls 只携带 `name`（工具名）和 `jsonArgs`，不携带 beanName/methodName
- 工具名 → (beanName, methodName) 的映射在 `AgentToolCallbackFactory` 内，LLM 无法影响
- 若方法不存在（配置错误），`NoSuchMethodException` 在工厂构造阶段即抛出（fail-fast），不等到 LLM 调用时再暴露

**现场验证**：
1. `FunctionToolCallback.builder(String, Function<I,O>)` 的泛型参数推导：`I=String, O=String`，`inputType(String.class)` 与 `Function<String,String>` 组合时是否需要显式 cast，执行层现场 spike 验证（`build()` 后调用 `cb.call("{}")` 确认无 ClassCastException）
2. `inputSchema` 为 `null` 时 `FunctionToolCallback` 行为：是否允许 null 还是会 NPE——若不允许，替换为空 JSON Schema `"{}"`

### 6.2 外部工具构造逻辑

```
// 伪代码
for AgentToolExternalConfig config : externalConfigs:
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(config.getTimeoutSeconds()));
    factory.setReadTimeout(Duration.ofSeconds(config.getTimeoutSeconds()));
    RestClient restClient = RestClient.builder()
        .requestFactory(factory)
        .build();

    ToolCallback cb = FunctionToolCallback
        .builder(config.getName(), (String jsonArgs) -> {
            return restClient
                .method(HttpMethod.valueOf(config.getHttpMethod()))
                .uri(config.getUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .body(jsonArgs)
                .retrieve()
                .body(String.class);
        })
        .description(config.getDescription())
        .inputSchema(config.getInputSchema())
        .inputType(String.class)
        .build();
```

**现场验证**：
- `RestClient.method(HttpMethod.GET)` 时 `.body(jsonArgs)` 是否被框架忽略（GET 通常无 body）——若报错，GET 时改用 `.uri(uriBuilder -> uriBuilder.path(url).queryParam("args", jsonArgs).build())` 或直接不传 body（根据实际 RestClient API 决定）
- `ResourceAccessException`（网络错误）在 lambda 内是否需要捕获并包装为可被 `ToolExecutionExceptionProcessor` 处理的格式——执行层确认 Spring AI 的默认 `ToolExecutionExceptionProcessor` 行为

---

## §7 管理 CRUD 接口

### 7.1 Service 层

**文件**：
- `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/AgentToolConfigService.java`（接口）
- `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentToolConfigServiceImpl.java`

**接口方法**（内部+外部工具各一组）：
```java
// 内部工具
PageResult<AgentToolInternalConfigVO> pageInternalTools(AgentToolInternalConfigQuery query);
AgentToolInternalConfigVO getInternalTool(Long id);
Long createInternalTool(AgentToolInternalConfigDTO dto);
void updateInternalTool(Long id, AgentToolInternalConfigDTO dto);
void deleteInternalTool(Long id);
void toggleInternalTool(Long id, boolean enabled);

// 外部工具（同结构）
PageResult<AgentToolExternalConfigVO> pageExternalTools(...);
AgentToolExternalConfigVO getExternalTool(Long id);
Long createExternalTool(AgentToolExternalConfigDTO dto);
void updateExternalTool(Long id, AgentToolExternalConfigDTO dto);
void deleteExternalTool(Long id);
void toggleExternalTool(Long id, boolean enabled);
```

**工厂侧查询**（由 `AgentToolCallbackFactory` 调用）：
```java
List<AgentToolInternalConfig> listEnabledInternalTools(Long tenantId);
List<AgentToolExternalConfig> listEnabledExternalTools(Long tenantId);
```

### 7.2 Controller 层

**文件**：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentToolConfigController.java`

**路由前缀**：`/agent/tool`

**权限码**（参照 D51 三段拆分模式）：
- `agent:tool:view`（列表/详情）
- `agent:tool:manage`（增删改）

**接口列表**：
- `GET /agent/tool/internal` → 分页列表
- `GET /agent/tool/internal/{id}` → 详情
- `POST /agent/tool/internal` → 新建
- `PUT /agent/tool/internal/{id}` → 修改
- `DELETE /agent/tool/internal/{id}` → 删除
- `PUT /agent/tool/internal/{id}/toggle` → 启用/禁用
- 外部工具：`/agent/tool/external/**`（同结构）

**不包含**：testConnection 端点（外部工具的连通性测试留后续，本 Step 不引入）

---

## §8 编排服务改造

### 8.1 AgentToolCallbackFactory 加载时机

**不做启动时全量缓存**——工具配置可能频繁变更，每次 orchestration 调用时加载（DB 层已有 MyBatis-Plus 缓存支持）。若后续发现性能问题，缓存层作为独立优化点。

### 8.2 AgentOrchestrationServiceImpl 改造

`invoke(AgentOrchestrationRequest request)` 方法增加：

```
// 伪代码
List<ToolCallback> tools = agentToolCallbackFactory.buildToolCallbacks(request.getTenantId());
// 无工具时跳过，不修改 Prompt 构造
if (!tools.isEmpty()) {
    AgentGraphFactory.bindTools(tools);  // 新增 ThreadLocal
}
try {
    result = compiledGraph.invoke(state);
} finally {
    AgentGraphFactory.clearTools();  // 新增清除
}
```

### 8.3 AgentGraphFactory 改造

**新增 ThreadLocal**（与现有 `chatModelHolder` 同级）：
```java
private static final ThreadLocal<List<ToolCallback>> toolCallbacksHolder = new ThreadLocal<>();
```

**新增方法**：
```java
static void bindTools(List<ToolCallback> tools) { toolCallbacksHolder.set(tools); }
static void clearTools() { toolCallbacksHolder.remove(); }
```

**callModel 节点改造**：
```java
// 原：chatModel.call(new Prompt(input))
// 改为：
List<ToolCallback> tools = toolCallbacksHolder.get();
Prompt prompt;
if (tools != null && !tools.isEmpty()) {
    // ToolCallingChatOptions 构造（具体 builder 方法名现场 javap 确认，见 §9）
    ToolCallingChatOptions options = ... ;
    prompt = new Prompt(input, options);
} else {
    prompt = new Prompt(input);
}
chatModel.call(prompt);
```

**无工具时行为不变**（兼容性保证，Step2 产出测试全部继续通过）。

---

## §9 现场验证清单（禁止凑造）

执行层必须在实现前 spike 验证以下内容，验证结果写入回执 §3"现场验证结果"，不得以记忆补填：

1. **ToolCallingChatOptions builder 完整 fluent API**：`javap -p org.springframework.ai.model.tool.DefaultToolCallingChatOptions\$Builder`，确认 `toolCallbacks(List<ToolCallback>)`/`toolCallback(ToolCallback...)` 方法名；当前知道 `setToolCallbacks(List)` 是 setter，但 builder 方法名未经 javap 确认

2. **ToolExecutionEligibilityPredicate 默认行为**：`spring-ai-autoconfigure-model-tool-1.0.4.jar` 中 `AutoConfiguredToolCallingManager`（或类似类）是否检查 `internalToolExecutionEnabled`；具体判定——若 `internalToolExecutionEnabled` 未显式设为 `true`，tool_calls 是否仍自动执行？给出 javap 或 grep 证据

3. **V20 版本号冲突检查**：`find sw-bootstrap/src/main/resources/db -name "V20__*.sql" 2>/dev/null`——若已存在，改用下一可用号

4. **`FunctionToolCallback.builder` 泛型 + `inputSchema` null 行为**：`FunctionToolCallback.builder("test", (String s) -> s).inputType(String.class).build().call("{}")` spike 通过，`inputSchema(null)` 不 NPE（或改传 `"{}"`）

5. **RestClient GET 请求 body 处理**：`RestClient.method(HttpMethod.GET).body(...)` 是否报错——若报错，GET 时省略 body 调用

6. **Flyway 路径扫描配置**：确认 `sw-bootstrap` 的 `spring.flyway.locations` 已包含 `classpath:db/migration/agent/**`（Step1 V19 已成功，预期无问题，但需确认多 location 配置方式支持子目录匹配）

---

## §10 新建文件清单

### 生产代码（12 个新文件）

| 文件 | 模块 |
|---|---|
| `entity/tool/AgentToolInternalConfig.java` | sw-basic-agent |
| `entity/tool/AgentToolExternalConfig.java` | sw-basic-agent |
| `mapper/tool/AgentToolInternalConfigMapper.java` | sw-basic-agent |
| `mapper/tool/AgentToolExternalConfigMapper.java` | sw-basic-agent |
| `service/AgentToolConfigService.java` | sw-basic-agent |
| `service/impl/AgentToolConfigServiceImpl.java` | sw-basic-agent |
| `orchestration/AgentToolCallbackFactory.java` | sw-basic-agent |
| `controller/AgentToolConfigController.java` | sw-basic-agent |
| `h2/V20__init_agent_tool_config.sql` | sw-bootstrap |
| `postgresql/V20__init_agent_tool_config.sql` | sw-bootstrap |

### 修改文件（2 个）

| 文件 | 修改点 |
|---|---|
| `orchestration/AgentGraphFactory.java` | 新增 toolCallbacksHolder ThreadLocal + bindTools/clearTools + callModel 节点改造 |
| `service/impl/AgentOrchestrationServiceImpl.java` | invoke() 加载工具 + bind/clear ThreadLocal |

### 测试代码（3 个新文件）

| 文件 | 测试内容 |
|---|---|
| `service/impl/AgentToolConfigServiceImplTest.java` | 内部/外部工具 CRUD（H2 集成测试，参照 `AgentModelConfigServiceImplTest` 风格）|
| `orchestration/AgentToolCallbackFactoryTest.java` | 工具回调构造逻辑（mock ApplicationContext，验证 FunctionToolCallback name/description/inputSchema 正确传入；验证异常情况：beanName 不存在、methodName 不存在）|
| `controller/AgentToolConfigControllerTest.java` | 权限码校验 + CRUD 端点（mock Service，参照 `AgentModelControllerTest` 风格）|

**目标新增测试数**：约 +15（ServiceImpl 6~8 + Factory 4~5 + Controller 3~4）  
**预期全量测试通过数**：291 + 15 ≈ 306（±2）

---

## §11 禁止范围

- **不得**引入 `@Tool` 注解用法（方案全程用 `FunctionToolCallback.builder()` lambda 路径，D54 已确认仓库零 `@Tool` 使用，本 Step 维持零使用）
- **不得**在 LangGraph4j 图层添加 ToolNode 或条件边（ChatModel 层已内建 loop，图拓扑无需改变；若 spike §9 第 2 项发现 `internalToolExecutionEnabled` 必须显式设置才触发循环，通过 options builder 设置，仍不改图）
- **不得**在 ServiceImpl 自写 tool-call agentic loop（ChatModel.call() 内部已处理，见 §2 字节码证据）
- **不得**接受运行时用户传入 beanName/methodName——只能传 tool 名称（即 `AgentToolInternalConfig.name`），工厂内部完成名称→(beanName,methodName) 映射
- **不得**新增 pom 依赖（Spring AI tool 类全套在 `spring-ai-model-1.0.4.jar` + `spring-ai-autoconfigure-model-tool-1.0.4.jar`，均已存在，D54 已确认；RestClient 在 spring-web，已有）
- **不得**修改 LangGraph4j 图序列化逻辑（`SparseStateSerializer`）——tools ThreadLocal 不经过 state，无序列化需求
- **前端零改动**（本 Step 无 UI，CRUD 通过后端 API 操作）

---

## §12 验收标准

执行回执须逐项对照原文提供可追溯证据：

| # | 验收项 | 期望结果 |
|---|---|---|
| 1 | Flyway 迁移：V20 两张表（h2+pg）在 `mvn test` Spring 启动时自动建表 | 无 `FlywayException`；H2 测试环境 `sw_agent_tool_internal`/`sw_agent_tool_external` 表存在 |
| 2 | `AgentToolConfigServiceImpl` CRUD：内部工具创建/查询/更新/删除/启用禁用 | 6 个方法各有单元测试，H2 环境全绿 |
| 3 | `AgentToolConfigServiceImpl` CRUD：外部工具同上 | 同上 |
| 4 | `AgentToolCallbackFactory`：内部工具 FunctionToolCallback 构造正确 | 单元测试：mock ApplicationContext 返回 mock bean，工厂构造的 `cb.getToolDefinition().name()` = `config.getName()`，`cb.getToolDefinition().description()` = `config.getDescription()`，`cb.call("{}")` 调用链路走到 mock bean 方法 |
| 5 | `AgentToolCallbackFactory`：外部工具 FunctionToolCallback 构造正确 | 单元测试：mock RestClient/server，`cb.getToolDefinition().name()` 正确，超时从 `config.getTimeoutSeconds()` 读（connectTimeout + readTimeout 均等于配置值） |
| 6 | `AgentToolCallbackFactory`：beanName 不在 ApplicationContext 中时 fail-fast | 工厂构造阶段抛出 `NoSuchBeanDefinitionException` 或自定义异常（不等到 LLM 调用时才报错）|
| 7 | `AgentToolCallbackFactory`：methodName 不存在时 fail-fast | 抛出 `NoSuchMethodException` 或自定义异常 |
| 8 | `AgentGraphFactory` 改造：无工具时行为与 Step2 一致（向后兼容） | 现有 Step2 单测全部通过，无回归 |
| 9 | `AgentGraphFactory` 改造：有工具时 callModel 节点构造 Prompt 携带 ToolCallingChatOptions | 单元测试或 spike：传入 1 个 mock ToolCallback，`Prompt.getOptions()` instanceof `ToolCallingChatOptions`，`getToolCallbacks()` 包含该 callback |
| 10 | `AgentOrchestrationServiceImpl` 改造：bind/clear 对称（无内存泄漏） | 单元测试：正常完成 + 异常完成（invoke 抛异常时）均触发 `clearTools()`（finally 保证） |
| 11 | 权限码 `agent:tool:view` / `agent:tool:manage` 正确约束 CRUD 端点 | Controller 测试：无权限时返回 403，有权限时返回 200 |
| 12 | **§9 现场验证全部写入回执**：5 项均给出 javap 原始输出片段或 grep 命令输出，无一项标注"未验证/待确认" | 回执 §3 包含 5 个子节，每节有具体证据 |
| 13 | 全量回归测试通过：`mvn test`（主树，排除 `.claude/worktrees/`）≥ 306（291 + ~15 新增），0 failures / 0 errors | 回执报告主树新鲜报告数字；逐模块表格中 `sw-basic/sw-basic-agent` 报告数较 Step2（6 报告）增加 3 个（对应 3 个新测试文件），其余模块不变 |
| 14 | 回执§7"禁止范围核查"：零 `@Tool` 注解用法；零 agentic loop 自写；零新增 pom 依赖；零 LangGraph4j 图拓扑改动 | `grep -r "@Tool" sw-basic-agent/src/main/java` 0 命中；回执明确声明无新依赖 |

---

## §13 执行顺序建议

1. **§9 现场验证**（先做，不超过 30 分钟）：主要是 ToolCallingChatOptions builder javap + ToolExecutionEligibilityPredicate 行为 + V20 冲突检查。把不确定项排清后再动代码。
2. **§4 DB 迁移脚本**：先写 SQL，本地 `mvn test` 确认建表成功（Spring 上下文能启动）。
3. **§5 Entity + Mapper**：基础设施层。
4. **§6 AgentToolCallbackFactory**：核心逻辑，先写 + 先测（§10 Factory 单测），验证 FunctionToolCallback 构造链路正确。
5. **§7 Service + Controller**：CRUD 实现 + 单测。
6. **§8 编排改造**：最后改，确保向后兼容（先跑现有 Step2 单测，确认通过后再提交）。
7. 全量 `mvn test` 验收。
