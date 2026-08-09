# Step 2：后端编排执行引擎（LangGraph4j 最小图 + 动态模型客户端）

## 1. 当前状态

- **功能**：agent-model-orchestration（M07-F01 大模型管理 + M07-F02 编排引擎部分）
- **前置 Step**：Step 1（大模型注册管理 CRUD + 加密 + 连通性测试）已 PASSED，归档于 `product/agent-model-orchestration/passed/step-1-backend-model-management.md`，产出 `AgentModelConfig` 实体/`sw_agent_model_config` 表/`AesGcmCipher` bean（名称 `agentAesGcmCipher`，定义于 `AgentModelAutoConfiguration`）
- **前置调研**：`search_fallback/m07-step2-orchestration-engine-precedent.md`（D54 已核验通过），本方案的全部技术依据来自此回执，不额外凭训练记忆凑造 LangGraph4j/Spring AI API 细节
- **本 Step 定位**：让 `AgentGraphAutoConfiguration`（Step1 起一直是空壳占位）首次落地真实内容——用 LangGraph4j 构造一个**最小可运行的单节点图**，节点内用 Spring AI 按 `AgentModelConfig` 动态构造 `ChatModel` 并发起一次真实调用，验证"配置驱动的编排引擎"整条链路能跑通。同时完成 Step1 §10 约束 6 中明确标记"推迟到 Step 2"的**动态装载**（`temperature`/`maxTokens`/`topP`/`timeoutSeconds`/`retryCount` 在本 Step 首次真正生效）。
- **不属于本 Step**（见 §17）：工具沙箱（内部白名单方法调用 + 外部白名单 HTTP 调用，D48）、图定义 CRUD/持久化、`sw_agent_` 会话/消息/工具调用表、多轮对话/消息历史、前端图设计器、多 Key 轮询、额度限流。这些留给后续 Step，理由见 §5。

## 2. Step 目标

在 `sw-basic-agent` 模块落地：
1. `ChatModelFactory`：给定一条 `AgentModelConfig`，按 `protocolType` 动态构造对应的 Spring AI `ChatModel`（openai→`OpenAiChatModel`，ollama→`OllamaChatModel`），并把 `temperature`/`maxTokens`/`topP`/`timeoutSeconds`/`retryCount` 真正传入构造（本 Step 完成"动态装载"）
2. `AgentGraphFactory` + 填充后的 `AgentGraphAutoConfiguration`：一个只含一个真实节点（调用模型）的 `StateGraph<AgentState>`，编译为单例 `CompiledGraph<AgentState>` Bean
3. `AgentOrchestrationService`：加载配置→解密 Key→用 `ChatModelFactory` 构造 `ChatModel`→把 `ChatModel`+用户输入放入初始状态→调用注入的 `CompiledGraph` 执行→取出输出
4. 一个受权限保护的 REST 端点，手动触发上述流程，作为"引擎已跑通"的可验证证据

验收后，M07-F01 五条 PRD 明细中"动态装载"补齐（Step1 已完成"模型接入""密钥管理""连通性测试"，本 Step 完成"动态装载"，"多Key轮询/额度限流"仍推迟），M07-F02"编排执行引擎"从空壳变为可运行的最小实现。

## 3. 推荐模型

推荐模型：deepseek-v4-pro
选择理由：涉及核心架构落地（LangGraph4j 编排引擎首次真实使用，仓库零先例）、涉及安全敏感操作（解密 API Key 用于真实出站调用）、涉及不确定的第三方库真实用法需要现场 javap/反复编译验证（§6 列出多项"以现场确认为准"的细节），符合 system.md §2.3 多项升级条件（核心架构重构 + 权限安全 + 需求存在技术风险需要系统性验证）。
是否触发升级条件：是 — 核心架构重构（编排引擎）+ 安全敏感（解密 Key 出站调用）+ 技术风险需要现场验证（LangGraph4j 真实用法无仓库先例可抄）

## 4. 模型选择理由

（同 §3 补充）本 Step 与 Step1 不同：Step1 的加密/表结构/权限码均有仓库内真实先例可以照抄，风险主要在"正确抄对签名"；本 Step 的 LangGraph4j 图构造是仓库和本次调研都**没有完整可运行示例**的领域（D54 回执只确认了类和方法签名，没有确认一段完整能跑通的 wiring 代码）。执行代理需要具备"读 javap 输出、自己试构造、编译报错后调整"的迭代验证能力，Flash 模型在这种"签名对但组合方式不确定"的场景容易凑造出编译不过或语义错误的代码，必须用 Pro。

## 5. 已知上下文

**关于范围裁定（D54 回执揭示的关键事实，直接决定本 Step 边界）**：

- **图定义无库支持**：D54 §6 确认 LangGraph4j `StateGraph` 只支持 Java 代码显式 `addNode`/`addEdge` 构造，jar 内不存在 JSON/YAML 反序列化图结构的入口。结合 D47（前端图设计器留后续 Step），本 Step 的图**保持纯代码硬编码**，不建图定义 CRUD 表、不做图定义持久化——这不是简化，是当前技术栈的真实限制
- **checkpoint 无 DB 实现**：D54 §1 确认 LangGraph4j 内置 checkpoint 仅 `FileSystemSaver`，无 JDBC/DB 实现。本 Step 的编排是**同步请求-响应式一次性调用**（用户发起→模型答复→结束），不需要跨请求保留图状态，因此**不使用 `CompileConfig`/`BaseCheckpointSaver`**，用 `compile()` 无参重载即可，规避"需要自写 DB checkpoint"这个未解决的技术缺口
- **`sw_agent_` 表前缀边界未定**：D54 §5 确认这仅是表前缀预留，无字段级规划，归属 Step2 还是 M07-F04 需规划层裁定——**本 Step 裁定为：不在本 Step 引入**。理由：本 Step 是单轮同步调用，不构成"会话"（无多轮上下文、无消息历史persist需求），会话/消息表的语义应等到 M07-F04（对话交互）真正设计多轮交互时再建，避免表结构因猜测未来需求而设计错误
- **工具沙箱不在本 Step**：D54 §4/§8 确认工具调用接口（`@Tool`/`ToolCallback`/`MethodToolCallback`）仓库零使用、内部白名单模板（`SwJobBean`）和外部白名单模板（`SqlExecutor.validateSql`）是两条不同的安全设计面，且 D48 要求"数据配置而非代码配置"意味着还需要一层"注册表→配置表"映射设计。这些设计决策量足以构成独立 Step，塞进本 Step 会重复 Step1"单 Step 范围过大"的风险，因此推迟到 Step 3，本 Step 只交付"引擎能跑通"这一个可验证目标

**关于技术实现（D54 回执确认的真实签名，直接引用不凭记忆改写）**：

- `StateGraph<State extends AgentState>` 构造器三选一，本 Step 用 `StateGraph(Map<String,Channel<?>>, AgentStateFactory<State>)`（D54 §1.1）；`addNode(String, AsyncNodeAction<State>)`、`addEdge(String,String)`、`compile()` 均已确认存在（D54 §1.1/§1.2）
- `AgentState(Map<String,Object>)` 公开构造器、`data()`/`value(String)` 访问器已确认（D54 §1.3）
- `Channels.base(Supplier<T>)` 覆盖型 channel 已确认（D54 §1.3），本 Step 每个 state key 用覆盖型（非追加型 `appender`，因为单轮调用不需要历史列表）
- `NodeAction<S> { Map<String,Object> apply(S) throws Exception; }` 同步接口 + `AsyncNodeAction.node_async(NodeAction<S>)` 转换方法已确认（D54 §1.4）
- `OpenAiApi.builder().baseUrl(String).apiKey(String).build()`、`OpenAiChatModel.builder().openAiApi(...).defaultOptions(...).retryTemplate(...).build()` 已确认（D54 §2）；`OllamaApi.builder().baseUrl(String)`、`OllamaChatModel` 公开构造器同样已确认（D54 §2）
- `RetryTemplate.builder()...build()`（`org.springframework.retry.support.RetryTemplate`）已被 D54 §2 提及为可用于按 `retryCount` 动态构造重试策略的手段

**关于以下细节，D54 回执只确认类/方法存在，未确认完整调用组合方式，执行时必须现场验证，禁止凑造（详见 §6/§10/§11）**：
1. `AgentStateFactory<State>` 函数式接口的确切方法签名（是否 `AgentState::new` 可直接作为该接口的方法引用）
2. LangGraph4j 标记图入口节点的确切写法（是否是 `addEdge(StateGraph.START, "node")`，还是有专门的 `setEntryPoint` 方法）
3. `CompiledGraph.invoke()` 在节点 `apply()` 抛异常时的真实行为（是否原样抛出、包装成 `RuntimeException`、还是返回空 `Optional`）——**这一点直接决定 `AgentOrchestrationService` 的异常处理写法，执行代理必须先用最小 spike 代码在本地实测确认，不得假设**
3. `OpenAiChatOptions`/`OllamaOptions` Builder 的确切 setter 方法名（`temperature`/`maxTokens`/`topP`/`model` 等，D54 §2 只说"均有对应 setter 族"未逐一列出）
4. `OpenAiApi` 的默认 `completionsPath`（决定本地 mock HTTP 服务器要监听的路径）

**权限码延续 Step1 惯例**：`模块:实体:动作`，本 Step 新增 `agent:orchestration:run`（触发一次编排执行），与 Step1 已有的 `agent:model:{view,manage,test}` 不冲突不重叠

## 6. 执行前必须读取的文件

| # | 文件路径 | 读取目的 |
|---|------|------|
| 1 | `search_fallback/m07-step2-orchestration-engine-precedent.md`（规划层目录，非 `Smart-WorkFlow/`） | 本方案的直接技术依据全文 |
| 2 | `product/agent-model-orchestration/passed/step-1-backend-model-management.md`（规划层目录） | Step1 完整方案，`AgentModelConfig` 字段/权限码约定/包结构惯例 |
| 3 | `product/agent-model-orchestration/receipts/step-1-execution.md`（规划层目录） | Step1 **实际**落地细节（`AesGcmCipher` bean 真实构造方式、实际使用的类名/字段名，可能与方案文字有偏差，以回执为准） |
| 4 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentGraphAutoConfiguration.java` | 现有空壳内容，确认本 Step 要填充的确切文件现状 |
| 5 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentModelAutoConfiguration.java` | 确认 `AesGcmCipher` bean 名称、`@ComponentScan` basePackages 现有范围（本 Step 设计为不修改此文件，需确认新增的 `service`/`controller` 包路径确实落在其扫描范围内） |
| 6 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java` + `mapper/AgentModelConfigMapper.java` | 确认真实字段名/类型（`temperature`/`topP` 是否为 `BigDecimal`，`retryCount`/`timeoutSeconds` 是否为 `Integer`，用于 §9 类型转换代码） |
| 7 | `Smart-WorkFlow/sw-basic/sw-basic-agent/pom.xml` | 确认 `spring-ai-model`（含 `ChatModel`/`Prompt`/`ChatResponse` 核心类所在 jar）是否已通过 `spring-ai-starter-model-openai`/`ollama` 传递引入，无需新增依赖 |
| 8 | 本机 `~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar`，用 `javap` 核对：`AgentStateFactory` 接口方法签名、`StateGraph.START`/`END` 的入边标准写法（是否有 `setEntryPoint` 等价方法）、`CompiledGraph.invoke()` 异常传播行为（若 javap 无法确定，需写最小 spike 测试实测，见 §11） | 消解 §5 列出的 4 项未确认细节之 1/2/3 |
| 9 | 本机 `~/.m2/repository/org/springframework/ai/spring-ai-openai/1.0.4/spring-ai-openai-1.0.4.jar`，用 `javap` 核对：`OpenAiChatOptions.Builder` 的 setter 方法名、`OpenAiApi` 默认 `completionsPath` 常量值 | 消解 §5 列出的未确认细节之 4，以及节点内代码的确切写法 |
| 10 | `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImplTest.java`（Step1 产出） | 参照本地 `com.sun.net.httpserver.HttpServer` mock 手法、`@SpringBootTest`+H2 测试写法，本 Step 沿用同一套手法 |
| 11 | `memory/constraints.md`（规划层目录） | 二次确认 superAdmin 绕过权限、API Key 不落明文日志/异常/DTO 的硬约束 |

## 7. 允许修改的文件范围

| 文件路径（相对于 `Smart-WorkFlow/`） | 修改类型 | 说明 |
|------|:---:|------|
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentGraphAutoConfiguration.java` | **修改（填充空壳）** | 保留现有 `@ConditionalOnProperty` 注解不变，新增 `@Bean ChatModelFactory chatModelFactory()`、`@Bean CompiledGraph<AgentState> agentCompiledGraph()` |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java` | **新建** | 按 `protocolType` 分支构造 `ChatModel`，非 `@Component`，由 `AgentGraphAutoConfiguration` 手动 `new` 后注册为 Bean |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java` | **新建** | 纯代码构造最小 `StateGraph<AgentState>` 并 `compile()`，静态方法或无状态实例方法，供 `AgentGraphAutoConfiguration` 和单测直接调用（单测不需要 Spring 上下文） |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/AgentOrchestrationService.java` | **新建** | Service 接口：`AgentOrchestrationRunRespDTO run(AgentOrchestrationRunReqDTO req)` |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java` | **新建** | 加载配置→解密→构造 ChatModel→调用图→处理异常 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentOrchestrationController.java` | **新建** | `POST /agent/orchestration/run`，权限码 `agent:orchestration:run` |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentOrchestrationRunReqDTO.java` | **新建** | `agentModelConfigId(Long), input(String)` |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentOrchestrationRunRespDTO.java` | **新建** | `success(boolean), output(String), errorMessage(String), latencyMs(long)` |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphFactoryTest.java` | **新建** | 纯 JUnit（不用 `@SpringBootTest`），验证图构造/编译/执行 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/ChatModelFactoryTest.java` | **新建** | 纯 JUnit，验证协议分支构造正确性 + 非法协议拒绝 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImplTest.java` | **新建** | `@SpringBootTest`，本地 mock HTTP 服务器端到端验证 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentOrchestrationControllerTest.java` | **新建** | 权限校验测试 |

## 8. 禁止修改的范围

- ❌ **禁止**修改 `AgentModelAutoConfiguration.java`（Step1 产出，本 Step 新增的 Service/Controller 类放在其 `@ComponentScan` 已覆盖的 `com.sw.ck.agent.service`/`com.sw.ck.agent.controller` 子包下即可自动被扫描，不需要改动扫描范围；`ChatModelFactory`/`AgentGraphFactory` 走手动 `@Bean` 而非 `@Component` 扫描，同样不需要改动扫描范围）
- ❌ **禁止**修改 `AgentModelConfig.java`/`AgentModelConfigMapper.java`/`AgentModelConfigService(Impl).java`/`AgentModelController.java`（Step1 产出，只读引用，不改动）
- ❌ **禁止**修改 Step1 的 Flyway 脚本（`V19__init_agent_model_config.sql` 或实际版本号），本 Step 不新建任何数据库表（图定义/会话/消息/工具调用表均推迟，见 §5）
- ❌ **禁止**引入任何工具调用/工具沙箱代码：不使用 `@Tool`、`ToolCallback`、`MethodToolCallback`、`ToolCallingManager` 等 `org.springframework.ai.tool.*` 包下任何类（D48 工具沙箱推迟到 Step 3）
- ❌ **禁止**使用 `CompileConfig`/`BaseCheckpointSaver`/`FileSystemSaver`（本 Step 不需要跨请求保留状态，见 §5）
- ❌ **禁止**新增任何 Maven 依赖（`langgraph4j-core`/`spring-ai-starter-model-openai`/`spring-ai-starter-model-ollama` 已在 pom 中，§6 第 7 项需现场确认 `spring-ai-model` 已被传递引入）
- ❌ **禁止**修改前端 `Smart-WorkFlow-Web/` 任何文件
- ❌ **禁止**修改 `sw-basic-storage`、`sw-basic-knowledge`、`sw-basic-iot`、`sw-basic-openapi`、`sw-bpm-engine` 任何文件
- ❌ **禁止**在图节点或 Service 代码中硬编码任何真实第三方 API Key（含测试代码）
- ❌ **禁止**引入 `Channels.appender`（消息历史列表），本 Step 单轮调用不需要累积状态

## 9. 详细执行方案

### 9.0 前置确认（不产出代码，仅确认事实）

按 §6 第 7-9 项，用 `mvn dependency:tree -pl sw-basic/sw-basic-agent` 确认 `spring-ai-model` 已传递引入；用 `javap` 反编译核对 §5 列出的 4 项未确认细节，把确认结果记入执行回执 §8"与原方案的偏差"。若 javap 反编译无法确定 `CompiledGraph.invoke()` 的异常传播行为，编写一个不提交的临时 spike 代码（在 `AgentGraphFactoryTest` 里直接测试即可，不需要额外临时文件）验证实际行为。

### 9.1 新建 `ChatModelFactory`

**文件**：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java`

```java
package com.sw.ck.agent.orchestration;

public class ChatModelFactory {

    private static final java.util.Set<String> SUPPORTED_PROTOCOLS = java.util.Set.of("openai", "ollama");

    public ChatModel build(AgentModelConfig config, String plainApiKey) {
        String protocol = config.getProtocolType();
        if (!SUPPORTED_PROTOCOLS.contains(protocol)) {
            throw new IllegalArgumentException("不支持的协议类型，无法构造模型客户端: " + protocol);
        }
        return switch (protocol) {
            case "openai" -> buildOpenAi(config, plainApiKey);
            case "ollama" -> buildOllama(config);
            default -> throw new IllegalStateException("不应到达: " + protocol); // 防御性分支，SUPPORTED_PROTOCOLS 已兜底
        };
    }

    private ChatModel buildOpenAi(AgentModelConfig config, String plainApiKey) {
        // OpenAiApi.Builder 的 apiKey(String) 在 plainApiKey 为空时如何处理未在 D54 中确认，
        // 执行时需现场验证（传 null 是否报错），若报错则仅在非空时调用 .apiKey(...)
        var apiApiBuilder = org.springframework.ai.openai.api.OpenAiApi.builder().baseUrl(config.getBaseUrl());
        if (plainApiKey != null && !plainApiKey.isEmpty()) {
            apiApiBuilder = apiApiBuilder.apiKey(plainApiKey);
        }
        var openAiApi = apiApiBuilder.build();
        var options = buildOpenAiOptions(config); // 具体 setter 方法名以 §6 第 9 项现场确认结果为准
        var retryTemplate = buildRetryTemplate(config.getRetryCount());
        return org.springframework.ai.openai.OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .retryTemplate(retryTemplate)
                .build();
    }

    private ChatModel buildOllama(AgentModelConfig config) {
        var ollamaApi = org.springframework.ai.ollama.api.OllamaApi.builder().baseUrl(config.getBaseUrl()).build();
        var options = buildOllamaOptions(config); // 具体 setter 方法名以现场确认结果为准
        return org.springframework.ai.ollama.OllamaChatModel.builder()
                .ollamaApi(ollamaApi) // 方法名以实际 Builder 签名为准，D54 未逐一列出 OllamaChatModel.Builder 方法
                .defaultOptions(options)
                .build();
    }

    private org.springframework.retry.support.RetryTemplate buildRetryTemplate(Integer retryCount) {
        int attempts = (retryCount == null ? 0 : Math.max(0, retryCount)) + 1;
        return org.springframework.retry.support.RetryTemplate.builder().maxAttempts(attempts).build();
    }

    // buildOpenAiOptions/buildOllamaOptions：把 temperature/maxTokens/topP 从 BigDecimal/Integer
    // 转换塞入对应 Options.Builder，具体 setter 名称以 §6 第 9 项 javap 结果为准，不得凑造
}
```

**说明**：`switch` 表达式的分支只有 2 个受支持协议 + 1 个显式拒绝，是"固定有限分支"，非"可扩展插件注册表"，与 D50（Step1 连通性测试）已被接受的按 `protocolType` 分支设计同构——不适用 §4.3 架构约定中针对**工具沙箱可插拔实现**的"禁 switch 分发"规则（该规则约束的是开放注册、按用户配置动态扩展的实现选择，不约束 Spring AI 目前只提供 2 种协议客户端这一固定事实）。

### 9.2 新建 `AgentGraphFactory`

**文件**：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java`

```java
package com.sw.ck.agent.orchestration;

public class AgentGraphFactory {

    public static final String NODE_CALL_MODEL = "callModel";

    public CompiledGraph<AgentState> buildGraph() throws GraphStateException {
        java.util.Map<String, Channel<?>> channels = java.util.Map.of(
                "input", Channels.base(() -> null),
                "output", Channels.base(() -> null),
                "chatModel", Channels.base(() -> null)
        );
        StateGraph<AgentState> graph = new StateGraph<>(channels, AgentState::new);
        // AgentState::new 是否满足 AgentStateFactory<AgentState> 函数式接口签名，
        // 以 §6 第 8 项 javap 确认结果为准；若签名不匹配，改为显式实现该函数式接口
        graph.addNode(NODE_CALL_MODEL, AsyncNodeAction.node_async(this::callModel));
        graph.addEdge(StateGraph.START, NODE_CALL_MODEL);
        // 若 javap 确认存在专门的入口节点标记方法（而非 addEdge(START,...)），改用该方法，语义等价
        graph.addEdge(NODE_CALL_MODEL, StateGraph.END);
        return graph.compile();
    }

    private java.util.Map<String, Object> callModel(AgentState state) throws Exception {
        ChatModel chatModel = (ChatModel) state.value("chatModel")
                .orElseThrow(() -> new IllegalStateException("初始状态缺少 chatModel"));
        String input = (String) state.value("input")
                .orElseThrow(() -> new IllegalStateException("初始状态缺少 input"));
        ChatResponse response = chatModel.call(new Prompt(input));
        String output = response.getResult().getOutput().getText();
        // getResult()/getOutput()/getText() 的确切方法名属于 Spring AI 公开 API 的训练常识，
        // 不属于本次仓库探索范畴（system.md §0.4），若实际方法名不符，执行时以编译报错为准调整
        return java.util.Map.of("output", output);
    }
}
```

### 9.3 填充 `AgentGraphAutoConfiguration`

在现有文件（保留现有 `@ConditionalOnProperty` 头部注解不变）中新增：

```java
@Bean
public ChatModelFactory chatModelFactory() {
    return new ChatModelFactory();
}

@Bean
public CompiledGraph<AgentState> agentCompiledGraph() throws GraphStateException {
    return new AgentGraphFactory().buildGraph();
}
```

不新增 `@ComponentScan`（§8 已禁止扩大扫描范围，本文件内两个 Bean 均手动构造，`AgentOrchestrationService`/`Controller` 由 Step1 已有的 `AgentModelAutoConfiguration` 的 `@ComponentScan` 覆盖）。

### 9.4 新建 DTO 二件

- `AgentOrchestrationRunReqDTO`：`agentModelConfigId(Long, 非空), input(String, 非空)`
- `AgentOrchestrationRunRespDTO`：`success(boolean), output(String), errorMessage(String), latencyMs(long)`

### 9.5 新建 `AgentOrchestrationService` + Impl

```java
public interface AgentOrchestrationService {
    AgentOrchestrationRunRespDTO run(AgentOrchestrationRunReqDTO req);
}
```

`AgentOrchestrationServiceImpl` 依赖注入：`AgentModelConfigMapper`（Step1 产出，直接读取，不走返回脱敏 DTO 的 Service 方法）、`AesGcmCipher agentAesGcmCipher`（Step1 已定义的 bean，按类型自动注入）、`ChatModelFactory`、`CompiledGraph<AgentState> agentCompiledGraph`。

实现要点：
1. `mapper.selectById(req.getAgentModelConfigId())`，不存在则抛 404 业务异常
2. `config.getApiKeyCipher()` 非空则 `aesGcmCipher.decrypt(...)` 得到明文 Key，解密出的局部变量只用于本方法内构造 `ChatModel`，不赋值给任何字段、不打日志、方法返回前变量作用域结束
3. `chatModelFactory.build(config, plainApiKey)` 构造 `ChatModel`；协议不支持时捕获 `IllegalArgumentException`，转为 `success=false` 响应（不是 500）
4. 记录开始时间，调用 `agentCompiledGraph.invoke(Map.of("input", req.getInput(), "chatModel", chatModel))`
5. **异常处理写法以 §6 第 8 项现场确认的 `invoke()` 真实行为为准**：若 `invoke()` 对节点异常包装抛出，则 try/catch 该异常转 `success=false`；若返回空 `Optional`，则对空值转 `success=false`；不得两种情况都不处理
6. 成功时从返回的 `AgentState` 取 `"output"` 值填入响应 DTO，`success=true`
7. 记录 `latencyMs = 结束时间 - 开始时间`

### 9.6 新建 `AgentOrchestrationController`

```java
@RestController
@RequestMapping("/agent/orchestration")
public class AgentOrchestrationController {

    @PostMapping("/run")
    @PreAuthorize("hasAuthority('agent:orchestration:run')")
    public AgentOrchestrationRunRespDTO run(@RequestBody @Validated AgentOrchestrationRunReqDTO req) { ... }
}
```

### 9.7 校验门

```bash
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile
mvn -q test
```

**预期结果**：编译零错误；`mvn test` BUILD SUCCESS，测试计数在 Step1 后基线（480）之上新增，已有测试不退化。

## 10. 关键实现约束

1. **协议白名单在 `ChatModelFactory` 内是固定 2 分支**，不做成可插拔注册表（§9.1 已说明理由），但**不得**因为"只有两种"就省略非法协议的显式拒绝——第三个分支必须存在且抛异常，不允许 `default` 静默返回 null
2. **明文 Key 生命周期最短化**：延续 Step1 §10 约束 2，解密出的明文变量只用于当次构造 `ChatModel`，不打日志、不进异常信息、不进响应 DTO 任何字段
3. **不确定的 API 细节必须现场验证，不得凑造**：§5/§9 中标注"以 javap/现场确认结果为准"的每一处，执行代理必须真正执行确认动作（javap 反编译、试编译、spike 测试），并在执行回执中记录确认结果和依据，不得为了让代码"看起来合理"直接照抄本方案的推测代码
4. **图保持单节点**：不为了"展示复杂度"额外添加无实际作用的节点或条件分支（YAGNI），"引擎跑通"的验收标准只要求一次真实端到端调用成功
5. **不引入 checkpoint/持久化**：`compile()` 使用无参重载，不传 `CompileConfig`
6. **动态装载字段全部生效**：`temperature`/`maxTokens`/`topP`/`timeoutSeconds`/`retryCount` 五个字段必须在 `ChatModelFactory` 构造出的客户端上体现真实效果（不能只是读出来不用），`timeoutSeconds` 的具体生效方式（`RestClient.Builder` 超时设置还是 `OpenAiApi.Builder` 是否暴露对应方法）以 §6 第 9 项现场确认结果为准，若确认无法在不新增依赖的情况下设置，需在执行回执中如实说明并标注为已知限制，不得虚报"已生效"

## 11. 边界情况

| 场景 | 处理方式 |
|------|------|
| `agentModelConfigId` 不存在 | 抛 404/业务异常，HTTP 层返回 4xx，不进入图执行 |
| `protocolType` 为 `other` 或非法值 | `ChatModelFactory.build` 抛 `IllegalArgumentException`，Service 层捕获转 `success=false`，不抛 500 |
| `apiKeyCipher` 为 null（如本地 Ollama 无鉴权） | 明文 Key 传 null/空，`OpenAiApi.Builder` 不调用 `.apiKey(...)`（Ollama 协议本身不需要 Key，无此分支） |
| 模型服务不可达（连接拒绝/超时/DNS 失败） | `chatModel.call()` 抛异常，经 §9.5 第 5 步的异常处理路径转 `success=false` + `errorMessage`，`latencyMs` 仍记录已耗时 |
| `CompiledGraph.invoke()` 节点内异常的真实传播方式（抛出 vs 空 Optional） | **执行时必须先实测确认（§9.0），不得假设**；确认结果决定 §9.5 第 5 步的具体写法 |
| 用户输入为空字符串 | DTO `@Validated` 校验非空拒绝，不进入图执行 |
| 并发多个请求同时调用 `/agent/orchestration/run` | `CompiledGraph` Bean 是单例但每次 `invoke()` 传入独立的初始状态 Map，不共享可变状态；`ChatModel` 实例是每次请求内新建的局部变量，不缓存不共享，天然无并发状态竞争 |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:---:|------|------|
| LangGraph4j 实际 wiring 与本方案推测代码不符（`AgentStateFactory`/入口边写法/异常传播） | 中 | 中 | §6 第 8 项要求现场 javap+spike 验证，方案已标注全部已知不确定点，不是"执行时才发现"的意外 |
| `OpenAiChatOptions`/`OllamaOptions` Builder 方法名不符 | 中 | 低 | 编译报错即可定位，属于纯语法调整，不影响架构 |
| 本地 mock HTTP 服务器返回的 JSON 结构与 Spring AI 实际期望的 OpenAI Chat Completions 响应格式不完全匹配，导致解析异常 | 中 | 中 | §13.2 测试先跑一次最小请求观察 Spring AI 实际发出的请求路径和期望的响应体结构（可先用一个"回显请求"的 mock handler 打印收到的请求，再据此构造正确响应） |
| `timeoutSeconds` 无法在不新增依赖情况下真正生效 | 低 | 低 | §10 约束 6 已要求如实标注为已知限制，不阻塞本 Step 其余验收项 |
| 解密后明文 Key 意外通过异常堆栈泄漏（如 `chatModel.call()` 抛出的异常信息包含请求头） | 低 | 高 | Service 层捕获异常后只提取 `getMessage()` 摘要，且需检查该摘要是否意外包含 Authorization 头内容（多数 HTTP 客户端异常信息不含请求头，但需在测试中显式断言 `errorMessage` 不含 apiKey 明文） |

**回滚方案**：`git checkout --`/`git rm` 还原新增和修改的文件（本 Step 唯一修改的已有文件是 `AgentGraphAutoConfiguration.java`，其余全部新建）。本 Step 不涉及数据库结构变更，无需 DDL 回滚。

**回滚验证**：`mvn -q compile && mvn -q test` BUILD SUCCESS，测试计数回落到 Step1 后基线（480）。

## 13. 测试方案

### 13.1 静态检查

| 检查项 | 命令 | 预期结果 |
|------|------|------|
| 编译验证 | `mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile` | 零错误 |
| 未引入工具调用相关类 | `grep -rn "org.springframework.ai.tool\|@Tool\|ToolCallback" sw-basic/sw-basic-agent/src/main/` | 零命中 |
| 未引入 checkpoint 相关类 | `grep -rn "CompileConfig\|CheckpointSaver\|FileSystemSaver" sw-basic/sw-basic-agent/src/main/` | 零命中 |
| 未修改 Step1 产出文件 | `git diff --stat -- sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentModelAutoConfiguration.java` | 无输出（无改动） |
| 未新增 Flyway 脚本 | `git status --porcelain -- sw-bootstrap/src/main/resources/db/migration/` | 无输出 |
| 明文 Key 未泄漏到 orchestration 包 | `grep -rn "plainApiKey\|getApiKey()" sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/ sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/` | 零命中 |
| 权限码格式一致 | `grep -o "agent:orchestration:[a-z]*" sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentOrchestrationController.java` | 恰好 1 个：`agent:orchestration:run` |
| 全量测试 | `mvn -q test` | BUILD SUCCESS，无失败/错误 |

### 13.2 单元测试

#### AgentGraphFactoryTest（新建，纯 JUnit，不用 `@SpringBootTest`）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | `buildGraph()` 不抛异常，返回非 null 的 `CompiledGraph` | 图构造+编译成功 |
| 2 | 传入手写测试用 `ChatModel` 实现（`call(Prompt)` 返回固定 `ChatResponse`），`invoke()` 后取出的 `output` 与预期文本一致 | 图执行成功路径，验证 START→callModel→END 全链路 |
| 3 | 传入抛异常的测试用 `ChatModel` 实现，验证 `invoke()` 的实际异常处理行为与 §9.0 现场确认结果一致 | 图执行失败路径，为 §9.5 异常处理逻辑提供验证依据 |

#### ChatModelFactoryTest（新建，纯 JUnit）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | `protocolType="openai"` 构造出的实例是 `OpenAiChatModel` | 分支正确性 |
| 2 | `protocolType="ollama"` 构造出的实例是 `OllamaChatModel` | 分支正确性 |
| 3 | `protocolType="other"` 或未知值抛 `IllegalArgumentException` | 白名单拒绝 |
| 4 | `retryCount=2` 构造出的 `RetryTemplate` 行为符合"最多 3 次尝试"（可通过让底层调用连续失败 2 次后第 3 次成功，断言最终成功，间接验证重试次数；若 `RetryTemplate` 不易在纯单元测试隔离验证，此项移入 §13.3 集成测试） | 动态装载中 `retryCount` 生效验证 |

#### AgentOrchestrationServiceImplTest（新建，`@SpringBootTest`）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | `agentModelConfigId` 不存在，返回业务异常/404 | 边界情况 |
| 2 | 正常 openai 配置 + 本地 mock HTTP 服务器返回合法响应，`run()` 返回 `success=true`，`output` 与 mock 响应一致 | 端到端成功路径 |
| 3 | mock 服务器不可达（未监听端口），`run()` 返回 `success=false`，`errorMessage` 非空且不含 apiKey 明文 | 端到端失败路径 + 安全断言 |

**测试策略**：延续 Step1 §13.2 的 `com.sun.net.httpserver.HttpServer` 本地 mock 手法，绑定 `localhost:0` 随机端口，测试内启动/关闭。mock 响应体需按 §6 第 9 项现场确认的 Spring AI 实际请求/响应格式构造（不得凑造 JSON 结构，需先观察一次真实请求-响应交互）。

### 13.3 集成测试

`mvn test` 启动 Spring 上下文时，`AgentGraphAutoConfiguration` 的两个新 Bean（`chatModelFactory`、`agentCompiledGraph`）必须正常装配（装配失败则整个测试套件无法启动），天然是集成验证，不再单独写装配测试类。

### 13.4 手工验证

无需手工验证。若需人工抽查，可用 `curl` 携带 superAdmin token 调用 `POST /agent/orchestration/run`，传入 Step1 已创建的一条真实可用配置（如指向本地 Ollama 服务），观察真实响应，非必需步骤。

### 13.5 回归检查

| 检查项 | 预期结果 |
|------|------|
| 已有测试通过数不减少 | `mvn test` 全部已有测试仍通过（Step1 后基线 480 + 本 Step 新增） |
| Step1 的 CRUD/连通性测试端点行为不受影响 | `AgentModelConfigServiceImplTest`/`AgentModelControllerTest` 不退化 |
| `sw.agent.enabled=true` 装配新增两个 Bean 不影响其他模块 | 全量 `mvn test` 通过即视为无副作用 |

## 14. 验收标准

| # | 验收标准 | 验证方式 |
|---|------|------|
| 1 | `ChatModelFactory` 能根据 `protocolType` 正确构造 `OpenAiChatModel`/`OllamaChatModel`，`baseUrl`/`modelName` 从配置正确传入 | 单元测试 1-2 |
| 2 | `protocolType` 为非法值时拒绝构造并抛出明确异常，不静默返回 null 或抛无信息异常 | 单元测试 3 |
| 3 | `temperature`/`maxTokens`/`topP`/`retryCount` 在构造出的 `ChatModel`/`RetryTemplate` 上真实生效（"动态装载"补齐） | 单元测试 4（或集成测试） + 代码审查 |
| 4 | `AgentGraphAutoConfiguration` 不再是空壳，声明 `chatModelFactory`、`agentCompiledGraph` 两个 Bean，装配成功 | `mvn test` 启动 Spring 上下文成功 |
| 5 | 最小 `StateGraph`（单节点 `callModel`，`START→callModel→END`）编译成功且能执行一次完整调用 | 单元测试 1-2 |
| 6 | 提供 `POST /agent/orchestration/run` 端点，权限码 `agent:orchestration:run`，输入配置 id + 用户文本，输出模型响应 | Controller 测试 + 集成测试 2 |
| 7 | 模型服务不可达/协议不支持时，端点返回 `success=false` + 非空 `errorMessage`，不抛 500 | 集成测试 3 + 单元测试 3 |
| 8 | 解密后的明文 API Key 不出现在日志、异常消息、任何 DTO 字段中 | 代码审查 + 集成测试 3 的 `errorMessage` 断言 |
| 9 | 不引入图定义 CRUD/持久化表、不引入工具调用相关类、不引入 checkpoint 相关类 | §13.1 静态检查全部命中预期 |
| 10 | 不新增 `sw_agent_` 前缀新表 | `git status` 确认无新增迁移脚本 |
| 11 | 不修改 Step1 产出的实体/Mapper/`AgentModelAutoConfiguration.java` | §13.1 静态检查确认无改动 |
| 12 | 不修改前端任何文件 | `git diff --stat` 确认 |
| 13 | `mvn -q compile` 零错误，`mvn -q test` BUILD SUCCESS，新增测试相对 Step1 后基线（480）继续增长，已有测试不退化 | 命令输出 |
| 14 | 权限码 `agent:orchestration:run` 与 Step1 已有三个权限码互不重叠，superAdmin 可绕过 | Controller 测试 |

## 15. 执行回执格式

按 system.md §7.1 标准 13 项结构产出执行回执，写入 `product/agent-model-orchestration/receipts/step-2-execution.md`。

特别注意回执中需包含：
- §9.0 现场确认的全部结果：`AgentStateFactory` 真实签名、图入边真实写法、`CompiledGraph.invoke()` 异常传播真实行为、`OpenAiChatOptions`/`OllamaOptions` Builder 真实 setter 名称、`OpenAiApi` 默认 `completionsPath`、`timeoutSeconds` 是否成功接入
- 本方案 §9 推测代码与实际落地代码的逐项差异说明（不得只说"有调整"，需列出具体不同点）
- `spring-ai-model` 传递依赖确认结果（§6 第 7 项）

## 16. 测试回执格式

按 system.md §7.2 标准 12 项结构产出测试回执，写入 `product/agent-model-orchestration/receipts/step-2-test.md`。

特别注意回执中需包含：
- 逐条对照 §14 全部 14 项验收标准
- mock HTTP 服务器实际收到的请求路径/请求体、返回的响应体结构摘录（用于证明 §6 第 9 项现场确认属实，非凑造）
- `retryCount` 生效验证的具体断言方式和结果

## 17. 明确禁止事项

- ❌ **禁止**实现工具调用/工具沙箱（内部白名单方法调用、外部白名单 HTTP 调用），包括不得引入 `@Tool`/`ToolCallback`/`MethodToolCallback` 任何代码，即使"顺手加一个示例工具"也不允许——推迟到 Step 3
- ❌ **禁止**实现图定义 CRUD、图可视化、图持久化表——图保持纯代码硬编码
- ❌ **禁止**新建任何 `sw_agent_` 前缀表（会话/消息/工具调用表）——归属留给规划层后续裁定
- ❌ **禁止**实现多轮对话/消息历史（`Channels.appender` 累积型 channel 不使用）
- ❌ **禁止**实现"多 Key 轮询""额度限流"
- ❌ **禁止**引入 `CompileConfig`/`BaseCheckpointSaver`/`FileSystemSaver`
- ❌ **禁止**修改 Step1 产出的任何文件（`AgentModelConfig`/`AgentModelConfigMapper`/`AgentModelConfigService(Impl)`/`AgentModelController`/`AgentModelAutoConfiguration`/Flyway 脚本）
- ❌ **禁止**为图节点数量或条件分支"凑数量"——最小图只需 1 个真实节点，不为了展示能力添加无意义节点
- ❌ **禁止**在任何日志、异常消息、DTO 字段中输出 API Key 明文
- ❌ **禁止**修改前端任何文件
- ❌ **禁止**新增 Maven 依赖
- ❌ **禁止**对 §5/§9 中标注"以现场确认结果为准"的任何细节直接照抄本方案的推测代码而不做实际验证
