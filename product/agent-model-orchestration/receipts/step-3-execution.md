# 执行回执

## 1. Step 编号和名称

**M07 Step 3：工具沙箱（内部方法调用 + 外部 HTTP 调用）**

- 功能：agent-model-orchestration（D48 工具沙箱两类：内部工具 + 外部工具，DB 白名单表驱动）
- 方案文件：`product/agent-model-orchestration/ready/step-3-toolsandbox.md`（§1-§13 全部 13 节，唯一权威任务定义）
- 任务来源：执行层任务指令（先 §9 现场验证 → §4 SQL → §5 Entity/Mapper → §6 工厂先写先测 → §7 Service/Controller → §8 编排改造 → 全量测试）
- 前置调研：`search_fallback/m07-step3-toolsandbox-precedent.md`（D_Step3Research，jar 级/行号级证据）
- 上一步回执：`product/agent-model-orchestration/receipts/step-2-execution.md` + `step-2-test.md`（回执格式与验收惯例参照）
- 测试基线口径：`search_fallback/m07-baseline-recount.md`（主树新鲜报告 291 = 10 模块 69 报告；历史 494 混入工作树 203 陈旧报告）
- **执行时间**：2026-08-09（§9 现场验证 18:00-18:11；编码 18:11-18:19；全量测试 18:19:34 启动，18:28:57 完成）
- **改动文件清单（实际）**：新建 14 生产 + 3 测试（方案 §10 标题"12 个新文件"与表格 10 行不符，按接口签名补足 DTO/Query×4，见 §4）+ 修改 2（AgentGraphFactory / AgentOrchestrationServiceImpl）+ 本回执

## 2. 使用模型

- 执行模型：deepseek-v4-flash（本会话实际执行；方案推荐 v4-pro，执行层按用户成本优化选择 flash）
- 现场验证 §9 六项全部真实执行（javap / grep / spike 编译运行），无一项以训练记忆补填

## 3. 现场验证结果（方案 §9 六项，全部真实执行）

### §3.1 ToolCallingChatOptions builder 完整 fluent API（方案 §9.1）

m2 定位：`~/.m2/repository/org/springframework/ai/spring-ai-model/1.0.4/spring-ai-model-1.0.4.jar` 内
`org/springframework/ai/model/tool/DefaultToolCallingChatOptions$Builder.class`（`jar tf` 确认）。

`javap -p` 原始输出（节选，工具相关方法）：

```
public class org.springframework.ai.model.tool.DefaultToolCallingChatOptions$Builder implements org.springframework.ai.model.tool.ToolCallingChatOptions$Builder {
  public org.springframework.ai.model.tool.ToolCallingChatOptions$Builder toolCallbacks(java.util.List<org.springframework.ai.tool.ToolCallback>);
  public org.springframework.ai.model.tool.ToolCallingChatOptions$Builder toolCallbacks(org.springframework.ai.tool.ToolCallback...);
  public org.springframework.ai.model.tool.ToolCallingChatOptions$Builder toolNames(java.util.Set<java.lang.String>);
  public org.springframework.ai.model.tool.ToolCallingChatOptions$Builder toolNames(java.lang.String...);
  public org.springframework.ai.model.tool.ToolCallingChatOptions$Builder toolContext(java.util.Map<java.lang.String, java.lang.Object>);
  public org.springframework.ai.model.tool.ToolCallingChatOptions$Builder internalToolExecutionEnabled(java.lang.Boolean);
  public org.springframework.ai.model.tool.ToolCallingChatOptions$Builder model(java.lang.String);
  ...
  public org.springframework.ai.model.tool.DefaultToolCallingChatOptions build();
}
```

**实测结论（与方案 §9.1 描述有出入，以实测为准）**：
- builder 方法名确认为 `toolCallbacks(List<ToolCallback>)` 与 `toolCallbacks(ToolCallback...)`（varargs）——
  **不存在**方案推测的 `toolCallback(ToolCallback...)` 单数方法名；
- `ToolCallingChatOptions.builder()`（接口静态方法）与 `DefaultToolCallingChatOptions.builder()` 均可用，
  代码使用 `ToolCallingChatOptions.builder().toolCallbacks(tools).build()`；
- 附带确认 `ToolCallingChatOptions` 接口含静态方法 `isInternalToolExecutionEnabled(ChatOptions)` 与
  `mergeToolCallbacks(...)`（§3.2 依赖）。

### §3.2 ToolExecutionEligibilityPredicate 默认行为（方案 §9.2）

`spring-ai-autoconfigure-model-tool-1.0.4.jar` 类清单（`jar tf | grep -iE "tool|eligib"`）：

```
org/springframework/ai/model/tool/autoconfigure/ToolCallingProperties.class
org/springframework/ai/model/tool/autoconfigure/ToolCallingAutoConfiguration.class
```

**方案提到的 `AutoConfiguredToolCallingManager` 类不存在**——自动装配类是 `ToolCallingAutoConfiguration`，
其 `@Bean` 方法：`toolCallbackResolver` / `toolExecutionExceptionProcessor` / `toolCallingManager` /
`toolCallingContentObservationFilter`（javap 方法清单确认）。默认 predicate 在
`spring-ai-model-1.0.4.jar` 中：`DefaultToolExecutionEligibilityPredicate`，且
`OpenAiChatModel$Builder` 两个构造分支均以 `new DefaultToolExecutionEligibilityPredicate()` 为默认
（javap 字节码：`30: new #47 // class ...DefaultToolExecutionEligibilityPredicate`）。

`DefaultToolExecutionEligibilityPredicate.test()` 字节码：

```
public boolean test(org.springframework.ai.chat.prompt.ChatOptions, org.springframework.ai.chat.model.ChatResponse);
   0: aload_1
   1: invokestatic  #7   // ToolCallingChatOptions.isInternalToolExecutionEnabled:(ChatOptions;)Z
   4: ifeq          22
   7: aload_2
   ...
  11: invokevirtual #13  // ChatResponse.hasToolCalls:()Z
  15: ifeq          22
  18: iconst_1
  22: iconst_0
```

`ToolCallingChatOptions.isInternalToolExecutionEnabled` 字节码关键分支：

```
  18: aload_2
  19: invokeinterface #17  // getInternalToolExecutionEnabled:()Ljava/lang/Boolean;
  24: ifnull        43     // null → 跳到 43：iconst_1（返回 true）
  ...
  43: iconst_1
```

**实测结论**：`internalToolExecutionEnabled` 未显式设置（null）时 `isInternalToolExecutionEnabled` 返回
**true** → 默认 predicate 判定 `isInternalToolExecutionEnabled(options) && response.hasToolCalls()` →
**tool_calls 会自动执行**（ChatModel.call() 内建 agentic loop 直接生效），**无需在 options 中显式
设置 internalToolExecutionEnabled(true)**。另确认 `DefaultToolCallingManager.executeToolCall` 从
`Prompt.getOptions() → (ToolCallingChatOptions).getToolCallbacks()` 读取回调列表（字节码
`6: invokevirtual Prompt.getOptions / 28: invokeinterface getToolCallbacks`）——经 options 传工具是唯一入口，与前置调研 §3 一致。

### §3.3 V20 版本号冲突检查（方案 §9.3）

```
$ find /data/reasonix/files/Smart-WorkFlow/sw-bootstrap/src/main/resources/db -name "V20__*.sql"
（无输出，EXIT=0）
$ ls sw-bootstrap/src/main/resources/db/migration/agent/h2/
V19__init_agent_model_config.sql
$ ls sw-bootstrap/src/main/resources/db/migration/agent/postgresql/
V19__init_agent_model_config.sql
```

**实测结论**：V20 未被占用，两目录均仅 V19——使用 V20 版本号（h2 + postgresql 各一个文件）。

### §3.4 FunctionToolCallback.builder 泛型 + inputSchema null 行为（方案 §9.4）

真实 spike（`/tmp/toolspike`，javac + java 编译运行，类路径 = m2 内 spring-ai-model 1.0.4 +
spring-ai-commons + spring-core + spring-web + jackson + victools jsonschema + swagger-annotations +
classmate + micrometer 等实依赖），运行输出（摘录）：

```
== 9.4a: FunctionToolCallback.builder("test", (String s)->s).inputType(String.class) ==
build OK; name=test
generated schema (inputSchema not set): {
  "$schema" : "https://json-schema.org/draft/2020-12/schema",
  "type" : "string",
  "additionalProperties" : false
}
call("\"hello\"") = ["echo:hello"]  <-- JSON string literal works
call("{}") THREW: java.lang.IllegalStateException -> Conversion from JSON to java.lang.String failed
ClassCastException thrown by call("{}")? false
== 9.4b: inputSchema(null) ==
inputSchema(null) build OK, schema={... "type" : "string" ...}, call=[""ok""]
== 9.4c: no inputType ==
no-inputType THREW: java.lang.IllegalArgumentException: inputType cannot be null
```

`FunctionToolCallback.call()` 字节码确认解析路径：`Assert.hasText(toolInput)` →
`JsonParser.fromJson(toolInput, toolInputType)`（I=String 时要求 arguments 为 JSON 字符串字面量）→
`callMethod(...)` → `toolCallResultConverter.convert(...)`。`Builder.build()` 字节码确认：
`Assert.notNull(inputType)`（**inputType 必填**）；`inputSchema` 经 `StringUtils.hasText` 判定，
**null 安全**（回退 `JsonSchemaGenerator.generateForType(inputType)`）。

**实测结论（与方案 §9.4 描述有出入，以实测为准）**：
- `FunctionToolCallback.builder("test", (String s) -> s).inputType(String.class).build()` 可构造，
  无显式 cast 需求（泛型推导正常）；
- `call("{}")` **不抛 ClassCastException**（方案断言成立），但**会抛 Jackson 反序列化异常**
  （`IllegalStateException: Conversion from JSON to java.lang.String failed`，根因
  MismatchedInputException）——即 I=String 时 arguments 必须是 JSON 字符串字面量，JSON 对象不匹配；
  该异常由 Spring AI 默认 ToolExecutionExceptionProcessor 转为错误消息回喂 LLM（§3.2 链），不中断整体调用；
- `inputSchema(null)` **不 NPE**（方案预案的"若 NPE 改传 '{}'"分支未触发），回退为 inputType
  生成的 `{"type":"string"}` schema——方案描述的"空 schema"实际为"生成 schema"；
- **inputType 必填**（缺省抛 IllegalArgumentException "inputType cannot be null"），实现中恒定传 `String.class`。

### §3.5 RestClient GET 带 body 行为（方案 §9.5）

真实 spike（JDK HttpServer 回显 + RestClient.method(GET).body(...)），运行输出：

```
== 9.5: RestClient.method(GET).body(...) ==
server started on port 41913
rest client built
SERVER saw: GET /echo
GET-with-body OK, resp=[pong]
done
```

**实测结论**：`RestClient.method(HttpMethod.GET).body(jsonArgs)` **不报错**，请求正常发出（服务端看到
普通 GET，body 被 SimpleClientHttpRequestFactory 静默忽略）——方案预案"若报错则 GET 省略 body"分支
**未触发**，实现统一携带 body（GET/POST/PUT 同构，代码注释引用本节实测）。

### §3.6 Flyway locations 配置确认（方案 §9.6）

`sw-bootstrap/src/main/resources/application.yml` 第 51-64 行：

```yaml
  flyway:
    enabled: true
    locations:
      - classpath:db/migration/{vendor}
      - classpath:db/migration/bpm/{vendor}
      ...
      - classpath:db/migration/agent/{vendor}        # ← 第 60 行，{vendor} 解析为 h2 / postgresql 子目录
    baseline-on-migrate: true
    validate-on-migrate: true
```

**实测结论**：`spring.flyway.locations` 已含 `classpath:db/migration/agent/{vendor}`（多 location
列表形式，`{vendor}` 占位符按 DataSource 驱动解析为 `h2`/`postgresql` 子目录）——V20 放
`db/migration/agent/h2/` 与 `db/migration/agent/postgresql/` 会被 Flyway 自动扫描。Step1 V19 成功
证据链：V19 双脚本在位（§3.3 ls 输出）+ Step1/Step2 回执（H2 测试环境按 V19 DDL 建表全部成功，
"Step1 遗留 V19 双脚本"）。本 Step 另做 V20 双脚本真实执行验证（见 §4.1）。

## 4. 实际修改的文件

**新建（14 个生产代码 + 3 个测试 = 17 个）**：

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-bootstrap/.../db/migration/agent/h2/V20__init_agent_tool_config.sql` | §4 表规格：内部+外部两张白名单表 |
| 2 | `sw-bootstrap/.../db/migration/agent/postgresql/V20__init_agent_tool_config.sql` | 同上（input_schema=TEXT + COMMENT ON，参照 V19 PG 风格） |
| 3 | `sw-basic-agent/.../entity/tool/AgentToolInternalConfig.java` | entity（@TableName + BaseEntity，风格对齐 AgentModelConfig） |
| 4 | `sw-basic-agent/.../entity/tool/AgentToolExternalConfig.java` | entity |
| 5 | `sw-basic-agent/.../mapper/tool/AgentToolInternalConfigMapper.java` | extends BaseMapper |
| 6 | `sw-basic-agent/.../mapper/tool/AgentToolExternalConfigMapper.java` | extends BaseMapper |
| 7 | `sw-basic-agent/.../orchestration/AgentToolCallbackFactory.java` | 核心：DB 白名单 → FunctionToolCallback lambda 列表（@Component + @ConditionalOnProperty(sw.agent.enabled)） |
| 8 | `sw-basic-agent/.../service/AgentToolConfigService.java` | 接口（内部+外部各 6 CRUD + 工厂侧查询 2） |
| 9 | `sw-basic-agent/.../service/impl/AgentToolConfigServiceImpl.java` | 实现（内部基座 + 外部 mapper 组合） |
| 10 | `sw-basic-agent/.../controller/AgentToolConfigController.java` | `/agent/tool/**`，权限码 agent:tool:view / agent:tool:manage |
| 11 | `sw-basic-agent/.../dto/AgentToolInternalConfigDTO.java` | §7.1 接口签名所需（方案 §10 表格之外的补足） |
| 12 | `sw-basic-agent/.../dto/AgentToolExternalConfigDTO.java` | 同上 |
| 13 | `sw-basic-agent/.../dto/AgentToolInternalConfigQuery.java` | 分页查询（extends PageParam + nameKeyword/enabled） |
| 14 | `sw-basic-agent/.../dto/AgentToolExternalConfigQuery.java` | 同上 |
| 15 | `sw-basic-agent/src/test/.../orchestration/AgentToolCallbackFactoryTest.java` | 5 用例（纯 JUnit + mock mapper/ApplicationContext + HttpServer） |
| 16 | `sw-basic-agent/src/test/.../service/impl/AgentToolConfigServiceImplTest.java` | 7 用例（H2 集成 + 编排 bind/clear 对称） |
| 17 | `sw-basic-agent/src/test/.../controller/AgentToolConfigControllerTest.java` | 4 用例（mock Service + 真实安全链，403/200/superAdmin） |

**修改（2 个，方案 §10 修改清单）**：

| 文件 | 修改点 |
|------|--------|
| `orchestration/AgentGraphFactory.java` | 新增 `TOOL_CALLBACKS_BINDING` ThreadLocal + `bindTools`/`clearTools` 静态方法 + callModel 节点改造（有工具时 `new Prompt(input, ToolCallingChatOptions.builder().toolCallbacks(tools).build())`，无工具时 `new Prompt(input)` 行为不变） |
| `service/impl/AgentOrchestrationServiceImpl.java` | run() 加载工具（工厂可选字段注入 `@Autowired(required=false)`）→ 非空才 bindTools → finally 中 clearChatModel + clearTools 对称清除 |

**新建文件数与方案 §10 的差异（如实汇报）**：方案 §10 标题"生产代码（12 个新文件）"与表格 10 行
不一致；按 §7.1 接口签名还需 DTO×2 + Query×2，实际新建 14 个生产文件 + 3 个测试文件 = 17 个。
未触碰清单外任何文件（仅读取）。

**未改动**：pom.xml（零新增依赖——sw-basic-agent/pom.xml 的 git diff 为 Step1 遗留未提交改动：
sw-security/starter-test/h2，注释标注"M07 Step1 执行确认"）、AgentGraphAutoConfiguration、
AgentModelAutoConfiguration、前端、.claude/worktrees/（未删除/移动/清理）、未执行 git commit/push。

### §4.1 V20 脚本真实执行验证（补充，非方案必做）

两个 V20 文件用 JDBC 直连 H2（MODE=PostgreSQL）逐语句执行验证（`SqlCheck.java` spike）：

```
OK  .../h2/V20__init_agent_tool_config.sql  -> tables: SW_AGENT_TOOL_EXTERNAL SW_AGENT_TOOL_INTERNAL
     internal cols: ID,NAME,DESCRIPTION,INPUT_SCHEMA,BEAN_NAME,METHOD_NAME,ENABLED,REMARK,
                    CREATE_TIME,CREATE_BY,UPDATE_TIME,UPDATE_BY,DELETED,TENANT_ID,VERSION,
     external defaults: enabled=1 http_method=POST timeout=30 tenant=0 deleted=0 version=0
OK  .../postgresql/V20__init_agent_tool_config.sql  -> 同结构（TEXT/COMMENT ON 均被 H2 PG 模式接受）
SQL CHECK DONE
```

## 5. 每个文件的修改摘要

- **V20 H2/PG**：两张表字段严格按方案 §4 表规格（name/description/input_schema/bean_name+method_name 或 url+http_method+timeout_seconds/enabled/remark/审计/逻辑删除/tenant_id/version）；input_schema H2=CLOB、PG=TEXT（前置调研 §6.2 惯例）；索引 `idx_sw_agent_tool_{internal,external}_tenant_deleted`。
- **Entity ×2**：`@Data @EqualsAndHashCode(callSuper=true) @TableName` + BaseEntity（tenant_id 等审计字段继承），与 AgentModelConfig 注解风格一致（无多余 @TableId/@TableLogic——全局配置已覆盖 id 生成与逻辑删除）。
- **Mapper ×2**：空接口 extends BaseMapper。
- **AgentToolCallbackFactory**：`buildToolCallbacks(tenantId)` 查两张表 enabled=true（tenantId 非 null 时显式 eq，null 时由租户拦截器隔离）；内部工具 lambda：`applicationContext.getBean(beanName)`（不存在 → NoSuchBeanDefinitionException，fail-fast）→ `getClass().getMethod(methodName, String.class)`（不存在 → IllegalStateException，fail-fast）→ 返回类型非 String → IllegalStateException（签名约定 String→String）→ `method.invoke(bean, jsonArgs)`（InvocationTargetException 展开原因链）；外部工具 lambda：RestClient（SimpleClientHttpRequestFactory 超时 = timeoutSeconds 从 DB 读，参照 ChatModelFactory.buildRestClientBuilder 模式；HTTP 方法白名单 GET/POST/PUT）。两类均 `FunctionToolCallback.builder(name, lambda).description(desc).inputSchema(schema).inputType(String.class).build()`。
- **AgentToolConfigService(+Impl)**：内部+外部各 6 方法（page/get/create/update/delete/toggle）+ 工厂侧 listEnabled×2；Service 层手动校验（DTO 无 bean-validation 注解，沿用 Step1/Step2 惯例）；`PageResult.of(page.convert(...))`；逻辑删除幂等；不包含 testConnection。
- **AgentToolConfigController**：`/agent/tool/internal/**` + `/agent/tool/external/**` 各 6 端点，`@ss.hasPermi('agent:tool:view'/'agent:tool:manage')` 三段拆分（0 个合并权限码），R\<T\> 包装，toggle 走 `PUT /{id}/toggle?enabled=`.
- **AgentGraphFactory**：见 §4 修改表；SparseStateSerializer 零改动（工具不进 state，无序列化需求）。
- **AgentOrchestrationServiceImpl**：`@Autowired(required=false) AgentToolCallbackFactory` 字段注入（不新增构造参数——既有 Step2 测试直构 4 参构造不受影响，工厂未注入时 run() 行为与 Step2 完全一致）；run() 内 `tools.isEmpty()` 时跳过 bindTools，finally 恒 clearChatModel + clearTools。

## 6. 实际执行的命令

```bash
# §9 现场验证（只读 + /tmp spike）
jar tf / javap -p ~/.m2/.../spring-ai-model-1.0.4.jar org.springframework.ai.model.tool.DefaultToolCallingChatOptions\$Builder
javap -p / -c ... DefaultToolExecutionEligibilityPredicate / ToolCallingChatOptions / DefaultToolCallingManager / FunctionToolCallback / FunctionToolCallback\$Builder
javap -p -c ... 'OpenAiChatModel$Builder'   # 默认 predicate 装配点
find sw-bootstrap/src/main/resources/db -name "V20__*.sql"    # 空 → V20 可用
javac + java /tmp/toolspike/Spike.java / Spike95.java / PromptCheck.java   # §9.4/§9.5/泄漏断言前置 spike
grep -n flyway sw-bootstrap/src/main/resources/application.yml  # §9.6
# §4.1 V20 脚本验证
javac + java /tmp/toolspike/SqlCheck.java   # H2 MODE=PostgreSQL 逐语句执行两个 V20 文件
# 编码期校验门
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile          # EXIT=0
mvn -q -pl sw-basic/sw-basic-agent test                              # 改动编排前：6 报告 29 测试全绿（无回归）
mvn -q -pl sw-basic/sw-basic-agent test                              # 改动编排后：9 报告 45 测试全绿
# 全量验收
mvn test   # 启动时刻 2026-08-09 18:19:34（后台），详见 §8
# 禁止范围核查
grep -rn "@Tool" sw-basic-agent/src/main/java 等（见 §7）
```

## 7. 禁止范围核查（方案 §11，grep 证据）

| # | 禁止项 | 核查命令 | 结果 |
|---|--------|---------|------|
| 1 | 零 `@Tool` 注解用法 | `grep -rn "@Tool" sw-basic/sw-basic-agent/src/main/java --include="*.java" \| wc -l` | **0**（Javadoc 措辞已回避字面 `@Tool`，仅 FunctionToolCallback lambda 路径） |
| 2 | 零自写 agentic loop | `grep -rn "tool_calls\|getToolCalls\|executeToolCalls\|ToolCallingManager" .../service/ \| wc -l` | **0**（循环内建于 ChatModel.call()，§3.2 字节码证据） |
| 3 | 零新增 pom 依赖 | `git diff sw-basic-agent/pom.xml sw-bootstrap/pom.xml` | sw-bootstrap/pom.xml 零 diff；sw-basic-agent/pom.xml 的 diff 为 **Step1 遗留未提交改动**（sw-security/starter-test/h2，注释"M07 Step1 执行确认"），本 Step 零新增 |
| 4 | 零 LangGraph4j 图拓扑改动 | `grep -rn "ToolNode\|addConditionalEdges\|ConditionalEdge" .../main/java \| wc -l` | **0**（无 ToolNode/条件边；图仍 START→callModel→END） |
| 5 | 零 SparseStateSerializer 改动 | `git diff AgentGraphFactory.java \| grep -c SparseStateSerializer` | 0（工具不进 state，ThreadLocal 不经序列化） |
| 6 | 不接受运行时用户传入 beanName/methodName | `grep -rn "getBeanName\|getMethodName" .../controller/ \| wc -l` | **0**（Controller 只收 name/description/url 等配置字段；beanName/methodName 仅 Service 写库、工厂读库反射） |
| 7 | 权限码仅两个且三段拆分 | `grep -rho "agent:tool:[a-z]*" .../main/java \| sort \| uniq -c` | `agent:tool:manage` ×9（8 注解 + 1 Javadoc）、`agent:tool:view` ×5（4 注解 + 1 Javadoc），无第三码 |

## 8. 全量测试报告

**全量 `mvn test`（Smart-WorkFlow/ 根目录，31 模块）**：`BUILD SUCCESS`，Total time 09:02 min，
Finished at **2026-08-09T18:28:57+08:00**（启动时刻 **18:19:34**，启动前记录——新鲜性边界）。

主树逐模块 surefire 报告（`find . -path '*/.claude*' -prune -o -type d -name "surefire-reports" -print`，
只统计启动时刻后生成的新鲜报告）：

| 模块 | 新鲜报告数 | 测试数 | 失败/错误/跳过 | 新鲜报告时间戳范围 |
|------|:---:|:---:|:---:|---|
| `sw-framework/sw-common` | 1 | 4 | 0/0/0 | 08-09 18:20:18 |
| `sw-framework/sw-security` | 1 | 4 | 0/0/0 | 08-09 18:20:35 |
| `sw-basic/sw-basic-storage/sw-basic-storage-biz` | 1 | 12 | 0/0/0 | 08-09 18:21:07 |
| `sw-basic/sw-basic-notify/sw-basic-notify-biz` | 2 | 7 | 0/0/0 | 08-09 18:21:41 ~ 18:21:43 |
| `sw-basic/sw-basic-job/sw-basic-job-biz` | 15 | 37 | 0/0/0 | 08-09 18:22:02 |
| `sw-basic/sw-basic-agent` | **9** | **45** | 0/0/0 | 08-09 18:24:22 ~ 18:24:50 |
| `sw-biz/sw-biz-system/sw-biz-system-biz` | 11 | 65 | 0/0/0 | 08-09 18:25:50 ~ 18:25:51 |
| `sw-biz/sw-biz-form/sw-biz-form-biz` | 9 | 76 | 0/0/0 | 08-09 18:26:39 ~ 18:27:08 |
| `sw-biz/sw-bpm/sw-bpm-engine` | 7 | 18 | 0/0/0 | 08-09 18:27:23 ~ 18:27:36 |
| `sw-biz/sw-bpm/sw-bpm-process` | 16 | 39 | 0/0/0 | 08-09 18:28:16 ~ 18:28:19 |
| **合计** | **72** | **307** | **0/0/0** | 18:20:18 ~ 18:28:19 |

**主树新鲜报告总数 = 307 tests / 0 failures / 0 errors / 0 skipped（72 报告文件）**。

- 较基线 291 新增 **+16**（预期 ≈291+15≈306±2，307 命中区间）；sw-basic-agent 报告数 6 → **9**
  （+3，对应 3 个新测试文件），测试数 29 → 45（+16：Factory 5 + ServiceImpl 7 + Controller 4）。
- sw-basic-agent 新增测试明细：AgentToolCallbackFactoryTest 5 用例、AgentToolConfigServiceImplTest
  7 用例、AgentToolConfigControllerTest 4 用例（全绿，surefire 报告 18:24 时段）。
- `.claude/worktrees/` 单独列示（不合并）：45 个 TEST-*.xml，全部为 2026-07-22 12:30 陈旧报告
  （`find .claude/worktrees/ -name "TEST-*.xml" -newermt '2026-08-09'` → 0 个），本 Step 未产生任何
  工作树报告。

## 8.1 与方案 §12 验收表 14 项逐项对照

| # | 验收项 | 结果 | 证据 |
|---|--------|:---:|------|
| 1 | V20 两张表（h2+pg）Flyway 建表 | ✅ | 方案 §9.3 V20 未被占用；`SqlCheck` spike 对两个 V20 文件在 H2（MODE=PostgreSQL）逐语句真实执行成功（§4.1 输出：两表 + 15 列 + 默认值 enabled=1/http_method=POST/timeout=30/tenant_id=0/deleted=0/version=0）；`application.yml:60` 含 `classpath:db/migration/agent/{vendor}`（§3.6）；无 FlywayException（全量 BUILD SUCCESS）；H2 测试环境按 V20 DDL 建表（AgentToolConfigServiceImplTest @BeforeAll）全部通过 |
| 2 | 内部工具 CRUD 各有单测，H2 全绿 | ✅ | AgentToolConfigServiceImplTest 用例 1-4（create+get / update+toggle+listEnabled / delete 逻辑删除 / page+校验），共 4 用例全绿 |
| 3 | 外部工具 CRUD 同上 | ✅ | AgentToolConfigServiceImplTest 用例 5-6（create+get 默认值 / update+toggle+delete+page+非法方法校验），全绿 |
| 4 | 内部工具 FunctionToolCallback 构造正确 | ✅ | AgentToolCallbackFactoryTest 用例 1：`cb.getToolDefinition().name()=="sum_tool"`、description/inputSchema 一致、`cb.call("\"{\\\"a\\\":1}\"")` 经反射走到 mock bean（返回含 "echo:"）；inputSchema=null 回退生成 string schema |
| 5 | 外部工具构造正确 + 超时从 DB 读 | ✅ | 用例 2：name/description/inputSchema 一致，call 真实 POST 到本地 HttpServer 并返回响应体（含 "pong:"）；用例 3：服务端延迟 3s > 配置 timeoutSeconds=1 → call 抛 SocketTimeoutException（`hasRootCauseInstanceOf` 断言）——超时值来自 DB 字段；工厂代码 connect/read 同取 timeoutSeconds（AgentToolCallbackFactory.java L166-168） |
| 6 | beanName 不在容器时 fail-fast | ✅ | 用例 4a：`applicationContext.getBean("ghostBean")` 抛 NoSuchBeanDefinitionException，断言 `buildToolCallbacks` 于构造阶段抛出 |
| 7 | methodName 不存在时 fail-fast | ✅ | 用例 4b：bean 无 execute(String) 方法 → IllegalStateException（含方法名 "execute"）；返回类型非 String 同路径拒绝（代码 L105-109） |
| 8 | 无工具时与 Step2 行为一致（无回归） | ✅ | 改动编排前先跑 Step2 测试：6 报告 29 测试全绿；改动后复跑仍全绿；用例 5 后半段：不 bindTools 时 callModel 收到 `new Prompt(input)`（`getOptions()==null`，spike 实测确认） |
| 9 | 有工具时 Prompt 携带 ToolCallingChatOptions | ✅ | AgentToolCallbackFactoryTest 用例 5：工厂产出回调 → bindTools → invoke → 捕获型 stub ChatModel 收到 Prompt，`getOptions() instanceof ToolCallingChatOptions` 且 `getToolCallbacks()` 含该工具（name=="sum_tool"） |
| 10 | bind/clear 对称（无内存泄漏，finally 保证） | ✅ | AgentOrchestrationServiceImpl.java L101-102 finally 恒 `clearChatModel()` + `clearTools()`；AgentToolConfigServiceImplTest 用例 7：白名单工具经 run() 成功完成 + 模型不可达异常完成两个路径后，直接 invoke 图（不绑定工具）断言 callModel 收到 Prompt 的 options 为 null（若泄漏则非 null）——成功/失败双路径均通过 |
| 11 | 权限码 agent:tool:view / agent:tool:manage 正确约束 | ✅ | AgentToolConfigControllerTest：无 view 权限 GET /agent/tool/internal → 403（用例 1）；无 manage 权限 toggle → 403、有 view 权限详情 200、有 manage 权限 toggle 200（用例 3）；manage 创建内部工具 200（用例 2）；superAdmin 全端点绕过（用例 4） |
| 12 | §9 现场验证全部写入回执，无"未验证" | ✅ | 本回执 §3 六小节全部含 javap 原始输出/grep 输出/spike 运行结果（§3.1-§3.6） |
| 13 | 全量回归 ≥306，0 failures/0 errors；sw-basic-agent 报告数 +3 | ✅ | 主树新鲜报告 **307 / 0/0/0**（72 报告）；sw-basic-agent 6 → 9 报告（§8 表）；其余模块报告数与基线一致（common 1/security 1/storage 1/notify 2/job 15/system 11/form 9/bpm-engine 7/bpm-process 16，与 baseline-recount 完全一致） |
| 14 | 禁止范围核查 | ✅ | 本回执 §7：`grep -rn "@Tool"` 0 命中；自写 loop 0 命中；pom 零新增（Step1 遗留 diff 除外）；ToolNode/条件边 0 命中；SparseStateSerializer 零改动；Controller 无 getBeanName/getMethodName；权限码仅 2 枚 |

## 9. 遇到的问题

1. **方案 §9.4 期望与实测不符（记录于 §3.4）**：`call("{}")` 不抛 ClassCastException（方案断言成立）
   但抛 Jackson 反序列化异常（I=String 要求 arguments 为 JSON 字符串字面量）；`inputSchema(null)`
   不 NPE（方案预案分支未触发），回退为 inputType 生成的 schema。已按实测写入代码注释与回执。
2. **方案 §9.2 提到的 `AutoConfiguredToolCallingManager` 类不存在**（§3.2）：实际自动装配类为
   `ToolCallingAutoConfiguration`，默认 predicate 为 `DefaultToolExecutionEligibilityPredicate`，
   `internalToolExecutionEnabled` 未设置时默认 true → tool_calls 自动执行（无需显式开启）。
3. **AgentToolCallbackFactoryTest 用例 4c 首次运行失败**：4b 场景的 internalMapper mock 存根
   （返回含无方法配置的列表）未在 4c 前重置，导致先触发内部 fail-fast（IllegalStateException）
   而非外部非法 HTTP 方法的 IllegalArgumentException——在 4c 前补 `when(internalMapper.selectList(any())).thenReturn(List.of())` 修复，复跑全绿。
4. **编排 ThreadLocal 绑定方式的方案偏差（记录于 §5）**：方案 §8.2 伪代码为 `invoke(request)` +
   构造注入工厂；实际 ServiceImpl 方法名是 `run(AgentOrchestrationRunReqDTO)`（Step2 产物），
   且既有 AgentOrchestrationServiceImplTest 以 4 参构造直构——为不触碰清单外测试文件，工厂以
   `@Autowired(required=false)` 字段注入（生产由 Spring 注入、测试直构为 null 时行为与 Step2 一致）。
   同时 `AgentOrchestrationRunReqDTO` 无 tenantId 字段（清单外文件不可改），`buildToolCallbacks(null)`
   由租户拦截器完成隔离（与 Step2 `mapper.selectById` 同先例）。

## 10. 未完成内容

无。方案 §12 验收表 14 项全部满足（见下节逐项证据）。

## 11. 风险和注意事项

1. **工具入参契约**：`inputType(String.class)` 下 LLM 须按生成 schema（`{"type":"string"}`）发送
   JSON 字符串字面量；若管理员配置的对象型 input_schema 诱导 LLM 发送 JSON 对象，call() 抛
   反序列化异常 → 框架默认 ToolExecutionExceptionProcessor 转为错误消息回喂 LLM（不中断调用，
   循环内可自纠正）——已在 AgentToolCallbackFactory Javadoc 记录。
2. **工具配置变更即时生效**：工厂每次 orchestration 调用时查库（不做启动缓存，方案 §8.1）；
   fail-fast 配置错误（bean/method 不存在）会使该租户编排失败，管理员需先修正白名单——符合
   方案 §6.1"禁止静默失败"。
3. **sw.agent.enabled=true 生产装配路径**：AgentToolCallbackFactory 为 @Component +
   @ConditionalOnProperty(sw.agent.enabled=true)，经 StarterApplication scanBasePackages=com.sw.ck
   装配（mapper.tool 由 AgentModelAutoConfiguration @MapperScan("com.sw.ck.agent.mapper") 递归覆盖）；
   测试上下文走 TestConfig 手动同构 bean（Step2 §11 风险 2 同款已知边界）。
4. **ThreadLocal 绑定契约扩展**：编排执行现依赖 chatModel + tools 两个绑定，AgentGraphFactory
   Javadoc 已说明 bind/clear 必须成对（ServiceImpl finally 保证）。

## 12. Git diff 摘要

- 新建 17 文件（14 生产 + 3 测试），修改 2 文件（AgentGraphFactory/AgentOrchestrationServiceImpl）
- 关键变更：V20 双脚本（两张白名单表）；工具回调工厂（DB 白名单 → FunctionToolCallback）；
  工具 CRUD Service/Controller（权限码 2 枚）；编排图 callModel 携带 ToolCallingChatOptions；
  编排 Service bind/clear 对称
- 零新增依赖、零图拓扑改动、零 @Tool、零前端改动、零 SparseStateSerializer 改动、未 commit/push
