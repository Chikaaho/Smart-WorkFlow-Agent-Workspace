# 探索任务：M07-Step3「工具沙箱」前置调研

**任务目标**：M07 Step2（LangGraph4j 编排执行引擎）已 PASSED，产出了最小单节点图——`AgentGraphFactory` 通过 ThreadLocal 动态绑定 `ChatModel`，`AgentOrchestrationServiceImpl` 负责 bind/invoke/clear 整个生命周期。Step3 目标是落地 D48 定义的**工具沙箱**：允许通过数据库配置两类工具调用——①**内部白名单方法调用**（调用仓库内指定 Spring bean 的指定方法）；②**外部白名单 HTTP 调用**（向配置表中登记的 URL 发起 HTTP 请求）——两类均须禁止 RCE（不允许调用任意类/方法/URL）。

仓库内 Spring AI 工具调用接口（`@Tool`/`ToolCallback`/`MethodToolCallback`）**零使用记录**（Step2 独立校验已确认），本任务需摸清：①LangGraph4j 如何感知并路由 tool_calls；②Spring AI 如何动态构造 ToolCallback；③仓库已有哪些可参照的白名单调用模式和 HTTP 客户端用法，为规划层起草 Step3 执行方案提供真实证据，禁止凑造签名。

---

**需要回答的问题**：

### 问题 1：LangGraph4j 1.5.14 的工具调用集成机制

jar 路径：`~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar`

- 是否存在 `ToolNode`（或任何包含"tool"/"Tool"关键字的节点类/工具类）？用 `jar tf` 枚举类清单，grep 含 tool/Tool 的类，列出完整类名。
- LangGraph4j 框架如何处理 ChatModel 返回的 `tool_calls`——是框架内置的"工具执行节点"自动拦截 + 回写消息，还是需要开发者自己定义一个节点（如 `ToolExecutorNode`）挂在 StateGraph 条件边上，手动解包 `tool_calls`、执行、再把结果追加到 `AgentState.messages`？用 javap 检查相关类（若存在），或若无任何工具相关类则明确标注"LangGraph4j 框架层不内置 ToolNode，工具执行完全由开发者节点实现"。
- Step2 已产出的 `AgentGraphFactory` 是单节点图（只有一个 LLM 调用节点，无条件边）。若 Step3 要支持 tool_calls，图至少需要增加什么结构（LLM 节点 → 条件边 → 工具执行节点 → 回 LLM 节点的循环，还是其他）？请基于上面 jar 探查到的真实 API 给出依据，不要基于"业界惯例"推断。

### 问题 2：Spring AI 1.0.4 ToolCallback 动态构造方式

jar 路径：`~/.m2/repository/org/springframework/ai/spring-ai-model-1.0.4.jar`，可能还需要 `spring-ai-client-chat-1.0.4.jar`

- `org.springframework.ai.tool` 包（或等价包路径）下的完整类清单（`jar tf` + grep）。
- `ToolCallback` 接口的完整方法列表（javap -p）：至少包含方法描述（`getToolDefinition()` 或 `getName()`/`getDescription()`/`getInputSchema()` 等）和执行方法（`call(String jsonArgs)` 或类似签名）。
- `FunctionToolCallback`（若存在）：是否有 Builder 或静态工厂方法支持运行时动态构造——即不依赖 `@Tool` 注解、直接用 lambda `Function<String, String>` 注册一个工具？给出 Builder 的关键 setter 方法列表（name/description/inputSchema/function）。若没有 `FunctionToolCallback` 而是其他等价类，给出真实类名和构造方式。
- `MethodToolCallback`（若存在）：构造函数完整签名（参数列表，尤其是接受 `java.lang.reflect.Method` 的参数位置）。
- `ToolCallingManager`（若存在）：其 `handleToolCalls()` 或等价方法签名；这个类是否设计为框架自动执行 tool_calls 并把结果追加回 `List<Message>`（免除开发者手写循环），还是仅做 registry/lookup？

### 问题 3：工具列表传入 ChatModel 的方式

jar：`spring-ai-client-chat-1.0.4.jar`，`spring-ai-openai-1.0.4.jar`

- `ChatOptions`（或 `OpenAiChatOptions`/`OllamaChatOptions`）是否有 `tools(List<ToolCallback>)` 或 `functions(Set<String>)` 类型的 setter/builder 方法？给出真实方法名和参数类型（javap）。
- `Prompt` 的构造函数中是否支持直接传入 tool 列表（除通过 `ChatOptions` 以外）？
- 若找到 `ToolCallingManager`，确认其调用链：是开发者在 ServiceImpl 里手动循环调 `manager.handleToolCalls()` 再拼 `Prompt`，还是 `ChatModel.call()` 内部自动委托给 `ToolCallingManager` 执行整个 tool-call 往返？（直接影响 Step3 ServiceImpl 需不需要自己写 agentic loop）

### 问题 4：SwJobBean 内部 handler 注册/调用先例（完整机制）

文件路径：
- `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/handler/JobHandler.java`
- `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/SwJobBean.java`
- `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/QuartzSchedulerService.java`（如相关）

完整回答下列细节：
- `JobHandler` 接口定义：是只有一个无参/有限参方法的接口，还是带参数传入（如何把任务参数传给 handler）？
- `SwJobBean`（或注册管理类）的 handlerMap 如何填充——是扫描 `ApplicationContext.getBeansOfType(JobHandler.class)` 自动发现，还是 handler 在 `@PostConstruct` 自我注册，还是需要在某个配置表/白名单中显式登记才会被加入 map？
- 调用侧（执行定时任务时）如何通过字符串 key（handler 名称？bean 名称？）取出 handler 并调用——直接 `map.get(key).execute()`，还是通过 `ApplicationContext.getBean(key)`？
- **安全边界**：有没有任何机制阻止"把 key 设为 `org.springframework.xxx` 之类的任意 Spring 内部 bean 名"？还是完全依赖 `getBeansOfType(JobHandler.class)` 的接口约束（即只要不实现 `JobHandler` 接口就查不到）？
- 参数传递：执行 handler 时如何把 job 的参数（字符串形式存在 DB）传入 handler？是否有 JSON 反序列化为具体类型的步骤？

### 问题 5：外部 HTTP 调用先例

文件路径（需读取）：
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImpl.java`（其中 `testConnection()` 方法）
- 全仓库其他 HTTP 客户端使用（`find Smart-WorkFlow/ -path '*/.claude*' -prune -o -type f -name "*.java" -print | xargs grep -l "RestTemplate\|WebClient\|HttpClient\|HttpURLConnection" 2>/dev/null`）

完整回答：
- `testConnection()` 的实现：用了哪个 HTTP 客户端类？如何设置超时（connectTimeout/readTimeout 各多少，从哪个字段读）？按 protocolType 的 URL 构造逻辑（openai 打 `/models`，ollama 打 `/api/tags`，other 打根路径）是否真实存在？2xx/4xx 判为"可达"，网络异常判为"不可达"，是如何区分的（status code 范围判断还是异常类型判断）？
- 全仓库除 BPM `ExternalDatasourceManager`（纯 JDBC）之外，是否还有其他"动态构造 HTTP 请求（URL/方法可配置）"的先例？若有，给出文件路径和关键实现摘要（HTTP 客户端、超时配置、错误处理）。若无，明确标注"仓库内 HTTP 先例仅 testConnection，无通用 HTTP 工具调用先例"。

### 问题 6：建表参考——Step1 V19 建表脚本 + JSON 字段类型惯例

文件路径（需读取）：
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql`
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V19__init_agent_model_config.sql`

Step3 需要新建至少两张工具配置表（内部工具定义表 + 外部工具定义表），表中可能需要存储 JSON 格式的参数 schema（描述工具入参的 JSON Schema 字符串）。需要回答：
- V19 两个脚本的完整内容（直接贴出）。
- 全仓库存储 JSON 结构体的字段（流程定义 XML、storage config JSON 等）用的是什么类型——重点检查 `sw-biz-form` 或 `sw-bpm` 的 Flyway 脚本（`find Smart-WorkFlow/sw-bootstrap -name "*.sql" | xargs grep -l "TEXT\|CLOB\|LONGTEXT\|json" 2>/dev/null`），给出使用 TEXT vs VARCHAR 的分布，以及 H2 和 PG 是否保持同类型。

---

**搜索范围**：
- `~/.m2/repository/org/bsc/langgraph4j/langgraph4j-core/1.5.14/langgraph4j-core-1.5.14.jar`（`jar tf` + `javap`）
- `~/.m2/repository/org/springframework/ai/spring-ai-model/1.0.4/spring-ai-model-1.0.4.jar`（`jar tf` + `javap`）
- `~/.m2/repository/org/springframework/ai/spring-ai-client-chat/1.0.4/spring-ai-client-chat-1.0.4.jar`（`jar tf` + `javap`）
- `~/.m2/repository/org/springframework/ai/spring-ai-openai/1.0.4/spring-ai-openai-1.0.4.jar`（问题 3 的 ChatOptions/Prompt 部分）
- `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/handler/JobHandler.java`
- `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/SwJobBean.java`
- `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/QuartzSchedulerService.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImpl.java`
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql`
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V19__init_agent_model_config.sql`
- `find Smart-WorkFlow/ -path '*/.claude*' -prune -o -type f -name "*.java" -print | xargs grep -l "RestTemplate\|WebClient\|HttpClient\|HttpURLConnection" 2>/dev/null`（全仓库 HTTP 客户端用法）
- `find Smart-WorkFlow/sw-bootstrap -name "*.sql" 2>/dev/null | xargs grep -l "TEXT\|CLOB\|LONGTEXT\|json" 2>/dev/null`（JSON 字段建表惯例）

**禁止范围**：
- 不得修改任何文件
- 不得运行 `mvn compile`/`mvn test` 等触发编译的命令（可用 `jar tf`/`javap`/`find`/`grep`/文件读取）
- 不得对 Step3 的具体实现方案做设计建议，只汇报"库真实支持什么、仓库已有什么可参照"，设计决策由规划层做
- 若某 jar 中确实不存在某类/方法，明确标注"不存在"，不得以训练记忆补填

**预期证据**：
- 每个问题均有具体 jar 路径 + 类名/方法签名，或文件路径 + 关键代码摘录
- 问题 1 的 LangGraph4j ToolNode 存在性：给出 `jar tf` grep 原始输出（有还是没有）
- 问题 2 的 ToolCallback 接口方法列表：javap 原始输出片段
- 问题 4 的 SwJobBean 安全边界：明确说明有无接口约束以外的额外白名单机制
- 问题 5 的 testConnection HTTP 客户端：具体类名 + 超时配置行号

**完成标准**：6 个问题均有明确答案或明确标注"未找到/不存在"（含具体原因），证据可追溯到具体 jar 类名或文件行号。

**执行模型**：`deepseek/deepseek-v4-pro`（需理解 Spring AI 工具调用 API 语义和 LangGraph4j 与 ToolCallback 的集成方式，属语义判断类调研，用 pro）

**失败处理**：若 LangGraph4j 确实无内置 ToolNode（开发者须自己写工具执行节点），如实说明并给出图拓扑的必要最小变化；若 Spring AI 动态构造 ToolCallback 的方式与"典型 @Tool 注解用法"差异较大（例如只能通过 `FunctionCallback` 而非 `MethodToolCallback`），如实描述真实路径，不得为了让方案看起来简洁而省略。

**回执位置**：`search_fallback/m07-step3-toolsandbox-precedent.md`
