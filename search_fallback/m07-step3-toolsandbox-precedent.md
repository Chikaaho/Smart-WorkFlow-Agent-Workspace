# 探索回执：M07-Step3「工具沙箱」前置调研

**执行模型**：deepseek-v4-flash（本会话实际执行）
**执行日期**：2026-08-09
**任务来源**：`search_task/m07-step3-toolsandbox-precedent.md`
**只读确认**：本任务未修改/创建/删除仓库内任何文件；未运行任何 mvn 命令；仅使用 `jar tf`、`javap`、`find`、`grep`、文件读取。唯一写入为本回执文件。
**任务状态**：✅ 6 问均有明确答案，证据全部为本次实际探查的 jar 类名/方法签名（javap 原始输出）或仓库文件行号/代码摘录，无训练记忆补填。
**关键"不存在"标注**：LangGraph4j 1.5.14 **框架层无任何 ToolNode/工具相关类**（jar tf 全量枚举为证，见 §1）；`spring-ai-client-chat-1.0.4.jar` 内**无任何 tool 相关类**（工具类全部在 spring-ai-model 中，见 §2）；`Prompt` 构造函数**不接受工具列表**（见 §3）；仓库内按任务给定模式（RestTemplate|WebClient|HttpClient|HttpURLConnection）**0 个 Java 文件命中**（见 §5）。

---

## 问题 1：LangGraph4j 1.5.14 的工具调用集成机制

**jar 路径**：`~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar`

### 1.1 ToolNode 存在性：**不存在**

`jar tf <jar> | grep -i "tool"` 原始输出：**空（无任何输出）**。全 jar 共 123 个条目，完整枚举（顶层包结构）：

```
org/bsc/langgraph4j/diagram/          org/bsc/langgraph4j/serializer/std/
org/bsc/langgraph4j/serializer/       org/bsc/langgraph4j/serializer/plain_text/jackson/
org/bsc/langgraph4j/serializer/plain_text/gson/   org/bsc/langgraph4j/prebuilt/
org/bsc/langgraph4j/internal/edge/    org/bsc/langgraph4j/internal/node/
org/bsc/langgraph4j/state/            org/bsc/langgraph4j/action/
org/bsc/langgraph4j/utils/            org/bsc/langgraph4j/checkpoint/
org/bsc/langgraph4j/streaming/
```

顶层类仅：`StateGraph`、`CompiledGraph`、`SubGraphNode`、`NodeOutput`、`GraphStateException`、`GraphRepresentation`、`GraphRunnerException`、`RunnableConfig`、`CompileConfig`、`DiagramGenerator`、`ProcessedNodesEdgesAndConfig`、`HasMetadata`；`prebuilt` 包仅 `MessagesState`、`MessagesStateGraph` 两个类。**没有任何包含 "tool"/"Tool" 关键字的类**。m2 仓库中 langgraph4j 仅有 `langgraph4j-core` 与 `langgraph4j-parent` 两个模块（`find ~/.m2/repository/org/bsc/langgraph4j/ -maxdepth 2 -type d` 证实），不存在独立的 langgraph4j-tool 模块。langgraph4j-core 的 pom 依赖仅 async-generator/slf4j-api/gson/jackson-databind（`grep artifactId` 证实）。

**判定：LangGraph4j 框架层不内置 ToolNode，工具执行完全由开发者自己实现节点。** 框架对 ChatModel 返回的 `tool_calls` 无任何感知/拦截/回写机制（ChatModel 甚至不在 langgraph4j-core 的依赖中）。

### 1.2 图构造 API（真实签名）

`javap -p` 关键方法（原文摘录）：

```
public class org.bsc.langgraph4j.StateGraph<State extends AgentState> {
  public org.bsc.langgraph4j.StateGraph<State> addNode(java.lang.String, org.bsc.langgraph4j.action.AsyncNodeAction<State>) throws org.bsc.langgraph4j.GraphStateException;
  public org.bsc.langgraph4j.StateGraph<State> addNode(java.lang.String, org.bsc.langgraph4j.action.AsyncNodeActionWithConfig<State>) throws org.bsc.langgraph4j.GraphStateException;
  public org.bsc.langgraph4j.StateGraph<State> addEdge(java.lang.String, java.lang.String) throws org.bsc.langgraph4j.GraphStateException;
  public org.bsc.langgraph4j.StateGraph<State> addConditionalEdges(java.lang.String, org.bsc.langgraph4j.action.AsyncEdgeAction<State>, java.util.Map<java.lang.String, java.lang.String>) throws org.bsc.langgraph4j.GraphStateException;
  public org.bsc.langgraph4j.CompiledGraph<State> compile() throws org.bsc.langgraph4j.GraphStateException;
}
```

即条件分支 API 存在（`addConditionalEdges(node, AsyncEdgeAction, Map<分支名,目标节点>)`），但仅提供图拓扑能力，不提供任何工具执行语义。

### 1.3 仓库现状（Step2 产物）

`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java` 第 68-78 行 `buildGraph()`：单节点图 `START → callModel → END`，`callModel` 节点（第 87-95 行）一次 `chatModel.call(new Prompt(input))` 后从 `ChatResponse.getResult().getOutput().getText()` 提取文本写入 `output` channel。`chatModel` 经 ThreadLocal 绑定（`bindChatModel`/`clearChatModel`，第 51-61 行），state 序列化时跳过（`SparseStateSerializer` 第 102-125 行，因节点间深拷贝会触发 NotSerializableException）。

**依据上述真实 API 的图结构判定（仅陈述事实，不做设计建议）**：当前 jar 中不存在任何现成的"工具执行节点"，若要支持 tool_calls，开发者节点是唯一途径；图构造侧可用能力仅为 `addNode` + `addEdge`/`addConditionalEdges` 组合（LLM 节点 → 条件边 → 工具节点 → 回 LLM 节点），条件边的判定逻辑（解包 `tool_calls`）也须由开发者写在 `AsyncEdgeAction`/节点动作内——框架无任何内置判定。`CompiledGraph.setMaxIterations(int)` 存在（Step2 回执已证），可用于限制循环。

---

## 问题 2：Spring AI 1.0.4 ToolCallback 动态构造方式

**jar 路径**：`~/.m2/repository/org/springframework/ai/spring-ai-model/1.0.4/spring-ai-model-1.0.4.jar`

### 2.1 `org.springframework.ai.tool` 包完整类清单（`jar tf | grep -i tool` 原始输出，去重后）

```
org/springframework/ai/tool/ToolCallback.class
org/springframework/ai/tool/ToolCallbackProvider.class
org/springframework/ai/tool/StaticToolCallbackProvider.class
org/springframework/ai/tool/annotation/Tool.class
org/springframework/ai/tool/annotation/ToolParam.class
org/springframework/ai/tool/definition/ToolDefinition.class
org/springframework/ai/tool/definition/DefaultToolDefinition.class（含 $Builder）
org/springframework/ai/tool/execution/ToolExecutionException.class
org/springframework/ai/tool/execution/ToolExecutionExceptionProcessor.class
org/springframework/ai/tool/execution/DefaultToolExecutionExceptionProcessor.class（含 $Builder）
org/springframework/ai/tool/execution/ToolCallResultConverter.class
org/springframework/ai/tool/execution/DefaultToolCallResultConverter.class
org/springframework/ai/tool/function/FunctionToolCallback.class（含 $Builder）
org/springframework/ai/tool/method/MethodToolCallback.class（含 $Builder、$1）
org/springframework/ai/tool/method/MethodToolCallbackProvider.class（含 $Builder）
org/springframework/ai/tool/metadata/ToolMetadata.class
org/springframework/ai/tool/metadata/DefaultToolMetadata.class（含 $Builder）
org/springframework/ai/tool/resolution/ToolCallbackResolver.class
org/springframework/ai/tool/resolution/StaticToolCallbackResolver.class
org/springframework/ai/tool/resolution/SpringBeanToolCallbackResolver.class（含 $Builder、$KotlinDelegate）
org/springframework/ai/tool/resolution/DelegatingToolCallbackResolver.class
org/springframework/ai/tool/support/ToolUtils.class
org/springframework/ai/tool/support/ToolDefinitions.class
org/springframework/ai/tool/observation/（DefaultToolCallingObservationConvention、ToolCallingObservationContext 等 12 个类）
```

另外 `org.springframework.ai.model.tool` 包：`ToolCallingManager`、`DefaultToolCallingManager`（含 $Builder、$InternalToolExecutionResult）、`ToolCallingChatOptions`（含 $Builder）、`DefaultToolCallingChatOptions`（含 $Builder）、`ToolExecutionEligibilityPredicate`。消息侧：`org.springframework.ai.chat.messages.AssistantMessage$ToolCall`、`ToolResponseMessage`（含 $ToolResponse）。`org.springframework.ai.support.ToolCallbacks` 工具类也在本 jar。

### 2.2 ToolCallback 接口（javap -p 原始输出）

```
public interface org.springframework.ai.tool.ToolCallback {
  public static final org.slf4j.Logger logger;
  public abstract org.springframework.ai.tool.definition.ToolDefinition getToolDefinition();
  public default org.springframework.ai.tool.metadata.ToolMetadata getToolMetadata();
  public abstract java.lang.String call(java.lang.String);
  public default java.lang.String call(java.lang.String, org.springframework.ai.chat.model.ToolContext);
}
```

配套 `ToolDefinition`（javap 原始输出）：

```
public interface org.springframework.ai.tool.definition.ToolDefinition {
  public abstract java.lang.String name();
  public abstract java.lang.String description();
  public abstract java.lang.String inputSchema();
  public static org.springframework.ai.tool.definition.DefaultToolDefinition$Builder builder();
}
```

即：方法描述 = `getToolDefinition().name()/description()/inputSchema()`（inputSchema 是 JSON Schema 字符串），执行 = `call(String jsonArgs)`。

### 2.3 FunctionToolCallback：支持运行时 lambda 动态构造（不依赖 @Tool 注解）

`javap -p` 静态工厂（原文）：

```
public class org.springframework.ai.tool.function.FunctionToolCallback<I, O> implements org.springframework.ai.tool.ToolCallback {
  public static <I, O> org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> builder(java.lang.String, java.util.function.BiFunction<I, org.springframework.ai.chat.model.ToolContext, O>);
  public static <I, O> org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> builder(java.lang.String, java.util.function.Function<I, O>);
  public static <O> org.springframework.ai.tool.function.FunctionToolCallback$Builder<java.lang.Void, O> builder(java.lang.String, java.util.function.Supplier<O>);
  public static <I> org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, java.lang.Void> builder(java.lang.String, java.util.function.Consumer<I>);
}
```

Builder setter（javap -p 原文）：

```
public final class org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> {
  public org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> description(java.lang.String);
  public org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> inputSchema(java.lang.String);
  public org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> inputType(java.lang.reflect.Type);
  public org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> inputType(org.springframework.core.ParameterizedTypeReference<?>);
  public org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> toolMetadata(org.springframework.ai.tool.metadata.ToolMetadata);
  public org.springframework.ai.tool.function.FunctionToolCallback$Builder<I, O> toolCallResultConverter(org.springframework.ai.tool.execution.ToolCallResultConverter);
  public org.springframework.ai.tool.function.FunctionToolCallback<I, O> build();
}
```

私有字段：`name`、`description`、`inputSchema`、`inputType`、`toolFunction` 等——name 由 `builder(String name, ...)` 首个参数传入，**无 name setter**。即动态构造路径：`FunctionToolCallback.builder("toolName", (args, ctx) -> result).description(...).inputSchema(...).build()`，完全脱离 `@Tool` 注解。

### 2.4 MethodToolCallback：构造函数接受 `java.lang.reflect.Method`

`javap -p` 原文（核心部分）：

```
public final class org.springframework.ai.tool.method.MethodToolCallback implements org.springframework.ai.tool.ToolCallback {
  public org.springframework.ai.tool.method.MethodToolCallback(org.springframework.ai.tool.definition.ToolDefinition, org.springframework.ai.tool.metadata.ToolMetadata, java.lang.reflect.Method, java.lang.Object, org.springframework.ai.tool.execution.ToolCallResultConverter);
  ...
  private java.lang.Object[] buildMethodArguments(java.util.Map<java.lang.String, java.lang.Object>, org.springframework.ai.chat.model.ToolContext);
  private java.lang.Object buildTypedArgument(java.lang.Object, java.lang.reflect.Type);
  public static org.springframework.ai.tool.method.MethodToolCallback$Builder builder();
}
```

Builder（javap -p 原文）：

```
public final class org.springframework.ai.tool.method.MethodToolCallback$Builder {
  public org.springframework.ai.tool.method.MethodToolCallback$Builder toolDefinition(org.springframework.ai.tool.definition.ToolDefinition);
  public org.springframework.ai.tool.method.MethodToolCallback$Builder toolMetadata(org.springframework.ai.tool.metadata.ToolMetadata);
  public org.springframework.ai.tool.method.MethodToolCallback$Builder toolMethod(java.lang.reflect.Method);
  public org.springframework.ai.tool.method.MethodToolCallback$Builder toolObject(java.lang.Object);
  public org.springframework.ai.tool.method.MethodToolCallback$Builder toolCallResultConverter(org.springframework.ai.tool.execution.ToolCallResultConverter);
  public org.springframework.ai.tool.method.MethodToolCallback build();
}
```

即反射式构造路径：`MethodToolCallback.builder().toolDefinition(...).toolMethod(reflectMethod).toolObject(beanInstance).build()`。注意 MethodToolCallback 的 ToolDefinition 需自行提供（工具名称/描述/inputSchema 不来自注解或反射推导，见 `DefaultToolDefinition.builder().name(...).description(...).inputSchema(...)`）。

### 2.5 ToolCallingManager：存在，设计为"框架自动执行 tool_calls 并生成追加消息"，不是纯 registry

`javap -p` 原文：

```
public interface org.springframework.ai.model.tool.ToolCallingManager {
  public abstract java.util.List<org.springframework.ai.tool.definition.ToolDefinition> resolveToolDefinitions(org.springframework.ai.model.tool.ToolCallingChatOptions);
  public abstract org.springframework.ai.model.tool.ToolExecutionResult executeToolCalls(org.springframework.ai.chat.prompt.Prompt, org.springframework.ai.chat.model.ChatResponse);
  public static org.springframework.ai.model.tool.DefaultToolCallingManager$Builder builder();
}
```

`ToolExecutionResult`（javap -p 原文）：

```
public interface org.springframework.ai.model.tool.ToolExecutionResult {
  public abstract java.util.List<org.springframework.ai.chat.messages.Message> conversationHistory();   // 追加了 ToolResponseMessage 的消息列表
  public default boolean returnDirect();
  public static org.springframework.ai.model.tool.ToolExecutionResult$Builder builder();
  public static java.util.List<org.springframework.ai.chat.model.Generation> buildGenerations(org.springframework.ai.model.tool.ToolExecutionResult);
}
```

`DefaultToolCallingManager` 构造：`DefaultToolCallingManager(ObservationRegistry, ToolCallbackResolver, ToolExecutionExceptionProcessor)`，含 `SpringBeanToolCallbackResolver`（按 Spring bean 名解析 ToolCallback，见 §2.1 类清单）。

---

## 问题 3：工具列表传入 ChatModel 的方式

### 3.1 ChatOptions 侧：`ToolCallingChatOptions`（spring-ai-model）——唯一入口

`javap -p` 原文：

```
public interface org.springframework.ai.model.tool.ToolCallingChatOptions extends org.springframework.ai.chat.prompt.ChatOptions {
  public static final boolean DEFAULT_TOOL_EXECUTION_ENABLED;
  public abstract java.util.List<org.springframework.ai.tool.ToolCallback> getToolCallbacks();
  public abstract void setToolCallbacks(java.util.List<org.springframework.ai.tool.ToolCallback>);
  public abstract java.util.Set<java.lang.String> getToolNames();
  public abstract void setToolNames(java.util.Set<java.lang.String>);
  public abstract java.lang.Boolean getInternalToolExecutionEnabled();
  public abstract void setInternalToolExecutionEnabled(java.lang.Boolean);
  public abstract java.util.Map<java.lang.String, java.lang.Object> getToolContext();
  public abstract void setToolContext(java.util.Map<java.lang.String, java.lang.Object>);
  public static org.springframework.ai.model.tool.ToolCallingChatOptions$Builder builder();
}
```

- **`OpenAiChatOptions`**（spring-ai-openai，javap）：`public class org.springframework.ai.openai.OpenAiChatOptions implements org.springframework.ai.model.tool.ToolCallingChatOptions`，成员含 `setToolCallbacks(List<ToolCallback>)`、`setToolNames(Set<String>)`、`setInternalToolExecutionEnabled(Boolean)`、`setToolContext(Map)` 及 `setTools(List<OpenAiApi$FunctionTool>)`、`setToolChoice(Object)`、`setParallelToolCalls(Boolean)`。
- **`OllamaOptions`**（spring-ai-ollama，javap）：`public class org.springframework.ai.ollama.api.OllamaOptions implements org.springframework.ai.model.tool.ToolCallingChatOptions, org.springframework.ai.embedding.EmbeddingOptions`，同样有 `setToolCallbacks(List<ToolCallback>)` 等全套。仓库当前 `ChatModelFactory` 同时构建 OpenAI 与 Ollama 两个模型（`sw-basic-agent/.../ChatModelFactory.java` 第 67-103 行），两者均支持同一工具注入方式。
- 无 `functions(Set<String>)` 旧式方法；工具名方式为 `setToolNames(Set<String>)`（配合 ToolCallbackProvider 解析）。

### 3.2 Prompt：构造函数不接受工具列表

`javap -p` Prompt 全部 8 个构造函数：`(String)`、`(Message)`、`(List<Message>)`、`(Message...)`、`(String, ChatOptions)`、`(Message, ChatOptions)`、`(List<Message>, ChatOptions)`、`mutate()`/`builder()`。**无任何接受 tool 列表的重载**——工具只能经 `ChatOptions`（即 `ToolCallingChatOptions.setToolCallbacks`）传入。

### 3.3 ChatModel.call() 内部自动委托 ToolCallingManager（agentic loop 内建于模型实现，Service 层无需手写循环）

`OpenAiChatModel.call(Prompt)` 字节码（`javap -p -c` 反汇编，原文关键行）：

```
public org.springframework.ai.chat.model.ChatResponse call(org.springframework.ai.chat.prompt.Prompt);
   2: invokevirtual #64   // Method buildRequestPrompt:(Prompt;)Prompt;   ← 合并 defaultOptions 与 prompt options
   9: invokevirtual #68   // Method internalCall:(Prompt;ChatResponse;)ChatResponse;

public org.springframework.ai.chat.model.ChatResponse internalCall(Prompt, ChatResponse);
  70: getfield  #60  // Field toolExecutionEligibilityPredicate:ToolExecutionEligibilityPredicate
  80: invokeinterface #133  // InterfaceMethod ToolExecutionEligibilityPredicate.isToolExecutionRequired:(ChatOptions;ChatResponse;)Z
  85: ifeq 157                        ← 不要求执行工具则直接返回
  89: getfield  #48  // Field toolCallingManager:ToolCallingManager
  95: invokeinterface #139  // InterfaceMethod ToolCallingManager.executeToolCalls:(Prompt;ChatResponse;)ToolExecutionResult;
 104: invokeinterface #145  // InterfaceMethod ToolExecutionResult.returnDirect:()Z
 109: ifeq 132
 112..131: 构建 ChatResponse（generations 来自 ToolExecutionResult.buildGenerations）并返回
 132: new Prompt(conversationHistory, options)   ← 用工具结果构造新 Prompt
 153: invokevirtual #68   // Method internalCall:(Prompt;ChatResponse;)ChatResponse   ← 递归再调模型（循环）
 157: aload 5 ; areturn
```

即：`OpenAiChatModel` 构造时注入 `ToolCallingManager` + `ToolExecutionEligibilityPredicate`（构造签名第 6 参为 predicate；`DEFAULT_TOOL_CALLING_MANAGER` 由 `ToolCallingManager.builder().build()` 静态生成）；`call()` 内部在判定"需要执行工具"后调用 `manager.executeToolCalls(prompt, response)` 得到含 `ToolResponseMessage` 的 `conversationHistory`，若 `returnDirect()` 为真则直接包装返回，否则以 `new Prompt(conversationHistory, options)` 递归 `internalCall` 再调模型——**整个 tool-call 往返循环在 ChatModel 内部完成，ServiceImpl 不需要自写 agentic loop**。判定入口 `ToolExecutionEligibilityPredicate` 是构造函数可替换的 `BiPredicate<ChatOptions, ChatResponse>` 接口（javap：`public interface ... extends java.util.function.BiPredicate<ChatOptions, ChatResponse>`，默认方法 `isToolExecutionRequired` 仅做 null 断言后委托 `test()`），默认实现由 Spring Boot 自动装配（`spring-ai-autoconfigure-model-*`，含 `spring-ai-autoconfigure-model-tool` 模块，m2 存在），其语义（是否检查 `internalToolExecutionEnabled`）未在本任务探查的 jar 内验证——接口本身可注入自定义实现。

---

## 问题 4：SwJobBean 内部 handler 注册/调用先例

### 4.1 JobHandler 接口（`sw-basic-job-api/.../handler/JobHandler.java`）

`/data/reasonix/files/Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/handler/JobHandler.java`（全文 37 行）——**带参数传入**，两个方法：

```java
public interface JobHandler {
    void execute(String params) throws Exception;   // 第 26 行，params=任务参数（JSON 字符串，可为 null）
    String getName();                                // 第 36 行，返回值应与实现类 Spring Bean 名称一致
}
```

Javadoc 明确（第 12-13 行）：实现类 `@Component("myHandler")`，bean name 即 handler 名称；`execute` 接收 `JobInfo.beanParams`（JSON 字符串），无参数传 null；异常均视为失败由调度框架捕获。

### 4.2 handlerMap 填充方式：Spring 容器按接口类型自动收集，非自我注册、非配置表登记

`/data/reasonix/files/Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/SwJobBean.java` 第 61-62 行：

```java
@Autowired(required = false)
private java.util.Map<String, JobHandler> handlerMap;
```

`@Autowired Map<String, JobHandler>` 即 Spring 语义的 `ApplicationContext.getBeansOfType(JobHandler.class)`——**凡实现 JobHandler 接口的 Spring bean 自动进入 map**（key=bean 名称），无需 `@PostConstruct` 自我注册，也无配置表/白名单登记。

### 4.3 调用侧：字符串 key 直接 `map.get(key)`，不经过 ApplicationContext.getBean

`SwJobBean.java` 第 140-149 行 `executeBean`：

```java
private void executeBean(JobInfo jobInfo) throws Exception {
    if (jobInfo.getBeanName() == null || jobInfo.getBeanName().isBlank()) { throw ... "BEAN 类型任务缺少 beanName"); }
    if (handlerMap == null || !handlerMap.containsKey(jobInfo.getBeanName())) {
        throw new IllegalStateException("未找到 JobHandler Bean: " + jobInfo.getBeanName());
    }
    JobHandler handler = handlerMap.get(jobInfo.getBeanName());
    handler.execute(jobInfo.getBeanParams());
}
```

key 来源：`JobInfo.beanName`（DB 存储，Quartz 任务注册时 `QuartzSchedulerService` 只把 `jobId`/`triggerType` 放入 JobDataMap，见 `QuartzSchedulerService.java` 第 100-102、134-137 行；beanName 在 SwJobBean 内按 jobId 查库获得）。

### 4.4 安全边界：**仅接口类型约束，无额外白名单机制**

map 内容被 `@Autowired Map<String, JobHandler>` 限定为**只含实现 JobHandler 接口的 bean**。把 key 设为 `org.springframework.xxx` 之类的任意 Spring 内部 bean 名：因该 bean 不实现 JobHandler 接口，`handlerMap.containsKey` 为 false → 抛 `IllegalStateException("未找到 JobHandler Bean: ...")`（第 144-146 行）。**没有任何其他机制（无 URL/类白名单表、无自定义类型过滤器）**；语义上"名字任意、类型必须实现接口"。

### 4.5 参数传递：原样字符串透传，**框架层无 JSON 反序列化步骤**

`handler.execute(jobInfo.getBeanParams())`——DB 中字符串参数**原样**传给 handler，SwJobBean/Quartz 层不做反序列化；JSON 解析职责在 handler 实现内部（JobHandler Javadoc 第 13 行同样声明"接收 JSON 字符串"）。与之呼应的是 JobLog 侧 `jobLog.setJobParams(jobInfo.getBeanParams())`（第 99 行）同样存原始字符串。

---

## 问题 5：外部 HTTP 调用先例

### 5.1 testConnection() 实现细节（`sw-basic-agent/.../service/impl/AgentModelConfigServiceImpl.java`）

- **HTTP 客户端**：Spring `RestClient`（`org.springframework.web.client.RestClient`，第 23 行 import）+ `SimpleClientHttpRequestFactory`（第 19 行 import）。第 148-154 行：

```java
SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
requestFactory.setConnectTimeout((int) TEST_CONNECT_TIMEOUT.toMillis());
requestFactory.setReadTimeout((int) TEST_READ_TIMEOUT.toMillis());
RestClient client = RestClient.builder()
        .baseUrl(entity.getBaseUrl())
        .requestFactory(requestFactory)
        .build();
```

- **超时**：硬编码常量，第 51-52 行 `TEST_CONNECT_TIMEOUT = Duration.ofSeconds(5)`、`TEST_READ_TIMEOUT = Duration.ofSeconds(5)`——**connectTimeout 与 readTimeout 均为 5 秒，不读 DB 字段**（类注释第 39-40 行明确：`timeoutSeconds`/`retryCount` 仅落库存储，不在连通性测试中生效）。
- **按 protocolType 的 URL 构造**：真实存在，第 155-159 行 switch：

```java
String path = switch (entity.getProtocolType()) {
    case "openai" -> "/models";
    case "ollama" -> "/api/tags";
    default -> ""; // "other"（或未知值兜底）：仅探测可达性，不校验响应体
};
```

- **可达性判定**：按**异常类型**区分，不是 status code 范围判断。第 164-176 行：
  - 正常 2xx：`spec.retrieve().toBodilessEntity()` 不抛异常 → `success=true`，"连接成功"；
  - `RestClientResponseException`（4xx/5xx 即服务端可达）→ `success=true`，message="服务可达（HTTP <status>）"（第 167-170 行，含"鉴权/路径问题判定成功"注释）；
  - `ResourceAccessException`（连接超时/拒绝/DNS 失败）→ `success=false`，message 取 `e.getCause().getMessage()`（第 171-176 行）。
  - 注意：**任何 HTTP 状态码响应都判可达**，只有网络层异常判不可达。

### 5.2 全仓库 HTTP 客户端普查

**任务给定模式**：`find . -path '*/.claude*' -prune -o -type f -name "*.java" -print | xargs grep -l "RestTemplate\|WebClient\|HttpClient\|HttpURLConnection" 2>/dev/null`——**0 个文件命中**（364 个 Java 文件全查，xargs 退出码 123 且无任何输出；复跑确认）。

**补充普查（RestClient/OkHttp/SimpleClientHttpRequestFactory/JdkClientHttpRequestFactory）**：命中 2 个文件：

1. `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImpl.java`（即 5.1 的 testConnection）。
2. `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java` 第 110-118 行 `buildRestClientBuilder(AgentModelConfig config)`：

```java
private RestClient.Builder buildRestClientBuilder(AgentModelConfig config) {
    int timeoutSeconds = config.getTimeoutSeconds() == null
            ? DEFAULT_TIMEOUT_SECONDS
            : Math.max(1, config.getTimeoutSeconds());
    SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout(Duration.ofSeconds(timeoutSeconds));
    requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
    return RestClient.builder().requestFactory(requestFactory);
}
```

（`DEFAULT_TIMEOUT_SECONDS = 30`，第 45 行；connect/read 同值，从 `AgentModelConfig.timeoutSeconds` DB 字段读；用于向 OpenAiApi/OllamaApi 注入 RestClient，第 70、89 行）——这是**第二个"动态构造 HTTP 客户端"先例**，但 URL 是固定 baseUrl，无方法/URL 可配置。

**判定：仓库内 HTTP 先例仅 testConnection（RestClient GET 探测）与 ChatModelFactory（RestClient 注入给 AI API 客户端）；两者 URL/方法均不可由运行期数据配置，无通用 HTTP 工具调用先例。** 任务描述的 BPM `ExternalDatasourceManager` 为纯 JDBC，本任务未将其纳入 HTTP 先例。

---

## 问题 6：建表参考——V19 脚本 + JSON 字段类型惯例

### 6.1 V19 两个脚本完整内容

**H2**（`sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql`，全文）：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V19: 初始化大模型接入配置表 (H2)
-- M07-F01 大模型管理：API Key 以 AesGcmCipher 密文（CLOB）落库
-- ===================================================================
CREATE TABLE sw_agent_model_config (
    id              BIGINT NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    protocol_type   VARCHAR(32) NOT NULL,
    base_url        VARCHAR(500) NOT NULL,
    model_name      VARCHAR(100) NOT NULL,
    api_key_cipher  CLOB,
    temperature     DECIMAL(4,2),
    max_tokens      INT,
    top_p           DECIMAL(4,2),
    timeout_seconds INT NOT NULL DEFAULT 30,
    retry_count     INT NOT NULL DEFAULT 0,
    enabled         SMALLINT NOT NULL DEFAULT 1,
    remark          VARCHAR(500),
    create_time     TIMESTAMP,
    create_by       VARCHAR(64),
    update_time     TIMESTAMP,
    update_by       VARCHAR(64),
    deleted         SMALLINT NOT NULL DEFAULT 0,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_sw_agent_model_name ON sw_agent_model_config (tenant_id, name);
CREATE INDEX idx_sw_agent_model_tenant_deleted ON sw_agent_model_config (tenant_id, deleted);
```

**PostgreSQL**（`sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V19__init_agent_model_config.sql`，全文，除注释外结构相同）：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V19: 初始化大模型接入配置表 (PostgreSQL)
-- M07-F01 大模型管理：API Key 以 AesGcmCipher 密文（TEXT）落库
-- ===================================================================
CREATE TABLE sw_agent_model_config (
    id              BIGINT NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    protocol_type   VARCHAR(32) NOT NULL,
    base_url        VARCHAR(500) NOT NULL,
    model_name      VARCHAR(100) NOT NULL,
    api_key_cipher  TEXT,
    temperature     DECIMAL(4,2),
    max_tokens      INT,
    top_p           DECIMAL(4,2),
    timeout_seconds INT NOT NULL DEFAULT 30,
    retry_count     INT NOT NULL DEFAULT 0,
    enabled         SMALLINT NOT NULL DEFAULT 1,
    remark          VARCHAR(500),
    create_time     TIMESTAMP,
    create_by       VARCHAR(64),
    update_time     TIMESTAMP,
    update_by       VARCHAR(64),
    deleted         SMALLINT NOT NULL DEFAULT 0,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_sw_agent_model_name ON sw_agent_model_config (tenant_id, name);
CREATE INDEX idx_sw_agent_model_tenant_deleted ON sw_agent_model_config (tenant_id, deleted);

COMMENT ON TABLE sw_agent_model_config IS 'M07 大模型接入配置';
COMMENT ON COLUMN sw_agent_model_config.protocol_type IS '协议类型：openai/ollama/other';
COMMENT ON COLUMN sw_agent_model_config.api_key_cipher IS 'API Key 密文（AesGcmCipher）';
```

### 6.2 全仓库 JSON 字段类型惯例分布

`find sw-bootstrap -name "*.sql" | xargs grep -l "TEXT\|CLOB\|LONGTEXT\|json"` 命中 4 个文件（含 target 副本去重后 2 组）：job V17（H2+PG）、agent V19（H2+PG）。**sw-bootstrap 全部 56 个 SQL 文件中无 LONGTEXT、无 json/jsonb 类型**。再补查 sw-biz-form / sw-bpm 模块自己的 Flyway 脚本（任务指定重点），得到三种惯例并存：

| 位置 | 字段 | H2 | PostgreSQL | 备注 |
|---|---|---|---|---|
| agent V19（上表） | api_key_cipher（密文） | CLOB | TEXT | H2/PG 类型不同 |
| job V17 `job/h2|pg/V17__init_job_tables.sql` | bean_params、form_data（JSON）、job_params、result_msg、exception_stack | **TEXT** | **TEXT** | JSON 字段（bean_params 注释 'Bean 方法参数（JSON）'，PG 第 41/43 行；H2 同列同类型）**H2 与 PG 同类型** |
| bpm `sw-bpm/sw-bpm-process/.../bpm/h2|pg/V14__add_process_def.sql` | graph_json（ProcessGraph JSON） | **clob**（小写） | **text** | 脚本注释第 13/17 行显式写明"graph_json = clob（H2）/ text（PG），存储 ProcessGraph JSON" |
| form `sw-biz-form/.../form/h2|pg/V7__init_form_metadata.sql` | definition（表单 schema JSON） | **JSON** | **JSONB** | 全仓库唯一使用原生 JSON 类型的表（H2 `JSON NOT NULL`，PG `JSONB NOT NULL`；PG 注释第 54/75 行） |

**判定**：全仓库 JSON 结构体字段的两种主流通例——①JSON 短参数串（job V17 的 bean_params/form_data）：**H2 与 PG 均用 TEXT**，两库保持一致；②较长 JSON 文档（V19 密文、V14 图文档）：H2 用 CLOB、PG 用 TEXT（V14 脚本注释把该对偶明示为仓库惯例）；③form 模块例外地使用原生 JSON/JSONB。**LONGTEXT 全仓库零使用**。

---

## 汇总表

| # | 问题 | 结论 | 关键证据位置 |
|---|---|---|---|
| 1 | LangGraph4j 工具机制 | **无任何 ToolNode/工具类**；框架不感知 tool_calls，工具执行须开发者自写节点；图结构能力仅有 addNode/addEdge/addConditionalEdges | `langgraph4j-core-1.5.14.jar` `jar tf \| grep -i tool` 空输出；StateGraph javap 签名；`AgentGraphFactory.java` L68-78 |
| 2 | ToolCallback 动态构造 | `FunctionToolCallback.builder(String, Function/BiFunction).description().inputSchema().build()` 支持 lambda 动态构造；`MethodToolCallback.builder().toolMethod(Method).toolObject(bean).build()` 支持反射构造；`ToolCallingManager.executeToolCalls(Prompt, ChatResponse)` 自动执行并产出含 ToolResponseMessage 的 conversationHistory | `spring-ai-model-1.0.4.jar` ToolCallback/FunctionToolCallback$Builder/MethodToolCallback$Builder/ToolCallingManager javap 原始输出 |
| 3 | 工具传入 ChatModel | 经 `ToolCallingChatOptions`（`setToolCallbacks(List<ToolCallback>)` 等），OpenAiChatOptions 与 OllamaOptions 均实现之；Prompt 无工具重载；**agentic loop 内建于 ChatModel.call()**（internalCall 递归 + ToolCallingManager.executeToolCalls），Service 层无需自写循环 | `OpenAiChatModel.internalCall` 字节码（invokeinterface ToolCallingManager.executeToolCalls / 递归 internalCall）；Prompt javap 8 个构造器 |
| 4 | SwJobBean handler 机制 | handlerMap 由 `@Autowired Map<String,JobHandler>` 自动收集（=getBeansOfType 接口约束）；字符串 key 直接 map.get；**安全边界仅接口类型，无额外白名单**；参数 JSON 字符串原样透传，框架层无反序列化 | `SwJobBean.java` L61-62、L140-149；`JobHandler.java` L26/L36 |
| 5 | 外部 HTTP 先例 | testConnection：RestClient + SimpleClientHttpRequestFactory，超时硬编码 5s/5s，openai→/models、ollama→/api/tags、other→根路径，异常类型判定可达性（任何 HTTP 状态码判可达）；按给定模式普查 **0 命中**，补查 RestClient 命中 ChatModelFactory.buildRestClientBuilder（timeoutSeconds 读库）——**无通用 HTTP 工具调用先例** | `AgentModelConfigServiceImpl.java` L51-52、L148-176；`ChatModelFactory.java` L110-118 |
| 6 | V19 + JSON 字段惯例 | V19 全文已贴；JSON 字段惯例：job V17 bean_params 等 **H2/PG 均 TEXT**；较长文档 V14 graph_json/V19 密文 **H2=CLOB、PG=TEXT**；form V7 例外用原生 JSON/JSONB；LONGTEXT 零使用 | V19 两个脚本全文；V17 H2 L15-17/38/43-44 与 PG 同名；V14 注释 L13/17 + L36/33；V7 L41/61 |

**注意点**（如实汇报，不做设计建议）：
1. `ToolExecutionEligibilityPredicate` 默认实现位于 `spring-ai-autoconfigure-model-*`（m2 存在该模块但本任务未探查），判定"是否需要执行工具"的默认语义（是否检查 `internalToolExecutionEnabled`）在 ChatModel 侧为可注入接口，未在本任务验证范围。
2. `FunctionToolCallback.Builder` 无 name setter——工具名只能经 `builder(String name, ...)` 首参传入。
3. MethodToolCallback 的 `ToolDefinition` 不会从注解推导，须显式 `DefaultToolDefinition.builder().name().description().inputSchema()` 提供。
4. 任务给定 HTTP 普查模式的 4 个类名（RestTemplate/WebClient/HttpClient/HttpURLConnection）在仓库 364 个 Java 文件中 0 命中，但仓库实际使用 `RestClient`——已单独补查并给出 2 处先例。
