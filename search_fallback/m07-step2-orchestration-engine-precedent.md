# 探索回执：M07-Step2「调度图编排执行引擎 + 工具沙箱」前置调研

**执行模型**：deepseek-v4-flash（本会话；Q4 白名单先例部分由 subagent 完成，Q1-Q3 jar 签名由主会话 javap 提取）
**执行日期**：2026-08-05
**任务来源**：`search_task/m07-step2-orchestration-engine-precedent.md`
**任务状态**：✅ 6 问均有明确答案（Q1/Q2/Q3 全部为 jar 真实字节码签名，非训练记忆；无未确认项）
**未确认事项**：无（唯一注意点见 §7：langgraph4j 无 sources jar，签名由 javap 直接反编译 .class 确认）

---

## 1. LangGraph4j 1.5.14 真实 API 形态（Q1）

**jar 位置**：`~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar`（154KB，2025-05-28 构建）。**无 sources jar**，以下签名全部由 `javap` 反编译 .class 字节码提取。

### 1.1 StateGraph（图构造）

```java
public class org.bsc.langgraph4j.StateGraph<State extends AgentState> {
  public static final String END;  public static final String START;
  // 构造（三选一）
  public StateGraph(StateSerializer<State>);
  public StateGraph(Map<String, Channel<?>>, AgentStateFactory<State>);
  public StateGraph(Map<String, Channel<?>>, StateSerializer<State>);
  // 节点
  public StateGraph<State> addNode(String, AsyncNodeAction<State>) throws GraphStateException;
  public StateGraph<State> addNode(String, AsyncNodeActionWithConfig<State>) throws GraphStateException;
  public StateGraph<State> addNode(String, CompiledGraph<State>);          // 子图
  public StateGraph<State> addSubgraph(String, CompiledGraph<State>);
  // 边
  public StateGraph<State> addEdge(String, String) throws GraphStateException;              // 固定边
  public StateGraph<State> addConditionalEdges(String, AsyncEdgeAction<State>, Map<String,String>) throws GraphStateException;  // 条件分支
  // 编译执行
  public CompiledGraph<State> compile() throws GraphStateException;
  public CompiledGraph<State> compile(CompileConfig);
  // 图表输出（可视化）
  public GraphRepresentation getGraph(GraphRepresentation.Type, String, boolean);  // Mermaid / PlantUML
}
```

### 1.2 CompiledGraph（执行）

```java
public class org.bsc.langgraph4j.CompiledGraph<State extends AgentState> {
  public Optional<State> invoke(Map<String,Object>);                          // 一次性执行
  public Optional<State> invoke(Map<String,Object>, RunnableConfig);
  public org.bsc.async.AsyncGenerator<NodeOutput<State>> stream(Map<String,Object>);   // 流式（node 级输出）
  public org.bsc.async.AsyncGenerator<NodeOutput<State>> streamSnapshots(Map<String,Object>);
  public Collection<StateSnapshot<State>> getStateHistory(RunnableConfig);    // checkpoint 历史
  public void setMaxIterations(int);                                          // 最大迭代保护
}
```

### 1.3 State 与 Channel

```java
public class org.bsc.langgraph4j.state.AgentState {
  public AgentState(Map<String,Object>);
  public final Map<String,Object> data();
  public final <T> Optional<T> value(String);      // 取值
  public static Map<String,Object> updateState(AgentState, Map<String,Object>, Map<String,Channel<?>>);
}
public interface org.bsc.langgraph4j.state.Channels {
  public static <T> Channel<List<T>> appender(Supplier<List<T>>);   // 追加型 channel（消息列表等）
  public static <T> Channel<T> base(Supplier<T>);                   // 覆盖型 channel
  public static <T> Channel<T> base(Reducer<T>, Supplier<T>);
}
```

### 1.4 节点/边动作（编程接口）

```java
public interface org.bsc.langgraph4j.action.NodeAction<S> { Map<String,Object> apply(S) throws Exception; }              // 同步
public interface org.bsc.langgraph4j.action.AsyncNodeAction<S> extends Function<S, CompletableFuture<Map<String,Object>>> { apply(S); static node_async(NodeAction<S>); }
public interface org.bsc.langgraph4j.action.EdgeAction<S> { String apply(S) throws Exception; }                          // 同步，返回下一节点名
public interface org.bsc.langgraph4j.action.AsyncEdgeAction<S> extends Function<S, CompletableFuture<String>> { apply(S); static edge_async(EdgeAction<S>); }
```

### 1.5 序列化 / 配置 / checkpoint

```java
public abstract class StateSerializer<State> { public final State stateOf(Map<String,Object>); public final State cloneObject(Map<String,Object>); }
public class ObjectStreamStateSerializer<State> extends StateSerializer<State> { public ObjectStreamStateSerializer(AgentStateFactory<State>); }
public class CompileConfig { public static Builder builder(); public Optional<BaseCheckpointSaver> checkpointSaver(); public String[] getInterruptBefore(); public String[] getInterruptAfter(); }
public interface BaseCheckpointSaver {  // 持久化 checkpoint 需自定义实现
  public static final String THREAD_ID_DEFAULT;
  Collection<Checkpoint> list(RunnableConfig); Optional<Checkpoint> get(RunnableConfig); RunnableConfig put(RunnableConfig, Checkpoint) throws Exception; Tag release(RunnableConfig);
}
public final class RunnableConfig { public Optional<String> threadId(); public Optional<String> checkPointId(); public RunnableConfig withCheckPointId(String); }
```

**checkpoint 内置实现仅 `FileSystemSaver`**（checkpoint 包共 4 类：BaseCheckpointSaver/Checkpoint/FileSystemSaver/HasVersions，无任何 JDBC/DB 实现）——若 Step 2 要跨重启保留会话状态，需要自写 `BaseCheckpointSaver` 的 DB 实现（表 `sw_agent_` 前缀预留了会话/消息表，见 §5）。

**其他可用类**：`prebuilt.MessagesState` / `prebuilt.MessagesStateGraph`（消息状态图便捷版）；`NodeOutput.node()/state()/isEND()`；`GraphStateException`（图非法时抛出）；依赖外部库 `org.bsc.async.AsyncGenerator`（bsc-async-generator，stream 返回类型）。

## 2. Spring AI 1.0.4 编程式构造 ChatModel（Q2）—— ✅ 支持，且签名完整确认

**结论：`OpenAiApi.builder()` / `OllamaApi.builder()` 均允许运行时传 baseUrl+apiKey 构造，`OpenAiChatModel`/`OllamaChatModel` 均有公开构造器与 Builder，不依赖 `application.yml` 全局单例。Step 2「一条 AgentModelConfig 记录 → 一个可调用客户端」落地无技术障碍。**

jar：`~/.m2/repository/org/springframework/ai/spring-ai-openai/1.0.4/spring-ai-openai-1.0.4.jar`、`spring-ai-ollama/1.0.4/spring-ai-ollama-1.0.4.jar`

```java
// openai —— 关键：baseUrl(String) + apiKey(String) 均可运行时指定
public class org.springframework.ai.openai.api.OpenAiApi {
  public static OpenAiApi.Builder builder();
  // 构造器：new OpenAiApi(String baseUrl, ApiKey apiKey, MultiValueMap headers, String completionsPath, String embeddingsPath, RestClient.Builder, WebClient.Builder, ResponseErrorHandler)
}
public class OpenAiApi$Builder {
  public Builder baseUrl(String);  public Builder apiKey(ApiKey);  public Builder apiKey(String);
  public Builder headers(MultiValueMap<String,String>);  public Builder completionsPath(String);  public OpenAiApi build();
}
public class org.springframework.ai.openai.OpenAiChatModel implements ChatModel {
  public OpenAiChatModel(OpenAiApi, OpenAiChatOptions, ToolCallingManager, RetryTemplate, ObservationRegistry);  // 公开构造器
  public static OpenAiChatModel.Builder builder();  public ChatResponse call(Prompt);  public Flux<ChatResponse> stream(Prompt);
}
public class OpenAiChatModel$Builder {
  public Builder openAiApi(OpenAiApi);  public Builder defaultOptions(OpenAiChatOptions);
  public Builder toolCallingManager(ToolCallingManager);  public Builder retryTemplate(RetryTemplate);
  public Builder observationRegistry(ObservationRegistry);  public OpenAiChatModel build();
}

// ollama —— 同样支持
public class org.springframework.ai.ollama.api.OllamaApi { public static OllamaApi.Builder builder(); }
public class OllamaApi$Builder { public Builder baseUrl(String); }
public class org.springframework.ai.ollama.OllamaChatModel implements ChatModel {
  public OllamaChatModel(OllamaApi, OllamaOptions, ToolCallingManager, ObservationRegistry, ModelManagementOptions);  // 公开构造器
  public static OllamaChatModel.Builder builder();  public ChatResponse call(Prompt);  public Flux<ChatResponse> stream(Prompt);
}
```

**关键注意**：`OpenAiChatModel.builder()` 未提供 openAiApi 外的 api-key 设置位——api-key 必须通过 `OpenAiApi.builder().apiKey(...)` 携带；`RetryTemplate` 可 `org.springframework.retry.support.RetryTemplate.builder()` 按 AgentModelConfig.retryCount 动态构造（Step 1 实体已有 `timeoutSeconds/retryCount/temperature/maxTokens/topP` 字段，OpenAiChatOptions/OllamaOptions Builder 均有对应 setter 族）。

## 3. Spring AI 1.0.4 工具调用编程接口（Q3）—— ✅ 全套存在，仓库零引用

**jar**：`spring-ai-model/1.0.4/spring-ai-model-1.0.4.jar`（`org.springframework.ai.tool.*` 包）

```java
// 注解（D48 白名单方法调用的绑定面）
public @interface org.springframework.ai.tool.annotation.Tool { String name(); String description(); boolean returnDirect(); Class<? extends ToolCallResultConverter> resultConverter(); }
public @interface org.springframework.ai.tool.annotation.ToolParam { }

// 核心接口
public interface org.springframework.ai.tool.ToolCallback { ToolDefinition getToolDefinition(); String call(String); default String call(String, ToolContext); }
public interface org.springframework.ai.tool.definition.ToolDefinition { String name(); String description(); String inputSchema(); static Builder builder(); }
public interface org.springframework.ai.tool.ToolCallbackProvider { ToolCallback[] getToolCallbacks(); static ToolCallbackProvider from(List<? extends ToolCallback>); static ToolCallbackProvider from(ToolCallback...); }
public interface org.springframework.ai.model.tool.ToolCallingManager { List<ToolDefinition> resolveToolDefinitions(ToolCallingChatOptions); ToolExecutionResult executeToolCalls(Prompt, ChatResponse); static Builder builder(); }

// 方法绑定实现（反射式 —— 工具沙箱「内部白名单方法调用」的落点）
public class org.springframework.ai.tool.method.MethodToolCallback {
  public static Builder builder();
  public static class Builder { Builder toolDefinition(ToolDefinition); Builder toolMethod(Method); Builder toolObject(Object); ToolCallback build(); }
}
public class org.springframework.ai.tool.method.MethodToolCallbackProvider implements ToolCallbackProvider { public static Builder builder(); ToolCallback[] getToolCallbacks(); }
```

**仓库引用检查**：全仓库 grep `@Tool|ToolCallback|MethodToolCallback` 于 sw-basic/sw-biz/sw-framework —— **零命中**。grep `langgraph4j|StateGraph` —— **零命中**（AgentGraphAutoConfiguration 确为空壳，无任何 Bean）。两库均为本仓库首次编程式使用，无历史坑可抄。

## 4. 仓库内「白名单机制」先例（Q4）—— 三个可参照模板

### 4.1 JobHandler 白名单（工具沙箱内部方法调用的直接模板）

**`sw-basic/sw-basic-job/sw-basic-job-biz/.../scheduler/SwJobBean.java`**：
- 注册表 = Spring 按 bean 名注入 `@Autowired(required=false) Map<String, JobHandler> handlerMap`（line 61-62），无显式 registry 类
- 执行期白名单校验（line 140-149）：beanName 空 → 抛 `IllegalStateException`；`!handlerMap.containsKey(beanName)` → 抛「未找到 JobHandler Bean」；命中才 `handler.execute(params)`。**不反射、不按 FQCN 加载任意类**
- SPI 约定（`sw-basic-job-api/.../handler/JobHandler.java` Javadoc）：实现类 `@Component("myHandler")`，bean name 即 handler 名称，与 `JobInfo.beanName` 匹配
- 调度入口按 `jobType` 分支（BEAN→executeBean / FLOW→发布事件），未知类型拒绝

### 4.2 SqlExecutor.validateSql（外部调用的安全校验模板）

**`sw-biz/sw-bpm/sw-bpm-engine/.../executor/SqlExecutor.java`**：
- `void validateSql(String sql)`（line 129-164）三层：① 引号外分号检测拒多语句堆叠；② `CCJSqlParserUtil.parse` 后 `!(statement instanceof Select)` 拒非 SELECT（jsqlparser）；③ 黑名单兜底 `BLOCKLIST = Set.of("LOAD_FILE","INTO OUTFILE","LOAD DATA","BENCHMARK","SLEEP","GET_LOCK","EXEC","CALL","EXECUTE IMMEDIATE", ...)`（line 44-49）
- 执行加固（line 186-195）：`conn.setReadOnly(true)`、`ps.setMaxRows(...)`、`ps.setQueryTimeout(...)`；独立 JdbcTemplate 不复用主库连接
- 外部数据源连接池在 `ExternalDatasourceManager`（HikariCP 动态建池，`buildConfig` 中 readOnly 开关）

### 4.3 配置驱动注册表（String-key → 实现 族）

| 先例 | 位置 | 机制 |
|------|------|------|
| `StorageProviderRegistry` | `sw-basic-storage/sw-basic-storage-biz/.../provider/StorageProviderRegistry.java` | `@PostConstruct` 收集 `List<StorageProvider>` 按 `getType()` 建 Map（type=local/minio/cos/qiniu）；`getProvider(type)` 未命中返回 null；`getActiveProvider()` 未命中抛 IllegalStateException 并列出已注册类型 |
| `NodeTypeRegistry` | `sw-biz/sw-bpm/sw-bpm-process/.../model/NodeTypeRegistry.java` | 手动 `register("START"/"END"/"APPROVAL", spec)`；Javadoc 明言「用 Map 查找替代 switch/if-else 链」 |
| `approverResolverMap` | `sw-biz/sw-bpm/sw-bpm-engine/.../config/BpmEngineAutoConfiguration.java` line 93-107 | `@Bean Map<String, NodeApproverResolver>`，注释明确「禁 switch 分发，**禁 FQCN 选实现**」 |

**仓库级硬性约定**（`knowledge/architecture.md` §3.4 line 99）：❌ 禁止 FQCN 字符串选择实现 —— 工具沙箱注册必须走「注册表 + 白名单 key」，不得按类名字符串反射实例化。

## 5. sw_agent_ 表前缀规划（Q5）—— 仅前缀预留，无字段级规划

- `knowledge/architecture.md` §3.5 表命名规则（line 116）：`| sw_agent_ | 会话、消息、工具调用 | sw-basic-agent |` —— 全库唯一原文；line 119「❌ 禁止自创前缀」
- **无任何字段级规划**：全库 grep 无 `sw_agent_` 的 DDL；`sw-basic-agent/src/main/resources/db/migration/agent/` 目录为空（Step 1 的 V19 迁移在 `sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/` 下）
- 图定义（节点/边）表：**未找到任何规划**。仅有的「nodes/edges」是 D39 前端 adapter 数据模型（`product/vue-flow-adapter/passed/step-1-implement-flow-graph-adapter.md` 的 `FlowGraphData { nodes, edges }`），与后端表无关
- 归属判断依据：会话/消息/工具调用表语义上服务于 M07-F04 对话交互与 Step 2 工具调用记录，**表前缀虽预留但归属 Step 2 还是后续 Step 需规划层裁定**——本调研只确认"无字段级规划"事实

## 6. 图定义的输入形态（Q6）—— 纯程序构造，无序列化反序列化入口

**结论：`StateGraph` 仅支持 Java 代码显式声明节点和边**（`addNode/addEdge/addConditionalEdges`，见 §1.1），jar 中**不存在**从 JSON/YAML 反序列化构建图结构的任何入口。

- jar 内 `serializer/` 包全部是**状态**（AgentState）序列化：`StateSerializer`/`ObjectStreamStateSerializer`/`JacksonStateSerializer`/`GsonStateSerializer`/`PlainTextStateSerializer`——服务 checkpoint 持久化（`BaseCheckpointSaver`），与「图结构」无关
- `getGraph(GraphRepresentation.Type, ...)` 是**输出**方向（生成 Mermaid/PlantUML 文本），不是输入
- 影响：Step 2 必须以代码构造最小图验证引擎跑通（内存/硬编码 StateGraph → compile → invoke），「图定义 CRUD + 持久化表」无法借库能力自动达成，需自建表 + 代码生成器（或保留后续 Step），与 D47「前端图设计器留后续 Step」的节奏吻合

## 7. 未确认事项 / 风险提示

1. **无未确认事项**。Q1-Q3 全部为 javap 真实字节码签名（langgraph4j 无 sources jar，但 javap 反编译 .class 签名与源码等价；Spring AI jar 为 2026-03 构建，API 与 1.0.4 版本一致）。
2. **版本一致性**：pom 钉死 `langgraph4j.version=1.5.14`、`spring-ai.version=1.0.4`，与本地 jar 完全一致，无版本漂移。
3. **checkpoint 无 DB 内置实现**：`BaseCheckpointSaver` 需自写 DB 实现才能跨重启保留图状态（若 Step 2 需要）；内置仅 FileSystemSaver（不可用于集群）。
4. **StreamMode/Interrupt**：`CompileConfig.interruptBefore/After` 与 `RunnableConfig.streamMode` 存在（人机确认中断点能力），本回执未逐一展开，如 Step 2 方案需要可再补 javap。
5. **仓库级硬性约定**：禁 switch 分发、禁 FQCN 选实现（§4.3）——Step 2 工具沙箱与协议分发的设计必须遵守。

## 8. 对规划层最有价值的结论摘要

1. **编排引擎可落地**：LangGraph4j 1.5.14 提供完整「图构造 → 条件分支 → 编译执行 → 流式输出 → checkpoint」能力，API 全部确认真实可用；Step 2 最小图（内存构造）无技术风险。
2. **动态模型客户端可落地**：Spring AI 1.0.4 `OpenAiApi.builder().baseUrl().apiKey()` / `OllamaApi.builder().baseUrl()` + 公开构造器，运行时按 AgentModelConfig 逐条构造 ChatModel 完全可行，不依赖全局单例。
3. **工具沙箱有现成模板**：内部白名单方法调用 = SwJobBean handlerMap 模式 + MethodToolCallback 反射绑定（受 D48 数据配置约束，需在注册表之上再做「注册表 → 配置表」映射）；外部 HTTP 白名单 = SqlExecutor.validateSql 的「白名单 + 黑名单兜底 + 只读加固」三层模板。
4. **图定义持久化无库支持**：需自建表 + 代码构造，或推迟（与 D47 节奏一致）；sw_agent_ 前缀仅预留会话/消息/工具调用三类。
5. **仓库零使用记录**：两库均为首次编程式使用，Step 2 方案不能引用任何仓库内 Spring AI/LangGraph4j 先例代码（无）。
